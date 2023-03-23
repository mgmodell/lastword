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
    initBoard( );
    fetchWords( );
    
  },[])

  const placeWords = ()=>{
    initBoard( );
    const count = 10 + (Math.random() * 20);
    const tmpWords:Array<PlacedWord> = [];
    
    const tmpUsedCells = [...usedCells];
    for( let index = 0; index < count; index++ ){
      const place = Math.round( baseWords.length * Math.random() );
      const proposedWord = baseWords[ place ];

      let placedWord:PlacedWord = {};
      if( tmpUsedCells.length < 1 ){
        const orientation = Math.round( Math.random() * 2 );
        const hiLow = Math.round( Math.random() * 2 );
        const position = Math.round( Math.random() * GRID_SIZE );
        placedWord = {
          orientation: orientation,
          word: proposedWord,
          place: place
        }
        let offset = 0;
        console.log( placedWord );
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
        
      }
      if( isValidPlacement( placedWord ) ){
        tmpWords.push(placedWord );
        setPlacement( placedWord, tmpUsedCells );
      }
    }
    setPlacedWords( tmpWords );
    
  }
  const setPlacement = ( placedWord:PlacedWord, usedCellsStore:Array<Cell>,  ) =>{
        const tmpGrid:Board = Object.assign( {}, grid );
        let curX = placedWord.x;
        let curY = placedWord.y;
        let tmpCell = tmpGrid[curX][curY];
        cell.letter = placedWord.word.charAt( 0 );
        cell.mine = false;
        usedCellsStore.push( tmpCell );
        
        for( let curChar = 1; curChar < placedWord.word.length; curChar++ ){
          if( Orientation.HORIZONTAL === placedWord.orientation ){
            curX = placedWord.x;
            curY = placedWord.y + curChar;
          } else {
            curX = placedWord.x + curChar;
            curY = placedWord.y;
            
          }
          cell = tmpGrid[curX][curY];
          cell.letter = placedWord.word.charAt( curChar );
          cell.mine = false;
          usedCellsStore.push( tmpCell );
        }
        setGrid( tmpGrid );
        setUsedCells( tmpUsedCells );
    
  }
  const isValidPlacement = ( placedWord:PlacedWord ) =>{
    return true;
    
  }
  const selectCell = (event) => {
    const xPos = parseInt( event.target.attributes.xpos.value );
    const yPos = parseInt( event.target.attributes.ypos.value );
    const tmp_grid = Object.assign( {}, grid );
    
    console.log( curCell );
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
    
  }, [grid] );

  return(
    <Fragment>
      <button onClick={placeWords} >New Board</button>
      {board}
    </Fragment>
  )
  
}