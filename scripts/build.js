#!/usr/bin/env node
'use strict';

/**
 * Fetches the latest video-bg-play-content.js and LICENSE from
 * mozilla/video-bg-play and generates a Tampermonkey/Violentmonkey-compatible
 * userscript, adapted to run outside the Firefox WebExtension sandbox.
 *
 * Run with: node scripts/build.js
 *
 * Writes:
 *   - dist/video-bg-play.user.js   (the generated userscript)
 *   - .upstream-sha                (the upstream commit SHA baked into the build,
 *                                    used by the workflow to detect changes)
 *
 * Pure transform/templating logic lives in build-lib.js so it can be unit
 * tested offline (see scripts/test-build-offline.js) without hitting the
 * network.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { transformSource, buildHeader, OWNER, REPO, SOURCE_PATH } = require('./build-lib.js');

const BRANCH = 'master';
const LICENSE_PATH = 'LICENSE';

const RAW_BASE = `https://raw.githubusercontent.com/${OWNER}/${REPO}/${BRANCH}`;
const API_COMMITS = `https://api.github.com/repos/${OWNER}/${REPO}/commits?path=${SOURCE_PATH}&sha=${BRANCH}&per_page=1`;

const OUT_DIR = path.join(__dirname, '..', 'dist');
const OUT_FILE = path.join(OUT_DIR, 'video-bg-play.user.js');
const SHA_FILE = path.join(__dirname, '..', '.upstream-sha');

function httpGet(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = https.get(
      url,
      {
        headers: Object.assign(
          {
            'User-Agent': 'video-bg-play-userscript-sync',
            Accept: 'application/vnd.github+json',
          },
          headers
        ),
      },
      (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return resolve(httpGet(res.headers.location, headers));
        }
        if (res.statusCode !== 200) {
          return reject(new Error(`GET ${url} failed: ${res.statusCode}`));
        }
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => resolve(data));
      }
    );
    req.on('error', reject);
  });
}

async function main() {
  console.log(`Fetching ${SOURCE_PATH} from ${OWNER}/${REPO}@${BRANCH}...`);
  const [source, license] = await Promise.all([
    httpGet(`${RAW_BASE}/${SOURCE_PATH}`),
    httpGet(`${RAW_BASE}/${LICENSE_PATH}`),
  ]);

  let upstreamSha = null;
  try {
    const commits = JSON.parse(await httpGet(API_COMMITS));
    upstreamSha = commits[0] && commits[0].sha;
  } catch (e) {
    console.warn('Could not resolve upstream commit SHA (rate-limited?):', e.message);
  }

  const transformed = transformSource(source);
  const header = buildHeader({ upstreamSha, license });
  const footer = `\n})();\n`;

  // Indent the body to sit inside the IIFE cleanly.
  const indentedBody = transformed
    .split('\n')
    .map((line) => (line.length ? '  ' + line : line))
    .join('\n');

  const output = header + indentedBody + footer;

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(OUT_FILE, output, 'utf8');
  console.log(`Wrote ${OUT_FILE}`);

  if (upstreamSha) {
    fs.writeFileSync(SHA_FILE, upstreamSha + '\n', 'utf8');
    console.log(`Recorded upstream SHA ${upstreamSha} in ${SHA_FILE}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
