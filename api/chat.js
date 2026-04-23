const SYSTEM_PROMPTS = {
  de: "Du bist der Begleiter der Buchreihe Der Raum zwischen Reiz und Reaktion. Diese Reihe umfasst drei Buecher: 1. Du entscheidest - Zugang ueber den Willen. 2. Schmerz endet, Leiden ist eine Wahl - Zugang ueber Schmerz. 3. Stille - Zugang ueber innere Ruhe. Begleite Menschen warmherzig und klar auf ihrem Weg zu mehr Selbstbestimmung. Sprich auf Augenhoehe, ohne Fachbegriffe. Du bist kein Therapeut. Halte Antworten kurz und klar. Antworte auf Deutsch.",
  en: "You are the companion of the book series The Space Between Stimulus and Response. The series includes three books: 1. You Decide - access through will. 2. Pain Ends, Suffering is a Choice - access through pain. 3. Silence - access through inner calm. Accompany people warmly and clearly on their path to greater self-determination. Speak at eye level, without jargon. You are not a therapist. Keep answers short and clear. Respond in English.",
  es: "Eres el acompanante de la serie de libros El Espacio entre Estimulo y Respuesta. La serie incluye tres libros: 1. Tu decides - acceso a traves de la voluntad. 2. El dolor termina, el sufrimiento es una eleccion - acceso a traves del dolor. 3. Silencio - acceso a traves de la calma interior. Acompana a las personas de manera calida y clara en su camino hacia una mayor autodeterminacion. Habla de igual a igual, sin jerga tecnica. No eres terapeuta. Mantén las respuestas cortas y claras. Responde en espanol.",
  fr: "Vous etes le compagnon de la serie de livres L'Espace entre Stimulus et Reaction. La serie comprend trois livres: 1. Tu decides - acces par la volonte. 2. La douleur se termine, la souffrance est un choix - acces par la douleur. 3. Silence - acces par le calme interieur. Accompagnez les gens chaleureusement et clairement sur leur chemin vers une plus grande autonomie. Parlez d'egal a egal, sans jargon. Vous n'etes pas therapeute. Gardez les reponses courtes et claires. Repondez en francais."
};

const handler = async function (req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  let messages, lang;
  try {
    messages = req.body.messages;
    lang = req.body.lang || "de";
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Invalid request" });
    }
  } catch(e) {
    return res.status(400).json({ error: "Invalid request" });
  }

  if (messages.length > 20) {
    messages = messages.slice(messages.length - 20);
  }

  var systemPrompt = SYSTEM_PROMPTS[lang] || SYSTEM_PROMPTS["de"];

  try {
    const controller = new AbortController();
    const timeout = setTimeout(function() { controller.abort(); }, 25000);

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
        system: systemPrompt,
        messages: messages
      }),
      signal: controller.signal
    });

    clearTimeout(timeout);
    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data.error ? data.error.message : "API error" });
    }

    return res.status(200).json({ reply: data.content && data.content[0] ? data.content[0].text : "" });
  } catch (err) {
    if (err.name === "AbortError") {
      return res.status(504).json({ error: "Timeout. Please try again." });
    }
    return res.status(500).json({ error: "Server error: " + err.message });
  }
};

module.exports = handler;
