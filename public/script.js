const deck = document.getElementById("deck");
const currentSlideEl = document.getElementById("currentSlide");
const totalSlidesEl = document.getElementById("totalSlides");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const progressBar = document.getElementById("progressBar");
const dotsEl = document.getElementById("dots");

// Each slide is a standalone HTML fragment in ./slides/.
const slidePaths = [
  "/slides/01-hero.html",
  "/slides/02-what-is-ai.html",
  "/slides/03-global-impact.html",
  "/slides/04-adoption.html",
  "/slides/05-workflow.html",
  "/slides/06-code-review-test.html",
  "/slides/07-proof-screenshots.html",
  "/slides/08-kpis.html",
  "/slides/09-guardrails-next.html",
  "/slides/10-challenges.html",
  "/slides/11-tools.html",
  "/slides/12-closing.html",
];

let slides = [];
let currentIndex = 0;

// Render something immediately (first slide) in case fragment loading is slow/blocked.
slides = Array.from(deck.querySelectorAll(".slide"));
updateActiveSlide(0);
totalSlidesEl.textContent = slides.length ? String(slides.length) : "—";

function updateActiveSlide(index) {
  if (!slides.length) return;
  currentIndex = Math.max(0, Math.min(index, slides.length - 1));
  slides.forEach((slide, i) => {
    slide.classList.toggle("active", i === currentIndex);
  });
  currentSlideEl.textContent = String(currentIndex + 1);

  if (progressBar && slides.length > 1) {
    const denom = Math.max(1, slides.length - 1);
    const pct = (currentIndex / denom) * 100;
    progressBar.style.width = `${pct}%`;
  }

  if (dotsEl) {
    const dots = Array.from(dotsEl.querySelectorAll(".dot"));
    dots.forEach((dot, i) => dot.classList.toggle("active", i === currentIndex));
  }
}

function goToSlide(index) {
  if (!slides.length) return;
  const boundedIndex = Math.max(0, Math.min(index, slides.length - 1));
  deck.scrollTo({
    left: deck.clientWidth * boundedIndex,
    behavior: "smooth",
  });
  updateActiveSlide(boundedIndex);
}

function handleScroll() {
  if (!slides.length) return;
  const index = Math.round(deck.scrollLeft / deck.clientWidth);
  if (index !== currentIndex) updateActiveSlide(index);
}

