import request from 'supertest';
import app from '../index.js';

describe('Short URL API', () => {
	let shortUrl;

	it('should create a short URL', async () => {
		const response = await request(app).post('/shorten').send({
			originalUrl: 'https://example.com',
			alias: 'testlink',
			expiresAt: '2026-01-01T00:00:00.000Z',
		});

		expect(response.status).toBe(201);
		expect(response.body.shortUrl).toBeDefined();
		shortUrl = response.body.shortUrl;
	});

	it('should redirect to the original URL', async () => {
		const response = await request(app).get(
			`/${shortUrl.split('/').pop()}`
		);

		expect(response.status).toBe(302);
		expect(response.header.location).toBe('https://example.com');
	});

	it('should get information about the short URL', async () => {
		const response = await request(app).get(
			`/info/${shortUrl.split('/').pop()}`
		);

		expect(response.status).toBe(200);
		expect(response.body.originalUrl).toBe('https://example.com');
		expect(response.body.clickCount).toBeDefined();
		expect(response.body.expiresAt).toBeDefined();
	});

	it('should get analytics for the short URL', async () => {
		await request(app).get(`/${shortUrl.split('/').pop()}`);

		const response = await request(app).get(
			`/analytics/${shortUrl.split('/').pop()}`
		);

		expect(response.status).toBe(200);
		expect(response.body.clickCount).toBeDefined();
		expect(response.body.analytics.length).toBeDefined();
	});

	it('should delete the short URL', async () => {
		const response = await request(app).delete(
			`/delete/${shortUrl.split('/').pop()}`
		);

		expect(response.status).toBe(200);
		expect(response.body.message).toBe('Short url deleted!');
	});

	it('should return 404 after deleting the short URL', async () => {
		const response = await request(app).get(
			`/info/${shortUrl.split('/').pop()}`
		);

		expect(response.status).toBe(404);
		expect(response.body.error).toBe('Short URL not found');
	});
});
