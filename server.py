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
        except Exception as e:
            print(f"⚠️ [TWSE API] 下載上市清單失敗: {e}")

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
                    code = (item.get("SecuritiesCompanyCode") or item.get("SecuritiesCode") or item.get("CompanyCode") or item.get("代號") or item.get("股票代號") or "").strip()
                    name = (item.get("CompanyName") or item.get("CompanyAbbreviation") or item.get("SecuritiesName") or item.get("名稱") or item.get("股票名稱") or "").strip()
                    if code and name:
                        new_map[code] = name
        except Exception as e:
            print(f"⚠️ [TPEx API] 下載上櫃清單失敗: {e}")

    if new_map:
        STOCK_NAME_MAP = new_map
        print(f"🎉 全局股票名稱字典更新完成，總計 {len(STOCK_NAME_MAP)} 檔標的")

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
    if not raw_name:
        return ""
    name = str(raw_name).strip()
    name = re.sub(r'(股份有限公司|有限公司|股份公司)$', '', name)
    name = re.sub(r'\b(SECURITIES|INVESTMENT|INVT|TRUST|TST|CORPORATION|CORP|LIMITED|LTD|HOLDINGS|INC|CO)\b', '', name, flags=re.IGNORECASE)
    name = re.sub(r'[-.,_]+', ' ', name)
    name = " ".join(name.split())
    if len(name) > 10:
        name = name[:10]
    return name

def fetch_finmind_chip(symbol_code):
    today = datetime.date.today()
    start_date = (today - datetime.timedelta(days=15)).strftime("%Y-%m-%d")
    url = f"https://api.finmindtrade.com/api/v4/data?dataset=TaiwanStockInstitutionalInvestorsBuySell&data_id={symbol_code}&start_date={start_date}"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0", "Accept": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=8, context=ssl_ctx) as resp:
            res_data = json.loads(resp.read().decode("utf-8"))
        data_list = res_data.get("data", [])
        if not data_list:
            return None
        by_date = {}
        for row in data_list:
            d = row.get("date")
            name = str(row.get("name", ""))
            buy = row.get("buy", 0) or 0
            sell = row.get("sell", 0) or 0
            if d not in by_date:
                by_date[d] = {"foreign_buy": 0, "foreign_sell": 0, "trust_buy": 0, "trust_sell": 0, "dealer_buy": 0, "dealer_sell": 0}
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
        latest_date = sorted(by_date.keys())[-1]
        chip = by_date[latest_date]
        f_diff = int(round((chip["foreign_buy"] - chip["foreign_sell"]) / 1000.0))
        t_diff = int(round((chip["trust_buy"] - chip["trust_sell"]) / 1000.0))
        d_diff = int(round((chip["dealer_buy"] - chip["dealer_sell"]) / 1000.0))
        return {
            "date": latest_date,
            "foreign": f_diff, "foreign_buy": int(round(chip["foreign_buy"]/1000)), "foreign_sell": int(round(chip["foreign_sell"]/1000)),
            "trust": t_diff, "trust_buy": int(round(chip["trust_buy"]/1000)), "trust_sell": int(round(chip["trust_sell"]/1000)),
            "dealer": d_diff, "dealer_buy": int(round(chip["dealer_buy"]/1000)), "dealer_sell": int(round(chip["dealer_sell"]/1000)),
            "total": f_diff + t_diff + d_diff,
        }
    except Exception:
        pass
    return None

def fetch_twse_openapi(symbol_code):
    url = "https://openapi.twse.com.tw/v1/fund/T86Daily"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0", "Accept": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=5, context=ssl_ctx) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            for item in data:
                code = str(item.get("Code", "") or item.get("SecuritiesCode", "")).strip()
                if code == symbol_code:
                    foreign = parse_num_to_sheets(item.get("ForeignInvestorsBuySell", 0))
                    trust = parse_num_to_sheets(item.get("InvestmentTrustBuySell", 0))
                    dealer = parse_num_to_sheets(item.get("DealerBuySell", 0))
                    total = parse_num_to_sheets(item.get("TotalDifference", 0))
                    if total == 0: total = foreign + trust + dealer
                    date_raw = str(item.get("Date", ""))
                    formatted_date = f"{date_raw[:4]}-{date_raw[4:6]}-{date_raw[6:]}" if len(date_raw) == 8 else datetime.date.today().strftime("%Y-%m-%d")
                    return {"date": formatted_date, "foreign": foreign, "trust": trust, "dealer": dealer, "total": total}
    except Exception:
        pass
    return None

