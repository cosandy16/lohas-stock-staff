// ==========================================
// 1. 全域狀態與 DOM 元素 (完全對應 HTML ID)
// ==========================================
let currentSymbol = "2330.TW";
let chartInstance = null;

// DOM 元素引用 (已匹配 index.html)
const marketSelect = document.getElementById("market");
const symbolInput = document.getElementById("symbolInput");
const fetchBtn = document.getElementById("fetchSymbolBtn");
const periodSelect = document.getElementById("periodYears");
const modelSelect = document.getElementById("modelMode");
const chartTitle = document.getElementById("chartTitle");
const chartCanvas = document.getElementById("mainChart"); // 若改用 Canvas 請確認 DOM

// 狀態文字元素
const closeText = document.getElementById("closeText");
const zoneText = document.getElementById("zoneText");
const r2Text = document.getElementById("r2Text");
const chipText = document.getElementById("chipText");

// 關注清單 DOM 元素
const addWatchlistInput = document.getElementById("addWatchlistInput");
const btnAddWatchlistSingle = document.getElementById("btnAddWatchlistSingle");
const removeWatchlistSelect = document.getElementById("removeWatchlistSelect");
const btnRemoveWatchlistSingle = document.getElementById("btnRemoveWatchlistSingle");

// 按鈕與狀態
const btnWatchlist = document.getElementById("btnWatchlist"); // ⚡ 執行批量掃描更新按鈕
const watchlistStatus = document.getElementById("watchlistStatus");
const watchlistResult = document.getElementById("watchlistResult");

// 清除與管理按鈕
const btnClearWatchlist = document.getElementById("btnClearWatchlist");

// 初始化關注清單 (若 localStorage 無資料，提供預設值)
let watchlist = JSON.parse(localStorage.getItem("watchlist")) || ["2330.TW", "2454.TW", "0050.TW"];

// ==========================================
// 2. 工具函式與數據獲取
// ==========================================

/**
 * 格式化股票代碼 (純數字自動補上 .TW)
 */
function cleanSymbol(symbol) {
  if (!symbol) return "";
  let s = symbol.trim().toUpperCase();
  if (/^\d+$/.test(s)) {
    return `${s}.TW`;
  }
  return s;
}

/**
 * 延遲函式 (防撞與 API 限流保護)
 */
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * 向後端 API 獲取數據
 */
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

/**
 * 計算樂活五線譜 (線性/對數迴歸 + 標準差)
 */
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

  let sumResidualSq = 0;
  const trend = [];
  for (let i = 0; i < n; i++) {
    const fitVal = a + b * i;
    trend.push(fitVal);
    const diff = yValues[i] - fitVal;
    sumResidualSq += diff * diff;
  }
  const sd = Math.sqrt(sumResidualSq / n);

  const TL = trend;
  const TL_plus_1SD = trend.map(v => v + sd);
  const TL_plus_2SD = trend.map(v => v + 2 * sd);
  const TL_minus_1SD = trend.map(v => v - sd);
  const TL_minus_2SD = trend.map(v => v - 2 * sd);

  if (isLogMode) {
    return {
      TL: TL.map(Math.exp),
      p2SD: TL_plus_2SD.map(Math.exp),
      p1SD: TL_plus_1SD.map(Math.exp),
      m1SD: TL_minus_1SD.map(Math.exp),
      m2SD: TL_minus_2SD.map(Math.exp)
    };
  }

  return { TL, p2SD: TL_plus_2SD, p1SD: TL_plus_1SD, m1SD: TL_minus_1SD, m2SD: TL_minus_2SD };
}

// ==========================================
// 3. 核心邏輯：圖表繪製與關注清單
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
      chartTitle.textContent = `${stockData.symbol} ${stockData.name} - 樂活五線譜 (${period}年)`;
    }

    const prices = stockData.prices;
    const bands = calculateLohasBands(prices, isLog);

    if (closeText && prices.length > 0) {
      closeText.textContent = `$${prices[prices.length - 1].toFixed(2)}`;
    }

    if (bands && zoneText && prices.length > 0) {
      const currentPrice = prices[prices.length - 1];
      const p2 = bands.p2SD[bands.p2SD.length - 1];
      const p1 = bands.p1SD[bands.p1SD.length - 1];
      const m1 = bands.m1SD[bands.m1SD.length - 1];
      const m2 = bands.m2SD[bands.m2SD.length - 1];

      if (currentPrice >= p2) zoneText.textContent = "極度樂觀";
      else if (currentPrice >= p1) zoneText.textContent = "相對樂觀";
      else if (currentPrice <= m2) zoneText.textContent = "極度悲觀";
      else if (currentPrice <= m1) zoneText.textContent = "相對悲觀";
      else zoneText.textContent = "常態區間";
    }

  } catch (err) {
    console.error("renderChart 錯誤:", err);
    if (chartTitle) chartTitle.textContent = `載入失敗: ${err.message}`;
  }
}

