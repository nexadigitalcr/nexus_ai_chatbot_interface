import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, ExternalLink, FileText, Eye, EyeOff, Globe, Lock, Clock, Search, Grid, List, SortAsc, Filter, Brain, Code, Terminal, Sparkles, Image, Activity, Gauge, Coins } from 'lucide-react';
import { useGPTStore } from '../../store/gpt';
import { assistants } from '../../data/assistants';
import { motion } from 'framer-motion';

export const GPTDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { gpts, deleteGPT } = useGPTStore();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'date'>('date');
  const [filterStatus, setFilterStatus] = useState<'all' | 'public' | 'private' | 'draft'>('all');
  const [selectedTab, setSelectedTab] = useState<'gpts' | 'performance' | 'tokens'>('gpts');
  
  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);
  
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
  
  const handleDeleteConfirm = (gptId: string) => {
    deleteGPT(gptId);
    setShowDeleteConfirm(null);
  };
  
  const getVisibilityIcon = (visibility?: string) => {
    switch (visibility) {
      case 'private':
        return <Lock size={14} className="text-yellow-400" />;
      case 'draft':
        return <Clock size={14} className="text-gray-400" />;
      default:
        return <Globe size={14} className="text-green-400" />;
    }
  };
  
  const getVisibilityText = (visibility?: string) => {
    switch (visibility) {
      case 'private':
        return 'Private';
      case 'draft':
        return 'Draft';
      default:
        return 'Public';
    }
  };

  // Convert built-in assistants to GPT format for display
  const builtInGPTs = assistants.map(assistant => ({
    id: assistant.id,
    name: assistant.name,
    description: assistant.description,
    role: assistant.role,
    avatar: assistant.avatar,
    files: [],
    createdAt: new Date().toISOString(),
    visibility: 'public' as const,
    capabilities: {
      webSearch: true,
      codeInterpreter: true,
      imageGeneration: true,
      fileUpload: true
    }
  }));
  
  // Combine custom GPTs with built-in assistants
  // Filter out built-in assistants that already exist as custom GPTs
  const allGPTs = [...gpts, ...builtInGPTs.filter(a => !gpts.some(g => g.id === a.id))];

  // Filter and sort GPTs
  const filteredGPTs = allGPTs
    .filter(gpt => {
      const matchesSearch = gpt.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          gpt.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = filterStatus === 'all' || gpt.visibility === filterStatus;
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      }
      const aTime = new Date(a.updatedAt || a.createdAt).getTime();
      const bTime = new Date(b.updatedAt || b.createdAt).getTime();
      return bTime - aTime;
    });
  
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">GPT Dashboard</h1>
          <p className="text-sm text-gray-400 mt-1">Manage and monitor your AI assistants</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-[#2A2B32] rounded-lg p-1">
            <button
              onClick={() => setSelectedTab('gpts')}
              className={`px-4 py-2 rounded flex items-center gap-2 ${
                selectedTab === 'gpts' ? 'bg-[#343541] text-white' : 'text-gray-400'
              }`}
            >
              <Brain size={16} />
              <span>GPTs</span>
            </button>
            <button
              onClick={() => setSelectedTab('performance')}
              className={`px-4 py-2 rounded flex items-center gap-2 ${
                selectedTab === 'performance' ? 'bg-[#343541] text-white' : 'text-gray-400'
              }`}
            >
              <Activity size={16} />
              <span>Performance</span>
            </button>
            <button
              onClick={() => setSelectedTab('tokens')}
              className={`px-4 py-2 rounded flex items-center gap-2 ${
                selectedTab === 'tokens' ? 'bg-[#343541] text-white' : 'text-gray-400'
              }`}
            >
              <Coins size={16} />
              <span>Tokens</span>
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search GPTs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64 bg-[#2A2B32] text-white rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2 bg-[#2A2B32] rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded ${viewMode === 'grid' ? 'bg-[#343541] text-white' : 'text-gray-400'}`}
            >
              <Grid size={18} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${viewMode === 'list' ? 'bg-[#343541] text-white' : 'text-gray-400'}`}
            >
              <List size={18} />
            </button>
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="bg-[#2A2B32] text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="public">Public</option>
            <option value="private">Private</option>
            <option value="draft">Draft</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-[#2A2B32] text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="date">Sort by Date</option>
            <option value="name">Sort by Name</option>
          </select>

          <Link
            to="/admin/create"
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={18} />
            <span>Create New GPT</span>
          </Link>
        </div>
      </div>
      
      {selectedTab === 'performance' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-[#2A2B32] rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-white">Response Time</h3>
              <Gauge className="w-6 h-6 text-blue-400" />
            </div>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Average</span>
                  <span className="text-white">1.2s</span>
                </div>
                <div className="mt-2 h-2 bg-[#343541] rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: '60%' }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Peak</span>
                  <span className="text-white">2.5s</span>
                </div>
                <div className="mt-2 h-2 bg-[#343541] rounded-full overflow-hidden">
                  <div className="h-full bg-yellow-500 rounded-full" style={{ width: '80%' }} />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#2A2B32] rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-white">Success Rate</h3>
              <Activity className="w-6 h-6 text-green-400" />
            </div>
            <div className="text-3xl font-bold text-white mb-2">98.5%</div>
            <div className="text-sm text-gray-400">Last 24 hours</div>
            <div className="mt-4 h-2 bg-[#343541] rounded-full overflow-hidden">
              <div className="h-full bg-green-500 rounded-full" style={{ width: '98.5%' }} />
            </div>
          </div>

          <div className="bg-[#2A2B32] rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-white">Active GPTs</h3>
              <Brain className="w-6 h-6 text-purple-400" />
            </div>
            <div className="text-3xl font-bold text-white mb-2">{gpts.length}</div>
            <div className="text-sm text-gray-400">Total GPTs deployed</div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              <div className="bg-[#343541] rounded p-2 text-center">
                <div className="text-sm font-medium text-white">{gpts.filter(g => g.visibility === 'public').length}</div>
                <div className="text-xs text-gray-400">Public</div>
              </div>
              <div className="bg-[#343541] rounded p-2 text-center">
                <div className="text-sm font-medium text-white">{gpts.filter(g => g.visibility === 'private').length}</div>
                <div className="text-xs text-gray-400">Private</div>
              </div>
              <div className="bg-[#343541] rounded p-2 text-center">
                <div className="text-sm font-medium text-white">{gpts.filter(g => g.visibility === 'draft').length}</div>
                <div className="text-xs text-gray-400">Draft</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedTab === 'tokens' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-[#2A2B32] rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-white">Token Usage</h3>
              <Coins className="w-6 h-6 text-yellow-400" />
            </div>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Today</span>
                  <span className="text-white">12,345</span>
                </div>
                <div className="mt-2 h-2 bg-[#343541] rounded-full overflow-hidden">
                  <div className="h-full bg-yellow-500 rounded-full" style={{ width: '45%' }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">This Month</span>
                  <span className="text-white">234,567</span>
                </div>
                <div className="mt-2 h-2 bg-[#343541] rounded-full overflow-hidden">
                  <div className="h-full bg-yellow-500 rounded-full" style={{ width: '75%' }} />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#2A2B32] rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-white">Cost Analysis</h3>
              <Activity className="w-6 h-6 text-blue-400" />
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Daily Average</span>
                <span className="text-white">$1.23</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Monthly Estimate</span>
                <span className="text-white">$37.50</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Budget Used</span>
                <span className="text-green-400">45%</span>
              </div>
            </div>
          </div>

          <div className="bg-[#2A2B32] rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-white">Model Distribution</h3>
              <Brain className="w-6 h-6 text-purple-400" />
            </div>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">GPT-4</span>
                  <span className="text-white">65%</span>
                </div>
                <div className="mt-2 h-2 bg-[#343541] rounded-full overflow-hidden">
                  <div className="h-full bg-purple-500 rounded-full" style={{ width: '65%' }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">GPT-3.5</span>
                  <span className="text-white">35%</span>
                </div>
                <div className="mt-2 h-2 bg-[#343541] rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: '35%' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedTab === 'gpts' && isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 border-4 border-blue-500/30 rounded-full animate-spin"></div>
            <div className="absolute inset-[6px] border-4 border-t-blue-500 rounded-full animate-spin-slow"></div>
          </div>
        </div>
      ) : selectedTab === 'gpts' && (
        <div className={viewMode === 'grid' ? 
          "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : 
          "space-y-4"
        }>
          {filteredGPTs.map((gpt) => (
            <motion.div
              key={gpt.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`bg-[#2A2B32] rounded-lg overflow-hidden border border-[#343541] hover:border-blue-500/50 transition-colors ${
                viewMode === 'list' ? 'flex items-center' : ''
              }`}
            >
              <div className={`p-4 ${viewMode === 'list' ? 'flex-1 flex items-center gap-6' : ''}`}>
                <div className={`flex items-center gap-3 ${viewMode === 'list' ? 'flex-1' : 'mb-3'}`}>
                  <img
                    src={gpt.avatar}
                    alt={gpt.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-medium truncate flex items-center gap-2">
                      {gpt.name}
                      {gpt.isDefault && (
                        <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded">
                          Default
                        </span>
                      )}
                    </h3>
                    <div className="flex items-center gap-1.5">
                      {getVisibilityIcon(gpt.visibility)}
                      <span className="text-xs text-gray-400">{getVisibilityText(gpt.visibility)}</span>
                      {gpt.updatedAt && (
                        <span className="ml-2 text-xs text-blue-400">• Updated</span>
                      )}
                    </div>
                  </div>
                </div>
                {viewMode === 'grid' && (
                  <p className="text-sm text-gray-300 mb-4 line-clamp-2">{gpt.description}</p>
                )}
                
                {gpt.files && gpt.files.length > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText size={14} className="text-gray-400" />
                      <span className="text-xs text-gray-400">Knowledge files: {gpt.files.length}</span>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/admin/edit/${gpt.id}`}
                      className="p-2 text-gray-400 hover:text-white hover:bg-[#343541] rounded transition-colors"
                      title="Edit GPT"
                    >
                      <Edit size={16} />
                    </Link>
                    <button
                      onClick={() => handleTestGPT(gpt.id)}
                      className="p-2 text-gray-400 hover:text-white hover:bg-[#343541] rounded transition-colors"
                      title="Test GPT"
                    >
                      <ExternalLink size={16} />
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(gpt.id)}
                      className="p-2 text-gray-400 hover:text-red-400 hover:bg-[#343541] rounded transition-colors"
                      title="Delete GPT"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    {gpt.capabilities.codeInterpreter && <Code size={14} className="text-blue-400" />}
                    {gpt.capabilities.webSearch && <Globe size={14} className="text-green-400" />}
                    {gpt.capabilities.imageGeneration && <Image size={14} className="text-purple-400" />}
                    {gpt.capabilities.fileUpload && <FileText size={14} className="text-yellow-400" />}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#2A2B32] rounded-lg p-6 max-w-md w-full"
          >
            <h3 className="text-xl font-semibold text-white mb-2">Delete GPT</h3>
            <p className="text-gray-300 mb-6">
              Are you sure you want to delete this GPT? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteConfirm(showDeleteConfirm)}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};