const TW_STOCK_NAMES = {
  "1101":"台泥","1102":"亞泥","1216":"統一","1301":"台塑","1303":"南亞","1326":"台化",
  "1402":"遠東新","1476":"儒鴻","1504":"東元","1590":"亞德客","1605":"華新",
  "2002":"中鋼","2006":"東和鋼鐵","2015":"豐興","2049":"上銀","2059":"川湖",
  "2101":"南港","2105":"正新","2207":"和泰車","2227":"裕日車","2231":"為升",
  "2301":"光寶科","2303":"聯電","2308":"台達電","2312":"金寶","2317":"鴻海",
  "2324":"仁寶","2327":"國巨","2330":"台積電","2337":"旺宏","2344":"華邦電",
  "2347":"聯強","2352":"佳世達","2353":"宏碁","2354":"鴻準","2356":"英業達",
  "2357":"華碩","2358":"廷鑫","2360":"致茂","2363":"矽統","2371":"大同",
  "2376":"技嘉","2377":"微星","2379":"瑞昱","2382":"廣達","2383":"台光電",
  "2385":"群光","2388":"威盛","2392":"正崴","2393":"億光","2395":"研華",
  "2397":"友通","2399":"映泰","2401":"聯陽","2404":"漢唐","2408":"南亞科",
  "2409":"友達","2412":"中華電","2414":"精技","2420":"新日興","2423":"固緯",
  "2426":"鑫創","2429":"銘異","2430":"燦坤","2439":"美律","2441":"超豐",
  "2449":"京元電","2454":"聯發科","2458":"義隆","2474":"可成","2475":"矽創",
  "2481":"強茂","2489":"瑞軒","2492":"華新科","2496":"卓越","2498":"宏達電",
  "2501":"國建","2502":"長谷","2542":"興富發","2545":"皇翔","2548":"華固",
  "2601":"益航","2603":"長榮","2606":"裕民","2609":"陽明","2610":"華航",
  "2615":"萬海","2618":"長榮航","2707":"晶華","2727":"王品","2809":"京城銀",
  "2812":"台中銀","2820":"華泰銀","2834":"臺企銀","2836":"安泰銀","2838":"聯邦銀",
  "2845":"遠東銀","2849":"安泰金","2850":"新產","2851":"中再保","2852":"第一保",
  "2880":"華南金","2881":"富邦金","2882":"國泰金","2883":"開發金","2884":"玉山金",
  "2885":"元大金","2886":"兆豐金","2887":"台新金","2888":"新光金","2889":"國票金",
  "2890":"永豐金","2891":"中信金","2892":"第一金","2912":"統一超","3008":"大立光",
  "3014":"聯陽","3017":"奇鋐","3019":"亞泰","3022":"威剛","3034":"聯詠",
  "3035":"智原","3037":"欣興","3041":"揚智","3042":"晶技","3044":"健鼎",
  "3045":"台灣大","3046":"建碁","3047":"訊舟","3051":"力特","3052":"夆典",
  "3054":"立積","3057":"喬鼎","3058":"立誠","3059":"鴻鈞","3085":"比比昂",
  "3086":"華義","3088":"艾雷斯","3094":"聯傑","3105":"穩懋","3106":"楊博",
  "3130":"一零四","3149":"正達","3150":"萬達通","3189":"景碩","3231":"緯創",
  "3234":"光環","3293":"鈊象","3294":"英濟","3406":"玉晶光","3443":"創意",
  "3481":"群創","3504":"揚明光","3529":"力旺","3533":"嘉澤","3545":"旭隼",
  "3673":"TPK","3682":"亞太電","3689":"湧德","3698":"隆達","3702":"大聯大",
  "3706":"神達","3711":"日月光投控","3714":"富采","3715":"定穎投控","3726":"皇電",
  "3760":"泓格","3762":"鑫龍騰","3769":"楠梓電","3776":"長科","4104":"佳醫",
  "4108":"懷特","4137":"麗豐-KY","4147":"中裕","4148":"全宇生技","4164":"基亞",
  "4174":"浩鼎","4180":"嘉進","4183":"福永興","4205":"中華食","4303":"信昌電",
  "4438":"廣越","4509":"恒耀","4551":"智崴","4966":"譜瑞-KY","5007":"三星",
  "5009":"榮剛","5014":"中連貨","5015":"華祺","5016":"鑠禧","5212":"凌網",
  "5215":"科定","5234":"達興材料","5288":"豐藝","5347":"世界","5349":"先豐",
  "5371":"中光電","5381":"合正","5388":"中磊","5398":"拓墣","5434":"崇越電",
  "5522":"遠雄","5533":"皇昌","5536":"聖暉","5538":"東明","5546":"永信建",
  "5608":"四維航","5871":"中租-KY","5876":"上海商銀","5880":"合庫金",
  "6005":"群益證","6104":"創惟","6112":"聚碩","6116":"彩晶","6121":"新普","6133":"金橋",
  "6153":"嘉聯益","6196":"帆宣","6197":"佳必義","6201":"亞弘電","6202":"盛群",
  "6204":"艾訊","6208":"日揚","6215":"和椿","6216":"居易","6220":"岱稜",
  "6225":"旺矽","6230":"超眾","6239":"力成","6243":"迅杰","6257":"矽瑪",
  "6261":"久元","6262":"倚天酷碁","6269":"台郡","6271":"同欣電","6274":"台燿",
  "6278":"台表科","6279":"胡連","6281":"全國電","6282":"康舒","6285":"啟碁",
  "6290":"良維","6291":"沛亨","6294":"智晶","6295":"捷力",
  "6355":"信紘科","6409":"旭隼","6414":"樺漢","6415":"矽力-KY","6416":"瑞祺電通",
  "6488":"環球晶","6505":"台塑化","6510":"精測","6515":"穎崴","6516":"勤誠",
  "6533":"晶心科","6592":"和潤企業","6605":"帝寶","6618":"台康生技","6625":"必應",
  "6669":"緯穎","6679":"台嘉碩","6691":"洋基工程","6719":"力旺","6770":"力積電",
  "8046":"南電","8048":"德勝","8050":"廣積","8069":"元太","8086":"宏捷科",
  "8150":"南茂","8215":"明基材","8299":"群聯","8341":"日友","8410":"森崴能源",
  "8422":"可寧衛","8436":"大江","8437":"大學光","8448":"遠傳","8454":"富邦媒",
  "9904":"寶成","9910":"豐泰","9917":"中保科","9921":"巨大","9933":"中鼎",
  "9938":"百和","9939":"宏全","9945":"潤泰全",
};[cite: 13]

