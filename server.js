const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const https = require('https');

const PORT = parseInt(process.env.PORT, 10) || 3000;
const ROOT_DIR = __dirname;
const CACHED_IMAGES_DIR = path.join(ROOT_DIR, 'cached_images');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8'
};

function sendFileWithRange(req, res, filePath, contentType) {
  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      return res.end('404 Not Found');
    }

    const range = req.headers.range;
    const fileSize = stats.size;

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      if (start >= fileSize || end >= fileSize || start > end) {
        res.writeHead(416, {
          'Content-Range': `bytes */${fileSize}`,
          'Content-Type': 'text/plain'
        });
        return res.end('Requested Range Not Satisfiable');
      }

      const chunkSize = end - start + 1;
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable'
      });

      const stream = fs.createReadStream(filePath, { start, end });
      stream.pipe(res);
    } else {
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Accept-Ranges': 'bytes',
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable'
      });
      fs.createReadStream(filePath).pipe(res);
    }
  });
}

function handleNextImage(req, res, parsedUrl) {
  const imageUrl = parsedUrl.query.url;
  if (!imageUrl) {
    res.writeHead(400, { 'Content-Type': 'text/plain' });
    return res.end('Missing url parameter');
  }

  // Find photo ID in the URL
  const match = imageUrl.match(/photo-([0-9a-f\-]+)/i);
  let localFile = null;

  if (match) {
    const photoId = match[1];
    const candidate = path.join(CACHED_IMAGES_DIR, `${photoId}.jpg`);
    if (fs.existsSync(candidate)) {
      localFile = candidate;
    }
  }

  if (localFile) {
    return sendFileWithRange(req, res, localFile, 'image/jpeg');
  }

  // Fallback: Check if cached by full URL MD5 or fetch from remote
  const crypto = require('crypto');
  const hash = crypto.createHash('md5').update(imageUrl).digest('hex');
  const hashFile = path.join(CACHED_IMAGES_DIR, `${hash}.jpg`);

  if (fs.existsSync(hashFile)) {
    return sendFileWithRange(req, res, hashFile, 'image/jpeg');
  }

  // If not found, fetch live from Unsplash and cache
  https.get(imageUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (remoteRes) => {
    if (remoteRes.statusCode >= 200 && remoteRes.statusCode < 300) {
      const chunks = [];
      remoteRes.on('data', (c) => chunks.push(c));
      remoteRes.on('end', () => {
        const buffer = Buffer.concat(chunks);
        fs.writeFile(hashFile, buffer, () => {});
        res.writeHead(200, {
          'Content-Type': remoteRes.headers['content-type'] || 'image/jpeg',
          'Content-Length': buffer.length,
          'Cache-Control': 'public, max-age=31536000, immutable'
        });
        res.end(buffer);
      });
    } else {
      res.writeHead(remoteRes.statusCode || 502, { 'Content-Type': 'text/plain' });
      res.end('Failed to fetch remote image');
    }
  }).on('error', (err) => {
    res.writeHead(502, { 'Content-Type': 'text/plain' });
    res.end('Gateway Error: ' + err.message);
  });
}

const server = http.createServer((req, res) => {
  const reqUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  let pathname = decodeURIComponent(reqUrl.pathname);

  // Route: Next Image optimization
  if (pathname === '/_next/image') {
    const parsedQuery = { query: Object.fromEntries(reqUrl.searchParams) };
    return handleNextImage(req, res, parsedQuery);
  }

  // Route: opengraph-image
  if (pathname === '/opengraph-image') {
    const ogPath = path.join(ROOT_DIR, 'opengraph-image');
    return sendFileWithRange(req, res, ogPath, 'image/png');
  }

  // Route: root or HTML
  if (pathname === '/' || pathname === '') {
    const indexPath = path.join(ROOT_DIR, 'index.html');
    return sendFileWithRange(req, res, indexPath, 'text/html; charset=utf-8');
  }

  // Route: admin
  if (pathname === '/admin' || pathname === '/admin/') {
    const adminPath = path.join(ROOT_DIR, 'admin', 'index.html');
    return sendFileWithRange(req, res, adminPath, 'text/html; charset=utf-8');
  }

  // Map requested path to local filesystem
  // Prevent directory traversal attacks
  const safePath = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '');
  let filePath = path.join(ROOT_DIR, safePath);

  fs.stat(filePath, (err, stats) => {
    if (err) {
      // Try with .html extension
      const htmlPath = filePath + '.html';
      if (fs.existsSync(htmlPath)) {
        return sendFileWithRange(req, res, htmlPath, 'text/html; charset=utf-8');
      }

      res.writeHead(404, { 'Content-Type': 'text/plain' });
      return res.end('404 Not Found');
    }

    if (stats.isDirectory()) {
      const subIndex = path.join(filePath, 'index.html');
      if (fs.existsSync(subIndex)) {
        return sendFileWithRange(req, res, subIndex, 'text/html; charset=utf-8');
      }
      res.writeHead(403, { 'Content-Type': 'text/plain' });
      return res.end('403 Forbidden');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    sendFileWithRange(req, res, filePath, contentType);
  });
});

function startServer(port) {
  server.listen(port, () => {
    console.log(`\n==================================================`);
    console.log(`🚀 Geovanna Farias Portfolio - Clone 100% Idêntico`);
    console.log(`📡 Servidor rodando em: http://localhost:${port}`);
    console.log(`🎬 Rota Principal:      http://localhost:${port}/`);
    console.log(`⚙️  Rota Admin:          http://localhost:${port}/admin`);
    console.log(`==================================================\n`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`Porta ${port} ocupada, tentando ${port + 1}...`);
      startServer(port + 1);
    } else {
      console.error('Server error:', err);
    }
  });
}

startServer(PORT);
