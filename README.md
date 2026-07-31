# AI Trends Dashboard

Un dashboard visual estático y elegante que se actualiza automáticamente todos los días con datos del mercado de Inteligencia Artificial (modelos LLM, Text-to-Image, etc.), impulsado por **Artificial Analysis** y **Gemini**.

## Arquitectura

- **Frontend Estático:** HTML, CSS y JS vanilla sin frameworks pesados, estilizado con Tailwind CSS vía CDN.
- **Automatización:** Un script de Node.js se ejecuta diariamente vía GitHub Actions a las 07:00 CDMX.
- **Procesamiento de Datos:** El script obtiene los datos de la API de Artificial Analysis, calcula scores de valor y cambios, y llama a la API de Gemini para redactar un resumen ejecutivo y recomendaciones diarias en español.
- **Despliegue Automático:** Genera los archivos en `public/data.json` y se despliega directamente a GitHub Pages de manera 100% gratuita y sin servidores.

## Guía de Instalación y Configuración

Sigue estos pasos para hacer un fork de este repositorio y poner tu propio dashboard a funcionar:

### 1. Clona/Haz Fork del Repositorio
Crea un fork de este repositorio en tu propia cuenta de GitHub para que puedas ejecutar las GitHub Actions y alojar la página.

### 2. Configura los GitHub Secrets
Por seguridad, las API keys NUNCA deben estar en el código. Debes añadirlas a los secrets de tu repositorio:
1. Ve a la pestaña **Settings** > **Secrets and variables** > **Actions** en tu repositorio de GitHub.
2. Haz clic en **New repository secret**.
3. Crea el secreto `AA_API_KEY` con tu API Key de [Artificial Analysis](https://artificialanalysis.ai/).
4. Crea el secreto `GEMINI_API_KEY` con tu API Key de [Google AI Studio](https://aistudio.google.com/).

### 3. Activa GitHub Pages
1. Ve a **Settings** > **Pages**.
2. En *Source*, selecciona **GitHub Actions** (ya que el workflow `daily-update.yml` hace el deploy automático a Pages).

### 4. Ejecuta la Acción Manualmente (Primera vez)
1. Ve a la pestaña **Actions**.
2. Selecciona **Daily Dashboard Update** en la barra lateral izquierda.
3. Haz clic en el botón **Run workflow** a la derecha. 
Esto ejecutará el script, traerá los últimos datos, generará el dashboard y lo subirá a GitHub Pages. En unos minutos, tendrás la URL pública lista (típicamente `https://tu-usuario.github.io/ai-trends-dashboard`).

### 5. Configurar como Nueva Pestaña (Google Chrome)
Para abrir este dashboard cada vez que abras una nueva pestaña:
1. Instala una extensión como [New Tab Redirect](https://chrome.google.com/webstore/detail/new-tab-redirect/icpgjfneehieebagbmdbhnlpiopdcmna) u otra similar para personalizar la nueva pestaña.
2. Abre la configuración de la extensión y pega la URL de tu GitHub Pages (`https://tu-usuario.github.io/ai-trends-dashboard/`).
3. ¡Listo! Ahora verás el resumen de tendencias de IA todos los días al abrir una pestaña.

## Manejo de Errores
- Si la API de Artificial Analysis falla un día, el dashboard preservará el último archivo `data.json` disponible para no romper el sitio.
- Si no configuras las API keys, el dashboard continuará funcionando utilizando "Mock Data" (datos falsos de demostración) pero no se actualizará con la realidad.

## Créditos
- Datos provistos bajo licencia por [Artificial Analysis](https://artificialanalysis.ai).
- Análisis generado por Google Gemini.
- Dashboard creado vía Google AI Studio.
