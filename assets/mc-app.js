const els = {
  file: document.getElementById('fileInput'),
  drop: document.getElementById('dropZone'),
  preview: document.getElementById('previewBtn'),
  renderWebmBtn: document.getElementById('renderWebmBtn'),
  duration: document.getElementById('duration'),
  frames: document.getElementById('frames'),
  scale: document.getElementById('scale'),
  amplitude: document.getElementById('amplitude'),
  turns: document.getElementById('turns'),
  bobCycles: document.getElementById('bobCycles'),
  size: document.getElementById('size'),
  shadow: document.getElementById('shadow'),
  fpsMode: document.getElementById('fpsMode'),
  customFps: document.getElementById('customFps'),
  codecPref: document.getElementById('codecPref'),
  canvas: document.getElementById('threeCanvas'),
  progress: document.getElementById('progress'),
  result: document.getElementById('result'),
  whyBox: document.getElementById('whyBox'),
  whyList: document.getElementById('whyList'),
};

let renderer, scene, camera, itemGroup, frontMesh, backMesh, shadowMesh;
let texture, imgBitmap;
let webglOk = false;
let imageLoaded = false;
let previewRunning = false;

bootstrap();

function bootstrap() {
  initThree();
  attachUI();
  updateReadiness();
}

function initThree() {
  try {
    renderer = new THREE.WebGLRenderer({
      canvas: els.canvas,
      alpha: true,
      antialias: true,
      preserveDrawingBuffer: true,
      premultipliedAlpha: false,
    });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    setCanvasSize(parseInt(els.size.value, 10) || 512);

    scene = new THREE.Scene();
    camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.01, 10);
    camera.position.set(0, 0, 2);
    camera.lookAt(0, 0, 0);

    itemGroup = new THREE.Group();
    scene.add(itemGroup);

    shadowMesh = buildShadowDisc();
    shadowMesh.position.set(0, -0.6, 0);
    scene.add(shadowMesh);

    scene.add(new THREE.AmbientLight(0xffffff, 1.0));
    webglOk = true;
  } catch (e) {
    console.error("WebGL init failed:", e);
    webglOk = false;
  }
  updateReadiness();
}

function buildShadowDisc() {
  const geo = new THREE.PlaneGeometry(1.2, 1.2, 1, 1);
  const size = 256;
  const c = document.createElement('canvas');
  c.width = size; c.height = size;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
  g.addColorStop(0.0, 'rgba(0,0,0,0.25)');
  g.addColorStop(0.7, 'rgba(0,0,0,0.08)');
  g.addColorStop(1.0, 'rgba(0,0,0,0.00)');
  ctx.fillStyle = g; ctx.fillRect(0,0,size,size);
  const tex = new THREE.CanvasTexture(c);
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = -Math.PI / 2;
  return mesh;
}

async function loadPNG(file) {
  try {
    const blob = await file.arrayBuffer();
    imgBitmap = await createImageBitmap(new Blob([blob]));
  } catch {
    imgBitmap = await new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => { resolve(img); URL.revokeObjectURL(url); };
      img.onerror = e => reject(e);
      img.src = url;
    });
  }
  const tex = new THREE.Texture(imgBitmap);
  tex.needsUpdate = true;
  tex.colorSpace = THREE.SRGBColorSpace;
  texture = tex;
  buildItemMeshes();
  imageLoaded = true;
  updateReadiness();
}

