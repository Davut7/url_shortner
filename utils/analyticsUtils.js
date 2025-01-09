import dotenv from 'dotenv';
import { readFileSync, writeFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { formatShortUrl } from './urlUtils.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const filePath = resolve(__dirname, '../analytics.json');

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

export const addLinkAnalytics = (shortUrl, ip, openedDate) => {
	const data = readData();
	const newData = {
		shortUrl,
		ip,
		openedDate,
	};
	data.push(newData);
	writeData(data);
};

export const getAnalytics = (shortUrl) => {
	const data = readData();
	return data.filter((link) => link.shortUrl === formatShortUrl(shortUrl));
};

export const deleteAnlytics = (shortUrl) => {
	const data = readData();

	const filteredData = data.filter(
		(link) => link.shortUrl !== formatShortUrl(shortUrl)
	);

	writeData(filteredData);
	return;
};
