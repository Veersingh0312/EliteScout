/**
 * API client for the Football Market Value Intelligence backend.
 */

const API_BASE = '/api';

async function fetchJSON(url, options = {}) {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(error.detail || `API Error: ${res.status}`);
  }
  return res.json();
}

// ===== Player Endpoints =====

export async function fetchDashboardSummary() {
  return fetchJSON('/dashboard-summary');
}

export async function fetchTopPlayers(limit = 50, league = null, position = null) {
  const params = new URLSearchParams({ limit });
  if (league && league !== 'all') params.append('league', league);
  if (position && position !== 'all') params.append('position', position);
  return fetchJSON(`/top-players?${params}`);
}

export async function searchPlayers(query) {
  return fetchJSON(`/player-search?q=${encodeURIComponent(query)}`);
}

export async function fetchPlayerAnalysis(playerId) {
  return fetchJSON(`/player-analysis/${playerId}`);
}

export async function fetchLeagueAnalysis() {
  return fetchJSON('/league-analysis');
}

export async function fetchPositionDistribution() {
  return fetchJSON('/position-distribution');
}

export async function fetchLeaguesList() {
  return fetchJSON('/leagues-list');
}

export async function fetchPositionsList() {
  return fetchJSON('/positions-list');
}

// ===== Prediction Endpoints =====

export async function predictValue(input) {
  return fetchJSON('/predict-value', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function predictTrajectory(input) {
  return fetchJSON('/predict-trajectory', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function fetchPlayerForecast(playerId, nYears = 5) {
  return fetchJSON(`/player-forecast/${playerId}?n_years=${nYears}`);
}

// ===== Metrics Endpoints =====

export async function fetchModelMetrics() {
  return fetchJSON('/model-metrics');
}

// ===== Utility =====

export function formatCurrency(value) {
  if (value == null || isNaN(value)) return '€0';
  if (value >= 1_000_000) return `€${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `€${(value / 1_000).toFixed(0)}K`;
  return `€${value.toFixed(0)}`;
}

export function formatNumber(value) {
  if (value == null || isNaN(value)) return '0';
  return new Intl.NumberFormat('en-US').format(Math.round(value));
}

export function getPlayerImageUrl(playerId) {
  return `https://img.a.transfermarkt.technology/portrait/big/${playerId}.jpg`;
}
