/* Marketplace V3: smart search, order requests, student requests and ratings. */
(function(){
  const LS = 'hub_marketplace_v3';
  const state = JSON.parse(localStorage.getItem(LS)||'{}');
  const save=()=>localStorage.setItem(LS,JSON.stringify(state));
  const esc=s=>String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  let auth=null, db=null, fbReady=null;
  async function firebase(){
    if(fbReady) return fbReady;
    fbReady=(async()=>{
      try{
        const A=await import('https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js');
        const AU=await import('https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js');
        const D=await import('https://www.gstatic.com/firebasejs/12.6.0/firebase-database.js');
        const apps=A.getApps();
        const app=apps.length?apps[0]:A.initializeApp({apiKey:'AIzaSyBxD8SLW9z8ndgAJprcGolqivlNUZVYZxc',authDomain:'art-hub-77eb1.firebaseapp.com',databaseURL:'https://art-hub-77eb1-default-rtdb.firebaseio.com',projectId:'art-hub-77eb1',storageBucket:'art-hub-77eb1.firebasestorage.app',messagingSenderId:'1097170910592',appId:'1:1097170910592:web:efafe19f6fc24f40881565'});
        auth=AU.getAuth(app); db=D.getDatabase(app); return {AU,D};
      }catch(e){console.error(e);return null;}
    })();
    return fbReady;
  }
  function modal(id,title,body){
    let m=document.getElementById(id); if(!m){m=document.createElement('div');m.id=id;m.className='v3-modal';document.body.appendChild(m);}
    m.innerHTML=`<div class="v3-modal-card"><button class="v3-close" aria-label="Close">×</button><div class="v3-modal-content"><span class="eyebrow">Student marketplace</span><h2>${title}</h2>${body}</div></div>`;
    m.style.display='flex'; m.onclick=e=>{if(e.target===m||e.target.closest('.v3-close'))m.style.display='none'}; return m;
  }
  async function requireLogin(){const f=await firebase(); if(!f||!auth?.currentUser){alert('Please login first to continue.');document.getElementById('authSection')?.scrollIntoView({behavior:'smooth'});return false}return true}

  window.hubOpenOrder=function(item){
    if(!item)return;
    modal('orderRequestModal',`Request this item`, `<div class="v3-product-mini"><div><b>${esc(item.title||'Listing')}</b><span>${esc(item.category||'Student listing')}</span></div><strong>₹${esc(item.price||'—')}</strong></div><label>Message to seller</label><textarea id="v3OrderMessage" rows="4" placeholder="Hi! I would like to buy this. Please confirm availability and pickup/payment details."></textarea><button class="v3-primary" id="v3SendOrder">Send Order Request</button><p class="v3-note">The seller will receive your request. WhatsApp can still be used for final coordination.</p>`);
    document.getElementById('v3SendOrder').onclick=async()=>{
      if(!(await requireLogin()))return;
      const f=await firebase(); const D=f.D; const uid=auth.currentUser.uid;
      if(uid===item.sellerId){alert('You cannot buy your own listing.');return;}
      const order={buyerId:uid,sellerId:item.sellerId||'',listingId:item.id||'',title:item.title||'',price:item.price||'',category:item.category||'',message:document.getElementById('v3OrderMessage').value.trim(),status:'pending',createdAt:Date.now()};
      try{await D.set(D.push(D.ref(db,'orders')),order); state.orders=(state.orders||0)+1; save(); document.getElementById('orderRequestModal').style.display='none'; alert('Order request sent successfully.');
      }catch(e){console.error(e);alert('Could not send the order request. Please try again.');}
    };
  };
  window.hubBuy=window.hubOpenOrder;

  function installSearch(){
    const panel=document.querySelector('.search-panel'); if(!panel||document.getElementById('v3SearchExtras'))return;
    const x=document.createElement('div');x.id='v3SearchExtras';x.className='v3-search-extras';x.innerHTML=`<select id="v3Sort"><option value="new">Newest first</option><option value="low">Price: low to high</option><option value="high">Price: high to low</option></select><select id="v3Price"><option value="">Any price</option><option value="500">Under ₹500</option><option value="1000">Under ₹1,000</option><option value="2000">Under ₹2,000</option></select>`;panel.appendChild(x);
    const run=()=>{const q=(document.getElementById('searchBar')?.value||'').trim().toLowerCase();const max=Number(document.getElementById('v3Price')?.value||0);const sort=document.getElementById('v3Sort')?.value||'new'; const cards=[...document.querySelectorAll('#productContainer .card')];cards.forEach(c=>{const text=c.innerText.toLowerCase();const price=Number((c.innerText.match(/₹\s*([\d,.]+)/)||[])[1]?.replace(/,/g,'')||0);const ok=!q||text.includes(q);const okP=!max||price<=max;c.style.display=ok&&okP?'':'none';});if(sort!=='new'){const box=document.getElementById('productContainer');const arr=cards.filter(c=>c.style.display!=='none');arr.sort((a,b)=>{const pa=Number((a.innerText.match(/₹\s*([\d,.]+)/)||[])[1]?.replace(/,/g,'')||0),pb=Number((b.innerText.match(/₹\s*([\d,.]+)/)||[])[1]?.replace(/,/g,'')||0);return sort==='low'?pa-pb:pb-pa});arr.forEach(c=>box.appendChild(c));}};
    document.getElementById('searchBar')?.addEventListener('input',run);document.getElementById('searchBtn')?.addEventListener('click',run);document.getElementById('v3Sort').onchange=run;document.getElementById('v3Price').onchange=run;
  }

  function installRequests(){
    if(!document.getElementById('productContainer')||document.getElementById('studentRequests'))return;
    const sec=document.createElement('section');sec.id='studentRequests';sec.className='v3-section';sec.innerHTML=`<div class="v3-section-head"><div><span class="eyebrow">Community board</span><h2>What students need</h2><p>Can't find what you're looking for? Post a request and let student creators respond.</p></div><button class="v3-primary" id="postRequestBtn">+ Post a Request</button></div><div id="requestList" class="v3-request-grid"><div class="v3-empty">Loading requests…</div></div>`;
    const donate=document.getElementById('donate');donate?.parentNode.insertBefore(sec,donate);if(!donate)document.getElementById('productContainer').parentNode.appendChild(sec);
    document.getElementById('postRequestBtn').onclick=()=>{modal('requestModal','Post what you need',`<label>What do you need?</label><input id="v3ReqTitle" placeholder="e.g. Class 12 Economics notes"><label>Category</label><select id="v3ReqCat"><option>Books</option><option>Notes</option><option>Art</option><option>Sketch</option><option>Digital Art</option><option>Craft</option><option>Other</option></select><label>Description</label><textarea id="v3ReqDesc" rows="4" placeholder="Tell creators what you need…"></textarea><label>Budget <span class="v3-muted">(optional)</span></label><input id="v3ReqBudget" type="number" min="0" placeholder="₹"><button class="v3-primary" id="v3PostRequest">Post Request</button>`);document.getElementById('v3PostRequest').onclick=postRequest};
    renderRequests();
  }
  async function postRequest(){if(!(await requireLogin()))return;const title=document.getElementById('v3ReqTitle').value.trim(),desc=document.getElementById('v3ReqDesc').value.trim(),cat=document.getElementById('v3ReqCat').value,budget=document.getElementById('v3ReqBudget').value;if(!title||!desc){alert('Please add a title and description.');return}const f=await firebase(),D=f.D;try{await D.set(D.push(D.ref(db,'requests')),{buyerId:auth.currentUser.uid,title,category:cat,description:desc,budget:budget||'',status:'open',createdAt:Date.now()});document.getElementById('requestModal').style.display='none';alert('Your request is live on the community board.');renderRequests()}catch(e){console.error(e);alert('Could not post request.')}}
  async function renderRequests(){const box=document.getElementById('requestList');if(!box)return;const f=await firebase();if(!f){box.innerHTML='<div class="v3-empty">Requests are temporarily unavailable.</div>';return}try{const s=await f.D.get(f.D.ref(db,'requests'));const data=s.val()||{};const arr=Object.entries(data).map(([id,x])=>({...x,id})).filter(x=>x.status!=='fulfilled').sort((a,b)=>(b.createdAt||0)-(a.createdAt||0)).slice(0,6);box.innerHTML=arr.length?arr.map(x=>`<article class="v3-request-card"><span class="category-badge">${esc(x.category)}</span><h3>${esc(x.title)}</h3><p>${esc(x.description)}</p><div class="v3-request-foot"><span>${x.budget?'Budget ₹'+esc(x.budget):'Budget flexible'}</span><button class="v3-help" data-id="${x.id}">I can help</button></div></article>`).join(''):'<div class="v3-empty">No open requests yet. Be the first to post one.</div>';box.querySelectorAll('.v3-help').forEach(b=>b.onclick=()=>respondRequest(b.dataset.id,data[b.dataset.id]));}catch(e){box.innerHTML='<div class="v3-empty">Could not load requests.</div>'}}
  async function respondRequest(id,r){if(!(await requireLogin()))return;const f=await firebase();if(!f)return; if(auth.currentUser.uid===r.buyerId){alert('This is your own request.');return}try{const msg=prompt('Message to the requester (optional):','I can help with this request.'); if(msg===null)return; await f.D.set(f.D.push(f.D.ref(db,'requestResponses/'+id)),{sellerId:auth.currentUser.uid,message:msg.trim()||'I can help with this request.',createdAt:Date.now()});alert('Response sent to the requester.');}catch(e){alert('Could not send your response.')}}

  function installRatings(){
    if(!document.getElementById('productContainer')||document.getElementById('v3Reviews'))return;
    const sec=document.createElement('section');sec.id='v3Reviews';sec.className='v3-section v3-reviews';sec.innerHTML=`<div class="v3-section-head"><div><span class="eyebrow">Trust matters</span><h2>Seller ratings & reviews</h2><p>Share useful feedback after dealing with a student seller.</p></div><button class="v3-outline" id="rateSellerBtn">⭐ Rate a Seller</button></div><div id="v3ReviewSummary" class="v3-review-summary"><b>Build trust, one review at a time.</b><span>Ratings will appear here as the community grows.</span></div>`;const sec2=document.getElementById('studentRequests');sec2?.parentNode.insertBefore(sec,sec2.nextSibling);if(!sec2)document.getElementById('productContainer').parentNode.appendChild(sec);document.getElementById('rateSellerBtn').onclick=rateSeller;loadReviews();
  }
  async function rateSeller(){if(!(await requireLogin()))return;const f=await firebase();if(!f)return;let sellers=[];try{const s=await f.D.get(f.D.ref(db,'users'));const u=s.val()||{};sellers=Object.entries(u).filter(([id,x])=>x.role==='seller').map(([id,x])=>({id,name:x.name||'Student seller'}));}catch(e){}modal('ratingModal','Rate a student seller',`<label>Seller</label><select id="v3Seller">${sellers.length?sellers.map(x=>`<option value="${esc(x.id)}">${esc(x.name)}</option>`).join(''):'<option value="">No sellers found</option>'}</select><label>Rating</label><div class="v3-stars" id="v3Stars"><button data-s="1">☆</button><button data-s="2">☆</button><button data-s="3">☆</button><button data-s="4">☆</button><button data-s="5">☆</button></div><input id="v3Review" placeholder="Short review (optional)"><button class="v3-primary" id="v3SubmitReview">Submit Review</button>`);let stars=0;document.querySelectorAll('#v3Stars button').forEach(b=>b.onclick=()=>{stars=Number(b.dataset.s);document.querySelectorAll('#v3Stars button').forEach(x=>x.textContent=Number(x.dataset.s)<=stars?'★':'☆')});document.getElementById('v3SubmitReview').onclick=async()=>{if(!stars)return alert('Choose a rating first.');const sellerId=document.getElementById('v3Seller').value;if(!sellerId)return;try{await f.D.set(f.D.push(f.D.ref(db,'reviews/'+sellerId)),{buyerId:auth.currentUser.uid,stars,review:document.getElementById('v3Review').value.trim(),createdAt:Date.now()});document.getElementById('ratingModal').style.display='none';alert('Thanks for helping the community.');loadReviews()}catch(e){alert('Could not submit review.')}}}
  async function loadReviews(){const box=document.getElementById('v3ReviewSummary');if(!box)return;const f=await firebase();if(!f)return;try{const s=await f.D.get(f.D.ref(db,'reviews'));const all=s.val()||{};let count=0,sum=0;Object.values(all).forEach(group=>Object.values(group||{}).forEach(r=>{count++;sum+=Number(r.stars||0)}));if(count)box.innerHTML=`<b>⭐ ${(sum/count).toFixed(1)} / 5</b><span>${count} community review${count===1?'':'s'} submitted</span>`}catch(e){}}

  document.addEventListener('DOMContentLoaded',()=>{installSearch();installRequests();installRatings();});
})();
