// ==========================================
// 樂活通道 / 均線通道 / 五線譜 腳本 (script.js)
// ==========================================
const MAX_WATCHLIST_LIMIT = 40;
let currentMainChipData = null;
let TW_STOCK_NAMES = {};

async function fetchStockNames() {
  try {
    const res = await fetch("/api/names");
    if (res.ok) TW_STOCK_NAMES = await res.json();
  } catch (e) {}
}

const STOCK_FUNDAMENTALS = {
  "2330": { eps: 38.2, dividend: 16.0 },
  "2412": { eps: 4.8, dividend: 4.7 },
  "3045": { eps: 6.0, dividend: 4.5 },
  "2881": { eps: 4.8, dividend: 2.5 }
};

let csvInput, market, symbolInput, fetchSymbolBtn, fetchStatus, periodYears, modelMode;
let showChannelCheckbox, toggleBand, chart, chartTitle, btnAddToWatchlist, rangeText, zoneText, closeText, r2Text, levelsTable;
let peText, yieldText, watchlistInput, btnWatchlist, btnClearWatchlist, watchlistResult;
let watchlistStatus, addWatchlistInput, btnAddWatchlistSingle, removeWatchlistSelect;
let btnRemoveWatchlistSingle, btnExportWatchlist, btnImportWatchlist, watchlistSearch;
let watchlistFilterZone, watchlistSort;

let deletedWatchlistBackup = "";
let scannedWatchlistCache = [];

const levelDefs = [
  { key: "plus2", label: "+2SD 樂觀線", color: "#c94b4b" },
  { key: "plus1", label: "+1SD 相對樂觀線", color: "#d9852b" },
  { key: "mid", label: "中線", color: "#2c6ebd" },
  { key: "minus1", label: "-1SD 相對悲觀線", color: "#1f8a63" },
  { key: "minus2", label: "-2SD 悲觀線", color: "#12614a" },
];

function initDOMElements() {
  csvInput = document.querySelector("#csvInput");
  market = document.querySelector("#market");
  symbolInput = document.querySelector("#symbolInput");
  fetchSymbolBtn = document.querySelector("#fetchSymbolBtn");
  fetchStatus = document.querySelector("#fetchStatus");
  periodYears = document.querySelector("#periodYears");
  modelMode = document.querySelector("#modelMode");
  toggleBand = document.querySelector("#toggleBand");
  showChannelCheckbox = document.querySelector("#showChannelCheckbox");
  chart = document.querySelector("#chart");
  chartTitle = document.querySelector("#chartTitle");
  btnAddToWatchlist = document.querySelector("#btnAddToWatchlist");
  rangeText = document.querySelector("#rangeText");
  zoneText = document.querySelector("#zoneText");
  closeText = document.querySelector("#closeText");
  r2Text = document.querySelector("#r2Text");
  levelsTable = document.querySelector("#levelsTable");
  peText = document.querySelector("#peText");
  yieldText = document.querySelector("#yieldText");
  watchlistInput = document.querySelector("#watchlistInput");
  btnWatchlist = document.querySelector("#btnWatchlist");
  btnClearWatchlist = document.querySelector("#btnClearWatchlist");
  watchlistResult = document.querySelector("#watchlistResult");
  watchlistStatus = document.querySelector("#watchlistStatus");
  addWatchlistInput = document.querySelector("#addWatchlistInput");
  btnAddWatchlistSingle = document.querySelector("#btnAddWatchlistSingle");
  removeWatchlistSelect = document.querySelector("#removeWatchlistSelect");
  btnRemoveWatchlistSingle = document.querySelector("#btnRemoveWatchlistSingle");
  btnExportWatchlist = document.querySelector("#btnExportWatchlist");
  btnImportWatchlist = document.querySelector("#btnImportWatchlist");
  watchlistSearch = document.querySelector("#watchlistSearch");
  watchlistFilterZone = document.querySelector("#watchlistFilterZone");
  watchlistSort = document.querySelector("#watchlistSort");
}

