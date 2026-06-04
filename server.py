import json
import mimetypes
import os
import re
import time
import urllib.parse
import urllib.request
from urllib.error import HTTPError
from datetime import date, timedelta
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


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
            current = date(current.year, current.month + 1, 1)


def parse_twse_date(value):
    parts = value.split("/")
    if len(parts) != 3:
        raise ValueError(f"Invalid TWSE date: {value}")
    year = int(parts[0]) + 1911
    return f"{year:04d}-{int(parts[1]):02d}-{int(parts[2]):02d}"


def parse_number(value):
    cleaned = value.replace(",", "").strip()
    if cleaned in {"", "--", "X", "除權息"}:
        return None
    try:
        return float(cleaned)
    except ValueError:
        return None


# 💡 智慧防呆：優化代號正規化邏輯
def normalize_yahoo_symbol(raw_symbol, market):
    sym = raw_symbol.strip().upper()
    if "." in sym:
        return sym
    
    # 如果純數字，先根據傳入的 market 給予預設後綴
    if re.match(r"^\d+$", sym):
        if market == "two":
            return f"{sym}.TWO"
        return f"{sym}.TW"
    return sym


# 💡 核心優化：串接 Yahoo API 的下載函式，加入上市/上櫃自動交叉容錯機制
def fetch_yahoo_symbol_with_retry(raw_symbol, market, years_str):
    try:
        years = float(years_str)
    except ValueError:
        years = 3.5

    # 1. 決定要嘗試的代號順序
    sym = raw_symbol.strip().upper()
    symbols_to_try = []

    if "." in sym:
        symbols_to_try.append(sym)
    elif re.match(r"^\d+$", sym):
        # 如果是純數字，且使用者選 two，優先嘗試 .TWO，失敗再試 .TW
        if market == "two":
            symbols_to_try = [f"{sym}.TWO", f"{sym}.TW"]
        else:
            symbols_to_try = [f"{sym}.TW", f"{sym}.TWO"]
    else:
        symbols_to_try.append(sym)

    # 2. 開始依序嘗試下載
    last_exception = None
    for yahoo_symbol in symbols_to_try:
        try:
            end_dt = date.today()
            start_dt = end_dt - timedelta(days=int((years + 0.6) * 365))
            period1 = int(time.mktime(start_dt.timetuple()))
            period2 = int(time.mktime(end_dt.timetuple()))

            url = f"https://query1.finance.yahoo.com/v8/finance/chart/{yahoo_symbol}?period1={period1}&period2={period2}&interval=1d"
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
            
            with urllib.request.urlopen(req) as response:
                res_data = json.loads(response.read().decode("utf-8"))
                
            chart_data = res_data.get("chart", {}).get("result", [])
            if not chart_data:
                raise ValueError("Yahoo Finance 回傳空資料")
                
            result = chart_data[0]
            timestamps = result.get("timestamp", [])
            indicators = result.get("indicators", {}).get("quote", [{}])[0]
            closes = indicators.get("close", [])

            rows = []
            for t, c in zip(timestamps, closes):
                if t is not None and c is not None:
                    dt_str = date.fromtimestamp(t).isoformat()
                    rows.append({"date": dt_str, "close": float(c)})
            
            if not rows:
                raise ValueError("解析後無有效收盤價歷史紀錄")
                
            # 只要成功抓到，就直接回傳結果與實際成功的代號！
            return yahoo_symbol, rows
            
        except Exception as e:
            last_exception = e
            print(f"嘗試抓取 {yahoo_symbol} 失敗，準備嘗試下一個可能性... 錯誤: {e}")
            continue

    # 如果都失敗了，才真正拋出異常
    raise last_exception or ValueError("無法從 Yahoo Finance 取得任何資料")


class Handler(BaseHTTPRequestHandler):
    def send_json(self, status, data):
        content = json.dumps(data).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(content)))
        self.end_headers()
        self.wfile.write(content)

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path == "/api/yahoo":
            query = urllib.parse.parse_qs(parsed.query)
            raw_symbol = query.get("symbol", [""])[0]
            market = query.get("market", ["tw"])[0]
            years = query.get("years", ["3.5"])[0]
            try:
                # 💡 改用全新的智慧容錯交叉下載函式
                actual_symbol, data = fetch_yahoo_symbol_with_retry(raw_symbol, market, years)
                self.send_json(200, {"symbol": actual_symbol, "source": "Yahoo Finance", "rows": data})
            except Exception as exc:
                self.send_json(400, {"error": str(exc)})
            return

        target = parsed.path.lstrip("/") or "index.html"
        file_path = (ROOT / target).resolve()
        if not str(file_path).startswith(str(ROOT)) or not file_path.is_file():
            self.send_error(404)
            return

        content_type = mimetypes.guess_type(file_path.name)[0] or "application/octet-stream"
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