// id's for key elements
const FX_ROOT_ID = "fx-root";
const SPLASH_ID = "splash-screen";
const BDAY_AUDIO_ID = "birthday-audio";

let fakeDate = null; // if fake date is set, use instead of real date.
let runningCleanup = null; // cleanup current function
let fireworksTicker = null;

// utils, HE Grenade and two smokes.

// get current date, considering fakeDate if set
function now() {
  return fakeDate ? new Date(fakeDate) : new Date();
}

// check if date is between two month/day pairs (inclusive)
function isBetween(date, startMonth, startDay, endMonth, endDay) {
  const y = date.getFullYear();
  const start = new Date(y, startMonth - 1, startDay, 0, 0, 0);
  const end = new Date(y, endMonth - 1, endDay, 23, 59, 59);
  return date >= start && date <= end;
}

// check if date matches month/day
function isDate(date, month, day) {
  return date.getMonth() === month - 1 && date.getDate() === day;
}

// DOM utils
function $(sel) {
  return document.querySelector(sel);
}
function create(tag, cls) {
  const el = document.createElement(tag);
  if (cls) el.className = cls;
  return el;
}
function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// clear all fx nodes from effect root
function clearFxRoot() {
  const root = document.getElementById(FX_ROOT_ID);
  if (!root) return;
  root.textContent = "";
  root.removeAttribute("data-mode");
  document.body.classList.remove("has-cobwebs");
}

// set mode attribute on effect root
function setMode(mode) {
  const root = document.getElementById(FX_ROOT_ID);
  if (root) root.setAttribute("data-mode", mode || "");
}

// splash
function initSplash() {
  const splash = document.getElementById(SPLASH_ID);
  const yearSpan = document.getElementById("splash-year");
  if (yearSpan) yearSpan.textContent = String(now().getFullYear());

  if (!splash) return;

  const onClick = async () => {
    // start birthday if it's 22nd of July.
    const d = now();
    if (isDate(d, 7, 22)) {
      const audio = document.getElementById(BDAY_AUDIO_ID);
      if (audio) {
        try {
          await audio.play();
        } catch {
          /* browser would normally block, but due to splash screen, should work fine */
        }
      }
    }
    splash.classList.add("fade-out");
    setTimeout(() => splash.remove(), 700);
    splash.removeEventListener("click", onClick);
  };

  splash.addEventListener("click", onClick);
}

async function getRandomLoveLine(url = "/assets/splash.txt") {
  const FALLBACK = "i love you.";
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return FALLBACK;
    const txt = await res.text();

    // pick a non-empty, trimmed line; ignore lines starting with '#'
    const lines = txt
      .split(/\r?\n/)
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith("#"));

    if (lines.length === 0) return FALLBACK;
    return lines[Math.floor(Math.random() * lines.length)];
  } catch {
    return FALLBACK;
  }
}

