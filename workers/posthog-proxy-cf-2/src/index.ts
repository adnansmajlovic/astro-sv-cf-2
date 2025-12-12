export interface Env {
	API_HOST: string;
	ASSET_HOST: string;
}
async function handleRequest(request: Request, ctx: ExecutionContext, env: Env) {
	const url = new URL(request.url);
	const pathname = url.pathname;
	const search = url.search;
	const pathWithParams = pathname + search;

	if (pathname.startsWith('/static/')) {
		return retrieveStatic(request, pathWithParams, ctx, env);
	} else {
		return forwardRequest(request, pathWithParams, env);
	}
}

async function retrieveStatic(request: Request, pathname: string, ctx: ExecutionContext, env: Env) {
	let response = await caches.default.match(request);
	if (!response) {
		response = await fetch(`https://${env.ASSET_HOST}${pathname}`);
		ctx.waitUntil(caches.default.put(request, response.clone()));
	}
	return response;
}

async function forwardRequest(request: Request, pathWithSearch: string, env: Env) {
	const ip = request.headers.get('CF-Connecting-IP') || '';
	const originHeaders = new Headers(request.headers);
	originHeaders.delete('cookie');
	originHeaders.set('X-Forwarded-For', ip);

	const originRequest = new Request(`https://${env.API_HOST}${pathWithSearch}`, {
		method: request.method,
		headers: originHeaders,
		body: request.body,
		redirect: request.redirect,
	});

	return await fetch(originRequest);
}

export default {
	async fetch(request, env, ctx) {
		return handleRequest(request, ctx, env);
	},
} satisfies ExportedHandler<Env>;
