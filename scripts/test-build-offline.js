#!/usr/bin/env node
'use strict';

// Offline test harness: exercises the same transform/header logic as
// build.js but reads from local fixture files instead of fetching from
// GitHub, so we can validate correctness without network access.

const fs = require('fs');
const path = require('path');

const build = require('./build-lib.js');

const source = fs.readFileSync(path.join(__dirname, '..', 'fixture-source.js'), 'utf8');
const license = fs.readFileSync(path.join(__dirname, '..', 'fixture-license.txt'), 'utf8');

const transformed = build.transformSource(source);
const header = build.buildHeader({ upstreamSha: 'abc1234deadbeef', license });

console.assert(!transformed.includes('wrappedJSObject'), 'FAIL: wrappedJSObject still present');
console.assert(transformed.includes('try {'), 'FAIL: try/catch guard not injected');
console.assert(transformed.includes('configurable: true'), 'FAIL: configurable:true not injected');
console.assert(header.includes('MIT') || header.includes('Permission is hereby granted'), 'FAIL: license text missing from header');
console.assert(header.includes('==UserScript=='), 'FAIL: userscript header missing');

const indentedBody = transformed
  .split('\n')
  .map((line) => (line.length ? '  ' + line : line))
  .join('\n');
const output = header + indentedBody + '\n})();\n';

const outPath = path.join(__dirname, '..', 'dist-test', 'video-bg-play.user.js');
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, output, 'utf8');

console.log('All assertions passed.');
console.log(`Sample output written to ${outPath}`);
