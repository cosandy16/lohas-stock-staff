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


def fetch_twse_stock_day(stock_no, years):
    if not re.fullmatch(r"\d{4,6}", stock_no):
        raise ValueError("股票代號格式不正確，請輸入 4 到 6 位數字。")

    today = date.today()
    start = today - timedelta(days=round(float(years) * 365))
    rows = {}

    for month in month_range(start, today):
        api_date = f"{month.year}{month.month:02d}01"
        url = (
            "https://www.twse.com.tw/exchangeReport/STOCK_DAY"
            f"?response=json&date={api_date}&stockNo={stock_no}"
        )
        payload = fetch_json(url)

        if payload.get("stat") not in {"OK", "很抱歉，沒有符合條件的資料!"}:
            continue

        for item in payload.get("data", []):
            # TWSE STOCK_DAY columns: date, volume, value, open, high, low, close, change, transactions.
            close = parse_number(item[6]) if len(item) > 6 else None
            if close is None:
                continue
            row_date = parse_twse_date(item[0])
            if row_date >= start.isoformat():
                rows[row_date] = close

    ordered = [{"date": key, "close": rows[key]} for key in sorted(rows)]
    if not ordered:
        raise ValueError("查不到資料，請確認股票代號或稍後再試。")
    return ordered


def fetch_yahoo_stock_day(stock_no, years):
    if not re.fullmatch(r"\d{4,6}", stock_no):
        raise ValueError("股票代號格式不正確，請輸入 4 到 6 位數字。")

    period2 = int(time.time())
    period1 = period2 - round(float(years) * 365 * 24 * 60 * 60)
    symbol = f"{stock_no}.TW"
    url = (
        "https://query1.finance.yahoo.com/v8/finance/chart/"
        f"{urllib.parse.quote(symbol)}?period1={period1}&period2={period2}"
        "&interval=1d&events=history&includeAdjustedClose=true"
    )
    payload = fetch_json(url)
    result = payload.get("chart", {}).get("result") or []
    if not result:
        error = payload.get("chart", {}).get("error", {})
        raise ValueError(error.get("description") or "Yahoo Finance 查不到資料。")

    item = result[0]
    timestamps = item.get("timestamp") or []
    quote = ((item.get("indicators") or {}).get("quote") or [{}])[0]
    closes = quote.get("close") or []
    rows = []

    for ts, close in zip(timestamps, closes):
        if close is None:
            continue
        row_date = date.fromtimestamp(ts).isoformat()
        rows.append({"date": row_date, "close": round(float(close), 4)})

    if not rows:
        raise ValueError("查不到有效收盤價，請確認代號是否為 Yahoo 支援的上市台股。")
    return rows


def fetch_json(url):
    current = url
    for _ in range(5):
        request = urllib.request.Request(
            current,
            headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
                "Accept": "application/json,text/plain,*/*",
                "Referer": "https://www.twse.com.tw/",
            },
        )
        try:
            with urllib.request.urlopen(request, timeout=12) as response:
                return json.loads(response.read().decode("utf-8-sig"))
        except HTTPError as exc:
            if exc.code not in {301, 302, 303, 307, 308}:
                raise
            location = exc.headers.get("Location")
            if not location:
                raise
            current = urllib.parse.urljoin(current, location)
    raise ValueError("證交所資料轉址次數過多，請稍後再試。")


class Handler(BaseHTTPRequestHandler):
    def send_json(self, status, body):
        payload = json.dumps(body, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path == "/api/twse":
            query = urllib.parse.parse_qs(parsed.query)
            stock_no = query.get("stockNo", [""])[0].strip()
            years = query.get("years", ["3.5"])[0]
            try:
                data = fetch_yahoo_stock_day(stock_no, years)
                self.send_json(200, {"symbol": f"{stock_no}.TW", "source": "Yahoo Finance", "rows": data})
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
    print(f"股市樂活五線譜已啟動：http://127.0.0.1:{PORT}/index.html")
    print("手機請使用同一個 Wi-Fi 下的電腦 IPv4 位址連線，例如：http://192.168.1.23:8769/index.html")
    server.serve_forever()
