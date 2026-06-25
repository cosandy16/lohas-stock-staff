// --- 台股名稱與基本面資料庫 ---
const STOCK_FUNDAMENTALS = {
  "1477": { eps: 15.0, lowPe: 12 }, // 聚陽：極端低點約 12 倍
  "1476": { eps: 22.0, lowPe: 15 }, // 儒鴻：極端低點約 15 倍
  "2330": { eps: 38.2, lowPe: 14 }, // 台積電：極端低點約 14 倍
  "2317": { eps: 10.2, lowPe: 9  }, // 鴻海：極端低點約 9 倍
  "2412": { eps: 5.5,  lowPe: 20 }  // 中華電：極端低點約 20 倍
};

// --- DOM 元素連結 ---
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
const watchlistInput = document.querySelector("#watchlistInput");
const btnWatchlist = document.querySelector("#btnWatchlist");
const btnClearWatchlist = document.querySelector("#btnClearWatchlist");
const watchlistResult = document.querySelector("#watchlistResult");
const watchlistStatus = document.querySelector("#watchlistStatus");
const btnExportWatchlist = document.querySelector("#btnExportWatchlist");
const btnImportWatchlist = document.querySelector("#btnImportWatchlist");

const levelDefs = [
  { key: "plus2", label: "+2SD 樂觀線", color: "#c94b4b" },
  { key: "plus1", label: "+1SD 相對樂觀線", color: "#d9852b" },
  { key: "mid", label: "中線", color: "#2c6ebd" },
  { key: "minus1", label: "-1SD 相對悲觀線", color: "#1f8a63" },
  { key: "minus2", label: "-2SD 悲觀線", color: "#12614a" },
];

let deletedWatchlistBackup = "";

// --- 輔助函式 ---
function getFundamentals(symbol) {
  const code = symbol.replace(/\.(TW|TWO)$/i, "").toUpperCase();
  return STOCK_FUNDAMENTALS[code] || { eps: 0, lowPe: 0 };
}

function formatPrice(v) {
  return Number(v).toLocaleString("zh-TW", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

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

// --- 核心繪圖與分析 ---
function renderChart(analysis) {
  const width = 1000, height = 500;
  const margin = { top: 40, right: 120, bottom: 40, left: 60 };
  const last = analysis[analysis.length - 1];
  
  const minP = Math.min(...analysis.map(p => Math.min(p.close, p.minus2))) * 0.95;
  const maxP = Math.max(...analysis.map(p => Math.max(p.close, p.plus2))) * 1.05;
  
  const x = (i) => margin.left + (i / (analysis.length - 1)) * (width - margin.left - margin.right);
  const y = (val) => height - margin.bottom - ((val - minP) / (maxP - minP)) * (height - margin.top - margin.bottom);

  // PE 防禦線邏輯
  const sym = symbolInput.value.trim().toUpperCase();
  const fun = getFundamentals(sym);
  const pePrice = fun.eps * fun.lowPe;
  
  let peLineHtml = "";
  if (fun.eps > 0 && pePrice > minP && pePrice < maxP) {
    const py = y(pePrice);
    peLineHtml = `
      <line x1="${margin.left}" y1="${py}" x2="${width - margin.right}" y2="${py}" 
            stroke="#d32f2f" stroke-width="2" stroke-dasharray="8 4" />
      <text x="${width - margin.right + 5}" y="${py + 5}" fill="#d32f2f" font-size="14" font-weight="bold">
        PE ${fun.lowPe}x ($${pePrice.toFixed(0)})
      </text>
    `;
  }

  chart.innerHTML = `
    <svg viewBox="0 0 ${width} ${height}" style="background:#fff; width:100%; height:100%;">
      ${peLineHtml}
      ${levelDefs.map(l => `<path d="${analysis.map((p, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(p[l.key])}`).join(" ")}" fill="none" stroke="${l.color}" stroke-width="${l.key === 'mid' ? 2.5 : 1.5}" opacity="0.5" />`).join("")}
      <path d="${analysis.map((p, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(p.close)}`).join(" ")}" fill="none" stroke="#17202f" stroke-width="2.5" />
      <circle cx="${x(analysis.length - 1)}" cy="${y(last.close)}" r="6" fill="#17202f" />
    </svg>
  `;
}

function render() {
  try {
    const data = JSON.parse(csvInput.value);
    const analysis = buildAnalysis(data);
    const last = analysis[analysis.length - 1];
    closeText.textContent = formatPrice(last.close);
    r2Text.textContent = last.r2.toFixed(3);
    renderChart(analysis);
    levelsTable.innerHTML = levelDefs.map(l => `<tr><td>${l.label}</td><td>${formatPrice(last[l.key])}</td><td></td></tr>`).join("");
  } catch (e) { console.error(e); }
}

// --- 事件處理 ---
fetchSymbolBtn.addEventListener("click", async () => {
  fetchStatus.textContent = "讀取中...";
  const p = new URLSearchParams({ symbol: symbolInput.value, market: market.value, years: periodYears.value });
  try {
    const res = await fetch(`/api/yahoo?${p.toString()}`);
    const json = await res.json();
    csvInput.value = JSON.stringify(json.rows);
    chartTitle.textContent = json.symbol;
    render();
    fetchStatus.textContent = "成功";
  } catch { fetchStatus.textContent = "失敗"; }
});

btnWatchlist.addEventListener("click", async () => {
  const syms = watchlistInput.value.split(",").map(s => s.trim()).filter(s => s);
  watchlistResult.innerHTML = "";
  for (const s of syms) {
    try {
      const p = new URLSearchParams({ symbol: s.split(".")[0], market: "tw", years: "3.5" });
      const res = await fetch(`/api/yahoo?${p.toString()}`);
      const data = await res.json();
      const analysis = buildAnalysis(data.rows);
      const last = analysis[analysis.length - 1];
      const item = document.createElement("div");
      item.className = "watchlist-item";
      item.innerHTML = `<div><strong>${data.symbol}</strong><br><small>現價: ${formatPrice(last.close)}</small></div>`;
      watchlistResult.appendChild(item);
    } catch {}
  }
});