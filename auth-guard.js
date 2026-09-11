/* Auth guard for private pages/actions. Uses the existing Firebase app when available. */
import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBxD8SLW9z8ndgAJprcGolqivlNUZVYZxc",
  authDomain: "art-hub-77eb1.firebaseapp.com",
  databaseURL: "https://art-hub-77eb1-default-rtdb.firebaseio.com",
  projectId: "art-hub-77eb1",
  storageBucket: "art-hub-77eb1.firebasestorage.app",
  messagingSenderId: "1097170910592",
  appId: "1:1097170910592:web:efafe19f6fc24f40881565"
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const auth = getAuth(app);
const privatePages = new Set(["dashboard.html","profile.html","buyer-dashboard.html","chat.html","saved.html"]);
const page = location.pathname.split("/").pop() || "home.html";

function showGate(message){
  document.documentElement.classList.add("auth-gate-active");
  const gate=document.createElement("div");
  gate.className="auth-page-gate";
  gate.innerHTML=`<div class="auth-page-gate-card"><div class="gate-icon">🔐</div><h1>Login required</h1><p>${message}</p><a href="login.html" class="market-btn">Login / Create account</a></div>`;
  document.body.appendChild(gate);
}

if(privatePages.has(page)){
  onAuthStateChanged(auth,user=>{
    if(!user){ showGate("Please login or create an account to access this page."); setTimeout(()=>location.replace("login.html"),900); }
    else document.documentElement.classList.remove("auth-gate-active");
  });
}

window.hubRequireAuth = async function(){
  if(auth.currentUser) return true;
  alert("Please login or create an account first.");
  location.href="login.html";
  return false;
};
