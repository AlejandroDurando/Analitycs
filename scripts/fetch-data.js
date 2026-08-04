import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

// Load env vars (for local testing if needed, though GitHub Actions will provide them)
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const AA_API_KEY = process.env.AA_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
// Modelo de Gemini para el análisis. Configurable vía secret/variable
// GEMINI_MODEL por si el modelo por defecto se descontinúa.
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-flash-latest';
const HISTORY_DIR = path.join(__dirname, '../history');
const PUBLIC_DIR = path.join(__dirname, '../public');

// Ensure directories exist
if (!fs.existsSync(HISTORY_DIR)) fs.mkdirSync(HISTORY_DIR, { recursive: true });
if (!fs.existsSync(PUBLIC_DIR)) fs.mkdirSync(PUBLIC_DIR, { recursive: true });

async function fetchFromAA(endpoint) {
  if (!AA_API_KEY) {
    console.warn(`WARNING: AA_API_KEY no encontrada. Retornando datos vacíos para ${endpoint}`);
    return null;
  }
  
  try {
    const response = await fetch(`https://artificialanalysis.ai/api/v2${endpoint}`, {
      headers: {
        'x-api-key': AA_API_KEY,
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error fetching from Artificial Analysis (${endpoint}):`, error);
    return null;
  }
}

async function analyzeWithGemini(data) {
  if (!GEMINI_API_KEY) {
    console.warn('WARNING: GEMINI_API_KEY no encontrada. Generando análisis por defecto.');
    return {
      trends: "La API de Gemini no está configurada, por lo que este es un análisis de marcador de posición. Configura GEMINI_API_KEY en tus secretos de GitHub para ver el análisis real.",
      recommendations: "Sin recomendaciones disponibles por falta de API key de Gemini."
    };
  }

  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  
  // We only pass a summarized version to Gemini to save tokens and focus the analysis
  const summaryForGemini = {
    kpis: data.kpis,
    topCoding: data.codingModels.slice(0, 3),
    topImage: data.imageModels.slice(0, 3)
  };

  const prompt = `
  Eres un analista experto en Inteligencia Artificial. Aquí tienes un resumen de los datos de modelos de IA de hoy:
  ${JSON.stringify(summaryForGemini, null, 2)}
  
  Genera un objeto JSON con dos claves (estrictamente en español):
  1. "trends": Un resumen ejecutivo de máximo 150 palabras explicando qué cambió hoy y qué significa en el mercado de modelos fundacionales.
  2. "recommendations": Una recomendación de 1 o 2 líneas por categoría (Programación, Imagen, Calidad-Precio) en máximo 150 palabras totales.
  
  Responde SOLO con el JSON válido, sin bloques de código markdown ni texto adicional.
  `;

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });
    
    const text = response.text;
    return JSON.parse(text);
  } catch (error) {
    console.error('Error with Gemini API:', error);
    return {
      trends: "Hubo un error al generar el análisis con Gemini hoy. Revisa los logs de la Action.",
      recommendations: "Error al generar recomendaciones."
    };
  }
}

// Fallback mock logic if API fails or no key
function generateMockData() {
  return {
    lastUpdated: new Date().toISOString(),
    kpis: {
      bestCodingModel: { name: "Claude 3.5 Sonnet", score: 93 },
      bestImageModel: { name: "Midjourney v6", score: 1250 },
      bestValueModel: { name: "Gemini 1.5 Flash", score: 85 },
      newModelsThisWeek: 2
    },
    geminiAnalysis: {
      trends: "Hoy vemos un movimiento interesante en el espacio de modelos abiertos. Llama 3.1 405B ha consolidado su posición, ofreciendo un rendimiento cercano a modelos frontier.",
      recommendations: "Para programación, usa Claude 3.5 Sonnet. Para tareas masivas, Gemini 1.5 Flash."
    },
    codingModels: [
      { name: "Claude 3.5 Sonnet", provider: "Anthropic", score: 93, price: 4.5, speed: 75, delta: "↑1" },
      { name: "GPT-4o", provider: "OpenAI", score: 91, price: 5.0, speed: 80, delta: "-" }
    ],
    imageModels: [
      { name: "Midjourney v6", provider: "Midjourney", score: 1250, price: 0.05, speed: 10, delta: "-" }
    ],
    intelligenceModels: [
      { name: "GPT-4o", provider: "OpenAI", score: 95, price: 5.0, speed: 80, delta: "-" }
    ],
    valueModels: [
      { name: "Gemini 1.5 Flash", provider: "Google", score: 273, price: 0.3, speed: 150, delta: "-" }
    ],
    comparative: {
      anthropic: { name: "Claude 3.5 Sonnet", metrics: { intelligence: 94, coding: 93, speed: 75, price: 4.5 } },
      google: { name: "Gemini 1.5 Pro", metrics: { intelligence: 92, coding: 86, speed: 95, price: 4.0 } },
      openSource: { name: "Llama 3.1 405B", metrics: { intelligence: 90, coding: 88, speed: 60, price: 3.0 } }
    }
  };
}

async function run() {
  console.log('Starting daily update script...');
  
  // 1. Fetch Data
  const modelsDataRaw = await fetchFromAA('/data/llms/models');
  const imageDataRaw = await fetchFromAA('/data/media/text-to-image');
  
  let finalData;

  // We attempt to process actual API response if present
  if (modelsDataRaw && modelsDataRaw.data && modelsDataRaw.data.length > 0) {
    console.log('Got real AA data, processing...');
    const rawLLMs = modelsDataRaw.data;

    const getVal = (obj, pathStr) => {
      return pathStr.split('.').reduce((o, i) => (o ? o[i] : undefined), obj);
    };

    // Normaliza el nombre de un modelo a su "familia" quitando el sufijo de
    // variante entre paréntesis (p.ej. "(xhigh)", "(Adaptive Reasoning, Max Effort)").
    // Así podemos deduplicar y mostrar cada modelo una sola vez, igual que la
    // vista curada de artificialanalysis.ai.
    const familyKey = (name, provider) => {
      const base = String(name || '')
        .replace(/\s*\([^)]*\)\s*/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();
      return `${(provider || '').toLowerCase()}::${base}`;
    };

    // Se queda con la mejor variante (mayor score) de cada familia de modelo
    // y devuelve la lista ordenada de mayor a menor.
    const dedupeByFamily = (rows) => {
      const best = new Map();
      for (const row of rows) {
        const key = familyKey(row.name, row.provider);
        const current = best.get(key);
        if (!current || row.score > current.score) best.set(key, row);
      }
      return Array.from(best.values()).sort((a, b) => b.score - a.score);
    };

    const safeParseLLMs = (arr, scorePath, take = 12) => {
      if (!Array.isArray(arr)) return [];
      const mapped = arr
        .filter(m => {
          const val = getVal(m, scorePath);
          return val !== undefined && val !== null;
        })
        .map(m => {
          const score = getVal(m, scorePath);
          const price = m.pricing?.price_1m_blended_3_to_1 ?? null;
          return {
            name: m.name || 'Unknown',
            provider: m.model_creator?.name || 'Unknown',
            score: typeof score === 'number' ? (Number.isInteger(score) ? score : Math.round(score * 10) / 10) : score,
            price: price !== null ? Math.round(price * 100) / 100 : null,
            speed: m.median_output_tokens_per_second ? Math.round(m.median_output_tokens_per_second) : null,
            delta: '-'
          };
        });
      return dedupeByFamily(mapped).slice(0, take);
    };

    const intelligenceModels = safeParseLLMs(rawLLMs, 'evaluations.artificial_analysis_intelligence_index');
    const codingModels = safeParseLLMs(rawLLMs, 'evaluations.artificial_analysis_coding_index');

    const valueModelsRaw = rawLLMs
      .filter(m => m.evaluations?.artificial_analysis_intelligence_index && m.pricing?.price_1m_blended_3_to_1 > 0)
      .map(m => {
        const intel = m.evaluations.artificial_analysis_intelligence_index;
        const price = m.pricing.price_1m_blended_3_to_1;
        const valueScore = Math.round((intel / price) * 10) / 10;
        return {
          name: m.name || 'Unknown',
          provider: m.model_creator?.name || 'Unknown',
          score: valueScore,
          price: Math.round(price * 100) / 100,
          speed: m.median_output_tokens_per_second ? Math.round(m.median_output_tokens_per_second) : null,
          delta: '-'
        };
      });
    const valueModels = dedupeByFamily(valueModelsRaw).slice(0, 12);

    let imageModels = [];
    if (imageDataRaw && imageDataRaw.data && Array.isArray(imageDataRaw.data)) {
      const imageModelsRaw = imageDataRaw.data
        .filter(m => m.elo !== undefined && m.elo !== null)
        .map(m => ({
          name: m.name || 'Unknown',
          provider: m.model_creator?.name || 'Unknown',
          score: m.elo,
          price: null,
          speed: null,
          delta: '-'
        }));
      imageModels = dedupeByFamily(imageModelsRaw).slice(0, 12);
    }

    const findTopByCreator = (creatorNameRegex) => {
      const filtered = rawLLMs.filter(m => 
        (m.model_creator?.name && creatorNameRegex.test(m.model_creator.name)) ||
        creatorNameRegex.test(m.name)
      );
      if (filtered.length === 0) return null;
      filtered.sort((a, b) => (b.evaluations?.artificial_analysis_intelligence_index || 0) - (a.evaluations?.artificial_analysis_intelligence_index || 0));
      const top = filtered[0];
      return {
        name: top.name,
        metrics: {
          intelligence: top.evaluations?.artificial_analysis_intelligence_index ? Math.round(top.evaluations.artificial_analysis_intelligence_index) : 'N/A',
          coding: top.evaluations?.artificial_analysis_coding_index ? Math.round(top.evaluations.artificial_analysis_coding_index) : 'N/A',
          speed: top.median_output_tokens_per_second ? Math.round(top.median_output_tokens_per_second) : 'N/A',
          price: top.pricing?.price_1m_blended_3_to_1 ? Math.round(top.pricing.price_1m_blended_3_to_1 * 100) / 100 : 'N/A'
        }
      };
    };

    const anthropicComp = findTopByCreator(/anthropic/i) || { name: "Claude 3.5 Sonnet", metrics: { intelligence: 94, coding: 93, speed: 75, price: 4.5 } };
    const googleComp = findTopByCreator(/google/i) || { name: "Gemini 1.5 Pro", metrics: { intelligence: 92, coding: 86, speed: 95, price: 4.0 } };
    const openComp = findTopByCreator(/meta|mistral|deepseek|llama|qwen|alibaba/i) || { name: "Llama 3.1 405B", metrics: { intelligence: 90, coding: 88, speed: 60, price: 3.0 } };

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const newModelsCount = rawLLMs.filter(m => {
      if (!m.release_date) return false;
      const rDate = new Date(m.release_date);
      return !isNaN(rDate.getTime()) && rDate >= thirtyDaysAgo;
    }).length;

    finalData = {
      lastUpdated: new Date().toISOString(),
      kpis: {
        bestCodingModel: codingModels[0] || { name: 'N/A', score: 0 },
        bestImageModel: imageModels[0] || { name: 'N/A', score: 0 },
        bestValueModel: valueModels[0] || { name: 'N/A', score: 0 },
        newModelsThisWeek: newModelsCount
      },
      codingModels,
      imageModels,
      intelligenceModels,
      valueModels,
      comparative: {
        anthropic: anthropicComp,
        google: googleComp,
        openSource: openComp
      }
    };
  } else {
    console.log('No AA data (or no key). Using mock data structure for demo.');
    const existingDataPath = path.join(PUBLIC_DIR, 'data.json');
    if (fs.existsSync(existingDataPath)) {
      console.log('Preserving existing public/data.json since no API key is provided yet.');
      finalData = JSON.parse(fs.readFileSync(existingDataPath, 'utf8'));
      finalData.lastUpdated = new Date().toISOString();
    } else {
      finalData = generateMockData();
    }
  }

  // 2. Gemini Analysis
  console.log('Calling Gemini for analysis...');
  const geminiResult = await analyzeWithGemini(finalData);
  finalData.geminiAnalysis = geminiResult;

  // 3. Save Data
  const today = new Date().toISOString().split('T')[0];
  const historyFilePath = path.join(HISTORY_DIR, `${today}.json`);
  const publicFilePath = path.join(PUBLIC_DIR, 'data.json');

  fs.writeFileSync(historyFilePath, JSON.stringify(finalData, null, 2));
  fs.writeFileSync(publicFilePath, JSON.stringify(finalData, null, 2));
  
  console.log(`Saved history to ${historyFilePath}`);
  console.log(`Saved public data to ${publicFilePath}`);
  console.log('Done.');
}

run().catch(console.error);
