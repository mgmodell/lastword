enum Orientation {
  HORIZONTAL='horizontal',
  VERTICAL='vertical'
};
enum Enhancement {
  NA = 'NA',
  L2 = 'Double Letter Score',
  L3 = 'Triple Letter Score',
  W2 = 'Double Word Score',
  W3 = 'Triple Word Score'
};
type Cell = {
  xPos: number;
  yPos: number;
  mine: boolean;
  focused: boolean;
  scored: boolean;
  enhancement: Enhancement;
  letter: string;
  words: Array<PlacedWord>;
};
type PlacedWord = {
  x: number;
  y: number;
  orientation: Orientation;
  word: string;
  place: number;
  cells: Array<Cell>;
};

type Board = {
  xMax: number;
  yMax: number;
  rows: Array<Array<Cell>>;
  placedWords: Array<PlacedWord>,
  usedCells: Array<Cell>,
  removedWord: PlacedWord | null,
  letterSet: string,
  lettersLeft: string,

  challengerScore: number,
  yourScore: number,
  gameScored: boolean,
}

type PointMap = {
  [key: string] : {
    points: number,
    tiles: number
  }
}

export { Orientation, Enhancement, type Cell, type PlacedWord, type Board, type PointMap }