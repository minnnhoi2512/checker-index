import express from 'express';
import cors from 'cors';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { PORT } from './constants';
import { checkUrlIndexing } from './controllers/urlController';

const app = express();

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'URL Indexing Checker API',
      version: '1.0.0',
      description: 'API to check if URLs are indexed in Google search results with advanced anti-detection measures',
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: 'Development server',
      },
    ],
  },
  apis: ['./src/*.ts'], // Path to the API docs
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Middleware
app.use(cors());
app.use(express.json());

/**
 * @swagger
 * /api/check-indexing:
 *   post:
 *     summary: Check if URLs are indexed in Google
 *     description: |
 *       Checks if the provided URLs are indexed in Google search results.
 *       Uses advanced anti-detection measures to avoid being blocked.
 *       Processes URLs sequentially with random delays between requests.
 *     tags: [URL Indexing]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - urls
 *             properties:
 *               urls:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of URLs to check
 *                 example: ["https://example.com", "https://test.com"]
 *     responses:
 *       200:
 *         description: Successfully checked URLs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     results:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           url:
 *                             type: string
 *                           isIndexed:
 *                             type: boolean
 *                           searchResults:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 title:
 *                                   type: string
 *                                 link:
 *                                   type: string
 *                           lastChecked:
 *                             type: string
 *                     summary:
 *                       type: object
 *                       properties:
 *                         totalUrls:
 *                           type: number
 *                         indexedUrls:
 *                           type: number
 *                         notIndexedUrls:
 *                           type: number
 *       400:
 *         description: Bad request - Invalid input
 *       500:
 *         description: Internal server error
 */
app.post('/api/check-indexing', checkUrlIndexing);

// Health check route
app.get('/', (req, res) => {
  res.json({ status: 'API is running' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 