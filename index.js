/* =========================================================
   ตั้งค่าตรงนี้ได้เลย (Edit here)
   ========================================================= */
const CONFIG = {
  from: "แว่น",                       // ชื่อเรา
  startDate: "2026-07-07T00:00:00",   // วันที่เริ่มคบกัน (ค.ศ.)
  youtube: "",                        // เพลงจาก YouTube (ใส่ ID ของวิดีโอ เช่น "ZVPENtaBJso", ใส่ "" ถ้าจะใช้ไฟล์ mp3 แทน)
  music: "fellow_fellow_-_(mp3.pm) (1).mp3",                // ไฟล์เพลง (ใช้เมื่อไม่ได้ใส่ youtube / ถ้าไม่มี จะเล่นเสียงกล่องดนตรีแทน)
  photos: {
    intro: "images/photo1.jpg",       // รูปหน้าแรก
  },
};

/* ========================================================= */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];

const ORDER = ["intro", "1", "2", "3", "4", "final"];
let current = 0;
const START = new Date(CONFIG.startDate);

/* ---------- names & photos ---------- */
$$("[data-from]").forEach((el) => (el.textContent = CONFIG.from));
$$("[data-photo]").forEach((img) => {
  img.onerror = () => {
    const box = img.parentElement;
    img.remove();
    box.textContent = img.dataset.photo === "intro" ? "💑" : "📸";
  };
  img.src = CONFIG.photos[img.dataset.photo];
});
const thMonths = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
$("#startDateText").textContent = `${START.getDate()} ${thMonths[START.getMonth()]} ${START.getFullYear() + 543}`;

/* ---------- navigation ---------- */
function go(index) {
  current = Math.max(0, Math.min(ORDER.length - 1, index));
  const name = ORDER[current];
  $$(".screen").forEach((s) => s.classList.toggle("active", s.dataset.screen === name));
  window.scrollTo({ top: 0, behavior: "smooth" });

  const isStep = current >= 1 && current <= 4;
  $("#progress").classList.toggle("hidden", !isStep);
  $("#bottomNav").classList.toggle("hidden", !isStep);
  $("#btnRestart").classList.toggle("hidden", current === 0);
  $$("#progress i").forEach((bar, i) => bar.classList.toggle("on", i < current));
  $("#pageNo").textContent = `${current} / 4`;
  $("#btnNext").textContent = current === 4 ? "รับข้อความสุดท้าย →" : "ไปต่อ / ข้าม →";

  if (name === "2") buildBouquet();
  if (name === "4") Ring.init();
  if (name === "final") confettiBurst();
}

$("#btnOpen").onclick = () => { Music.play(); go(1); };
$("#btnNext").onclick = () => go(current + 1);
$("#btnBack").onclick = () => go(current - 1);
$("#btnRestart").onclick = () => { Ring.reset(); go(0); };
$("#btnAgain").onclick = () => { Ring.reset(); go(0); };

