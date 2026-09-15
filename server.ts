import express from 'express';
import http from 'http';
import path from 'path';
import { WebSocketServer, WebSocket } from 'ws';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import { Poll, AudienceResponse, SentimentAnalysis, LiveReaction } from './src/types';

const PORT = 3000;
const app = express();
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Shared Gemini AI Client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// In-memory state
let activePollId = 'poll-1';

const initialPolls: Poll[] = [
  {
    id: 'poll-1',
    title: 'Strategic Priorities',
    question: 'What is our team’s top engineering & product focus for the upcoming quarter?',
    description: 'Select the initiative that will drive the highest impact for our users and platform.',
    type: 'multiple-choice',
    options: [
      { id: 'opt-1', text: 'Real-time AI & Predictive Analytics', votes: 42, color: '#3b82f6' },
      { id: 'opt-2', text: 'Design System & Micro-interactions', votes: 28, color: '#10b981' },
      { id: 'opt-3', text: 'Infrastructure Resilience & Sub-50ms Latency', votes: 35, color: '#f59e0b' },
      { id: 'opt-4', text: 'Developer Tooling & Automated Workflows', votes: 19, color: '#8b5cf6' },
    ],
    totalVotes: 124,
    isActive: true,
    isLocked: false,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'poll-2',
    title: 'Architecture Confidence',
    question: 'How confident do you feel regarding our transition to event-driven microservices?',
    description: 'Rate your team’s readiness and technical clarity on a scale of 1 to 5.',
    type: 'rating',
    ratings: [
      { score: 1, label: 'Very Hesitant', count: 3 },
      { score: 2, label: 'Uncertain', count: 7 },
      { score: 3, label: 'Neutral', count: 18 },
      { score: 4, label: 'Confident', count: 46 },
      { score: 5, label: 'Extremely Bullish', count: 32 },
    ],
    totalVotes: 106,
    isActive: false,
    isLocked: false,
    createdAt: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: 'poll-3',
    title: 'Audience Sentiment & Concerns',
    question: 'What are your honest thoughts and questions regarding our technical roadmap?',
    description: 'Submit open feedback. Our Gemini AI engine clusters sentiment, detects emotional tone, and surfaces key themes in real-time.',
    type: 'open-ended',
    totalVotes: 8,
    isActive: false,
    isLocked: false,
    createdAt: new Date(Date.now() - 10800000).toISOString(),
    responses: [
      {
        id: 'resp-1',
        pollId: 'poll-3',
        text: 'The shift to real-time WebSockets and streaming architecture is exactly what we needed. Super excited to see the performance gains!',
        participantName: 'Alex M.',
        timestamp: new Date(Date.now() - 1200000).toISOString(),
        sentiment: 'positive',
        sentimentScore: 0.92,
        primaryEmotion: 'Excited',
      },
      {
        id: 'resp-2',
        pollId: 'poll-3',
        text: 'I love the ambitious vision, but we need comprehensive test coverage and observability before cutting over live production traffic.',
        participantName: 'Sarah K.',
        timestamp: new Date(Date.now() - 950000).toISOString(),
        sentiment: 'neutral',
        sentimentScore: 0.25,
        primaryEmotion: 'Pragmatic',
      },
      {
        id: 'resp-3',
        pollId: 'poll-3',
        text: 'Will team onboarding and internal documentation be ready in time? The learning curve could cause temporary friction.',
        participantName: 'Jordan T.',
        timestamp: new Date(Date.now() - 720000).toISOString(),
        sentiment: 'negative',
        sentimentScore: -0.45,
        primaryEmotion: 'Concerned',
      },
      {
        id: 'resp-4',
        pollId: 'poll-3',
        text: 'Huge fan of the new interactive dashboards and clean typography. The live charts make leadership reviews 10x more engaging.',
        participantName: 'Elena V.',
        timestamp: new Date(Date.now() - 480000).toISOString(),
        sentiment: 'positive',
        sentimentScore: 0.88,
        primaryEmotion: 'Impressed',
      },
      {
        id: 'resp-5',
        pollId: 'poll-3',
        text: 'Latency improvements look incredible in benchmarks. Let’s make sure mobile battery impact is tested thoroughly.',
        participantName: 'David W.',
        timestamp: new Date(Date.now() - 320000).toISOString(),
        sentiment: 'positive',
        sentimentScore: 0.65,
        primaryEmotion: 'Constructive',
      },
      {
        id: 'resp-6',
        pollId: 'poll-3',
        text: 'Worried about migration rollback plan if downstream dependencies experience timeout spikes.',
        participantName: 'Chris L.',
        timestamp: new Date(Date.now() - 180000).toISOString(),
        sentiment: 'negative',
        sentimentScore: -0.58,
        primaryEmotion: 'Cautious',
      },
      {
        id: 'resp-7',
        pollId: 'poll-3',
        text: 'Great clarity in the presentation today. The live polling made this session feel truly collaborative and transparent.',
        participantName: 'Maya R.',
        timestamp: new Date(Date.now() - 90000).toISOString(),
        sentiment: 'positive',
        sentimentScore: 0.95,
        primaryEmotion: 'Delighted',
      },
      {
        id: 'resp-8',
        pollId: 'poll-3',
        text: 'Looking forward to seeing how the AI sentiment synthesis groups our weekly retro feedback.',
        participantName: 'Liam S.',
        timestamp: new Date(Date.now() - 30000).toISOString(),
        sentiment: 'positive',
        sentimentScore: 0.78,
        primaryEmotion: 'Curious',
      },
    ],
    sentimentAnalysis: {
      overallScore: 0.55,
      overallLabel: 'Positive',
      sentimentDistribution: {
        positive: 62.5,
        neutral: 12.5,
        negative: 25.0,
      },
      dominantEmotions: [
        { emotion: 'Excited & Enthusiastic', percentage: 40 },
        { emotion: 'Constructive & Pragmatic', percentage: 25 },
        { emotion: 'Concerned about Timelines', percentage: 20 },
        { emotion: 'Curious / Inquisitive', percentage: 15 },
      ],
      keyThemes: [
        { theme: 'Architecture & Streaming Performance', sentiment: 'positive', count: 3 },
        { theme: 'Documentation & Team Enablement', sentiment: 'negative', count: 2 },
        { theme: 'Testing, Observability & Rollback Safety', sentiment: 'neutral', count: 2 },
        { theme: 'UI Polish & Live Engagement', sentiment: 'positive', count: 2 },
      ],
      summary: 'Audience response is overwhelmingly energized by the real-time architectural upgrades and interactive dashboard experiences. Key operational concerns center on migration safety buffers, automated rollback tests, and thorough documentation.',
      keyTakeaways: [
        'Team enthusiasm is high for sub-50ms streaming latency and modern tooling.',
        'Address developer onboarding early with comprehensive sample documentation.',
        'Formalize failover protocols to reassure risk-sensitive engineering stakeholders.',
      ],
      lastUpdated: new Date().toISOString(),
    },
  },
  {
    id: 'poll-4',
    title: 'Keynote Pulse & Vibes',
    question: 'In 1-3 words, how would you describe today’s session atmosphere?',
    description: 'Audience word cloud & rapid sentiment pulse.',
    type: 'word-cloud',
    totalVotes: 36,
    isActive: false,
    isLocked: false,
    createdAt: new Date(Date.now() - 14400000).toISOString(),
    options: [
      { id: 'wc-1', text: 'Energizing', votes: 14, color: '#3b82f6' },
      { id: 'wc-2', text: 'Innovative', votes: 11, color: '#10b981' },
      { id: 'wc-3', text: 'Actionable', votes: 8, color: '#8b5cf6' },
      { id: 'wc-4', text: 'Challenging', votes: 5, color: '#f59e0b' },
      { id: 'wc-5', text: 'Inspiring', votes: 9, color: '#ec4899' },
      { id: 'wc-6', text: 'Collaborative', votes: 7, color: '#06b6d4' },
    ],
  },
];

