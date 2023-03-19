import React, {useState, useEffect, Fragment, useMemo} from 'react';
import axios from "axios";
import styles from '../styles/Home.module.css';

enum Orientation {
  HORIZONTAL=1,
  VERTICAL=2
}
enum Enhancement {
  L2 = 'L2',
  L3 = 'L3',
  W2 = 'W2',
  W3 = 'W3'
};
type Cell = {
  mine: boolean;
  enhancement: Enhancement;
  letter: string;
};
type Board = {
  rows: {
    [key: number]: Cell;
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

  const [grid,setGrid] = useState<Board | undefined>(undefined);
  const [placedWords, setPlacedWords] = useState(Array<PlacedWord>)
  const [baseWords, setBaseWords] = useState([] );
  const initBoard = () => {
    const url = 'https://raw.githubusercontent.com/' +
      'mgmodell/corpora/master/data/words/common.json';
         axios.get(url )
          .then((resp) =>{
            console.log( resp );
            const words = resp.data.commonWords;
            console.log( words.length );
            setBaseWords( words );
          })
  }

  const placeWords = ()=>{
    const count = 10 + (Math.random() * 20);
    const tempWords:Array<PlacedWord> = [];
    for( let index = 0; index < count; index++ ){
      const place = Math.round( baseWords.length * Math.random() );
      tempWords.push({
        x: 1,
        y: 1,
        orientation: Orientation.HORIZONTAL,
        word: baseWords[ place ],
        place: place
      })
    }
    setPlacedWords( tempWords );
    console.log( tempWords );
    
  }
  useEffect(()=>{
    placeWords( );
  },[baseWords]);
  
  const board = useMemo( () =>{
    const output = [];
    const x = 16;
    for( let index = 0; index < x * x; index ++  ){
      output.push(
        <div key={index}>{index}</div>
      )
    }
    return(
      <div className={styles.board}>
        {output}
      </div>
    )
    
  }, [] );

  return(
    <Fragment>
      <button onClick={initBoard} >New Board</button>
      {board}
    </Fragment>
  )
  
}