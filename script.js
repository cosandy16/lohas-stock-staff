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

// 監控清單相關 DOM
const watchlistInput = document.querySelector("#watchlistInput");
const btnWatchlist = document.querySelector("#btnWatchlist");
const btnClearWatchlist = document.querySelector("#btnClearWatchlist");
const watchlistResult = document.querySelector("#watchlistResult");
const watchlistStatus = document.querySelector("#watchlistStatus");

// 匯出與匯入按鈕 DOM
const btnExportWatchlist = document.querySelector("#btnExportWatchlist");
const btnImportWatchlist = document.querySelector("#btnImportWatchlist");

// 💡 隱存變數：用來暫存被清除的監控清單，提供一鍵後悔 (Undo/Restore) 功能
let deletedWatchlistBackup = "";

const levelDefs = [
  { key: "plus2", label: "+2SD 樂觀線", color: "#c94b4b" },
  { key: "plus1", label: "+1SD 相對樂觀線", color: "#d9852b" },
  { key: "mid", label: "中線", color: "#2c6ebd" },
  { key: "minus1", label: "-1SD 相對悲觀線", color: "#1f8a63" },
  { key: "minus2", label: "-2SD 悲觀線", color: "#12614a" },
];

// --- 💡 網頁載入初始化：自動讀取上次儲存的資料 ---
document.addEventListener("DOMContentLoaded", () => {
  // 1. 自動填入儲存的自訂監控清單
  const savedWatchlist = localStorage.getItem("lohas_watchlist");
  if (savedWatchlist) {
    watchlistInput.value = savedWatchlist;
  }

  // 2. 自動還原上一次詳細查詢的股票代號與市場選單
  const savedLastSymbol = localStorage.getItem("lohas_last_symbol");
  const savedLastMarket = localStorage.getItem("lohas_last_market");
  if (savedLastSymbol) symbolInput.value = savedLastSymbol;
  if (savedLastMarket) market.value = savedLastMarket;
});

// --- 統計學核心：線性/對數回歸運算 ---
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

// 建立五線譜數據結構
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

// 定義目前位階
function priceZone(p) {
  if (p.close >= p.plus2) return "樂觀區上緣";
  if (p.close >= p.plus1) return "相對樂觀區";
  if (p.close >= p.mid) return "中線以上";
  if (p.close >= p.minus1) return "中線以下";
  if (p.close >= p.minus2) return "相對悲觀區";
  return "悲觀區下緣";
}

// 產生詳細區間數值描述
function getPriceRangeDesc(p) {
  const f = formatPrice; 
  if (p.close >= p.plus2) return `> ${f(p.plus2)} (+2SD 樂觀線)`;
  if (p.close >= p.plus1) return `${f(p.plus1)} (相對樂觀) ~ ${f(p.plus2)} (樂觀)`;
  if (p.close >= p.mid) return `${f(p.mid)} (中線) ~ ${f(p.plus1)} (相對樂觀)`;
  if (p.close >= p.minus1) return `${f(p.minus1)} (相對悲觀) ~ ${f(p.mid)} (中線)`;
  if (p.close >= p.minus2) return `${f(p.minus2)} (悲觀) ~ ${f(p.minus1)} (相對悲觀)`;
  return `< ${f(p.minus2)} (-2SD 悲觀線)`;
}

