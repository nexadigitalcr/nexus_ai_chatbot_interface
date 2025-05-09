import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Star, Users, MessageSquare } from 'lucide-react';
import { Assistant } from '../types';
import { useChatStore } from '../store/chat';

interface AssistantProfileProps {
  assistant: Assistant;
  onClose: () => void;
}

export const AssistantProfile: React.FC<AssistantProfileProps> = ({
  assistant,
  onClose
}) => {
  const { setActiveAssistant, togglePinnedAssistant, updateAssistantStats } = useChatStore();
  const [userRating, setUserRating] = useState<number | null>(null);
  const [feedback, setFeedback] = useState('');

  const handleStartChat = () => {
    setActiveAssistant(assistant.id);
    togglePinnedAssistant(assistant.id);
    onClose();
  };

  const handleRating = (rating: number) => {
    setUserRating(rating);
    updateAssistantStats(assistant.id, rating);
  };

  const calculateRatingPercentage = (rating: number) => {
    if (!assistant.stats) return 0;
    const ratingCount = assistant.stats.ratings[
      rating === 5 ? 'five' :
      rating === 4 ? 'four' :
      rating === 3 ? 'three' :
      rating === 2 ? 'two' : 'one'
    ];
    const total = Object.values(assistant.stats.ratings).reduce((a, b) => a + b, 0);
    return (ratingCount / total) * 100;
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="w-full max-w-md bg-[#202123] rounded-lg shadow-xl overflow-hidden"
    >
      <div className="relative h-32 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="absolute -bottom-12 left-1/2 -translate-x-1/2">
          <img
            src={assistant.avatar}
            alt={assistant.name}
            className="w-24 h-24 rounded-full border-4 border-[#202123]"
          />
        </div>
      </div>

      <div className="pt-16 px-5 pb-5">
        <div className="text-center mb-4">
          <h2 className="text-xl font-bold text-white mb-1">{assistant.name}</h2>
          <p className="text-sm text-gray-400">{assistant.role}</p>
          <p className="text-gray-300 mt-3 text-sm leading-relaxed">{assistant.description}</p>
        </div>

        <div className="flex items-center justify-center gap-4 mb-6">
          <div className="flex items-center gap-1.5">
            <Users className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-white font-medium">
              {assistant.stats?.users.toLocaleString()}
            </span>
          </div>
          <div className="h-4 w-px bg-gray-700" />
          <div className="flex items-center gap-1.5">
            <Star className="w-4 h-4 text-yellow-400" />
            <span className="text-sm text-white font-medium">
              {assistant.stats?.rating}
            </span>
          </div>
          <div className="h-4 w-px bg-gray-700" />
          <div className="flex items-center gap-1.5">
            <MessageSquare className="w-4 h-4 text-green-400" />
            <span className="text-sm text-white font-medium">Nexa Digital</span>
          </div>
        </div>

        <div className="space-y-2 mb-5">
          {[5, 4, 3, 2, 1].map((rating) => (
            <div key={rating} className="flex items-center gap-2">
              <div className="flex items-center gap-0.5 w-16">
                {Array.from({ length: rating }).map((_, i) => (
                  <Star
                    key={i}
                    className="w-3 h-3 text-yellow-400"
                    fill="currentColor"
                  />
                ))}
              </div>
              <div className="flex-1 h-1.5 bg-[#2A2B32] rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${calculateRatingPercentage(rating)}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="h-full bg-blue-500"
                />
              </div>
              <span className="text-xs text-gray-400 w-10">
                {Math.round(calculateRatingPercentage(rating))}%
              </span>
            </div>
          ))}
        </div>

        {!userRating ? (
          <div className="mb-5">
            <p className="text-xs text-gray-400 mb-2 text-center">
              ¿Cómo calificarías a este asistente?
            </p>
            <div className="flex items-center justify-center gap-1.5">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  onClick={() => handleRating(rating)}
                  className="p-1 hover:scale-110 transition-transform"
                >
                  <Star
                    className="w-5 h-5 text-gray-500 hover:text-yellow-400"
                    fill="none"
                  />
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mb-5">
            <p className="text-xs text-gray-400 mb-2">
              ¿Tienes algún comentario adicional?
            </p>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Tu opinión nos ayuda a mejorar..."
              className="w-full h-20 bg-[#2A2B32] text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        )}

        <button
          onClick={handleStartChat}
          className="w-full py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          Iniciar Chat
        </button>
      </div>
    </motion.div>
  );
};