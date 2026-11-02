# OUTPUT_CONTRACT — Required artifacts

Your submission is reviewed against the files under `output/`. Match these shapes exactly.

## Required files

```
/output/spritesheet.png
/output/manifest.json
/output/preview.html            ← the headline deliverable: a working interactive web app
/output/generation-log.json
/output/edited_base_image.png   ← output of the image-edit API call
/output/source_video.mp4        ← output of the video-generation API call
```

All six are required. The video file may be `.mp4`, `.webm`, or `.mov` — just record the actual filename in `manifest.sourceVideo`.

---

## `preview.html` — the headline deliverable

This is the artifact a human will actually look at. It must be a **standalone, runnable web app**, opened from `file://` or from a tiny static server you describe in `README.md`.

It must:

1. **Play the generated animation in a loop.**

2. **Provide a prompt input and a submit control.**
   - An `<input>` or `<textarea>` plus a `<button>` (or `<form>` with submit handler).

3. **Re-render with the edit applied when the prompt is submitted.**
   - The user must visually see the new animation without manually refreshing the browser.

If the re-edit loop does not actually update the animation, this artifact is incomplete.

---

## `spritesheet.png`

A single PNG containing the animation frames laid out in a grid (a single row or a `cols x rows` packing), extracted from `source_video.mp4` by sampling across the clip.

Requirements:

- Valid PNG, readable by standard image libraries (Sharp, pngjs, Pillow, browser `<img>`).
- Total width = `frameWidth * columns`, total height = `frameHeight * rows`.
- All frames share the **same** `frameWidth` and `frameHeight`.
- Not a solid-color blank image.
- Frames must come from the generated video, not from local pixel manipulation.

---

## `edited_base_image.png`

The still image returned by your image-generation / image-edit API call. This is the asset you pass into the video API. It must:

- Be a valid PNG (or JPEG renamed/converted to PNG).
- Visibly differ from the input (e.g. shirt color changed) — i.e. not be a byte-for-byte copy of `input_character_white_shirt.png`.
- Be the exact image you sent to the video API as the source/reference frame.

---

## `source_video.mp4`

The clip returned by your video-generation API call. It must:

- Be a non-empty video file (`.mp4`, `.webm`, or `.mov`).
- Be the file you extracted frames from.
- Be referenced from `manifest.sourceVideo`.

---

## `manifest.json`

A JSON file describing the spritesheet. Use exactly these field names. The example below is abbreviated to 8 frames for readability — a real submission will have ~150–300 frames listed.

```json
{
  "assetId": "character_walk_blue_shirt",
  "sourceImage": "input_character_white_shirt.png",
  "editPrompt": "Change the shirt to blue and generate a walking animation loop.",
  "frameCount": 8,
  "frameWidth": 256,
  "frameHeight": 256,
  "fps": 8,
  "loop": true,
  "spritesheet": "spritesheet.png",
  "frames": [
    { "index": 0, "x": 0,    "y": 0, "w": 256, "h": 256 },
    { "index": 1, "x": 256,  "y": 0, "w": 256, "h": 256 },
    { "index": 2, "x": 512,  "y": 0, "w": 256, "h": 256 },
    { "index": 3, "x": 768,  "y": 0, "w": 256, "h": 256 },
    { "index": 4, "x": 1024, "y": 0, "w": 256, "h": 256 },
    { "index": 5, "x": 1280, "y": 0, "w": 256, "h": 256 },
    { "index": 6, "x": 1536, "y": 0, "w": 256, "h": 256 },
    { "index": 7, "x": 1792, "y": 0, "w": 256, "h": 256 }
  ],
  "editsApplied": [
    "shirt_color_changed_to_blue",
    "walking_loop_generated"
  ],
  "editedBaseImage": "edited_base_image.png",
  "sourceVideo": "source_video.mp4",
  "validation": {
    "hasConsistentFrameSize": true,
    "hasValidFrameCount": true,
    "hasPlayableLoop": true
  },
  "provider": {
    "name": "openai",
    "model": "gpt-4.1",
    "usedRealApi": true
  }
}
```

