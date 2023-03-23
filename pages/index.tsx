import Head from 'next/head'
import Image from 'next/image'
import styles from '../styles/Home.module.css'
import BoardBuilder from './boardBuilder';


export default function Home() {
  return (
    <div >
      <Head>
        <title>Create Next App</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <h1>Hello!</h1>
        <BoardBuilder />

    </div>
  )
}
