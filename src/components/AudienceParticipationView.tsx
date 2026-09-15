import React, { useState } from 'react';
import {
  CheckCircle2,
  Lock,
  Star,
  Send,
  Sparkles,
  Smartphone,
  Vote,
  Radio,
  ThumbsUp,
} from 'lucide-react';
import { Poll } from '../types';

interface AudienceParticipationViewProps {
  poll: Poll;
  onVoteOption: (pollId: string, optionId: string) => void;
  onVoteRating: (pollId: string, score: number) => void;
  onSubmitFeedback: (pollId: string, text: string, name?: string) => Promise<void>;
  onSendReaction: (emoji: string) => void;
  userVotedPolls: Set<string>;
}

export const AudienceParticipationView: React.FC<AudienceParticipationViewProps> = ({
  poll,
  onVoteOption,
  onVoteRating,
  onSubmitFeedback,
  onSendReaction,
  userVotedPolls,
}) => {
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [participantName, setParticipantName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmittedFeedback, setHasSubmittedFeedback] = useState(false);
  const [customWord, setCustomWord] = useState('');

  const hasVoted = userVotedPolls.has(poll.id);

  const handleOptionClick = (optId: string) => {
    if (poll.isLocked || hasVoted) return;
    setSelectedOptionId(optId);
    onVoteOption(poll.id, optId);
  };

  const handleRatingClick = (score: number) => {
    if (poll.isLocked || hasVoted) return;
    setSelectedRating(score);
    onVoteRating(poll.id, score);
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackText.trim() || isSubmitting || poll.isLocked) return;

    setIsSubmitting(true);
    try {
      await onSubmitFeedback(poll.id, feedbackText, participantName);
      setHasSubmittedFeedback(true);
      setFeedbackText('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCustomWordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customWord.trim() || poll.isLocked || hasVoted) return;
    // Find existing option matching customWord or vote
    const match = poll.options?.find(
      (o) => o.text.toLowerCase() === customWord.trim().toLowerCase()
    );
    if (match) {
      onVoteOption(poll.id, match.id);
    } else if (poll.options && poll.options.length > 0) {
      // Pick or create
      onVoteOption(poll.id, poll.options[0].id);
    }
    setCustomWord('');
  };

  const reactionEmojis = ['👏', '🔥', '❤️', '💡', '🚀', '🎉'];

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* Mobile Device Mockup Frame Header */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-xl border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              Live Session Active
            </span>
          </div>
          <div className="text-xs text-slate-400 font-mono">
            ID: #{poll.id.slice(-4).toUpperCase()}
          </div>
        </div>

        <div className="space-y-1">
          <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
            {poll.title}
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-snug">
            {poll.question}
          </h2>
          {poll.description && (
            <p className="text-xs sm:text-sm text-slate-300">
              {poll.description}
            </p>
          )}
        </div>

        {poll.isLocked && (
          <div className="flex items-center space-x-2 p-3 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs">
            <Lock className="w-4 h-4 shrink-0" />
            <span>Voting is currently locked by the presenter.</span>
          </div>
        )}
      </div>

      {/* Main Response Area */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-6">
        {/* MULTIPLE CHOICE / WORD CLOUD */}
        {(poll.type === 'multiple-choice' || poll.type === 'word-cloud') && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <span>Choose your answer</span>
              {hasVoted && (
                <span className="text-emerald-600 flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Vote Recorded</span>
                </span>
              )}
            </div>

            <div className="space-y-2.5">
              {(poll.options || []).map((opt) => {
                const isSelected = selectedOptionId === opt.id;
                return (
                  <button
                    key={opt.id}
                    id={`opt-btn-${opt.id}`}
                    onClick={() => handleOptionClick(opt.id)}
                    disabled={poll.isLocked || hasVoted}
                    className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/70 text-blue-900 shadow-xs'
                        : hasVoted
                        ? 'border-slate-200 bg-slate-50 text-slate-600 opacity-70 cursor-not-allowed'
                        : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50/80 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                          isSelected
                            ? 'border-blue-600 bg-blue-600 text-white'
                            : 'border-slate-300'
                        }`}
                      >
                        {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                      <span className="font-semibold text-sm sm:text-base">
                        {opt.text}
                      </span>
                    </div>

                    {hasVoted && (
                      <span className="text-xs font-bold text-slate-500">
                        {poll.totalVotes > 0 ? Math.round((opt.votes / poll.totalVotes) * 100) : 0}%
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {poll.type === 'word-cloud' && !hasVoted && (
              <form onSubmit={handleCustomWordSubmit} className="pt-3 flex gap-2">
                <input
                  type="text"
                  value={customWord}
                  onChange={(e) => setCustomWord(e.target.value)}
                  placeholder="Or enter your custom word..."
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-xs transition-colors"
                >
                  Submit
                </button>
              </form>
            )}
          </div>
        )}

        {/* RATING SCALE */}
        {poll.type === 'rating' && (
          <div className="space-y-4 text-center">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Tap a star rating to vote
            </span>

            <div className="flex items-center justify-center space-x-2 sm:space-x-3 py-3">
              {[1, 2, 3, 4, 5].map((score) => {
                const isSelected = selectedRating === score;
                return (
                  <button
                    key={score}
                    id={`rating-star-${score}`}
                    onClick={() => handleRatingClick(score)}
                    disabled={poll.isLocked || hasVoted}
                    className={`p-3 sm:p-4 rounded-2xl border-2 transition-all flex flex-col items-center space-y-1 cursor-pointer ${
                      isSelected
                        ? 'border-amber-500 bg-amber-50 scale-110 shadow-md'
                        : hasVoted
                        ? 'border-slate-200 bg-slate-50 opacity-60 cursor-not-allowed'
                        : 'border-slate-200 hover:border-amber-400 hover:bg-amber-50/50'
                    }`}
                  >
                    <Star
                      className={`w-7 h-7 sm:w-8 sm:h-8 transition-colors ${
                        isSelected || (selectedRating && score <= selectedRating)
                          ? 'text-amber-500 fill-amber-500'
                          : 'text-slate-300'
                      }`}
                    />
                    <span className="text-xs font-bold text-slate-700">{score}</span>
                  </button>
                );
              })}
            </div>

            {hasVoted && (
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200 flex items-center justify-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Thank you! Your rating has been cast in real-time.</span>
              </div>
            )}
          </div>
        )}

        {/* OPEN-ENDED FEEDBACK */}
        {poll.type === 'open-ended' && (
          <div className="space-y-4">
            {hasSubmittedFeedback ? (
              <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-sm">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-emerald-950 text-sm">
                  Feedback Received & Sent to AI Engine!
                </h4>
                <p className="text-xs text-emerald-700">
                  Your thoughts are now being processed by Gemini for real-time sentiment clustering.
                </p>
                <button
                  onClick={() => setHasSubmittedFeedback(false)}
                  className="text-xs font-semibold text-emerald-800 underline hover:text-emerald-900 mt-2 block mx-auto"
                >
                  Submit another comment
                </button>
              </div>
            ) : (
              <form onSubmit={handleFeedbackSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                    Your Response
                  </label>
                  <textarea
                    id="input-feedback-text"
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    placeholder="Share your open perspectives, suggestions, or concerns..."
                    rows={4}
                    disabled={poll.isLocked || isSubmitting}
                    className="w-full p-3.5 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">
                    Your Name or Role (Optional)
                  </label>
                  <input
                    type="text"
                    value={participantName}
                    onChange={(e) => setParticipantName(e.target.value)}
                    placeholder="e.g. Maya (Frontend Dev) or Anonymous"
                    disabled={poll.isLocked || isSubmitting}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <button
                  id="btn-submit-feedback"
                  type="submit"
                  disabled={poll.isLocked || isSubmitting || !feedbackText.trim()}
                  className="w-full flex items-center justify-center space-x-2 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSubmitting ? 'Sending to Stage...' : 'Submit Feedback'}</span>
                </button>
              </form>
            )}
          </div>
        )}

        {/* Live Audience Reaction Pad */}
        <div className="pt-4 border-t border-slate-100">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block text-center mb-2.5">
            React to the Presenter
          </span>
          <div className="flex items-center justify-center gap-2 sm:gap-3">
            {reactionEmojis.map((emoji) => (
              <button
                key={emoji}
                onClick={() => onSendReaction(emoji)}
                className="w-11 h-11 rounded-2xl bg-slate-50 hover:bg-slate-100 active:scale-90 border border-slate-200 text-xl flex items-center justify-center transition-all shadow-xs cursor-pointer"
                title={`Send ${emoji} reaction`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
