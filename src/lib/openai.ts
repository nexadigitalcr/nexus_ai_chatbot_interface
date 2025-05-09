import OpenAI from 'openai';

// Error messages
const ERROR_MESSAGES = {
  INVALID_CONFIG: 'Invalid API configuration. Please check your API key and GPT ID.',
  MISSING_GPT_ID: 'GPT ID is required but not provided.',
  NO_RESPONSE: 'No response generated from the API.',
  INVALID_RESPONSE: 'Invalid response format received from the API.'
} as const;

// Default API key for all assistants
const DEFAULT_API_KEY = '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';

export interface OpenAIResponse {
  content: string;
  error?: string;
}

export interface GPTConfig {
  gptId: string;
  model?: string;
}

export interface VoiceOptions {
  voice: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
  model: string;
  assistantId: string;
}

// Validate API configuration
const validateConfig = (config?: GPTConfig): { isValid: boolean; error?: string } => {
  if (!config) {
    return { isValid: false, error: ERROR_MESSAGES.INVALID_CONFIG };
  }

  if (!config.gptId?.trim()) {
    return { isValid: false, error: ERROR_MESSAGES.MISSING_GPT_ID };
  }

  return { isValid: true };
};

// Function to get OpenAI client with provided API key and endpoint
const getOpenAIClient = (endpoint?: string): OpenAI => {
  const client = new OpenAI({
    apiKey: DEFAULT_API_KEY,
    baseURL: endpoint || undefined
  });

  return client;
};

// Function to safely extract content from API response
const extractResponseContent = (response: OpenAI.Chat.ChatCompletion): string => {
  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error(ERROR_MESSAGES.NO_RESPONSE);
  }
  return content;
};

// Main function to make direct GPT API calls
export async function askNexusAI(
  message: string, 
  config?: GPTConfig
): Promise<OpenAIResponse> {
  try {
    // Validate API configuration
    const { isValid, error } = validateConfig(config);
    if (!isValid) {
      return {
        content: error || ERROR_MESSAGES.INVALID_CONFIG,
        error
      };
    }

    // Initialize OpenAI client with environment variable
    const client = getOpenAIClient();

    // Use the specific GPT ID for the API call
    const response = await client.chat.completions.create({
      model: config.model || 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: `Assistant ID: ${config.gptId}`
        },
        {
          role: 'user',
          content: message
        }
      ],
      user: config.gptId,
      temperature: 0.7,
      max_tokens: 2000
    });

    const content = extractResponseContent(response);

    return {
      content
    };
  } catch (error) {
    console.error('Error in askNexusAI:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return {
      content: `Error processing your message: ${errorMessage}`,
      error: errorMessage
    };
  }
}

export async function generateSpeech(
  text: string, 
  options: VoiceOptions,
  config: GPTConfig
): Promise<Blob> {
  try {
    const client = getOpenAIClient();

    const response = await client.audio.speech.create({
      model: options.model,
      voice: options.voice,
      input: text,
      response_format: 'mp3',
      speed: 1.1, // Slightly faster as per the prompt requirement
    });

    const audioBlob = await response.blob();
    return audioBlob;
  } catch (error) {
    console.error('Error generating speech:', error);
    throw error;
  }
}

export async function streamSpeech(
  text: string, 
  options: VoiceOptions, 
  onChunk: (chunk: Blob) => void,
  config: GPTConfig
): Promise<void> {
  try {
    // For now, we'll use the non-streaming version as a fallback
    // In a real implementation, you would use a streaming API if available
    const audioBlob = await generateSpeech(text, options, config);
    onChunk(audioBlob);
  } catch (error) {
    console.error('Error streaming speech:', error);
    throw error;
  }
}