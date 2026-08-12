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
};

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

function getStockName(symbol) {
  if (!symbol) return "";
  const code = symbol.replace(/\.(TW|TWO)$/i, "").toUpperCase();
  return TW_STOCK_NAMES[code] || "";
}

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

const peText = document.querySelector("#peText");
const yieldText = document.querySelector("#yieldText");

const watchlistInput = document.querySelector("#watchlistInput");
const btnWatchlist = document.querySelector("#btnWatchlist");
const btnClearWatchlist = document.querySelector("#btnClearWatchlist");
const watchlistResult = document.querySelector("#watchlistResult");
const watchlistStatus = document.querySelector("#watchlistStatus");

const addWatchlistInput = document.querySelector("#addWatchlistInput");
const btnAddWatchlistSingle = document.querySelector("#btnAddWatchlistSingle");
const removeWatchlistSelect = document.querySelector("#removeWatchlistSelect");
const btnRemoveWatchlistSingle = document.querySelector("#btnRemoveWatchlistSingle");

const btnExportWatchlist = document.querySelector("#btnExportWatchlist");
const btnImportWatchlist = document.querySelector("#btnImportWatchlist");

const watchlistSearch = document.querySelector("#watchlistSearch");
const watchlistFilterZone = document.querySelector("#watchlistFilterZone");
const watchlistSort = document.querySelector("#watchlistSort");

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

  updateRemoveSelect();

  watchlistSearch.addEventListener("input", updateWatchlistDisplay);
  watchlistFilterZone.addEventListener("change", updateWatchlistDisplay);
  watchlistSort.addEventListener("change", updateWatchlistDisplay);
});

function updateRemoveSelect() {
  if (!removeWatchlistSelect) return;
  const currentText = watchlistInput.value || "";
  const syms = currentText.split(",").map(s => s.trim().toUpperCase()).filter(s => s);
  
  removeWatchlistSelect.innerHTML = "";
  if (syms.length === 0) {
    const opt = document.createElement("option");
    opt.value = "";
    opt.textContent = "📭 清單為空";
    removeWatchlistSelect.appendChild(opt);
    return;
  }
  
  syms.forEach(sym => {
    const opt = document.createElement("option");
    opt.value = sym;
    opt.textContent = sym;
    removeWatchlistSelect.appendChild(opt);
  });
}

btnAddWatchlistSingle.addEventListener("click", async () => {
  const newSym = addWatchlistInput.value.trim().toUpperCase();
  if (!newSym) return;
  
  const currentText = watchlistInput.value || "";
  const syms = currentText.split(",").map(s => s.trim().toUpperCase()).filter(s => s);
  
  if (syms.includes(newSym)) {
    watchlistStatus.textContent = `⚠️ 股號 ${newSym} 已在清單中！`;
    return;
  }
  
  if (syms.length >= 15) {
    watchlistStatus.textContent = "⚠️ 監控清單最多只能 15 支股票喔！";
    return;
  }
  
  syms.push(newSym);
  watchlistInput.value = syms.join(", ");
  localStorage.setItem("lohas_watchlist", watchlistInput.value);
  addWatchlistInput.value = "";
  
  updateRemoveSelect();
  watchlistStatus.textContent = `➕ 正在即時新增並計算 ${newSym}...`;
  
  try {
    const data = await fetchLevelForWatchlist(newSym);
    scannedWatchlistCache.push(data);
    updateWatchlistDisplay();
    watchlistStatus.textContent = `✅ 已成功新增 ${newSym}！`;
  } catch (err) {
    watchlistStatus.textContent = `❌ 即時新增 ${newSym} 失敗，請手動執行批量掃描。`;
  }
});

btnRemoveWatchlistSingle.addEventListener("click", () => {
  const toRemove = removeWatchlistSelect.value;
  if (!toRemove || toRemove === "📭 清單為空") return;
  
  const currentText = watchlistInput.value || "";
  const syms = currentText.split(",").map(s => s.trim().toUpperCase()).filter(s => s);
  
  const filtered = syms.filter(s => s !== toRemove);
  watchlistInput.value = filtered.join(", ");
  localStorage.setItem("lohas_watchlist", watchlistInput.value);
  
  updateRemoveSelect();
  watchlistStatus.textContent = `➖ 已刪除 ${toRemove}`;
  
  scannedWatchlistCache = scannedWatchlistCache.filter(item => {
    const symClean = item.sym.replace(".TW", "").replace(".TWO", "").toUpperCase();
    return symClean !== toRemove;
  });
  updateWatchlistDisplay();
});

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

