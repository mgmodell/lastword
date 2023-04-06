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
type PlacedWord = {
  x: number;
  y: number;
  orientation: Orientation;
  word: String;
  place: number;
};

type Board = {
  xMax: number;
  yMax: number;
  rows: {
    [key: number]: {
      [key: number]: Cell;
    }
  };
  placedWords: Array<PlacedWord>,
  usedCells: Array<Cell>,
}


export default function BoardBuilder(props){

  const GRID_SIZE = 17;
  const x = GRID_SIZE;
  const y = GRID_SIZE;
  
  const [gameBoard,setGameBoard] = useState<Board>({
    xMax: 0,
    yMax: 0,
    rows: [],
    placedWords: [],
    usedCells: [],
  });

  const [baseWords, setBaseWords] = useState([] );
  const [curCell, setCurCell] = useState<Cell>()
  //const [placedWords, setPlacedWords] = useState(Array<PlacedWord>);
  //const [usedCells, setUsedCells] = useState(Array<Cell>);

  const initBoard = () => {


    //setPlacedWords( [] );
    //setUsedCells( [] );
    //setGameBoard({})
    const tmp_grid = [];

    for( let x_pos = 0; x_pos < gameBoard.xMax; x_pos ++  ){
      tmp_grid.push( [] );
      for( let y_pos = 0; y_pos < gameBoard.yMax; y_pos ++  ){
        const nextCell:Cell = {
            xPos: x_pos,
            yPos: y_pos,
            mine: false,
            focused: false,
            enhancement: Enhancement.NA,
            letter: ''
          };

        tmp_grid[x_pos].push( nextCell );

      }
    }
    setGameBoard( tmp_grid );
    if( baseWords.length > 0 ){
      const builtBoard = buildBoard( x, y, baseWords );
      setGameBoard( builtBoard );
      //placeWords( );

    }

    const boardBase = document.querySelector(`.${styles.board}`);
    boardBase?.style.setProperty( 
      'grid-template-columns',
      `repeat( ${GRID_SIZE} , 1fr )`
    );
  }
  const fetchWords = ()=>{
    //Now let's get some data
    const url = 'https://raw.githubusercontent.com/' +
      'mgmodell/corpora/master/data/words/common.json';
         //setBaseWords( ['hello', 'goodbye', 'transit', 'traffic', ] );
         axios.get(url )
          .then((resp) =>{
            const words = resp.data.commonWords.filter((word) =>{
              return word?.length < 9 
            } );
            setBaseWords( words );
          })
    
  }

  useEffect( ()=>{
    fetchWords( );
    initBoard( );
    
  },[])

  const buildBoard = ( xMax: number, yMax: number, words: Array<String> ): Board=>{
    const boardGrid: Array<Array<Cell>> = [];

    for( let x_pos = 0; x_pos < xMax; x_pos ++  ){
      boardGrid.push( [] );
      for( let y_pos = 0; y_pos < yMax; y_pos ++  ){
        const nextCell: Cell = 
          {
            xPos: x_pos,
            yPos: y_pos,
            mine: false,
            focused: false,
            enhancement: Enhancement.NA,
            letter: ''
          };

        boardGrid[x_pos].push(
          nextCell
        ) 
      }
    }
    const tmpBoard: Board = {
      xMax: xMax,
      yMax: yMax,
      rows: boardGrid,
      placedWords: [],
      usedCells: []
    }
    //build 
    //Select and place first word
    let nextWord = getWord( words );

    return tmpBoard;

  }

  const getWord = ( words: Array<String> ):PlacedWord=>{
    const orientation = Math.floor( Math.random( ) * 2 )  > 1 ? Orientation.HORIZONTAL : Orientation.VERTICAL;
    const place = Math.floor( Math.random( ) * words.length)

    return ({
      x: -1,
      y: -1,
      orientation: orientation,
      word: words[ place ],
      place: place
    })

  }

  const placeWords = ()=>{
    const count = 10 + Math.round( (Math.random() * 20) );
    const tmpWords:Array<PlacedWord> = [];
    
    const tmpUsedCells = [...usedCells];
    for( let index = 0; index < count; index++ ){
      const place = Math.floor( baseWords.length * Math.random() );
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
        const anchorCell = tmpUsedCells.reverse().find( (cell) => {
          const result = proposedWord.search( cell.letter );
          return result !== -1;
        })
        if( anchorCell !== undefined ){
          if( anchorCell.yPos > 0 && anchorCell.yPos < 17 &&
              ( gameBoard[anchorCell.xPos][anchorCell.yPos - 1]?.letter !== '' ||
              gameBoard[anchorCell.xPos][anchorCell.yPos + 1]?.letter !== '' ) ){
                placedWord.orientation = Orientation.HORIZONTAL;
                placedWord.y = anchorCell.yPos;
                placedWord.x = anchorCell.xPos - proposedWord.search( anchorCell.letter );
          } else if( anchorCell.xPos > 0 && anchorCell.yPos < 17 &&
              ( gameBoard[anchorCell.xPos - 1][anchorCell.yPos]?.letter !== '' ||
              gameBoard[anchorCell.xPos + 1][anchorCell.yPos]?.letter !== '' ) ){
                placedWord.orientation = Orientation.VERTICAL;
                placedWord.y = anchorCell.yPos - proposedWord.search( anchorCell.letter );
                placedWord.x = anchorCell.xPos;
          }

        }
        
      }
      if( isValidPlacement( placedWord ) ){
        console.log( 'adding', placedWord );
        tmpWords.push(placedWord );
        setPlacement( placedWord, tmpUsedCells );
      }
    }
    setUsedCells( tmpUsedCells );
    setPlacedWords( tmpWords );
    
  }
  const setPlacement = ( placedWord:PlacedWord, usedCellsStore:Array<Cell>,  ) =>{
        const tmpGrid:Board = Object.assign( {}, gameBoard );
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
          if( curX >= 0 && curX < GRID_SIZE && curY >= 0 && curY < GRID_SIZE ){
            let tmpCell = tmpGrid[curX][curY];
            tmpCell.letter = placedWord.word.charAt( curChar );
            tmpCell.mine = false;
            usedCellsStore.push( tmpCell );

          }
        }
        setGameBoard( tmpGrid );
        setUsedCells( usedCellsStore );
    
  }
  const isValidPlacement = ( placedWord:PlacedWord ) =>{
    let valid = false;
    console.log( 'validating', placedWord );
    if( (placedWord.orientation === Orientation.HORIZONTAL ||
          placedWord.orientation === Orientation.VERTICAL ) &&
          placedWord.word !== '' & placedWord.word.length > 1 ){

      const baseWord = findFullWord( placedWord.x, placedWord.y, placedWord.orientation, placedWord.word );
      if( baseWords.indexOf( baseWord.word ) ){
        const foundWords = [ baseWord ];
        const crossOrientation = placedWord.orientation = Orientation.HORIZONTAL ? Orientation.VERTICAL : Orientation.HORIZONTAL;
        for( let index = 0; index < baseWord.cells.length;  index ++ ){
          const nextCell = baseWord.cells[ index ];
          const nextWord = findFullWord( nextCell.xPos, nextCell.yPos, crossOrientation );
          if( nextWord.word.length > 0 && baseWords.indexOf( nextWord.word ) < 0){
            return valid;
          }

        }
      }
      valid = true;
    } else {
      console.log( 'no check', placedWord );
    }
    return valid;
  }

  const findFullWord = ( startX:number, startY:number, orientation:Orientation, baseWord = '' ) => {

    const crawler = orientation == Orientation.HORIZONTAL ? [0,1] : [1,0];
    let index = 0;
    
    // Go backwards
    var curX = startX;
    var curY = startY;
    do {
      curX = startX + (index * crawler[0]);
      curY = startY + (index * crawler[1]);
      index--;
    } while ( curX > 0 && curY > 0 && gameBoard[curX][curY].letter !== '');
    // Last letter found at:
    index ++;

    const wordCells = [];
    curX = GRID_SIZE + 1;
    curY = GRID_SIZE + 1;
    let word = '';
    //Collect forwards
    do {
      curX = startX + (index * crawler[0]);
      curY = startY + (index * crawler[1]);
      if( curX >= 0 && curY >= 0 && 
          curX < GRID_SIZE && curY < GRID_SIZE){
        wordCells.push(gameBoard[ curX][curY] );
        if( gameBoard[curX][curY].letter === '' ){
          word += baseWord.charAt( index );
        } else {
          word += gameBoard[curX][curY].letter;
        }
        index++;

      }

    } while (curX < (GRID_SIZE -1) &&
             curY < (GRID_SIZE -1) &&
             ( gameBoard[curX][curY].letter !== '' ||
               index <= baseWord.length )
             );

    return {
      word: word,
      cells: wordCells
    }
  }

  const selectCell = (event) => {
    const xPos = parseInt( event.target.attributes.xpos.value );
    const yPos = parseInt( event.target.attributes.ypos.value );
    const tmp_grid = Object.assign( {}, gameBoard );
    
    if( curCell != undefined ){
      const prevCell = Object.assign({}, curCell);
      prevCell.focused = false;
      tmp_grid[prevCell.xPos][prevCell.yPos] = prevCell;
    }
    
    let cur_cell:Cell = tmp_grid[xPos][yPos];
    
    cur_cell.focused = true;
    setGameBoard( tmp_grid );
    setCurCell( cur_cell );
    
  }
  const selectWords = useMemo( () =>{
    return baseWords.filter( (word) => /[xzqwvkgfyb]/.test( word ) )
  }, [baseWords])
  
  const board = useMemo( () =>{
    const x = GRID_SIZE;
    const y = GRID_SIZE;
    
    if( Object.keys(gameBoard.rows).length < x ){
      return null;
    } else {
      const output = [];
      for( let x_pos = 0; x_pos < x; x_pos ++  ){
        for( let y_pos = 0; y_pos < y; y_pos ++  ){
          const cur_pos = (x_pos * x ) + y_pos;
          const cur_cell = gameBoard.rows[x_pos][y_pos];
          const classes = [cur_cell.letter === '' ? styles.irrelevant : styles.relevant];
          if( cur_cell.focused ){
            classes.push( styles.current );
          }
          
          output.push(
            <div key={cur_pos}
              className={classes.join(' ')}
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
    
  }, [gameBoard] );

  return(
    <Fragment>
      <button onClick={initBoard} >New Board</button>
      {board}
    </Fragment>
  )
  
}