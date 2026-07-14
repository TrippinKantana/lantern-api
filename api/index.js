/**
 * Vercel serverless entrypoint.
 * `vercel-build` compiles TypeScript into dist/ before this is invoked.
 */
module.exports = require('../dist/index.js')
