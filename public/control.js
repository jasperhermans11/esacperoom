const socket = io();
const grid = document.getElementById("grid");

const allSuccess = document.getElementById("allSuccess");
const allBusy = document.getElementById("allBusy");
const allOff = document.getElementById("allOff");

const nameInput = document.getElementById("nameInput");
const addBtn = document.getElementById("addBtn");

function stateText(state) {
  if (state === "success") return "succes";
  if (state === "busy") return "bezig";
  return "";
}

function makeCard(person) {
  const card = document.createElement("div");
  card.className = "card person controlCard";

  const left = document.createElement("div");
  left.className = "leftBlock";

  const name = document.createElement("div");
  name.className = "nameOnly";
  name.textContent = person.name;

  const badge = document.createElement("div");
  badge.className = "badge off";
  badge.textContent = "";

  left.appendChild(name);
  left.appendChild(badge);

  const controls = document.createElement("div");
  controls.className = "pillgroup";

  const btnOff = document.createElement("button");
  btnOff.className = "pill";
  btnOff.textContent = "Leeg";
  btnOff.addEventListener("click", (e) => {
    e.preventDefault();
    socket.emit("state:set", { id: person.id, value: "off" });
  });

  const btnSuccess = document.createElement("button");
  btnSuccess.className = "pill";
  btnSuccess.textContent = "Succes";
  btnSuccess.addEventListener("click", (e) => {
    e.preventDefault();
    socket.emit("state:set", { id: person.id, value: "success" });
  });

  const btnBusy = document.createElement("button");
  btnBusy.className = "pill";
  btnBusy.textContent = "Bezig";
  btnBusy.addEventListener("click", (e) => {
    e.preventDefault();
    socket.emit("state:set", { id: person.id, value: "busy" });
  });

  const btnRemove = document.createElement("button");
  btnRemove.className = "pill danger";
  btnRemove.textContent = "Verwijder";
  btnRemove.addEventListener("click", (e) => {
    e.preventDefault();
    socket.emit("people:remove", { id: person.id });
  });

  controls.appendChild(btnOff);
  controls.appendChild(btnSuccess);
  controls.appendChild(btnBusy);
  controls.appendChild(btnRemove);

  card.appendChild(left);
  card.appendChild(controls);

  return { card, name, badge, btnOff, btnSuccess, btnBusy };
}

function applyState(el, state) {
  el.badge.classList.remove("off", "success", "busy");
  el.badge.classList.add(state);
  el.badge.textContent = stateText(state);

  [el.btnOff, el.btnSuccess, el.btnBusy].forEach((b) => b.classList.remove("active"));
  if (state === "off") el.btnOff.classList.add("active");
  if (state === "success") el.btnSuccess.classList.add("active");
  if (state === "busy") el.btnBusy.classList.add("active");
}

socket.on("people:update", ({ people }) => {
  grid.innerHTML = "";

  for (const p of people) {
    const el = makeCard(p);
    el.name.textContent = p.name;
    applyState(el, p.state);
    grid.appendChild(el.card);
  }
});

// Add person
function addPerson() {
  const name = nameInput.value.trim();
  if (!name) return;
  socket.emit("people:add", { name });
  nameInput.value = "";
  nameInput.focus();
}

addBtn.addEventListener("click", addPerson);
nameInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") addPerson();
});

// Bulk
allSuccess.addEventListener("click", () => socket.emit("state:all", { value: "success" }));
allBusy.addEventListener("click", () => socket.emit("state:all", { value: "busy" }));
allOff.addEventListener("click", () => socket.emit("state:all", { value: "off" }));