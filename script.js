// ==========================================
// 樂活通道 / 股票觀察清單 腳本 (script.js)
// ==========================================

const MAX_WATCHLIST_LIMIT = 40;

// 1. 動態字典：初始化時自動從後端 API 下載全台股/ETF名稱
let TW_STOCK_NAMES = {};

async function fetchStockNames() {
  try {
    const res = await fetch("/api/names");
    if (res.ok) {
      TW_STOCK_NAMES = await res.json();
      console.log(`✅ 已自動同步 ${Object.keys(TW_STOCK_NAMES).length} 檔最新台股/ETF名稱清單`);
    }
  } catch (e) {
    console.error("無法同步最新股票清單，將使用 API 即時帶出的名稱", e);
  }
}

// 頁面載入時初始化
document.addEventListener("DOMContentLoaded", async () => {
  const watchlistTitle = document.getElementById("watchlistTitle");
  if (watchlistTitle) {
    watchlistTitle.textContent = `📋 ${MAX_WATCHLIST_LIMIT} 檔個股巡邏監控`;
  }
  
  // 啟動時向後端取得最新的名稱對照表
  await fetchStockNames();
});

// 基本面資料字典
const STOCK_FUNDAMENTALS = {
  "1101": { eps: 2.2, dividend: 1.5 },
  "1102": { eps: 2.8, dividend: 2.1 },
  "1216": { eps: 7.2, dividend: 5.5 },
  "1513": { eps: 6.0, dividend: 3.5 },
  "2303": { eps: 4.5, dividend: 3.0 },
  "2308": { eps: 12.8, dividend: 8.0 },
  "2317": { eps: 10.2, dividend: 5.4 },
  "2330": { eps: 38.2, dividend: 16.0 },
  "2379": { eps: 26.0, dividend: 18.0 },
  "2382": { eps: 10.3, dividend: 7.2 },
  "2412": { eps: 4.8, dividend: 4.7 },
  "2454": { eps: 48.5, dividend: 30.4 },
  "2731": { eps: 8.8, dividend: 5.6 },
  "2881": { eps: 4.8, dividend: 2.5 },
  "2882": { eps: 3.6, dividend: 2.0 },
  "2884": { eps: 1.6, dividend: 1.2 },
  "2886": { eps: 2.37, dividend: 1.5 },
  "2891": { eps: 2.82, dividend: 1.8 },
  "3029": { eps: 7.2, dividend: 4.8 },
  "9917": { eps: 6.6, dividend: 5.2 },
  "9939": { eps: 7.8, dividend: 5.5 }
};

// ------------------------------------------
// 2. DOM 元素選取與全域變數
// ------------------------------------------
const csvInput = document.querySelector("#csvInput");
const market = document.querySelector("#market");
const symbolInput = document.querySelector("#symbolInput");
const fetchSymbolBtn = document.querySelector("#fetchSymbolBtn");
const fetchStatus = document.querySelector("#fetchStatus");
const periodYears = document.querySelector("#periodYears");
const modelMode = document.querySelector("#modelMode");
const chart = document.querySelector("#chart");
const chartTitle = document.querySelector("#chartTitle");
const btnAddToWatchlist = document.querySelector("#btnAddToWatchlist");

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

// ------------------------------------------
// 3. 通用工具與計算函式
// ------------------------------------------
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

function formatSymbolDisplay(symbol, nameOverride) {
  const name = nameOverride || getStockName(symbol);
  return name ? `${symbol} ${name}` : symbol;
}

function getNearestLevel(p) {
  if (!p) return { label: "", price: 0, diff: 0, pct: 999 };
  const currentPrice = p.close;
  let nearest = null;
  let minDiff = Infinity;

  levelDefs.forEach(l => {
    const levelPrice = p[l.key];
    const absDiff = Math.abs(currentPrice - levelPrice);
    
    if (absDiff < minDiff) {
      minDiff = absDiff;
      const diffVal = currentPrice - levelPrice;
      const pct = levelPrice > 0 ? (absDiff / levelPrice) * 100 : 999;

      nearest = {
        label: l.label,
        key: l.key,
        color: l.color,
        price: levelPrice,
        diff: diffVal,
        absDiff: absDiff,
        pct: pct
      };
    }
  });
  return nearest;
}

