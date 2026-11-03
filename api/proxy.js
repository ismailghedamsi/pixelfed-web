// Same-origin proxy for Pixelfed instance API calls.
//
// Pixelfed instances send no CORS headers, so a browser app can never
// call them directly. The Blazor WebAssembly client routes every
// instance call to /proxy/<instance-host>/<api path> on THIS origin
// (see PixelfedUri.ProxyBaseTemplate), vercel.json rewrites that here,
// and this function forwards the request to the instance server-side
// and returns the response untouched.
//
// It forwards only the Authorization and Content-Type headers plus the
// raw body — nothing is logged or stored. Host must be a plain public
// hostname; the fetch always goes to https://<host>/.

export const config = { api: { bodyParser: false } };

const HOST_PATTERN = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/i;

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  const host = req.query.host;
  const path = (req.query.path || '').replace(/^\/+/, '');

  if (typeof host !== 'string' || !HOST_PATTERN.test(host)) {
    res.status(400).json({ error: 'Invalid instance host.' });
    return;
  }

  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(req.query)) {
    if (key === 'host' || key === 'path') continue;
    if (Array.isArray(value)) value.forEach((v) => query.append(key, v));
    else if (value !== undefined) query.append(key, value);
  }
  const target = `https://${host}/${path}${query.toString() ? `?${query}` : ''}`;

  const headers = { accept: req.headers.accept || 'application/json' };
  if (req.headers.authorization) headers.authorization = req.headers.authorization;
  if (req.headers['content-type']) headers['content-type'] = req.headers['content-type'];

  let body;
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    body = await readRawBody(req);
    if (body.length === 0) body = undefined;
  }

  let upstream;
  try {
    upstream = await fetch(target, { method: req.method, headers, body, redirect: 'manual' });
  } catch {
    res.status(502).json({ error: `Could not reach ${host}.` });
    return;
  }

  res.status(upstream.status);
  const contentType = upstream.headers.get('content-type');
  if (contentType) res.setHeader('content-type', contentType);
  const link = upstream.headers.get('link');
  if (link) res.setHeader('link', link);
  const location = upstream.headers.get('location');
  if (location) res.setHeader('location', location);

  const buffer = Buffer.from(await upstream.arrayBuffer());
  res.send(buffer);
}
