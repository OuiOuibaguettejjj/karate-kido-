const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

class MockElement {
  constructor(id = "") {
    this.id = id;
    this.textContent = "";
    this.disabled = false;
    this.hidden = false;
    this.style = {};
    this.dataset = {};
    this.handlers = {};
    const classes = new Set();
    this.classList = {
      add: name => classes.add(name),
      remove: name => classes.delete(name),
      contains: name => classes.has(name),
      toggle: (name, force) => {
        const shouldAdd = force === undefined ? !classes.has(name) : force;
        if (shouldAdd) classes.add(name); else classes.delete(name);
        return shouldAdd;
      }
    };
  }
  addEventListener(name, fn) { this.handlers[name] = fn; }
  click() { this.handlers.click?.({ target: this, preventDefault() {} }); }
  pointerdown() { this.handlers.pointerdown?.({ target: this, preventDefault() {} }); }
}

const elements = new Map();
const get = id => {
  if (!elements.has(id)) elements.set(id, new MockElement(id));
  return elements.get(id);
};
const screens = ["home-screen", "dojo-screen", "profile-screen", "pause-screen", "over-screen"].map(get);
const screenButtons = ["dojo-screen", "profile-screen", "home-screen"].map(id => {
  const el = new MockElement("screen-" + id); el.dataset.screen = id; return el;
});
const skins = ["red", "blue", "green", "gold"].map(skin => {
  const el = new MockElement("skin-" + skin); el.dataset.skin = skin; return el;
});
const context = { fillRect() {}, save() {}, restore() {}, translate() {} };
get("game").getContext = () => context;
const storage = new Map([["kk2-profile", JSON.stringify({coins:100,best:0,xp:0,breath:0,focus:0,skin:"red",games:0})]]);
const document = {
  hidden: false,
  getElementById: get,
  querySelectorAll(selector) {
    if (selector === ".screen") return screens;
    if (selector === "[data-screen]") return screenButtons;
    if (selector === ".skin") return skins;
    return [];
  },
  addEventListener() {}
};
const sandbox = {
  document,
  window: { addEventListener() {} },
  localStorage: {
    getItem: key => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, String(value))
  },
  performance: { now: () => 100 },
  requestAnimationFrame() {},
  setTimeout() { return 1; },
  clearTimeout() {},
  Math: Object.assign(Object.create(Math), { random: () => 0.9 }),
  console
};

vm.runInNewContext(fs.readFileSync("game.js", "utf8"), sandbox, { filename: "game.js" });
assert.equal(get("home-screen").classList.contains("active"), true, "home screen should be visible");
get("play-button").click();
assert.equal(get("left-button").disabled, false, "left control should be enabled during a game");
get("left-button").pointerdown();
assert.equal(get("score").textContent, 10, "a safe hit should add ten points");
get("right-button").pointerdown();
assert.equal(get("score").textContent, 20, "a second safe hit should increase the score");
get("right-button").pointerdown();
assert.equal(get("over-screen").classList.contains("active"), true, "a matching branch should end the game");
const saved = JSON.parse(storage.get("kk2-profile"));
assert.equal(saved.best, 20, "best score should persist");
assert.equal(saved.xp, 20, "experience should persist");
assert.equal(saved.coins, 104, "earned coins should persist");
screenButtons.find(button => button.dataset.screen === "dojo-screen").click();
get("buy-breath").click();
const upgraded = JSON.parse(storage.get("kk2-profile"));
assert.equal(upgraded.breath, 1, "dojo upgrade should persist");
assert.equal(upgraded.coins, 54, "upgrade should deduct its price");
console.log("Smoke test passed: start, controls, scoring, collision, persistence and dojo upgrade.");
