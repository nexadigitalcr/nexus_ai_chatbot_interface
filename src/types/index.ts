export interface Assistant {
  id: string;
  name: string;
  description: string;
  avatar: string;
  role: string;
  isPrimary: boolean;
  isDefault?: boolean;
  category?: 'Featured' | 'Trending' | 'Specialized';
  creator?: string;
  chatCount?: number;
  voice?: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
  stats?: {
    users: number;
    rating: number;
    ratings: {
      five: number;
      four: number;
      three: number;
      two: number;
      one: number;
    };
  };
}

export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: number;
  assistantId: string;
  attachments?: (DocumentAttachment | ImageAttachment)[];
  feedback?: {
    isPositive: boolean;
    comment?: string;
  };
}

export interface Chat {
  id: string;
  title: string;
  assistantId: string;
  messages: Message[];
  lastUpdated: number;
  createdAt: number;
  archived?: boolean;
  hasInteraction?: boolean;
}

export interface DocumentAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  content: string;
}

export interface ImageAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  content: string;
  width?: number;
  height?: number;
}

export interface ChatState {
  messages: Message[];
  chats: Chat[];
  activeChat: Chat | null;
  activeAssistant: Assistant;
  isSidebarOpen: boolean;
  isLoading: boolean;
  pinnedAssistants: string[];
  setActiveAssistant: (assistantId: string, createNewChat?: boolean) => void;
  toggleSidebar: () => void;
  addMessage: (content: string, role: 'user' | 'assistant', assistantId: string, attachments?: (DocumentAttachment | ImageAttachment)[]) => void;
  setLoading: (isLoading: boolean) => void;
  togglePinnedAssistant: (assistantId: string) => void;
  setActiveChat: (chatId: string | null) => void;
  createNewChat: (assistantId: string) => void;
  renameChat: (chatId: string, newTitle: string) => void;
  archiveChat: (chatId: string) => void;
  deleteChat: (chatId: string) => void;
  addFeedback: (messageId: string, isPositive: boolean, comment?: string) => void;
  updateMessage: (messageId: string, newContent: string) => void;
  updateAssistantStats: (assistantId: string, rating: number) => void;
  setAssistantVoice: (assistantId: string, voice: Assistant['voice']) => void;
}

export interface VoiceSettings {
  speed: number;
  volume: number;
  voice: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
}

export interface APIConfig {
  reasoningApiKey?: string;
  customEndpoint?: string;
  useCustomApi: boolean;
}