use std::cell::RefCell;
use std::rc::Rc;
use wasm_bindgen::prelude::*;
use wasm_bindgen::JsCast;

fn window() -> web_sys::Window {
    web_sys::window().expect("no global `window` exists")
}

fn request_animation_frame(f: &Closure<dyn FnMut(usize)>) {
    window()
        .request_animation_frame(f.as_ref().unchecked_ref())
        .expect("should register `requestAnimationFrame` OK");
}

fn document() -> web_sys::Document {
    window()
        .document()
        .expect("should have a document on window")
}

fn body() -> web_sys::HtmlElement {
    document().body().expect("document should have a body")
}


struct Universe {
    width: usize,
    height: usize,
    fps: f32,
}

impl Universe {
    fn new(width: usize, height: usize) -> Self {
        return Universe { width, height,  fps: 0.0 };
    }

    fn update(self: &mut Self, delta_time: usize) {
        self.fps = 1000.0 / delta_time as f32;
    }

    fn draw(self: &Self) {
        body().set_text_content(Some(&format!("fps: {}", self.fps)));
    }
}

const TIME_MS: usize = 100;

#[wasm_bindgen(start)]
pub fn run() -> Result<(), JsValue> {
    let update = Rc::new(RefCell::new(None));
    let update_ptr = update.clone();

    let mut universe = Universe::new(64, 64);

    let mut prev_timestamp: usize = 0;
    let mut time_elapsed: usize = 0;

    *update_ptr.borrow_mut() = Some(Closure::wrap(Box::new(move |timestamp| {
        let delta_time = timestamp - prev_timestamp;
        prev_timestamp = timestamp;

        time_elapsed += delta_time;
        if time_elapsed >= TIME_MS {
            universe.update(time_elapsed);
            time_elapsed = 0;
        }

        universe.draw();

        request_animation_frame(update.borrow().as_ref().unwrap());
    }) as Box<dyn FnMut(usize)>));

    request_animation_frame(update_ptr.borrow().as_ref().unwrap());
    Ok(())
}
