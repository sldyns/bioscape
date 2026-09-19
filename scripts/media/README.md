# BioScape media production

The README gallery and introductory film are rendered from the same Three.js models as the app. These are educational visualizations, not microscopy recordings or atomistic simulations. The film uses a separate camera and editorial composition; the interface screenshots are captured from the running app.

## Render the source frames

```sh
npm ci
node scripts/media/server.mjs
```

Open the URL printed by the server. The local studio runs only on `127.0.0.1:5174`. Choose **Render from selected** (starting at the first shot) to export every frame at 1920 × 1080, 30 fps. The studio also saves a composed still, a model-only still, and a manifest for each shot. Keep the browser open until the success message appears.

The default output folder is `/tmp/bioscape-media`. Override it with `BIOSCAPE_MEDIA_OUTPUT`. Frames are written as high-quality JPEGs so capture does not depend on browser video-encoder timing. Model meshes and materials retain their original detail. Temporary frames are not committed.

## Sound and finishing

```sh
python3 scripts/media/score.py
BIOSCAPE_FFMPEG=/path/to/ffmpeg node scripts/media/assemble.mjs
```

The score is an original procedural composition generated with Python's standard library: soft synthesized chords and bell tones, with no external recordings or samples. The assembly script requires FFmpeg with libx264 and AAC. It adds short dissolves, masters the music, and creates the final MP4 with streaming-friendly metadata. Set `BIOSCAPE_MEDIA_OUTPUT` consistently for all three commands when overriding the folder.

- `public/media/bioscape-film.mp4`: finished film, served by `public/film.html`.
- `public/media/cover.jpg`: film poster.
- `public/media/film.*.vtt`: optional bilingual subtitles describing the sequence.
- `docs/media/`: gallery renders and actual application screenshots.

The film, composition, original soundtrack and original project renders carry the project's [noncommercial license](../../LICENSE). Experimental structures and other third-party material retain the terms listed in [THIRD_PARTY_NOTICES.md](../../THIRD_PARTY_NOTICES.md).

## Visual checks before publishing

Inspect every shot for clipping, legible text and correct scientific scope. Decode the complete MP4 to check its integrity, then preview the real player with audio and subtitles. Verify the README's relative image links and the live player after deployment. The production studio is a development tool and is not included in the application bundle.
