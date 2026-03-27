const { OpenRouter } = require("@openrouter/sdk");
const openrouter = new OpenRouter({ apiKey: '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' });

(async () => {
  try {
    const stream = await openrouter.chat.send({
      model: "nvidia/nemotron-3-super-120b-a12b:free",
      messages: [{ role: "user", content: "hello" }],
      stream: true
    });
    console.log("STREAM CREATED.");
    let response = "";
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) { response += content; process.stdout.write(content); }
      if (chunk.usage) console.log("\\nReasoning tokens:", chunk.usage.reasoningTokens);
    }
  } catch(e) {
    console.log("FATAL:", e.message);
  }
})();
