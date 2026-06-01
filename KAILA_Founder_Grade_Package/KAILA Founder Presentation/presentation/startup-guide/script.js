function readSlideData() {
  const raw = document.getElementById("slide-data").textContent.trim();
  return JSON.parse(raw);
}

const slides = readSlideData();
const deck = document.querySelector("[data-deck]");
const list = document.querySelector("[data-slide-list]");
const counter = document.querySelector("[data-counter]");
const gate = document.querySelector("[data-access-gate]");
const accessForm = document.querySelector("[data-access-form]");
const accessPassword = document.querySelector("[data-access-password]");
const accessError = document.querySelector("[data-access-error]");
const expectedHash = "f7365694899554da5d09174836be9af12660a5e4f03c8120ef00e301c62632c7";
const localFallbackPassword = "Gingoog-KAILA-Founders-72-Sampaguita!";
let current = Math.max(0, Math.min(slides.length - 1, Number(location.hash.replace("#/", "")) - 1 || 0));

document.body.classList.add("locked");

async function sha256(value) {
  if (!crypto?.subtle) return "";
  const encoded = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function unlockDeck() {
  sessionStorage.setItem("kailaStartupGuideUnlocked", "true");
  document.body.classList.remove("locked");
  gate.hidden = true;
  renderSlide();
}

accessForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const hash = await sha256(accessPassword.value);
  if (hash === expectedHash || (!hash && accessPassword.value === localFallbackPassword)) {
    unlockDeck();
    return;
  }
  accessError.hidden = false;
  accessPassword.select();
});

if (sessionStorage.getItem("kailaStartupGuideUnlocked") === "true") {
  unlockDeck();
}

function renderSlide() {
  const slide = slides[current];
  const image = `slides/slide-${String(current + 1).padStart(3, "0")}.png`;
  deck.innerHTML = `
    <article class="slide visual">
      <img class="slide-visual" src="${image}" alt="Slide ${current + 1}: ${slide.title}">
    </article>
  `;
  counter.textContent = `${current + 1} / ${slides.length}`;
  location.hash = `/${current + 1}`;
  renderList();
}

function renderList() {
  list.innerHTML = slides.map((slide, index) => `
    <button type="button" class="${index === current ? "active" : ""}" data-jump="${index}">
      ${index + 1}. ${slide.title}
    </button>
  `).join("");
  list.querySelectorAll("[data-jump]").forEach((button) => {
    button.addEventListener("click", () => {
      current = Number(button.dataset.jump);
      renderSlide();
    });
  });
}

function move(delta) {
  current = Math.max(0, Math.min(slides.length - 1, current + delta));
  renderSlide();
}

document.querySelector("[data-prev]").addEventListener("click", () => move(-1));
document.querySelector("[data-next]").addEventListener("click", () => move(1));
document.addEventListener("keydown", (event) => {
  if (event.key === "ArrowRight" || event.key === "PageDown") move(1);
  if (event.key === "ArrowLeft" || event.key === "PageUp") move(-1);
});