let polls: Poll[] = [...initialPolls];

// Fallback Heuristic Sentiment Engine when Gemini API key is not supplied or offline
function analyzeSentimentHeuristically(responses: AudienceResponse[]): SentimentAnalysis {
  if (responses.length === 0) {
    return {
      overallScore: 0,
      overallLabel: 'Neutral/Mixed',
      sentimentDistribution: { positive: 0, neutral: 100, negative: 0 },
      dominantEmotions: [],
      keyThemes: [],
      summary: 'No audience responses recorded yet.',
      keyTakeaways: ['Awaiting attendee participation.'],
      lastUpdated: new Date().toISOString(),
    };
  }

  const positiveWords = ['great', 'love', 'excited', 'awesome', 'good', 'huge', 'fan', 'incredible', 'fast', 'clear', 'delighted', 'confident', 'helpful', 'forward'];
  const negativeWords = ['worried', 'concern', 'slow', 'bad', 'friction', 'risk', 'fail', 'hard', 'difficult', 'timeout', 'spike', 'issue', 'problem', 'hesitant'];

  let totalScore = 0;
  let posCount = 0;
  let negCount = 0;
  let neuCount = 0;

  for (const resp of responses) {
    const textLower = resp.text.toLowerCase();
    let score = 0;
    positiveWords.forEach(w => { if (textLower.includes(w)) score += 0.3; });
    negativeWords.forEach(w => { if (textLower.includes(w)) score -= 0.4; });

    score = Math.max(-1, Math.min(1, score));
    resp.sentimentScore = score;
    if (score > 0.15) {
      resp.sentiment = 'positive';
      resp.primaryEmotion = 'Optimistic';
      posCount++;
    } else if (score < -0.15) {
      resp.sentiment = 'negative';
      resp.primaryEmotion = 'Concerned';
      negCount++;
    } else {
      resp.sentiment = 'neutral';
      resp.primaryEmotion = 'Pragmatic';
      neuCount++;
    }
    totalScore += score;
  }

  const avgScore = totalScore / responses.length;
  const total = responses.length;
  const positivePct = Math.round((posCount / total) * 100);
  const negativePct = Math.round((negCount / total) * 100);
  const neutralPct = Math.max(0, 100 - positivePct - negativePct);

  let overallLabel: SentimentAnalysis['overallLabel'] = 'Neutral/Mixed';
  if (avgScore >= 0.4) overallLabel = 'Strongly Positive';
  else if (avgScore >= 0.1) overallLabel = 'Positive';
  else if (avgScore <= -0.4) overallLabel = 'Negative';
  else if (avgScore <= -0.1) overallLabel = 'Constructive/Negative';

  return {
    overallScore: Math.round(avgScore * 100) / 100,
    overallLabel,
    sentimentDistribution: {
      positive: positivePct,
      neutral: neutralPct,
      negative: negativePct,
    },
    dominantEmotions: [
      { emotion: 'Enthusiastic & Receptive', percentage: Math.max(20, positivePct) },
      { emotion: 'Analytical & Constructive', percentage: Math.max(15, neutralPct) },
      { emotion: 'Risk-Conscious / Cautious', percentage: Math.max(10, negativePct) },
    ],
    keyThemes: [
      { theme: 'Roadmap Feasibility', sentiment: avgScore > 0 ? 'positive' : 'neutral', count: responses.length },
      { theme: 'Team Readiness & Operational Scaling', sentiment: negativePct > 20 ? 'neutral' : 'positive', count: Math.ceil(responses.length / 2) },
    ],
    summary: `Based on ${responses.length} attendee submissions, the audience posture is ${overallLabel.toLowerCase()} (${positivePct}% positive, ${neutralPct}% neutral, ${negativePct}% constructive/cautious). Primary discussions focus on technical implementation and execution safety.`,
    keyTakeaways: [
      'Maintain strong visibility into implementation milestones.',
      'Provide dedicated technical syncs for questions raised by attendees.',
      'Continue capturing real-time pulse as upcoming phases roll out.',
    ],
    lastUpdated: new Date().toISOString(),
  };
}

