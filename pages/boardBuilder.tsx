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
  words: Array<PlacedWord>;
};
type PlacedWord = {
  x: number;
  y: number;
  orientation: Orientation;
  word: String;
  place: number;
  cells: Array<Cell>;
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
  //Height
  const GRID_X = GRID_SIZE;
  //Width
  const GRID_Y = GRID_SIZE - 2;

  const genCleanBoard = (): Board =>{
    return( {
      xMax: 0,
      yMax: 0,
      rows: [],
      placedWords: [],
      usedCells: [],
    });
  }

  const genNewCell = ( x: number, y: number ): Cell => {
    return( {
      xPos: x,
      yPos: y,
      mine: false,
      focused: false,
      enhancement: Enhancement.NA,
      letter: '',
      words: [],
    });
  }

  const [gameBoard,setGameBoard] = useState<Board>(
    genCleanBoard( )
  );

  const [baseWords, setBaseWords] = useState([] );
  const [curCell, setCurCell] = useState<Cell>()

  const initBoard = () => {

    const newBoard = genCleanBoard( );

    const tmpGrid = [];

    for( let x_pos = 0; x_pos < gameBoard.xMax; x_pos ++  ){
      tmpGrid.push( [] );
      for( let y_pos = 0; y_pos < gameBoard.yMax; y_pos ++  ){
        const nextCell:Cell = genNewCell( x_pos, y_pos );
        tmpGrid[x_pos].push( nextCell );

      }
    }

    newBoard.rows = tmpGrid;

    setGameBoard( newBoard );
    if( baseWords.length > 0 ){
      const builtBoard = buildBoard( GRID_X, GRID_Y, baseWords );
      setGameBoard( builtBoard );
      //placeWords( );

    }

    const boardBase = document.querySelector(`.${styles.board}`);
    boardBase?.style.setProperty( 
      'grid-template-columns',
      `repeat( ${GRID_Y} , 1fr )`
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
        const nextCell: Cell = genNewCell( x_pos, y_pos );

        boardGrid[x_pos].push(
          nextCell
        ) 
      }
    }
    const tmpBoard: Board = genCleanBoard()
    tmpBoard.xMax = xMax;
    tmpBoard.yMax = yMax;
    tmpBoard.rows = boardGrid;

    //build 
    //Select and place first word
    let nextWord = getWord( words );
    nextWord.y = Math.floor( tmpBoard.yMax / 2 );
    nextWord.x = Math.floor( tmpBoard.xMax / 2 );
    //The following method mutates the input board
    lockPlacement( nextWord, tmpBoard );

    //Slot, validate and then lock subsequent word(s)
    nextWord = getWord( words );
    if( findPlacementFor( nextWord, tmpBoard ) /* && isValidPlacement( nextWord, tmpBoard ) */ ){
      lockPlacement( nextWord, tmpBoard );
    }


    return tmpBoard;

  }

  const getWord = ( words: Array<String> ):PlacedWord=>{
    const orientation = Math.floor( Math.random( ) * 2 )  === 1 ? Orientation.HORIZONTAL : Orientation.VERTICAL;
    const place = Math.floor( Math.random( ) * words.length)

    return ({
      x: -1,
      y: -1,
      orientation: orientation,
      word: words[ place ],
      place: place,
      cells: [],
    })

  }

  const findPlacementFor = ( unPlacedWord: PlacedWord, localGameBoard: Board ):boolean =>{
    const candidateCells = localGameBoard.usedCells.filter( (cell:Cell)=>{
      return cell.words.length < 2;
    })
    let candidateCount = 0;
    let found = false;
    do{
      candidateCount ++;
      const cellIndex = Math.floor( Math.random() * candidateCells.length );
      const anchorCell: Cell = candidateCells[ cellIndex ];
      const cellFoundAt = unPlacedWord.word.indexOf( anchorCell.letter );
      if( cellFoundAt >= 0 ){
        const anchorCell = candidateCells[cellFoundAt];
        console.log( anchorCell );
        found = true;
        if( anchorCell.words[0].orientation === Orientation.HORIZONTAL ){
          unPlacedWord.orientation = Orientation.VERTICAL;
          unPlacedWord.y = anchorCell.yPos;
          unPlacedWord.x = anchorCell.xPos - cellFoundAt;
        } else {
          unPlacedWord.orientation = Orientation.HORIZONTAL;
          unPlacedWord.x = anchorCell.xPos;
          unPlacedWord.y = anchorCell.yPos - cellFoundAt;

        }
      }
    }while( candidateCount < 4 && !found )
    console.log( found, unPlacedWord );
    return found;
  }

  const lockPlacement = ( placedWord: PlacedWord, localGameBoard: Board ) => {

    const crawler = placedWord.orientation == Orientation.HORIZONTAL ? [0,1] : [1,0];
    for( let index = 0; index < placedWord.word.length; index++ ){
      //Set the cells, store them in the board and the PlacedWord
      const nextX = placedWord.x + ( crawler[0] * index );
      const nextY = placedWord.y + ( crawler[1] * index );
      const nextCell = localGameBoard.rows[nextX][nextY]
      nextCell.letter = placedWord.word.charAt( index );
      nextCell.words.push( placedWord );
      placedWord.cells.push( nextCell );
    }
    localGameBoard.placedWords.push( placedWord );
    localGameBoard.usedCells = [...localGameBoard.usedCells, ...placedWord.cells];//.concat( placedWord.cells );

  }

  const isValidPlacement = ( placedWord:PlacedWord, localGameBoard: Board ) =>{
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
    curX = GRID_X + 1;
    curY = GRID_Y + 1;
    let word = '';
    //Collect forwards
    do {
      curX = startX + (index * crawler[0]);
      curY = startY + (index * crawler[1]);
      if( curX >= 0 && curY >= 0 && 
          curX < GRID_X && curY < GRID_Y){
        wordCells.push(gameBoard[ curX][curY] );
        if( gameBoard[curX][curY].letter === '' ){
          word += baseWord.charAt( index );
        } else {
          word += gameBoard[curX][curY].letter;
        }
        index++;

      }

    } while (curX < (GRID_X -1) &&
             curY < (GRID_Y -1) &&
             ( gameBoard.rows[curX][curY].letter !== '' ||
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
    const tmpBoard = Object.assign( {}, gameBoard );
    
    if( curCell != undefined ){
      const prevCell = Object.assign({}, curCell);
      prevCell.focused = false;
      tmpBoard.rows[prevCell.xPos][prevCell.yPos] = prevCell;
    }
    
    const newCurCell:Cell = tmpBoard.rows[xPos][yPos];
    
    newCurCell.focused = true;
    setGameBoard( tmpBoard );
    setCurCell( newCurCell );
    
  }

  const selectWords = useMemo( () =>{
    return baseWords.filter( (word) => /[xzqwvkgfyb]/.test( word ) )
  }, [baseWords])
  
  const board = useMemo( () =>{
    
    if( gameBoard.rows.length < GRID_X ){
      return (
        <div className={styles.board}></div>
      );
    } else {
      const output = [];
      for( let xPos = 0; xPos < GRID_X; xPos ++  ){
        for( let yPos = 0; yPos < GRID_Y; yPos ++  ){

          const curPos = (xPos * GRID_X ) + yPos;
          const selCell = gameBoard.rows[xPos][yPos];
          const classes = [selCell.letter === '' ? styles.irrelevant : styles.relevant];
          if( selCell.focused ){
            classes.push( styles.current );
          }
          
          output.push(
            <div key={curPos}
              className={classes.join(' ')}
              xpos={xPos}
              ypos={yPos}
              onClick={selectCell}
              >{selCell.letter.length > 0 ? selCell.letter : '-'}</div>
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