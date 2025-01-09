import bodyParser from 'body-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import moment from 'moment';
import { dirname, join } from 'path';
import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { fileURLToPath } from 'url';
import { errorHandler } from './middlewares/errorMiddleware.js';
import {
	addLinkAnalytics,
	deleteAnlytics,
	getAnalytics,
} from './utils/analyticsUtils.js';
import {
	addLink,
	deleteByShortUrl,
	ensureUniqueShortUrl,
	findByShortUrl,
	formatShortUrl,
	readData,
	validateShortenRequest,
	writeData,
} from './utils/urlUtils.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(bodyParser.json());
app.use(cors());

const swaggerOptions = {
	definition: {
		openapi: '3.0.0',
		info: {
			title: 'URL Shortener API',
			version: '1.0.0',
			description: 'A simple URL shortening service API',
		},
		servers: [
			{
				url: `http://localhost:${PORT}`,
			},
		],
	},
	apis: ['./index.js'],
};

const swaggerDocs = swaggerJSDoc(swaggerOptions);

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

app.set('view engine', 'pug');
app.set('views', join(__dirname, 'views'));

app.use(express.static(join(__dirname, 'public')));

const allowedOrigins = ['https://shorturl.sbelaya.ru'];

app.use(
	cors({
		origin: function (origin, callback) {
			if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
				callback(null, true);
			} else {
				callback(new Error('Not allowed by CORS'));
			}
		},
	})
);

/**
 * @swagger
 * /:
 *   get:
 *     summary: Serve the index page
 *     responses:
 *       200:
 *         description: A simple index page
 */
app.get('/', (req, res) => {
	const backendUrl = process.env.BACKEND_URL;
	res.render('index', { backendUrl });
});

/**
 * @swagger
 * /shorten:
 *   post:
 *     summary: Create a shortened URL
 *     description: Accepts original URL and alias, returns a shortened URL.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               originalUrl:
 *                 type: string
 *               alias:
 *                 type: string
 *               expiresAt:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: URL shortened successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 shortUrl:
 *                   type: string
 *       400:
 *         description: Invalid input
 *       403:
 *         description: Alias already exists
 */
app.post('/shorten', async (req, res) => {
	const { error, value } = validateShortenRequest(req.body);

	if (error) {
		return res.status(400).json({ error: error.details[0].message });
	}

	const { originalUrl, alias, expiresAt } = value;

	let expiresAtDate = expiresAt ? moment(expiresAt).utc() : null;

	const shortUrl = await ensureUniqueShortUrl(alias);
	if (!shortUrl) {
		return res.status(403).json({
			message: 'Url with this alias already exists',
		});
	}

	if (!expiresAtDate) {
		expiresAtDate = moment().utc().add(1, 'days');
	}
	const newLink = addLink(originalUrl, shortUrl, expiresAtDate);

	return res.status(201).json({ shortUrl: newLink.shortUrl });
});

/**
 * @swagger
 * /{shortUrl}:
 *   get:
 *     summary: Redirect to the original URL
 *     parameters:
 *       - in: path
 *         name: shortUrl
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       301:
 *         description: Redirect to the original URL
 *       404:
 *         description: Short URL not found
 *       410:
 *         description: Link expired
 */
app.get('/:shortUrl', async (req, res) => {
	const { shortUrl } = req.params;
	const links = readData();
	const link = links.find((l) => l.shortUrl === formatShortUrl(shortUrl));

	if (!link) {
		return res.status(404).json({ error: 'Short URL not found' });
	}

	const currentTimeUtc = moment().utc();
	const expirationTimeUtc = moment(link.expiresAt).utc();

	if (link.expiresAt && currentTimeUtc.isAfter(expirationTimeUtc)) {
		return res.status(410).json({ error: 'Link expired' });
	}

	link.clickCount += 1;

	writeData(links);

	addLinkAnalytics(link.shortUrl, req.ip, moment().utc());

	res.redirect(link.originalUrl);
});

/**
 * @swagger
 * /info/{shortUrl}:
 *   get:
 *     summary: Get information about a shortened URL
 *     parameters:
 *       - in: path
 *         name: shortUrl
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: URL information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 originalUrl:
 *                   type: string
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 clickCount:
 *                   type: integer
 *                 expiresAt:
 *                   type: string
 *                   format: date-time
 *       404:
 *         description: Short URL not found
 */
app.get('/info/:shortUrl', async (req, res) => {
	const { shortUrl } = req.params;
	const link = findByShortUrl(shortUrl);

	if (!link) {
		return res.status(404).json({ error: 'Short URL not found' });
	}

	res.json({
		originalUrl: link.originalUrl,
		createdAt: link.createdAt,
		clickCount: link.clickCount,
		expiresAt: link.expiresAt,
	});
});

/**
 * @swagger
 * /delete/{shortUrl}:
 *   delete:
 *     summary: Delete a shortened URL
 *     parameters:
 *       - in: path
 *         name: shortUrl
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Short URL deleted successfully
 *       404:
 *         description: Short URL not found
 */
app.delete('/delete/:shortUrl', async (req, res) => {
	const { shortUrl } = req.params;

	const deleted = deleteByShortUrl(shortUrl);

	if (!deleted) {
		return res.status(404).json({ error: 'Short URL not found' });
	}

	deleteAnlytics(shortUrl);

	return res.status(200).json({ message: 'Short url deleted!' });
});

/**
 * @swagger
 * /analytics/{shortUrl}:
 *   get:
 *     summary: Get analytics for a shortened URL
 *     parameters:
 *       - in: path
 *         name: shortUrl
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Analytics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 clickCount:
 *                   type: integer
 *                 analytics:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       ip:
 *                         type: string
 *                       timestamp:
 *                         type: string
 *                         format: date-time
 *       404:
 *         description: Short URL not found
 */
app.get('/analytics/:shortUrl', async (req, res) => {
	const { shortUrl } = req.params;

	if (!shortUrl) {
		return res.status(404).json({ error: 'Short URL not found' });
	}

	const analytics = getAnalytics(shortUrl);
	if (!analytics || !analytics[0]?.shortUrl) {
		return res
			.status(404)
			.json({ error: 'Short URL analytics not found!' });
	}

	const latestAnalytics = analytics.slice(-5);

	return res
		.status(200)
		.json({ clickCount: analytics.length, analytics: latestAnalytics });
});

app.use(errorHandler);

app.listen(PORT, '0.0.0.0', () => {
	console.log(`Server is running on port ${PORT}`);
});

export default app;
