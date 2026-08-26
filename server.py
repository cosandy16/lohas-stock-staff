import os
import json
import ssl
import datetime
import urllib.request
import urllib.parse
from http.server import HTTPServer, SimpleHTTPRequestHandler

# 忽略 SSL 憑證驗證問題（避免部分環境請求 API 時報錯）
ssl_ctx = ssl.create_default_context()
ssl_ctx.check_hostname = False
ssl_ctx.verify_mode = ssl.CERT_NONE

PORT = 8000

def parse_num_to_sheets(val):
    """ 將 FinMind 回傳的股數轉為張數 (1張 = 1000股) """
    try:
        return int(round(float(val) / 1000.0))
    except (ValueError, TypeError):
        return 0

def fetch_finmind_chip(symbol_code):
    """
    從 FinMind 抓取三大法人買賣超資料，並計算歷史趨勢與籌碼狀態
    """
    today = datetime.date.today()
    # 抓取近 15 天資料，確保扣除假日後有足夠的交易日計算趨勢
    start_date = (today - datetime.timedelta(days=15)).strftime("%Y-%m-%d")
    url = f"https://api.finmindtrade.com/api/v4/data?dataset=TaiwanStockInstitutionalInvestorsBuySell&data_id={symbol_code}&start_date={start_date}"

    req = urllib.request.Request(
        url,
        headers={"User-Agent": "Mozilla/5.0", "Accept": "application/json"},
    )

    try:
        with urllib.request.urlopen(req, timeout=8, context=ssl_ctx) as resp:
            res_data = json.loads(resp.read().decode("utf-8"))

        data_list = res_data.get("data", [])
        if not data_list:
            return None

        # 依日期進行籌碼分類統計
        by_date = {}
        for row in data_list:
            d = row.get("date")
            name = str(row.get("name", ""))
            buy = row.get("buy", 0) or 0
            sell = row.get("sell", 0) or 0

            if d not in by_date:
                by_date[d] = {"foreign": 0, "trust": 0, "dealer": 0}

            diff = parse_num_to_sheets(buy - sell)
            if "Foreign" in name or "外資" in name:
                by_date[d]["foreign"] += diff
            elif "Trust" in name or "投信" in name:
                by_date[d]["trust"] += diff
            elif "Dealer" in name or "自營" in name:
                by_date[d]["dealer"] += diff

        # 依照日期排序
        sorted_dates = sorted(by_date.keys())
        history = [{"date": d, **by_date[d]} for d in sorted_dates]
        
        if not history:
            return None

        latest = history[-1]
        
        # 計算近 3 個交易日累積買賣超
        recent_3d = history[-3:] if len(history) >= 3 else history
        f_3d = sum(h["foreign"] for h in recent_3d)
        t_3d = sum(h["trust"] for h in recent_3d)
        
        # 籌碼狀態自動判斷 (heavy_sell: 大賣避坑, strong_buy: 法人加碼, selling_eased: 賣壓收斂)
        status = "normal"
        if f_3d < -3000 or t_3d < -3000:
            status = "heavy_sell"
        elif f_3d > 1000 or t_3d > 1000:
            status = "strong_buy"
        elif len(history) >= 2:
            prev_foreign = history[-2]["foreign"]
            curr_foreign = history[-1]["foreign"]
            # 若前一日大幅賣超（如 -1000 張以上）而當日賣超大幅收斂或轉買
            if prev_foreign < -1000 and curr_foreign > -300:
                status = "selling_eased"

        return {
            "date": latest.get("date"),
            "foreign": latest.get("foreign", 0),
            "trust": latest.get("trust", 0),
            "dealer": latest.get("dealer", 0),
            "total": latest.get("foreign", 0) + latest.get("trust", 0) + latest.get("dealer", 0),
            "foreign_3d": f_3d,
            "trust_3d": t_3d,
            "chip_status": status,
            "history": history
        }
    except Exception as e:
        print(f"⚠️ FinMind 抓取失敗 ({symbol_code}): {e}")
        return None

def fetch_yahoo_finance(symbol, market="tw"):
    """
    從 Yahoo Finance 抓取歷史 K 線資料
    """
    # 處理台股與美股代號字尾
    target_symbol = symbol
    if market == "tw" and not symbol.endswith(".TW"):
        target_symbol = f"{symbol}.TW"
    elif market == "two" and not symbol.endswith(".TWO"):
        target_symbol = f"{symbol}.TWO"

    url = f"https://query1.finance.yahoo.com/v8/finance/chart/{target_symbol}?range=5y&interval=1d"
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
    )

    try:
        with urllib.request.urlopen(req, timeout=10, context=ssl_ctx) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            
        result = data["chart"]["result"][0]
        timestamps = result["timestamp"]
        quotes = result["indicators"]["quote"][0]
        closes = quotes["close"]

        rows = []
        for ts, close in zip(timestamps, closes):
            if close is not None:
                dt_str = datetime.datetime.fromtimestamp(ts).strftime("%Y-%m-%d")
                rows.append({"date": dt_str, "close": round(close, 2)})

        return {"symbol": symbol, "market": market, "rows": rows}
    except Exception as e:
        print(f"⚠️ Yahoo Finance 抓取失敗 ({symbol}): {e}")
        return None

class StockHandler(SimpleHTTPRequestHandler):
    def do_GET(self):
        parsed_url = urllib.parse.urlparse(self.path)
        query_params = urllib.parse.parse_qs(parsed_url.query)

        # 1. API: 抓取 Yahoo 歷史股價
        if parsed_url.path == "/api/yahoo":
            symbol = query_params.get("symbol", [""])[0]
            market = query_params.get("market", ["tw"])[0]

            if not symbol:
                self.send_error_response(400, "Missing symbol parameter")
                return

            data = fetch_yahoo_finance(symbol, market)
            if data:
                self.send_json_response(data)
            else:
                self.send_error_response(500, "Failed to fetch price data")
            return

        # 2. API: 抓取 FinMind 三大法人籌碼 (含趨勢分析)
        if parsed_url.path == "/api/chip":
            symbol = query_params.get("symbol", [""])[0]
            if not symbol:
                self.send_error_response(400, "Missing symbol parameter")
                return

            clean_symbol = symbol.split(".")[0]  # 去除 .TW 或 .TWO
            data = fetch_finmind_chip(clean_symbol)
            if data:
                self.send_json_response(data)
            else:
                self.send_error_response(404, "Chip data not found")
            return

        # 預設行為：靜態檔案服務 (HTML, JS, CSS)
        return super().do_GET()

    def send_json_response(self, data):
        """ 輔助函數：回傳 JSON """
        body = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def send_error_response(self, code, message):
        """ 輔助函數：回傳錯誤訊息 """
        body = json.dumps({"error": message}).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

def run_server():
    server_address = ("", PORT)
    httpd = HTTPServer(server_address, StockHandler)
    print(f"🚀 五線譜與籌碼分析伺服器已啟動: http://localhost:{PORT}")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n🛑 伺服器已停止")

if __name__ == "__main__":
    run_server()