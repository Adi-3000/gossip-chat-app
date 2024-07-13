import React, { useEffect, useState } from 'react'
import './chatlist.css'
import Adduser from './addUser/adduser'
import { useUserStore } from '../../../lib/Userstore'
import { doc, getDoc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { useChatStore } from '../../../lib/chatstore';

function Chatlist({hidchat}) {
    const [adduser, setadduser] = useState(false);
    const [chats, setChats] = useState([]);
    const { CurrentUser } = useUserStore();
    const { changeChat } = useChatStore();
    const[hid,sethid]=useState(false)

    useEffect(() => {
        const unsub = onSnapshot(doc(db, "Userchats", CurrentUser.id), async (res) => {
            const items = res.data().chats;
            const promises = items.map(async (item) => {
                const userdocRef = doc(db, "Users", item.receiverId);
                const userdocSnap = await getDoc(userdocRef);
                const user = userdocSnap.data();
                console.log(user)
                return { ...item, user }
            });
            const chatData = await Promise.all(promises)

            setChats(chatData.sort((a, b) => b.updatedAt - a.updatedAt));
        });
        return () => {
            unsub();
        };
    }, [CurrentUser.id])
    console.log("Current chats: ", chats);

    
    const handleSelect = async (chat) => {
        const userchats = chats.map((item) => {
            const { user, ...rest } = item;
            return rest
        });
        const chatIndex = userchats.findIndex((item) => item.chatId == chat.chatId);
        userchats[chatIndex].isSeen = true;
        const userChatRef = doc(db, "Userchats", CurrentUser.id);
        try {
            await updateDoc(userChatRef, {
                chats: userchats,
            })
            changeChat(chat.chatId, chat.user)

        } catch (error) {
            console.log(error);
        }
    }

    return (
        <div className='chatList'>
            {!hidchat&&<div className="search">
                <div className="searchBar">
                    <img src="./search.png" alt="" />
                    <input type="text" placeholder='search' />
                </div>
                <img src={adduser ? "./minus.png" : "./plus.png"} alt="" className='add' onClick={() => setadduser(!adduser)} />
            </div>}
            {hidchat&&<div className="devider"></div>}

            {chats.map((chat) => (
                <div className={hidchat?"item hid":"item"} key={chat.chatId} onClick={() => handleSelect(chat)} style={{ background: chat?.isSeen ? "transparent" : "rgb(20 80 125 / 44%)", }}>
                    <img src={chat.user.blocked.includes(CurrentUser.id)?"./avatar.png":chat.user.avatar || "./avatar.png"} alt="" />
                    {!hidchat&&<div className="text">
                        <span>{chat.user.blocked.includes(CurrentUser.id)?"user":chat.user.username}</span>
                        <p>{chat.istyping?"typing":chat.lastMessage}</p>
                    </div>}
                </div>
            ))}
            {adduser ? <Adduser setadduser={setadduser}/> : <></>}



        </div>
    )
}

export default Chatlist