const STOCK_FUNDAMENTALS = {
  "1101": { eps: 2.2, dividend: 1.5 },
  "1102": { eps: 2.8, dividend: 2.1 },
  "1216": { eps: 7.2, dividend: 5.5 },
  "2303": { eps: 4.5, dividend: 3.0 },
  "2308": { eps: 12.8, dividend: 8.0 },
  "2317": { eps: 10.2, dividend: 5.4 },
  "2330": { eps: 38.2, dividend: 16.0 },
  "2379": { eps: 26.0, dividend: 18.0 },
  "2382": { eps: 10.3, dividend: 7.2 },
  "2412": { eps: 4.8, dividend: 4.7 },
  "2454": { eps: 48.5, dividend: 30.4 },
  "2881": { eps: 4.8, dividend: 2.5 },
  "2882": { eps: 3.6, dividend: 2.0 },
  "2884": { eps: 1.6, dividend: 1.2 },
  "2886": { eps: 2.37, dividend: 1.5 },
  "2891": { eps: 2.82, dividend: 1.8 },
  "1476": { eps: 22.0, dividend: 17.0 },
  "1477": { eps: 15.0, dividend: 12.2 },
  "9939": { eps: 7.8, dividend: 5.5 },
  "0050": { eps: 0, dividend: 6.2 },
  "0056": { eps: 0, dividend: 3.6 },
  "00878": { eps: 0, dividend: 1.4 },
  "AAPL": { eps: 6.5, dividend: 1.0 },
  "MSFT": { eps: 11.8, dividend: 3.0 },
  "NVDA": { eps: 1.8, dividend: 0.04 },
};[cite: 13]

function getFundamentals(symbol, currentPrice) {
  if (!symbol) return { eps: 10, dividend: 4 };[cite: 13]
  const code = symbol.replace(/\.(TW|TWO)$/i, "").toUpperCase();[cite: 13]
  if (STOCK_FUNDAMENTALS[code]) {
    return STOCK_FUNDAMENTALS[code];[cite: 13]
  }
  const estimatedEps = +(currentPrice / 16).toFixed(2);[cite: 13]
  const estimatedDiv = +(currentPrice * 0.04).toFixed(2);[cite: 13]
  return { eps: estimatedEps, dividend: estimatedDiv };[cite: 13]
}

function getStockName(symbol) {
  if (!symbol) return "";[cite: 13]
  const code = symbol.replace(/\.(TW|TWO)$/i, "").toUpperCase();[cite: 13]
  return TW_STOCK_NAMES[code] || "";[cite: 13]
}

function formatSymbolDisplay(symbol) {
  const name = getStockName(symbol);[cite: 13]
  return name ? `${symbol} ${name}` : symbol;[cite: 13]
}

// 💡 自動偵測市場並設定選單
function autoDetectMarket(symbol) {
  if (!symbol) return;
  const cleanSymbol = symbol.trim().toUpperCase();
  
  if (cleanSymbol.endsWith('.TWO')) {
    market.value = 'two';
  } else if (cleanSymbol.endsWith('.TW')) {
    market.value = 'tw';
  } else if (/^\d{4,5}$/.test(cleanSymbol)) {
    // 純數字 (4-5碼) 預設為台股上市
    market.value = 'tw';
  } else if (/^[A-Z]{1,5}$/.test(cleanSymbol)) {
    // 英文代碼預設為美股
    market.value = 'us';
  }
}

const csvInput = document.querySelector("#csvInput");[cite: 13]
const market = document.querySelector("#market");[cite: 13]
const symbolInput = document.querySelector("#symbolInput");[cite: 13]
const fetchSymbolBtn = document.querySelector("#fetchSymbolBtn");[cite: 13]
const fetchStatus = document.querySelector("#fetchStatus");[cite: 13]
const periodYears = document.querySelector("#periodYears");[cite: 13]
const modelMode = document.querySelector("#modelMode");[cite: 13]
const chart = document.querySelector("#chart");[cite: 13]
const chartTitle = document.querySelector("#chartTitle");[cite: 13]
const rangeText = document.querySelector("#rangeText");[cite: 13]
const zoneText = document.querySelector("#zoneText");[cite: 13]
const closeText = document.querySelector("#closeText");[cite: 13]
const r2Text = document.querySelector("#r2Text");[cite: 13]
const levelsTable = document.querySelector("#levelsTable");[cite: 13]

const peText = document.querySelector("#peText");[cite: 13]
const yieldText = document.querySelector("#yieldText");[cite: 13]

const watchlistInput = document.querySelector("#watchlistInput");[cite: 13]
const btnWatchlist = document.querySelector("#btnWatchlist");[cite: 13]
const btnClearWatchlist = document.querySelector("#btnClearWatchlist");[cite: 13]
const watchlistResult = document.querySelector("#watchlistResult");[cite: 13]
const watchlistStatus = document.querySelector("#watchlistStatus");[cite: 13]

const addWatchlistInput = document.querySelector("#addWatchlistInput");[cite: 13]
const btnAddWatchlistSingle = document.querySelector("#btnAddWatchlistSingle");[cite: 13]
const removeWatchlistSelect = document.querySelector("#removeWatchlistSelect");[cite: 13]
const btnRemoveWatchlistSingle = document.querySelector("#btnRemoveWatchlistSingle");[cite: 13]

const btnExportWatchlist = document.querySelector("#btnExportWatchlist");[cite: 13]
const btnImportWatchlist = document.querySelector("#btnImportWatchlist");[cite: 13]

const watchlistSearch = document.querySelector("#watchlistSearch");[cite: 13]
const watchlistFilterZone = document.querySelector("#watchlistFilterZone");[cite: 13]
const watchlistSort = document.querySelector("#watchlistSort");[cite: 13]

let deletedWatchlistBackup = "";[cite: 13]
let scannedWatchlistCache = [];[cite: 13]