// create a horizontally mirrored canvas from source
function makeMirroredCanvas(src) {
  const w = src.width, h = src.height;
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  ctx.translate(w, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(src, 0, 0, w, h);
  return c;
}

function buildItemMeshes() {
  while (itemGroup.children.length) itemGroup.remove(itemGroup.children[0]);

  const w = imgBitmap.width;
  const h = imgBitmap.height;
  const aspect = w / h;

  const scale = parseFloat(els.scale.value) || 1.0;
  const itemHeight = 1.0 * scale;
  const itemWidth = itemHeight * aspect;
  const depthEps = 0.002;

  const geo = new THREE.PlaneGeometry(itemWidth, itemHeight);

  // front, just base
  const frontMat = new THREE.MeshBasicMaterial({
    map: texture, transparent: true, side: THREE.FrontSide,
  });
  frontMesh = new THREE.Mesh(geo, frontMat);
  frontMesh.position.z = depthEps;
  itemGroup.add(frontMesh);

  // ass(back), just stretched horizontially backwards to make it backwards like mc
  const mirroredCanvas = makeMirroredCanvas(imgBitmap);
  const backTex = new THREE.CanvasTexture(mirroredCanvas);
  backTex.colorSpace = THREE.SRGBColorSpace;
  backTex.needsUpdate = true;
  const backMat = new THREE.MeshBasicMaterial({
    map: backTex, transparent: true, side: THREE.FrontSide,
  });
  backMesh = new THREE.Mesh(geo, backMat);
  backMesh.rotation.y = Math.PI;
  backMesh.position.z = -depthEps;
  itemGroup.add(backMesh);
}

function attachUI() {
  els.file.addEventListener('change', async (e) => {
    const f = e.target.files?.[0];
    if (f) await loadPNG(f);
  });
  ['dragenter','dragover'].forEach(ev => els.drop.addEventListener(ev, e => {
    e.preventDefault(); e.stopPropagation(); els.drop.classList.add('drag');
  }));
  ['dragleave','drop'].forEach(ev => els.drop.addEventListener(ev, e => {
    e.preventDefault(); e.stopPropagation(); els.drop.classList.remove('drag');
  }));
  els.drop.addEventListener('drop', async (e) => {
    const f = e.dataTransfer?.files?.[0];
    if (f && f.type === 'image/png') await loadPNG(f);
  });

  els.preview.addEventListener('click', preview);
  els.renderWebmBtn.addEventListener('click', renderWebM);
els.renderApngBtn = document.getElementById('renderApngBtn');
els.renderApngBtn.addEventListener('click', renderAPNG);

  ['duration','frames','scale','amplitude','turns','bobCycles','size','shadow','fpsMode','customFps','codecPref']
    .forEach(id => els[id].addEventListener('input', () => updateReadiness()));

  window.addEventListener('resize', () => {
    const px = parseInt(els.size.value, 10) || 512;
    setCanvasSize(px);
  });

  els.canvas.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    webglOk = false;
    updateReadiness();
  });
  els.canvas.addEventListener('webglcontextrestored', () => {
    webglOk = true;
    updateReadiness();
  });
}

function setCanvasSize(px) {
  if (!renderer) return;
  renderer.setSize(px, px, false);
}

function setShadowVisible(on) {
  if (shadowMesh) shadowMesh.visible = !!on;
}

function poseAt(t01) {
  const turns = parseFloat(els.turns.value) || 1.0;
  const bobCycles = parseFloat(els.bobCycles.value) || 1.0;
  const amp = parseFloat(els.amplitude.value) || 0.12;

  const rotY = t01 * turns * Math.PI * 2;
  const bob = Math.sin(t01 * bobCycles * Math.PI * 2) * amp;

  itemGroup.rotation.set(0, rotY, 0);
  itemGroup.position.set(0, bob, 0);

  const base = 0.25, range = 0.12;
  const alpha = base - Math.abs(bob) * range / Math.max(amp, 0.0001);
  if (shadowMesh && shadowMesh.material) {
    shadowMesh.material.opacity = THREE.MathUtils.clamp(alpha, 0.05, 0.25);
  }
}

function renderOnce(t01) {
  poseAt(t01);
  renderer.render(scene, camera);
}

function setProgress(p01) {
  if (!els.progress._bar) {
    const bar = document.createElement('div');
    bar.style.height = '100%';
    bar.style.width = '0%';
    bar.style.background = 'linear-gradient(90deg, #00d2ff, #6a5acd)';
    bar.style.transition = 'width .15s linear';
    els.progress.appendChild(bar);
    els.progress._bar = bar;
  }
  els.progress._bar.style.width = (p01 * 100) + '%';
}
function clearProgress() {
  els.progress.innerHTML = '';
  delete els.progress._bar;
}

