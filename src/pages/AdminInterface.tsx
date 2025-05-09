import React, { useEffect } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Plus, LogOut, Database } from 'lucide-react';
import { useAuthStore } from '../store/auth';
import { useGPTStore } from '../store/gpt';
import { GPTDashboard } from './admin/GPTDashboard';
import { CreateGPT } from './admin/CreateGPT';
import { EditGPT } from './admin/EditGPT';

export const AdminInterface: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuthStore();
  const { importFromAssistants } = useGPTStore();

  useEffect(() => {
    // Import existing assistants as GPTs on first load
    importFromAssistants();
  }, [importFromAssistants]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#121212] flex">
      {/* Sidebar */}
      <div className="w-64 bg-[#202123] border-r border-[#2A2B32] flex flex-col">
        <div className="p-4 border-b border-[#2A2B32]">
          <h1 className="text-xl font-bold text-white">Nexus AI Admin</h1>
          <p className="text-sm text-gray-400">GPT Management</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          <Link 
            to="/admin" 
            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
              location.pathname === '/admin' 
                ? 'bg-[#343541] text-white' 
                : 'text-gray-300 hover:bg-[#2A2B32]'
            }`}
          >
            <Home size={18} />
            <span>Dashboard</span>
          </Link>
          
          <Link 
            to="/admin/create" 
            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
              location.pathname === '/admin/create' 
                ? 'bg-[#343541] text-white' 
                : 'text-gray-300 hover:bg-[#2A2B32]'
            }`}
          >
            <Plus size={18} />
            <span>Create New GPT</span>
          </Link>

          <Link 
            to="/chat" 
            className="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-gray-300 hover:bg-[#2A2B32]"
          >
            <Database size={18} />
            <span>Back to App</span>
          </Link>
        </nav>
        
        <div className="p-4 border-t border-[#2A2B32]">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
              <span className="text-white font-medium">{user?.name.charAt(0)}</span>
            </div>
            <div>
              <p className="text-sm font-medium text-white">{user?.name}</p>
              <p className="text-xs text-gray-400">{user?.email}</p>
            </div>
          </div>
          
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-red-400 hover:bg-[#2A2B32] rounded-lg transition-colors"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex-1 overflow-auto">
        <Routes>
          <Route path="/" element={<GPTDashboard />} />
          <Route path="/create" element={<CreateGPT />} />
          <Route path="/edit/:id" element={<EditGPT />} />
        </Routes>
      </div>
    </div>
  );
};