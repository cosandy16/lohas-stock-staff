// --- 台股名稱對照表 ---
const TW_STOCK_NAMES = {
  "1101":"台泥","1102":"亞泥","1216":"統一","1301":"台塑","1303":"南亞","1326":"台化",
  "1402":"遠東新","1476":"儒鴻","1504":"東元","1590":"亞德客","1605":"華新",
  "2002":"中鋼","2006":"東和鋼鐵","2015":"豐興","2049":"上銀","2059":"川湖",
  "2101":"南港","2105":"正新","2207":"和泰車","2227":"裕日車","2231":"為升",
  "2301":"光寶科","2303":"聯電","2308":"台達電","2312":"金寶","2317":"鴻海",
  "2324":"仁寶","2327":"國巨","2330":"台積電","2337":"旺宏","2344":"華邦電",
  "2347":"聯強","2352":"佳世達","2353":"宏碁","2354":"鴻準","2356":"英業達",
  "2357":"華碩","2358":"廷鑫","2360":"致茂","2363":"矽統","2371":"大同",
  "2376":"技嘉","2377":"微星","2379":"瑞昱","2382":"廣達","2383":"台光電",
  "2385":"群光","2388":"威盛","2392":"正崴","2393":"億光","2395":"研華",
  "2397":"友通","2399":"映泰","2401":"凌陽","2404":"漢唐","2408":"南亞科",
  "2409":"友達","2412":"中華電","2414":"精技","2420":"新日興","2423":"固緯",
  "2426":"鑫創","2429":"銘異","2430":"燦坤","2439":"美律","2441":"超豐",
  "2449":"京元電","2454":"聯發科","2458":"義隆","2474":"可成","2475":"矽創",
  "2481":"強茂","2489":"瑞軒","2492":"華新科","2496":"卓越","2498":"宏達電",
  "2501":"國建","2502":"長谷","2542":"興富發","2545":"皇翔","2548":"華固",
  "2601":"益航","2603":"長榮","2606":"裕民","2609":"陽明","2610":"華航",
  "2615":"萬海","2618":"長榮航","2707":"晶華","2727":"王品","2809":"京城銀",
  "2812":"台中銀","2820":"華泰銀","2834":"臺企銀","2836":"安泰銀","2838":"聯邦銀",
  "2845":"遠東銀","2849":"安泰金","2850":"新產","2851":"中再保","2852":"第一保",
  "2880":"華南金","2881":"富邦金","2882":"國泰金","2883":"開發金","2884":"玉山金",
  "2885":"元大金","2886":"兆豐金","2887":"台新金","2888":"新光金","2889":"國票金",
  "2890":"永豐金","2891":"中信金","2892":"第一金","2912":"統一超","3008":"大立光",
  "3014":"聯陽","3017":"奇鋐","3019":"亞泰","3022":"威剛","3034":"聯詠",
  "3035":"智原","3037":"欣興","3041":"揚智","3042":"晶技","3044":"健鼎",
  "3045":"台灣大","3046":"建碁","3047":"訊舟","3051":"力特","3052":"夆典",
  "3054":"立積","3057":"喬鼎","3058":"立誠","3059":"鴻鈞","3085":"比比昂",
  "3086":"華義","3088":"艾雷斯","3094":"聯傑","3105":"穩懋","3106":"楊博",
  "3130":"一零四","3149":"正達","3150":"萬達通","3189":"景碩","3231":"緯創",
  "3234":"光環","3293":"鈊象","3294":"英濟","3406":"玉晶光","3443":"創意",
  "3481":"群創","3504":"揚明光","3529":"力旺","3533":"嘉澤","3545":"旭隼",
  "3673":"TPK","3682":"亞太電","3689":"湧德","3698":"隆達","3702":"大聯大",
  "3706":"神達","3711":"日月光投控","3714":"富采","3715":"定穎投控","3726":"皇電",
  "3760":"泓格","3762":"鑫龍騰","3769":"楠梓電","3776":"長科","4104":"佳醫",
  "4108":"懷特","4137":"麗豐-KY","4147":"中裕","4148":"全宇生技","4164":"基亞",
  "4174":"浩鼎","4180":"嘉進","4183":"福永興","4205":"中華食","4303":"信昌電",
  "4438":"廣越","4509":"恒耀","4551":"智崴","4966":"譜瑞-KY","5007":"三星",
  "5009":"榮剛","5014":"中連貨","5015":"華祺","5016":"鑠禧","5212":"凌網",
  "5215":"科定","5234":"達興材料","5288":"豐藝","5347":"世界","5349":"先豐",
  "5371":"中光電","5381":"合正","5388":"中磊","5398":"拓墣","5434":"崇越電",
  "5522":"遠雄","5533":"皇昌","5536":"聖暉","5538":"東明","5546":"永信建",
  "5608":"四維航","5871":"中租-KY","5876":"上海商銀","5880":"合庫金",
  "6005":"群益證","6024":"群益期","6025":"星展(台灣)","6030":"第一金",
  "6104":"創惟","6112":"聚碩","6116":"彩晶","6121":"新普","6133":"金橋",
  "6153":"嘉聯益","6196":"帆宣","6197":"佳必琪","6201":"亞弘電","6202":"盛群",
  "6204":"艾訊","6208":"日揚","6215":"和椿","6216":"居易","6220":"岱稜",
  "6225":"旺矽","6230":"超眾","6239":"力成","6243":"迅杰","6257":"矽瑪",
  "6261":"久元","6262":"倚天酷碁","6269":"台郡","6271":"同欣電","6274":"台燿",
  "6278":"台表科","6279":"胡連","6281":"全國電","6282":"康舒","6285":"啟碁",
  "6289":"華碩-KY","6290":"良維","6291":"沛亨","6294":"智晶","6295":"捷力",
  "6306":"崇越","6344":"萬年達","6347":"聖泰","6349":"科誠","6350":"亞翔",
  "6351":"驊訊","6355":"信紘科","6356":"奇美材","6361":"必翔","6409":"旭隼",
  "6414":"樺漢","6415":"矽力-KY","6416":"瑞祺電通","6417":"易華電","6418":"新峰",
  "6431":"光鋐","6432":"今展科","6442":"光聖","6449":"鈞寶","6456":"GIS-KY",
  "6469":"諸羅山生技","6477":"宇辰","6488":"環球晶","6505":"台塑化","6510":"精測",
  "6515":"穎崴","6516":"勤誠","6533":"晶心科","6547":"晶電","6560":"聚量",
  "6579":"研揚","6582":"申豐","6592":"和潤企業","6598":"科萊恩","6601":"台達化",
  "6605":"帝寶","6609":"唐鋒","6612":"奈米醫材","6616":"特昇-KY","6618":"台康生技",
  "6625":"必應","6649":"晶宏","6657":"江波龍-KY","6669":"緯穎","6679":"台嘉碩",
  "6690":"安格生醫","6691":"洋基工程","6701":"AES-KY","6702":"柏翔","6703":"軒和",
  "6706":"惠特","6707":"安集","6711":"集盛","6712":"科誠","6714":"安格",
  "6715":"和泰興業","6719":"力旺","6720":"品安","6721":"馥鋼","6722":"ST-KY",
  "6723":"安碁","6724":"赤科","6726":"泰誠","6727":"群聯","6728":"磊晶",
  "6730":"瑭冠","6732":"玄裕航太","6743":"安碁資訊","6770":"力積電",
  "8046":"南電","8048":"德勝","8049":"中保科","8050":"廣積","8052":"富崴",
  "8054":"安國","8056":"建榮","8059":"勁毅","8060":"華景電","8069":"元太",
  "8070":"長華","8072":"陞泰","8085":"福德","8086":"宏捷科","8088":"品安",
  "8089":"麥士","8090":"鉅祥","8091":"網龍","8092":"建準","8093":"原相",
  "8096":"擎亞","8098":"畜電","8099":"清宇","8104":"錸德","8105":"凌巨",
  "8110":"華東","8112":"至上","8113":"東森","8114":"振曜","8115":"新龍","8121":"越峰",
  "8131":"福懋科","8133":"千附","8138":"聖農發展","8139":"中酒","8141":"愛普",
  "8147":"正淩","8150":"南茂","8163":"達方","8164":"創潤","8165":"天鈺",
  "8168":"瀚荃","8171":"彩益","8173":"鉅邦","8176":"源輝","8183":"精碳",
  "8210":"勁億","8215":"明基材","8222":"寶一","8299":"群聯","8341":"日友",
  "8342":"振泰","8346":"超修","8349":"恩德","8383":"千奇","8404":"百威","8409":"商之器",
  "8410":"森崴能源","8411":"福大","8414":"富采","8416":"實威","8419":"裕融",
  "8422":"可寧衛","8423":"超豐","8424":"正修","8425":"摩天嶺","8426":"紅火",
  "8427":"飛捷","8431":"匯鑽科","8432":"保瑞","8436":"大江","8437":"大學光",
  "8438":"昆盈","8439":"台技電","8440":"富宇","8441":"威宏-KY","8442":"喬福",
  "8443":"優群","8444":"富邦媒","8445":"紅陽","8446":"華研","8447":"華美",
  "8448":"遠傳","8449":"晶采","8450":"霖宏","8451":"昇旺","8452":"台鋼",
  "9904":"寶成","9907":"統一實","9910":"豐泰","9917":"中保科","9921":"巨大",
  "9933":"中鼎","9934":"成霖","9935":"慶豐富","9937":"全國瓦斯","9938":"百和",
  "9939":"宏全","9940":"信義房屋","9941":"裕融","9942":"茂順","9943":"好樂迪",
  "9944":"新麗","9945":"潤泰全","9946":"三發地產","9950":"萬國通路",
};

