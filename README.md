# 🎖️ MilBench Live

### A spy-submarine ops room in your browser — then you realize the sources are public and the data is real.

Naval-theatre spatial intelligence on a photorealistic 3D globe: surface contacts, military air, orbital recon, seafloor cables, bases — and, one click away, **AI submarine commanders fighting real engagements** staged from the very waters you're watching.

*No place left unwatched. No ping off the record.*

---

**[Quick Start](#-quick-start) · [First Five Minutes](#-the-first-five-minutes) · [What's on the Globe](#️-whats-on-the-globe) · [AI Engagements](#-ai-engagements) · [Field Missions](#️-field-missions) · [Under the Hood](#-under-the-hood) · [Keys & Costs](#-keys--costs)**

---

## 🌊 Why This Exists

[](#-why-this-exists)

Most open-source intelligence is a pile of browser tabs; most AI-military evaluation is a pile of essays. MilBench Live fuses the two fixes into one place: **the world is already broadcasting** — ship transponders, air telemetry, orbital elements, seismic networks — and now the tactical picture you build from those signals can host **scored engagements between AI commanders**, run by the deterministic [MilBench](https://github.com/rachittshah/milbench-live) engine on the same waters.

> Half the magic is that it looks like a classified fleet HQ. The other half is that every contact has a source label and every engagement replays from a seed.

## ⚡ Quick Start

[](#-quick-start)

Requires Node.js 24.14+ or 26.x (enforced by `package.json`).

1.  Copy `.env.example` → `.env` and set `GOOGLE_MAPS_API_KEY` — that one key is the whole entry fee for the photoreal planet.
2.  Install and run:

```bash
npm install
npm run dev -- --host localhost --port 4173
```

3.  Open `http://localhost:4173`. A first-run card offers to stage your watch — **Strait Watch**, **Orbital Recon**, or **Theatre Environment**.

Everything except the map tiles runs keyless. Full map in [Keys & Costs](#-keys--costs).

## 🕐 The First Five Minutes

[](#-the-first-five-minutes)

1.  **Light up the strait.** Take *Strait Watch*. Surface contacts stream in over AIS; military air paints itself amber.
2.  **Click a warship.** Camera locks, trail draws, tactical card comes up with what's known and how fresh it is.
3.  **Switch the optics.** Keys `1`–`7` — CRT, NVG, FLIR/thermal — re-render the whole live theatre through a different sensor.
4.  **Turn on ⚔️ AI Engagements.** Two AI commanders fight a recorded duel as moving contacts with trails and torpedo pulses — right on the globe, in the same waters you're watching.
5.  **Run your own duel.** With the local engine up (`uv run milbench-serve` in the MilBench repo), the layer stages fresh scripted-vs-scripted engagements on demand — winner, reason, and cycle count land in the stats chip.
6.  **Talk to it** *(optional, OpenAI)*: *"Take me to the Strait of Hormuz and show me nearby vessels."*
7.  **Reset Globe** when you're done watching the world.

## 🛰️ What's on the Globe

[](#️-whats-on-the-globe)

Thirteen live layers plus bundled infrastructure. Ten need nothing at all. (🟢 nothing · 🟡 free key · 🔴 metered)

| Layer | What you get | Source | Auth |
|---|---|---|---|
| 🗺️ Map Stack | Google Photorealistic 3D, Bing aerial, OSM | Google / ion / OSM | 🔴 Google · 🟡 ion · 🟢 OSM |
| ✈️ Air Contacts | Thousands of live aircraft + route history | OpenSky + adsb.lol | 🟢 (🟡 optional OpenSky) |
| 🎖️ Military Air | ADS-B military traffic | adsb.lol | 🟢 |
| ◭ Surface Contacts | Live global vessel traffic | AISStream | 🟡 |
| 🛰️ Satellites | Core catalog + DENSE Starlink shell | CelesTrak | 🟢 |
| 🌋 Earthquakes | Global seismic activity, 24 h | USGS | 🟢 |
| ▲ Active Fires | NASA FIRMS detections | NASA FIRMS | 🟡 |
| 🚀 Space Missions | Rolling 30-day launches | Launch Library 2 | 🟢 (🟡 token) |
| 🚗 Street Traffic | Congestion flow at street level | TomTom + OSM | 🟢 sim · 🟡 TomTom |
| 📹 CCTV Mesh | Public cameras projected into 3D | City APIs | 🟢 |
| ◉ Radio | Geolocated world radio, analog tuner | Radio Browser | 🟢 |
| 🚲 Bikeshare | Live station availability | GBFS | 🟢 |
| ⌖ Bases & Installations | Community-mapped military sites | OSM | 🟢 |
| ≋ Submarine Cables | Bundled global cable routes | TeleGeography | 🟢 (CC BY-NC-SA) |
| ▣ Infrastructure | Datacenters (4,351) · Dams (704) | Bundled, cited | 🟢 |

## ⚔️ AI Engagements

[](#-ai-engagements)

The MilBench-flavoured addition. Toggle the layer and the globe hosts scored submarine duels:

-   **RECORDED SAMPLE** — every install ships with a real recorded engagement (knife fight, LA vs Akula), played back honestly labeled when no engine is running.
-   **LIVE ENGINE** — point the app at a local MilBench server (`MILBENCH_ENGINE_URL`, default `http://127.0.0.1:8770`) and stage fresh duels: scenario library, scripted doctrine bots or Claude agents, seeded and reproducible. Frames render as BLUE/RED contacts with trails; torpedo launches pulse red; the stats chip carries the outcome.
-   Fog of war stays honest: spectators see the god's-eye trace; the commanders themselves only ever saw bearing-only estimates.

## 🎖️ Field Missions

[](#️-field-missions)

| Mission | How |
|---|---|
| **Strait Watch** | First-run mission: chokepoint picture from live surface + air feeds. Click anything. |
| **Thermal Contact Watch** | FLIR over a busy strait with the detection mesh reading the scene. |
| **Orbital Recon** | Next passes over your theatre; ride the ISS. |
| **Ask the planet** *(🎙️)* | *"Which military aircraft are near this carrier group?"* |
| **Stage a war** | Engine up → AI Engagements → run a knife fight where you're standing. |

## 🔧 Under the Hood

[](#-under-the-hood)

-   **Every layer keeps its source and freshness visible** — partial, delayed, simulated, and unavailable are first-class states, never silently papered over.
-   **Keyless layers stay keyless**: ten of thirteen live layers need no account, no signup.
-   **Secrets stay server-side**: provider keys broker through local Vite proxies with fixed destinations, bounded requests, disk caches, and budget governors. Only Google Maps/Cesium ion tokens reach the browser by design.
-   **Engagements inherit MilBench's determinism contract**: `(engine_ver, scenario_id, seed, action_log)` replays any duel frame-for-frame.
-   **No framework.** Vanilla JS, CesiumJS, Vite — fast to read, fast to hack on.

## 🔑 Keys & Costs

[](#-keys--costs)

| Key | Why | Cost |
|---|---|---|
| 🔴 Google Maps *(required)* | The photorealistic 3D planet | Metered; restrict + budget-cap it |
| 🟡 AISStream | Live surface contacts | Free signup |
| 🟡 NASA FIRMS | Live fire detections | Free |
| 🟡 Cesium ion | Bing imagery stacks | Free tier |
| 🟡 TomTom | Real traffic instead of simulation | Free tier |
| 🔴 OpenAI | Voice + HUD summaries | Metered; $5 in-app session cap |
| 🟢 **MilBench engine** | AI Engagements | **$0 — runs locally, scripted duels free** |

## 📋 Credits & Provenance

[](#-credits--provenance)

MilBench Live is built on the plumbing of **[God's Eye View](https://github.com/bilawalsidhu/gods-eye-view)** by Bilawal Sidhu — MIT-licensed, forked with gratitude, rebranded and extended for naval-theatre intelligence and AI-commander evaluation. All data sources carry their own terms — see [DATA_SOURCES.md](DATA_SOURCES.md); the TeleGeography cable dataset is CC BY-NC-SA and must be removed for commercial use.

**The line.** This project models events, assets, and systems — not people. No named-person search, no face recognition, no tracking of individuals. Engagements are simulations between AI commanders; they certify nothing about real-world operations.

Important

Exploratory visualization of public and third-party data. Data may be delayed, incomplete, modeled, or wrong. Do not use for navigation, safety-critical, or operational purposes.

**🎖️ MilBench Live. Every ping is on the record.**
