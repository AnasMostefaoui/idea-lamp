import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
	const env = (locals as App.Locals).runtime?.env as (Env & { DB?: D1Database }) | undefined;

	// Parse form data
	let name = '';
	let message = '';
	let email = '';
	let honeypot = '';

	const contentType = request.headers.get('content-type') ?? '';

	if (contentType.includes('application/json')) {
		const body = await request.json().catch(() => ({})) as Record<string, string>;
		name      = (body.name      ?? '').trim();
		message   = (body.message   ?? '').trim();
		email     = (body.email     ?? '').trim();
		honeypot  = (body.website   ?? '').trim();
	} else {
		// FormData (default from HTML form)
		const fd = await request.formData().catch(() => null);
		if (!fd) return jsonError('Invalid request', 400);
		name     = ((fd.get('name')    as string | null) ?? '').trim();
		message  = ((fd.get('message') as string | null) ?? '').trim();
		email    = ((fd.get('email')   as string | null) ?? '').trim();
		honeypot = ((fd.get('website') as string | null) ?? '').trim();
	}

	// Honeypot — reject bots silently
	if (honeypot) {
		return jsonOk({ ok: true });
	}

	// Validation
	if (!name || name.length < 2 || name.length > 80) {
		return jsonError('Please enter a valid name (2–80 characters).', 422);
	}
	if (!message || message.length < 10 || message.length > 1000) {
		return jsonError('Please enter a message between 10 and 1000 characters.', 422);
	}
	if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
		return jsonError('Please enter a valid email address.', 422);
	}

	// Persist to D1
	const db = env?.DB;
	if (!db) {
		// D1 not configured — accept gracefully during development
		console.warn('[fan-mail] D1 binding not available, message not persisted.');
		return jsonOk({ ok: true });
	}

	try {
		await db
			.prepare(
				`INSERT INTO fan_messages (name, email, message) VALUES (?, ?, ?)`
			)
			.bind(
				name,
				email || null,
				message,
			)
			.run();
	} catch (err) {
		console.error('[fan-mail] DB error:', err);
		return jsonError('Something went wrong. Please try again later.', 500);
	}

	return jsonOk({ ok: true });
};

function jsonOk(body: unknown) {
	return new Response(JSON.stringify(body), {
		status: 200,
		headers: { 'Content-Type': 'application/json' },
	});
}

function jsonError(message: string, status: number) {
	return new Response(JSON.stringify({ error: message }), {
		status,
		headers: { 'Content-Type': 'application/json' },
	});
}
