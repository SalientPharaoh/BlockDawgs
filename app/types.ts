export interface Message {
  content: string;
  role: 'user' | 'assistant';
}

export interface StreamMessage extends Message {
  isStreaming?: boolean;
  fullContent?: string;
}

export interface Chat {
  id: string;
  messages: Message[];
}

export interface QuickAction {
  title: string;
  description: string;
  action: () => void;
}

export interface ChatMode {
  type: 'chat' | 'command';
  label: string;
}

export interface DBQueryResult {
  query: {
    model: {
      messages: {
        kwargs: {
          content: string;
          type: string;
        };
      }[];
    };
  };
  thread_id: string;
}

export function convertDBMessagesToChat(dbMessages: any[], chatId: string, threadId: string): Chat {
  const messages: Message[] = dbMessages.map((msg: any) => ({
    content: msg.kwargs.content.trim(),
    role: msg.kwargs.type as 'user' | 'assistant',
    timestamp: new Date().toISOString() // Since DB messages might not have timestamp
  }));

  return {
    id: chatId,
    messages: messages
  };
}
  };
}