const levelDefs = [
  { key: "plus2", label: "+2SD 樂觀線", color: "#c94b4b" },[cite: 13]
  { key: "plus1", label: "+1SD 相對樂觀線", color: "#d9852b" },[cite: 13]
  { key: "mid", label: "中線", color: "#2c6ebd" },[cite: 13]
  { key: "minus1", label: "-1SD 相對悲觀線", color: "#1f8a63" },[cite: 13]
  { key: "minus2", label: "-2SD 悲觀線", color: "#12614a" },[cite: 13]
];

document.addEventListener("DOMContentLoaded", () => {
  const savedWatchlist = localStorage.getItem("lohas_watchlist");[cite: 13]
  if (savedWatchlist) {
    watchlistInput.value = savedWatchlist;[cite: 13]
  }

  const savedLastSymbol = localStorage.getItem("lohas_last_symbol");[cite: 13]
  const savedLastMarket = localStorage.getItem("lohas_last_market");[cite: 13]
  if (savedLastSymbol) symbolInput.value = savedLastSymbol;[cite: 13]
  if (savedLastMarket) market.value = savedLastMarket;[cite: 13]

  updateRemoveSelect();[cite: 13]

  watchlistSearch.addEventListener("input", updateWatchlistDisplay);[cite: 13]
  watchlistFilterZone.addEventListener("change", updateWatchlistDisplay);[cite: 13]
  watchlistSort.addEventListener("change", updateWatchlistDisplay);[cite: 13]

  // 💡 監聽單檔查詢輸入框，實現自動切換市場
  if (symbolInput) {
    symbolInput.addEventListener("input", (e) => {
      autoDetectMarket(e.target.value);
    });
  }

  // 💡 頁面開啟時自動讀取 localStorage 中的快取資料（不發送 API 請求）
  loadWatchlistFromCache();[cite: 13]
});

// 💡 快取讀取邏輯
function loadWatchlistFromCache() {
  const cachedData = localStorage.getItem("lohas_watchlist_cache_data");[cite: 13]
  const cachedTime = localStorage.getItem("lohas_watchlist_cache_time");[cite: 13]

  if (cachedData && cachedTime) {
    try {
      scannedWatchlistCache = JSON.parse(cachedData);[cite: 13]
      updateWatchlistDisplay();[cite: 13]
      watchlistStatus.textContent = `📁 上次暫存 (儲存於 ${cachedTime})`;[cite: 13]
      watchlistStatus.style.color = "#64748b"; // 使用柔和灰色強調是暫存[cite: 13]
    } catch (e) {
      console.error("讀取快取失敗", e);[cite: 13]
    }
  }
}

function updateRemoveSelect() {
  if (!removeWatchlistSelect) return;[cite: 13]
  const currentText = watchlistInput.value || "";[cite: 13]
  const syms = currentText.split(",").map(s => s.trim().toUpperCase()).filter(s => s);[cite: 13]
  
  removeWatchlistSelect.innerHTML = "";[cite: 13]
  if (syms.length === 0) {
    const opt = document.createElement("option");[cite: 13]
    opt.value = "";[cite: 13]
    opt.textContent = "📭 清單為空";[cite: 13]
    removeWatchlistSelect.appendChild(opt);[cite: 13]
    return;[cite: 13]
  }
  
  syms.forEach(sym => {
    const opt = document.createElement("option");[cite: 13]
    opt.value = sym;[cite: 13]
    opt.textContent = sym;[cite: 13]
    removeWatchlistSelect.appendChild(opt);[cite: 13]
  });
}

btnAddWatchlistSingle.addEventListener("click", async () => {
  const newSym = addWatchlistInput.value.trim().toUpperCase();[cite: 13]
  if (!newSym) return;[cite: 13]
  
  const currentText = watchlistInput.value || "";[cite: 13]
  const syms = currentText.split(",").map(s => s.trim().toUpperCase()).filter(s => s);[cite: 13]
  
  if (syms.includes(newSym)) {
    watchlistStatus.textContent = `⚠️ 股號 ${newSym} 已在清單中！`;[cite: 13]
    return;[cite: 13]
  }
  
  if (syms.length >= 15) {
    watchlistStatus.textContent = "⚠️ 監控清單最多只能 15 支股票喔！";[cite: 13]
    return;[cite: 13]
  }
  
  syms.push(newSym);[cite: 13]
  watchlistInput.value = syms.join(", ");[cite: 13]
  localStorage.setItem("lohas_watchlist", watchlistInput.value);[cite: 13]
  addWatchlistInput.value = "";[cite: 13]
  
  updateRemoveSelect();[cite: 13]
  watchlistStatus.textContent = `➕ 正在即時新增並計算 ${newSym}...`;[cite: 13]
  
  try {
    const data = await fetchLevelForWatchlist(newSym);[cite: 13]
    scannedWatchlistCache.push(data);[cite: 13]
    updateWatchlistDisplay();[cite: 13]
    
    // 更新快取
    saveWatchlistCache();[cite: 13]
    watchlistStatus.textContent = `✅ 已成功新增 ${newSym}！`;[cite: 13]
    watchlistStatus.style.color = "var(--blue)";[cite: 13]
  } catch (err) {
    watchlistStatus.textContent = `❌ 即時新增 ${newSym} 失敗，請點擊「執行批量更新」。`;[cite: 13]
  }
});

btnRemoveWatchlistSingle.addEventListener("click", () => {
  const toRemove = removeWatchlistSelect.value;[cite: 13]
  if (!toRemove || toRemove === "📭 清單為空") return;[cite: 13]
  
  const currentText = watchlistInput.value || "";[cite: 13]
  const syms = currentText.split(",").map(s => s.trim().toUpperCase()).filter(s => s);[cite: 13]
  
  const filtered = syms.filter(s => s !== toRemove);[cite: 13]
  watchlistInput.value = filtered.join(", ");[cite: 13]
  localStorage.setItem("lohas_watchlist", watchlistInput.value);[cite: 13]
  
  updateRemoveSelect();[cite: 13]
  watchlistStatus.textContent = `➖ 已刪除 ${toRemove}`;[cite: 13]
  watchlistStatus.style.color = "var(--blue)";[cite: 13]
  
  scannedWatchlistCache = scannedWatchlistCache.filter(item => {
    const symClean = item.sym.replace(".TW", "").replace(".TWO", "").toUpperCase();[cite: 13]
    return symClean !== toRemove;[cite: 13]
  });
  updateWatchlistDisplay();[cite: 13]
  saveWatchlistCache();[cite: 13]
});

