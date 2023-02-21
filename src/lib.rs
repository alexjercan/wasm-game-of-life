use fixedbitset::FixedBitSet;
use std::cell::RefCell;
use std::rc::Rc;
use wasm_bindgen::prelude::*;
use wasm_bindgen::JsCast;

const TIME_MS: u32 = 100;
const CELL_SIZE: u32 = 8;
const GRID_COLOR: &str = "#CCCCCC";
const DEAD_COLOR: &str = "#FFFFFF";
const ALIVE_COLOR: &str = "#000000";

const UNIVERSE_WIDTH: u32 = 64;
const UNIVERSE_HEIGHT: u32 = 64;

fn window() -> web_sys::Window {
    web_sys::window().expect("no global `window` exists")
}

fn request_animation_frame(f: &Closure<dyn FnMut(u32)>) {
    window()
        .request_animation_frame(f.as_ref().unchecked_ref())
        .expect("should register `requestAnimationFrame` OK");
}

fn document() -> web_sys::Document {
    window()
        .document()
        .expect("should have a document on window")
}

struct Universe {
    width: u32,
    height: u32,
    cells: FixedBitSet,
}

impl Universe {
    fn new(width: u32, height: u32) -> Self {
        let size = (width * height) as usize;
        let cells = FixedBitSet::with_capacity(size);

        Universe {
            width,
            height,
            cells,
        }
    }

    fn update(self: &mut Self, delta_time: u32) {
    }
}

struct UniverseRenderer {
}

impl UniverseRenderer {
    fn draw_grid(self: &Self, universe: &Universe, context: &web_sys::CanvasRenderingContext2d) {
        context.begin_path();
        context.set_stroke_style(&JsValue::from(GRID_COLOR));

        for i in 0..=universe.width {
            context.move_to((i * (CELL_SIZE + 1) + 1) as f64, 0 as f64);
            context.line_to(
                (i * (CELL_SIZE + 1) + 1) as f64,
                ((CELL_SIZE + 1) * universe.height + 1) as f64,
            );
        }

        for j in 0..=universe.height {
            context.move_to(0 as f64, (j * (CELL_SIZE + 1) + 1) as f64);
            context.line_to(
                ((CELL_SIZE + 1) * universe.width + 1) as f64,
                (j * (CELL_SIZE + 1) + 1) as f64,
            );
        }

        context.stroke();
    }

    fn draw_cells(self: &Self, universe: &Universe, context: &web_sys::CanvasRenderingContext2d) {
        context.begin_path();

        for row in 0..universe.height {
            for col in 0..universe.width {
                let idx = (row * universe.width + col) as usize;

                let fill_style = if universe.cells.contains(idx) {
                    ALIVE_COLOR
                } else {
                    DEAD_COLOR
                };
                context.set_fill_style(&JsValue::from(fill_style));

                context.fill_rect(
                    (col * (CELL_SIZE + 1) + 1) as f64,
                    (row * (CELL_SIZE + 1) + 1) as f64,
                    CELL_SIZE as f64,
                    CELL_SIZE as f64,
                );
            }
        }

        context.stroke();
    }

    fn draw(self: &Self, universe: &Universe, context: &web_sys::CanvasRenderingContext2d) {
        self.draw_grid(universe, context);
        self.draw_cells(universe, context);
    }
}

#[wasm_bindgen(start)]
pub fn run() -> Result<(), JsValue> {
    let mut universe = Universe::new(UNIVERSE_WIDTH, UNIVERSE_HEIGHT);
    let universe_renderer = UniverseRenderer {};

    let document = document();

    let canvas = document
        .create_element("canvas")?
        .dyn_into::<web_sys::HtmlCanvasElement>()?;
    canvas.set_width((CELL_SIZE + 1) * universe.width + 1);
    canvas.set_height((CELL_SIZE + 1) * universe.height + 1);
    let context = canvas
        .get_context("2d")?
        .unwrap()
        .dyn_into::<web_sys::CanvasRenderingContext2d>()?;

    document.body().unwrap().append_child(&canvas)?;

    let mut prev_timestamp: u32 = 0;
    let mut time_elapsed: u32 = 0;

    let update = Rc::new(RefCell::new(None));
    let update_ptr = update.clone();

    *update_ptr.borrow_mut() = Some(Closure::wrap(Box::new(move |timestamp| {
        let delta_time = timestamp - prev_timestamp;
        prev_timestamp = timestamp;

        time_elapsed += delta_time;
        if time_elapsed >= TIME_MS {
            universe.update(time_elapsed);
            time_elapsed = 0;
        }

        universe_renderer.draw(&universe, &context);

        request_animation_frame(update.borrow().as_ref().unwrap());
    }) as Box<dyn FnMut(u32)>));

    request_animation_frame(update_ptr.borrow().as_ref().unwrap());
    Ok(())
}
