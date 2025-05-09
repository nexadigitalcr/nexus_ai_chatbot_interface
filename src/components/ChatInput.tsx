import React, { useState, useRef, useEffect } from 'react';
import { ArrowUp, Plus, Mic, MicOff, MessageSquare, Brain, Image, Code, FileText, Lightbulb, Sparkles, BarChart2, FileEdit, Upload, Camera, X, Volume2 } from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import * as Tooltip from '@radix-ui/react-tooltip';
import { useChatStore } from '../store/chat';
import { useGPTStore } from '../store/gpt';
import { cn } from '../lib/utils';
import { DocumentAttachment, ImageAttachment } from '../types';
import { generateId } from '../lib/utils';
import { VoiceInterface } from './VoiceInterface';
import { askNexusAI } from '../lib/openai';

const QUICK_RESPONSES = {
  'Dar ideas': '¿Puedes darme algunas ideas creativas sobre ',
  'Sorpréndeme': 'Sorpréndeme con algo interesante y único',
  'Análisis de datos': '¿Podrías analizar estos datos para mí? ',
  'Resumen de texto': '¿Puedes resumir el siguiente texto? ',
  'Ayúdame a escribir': 'Necesito ayuda para escribir ',
  'Elaborar un plan ': '¿Puedes ayudarme a elaborar un plan para ',
  'Código': '¿Puedes ayudarme a escribir código para ',
  'Crear una imagen': 'Describe una imagen de '
};

const IMAGE_TYPES = {
  'image/jpeg': '.jpg,.jpeg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/svg+xml': '.svg',
  'image/webp': '.webp'
};

const DOCUMENT_TYPES = {
  'application/pdf': '.pdf',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'application/vnd.ms-excel': '.xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
  'application/vnd.ms-powerpoint': '.ppt',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': '.pptx',
  'text/plain': '.txt',
  'application/zip': '.zip',
  'application/x-rar-compressed': '.rar',
  'text/javascript': '.js',
  'text/typescript': '.ts',
  'text/html': '.html',
  'text/css': '.css',
  'text/x-python': '.py',
  'text/x-java': '.java',
  'text/x-c++': '.cpp',
  'audio/mpeg': '.mp3',
  'audio/wav': '.wav',
  'video/mp4': '.mp4',
  'video/webm': '.webm'
};

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_CHARS = 6000;
const MAX_VISIBLE_LINES = 6;
const LINE_HEIGHT = 24; // Approximate line height in pixels