function saveWatchlistCache() {
  const nowStr = new Date().toLocaleString("zh-TW", { 
    year: 'numeric', month: '2-digit', day: '2-digit', 
    hour: '2-digit', minute: '2-digit', hour12: false 
  });[cite: 13]
  localStorage.setItem("lohas_watchlist_cache_data", JSON.stringify(scannedWatchlistCache));[cite: 13]
  localStorage.setItem("lohas_watchlist_cache_time", nowStr);[cite: 13]
}

function regression(values) {
  const n = values.length;[cite: 13]
  const sumX = values.reduce((s, p) => s + p.x, 0);[cite: 13]
  const sumY = values.reduce((s, p) => s + p.y, 0);[cite: 13]
  const meanX = sumX / n;[cite: 13]
  const meanY = sumY / n;[cite: 13]
  let num = 0, den = 0;[cite: 13]
  for (const p of values) {
    num += (p.x - meanX) * (p.y - meanY);[cite: 13]
    den += (p.x - meanX) ** 2;[cite: 13]
  }
  const slope = den === 0 ? 0 : num / den;[cite: 13]
  const intercept = meanY - slope * meanX;[cite: 13]
  const fitted = values.map(p => intercept + slope * p.x);[cite: 13]
  const residuals = values.map((p, i) => p.y - fitted[i]);[cite: 13]
  const sd = Math.sqrt(residuals.reduce((s, r) => s + r ** 2, 0) / (n - 2 || 1));[cite: 13]
  const ssTot = values.reduce((s, p) => s + (p.y - meanY) ** 2, 0);[cite: 13]
  const ssRes = residuals.reduce((s, r) => s + r ** 2, 0);[cite: 13]
  const r2 = ssTot === 0 ? 1 : Math.max(0, 1 - ssRes / ssTot);[cite: 13]
  return { intercept, slope, sd, r2 };[cite: 13]
}

function buildAnalysis(data, currentMode = modelMode.value, currentYears = periodYears.value) {
  const years = (currentYears === "all") ? 10 : Number(currentYears);[cite: 13]
  const lastDate = new Date(data[data.length - 1].date);[cite: 13]
  const cutoff = new Date(lastDate);[cite: 13]
  cutoff.setDate(cutoff.getDate() - Math.round(years * 365));[cite: 13]
  const filtered = data.filter(p => new Date(p.date) >= cutoff);[cite: 13]
  if (filtered.length < 10) throw new Error("資料不足");[cite: 13]
  
  const startTime = new Date(filtered[0].date).getTime();[cite: 13]
  const useLog = currentMode === "log";[cite: 13]
  const points = filtered.map(p => ({
    ...p,
    x: (new Date(p.date).getTime() - startTime) / 86400000,
    y: useLog ? Math.log(p.close) : p.close
  }));[cite: 13]

  const fit = regression(points);[cite: 13]
  return points.map(p => {
    const midRaw = fit.intercept + fit.slope * p.x;[cite: 13]
    const conv = (v) => useLog ? Math.exp(v) : v;[cite: 13]
    return {
      ...p,
      plus2: conv(midRaw + fit.sd * 2),
      plus1: conv(midRaw + fit.sd),
      mid: conv(midRaw),
      minus1: conv(midRaw - fit.sd),
      minus2: conv(midRaw - fit.sd * 2),
      r2: fit.r2
    };[cite: 13]
  });
}

function priceZone(p) {
  if (p.close >= p.plus2) return "樂觀區上緣";[cite: 13]
  if (p.close >= p.plus1) return "相對樂觀區";[cite: 13]
  if (p.close >= p.mid) return "中線以上";[cite: 13]
  if (p.close >= p.minus1) return "中線以下";[cite: 13]
  if (p.close >= p.minus2) return "相對悲觀區";[cite: 13]
  return "悲觀區下緣";[cite: 13]
}

function getPriceRangeDesc(p) {
  const f = formatPrice;[cite: 13]
  if (p.close >= p.plus2) return `> ${f(p.plus2)} (+2SD 樂觀線)`;[cite: 13]
  if (p.close >= p.plus1) return `${f(p.plus1)} (相對樂觀) ~ ${f(p.plus2)} (樂觀)`;[cite: 13]
  if (p.close >= p.mid) return `${f(p.mid)} (中線) ~ ${f(p.plus1)} (相對樂觀)`;[cite: 13]
  if (p.close >= p.minus1) return `${f(p.minus1)} (相對悲觀) ~ ${f(p.mid)} (中線)`;[cite: 13]
  if (p.close >= p.minus2) return `${f(p.minus2)} (悲觀) ~ ${f(p.minus1)} (相對悲觀)`;[cite: 13]
  return `< ${f(p.minus2)} (-2SD 悲觀線)`;[cite: 13]
}

function getZoneWeight(zoneStr) {
  switch (zoneStr) {
    case "悲觀區下緣": return 1;[cite: 13]
    case "相對悲觀區": return 2;[cite: 13]
    case "中線以下": return 3;[cite: 13]
    case "中線以上": return 4;[cite: 13]
    case "相對樂觀區": return 5;[cite: 13]
    case "樂觀區上緣": return 6;[cite: 13]
    default: return 0;[cite: 13]
  }
}

function formatPrice(v) { 
  return Number(v).toLocaleString("zh-TW", { minimumFractionDigits: 2, maximumFractionDigits: 2 });[cite: 13]
}

