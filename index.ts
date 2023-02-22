import type { Universe, UniverseRenderer } from "./pkg";

import("./pkg").then((m) => start(m)).catch(console.error);

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

enum Brush {
  Normal = "normal",
  Spaceship = "spaceship",
  Pulsar = "pulsar",
}

function start(m: Module) {
  const universe = m.Universe.new(WIDTH, HEIGHT);
  universe.randomize();

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

  const normalButton = document.createElement("button");
  normalButton.id = Brush.Normal;
  normalButton.textContent = "⬛";
  paintbrushDiv.appendChild(normalButton);

  const spaceshipButton = document.createElement("button");
  spaceshipButton.id = Brush.Spaceship;
  spaceshipButton.textContent = "🚀";
  paintbrushDiv.appendChild(spaceshipButton);

  const pulsarButton = document.createElement("button");
  pulsarButton.id = Brush.Pulsar;
  pulsarButton.textContent = "💓";
  paintbrushDiv.appendChild(pulsarButton);

  let currentBrush = Brush.Normal;
  for (let i = 0; i < paintbrushDiv.children.length; i++) {
    const button = paintbrushDiv.children[i];
    button.addEventListener("click", (_) => {
      currentBrush = button.id as Brush;
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

    switch (currentBrush) {
      case Brush.Normal:
        universe.toggle_cell(row, col);
        break;
      case Brush.Spaceship:
        universe.put_spaceship(row, col);
        break;
      case Brush.Pulsar:
        universe.put_pulsar(row, col);
        break;
      default:
        break;
    }
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
