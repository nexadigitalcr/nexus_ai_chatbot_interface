import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pin, PinOff, Search, MoreVertical, ChevronLeft, MessageSquare, Trash2, Edit2, Archive, Compass } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useChatStore } from '../store/chat';
import { assistants } from '../data/assistants';
import { cn } from '../lib/utils';
import * as Dialog from '@radix-ui/react-dialog';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Chat } from '../types';
import { useGPTStore } from '../store/gpt';
import { useAuthStore } from '../store/auth';

const formatChatTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }
  
  if (date.toDateString() === yesterday.toDateString()) {
    return `Yesterday ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
  }
  
  if (date > sevenDaysAgo) {
    return `${date.toLocaleDateString('en-US', { weekday: 'long' })} ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
  }
  
  if (date > thirtyDaysAgo) {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  }
  
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' });
};

export default function Sidebar() {
  const { 
    activeAssistant, 
    isSidebarOpen, 
    setActiveAssistant, 
    toggleSidebar, 
    pinnedAssistants, 
    togglePinnedAssistant,
    chats,
    activeChat,
    setActiveChat,
    renameChat,
    archiveChat,
    deleteChat
  } = useChatStore();

  const { gpts } = useGPTStore();
  const { isAdmin } = useAuthStore();
  
  const [isGPTListOpen, setIsGPTListOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [isRenamingChat, setIsRenamingChat] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isSearchExpanded && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchExpanded]);

  // Combine built-in assistants with custom GPTs that are public or (if admin) private
  const allAssistants = [
    ...assistants,
    ...gpts
      .filter(gpt => gpt.visibility === 'public' || (isAdmin && gpt.visibility !== 'draft'))
      .map(gpt => ({
        id: gpt.id,
        name: gpt.name,
        description: gpt.description,
        avatar: gpt.avatar,
        role: gpt.role,
        isPrimary: false,
        voice: 'alloy' as const,
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
      }))
  ];

  // Ensure each assistant only appears once in the mainAssistants list
  const mainAssistants = allAssistants.filter(a => {
    return pinnedAssistants.includes(a.id);
  });
  
  const otherAssistants = allAssistants.filter(a => 
    !pinnedAssistants.includes(a.id) &&
    (a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
     a.role.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredChats = chats.filter(chat => {
    if (!chat.hasInteraction) return false;
    
    const assistant = allAssistants.find(a => a.id === chat.assistantId);
    if (!searchQuery) return true;
    
    const searchLower = searchQuery.toLowerCase();
    const titleMatch = chat.title.toLowerCase().includes(searchLower);
    const assistantMatch = assistant?.name.toLowerCase().includes(searchLower);
    const dateMatch = formatChatTime(chat.lastUpdated).toLowerCase().includes(searchLower);
    
    return titleMatch || assistantMatch || dateMatch;
  });

  const groupChatsByDate = (chats: Chat[]) => {
    const now = new Date();
    const today = now.setHours(0, 0, 0, 0);
    const yesterday = today - 86400000;
    const lastWeek = today - 7 * 86400000;
    const lastMonth = today - 30 * 86400000;

    return {
      today: chats.filter(chat => chat.lastUpdated >= today),
      yesterday: chats.filter(chat => chat.lastUpdated >= yesterday && chat.lastUpdated < today),
      lastWeek: chats.filter(chat => chat.lastUpdated >= lastWeek && chat.lastUpdated < yesterday),
      older: chats.filter(chat => chat.lastUpdated < lastWeek)
    };
  };

  const groupedChats = groupChatsByDate(filteredChats);

  const handleRenameSubmit = (chatId: string) => {
    if (newTitle.trim()) {
      renameChat(chatId, newTitle.trim());
    }
    setIsRenamingChat(null);
    setNewTitle('');
  };

  const handleTestGPT = (gptId: string) => {
    // Validate GPT configuration before testing
    const gpt = gpts.find(g => g.id === gptId);
    if (!gpt) {
      console.error('GPT not found');
      return;
    }

    if (!gpt.gptId || !gpt.apiConfig?.apiKey) {
      alert('This GPT is not properly configured. Please set up the API key and GPT ID first.');
      return;
    }

    navigate(`/chat?assistant=${gptId}`);
  };

  const ChatGroup = ({ title, chats }: { title: string; chats: Chat[] }) => {
    if (chats.length === 0) return null;

    return (
      <div className="mb-4">
        <h3 className="text-xs font-medium text-gray-400 uppercase px-2 mb-2">{title}</h3>
        <div className="space-y-1">
          {chats.map(chat => (
            <div key={`chat-${chat.id}`} className="group relative">
              <button
                onClick={() => setActiveChat(chat.id)}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-sm",
                  activeChat?.id === chat.id
                    ? "bg-[#343541] text-white"
                    : "text-gray-300 hover:bg-[#2A2B32]"
                )}
              >
                <MessageSquare size={16} className="flex-shrink-0" />
                {isRenamingChat === chat.id ? (
                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleRenameSubmit(chat.id);
                    }}
                    className="flex-1"
                  >
                    <input
                      type="text"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      className="w-full bg-[#40414F] text-white rounded px-2 py-1 text-sm focus:outline-none"
                      autoFocus
                      onBlur={() => handleRenameSubmit(chat.id)}
                    />
                  </form>
                ) : (
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{chat.title}</div>
                    <div className="text-xs text-gray-400">{formatChatTime(chat.lastUpdated)}</div>
                  </div>
                )}
              </button>
              
              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                <DropdownMenu.Root>
                  <DropdownMenu.Trigger asChild>
                    <button 
                      className="p-1.5 text-gray-400 hover:text-white transition-colors opacity-0 group-hover:opacity-100 rounded-md hover:bg-[#40414F]"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreVertical size={14} />
                    </button>
                  </DropdownMenu.Trigger>
                  
                  <DropdownMenu.Portal>
                    <DropdownMenu.Content 
                      className="z-[100] w-48 bg-[#202123] rounded-lg shadow-lg py-1 animate-in data-[side=right]:slide-in-from-left-2 data-[side=left]:slide-in-from-right-2"
                      sideOffset={5}
                      align="end"
                      side="right"
                    >
                      <DropdownMenu.Item
                        className="flex items-center gap-2 px-2.5 py-1.5 text-sm text-gray-300 hover:text-white hover:bg-[#40414F] cursor-pointer outline-none"
                        onSelect={() => {
                          setIsRenamingChat(chat.id);
                          setNewTitle(chat.title);
                        }}
                      >
                        <Edit2 size={14} />
                        <span>Rename</span>
                      </DropdownMenu.Item>
                      <DropdownMenu.Item
                        className="flex items-center gap-2 px-2.5 py-1.5 text-sm text-gray-300 hover:text-white hover:bg-[#40414F] cursor-pointer outline-none"
                        onSelect={() => archiveChat(chat.id)}
                      >
                        <Archive size={14} />
                        <span>Archive</span>
                      </DropdownMenu.Item>
                      <DropdownMenu.Separator className="h-px my-1 bg-[#2A2B32]" />
                      <DropdownMenu.Item
                        className="flex items-center gap-2 px-2.5 py-1.5 text-sm text-red-400 hover:text-red-300 hover:bg-[#40414F] cursor-pointer outline-none"
                        onSelect={() => deleteChat(chat.id)}
                      >
                        <Trash2 size={14} />
                        <span>Delete</span>
                      </DropdownMenu.Item>
                    </DropdownMenu.Content>
                  </DropdownMenu.Portal>
                </DropdownMenu.Root>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <>
      <AnimatePresence mode="wait">
        {isSidebarOpen && (
          <motion.aside
            key="sidebar"
            initial={{ x: -280, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -280, opacity: 0 }}
            transition={{ 
              type: "spring", 
              stiffness: 300, 
              damping: 30,
              mass: 0.8
            }}
            className="fixed left-0 top-0 h-full w-[280px] bg-[#202123] z-50 flex flex-col shadow-xl"
          >
            <div className="flex items-center justify-between p-2 border-b border-[#2A2B32]">
              <div className="w-full flex items-center gap-2 p-3 text-white font-semibold truncate pr-12">
                NEXUS AI
              </div>
              <button
                onClick={toggleSidebar}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-white transition-colors"
                aria-label="Close sidebar"
              >
                <ChevronLeft size={24} />
              </button>
            </div>

            <div className="px-2 py-3 border-b border-[#2A2B32]">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsSearchExpanded(!isSearchExpanded)}
                  className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg"
                >
                  <Search size={20} />
                </button>
                <AnimatePresence>
                  {isSearchExpanded && (
                    <motion.div
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: "auto", opacity: 1 }}
                      exit={{ width: 0, opacity: 0 }}
                      className="flex-1"
                    >
                      <input
                        ref={searchInputRef}
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Buscar chats..."
                        className="w-full bg-[#40414F] text-white rounded-lg px-3 py-2 text-sm focus:outline-none"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="px-2 py-3">
                <div className="space-y-1">
                  {mainAssistants.map((assistant, index) => (
                    <motion.div
                      key={`sidebar-main-${assistant.id}-${index}`}
                      className="flex items-center gap-2"
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      <button
                        onClick={() => setActiveAssistant(assistant.id)}
                        className={cn(
                          "flex-1 flex items-center gap-3 p-3 rounded-lg transition-colors text-sm",
                          activeAssistant.id === assistant.id
                            ? "bg-[#343541] text-white"
                            : "text-gray-300 hover:bg-[#2A2B32]"
                        )}
                      >
                        <img
                          src={assistant.avatar}
                          alt={assistant.name}
                          className="w-6 h-6 rounded-full object-cover"
                        />
                        <div className="text-left truncate font-medium">
                          {assistant.name}
                        </div>
                      </button>
                      <button
                        onClick={() => togglePinnedAssistant(assistant.id)}
                        className="p-2 text-gray-400 hover:text-white transition-colors"
                      >
                        <PinOff size={16} />
                      </button>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className="px-2 py-3">
                <ChatGroup title="Today" chats={groupedChats.today} />
                <ChatGroup title="Yesterday" chats={groupedChats.yesterday} />
                <ChatGroup title="Last 7 Days" chats={groupedChats.lastWeek} />
                <ChatGroup title="Older" chats={groupedChats.older} />
              </div>
            </div>
            
            {/* Explore Assistants Button */}
            <div className="px-2 py-3 mt-auto border-t border-[#2A2B32]">
              <Link
                to="/explore"
                className="flex items-center gap-3 p-3 text-gray-300 hover:text-white hover:bg-[#2A2B32] rounded-lg transition-colors"
              >
                <Compass size={20} />
                <span className="font-medium">Explorar Asistentes</span>
              </Link>
            </div>
        </motion.aside>
      )}
    </AnimatePresence>
  </>
  );
}

export { Sidebar }