### Field requirements

| Field | Rule |
|---|---|
| `assetId` | non-empty string |
| `sourceImage` | string, filename of the source image |
| `editPrompt` | non-empty string; must include the edit concept (e.g. `blue`) |
| `frameCount` | integer, must equal `frames.length`; aim for ~5 s of playback at `fps` (e.g. 150 at 30 fps, 300 at 60 fps); single-frame submissions will be rejected |
| `frameWidth` | integer, > 0 |
| `frameHeight` | integer, > 0 |
| `fps` | number, > 0 |
| `loop` | must be `true` |
| `spritesheet` | string filename, must resolve to `spritesheet.png` |
| `frames` | array, `length === frameCount` |
| `frames[i]` | `{ index, x, y, w, h }`, all integers >= 0 |
| `frames[*].index` | unique, covers `0..frameCount-1` |
| `frames[*]` | rectangle must fit inside spritesheet dimensions |
| `editsApplied` | array of short strings describing applied edits |
| `editedBaseImage` | string filename, must resolve to the still produced by the image API |
| `sourceVideo` | string filename, must resolve to the clip produced by the video API |
| `validation` | object with the three booleans above |
| `provider.name` | provider id (e.g. `openai`, `anthropic`, `gemini`, `replicate`, `stability`, `fal`, `huggingface`) |
| `provider.model` | model id (e.g. `gpt-4.1`, `claude-sonnet-4`, `gemini-2.5-pro`) |
| `provider.usedRealApi` | must be `true` if you actually called the API |

---

## `generation-log.json`

Proof the pipeline executed. Use exactly these field names.

`providerCalls` must contain **at least one entry with `type: "image"` and `success: true`** (the image-edit call) and **at least one entry with `type: "video"` and `success: true`** (the video-generation call). Additional LLM calls are allowed.

```json
{
  "startedAt": "2026-01-01T10:00:00.000Z",
  "completedAt": "2026-01-01T10:01:00.000Z",
  "inputImage": "input_character_white_shirt.png",
  "initialPrompt": "Change the shirt to blue and generate a walking animation loop.",
  "providerCalls": [
    {
      "provider": "openai",
      "model": "gpt-image-2",
      "type": "image",
      "timestamp": "2026-01-01T10:00:05.000Z",
      "success": true,
      "requestSummary": "Edited input character; recolored shirt to blue.",
      "responseSummary": "Returned 1024x1024 PNG of character with blue shirt."
    },
    {
      "provider": "fal",
      "model": "bytedance/seedance-2.5/image-to-video",
      "type": "video",
      "timestamp": "2026-01-01T10:00:30.000Z",
      "success": true,
      "requestSummary": "Generated walking-loop clip from edited base image.",
      "responseSummary": "Returned 5s mp4 at 24fps."
    }
  ],
  "errors": [],
  "warnings": [],
  "costEstimateUsd": 2.5
}
```

### Field requirements

| Field | Rule |
|---|---|
| `startedAt` / `completedAt` | ISO-8601 timestamps |
| `inputImage` | string filename |
| `initialPrompt` | non-empty string |
| `providerCalls` | array; must include **>= 1 entry with `type: "image"` and `success: true`** AND **>= 1 entry with `type: "video"` and `success: true`** |
| `providerCalls[*].provider` | non-empty string |
| `providerCalls[*].model` | non-empty string |
| `providerCalls[*].type` | one of: `llm`, `image`, `video`, `audio`, `other` |
| `providerCalls[*].timestamp` | ISO-8601 |
| `providerCalls[*].success` | boolean; at least one call must be `true` |
| `providerCalls[*].requestSummary` | short string, **no secrets, no raw request body** |
| `providerCalls[*].responseSummary` | short string, **no raw response body** |
| `errors` | array (may be empty) |
| `warnings` | array (may be empty) |
| `costEstimateUsd` | number, may be 0 |

**Do not include API keys, auth headers, or full request/response bodies.**

---
