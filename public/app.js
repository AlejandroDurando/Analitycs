document.addEventListener('DOMContentLoaded', () => {
  fetchData();
  
  const toggleBtn = document.getElementById('toggle-view');
  const fullViewSection = document.getElementById('full-view-section');
  
  toggleBtn.addEventListener('click', () => {
    if (fullViewSection.classList.contains('hidden')) {
      fullViewSection.classList.remove('hidden');
      toggleBtn.innerHTML = '<i data-lucide="layout-grid" class="w-4 h-4 text-gray-300"></i>';
    } else {
      fullViewSection.classList.add('hidden');
      toggleBtn.innerHTML = '<i data-lucide="maximize-2" class="w-4 h-4 text-gray-300"></i>';
    }
    lucide.createIcons();
  });
});

async function fetchData() {
  try {
    const response = await fetch('/data.json');
    if (!response.ok) throw new Error('Failed to fetch data');
    const data = await response.json();
    renderDashboard(data);
  } catch (error) {
    console.error('Error loading dashboard data:', error);
    document.getElementById('gemini-trends').innerText = 'Error al cargar los datos. Por favor, verifica tu conexión o el estado del build de GitHub Actions.';
  }
}

function renderDashboard(data) {
  // Update header
  const date = new Date(data.lastUpdated);
  document.getElementById('last-updated').innerText = date.toLocaleDateString('es-MX', { 
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
  });

  // KPIs
  document.getElementById('kpi-coding-name').innerText = data.kpis.bestCodingModel.name;
  document.getElementById('kpi-coding-score').innerText = data.kpis.bestCodingModel.score;
  
  document.getElementById('kpi-image-name').innerText = data.kpis.bestImageModel.name;
  document.getElementById('kpi-image-score').innerText = data.kpis.bestImageModel.score;
  
  document.getElementById('kpi-value-name').innerText = data.kpis.bestValueModel.name;
  document.getElementById('kpi-value-score').innerText = data.kpis.bestValueModel.score;
  
  document.getElementById('kpi-new-models').innerText = data.kpis.newModelsThisWeek;

  // Gemini Analysis
  document.getElementById('gemini-trends').innerText = data.geminiAnalysis.trends;
  document.getElementById('gemini-recommendations').innerText = data.geminiAnalysis.recommendations;

  // Comparative Section
  const c = data.comparative;
  document.getElementById('comp-anthropic-name').innerText = c.anthropic.name;
  document.getElementById('comp-anthropic-int').innerText = c.anthropic.metrics.intelligence;
  document.getElementById('comp-anthropic-cod').innerText = c.anthropic.metrics.coding;
  document.getElementById('comp-anthropic-pri').innerText = '$' + c.anthropic.metrics.price;

  document.getElementById('comp-google-name').innerText = c.google.name;
  document.getElementById('comp-google-int').innerText = c.google.metrics.intelligence;
  document.getElementById('comp-google-cod').innerText = c.google.metrics.coding;
  document.getElementById('comp-google-pri').innerText = '$' + c.google.metrics.price;

  document.getElementById('comp-open-name').innerText = c.openSource.name;
  document.getElementById('comp-open-int').innerText = c.openSource.metrics.intelligence;
  document.getElementById('comp-open-cod').innerText = c.openSource.metrics.coding;
  document.getElementById('comp-open-pri').innerText = '$' + c.openSource.metrics.price;

  // Tables
  renderTable('table-coding', data.codingModels, 'score');
  renderTable('table-intelligence', data.intelligenceModels, 'score');
  renderTable('table-image', data.imageModels, 'score');
  renderTable('table-value', data.valueModels, 'score', true);
  
  // Re-initialize icons since we injected new HTML with data-lucide
  lucide.createIcons();
}

function renderTable(elementId, models, scoreKey, isValueIdx = false) {
  const tbody = document.getElementById(elementId);
  tbody.innerHTML = '';
  
  if (!models || models.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" class="px-4 py-4 text-center text-gray-500">No hay datos disponibles</td></tr>';
    return;
  }

  // Find max score for the progress bar
  const maxScore = Math.max(...models.map(m => m[scoreKey]));

  models.forEach((model, index) => {
    const tr = document.createElement('tr');
    tr.className = 'hover:bg-white/5 transition-colors group';
    
    let deltaHtml = '<span class="text-gray-500">-</span>';
    if (model.delta === 'NEW') {
      deltaHtml = '<span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400">NEW</span>';
    } else if (model.delta.startsWith('↑')) {
      deltaHtml = `<span class="flex items-center justify-end text-emerald-400 gap-0.5"><i data-lucide="arrow-up" class="w-3 h-3"></i>${model.delta.substring(1)}</span>`;
    } else if (model.delta.startsWith('↓')) {
      deltaHtml = `<span class="flex items-center justify-end text-red-400 gap-0.5"><i data-lucide="arrow-down" class="w-3 h-3"></i>${model.delta.substring(1)}</span>`;
    }

    const percentage = (model[scoreKey] / maxScore) * 100;
    
    // Formatting price
    const priceDisplay = model.price !== null ? `$${model.price.toFixed(isValueIdx ? 2 : 2)}` : 'N/A';

    tr.innerHTML = `
      <td class="px-4 py-3">
        <div class="flex items-center gap-3">
          <span class="text-gray-500 font-mono text-xs w-4">${index + 1}</span>
          <div class="flex flex-col">
            <span class="font-medium text-white">${model.name}</span>
            <span class="text-xs text-gray-400">${model.provider}</span>
          </div>
        </div>
      </td>
      <td class="px-4 py-3">
        <div class="flex flex-col gap-1">
          <span class="font-bold text-white">${model[scoreKey]}</span>
          <div class="w-16 h-1 bg-white/10 rounded-full overflow-hidden">
            <div class="h-full bg-primary progress-bar-fill rounded-full" style="width: ${percentage}%"></div>
          </div>
        </div>
      </td>
      <td class="px-4 py-3 text-gray-300">${priceDisplay}</td>
      <td class="px-4 py-3 text-right">${deltaHtml}</td>
    `;
    tbody.appendChild(tr);
  });
}
