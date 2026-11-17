import test from 'node:test';
import assert from 'node:assert/strict';
import { createParticles, paintParticles, updateInteraction } from '../src/components/materials/mask/particleMask.js';

function context() {
  const transforms = [];
  const ctx = { canvas: { width: 384, height: 512 }, transforms };
  for (const method of ['fillRect', 'save', 'restore', 'beginPath', 'moveTo', 'lineTo', 'bezierCurveTo', 'fill', 'stroke', 'ellipse', 'arc']) ctx[method] = () => {};
  for (const method of ['translate', 'rotate', 'scale']) ctx[method] = (...args) => {
    assert.ok(args.every(Number.isFinite), `${method} must have finite coordinates`);
    transforms.push([method, ...args]);
  };
  return ctx;
}

test('falling leaves and snow hold their landing position, size and rotation before fading', () => {
  for (const id of ['falling', 'snow']) {
    const particles = [{ ...createParticles(1)[0], phase: 0 }];
    const landed = context(); const holding = context();
    paintParticles(landed, particles, { id, duration: 10 }, 5.5);
    paintParticles(holding, particles, { id, duration: 10 }, 7.5);
    assert.deepEqual(landed.transforms, holding.transforms);
    const arriving = context();
    paintParticles(arriving, particles, { id, duration: 10 }, 1);
    assert.notDeepEqual(arriving.transforms, landed.transforms);
  }
});

test('all procedural effects remain finite across repeated loops', () => {
  for (const id of ['circles', 'falling', 'wind', 'flowers', 'snow']) {
    const ctx = context(); const particles = createParticles(64, 17);
    for (const time of [0, 0.01, 1, 4.8, 7.8, 9.99, 10, 1000]) paintParticles(ctx, particles, { id, duration: 10 }, time);
  }
});

test('windblown cover leaves depart beyond the card and uncover it', () => {
  const ctx = context();
  paintParticles(ctx, [{ ...createParticles(1)[0], x: 0.5, phase: 0 }], { id: 'wind', duration: 10 }, 9.99);
  const translation = ctx.transforms.find(([name]) => name === 'translate');
  assert.ok(translation[1] > ctx.canvas.width);
});

test('wind hover clears nearby leaves while distant leaves stay covered', () => {
  const particles = [{ x: 0.5, y: 0.5 }, { x: 0.05, y: 0.05 }];
  const config = { id: 'wind', duration: 14 };
  updateInteraction(particles, [], { hovered: true, x: 0.5, y: 0.5 }, config, 1, {});
  assert.equal(particles[0].blownAt, 1);
  assert.equal(particles[1].blownAt, undefined);
  updateInteraction(particles, [], { hovered: false }, config, 4, {});
  assert.equal(particles[0].blownAt, undefined);
});

test('hover emits particles near the pointer and expires them after their lifecycle', () => {
  for (const id of ['falling', 'snow', 'flowers']) {
    const bursts = []; const state = { lastSpawn: -1, seed: 123 };
    const config = { id, duration: 9 };
    updateInteraction([], bursts, { hovered: true, x: 0.8, y: 0.3 }, config, 1, state);
    assert.equal(bursts.length, 1);
    assert.ok(Math.abs(bursts[0].x - 0.8) <= 0.06);
    assert.ok(Math.abs(bursts[0].y - 0.3) <= 0.06);
    updateInteraction([], bursts, { hovered: false }, config, 11, state);
    assert.equal(bursts.length, 0);
  }
});
