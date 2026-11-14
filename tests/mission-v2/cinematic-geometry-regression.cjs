'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const THREE = require('three');
const sourcePath = path.resolve(__dirname, '../../src/game/mission/presentation/cinematics/MissionCinematic.tsx');
const compiled = ts.transpileModule(fs.readFileSync(sourcePath, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX },
}).outputText;
const jsxRuntime = { jsx: () => null, jsxs: () => null, Fragment: Symbol('Fragment') };
const compiledModule = { exports: {} };
vm.runInNewContext(compiled, {
  module: compiledModule, exports: compiledModule.exports, require: (id) => id === 'three' ? THREE : id === 'react/jsx-runtime' ? jsxRuntime : id.endsWith('.css') ? {} : { Canvas() {}, useFrame() {}, useThree() { return {}; }, useCallback: (f) => f, useEffect() {}, useMemo: (f) => f(), useRef: () => ({ current: null }), useState: (v) => [v, () => {}] },
  Math, Number, Array, Object, Symbol, performance: { now: () => 0 }, requestAnimationFrame: () => 0, cancelAnimationFrame() {}, document: {},
}, { filename: sourcePath });
const { getLanderGeometryPose: pose } = compiledModule.exports;
const groundY = -0.1;
const near = (actual, expected, message) => assert.ok(Math.abs(actual - expected) < 1e-9, `${message}: ${actual} != ${expected}`);
const finite = (value) => {
  if (typeof value === 'number') assert.ok(Number.isFinite(value), 'non-finite geometry value');
  else if (Array.isArray(value)) value.forEach(finite);
  else if (value && typeof value === 'object') Object.values(value).forEach(finite);
};
for (const legsDeployed of [0, 0.5, 1, -10, 10, NaN]) {
  for (const rampOpen of [0, 0.5, 1, -10, 10, NaN]) {
    const p = pose(legsDeployed, rampOpen);
    const boundedRamp = Number.isFinite(rampOpen) ? Math.min(1, Math.max(0, rampOpen)) : 0;
    finite(p);
    assert.ok(p.solidLowestY >= groundY - 1e-9, `solid penetration legs=${legsDeployed}, ramp=${rampOpen}: ${p.solidLowestY}`);
    for (const y of p.footBottomY) assert.ok(y >= groundY - 1e-9, `foot penetrates: ${y}`);
    for (const corner of [...p.rampCorners, ...p.trimCorners]) assert.ok(corner[1] >= groundY - 1e-9, `ramp corner penetrates: ${corner[1]}`);
    assert.equal(p.rampHinge[0], 0, 'hinge must run along X');
    if (boundedRamp > 0.01) {
      assert.ok(p.rampTip[2] > p.rampHinge[2], 'open tip must extend forward (+Z)');
    } else {
      const closedEndpoint = new THREE.Vector3(0, -1.5, 0)
        .applyEuler(new THREE.Euler(p.rampAngleX, 0, 0, 'XYZ'))
        .add(new THREE.Vector3(...p.rampHinge));
      for (let axis = 0; axis < 3; axis++) near(p.rampTip[axis], closedEndpoint.toArray()[axis], `closed ramp endpoint axis ${axis}`);
    }
  }
}
const folded = pose(0, 0), deployed = pose(1, 0), open = pose(1, 1);
assert.notDeepEqual(folded.legs.map((leg) => leg.foot), deployed.legs.map((leg) => leg.foot), 'legs must deploy in rendered pose');
assert.equal(deployed.footBottomY.length, 4, 'deployed lander must have four foot supports');
for (const [index, y] of deployed.footBottomY.entries()) near(y, groundY, `deployed foot pad ${index} contacts ground`);
near(open.rampTip[1], groundY + 0.12 / 2 * Math.sin(0.55), 'open ramp tip bottom-face center height');
assert.ok(open.rampTip[2] > open.rampHinge[2], 'open ramp extends toward +Z');
assert.ok(folded.rampCorners.some((corner) => corner[1] > 1.2), 'closed ramp stands upright against hull');
assert.ok(open.rampCorners.some((corner) => Math.abs(corner[1] - groundY) < 1e-9), 'open ramp thickness corner touches ground');
const clamped = pose(100, -50);
assert.equal(clamped.footBottomY.length, 4, 'clamped pose must retain four foot supports');
for (const [index, y] of clamped.footBottomY.entries()) near(y, deployed.footBottomY[index], `clamped foot ${index} matches deployed pose`);
console.log('PASS cinematic geometry regression: actual TSX pose helper, finite/bounded poses, deployed foot contact, ramp X-hinge/corner sweep, and no solid below ground');