// AI-powered Sentiment Analysis using Gemini 3.8 Flash
async function performGeminiSentimentAnalysis(poll: Poll): Promise<SentimentAnalysis> {
  const responses = poll.responses || [];
  if (responses.length === 0) {
    return analyzeSentimentHeuristically([]);
  }

  const client = getGeminiClient();
  if (!client) {
    console.log('Gemini API key not configured or client unavailable; utilizing heuristic sentiment engine.');
    return analyzeSentimentHeuristically(responses);
  }

  try {
    const feedbackTexts = responses.map((r, i) => `[${i + 1}] "${r.text}"`).join('\n');
    const prompt = `You are an expert audience sentiment analyst for executive townhalls, conferences, and technical workshops.
Analyze the following ${responses.length} audience feedback comments for the poll question: "${poll.question}".

AUDIENCE COMMENTS:
${feedbackTexts}

Produce a rigorous, structured sentiment evaluation with:
- overallScore: Float between -1.0 (extremely negative) and +1.0 (extremely positive).
- overallLabel: One of: "Strongly Positive", "Positive", "Neutral/Mixed", "Constructive/Negative", "Negative".
- sentimentDistribution: positive, neutral, negative percentages adding up to 100.
- dominantEmotions: Top 3-5 emotional tones with percentage (e.g. "Excited", "Pragmatic", "Cautious", "Curious").
- keyThemes: Array of 3-5 primary thematic clusters, their overall sentiment, and frequency count.
- summary: High-impact 2-3 sentence executive synopsis of audience mood, consensus, and points of tension.
- keyTakeaways: Exactly 3 actionable recommendations for the presenter or leadership.
- analyzedResponses: Score each individual response text with sentiment ('positive'|'neutral'|'negative'), sentimentScore (-1 to 1), and primaryEmotion.`;

    const result = await client.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overallScore: { type: Type.NUMBER, description: 'Score from -1.0 to 1.0' },
            overallLabel: {
              type: Type.STRING,
              enum: ['Strongly Positive', 'Positive', 'Neutral/Mixed', 'Constructive/Negative', 'Negative'],
            },
            sentimentDistribution: {
              type: Type.OBJECT,
              properties: {
                positive: { type: Type.NUMBER },
                neutral: { type: Type.NUMBER },
                negative: { type: Type.NUMBER },
              },
              required: ['positive', 'neutral', 'negative'],
            },
            dominantEmotions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  emotion: { type: Type.STRING },
                  percentage: { type: Type.NUMBER },
                },
                required: ['emotion', 'percentage'],
              },
            },
            keyThemes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  theme: { type: Type.STRING },
                  sentiment: { type: Type.STRING, enum: ['positive', 'neutral', 'negative'] },
                  count: { type: Type.NUMBER },
                },
                required: ['theme', 'sentiment', 'count'],
              },
            },
            summary: { type: Type.STRING },
            keyTakeaways: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            analyzedResponses: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  text: { type: Type.STRING },
                  sentiment: { type: Type.STRING, enum: ['positive', 'neutral', 'negative'] },
                  sentimentScore: { type: Type.NUMBER },
                  primaryEmotion: { type: Type.STRING },
                },
                required: ['text', 'sentiment', 'sentimentScore', 'primaryEmotion'],
              },
            },
          },
          required: [
            'overallScore',
            'overallLabel',
            'sentimentDistribution',
            'dominantEmotions',
            'keyThemes',
            'summary',
            'keyTakeaways',
          ],
        },
      },
    });

    const parsed = JSON.parse(result.text || '{}');

    // Update individual responses with AI analysis if provided
    if (parsed.analyzedResponses && Array.isArray(parsed.analyzedResponses)) {
      parsed.analyzedResponses.forEach((ar: any, idx: number) => {
        if (responses[idx]) {
          responses[idx].sentiment = ar.sentiment;
          responses[idx].sentimentScore = ar.sentimentScore;
          responses[idx].primaryEmotion = ar.primaryEmotion;
        }
      });
    }

    return {
      overallScore: parsed.overallScore ?? 0.5,
      overallLabel: parsed.overallLabel ?? 'Positive',
      sentimentDistribution: {
        positive: Math.round(parsed.sentimentDistribution?.positive ?? 50),
        neutral: Math.round(parsed.sentimentDistribution?.neutral ?? 25),
        negative: Math.round(parsed.sentimentDistribution?.negative ?? 25),
      },
      dominantEmotions: parsed.dominantEmotions || [],
      keyThemes: parsed.keyThemes || [],
      summary: parsed.summary || 'Summary unavailable.',
      keyTakeaways: parsed.keyTakeaways || [],
      lastUpdated: new Date().toISOString(),
    };
  } catch (err) {
    console.error('Gemini sentiment analysis error:', err);
    return analyzeSentimentHeuristically(responses);
  }
}

