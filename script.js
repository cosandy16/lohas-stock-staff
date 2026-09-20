// ==========================================
// 1. 全域狀態與 DOM 元素 (對齊原版 CSS 與 HTML)
// ==========================================
let currentSymbol = "2330.TW";

// DOM 元素引用
const marketSelect = document.getElementById("market");
const symbolInput = document.getElementById("symbolInput");
const fetchBtn = document.getElementById("fetchSymbolBtn");
const periodSelect = document.getElementById("periodYears");
const modelSelect = document.getElementById("modelMode");
const chartTitle = document.getElementById("chartTitle");

// 指標與狀態顯示元素
const closeText = document.getElementById("closeText");
const zoneText = document.getElementById("zoneText");
const r2Text = document.getElementById("r2Text");
const chipText = document.getElementById("chipText");
const levelsTable = document.getElementById("levelsTable");

// 監控清單控制元素
const addWatchlistInput = document.getElementById("addWatchlistInput");
const btnAddWatchlistSingle = document.getElementById("btnAddWatchlistSingle");
const removeWatchlistSelect = document.getElementById("removeWatchlistSelect");
const btnRemoveWatchlistSingle = document.getElementById("btnRemoveWatchlistSingle");

// 批量更新與狀態元素
const btnWatchlist = document.getElementById("btnWatchlist"); // ⚡ 執行批量掃描更新
const watchlistStatus = document.getElementById("watchlistStatus");
const watchlistResult = document.getElementById("watchlistResult");
const btnClearWatchlist = document.getElementById("btnClearWatchlist");

// 預設觀察清單
let watchlist = JSON.parse(localStorage.getItem("watchlist")) || ["2330.TW", "2454.TW", "0050.TW", "2379.TW"];

// ==========================================
// 2. 工具函式
// ==========================================

function cleanSymbol(symbol) {
  if (!symbol) return "";
  let s = symbol.trim().toUpperCase();
  if (/^\d+$/.test(s)) {
    return `${s}.TW`;
  }
  return s;
}

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchStockData(symbol, periodYears) {
  const cleaned = cleanSymbol(symbol);
  if (!cleaned) throw new Error("無效的股票代碼");

  const market = marketSelect ? marketSelect.value : "tw";
  const response = await fetch(`/api/yahoo?symbol=${encodeURIComponent(cleaned)}&years=${periodYears}&market=${market}`);
  
  if (!response.ok) {
    throw new Error(`伺服器連線失敗 (HTTP ${response.status})`);
  }
  
  const data = await response.json();
  if (data.error) {
    throw new Error(data.error);
  }

  const rows = data.rows || [];
  return {
    symbol: data.symbol || cleaned,
    name: data.name || data.symbol || cleaned,
    dates: rows.map(r => r.date),
    prices: rows.map(r => r.close)
  };
}

