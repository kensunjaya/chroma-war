<h1>
  <img src="public/favicon.webp" alt="" width="25" height="25" style="vertical-align: bottom; margin-right: 10px;">
  <span style="vertical-align: middle;">Chroma War</span>
</h1>

A chain-reaction strategy game where two players face off in real time. Built for the modern web with smooth multiplayer gameplay enhanced by AI-powered logic and sleek UI.

Visit the live demo: [chroma-war.vercel.app](https://chroma-war.vercel.app)

---

## Table of Contents

- [Overview](#overview)  
- [Features](#features)  
- [Tech Stack](#tech-stack)  
- [Getting Started](#getting-started)  
  - [Prerequisites](#prerequisites)  
  - [Installation](#installation)  
  - [Running Locally](#running-locally)  
- [Gameplay](#gameplay)  
- [Project Structure](#project-structure)  
- [Contribution](#contribution)  
- [License](#license)

---

## Overview

**Chroma-War** is a modern, web-based strategy game built using Next.js and TypeScript. Players engage in intense, real-time chain-reaction battles where every move counts. The game features AI-driven move calculations using Minimax with α-β pruning—making matches both challenging and fun.

---

## Features

🧩 **Real-Time Multiplayer**: Players interact over WebSockets for immediate, synchronized gameplay.  
🎮 **Smart AI Opponent**: Crafted with Minimax enhanced by α-β pruning to deliver strategic and dynamic challenges.  
🛠️ **Modular Architecture**: Built with TypeScript and ESLint for maintainable, scalable code.  
🌟 **User-Friendly UI**: Includes reusable components such as modals, navigation menus, and game boards.  
🚀 **Easy Deployment**: Deploy instantly with Vercel for fast, optimized hosting.  

---

## Tech Stack

| Layer            | Technology        |
|------------------|------------------|
| Frontend         | Next.js, React, TypeScript |
| Linter/Formatter | ESLint           |
| Build & Tooling  | npm, Next.js config |
| Deployment       | Vercel           |
| Communication    | WebSocket        |
| AI Logic         | Minimax + α-β Pruning |

---

## Getting Started

### Prerequisites
- **Node.js** (v16+ recommended)  
- **npm** (comes bundled with Node.js)

### Installation

```
git clone https://github.com/kensunjaya/chroma-war.git
cd chroma-war
npm install
```

### Running Locally

```
npm run dev
```

This starts the development server (typically at `http://localhost:3000`) for testing and iteration.

---

## Gameplay

Chroma-War is a grid-based game where players take turns to drop or activate “atoms” that can trigger chain reactions, changing the state of the board. When playing against the AI, the Minimax algorithm with α-β pruning generates moves, ensuring that the opponent plays with both speed and strategic depth. Real-time updates are powered by WebSocket, allowing seamless multiplayer matches.

---

## Project Structure

```
chroma-war/
├── public/                 # Static assets (images, icons)
├── src/                    # Source code and components
├── .vscode/                # Editor config
├── README.md               # Project documentation (you’re here!)
├── package.json            # Project metadata & dependencies
├── tsconfig.json           # TypeScript configuration
├── eslint.config.mjs       # ESLint configuration
├── postcss.config.mjs      # PostCSS configuration
├── next.config.ts          # Next.js build config
├── next-sitemap.config.js  # Sitemap generation settings
└── package-lock.json       # Lockfile for npm dependencies
```

---

## Contribution

Contributions are welcome! Feel free to:

- Submit issues to report bugs or suggest enhancements  
- Open pull requests to propose improvements  
- Start discussions around new features or game modes

Please fork the repository and follow the [GitHub flow](https://docs.github.com/en/get-started/quickstart/github-flow).

---

## License

This project is licensed under the MIT License – see the LICENSE file for details.  

You are free to use, modify, and distribute this project for personal or commercial purposes, provided that proper credit is given. This keeps the project open and widely usable, while still ensuring attribution to the original author.

---
