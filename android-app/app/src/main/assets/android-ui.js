(function(){
  "use strict";

  const metadata = {
    home: { title: "Home", subtitle: "Business ka clear overview" },
    upload: { title: "AI Upload", subtitle: "Photo ya file se data add karo" },
    sales: { title: "Sales", subtitle: "Sale aur profit manage karo" },
    stock: { title: "Stock", subtitle: "Inventory aur quantity track karo" },
    analytics: { title: "Insights", subtitle: "Trends aur business performance" },
    calculator: { title: "Calculator", subtitle: "Useful business calculations" },
    subscription: { title: "Plans", subtitle: "Subscription manage karo" },
    settings: { title: "Settings", subtitle: "Account, backup aur preferences" }
  };

  const icons = {
    home:'<svg viewBox="0 0 24 24"><path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10.5V20h13v-9.5"/><path d="M9.5 20v-6h5v6"/></svg>',
    sales:'<svg viewBox="0 0 24 24"><path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z"/><path d="M9 8h6M9 12h6"/></svg>',
    stock:'<svg viewBox="0 0 24 24"><path d="m12 3 8 4-8 4-8-4 8-4Z"/><path d="m4 12 8 4 8-4M4 17l8 4 8-4"/></svg>',
    analytics:'<svg viewBox="0 0 24 24"><path d="M4 19V9M10 19V5M16 19v-7M22 19H2"/></svg>',
    more:'<svg viewBox="0 0 24 24"><circle cx="5" cy="12" r="1.4" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1.4" fill="currentColor" stroke="none"/></svg>',
    upload:'<svg viewBox="0 0 24 24"><path d="M12 16V4M7 9l5-5 5 5"/><path d="M5 14v5h14v-5"/></svg>',
    calculator:'<svg viewBox="0 0 24 24"><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 12h1M12 12h1M16 12h1M8 16h1M12 16h1M16 16h1"/></svg>',
    subscription:'<svg viewBox="0 0 24 24"><path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z"/></svg>',
    settings:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1A1.7 1.7 0 0 0 9 4.6 1.7 1.7 0 0 0 10 3V2.8h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z"/></svg>',
    theme:'<svg viewBox="0 0 24 24"><path d="M20 15.5A8 8 0 1 1 8.5 4 6.5 6.5 0 0 0 20 15.5Z"/></svg>'
  };

  const originalSetTab = typeof window.setTab === "function" ? window.setTab : null;
  const originalRenderNav = typeof window.renderNav === "function" ? window.renderNav : null;
  const originalToggleTheme = typeof window.toggleTheme === "function" ? window.toggleTheme : null;
  const originalSetTheme = typeof window.setTheme === "function" ? window.setTheme : null;

  function syncThemeVisuals(){
    const light = document.body.classList.contains("theme-light");
    document.documentElement.classList.toggle("theme-light", light);
    document.documentElement.style.colorScheme = light ? "light" : "dark";

    const meta = document.querySelector('meta[name="theme-color"]');
    if(meta){
      meta.setAttribute("content", light ? "#f3f8fd" : "#06111f");
    }

    const button = document.getElementById("themeToggle");
    if(button){
      button.setAttribute("aria-label", light ? "Switch to dark mode" : "Switch to light mode");
      button.setAttribute("title", light ? "Dark mode" : "Light mode");
      button.dataset.theme = light ? "light" : "dark";
    }
  }

  if(originalToggleTheme){
    window.toggleTheme = function(event){
      const result = originalToggleTheme.call(this, event);
      setTimeout(syncThemeVisuals, 90);
      return result;
    };
  }

  if(originalSetTheme){
    window.setTheme = function(theme){
      const result = originalSetTheme.call(this, theme);
      setTimeout(syncThemeVisuals, 90);
      return result;
    };
  }

  function visibleTab(){
    const screen = Array.from(document.querySelectorAll(".screen"))
      .find(function(node){ return !node.classList.contains("hide"); });
    return screen ? screen.id.replace("screen-", "") : "home";
  }

  function renderNav(){
    const nav = document.getElementById("nav");
    if(!nav) return;

    const current = visibleTab();
    const moreActive = ["upload","calculator","subscription","settings"].includes(current);
    const items = [
      ["home","Home"],
      ["sales","Sales"],
      ["stock","Stock"],
      ["analytics","Insights"],
      ["more","More"]
    ];

    nav.innerHTML = items.map(function(item){
      const id = item[0];
      const active = id === "more" ? moreActive : current === id;
      return '<button type="button" data-android-tab="'+id+'" class="'+(active?'active':'')+'" aria-label="'+item[1]+'">'+
        '<span class="android-nav-icon">'+icons[id]+'</span>'+
        '<span class="android-nav-label">'+item[1]+'</span>'+
      '</button>';
    }).join("");

    nav.querySelectorAll("button").forEach(function(button){
      button.addEventListener("click", function(){
        const tab = button.getAttribute("data-android-tab");
        if(tab === "more"){
          openMoreSheet();
          return;
        }
        if(typeof window.setTab === "function") window.setTab(tab, true);
      });
    });
  }

  function updateHeader(){
    const tab = visibleTab();
    const info = metadata[tab] || metadata.home;
    const heading = document.querySelector(".brand h1");
    const tag = document.querySelector(".brand .tag");
    if(heading) heading.textContent = tab === "home" ? "Vyapar AI" : info.title;
    if(tag) tag.textContent = info.subtitle;
    document.title = info.title + " · Vyapar AI";
  }

  function addQuickActions(){
    const home = document.getElementById("screen-home");
    if(!home || home.querySelector(".android-quick-actions")) return;

    const row = document.createElement("div");
    row.className = "android-quick-actions";
    row.innerHTML =
      '<button type="button" class="android-quick-action primary" data-tab="sales">＋ Add Sale</button>'+
      '<button type="button" class="android-quick-action" data-tab="upload">AI Upload</button>'+
      '<button type="button" class="android-quick-action" data-tab="stock">View Stock</button>';

    row.querySelectorAll("button").forEach(function(button){
      button.addEventListener("click", function(){
        const tab = button.getAttribute("data-tab");
        if(typeof window.setTab === "function") window.setTab(tab, true);
      });
    });

    home.prepend(row);
  }

  function improveCurrentScreen(){
    const tab = visibleTab();
    const screen = document.getElementById("screen-"+tab);
    if(!screen) return;

    screen.querySelectorAll('input[type="number"]').forEach(function(input){
      input.inputMode = "decimal";
    });
    screen.querySelectorAll('input[type="email"]').forEach(function(input){
      input.inputMode = "email";
      input.autocomplete = "email";
    });
    screen.querySelectorAll("button:not([type])").forEach(function(button){
      button.type = "button";
    });
    screen.querySelectorAll(".scroll").forEach(function(node){
      node.tabIndex = 0;
      node.setAttribute("aria-label", "Scrollable table");
    });
  }

  function closeMoreSheet(){
    const sheet = document.getElementById("androidMoreSheet");
    if(sheet) sheet.remove();
  }

  function sheetItem(tab, title, subtitle){
    return '<button type="button" class="android-sheet-item" data-tab="'+tab+'">'+
      icons[tab]+
      '<span>'+title+'<small>'+subtitle+'</small></span>'+
    '</button>';
  }

  function openMoreSheet(){
    if(document.getElementById("androidMoreSheet")){
      closeMoreSheet();
      return;
    }

    const overlay = document.createElement("div");
    overlay.id = "androidMoreSheet";
    overlay.className = "android-sheet-overlay";
    overlay.innerHTML = '<div class="android-sheet" role="dialog" aria-modal="true" aria-label="More options">'+
      '<div class="android-sheet-handle"></div>'+
      '<h3>More</h3>'+
      '<div class="android-sheet-grid">'+
        sheetItem("upload","AI Upload","Photo aur file import")+
        sheetItem("calculator","Calculator","Business tools")+
        sheetItem("subscription","Plans","Subscription manage")+
        sheetItem("settings","Settings","Account aur backup")+
        '<button type="button" class="android-sheet-item" data-action="theme">'+icons.theme+'<span>Appearance<small>Light / dark mode</small></span></button>'+
      '</div>'+
      '<div class="android-sheet-legal">'+
        '<a href="privacy.html" target="_blank">Privacy</a>'+
        '<a href="terms.html" target="_blank">Terms</a>'+
        '<a href="refund.html" target="_blank">Refund</a>'+
      '</div>'+
    '</div>';

    overlay.addEventListener("click", function(event){
      if(event.target === overlay) closeMoreSheet();
    });

    overlay.querySelectorAll("[data-tab]").forEach(function(button){
      button.addEventListener("click", function(){
        const tab = button.getAttribute("data-tab");
        closeMoreSheet();
        if(typeof window.setTab === "function") window.setTab(tab, true);
      });
    });

    const themeButton = overlay.querySelector('[data-action="theme"]');
    if(themeButton){
      themeButton.addEventListener("click", function(event){
        closeMoreSheet();
        if(typeof window.toggleTheme === "function") window.toggleTheme(event);
      });
    }

    document.body.appendChild(overlay);
  }

  if(originalSetTab){
    window.setTab = function(tab, withLoader){
      const result = originalSetTab.call(this, tab, withLoader);
      requestAnimationFrame(function(){
        renderNav();
        updateHeader();
        improveCurrentScreen();
        syncThemeVisuals();
        if(tab === "home") addQuickActions();
      });
      return result;
    };
  }

  if(originalRenderNav){
    window.renderNav = function(){
      originalRenderNav.apply(this, arguments);
      renderNav();
    };
  }

  const planBadge = document.getElementById("planBadge");
  if(planBadge){
    planBadge.setAttribute("role","button");
    planBadge.tabIndex = 0;
    planBadge.addEventListener("click", function(){
      if(typeof window.setTab === "function") window.setTab("subscription", true);
    });
  }

  document.addEventListener("keydown", function(event){
    if(event.key === "Escape") closeMoreSheet();
  });

  renderNav();
  updateHeader();
  improveCurrentScreen();
  addQuickActions();
  syncThemeVisuals();

  const themeObserver = new MutationObserver(function(){
    syncThemeVisuals();
  });

  themeObserver.observe(document.body, {
    attributes:true,
    attributeFilter:["class"]
  });

  const observer = new MutationObserver(function(){
    requestAnimationFrame(function(){
      renderNav();
      updateHeader();
      improveCurrentScreen();
      syncThemeVisuals();
      if(visibleTab() === "home") addQuickActions();
    });
  });

  document.querySelectorAll(".screen").forEach(function(screen){
    observer.observe(screen, {attributes:true, attributeFilter:["class"]});
  });
})();
