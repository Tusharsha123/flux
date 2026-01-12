

# Run and deploy your AI Studio app

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Run the app:
   `npm run dev`

## Why We Built It This Way

Recording: Pure browser MediaRecorder API (getDisplayMedia for screen + getUserMedia for mic). Merges streams, chunks WebM blobs on stop. No server needed—feels instant.

Trimming: @ffmpeg/ffmpeg WASM runs -ss [start] -to [end] client-side. WebM output or MP4 export. Keeps everything snappy, no upload-wait.

App Structure: Next.js 15 App Router. /record page owns UI/controls, /watch/[id] embeds player + stats, /api/upload handles presigned S3 POSTs (client uploads direct).

Storage/Analytics: Vercel Postgres for {id, viewCount, completionRate}. Simple SQL upserts on load/video.ended. Tailwind + shadcn/ui for clean, mobile-friendly buttons/timeline.

Tradeoffs: Client-heavy for MVP speed, but scales fine on Vercel Edge.

## Production Polish

Auth: NextAuth.js for logins, private clips, orgs.

Playback: Server ffmpeg → HLS/m3u8 for adaptive bitrate, seeking.

Reliability: BullMQ queues for uploads, Redis cache for hot analytics.

Extras: Thumbs on upload, edit timeline history, download button.

Ops: Cloudflare R2 (cheaper), Sentry errors, rate limits, CSP headers.

Perf: Lazy-load FFmpeg (big WASM), progressive enhancement if JS off.

Built for demo, ready for 1k users/day. Ping me for code walkthru!