function renderChart(analysis) {
  const width = 1000, height = 500;[cite: 13]
  const margin = { top: 35, right: 60, bottom: 45, left: 65 };[cite: 13]
  const last = analysis[analysis.length - 1];[cite: 13]
  
  const minP = Math.min(...analysis.map(p => Math.min(p.close, p.minus2))) * 0.97;[cite: 13]
  const maxP = Math.max(...analysis.map(p => Math.max(p.close, p.plus2))) * 1.03;[cite: 13]
  
  const x = (i) => margin.left + (i / (analysis.length - 1)) * (width - margin.left - margin.right);[cite: 13]
  const y = (val) => height - margin.bottom - ((val - minP) / (maxP - minP)) * (height - margin.top - margin.bottom);[cite: 13]

  let yTicksHtml = "";[cite: 13]
  for (let i = 0; i <= 4; i++) {
    const tickVal = minP + (i / 4) * (maxP - minP);[cite: 13]
    const tickY = y(tickVal);[cite: 13]
    yTicksHtml += `
      <line x1="${margin.left}" y1="${tickY}" x2="${width - margin.right}" y2="${tickY}" stroke="#e2e8f0" stroke-width="1" stroke-dasharray="4 4" />
      <text x="${margin.left - 10}" y="${tickY + 4}" fill="#64748b" font-size="12" text-anchor="end">${formatPrice(tickVal)}</text>
    `;[cite: 13]
  }

  let xTicksHtml = "";[cite: 13]
  const totalCount = analysis.length;[cite: 13]
  const step = Math.floor(totalCount / 4);[cite: 13]
  const indices = [0, step, step * 2, step * 3, totalCount - 1];[cite: 13]
  
  indices.forEach(idx => {
    if (analysis[idx]) {
      const tickX = x(idx);[cite: 13]
      const rawDate = analysis[idx].date;[cite: 13]
      xTicksHtml += `
        <line x1="${tickX}" y1="${height - margin.bottom}" x2="${tickX}" y2="${height - margin.bottom + 6}" stroke="#94a3b8" stroke-width="1" />
        <text x="${tickX}" y="${height - margin.bottom + 22}" fill="#64748b" font-size="12" text-anchor="middle">${rawDate}</text>
      `;[cite: 13]
    }
  });

  const pathsHtml = levelDefs.map(l => {
    const pointsStr = analysis.map((p, i) => `${x(i)},${y(p[l.key])}`).join(" ");[cite: 13]
    return `<polyline points="${pointsStr}" fill="none" stroke="${l.color}" stroke-width="${l.key === 'mid' ? 2.5 : 1.2}" opacity="0.75" />`;[cite: 13]
  }).join("");[cite: 13]

  const closePointsStr = analysis.map((p, i) => `${x(i)},${y(p.close)}`).join(" ");[cite: 13]

  chart.innerHTML = `
    <svg id="svgChart" viewBox="0 0 ${width} ${height}" style="background:#fff; border-radius:12px; width:100%; height:100%;">
      <line x1="${margin.left}" y1="${height - margin.bottom}" x2="${width - margin.right}" y2="${height - margin.bottom}" stroke="#94a3b8" stroke-width="1.5" />
      <line x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${height - margin.bottom}" stroke="#94a3b8" stroke-width="1.5" />
      
      ${yTicksHtml}
      ${xTicksHtml}
      ${pathsHtml}
      
      <polyline points="${closePointsStr}" fill="none" stroke="#0f172a" stroke-width="2.5" />
      
      ${(last.close >= last.plus2 || last.close <= last.minus2) ? `
        <circle cx="${x(totalCount - 1)}" cy="${y(last.close)}" r="10" fill="${last.close >= last.plus2 ? '#c94b4b' : '#12614a'}" opacity="0.4">
          <animate attributeName="r" from="6" to="18" dur="1.2s" repeatCount="indefinite"/>
          <animate attributeName="opacity" from="0.6" to="0" dur="1.2s" repeatCount="indefinite"/>
        </circle>
      ` : ""}
      <circle cx="${x(totalCount - 1)}" cy="${y(last.close)}" r="5" fill="#0f172a" />
      
      <line id="tooltipLine" x1="0" y1="${margin.top}" x2="0" y2="${height - margin.bottom}" stroke="#64748b" stroke-width="1" stroke-dasharray="3 3" style="display:none;" />
    </svg>
  `;[cite: 13]

  const svg = document.querySelector("#svgChart");[cite: 13]
  const tooltipLine = document.querySelector("#tooltipLine");[cite: 13]
  const chartTooltip = document.querySelector("#chartTooltip");[cite: 13]

  if (svg && tooltipLine && chartTooltip) {
    const handleMove = (e) => {
      const rect = svg.getBoundingClientRect();[cite: 13]
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;[cite: 13]
      const relativeX = ((clientX - rect.left) / rect.width) * width;[cite: 13]
      
      if (relativeX >= margin.left && relativeX <= width - margin.right) {
        const dataWidth = width - margin.left - margin.right;[cite: 13]
        const ratio = (relativeX - margin.left) / dataWidth;[cite: 13]
        const index = Math.round(ratio * (totalCount - 1));[cite: 13]
        
        if (analysis[index]) {
          const point = analysis[index];[cite: 13]
          const currX = x(index);[cite: 13]

          tooltipLine.setAttribute("x1", currX);[cite: 13]
          tooltipLine.setAttribute("x2", currX);[cite: 13]
          tooltipLine.style.display = "block";[cite: 13]

          let tooltipLeft = currX + 15;[cite: 13]
          if (tooltipLeft + 190 > width) {
            tooltipLeft = currX - 215;[cite: 13]
          }
          const scaleX = rect.width / width;[cite: 13]
          const scaleY = rect.height / height;[cite: 13]

          chartTooltip.style.display = "block";[cite: 13]
          chartTooltip.style.left = `${tooltipLeft * scaleX}px`;[cite: 13]
          chartTooltip.style.top = `${15 * scaleY}px`;[cite: 13]

          const symbolCode = symbolInput.value.trim().toUpperCase();[cite: 13]
          const pFun = getFundamentals(symbolCode, point.close);[cite: 13]
          const histPe = pFun.eps > 0 ? `${(point.close / pFun.eps).toFixed(1)}x` : "N/A (ETF)";[cite: 13]
          const histYield = `${((pFun.dividend / point.close) * 100).toFixed(2)}%`;[cite: 13]

          chartTooltip.innerHTML = `
            <div class="title">${point.date}</div>
            <div><span>收盤價:</span><strong>${formatPrice(point.raw_close || point.close)}</strong></div>
            <div><span>本益比:</span><strong style="color:var(--blue);">${histPe}</strong></div>
            <div><span>估計殖利率:</span><strong style="color:var(--green);">${histYield}</strong></div>
            <div style="border-top:1px dashed rgba(255,255,255,0.15); margin-top:4px; padding-top:4px;"><span>+2SD 樂觀:</span><span>${formatPrice(point.plus2)}</span></div>
            <div><span>+1SD 偏樂:</span><span>${formatPrice(point.plus1)}</span></div>
            <div><span>中線:</span><span>${formatPrice(point.mid)}</span></div>
            <div><span>-1SD 偏悲:</span><span>${formatPrice(point.minus1)}</span></div>
            <div><span>-2SD 悲觀:</span><span>${formatPrice(point.minus2)}</span></div>
          `;[cite: 13]
        }
      } else {
        hideTooltip();[cite: 13]
      }
    };

    const hideTooltip = () => {
      tooltipLine.style.display = "none";[cite: 13]
      chartTooltip.style.display = "none";[cite: 13]
    };

    svg.addEventListener("mousemove", handleMove);[cite: 13]
    svg.addEventListener("mouseleave", hideTooltip);[cite: 13]
    svg.addEventListener("touchstart", handleMove, { passive: true });[cite: 13]
    svg.addEventListener("touchmove", handleMove, { passive: true });[cite: 13]
    svg.addEventListener("touchend", hideTooltip);[cite: 13]
  }
}

