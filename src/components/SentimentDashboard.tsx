import React, { useState } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import {
  BrainCircuit,
  Sparkles,
  TrendingUp,
  Smile,
  Meh,
  Frown,
  RefreshCw,
  Tag,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  Search,
  MessageSquare,
} from 'lucide-react';
import { Poll } from '../types';
import { SENTIMENT_COLORS } from '../lib/chartUtils';

interface SentimentDashboardProps {
  poll: Poll;
  onRefreshSentiment: (pollId: string) => Promise<void>;
  isAnalyzing: boolean;
}

export const SentimentDashboard: React.FC<SentimentDashboardProps> = ({
  poll,
  onRefreshSentiment,
  isAnalyzing,
}) => {
  const [filterSentiment, setFilterSentiment] = useState<'all' | 'positive' | 'neutral' | 'negative'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const analysis = poll.sentimentAnalysis;
  const responses = poll.responses || [];

  // Filter responses
  const filteredResponses = responses.filter((r) => {
    const matchesFilter = filterSentiment === 'all' || r.sentiment === filterSentiment;
    const matchesSearch =
      !searchQuery ||
      r.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.participantName && r.participantName.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  // Data for Donut Chart
  const distributionData = [
    {
      name: 'Positive',
      value: analysis?.sentimentDistribution.positive ?? 60,
      color: SENTIMENT_COLORS.positive,
      icon: Smile,
    },
    {
      name: 'Neutral',
      value: analysis?.sentimentDistribution.neutral ?? 20,
      color: SENTIMENT_COLORS.neutral,
      icon: Meh,
    },
    {
      name: 'Negative',
      value: analysis?.sentimentDistribution.negative ?? 20,
      color: SENTIMENT_COLORS.negative,
      icon: Frown,
    },
  ];

  // Data for Emotion Bar Chart
  const emotionsData = (analysis?.dominantEmotions || []).map((e) => ({
    name: e.emotion,
    percentage: e.percentage,
  }));

  // Overall Score normalization for meter (from -1 to 1 into 0 to 100%)
  const score = analysis?.overallScore ?? 0.5;
  const meterPercent = Math.min(100, Math.max(0, ((score + 1) / 2) * 100));

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0">
            <BrainCircuit className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Sentiment & Emotional Intelligence
              </h2>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                <Sparkles className="w-3 h-3 mr-1" />
                Gemini 3.8 Flash
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Active Question: <span className="font-semibold text-slate-800 font-medium">"{poll.question}"</span>
            </p>
          </div>
        </div>

        <button
          id="btn-refresh-sentiment"
          onClick={() => onRefreshSentiment(poll.id)}
          disabled={isAnalyzing}
          className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs sm:text-sm font-semibold shadow-sm transition-all disabled:opacity-50 shrink-0 cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
          <span>{isAnalyzing ? 'Analyzing Audience Feed...' : 'Re-run AI Analysis'}</span>
        </button>
      </div>

      {/* Primary KPI Grid: Score Meter + Distribution Donut + Dominant Emotions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* KPI 1: Sentiment Score Meter */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Overall Sentiment Index
            </span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                score >= 0.2
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : score <= -0.2
                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}
            >
              {analysis?.overallLabel || 'Positive'}
            </span>
          </div>

          <div className="text-center py-2">
            <div className="text-5xl font-black text-slate-900 tracking-tight">
              {score > 0 ? `+${score.toFixed(2)}` : score.toFixed(2)}
            </div>
            <p className="text-xs text-slate-500 mt-1">Normalized scale from -1.0 to +1.0</p>
          </div>

          {/* Color Spectrum Gauge */}
          <div className="space-y-1.5">
            <div className="relative h-3 w-full rounded-full bg-linear-to-r from-rose-500 via-amber-400 to-emerald-500 overflow-hidden">
              <div
                className="absolute top-0 bottom-0 w-1 bg-white shadow-md transition-all duration-700"
                style={{ left: `${meterPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] font-semibold text-slate-400 px-0.5">
              <span>-1.0 (Critical)</span>
              <span>0.0 (Neutral)</span>
              <span>+1.0 (Energized)</span>
            </div>
          </div>
        </div>

        {/* KPI 2: Sentiment Distribution Donut */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Sentiment Distribution
            </span>
            <span className="text-xs text-slate-400 font-medium">
              {responses.length} responses
            </span>
          </div>

          <div className="h-40 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={distributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={68}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {distributionData.map((entry, index) => (
                    <Cell key={`dist-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white px-2.5 py-1.5 rounded-lg text-xs shadow-md">
                          <span className="font-semibold">{data.name}: </span>
                          <span>{data.value}%</span>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Mini Legend */}
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="bg-emerald-50 text-emerald-800 p-2 rounded-xl font-semibold border border-emerald-200/60">
              <div className="text-sm font-bold">{analysis?.sentimentDistribution.positive ?? 0}%</div>
              <div className="text-[10px] font-medium text-emerald-600">Positive</div>
            </div>
            <div className="bg-amber-50 text-amber-800 p-2 rounded-xl font-semibold border border-amber-200/60">
              <div className="text-sm font-bold">{analysis?.sentimentDistribution.neutral ?? 0}%</div>
              <div className="text-[10px] font-medium text-amber-600">Neutral</div>
            </div>
            <div className="bg-rose-50 text-rose-800 p-2 rounded-xl font-semibold border border-rose-200/60">
              <div className="text-sm font-bold">{analysis?.sentimentDistribution.negative ?? 0}%</div>
              <div className="text-[10px] font-medium text-rose-600">Constructive</div>
            </div>
          </div>
        </div>

        {/* KPI 3: Emotional Tone Breakdown */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Audience Emotional Tones
            </span>
            <TrendingUp className="w-4 h-4 text-slate-400" />
          </div>

          <div className="space-y-3 py-1">
            {emotionsData.length > 0 ? (
              emotionsData.map((e, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-slate-700">{e.name}</span>
                    <span className="font-bold text-slate-900">{e.percentage}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${e.percentage}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 italic py-6 text-center">
                Awaiting emotion classification from incoming feedback...
              </p>
            )}
          </div>

          <div className="text-[11px] text-slate-400 text-center">
            Extracted from semantic nuance and vocabulary choices
          </div>
        </div>
      </div>

      {/* Synthesis Section: Executive Summary & Key Strategic Takeaways */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Executive Summary Card */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            <h3 className="text-base font-bold text-slate-900">
              Executive AI Sentiment Synthesis
            </h3>
          </div>

          <p className="text-slate-700 text-sm sm:text-base leading-relaxed">
            {analysis?.summary || 'Audience responses are actively being processed by the AI pipeline.'}
          </p>

          {/* Key Clustered Themes */}
          <div className="pt-3 border-t border-slate-100 space-y-2.5">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Core Thematic Clusters
            </span>
            <div className="flex flex-wrap gap-2">
              {(analysis?.keyThemes || []).map((theme, i) => {
                const themePillColor =
                  theme.sentiment === 'positive'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : theme.sentiment === 'negative'
                    ? 'bg-rose-50 text-rose-800 border-rose-200'
                    : 'bg-amber-50 text-amber-800 border-amber-200';

                return (
                  <span
                    key={i}
                    className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-xl text-xs font-medium border ${themePillColor}`}
                  >
                    <Tag className="w-3 h-3 opacity-70" />
                    <span>{theme.theme}</span>
                    <span className="ml-1 opacity-75">({theme.count})</span>
                  </span>
                );
              })}
            </div>
          </div>
        </div>

        {/* Actionable Takeaways Card */}
        <div className="lg:col-span-5 bg-linear-to-br from-indigo-50/50 to-blue-50/50 rounded-3xl p-6 sm:p-7 border border-indigo-200/80 shadow-xs space-y-4">
          <div className="flex items-center space-x-2">
            <Lightbulb className="w-5 h-5 text-indigo-700" />
            <h3 className="text-base font-bold text-slate-900">
              Actionable Presenter Insights
            </h3>
          </div>

          <div className="space-y-3">
            {(analysis?.keyTakeaways || []).map((item, idx) => (
              <div key={idx} className="flex items-start space-x-2.5 text-xs sm:text-sm text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <span className="leading-snug">{item}</span>
              </div>
            ))}
          </div>

          <div className="pt-2 text-[11px] text-slate-500">
            Last updated: {analysis?.lastUpdated ? new Date(analysis.lastUpdated).toLocaleTimeString() : 'Just now'}
          </div>
        </div>
      </div>

      {/* Audience Response Verbatim Explorer */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <MessageSquare className="w-4 h-4 text-blue-600" />
              <span>Audience Responses ({filteredResponses.length})</span>
            </h3>
            <p className="text-xs text-slate-500">
              Each response is individually parsed for sentiment tone and emotional orientation.
            </p>
          </div>

          {/* Filters & Search */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Sentiment Filter Buttons */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
              <button
                onClick={() => setFilterSentiment('all')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  filterSentiment === 'all'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterSentiment('positive')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  filterSentiment === 'positive'
                    ? 'bg-white text-emerald-700 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Positive
              </button>
              <button
                onClick={() => setFilterSentiment('neutral')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  filterSentiment === 'neutral'
                    ? 'bg-white text-amber-700 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Neutral
              </button>
              <button
                onClick={() => setFilterSentiment('negative')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  filterSentiment === 'negative'
                    ? 'bg-white text-rose-700 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Constructive
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search verbatims..."
                className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 w-44"
              />
            </div>
          </div>
        </div>

        {/* Responses Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[500px] overflow-y-auto pr-1">
          {filteredResponses.length > 0 ? (
            filteredResponses.map((r) => {
              const badgeColor =
                r.sentiment === 'positive'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : r.sentiment === 'negative'
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200';

              return (
                <div
                  key={r.id}
                  className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 hover:border-slate-300 transition-all flex flex-col justify-between space-y-3"
                >
                  <p className="text-sm text-slate-800 leading-relaxed">
                    "{r.text}"
                  </p>

                  <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700">
                      {r.participantName || 'Audience Member'}
                    </span>
                    <div className="flex items-center space-x-1.5">
                      {r.primaryEmotion && (
                        <span className="text-[11px] text-slate-500">
                          {r.primaryEmotion}
                        </span>
                      )}
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${badgeColor}`}>
                        {r.sentiment || 'neutral'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full py-12 text-center text-slate-400 text-sm">
              No audience responses match your search criteria.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
