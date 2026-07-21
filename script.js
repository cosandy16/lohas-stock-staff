// 1. DOM 變數與元件選取
const symbolInput = document.querySelector("#symbolInput");
const market = document.querySelector("#market");
const periodYears = document.querySelector("#periodYears");
const modelMode = document.querySelector("#modelMode");
const fetchSymbolBtn = document.querySelector("#fetchSymbolBtn");
const fetchStatus = document.querySelector("#fetchStatus");
const chart = document.querySelector("#chart");
const chartTitle = document.querySelector("#chartTitle");
const rangeText = document.querySelector("#rangeText");
const zoneText = document.querySelector("#zoneText");
const closeText = document.querySelector("#closeText");
const r2Text = document.querySelector("#r2Text");
const peText = document.querySelector("#peText");
const yieldText = document.querySelector("#yieldText");
const levelsTable = document.querySelector("#levelsTable");
const csvInput = document.querySelector("#csvInput");

// 監控清單與加減按鈕 DOM
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

// 2. 全域狀態變數宣告
let scannedWatchlistCache = [];
let deletedWatchlistBackup = "";

// 內建核心台美股名冊
const TW_STOCK_NAMES = {
  "1101":"台泥","1102":"亞泥","1216":"統一","1301":"台塑","1303":"南亞","1326":"台化",
  "1402":"遠東新","1476":"儒鴻","1477":"聚陽","1504":"東元","1590":"亞德客","1605":"華新",
  "2002":"中鋼","2006":"東和鋼鐵","2015":"豐興","2049":"上銀","2059":"川湖",
  "2101":"南港","2105":"正新","2207":"和泰車","2227":"裕日車","2231":"為升",
  "2301":"光寶科","2303":"聯電","2308":"台達電","2312":"金寶","2317":"鴻海",
  "2324":"仁寶","2327":"國巨","2330":"台積電","2337":"旺宏","2344":"華邦電",
  "2347":"聯強","2352":"佳世達","2353":"宏碁","2354":"鴻準","2356":"英業達",
  "2357":"華碩","2358":"廷鑫","2360":"致茂","2363":"矽統","2371":"大同",
  "2376":"技嘉","2377":"微星","2379":"瑞昱","2382":"廣達","2383":"台光電",
  "2385":"群光","2388":"威盛","2392":"正崴","2393":"億光","2395":"研華",
  "2408":"南亞科","2409":"友達","2412":"中華電","2454":"聯發科","2474":"可成",
  "2603":"長榮","2609":"陽明","2615":"萬海","2618":"長榮航","2881":"富邦金",
  "2882":"國泰金","2884":"玉山金","2886":"兆豐金","2891":"中信金","3008":"大立光",
  "3034":"聯詠","3035":"智原","3037":"欣興","3231":"緯創","3443":"創意",
  "3661":"世芯-KY","4966":"譜瑞-KY","5347":"世界","6415":"矽力-KY","6505":"台塑化",
  "6669":"緯穎","9910":"豐泰","9921":"巨大","9939":"宏全"
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
  "AAPL": { eps: 6.5, dividend: 1.0 },
  "MSFT": { eps: 11.8, dividend: 3.0 },
  "NVDA": { eps: 1.8, dividend: 0.04 }
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

const levelDefs = [
  { key: "plus2", label: "+2SD 樂觀線", color: "#c94b4b", bg: "bg-red-50 text-red-700" },
  { key: "plus1", label: "+1SD 相對樂觀線", color: "#d9852b", bg: "bg-orange-50 text-orange-700" },
  { key: "mid", label: "中線", color: "#2c6ebd", bg: "bg-blue-50 text-blue-700" },
  { key: "minus1", label: "-1SD 相對悲觀線", color: "#1f8a63", bg: "bg-emerald-50 text-emerald-700" },
  { key: "minus2", label: "-2SD 悲觀線", color: "#12614a", bg: "bg-teal-50 text-teal-700" }
];

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
      <line x1="${margin.left}" y1="${tickY}" x2="${width - margin.right}" y2="${tickY}" stroke="#f1f5f9" stroke-width="1.5" />
      <line x1="${margin.left}" y1="${tickY}" x2="${width - margin.right}" y2="${tickY}" stroke="#e2e8f0" stroke-width="1" stroke-dasharray="4 4" />
      <text x="${margin.left - 10}" y="${tickY + 4}" fill="#64748b" font-size="11" font-weight="600" text-anchor="end">${formatPrice(tickVal)}</text>
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
        <line x1="${tickX}" y1="${height - margin.bottom}" x2="${tickX}" y2="${height - margin.bottom + 6}" stroke="#cbd5e1" stroke-width="1.5" />
        <text x="${tickX}" y="${height - margin.bottom + 22}" fill="#64748b" font-size="11" font-weight="600" text-anchor="middle">${rawDate}</text>
      `;
    }
  });

  const pathsHtml = levelDefs.map(l => {
    const pointsStr = analysis.map((p, i) => `${x(i)},${y(p[l.key])}`).join(" ");
    return `<polyline points="${pointsStr}" fill="none" stroke="${l.color}" stroke-width="${l.key === 'mid' ? 2.5 : 1.2}" opacity="0.75" stroke-linecap="round" />`;
  }).join("");

  const closePointsStr = analysis.map((p, i) => `${x(i)},${y(p.close)}`).join(" ");

  chart.innerHTML = `
    <svg id="svgChart" viewBox="0 0 ${width} ${height}" style="background:#fff; width:100%; height:100%;" class="cursor-crosshair select-none">
      <line x1="${margin.left}" y1="${height - margin.bottom}" x2="${width - margin.right}" y2="${height - margin.bottom}" stroke="#cbd5e1" stroke-width="1.5" />
      <line x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${height - margin.bottom}" stroke="#cbd5e1" stroke-width="1.5" />
      ${yTicksHtml}
      ${xTicksHtml}
      ${pathsHtml}
      <polyline points="${closePointsStr}" fill="none" stroke="#0f172a" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" />
      ${(last.close >= last.plus2 || last.close <= last.minus2) ? `
        <circle cx="${x(totalCount - 1)}" cy="${y(last.close)}" r="10" fill="${last.close >= last.plus2 ? '#c94b4b' : '#12614a'}" opacity="0.4">
          <animate attributeName="r" from="6" to="18" dur="1.2s" repeatCount="indefinite"/>
          <animate attributeName="opacity" from="0.6" to="0" dur="1.2s" repeatCount="indefinite"/>
        </circle>
      ` : ""}
      <circle cx="${x(totalCount - 1)}" cy="${y(last.close)}" r="5.5" fill="#0f172a" />
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
          if (tooltipLeft + 200 > width) {
            tooltipLeft = currX - 220;
          }
          const scaleX = rect.width / width;
          const scaleY = rect.height / height;

          chartTooltip.style.display = "block";
          chartTooltip.style.left = `${tooltipLeft * scaleX}px`;
          chartTooltip.style.top = `${15 * scaleY}px`;

          const symbolCode = symbolInput.value.trim().toUpperCase();
          const pFun = getFundamentals(symbolCode, point.close);
          const histPe = pFun.eps > 0 ? `${(point.close / pFun.eps).toFixed(1)}x` : "N/A";
          const histYield = `${((pFun.dividend / point.close) * 100).toFixed(2)}%`;

          chartTooltip.innerHTML = `
            <div class="font-extrabold border-b border-slate-700 pb-1.5 mb-1.5 text-indigo-400">${point.date}</div>
            <div class="flex justify-between"><span>還原價:</span><strong class="text-white">${formatPrice(point.close)}</strong></div>
            <div class="flex justify-between"><span>估計 PE:</span><strong class="text-blue-300">${histPe}</strong></div>
            <div class="flex justify-between"><span>配息殖利率:</span><strong class="text-emerald-300">${histYield}</strong></div>
            <div class="border-t border-slate-700/50 mt-1.5 pt-1.5 text-[10px] space-y-0.5 text-slate-300">
              <div class="flex justify-between"><span>+2SD 樂觀:</span><span>${formatPrice(point.plus2)}</span></div>
              <div class="flex justify-between"><span>中線 mid:</span><span>${formatPrice(point.mid)}</span></div>
              <div class="flex justify-between"><span>-2SD 悲觀:</span><span>${formatPrice(point.minus2)}</span></div>
            </div>
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
      zoneText.className = "text-lg font-black block leading-tight " + (last.close >= last.plus2 ? "text-red-600" : (last.close <= last.minus2 ? "text-emerald-700" : "text-slate-900"));
    }
    if (closeText) closeText.textContent = formatPrice(last.close);
    if (r2Text) r2Text.textContent = last.r2.toFixed(3);
    if (rangeText) rangeText.textContent = getPriceRangeDesc(last);
    
    const symbolCode = symbolInput.value.trim().toUpperCase();
    const fun = getFundamentals(symbolCode, last.close);
    if (peText) peText.textContent = fun.eps > 0 ? `${(last.close / fun.eps).toFixed(1)}x` : "N/A";
    if (yieldText) yieldText.textContent = `${((fun.dividend / last.close) * 100).toFixed(2)}%`;

    renderChart(analysis);
    
    if (levelsTable) {
      levelsTable.innerHTML = levelDefs.map(l => {
        const isActive = priceZone(last) === l.label;
        return `
          <tr class="hover:bg-slate-50 transition ${isActive ? 'bg-indigo-50/50' : ''}">
            <td class="py-3 flex items-center">
              <span class="inline-block w-2.5 h-2.5 rounded-full mr-2" style="background-color:${l.color}"></span>
              ${l.label}
            </td>
            <td class="py-3 font-semibold text-slate-800">${formatPrice(last[l.key])}</td>
            <td class="py-3 text-center">
              ${isActive ? `<span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold ${l.bg}">● 當前位階</span>` : '--'}
            </td>
          </tr>
        `;
      }).join("");
    }
  } catch (e) {
    console.error("渲染出錯：", e);
  }
}

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

btnAddWatchlistSingle.addEventListener("click", () => {
  const newSym = addWatchlistInput.value.trim().toUpperCase();
  if (!newSym) return;
  
  const currentText = watchlistInput.value || "";
  const syms = currentText.split(",").map(s => s.trim().toUpperCase()).filter(s => s);
  
  if (syms.includes(newSym)) {
    watchlistStatus.textContent = `⚠️ 代號 ${newSym} 已在清單中！`;
    return;
  }
  
  if (syms.length >= 15) {
    watchlistStatus.textContent = "⚠️ 清單上限最多 15 支股票！";
    return;
  }
  
  syms.push(newSym);
  watchlistInput.value = syms.join(", ");
  localStorage.setItem("lohas_watchlist", watchlistInput.value);
  addWatchlistInput.value = "";
  
  updateRemoveSelect();
  watchlistStatus.textContent = `➕ 已新增 ${newSym}！請重新掃描。`;
  btnWatchlist.click();
});

btnRemoveWatchlistSingle.addEventListener("click", () => {
  const toRemove = removeWatchlistSelect.value;
  if (!toRemove || toRemove === "📭 清單為空") return;
  
  const currentText = watchlistInput.value || "";
  const syms = currentText.split(",").map(s => s.trim().toUpperCase()).filter(s => s);
  
  const filtered = syms.filter(s => s !== toRemove);
  watchlistInput.value = filtered.join(", ");
  localStorage.setItem("lohas_watchlist", filtered.join(", "));
  
  updateRemoveSelect();
  watchlistStatus.textContent = `➖ 已成功移除 ${toRemove}`;
  
  scannedWatchlistCache = scannedWatchlistCache.filter(item => {
    const symClean = item.sym.replace(".TW", "").replace(".TWO", "").toUpperCase();
    return symClean !== toRemove;
  });
  updateWatchlistDisplay();
});

function mockStockAPI(symbol, yearsStr) {
  const years = parseFloat(yearsStr) || 3.5;
  const totalDays = Math.round(years * 365);
  const rows = [];
  
  let basePrice = 200;
  const symUpper = symbol.toUpperCase();
  if (symUpper.includes("2330")) basePrice = 930;
  else if (symUpper.includes("1477")) basePrice = 217;
  else if (symUpper.includes("2412")) basePrice = 118;
  else if (symUpper.includes("AAPL")) basePrice = 220;
  else if (symUpper.includes("NVDA")) basePrice = 125;
  
  let p = basePrice - (totalDays * 0.05);
  const now = Date.now();
  
  for (let i = 0; i < totalDays; i++) {
    const dateObj = new Date(now - (totalDays - i) * 86400000);
    const trend = Math.sin(i / 100) * (basePrice * 0.08) + (i * 0.1); 
    const noise = (Math.random() - 0.495) * (basePrice * 0.025);
    const closeVal = Math.max(10, p + trend + noise);
    
    rows.push({
      date: dateObj.toISOString().split('T')[0],
      close: parseFloat(closeVal.toFixed(2))
    });
  }
  return { symbol: symbol, rows: rows };
}

async function smartFetch(url) {
  const isPreviewEnv = window.location.hostname === "" || 
                       window.location.protocol === "file:" || 
                       window.location.hostname.includes("sandbox") || 
                       window.location.hostname.includes("webcontainer") || 
                       window.location.hostname.includes("github") || 
                       window.location.port !== "8769";

  if (isPreviewEnv) {
    const parsed = new URL(url, window.location.origin);
    if (parsed.pathname === "/api/yahoo") {
      const symbol = parsed.searchParams.get("symbol") || "1477";
      const years = parsed.searchParams.get("years") || "3.5";
      return {
        ok: true,
        json: async () => {
          const mockData = mockStockAPI(symbol, years);
          return {
            symbol: formatSymbolDisplay(symbol),
            source: "Yahoo Finance (Mocked Preview)",
            rows: mockData.rows
          };
        }
      };
    }
  }
  return fetch(url);
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
    watchlistStatus.textContent = `🔍 正在計算五線譜... (${currentIndex} / ${totalStocks})`;

    try {
      let finalSym = s.toUpperCase();
      if (!finalSym.includes(".") && /^\d+$/.test(finalSym)) finalSym += ".TW";
      const isTwo = finalSym.includes(".TWO");
      const marketParam = isTwo ? "two" : (finalSym.includes(".TW") ? "tw" : "us");
      
      const url = `/api/yahoo?symbol=${finalSym.replace(".TW","").replace(".TWO","")}&market=${marketParam}&years=3.5`;
      const res = await smartFetch(url);
      const json = await res.json();
      
      const analysis = buildAnalysis(json.rows, "linear", "3.5");
      scannedWatchlistCache.push({
        sym: json.symbol,
        last: analysis[analysis.length - 1],
        name: getStockName(json.symbol)
      });
      updateWatchlistDisplay();
    } catch (e) {
      watchlistResult.innerHTML += `<div class="text-rose-500 text-xs p-2">❌ ${s} 計算失敗</div>`;
    }
    await new Promise(r => setTimeout(r, 100));
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
    watchlistResult.innerHTML = `<div class="text-slate-400 text-xs text-center py-6">無符合條件的標的</div>`;
    return;
  }

  resultList.forEach(item => {
    const isSellSignal = item.last.close >= item.last.plus2; 
    const isBuySignal = item.last.close <= item.last.minus2; 

    const card = document.createElement("div");
    card.className = "watchlist-item hover-trigger p-3 border rounded-xl flex justify-between items-center bg-white cursor-pointer select-none transition duration-150";

    if (isBuySignal) {
      card.style.backgroundColor = "#f0fdf4";
      card.style.borderColor = "#bbf7d0";
      card.style.borderLeft = "5px solid #12614a";
    } else if (isSellSignal) {
      card.style.backgroundColor = "#fef2f2";
      card.style.borderColor = "#fecaca";
      card.style.borderLeft = "5px solid #c94b4b";
    } else {
      card.style.borderLeft = "5px solid #2c6ebd";
    }

    const zoneColor = isSellSignal ? 'text-red-600' : (isBuySignal ? 'text-emerald-700' : 'text-blue-600');
    const fun = getFundamentals(item.sym, item.last.close);
    const peDisp = fun.eps > 0 ? `${(item.last.close / fun.eps).toFixed(1)}x` : "N/A";
    const yieldDisp = `${((fun.dividend / item.last.close) * 100).toFixed(1)}%`;

    card.innerHTML = `
      <div>
        <strong class="text-xs font-bold text-slate-900">${item.sym}</strong>
        <span class="text-[10px] text-slate-500 ml-1.5">${item.name || getStockName(item.sym)}</span><br>
        <small class="text-[10px] text-slate-400">價: ${formatPrice(item.last.close)} | PE: ${peDisp} | 殖利率: ${yieldDisp}</small>
      </div>
      <div class="text-right">
        <span class="text-xs font-black ${zoneColor}">${priceZone(item.last)}</span><br>
        <small class="text-[9px] text-slate-400">${item.last.r2.toFixed(2)} R²</small>
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

btnExportWatchlist.addEventListener("click", (e) => {
  e.preventDefault();
  const currentText = watchlistInput.value.trim();
  if (!currentText) {
    watchlistStatus.textContent = "⚠️ 清單為空，無法匯出！";
    return;
  }
  const tempTextArea = document.createElement("textarea");
  tempTextArea.value = currentText;
  document.body.appendChild(tempTextArea);
  tempTextArea.select();
  try {
    document.execCommand('copy');
    watchlistStatus.textContent = "📋 成功複製清單到剪貼簿！";
  } catch (err) {
    watchlistStatus.textContent = "❌ 複製失敗，請手動複製輸入框";
  }
  document.body.removeChild(tempTextArea);
});

btnImportWatchlist.addEventListener("click", (e) => {
  e.preventDefault();
  const userInput = prompt("請輸入先前匯出的股票代號（請用半形逗點隔開）：");
  if (userInput === null) return;
  const cleaned = userInput.trim();
  if (!cleaned) {
    watchlistStatus.textContent = "⚠️ 匯入欄位為空！";
    return;
  }
  watchlistInput.value = cleaned;
  localStorage.setItem("lohas_watchlist", cleaned);
  watchlistStatus.textContent = "📥 成功匯入清單！";
  updateRemoveSelect();
  btnWatchlist.click();
});

btnClearWatchlist.addEventListener("click", () => {
  if (btnClearWatchlist.textContent.includes("全部清除")) {
    deletedWatchlistBackup = watchlistInput.value;
    watchlistInput.value = "";
    localStorage.removeItem("lohas_watchlist");
    watchlistResult.innerHTML = `<p class="text-xs text-slate-400 text-center py-4">清單已被清除</p>`;
    scannedWatchlistCache = [];
    watchlistStatus.textContent = "🧹 已暫時清除清單！";
    btnClearWatchlist.textContent = "↩️ 復原剛才清除";
  } else {
    if (deletedWatchlistBackup) {
      watchlistInput.value = deletedWatchlistBackup;
      localStorage.setItem("lohas_watchlist", deletedWatchlistBackup);
      watchlistStatus.textContent = "↩️ 已成功回復歷史清單！";
    }
    btnClearWatchlist.textContent = "🧹 全部清除";
    btnWatchlist.click();
  }
  updateRemoveSelect();
});

fetchSymbolBtn.addEventListener("click", async () => {
  fetchStatus.textContent = "讀取中...";
  let inputVal = symbolInput.value.trim().toUpperCase();
  let selectedMarket = market.value;

  try {
    const url = `/api/yahoo?symbol=${inputVal}&market=${selectedMarket}&years=${periodYears.value}`;
    const res = await smartFetch(url);
    const json = await res.json();
    
    csvInput.value = JSON.stringify(json.rows);
    if (chartTitle) chartTitle.textContent = json.symbol;
    
    render();
    fetchStatus.textContent = "成功";
    localStorage.setItem("lohas_last_symbol", inputVal);
    localStorage.setItem("lohas_last_market", selectedMarket);
  } catch (err) { 
    fetchStatus.textContent = "失敗"; 
  }
});

document.querySelector("#sampleBtn").addEventListener("click", () => {
  const mock = []; 
  let p = 150;
  for(let i=0; i<300; i++) {
    mock.push({ 
      date: new Date(Date.now() - (300-i)*86400000).toISOString().split('T')[0], 
      close: p += (Math.random()-0.485) * 5 
    });
  }
  csvInput.value = JSON.stringify(mock);
  if (chartTitle) chartTitle.textContent = "🎲 模擬隨機股價走勢";
  render();
});

// 初始化載入與事件監聽
updateRemoveSelect();
watchlistSearch.addEventListener("input", updateWatchlistDisplay);
watchlistFilterZone.addEventListener("change", updateWatchlistDisplay);
watchlistSort.addEventListener("change", updateWatchlistDisplay);

setTimeout(() => {
  document.querySelector("#sampleBtn").click();
  btnWatchlist.click();
}, 300);