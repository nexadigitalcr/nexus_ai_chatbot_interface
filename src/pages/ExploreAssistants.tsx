import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, ArrowLeft, Star, MessageSquare, Users, ChevronDown, ArrowUpRight } from 'lucide-react';
import { useChatStore } from '../store/chat';
import { assistants } from '../data/assistants';
import { cn } from '../lib/utils';

export const ExploreAssistants: React.FC = () => {
  const navigate = useNavigate();
  const { setActiveAssistant } = useChatStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [filteredAssistants, setFilteredAssistants] = useState(assistants);

  useEffect(() => {
    const filtered = assistants.filter(assistant => {
      const matchesSearch = assistant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          assistant.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || assistant.category?.toLowerCase() === selectedCategory.toLowerCase();
      return matchesSearch && matchesCategory;
    });
    setFilteredAssistants(filtered);
  }, [searchQuery, selectedCategory]);

  const handleAssistantSelect = (assistantId: string) => {
    setActiveAssistant(assistantId);
    navigate('/chat');
  };

  const categories = ['all', 'Featured', 'Trending', 'Specialized'];

  const AssistantCard: React.FC<{ assistant: typeof assistants[0] }> = ({ assistant }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className="bg-[#2A2B32] rounded-lg p-4 hover:bg-[#343541] transition-all cursor-pointer group"
      onClick={() => handleAssistantSelect(assistant.id)}
    >
      <div className="flex items-start gap-4">
        <img
          src={assistant.avatar}
          alt={assistant.name}
          className="w-12 h-12 rounded-full object-cover"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold truncate">{assistant.name}</h3>
            {assistant.isPrimary && (
              <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded">
                Verified
              </span>
            )}
          </div>
          <p className="text-sm text-gray-400 line-clamp-2 mt-1">{assistant.description}</p>
          
          <div className="mt-3 flex items-center gap-4 text-sm text-gray-400">
            <span className="flex items-center gap-1">
              <Users size={14} />
              <span>{assistant.creator}</span>
            </span>
            {assistant.chatCount && (
              <span className="flex items-center gap-1">
                <MessageSquare size={14} />
                <span>{(assistant.chatCount / 1000).toFixed(1)}k chats</span>
              </span>
            )}
            {assistant.stats && (
              <span className="flex items-center gap-1">
                <Star size={14} className="text-yellow-400" />
                <span>{assistant.stats.rating}</span>
              </span>
            )}
          </div>
        </div>
        
        <ArrowUpRight 
          size={20} 
          className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity"
        />
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-[#121212] text-white">
      {/* Header */}
      <header className="border-b border-[#2A2B32] p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/chat')}
              className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-[#2A2B32] group"
            >
              <ArrowLeft size={24} className="transition-transform group-hover:-translate-x-1" />
            </button>
            <h1 className="text-2xl font-bold">Explorar Asistentes</h1>
          </div>
          <p className="mt-2 text-gray-400 max-w-3xl">
            Navega por nuestra colección curada de asistentes especializados. Cada asistente es una versión personalizada de Nexus AI con conocimientos y capacidades específicas.
          </p>
        </div>
      </header>

      {/* Search and Filters */}
      <div className="sticky top-0 z-10 border-b border-[#2A2B32] bg-[#202123]/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Buscar asistentes por nombre, descripción o categoría"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#2A2B32] text-white rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="relative">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="appearance-none bg-[#2A2B32] text-white rounded-lg px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {categories.map(category => (
                  <option key={category} value={category.toLowerCase()}>
                    {category === 'all' ? 'Todas las categorías' : category}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
            </div>
          </div>
        </div>
      </div>

      {/* Assistant Grid */}
      <main className="max-w-7xl mx-auto p-4">
        {categories.filter(category => 
          category !== 'all' && 
          filteredAssistants.some(a => a.category === category)
        ).map(category => (
          <section key={category} className="mb-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              {category}
              <span className="text-sm font-normal text-gray-400">
                {filteredAssistants.filter(a => a.category === category).length} asistentes
              </span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAssistants
                .filter(assistant => assistant.category === category)
                .map(assistant => (
                  <AssistantCard key={assistant.id} assistant={assistant} />
                ))}
            </div>
          </section>
        ))}

        {filteredAssistants.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400">No se encontraron asistentes que coincidan con tu búsqueda.</p>
          </div>
        )}
      </main>
    </div>
  );
};