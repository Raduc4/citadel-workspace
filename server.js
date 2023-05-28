const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev, dir: __dirname, conf: { output: 'standalone' } });
const port = process.env.PORT || 1420;
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer((req, res) => {
    handle(req, res, parse(req.url, true).pathname);
  }).listen(port, (err) => {
    if (err) throw err;
    console.log('> Ready on http://localhost:1420');
  });
});
