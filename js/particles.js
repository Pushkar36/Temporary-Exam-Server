/* =========================================================
   PARTICLES.JS — DevOps-Themed Canvas Particle System
   Floating nodes (cyan/purple) with connecting lines.
   ========================================================= */

(function () {
  'use strict';

  const canvas = document.getElementById('particles-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');

  /* ── Config ─────────────────────────────────────────── */
  const CFG = {
    particleCount: 80,
    connectDistance: 140,
    speed: 0.45,
    minRadius: 1.5,
    maxRadius: 4,
    colors: [
      'rgba(0, 212, 255, ALPHA)',   // cyan
      'rgba(124, 58, 237, ALPHA)',  // purple
      'rgba(0, 212, 255, ALPHA)',   // cyan (weighted higher)
      'rgba(167, 139, 250, ALPHA)', // purple-light
    ],
    lineOpacityMax: 0.25,
    pulseSpeed: 0.02,
  };

  let W, H, particles = [], animId;

  /* ── Resize ──────────────────────────────────────────── */
  function resize() {
    W = canvas.width  = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
  }

  /* ── Particle factory ────────────────────────────────── */
  function createParticle() {
    const colorTemplate = CFG.colors[Math.floor(Math.random() * CFG.colors.length)];
    const radius = CFG.minRadius + Math.random() * (CFG.maxRadius - CFG.minRadius);
    return {
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * CFG.speed * 2,
      vy: (Math.random() - 0.5) * CFG.speed * 2,
      radius,
      colorTemplate,
      alpha: 0.5 + Math.random() * 0.5,
      pulseOffset: Math.random() * Math.PI * 2,
      // DevOps node type: server, container, pipeline, database
      type: ['server', 'container', 'pipeline', 'database'][Math.floor(Math.random() * 4)],
    };
  }

  function initParticles() {
    particles = [];
    for (let i = 0; i < CFG.particleCount; i++) {
      particles.push(createParticle());
    }
  }

  /* ── Draw one particle ───────────────────────────────── */
  function drawParticle(p, t) {
    const pulse = Math.sin(t * CFG.pulseSpeed + p.pulseOffset) * 0.3 + 0.7;
    const alpha = p.alpha * pulse;
    const color = p.colorTemplate.replace('ALPHA', alpha.toFixed(3));

    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();

    // Glow ring for larger particles
    if (p.radius > 2.5) {
      const glowColor = p.colorTemplate.replace('ALPHA', (alpha * 0.25).toFixed(3));
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius * 2.5, 0, Math.PI * 2);
      ctx.fillStyle = glowColor;
      ctx.fill();
    }
  }

  /* ── Draw connecting lines ───────────────────────────── */
  function drawConnections() {
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const a = particles[i];
        const b = particles[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < CFG.connectDistance) {
          const opacity = CFG.lineOpacityMax * (1 - dist / CFG.connectDistance);

          // Gradient line between cyan and purple based on particle colors
          const grad = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
          grad.addColorStop(0, a.colorTemplate.replace('ALPHA', opacity.toFixed(3)));
          grad.addColorStop(1, b.colorTemplate.replace('ALPHA', opacity.toFixed(3)));

          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = grad;
          ctx.lineWidth = 0.8;
          ctx.stroke();

          // Animate a travelling dot along the line (only for some pairs)
          if (dist < 80 && Math.random() < 0.002) {
            drawTravelDot(a, b, opacity * 3);
          }
        }
      }
    }
  }

  /* ── Travelling signal dot ───────────────────────────── */
  const travelDots = [];

  function drawTravelDot(a, b, opacity) {
    travelDots.push({
      ax: a.x, ay: a.y,
      bx: b.x, by: b.y,
      t: 0,
      speed: 0.008 + Math.random() * 0.012,
      color: a.colorTemplate.replace('ALPHA', Math.min(opacity, 1).toFixed(3)),
    });
  }

  function updateTravelDots() {
    for (let i = travelDots.length - 1; i >= 0; i--) {
      const d = travelDots[i];
      d.t += d.speed;
      if (d.t >= 1) {
        travelDots.splice(i, 1);
        continue;
      }
      const x = d.ax + (d.bx - d.ax) * d.t;
      const y = d.ay + (d.by - d.ay) * d.t;
      ctx.beginPath();
      ctx.arc(x, y, 2, 0, Math.PI * 2);
      ctx.fillStyle = d.color;
      ctx.fill();
    }
  }

  /* ── Update position ─────────────────────────────────── */
  function updateParticle(p) {
    p.x += p.vx;
    p.y += p.vy;

    // Wrap around edges
    if (p.x < -p.radius) p.x = W + p.radius;
    if (p.x > W + p.radius) p.x = -p.radius;
    if (p.y < -p.radius) p.y = H + p.radius;
    if (p.y > H + p.radius) p.y = -p.radius;
  }

  /* ── Main loop ───────────────────────────────────────── */
  let tick = 0;
  function loop() {
    animId = requestAnimationFrame(loop);
    tick++;
    ctx.clearRect(0, 0, W, H);

    drawConnections();
    updateTravelDots();

    particles.forEach(p => {
      updateParticle(p);
      drawParticle(p, tick);
    });
  }

  /* ── Mouse interaction ───────────────────────────────── */
  const mouse = { x: -9999, y: -9999, radius: 120 };

  canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;

    // Gently repel particles near mouse
    particles.forEach(p => {
      const dx = p.x - mouse.x;
      const dy = p.y - mouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < mouse.radius) {
        const force = (mouse.radius - dist) / mouse.radius;
        p.vx += (dx / dist) * force * 0.08;
        p.vy += (dy / dist) * force * 0.08;
        // Clamp speed
        const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        if (speed > CFG.speed * 4) {
          p.vx = (p.vx / speed) * CFG.speed * 4;
          p.vy = (p.vy / speed) * CFG.speed * 4;
        }
      }
    });
  });

  canvas.addEventListener('mouseleave', () => {
    mouse.x = -9999;
    mouse.y = -9999;
    // Decay back to normal speed
    particles.forEach(p => {
      p.vx *= 0.95;
      p.vy *= 0.95;
      const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
      if (speed < CFG.speed * 0.5) {
        p.vx = (Math.random() - 0.5) * CFG.speed * 2;
        p.vy = (Math.random() - 0.5) * CFG.speed * 2;
      }
    });
  });

  /* ── Init ────────────────────────────────────────────── */
  function init() {
    resize();
    initParticles();
    loop();
  }

  window.addEventListener('resize', () => {
    resize();
    initParticles();
  });

  // Start after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