/**
 * 單檔位階獲取
 */
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
    let badgeStyle = "background:#64748b; color:#fff;";

    if (currentPrice >= p2) { levelName = "極度樂觀"; badgeStyle = "background:#c94b4b; color:#fff;"; }
    else if (currentPrice >= p1) { levelName = "相對樂觀"; badgeStyle = "background:#d97706; color:#fff;"; }
    else if (currentPrice <= m2) { levelName = "極度悲觀"; badgeStyle = "background:#1f8a63; color:#fff;"; }
    else if (currentPrice <= m1) { levelName = "相對悲觀"; badgeStyle = "background:#2c6ebd; color:#fff;"; }

    return {
      symbol: stockData.symbol,
      name: stockData.name,
      price: currentPrice.toFixed(2),
      levelName: levelName,
      badgeStyle: badgeStyle
    };
  } catch (err) {
    return null;
  }
}

/**
 * ⚡ 執行批量掃描更新 (綁定至 #btnWatchlist)
 */
async function runBatchScan() {
  if (!watchlistResult) return;

  if (watchlist.length === 0) {
    watchlistResult.innerHTML = '<div style="color:var(--muted); padding:10px;">目前清單為空</div>';
    updateRemoveSelect();
    return;
  }

  // 禁用按鈕防重複點擊
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
      cardsHtml.push(`
        <div class="watchlist-item">
          <div>
            <a href="#" onclick="switchSymbol('${item.symbol}'); return false;" style="font-weight:bold; text-decoration:none; color:var(--ink);">
              ${item.symbol} ${item.name}
            </a>
            <div style="font-size:0.8rem; color:var(--muted); margin-top:2px;">現價: $${item.price}</div>
          </div>
          <div style="text-align:right;">
            <span style="padding:3px 8px; border-radius:4px; font-size:0.75rem; font-weight:bold; ${item.badgeStyle}">
              ${item.levelName}
            </span>
            <div style="margin-top:6px;">
              <button onclick="removeFromWatchlist('${item.symbol}')" style="background:transparent; border:none; color:var(--red); font-size:0.75rem; cursor:pointer; padding:0;">刪除</button>
            </div>
          </div>
        </div>
      `);
    }

    await delay(250); // 防撞間隔
  }

  watchlistResult.innerHTML = cardsHtml.length > 0 
    ? cardsHtml.join('')
    : '<div style="color:var(--muted); padding:10px;">無法取得監控清單資料</div>';

  if (watchlistStatus) {
    watchlistStatus.textContent = `✅ 掃描完成 (共 ${watchlist.length} 檔)`;
  }

  // 恢復按鈕狀態
  if (btnWatchlist) {
    btnWatchlist.disabled = false;
    btnWatchlist.textContent = "⚡ 執行批量掃描更新";
  }

  updateRemoveSelect();
}

/**
 * 更新下拉刪除選單內容
 */
function updateRemoveSelect() {
  if (!removeWatchlistSelect) return;
  
  if (watchlist.length === 0) {
    removeWatchlistSelect.innerHTML = '<option value="">📭 清單為空</option>';
    return;
  }

  removeWatchlistSelect.innerHTML = watchlist.map(s => `<option value="${s}">${s}</option>`).join('');
}

// 全域切換與移除方法
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
// 4. 事件監聽器綁定
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
  // 載入個股數據按鈕 (#fetchSymbolBtn)
  if (fetchBtn) {
    fetchBtn.addEventListener("click", renderChart);
  }

  // 下拉選單變更
  if (periodSelect) periodSelect.addEventListener("change", renderChart);
  if (modelSelect) modelSelect.addEventListener("change", renderChart);

  // 單檔新增按鈕 (#btnAddWatchlistSingle)
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

  // 單檔刪除按鈕 (#btnRemoveWatchlistSingle)
  if (btnRemoveWatchlistSingle && removeWatchlistSelect) {
    btnRemoveWatchlistSingle.addEventListener("click", () => {
      const selected = removeWatchlistSelect.value;
      if (selected) {
        removeFromWatchlist(selected);
      }
    });
  }

  // 清除全部按鈕 (#btnClearWatchlist)
  if (btnClearWatchlist) {
    btnClearWatchlist.addEventListener("click", () => {
      if (confirm("確定要清除所有關注清單嗎？")) {
        watchlist = [];
        localStorage.removeItem("watchlist");
        runBatchScan();
      }
    });
  }

  // ⚡ 正確綁定「執行批量掃描更新」按鈕 (#btnWatchlist)
  if (btnWatchlist) {
    btnWatchlist.addEventListener("click", runBatchScan);
  }

  // 初始載入與執行
  if (symbolInput) symbolInput.value = currentSymbol;
  renderChart();
  runBatchScan();
});