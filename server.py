import json
import ssl
import urllib.parse
import urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

HOST = "0.0.0.0"
PORT = 8000

# 全域 TLS 忽略憑證設定
ssl_ctx = ssl.create_default_context()
ssl_ctx.check_hostname = False
ssl_ctx.verify_mode = ssl.CERT_NONE

# 💡 全域台股名稱快取字典
STOCK_NAME_MAP = {}


def load_taiwan_stock_names():
    """啟動時動態從證交所(TWSE)與櫃買中心(TPEx)抓取上市上櫃股票/ETF名稱"""
    global STOCK_NAME_MAP
    urls = [
        "https://openapi.twse.com.tw/v1/exchangeReport/BWIBBU_ALL",  # 上市
        "https://www.tpex.org.tw/openapi/v1/mopspr_t187ap03_L",  # 上櫃
    ]
    count = 0
    for url in urls:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        try:
            with urllib.request.urlopen(req, timeout=8, context=ssl_ctx) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                for item in data:
                    code = str(
                        item.get("Code", "")
                        or item.get("SecuritiesCompanyCode", "")
                        or item.get("公司代號", "")
                    ).strip()
                    name = str(
                        item.get("Name", "")
                        or item.get("CompanyName", "")
                        or item.get("公司名稱", "")
                    ).strip()
                    if code and name:
                        STOCK_NAME_MAP[code] = name
                        count += 1
        except Exception as e:
            print(f"⚠️ 載入台股清單失敗 ({url}): {e}")
    print(f"✅ 台股名稱資料初始化完成，共載入 {count} 筆資料")


def fetch_yahoo_symbol_with_retry(raw_symbol, market="tw", years="3.5"):
    """模擬 Yahoo Finance K線資料抓取"""
    symbol = raw_symbol.upper().strip()
    if market == "tw" and not (
        symbol.endswith(".TW") or symbol.endswith(".TWO")
    ):
        symbol += ".TW"

    url = f"https://query1.finance.yahoo.com/v8/finance/chart/{symbol}?range=5y&interval=1d"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})

    try:
        with urllib.request.urlopen(req, timeout=10, context=ssl_ctx) as resp:
            res_data = json.loads(resp.read().decode("utf-8"))
            result = res_data["chart"]["result"][0]
            timestamps = result.get("timestamp", [])
            quote = result["indicators"]["quote"][0]
            closes = quote.get("close", [])

            rows = []
            for t, c in zip(timestamps, closes):
                if c is not None:
                    rows.append({"time": t, "close": c})

            return symbol, rows
    except Exception as e:
        # 上市失敗嘗試轉上櫃 (.TWO)
        if symbol.endswith(".TW"):
            alt_symbol = symbol.replace(".TW", ".TWO")
            return fetch_yahoo_symbol_with_retry(alt_symbol, market, years)
        raise Exception(f"無法存取 Yahoo 資料: {e}")


class Handler(BaseHTTPRequestHandler):

    def send_json(self, code, obj):
        body = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.send_header(
            "Access-Control-Allow-Headers", "Content-Type, Authorization"
        )
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.send_header(
            "Access-Control-Allow-Headers", "Content-Type, Authorization"
        )
        self.end_headers()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)

        # API 1: Yahoo 股價查詢
        if parsed.path == "/api/yahoo":
            query = urllib.parse.parse_qs(parsed.query)
            raw_symbol = query.get("symbol", [""])[0]
            market = query.get("market", ["tw"])[0]
            years = query.get("years", ["3.5"])[0]

            if not raw_symbol:
                self.send_json(400, {"error": "請提供 symbol 參數"})
                return

            try:
                actual_symbol, data = fetch_yahoo_symbol_with_retry(
                    raw_symbol, market, years
                )

                # 💡 自動比對後端全域字典，取得中文名稱
                clean_code = actual_symbol.split(".")[0]
                stock_name = STOCK_NAME_MAP.get(clean_code, "")

                self.send_json(
                    200,
                    {
                        "symbol": actual_symbol,
                        "name": stock_name,  # 帶入動態抓到的中文名稱
                        "source": "Yahoo Finance",
                        "rows": data,
                    },
                )
            except Exception as exc:
                self.send_json(400, {"error": str(exc)})
            return

        # API 2: 單獨查詢代號與名稱的字典對照表
        if parsed.path == "/api/stock-names":
            self.send_json(200, STOCK_NAME_MAP)
            return

        self.send_json(404, {"error": "Not Found"})


if __name__ == "__main__":
    print("🔄 正在初始化抓取台灣上市/上櫃股票清單...")
    load_taiwan_stock_names()

    print(f"🚀 Server running on http://{HOST}:{PORT}")
    server = ThreadingHTTPServer((HOST, PORT), Handler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n🛑 伺服器已停止")