/* ---------- music ---------- */
const Music = (() => {
  const audio = $("#bgm");
  let useSynth = false, playing = false, ctx, timer, step = 0;
  let mode = CONFIG.youtube ? "youtube" : "audio";
  let yt = null, ytReady = false;

  if (mode === "youtube") {
    // ผู้เล่น YouTube แบบซ่อน (เล่นแค่เสียง)
    window.onYouTubeIframeAPIReady = () => {
      yt = new YT.Player("ytPlayer", {
        width: 200, height: 200, videoId: CONFIG.youtube,
        playerVars: { autoplay: 0, controls: 0, loop: 1, playlist: CONFIG.youtube, playsinline: 1, rel: 0 },
        events: {
          onReady: () => { ytReady = true; yt.setVolume(70); if (playing) yt.playVideo(); },
          onError: () => { mode = "synth"; if (playing) play(); },
        },
      });
    };
    const s = document.createElement("script");
    s.src = "https://www.youtube.com/iframe_api";
    s.onerror = () => (mode = "synth");
    document.head.appendChild(s);
  } else {
    audio.src = encodeURI(CONFIG.music);
    audio.volume = 0.6;
    audio.addEventListener("error", () => (useSynth = true));
  }

  // ทำนองกล่องดนตรีสั้น ๆ (ใช้เมื่อไม่มีไฟล์เพลง)
  const melody = [76, 79, 84, 83, 79, 76, 77, 81, 79, 0, 76, 79, 84, 86, 84, 83, 81, 79, 0, 0,
                  74, 77, 81, 79, 77, 76, 74, 72, 74, 76, 79, 76, 72, 0, 0, 0];
  const bass = [48, 0, 55, 0, 53, 0, 50, 0, 55, 0];
  function note(midi, t, vol) {
    const f = 440 * 2 ** ((midi - 69) / 12);
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = "sine"; o.frequency.value = f;
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.4);
    o.connect(g).connect(ctx.destination);
    o.start(t); o.stop(t + 1.5);
  }
  function tick() {
    const t = ctx.currentTime + 0.05;
    const m = melody[step % melody.length];
    if (m) note(m, t, 0.12);
    if (step % 4 === 0) { const b = bass[(step / 4) % bass.length]; if (b) note(b, t, 0.08); }
    step++;
    timer = setTimeout(tick, 330);
  }

  function setUI() {
    $("#btnMusic .lbl").textContent = playing ? "พักเพลง" : "เล่นเพลง";
    $("#btnMusic .pi").textContent = playing ? "❚❚" : "▶";
    $("#btnMusicTop").classList.toggle("spin", playing);
  }
  function play() {
    playing = true; setUI();
    if (mode === "youtube") {
      if (ytReady) yt.playVideo(); // ถ้ายังโหลดไม่เสร็จ จะเล่นเองตอน onReady
      // ถ้า YouTube เล่นไม่ได้ (เช่น เปิดไฟล์ตรง ๆ แบบ file://) ให้ใช้เสียงกล่องดนตรีแทน
      setTimeout(() => {
        const ok = ytReady && [1, 3].includes(yt.getPlayerState());
        if (playing && mode === "youtube" && !ok) { mode = "synth"; play(); }
      }, 6000);
      return;
    }
    if (mode === "synth") useSynth = true;
    if (!useSynth) {
      audio.play().catch(() => { useSynth = true; play(); });
      return;
    }
    ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
    ctx.resume(); clearTimeout(timer); tick();
  }
  function pause() {
    playing = false; setUI();
    audio.pause(); clearTimeout(timer);
    if (ytReady) yt.pauseVideo();
  }
  const toggle = () => (playing ? pause() : play());
  $("#btnMusic").onclick = toggle;
  $("#btnMusicTop").onclick = toggle;
  setUI();

  // เล่นอัตโนมัติทันทีที่เปิดเว็บ
  // (ถ้าเบราว์เซอร์บล็อก จะเริ่มเล่นทันทีที่แตะ/คลิกหน้าจอครั้งแรก)
  let userPaused = false;
  $("#btnMusic").addEventListener("click", () => (userPaused = !playing));
  $("#btnMusicTop").addEventListener("click", () => (userPaused = !playing));
  const UNLOCK_EVENTS = ["pointerdown", "keydown", "touchstart"];
  function unlock(e) {
    UNLOCK_EVENTS.forEach((ev) => removeEventListener(ev, unlock, true));
    if (e.target.closest && e.target.closest("#btnMusic, #btnMusicTop")) return; // ให้ปุ่มเพลงจัดการเอง
    if (!userPaused && !playing) play();
  }
  if (mode === "audio") {
    playing = true; setUI();
    audio.play().catch(() => {
      if (useSynth) return;
      playing = false; setUI();
      UNLOCK_EVENTS.forEach((ev) => addEventListener(ev, unlock, true));
    });
  }
  return { play: () => { if (!userPaused && !playing) play(); } };
})();