function applyLoveText(loveText) {
  // Preferred: update any explicit targets
  const explicitTargets = document.querySelectorAll(".love, #love, #splash-love");
  if (explicitTargets.length) {
    explicitTargets.forEach(el => (el.textContent = loveText));
    return;
  }

  // Fallback: rewrite the text after the "•" in any footer
  document.querySelectorAll("footer").forEach(foot => {
    // Try to preserve everything before the bullet and swap the tail
    const raw = foot.textContent;
    if (!raw.includes("•")) return;

    // Split only on the first bullet to preserve anything after
    const idx = raw.indexOf("•");
    const head = raw.slice(0, idx + 1); // include the bullet
    // Clear existing nodes and rebuild minimal structure
    foot.textContent = ""; 
    foot.append(head + " ");
    foot.append(loveText);
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  const loveText = await getRandomLoveLine("/assets/credits.txt");
  applyLoveText(loveText);
});

// Snow Effect (Nov 1 - Dec 30). Yes, we are thawing out Mariah Carey the day after Halloween.
function startSnow() {
  if (prefersReducedMotion()) return () => {};
  const root = document.getElementById(FX_ROOT_ID);
  setMode("snow");
  const COUNT = 40; // tuned for nice density without lag
  const nodes = [];
  for (let i = 0; i < COUNT; i++) {
    const flake = create("div", "fx flake");
    flake.style.left = Math.random() * 100 + "vw";
    // randomize duration/size/delay a bit
    const size = Math.random() * 6 + 4; // 4px-10px
    flake.style.width = size + "px";
    flake.style.height = size + "px";
    flake.style.animationDuration = Math.random() * 6 + 8 + "s";
    flake.style.animationDelay = Math.random() * 8 + "s";
    root.appendChild(flake);
    nodes.push(flake);
  }
  // gentle spawner to keep population steady
  const spawnInterval = setInterval(() => {
    if (!document.body.contains(root)) return;
    const flake = create("div", "fx flake");
    flake.style.left = Math.random() * 100 + "vw";
    const size = Math.random() * 6 + 4;
    flake.style.width = size + "px";
    flake.style.height = size + "px";
    flake.style.animationDuration = Math.random() * 6 + 8 + "s";
    root.appendChild(flake);
    // clean up each flake after it falls
    flake.addEventListener("animationend", () => flake.remove());
  }, 1200);

  return () => {
    clearInterval(spawnInterval);
    nodes.forEach((n) => n.remove());
  };
}

// Valentine's Hearts Effect (Feb 14th). i don't have a valentine. and if you are reading this, neither do you.
// we could just.... you know.... be eachothers valentines..? just kidding.... unless..?
function startHearts() {
  if (prefersReducedMotion()) return () => {};
  const root = document.getElementById(FX_ROOT_ID);
  setMode("hearts");
  const COUNT = 24;
  const nodes = [];
  for (let i = 0; i < COUNT; i++) {
    const heart = create("div", "fx heart");
    heart.style.left = Math.random() * 100 + "vw";
    heart.style.animationDuration = Math.random() * 6 + 10 + "s";
    heart.style.animationDelay = Math.random() * 8 + "s";
    root.appendChild(heart);
    nodes.push(heart);
  }
  const spawnInterval = setInterval(() => {
    const heart = create("div", "fx heart");
    heart.style.left = Math.random() * 100 + "vw";
    heart.style.animationDuration = Math.random() * 6 + 10 + "s";
    root.appendChild(heart);
    heart.addEventListener("animationend", () => heart.remove());
  }, 1600);

  return () => {
    clearInterval(spawnInterval);
    nodes.forEach((n) => n.remove());
  };
}

// Spooky Cobwebs Effect (October)
// makes it look abandoned... kinda like the DDMC project. L for people who think i'll update it.
function startCobwebs() {
  setMode("cobwebs");
  document.body.classList.add("has-cobwebs");
  // static css effect, no cleanup needed besides removing class.
  return () => {
    document.body.classList.remove("has-cobwebs");
  };
}

// New Year's Fireworks Effect (Jan 1st)
// because someone will totally be looking at this page on new years, instead of doing literally anything else.
// but hey, it's the thought that counts, right?
// also this effect looks horrible. so:
// TODO: improve fireworks to not suck.
function startFireworks() {
  if (prefersReducedMotion()) return () => {};
  const root = document.getElementById(FX_ROOT_ID);
  setMode("fireworks");
  const canvas = create("canvas", "fx fw-canvas");
  root.appendChild(canvas);

  const ctx = canvas.getContext("2d", { alpha: true });
  let raf = null;
  let particles = [];

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener("resize", resize);

  function spawnBurst(
    cx = Math.random() * canvas.width,
    cy = Math.random() * canvas.height * 0.6 + canvas.height * 0.1,
    count = 80
  ) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 3 + 2;
      particles.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 60 + Math.random() * 30,
        alpha: 1,
      });
    }
  }

  function tick() {
    raf = requestAnimationFrame(tick);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = "lighter";

    particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.03; // gravity
      p.life -= 1;
      p.alpha = Math.max(0, p.life / 90);
      ctx.globalAlpha = p.alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
      ctx.fill();
    });
    particles = particles.filter((p) => p.life > 0 && p.alpha > 0.02);
  }
  tick();

  // occasionally spawn bursts throughout the day
  function scheduleOccasional() {
    const delay = 8000 + Math.random() * 12000; // 8-20s
    fireworksTicker = setTimeout(() => {
      spawnBurst();
      scheduleOccasional();
    }, delay);
  }
  scheduleOccasional();

  // guaranteed midnight burst if we're on Jan 1 near 00:00
  const d = now();
  if (d.getHours() === 0 && d.getMinutes() === 0) {
    // big show if loaded exactly at midnight
    for (let i = 0; i < 6; i++) setTimeout(() => spawnBurst(), i * 450);
  }

  return () => {
    window.removeEventListener("resize", resize);
    cancelAnimationFrame(raf);
    clearTimeout(fireworksTicker);
    canvas.remove();
  };
}

// effect routing
function chooseEffect(dateObj) {
  // order matters for single-day events taking priority
  if (isDate(dateObj, 1, 1)) return "fireworks"; // Jan 1
  if (isDate(dateObj, 2, 14)) return "hearts"; // Feb 14
  if (isDate(dateObj, 7, 22)) return "birthday"; // Jul 22
  if (dateObj.getMonth() === 9) return "cobwebs"; // October
  if (isBetween(dateObj, 11, 1, 12, 30)) return "snow"; // Nov 1 - Dec 30
  return null;
}

