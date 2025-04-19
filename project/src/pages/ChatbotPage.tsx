import { useState, useEffect, useRef } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import ReactMarkdown from 'react-markdown';
import { Bot, Send, User, Loader2, StopCircle } from 'lucide-react';

// ✅ Initialize Gemini AI with API key
const genAI = new GoogleGenerativeAI("API_KEY");

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

function ChatbotPage() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hi! How can I assist you today?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const stopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsGenerating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');

    // ✅ Add user message to UI immediately
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);
    setIsGenerating(true);
    
    // Create abort controller for this request
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    try {
      // Updated model name to match available versions in the API
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
      const prompt = `Provide a direct, structured, and helpful response: ${userMessage}`;
      const result = await model.generateContent(prompt);

      // ✅ Handle API response errors
      if (!result || !result.response) {
        throw new Error('Invalid response from API');
      }

      let responseText = await result.response.text();

      // ✅ Add an empty assistant message first
      const assistantMessage: Message = { role: 'assistant', content: '' };
      setMessages(prev => [...prev, assistantMessage]);

      // ✅ Simulate typing effect for a better UI experience
      for (const char of responseText) {
        // Check if generation was stopped
        if (signal.aborted) {
          break;
        }
        await new Promise(resolve => setTimeout(resolve, 10)); // Delay per character
        assistantMessage.content += char;
        setMessages(prev => [...prev.slice(0, -1), { ...assistantMessage }]); // Update last message only
      }
    } catch (error: any) {
      console.error('API Error:', error);
      if (!signal.aborted) {
        setMessages(prev => [
          ...prev,
          { role: 'assistant', content: 'I encountered an error. Please try again later.' }
        ]);
      }
    } finally {
      setIsLoading(false);
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <div className="p-4 bg-white shadow">
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <Bot className="text-blue-600" />
          Legal Assistant
        </h1>
        <p className="text-gray-600 mt-1">Ask me your questions</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div key={index} className={`flex items-start gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}>
            {message.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Bot size={20} className="text-blue-600" />
              </div>
            )}
            <div className={`rounded-lg p-4 max-w-[80%] ${message.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white shadow-md'}`}>
              <ReactMarkdown className={`prose ${message.role === 'user' ? 'text-white' : ''}`}>{message.content}</ReactMarkdown>
            </div>
            {message.role === 'user' && (
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                <User size={20} className="text-white" />
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <Bot size={20} className="text-blue-600" />
            </div>
            <div className="bg-white rounded-lg p-4 shadow-md">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-4 bg-white shadow-lg">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask your question..."
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          {isGenerating ? (
            <button
              type="button"
              onClick={stopGeneration}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
            >
              <StopCircle size={20} />
              Stop
            </button>
          ) : (
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Send size={20} />
              Send
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

export default ChatbotPage;
