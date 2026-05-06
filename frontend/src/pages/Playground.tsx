import { useState, useEffect } from 'react';
import api from '../lib/api';
import { Send, Bot, User, RefreshCw, Info } from 'lucide-react';
import clsx from 'clsx';

export default function Playground() {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [model, setModel] = useState(() => localStorage.getItem('lastUsedModel') || 'gemma3:4b');
  const [provider, setProvider] = useState<'ollama' | 'codex'>(() => (localStorage.getItem('lastUsedProvider') as any) || 'ollama');
  const [debugLog, setDebugLog] = useState<any[]>([]);

  const [modelsList, setModelsList] = useState<string[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredModels = modelsList.filter(m =>
    m.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    localStorage.setItem('lastUsedModel', model);
    localStorage.setItem('lastUsedProvider', provider);
  }, [model, provider]);

  const [ollamaModels, setOllamaModels] = useState<string[]>([]);

  useEffect(() => {
    const fetchModels = async () => {
      try {
        const res = await api.get('/models');
        if (res.data?.models) {
          setOllamaModels(res.data.models.map((m: any) => m.name));
        }
      } catch (error) {
        console.error('Failed to fetch models', error);
      }
    };
    fetchModels();
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/auth/profile');
      if (res.data.defaultProvider && !localStorage.getItem('lastUsedProvider')) {
        setProvider(res.data.defaultProvider);
      }
      if (res.data.defaultModel && !localStorage.getItem('lastUsedModel')) {
        setModel(res.data.defaultModel);
      }
    } catch (err) {
      console.error('Failed to fetch profile defaults');
    }
  };

  useEffect(() => {
    if (provider === 'codex') {
      const chatGptModels = ['GPT-5.5', 'GPT-5.4', 'GPT-5.4-Mini', 'GPT-5.3-Codex', 'GPT-5.2'];
      setModelsList(chatGptModels);
      
      // Auto-switch to a valid Codex model if the current one is from Ollama
      if (!chatGptModels.includes(model)) {
        setModel('GPT-5.5');
      }
    } else {
      setModelsList(ollamaModels);
      
      // Auto-switch to a valid Ollama model if the current one is from Codex
      if (ollamaModels.length > 0 && !ollamaModels.includes(model)) {
        setModel(ollamaModels[0]);
      }
    }
  }, [provider, ollamaModels]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);
    setDebugLog([]);

    try {
      // Simulate real-time rotation debugging info
      const startTime = Date.now();

      const res = await api.post('/chat', {
        model,
        provedor: provider,
        messages: [...messages, { role: 'user', content: userMsg }],
        stream: false
      });

      const latency = Date.now() - startTime;

      const responseData = res.data?.data || res.data; // Gateway might wrap in 'data'
      const content = responseData.message?.content || responseData.response || '';

      if (!content) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `⚠️ Received empty content. Raw response:\n${JSON.stringify(responseData, null, 2)}`
        }]);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content }]);
      }

      // Update debug log with actual rotation data from backend if available
      const keysUsed = res.data.keysUsed || [];
      if (keysUsed.length > 0) {
        setDebugLog(keysUsed.map((k: any) => ({
          id: Math.random().toString(),
          message: `Key "${k.label}" -> ${k.result}`,
          type: k.result === 'SUCCESS' ? 'success' : 'warning',
          time: new Date().toLocaleTimeString()
        })));
      }

      setDebugLog(prev => [...prev, {
        id: Math.random().toString(),
        message: `Response (${latency}ms, ${res.data.retryCount || 0} retries). Data size: ${JSON.stringify(responseData).length} bytes.`,
        type: 'info',
        time: new Date().toLocaleTimeString()
      }]);

    } catch (error: any) {
      console.error(error);
      const data = error.response?.data;

      if (data?.keysUsed) {
        setDebugLog(data.keysUsed.map((k: any) => ({
          id: Math.random().toString(),
          message: `Key "${k.label}" -> ${k.result}`,
          type: 'error',
          time: new Date().toLocaleTimeString()
        })));
      }

      setDebugLog(prev => [...prev, {
        id: Math.random().toString(),
        message: `Failed: ${data?.message || error.message}`,
        type: 'error',
        time: new Date().toLocaleTimeString()
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col md:flex-row gap-6">
      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/50">
          <h2 className="font-medium text-white flex items-center gap-2 shrink-0">
            <Bot className="w-5 h-5 text-emerald-400" />
            Model Playground
          </h2>

          <div className="flex items-center gap-3 w-full md:w-auto">
            {/* Provider Dropdown */}
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value as 'ollama' | 'codex')}
              className="w-full md:w-40 px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white hover:border-emerald-500/50 transition-colors focus:ring-1 focus:ring-emerald-500 outline-none"
            >
              <option value="ollama">Ollama</option>
              <option value="codex">ChatGPT (Codex)</option>
            </select>

            {/* Custom Searchable Dropdown */}
            <div className="relative w-full md:w-64">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full flex justify-between items-center px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white hover:border-emerald-500/50 transition-colors focus:ring-1 focus:ring-emerald-500 outline-none"
              >
                <span className="truncate">{model}</span>
                <RefreshCw className={clsx("w-3.5 h-3.5 text-slate-500 transition-transform", isDropdownOpen && "rotate-180")} />
              </button>

            {isDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setIsDropdownOpen(false)}
                />
                <div className="absolute top-full mt-2 left-0 right-0 z-20 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="p-2 border-b border-slate-800">
                    <input
                      autoFocus
                      type="text"
                      placeholder="Search models..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-600 focus:ring-1 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    {filteredModels.length > 0 ? (
                      filteredModels.map((m) => (
                        <button
                          key={m}
                          onClick={() => {
                            setModel(m);
                            setIsDropdownOpen(false);
                            setSearchTerm('');
                          }}
                          className={clsx(
                            "w-full text-left px-4 py-2 text-xs transition-colors hover:bg-emerald-500/10",
                            model === m ? "text-emerald-400 bg-emerald-500/5 font-medium" : "text-slate-400 hover:text-white"
                          )}
                        >
                          {m}
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-xs text-slate-600 italic">No models found</div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500">
              <Bot className="w-12 h-12 mb-3 opacity-50" />
              <p>Send a message to test the routing logic.</p>
              <p className="text-sm mt-1">If a key hits 429, the gateway will automatically retry.</p>
            </div>
          ) : (
            messages.map((msg, i) => (
              <div key={i} className={clsx("flex gap-4", msg.role === 'user' ? "flex-row-reverse" : "flex-row")}>
                <div className={clsx(
                  "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                  msg.role === 'user' ? "bg-slate-700 text-white" : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                )}>
                  {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>
                <div className={clsx(
                  "px-4 py-3 rounded-2xl max-w-[80%]",
                  msg.role === 'user'
                    ? "bg-emerald-600 text-white rounded-tr-none"
                    : "bg-slate-800 border border-slate-700 text-slate-200 rounded-tl-none whitespace-pre-wrap"
                )}>
                  {msg.content}
                </div>
              </div>
            ))
          )}
          {loading && (
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
              <div className="px-4 py-3 bg-slate-800 border border-slate-700 rounded-2xl rounded-tl-none flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
        </div>

        <div className="p-4 bg-slate-900 border-t border-slate-800">
          <form onSubmit={handleSubmit} className="relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Message the model..."
              disabled={loading}
              className="w-full pl-4 pr-12 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500/50 outline-none disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-white bg-emerald-600 rounded-lg hover:bg-emerald-500 disabled:opacity-50 disabled:hover:bg-emerald-600 transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* Gateway Debug Log */}
      <div className="w-full md:w-80 flex flex-col bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-inner">
        <div className="p-3 border-b border-slate-800 bg-slate-900 flex items-center gap-2">
          <RefreshCw className="w-4 h-4 text-slate-400" />
          <h3 className="font-medium text-slate-300 text-sm">Gateway Routing Log</h3>
        </div>
        <div className="flex-1 p-3 overflow-y-auto space-y-3 font-mono text-xs">
          {debugLog.length === 0 ? (
            <div className="text-slate-600 text-center mt-10">
              <Info className="w-6 h-6 mx-auto mb-2 opacity-50" />
              Awaiting request...
            </div>
          ) : (
            debugLog.map((log) => (
              <div key={log.id} className="flex flex-col gap-1">
                <span className="text-slate-600">[{log.time}]</span>
                <span className={clsx(
                  "p-2 rounded border break-words",
                  log.type === 'success' && "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
                  log.type === 'warning' && "bg-amber-500/10 border-amber-500/20 text-amber-400",
                  log.type === 'error' && "bg-red-500/10 border-red-500/20 text-red-400",
                  log.type === 'info' && "bg-slate-800 border-slate-700 text-slate-300"
                )}>
                  {log.message}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
