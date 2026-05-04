import { Outlet, Navigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  LayoutDashboard, 
  KeyRound, 
  TerminalSquare, 
  BookOpen, 
  LogOut,
  Menu,
  X,
  Users,
  History
} from 'lucide-react';
import { useState } from 'react';
import clsx from 'clsx';

export default function Layout() {
  const { isAuthenticated, logout, tenant } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'API Keys', href: '/keys', icon: KeyRound },
    ...(tenant?.role === 'admin' ? [{ name: 'Users', href: '/tenants', icon: Users }] : []),
    { name: 'Playground', href: '/playground', icon: TerminalSquare },
    { name: 'Logs', href: '/logs', icon: History },
    { name: 'Docs', href: '/docs', icon: BookOpen },
  ];

  return (
    <div className="h-screen w-full bg-slate-950 flex overflow-hidden">
      {/* Sidebar - Desktop */}
      <div className="hidden md:flex flex-col w-64 h-full bg-slate-900 border-r border-slate-800">
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
            <KeyRound className="w-5 h-5 text-emerald-400" />
          </div>
          <span className="font-bold text-white text-sm leading-tight tracking-tight">Ollama Server Rotate Key</span>
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={clsx(
                  "group flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200",
                  isActive 
                    ? "bg-emerald-500/10 text-emerald-400" 
                    : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
                )}
              >
                <Icon className={clsx("mr-3 flex-shrink-0 h-5 w-5 transition-colors", isActive ? "text-emerald-400" : "text-slate-500 group-hover:text-slate-300")} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800 shrink-0">
          <Link to="/profile" className="flex items-center gap-3 px-3 py-2 mb-2 rounded-xl hover:bg-slate-800/50 transition-colors cursor-pointer group">
            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 font-medium shrink-0 group-hover:bg-slate-700 transition-colors">
              {tenant?.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-200 truncate group-hover:text-emerald-400 transition-colors">{tenant?.name}</p>
              <p className="text-xs text-slate-500 truncate">{tenant?.role}</p>
            </div>
          </Link>
          <button
            onClick={logout}
            className="w-full flex items-center px-3 py-2 text-sm font-medium text-slate-400 rounded-xl hover:bg-red-500/10 hover:text-red-400 transition-colors"
          >
            <LogOut className="mr-3 flex-shrink-0 h-5 w-5" />
            Sign out
          </button>
        </div>
      </div>

      {/* Mobile Header & Menu */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
            <KeyRound className="w-5 h-5 text-emerald-400" />
          </div>
          <span className="font-bold text-white text-sm tracking-tight truncate">Ollama Server Rotate Key</span>
        </div>
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-slate-400 hover:text-white rounded-lg shrink-0"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Nav Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm pt-16">
          <nav className="p-4 space-y-2 h-full overflow-y-auto">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={clsx(
                    "flex items-center px-4 py-3 text-base font-medium rounded-xl",
                    isActive ? "bg-emerald-500/10 text-emerald-400" : "text-slate-300 hover:bg-slate-800"
                  )}
                >
                  <Icon className="mr-4 h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
            <button
              onClick={() => { setMobileMenuOpen(false); logout(); }}
              className="w-full flex items-center px-4 py-3 text-base font-medium text-red-400 rounded-xl hover:bg-slate-800"
            >
              <LogOut className="mr-4 h-5 w-5" />
              Sign out
            </button>
          </nav>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden pt-14 md:pt-0">
        <div className="flex-1 overflow-y-auto h-full p-4 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