/* ---------- fish tank ---------- */
const Fish = (() => {
  const tank = $("#tank"), layer = $("#fishes");
  const kinds = ["🐠", "🐟", "🐡", "🐠", "🐟"];
  let paused = false, foods = [];
  const fishes = kinds.map((k, i) => {
    const el = document.createElement("div");
    el.className = "fish"; el.textContent = k;
    el.style.fontSize = 24 + Math.random() * 12 + "px";
    layer.appendChild(el);
    return { el, x: 20 + Math.random() * 60, y: 25 + Math.random() * 40, tx: 50, ty: 50, speed: 0.08 + Math.random() * 0.08, dir: 1, phase: i };
  });
  const newTarget = (f) => { f.tx = 12 + Math.random() * 76; f.ty = 22 + Math.random() * 46; };
  fishes.forEach(newTarget);

  function bubble() {
    const b = document.createElement("div");
    const s = 4 + Math.random() * 8;
    b.className = "bubble";
    Object.assign(b.style, { width: s + "px", height: s + "px", left: 20 + Math.random() * 60 + "%", bottom: "20%", animationDuration: 3 + Math.random() * 3 + "s" });
    layer.appendChild(b);
    setTimeout(() => b.remove(), 6000);
  }
  setInterval(() => { if (!paused && ORDER[current] === "1") bubble(); }, 700);

  tank.addEventListener("click", (e) => {
    const r = tank.getBoundingClientRect();
    for (let i = 0; i < 4; i++) {
      const el = document.createElement("div");
      el.className = "food";
      const f = { el, x: ((e.clientX - r.left) / r.width) * 100 + (Math.random() * 8 - 4), y: 14 };
      layer.appendChild(el); foods.push(f);
    }
  });

  let t = 0;
  function loop() {
    requestAnimationFrame(loop);
    if (paused || ORDER[current] !== "1") return;
    t += 0.03;
    foods.forEach((f) => { if (f.y < 76) f.y += 0.15; f.el.style.left = f.x + "%"; f.el.style.top = f.y + "%"; });
    fishes.forEach((f) => {
      const food = foods[0] && foods.reduce((a, b) => (Math.hypot(a.x - f.x, a.y - f.y) < Math.hypot(b.x - f.x, b.y - f.y) ? a : b));
      const tx = food ? food.x : f.tx, ty = food ? food.y : f.ty;
      const dx = tx - f.x, dy = ty - f.y, d = Math.hypot(dx, dy);
      const sp = food ? f.speed * 2.5 : f.speed;
      if (d < 2) {
        if (food) { food.el.remove(); foods = foods.filter((x) => x !== food); }
        else newTarget(f);
      } else { f.x += (dx / d) * sp; f.y += (dy / d) * sp; }
      if (Math.abs(dx) > 0.5) f.dir = dx > 0 ? -1 : 1; // emoji หันซ้ายเป็นค่าเริ่มต้น
      const wob = Math.sin(t * 3 + f.phase) * 1.2;
      f.el.style.left = f.x + "%"; f.el.style.top = f.y + wob + "%";
      f.el.style.transform = `translate(-50%,-50%) scaleX(${f.dir})`;
    });
  }
  loop();

  $("#btnFish").onclick = () => {
    paused = !paused;
    $("#btnFish").innerHTML = paused ? "<span>▶</span> ให้ปลาว่าย" : "<span>❚❚</span> พักปลา";
  };
})();

/* ---------- flowers ---------- */
const FLOWER_COLORS = [["#f7a1b5", "#e86f8c"], ["#ffc2cf", "#f28aa5"], ["#f9d0dc", "#ee9bb3"], ["#c9b6ff", "#9b82e8"], ["#fff1f4", "#f5c2cf"]];
let bouquetBuilt = false;

function rose(x, y, size, colors, delay = 0) {
  const ns = "http://www.w3.org/2000/svg";
  const g = document.createElementNS(ns, "g");
  g.setAttribute("class", "bloom");
  g.style.animationDelay = delay + "s";
  const [light, dark] = colors;
  const parts = [];
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    parts.push(`<ellipse cx="${x + Math.cos(a) * size * 0.45}" cy="${y + Math.sin(a) * size * 0.45}" rx="${size * 0.55}" ry="${size * 0.45}" fill="${light}" stroke="${dark}" stroke-width="1.2" transform="rotate(${(a * 180) / Math.PI} ${x + Math.cos(a) * size * 0.45} ${y + Math.sin(a) * size * 0.45})"/>`);
  }
  parts.push(`<circle cx="${x}" cy="${y}" r="${size * 0.55}" fill="${dark}"/>`);
  parts.push(`<path d="M${x - size * 0.3} ${y} a${size * 0.3} ${size * 0.3} 0 1 1 ${size * 0.4} ${size * 0.15}" stroke="${light}" stroke-width="1.6" fill="none"/>`);
  g.innerHTML = parts.join("");
  return g;
}
function stem(x, y, delay = 0) {
  const ns = "http://www.w3.org/2000/svg";
  const p = document.createElementNS(ns, "path");
  p.setAttribute("d", `M100 200 Q${(x + 100) / 2} ${(y + 200) / 2 + 10} ${x} ${y}`);
  p.setAttribute("stroke", "#5f9e5a"); p.setAttribute("stroke-width", "3"); p.setAttribute("fill", "none");
  p.setAttribute("class", "stem"); p.style.animationDelay = delay + "s";
  return p;
}
function leaf(x, y, rot, delay) {
  const ns = "http://www.w3.org/2000/svg";
  const g = document.createElementNS(ns, "g");
  g.setAttribute("class", "bloom"); g.style.animationDelay = delay + "s";
  g.innerHTML = `<ellipse cx="${x}" cy="${y}" rx="14" ry="6" fill="#7dbb6f" transform="rotate(${rot} ${x} ${y})"/>`;
  return g;
}
function addFlower(x, y, size, delay) {
  $("#stems").appendChild(stem(x, y, delay));
  const c = FLOWER_COLORS[Math.floor(Math.random() * FLOWER_COLORS.length)];
  $("#blooms").appendChild(rose(x, y, size, c, delay + 0.4));
}
function buildBouquet() {
  if (bouquetBuilt) return;
  bouquetBuilt = true;
  [[52, 108, -30], [148, 104, 30], [70, 92, -50], [132, 90, 50]].forEach(([x, y, r], i) => $("#stems").appendChild(leaf(x, y, r, 0.2 + i * 0.1)));
  const spots = [[100, 70, 22], [70, 90, 18], [130, 88, 19], [85, 55, 16], [118, 52, 17], [55, 112, 14], [146, 110, 14], [100, 100, 16]];
  spots.forEach(([x, y, s], i) => addFlower(x, y, s, 0.3 + i * 0.25));
  // ลาเวนเดอร์
  [[140, 50], [60, 56]].forEach(([x, y], i) => {
    for (let k = 0; k < 5; k++) {
      const g = rose(x + k * 2, y + k * 7, 4, FLOWER_COLORS[3], 2.4 + i * 0.3 + k * 0.08);
      $("#blooms").appendChild(g);
    }
  });
}
$("#studio").addEventListener("click", () => {
  addFlower(55 + Math.random() * 90, 35 + Math.random() * 75, 12 + Math.random() * 8, 0);
});

