import React, { useState } from 'react'
import './login.css'
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth'
import { auth, db } from '../../lib/firebase.js'
import { doc, setDoc } from 'firebase/firestore'
import upload from '../../lib/upload.js'

function Login({setUser}) {
    const [avatar, setAvatar] = useState({
        file: null,
        url: ""
    })
    const[loading,setLoading]=useState(false)
    const handleAvatar = e => {
        if (e.target.files[0]) {

            setAvatar({
                file: e.target.files[0],
                url: URL.createObjectURL(e.target.files[0])

            })
        }
    }
    const handleLogin = async(e) => {
        e.preventDefault()
        setLoading(true)
        const formdata=new FormData(e.target);
        const {email,password}=Object.fromEntries(formdata)
        try {
            await signInWithEmailAndPassword(auth,email,password)
            alert("signed in")
            
        } catch (error) {
            console.log(error)
            
        }finally{
            setLoading(false)
        }
    }
  
    const handleSignup = async(e) => {
        e.preventDefault()
        setLoading(true)
        const formdata=new FormData(e.target);
        const {username,email,password}=Object.fromEntries(formdata)
        try {
            const res=await createUserWithEmailAndPassword (auth,email,password);
            const imgurl=await upload(avatar.file)
            console.log(imgurl)
            await setDoc(doc(db, "Users", res.user.uid), {
                username,
                email,
                avatar:imgurl,
                id:res.user.uid,
                blocked:[]
              });
              await setDoc(doc(db, "Userchats", res.user.uid), {
                chats:[]
              });

              alert("account created , please login")
            
        } catch (error) {
            console.log(error)
            
        }finally{
            setLoading(false)
        }
    }
    return (
        <div className='login'>
            <div className="item">
                <h2>Welcome back</h2>
                <form onSubmit={handleLogin} >
                    <input type="text" placeholder='email' name='email' />
                    <input type="password" placeholder='password' name='password' />
                    <button  disabled={loading}>sign-in</button>

                </form>
                    {/* <button >sign-in with google</button> */}
            </div>
            <div className="devider"></div>
            <div className="item">
            <h2>create an account</h2>
                    <form onSubmit={handleSignup}>
                        <label htmlFor="file">
                            <img src={avatar.url||"./avatar.png"} alt="" />upload and image</label>
                        <input type="file" id="file" style={{ display: "none" }} onChange={handleAvatar} />
                        <input type="text" placeholder='username' name='username' />
                        <input type="text" placeholder='email' name='email' />
                        <input type="password" placeholder='password' name='password' />
                        <button disabled={loading}>{loading?"Registrering user":"sign-up"}</button>

                    </form>
            </div>
        </div>
    )
}

export default Login