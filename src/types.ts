export type PollType = 'multiple-choice' | 'rating' | 'open-ended' | 'word-cloud';

export interface PollOption {
  id: string;
  text: string;
  votes: number;
  color?: string;
}

export interface RatingCount {
  score: number;
  label: string;
  count: number;
}

export interface AudienceResponse {
  id: string;
  pollId: string;
  text: string;
  participantName?: string;
  timestamp: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
  sentimentScore?: number; // -1 to +1
  primaryEmotion?: string;
}

export interface DominantEmotion {
  emotion: string;
  percentage: number;
}

export interface KeyTheme {
  theme: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  count: number;
}

export interface SentimentAnalysis {
  overallScore: number; // -1 to 1
  overallLabel: 'Strongly Positive' | 'Positive' | 'Neutral/Mixed' | 'Constructive/Negative' | 'Negative';
  sentimentDistribution: {
    positive: number;
    neutral: number;
    negative: number;
  };
  dominantEmotions: DominantEmotion[];
  keyThemes: KeyTheme[];
  summary: string;
  keyTakeaways: string[];
  lastUpdated: string;
}

export interface Poll {
  id: string;
  title: string;
  question: string;
  description?: string;
  type: PollType;
  options?: PollOption[];
  ratings?: RatingCount[];
  responses?: AudienceResponse[];
  totalVotes: number;
  isActive: boolean;
  isLocked: boolean;
  createdAt: string;
  sentimentAnalysis?: SentimentAnalysis;
}

export interface LiveReaction {
  id: string;
  emoji: string;
  x: number; // 5 to 95 percent
  timestamp: number;
}

export interface ClientAppState {
  polls: Poll[];
  activePollId: string;
  audienceCount: number;
  isConnected: boolean;
}

export type WebSocketMessage =
  | { type: 'INIT_STATE'; payload: { polls: Poll[]; activePollId: string; audienceCount: number } }
  | { type: 'POLL_UPDATED'; payload: { poll: Poll } }
  | { type: 'ACTIVE_POLL_CHANGED'; payload: { activePollId: string } }
  | { type: 'AUDIENCE_COUNT'; payload: { count: number } }
  | { type: 'LIVE_REACTION'; payload: LiveReaction }
  | { type: 'NEW_RESPONSE'; payload: { pollId: string; response: AudienceResponse } }
  | { type: 'SENTIMENT_UPDATED'; payload: { pollId: string; sentimentAnalysis: SentimentAnalysis } };