function render() {
  try {
    const data = JSON.parse(csvInput.value);[cite: 13]
    const analysis = buildAnalysis(data);[cite: 13]
    const last = analysis[analysis.length - 1];[cite: 13]
    
    if (zoneText) {
      zoneText.textContent = priceZone(last);[cite: 13]
      zoneText.style.color = (last.close >= last.plus2) ? "#c94b4b" : (last.close <= last.minus2 ? "#12614a" : "var(--ink)");[cite: 13]
    }
    if (closeText) closeText.textContent = formatPrice(last.raw_close || last.close);[cite: 13]
    if (r2Text) r2Text.textContent = last.r2.toFixed(3);[cite: 13]
    if (rangeText) rangeText.textContent = getPriceRangeDesc(last);[cite: 13]
    
    const symbolCode = symbolInput.value.trim().toUpperCase();[cite: 13]
    const fun = getFundamentals(symbolCode, last.close);[cite: 13]
    if (peText) {
      peText.textContent = fun.eps > 0 ? `${(last.close / fun.eps).toFixed(1)} 倍` : "N/A (ETF)";[cite: 13]
    }
    if (yieldText) {
      yieldText.textContent = `${((fun.dividend / last.close) * 100).toFixed(2)} %`;[cite: 13]
    }

    renderChart(analysis);[cite: 13]
    if (levelsTable) {
      levelsTable.innerHTML = levelDefs.map(l => `<tr><td>${l.label}</td><td>${formatPrice(last[l.key])}</td><td>${priceZone(last) === l.label ? "●" : ""}</td></tr>`).join("");[cite: 13]
    }
  } catch (e) {
    console.error("渲染出錯：", e);[cite: 13]
  }
}

async function loadMainChipData(symbol) {
  const chipEl = document.querySelector("#chipText");[cite: 13]
  if (!chipEl) return;[cite: 13]

  chipEl.innerHTML = `<span style="color:var(--muted); font-size:0.85em;">🔍 正在讀取三大法人籌碼...</span>`;[cite: 13]

  try {
    const res = await fetch(`/api/chip?symbol=${encodeURIComponent(symbol)}`);[cite: 13]
    const chip = await res.json();[cite: 13]
    if (!chip || chip.error) {
      chipEl.innerHTML = `<span style="color:var(--muted); font-size:0.85em;">尚無今日盤後籌碼資料或非台股標的</span>`;[cite: 13]
      return;[cite: 13]
    }

    const fmtDiff = (num) => {
      const color = num > 0 ? "#c94b4b" : (num < 0 ? "#1f8a63" : "inherit");[cite: 13]
      const sign = num > 0 ? "+" : "";[cite: 13]
      return `<strong style="color:${color};">${sign}${(num || 0).toLocaleString()}</strong>`;[cite: 13]
    };
    const fmtVal = (num) => (num || 0).toLocaleString();[cite: 13]

    const fBuy = chip.foreign_buy || 0;[cite: 13]
    const fSell = chip.foreign_sell || 0;[cite: 13]
    const tBuy = chip.trust_buy || 0;[cite: 13]
    const tSell = chip.trust_sell || 0;[cite: 13]
    const dBuy = chip.dealer_buy || 0;[cite: 13]
    const dSell = chip.dealer_sell || 0;[cite: 13]

    const foreignTip = (fBuy || fSell) ? `<span class="tooltiptext">買進 ${fmtVal(fBuy)} | 賣出 ${fmtVal(fSell)}</span>` : "";[cite: 13]
    const trustTip = (tBuy || tSell) ? `<span class="tooltiptext">買進 ${fmtVal(tBuy)} | 賣出 ${fmtVal(tSell)}</span>` : "";[cite: 13]
    const dealerTip = (dBuy || dSell) ? `<span class="tooltiptext">買進 ${fmtVal(dBuy)} | 賣出 ${fmtVal(dSell)}</span>` : "";[cite: 13]

    chipEl.innerHTML = `
      (${chip.date}) : 
      <span class="chip-item">外資 ${fmtDiff(chip.foreign)} 張${foreignTip}</span> | 
      <span class="chip-item">投信 ${fmtDiff(chip.trust)} 張${trustTip}</span> | 
      <span class="chip-item">自營 ${fmtDiff(chip.dealer)} 張${dealerTip}</span> | 
      合計 ${fmtDiff(chip.total)} 張
    `;[cite: 13]
  } catch (e) {
    chipEl.innerHTML = `<span style="color:var(--muted); font-size:0.85em;">籌碼讀取失敗</span>`;[cite: 13]
  }
}

