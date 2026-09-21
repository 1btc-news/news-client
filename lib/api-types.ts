/**
 * Types for the Quantum Visualizer data source.
 *
 * The data is served from:
 * https://quantum-power-map.p-d07.workers.dev/data.json
 *
 * Example payload:
 * {
 *   "readinessIndex": 23,
 *   "developers": [
 *     { "name": "Satoshi Nakamoto", "score": 95, "position": "Core Maintainer" },
 *     ...
 *   ]
 * }
 */

export interface QuantumDeveloper {
  /** Full name or handle of the developer */
  name: string;
  /** Numerical score (0‑100) representing quantum‑risk awareness */
  score: number;
  /** Optional public position / comment on quantum‑resistance */
  position?: string;
  /** Optional URL to a source (tweet, blog, etc.) */
  sourceUrl?: string;
}

export interface QuantumData {
  /** Bitcoin Quantum Readiness Index (0‑100) */
  readinessIndex: number;
  /** List of developers ranked by their quantum‑risk score */
  developers: QuantumDeveloper[];
}