async function loadSlides() {
  const loaded = [];
  const errors = [];
  for (const path of slidePaths) {
    try {
      const res = await fetch(path, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${path}`);
      const html = await res.text();
      const wrapper = document.createElement("div");
      wrapper.innerHTML = html.trim();
      // Vite may inject its client script into HTML served during dev,
      // so we can't rely on firstElementChild being the <section>.
      const slideEl = wrapper.querySelector(".slide");
      if (slideEl) loaded.push(slideEl);
    } catch (err) {
      // Keep going so a single missing slide doesn't blank the deck.
      // eslint-disable-next-line no-console
      console.warn("Slide load failed:", path, err);
      errors.push(`${path}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  if (!loaded.length) {
    // Keep the initial slide visible, but surface errors.
    const previewErrors = errors.slice(0, 4).join("<br/>");
    const errorSection = document.createElement("section");
    errorSection.className = "slide";
    errorSection.innerHTML = `
      <h2>Slides failed to load</h2>
      <p class="subtitle">Open console and check fetch errors (first few):</p>
      <div style="max-width:820px;margin-top:.75rem;opacity:.95;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;color:#dbe6ff;font-size:.95rem;line-height:1.35">
        ${previewErrors}
      </div>
      <p class="subtitle" style="margin-top:1rem">
        If you opened via <code>file://</code>, use <strong>npm run dev</strong> and open <code>http://localhost:5173</code>.
      </p>
    `;
    deck.appendChild(errorSection);
    slides = Array.from(deck.querySelectorAll(".slide"));
    totalSlidesEl.textContent = String(slides.length);
    return;
  }

  deck.replaceChildren(...loaded);
  slides = Array.from(deck.querySelectorAll(".slide"));
  totalSlidesEl.textContent = String(slides.length);

  if (dotsEl) {
    dotsEl.innerHTML = slides
      .map(
        (_s, i) =>
          `<div class="dot" data-i="${i}" aria-label="Slide ${i + 1}"></div>`
      )
      .join("");
  }

  updateActiveSlide(0);
}

deck.addEventListener("scroll", handleScroll, { passive: true });

window.addEventListener("resize", () => {
  goToSlide(currentIndex);
});

prevBtn.addEventListener("click", () => goToSlide(currentIndex - 1));
nextBtn.addEventListener("click", () => goToSlide(currentIndex + 1));

function isFullscreenActive() {
  return Boolean(document.fullscreenElement || document.webkitFullscreenElement);
}

async function toggleFullscreen() {
  try {
    const root = document.documentElement;
    if (!isFullscreenActive()) {
      if (root.requestFullscreen) {
        await root.requestFullscreen();
      } else if (root.webkitRequestFullscreen) {
        root.webkitRequestFullscreen();
      }
    } else if (document.exitFullscreen) {
      await document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn("Fullscreen toggle failed:", err);
  }
}

window.addEventListener("keydown", (event) => {
  const target = event.target;
  const typingTarget =
    target instanceof HTMLElement &&
    (target.tagName === "INPUT" ||
      target.tagName === "TEXTAREA" ||
      target.isContentEditable);
  if (typingTarget) return;

  if (event.key.toLowerCase() === "f") {
    event.preventDefault();
    toggleFullscreen();
    return;
  }

  if (event.key === "ArrowRight" || event.key === "PageDown") {
    goToSlide(currentIndex + 1);
  }
  if (event.key === "ArrowLeft" || event.key === "PageUp") {
    goToSlide(currentIndex - 1);
  }
});

loadSlides().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("Failed to load slides:", err);
  deck.innerHTML =
    "<section class='slide active'><h2>Error loading slides</h2><p class='subtitle'>Open the browser console to see details.</p></section>";
});

// ── Image Modal ──

const imgModal = document.getElementById("imgModal");
const modalStage = imgModal.querySelector(".img-modal-stage");
const modalCaption = imgModal.querySelector(".img-modal-caption");
const modalCounter = imgModal.querySelector(".img-modal-counter");
const modalClose = imgModal.querySelector(".img-modal-close");
const modalPrev = imgModal.querySelector(".img-modal-prev");
const modalNext = imgModal.querySelector(".img-modal-next");
const modalBackdrop = imgModal.querySelector(".img-modal-backdrop");

let modalImages = [];
let modalIndex = 0;

function openModal(galleryId, startIndex) {
  const gallery = document.querySelector(`[data-gallery="${galleryId}"]`);
  if (!gallery) return;

  const thumbs = Array.from(gallery.querySelectorAll(".screenshot-thumb"));
  modalImages = thumbs.map((thumb) => ({
    src: thumb.dataset.src || "",
    title: thumb.dataset.title || "",
    desc: thumb.dataset.desc || "",
    caption: thumb.dataset.caption || "",
  }));

  modalIndex = startIndex || 0;
  imgModal.classList.add("open");
  imgModal.setAttribute("aria-hidden", "false");
  renderModalSlide();
}

function closeModal() {
  imgModal.classList.remove("open");
  imgModal.setAttribute("aria-hidden", "true");
  modalImages = [];
}

function renderModalSlide() {
  if (!modalImages.length) return;
  const item = modalImages[modalIndex];

  if (item.src) {
    modalStage.innerHTML = `<img src="${item.src}" alt="${item.caption}" />`;
  } else {
    modalStage.innerHTML = `
      <div class="modal-placeholder">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" style="opacity:.5">
          <rect x="2" y="2" width="20" height="20" rx="4" stroke="#05CE78" stroke-width="1.5"/>
          <circle cx="8.5" cy="8.5" r="2" stroke="#05CE78" stroke-width="1.5"/>
          <path d="M22 15l-5-5L5 22" stroke="#05CE78" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <div class="mp-title">${item.title}</div>
        <div class="mp-desc">${item.desc}</div>
        <div class="mp-hint">Replace with real screenshot → add image path to data-src attribute</div>
      </div>
    `;
  }

  modalCaption.textContent = item.caption;
  modalCounter.textContent = `${modalIndex + 1} / ${modalImages.length}`;
  modalPrev.style.visibility = modalIndex > 0 ? "visible" : "hidden";
  modalNext.style.visibility =
    modalIndex < modalImages.length - 1 ? "visible" : "hidden";
}

modalClose.addEventListener("click", closeModal);
modalBackdrop.addEventListener("click", closeModal);
modalPrev.addEventListener("click", () => {
  if (modalIndex > 0) {
    modalIndex--;
    renderModalSlide();
  }
});
modalNext.addEventListener("click", () => {
  if (modalIndex < modalImages.length - 1) {
    modalIndex++;
    renderModalSlide();
  }
});

window.addEventListener("keydown", (e) => {
  if (!imgModal.classList.contains("open")) return;
  if (e.key === "Escape") closeModal();
  if (e.key === "ArrowLeft" && modalIndex > 0) {
    modalIndex--;
    renderModalSlide();
  }
  if (e.key === "ArrowRight" && modalIndex < modalImages.length - 1) {
    modalIndex++;
    renderModalSlide();
  }
});

deck.addEventListener("click", (e) => {
  const thumb = e.target.closest(".screenshot-thumb");
  if (!thumb) return;

  // If this thumb is part of a grouped "step" gallery, open modal scoped to that step only.
  // (Used on Slide 6 to show all Step 2 images from public/assets/Code/.)
  const step = thumb.dataset.step;
  if (step) {
    const stepThumbs = Array.from(
      document.querySelectorAll(`.screenshot-thumb[data-step="${step}"]`)
    );
    if (!stepThumbs.length) return;

    modalImages = stepThumbs.map((t) => ({
      src: t.dataset.src || "",
      title: t.dataset.title || "",
      desc: t.dataset.desc || "",
      caption: t.dataset.caption || "",
    }));

    modalIndex = stepThumbs.indexOf(thumb);
    imgModal.classList.add("open");
    imgModal.setAttribute("aria-hidden", "false");
    renderModalSlide();
    return;
  }

  const gallery = thumb.closest("[data-gallery]");
  if (!gallery) return;
  const galleryId = gallery.dataset.gallery;
  const thumbs = Array.from(gallery.querySelectorAll(".screenshot-thumb"));
  const idx = thumbs.indexOf(thumb);
  openModal(galleryId, idx);
});