async function fetchLevelForWatchlist(symbol) {
  let finalSym = symbol.trim().toUpperCase();[cite: 13]
  if (!finalSym.includes(".") && /^\d+$/.test(finalSym)) finalSym += ".TW";[cite: 13]
  const p = new URLSearchParams({ symbol: finalSym.replace(".TW","").replace(".TWO",""), market: finalSym.includes(".TWO") ? "two" : (finalSym.includes(".TW") ? "tw" : "us"), years: "3.5" });[cite: 13]
  
  const res = await fetch(`/api/yahoo?${p.toString()}`);[cite: 13]
  if (!res.ok) throw new Error();[cite: 13]
  const json = await res.json();[cite: 13]
  const analysis = buildAnalysis(json.rows, "linear", "3.5");[cite: 13]

  return { 
    sym: json.symbol, 
    last: analysis[analysis.length - 1], 
    name: getStockName(json.symbol)
  };[cite: 13]
}

// 💡 手動更新邏輯（更新最新股價並自動覆寫快取）
btnWatchlist.addEventListener("click", async () => {
  const rawInput = watchlistInput.value;[cite: 13]
  localStorage.setItem("lohas_watchlist", rawInput);[cite: 13]

  const syms = rawInput.split(",").map(s => s.trim()).filter(s => s).slice(0, 15);[cite: 13]
  const totalStocks = syms.length;[cite: 13]

  watchlistResult.innerHTML = "";[cite: 13]
  scannedWatchlistCache = [];[cite: 13]
  btnWatchlist.disabled = true;[cite: 13]

  let currentIndex = 0;[cite: 13]
  for (const s of syms) {
    currentIndex++;[cite: 13]
    watchlistStatus.textContent = `🔍 正在更新最新位階資料... (${currentIndex} / ${totalStocks})`;[cite: 13]
    watchlistStatus.style.color = "var(--blue)";[cite: 13]

    try {
      const data = await fetchLevelForWatchlist(s);[cite: 13]
      scannedWatchlistCache.push(data);[cite: 13]
      updateWatchlistDisplay();[cite: 13]
    } catch {
      watchlistResult.innerHTML += `<div style="color:red; font-size:0.8rem; padding:8px;">❌ ${s} 失敗</div>`;[cite: 13]
    }
    await new Promise(r => setTimeout(r, 200));[cite: 13]
  }
  
  // 寫入快取與顯示完成時間
  saveWatchlistCache();[cite: 13]
  watchlistStatus.textContent = `✅ 更新完成 (共 ${scannedWatchlistCache.length} 檔)`;[cite: 13]
  watchlistStatus.style.color = "var(--blue)";[cite: 13]
  btnWatchlist.disabled = false;[cite: 13]
});

function updateWatchlistDisplay() {
  if (scannedWatchlistCache.length === 0) return;[cite: 13]

  const searchQuery = watchlistSearch.value.trim().toLowerCase();[cite: 13]
  const filterZone = watchlistFilterZone.value;[cite: 13]
  const sortMode = watchlistSort.value;[cite: 13]

  let resultList = scannedWatchlistCache.filter(item => {
    const matchSearch = item.sym.toLowerCase().includes(searchQuery) || item.name.toLowerCase().includes(searchQuery);[cite: 13]
    
    const zone = priceZone(item.last);[cite: 13]
    let matchZone = true;[cite: 13]
    if (filterZone === "cheap") {
      matchZone = (zone === "悲觀區下緣" || zone === "相對悲觀區" || zone === "中線以下");[cite: 13]
    } else if (filterZone === "expensive") {
      matchZone = (zone === "樂觀區上緣" || zone === "相對樂觀區" || zone === "中線以上");[cite: 13]
    }

    return matchSearch && matchZone;[cite: 13]
  });

  if (sortMode === "code") {
    resultList.sort((a, b) => a.sym.localeCompare(b.sym));[cite: 13]
  } else if (sortMode === "rankAsc") {
    resultList.sort((a, b) => getZoneWeight(priceZone(a.last)) - getZoneWeight(priceZone(b.last)));[cite: 13]
  } else if (sortMode === "rankDesc") {
    resultList.sort((a, b) => getZoneWeight(priceZone(b.last)) - getZoneWeight(priceZone(a.last)));[cite: 13]
  }

  watchlistResult.innerHTML = "";[cite: 13]
  if (resultList.length === 0) {
    watchlistResult.innerHTML = `<div style="color:var(--muted); font-size:0.85rem; padding:12px; text-align:center;">無符合篩選條件的標的</div>`;[cite: 13]
    return;[cite: 13]
  }

  resultList.forEach(item => {
    const isSellSignal = item.last.close >= item.last.plus2;[cite: 13]
    const isBuySignal = item.last.close <= item.last.minus2;[cite: 13]

    const card = document.createElement("div");[cite: 13]
    card.className = "watchlist-item";[cite: 13]
    card.style.cursor = "pointer";[cite: 13]

    if (isBuySignal) {
      card.style.backgroundColor = "#e8f5e9";[cite: 13]
      card.style.border = "1px solid #a5d6a7";[cite: 13]
      card.style.borderLeft = "6px solid #12614a";[cite: 13]
    } else if (isSellSignal) {
      card.style.backgroundColor = "#ffebee";[cite: 13]
      card.style.border = "1px solid #ffcdd2";[cite: 13]
      card.style.borderLeft = "6px solid #c94b4b";[cite: 13]
    } else {
      card.style.borderLeft = "6px solid #2c6ebd";[cite: 13]
    }

    const zoneColor = isSellSignal ? '#c94b4b' : (isBuySignal ? '#12614a' : '#2c6ebd');[cite: 13]
    const smallTextColor = (isBuySignal || isSellSignal) ? '#333333' : '#666666';[cite: 13]

    const fun = getFundamentals(item.sym, item.last.close);[cite: 13]
    const peDisp = fun.eps > 0 ? `${(item.last.close / fun.eps).toFixed(1)}x` : "N/A";[cite: 13]
    const yieldDisp = `${((fun.dividend / item.last.close) * 100).toFixed(1)}%`;[cite: 13]

    card.innerHTML = `
      <div>
        <strong>${item.sym}</strong>${item.name ? `<span style="color:#555; font-size:0.85em; margin-left:6px;">${item.name}</span>` : ""}<br>
        <small style="color:${smallTextColor}; display: block; margin-top: 4px; line-height: 1.5;">
          <span style="white-space: nowrap;">現價: ${formatPrice(item.last.raw_close || item.last.close)}</span> 
          <span style="white-space: nowrap;">(還原: ${formatPrice(item.last.close)})</span>
          <br>
          <span style="white-space: nowrap;">PE: ${peDisp}</span> | 
          <span style="white-space: nowrap;">殖利率: ${yieldDisp}</span>
        </small>
      </div>
      <div style="text-align:right;">
        <span style="font-weight:900; color:${zoneColor}">${priceZone(item.last)}</span>
        <br>
        <small style="color:${smallTextColor}">區間: ${getPriceRangeDesc(item.last)}</small>
      </div>
    `;[cite: 13]

    card.addEventListener("click", () => {
      let rawSym = item.sym.toUpperCase();[cite: 13]
      
      // 帶入卡片資料時自動切換市場
      autoDetectMarket(rawSym);
      
      if (rawSym.includes(".TWO")) {
        rawSym = rawSym.replace(".TWO", "");[cite: 13]
      } else if (rawSym.includes(".TW")) {
        rawSym = rawSym.replace(".TW", "");[cite: 13]
      }
      
      symbolInput.value = rawSym;[cite: 13]
      fetchSymbolBtn.click();[cite: 13]
    });

    watchlistResult.appendChild(card);[cite: 13]
  });
}

