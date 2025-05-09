import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Upload, X, Plus, Check, Info, AlertCircle, Code, ExternalLink, Settings, Mic, Brain, Sparkles, Gauge } from 'lucide-react';
import { useGPTStore } from '../../store/gpt';
import { useDropzone } from 'react-dropzone';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface FileWithPreview extends File {
  preview?: string;
  content?: string;
}

export const CreateGPT: React.FC = () => {
  const navigate = useNavigate();
  const { addGPT, gpts } = useGPTStore();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    instructions: '',
    visibility: 'public' as 'public' | 'private' | 'draft',
    model: 'gpt-4',
    isDefault: false,
    gptId: '',
    capabilities: {
      webSearch: true,
      codeInterpreter: true,
      imageGeneration: true,
      fileUpload: true
    }
  });
  
  const [apiConfig, setApiConfig] = useState({
    useCustomApi: false,
    apiKey: ''
  });
  
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [activeTab, setActiveTab] = useState<'general' | 'voice' | 'consumption'>('general');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showPreview, setShowPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [voiceSettings, setVoiceSettings] = useState({
    realtimeApi: false,
    realtimeApiKey: '',
    elevenLabsApi: false,
    elevenLabsApiKey: '',
    voiceId: '',
    latency: 100
  });
  const [chatStarters, setChatStarters] = useState<string[]>([]);
  const [newStarter, setNewStarter] = useState('');
  
  // ... rest of the component code ...

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* ... rest of the JSX ... */}
    </div>
  );
};