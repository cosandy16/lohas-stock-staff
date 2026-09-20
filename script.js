// ==========================================
// 1. 全域狀態與 DOM 元素
// ==========================================
let currentSymbol = "2330.TW";
let chartInstance = null;

// DOM 元素引用
const symbolInput = document.getElementById("symbolInput");
const fetchBtn = document.getElementById("fetchBtn");
const periodSelect = document.getElementById("periodYears");
const modelSelect = document.getElementById("modelMode");
const chartTitle = document.getElementById("chartTitle");
const chartCanvas = document.getElementById("mainChart");

// 自訂關注清單 DOM 元素
const watchlistInput = document.getElementById("watchlistInput");
const addWatchlistBtn = document.getElementById("addWatchlistBtn");
const watchlistContainer = document.getElementById("watchlistContainer");

// 初始化關注清單 (若 localStorage 無資料，提供預設值)
let watchlist = JSON.parse(localStorage.getItem("watchlist")) || ["2330.TW", "2454.TW", "0050.TW"];

// ==========================================
// 2. 工具函式與數據獲取
// ==========================================

/**
 * 格式化股票代碼 (純數字自動補上 .TW)
 */
function cleanSymbol(symbol) {
  let s = symbol.trim().toUpperCase();
  if (/^\d+$/.test(s)) {
    return `${s}.TW`;
  }
  return s;
}

/**
 * 向方案 B 後端 API 獲取 K 線歷史數據與股票名稱
 */
async function fetchStockData(symbol, periodYears) {
  const cleaned = cleanSymbol(symbol);
  // 對接方案 B 後端 /api/yahoo API
  const response = await fetch(`/api/yahoo?symbol=${encodeURIComponent(cleaned)}&years=${periodYears}`);
  if (!response.ok) {
    throw new Error("無法取得股票歷史資料");
  }
  const data = await response.json();
  
  if (data.error) {
    throw new Error(data.error);
  }

  // 將後端回傳的 rows [{date, close, raw_close}] 轉為圖表需要的陣列格式
  const rows = data.rows || [];
  return {
    symbol: data.symbol,
    name: data.name || data.symbol, // 後端方案 B 直接提供的中文名稱
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
    yValues = prices.map(p => Math.log(p));
  }

  // 線性迴歸：y = a + b * x
  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += yValues[i];
    sumXY += i * yValues[i];
    sumXX += i * i;
  }

  const b = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const a = (sumY - b * sumX) / n;

  // 計算殘差標準差
  let sumResidualSq = 0;
  const trend = [];
  for (let i = 0; i < n; i++) {
    const fitVal = a + b * i;
    trend.push(fitVal);
    const diff = yValues[i] - fitVal;
    sumResidualSq += diff * diff;
  }
  const sd = Math.sqrt(sumResidualSq / n);

  // 產生 5 條線
  const TL = trend; // 趨勢線
  const TL_plus_1SD = trend.map(v => v + sd);
  const TL_plus_2SD = trend.map(v => v + 2 * sd);
  const TL_minus_1SD = trend.map(v => v - sd);
  const TL_minus_2SD = trend.map(v => v - 2 * sd);

  // 若為對數模式，需轉回指數 (Exp)
  if (isLogMode) {
    return {
      TL: TL.map(Math.exp),
      p2SD: TL_plus_2SD.map(Math.exp),
      p1SD: TL_plus_1SD.map(Math.exp),
      m1SD: TL_minus_1SD.map(Math.exp),
      m2SD: TL_minus_2SD.map(Math.exp)
    };
  }

  return {
    TL: TL,
    p2SD: TL_plus_2SD,
    p1SD: TL_plus_1SD,
    m1SD: TL_minus_1SD,
    m2SD: TL_minus_2SD
  };
}

// ==========================================
// 3. 核心邏輯：圖表繪製
// ==========================================

/**
 * 繪製或更新 Chart.js 圖表
 */
async function renderChart() {
  const symbol = cleanSymbol(symbolInput.value || currentSymbol);
  currentSymbol = symbol;
  const period = periodSelect.value || "3.5";
  const isLog = modelSelect.value === "log";

  try {
    const stockData = await fetchStockData(symbol, period);
    
    // 更新圖表標題（顯示後端傳回的中文名稱）
    chartTitle.textContent = `${stockData.symbol} ${stockData.name} - 樂活五線譜 (${period}年)`;

    const dates = stockData.dates;
    const prices = stockData.prices;
    const bands = calculateLohasBands(prices, isLog);

    if (chartInstance) {
      chartInstance.destroy();
    }

    const ctx = chartCanvas.getContext("2d");
    chartInstance = new Chart(ctx, {
      type: "line",
      data: {
        labels: dates,
        datasets: [
          { label: "收盤價", data: prices, borderColor: "#212529", borderWidth: 2, pointRadius: 0 },
          { label: "樂觀線 (+2SD)", data: bands.p2SD, borderColor: "#dc3545", borderWidth: 1.5, pointRadius: 0, borderDash: [4, 4] },
          { label: "相對樂觀線 (+1SD)", data: bands.p1SD, borderColor: "#fd7e14", borderWidth: 1.5, pointRadius: 0, borderDash: [2, 2] },
          { label: "均值線 (TL)", data: bands.TL, borderColor: "#0d6efd", borderWidth: 2, pointRadius: 0 },
          { label: "相對悲觀線 (-1SD)", data: bands.m1SD, borderColor: "#20c997", borderWidth: 1.5, pointRadius: 0, borderDash: [2, 2] },
          { label: "悲觀線 (-2SD)", data: bands.m2SD, borderColor: "#198754", borderWidth: 1.5, pointRadius: 0, borderDash: [4, 4] }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { position: 'top' }
        }
      }
    });
  } catch (err) {
    alert(`圖表載入失敗: ${err.message}`);
  }
}

