const path = require("path");
const fs = require("fs");
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, "public")));

const DATA_PATH = path.join(__dirname, "data.json");

// Data model:
// people: [{ id, name, state: "off"|"success"|"busy" }]
function loadData() {
  try {
    if (!fs.existsSync(DATA_PATH)) {
      const seed = {
        people: [
          { id: "p1", name: "Jasper", state: "off" },
          { id: "p2", name: "Mika", state: "off" },
          { id: "p3", name: "Jonas", state: "off" },
          { id: "p4", name: "Tom", state: "off" }
        ]
      };
      fs.writeFileSync(DATA_PATH, JSON.stringify(seed, null, 2), "utf8");
      return seed;
    }
    const raw = fs.readFileSync(DATA_PATH, "utf8");
    const parsed = JSON.parse(raw);
    if (!parsed.people || !Array.isArray(parsed.people)) return { people: [] };
    return parsed;
  } catch {
    return { people: [] };
  }
}

function saveData() {
  try {
    fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), "utf8");
  } catch {
    // ignore
  }
}

let data = loadData();

function broadcast() {
  io.emit("people:update", { people: data.people });
}

function newId() {
  return "p" + Math.random().toString(16).slice(2, 10);
}

app.get("/", (req, res) => res.redirect("/display"));
app.get("/display", (req, res) =>
  res.sendFile(path.join(__dirname, "public", "display.html"))
);
app.get("/control", (req, res) =>
  res.sendFile(path.join(__dirname, "public", "control.html"))
);

io.on("connection", (socket) => {
  socket.emit("people:update", { people: data.people });

  socket.on("people:add", ({ name }) => {
    if (typeof name !== "string") return;
    const clean = name.trim().slice(0, 40);
    if (!clean) return;

    data.people.push({ id: newId(), name: clean, state: "off" });
    saveData();
    broadcast();
  });

  socket.on("people:remove", ({ id }) => {
    if (typeof id !== "string") return;
    const before = data.people.length;
    data.people = data.people.filter((p) => p.id !== id);
    if (data.people.length !== before) {
      saveData();
      broadcast();
    }
  });

  socket.on("people:rename", ({ id, name }) => {
    if (typeof id !== "string" || typeof name !== "string") return;
    const clean = name.trim().slice(0, 40);
    if (!clean) return;

    const p = data.people.find((x) => x.id === id);
    if (!p) return;

    p.name = clean;
    saveData();
    broadcast();
  });

  socket.on("state:set", ({ id, value }) => {
    if (typeof id !== "string") return;
    if (!["off", "success", "busy"].includes(value)) return;

    const p = data.people.find((x) => x.id === id);
    if (!p) return;

    p.state = value;
    saveData();
    broadcast();
  });

  socket.on("state:all", ({ value }) => {
    if (!["off", "success", "busy"].includes(value)) return;
    data.people.forEach((p) => (p.state = value));
    saveData();
    broadcast();
  });

  socket.on("state:clearAll", () => {
    data.people.forEach((p) => (p.state = "off"));
    saveData();
    broadcast();
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server:   http://localhost:${PORT}`);
  console.log(`Display:  http://localhost:${PORT}/display`);
  console.log(`Control:  http://localhost:${PORT}/control`);
});