# video-bg-play-userscript

Auto-synced Tampermonkey/Violentmonkey userscript, generated from
[`mozilla/video-bg-play`](https://github.com/mozilla/video-bg-play)
(MIT licensed), adapted to run outside the Firefox WebExtension sandbox.

## How it works

- `scripts/build-lib.js` — pure transform logic (no network calls): rewrites
  `document.wrappedJSObject` → `document` (a Firefox-extension-only API not
  needed in a userscript context, since userscripts already run in the page's
  JS context), makes the visibility-property override resilient, and builds
  the `==UserScript==` header + embedded MIT license text.
- `scripts/build.js` — fetches the latest source + LICENSE from
  `mozilla/video-bg-play@master`, runs it through `build-lib.js`, and writes
  `dist/video-bg-play.user.js`.
- `.github/workflows/sync.yml` — runs the build every 6 hours (and on manual
  dispatch, and on pushes to `scripts/**`), compares the upstream commit SHA
  against the last-recorded one in `.upstream-sha`, and commits
  `dist/video-bg-play.user.js` only if upstream actually changed.

## Installing the userscript

Once this repo is set up and the workflow has run at least once, install by
pointing Tampermonkey/Violentmonkey at the raw file:

```
https://raw.githubusercontent.com/<your-username>/<your-repo>/main/dist/video-bg-play.user.js
```

Most userscript managers support "subscribing" to a raw URL like this and
will periodically check it for updates on their own — so once installed, you
generally don't need to reinstall it manually when this repo's sync workflow
pushes a new version.

## Local development / testing

```bash
node scripts/test-build-offline.js   # runs transform against fixture files, no network needed
node scripts/build.js                # real build, requires network access to github.com
```

## License

The generated userscript embeds the original MIT license from
`mozilla/video-bg-play` in its header comment, satisfying the license's
attribution requirement. This repo's own build scripts are not affiliated
with or endorsed by Mozilla.
