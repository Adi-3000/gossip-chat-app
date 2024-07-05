import { doc, getDoc } from 'firebase/firestore';
import { create } from 'zustand'
import { db } from './firebase';

export const useUserStore = create((set) => ({
    CurrentUser: null,
    isLoading: true,
    fetchUser: async (uid) => {
        if (!uid) return set({ CurrentUser: null, isLoading: false });
        try {
            const docRef = doc(db, "Users", uid);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                console.log("Document data:", docSnap.data());
                set({ CurrentUser: docSnap.data(), isLoading: false })
                
            }
            else{
                set({ CurrentUser: null, isLoading: false })
            }
        } catch (error) {
            console.log(error);
            return set({ CurrentUser: null, isLoading: false })
        }
    }
}))