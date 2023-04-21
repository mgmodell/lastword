/*
This little game was built to amuse Silly Sloth, my word-game-loving sister,
on her fiftieth birthday.

The code could be improved and the comments certainly could be, too. However,
this will work well as the first beta.
*/
import React, {useState, useEffect, Fragment, useMemo, KeyboardEvent} from 'react';
import axios from "axios";
import styles from '../styles/Home.module.css';
import { RandomName, RandomTaunt } from './api/RandomGenerators';

const CHARS = 'abcdefghijklmnopqrstuvwxwz';
enum Orientation {
  HORIZONTAL=1,
  VERTICAL=2
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
      removedWord: null,
      letterSet: '',
      lettersLeft: '',

      challengerScore: 0,
      yourScore: 0,
      gameScored: false,
    });
  }

  const genNewCell = ( x: number, y: number ): Cell => {
    return( {
      xPos: x,
      yPos: y,
      mine: false,
      focused: false,
      scored: false,
      enhancement: Enhancement.NA,
      letter: '',
      words: [],
    });
  }

  const [cumulativePoints,setCumulativePoints] = useState( 0 );
  const [challengerName, setChallengerName] = useState( 'CHALLENGER' );
  const [challengerTaunt, setChallengerTaunt] = useState( 'CHALLENGER TAUNT' );
  //const [challengerScore, setChallengerScore] = useState( 0 );
  //const [yourScore, setYourScore] = useState( 0 );

  const [gameBoard,setGameBoard] = useState<Board>(
    genCleanBoard( )
  );

  const [baseWords, setBaseWords] = useState([] );
  const [pointsForLetter, setPointsForLetter] = useState<PointMap>( { } );

  const [curCell, setCurCell] = useState<Cell | null>(null)
  const [enteringRight, setEnteringRight] = useState( true );
  const [yourChars, setYourChars] = useState<Array<Cell>>( [] );

  const initBoard = () => {

    RandomName( setChallengerName )
    const newBoard = genCleanBoard( );

    setGameBoard( newBoard );
    if( baseWords.length > 0 ){
      const builtBoard = buildBoard( GRID_X, GRID_Y, baseWords.filter( (word:string) => word.length < 10 ) );
      console.log( builtBoard.lettersLeft );
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

     // pulled locally from https://github.com/benjamincrom/scrabble
     const wordsUrl = 'dictionary.json';

     axios.get(pointsUrl )
      .then((resp) =>{
        const mapping = resp.data.letters
        setPointsForLetter( mapping );
      })
     axios.get(wordsUrl )
      .then((resp) =>{
        setBaseWords( resp.data.filter( (word:string) => word.length) );

      })
    
  }

  useEffect( ()=>{
    RandomTaunt( setChallengerTaunt );

  },[gameBoard]);

  // Thanks to https://stackoverflow.com/questions/73453969/keyup-event-listeners-not-using-the-updated-states-in-react
  useEffect( () =>{
    document.addEventListener( 'keyup', keyboardInput );
    return () => document.removeEventListener( 'keyup', keyboardInput );
  }, [curCell]);

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
    const removedWordScore = removeAWord( tmpBoard );
    //Score the words
    const baseScore = 99 + Math.floor( Math.random( ) * 400 );
    tmpBoard.yourScore =  baseScore;
    tmpBoard.challengerScore = baseScore + removedWordScore - 1;

    shuffleLetters( );

    return tmpBoard;

  }

  // Packaged up this code to make it a bit more concise
  const removeAWord = ( tmpBoard: Board ):number =>{
    const localBoard = Object.assign( {}, tmpBoard );
    const wordToRemove = bestCandidate( localBoard, baseWords );
    const removedWordScore = scoreWords( wordToRemove, localBoard );
    const baseScore = 99 + Math.floor( Math.random( ) * 400 );
    //setYourScore( baseScore );
    //setChallengerScore( baseScore + removedWordScore - 1 );

    removeWordFromBoard( wordToRemove, localBoard );
    tmpBoard.lettersLeft = localBoard.lettersLeft;
    tmpBoard.letterSet = localBoard.letterSet;
    //setGameBoard( localBoard );
    return removedWordScore;

  }

  const removeWordFromBoard = ( wordToRemove:PlacedWord, localBoard: Board )=>{

    let letters = '';
    wordToRemove.cells.forEach( (cell:Cell)=>{
      if( cell.words.length > 1 ){
        cell.words.splice( cell.words.indexOf( wordToRemove ), 1 );
      } else {
        letters += cell.letter;
        cell.words = [];
        cell.letter = '';
      }
      localBoard.rows[cell.xPos][cell.yPos] = cell;
    })
    localBoard.removedWord = wordToRemove;
    while( letters.length < 9 ){
      letters += CHARS.charAt( Math.floor( CHARS.length * Math.random( ) ) );
    }
    localBoard.letterSet = letters;
    localBoard.lettersLeft = letters;
    console.log( wordToRemove, letters );
    localBoard.placedWords.splice( localBoard.placedWords.indexOf( wordToRemove ), 1 );

  }

  const shuffleLetters = ( () =>{
    const localBoard = Object.assign( {}, gameBoard );
    /*
     String to Array https://stackoverflow.com/questions/4547609/how-can-i-get-a-character-array-from-a-string
     Shuffle string of chars https://stackoverflow.com/questions/3943772/how-do-i-shuffle-the-characters-in-a-string-in-javascript
     */
    localBoard.lettersLeft = Array.from(localBoard.lettersLeft).sort( () => Math.random() -.5).join('');
    setGameBoard( localBoard );
  });

  const getUniqueCells = ( placedWord: PlacedWord ):Array<Cell> => {
    return placedWord.cells.filter( (cell:Cell) =>{
      return cell.words.length <= 1;
    })
  }

  const bestCandidate = ( localBoard: Board, validWords: Array<string> ):PlacedWord => {
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
      const aCells = a.cells.filter( (cell:Cell) => { return cell.words.length < 2});
      const bCells = b.cells.filter( (cell:Cell) => { return cell.words.length < 2});

      return scorePlacedLetters( bCells, localBoard, validWords ) - scorePlacedLetters( aCells, localBoard, validWords );

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

    //Search in front of placedWord
    offset = placedWord.word.length;
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
          const nextChar = localGameBoard.rows[nextX][nextY].letter;
          collectedWord = `${collectedWord}${nextChar}`;
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

  // Convenience method
  const scoreIt = ()=>{
    const localBoard = Object.assign( {}, gameBoard );
    const wordScore =  scorePlacedLetters( yourChars, localBoard, baseWords, true ) ;
    const delta = localBoard.yourScore - localBoard.challengerScore;
    const phraseBegin = `That earned you ${wordScore} points\n`;

    console.log( `score: ${wordScore} (delta: ${delta})`)
    console.log( `(Initially: ${localBoard.challengerScore} to your ${localBoard.yourScore})`)
    localBoard.yourScore += wordScore;
    localBoard.gameScored = true;
    setGameBoard( localBoard );

    if( delta < 0 ){
      alert( phraseBegin + `You lost.\n${challengerName} laughs at you and says: ${challengerTaunt}`);
    } else {
      alert( phraseBegin + `You won!\nAs ${challengerName} leaves the arena, they say: ${challengerTaunt}`);
      setCumulativePoints( cumulativePoints + ( localBoard.yourScore -  localBoard.challengerScore) )
    }
    RandomTaunt( setChallengerTaunt );

  }

  //Search for all the new and augmented words and score them
  const scorePlacedLetters = (placedCells:Array<Cell>, localGameBoard: Board, validWords: Array<string>, markScored: boolean = false ):number =>{
    let score = 0;
    const crawler = enteringRight ? [0,1] : [1,0];
    const firstWord = placedCells[0];

    //Check each cell
    let mainWordScore = 0;
    let mainWord = '';
    let mainModifier = 1;
    let wordList = [];
    let mainOffset = 0;
    let notMine = 0;

    //Search backwards on main word
    let terminated = false;
    let cell = firstWord;
    do{
      mainOffset ++;
      const backX = cell.xPos - (crawler[0] * mainOffset)
      const backY = cell.yPos - (crawler[1] * mainOffset)

      if( (backX < 0 || backY < 0 || localGameBoard.rows[ backX ][backY].letter === '' ) ){
        terminated = true;
      } else {
        notMine++;
        const prevChar = localGameBoard.rows[backX][backY];
        mainWordScore += pointsForLetter[prevChar.letter].points;
        mainWord = `${prevChar.letter}${mainWord}`;
        prevChar.scored = markScored;
      }
    }while( !terminated );

    //Crawl forward
    mainOffset = 0;
    terminated = false
    do{
      const frontX = firstWord.xPos + (crawler[0] * mainOffset)
      const frontY = firstWord.yPos + (crawler[1] * mainOffset)
      if( frontX < localGameBoard.xMax && frontY < localGameBoard.yMax ){
        cell =  localGameBoard.rows[frontX][frontY];
        if( cell.mine || placedCells.indexOf( cell ) >= 0 ){
          let perpWord = cell.letter;
          let perpWordScore = 0;
          let perpWordModifiers = 1;
          switch( cell.enhancement ){
            case Enhancement.L3:
              mainWordScore += ( 3 * pointsForLetter[ cell.letter ].points );
              perpWordScore += ( 3 * pointsForLetter[ cell.letter ].points );
              break;
            case Enhancement.L2:
              mainWordScore += ( 2 * pointsForLetter[ cell.letter ].points );
              perpWordScore += ( 2 * pointsForLetter[ cell.letter ].points );
              break;
            case Enhancement.W2:
              mainWordScore += pointsForLetter[ cell.letter ].points;
              perpWordScore += pointsForLetter[ cell.letter ].points;
              mainModifier *= 2;
              perpWordModifiers *= 2;
              break;
            case Enhancement.W3:
              mainWordScore += pointsForLetter[ cell.letter ].points;
              perpWordScore += pointsForLetter[ cell.letter ].points;
              mainModifier *= 3;
              perpWordModifiers *= 3;
              break;
            default:
              mainWordScore += pointsForLetter[ cell.letter ].points;
              perpWordScore += pointsForLetter[ cell.letter ].points;
          }
          // Get perpendicular word
          // Check behind
          let perpOffset = 1;
          let perpTerminated = false;
          do{
            const nextX = cell.xPos - ( perpOffset * crawler[1] );
            const nextY = cell.yPos - ( perpOffset * crawler[0] );
            if( nextX >= 0 && nextY >= 0 && localGameBoard.rows[nextX][nextY].letter !== '' ){
              const prevChar = localGameBoard.rows[nextX][nextY].letter;
              perpWord = `${prevChar}${perpWord}`
              perpWordScore += pointsForLetter[ prevChar ].points;
            } else{
              perpTerminated = true;
            }
            perpOffset++;
          }while( !perpTerminated )

          //Check forward
          perpOffset = 1;
          perpTerminated = false;
          do{
            const nextX = cell.xPos + ( perpOffset * crawler[1] );
            const nextY = cell.yPos + ( perpOffset * crawler[0] );
            if( nextX < localGameBoard.xMax && nextY < localGameBoard.yMax && localGameBoard.rows[nextX][nextY].letter !== '' ){
              const nextChar = localGameBoard.rows[nextX][nextY].letter;
              perpWord = `${perpWord}${nextChar}`;
              perpWordScore += pointsForLetter[ nextChar ].points;
            } else {
              perpTerminated = true;
            }
            perpOffset++;
          } while( !perpTerminated )

          if( perpWord.length > 1 ){
            wordList.push( perpWord );
            score += perpWordScore;
          }

        } else if( cell.letter !== '' ) {
          notMine++;
          mainWordScore += pointsForLetter[cell.letter].points;
        } else {
          terminated = true;
        }
      } else {
        terminated = true;
      }
      //Add current letter
      if( !terminated ) {
        localGameBoard.rows[frontX][frontY] = Object.assign({}, cell);
        cell.scored = markScored;
        mainWord = `${mainWord}${cell.letter}`;
      }

      mainOffset++;
    }while( !terminated )
    
    setGameBoard( localGameBoard );
    if( mainWord.length > 1 ){
      wordList.push( mainWord );
    }
    score += mainWordScore * mainModifier;
    const valid = wordList.reduce( (result, word) => {
      return result && validWords.includes( word );
    }, true );

    console.log( valid, wordList, notMine, score );

    return  valid && ( wordList.length > 0 ) &&( notMine >= 1 ) ? score : 0;
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
      mainModifier *= localModifiers;
      if( wordLength > 1 ){
        score += ( localScore * localModifiers );
      }

    }
    score += ( mainWordScore * mainModifier );
    return score;
    
  }

  //Let's handle the keyboard input
  const keyboardInput = (event_in: any) => {
    const event = event_in as KeyboardEvent;

    console.log( event_in );
    
    if( !gameBoard.gameScored ){
      const tmpBoard = Object.assign( {}, gameBoard );
      const outputCell : Cell = Object.assign( {}, curCell );

      //Capture the backspace and simply cancel the current word
      //Maybe improve this with delete previous character later
      if( event.key.length === 1 && tmpBoard.lettersLeft.match( event.key ) && outputCell !== null && outputCell.focused ){
        const crawler = enteringRight ? [0,1] : [1,0];
        console.log( 'happening', event.key );
        outputCell.letter = event.key;
        tmpBoard.lettersLeft = tmpBoard.lettersLeft.replace( event.key, '' );
        outputCell.mine = true;
        tmpBoard.rows[outputCell.xPos][outputCell.yPos] = outputCell;
        const tmpYourChars = [...yourChars];
        tmpYourChars.push( outputCell );

        let nextDetermined = false;
        let index = 1;
        do{
          const nextX = outputCell.xPos + ( index * crawler[0] );
          const nextY = outputCell.yPos + ( index * crawler[1] );
          if( nextX < tmpBoard.xMax && nextY < tmpBoard.yMax ){

            const nextCell = tmpBoard.rows[nextX][nextY];
            if( nextCell.letter === '' ){
              outputCell.focused = false;
              nextCell.focused = true;
              nextDetermined = true;
              setCurCell( nextCell );
            }
            index ++;
          } else {
            outputCell.focused = false;
            setCurCell( null );
            nextDetermined = true;
          }
        } while ( !nextDetermined );


        setYourChars( tmpYourChars );
        setGameBoard( tmpBoard );
      } else if( yourChars.length > 0 ){
        if( [ 'Enter' ].indexOf( event.key ) >= 0 ){
          scoreIt( );
        } else if ( ['Backspace','Escape'].indexOf( event.key ) >= 0 ){
          cancelCurrentWord( );
        }

      }
    }
  }

  //Cancel the word the player is creating.
  const cancelCurrentWord = () =>{
    const tmpBoard = Object.assign( {}, gameBoard );
    yourChars.forEach( (cell:Cell )=>{
      tmpBoard.rows[cell.xPos][cell.yPos].mine = false;
      tmpBoard.rows[cell.xPos][cell.yPos].letter = '';
    });
    setYourChars( [] );
    tmpBoard.lettersLeft = tmpBoard.letterSet;
    setGameBoard( tmpBoard );
  }

  const selectCell = (event_in: any):void => {
    const event = event_in as MouseEvent;

    if( event !== null && !gameBoard.gameScored ){
      const target = event.target as HTMLElement;
      const xDat = target.attributes.getNamedItem( 'data-xpos' )?.value;
      const yDat = target.attributes.getNamedItem( 'data-ypos' )?.value;
      if( xDat !== null && yDat !== null ){
        const xpos = parseInt( xDat as string );
        const ypos = parseInt( yDat as string );
        const tmpBoard = Object.assign( {}, gameBoard );
    
        if( yourChars.length >= 1 ){
          cancelCurrentWord( );
        }
        if( curCell !== null ){
          const prevCell = Object.assign( {}, tmpBoard.rows[curCell.xPos][curCell.yPos] );
          prevCell.focused = false;
          tmpBoard.rows[curCell.xPos][curCell.yPos] = prevCell;
        }

        const newCurCell:Cell = tmpBoard.rows[xpos][ypos];
        if( newCurCell.letter === '' ){
          newCurCell.focused = true;
          setCurCell( newCurCell );

          if( newCurCell.xPos !== curCell?.xPos || newCurCell.yPos !== curCell.yPos ){
            setEnteringRight( true );
          } else {
            setEnteringRight( !enteringRight );
          }
    
        } else {

          //newCurCell.focused = true;
        }
        setGameBoard( tmpBoard );
      }

    }
    
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
          if( selCell.mine ){
            classes.push( styles.mine );
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
          if( selCell.scored ){
            classes.push( styles.scored );
          }

          if( selCell.focused ){
            if( enteringRight ){
              classes.push( styles.arrowRight );
            } else {
              classes.push( styles.arrowDown );
            }

          }
          const toolTip = selCell.enhancement === Enhancement.NA ? null :
          (
                <span className={styles.tooltip}
                  data-xpos={selCell.xPos}
                  data-ypos={selCell.yPos}
                >
                  {selCell.enhancement}
                </span>
          );

          
          output.push(
            <div key={curPos}
              className={classes.join(' ')}
              data-xpos={selCell.xPos}
              data-ypos={selCell.yPos}
              onClick={selectCell}
              >
                <span
                  data-xpos={selCell.xPos}
                  data-ypos={selCell.yPos}
                >
                  {selCell.letter.length > 0 ? selCell.letter : ' '} 
                </span>
                <sub
                  data-xpos={selCell.xPos}
                  data-ypos={selCell.yPos}
                >
                  {selCell.letter.length > 0 ? pointsForLetter[selCell.letter]['points'] : null }
                </sub>
                {toolTip}
                <span className={styles.arrow}
                  data-xpos={selCell.xPos}
                  data-ypos={selCell.yPos}
                ></span>
              </div>
          )
        }
      }
      return(
          <div className={styles.board}
            >
            {output}
          </div>
      )
      
    }
    
  }, [gameBoard,enteringRight] );

  return(
    <Fragment>
      <div className={styles.status}>Thus far you have {cumulativePoints} points.</div>
      <button onClick={initBoard} >Bring the next challenger?</button><br/>
      {gameBoard.rows.length > 0 ? (
        <Fragment>
        <button disabled={ gameBoard.gameScored || yourChars.length < 1} onClick={scoreIt} >Score it!</button>
        <div>
          {challengerName} : { gameBoard.challengerScore}<br/>
        </div>
        <div>
        You: { gameBoard.yourScore}&nbsp; <button onClick={shuffleLetters}>Shuffle</button> your letters: {gameBoard.lettersLeft} <br/>
        </div>
          
        </Fragment> ) : null }
      {board}
    </Fragment>
  )
  
}