import React, { useEffect, useRef, useState } from 'react'
import './chat.css'
import { db } from '../../lib/firebase.js'

import EmojiPicker from 'emoji-picker-react'
import { arrayUnion, doc, getDoc, onSnapshot, updateDoc } from 'firebase/firestore';
import { useChatStore } from '../../lib/chatstore.js';
import { useUserStore } from '../../lib/Userstore.js';
import upload from '../../lib/upload.js';

function Chat({ setDetails,details}) {
    const [eopen, seteopen] = useState(false);
    const [text, settext] = useState('');
    const [chat, setChat] = useState();
    const endRef = useRef(null)
    const { chatId, user, isCurrentBlocked, isReceiverBlocked,backchat } = useChatStore();
    const { CurrentUser } = useUserStore();
    const [image, setImage] = useState({
        file: null,
        url: ""
    })



    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: "smooth" });
    })
    useEffect(() => {
        const unSub = onSnapshot(doc(db, "Chats", chatId), (res) => {
            setChat(res.data())
        })
        return () => {
            unSub()
        }

    }, [chatId])
    console.log("chats??")
    console.log(chat)

    const handleEmoji = e => {
        settext(prev => prev + e.emoji);
        seteopen(false)
    }
    const handleSend = async () => {
        if (text === "") return;
        let imgurl = null;
        try {
            if (image.file) {
                imgurl = await upload(image.file)
            }
            await updateDoc(doc(db, "Chats", chatId), {
                message: arrayUnion({
                    senderId: CurrentUser.id,
                    text,
                    createdAt: new Date(),
                    ...(imgurl && { img: imgurl }),

                })
            });
            const userIds = [CurrentUser.id, user.id]
            userIds.forEach(async (id) => {
                const userChatRef = doc(db, "Userchats", id);
                const userChatSnap = await getDoc(userChatRef);
                if (userChatSnap.exists()) {
                    const userChatData = userChatSnap.data();
                    const chatIndex = userChatData.chats.findIndex(c => c.chatId == chatId)
                    userChatData.chats[chatIndex].lastMessage = text;
                    userChatData.chats[chatIndex].isSeen = id === CurrentUser.id ? true : false;
                    userChatData.chats[chatIndex].updatedAt = Date.now();
                    await updateDoc(userChatRef, {
                        chats: userChatData.chats,
                    })
                }
            })


        } catch (error) {
            console.log(error)
        }
        setImage({
            file: null,
            url: ""
        })
        settext("")

    }
    const handleImage = e => {
        if (e.target.files[0]) {

            setImage({
                file: e.target.files[0],
                url: URL.createObjectURL(e.target.files[0])

            })
        }
    }
    const mql = window.matchMedia('(max-width: 600px)');
  let mobileView = mql.matches;
    return (
        <div className='chat' style={mobileView?{display:!details?"flex":"none"}:{}} >
            <div className="top">
                <div className="user">
                <img className="close" src="./back.png" alt="" onClick={() => backchat()} />
                    <img src={user?.avatar || "./avatar.png"} alt="" onClick={() => setDetails(prev => !prev)} />
                    <div className="texts">
                        <span>{user?.username || "user illa"}</span>
                        <p>Lorem ipsum dolor sit amet.</p>
                    </div>
                </div>
                <div className="icons">
                    <img src="./phone.png" alt="" />
                    <img src="./video.png" alt="" />
                </div>
            </div>
            <div className="center">
                {chat?.message?.map((message) => (
                    <div className={message.senderId == CurrentUser.id ? "message own" : "message"} key={message?.createdAt}>
                        <div className="text">
                            {message.img && <img src={message.img} alt="" />}

                            <p>{message.text}</p>
                            <span>
                                1min ago
                            </span>
                        </div>
                    </div>
                ))}
                {image.url && <div className="message own">
                    <div className="texts">
                        <img src={image.url} alt="" />
                    </div>
                </div>}
                <div ref={endRef} style={{height:"1px"}}></div>
            </div>
            <div className="bottom">
                {isCurrentBlocked || isReceiverBlocked ? isCurrentBlocked ? <div className='blocked'>Sorry, the user is fed-up with you , you can not reply to this message anymore</div> : <div className='blocked'>you have blocked this user</div>
                    : <>

                        <div className="icons">
                            <label htmlFor="file">

                                <img src="./img.png" alt="" />
                            </label>
                            <input type="file" id='file' style={{ display: "none" }} onChange={handleImage} />
                            <img src="./camera.png" alt="" />
                            <img src="./mic.png" alt="" />
                        </div>
                        <input type="text" placeholder='type the fucking message!!' value={text} onChange={e => settext(e.target.value)} />
                        <div className="emoji">
                            <img src="./emoji.png" alt="" onClick={() => seteopen(!eopen)} />
                            <div className="picker">

                                <EmojiPicker open={eopen} onEmojiClick={handleEmoji}  theme='auto'height={350} lazyLoadEmojis={true} autoFocusSearch={false}	/>
                            </div>

                        </div>
                        <button className='sendBtn' onClick={handleSend}>send</button>
                    </>}


            </div>
        </div>
    )
}

export default Chat