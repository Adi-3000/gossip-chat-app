import React, { useState } from 'react'
import './details.css'
import { auth, db } from '../../lib/firebase'
import { useChatStore } from '../../lib/chatstore.js';
import { useUserStore } from '../../lib/Userstore.js';
import { arrayRemove, arrayUnion, doc, updateDoc } from 'firebase/firestore';


function Details({ setDetails,profile }) {
    const { chatId, user, isCurrentBlocked, isReceiverBlocked, changeBlock, chats } = useChatStore();
    const { CurrentUser } = useUserStore();
    const [expand, setexpand] = useState([false,false,false,false]);
    const [edit, setEdit] = useState(false);

    const[profiledata,setProfiledata]=useState({
        avatar:CurrentUser?.avatar,username:CurrentUser?.username
    })
    const [avatar, setAvatar] = useState({
        file: null,
        url: ""
    })
    
    const handleAvatar = e => {
        if (e.target.files[0]) {

            setAvatar({
                file: e.target.files[0],
                url: URL.createObjectURL(e.target.files[0])

            })
        }
    }
    const handleChange = (e) => {
 
        const { name, value, type, checked } = e.target;
        setProfiledata({
          ...profiledata,
          [name]: type === 'checkbox' ? checked : value,
        });
      };
    

    const handleBlock = async () => {
        if (!user) return;
        const userDocRef = doc(db, "Users", CurrentUser.id)
        try {
            await updateDoc(userDocRef, {
                blocked: isReceiverBlocked ? arrayRemove(user.id) : arrayUnion(user.id)
            })
            changeBlock();
        } catch (error) {
            console.log(error)
        }
    }
    const handleSave=async()=>{
        setEdit(false)

    }

if(profile){
    return(
        <div className='details'>
            <div className="close">
                <img src="./back.png" alt="" onClick={() => setDetails(false)}  />
               {!edit&& <img src="/edit.png" alt="" style={{width:"20px",height:"20px",borderRadius:"0px",cursor:"pointer"}} onClick={()=>setEdit(!edit)}/>}

            </div>
            <div className="user">
                <div>
                <label htmlFor="file">
                <img src={CurrentUser?.avatar || "./avatar.png"} alt="" /></label>
                    <input type="file" id="file" style={{ display: "none" }} onChange={handleAvatar} disabled={!edit}/>
                </div>
                
                <input type="text" name="name" value={profiledata.username||"user not available"} onChange={handleChange} style={edit?{border:"1px solid rgba(17, 25, 40, 0.47)"}:{}} disabled={!edit}/>
                <input type="text" name="desc" value="Lorem ipsum dolor sit, amet consectetur adipisicing elit."  style={{border:edit?"1px solid rgba(17, 25, 40, 0.47)":"none",fontSize:"16px"}} disabled={!edit}/>
          
                <p>
                    
                </p>
            </div>
            <div className="info" style={{height:"45vh"}}>
                <div className="option">
                    <div className="title">
                        <span>Chat setting </span>
                        <img src={expand[0]?"./arrowUp.png":"./arrowDown.png"} alt="" onClick={() => setDetails([...expand,expand[0]=!expand[0]])} />
                    </div>
                </div>
                <div className="option" >
                    <div className="title">
                        <span>privacy</span>
                        <img src={expand[1]?"./arrowUp.png":"./arrowDown.png"} alt="" onClick={() => setDetails([...expand,expand[1]=!expand[1]])}/>
                    </div>
                </div>

            </div>
            <div className='btns'>
               {edit&& <button id="save" onClick={handleSave}>
                    Save</button>}
                <button onClick={()=>auth.signOut()}>
                    Log-out</button>
            </div>
        </div>
    )
}

    return (
        <div className='details'>
            <div className="close">
                <img src="./back.png" alt="" onClick={() => setDetails(false)} />
            </div>
            <div className="user">
                <img src={user?.avatar || "./avatar.png"} alt="" />
                <h2>{user?.username || "user not available"}</h2>
                <p>
                    Lorem ipsum dolor sit, amet consectetur adipisicing elit.
                </p>
            </div>
            <div className="info">
                <div className="option">
                    <div className="title">
                        <span>Chat setting </span>
                        <img src={expand[0]?"./arrowUp.png":"./arrowDown.png"} alt="" onClick={() => setDetails([...expand,expand[0]=!expand[0]])} />
                    </div>
                </div>
                <div className="option">
                    <div className="title">
                        <span>privacy</span>
                        <img src={expand[1]?"./arrowUp.png":"./arrowDown.png"} alt="" onClick={() => setDetails([...expand,expand[1]=!expand[1]])}/>
                    </div>
                </div>
                <div className="option">
                    <div className="title">
                        <span>photos shared</span>
                        <img src={expand[2]?"./arrowUp.png":"./arrowDown.png"} alt="" onClick={() => setDetails([...expand,expand[2]=!expand[2]])}/>
                    </div>
                    {expand[2]&&<div className="photos">
                        {chats?.message?.map((message) => (
                           message.img && <div className="photosItem" key={message?.createdAt} >

                                <div className="photodetail">
                                    {message.img && <img src={message.img} alt="" />}

                                    <span>demo_photo</span>
                                </div>

                                <img src="./download.png" alt="" className='icon' />
                            </div>

                        ))}

                   
                    </div>}
                </div>
                <div className="option">
                    <div className="title">
                        <span>shared files</span>
                        <img src={expand[3]?"./arrowUp.png":"./arrowDown.png"} alt="" onClick={() => setDetails([...expand,expand[3]=!expand[3]])}/>
                    </div>
                </div>

            </div>
            <div className='btns'>

                <button onClick={handleBlock}>
                    {isCurrentBlocked ? "sorry you have been blocked" : isReceiverBlocked ? "user blocked" : "Block user"
                    }</button>
            </div>
        </div>
    )
}

export default Details