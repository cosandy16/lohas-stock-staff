from flask import Flask, request, jsonify
from flask_cors import CORS
import datetime
import requests

app = Flask(__name__)
CORS(app)

def fetch_finmind_chip(symbol_code):
    today = datetime.date.today()
    # 抓取過去 35 天以確保涵蓋 20 個交易日
    start_date = (today - datetime.timedelta(days=35)).strftime("%Y-%m-%d")
    url = f"https://api.finmindtrade.com/api/v4/data?dataset=TaiwanStockInstitutionalInvestorsBuySell&data_id={symbol_code}&start_date={start_date}"

    try:
        resp = requests.get(url, timeout=10)
        if resp.status_code != 200:
            return None
        res_json = resp.json()
        data_list = res_json.get("data", [])
        if not data_list:
            return None

        by_date = {}
        for row in data_list:
            d = row.get("date")
            name = row.get("name", "")
            buy = row.get("buy", 0) or 0
            sell = row.get("sell", 0) or 0

            if d not in by_date:
                by_date[d] = {
                    "foreign_buy": 0, "foreign_sell": 0,
                    "trust_buy": 0, "trust_sell": 0,
                    "dealer_buy": 0, "dealer_sell": 0,
                }

            if "Foreign" in name or "外資" in name:
                by_date[d]["foreign_buy"] += buy
                by_date[d]["foreign_sell"] += sell
            elif "Investment_Trust" in name or "投信" in name:
                by_date[d]["trust_buy"] += buy
                by_date[d]["trust_sell"] += sell
            elif "Dealer" in name or "自營" in name:
                by_date[d]["dealer_buy"] += buy
                by_date[d]["dealer_sell"] += sell

        # 取最近 20 個交易日並轉為陣列
        sorted_dates = sorted(by_date.keys())[-20:]
        history = []
        for d in sorted_dates:
            chip = by_date[d]
            f_diff = int(round((chip["foreign_buy"] - chip["foreign_sell"]) / 1000.0))
            t_diff = int(round((chip["trust_buy"] - chip["trust_sell"]) / 1000.0))
            d_diff = int(round((chip["dealer_buy"] - chip["dealer_sell"]) / 1000.0))

            history.append({
                "date": d,
                "foreign": f_diff,
                "trust": t_diff,
                "dealer": d_diff,
                "total": f_diff + t_diff + d_diff
            })

        if not history:
            return None

        latest = history[-1]
        sum_20d_foreign = sum(h["foreign"] for h in history)
        sum_20d_trust = sum(h["trust"] for h in history)
        sum_20d_dealer = sum(h["dealer"] for h in history)
        sum_20d_total = sum(h["total"] for h in history)

        return {
            "date": latest["date"],
            "foreign": latest["foreign"],
            "trust": latest["trust"],
            "dealer": latest["dealer"],
            "total": latest["total"],
            "sum_20d": {
                "foreign": sum_20d_foreign,
                "trust": sum_20d_trust,
                "dealer": sum_20d_dealer,
                "total": sum_20d_total
            },
            "history": history
        }
    except Exception as e:
        print(f"Error fetching FinMind chip for {symbol_code}: {e}")
        return None

@app.route("/api/chip", methods=["GET"])
def get_chip():
    symbol = request.args.get("symbol", "").strip()
    if not symbol:
        return jsonify({"error": "Symbol is required"}), 400

    symbol_code = symbol.split(".")[0]
    chip_data = fetch_finmind_chip(symbol_code)

    if chip_data:
        return jsonify({"status": "success", "data": chip_data})
    else:
        return jsonify({"status": "error", "message": "No chip data found"}), 404

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)