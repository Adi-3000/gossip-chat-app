import React, { useEffect, useState } from 'react'
import './list.css'
import Userinfo from './userinfo/userinfo'
import Chatlist from './chatlist/chatlist'
import { useChatStore } from '../../lib/chatstore';

function List({setProfile}) {
  const { chatId} = useChatStore();
  const mql = window.matchMedia('(max-width: 600px)');
  let mobileView = mql.matches;
  const[hidchat,setHidchat]=useState(false);
  useEffect(()=>{
    !chatId?setHidchat(false):setHidchat(hidchat)

  },[chatId]);
  return (

    
    <div className='list'style={mobileView?{display:!chatId?"block":"none"}:!chatId?{}:hidchat?{maxWidth:"7%",overflow:"hidden"}:{}}>
        <Userinfo setHidchat={setHidchat} hidchat={hidchat}  setProfile={setProfile}/>
        <Chatlist hidchat={hidchat}/>
    
    </div>
  )
}

export default List