import { groqClient, openAiClient, redisClient } from "../clients/index.js";

import { AiClient, CacheMachine } from "../clients/types.js";
import { ChatRepository } from "../repositories/chats.repository.js";
import { chatRepository } from "../repositories/index.js";

/**
 * chat service
 */
export class ChatService {
  constructor(
    private readonly client: AiClient,
    private readonly cacheMachine: CacheMachine,
    private readonly chatRepo: ChatRepository
  ) {
    console.log("Chat service created.");
  }

  /**
   * send a message.
   */
  async sendMessage(sessionId: string, message: string, model?: string) {
    const cacheId = sessionId;

    const cache = (await this.cacheMachine.get(cacheId)) ?? "";
    const cachedMessage = [cache, message].join("|");
    await this.cacheMachine.set(cacheId, cachedMessage);
    const streams = await this.client.stream(cachedMessage, model);

    return streams;
  }

  /**
   * get chat history.
   */
  async getChatHistory(sessionId: string) {
    return this.chatRepo.getChatHistory(sessionId);
  }

  /**
   * get all chat sessions.
   */
  async getChatSessions() {
    return this.chatRepo.getChatSessions();
  }

  /**
   * Gets all available models from the client.
   * @returns
   *
   * @example ["gpt-3.5-turbo-16k", "gpt-3.5-turbo-16k-v2"]
   */
  async getModels() {
    const cacheId = "models";
    const cache = await this.cacheMachine.get(cacheId);

    if (!cache) {
      const models = await this.client.getModels();
      await this.cacheMachine.set(cacheId, models.join("|"));
      return models;
    }

    return cache.split("|");
  }

  async saveMessages(
    sessionId: string,
    message: { user: string; message: string }[]
  ) {
    return this.chatRepo.saveMessages(sessionId, message);
  }

  /**
   * create a new instance of a chat service.
   */
  static fromGroq() {
    return new ChatService(groqClient, redisClient, chatRepository);
  }

  static fromOpenAI() {
    return new ChatService(openAiClient, redisClient, chatRepository);
  }
}
