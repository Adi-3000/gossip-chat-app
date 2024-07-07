import { useEffect, useState } from "react"
import Chat from "./components/chat/chat"
import Details from "./components/details/details"
import List from "./components/list/list"
import Login from "./components/Login/login"
import { onAuthStateChanged } from "firebase/auth"
import { auth } from "./lib/firebase"
import { useUserStore } from "./lib/Userstore"
import { useChatStore } from "./lib/chatstore"

const App = () => {
  const[user,setUser]=useState(false)
  const [details, setDetails] = useState(false)
  const{CurrentUser,isLoading,fetchUser}=useUserStore()
  const { chatId} = useChatStore();

  useEffect(()=>{
    const unSub=onAuthStateChanged(auth,(user)=>{
      fetchUser(user?.uid)
    });
    return ()=>{
      unSub();
    }
  },[fetchUser]);
  console.log(CurrentUser)
  if(isLoading) return <div>Loading...</div>
  return (
    <div className='container'>
      {CurrentUser ? (<>
        
        <List/>
        {chatId&&<Chat setDetails={setDetails} details={details} />}
        {
          details ? (<Details setDetails={setDetails} />) : (<></>)
        }
  
      </>) : (<Login setUser={setUser}/>)}
      </div>
    
  )
}

export default App