// server.js
import express from 'express';
import sirv from 'sirv';
import compression from 'koa-compress';
import { createServer } from 'http';
import * as sapper from '@sapper/server'; // Use @sapper/server


const app = express();

// Use compression for performance
app.use(compression({ threshold: 0 }));

// Serve static assets from the 'static' directory
app.use('/static', express.static('static'));

// Use SvelteKit's adapter to serve the app
app.use(sirv('static', { single: true }));
app.use(sapper.middleware());

// Serve the SvelteKit app from the 'build' directory
app.use(sirv('build', { single: true }));

const server = createServer(app);

// Define the port to listen on
const port = process.env.PORT || 5173;

server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
