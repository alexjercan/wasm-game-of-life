use std::{collections::HashMap, str::FromStr};

#[derive(Debug)]
pub enum Error {
    ParseError,
}

type Cells = Vec<(u32, u32)>;

#[derive(Clone)]
pub struct Pattern {
    name: String,
    cells: Cells,
}

const ALIVE_CHAR: char = 'O';

impl FromStr for Pattern {
    type Err = Error;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        let lines = s.lines().into_iter();

        let mut lines = lines.skip_while(|line| !line.starts_with("!Name:"));

        let (_, name) = lines
            .next()
            .ok_or(Error::ParseError)?
            .split_once(": ")
            .ok_or(Error::ParseError)?;
        let name = name.to_string();

        let lines = lines.skip_while(|line| line.starts_with("!"));

        let cells: Vec<_> = lines
            .enumerate()
            .flat_map(|(row, line)| {
                return line.chars().enumerate().filter_map(move |(col, char)| {
                    if char == ALIVE_CHAR {
                        return Some((row as u32, col as u32));
                    }

                    return None;
                });
            })
            .collect();

        return Ok(Pattern { name, cells });
    }
}

impl Pattern {
    pub fn name(&self) -> String {
        return self.name.clone();
    }

    pub fn cells(&self) -> &Cells {
        return &self.cells;
    }

    pub fn rotate(&self, count: u8) -> Cells {
        if self.cells.len() == 0 {
            return self.cells.clone();
        }

        let max_x = self
            .cells
            .iter()
            .map(|(x, _)| x)
            .max()
            .expect("to have some cells");
        let max_y = self
            .cells
            .iter()
            .map(|(_, y)| y)
            .max()
            .expect("to have some cells");

        return match count % 4 {
            0 => self.cells.clone(),
            1 => self.cells.iter().map(|(x, y)| (*y, max_x - x)).collect(),
            2 => self
                .cells
                .iter()
                .map(|(x, y)| (max_x - x, max_y - y))
                .collect(),
            3 => self.cells.iter().map(|(x, y)| (max_y - y, *x)).collect(),
            _ => unreachable!(),
        };
    }
}

pub struct PatternCollection {
    patterns: HashMap<String, Pattern>,
}

impl PatternCollection {
    pub fn new() -> Self {
        return PatternCollection {
            patterns: HashMap::new(),
        };
    }

    pub fn insert(&mut self, pattern: Pattern) -> Option<Pattern> {
        return self.patterns.insert(pattern.name.clone(), pattern);
    }

    pub fn get(&self, name: &String) -> Option<&Pattern> {
        return self.patterns.get(name);
    }
}

#[cfg(test)]
mod tests {
    use crate::parser::Pattern;

    #[test]
    fn test() {
        let input = "!Name: Glider
!Author: Richard K. Guy
!The smallest, most common, and first discovered spaceship.
!www.conwaylife.com/wiki/index.php?title=Glider
.O
..O
OOO";
        let pattern: Pattern = input.parse().unwrap();

        assert_eq!(pattern.name, "Glider");
        assert_eq!(pattern.cells, vec![(0, 1), (1, 2), (2, 0), (2, 1), (2, 2)]);
    }
}
