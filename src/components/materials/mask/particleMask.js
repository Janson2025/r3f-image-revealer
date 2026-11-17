const TAU = Math.PI * 2;
const clamp = (x) => Math.max(0, Math.min(1, x));
const smooth = (x) => { const t = clamp(x); return t * t * (3 - 2 * t); };

export function createParticles(count, seed = 1, config = {}) {
  let state = seed;
  const random = () => { state = (state * 1664525 + 1013904223) >>> 0; return state / 4294967296; };
  return Array.from({ length: count }, (_, i) => {
    const cluster = () => 0.5 + ((random() + random() + random()) / 3 - 0.5) * (config.spread ?? 1.12);
    return {
      x: config.id === 'wind' ? random() : cluster(),
      y: config.id === 'wind' ? random() : cluster(),
      size: (config.minSize ?? 0.075) + random() * ((config.maxSize ?? 0.145) - (config.minSize ?? 0.075)),
      phase: random(), rotation: random() * TAU, spin: (random() - 0.5) * 12,
      sway: 0.06 + random() * 0.14, orbit: random(), opacity: 0.01 + random() * 0.99, index: i,
    };
  });
}

function flower(ctx, bloom) {
  for (let i = 0; i < 7; i++) {
    ctx.save(); ctx.rotate(i * TAU / 7); ctx.beginPath();
    ctx.ellipse(0, -0.75 * bloom, 0.12 + 0.35 * bloom, 0.2 + 0.65 * bloom, 0, 0, TAU);
    ctx.fill(); ctx.restore();
  }
  ctx.beginPath(); ctx.arc(0, 0, 0.23, 0, TAU); ctx.fill();
}

function snowflake(ctx) {
  ctx.lineWidth = 0.065; ctx.lineCap = 'round'; ctx.beginPath();
  for (let arm = 0; arm < 6; arm++) {
    const a = arm * TAU / 6;
    const point = (x, y) => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)];
    ctx.moveTo(0, 0); ctx.lineTo(...point(0, -1));
    for (const y of [-0.45, -0.72]) {
      ctx.moveTo(...point(-0.22, y - 0.17)); ctx.lineTo(...point(0, y)); ctx.lineTo(...point(0.22, y - 0.17));
    }
  }
  ctx.stroke();
}

