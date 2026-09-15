import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Poll, LiveReaction, AudienceResponse, SentimentAnalysis, PollType } from './types';
import { Header } from './components/Header';
import { PresenterDashboard } from './components/PresenterDashboard';
import { SentimentDashboard } from './components/SentimentDashboard';
import { AudienceParticipationView } from './components/AudienceParticipationView';
import { PollManagementModal } from './components/PollManagementModal';
import { LiveReactionsOverlay } from './components/LiveReactionsOverlay';
import { Radio, AlertCircle, RefreshCw } from 'lucide-react';

export default function App() {
  const [currentView, setCurrentView] = useState<'presenter' | 'sentiment' | 'audience' | 'manage'>('presenter');
  const [polls, setPolls] = useState<Poll[]>([]);
  const [activePollId, setActivePollId] = useState<string>('poll-1');
  const [audienceCount, setAudienceCount] = useState<number>(1);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [reactions, setReactions] = useState<LiveReaction[]>([]);
  const [userVotedPolls, setUserVotedPolls] = useState<Set<string>>(new Set());
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [isAnalyzingSentiment, setIsAnalyzingSentiment] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<any>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 2800);
  };

  // WebSocket Connection Lifecycle
  const connectWebSocket = useCallback(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          switch (msg.type) {
            case 'INIT_STATE': {
              setPolls(msg.payload.polls || []);
              setActivePollId(msg.payload.activePollId || 'poll-1');
              setAudienceCount(msg.payload.audienceCount || 1);
              break;
            }

            case 'POLL_UPDATED': {
              const updated = msg.payload.poll as Poll;
              setPolls((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
              break;
            }

            case 'ACTIVE_POLL_CHANGED': {
              setActivePollId(msg.payload.activePollId);
              setPolls((prev) =>
                prev.map((p) => ({
                  ...p,
                  isActive: p.id === msg.payload.activePollId,
                }))
              );
              showToast('Active poll switched by presenter');
              break;
            }

            case 'AUDIENCE_COUNT': {
              setAudienceCount(msg.payload.count);
              break;
            }

            case 'LIVE_REACTION': {
              const rx = msg.payload as LiveReaction;
              setReactions((prev) => [...prev.slice(-20), rx]);
              // Auto prune reaction after animation duration
              setTimeout(() => {
                setReactions((prev) => prev.filter((r) => r.id !== rx.id));
              }, 3300);
              break;
            }

            case 'NEW_RESPONSE': {
              const { pollId, response } = msg.payload;
              setPolls((prev) =>
                prev.map((p) => {
                  if (p.id === pollId) {
                    const existing = p.responses || [];
                    const alreadyExists = existing.some((r) => r.id === response.id);
                    return {
                      ...p,
                      totalVotes: p.totalVotes + (alreadyExists ? 0 : 1),
                      responses: alreadyExists ? existing : [response, ...existing],
                    };
                  }
                  return p;
                })
              );
              showToast(`New response from ${response.participantName || 'attendee'}`);
              break;
            }

            case 'SENTIMENT_UPDATED': {
              const { pollId, sentimentAnalysis } = msg.payload;
              setPolls((prev) =>
                prev.map((p) => (p.id === pollId ? { ...p, sentimentAnalysis } : p))
              );
              break;
            }
          }
        } catch (err) {
          console.error('Error handling WS event:', err);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        // Attempt reconnect after 2.5s
        reconnectTimeoutRef.current = setTimeout(connectWebSocket, 2500);
      };

      ws.onerror = () => {
        setIsConnected(false);
      };
    } catch (err) {
      console.error('WebSocket connection error:', err);
      reconnectTimeoutRef.current = setTimeout(connectWebSocket, 2500);
    }
  }, []);

  useEffect(() => {
    connectWebSocket();
    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, [connectWebSocket]);

  // Initial HTTP fallback sync
  useEffect(() => {
    fetch('/api/polls')
      .then((res) => res.json())
      .then((data) => {
        if (data.polls) setPolls(data.polls);
        if (data.activePollId) setActivePollId(data.activePollId);
      })
      .catch((err) => console.log('Initial poll fetch notice:', err));
  }, []);

  // Actions
  const handleVoteOption = (pollId: string, optionId: string) => {
    // Record locally
    setUserVotedPolls((prev) => new Set(prev).add(pollId));

    // Send over WS
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'VOTE',
          payload: { pollId, optionId },
        })
      );
    } else {
      // Fallback to HTTP
      fetch(`/api/polls/${pollId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ optionId }),
      }).catch(console.error);
    }

    // Trigger celebratory reaction
    handleSendReaction('🎉');
    showToast('Your vote has been counted!');
  };

  const handleVoteRating = (pollId: string, ratingScore: number) => {
    setUserVotedPolls((prev) => new Set(prev).add(pollId));

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'VOTE',
          payload: { pollId, ratingScore },
        })
      );
    } else {
      fetch(`/api/polls/${pollId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ratingScore }),
      }).catch(console.error);
    }

    handleSendReaction('⭐');
    showToast(`Rated ${ratingScore} Stars. Thank you!`);
  };

  const handleSubmitFeedback = async (pollId: string, text: string, participantName?: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'FEEDBACK',
          payload: { pollId, text, participantName },
        })
      );
    } else {
      await fetch(`/api/polls/${pollId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, participantName }),
      });
    }
    showToast('Response submitted to AI sentiment engine!');
  };

  const handleSendReaction = (emoji: string) => {
    const rx: LiveReaction = {
      id: 'local-' + Date.now(),
      emoji,
      x: Math.random() * 80 + 10,
      timestamp: Date.now(),
    };
    setReactions((prev) => [...prev.slice(-20), rx]);
    setTimeout(() => {
      setReactions((prev) => prev.filter((r) => r.id !== rx.id));
    }, 3300);

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'REACTION',
          payload: { emoji, x: rx.x },
        })
      );
    }
  };

  const handleSelectPoll = (pollId: string) => {
    setActivePollId(pollId);
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'SET_ACTIVE_POLL',
          payload: { pollId },
        })
      );
    } else {
      fetch('/api/polls/active', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pollId }),
      }).catch(console.error);
    }
  };

  const handleToggleLock = (pollId: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'TOGGLE_LOCK',
          payload: { pollId },
        })
      );
    }
  };

  const handleResetPoll = (pollId: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'RESET_POLL',
          payload: { pollId },
        })
      );
    }
    showToast('Poll responses cleared');
  };

  const handleCreatePoll = async (pollData: {
    title: string;
    question: string;
    description: string;
    type: PollType;
    options?: string[];
  }) => {
    const res = await fetch('/api/polls', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pollData),
    });
    const created = await res.json();
    setActivePollId(created.id);
    setCurrentView('presenter');
    showToast(`Poll "${created.title}" launched live!`);
  };

  const handleSimulateResponse = async () => {
    setIsSimulating(true);
    try {
      await fetch('/api/simulate-response', { method: 'POST' });
      showToast('Simulated audience vote registered');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleRefreshSentiment = async (pollId: string) => {
    setIsAnalyzingSentiment(true);
    try {
      const res = await fetch(`/api/polls/${pollId}/analyze-sentiment`, { method: 'POST' });
      const data = await res.json();
      if (data.sentimentAnalysis) {
        setPolls((prev) =>
          prev.map((p) => (p.id === pollId ? { ...p, sentimentAnalysis: data.sentimentAnalysis } : p))
        );
      }
      showToast('Gemini AI sentiment analysis refreshed');
    } catch (err) {
      console.error(err);
    } finally {
      setIsAnalyzingSentiment(false);
    }
  };

  const activePoll = polls.find((p) => p.id === activePollId) || polls[0];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-blue-100 selection:text-blue-900">
      {/* Real-time Floating Reactions Canvas */}
      <LiveReactionsOverlay reactions={reactions} />

      {/* Global Header */}
      <Header
        currentView={currentView}
        onViewChange={setCurrentView}
        isConnected={isConnected}
        audienceCount={audienceCount}
        onSimulateResponse={handleSimulateResponse}
        onSendReaction={handleSendReaction}
        isSimulating={isSimulating}
      />

      {/* Main Content View */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activePoll ? (
          <>
            {currentView === 'presenter' && (
              <PresenterDashboard
                poll={activePoll}
                allPolls={polls}
                onSelectPoll={handleSelectPoll}
                onToggleLock={handleToggleLock}
                onResetPoll={handleResetPoll}
                onOpenSentimentView={() => setCurrentView('sentiment')}
              />
            )}

            {currentView === 'sentiment' && (
              <SentimentDashboard
                poll={activePoll}
                onRefreshSentiment={handleRefreshSentiment}
                isAnalyzing={isAnalyzingSentiment}
              />
            )}

            {currentView === 'audience' && (
              <AudienceParticipationView
                poll={activePoll}
                onVoteOption={handleVoteOption}
                onVoteRating={handleVoteRating}
                onSubmitFeedback={handleSubmitFeedback}
                onSendReaction={handleSendReaction}
                userVotedPolls={userVotedPolls}
              />
            )}

            {currentView === 'manage' && (
              <PollManagementModal
                polls={polls}
                activePollId={activePollId}
                onSelectPoll={handleSelectPoll}
                onCreatePoll={handleCreatePoll}
                onToggleLock={handleToggleLock}
                onResetPoll={handleResetPoll}
              />
            )}
          </>
        ) : (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 shadow-xs">
            <Radio className="w-8 h-8 text-blue-600 animate-pulse mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-800">Connecting to Poll Server...</h3>
            <p className="text-xs text-slate-500 mt-1">
              Establishing live streaming WebSocket channel on port 3000
            </p>
          </div>
        )}
      </main>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-800 text-xs sm:text-sm font-medium flex items-center space-x-2.5 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