btnClearWatchlist.addEventListener("click", () => {
  if (btnClearWatchlist.textContent.includes("全部清除")) {
    deletedWatchlistBackup = watchlistInput.value;[cite: 13]
    watchlistInput.value = "";[cite: 13]
    localStorage.removeItem("lohas_watchlist");[cite: 13]
    localStorage.removeItem("lohas_watchlist_cache_data");[cite: 13]
    localStorage.removeItem("lohas_watchlist_cache_time");[cite: 13]
    watchlistResult.innerHTML = "";[cite: 13]
    scannedWatchlistCache = [];[cite: 13]
    watchlistStatus.textContent = "🧹 已暫時清除，可點擊按鈕復原";[cite: 13]
    watchlistStatus.style.color = "var(--blue)";[cite: 13]
    
    btnClearWatchlist.textContent = "↩️ 復原清除清單";[cite: 13]
    btnClearWatchlist.style.backgroundColor = "#d9852b";[cite: 13]
  } else {
    if (deletedWatchlistBackup) {
      watchlistInput.value = deletedWatchlistBackup;[cite: 13]
      localStorage.setItem("lohas_watchlist", deletedWatchlistBackup);[cite: 13]
      watchlistStatus.textContent = "↩️ 已成功復原清單！";[cite: 13]
    }
    btnClearWatchlist.textContent = "🧹 全部清除";[cite: 13]
    btnClearWatchlist.style.backgroundColor = "#667085";[cite: 13]
  }
  updateRemoveSelect();[cite: 13]
});

btnExportWatchlist.addEventListener("click", (e) => {
  e.preventDefault();[cite: 13]
  const currentText = watchlistInput.value.trim();[cite: 13]
  if (!currentText) {
    watchlistStatus.textContent = "⚠️ 目前清單是空的，無法匯出喔！";[cite: 13]
    return;[cite: 13]
  }
  navigator.clipboard.writeText(currentText).then(() => {
    watchlistStatus.textContent = "📋 清單已自動複製到剪貼簿！可貼至記事本備份。";[cite: 13]
  }).catch(() => {
    watchlistStatus.textContent = "❌ 複製失敗，請手動複製輸入框文字。";[cite: 13]
  });
});

btnImportWatchlist.addEventListener("click", (e) => {
  e.preventDefault();[cite: 13]
  const userInput = prompt("請貼上您先前匯出的股票代號（請用逗點隔開）：");[cite: 13]
  if (userInput === null) return;[cite: 13]
  const cleanedInput = userInput.trim();[cite: 13]
  if (!cleanedInput) {
    alert("輸入內容為空，取消匯入。");[cite: 13]
    return;[cite: 13]
  }
  watchlistInput.value = cleanedInput;[cite: 13]
  localStorage.setItem("lohas_watchlist", cleanedInput);[cite: 13]
  watchlistResult.innerHTML = "";[cite: 13]
  scannedWatchlistCache = [];[cite: 13]
  watchlistStatus.textContent = "📥 歷史清單匯入成功！點擊下方按鈕即可重新更新。";[cite: 13]
  updateRemoveSelect();[cite: 13]
});

fetchSymbolBtn.addEventListener("click", async () => {
  fetchStatus.textContent = "讀取中...";[cite: 13]
  let inputVal = symbolInput.value.trim().toUpperCase();[cite: 13]
  
  // 點擊讀取按鈕前自動確認市場選擇
  autoDetectMarket(inputVal);
  let selectedMarket = market.value;[cite: 13]

  try {
    const p = new URLSearchParams({ 
      symbol: inputVal, 
      market: selectedMarket, 
      years: periodYears.value 
    });[cite: 13]
    
    const res = await fetch(`/api/yahoo?${p.toString()}`);[cite: 13]
    if (!res.ok) throw new Error();[cite: 13]
    const json = await res.json();[cite: 13]
    csvInput.value = JSON.stringify(json.rows);[cite: 13]
    
    if (chartTitle) {
      chartTitle.textContent = formatSymbolDisplay(json.symbol);[cite: 13]
    }
    
    loadMainChipData(inputVal);[cite: 13]

    render();[cite: 13]
    fetchStatus.textContent = "成功";[cite: 13]
    localStorage.setItem("lohas_last_symbol", inputVal);[cite: 13]
    localStorage.setItem("lohas_last_market", selectedMarket);[cite: 13]
  } catch (err) { 
    fetchStatus.textContent = "失敗";[cite: 13]
    console.error("Fetch 錯誤資訊:", err);[cite: 13]
  }
});

document.querySelector("#sampleBtn").addEventListener("click", () => {
  const mock = [];[cite: 13]
  let p = 100;[cite: 13]
  for(let i=0; i<300; i++) {
    mock.push({ 
      date: new Date(Date.now() - (300-i)*86400000).toISOString().split('T')[0], 
      close: p += (Math.random()-0.48) 
    });[cite: 13]
  }
  csvInput.value = JSON.stringify(mock);[cite: 13]
  if (chartTitle) chartTitle.textContent = "模擬範例股票";[cite: 13]
  render();[cite: 13]
});