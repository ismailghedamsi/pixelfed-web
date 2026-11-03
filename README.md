# Pixelfed Web Client — Vercel deployment

Prebuilt static output of the Blazor WebAssembly Pixelfed client
(source: `WebWasm/` in the pixelfed-windows-client repo). Vercel serves
the static files and runs `api/proxy.js`, which forwards
`/proxy/<instance-host>/...` calls to the user's Pixelfed instance
(instances send no CORS headers, so the browser cannot call them
directly). No build step: framework preset "Other", build command
empty, output directory ".".