function updateReadiness() {
  const reasons = [];
  const protocol = location.protocol;
  const isHttpLike = protocol === 'http:' || protocol === 'https:';
  if (!isHttpLike) reasons.push("how did this happen? you trying to run locally? use a local web server like vscode live server or something");

  if (!webglOk) reasons.push("WebGL not supported or context lost.");
  if (!imageLoaded) reasons.push("No PNG loaded yet.");

  const canPreview = isHttpLike && webglOk && imageLoaded;
  const canRender  = canPreview && !!window.MediaRecorder;
  const canRenderAPNG = canPreview && !!(window.UPNG && UPNG.encode) && !!(window.pako);


  els.preview.disabled = !canPreview;
  els.renderWebmBtn.disabled  = !canRender;
  if (els.renderApngBtn) els.renderApngBtn.disabled = !canRenderAPNG;

  const showWhy = !canPreview || !canRender;
  els.whyBox.hidden = !showWhy;
  els.whyList.innerHTML = '';
  if (showWhy) {
    const uniq = Array.from(new Set(reasons));
    if (!window.MediaRecorder) uniq.push("MediaRecorder is not supported in this browser.");
    if (!(window.UPNG && UPNG.encode)) uniq.push("UPNG.js - if running via lachlanm05.com, send an email to webcatch@lachlanm05.com");
    if (!window.pako) uniq.push("pako not found - if running via lachlanm05.com, send an email to webcatch@lachlanm05.com");
    for (const msg of uniq) {
      const li = document.createElement('li');
      li.textContent = msg;
      els.whyList.appendChild(li);
    }
  }
}

async function preview() {
  const protocol = location.protocol;
  if (protocol !== 'http:' && protocol !== 'https:') { updateReadiness(); return; }
  if (!webglOk || !imageLoaded) { updateReadiness(); return; }

  const px = parseInt(els.size.value, 10) || 512;
  setCanvasSize(px);
  setShadowVisible(els.shadow.checked);

  if (previewRunning) return;
  previewRunning = true;
  const start = performance.now();

  const loop = () => {
    if (!previewRunning) return;
    const dur = parseFloat(els.duration.value) || 1.6;
    const t = ((performance.now() - start) / 1000 / dur) % 1;
    renderOnce(t);
    requestAnimationFrame(loop);
  };
  loop();

  const stop = () => { previewRunning = false; };
  els.preview.addEventListener('click', stop, { once: true });
  els.renderWebmBtn.addEventListener('click', stop, { once: true });
}

// render WebM using mediarecorder api with two fps modes
async function renderWebM() {
  const protocol = location.protocol;
  if (protocol !== 'http:' && protocol !== 'https:') { updateReadiness(); return; }
  if (!webglOk || !imageLoaded) { updateReadiness(); return; }
  if (!window.MediaRecorder) { updateReadiness(); return; }

  els.renderWebmBtn.disabled = true;
  els.preview.disabled = true;
  els.result.innerHTML = '';
  setProgress(0);

  const px = parseInt(els.size.value, 10) || 512;
  setCanvasSize(px);
  setShadowVisible(els.shadow.checked);

  const duration = parseFloat(els.duration.value) || 1.6;
  const mode = els.fpsMode.value; // 'match' or 'custom'
  const customFPS = Math.max(1, Math.min(240, parseInt(els.customFps.value, 10) || 60));
  const framesForCustom = Math.max(1, Math.round(customFPS * duration));
  const delayCustom = 1000 / customFPS;

  // choose codec pref
  const pickMime = () => {
    const pref = els.codecPref.value;
    const candidatesByPref = {
      vp9: ['video/webm;codecs=vp9', 'video/webm'],
      vp8: ['video/webm;codecs=vp8', 'video/webm'],
      auto: ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm']
    };
    const list = candidatesByPref[pref] || candidatesByPref.auto;
    for (const c of list) {
      if (MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(c)) return c;
    }
    return ''; // let browser/user pick
  };
  const mime = pickMime();
  const streamFPS = (mode === 'custom') ? customFPS : undefined;
  const stream = els.canvas.captureStream(streamFPS);

  const rec = new MediaRecorder(stream, { mimeType: mime || undefined, videoBitsPerSecond: 8_000_000 });
  const chunks = [];
  rec.ondataavailable = e => { if (e.data && e.data.size) chunks.push(e.data); };

  rec.start();

  if (mode === 'match') {
    // drive a real-time loop matching the canvas capture stream FPS
    const t0 = performance.now();
    const end = t0 + duration * 1000;
    const loop = (now) => {
      if (now >= end) return;
      const t = ((now - t0) / 1000 / duration) % 1;
      renderOnce(t);
      const p = Math.min(1, (now - t0) / (duration * 1000));
      setProgress(p);
      requestAnimationFrame(loop);
    };
    await new Promise(res => {
      const done = () => res();
      rec.onstop = done;
      requestAnimationFrame(loop);
      setTimeout(() => { rec.stop(); }, Math.ceil(duration * 1000) + 120);
    });
  } else {
    // deterministic custom fps mode; render each frame with a delay
    for (let i = 0; i < framesForCustom; i++) {
      const t01 = i / framesForCustom;
      renderOnce(t01);
      setProgress(i / framesForCustom);
      await new Promise(r => setTimeout(r, delayCustom));
    }
    setProgress(1);
    await new Promise(r => setTimeout(r, 80));
    rec.stop();
    await new Promise(res => { rec.onstop = res; setTimeout(res, 400); });
  }

  clearProgress();
  const blob = new Blob(chunks, { type: mime || 'video/webm' });
  const url = URL.createObjectURL(blob);

  const vid = document.createElement('video');
  vid.src = url;
  vid.autoplay = false;
  vid.loop = true;
  vid.controls = true;
  vid.muted = true;
  vid.style.maxWidth = '100%';
  vid.style.borderRadius = '8px';
  els.result.appendChild(vid);

  const link = document.createElement('a');
  link.href = url;
  link.download = 'minecraft_item_loop.webm';
  link.textContent = 'Download WebM';
  els.result.appendChild(link);

  els.renderWebmBtn.disabled = false;
  els.preview.disabled = false;
}


