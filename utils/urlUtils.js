import dotenv from 'dotenv';
import { readFileSync, writeFileSync } from 'fs';
import Joi from 'joi';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.resolve(__dirname, '../urls.json');
const BASE_URL = process.env.BACKEND_URL || 'http://localhost:5000';

export const formatShortUrl = (url) => {
	return `${BASE_URL}/${url}`;
};

export const generateShortUrl = (alias = null) => {
	return alias
		? `${BASE_URL}/${alias}`
		: `${BASE_URL}/${Math.random().toString(36).substring(2, 8)}`;
};

export const validateShortenRequest = (data) => {
	const schema = Joi.object({
		originalUrl: Joi.string().uri().required(),
		alias: Joi.string().max(20).optional(),
		expiresAt: Joi.date().optional(),
	});

	return schema.validate(data);
};

export const ensureUniqueShortUrl = async (alias) => {
	while (true) {
		const existing = findByShortUrl(alias);
		if (!existing) {
			const shortUrl = generateShortUrl(alias);
			return shortUrl;
		}

		if (existing) {
			return false;
		}
	}
};

export const readData = () => {
	try {
		const data = readFileSync(filePath, 'utf8');
		return JSON.parse(data);
	} catch (err) {
		console.error('Error reading data:', err);
		return [];
	}
};

export const writeData = (data) => {
	try {
		writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
	} catch (err) {
		console.error('Error writing data:', err);
	}
};

export const findByShortUrl = (shortUrl) => {
	const data = readData();
	return data.find((link) => link.shortUrl === formatShortUrl(shortUrl));
};

export const addLink = (originalUrl, shortUrl, expiresAt) => {
	const data = readData();
	const newLink = {
		originalUrl,
		shortUrl,
		expiresAt: expiresAt || null,
		clickCount: 0,
		createdAt: new Date(),
	};
	data.push(newLink);
	writeData(data);
	return newLink;
};

export const deleteByShortUrl = (shortUrl) => {
	const data = readData();
	const filteredData = data.filter(
		(link) => link.shortUrl !== formatShortUrl(shortUrl)
	);
	writeData(filteredData);
	return filteredData.length !== data.length;
};
