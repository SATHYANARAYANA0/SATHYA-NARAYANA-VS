import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  Lock,
  Unlock,
  RotateCcw,
  CheckCircle2,
  Radio,
  BarChart2,
  Star,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import { Poll, PollType } from '../types';

interface PollManagementProps {
  polls: Poll[];
  activePollId: string;
  onSelectPoll: (pollId: string) => void;
  onCreatePoll: (pollData: {
    title: string;
    question: string;
    description: string;
    type: PollType;
    options?: string[];
  }) => Promise<void>;
  onToggleLock: (pollId: string) => void;
  onResetPoll: (pollId: string) => void;
}

export const PollManagementModal: React.FC<PollManagementProps> = ({
  polls,
  activePollId,
  onSelectPoll,
  onCreatePoll,
  onToggleLock,
  onResetPoll,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newQuestion, setNewQuestion] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newType, setNewType] = useState<PollType>('multiple-choice');
  const [options, setOptions] = useState<string[]>(['Option A', 'Option B', 'Option C']);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddOption = () => {
    setOptions([...options, `Option ${String.fromCharCode(65 + options.length)}`]);
  };

  const handleRemoveOption = (idx: number) => {
    if (options.length <= 2) return;
    setOptions(options.filter((_, i) => i !== idx));
  };

  const handleOptionChange = (idx: number, val: string) => {
    const updated = [...options];
    updated[idx] = val;
    setOptions(updated);
  };

  const handleSubmitNewPoll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newQuestion.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onCreatePoll({
        title: newTitle.trim(),
        question: newQuestion.trim(),
        description: newDescription.trim(),
        type: newType,
        options: newType === 'multiple-choice' || newType === 'word-cloud' ? options.filter((o) => o.trim().length > 0) : undefined,
      });

      // Reset form
      setNewTitle('');
      setNewQuestion('');
      setNewDescription('');
      setIsCreating(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Poll & Session Management
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Switch the active poll being broadcasted to attendees or design a new poll session.
          </p>
        </div>

        <button
          id="btn-create-poll-toggle"
          onClick={() => setIsCreating(!isCreating)}
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{isCreating ? 'Cancel Creation' : 'Create New Poll'}</span>
        </button>
      </div>

      {/* Create New Poll Form Drawer/Card */}
      {isCreating && (
        <form
          onSubmit={handleSubmitNewPoll}
          className="bg-white p-6 sm:p-7 rounded-3xl border-2 border-blue-100 shadow-md space-y-5 transition-all"
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <Plus className="w-5 h-5 text-blue-600" />
              <span>Create New Live Audience Poll</span>
            </h3>
            <span className="text-xs text-slate-500">Broadcasts to all attendees instantly</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Session Title / Category
              </label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Keynote Feedback, Architecture Choice"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Poll Type
              </label>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value as PollType)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
              >
                <option value="multiple-choice">Multiple Choice (Bar/Donut Charts)</option>
                <option value="rating">Rating Scale (1 to 5 Stars & Averages)</option>
                <option value="open-ended">Open-Ended (AI Sentiment & Emotion Clusters)</option>
                <option value="word-cloud">Word Cloud / Rapid Pulse</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Audience Question
            </label>
            <input
              type="text"
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              placeholder="e.g. Which technical constraint is most critical for your squad?"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Description / Instructions (Optional)
            </label>
            <input
              type="text"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="e.g. Select the single most impactful initiative."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          {/* Options input for Multiple Choice and Word Cloud */}
          {(newType === 'multiple-choice' || newType === 'word-cloud') && (
            <div className="space-y-3 pt-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Options
              </label>
              <div className="space-y-2">
                {options.map((opt, idx) => (
                  <div key={idx} className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-slate-400 w-5 text-center">
                      {idx + 1}.
                    </span>
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => handleOptionChange(idx, e.target.value)}
                      placeholder={`Option ${idx + 1}`}
                      className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      required
                    />
                    {options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveOption(idx)}
                        className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={handleAddOption}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center space-x-1 pt-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add another option</span>
              </button>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs sm:text-sm font-semibold hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              id="btn-submit-create-poll"
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Creating...' : 'Launch Poll'}
            </button>
          </div>
        </form>
      )}

      {/* Polls List */}
      <div className="space-y-4">
        {polls.map((poll) => {
          const isActive = poll.id === activePollId;

          const typeIcon =
            poll.type === 'multiple-choice' ? (
              <BarChart2 className="w-4 h-4 text-blue-600" />
            ) : poll.type === 'rating' ? (
              <Star className="w-4 h-4 text-amber-500" />
            ) : poll.type === 'open-ended' ? (
              <Sparkles className="w-4 h-4 text-indigo-600" />
            ) : (
              <MessageSquare className="w-4 h-4 text-pink-600" />
            );

          return (
            <div
              key={poll.id}
              className={`p-5 rounded-3xl border transition-all bg-white flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs ${
                isActive
                  ? 'border-blue-500 ring-2 ring-blue-500/20'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="space-y-1.5 max-w-2xl">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 rounded-lg bg-slate-100">{typeIcon}</div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    {poll.title}
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                    {poll.type}
                  </span>
                  {isActive && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <span className="w-1.5 h-1.5 mr-1 rounded-full bg-emerald-500 animate-pulse" />
                      Broadcasting Now
                    </span>
                  )}
                  {poll.isLocked && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                      <Lock className="w-3 h-3 mr-1" /> Locked
                    </span>
                  )}
                </div>

                <h4 className="text-base font-bold text-slate-900 leading-snug">
                  {poll.question}
                </h4>

                <div className="flex items-center space-x-4 text-xs text-slate-500">
                  <span>{poll.totalVotes} total responses</span>
                  <span>•</span>
                  <span>
                    Created {new Date(poll.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Action Controls */}
              <div className="flex items-center space-x-2 shrink-0">
                {!isActive && (
                  <button
                    id={`btn-set-active-${poll.id}`}
                    onClick={() => onSelectPoll(poll.id)}
                    className="px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-semibold transition-colors"
                  >
                    Set as Active
                  </button>
                )}

                <button
                  id={`btn-toggle-lock-${poll.id}`}
                  onClick={() => onToggleLock(poll.id)}
                  className={`p-2 rounded-xl border text-xs transition-colors ${
                    poll.isLocked
                      ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                  title={poll.isLocked ? 'Unlock Voting' : 'Lock Voting'}
                >
                  {poll.isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                </button>

                <button
                  id={`btn-reset-votes-${poll.id}`}
                  onClick={() => {
                    if (window.confirm('Reset all responses for this poll?')) {
                      onResetPoll(poll.id);
                    }
                  }}
                  className="p-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  title="Reset Votes"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
