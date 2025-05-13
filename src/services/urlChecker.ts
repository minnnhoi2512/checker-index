import puppeteer, { Browser } from 'puppeteer';
import { SearchResult, UrlCheckResult } from '../types';
import { PUPPETEER_LAUNCH_OPTIONS } from '../constants';

export class UrlChecker {
  private browser: Browser | null = null;

  async initialize(): Promise<void> {
    this.browser = await puppeteer.launch(PUPPETEER_LAUNCH_OPTIONS);
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  async checkUrl(parsedUrl: URL): Promise<UrlCheckResult> {
    if (!this.browser) {
      throw new Error('Browser not initialized');
    }

    const page = await this.browser.newPage();

    try {
      // Add more realistic browser behavior
      await page.evaluateOnNewDocument(() => {
        // Override navigator properties
        Object.defineProperty((window as any).navigator, 'webdriver', { get: () => undefined });
        Object.defineProperty((window as any).navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
        Object.defineProperty((window as any).navigator, 'languages', { get: () => ['en-US', 'en'] });
        
        // Add Chrome-specific properties
        (window as any).chrome = {
          runtime: {},
          loadTimes: function() {},
          csi: function() {},
          app: {}
        };
      });

      // Set realistic headers
      await page.setExtraHTTPHeaders({
        'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'accept-language': 'en-US,en;q=0.9',
        'sec-ch-ua': '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': 'document',
        'sec-fetch-mode': 'navigate',
        'sec-fetch-site': 'none',
        'sec-fetch-user': '?1',
        'upgrade-insecure-requests': '1'
      });

      // Set viewport
      await page.setViewport({ width: 1920, height: 1080 });

      // Add random delay before search
      await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 1000));

      // Navigate to Google and search
      const searchQuery = `site:${parsedUrl.hostname}${parsedUrl.pathname}${parsedUrl.search}`;
      await page.goto(`https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`, {
        waitUntil: 'networkidle0',
        timeout: 15000,
      });

      // Add random delay after page load
      await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));

      // Extract results
      const searchResults = await page.evaluate(() => {
        const results: SearchResult[] = [];
        const elements = (document as any).querySelectorAll('div[role="main"] h3');
        const links = (document as any).querySelectorAll('div[role="main"] a');

        for (let i = 0; i < Math.min(elements.length, links.length); i++) {
          const title = elements[i]?.textContent?.trim() || '';
          const link = (links[i] as any)?.href || '';
          if (title && link) {
            results.push({ title, link });
          }
        }
        return results;
      });

      const inputHost = parsedUrl.hostname.replace(/^www\./, '');
      const isIndexed = searchResults.some(result => {
        try {
          const resultHost = new URL(result.link).hostname.replace(/^www\./, '');
          return resultHost === inputHost;
        } catch {
          return false;
        }
      });

      return {
        url: parsedUrl.toString(),
        isIndexed,
        searchResults: searchResults.slice(0, 5),
        lastChecked: new Date().toISOString(),
      };
    } catch (error) {
      console.error(`Error checking URL ${parsedUrl.toString()}:`, error);
      return {
        url: parsedUrl.toString(),
        isIndexed: false,
        error: (error as Error).message,
        lastChecked: new Date().toISOString(),
      };
    } finally {
      await page.close();
    }
  }
} 