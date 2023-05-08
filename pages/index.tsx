import Head from "next/head";

import { getCookie, setCookie, hasCookie } from "cookies-next";

import styles from "../styles/Home.module.css";
import BoardBuilder from "./boardBuilder";
import { useEffect, useState } from "react";

export default function Home() {
  const HELP_COOKIE = 'show-lastword-help';
  const [showHelp, setShowHelp] = useState( true );

  useEffect( () => {
    if( !hasCookie( HELP_COOKIE ) ){
      setShowHelp( true );
    } else {
      setShowHelp( Boolean( getCookie( HELP_COOKIE ) ) );
    }

  },[])
  
  const toggleHelp = () => {
    let newVal = false;
    if( hasCookie( HELP_COOKIE ) ){
      newVal = ! Boolean( getCookie( HELP_COOKIE ) );
    }
    setShowHelp( newVal );
    setCookie( HELP_COOKIE, newVal );

  };

  const helpContent = showHelp ? (
    <>
      <button onClick={toggleHelp} >Hide this help</button>
      <ol>
        <li>Click <i>bring the next challenger</i> to reveal the game board.</li>
        <li>Review the board and your tiles and play the best word to close the gap in scores and beat the challenger.</li>
        <li>When you&lsquo;re ready:
          <ol type="i">
            <li>Click the place where the word should begin.</li>
            <li>Notice the arrow pointing the direction of word placement. If you wish to change directions, click again.</li>
            <li>Type letters onto the spaces. You will be unable to place letters you do not have as tiles.</li>
            <li>If you make a mistake, press <i>ESC</i> or click another location on the board to start again.</li>
            <li>When your word is complete, press enter to have it scored.</li>
          </ol>
        </li>
      </ol>
    </>
  ) : (
    <button onClick={toggleHelp} >Click for help</button>
  )

  return (
    <div>
      <Head>
        <title>The Last Word</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <h2>The game is <del>a foot</del> afoot and there are no tiles left but what&apos;s in your hand. Can you play a word to beat your challenger?</h2>
      {helpContent}
      <BoardBuilder />
    </div>
  );
}
