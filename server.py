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

# 💡 智慧精簡中文字典（涵蓋台美股最熱門核心標的，讓畫面最精緻）
STOCK_NAME_DICT = {
    # 台股熱門
    "2330": "台積電", "2317": "鴻海", "2454": "聯發科", "2379": "瑞昱",
    "2308": "台達電", "2382": "廣達", "2327": "國巨", "3008": "大立光",
    "2881": "富邦金", "2882": "國泰金", "2886": "兆豐金", "2891": "中信金",
    "0050": "元大台灣50", "0056": "元大高股息", "00878": "國泰永續高股息", "2412": "中華電",
    # 美股熱門
    "AAPL": "蘋果", "MSFT": "微軟", "NVDA": "輝達", "GOOG": "Google", "GOOGL": "Google",
    "AMZN": "亞馬遜", "META": "臉書", "TSLA": "特斯拉", "AMD": "超微", "INTC": "英特爾",
    "AVGO": "博通", "QCOM": "高通", "NFLX": "網飛", "COST": "好市多", "ASML": "艾司摩爾",
    "TSM": "台積電ADR", "BRK.B": "波克夏B", "LLY": "禮來", "NKE": "耐吉", "DIS": "迪士尼"
}

def clean_company_name(symbol, raw_name):
    """將 Yahoo 回傳的一長串英文全銜裁切精簡，並優先匹配中文對照表"""
    sym_upper = symbol.split('.')[0].upper()
    if sym_upper in STOCK_NAME_DICT:
        return STOCK_NAME_DICT[sym_upper]
    
    if not raw_name:
        return symbol
        
    # 如果字典沒有，自動清理英文雜訊（刪除常見的 Corporation, Inc., Co., Ltd 等字眼）
    name = raw_name
    name = re.sub(r',?\s+(Inc|Corp|Corporation|Co|Ltd|Limited|Holdings|S\.A|AG)\.?\s*$', '', name, flags=re.IGNORECASE)
    name = re.sub(r'\s+-\s+.*$', '', name) # 刪除「 - Depositary Receipt」等字尾
    return name.strip()

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

def fetch_yahoo_symbol_with_retry(raw_symbol, market, years_str):
    symbol = raw_symbol.strip().upper()
    if market == "tw" and not symbol.endswith(".TW"):
        symbol += ".TW"
    elif market == "two" and not symbol.endswith(".TWO"):
        symbol += ".TWO"

    years = float(years_str) if years_str != "all" else 10.0
    days = int(years * 365) + 30
    end_dt = date.today()
    start_dt = end_dt - timedelta(days=days)
    period1 = int(time.mktime(start_dt.timetuple()))
    period2 = int(time.mktime(end_dt.timetuple()))

    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
    
    # 智慧交叉容錯嘗試
    candidates = [symbol]
    if market == "tw" and symbol.endswith(".TW"):
        candidates.append(symbol.replace(".TW", ".TWO"))
    elif market == "two" and symbol.endswith(".TWO"):
        candidates.append(symbol.replace(".TWO", ".TW"))

    last_exc = None
    for sym in candidates:
        url = f"https://query1.finance.yahoo.com/v8/finance/chart/{sym}?period1={period1}&period2={period2}&interval=1d"
        try:
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req, timeout=10) as response:
                res_body = response.read().decode("utf-8")
                js = json.loads(res_body)
                
                meta = js["chart"]["result"][0]["meta"]
                timestamps = js["chart"]["result"][0].get("timestamp", [])
                indicators = js["chart"]["result"][0]["indicators"]["quote"][0]
                closes = indicators.get("close", [])

                # 💡 從 Yahoo 中提取官方名稱
                raw_display_name = meta.get("shortName") or meta.get("longName") or sym
                display_name = clean_company_name(sym, raw_display_name)
                
                # 組裝名稱：像是 "2379 瑞昱" 或 "AAPL 蘋果"
                clean_sym = sym.replace(".TW","").replace(".TWO","")
                formatted_title = f"{clean_sym} {display_name}"

                rows = []
                for t, c in zip(timestamps, closes):
                    if t is not None and c is not None:
                        dt_str = date.fromtimestamp(t).isoformat()
                        rows.append({"date": dt_str, "close": float(c)})

                if not rows:
                    raise ValueError("No valid data rows found")

                rows.sort(key=lambda x: x["date"])
                return formatted_title, rows
        except Exception as e:
            last_exc = e
            continue

    raise last_exc or Exception("Failed to fetch data from Yahoo Finance")


class Handler(BaseHTTPRequestHandler):
    def send_json(self, status, obj):
        content = json.dumps(obj).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(content)))
        self.end_headers()
        self.wfile.write(content)

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path == "/api/yahoo":
            query = urllib.parse.parse_qs(parsed.query)
            raw_symbol = query.get("symbol", [Defaults.get("symbol","")])[0] if "Defaults" in globals() else query.get("symbol", [Defaults if 'Defaults' in globals() else ""])[0]
            raw_symbol = query.get("symbol", [Defaults.symbol if 'Defaults' in globals() and hasattr(Defaults, 'symbol') else ''])[0] if not raw_symbol else raw_symbol
            raw_symbol = query.get("symbol", [\"\"])[0]
            market = query.get("market", ["tw"])[0]
            years = query.get("years", ["3.5"])[0]
            try:
                actual_symbol, data = fetch_yahoo_symbol_with_retry(raw_symbol, market, years)
                self.send_json(200, {"symbol": actual_symbol, "source": "Yahoo Finance", "rows": data})
            except Exception as exc:
                self.send_json(400, {"error": str(exc)})\n            return\n\n        target = parsed.path.lstrip(\"/\") or \"index.html\"\n        file_path = (ROOT / target).resolve()\n        if not str(file_path).startswith(str(ROOT)) or not file_path.is_file():\n            self.send_error(404)\n            return\n\n        content_type = mimetypes.guess_type(file_path.name)[0] or \"application/octet-stream\"\n        content = file_path.read_bytes()\n        self.send_response(200)\n        self.send_header(\"Content-Type\", content_type)\n        self.send_header(\"Content-Length\", str(len(content)))\n        self.end_headers()\n        self.wfile.write(content)\n\n    def log_message(self, format, *args):\n        print(f\"{self.address_string()} - {format % args}\")\n\n\nif __name__ == \"__main__\":\n    print(f\"Starting server on http://{HOST}:{PORT}\")\n    server = ThreadingHTTPServer((HOST, PORT), Handler)\n    try:\n        server.serve_forever()\n    except KeyboardInterrupt:\n        pass\n
http://googleusercontent.com/immersive_entry_chip/0