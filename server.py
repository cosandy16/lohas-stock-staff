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

SERVER_VERSION = "fixed19"
PREV_SOURCE = {}
ROOT = Path(__file__).resolve().parent
HOST = os.environ.get("HOST", "0.0.0.0")
PORT = int(os.environ.get("PORT", "8769"))

# 建立免驗證 SSL Context
ssl_ctx = ssl.create_default_context()
ssl_ctx.check_hostname = False
ssl_ctx.verify_mode = ssl.CERT_NONE

# ---------------------------------------------------------
# 📚 全局股票/ETF 中文名稱快取字典 (自動補全上市與上櫃)
# ---------------------------------------------------------
STOCK_NAME_MAP = {}

def update_stock_names_from_api():
    """自動從證交所 (TWSE) 與櫃買中心 (TPEx) OpenData 下載最新完整股票 & ETF 中文簡稱清單"""
    global STOCK_NAME_MAP
    new_map = {}
    
    # 1. 證交所 (上市股票 & 全體 ETF)
    twse_urls = [
        "https://openapi.twse.com.tw/v1/exchangeReport/BWIBBU_ALL",
        "https://openapi.twse.com.tw/v1/exchangeReport/STOCK_DAY_ALL",
        "https://openapi.twse.com.tw/v1/opendata/t187ap03_L"
    ]
    for twse_url in twse_urls:
        try:
            req = urllib.request.Request(twse_url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})
            with urllib.request.urlopen(req, timeout=8, context=ssl_ctx) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                for item in data:
                    code = (item.get("Code") or item.get("SecuritiesCode") or item.get("公司代號") or item.get("證券代號") or "").strip()
                    name = (item.get("Name") or item.get("SecuritiesName") or item.get("公司簡稱") or item.get("證券名稱") or "").strip()
                    if code and name:
                        new_map[code] = name
        except Exception as e:
            print(f"⚠️ [TWSE API] 下載上市清單失敗 ({twse_url}): {e}")

    # 2. 櫃買中心 (上櫃股票 & 上櫃 ETF / 債券 ETF)
    tpex_urls = [
        "https://www.tpex.org.tw/openapi/v1/tpex_mainboard_quotes",
        "https://www.tpex.org.tw/openapi/v1/mops_all_01",
        "https://www.tpex.org.tw/openapi/v1/tpex_mainboard_daily_quotes"
    ]
    for tpex_url in tpex_urls:
        try:
            req = urllib.request.Request(tpex_url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})
            with urllib.request.urlopen(req, timeout=8, context=ssl_ctx) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                for item in data:
                    code = (item.get("SecuritiesCompanyCode") or item.get("SecuritiesCode") or item.get("CompanyCode") or item.get("代號") or item.get("股票代號") or "").strip()
                    name = (item.get("CompanyName") or item.get("CompanyAbbreviation") or item.get("SecuritiesName") or item.get("名稱") or item.get("股票名稱") or "").strip()
                    if code and name:
                        new_map[code] = name
        except Exception as e:
            print(f"⚠️ [TPEx API] 下載上櫃清單失敗 ({tpex_url}): {e}")

    if new_map:
        STOCK_NAME_MAP = new_map
        print(f"🎉 全局股票名稱字典更新完成，總計 {len(STOCK_NAME_MAP)} 檔標的名稱 (含上市/上櫃/ETF)")

def fetch_single_tpex_name(symbol_code):
    """備援：若字典漏掉，即時發送 request 向櫃買中心查詢單檔上櫃股票中文名"""
    try:
        url = f"https://www.tpex.org.tw/web/stock/aftertrading/otc_quotes_summary1/stk_summary_result.php?l=zh-tw&stkno={symbol_code}"
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})
        with urllib.request.urlopen(req, timeout=4, context=ssl_ctx) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            aa_data = data.get("aaData", [])
            if aa_data and len(aa_data[0]) > 1:
                return aa_data[0][1].strip()
    except Exception:
        pass
    return None

# ---------------------------------------------------------
# 工具函式
# ---------------------------------------------------------
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

