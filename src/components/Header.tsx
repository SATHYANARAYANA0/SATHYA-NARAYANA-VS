import React from 'react';
import {
  BarChart3,
  BrainCircuit,
  Smartphone,
  Layers,
  Users,
  Zap,
  Radio,
  Sparkles,
} from 'lucide-react';

interface HeaderProps {
  currentView: 'presenter' | 'sentiment' | 'audience' | 'manage';
  onViewChange: (view: 'presenter' | 'sentiment' | 'audience' | 'manage') => void;
  isConnected: boolean;
  audienceCount: number;
  onSimulateResponse: () => void;
  onSendReaction: (emoji: string) => void;
  isSimulating: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onViewChange,
  isConnected,
  audienceCount,
  onSimulateResponse,
  onSendReaction,
  isSimulating,
}) => {
  const quickEmojis = ['👏', '🔥', '❤️', '💡', '🚀'];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Status */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-lg tracking-tight text-slate-900">
                  Pulse<span className="text-blue-600">Cast</span>
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-emerald-500 animate-ping" />
                  LIVE
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                Real-Time Polling & Sentiment Intelligence
              </p>
            </div>
          </div>

          {/* View Mode Tabs */}
          <nav className="hidden md:flex items-center space-x-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200/80">
            <button
              id="tab-presenter"
              onClick={() => onViewChange('presenter')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                currentView === 'presenter'
                  ? 'bg-white text-blue-700 shadow-sm font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <BarChart3 className="w-4 h-4 text-blue-600" />
              <span>Presenter Stage</span>
            </button>

            <button
              id="tab-sentiment"
              onClick={() => onViewChange('sentiment')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                currentView === 'sentiment'
                  ? 'bg-white text-indigo-700 shadow-sm font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <BrainCircuit className="w-4 h-4 text-indigo-600" />
              <span>Sentiment Intelligence</span>
            </button>

            <button
              id="tab-audience"
              onClick={() => onViewChange('audience')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                currentView === 'audience'
                  ? 'bg-white text-emerald-700 shadow-sm font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Smartphone className="w-4 h-4 text-emerald-600" />
              <span>Audience View</span>
            </button>

            <button
              id="tab-manage"
              onClick={() => onViewChange('manage')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                currentView === 'manage'
                  ? 'bg-white text-slate-800 shadow-sm font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Layers className="w-4 h-4 text-slate-600" />
              <span>Manage Polls</span>
            </button>
          </nav>

          {/* Right Action Tools & Audience Counter */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Quick Live Reaction bar */}
            <div className="hidden lg:flex items-center bg-slate-50 border border-slate-200 rounded-full px-2 py-0.5 space-x-0.5">
              <span className="text-[11px] font-medium text-slate-400 pl-1 mr-1">React:</span>
              {quickEmojis.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => onSendReaction(emoji)}
                  title={`Send ${emoji} reaction`}
                  className="w-7 h-7 flex items-center justify-center text-sm rounded-full hover:bg-white hover:scale-125 transition-transform active:scale-95"
                >
                  {emoji}
                </button>
              ))}
            </div>

            {/* Audience Count badge */}
            <div
              title={isConnected ? 'Live WebSocket active' : 'Reconnecting to live server...'}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-xs font-medium text-slate-700"
            >
              <Users className="w-3.5 h-3.5 text-blue-600" />
              <span>{audienceCount}</span>
              <span className="text-slate-400 hidden sm:inline">online</span>
            </div>

            {/* Simulate Audience Vote button */}
            <button
              id="btn-simulate-audience"
              onClick={onSimulateResponse}
              disabled={isSimulating}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 active:bg-blue-200 text-blue-700 border border-blue-200 text-xs font-semibold transition-colors disabled:opacity-50 shadow-xs cursor-pointer"
              title="Inject a realistic live attendee vote and reaction"
            >
              <Zap className={`w-3.5 h-3.5 text-blue-600 ${isSimulating ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Simulate Vote</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="flex md:hidden overflow-x-auto py-2 border-t border-slate-100 space-x-1.5 text-xs no-scrollbar">
          <button
            onClick={() => onViewChange('presenter')}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap ${
              currentView === 'presenter' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'
            }`}
          >
            Stage Charts
          </button>
          <button
            onClick={() => onViewChange('sentiment')}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap ${
              currentView === 'sentiment' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'
            }`}
          >
            Sentiment
          </button>
          <button
            onClick={() => onViewChange('audience')}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap ${
              currentView === 'audience' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700'
            }`}
          >
            Audience View
          </button>
          <button
            onClick={() => onViewChange('manage')}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap ${
              currentView === 'manage' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-700'
            }`}
          >
            Polls
          </button>
        </div>
      </div>
    </header>
  );
};
