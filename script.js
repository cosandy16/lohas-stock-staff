// ==========================================
// 樂活通道 / 均線通道 / 五線譜 / 股票觀察清單 腳本 (script.js)
// ==========================================

const MAX_WATCHLIST_LIMIT = 40;

// 全域暫存當前標的籌碼資料，供投資建議面板計算使用
let currentMainChipData = null;

// 1. 動態字典：初始化時自動從後端 API 下載全台股/ETF名稱
let TW_STOCK_NAMES = {};

async function fetchStockNames() {
  try {
    const res = await fetch("/api/names");
    if (res.ok) {
      TW_STOCK_NAMES = await res.json();
      console.log(`✅ 已自動同步 ${Object.keys(TW_STOCK_NAMES).length} 檔最新台股/ETF名稱清單`);
    }
  } catch (e) {
    console.error("無法同步最新股票清單，將使用 API 即時帶出的名稱", e);
  }
}

// 基本面資料：由後端 /api/yahoo 回傳官方最新本益比與殖利率
let currentFundamentals = { pe: null, yield: null };

function fmtPe(pe, digits = 1, suffix = "x") {
  return Number.isFinite(pe) && pe > 0 ? `${pe.toFixed(digits)}${suffix}` : "N/A";
}
function fmtYield(y, digits = 2) {
  return Number.isFinite(y) && y >= 0 ? `${y.toFixed(digits)}%` : "N/A";
}


// ------------------------------------------
// 2. DOM 元素選取與全域變數
// ------------------------------------------
let csvInput, market, symbolInput, fetchSymbolBtn, fetchStatus, periodYears, modelMode;
let showChannelCheckbox, toggleBand; // 🔹 支援 #showChannelCheckbox 與 #toggleBand 雙 DOM 相容
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
  
  // 🔹 抓取「顯示樂活通道」相關控制項（支援 #toggleBand 與 #showChannelCheckbox）
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

// 判斷當前樂活通道開關狀態 (相容 #toggleBand 與 #showChannelCheckbox)
function isBandChannelActive() {
  if (toggleBand) {
    if (toggleBand.type === "checkbox") return toggleBand.checked;
    if (toggleBand.classList) return toggleBand.classList.contains("active");
  }
  if (showChannelCheckbox) return showChannelCheckbox.checked;
  return true;
}

// ------------------------------------------
// 🤖 3. 量化自動投資建議計算面板
// ------------------------------------------
// ------------------------------------------
// 投資建議判斷 (卡片標籤與下方建議面板共用同一套邏輯)
// 原則：位階為主、籌碼為輔、趨勢過濾；ETF 不採用法人籌碼
// ------------------------------------------
const BADGE_STYLE = {
  red: "background-color: #fee2e2; color: #dc2626; border: 1px solid #fca5a5;",
  orange: "background-color: #ffedd5; color: #ea580c; border: 1px solid #fdba74;",
  yellow: "background-color: #fef3c7; color: #d97706; border: 1px solid #fcd34d;",
  green: "background-color: #d1fae5; color: #059669; border: 1px solid #6ee7b7;"
};

function isEtfSymbol(symbol) {
  const code = String(symbol || "").split(".")[0].trim().toUpperCase();
  return /^00\d/.test(code);
}

// 籌碼強弱：外資+投信，近 5 日累計；以「占平均成交量比例」判斷是否明顯 (無成交量時退回固定 1000 張)
function assessChip(last, symbol, chip) {
  if (isEtfSymbol(symbol)) {
    return { state: "na", text: "ETF 的法人買賣超多為申購贖回與造市，不納入判斷" };
  }
  if (!chip || chip.error) {
    return { state: "na", text: "尚無法人籌碼資料" };
  }
  const has5 = Number.isFinite(chip.total5) && Number(chip.days) >= 3;
  const foreign = has5 ? (chip.foreign5 || 0) : (chip.foreign || 0);
  const trust = has5 ? (chip.trust5 || 0) : (chip.trust || 0);
  const net = foreign + trust;
  const days = has5 ? Number(chip.days) : 1;
  const avgVol = Number(last && last.avgVol) || 0;
  const strong = avgVol > 0 ? Math.abs(net) / (avgVol * days) >= 0.02 : Math.abs(net) >= 1000;
  const sign = (v) => (v >= 0 ? "+" : "") + v.toLocaleString();
  const label = `${has5 ? `近 ${days} 日` : "單日"}外資+投信`;
  const text = `${label}合計 ${sign(net)} 張 (外資 ${sign(foreign)} / 投信 ${sign(trust)})`;
  let state = "neutral";
  if (strong && net > 0) state = "strongBuy";
  else if (strong && net < 0) state = "strongSell";
  return { state, text, net, label };
}

