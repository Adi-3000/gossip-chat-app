import React, { useState } from 'react'
import './adduser.css'
import { arrayUnion, collection, doc, getDoc, getDocs, query, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore';
import { db } from '../../../../lib/firebase';
import { useUserStore } from '../../../../lib/Userstore';

function Adduser({setadduser}) {
  const [user,setUser]=useState(null)
  const { CurrentUser } = useUserStore();

  const handleSearch = async (e) => {
    e.preventDefault()
    const formdata = new FormData(e.target);
    const { email } = Object.fromEntries(formdata)
    try {
      const UserRef = collection(db, "Users");
      const q = query(UserRef, where("email", "==", email.toLowerCase()));
      const querysnap=await getDocs(q)
      if(!querysnap.empty){
        setUser(querysnap.docs[0].data())

      }
    } catch (error) {
      console.log(error)

    }
  }
  const handleAdd=async()=>{
    const chatRef = collection(db, "Chats");
    const userchatsRef = collection(db, "Userchats");

    try {
      const newChatRef=doc(chatRef)
      await setDoc(newChatRef,{
        createdAt:serverTimestamp(),
        message:[]
      });
      console.log(newChatRef.id)
      await updateDoc(doc(userchatsRef,user.id),{
        chats:arrayUnion({
          chatId:newChatRef.id,
          lastMessage:"",
          receiverId:CurrentUser.id,
          updatedAt:Date.now()
        })
      })
      await updateDoc(doc(userchatsRef,CurrentUser.id),{
        chats:arrayUnion({
          chatId:newChatRef.id,
          lastMessage:"",
          receiverId:user.id,
          updatedAt:Date.now()
        })
      })
    } catch (error) {
      console.log(error)
    }
    finally{
      setadduser(false)
    }
  }
  return (
    <div className='adduser'>
      <form action="" onSubmit={handleSearch}>
        <input type="text" placeholder='email' name="email" />
        <button> Search</button>

      </form>{user&&
      <div className="user">
        <div className="detail">
          <img src={user.avatar||"./avatar.png"} alt="" />
          <span>{user.username}</span>
        </div>
        <button onClick={handleAdd}>Add user</button>

      </div>}
    </div>
  )
}

export default Adduser