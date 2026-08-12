import json
import mimetypes
import os
import re
import time
import urllib.parse
import urllib.request
from datetime import date, timedelta
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.error import HTTPError

ROOT = Path(__file__).resolve().parent
HOST = os.environ.get("HOST", "0.0.0.0")
PORT = int(os.environ.get("PORT", "8769"))


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
    if cleaned in {"", "--", "X", "除權息"}:
        return None
    try:
        return float(cleaned)
    except ValueError:
        return None


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
# 💡 新增：三大法人籌碼抓取 logic (支援上市 TWSE & 上櫃 TPEx)
# ---------------------------------------------------------
def fetch_twse_chip(symbol_code, target_date):
    """從證交所 API (TWSE) 抓取上市股票籌碼"""
    date_str = target_date.strftime("%Y%m%d")
    url = f"https://www.twse.com.tw/rwd/zh/fund/T86?response=json&date={date_str}&selectType=ALLBUT0999"
    req = urllib.request.Request(
        url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
    )
    try:
        with urllib.request.urlopen(req, timeout=4) as response:
            res_data = json.loads(response.read().decode("utf-8"))
        if res_data.get("stat") == "OK" and "data" in res_data:
            fields = res_data.get("fields", [])
            field_map = {f.strip(): idx for idx, f in enumerate(fields)}

            for row in res_data["data"]:
                if row[0].strip() == symbol_code:

                    def get_num(keywords):
                        for kw in keywords:
                            for f_name, idx in field_map.items():
                                if kw in f_name:
                                    val = parse_number(str(row[idx]))
                                    if val is not None:
                                        return int(round(val / 1000.0))
                        return 0

                    foreign = get_num(
                        [
                            "外陸資買賣超股數(不含外資自營商)",
                            "外陸資買賣超股數",
                            "外資買賣超",
                        ]
                    )
                    trust = get_num(["投信買賣超股數"])
                    dealer = get_num(["自營商買賣超股數(合計)", "自營商買賣超股數"])
                    total = get_num(["三大法人買賣超股數合計", "三大法人買賣超股數"])

                    if total == 0 and (
                        foreign != 0 or trust != 0 or dealer != 0
                    ):
                        total = foreign + trust + dealer

                    return {
                        "date": f"{date_str[:4]}-{date_str[4:6]}-{date_str[6:]}",
                        "foreign": foreign,
                        "trust": trust,
                        "dealer": dealer,
                        "total": total,
                    }
    except Exception:
        pass
    return None


def fetch_tpex_chip(symbol_code, target_date):
    """從櫃買中心 API (TPEx) 抓取上櫃股票籌碼"""
    roc_year = target_date.year - 1911
    roc_date_str = f"{roc_year}/{target_date.month:02d}/{target_date.day:02d}"
    url = f"https://www.tpex.org.tw/web/stock/33insti/daily_trade/33itrade_hedge_result.php?l=zh-tw&o=json&se=EW&t=D&d={roc_date_str}&s=0,asc"
    req = urllib.request.Request(
        url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
    )
    try:
        with urllib.request.urlopen(req, timeout=4) as response:
            res_data = json.loads(response.read().decode("utf-8"))

        aaData = res_data.get("aaData", [])
        for row in aaData:
            if len(row) > 1 and row[0].strip() == symbol_code:

                def p_val(idx):
                    if idx < len(row):
                        v = parse_number(str(row[idx]))
                        if v is not None:
                            return (
                                int(round(v / 1000.0))
                                if abs(v) > 500
                                else int(round(v))
                            )
                    return 0

                foreign = p_val(10)
                trust = p_val(13)
                dealer = p_val(22)
                total = (
                    p_val(23)
                    if len(row) > 23
                    else (foreign + trust + dealer)
                )

                return {
                    "date": target_date.strftime("%Y-%m-%d"),
                    "foreign": foreign,
                    "trust": trust,
                    "dealer": dealer,
                    "total": total,
                }
    except Exception:
        pass
    return None


def fetch_chip_data(raw_symbol):
    """自動推算最近交易日並搜尋上市或上櫃籌碼"""
    symbol_code = raw_symbol.split(".")[0].strip().upper()
    today = date.today()

    # 自動往前尋找最近 7 天內有發布籌碼的交易日
    for i in range(7):
        target_date = today - timedelta(days=i)
        if target_date.weekday() >= 5:  # 跳過週末
            continue

        # 1. 先試上市 (TWSE)
        res = fetch_twse_chip(symbol_code, target_date)
        if res:
            return res

        # 2. 再試上櫃 (TPEx)
        res = fetch_tpex_chip(symbol_code, target_date)
        if res:
            return res

    return None


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
                url, headers={"User-Agent": "Mozilla/5.0"}
            )

            with urllib.request.urlopen(req) as response:
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
        content = json.dumps(data).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
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

        # 2. 💡 新增：三大法人籌碼 API
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
    print(f"LOHAS Stock Staff Server started at http://{HOST}:{PORT}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    server.server_close()