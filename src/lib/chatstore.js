import { doc, getDoc } from 'firebase/firestore';
import { create } from 'zustand'
import { db } from './firebase';
import { useUserStore } from './Userstore';

export const useChatStore = create((set) => ({
    chatId: null,
    user: null,
    isCurrentBlocked: false,
    isReceiverBlocked: false,
    isLoading: true,
    chats:null,
    callid:null,
    caller:null,
    status:null,
    callmode:null,
    setcall:(callid,caller,status,callmode)=>{
        return set(state => ({
            ...state, callid:callid,caller:caller,status:status,callmode:callmode
        }))
    },
    
    
    changeChat: (chatId, user) => {
        const CurrentUser = useUserStore.getState().CurrentUser;
        console.log("store chatid", chatId)


        if (user.blocked.includes(CurrentUser.id)) {
            return set({
                chatId,
                user: null,
                isCurrentBlocked: true,
                isReceiverBlocked: false,
            })
        }

        else if (CurrentUser.blocked.includes(user.id)) {
            return set({
                chatId,
                user: user,
                isCurrentBlocked: false,
                isReceiverBlocked: true,
            })
        }
        else {
            return set({
                chatId,
                user,
                isCurrentBlocked: false,
                isReceiverBlocked: false,
            })
        }

    },
    changeBlock: () => {
        set(state => ({
            ...state, isReceiverBlocked: !state.isReceiverBlocked
        }))
    },
    backchat: () => {
        set({
            chatId: null,
            user: null,
            isCurrentBlocked: false,
            isReceiverBlocked: false,
            isLoading: true,
        })
    },
    setchats:(chat)=>{
        set({
            chats:chat
        })
        
    }
}))