function evaluateAdvice(last, symbol, chip) {
  const zone = priceZone(last);
  const r2 = parseFloat(last && last.r2) || 0;
  const trendUp = (last && Number.isFinite(last.slope)) ? last.slope > 0 : true;
  const c = assessChip(last, symbol, chip);
  const chipLine = c.state === "na" ? c.text : c.text;

  const out = (badgeText, badgeKey, panelClass, title, desc) => ({
    zone, chipState: c.state, badgeText, badgeStyle: BADGE_STYLE[badgeKey], panelClass, title, desc
  });

  if (r2 < 0.4) {
    return out("🟡 觀望 / 定額", "yellow", "advice-card advice-warning",
      "⚠️ 觀望警訊：五線譜擬合度不足 (R² < 0.4)",
      `當前 R² 僅 ${r2.toFixed(3)}，代表股價走勢較不遵循常態均值回歸規律，建議結合基本面或技術面線型輔助判斷。`);
  }

  if (zone === "樂觀區上緣") {
    if (c.state === "strongBuy") {
      return out("🟠 續抱 / 不追高", "orange", "advice-card advice-sell",
        "⚠️ 高位留意：位階已極高，法人仍在買超，但不宜追價",
        `股價已突破【${zone}】(高於 +2SD)，統計上勝率偏低。雖然 ${chipLine}，仍建議持股者設好停利點、未持股者不要追高。`);
    }
    return out("🔴 減碼 / 停利", "red", "advice-card advice-sell",
      "⚠️ 高位警訊：股價已突破樂觀線",
      `股價已來到【${zone}】(高於 +2SD)，統計上回落機率偏高。籌碼面：${chipLine}。建議持股者分批停利入袋，未持股者切勿追高。`);
  }

  if (zone === "相對樂觀區") {
    if (c.state === "strongSell") {
      return out("🔴 減碼 / 停利", "red", "advice-card advice-sell",
        "⚠️ 高位警訊：位階偏高 + 法人明顯賣超",
        `股價位於【${zone}】，且 ${chipLine}，修正拉回風險較大，建議持股者分批獲利入袋，未持股者切勿追高。`);
    }
    return out("🟡 觀望 / 不追高", "yellow", "advice-card advice-neutral",
      "⚖️ 位階偏高：不宜追價，持股可續抱觀察",
      `股價位於【${zone}】，尚未到極端位置。籌碼面：${chipLine}。未持股者等拉回再考慮，持股者可調升停利點保護利潤。`);
  }

  if (zone === "中線以上" || zone === "中線以下") {
    if (c.state === "strongBuy") {
      return out("🟡 觀望 / 定額", "yellow", "advice-card advice-buy",
        "⚖️ 區間偏多：中線軌道內 + 法人買超",
        `股價處於【${zone}】，籌碼面：${chipLine}，偏多但位階不極端，可繼續定期定額，不需追價。`);
    }
    if (c.state === "strongSell") {
      return out("🟡 觀望 / 定額", "yellow", "advice-card advice-neutral",
        "⚖️ 區間盤整：法人明顯賣超，不宜追高",
        `股價處於【${zone}】常態軌道內，籌碼面：${chipLine}。未持股者可靜待拉回或等籌碼轉買，持股者可續抱。`);
    }
    return out("🟡 觀望 / 定額", "yellow", "advice-card advice-neutral",
      "⚖️ 區間盤整：常態軌道內合理波動",
      `股價位於【${zone}】，籌碼面：${chipLine}。適合維持原有的定期定額扣款策略。`);
  }

  if (zone === "相對悲觀區") {
    if (c.state === "strongSell") {
      return out("🟡 等止跌 / 定額", "yellow", "advice-card advice-buy",
        "🛒 價值浮現：位階偏低，但法人明顯賣超",
        `股價已進入【${zone}】，中長期價值浮現，惟 ${chipLine}，建議採定期定額，等籌碼止跌轉買再放大部位。`);
    }
    if (c.state === "strongBuy") {
      return out("🟢 分批佈局", "green", "advice-card advice-strong-buy",
        "🎯 強力觀察：低位階 + 法人買超加持",
        `股價位於【${zone}】，同時 ${chipLine}。低位階配合籌碼買超，具備較高勝率與報酬比，適合分批佈局。`);
    }
    return out("🟢 分批佈局", "green", "advice-card advice-buy",
      "🛒 價值浮現：位階偏低，可分批佈局",
      `股價位於【${zone}】，統計上屬偏低區間。籌碼面：${chipLine}。建議分批進場，不要一次投入。`);
  }

  // 悲觀區下緣
  if (!trendUp) {
    return out("🟡 留意趨勢轉折", "yellow", "advice-card advice-warning",
      "⚠️ 跌破悲觀線，且長期趨勢線向下",
      `股價已跌至【${zone}】，但迴歸趨勢線斜率向下，低位階可能代表趨勢轉弱而不是便宜。籌碼面：${chipLine}。建議等價格止穩或趨勢轉正再佈局。`);
  }
  if (c.state === "strongSell") {
    return out("🟡 等止跌 / 定額", "yellow", "advice-card advice-buy",
      "🛒 價值浮現：跌至悲觀區，但法人明顯賣超",
      `股價已跌至【${zone}】，長期趨勢仍向上，但 ${chipLine}，建議先定期定額，等賣壓減緩再加碼。`);
  }
  return out("🟢 加碼 / 佈局", "green", "advice-card advice-strong-buy",
    "🎯 強力觀察：跌至悲觀區，長期趨勢仍向上",
    `股價位於【${zone}】，長期趨勢線向上。籌碼面：${chipLine}。統計上屬勝率與報酬比較佳的區間，適合分批加碼。`);
}

function updateAdvicePanel(last, symbol, chipData) {
  const container = document.getElementById("adviceContainer");
  const titleEl = document.getElementById("adviceTitle");
  const descEl = document.getElementById("adviceDesc");
  if (!container || !titleEl || !descEl) return;
  const adv = evaluateAdvice(last, symbol, chipData);
  container.className = adv.panelClass;
  titleEl.innerHTML = adv.title;
  descEl.textContent = adv.desc;
}

function getActionBadge(item) {
  const adv = evaluateAdvice(item.last, item.sym, item.chip);
  return { text: adv.badgeText, style: adv.badgeStyle };
}


// ------------------------------------------
// 4. 通用工具與計算函式
// ------------------------------------------
function analysisLastRaw() {
  try {
    const rows = JSON.parse(csvInput.value);
    const last = rows[rows.length - 1];
    return Number(last.raw_close || last.close) || null;
  } catch (e) { return null; }
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
  const currentPrice = p.close;
  let nearest = null;
  let minDiff = Infinity;

  levelDefs.forEach(l => {
    const levelPrice = p[l.key];
    const absDiff = Math.abs(currentPrice - levelPrice);
    
    if (absDiff < minDiff) {
      minDiff = absDiff;
      nearest = {
        label: l.label,
        key: l.key,
        color: l.color,
        price: levelPrice,
        diff: currentPrice - levelPrice,
        absDiff,
        pct: levelPrice > 0 ? (absDiff / levelPrice) * 100 : 999
      };
    }
  });
  return nearest;
}

function getNearestDistance(p) {
  const nearest = getNearestLevel(p);
  return nearest ? nearest.pct : 999;
}