function formatPrice(v) { 
  return Number(v).toLocaleString("zh-TW", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); 
}

function renderChart(analysis) {
  const width = 1000, height = 500;
  const margin = { top: 35, right: 60, bottom: 45, left: 65 };
  const last = analysis[analysis.length - 1];
  
  const minP = Math.min(...analysis.map(p => Math.min(p.close, p.minus2))) * 0.97;
  const maxP = Math.max(...analysis.map(p => Math.max(p.close, p.plus2))) * 1.03;
  
  const x = (i) => margin.left + (i / (analysis.length - 1)) * (width - margin.left - margin.right);
  const y = (val) => height - margin.bottom - ((val - minP) / (maxP - minP)) * (height - margin.top - margin.bottom);

  let yTicksHtml = "";
  for (let i = 0; i <= 4; i++) {
    const tickVal = minP + (i / 4) * (maxP - minP);
    const tickY = y(tickVal);
    yTicksHtml += `
      <line x1="${margin.left}" y1="${tickY}" x2="${width - margin.right}" y2="${tickY}" stroke="#e2e8f0" stroke-width="1" stroke-dasharray="4 4" />
      <text x="${margin.left - 10}" y="${tickY + 4}" fill="#64748b" font-size="12" text-anchor="end">${formatPrice(tickVal)}</text>
    `;
  }

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

  const pathsHtml = levelDefs.map(l => {
    const pointsStr = analysis.map((p, i) => `${x(i)},${y(p[l.key])}`).join(" ");
    return `<polyline points="${pointsStr}" fill="none" stroke="${l.color}" stroke-width="${l.key === 'mid' ? 2.5 : 1.2}" opacity="0.75" />`;
  }).join("");

  const closePointsStr = analysis.map((p, i) => `${x(i)},${y(p.close)}`).join(" ");

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
  `;

  const svg = document.querySelector("#svgChart");
  const tooltipLine = document.querySelector("#tooltipLine");
  const chartTooltip = document.querySelector("#chartTooltip");

  if (svg && tooltipLine && chartTooltip) {
    const handleMove = (e) => {
      const rect = svg.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const relativeX = ((clientX - rect.left) / rect.width) * width;
      
      if (relativeX >= margin.left && relativeX <= width - margin.right) {
        const dataWidth = width - margin.left - margin.right;
        const ratio = (relativeX - margin.left) / dataWidth;
        const index = Math.round(ratio * (totalCount - 1));
        
        if (analysis[index]) {
          const point = analysis[index];
          const currX = x(index);

          tooltipLine.setAttribute("x1", currX);
          tooltipLine.setAttribute("x2", currX);
          tooltipLine.style.display = "block";

          let tooltipLeft = currX + 15;
          if (tooltipLeft + 190 > width) {
            tooltipLeft = currX - 215;
          }
          const scaleX = rect.width / width;
          const scaleY = rect.height / height;

          chartTooltip.style.display = "block";
          chartTooltip.style.left = `${tooltipLeft * scaleX}px`;
          chartTooltip.style.top = `${15 * scaleY}px`;

          const symbolCode = symbolInput.value.trim().toUpperCase();
          const pFun = getFundamentals(symbolCode, point.close);
          const histPe = pFun.eps > 0 ? `${(point.close / pFun.eps).toFixed(1)}x` : "N/A (ETF)";
          const histYield = `${((pFun.dividend / point.close) * 100).toFixed(2)}%`;

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
          `;
        }
      } else {
        hideTooltip();
      }
    };

    const hideTooltip = () => {
      tooltipLine.style.display = "none";
      chartTooltip.style.display = "none";
    };

    svg.addEventListener("mousemove", handleMove);
    svg.addEventListener("mouseleave", hideTooltip);
    svg.addEventListener("touchstart", handleMove, { passive: true });
    svg.addEventListener("touchmove", handleMove, { passive: true });
    svg.addEventListener("touchend", hideTooltip);
  }
}

