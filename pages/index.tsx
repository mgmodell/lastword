import Head from 'next/head'
import Image from 'next/image'
import styles from '../styles/Home.module.css'


export default function Home() {
  const board = () =>{
    const output = [];
    for(let index = 0; index < 64; index++){
      output.push(
        <div key={index}
          className={styles.current}
          onClick={()=>{
            return true;
          }}
          >
          {index}
        </div>
      )
    }
    return(
      <div className={styles.board}>
        {output}
      </div>
    )
  }
  return (
    <div >
      <Head>
        <title>Create Next App</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <h1>Hello!</h1>
        {board()}

    </div>
  )
}
