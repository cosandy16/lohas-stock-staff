// ==========================================
// 1. 靜態熱門股清單與動態快取
// ==========================================
const TW_STOCK_NAMES = {
  "2330": "台積電",
  "2317": "鴻海",
  "2454": "聯發科",
  "2308": "台達電",
  "2382": "廣達",
  "2881": "富邦金",
  "2882": "國泰金",
  "2891": "中信金",
  "0050": "元大台灣50",
  "0056": "元大高股息",
  "00878": "國泰永續高股息",
  "00919": "群益台灣精選高息",
  "00929": "復華台灣科技優息",
  "00940": "元大台灣價值高息"
};

// 使用展開運算子將熱門股載入快取，做為查詢第一線
const stockNameCache = { ...TW_STOCK_NAMES };

/**
 * 非同步取得股票中文名稱
 * 順序：1. 快取/熱門清單 -> 2. 證交所 (上市) API -> 3. 櫃買中心 (上櫃) API -> 4. 傳回原代碼
 * @param {string} symbol - 股票代碼 (例: "2330", "2330.TW", "00878.TWO")
 * @returns {Promise<string>} 中文名稱或原代碼
 */
async function getStockNameAsync(symbol) {
  if (!symbol) return "";

  // 整理代碼，格式化為純數字 (例如 "2330.TW" -> "2330")
  const cleanCode = symbol.split('.')[0].trim().toUpperCase();

  // 1. 優先查詢快取（包含寫死的熱門股與先前已查到的股票）
  if (stockNameCache[cleanCode]) {
    return stockNameCache[cleanCode];
  }

  // 若不是數字開頭的股票代碼（如美股 AAPL, TSLA），直接寫入快取並回傳
  if (!/^\d+$/.test(cleanCode)) {
    stockNameCache[cleanCode] = cleanCode;
    return cleanCode;
  }

  try {
    // 2. 向證交所 OpenAPI (上市股票/ETF) 查詢
    const twseRes = await fetch('https://openapi.twse.com.tw/v1/opendata/t187ap03_L');
    if (twseRes.ok) {
      const twseData = await twseRes.json();
      const match = twseData.find(item => item.公司代號 === cleanCode);
      if (match && match.公司簡稱) {
        stockNameCache[cleanCode] = match.公司簡稱; // 寫入快取
        return match.公司簡稱;
      }
    }

    // 3. 若上市查無結果，向櫃買中心 OpenAPI (上櫃股票/ETF) 查詢
    const tpexRes = await fetch('https://openapi.twse.com.tw/v1/opendata/t187ap03_O');
    if (tpexRes.ok) {
      const tpexData = await tpexRes.json();
      const match = tpexData.find(item => item.公司代號 === cleanCode);
      if (match && match.公司簡稱) {
        stockNameCache[cleanCode] = match.公司簡稱; // 寫入快取
        return match.公司簡稱;
      }
    }
  } catch (err) {
    console.warn(`[StockName] 動態查詢中文名稱失敗 (${cleanCode}):`, err);
  }

  // 4. 若公開 API 皆查無資料，將代碼寫入快取避免重複查詢，並直接回傳代碼
  stockNameCache[cleanCode] = cleanCode;
  return cleanCode;
}

// ==========================================
// 2. 全域狀態與 DOM 元素
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
// 3. 核心邏輯：五線譜計算與圖表繪製
// ==========================================

/**
 * 格式化股票代碼以符合 Yahoo Finance API 格式
 */
function cleanSymbol(symbol) {
  let s = symbol.trim().toUpperCase();
  if (/^\d+$/.test(s)) {
    return `${s}.TW`; // 純數字預設補上 .TW
  }
  return s;
}

/**
 * 向後端 API 獲取 K 線歷史數據
 */
async function fetchStockData(symbol, periodYears) {
  const response = await fetch(`/api/stock?symbol=${encodeURIComponent(symbol)}&period=${periodYears}`);
  if (!response.ok) {
    throw new Error("無法取得股票歷史資料");
  }
  return await response.json();
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

/**
 * 繪製或更新 Chart.js 圖表
 */
async function renderChart() {
  const symbol = cleanSymbol(symbolInput.value || currentSymbol);
  currentSymbol = symbol;
  const period = periodSelect.value || "3";
  const isLog = modelSelect.value === "log";

  // 動態非同步獲取中文名稱
  const chineseName = await getStockNameAsync(symbol);
  chartTitle.textContent = `${symbol} ${chineseName} - 樂活五線譜 (${period}年)`;

  try {
    const data = await fetchStockData(symbol, period);
    const dates = data.dates;
    const prices = data.prices;
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
 * 計算關注股票的當前位階
 */
async function fetchLevelForWatchlist(symbol) {
  try {
    const data = await fetchStockData(symbol, periodSelect.value || "3");
    const prices = data.prices;
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

    // 💡 非同步動態獲取名稱 (關鍵修改點)
    const name = await getStockNameAsync(symbol);

    return {
      symbol: cleanSymbol(symbol),
      name: name,
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