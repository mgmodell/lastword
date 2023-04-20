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
      <BoardBuilder />
    </div>
  );
}
