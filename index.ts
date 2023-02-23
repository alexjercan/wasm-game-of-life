import type { Universe, UniverseRenderer } from "./pkg";

import("./pkg").then((m) => start(m)).catch(console.error);

const DOT = "!Name: Dot\n!Author: Alex\nO";
import * as glider from "./assets/glider.cells";
import * as gosperglidergun from "./assets/gosperglidergun.cells";
import * as pulsar from "./assets/pulsar.cells";
import * as rats from "./assets/rats.cells";
import * as _123 from "./assets/123.cells";

const PATTERNS = [
  DOT,
  glider as string,
  pulsar as string,
  gosperglidergun as string,
  rats as string,
  _123 as string,
];

type Module = typeof import("./pkg");

const HEIGHT = 60;
const WIDTH = 120;
const CELL_SIZE = 14; // px
const GRID_COLOR = "#CCCCCC";
const DEAD_COLOR = "#FFFFFF";
const ALIVE_COLOR = "#000000";
const TICK_MS = 100;

class GameLoop {
  private _universe: Universe;
  private _renderer: UniverseRenderer;
  private _context: CanvasRenderingContext2D;

  private _animationId: null | number;

  private _prevTimestamp: null | number;
  private _timeElapsed: number;

  constructor(
    universe: Universe,
    renderer: UniverseRenderer,
    context: CanvasRenderingContext2D
  ) {
    this._universe = universe;
    this._renderer = renderer;
    this._context = context;

    this._animationId = null;
    this._prevTimestamp = null;
    this._timeElapsed = 0;
  }

  private _init(timestamp: number) {
    this._prevTimestamp = timestamp;
    this._animationId = requestAnimationFrame(this._loop.bind(this));
  }

  private _loop(timestamp: number) {
    const deltaTime = timestamp - this._prevTimestamp;
    this._prevTimestamp = timestamp;

    this._timeElapsed += deltaTime;
    if (this._timeElapsed >= TICK_MS) {
      this._universe.update();
      this._timeElapsed = 0;
    }

    this._renderer.draw(this._universe, this._context);

    this._animationId = requestAnimationFrame(this._loop.bind(this));
  }

  isPaused() {
    return this._animationId === null;
  }

  play() {
    this._prevTimestamp = null;
    this._timeElapsed = 0;

    this._animationId = requestAnimationFrame(this._init.bind(this));
  }

  pause() {
    cancelAnimationFrame(this._animationId);
    this._animationId = null;
  }
}

function prettyPatternName(name: string): string {
  switch (name) {
    case "Dot":
      return "⬛";
    case "Glider":
      return "🚀";
    case "Pulsar":
      return "💓";
    case "Gosper glider gun":
      return "🔫";
  }

  return name;
}

async function start(m: Module) {
  const universe = m.Universe.new(WIDTH, HEIGHT);
  universe.randomize();

  let patterns = PATTERNS.map((p) => universe.insert_pattern(p));

  console.log(patterns);

  const renderer = m.UniverseRenderer.new(
    CELL_SIZE,
    GRID_COLOR,
    ALIVE_COLOR,
    DEAD_COLOR
  );

  // Rendering Section
  const canvas = document.createElement("canvas");
  canvas.height = (CELL_SIZE + 1) * HEIGHT + 1;
  canvas.width = (CELL_SIZE + 1) * WIDTH + 1;

  const context = canvas.getContext("2d");

  document.body.appendChild(canvas);

  const game = new GameLoop(universe, renderer, context);
  game.play();

  // Paint Brush Section
  const paintbrushDiv = document.createElement("div");
  document.body.appendChild(paintbrushDiv);

  let currentBrush = patterns[0];
  for (let i = 0; i < patterns.length; i++) {
    const pattern = patterns[i];
    const button = document.createElement("button");
    button.id = pattern;
    button.textContent = prettyPatternName(pattern);
    paintbrushDiv.appendChild(button);

    button.addEventListener("click", (_) => {
      currentBrush = pattern;
    });
  }

  canvas.addEventListener("click", (event) => {
    const boundingRect = canvas.getBoundingClientRect();

    const scaleX = canvas.width / boundingRect.width;
    const scaleY = canvas.height / boundingRect.height;

    const canvasLeft = (event.clientX - boundingRect.left) * scaleX;
    const canvasTop = (event.clientY - boundingRect.top) * scaleY;

    const row = Math.min(Math.floor(canvasTop / (CELL_SIZE + 1)), HEIGHT - 1);
    const col = Math.min(Math.floor(canvasLeft / (CELL_SIZE + 1)), WIDTH - 1);

    universe.put_pattern(row, col, currentBrush);
    // universe.toggle_cell(row, col);
    renderer.draw(universe, context);
  });

  // UI Controls Section
  const controlsDiv = document.createElement("div");
  document.body.appendChild(controlsDiv);

  const playPauseButton = document.createElement("button");
  playPauseButton.textContent = "⏸";
  controlsDiv.appendChild(playPauseButton);

  playPauseButton.addEventListener("click", (_) => {
    if (game.isPaused()) {
      playPauseButton.textContent = "⏸";
      game.play();
    } else {
      playPauseButton.textContent = "▶";
      game.pause();
    }
  });

  const stepButton = document.createElement("button");
  stepButton.textContent = "⏯";
  controlsDiv.appendChild(stepButton);

  stepButton.addEventListener("click", (_) => {
    if (!game.isPaused()) {
      playPauseButton.textContent = "▶";
      game.pause();
    }

    universe.update();
    renderer.draw(universe, context);
  });

  const clearButton = document.createElement("button");
  clearButton.textContent = "↺";
  controlsDiv.appendChild(clearButton);
  clearButton.addEventListener("click", (_) => {
    universe.clear();
    renderer.draw(universe, context);
  });

  const randomizeButton = document.createElement("button");
  randomizeButton.textContent = "⚄";
  controlsDiv.appendChild(randomizeButton);
  randomizeButton.addEventListener("click", (_) => {
    universe.randomize();
    renderer.draw(universe, context);
  });
}
