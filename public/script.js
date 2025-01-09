document.addEventListener('DOMContentLoaded', () => {
	const shortenForm = document.getElementById('shorten-form');
	const analyticsForm = document.getElementById('analytics-form');
	const deleteForm = document.getElementById('delete-form');
	const infoForm = document.getElementById('info-form');
	const backendUrl = 'https://shorturl.sbelaya.ru';

	function displayMessage(elementId, message, isError = false) {
		const element = document.getElementById(elementId);
		element.innerHTML = message;
		element.style.color = isError ? 'red' : 'black';
	}

	shortenForm.addEventListener('submit', async (e) => {
		e.preventDefault();

		const originalUrl = document.getElementById('originalUrl');
		const alias = document.getElementById('alias');
		const expiresAt = document.getElementById('expiresAt');
		const shortenedUrlSpan = document.getElementById('shortened-url');
		const copyButton = document.getElementById('copy-button');

		let expiresAtUtc = null;
		if (expiresAt.value) {
			const localTime = new Date(expiresAt.value);
			expiresAtUtc = new Date(
				localTime.getTime() + localTime.getTimezoneOffset() * 60000
			).toISOString();
		}

		const response = await fetch(`${backendUrl}/shorten`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				originalUrl: originalUrl.value,
				alias: alias.value ? alias.value : undefined,
				expiresAt: expiresAtUtc,
			}),
		});

		const data = await response.json();
		if (response.ok) {
			shortenedUrlSpan.textContent = `Shortened URL: ${data.shortUrl}`;
			shortenedUrlSpan.style.display = 'inline';
			copyButton.hidden = false;
			copyButton.dataset.url = data.shortUrl;
		} else {
			shortenedUrlSpan.textContent = `Error: ${await data.message}`;
			shortenedUrlSpan.style.display = 'inline';
			copyButton.hidden = true;
		}

		originalUrl.value = '';
		alias.value = '';
		expiresAt.value = '';
	});

	document.getElementById('copy-button').addEventListener('click', () => {
		const urlToCopy = document.getElementById('copy-button').dataset.url;
		navigator.clipboard
			.writeText(urlToCopy)
			.then(() => {
				alert('Shortened URL copied to clipboard!');
			})
			.catch((err) => {
				alert('Failed to copy the URL: ' + err.message);
			});
	});

	analyticsForm.addEventListener('submit', async (e) => {
		e.preventDefault();
		const analyticsUrl = document.getElementById('analyticsUrl');
		const shortCode = analyticsUrl.value.split('/').pop();

		try {
			const response = await fetch(
				`${backendUrl}/analytics/${shortCode}`
			);
			const data = await response.json();

			if (response.ok) {
				const analyticsHtml = `
					<p><strong>Click Count:</strong> ${data.clickCount}</p>
					<h3>Last 5 Access Records:</h3>
					<table>
						<thead>
							<tr>
								<th>#</th>
								<th>IP Address</th>
								<th>Access Date</th>
							</tr>
						</thead>
						<tbody>
							${data.analytics
								.map(
									(record, index) => `
								<tr>
									<td>${index + 1}</td>
									<td>${record.ip}</td>
									<td>${new Date(record.openedDate).toLocaleString()}</td>
								</tr>`
								)
								.join('')}
						</tbody>
					</table>
				`;
				displayMessage('analytics-result', analyticsHtml);
			} else {
				displayMessage(
					'analytics-result',
					`Error: ${data.error}`,
					true
				);
			}
		} catch (error) {
			displayMessage('analytics-result', `Error: ${error.message}`, true);
		}

		analyticsUrl.value = '';
	});

	deleteForm.addEventListener('submit', async (e) => {
		e.preventDefault();
		const deleteUrl = document.getElementById('deleteUrl');
		const shortCode = deleteUrl.value.split('/').pop();

		const response = await fetch(`${backendUrl}/delete/${shortCode}`, {
			method: 'DELETE',
		});
		const data = await response.json();

		if (response.ok) {
			displayMessage('delete-result', 'URL deleted successfully!');
		} else {
			displayMessage('delete-result', `Error: ${data.error}`, true);
		}

		deleteUrl.value = '';
	});

	infoForm.addEventListener('submit', async (e) => {
		e.preventDefault();
		const infoUrl = document.getElementById('infoUrl');

		try {
			const shortCode = infoUrl.value.split('/').pop();

			const response = await fetch(`${backendUrl}/info/${shortCode}`);

			if (response.ok) {
				const data = await response.json();

				displayMessage(
					'info-result',
					`Original URL: ${data.originalUrl}, Click count: ${data.clickCount}, Expires At: ${data.expiresAt}`
				);
			} else {
				const errorData = await response.json();
				displayMessage(
					'info-result',
					`Error: ${errorData.error || response.statusText}`,
					true
				);
			}
		} catch (err) {
			console.log(err);
			displayMessage('info-result', `Error: ${err.message}`, true);
		}

		infoUrl.value = '';
	});
});