# ---------------------------------------------------------
# 🌐 三大法人籌碼多重備援抓取
# ---------------------------------------------------------
def fetch_finmind_chip(symbol_code):
    today = datetime.date.today()
    start_date = (today - datetime.timedelta(days=15)).strftime("%Y-%m-%d")
    url = f"https://api.finmindtrade.com/api/v4/data?dataset=TaiwanStockInstitutionalInvestorsBuySell&data_id={symbol_code}&start_date={start_date}"

    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)", "Accept": "application/json"})
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
                by_date[d] = {
                    "foreign_buy": 0, "foreign_sell": 0,
                    "trust_buy": 0, "trust_sell": 0,
                    "dealer_buy": 0, "dealer_sell": 0,
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

        latest_date = sorted(by_date.keys())[-1]
        chip = by_date[latest_date]

        f_buy = int(round(chip["foreign_buy"] / 1000.0))
        f_sell = int(round(chip["foreign_sell"] / 1000.0))
        t_buy = int(round(chip["trust_buy"] / 1000.0))
        t_sell = int(round(chip["trust_sell"] / 1000.0))
        d_buy = int(round(chip["dealer_buy"] / 1000.0))
        d_sell = int(round(chip["dealer_sell"] / 1000.0))

        f_diff = f_buy - f_sell
        t_diff = t_buy - t_sell
        d_diff = d_buy - d_sell

        # 近 5 個交易日累計 (單日買賣超雜訊大，建議判斷改看多日)
        recent_dates = sorted(by_date.keys())[-5:]
        def _net(dd, k):
            return int(round((dd[k + "_buy"] - dd[k + "_sell"]) / 1000.0))
        foreign5 = sum(_net(by_date[x], "foreign") for x in recent_dates)
        trust5 = sum(_net(by_date[x], "trust") for x in recent_dates)
        dealer5 = sum(_net(by_date[x], "dealer") for x in recent_dates)

        return {
            "date": latest_date,
            "days": len(recent_dates),
            "foreign5": foreign5, "trust5": trust5, "dealer5": dealer5,
            "total5": foreign5 + trust5 + dealer5,
            "foreign": f_diff, "foreign_buy": f_buy, "foreign_sell": f_sell,
            "trust": t_diff, "trust_buy": t_buy, "trust_sell": t_sell,
            "dealer": d_diff, "dealer_buy": d_buy, "dealer_sell": d_sell,
            "total": f_diff + t_diff + d_diff,
        }
    except Exception as e:
        print(f"⚠️ FinMind API 跳過 ({symbol_code}): {e}")
    return None

def fetch_twse_openapi(symbol_code):
    url = "https://openapi.twse.com.tw/v1/fund/T86Daily"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)", "Accept": "application/json"})
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

                    if total == 0 and (foreign != 0 or trust != 0 or dealer != 0):
                        total = foreign + trust + dealer

                    date_raw = str(item.get("Date", ""))
                    formatted_date = (
                        f"{date_raw[:4]}-{date_raw[4:6]}-{date_raw[6:]}"
                        if len(date_raw) == 8
                        else datetime.date.today().strftime("%Y-%m-%d")
                    )

                    return {
                        "date": formatted_date,
                        "foreign": foreign, "foreign_buy": 0, "foreign_sell": 0,
                        "trust": trust, "trust_buy": 0, "trust_sell": 0,
                        "dealer": dealer, "dealer_buy": 0, "dealer_sell": 0,
                        "total": total,
                    }
    except Exception as e:
        print(f"💡 TWSE OpenData 跳過: {e}")
    return None

def fetch_tpex_openapi(symbol_code):
    url = "https://www.tpex.org.tw/openapi/v1/tpex_mainboard_daily_quotes"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)", "Accept": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=5, context=ssl_ctx) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            for item in data:
                code = str(item.get("SecuritiesCompanyCode", "") or item.get("SecuritiesCode", "")).strip()
                if code == symbol_code:
                    foreign = parse_num_to_sheets(item.get("ForeignInvestorsBuySell", 0))
                    trust = parse_num_to_sheets(item.get("InvestmentTrustBuySell", 0))
                    dealer = parse_num_to_sheets(item.get("DealerBuySell", 0))
                    total = foreign + trust + dealer

                    return {
                        "date": datetime.date.today().strftime("%Y-%m-%d"),
                        "foreign": foreign, "foreign_buy": 0, "foreign_sell": 0,
                        "trust": trust, "trust_buy": 0, "trust_sell": 0,
                        "dealer": dealer, "dealer_buy": 0, "dealer_sell": 0,
                        "total": total,
                    }
    except Exception as e:
        print(f"💡 TPEx OpenData 跳過: {e}")
    return None

