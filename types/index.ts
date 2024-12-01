export interface Message {
  role: MessageRole;
  content: string;
  isStreaming?: boolean;
  timestamp: string;  // Make timestamp required
}

export interface Chat {
  id: number;
  threadId: string;
  title: string;
  messages: Message[];
  lastUpdated?: Date;
}

export interface StreamMessage extends Message {
  done: boolean;
}

export type MessageRole = 'user' | 'assistant';

export interface APIResponse {
  response?: string;
  status: number;
  ok: boolean;
}