/* ---------- time counters ---------- */
function updateClocks() {
  const now = new Date();
  let diff = Math.max(0, now - START);
  const s = Math.floor(diff / 1000);
  const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  const c = $("#counter");
  $('[data-k="d"]', c).textContent = d;
  $('[data-k="h"]', c).textContent = h;
  $('[data-k="m"]', c).textContent = m;
  $('[data-k="s"]', c).textContent = sec;
  $("#totalHours").textContent = Math.floor(s / 3600).toLocaleString("en-US");

  // years + remaining days
  let years = now.getFullYear() - START.getFullYear();
  let anniv = new Date(START); anniv.setFullYear(START.getFullYear() + years);
  if (anniv > now) { years--; anniv = new Date(START); anniv.setFullYear(START.getFullYear() + years); }
  const rest = Math.floor((now - anniv) / 1000);
  const lc = $("#liveClock");
  $('[data-k="y"]', lc).textContent = Math.max(0, years);
  $('[data-k="d"]', lc).textContent = Math.floor(rest / 86400);
  $('[data-k="h"]', lc).textContent = Math.floor((rest % 86400) / 3600);
  $('[data-k="m"]', lc).textContent = Math.floor((rest % 3600) / 60);
  $('[data-k="s"]', lc).textContent = rest % 60;
}
updateClocks();
setInterval(updateClocks, 1000);

