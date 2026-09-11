
import {initializeApp} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import {getAuth,onAuthStateChanged} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";
import {getDatabase,ref,onValue,get,update} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-database.js";
const app=initializeApp({apiKey:"AIzaSyBxD8SLW9z8ndgAJprcGolqivlNUZVYZxc",authDomain:"art-hub-77eb1.firebaseapp.com",databaseURL:"https://art-hub-77eb1-default-rtdb.firebaseio.com",projectId:"art-hub-77eb1",storageBucket:"art-hub-77eb1.firebasestorage.app",messagingSenderId:"1097170910592",appId:"1:1097170910592:web:efafe19f6fc24f40881565"});
const auth=getAuth(app),db=getDatabase(app),esc=v=>String(v??"").replace(/[&<>\"]/g,x=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[x]));
function normalizePhone(v){let p=String(v||"").replace(/\D/g,"");if(p.length===10)p="91"+p;return p;}
async function loadMyRequests(uid){
  const box=document.getElementById("myRequestsBox"); if(!box)return;
  onValue(ref(db,"requests"),async snap=>{
    const arr=Object.entries(snap.val()||{}).map(([id,r])=>({...r,id})).filter(r=>r.buyerId===uid).sort((a,b)=>(b.createdAt||0)-(a.createdAt||0));
    if(!arr.length){box.innerHTML='<div class="empty">You have not posted any requests yet.<br><br><a class="market-btn" href="home.html">Post a request</a></div>';return;}
    const html=[];
    for(const r of arr){
      let responses={}; try{const s=await get(ref(db,"requestResponses/"+r.id));responses=s.val()||{};}catch(e){}
      const fulfilled=r.status==='fulfilled';
      // Once a seller is selected, ONLY that seller's response is shown.
      const items=Object.entries(responses)
        .filter(([id])=>!fulfilled || id===r.acceptedResponseId)
        .sort((a,b)=>(b[1].createdAt||0)-(a[1].createdAt||0));
      let sellerMap={};
      await Promise.all(items.map(async([id,x])=>{
        if(!x.sellerId)return;
        try{const ss=await get(ref(db,"users/"+x.sellerId));sellerMap[x.sellerId]=ss.val()||{};}catch(e){sellerMap[x.sellerId]={};}
      }));
      const selectedResponse=fulfilled && items.length ? items[0] : null;
      const selectedSeller=selectedResponse ? (sellerMap[selectedResponse[1].sellerId]||{}) : null;
      const selectedName=selectedSeller ? (selectedSeller.name||'Student creator') : '';
      const selectedPhone=selectedSeller ? normalizePhone(selectedSeller.whatsapp||selectedSeller.phone||'') : '';
      const selectedWa=selectedPhone ? `https://wa.me/${selectedPhone}?text=${encodeURIComponent(`Hi ${selectedName}, regarding my request: "${r.title||'Student request'}".`)}` : '';

      html.push(`<article class="buyer-order request-order-card ${fulfilled?'is-fulfilled':''}">
        <div class="buyer-order-head">
          <div><span class="eyebrow">${esc(r.category||"Request")}</span><h3>${esc(r.title||"My request")}</h3></div>
          <span class="status ${fulfilled?'completed':'pending'}">${fulfilled?'seller selected':'open'}</span>
        </div>
        <p>${esc(r.description||"")}</p>
        <div class="order-note request-meta-line"><span>${r.budget?'Budget ₹'+esc(r.budget):'Budget flexible'}</span><span>${items.length} response${items.length===1?'':'s'}</span></div>
        ${items.length ? items.map(([id,x])=>{
          const seller=sellerMap[x.sellerId]||{};
          const sellerName=seller.name||'Student creator';
          const phone=normalizePhone(seller.whatsapp||seller.phone||'');
          const wa=phone?`<a class="wa-btn" href="https://wa.me/${phone}?text=${encodeURIComponent(`Hi ${sellerName}, regarding my request: "${r.title||'Student request'}".`)}" target="_blank" rel="noopener">WhatsApp</a>`:'';
          const chosen=r.acceptedResponseId===id;
          return `<div class="response-card ${chosen?'chosen-response':''}">
            <div class="seller-row"><div class="seller-avatar">${esc((sellerName[0]||'S').toUpperCase())}</div><div class="seller-info"><b>${esc(sellerName)}</b><span>${esc(seller.speciality||'Student creator')}</span></div>${chosen?'<span class="status accepted">Selected seller</span>':''}</div>
            <p>${esc(x.message||"I can help with this request.")}</p>
            <div class="response-actions"><span class="order-note">${new Date(x.createdAt||Date.now()).toLocaleString()}</span>${!fulfilled?`<button class="choose-seller-btn" data-request="${esc(r.id)}" data-response="${esc(id)}">Choose seller</button>`:''}${fulfilled&&chosen?wa:''}</div>
          </div>`;
        }).join(''):'<div class="order-note no-response">No sellers have responded yet. Your request is still open.</div>'}
        ${fulfilled?`<div class="selected-banner"><strong>✓ Connected with ${esc(selectedName||'your selected seller')}</strong><span>Other seller responses are hidden because you selected this seller.</span>${selectedWa?`<a href="${selectedWa}" target="_blank" rel="noopener">Continue on WhatsApp →</a>`:''}</div>`:''}
      </article>`);
    }
    box.innerHTML=html.join("");
    box.querySelectorAll('.choose-seller-btn').forEach(btn=>btn.onclick=async()=>{
      if(!confirm('Choose this seller? Your request will close and only this seller will remain connected to you.'))return;
      btn.disabled=true; btn.textContent='Selecting…';
      try{
        await update(ref(db,'requests/'+btn.dataset.request),{status:'fulfilled',acceptedResponseId:btn.dataset.response,acceptedAt:Date.now()});
      }catch(e){console.error(e);alert('Could not choose this seller right now.');btn.disabled=false;btn.textContent='Choose seller';}
    });
  });
}
function load(uid){onValue(ref(db,"orders"),snap=>{const arr=Object.entries(snap.val()||{}).map(([id,o])=>({...o,id})).filter(o=>o.buyerId===uid).sort((a,b)=>(b.createdAt||0)-(a.createdAt||0));const box=document.getElementById("ordersBox");if(!arr.length){box.innerHTML='<div class="empty">No order requests yet.<br><br><a class="market-btn" href="home.html">Browse marketplace</a></div>';return}box.innerHTML=arr.map(o=>`<article class="buyer-order"><div class="buyer-order-head"><div><span class="eyebrow">${esc(o.category||"Marketplace")}</span><h3>${esc(o.title||"Listing")}</h3></div><span class="price">₹${esc(o.price||"—")}</span></div><p>${esc(o.message||"No message")}</p><div style="display:flex;justify-content:space-between;align-items:center;gap:10px"><span class="status ${esc(o.status||"pending")}">${esc(o.status||"pending")}</span><span class="order-note">${o.updatedAt?"Updated ":"Sent "}${new Date(o.updatedAt||o.createdAt||Date.now()).toLocaleString()}</span></div></article>`).join("")}); loadMyRequests(uid)}
onAuthStateChanged(auth,u=>{if(!u){location.href="home.html";return}load(u.uid)});
