// --- 台股名稱對照表 ---
const TW_STOCK_NAMES = {
  "1101":"台泥","1102":"亞泥","1216":"統一","1301":"台塑","1303":"南亞","1326":"台化",
  "1402":"遠東新","1476":"儒鴻","1504":"東元","1590":"亞德客","1605":"華新",
  "2002":"中鋼","2006":"東和鋼鐵","2015":"豐興","2049":"上銀","2059":"川湖",
  "2101":"南港","2105":"正新","2207":"和泰車","2227":"裕日車","2231":"為升",
  "2301":"光寶科","2303":"聯電","2308":"台達電","2312":"金寶","2317":"鴻海",
  "2324":"仁寶","2327":"國巨","2330":"台積電","2337":"旺宏","2344":"華邦電",
  "2347":"聯強","2352":"佳世達","2353":"宏碁","2354":"鴻準","2356":"英業達",
  "2357":"華碩","2358":"廷鑫","2360":"致茂","2363":"矽統","2371":"大同",
  "2376":"技嘉","2377":"微笑","2379":"瑞昱","2382":"廣達","2383":"台光電",
  "2385":"群光","2388":"威盛","2392":"正崴","2393":"億光","2395":"研華",
  "2397":"友通","2399":"映泰","2401":"凌陽","2404":"漢唐","2408":"南亞科",
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
  "6153":"嘉聯益","6196":"帆宣","6197":"佳必琪","6201":"亞弘電","6202":"盛群",
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
};

// 台美熱門股基本面資料庫 (年度預估 EPS 與 配息金額)
const STOCK_FUNDAMENTALS = {
  "1101": { eps: 2.2, dividend: 1.5 },     // 台泥
  "1102": { eps: 2.8, dividend: 2.1 },     // 亞泥
  "1216": { eps: 7.2, dividend: 5.5 },     // 統一
  "2303": { eps: 4.5, dividend: 3.0 },     // 聯電
  "2308": { eps: 12.8, dividend: 8.0 },    // 台達電
  "2317": { eps: 10.2, dividend: 5.4 },    // 鴻海
  "2330": { eps: 38.2, dividend: 16.0 },   // 台積電
  "2379": { eps: 26.0, dividend: 18.0 },   // 瑞昱
  "2382": { eps: 10.3, dividend: 7.2 },    // 廣達
  "2412": { eps: 4.8, dividend: 4.7 },     // 中華電
  "2454": { eps: 48.5, dividend: 30.4 },   // 聯發科
  "2881": { eps: 4.8, dividend: 2.5 },     // 富邦金
  "2882": { eps: 3.6, dividend: 2.0 },     // 國泰金
  "2884": { eps: 1.6, dividend: 1.2 },     // 玉山金
  "2886": { eps: 2.37, dividend: 1.5 },    // 兆豐金
  "2891": { eps: 2.82, dividend: 1.8 },    // 中信金
  "1476": { eps: 22.0, dividend: 17.0 },   // 儒鴻
  "1477": { eps: 15.0, dividend: 12.2 },   // 聚陽
  "9939": { eps: 7.8, dividend: 5.5 },     // 宏全
  "0050": { eps: 0, dividend: 6.2 },       // 元大台灣50
  "0056": { eps: 0, dividend: 3.6 },       // 元大高股息
  "00878": { eps: 0, dividend: 1.4 },      // 國泰永續高股息
  "AAPL": { eps: 6.5, dividend: 1.0 },     // 蘋果
  "MSFT": { eps: 11.8, dividend: 3.0 },    // 微軟
  "NVDA": { eps: 1.8, dividend: 0.04 },    // 輝達
};

// 智慧估算引擎
function getFundamentals(symbol, currentPrice) {
  if (!symbol) return { eps: 10, dividend: 4 };
  const code = symbol.replace(/\.(TW|TWO)$/i, "").toUpperCase();
  if (STOCK_FUNDAMENTALS[code]) {
    return STOCK_FUNDAMENTALS[code];
  }
  const estimatedEps = +(currentPrice / 16).toFixed(2);
  const estimatedDiv = +(currentPrice * 0.04).toFixed(2);
  return { eps: estimatedEps, dividend: estimatedDiv };
}

