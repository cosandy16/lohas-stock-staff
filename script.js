// ==========================================
// 樂活通道 / 均線通道 / 五線譜 / 股票觀察清單 腳本 (script.js)
// ==========================================

const MAX_WATCHLIST_LIMIT = 40;

let currentMainChipData = null;
let currentMarketFundamentals = { pe: null, dividendYield: null };
let TW_STOCK_NAMES = {};

async function fetchStockNames() {
  try {
    const res = await fetch("/api/names");
    if (res.ok) TW_STOCK_NAMES = await res.json();
  } catch (e) {
    console.error("無法同步最新股票清單", e);
  }
}

const STOCK_FUNDAMENTALS = {
  "1101": { eps: 2.2, dividend: 1.5 }, "2330": { eps: 38.2, dividend: 16.0 }, "2412": { eps: 4.8, dividend: 4.7 }
};

let csvInput, market, symbolInput, fetchSymbolBtn, fetchStatus, periodYears, modelMode;
let showChannelCheckbox, toggleBand;
let chart, chartTitle, btnAddToWatchlist, rangeText, zoneText, closeText, r2Text, levelsTable;
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
  return true;
}

function updateAdvicePanel(zoneName, r2Value, chipData) {
  const container = document.getElementById("adviceContainer");
  const titleEl = document.getElementById("adviceTitle");
  const descEl = document.getElementById("adviceDesc");
  if (!container || !titleEl || !descEl) return;

  const r2 = parseFloat(r2Value) || 0;
  const totalChip = typeof chipData === "object" && chipData ? (chipData.total || 0) : 0;

  if (r2 < 0.4) {
    container.className = "advice-card advice-warning";
    titleEl.innerHTML = "⚠️ 觀望警訊：五線譜擬合度不足 (R² < 0.4)";
    descEl.textContent = `當前 R² 僅 ${r2.toFixed(3)}，走勢較不規則。`;
    return;
  }
  container.className = "advice-card advice-neutral";
  titleEl.innerHTML = `⚖️ 當前位階：${zoneName}`;
  descEl.textContent = `三大法人合計買賣超: ${totalChip} 張`;
}

