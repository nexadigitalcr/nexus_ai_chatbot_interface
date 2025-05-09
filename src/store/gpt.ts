import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { assistants, saveAssistant, deleteAssistantFile } from '../data/assistants';

export interface GPT {
  id: string;
  name: string;
  description: string;
  role: string;
  instructions?: string;
  avatar: string;
  capabilities: {
    webSearch: boolean;
    codeInterpreter: boolean;
    imageGeneration: boolean;
    fileUpload: boolean;
  };
  files: string[];
  createdAt: string;
  updatedAt?: string;
  model?: string;
  visibility?: 'public' | 'private' | 'draft';
  isDefault?: boolean;
  gptId: string;
  apiConfig?: {
    useCustomApi: boolean;
  };
}

interface GPTState {
  gpts: GPT[];
  activeGPT: GPT | null;
  addGPT: (gpt: GPT) => void;
  updateGPT: (gpt: GPT) => void;
  deleteGPT: (id: string) => void;
  setDefaultGPT: (id: string) => void;
  getDefaultGPT: () => GPT | null;
  setActiveGPT: (id: string) => void;
  importFromAssistants: () => void;
}

// Convert existing assistants to GPT format for initial data
const convertAssistantsToGPTs = (): GPT[] => {
  return assistants.map(assistant => ({
    id: assistant.id,
    name: assistant.name,
    description: assistant.description,
    role: assistant.role,
    instructions: `You are ${assistant.name}, ${assistant.description}`,
    avatar: assistant.avatar,
    gptId: '',
    capabilities: {
      webSearch: true,
      codeInterpreter: true,
      imageGeneration: true,
      fileUpload: true
    },
    files: [],
    createdAt: new Date().toISOString(),
    model: 'gpt-4',
    visibility: 'public',
    isDefault: assistant.isDefault,
    apiConfig: {
      useCustomApi: false
    }
  }));
};

// Convert GPT to Assistant format for saving to file
const convertGPTToAssistant = (gpt: GPT) => {
  return {
    id: gpt.id,
    name: gpt.name,
    description: gpt.description,
    avatar: gpt.avatar,
    role: gpt.role,
    isPrimary: false,
    isDefault: gpt.isDefault,
    voice: 'alloy',
    stats: {
      users: 0,
      rating: 5.0,
      ratings: {
        five: 1,
        four: 0,
        three: 0,
        two: 0,
        one: 0
      }
    }
  };
};

export const useGPTStore = create<GPTState>()(
  persist(
    (set, get) => ({
      gpts: [],
      activeGPT: null,
      addGPT: (gpt) => {
        // If this is the first GPT, make it default
        const isFirstGPT = get().gpts.length === 0;
        const gptWithDefault = {
          ...gpt,
          isDefault: gpt.isDefault || isFirstGPT
        };
        
        // If this GPT is set as default, remove default from others
        if (gptWithDefault.isDefault) {
          set((state) => ({
            gpts: state.gpts.map(g => ({
              ...g,
              isDefault: g.id === gptWithDefault.id
            }))
          }));
        }
        
        // Save to assistants folder
        const assistantData = convertGPTToAssistant(gptWithDefault);
        saveAssistant(assistantData);
        
        set((state) => ({ gpts: [gptWithDefault, ...state.gpts] }));
      },
      updateGPT: (updatedGpt) => set((state) => {
        // Check if the GPT already exists
        const existingIndex = state.gpts.findIndex(gpt => gpt.id === updatedGpt.id);
        
        // If this GPT is set as default, remove default from others
        if (updatedGpt.isDefault) {
          state.gpts.forEach(gpt => {
            if (gpt.id !== updatedGpt.id) {
              gpt.isDefault = false;
            }
          });
        }
        
        // Update the assistant file
        const assistantData = convertGPTToAssistant(updatedGpt);
        saveAssistant(assistantData);
        
        if (existingIndex >= 0) {
          // Update existing GPT
          const updatedGpts = [...state.gpts];
          updatedGpts[existingIndex] = {
            ...updatedGpt,
            updatedAt: new Date().toISOString() // Add timestamp for sorting
          };
          
          // Sort GPTs to move recently updated ones to the top
          updatedGpts.sort((a, b) => {
            const aTime = a.updatedAt || a.createdAt;
            const bTime = b.updatedAt || b.createdAt;
            return new Date(bTime).getTime() - new Date(aTime).getTime();
          });
          
          return { gpts: updatedGpts };
        } else {
          // Add as new GPT if it doesn't exist
          return { 
            gpts: [
              {
                ...updatedGpt,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              }, 
              ...state.gpts
            ] 
          };
        }
      }),
      deleteGPT: (id) => {
        // Validate GPT existence before deletion
        const state = get();
        const gptToDelete = state.gpts.find(gpt => gpt.id === id);
        
        if (!gptToDelete) {
          console.warn(`Attempted to delete non-existent GPT with id: ${id}`);
          return;
        }

        // Delete the assistant file
        deleteAssistantFile(id);
        
        set((state) => {
          const newGpts = state.gpts.filter(gpt => gpt.id !== id);
          
          // Handle default GPT reassignment
          if (gptToDelete.isDefault && newGpts.length > 0) {
            // Find the most recently updated GPT to set as default
            const newDefault = newGpts.reduce((prev, curr) => {
              const prevTime = new Date(prev.updatedAt || prev.createdAt).getTime();
              const currTime = new Date(curr.updatedAt || curr.createdAt).getTime();
              return prevTime > currTime ? prev : curr;
            });

            newDefault.isDefault = true;
            const assistantData = convertGPTToAssistant(newDefault);
            saveAssistant(assistantData);
          }
          
          return { gpts: newGpts };
        });
      },
      getDefaultGPT: () => {
        const state = get();
        return state.gpts.find(gpt => gpt.isDefault) || (state.gpts.length > 0 ? state.gpts[0] : null);
      },
      setActiveGPT: (id: string) => set((state) => {
        const gpt = state.gpts.find(g => g.id === id);
        return { activeGPT: gpt || null };
      }),
      setDefaultGPT: (id: string) => set((state) => ({
        gpts: state.gpts.map(gpt => ({
          ...gpt,
          isDefault: gpt.id === id
        }))
      })),
      importFromAssistants: () => set((state) => {
        // Only import if there are no GPTs yet
        if (state.gpts.length === 0) {
          return { gpts: convertAssistantsToGPTs() };
        }
        return state;
      })
    }),
    {
      name: 'gpt-storage',
    }
  )
);