// 取得名稱
function getStockName(symbol) {
  if (!symbol) return "";
  const code = symbol.replace(/\.(TW|TWO)$/i, "").toUpperCase();
  return TW_STOCK_NAMES[code] || "";
}

// 格式化為：代號 + 名稱
function formatSymbolDisplay(symbol) {
  const name = getStockName(symbol);
  return name ? `${symbol} ${name}` : symbol;
}

const csvInput = document.querySelector("#csvInput");
const market = document.querySelector("#market");
const symbolInput = document.querySelector("#symbolInput");
const fetchSymbolBtn = document.querySelector("#fetchSymbolBtn");
const fetchStatus = document.querySelector("#fetchStatus");
const periodYears = document.querySelector("#periodYears");
const modelMode = document.querySelector("#modelMode");
const chart = document.querySelector("#chart");
const chartTitle = document.querySelector("#chartTitle");
const rangeText = document.querySelector("#rangeText");
const zoneText = document.querySelector("#zoneText");
const closeText = document.querySelector("#closeText");
const r2Text = document.querySelector("#r2Text");
const levelsTable = document.querySelector("#levelsTable");

// 新增：本益比與殖利率 DOM
const peText = document.querySelector("#peText");
const yieldText = document.querySelector("#yieldText");

// 監控清單
const watchlistInput = document.querySelector("#watchlistInput");
const btnWatchlist = document.querySelector("#btnWatchlist");
const btnClearWatchlist = document.querySelector("#btnClearWatchlist");
const watchlistResult = document.querySelector("#watchlistResult");
const watchlistStatus = document.querySelector("#watchlistStatus");

// 匯出匯入
const btnExportWatchlist = document.querySelector("#btnExportWatchlist");
const btnImportWatchlist = document.querySelector("#btnImportWatchlist");

// 排序篩選 DOM
const watchlistSearch = document.querySelector("#watchlistSearch");
const watchlistFilterZone = document.querySelector("#watchlistFilterZone");
const watchlistSort = document.querySelector("#watchlistSort");

// 歷史備份與掃描快取
let deletedWatchlistBackup = "";
let scannedWatchlistCache = [];

const levelDefs = [
  { key: "plus2", label: "+2SD 樂觀線", color: "#c94b4b" },
  { key: "plus1", label: "+1SD 相對樂觀線", color: "#d9852b" },
  { key: "mid", label: "中線", color: "#2c6ebd" },
  { key: "minus1", label: "-1SD 相對悲觀線", color: "#1f8a63" },
  { key: "minus2", label: "-2SD 悲觀線", color: "#12614a" },
];

document.addEventListener("DOMContentLoaded", () => {
  const savedWatchlist = localStorage.getItem("lohas_watchlist");
  if (savedWatchlist) {
    watchlistInput.value = savedWatchlist;
  }

  const savedLastSymbol = localStorage.getItem("lohas_last_symbol");
  const savedLastMarket = localStorage.getItem("lohas_last_market");
  if (savedLastSymbol) symbolInput.value = savedLastSymbol;
  if (savedLastMarket) market.value = savedLastMarket;

  watchlistSearch.addEventListener("input", updateWatchlistDisplay);
  watchlistFilterZone.addEventListener("change", updateWatchlistDisplay);
  watchlistSort.addEventListener("change", updateWatchlistDisplay);
});

// --- 核心運算 ---
function regression(values) {
  const n = values.length;
  const sumX = values.reduce((s, p) => s + p.x, 0);
  const sumY = values.reduce((s, p) => s + p.y, 0);
  const meanX = sumX / n;
  const meanY = sumY / n;
  let num = 0, den = 0;
  for (const p of values) {
    num += (p.x - meanX) * (p.y - meanY);
    den += (p.x - meanX) ** 2;
  }
  const slope = den === 0 ? 0 : num / den;
  const intercept = meanY - slope * meanX;
  const fitted = values.map(p => intercept + slope * p.x);
  const residuals = values.map((p, i) => p.y - fitted[i]);
  const sd = Math.sqrt(residuals.reduce((s, r) => s + r ** 2, 0) / (n - 2 || 1));
  const ssTot = values.reduce((s, p) => s + (p.y - meanY) ** 2, 0);
  const ssRes = residuals.reduce((s, r) => s + r ** 2, 0);
  const r2 = ssTot === 0 ? 1 : Math.max(0, 1 - ssRes / ssTot);
  return { intercept, slope, sd, r2 };
}

