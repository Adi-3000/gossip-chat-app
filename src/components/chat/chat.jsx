import React, { useEffect, useRef, useState } from 'react'
import './chat.css'
import { db } from '../../lib/firebase.js'
import Typing from '../typing/typing.jsx'
import EmojiPicker from 'emoji-picker-react'
import { arrayUnion, doc, getDoc, onSnapshot, updateDoc } from 'firebase/firestore';
import { useChatStore } from '../../lib/chatstore.js';
import { useUserStore } from '../../lib/Userstore.js';
import upload from '../../lib/upload.js';

function Chat({ setDetails, details }) {
    const [eopen, seteopen] = useState(false);
    const [text, settext] = useState('');
    const [chat, setChat] = useState();
    const endRef = useRef(null)
    const { chatId, user, isCurrentBlocked, isReceiverBlocked, backchat, setchats } = useChatStore();
    const { CurrentUser } = useUserStore();
    const [image, setImage] = useState({
        file: [],
        url: []
    })
    const [typing, setTyping] = useState(false)
    const [usertyping, setUsertyping] = useState(false)
    const [seen, setSeen] = useState(false)


    //for scrolling to view
    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    })
    //for loading chat
    useEffect(() => {

        const unSub = onSnapshot(doc(db, "Chats", chatId), async (res) => {
            await setChat(res.data().message)
        })

        return () => {
            unSub()
        }

    }, [chatId])
    //for checking typing status
    useEffect(() => {

            const unSub = onSnapshot(doc(db, "Userchats", CurrentUser.id), async (res) => {
                if (res.exists()) {
                    const userChatData = res.data();
                    const chatIndex = userChatData.chats.findIndex(c => c.chatId == chatId)
                    setUsertyping(userChatData.chats[chatIndex].istyping)
                }
            })
            return () => {
                unSub()
    
            }
        

        

    }, [chatId])
    //for checking seen status

    useEffect(() => {
        if(user){

        const unSub = onSnapshot(doc(db, "Userchats", user.id), async (res) => {
            if (res.exists()) {
                const userChatData = res.data();
                const chatIndex = userChatData.chats.findIndex(c => c.chatId == chatId)
                setSeen(userChatData.chats[chatIndex].isSeen)
            }
        })
        return () => {
            unSub()
        }
    }

    }, [chatId])