// 格式化價格數值顯示
function formatPrice(v) { return Number(v).toLocaleString("zh-TW", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

// --- 繪製 SVG 線圖 ---
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

// 渲染大圖表及頂部資訊卡片
function render() {
  try {
    const data = JSON.parse(csvInput.value);
    const analysis = buildAnalysis(data);
    const last = analysis[analysis.length - 1];
    
    if (zoneText) {
      zoneText.textContent = priceZone(last);
      zoneText.style.color = (last.close >= last.plus2) ? "#c94b4b" : (last.close <= last.minus2 ? "#12614a" : "var(--ink)");
    }
    if (closeText) closeText.textContent = formatPrice(last.close);
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

// --- 監控清單非同步請求處理 ---
async function fetchLevelForWatchlist(symbol) {
  let finalSym = symbol.trim().toUpperCase();
  // 如果是純數字且沒帶後綴，依據輸入習慣預設補 .TW
  if (!finalSym.includes(".") && /^\d+$/.test(finalSym)) finalSym += ".TW";
  
  const isTwo = finalSym.includes(".TWO");
  const isTw = finalSym.includes(".TW");
  const marketParam = isTwo ? "two" : (isTw ? "tw" : "us");
  const pureSym = finalSym.replace(".TW","").replace(".TWO","");

  const p = new URLSearchParams({ symbol: pureSym, market: marketParam, years: "3.5" });
  const res = await fetch(`/api/yahoo?${p.toString()}`);
  if (!res.ok) throw new Error();
  const json = await res.json();
  const analysis = buildAnalysis(json.rows, "linear", "3.5");
  return { sym: json.symbol, last: analysis[analysis.length - 1] };
}

// 批量執行監控清單掃描
btnWatchlist.addEventListener("click", async () => {
  const rawInput = watchlistInput.value;
  localStorage.setItem("lohas_watchlist", rawInput);

  // 正式放寬至 15 檔上限
  const syms = rawInput.split(",").map(s => s.trim()).filter(s => s).slice(0, 15);
  const totalStocks = syms.length;

  watchlistResult.innerHTML = "";
  btnWatchlist.disabled = true;

  let currentIndex = 0;
  for (const s of syms) {
    currentIndex++;
    watchlistStatus.textContent = `🔍 正在掃描區間... (${currentIndex} / ${totalStocks})`;

    try {
      const { sym, last } = await fetchLevelForWatchlist(s);
      
      const isSellSignal = last.close >= last.plus2; 
      const isBuySignal = last.close <= last.minus2; 

      const item = document.createElement("div");
      item.className = "watchlist-item";

      // 只有悲觀區下緣及樂觀區上緣才會塗色
      if (isBuySignal) {
        item.style.backgroundColor = "#e8f5e9";
        item.style.border = "1px solid #a5d6a7";
        item.style.borderLeft = "6px solid #12614a";
      } else if (isSellSignal) {
        item.style.backgroundColor = "#ffebee";
        item.style.border = "1px solid #ffcdd2";
        item.style.borderLeft = "6px solid #c94b4b";
      } else {
        item.style.borderLeft = "6px solid #2c6ebd";
      }

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
    // 預防 Yahoo 限流限制，間隔發送
    await new Promise(r => setTimeout(r, 500));
  }
  watchlistStatus.textContent = `✅ 掃描完成 (共 ${totalStocks} 檔)`;
  btnWatchlist.disabled = false;
});

// 全部清除與後悔復原 (Clean & Restore) 智慧雙模按鈕
btnClearWatchlist.addEventListener("click", () => {
  if (btnClearWatchlist.textContent.includes("全部清除")) {
    // 執行清除邏輯：備份、清空 DOM 及 LocalStorage
    deletedWatchlistBackup = watchlistInput.value;
    watchlistInput.value = "";
    localStorage.removeItem("lohas_watchlist");
    watchlistResult.innerHTML = "";
    watchlistStatus.textContent = "🧹 已暫時清除，可點擊按鈕復原";
    
    // 切換為復原按鈕與橘色警告背景
    btnClearWatchlist.textContent = "↩️ 復原清除清單";
    btnClearWatchlist.style.backgroundColor = "#d9852b"; 
  } else {
    // 執行復原邏輯：還原備份資料
    if (deletedWatchlistBackup) {
      watchlistInput.value = deletedWatchlistBackup;
      localStorage.setItem("lohas_watchlist", deletedWatchlistBackup);
      watchlistStatus.textContent = "↩️ 已成功復原清單！";
    }
    // 還原回常規清除按鈕與質感灰色背景
    btnClearWatchlist.textContent = "🧹 全部清除";
    btnClearWatchlist.style.backgroundColor = "#667085";
  }
});

// 一鍵匯出清單功能 (自動寫入剪貼簿)
btnExportWatchlist.addEventListener("click", (e) => {
  e.preventDefault();
  const currentText = watchlistInput.value.trim();
  if (!currentText) {
    watchlistStatus.textContent = "⚠️ 目前清單是空的，無法匯出喔！";
    return;
  }
  navigator.clipboard.writeText(currentText).then(() => {
    watchlistStatus.textContent = "📋 清單已自動複製到剪貼簿！可貼至記事本備份。";
  }).catch(err => {
    watchlistStatus.textContent = "❌ 複製失敗，請手動複製輸入框文字。";
  });
});

// 一鍵匯入清單功能 (Prompt 彈窗)
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
  watchlistStatus.textContent = "📥 歷史清單匯入成功！點擊下方按鈕即可重新掃描。";
});

// --- 詳細單檔查詢按鈕功能 ---
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
    
    // 將大圖表標題賦值為後端智慧過濾整合回來的 "代碼+名稱" (例如 2330 台積電)
    if (chartTitle) {
      chartTitle.textContent = json.symbol;
    }
    
    render();
    fetchStatus.textContent = "成功";
    
    // 詳細單檔查詢也成功儲存，下次重新整理不用重新輸入
    localStorage.setItem("lohas_last_symbol", inputVal);
    localStorage.setItem("lohas_last_market", selectedMarket);
  } catch (err) {
    fetchStatus.textContent = "失敗"; 
    console.error("Fetch 錯誤資訊:", err);
  }
});

// 載入模擬範例數據
document.querySelector("#sampleBtn").addEventListener("click", () => {
  const mock = []; let p = 100;
  for(let i=0; i<300; i++) mock.push({ date: new Date(Date.now() - (300-i)*86400000).toISOString(), close: p += (Math.random()-0.48) });
  csvInput.value = JSON.stringify(mock);
  if (chartTitle) chartTitle.textContent = "模擬範例股票";
  render();
});