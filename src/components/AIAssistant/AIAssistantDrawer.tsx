import React, { useState } from 'react';
import { Sparkles, Send, X, Bot, User, CornerDownLeft, Lightbulb } from 'lucide-react';
import { api } from '../../services/api';
import { AIQueryResponse } from '../../types';

interface AIAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToTab: (tab: string) => void;
}

interface ChatMessage {
  id: string;
  sender: 'USER' | 'AI';
  text: string;
  data?: AIQueryResponse['data'];
  timestamp: string;
}

export const AIAssistantDrawer: React.FC<AIAssistantDrawerProps> = ({
  isOpen,
  onClose,
  onNavigateToTab
}) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'AI',
      text: 'Hello! I am Ethara AI, your enterprise seat allocation and project intelligence assistant powered by Gemini 2.5. How can I help you today?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  if (!isOpen) return null;

  const quickPrompts = [
    'Where is Amit Sharma seated?',
    'Show available seats on Floor 3 Zone A',
    'Which project has highest seat utilization?',
    'Find 5 seats near the Mobile team'
  ];

  const handleSendQuery = async (customQuery?: string) => {
    const q = customQuery || query;
    if (!q.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'USER',
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setQuery('');
    setLoading(true);

    try {
      const res = await api.queryAIAssistant(q);
      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'AI',
        text: res.answer,
        data: res.data,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'AI',
          text: 'I apologize, but I encountered an issue retrieving data. Please try asking again.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[480px] bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md">
            <Sparkles className="w-5 h-5 text-amber-300" />
          </div>
          <div>
            <h3 className="font-bold text-sm tracking-wide">Ethara AI Assistant</h3>
            <p className="text-[11px] text-indigo-300">Powered by Gemini 2.5 Server-Side Engine</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex gap-3 text-xs ${msg.sender === 'USER' ? 'flex-row-reverse' : ''}`}
          >
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-white shrink-0 ${
                msg.sender === 'USER'
                  ? 'bg-indigo-600'
                  : 'bg-gradient-to-br from-purple-600 to-indigo-700'
              }`}
            >
              {msg.sender === 'USER' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            <div
              className={`max-w-[85%] p-3.5 rounded-2xl space-y-2 ${
                msg.sender === 'USER'
                  ? 'bg-indigo-600 text-white rounded-tr-none'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-tl-none border border-slate-200/80 dark:border-slate-700/80'
              }`}
            >
              <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>

              {/* Structured Data Cards if returned */}
              {msg.data && msg.data.employees && msg.data.employees.length > 0 && (
                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white space-y-1">
                  <div className="font-bold">{msg.data.employees[0].firstName} {msg.data.employees[0].lastName}</div>
                  <div className="text-[11px] text-slate-500">{msg.data.employees[0].role}</div>
                  <div className="font-mono font-bold text-indigo-600 dark:text-indigo-400 text-sm pt-1">
                    Seat: {msg.data.employees[0].seatNumber || 'Unallocated'} (Floor {msg.data.employees[0].floor || 1} {msg.data.employees[0].zone || ''})
                  </div>
                </div>
              )}

              <span className="block text-[10px] opacity-60 text-right mt-1">{msg.timestamp}</span>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-xs text-slate-400 p-2">
            <Bot className="w-4 h-4 text-indigo-500 animate-bounce" /> Ethara AI is querying 5,000 employees & 5,500 seats...
          </div>
        )}
      </div>

      {/* Suggested Quick Prompts */}
      <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 space-y-1.5">
        <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          <Lightbulb className="w-3.5 h-3.5 text-amber-500" /> Try Asking:
        </div>
        <div className="flex flex-wrap gap-1.5">
          {quickPrompts.map((p, i) => (
            <button
              key={i}
              onClick={() => handleSendQuery(p)}
              className="text-[11px] px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer text-left"
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Input Field */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <form
          onSubmit={e => {
            e.preventDefault();
            handleSendQuery();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Ask AI anything about seat allocations..."
            className="flex-1 p-2.5 text-xs bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="submit"
            disabled={!query.trim() || loading}
            className="p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-40 transition-colors cursor-pointer shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