// WebSocket broadcast helper
function broadcast(data: any, excludeWs?: WebSocket) {
  const json = JSON.stringify(data);
  wss.clients.forEach((client) => {
    if (client !== excludeWs && client.readyState === WebSocket.OPEN) {
      client.send(json);
    }
  });
}

function getAudienceCount(): number {
  return wss.clients.size;
}

// WebSocket connection handling
wss.on('connection', (ws) => {
  // Send current state on connection
  ws.send(
    JSON.stringify({
      type: 'INIT_STATE',
      payload: {
        polls,
        activePollId,
        audienceCount: getAudienceCount(),
      },
    })
  );

  // Broadcast updated audience count to everyone
  broadcast({
    type: 'AUDIENCE_COUNT',
    payload: { count: getAudienceCount() },
  });

  ws.on('message', async (raw) => {
    try {
      const msg = JSON.parse(raw.toString());
      switch (msg.type) {
        case 'VOTE': {
          const { pollId, optionId, ratingScore } = msg.payload;
          const poll = polls.find((p) => p.id === pollId);
          if (!poll || poll.isLocked) return;

          if (poll.type === 'multiple-choice' || poll.type === 'word-cloud') {
            const opt = poll.options?.find((o) => o.id === optionId);
            if (opt) {
              opt.votes += 1;
              poll.totalVotes += 1;
            }
          } else if (poll.type === 'rating' && ratingScore !== undefined) {
            const r = poll.ratings?.find((item) => item.score === ratingScore);
            if (r) {
              r.count += 1;
              poll.totalVotes += 1;
            }
          }

          broadcast({ type: 'POLL_UPDATED', payload: { poll } });
          break;
        }

        case 'FEEDBACK': {
          const { pollId, text, participantName } = msg.payload;
          const poll = polls.find((p) => p.id === pollId);
          if (!poll || poll.isLocked || !text?.trim()) return;

          if (!poll.responses) poll.responses = [];
          const newResp: AudienceResponse = {
            id: 'resp-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
            pollId,
            text: text.trim(),
            participantName: participantName?.trim() || 'Attendee ' + (poll.responses.length + 1),
            timestamp: new Date().toISOString(),
          };

          poll.responses.unshift(newResp);
          poll.totalVotes += 1;

          // Broadcast the new response immediately for instant sub-second feedback
          broadcast({
            type: 'NEW_RESPONSE',
            payload: { pollId, response: newResp },
          });

          // Run sentiment update asynchronously
          const updatedSentiment = await performGeminiSentimentAnalysis(poll);
          poll.sentimentAnalysis = updatedSentiment;

          broadcast({
            type: 'POLL_UPDATED',
            payload: { poll },
          });
          break;
        }

        case 'REACTION': {
          const reaction: LiveReaction = {
            id: 'rx-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
            emoji: msg.payload.emoji || '👍',
            x: Math.max(10, Math.min(90, msg.payload.x || Math.random() * 80 + 10)),
            timestamp: Date.now(),
          };
          broadcast({ type: 'LIVE_REACTION', payload: reaction });
          break;
        }

        case 'SET_ACTIVE_POLL': {
          const { pollId } = msg.payload;
          const target = polls.find((p) => p.id === pollId);
          if (target) {
            activePollId = pollId;
            polls.forEach((p) => {
              p.isActive = p.id === pollId;
            });
            broadcast({ type: 'ACTIVE_POLL_CHANGED', payload: { activePollId } });
          }
          break;
        }

        case 'TOGGLE_LOCK': {
          const { pollId } = msg.payload;
          const target = polls.find((p) => p.id === pollId);
          if (target) {
            target.isLocked = !target.isLocked;
            broadcast({ type: 'POLL_UPDATED', payload: { poll: target } });
          }
          break;
        }

        case 'RESET_POLL': {
          const { pollId } = msg.payload;
          const target = polls.find((p) => p.id === pollId);
          if (target) {
            target.totalVotes = 0;
            if (target.options) {
              target.options.forEach((o) => (o.votes = 0));
            }
            if (target.ratings) {
              target.ratings.forEach((r) => (r.count = 0));
            }
            if (target.responses) {
              target.responses = [];
              target.sentimentAnalysis = analyzeSentimentHeuristically([]);
            }
            broadcast({ type: 'POLL_UPDATED', payload: { poll: target } });
          }
          break;
        }
      }
    } catch (err) {
      console.error('Error parsing WebSocket message:', err);
    }
  });

  ws.on('close', () => {
    broadcast({
      type: 'AUDIENCE_COUNT',
      payload: { count: getAudienceCount() },
    });
  });
});

