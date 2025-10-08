(function () {
  const canvas = document.getElementById("pendulumCanvas");
  const ctx = canvas.getContext("2d", { alpha: true });

  function resize() {
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = Math.floor(rect.width);
    canvas.height = Math.floor(rect.height);
  }
  window.addEventListener("resize", resize);
  resize();

  // Smaller pendulum & centered
  const lengths = [90, 70, 50]; // reduced
  const angles = [Math.PI / 2 - 0.6, Math.PI / 2 + 0.4, Math.PI / 2 - 0.3];
  const angularVel = [0.0, 0.0, 0.0];
  const trail = [];
  let trailMax = 500;

  const trailSlider = document.getElementById("trailSlider");
  trailSlider.addEventListener("input", () => {
    const v = Number(trailSlider.value);
    trailMax = Math.floor(150 + v * 25);
  });

  let paused = false;
  document.getElementById("pauseBtn").addEventListener("click", () => {
    paused = !paused;
    document.getElementById("pauseBtn").innerText = paused ? "Resume" : "Pause";
  });
  document.getElementById("resetBtn").addEventListener("click", () => {
    angles[0] = Math.PI / 2 + (Math.random() - 0.5) * 1.6;
    angles[1] = Math.PI / 2 + (Math.random() - 0.5) * 1.6;
    angles[2] = Math.PI / 2 + (Math.random() - 0.5) * 1.6;
    angularVel[0] = angularVel[1] = angularVel[2] = 0;
    trail.length = 0;
  });

  let lastTime = performance.now();
  let fps = 0,
    frames = 0,
    fpsLast = performance.now();

  function strokeGlowLine(a, b, color, width) {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.shadowBlur = 24;
    ctx.shadowColor = color;
    ctx.lineWidth = width;
    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
    ctx.restore();
  }

  function animate(now) {
    requestAnimationFrame(animate);
    const dt = Math.min(40, now - lastTime) / 1000;
    lastTime = now;

    frames++;
    if (now - fpsLast > 500) {
      fps = Math.round((frames * 1000) / (now - fpsLast));
      frames = 0;
      fpsLast = now;
      document.getElementById("fps").innerText = fps;
    }

    if (!paused) {
      const g = 0.6;
      for (let i = 0; i < 3; i++) {
        angularVel[i] *= 0.998 - i * 0.001;
        angularVel[i] +=
          Math.sin(now / 1000 + i * 1.3) * 0.0008 +
          (Math.random() - 0.5) * 0.0003;
      }
      angularVel[0] += (Math.sin(angles[1]) - Math.sin(angles[0])) * 0.0015;
      angularVel[1] += (Math.sin(angles[2]) - Math.sin(angles[1])) * 0.0013;
      angularVel[2] += (Math.cos(angles[0]) - Math.cos(angles[2])) * 0.0009;
      for (let i = 0; i < 3; i++) {
        angles[i] += angularVel[i] * dt * 60;
      }
    }

    const origin = {
      x: canvas.width / 2,
      y: canvas.height / 2 - 60, // centered vertically
    };
    const p1 = {
      x: origin.x + Math.sin(angles[0]) * lengths[0],
      y: origin.y + Math.cos(angles[0]) * lengths[0],
    };
    const p2 = {
      x: p1.x + Math.sin(angles[1]) * lengths[1],
      y: p1.y + Math.cos(angles[1]) * lengths[1],
    };
    const p3 = {
      x: p2.x + Math.sin(angles[2]) * lengths[2],
      y: p2.y + Math.cos(angles[2]) * lengths[2],
    };

    trail.unshift({ x: p3.x, y: p3.y, t: now });
    if (trail.length > trailMax) trail.length = trailMax;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Ambient glow
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const g = ctx.createRadialGradient(
      origin.x,
      origin.y,
      10,
      origin.x,
      origin.y,
      280
    );
    g.addColorStop(0, "rgba(40,100,200,0.04)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();

    // Trail
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < trail.length; i++) {
      const p = trail[i];
      const age = (now - p.t) / 1000;
      const alpha = Math.max(0, 1 - age / 4);
      ctx.beginPath();
      const hue = 200 + 40 * Math.sin(now / 800 + i * 0.02);
      ctx.fillStyle = `hsla(${hue},100%,60%,${alpha * 0.8})`;
      ctx.shadowBlur = 12 * (alpha + 0.1);
      ctx.shadowColor = `hsla(${hue},100%,65%,${alpha})`;
      ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // Arms and nodes
    strokeGlowLine(origin, p1, "rgba(100,180,255,0.18)", 6);
    strokeGlowLine(p1, p2, "rgba(120,200,255,0.14)", 4);
    strokeGlowLine(p2, p3, "rgba(160,220,255,0.10)", 3);

    strokeGlowLine(origin, p1, "rgba(110,220,255,0.9)", 1.3);
    strokeGlowLine(p1, p2, "rgba(150,210,255,0.9)", 1.1);
    strokeGlowLine(p2, p3, "rgba(200,240,255,0.95)", 1.0);

    const drawNode = (pt, c, r) => {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.beginPath();
      ctx.fillStyle = c;
      ctx.shadowBlur = 24;
      ctx.shadowColor = c;
      ctx.arc(pt.x, pt.y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };
    drawNode(origin, "rgba(120,200,255,0.6)", 4);
    drawNode(p1, "rgba(130,220,255,0.8)", 5);
    drawNode(p2, "rgba(190,240,255,0.95)", 5);
    drawNode(p3, "rgba(255,255,255,1)", 4);

    const energy =
      (Math.abs(Math.sin(angles[0])) +
        Math.abs(Math.sin(angles[1])) +
        Math.abs(Math.sin(angles[2]))) *
      2.2;
    document.getElementById("energyVal").innerText = energy.toFixed(2);
  }

  requestAnimationFrame(animate);

  setInterval(() => {
    angles[0] += (Math.random() - 0.5) * 1.6;
    angles[1] += (Math.random() - 0.5) * 1.6;
    angles[2] += (Math.random() - 0.5) * 1.6;
    angularVel[0] += (Math.random() - 0.5) * 0.6;
    angularVel[1] += (Math.random() - 0.5) * 0.6;
    angularVel[2] += (Math.random() - 0.5) * 0.6;
    trail.splice(Math.floor(trail.length * 0.6));
  }, 15000);
})();
