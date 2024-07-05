import React from 'react'
import './details.css'
import { auth, db } from '../../lib/firebase'
import { useChatStore } from '../../lib/chatstore.js';
import { useUserStore } from '../../lib/Userstore.js';
import { arrayRemove, arrayUnion, doc, updateDoc } from 'firebase/firestore';


function Details({setDetails}) {
    const {chatId,user,isCurrentBlocked,isReceiverBlocked,changeBlock}=useChatStore();
    const { CurrentUser } = useUserStore();
    const handleBlock=async()=>
        {
             if(!user) return;
            const userDocRef=doc(db,"Users",CurrentUser.id)
            try {
                await updateDoc(userDocRef,{
                    blocked:isReceiverBlocked?arrayRemove(user.id):arrayUnion(user.id)
                })
                changeBlock();
            } catch (error) {
                console.log(error)
            }
        }

    

    return (
        <div className='details'>
            <div className="close">
                <img src="./plus.png" alt="" onClick={()=>setDetails(false)}/>
            </div>
            <div className="user">
                <img src={user?.avatar||"./avatar.png"} alt="" />
                <h2>{user?.username||"user not available"}</h2>
                <p>
                    Lorem ipsum dolor sit, amet consectetur adipisicing elit.
                </p>
            </div>
            <div className="info">
                <div className="option">
                    <div className="title">
                        <span>Chat setting </span>
                        <img src="./arrowUp.png" alt="" />
                    </div>
                </div>
                <div className="option">
                    <div className="title">
                        <span>privacy</span>
                        <img src="./arrowUp.png" alt="" />
                    </div>
                </div>
                <div className="option">
                    <div className="title">
                        <span>photos shared</span>
                        <img src="./arrowDown.png" alt="" />
                    </div>
                    <div className="photos">
                        <div className="photosItem">
                            <div className="photodetail">

                                <img src="./bg.jpg" alt="" />
                                <span>demo_photo</span>
                            </div>

                            <img src="./download.png" alt=""className='icon' />
                        </div>
                        <div className="photosItem">
                            <div className="photodetail">

                                <img src="./bg.jpg" alt="" />
                                <span>demo_photo</span>
                            </div>

                            <img src="./download.png" alt="" className='icon' />
                        </div>
                        <div className="photosItem">
                            <div className="photodetail">

                                <img src="./bg.jpg" alt="" />
                                <span>demo_photo</span>
                            </div>

                            <img src="./download.png" alt=""  className='icon'/>
                        </div>
                    </div>
                </div>
                <div className="option">
                    <div className="title">
                        <span>shared files</span>
                        <img src="./arrowDown.png" alt="" />
                    </div>
                </div>
                <button onClick={handleBlock}>
                    {isCurrentBlocked?"sorry you have been blocked":isReceiverBlocked?"user blocked":"Block user"
                    }</button>
                <button className="logout" onClick={()=>auth.signOut()}>Log out</button>

            </div>
        </div>
    )
}

export default Details