console.log("seen status"+seen)
    const handleEmoji = e => {
        settext(prev => prev + e.emoji);
        seteopen(false)
    }

    const handleSend = async () => {
        if (text === "" & Object.keys(image.file).length == 0) return;

        try {

            const imgurl = await Promise.all(
                image.file.map(async (file) => {
                    const product = await upload(file);
                    return { product };
                })
            )


            await updateDoc(doc(db, "Chats", chatId), {
                message: arrayUnion({
                    senderId: CurrentUser.id,
                    text,
                    createdAt: new Date(),
                    ...(imgurl.length != 0 && { img: imgurl }),

                })
            });
            const userIds = [CurrentUser.id, user.id]
            await userIds.forEach(async (id) => {
                const userChatRef = doc(db, "Userchats", id);
                const userChatSnap = await getDoc(userChatRef);
                
                if (userChatSnap.exists()) {
                    const userChatData = userChatSnap.data();
                    const chatIndex = userChatData.chats.findIndex(c => c.chatId == chatId)
                    userChatData.chats[chatIndex].lastMessage = text;
                    userChatData.chats[chatIndex].isSeen = id === CurrentUser.id ? true : false;
                    userChatData.chats[chatIndex].istyping =  false;

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
            file: [],
            url: []
        })
        settext("")

    }
    const handleImage = async (e) => {
        if (e.target.files[0]) {
            let temp = []
            temp = await [...e.target.files]

            let tempurl = []
            temp.map((file) => {
                tempurl = [...tempurl, URL.createObjectURL(file)]
            })


            setImage({
                file: [...image.file, ...e.target.files],
                url: [...image.url
                    , ...tempurl]

            })
        }

    }

    function parsetime(seconds, nanoseconds) {
        const milliseconds = seconds * 1000;
        const date = new Date(milliseconds);
        // Add nanoseconds (converted to milliseconds)
        date.setMilliseconds(date.getMilliseconds() + nanoseconds / 1000000);
        let livedate = new Date(Date.now() - date)



        // Format the date and time
        // const readableDate = date.toISOString().replace('T', ' ').replace('Z', '');
        const readablehour = date.getHours();
        const readablemin = date.getMinutes();
        // console.log(date.getDate() + ":" + readablehour + ":" + readablemin)
        // console.log("difference" + livedate.getDate() + ":" + livedate.getUTCHours() + ":" + livedate.getUTCMinutes())
        if (livedate.getDate() > 1) {
            return `${date.getDate()}/${date.getMonth() + 1}-${readablehour}:${readablemin}`
        }
        else {
            if (livedate.getUTCHours() > 0)
                return `${livedate.getUTCHours()}:${livedate.getUTCMinutes()} hours ago`
            else
                return `${livedate.getUTCMinutes()} min ago`

        }
    }
    async function handlecloseimg(index) {


        await image.url.splice(index, 1)
        await image.file.splice(index, 1)
        await setImage({
            file: [...image.file],
            url: [...image.url]
        })

    }
    const[userChatData,setuserChatData]=useState()
    const handleinput = async (e) => {
        settext(e.target.value)
        const userChatRef = await doc(db, "Userchats", user.id);
        // const userChatSnap = await getDoc(userChatRef);
        let chatIndex
        await onSnapshot(userChatRef, async (res) => {
            setuserChatData(await res.data())
        })
        chatIndex = await userChatData.chats.findIndex(c => c.chatId == chatId)
        userChatData.chats[chatIndex].updatedAt = Date.now();
        
    
        const temp = e.target.value
        if (e.target.value == "" || e.target.value == null) {
            setTyping(false)
            userChatData.chats[chatIndex].istyping = false;
            await updateDoc(userChatRef, {
                chats: userChatData.chats,
            })
            console.log("typing stopped")
        }
        else if (!typing) {

            setTyping(true)
            console.log(userChatData.chats)
            userChatData.chats[chatIndex].istyping = true;
            console.log("typing ")
            await updateDoc(userChatRef, {
                chats: userChatData.chats,
            })


        }
        setTimeout(async () => {

            if (e.target.value == temp || text == "" || text == null) {

                setTyping(false)
                userChatData.chats[chatIndex].istyping = false;
                await updateDoc(userChatRef, {
                    chats: userChatData.chats,
                })
                console.log("typing stoped")

            }

        }, 4000)



    }


    const mql = window.matchMedia('(max-width: 600px)');
    let mobileView = mql.matches;
    return (

        <div className='chat' style={mobileView ? { display: !details ? "flex" : "none" } : {}} >
            <div className="top">
                <div className="user">
                    <img className="close" src="./back.png" alt="" onClick={() => { setDetails(false); backchat() }} />
                    <img src={user?.avatar || "./avatar.png"} alt="" onClick={() => setDetails(prev => !prev)} />
                    <div className="texts">
                        <span>{user?.username || "user illa"}</span>
                        <p>{user?.bio || "lets gossip"}</p>
                    </div>
                </div>
                <div className="icons">
                    <img src="./phone.png" alt="" />
                    <img src="./video.png" alt="" />
                </div>
            </div>
            <div className="center">
                {chat?.map((message, index) => (
                    <div className={message.senderId == CurrentUser.id ? "message own" : "message"} key={message?.createdAt}>
                        <div className="text">
                            {message.img && message.img.map((img, index) => (
                                <img src={img.product} alt="" key={index} loading='lazy' />
                            ))
                            }

                            {message.text && <p>{message.text}</p>}
                            <span >
                                {parsetime(message.createdAt.seconds, message.createdAt.nanoseconds)}
                            </span>
                        </div>
                    </div>
                ))}
                {seen && <div className="message own">

                    <div className="text" style={{ fontSize: "11px", position: "relative", top: "-10px" }} >seen</div>
                </div>}
                {usertyping && <div className="message">

                    <div className="text" ><Typing /></div>
                </div>}

                <div ref={endRef} style={{ height: "1px" }}></div>

            </div>
            <div className="bottom">
                {isCurrentBlocked || isReceiverBlocked ? isCurrentBlocked ? <div className='blocked'>Sorry, the user is fed-up with you , you can not reply to this message anymore</div> : <div className='blocked'>you have blocked this user</div>
                    : <>
                        <div className='btcontain'>
                            {Object.keys(image.file).length != 0 && <div className='inputimg'>
                                {image.url.map((img, index) => (

                                    <div className='imgitems' key={index}>
                                        <div className="close" >
                                            <img src="./close.png" alt="" onClick={() => handlecloseimg(index)} />
                                        </div>
                                        <img src={img} alt="" />
                                    </div>
                                ))}
                            </div>}
                            <div className="input">

                                <div className="icons">
                                    <label htmlFor="file">

                                        <img src="./img.png" alt="" />
                                    </label>
                                    <input type="file" id='file' style={{ display: "none" }} onChange={handleImage} multiple />
                                    <img src="./camera.png" alt="" />
                                    <img src="./mic.png" alt="" />
                                </div>

                                <input type="text" placeholder='type the message!!' value={text} onChange={handleinput} />

                                <div className="emoji">
                                    <img src="./emoji.png" alt="" onClick={() => seteopen(!eopen)} />
                                    <div className="picker">
                                        <EmojiPicker open={eopen} onEmojiClick={handleEmoji} theme='auto' height={350} lazyLoadEmojis={true} autoFocusSearch={false} />
                                    </div>

                                </div>
                                <button className='sendBtn' onClick={handleSend}>send</button>
                            </div>

                        </div>

                    </>}


            </div>
        </div>
    )
}

export default Chat