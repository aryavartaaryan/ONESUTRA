'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */

import { Component, ReactNode, useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import { KernelSize } from 'postprocessing';
import * as THREE from 'three';
import { useEffect, useState } from 'react';

// ── Error Boundary (same as original) ─────────────────────────────────────
class R3FBoundary extends Component<{ children: ReactNode }, { crashed: boolean }> {
    constructor(p: any) { super(p); this.state = { crashed: false }; }
    static getDerivedStateFromError() { return { crashed: true }; }
    componentDidCatch(e: Error) {
        console.warn('[LeelaEmbed] recovered:', e.message);
        setTimeout(() => this.setState({ crashed: false }), 1000);
    }
    render() { return this.state.crashed ? null : this.props.children; }
}

// ── Safe Post-processing ───────────────────────────────────────────────────
function SafePostProcessing({ bloomIntensity }: { bloomIntensity: number }) {
    const { gl, scene, camera } = useThree();
    const [ctxReady, setCtxReady] = useState(false);
    useEffect(() => {
        let raf: number;
        const check = () => {
            try {
                if (gl && scene && camera) {
                    const ctx = gl.getContext() as WebGLRenderingContext | null;
                    if (ctx && ctx.getContextAttributes()) { setCtxReady(true); return; }
                }
            } catch { /* not ready */ }
            raf = requestAnimationFrame(check);
        };
        raf = requestAnimationFrame(check);
        return () => cancelAnimationFrame(raf);
    }, [gl, scene, camera]);
    if (!ctxReady || !gl || !scene || !camera) return null;
    try {
        if (!gl.domElement) return null;
        const ctx = gl.getContext() as WebGLRenderingContext | null;
        if (!ctx || ctx.getContextAttributes?.() == null) return null;
    } catch { return null; }
    return (
        <EffectComposer multisampling={0} enableNormalPass={false}>
            <Bloom intensity={bloomIntensity} luminanceThreshold={0.26} luminanceSmoothing={0.5} kernelSize={KernelSize.LARGE} mipmapBlur />
            <Vignette eskil={false} offset={0.24} darkness={0.88} />
        </EffectComposer>
    );
}

// ── GLSL FBM ───────────────────────────────────────────────────────────────
const FBM = `
float hsh(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float nz(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);
  return mix(mix(hsh(i),hsh(i+vec2(1,0)),f.x),mix(hsh(i+vec2(0,1)),hsh(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*nz(p);p*=2.1;a*=.5;}return v;}
`;

// ── Phase 1: Muladhara ────────────────────────────────────────────────────
function MuladharaFused({ opacity, speed }: { opacity: number; speed: number }) {
    const bgMat = useMemo(() => new THREE.ShaderMaterial({
        transparent: true, depthWrite: false,
        uniforms: { uTime: { value: 0 }, uOpacity: { value: 0 }, uSpeed: { value: speed } },
        vertexShader: `varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
        fragmentShader: `${FBM}
            uniform float uTime,uOpacity,uSpeed; varying vec2 vUv;
            void main(){
                vec2 uv=vUv-.5; float r=length(uv), ang=atan(uv.y,uv.x);
                float spiral=sin(ang*4.-r*12.+uTime*uSpeed*.5)*.4+.6;
                float ripple=sin(r*14.-uTime*uSpeed*.28)*.5+.5; ripple*=smoothstep(.55,.0,r);
                float n=fbm(uv*2.8+uTime*uSpeed*.05)*.5+.5;
                float petals=abs(cos(ang*2.+uTime*uSpeed*.06))*smoothstep(.5,.0,r)*.45;
                float val=spiral*.3+ripple*.35+n*.2+petals*.15;
                vec3 deep=vec3(.18,.07,.01),terra=vec3(.52,.20,.04),amber=vec3(.76,.40,.07),cream=vec3(.94,.80,.52);
                vec3 col=mix(deep,terra,val*.9); col=mix(col,amber,smoothstep(.48,.80,val)); col=mix(col,cream,smoothstep(.84,1.,val)*ripple);
                float mask=smoothstep(.58,.0,r); gl_FragColor=vec4(col*mask,mask*uOpacity*.85);
            }`,
    }), []);
    const triMat = useMemo(() => new THREE.MeshBasicMaterial({ color: '#CC6620', transparent: true, opacity: 0.0, wireframe: true, blending: THREE.AdditiveBlending, depthWrite: false }), []);
    const triangles = useMemo(() => {
        const gs: THREE.BufferGeometry[] = [];
        [5, 4, 5, 4].forEach((cnt, l) => {
            const radius = 0.3 + l * 0.32;
            for (let i = 0; i < cnt; i++) {
                const base = (i / cnt) * Math.PI * 2, dir = l % 2 === 0 ? 1 : -1, sz = 0.26 - l * .025;
                const g = new THREE.BufferGeometry();
                g.setAttribute('position', new THREE.BufferAttribute(new Float32Array([
                    Math.cos(base) * radius, Math.sin(base) * radius, 0,
                    Math.cos(base + sz) * radius, Math.sin(base + sz) * radius, 0,
                    Math.cos(base + sz * .5) * radius, Math.sin(base + sz * .5) * radius + dir * sz * .5, 0,
                ]), 3));
                gs.push(g);
            }
        });
        return gs;
    }, []);
    const groupRef = useRef<THREE.Group>(null!);
    useFrame(({ clock }) => {
        const t = clock.getElapsedTime();
        bgMat.uniforms.uTime.value = t;
        bgMat.uniforms.uSpeed.value = speed;
        bgMat.uniforms.uOpacity.value = THREE.MathUtils.lerp(bgMat.uniforms.uOpacity.value, opacity, 0.04);
        triMat.opacity = opacity * 0.22;
        if (groupRef.current) groupRef.current.rotation.z = t * 0.018 * speed;
    });
    return (
        <group>
            <mesh position={[0, 0, -2.5]}><planeGeometry args={[9, 9]} /><primitive object={bgMat} attach="material" /></mesh>
            <group ref={groupRef} position={[0, 0, -1.6]}>
                {triangles.map((g, i) => (<mesh key={i} geometry={g}><primitive object={triMat} attach="material" /></mesh>))}
                {[.28, .52, .78, 1.06, 1.34].map((r, i) => (
                    <mesh key={`r${i}`}><ringGeometry args={[r - .007, r + .007, 80]} />
                        <meshBasicMaterial color={i % 2 === 0 ? '#CC6820' : '#996512'} transparent opacity={opacity * (.25 - i * .038)} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
                    </mesh>
                ))}
            </group>
        </group>
    );
}

// ── Phase 2: Anahata Lotus ────────────────────────────────────────────────
const LOTUS_N = 8000;
function AnahataLotus({ opacity, breathScale, speed }: { opacity: number; breathScale: number; speed: number }) {
    const ref = useRef<THREE.Points>(null!);
    const { pos, col } = useMemo(() => {
        const pos = new Float32Array(LOTUS_N * 3), col = new Float32Array(LOTUS_N * 3);
        for (let i = 0; i < LOTUS_N; i++) {
            const petal = i % 12, t = i / LOTUS_N, layer = Math.floor(t * 5), lt = (t * 5) % 1;
            const ang = (petal / 12) * Math.PI * 2 + (Math.random() - .5) * .45;
            const r = 0.08 + lt * (0.25 + layer * 0.18) + Math.random() * .05;
            pos[i * 3] = r * Math.cos(ang); pos[i * 3 + 1] = Math.sin(lt * Math.PI) * .5 + lt * -.15 + Math.random() * .04; pos[i * 3 + 2] = r * Math.sin(ang);
            const c = new THREE.Color().setHSL(0.42 + lt * .15 + Math.random() * .06, 0.95, 0.55 + lt * .25);
            col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
        }
        return { pos, col };
    }, []);
    useFrame(({ clock }) => {
        if (!ref.current) return;
        const t = clock.getElapsedTime();
        ref.current.rotation.y = t * 0.07 * speed;
        ref.current.scale.setScalar(breathScale * .9 + .1);
        (ref.current.material as THREE.PointsMaterial).opacity = THREE.MathUtils.lerp((ref.current.material as THREE.PointsMaterial).opacity, opacity, .05);
    });
    return (
        <>
            <mesh position={[0, 0, -4]}><planeGeometry args={[12, 12]} /><meshBasicMaterial color="#000511" transparent opacity={opacity} depthWrite={false} /></mesh>
            <points ref={ref}>
                <bufferGeometry>
                    <bufferAttribute attach="attributes-position" args={[pos, 3]} />
                    <bufferAttribute attach="attributes-color" args={[col, 3]} />
                </bufferGeometry>
                <pointsMaterial size={0.022} vertexColors transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} sizeAttenuation toneMapped={false} />
            </points>
            <mesh position={[0, 0, -.3]}><sphereGeometry args={[.08, 16, 16]} /><meshBasicMaterial color="#00FFAA" transparent opacity={opacity * .8} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} /></mesh>
        </>
    );
}

// ── Phase 3: Sahasrara Crown ──────────────────────────────────────────────
const CROWN_N = 8000;
function SahasraraCrown({ opacity, speed }: { opacity: number; speed: number }) {
    const starRef = useRef<THREE.Points>(null!);
    const ringRef = useRef<THREE.Group>(null!);
    const starPos = useMemo(() => {
        const arr = new Float32Array(CROWN_N * 3);
        for (let i = 0; i < CROWN_N; i++) {
            const r = .8 + Math.random() * 5.5, th = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1);
            arr[i * 3] = r * Math.sin(ph) * Math.cos(th); arr[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th); arr[i * 3 + 2] = r * Math.cos(ph);
        }
        return arr;
    }, []);
    const crownStarMat = useMemo(() => new THREE.ShaderMaterial({
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
        uniforms: { uTime: { value: 0 }, uOpacity: { value: 0 } },
        vertexShader: `uniform float uTime,uOpacity; varying float vFade;
            void main(){vec3 p=position;p.x+=sin(uTime*.11+position.z)*.05;p.y+=cos(uTime*.13+position.x)*.05;
                vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;
                float d=clamp(-mv.z/7.,0.,1.);gl_PointSize=mix(3.2,.7,d);
                vFade=(1.-d*.65)*uOpacity*(sin(uTime*1.8+position.x*3.)*.15+.85);}`,
        fragmentShader: `varying float vFade;
            void main(){vec2 uv=gl_PointCoord-.5;float d=length(uv);if(d>.5)discard;
                float s=1.-smoothstep(.1,.5,d);gl_FragColor=vec4(mix(vec3(.65,.15,1.),vec3(1.,.85,.55),s),vFade*s);}`,
    }), []);
    const crownBg = useMemo(() => new THREE.ShaderMaterial({
        transparent: true, depthWrite: false,
        uniforms: { uTime: { value: 0 }, uOpacity: { value: 0 } },
        vertexShader: `varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
        fragmentShader: `${FBM}
            uniform float uTime,uOpacity;varying vec2 vUv;
            void main(){vec2 uv=vUv-.5;float r=length(uv),ang=atan(uv.y,uv.x);
                float p1=pow(abs(cos(ang*36.+uTime*.1)),3.)*smoothstep(.5,.0,r)*.7;
                float p2=pow(abs(cos(ang*72.-uTime*.07)),4.)*smoothstep(.5,.0,r)*.5;
                float rings=abs(sin(r*32.-uTime*.9))*smoothstep(.5,.0,r)*.6;
                float inner=smoothstep(.22,.0,r)*1.5; float n=fbm(uv*3.+uTime*.08)*.2;
                float val=p1*.3+p2*.25+rings*.3+n*.15+inner*.3;
                vec3 col=mix(vec3(.42,.04,.88),vec3(1.,.82,.20),smoothstep(.3,.75,val));
                col=mix(col,vec3(1.,.98,.96),smoothstep(.75,1.,val));
                float mask=smoothstep(.58,.0,r)*val+inner*.4;
                gl_FragColor=vec4(col,clamp(mask,0.,1.)*uOpacity);}`,
    }), []);
    useFrame(({ clock }) => {
        const t = clock.getElapsedTime();
        crownStarMat.uniforms.uTime.value = t;
        crownStarMat.uniforms.uOpacity.value = THREE.MathUtils.lerp(crownStarMat.uniforms.uOpacity.value, opacity, .04);
        crownBg.uniforms.uTime.value = t;
        crownBg.uniforms.uOpacity.value = THREE.MathUtils.lerp(crownBg.uniforms.uOpacity.value, opacity * .95, .04);
        if (ringRef.current) ringRef.current.rotation.z = t * .04 * speed;
    });
    return (
        <group>
            <mesh position={[0, 0, -3]}><planeGeometry args={[9, 9]} /><primitive object={crownBg} attach="material" /></mesh>
            <points ref={starRef}>
                <bufferGeometry><bufferAttribute attach="attributes-position" args={[starPos, 3]} /></bufferGeometry>
                <primitive object={crownStarMat} attach="material" />
            </points>
            <group ref={ringRef}>
                {[.12, .28, .48, .72, .98, 1.28, 1.62].map((r, i) => (
                    <mesh key={i} position={[0, 0, -1.5]}><ringGeometry args={[r - .007, r + .007, 128]} />
                        <meshBasicMaterial color={i % 2 === 0 ? '#CC44FF' : '#FFD700'} transparent opacity={opacity * (.55 - i * .06)} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
                    </mesh>
                ))}
            </group>
        </group>
    );
}

// ── Spiral Dust ────────────────────────────────────────────────────────────
const DUST_N = 5000;
const DUST_COLS = ['#D4760A', '#00AACC', '#AA44FF'] as const;
function SpiralDust({ phaseIdx, opacity, speed }: { phaseIdx: number; opacity: number; speed: number }) {
    const mat = useMemo(() => new THREE.ShaderMaterial({
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
        uniforms: { uTime: { value: 0 }, uOpacity: { value: 0 }, uColor: { value: new THREE.Color(DUST_COLS[0]) }, uSpeed: { value: speed } },
        vertexShader: `uniform float uTime,uSpeed;attribute float aSpd,aRad,aOff;varying float vA;
            void main(){float t=uTime*aSpd*uSpeed+aOff,ang=t*1.8;float z=mod(aOff-uTime*uSpeed*.4,22.)-3.;
                vec3 pos=vec3(cos(ang)*aRad,sin(ang)*aRad*.55,-z);vec4 mv=modelViewMatrix*vec4(pos,1.);
                gl_Position=projectionMatrix*mv;float d=clamp(-mv.z/20.,0.,1.);gl_PointSize=mix(2.6,.7,d)*aSpd*1.3;vA=.5*(1.-d*.6);}`,
        fragmentShader: `uniform vec3 uColor;uniform float uOpacity;varying float vA;
            void main(){vec2 uv=gl_PointCoord-.5;float d=length(uv);if(d>.5)discard;float s=1.-smoothstep(.18,.5,d);gl_FragColor=vec4(uColor,vA*s*uOpacity);}`,
    }), []);
    const geo = useMemo(() => {
        const g = new THREE.BufferGeometry();
        const spd = new Float32Array(DUST_N), rad = new Float32Array(DUST_N), off = new Float32Array(DUST_N), pos = new Float32Array(DUST_N * 3);
        for (let i = 0; i < DUST_N; i++) { spd[i] = .2 + Math.random() * .6; rad[i] = .4 + Math.random() * 2.5; off[i] = Math.random() * 400; }
        g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        g.setAttribute('aSpd', new THREE.BufferAttribute(spd, 1));
        g.setAttribute('aRad', new THREE.BufferAttribute(rad, 1));
        g.setAttribute('aOff', new THREE.BufferAttribute(off, 1));
        return g;
    }, []);
    useFrame(({ clock }) => {
        mat.uniforms.uTime.value = clock.getElapsedTime();
        mat.uniforms.uOpacity.value = THREE.MathUtils.lerp(mat.uniforms.uOpacity.value, opacity * .5, .04);
        mat.uniforms.uColor.value.lerp(new THREE.Color(DUST_COLS[phaseIdx]), .02);
    });
    return <points geometry={geo} material={mat} />;
}

// ── Camera Rig ─────────────────────────────────────────────────────────────
function CameraRig({ mouse }: { mouse: { x: number; y: number } }) {
    const { camera } = useThree();
    useFrame(() => {
        camera.position.x = THREE.MathUtils.lerp(camera.position.x, mouse.x * .25, .04);
        camera.position.y = THREE.MathUtils.lerp(camera.position.y, -mouse.y * .15, .04);
        camera.lookAt(0, 0, 0);
    });
    return null;
}

// ── Embedded Scene ─────────────────────────────────────────────────────────
function EmbedScene({ phaseIdx, opacity, breathScale, mouse, speed, bloom }: {
    phaseIdx: number; opacity: number; breathScale: number; mouse: { x: number; y: number }; speed: number; bloom: number;
}) {
    const f0 = phaseIdx === 0 ? opacity : 0;
    const f1 = phaseIdx === 1 ? opacity : 0;
    const f2 = phaseIdx === 2 ? opacity : 0;
    const lightColors = ['#C87820', '#00AACC', '#8800FF'];
    return (
        <>
            <color attach="background" args={['#010006']} />
            <ambientLight intensity={0.04} />
            <pointLight position={[0, .3, -3]} intensity={3} color={lightColors[phaseIdx]} />
            <MuladharaFused opacity={f0} speed={speed} />
            <AnahataLotus opacity={f1} breathScale={breathScale} speed={speed} />
            <SahasraraCrown opacity={f2} speed={speed} />
            <SpiralDust phaseIdx={phaseIdx} opacity={opacity} speed={speed} />
            <CameraRig mouse={mouse} />
            <R3FBoundary><SafePostProcessing bloomIntensity={bloom * opacity} /></R3FBoundary>
        </>
    );
}

// ── Public API ─────────────────────────────────────────────────────────────
interface LeelaGraphicsEmbedProps {
    /** 0 = Muladhara (gold), 1 = Anahata (teal), 2 = Sahasrara (violet) */
    phaseIdx: number;
    isPlaying: boolean;
    /** Optional fixed speed; defaults to 0.55 (gentle) */
    speed?: number;
    bloom?: number;
}

export default function LeelaGraphicsEmbed({ phaseIdx, isPlaying, speed = 0.55, bloom = 1.6 }: LeelaGraphicsEmbedProps) {
    const [mouse, setMouse] = useState({ x: 0, y: 0 });
    const [opacity, setOpacity] = useState(0);
    const [breathSc, setBreathSc] = useState(1.0);
    const [breathPh, setBreathPh] = useState<'in' | 'out'>('out');

    // Fade in
    useEffect(() => {
        const t = setTimeout(() => setOpacity(1), 300);
        return () => clearTimeout(t);
    }, []);

    // Slow breath cycle
    useEffect(() => {
        if (!isPlaying) return;
        const id = setInterval(() => setBreathPh(p => p === 'in' ? 'out' : 'in'), 4000);
        return () => clearInterval(id);
    }, [isPlaying]);

    useEffect(() => {
        const target = breathPh === 'in' ? 1.1 : 0.93;
        let raf: number;
        const tick = () => setBreathSc(s => {
            const n = s + (target - s) * .022;
            if (Math.abs(n - target) < .001) return target;
            raf = requestAnimationFrame(tick); return n;
        });
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [breathPh]);

    // Subtle mouse parallax
    useEffect(() => {
        const mv = (e: MouseEvent) => setMouse({ x: (e.clientX / window.innerWidth - .5) * 2, y: (e.clientY / window.innerHeight - .5) * 2 });
        window.addEventListener('mousemove', mv);
        return () => window.removeEventListener('mousemove', mv);
    }, []);

    const effectiveSpeed = isPlaying ? speed : speed * 0.25;

    return (
        <Canvas
            camera={{ position: [0, 0, 3.2], fov: 55 }}
            gl={{ antialias: false, alpha: false, powerPreference: 'default' }}
            dpr={[1, 1.5]}
            style={{ width: '100%', height: '100%', display: 'block' }}
        >
            <EmbedScene
                phaseIdx={phaseIdx}
                opacity={opacity}
                breathScale={breathSc}
                mouse={mouse}
                speed={effectiveSpeed}
                bloom={bloom}
            />
        </Canvas>
    );
}
