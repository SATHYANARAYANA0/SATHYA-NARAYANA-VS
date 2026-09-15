import { Poll, PollOption, RatingCount } from '../types';

export const SENTIMENT_COLORS = {
  positive: '#10b981', // Emerald
  neutral: '#f59e0b',  // Amber
  negative: '#f43f5e', // Rose
  accent: '#3b82f6',   // Blue
  purple: '#8b5cf6',   // Indigo/Violet
};

export const CHART_PALETTE = [
  '#3b82f6', // Blue
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#f97316', // Orange
  '#6366f1', // Indigo
];

export function calculateAverageRating(ratings?: RatingCount[]): { average: number; formatted: string } {
  if (!ratings || ratings.length === 0) return { average: 0, formatted: '0.0' };
  let totalScore = 0;
  let totalCount = 0;
  ratings.forEach((r) => {
    totalScore += r.score * r.count;
    totalCount += r.count;
  });
  if (totalCount === 0) return { average: 0, formatted: '0.0' };
  const avg = totalScore / totalCount;
  return { average: avg, formatted: avg.toFixed(1) };
}

export function exportPollToCSV(poll: Poll): void {
  let csvContent = 'data:text/csv;charset=utf-8,';

  csvContent += `Poll Title,"${poll.title.replace(/"/g, '""')}"\n`;
  csvContent += `Question,"${poll.question.replace(/"/g, '""')}"\n`;
  csvContent += `Type,${poll.type}\n`;
  csvContent += `Total Votes,${poll.totalVotes}\n`;
  csvContent += `Created At,${poll.createdAt}\n\n`;

  if (poll.options && poll.options.length > 0) {
    csvContent += 'Option,Votes,Percentage\n';
    poll.options.forEach((opt) => {
      const pct = poll.totalVotes > 0 ? ((opt.votes / poll.totalVotes) * 100).toFixed(1) + '%' : '0%';
      csvContent += `"${opt.text.replace(/"/g, '""')}",${opt.votes},${pct}\n`;
    });
  }

  if (poll.ratings && poll.ratings.length > 0) {
    csvContent += 'Rating Score,Label,Responses,Percentage\n';
    poll.ratings.forEach((r) => {
      const pct = poll.totalVotes > 0 ? ((r.count / poll.totalVotes) * 100).toFixed(1) + '%' : '0%';
      csvContent += `${r.score},"${r.label}",${r.count},${pct}\n`;
    });
  }

  if (poll.responses && poll.responses.length > 0) {
    csvContent += '\nAudience Responses:\n';
    csvContent += 'ID,Participant,Timestamp,Sentiment,Score,Emotion,Comment\n';
    poll.responses.forEach((resp) => {
      csvContent += `"${resp.id}","${resp.participantName || 'Anonymous'}","${resp.timestamp}","${resp.sentiment || 'neutral'}","${resp.sentimentScore ?? ''}","${resp.primaryEmotion || ''}","${resp.text.replace(/"/g, '""')}"\n`;
    });
  }

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `poll-${poll.id}-results.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportPollToJSON(poll: Poll): void {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(poll, null, 2));
  const link = document.createElement('a');
  link.setAttribute('href', dataStr);
  link.setAttribute('download', `poll-${poll.id}-results.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