def fetch_chip_data(raw_symbol):
    symbol_code = raw_symbol.split(".")[0].strip().upper()
    print(f"📡 正在查詢 [{symbol_code}] 最新三大法人籌碼...")

    res = fetch_finmind_chip(symbol_code)
    if res:
        return res

    res = fetch_twse_openapi(symbol_code)
    if res:
        return res

    res = fetch_tpex_openapi(symbol_code)
    if res:
        return res

    return None


# ---------------------------------------------------------
# 📊 本益比 / 殖利率 (證交所 BWIBBU_ALL、櫃買 peratio_analysis)
# ---------------------------------------------------------
FUNDAMENTALS_CACHE = {"time": 0, "data": {}}
FUNDAMENTALS_TTL = 60 * 60 * 3  # 3 小時更新一次

def _fetch_json(url, timeout=10):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)", "Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=timeout, context=ssl_ctx) as resp:
        return json.loads(resp.read().decode("utf-8"))

def _pick(item, keys):
    for k in keys:
        if k in item:
            n = parse_number(item.get(k))
            if n is not None:
                return n
    return None

def load_fundamentals():
    """回傳 {代號: {"pe": float|None, "yield": float|None}}，資料為官方最新值"""
    now = time.time()
    if FUNDAMENTALS_CACHE["data"] and now - FUNDAMENTALS_CACHE["time"] < FUNDAMENTALS_TTL:
        return FUNDAMENTALS_CACHE["data"]

    result = {}
    sources = [
        ("https://openapi.twse.com.tw/v1/exchangeReport/BWIBBU_ALL",
         ["Code", "SecuritiesCode"], ["PEratio", "PERatio"], ["DividendYield", "YieldRatio"]),
        ("https://www.tpex.org.tw/openapi/v1/tpex_mainboard_peratio_analysis",
         ["SecuritiesCompanyCode", "Code"], ["PriceEarningRatio", "PEratio", "PERatio"], ["YieldRatio", "DividendYield"]),
    ]
    for url, code_keys, pe_keys, yield_keys in sources:
        try:
            for item in _fetch_json(url):
                code = ""
                for ck in code_keys:
                    if item.get(ck):
                        code = str(item[ck]).strip().upper()
                        break
                if not code:
                    continue
                pe = _pick(item, pe_keys)
                dy = _pick(item, yield_keys)
                result[code] = {
                    "pe": pe if (pe is not None and pe > 0) else None,
                    "yield": dy if (dy is not None and dy >= 0) else None,
                }
        except Exception as e:
            print(f"⚠️ 本益比/殖利率來源失敗 ({url}): {e}")

    if result:
        FUNDAMENTALS_CACHE["data"] = result
        FUNDAMENTALS_CACHE["time"] = now
    return result or FUNDAMENTALS_CACHE["data"]

def get_fundamentals(symbol_code):
    return load_fundamentals().get(symbol_code.split(".")[0].strip().upper(), {"pe": None, "yield": None})

# ---------------------------------------------------------
# 📈 官方每日收盤價與漲跌 (證交所 STOCK_DAY_ALL、櫃買 daily_close_quotes)
#    Yahoo 對部分標的 (如 0050) 的歷史收盤價有誤，漲跌改以官方資料為準
# ---------------------------------------------------------
DAILY_CACHE = {"time": 0, "data": {}}
DAILY_TTL = 60 * 5

def _roc_to_iso(v):
    v = str(v or "").strip()
    try:
        if len(v) == 7 and v.isdigit():      # 1151109
            return f"{int(v[:3]) + 1911}-{v[3:5]}-{v[5:]}"
        if len(v) == 8 and v.isdigit():      # 20261109
            return f"{v[:4]}-{v[4:6]}-{v[6:]}"
    except Exception:
        pass
    return None

