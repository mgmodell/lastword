import Head from "next/head";
import styles from "../styles/Home.module.css";
import BoardBuilder from "./boardBuilder";

export default function Home() {
  return (
    <div>
      <Head>
        <title>The Last Word</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <h2>The game is a <del>a foot</del> afoot and there are no tiles left but what&apos;s in your hand. Can you play a word to beat your challenger?</h2>
      <ol>
        <li>Click <i>bring the next challenger</i> to reveal the game board.</li>
        <li>Review the board and your tiles and play the best word to close the gap in scores and beat the challenger.</li>
        <li>When you're ready:
          <ol type="i">
            <li>Click the place where the word should begin.</li>
            <li>Notice the arrow pointing the direction of word placement. If you wish to change directions, click again.</li>
            <li>Type letters onto the spaces. You will be unable to place letters you do not have as tiles.</li>
            <li>If you make a mistake, press <i>ESC</i> or click another location on the board to start again.</li>
            <li>When your word is complete, press enter to have it scored.</li>
          </ol>
        </li>
      </ol>
      <BoardBuilder />
    </div>
  );
}
