// ==========================================
// 樂活通道 / 股票觀察清單 腳本 (script.js)
// ==========================================

const MAX_WATCHLIST_LIMIT = 40;
const DYNAMIC_STOCK_NAMES = {};

// ------------------------------------------
// 1. 靜態資料字典與基本面資料
// ------------------------------------------
const TW_STOCK_NAMES = {
  "1477":"聚陽", "1795":"美時", "2480":"敦陽科", "3023":"信邦", 
  "3147":"大綜", "3551":"世禾", "5340":"建榮", "5439":"高技", "9911":"櫻花",
  "0050":"元大台灣50", "0056":"元大高股息", "00878":"國泰永續高股息", 
  "00919":"群益台灣精選高息", "00929":"復華台灣科技優息", "00940":"元大台灣價值高息",
  "1101":"台泥","1102":"亞泥","1216":"統一","1301":"台塑","1303":"南亞",
  "2002":"中鋼","2301":"光寶科","2303":"聯電","2308":"台達電","2317":"鴻海",
  "2330":"台積電","2357":"華碩","2379":"瑞昱","2382":"廣達","2412":"中華電",
  "2454":"聯發科","2603":"長榮","2881":"富邦金","2882":"國泰金","2886":"兆豐金",
  "2891":"中信金","3008":"大立光","3034":"聯詠","3231":"緯創","6505":"台塑化"
};

const STOCK_FUNDAMENTALS = {
  "1101": { eps: 2.2, dividend: 1.5 },
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
  "2886": { eps: 2.37, dividend: 1.5 },
  "2891": { eps: 2.82, dividend: 1.8 }
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
async function initStockNames() {
  try {
    const res = await fetch("/api/stock-names");
    if (res.ok) {
      const data = await res.json();
      Object.assign(DYNAMIC_STOCK_NAMES, data);
    }
  } catch (err) {
    console.warn("同步動態股票名稱庫跳過，使用靜態對照表");
  }
}

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
  return DYNAMIC_STOCK_NAMES[code] || TW_STOCK_NAMES[code] || "";
}

function formatSymbolDisplay(symbol) {
  const name = getStockName(symbol);
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
document.addEventListener("DOMContentLoaded", async () => {
  await initStockNames();

  const watchlistTitle = document.getElementById("watchlistTitle");
  if (watchlistTitle) {
    watchlistTitle.textContent = `📋 ${MAX_WATCHLIST_LIMIT} 檔個股巡邏監控`;
  }

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
// 6. 圖表渲染 (SVG)
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
      <circle cx="${x(totalCount - 1)}" cy="${y(last.close)}" r="5" fill="#0f172a" />
    </svg>
  `;
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

    renderChart(analysis);
    if (levelsTable) {
      levelsTable.innerHTML = levelDefs.map(l => `<tr><td>${l.label}</td><td>${formatPrice(last[l.key])}</td><td>${priceZone(last) === l.label ? "●" : ""}</td></tr>`).join("");
    }
  } catch (e) {
    console.error("渲染出錯：", e);
  }
}

// ------------------------------------------
// 7. API 資料讀取
// ------------------------------------------
async function loadMainChipData(symbol) {
  const chipEl = document.querySelector("#chipText");
  if (!chipEl) return;

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

    chipEl.innerHTML = `
      (${chip.date}) : 外資 ${fmtDiff(chip.foreign)} 張 | 投信 ${fmtDiff(chip.trust)} 張 | 自營 ${fmtDiff(chip.dealer)} 張 | 合計 ${fmtDiff(chip.total)} 張
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
  const displayName = getStockName(json.symbol) || json.name || "";

  return { 
    sym: json.symbol, 
    last: analysis[analysis.length - 1], 
    name: displayName,
    chip: chipData
  };
}

// ------------------------------------------
// 8. 觀察清單畫卡與點擊切換 Bug 修正
// ------------------------------------------
function updateWatchlistDisplay() {
  if (!scannedWatchlistCache || scannedWatchlistCache.length === 0) return;

  const searchQuery = watchlistSearch ? watchlistSearch.value.trim().toLowerCase() : "";
  const filterZone = watchlistFilterZone ? watchlistFilterZone.value : "all";

  let resultList = scannedWatchlistCache.filter(item => {
    const dictName = getStockName(item.sym);
    const apiName = item.name || "";
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

  watchlistResult.innerHTML = "";
  resultList.forEach(item => {
    const card = document.createElement("div");
    card.className = "watchlist-item";
    card.style.cursor = "pointer";
    card.style.padding = "10px";
    card.style.marginBottom = "8px";
    card.style.border = "1px solid #e2e8f0";
    card.style.borderRadius = "8px";

    const displayName = getStockName(item.sym) || item.name || "";

    card.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <div>
          <strong>${item.sym}</strong> <span style="color:#555;">${displayName}</span>
          <div>現價: ${formatPrice(item.last.close)}</div>
        </div>
        <div style="text-align:right;">
          <span style="font-weight:bold;">${priceZone(item.last)}</span>
        </div>
      </div>
    `;

    // 💡 點擊事件：卡片點擊切換圖表，修正市場下拉選單安全匹配
    card.addEventListener("click", () => {
      let rawSym = item.sym.toUpperCase();
      let mktVal = "tw";
      
      if (rawSym.endsWith(".TWO")) {
        mktVal = "two";
        rawSym = rawSym.replace(".TWO", "");
      } else if (rawSym.endsWith(".TW")) {
        mktVal = "tw";
        rawSym = rawSym.replace(".TW", "");
      } else if (!/^\d+$/.test(rawSym)) {
        mktVal = "us";
      }
      
      symbolInput.value = rawSym;
      if (market && Array.from(market.options).some(opt => opt.value === mktVal)) {
        market.value = mktVal;
      }
      if (fetchSymbolBtn) fetchSymbolBtn.click();
    });

    watchlistResult.appendChild(card);
  });
}

// ------------------------------------------
// 9. 按鈕事件綁定
// ------------------------------------------
if (fetchSymbolBtn) {
  fetchSymbolBtn.addEventListener("click", async () => {
    if (fetchStatus) fetchStatus.textContent = "讀取中...";
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

      loadMainChipData(inputVal);
      render();

      if (fetchStatus) fetchStatus.textContent = "成功";
      localStorage.setItem("lohas_last_symbol", inputVal);
      localStorage.setItem("lohas_last_market", selectedMarket);
    } catch (err) { 
      if (fetchStatus) fetchStatus.textContent = "失敗"; 
    }
  });
}