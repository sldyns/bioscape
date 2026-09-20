# BioScape media production

The README gallery and introductory film are rendered from the same Three.js models as the app. These are educational visualizations, not microscopy recordings or atomistic simulations. The film uses a separate camera and editorial composition; the interface screenshots are captured from the running app.

## Render the source frames

```sh
npm ci
node scripts/media/server.mjs
```

Open the URL printed by the server. The local studio runs only on `127.0.0.1:5174`. Choose **Render all · both editions** (starting at the first shot) to export both English and Chinese compositions for every frame at 1920 × 1080, 30 fps. The studio also saves a localized still for each edition, a shared model-only still, and a manifest for each shot. Both editions use the same full-detail 3D render; titles and supporting copy are composed separately. The Edition control switches the preview; export buttons always save both languages. Keep the browser open until the success message appears.

The default output folder is `/tmp/bioscape-media`. Override it with `BIOSCAPE_MEDIA_OUTPUT`. Frames are written as high-quality JPEGs so capture does not depend on browser video-encoder timing. Model meshes and materials retain their original detail. Temporary frames are not committed.

## Sound and finishing

```sh
python3 scripts/media/score.py
BIOSCAPE_FFMPEG=/path/to/ffmpeg node scripts/media/assemble.mjs
```

The score is an original procedural composition generated with Python's standard library: soft synthesized chords and bell tones, with no external recordings or samples. The assembly script requires FFmpeg with libx264 and AAC. It adds short dissolves, masters the music, and creates the two final MP4s with streaming-friendly metadata. Set `BIOSCAPE_MEDIA_OUTPUT` consistently for all three commands when overriding the folder.

- `public/media/bioscape-en.mp4`, `bioscape-zh.mp4`: English and Chinese editions.
- `public/media/cover-en.jpg`, `cover-zh.jpg`: matching film posters.
- `public/film.html?lang=en` or `?lang=zh`: localized film player.
- `public/media/film.*.vtt`: captions describing each sequence.
- `docs/media/en/`, `docs/media/zh/`: actual application screenshots in the matching UI language.
- `docs/media/*.jpg`: shared model-only gallery renders, with no interface text.
- `docs/media/films.json`: published attachment URLs, checksums and source files.

The film, composition, original soundtrack and original project renders carry the project's [noncommercial license](../../LICENSE). Experimental structures and other third-party material retain the terms listed in [THIRD_PARTY_NOTICES.md](../../docs/legal/THIRD_PARTY_NOTICES.md).

## Visual checks before publishing

Inspect every shot for clipping, legible text and correct scientific scope. Decode the complete MP4 to check its integrity, then preview the real player with audio and subtitles. Verify the README's relative image links and the live player after deployment. The production studio is a development tool and is not included in the application bundle.

## GitHub video players

The READMEs contain bare GitHub `user-attachments/assets` video URLs on their own lines. GitHub renders these as native players. A linked poster, a Pages MP4 URL, and a release-download link are not equivalent.

Uploads can use GitHub CLI's authenticated attachment API without a browser session. The request contract is implemented in [GitHub CLI's attachment client](https://github.com/cli/cli/blob/trunk/internal/attachments/client.go): a binary POST to `https://uploads.github.com/user-attachments/assets`, with the filename, content type and numeric repository ID in the query. Use existing GitHub credentials, never commit them, and confirm the response is a GitHub attachment URL. See [GitHub's attachment documentation](https://docs.github.com/en/github-cli/github-cli/attaching-files-with-github-cli).

After publishing, verify that both READMEs render a real video player, that it plays, and that each player and screenshot uses the correct language. Only then remove temporary frames and superseded exports. Keep the source studio, current films and reference data.