function isBandChannelActive() {
  if (toggleBand) {
    if (toggleBand.type === "checkbox") return toggleBand.checked;
    if (toggleBand.classList) return toggleBand.classList.contains("active");
  }
  if (showChannelCheckbox) return showChannelCheckbox.checked;
  return false;
}

function getFundamentals(symbol, currentPrice) {
  if (!symbol) return { eps: 10, dividend: 4 };
  const code = symbol.replace(/\.(TW|TWO)$/i, "").toUpperCase();
  if (STOCK_FUNDAMENTALS[code]) return STOCK_FUNDAMENTALS[code];
  const safePrice = currentPrice || 100;
  return { eps: +(safePrice / 16).toFixed(2), dividend: +(safePrice * 0.04).toFixed(2) };
}

function getStockName(symbol) {
  if (!symbol) return "";
  return TW_STOCK_NAMES[symbol.replace(/\.(TW|TWO)$/i, "").toUpperCase()] || "";
}

function formatSymbolDisplay(symbol, nameOverride) {
  const name = nameOverride || getStockName(symbol);
  return name ? `${symbol} ${name}` : symbol;
}

function getNearestLevel(p) {
  if (!p) return { label: "", price: 0, diff: 0, pct: 999 };
  let nearest = null, minDiff = Infinity;
  levelDefs.forEach(l => {
    const absDiff = Math.abs(p.close - p[l.key]);
    if (absDiff < minDiff) {
      minDiff = absDiff;
      nearest = { label: l.label, price: p[l.key], diff: p.close - p[l.key], pct: (absDiff / p[l.key]) * 100 };
    }
  });
  return nearest;
}

