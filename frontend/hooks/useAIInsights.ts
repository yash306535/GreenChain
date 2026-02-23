import { useState } from 'react';
import { apiService } from '../lib/api';

interface AIInsight {
  id: string;
  query: string;
  response: string;
  shipment_id?: string;
  session_id: string;
  insight_type: string;
  created_at: string;
}

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: string;
}

export const useAIInsights = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>(() => {
    // Generate a simple session ID
    return 'session_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
  });

  const sendMessage = async (text: string, shipmentId?: string) => {
    if (!text.trim()) return;

    // Add user message immediately
    const userMessage: Message = {
      id: 'temp_' + Date.now(),
      text,
      sender: 'user',
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Send to AI service
      const response = await apiService.getAIInsights(text);
      
      if (response.success) {
        const responseData = response.data as any;
        const aiText =
          responseData?.answer ||
          responseData?.response ||
          (typeof responseData === 'string' ? responseData : '') ||
          "I couldn't generate a clear response. Please try rephrasing your question.";

        const aiMessage: Message = {
          id: responseData?.id || 'ai_' + Date.now(),
          text: aiText,
          sender: 'ai',
          timestamp: new Date().toISOString(),
        };

        setMessages(prev => [...prev, aiMessage]);
      } else {
        // Add error message
        const errorMessage: Message = {
          id: 'error_' + Date.now(),
          text: response.error || 'Sorry, I encountered an error processing your request.',
          sender: 'ai',
          timestamp: new Date().toISOString(),
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error('Error sending message to AI:', error);
      const errorMessage: Message = {
        id: 'error_' + Date.now(),
        text: 'Sorry, I\'m having trouble connecting to the AI service right now.',
        sender: 'ai',
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearConversation = () => {
    setMessages([]);
    setSessionId('session_' + Date.now().toString(36) + Math.random().toString(36).substr(2));
  };

  return {
    messages,
    isLoading,
    sessionId,
    sendMessage,
    clearConversation,
  };
};