async function fetchChipData(symbol) {
  try {
    const cleaned = cleanSymbol(symbol);
    const res = await fetch(`/api/chip?symbol=${encodeURIComponent(cleaned)}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.error ? null : data;
  } catch (err) {
    return null;
  }
}

function calculateLohasBands(prices, isLogMode = false) {
  const n = prices.length;
  if (n === 0) return null;

  let yValues = prices;
  if (isLogMode) {
    yValues = prices.map(p => (p > 0 ? Math.log(p) : 0));
  }

  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += yValues[i];
    sumXY += i * yValues[i];
    sumXX += i * i;
  }

  const denominator = (n * sumXX - sumX * sumX);
  const b = denominator !== 0 ? (n * sumXY - sumX * sumY) / denominator : 0;
  const a = (sumY - b * sumX) / n;

  const meanY = sumY / n;
  let ssTot = 0, ssRes = 0;
  const trend = [];

  for (let i = 0; i < n; i++) {
    const fitVal = a + b * i;
    trend.push(fitVal);
    const diff = yValues[i] - fitVal;
    ssRes += diff * diff;
    ssTot += (yValues[i] - meanY) * (yValues[i] - meanY);
  }

  const sd = Math.sqrt(ssRes / n);
  const r2 = ssTot !== 0 ? Math.max(0, 1 - (ssRes / ssTot)) : 0;

  const TL = trend;
  const TL_plus_1SD = trend.map(v => v + sd);
  const TL_plus_2SD = trend.map(v => v + 2 * sd);
  const TL_minus_1SD = trend.map(v => v - sd);
  const TL_minus_2SD = trend.map(v => v - 2 * sd);

  if (isLogMode) {
    return {
      r2: r2,
      TL: TL.map(Math.exp),
      p2SD: TL_plus_2SD.map(Math.exp),
      p1SD: TL_plus_1SD.map(Math.exp),
      m1SD: TL_minus_1SD.map(Math.exp),
      m2SD: TL_minus_2SD.map(Math.exp)
    };
  }

  return { r2, TL, p2SD: TL_plus_2SD, p1SD: TL_plus_1SD, m1SD: TL_minus_1SD, m2SD: TL_minus_2SD };
}

// ==========================================
// 3. 核心繪製邏輯
// ==========================================

async function renderChart() {
  const rawInput = symbolInput ? symbolInput.value : currentSymbol;
  const symbol = cleanSymbol(rawInput || currentSymbol);
  currentSymbol = symbol;

  const period = periodSelect ? periodSelect.value : "3.5";
  const isLog = modelSelect ? modelSelect.value === "log" : false;

  try {
    const stockData = await fetchStockData(symbol, period);
    
    if (chartTitle) {
      chartTitle.textContent = `${stockData.symbol} ${stockData.name}`;
    }

    const prices = stockData.prices;
    const bands = calculateLohasBands(prices, isLog);

    if (prices.length > 0) {
      const currentPrice = prices[prices.length - 1];
      if (closeText) closeText.textContent = `$${currentPrice.toFixed(2)}`;

      if (bands) {
        if (r2Text) r2Text.textContent = bands.r2.toFixed(3);

        const p2 = bands.p2SD[bands.p2SD.length - 1];
        const p1 = bands.p1SD[bands.p1SD.length - 1];
        const tl = bands.TL[bands.TL.length - 1];
        const m1 = bands.m1SD[bands.m1SD.length - 1];
        const m2 = bands.m2SD[bands.m2SD.length - 1];

        if (zoneText) {
          if (currentPrice >= p2) zoneText.textContent = "極度樂觀";
          else if (currentPrice >= p1) zoneText.textContent = "相對樂觀";
          else if (currentPrice <= m2) zoneText.textContent = "極度悲觀";
          else if (currentPrice <= m1) zoneText.textContent = "相對悲觀";
          else zoneText.textContent = "常態區間";
        }

        if (levelsTable) {
          levelsTable.innerHTML = `
            <tr><td>樂觀線 (+2SD)</td><td>$${p2.toFixed(2)}</td><td style="color:var(--red);">過熱區</td></tr>
            <tr><td>相對樂觀 (+1SD)</td><td>$${p1.toFixed(2)}</td><td style="color:#d97706;">偏高區</td></tr>
            <tr><td>均值線 (TL)</td><td>$${tl.toFixed(2)}</td><td style="color:var(--blue);">合理價</td></tr>
            <tr><td>相對悲觀 (-1SD)</td><td>$${m1.toFixed(2)}</td><td style="color:#2c6ebd;">偏低區</td></tr>
            <tr><td>悲觀線 (-2SD)</td><td>$${m2.toFixed(2)}</td><td style="color:var(--green);">超跌區</td></tr>
          `;
        }
      }
    }

    renderChipUI(symbol);

  } catch (err) {
    console.error("renderChart 錯誤:", err);
    if (chartTitle) chartTitle.textContent = `載入失敗: ${err.message}`;
  }
}

async function renderChipUI(symbol) {
  if (!chipText) return;
  chipText.innerHTML = '<span style="color:var(--muted);">正在載入盤後籌碼數據...</span>';

  const chip = await fetchChipData(symbol);
  if (!chip) {
    chipText.innerHTML = '<span style="color:var(--muted);">尚無今日盤後籌碼或非台股標的</span>';
    return;
  }

  const fStr = chip.foreign >= 0 ? `+${chip.foreign}` : `${chip.foreign}`;
  const tStr = chip.trust >= 0 ? `+${chip.trust}` : `${chip.trust}`;
  const totStr = chip.total >= 0 ? `+${chip.total}` : `${chip.total}`;

  chipText.innerHTML = `
    📊 <strong>${chip.date} 三大法人籌碼：</strong>
    外資 <span style="color:${chip.foreign >= 0 ? 'var(--red)' : 'var(--green)'}">${fStr}</span> 張 | 
    投信 <span style="color:${chip.trust >= 0 ? 'var(--red)' : 'var(--green)'}">${tStr}</span> 張 | 
    合計 <span style="color:${chip.total >= 0 ? 'var(--red)' : 'var(--green)'}">${totStr}</span> 張
  `;
}

// ==========================================
// 4. 原版 UI 樣式的巡邏卡片渲染
// ==========================================

async function fetchLevelForWatchlist(symbol) {
  try {
    const period = periodSelect ? periodSelect.value : "3.5";
    const isLog = modelSelect ? modelSelect.value === "log" : false;

    const stockData = await fetchStockData(symbol, period);
    const prices = stockData.prices;
    if (!prices || prices.length === 0) return null;

    const currentPrice = prices[prices.length - 1];
    const bands = calculateLohasBands(prices, isLog);

    const p2 = bands.p2SD[bands.p2SD.length - 1];
    const p1 = bands.p1SD[bands.p1SD.length - 1];
    const m1 = bands.m1SD[bands.m1SD.length - 1];
    const m2 = bands.m2SD[bands.m2SD.length - 1];

    let levelName = "常態區間";
    let badgeBg = "#64748b";

    if (currentPrice >= p2) { levelName = "極度樂觀"; badgeBg = "#c94b4b"; }
    else if (currentPrice >= p1) { levelName = "相對樂觀"; badgeBg = "#d97706"; }
    else if (currentPrice <= m2) { levelName = "極度悲觀"; badgeBg = "#1f8a63"; }
    else if (currentPrice <= m1) { levelName = "相對悲觀"; badgeBg = "#2c6ebd"; }

    return {
      symbol: stockData.symbol,
      name: stockData.name,
      price: currentPrice.toFixed(2),
      levelName: levelName,
      badgeBg: badgeBg
    };
  } catch (err) {
    return null;
  }
}

/**
 * ⚡ 執行批量掃描更新（產生原版精美的 HTML 卡片結構）
 */
async function runBatchScan() {
  if (!watchlistResult) return;

  if (watchlist.length === 0) {
    watchlistResult.innerHTML = '<div style="color:var(--muted); padding:10px;">目前監控清單為空</div>';
    updateRemoveSelect();
    return;
  }

  if (btnWatchlist) {
    btnWatchlist.disabled = true;
    btnWatchlist.textContent = "⏳ 正在批量掃描中...";
  }

  const cardsHtml = [];
  let count = 0;

  for (const sym of watchlist) {
    count++;
    if (watchlistStatus) {
      watchlistStatus.textContent = `⚡ 正在掃描個股 (${count}/${watchlist.length})：${sym}`;
    }
    
    const item = await fetchLevelForWatchlist(sym);
    if (item) {
      // 完全還原圖片中原版 UI 的兩欄式卡片結構
      cardsHtml.push(`
        <div class="watchlist-item">
          <div>
            <div style="font-weight: bold; font-size: 1.05rem; cursor: pointer;" onclick="switchSymbol('${item.symbol}')">
              ${item.symbol} ${item.name}
            </div>
            <div style="color: var(--muted); font-size: 0.85rem; margin-top: 4px;">
              現價: $${item.price}
            </div>
          </div>
          <div style="text-align: right; display: flex; flex-direction: column; align-items: flex-end; justify-content: space-between;">
            <span style="background: ${item.badgeBg}; color: #fff; padding: 4px 8px; border-radius: 6px; font-size: 0.78rem; font-weight: bold;">
              ${item.levelName}
            </span>
            <button onclick="removeFromWatchlist('${item.symbol}')" style="background: none; border: none; color: #c94b4b; cursor: pointer; font-size: 0.82rem; margin-top: 8px; padding: 0;">
              刪除
            </button>
          </div>
        </div>
      `);
    }

    await delay(200);
  }

  watchlistResult.innerHTML = cardsHtml.length > 0 
    ? cardsHtml.join('')
    : '<div style="color:var(--muted); padding:10px;">無法取得監控清單資料</div>';

  if (watchlistStatus) {
    watchlistStatus.innerHTML = `✅ 掃描完成 (共 ${watchlist.length} 檔)`;
  }

  if (btnWatchlist) {
    btnWatchlist.disabled = false;
    btnWatchlist.textContent = "⚡ 執行批量掃描更新";
  }

  updateRemoveSelect();
}

function updateRemoveSelect() {
  if (!removeWatchlistSelect) return;
  if (watchlist.length === 0) {
    removeWatchlistSelect.innerHTML = '<option value="">📭 清單為空</option>';
    return;
  }
  removeWatchlistSelect.innerHTML = watchlist.map(s => `<option value="${s}">${s}</option>`).join('');
}

window.switchSymbol = function(symbol) {
  if (symbolInput) symbolInput.value = symbol;
  renderChart();
};

window.removeFromWatchlist = function(symbol) {
  watchlist = watchlist.filter(s => cleanSymbol(s) !== cleanSymbol(symbol));
  localStorage.setItem("watchlist", JSON.stringify(watchlist));
  runBatchScan();
};

// ==========================================
// 5. 事件處理
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
  if (fetchBtn) fetchBtn.addEventListener("click", renderChart);
  if (periodSelect) periodSelect.addEventListener("change", renderChart);
  if (modelSelect) modelSelect.addEventListener("change", renderChart);

  if (btnAddWatchlistSingle && addWatchlistInput) {
    btnAddWatchlistSingle.addEventListener("click", () => {
      const val = addWatchlistInput.value.trim();
      if (!val) return;

      const cleaned = cleanSymbol(val);
      if (!watchlist.includes(cleaned)) {
        watchlist.push(cleaned);
        localStorage.setItem("watchlist", JSON.stringify(watchlist));
        addWatchlistInput.value = "";
        runBatchScan();
      }
    });
  }

  if (btnRemoveWatchlistSingle && removeWatchlistSelect) {
    btnRemoveWatchlistSingle.addEventListener("click", () => {
      const selected = removeWatchlistSelect.value;
      if (selected) {
        removeFromWatchlist(selected);
      }
    });
  }

  if (btnClearWatchlist) {
    btnClearWatchlist.addEventListener("click", () => {
      if (confirm("確定要清除所有觀察清單嗎？")) {
        watchlist = [];
        localStorage.removeItem("watchlist");
        runBatchScan();
      }
    });
  }

  if (btnWatchlist) {
    btnWatchlist.addEventListener("click", runBatchScan);
  }

  if (symbolInput) symbolInput.value = currentSymbol;
  renderChart();
  runBatchScan();
});