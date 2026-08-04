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

/* ============================================================
   Proveedores: color de marca + logo (SVG real para los grandes,
   monograma de color para el resto).
   ============================================================ */
const LOGO = {
  openai: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M22.28 9.82a5.98 5.98 0 0 0-.52-4.91 6.05 6.05 0 0 0-6.51-2.9A6.06 6.06 0 0 0 4.98 4.18a5.98 5.98 0 0 0-3.99 2.9 6.05 6.05 0 0 0 .74 7.1 5.98 5.98 0 0 0 .51 4.91 6.05 6.05 0 0 0 6.51 2.9A5.98 5.98 0 0 0 13.26 24a6.06 6.06 0 0 0 5.77-4.21 5.99 5.99 0 0 0 4-2.9 6.05 6.05 0 0 0-.75-7.07zM13.26 22.43a4.48 4.48 0 0 1-2.88-1.04l.14-.08 4.78-2.76a.78.78 0 0 0 .39-.68v-6.74l2.02 1.17a.07.07 0 0 1 .04.05v5.58a4.5 4.5 0 0 1-4.49 4.5zM3.6 18.3a4.47 4.47 0 0 1-.53-3.01l.14.08 4.78 2.76a.77.77 0 0 0 .78 0l5.84-3.37v2.33a.08.08 0 0 1-.03.06L9.74 19.95a4.5 4.5 0 0 1-6.14-1.65zM2.34 7.9a4.49 4.49 0 0 1 2.37-1.98v5.68a.77.77 0 0 0 .39.68l5.81 3.35-2.02 1.17a.08.08 0 0 1-.07 0L4 14.01a4.5 4.5 0 0 1-1.66-6.11zm16.6 3.85l-5.84-3.38 2.02-1.16a.08.08 0 0 1 .07 0l4.83 2.79a4.49 4.49 0 0 1-.68 8.1v-5.68a.79.79 0 0 0-.4-.67zm2-3.02l-.14-.09-4.77-2.78a.78.78 0 0 0-.79 0L9.41 9.23V6.9a.07.07 0 0 1 .03-.06l4.83-2.79a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.14l-2.02-1.17a.08.08 0 0 1-.04-.05V9.99a4.5 4.5 0 0 1 7.38-3.45l-.14.08L8.7 5.38a.78.78 0 0 0-.39.68zm1.1-2.37l2.6-1.5 2.61 1.5v3l-2.6 1.5-2.61-1.5z"/></svg>`,
  anthropic: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M13.83 3.52h3.6L24 20.48h-3.6l-6.57-16.96zm-7.26 0h3.77l6.57 16.96H13.14l-1.34-3.46H4.93l-1.34 3.46H0L6.57 3.52zm4.13 10.23L8.51 7.6l-2.18 6.15h4.37z"/></svg>`,
  google: `<svg viewBox="0 0 24 24"><path fill="#4285F4" d="M23.52 12.27c0-.79-.07-1.54-.2-2.27H12v4.51h6.47c-.28 1.5-1.12 2.77-2.39 3.62v3.01h3.86c2.26-2.08 3.56-5.15 3.56-8.87z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.94-2.91l-3.86-3.01c-1.08.72-2.45 1.16-4.08 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.11C3.26 21.3 7.31 24 12 24z"/><path fill="#FBBC05" d="M5.27 14.28c-.24-.72-.38-1.49-.38-2.28s.14-1.56.38-2.28V6.61H1.29A11.99 11.99 0 0 0 0 12c0 1.94.46 3.77 1.29 5.39l3.98-3.11z"/><path fill="#EA4335" d="M12 4.76c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.61l3.98 3.11C6.22 6.87 8.87 4.76 12 4.76z"/></svg>`,
  meta: `<svg viewBox="0 0 24 24" fill="#0866FF"><path d="M6.5 6C3.9 6 2 8.6 2 12s1.9 6 4.4 6c1.6 0 2.8-.9 4-2.6.9-1.3 1.7-2.7 2.4-3.9.7 1.2 1.5 2.6 2.4 3.9 1.2 1.7 2.4 2.6 4 2.6C21.1 18 23 15.4 23 12s-1.9-6-4.4-6c-1.7 0-3 .9-4.3 2.8-.5.7-1 1.5-1.5 2.3-.5-.8-1-1.6-1.5-2.3C9.9 6.9 8.5 6 6.5 6zm0 2.2c.8 0 1.6.6 2.5 1.9.4.6.9 1.3 1.3 2-.6 1-1.2 1.9-1.6 2.5-.9 1.2-1.5 1.5-2.1 1.5-1.2 0-2.3-1.6-2.3-4.1S5.3 8.2 6.5 8.2zm11 0c1.2 0 2.3 1.6 2.3 4s-1.1 4-2.3 4c-.6 0-1.2-.3-2.1-1.5-.4-.6-1-1.5-1.6-2.5.4-.7.9-1.4 1.3-2 .8-1.3 1.6-2 2.4-2z"/></svg>`,
  xai: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 3l7.5 9L3 21h2.2l6.3-7.6L17 21h4l-7.9-9.5L20.6 3h-2.2l-6 7.2L7 3z"/></svg>`,
  mistral: `<svg viewBox="0 0 24 24"><rect x="2" y="3" width="4" height="4" fill="#F7D046"/><rect x="18" y="3" width="4" height="4" fill="#F7D046"/><rect x="2" y="7" width="4" height="4" fill="#F2A73B"/><rect x="6" y="7" width="4" height="4" fill="#F2A73B"/><rect x="14" y="7" width="4" height="4" fill="#F2A73B"/><rect x="18" y="7" width="4" height="4" fill="#F2A73B"/><rect x="2" y="11" width="20" height="4" fill="#EE792F"/><rect x="6" y="15" width="4" height="4" fill="#EB5829"/><rect x="14" y="15" width="4" height="4" fill="#EB5829"/><rect x="2" y="19" width="4" height="2" fill="#EA3326"/><rect x="18" y="19" width="4" height="2" fill="#EA3326"/></svg>`,
  microsoft: `<svg viewBox="0 0 24 24"><rect x="2" y="2" width="9" height="9" fill="#F25022"/><rect x="13" y="2" width="9" height="9" fill="#7FBA00"/><rect x="2" y="13" width="9" height="9" fill="#00A4EF"/><rect x="13" y="13" width="9" height="9" fill="#FFB900"/></svg>`,
};