/* ---------- 3D ring box ---------- */
const Ring = (() => {
  let ready = false, open = false, openT = 0;
  let renderer, scene, camera, root, lidPivot, ringGroup, sparkles;
  let rotY = 0.5, rotX = 0, dragging = false, lastX = 0, lastY = 0, moved = 0, autoSpin = true;
  const stage = $("#ringStage"), canvas = $("#ringCanvas");

  function makeEnv() {
    const c = document.createElement("canvas");
    c.width = 512; c.height = 256;
    const g = c.getContext("2d");
    const grad = g.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, "#ffffff"); grad.addColorStop(0.45, "#e9d6d9"); grad.addColorStop(1, "#2a0d14");
    g.fillStyle = grad; g.fillRect(0, 0, 512, 256);
    g.fillStyle = "#fff";
    [[80, 60, 40], [300, 40, 30], [420, 90, 25]].forEach(([x, y, r]) => { g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); });
    const tex = new THREE.CanvasTexture(c);
    tex.mapping = THREE.EquirectangularReflectionMapping;
    const pm = new THREE.PMREMGenerator(renderer);
    return pm.fromEquirectangular(tex).texture;
  }

  function init() {
    if (ready) { resize(); return; }
    if (!window.THREE) { $("#ringFallback").classList.remove("hidden"); canvas.remove(); bindTapOnly(); ready = true; return; }
    ready = true;
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.9;
    scene = new THREE.Scene();
    scene.environment = makeEnv();
    camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    camera.position.set(0, 2.9, 6.4);
    camera.lookAt(0, 0.45, 0);

    scene.add(new THREE.AmbientLight(0xffe6ea, 0.35));
    const key = new THREE.SpotLight(0xffffff, 1.6, 20, 0.6, 0.5);
    key.position.set(2, 6, 4); scene.add(key);
    const rim = new THREE.PointLight(0xff4d6d, 1.2, 10); rim.position.set(-3, 2, -2); scene.add(rim);

    const velvet = new THREE.MeshStandardMaterial({ color: 0x7a0616, roughness: 0.9, metalness: 0.0, flatShading: true, envMapIntensity: 0.12 });
    const inner = new THREE.MeshStandardMaterial({ color: 0x4a0612, roughness: 1, envMapIntensity: 0.2 });
    const gold = new THREE.MeshStandardMaterial({ color: 0xf2c46b, metalness: 1, roughness: 0.18 });
    const diamond = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.1, roughness: 0, envMapIntensity: 3, flatShading: true, transparent: true, opacity: 0.92 });

    root = new THREE.Group(); scene.add(root);
    const R = 1.25, flat = Math.PI / 8, edge = R * Math.cos(flat);

    // base
    const base = new THREE.Mesh(new THREE.CylinderGeometry(R, R * 1.02, 1.0, 8, 1, false, flat), velvet);
    base.position.y = 0; root.add(base);
    const cushion = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.86, R * 0.86, 0.04, 8, 1, false, flat), inner);
    cushion.position.y = 0.51; root.add(cushion);
    const slit = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.02, 1.0), new THREE.MeshBasicMaterial({ color: 0x1a0005 }));
    slit.position.y = 0.535; slit.rotation.y = Math.PI / 2; root.add(slit);
    const trim = new THREE.Mesh(new THREE.CylinderGeometry(R * 1.03, R * 1.03, 0.05, 8, 1, true, flat), gold);
    trim.position.y = 0.5; root.add(trim);

    // lid (hinge at back)
    lidPivot = new THREE.Group();
    lidPivot.position.set(0, 0.5, -edge);
    root.add(lidPivot);
    const lid = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.97, R * 1.02, 0.5, 8, 1, false, flat), velvet);
    lid.position.set(0, 0.25, edge);
    lidPivot.add(lid);
    const lidInner = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.9, R * 0.9, 0.02, 8, 1, false, flat), inner);
    lidInner.position.set(0, -0.005, edge);
    lidPivot.add(lidInner);

    // ring
    ringGroup = new THREE.Group();
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.055, 24, 80), gold);
    ringGroup.add(band);
    const setting = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.05, 0.1, 6), gold);
    setting.position.y = 0.41; ringGroup.add(setting);
    const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.16, 0.06, 8), diamond);
    crown.position.y = 0.5; ringGroup.add(crown);
    const pav = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.16, 8), diamond);
    pav.rotation.x = Math.PI; pav.position.y = 0.39; ringGroup.add(pav);
    const top = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.15, 0.05, 8), diamond);
    top.position.y = 0.555; ringGroup.add(top);
    ringGroup.position.y = 0.3; ringGroup.scale.setScalar(0.001);
    root.add(ringGroup);

    // sparkles
    const pts = new Float32Array(60 * 3);
    for (let i = 0; i < 60; i++) { pts[i * 3] = (Math.random() - 0.5) * 3; pts[i * 3 + 1] = Math.random() * 2.5; pts[i * 3 + 2] = (Math.random() - 0.5) * 3; }
    const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.BufferAttribute(pts, 3));
    sparkles = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xffe8a8, size: 0.05, transparent: true, opacity: 0 }));
    root.add(sparkles);

    bindPointer();
    window.addEventListener("resize", resize);
    resize();
    animate();
  }

  function resize() {
    if (!renderer) return;
    const w = stage.clientWidth, h = stage.clientHeight;
    if (!w) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
  }

  const ease = (x) => 1 - Math.pow(1 - x, 3);
  let clock = 0;
  function animate() {
    requestAnimationFrame(animate);
    if (ORDER[current] !== "4") return;
    clock += 0.016;
    if (autoSpin && !dragging) rotY += 0.004;
    root.rotation.y = rotY;
    root.rotation.x = rotX;
    openT = Math.min(1, Math.max(0, openT + (open ? 0.012 : -0.03)));
    const e = ease(openT);
    lidPivot.rotation.x = -1.95 * ease(Math.min(1, openT * 1.6));
    const rise = ease(Math.max(0, (openT - 0.35) / 0.65));
    ringGroup.scale.setScalar(Math.max(0.001, rise));
    ringGroup.position.y = 0.3 + rise * 0.65 + Math.sin(clock * 2) * 0.03 * rise;
    ringGroup.rotation.y = -rotY + clock * 0.6 * rise; // หันหน้าแหวนเข้ากล้องและหมุนช้า ๆ
    sparkles.material.opacity = e * (0.6 + Math.sin(clock * 4) * 0.3);
    sparkles.rotation.y = clock * 0.2;
    renderer.render(scene, camera);
  }

  function toggleOpen() {
    open = !open;
    $("#stagePill").textContent = open ? "แตะเพื่อปิดฝากล่อง" : "✨ แตะเปิดกล่องแหวนเพชร 3D ✨";
    $("#ringMsg").classList.toggle("show", open);
    $("#ringHint").textContent = open ? "Will you stay with me forever? ♡" : "แตะที่กล่องแหวนกำมะหยี่เพื่อเปิดฝา";
    if (open) setTimeout(() => confettiBurst(60), 900);
  }

  function bindPointer() {
    stage.addEventListener("pointerdown", (e) => { dragging = true; moved = 0; lastX = e.clientX; lastY = e.clientY; stage.setPointerCapture(e.pointerId); });
    stage.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      const dx = e.clientX - lastX, dy = e.clientY - lastY;
      moved += Math.abs(dx) + Math.abs(dy);
      rotY += dx * 0.01;
      rotX = Math.max(-0.4, Math.min(0.5, rotX + dy * 0.005));
      lastX = e.clientX; lastY = e.clientY;
    });
    stage.addEventListener("pointerup", () => { dragging = false; if (moved < 8) toggleOpen(); else autoSpin = false; });
    stage.addEventListener("pointercancel", () => (dragging = false));
  }
  function bindTapOnly() { stage.addEventListener("click", toggleOpen); }

  function reset() {
    if (open) toggleOpen();
    autoSpin = true;
  }
  return { init, reset };
})();

