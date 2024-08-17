const functions = require('firebase-functions');
const axios = require('axios');

// An example function that interacts with the OpenAI API
exports.processRecipeRequest = functions.https.onCall(async (data) => {
  const openaiApiKey = functions.config().myapp.openai_key; // Access the stored API key

  if (!data || !data.requestText) {
    throw new functions.https.HttpsError('invalid-argument', 'The function must be called with "requestText" argument.');
  }

  const apiRequestBody = {
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content: `Create a JSON with ingredients and a detailed recipe for ${data.requestText}. The response must be in JSON format.`,
      },
    ],
  };

  try {
    const response = await axios.post('https://api.openai.com/v1/chat/completions', apiRequestBody, {
      headers: {
        Authorization: `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
    });

    const content = response.data.choices[0].message.content;
    const parsedContent = JSON.parse(content);

    return { data: parsedContent };
  } catch (error) {
    console.error('Error processing message:', error);
    throw new functions.https.HttpsError('internal', 'Error processing request with OpenAI.');
  }
});