export const ChatInput: React.FC = () => {
  const [message, setMessage] = useState('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isVoiceInterfaceOpen, setIsVoiceInterfaceOpen] = useState(false);
  const [isDictating, setIsDictating] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState<(DocumentAttachment | ImageAttachment)[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const { activeAssistant, addMessage, setLoading, setActiveAssistant, isSidebarOpen } = useChatStore();
  const { gpts, getDefaultGPT } = useGPTStore();
  
  // Get the active GPT configuration
  const activeGpt = gpts.find(gpt => gpt.id === activeAssistant.id) || getDefaultGPT();

  useEffect(() => {
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      textarea.style.height = 'auto';
      
      const newHeight = Math.min(
        textarea.scrollHeight,
        LINE_HEIGHT * MAX_VISIBLE_LINES
      );
      
      textarea.style.height = `${newHeight}px`;
      
      if (textarea.scrollHeight > newHeight) {
        textarea.style.overflowY = 'auto';
      } else {
        textarea.style.overflowY = 'hidden';
      }
    }
  }, [message]);

  const startDictation = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'es-ES';

      recognitionRef.current.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0].transcript)
          .join('');

        if (event.results[event.results.length - 1].isFinal) {
          setMessage(prev => {
            const newMessage = prev + ' ' + transcript;
            return newMessage.slice(0, MAX_CHARS).trim();
          });
        }
      };

      recognitionRef.current.onend = () => {
        setIsDictating(false);
      };

      recognitionRef.current.start();
      setIsDictating(true);
    }
  };

  const stopDictation = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsDictating(false);
    }
  };

  const handleVoiceTranscript = (text: string) => {
    setMessage(prev => {
      const newMessage = prev + ' ' + text;
      return newMessage.slice(0, MAX_CHARS).trim();
    });
  };

  const handleQuickResponse = (template: string) => {
    if (message.length + template.length <= MAX_CHARS) {
      setMessage(template);
      if (textareaRef.current) {
        textareaRef.current.focus();
        const cursorPosition = template.endsWith(' ') ? template.length - 1 : template.length;
        textareaRef.current.setSelectionRange(cursorPosition, cursorPosition);
      }
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, isImage: boolean) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      setUploadError(`El archivo no debe superar los ${formatFileSize(MAX_FILE_SIZE)}`);
      return;
    }

    try {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        const content = e.target?.result as string;
        const baseAttachment = {
          id: generateId(),
          name: file.name,
          type: file.type || 'application/octet-stream',
          size: file.size,
          content
        };

        if (isImage) {
          const img = new window.Image();
          img.onload = () => {
            const attachment: ImageAttachment = {
              ...baseAttachment,
              width: img.width,
              height: img.height
            };
            setPendingAttachments(prev => [...prev, attachment]);
          };
          img.src = content;
        } else {
          const attachment: DocumentAttachment = baseAttachment;
          setPendingAttachments(prev => [...prev, attachment]);
        }
        setUploadError(null);
      };

      reader.readAsDataURL(file);
    } catch (error) {
      setUploadError('Error al procesar el archivo');
    }
  };

  const removePendingAttachment = (id: string) => {
    setPendingAttachments(prev => prev.filter(attachment => attachment.id !== id));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() && pendingAttachments.length === 0) return;
    
    addMessage(message, 'user', activeAssistant.id, pendingAttachments);
    setMessage('');
    setPendingAttachments([]);
    setLoading(true);
    
    try {
      if (!activeGpt) {
        addMessage(
          'No GPT configuration found. Please select a valid GPT.',
          'assistant',
          activeAssistant.id
        );
        return;
      }

      // Validate GPT ID
      if (!activeGpt.gptId) {
        addMessage(
          'This GPT is not properly configured. Please set up the GPT ID in the admin panel.',
          'assistant',
          activeAssistant.id
        );
        return;
      }

      // Prepare API configuration
      const apiConfig = {
        gptId: activeGpt.gptId,
        model: activeGpt.model || 'gpt-4'
      };

      const response = await askNexusAI(
        message, 
        apiConfig
      );
      if (response.error) {
        addMessage(
          'Error processing your message. Please try again.',
          'assistant',
          activeAssistant.id
        );
      } else {
        addMessage(response.content, 'assistant', activeAssistant.id);
      }
    } catch (error) {
      console.error('Error in chat submission:', error);
      addMessage(
        'An unexpected error occurred. Please try again later.',
        'assistant',
        activeAssistant.id
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDeepReasoning = () => {
    setActiveAssistant('nexus-deep');
    addMessage(
      'He activado el modo de pensamiento profundo. ¿En qué puedo ayudarte con un análisis más detallado?',
      'assistant',
      'nexus-deep'
    );
  };

  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    if (newValue.length <= MAX_CHARS) {
      setMessage(newValue);
    }
  };

  const ActionButton = ({ icon: Icon, label, onClick }: { icon: any; label: string; onClick?: () => void }) => (
    <Tooltip.Provider delayDuration={300}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <button 
            className="p-2 text-gray-400 hover:text-white hover:bg-[#2A2B32] rounded-lg transition-colors"
            aria-label={label}
            onClick={onClick}
          >
            <Icon size={20} />
          </button>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            className="px-3 py-1.5 text-sm bg-[#202123] text-white rounded-lg animate-in"
            sideOffset={5}
          >
            {label}
            <Tooltip.Arrow className="fill-[#202123]" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );

  const charsRemaining = MAX_CHARS - message.length;
  const showCharCount = message.length > MAX_CHARS * 0.8;

  return (
    <>
      <VoiceInterface
        isOpen={isVoiceInterfaceOpen}
        onClose={() => setIsVoiceInterfaceOpen(false)}
        onTranscript={handleVoiceTranscript}
      />

      <div className="w-full bg-gradient-to-t from-[#121212] to-transparent pt-20 pb-8">
        <div className="relative">
          <input
            type="file"
            ref={documentInputRef}
            className="hidden"
            onChange={(e) => handleFileUpload(e, false)}
            accept={Object.values(DOCUMENT_TYPES).join(',')}
          />
          <input
            type="file"
            ref={imageInputRef}
            className="hidden"
            onChange={(e) => handleFileUpload(e, true)}
            accept={Object.values(IMAGE_TYPES).join(',')}
          />

          {uploadError && (
            <div className="absolute left-0 right-0 bottom-full mb-2">
              <div className="bg-red-500/10 text-red-400 text-sm px-4 py-2 rounded-lg text-center">
                {uploadError}
              </div>
            </div>
          )}

          {pendingAttachments.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2">
              {pendingAttachments.map(attachment => (
                <div
                  key={attachment.id}
                  className="relative group bg-[#2A2B32] rounded-lg p-2 flex items-center gap-2"
                >
                  {attachment.type.startsWith('image/') ? (
                    <img
                      src={attachment.content}
                      alt={attachment.name}
                      className="w-8 h-8 object-cover rounded"
                    />
                  ) : (
                    <FileText className="w-6 h-6 text-blue-400" />
                  )}
                  <span className="text-sm text-gray-300">{attachment.name}</span>
                  <button
                    onClick={() => removePendingAttachment(attachment.id)}
                    className="p-1 hover:bg-[#40414F] rounded absolute -top-2 -right-2 bg-[#2A2B32]"
                  >
                    <X size={14} className="text-gray-400" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit} className="relative bg-[#40414F] rounded-xl shadow-lg">
            <div className="relative">
              <textarea
                ref={textareaRef}
                value={message}
                onChange={handleMessageChange}
                onKeyDown={handleKeyDown}
                placeholder="Envía un mensaje"
                className={cn(
                  "w-full bg-transparent text-white rounded-2xl pl-4 pr-12 py-3.5",
                  "focus:outline-none focus:ring-1 focus:ring-[#0A2A43]",
                  "placeholder-gray-400 resize-none",
                  "scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-transparent",
                  "min-h-[52px] transform transition-all duration-300 ease-in-out"
                )}
                style={{
                  maxHeight: `${LINE_HEIGHT * MAX_VISIBLE_LINES}px`,
                  scrollbarWidth: 'thin',
                  scrollbarColor: '#4A4B53 transparent'
                }}
              />
              
              <div className="absolute right-2 bottom-2 flex items-center gap-2">
                {showCharCount && (
                  <span className={cn(
                    "text-xs",
                    charsRemaining <= 100 ? "text-red-400" : "text-gray-400"
                  )}>
                    {charsRemaining}
                  </span>
                )}
                <button
                  type="submit"
                  disabled={!message.trim() && pendingAttachments.length === 0}
                  className={cn(
                    "p-1.5 rounded-lg transition-colors",
                    message.trim() || pendingAttachments.length > 0
                      ? "text-white bg-[#19C37D] hover:bg-[#1A7F4B]" 
                      : "text-gray-400 bg-transparent cursor-not-allowed"
                  )}
                  aria-label="Enviar mensaje"
                >
                  <ArrowUp size={18} />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 border-t border-[#2A2B32]">
              <div className="flex items-center gap-2">
                <ActionButton 
                  icon={Upload} 
                  label="Subir documento"
                  onClick={() => documentInputRef.current?.click()}
                />
                <ActionButton 
                  icon={Camera} 
                  label="Subir imagen"
                  onClick={() => imageInputRef.current?.click()}
                />
                <ActionButton
                  icon={MessageSquare}
                  label="Conversa conmigo"
                  onClick={() => setIsVoiceInterfaceOpen(true)}
                />
                <ActionButton
                  icon={Volume2}
                  label="Voz de IA"
                  onClick={() => setIsVoiceInterfaceOpen(true)}
                />
                <ActionButton
                  icon={isDictating ? MicOff : Mic}
                  label="Díctame"
                  onClick={isDictating ? stopDictation : startDictation}
                />
              </div>
              <div className="flex items-center gap-2">
                <DropdownMenu.Root>
                  <DropdownMenu.Trigger asChild>
                    <button 
                      className="p-2 text-gray-400 hover:text-white hover:bg-[#2A2B32] rounded-lg transition-colors"
                      aria-label="Más opciones"
                    >
                      <Plus size={20} />
                    </button>
                  </DropdownMenu.Trigger>
                  
                  <DropdownMenu.Portal>
                    <DropdownMenu.Content 
                      className="bg-[#202123] rounded-lg shadow-lg p-1 animate-in"
                      sideOffset={5}
                      align="end"
                    >
                      {[
                        { icon: Lightbulb, label: 'Dar ideas' },
                        { icon: Sparkles, label: 'Sorpréndeme' },
                        { icon: BarChart2, label: 'Análisis de datos' },
                        { icon: FileText, label: 'Resumen de texto' },
                        { icon: FileEdit, label: 'Ayúdame a escribir' },
                        { icon: Brain, label: 'Elaborar un plan' },
                        { icon: Code, label: 'Código' },
                        { icon: Image, label: 'Crear una imagen' },
                      ].map(({ icon: Icon, label }) => (
                        <DropdownMenu.Item
                          key={label}
                          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-[#2A2B32] rounded cursor-pointer outline-none"
                          onSelect={() => handleQuickResponse(QUICK_RESPONSES[label as keyof typeof QUICK_RESPONSES])}
                        >
                          <Icon size={16} />
                          <span>{label}</span>
                        </DropdownMenu.Item>
                      ))}
                    </DropdownMenu.Content>
                  </DropdownMenu.Portal>
                </DropdownMenu.Root>
                <ActionButton
                  icon={Brain}
                  label="Pensamiento profundo"
                  onClick={handleDeepReasoning}
                />
              </div>
            </div>
          </form>

          <div className="mt-2 text-center text-xs text-gray-400 space-y-1">
            <p className="hidden sm:block">
              Nexus AI puede cometer errores. Considera verificar la información importante.
            </p>
            <p>Nexa Digital - Donde la Innovación se Encuentra con la Imaginación</p>
            <p>Costa Rica - Pura Vida</p>
          </div>
        </div>
      </div>
    </>
  );
};