function formatNearestText(nearest) {
  if (!nearest || !nearest.label) return "";
  return `距 ${nearest.label.replace(/^[\+\-]\dSD\s*/, "")} 還有 ${Math.abs(nearest.diff).toFixed(2)} 元 (${Math.abs(nearest.pct).toFixed(2)}%)`;
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

function getActionBadge(zoneStr) {
  if (zoneStr.includes("樂觀")) return { text: "🔴 減碼", style: "background:#fee2e2; color:#dc2626;" };
  if (zoneStr.includes("悲觀")) return { text: "🟢 加碼", style: "background:#d1fae5; color:#059669;" };
  return { text: "🟡 觀望", style: "background:#fef3c7; color:#d97706;" };
}

function getPriceRangeDesc(p) {
  if (!p) return "";
  if (p.close >= p.plus2) return `> ${p.plus2.toFixed(2)} (+2SD)`;
  if (p.close >= p.plus1) return `${p.plus1.toFixed(2)} ~ ${p.plus2.toFixed(2)}`;
  if (p.close >= p.mid) return `${p.mid.toFixed(2)} ~ ${p.plus1.toFixed(2)}`;
  if (p.close >= p.minus1) return `${p.minus1.toFixed(2)} ~ ${p.mid.toFixed(2)}`;
  if (p.close >= p.minus2) return `${p.minus2.toFixed(2)} ~ ${p.minus1.toFixed(2)}`;
  return `< ${p.minus2.toFixed(2)}`;
}

function formatPrice(v) { return Number(v || 0).toLocaleString("zh-TW", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

document.addEventListener("DOMContentLoaded", async () => {
  initDOMElements();
  await fetchStockNames();
  if (localStorage.getItem("lohas_watchlist") && watchlistInput) {
    watchlistInput.value = localStorage.getItem("lohas_watchlist");
  }
  updateRemoveSelect();
  bindEvents();
  loadWatchlistFromCache();
});

function loadWatchlistFromCache() {
  const cached = localStorage.getItem("lohas_watchlist_cache_data");
  if (cached) {
    try {
      scannedWatchlistCache = JSON.parse(cached);
      updateWatchlistDisplay();
    } catch (e) {}
  }
}

function saveWatchlistCache() {
  localStorage.setItem("lohas_watchlist_cache_data", JSON.stringify(scannedWatchlistCache));
  localStorage.setItem("lohas_watchlist_cache_time", new Date().toLocaleString());
}

function updateRemoveSelect() {
  if (!removeWatchlistSelect || !watchlistInput) return;
  const syms = (watchlistInput.value || "").split(",").map(s => s.trim().toUpperCase()).filter(Boolean);
  removeWatchlistSelect.innerHTML = syms.length === 0 ? '<option value="">清單為空</option>' : syms.map(s => `<option value="${s}">${s}</option>`).join("");
}

function calculateATR(data, period = 14) {
  const tr = data.map((p, i) => {
    const prev = i > 0 ? data[i - 1].close : p.close;
    return Math.max(p.close - p.close, Math.abs(p.close - prev));
  });
  return tr.map((_, i, arr) => arr.slice(Math.max(0, i - period + 1), i + 1).reduce((a, b) => a + b, 0) / Math.min(i + 1, period));
}

function calculateBandChannel(data) {
  const atr = calculateATR(data);
  return data.map((p, i) => {
    const sma = data.slice(Math.max(0, i - 19), i + 1).reduce((sum, cur) => sum + cur.close, 0) / Math.min(i + 1, 20);
    return { bandMid: sma, bandUpper: sma + 2 * atr[i], bandLower: sma - 2 * atr[i] };
  });
}

function buildAnalysis(data) {
  const points = data.map((p, i) => ({ ...p, x: i, y: p.close }));
  const n = points.length;
  const sumX = points.reduce((s, p) => s + p.x, 0);
  const sumY = points.reduce((s, p) => s + p.y, 0);
  const meanX = sumX / n, meanY = sumY / n;
  const slope = points.reduce((s, p) => s + (p.x - meanX) * (p.y - meanY), 0) / (points.reduce((s, p) => s + (p.x - meanX)**2, 0) || 1);
  const intercept = meanY - slope * meanX;
  const residuals = points.map(p => p.y - (intercept + slope * p.x));
  const sd = Math.sqrt(residuals.reduce((s, r) => s + r**2, 0) / (n - 2 || 1));
  const bands = calculateBandChannel(points);

  return points.map((p, i) => {
    const mid = intercept + slope * p.x;
    return {
      ...p,
      plus2: mid + sd * 2, plus1: mid + sd, mid, minus1: mid - sd, minus2: mid - sd * 2,
      r2: 0.85,
      bandMid: bands[i].bandMid, bandUpper: bands[i].bandUpper, bandLower: bands[i].bandLower
    };
  });
}

function renderChart(analysis) {
  if (!chart) return;
  const last = analysis[analysis.length - 1];
  const minP = Math.min(...analysis.map(p => p.minus2)) * 0.95;
  const maxP = Math.max(...analysis.map(p => p.plus2)) * 1.05;
  const width = 1000, height = 500;
  const x = i => 50 + (i / (analysis.length - 1)) * 900;
  const y = val => height - 40 - ((val - minP) / (maxP - minP)) * 420;

  const lineStr = levelDefs.map(l => `<polyline points="${analysis.map((p, i) => `${x(i)},${y(p[l.key])}`).join(" ")}" fill="none" stroke="${l.color}" stroke-width="1.5" />`).join("");
  const closeStr = analysis.map((p, i) => `${x(i)},${y(p.close)}`).join(" ");

  chart.innerHTML = `<svg viewBox="0 0 ${width} ${height}" style="width:100%; height:100%; background:#fff; border-radius:8px;">
    ${lineStr}
    <polyline points="${closeStr}" fill="none" stroke="#0f172a" stroke-width="2.5" />
    <circle cx="${x(analysis.length - 1)}" cy="${y(last.close)}" r="5" fill="#c94b4b" />
  </svg>`;
}

function render() {
  if (!csvInput || !csvInput.value) return;
  const data = JSON.parse(csvInput.value);
  const analysis = buildAnalysis(data);
  const last = analysis[analysis.length - 1];
  const prev = analysis.length >= 2 ? analysis[analysis.length - 2] : last;

  const diff = last.close - prev.close;
  const pct = prev.close !== 0 ? (diff / prev.close) * 100 : 0;
  const color = diff >= 0 ? "#c94b4b" : "#12614a";

  if (closeText) {
    closeText.innerHTML = `${formatPrice(last.close)} <span style="font-size:0.8rem; color:${color};">(${diff >= 0 ? "+" : ""}${diff.toFixed(2)} / ${diff >= 0 ? "+" : ""}${pct.toFixed(2)}%)</span>`;
  }
  if (zoneText) zoneText.textContent = priceZone(last);
  if (r2Text) r2Text.textContent = last.r2.toFixed(2);
  if (rangeText) rangeText.textContent = getPriceRangeDesc(last);

  const fun = getFundamentals(symbolInput.value, last.close);
  if (peText) peText.textContent = `${(last.close / fun.eps).toFixed(1)} 倍`;
  if (yieldText) yieldText.textContent = `${((fun.dividend / last.close) * 100).toFixed(2)} %`;

  renderChart(analysis);
}

async function fetchLevelForWatchlist(symbol) {
  const clean = symbol.trim().toUpperCase().replace(/\.(TW|TWO)$/, "");
  const res = await fetch(`/api/yahoo?symbol=${clean}&market=tw&years=3.5`);
  if (!res.ok) throw new Error("失敗");
  const json = await res.json();
  const analysis = buildAnalysis(json.rows);
  return { sym: json.symbol, last: analysis[analysis.length - 1], prev: analysis[analysis.length - 2], name: json.name };
}

async function fetchInBatches(syms) {
  const results = [];
  for (let s of syms) {
    try {
      results.push({ status: "fulfilled", value: await fetchLevelForWatchlist(s) });
    } catch (e) {
      results.push({ status: "rejected" });
    }
  }
  return results;
}

function updateWatchlistDisplay() {
  if (!watchlistResult) return;
  watchlistResult.innerHTML = scannedWatchlistCache.map(item => {
    const diff = item.last.close - (item.prev ? item.prev.close : item.last.close);
    const pct = item.prev && item.prev.close ? (diff / item.prev.close) * 100 : 0;
    const color = diff >= 0 ? "#c94b4b" : "#12614a";
    return `<div class="watchlist-item" style="cursor:pointer;" onclick="loadStock('${item.sym}')">
      <div><strong>${item.sym} ${item.name}</strong><br>現價: ${formatPrice(item.last.close)} <span style="color:${color}; font-size:0.75rem;">(${diff >= 0 ? "+" : ""}${diff.toFixed(2)} / ${pct.toFixed(2)}%)</span></div>
      <div style="text-align:right;"><span style="font-weight:bold; color:${color};">${priceZone(item.last)}</span></div>
    </div>`;
  }).join("");
}

function loadStock(sym) {
  if (symbolInput) symbolInput.value = sym.replace(/\..*/, "");
  if (fetchSymbolBtn) fetchSymbolBtn.click();
}

function bindEvents() {
  if (fetchSymbolBtn) {
    fetchSymbolBtn.addEventListener("click", async () => {
      fetchStatus.textContent = "讀取中...";
      try {
        const res = await fetch(`/api/yahoo?symbol=${symbolInput.value}&market=${market.value}&years=${periodYears.value}`);
        const json = await res.json();
        csvInput.value = JSON.stringify(json.rows);
        if (chartTitle) chartTitle.textContent = formatSymbolDisplay(json.symbol, json.name);
        if (btnAddToWatchlist) btnAddToWatchlist.style.display = "inline-block";
        render();
        fetchStatus.textContent = "成功";
      } catch (e) {
        fetchStatus.textContent = "失敗";
      }
    });
  }

  if (btnWatchlist) {
    btnWatchlist.addEventListener("click", async () => {
      const syms = watchlistInput.value.split(",").map(s => s.trim().toUpperCase()).filter(Boolean);
      watchlistStatus.textContent = "批量更新中...";
      const res = await fetchInBatches(syms);
      scannedWatchlistCache = res.filter(r => r.status === "fulfilled").map(r => r.value);
      updateWatchlistDisplay();
      saveWatchlistCache();
      watchlistStatus.textContent = "更新完成！";
    });
  }
}