// REST API Endpoints

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', audienceCount: getAudienceCount() });
});

// Get all polls
app.get('/api/polls', (req, res) => {
  res.json({ polls, activePollId });
});

// Create new poll
app.post('/api/polls', (req, res) => {
  const { title, question, description, type, options } = req.body;
  if (!title || !question || !type) {
    return res.status(400).json({ error: 'title, question, and type are required' });
  }

  const newPollId = 'poll-' + Date.now();
  let createdOptions = undefined;
  let createdRatings = undefined;
  let createdResponses = undefined;

  if (type === 'multiple-choice' || type === 'word-cloud') {
    const defaultColors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];
    createdOptions = (options || []).map((optText: string, idx: number) => ({
      id: `opt-${idx + 1}`,
      text: optText,
      votes: 0,
      color: defaultColors[idx % defaultColors.length],
    }));
  } else if (type === 'rating') {
    createdRatings = [
      { score: 1, label: 'Poor / Hesitant', count: 0 },
      { score: 2, label: 'Fair / Uncertain', count: 0 },
      { score: 3, label: 'Good / Neutral', count: 0 },
      { score: 4, label: 'Very Good / Confident', count: 0 },
      { score: 5, label: 'Exceptional / Enthusiastic', count: 0 },
    ];
  } else if (type === 'open-ended') {
    createdResponses = [];
  }

  const newPoll: Poll = {
    id: newPollId,
    title,
    question,
    description: description || '',
    type,
    options: createdOptions,
    ratings: createdRatings,
    responses: createdResponses,
    totalVotes: 0,
    isActive: false,
    isLocked: false,
    createdAt: new Date().toISOString(),
  };

  polls.unshift(newPoll);
  broadcast({ type: 'POLL_UPDATED', payload: { poll: newPoll } });
  res.status(201).json(newPoll);
});

