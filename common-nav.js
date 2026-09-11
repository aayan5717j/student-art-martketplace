/* Shared navigation: one compact header for every page. */
(function(){
  const menuHTML = `
    <header class="global-site-header" id="globalSiteHeader">
      <div class="global-header-inner">
        <a class="global-brand" href="home.html" aria-label="Student Art Hub home">
          <span class="global-brand-mark">SA</span>
          <span class="global-brand-copy"><strong>Student Art Hub</strong><small>Student marketplace</small></span>
        </a>
        <div id="userMenu" class="global-user-menu" style="display:none">
          <button id="menuBtn" class="global-menu-btn" aria-label="Open navigation menu" aria-expanded="false" type="button">⋮</button>
          <div id="dropdown" class="global-dropdown" role="menu">
            <a class="dropdown-item" href="home.html">🏠 <span>Home</span></a>
            <a class="dropdown-item" href="art.html">🎨 <span>Art Showcase</span></a>
            <a class="dropdown-item" href="books.html">📚 <span>Book Exchange</span></a>
            <a class="dropdown-item" href="sketches.html">✏️ <span>Custom Sketches</span></a>
            <a class="dropdown-item" href="notes.html">📝 <span>Handwritten Notes</span></a>
            <a class="dropdown-item" href="donations.html">❤️ <span>Donations</span></a>
            <div class="menu-divider"></div>
            <a class="dropdown-item" href="dashboard.html">📊 <span>Dashboard</span></a>
            <a class="dropdown-item" href="profile.html">👤 <span>My Profile</span></a>
            <a class="dropdown-item" href="buyer-dashboard.html">📦 <span>My Orders</span></a>
            <a class="dropdown-item" href="saved.html">♡ <span>Saved Items</span><b id="savedCount" class="saved-count" hidden>0</b></a>
            <a class="dropdown-item" href="contact.html">💬 <span>Contact</span></a>
            <div class="menu-divider"></div>
            <button id="logoutBtn" class="dropdown-item logout-item" type="button">↪ <span>Logout</span></button>
          </div>
        </div>
        <span id="dashUserMenu" hidden></span><button id="dashMenuBtn" hidden></button><div id="dashDropdown" hidden></div><button id="dashLogoutBtn" hidden></button>
      </div>
    </header>`;

  function init(){
    document.querySelectorAll('body > header, body > .site-header').forEach(h=>h.remove());
    if(!document.getElementById('globalSiteHeader')) document.body.insertAdjacentHTML('afterbegin',menuHTML);
    const menu=document.getElementById('userMenu'), btn=document.getElementById('menuBtn'), drop=document.getElementById('dropdown');
    if(!menu||!btn||!drop)return;
    const close=()=>{drop.classList.remove('open');btn.setAttribute('aria-expanded','false');};
    btn.onclick=e=>{e.stopPropagation();const open=!drop.classList.contains('open');drop.classList.toggle('open',open);btn.setAttribute('aria-expanded',String(open));};
    document.addEventListener('click',e=>{if(!menu.contains(e.target))close();});
    drop.querySelectorAll('a').forEach(a=>a.addEventListener('click',close));
    document.getElementById('logoutBtn')?.addEventListener('click',async()=>{
      try{localStorage.removeItem('currentUser');localStorage.removeItem('user');localStorage.removeItem('loggedInUser');}catch(_){}
      try{const {getAuth,signOut}=await import('https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js');await signOut(getAuth());}catch(_){}
      location.href='home.html';
    });
    const page=location.pathname.split('/').pop()||'home.html';
    drop.querySelectorAll('a.dropdown-item').forEach(a=>{if(a.getAttribute('href')===page)a.classList.add('current');});
    if(page!=='home.html'&&page!=='login.html'&&page!=='index.html'&&!document.querySelector('.dashboard-back,.back-home-btn')){
      const main=document.querySelector('main,.container');
      if(main){const back=document.createElement('a');back.href='home.html';back.className='back-home-btn';back.innerHTML='<span aria-hidden="true">←</span> Back to Home';main.insertBefore(back,main.firstChild);}
    }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
  // Show the three-dot account menu only after Firebase confirms an authenticated session.
  import('https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js').then(({initializeApp,getApps})=>{
    const c={apiKey:'AIzaSyBxD8SLW9z8ndgAJprcGolqivlNUZVYZxc',authDomain:'art-hub-77eb1.firebaseapp.com',databaseURL:'https://art-hub-77eb1-default-rtdb.firebaseio.com',projectId:'art-hub-77eb1',storageBucket:'art-hub-77eb1.firebasestorage.app',messagingSenderId:'1097170910592',appId:'1:1097170910592:web:efafe19f6fc24f40881565'};
    const app=getApps().length?getApps()[0]:initializeApp(c);
    return import('https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js').then(({getAuth,onAuthStateChanged})=>{
      onAuthStateChanged(getAuth(app),u=>{const m=document.getElementById('userMenu');if(m)m.style.display=u?'block':'none';});
    });
  }).catch(()=>{});
})();
