import React, { useState, useEffect } from 'react';
import { Menu, Bell, Settings, User, X, Volume2 } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import * as HoverCard from '@radix-ui/react-hover-card';
import * as Tooltip from '@radix-ui/react-tooltip';
import { useChatStore } from '../store/chat';
import { VoiceSettings } from '../types';

export const Header: React.FC = () => {
  const { activeAssistant, toggleSidebar } = useChatStore();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isVoiceSettingsOpen, setIsVoiceSettingsOpen] = useState(false);
  const [profileData, setProfileData] = useState({
    name: 'Usuario',
    email: 'usuario@example.com',
    phone: '+506 8888-8888',
    city: 'San José'
  });
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>({
    speed: 1.0,
    volume: 0.8,
    voice: 'alloy'
  });

  useEffect(() => {
    // Update voice settings when active assistant changes
    if (activeAssistant.voice) {
      setVoiceSettings(prev => ({
        ...prev,
        voice: activeAssistant.voice || 'alloy'
      }));
    }
  }, [activeAssistant]);

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Save profile data
    setIsProfileOpen(false);
  };

  const handleVoiceSettingsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Save voice settings
    setIsVoiceSettingsOpen(false);
  };

  return (
    <header className="border-b border-[#2A2B32] py-2 px-4 flex items-center justify-between">
      <div className="flex items-center">
        <button
          onClick={toggleSidebar}
          className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg"
          aria-label="Toggle sidebar"
        >
          <Menu size={20} />
        </button>
        <div className="ml-4">
          <h1 className="text-lg font-semibold text-white">{activeAssistant.name}</h1>
          <p className="text-xs text-gray-400">{activeAssistant.role}</p>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <HoverCard.Root openDelay={200} closeDelay={100}>
          <HoverCard.Trigger asChild>
            <button
              onClick={() => setIsVoiceSettingsOpen(true)}
              className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg"
              aria-label="Voice settings"
            >
              <Volume2 size={20} />
            </button>
          </HoverCard.Trigger>
          <HoverCard.Portal>
            <HoverCard.Content
              className="w-64 bg-[#202123] rounded-lg shadow-lg p-4 animate-in data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2"
              sideOffset={5}
              align="end"
            >
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-white">Configuración de Voz</h3>
                <p className="text-xs text-gray-400">
                  Personaliza la voz del asistente y ajusta la velocidad y volumen.
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-300">Voz actual:</span>
                  <span className="text-xs font-medium text-white">
                    {voiceSettings.voice.charAt(0).toUpperCase() + voiceSettings.voice.slice(1)}
                  </span>
                </div>
              </div>
            </HoverCard.Content>
          </HoverCard.Portal>
        </HoverCard.Root>

        <button
          onClick={() => setIsSettingsOpen(true)}
          className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg"
          aria-label="Settings"
        >
          <Settings size={20} />
        </button>
        
        <button
          className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg"
          aria-label="Notifications"
        >
          <Bell size={20} />
        </button>
        
        <button
          onClick={() => setIsProfileOpen(true)}
          className="w-8 h-8 rounded-full bg-[#5C5C7B] flex items-center justify-center"
          aria-label="Profile"
        >
          <User size={16} className="text-white" />
        </button>
      </div>

      <Dialog.Root open={isProfileOpen} onOpenChange={setIsProfileOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
          <Dialog.Content className="fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] w-full max-w-md bg-[#202123] rounded-lg shadow-xl p-6 focus:outline-none animate-in slide-in-from-right-1/2">
            <div className="flex items-center justify-between mb-4">
              <Dialog.Title className="text-lg font-semibold text-white">
                Profile Settings
              </Dialog.Title>
              <button
                onClick={() => setIsProfileOpen(false)}
                className="p-1 text-gray-400 hover:text-white rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-400 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={profileData.name}
                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                  className="w-full bg-[#40414F] text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#0A2A43]"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-400 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                  className="w-full bg-[#40414F] text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#0A2A43]"
                />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-400 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  id="phone"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  className="w-full bg-[#40414F] text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#0A2A43]"
                />
              </div>
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-400 mb-1">
                  City
                </label>
                <input
                  type="text"
                  id="city"
                  value={profileData.city}
                  onChange={(e) => setProfileData({ ...profileData, city: e.target.value })}
                  className="w-full bg-[#40414F] text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#0A2A43]"
                />
              </div>
              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <Dialog.Root open={isVoiceSettingsOpen} onOpenChange={setIsVoiceSettingsOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
          <Dialog.Content className="fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] w-full max-w-md bg-[#202123] rounded-lg shadow-xl p-6 focus:outline-none animate-in slide-in-from-right-1/2">
            <div className="flex items-center justify-between mb-4">
              <Dialog.Title className="text-lg font-semibold text-white">
                Configuración de Voz
              </Dialog.Title>
              <button
                onClick={() => setIsVoiceSettingsOpen(false)}
                className="p-1 text-gray-400 hover:text-white rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleVoiceSettingsSubmit} className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-2">Voz del Asistente</h3>
                <div className="space-y-2">
                  {[
                    { id: 'alloy', name: 'Alloy', description: 'Voz neutral y versátil' },
                    { id: 'echo', name: 'Echo', description: 'Voz más profunda y resonante' },
                    { id: 'fable', name: 'Fable', description: 'Voz cálida y expresiva' },
                    { id: 'onyx', name: 'Onyx', description: 'Voz autoritaria y clara' },
                    { id: 'nova', name: 'Nova', description: 'Voz suave y melodiosa' },
                    { id: 'shimmer', name: 'Shimmer', description: 'Voz brillante y enérgica' },
                  ].map(voice => (
                    <div key={voice.id} className="flex items-center">
                      <input
                        type="radio"
                        id={`voice-${voice.id}`}
                        name="voice"
                        value={voice.id}
                        checked={voiceSettings.voice === voice.id}
                        onChange={() => setVoiceSettings(prev => ({ ...prev, voice: voice.id as VoiceSettings['voice'] }))}
                        className="mr-2"
                      />
                      <label htmlFor={`voice-${voice.id}`} className="flex flex-col">
                        <span className="text-sm text-white">{voice.name}</span>
                        <span className="text-xs text-gray-400">{voice.description}</span>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-2">Configuración de Audio</h3>
                <div className="space-y-2">
                  <label className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">Velocidad</span>
                    <input
                      type="range"
                      min="0.5"
                      max="2"
                      step="0.1"
                      value={voiceSettings.speed}
                      onChange={(e) => setVoiceSettings(prev => ({ ...prev, speed: parseFloat(e.target.value) }))}
                      className="w-32"
                    />
                    <span className="text-xs text-gray-400 w-8 text-right">{voiceSettings.speed}x</span>
                  </label>
                  <label className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">Volumen</span>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={voiceSettings.volume}
                      onChange={(e) => setVoiceSettings(prev => ({ ...prev, volume: parseFloat(e.target.value) }))}
                      className="w-32"
                    />
                    <span className="text-xs text-gray-400 w-8 text-right">{Math.round(voiceSettings.volume * 100)}%</span>
                  </label>
                </div>
              </div>
              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Guardar Configuración
                </button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <Dialog.Root open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
          <Dialog.Content className="fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] w-full max-w-md bg-[#202123] rounded-lg shadow-xl p-6 focus:outline-none animate-in slide-in-from-right-1/2">
            <div className="flex items-center justify-between mb-4">
              <Dialog.Title className="text-lg font-semibold text-white">
                Settings
              </Dialog.Title>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="p-1 text-gray-400 hover:text-white rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-2">Voice Settings</h3>
                <div className="space-y-2">
                  <label className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">Voice Speed</span>
                    <input
                      type="range"
                      min="0.5"
                      max="2"
                      step="0.1"
                      defaultValue="1"
                      className="w-32"
                    />
                  </label>
                  <label className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">Volume</span>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      defaultValue="0.8"
                      className="w-32"
                    />
                  </label>
                </div>
              </div>
              <div className="pt-4">
                <button
                  type="button"
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Save Settings
                </button>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </header>
  );
};