// key de proveedor -> { color de barra, svg (opcional), initials (opcional) }
const PROVIDERS = {
  openai: { color: '#0d0d0d', svg: LOGO.openai },
  anthropic: { color: '#cc785c', svg: LOGO.anthropic },
  google: { color: '#1a73e8', svg: LOGO.google },
  'google deepmind': { color: '#1a73e8', svg: LOGO.google },
  meta: { color: '#0866ff', svg: LOGO.meta },
  xai: { color: '#1a1a1a', svg: LOGO.xai },
  mistral: { color: '#ea5a0c', svg: LOGO.mistral },
  'mistral ai': { color: '#ea5a0c', svg: LOGO.mistral },
  microsoft: { color: '#0a7bd4', svg: LOGO.microsoft },
  'microsoft ai': { color: '#0a7bd4', svg: LOGO.microsoft },
  deepseek: { color: '#4d6bfe', initials: 'DS' },
  alibaba: { color: '#e8590c', initials: 'Q' },
  qwen: { color: '#e8590c', initials: 'Q' },
  nvidia: { color: '#76b900', initials: 'N' },
  moonshot: { color: '#1a1a1a', initials: 'K' },
  'moonshot ai': { color: '#1a1a1a', initials: 'K' },
  kimi: { color: '#1a1a1a', initials: 'K' },
  minimax: { color: '#e8447f', initials: 'MM' },
  cohere: { color: '#39594d', initials: 'C' },
  tencent: { color: '#12b7f5', initials: 'T' },
  reve: { color: '#a23b62', initials: 'RV' },
  'z.ai': { color: '#2d6cdf', initials: 'Z' },
  zhipu: { color: '#2d6cdf', initials: 'Z' },
  reka: { color: '#b0532b', initials: 'RK' },
  'black forest labs': { color: '#111111', initials: 'BF' },
  ideogram: { color: '#6a4a6e', initials: 'ID' },
  recraft: { color: '#5b6470', initials: 'RC' },
  luma: { color: '#111111', initials: 'LM' },
};

