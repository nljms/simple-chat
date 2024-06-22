import { Stream } from "groq-sdk/lib/streaming";
import { Chat } from "groq-sdk/resources/index";

import { Stream as OpenAIStream } from "openai/streaming";
import { ChatCompletionChunk } from "openai/resources/index";

type ClientStream =
  | Stream<Chat.ChatCompletionChunk>
  | OpenAIStream<ChatCompletionChunk>;

export type AiClient = {
  stream: (message: string) => Promise<ClientStream>;
};