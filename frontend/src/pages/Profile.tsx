import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Shield, Briefcase, Key, RefreshCw, Eye, EyeOff, Save, Lock, Smartphone, Check, Copy, ChevronDown } from 'lucide-react';
import api from '../lib/api';
import { toast } from 'react-hot-toast';
import clsx from 'clsx';

export default function Profile() {
  const { tenant: authTenant } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [models, setModels] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showApiKey, setShowApiKey] = useState(false);
  const [isGeneratingKey, setIsGeneratingKey] = useState(false);
  const [isUpdatingModel, setIsUpdatingModel] = useState(false);
  const [copied, setCopied] = useState(false);
  const [curlCopied, setCurlCopied] = useState(false);

  // Dropdown state
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Password reset state
  const [currentPassword, setCurrentPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  const filteredModels = models.filter(m => 
    m.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    fetchProfile();
    fetchModels();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/auth/profile');
      setProfile(res.data);
    } catch (err) {
      toast.error('Failed to fetch profile');
    } finally {
      setLoading(false);
    }
  };

  const fetchModels = async () => {
    try {
      const res = await api.get('/models');
      const modelList = res.data.models?.map((m: any) => m.name) || [];
      setModels(modelList);
    } catch (err) {
      console.error('Failed to fetch models');
    }
  };

  const handleGenerateKey = async () => {
    setIsGeneratingKey(true);
    try {
      const res = await api.post('/auth/profile/api-key');
      // res.data is expected to be { systemApiKey: string }
      const newApiKey = res.data.systemApiKey;
      setProfile(prev => ({ ...prev, systemApiKey: newApiKey }));
      toast.success('New API Access Key generated!');
      setShowApiKey(true);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to generate API Key';
      toast.error(msg);
      console.error('API Key Generation Error:', err);
    } finally {
      setIsGeneratingKey(false);
    }
  };

  const handleUpdateDefaultModel = async (model: string) => {
    setIsUpdatingModel(true);
    try {
      await api.put('/auth/profile/default-model', { model });
      setProfile({ ...profile, defaultModel: model });
      toast.success('Default model updated');
      setIsDropdownOpen(false);
      setSearchTerm('');
    } catch (err) {
      toast.error('Failed to update default model');
    } finally {
      setIsUpdatingModel(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    setIsResettingPassword(true);
    try {
      await api.put('/auth/profile/password', { currentPassword, newPassword });
      toast.success('Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update password');
    } finally {
      setIsResettingPassword(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full h-full space-y-6 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">My Profile</h1>
          <p className="text-slate-400">Manage your account, API access, and default settings.</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 text-sm">
          <div className={`w-2 h-2 rounded-full ${profile?.isActive ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-500'}`} />
          Account Status: <span className="font-semibold text-white ml-1">{profile?.isActive ? 'Active' : 'Inactive'}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Avatar & Quick Info */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center flex flex-col items-center relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-cyan-500" />
            <div className="w-28 h-28 rounded-full bg-emerald-500/10 border-2 border-emerald-500/20 flex items-center justify-center text-5xl text-emerald-400 font-bold mb-6 shadow-xl relative z-10">
              {profile?.name?.charAt(0).toUpperCase() || '?'}
            </div>
            <h2 className="text-2xl font-bold text-white mb-1 group-hover:text-emerald-400 transition-colors">{profile?.name}</h2>
            <p className="text-slate-500 text-sm mb-6 font-mono">{profile?.email || 'No email provided'}</p>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-800/50 text-emerald-400 text-xs font-bold border border-emerald-500/20 uppercase tracking-wider">
              <Shield className="w-3.5 h-3.5" />
              {profile?.role}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-6 flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-emerald-400" />
              Gateway Settings
            </h3>
            <div className="space-y-4">
              <label className="block text-xs font-medium text-slate-500 mb-1">Default Model</label>
              
              <div className="relative">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  disabled={isUpdatingModel}
                  className="w-full flex justify-between items-center px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white hover:border-emerald-500/50 transition-colors focus:ring-1 focus:ring-emerald-500 outline-none disabled:opacity-50"
                >
                  <span className="truncate">{profile?.defaultModel || 'Select a model'}</span>
                  <ChevronDown className={clsx("w-4 h-4 text-slate-500 transition-transform", isDropdownOpen && "rotate-180")} />
                </button>

                {isDropdownOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setIsDropdownOpen(false)} 
                    />
                    <div className="absolute top-full mt-2 left-0 right-0 z-20 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="p-2 border-b border-slate-800 bg-slate-950/50">
                        <input
                          autoFocus
                          type="text"
                          placeholder="Search models..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-600 focus:ring-1 focus:ring-emerald-500 outline-none"
                        />
                      </div>
                      <div className="max-h-60 overflow-y-auto custom-scrollbar">
                        {filteredModels.length > 0 ? (
                          filteredModels.map((m) => (
                            <button
                              key={m}
                              onClick={() => handleUpdateDefaultModel(m)}
                              className={clsx(
                                "w-full text-left px-4 py-2.5 text-xs transition-colors hover:bg-emerald-500/10",
                                profile?.defaultModel === m ? "text-emerald-400 bg-emerald-500/5 font-medium" : "text-slate-400 hover:text-white"
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

              <p className="text-[10px] text-slate-500 italic mt-4">
                This model will be pre-selected in the playground and documentation examples.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: API & Security */}
        <div className="lg:col-span-2 space-y-6">
          {/* System API Key Section */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 overflow-hidden relative">
            <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
              <Key className="w-32 h-32 text-white" />
            </div>
            
            <div className="flex items-center justify-between mb-6 relative z-10">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Key className="w-5 h-5 text-emerald-400" />
                System API Access
              </h3>
              <button
                onClick={handleGenerateKey}
                disabled={isGeneratingKey}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/20 transition-all hover:scale-105 active:scale-95 hover:shadow-[0_0_15px_rgba(16,185,129,0.2)] disabled:opacity-50 disabled:hover:scale-100"
              >
                {isGeneratingKey ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                {profile?.systemApiKey ? 'Regenerate Key' : 'Generate Key'}
              </button>
            </div>

            {profile?.systemApiKey ? (
              <div className="space-y-4">
                <p className="text-sm text-slate-400 leading-relaxed max-w-xl">
                  Use this key to authenticate with the Ollama Gateway API programmatically. Keep it secret!
                </p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 font-mono text-sm flex items-center justify-between group overflow-hidden">
                    <span className={showApiKey ? 'text-white' : 'text-slate-600'}>
                      {showApiKey ? profile.systemApiKey : '••••••••••••••••••••••••••••••••'}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 transition-colors"
                        title={showApiKey ? "Hide Key" : "Show Key"}
                      >
                        {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => copyToClipboard(profile.systemApiKey)}
                        className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 transition-colors"
                        title="Copy to clipboard"
                      >
                        {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
                <div className="bg-slate-950/50 rounded-xl p-4 border border-slate-800/50 relative group/curl">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Quick Usage</h4>
                  <pre className="text-[11px] font-mono text-emerald-400/80 bg-slate-950 p-3 rounded-lg overflow-x-auto border border-emerald-500/10">
                    curl http://localhost:3333/api/chat \<br/>
                    &nbsp;&nbsp;-H "Authorization: Bearer {showApiKey ? profile.systemApiKey : '<YOUR_KEY>'}" \<br/>
                    &nbsp;&nbsp;-H "Content-Type: application/json" \<br/>
                    &nbsp;&nbsp;-d '{"{"} "model": "{profile?.defaultModel || 'llama3'}", "messages": [{"{"} "role": "user", "content": "hi" {"}"}] {"}"}'
                  </pre>
                  <button
                    onClick={() => {
                      const curl = `curl http://localhost:3333/api/chat \\\n  -H "Authorization: Bearer ${profile?.systemApiKey || '<YOUR_KEY>'}" \\\n  -H "Content-Type: application/json" \\\n  -d '{"model": "${profile?.defaultModel || 'llama3'}", "messages": [{"role": "user", "content": "hi"}]}'`;
                      navigator.clipboard.writeText(curl);
                      setCurlCopied(true);
                      toast.success('Command copied!');
                      setTimeout(() => setCurlCopied(false), 2000);
                    }}
                    className="absolute top-4 right-4 p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-400 hover:text-white transition-all opacity-0 group-hover/curl:opacity-100"
                    title="Copy to clipboard"
                  >
                    {curlCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-slate-950/50 border border-dashed border-slate-800 rounded-2xl p-10 text-center">
                <p className="text-slate-500 text-sm italic">No API key generated yet.</p>
              </div>
            )}
          </div>

          {/* Password Management */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <Lock className="w-5 h-5 text-emerald-400" />
              Security Settings
            </h3>
            
            <form onSubmit={handleResetPassword} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-400">Current Password</label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 pr-10 text-white text-sm focus:outline-none focus:border-emerald-500/50 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="hidden md:block" />
              
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-400">New Password</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 pr-10 text-white text-sm focus:outline-none focus:border-emerald-500/50 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-400">Confirm New Password</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 pr-10 text-white text-sm focus:outline-none focus:border-emerald-500/50 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              
              <div className="md:col-span-2 flex justify-end mt-2">
                <button
                  type="submit"
                  disabled={isResettingPassword || !newPassword}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
                >
                  {isResettingPassword ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