function applyEffect(mode) {
  if (runningCleanup) {
    try {
      runningCleanup();
    } catch {}
  }
  clearFxRoot();
  switch (mode) {
    case "snow":
      runningCleanup = startSnow();
      break;
    case "hearts":
      runningCleanup = startHearts();
      break;
    case "cobwebs":
      runningCleanup = startCobwebs();
      break;
    case "fireworks":
      runningCleanup = startFireworks();
      break;
    case "birthday":
      // no visual loop required, but still set mode
      setMode("birthday");
      runningCleanup = () => {};
      break;
    default:
      runningCleanup = () => {};
  }

  // refresh event panel whenever the effect changes
  if (typeof window !== "undefined" && window.__renderEventPanel)
    window.__renderEventPanel();
}

(function () {
  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn, { once: true });
    } else {
      fn();
    }
  }

  function computeEventKey(d) {
    // single-day events override month-wide ones
    if (isDate(d, 1, 1)) return "newyear"; // Jan 1
    if (isDate(d, 2, 14)) return "valentines"; // Feb 14
    if (isDate(d, 7, 22)) return "birthday"; // Jul 22
        if (isBetween(d, 11, 1, 12, 30)) return "snow"; // Nov 1 - Dec 30
    if (d.getMonth() === 9) return "halloween"; // October
    return null;
  }

  const COPY = {
    newyear: {
      eyebrow: "Current Event",
      title: () => `happy new year ${now().getFullYear()}!`,
      text: "happy new year! now go party or enjoy yourself some way, and get off my website :3",
    },
    valentines: {
      eyebrow: "Current Event",
      title: () => "Happy Valentine’s Day!",
      text: "if you are reading this, i love you <333",
    },
    birthday: {
      eyebrow: "Current Event",
      title: () => "It's my birthday!",
      text: "my birthday!!! (22nd July)",
    },
    snow: {
      eyebrow: "Current Event",
      title: () => "snow time!",
      text: "mariah carey has been dethawed. all i want for christmas is you~!",
    },

    halloween: {
      eyebrow: "Current Event",
      title: () => "spook season (effect not working atm)",
      text: "it will have cobwebs. idk about anything else though.",
    },
  };

  function render() {
    const section = document.querySelector("#event");
    const tile = section?.querySelector(".event-panel");
    if (!section || !tile) return;

    const key = computeEventKey(now());
    if (!key) {
      section.classList.add("hidden");
      tile.innerHTML = "";
      return;
    }

    const { eyebrow, title, text } = COPY[key];
    section.classList.remove("hidden");
    section.setAttribute("aria-live", "polite");
    tile.innerHTML = `
  <div class="eyebrow">${eyebrow}</div>
  <h3>${typeof title === "function" ? title() : title}</h3>
  <p class="muted">${text}</p>
  ${
    key === "birthday"
      ? `<button id="replay-bday" class="bday-btn">Play Tune 🎶</button>`
      : ""
  }
`;

    // if it's the birthday event, hook up the button
    if (key === "birthday") {
      const btn = document.getElementById("replay-bday");
      if (btn) {
        btn.addEventListener("click", () => {
          const audio = document.getElementById("birthday-audio");
          if (audio) {
            audio.currentTime = 0;
            audio.play().catch(() => console.warn("Autoplay blocked"));
          }
        });
      }
    }
  }
  // make event-panel renderer callable from outside this IIFE
  window.__renderEventPanel = render;

  // initial + keep fresh every minute
  ready(render);
  setInterval(render, 60 * 1000);
})();

// midnight checker
let midnightTimer = null;
function watchClock() {
  if (midnightTimer) clearInterval(midnightTimer);
  midnightTimer = setInterval(() => {
    // reval each minute to check.
    const mode = chooseEffect(now());
    applyEffect(mode);
  }, 60 * 1000);
}

// pub fake date api for testing/playing around.
function setFakeDate(input) {
  if (!input) {
    fakeDate = null;
  } else {
    const d = input instanceof Date ? input : new Date(input);
    if (isNaN(d)) {
      console.warn("Invalid date for setFakeDate");
      return;
    }
    fakeDate = d;
  }
  // immediately re-apply effect when date changes
  const mode = chooseEffect(now());
  applyEffect(mode);
  if (typeof window !== "undefined" && window.__renderEventPanel)
    window.__renderEventPanel();

  console.log("Active mode:", mode || "none", " • current date:", now());
}

// expose helpers for testing in console
window.setFakeDate = setFakeDate;
window.clearFakeDate = () => setFakeDate(null);

// boot
function boot() {
  initSplash();

  // initial effect
  const mode = chooseEffect(now());
  applyEffect(mode);

  // once per minute re-check (covers real midnight, and supports keeping in sync if fakeDate is changed repeatedly)
  watchClock();
}

document.addEventListener("DOMContentLoaded", boot);
