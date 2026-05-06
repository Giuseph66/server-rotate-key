import { Terminal, Server, Key, ShieldCheck, Zap, Info, ChevronRight, Copy, Bot, Eye, EyeOff, Settings, Check } from 'lucide-react';
import { useState, useEffect } from 'react';
import clsx from 'clsx';
import api from '../lib/api';

export default function Docs() {
  const baseUrl = 'http://localhost:3333';
  const [copied, setCopied] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [showApiKey, setShowApiKey] = useState(false);
  const [usageMode, setUsageMode] = useState<'ollama' | 'codex'>('ollama');

  useEffect(() => {
    if (profile?.defaultProvider) {
      setUsageMode(profile.defaultProvider);
    }
  }, [profile]);

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

  const copyToClipboard = async (text: string, id: string) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        textArea.style.top = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
      }
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
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
          Integrate the Server Rotate Key gateway into your workflows. Manage keys, bypass rate limits, and ensure high availability for your LLM applications.
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
                  const md = `# Server Rotate Key - AI Integration Context\n\n## 🔗 Base Configuration\n- **Base URL:** \`${baseUrl}\`\n- **Authentication:** Header \`Authorization: Bearer <YOUR_SYSTEM_API_KEY>\`\n- **Headers:** \`Content-Type: application/json\`\n\n## 🛠️ API Endpoints\n\n### 1. Chat Completion (\`/api/chat\`)\n- **Method:** \`POST\`\n- **Description:** Drop-in proxy for LLM inference with automatic rotation and provider switching.\n- **Body Schema:**\n  \`\`\`json\n  {\n    "model": "llama3.2",\n    "messages": [{ "role": "user", "content": "Hello!" }],\n    "stream": false,\n    "provedor": "ollama" // Optional: "ollama" | "codex"\n  }\n  \`\`\`\n- **Key Features:**\n  - **Smart Rotation:** Automatically retries using a different key if a \`429 Rate Limit\` is encountered (Ollama provider).\n  - **Provider Routing:** Use the \`provedor\` field to switch between **Ollama** (pooled keys) and **Codex** (ChatGPT connection).\n  - **Model Injection:** If the \`model\` field is omitted, the gateway automatically injects your configured **Default Model**.\n\n### 2. List Models (\`/api/models\`)\n- **Method:** \`GET\`\n- **Behavior:** Returns an aggregated list of models available across all active providers (Ollama and Codex).\n\n## 🚨 Error Handling\n- \`429 Rate Limit\`: Returned only if **all** configured keys for the provider are currently exhausted.\n- \`502 Bad Gateway\`: Upstream provider network error or invalid API key configuration.\n- \`503 Service Unavailable\`: No active keys or connections available in the pool.\n\n## 💡 Integration Tips\n- **Provider Control**: Force a specific backend using the \`provedor\` parameter.\n- **Streaming**: Full support for \`ndjson\` streaming for both Ollama and Codex backends.\n- **Model Compatibility**: When using Codex, use GPT-compatible model names; for Ollama, use local model names.\n`;
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
                "The gateway acts as a smart proxy. It handles the 429 retries and provider routing so your application doesn't have to."
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Main Content */}
        <div className="lg:col-span-2 space-y-12">
          
          {/* Global Provider Toggle for Examples */}
          <div className="flex items-center justify-between bg-slate-900/50 border border-slate-800 rounded-2xl p-4 mb-2">
            <div>
              <h3 className="text-sm font-bold text-white">Example Context</h3>
              <p className="text-[10px] text-slate-500">Switch between providers to update all code examples below</p>
            </div>
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setUsageMode('ollama')}
                className={clsx(
                  "px-4 py-1.5 text-xs font-bold rounded-lg transition-all",
                  usageMode === 'ollama' ? "bg-emerald-500 text-white shadow-lg" : "text-slate-500 hover:text-slate-400"
                )}
              >
                Ollama
              </button>
              <button
                onClick={() => setUsageMode('codex')}
                className={clsx(
                  "px-4 py-1.5 text-xs font-bold rounded-lg transition-all",
                  usageMode === 'codex' ? "bg-emerald-500 text-white shadow-lg" : "text-slate-500 hover:text-slate-400"
                )}
              >
                Codex
              </button>
            </div>
          </div>

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
                </div>
                <p className="text-slate-400 text-xs mb-4">Drop-in replacement for LLM chat endpoints. Supports message history, model selection, and provider routing.</p>
                <div className="relative">
                  <pre className="bg-slate-950 rounded-xl p-4 overflow-x-auto text-[11px] font-mono text-slate-400">
                    {`curl -X POST ${baseUrl}/api/chat \\
  -H "Authorization: Bearer ${showApiKey && profile?.systemApiKey ? profile.systemApiKey : '<TOKEN>'}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "${usageMode === 'codex' ? 'GPT-5.5' : 'llama3.2'}", 
    "messages": [{"role": "user", "content": "Hello!"}],
    "provedor": "${usageMode}"
  }'`}
                  </pre>
                  <button
                    onClick={() => {
                      const model = usageMode === 'codex' ? 'GPT-5.5' : 'llama3.2';
                      copyToClipboard(`curl -X POST ${baseUrl}/api/chat -H "Authorization: Bearer ${profile?.systemApiKey || '<TOKEN>'}" -H "Content-Type: application/json" -d '{"model": "${model}", "messages": [{"role": "user", "content": "Hello!"}], "provedor": "${usageMode}"}'`, 'curl-chat');
                    }}
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
                <p className="text-slate-400 text-xs mb-4">Lists all models available across your active providers and pooled keys.</p>
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

            <div className="space-y-4">
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
  -d '{"model": "${usageMode === 'codex' ? 'GPT-5.5' : 'llama3.2'}"}'`}
                  </pre>
                </div>
              </div>

              <div className="group bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-[10px] font-bold rounded uppercase">Put</span>
                    <code className="text-white font-mono text-sm">/api/auth/profile/default-provider</code>
                  </div>
                </div>
                <p className="text-slate-400 text-xs mb-4">Switch the default provider for all incoming requests (ollama | codex).</p>
                <div className="relative">
                  <pre className="bg-slate-950 rounded-xl p-4 overflow-x-auto text-[11px] font-mono text-slate-400">
                    {`curl -X PUT ${baseUrl}/api/auth/profile/default-provider \\
  -H "Authorization: Bearer ${showApiKey && profile?.systemApiKey ? profile.systemApiKey : '<TOKEN>'}" \\
  -H "Content-Type: application/json" \\
  -d '{"provider": "${usageMode}"}'`}
                  </pre>
                </div>
              </div>
            </div>
          </section>

          {/* Key Types Notice */}
          <section id="key-types" className="scroll-mt-24">
            <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-6 space-y-3">
              <h3 className="text-amber-400 font-bold flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Ollama Cloud: API Keys vs. Device Keys
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                When using Ollama Cloud, it is common to confuse the two types of keys:
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
