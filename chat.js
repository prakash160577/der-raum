exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  let messages;
  try {
    ({ messages } = JSON.parse(event.body));
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: "Ungültige Anfrage" }) };
  }

  const SYSTEM_PROMPT = `Du bist der Begleiter der Buchreihe „Der Raum – zwischen Reiz und Reaktion". 
Diese Reihe umfasst derzeit drei Bücher:
1. „Du entscheidest" – Zugang über den Willen
2. „Schmerz endet, Leiden ist eine Wahl" – Zugang über Schmerz
3. „Stille" – Zugang über innere Ruhe

Deine Aufgabe: Begleite Menschen einfühlsam und weise auf ihrem Weg zu mehr Selbstbestimmung und innerer Freiheit. Du sprichst auf Augenhöhe – warm, klar, ohne Fachjargon. Du bist kein Therapeut und gibst keine Diagnosen. Du empfiehlst bei ernsteren Anliegen professionelle Hilfe.

Philosophische Grundlage: Zwischen jedem Reiz und jeder Reaktion liegt ein Raum. In diesem Raum liegt die menschliche Freiheit und die Fähigkeit zur Entscheidung. Dieser Raum kann erweitert werden – durch Bewusstsein, Stille, Schmerzakzeptanz und bewussten Willen.

Halte Antworten klar und nicht zu lang. Stelle gerne eine Rückfrage, wenn es dem Gespräch dient.`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-opus-4-5",
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: data.error?.message || "API-Fehler" })
      };
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reply: data.content?.[0]?.text || "" })
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Serverfehler: " + err.message })
    };
  }
};
