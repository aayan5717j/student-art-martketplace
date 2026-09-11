// Student Art Hub polish + saved items + product details
(function(){
  const savedKey="hub_saved_listings";
  const getSaved=()=>JSON.parse(localStorage.getItem(savedKey)||'[]');
  const setSaved=a=>localStorage.setItem(savedKey,JSON.stringify(a));
  window.hubhubToggleSaved=function(id){
    if(!id)return;
    const a=getSaved(); const i=a.indexOf(id);
    if(i>=0)a.splice(i,1); else a.push(id);
    setSaved(a); window.dispatchEvent(new CustomEvent('hub:saved'));
  };
  window.hubhubIsSaved=id=>getSaved().includes(id);
  window.hubhubOpenDetails=function(item){
    const esc=s=>String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
    let m=document.getElementById('hubhubProductModal');
    if(!m){m=document.createElement('div');m.id='hubhubProductModal';m.className='hub-modal';m.innerHTML='<div class="hub-modal-card"><button class="hub-modal-close" aria-label="Close">×</button><div id="hubhubModalBody"></div></div>';document.body.appendChild(m);m.addEventListener('click',e=>{if(e.target===m||e.target.closest('.hub-modal-close'))m.classList.remove('open')});}
    const saved=window.hubhubIsSaved(item.id);
    document.getElementById('hubhubModalBody').innerHTML=`<div class="detail-layout"><img class="detail-image" src="${esc(item.imageUrl||'https://via.placeholder.com/700x500?text=Student%20Art%20Hub')}" alt="${esc(item.title||'Listing')}"><div class="detail-copy"><span class="category-badge">${esc(window.hubhubCategoryName?.(item.category)||item.category||'Listing')}</span><h2>${esc(item.title||'Untitled')}</h2><div class="detail-price">₹${esc(item.price||'—')}</div><p>${item.class?'Class '+esc(item.class)+' · ':''}${esc(item.subject||'Student listing')}</p><p class="detail-location">📍 ${esc(item.location||'Nearby Area')}</p><div class="detail-actions"><button onclick='window.hubhubToggleSaved("${esc(item.id)}")'>${saved?'♥ Saved':'♡ Save'}</button><button class="primary" onclick='window.contactSeller&&window.contactSeller("${esc(item.sellerId)}","${esc(item.title)}","${esc(item.price)}")'>Buy / Contact</button></div></div></div>`;
    m.classList.add('open');
  };
  window.hubhubCategoryName=c=>({painting:'Painting',sketch:'Sketch',digital:'Digital Art',craft:'Craft',photography:'Photography',art:'Art',book:'Book',notes:'Handwritten Notes'})[c]||'Listing';
  window.hubhubRenderEnhancements=function(){
    const saved=getSaved(); const badge=document.getElementById('savedCount'); if(badge){badge.textContent=saved.length;badge.hidden=!saved.length;}
    document.querySelectorAll('[data-save-id]').forEach(b=>{const yes=window.hubhubIsSaved(b.dataset.saveId);b.classList.toggle('saved',yes);b.textContent=yes?'♥':'♡';b.title=yes?'Remove from saved':'Save item';});
  };
  window.hubhubShowSaved=function(){
    const ids=getSaved();
    const items=window.__hubListings||[]; const saved=items.filter(x=>ids.includes(x.id));
    const c=document.getElementById('productContainer'); if(!c)return;
    if(!saved.length){c.innerHTML='<div class="empty-state"><div>♡</div><h3>No saved items yet</h3><p>Tap the heart on a listing to save it here.</p></div>';return;}
    window.hubhubRenderCards(saved,c);
  };
  window.hubhubRenderCards=function(items,c){
    const esc=s=>String(s??'').replace(/[&<>'"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
    c.innerHTML=items.map(item=>`<article class="market-card hub-product-card"><div class="market-image-wrap"><img src="${esc(item.imageUrl||'https://via.placeholder.com/600x420?text=Student%20Art%20Hub')}" alt="${esc(item.title||'Student listing')}" loading="lazy"><button class="save-btn ${window.hubhubIsSaved(item.id)?'saved':''}" data-save-id="${esc(item.id)}" aria-label="Save item">${window.hubhubIsSaved(item.id)?'♥':'♡'}</button></div><div class="market-card-body"><div class="card-topline"><span class="category-badge">${esc(window.hubhubCategoryName(item.category))}</span><span class="payment-badge">Student seller</span></div><h3>${esc(item.title||'Untitled')}</h3><div class="rating-line">★★★★★ <span>4.5</span></div><div class="market-bottom"><strong>₹${esc(item.price||'—')}</strong><button class="market-btn" data-view-id="${esc(item.id)}">View details</button></div></div></article>`).join('');
    c.querySelectorAll('[data-save-id]').forEach(b=>b.onclick=()=>{window.hubhubToggleSaved(b.dataset.saveId);window.hubhubRenderCards(window.__hubListings.filter(x=>true),c);});
    c.querySelectorAll('[data-view-id]').forEach(b=>b.onclick=()=>{const item=window.__hubListings.find(x=>x.id===b.dataset.viewId);if(item)window.hubhubOpenDetails(item);});
  };
  document.addEventListener('DOMContentLoaded',()=>{
    const nav=document.getElementById('mainNav');
    if(nav){
      const existing=[...nav.querySelectorAll('a')].map(a=>a.textContent.trim());
      if(!existing.includes('Sellers')){const a=document.createElement('a');a.href='sellers.html';a.textContent='Artists';nav.appendChild(a);}
    }
    const menu=document.getElementById('dropdown');
    if(menu && !menu.querySelector('.saved-menu')){
      const a=document.createElement('a');a.className='dropdown-item saved-menu';a.href='#';a.innerHTML='♡&nbsp; Saved Items <span id="savedCount" class="saved-count" hidden>0</span>';a.onclick=e=>{e.preventDefault();document.getElementById('dropdown').style.display='none';window.hubhubShowSaved();document.getElementById('productContainer')?.scrollIntoView({behavior:'smooth'});};menu.insertBefore(a,menu.querySelector('.logout-item'));
    }
  });
  window.addEventListener('hub:saved',window.hubhubRenderEnhancements);
})();