function getNearestDistance(p) {
  const nearest = getNearestLevel(p);
  return nearest ? nearest.pct : 999;
}

function formatNearestText(nearest) {
  if (!nearest || !nearest.label) return "";
  const sign = nearest.diff >= 0 ? "高" : "低";
  const absDiff = Math.abs(nearest.diff).toFixed(2);
  const absPct = Math.abs(nearest.pct).toFixed(2);
  const cleanLabel = nearest.label.replace(/^[\+\-]\dSD\s*/, "");
  return `距 ${cleanLabel} (${formatPrice(nearest.price)}) 還 ${sign} ${absDiff} 元 (${absPct}%)`;
}

function priceZone(p) {
  if (!p) return "";
  if (p.close >= p.plus2) return "樂觀區上緣";
  if (p.close >= p.plus1) return "相對樂觀區";
  if (p.close >= p.mid) return "中線以上";
  if (p.close >= p.minus1) return "中線以下";
  if (p.close >= p.minus2) return "相對悲觀區";
  return "悲觀區下緣";
}

function getPriceRangeDesc(p) {
  if (!p) return "";
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
  return Number(v || 0).toLocaleString("zh-TW", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); 
}

// ------------------------------------------
// 4. 初始化與快取管理
// ------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  const savedWatchlist = localStorage.getItem("lohas_watchlist");
  if (savedWatchlist && watchlistInput) {
    watchlistInput.value = savedWatchlist;
  }

  const savedLastSymbol = localStorage.getItem("lohas_last_symbol");
  const savedLastMarket = localStorage.getItem("lohas_last_market");
  if (savedLastSymbol && symbolInput) symbolInput.value = savedLastSymbol;
  if (savedLastMarket && market) market.value = savedLastMarket;

  updateRemoveSelect();

  if (watchlistSearch) watchlistSearch.addEventListener("input", updateWatchlistDisplay);
  if (watchlistFilterZone) watchlistFilterZone.addEventListener("change", updateWatchlistDisplay);
  if (watchlistSort) watchlistSort.addEventListener("change", updateWatchlistDisplay);

  loadWatchlistFromCache();
});

function loadWatchlistFromCache() {
  const cachedData = localStorage.getItem("lohas_watchlist_cache_data");
  const cachedTime = localStorage.getItem("lohas_watchlist_cache_time");

  if (cachedData && cachedTime) {
    try {
      scannedWatchlistCache = JSON.parse(cachedData);
      updateWatchlistDisplay();
      if (watchlistStatus) {
        watchlistStatus.textContent = `📁 上次暫存 (儲存於 ${cachedTime})`;
        watchlistStatus.style.color = "#64748b";
      }
    } catch (e) {
      console.error("讀取快取失敗", e);
    }
  }
}

