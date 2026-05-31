const slides = JSON.parse(document.getElementById("slide-data").textContent);
const deck = document.querySelector("[data-deck]");
const list = document.querySelector("[data-slide-list]");
const counter = document.querySelector("[data-counter]");
let current = Math.max(0, Math.min(slides.length - 1, Number(location.hash.replace("#/", "")) - 1 || 0));

function renderSlide() {
  const slide = slides[current];
  const type = slide.type || "";
  const table = slide.table ? `
    <table>
      <thead><tr>${slide.table.headers.map((h) => `<th>${h}</th>`).join("")}</tr></thead>
      <tbody>${slide.table.rows.map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join("")}</tr>`).join("")}</tbody>
    </table>
  ` : "";
  const body = slide.body ? `<ul>${slide.body.map((item) => `<li>${item}</li>`).join("")}</ul>` : "";
  deck.innerHTML = `
    <article class="slide ${type}">
      <p class="section-label">${slide.section}</p>
      ${type === "cover" ? `<h1>${slide.title}</h1><p class="subtitle">${slide.subtitle || ""}</p>` : `<h2>${slide.title}</h2>`}
      ${body}
      ${table}
      <div class="footer"><span>KAILA Founder-Grade Package</span><span>${current + 1} / ${slides.length}</span></div>
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
renderSlide();
