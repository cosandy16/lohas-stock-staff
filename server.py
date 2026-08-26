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

# 建立免驗證 SSL Context (避免 Render 的 Linux 環境存取政府/外部 API 時因憑證缺失報錯)
ssl_ctx = ssl.create_default_context()
ssl_ctx.check_hostname = False
ssl_ctx.verify_mode = ssl.CERT_NONE


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
    return int(round(n / 1000.0)) if abs(n) >= 500 else int(round(n))


# ---------------------------------------------------------
# 🌐 FinMind API：專為 Render / 國外雲端主機設計 (免擋 IP)
# ---------------------------------------------------------
def fetch_finmind_chip(symbol_code):
    """從 FinMind API 讀取三大法人籌碼 (含買進/賣出細節)"""
    today = datetime.date.today()
    start_date = (today - datetime.timedelta(days=10)).strftime("%Y-%m-%d")
    url = f"https://api.finmindtrade.com/api/v4/data?dataset=TaiwanStockInstitutionalInvestorsBuySell&data_id={symbol_code}&start_date={start_date}"

    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
            "Accept": "application/json",
        },
    )

    try:
        with urllib.request.urlopen(req, timeout=8, context=ssl_ctx) as resp:
            res_data = json.loads(resp.read().decode("utf-8"))

        data_list = res_data.get("data", [])
        if not data_list:
            return None

        # 依日期彙整三大法人買進與賣出張數 (單位為股)
        by_date = {}
        for row in data_list:
            d = row.get("date")
            name = str(row.get("name", ""))
            buy = row.get("buy", 0) or 0
            sell = row.get("sell", 0) or 0

            if d not in by_date:
                by_date[d] = {
                    "foreign_buy": 0,
                    "foreign_sell": 0,
                    "trust_buy": 0,
                    "trust_sell": 0,
                    "dealer_buy": 0,
                    "dealer_sell": 0,
                }

            if "Foreign" in name or "外資" in name:
                by_date[d]["foreign_buy"] += buy
                by_date[d]["foreign_sell"] += sell
            elif "Trust" in name or "投信" in name:
                by_date[d]["trust_buy"] += buy
                by_date[d]["trust_sell"] += sell
            elif "Dealer" in name or "自營" in name:
                by_date[d]["dealer_buy"] += buy
                by_date[d]["dealer_sell"] += sell

        if not by_date:
            return None

        # 取得最新的交易日籌碼
        latest_date = sorted(by_date.keys())[-1]
        chip = by_date[latest_date]

        # 換算為張數 (除以 1000)
        f_buy = int(round(chip["foreign_buy"] / 1000.0))
        f_sell = int(round(chip["foreign_sell"] / 1000.0))
        t_buy = int(round(chip["trust_buy"] / 1000.0))
        t_sell = int(round(chip["trust_sell"] / 1000.0))
        d_buy = int(round(chip["dealer_buy"] / 1000.0))
        d_sell = int(round(chip["dealer_sell"] / 1000.0))

        f_diff = f_buy - f_sell
        t_diff = t_buy - t_sell
        d_diff = d_buy - d_sell

        return {
            "date": latest_date,
            "foreign": f_diff,
            "foreign_buy": f_buy,
            "foreign_sell": f_sell,
            "trust": t_diff,
            "trust_buy": t_buy,
            "trust_sell": t_sell,
            "dealer": d_diff,
            "dealer_buy": d_buy,
            "dealer_sell": d_sell,
            "total": f_diff + t_diff + d_diff,
        }
    except Exception as e:
        print(f"⚠️ FinMind API 擷取失敗: {e}")
    return None


# ---------------------------------------------------------
# 🏛️ TWSE / TPEx OpenData API (備援)
# ---------------------------------------------------------
def fetch_twse_openapi(symbol_code):
    url = "https://openapi.twse.com.tw/v1/fund/T86Daily"
    req = urllib.request.Request(
        url, headers={"User-Agent": "Mozilla/5.0", "Accept": "application/json"}
    )
    try:
        with urllib.request.urlopen(req, timeout=5, context=ssl_ctx) as resp:
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
                    dealer = parse_num_to_sheets(item.get("DealerBuySell", 0))
                    total = parse_num_to_sheets(item.get("TotalDifference", 0))

                    if total == 0 and (
                        foreign != 0 or trust != 0 or dealer != 0
                    ):
                        total = foreign + trust + dealer

                    date_raw = str(item.get("Date", ""))
                    formatted_date = (
                        f"{date_raw[:4]}-{date_raw[4:6]}-{date_raw[6:]}"
                        if len(date_raw) == 8
                        else datetime.date.today().strftime("%Y-%m-%d")
                    )

                    return {
                        "date": formatted_date,
                        "foreign": foreign,
                        "foreign_buy": 0,
                        "foreign_sell": 0,
                        "trust": trust,
                        "trust_buy": 0,
                        "trust_sell": 0,
                        "dealer": dealer,
                        "dealer_buy": 0,
                        "dealer_sell": 0,
                        "total": total,
                    }
    except Exception as e:
        print(f"💡 TWSE OpenData 跳過: {e}")
    return None


def fetch_chip_data(raw_symbol):
    """三大法人籌碼總入口 (雙軌備援，適應 Render 雲端環境)"""
    symbol_code = raw_symbol.split(".")[0].strip().upper()
    print(f"📡 [Render Cloud] 正在查詢 [{symbol_code}] 最新三大法人盤後籌碼...")

    # 1. 首選：FinMind API (對 Render 等海外雲端 IP 極度友善)
    res = fetch_finmind_chip(symbol_code)
    if res:
        print(
            f"✅ [FinMind 成功] {symbol_code} ({res['date']}): 外資 {res['foreign']}張 | 投信 {res['trust']}張 | 三大法人 {res['total']}張"
        )
        return res

    # 2. 備援：TWSE 官方 OpenData
    res = fetch_twse_openapi(symbol_code)
    if res:
        print(
            f"✅ [TWSE OpenData 成功] {symbol_code} ({res['date']}): 外資 {res['foreign']}張 | 投信 {res['trust']}張 | 三大法人 {res['total']}張"
        )
        return res

    print(f"❌ [{symbol_code}] 無法取得籌碼資料 (可能非台股或已被防火牆阻擋)")
    return None


# ---------------------------------------------------------
# Yahoo Finance 歷史股價抓取
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

            with urllib.request.urlopen(
                req, timeout=10, context=ssl_ctx
            ) as response:
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
    print(f"🚀 Render Cloud Stock Server Started on Port {PORT}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    server.server_close()