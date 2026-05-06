import { useEffect, useState } from 'react';
import api from '../lib/api';
import { 
  Plus, KeyRound, Play, RefreshCw, Trash2, AlertCircle, 
  Copy, Check, Shield, Lock, Smartphone, Bot, Edit2, X
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import { useSearchParams } from 'react-router-dom';

const maskSensitive = (text: string) => {
  if (!text) return '';
  const length = text.length;
  if (length <= 10) return text;
  
  const centerSize = 10;
  const start = Math.floor((length - centerSize) / 2);
  const end = start + centerSize;
  
  return `************${text.substring(start, end)}************`;
};

export default function Keys() {
  const [keys, setKeys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newKey, setNewKey] = useState('');
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testingAll, setTestingAll] = useState(false);
  
  // Codex state
  const [profile, setProfile] = useState<any>(null);
  const [codexStats, setCodexStats] = useState<any>(null);
  const [isConnectingChatGpt, setIsConnectingChatGpt] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  const fetchKeys = async () => {
    try {
      const res = await api.get('/keys');
      setKeys(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProfile = async () => {
    try {
      const res = await api.get('/auth/profile');
      setProfile(res.data);
    } catch (err) {
      console.error('Failed to fetch profile');
    }
  };

  const fetchCodexStats = async () => {
    try {
      const res = await api.get('/usage/codex-stats');
      setCodexStats(res.data);
    } catch (err) {
      console.error('Failed to fetch Codex stats');
    }
  };

  useEffect(() => {
    fetchKeys();
    fetchProfile();
    fetchCodexStats();

    // Handle ChatGPT OAuth results
    const chatgptStatus = searchParams.get('chatgpt');
    if (chatgptStatus === 'connected') {
      toast.success('Successfully connected to ChatGPT!');
      searchParams.delete('chatgpt');
      setSearchParams(searchParams);
    } else if (chatgptStatus === 'error') {
      const msg = searchParams.get('message') || 'Failed to connect';
      toast.error(`ChatGPT Connection Error: ${msg}`);
      searchParams.delete('chatgpt');
      searchParams.delete('message');
      setSearchParams(searchParams);
    }
  }, [searchParams]);

  const handleConnectChatGpt = async () => {
    setIsConnectingChatGpt(true);
    try {
      const res = await api.get('/auth/chatgpt/login');
      if (res.data.url) {
        window.location.href = res.data.url;
      }
    } catch (err: any) {
      toast.error('Failed to start ChatGPT login');
    } finally {
      setIsConnectingChatGpt(false);
    }
  };

  const handleDisconnectChatGpt = async () => {
    if (!confirm('Disconnect ChatGPT account?')) return;
    try {
      await api.delete('/auth/chatgpt/disconnect');
      setProfile({ ...profile, chatgptAccessToken: null, chatgptAccountId: null });
      setCodexStats(null);
      toast.success('ChatGPT account disconnected');
    } catch (err) {
      toast.error('Failed to disconnect');
    }
  };

  const handleUpdateLabel = async (id: string, label: string) => {
    try {
      await api.put(`/keys/${id}`, { label });
      fetchKeys();
      toast.success('Key renamed successfully');
    } catch (error) {
      toast.error('Failed to rename key');
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/keys', { label: newLabel, key: newKey });
      setNewLabel('');
      setNewKey('');
      setShowAdd(false);
      fetchKeys();
    } catch (error) {
      alert('Failed to add key');
    }
  };

  const handleToggle = async (id: string) => {
    try {
      await api.post(`/keys/${id}/toggle`);
      fetchKeys();
    } catch (error) {
      alert('Failed to toggle key');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this key?')) return;
    try {
      await api.delete(`/keys/${id}`);
      fetchKeys();
    } catch (error) {
      alert('Failed to delete key');
    }
  };

  const handleTest = async (id: string) => {
    try {
      setTestingId(id);
      await api.post(`/keys/${id}/test`);
      await fetchKeys();
    } catch (error) {
      alert('Failed to test key');
    } finally {
      setTestingId(null);
    }
  };

  const handleTestAll = async () => {
    try {
      setTestingAll(true);
      await api.post('/keys/test-all');
      await fetchKeys();
    } catch (error) {
      alert('Failed to test keys');
    } finally {
      setTestingAll(false);
    }
  };

  if (loading) {
    return <div className="h-full flex items-center justify-center"><div className="animate-spin h-8 w-8 border-b-2 border-emerald-500 rounded-full"></div></div>;
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">API Key Pool</h1>
          <p className="text-slate-400 mt-1 text-sm">Manage your API keys for rotation</p>
        </div>
        <div className="flex flex-col md:flex-row items-center gap-3 w-full sm:w-auto">
          {/* ChatGPT Connection Status */}
          <div className={clsx(
            "flex items-center gap-4 px-3 py-1.5 rounded-xl border transition-all w-full md:w-auto justify-between md:justify-start",
            profile?.chatgptAccessToken ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-slate-800 border-slate-700 text-slate-500"
          )}>
            <div className="flex items-center gap-3">
              <div className={clsx(
                "p-1.5 rounded-lg",
                profile?.chatgptAccessToken ? "bg-emerald-500/20" : "bg-slate-700/50"
              )}>
                <Bot className={clsx("w-4 h-4", isConnectingChatGpt && "animate-spin")} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider leading-none">ChatGPT Codex</p>
                <p className="text-[9px] font-medium opacity-60 leading-none mt-1">
                  {profile?.chatgptAccessToken ? 'Connected' : 'Disconnected'}
                </p>
              </div>
            </div>
            
            {profile?.chatgptAccessToken ? (
              <button 
                onClick={handleDisconnectChatGpt}
                className="p-1.5 hover:bg-red-500/10 text-slate-500 hover:text-red-400 rounded-lg transition-colors group"
                title="Disconnect Account"
              >
                <Lock className="w-3.5 h-3.5 transition-transform group-hover:scale-110" />
              </button>
            ) : (
              <button 
                onClick={handleConnectChatGpt}
                disabled={isConnectingChatGpt}
                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold rounded-lg transition-all"
              >
                Connect
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={handleTestAll}
              disabled={testingAll}
              className="flex-1 sm:flex-none flex items-center justify-center px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
            >
              <RefreshCw className={clsx("w-4 h-4 mr-2", testingAll && "animate-spin")} />
              Test All
            </button>
            <button
              onClick={() => setShowAdd(!showAdd)}
              className="flex-1 sm:flex-none flex items-center justify-center px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-xl transition-colors shadow-[0_0_15px_rgba(16,185,129,0.3)]"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Key
            </button>
          </div>
        </div>
      </div>

      {showAdd && (
        <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-6 shadow-[0_0_30px_rgba(16,185,129,0.05)] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[80px] rounded-full pointer-events-none" />
          <h2 className="text-lg font-medium text-white mb-4 relative z-10">Add New Key</h2>
          <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-4 relative z-10">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Label (e.g. Production Key #1)"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500/50 outline-none"
              />
            </div>
            <div className="flex-[2]">
              <input
                type="text"
                placeholder="Provider API Key (sk-...)"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500/50 outline-none"
              />
            </div>
            <button type="submit" className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-xl transition-colors whitespace-nowrap">
              Save Key
            </button>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {profile?.chatgptAccessToken && codexStats && (
          <CodexStatsCard stats={codexStats} accountId={profile.chatgptAccountId} />
        )}
        {keys.map((key) => (
          <KeyCard 
            key={key.id} 
            item={key} 
            onToggle={() => handleToggle(key.id)}
            onDelete={() => handleDelete(key.id)}
            onTest={() => handleTest(key.id)}
            isTesting={testingId === key.id}
            onUpdateLabel={handleUpdateLabel}
          />
        ))}
        {keys.length === 0 && !showAdd && (
          <div className="col-span-full py-12 flex flex-col items-center justify-center bg-slate-900 border border-slate-800 rounded-2xl border-dashed">
            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4">
              <KeyRound className="w-8 h-8 text-slate-500" />
            </div>
            <p className="text-slate-400 font-medium">No API keys found</p>
            <p className="text-sm text-slate-500 mt-1">Add your first key to start routing requests.</p>
          </div>
        )}
      </div>


    </div>
  );
}

function KeyCard({ item, onToggle, onDelete, onTest, isTesting, onUpdateLabel }: any) {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editLabel, setEditLabel] = useState(item.label);
  
  const isCoolingDown = item.status === 'COOLING_DOWN';
  const isActive = item.isActive;
  
  let statusColor = "bg-slate-500";
  let statusText = "Disabled";
  
  if (isActive) {
    if (isCoolingDown) {
      statusColor = "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]";
      statusText = "Cooling Down";
    } else {
      statusColor = "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]";
      statusText = "Active";
    }
  }

  const copyKey = () => {
    navigator.clipboard.writeText(item.key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    if (editLabel.trim() && editLabel !== item.label) {
      onUpdateLabel(item.id, editLabel);
    }
    setIsEditing(false);
  };

  return (
    <div className={clsx(
      "bg-slate-900 border rounded-2xl p-5 flex flex-col relative overflow-hidden transition-all",
      isActive ? (isCoolingDown ? "border-amber-500/30" : "border-slate-800 hover:border-emerald-500/30") : "border-slate-800 opacity-75"
    )}>
      {isCoolingDown && (
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-[40px] rounded-full pointer-events-none" />
      )}
      
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center flex-shrink-0">
            <KeyRound className="w-5 h-5 text-slate-400" />
          </div>
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={editLabel}
                  onChange={(e) => setEditLabel(e.target.value)}
                  className="bg-slate-950 border border-emerald-500/50 rounded px-2 py-0.5 text-sm text-white w-full outline-none focus:ring-1 focus:ring-emerald-500"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSave();
                    if (e.key === 'Escape') setIsEditing(false);
                  }}
                />
                <button onClick={handleSave} className="text-emerald-500 hover:text-emerald-400"><Check className="w-3.5 h-3.5" /></button>
                <button onClick={() => setIsEditing(false)} className="text-slate-500 hover:text-slate-400"><X className="w-3.5 h-3.5" /></button>
              </div>
            ) : (
              <div className="flex items-center gap-2 group/label">
                <h3 className="font-medium text-white truncate">{item.label}</h3>
                <button 
                  onClick={() => setIsEditing(true)}
                  className="opacity-0 group-hover/label:opacity-100 p-1 text-slate-500 hover:text-emerald-400 transition-all"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
              </div>
            )}
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className={`w-1.5 h-1.5 rounded-full ${statusColor}`} />
              <span className="text-xs text-slate-400 font-medium">{statusText}</span>
            </div>
          </div>
        </div>
        
        <button 
          onClick={onToggle}
          className={clsx(
            "w-10 h-6 rounded-full flex items-center transition-colors p-1 flex-shrink-0",
            isActive ? "bg-emerald-500" : "bg-slate-700"
          )}
        >
          <div className={clsx(
            "w-4 h-4 rounded-full bg-white transition-transform",
            isActive ? "translate-x-4" : "translate-x-0"
          )} />
        </button>
      </div>

      <div className="space-y-4 relative z-10">
        <div className="relative group/key">
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 pr-10 font-mono text-xs text-slate-400 overflow-hidden truncate">
            {maskSensitive(item.key)}
          </div>
          <button 
            onClick={copyKey}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-500 hover:text-white transition-all opacity-0 group-hover/key:opacity-100"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-800/50 border border-slate-700/30 rounded-lg p-3">
            <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Total Uses</div>
            <div className="text-sm font-black text-white">{item.totalRequests.toLocaleString()}</div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/30 rounded-lg p-3">
            <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">429 Errors</div>
            <div className="text-sm font-black text-white">{item.errorCount429.toLocaleString()}</div>
          </div>
        </div>

        {isCoolingDown && item.cooldownUntil && (
          <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-500/10 p-2 rounded-lg border border-amber-500/20">
            <AlertCircle className="w-4 h-4" />
            Cooldown expires {formatDistanceToNow(new Date(item.cooldownUntil), { addSuffix: true })}
          </div>
        )}
        
        {item.lastTestedAt && (
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span>Last tested {formatDistanceToNow(new Date(item.lastTestedAt), { addSuffix: true })}:</span>
            <span className={item.lastTestResult === 'SUCCESS' ? 'text-emerald-400' : 'text-red-400'}>
              {item.lastTestResult}
            </span>
          </div>
        )}
      </div>

      <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between relative z-10">
        <button 
          onClick={onTest}
          disabled={isTesting || !isActive}
          className="flex items-center gap-1.5 text-sm font-medium text-blue-400 hover:text-blue-300 disabled:opacity-50 transition-colors"
        >
          <Play className={clsx("w-4 h-4", isTesting && "animate-pulse")} />
          {isTesting ? 'Testing...' : 'Test Key'}
        </button>
        <button 
          onClick={onDelete}
          className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function CodexStatsCard({ stats, accountId }: any) {
  const [copied, setCopied] = useState(false);

  const copyId = () => {
    navigator.clipboard.writeText(accountId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-slate-900 border border-emerald-500/20 rounded-2xl p-5 flex flex-col relative overflow-hidden animate-in fade-in zoom-in duration-500 shadow-[0_0_40px_rgba(16,185,129,0.05)]">
      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-[40px] rounded-full pointer-events-none" />
      
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-white">Codex API Status</h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
              <span className="text-xs text-emerald-400 font-medium uppercase tracking-wider">Live</span>
            </div>
          </div>
        </div>
        <div className="px-2 py-1 bg-emerald-500/10 rounded-lg border border-emerald-500/20 text-[9px] font-bold text-emerald-400">
          EXTERNAL
        </div>
      </div>

      <div className="flex-1 space-y-4 relative z-10">
        <div className="bg-slate-950/50 border border-slate-800/50 rounded-xl p-2.5 relative group/acc">
          <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1"></p>
          <p className="text-xs font-mono text-slate-400 truncate pr-8">{maskSensitive(accountId)}</p>
          <button 
            onClick={copyId}
            className="absolute right-2 bottom-2 p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-500 hover:text-white transition-all opacity-0 group-hover/acc:opacity-100"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="bg-slate-800/50 border border-slate-700/30 rounded-lg p-2.5 group hover:border-emerald-500/30 transition-colors">
            <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Requests</div>
            <div className="text-sm font-black text-white group-hover:text-emerald-400 transition-colors">{stats.totalRequests.toLocaleString()}</div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/30 rounded-lg p-2.5 group hover:border-emerald-500/30 transition-colors">
            <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Tokens</div>
            <div className="text-sm font-black text-white group-hover:text-emerald-400 transition-colors">
              {Math.round((stats.totalTokensInput + stats.totalTokensOutput) / 1000)}k
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-between text-[10px] text-slate-500">
          <span>Last active {stats.lastUsed ? formatDistanceToNow(new Date(stats.lastUsed), { addSuffix: true }) : 'never'}</span>
        </div>
      </div>

      <div className="mt-5 pt-4 border-t border-slate-800/50 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-1.5">
          <Bot className="w-3.5 h-3.5 text-emerald-500" />
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stats.limit}</span>
        </div>
        <div className="flex items-center gap-1 text-[9px] text-slate-500">
          <Shield className="w-3 h-3" />
          <span>Secured by OAuth</span>
        </div>
      </div>
    </div>
  );
}
