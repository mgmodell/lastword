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
      <h2>The game is a <del>a foot</del> afoot and there are no tiles left but what&apos;s in your hand. Can you beat your challenger?</h2>
      <BoardBuilder />
    </div>
  );
}
