import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Navigate, useNavigate } from 'react-router-dom';
import AdminAnalytics from '@/components/admin/AdminAnalytics';
import AdminSpendings from '@/components/admin/AdminSpendings';
import AdminUsers from '@/components/admin/AdminUsers';
import AdminCategories from '@/components/admin/AdminCategories';
import AdminTrips from '@/components/admin/AdminTrips';
import AdminReports from '@/components/admin/AdminReports';
import { BarChart3, Receipt, Users, Tags, ArrowLeft, Search, Bell, MessageSquare, Moon, Maximize, Grid, ChevronRight, LogOut, Settings, HelpCircle, FileText, Map } from 'lucide-react';

type AdminTab = 'analytics' | 'trips' | 'spendings' | 'users' | 'categories' | 'reports' | 'settings' | 'faq';

const mainTabs = [
  { id: 'analytics' as AdminTab, label: 'Analytics', icon: BarChart3 },
  { id: 'trips' as AdminTab, label: 'Trips', icon: Map },
  { id: 'spendings' as AdminTab, label: 'Spendings', icon: Receipt },
  { id: 'categories' as AdminTab, label: 'Categories', icon: Tags },
  { id: 'users' as AdminTab, label: 'Users', icon: Users },
  { id: 'reports' as AdminTab, label: 'Report', icon: FileText },
  { id: 'settings' as AdminTab, label: 'Setting', icon: Settings },
  { id: 'faq' as AdminTab, label: 'FAQ', icon: HelpCircle },
];

export default function AdminPanelPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<AdminTab>('analytics');

  if (!user || user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-800">
      
      {/* Left Sidebar */}
      <aside className="w-[250px] bg-white border-r border-slate-200 flex flex-col shrink-0">
        {/* Logo Area */}
        <div className="h-[72px] flex items-center justify-between px-6 border-b border-transparent">
          <h1 className="text-2xl font-black tracking-tight text-slate-900 cursor-pointer" onClick={() => navigate('/settings')}>
            budget<span className="text-orange-500">Guard</span>
          </h1>
          <button className="p-1 rounded bg-slate-100 text-slate-500 hover:bg-slate-200">
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {mainTabs.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors group ${
                  isActive 
                    ? 'text-orange-500 font-semibold bg-orange-50/50' 
                    : 'text-slate-600 font-medium hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <tab.icon className={`w-5 h-5 ${isActive ? 'text-orange-500' : 'text-slate-400 group-hover:text-slate-600'}`} strokeWidth={isActive ? 2.5 : 2} />
                  <span>{tab.label}</span>
                </div>
                {!['settings', 'faq'].includes(tab.id) && (
                   <ChevronRight className={`w-4 h-4 ${isActive ? 'text-orange-500' : 'text-slate-300 group-hover:text-slate-400'}`} />
                )}
              </button>
            );
          })}
        </div>

        <div className="p-4 border-t border-slate-100">
          <button onClick={logout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 font-medium hover:bg-slate-50 hover:text-slate-900 transition-colors">
            <LogOut className="w-5 h-5 text-slate-400" />
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Header */}
        <header className="h-[72px] bg-white border-b border-slate-200 flex items-center justify-between px-8 bg-white/80 backdrop-blur-md sticky top-0 z-50">
          {/* Search Bar */}
          <div className="flex items-center gap-2 bg-slate-100/80 px-4 py-2.5 rounded-xl w-80 focus-within:ring-2 ring-orange-100 focus-within:bg-white transition-all">
            <Search className="w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search" 
              className="bg-transparent border-none outline-none text-sm w-full text-slate-700 placeholder:text-slate-400 font-medium" 
            />
          </div>

          {/* Right Icons & Profile */}
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-3 pr-5 border-r border-slate-200">
              <button className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors">
                <span className="w-5 h-5 flex items-center justify-center font-bold text-sm">EN</span>
              </button>
              <button className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors">
                <Moon className="w-5 h-5" />
              </button>
              <button className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-orange-500 rounded-full ring-2 ring-white"></span>
              </button>
              <button className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors relative">
                <MessageSquare className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-500 rounded-full ring-2 ring-white"></span>
              </button>
              <button className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors hidden md:block">
                <Maximize className="w-5 h-5" />
              </button>
              <button className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors hidden md:block">
                <Grid className="w-5 h-5" />
              </button>
            </div>

            {/* Profile Dropdown */}
            <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold overflow-hidden shadow-sm">
                 <img src="https://api.dicebear.com/7.x/notionists/svg?seed=Kristin" alt="Profile" className="w-full h-full object-cover" />
              </div>
              <div className="hidden sm:block text-sm">
                <p className="font-bold text-slate-800 leading-tight">{user.name}</p>
                <p className="text-slate-500 text-xs">Sale Administrator</p>
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 p-8 overflow-y-auto">
          {activeTab === 'analytics' && <AdminAnalytics />}
          {activeTab === 'trips' && (
            <div className="bg-white p-6 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100">
               <AdminTrips />
            </div>
          )}
          {activeTab === 'spendings' && (
            <div className="bg-white p-6 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100">
               <AdminSpendings />
            </div>
          )}
          {activeTab === 'users' && (
             <div className="bg-white p-6 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100">
               <AdminUsers />
             </div>
          )}
          {activeTab === 'categories' && (
             <div className="bg-white p-6 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100">
               <AdminCategories />
             </div>
          )}
          {activeTab === 'reports' && (
            <div className="bg-white p-6 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100">
               <AdminReports />
            </div>
          )}
          {['settings', 'faq'].includes(activeTab) && (
            <div className="bg-white p-12 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100 text-center">
               <h3 className="text-xl font-bold text-slate-800 mb-2 capitalize">{activeTab}</h3>
               <p className="text-slate-500">This section is under construction.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