function buildAnalysis(data, currentMode = modelMode.value, currentYears = periodYears.value) {
  const years = (currentYears === "all") ? 10 : Number(currentYears);
  const lastDate = new Date(data[data.length - 1].date);
  const cutoff = new Date(lastDate);
  cutoff.setDate(cutoff.getDate() - Math.round(years * 365));
  const filtered = data.filter(p => new Date(p.date) >= cutoff);
  if (filtered.length < 10) throw new Error("資料不足");
  
  const startTime = new Date(filtered[0].date).getTime();
  const useLog = currentMode === "log";
  const points = filtered.map(p => ({
    ...p,
    x: (new Date(p.date).getTime() - startTime) / 86400000,
    y: useLog ? Math.log(p.close) : p.close
  }));

  const fit = regression(points);
  return points.map(p => {
    const midRaw = fit.intercept + fit.slope * p.x;
    const conv = (v) => useLog ? Math.exp(v) : v;
    return {
      ...p,
      plus2: conv(midRaw + fit.sd * 2),
      plus1: conv(midRaw + fit.sd),
      mid: conv(midRaw),
      minus1: conv(midRaw - fit.sd),
      minus2: conv(midRaw - fit.sd * 2),
      r2: fit.r2
    };
  });
}

function priceZone(p) {
  if (p.close >= p.plus2) return "樂觀區上緣";
  if (p.close >= p.plus1) return "相對樂觀區";
  if (p.close >= p.mid) return "中線以上";
  if (p.close >= p.minus1) return "中線以下";
  if (p.close >= p.minus2) return "相對悲觀區";
  return "悲觀區下緣";
}

function getPriceRangeDesc(p) {
  const f = formatPrice; 
  if (p.close >= p.plus2) return `> ${f(p.plus2)} (+2SD 樂觀線)`;
  if (p.close >= p.plus1) return `${f(p.plus1)} (相對樂觀) ~ ${f(p.plus2)} (樂觀)`;
  if (p.close >= p.mid) return `${f(p.mid)} (中線) ~ ${f(p.plus1)} (相對樂觀)`;
  if (p.close >= p.minus1) return `${f(p.minus1)} (相對悲觀) ~ ${f(p.mid)} (中線)`;
  if (p.close >= p.minus2) return `${f(p.minus2)} (悲觀) ~ ${f(p.minus1)} (相對悲觀)`;
  return `< ${f(p.minus2)} (-2SD 悲觀線)`;
}

function getZoneWeight(zoneStr) {
  switch (zoneStr) {
    case "悲觀區下緣": return 1;
    case "相對悲觀區": return 2;
    case "中線以下": return 3;
    case "中線以上": return 4;
    case "相對樂觀區": return 5;
    case "樂觀區上緣": return 6;
    default: return 0;
  }
}

