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

const levelDefs = [
  { key: "plus2", label: "+2SD 樂觀線", color: "#c94b4b", note: "偏高，留意回檔風險" },
  { key: "plus1", label: "+1SD 相對樂觀線", color: "#d9852b", note: "偏熱，適合保守評估" },
  { key: "mid", label: "中線", color: "#2c6ebd", note: "長期趨勢估計值" },
  { key: "minus1", label: "-1SD 相對悲觀線", color: "#1f8a63", note: "偏低，常作分批觀察區" },
  { key: "minus2", label: "-2SD 悲觀線", color: "#12614a", note: "明顯偏低，需確認風險" },
];

function makeSampleCsv() {
  const rows = ["Date,Close"];
  const start = new Date("2022-11-01T00:00:00");
  let price = 88;
  for (let i = 0; i < 900; i += 1) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    if (date.getDay() === 0 || date.getDay() === 6) continue;
    const trend = 0.00042;
    const cycle = Math.sin(i / 34) * 0.009 + Math.sin(i / 91) * 0.014;
    const shock = i === 430 ? -0.08 : i === 610 ? 0.06 : 0;
    price *= 1 + trend + cycle + shock;
    rows.push(`${date.toISOString().slice(0, 10)},${price.toFixed(2)}`);
  }
  return rows.join("\n");
}

function rowsToCsv(rows) {
  return ["Date,Close", ...rows.map((row) => `${row.date},${row.close}`)].join("\n");
}

function fetchYears() {
  return periodYears.value === "all" ? "5" : periodYears.value;
}

function parseCsv(text) {
  const rows = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const parsed = [];
  for (const row of rows) {
    const cells = row.split(/,|\t/).map((cell) => cell.trim().replace(/^"|"$/g, ""));
    const date = new Date(cells[0]);
    const close = Number(cells[1]);
    if (Number.isFinite(close) && !Number.isNaN(date.getTime()) && close > 0) {
      parsed.push({ date, close });
    }
  }

  return parsed.sort((a, b) => a.date - b.date);
}

function filterByPeriod(data) {
  if (periodYears.value === "all") return data;
  const years = Number(periodYears.value);
  const lastDate = data[data.length - 1].date;
  const cutoff = new Date(lastDate);
  cutoff.setDate(cutoff.getDate() - Math.round(years * 365));
  return data.filter((point) => point.date >= cutoff);
}

function regression(values) {
  const n = values.length;
  const sumX = values.reduce((sum, point) => sum + point.x, 0);
  const sumY = values.reduce((sum, point) => sum + point.y, 0);
  const meanX = sumX / n;
  const meanY = sumY / n;
  let numerator = 0;
  let denominator = 0;
  for (const point of values) {
    numerator += (point.x - meanX) * (point.y - meanY);
    denominator += (point.x - meanX) ** 2;
  }
  const slope = denominator === 0 ? 0 : numerator / denominator;
  const intercept = meanY - slope * meanX;
  const fitted = values.map((point) => intercept + slope * point.x);
  const residuals = values.map((point, index) => point.y - fitted[index]);
  const sd = Math.sqrt(residuals.reduce((sum, item) => sum + item ** 2, 0) / Math.max(1, n - 2));
  const ssTot = values.reduce((sum, point) => sum + (point.y - meanY) ** 2, 0);
  const ssRes = residuals.reduce((sum, item) => sum + item ** 2, 0);
  const r2 = ssTot === 0 ? 1 : Math.max(0, 1 - ssRes / ssTot);
  return { intercept, slope, sd, r2 };
}

function buildAnalysis(data) {
  const filtered = filterByPeriod(data);
  if (filtered.length < 30) {
    throw new Error("有效資料少於 30 筆，請貼上更多日期與收盤價。");
  }

  const startTime = filtered[0].date.getTime();
  const dayMs = 24 * 60 * 60 * 1000;
  const useLog = modelMode.value === "log";
  const points = filtered.map((point) => ({
    ...point,
    x: (point.date.getTime() - startTime) / dayMs,
    y: useLog ? Math.log(point.close) : point.close,
  }));
  const fit = regression(points);

  return points.map((point) => {
    const midRaw = fit.intercept + fit.slope * point.x;
    const convert = (value) => (useLog ? Math.exp(value) : value);
    const levels = {
      plus2: convert(midRaw + fit.sd * 2),
      plus1: convert(midRaw + fit.sd),
      mid: convert(midRaw),
      minus1: convert(midRaw - fit.sd),
      minus2: convert(midRaw - fit.sd * 2),
    };
    return { ...point, ...levels, r2: fit.r2 };
  });
}