def fetch_tpex_openapi(symbol_code):
    url = "https://www.tpex.org.tw/openapi/v1/tpex_mainboard_daily_quotes"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0", "Accept": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=5, context=ssl_ctx) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            for item in data:
                code = str(item.get("SecuritiesCompanyCode", "") or item.get("SecuritiesCode", "")).strip()
                if code == symbol_code:
                    foreign = parse_num_to_sheets(item.get("ForeignInvestorsBuySell", 0))
                    trust = parse_num_to_sheets(item.get("InvestmentTrustBuySell", 0))
                    dealer = parse_num_to_sheets(item.get("DealerBuySell", 0))
                    return {"date": datetime.date.today().strftime("%Y-%m-%d"), "foreign": foreign, "trust": trust, "dealer": dealer, "total": foreign + trust + dealer}
    except Exception:
        pass
    return None

def fetch_chip_data(raw_symbol):
    symbol_code = raw_symbol.split(".")[0].strip().upper()
    return fetch_finmind_chip(symbol_code) or fetch_twse_openapi(symbol_code) or fetch_tpex_openapi(symbol_code)

def fetch_yahoo_symbol_with_retry(raw_symbol, market, years_str):
    try:
        years = float(years_str)
    except ValueError:
        years = 3.5

    sym = raw_symbol.strip().upper()
    symbols_to_try = [sym] if "." in sym else ([f"{sym}.TWO", f"{sym}.TW"] if market == "two" else [f"{sym}.TW", f"{sym}.TWO"])

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
            if not chart_data: continue

            result = chart_data[0]
            timestamps = result.get("timestamp", [])
            meta = result.get("meta", {})
            regular_market_price = meta.get("regularMarketPrice")
            
            # 抓取 Yahoo 本益比與殖利率
            trailing_pe = meta.get("trailingPE")
            dividend_yield = meta.get("dividendYield")

            quote_indicators = result.get("indicators", {}).get("quote", [{}])[0]
            raw_closes = quote_indicators.get("close", [])
            adj_closes = result.get("indicators", {}).get("adjclose", [{}])[0].get("adjclose", []) or raw_closes

            rows = []
            for t, rc, ac in zip(timestamps, raw_closes, adj_closes):
                if t is not None and ac is not None and rc is not None:
                    rows.append({"date": date.fromtimestamp(t).isoformat(), "close": float(ac), "raw_close": float(rc)})

            if rows and regular_market_price is not None:
                ratio = float(regular_market_price) / rows[-1]["raw_close"]
                rows[-1]["raw_close"] = float(regular_market_price)
                rows[-1]["close"] = round(rows[-1]["close"] * ratio, 2)

            if not rows: continue

            clean_code = yahoo_symbol.split(".")[0].strip()
            raw_stock_name = STOCK_NAME_MAP.get(clean_code) or (fetch_single_tpex_name(clean_code) if ".TWO" in yahoo_symbol else None) or meta.get("shortName") or meta.get("longName") or clean_code
            stock_name = clean_stock_name(raw_stock_name)

            return yahoo_symbol, rows, stock_name, trailing_pe, dividend_yield

        except Exception as e:
            last_exception = e
            continue

    raise last_exception or ValueError("無法從 Yahoo Finance 取得任何資料")

class Handler(BaseHTTPRequestHandler):
    def send_json(self, status, data):
        content = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
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
                actual_symbol, data, stock_name, pe, dy = fetch_yahoo_symbol_with_retry(
                    query.get("symbol", [""])[0], query.get("market", ["tw"])[0], query.get("years", ["3.5"])[0]
                )
                self.send_json(200, {"symbol": actual_symbol, "name": stock_name, "source": "Yahoo Finance", "rows": data, "pe": pe, "dividendYield": dy})
            except Exception as exc:
                self.send_json(400, {"error": str(exc)})
            return
        if parsed.path == "/api/chip":
            self.send_json(200, fetch_chip_data(urllib.parse.parse_qs(parsed.query).get("symbol", [""])[0]) or {"error": "無籌碼資料"})
            return

        file_path = (ROOT / (parsed.path.lstrip("/") or "index.html")).resolve()
        if not str(file_path).startswith(str(ROOT)) or not file_path.is_file():
            self.send_error(404)
            return
        self.send_response(200)
        self.send_header("Content-Type", mimetypes.guess_type(file_path.name)[0] or "application/octet-stream")
        self.end_headers()
        self.wfile.write(file_path.read_bytes())

if __name__ == "__main__":
    update_stock_names_from_api()
    server = ThreadingHTTPServer((HOST, PORT), Handler)
    print(f"🚀 Render Cloud Stock Server Started on Port {PORT}")
    server.serve_forever()