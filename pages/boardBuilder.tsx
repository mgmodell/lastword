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
import { RandomName, RandomTaunt } from './api/RandomGenerators';

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
  rows: Array<Array<Cell>>;
  placedWords: Array<PlacedWord>,
  usedCells: Array<Cell>,
}

type PointMap = {
  [key: string] : {
    points: number,
    tiles: number
  }
}

export default function BoardBuilder(/*props*/){

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

  const [cumulativePoints,setCumulativePoints] = useState( 0 );
  const [challengerName, setChallengerName] = useState( 'CHALLENGER' );
  const [challengerTaunt, setChallengerTaunt] = useState( 'CHALLENGER TAUNT' );
  const [challengerScore, setChallengerScore] = useState( 0 );
  const [yourScore, setYourScore] = useState( 0 );
  const [gameBoard,setGameBoard] = useState<Board>(
    genCleanBoard( )
  );

  const [baseWords, setBaseWords] = useState([] );
  const [pointsForLetter, setPointsForLetter] = useState<PointMap>( { } );
  const [curCell, setCurCell] = useState<Cell>()

  const initBoard = () => {

    const newBoard = genCleanBoard( );

    setGameBoard( newBoard );
    if( baseWords.length > 0 ){
      const builtBoard = buildBoard( GRID_X, GRID_Y, baseWords );
      setGameBoard( builtBoard );

    }

    const boardBase = document.querySelector(`.${styles.board}`) as HTMLElement;
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
    RandomTaunt( setChallengerTaunt );

  },[gameBoard]);

  useEffect( ()=>{
    fetchWords( );
    initBoard( );
    RandomName( setChallengerName );
    
  },[]);


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
    // Identify a word to remove and then remove it
    const wordToRemove = bestCandidate( tmpBoard );
    const removedWordScore = scoreWords( wordToRemove, tmpBoard );
    const baseScore = 99 + Math.floor( Math.random( ) * 400 );
    setYourScore( baseScore );
    setChallengerScore( baseScore + removedWordScore - 1 );

    //removeWordFromBoard( wordToRemove, tmpBoard );

    return tmpBoard;

  }

  const bestCandidate = ( localBoard: Board ):PlacedWord => {
    //Which ones will actually work
    const candidates = localBoard.placedWords.filter( (candidate:PlacedWord)=>{
      const removableCells = candidate.cells.filter( (cell:Cell) =>{ return cell.words.length > 1; } );
      return removableCells.length < 7
    });

    //Select 4 and score them
    const placedWords : Array<PlacedWord> = [];
    for( let index = 0; index < 4; index++ ){
      const slot = Math.floor( Math.random() * candidates.length );
      placedWords.push( candidates[ slot ] );
      candidates.splice( slot, 1 );
    }
    //Return the candidate with the highest point value
    return placedWords.sort((a:PlacedWord, b: PlacedWord) =>{

      return scoreWords( b, localBoard ) - scoreWords( a, localBoard );

    } )[0];

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
    offset = 1;
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
    if( placedWord.word === collectedWord ){
      //console.log( placedWord, collectedWord );

    }

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

  //Search the word and all connected perpendiculars for full words (no check for actual word)
  const scoreWords = ( placedWord:PlacedWord, localGameBoard: Board ):number =>{
    let score = 0;

    const crawler = placedWord.orientation == Orientation.HORIZONTAL ? [0,1] : [1,0];
    const firstWord = placedWord.word;


    //Search behind placedWord
    let offset = 1;
    let terminated = false;
    let mainWordScore = 0;
    let mainModifier = 1;
    do{
      const backX = placedWord.x - (crawler[0] * offset );
      const backY = placedWord.y - (crawler[1] * offset );

      if( ( backX < 0 || backY < 0  || localGameBoard.rows[ backX ][backY].letter === '' ) ){
        terminated = true;
      } else {
        const prevChar = localGameBoard.rows[backX][backY];
        mainWordScore += pointsForLetter[prevChar.letter].points;
      }
      offset++;
    }while( !terminated)

    //Search behind placedWord
    offset = 1;
    terminated = false;
    do{
      const frontX = placedWord.x + (crawler[0] * offset );
      const frontY = placedWord.y + (crawler[1] * offset );

      if( ( frontX >= localGameBoard.xMax || frontY >= localGameBoard.yMax  || localGameBoard.rows[ frontX ][frontY].letter === '' ) ){
        terminated = true;
      } else {
        const nextChar = localGameBoard.rows[frontX][frontY];
        mainWordScore += pointsForLetter[nextChar.letter].points;
      }
      offset++;
    }while( !terminated)
    //console.log( 'exterior main: ', mainWordScore );


    //Cycle through the letters and check the perpendiculars
    for( let index = 0; index < firstWord.length; index ++ ){
      let localScore = 0;
      let localModifiers = 1;

      //Check behind
      offset = 1;
      terminated = false;
      let wordLength = 1;
      const anchorCell:Cell = localGameBoard.rows[placedWord.x + (index * crawler[0])][placedWord.y + (index * crawler[1])];
      switch( anchorCell.enhancement ){
        case Enhancement.L2:
          localScore += 2 * pointsForLetter[ placedWord.word.charAt( index ) ].points;
          mainWordScore += 3 * pointsForLetter[ placedWord.word.charAt( index ) ].points;
          break;
        case Enhancement.L3:
          localScore += 3 * pointsForLetter[ placedWord.word.charAt( index ) ].points;
          mainWordScore += 3 * pointsForLetter[ placedWord.word.charAt( index ) ].points;
          break;
        case Enhancement.W2:
          localModifiers *= 2;
          localScore += pointsForLetter[ placedWord.word.charAt( index ) ].points;
          mainWordScore += pointsForLetter[ placedWord.word.charAt( index ) ].points;
          break;
        case Enhancement.W3:
          localModifiers *= 3;
          localScore += pointsForLetter[ placedWord.word.charAt( index ) ].points;
          mainWordScore += pointsForLetter[ placedWord.word.charAt( index ) ].points;
          break;
        default:
          localScore += pointsForLetter[ placedWord.word.charAt( index ) ].points;
          mainWordScore += pointsForLetter[ placedWord.word.charAt( index ) ].points;
      }
      do{
        const nextX = placedWord.x -
                      (offset * crawler[1] ) +
                      (index * crawler[0] );
        const nextY = placedWord.y -
                      (offset * crawler[0] ) +
                      (index * crawler[1] );


        if( nextX >= 0 && nextY >= 0 && localGameBoard.rows[nextX][nextY].letter !== ''){
          const prevChar = localGameBoard.rows[nextX][nextY].letter;
          localScore += pointsForLetter[ prevChar ].points; 
          wordLength ++;
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
          localScore += pointsForLetter[ prevChar ].points; 
          wordLength ++;
        }else{
          terminated = true;
        }
        offset ++;
      } while( !terminated )
      //console.log( 'side word',  `${localScore} * ${localModifiers}(${wordLength})`);
      mainModifier *= localModifiers;
      if( wordLength > 1 ){
        score += ( localScore * localModifiers );
      }
      //console.log( 'score:', score );

    }
    //console.log( 'main word:', mainWordScore, mainModifier );
    score += ( mainWordScore * mainModifier );
    return score;
    
  }


  const selectCell = (event: MouseEvent):void => {
    const target = event.target as HTMLButtonElement;
    const xpos = parseInt( target.attributes.xpos.value );
    const ypos = parseInt( target.attributes.ypos.value );
    const tmpBoard = Object.assign( {}, gameBoard );
    
    if( curCell !== undefined ){
      const prevCell = Object.assign( {}, tmpBoard.rows[curCell.xPos][curCell.yPos] );
      prevCell.focused = false;
      tmpBoard.rows[curCell.xPos][curCell.yPos] = prevCell;
    }

    const newCurCell:Cell = tmpBoard.rows[xpos][ypos];
    /*
    newCurCell.words.forEach( (placedWord:PlacedWord) =>{
      console.log( placedWord.word, 'score', scoreWords( placedWord, gameBoard ) );
    })
    */
    
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
                <span className={styles.tooltip}
                  xpos={selCell.xPos}
                  ypos={selCell.yPos}
                >
                  {selCell.enhancement}
                </span>
          );

          
          output.push(
            <div key={curPos}
              className={classes.join(' ')}
              xpos={selCell.xPos}
              ypos={selCell.yPos}
              onClick={selectCell}
              >
                {selCell.letter.length > 0 ? selCell.letter : ' '} 
                {toolTip}
                <sub
                  xpos={selCell.xPos}
                  ypos={selCell.yPos}
                >
                  {selCell.letter.length > 0 ? pointsForLetter[selCell.letter]['points'] : null }
                </sub>
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
      <div className={styles.status}>Thus far you have {cumulativePoints} points.</div>
      <button onClick={initBoard} >Bring the next challenger?</button><br/>
      <div>
        {challengerName} : {challengerScore}<br/>
      </div>
      <div>
      You: {yourScore}<br/>
      </div>
      {gameBoard.rows.length > 0 ? (
        <Fragment>
          {challengerName} brings his board and roars:<br/>
          <span className={styles.taunt }>{challengerTaunt}</span><br/><br/>
          
        </Fragment> ) : null }
      {board}
    </Fragment>
  )
  
}