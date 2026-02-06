// src/hooks/useDeepSeekAI.ts
import { useQuery } from '@tanstack/react-query';

const DEEPSEEK_API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY;

export interface DeepSeekMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface DeepSeekResponse {
  id: string;
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

const analyzeGameWithDeepSeek = async (
  prompt: string,
  gameContext?: any
): Promise<string> => {
  if (!DEEPSEEK_API_KEY) {
    throw new Error('DeepSeek API key not configured');
  }

  const messages: DeepSeekMessage[] = [
    {
      role: 'system',
      content: 'You are a sports analytics expert specializing in basketball, football, and hockey. Provide detailed analysis and predictions.'
    },
    {
      role: 'user',
      content: gameContext 
        ? `Game context: ${JSON.stringify(gameContext)}\n\nQuestion: ${prompt}`
        : prompt
    }
  ];

  const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages,
      max_tokens: 1000,
      temperature: 0.7,
    })
  });

  if (!response.ok) {
    throw new Error(`DeepSeek API error: ${response.status}`);
  }

  const data: DeepSeekResponse = await response.json();
  return data.choices[0]?.message?.content || 'No response from AI';
};

// Query hook for analysis
export const useGameAnalysis = (prompt: string, gameContext?: any, options = {}) => {
  return useQuery({
    queryKey: ['deepseek', 'analysis', prompt, JSON.stringify(gameContext)],
    queryFn: () => analyzeGameWithDeepSeek(prompt, gameContext),
    staleTime: 60 * 60 * 1000, // 1 hour
    cacheTime: 2 * 60 * 60 * 1000, // 2 hours
    enabled: !!DEEPSEEK_API_KEY && !!prompt,
    ...options,
  });
};

// Mutation hook for on-demand analysis (for forms, buttons, etc.)
export const useGameAnalysisMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ prompt, gameContext }: { prompt: string; gameContext?: any }) => 
      analyzeGameWithDeepSeek(prompt, gameContext),
    onSuccess: (data, variables) => {
      // Invalidate queries or update cache if needed
      queryClient.invalidateQueries({ queryKey: ['deepseek', 'analysis'] });
    },
  });
};