function render() {
  try {
    const data = JSON.parse(csvInput.value);
    const analysis = buildAnalysis(data);
    const last = analysis[analysis.length - 1];
    
    if (zoneText) {
      zoneText.textContent = priceZone(last);
      zoneText.style.color = (last.close >= last.plus2) ? "#c94b4b" : (last.close <= last.minus2 ? "#12614a" : "var(--ink)");
    }
    if (closeText) closeText.textContent = formatPrice(last.raw_close || last.close);
    if (r2Text) r2Text.textContent = last.r2.toFixed(3);
    if (rangeText) rangeText.textContent = getPriceRangeDesc(last);
    
    const symbolCode = symbolInput.value.trim().toUpperCase();
    const fun = getFundamentals(symbolCode, last.close);
    if (peText) {
      peText.textContent = fun.eps > 0 ? `${(last.close / fun.eps).toFixed(1)} 倍` : "N/A (ETF)";
    }
    if (yieldText) {
      yieldText.textContent = `${((fun.dividend / last.close) * 100).toFixed(2)} %`;
    }

    renderChart(analysis);
    if (levelsTable) {
      levelsTable.innerHTML = levelDefs.map(l => `<tr><td>${l.label}</td><td>${formatPrice(last[l.key])}</td><td>${priceZone(last) === l.label ? "●" : ""}</td></tr>`).join("");
    }
  } catch (e) {
    console.error("渲染出錯：", e);
  }
}

// 💡 主畫面顯示三大法人籌碼（帶懸浮買賣明細 Tooltip）
async function loadMainChipData(symbol) {
  const chipEl = document.querySelector("#chipText");
  if (!chipEl) return;

  chipEl.innerHTML = `<span style="color:var(--muted); font-size:0.85em;">🔍 正在讀取三大法人籌碼...</span>`;

  try {
    const res = await fetch(`/api/chip?symbol=${encodeURIComponent(symbol)}`);
    const chip = await res.json();
    if (!chip || chip.error) {
      chipEl.innerHTML = `<span style="color:var(--muted); font-size:0.85em;">尚無今日盤後籌碼資料或非台股標的</span>`;
      return;
    }

    const fmtDiff = (num) => {
      const color = num > 0 ? "#c94b4b" : (num < 0 ? "#1f8a63" : "inherit");
      const sign = num > 0 ? "+" : "";
      return `<strong style="color:${color};">${sign}${(num || 0).toLocaleString()}</strong>`;
    };
    const fmtVal = (num) => (num || 0).toLocaleString();

    const fBuy = chip.foreign_buy || 0;
    const fSell = chip.foreign_sell || 0;
    const tBuy = chip.trust_buy || 0;
    const tSell = chip.trust_sell || 0;
    const dBuy = chip.dealer_buy || 0;
    const dSell = chip.dealer_sell || 0;

    const foreignTip = (fBuy || fSell) ? `<span class="tooltiptext">買進 ${fmtVal(fBuy)} | 賣出 ${fmtVal(fSell)}</span>` : "";
    const trustTip = (tBuy || tSell) ? `<span class="tooltiptext">買進 ${fmtVal(tBuy)} | 賣出 ${fmtVal(tSell)}</span>` : "";
    const dealerTip = (dBuy || dSell) ? `<span class="tooltiptext">買進 ${fmtVal(dBuy)} | 賣出 ${fmtVal(dSell)}</span>` : "";

    chipEl.innerHTML = `
      (${chip.date}) : 
      <span class="chip-item">外資 ${fmtDiff(chip.foreign)} 張${foreignTip}</span> | 
      <span class="chip-item">投信 ${fmtDiff(chip.trust)} 張${trustTip}</span> | 
      <span class="chip-item">自營 ${fmtDiff(chip.dealer)} 張${dealerTip}</span> | 
      合計 ${fmtDiff(chip.total)} 張
    `;
  } catch (e) {
    chipEl.innerHTML = `<span style="color:var(--muted); font-size:0.85em;">籌碼讀取失敗</span>`;
  }
}

// 💡 監控清單專用價格計算（不抓取籌碼以提升快掃速度）
async function fetchLevelForWatchlist(symbol) {
  let finalSym = symbol.trim().toUpperCase();
  if (!finalSym.includes(".") && /^\d+$/.test(finalSym)) finalSym += ".TW";
  const p = new URLSearchParams({ symbol: finalSym.replace(".TW","").replace(".TWO",""), market: finalSym.includes(".TWO") ? "two" : (finalSym.includes(".TW") ? "tw" : "us"), years: "3.5" });
  
  const res = await fetch(`/api/yahoo?${p.toString()}`);
  if (!res.ok) throw new Error();
  const json = await res.json();
  const analysis = buildAnalysis(json.rows, "linear", "3.5");

  return { 
    sym: json.symbol, 
    last: analysis[analysis.length - 1], 
    name: getStockName(json.symbol)
  };
}

