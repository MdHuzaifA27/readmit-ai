// Single integration point between the Lovable frontend and the Python ML service.
// Set VITE_READMIT_API_URL (for example http://localhost:8000) to enable real predictions.
import { scorePatient, type Patient, type Prediction } from "./model";
import { models, fairness, dataQuality } from "./demo-data";

const API = (import.meta.env.VITE_READMIT_API_URL as string | undefined)?.replace(/\/$/, "");

async function post<T>(path: string, body: unknown): Promise<T> {
  if (!API) throw new Error("ReadmitAI API is not configured.");
  const r = await fetch(`${API}${path}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!r.ok) {
    let detail = `${path} failed (${r.status})`;
    try { const json = await r.json(); if (json?.detail) detail = json.detail; } catch { /* ignore */ }
    throw new Error(detail);
  }
  return r.json();
}

async function get<T>(path: string): Promise<T> {
  if (!API) throw new Error("ReadmitAI API is not configured.");
  const r = await fetch(`${API}${path}`);
  if (!r.ok) throw new Error(`${path} failed (${r.status})`);
  return r.json();
}

export const isRealModelConfigured = Boolean(API);

export async function predict(p: Patient): Promise<Prediction> {
  if (API) return post<Prediction>("/predict", p);
  await new Promise((r) => setTimeout(r, 350));
  return scorePatient(p);
}

export type ModelsResponse = { selected: string; threshold: number; rows: Array<{ id: number; model: string; accuracy: number; precision: number; recall: number; f1: number; auc: number; selected?: boolean }>; split: string };
export async function getModels(): Promise<ModelsResponse | typeof models> { return API ? get<ModelsResponse>("/models") : models; }
export async function getFairness() { return API ? get<typeof fairness>("/fairness") : fairness; }
export async function getDataQuality() { return API ? get<typeof dataQuality>("/data-quality") : dataQuality; }
export async function getHealth() { return get<{ status: string; model_ready: boolean; dataset_present: boolean }>("/health"); }
