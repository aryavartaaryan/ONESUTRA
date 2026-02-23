import { RAGA_BHOPALI } from './types';

export function getAudioCtx(ref: { current: AudioContext | null }): AudioContext {
    if (!ref.current || ref.current.state === 'closed') {
        ref.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (ref.current.state === 'suspended') ref.current.resume();
    return ref.current;
}

// ── Tanpura drone: Sa (130Hz) + Pa (196Hz) sine waves slightly detuned ────────
export function startTanpura(ctx: AudioContext): { oscs: OscillatorNode[]; gain: GainNode } {
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 3);
    gain.connect(ctx.destination);
    const oscs: OscillatorNode[] = [];
    [130.81, 130.81 * 1.5, 196.0, 196.0 * 2].forEach((f, i) => {
        const o = ctx.createOscillator();
        o.type = 'sine';
        o.frequency.value = f + (i % 2 === 0 ? 0.3 : -0.3);
        o.connect(gain);
        o.start();
        oscs.push(o);
    });
    return { oscs, gain };
}

export function stopTanpura(ctx: AudioContext, ref: { oscs: OscillatorNode[]; gain: GainNode }) {
    ref.gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.5);
    setTimeout(() => ref.oscs.forEach(o => { try { o.stop(); } catch (_) { } }), 1600);
}

// ── Gentle river: continuous bandpass noise ───────────────────────────────────
export function startRiver(ctx: AudioContext): { src: ScriptProcessorNode; gain: GainNode } {
    const bufSize = 4096;
    const src = ctx.createScriptProcessor(bufSize, 0, 1);
    src.onaudioprocess = (e) => {
        const out = e.outputBuffer.getChannelData(0);
        for (let i = 0; i < out.length; i++) out[i] = (Math.random() * 2 - 1);
    };
    const bpf = ctx.createBiquadFilter();
    bpf.type = 'bandpass'; bpf.frequency.value = 300; bpf.Q.value = 0.8;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.03, ctx.currentTime + 2);
    src.connect(bpf); bpf.connect(gain); gain.connect(ctx.destination);
    return { src, gain };
}

// ── Bird chirp (triangle wave short burst) ───────────────────────────────────
export function playBird(ctx: AudioContext) {
    const freqs = [880, 1046, 1174, 1318];
    const baseFreq = freqs[Math.floor(Math.random() * freqs.length)];
    [0, 0.12, 0.22].forEach((delay, i) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'triangle'; o.frequency.value = baseFreq * (i === 1 ? 1.2 : 1.0);
        g.gain.setValueAtTime(0, ctx.currentTime + delay);
        g.gain.linearRampToValueAtTime(0.04, ctx.currentTime + delay + 0.04);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.15);
        o.connect(g); g.connect(ctx.destination);
        o.start(ctx.currentTime + delay); o.stop(ctx.currentTime + delay + 0.2);
    });
}

// ── Arrow whoosh: swept noise ─────────────────────────────────────────────────
export function playWhoosh(ctx: AudioContext) {
    const bufSize = ctx.sampleRate * 0.25;
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) d[i] = (Math.random() * 2 - 1);
    const src = ctx.createBufferSource(); src.buffer = buf;
    const bpf = ctx.createBiquadFilter();
    bpf.type = 'bandpass'; bpf.frequency.setValueAtTime(1200, ctx.currentTime);
    bpf.frequency.linearRampToValueAtTime(200, ctx.currentTime + 0.25); bpf.Q.value = 2;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.18, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
    src.connect(bpf); bpf.connect(g); g.connect(ctx.destination);
    src.start();
}

// ── Pot shatter: pentatonic sawtooth burst ────────────────────────────────────
export function playShatter(ctx: AudioContext, y: number, H: number) {
    const ratio = Math.max(0, Math.min(1, 1 - y / H));
    const idx = Math.min(Math.floor(ratio * RAGA_BHOPALI.length), RAGA_BHOPALI.length - 1);
    const freq = RAGA_BHOPALI[idx];
    [freq, freq * 1.25, freq * 1.5].forEach((f, i) => {
        const o = ctx.createOscillator(); const g = ctx.createGain();
        o.type = 'sawtooth'; o.frequency.value = f;
        g.gain.setValueAtTime(0.22, ctx.currentTime + i * 0.04);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6 + i * 0.04);
        o.connect(g); g.connect(ctx.destination);
        o.start(ctx.currentTime + i * 0.04); o.stop(ctx.currentTime + 0.7 + i * 0.04);
    });
}