function formatNearestText(nearest) {
  if (!nearest || !nearest.label) return "";
  const sign = nearest.diff >= 0 ? "高" : "低";
  const absDiff = Math.abs(nearest.diff).toFixed(2);
  const absPct = Math.abs(nearest.pct).toFixed(2);
  const cleanLabel = nearest.label.replace(/^[\+\-]\dSD\s*/, "");
  return `距 ${cleanLabel} (${formatPrice(nearest.price)}) 還 ${sign} ${absDiff} 元 (${absPct}%)`;
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



function getPriceRangeDesc(p) {
  if (!p) return "";
  const f = formatPrice; 
  if (p.close >= p.plus2) return `> ${f(p.plus2)} (+2SD 樂觀線)`;
  if (p.close >= p.plus1) return `${f(p.plus1)} (相對樂觀) ~ ${f(p.plus2)} (樂觀)`;
  if (p.close >= p.mid) return `${f(p.mid)} (中線) ~ ${f(p.plus1)} (相對樂觀)`;
  if (p.close >= p.minus1) return `${f(p.minus1)} (相對悲觀) ~ ${f(p.mid)} (中線)`;
  if (p.close >= p.minus2) return `${f(p.minus2)} (悲觀) ~ ${f(p.minus1)} (相對悲觀)`;
  return `< ${f(p.minus2)} (-2SD 悲觀線)`;
}

function getZoneWeight(zoneStr) {
  const weights = {
    "悲觀區下緣": 1,
    "相對悲觀區": 2,
    "中線以下": 3,
    "中線以上": 4,
    "相對樂觀區": 5,
    "樂觀區上緣": 6
  };
  return weights[zoneStr] || 0;
}

function formatPrice(v) { 
  return Number(v || 0).toLocaleString("zh-TW", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); 
}

// ------------------------------------------
// 5. 初始化與快取管理
// ------------------------------------------
document.addEventListener("DOMContentLoaded", async () => {
  initDOMElements();

  const watchlistTitle = document.getElementById("watchlistTitle");
  if (watchlistTitle) {
    watchlistTitle.textContent = `📋 ${MAX_WATCHLIST_LIMIT} 檔個股巡邏監控`;
  }

  await fetchStockNames();

  const savedWatchlist = localStorage.getItem("lohas_watchlist");
  if (savedWatchlist && watchlistInput) {
    watchlistInput.value = savedWatchlist;
  }

  const savedLastSymbol = localStorage.getItem("lohas_last_symbol");
  const savedLastMarket = localStorage.getItem("lohas_last_market");
  if (savedLastSymbol && symbolInput) symbolInput.value = savedLastSymbol;
  if (savedLastMarket && market) market.value = savedLastMarket;

  updateRemoveSelect();

  if (watchlistSearch) watchlistSearch.addEventListener("input", updateWatchlistDisplay);
  if (watchlistFilterZone) watchlistFilterZone.addEventListener("change", updateWatchlistDisplay);
  if (watchlistSort) watchlistSort.addEventListener("change", updateWatchlistDisplay);

  loadWatchlistFromCache();
  bindEvents();

  // 開啟頁面時：快取超過 30 分鐘 (或沒有快取) 才自動更新一次，否則沿用快取，可隨時手動按「執行批量掃描更新」
  const AUTO_REFRESH_MINUTES = 30;
  if (watchlistInput && watchlistInput.value.trim() && btnWatchlist) {
    const lastScan = Number(localStorage.getItem("lohas_watchlist_last_scan_ts")) || 0;
    const ageMin = (Date.now() - lastScan) / 60000;
    if (!scannedWatchlistCache.length || ageMin > AUTO_REFRESH_MINUTES) {
      setTimeout(() => btnWatchlist.click(), 500);
    }
  }
});

const WATCHLIST_CACHE_VERSION = "v14";

function loadWatchlistFromCache() {
  // 舊版程式存下的快取 (漲跌、PE、殖利率可能是錯的) 直接丟棄
  if (localStorage.getItem("lohas_watchlist_cache_version") !== WATCHLIST_CACHE_VERSION) {
    localStorage.removeItem("lohas_watchlist_cache_data");
    localStorage.removeItem("lohas_watchlist_cache_time");
    localStorage.setItem("lohas_watchlist_cache_version", WATCHLIST_CACHE_VERSION);
  }
  const cachedData = localStorage.getItem("lohas_watchlist_cache_data");
  const cachedTime = localStorage.getItem("lohas_watchlist_cache_time");

  if (cachedData && cachedTime) {
    try {
      scannedWatchlistCache = JSON.parse(cachedData);
      updateWatchlistDisplay();
      if (watchlistStatus) {
        watchlistStatus.textContent = `📁 上次暫存 (儲存於 ${cachedTime})`;
        watchlistStatus.style.color = "#64748b";
      }
    } catch (e) {
      console.error("讀取快取失敗", e);
    }
  }
}

function saveWatchlistCache() {
  const nowStr = new Date().toLocaleString("zh-TW", { 
    year: 'numeric', month: '2-digit', day: '2-digit', 
    hour: '2-digit', minute: '2-digit', hour12: false 
  });
  localStorage.setItem("lohas_watchlist_cache_data", JSON.stringify(scannedWatchlistCache));
  localStorage.setItem("lohas_watchlist_cache_time", nowStr);
}

function updateRemoveSelect() {
  if (!removeWatchlistSelect || !watchlistInput) return;
  const currentText = watchlistInput.value || "";
  const syms = currentText.split(",").map(s => s.trim().toUpperCase()).filter(Boolean);
  
  removeWatchlistSelect.innerHTML = "";
  if (syms.length === 0) {
    removeWatchlistSelect.add(new Option("📭 清單為空", ""));
    return;
  }
  
  syms.forEach(sym => {
    removeWatchlistSelect.add(new Option(sym, sym));
  });
}

// ------------------------------------------
// 6. 迴歸分析與樂活通道 (Band Channel / ATR) 計算
// ------------------------------------------

// 🔹 樂活通道關鍵：ATR (Average True Range) 計算
function calculateATR(data, period = 14) {
  if (!data || data.length === 0) return [];
  
  const tr = [];
  for (let i = 0; i < data.length; i++) {
    const high = data[i].high !== undefined ? data[i].high : data[i].close;
    const low = data[i].low !== undefined ? data[i].low : data[i].close;
    const prevClose = i > 0 ? data[i - 1].close : data[i].close;
    
    const trValue = Math.max(
      high - low,
      Math.abs(high - prevClose),
      Math.abs(low - prevClose)
    );
    tr.push(trValue);
  }

  const atr = new Array(data.length).fill(0);
  let sumTR = 0;
  for (let i = 0; i < data.length; i++) {
    sumTR += tr[i];
    if (i >= period) {
      sumTR -= tr[i - period];
      atr[i] = sumTR / period;
    } else {
      atr[i] = sumTR / (i + 1);
    }
  }
  return atr;
}

// 🔹 樂活通道關鍵：20SMA 中軌與上下軌 (20SMA ± 2 * ATR) 計算
function calculateBandChannel(data, smaPeriod = 20, atrPeriod = 14, multiplier = 2) {
  const atrValues = calculateATR(data, atrPeriod);
  
  return data.map((p, index) => {
    let sma20 = p.close;
    if (index >= smaPeriod - 1) {
      let sum = 0;
      for (let i = index - smaPeriod + 1; i <= index; i++) {
        sum += data[i].close;
      }
      sma20 = sum / smaPeriod;
    } else {
      let sum = 0;
      for (let i = 0; i <= index; i++) {
        sum += data[i].close;
      }
      sma20 = sum / (index + 1);
    }

    const currentATR = atrValues[index] || 0;
    return {
      bandMid: sma20,
      bandUpper: sma20 + multiplier * currentATR,
      bandLower: sma20 - multiplier * currentATR
    };
  });
}

function regression(values) {
  const n = values.length;
  let sumX = 0, sumY = 0;
  for (let i = 0; i < n; i++) {
    sumX += values[i].x;
    sumY += values[i].y;
  }
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

function buildAnalysis(data, currentMode = (modelMode ? modelMode.value : "linear"), currentYears = (periodYears ? periodYears.value : "3.5")) {
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

  const bandData = calculateBandChannel(points, 20, 14, 2);

  const fit = regression(points);
  // 近 20 個交易日平均成交量 (張，不含最後一筆即時資料)，供籌碼強弱判斷用
  const volWindow = filtered.slice(-21, -1).map(p => Number(p.volume) || 0).filter(v => v > 0);
  const avgVol = volWindow.length ? volWindow.reduce((a, b) => a + b, 0) / volWindow.length : 0;
  return points.map((p, idx) => {
    const midRaw = fit.intercept + fit.slope * p.x;
    const conv = (v) => useLog ? Math.exp(v) : v;
    return {
      ...p,
      plus2: conv(midRaw + fit.sd * 2),
      plus1: conv(midRaw + fit.sd),
      mid: conv(midRaw),
      minus1: conv(midRaw - fit.sd),
      minus2: conv(midRaw - fit.sd * 2),
      r2: fit.r2,
      slope: fit.slope,
      avgVol,
      // 疊加樂活通道指標
      bandMid: bandData[idx].bandMid,
      bandUpper: bandData[idx].bandUpper,
      bandLower: bandData[idx].bandLower
    };
  });
}

// ------------------------------------------
// 7. 圖表渲染
// ------------------------------------------
function renderChart(analysis) {
  if (!chart) return;
  const width = 1000, height = 500;
  const margin = { top: 35, right: 60, bottom: 45, left: 65 };
  const last = analysis[analysis.length - 1];
  
  const minP = Math.min(...analysis.map(p => Math.min(p.close, p.minus2, p.bandLower || p.close))) * 0.97;
  const maxP = Math.max(...analysis.map(p => Math.max(p.close, p.plus2, p.bandUpper || p.close))) * 1.03;
  
  const x = (i) => margin.left + (i / (analysis.length - 1)) * (width - margin.left - margin.right);
  const y = (val) => height - margin.bottom - ((val - minP) / (maxP - minP)) * (height - margin.top - margin.bottom);

  let yTicksHtml = "";
  for (let i = 0; i <= 4; i++) {
    const tickVal = minP + (i / 4) * (maxP - minP);
    const tickY = y(tickVal);
    yTicksHtml += `
      <line x1="${margin.left}" y1="${tickY}" x2="${width - margin.right}" y2="${tickY}" stroke="#e2e8f0" stroke-width="1" stroke-dasharray="4 4" />
      <text x="${margin.left - 10}" y="${tickY + 4}" fill="#64748b" font-size="12" text-anchor="end">${formatPrice(tickVal)}</text>
    `;
  }

  let xTicksHtml = "";
  const totalCount = analysis.length;
  const step = Math.floor(totalCount / 4);
  const indices = [0, step, step * 2, step * 3, totalCount - 1];
  
  indices.forEach(idx => {
    if (analysis[idx]) {
      const tickX = x(idx);
      const rawDate = analysis[idx].date;
      xTicksHtml += `
        <line x1="${tickX}" y1="${height - margin.bottom}" x2="${tickX}" y2="${height - margin.bottom + 6}" stroke="#94a3b8" stroke-width="1" />
        <text x="${tickX}" y="${height - margin.bottom + 22}" fill="#64748b" font-size="12" text-anchor="middle">${rawDate}</text>
      `;
    }
  });

  // 🔹 預設五線譜軌道
  const fiveLinesHtml = levelDefs.map(l => {
    const pointsStr = analysis.map((p, i) => `${x(i)},${y(p[l.key])}`).join(" ");
    return `<polyline points="${pointsStr}" fill="none" stroke="${l.color}" stroke-width="${l.key === 'mid' ? 2.5 : 1.2}" opacity="0.75" />`;
  }).join("");

  // 🔹 根據 Checkbox / Toggle 開關控制是否繪製樂活通道 (Band Channel)
  const isBandActive = isBandChannelActive();
  let bandChannelHtml = "";

  if (isBandActive) {
    const upperPointsStr = analysis.map((p, i) => `${x(i)},${y(p.bandUpper)}`).join(" ");
    const midPointsStr = analysis.map((p, i) => `${x(i)},${y(p.bandMid)}`).join(" ");
    const lowerPointsStr = analysis.map((p, i) => `${x(i)},${y(p.bandLower)}`).join(" ");

    bandChannelHtml = `
      <polyline points="${upperPointsStr}" fill="none" stroke="#e11d48" stroke-width="1.8" stroke-dasharray="4 2" opacity="0.95" />
      <polyline points="${midPointsStr}" fill="none" stroke="#d97706" stroke-width="2" stroke-dasharray="6 3" opacity="0.95" />
      <polyline points="${lowerPointsStr}" fill="none" stroke="#059669" stroke-width="1.8" stroke-dasharray="4 2" opacity="0.95" />
    `;
  }

  const closePointsStr = analysis.map((p, i) => `${x(i)},${y(p.close)}`).join(" ");

  chart.innerHTML = `
    <svg id="svgChart" viewBox="0 0 ${width} ${height}" style="background:#fff; border-radius:12px; width:100%; height:100%;">
      <line x1="${margin.left}" y1="${height - margin.bottom}" x2="${width - margin.right}" y2="${height - margin.bottom}" stroke="#94a3b8" stroke-width="1.5" />
      <line x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${height - margin.bottom}" stroke="#94a3b8" stroke-width="1.5" />
      ${yTicksHtml}
      ${xTicksHtml}
      ${fiveLinesHtml}
      ${bandChannelHtml}
      <polyline points="${closePointsStr}" fill="none" stroke="#0f172a" stroke-width="2.5" />
      ${(last.close >= last.plus2 || last.close <= last.minus2) ? `
        <circle cx="${x(totalCount - 1)}" cy="${y(last.close)}" r="10" fill="${last.close >= last.plus2 ? '#c94b4b' : '#12614a'}" opacity="0.4">
          <animate attributeName="r" from="6" to="18" dur="1.2s" repeatCount="indefinite"/>
          <animate attributeName="opacity" from="0.6" to="0" dur="1.2s" repeatCount="indefinite"/>
        </circle>
      ` : ""}
      <circle cx="${x(totalCount - 1)}" cy="${y(last.close)}" r="5" fill="#0f172a" />
      <line id="tooltipLine" x1="0" y1="${margin.top}" x2="0" y2="${height - margin.bottom}" stroke="#64748b" stroke-width="1" stroke-dasharray="3 3" style="display:none;" />
    </svg>
  `;

  const svg = document.querySelector("#svgChart");
  const tooltipLine = document.querySelector("#tooltipLine");
  const chartTooltip = document.querySelector("#chartTooltip");

  if (svg && tooltipLine && chartTooltip) {
    const handleMove = (e) => {
      const rect = svg.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const relativeX = ((clientX - rect.left) / rect.width) * width;
      
      if (relativeX >= margin.left && relativeX <= width - margin.right) {
        const dataWidth = width - margin.left - margin.right;
        const ratio = (relativeX - margin.left) / dataWidth;
        const index = Math.round(ratio * (totalCount - 1));
        
        if (analysis[index]) {
          const point = analysis[index];
          const currX = x(index);

          tooltipLine.setAttribute("x1", currX);
          tooltipLine.setAttribute("x2", currX);
          tooltipLine.style.display = "block";

          let tooltipLeft = currX + 15;
          if (tooltipLeft + 210 > width) tooltipLeft = currX - 225;
          
          const scaleX = rect.width / width;
          const scaleY = rect.height / height;

          chartTooltip.style.display = "block";
          chartTooltip.style.left = `${tooltipLeft * scaleX}px`;
          chartTooltip.style.top = `${15 * scaleY}px`;

          const pxNow = analysisLastRaw();
          const pRaw = point.raw_close || point.close;
          const histPe = (currentFundamentals.pe && pxNow) ? `${(pRaw / (pxNow / currentFundamentals.pe)).toFixed(1)}x` : "N/A";
          const histYield = (currentFundamentals.yield != null && pxNow) ? `${((pxNow * currentFundamentals.yield / 100) / pRaw * 100).toFixed(2)}%` : "N/A";

          chartTooltip.innerHTML = `
            <div class="title">${point.date}</div>
            <div><span>收盤價:</span><strong>${formatPrice(point.raw_close || point.close)}</strong></div>
            <div><span>本益比:</span><strong style="color:var(--blue);">${histPe}</strong></div>
            <div><span>估計殖利率:</span><strong style="color:var(--green);">${histYield}</strong></div>
            ${isBandActive ? `
              <div style="border-top:1px dashed rgba(255,255,255,0.2); margin-top:4px; padding-top:4px; color:#f43f5e;"><span>通道上軌:</span><span>${formatPrice(point.bandUpper)}</span></div>
              <div style="color:#f59e0b;"><span>20SMA中軌:</span><span>${formatPrice(point.bandMid)}</span></div>
              <div style="color:#10b981;"><span>通道下軌:</span><span>${formatPrice(point.bandLower)}</span></div>
            ` : ''}
            <div style="border-top:1px dashed rgba(255,255,255,0.15); margin-top:4px; padding-top:4px;"><span>+2SD 樂觀:</span><span>${formatPrice(point.plus2)}</span></div>
            <div><span>+1SD 偏樂:</span><span>${formatPrice(point.plus1)}</span></div>
            <div><span>中線:</span><span>${formatPrice(point.mid)}</span></div>
            <div><span>-1SD 偏悲:</span><span>${formatPrice(point.minus1)}</span></div>
            <div><span>-2SD 悲觀:</span><span>${formatPrice(point.minus2)}</span></div>
          `;
        }
      } else {
        hideTooltip();
      }
    };

    const hideTooltip = () => {
      tooltipLine.style.display = "none";
      chartTooltip.style.display = "none";
    };

    svg.addEventListener("mousemove", handleMove);
    svg.addEventListener("mouseleave", hideTooltip);
    svg.addEventListener("touchstart", handleMove, { passive: true });
    svg.addEventListener("touchmove", handleMove, { passive: true });
    svg.addEventListener("touchend", hideTooltip);
  }
}

function render() {
  try {
    if (!csvInput || !csvInput.value) return;
    const data = JSON.parse(csvInput.value);
    const analysis = buildAnalysis(data);
    const last = analysis[analysis.length - 1];
    
    const zoneStr = priceZone(last);
    if (zoneText) {
      zoneText.textContent = zoneStr;
      zoneText.style.color = (last.close >= last.plus2) ? "#c94b4b" : (last.close <= last.minus2 ? "#12614a" : "var(--ink)");
      
      const nearest = getNearestLevel(last);
      const nearestText = formatNearestText(nearest);
      const nearestEl = document.querySelector("#nearestText");
      if (nearestEl) {
        nearestEl.textContent = nearestText;
        nearestEl.style.color = nearest.diff >= 0 ? "#c94b4b" : "#1f8a63";
      }
    }
    if (closeText) closeText.textContent = formatPrice(last.raw_close || last.close);
    if (r2Text) r2Text.textContent = last.r2.toFixed(3);
    if (rangeText) rangeText.textContent = getPriceRangeDesc(last);
    
    if (peText) peText.textContent = Number.isFinite(currentFundamentals.pe) ? `${currentFundamentals.pe.toFixed(1)} 倍` : "N/A";
    if (yieldText) yieldText.textContent = fmtYield(currentFundamentals.yield);

    updateAdvicePanel(last, symbolInput ? symbolInput.value.trim() : "", currentMainChipData);
    renderChart(analysis);

    if (levelsTable) {
      levelsTable.innerHTML = levelDefs.map(l => `<tr><td>${l.label}</td><td>${formatPrice(last[l.key])}</td><td>${priceZone(last) === l.label ? "●" : ""}</td></tr>`).join("");
    }
  } catch (e) {
    console.error("渲染出錯：", e);
  }
}

// ------------------------------------------
// 8. API 資料抓取 (Chip & Yahoo)
// ------------------------------------------
async function loadMainChipData(symbol) {
  const chipEl = document.querySelector("#chipText");
  if (!chipEl) return;

  chipEl.innerHTML = `<span style="color:var(--muted); font-size:0.85em;">🔍 正在讀取三大法人籌碼...</span>`;
  currentMainChipData = null;

  try {
    const res = await fetch(`/api/chip?symbol=${encodeURIComponent(symbol)}`);
    if (!res.ok) throw new Error("API 響應異常");
    
    const chip = await res.json();
    if (!chip || chip.error) {
      chipEl.innerHTML = `<span style="color:var(--muted); font-size:0.85em;">尚無今日盤後籌碼資料或非台股標的</span>`;
      render();
      return;
    }

    currentMainChipData = chip;

    const fmtDiff = (num) => {
      const color = num > 0 ? "#c94b4b" : (num < 0 ? "#1f8a63" : "inherit");
      const sign = num > 0 ? "+" : "";
      return `<strong style="color:${color};">${sign}${(num || 0).toLocaleString()}</strong>`;
    };
    const fmtVal = (num) => (num || 0).toLocaleString();

    const fBuy = chip.foreign_buy || 0;
    const fSell = chip.foreign_sell || 0;
    const tBuy = chip.trust_buy || 0;
    const tSell = chip.trust_sell || 0;
    const dBuy = chip.dealer_buy || 0;
    const dSell = chip.dealer_sell || 0;

    const foreignTip = (fBuy || fSell) ? `<span class="tooltiptext">買進 ${fmtVal(fBuy)} | 賣出 ${fmtVal(fSell)}</span>` : "";
    const trustTip = (tBuy || tSell) ? `<span class="tooltiptext">買進 ${fmtVal(tBuy)} | 賣出 ${fmtVal(tSell)}</span>` : "";
    const dealerTip = (dBuy || dSell) ? `<span class="tooltiptext">買進 ${fmtVal(dBuy)} | 賣出 ${fmtVal(dSell)}</span>` : "";

    chipEl.innerHTML = `
      (${chip.date}) : 
      <span class="chip-item">外資 ${fmtDiff(chip.foreign)} 張${foreignTip}</span> | 
      <span class="chip-item">投信 ${fmtDiff(chip.trust)} 張${trustTip}</span> | 
      <span class="chip-item">自營 ${fmtDiff(chip.dealer)} 張${dealerTip}</span> | 
      合計 ${fmtDiff(chip.total)} 張
    `;

    render();
  } catch (e) {
    chipEl.innerHTML = `<span style="color:var(--muted); font-size:0.85em;">籌碼讀取失敗</span>`;
    render();
  }
}

async function fetchLevelForWatchlist(symbol) {
  let finalSym = symbol.trim().toUpperCase();
  if (!finalSym.includes(".") && /^\d+$/.test(finalSym)) finalSym += ".TW";
  
  const cleanCode = finalSym.replace(".TW", "").replace(".TWO", "");
  const mkt = finalSym.includes(".TWO") ? "two" : (finalSym.includes(".TW") ? "tw" : "us");
  const p = new URLSearchParams({ symbol: cleanCode, market: mkt, years: "3.5" });

  const [yahooRes, chipRes] = await Promise.allSettled([
    fetch(`/api/yahoo?${p.toString()}`).then(r => r.ok ? r.json() : Promise.reject(r)),
    fetch(`/api/chip?symbol=${encodeURIComponent(cleanCode)}`).then(r => r.ok ? r.json() : null)
  ]);

  if (yahooRes.status !== "fulfilled") {
    throw new Error(`股價抓取失敗: ${symbol}`);
  }

  const json = yahooRes.value;
  const chipData = chipRes.status === "fulfilled" ? chipRes.value : null;
  const analysis = buildAnalysis(json.rows, "linear", "3.5");

  // 以最新交易日價格對比前一交易日收盤價，計算當日漲跌
  const latest = analysis[analysis.length - 1];
  const previous = analysis.length > 1 ? analysis[analysis.length - 2] : null;
  const currentPrice = Number(latest.raw_close || latest.close);
  // 優先使用 Yahoo 回傳的前一交易日收盤價，避免歷史序列/還原價造成誤差
  const yahooPreviousClose = Number(json.previous_close);
  const previousPrice = Number.isFinite(yahooPreviousClose) && yahooPreviousClose > 0
    ? yahooPreviousClose
    : (previous ? Number(previous.raw_close || previous.close) : null);
  const change = previousPrice > 0 ? currentPrice - previousPrice : null;
  const changePct = previousPrice > 0 ? (change / previousPrice) * 100 : null;

  return {
    sym: json.symbol,
    last: latest,
    change,
    changePct,
    name: json.name || getStockName(json.symbol) || "",
    chip: chipData,
    fundamentals: json.fundamentals || { pe: null, yield: null },
    prevClose: previousPrice,
    prevSource: json.prev_source || "(舊版server)",
    serverVersion: json.server_version || "舊版"
  };
}

// ------------------------------------------
// 9. 觀察清單邏輯
// ------------------------------------------
async function fetchInBatches(symbols, batchSize = 5) {
  const results = [];
  for (let i = 0; i < symbols.length; i += batchSize) {
    const batch = symbols.slice(i, i + batchSize);
    const batchResults = await Promise.allSettled(batch.map(sym => fetchLevelForWatchlist(sym)));
    results.push(...batchResults);
  }
  return results;
}

function updateWatchlistDisplay() {
  if (!watchlistResult) return;
  if (!scannedWatchlistCache || scannedWatchlistCache.length === 0) {
    watchlistResult.innerHTML = `<div style="color:var(--muted); font-size:0.85rem; padding:12px; text-align:center;">目前無觀察清單資料</div>`;
    return;
  }

  const searchQuery = watchlistSearch ? watchlistSearch.value.trim().toLowerCase() : "";
  const filterZone = watchlistFilterZone ? watchlistFilterZone.value : "all";
  const sortMode = watchlistSort ? watchlistSort.value : "code";

  let resultList = scannedWatchlistCache.filter(item => {
    const dictName = getStockName(item.sym);
    const apiName = item.name || "";
    
    const matchSearch = item.sym.toLowerCase().includes(searchQuery) || 
                        dictName.toLowerCase().includes(searchQuery) ||
                        apiName.toLowerCase().includes(searchQuery);
    
    const zone = priceZone(item.last);
    let matchZone = true;
    if (filterZone === "cheap") {
      matchZone = (zone === "悲觀區下緣" || zone === "相對悲觀區" || zone === "中線以下");
    } else if (filterZone === "expensive") {
      matchZone = (zone === "樂觀區上緣" || zone === "相對樂觀區" || zone === "中線以上");
    }

    return matchSearch && matchZone;
  });

  resultList.sort((a, b) => {
    if (sortMode === "code") return a.sym.localeCompare(b.sym);
    if (sortMode === "rankAsc") return getZoneWeight(priceZone(a.last)) - getZoneWeight(priceZone(b.last));
    if (sortMode === "rankDesc") return getZoneWeight(priceZone(b.last)) - getZoneWeight(priceZone(a.last));
    if (sortMode === "nearAsc") return getNearestDistance(a.last) - getNearestDistance(b.last);
    if (sortMode === "nearDesc") return getNearestDistance(b.last) - getNearestDistance(a.last);
    return 0;
  });

  watchlistResult.innerHTML = "";
  if (resultList.length === 0) {
    watchlistResult.innerHTML = `<div style="color:var(--muted); font-size:0.85rem; padding:12px; text-align:center;">無符合篩選條件的標的</div>`;
    return;
  }

  const fragment = document.createDocumentFragment();

  resultList.forEach(item => {
    const isSellSignal = item.last.close >= item.last.plus2; 
    const isBuySignal = item.last.close <= item.last.minus2; 

    const card = document.createElement("div");
    card.className = "watchlist-item";
    card.style.cursor = "pointer";

    if (isBuySignal) {
      card.style.backgroundColor = "#e8f5e9";
      card.style.border = "1px solid #a5d6a7";
      card.style.borderLeft = "6px solid #12614a";
    } else if (isSellSignal) {
      card.style.backgroundColor = "#ffebee";
      card.style.border = "1px solid #ffcdd2";
      card.style.borderLeft = "6px solid #c94b4b";
    } else {
      card.style.borderLeft = "6px solid #2c6ebd";
    }

    const zoneColor = isSellSignal ? '#c94b4b' : (isBuySignal ? '#12614a' : '#2c6ebd');
    const smallTextColor = (isBuySignal || isSellSignal) ? '#333333' : '#666666';

    const peDisp = fmtPe(item.fundamentals && item.fundamentals.pe);
    const yieldDisp = fmtYield(item.fundamentals && item.fundamentals.yield, 2);

    let chipSummary = '<span style="color:#94a3b8;">無籌碼資料</span>';
    if (isEtfSymbol(item.sym)) {
      chipSummary = '<span style="color:#94a3b8;">法人籌碼：ETF 不計入判斷</span>';
    } else if (item.chip && !item.chip.error) {
      const cs = assessChip(item.last, item.sym, item.chip);
      const colorOf = (v) => v > 0 ? "#c94b4b" : (v < 0 ? "#1f8a63" : "inherit");
      const signOf = (v) => v > 0 ? "+" : "";
      if (Number.isFinite(cs.net)) {
        chipSummary = `${cs.label}: <strong style="color:${colorOf(cs.net)}">${signOf(cs.net)}${cs.net.toLocaleString()} 張</strong>`;
        const todayTotal = item.chip.total;
        if (Number.isFinite(todayTotal) && Number.isFinite(item.chip.total5)) {
          chipSummary += ` <span style="color:#94a3b8; font-size:0.9em;">(今日三大法人 ${signOf(todayTotal)}${todayTotal.toLocaleString()})</span>`;
        }
      }
    }

    const nearest = getNearestLevel(item.last);
    const nearestHint = formatNearestText(nearest);
    const displayName = item.name || getStockName(item.sym) || "";
    const badge = getActionBadge(item);

    const priceChange = Number.isFinite(item.change) && Number.isFinite(item.changePct);
    const changeColor = !priceChange || item.change === 0 ? "#667085" : (item.change > 0 ? "#c94b4b" : "#1f8a63");
    const changeArrow = !priceChange || item.change === 0 ? "－" : (item.change > 0 ? "▲" : "▼");
    const changeText = priceChange
      ? `${changeArrow} ${item.change > 0 ? "+" : ""}${item.change.toFixed(2)} (${item.changePct > 0 ? "+" : ""}${item.changePct.toFixed(2)}%)`
      : "漲跌幅：資料不足";

    card.innerHTML = `
      <div>
        <strong>${item.sym}</strong>${displayName ? `<span style="color:#555; font-size:0.85em; margin-left:6px; font-weight:600;">${displayName}</span>` : ""}<br>
        <small style="color:${smallTextColor}; display: block; margin-top: 4px; line-height: 1.5;">
          <span style="white-space: nowrap;">現價: ${formatPrice(item.last.raw_close || item.last.close)}</span>
          <span style="white-space: nowrap;">(還原: ${formatPrice(item.last.close)})</span>
          <br>
          <span style="white-space: nowrap; color:${changeColor}; font-weight:900;">${changeText}</span>
          <br>
          <span style="display:inline-block; white-space: nowrap; margin-right: 14px;">PE: ${peDisp}</span><span style="display:inline-block; white-space: nowrap;">殖利率: ${yieldDisp}</span>
          <br>
          <span style="white-space: nowrap;">${chipSummary}</span>
        </small>
      </div>
      <div style="text-align:right;">
        <div style="display: flex; align-items: center; justify-content: flex-end; gap: 6px; margin-bottom: 2px;">
          <span style="font-size: 0.72rem; font-weight: bold; padding: 2px 8px; border-radius: 12px; ${badge.style}">
            ${badge.text}
          </span>
          <span style="font-weight:900; color:${zoneColor}">${priceZone(item.last)}</span>
        </div>
        <small style="color:${smallTextColor}">區間: ${getPriceRangeDesc(item.last)}</small>
        <br>
        <small style="color:var(--blue); font-weight:bold; font-size: 0.78rem;">📌 ${nearestHint}</small>
      </div>
    `;

    card.addEventListener("click", () => {
      let rawSym = item.sym.toUpperCase();
      let mktVal = "us";
      
      if (rawSym.includes(".TWO")) {
        mktVal = "two";
        rawSym = rawSym.replace(".TWO", "");
      } else if (rawSym.includes(".TW")) {
        mktVal = "tw";
        rawSym = rawSym.replace(".TW", "");
      }
      
      if (symbolInput) symbolInput.value = rawSym;
      if (market) market.value = mktVal;
      if (fetchSymbolBtn) fetchSymbolBtn.click();
    });

    fragment.appendChild(card);
  });

  watchlistResult.appendChild(fragment);
}

// ------------------------------------------
// 10. 事件綁定統一管理
// ------------------------------------------
function bindEvents() {
  // 🔹 綁定 Checkbox / Toggle 切換事件 (相容 #toggleBand 與 #showChannelCheckbox)
  const handleBandToggle = () => render();

  if (showChannelCheckbox) {
    showChannelCheckbox.addEventListener("change", handleBandToggle);
  }
  if (toggleBand) {
    toggleBand.addEventListener("change", handleBandToggle);
    toggleBand.addEventListener("click", handleBandToggle);
  }

  if (periodYears) periodYears.addEventListener("change", render);
  if (modelMode) modelMode.addEventListener("change", render);

  if (btnWatchlist) {
    btnWatchlist.addEventListener("click", async () => {
      const rawInput = watchlistInput.value;
      localStorage.setItem("lohas_watchlist", rawInput);

      const syms = rawInput
        .split(",")
        .map(s => s.trim().toUpperCase())
        .filter(Boolean)
        .slice(0, MAX_WATCHLIST_LIMIT);

      if (syms.length === 0) {
        watchlistStatus.textContent = "⚠️ 請輸入有效的股票代碼！";
        watchlistStatus.style.color = "var(--red, #c94b4b)";
        return;
      }

      watchlistResult.innerHTML = "";
      scannedWatchlistCache = [];
      btnWatchlist.disabled = true;

      watchlistStatus.textContent = `🔄 正在批量更新 ${syms.length} 支股票（分批讀取中）...`;
      watchlistStatus.style.color = "var(--blue)";

      try {
        const results = await fetchInBatches(syms, 5);
        let successCount = 0;
        let failCount = 0;

        results.forEach((result, index) => {
          if (result.status === "fulfilled") {
            scannedWatchlistCache.push(result.value);
            successCount++;
          } else {
            failCount++;
            console.error(`❌ 股票 ${syms[index]} 抓取失敗:`, result.reason);
          }
        });

        updateWatchlistDisplay();
        saveWatchlistCache();
        if (successCount > 0) localStorage.setItem("lohas_watchlist_last_scan_ts", String(Date.now()));

        if (failCount === 0) {
          watchlistStatus.textContent = `✅ 更新完成 (共 ${successCount} 檔)`;
          watchlistStatus.style.color = "var(--blue)";
        } else {
          watchlistStatus.textContent = `⚠️ 更新完成：成功 ${successCount} 檔，失敗 ${failCount} 檔`;
          watchlistStatus.style.color = "#d9852b";
        }
      } catch (err) {
        console.error("批量更新過程發生未預期錯誤:", err);
        watchlistStatus.textContent = "❌ 批量更新失敗，請檢查網路或 API 狀態。";
        watchlistStatus.style.color = "var(--red, #c94b4b)";
      } finally {
        btnWatchlist.disabled = false;
      }
    });
  }

  if (fetchSymbolBtn) {
    fetchSymbolBtn.addEventListener("click", async () => {
      if (fetchStatus) fetchStatus.textContent = "讀取中...";
      let inputVal = symbolInput.value.trim().toUpperCase();
      let selectedMarket = market.value;

      try {
        const p = new URLSearchParams({ 
          symbol: inputVal, 
          market: selectedMarket, 
          years: periodYears ? periodYears.value : "3.5" 
        });
        
        const res = await fetch(`/api/yahoo?${p.toString()}`);
        if (!res.ok) throw new Error();
        const json = await res.json();
        currentFundamentals = json.fundamentals || { pe: null, yield: null };
        if (csvInput) csvInput.value = JSON.stringify(json.rows);
        
        if (chartTitle) {
          chartTitle.textContent = formatSymbolDisplay(json.symbol, json.name);
        }
        
        if (btnAddToWatchlist) {
          btnAddToWatchlist.style.display = "inline-block";
        }

        loadMainChipData(inputVal);

        if (fetchStatus) fetchStatus.textContent = "成功";
        localStorage.setItem("lohas_last_symbol", inputVal);
        localStorage.setItem("lohas_last_market", selectedMarket);
      } catch (err) { 
        if (fetchStatus) fetchStatus.textContent = "失敗"; 
        console.error("Fetch 錯誤資訊:", err);
      }
    });
  }

  if (btnAddToWatchlist) {
    btnAddToWatchlist.addEventListener("click", async () => {
      const rawSym = symbolInput.value.trim().toUpperCase();
      if (!rawSym) return alert("⚠️ 請先輸入股票代碼！");

      const currentText = watchlistInput.value || "";
      const syms = currentText.split(",").map(s => s.trim().toUpperCase()).filter(Boolean);

      if (syms.includes(rawSym)) return alert(`⚠️ 股號 ${rawSym} 已在觀察清單中！`);
      if (syms.length >= MAX_WATCHLIST_LIMIT) return alert(`⚠️ 觀察清單最多只能 ${MAX_WATCHLIST_LIMIT} 支股票！`);

      syms.push(rawSym);
      watchlistInput.value = syms.join(", ");
      localStorage.setItem("lohas_watchlist", watchlistInput.value);

      updateRemoveSelect();
      
      try {
        const data = await fetchLevelForWatchlist(rawSym);
        scannedWatchlistCache = scannedWatchlistCache.filter(item => {
          const symClean = item.sym.replace(".TW", "").replace(".TWO", "").toUpperCase();
          return symClean !== rawSym;
        });
        scannedWatchlistCache.push(data);
        updateWatchlistDisplay();
        saveWatchlistCache();
        alert(`✅ 已成功將 ${rawSym} 加入觀察清單！`);
      } catch (err) {
        alert(`✅ 已將 ${rawSym} 加入清單，請至下方點擊「執行批量掃描更新」。`);
      }
    });
  }

  if (btnAddWatchlistSingle) {
    btnAddWatchlistSingle.addEventListener("click", async () => {
      const newSym = addWatchlistInput.value.trim().toUpperCase();
      if (!newSym) return;
      
      const currentText = watchlistInput.value || "";
      const syms = currentText.split(",").map(s => s.trim().toUpperCase()).filter(Boolean);
      
      if (syms.includes(newSym)) {
        if (watchlistStatus) watchlistStatus.textContent = `⚠️ 股號 ${newSym} 已在清單中！`;
        return;
      }
      
      if (syms.length >= MAX_WATCHLIST_LIMIT) {
        if (watchlistStatus) watchlistStatus.textContent = `⚠️ 監控清單最多只能 ${MAX_WATCHLIST_LIMIT} 支股票喔！`;
        return;
      }
      
      syms.push(newSym);
      watchlistInput.value = syms.join(", ");
      localStorage.setItem("lohas_watchlist", watchlistInput.value);
      addWatchlistInput.value = "";
      
      updateRemoveSelect();
      if (watchlistStatus) watchlistStatus.textContent = `➕ 正在即時新增並計算 ${newSym}...`;
      
      try {
        const data = await fetchLevelForWatchlist(newSym);
        scannedWatchlistCache = scannedWatchlistCache.filter(item => {
          const symClean = item.sym.replace(".TW", "").replace(".TWO", "").toUpperCase();
          return symClean !== newSym;
        });
        scannedWatchlistCache.push(data);
        updateWatchlistDisplay();
        
        saveWatchlistCache();
        if (watchlistStatus) {
          watchlistStatus.textContent = `✅ 已成功新增 ${newSym}！`;
          watchlistStatus.style.color = "var(--blue)";
        }
      } catch (err) {
        if (watchlistStatus) watchlistStatus.textContent = `❌ 即時新增 ${newSym} 失敗，請點擊「執行批量更新」。`;
      }
    });
  }

  if (btnRemoveWatchlistSingle) {
    btnRemoveWatchlistSingle.addEventListener("click", () => {
      const toRemove = removeWatchlistSelect.value;
      if (!toRemove || toRemove === "📭 清單為空") return;
      
      const currentText = watchlistInput.value || "";
      const syms = currentText.split(",").map(s => s.trim().toUpperCase()).filter(Boolean);
      
      const filtered = syms.filter(s => s !== toRemove);
      watchlistInput.value = filtered.join(", ");
      localStorage.setItem("lohas_watchlist", filtered.join(", "));
      
      updateRemoveSelect();
      if (watchlistStatus) {
        watchlistStatus.textContent = `➖ 已刪除 ${toRemove}`;
        watchlistStatus.style.color = "var(--blue)";
      }
      
      scannedWatchlistCache = scannedWatchlistCache.filter(item => {
        const symClean = item.sym.replace(".TW", "").replace(".TWO", "").toUpperCase();
        return symClean !== toRemove;
      });
      updateWatchlistDisplay();
      saveWatchlistCache();
    });
  }

  if (btnClearWatchlist) {
    btnClearWatchlist.addEventListener("click", () => {
      if (btnClearWatchlist.textContent.includes("全部清除")) {
        deletedWatchlistBackup = watchlistInput.value;
        watchlistInput.value = "";
        localStorage.removeItem("lohas_watchlist");
        localStorage.removeItem("lohas_watchlist_cache_data");
        localStorage.removeItem("lohas_watchlist_cache_time");
        watchlistResult.innerHTML = "";
        scannedWatchlistCache = [];
        if (watchlistStatus) {
          watchlistStatus.textContent = "🧹 已暫時清除，可點擊按鈕復原";
          watchlistStatus.style.color = "var(--blue)";
        }
        
        btnClearWatchlist.textContent = "↩️ 復原清除清單";
        btnClearWatchlist.style.backgroundColor = "#d9852b"; 

        if (watchlistSort) watchlistSort.value = "rankDesc";
      } else {
        if (deletedWatchlistBackup) {
          watchlistInput.value = deletedWatchlistBackup;
          localStorage.setItem("lohas_watchlist", deletedWatchlistBackup);
          if (watchlistStatus) watchlistStatus.textContent = "↩️ 已成功復原清單！";
        }
        btnClearWatchlist.textContent = "🧹 全部清除";
        btnClearWatchlist.style.backgroundColor = "#667085";
      }
      updateRemoveSelect();
    });
  }

  if (btnExportWatchlist) {
    btnExportWatchlist.addEventListener("click", (e) => {
      e.preventDefault();
      const currentText = watchlistInput.value.trim();
      if (!currentText) {
        if (watchlistStatus) watchlistStatus.textContent = "⚠️ 目前清單是空的，無法複製喔！";
        return;
      }
      
      navigator.clipboard?.writeText(currentText)
        .then(() => {
          if (watchlistStatus) watchlistStatus.textContent = "📋 清單已自動複製到剪貼簿！可傳送至手機/其他裝置匯入。";
        })
        .catch(() => {
          watchlistInput.select();
          document.execCommand("copy");
          if (watchlistStatus) watchlistStatus.textContent = "📋 清單已複製到剪貼簿！";
        });
    });
  }

  if (btnImportWatchlist) {
    btnImportWatchlist.addEventListener("click", (e) => {
      e.preventDefault();
      const userInput = prompt("請貼上您要匯入的股票代號（例如: 2330, 2317, 2454）：");
      if (userInput === null) return;
      
      const existingSyms = (watchlistInput.value || "").split(",").map(s => s.trim().toUpperCase()).filter(Boolean);
      const importedSyms = userInput.split(",").map(s => s.trim().toUpperCase()).filter(Boolean);

      if (importedSyms.length === 0) return alert("⚠️ 輸入內容無有效股票代碼！");

      const mergedList = Array.from(new Set([...existingSyms, ...importedSyms]));

      if (mergedList.length > MAX_WATCHLIST_LIMIT) {
        alert(`⚠️ 合併後數量超過 ${MAX_WATCHLIST_LIMIT} 支上限，將自動截取保留前 ${MAX_WATCHLIST_LIMIT} 支股票。`);
        mergedList.length = MAX_WATCHLIST_LIMIT;
      }

      watchlistInput.value = mergedList.join(", ");
      localStorage.setItem("lohas_watchlist", watchlistInput.value);

      updateRemoveSelect();

      const addedCount = mergedList.length - existingSyms.length;
      if (watchlistStatus) {
        watchlistStatus.textContent = `📥 併集合併完成！共 ${mergedList.length} 檔 (新增 ${addedCount > 0 ? addedCount : 0} 檔)。請點擊「執行批量掃描更新」。`;
        watchlistStatus.style.color = "var(--blue)";
      }
      
      alert(`✅ 清單併集合併成功！\n原清單: ${existingSyms.length} 支\n新增: ${addedCount > 0 ? addedCount : 0} 支\n合併後總計: ${mergedList.length} 支股票。\n\n請點擊「執行批量掃描更新」以載入最新數據。`);
    });
  }
}