# Runway Explorer

Runway explorer is a small application for private pilots designed to visualize airfields you visited or want to visite in futur flights 🛩️

## Features
- **Interactive Map**: View airfields and flight paths with dynamic markers.
- **Flight Path Management**: Load your previous flight trace (GPX or KML files), auto add airfields, and keep track of where you landed.
- **Airfield Management**: Manage your airfields bucket list, access detailed information with OpenAIP integration.
- **Secure API Integration**: OpenAIP data fetched through backend proxy (API key protection).
- **Share Feature**: Share your flight data with zero-knowledge encryption.

|VFR|Night VFR|
|---|---|
|<img src="runway_explorer_lightmode.jpg">|<img src="runway_explorer_darkmode.jpg">|

## Roadmap
A roadmap is available in [ROADMAP.md](ROADMAP.md).

## Tech Stack
- React 18.2.0 + TypeScript 5.7.2 + Vite 6.3.1
- Tailwind CSS 3.4.1 + shadcn/ui
- React Router 7.5.1

## Quick Start

### Prerequisites

This application requires a backend server for:
- **OpenAIP integration**: Secure API key management for airport data
- **Share feature**: Zero-knowledge encrypted data sharing

Just need to run start-dev.sh

```bash
./start-dev.sh
```