function saveWatchlistCache() {
  const nowStr = new Date().toLocaleString("zh-TW", { 
    year: 'numeric', month: '2-digit', day: '2-digit', 
    hour: '2-digit', minute: '2-digit', hour12: false 
  });
  localStorage.setItem("lohas_watchlist_cache_data", JSON.stringify(scannedWatchlistCache));
  localStorage.setItem("lohas_watchlist_cache_time", nowStr);
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

// ------------------------------------------
// 5. 迴歸分析與通道計算
// ------------------------------------------
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

function buildAnalysis(data, currentMode = (modelMode ? modelMode.value : "linear"), currentYears = (periodYears ? periodYears.value : "3.5")) {
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

// ------------------------------------------
// 6. 圖表渲染
// ------------------------------------------
function renderChart(analysis) {
  if (!chart) return;
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
      
      const nearest = getNearestLevel(last);
      const nearestText = formatNearestText(nearest);
      const nearestEl = document.querySelector("#nearestText");
      if (nearestEl) {
        nearestEl.textContent = nearestText;
        nearestEl.style.color = nearest.diff >= 0 ? "#c94b4b" : "#1f8a63";
      }
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

// ------------------------------------------
// 7. API 資料抓取 (Chip & Yahoo)
// ------------------------------------------
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

async function fetchLevelForWatchlist(symbol) {
  let finalSym = symbol.trim().toUpperCase();
  if (!finalSym.includes(".") && /^\d+$/.test(finalSym)) finalSym += ".TW";
  
  const cleanCode = finalSym.replace(".TW", "").replace(".TWO", "");
  const mkt = finalSym.includes(".TWO") ? "two" : (finalSym.includes(".TW") ? "tw" : "us");
  const p = new URLSearchParams({ symbol: cleanCode, market: mkt, years: "3.5" });

  const [yahooRes, chipRes] = await Promise.allSettled([
    fetch(`/api/yahoo?${p.toString()}`).then(r => r.ok ? r.json() : Promise.reject(r)),
    fetch(`/api/chip?symbol=${encodeURIComponent(cleanCode)}`).then(r => r.ok ? r.json() : null)
  ]);

  if (yahooRes.status !== "fulfilled") {
    throw new Error(`股價抓取失敗: ${symbol}`);
  }

  const json = yahooRes.value;
  const chipData = chipRes.status === "fulfilled" ? chipRes.value : null;
  const analysis = buildAnalysis(json.rows, "linear", "3.5");

  // 優先使用 OpenData/後端發送回來的中文名稱
  const displayName = json.name || getStockName(json.symbol) || "";

  return { 
    sym: json.symbol, 
    last: analysis[analysis.length - 1], 
    name: displayName,
    chip: chipData
  };
}

// ------------------------------------------
// 8. 觀察清單邏輯
// ------------------------------------------
if (btnWatchlist) {
  btnWatchlist.addEventListener("click", async () => {
    const rawInput = watchlistInput.value;
    localStorage.setItem("lohas_watchlist", rawInput);

    const syms = rawInput
      .split(",")
      .map(s => s.trim().toUpperCase())
      .filter(s => s.length > 0)
      .slice(0, MAX_WATCHLIST_LIMIT);

    if (syms.length === 0) {
      watchlistStatus.textContent = "⚠️ 請輸入有效的股票代碼！";
      watchlistStatus.style.color = "var(--red, #c94b4b)";
      return;
    }

    watchlistResult.innerHTML = "";
    scannedWatchlistCache = [];
    btnWatchlist.disabled = true;

    watchlistStatus.textContent = `🔄 正在批量更新 ${syms.length} 支股票（含籌碼）...`;
    watchlistStatus.style.color = "var(--blue)";

    try {
      const fetchPromises = syms.map(symbol => fetchLevelForWatchlist(symbol));
      const results = await Promise.allSettled(fetchPromises);

      let successCount = 0;
      let failCount = 0;

      results.forEach((result, index) => {
        if (result.status === "fulfilled") {
          scannedWatchlistCache.push(result.value);
          successCount++;
        } else {
          failCount++;
          console.error(`❌ 股票 ${syms[index]} 抓取失敗:`, result.reason);
        }
      });

      updateWatchlistDisplay();
      saveWatchlistCache();

      if (failCount === 0) {
        watchlistStatus.textContent = `✅ 更新完成 (共 ${successCount} 檔)`;
        watchlistStatus.style.color = "var(--blue)";
      } else {
        watchlistStatus.textContent = `⚠️ 更新完成：成功 ${successCount} 檔，失敗 ${failCount} 檔`;
        watchlistStatus.style.color = "#d9852b";
      }

    } catch (err) {
      console.error("批量更新過程發生未預期錯誤:", err);
      watchlistStatus.textContent = "❌ 批量更新失敗，請檢查網路或 API 狀態。";
      watchlistStatus.style.color = "var(--red, #c94b4b)";
    } finally {
      btnWatchlist.disabled = false;
    }
  });
}

function updateWatchlistDisplay() {
  if (!scannedWatchlistCache || scannedWatchlistCache.length === 0) return;

  const searchQuery = watchlistSearch ? watchlistSearch.value.trim().toLowerCase() : "";
  const filterZone = watchlistFilterZone ? watchlistFilterZone.value : "all";
  const sortMode = watchlistSort ? watchlistSort.value : "code";

  let resultList = scannedWatchlistCache.filter(item => {
    const dictName = getStockName(item.sym);
    const apiName = item.name || "";
    
    // 關鍵字搜尋：代號、字典名稱或 OpenData 下載的 API 名稱
    const matchSearch = item.sym.toLowerCase().includes(searchQuery) || 
                        dictName.toLowerCase().includes(searchQuery) ||
                        apiName.toLowerCase().includes(searchQuery);
    
    const zone = priceZone(item.last);
    let matchZone = true;
    if (filterZone === "cheap") {
      matchZone = (zone === "悲觀區下緣" || zone === "相對悲觀區" || zone === "中線以下");
    } else if (filterZone === "expensive") {
      matchZone = (zone === "樂觀區上緣" || zone === "相對樂觀區" || zone === "中線以上");
    }

    return matchSearch && matchZone;
  });

  resultList.sort((a, b) => {
    if (sortMode === "code") {
      return a.sym.localeCompare(b.sym);
    } else if (sortMode === "rankAsc") {
      return getZoneWeight(priceZone(a.last)) - getZoneWeight(priceZone(b.last));
    } else if (sortMode === "rankDesc") {
      return getZoneWeight(priceZone(b.last)) - getZoneWeight(priceZone(a.last));
    } else if (sortMode === "nearAsc") {
      return getNearestDistance(a.last) - getNearestDistance(b.last);
    } else if (sortMode === "nearDesc") {
      return getNearestDistance(b.last) - getNearestDistance(a.last);
    }
    return 0;
  });

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

    let chipSummary = '<span style="color:#94a3b8;">無籌碼資料</span>';
    if (item.chip && !item.chip.error) {
      const total = item.chip.total || 0;
      const chipColor = total > 0 ? "#c94b4b" : (total < 0 ? "#1f8a63" : "inherit");
      const sign = total > 0 ? "+" : "";
      chipSummary = `三大法人: <strong style="color:${chipColor}">${sign}${total.toLocaleString()} 張</strong>`;
    }

    const nearest = getNearestLevel(item.last);
    const nearestHint = formatNearestText(nearest);

    // 優先帶出從後端自動抓取的中文名稱
    const displayName = item.name || getStockName(item.sym) || "";

    card.innerHTML = `
      <div>
        <strong>${item.sym}</strong>${displayName ? `<span style="color:#555; font-size:0.85em; margin-left:6px; font-weight:600;">${displayName}</span>` : ""}<br>
        <small style="color:${smallTextColor}; display: block; margin-top: 4px; line-height: 1.5;">
          <span style="white-space: nowrap;">現價: ${formatPrice(item.last.raw_close || item.last.close)}</span> 
          <span style="white-space: nowrap;">(還原: ${formatPrice(item.last.close)})</span>
          <br>
          <span style="white-space: nowrap;">PE: ${peDisp}</span> | 
          <span style="white-space: nowrap;">殖利率: ${yieldDisp}</span>
          <br>
          <span style="white-space: nowrap;">${chipSummary}</span>
        </small>
      </div>
      <div style="text-align:right;">
        <span style="font-weight:900; color:${zoneColor}">${priceZone(item.last)}</span>
        <br>
        <small style="color:${smallTextColor}">區間: ${getPriceRangeDesc(item.last)}</small>
        <br>
        <small style="color:var(--blue); font-weight:bold; font-size: 0.78rem;">📌 ${nearestHint}</small>
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

// ------------------------------------------
// 9. 個股查詢與單一操作邏輯
// ------------------------------------------
if (fetchSymbolBtn) {
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
        chartTitle.textContent = formatSymbolDisplay(json.symbol, json.name);
      }
      
      if (btnAddToWatchlist) {
        btnAddToWatchlist.style.display = "inline-block";
      }

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
}

// ------------------------------------------
// 10.【功能一】：圖表標題旁「⭐ 加入觀察清單」按鈕
// ------------------------------------------
if (btnAddToWatchlist) {
  btnAddToWatchlist.addEventListener("click", async () => {
    const rawSym = symbolInput.value.trim().toUpperCase();
    if (!rawSym) {
      alert("⚠️ 請先輸入股票代碼！");
      return;
    }

    const currentText = watchlistInput.value || "";
    const syms = currentText.split(",").map(s => s.trim().toUpperCase()).filter(s => s);

    if (syms.includes(rawSym)) {
      alert(`⚠️ 股號 ${rawSym} 已在觀察清單中！`);
      return;
    }

    if (syms.length >= MAX_WATCHLIST_LIMIT) {
      alert(`⚠️ 觀察清單最多只能 ${MAX_WATCHLIST_LIMIT} 支股票！`);
      return;
    }

    syms.push(rawSym);
    watchlistInput.value = syms.join(", ");
    localStorage.setItem("lohas_watchlist", watchlistInput.value);

    updateRemoveSelect();
    
    try {
      const data = await fetchLevelForWatchlist(rawSym);
      scannedWatchlistCache = scannedWatchlistCache.filter(item => {
        const symClean = item.sym.replace(".TW", "").replace(".TWO", "").toUpperCase();
        return symClean !== rawSym;
      });
      scannedWatchlistCache.push(data);
      updateWatchlistDisplay();
      saveWatchlistCache();
      alert(`✅ 已成功將 ${rawSym} 加入觀察清單！`);
    } catch (err) {
      alert(`✅ 已將 ${rawSym} 加入清單，請至下方點擊「執行批量掃描更新」。`);
    }
  });
}

// ------------------------------------------
// 11. 單一新增 / 刪除個股邏輯
// ------------------------------------------
if (btnAddWatchlistSingle) {
  btnAddWatchlistSingle.addEventListener("click", async () => {
    const newSym = addWatchlistInput.value.trim().toUpperCase();
    if (!newSym) return;
    
    const currentText = watchlistInput.value || "";
    const syms = currentText.split(",").map(s => s.trim().toUpperCase()).filter(s => s);
    
    if (syms.includes(newSym)) {
      watchlistStatus.textContent = `⚠️ 股號 ${newSym} 已在清單中！`;
      return;
    }
    
    if (syms.length >= MAX_WATCHLIST_LIMIT) {
      watchlistStatus.textContent = `⚠️ 監控清單最多只能 ${MAX_WATCHLIST_LIMIT} 支股票喔！`;
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
      scannedWatchlistCache = scannedWatchlistCache.filter(item => {
        const symClean = item.sym.replace(".TW", "").replace(".TWO", "").toUpperCase();
        return symClean !== newSym;
      });
      scannedWatchlistCache.push(data);
      updateWatchlistDisplay();
      
      saveWatchlistCache();
      watchlistStatus.textContent = `✅ 已成功新增 ${newSym}！`;
      watchlistStatus.style.color = "var(--blue)";
    } catch (err) {
      watchlistStatus.textContent = `❌ 即時新增 ${newSym} 失敗，請點擊「執行批量更新」。`;
    }
  });
}

if (btnRemoveWatchlistSingle) {
  btnRemoveWatchlistSingle.addEventListener("click", () => {
    const toRemove = removeWatchlistSelect.value;
    if (!toRemove || toRemove === "📭 清單為空") return;
    
    const currentText = watchlistInput.value || "";
    const syms = currentText.split(",").map(s => s.trim().toUpperCase()).filter(s => s);
    
    const filtered = syms.filter(s => s !== toRemove);
    watchlistInput.value = filtered.join(", ");
    localStorage.setItem("lohas_watchlist", filtered.join(", "));
    
    updateRemoveSelect();
    watchlistStatus.textContent = `➖ 已刪除 ${toRemove}`;
    watchlistStatus.style.color = "var(--blue)";
    
    scannedWatchlistCache = scannedWatchlistCache.filter(item => {
      const symClean = item.sym.replace(".TW", "").replace(".TWO", "").toUpperCase();
      return symClean !== toRemove;
    });
    updateWatchlistDisplay();
    saveWatchlistCache();
  });
}

if (btnClearWatchlist) {
  btnClearWatchlist.addEventListener("click", () => {
    if (btnClearWatchlist.textContent.includes("全部清除")) {
      deletedWatchlistBackup = watchlistInput.value;
      watchlistInput.value = "";
      localStorage.removeItem("lohas_watchlist");
      localStorage.removeItem("lohas_watchlist_cache_data");
      localStorage.removeItem("lohas_watchlist_cache_time");
      watchlistResult.innerHTML = "";
      scannedWatchlistCache = [];
      watchlistStatus.textContent = "🧹 已暫時清除，可點擊按鈕復原";
      watchlistStatus.style.color = "var(--blue)";
      
      btnClearWatchlist.textContent = "↩️ 復原清除清單";
      btnClearWatchlist.style.backgroundColor = "#d9852b"; 

      if (watchlistSort) watchlistSort.value = "rankDesc";
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
}

// ------------------------------------------
// 12. 複製與智慧併集合併匯入
// ------------------------------------------
if (btnExportWatchlist) {
  btnExportWatchlist.addEventListener("click", (e) => {
    e.preventDefault();
    const currentText = watchlistInput.value.trim();
    if (!currentText) {
      if (watchlistStatus) watchlistStatus.textContent = "⚠️ 目前清單是空的，無法複製喔！";
      return;
    }
    
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(currentText).then(() => {
        if (watchlistStatus) watchlistStatus.textContent = "📋 清單已自動複製到剪貼簿！可傳送至手機/其他裝置匯入。";
      }).catch(() => {
        watchlistInput.select();
        document.execCommand("copy");
        if (watchlistStatus) watchlistStatus.textContent = "📋 清單已複製到剪貼簿！";
      });
    } else {
      watchlistInput.select();
      document.execCommand("copy");
      if (watchlistStatus) watchlistStatus.textContent = "📋 清單已複製到剪貼簿！";
    }
  });
}

if (btnImportWatchlist) {
  btnImportWatchlist.addEventListener("click", (e) => {
    e.preventDefault();
    const userInput = prompt("請貼上您要匯入的股票代號（例如: 2330, 2317, 2454）：");
    if (userInput === null) return;
    
    const existingSyms = (watchlistInput.value || "")
      .split(",")
      .map(s => s.trim().toUpperCase())
      .filter(s => s);

    const importedSyms = userInput
      .split(",")
      .map(s => s.trim().toUpperCase())
      .filter(s => s);

    if (importedSyms.length === 0) {
      alert("⚠️ 輸入內容無有效股票代碼！");
      return;
    }

    const mergedSet = new Set([...existingSyms, ...importedSyms]);
    const mergedList = Array.from(mergedSet);

    if (mergedList.length > MAX_WATCHLIST_LIMIT) {
      alert(`⚠️ 合併後數量超過 ${MAX_WATCHLIST_LIMIT} 支上限，將自動截取保留前 ${MAX_WATCHLIST_LIMIT} 支股票。`);
      mergedList.length = MAX_WATCHLIST_LIMIT;
    }

    watchlistInput.value = mergedList.join(", ");
    localStorage.setItem("lohas_watchlist", watchlistInput.value);

    updateRemoveSelect();

    const addedCount = mergedList.length - existingSyms.length;
    if (watchlistStatus) {
      watchlistStatus.textContent = `📥 併集合併完成！共 ${mergedList.length} 檔 (新增 ${addedCount > 0 ? addedCount : 0} 檔)。請點擊「執行批量掃描更新」。`;
      watchlistStatus.style.color = "var(--blue)";
    }
    
    alert(`✅ 清單併集合併成功！\n原清單: ${existingSyms.length} 支\n新增: ${addedCount > 0 ? addedCount : 0} 支\n合併後總計: ${mergedList.length} 支股票。\n\n請點擊「執行批量掃描更新」以載入最新數據。`);
  });
}

// ------------------------------------------
// 13. 模擬範例數據按鈕
// ------------------------------------------
if (document.querySelector("#sampleBtn")) {
  document.querySelector("#sampleBtn").addEventListener("click", () => {
    const mock = []; 
    let p = 100;
    for(let i = 0; i < 300; i++) {
      mock.push({ 
        date: new Date(Date.now() - (300 - i) * 86400000).toISOString().split('T')[0], 
        close: p += (Math.random() - 0.48) 
      });
    }
    csvInput.value = JSON.stringify(mock);
    if (chartTitle) chartTitle.textContent = "模擬範例股票";
    render();
  });
}