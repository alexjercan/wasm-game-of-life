import type { Universe, UniverseRenderer } from "./pkg";

import("./pkg").then((m) => start(m)).catch(console.error);

import { PATTERNS } from "./assets";

type Module = typeof import("./pkg");

const HEIGHT = 100;
const WIDTH = 200;
const CELL_SIZE = 8; // px
const GRID_COLOR = "#FFFFFF";
const DEAD_COLOR = "#FFFFFF";
const ALIVE_COLOR = "#000000";
const PLACEHOLDER_COLOR = "#DDDDDD";
const TICK_MS = 100;

let rotation = 0;

class GameLoop {
  private _universe: Universe;
  private _renderer: UniverseRenderer;
  private _context: CanvasRenderingContext2D;

  private _animationId: null | number;

  private _prevTimestamp: null | number;
  private _timeElapsed: number;

  private _placeholder_row: null | number;
  private _placeholder_col: null | number;
  private _placeholder_brush: null | string;

  private _paused: boolean;

  set_placeholder(
    row: null | number,
    col: null | number,
    brush: null | string
  ) {
    this._placeholder_row = row;
    this._placeholder_col = col;
    this._placeholder_brush = brush;
  }

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

    this._placeholder_row = null;
    this._placeholder_col = null;
    this._placeholder_brush = null;

    this._paused = true;
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
      if (!this._paused) {
        this._universe.update();
      }
      this._timeElapsed = 0;
    }

    this._renderer.draw(this._universe, this._context);

    if (
      this._placeholder_row !== null &&
      this._placeholder_col !== null &&
      this._placeholder_brush !== null
    ) {
      this._renderer.draw_placeholder(
        this._universe,
        this._context,
        this._placeholder_row,
        this._placeholder_col,
        this._placeholder_brush,
        rotation
      );
    }

    this._animationId = requestAnimationFrame(this._loop.bind(this));
  }

  isPaused() {
    return this._paused;
  }

  play() {
    this._prevTimestamp = null;
    this._timeElapsed = 0;

    if (this._animationId !== null) {
      cancelAnimationFrame(this._animationId);
    }
    this._animationId = requestAnimationFrame(this._init.bind(this));
    this._paused = false;
  }

  pause() {
    this._paused = true;
  }
}

function prettyPatternName(name: string): string {
  switch (name) {
    case "3c/10 pi wave":
      return "π";
    case "Acorn":
      return "🌰";
    case "Banana Spark":
      return "🍌";
    case "Blinker":
      return "➕";
    case "Block":
      return "⬛";
    case "Dot":
      return "•";
    case "Eater 1":
      return "🪝";
    case "Gosper glider gun":
      return "🔫";
    case "Glider":
      return "🚀";
    case "Herschel":
      return "h";
    case "Pulsar":
      return "💓";
    case "Switch engine":
      return "🚒";
    case "Unix":
      return "🐧";
  }

  return name;
}

async function start(m: Module) {
  const universe = m.Universe.new(WIDTH, HEIGHT);
  universe.randomize();

  let patterns = PATTERNS.map((p) => universe.insert_pattern(p));

  const renderer = m.UniverseRenderer.new(
    CELL_SIZE,
    GRID_COLOR,
    ALIVE_COLOR,
    DEAD_COLOR,
    PLACEHOLDER_COLOR
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
    button.title = pattern;
    paintbrushDiv.appendChild(button);

    button.addEventListener("click", (_) => {
      currentBrush = pattern;
    });
  }

  canvas.addEventListener("mousemove", (event) => {
    const boundingRect = canvas.getBoundingClientRect();

    const scaleX = canvas.width / boundingRect.width;
    const scaleY = canvas.height / boundingRect.height;

    const canvasLeft = (event.clientX - boundingRect.left) * scaleX;
    const canvasTop = (event.clientY - boundingRect.top) * scaleY;

    const row = Math.min(Math.floor(canvasTop / (CELL_SIZE + 1)), HEIGHT - 1);
    const col = Math.min(Math.floor(canvasLeft / (CELL_SIZE + 1)), WIDTH - 1);

    game.set_placeholder(row, col, currentBrush);
  });

  canvas.addEventListener("click", (event) => {
    const boundingRect = canvas.getBoundingClientRect();

    const scaleX = canvas.width / boundingRect.width;
    const scaleY = canvas.height / boundingRect.height;

    const canvasLeft = (event.clientX - boundingRect.left) * scaleX;
    const canvasTop = (event.clientY - boundingRect.top) * scaleY;

    const row = Math.min(Math.floor(canvasTop / (CELL_SIZE + 1)), HEIGHT - 1);
    const col = Math.min(Math.floor(canvasLeft / (CELL_SIZE + 1)), WIDTH - 1);

    universe.put_pattern(row, col, currentBrush, rotation);
    renderer.draw(universe, context);
  });

  // UI Controls Section
  const controlsDiv = document.createElement("div");
  document.body.appendChild(controlsDiv);

  const playPauseButton = document.createElement("button");
  playPauseButton.textContent = "⏸";
  playPauseButton.title = "Play/Pause the simulation";
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
  stepButton.title = "Manually step the simulation";
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
  clearButton.title = "Clear the simulation";
  controlsDiv.appendChild(clearButton);
  clearButton.addEventListener("click", (_) => {
    universe.clear();
    renderer.draw(universe, context);
  });

  const randomizeButton = document.createElement("button");
  randomizeButton.textContent = "⚄";
  randomizeButton.title = "Randomize the simulation";
  controlsDiv.appendChild(randomizeButton);
  randomizeButton.addEventListener("click", (_) => {
    universe.randomize();
    renderer.draw(universe, context);
  });

  const wrappingButton = document.createElement("button");
  wrappingButton.textContent = "🔀";
  wrappingButton.title = "Switch between wrapping and non wrapping modes";
  controlsDiv.appendChild(wrappingButton);

  wrappingButton.addEventListener("click", (_) => {
    const wrapping = universe.wrapping();
    if (wrapping) {
      wrappingButton.textContent = "🔀";
    } else {
      wrappingButton.textContent = "🔁";
    }

    universe.set_wrapping(!wrapping);
  });

  const rotateButton = document.createElement("button");
  rotateButton.textContent = `${rotation * 90}`;
  rotateButton.title = "Use to rotate the patterns, or you can use `R`";
  controlsDiv.appendChild(rotateButton);

  rotateButton.addEventListener("click", (_) => {
    rotation = (rotation + 1) % 4;
    rotateButton.textContent = `${rotation * 90}`;
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "r") {
      rotation = (rotation + 1) % 4;
    }
  });
}
