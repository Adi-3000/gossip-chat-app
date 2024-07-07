import React from 'react'
import './list.css'
import Userinfo from './userinfo/userinfo'
import Chatlist from './chatlist/chatlist'
import { useChatStore } from '../../lib/chatstore';

function List() {
  const { chatId} = useChatStore();
  const mql = window.matchMedia('(max-width: 600px)');
  let mobileView = mql.matches;
  
  return (
    
    <div className='list'style={mobileView?{display:!chatId?"block":"none"}:{}}>
        <Userinfo/>
        <Chatlist/>
    
    </div>
  )
}

export default List