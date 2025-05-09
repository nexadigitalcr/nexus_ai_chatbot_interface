import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChatStore } from '../store/chat';
import { useGPTStore } from '../store/gpt';
import { DocumentAttachment, ImageAttachment } from '../types';
import { FileText, Download, Copy, Volume2, ThumbsUp, ThumbsDown, Edit2, Check, X } from 'lucide-react';
import * as Tooltip from '@radix-ui/react-tooltip';

const ChatMessages: React.FC = () => {
  const { messages, activeAssistant, addFeedback, updateMessage } = useChatStore();
  const { activeGPT } = useGPTStore();
  const [isReading, setIsReading] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState('');
  const speechSynthesisRef = useRef<SpeechSynthesis | null>(null);
  const editTextareaRef = useRef<HTMLTextAreaElement>(null);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [filteredMessages, setFilteredMessages] = useState(messages);

  // Filter messages when active assistant changes
  useEffect(() => {
    setFilteredMessages(messages.filter(msg => msg.assistantId === activeAssistant.id));
  }, [messages, activeAssistant]);

  useEffect(() => {
    if (editingMessageId && editTextareaRef.current) {
      editTextareaRef.current.style.height = 'auto';
      editTextareaRef.current.style.height = `${editTextareaRef.current.scrollHeight}px`;
      editTextareaRef.current.focus();
    }
  }, [editingMessageId, editedContent]);

  // Initialize speech synthesis
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      speechSynthesisRef.current = window.speechSynthesis;
    }
  }, []);

  const handleDownload = (attachment: DocumentAttachment | ImageAttachment) => {
    const link = document.createElement('a');
    link.href = attachment.content;
    link.download = attachment.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopy = async (messageId: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (error) {
      console.error('Failed to copy text:', error);
    }
  };

  const handleReadAloud = (content: string) => {
    if (isReading) {
      speechSynthesisRef.current?.cancel();
      setIsReading(false);
      setSpeechError(null);
      return;
    }

    try {
      if (!speechSynthesisRef.current) {
        throw new Error('Speech synthesis is not supported in your browser');
      }

      const utterance = new SpeechSynthesisUtterance(content);
      // Use the active GPT's voice settings if available
      const voice = activeGPT?.voice || 'alloy';
      Object.assign(utterance, {
        lang: 'es-ES',
        rate: 1.0,
        pitch: 1.0,
        volume: 1.0,
        voice: voice
      });

      utterance.onend = () => {
        setIsReading(false);
        setSpeechError(null);
      };

      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event);
        setIsReading(false);
        setSpeechError('An error occurred while reading the text');
      };

      speechSynthesisRef.current.speak(utterance);
      setIsReading(true);
      setSpeechError(null);
    } catch (error) {
      console.error('Error in speech synthesis:', error);
      setIsReading(false);
      setSpeechError(error instanceof Error ? error.message : 'Failed to start speech synthesis');
    }
  };

  const startEditing = (message: typeof messages[0]) => {
    setEditingMessageId(message.id);
    setEditedContent(message.content);
  };

  const cancelEditing = () => {
    setEditingMessageId(null);
    setEditedContent('');
  };

  const saveEdit = (messageId: string) => {
    if (editedContent.trim()) {
      updateMessage(messageId, editedContent.trim());
    }
    cancelEditing();
  };

  const renderMessageActions = (message: typeof messages[0]) => {
    if (message.role !== 'assistant') return null;

    return (
      <div className="flex items-center gap-2 mt-4 opacity-100">
        {speechError && (
          <div className="text-red-400 text-xs mb-2">
            {speechError}
          </div>
        )}
        <Tooltip.Provider delayDuration={300}>
          <Tooltip.Root>
            <Tooltip.Trigger asChild>
              <button
                onClick={() => handleCopy(message.id, message.content)}
                className="p-1.5 text-gray-400 hover:text-white hover:bg-[#2A2B32] rounded-lg transition-colors"
              >
                <Copy 
                  size={16} 
                  className={copiedMessageId === message.id ? 'text-green-400' : ''} 
                />
              </button>
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Content
                className="px-3 py-1.5 text-sm bg-[#202123] text-white rounded-lg animate-in"
                sideOffset={5}
              >
                {copiedMessageId === message.id ? 'Copiado!' : 'Copiar respuesta'}
                <Tooltip.Arrow className="fill-[#202123]" />
              </Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Root>
        </Tooltip.Provider>

        <Tooltip.Provider delayDuration={300}>
          <Tooltip.Root>
            <Tooltip.Trigger asChild>
              <button
                onClick={() => handleReadAloud(message.content)}
                className={`p-1.5 ${isReading ? 'text-blue-400 hover:text-blue-300' : 'text-gray-400 hover:text-white'} hover:bg-[#2A2B32] rounded-lg transition-colors`}
              >
                <Volume2 size={16} />
              </button>
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Content
                className="px-3 py-1.5 text-sm bg-[#202123] text-white rounded-lg animate-in"
                sideOffset={5}
              >
                {isReading ? 'Detener lectura' : 'Leer en voz alta'}
                <Tooltip.Arrow className="fill-[#202123]" />
              </Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Root>
        </Tooltip.Provider>

        <div className="h-4 w-px bg-gray-700 mx-1" />

        <Tooltip.Provider delayDuration={300}>
          <Tooltip.Root>
            <Tooltip.Trigger asChild>
              <button
                onClick={() => addFeedback(message.id, true)}
                className={`p-1.5 transition-colors rounded-lg ${
                  message.feedback?.isPositive === true
                    ? 'text-green-400 hover:text-green-300'
                    : 'text-gray-400 hover:text-green-400'
                } hover:bg-[#2A2B32]`}
              >
                <ThumbsUp size={16} />
              </button>
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Content
                className="px-3 py-1.5 text-sm bg-[#202123] text-white rounded-lg animate-in"
                sideOffset={5}
              >
                Buena respuesta
                <Tooltip.Arrow className="fill-[#202123]" />
              </Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Root>
        </Tooltip.Provider>

        <Tooltip.Provider delayDuration={300}>
          <Tooltip.Root>
            <Tooltip.Trigger asChild>
              <button
                onClick={() => addFeedback(message.id, false)}
                className={`p-1.5 transition-colors rounded-lg ${
                  message.feedback?.isPositive === false
                    ? 'text-red-400 hover:text-red-300'
                    : 'text-gray-400 hover:text-red-400'
                } hover:bg-[#2A2B32]`}
              >
                <ThumbsDown size={16} />
              </button>
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Content
                className="px-3 py-1.5 text-sm bg-[#202123] text-white rounded-lg animate-in"
                sideOffset={5}
              >
                Mejorar respuesta
                <Tooltip.Arrow className="fill-[#202123]" />
              </Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Root>
        </Tooltip.Provider>
      </div>
    );
  };

  const renderAttachment = (attachment: DocumentAttachment | ImageAttachment) => {
    if (attachment.type.startsWith('image/')) {
      return (
        <div key={attachment.id} className="mt-2">
          <img
            src={attachment.content}
            alt={attachment.name}
            className="max-w-full rounded-lg shadow-md cursor-pointer hover:opacity-90 transition-opacity"
            style={{
              maxHeight: '400px',
              objectFit: 'contain'
            }}
            onClick={() => handleDownload(attachment)}
          />
          <div className="mt-1 text-xs text-gray-400 flex items-center gap-2">
            <span>{attachment.name}</span>
            <span>({Math.round(attachment.size / 1024)}KB)</span>
            <button
              onClick={() => handleDownload(attachment)}
              className="text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
            >
              <Download size={12} />
              <span>Download</span>
            </button>
          </div>
        </div>
      );
    }

    return (
      <div key={attachment.id} className="mt-2">
        <button
          onClick={() => handleDownload(attachment)}
          className="flex items-center gap-3 p-3 bg-[#2A2B32] rounded-lg hover:bg-[#40414F] transition-colors group"
        >
          <div className="p-2 bg-[#40414F] group-hover:bg-[#2A2B32] rounded-lg transition-colors">
            <FileText size={24} className="text-blue-400" />
          </div>
          <div className="flex-1 text-left">
            <div className="text-sm font-medium text-gray-200">{attachment.name}</div>
            <div className="text-xs text-gray-400">{Math.round(attachment.size / 1024)}KB</div>
          </div>
          <Download size={20} className="text-gray-400 group-hover:text-white transition-colors" />
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-0 flex-1">
      <div className="w-full transform transition-all duration-300 ease-in-out">
        <AnimatePresence mode="wait">
          {!filteredMessages?.length ? (
            <motion.div 
              key="welcome"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="h-full flex flex-col items-center justify-center text-center p-4"
              style={{
                minHeight: 'calc(100vh - 200px)'
              }}
            >
              <motion.div
                className="space-y-6 transform transition-all duration-300 ease-in-out"
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              >
                <motion.div
                  initial={{ y: 0 }}
                  animate={{ y: -40 }}
                  transition={{ duration: 0.5 }}
                  className="space-y-2"
                >
                  <h1 className="text-3xl sm:text-4xl font-bold font-inter text-gray-200">
                    {activeAssistant.name}
                  </h1>
                  <p className="text-gray-400 max-w-md mx-auto text-base sm:text-lg font-roboto">
                    {activeAssistant.description}
                  </p>
                </motion.div>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              key="messages"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="pb-32 pt-4"
            >
              {filteredMessages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`py-6 px-4 sm:px-6 group ${
                    message.role === 'assistant' ? 'bg-[#1E1E1E]' : ''
                  }`}
                >
                  <div className="flex gap-4 transform transition-all duration-300 ease-in-out">
                    {message.role === 'assistant' ? (
                      <img
                        src={activeAssistant.avatar}
                        alt={activeAssistant.name}
                        className="w-8 h-8 rounded-full flex-shrink-0"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-[#5C5C7B] flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-medium">U</span>
                      </div>
                    )}
                    <div className="flex-1 prose prose-invert max-w-none">
                      {editingMessageId === message.id ? (
                        <div className="relative">
                          <textarea
                            ref={editTextareaRef}
                            value={editedContent}
                            onChange={(e) => setEditedContent(e.target.value)}
                            className="w-full bg-[#2A2B32] text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                            rows={1}
                          />
                          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
                            <button
                              onClick={() => saveEdit(message.id)}
                              className="p-1.5 text-green-400 hover:text-green-300 hover:bg-[#40414F] rounded-lg transition-colors"
                            >
                              <Check size={16} />
                            </button>
                            <button
                              onClick={cancelEditing}
                              className="p-1.5 text-red-400 hover:text-red-300 hover:bg-[#40414F] rounded-lg transition-colors"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="relative group">
                          <p className="text-gray-100 leading-7">{message.content}</p>
                          {message.role === 'user' && (
                            <button
                              onClick={() => startEditing(message)}
                              className="absolute -right-8 top-0 p-1.5 text-gray-400 hover:text-white hover:bg-[#2A2B32] rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                            >
                              <Edit2 size={14} />
                            </button>
                          )}
                        </div>
                      )}
                      {message.attachments?.map((attachment) => renderAttachment(attachment))}
                      {renderMessageActions(message)}
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ChatMessages;