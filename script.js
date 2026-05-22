const csvInput = document.querySelector("#csvInput");
const fileInput = document.querySelector("#fileInput");
const symbolName = document.querySelector("#symbolName");
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

// 監控清單 DOM
const watchlistInput = document.querySelector("#watchlistInput");
const btnWatchlist = document.querySelector("#btnWatchlist");
const watchlistResult = document.querySelector("#watchlistResult");
const watchlistStatus = document.querySelector("#watchlistStatus");

const levelDefs = [
  { key: "plus2", label: "+2SD 樂觀線", color: "#c94b4b", note: "偏高，留意回檔風險" },
  { key: "plus1", label: "+1SD 相對樂觀線", color: "#d9852b", note: "偏熱，適合保守評估" },
  { key: "mid", label: "中線", color: "#2c6ebd", note: "長期趨勢估計值" },
  { key: "minus1", label: "-1SD 相對悲觀線", color: "#1f8a63", note: "偏低，常作分批觀察區" },
  { key: "minus2", label: "-2SD 悲觀線", color: "#12614a", note: "明顯偏低，需確認風險" },
];

// --- 核心邏輯 ---

function makeSampleCsv() {
  const rows = ["Date,Close"];
  const start = new Date("2022-11-01T00:00:00");
  let price = 88;
  for (let i = 0; i < 900; i += 1) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    if (date.getDay() === 0 || date.getDay() === 6) continue;
    price *= 1 + 0.00042 + (Math.sin(i / 34) * 0.009) + (Math.random() * 0.01 - 0.005);
    rows.push(`${date.toISOString().slice(0, 10)},${price.toFixed(2)}`);
  }
  return rows.join("\n");
}

function parseCsv(text) {
  const rows = text.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  const parsed = [];
  for (const row of rows) {
    const cells = row.split(/,|\t/).map(cell => cell.trim());
    const date = new Date(cells[0]);
    const close = Number(cells[1]);
    if (Number.isFinite(close) && !Number.isNaN(date.getTime())) parsed.push({ date, close });
  }
  return parsed.sort((a, b) => a.date - b.date);
}

