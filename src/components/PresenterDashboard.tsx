import React, { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import {
  BarChart3,
  PieChart as PieIcon,
  Lock,
  Unlock,
  RotateCcw,
  Download,
  Share2,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Star,
  MessageSquare,
  Sparkles,
  ArrowUpRight,
  CheckCircle2,
} from 'lucide-react';
import { Poll } from '../types';
import { calculateAverageRating, exportPollToCSV, exportPollToJSON, CHART_PALETTE } from '../lib/chartUtils';

interface PresenterDashboardProps {
  poll: Poll;
  allPolls: Poll[];
  onSelectPoll: (pollId: string) => void;
  onToggleLock: (pollId: string) => void;
  onResetPoll: (pollId: string) => void;
  onOpenSentimentView: () => void;
}

export const PresenterDashboard: React.FC<PresenterDashboardProps> = ({
  poll,
  allPolls,
  onSelectPoll,
  onToggleLock,
  onResetPoll,
  onOpenSentimentView,
}) => {
  const [chartMode, setChartMode] = useState<'bar' | 'donut'>('bar');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const currentIndex = allPolls.findIndex((p) => p.id === poll.id);
  const prevPoll = currentIndex > 0 ? allPolls[currentIndex - 1] : null;
  const nextPoll = currentIndex < allPolls.length - 1 ? allPolls[currentIndex + 1] : null;

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  // Prepare chart data for multiple-choice & word-cloud
  const optionsData = (poll.options || []).map((opt, idx) => {
    const pct = poll.totalVotes > 0 ? Math.round((opt.votes / poll.totalVotes) * 100) : 0;
    return {
      name: opt.text,
      votes: opt.votes,
      percentage: pct,
      color: opt.color || CHART_PALETTE[idx % CHART_PALETTE.length],
    };
  });

  // Prepare chart data for ratings
  const ratingsData = (poll.ratings || []).map((r) => {
    const pct = poll.totalVotes > 0 ? Math.round((r.count / poll.totalVotes) * 100) : 0;
    return {
      score: `${r.score} ★`,
      label: r.label,
      count: r.count,
      percentage: pct,
    };
  });

  const ratingMetrics = calculateAverageRating(poll.ratings);

  return (
    <div className="space-y-6">
      {/* Top Banner: Navigation, Presenter Tools & Audience Connect Bar */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Poll Navigator */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                id="btn-prev-poll"
                onClick={() => prevPoll && onSelectPoll(prevPoll.id)}
                disabled={!prevPoll}
                className="p-1.5 rounded-lg hover:bg-white text-slate-700 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                title="Previous Poll"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-semibold px-2 text-slate-600">
                Poll {currentIndex + 1} of {allPolls.length}
              </span>
              <button
                id="btn-next-poll"
                onClick={() => nextPoll && onSelectPoll(nextPoll.id)}
                disabled={!nextPoll}
                className="p-1.5 rounded-lg hover:bg-white text-slate-700 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                title="Next Poll"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-xs uppercase font-bold tracking-wider px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                {poll.type.replace('-', ' ')}
              </span>
              {poll.isLocked ? (
                <span className="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
                  <Lock className="w-3 h-3 mr-1" /> Locked
                </span>
              ) : (
                <span className="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
                  Voting Open
                </span>
              )}
            </div>
          </div>

          {/* Quick Audience Join info & Action buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="hidden sm:flex items-center space-x-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs text-slate-600">
              <span className="font-semibold text-slate-800">Audience Code:</span>
              <code className="bg-slate-200/80 px-1.5 py-0.5 rounded font-mono font-bold text-slate-900">
                #LIVE-{poll.id.slice(-4).toUpperCase()}
              </code>
            </div>

            <button
              id="btn-copy-join-link"
              onClick={handleCopyLink}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium shadow-xs transition-colors"
            >
              {copySuccess ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{copySuccess ? 'Link Copied!' : 'Share'}</span>
            </button>

            <button
              id="btn-toggle-lock"
              onClick={() => onToggleLock(poll.id)}
              className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium shadow-xs transition-colors ${
                poll.isLocked
                  ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-600'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
              }`}
            >
              {poll.isLocked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
              <span>{poll.isLocked ? 'Unlock Votes' : 'Lock Poll'}</span>
            </button>

            <button
              id="btn-reset-votes"
              onClick={() => {
                if (window.confirm('Are you sure you want to reset all responses for this poll?')) {
                  onResetPoll(poll.id);
                }
              }}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 text-slate-700 text-xs font-medium shadow-xs transition-colors"
              title="Reset Votes"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>

            <div className="relative group">
              <button
                id="btn-export-data"
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium shadow-xs transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export</span>
              </button>
              <div className="hidden group-hover:flex flex-col absolute right-0 mt-1 w-32 bg-white border border-slate-200 rounded-xl shadow-lg p-1 z-20">
                <button
                  onClick={() => exportPollToCSV(poll)}
                  className="px-3 py-1.5 text-left text-xs hover:bg-slate-100 rounded-lg text-slate-700 font-medium"
                >
                  Export as CSV
                </button>
                <button
                  onClick={() => exportPollToJSON(poll)}
                  className="px-3 py-1.5 text-left text-xs hover:bg-slate-100 rounded-lg text-slate-700 font-medium"
                >
                  Export as JSON
                </button>
              </div>
            </div>

            <button
              id="btn-fullscreen-toggle"
              onClick={toggleFullscreen}
              className="p-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-xs transition-colors"
              title="Toggle Fullscreen Presentation"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Main Stage Card: Question & Total Votes */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div className="space-y-2 max-w-3xl">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
              {poll.question}
            </h1>
            {poll.description && (
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                {poll.description}
              </p>
            )}
          </div>

          {/* Big Live Vote Counter Pill */}
          <div className="shrink-0 flex items-center md:flex-col md:items-end justify-between md:justify-center bg-slate-50 md:bg-transparent p-4 md:p-0 rounded-2xl border md:border-0 border-slate-200">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Responses
            </span>
            <div className="flex items-baseline space-x-2">
              <span className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">
                {poll.totalVotes}
              </span>
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                Active
              </span>
            </div>
          </div>
        </div>

        {/* Content Area Based on Poll Type */}

        {/* CASE 1: Multiple Choice or Word Cloud */}
        {(poll.type === 'multiple-choice' || poll.type === 'word-cloud') && (
          <div className="pt-6 space-y-6">
            {/* Chart controls */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-700">
                Live Distribution Breakdown
              </span>
              <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button
                  onClick={() => setChartMode('bar')}
                  className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                    chartMode === 'bar'
                      ? 'bg-white text-slate-900 shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span>Bar View</span>
                </button>
                <button
                  onClick={() => setChartMode('donut')}
                  className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                    chartMode === 'donut'
                      ? 'bg-white text-slate-900 shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <PieIcon className="w-3.5 h-3.5" />
                  <span>Donut View</span>
                </button>
              </div>
            </div>

            {chartMode === 'bar' ? (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                {/* Visual Chart */}
                <div className="lg:col-span-7 h-72 sm:h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={optionsData}
                      layout="vertical"
                      margin={{ top: 10, right: 30, left: 10, bottom: 5 }}
                    >
                      <XAxis type="number" domain={[0, 'dataMax + 5']} hide />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={140}
                        tick={{ fill: '#475569', fontSize: 13, fontWeight: 500 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        cursor={{ fill: 'rgba(241, 245, 249, 0.6)' }}
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-slate-900 text-white px-3 py-2 rounded-xl text-xs shadow-xl space-y-1">
                                <p className="font-semibold">{data.name}</p>
                                <p className="text-blue-300">
                                  {data.votes} votes ({data.percentage}%)
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar dataKey="votes" radius={[0, 8, 8, 0]} barSize={26}>
                        {optionsData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Option Cards with Percentage Progress */}
                <div className="lg:col-span-5 space-y-3">
                  {optionsData.map((opt, i) => (
                    <div
                      key={i}
                      className="p-4 rounded-2xl border border-slate-200/80 hover:border-slate-300 bg-slate-50/50 transition-all space-y-2"
                    >
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-2.5">
                          <span
                            className="w-3.5 h-3.5 rounded-md shrink-0"
                            style={{ backgroundColor: opt.color }}
                          />
                          <span className="font-medium text-slate-800">{opt.name}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-slate-900 text-base">{opt.percentage}%</span>
                          <span className="text-xs text-slate-500 ml-1.5">({opt.votes} votes)</span>
                        </div>
                      </div>

                      {/* Animated Progress bar */}
                      <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500 ease-out"
                          style={{
                            width: `${opt.percentage}%`,
                            backgroundColor: opt.color,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                {/* Donut Chart */}
                <div className="lg:col-span-7 h-72 sm:h-80 w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={optionsData}
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={105}
                        paddingAngle={3}
                        dataKey="votes"
                      >
                        {optionsData.map((entry, index) => (
                          <Cell key={`cell-donut-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-slate-900 text-white px-3 py-2 rounded-xl text-xs shadow-xl space-y-1">
                                <p className="font-semibold">{data.name}</p>
                                <p className="text-blue-300">
                                  {data.votes} votes ({data.percentage}%)
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Donut Legend */}
                <div className="lg:col-span-5 space-y-2.5">
                  {optionsData.map((opt, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-sm"
                    >
                      <div className="flex items-center space-x-2.5">
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: opt.color }}
                        />
                        <span className="font-medium text-slate-800">{opt.name}</span>
                      </div>
                      <span className="font-bold text-slate-900">
                        {opt.percentage}% <span className="text-xs text-slate-500">({opt.votes})</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* If Word Cloud type, display interactive cloud badges */}
            {poll.type === 'word-cloud' && (
              <div className="mt-8 pt-6 border-t border-slate-100">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-3">
                  Live Word Frequency Cloud
                </span>
                <div className="flex flex-wrap items-center justify-center gap-3 p-6 bg-slate-50 rounded-2xl border border-slate-200/80">
                  {optionsData.map((w, idx) => {
                    // Scale font size based on vote share
                    const minPx = 14;
                    const maxPx = 36;
                    const sizePx = Math.min(
                      maxPx,
                      minPx + (w.votes / Math.max(1, poll.totalVotes)) * (maxPx - minPx) * 2.5
                    );
                    return (
                      <span
                        key={idx}
                        style={{
                          fontSize: `${sizePx}px`,
                          color: w.color,
                        }}
                        className="font-bold tracking-tight px-3 py-1 rounded-xl hover:scale-110 transition-transform cursor-default"
                        title={`${w.votes} mentions`}
                      >
                        {w.name}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* CASE 2: Rating Scale Poll */}
        {poll.type === 'rating' && (
          <div className="pt-6 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Average Rating Score Box */}
              <div className="lg:col-span-4 bg-linear-to-br from-amber-50 to-orange-50/50 p-6 rounded-3xl border border-amber-200/80 flex flex-col items-center justify-center text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20">
                  <Star className="w-6 h-6 fill-current" />
                </div>
                <div>
                  <span className="text-5xl font-black text-slate-900 tracking-tight">
                    {ratingMetrics.formatted}
                  </span>
                  <span className="text-slate-500 text-lg font-medium"> / 5.0</span>
                </div>
                <div className="flex space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-5 h-5 ${
                        star <= Math.round(ratingMetrics.average)
                          ? 'text-amber-500 fill-amber-500'
                          : 'text-slate-300'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs text-slate-600 font-medium">
                  Weighted score across {poll.totalVotes} responses
                </p>
              </div>

              {/* Rating Distribution Bar Chart */}
              <div className="lg:col-span-8 h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={ratingsData}
                    margin={{ top: 10, right: 30, left: 10, bottom: 5 }}
                  >
                    <XAxis
                      dataKey="score"
                      tick={{ fill: '#475569', fontSize: 13, fontWeight: 600 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis hide />
                    <Tooltip
                      cursor={{ fill: 'rgba(241, 245, 249, 0.6)' }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-slate-900 text-white px-3 py-2 rounded-xl text-xs shadow-xl space-y-1">
                              <p className="font-semibold">{data.score} ({data.label})</p>
                              <p className="text-amber-300">
                                {data.count} responses ({data.percentage}%)
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="count" radius={[8, 8, 0, 0]} fill="#f59e0b" barSize={38}>
                      {ratingsData.map((entry, index) => (
                        <Cell
                          key={`rating-cell-${index}`}
                          fill={index >= 3 ? '#10b981' : index === 2 ? '#f59e0b' : '#f43f5e'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* CASE 3: Open-Ended Feedback with Live Stream & AI Sentiment Preview */}
        {poll.type === 'open-ended' && (
          <div className="pt-6 space-y-6">
            {/* Quick Sentiment Indicator card with shortcut to full dashboard */}
            <div className="bg-indigo-50/70 border border-indigo-200/80 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-indigo-500/20">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-sm font-bold text-indigo-950">
                      Live AI Sentiment Intelligence
                    </h3>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                      Gemini 3.8
                    </span>
                  </div>
                  <p className="text-xs text-indigo-700 mt-0.5">
                    {poll.sentimentAnalysis
                      ? `${poll.sentimentAnalysis.overallLabel} (${poll.sentimentAnalysis.sentimentDistribution.positive}% positive, ${poll.sentimentAnalysis.sentimentDistribution.negative}% constructive)`
                      : 'Analyzing incoming audience comments in real-time...'}
                  </p>
                </div>
              </div>

              <button
                id="btn-open-sentiment-view"
                onClick={onOpenSentimentView}
                className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors shrink-0"
              >
                <span>View Full Sentiment Dashboard</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Live Verbatim Audience Responses Stream */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-800 flex items-center space-x-2">
                  <MessageSquare className="w-4 h-4 text-blue-600" />
                  <span>Incoming Audience Verbatims</span>
                  <span className="text-xs font-medium text-slate-500">
                    ({poll.responses?.length || 0})
                  </span>
                </span>
                <span className="text-xs text-slate-400">
                  Updates in real-time
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
                {(poll.responses || []).map((resp) => {
                  const sentimentColor =
                    resp.sentiment === 'positive'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : resp.sentiment === 'negative'
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200';

                  return (
                    <div
                      key={resp.id}
                      className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200 hover:border-slate-300 transition-all space-y-2"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-700">
                          {resp.participantName || 'Audience Member'}
                        </span>
                        <div className="flex items-center space-x-1.5">
                          {resp.primaryEmotion && (
                            <span className="text-slate-500 text-[11px]">
                              {resp.primaryEmotion}
                            </span>
                          )}
                          <span
                            className={`px-2 py-0.5 rounded-md font-semibold text-[10px] uppercase tracking-wider border ${sentimentColor}`}
                          >
                            {resp.sentiment || 'neutral'}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-slate-800 leading-relaxed font-normal">
                        "{resp.text}"
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
