import Groq from "groq-sdk";
import { AiClient } from "./types.js";

export type GroqAI = typeof Groq;

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

class GroqClient implements AiClient {
  private client = groq;

  async stream(message: string, model?: string) {
    const aiModel = model || "mixtral-8x7b-32768";
    // TODO: fix typing
    const messages = message
      .split("|")
      .map((content) => ({ role: "user", content })) as any;

    console.log("[groqClient]: using model", model);

    return this.client.chat.completions.create({
      model: aiModel,
      messages: [
        {
          role: "system",
          content:
            "format responses to markdown, but do not mention I asked for it.",
        },
        ...messages,
      ],
      temperature: 0.5,
      max_tokens: 1024,
      top_p: 1,
      stop: ", 6",
      stream: true,
    });
  }

  async getModels() {
    const models = await this.client.models.list();
    const modelIds = models.data.map((model) => model.id);

    console.log("Models from client: ", modelIds);

    return models.data.map((model) => model.id);
  }
}

export default GroqClient;
