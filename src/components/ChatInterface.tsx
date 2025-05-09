import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ChatMessages from '../components/ChatMessages';
import { ChatInput } from '../components/ChatInput';
import { Header } from '../components/Header';
import { Sidebar } from '../components/Sidebar';
import { useChatStore } from '../store/chat';
import { useGPTStore } from '../store/gpt';
import { useAuthStore } from '../store/auth';

export const ChatInterface: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isSidebarOpen, toggleSidebar, setActiveAssistant } = useChatStore();
  const { gpts } = useGPTStore();
  const { isAdmin } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for assistant parameter in URL
    const params = new URLSearchParams(location.search);
    const assistantId = params.get('assistant');
    
    if (assistantId) {
      // Find the GPT in the store
      const gpt = gpts.find(g => g.id === assistantId);
      
      // Only set active assistant if:
      // 1. GPT exists
      // 2. GPT is public OR user is admin (can access private GPTs)
      if (gpt && (gpt.visibility === 'public' || (isAdmin && gpt.visibility !== 'draft'))) {
        setActiveAssistant(assistantId);
      }
      
      // Remove the assistant parameter from URL
      navigate('/chat', { replace: true });
    }
    
    setIsLoading(false);
  }, [location, gpts, setActiveAssistant, navigate, isAdmin]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#121212]">
        <div className="loader"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#121212] text-white font-roboto">
      {/* Toggle button when sidebar is closed */}
      {!isSidebarOpen && (
        <button
          onClick={toggleSidebar}
          className="fixed top-4 left-4 z-50 p-2 text-gray-300 hover:text-white transition-colors bg-[#202123] rounded-lg shadow-lg"
          aria-label="Open sidebar"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
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