/* ---------- confetti ---------- */
const cv = $("#confetti"), cx = cv.getContext("2d");
let confetti = [], confettiRunning = false;
function sizeCanvas() { cv.width = innerWidth * devicePixelRatio; cv.height = innerHeight * devicePixelRatio; }
sizeCanvas(); addEventListener("resize", sizeCanvas);
function confettiBurst(n = 140) {
  const colors = ["#f08a96", "#ffd166", "#9bd3dd", "#c9b6ff", "#e0455f", "#ffffff"];
  for (let i = 0; i < n; i++) {
    confetti.push({
      x: Math.random() * cv.width, y: -20 - Math.random() * cv.height * 0.5,
      w: (6 + Math.random() * 6) * devicePixelRatio, h: (3 + Math.random() * 4) * devicePixelRatio,
      vy: (1.5 + Math.random() * 2.5) * devicePixelRatio, vx: (Math.random() - 0.5) * 1.5 * devicePixelRatio,
      r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.2, c: colors[i % colors.length],
    });
  }
  if (!confettiRunning) { confettiRunning = true; drawConfetti(); }
}
function drawConfetti() {
  cx.clearRect(0, 0, cv.width, cv.height);
  confetti.forEach((p) => {
    p.x += p.vx + Math.sin(p.y / 40); p.y += p.vy; p.r += p.vr;
    cx.save(); cx.translate(p.x, p.y); cx.rotate(p.r);
    cx.fillStyle = p.c; cx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
    cx.restore();
  });
  confetti = confetti.filter((p) => p.y < cv.height + 30);
  if (confetti.length) requestAnimationFrame(drawConfetti);
  else { confettiRunning = false; cx.clearRect(0, 0, cv.width, cv.height); }
}

/* ---------- floating hearts ---------- */
$("#btnHearts").onclick = () => {
  for (let i = 0; i < 10; i++) {
    const h = document.createElement("div");
    h.className = "float-heart";
    h.textContent = ["♡", "❤", "💗", "💕"][i % 4];
    Object.assign(h.style, { left: 10 + Math.random() * 80 + "vw", bottom: "40px", fontSize: 16 + Math.random() * 18 + "px", animationDelay: i * 0.08 + "s" });
    document.body.appendChild(h);
    setTimeout(() => h.remove(), 3200);
  }
};
