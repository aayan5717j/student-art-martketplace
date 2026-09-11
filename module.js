
    /* --------------  FIREBASE IMPORTS -------------- */
    import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";

    import {
      getAuth, createUserWithEmailAndPassword,
      signInWithEmailAndPassword, signOut,
      onAuthStateChanged, sendPasswordResetEmail,
      sendEmailVerification, setPersistence,
      browserLocalPersistence, browserSessionPersistence
    } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";

    import {
      getDatabase, ref, set, push,
      onValue, remove, update, get
    } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-database.js";



    /* ===== DOM ELEMENT FIX ===== */
    const menuBtn = document.getElementById("menuBtn");
    const dropdown = document.getElementById("dropdown");


    const searchBtn = document.getElementById("searchBtn");
    const searchBar = document.getElementById("searchBar");

    /* --------------  FIREBASE CONFIG -------------- */
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


    /* GLOBAL */
    let currentUserRole = null;



    /* ================= UI EVENTS ================= */
    if (menuBtn) {
      menuBtn.onclick = () => {
        dropdown.style.display =
          dropdown.style.display === "block" ? "none" : "block";
      };
    }


    /* -------- LOGIN / SIGNUP SWITCH -------- */
    const loginTab = document.getElementById("loginTab");
    const signupTab = document.getElementById("signupTab");
    const loginAuth = document.getElementById("loginAuth");
    const signupAuth = document.getElementById("signupAuth");
    const authTitle = document.getElementById("authTitle");
    const authSubtitle = document.getElementById("authSubtitle");

    function setAuthMode(mode) {
      const isLogin = mode === "login";
      loginTab.classList.toggle("active", isLogin);
      signupTab.classList.toggle("active", !isLogin);
      loginAuth.style.display = isLogin ? "block" : "none";
      signupAuth.style.display = isLogin ? "none" : "block";
      authTitle.textContent = isLogin ? "Welcome back" : "Create your account";
      authSubtitle.textContent = isLogin ? "Login to continue to the marketplace." : "Create a student account to buy, sell, and showcase your work.";
      authMsg.textContent = "";
    }
    loginTab.onclick = () => setAuthMode("login");
    signupTab.onclick = () => setAuthMode("signup");

    function wirePasswordToggle(inputId, buttonId) {
      const input = document.getElementById(inputId), btn = document.getElementById(buttonId);
      btn.onclick = () => {
        const show = input.type === "password";
        input.type = show ? "text" : "password";
        btn.textContent = show ? "Hide" : "Show";
      };
    }
    wirePasswordToggle("loginPassword", "toggleLoginPassword");
    wirePasswordToggle("signupPassword", "toggleSignupPassword");

    /* -------- PASSWORD STRENGTH -------- */
    signupPassword.oninput = () => {
      const value = signupPassword.value;
      let strength = "Weak";
      if (value.length >= 8 && /[A-Z]/.test(value) && /[0-9]/.test(value) && /[^A-Za-z0-9]/.test(value)) strength = "Strong";
      else if (value.length >= 8 && (/[A-Z]/.test(value) || /[0-9]/.test(value))) strength = "Medium";
      signupPasswordStrength.textContent = value ? "Password strength: " + strength : "";
      signupPasswordStrength.className = "strength " + strength.toLowerCase();
    };

    /* -------- ROLE HANDLING -------- */
    // Seller contact details are collected later in the profile/dashboard flow.

    /* ===================================================
       SIGNUP
    =================================================== */
    signupBtn.onclick = async () => {
      loadingAuth.style.display = "block";
      authMsg.textContent = "";
      const name = signupName.value.trim();
      const phone = signupPhone.value.replace(/\D/g, "");
      const email = signupEmail.value.trim();
      const pass = signupPassword.value;
      const confirm = signupConfirm.value;

      if (!name || !phone || !email || !pass || !confirm) {
        authMsg.textContent = "Please fill all required details.";
        loadingAuth.style.display = "none"; return;
      }
      if (!/^[6-9]\d{9}$/.test(phone)) {
        authMsg.textContent = "Enter a valid 10-digit mobile number.";
        loadingAuth.style.display = "none"; return;
      }
      if (pass.length < 8) {
        authMsg.textContent = "Password must be at least 8 characters.";
        loadingAuth.style.display = "none"; return;
      }
      if (pass !== confirm) {
        authMsg.textContent = "Passwords do not match.";
        loadingAuth.style.display = "none"; return;
      }
      if (!signupTerms.checked) {
        authMsg.textContent = "Please accept the Terms & Privacy Policy.";
        loadingAuth.style.display = "none"; return;
      }

      try {
        const credential = await createUserWithEmailAndPassword(auth, email, pass);
        await set(ref(db, "users/" + credential.user.uid), {
          name,
          phone,
          role: role.value,
          authType: "email",
          email,
          createdAt: Date.now()
        });
        try { await sendEmailVerification(credential.user); } catch (_) {}
        await signOut(auth);
        setAuthMode("login");
        loginEmail.value = email;
        loginPassword.value = "";
        authMsg.textContent = "Account created. Please verify your email, then login.";
      } catch (e) {
        authMsg.textContent = e.code === "auth/email-already-in-use" ? "This email is already registered. Please login." : "Could not create account. Please check your details.";
      }
      loadingAuth.style.display = "none";
    };

    /* ===================================================
       LOGIN
    =================================================== */
    loginBtn.onclick = async () => {
      loadingAuth.style.display = "block";
      authMsg.textContent = "";
      const email = loginEmail.value.trim();
      const pass = loginPassword.value;
      if (!email || !pass) {
        authMsg.textContent = "Enter your email and password.";
        loadingAuth.style.display = "none"; return;
      }
      try {
        // Keep the Firebase login active when moving between Home, Dashboard and other pages.
        // The login button's "Remember me" option is kept in the UI, but account sessions
        // use browser-local persistence so users do not have to login again on navigation.
        await setPersistence(auth, browserLocalPersistence);
        const credential = await signInWithEmailAndPassword(auth, email, pass);
        // Unlock immediately. The auth-state listener will also keep this in sync.
        setLoggedOutView(false);
        authSection.style.display = "none";
        authMsg.textContent = "";
        if (userMenu) userMenu.style.display = "block";
      } catch (e) {
        authMsg.textContent = (e.code === "auth/invalid-credential" || e.code === "auth/wrong-password" || e.code === "auth/user-not-found") ? "Email or password is incorrect." : "Unable to login. Please try again.";
      }
      loadingAuth.style.display = "none";
    };

    /* RESET PASSWORD */
    forgotBtn.onclick = async () => {
      const email = loginEmail.value.trim();
      if (!email) return authMsg.textContent = "Enter your email first.";

      await sendPasswordResetEmail(auth, email);
      authMsg.textContent = "Password reset email sent!";
    };



    setAuthMode("login");

    /* Logged-out landing: show ONLY the account access card.
       Public marketplace content appears after successful login. */
    function setLoggedOutView(isLoggedOut) {
      document.body.classList.toggle("auth-logged-out", isLoggedOut);
      if (isLoggedOut) {
        authSection.style.display = "block";
        userMenu.style.display = "none";
      }
    }

    /* ===================================================
       AUTH UI
    =================================================== */
    async function loadDashboard(uid) {
      // Unlock the homepage immediately after Firebase confirms the session.
      // Do not wait for the optional profile/database read, otherwise a database
      // rules/network error can make a successful login look like it failed.
      setLoggedOutView(false);
      authSection.style.display = "none";
      if (userMenu) userMenu.style.display = "block";

      try {
        const snap = await get(ref(db, "users/" + uid));
        const user = snap.val() || {};
        currentUserRole = user.role || "buyer";
      } catch (err) {
        // Auth is still valid even if the profile record cannot be read.
        currentUserRole = "buyer";
        console.warn("Profile read skipped after login:", err);
      }

      const buyerNav = document.getElementById("buyerNav");
      if (buyerNav) buyerNav.style.display = currentUserRole === "buyer" ? "inline-block" : "none";
    }


    // Three-dot account menu: Dashboard + Logout
    if (menuBtn && dropdown) {
      menuBtn.onclick = (e) => {
        e.stopPropagation();
        dropdown.style.display = dropdown.style.display === "block" ? "none" : "block";
      };
      document.addEventListener("click", (e) => {
        if (!dropdown.contains(e.target) && e.target !== menuBtn) dropdown.style.display = "none";
      });
    }

    /* ===================================================
       LOGOUT
    =================================================== */
    logoutBtn.onclick = async () => {
      await signOut(auth);
      setLoggedOutView(true);
      if (dropdown) dropdown.style.display = "none";
      const buyerNav = document.getElementById("buyerNav");
      if (buyerNav) buyerNav.style.display = "none";
      authMsg.textContent = "Logged out!";
    };


    /* ===================================================
       AUTH STATE WATCHER
    =================================================== */
    // Restore the signed-in Firebase session before deciding whether to show the login gate.
    // This prevents Home from asking for login again after navigating back from another page.
    setPersistence(auth, browserLocalPersistence).catch(() => {});

    onAuthStateChanged(auth, (user) => {
      if (user) loadDashboard(user.uid);
      else {
        setLoggedOutView(true);
      }
    });


    /* ===================================================
       LOAD LISTINGS (HOME)
    =================================================== */
    /* --- IS FUNCTION KO DHUND KAR REPLACE KAREIN --- */
    function formatCategory(category) {
      const names = { painting:"Painting", sketch:"Sketch", digital:"Digital Art", craft:"Craft", photography:"Photography", art:"Art", book:"Book", notes:"Handwritten Notes" };
      return names[category] || "Student Listing";
    }

    window.hubHomeDetails = async (sellerId, title, price) => {
      try {
        const snap = await get(ref(db, "listings"));
        const found = Object.values(snap.val() || {}).find(x => x.sellerId === sellerId && x.title === title && String(x.price) === String(price));
        if (found && window.hubOpenDetails) {
          const item = {...found, id: String(found.id || "")} ;
          window.__hubListings = [...(window.__hubListings || []).filter(x => x.id !== item.id), item];
          window.hubOpenDetails(item);
        }
      } catch(e) { console.error(e); }
    };

    function loadListings() {
      onValue(ref(db, "listings"), (snap) => {
        const data = snap.val() || {};
        const productContainer = document.getElementById("productContainer");

        // Yahan hum listings ko map kar rahe hain
        productContainer.innerHTML = Object.values(data)
          .filter(item => item.category !== "customSketch") // ✅ MAIN FIX
          .map(item => `
    <div class="card" style="text-align: left; padding: 15px;">
      <img src="${item.imageUrl || 'https://via.placeholder.com/300?text=Student+Item'}">

      <div style="margin-top: 10px;">
        <span class="payment-badge">
          Cash / UPI
        </span>

        <span class="category-badge">${formatCategory(item.category)}</span>
        <h4>${item.title}</h4>

        <div style="color: #f59e0b;">
          ${generateStars(item.rating || 4)}
          <span style="color:#888;font-size:12px">(4.5/5)</span>
        </div>

        <p style="font-size:18px;font-weight:bold;color:#1e3a8a">
          ₹${item.price}
        </p>

        <p style="font-size:12px;color:#555">
          📍 ${item.location || "Nearby Area"}
        </p>

        <div class="card-actions">
          <button class="market-btn secondary" onclick="window.hubHomeDetails && window.hubHomeDetails('${item.sellerId}', ${JSON.stringify(item.title || '')}, '${item.price || ''}')">View Details</button>
          <button class="market-btn" onclick="window.hubBuy && window.hubBuy({sellerId:'${item.sellerId}', title:${JSON.stringify(item.title || '')}, price:'${item.price || ''}'})">Buy Now</button>
        </div>
      </div>
    </div>
  `).join("");
      });
    }

    /* Is function ko loadListings ke bilkul upar ya niche paste kar dena */
    function generateStars(rating) {
      let stars = '';
      for (let i = 0; i < 5; i++) {
        stars += i < Math.round(rating) ? '★' : '☆';
      }
      return stars;
    }


  /* BUY FROM HOME */
    window.contactSeller = async (sellerId, title, price) => {
      if (!auth.currentUser) {
        alert("Please login first to continue.");
        document.getElementById("authSection")?.scrollIntoView({ behavior: "smooth" });
        return;
      }
      if (auth.currentUser.uid === sellerId) {
        alert("You cannot buy your own listing.");
        return;
      }
      try {
        const sellerSnap = await get(ref(db, "users/" + sellerId));
        const seller = sellerSnap.val() || {};
        let phone = seller.whatsapp || seller.phone || seller.whatsappPhone || "";
        phone = String(phone).replace(/\D/g, "");
        if (phone.length === 10) phone = "91" + phone;
        if (!phone) {
          alert("This seller has not added a WhatsApp/phone number yet.");
          return;
        }
        const message = `Hello 👋\nI am interested in buying your listing on Student Art Hub.\n\n📦 Item: ${title || "Listing"}\n💰 Price: ₹${price || "—"}\n\nPlease confirm availability and pickup/payment details.`;
        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, "_blank", "noopener");
      } catch (e) {
        console.error(e);
        alert("Could not contact the seller right now. Please try again.");
      }
    };

    /* SEARCH */
    searchBtn.onclick = () => {

      const q = searchBar.value.toLowerCase();

      onValue(ref(db, "listings"), snap => {

        const listings = snap.val() || {};

        const filtered = Object.values(listings).filter(l =>
          l.category !== "customSketch" && (
            (l.title || "").toLowerCase().includes(q) ||
            (l.category || "").toLowerCase().includes(q) ||
            (l.class || "").toLowerCase().includes(q) ||
            (l.subject || "").toLowerCase().includes(q)
          )
        );

        window.__hubListings = Object.values(listings).map((x,i)=>({...x,id:String(x.id||i)}));
        productContainer.innerHTML = filtered.map(l => `
          <div class="card">
            ${l.imageUrl ? `<img src="${l.imageUrl}">` : `<div class="pdf-placeholder">📄<span>Study material</span></div>`}
            <h4>${l.title}</h4>
            <p>₹${l.price}</p>
            ${l.class ? `<p>Class: ${l.class}</p>` : ""}
            ${l.subject ? `<p>Subject: ${l.subject}</p>` : ""}
            ${l.pdfUrl ? `<a href="${l.pdfUrl}" target="_blank">View PDF</a>` : ""}
            <button onclick="window.hubBuy(window.__hubListings.find(x=>x.id==='${String(l.id)}'))">Buy Now</button>
          </div>
        `).join("");
      });
    };



    /* DONATION */
    donateBtn.onclick = () => {

      if (!donateName.value)
        return alert("Name daalo!");

      const msg =
        `Hi, donate: ${donateType.value}, Name: ${donateName.value}, Message: ${donateMsg.value}`;

      window.open(
        `https://wa.me/919878455467?text=${encodeURIComponent(msg)}`,
        "_blank"
      );

      const uid = auth.currentUser?.uid;

      if (uid)
        push(ref(db, "donations"), {
          userId: uid,
          type: donateType.value,
          message: donateMsg.value,
          timestamp: Date.now()
        });

    };


    // ===== FILTER LISTINGS =====
    // ===== FILTER LISTINGS (Location: Niche script mein) =====
    applyFilterBtn.onclick = () => {
      const selectedCategory = filterCategory.value;
      const selectedClass = filterClass.value;

      document.getElementById("loader").style.display = "block";

      get(ref(db, "listings")).then(snap => {
        const listings = snap.val() || {};
        document.getElementById("loader").style.display = "none";

        const filtered = Object.values(listings).filter(l => {
          if (l.category === "customSketch") return false;

          const artTypes = ["painting","sketch","digital","craft","photography","art"];
          const categoryMatch = !selectedCategory || (selectedCategory === "art" ? artTypes.includes(l.category) : l.category === selectedCategory);
          const classMatch = !selectedClass || String(l.class) === selectedClass;
          return categoryMatch && classMatch;
        });

        if (!filtered.length) {
          productContainer.innerHTML = "<p>No matching listings 😕</p>";
          return;
        }

        window.__hubListings = Object.values(listings).map((x,i)=>({...x,id:String(x.id||i)}));
        // Render filtered marketplace cards.
        productContainer.innerHTML = filtered.map(l => `
      <div class="card" style="text-align: left; padding: 15px;">
        <img src="${l.imageUrl || 'https://via.placeholder.com/150'}" style="width:100%; height:180px; object-fit:cover; border-radius: 8px;">
        
        <div style="margin-top: 10px;">
          <span style="background:#dcfce7; color:#166534; padding:2px 8px; border-radius:4px; font-size:11px; font-weight:bold; display:inline-block; margin-bottom:5px;">
            Cash / UPI
          </span>
          
          <h4 style="margin: 5px 0;">${l.title}</h4>
          
          <div style="color: #f59e0b; margin-bottom: 5px; font-size: 14px;">
            ★★★★☆ <span style="color: #888; font-size: 12px;">(4.5/5)</span>
          </div>

          <p style="font-size: 18px; font-weight: bold; color: #1e3a8a; margin: 5px 0;">
            ₹${l.price}
          </p>
          
          ${l.class ? `<p style="font-size:12px; color:#555;">Class: ${l.class}</p>` : ""}
<button onclick="window.hubBuy(window.__hubListings.find(x=>x.id==='${String(l.id)}'))">Buy Now</button>

        </div>
      </div>
    `).join('');
      });
    };

    /* START */
    loadListings();
    // ===== TERMS MODAL FUNCTIONS (MODULE FIX) =====
    window.openTerms = () => {
      document.getElementById("termsModal").style.display = "flex";
    };

    window.closeTerms = () => {
      document.getElementById("termsModal").style.display = "none";
    };

    // ===== RECENT ACTIVITY FIX =====
    function loadRecentActivity(uid) {
      const box = document.getElementById("recentActivity");
      if (box) {
        box.innerHTML = "<p style='color:#777'>No recent activity yet.</p>";
      }
    }

  