btnWatchlist.addEventListener("click", async () => {
  const rawInput = watchlistInput.value;
  localStorage.setItem("lohas_watchlist", rawInput);

  const syms = rawInput.split(",").map(s => s.trim()).filter(s => s).slice(0, 15);
  const totalStocks = syms.length;

  watchlistResult.innerHTML = "";
  scannedWatchlistCache = [];
  btnWatchlist.disabled = true;

  let currentIndex = 0;
  for (const s of syms) {
    currentIndex++;
    watchlistStatus.textContent = `🔍 正在掃描樂活通道區間... (${currentIndex} / ${totalStocks})`;

    try {
      const data = await fetchLevelForWatchlist(s);
      scannedWatchlistCache.push(data);
      updateWatchlistDisplay();
    } catch {
      watchlistResult.innerHTML += `<div style="color:red; font-size:0.8rem; padding:8px;">❌ ${s} 失敗</div>`;
    }
    await new Promise(r => setTimeout(r, 200));
  }
  watchlistStatus.textContent = `✅ 掃描完成 (共 ${scannedWatchlistCache.length} 檔)`;
  btnWatchlist.disabled = false;
});

function updateWatchlistDisplay() {
  if (scannedWatchlistCache.length === 0) return;

  const searchQuery = watchlistSearch.value.trim().toLowerCase();
  const filterZone = watchlistFilterZone.value;
  const sortMode = watchlistSort.value;

  let resultList = scannedWatchlistCache.filter(item => {
    const matchSearch = item.sym.toLowerCase().includes(searchQuery) || item.name.toLowerCase().includes(searchQuery);
    
    const zone = priceZone(item.last);
    let matchZone = true;
    if (filterZone === "cheap") {
      matchZone = (zone === "悲觀區下緣" || zone === "相對悲觀區" || zone === "中線以下");
    } else if (filterZone === "expensive") {
      matchZone = (zone === "樂觀區上緣" || zone === "相對樂觀區" || zone === "中線以上");
    }

    return matchSearch && matchZone;
  });

  if (sortMode === "code") {
    resultList.sort((a, b) => a.sym.localeCompare(b.sym));
  } else if (sortMode === "price-desc") {
    resultList.sort((a, b) => b.last.close - a.last.close);
  } else if (sortMode === "price-asc") {
    resultList.sort((a, b) => a.last.close - b.last.close);
  } else if (sortMode === "zone") {
    resultList.sort((a, b) => getZoneWeight(priceZone(a.last)) - getZoneWeight(priceZone(b.last)));
  }

  watchlistResult.innerHTML = "";
  if (resultList.length === 0) {
    watchlistResult.innerHTML = `<div style="color:var(--muted); font-size:0.85rem; padding:12px; text-align:center;">無符合篩選條件的標的</div>`;
    return;
  }

  resultList.forEach(item => {
    const isSellSignal = item.last.close >= item.last.plus2; 
    const isBuySignal = item.last.close <= item.last.minus2; 

    const card = document.createElement("div");
    card.className = "watchlist-item";
    card.style.cursor = "pointer";

    if (isBuySignal) {
      card.style.backgroundColor = "#e8f5e9";
      card.style.border = "1px solid #a5d6a7";
      card.style.borderLeft = "6px solid #12614a";
    } else if (isSellSignal) {
      card.style.backgroundColor = "#ffebee";
      card.style.border = "1px solid #ffcdd2";
      card.style.borderLeft = "6px solid #c94b4b";
    } else {
      card.style.borderLeft = "6px solid #2c6ebd";
    }

    const zoneColor = isSellSignal ? '#c94b4b' : (isBuySignal ? '#12614a' : '#2c6ebd');
    const smallTextColor = (isBuySignal || isSellSignal) ? '#333333' : '#666666';

    const fun = getFundamentals(item.sym, item.last.close);
    const peDisp = fun.eps > 0 ? `${(item.last.close / fun.eps).toFixed(1)}x` : "N/A";
    const yieldDisp = `${((fun.dividend / item.last.close) * 100).toFixed(1)}%`;

    // 💡 已移除監控卡片底部的法人籌碼列，保持卡片簡潔清爽
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
    `;

    card.addEventListener("click", () => {
      let rawSym = item.sym.toUpperCase();
      let mktVal = "us";
      
      if (rawSym.includes(".TWO")) {
        mktVal = "two";
        rawSym = rawSym.replace(".TWO", "");
      } else if (rawSym.includes(".TW")) {
        mktVal = "tw";
        rawSym = rawSym.replace(".TW", "");
      }
      
      symbolInput.value = rawSym;
      market.value = mktVal;
      fetchSymbolBtn.click();
    });

    watchlistResult.appendChild(card);
  });
}

btnClearWatchlist.addEventListener("click", () => {
  if (btnClearWatchlist.textContent.includes("全部清除")) {
    deletedWatchlistBackup = watchlistInput.value;
    watchlistInput.value = "";
    localStorage.removeItem("lohas_watchlist");
    watchlistResult.innerHTML = "";
    scannedWatchlistCache = [];
    watchlistStatus.textContent = "🧹 已暫時清除，可點擊按鈕復原";
    
    btnClearWatchlist.textContent = "↩️ 復原清除清單";
    btnClearWatchlist.style.backgroundColor = "#d9852b"; 
  } else {
    if (deletedWatchlistBackup) {
      watchlistInput.value = deletedWatchlistBackup;
      localStorage.setItem("lohas_watchlist", deletedWatchlistBackup);
      watchlistStatus.textContent = "↩️ 已成功復原清單！";
    }
    btnClearWatchlist.textContent = "🧹 全部清除";
    btnClearWatchlist.style.backgroundColor = "#667085";
  }
  updateRemoveSelect();
});

btnExportWatchlist.addEventListener("click", (e) => {
  e.preventDefault();
  const currentText = watchlistInput.value.trim();
  if (!currentText) {
    watchlistStatus.textContent = "⚠️ 目前清單是空的，無法匯出喔！";
    return;
  }
  navigator.clipboard.writeText(currentText).then(() => {
    watchlistStatus.textContent = "📋 清單已自動複製到剪貼簿！可貼至記事本備份。";
  }).catch(() => {
    watchlistStatus.textContent = "❌ 複製失敗，請手動複製輸入框文字。";
  });
});

btnImportWatchlist.addEventListener("click", (e) => {
  e.preventDefault();
  const userInput = prompt("請貼上您先前匯出的股票代號（請用逗點隔開）：");
  if (userInput === null) return;
  const cleanedInput = userInput.trim();
  if (!cleanedInput) {
    alert("輸入內容為空，取消匯入。");
    return;
  }
  watchlistInput.value = cleanedInput;
  localStorage.setItem("lohas_watchlist", cleanedInput);
  watchlistResult.innerHTML = "";
  scannedWatchlistCache = [];
  watchlistStatus.textContent = "📥 歷史清單匯入成功！點擊下方按鈕即可重新掃描。";
  updateRemoveSelect();
});

fetchSymbolBtn.addEventListener("click", async () => {
  fetchStatus.textContent = "讀取中...";
  let inputVal = symbolInput.value.trim().toUpperCase();
  let selectedMarket = market.value;

  try {
    const p = new URLSearchParams({ 
      symbol: inputVal, 
      market: selectedMarket, 
      years: periodYears.value 
    });
    
    const res = await fetch(`/api/yahoo?${p.toString()}`);
    if (!res.ok) throw new Error();
    const json = await res.json();
    csvInput.value = JSON.stringify(json.rows);
    
    if (chartTitle) {
      chartTitle.textContent = formatSymbolDisplay(json.symbol);
    }
    
    // 讀取主視覺的三大法人籌碼數據
    loadMainChipData(inputVal);

    render();
    fetchStatus.textContent = "成功";
    localStorage.setItem("lohas_last_symbol", inputVal);
    localStorage.setItem("lohas_last_market", selectedMarket);
  } catch (err) { 
    fetchStatus.textContent = "失敗"; 
    console.error("Fetch 錯誤資訊:", err);
  }
});

document.querySelector("#sampleBtn").addEventListener("click", () => {
  const mock = []; 
  let p = 100;
  for(let i=0; i<300; i++) {
    mock.push({ 
      date: new Date(Date.now() - (300-i)*86400000).toISOString().split('T')[0], 
      close: p += (Math.random()-0.48) 
    });
  }
  csvInput.value = JSON.stringify(mock);
  if (chartTitle) chartTitle.textContent = "模擬範例股票";
  render();
});