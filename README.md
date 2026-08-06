# Sherpa Travell

A [Next.js](https://nextjs.org) trek & expedition site for Sherpa Treks Nepal.

## Getting Started

```bash
npm install
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## Admin backend

There is a password-protected admin panel at **`/admin`** (login: `/admin/login`).

- Default credentials are `admin` / `sherpatravell1212!@` — override with the
  `ADMIN_USERNAME` and `ADMIN_PASSWORD` env vars.
- It supports **add, edit, delete** for treks and **image upload**.
- The **Gallery** section manages standalone scenes (photos) and films (videos),
  each with a title, caption and upload.
- Pages are protected by a proxy (Next 16 `src/proxy.ts`) plus per-API auth.

### How it works (no database)

| What            | Where it lives                                            |
| --------------- | --------------------------------------------------------- |
| Trek data       | `src/data/treks.json` — committed to Git                  |
| Gallery content | `src/data/galleryContent.json` — committed to Git         |
| Images / films  | [Vercel Blob](https://vercel.com/docs/storage/vercel-blob) (object storage) |

Writes go through the GitHub Contents API: the API reads the current JSON file
from your repo, applies the change, and commits it back. Pushing to the repo
triggers a Vercel auto-redeploy, so the public site picks up the edit. This
means **no SQL/NoSQL database is used**.

### Env vars

Copy `.env.example` to `.env.local` and fill in:

- `GITHUB_REPO` / `GITHUB_TOKEN` / `GITHUB_BRANCH` — for committing trek data
  (GitHub token needs `Contents` write scope).
- `BLOB_READ_WRITE_TOKEN` — for image uploads (Vercel injects this
  automatically in the dashboard).
- `ADMIN_SESSION_SECRET` — random value to sign session cookies.

### Deploy on Vercel

1. Push this repo to GitHub.
2. Import it at [vercel.com/new](https://vercel.com/new).
3. Add the env vars in Project → Settings → Environment Variables.
4. Create a Blob store in Storage → Blob and connect it.
5. Deploy. Open `https://<your-app>.vercel.app/admin` to manage treks.

## Learn More

- [Next.js Documentation](https://nextjs.org/docs) — learn about Next.js features.
- [Vercel Blob](https://vercel.com/docs/storage/vercel-blob) — image storage.

Check out [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
