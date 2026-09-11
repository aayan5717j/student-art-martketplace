import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-database.js";

const firebaseConfig={apiKey:"AIzaSyBxD8SLW9z8ndgAJprcGolqivlNUZVYZxc",authDomain:"art-hub-77eb1.firebaseapp.com",databaseURL:"https://art-hub-77eb1-default-rtdb.firebaseio.com",projectId:"art-hub-77eb1",storageBucket:"art-hub-77eb1.firebasestorage.app",messagingSenderId:"1097170910592",appId:"1:1097170910592:web:efafe19f6fc24f40881565"};
const app=getApps().length?getApps()[0]:initializeApp(firebaseConfig);
const db=getDatabase(app);
const feed=document.getElementById("hubCategoryFeed") || document.getElementById("CategoryFeed");
if(!feed) throw new Error("Category feed container missing");

const category=feed.dataset.category||"all";
const artTypes=["painting","sketch","digital","craft","photography","art"];
const labels={painting:"Painting",sketch:"Sketch",digital:"Digital Art",craft:"Craft",photography:"Photography",art:"Art",book:"Book",notes:"Handwritten Notes",artist:"Artist Showcase"};
const fallback="https://via.placeholder.com/700x500?text=Student+Listing";
const esc=s=>String(s??"").replace(/[&<>'"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]));
let all=[];

function matches(x){
  if(category==="all") return true;
  if(category==="art") return artTypes.includes(x.category);
  return x.category===category;
}

function render(){
  const q=(document.getElementById("categorySearch")?.value||"").trim().toLowerCase();
  const items=all.filter(matches).filter(x=>{
    const hay=`${x.title||""} ${x.category||""} ${x.subject||""} ${x.board||""} ${x.location||""}`.toLowerCase();
    return !q||hay.includes(q);
  }).sort((a,b)=>(b.timestamp||0)-(a.timestamp||0));

  feed.innerHTML=items.length?items.map(x=>{
    const saved=window.hubIsSaved?.(x.id);
    const pdf=x.pdfUrl?`<a class="text-link small" href="${esc(x.pdfUrl)}" target="_blank" rel="noopener">View PDF</a>`:"";
    return `<article class="market-card">
      <div class="market-image-wrap">
        ${x.imageUrl?`<img src="${esc(x.imageUrl)}" alt="${esc(x.title||"Student listing")}" loading="lazy">`:`<div class="pdf-placeholder">📄<span>Study material</span></div>`}
        <button class="save-btn ${saved?"saved":""}" data-save-id="${esc(x.id)}" aria-label="Save item">${saved?"♥":"♡"}</button>
      </div>
      <div class="market-card-body">
        <div class="card-topline"><span class="category-badge">${esc(labels[x.category]||"Listing")}</span><span class="payment-badge">Student seller</span></div>
        <h3>${esc(x.title||"Untitled")}</h3>
        ${x.subject?`<p class="market-meta">${esc(x.subject)}${x.board?` · ${esc(x.board)}`:""}</p>`:""}
        ${x.class?`<p class="market-meta">Class ${esc(x.class)}</p>`:""}
        <div class="rating-line">★★★★★ <span>4.5</span></div>
        <div class="market-bottom"><strong>₹${esc(x.price||"—")}</strong></div>
        <div class="card-actions">
          <button class="market-btn secondary" data-view-id="${esc(x.id)}">View details</button>
          <button class="market-btn" data-buy-id="${esc(x.id)}">Buy Now</button>
        </div>
        ${pdf}
      </div>
    </article>`;
  }).join(""):`<div class="empty-state"><div>📦</div><h3>No listings here yet</h3><p>There are no listings in this section right now.</p><a class="market-btn" href="dashboard.html">Add a listing</a></div>`;

  feed.querySelectorAll("[data-save-id]").forEach(b=>b.onclick=async()=>{if(window.hubToggleSaved) await window.hubToggleSaved(b.dataset.saveId);render();});
  feed.querySelectorAll("[data-view-id]").forEach(b=>b.onclick=()=>{const x=all.find(i=>i.id===b.dataset.viewId);if(x)window.hubOpenDetails?.(x);});
  feed.querySelectorAll("[data-buy-id]").forEach(b=>b.onclick=()=>{const x=all.find(i=>i.id===b.dataset.buyId);if(x)window.hubBuy?.(x);});
}

onValue(ref(db,"listings"),snap=>{
  all=Object.values(snap.val()||{}).map((x,i)=>({...x,id:String(x.id||i)}));
  window.__hubListings=all;
  render();
});
document.getElementById("categorySearch")?.addEventListener("input",render);
