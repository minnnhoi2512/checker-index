import { Request, Response } from 'express';
import { Browser } from 'puppeteer';

export interface AuthenticatedRequest extends Request {
  user?: any;
}

export interface SearchResult {
  title: string;
  link: string;
}

export interface UrlCheckResult {
  url: string;
  isIndexed: boolean;
  searchResults?: SearchResult[];
  error?: string;
  lastChecked: string;
}

export interface ApiResponse<T> {
  status: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface CheckIndexingResponse {
  results: UrlCheckResult[];
  summary: {
    totalUrls: number;
    indexedUrls: number;
    notIndexedUrls: number;
  };
}

export interface StatusCode {
  OK: number;
  BAD_REQUEST: number;
  INTERNAL_SERVER_ERROR: number;
} 