export function paintParticles(ctx, particles, config, time, leafSprite = null, interaction = {}) {
  const { width: w, height: h } = ctx.canvas;
  ctx.globalAlpha = 1;
  ctx.fillStyle = config.id === 'wind' ? 'white' : 'black'; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = config.id === 'wind' ? 'black' : 'white'; ctx.strokeStyle = 'white';
  for (const p of particles) {
    const life = p.born === undefined ? (time / config.duration + p.phase) % 1 : (time - p.born) / (config.hoverDuration ?? config.duration);
    if (life < 0 || life >= 1) continue;
    let x = p.x, y = p.y, rotation = p.rotation, size = p.size, alpha = 1, bloom = 1;
    if (config.id === 'circles') {
      const distance = (config.minDistanceRatio ?? 0.05) + Math.pow(p.orbit ?? p.phase, config.distanceExponent ?? 0.7) * ((config.maxDistanceRatio ?? 0.65) - (config.minDistanceRatio ?? 0.05));
      const angle = p.rotation + (interaction.orbitTime ?? time) * p.spin / 60;
      x = 0.5 + Math.cos(angle) * distance * 0.5;
      y = 0.5 + Math.sin(angle) * distance * 0.5 * w / h;
      size = ((config.maxSize ?? 0.1) * (1 - distance) + (config.minSize ?? 0.01) * distance) * (interaction.sizeMul ?? 1);
      alpha = p.opacity ?? 1;
    } else if (config.id === 'falling' || config.id === 'snow') {
      const arrival = smooth(life / (p.born === undefined ? 0.48 : (config.hoverArrival ?? 0.22))); const airborne = 1 - arrival;
      x += Math.sin(arrival * Math.PI) * p.sway * Math.cos(p.rotation) + Math.sin(arrival * TAU * 2 + p.rotation) * p.sway * airborne;
      y -= airborne * (p.born === undefined ? 0.65 + p.y * 0.4 : (config.hoverFallDistance ?? 0.1));
      rotation += p.spin * arrival + Math.sin(arrival * TAU * 2) * airborne;
      size *= 0.15 + 0.85 * arrival;
      alpha = smooth(life / 0.06) * (1 - smooth((life - 0.78) / 0.22));
    } else if (config.id === 'flowers') {
      bloom = smooth(life / (p.born === undefined ? 0.58 : (config.hoverBloom ?? 0.2)) + (p.bloomBoost ?? 0)); size *= 0.15 + 0.85 * bloom;
      rotation += bloom * 0.45;
      alpha = smooth(life / 0.08) * (1 - smooth((life - 0.76) / 0.24));
    } else if (config.id === 'wind') {
      // Most leaves stay put. Only the last fifth of each staggered lifecycle
      // blows away, and a new leaf fades in at that location on the next cycle.
      const depart = p.blownAt === undefined ? smooth((life - 0.8) / 0.2) : smooth((time - p.blownAt) / 1.6);
      x += depart * 1.4; y += Math.sin(depart * Math.PI) * p.sway * 2 - depart * 0.4;
      rotation += depart * p.spin * 2; size *= (config.coverSizeMul ?? 1.5) * (1 + Math.sin(depart * Math.PI) * 0.3);
      alpha = smooth(life / 0.08) * (1 - smooth((depart - 0.75) / 0.25));
    }
    ctx.save(); ctx.globalAlpha = alpha;
    ctx.translate(x * w, y * h); ctx.rotate(rotation); ctx.scale(size * w, size * w);
    if (config.id === 'circles') { ctx.beginPath(); ctx.arc(0, 0, 1, 0, TAU); ctx.fill(); }
    else if (config.id === 'flowers') flower(ctx, bloom);
    else if (config.id === 'snow') snowflake(ctx);
    else if (leafSprite) {
      const sprite = config.id === 'wind' ? leafSprite.black : leafSprite.white;
      const width = 2 * sprite.width / Math.max(sprite.width, sprite.height);
      const height = 2 * sprite.height / Math.max(sprite.width, sprite.height);
      ctx.drawImage(sprite, -width / 2, -height / 2, width, height);
    }
    ctx.restore();
  }
  ctx.globalAlpha = 1;
}

export function updateInteraction(particles, bursts, pointer, config, time, state) {
  if (config.id === 'flowers') {
    const delta = Math.max(0, time - (state.lastBloomTime ?? time));
    state.lastBloomTime = time;
    for (const p of particles) {
      const cycle = Math.floor(time / config.duration + p.phase);
      if (p.bloomCycle !== cycle) { p.bloomCycle = cycle; p.bloomBoost = 0; }
      if (pointer.hovered) p.bloomBoost = Math.min(1, p.bloomBoost + delta * (config.hoverBloomSpeed ?? 1.8));
    }
  }
  if (config.id === 'wind') {
    for (const p of particles) {
      if (p.blownAt !== undefined && time - p.blownAt > 2.8) {
        delete p.blownAt;
        p.phase = (1 - time / config.duration % 1) % 1;
      }
      if (pointer.hovered && p.blownAt === undefined && Math.hypot((p.x - pointer.x), (p.y - pointer.y) * 4 / 3) < 0.22) p.blownAt = time;
    }
  } else if (['falling', 'flowers', 'snow'].includes(config.id) && pointer.hovered && time - state.lastSpawn > (config.hoverInterval ?? 0.13)) {
    state.lastSpawn = time;
    const p = createParticles(1, ++state.seed, config)[0];
    p.sway *= 0.3;
    p.x = clamp(pointer.x + (Math.random() - 0.5) * 0.12);
    p.y = clamp(pointer.y + (Math.random() - 0.5) * 0.12);
    p.born = time; bursts.push(p);
  }
  while (bursts.length && time - bursts[0].born >= (config.hoverDuration ?? config.duration)) bursts.shift();
  if (bursts.length > 80) bursts.splice(0, bursts.length - 80);
}
