import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDV-SY9pNnEe4zsGbYYGUGxX5U-owlepBQ",
  authDomain: "jobtimemanageapp.firebaseapp.com",
  projectId: "jobtimemanageapp",
  storageBucket: "jobtimemanageapp.appspot.com",
  messagingSenderId: "617502763895",
  appId: "1:617502763895:web:f83d6f98f7bd2729654f72",
  measurementId: "G-M4ER59GS4N"
};


  // firebaseConfigの値を元にfirebaseの初期化
  const app = initializeApp(firebaseConfig);
  const analytics = getAnalytics(app);
  
  // Initialize Cloud Firestore and get a reference to the service
  const db = getFirestore(app);
  // Initialize Authentication
  const auth = getAuth(app)
  
  export default { analytics, db, auth };