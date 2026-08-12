import datetime
import json
import mimetypes
import os
import re
import ssl
import time
import urllib.parse
import urllib.request
from datetime import date, timedelta
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parent
HOST = os.environ.get("HOST", "0.0.0.0")
PORT = int(os.environ.get("PORT", "8769"))

# 建立免驗證 SSL Context (防止 Python 存取政府 OpenData 時因為系統憑證缺失而報錯)
ssl_ctx = ssl.create_default_context()
ssl_ctx.check_hostname = False
ssl_ctx.verify_mode = ssl.CERT_NONE


def month_range(start_date, end_date):
    current = date(start_date.year, start_date.month, 1)
    last = date(end_date.year, end_date.month, 1)
    while current <= last:
        yield current
        if current.month == 12:
            current = date(current.year + 1, 1, 1)
        else:
            current = date(current.month + 1, 1, 1)


def parse_twse_date(value):
    parts = value.split("/")
    if len(parts) != 3:
        raise ValueError(f"Invalid TWSE date: {value}")
    year = int(parts[0]) + 1911
    return f"{year:04d}-{int(parts[1]):02d}-{int(parts[2]):02d}"


def parse_number(value):
    cleaned = str(value).replace(",", "").strip()
    if cleaned in {"", "--", "X", "除權息", "None", "null"}:
        return None
    try:
        return float(cleaned)
    except ValueError:
        return None


def parse_num_to_sheets(val):
    """把數字轉為整數「張數」（自動將股數除以 1000 換算）"""
    n = parse_number(val)
    if n is None:
        return 0
    # 若絕對值 >= 500，代表單位是「股」，除以 1000 換算為「張」
    return int(round(n / 1000.0)) if abs(n) >= 500 else int(round(n))


def normalize_yahoo_symbol(raw_symbol, market):
    sym = raw_symbol.strip().upper()
    if "." in sym:
        return sym
    if re.match(r"^\d+$", sym):
        if market == "two":
            return f"{sym}.TWO"
        return f"{sym}.TW"
    return sym


# ---------------------------------------------------------
# 💡 升級版：三大法人籌碼抓取 (OpenData 官方免封鎖 API)
# ---------------------------------------------------------
def fetch_twse_openapi(symbol_code):
    """【上市股票】直接存取 TWSE 官方 OpenData API (不被擋 IP，穩定快速)"""
    url = "https://openapi.twse.com.tw/v1/fund/T86Daily"
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
            "Accept": "application/json",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=6, context=ssl_ctx) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            for item in data:
                code = str(
                    item.get("Code", "") or item.get("SecuritiesCode", "")
                ).strip()
                if code == symbol_code:
                    foreign = parse_num_to_sheets(
                        item.get("ForeignInvestorsBuySell", 0)
                    )
                    trust = parse_num_to_sheets(
                        item.get("InvestmentTrustBuySell", 0)
                    )
                    dealer = parse_num_to_sheets(
                        item.get("DealerBuySell", 0)
                    )
                    total = parse_num_to_sheets(
                        item.get("TotalDifference", 0)
                    )

                    if total == 0 and (
                        foreign != 0 or trust != 0 or dealer != 0
                    ):
                        total = foreign + trust + dealer

                    date_raw = str(item.get("Date", ""))
                    if len(date_raw) == 8:
                        formatted_date = f"{date_raw[:4]}-{date_raw[4:6]}-{date_raw[6:]}"
                    else:
                        formatted_date = (
                            datetime.date.today().strftime("%Y-%m-%d")
                        )

                    return {
                        "date": formatted_date,
                        "foreign": foreign,
                        "trust": trust,
                        "dealer": dealer,
                        "total": total,
                    }
    except Exception as e:
        print(f"💡 TWSE OpenData 存取跳過: {e}")
    return None


