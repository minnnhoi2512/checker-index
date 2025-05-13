import { Response } from 'express';
import { AuthenticatedRequest, ApiResponse, CheckIndexingResponse } from '../types';
import { statusCode } from '../constants';
import { UrlChecker } from '../services/urlChecker';

export const checkUrlIndexing = async (
  req: AuthenticatedRequest,
  res: Response<ApiResponse<CheckIndexingResponse>>
): Promise<void> => {
  const urlChecker = new UrlChecker();
  
  try {
    const { urls } = req.body;

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      res.status(statusCode.BAD_REQUEST).json({
        status: false,
        message: "URLs array is required",
        error: "Missing field",
      });
      return;
    }

    // Validate URL format
    const parsedUrls: URL[] = [];
    try {
      for (const url of urls) {
        parsedUrls.push(new URL(url));
      }
    } catch {
      res.status(statusCode.BAD_REQUEST).json({
        status: false,
        message: "Invalid URL format in array",
        error: "Invalid field",
      });
      return;
    }

    await urlChecker.initialize();

    // Process URLs sequentially with delays between requests
    const results = [];
    for (const url of parsedUrls) {
      const result = await urlChecker.checkUrl(url);
      results.push(result);
      // Add delay between requests
      await new Promise(resolve => setTimeout(resolve, Math.random() * 3000 + 2000));
    }

    await urlChecker.close();

    res.status(statusCode.OK).json({
      status: true,
      message: "URLs indexing status checked successfully",
      data: {
        results,
        summary: {
          totalUrls: results.length,
          indexedUrls: results.filter(r => r.isIndexed).length,
          notIndexedUrls: results.filter(r => !r.isIndexed).length,
        },
      },
    });
  } catch (error) {
    await urlChecker.close();
    console.error('Error in checkUrlIndexing:', error);
    res.status(statusCode.INTERNAL_SERVER_ERROR).json({
      status: false,
      message: "Error checking URLs indexing status",
      error: (error as Error).message,
    });
  }
}; 