function filterByPeriod(data, yearsVal) {
  if (yearsVal === "all") return data;
  const years = Number(yearsVal);
  const lastDate = data[data.length - 1].date;
  const cutoff = new Date(lastDate);
  cutoff.setDate(cutoff.getDate() - Math.round(years * 365));
  return data.filter(p => p.date >= cutoff);
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
  const filtered = filterByPeriod(data, currentYears);
  if (filtered.length < 10) throw new Error("資料量不足");
  
  const startTime = filtered[0].date.getTime();
  const dayMs = 86400000;
  const useLog = currentMode === "log";
  const points = filtered.map(p => ({
    ...p,
    x: (p.date.getTime() - startTime) / dayMs,
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
      minus2: conv(conv(midRaw - fit.sd * 2)),
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

function formatPrice(v) { return Number(v).toLocaleString("zh-TW", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function formatDate(d) { return d.toISOString().slice(0, 10); }

// --- 繪圖邏輯 ---

function renderChart(analysis) {
  const width = 1180, height = 600;
  const margin = { top: 40, right: 80, bottom: 60, left: 80 };
  const last = analysis[analysis.length - 1];
  const minP = Math.min(...analysis.map(p => Math.min(p.close, p.minus2))) * 0.95;
  const maxP = Math.max(...analysis.map(p => Math.max(p.close, p.plus2))) * 1.05;

  const xAt = (i) => margin.left + (i / (analysis.length - 1)) * (width - margin.left - margin.right);
  const yAt = (val) => height - margin.bottom - ((val - minP) / (maxP - minP)) * (height - margin.top - margin.bottom);

  const isUp = last.close >= last.plus2;
  const isDown = last.close <= last.minus2;

  const getPath = (key) => analysis.map((p, i) => `${i === 0 ? "M" : "L"} ${xAt(i)} ${yAt(p[key])}`).join(" ");

  chart.innerHTML = `
    <svg viewBox="0 0 ${width} ${height}" style="width:100%; height:auto;">
      <rect width="${width}" height="${height}" fill="white" />
      ${levelDefs.map(l => `<path d="${getPath(l.key)}" fill="none" stroke="${l.color}" stroke-width="${l.key === 'mid' ? 3 : 1.5}" />`).join("")}
      <path d="${getPath('close')}" fill="none" stroke="#17202f" stroke-width="2.5" />
      
      ${isUp ? `<circle cx="${xAt(analysis.length - 1)}" cy="${yAt(last.close)}" r="8" fill="#c94b4b" opacity="0.5"><animate attributeName="r" from="8" to="22" dur="1.2s" repeatCount="indefinite" /><animate attributeName="opacity" from="0.5" to="0" dur="1.2s" repeatCount="indefinite" /></circle>` : ""}
      ${isDown ? `<circle cx="${xAt(analysis.length - 1)}" cy="${yAt(last.close)}" r="8" fill="#12614a" opacity="0.5"><animate attributeName="r" from="8" to="22" dur="1.2s" repeatCount="indefinite" /><animate attributeName="opacity" from="0.5" to="0" dur="1.2s" repeatCount="indefinite" /></circle>` : ""}

      <circle cx="${xAt(analysis.length - 1)}" cy="${yAt(last.close)}" r="6" fill="${isUp ? "#c94b4b" : (isDown ? "#12614a" : "#17202f")}" />
      <text x="${xAt(analysis.length - 1) + 10}" y="${yAt(last.close) + 5}" font-weight="900" fill="${isUp ? "#c94b4b" : (isDown ? "#12614a" : "#17202f")}">${formatPrice(last.close)}</text>
    </svg>
  `;
}

function render() {
  try {
    const data = parseCsv(csvInput.value);
    const analysis = buildAnalysis(data);
    const last = analysis[analysis.length - 1];
    const zone = priceZone(last);

    chartTitle.textContent = symbolName.value || "未命名標的";
    rangeText.textContent = `${formatDate(analysis[0].date)} ~ ${formatDate(last.date)}`;
    zoneText.textContent = zone;
    closeText.textContent = formatPrice(last.close);
    r2Text.textContent = last.r2.toFixed(3);

    // 文字亮燈
    zoneText.style.color = (zone === "樂觀區上緣") ? "#c94b4b" : (zone === "悲觀區下緣" ? "#12614a" : "var(--ink)");
    
    renderChart(analysis);
    levelsTable.innerHTML = levelDefs.map(l => `<tr><td><span style="color:${l.color}">●</span> ${l.label}</td><td>${formatPrice(last[l.key])}</td><td>${l.note}</td></tr>`).join("");
  } catch (e) {
    chart.innerHTML = `<div style="padding:40px; color:red;">${e.message}</div>`;
  }
}

// --- 批次監控邏輯 ---

async function getStockLevel(sym) {
  const p = new URLSearchParams({ symbol: sym.trim(), market: "tw", years: "3.5" });
  const res = await fetch(`/api/yahoo?${p.toString()}`);
  const json = await res.json();
  if (!res.ok) throw new Error();
  const analysis = buildAnalysis(json.rows, "linear", "3.5");
  return { sym, last: analysis[analysis.length - 1] };
}

btnWatchlist.addEventListener("click", async () => {
  const syms = watchlistInput.value.split(",").map(s => s.trim()).filter(s => s !== "").slice(0, 10);
  watchlistResult.innerHTML = "";
  watchlistStatus.textContent = "掃描中...";
  btnWatchlist.disabled = true;

  for (const s of syms) {
    try {
      const { sym, last } = await getStockLevel(s);
      const isUp = last.close >= last.plus2, isDown = last.close <= last.minus2;
      const card = document.createElement("div");
      card.className = "watchlist-item";
      if(isUp) card.style.background = "#fff1f1";
      if(isDown) card.style.background = "#f0fdf4";
      
      card.innerHTML = `
        <div><strong>${sym}</strong><br><small>現價: ${formatPrice(last.close)}</small></div>
        <div style="text-align:right; color:${isUp ? '#c94b4b' : (isDown ? '#12614a' : 'inherit')}; font-weight:800;">
          ${priceZone(last)}<br><small style="color:#666">位階: ${((last.close - last.mid) / (last.plus1 - last.mid)).toFixed(2)} SD</small>
        </div>
      `;
      watchlistResult.appendChild(card);
    } catch {
      watchlistResult.innerHTML += `<div style="color:red; font-size:0.8rem;">${s} 失敗</div>`;
    }
    await new Promise(r => setTimeout(r, 300));
  }
  watchlistStatus.textContent = "掃描完成";
  btnWatchlist.disabled = false;
});

// --- 事件綁定 ---

fetchSymbolBtn.addEventListener("click", async () => {
  fetchStatus.textContent = "抓取中...";
  try {
    const p = new URLSearchParams({ symbol: symbolInput.value, market: market.value, years: periodYears.value });
    const res = await fetch(`/api/yahoo?${p.toString()}`);
    const json = await res.json();
    csvInput.value = json.rows.map(r => `${r.date},${r.close}`).join("\n");
    symbolName.value = json.symbol;
    render();
    fetchStatus.textContent = "成功";
  } catch (e) {
    fetchStatus.textContent = "失敗";
  }
});

document.querySelector("#sampleBtn").addEventListener("click", () => { csvInput.value = makeSampleCsv(); render(); });
document.querySelector("#renderBtn").addEventListener("click", render);
[periodYears, modelMode].forEach(el => el.addEventListener("change", render));

// 初始執行
csvInput.value = makeSampleCsv();
render();