def load_daily_quotes():
    """回傳 {代號: {"close": 收盤, "change": 漲跌價差, "date": 'YYYY-MM-DD' 或 None}}"""
    now = time.time()
    if DAILY_CACHE["data"] and now - DAILY_CACHE["time"] < DAILY_TTL:
        return DAILY_CACHE["data"]

    result = {}
    sources = [
        ("https://openapi.twse.com.tw/v1/exchangeReport/STOCK_DAY_ALL",
         ["Code", "SecuritiesCode"], ["ClosingPrice"], ["Change"]),
        ("https://www.tpex.org.tw/openapi/v1/tpex_mainboard_daily_close_quotes",
         ["SecuritiesCompanyCode", "Code"], ["Close", "ClosingPrice"], ["Change"]),
    ]
    for url, code_keys, close_keys, change_keys in sources:
        try:
            for item in _fetch_json(url):
                code = ""
                for ck in code_keys:
                    if item.get(ck):
                        code = str(item[ck]).strip().upper()
                        break
                if not code:
                    continue
                close = _pick(item, close_keys)
                change = _pick(item, change_keys)
                if close is None or close <= 0 or change is None:
                    continue
                result[code] = {
                    "close": close,
                    "change": change,
                    "date": _roc_to_iso(item.get("Date")),
                }
        except Exception as e:
            print(f"⚠️ 官方每日收盤來源失敗 ({url}): {e}")

    if result:
        DAILY_CACHE["data"] = result
        DAILY_CACHE["time"] = now
    return result or DAILY_CACHE["data"]

def official_previous_close(symbol, rows):
    """以官方資料求前一交易日收盤價；無法判斷時回傳 None"""
    if not rows:
        return None
    q = load_daily_quotes().get(symbol.split(".")[0].strip().upper())
    if not q:
        print(f"ℹ️ [{symbol}] 官方每日收盤查無資料，改用 Yahoo 歷史序列算昨收")
        return None

    last_date = rows[-1]["date"]
    last_price = rows[-1]["raw_close"]
    q_close, q_change, q_date = q["close"], q["change"], q["date"]
    if not last_price or last_price <= 0:
        return None

    def done(prev, how):
        PREV_SOURCE[symbol.split(".")[0].strip().upper()] = "官方" + how
        print(f"✅ [{symbol}] 昨收 {prev} (官方資料: {how}; 官方收盤 {q_close}, 漲跌 {q_change})")
        return prev

    # 官方資料有日期
    if q_date:
        if q_date == last_date:                      # 官方已是最新交易日
            prev = round(q_close - q_change, 4)
            return done(prev, "今日") if prev > 0 else None
        if q_date < last_date:                       # 官方還停在上一個交易日
            return done(q_close, "昨日")
        return None

    # 官方資料沒有日期 (證交所 STOCK_DAY_ALL)：用價格判斷是今天還是昨天的資料
    diff = abs(q_close - last_price) / last_price
    if diff >= 0.002:
        # 與最新價差很多 → 官方還沒更新今天，其收盤價就是昨收 (漲跌停上限 10%)
        if abs(last_price - q_close) / q_close < 0.12:
            return done(q_close, "昨日(尚未更新今日)")
        return None
    # 與最新價幾乎相同：可能是今天已更新，也可能是平盤，用 Yahoo 倒數第二筆輔助判斷
    if len(rows) > 1 and abs(rows[-2]["raw_close"] - q_close) / q_close < 0.002:
        return done(q_close, "昨日(平盤)")
    prev = round(q_close - q_change, 4)
    return done(prev, "今日") if prev > 0 else None

