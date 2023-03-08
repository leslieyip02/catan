import ReactDOM from "react-dom/client";
import { initializeApp } from "firebase/app";
import { getDatabase } from 'firebase/database';
import { getAuth } from "firebase/auth";
import App from "./app";

const firebaseConfig = {
    apiKey: "AIzaSyC-kbdAuxzCuu7VrHTNakn4bawVfOLHYPc",
    authDomain: "catan-5ad96.firebaseapp.com",
    databaseURL: "https://catan-5ad96-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "catan-5ad96",
    storageBucket: "catan-5ad96.appspot.com",
    messagingSenderId: "906871137390",
    appId: "1:906871137390:web:e30446daa78be30ff2b27f"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App auth={auth} db={db} />);