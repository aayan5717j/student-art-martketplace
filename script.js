function signup(username){
  localStorage.setItem('user', username);
  updateAuthUI();
}
function login(username){
  localStorage.setItem('user', username);
  updateAuthUI();
}
function logout(){
  localStorage.removeItem('user');
  updateAuthUI();
}
document.addEventListener('DOMContentLoaded', ()=>{updateAuthUI()});

// Upload persistence
function loadUploads(){
  const data = JSON.parse(localStorage.getItem('uploads')||'[]');
  const list = document.getElementById('uploadsList');
  if(list){
    list.innerHTML='';
    data.forEach(u=>{
      const li=document.createElement('li');
      li.textContent=u;
      list.appendChild(li);
    });
  }
}
function saveUpload(item){
  const data = JSON.parse(localStorage.getItem('uploads')||'[]');
  data.push(item);
  localStorage.setItem('uploads', JSON.stringify(data));
  loadUploads();
}
document.getElementById('uploadForm')?.addEventListener('submit', e=>{
  e.preventDefault();
  const val = document.getElementById('uploadInput').value;
  if(val){ saveUpload(val); e.target.reset(); }
});
document.addEventListener('DOMContentLoaded', loadUploads);
// Add this to your script.js
document.getElementById("searchBar")?.addEventListener("input", (e) => {
    const term = e.target.value.toLowerCase();
    const cards = document.querySelectorAll(".card, .item");
    
    cards.forEach(card => {
        const title = card.querySelector("h4, h3")?.innerText.toLowerCase();
        if(title.includes(term)) {
            card.style.display = "block";
            card.style.animation = "fadeIn 0.5s";
        } else {
            card.style.display = "none";
        }
    });
});

// Add this animation to your styles.css
/*
@keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
}
*/
