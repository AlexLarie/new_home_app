const functions = require("firebase-functions");
const fetch = require("node-fetch");

exports.getRecipe = functions.https.onRequest(async (req, res) => {
  // CORS headers
  res.set("Access-Control-Allow-Origin", "*"); // Allow all origins
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS"); // Allow POST and OPTIONS methods
  res.set("Access-Control-Allow-Headers", "Content-Type"); // Allow Content-Type header

  // Handle preflight OPTIONS request
  if (req.method === "OPTIONS") {
    return res.status(204).send(""); // Respond with no content for OPTIONS
  }

  // Handle POST request
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed"); // Method not allowed
  }

  const apiKey = process.env.OPENAI_API_KEY;
  const { requestText } = req.body;

  if (!requestText) {
    return res.status(400).send("Request text is missing");
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `Создай JSON с ингредиентами и подробным полным рецептом для ${requestText}. Ответ должен быть строго в формате JSON:{
               "groceries": ["ингредиент 1 - количество", "ингредиент 2 - количество", ...],
               "recipe": "Шаг 1. Описание. Шаг 2. Описание.",
               "imagePrompt": "Описание изображения готового блюда."
             }`,
          },
        ],
      }),
    });

    const data = await response.json();
    if (!data.choices || !data.choices.length) {
      return res.status(404).send("No data found");
    }

    res.json(data);
  } catch (error) {
    console.error("Error processing request:", error);
    res.status(500).send("Error processing request");
  }
});
