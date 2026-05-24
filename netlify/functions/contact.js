exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ success: false, message: 'Method not allowed' }) };
  }

  try {
    if (!process.env.WEB3FORMS_KEY) {
      console.error('WEB3FORMS_KEY environment variable is not set');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ success: false, message: 'Server misconfiguration — missing API key' }),
      };
    }

    if (!event.body) {
      return { statusCode: 400, headers, body: JSON.stringify({ success: false, message: 'Empty request body' }) };
    }

    const payload = JSON.parse(event.body);

    // reject honeypot submissions
    if (payload.botcheck) {
      return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
    }

    const res = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...payload,
        access_key: process.env.WEB3FORMS_KEY,
        subject: `New inquiry — ${payload.business || 'DevStudio Hub'}`,
        reply_to: payload.email || undefined,
      }),
    });

    const text = await res.text();
    let data;
    try { data = JSON.parse(text); } catch { data = { success: false, message: text }; }
    return { statusCode: 200, headers, body: JSON.stringify(data) };

  } catch (err) {
    console.error('Contact function error:', err.message);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, message: 'Server error' }),
    };
  }
};

