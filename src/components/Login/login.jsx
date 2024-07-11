import React, { useState } from 'react'
import './login.css'
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth'
import { auth, db,provider } from '../../lib/firebase.js'
import { doc, setDoc } from 'firebase/firestore'
import upload from '../../lib/upload.js'

function Login({ setUser }) {
    const [avatar, setAvatar] = useState({
        file: null,
        url: ""
    })
    const [loading, setLoading] = useState(false)
    const [registerform, setRegisterform] = useState(false)
    const [error, seterror] = useState(null)

    const handleAvatar = e => {
        if (e.target.files[0]) {

            setAvatar({
                file: e.target.files[0],
                url: URL.createObjectURL(e.target.files[0])

            })
        }
    }
    const mql = window.matchMedia('(max-width: 600px)');
    let mobileView = mql.matches;
    const handleLogin = async (e) => {
        e.preventDefault()
        setLoading(true)
        setRegisterform(false)

        const formdata = new FormData(e.target);
        const { email, password } = Object.fromEntries(formdata)
        try {
            await signInWithEmailAndPassword(auth, email, password)
            alert("signed in")

        } catch (err) {
            switch (err.code) {
                case "auth/invalid-email":
                    seterror("invalid email address!please enter a valid email id")
                    break;
                case "auth/invalid-credential":
                    seterror("Email id or password does not match!!")
                    break;

                default:
                    seterror(err.code)
                    break;
            }
            console.log(err)

        } finally {
            setLoading(false)
        }
    }

    const handleSignup = async (e) => {
        e.preventDefault()
        setRegisterform(true)
        setLoading(true)
        const formdata = new FormData(e.target);
        const { username, email, password } = Object.fromEntries(formdata)
        try {
            const res = await createUserWithEmailAndPassword(auth, email, password);

            const imgurl = avatar.file ? await upload(avatar.file) : null;
            await setDoc(doc(db, "Users", res.user.uid), {
                username,
                email:email.toLowerCase(),
                avatar: imgurl,
                id: res.user.uid,
                blocked: []
            });
            await setDoc(doc(db, "Userchats", res.user.uid), {
                chats: []
            });

            alert("account created , please login")

        } catch (err) {
            switch (err.code) {
                case "auth/invalid-email":
                    seterror("invalid email address!please enter a valid email id")
                    break;
                case "auth/email-already-in-use":
                    seterror("User already exist ! please login")
                    break;

                case "auth/weak-password":
                    seterror("password must be of 6 letters")
                    break;
                case "auth/missing-password":
                    seterror("please enter password")
                    break;
                default:
                    seterror(err.code)
                    break;

            }



        } finally {

            setLoading(false);


        }
    }
    return (
        <div className='login'>
            <div className="item" style={mobileView ? { display: !registerform ? "flex" : "none" } : {}}>
                <h2>Welcome back</h2>
                <form onSubmit={handleLogin} >
                    <input type="text" placeholder='email' name='email' />
                    <input type="password" placeholder='password' name='password' />
                    {!registerform && error ? <span className='error'>{error}</span> : <></>}

                    <button disabled={loading}>sign-in</button>
                </form>
                <button disabled={loading} onClick={() => { setRegisterform(!registerform) }} style={{ display: mobileView ? "block" : "none" }}>Register</button>

                {/* <button onClick={()=>signInWithPopup(auth,provider)} >sign-in with google</button> */}
            </div>
            <div className="devider" style={mobileView ? { display: "none" } : {}}></div>
            <div className="item" style={mobileView ? { display: registerform ? "flex" : "none" } : {}}>
                <h2>create an account</h2>
                <form onSubmit={handleSignup}>
                    <label htmlFor="file">
                        <img src={avatar.url || "./avatar.png"} alt="" />upload and image</label>
                    <input type="file" id="file" style={{ display: "none" }} onChange={handleAvatar} />
                    <input type="text" placeholder='username' name='username' />
                    <input type="text" placeholder='email' name='email' />
                    <input type="password" placeholder='password' name='password' />
                    {registerform && error ? <span className='error'>{error}</span> : <></>}
                    <button disabled={loading}>{loading ? "Registrering user" : "sign-up"}</button>

                </form>
                <button disabled={loading} onClick={() => { setRegisterform(!registerform) }}
                    style={{ display: mobileView ? "block" : "none" }}>Login</button>

            </div>
        </div>
    )
}

export default Login