import React, { useState } from 'react';
import { ArcadeLobby } from '../types';
import { 
  Gamepad2, 
  Users, 
  Play, 
  Plus, 
  Sparkles, 
  Flame, 
  Trophy, 
  Search,
  CheckCircle2,
  Lock,
  Globe
} from 'lucide-react';

interface ParsecArcadeProps {
  onJoinLobby: (lobby: ArcadeLobby) => void;
}

export const ParsecArcade: React.FC<ParsecArcadeProps> = ({ onJoinLobby }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [showHostModal, setShowHostModal] = useState(false);

  const sampleLobbies: ArcadeLobby[] = [
    {
      id: 'arcade-1',
      title: 'Tekken 8 - Casual 1v1 King of the Hill',
      game: 'Tekken 8',
      hostUser: 'ProGamerX (NVENC RTX 4090)',
      playersCount: 2,
      maxPlayers: 4,
      pingMs: 11,
      tags: ['Fighting', 'Controller Required', '60 FPS'],
      coverImage: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80',
      hasControllersAvailable: true,
      requiredController: 'Xbox or PS5 Gamepad'
    },
    {
      id: 'arcade-2',
      title: 'Street Fighter 6 - Endless Local Lobby',
      game: 'Street Fighter 6',
      hostUser: 'EvoChallenger',
      playersCount: 1,
      maxPlayers: 2,
      pingMs: 14,
      tags: ['Fighting', 'Arcade Stick Supported'],
      coverImage: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=600&q=80',
      hasControllersAvailable: true,
      requiredController: 'Any Controller'
    },
    {
      id: 'arcade-3',
      title: 'Overcooked! 2 - 4 Player Kitchen Chaos',
      game: 'Overcooked! 2',
      hostUser: 'ChefMaster',
      playersCount: 3,
      maxPlayers: 4,
      pingMs: 18,
      tags: ['Co-Op', 'Casual', '4-Player'],
      coverImage: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=600&q=80',
      hasControllersAvailable: true,
      requiredController: 'Keyboard or Gamepad'
    },
    {
      id: 'arcade-4',
      title: 'It Takes Two - Full Playthrough',
      game: 'It Takes Two',
      hostUser: 'CoOpGamer99',
      playersCount: 1,
      maxPlayers: 2,
      pingMs: 16,
      tags: ['Co-Op', 'Story'],
      coverImage: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=600&q=80',
      hasControllersAvailable: true,
      requiredController: 'Gamepad'
    }
  ];

  const filteredLobbies = sampleLobbies.filter(l => {
    const matchesSearch = l.title.toLowerCase().includes(searchQuery.toLowerCase()) || l.game.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTag = selectedTag === 'all' || l.tags.some(t => t.toLowerCase() === selectedTag.toLowerCase());
    return matchesSearch && matchesTag;
  });

  return (
    <div className="space-y-6 text-slate-100">
      {/* Arcade Header Banner */}
      <div className="bg-[#131622] border border-[#232738] rounded-xl p-6 shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-rose-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-wrap items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center space-x-2 text-rose-500 font-bold text-xs uppercase tracking-wider mb-1">
              <Gamepad2 className="w-4 h-4" />
              <span>Parsec Arcade & Peer-to-Peer Co-Op</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Local Multiplayer, Anywhere in the World
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Play couch co-op games with friends or public peers as if you were sitting right next to them on the same screen with zero latency controller passthrough.
            </p>
          </div>

          <button
            onClick={() => setShowHostModal(true)}
            className="flex items-center space-x-2 px-5 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-all shadow-md active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>HOST AN ARCADE ROOM</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-[#131622] border border-[#232738] rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-2 w-full sm:w-80 bg-[#0b0c13] border border-[#2e334a] px-3 py-1.5 rounded-lg">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search game lobbies (e.g. Tekken, Fighting, Co-Op)..."
            className="bg-transparent text-xs text-slate-200 focus:outline-none w-full"
          />
        </div>

        <div className="flex items-center space-x-2">
          {['all', 'fighting', 'co-op', 'casual'].map(tag => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                selectedTag === tag ? 'bg-rose-600 text-white' : 'bg-[#0b0c13] text-slate-400 hover:text-slate-200'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Arcade Lobbies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredLobbies.map((lobby) => (
          <div
            key={lobby.id}
            className="bg-[#131622] border border-[#232738] hover:border-rose-500/50 rounded-xl overflow-hidden shadow-md flex flex-col sm:flex-row transition-all group"
          >
            {/* Game Thumbnail */}
            <div className="sm:w-44 h-36 sm:h-auto relative overflow-hidden bg-slate-900 shrink-0">
              <img
                src={lobby.coverImage}
                alt={lobby.game}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/70 text-rose-400 font-mono text-[10px] font-bold border border-rose-500/30">
                {lobby.game}
              </div>
            </div>

            {/* Lobby Info */}
            <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-bold text-sm text-white group-hover:text-rose-400 transition-colors">
                    {lobby.title}
                  </h3>
                  <span className="text-xs font-mono font-bold text-emerald-400">
                    {lobby.pingMs} ms
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Host: <span className="text-slate-200 font-medium">{lobby.hostUser}</span>
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {lobby.tags.map(t => (
                    <span key={t} className="px-2 py-0.5 rounded bg-[#1a1d2e] text-[10px] text-slate-300 border border-[#2c3148]">
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              {/* Lobby Footer */}
              <div className="pt-2 border-t border-[#1e2233] flex items-center justify-between">
                <div className="flex items-center space-x-2 text-xs text-slate-400">
                  <Users className="w-3.5 h-3.5 text-blue-400" />
                  <span>{lobby.playersCount}/{lobby.maxPlayers} Slots</span>
                </div>

                <button
                  onClick={() => onJoinLobby(lobby)}
                  className="flex items-center space-x-1.5 px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-all shadow-md active:scale-95 cursor-pointer"
                >
                  <Gamepad2 className="w-3.5 h-3.5" />
                  <span>JOIN ARCADE</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Host Room Modal Simulation */}
      {showHostModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#131622] border border-[#2d3248] rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-rose-400 font-bold text-sm">
                <Gamepad2 className="w-5 h-5" />
                <span>Host a Parsec Arcade Lobby</span>
              </div>
              <button
                onClick={() => setShowHostModal(false)}
                className="text-slate-400 hover:text-white text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 font-semibold block mb-1">Game Title</label>
                <input
                  type="text"
                  defaultValue="Tekken 8 / Street Fighter 6"
                  className="w-full bg-[#0b0c13] border border-[#2b2f45] px-3 py-2 rounded-lg text-slate-200 font-medium focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="text-slate-400 font-semibold block mb-1">Max Guest Players</label>
                <select className="w-full bg-[#0b0c13] border border-[#2b2f45] px-3 py-2 rounded-lg text-slate-200 font-medium focus:outline-none focus:border-rose-500">
                  <option value={2}>2 Players (1v1)</option>
                  <option value={4}>4 Players (Party / Co-Op)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 font-semibold block mb-1">Controller Passthrough</label>
                <div className="p-3 bg-[#0b0c13] rounded-lg border border-[#2b2f45] text-[11px] text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 inline mr-1.5" />
                  Virtual XInput Gamepad Driver active. Guests can plug in Xbox, PS5, or Switch controllers.
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setShowHostModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowHostModal(false);
                  onJoinLobby(sampleLobbies[0]);
                }}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-lg shadow-md"
              >
                START HOSTING
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
