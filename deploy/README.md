# Deploy — apply design system to `fundingshield` codebase

This folder mirrors the **exact paths** in your `fundingshield/` Next.js repo. Copy its contents on top of the repo root, commit, push — Vercel auto-deploys.

## What's in here

```
deploy/
├── src/app/globals.css          ← REPLACES fundingshield/src/app/globals.css
└── public/fonts/Aptos.ttf       ← NEW file (add to fundingshield/public/fonts/)
```

## Changes vs. current globals.css

| Before                                             | After                                                       |
| -------------------------------------------------- | ----------------------------------------------------------- |
| Inter from Google Fonts                            | Aptos via `@font-face`, Geist Mono kept for numbers         |
| Glass bg `rgba(255,255,255, 0.05–0.11)` (visible white wash) | `rgba(255,255,255, 0.035–0.075)` — near-colorless          |
| `backdrop-filter: blur(28px) saturate(180%)`       | `blur(32px) saturate(200%) brightness(1.10)` — lens amplifies scene |
| No top-edge specular                                | `.card::before` adds the bright refraction line             |
| Indigo + teal ambient orbs at 20% opacity           | Neutral white orbs at 3–4% — glass stays clear              |
| Input bg white 6% (reads same as card)              | Input bg black 18% (reads as recessed/inset)                |

All token names (`--card`, `--surface`, `--border`, `--accent`, etc.) are unchanged, so no component JSX/TSX needs to be touched. Existing hover/focus/press states, spacing, radii, and easings are preserved.

## Deploy steps

### 1 — Copy the files

From **this project's root**:
```bash
# inside deploy/ there are two files/folders
deploy/src/app/globals.css
deploy/public/fonts/Aptos.ttf
```

Into **your fundingshield clone**:
```bash
cp deploy/src/app/globals.css       <fundingshield>/src/app/globals.css
mkdir -p <fundingshield>/public/fonts
cp deploy/public/fonts/Aptos.ttf    <fundingshield>/public/fonts/Aptos.ttf
```

(Or just download the zip from the chat and extract on top of your repo.)

### 2 — Commit & push

```bash
cd <fundingshield>
git add src/app/globals.css public/fonts/Aptos.ttf
git commit -m "design: iOS 26 clear liquid glass + Aptos brand face"
git push origin master
```

### 3 — Vercel auto-deploys

If the repo is already connected to Vercel, that's it — check your dashboard for the build. If not:

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import `tirthvohera9/fundingshield`
3. Accept defaults → **Deploy**
4. Every future `git push` to `master` re-deploys automatically.

### 4 — Verify

After deploy, the live site should show:
- Headings and body in **Aptos**
- **Clear glass** cards that let the dark background + any colored content bleed through
- A subtle bright **hairline at the top edge** of every card
- Deeper drop shadows so cards visibly float above the background

## Rollback

If anything looks off: `git revert HEAD && git push`. Vercel will redeploy the previous build in ~30 seconds.
