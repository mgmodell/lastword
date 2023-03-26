import React, {useState, useEffect, Fragment, useMemo} from 'react';
import axios from "axios";
import styles from '../styles/Home.module.css';

enum Orientation {
  HORIZONTAL=1,
  VERTICAL=2
}
enum Enhancement {
  NA = 'NA',
  L2 = 'L2',
  L3 = 'L3',
  W2 = 'W2',
  W3 = 'W3'
};
type Cell = {
  xPos: number;
  yPos: number;
  mine: boolean;
  focused: boolean;
  enhancement: Enhancement;
  letter: string;
};
type Board = {
  rows: {
    [key: number]: {
      [key: number]: Cell;
    }
  }
}

type PlacedWord = {
  x: number;
  y: number;
  orientation: Orientation;
  word: string;
  place: number;
};

export default function BoardBuilder(props){

  const [grid,setGrid] = useState<Board>({});
  const [placedWords, setPlacedWords] = useState(Array<PlacedWord>);
  const [baseWords, setBaseWords] = useState([] );
  const [curCell, setCurCell] = useState<Cell>()
  const [usedCells, setUsedCells] = useState(Array<Cell>);

  const GRID_SIZE = 16;
  const x = GRID_SIZE;
  const y = GRID_SIZE;
  
  const initBoard = () => {
    setPlacedWords( [] );
    setUsedCells( [] );
    setGrid({})
    const tmp_grid:Board = {};
    for( let x_pos = 0; x_pos < x; x_pos ++  ){
      tmp_grid[x_pos] = {};
      for( let y_pos = 0; y_pos < y; y_pos ++  ){
        tmp_grid[x_pos][y_pos] ={
          xPos: x_pos,
          yPos: y_pos,
          mine: false,
          focused: false,
          enhancement: Enhancement.NA,
          letter: ''
        }
      }
    }
    setGrid( tmp_grid );
  }
  const fetchWords = ()=>{
    //Now let's get some data
    const url = 'https://raw.githubusercontent.com/' +
      'mgmodell/corpora/master/data/words/common.json';
         axios.get(url )
          .then((resp) =>{
            const words = resp.data.commonWords.filter(word => word.length < 9 );
            setBaseWords( words );
          })
    
  }

  useEffect( ()=>{
    if( baseWords.length > 0 && placedWords.length < 1 ){
      placeWords( );
    }
    
  },[placedWords])

  useEffect( ()=>{
    initBoard( );
    fetchWords( );
    
  },[])

  const placeWords = ()=>{
    const count = 10 + (Math.random() * 20);
    const tmpWords:Array<PlacedWord> = [];
    
    const tmpUsedCells = [...usedCells];
    for( let index = 0; index < count; index++ ){
      const place = Math.round( baseWords.length * Math.random() );
      const proposedWord = baseWords[ place ];
      const placedWord:PlacedWord = {
        word: proposedWord,
        place: place
      };

      if( tmpUsedCells.length < 1 ){
        const orientation = Math.round( Math.random() * 2 );
        const hiLow = Math.round( Math.random() * 2 );
        const position = Math.round( Math.random() * (GRID_SIZE - 1) );
        placedWord.orientation = orientation;
        let offset = 0;
        if( hiLow === 2 ){
          offset = GRID_SIZE - placedWord.word.length;
        }
        if( Orientation.HORIZONTAL !== placedWord.orientation ){
          placedWord.x = offset;
          placedWord.y = position;
        } else {
          placedWord.y = offset;
          placedWord.x = position;
        }
      } else {
        const anchorCell = tmpUsedCells.reverse.find( (cell) => {
          if( placeWords.length % 2 == 1 ){

          }
          const result = proposedWord.search( cell.letter );
          return result !== -1;
        })
        if( anchorCell !== undefined ){
          if( anchorCell?.yPos > 0 && anchorCell?.yPos < 17 &&
              grid[anchorCell.xPos][anchorCell.yPos - 1] !== undefined &&
              grid[anchorCell.xPos][anchorCell.yPos + 1] !== undefined &&
              grid[anchorCell.xPos][anchorCell.yPos - 1].letter === '' &&
              grid[anchorCell.xPos][anchorCell.yPos + 1].letter === '' ){
                placedWord.orientation = Orientation.HORIZONTAL;
                placedWord.x = anchorCell.xPos;
                placedWord.y = anchorCell.yPos - proposedWord.search( anchorCell?.letter );
          } else if( anchorCell?.xPos > 0 && anchorCell?.yPos < 17 &&
              grid[anchorCell.xPos - 1] !== undefined &&
              grid[anchorCell.xPos + 1] !== undefined &&
              grid[anchorCell.xPos - 1][anchorCell.yPos].letter === '' &&
              grid[anchorCell.xPos + 1][anchorCell.yPos].letter === '' ){
                placedWord.orientation = Orientation.VERTICAL;
                placedWord.x = anchorCell.xPos - proposedWord.search( anchorCell?.letter );
                placedWord.y = anchorCell.yPos;
          }

        }
        
      }
      if( isValidPlacement( placedWord ) ){
        tmpWords.push(placedWord );
        setPlacement( placedWord, tmpUsedCells );
      }
    }
    setUsedCells( tmpUsedCells );
    setPlacedWords( tmpWords );
    
  }
  const setPlacement = ( placedWord:PlacedWord, usedCellsStore:Array<Cell>,  ) =>{
        const tmpGrid:Board = Object.assign( {}, grid );
        let curX = placedWord.x;
        let curY = placedWord.y;
        if( curX >= 0 && curX < 17 && curY >= 0 && curY < 17 ){
          let tmpCell = tmpGrid[curX][curY];
          tmpCell.letter = placedWord.word.charAt( 0 );
          tmpCell.mine = false;
          usedCellsStore.push( tmpCell );
        }
        for( let curChar = 1; curChar < placedWord.word.length; curChar++ ){
        
            if( Orientation.HORIZONTAL === placedWord.orientation ){
              curX = placedWord.x;
              curY = placedWord.y + curChar;
            } else {
              curX = placedWord.x + curChar;
              curY = placedWord.y;

            }
          if( curX >= 0 && curX < 16 && curY >= 0 && curY < 16 ){
            let tmpCell = tmpGrid[curX][curY];
            tmpCell.letter = placedWord.word.charAt( curChar );
            tmpCell.mine = false;
            usedCellsStore.push( tmpCell );

          }
        }
        setGrid( tmpGrid );
        setUsedCells( usedCellsStore );
    
  }
  const isValidPlacement = ( placedWord:PlacedWord ) =>{
    let valid = false;
    if( (placedWord.orientation === Orientation.HORIZONTAL ||
          placedWord.orientation === Orientation.VERTICAL ) &&
          placedWord.word !== '' & placedWord.word.length > 1 ){

      const baseWord = findFullWord( placedWord.x, placedWord.y, placedWord.orientation );
      if( baseWords.indexOf( baseWord.word ) ){
        const foundWords = [ baseWord ];
        const crossOrientation = placedWord.orientation = Orientation.HORIZONTAL ? Orientation.VERTICAL : Orientation.HORIZONTAL;
        for( let index = 0; index < baseWord.cells.length;  index ++ ){
          const nextCell = baseWord.cells[ index ];
          const nextWord = findFullWord( nextCell.xPos, nextCell.yPos, crossOrientation );
          if( baseWords.indexOf( nextWord.word ) < 0){
            return valid;
          }

        }
      }
      valid = true;
    }
  }

  const findFullWord = ( startX:number, startY:number, orientation:Orientation ) => {

    const crawler = orientation == Orientation.HORIZONTAL ? [0,1] : [1,0];
    let index = 0;
    
    // Go backwards
    let curX = startX;
    let curY = startY;
    console.log( 'backwards', curX, curY );
    do {
      curX = startX + (index * crawler[0]);
      curY = startY + (index * crawler[1]);
      console.log( 'coords', curX, curY );
      index--;
    } while ( curX > 0 && curY > 0 && grid[curX][curY].letter !== '');
    // Last letter found at:
    index ++;
    console.log( 'forwards' );

    const wordCells = [];
    curX = GRID_SIZE + 1;
    curY = GRID_SIZE + 1;
    let word = '';
    //Collect forwards
    do {
      curX = startX + (index * crawler[0]);
      curY = startY + (index * crawler[1]);
      wordCells.push(grid[ curX][curY] );
      word += grid[curX][curY].letter;

      console.log( 'coords', curX, curY, 'next cell', grid[curX][curY].letter);

      index++;

    } while (curX < GRID_SIZE && curY < GRID_SIZE && grid[curX][curY].letter !== '');

    return {
      word: word,
      cells: wordCells
    }
  }

  const selectCell = (event) => {
    const xPos = parseInt( event.target.attributes.xpos.value );
    const yPos = parseInt( event.target.attributes.ypos.value );
    const tmp_grid = Object.assign( {}, grid );
    
    if( curCell != undefined ){
      const prevCell = Object.assign({}, curCell);
      prevCell.focused = false;
      tmp_grid[prevCell.xPos][prevCell.yPos] = prevCell;
    }
    
    let cur_cell:Cell = tmp_grid[xPos][yPos];
    
    cur_cell.focused = true;
    setGrid( tmp_grid );
    setCurCell( cur_cell );
    
  }
  const selectWords = useMemo( () =>{
    return baseWords.filter( (word) => /[xzqwvkgfyb]/.test( word ) )
  }, [baseWords])
  
  const board = useMemo( () =>{
    const x = 16;
    const y = 16;
    
    if( Object.keys(grid).length < x ){
      return null;
    } else {
      const output = [];
      for( let x_pos = 0; x_pos < x; x_pos ++  ){
        for( let y_pos = 0; y_pos < y; y_pos ++  ){
          const cur_pos = (x_pos * x ) + y_pos;
          const cur_cell = grid[x_pos][y_pos];
          output.push(
            <div key={cur_pos}
              className={cur_cell.focused ? styles.current : styles.inactive }
              xpos={x_pos}
              ypos={y_pos}
              onClick={selectCell}
              >{cur_cell.letter.length > 0 ? cur_cell.letter : '-'}</div>
          )
        }
      }
      return(
        <div className={styles.board}>
          {output}
        </div>
      )
      
    }
    
  }, [grid, placedWords, usedCells] );

  return(
    <Fragment>
      <button onClick={initBoard} >New Board</button>
      {board}
    </Fragment>
  )
  
}