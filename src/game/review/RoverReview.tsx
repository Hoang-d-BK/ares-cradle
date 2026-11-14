import { useEffect, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { RealRoverCraft } from '../art/realism/RealRoverCraft';
import { getWheelRotation } from '../art/realism/roverMotion';

type Direction = -1 | 0 | 1;
function RoverRig({ direction, reset, inspect }: { direction: Direction; reset: number; inspect: boolean }) {
  const root = useRef<THREE.Group>(null);
  const wheels = useRef<THREE.Object3D[]>([]);
  const travel = useRef(0);
  useEffect(() => {
    if (!root.current) return;
    const found: THREE.Object3D[] = [];
    root.current.traverse(object => { if (object.name === 'rolling-wheel') found.push(object); });
    wheels.current = found;
    return () => { wheels.current = []; };
  }, [inspect]);
  useEffect(() => {
    travel.current = 0;
    if (root.current) root.current.position.z = 0;
    for (const wheel of wheels.current) wheel.rotation.x = 0;
  }, [reset]);
  useFrame((_, delta) => {
    if (!root.current || !direction || document.hidden) return;
    const dt = Number.isFinite(delta) ? Math.min(.05, Math.max(0, delta)) : 0;
    const previous = root.current.position.z;
    const next = THREE.MathUtils.clamp(previous + direction * dt * .55, -1.2, 1.2);
    root.current.position.z = next;
    travel.current += next - previous;
    for (const wheel of wheels.current) wheel.rotation.x = getWheelRotation(travel.current);
  });
  return <group ref={root}><RealRoverCraft armPose={inspect ? 'inspect' : 'stowed'} /></group>;
}
export default function RoverReview() {
  const [direction, setDirection] = useState<Direction>(0);
  const [reset, setReset] = useState(0);
  const [inspect, setInspect] = useState(false);
  const [reduced, setReduced] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(() => {
    const stop = () => setDirection(0);
    window.addEventListener('blur', stop); document.addEventListener('visibilitychange', stop);
    return () => { window.removeEventListener('blur', stop); document.removeEventListener('visibilitychange', stop); };
  }, []);
  return <main className="rover-review">
    <style>{`.rover-review{height:100dvh;background:#10171c;color:#f4f1ea;font:18px/1.45 system-ui,sans-serif;display:flex;flex-direction:column}.rover-review header,.rover-review footer{padding:16px 24px;display:flex;align-items:center;gap:12px;flex-wrap:wrap;border-bottom:1px solid #4d5b60}.rover-review h1{font-size:25px;margin:0}.rover-review p{margin:4px 0}.rover-review a{color:#f4f1ea;text-underline-offset:4px;margin-left:auto}.rover-review .viewport{flex:1;min-height:200px}.rover-review button{font:inherit;min-height:48px;padding:8px 18px;border:1px solid #819091;border-radius:4px;background:#27353b;color:#f4f1ea;cursor:pointer}.rover-review button:disabled{opacity:.5;cursor:default}.rover-review button:focus-visible,.rover-review a:focus-visible{outline:3px solid #ffb800;outline-offset:3px}.rover-review button[aria-pressed=true]{background:#f4f1ea;color:#1c2026}.rover-review footer{border-top:1px solid #4d5b60;border-bottom:0}.rover-review small{font-size:15px}.rover-review label{display:flex;gap:8px;align-items:center}@media(max-width:650px){.rover-review header,.rover-review footer{padding:12px}.rover-review h1{font-size:21px}.rover-review button{padding:8px 12px}}`}</style>
    <header><div><h1>Ares Cradle — field rover</h1><p>Existing reference-informed model, now in the production codebase.</p></div><a href="/">Return to game</a></header>
    <div className="viewport"><Canvas shadows dpr={[1, 1.5]} camera={{ position: [5, 3.5, 6], fov: 42 }}>
      <color attach="background" args={['#10171c']} />
      <hemisphereLight args={['#dce6ed', '#694c3c', 2]} />
      <directionalLight position={[4, 8, 5]} intensity={3} color="#fff1db" castShadow />
      <directionalLight position={[-4, 3, -3]} intensity={1} color="#a5c2d4" />
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[30, 30]} /><meshStandardMaterial color="#786151" roughness={1} /></mesh>
      <RoverRig direction={reduced ? 0 : direction} reset={reset} inspect={inspect} />
      <OrbitControls target={[0, 1, 0]} minDistance={3} maxDistance={12} enablePan={false} maxPolarAngle={Math.PI / 2 - .04} />
    </Canvas></div>
    <footer aria-label="Rover inspection controls">
      <button disabled={reduced} aria-pressed={direction === 1} onClick={() => setDirection(1)}>Forward</button>
      <button disabled={reduced} aria-pressed={direction === -1} onClick={() => setDirection(-1)}>Reverse</button>
      <button onClick={() => setDirection(0)}>Stop</button>
      <button aria-pressed={inspect} onClick={() => { setDirection(0); setInspect(value => !value); }}>Inspect arm</button>
      <button onClick={() => { setDirection(0); setInspect(false); setReset(value => value + 1); }}>Rest / reset</button>
      <label><input type="checkbox" checked={reduced} onChange={event => { setDirection(0); setReduced(event.target.checked); }} />Reduced motion</label>
      <small role="status">{direction && !reduced ? 'Bounded motion sample. Use Stop to hold position.' : 'Stopped. Drag the view to inspect the construction.'} Fictional adaptation, not certified flight hardware.</small>
    </footer>
  </main>;
}
