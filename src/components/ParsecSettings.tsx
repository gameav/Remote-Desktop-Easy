import React, { useState } from 'react';
import { PulseGridSettings, SettingsSubTab } from '../types';
import { 
  Settings, 
  Cpu, 
  Sliders, 
  Wifi, 
  Gamepad2, 
  Monitor, 
  CheckCircle2, 
  ShieldCheck, 
  User,
  Key,
  Lock,
  Zap,
  Flame,
  Check,
  Smartphone,
  Tablet
} from 'lucide-react';

export const ParsecSettings: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<SettingsSubTab>('client');
  const [savedMessage, setSavedMessage] = useState(false);

  const [settings, setSettings] = useState<PulseGridSettings>({
    hostingEnabled: true,
    hostResolution: '1920x1080',
    hostFps: 60,
    hostBitrateMbps: 20,
    encoderType: 'nvenc',
    virtualDisplay: true,
    audioPassthrough: true,
    decoderType: 'hardware',
    vsync: true,
    immersiveMouseMode: 'relative',
    overlayHotkey: 'Ctrl+Alt+I',
    bandwidthLimitMbps: 30,
    enhancedPen: true,
    overlay: true,
    overlayWarnings: true,
    hidCompatibility: false,
    upnpEnabled: true,
    stunServer: 'stun.pulsegrid.app:3478',
    tailscaleEnabled: true
  });

  const handleSave = () => {
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 2000);
  };

  return (
    <div className="space-y-6 text-slate-100 font-sans">
      {/* Title Header matching Image 2 */}
      <div className="flex items-end justify-between border-b border-[#2b2d38] pb-4">
        <div>
          <h1 className="text-3xl font-light text-white tracking-tight">
            Settings
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Customize your PulseGrid experience.
          </p>
        </div>
        <div className="text-[11px] font-mono text-slate-500">
          Version 150-104a - Loader V17 - Service V13
        </div>
      </div>

      {/* Sub-Nav Tabs matching Image 2 */}
      <div className="flex flex-wrap gap-2 sm:gap-6 border-b border-[#252733] pb-2 text-xs font-medium">
        {[
          { id: 'client' as SettingsSubTab, label: 'Client' },
          { id: 'host' as SettingsSubTab, label: 'Host' },
          { id: 'approved_apps' as SettingsSubTab, label: 'Approved Apps' },
          { id: 'network' as SettingsSubTab, label: 'Network' },
          { id: 'hotkeys' as SettingsSubTab, label: 'Hotkeys' },
          { id: 'gamepad' as SettingsSubTab, label: 'Gamepad' },
          { id: 'experimental' as SettingsSubTab, label: 'Experimental' },
          { id: 'account' as SettingsSubTab, label: 'Account' }
        ].map((tab) => {
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`pb-1 transition-all cursor-pointer ${
                isActive
                  ? 'text-blue-400 border-b-2 border-blue-500 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* CLIENT SETTINGS matching Image 2 */}
      {activeSubTab === 'client' && (
        <div className="space-y-6 pt-2">
          <div className="text-xs font-bold text-slate-200 tracking-wider uppercase font-mono">
            CLIENT SETTINGS
          </div>

          <div className="space-y-5 bg-[#1b1c22] border border-[#2a2c38] rounded-xl p-6 shadow-md text-xs">
            {/* Enhanced Pen / Touch */}
            <div className="flex items-center justify-between py-2 border-b border-[#262835]">
              <div className="space-y-1 max-w-lg">
                <div className="font-bold text-slate-200 flex items-center space-x-2">
                  <span>Enhanced Pen & Tablet (100% Free)</span>
                  <span className="text-[10px] bg-rose-600/20 text-rose-300 px-2 py-0.5 rounded font-mono border border-rose-500/30">
                    UNLOCKED
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Enable enhanced pen functionality while connected, such as tilt, rotation, and pressure. (All features 100% free with no paywall).
                </p>
              </div>

              <select
                value={settings.enhancedPen ? 'on' : 'off'}
                onChange={(e) => setSettings({ ...settings, enhancedPen: e.target.value === 'on' })}
                className="bg-[#121318] border border-[#2d3042] px-3 py-1.5 rounded text-slate-200 font-sans focus:outline-none focus:border-rose-500 min-w-[120px]"
              >
                <option value="on">On</option>
                <option value="off">Off.</option>
              </select>
            </div>

            {/* Overlay */}
            <div className="flex items-center justify-between py-2 border-b border-[#262835]">
              <div className="space-y-1 max-w-lg">
                <div className="font-bold text-slate-200">Overlay</div>
                <p className="text-[11px] text-slate-400">
                  Display the PulseGrid button and floating overlay menu while connected.
                </p>
              </div>

              <select
                value={settings.overlay ? 'on' : 'off'}
                onChange={(e) => setSettings({ ...settings, overlay: e.target.value === 'on' })}
                className="bg-[#121318] border border-[#2d3042] px-3 py-1.5 rounded text-slate-200 font-sans focus:outline-none focus:border-rose-500 min-w-[120px]"
              >
                <option value="on">On</option>
                <option value="off">Off</option>
              </select>
            </div>

            {/* Overlay Warnings */}
            <div className="flex items-center justify-between py-2 border-b border-[#262835]">
              <div className="space-y-1 max-w-lg">
                <div className="font-bold text-slate-200">Overlay Warnings</div>
                <p className="text-[11px] text-slate-400">
                  Display network and hardware performance warnings in the client overlay.
                </p>
              </div>

              <select
                value={settings.overlayWarnings ? 'on' : 'off'}
                onChange={(e) => setSettings({ ...settings, overlayWarnings: e.target.value === 'on' })}
                className="bg-[#121318] border border-[#2d3042] px-3 py-1.5 rounded text-slate-200 font-sans focus:outline-none focus:border-rose-500 min-w-[120px]"
              >
                <option value="on">On</option>
                <option value="off">Off</option>
              </select>
            </div>

            {/* HID Compatibility Options */}
            <div className="flex items-center justify-between py-2">
              <div className="space-y-1 max-w-lg">
                <div className="font-bold text-slate-200">HID Compatibility Options</div>
                <p className="text-[11px] text-slate-400">
                  Enable low-level raw HID input capture for specialized game controllers & flight sticks.
                </p>
              </div>

              <select
                value={settings.hidCompatibility ? 'on' : 'off'}
                onChange={(e) => setSettings({ ...settings, hidCompatibility: e.target.value === 'on' })}
                className="bg-[#121318] border border-[#2d3042] px-3 py-1.5 rounded text-slate-200 font-sans focus:outline-none focus:border-rose-500 min-w-[120px]"
              >
                <option value="off">Off</option>
                <option value="on">On</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* ACCOUNT TAB matching Image 7 */}
      {activeSubTab === 'account' && (
        <div className="space-y-6 pt-2">
          <div className="text-xs font-bold text-slate-200 tracking-wider uppercase font-mono">
            ACCOUNT INFORMATION
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Account Card Left (2 cols) */}
            <div className="md:col-span-2 bg-[#1b1c22] border border-[#2a2c38] rounded-xl p-6 space-y-6 shadow-md text-xs">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 rounded-2xl bg-[#2b2d3c] border border-slate-600 flex items-center justify-center font-black text-2xl text-slate-200">
                  dash
                </div>
                <div>
                  <div className="text-xl font-bold text-white flex items-center space-x-2">
                    <span>dashav100</span>
                    <span className="text-slate-400 font-mono text-sm">#20273089</span>
                  </div>
                  <div className="text-xs text-slate-400 font-mono mt-0.5">
                    anayvoratutor@gmail.com
                  </div>
                  <div className="mt-2 inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-bold">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>2FA IS ENABLED</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-[#262835]">
                <div className="text-xs font-bold text-white uppercase tracking-wider">BASIC SETTINGS</div>

                <div className="flex items-center justify-between py-2 border-b border-[#232532]">
                  <div>
                    <div className="font-bold text-slate-200">Profile Picture</div>
                    <div className="text-[11px] text-slate-400">A nice identifier for your profile and friends.</div>
                  </div>
                  <button className="text-blue-400 hover:text-blue-300 font-bold text-xs">Change</button>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-[#232532]">
                  <div>
                    <div className="font-bold text-slate-200">Username</div>
                    <div className="text-[11px] text-slate-400">dashav100</div>
                  </div>
                  <button className="text-blue-400 hover:text-blue-300 font-bold text-xs">Edit</button>
                </div>

                <div className="flex items-center justify-between py-2">
                  <div>
                    <div className="font-bold text-slate-200">Email</div>
                    <div className="text-[11px] text-slate-400">anayvoratutor@gmail.com</div>
                  </div>
                  <button className="text-blue-400 hover:text-blue-300 font-bold text-xs">Edit</button>
                </div>
              </div>
            </div>

            {/* Plan Info Card Right matching Image 6 & 7 */}
            <div className="bg-[#121318] border border-[#2a2c38] rounded-xl p-6 space-y-4 shadow-md text-xs flex flex-col justify-between">
              <div className="space-y-3">
                <div className="text-[10px] text-slate-400 font-mono font-bold uppercase">YOUR PULSEGRID PLAN</div>
                <div className="text-2xl font-black text-rose-400 tracking-wider">100% FREE FOREVER</div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  PulseGrid provides full 60 FPS streaming, multi-monitor support, Apple Pencil & pen pressure, and virtual gamepads completely free with no subscriptions or paywalls.
                </p>
              </div>

              <div className="p-3 bg-rose-600/10 border border-rose-500/30 rounded-lg text-rose-300 text-[11px] font-mono">
                ✓ Personal & Commercial Remote Gaming Unlocked
              </div>
            </div>
          </div>
        </div>
      )}

      {/* HOST TAB */}
      {activeSubTab === 'host' && (
        <div className="space-y-6 pt-2">
          <div className="text-xs font-bold text-slate-200 tracking-wider uppercase font-mono">
            HOST HARDWARE ENCODER SETTINGS
          </div>

          <div className="bg-[#1b1c22] border border-[#2a2c38] rounded-xl p-6 space-y-5 shadow-md text-xs">
            <div className="flex items-center justify-between py-2 border-b border-[#262835]">
              <div>
                <div className="font-bold text-slate-200">Enable Hosting</div>
                <div className="text-[11px] text-slate-400">Allow remote computers to stream this machine.</div>
              </div>
              <input
                type="checkbox"
                checked={settings.hostingEnabled}
                onChange={(e) => setSettings({ ...settings, hostingEnabled: e.target.checked })}
                className="w-4 h-4 accent-rose-600 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <div className="font-bold text-slate-200">GPU Encoder Engine</div>
                <div className="text-[11px] text-slate-400">NVIDIA NVENC H.265 / AMD AMF / Apple Metal</div>
              </div>
              <select
                value={settings.encoderType}
                onChange={(e) => setSettings({ ...settings, encoderType: e.target.value as any })}
                className="bg-[#121318] border border-[#2d3042] px-3 py-1.5 rounded text-slate-200 focus:outline-none focus:border-rose-500"
              >
                <option value="nvenc">NVENC (NVIDIA GPU)</option>
                <option value="amf">AMF (AMD Radeon)</option>
                <option value="metal">Apple Metal (M1/M2/M3)</option>
                <option value="quicksync">Intel QuickSync</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
