import { useEffect, useState } from 'react';
import api from '../lib/api';
import { 
  RefreshCw,
  Search,
  ChevronDown,
  ChevronUp,
  Clock,
  Terminal,
  Database,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  ExternalLink
} from 'lucide-react';
import clsx from 'clsx';
import { format } from 'date-fns';

interface LogEntry {
  id: string;
  endpoint: string;
  model: string | null;
  status: string;
  statusCode: number | null;
  latencyMs: number;
  retryCount: number;
  errorMessage: string | null;
  requestBody: string | null;
  responseBody: string | null;
  createdAt: string;
  apiKeyLabel: string | null;
  tenant?: { name: string };
}

export default function Logs() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchLogs = async () => {
    try {
      setRefreshing(true);
      const res = await api.get('/usage/logs?limit=100');
      setLogs(res.data);
    } catch (error) {
      console.error('Failed to fetch logs', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(log => 
    log.endpoint.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (log.model?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
    (log.errorMessage?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
    (log.apiKeyLabel?.toLowerCase().includes(searchTerm.toLowerCase()) || false)
  );

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  if (loading && logs.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Audit Logs</h1>
          <p className="text-slate-400 mt-1 text-sm">Complete history of API calls and rotation events</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Filter logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
            />
          </div>
          <button 
            onClick={fetchLogs}
            disabled={refreshing}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <RefreshCw className={clsx("w-5 h-5", refreshing && "animate-spin")} />
          </button>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950/50 border-b border-slate-800">
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Timestamp</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Endpoint</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Model</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Latency</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log) => (
                  <>
                    <tr 
                      key={log.id} 
                      className={clsx(
                        "hover:bg-slate-800/30 transition-colors cursor-pointer",
                        expandedId === log.id && "bg-slate-800/50"
                      )}
                      onClick={() => toggleExpand(log.id)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300 font-mono">
                        {format(new Date(log.createdAt), 'MMM dd, HH:mm:ss')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-slate-200">{log.endpoint}</span>
                          <span className="text-xs text-slate-500 font-mono">{log.apiKeyLabel || 'No key'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-slate-300">{log.model || '-'}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={log.status} code={log.statusCode} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex flex-col items-end">
                          <span className="text-sm font-medium text-slate-200">{log.latencyMs}ms</span>
                          {log.retryCount > 0 && (
                            <span className="text-xs text-amber-500">{log.retryCount} retries</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        {expandedId === log.id ? <ChevronUp className="w-5 h-5 text-slate-500" /> : <ChevronDown className="w-5 h-5 text-slate-500" />}
                      </td>
                    </tr>
                    {expandedId === log.id && (
                      <tr>
                        <td colSpan={6} className="px-6 py-0 bg-slate-950/30">
                          <div className="py-6 space-y-6 animate-in slide-in-from-top-2 duration-200">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {/* Request Section */}
                              <div className="space-y-2">
                                <div className="flex items-center gap-2 text-sm font-semibold text-slate-400 uppercase tracking-wider">
                                  <Terminal className="w-4 h-4" />
                                  Request Content
                                </div>
                                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 max-h-64 overflow-y-auto font-mono text-xs text-emerald-400">
                                  {log.requestBody ? (
                                    <pre>{JSON.stringify(JSON.parse(log.requestBody), null, 2)}</pre>
                                  ) : (
                                    <span className="text-slate-600 italic">No body content</span>
                                  )}
                                </div>
                              </div>

                              {/* Response Section */}
                              <div className="space-y-2">
                                <div className="flex items-center gap-2 text-sm font-semibold text-slate-400 uppercase tracking-wider">
                                  <Database className="w-4 h-4" />
                                  Response / Error
                                </div>
                                <div className={clsx(
                                  "bg-slate-900 border border-slate-800 rounded-xl p-4 max-h-64 overflow-y-auto font-mono text-xs",
                                  log.status === 'FAILED' ? "text-red-400" : "text-blue-400"
                                )}>
                                  {log.errorMessage ? (
                                    <div className="space-y-2">
                                      <p className="font-bold underline">Error Message:</p>
                                      <p>{log.errorMessage}</p>
                                    </div>
                                  ) : log.responseBody ? (
                                    <pre>
                                      {log.responseBody.startsWith('{') || log.responseBody.startsWith('[') 
                                        ? JSON.stringify(JSON.parse(log.responseBody), null, 2)
                                        : log.responseBody}
                                    </pre>
                                  ) : (
                                    <span className="text-slate-600 italic">No response content</span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Additional Metadata */}
                            <div className="flex flex-wrap gap-4 pt-2 border-t border-slate-800/50">
                              <MetaItem icon={Clock} label="Full Timestamp" value={new Date(log.createdAt).toLocaleString()} />
                              <MetaItem icon={Database} label="Log ID" value={log.id} />
                              {log.tenant && <MetaItem icon={AlertCircle} label="Tenant" value={log.tenant.name} />}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    No logs found matching your filters
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status, code }: { status: string, code: number | null }) {
  if (status === 'SUCCESS') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
        <CheckCircle2 className="w-3 h-3 mr-1" />
        Success {code && `(${code})`}
      </span>
    );
  }
  if (status === 'RETRIED') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
        <AlertTriangle className="w-3 h-3 mr-1" />
        Retried
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
      <AlertCircle className="w-3 h-3 mr-1" />
      Failed {code && `(${code})`}
    </span>
  );
}

function MetaItem({ icon: Icon, label, value }: { icon: any, label: string, value: string }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <Icon className="w-3 h-3 text-slate-500" />
      <span className="text-slate-500">{label}:</span>
      <span className="text-slate-300 font-mono">{value}</span>
    </div>
  );
}
