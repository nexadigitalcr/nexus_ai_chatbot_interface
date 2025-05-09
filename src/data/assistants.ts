import { Assistant } from '../types';

// In-memory storage for assistants
let assistantsData: Assistant[] = [];

// Save assistant to memory
export const saveAssistant = (assistant: Assistant): void => {
  try {
    // Check if assistant already exists
    const index = assistantsData.findIndex(a => a.id === assistant.id);
    if (index >= 0) {
      // Update existing assistant
      assistantsData[index] = assistant;
    } else {
      // Add new assistant
      assistantsData.push(assistant);
    }
  } catch (error) {
    console.error(`Error saving assistant ${assistant.id}:`, error);
  }
};

// Delete assistant from memory
export const deleteAssistantFile = (assistantId: string): void => {
  try {
    assistantsData = assistantsData.filter(a => a.id !== assistantId);
  } catch (error) {
    console.error(`Error deleting assistant ${assistantId}:`, error);
  }
};

export const assistants: Assistant[] = [
  {
    id: 'nexus-ai-001',
    name: 'Nexus AI',
    description: 'El primer Chat autónomo de Costa Rica',
    avatar: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=64&h=64&fit=crop&crop=faces&q=80',
    role: 'AI Assistant',
    isPrimary: true,
    isDefault: true,
    voice: 'alloy',
    category: 'Featured',
    creator: 'Nexa Digital',
    chatCount: 25000,
    stats: {
      users: 25000,
      rating: 4.9,
      ratings: {
        five: 15000,
        four: 7000,
        three: 2000,
        two: 800,
        one: 200
      }
    }
  },
  {
    id: 'axel-eleven-001',
    name: 'Axel Eleven Labs Expert',
    description: 'Asistente experto en Eleven Labs para la creación de audios',
    avatar: 'https://images.unsplash.com/photo-1614741118887-7a4ee193a5fa?w=64&h=64&fit=crop&crop=faces&q=80',
    role: 'Audio Expert',
    isPrimary: false,
    voice: 'echo',
    category: 'Trending',
    creator: 'Eleven Labs',
    chatCount: 15000,
    stats: {
      users: 15000,
      rating: 4.8,
      ratings: {
        five: 9000,
        four: 4000,
        three: 1500,
        two: 400,
        one: 100
      }
    }
  },
  {
    id: 'amara-divi-001',
    name: 'Amara Divi Expert',
    description: 'Soporte avanzado para Divi y WordPress',
    avatar: 'https://images.unsplash.com/photo-1618477388954-7852f32655ec?w=64&h=64&fit=crop&crop=faces&q=80',
    role: 'WordPress Expert',
    isPrimary: false,
    voice: 'nova',
    category: 'Specialized',
    creator: 'Elegant Themes',
    chatCount: 10000,
    stats: {
      users: 10000,
      rating: 4.7,
      ratings: {
        five: 6000,
        four: 2500,
        three: 1000,
        two: 300,
        one: 200
      }
    }
  },
  {
    id: 'salomon-lawyer-001',
    name: 'Salomón Tico-Lawyer',
    description: 'Asesor legal especializado en leyes costarricenses',
    avatar: 'https://images.unsplash.com/photo-1505664194779-8beaceb93744?w=64&h=64&fit=crop&crop=faces&q=80',
    role: 'Legal Advisor',
    isPrimary: false,
    voice: 'onyx',
    category: 'Specialized',
    creator: 'Legal Nexus',
    chatCount: 8000,
    stats: {
      users: 8000,
      rating: 4.8,
      ratings: {
        five: 5000,
        four: 2000,
        three: 700,
        two: 200,
        one: 100
      }
    }
  },
  {
    id: 'joe-biodiversity-001',
    name: 'Joe, The Biodiversity Partner',
    description: 'Guía naturalista para la biodiversidad de Costa Rica',
    avatar: 'https://images.unsplash.com/photo-1542662565-7e4b66bae529?w=64&h=64&fit=crop&crop=faces&q=80',
    role: 'Nature Guide',
    isPrimary: false,
    voice: 'alloy',
    category: 'Trending',
    creator: 'EcoTica',
    chatCount: 12000,
    stats: {
      users: 12000,
      rating: 4.9,
      ratings: {
        five: 8000,
        four: 2500,
        three: 1000,
        two: 300,
        one: 200
      }
    }
  },
  {
    id: 'kaleb-synthflow-001',
    name: 'Kaleb Synthflow Expert',
    description: 'Asesor en la creación de asistentes de voz con Synthflow',
    avatar: 'https://images.unsplash.com/photo-1583864697784-a0efc8379f70?w=64&h=64&fit=crop&crop=faces&q=80',
    role: 'Voice AI Expert',
    isPrimary: false,
    voice: 'echo',
    category: 'Specialized',
    creator: 'Synthflow Labs',
    chatCount: 5000,
    stats: {
      users: 5000,
      rating: 4.7,
      ratings: {
        five: 3000,
        four: 1200,
        three: 500,
        two: 200,
        one: 100
      }
    }
  },
  {
    id: 'theo-huggingface-001',
    name: 'Theo Hugging Face Expert',
    description: 'Especialista en el uso de modelos de Hugging Face',
    avatar: 'https://images.unsplash.com/photo-1618477247222-acbdb0e159b3?w=64&h=64&fit=crop&crop=faces&q=80',
    role: 'ML Expert',
    isPrimary: false,
    voice: 'fable',
    category: 'Trending',
    creator: 'Hugging Face',
    chatCount: 18000,
    stats: {
      users: 18000,
      rating: 4.8,
      ratings: {
        five: 11000,
        four: 4500,
        three: 1500,
        two: 600,
        one: 400
      }
    }
  },
  {
    id: 'elliot-glif-001',
    name: 'Elliot Glif APP Expert',
    description: 'Experto en Glif para el desarrollo de aplicaciones',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=64&h=64&fit=crop&crop=faces&q=80',
    role: 'App Developer',
    isPrimary: false,
    voice: 'shimmer',
    category: 'Specialized',
    creator: 'Glif Team',
    chatCount: 7000,
    stats: {
      users: 7000,
      rating: 4.6,
      ratings: {
        five: 4000,
        four: 1800,
        three: 800,
        two: 300,
        one: 100
      }
    }
  },
  {
    id: 'bolt-new-001',
    name: 'Bolt New Expert',
    description: 'Soporte avanzado para la creación en Bolt.new',
    avatar: 'https://images.unsplash.com/photo-1635107510862-53886e926b74?w=64&h=64&fit=crop&crop=faces&q=80',
    role: 'Development Expert',
    isPrimary: false,
    voice: 'nova',
    category: 'Featured',
    creator: 'Bolt Team',
    chatCount: 20000,
    stats: {
      users: 20000,
      rating: 4.9,
      ratings: {
        five: 13000,
        four: 4500,
        three: 1500,
        two: 600,
        one: 400
      }
    }
  },
  {
    id: 'professor-sloth-001',
    name: 'Professor Sloth',
    description: 'Embajador turístico que educa y conecta con Costa Rica',
    avatar: 'https://images.unsplash.com/photo-1517849845537-4d257902454a?w=64&h=64&fit=crop&crop=faces&q=80',
    role: 'Tourism Guide',
    isPrimary: false,
    voice: 'alloy',
    category: 'Featured',
    creator: 'Tourism CR',
    chatCount: 22000,
    stats: {
      users: 22000,
      rating: 4.9,
      ratings: {
        five: 14000,
        four: 5000,
        three: 2000,
        two: 700,
        one: 300
      }
    }
  }
];