// render APNG using upng.js
async function renderAPNG() {
  const protocol = location.protocol;
  if (protocol !== 'http:' && protocol !== 'https:') { updateReadiness(); return; }
  if (!webglOk || !imageLoaded) { updateReadiness(); return; }
  if (!(window.UPNG && UPNG.encode)) { updateReadiness(); return; }

  els.renderWebmBtn.disabled = true;
  if (els.renderApngBtn) els.renderApngBtn.disabled = true;
  els.preview.disabled = true;
  els.result.innerHTML = '';
  setProgress(0);

  const px = parseInt(els.size.value, 10) || 512;
  setCanvasSize(px);
  setShadowVisible(els.shadow.checked);

  // determine frames + delay from fps mode 
  const duration = parseFloat(els.duration.value) || 1.6;
  let fps = 60;
  if (els.fpsMode.value === 'custom') {
    fps = Math.max(1, Math.min(240, parseInt(els.customFps.value, 10) || 60));
  } else {
    // try to use screen refresh rate heuristic, fall back to 60
    fps = Math.min(240, Math.max(30, Math.round((window.screen && window.screen.frameRate) ? window.screen.frameRate : 60)));
  }
  const frames = Math.max(1, Math.round(fps * duration));
  const delay = Math.round(1000 / fps); // per-frame delay in ms

  // offscreen 2d canvas to read RGBA
  const read = document.createElement('canvas');
  read.width = px; read.height = px;
  const rctx = read.getContext('2d');

  const rgbaFrames = [];
  const delays = [];
  for (let i = 0; i < frames; i++) {
    const t01 = i / frames;
    renderOnce(t01);
    // draw WebGL canvas into 2D canvas, then pull ImageData buffer
    rctx.clearRect(0,0,px,px);
    rctx.drawImage(els.canvas, 0, 0, px, px);
    const id = rctx.getImageData(0, 0, px, px);
    rgbaFrames.push(id.data.buffer);
    delays.push(delay);
    setProgress(i / frames);
    await new Promise(r => setTimeout(r, 0));
  }
  setProgress(1);

  // encode apng
  const ab = UPNG.encode(rgbaFrames, px, px, 0, delays); // 0 => keep full RGBA (no quantization)
  const blob = new Blob([ab], { type: 'image/apng' });
  const url = URL.createObjectURL(blob);

  const img = document.createElement('img');
  img.src = url;
  img.alt = 'APNG result';
  img.style.maxWidth = '100%';
  img.style.borderRadius = '8px';
  els.result.appendChild(img);

  const link = document.createElement('a');
  link.href = url;
  link.download = 'minecraft_item_loop.png';
  link.textContent = 'Download APNG';
  els.result.appendChild(link);

  els.renderWebmBtn.disabled = false;
  if (els.renderApngBtn) els.renderApngBtn.disabled = false;
  els.preview.disabled = false;
}
