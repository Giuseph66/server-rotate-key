import { Terminal, Server, Key, ShieldCheck, Zap, Info, ChevronRight, Copy, Bot, Eye, EyeOff, Settings, Check } from 'lucide-react';
import { useState, useEffect } from 'react';
import api from '../lib/api';

export default function Docs() {
  const baseUrl = 'http://localhost:3333';
  const [copied, setCopied] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [showApiKey, setShowApiKey] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/auth/profile');
        setProfile(res.data);
      } catch (error) {
        console.error('Failed to fetch profile', error);
      }
    };
    fetchProfile();
  }, []);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="w-full space-y-10 pb-20 animate-in fade-in duration-700">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
          <ShieldCheck className="w-3.5 h-3.5" />
          Developer Portal
        </div>
        <h1 className="text-4xl font-extrabold text-white tracking-tight">API Documentation</h1>
        <p className="text-slate-400 max-w-2xl mx-auto">
          Integrate the Ollama Pool Gateway into your workflows. Manage keys, bypass rate limits, and ensure high availability for your LLM applications.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Quick Navigation & Info */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sticky top-24">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Info className="w-4 h-4 text-emerald-400" />
              Quick Start
            </h3>
            <ul className="space-y-3">
              {[
                { title: 'Authentication', id: 'auth' },
                { title: 'API Endpoints', id: 'endpoints' },
                { title: 'Profile Management', id: 'management' },
                { title: 'Model Selection', id: 'models' },
                { title: 'Error Handling', id: 'errors' },
                { title: 'Key Types Notice', id: 'key-types' }
              ].map((item) => (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    className="flex items-center justify-between group text-sm text-slate-400 hover:text-emerald-400 transition-colors"
                  >
                    {item.title}
                    <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                  </a>
                </li>
              ))}
            </ul>

            <div className="mt-8 pt-6 border-t border-slate-800">
              <h3 className="text-white font-semibold mb-2 flex items-center gap-2 text-sm">
                <Bot className="w-4 h-4 text-purple-400" />
                AI Development Context
              </h3>
              <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                Building an integration using an AI assistant like Cursor or Copilot? Copy this markdown context for them.
              </p>
              <button
                onClick={() => {
                  const md = `# Ollama Pool Gateway - Integration Guide\n\n**Base URL:** \`${baseUrl}\`\n**Authentication:**\n- Header \`Authorization: Bearer <YOUR_SYSTEM_API_KEY>\`\n- Header \`Content-Type: application/json\`\n\n> Get your System API Key from the **Profile** page.\n\n## Endpoints\n\n### 1. Chat Completion\n- **URL:** \`/api/chat\`\n- **Method:** \`POST\`\n- **Headers:** Includes \`Content-Type: application/json\`\n- **Body:**\n  \`\`\`json\n  {\n    "model": "gemma3:4b",\n    "messages": [{ "role": "user", "content": "Hello!" }],\n    "stream": false\n  }\n  \`\`\`\n- **Behavior:** Acts exactly like standard Ollama API. The gateway handles 429 rate limit retries automatically.\n\n### 2. List Models\n- **URL:** \`/api/models\`\n- **Method:** \`GET\`\n- **Behavior:** Returns available models in the active pool key.\n\n### 3. Change Default Model\n- **URL:** \`/api/auth/profile/default-model\`\n- **Method:** \`PUT\`\n- **Auth:** Requires JWT Token\n- **Body:** \`{"model": "llama3"}\`\n\n## Error Handling\n- \`429 Rate Limit\`: Intercepted and handled automatically by the gateway. If exhausted, it returns 429.\n- \`502 Bad Gateway\`: Upstream Ollama Cloud API key is invalid or unauthorized.\n`;
                  copyToClipboard(md, 'ai-markdown');
                }}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 rounded-lg text-xs font-medium text-purple-400 transition-colors"
              >
                {copied === 'ai-markdown' ? <ShieldCheck className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied === 'ai-markdown' ? 'Context Copied!' : 'Copy AI Markdown Context'}
              </button>
            </div>

            <div className="mt-6 p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl">
              <p className="text-xs text-emerald-400/80 leading-relaxed italic">
                "The gateway acts as a smart proxy. It handles the 429 retries so your application doesn't have to."
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Main Content */}
        <div className="lg:col-span-2 space-y-12">

          {/* Auth Section */}
          <section id="auth" className="scroll-mt-24 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/10 rounded-lg">
                <Key className="w-5 h-5 text-emerald-400" />
              </div>
              <h2 className="text-xl font-bold text-white">Authentication</h2>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed">
              All requests to the gateway must be authenticated using your <strong>System API Key</strong>. This key should be kept secret and is recommended for all programmatic integrations.
            </p>
            <div className="space-y-3">
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 relative group">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">System API Key</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="p-1 hover:bg-slate-800 rounded transition-colors text-slate-500 hover:text-emerald-400"
                      title={showApiKey ? "Hide Key" : "Show Key"}
                    >
                      {showApiKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    </button>
                    <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold rounded">Active</span>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <code className="text-emerald-400 font-mono text-xs truncate">
                    Authorization: Bearer {showApiKey && profile?.systemApiKey ? profile.systemApiKey : (showApiKey ? 'Generating...' : 'sk-••••••••••••••••••••••••')}
                  </code>
                  {profile?.systemApiKey && (
                    <button
                      onClick={() => copyToClipboard(profile.systemApiKey, 'auth-key')}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-800 rounded transition-all"
                    >
                      {copied === 'auth-key' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-500" />}
                    </button>
                  )}
                </div>
                <p className="mt-2 text-[11px] text-slate-500">Generate or rotate your key in the <a href="/profile" className="text-emerald-500 underline">Profile</a> page.</p>
              </div>
            </div>
          </section>

          {/* Endpoints Section */}
          <section id="endpoints" className="scroll-mt-24 space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Server className="w-5 h-5 text-blue-400" />
              </div>
              <h2 className="text-xl font-bold text-white">API Endpoints</h2>
            </div>

            <div className="space-y-4">
              <div className="group bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold rounded uppercase">Post</span>
                    <code className="text-white font-mono text-sm">/api/chat</code>
                  </div>
                  <Zap className="w-4 h-4 text-slate-600 group-hover:text-amber-400 transition-colors" />
                </div>
                <p className="text-slate-400 text-xs mb-4">Drop-in replacement for Ollama's chat endpoint. Supports message history and model selection.</p>
                <div className="relative">
                  <pre className="bg-slate-950 rounded-xl p-4 overflow-x-auto text-[11px] font-mono text-slate-400">
                    {`curl -X POST ${baseUrl}/api/chat \\
  -H "Authorization: Bearer ${showApiKey && profile?.systemApiKey ? profile.systemApiKey : '<TOKEN>'}" \\
  -H "Content-Type: application/json" \\
  -d '{"model": "gemma3:4b", "messages": [{"role": "user", "content": "Hello!"}]}'`}
                  </pre>
                  <button
                    onClick={() => copyToClipboard(`curl -X POST ${baseUrl}/api/chat -H "Authorization: Bearer ${profile?.systemApiKey || '<TOKEN>'}" -H "Content-Type: application/json" -d '{"model": "gemma3:4b", "messages": [{"role": "user", "content": "Hello!"}]}'`, 'curl-chat')}
                    className="absolute top-3 right-3 p-1.5 bg-slate-800 hover:bg-slate-700 rounded-md text-slate-400 transition-colors"
                  >
                    {copied === 'curl-chat' ? <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="group bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-[10px] font-bold rounded uppercase">Get</span>
                    <code className="text-white font-mono text-sm">/api/models</code>
                  </div>
                </div>
                <p className="text-slate-400 text-xs mb-4">Lists all models available on the Ollama Cloud through your active keys.</p>
                <div className="relative">
                  <pre className="bg-slate-950 rounded-xl p-4 overflow-x-auto text-[11px] font-mono text-slate-400">
                    {`curl -X GET ${baseUrl}/api/models \\
  -H "Authorization: Bearer ${showApiKey && profile?.systemApiKey ? profile.systemApiKey : '<TOKEN>'}"`}
                  </pre>
                  <button
                    onClick={() => copyToClipboard(`curl -X GET ${baseUrl}/api/models -H "Authorization: Bearer ${profile?.systemApiKey || '<TOKEN>'}"`, 'curl-models')}
                    className="absolute top-3 right-3 p-1.5 bg-slate-800 hover:bg-slate-700 rounded-md text-slate-400 transition-colors"
                  >
                    {copied === 'curl-models' ? <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Profile Management Section */}
          <section id="management" className="scroll-mt-24 space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <Settings className="w-5 h-5 text-purple-400" />
              </div>
              <h2 className="text-xl font-bold text-white">Profile Management</h2>
            </div>

            <div className="group bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-[10px] font-bold rounded uppercase">Put</span>
                  <code className="text-white font-mono text-sm">/api/auth/profile/default-model</code>
                </div>
              </div>
              <p className="text-slate-400 text-xs mb-4">Change your default model used by the gateway when no model is specified in the request.</p>
              <div className="relative">
                <pre className="bg-slate-950 rounded-xl p-4 overflow-x-auto text-[11px] font-mono text-slate-400">
                  {`curl -X PUT ${baseUrl}/api/auth/profile/default-model \\
  -H "Authorization: Bearer ${showApiKey && profile?.systemApiKey ? profile.systemApiKey : '<TOKEN>'}" \\
  -H "Content-Type: application/json" \\
  -d '{"model": "gemma3:4b"}'`}
                </pre>
                <button
                  onClick={() => copyToClipboard(`curl -X PUT ${baseUrl}/api/auth/profile/default-model -H "Authorization: Bearer ${profile?.systemApiKey || '<TOKEN>'}" -H "Content-Type: application/json" -d '{"model": "gemma3:4b"}'`, 'curl-default-model')}
                  className="absolute top-3 right-3 p-1.5 bg-slate-800 hover:bg-slate-700 rounded-md text-slate-400 transition-colors"
                >
                  {copied === 'curl-default-model' ? <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </section>

          {/* Key Types Notice */}
          <section id="key-types" className="scroll-mt-24">
            <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-6 space-y-3">
              <h3 className="text-amber-400 font-bold flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Important: API Keys vs. Device Keys
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Ollama Cloud provides two types of keys. It is common to confuse them:
              </p>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <li className="bg-slate-950/50 p-4 rounded-xl border border-white/5">
                  <span className="block text-white font-semibold text-xs mb-1">API Keys (Use These)</span>
                  <span className="text-[11px] text-slate-500">Found in the top section of the Ollama Dashboard. These allow **Inference** and chat interactions.</span>
                </li>
                <li className="bg-slate-950/50 p-4 rounded-xl border border-white/5 opacity-60">
                  <span className="block text-slate-300 font-semibold text-xs mb-1">Device Keys (SSH)</span>
                  <span className="text-[11px] text-slate-500">Starting with `ssh-ed25519`. These are for CLI operations (push/pull) and **do not work** for Chat inference.</span>
                </li>
              </ul>
            </div>
          </section>

          {/* Error Handling */}
          <section id="errors" className="scroll-mt-24 space-y-4">
            <h2 className="text-xl font-bold text-white">Error Handling</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
                <span className="text-emerald-400 font-mono text-xs font-bold block mb-1">429 Rate Limit</span>
                <p className="text-slate-500 text-[11px]">The gateway will intercept this and automatically try the next key in the pool.</p>
              </div>
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
                <span className="text-red-400 font-mono text-xs font-bold block mb-1">502 Bad Gateway</span>
                <p className="text-slate-500 text-[11px]">Returned if the upstream Ollama Cloud responds with an authentication error (invalid key).</p>
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
