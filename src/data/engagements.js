import * as Cesium from 'cesium';

// MilBench Live engagement layer — plays back AI-vs-AI submarine engagements
// produced by the local MilBench engine (a scripted/agent duel recorded as
// result.json frames). When the engine isn't running, the layer degrades to an
// honest bundled sample labeled RECORDED SAMPLE rather than going dark.

const ENGINE_BASE = '/api/milbench';
const FIXTURE_URL = '/fixtures/milbench/sample-engagement.json';
const PLAY_INTERVAL_MS = 2000;
const RUN_POLL_MS = 3000;
const RUN_TIMEOUT_MS = 180000;

// Engagements are georeferenced in the engine's local frame; translate them
// into a theatre box (Strait of Malacca) without distorting geometry.
const THEATRE_ANCHOR = Object.freeze({ lat: 2.5, lon: 101.3 });

const BLUE_COLOR = Cesium.Color.fromCssColorString('#38bdf8');
const RED_COLOR = Cesium.Color.fromCssColorString('#f59e0b');
const PULSE_COLOR = Cesium.Color.fromCssColorString('#ef4444');

function toDegrees(framePos) {
  return {
    lat: THEATRE_ANCHOR.lat + (Number(framePos?.lat) || 0),
    lon: THEATRE_ANCHOR.lon + (Number(framePos?.lon) || 0),
  };
}

