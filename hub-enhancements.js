// Shared marketplace polish: saved items, product details and Buy Now.
(function(){
  const savedKey="hub_saved_listings";
  const getSaved=()=>JSON.parse(localStorage.getItem(savedKey)||"[]");
  const setSaved=a=>localStorage.setItem(savedKey,JSON.stringify(a));
  const esc=s=>String(s??"").replace(/[&<>'"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]));

  window.hubToggleSaved=async function(id){
    if(!id)return;
    if(window.hubRequireAuth && !(await window.hubRequireAuth()))return;
    const a=getSaved(); const i=a.indexOf(String(id));
    if(i>=0)a.splice(i,1); else a.push(String(id));
    setSaved(a); window.dispatchEvent(new CustomEvent("hub:saved"));
  };
  window.hubIsSaved=id=>getSaved().includes(String(id));

  window.hubOpenDetails=function(item){
    let m=document.getElementById("hubProductModal");
    if(!m){
      m=document.createElement("div"); m.id="hubProductModal"; m.className="hub-modal";
      m.innerHTML='<div class="hub-modal-card"><button class="hub-modal-close" aria-label="Close">×</button><div id="hubModalBody"></div></div>';
      document.body.appendChild(m);
      m.addEventListener("click",e=>{if(e.target===m||e.target.closest(".hub-modal-close"))m.classList.remove("open")});
    }
    const saved=window.hubIsSaved(item.id);
    document.getElementById("hubModalBody").innerHTML=`<div class="detail-layout">
      ${item.imageUrl?`<img class="detail-image" src="${esc(item.imageUrl)}" alt="${esc(item.title||"Listing")}">`:`<div class="detail-image pdf-placeholder">📄<span>Study material</span></div>`}
      <div class="detail-copy"><span class="category-badge">${esc(window.hubCategoryName(item.category))}</span>
      <h2>${esc(item.title||"Untitled")}</h2><div class="detail-price">₹${esc(item.price||"—")}</div>
      <p>${item.class?`Class ${esc(item.class)} · `:""}${esc(item.subject||item.description||"Student listing")}</p>
      <p class="detail-location">📍 ${esc(item.location||"Nearby Area")}</p>
      <div class="detail-actions"><button onclick="window.hubToggleSaved('${esc(item.id)}')">${saved?"♥ Saved":"♡ Save"}</button><button class="primary" onclick="window.hubBuy(window.__hubListings?.find(x=>x.id==='${esc(item.id)}'))">Buy Now</button></div></div></div>`;
    m.classList.add("open");
  };

  window.hubCategoryName=c=>({painting:"Painting",sketch:"Sketch",digital:"Digital Art",craft:"Craft",photography:"Photography",art:"Art",book:"Book",notes:"Handwritten Notes",artist:"Artist Showcase"})[c]||"Listing";

  window.hubBuy=async function(item){
    if(!item)return;
    try{
      const {getAuth}=await import("https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js");
      const {getDatabase,ref,get}=await import("https://www.gstatic.com/firebasejs/12.6.0/firebase-database.js");
      const auth=getAuth();
      if(!auth.currentUser){alert("Please login first to buy this item.");return;}
      if(auth.currentUser.uid===item.sellerId){alert("You cannot buy your own listing.");return;}
      const db=getDatabase();
      const snap=await get(ref(db,"users/"+item.sellerId));
      const seller=snap.val()||{};
      let phone=seller.whatsapp||seller.phone||seller.whatsappPhone||item.sellerPhone||"";
      let clean=String(phone).replace(/\D/g,"");
      if(clean.length===10) clean="91"+clean;
      if(!clean){alert("This seller has not added a WhatsApp/phone number yet.");return;}
      const message=`Hello 👋\nI am interested in buying your listing on Student Art Hub.\n\n📦 Item: ${item.title||"Listing"}\n💰 Price: ₹${item.price||"—"}\n\nPlease confirm availability and pickup/payment details.`;
      window.open(`https://wa.me/${clean}?text=${encodeURIComponent(message)}`,"_blank","noopener");
    }catch(e){console.error(e);alert("Could not contact the seller right now.");}
  };

  window.hubRenderSavedCount=function(){const badge=document.getElementById("savedCount");if(badge){const n=getSaved().length;badge.textContent=n;badge.hidden=!n;}};
  document.addEventListener("DOMContentLoaded",window.hubRenderSavedCount);
  window.addEventListener("hub:saved",window.hubRenderSavedCount);
})();
