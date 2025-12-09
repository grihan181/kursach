import { apiFetch } from './api';

export interface QuoteRequest {
  weightKg: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  origin: string;
  destination: string;
  currency?: string;
}

export interface QuoteResponse {
  id?: string;
  amount: number;
  currency: string;
  etaDays?: number;
}

export async function fetchQuote(payload: QuoteRequest): Promise<QuoteResponse> {
  return apiFetch<QuoteResponse>('/pricing/quotes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
}