def fetch_tpex_openapi(symbol_code):
    """【上櫃股票】直接存取 TPEx 櫃買中心 OpenData API"""
    url = "https://www.tpex.org.tw/openapi/v1/tpex_mainboard_daily_trading_institutional_investors"
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
            "Accept": "application/json",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=6, context=ssl_ctx) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            for item in data:
                code = str(
                    item.get("SecuritiesCompanyCode", "")
                    or item.get("Code", "")
                    or item.get("SecuritiesCode", "")
                ).strip()

                if code == symbol_code:
                    foreign = parse_num_to_sheets(
                        item.get("ForeignInvestorBuySell", 0)
                    )
                    trust = parse_num_to_sheets(
                        item.get("InvestmentTrustBuySell", 0)
                    )
                    dealer = parse_num_to_sheets(
                        item.get("DealerBuySell", 0)
                    )
                    total = parse_num_to_sheets(
                        item.get("TotalBuySell", 0)
                    )

                    if total == 0 and (
                        foreign != 0 or trust != 0 or dealer != 0
                    ):
                        total = foreign + trust + dealer

                    date_raw = str(item.get("Date", ""))
                    return {
                        "date": date_raw or "最近交易日",
                        "foreign": foreign,
                        "trust": trust,
                        "dealer": dealer,
                        "total": total,
                    }
    except Exception as e:
        print(f"💡 TPEx OpenData 存取跳過: {e}")
    return None


def fetch_chip_data(raw_symbol):
    """三大法人籌碼總入口 (自動判別上市/上櫃，永久解決抓不到資料的問題)"""
    symbol_code = raw_symbol.split(".")[0].strip().upper()
    print(f"📡 正在查詢 [{symbol_code}] 最新三大法人盤後籌碼...")

    # 1. 優先嘗試 TWSE 上市股票 OpenData
    res = fetch_twse_openapi(symbol_code)
    if res:
        print(
            f"✅ [上市成功] {symbol_code} ({res['date']}): 外資 {res['foreign']}張 | 投信 {res['trust']}張 | 三大法人 {res['total']}張"
        )
        return res

    # 2. 嘗試 TPEx 上櫃股票 OpenData
    res = fetch_tpex_openapi(symbol_code)
    if res:
        print(
            f"✅ [上櫃成功] {symbol_code} ({res['date']}): 外資 {res['foreign']}張 | 投信 {res['trust']}張 | 三大法人 {res['total']}張"
        )
        return res

    print(f"❌ [{symbol_code}] 未查獲籌碼資料 (可能非台股標的或代碼錯誤)")
    return None


