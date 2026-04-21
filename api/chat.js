const handler = async function (req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  let messages;
  try {
    messages = req.body.messages;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Ungueltige Anfrage" });
    }
  } catch(e) {
    return res.status(400).json({ error: "Ungueltige Anfrage" });
  }

  // Nur die letzten 20 Nachrichten senden um Groesse zu begrenzen
  if (messages.length > 20) {
    messages = messages.slice(messages.length - 20);
  }

  const SYSTEM_PROMPT = "Du bist der Begleiter der Buchreihe Der Raum zwischen Reiz und Reaktion. Diese Reihe umfasst drei Buecher: 1. Du entscheidest - Zugang ueber den Willen. 2. Schmerz endet, Leiden ist eine Wahl - Zugang ueber Schmerz. 3. Stille - Zugang ueber innere Ruhe. Begleite Menschen warmherzig und klar auf ihrem Weg zu mehr Selbstbestimmung. Sprich auf Augenhoehe, ohne Fachbegriffe. Du bist kein Therapeut. Halte Antworten kurz und klar.";

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 800,
        system: SYSTEM_PROMPT,
        messages: messages
      }),
      signal: controller.signal
    });

    clearTimeout(timeout);
    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data.error ? data.error.message : "API-Fehler" });
    }

    return res.status(200).json({ reply: data.content && data.content[0] ? data.content[0].text : "" });
  } catch (err) {
    if (err.name === "AbortError") {
      return res.status(504).json({ error: "Zeitueberschreitung. Bitte versuch es nochmal." });
    }
    return res.status(500).json({ error: "Serverfehler: " + err.message });
  }
};

module.exports = handler;
