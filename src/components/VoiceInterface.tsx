import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, X, Settings, VolumeX, Volume2 } from 'lucide-react';
import * as Tooltip from '@radix-ui/react-tooltip';
import { useChatStore } from '../store/chat';
import { useGPTStore } from '../store/gpt';
import { generateSpeech, streamSpeech } from '../lib/openai';

interface VoiceInterfaceProps {
  isOpen: boolean;
  onClose: () => void;
  onTranscript: (text: string) => void;
}

export const VoiceInterface: React.FC<VoiceInterfaceProps> = ({
  isOpen,
  onClose,
  onTranscript
}) => {
  const { activeAssistant } = useChatStore();
  const { activeGPT } = useGPTStore();
  const [permissionStatus, setPermissionStatus] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [processingState, setProcessingState] = useState<'listening' | 'processing' | 'speaking'>('listening');
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  
  // Initialize audio context and request microphone permission
  useEffect(() => {
    if (!isOpen) return;
    
    const checkMicrophonePermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaStreamRef.current = stream;
        setPermissionStatus('granted');
        
        // Initialize audio context and analyzer
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioContextRef.current = audioContext;
        
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        analyserRef.current = analyser;
        
        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);
        audioSourceRef.current = source;
        
        // Start monitoring audio levels
        startAudioLevelMonitoring();
        
        // Initialize speech recognition
        initSpeechRecognition();
      } catch (error) {
        console.error('Error accessing microphone:', error);
        setPermissionStatus('denied');
      }
    };
    
    checkMicrophonePermission();
    
    return () => {
      // Clean up resources
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
      
      if (audioSourceRef.current) {
        audioSourceRef.current.disconnect();
      }
      
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
      
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [isOpen]);
  
  const startAudioLevelMonitoring = () => {
    if (!analyserRef.current) return;
    
    const analyser = analyserRef.current;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    
    const updateAudioLevel = () => {
      if (!analyserRef.current) return;
      
      analyserRef.current.getByteFrequencyData(dataArray);
      
      // Calculate average volume level
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      const average = sum / dataArray.length;
      const normalizedLevel = average / 255; // Normalize to 0-1 range
      
      setAudioLevel(normalizedLevel);
      
      if (!isMuted) {
        requestAnimationFrame(updateAudioLevel);
      }
    };
    
    updateAudioLevel();
  };
  
  const initSpeechRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.error('Speech recognition not supported in this browser');
      return;
    }
    
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'es-ES';
    
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map(result => result[0].transcript)
        .join('');
      
      if (event.results[event.results.length - 1].isFinal) {
        onTranscript(transcript);
        
        // Simulate processing and response
        setProcessingState('processing');
        setTimeout(() => {
          processVoiceInput(transcript);
        }, 1000);
      }
    };
    
    recognition.onend = () => {
      if (!isMuted && permissionStatus === 'granted') {
        recognition.start();
      }
    };
    
    recognition.start();
    recognitionRef.current = recognition;
  };
  
  const processVoiceInput = async (input: string) => {
    setProcessingState('speaking');
    
    // Get voice settings from active GPT
    const voice = activeGPT?.voice || 'alloy';
    
    try {
      // Use API configuration from active GPT if available
      const apiConfig = activeGPT?.apiConfig ? {
        useCustomApi: activeGPT.apiConfig.useCustomApi
      } : undefined;

      // Generate speech using OpenAI API
      const audioBlob = await generateSpeech(
        `Procesando tu mensaje: "${input}". Esta es una respuesta de prueba usando la voz ${voice}.`,
        {
          voice,
          model: 'tts-1',
          assistantId: activeAssistant.id
        },
        apiConfig
      );
      
      // Play the audio
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audio.volume = 1.0;
      audio.playbackRate = 1.1; // Slightly faster as per requirement
      
      audio.onended = () => {
        setProcessingState('listening');
        URL.revokeObjectURL(audioUrl);
      };
      
      audioElementRef.current = audio;
      audio.play();
      setIsPlaying(true);
    } catch (error) {
      console.error('Error generating speech:', error);
      setProcessingState('listening');
    }
  };
  
  const toggleMute = () => {
    setIsMuted(!isMuted);
    
    if (!isMuted) {
      // Stop recognition when muting
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    } else {
      // Unmute - restart recognition
      if (recognitionRef.current) {
        recognitionRef.current.start();
      }
      startAudioLevelMonitoring();
    }
  };
  
  const togglePlayback = () => {
    if (!audioElementRef.current) return;
    
    if (isPlaying) {
      audioElementRef.current.pause();
    } else {
      audioElementRef.current.play();
    }
    
    setIsPlaying(!isPlaying);
  };
  
  const handleClose = () => {
    // Stop all audio processes
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    
    if (audioElementRef.current) {
      audioElementRef.current.pause();
    }
    
    // Stop all audio processes
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    
    if (audioElementRef.current) {
      audioElementRef.current.pause();
    }
    
    setIsMuted(false);
    setIsPlaying(false);
    setProcessingState('listening');
    onClose();
  };
  
  const renderPermissionRequest = () => (
    <div className="text-center">
      <h3 className="text-xl font-semibold text-white mb-4">Acceso al Micrófono</h3>
      <p className="text-gray-300 mb-6">
        Para usar la interfaz de voz, necesitamos acceso a tu micrófono.
      </p>
      <button
        onClick={() => setPermissionStatus('granted')}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        Permitir Acceso
      </button>
    </div>
  );
  
  const renderDeniedMessage = () => (
    <div className="text-center">
      <h3 className="text-xl font-semibold text-white mb-4">Acceso Denegado</h3>
      <p className="text-gray-300 mb-6">
        No se pudo acceder al micrófono. Por favor, verifica los permisos en tu navegador.
      </p>
      <button
        onClick={handleClose}
        className="px-4 py-2 bg-[#2A2B32] text-white rounded-lg hover:bg-[#40414F] transition-colors"
      >
        Cerrar
      </button>
    </div>
  );
  
  const renderVoiceIndicator = () => (
    <div className="relative">
      <div className="w-24 h-24 rounded-full bg-[#2A2B32] flex items-center justify-center">
        {processingState === 'listening' ? (
          <Mic className={`w-10 h-10 ${isMuted ? 'text-red-400' : 'text-white'}`} />
        ) : processingState === 'processing' ? (
          <div className="w-10 h-10 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-t-blue-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <Volume2 className="w-10 h-10 text-blue-400" />
        )}
      </div>
      
      {/* Audio level rings */}
      {!isMuted && (
        <>
          <motion.div
            animate={{
              scale: 1 + audioLevel * 0.5,
              opacity: 0.2 + audioLevel * 0.3
            }}
            className="absolute inset-0 rounded-full border-2 border-white"
          />
          <motion.div
            animate={{
              scale: 1 + audioLevel * 1.0,
              opacity: 0.1 + audioLevel * 0.2
            }}
            className="absolute inset-0 rounded-full border-2 border-white"
          />
          <motion.div
            animate={{
              scale: 1 + audioLevel * 1.5,
              opacity: 0.05 + audioLevel * 0.1
            }}
            className="absolute inset-0 rounded-full border-2 border-white"
          />
        </>
      )}
    </div>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative flex flex-col items-center max-w-md w-full mx-auto px-4"
          >
            {permissionStatus === 'prompt' && renderPermissionRequest()}
            {permissionStatus === 'denied' && renderDeniedMessage()}
            {permissionStatus === 'granted' && (
              <>
                <motion.div
                  animate={{
                    scale: 1 + audioLevel * 0.3,
                    opacity: 0.2 + audioLevel * 0.8
                  }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  className="absolute w-64 h-64 bg-white rounded-full"
                  style={{ filter: 'blur(40px)' }}
                />
                
                {renderVoiceIndicator()}

                <div className="mt-12 flex items-center gap-4">
                  <Tooltip.Provider delayDuration={300}>
                    <Tooltip.Root>
                      <Tooltip.Trigger asChild>
                        <button
                          onClick={toggleMute}
                          className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
                            isMuted 
                              ? 'bg-red-500/20 hover:bg-red-500/30' 
                              : 'bg-[#2A2B32] hover:bg-[#40414F]'
                          }`}
                        >
                          {isMuted ? (
                            <MicOff className="w-6 h-6 text-red-400" />
                          ) : (
                            <Mic className="w-6 h-6 text-white" />
                          )}
                        </button>
                      </Tooltip.Trigger>
                      <Tooltip.Portal>
                        <Tooltip.Content
                          className="px-3 py-1.5 text-sm bg-[#202123] text-white rounded-lg animate-in"
                          sideOffset={5}
                        >
                          {isMuted ? 'Activar micrófono' : 'Apagar micrófono'}
                          <Tooltip.Arrow className="fill-[#202123]" />
                        </Tooltip.Content>
                      </Tooltip.Portal>
                    </Tooltip.Root>
                  </Tooltip.Provider>

                  {processingState === 'speaking' && (
                    <Tooltip.Provider delayDuration={300}>
                      <Tooltip.Root>
                        <Tooltip.Trigger asChild>
                          <button
                            onClick={togglePlayback}
                            className="w-14 h-14 bg-[#2A2B32] rounded-full flex items-center justify-center hover:bg-[#40414F] transition-colors"
                          >
                            {isPlaying ? (
                              <VolumeX className="w-6 h-6 text-white" />
                            ) : (
                              <Volume2 className="w-6 h-6 text-white" />
                            )}
                          </button>
                        </Tooltip.Trigger>
                        <Tooltip.Portal>
                          <Tooltip.Content
                            className="px-3 py-1.5 text-sm bg-[#202123] text-white rounded-lg animate-in"
                            sideOffset={5}
                          >
                            {isPlaying ? 'Pausar audio' : 'Reproducir audio'}
                            <Tooltip.Arrow className="fill-[#202123]" />
                          </Tooltip.Content>
                        </Tooltip.Portal>
                      </Tooltip.Root>
                    </Tooltip.Provider>
                  )}

                  <Tooltip.Provider delayDuration={300}>
                    <Tooltip.Root>
                      <Tooltip.Trigger asChild>
                        <button
                          onClick={() => setShowVoiceSelector(true)}
                          className="w-14 h-14 bg-[#2A2B32] rounded-full flex items-center justify-center hover:bg-[#40414F] transition-colors"
                        >
                          <Settings className="w-6 h-6 text-white" />
                        </button>
                      </Tooltip.Trigger>
                      <Tooltip.Portal>
                        <Tooltip.Content
                          className="px-3 py-1.5 text-sm bg-[#202123] text-white rounded-lg animate-in"
                          sideOffset={5}
                        >
                          Configuración de voz
                          <Tooltip.Arrow className="fill-[#202123]" />
                        </Tooltip.Content>
                      </Tooltip.Portal>
                    </Tooltip.Root>
                  </Tooltip.Provider>

                  <Tooltip.Provider delayDuration={300}>
                    <Tooltip.Root>
                      <Tooltip.Trigger asChild>
                        <button
                          onClick={handleClose}
                          className="w-14 h-14 bg-[#2A2B32] rounded-full flex items-center justify-center hover:bg-[#40414F] transition-colors"
                        >
                          <X className="w-6 h-6 text-white" />
                        </button>
                      </Tooltip.Trigger>
                      <Tooltip.Portal>
                        <Tooltip.Content
                          className="px-3 py-1.5 text-sm bg-[#202123] text-white rounded-lg animate-in"
                          sideOffset={5}
                        >
                          Finalizar
                          <Tooltip.Arrow className="fill-[#202123]" />
                        </Tooltip.Content>
                      </Tooltip.Portal>
                    </Tooltip.Root>
                  </Tooltip.Provider>
                </div>

                <div className="mt-6 text-center">
                  <p className="text-white/80 text-sm mb-1">
                    {isMuted ? 'Micrófono apagado' : 
                     processingState === 'listening' ? 'Escuchando...' : 
                     processingState === 'processing' ? 'Procesando...' : 
                     'Hablando...'}
                  </p>
                  <p className="text-white/60 text-xs">
                    Voz: {voiceSettings.voice.charAt(0).toUpperCase() + voiceSettings.voice.slice(1)}
                  </p>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};