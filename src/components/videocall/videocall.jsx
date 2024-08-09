import { useEffect, useRef, useState } from "react";
import './videocall.css'

import {
    getFirestore,
    collection,
    doc,
    addDoc,
    setDoc,
    getDoc,
    updateDoc,
    onSnapshot,
    deleteDoc,
    query,
    getDocs,
} from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useChatStore } from "../../lib/chatstore";
import { useUserStore } from "../../lib/Userstore";

// Initialize WebRTC
const servers = {
    iceServers: [
        {
            urls: [
                "stun:stun1.l.google.com:19302",
                "stun:stun2.l.google.com:19302",
            ],
        },
    ],
    iceCandidatePoolSize: 10
};

function Vc({ setvc, video }) {
    const [currentPage, setCurrentPage] = useState("create");
    const { callid, caller, status, callmode } = useChatStore();
    const [joinCode, setJoinCode] = useState(callid);
    const { CurrentUser } = useUserStore();
    const [cmode, setcmode] = useState(true);

    useEffect(() => {
        if (callid && caller != CurrentUser.id && status == "accept") {
            setCurrentPage("join")
            setJoinCode(callid)
        }
    })
    console.log("current page:"+currentPage)

    return (
        <div className="app">
            <Videos
                mode={currentPage}
                callId={joinCode}
                setPage={setCurrentPage}
                setvc={setvc}
                video={video}
            />
        </div>
    );
}

