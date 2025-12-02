// Basic demo script for Student Art Hub
function buyItem(type, price){
    const commission = (type === 'art') ? Math.round(price * 0.10) : 0;
    const sellerGets = price - commission;
    alert('Order placed (demo): You paid ₹' + price + '. Seller receives ₹' + sellerGets + (commission ? ', commission ₹' + commission : '') + '.');
}

function scrollToSection(id){
    const el = document.getElementById(id);
    if(el) el.scrollIntoView({behavior: 'smooth'});
}

document.getElementById('contactForm')?.addEventListener('submit', function(e){
    e.preventDefault();
    alert('Message sent! (demo)');
    this.reset();
});

document.getElementById('sketchForm')?.addEventListener('submit', function(e){
    e.preventDefault();
    alert('Sketch request submitted! (demo)');
    this.reset();
});
