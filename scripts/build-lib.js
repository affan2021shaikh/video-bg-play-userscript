'use strict';

const OWNER = 'mozilla';
const REPO = 'video-bg-play';
const SOURCE_PATH = 'video-bg-play-content.js';

function transformSource(src) {
  // Strip a leading 'use strict' from the upstream file since our IIFE
  // wrapper already adds its own; avoids a harmless but sloppy duplicate.
  src = src.replace(/^\s*['"]use strict['"];\s*\n/, '');

  // The original content script targets Firefox's WebExtension sandbox, where
  // document.wrappedJSObject reaches into the page's real JS context from the
  // isolated content-script context. Plain userscripts (Tampermonkey/
  // Violentmonkey with @grant none) already execute in the page context, so
  // `document` itself is the right target.
  let out = src.replace(/document\.wrappedJSObject/g, 'document');

  // Make the defineProperties call resilient (configurable) since userscript
  // managers may re-run scripts across SPA navigations, and to avoid throwing
  // if YouTube's own code touches these properties later.
  out = out.replace(
    /Object\.defineProperties\(document,\s*\n?\s*\{\s*'hidden':\s*\{value:\s*false\},\s*'visibilityState':\s*\{value:\s*'visible'\}\s*\}\);/,
    `try {
    Object.defineProperties(document, {
      hidden: { value: false, configurable: true },
      visibilityState: { value: 'visible', configurable: true },
    });
  } catch (e) {
    console.warn('video-bg-play: could not override visibility state', e);
  }`
  );

  return out;
}

function buildHeader({ upstreamSha, license }) {
  const licenseComment = license
    .trim()
    .split('\n')
    .map((line) => ` * ${line}`)
    .join('\n');

  return `// ==UserScript==
// @name         Video Background Play (auto-synced)
// @namespace    https://github.com/${OWNER}/${REPO}
// @version      1.0.${upstreamSha ? upstreamSha.slice(0, 7) : '0'}
// @description  Keeps YouTube/Vimeo playing in background tabs. Auto-generated from mozilla/video-bg-play@${upstreamSha || 'unknown'}.
// @author       Mozilla Corporation (original); auto-synced userscript build
// @match        *://*.youtube.com/*
// @match        *://*.youtube-nocookie.com/*
// @match        *://*.vimeo.com/*
// @grant        none
// @run-at       document-start
// @supportURL   https://github.com/${OWNER}/${REPO}/issues
// ==/UserScript==

/*
 * Adapted from ${OWNER}/${REPO}
 * https://github.com/${OWNER}/${REPO}
 * Upstream commit: ${upstreamSha || 'unknown'}
 * Source file: ${SOURCE_PATH}
 *
${licenseComment}
 */

(function () {
  'use strict';

`;
}

module.exports = { transformSource, buildHeader, OWNER, REPO, SOURCE_PATH };