// ── Pot thud (wrong hit): low sine thump ─────────────────────────────────────
export function playThud(ctx: AudioContext) {
    const o = ctx.createOscillator(); const g = ctx.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(110, ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(55, ctx.currentTime + 0.3);
    g.gain.setValueAtTime(0.4, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    o.connect(g); g.connect(ctx.destination);
    o.start(); o.stop(ctx.currentTime + 0.4);
}

// ── Tratak bell: pure 432Hz long tail ────────────────────────────────────────
export function playBell(ctx: AudioContext) {
    [432, 864, 1296].forEach((f, i) => {
        const o = ctx.createOscillator(); const g = ctx.createGain();
        o.type = 'sine'; o.frequency.value = f;
        g.gain.setValueAtTime(0, ctx.currentTime);
        g.gain.linearRampToValueAtTime(0.15 / (i + 1), ctx.currentTime + 0.01);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 3.5);
        o.connect(g); g.connect(ctx.destination);
        o.start(); o.stop(ctx.currentTime + 4);
    });
}

// ── Tratak wind (focus lost) ──────────────────────────────────────────────────
export function startWind(ctx: AudioContext): GainNode {
    const bufSize = 4096;
    const proc = ctx.createScriptProcessor(bufSize, 0, 1);
    proc.onaudioprocess = (e) => {
        const d = e.outputBuffer.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    };
    const bpf = ctx.createBiquadFilter(); bpf.type = 'bandpass'; bpf.frequency.value = 400; bpf.Q.value = 1.5;
    const g = ctx.createGain(); g.gain.value = 0.08;
    proc.connect(bpf); bpf.connect(g); g.connect(ctx.destination);
    return g;
}

export function stopWind(ctx: AudioContext, g: GainNode) {
    g.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4);
    setTimeout(() => { try { g.disconnect(); } catch (_) { } }, 500);
}

// ── Victory Vedic Mantra — "Om Shanti Shanti Shanti" ─────────────────────────
// Raga Bhopali: Sa Re Ga Pa Dha (C4=261.63 D4=293.66 E4=329.63 G4=392 A4=440)
export function playVictoryMantra(ctx: AudioContext) {
    const now = ctx.currentTime;
    // Tanpura drone underneath (Sa + Pa two octaves)
    [[65.41, 0.05], [98.0, 0.04], [130.81, 0.06], [196.0, 0.04]].forEach(([f, v]) => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = 'sine'; o.frequency.value = f;
        g.gain.setValueAtTime(0, now); g.gain.linearRampToValueAtTime(v as number, now + 1.5);
        g.gain.setValueAtTime(v as number, now + 7); g.gain.linearRampToValueAtTime(0, now + 9);
        o.connect(g); g.connect(ctx.destination); o.start(now); o.stop(now + 9.5);
    });
    // Melody: Om(Sa)  Shān(Ga)  ti(Pa)  Shān(Ga)  ti(Dha)  Shān(Pa)  ti(Ga)  Om(Sa long)
    const notes = [
        [261.63, 1.0, 1.2, 0.20], [329.63, 2.3, 0.5, 0.16], [392.0, 2.85, 0.5, 0.16],
        [329.63, 3.4, 0.5, 0.14], [440.0, 3.95, 0.5, 0.16], [392.0, 4.5, 0.5, 0.14],
        [329.63, 5.05, 0.45, 0.12], [261.63, 5.55, 1.8, 0.20],
    ];
    notes.forEach(([freq, start, dur, vol]) => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = 'sine'; o.frequency.value = freq;
        const o2 = ctx.createOscillator(), g2 = ctx.createGain();
        o2.type = 'sine'; o2.frequency.value = freq * 2; g2.gain.value = 0.22;
        g.gain.setValueAtTime(0, now + start); g.gain.linearRampToValueAtTime(vol, now + start + 0.08);
        g.gain.setValueAtTime(vol, now + start + dur - 0.1); g.gain.linearRampToValueAtTime(0, now + start + dur);
        o.connect(g); g.connect(ctx.destination); o.start(now + start); o.stop(now + start + dur + 0.05);
        o2.connect(g2); g2.connect(ctx.destination); o2.start(now + start); o2.stop(now + start + dur + 0.05);
    });
    // Final Om bell ring
    [432, 540, 648].forEach((f, i) => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = 'sine'; o.frequency.value = f;
        g.gain.setValueAtTime(0, now + 7.5); g.gain.linearRampToValueAtTime(0.12 / (i + 1), now + 7.55);
        g.gain.exponentialRampToValueAtTime(0.001, now + 11);
        o.connect(g); g.connect(ctx.destination); o.start(now + 7.5); o.stop(now + 11.5);
    });
}
