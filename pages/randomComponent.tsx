/*
This little game was built to amuse Silly Sloth, my word-game-loving sister,
on her fiftieth birthday.

The code could be improved and the comments certainly could be, too. However,
this will work well as the first beta.
*/
import React, {useEffect, Fragment, useState } from 'react';
import axios from "axios";
import styles from '../styles/Home.module.css';


type Props = {
  componentType: 'name' | 'taunt',
  watchField?: any,
  classes: string
}

export default function RandomComponent(props: Props){

  const [taunt, setTaunt] = useState( 'Thou art a Silly Sloth' );

  const fetchTaunt = ()=>{
    //Now let's get some data
    const tauntUrl = (props.componentType === 'name' ) ?
    'https://genr8rs.com/api/Content/Fun/MafiaNameGenerator?genr8rsUserId=1681049742.31146432c88e4c06e&_sT=1' :
    'https://genr8rs.com/api/Content/Fun/GameTauntGenerator?genr8rsUserId=1681049742.31146432c88e4c06e&_sInsultLevel=polite';

     //setBaseWords( ['hello', 'goodbye', 'transit', 'traffic', ] );
     axios.get(tauntUrl )
      .then((resp) =>{
        const receivedTaunt = resp.data._sResult;
        setTaunt( receivedTaunt );
      })
    
  }

  useEffect( ()=>{
    fetchTaunt( );
    
  },[props.watchField])



  return(
    <span id='taunt' className={props.classes} onClick={fetchTaunt } >
      {taunt}
    </span>
  )
  
}