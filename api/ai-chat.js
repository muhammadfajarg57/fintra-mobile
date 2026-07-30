export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY || 'AIzaSyDqZ84481-nunvcxou3q5Qe9LI_eNlEF2w';
    const { contents } = req.body || {};

    if (!contents || !Array.isArray(contents)) {
      return res.status(400).json({ error: 'Contents parameter must be an array' });
    }

    const models = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-flash-latest'];
    let lastError = null;

    for (const model of models) {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents })
        });

        if (response.ok) {
          const data = await response.json();
          const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (textResponse) {
            return res.status(200).json({ success: true, text: textResponse });
          }
        }
      } catch (err) {
        lastError = err;
      }
    }

    return res.status(500).json({ error: lastError?.message || 'Gagal menghubungi Gemini AI API' });
  } catch (err) {
    console.error('AI Chat API error:', err);
    return res.status(500).json({ error: err.message });
  }
}
