# ==========================================
# 樂活通道 / 均線通道 / 五線譜 / 股票觀察清單 後端伺服器 (server.py)
# ==========================================
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

# 建立免驗證 SSL Context
ssl_ctx = ssl.create_default_context()
ssl_ctx.check_hostname = False
ssl_ctx.verify_mode = ssl.CERT_NONE

STOCK_NAME_MAP = {}

def update_stock_names_from_api():
    global STOCK_NAME_MAP
    new_map = {}
    twse_urls = [
        "https://openapi.twse.com.tw/v1/exchangeReport/BWIBBU_ALL",
        "https://openapi.twse.com.tw/v1/exchangeReport/STOCK_DAY_ALL",
        "https://openapi.twse.com.tw/v1/opendata/t187ap03_L"
    ]
    for twse_url in twse_urls:
        try:
            req = urllib.request.Request(twse_url, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req, timeout=8, context=ssl_ctx) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                for item in data:
                    code = (item.get("Code") or item.get("SecuritiesCode") or item.get("公司代號") or item.get("證券代號") or "").strip()
                    name = (item.get("Name") or item.get("SecuritiesName") or item.get("公司簡稱") or item.get("證券名稱") or "").strip()
                    if code and name:
                        new_map[code] = name
        except Exception:
            pass

    tpex_urls = [
        "https://www.tpex.org.tw/openapi/v1/tpex_mainboard_quotes",
        "https://www.tpex.org.tw/openapi/v1/mops_all_01",
        "https://www.tpex.org.tw/openapi/v1/tpex_mainboard_daily_quotes"
    ]
    for tpex_url in tpex_urls:
        try:
            req = urllib.request.Request(tpex_url, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req, timeout=8, context=ssl_ctx) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                for item in data:
                    code = (item.get("SecuritiesCompanyCode") or item.get("SecuritiesCode") or item.get("CompanyCode") or item.get("代號") or "").strip()
                    name = (item.get("CompanyName") or item.get("CompanyAbbreviation") or item.get("SecuritiesName") or item.get("名稱") or "").strip()
                    if code and name:
                        new_map[code] = name
        except Exception:
            pass

    if new_map:
        STOCK_NAME_MAP = new_map

def fetch_single_tpex_name(symbol_code):
    try:
        url = f"https://www.tpex.org.tw/web/stock/aftertrading/otc_quotes_summary1/stk_summary_result.php?l=zh-tw&stkno={symbol_code}"
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=4, context=ssl_ctx) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            aa_data = data.get("aaData", [])
            if aa_data and len(aa_data[0]) > 1:
                return aa_data[0][1].strip()
    except Exception:
        pass
    return None

def parse_number(value):
    cleaned = str(value).replace(",", "").strip()
    if cleaned in {"", "--", "X", "除權息", "None", "null"}:
        return None
    try:
        return float(cleaned)
    except ValueError:
        return None

def parse_num_to_sheets(val):
    n = parse_number(val)
    if n is None:
        return 0
    return int(round(n / 1000.0)) if abs(n) >= 500 else int(round(n))

def clean_stock_name(raw_name):
    if not raw_name: return ""
    name = str(raw_name).strip()
    name = re.sub(r'(股份有限公司|有限公司|股份公司)$', '', name)
    name = re.sub(r'\b(SECURITIES|INVESTMENT|INVT|TRUST|TST|CORPORATION|CORP|LIMITED|LTD|HOLDINGS|INC|CO)\b', '', name, flags=re.IGNORECASE)
    name = " ".join(name.split())
    return name[:10] if len(name) > 10 else name

def fetch_chip_data(raw_symbol):
    symbol_code = raw_symbol.split(".")[0].strip().upper()
    # 簡化籌碼備援，維持基本功能
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
        symbols_to_try = [f"{sym}.TWO", f"{sym}.TW"] if market == "two" else [f"{sym}.TW", f"{sym}.TWO"]
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
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})

            with urllib.request.urlopen(req, timeout=10, context=ssl_ctx) as response:
                res_data = json.loads(response.read().decode("utf-8"))

            chart_data = res_data.get("chart", {}).get("result", [])
            if not chart_data: raise ValueError("Yahoo 結點空資料")

            result = chart_data[0]
            timestamps = result.get("timestamp", [])
            meta = result.get("meta", {})
            regular_market_price = meta.get("regularMarketPrice")
            previous_close = meta.get("chartPreviousClose") or meta.get("previousClose")

            quote_indicators = result.get("indicators", {}).get("quote", [{}])[0]
            raw_closes = quote_indicators.get("close", [])

            rows = []
            for t, rc in zip(timestamps, raw_closes):
                if t is not None and rc is not None:
                    dt_str = date.fromtimestamp(t).isoformat()
                    rows.append({
                        "date": dt_str,
                        "close": float(rc),
                        "raw_close": float(rc)
                    })

            if rows and regular_market_price is not None:
                rows[-1]["close"] = float(regular_market_price)
                rows[-1]["raw_close"] = float(regular_market_price)

            if len(rows) >= 2 and previous_close is not None:
                rows[-2]["close"] = float(previous_close)
                rows[-2]["raw_close"] = float(previous_close)

            if not rows: raise ValueError("無有效收盤價")

            clean_code = yahoo_symbol.split(".")[0].strip()
            stock_name = STOCK_NAME_MAP.get(clean_code) or meta.get("shortName") or clean_code

            return yahoo_symbol, rows, clean_stock_name(stock_name)
        except Exception as e:
            last_exception = e
            continue

    raise last_exception or ValueError("無法取得 Yahoo 資料")

class Handler(BaseHTTPRequestHandler):
    def send_json(self, status, data):
        content = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(content)))
        self.end_headers()
        self.wfile.write(content)

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path == "/api/names":
            self.send_json(200, STOCK_NAME_MAP)
            return
        if parsed.path == "/api/yahoo":
            query = urllib.parse.parse_qs(parsed.query)
            try:
                actual_symbol, data, stock_name = fetch_yahoo_symbol_with_retry(
                    query.get("symbol", [""])[0], query.get("market", ["tw"])[0], query.get("years", ["3.5"])[0]
                )
                self.send_json(200, {"symbol": actual_symbol, "name": stock_name, "rows": data})
            except Exception as exc:
                self.send_json(400, {"error": str(exc)})
            return
        if parsed.path == "/api/chip":
            self.send_json(200, {"error": "略過"})
            return

        target = parsed.path.lstrip("/") or "index.html"
        file_path = (ROOT / target).resolve()
        if not str(file_path).startswith(str(ROOT)) or not file_path.is_file():
            self.send_error(404)
            return
        content = file_path.read_bytes()
        self.send_response(200)
        self.send_header("Content-Type", mimetypes.guess_type(file_path.name)[0] or "application/octet-stream")
        self.end_headers()
        self.wfile.write(content)

if __name__ == "__main__":
    update_stock_names_from_api()
    server = ThreadingHTTPServer((HOST, PORT), Handler)
    print(f"🚀 Server running on port {PORT}")
    server.serve_forever()