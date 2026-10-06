export interface OpenRouterModelOption {
  id: string;
  name: string;
  description: string;
  contextLength: number;
  isFree: boolean;
}

export const SUPPORTED_OPENROUTER_MODELS: OpenRouterModelOption[] = [
  {
    id: 'meta-llama/llama-3.3-70b-instruct:free',
    name: 'Llama 3.3 70B Instruct (Free)',
    description: 'High-capability open-weights model suited for complex RAG synthesis and analysis.',
    contextLength: 131072,
    isFree: true,
  },
  {
    id: 'google/gemini-2.0-flash-exp:free',
    name: 'Gemini 2.0 Flash Exp (Free)',
    description: 'Ultra-fast, massive context model with exceptional multimodal and reasoning speed.',
    contextLength: 1048576,
    isFree: true,
  },
  {
    id: 'meta-llama/llama-3.1-8b-instruct:free',
    name: 'Llama 3.1 8B Instruct (Free)',
    description: 'Lightweight, rapid response model optimized for quick queries and parsing.',
    contextLength: 131072,
    isFree: true,
  },
  {
    id: 'qwen/qwen-2.5-72b-instruct:free',
    name: 'Qwen 2.5 72B Instruct (Free)',
    description: 'State of the art multilingual reasoning and precise structured extraction.',
    contextLength: 32768,
    isFree: true,
  },
];
