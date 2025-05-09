import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ChatState, Message, DocumentAttachment, Chat, Assistant } from '../types';
import { assistants } from '../data/assistants';
import { generateId } from '../lib/utils';
import { useGPTStore } from './gpt';

const createChat = (assistantId: string): Chat => {
  const assistant = assistants.find(a => a.id === assistantId);
  return {
    id: generateId(),
    title: assistant?.name || 'New Chat',
    assistantId,
    messages: [],
    lastUpdated: Date.now(),
    createdAt: Date.now(),
    archived: false,
    hasInteraction: false
  };
};

// Default assistant to use when no assistants are available
const defaultAssistant: Assistant = {
  id: 'default',
  name: 'Assistant',
  description: 'A helpful AI assistant',
  avatar: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=64&h=64&fit=crop&crop=faces&q=80',
  role: 'Assistant',
  isPrimary: false,
  voice: 'alloy',
  stats: {
    users: 0,
    rating: 5.0,
    ratings: {
      five: 1,
      four: 0,
      three: 0,
      two: 0,
      one: 0
    }
  }
};

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      messages: [],
      chats: [],
      activeChat: null,
      activeAssistant: getInitialAssistant(),
      isSidebarOpen: window.innerWidth >= 1024,
      isLoading: false,
      pinnedAssistants: [],
      
      setActiveAssistant: (assistantId: string, createNewChat: boolean = true) => 
        set(state => {
          const newAssistant = assistants.find(a => a.id === assistantId);
          const gptStore = useGPTStore.getState();
          
          // Find assistant in either built-in assistants or custom GPTs
          const assistant = newAssistant || gptStore.gpts.find(g => g.id === assistantId);
          if (!assistant) return state;

          const updates: Partial<ChatState> = {
            activeAssistant: assistant
          };

          if (createNewChat) {
            const newChat = createChat(assistantId);
            updates.chats = [newChat, ...state.chats];
            updates.activeChat = newChat;
            updates.messages = [];
          }

          // Sync with GPT store
          gptStore.setActiveGPT(assistantId);

          if (window.innerWidth < 1024) {
            updates.isSidebarOpen = false;
          }

          return { ...state, ...updates };
        }),
        
      toggleSidebar: () => 
        set(state => ({ isSidebarOpen: !state.isSidebarOpen })),
        
      addMessage: (content: string, role: 'user' | 'assistant', assistantId: string, attachments?: DocumentAttachment[]) =>
        set(state => {
          const newMessage: Message = {
            id: generateId(),
            content,
            role,
            timestamp: Date.now(),
            assistantId,
            attachments
          };

          let updatedChat: Chat;
          let updatedChats: Chat[];

          if (state.activeChat) {
            updatedChat = {
              ...state.activeChat,
              messages: [...state.activeChat.messages, newMessage],
              lastUpdated: Date.now(),
              hasInteraction: true
            };
            updatedChats = state.chats.map(chat => 
              chat.id === updatedChat.id ? updatedChat : chat
            );
          } else {
            updatedChat = createChat(assistantId);
            updatedChat.messages = [newMessage];
            updatedChat.hasInteraction = true;
            updatedChats = [updatedChat, ...state.chats];
          }

          return {
            messages: updatedChat.messages,
            chats: updatedChats,
            activeChat: updatedChat
          };
        }),
        
      setLoading: (isLoading: boolean) =>
        set({ isLoading }),

      togglePinnedAssistant: (assistantId: string) =>
        set(state => ({
          pinnedAssistants: state.pinnedAssistants.includes(assistantId)
            ? state.pinnedAssistants.filter(id => id !== assistantId)
            : [...state.pinnedAssistants, assistantId]
        })),

      setActiveChat: (chatId: string | null) =>
        set(state => {
          if (!chatId) {
            return {
              activeChat: null,
              messages: []
            };
          }

          const chat = state.chats.find(c => c.id === chatId);
          if (!chat) return state;

          const assistant = assistants.find(a => a.id === chat.assistantId);
          if (!assistant) {
            // If assistant not found, use the first available assistant or default
            const defaultAssistant = assistants.length > 0 ? assistants[0] : state.activeAssistant;
            return {
              activeChat: chat,
              messages: chat.messages,
              activeAssistant: defaultAssistant
            };
          }

          return {
            activeChat: chat,
            messages: chat.messages,
            activeAssistant: assistant
          };
        }),

      createNewChat: (assistantId: string) =>
        set(state => {
          const newChat = createChat(assistantId);
          return {
            chats: [newChat, ...state.chats],
            activeChat: newChat,
            messages: []
          };
        }),

      renameChat: (chatId: string, newTitle: string) =>
        set(state => ({
          chats: state.chats.map(chat =>
            chat.id === chatId
              ? { ...chat, title: newTitle }
              : chat
          )
        })),

      archiveChat: (chatId: string) =>
        set(state => ({
          chats: state.chats.map(chat =>
            chat.id === chatId
              ? { ...chat, archived: true }
              : chat
          ),
          activeChat: state.activeChat?.id === chatId ? null : state.activeChat,
          messages: state.activeChat?.id === chatId ? [] : state.messages
        })),

      deleteChat: (chatId: string) =>
        set(state => ({
          chats: state.chats.filter(chat => chat.id !== chatId),
          activeChat: state.activeChat?.id === chatId ? null : state.activeChat,
          messages: state.activeChat?.id === chatId ? [] : state.messages
        })),

      addFeedback: (messageId: string, isPositive: boolean, comment?: string) =>
        set(state => {
          const updatedMessages = state.messages.map(message =>
            message.id === messageId
              ? { ...message, feedback: { isPositive, comment } }
              : message
          );

          const updatedChats = state.chats.map(chat => ({
            ...chat,
            messages: chat.messages.map(message =>
              message.id === messageId
                ? { ...message, feedback: { isPositive, comment } }
                : message
            )
          }));

          return {
            messages: updatedMessages,
            chats: updatedChats
          };
        }),

      updateMessage: (messageId: string, newContent: string) =>
        set(state => {
          const updatedMessages = state.messages.map(message =>
            message.id === messageId
              ? { ...message, content: newContent }
              : message
          );

          const updatedChats = state.chats.map(chat => ({
            ...chat,
            messages: chat.messages.map(message =>
              message.id === messageId
                ? { ...message, content: newContent }
                : message
            )
          }));

          return {
            messages: updatedMessages,
            chats: updatedChats
          };
        }),

      updateAssistantStats: (assistantId: string, rating: number) =>
        set(state => {
          const assistant = assistants.find(a => a.id === assistantId);
          if (!assistant || !assistant.stats) return state;

          const ratingKey = rating === 5 ? 'five' :
                          rating === 4 ? 'four' :
                          rating === 3 ? 'three' :
                          rating === 2 ? 'two' : 'one';

          assistant.stats.ratings[ratingKey]++;
          assistant.stats.users++;

          const totalRatings = Object.values(assistant.stats.ratings).reduce((a, b) => a + b, 0);
          const weightedSum = (assistant.stats.ratings.five * 5 +
                             assistant.stats.ratings.four * 4 +
                             assistant.stats.ratings.three * 3 +
                             assistant.stats.ratings.two * 2 +
                             assistant.stats.ratings.one) / totalRatings;

          assistant.stats.rating = Number(weightedSum.toFixed(1));

          return state;
        }),
        
      setAssistantVoice: (assistantId: string, voice: Assistant['voice']) =>
        set(state => {
          const assistantIndex = assistants.findIndex(a => a.id === assistantId);
          if (assistantIndex === -1) return state;
          
          assistants[assistantIndex].voice = voice;
          
          // If this is the active assistant, update it
          if (state.activeAssistant.id === assistantId) {
            return {
              ...state,
              activeAssistant: {
                ...state.activeAssistant,
                voice
              }
            };
          }
          
          return state;
        })
    }),
    {
      name: 'chat-storage',
    }
  )
);

// Helper function to get the initial assistant
function getInitialAssistant(): Assistant {
  // If there are assistants available, use the default one or the first one
  if (assistants.length > 0) {
    const defaultAssistant = assistants.find(a => a.isDefault);
    return defaultAssistant || assistants[0];
  }
  
  // Otherwise use the default assistant
  return defaultAssistant;
}