const FALLBACK_PALETTE = ['#5b6470', '#7a5c3e', '#3f6650', '#6a4a6e', '#8a5a2b', '#455a7a', '#78585f', '#2f6f5e'];

function initialsOf(name) {
  const words = String(name || '?').trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

function getProvider(name) {
  const key = String(name || '').trim().toLowerCase();
  let hit = PROVIDERS[key];
  if (!hit) {
    for (const k in PROVIDERS) {
      if (key && (key.includes(k) || k.includes(key))) { hit = PROVIDERS[k]; break; }
    }
  }
  if (hit) {
    return { color: hit.color, svg: hit.svg || null, initials: hit.initials || initialsOf(name) };
  }
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return { color: FALLBACK_PALETTE[h % FALLBACK_PALETTE.length], svg: null, initials: initialsOf(name) };
}

// Luminancia para decidir texto claro/oscuro sobre la barra de color.
function isLight(hex) {
  const c = String(hex).replace('#', '');
  if (c.length < 6) return false;
  const r = parseInt(c.substr(0, 2), 16);
  const g = parseInt(c.substr(2, 2), 16);
  const b = parseInt(c.substr(4, 2), 16);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 150;
}

// Nombre corto para la etiqueta del gráfico (sin el sufijo de variante).
function shortName(name) {
  const n = String(name || '');
  return n.replace(/\s*\(.*$/, '').trim() || n;
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
  renderBarChart('chart-coding', data.codingModels);
  renderBarChart('chart-intelligence', data.intelligenceModels);
  renderBarChart('chart-value', data.valueModels);
  renderBarChart('chart-image', data.imageModels);
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
 * Gráfico de columnas verticales, estilo Artificial Analysis:
 * cada barra usa el color de marca del proveedor y muestra su logo debajo.
 * La altura se escala entre el mínimo y el máximo de la lista (piso del 20%)
 * para que las diferencias entre líderes se aprecien.
 */
function renderBarChart(elementId, models) {
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

  const cols = models
    .map((model, i) => {
      const frac = (model.score - min) / span; // 0..1
      const height = (20 + frac * 80).toFixed(1); // 20%..100%
      const delay = (0.07 * i).toFixed(2);
      const p = getProvider(model.provider);
      const txt = isLight(p.color) ? '#1b1913' : '#ffffff';
      const mark = p.svg
        ? `<span class="vlogo">${p.svg}</span>`
        : `<span class="vlogo vlogo--mono" style="background:${p.color}">${escapeHtml(p.initials)}</span>`;
      const priceTip = model.price != null ? ` · $${Number(model.price).toFixed(2)}/1M` : '';
      const tip = `${escapeHtml(model.name)} — ${escapeHtml(model.provider || '')}${priceTip}`;

      return `
      <div class="vcol" style="--delay:${delay}s" title="${tip}">
        <div class="vbar-wrap">
          <div class="vbar" style="--h:${height}%;background:${p.color};--delay:${delay}s">
            <span class="vscore" style="color:${txt}">${fmtScore(model.score)}</span>
          </div>
        </div>
        ${mark}
        <span class="vname">${escapeHtml(shortName(model.name))}</span>
      </div>`;
    })
    .join('');

  el.innerHTML = `<div class="vchart">${cols}</div>`;
}

function escapeHtml(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
