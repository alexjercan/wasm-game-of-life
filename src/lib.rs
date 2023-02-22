use fixedbitset::FixedBitSet;
use js_sys::Math::random;
use wasm_bindgen::prelude::*;

const SPACESHIP: &[(u32, u32)] = &[(1, 2), (2, 3), (3, 1), (3, 2), (3, 3)];

#[wasm_bindgen]
pub struct Universe {
    width: u32,
    height: u32,
    cells: FixedBitSet,
}

#[wasm_bindgen]
impl Universe {
    pub fn new(width: u32, height: u32) -> Self {
        let size = (width * height) as usize;
        let cells = FixedBitSet::with_capacity(size);

        return Universe {
            width,
            height,
            cells,
        };
    }

    pub fn width(&self) -> u32 {
        return self.width;
    }

    pub fn height(&self) -> u32 {
        return self.height;
    }

    pub fn get_index(&self, row: u32, column: u32) -> usize {
        return (row * self.width + column) as usize;
    }

    pub fn contains(&self, row: u32, col: u32) -> bool {
        let idx = self.get_index(row, col);

        return self.cells.contains(idx);
    }

    fn live_neighbor_count(&self, row: u32, column: u32) -> u8 {
        let mut count = 0;
        for delta_row in [self.height - 1, 0, 1].iter().cloned() {
            for delta_col in [self.width - 1, 0, 1].iter().cloned() {
                if delta_row == 0 && delta_col == 0 {
                    continue;
                }

                let neighbor_row = (row + delta_row) % self.height;
                let neighbor_col = (column + delta_col) % self.width;
                let idx = self.get_index(neighbor_row, neighbor_col);
                count += self.cells[idx] as u8;
            }
        }

        return count;
    }

    pub fn update(&mut self) {
        let mut next = self.cells.clone();

        for row in 0..self.height {
            for col in 0..self.width {
                let idx = self.get_index(row, col);
                let cell = self.cells[idx];
                let live_neighbors = self.live_neighbor_count(row, col);

                next.set(
                    idx,
                    match (cell, live_neighbors) {
                        (true, x) if x < 2 => false,
                        (true, 2) | (true, 3) => true,
                        (true, x) if x > 3 => false,
                        (false, 3) => true,
                        (otherwise, _) => otherwise,
                    },
                );
            }
        }

        self.cells = next;
    }

    pub fn randomize(&mut self) {
        let size = (self.width * self.height) as usize;

        for i in 0..size {
            self.cells.set(i, random() < 0.5);
        }
    }

    pub fn clear(&mut self) {
        self.cells.clear();
    }

    pub fn toggle_cell(&mut self, row: u32, column: u32) {
        let idx = self.get_index(row, column);

        self.cells.toggle(idx);
    }

    fn put_cells(&mut self, row: u32, column: u32, cells: &[(u32, u32)]) {
        cells.iter().for_each(|(dx, dy)| {
            let idx = self.get_index(row + dx, column + dy);

            self.cells.put(idx);
        });
    }

    pub fn put_spaceship(&mut self, row: u32, column: u32) {
        self.put_cells(row, column, SPACESHIP);
    }
}

#[wasm_bindgen]
pub struct UniverseRenderer {
    cell_size: u32,
    grid_color: String,
    alive_color: String,
    dead_color: String,
}

#[wasm_bindgen]
impl UniverseRenderer {

    pub fn new(cell_size: u32, grid_color: String, alive_color: String, dead_color: String) -> Self {
        return UniverseRenderer { cell_size, grid_color, alive_color, dead_color };
    }

    fn draw_grid(self: &Self, universe: &Universe, context: &web_sys::CanvasRenderingContext2d) {
        context.begin_path();
        context.set_stroke_style(&JsValue::from(&self.grid_color));

        for i in 0..=universe.width {
            context.move_to((i * (self.cell_size + 1) + 1) as f64, 0 as f64);
            context.line_to(
                (i * (self.cell_size + 1) + 1) as f64,
                ((self.cell_size + 1) * universe.height + 1) as f64,
            );
        }

        for j in 0..=universe.height {
            context.move_to(0 as f64, (j * (self.cell_size + 1) + 1) as f64);
            context.line_to(
                ((self.cell_size + 1) * universe.width + 1) as f64,
                (j * (self.cell_size + 1) + 1) as f64,
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
                    &self.alive_color
                } else {
                    &self.dead_color
                };
                context.set_fill_style(&JsValue::from(fill_style));

                context.fill_rect(
                    (col * (self.cell_size + 1) + 1) as f64,
                    (row * (self.cell_size + 1) + 1) as f64,
                    self.cell_size as f64,
                    self.cell_size as f64,
                );
            }
        }

        context.stroke();
    }

    pub fn draw(&self, universe: &Universe, context: &web_sys::CanvasRenderingContext2d) {
        self.draw_grid(universe, context);
        self.draw_cells(universe, context);
    }
}