function priceZone(point) {
  if (point.close >= point.plus2) return "樂觀區上緣";
  if (point.close >= point.plus1) return "相對樂觀區";
  if (point.close >= point.mid) return "中線以上";
  if (point.close >= point.minus1) return "中線以下";
  if (point.close >= point.minus2) return "相對悲觀區";
  return "悲觀區下緣";
}

function formatPrice(value) {
  return Number(value).toLocaleString("zh-TW", {
    minimumFractionDigits: value >= 1000 ? 0 : 2,
    maximumFractionDigits: value >= 1000 ? 0 : 2,
  });
}

function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

function scaleLinear(domainStart, domainEnd, rangeStart, rangeEnd) {
  const span = domainEnd - domainStart || 1;
  return (value) => rangeStart + ((value - domainStart) / span) * (rangeEnd - rangeStart);
}

function linePath(data, getX, getY) {
  return data.map((point, index) => `${index === 0 ? "M" : "L"} ${getX(point).toFixed(2)} ${getY(point).toFixed(2)}`).join(" ");
}

function renderTable(latest) {
  levelsTable.innerHTML = levelDefs
    .map(
      (level) => `
        <tr>
          <td><strong style="color:${level.color}">${level.label}</strong></td>
          <td><strong>${formatPrice(latest[level.key])}</strong></td>
          <td>${level.note}</td>
        </tr>
      `,
    )
    .join("");
}

function renderChart(analysis) {
  const width = 1180;
  const height = 620;
  const margin = { top: 34, right: 76, bottom: 58, left: 72 };
  const minPrice = Math.min(...analysis.map((point) => Math.min(point.close, point.minus2)));
  const maxPrice = Math.max(...analysis.map((point) => Math.max(point.close, point.plus2)));
  const yMin = minPrice * 0.96;
  const yMax = maxPrice * 1.04;
  const x = scaleLinear(0, analysis.length - 1, margin.left, width - margin.right);
  const y = scaleLinear(yMin, yMax, height - margin.bottom, margin.top);
  const xAt = (point) => x(analysis.indexOf(point));
  const yTicks = Array.from({ length: 6 }, (_, index) => yMin + ((yMax - yMin) / 5) * index);
  const last = analysis[analysis.length - 1];

  // --- 修改處：只有超過 +2SD 樂觀線才亮燈 ---
  const isOptimisticFull = last.close >= last.plus2;

  const bands = `
    <path d="${linePath(analysis, xAt, (p) => y(p.plus2))} L ${linePath([...analysis].reverse(), xAt, (p) => y(p.plus1)).replace(/^M/, "L")} Z" fill="#f7dddd" opacity="0.8" />
    <path d="${linePath(analysis, xAt, (p) => y(p.plus1))} L ${linePath([...analysis].reverse(), xAt, (p) => y(p.minus1)).replace(/^M/, "L")} Z" fill="#edf3fb" opacity="0.75" />
    <path d="${linePath(analysis, xAt, (p) => y(p.minus1))} L ${linePath([...analysis].reverse(), xAt, (p) => y(p.minus2)).replace(/^M/, "L")} Z" fill="#dff1e9" opacity="0.85" />
  `;

  chart.innerHTML = `
    <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="股市樂活五線譜">
      <rect width="${width}" height="${height}" rx="8" fill="#ffffff" />
      ${yTicks
        .map(
          (tick) => `
            <line x1="${margin.left}" y1="${y(tick)}" x2="${width - margin.right}" y2="${y(tick)}" stroke="#e7ebf0" />
            <text x="${margin.left - 14}" y="${y(tick) + 4}" text-anchor="end" font-size="13" fill="#667085">${formatPrice(tick)}</text>
          `,
        )
        .join("")}
      ${bands}
      ${levelDefs
        .map(
          (level) => `
            <path d="${linePath(analysis, xAt, (p) => y(p[level.key]))}" fill="none" stroke="${level.color}" stroke-width="${level.key === "mid" ? 2.8 : 2}" />
            <text x="${width - margin.right + 10}" y="${y(last[level.key]) + 4}" font-size="13" font-weight="800" fill="${level.color}">${level.label}</text>
          `,
        )
        .join("")}
      
      <path d="${linePath(analysis, xAt, (p) => y(p.close))}" fill="none" stroke="#17202f" stroke-width="2.4" />
      
      ${isOptimisticFull ? `
        <circle cx="${x(analysis.length - 1)}" cy="${y(last.close)}" r="8" fill="#c94b4b" opacity="0.4">
          <animate attributeName="r" from="8" to="22" dur="1.2s" repeatCount="indefinite" />
          <animate attributeName="opacity" from="0.5" to="0" dur="1.2s" repeatCount="indefinite" />
        </circle>
      ` : ""}

      <circle cx="${x(analysis.length - 1)}" cy="${y(last.close)}" r="${isOptimisticFull ? 6 : 5}" fill="${isOptimisticFull ? "#c94b4b" : "#17202f"}" />
      <text x="${x(analysis.length - 1) - 10}" y="${y(last.close) - 12}" text-anchor="end" font-size="14" font-weight="900" fill="${isOptimisticFull ? "#c94b4b" : "#17202f"}">${formatPrice(last.close)}</text>
      
      <line x1="${margin.left}" y1="${height - margin.bottom}" x2="${width - margin.right}" y2="${height - margin.bottom}" stroke="#b9c2cf" />
      <line x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${height - margin.bottom}" stroke="#b9c2cf" />
      <text x="${margin.left}" y="${height - 20}" font-size="13" fill="#667085">${formatDate(analysis[0].date)}</text>
      <text x="${width - margin.right}" y="${height - 20}" text-anchor="end" font-size="13" fill="#667085">${formatDate(last.date)}</text>
    </svg>
  `;
}