function formatPrice(v) { return Number(v).toLocaleString("zh-TW", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

// --- 繪圖（自動整合估值天際線＋統計五線譜軌道） ---
function renderChart(analysis) {
  const width = 1000, height = 500;
  const margin = { top: 35, right: 60, bottom: 45, left: 65 };
  const last = analysis[analysis.length - 1];

  // 1. 取得目前代碼的基本面數據 (EPS)
  const symbolCode = symbolInput.value.trim().toUpperCase();
  const fun = getFundamentals(symbolCode, last.close);

  // 定義要繪製的歷史本益比天際線（12倍防禦、20倍壓力）
  let peLines = [];
  if (fun && fun.eps > 0) {
    peLines = [
      { pe: 12, label: "12x PE 歷史極端低點", color: "#1f8a63" },
      { pe: 20, label: "20x PE 歷史極端高點", color: "#c94b4b" }
    ];
  }

  // 2. 重新動態計算 Y 軸上下限，確保天際線也能完全顯示在圖表範圍內
  let rawMin = Math.min(...analysis.map(p => Math.min(p.close, p.minus2)));
  let rawMax = Math.max(...analysis.map(p => Math.max(p.close, p.plus2)));
  
  if (peLines.length > 0) {
    peLines.forEach(l => {
      const val = l.pe * fun.eps;
      if (val < rawMin) rawMin = val;
      if (val > rawMax) rawMax = val;
    });
  }

  const minP = rawMin * 0.95;
  const maxP = rawMax * 1.05;
  
  const x = (i) => margin.left + (i / (analysis.length - 1)) * (width - margin.left - margin.right);
  const y = (val) => height - margin.bottom - ((val - minP) / (maxP - minP)) * (height - margin.top - margin.bottom);

  // 3. 產生 Y 軸格線與刻度
  let yTicksHtml = "";
  for (let i = 0; i <= 4; i++) {
    const tickVal = minP + (i / 4) * (maxP - minP);
    const tickY = y(tickVal);
    yTicksHtml += `
      <line x1="${margin.left}" y1="${tickY}" x2="${width - margin.right}" y2="${tickY}" stroke="#e2e8f0" stroke-width="1" stroke-dasharray="4 4" />
      <text x="${margin.left - 10}" y="${tickY + 4}" fill="#64748b" font-size="12" text-anchor="end">${formatPrice(tickVal)}</text>
    `;
  }

  // 4. 產生 X 軸時間節點
  let xTicksHtml = "";
  const totalCount = analysis.length;
  const step = Math.floor(totalCount / 4);
  const indices = [0, step, step * 2, step * 3, totalCount - 1];
  
  indices.forEach(idx => {
    if (analysis[idx]) {
      const tickX = x(idx);
      const rawDate = analysis[idx].date;
      xTicksHtml += `
        <line x1="${tickX}" y1="${height - margin.bottom}" x2="${tickX}" y2="${height - margin.bottom + 6}" stroke="#94a3b8" stroke-width="1" />
        <text x="${tickX}" y="${height - margin.bottom + 22}" fill="#64748b" font-size="12" text-anchor="middle">${rawDate}</text>
      `;
    }
  });

  // 5. 繪製五線譜彩色軌道
  const pathsHtml = levelDefs.map(l => {
    const pointsStr = analysis.map((p, i) => `${x(i)},${y(p[l.key])}`).join(" ");
    return `<polyline points="${pointsStr}" fill="none" stroke="${l.color}" stroke-width="${l.key === 'mid' ? 2.5 : 1.2}" opacity="0.7" />`;
  }).join("");

  // 6. 💡 核心升級：繪製基本面 PE 估值天際參考線 (僅在非 ETF 且有 EPS 時呈現)
  let peLinesHtml = "";
  if (peLines.length > 0) {
    peLines.forEach(l => {
      const val = l.pe * fun.eps;
      const lineY = y(val);
      peLinesHtml += `
        <!-- 橫向天際線 -->
        <line x1="${margin.left}" y1="${lineY}" x2="${width - margin.right}" y2="${lineY}" stroke="${l.color}" stroke-dasharray="6 4" stroke-width="1.8" opacity="0.85" />
        <!-- 精緻泡泡標籤背景 -->
        <rect x="${width - margin.right - 145}" y="${lineY - 21}" width="140" height="18" fill="${l.color}" rx="4" opacity="0.9" />
        <!-- 標籤文字 -->
        <text x="${width - margin.right - 6}" y="${lineY - 8}" fill="#ffffff" font-size="10.5" font-weight="900" text-anchor="end">${l.label}: ${formatPrice(val)}</text>
      `;
    });
  }

  // 7. 建立收盤價折線
  const closePointsStr = analysis.map((p, i) => `${x(i)},${y(p.close)}`).join(" ");

  chart.innerHTML = `
    <svg id="svgChart" viewBox="0 0 ${width} ${height}" style="background:#fff; border-radius:12px; width:100%; height:100%;">
      <!-- 坐標軸線 -->
      <line x1="${margin.left}" y1="${height - margin.bottom}" x2="${width - margin.right}" y2="${height - margin.bottom}" stroke="#94a3b8" stroke-width="1.5" />
      <line x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${height - margin.bottom}" stroke="#94a3b8