// Set active poll
app.post('/api/polls/active', (req, res) => {
  const { pollId } = req.body;
  const target = polls.find((p) => p.id === pollId);
  if (!target) {
    return res.status(404).json({ error: 'Poll not found' });
  }
  activePollId = pollId;
  polls.forEach((p) => {
    p.isActive = p.id === pollId;
  });
  broadcast({ type: 'ACTIVE_POLL_CHANGED', payload: { activePollId } });
  res.json({ success: true, activePollId });
});

// Submit vote
app.post('/api/polls/:id/vote', (req, res) => {
  const { id } = req.params;
  const { optionId, ratingScore } = req.body;
  const poll = polls.find((p) => p.id === id);
  if (!poll) return res.status(404).json({ error: 'Poll not found' });
  if (poll.isLocked) return res.status(403).json({ error: 'Poll is locked' });

  if (poll.type === 'multiple-choice' || poll.type === 'word-cloud') {
    const opt = poll.options?.find((o) => o.id === optionId);
    if (!opt) return res.status(400).json({ error: 'Invalid optionId' });
    opt.votes += 1;
    poll.totalVotes += 1;
  } else if (poll.type === 'rating' && ratingScore !== undefined) {
    const r = poll.ratings?.find((item) => item.score === Number(ratingScore));
    if (!r) return res.status(400).json({ error: 'Invalid rating score' });
    r.count += 1;
    poll.totalVotes += 1;
  }

  broadcast({ type: 'POLL_UPDATED', payload: { poll } });
  res.json({ success: true, poll });
});

// Submit feedback for open-ended
app.post('/api/polls/:id/feedback', async (req, res) => {
  const { id } = req.params;
  const { text, participantName } = req.body;
  const poll = polls.find((p) => p.id === id);
  if (!poll) return res.status(404).json({ error: 'Poll not found' });
  if (poll.isLocked) return res.status(403).json({ error: 'Poll is locked' });
  if (!text || !text.trim()) return res.status(400).json({ error: 'Text is required' });

  if (!poll.responses) poll.responses = [];
  const newResp: AudienceResponse = {
    id: 'resp-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
    pollId: id,
    text: text.trim(),
    participantName: participantName?.trim() || 'Attendee ' + (poll.responses.length + 1),
    timestamp: new Date().toISOString(),
  };

  poll.responses.unshift(newResp);
  poll.totalVotes += 1;

  broadcast({
    type: 'NEW_RESPONSE',
    payload: { pollId: id, response: newResp },
  });

  const updatedSentiment = await performGeminiSentimentAnalysis(poll);
  poll.sentimentAnalysis = updatedSentiment;

  broadcast({ type: 'POLL_UPDATED', payload: { poll } });
  res.json({ success: true, response: newResp, sentimentAnalysis: updatedSentiment });
});

