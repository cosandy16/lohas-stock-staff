// --- 基礎資料設定 (請確保這裡有設定 lowPe) ---
const STOCK_FUNDAMENTALS = {
  "1477": { eps: 15.0, lowPe: 12 }, 
  "1476": { eps: 22.0, lowPe: 15 },
  "2330": { eps: 38.2, lowPe: 14 },
  "2317": { eps: 10.2, lowPe: 9 }
};

function getFundamentals(symbol) {
  const code = symbol.replace(/\.(TW|TWO)$/i, "").toUpperCase();
  return STOCK_FUNDAMENTALS[code] || { eps: 0, lowPe: 0 };
}

// --- 繪圖函式 (內含 PE 防禦線邏輯) ---
function renderChart(analysis) {
  const width = 1000, height = 500;
  const margin = { top: 40, right: 120, bottom: 40, left: 60 };
  const last = analysis[analysis.length - 1];
  
  const minP = Math.min(...analysis.map(p => Math.min(p.close, p.minus2))) * 0.95;
  const maxP = Math.max(...analysis.map(p => Math.max(p.close, p.plus2))) * 1.05;
  
  const x = (i) => margin.left + (i / (analysis.length - 1)) * (width - margin.left - margin.right);
  const y = (val) => height - margin.bottom - ((val - minP) / (maxP - minP)) * (height - margin.top - margin.bottom);

  // 計算 PE 防禦價
  const sym = symbolInput.value.trim().toUpperCase();
  const fun = getFundamentals(sym);
  const pePrice = fun.eps * fun.lowPe;
  
  // 生成 SVG
  let peLineHtml = "";
  if (fun.eps > 0 && fun.lowPe > 0 && pePrice > minP && pePrice < maxP) {
    const py = y(pePrice);
    peLineHtml = `
      <line x1="${margin.left}" y1="${py}" x2="${width - margin.right}" y2="${py}" 
            stroke="#d32f2f" stroke-width="3" stroke-dasharray="8 4" />
      <text x="${width - margin.right + 5}" y="${py + 5}" fill="#d32f2f" font-size="16" font-weight="bold">
        PE ${fun.lowPe}x ($${pePrice.toFixed(0)})
      </text>
    `;
  }

  chart.innerHTML = `
    <svg viewBox="0 0 ${width} ${height}" style="background:#fff; width:100%; height:100%;">
      ${peLineHtml}
      ${levelDefs.map(l => `<path d="${analysis.map((p, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(p[l.key])}`).join(" ")}" fill="none" stroke="${l.color}" stroke-width="${l.key === 'mid' ? 2.5 : 1.5}" opacity="0.6" />`).join("")}
      <path d="${analysis.map((p, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(p.close)}`).join(" ")}" fill="none" stroke="#000" stroke-width="3" />
    </svg>
  `;
}
// (後續保持其他原有功能函式即可)