function getFundamentals(symbol, currentPrice) {
  const code = (symbol || "").replace(/\.(TW|TWO)$/i, "").toUpperCase();
  if (STOCK_FUNDAMENTALS[code]) return STOCK_FUNDAMENTALS[code];
  const safePrice = currentPrice || 100;
  return { eps: +(safePrice / 16).toFixed(2), dividend: +(safePrice * 0.04).toFixed(2) };
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

function getNearestDistance(p) { return getNearestLevel(p).pct; }

function formatNearestText(nearest) {
  if (!nearest || !nearest.label) return "";
  return `距 ${nearest.label.replace(/^[\+\-]\dSD\s*/, "")} 還 ${nearest.diff >= 0 ? "高" : "低"} ${Math.abs(nearest.diff).toFixed(2)} 元 (${Math.abs(nearest.pct).toFixed(2)}%)`;
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

function getActionBadge(zoneStr, chipData, r2Value) {
  return { text: "🟡 觀望 / 定額", style: "background-color: #fef3c7; color: #d97706; border: 1px solid #fcd34d;" };
}

function getPriceRangeDesc(p) {
  if (!p) return "";
  const f = formatPrice;
  if (p.close >= p.plus2) return `> ${f(p.plus2)} (+2SD)`;
  if (p.close >= p.minus2) return `< ${f(p.minus2)} (-2SD)`;
  return `${f(p.minus2)} ~ ${f(p.plus2)}`;
}

function getZoneWeight(zoneStr) {
  return { "悲觀區下緣": 1, "相對悲觀區": 2, "中線以下": 3, "中線以上": 4, "相對樂觀區": 5, "樂觀區上緣": 6 }[zoneStr] || 0;
}

function formatPrice(v) { return Number(v || 0).toLocaleString("zh-TW", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

document.addEventListener("DOMContentLoaded", async () => {
  initDOMElements();
  await fetchStockNames();
  if (localStorage.getItem("lohas_watchlist") && watchlistInput) watchlistInput.value = localStorage.getItem("lohas_watchlist");
  if (localStorage.getItem("lohas_last_symbol") && symbolInput) symbolInput.value = localStorage.getItem("lohas_last_symbol");
  if (localStorage.getItem("lohas_last_market") && market) market.value = localStorage.getItem("lohas_last_market");
  updateRemoveSelect();
  bindEvents();
});

function updateRemoveSelect() {
  if (!removeWatchlistSelect || !watchlistInput) return;
  const syms = (watchlistInput.value || "").split(",").map(s => s.trim().toUpperCase()).filter(Boolean);
  removeWatchlistSelect.innerHTML = syms.length ? "" : '<option value="">📭 清單為空</option>';
  syms.forEach(sym => removeWatchlistSelect.add(new Option(sym, sym)));
}

function calculateATR(data, period = 14) {
  const tr = data.map((p, i) => Math.max(p.high - p.low, Math.abs(p.high - (i ? data[i-1].close : p.close)), Math.abs(p.low - (i ? data[i-1].close : p.close))));
  return tr.map((_, i, arr) => arr.slice(Math.max(0, i - period + 1), i + 1).reduce((a, b) => a + b, 0) / Math.min(i + 1, period));
}

function calculateBandChannel(data) {
  const atrs = calculateATR(data);
  return data.map((p, i) => {
    const sma = data.slice(Math.max(0, i - 19), i + 1).reduce((sum, item) => sum + item.close, 0) / Math.min(i + 1, 20);
    return { bandMid: sma, bandUpper: sma + 2 * atrs[i], bandLower: sma - 2 * atrs[i] };
  });
}

function regression(values) {
  const n = values.length, meanX = values.reduce((s, p) => s + p.x, 0) / n, meanY = values.reduce((s, p) => s + p.y, 0) / n;
  const slope = values.reduce((s, p) => s + (p.x - meanX) * (p.y - meanY), 0) / (values.reduce((s, p) => s + (p.x - meanX)**2, 0) || 1);
  const intercept = meanY - slope * meanX;
  const residuals = values.map(p => p.y - (intercept + slope * p.x));
  const sd = Math.sqrt(residuals.reduce((s, r) => s + r**2, 0) / (n - 2 || 1));
  const ssTot = values.reduce((s, p) => s + (p.y - meanY)**2, 0);
  const r2 = ssTot === 0 ? 1 : Math.max(0, 1 - residuals.reduce((s, r) => s + r**2, 0) / ssTot);
  return { intercept, slope, sd, r2 };
}

function buildAnalysis(data) {
  const filtered = data.filter(p => new Date(p.date) >= new Date(new Date(data[data.length - 1].date).getTime() - (periodYears.value === "all" ? 10 : Number(periodYears.value)) * 365 * 86400000));
  const startTime = new Date(filtered[0].date).getTime();
  const useLog = modelMode && modelMode.value === "log";
  const points = filtered.map(p => ({ ...p, x: (new Date(p.date).getTime() - startTime) / 86400000, y: useLog ? Math.log(p.close) : p.close }));
  const fit = regression(points), bands = calculateBandChannel(points);
  return points.map((p, idx) => {
    const midRaw = fit.intercept + fit.slope * p.x, conv = v => useLog ? Math.exp(v) : v;
    return { ...p, plus2: conv(midRaw + fit.sd * 2), plus1: conv(midRaw + fit.sd), mid: conv(midRaw), minus1: conv(midRaw - fit.sd), minus2: conv(midRaw - fit.sd * 2), r2: fit.r2, ...bands[idx] };
  });
}

function renderChart(analysis) {
  if (!chart) return;
  const width = 1000, height = 500, margin = { top: 35, right: 60, bottom: 45, left: 65 };
  const minP = Math.min(...analysis.map(p => Math.min(p.close, p.minus2, p.bandLower || p.close))) * 0.97;
  const maxP = Math.max(...analysis.map(p => Math.max(p.close, p.plus2, p.bandUpper || p.close))) * 1.03;
  const x = i => margin.left + (i / (analysis.length - 1)) * (width - margin.left - margin.right);
  const y = val => height - margin.bottom - ((val - minP) / (maxP - minP)) * (height - margin.top - margin.bottom);

  const fiveLines = levelDefs.map(l => `<polyline points="${analysis.map((p, i) => `${x(i)},${y(p[l.key])}`).join(" ")}" fill="none" stroke="${l.color}" stroke-width="${l.key === 'mid' ? 2.5 : 1.2}" opacity="0.75" />`).join("");
  const bandHtml = isBandChannelActive() ? `<polyline points="${analysis.map((p, i) => `${x(i)},${y(p.bandUpper)}`).join(" ")}" fill="none" stroke="#e11d48" stroke-width="1.8" stroke-dasharray="4 2" /><polyline points="${analysis.map((p, i) => `${x(i)},${y(p.bandMid)}`).join(" ")}" fill="none" stroke="#d97706" stroke-width="2" stroke-dasharray="6 3" /><polyline points="${analysis.map((p, i) => `${x(i)},${y(p.bandLower)}`).join(" ")}" fill="none" stroke="#059669" stroke-width="1.8" stroke-dasharray="4 2" />` : "";

  chart.innerHTML = `<svg id="svgChart" viewBox="0 0 ${width} ${height}" style="background:#fff; border-radius:12px; width:100%; height:100%;">${fiveLines}${bandHtml}<polyline points="${analysis.map((p, i) => `${x(i)},${y(p.close)}`).join(" ")}" fill="none" stroke="#0f172a" stroke-width="2.5" /></svg>`;
}

function render() {
  try {
    if (!csvInput || !csvInput.value) return;
    const analysis = buildAnalysis(JSON.parse(csvInput.value)), last = analysis[analysis.length - 1];
    
    if (zoneText) {
      zoneText.textContent = priceZone(last);
      document.querySelector("#nearestText").textContent = formatNearestText(getNearestLevel(last));
    }
    if (closeText) closeText.textContent = formatPrice(last.raw_close || last.close);
    if (r2Text) r2Text.textContent = last.r2.toFixed(3);
    if (rangeText) rangeText.textContent = getPriceRangeDesc(last);

    // 💡 動態顯示本益比與殖利率（優先採用 Yahoo 即時抓取數值，若無則自動反推）
    const symbolCode = symbolInput ? symbolInput.value.trim().toUpperCase() : "";
    if (peText) {
      peText.textContent = currentMarketFundamentals.pe ? `${currentMarketFundamentals.pe.toFixed(1)} 倍` : `${(last.close / getFundamentals(symbolCode, last.close).eps).toFixed(1)} 倍`;
    }
    if (yieldText) {
      yieldText.textContent = currentMarketFundamentals.dividendYield ? `${(currentMarketFundamentals.dividendYield * 100).toFixed(2)} %` : `${((getFundamentals(symbolCode, last.close).dividend / last.close) * 100).toFixed(2)} %`;
    }

    renderChart(analysis);
  } catch (e) { console.error(e); }
}

async function loadMainChipData(symbol) {
  const chipEl = document.querySelector("#chipText");
  if (!chipEl) return;
  try {
    const res = await fetch(`/api/chip?symbol=${encodeURIComponent(symbol)}`);
    const chip = await res.json();
    currentMainChipData = chip;
    chipEl.innerHTML = chip.error ? `<span>尚無盤後籌碼</span>` : `(${chip.date}) : 外資 ${chip.foreign} 張 | 投信 ${chip.trust} 張 | 合計 ${chip.total} 張`;
    render();
  } catch (e) { chipEl.innerHTML = `<span>籌碼讀取失敗</span>`; }
}

async function fetchLevelForWatchlist(symbol) {
  const cleanCode = symbol.replace(/\.(TW|TWO)$/i, "").toUpperCase();
  const res = await fetch(`/api/yahoo?symbol=${cleanCode}&market=${symbol.includes("TWO") ? "two" : "tw"}&years=3.5`);
  const json = await res.json();
  const analysis = buildAnalysis(json.rows);
  return { sym: json.symbol, last: analysis[analysis.length - 1], name: json.name, pe: json.pe, dividendYield: json.dividendYield };
}

async function fetchInBatches(symbols) {
  const results = [];
  for (let i = 0; i < symbols.length; i += 5) {
    const batch = symbols.slice(i, i + 5);
    results.push(...(await Promise.allSettled(batch.map(sym => fetchLevelForWatchlist(sym)))));
  }
  return results;
}

function updateWatchlistDisplay() {
  if (!watchlistResult) return;
  watchlistResult.innerHTML = scannedWatchlistCache.length ? "" : `<div style="text-align:center; padding:12px;">無清單資料</div>`;
  const fragment = document.createDocumentFragment();
  
  scannedWatchlistCache.forEach(item => {
    if (item.status !== "fulfilled") return;
    const d = item.value;
    const card = document.createElement("div");
    card.className = "watchlist-item";
    card.style.cursor = "pointer";
    
    // 💡 監控清單動態本益比與殖利率顯示
    const peDisp = d.pe ? `${d.pe.toFixed(1)}x` : `${(d.last.close / getFundamentals(d.sym, d.last.close).eps).toFixed(1)}x`;
    const yieldDisp = d.dividendYield ? `${(d.dividendYield * 100).toFixed(1)}%` : `${((getFundamentals(d.sym, d.last.close).dividend / d.last.close) * 100).toFixed(1)}%`;

    card.innerHTML = `<div><strong>${d.sym}</strong> ${d.name}<br><small>現價: ${formatPrice(d.last.close)} | PE: ${peDisp} | 殖利率: ${yieldDisp}</small></div><div style="text-align:right;"><strong>${priceZone(d.last)}</strong></div>`;
    card.onclick = () => { symbolInput.value = d.sym.replace(/\.(TW|TWO)$/, ""); fetchSymbolBtn.click(); };
    fragment.appendChild(card);
  });
  watchlistResult.appendChild(fragment);
}

function bindEvents() {
  if (toggleBand) toggleBand.onchange = render;
  if (showChannelCheckbox) showChannelCheckbox.onchange = render;
  if (periodYears) periodYears.onchange = render;
  if (modelMode) modelMode.onchange = render;

  if (fetchSymbolBtn) {
    fetchSymbolBtn.onclick = async () => {
      fetchStatus.textContent = "讀取中...";
      try {
        const res = await fetch(`/api/yahoo?symbol=${symbolInput.value}&market=${market.value}&years=${periodYears.value}`);
        const json = await res.json();
        csvInput.value = JSON.stringify(json.rows);
        
        // 💡 抓取即時基本面數據
        currentMarketFundamentals = { pe: json.pe || null, dividendYield: json.dividendYield || null };

        chartTitle.textContent = formatSymbolDisplay(json.symbol, json.name);
        btnAddToWatchlist.style.display = "inline-block";
        loadMainChipData(symbolInput.value);
        fetchStatus.textContent = "成功";
        localStorage.setItem("lohas_last_symbol", symbolInput.value);
        localStorage.setItem("lohas_last_market", market.value);
      } catch (e) { fetchStatus.textContent = "失敗"; }
    };
  }

  if (btnWatchlist) {
    btnWatchlist.onclick = async () => {
      const syms = (watchlistInput.value || "").split(",").map(s => s.trim().toUpperCase()).filter(Boolean);
      watchlistStatus.textContent = `🔄 正在更新 ${syms.length} 檔股票...`;
      scannedWatchlistCache = await fetchInBatches(syms);
      updateWatchlistDisplay();
      watchlistStatus.textContent = "✅ 更新完成";
    };
  }
}