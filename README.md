# Cyber Portfolio

A technical portfolio built to make the work easy to inspect: cloud and DevOps
experience, shipped client sites, an AWS-backed SSH arcade fleet, and browser
experiments that reward a little curiosity.

The interface is deliberately dark, direct, and fast. Its interactive Unix-ish
shell is entirely client-side; visitors can explore a simulated filesystem
without executing anything on a server.

## What’s inside

- Case studies and live previews for production websites
- A project page covering CI/CD and infrastructure for an SSH arcade fleet
- A safe, persistent-in-the-browser fake shell with pipes, redirects, and tab completion
- Interactive experiments, including a playable Minesweeper implementation
- A contact endpoint, health check, sitemap, robots file, and structured metadata

## Stack

Next.js 16 · React 19 · TypeScript · Tailwind CSS 4 · Framer Motion · Vercel
Analytics and Speed Insights

## Develop locally

**Requirements:** Node.js 20.9 or later and npm.

```bash
git clone https://github.com/mynameis-nigel/nextjs-portfolio.git
cd nextjs-portfolio
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The development server
uses Turbopack and refreshes as files change.

Useful checks:

```bash
npm run lint
npm test
```

## Run a production build

Build first, then serve the optimized application:

```bash
npm ci
npm run build
npm start
```

`npm start` serves the build at [http://localhost:3000](http://localhost:3000)
by default. Set `PORT` before running it to use another port.

```bash
PORT=8080 npm start
```

The site is ready to deploy to any Node.js-compatible host. Vercel is the
native deployment target; connect the repository and it will run the build
command automatically.

## Environment variables

The portfolio renders without environment variables. Add these only when the
corresponding production capability is needed:

| Variable | Purpose |
| --- | --- |
| `DISCORD_WEBHOOK` | Delivers validated contact-form submissions to Discord. |
| `SELFCHECK_TOKEN` | Enables the detailed, bearer-token-protected response from `/_selfcheck`. |

Keep production values in the hosting provider’s encrypted environment settings
instead of committing them to the repository.

## Project layout

```text
src/
  app/             Routes, metadata, API endpoints, and static generation
  components/      Reusable presentation and project-specific UI
  data/            Typed content for projects, skills, and certifications
  features/        Isolated interactive features and their tests
docs/
  fake-shell.md    Design, safety model, and command reference for the fake shell
```

Content is intentionally data-driven: adding a project or updating a skill
usually means editing `src/data/`, not reshaping a page.

## Notes for contributors

- Use the existing TypeScript path alias: `@/*` maps to `src/*`.
- Keep browser-only interactive work isolated under `src/features/`.
- Read [`docs/fake-shell.md`](docs/fake-shell.md) before changing the shell;
  it documents its persistence and safety boundaries.
- New live interactive projects must be registered in both
  `src/features/interactive/registry-meta.ts` and
  `src/features/interactive/InteractiveAppHost.tsx`.