def build_fundamentals(symbol, rows, ttm_dividend):
    """官方 PE/殖利率優先；ETF 等官方沒有殖利率時，以近 12 個月配息 ÷ 現價估算"""
    f = dict(get_fundamentals(symbol))
    f["yield_source"] = "official" if f.get("yield") is not None else None
    if f.get("yield") is None and ttm_dividend and rows:
        price = rows[-1].get("raw_close")
        if price and price > 0:
            f["yield"] = round(ttm_dividend / price * 100, 2)
            f["yield_source"] = "ttm"
    # 官方沒有殖利率，且 Yahoo 近 12 個月也沒有任何配息紀錄 (例如剛上市、尚未配息的 ETF)
    f["no_dividend"] = bool(f.get("yield") is None and rows and not ttm_dividend)
    return f

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
            period2 = int(time.mktime((end_dt + timedelta(days=2)).timetuple()))

            url = f"https://query1.finance.yahoo.com/v8/finance/chart/{yahoo_symbol}?period1={period1}&period2={period2}&interval=1d&events=div"
            req = urllib.request.Request(
                url,
                headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"},
            )

            with urllib.request.urlopen(req, timeout=10, context=ssl_ctx) as response:
                res_data = json.loads(response.read().decode("utf-8"))

            chart_data = res_data.get("chart", {}).get("result", [])
            if not chart_data:
                raise ValueError("Yahoo Finance 回傳空資料")

            result = chart_data[0]
            timestamps = result.get("timestamp", [])
            meta = result.get("meta", {})
            regular_market_price = meta.get("regularMarketPrice")
            quote_indicators = result.get("indicators", {}).get("quote", [{}])[0]
            raw_closes = quote_indicators.get("close", [])

            adj_indicators = result.get("indicators", {}).get("adjclose", [{}])[0]
            adj_closes = adj_indicators.get("adjclose", [])

            if not adj_closes:
                adj_closes = raw_closes
            if not raw_closes:
                raw_closes = adj_closes

            volumes = quote_indicators.get("volume", []) or []

            rows = []
            for _i, (t, rc, ac) in enumerate(zip(timestamps, raw_closes, adj_closes)):
                if t is not None:
                    valid_adj = ac if ac is not None else rc
                    valid_raw = rc if rc is not None else ac

                    if valid_adj is not None and valid_raw is not None:
                        gmtoffset = meta.get("gmtoffset", 28800)
                        dt_str = datetime.datetime.utcfromtimestamp(t + gmtoffset).date().isoformat()
                        row = {
                            "date": dt_str,
                            "close": float(valid_adj),
                            "raw_close": float(valid_raw),
                            "volume": int(round((volumes[_i] or 0) / 1000.0)) if _i < len(volumes) and volumes[_i] else 0,
                        }
                        # Yahoo 偶爾同一天回傳兩筆 (盤中即時價 + 當日日K)，同日只保留最後一筆
                        if rows and rows[-1]["date"] == dt_str:
                            rows[-1] = row
                        else:
                            rows.append(row)

            if rows and regular_market_price is not None:
                latest_raw = float(regular_market_price)
                last_row = rows[-1]

                # 即時價所屬的交易日 (以交易所時區換算)
                market_date = None
                rmt = meta.get("regularMarketTime")
                if rmt:
                    try:
                        market_date = datetime.datetime.utcfromtimestamp(
                            rmt + meta.get("gmtoffset", 28800)
                        ).date().isoformat()
                    except Exception:
                        market_date = None

                if last_row["raw_close"] > 0:
                    ratio = latest_raw / last_row["raw_close"]
                    adj_factor = last_row["close"] / last_row["raw_close"]  # 還原係數

                    if market_date and market_date > last_row["date"]:
                        # Yahoo 尚未提供今天的日K：新增今天這一筆，絕不覆蓋前一個交易日
                        rows.append({
                            "date": market_date,
                            "close": round(latest_raw * adj_factor, 2),
                            "raw_close": latest_raw,
                            "volume": int(round((meta.get("regularMarketVolume") or 0) / 1000.0)),
                        })
                    else:
                        # 最後一筆就是今天：以即時價更新
                        last_row["raw_close"] = latest_raw
                        last_row["close"] = round(last_row["close"] * ratio, 2)

            if not rows:
                raise ValueError("解析後無有效收盤價歷史紀錄")

            # 優先使用 OpenData 全局中文名稱字典
            clean_code = yahoo_symbol.split(".")[0].strip()
            raw_stock_name = STOCK_NAME_MAP.get(clean_code)
            
            # 若字典仍查無，對上櫃股票 (.TWO) 發動動態備援查詢
            if not raw_stock_name and ".TWO" in yahoo_symbol:
                raw_stock_name = fetch_single_tpex_name(clean_code)
                if raw_stock_name:
                    STOCK_NAME_MAP[clean_code] = raw_stock_name

            # 最後防線才使用 Yahoo 回傳名稱
            if not raw_stock_name:
                raw_stock_name = meta.get("shortName") or meta.get("longName") or clean_code

            stock_name = clean_stock_name(raw_stock_name)

            # 前一交易日實際收盤價 (取自歷史序列倒數第二筆；
            # 不可用 meta.chartPreviousClose，那是圖表區間起點之前的收盤價)
            _code = yahoo_symbol.split(".")[0].strip().upper()
            PREV_SOURCE.pop(_code, None)
            previous_close = official_previous_close(yahoo_symbol, rows)
            if previous_close is None:
                previous_close = rows[-2]["raw_close"] if len(rows) > 1 else None
                PREV_SOURCE[_code] = "Yahoo歷史(備援)"

            # 近 12 個月配息總和 (Yahoo events=div，ETF 沒有官方殖利率時用來計算)
            ttm_dividend = 0.0
            try:
                cutoff = time.time() - 365 * 86400
                divs = (result.get("events", {}) or {}).get("dividends", {}) or {}
                for d in divs.values():
                    ts = d.get("date")
                    amt = d.get("amount")
                    if ts is not None and amt is not None and ts >= cutoff:
                        ttm_dividend += float(amt)
            except Exception as e:
                print(f"⚠️ 配息資料解析失敗: {e}")

            return yahoo_symbol, rows, stock_name, previous_close, ttm_dividend

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

        if parsed.path == "/api/debug":
            query = urllib.parse.parse_qs(parsed.query)
            raw_symbol = query.get("symbol", ["0050"])[0]
            code = raw_symbol.split(".")[0].strip().upper()
            info = {"server_version": SERVER_VERSION}
            try:
                actual_symbol, data, _n, prev, ttm = fetch_yahoo_symbol_with_retry(raw_symbol, "tw", "1")
                info.update({
                    "symbol": actual_symbol,
                    "last_5_rows": data[-5:],
                    "previous_close_used": prev,
                    "prev_source": PREV_SOURCE.get(code, ""),
                    "ttm_dividend": ttm,
                })
            except Exception as exc:
                info["yahoo_error"] = str(exc)
            dq = load_daily_quotes()
            info["daily_quotes_loaded"] = len(dq)
            info["official_daily_quote"] = dq.get(code)
            fd = load_fundamentals()
            info["fundamentals_loaded"] = len(fd)
            info["official_fundamentals"] = fd.get(code)
            self.send_json(200, info)
            return

        if parsed.path == "/api/names":
            self.send_json(200, STOCK_NAME_MAP)
            return

        if parsed.path == "/api/yahoo":
            query = urllib.parse.parse_qs(parsed.query)
            raw_symbol = query.get("symbol", [""])[0]
            market = query.get("market", ["tw"])[0]
            years = query.get("years", ["3.5"])[0]
            try:
                actual_symbol, data, stock_name, previous_close, ttm_dividend = fetch_yahoo_symbol_with_retry(
                    raw_symbol, market, years
                )
                self.send_json(
                    200,
                    {
                        "symbol": actual_symbol,
                        "name": stock_name,
                        "source": "Yahoo Finance",
                        "fundamentals": build_fundamentals(actual_symbol, data, ttm_dividend),
                        "rows": data,
                        "previous_close": previous_close,
                        "prev_source": PREV_SOURCE.get(actual_symbol.split(".")[0].strip().upper(), ""),
                        "server_version": SERVER_VERSION,
                    },
                )
            except Exception as exc:
                self.send_json(400, {"error": str(exc)})
            return

        if parsed.path == "/api/chip":
            query = urllib.parse.parse_qs(parsed.query)
            raw_symbol = query.get("symbol", [""])[0]
            chip_data = fetch_chip_data(raw_symbol)
            if chip_data:
                self.send_json(200, chip_data)
            else:
                self.send_json(200, {"error": "尚未發布盤後籌碼或非台股標的"})
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
    update_stock_names_from_api()
    server = ThreadingHTTPServer((HOST, PORT), Handler)
    print(f"🚀 Render Cloud Stock Server Started on Port {PORT}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    server.server_close()