# ---------------------------------------------------------
# Yahoo Finance 歷史股價抓取 logic
# ---------------------------------------------------------
def fetch_yahoo_symbol_with_retry(raw_symbol, market, years_str):
    try:
        years = float(years_str)
    except ValueError:
        years = 3.5

    sym = raw_symbol.strip().upper()
    symbols_to_try = []

    if "." in sym:
        symbols_to_try.append(sym)
    elif re.match(r"^\d+$", sym):
        if market == "two":
            symbols_to_try = [f"{sym}.TWO", f"{sym}.TW"]
        else:
            symbols_to_try = [f"{sym}.TW", f"{sym}.TWO"]
    else:
        symbols_to_try.append(sym)

    last_exception = None
    for yahoo_symbol in symbols_to_try:
        try:
            end_dt = date.today()
            start_dt = end_dt - timedelta(days=int((years + 0.6) * 365))
            period1 = int(time.mktime(start_dt.timetuple()))
            period2 = int(time.mktime(end_dt.timetuple()))

            url = f"https://query1.finance.yahoo.com/v8/finance/chart/{yahoo_symbol}?period1={period1}&period2={period2}&interval=1d"
            req = urllib.request.Request(
                url,
                headers={
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
                },
            )

            with urllib.request.urlopen(req, context=ssl_ctx) as response:
                res_data = json.loads(response.read().decode("utf-8"))

            chart_data = res_data.get("chart", {}).get("result", [])
            if not chart_data:
                raise ValueError("Yahoo Finance 回傳空資料")

            result = chart_data[0]
            timestamps = result.get("timestamp", [])

            meta = result.get("meta", {})
            regular_market_price = meta.get("regularMarketPrice")

            quote_indicators = (
                result.get("indicators", {}).get("quote", [{}])[0]
            )
            raw_closes = quote_indicators.get("close", [])

            adj_indicators = (
                result.get("indicators", {}).get("adjclose", [{}])[0]
            )
            adj_closes = adj_indicators.get("adjclose", [])

            if not adj_closes:
                adj_closes = raw_closes
            if not raw_closes:
                raw_closes = adj_closes

            rows = []
            for t, rc, ac in zip(timestamps, raw_closes, adj_closes):
                if t is not None:
                    valid_adj = ac if ac is not None else rc
                    valid_raw = rc if rc is not None else ac

                    if valid_adj is not None and valid_raw is not None:
                        dt_str = date.fromtimestamp(t).isoformat()
                        rows.append(
                            {
                                "date": dt_str,
                                "close": float(valid_adj),
                                "raw_close": float(valid_raw),
                            }
                        )

            if rows and regular_market_price is not None:
                latest_raw = float(regular_market_price)
                last_raw = rows[-1]["raw_close"]

                if last_raw > 0:
                    ratio = latest_raw / last_raw
                    rows[-1]["raw_close"] = latest_raw
                    rows[-1]["close"] = round(rows[-1]["close"] * ratio, 2)

            if not rows:
                raise ValueError("解析後無有效收盤價歷史紀錄")

            return yahoo_symbol, rows

        except Exception as e:
            last_exception = e
            print(
                f"嘗試抓取 {yahoo_symbol} 失敗，準備嘗試下一個可能性... 錯誤: {e}"
            )
            continue

    raise last_exception or ValueError("無法從 Yahoo Finance 取得任何資料")


class Handler(BaseHTTPRequestHandler):

    def send_json(self, status, data):
        content = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header(
            "Cache-Control", "no-cache, no-store, must-revalidate"
        )
        self.send_header("Content-Length", str(len(content)))
        self.end_headers()
        self.wfile.write(content)

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)

        # 1. 股價 API
        if parsed.path == "/api/yahoo":
            query = urllib.parse.parse_qs(parsed.query)
            raw_symbol = query.get("symbol", [""])[0]
            market = query.get("market", ["tw"])[0]
            years = query.get("years", ["3.5"])[0]
            try:
                actual_symbol, data = fetch_yahoo_symbol_with_retry(
                    raw_symbol, market, years
                )
                self.send_json(
                    200,
                    {
                        "symbol": actual_symbol,
                        "source": "Yahoo Finance",
                        "rows": data,
                    },
                )
            except Exception as exc:
                self.send_json(400, {"error": str(exc)})
            return

        # 2. 三大法人籌碼 API
        if parsed.path == "/api/chip":
            query = urllib.parse.parse_qs(parsed.query)
            raw_symbol = query.get("symbol", [""])[0]
            chip_data = fetch_chip_data(raw_symbol)
            if chip_data:
                self.send_json(200, chip_data)
            else:
                self.send_json(
                    200, {"error": "尚未發布盤後籌碼或非台股標的"}
                )
            return

        # 3. 靜態檔案處理
        target = parsed.path.lstrip("/") or "index.html"
        file_path = (ROOT / target).resolve()
        if not str(file_path).startswith(str(ROOT)) or not file_path.is_file():
            self.send_error(404)
            return

        content_type = (
            mimetypes.guess_type(file_path.name)[0] or "application/octet-stream"
        )
        content = file_path.read_bytes()
        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(content)))
        self.end_headers()
        self.wfile.write(content)

    def log_message(self, format, *args):
        print(f"{self.address_string()} - {format % args}")


if __name__ == "__main__":
    server = ThreadingHTTPServer((HOST, PORT), Handler)
    print(f"🚀 LOHAS Stock Server Started at http://{HOST}:{PORT}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    server.server_close()