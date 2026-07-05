import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBpcbHqIl-ioVyDmjgXsBkg5zpAfA5Cu4o",

  authDomain: "nr-stay-tracker.firebaseapp.com",

  projectId: "nr-stay-tracker",

  storageBucket: "nr-stay-tracker.firebasestorage.app",

  messagingSenderId: "41883370611",

  appId: "1:41883370611:web:0d05782abb829278575606",

  measurementId: "G-QVHWZNRQNR",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
