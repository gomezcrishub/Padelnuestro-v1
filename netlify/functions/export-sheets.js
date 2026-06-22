// Netlify Serverless Function for proxying Google Apps Script requests
// This allows the app to work seamlessly when deployed to Netlify

exports.handler = async function (event, context) {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: false, error: 'Method Not Allowed' }),
    };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { spreadsheetId, tournamentName, category, rows } = body;

    const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzUFlGii-VBnOZqow6PndayGxLN2CcrMuybIwHvS2RnLzNqEjPeGNsmHoC6UvDSgMUyQw/exec';

    console.log(`[Netlify Function] Processing export for match: ${category} - ${tournamentName}`);

    // Since Netlify is running on Node 18+, we have native global fetch!
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({
        spreadsheetId,
        tournamentName,
        category,
        rows,
      }),
    });

    if (!response.ok) {
      return {
        statusCode: response.status,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: false,
          error: `Google Apps Script returned status ${response.status}`,
        }),
      };
    }

    const text = await response.text();
    let result;
    try {
      result = JSON.parse(text);
    } catch (e) {
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: false,
          error: 'La respuesta de Google Apps Script no es un JSON válido. Revisa que el script esté publicado correctamente para "Cualquiera" (Anyone).',
        }),
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*', // Extra safety for CORS
      },
      body: JSON.stringify(result),
    };
  } catch (error) {
    console.error('[Netlify Function] Error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: false,
        error: error.message || 'Error interno en la Serverless Function de Netlify',
      }),
    };
  }
};
