/* ============================================================
   El Reporte de Inteligencia — render del dashboard editorial
   ============================================================ */

document.addEventListener('DOMContentLoaded', fetchData);

async function fetchData() {
  try {
    const response = await fetch('./data.json', { cache: 'no-store' });
    if (!response.ok) throw new Error('Failed to fetch data');
    const data = await response.json();
    renderDashboard(data);
  } catch (error) {
    console.error('Error loading dashboard data:', error);
    const trends = document.getElementById('gemini-trends');
    if (trends) {
      trends.innerText =
        'No se pudieron cargar los datos. Verifica tu conexión o el estado del build en GitHub Actions.';
    }
  }
}

/* --- Paleta de proveedores (solo para el punto de color, cohesionada con el papel) --- */
const PROVIDER_COLORS = {
  openai: '#2f6f5e',
  anthropic: '#c96a3f',
  google: '#3b6fb0',
  'google deepmind': '#3b6fb0',
  meta: '#4a6fa5',
  mistral: '#d98a2b',
  'mistral ai': '#d98a2b',
  deepseek: '#5566c4',
  alibaba: '#c0433a',
  qwen: '#c0433a',
  xai: '#4a463c',
  moonshot: '#7a4fb0',
  'moonshot ai': '#7a4fb0',
  kimi: '#7a4fb0',
  microsoft: '#3b6fb0',
  nvidia: '#5b8c2a',
  cohere: '#c14b7a',
  reka: '#b0532b',
  tencent: '#2f6f5e',
  reve: '#a23b62',
  'z.ai': '#3b6fb0',
  zhipu: '#3b6fb0',
};

function providerColor(name) {
  const key = String(name || '').trim().toLowerCase();
  if (PROVIDER_COLORS[key]) return PROVIDER_COLORS[key];
  // Hash estable para proveedores no mapeados
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) % 360;
  return `hsl(${h}, 32%, 42%)`;
}

function fmtScore(v) {
  if (v === null || v === undefined) return '—';
  return typeof v === 'number' ? (Number.isInteger(v) ? v : v.toFixed(1)) : v;
}

function fmtPrice(v) {
  if (v === null || v === undefined) return '—';
  return '$' + Number(v).toFixed(2);
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.innerText = value;
}

function renderDashboard(data) {
  /* -------- Masthead / fecha -------- */
  const date = new Date(data.lastUpdated);
  setText(
    'last-updated',
    date.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
  );
  setText(
    'dateline',
    date
      .toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
      .toUpperCase()
  );
  // Número de "edición" = días desde el arranque del proyecto (guiño editorial)
  const epoch = new Date('2025-01-01T00:00:00Z');
  const edition = Math.max(1, Math.floor((date - epoch) / 86400000));
  setText('edition', String(edition));

  /* -------- Leads (KPIs) -------- */
  const k = data.kpis || {};
  if (k.bestCodingModel) {
    setText('kpi-coding-score', fmtScore(k.bestCodingModel.score));
    setText('kpi-coding-name', k.bestCodingModel.name || '—');
    setProvider('kpi-coding-provider', k.bestCodingModel.provider);
  }
  if (k.bestImageModel) {
    setText('kpi-image-score', fmtScore(k.bestImageModel.score));
    setText('kpi-image-name', k.bestImageModel.name || '—');
    setProvider('kpi-image-provider', k.bestImageModel.provider);
  }
  if (k.bestValueModel) {
    setText('kpi-value-score', fmtScore(k.bestValueModel.score));
    setText('kpi-value-name', k.bestValueModel.name || '—');
    setProvider('kpi-value-provider', k.bestValueModel.provider);
  }
  setText('kpi-new-models', k.newModelsThisWeek ?? '—');

  /* -------- Análisis (Gemini) -------- */
  if (data.geminiAnalysis) {
    setText('gemini-trends', data.geminiAnalysis.trends || '—');
    setText('gemini-recommendations', data.geminiAnalysis.recommendations || '—');
  }

  /* -------- Comparativa -------- */
  const c = data.comparative || {};
  renderTeam('anthropic', c.anthropic);
  renderTeam('google', c.google);
  renderTeam('open', c.openSource);

  /* -------- Gráficos de barras -------- */
  renderBarChart('chart-coding', data.codingModels, { unit: 'pts' });
  renderBarChart('chart-intelligence', data.intelligenceModels, { unit: 'pts' });
  renderBarChart('chart-value', data.valueModels, { unit: 'idx/$' });
  renderBarChart('chart-image', data.imageModels, { unit: 'elo' });
}

function setProvider(id, provider) {
  const el = document.getElementById(id);
  if (el) el.innerText = provider ? ' ' + provider : '';
}

function renderTeam(prefix, team) {
  if (!team) return;
  setText(`comp-${prefix}-name`, team.name || '—');
  const m = team.metrics || {};
  setText(`comp-${prefix}-int`, m.intelligence ?? '—');
  setText(`comp-${prefix}-cod`, m.coding ?? '—');
  setText(`comp-${prefix}-pri`, m.price !== undefined && m.price !== 'N/A' ? '$' + m.price : (m.price ?? '—'));
}

/**
 * Gráfico de barras horizontal, estilo editorial.
 * La barra se escala entre el mínimo y el máximo de la lista (con un piso del
 * 14%) para que las diferencias entre líderes se vean, no que todo llegue al tope.
 */
function renderBarChart(elementId, models, { unit } = {}) {
  const el = document.getElementById(elementId);
  if (!el) return;

  if (!models || models.length === 0) {
    el.innerHTML =
      '<p style="font-family:var(--font-mono);font-size:0.72rem;color:var(--ink-mute);padding:1.2rem 0;letter-spacing:0.06em;text-transform:uppercase">Sin datos disponibles</p>';
    return;
  }

  const scores = models.map((m) => m.score).filter((s) => typeof s === 'number');
  const max = Math.max(...scores);
  const min = Math.min(...scores);
  const span = max - min || 1;

  el.innerHTML = models
    .map((model, i) => {
      const frac = (model.score - min) / span; // 0..1
      const width = (14 + frac * 86).toFixed(1); // 14%..100%
      const delay = (0.08 * i).toFixed(2);
      const pc = providerColor(model.provider);
      const priceLine =
        model.price !== null && model.price !== undefined
          ? `<small>${fmtPrice(model.price)}/1M</small>`
          : '';

      return `
      <div class="bar-row ${i === 0 ? 'bar-row--lead' : ''}" style="--delay:${delay}s">
        <div class="bar-rank">${String(i + 1).padStart(2, '0')}</div>
        <div class="bar-main">
          <span class="bar-name">${escapeHtml(model.name)}</span>
          <span class="bar-provider"><span class="pdot" style="--pc:${pc}"></span>${escapeHtml(model.provider || '')}</span>
        </div>
        <div class="bar-value">${fmtScore(model.score)}${priceLine}</div>
        <div class="bar-track"><div class="bar-fill" style="--w:${width}%;--delay:${delay}s"></div></div>
      </div>`;
    })
    .join('');
}

function escapeHtml(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
