import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { getAuth, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";
import { getDatabase, ref, set, push, onValue, remove, get, update } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyBxD8SLW9z8ndgAJprcGolqivlNUZVYZxc",
  authDomain: "art-hub-77eb1.firebaseapp.com",
  databaseURL: "https://art-hub-77eb1-default-rtdb.firebaseio.com",
  projectId: "art-hub-77eb1",
  storageBucket: "art-hub-77eb1.firebasestorage.app",
  messagingSenderId: "1097170910592",
  appId: "1:1097170910592:web:efafe19f6fc24f40881565"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

const $ = id => document.getElementById(id);
const userMenu = document.getElementById("userMenu");
let currentUserRole = null;
$("showUploadBtn").onclick = () => { if (currentUserRole !== "seller") return alert("Only sellers can upload listings."); $("sellerPanel").classList.toggle("hidden"); };

$("categoryInput").onchange = () => {
  const notes = $("categoryInput").value === "notes";
  $("notesFields").classList.toggle("hidden", !notes);
  $("imageInput").classList.toggle("hidden", notes);
  $("pdfInput").classList.toggle("hidden", !notes);
};

function categoryName(c){ return {painting:"Painting",sketch:"Sketch",artist:"Artist Showcase",digital:"Digital Art",craft:"Craft",photography:"Photography",book:"Book",notes:"Handwritten Notes"}[c] || "Listing"; }
function esc(v){ return String(v ?? "").replace(/[&<>\"]/g, x => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[x])); }

async function loadDashboard(user){
  const snap = await get(ref(db, "users/" + user.uid));
  const profile = snap.val() || {};
  currentUserRole = profile.role || "buyer";
  $("dashWelcome").textContent = `Welcome, ${profile.name || user.email?.split("@")[0] || "Student"}`;
  $("dashUserInfo").textContent = `${profile.role === "seller" ? "Seller" : "Buyer"} account${profile.email ? " · " + profile.email : ""}`;
  if(currentUserRole === "seller") $("sellerPanel").classList.remove("hidden");
  else $("showUploadBtn").style.display = "none";
  if(currentUserRole === "buyer") $("ordersBtn").classList.remove("hidden");
  loadStats(user.uid); loadMyListings(user.uid); loadActivity(user.uid); if(currentUserRole === "seller") { $("sellerOrdersPanel").classList.remove("hidden"); $("sellerRequestsPanel")?.classList.remove("hidden"); loadSellerOrders(user.uid); loadSellerRequests(user.uid); }
}

function loadStats(uid){
  onValue(ref(db,"listings"), snap => { const arr = Object.values(snap.val() || {}); $("totalListings").textContent = arr.length; $("myListingsCount").textContent = arr.filter(x=>x.sellerId===uid).length; });
  onValue(ref(db,"donations"), snap => { $("donationsCount").textContent = Object.values(snap.val() || {}).filter(x=>x.userId===uid).length; });
}

function loadMyListings(uid){
  onValue(ref(db,"listings"), snap => {
    const mine = Object.values(snap.val() || {}).filter(x=>x.sellerId===uid).sort((a,b)=>(b.timestamp||0)-(a.timestamp||0));
    const box=$("myListings");
    if(!mine.length){ box.innerHTML='<div class="dashboard-empty">You have not uploaded any listings yet.</div>'; return; }
    box.innerHTML=mine.map(l=>`<article class="my-listing"><img src="${esc(l.imageUrl || 'https://via.placeholder.com/500x350?text=Student+Item')}" alt="${esc(l.title)}"><div class="my-listing-body"><span class="category-badge">${esc(categoryName(l.category))}</span><h3>${esc(l.title)}</h3><p>₹${esc(l.price)}</p><button class="danger-btn" onclick="deleteListing('${esc(l.id)}')">Delete</button></div></article>`).join("");
  });
}
window.deleteListing = id => { if(confirm("Delete this listing?")) remove(ref(db,"listings/"+id)); };

function loadActivity(uid){
  onValue(ref(db,"listings"), snap => {
    const mine=Object.values(snap.val()||{}).filter(x=>x.sellerId===uid).sort((a,b)=>(b.timestamp||0)-(a.timestamp||0));
    $("recentActivity").innerHTML = mine.length ? `Latest listing: <strong>${esc(mine[0].title)}</strong> · ${esc(categoryName(mine[0].category))}` : "No recent activity yet.";
  });
}


function normalizePhone(v){
  let p=String(v||"").replace(/\D/g,"");
  if(p.length===10) p="91"+p;
  return p;
}

function loadSellerRequests(uid){
  const box=$("sellerRequests"); if(!box) return;
  onValue(ref(db,"requests"), async snap=>{
    const all=snap.val()||{};
    const arr=Object.entries(all).map(([id,r])=>({...r,id})).filter(r=>r.status==="open").sort((a,b)=>(b.createdAt||0)-(a.createdAt||0)).slice(0,10);
    const badge=$("openRequestsBadge"); if(badge) badge.textContent=`${arr.length} open`;
    if(!arr.length){box.innerHTML='<div class="dashboard-empty"><strong>No open student requests.</strong><br><span>New buyer requirements will appear here.</span></div>';return;}
    const ids=arr.map(r=>r.buyerId).filter(Boolean); const buyers={};
    await Promise.all([...new Set(ids)].map(async id=>{try{const s=await get(ref(db,"users/"+id));buyers[id]=s.val()||{};}catch(e){buyers[id]={};}}));
    const responses={};
    const responded={};
    await Promise.all(arr.map(async r=>{try{const s=await get(ref(db,"requestResponses/"+r.id));const val=s.val()||{};responses[r.id]=Object.keys(val).length;responded[r.id]=Object.values(val).some(x=>x&&x.sellerId===uid);}catch(e){responses[r.id]=0;responded[r.id]=false;}}));
    box.innerHTML=arr.map(r=>{
      const b=buyers[r.buyerId]||{};
      return `<article class="request-inbox-card"><span class="category-badge">${esc(r.category||"Other")}</span><h3>${esc(r.title||"Student request")}</h3><p>${esc(r.description||"")}</p><div class="request-inbox-meta"><span>By ${esc(b.name||"Student")} · ${r.budget?"Budget ₹"+esc(r.budget):"Budget flexible"}</span><span class="request-response-count">${responses[r.id]||0} response${responses[r.id]===1?"":"s"}</span></div><div class="order-actions">${responded[r.id]?'<span class="order-note">✓ You already responded</span>':`<button class="request-help-btn" data-request="${esc(r.id)}">I can help</button>`}</div></article>`;
    }).join('');
    box.querySelectorAll('.request-help-btn').forEach(btn=>btn.onclick=async()=>{
      const r=arr.find(x=>x.id===btn.dataset.request); if(!r)return;
      if(r.buyerId===uid){alert("This is your own request.");return;}
      const message=prompt("Message to the student (optional):","I can help with this request."); if(message===null)return;
      try{await set(push(ref(db,"requestResponses/"+r.id)),{sellerId:uid,message:message.trim()||"I can help with this request.",createdAt:Date.now()});btn.textContent="Response sent ✓";btn.disabled=true;}catch(e){console.error(e);alert("Could not send your response.");}
    });
  });
}

function loadSellerOrders(uid){
  const box=$("sellerOrders"); if(!box) return;
  onValue(ref(db,"orders"), async snap=>{
    const all=snap.val()||{};
    const arr=Object.entries(all).map(([id,o])=>({...o,id})).filter(o=>o.sellerId===uid && (o.status||"pending")!=="rejected").sort((a,b)=>(b.createdAt||0)-(a.createdAt||0));
    const pendingCount=arr.filter(o=>(o.status||"pending")==="pending").length;
    const badge=$("pendingOrdersBadge"); if(badge) badge.textContent=`${pendingCount} pending`;
    if(!arr.length){box.innerHTML='<div class="dashboard-empty"><strong>No incoming orders yet.</strong><br><span>When a buyer sends an order request for one of your listings, it will appear here.</span></div>';return;}
    const buyerIds=[...new Set(arr.map(o=>o.buyerId).filter(Boolean))];
    const buyers={};
    await Promise.all(buyerIds.map(async id=>{try{const s=await get(ref(db,"users/"+id));buyers[id]=s.val()||{};}catch(e){buyers[id]={};}}));
    box.innerHTML=arr.map(o=>{
      const b=buyers[o.buyerId]||{};
      const status=o.status||"pending";
      const phone=normalizePhone(b.whatsapp||b.phone||"");
      const msg=encodeURIComponent(`Hi ${b.name||""}, regarding your order request for "${o.title||"item"}" (₹${o.price||""}).`);
      const wa=phone?`<a class="order-action whatsapp" target="_blank" rel="noopener" href="https://wa.me/${phone}?text=${msg}">WhatsApp buyer</a>`:'';
      return `<article class="seller-order-card"><div class="seller-order-top"><div><span class="category-badge">${esc(categoryName(o.category))}</span><h3>${esc(o.title||"Listing")}</h3></div><strong>₹${esc(o.price||"—")}</strong></div><p>${esc(o.message||"No message from buyer.")}</p><div class="seller-order-meta"><span>Buyer: <b>${esc(b.name||"Student")}</b></span><span class="order-status ${esc(status)}">${esc(status)}</span></div><div class="order-actions">${status==='pending'?`<button class="order-accept" data-order="${esc(o.id)}">Accept</button><button class="order-reject" data-order="${esc(o.id)}">Reject</button>`:''}${wa}</div></article>`;
    }).join('');
    box.querySelectorAll('.order-accept').forEach(btn=>btn.onclick=async()=>{await update(ref(db,'orders/'+btn.dataset.order),{status:'accepted',updatedAt:Date.now()});});
    box.querySelectorAll('.order-reject').forEach(btn=>btn.onclick=async()=>{if(confirm('Reject this order request?')) await update(ref(db,'orders/'+btn.dataset.order),{status:'rejected',updatedAt:Date.now()});});
  });
}

$("addBtn").onclick = async () => {
  if(currentUserRole !== "seller") return alert("Only sellers can upload listings.");
  const category=$("categoryInput").value, title=$("titleInput").value.trim(), price=$("priceInput").value.trim();
  if(!category || !title || !price) { $("uploadMsg").textContent="Please fill category, title and price."; return; }
  const isNotes=category==="notes";
  const file=isNotes ? $("pdfInput").files[0] : $("imageInput").files[0];
  $("uploadMsg").textContent="Uploading...";
  let imageUrl=null;
  let pdfUrl=null;
  if(file){
    const fd=new FormData(); fd.append("file",file); fd.append("upload_preset","student_art_hub");
    const endpoint=isNotes ? "https://api.cloudinary.com/v1_1/dmq5tdywr/raw/upload" : "https://api.cloudinary.com/v1_1/dmq5tdywr/image/upload";
    try { const r=await fetch(endpoint,{method:"POST",body:fd}); const d=await r.json(); if(!r.ok) throw new Error(d.error?.message||"Upload failed"); if(isNotes) pdfUrl=d.secure_url; else imageUrl=d.secure_url; } catch(e){ $("uploadMsg").textContent="File upload failed."; return; }
  }
  const newRef=push(ref(db,"listings"));
  let location=$("areaInput").value.trim(); if($("streetInput").value.trim()) location += (location?", ":"")+$("streetInput").value.trim(); if($("pincodeInput").value.trim()) location += " - "+$("pincodeInput").value.trim();
  await set(newRef,{id:newRef.key,sellerId:auth.currentUser.uid,title,price,category,parentCategory:["painting","sketch","digital","craft","photography"].includes(category)?"art":category,class:$("classInput").value||null,subject:isNotes?$("subjectInput").value.trim()||null:null,board:isNotes?$("boardInput").value.trim()||null:null,location:location||"Nearby Area",imageUrl,pdfUrl,timestamp:Date.now()});
  $("uploadMsg").textContent="Listing uploaded successfully.";
  ["titleInput","priceInput","areaInput","streetInput","pincodeInput","subjectInput","boardInput"].forEach(id=>$(id).value=""); $("categoryInput").value=""; $("classInput").value=""; $("imageInput").value=""; $("pdfInput").value=""; $("notesFields").classList.add("hidden"); $("imageInput").classList.remove("hidden"); $("pdfInput").classList.add("hidden");
};

onAuthStateChanged(auth,user=>{ if(!user){ window.location.href="home.html"; return; } if(userMenu) userMenu.style.display="block"; loadDashboard(user); });
