import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Upload, X, Save, Trash2, Check, Info, AlertCircle, Code, ExternalLink } from 'lucide-react';
import { useGPTStore } from '../../store/gpt';
import { useDropzone } from 'react-dropzone';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { assistants } from '../../data/assistants';

interface FileWithPreview extends File {
  preview?: string;
  content?: string;
}

export const EditGPT: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { gpts, updateGPT, deleteGPT } = useGPTStore();
  
  // Find GPT in custom GPTs or built-in assistants
  const customGpt = gpts.find(g => g.id === id);
  const builtInAssistant = assistants.find(a => a.id === id);
  
  // Convert built-in assistant to GPT format if needed
  const builtInGpt = builtInAssistant ? {
    id: builtInAssistant.id,
    name: builtInAssistant.name,
    description: builtInAssistant.description,
    role: builtInAssistant.role,
    instructions: `You are ${builtInAssistant.name}, ${builtInAssistant.description}`,
    avatar: builtInAssistant.avatar,
    capabilities: {
      webSearch: true,
      codeInterpreter: true,
      imageGeneration: true,
      fileUpload: true
    },
    files: [],
    createdAt: new Date().toISOString(),
    model: 'gpt-4',
    visibility: 'public' as const,
    isDefault: builtInAssistant.isDefault,
    apiConfig: {
      useCustomApi: false
    }
  } : null;
  
  // Use custom GPT if available, otherwise use built-in GPT
  const gpt = customGpt || builtInGpt;
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    gptId: '',
    instructions: '',
    visibility: 'public' as 'public' | 'private' | 'draft',
    model: 'gpt-4',
    isDefault: false,
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
  
  const [existingFiles, setExistingFiles] = useState<string[]>([]);
  const [newFiles, setNewFiles] = useState<FileWithPreview[]>([]);
  const [activeTab, setActiveTab] = useState<'configure' | 'knowledge' | 'api'>('configure');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showPreview, setShowPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  
  useEffect(() => {
    if (gpt && !isInitialized) {
      setFormData({
        name: gpt.name,
        description: gpt.description,
        gptId: gpt.gptId || '',
        instructions: gpt.instructions || '',
        visibility: gpt.visibility || 'public',
        model: gpt.model || 'gpt-4',
        isDefault: gpt.isDefault || false,
        capabilities: gpt.capabilities
      });
      
      if (gpt.apiConfig) {
        setApiConfig({
          useCustomApi: gpt.apiConfig.useCustomApi || false,
          apiKey: gpt.apiConfig.apiKey || ''
        });
      }
      
      setExistingFiles(gpt.files || []);
      setAvatarPreview(gpt.avatar);
      setIsInitialized(true);
    } else if (!gpt && !isInitialized) {
      navigate('/admin');
    }
  }, [gpt, navigate, isInitialized]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleApiConfigChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setApiConfig(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };
  
  const handleCapabilityChange = (capability: keyof typeof formData.capabilities) => {
    setFormData(prev => ({
      ...prev,
      capabilities: {
        ...prev.capabilities,
        [capability]: !prev.capabilities[capability]
      }
    }));
  };

  const handleVisibilityChange = (visibility: 'public' | 'private' | 'draft') => {
    setFormData(prev => ({
      ...prev,
      visibility
    }));
  };

  const handleDefaultChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      isDefault: e.target.checked
    }));
  };
  
  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      'text/plain': ['.txt'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/javascript': ['.js'],
      'text/python': ['.py'],
      'application/json': ['.json'],
      'text/markdown': ['.md'],
      'text/csv': ['.csv']
    },
    onDrop: (acceptedFiles) => {
      const uploadedFiles = acceptedFiles.map(file => 
        Object.assign(file, {
          preview: URL.createObjectURL(file)
        })
      );
      
      // Read text files content
      uploadedFiles.forEach(file => {
        if (file.type.startsWith('text/') || 
            file.type === 'application/json' || 
            file.name.endsWith('.py') || 
            file.name.endsWith('.js')) {
          const reader = new FileReader();
          reader.onload = () => {
            file.content = reader.result as string;
          };
          reader.readAsText(file);
        }
      });
      
      setNewFiles(prev => [...prev, ...uploadedFiles]);
    }
  });

  const { getRootProps: getAvatarRootProps, getInputProps: getAvatarInputProps } = useDropzone({
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.svg']
    },
    maxFiles: 1,
    // Removed file size restrictions
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        setAvatarFile(file);
        setAvatarPreview(URL.createObjectURL(file));
      }
    }
  });
  
  const removeNewFile = (index: number) => {
    setNewFiles(prev => {
      const newFiles = [...prev];
      if (newFiles[index].preview) {
        URL.revokeObjectURL(newFiles[index].preview!);
      }
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const removeExistingFile = (fileName: string) => {
    setExistingFiles(prev => prev.filter(file => file !== fileName));
  };

  const removeAvatar = () => {
    if (avatarPreview && avatarFile) {
      URL.revokeObjectURL(avatarPreview);
    }
    setAvatarFile(null);
    setAvatarPreview(gpt?.avatar || null);
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    // Validate required fields
    if (!formData.name.trim()) {
      setError('GPT name is required');
      setIsSubmitting(false);
      return;
    }

    if (apiConfig.useCustomApi && (!apiConfig.apiKey || !formData.gptId)) {
      setError('API Key and GPT ID are required when using custom API');
      setIsSubmitting(false);
      return;
    }
    
    // Convert avatar file to base64 if it exists
    let avatarUrl = gpt?.avatar || 'https://via.placeholder.com/40';
    
    const processAvatar = () => {
      return new Promise<string>((resolve) => {
        if (avatarFile) {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(avatarFile);
        } else if (avatarPreview) {
          resolve(avatarPreview);
        } else {
          resolve(avatarUrl);
        }
      });
    };
    
    processAvatar()
      .then(processedAvatarUrl => {
        const updatedGPT = {
          ...gpt!,
          name: formData.name,
          description: formData.description,
          role: formData.name,
          gptId: formData.gptId,
          instructions: formData.instructions,
          avatar: processedAvatarUrl,
          capabilities: formData.capabilities,
          files: [...existingFiles, ...newFiles.map(file => file.name)],
          model: formData.model,
          visibility: formData.visibility,
          isDefault: formData.isDefault,
          apiConfig: {
            useCustomApi: apiConfig.useCustomApi,
            apiKey: apiConfig.apiKey
          },
          updatedAt: new Date().toISOString()
        };
        
        updateGPT(updatedGPT);
        navigate('/admin');
      })
      .catch(err => {
        console.error('Error updating GPT:', err);
        setError('Failed to update GPT. Please try again.');
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  const handleDelete = () => {
    if (id) {
      deleteGPT(id);
      navigate('/admin');
    }
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    switch(extension) {
      case 'py':
        return <span className="text-blue-400">PY</span>;
      case 'js':
        return <span className="text-yellow-400">JS</span>;
      case 'json':
        return <span className="text-green-400">JSON</span>;
      case 'txt':
        return <span className="text-gray-400">TXT</span>;
      case 'pdf':
        return <span className="text-red-400">PDF</span>;
      case 'doc':
      case 'docx':
        return <span className="text-blue-400">DOC</span>;
      case 'md':
        return <span className="text-purple-400">MD</span>;
      case 'csv':
        return <span className="text-green-400">CSV</span>;
      default:
        return <span className="text-gray-400">FILE</span>;
    }
  };

  const getLanguageFromFile = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    switch(extension) {
      case 'py':
        return 'python';
      case 'js':
        return 'javascript';
      case 'json':
        return 'json';
      case 'md':
        return 'markdown';
      case 'css':
        return 'css';
      case 'html':
        return 'html';
      default:
        return 'text';
    }
  };
  
  if (!gpt) {
    return <div className="p-6">GPT not found </div>;
  }
  
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Edit GPT: {gpt.name}</h1>
        <div className="flex items-center gap-3">
          <a
            href={`/chat?assistant=${gpt.id}`}
            className="flex items-center gap-2 px-4 py-2 bg-[#343541] text-white rounded-lg hover:bg-[#40414F] transition-colors"
          >
            <ExternalLink size={18} />
            <span>Test GPT</span>
          </a>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
          >
            <Trash2 size={18} />
            <span>Delete</span>
          </button>
        </div>
      </div>
      
      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}
      
      <div className="bg-[#2A2B32] rounded-lg overflow-hidden mb-6">
        <div className="flex border-b border-[#343541] overflow-x-auto">
          <button
            className={`px-4 py-3 text-sm font-medium whitespace-nowrap ${
              activeTab === 'configure'
                ? 'text-white border-b-2 border-blue-500'
                : 'text-gray-400 hover:text-white'
            }`}
            onClick={() => setActiveTab('configure')}
          >
            Configure
          </button>
          <button
            className={`px-4 py-3 text-sm font-medium whitespace-nowrap ${
              activeTab === 'api'
                ? 'text-white border-b-2 border-blue-500'
                : 'text-gray-400 hover:text-white'
            }`}
            onClick={() => setActiveTab('api')}
          >
            API
          </button>
          <button
            className={`px-4 py-3 text-sm font-medium whitespace-nowrap ${
              activeTab === 'knowledge'
                ? 'text-white border-b-2 border-blue-500'
                : 'text-gray-400 hover:text-white'
            }`}
            onClick={() => setActiveTab('knowledge')}
          >
            Knowledge
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          {activeTab === 'configure' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-3">
                  Avatar
                </label>
                <div className="flex items-center gap-4">
                  <div 
                    {...getAvatarRootProps()} 
                    className={`w-24 h-24 rounded-full flex items-center justify-center cursor-pointer border-2 ${
                      avatarPreview ? 'border-transparent' : 'border-dashed border-[#343541] hover:border-blue-500'
                    } transition-colors overflow-hidden`}
                  >
                    <input {...getAvatarInputProps()} />
                    {avatarPreview ? (
                      <img 
                        src={avatarPreview} 
                        alt="Avatar preview" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center">
                        <Upload className="w-6 h-6 text-gray-400" />
                        <span className="text-xs text-gray-400 mt-1">Upload</span>
                      </div>
                    )}
                  </div>
                  
                  {avatarPreview && avatarFile && (
                    <button
                      type="button"
                      onClick={removeAvatar}
                      className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  )}
                  
                  <div className="text-xs text-gray-400">
                    <p>Upload an image for your GPT's avatar</p>
                    <p>Recommended: Square image, at least 200x200px</p>
                  </div>
                </div>
              </div>
              
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-400 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full bg-[#343541] text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="My Custom GPT"
                />
              </div>
              
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-400 mb-1">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  className="w-full bg-[#343541] text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="A helpful AI assistant that..."
                />
              </div>
              
              <div>
                <label htmlFor="model" className="block text-sm font-medium text-gray-400 mb-1">
                  Model
                </label>
                <select
                  id="model"
                  name="model"
                  value={formData.model}
                  onChange={handleChange}
                  className="w-full bg-[#343541] text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="gpt-4">GPT-4</option>
                  <option value="gpt-4-turbo">GPT-4 Turbo</option>
                  <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="instructions" className="block text-sm font-medium text-gray-400 mb-1">
                  Instructions
                </label>
                <textarea
                  id="instructions"
                  name="instructions"
                  value={formData.instructions}
                  onChange={handleChange}
                  rows={6}
                  className="w-full bg-[#343541] text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono text-sm"
                  placeholder="You are a helpful AI assistant that..."
                />
                <p className="mt-1 text-xs text-gray-500">
                  These instructions will guide your GPT's behavior and responses.
                </p>
              </div>

              <div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isDefault}
                    onChange={handleDefaultChange}
                    className="sr-only"
                  />
                  <div className={`w-5 h-5 rounded flex items-center justify-center ${
                    formData.isDefault ? 'bg-blue-500' : 'bg-[#343541]'
                  }`}>
                    {formData.isDefault && <Check size={14} className="text-white" />}
                  </div>
                  <span className="text-sm text-gray-300">Set as default GPT</span>
                </label>
                <p className="mt-1 text-xs text-gray-500 ml-8">
                  This GPT will be used as the default when starting new conversations.
                </p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-3">Visibility</h3>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      checked={formData.visibility === 'public'}
                      onChange={() => handleVisibilityChange('public')}
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                      formData.visibility === 'public' ? 'bg-blue-500' : 'bg-[#343541]'
                    }`}>
                      {formData.visibility === 'public' && <Check size={14} className="text-white" />}
                    </div>
                    <span className="text-sm text-gray-300">Public - Available to everyone</span>
                  </label>
                  
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      checked={formData.visibility === 'private'}
                      onChange={() => handleVisibilityChange('private')}
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                      formData.visibility === 'private' ? 'bg-blue-500' : 'bg-[#343541]'
                    }`}>
                      {formData.visibility === 'private' && <Check size={14} className="text-white" />}
                    </div>
                    <span className="text-sm text-gray-300">Private - Only you can use it</span>
                  </label>
                  
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      checked={formData.visibility === 'draft'}
                      onChange={() => handleVisibilityChange('draft')}
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                      formData.visibility === 'draft' ? 'bg-blue-500' : 'bg-[#343541]'
                    }`}>
                      {formData.visibility === 'draft' && <Check size={14} className="text-white" />}
                    </div>
                    <span className="text-sm text-gray-300">Draft - Under construction, not accessible</span>
                  </label>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-3">Capabilities</h3>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.capabilities.webSearch}
                      onChange={() => handleCapabilityChange('webSearch')}
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 rounded flex items-center justify-center ${
                      formData.capabilities.webSearch ? 'bg-blue-500' : 'bg-[#343541]'
                    }`}>
                      {formData.capabilities.webSearch && <Check size={14} className="text-white" />}
                    </div>
                    <span className="text-sm text-gray-300">Web Search</span>
                  </label>
                  
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.capabilities.codeInterpreter}
                      onChange={() => handleCapabilityChange('codeInterpreter')}
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 rounded flex items-center justify-center ${
                      formData.capabilities.codeInterpreter ? 'bg-blue-500' : 'bg-[#343541]'
                    }`}>
                      {formData.capabilities.codeInterpreter && <Check size={14} className="text-white" />}
                    </div>
                    <span className="text-sm text-gray-300">Code Interpreter</span>
                  </label>
                  
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.capabilities.imageGeneration}
                      onChange={() => handleCapabilityChange('imageGeneration')}
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 rounded flex items-center justify-center ${
                      formData.capabilities.imageGeneration ? 'bg-blue-500' : 'bg-[#343541]'
                    }`}>
                      {formData.capabilities.imageGeneration && <Check size={14} className="text-white" />}
                    </div>
                    <span className="text-sm text-gray-300">Image Generation (DALL-E)</span>
                  </label>
                  
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.capabilities.fileUpload}
                      onChange={() => handleCapabilityChange('fileUpload')}
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 rounded flex items-center justify-center ${
                      formData.capabilities.fileUpload ? 'bg-blue-500' : 'bg-[#343541]'
                    }`}>
                      {formData.capabilities.fileUpload && <Check size={14} className="text-white" />}
                    </div>
                    <span className="text-sm text-gray-300">File Upload & Analysis</span>
                  </label>
                </div>
              </div>
            </motion.div>
          )}
          
          {activeTab === 'api' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-blue-400">API Configuration</p>
                  <p className="text-xs text-blue-400/80 mt-1">
                    Configure this GPT to use your own API for reasoning. Each GPT can have its own API key.
                  </p>
                </div>
              </div>

              <div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="useCustomApi"
                    checked={apiConfig.useCustomApi}
                    onChange={handleApiConfigChange}
                    className="sr-only"
                  />
                  <div className={`w-10 h-5 rounded-full transition-colors ${
                    apiConfig.useCustomApi ? 'bg-blue-500' : 'bg-[#343541]'
                  } relative`}>
                    <div className={`absolute w-4 h-4 rounded-full bg-white top-0.5 transition-transform ${
                      apiConfig.useCustomApi ? 'translate-x-5' : 'translate-x-0.5'
                    }`} />
                  </div>
                  <span className="text-sm text-gray-300">Use Custom API</span>
                </label>
              </div>

              {apiConfig.useCustomApi && (
                <div>
                  <div>
                    <label htmlFor="gptId" className="block text-sm font-medium text-gray-400 mb-1">
                      GPT ID
                    </label>
                    <input
                      type="text"
                      id="gptId"
                      name="gptId"
                      value={formData.gptId}
                      onChange={handleChange}
                      className="w-full bg-[#343541] text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                      placeholder="asst_abc123..."
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      The unique identifier for your GPT from OpenAI
                    </p>
                  </div>

                  <div className="mt-4">
                    <label htmlFor="apiKey" className="block text-sm font-medium text-gray-400 mb-1">
                    API Key
                    </label>
                    <input
                      type="password"
                      id="apiKey"
                      name="apiKey"
                      value={apiConfig.apiKey}
                      onChange={handleApiConfigChange}
                      className="w-full bg-[#343541] text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                      placeholder="sk-..."
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      This API key will be used for processing requests for this GPT
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          )}
          
          {activeTab === 'knowledge' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-3">Knowledge Files</h3>
                <p className="text-xs text-gray-500 mb-4">
                  Upload files to provide your GPT with additional knowledge. Supported formats: .txt, .pdf, .doc, .docx, .py, .js, .json, .md, .csv
                </p>
                
                <div {...getRootProps()} className="border-2 border-dashed border-[#343541] rounded-lg p-6 text-center cursor-pointer hover:border-blue-500 transition-colors">
                  <input {...getInputProps()} />
                  <div className="mx-auto flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-full bg-[#343541] flex items-center justify-center">
                      <Upload className="w-6 h-6 text-gray-400" />
                    </div>
                    <span className="text-xs text-gray-400 mt-1">Upload</span>
                    <p className="text-xs text-gray-400 text-center">
                      Drag and drop files here or click to select files
                    </p>
                  </div>
                </div>

                {/* Existing Files */}
                {existingFiles.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <h4 className="text-sm font-medium text-gray-400">Existing Files</h4>
                    {existingFiles.map((fileName, index) => (
                      <div
                        key={`existing-${index}`}
                        className="flex items-center justify-between p-3 bg-[#343541] rounded-lg group"
                      >
                        <div className="flex items-center gap-3">
                          {getFileIcon(fileName)}
                          <span className="text-sm text-gray-300">{fileName}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeExistingFile(fileName)}
                          className="p-1 text-gray-400 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* New Files */}
                {newFiles.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <h4 className="text-sm font-medium text-gray-400">New Files</h4>
                    {newFiles.map((file, index) => (
                      <div
                        key={`new-${index}`}
                        className="flex items-center justify-between p-3 bg-[#343541] rounded-lg group"
                      >
                        <div className="flex items-center gap-3">
                          {getFileIcon(file.name)}
                          <span className="text-sm text-gray-300">{file.name}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeNewFile(index)}
                          className="p-1 text-gray-400 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          <div className="mt-8 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate('/admin')}
              className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Save size={18} />
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#2A2B32] rounded-lg p-6 max-w-md w-full mx-4"
          >
            <h3 className="text-xl font-semibold text-white mb-2">Delete GPT</h3>
            <p className="text-gray-300 mb-6">
              Are you sure you want to delete this GPT? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
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