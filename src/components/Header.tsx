import React, { useState } from 'react';
import { SidebarView, AuthUser } from '../types';
import { 
  Monitor, 
  Settings, 
  Users, 
  HelpCircle, 
  LogOut, 
  Globe, 
  UserPlus, 
  MessageSquare, 
  Terminal, 
  FileText, 
  X, 
  Smartphone,
  Tv,
  CheckCircle2,
  Gamepad2,
  Download
} from 'lucide-react';
import { downloadProjectZip } from '../utils/zipGenerator';

interface DesktopLayoutHeaderProps {
  activeView: SidebarView;
  setActiveView: (view: SidebarView) => void;
  currentUser: AuthUser | null;
  onLogout: () => void;
  children: React.ReactNode;
}

export const Header: React.FC<DesktopLayoutHeaderProps> = ({ 
  activeView, 
  setActiveView, 
  currentUser,
  onLogout,
  children 
}) => {
  const [showFriendsDrawer, setShowFriendsDrawer] = useState(false);
  const [showHelpMenu, setShowHelpMenu] = useState(false);
  const [showLogoutTooltip, setShowLogoutTooltip] = useState(false);

  const userDisplayTag = currentUser 
    ? `${currentUser.username}#${currentUser.tag}` 
    : 'Guest#000000';

  return (
    <div className="min-h-screen bg-[#111217] text-slate-100 flex flex-col font-sans select-none overflow-x-hidden">
      {/* 1. Top Crimson Window Titlebar matching Images 1-5 */}
      <div className="bg-[#e11d48] text-white h-8 px-3 flex items-center justify-between text-xs font-sans font-bold z-50 shrink-0 shadow-md">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 rounded bg-white/20 flex items-center justify-center text-[10px] font-black">P</div>
          <span className="tracking-wide">PulseGrid Remote Desktop</span>
          <span className="text-[10px] bg-black/20 px-2 py-0.5 rounded font-mono font-normal">
            100% Free
          </span>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-[11px] font-mono bg-black/20 px-2.5 py-0.5 rounded">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>{userDisplayTag}</span>
          </div>

          {/* Native Window Controls matching Images */}
          <div className="flex items-center space-x-2 text-white/80">
            <button className="hover:text-white px-1">―</button>
            <button className="hover:text-white px-1">□</button>
            <button className="hover:text-white px-1 hover:bg-rose-800 px-1.5 py-0.5 rounded">✕</button>
          </div>
        </div>
      </div>

      {/* Main Body Container: Left Vertical Sidebar + Main Content */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* 2. Left Vertical Sidebar Navigation matching Images 1-5 */}
        <aside className="w-14 bg-[#181920] border-r border-[#262833] flex flex-col items-center justify-between py-4 z-40 shrink-0">
          <div className="space-y-4 w-full flex flex-col items-center">
            {/* Computers View Button */}
            <button
              onClick={() => {
                setActiveView('computers');
                setShowFriendsDrawer(false);
                setShowHelpMenu(false);
              }}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer relative group ${
                activeView === 'computers'
                  ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-[#232530]'
              }`}
              title="Computers"
            >
              <Monitor className="w-5 h-5" />
              <span className="absolute left-14 bg-[#1f212a] text-white text-[10px] font-bold px-2 py-1 rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                Computers
              </span>
            </button>

            {/* Settings View Button */}
            <button
              onClick={() => {
                setActiveView('settings');
                setShowFriendsDrawer(false);
                setShowHelpMenu(false);
              }}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer relative group ${
                activeView === 'settings'
                  ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-[#232530]'
              }`}
              title="Settings"
            >
              <Settings className="w-5 h-5" />
              <span className="absolute left-14 bg-[#1f212a] text-white text-[10px] font-bold px-2 py-1 rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                Settings
              </span>
            </button>

            {/* Friends & Co-Op Button (Opens Drawer matching Image 3) */}
            <button
              onClick={() => {
                setShowFriendsDrawer(!showFriendsDrawer);
                setShowHelpMenu(false);
              }}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer relative group ${
                showFriendsDrawer
                  ? 'bg-rose-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white hover:bg-[#232530]'
              }`}
              title="Friends & Co-Op"
            >
              <Users className="w-5 h-5" />
              <span className="absolute left-14 bg-[#1f212a] text-white text-[10px] font-bold px-2 py-1 rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                Friends & Lobbies
              </span>
            </button>

            {/* Web / Mobile Safari Viewer Mode Button */}
            <button
              onClick={() => {
                setActiveView('web_client');
                setShowFriendsDrawer(false);
                setShowHelpMenu(false);
              }}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer relative group ${
                activeView === 'web_client'
                  ? 'bg-rose-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white hover:bg-[#232530]'
              }`}
              title="Web Link (iPhone/iPad)"
            >
              <Globe className="w-5 h-5" />
              <span className="absolute left-14 bg-[#1f212a] text-white text-[10px] font-bold px-2 py-1 rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                Web Link (iPhone / iPad)
              </span>
            </button>

            {/* Arcade Co-Op Button */}
            <button
              onClick={() => {
                setActiveView('arcade');
                setShowFriendsDrawer(false);
                setShowHelpMenu(false);
              }}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer relative group ${
                activeView === 'arcade'
                  ? 'bg-rose-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white hover:bg-[#232530]'
              }`}
              title="Arcade Lobbies"
            >
              <Gamepad2 className="w-5 h-5" />
              <span className="absolute left-14 bg-[#1f212a] text-white text-[10px] font-bold px-2 py-1 rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                Arcade Lobbies
              </span>
            </button>
          </div>

          {/* Sidebar Bottom Group: Help & Logout matching Images 4 & 5 */}
          <div className="space-y-3 w-full flex flex-col items-center">
            {/* Help Button */}
            <button
              onClick={() => {
                setShowHelpMenu(!showHelpMenu);
                setShowFriendsDrawer(false);
              }}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer relative group ${
                showHelpMenu ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white hover:bg-[#232530]'
              }`}
              title="Help & Console"
            >
              <HelpCircle className="w-5 h-5" />
            </button>

            {/* Logout Button matching Image 5 */}
            <button
              onClick={() => setShowLogoutTooltip(!showLogoutTooltip)}
              className="w-10 h-10 rounded-xl text-rose-500 hover:text-rose-400 hover:bg-rose-600/10 flex items-center justify-center transition-all cursor-pointer relative group"
              title="Log Out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </aside>

        {/* 3. Slide-Out Friends Panel matching Image 3 */}
        {showFriendsDrawer && (
          <div className="w-64 bg-[#16171d] border-r border-[#272833] p-4 z-30 flex flex-col justify-between animate-fade-in text-xs font-sans">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#232530]">
                <span className="font-bold text-white text-xs">FRIENDS</span>
                <button
                  onClick={() => setShowFriendsDrawer(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2">
                <button className="w-full py-2 px-3 rounded bg-[#20222a] hover:bg-[#2a2c38] text-slate-200 font-medium flex items-center space-x-2 transition-all">
                  <UserPlus className="w-4 h-4 text-rose-400" />
                  <span>Add Friend</span>
                </button>

                <button className="w-full py-2 px-3 rounded bg-[#20222a] hover:bg-[#2a2c38] text-slate-300 flex items-center justify-between transition-all">
                  <span>View Friend Requests</span>
                  <span className="font-mono text-[10px] text-slate-500">(0)</span>
                </button>
              </div>

              {/* Online Friends List */}
              <div className="pt-2 space-y-2">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ONLINE FRIENDS</div>
                <div className="p-2.5 bg-[#1d1e26] rounded border border-[#2b2d39] flex items-center space-x-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0" />
                  <div className="truncate">
                    <div className="font-bold text-slate-200 truncate">Alex_Gamer#1092</div>
                    <div className="text-[10px] text-slate-400">Playing Elden Ring</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4. Help & Console Popup Menu matching Image 4 */}
        {showHelpMenu && (
          <div className="absolute left-16 bottom-16 w-48 bg-[#181920] border border-[#2e303d] rounded-lg p-2 shadow-2xl z-50 text-xs font-sans space-y-1">
            <button className="w-full text-left px-3 py-2 rounded hover:bg-[#232530] text-slate-200">
              Help Center
            </button>
            <button className="w-full text-left px-3 py-2 rounded bg-[#232530] text-white font-bold flex items-center space-x-2">
              <MessageSquare className="w-3.5 h-3.5 text-rose-400" />
              <span>Discord Community</span>
            </button>
            <button className="w-full text-left px-3 py-2 rounded hover:bg-[#232530] text-slate-200 flex items-center space-x-2 font-mono text-[11px]">
              <Terminal className="w-3.5 h-3.5" />
              <span>Console</span>
            </button>
            <button className="w-full text-left px-3 py-2 rounded hover:bg-[#232530] text-slate-200 flex items-center space-x-2 text-[11px]">
              <FileText className="w-3.5 h-3.5" />
              <span>Log File Host</span>
            </button>
            <button className="w-full text-left px-3 py-2 rounded hover:bg-[#232530] text-slate-200 flex items-center space-x-2 text-[11px]">
              <FileText className="w-3.5 h-3.5" />
              <span>Log File Client</span>
            </button>
          </div>
        )}

        {/* 5. Logout Confirmation Tooltip matching Image 5 */}
        {showLogoutTooltip && (
          <div className="absolute left-16 bottom-6 bg-rose-600 text-white font-bold text-xs px-4 py-2.5 rounded-lg shadow-xl z-50 flex items-center space-x-3">
            <span>Logged in as <strong className="font-mono">{userDisplayTag}</strong></span>
            <button
              onClick={() => {
                setShowLogoutTooltip(false);
                onLogout();
              }}
              className="bg-black/40 hover:bg-black/60 px-2.5 py-1 rounded text-xs text-white font-bold transition-all cursor-pointer"
            >
              Log Out
            </button>
            <button
              onClick={() => setShowLogoutTooltip(false)}
              className="text-white/80 hover:text-white text-[11px]"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Main Content Area Viewport */}
        <main className="flex-1 overflow-y-auto p-6 pb-20">
          {children}
        </main>
      </div>
    </div>
  );
};
