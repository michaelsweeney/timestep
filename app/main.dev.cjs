// Dev entry shim for Electron 41 / Node 22.
//
// Electron's default_app.asar loads the entry via `await import()`, which
// routes through the ESM loader even for CJS files. With a .ts entry that
// path bypasses @babel/register's Module._extensions hook and Node tries
// to parse TS as CJS — instant SyntaxError on the first `import` statement.
//
// A .cjs entry forces the CJS load path. We register @babel/register first,
// then require the real TS entry: subsequent require('./menu') etc. now
// flow through the hook and transpile on-demand.
require('../internals/scripts/BabelRegister');
require('./main.dev.ts');