// ==========================================
// 4. 自訂關注清單 (Watchlist) 模組
// ==========================================

/**
 * 計算關注股票的當前位階與獲取名稱
 */
async function fetchLevelForWatchlist(symbol) {
  try {
    const stockData = await fetchStockData(symbol, periodSelect.value || "3.5");
    const prices = stockData.prices;
    if (!prices || prices.length === 0) return null;

    const currentPrice = prices[prices.length - 1];
    const bands = calculateLohasBands(prices, modelSelect.value === "log");

    const p2 = bands.p2SD[bands.p2SD.length - 1];
    const p1 = bands.p1SD[bands.p1SD.length - 1];
    const m1 = bands.m1SD[bands.m1SD.length - 1];
    const m2 = bands.m2SD[bands.m2SD.length - 1];

    let levelName = "常態區間";
    let badgeClass = "bg-secondary";

    if (currentPrice >= p2) {
      levelName = "極度樂觀"; badgeClass = "bg-danger";
    } else if (currentPrice >= p1) {
      levelName = "相對樂觀"; badgeClass = "bg-warning text-dark";
    } else if (currentPrice <= m2) {
      levelName = "極度悲觀"; badgeClass = "bg-success";
    } else if (currentPrice <= m1) {
      levelName = "相對悲觀"; badgeClass = "bg-info text-dark";
    }

    return {
      symbol: stockData.symbol,
      name: stockData.name,
      price: currentPrice.toFixed(2),
      levelName: levelName,
      badgeClass: badgeClass
    };
  } catch (err) {
    return null;
  }
}

/**
 * 渲染自訂關注清單 UI
 */
async function renderWatchlistUI() {
  watchlistContainer.innerHTML = '<div class="text-muted p-2">載入關注清單中...</div>';
  
  const cardsHtml = [];
  for (const sym of watchlist) {
    const item = await fetchLevelForWatchlist(sym);
    if (item) {
      cardsHtml.push(`
        <div class="col-md-4 col-sm-6 mb-3">
          <div class="card h-100 shadow-sm">
            <div class="card-body d-flex justify-content-between align-items-center">
              <div>
                <h6 class="card-title mb-1">
                  <a href="#" onclick="switchSymbol('${item.symbol}'); return false;" class="text-decoration-none fw-bold">
                    ${item.symbol} ${item.name}
                  </a>
                </h6>
                <p class="card-text mb-0 text-muted">現價: $${item.price}</p>
              </div>
              <div class="text-end">
                <span class="badge ${item.badgeClass} mb-2">${item.levelName}</span>
                <div>
                  <button class="btn btn-sm btn-outline-danger py-0 px-2" onclick="removeFromWatchlist('${item.symbol}')">刪除</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      `);
    }
  }

  watchlistContainer.innerHTML = cardsHtml.length > 0 
    ? `<div class="row">${cardsHtml.join('')}</div>`
    : '<div class="text-muted p-2">目前沒有關注的股票</div>';
}

/**
 * 點擊關注清單切換主圖表
 */
window.switchSymbol = function(symbol) {
  symbolInput.value = symbol;
  renderChart();
};

/**
 * 從關注清單移除股票
 */
window.removeFromWatchlist = function(symbol) {
  watchlist = watchlist.filter(s => cleanSymbol(s) !== cleanSymbol(symbol));
  localStorage.setItem("watchlist", JSON.stringify(watchlist));
  renderWatchlistUI();
};

// ==========================================
// 5. 事件監聽器與初始化
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
  // 查詢按鈕
  fetchBtn.addEventListener("click", () => {
    renderChart();
  });

  // 監聽下拉選單變更（年限 / 迴歸模式）
  periodSelect.addEventListener("change", () => {
    renderChart();
    renderWatchlistUI();
  });

  modelSelect.addEventListener("change", () => {
    renderChart();
    renderWatchlistUI();
  });

  // 新增至關注清單
  addWatchlistBtn.addEventListener("click", () => {
    const inputVal = watchlistInput.value.trim();
    if (!inputVal) return;

    const cleaned = cleanSymbol(inputVal);
    if (!watchlist.includes(cleaned)) {
      watchlist.push(cleaned);
      localStorage.setItem("watchlist", JSON.stringify(watchlist));
      watchlistInput.value = "";
      renderWatchlistUI();
    }
  });

  // 初始繪製
  symbolInput.value = currentSymbol;
  renderChart();
  renderWatchlistUI();
});