function Videos({ Mode, callId, setPage, setvc, video = true }) {
    const [roomId, setRoomId] = useState(callId);
    const { chatId, user, callid, setcall, caller, status, callmode } = useChatStore();
    const { CurrentUser } = useUserStore();
    let localStream, setupSources
    let pc = new RTCPeerConnection(servers);

    console.log("vc funct called")
    useEffect(()=>{
        console.log("useEffect 1 called")
        console.log("called:"+callid)
        setupSources(callid?"join":"create")

    })
    useEffect(() => {
        return () => {
            if (status == "reject") {
            hangUp()
        }   
        }
    }, [status])

    
    const localRef = useRef();
    const remoteRef = useRef();

    setupSources = async (mode) => {

        localStream = await navigator.mediaDevices.getUserMedia({
            video: video,
            audio: true,
        });

        const remoteStream = new MediaStream();

        localStream.getTracks().forEach((track) => {
            pc.addTrack(track, localStream);
        });
        pc.ontrack = (event) => {
            event.streams[0].getTracks().forEach((track) => {
                remoteStream.addTrack(track);
            });
        };

        localRef.current.srcObject = localStream;
        remoteRef.current.srcObject = remoteStream;

        try {

            if (mode === "create") {

                console.log("called create")
                const callDoc = await doc(collection(db, "calls"));
                const offerCandidates = await collection(callDoc, "offerCandidates");
                const answerCandidates = await collection(callDoc, "answerCandidates");
                console.log(callDoc)

                setRoomId(callDoc.id);
                const userIds = [CurrentUser.id, user.id]
                await userIds.forEach(async (id) => {
                    const userChatRef = doc(db, "Userchats", id);
                    const userChatSnap = await getDoc(userChatRef);

                    if (userChatSnap.exists()) {
                        const userChatData = await userChatSnap.data();
                        const chatIndex = await userChatData.chats.findIndex(c => c.chatId == chatId)
                        console.log("userchat for " + id + "with chat id " + chatId + " and chat index is " + chatIndex)
                        console.log(userChatData.chats[chatIndex])
                        const temp = userChatData.chats[chatIndex]
                        temp.callid = callDoc.id;
                        temp.caller = CurrentUser.id;
                        temp.callmode = video ? "video" : "audio"
                        console.log("updated")
                        console.log(temp)

                        userChatData.chats[chatIndex].updatedAt = Date.now();
                        await updateDoc(userChatRef, {
                            chats: userChatData.chats,
                        })
                    }
                })


                pc.onicecandidate = async (event) => {
                    event.candidate && await addDoc(offerCandidates, event.candidate.toJSON());
                };

                const offerDescription = await pc.createOffer();
                await pc.setLocalDescription(offerDescription);

                const offer = {
                    sdp: offerDescription.sdp,
                    type: offerDescription.type,
                };


                await setDoc(callDoc, { offer });

                onSnapshot(callDoc, async (snapshot) => {

                    const data = snapshot.data();
                    if (data) {

                        if (!pc.currentRemoteDescription && data?.answer) {
                            const answerDescription = new RTCSessionDescription(data.answer);
                            pc.setRemoteDescription(answerDescription);
                        }
                    }
                    else {
                        await localStream.getTracks().forEach((track) => {
                            if (track.readyState == 'live') {
                                track.stop();
                            }
                        });
                        hangUp()
                    }
                });

                onSnapshot(offerCandidates, (snapshot) => {


                    snapshot.docChanges().forEach((change) => {
                        if (change.type === "added") {
                            const candidate = new RTCIceCandidate(change.doc.data());
                            pc.addIceCandidate(candidate);
                        }

                    });
                    pc.onconnectionstatechange = async (event) => {
                        if (pc.connectionState === "disconnected") {
                            await localStream.getTracks().forEach((track) => {
                                if (track.readyState == 'live') {
                                    track.stop();
                                }
                            });
                            hangUp();
                        }
                    };

                });

            } else if (mode === "join") {
                const callDoc = doc(db, "calls", callId);
                const answerCandidates = collection(callDoc, "answerCandidates");
                const offerCandidates = collection(callDoc, "offerCandidates");

                pc.onicecandidate = (event) => {
                    event.candidate && addDoc(answerCandidates, event.candidate.toJSON());
                };
                onSnapshot(callDoc, async (snapshot) => {
                    const data = snapshot.data();
                    console.log(data)
                    if (data == null) {
                        console.log("rejected-----2")
                        await localStream.getTracks().forEach((track) => {
                            if (track.readyState == 'live') {
                                track.stop();
                            }
                        });
                        hangUp()
                    }

                });

                const callData = (await getDoc(callDoc)).data();

                const offerDescription = callData.offer;
                await pc.setRemoteDescription(new RTCSessionDescription(offerDescription));

                const answerDescription = await pc.createAnswer();
                await pc.setLocalDescription(answerDescription);

                const answer = {
                    type: answerDescription.type,
                    sdp: answerDescription.sdp,
                };

                await updateDoc(callDoc, { answer });

                onSnapshot(offerCandidates, (snapshot) => {

                    snapshot.docChanges().forEach((change) => {
                        if (change.type === "added") {
                            let data = change.doc.data();
                            pc.addIceCandidate(new RTCIceCandidate(data));
                        }
                        pc.onconnectionstatechange = async(event) => {
                            if (pc.connectionState === "disconnected") {
                                await localStream.getTracks().forEach((track) => {
                                    if (track.readyState == 'live') {
                                        track.stop();
                                    }
                                });
                                hangUp();
                            }
                        };
                    });
                });

            }
        } catch (error) {
            console.log(error)
        }

    };
    const hangUp = async () => {

        pc.close();
        console.log("hang up" + callId)

        if (roomId) {
            let roomRef = doc(db, "calls", roomId);
            const answerCandidates = collection(roomRef, "answerCandidates");
            const offerCandidates = collection(roomRef, "offerCandidates");
            const offerSnapshots = await getDocs(offerCandidates);
            await offerSnapshots.forEach((doc) => {
                deleteDoc(doc.ref);
            });
            console.log("deleted offer")
            if (answerCandidates) {
                const answerSnapshots = await getDocs(answerCandidates);
                await answerSnapshots.forEach((doc) => {
                    deleteDoc(doc.ref);
                });
                console.log("deleted answer")
            }

            const userIds = [CurrentUser.id, user.id]
            await userIds.forEach(async (id) => {
                const userChatRef = doc(db, "Userchats", id);
                const userChatSnap = await getDoc(userChatRef);

                if (userChatSnap.exists()) {
                    const userChatData = await userChatSnap.data();
                    const chatIndex = await userChatData.chats.findIndex(c => c.chatId == chatId)
                    console.log("userchat for " + id + "with chat id " + chatId + " and chat index is " + chatIndex)
                    console.log(userChatData.chats[chatIndex])
                    const temp = userChatData.chats[chatIndex]
                    temp.callid = null;
                    temp.caller = null;
                    temp.callmode = null;
                    console.log("updated")
                    console.log(temp)

                    userChatData.chats[chatIndex].updatedAt = Date.now();
                    await updateDoc(userChatRef, {
                        chats: userChatData.chats,
                    })
                }
            })

            await deleteDoc(roomRef);
            console.log("deleted call")


        }
        await setcall(null, null, null, null)
        setvc(false)



    };

    const hidcam = async () => {
        const videoTrack = localStream.getTracks().find(track => track.kind === 'video')
        if (videoTrack.enabled) {
            console.log("enabled")
            videoTrack.enabled = false
        }
        else {
            console.log("disabled")
            videoTrack.enabled = true
        }
    }
    const mutemic = async () => {
        const videoTrack = localStream.getTracks().find(track => track.kind === 'audio')
        if (videoTrack.enabled) {
            console.log("enabled")
            videoTrack.enabled = false
        }
        else {
            console.log("disabled")
            videoTrack.enabled = true
        }
    }



    return (
        <div className="videos">
            <video ref={remoteRef} poster="./avatar.png" autoPlay playsInline className="remote" />
            <video ref={localRef} poster="./avatar.png" autoPlay playsInline className="local" muted style={{ position: callmode == "audio" ? "static" : "relative" }} />
            <div className="control">

                <div className="camera">
                    <label className="mute">
                        <input type="checkbox" onClick={hidcam} />

                        <svg height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="microphone">
                            <path d="M12 16C13.6569 16 15 14.6569 15 13C15 11.3431 13.6569 10 12 10C10.3431 10 9 11.3431 9 13C9 14.6569 10.3431 16 12 16Z" stroke="#a5a5b0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M3 16.8V9.2C3 8.0799 3 7.51984 3.21799 7.09202C3.40973 6.71569 3.71569 6.40973 4.09202 6.21799C4.51984 6 5.0799 6 6.2 6H7.25464C7.37758 6 7.43905 6 7.49576 5.9935C7.79166 5.95961 8.05705 5.79559 8.21969 5.54609C8.25086 5.49827 8.27836 5.44328 8.33333 5.33333C8.44329 5.11342 8.49827 5.00346 8.56062 4.90782C8.8859 4.40882 9.41668 4.08078 10.0085 4.01299C10.1219 4 10.2448 4 10.4907 4H13.5093C13.7552 4 13.8781 4 13.9915 4.01299C14.5833 4.08078 15.1141 4.40882 15.4394 4.90782C15.5017 5.00345 15.5567 5.11345 15.6667 5.33333C15.7216 5.44329 15.7491 5.49827 15.7803 5.54609C15.943 5.79559 16.2083 5.95961 16.5042 5.9935C16.561 6 16.6224 6 16.7454 6H17.8C18.9201 6 19.4802 6 19.908 6.21799C20.2843 6.40973 20.5903 6.71569 20.782 7.09202C21 7.51984 21 8.0799 21 9.2V16.8C21 17.9201 21 18.4802 20.782 18.908C20.5903 19.2843 20.2843 19.5903 19.908 19.782C19.4802 20 18.9201 20 17.8 20H6.2C5.0799 20 4.51984 20 4.09202 19.782C3.71569 19.5903 3.40973 19.2843 3.21799 18.908C3 18.4802 3 17.9201 3 16.8Z" stroke="#a5a5b0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <svg height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="#000000" className="microphone-slash">

                            <g id="SVGRepo_bgCarrier" strokeWidth="0" />

                            <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round" />

                            <g id="SVGRepo_iconCarrier"> <path opacity="0.1" d="M3 16V9C3 7.89543 3.89543 7 5 7C5.32298 7 5.63563 7.11376 5.8831 7.32131L10 10.7742L9.83695 10.9212C9.31863 11.4604 9 12.193 9 12.9999C9 14.6568 10.3431 15.9999 12 15.9999C13.0011 15.9999 13.8876 15.5096 14.4326 14.756L14.5415 14.5832L20.8254 19.8535C20.8847 19.9033 20.8495 20 20.7721 20H7C5.11438 20 4.17157 20 3.58579 19.4142C3 18.8284 3 17.8856 3 16Z" fill="#f7f7f7" /> <path d="M21 20L16 20L8 20L7 20C5.11438 20 4.17157 20 3.58579 19.4142C3 18.8284 3 17.8856 3 16L3 9C3 7.89543 3.89543 7 5 7V7" stroke="#a5a5b0" strokeWidth="2" strokeLinejoin="round" /> <path d="M9.91501 10.8429C9.35081 11.3884 9 12.1532 9 12.9999C9 14.6568 10.3431 15.9999 12 15.9999C13.0435 15.9999 13.9625 15.4672 14.5 14.6588" stroke="#a5a5b0" strokeWidth="2" /> <path d="M3 5L21 20" stroke="#a5a5b0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /> <path d="M21 16L21 9.60555C21 9.04256 21 8.76107 20.9437 8.52887C20.7673 7.801 20.199 7.2327 19.4711 7.05628C19.2389 7 18.9574 7 18.3944 7V7C18.079 7 17.9213 7 17.7739 6.9779C17.3177 6.90952 16.8991 6.6855 16.5891 6.34382C16.4889 6.23342 16.4015 6.1022 16.2265 5.83975L16 5.5C15.6036 4.90544 15.4054 4.60816 15.1345 4.40367C14.9691 4.27879 14.7852 4.18039 14.5895 4.112C14.2691 4 13.9118 4 13.1972 4L9.90139 4C9.33825 4 8.81237 4.28144 8.5 4.75V4.75L8.25 5.125" stroke="#a5a5b0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /> </g>

                        </svg>
                    </label>
                </div>
                <div className="mic">
                    <label className="mute">
                        <input type="checkbox" onClick={mutemic} />
                        <svg viewBox="0 0 640 512" height="0.8em" xmlns="http://www.w3.org/2000/svg" className="microphone-slash"><path d="M38.8 5.1C28.4-3.1 13.3-1.2 5.1 9.2S-1.2 34.7 9.2 42.9l592 464c10.4 8.2 25.5 6.3 33.7-4.1s6.3-25.5-4.1-33.7L472.1 344.7c15.2-26 23.9-56.3 23.9-88.7V216c0-13.3-10.7-24-24-24s-24 10.7-24 24v40c0 21.2-5.1 41.1-14.2 58.7L416 300.8V96c0-53-43-96-96-96s-96 43-96 96v54.3L38.8 5.1zM344 430.4c20.4-2.8 39.7-9.1 57.3-18.2l-43.1-33.9C346.1 382 333.3 384 320 384c-70.7 0-128-57.3-128-128v-8.7L144.7 210c-.5 1.9-.7 3.9-.7 6v40c0 89.1 66.2 162.7 152 174.4V464H248c-13.3 0-24 10.7-24 24s10.7 24 24 24h72 72c13.3 0 24-10.7 24-24s-10.7-24-24-24H344V430.4z"></path></svg>
                        <svg viewBox="0 0 384 512" height="0.8em" xmlns="http://www.w3.org/2000/svg" className="microphone"><path d="M192 0C139 0 96 43 96 96V256c0 53 43 96 96 96s96-43 96-96V96c0-53-43-96-96-96zM64 216c0-13.3-10.7-24-24-24s-24 10.7-24 24v40c0 89.1 66.2 162.7 152 174.4V464H120c-13.3 0-24 10.7-24 24s10.7 24 24 24h72 72c13.3 0 24-10.7 24-24s-10.7-24-24-24H216V430.4c85.8-11.7 152-85.3 152-174.4V216c0-13.3-10.7-24-24-24s-24 10.7-24 24v40c0 70.7-57.3 128-128 128s-128-57.3-128-128V216z"></path></svg>
                    </label>
                </div>
                <div className="end">
                    <button className="button" onClick={async() => {
                        
                        hangUp();

                    }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 46 46" height="46" fill="none" className="svg-icon"><path strokeWidth="2" strokeLinecap="round" stroke="#fff" fillRule="evenodd" d="m14.5037 27.0715c.819-.634 1.7094-1.1699 2.653-1.597.7621-.3521 1.2557-1.1094 1.2699-1.9488-.0073-1.1346.7466-2.1517 1.8673-2.3279 1.7701-.2782 3.5728-.2785 5.3429-.0005 1.1206.1759 1.8744 1.193 1.8669 2.3274.0206.8307.5066 1.5791 1.257 1.9359.981.4173 1.9093.9489 2.7657 1.5838.8765.5876 2.0467.4715 2.791-.2769l2.2507-2.2507c.4294-.4283.6617-1.0157.6414-1.6219-.0308-.5985-.314-1.1559-.7793-1.5337-2.5842-2.0976-5.6309-3.5496-8.888-4.2357-2.9976-.6659-6.1047-.6655-9.1023.0009-3.2453.7041-6.2835 2.1503-8.87655 4.2253l-.12568.1256c-.38501.38-.60996.8929-.62872 1.4334-.02687.6011.20148 1.1854.62847 1.6092l2.25008 2.2501c.7307.7914 1.9343.9202 2.8162.3015z" clipRule="evenodd"></path></svg>

                    </button>

                </div>



            </div>


        </div>
    );
}


export default Vc;