// 取得股票名稱（支援 2379.TW / 2379.TWO / 2379 格式，並強化前後空格與大小寫容錯）
function getStockName(symbol) {
  if (!symbol) return "";
  // 移除前後空白、轉大寫、並將可能的市場後綴 .TW 或 .TWO 剃除
  const code = symbol.trim().toUpperCase().replace(/\.(TW|TWO)$/i, "");
  return TW_STOCK_NAMES[code] || "";
}

// 格式化顯示：代號 + 名稱（如有）
function formatSymbolDisplay(symbol) {
  const name = getStockName(symbol);
  return name ? `${symbol} ${name}` : symbol;
}

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

// 監控清單 DOM
const watchlistInput = document.querySelector("#watchlistInput");
const btnWatchlist = document.querySelector("#btnWatchlist");
const btnClearWatchlist = document.querySelector("#btnClearWatchlist");
const watchlistResult = document.querySelector("#watchlistResult");
const watchlistStatus = document.querySelector("#watchlistStatus");

// 💡 新增：匯出與匯入的按鈕 DOM
const btnExportWatchlist = document.querySelector("#btnExportWatchlist");
const btnImportWatchlist = document.querySelector("#btnImportWatchlist");

// 隱存變數：用來暫存被清除的監控清單，提供 Undo 功能
let deletedWatchlistBackup = "";

