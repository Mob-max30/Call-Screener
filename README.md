# Call Screener

A modern web application that screens incoming calls, blocks unwanted spam, and keeps your communication channels clear.

Call Screener pairs a responsive React frontend with a dedicated voice agent backend. The frontend gives the user a clean, animated interface for reviewing and controlling incoming calls, while the backend handles the voice and screening logic that decides what reaches the user and what does not.

## Table of Contents

1. [Overview](#overview)
2. [Key Capabilities](#key-capabilities)
3. [Technology Stack](#technology-stack)
4. [Architecture](#architecture)
5. [Repository Layout](#repository-layout)
6. [Prerequisites](#prerequisites)
7. [Getting Started](#getting-started)
8. [Configuration](#configuration)
9. [Available Scripts](#available-scripts)
10. [Backend Service](#backend-service)
11. [Development Workflow](#development-workflow)
12. [Build and Deployment](#build-and-deployment)
13. [Testing](#testing)
14. [Troubleshooting](#troubleshooting)
15. [Roadmap](#roadmap)
16. [Contributing](#contributing)
17. [License](#license)

## Overview

Unsolicited and spam calls waste time and erode trust in the phone as a communication channel. Call Screener addresses this by placing an intelligent screening layer between the caller and the user. Incoming calls are handled by a voice agent, evaluated, and surfaced to the user through a web interface, so that legitimate calls get through and unwanted ones are filtered out.

The project is organised as two cooperating parts:

* **Frontend.** A single page application built with React and Vite, styled with Tailwind CSS and animated with Framer Motion.
* **Voice agent backend.** A separate service, located in its own directory, that powers the voice and screening functionality the frontend depends on.

## Key Capabilities

* **Call screening.** Incoming calls are evaluated before they reach the user.
* **Spam blocking.** Unwanted callers are filtered out so that they do not interrupt the user.
* **Modern interface.** A polished, animated web interface built on current React and Tailwind CSS.
* **Separated concerns.** The user interface and the voice agent logic live in independent parts of the codebase, which keeps each one easier to develop, test, and deploy.
* **Developer friendly tooling.** Fast local development with Vite, Hot Module Replacement, and ESLint preconfigured.

## Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| UI framework | React 19 | Component based user interface |
| Build tool | Vite 8 | Development server, Hot Module Replacement, production bundling |
| Styling | Tailwind CSS 4 (via the official Vite plugin) | Utility first styling |
| Animation | Framer Motion | Transitions and interface animation |
| Icons | Lucide React | Consistent icon set |
| Linting | ESLint 10 with React Hooks and React Refresh rules | Code quality and consistency |
| Backend | Voice agent service in `voice-agent-backend` | Voice handling and call screening logic |

## Architecture

The system follows a straightforward client and service model.

1. An incoming call is received and handled by the voice agent backend.
2. The backend applies the screening logic and determines how the call should be treated.
3. The React frontend presents the outcome to the user and lets them act on it.
4. The user interface remains a thin, responsive layer, while the backend owns all voice and decision making responsibilities.

```
  Caller
     |
     v
  Voice Agent Backend   (voice and screening logic)
     |
     v
  React Frontend        (review, control, and visibility)
     |
     v
  User
```

## Repository Layout

| Path | Description |
| :--- | :--- |
| `src/` | Frontend application source: components, styles, and entry point |
| `public/` | Static assets served as is by Vite |
| `voice-agent-backend/` | Backend service that powers voice handling and call screening |
| `index.html` | HTML entry point used by Vite |
| `vite.config.js` | Vite configuration, including the React and Tailwind plugins |
| `eslint.config.js` | ESLint flat configuration |
| `package.json` | Frontend dependencies and npm scripts |
| `package-lock.json` | Locked dependency versions for reproducible installs |
| `.gitignore` | Files and directories excluded from version control |

## Prerequisites

Install the following before you begin:

* **Node.js.** A current LTS release is recommended. Vite 8 requires a recent Node.js version, so consult the Vite documentation for the exact minimum supported by your installed release.
* **npm.** Bundled with Node.js and used for all frontend commands.
* **Git.** Required to clone the repository.
* **Backend runtime.** Whatever runtime the backend in `voice-agent-backend` requires. Refer to the dependency manifest inside that directory to confirm.

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/Mob-max30/Call-Screener.git
cd Call-Screener
```

### 2. Install frontend dependencies

```bash
npm install
```

### 3. Set up and start the backend

Move into the backend directory and install its dependencies using the tooling that matches its manifest, then start the service as described in the [Backend Service](#backend-service) section.

```bash
cd voice-agent-backend
```

### 4. Start the frontend

From the repository root, run:

```bash
npm run dev
```

Vite starts the development server and prints the local address, which is `http://localhost:5173` by default. Open it in your browser. Changes to source files are applied instantly through Hot Module Replacement.

## Configuration

Runtime configuration should be supplied through environment variables and never committed to version control.

**Frontend.** Vite only exposes environment variables that begin with the `VITE_` prefix to browser code. Place them in a local `.env` file in the repository root.

**Backend.** Any credentials, provider keys, or service settings required by the voice agent belong in a local environment file inside `voice-agent-backend`. Keep this file out of Git.

Recommended practice:

* Commit a `.env.example` file that lists every required variable name with empty values, so new contributors know what to provide.
* Rotate any key that has ever been committed by mistake.
* Use separate credentials for development and production.

## Available Scripts

Run these from the repository root.

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts the Vite development server with Hot Module Replacement |
| `npm run build` | Produces an optimised production build in the `dist` directory |
| `npm run preview` | Serves the production build locally for verification |
| `npm run lint` | Runs ESLint across the project |

## Backend Service

The `voice-agent-backend` directory contains the service responsible for voice handling and call screening. It runs independently of the frontend and must be running for the full experience to work.

Before contributors rely on this section, the maintainers should confirm and record the following details here:

| Item | Value |
| :--- | :--- |
| Runtime and framework | To be documented |
| Install command | To be documented |
| Start command | To be documented |
| Default port | To be documented |
| Required environment variables | To be documented |

Keeping these five details current is the single most useful thing that can be done for anyone setting the project up for the first time.

## Development Workflow

**Branching.** Create a short lived branch from `main` for every change. Use descriptive names that group by purpose, such as `feature/call_log_view` or `fix/animation_flicker`.

**Commits.** Write clear, imperative commit messages that explain what changed and why. Keep each commit focused on a single concern.

**Code quality.** Run `npm run lint` before every commit and resolve all warnings and errors. The ESLint setup includes React Hooks rules, which catch common mistakes such as missing dependencies in effects.

**Pull requests.** Describe the change, list how it was verified, and include screenshots for any visible interface change.

**Styling conventions.** Use Tailwind utility classes for styling and keep components small and composable. Prefer Framer Motion for animation so that motion stays consistent across the interface.

## Build and Deployment

Create a production build with:

```bash
npm run build
```

The optimised static output is written to the `dist` directory. It can be hosted on any static hosting provider, such as Vercel, Netlify, GitHub Pages, or an Nginx server. Use `npm run preview` to verify the build locally before publishing.

The backend is deployed separately. Ensure that the deployed frontend is configured to reach the deployed backend address, and that the backend permits requests from the frontend origin.

## Testing

No automated test suite is configured yet. Until one is added, verify changes manually and rely on `npm run lint` as the baseline quality check. Adding a component testing setup and backend tests is listed in the roadmap below.

## Troubleshooting

| Symptom | Likely cause and resolution |
| :--- | :--- |
| `npm install` fails | Confirm that your Node.js version meets the Vite requirement, then delete `node_modules` and retry |
| Port already in use | Stop the other process, or set a different port in `vite.config.js` |
| Interface loads but calls or voice features do not work | Confirm that the backend is running and that the frontend points to its correct address |
| Styles are missing | Confirm that Tailwind CSS and its Vite plugin installed correctly, then restart the development server |
| Environment variable is undefined in the browser | Confirm that the name begins with `VITE_` and restart the development server after editing the file |

## Roadmap

Suggested next steps for the project:

* Replace the placeholder Vite documentation with the finalised backend setup details.
* Add an `.env.example` file for both the frontend and the backend.
* Introduce automated tests for interface components and backend logic.
* Add continuous integration to run linting and tests on every pull request.
* Provide a call history and reporting view.
* Support user managed allow lists and block lists.
* Add TypeScript with type aware lint rules for stronger guarantees in a production setting.

## Contributing

Contributions are welcome. To contribute:

1. Fork the repository.
2. Create a feature branch from `main`.
3. Make your changes and confirm that `npm run lint` passes.
4. Commit with a clear message and push the branch.
5. Open a pull request describing the change and how it was tested.

Please open an issue first for any substantial change so the approach can be discussed before work begins.

## License

No license has been specified for this repository yet. Until one is added, all rights are reserved by the author. To make the project open for reuse, add a `LICENSE` file, for example under the MIT License, and update this section to match.

## Author

Maintained by [Mob-max30](https://github.com/Mob-max30).
