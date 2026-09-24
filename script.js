// 全域邊界狀態與動態名稱快取
const DYNAMIC_STOCK_NAMES = {};

// 靜態備份字典（選填，防後端網路斷線時的預設備份）
const TW_STOCK_NAMES = {
  "2330": "台積電",
  "2317": "鴻海",
  "2454": "聯發科",
  "0050": "元大台灣50",
  "0056": "元大高股息"
};

// 初始化載入全域股票名稱對照表
async function initStockNames() {
  try {
    const res = await fetch("http://localhost:8000/api/stock-names");
    if (res.ok) {
      const data = await res.json();
      Object.assign(DYNAMIC_STOCK_NAMES, data);
      console.log("✅ 成功同步動態股票名稱庫");
    }
  } catch (err) {
    console.warn("⚠️ 取得股票名稱失敗，將改用備份字典:", err);
  }
}

// 通用名稱查詢函式
function getStockName(symbol) {
  if (!symbol) return "";
  const code = symbol.replace(/\.(TW|TWO)$/i, "").toUpperCase();
  return DYNAMIC_STOCK_NAMES[code] || TW_STOCK_NAMES[code] || "";
}

// K線線性迴歸擬合運算
function buildAnalysis(rows, modelType = "linear", years = "3.5") {
  if (!rows || rows.length === 0) return [];
  return rows.map((r, idx) => ({
    time: r.time,
    close: r.close,
    sma: r.close * (1 + (idx % 5) * 0.001) // 簡化展示運算
  }));
}

// 單一股票數據抓取與分析
async function fetchStockData(rawSymbol) {
  const symbol = rawSymbol.trim().toUpperCase();
  const url = `http://localhost:8000/api/yahoo?symbol=${encodeURIComponent(symbol)}&market=tw`;
  
  const response = await fetch(url);
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || "抓取失敗");
  }
  
  const data = await response.json();
  const cleanCode = data.symbol.replace(/\.(TW|TWO)$/i, "").toUpperCase();

  // 若 API 直接回傳名稱，快取寫入
  if (data.name) {
    DYNAMIC_STOCK_NAMES[cleanCode] = data.name;
  }

  const name = getStockName(data.symbol);
  return {
    symbol: data.symbol,
    name: name,
    displayName: name ? `${cleanCode} ${name}` : data.symbol,
    rows: data.rows,
    analysis: buildAnalysis(data.rows)
  };
}

// 批量監控清單資料讀取範例
async function fetchLevelForWatchlist(symbolList) {
  const results = await Promise.allSettled(
    symbolList.map(sym => fetchStockData(sym))
  );

  return results.map((res, idx) => {
    if (res.status === "fulfilled") {
      const data = res.value;
      const lastRow = data.rows[data.rows.length - 1];
      return {
        sym: data.symbol,
        name: data.name,
        displayName: data.displayName,
        lastPrice: lastRow ? lastRow.close : null
      };
    } else {
      return {
        sym: symbolList[idx],
        name: getStockName(symbolList[idx]),
        error: res.reason.message
      };
    }
  });
}

// UI 頁面初始化綁定
document.addEventListener("DOMContentLoaded", async () => {
  // 1. 初始化資料庫名稱
  await initStockNames();

  // 2. 測試單一股票查詢按鈕綁定 (假設 HTML 有 id="searchBtn" 與 id="stockInput")
  const searchBtn = document.getElementById("searchBtn");
  if (searchBtn) {
    searchBtn.addEventListener("click", async () => {
      const input = document.getElementById("stockInput").value;
      try {
        const result = await fetchStockData(input);
        console.log("股票查詢成功:", result);
        
        const titleEl = document.getElementById("stockTitle");
        if (titleEl) {
          titleEl.innerText = result.displayName;
        }
      } catch (e) {
        alert("查詢失敗: " + e.message);
      }
    });
  }
});