function render() {
  try {
    const data = parseCsv(csvInput.value);
    const analysis = buildAnalysis(data);
    const latest = analysis[analysis.length - 1];
    
    chartTitle.textContent = `${symbolName.value.trim() || "未命名標的"} 樂活五線譜`;
    rangeText.textContent = `${formatDate(analysis[0].date)} ~ ${formatDate(latest.date)} · ${analysis.length} 筆資料 · ${modelMode.value === "log" ? "對數趨勢" : "線性趨勢"}`;
    
    const zone = priceZone(latest);
    zoneText.textContent = zone;
    
    // --- 修改處：目前位階文字，只有「樂觀區上緣」才亮紅燈 ---
    if (zone === "樂觀區上緣") {
      zoneText.style.color = "#c94b4b";
      zoneText.style.fontWeight = "900";
    } else {
      zoneText.style.color = "var(--ink)";
      zoneText.style.fontWeight = "800";
    }

    closeText.textContent = formatPrice(latest.close);
    r2Text.textContent = latest.r2.toFixed(3);
    
    renderChart(analysis);
    renderTable(latest);
  } catch (error) {
    chart.innerHTML = `<div class="error">${error.message}</div>`;
    chartTitle.textContent = "股市樂活五線譜";
    rangeText.textContent = "請貼上或上傳日期、收盤價資料";
    zoneText.textContent = "--";
    closeText.textContent = "--";
    r2Text.textContent = "--";
    levelsTable.innerHTML = "";
  }
}

fileInput.addEventListener("change", async () => {
  const file = fileInput.files[0];
  if (!file) return;
  csvInput.value = await file.text();
  render();
});

function displaySymbol(rawSymbol) {
  if (market.value === "tw") return `${rawSymbol}.TW`;
  if (market.value === "two") return `${rawSymbol}.TWO`;
  return rawSymbol.toUpperCase();
}

fetchSymbolBtn.addEventListener("click", async () => {
  const rawSymbol = symbolInput.value.trim();
  const targetSymbol = displaySymbol(rawSymbol);
  fetchStatus.className = "fetch-status is-loading";
  fetchStatus.textContent = `正在抓取 ${targetSymbol} 的日收盤資料...`;
  fetchSymbolBtn.disabled = true;

  try {
    const params = new URLSearchParams({
      symbol: rawSymbol,
      market: market.value,
      years: fetchYears(),
    });
    const response = await fetch(`/api/yahoo?${params.toString()}`);
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error || "抓取資料失敗。");
    }
    csvInput.value = rowsToCsv(payload.rows);
    symbolName.value = payload.symbol;
    render();
    fetchStatus.className = "fetch-status is-ok";
    fetchStatus.textContent = `已從 ${payload.source || "資料來源"} 抓到 ${payload.rows.length} 筆日收盤資料，並更新圖表。`;
  } catch (error) {
    fetchStatus.className = "fetch-status is-error";
    fetchStatus.textContent = error.message;
  } finally {
    fetchSymbolBtn.disabled = false;
  }
});

market.addEventListener("change", () => {
  if (market.value === "us") {
    symbolInput.value = "AAPL";
  } else if (market.value === "two") {
    symbolInput.value = "6488";
  } else if (market.value === "custom") {
    symbolInput.value = "2330.TW";
  } else {
    symbolInput.value = "2330";
  }
});

document.querySelector("#sampleBtn").addEventListener("click", () => {
  symbolName.value = "範例 ETF";
  csvInput.value = makeSampleCsv();
  render();
});

document.querySelector("#renderBtn").addEventListener("click", render);
symbolName.addEventListener("input", render);
periodYears.addEventListener("change", render);
modelMode.addEventListener("change", render);

csvInput.value = makeSampleCsv();
render();