const levelDefs = [
  { key: "plus2", label: "+2SD 樂觀線", color: "#c94b4b" },
  { key: "plus1", label: "+1SD 相對樂觀線", color: "#d9852b" },
  { key: "mid", label: "中線", color: "#2c6ebd" },
  { key: "minus1", label: "-1SD 相對悲觀線", color: "#1f8a63" },
  { key: "minus2", label: "-2SD 悲觀線", color: "#12614a" },
];

// --- 網頁載入時，自動讀取上次儲存的資料 ---
document.addEventListener("DOMContentLoaded", () => {
  const savedWatchlist = localStorage.getItem("lohas_watchlist");
  if (savedWatchlist) {
    watchlistInput.value = savedWatchlist;
  }

  const savedLastSymbol = localStorage.getItem("lohas_last_symbol");
  const savedLastMarket = localStorage.getItem("lohas_last_market");
  if (savedLastSymbol) symbolInput.value = savedLastSymbol;
  if (savedLastMarket) market.value = savedLastMarket;
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
  localStorage.setItem("lohas_watchlist", rawInput);

  // 💡 修正點：上限拉升至 15 支
  const syms = rawInput.split(",").map(s => s.trim()).filter(s => s).slice(0, 15);
  const totalStocks = syms.length;

  watchlistResult.innerHTML = "";
  btnWatchlist.disabled = true;

  let currentIndex = 0;
  for (const s of syms) {
    currentIndex++;
    // 💡 修正點：進度條文字優化
    watchlistStatus.textContent = `🔍 正在掃描區間... (${currentIndex} / ${totalStocks})`;

    try {
      const { sym, last } = await fetchLevelForWatchlist(s);
      
      const isSellSignal = last.close >= last.plus2; 
      const isBuySignal = last.close <= last.minus2; 

      const item = document.createElement("div");
      item.className = "watchlist-item";

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

      // 💡 核心優化：將原本可能殘留後綴的 sym (如 2330.TW) 清洗後再扔進對照表獲取名稱
      const stockName = getStockName(sym);
      item.innerHTML = `
        <div>
          <strong>${sym}</strong>${stockName ? `<span style="color:#555; font-size:0.85em; margin-left:6px;">${stockName}</span>` : ""}<br>
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
  watchlistStatus.textContent = `✅ 掃描完成 (共 ${totalStocks} 檔)`;
  btnWatchlist.disabled = false;
});

// 全部清除與復原按鈕
btnClearWatchlist.addEventListener("click", () => {
  if (btnClearWatchlist.textContent.includes("全部清除")) {
    deletedWatchlistBackup = watchlistInput.value;
    watchlistInput.value = "";
    localStorage.removeItem("lohas_watchlist");
    watchlistResult.innerHTML = "";
    watchlistStatus.textContent = "🧹 已暫時清除，可點擊按鈕復原";
    
    btnClearWatchlist.textContent = "↩️ 復原清除清單";
    btnClearWatchlist.style.backgroundColor = "#d9852b"; 
  } else {
    if (deletedWatchlistBackup) {
      watchlistInput.value = deletedWatchlistBackup;
      localStorage.setItem("lohas_watchlist", deletedWatchlistBackup);
      watchlistStatus.textContent = "↩️ 已成功復原清單！";
    }
    btnClearWatchlist.textContent = "🧹 全部清除";
    btnClearWatchlist.style.backgroundColor = "#667085";
  }
});

// 💡 新增：1. 📥 匯出目前清單功能 (自動複製到剪貼簿)
btnExportWatchlist.addEventListener("click", (e) => {
  e.preventDefault(); // 防止網頁跳轉
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

// 💡 新增：2. 📤 匯入歷史清單功能 (彈出提示框輸入)
btnImportWatchlist.addEventListener("click", (e) => {
  e.preventDefault(); // 防止網頁跳轉
  const userInput = prompt("請貼上您先前匯出的股票代號（請用逗點隔開）：");
  
  if (userInput === null) return; // 使用者按了取消
  
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

// --- 詳細單檔查詢按鈕 ---
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
    
    if (chartTitle) {
      chartTitle.textContent = formatSymbolDisplay(json.symbol);
    }
    
    render();
    fetchStatus.textContent = "成功";
    localStorage.setItem("lohas_last_symbol", inputVal);
    localStorage.setItem("lohas_last_market", selectedMarket);
  } catch (err) { 
    fetchStatus.textContent = "失敗"; 
    console.error("Fetch 錯誤資訊:", err);
  }
});

document.querySelector("#sampleBtn").addEventListener("click", () => {
  const mock = []; let p = 100;
  for(let i=0; i<300; i++) mock.push({ date: new Date(Date.now() - (300-i)*86400000).toISOString(), close: p += (Math.random()-0.48) });
  csvInput.value = JSON.stringify(mock);
  if (chartTitle) chartTitle.textContent = "模擬範例股票";
  render();
});