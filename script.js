const csvInput = document.querySelector("#csvInput");
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
  { key: "plus2", label: "+2SD 樂觀線", color: "#c94b4b" },
  { key: "plus1", label: "+1SD 相對樂觀線", color: "#d9852b" },
  { key: "mid", label: "中線", color: "#2c6ebd" },
  { key: "minus1", label: "-1SD 相對悲觀線", color: "#1f8a63" },
  { key: "minus2", label: "-2SD 悲觀線", color: "#12614a" },
];

// --- 💡 網頁載入時，自動讀取上次儲存的 10 檔股票 ---
document.addEventListener("DOMContentLoaded", () => {
  const savedWatchlist = localStorage.getItem("lohas_watchlist");
  if (savedWatchlist) {
    watchlistInput.value = savedWatchlist;
  }
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

function formatPrice(v) { return Number(v).toLocaleString("zh-TW", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

// --- 繪圖 ---
function renderChart(analysis) {
  const width = 1000, height = 500;
  const margin = { top: 30, right: 60, bottom: 40, left: 60 };
  const last = analysis[analysis.length - 1];
  const minP = Math.min(...analysis.map(p => Math.min(p.close, p.minus2))) * 0.98;
  const maxP = Math.max(...analysis.map(p => Math.max(p.close, p.plus2))) * 1.02;
  const x = (i) => margin.left + (i / (analysis.length - 1)) * (width - margin.left - margin.right);
  const y = (val) => height - margin.bottom - ((val - minP) / (maxP - minP)) * (height - margin.top - margin.bottom);

  chart.innerHTML = `
    <svg viewBox="0 0 ${width} ${height}" style="background:#fff; border-radius:8px;">
      ${levelDefs.map(l => `<path d="${analysis.map((p, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(p[l.key])}`).join(" ")}" fill="none" stroke="${l.color}" stroke-width="${l.key === 'mid' ? 2.5 : 1}" opacity="0.6" />`).join("")}
      <path d="${analysis.map((p, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(p.close)}`).join(" ")}" fill="none" stroke="#17202f" stroke-width="2" />
      ${(last.close >= last.plus2 || last.close <= last.minus2) ? `<circle cx="${x(analysis.length - 1)}" cy="${y(last.close)}" r="10" fill="${last.close >= last.plus2 ? '#c94b4b' : '#12614a'}" opacity="0.4"><animate attributeName="r" from="6" to="18" dur="1s" repeatCount="indefinite"/><animate attributeName="opacity" from="0.6" to="0" dur="1s" repeatCount="indefinite"/></circle>` : ""}
      <circle cx="${x(analysis.length - 1)}" cy="${y(last.close)}" r="5" fill="#17202f" />
    </svg>
  `;
}

function render() {
  try {
    const data = JSON.parse(csvInput.value);
    const analysis = buildAnalysis(data);
    const last = analysis[analysis.length - 1];
    chartTitle.textContent = symbolName.value;
    zoneText.textContent = priceZone(last);
    zoneText.style.color = (last.close >= last.plus2) ? "#c94b4b" : (last.close <= last.minus2 ? "#12614a" : "var(--ink)");
    closeText.textContent = formatPrice(last.close);
    r2Text.textContent = last.r2.toFixed(3);
    renderChart(analysis);
    levelsTable.innerHTML = levelDefs.map(l => `<tr><td>${l.label}</td><td>${formatPrice(last[l.key])}</td><td>${priceZone(last) === l.label ? "●" : ""}</td></tr>`).join("");
  } catch (e) {}
}

// --- 監控清單 ---
async function fetchLevelForWatchlist(symbol) {
  let finalSym = symbol.trim().toUpperCase();
  if (!finalSym.includes(".") && /^\d+$/.test(finalSym)) finalSym += ".TW";
  const p = new URLSearchParams({ symbol: finalSym.replace(".TW","").replace(".TWO",""), market: finalSym.includes(".TWO") ? "two" : (finalSym.includes(".TW") ? "tw" : "us"), years: "3.5" });
  const res = await fetch(`/api/yahoo?${p.toString()}`);
  if (!res.ok) throw new Error();
  const json = await res.json();
  const analysis = buildAnalysis(json.rows, "linear", "3.5");
  return { sym: json.symbol, last: analysis[analysis.length - 1] };
}

btnWatchlist.addEventListener("click", async () => {
  const rawInput = watchlistInput.value;
  
  // 💡 點擊按鈕時，自動將輸入框內的代碼儲存在瀏覽器中
  localStorage.setItem("lohas_watchlist", rawInput);

  const syms = rawInput.split(",").map(s => s.trim()).filter(s => s).slice(0, 10);
  watchlistResult.innerHTML = "";
  watchlistStatus.textContent = "🔍 正在掃描區間...";
  btnWatchlist.disabled = true;

  for (const s of syms) {
    try {
      const { sym, last } = await fetchLevelForWatchlist(s);
      
      // 💡 核心修改：精確定義只有最頂跟最底兩個狀態觸發特殊色
      const isSellSignal = last.close >= last.plus2; // 只有高於等於 +2SD (樂觀區上緣)
      const isBuySignal = last.close <= last.minus2; // 只有低於等於 -2SD (悲觀區下緣)

      const item = document.createElement("div");
      item.className = "watchlist-item";

      if (isBuySignal) {
        // 🟢 悲觀區下緣：塗上淡綠色背景、深綠色左邊框
        item.style.backgroundColor = "#e8f5e9";
        item.style.border = "1px solid #a5d6a7";
        item.style.borderLeft = "6px solid #12614a";
      } else if (isSellSignal) {
        // 🔴 樂觀區上緣：塗上淡紅色背景、深紅色左邊框
        item.style.backgroundColor = "#ffebee";
        item.style.border = "1px solid #ffcdd2";
        item.style.borderLeft = "6px solid #c94b4b";
      } else {
        // ⚪ 其它一般區間：維持原本設計（白底、藍色邊框）
        item.style.borderLeft = "6px solid #2c6ebd";
      }

      // 動態調整狀態文字顏色與小字字體顏色
      const zoneColor = isSellSignal ? '#c94b4b' : (isBuySignal ? '#12614a' : '#2c6ebd');
      const smallTextColor = (isBuySignal || isSellSignal) ? '#333333' : '#666666';

      item.innerHTML = `
        <div>
          <strong>${sym}</strong><br>
          <small style="color:${smallTextColor}">現價: ${formatPrice(last.close)}</small>
        </div>
        <div style="text-align:right;">
          <span style="font-weight:900; color:${zoneColor}">${priceZone(last)}</span>
          <br>
          <small style="color:${smallTextColor}">區間: ${getPriceRangeDesc(last)}</small>
        </div>
      `;
      watchlistResult.appendChild(item);
    } catch {
      watchlistResult.innerHTML += `<div style="color:red; font-size:0.8rem; padding:8px;">❌ ${s} 失敗</div>`;
    }
    await new Promise(r => setTimeout(r, 500));
  }
  watchlistStatus.textContent = "✅ 掃描完成";
  btnWatchlist.disabled = false;
});

fetchSymbolBtn.addEventListener("click", async () => {
  fetchStatus.textContent = "讀取中...";
  try {
    const p = new URLSearchParams({ symbol: symbolInput.value, market: market.value, years: periodYears.value });
    const res = await fetch(`/api/yahoo?${p.toString()}`);
    const json = await res.json();
    csvInput.value = JSON.stringify(json.rows);
    symbolName.value = json.symbol;
    render();
    fetchStatus.textContent = "成功";
  } catch { fetchStatus.textContent = "失敗"; }
});

document.querySelector("#sampleBtn").addEventListener("click", () => {
  const mock = []; let p = 100;
  for(let i=0; i<300; i++) mock.push({ date: new Date(Date.now() - (300-i)*86400000).toISOString(), close: p += (Math.random()-0.48) });
  csvInput.value = JSON.stringify(mock);
  render();
});