// ==UserScript==
// @name         Video Background Play (auto-synced)
// @namespace    https://github.com/mozilla/video-bg-play
// @version      1.0.d1642dc
// @description  Keeps YouTube/Vimeo playing in background tabs. Auto-generated from mozilla/video-bg-play@d1642dc8dfe6f814578f85eda6eb1f1f7590568b.
// @author       Mozilla Corporation (original); auto-synced userscript build
// @match        *://*.youtube.com/*
// @match        *://*.youtube-nocookie.com/*
// @match        *://*.vimeo.com/*
// @grant        none
// @run-at       document-start
// @supportURL   https://github.com/mozilla/video-bg-play/issues
// ==/UserScript==

/*
 * Adapted from mozilla/video-bg-play
 * https://github.com/mozilla/video-bg-play
 * Upstream commit: d1642dc8dfe6f814578f85eda6eb1f1f7590568b
 * Source file: video-bg-play-content.js
 *
 * Copyright (c) 2017 Mozilla Corporation
 * 
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 * 
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

(function () {
  'use strict';

  const IS_YOUTUBE = window.location.hostname.search(/(?:^|.+\.)youtube\.com/) > -1 ||
                     window.location.hostname.search(/(?:^|.+\.)youtube-nocookie\.com/) > -1;
  const IS_MOBILE_YOUTUBE = window.location.hostname == 'm.youtube.com';
  const IS_DESKTOP_YOUTUBE = IS_YOUTUBE && !IS_MOBILE_YOUTUBE;
  const IS_VIMEO = window.location.hostname.search(/(?:^|.+\.)vimeo\.com/) > -1;

  const IS_ANDROID = window.navigator.userAgent.indexOf('Android') > -1;

  // Page Visibility API
  if (IS_ANDROID || !IS_DESKTOP_YOUTUBE) {
    try {
      Object.defineProperties(document, {
        hidden: { value: false, configurable: true },
        visibilityState: { value: 'visible', configurable: true },
      });
    } catch (e) {
      console.warn('video-bg-play: could not override visibility state', e);
    }
  }

  window.addEventListener(
    'visibilitychange', evt => evt.stopImmediatePropagation(), true);

  // Fullscreen API
  if (IS_VIMEO) {
    window.addEventListener(
      'fullscreenchange', evt => evt.stopImmediatePropagation(), true);
  }

  // User activity tracking
  if (IS_YOUTUBE) {
    loop(pressKey, 60 * 1000, 10 * 1000); // every minute +/- 5 seconds
  }

  function pressKey() {
    const keyCodes = [18];
    let key = keyCodes[getRandomInt(0, keyCodes.length)];
    sendKeyEvent("keydown", key);
    sendKeyEvent("keyup", key);
  }

  function sendKeyEvent (aEvent, aKey) {
    document.dispatchEvent(new KeyboardEvent(aEvent, {
      bubbles: true,
      cancelable: true,
      keyCode: aKey,
      which: aKey,
    }));
  }

  function loop(aCallback, aDelay, aJitter) {
    let jitter = getRandomInt(-aJitter/2, aJitter/2);
    let delay = Math.max(aDelay + jitter, 0);

    window.setTimeout(() => {
                        aCallback();
                        loop(aCallback, aDelay, aJitter);
                      }, delay);
  }

  function getRandomInt(aMin, aMax) {
    let min = Math.ceil(aMin);
    let max = Math.floor(aMax);
    return Math.floor(Math.random() * (max - min)) + min;
  }

})();
// last checked: 2026-07-17T12:42:35Z
