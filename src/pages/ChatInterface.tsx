import React, { useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { Sidebar } from '../components/Sidebar';
import ChatMessages from '../components/ChatMessages';
import { ChatInput } from '../components/ChatInput';
import { Header } from '../components/Header';
import { useChatStore } from '../store/chat';
import { useGPTStore } from '../store/gpt';
import { useAuthStore } from '../store/auth';

export const ChatInterface: React.FC = () => {
  const { isSidebarOpen, toggleSidebar, messages, setActiveAssistant } = useChatStore();
  const { gpts, setActiveGPT } = useGPTStore();
  const { isAdmin } = useAuthStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const assistantId = params.get('assistant');
    
    if (assistantId) {
      const gpt = gpts.find(g => g.id === assistantId);
      
      if (gpt && (gpt.visibility === 'public' || (isAdmin && gpt.visibility !== 'draft'))) {
        setActiveAssistant(assistantId);
        setActiveGPT(assistantId);
      }
      
      navigate('/chat', { replace: true });
    }
  }, [location, gpts, setActiveAssistant, setActiveGPT, navigate, isAdmin]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="flex h-screen bg-[#121212] text-white font-roboto">
      {/* Toggle button when sidebar is closed */}
      {!isSidebarOpen && (
        <button
          onClick={toggleSidebar}
          className="fixed top-4 left-4 z-50 p-2 text-gray-300 hover:text-white transition-colors bg-[#202123] rounded-lg shadow-lg"
          aria-label="Open sidebar"
        >
          <Menu size={20} />
        </button>
      )}
      
      <Sidebar />
      
      <main 
        className="flex-1 flex flex-col transition-all duration-300 ease-in-out"
        style={{
          marginLeft: isSidebarOpen ? '280px' : '48px',
          width: isSidebarOpen ? 'calc(100% - 280px)' : 'calc(100% - 48px)'
        }}
      >
        <Header />
        <div className="flex-1 relative overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto pb-40">
            <div className="max-w-[768px] mx-auto w-full px-4 sm:px-6">
              <ChatMessages />
              <div ref={messagesEndRef} />
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0">
            <div className="max-w-[768px] mx-auto w-full px-4 sm:px-6">
              <ChatInput />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};