export default {
  id: 'engagements',
  name: 'AI Engagements',
  icon: '⚔️',
  source: 'MilBench Engine',
  updateInterval: PLAY_INTERVAL_MS,

  _viewer: null,
  _enabled: false,
  _recording: null,
  _frameIdx: 0,
  _mode: 'IDLE',
  _entities: [],
  _pulses: [],
  _scenarios: [],

  init(viewer) {
    this._viewer = viewer;
  },

  async enable() {
    this._enabled = true;
    try {
      const res = await fetch(`${ENGINE_BASE}/scenarios`, { signal: AbortSignal.timeout(4000) });
      const body = await res.json();
      if (res.ok && body && Array.isArray(body.scenarios)) {
        this._scenarios = body.scenarios;
        this._setMode('LIVE ENGINE');
      } else {
        await this._loadFixture();
      }
    } catch {
      await this._loadFixture();
    }
    if (this._recording) this._render();
  },

  disable() {
    this._enabled = false;
    this._clearEntities();
    this._recording = null;
    this._frameIdx = 0;
    this._mode = 'IDLE';
  },

  async update() {
    if (!this._enabled || !this._recording || !this._recording.frames?.length) return;
    const n = this._recording.frames.length;
    this._frameIdx = (this._frameIdx + 1) % n;
    this._render();
  },

  getStats() {
    const rec = this._recording;
    if (!rec) return { state: this._mode === 'LIVE ENGINE' ? 'READY' : 'EMPTY', mode: this._mode };
    const f = rec.frames[this._frameIdx] || rec.frames[0];
    const contacts = [f.blue, f.red].filter((s) => s && s.alive !== false).length;
    return {
      contacts,
      cycles: rec.frames.length,
      scenario: rec.scenario_id || '—',
      winner: rec.outcome?.winner || '—',
      reason: rec.outcome?.reason || '',
      mode: this._mode,
    };
  },

  /** Load any engine recording by its /api/recordings id. */
  async stageRecording(recId) {
    try {
      const res = await fetch(`${ENGINE_BASE}/recording/${encodeURIComponent(recId)}`, {
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) throw new Error(`engine ${res.status}`);
      const rec = await res.json();
      if (!Array.isArray(rec.frames) || !rec.frames.length) throw new Error('empty frames');
      this._startPlayback(rec, 'LIVE ENGINE');
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Launch a scripted-vs-scripted engagement on the engine and play the
   * recording back once it lands. Returns the recording id, or null.
   */
  async runEngagement({ scenario = null, blue = 'scripted', red = 'scripted', seed = 7 } = {}) {
    let res;
    try {
      res = await fetch(`${ENGINE_BASE}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario, blue, red, seed }),
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) throw new Error(`engine ${res.status}`);
    } catch {
      return null;
    }
    const before = new Set(await this._listRecordingIds());
    const deadline = Date.now() + RUN_TIMEOUT_MS;
    while (Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, RUN_POLL_MS));
      const ids = await this._listRecordingIds();
      const fresh = ids.find((id) => !before.has(id));
      if (fresh) return (await this.stageRecording(fresh)) ? fresh : null;
    }
    return null;
  },

  async _listRecordingIds() {
    try {
      const res = await fetch(`${ENGINE_BASE}/recordings`, { signal: AbortSignal.timeout(5000) });
      const body = await res.json();
      return (Array.isArray(body) ? body : []).map((r) => r.id);
    } catch {
      return [];
    }
  },

  async _loadFixture() {
    try {
      const res = await fetch(FIXTURE_URL);
      const rec = await res.json();
      if (Array.isArray(rec.frames) && rec.frames.length) {
        this._startPlayback(rec, 'RECORDED SAMPLE');
        return;
      }
    } catch {
      /* fixture missing — stay empty and honest */
    }
    this._mode = 'UNAVAILABLE';
  },

  _startPlayback(recording, mode) {
    this._clearEntities();
    this._recording = recording;
    this._frameIdx = 0;
    this._mode = mode;
  },

  _clearEntities() {
    if (this._viewer) {
      for (const e of [...this._entities, ...this._pulses]) {
        this._viewer.entities.remove(e);
      }
    }
    this._entities = [];
    this._pulses = [];
  },

  _trailPositions(sideKey) {
    const frames = this._recording.frames.slice(0, this._frameIdx + 1);
    const out = [];
    for (const f of frames) {
      const p = toDegrees(f[sideKey]);
      out.push(Cesium.Cartesian3.fromDegrees(p.lon, p.lat, -30));
    }
    return out;
  },

  _render() {
    if (!this._viewer || !this._recording) return;
    const f = this._recording.frames[this._frameIdx];

    for (const pulse of this._pulses) this._viewer.entities.remove(pulse);
    this._pulses = [];

    for (const sideKey of ['blue', 'red']) {
      const side = f[sideKey];
      if (!side) continue;
      const p = toDegrees(side);
      const color = sideKey === 'blue' ? BLUE_COLOR : RED_COLOR;
      const label = `${sideKey.toUpperCase()} · ${this._recording[sideKey]?.name || ''}`;
      let ent = this._entities.find((e) => e._mbSide === sideKey);
      if (!ent) {
        ent = this._viewer.entities.add({
          _mbSide: sideKey,
          position: new Cesium.CallbackProperty(
            () => {
              const cf = this._recording?.frames[this._frameIdx]?.[sideKey];
              const cp = cf ? toDegrees(cf) : p;
              return Cesium.Cartesian3.fromDegrees(cp.lon, cp.lat, -30);
            },
            false,
          ),
          point: {
            pixelSize: 12,
            color,
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 1,
          },
          label: {
            text: label,
            font: '11px sans-serif',
            fillColor: color,
            showBackground: true,
            backgroundColor: Cesium.Color.fromCssColorString('#000000aa'),
            pixelOffset: new Cesium.Cartesian2(0, -16),
          },
          polyline: {
            positions: new Cesium.CallbackProperty(() => this._trailPositions(sideKey), false),
            width: 1.5,
            material: color.withAlpha(0.55),
          },
        });
        this._entities.push(ent);
      }

      // Torpedo launches read straight off the engine's event stream.
      const fired = (f.events || []).some((e) => /TORPEDO (FIRED|IN THE WATER)/.test(e)
        && e.startsWith(`${sideKey.toUpperCase()}:`));
      if (fired && side.alive !== false) {
        this._pulses.push(this._viewer.entities.add({
          position: Cesium.Cartesian3.fromDegrees(p.lon, p.lat, -10),
          point: {
            pixelSize: 18,
            color: PULSE_COLOR.withAlpha(0.8),
            outlineColor: PULSE_COLOR,
            outlineWidth: 2,
          },
        }));
      }
    }
  },
};
