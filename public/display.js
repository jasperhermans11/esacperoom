const socket = io();
const grid = document.getElementById("grid");
const btnFullscreen = document.getElementById("btnFullscreen");

const cardsById = new Map();

function stateText(state) {
  if (state === "success") return "succes";
  if (state === "busy") return "bezig";
  return "";
}

function makeCard(person) {
  const card = document.createElement("div");
  card.className = "card person";

  const name = document.createElement("div");
  name.className = "nameOnly";
  name.textContent = person.name;

  const badge = document.createElement("div");
  badge.className = "badge off";
  badge.textContent = "";

  card.appendChild(name);
  card.appendChild(badge);

  return { card, name, badge };
}

socket.on("people:update", ({ people }) => {
  // Rebuild grid in order (simple + stable)
  grid.innerHTML = "";
  cardsById.clear();

  for (const p of people) {
    const el = makeCard(p);

    // apply state
    el.badge.classList.remove("off", "success", "busy");
    el.badge.classList.add(p.state);
    const txt = stateText(p.state);
    el.badge.textContent = txt;

    // name
    el.name.textContent = p.name;

    grid.appendChild(el.card);
    cardsById.set(p.id, el);
  }
});

btnFullscreen.addEventListener("click", async () => {
  try {
    if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
    else await document.exitFullscreen();
  } catch {}
});