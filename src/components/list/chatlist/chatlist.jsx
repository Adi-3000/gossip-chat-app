import React, { useEffect, useState } from 'react'
import './chatlist.css'
import Adduser from './addUser/adduser'
import { useUserStore } from '../../../lib/Userstore'
import { doc, getDoc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { useChatStore } from '../../../lib/chatstore';

function Chatlist({ hidchat }) {
    const [adduser, setadduser] = useState(false);
    const [chats, setChats] = useState([]);
    const { CurrentUser } = useUserStore();
    const { changeChat,setcall,callid,status,caller} = useChatStore();

    useEffect(() => {
        const unsub = onSnapshot(doc(db, "Userchats", CurrentUser.id), async (res) => {
            const items = res.data().chats;
            const promises = items.map(async (item) => {
                const userdocRef = doc(db, "Users", item.receiverId);
                const userdocSnap = await getDoc(userdocRef);
                const user = userdocSnap.data();
                console.log(user)
                if(item.callid)
                    setcall(item.callid,item.caller,null,item.callmode)
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

    const handlepick=(cid,caller)=>{
        setcall(cid,caller,true)
        console.log(cid)
        
    }

    return (
        <div className='chatList'>
            {!hidchat && <div className="search">
                <div className="searchBar">
                    <img src="./search.png" alt="" />
                    <input type="text" placeholder='search' />
                </div>
                <img src={adduser ? "./minus.png" : "./plus.png"} alt="" className='add' onClick={() => setadduser(!adduser)} />
            </div>}
            {hidchat && <div className="devider"></div>}

            {chats.map((chat) => (
                <div className={hidchat ? "item hid" : "item"} key={chat.chatId} onClick={() => handleSelect(chat)} style={{ background: chat?.isSeen ? "transparent" : "rgb(20 80 125 / 44%)", }}>
                    <img src={chat.user.blocked.includes(CurrentUser.id) ? "./avatar.png" : chat.user.avatar || "./avatar.png"} alt="" />
                    {!hidchat && <div className="text">
                        <span>{chat.user.blocked.includes(CurrentUser.id) ? "user" : chat.user.username}</span>
                        {!chat.callid && <p>{chat.istyping ? "typing" : chat.lastMessage}</p>}
                        {callid&&caller != CurrentUser.id&&caller==chat.receiverId&&status==null&& <div className='call-noti'>
                            
                                <div className="name">
                                    <p className="p2">Incoming Call</p>
                                </div>
                                <div className="caller">
                                    <span id="pick" onClick={()=>{handleSelect(chat);handlepick(chat.callid,chat.caller)}} className="callerBtn">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-telephone-fill" viewBox="0 0 16 16">
                                            <path fillRule="evenodd" d="M1.885.511a1.745 1.745 0 0 1 2.61.163L6.29 2.98c.329.423.445.974.315 1.494l-.547 2.19a.678.678 0 0 0 .178.643l2.457 2.457a.678.678 0 0 0 .644.178l2.189-.547a1.745 1.745 0 0 1 1.494.315l2.306 1.794c.829.645.905 1.87.163 2.611l-1.034 1.034c-.74.74-1.846 1.065-2.877.702a18.634 18.634 0 0 1-7.01-4.42 18.634 18.634 0 0 1-4.42-7.009c-.362-1.03-.037-2.137.703-2.877L1.885.511z"></path>
                                        </svg>
                                    </span>
                                    <span id="end" className="callerBtn">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-telephone-fill" viewBox="0 0 16 16">
                                            <path fillRule="evenodd" d="M1.885.511a1.745 1.745 0 0 1 2.61.163L6.29 2.98c.329.423.445.974.315 1.494l-.547 2.19a.678.678 0 0 0 .178.643l2.457 2.457a.678.678 0 0 0 .644.178l2.189-.547a1.745 1.745 0 0 1 1.494.315l2.306 1.794c.829.645.905 1.87.163 2.611l-1.034 1.034c-.74.74-1.846 1.065-2.877.702a18.634 18.634 0 0 1-7.01-4.42 18.634 18.634 0 0 1-4.42-7.009c-.362-1.03-.037-2.137.703-2.877L1.885.511z"></path>
                                        </svg>
                                    </span>
                                    </div>
                            

                        </div>}
                    </div>}
                </div>
            ))}
            {adduser ? <Adduser setadduser={setadduser} /> : <></>}



        </div>
    )
}

export default Chatlist