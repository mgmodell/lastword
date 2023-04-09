/*
This little game was built to amuse Silly Sloth, my word-game-loving sister,
on her fiftieth birthday.

The code could be improved and the comments certainly could be, too. However,
this will work well as the first beta.
*/
import React, {useState, useEffect, Fragment, useMemo} from 'react';
import axios from "axios";
import styles from '../styles/Home.module.css';
import RandomComponent from './randomComponent';

enum Orientation {
  HORIZONTAL=1,
  VERTICAL=2
}
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
  const GRID_Y = GRID_SIZE;

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
  const [pointsForLetter, setPointsForLetter] = useState( {} );
  const [curCell, setCurCell] = useState<Cell>()

  const initBoard = () => {

    const newBoard = genCleanBoard( );

    setGameBoard( newBoard );
    if( baseWords.length > 0 ){
      const builtBoard = buildBoard( GRID_X, GRID_Y, baseWords );
      setGameBoard( builtBoard );

    }

    const boardBase = document.querySelector(`.${styles.board}`);
    boardBase?.style.setProperty( 
      'grid-template-columns',
      `repeat( ${GRID_Y} , 1fr )`
    );
  }
  const fetchWords = ()=>{
    //Now let's get some data
    const pointsUrl = 'https://raw.githubusercontent.com/' +
      'mgmodell/corpora/master/data/games/scrabble.json';
    const wordsUrl = 'https://raw.githubusercontent.com/' +
      'mgmodell/corpora/master/data/words/common.json';

     //setBaseWords( ['hello', 'goodbye', 'transit', 'traffic', ] );
     axios.get(pointsUrl )
      .then((resp) =>{
        const mapping = resp.data.letters
        setPointsForLetter( mapping );
      })
     axios.get(wordsUrl )
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


  const buildBoard = ( xMax: number, yMax: number, words: Array<string> ): Board=>{
    const boardGrid: Array<Array<Cell>> = [];

    for( let x_pos = 0; x_pos < xMax; x_pos ++  ){
      boardGrid.push( [] );
      for( let y_pos = 0; y_pos < yMax; y_pos ++  ){
        const nextCell: Cell = genNewCell( x_pos, y_pos );
        const enhancementGen = Math.floor( 100 * Math.random( ) );
        if( enhancementGen > 90 ){
          switch ( enhancementGen ) {
            case 92:
            case 96:
              nextCell.enhancement = Enhancement.L3;
              break;
            case 93:
            case 97:
            case 98:
              nextCell.enhancement = Enhancement.W2;
              break;
            case 94:
              nextCell.enhancement = Enhancement.W3;
              break;
            default:
              nextCell.enhancement = Enhancement.L2;
              break;

          }

        }

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

    for(let wordCount = 1; wordCount < 750; wordCount++ ){
      nextWord = getWord( words );
      if( findPlacementFor( nextWord, tmpBoard ) && isValidPlacement( nextWord, tmpBoard, words ) ){
        lockPlacement( nextWord, tmpBoard );
      }

    }


    return tmpBoard;

  }

  const getWord = ( words: Array<string> ):PlacedWord=>{
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
      //Don't check that one again
      candidateCells.splice( cellIndex, 1);
    }while( candidateCells.length > 0 && !found )
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
    localGameBoard.usedCells = [...localGameBoard.usedCells, ...placedWord.cells];

  }

  const isValidPlacement = ( placedWord:PlacedWord, localGameBoard: Board, validWords: Array<string> ):boolean =>{
    let valid = false;
    const crawler = placedWord.orientation == Orientation.HORIZONTAL ? [0,1] : [1,0];
    const wordLen = placedWord.word.length;
    //Check boundaries
    if( placedWord.x >= 0 && placedWord.y >= 0 &&
        placedWord.x + (crawler[0] * wordLen ) <= localGameBoard.xMax  &&
        placedWord.y + (crawler[1] * wordLen ) <= localGameBoard.yMax 
      ){
      //Check that no cells must change
      for( let index = 0; index < wordLen; index++ ){
        const nextCell: Cell = localGameBoard.rows[ placedWord.x + (crawler[0] * index )]
                                                  [ placedWord.y + (crawler[1] * index) ];
        if( nextCell.letter !== '' && nextCell.letter !== placedWord.word.charAt( index )){
          return valid;
        }
      }
      const allConnectedWords = getAllWords( placedWord, localGameBoard );
      //console.log( 'points:', pointsFor( placedWord, localGameBoard));
      if( allConnectedWords.length > 0 ){
        
        valid = allConnectedWords.reduce( (result, word) => {
          return result && validWords.includes( word );

        }, true);
      }
    }
    return valid;
  }



  //Search the word and all connected perpendiculars for full words (no check for actual word)
  const getAllWords = ( placedWord:PlacedWord, localGameBoard: Board ):Array<string> =>{
    const foundWords = [ ];
    const crawler = placedWord.orientation == Orientation.HORIZONTAL ? [0,1] : [1,0];
    const firstWord = placedWord.word;


    //Search behind placedWord
    let offset = 1;
    let terminated = false;
    let collectedWord = placedWord.word;
    do{
      const backX = placedWord.x - (crawler[0] * offset );
      const backY = placedWord.y - (crawler[1] * offset );

      if( ( backX < 0 || backY < 0  || localGameBoard.rows[ backX ][backY].letter === '' ) ){
        terminated = true;
      } else {
        const prevChar = localGameBoard.rows[backX][backY].letter;
        collectedWord = `${prevChar}${collectedWord}`;
      }
      offset++;
    }while( !terminated)

    //Search behind placedWord
    offset = 2;
    terminated = false;
    do{
      const frontX = placedWord.x + (crawler[0] * offset );
      const frontY = placedWord.y + (crawler[1] * offset );

      if( ( frontX >= localGameBoard.xMax || frontY >= localGameBoard.yMax  || localGameBoard.rows[ frontX ][frontY].letter === '' ) ){
        terminated = true;
      } else {
        const nextChar = localGameBoard.rows[frontX][frontY].letter;
        collectedWord = `${collectedWord}${nextChar}`;
      }
      offset++;
    }while( !terminated)

    foundWords.push( collectedWord );

    //Cycle through the letters and check the perpendiculars
    for( let index = 0; index < firstWord.length; index ++ ){
      let collectedWord = placedWord.word.charAt( index );
      //Check behind
      offset = 1;
      terminated = false;
      do{
        const nextX = placedWord.x -
                      (offset * crawler[1] ) +
                      (index * crawler[0] );
        const nextY = placedWord.y -
                      (offset * crawler[0] ) +
                      (index * crawler[1] );


        if( nextX >= 0 && nextY >= 0 && localGameBoard.rows[nextX][nextY].letter !== ''){
          const prevChar = localGameBoard.rows[nextX][nextY].letter;
          collectedWord = `${prevChar}${collectedWord}`;
        }else{
          terminated = true;
        }
        offset ++;
      } while( !terminated )

      //Check forward
      offset = 1;
      terminated = false;
      do{
        const nextX = placedWord.x +
                      (offset * crawler[1] ) +
                      (index * crawler[0] );
        const nextY = placedWord.y +
                      (offset * crawler[0] ) +
                      (index * crawler[1] );

        if( nextX < localGameBoard.xMax && nextY < localGameBoard.yMax && localGameBoard.rows[nextX][nextY].letter !== ''){
          const prevChar = localGameBoard.rows[nextX][nextY].letter;
          collectedWord = `${collectedWord}${prevChar}`;
        }else{
          terminated = true;
        }
        offset ++;
      } while( !terminated )
      if( collectedWord.length > 1 ){
        foundWords.push( collectedWord );
      }

    }

    return foundWords;
    
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

          switch( selCell.enhancement ){
            case Enhancement.L2:
              classes.push( styles.doubleLetter );
              break;
            case Enhancement.L3:
              classes.push( styles.tripleLetter );
              break;
            case Enhancement.W2:
              classes.push( styles.doubleWord );
              break;
            case Enhancement.W3:
              classes.push( styles.tripleWord );
              break;
            default:
              classes.push ( styles.noTip );
          }
          const toolTip = selCell.enhancement === Enhancement.NA ? null :
          (
                <span className={styles.tooltip}>{selCell.enhancement}</span>
          );

          
          output.push(
            <div key={curPos}
              className={classes.join(' ')}
              xpos={xPos}
              ypos={yPos}
              onClick={selectCell}
              >
                {selCell.letter.length > 0 ? selCell.letter : ' '} 
                {toolTip}
              </div>
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
      <button onClick={initBoard} >Bring the next challenger?</button><br/>
      {gameBoard.rows.length > 0 ? (
        <Fragment>
          <RandomComponent componentType='name' watchField={gameBoard } classes={styles.challengerName} /> brings his board and roars:<br/>
          <RandomComponent componentType='taunt' watchField={gameBoard} classes={styles.taunt}/><br/><br/>
        </Fragment> ) : null }
      {board}
    </Fragment>
  )
  
}