// Trigger fresh AI sentiment analysis on a poll
app.post('/api/polls/:id/analyze-sentiment', async (req, res) => {
  const { id } = req.params;
  const poll = polls.find((p) => p.id === id);
  if (!poll) return res.status(404).json({ error: 'Poll not found' });

  const updatedSentiment = await performGeminiSentimentAnalysis(poll);
  poll.sentimentAnalysis = updatedSentiment;

  broadcast({ type: 'POLL_UPDATED', payload: { poll } });
  res.json({ success: true, sentimentAnalysis: updatedSentiment });
});

// Simulate audience activity helper (great for presenters demonstrating live polling and chart animations!)
app.post('/api/simulate-response', async (req, res) => {
  const poll = polls.find((p) => p.id === activePollId) || polls[0];
  if (!poll || poll.isLocked) {
    return res.status(400).json({ error: 'Poll is unavailable or locked' });
  }

  if (poll.type === 'multiple-choice' || poll.type === 'word-cloud') {
    if (poll.options && poll.options.length > 0) {
      const randomOpt = poll.options[Math.floor(Math.random() * poll.options.length)];
      randomOpt.votes += 1;
      poll.totalVotes += 1;
    }
  } else if (poll.type === 'rating') {
    if (poll.ratings && poll.ratings.length > 0) {
      // Weighted towards 4 and 5
      const scores = [3, 4, 4, 5, 5, 5, 2, 4];
      const pickedScore = scores[Math.floor(Math.random() * scores.length)];
      const r = poll.ratings.find((item) => item.score === pickedScore) || poll.ratings[3];
      r.count += 1;
      poll.totalVotes += 1;
    }
  } else if (poll.type === 'open-ended') {
    const simulatedComments = [
      { text: 'Really appreciate the transparency around latency benchmarks and fallback mechanisms.', name: 'Dev Lead' },
      { text: 'Could we schedule a hands-on workshop for junior engineers next week?', name: 'Senior Eng' },
      { text: 'Excited about the interactive charts! This gives our team direct voice in technical planning.', name: 'Product Manager' },
      { text: 'Please ensure data export to CSV and JSON is supported for executive reporting.', name: 'Data Architect' },
      { text: 'Concerned about third-party API rate limits during peak surge traffic hours.', name: 'Site Reliability Eng' },
    ];
    const picked = simulatedComments[Math.floor(Math.random() * simulatedComments.length)];
    if (!poll.responses) poll.responses = [];
    const newResp: AudienceResponse = {
      id: 'resp-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      pollId: poll.id,
      text: picked.text,
      participantName: picked.name,
      timestamp: new Date().toISOString(),
    };
    poll.responses.unshift(newResp);
    poll.totalVotes += 1;

    broadcast({ type: 'NEW_RESPONSE', payload: { pollId: poll.id, response: newResp } });
    const sentiment = await performGeminiSentimentAnalysis(poll);
    poll.sentimentAnalysis = sentiment;
  }

  // Also emit a live emoji reaction
  const emojis = ['👏', '🔥', '❤️', '💡', '🚀', '🎉'];
  const rx: LiveReaction = {
    id: 'rx-' + Date.now(),
    emoji: emojis[Math.floor(Math.random() * emojis.length)],
    x: Math.random() * 80 + 10,
    timestamp: Date.now(),
  };
  broadcast({ type: 'LIVE_REACTION', payload: rx });

  broadcast({ type: 'POLL_UPDATED', payload: { poll } });
  res.json({ success: true, poll });
});

// Vite & Static Asset Handling
async function initServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Live Polling Server with WebSockets running at http://0.0.0.0:${PORT}`);
  });
}

initServer().catch((err) => {
  console.error('Failed to start server:', err);
});
