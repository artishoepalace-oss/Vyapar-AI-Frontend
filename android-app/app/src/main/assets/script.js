function playThemeRipple(x, y){
  const r = document.createElement('div');
  r.className = 'theme-ripple';
  r.style.left = x + 'px';
  r.style.top = y + 'px';
  document.body.appendChild(r);
  setTimeout(() => r.remove(), 240);
}

let tabLoaderTimer = null;

function showTabLoader(){
  const l = document.getElementById('tabLoader');
  if(!l) return;

  l.classList.add('show');
  clearTimeout(tabLoaderTimer);
  tabLoaderTimer = setTimeout(() => l.classList.remove('show'), 400);
}


function updateLoaderNetworkStatus(){
  const network = document.getElementById('loaderNetwork');
  const text = document.getElementById('loaderText');

  if(!network){
    return;
  }

  if(navigator.onLine){
    network.textContent = 'Online mode active';
  } else {
    network.textContent = 'Offline mode active';
  }

  if(text){
    text.textContent = navigator.onLine
      ? 'Sync ready. Opening dashboard...'
      : 'Offline data ready. Opening dashboard...';
  }
}

function hideLoader(){
  const loader = document.getElementById('appLoader');

  if(!loader){
    return;
  }

  loader.classList.add('hide-loader');

  setTimeout(function(){
    if(loader){
      loader.remove();
    }
  }, 650);
}

function setupVideoSplash(){
  const loader = document.getElementById('appLoader');
  const video = document.getElementById('splashVideo');

  if(!loader){
    return;
  }

  const minimumSplashTime = 20000 ; // 20 seconds

  const startTime = Date.now();

  function closeAfterMinimumTime(){
    const passedTime = Date.now() - startTime;
    const remainingTime = minimumSplashTime - passedTime;

    if(remainingTime > 0){
      setTimeout(hideLoader, remainingTime);
    } else {
      hideLoader();
    }
  }

  if(!video){
    setTimeout(hideLoader, minimumSplashTime);
    return;
  }

  video.muted = true;
  video.playsInline = true;

  const playPromise = video.play();

  if(playPromise && typeof playPromise.catch === 'function'){
    playPromise.catch(function(){
      setTimeout(hideLoader, minimumSplashTime);
    });
  }

  video.addEventListener('ended', function(){
    closeAfterMinimumTime();
  });

  video.addEventListener('error', function(){
    setTimeout(hideLoader, minimumSplashTime);
  });

  setTimeout(function(){
    hideLoader();
  }, minimumSplashTime);
}

window.addEventListener('load', setupVideoSplash);
setTimeout(setupVideoSplash, 800);


window.addEventListener('load', hideLoader);
window.addEventListener('online', updateLoaderNetworkStatus);
window.addEventListener('offline', updateLoaderNetworkStatus);

setTimeout(hideLoader, 2600);

window.addEventListener('load', hideLoader);
setTimeout(hideLoader, 1200);

const STORAGE_KEY = 'vyapar_ai_prod_v1';

const tabs = [
  ['home', 'Dashboard'],
  ['upload', 'AI Upload'],
  ['sales', 'Sales'],
  ['stock', 'Stock'],
  ['analytics', 'Analytics'],
  ['calculator', 'Calculator'],
  ['subscription', 'Plans'],
  ['settings', 'Settings']
];

let currentTab = 'home';
let editSaleId = '';
let editMonthlyId = '';
let scannedStockItems = [];

let state = loadState();

function uid(){
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function money(n){
  return '₹' + Number(n || 0).toLocaleString('en-IN', {
    maximumFractionDigits: 0
  });
}

function pct(n){
  return Number(n || 0).toFixed(1) + '%';
}

function num(v){
  if(v === null || v === undefined) return 0;

  const n = Number(String(v).replace(/[₹,\s]/g, ''));

  return Number.isFinite(n) ? n : 0;
}

function monthKey(d){
  const dt = new Date(d || Date.now());

  return dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0');
}

function monthNameToNum(m){
  if(!m) return '';

  const a = [
    'jan','feb','mar','apr','may','jun',
    'jul','aug','sep','oct','nov','dec'
  ];

  const idx = a.findIndex(x =>
    String(m).toLowerCase().trim().startsWith(x)
  );

  return idx >= 0 ? String(idx + 1).padStart(2, '0') : '';
}

function yearMonth(year, month, date){
  if(date && /^\d{4}-\d{2}/.test(String(date))){
    return String(date).slice(0, 7);
  }

  if(/^\d{4}-\d{2}$/.test(String(month))){
    return String(month);
  }

  const mm = monthNameToNum(month) || String(month || '').padStart(2, '0');

  return year && mm ? `${year}-${mm}` : monthKey();
}

function defaultCodeMap(){
  return `A=1
B=2
C=3
D=4
E=5
F=6
G=7
H=8
I=9
0=0
BOX=350
PAIR=499
GST=18
DISC=50
SKU=699
PACK=12`;
}

function defaults(){
  return {
    profile: {
      businessName: 'My Shop',
      locationType: 'Tier 3 City',
      category: 'Footwear',
      monthlyGoal: 50000,
      totalInvestment: 0,
      backendUrl: ' https://vypar-backend.onrender.com'
    },
    plan: 'free',
    subscription: {
  plan: 'free',
  verified: false,
  token: ''
},
    sales: [],
    stocks: [],
    monthly: [],
    daily: [],
    settings: {
      currency: 'INR',
      theme: 'dark',
      performance: 'smooth',
      glassEnabled: false,
      glassOpacity: 0,
      devMode: false,
      billingMode: 'play',
      codeMap: defaultCodeMap()
    }
  };
}
function normalizeState(raw){
  const d = defaults();

  return {
    ...d,
    ...raw,

    profile: {
      ...d.profile,
      ...(raw.profile || {})
    },

    subscription: {
      ...d.subscription,
      ...(raw.subscription || {})
    },

    settings: {
      ...d.settings,
      ...(raw.settings || {})
    },

    sales: Array.isArray(raw.sales) ? raw.sales : [],
    stocks: Array.isArray(raw.stocks) ? raw.stocks : [],
    monthly: Array.isArray(raw.monthly) ? raw.monthly : [],
    daily: Array.isArray(raw.daily) ? raw.daily : []
  };
}

function loadState(){
  try{
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    const clean = normalizeState(saved);

    const token =
      clean.subscription &&
      typeof clean.subscription.token === 'string'
        ? clean.subscription.token.trim()
        : '';

    const plan =
      clean.subscription &&
      (
        clean.subscription.plan === 'pro' ||
        clean.subscription.plan === 'business'
      )
        ? clean.subscription.plan
        : 'free';

    if(token && plan !== 'free'){
      clean.subscription = {
        plan: plan,
        verified: true,
        token: token
      };

      clean.plan = plan;
    } else {
      clean.subscription = {
        plan: 'free',
        verified: false,
        token: ''
      };

      clean.plan = 'free';
    }

    return clean;

  } catch(error) {
    return defaults();
  }
}
function save(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  render();
}


function esc(s){
  return String(s || '').replace(/[&<>"]/g, m => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;'
  }[m]));
}

function v(id){
  const el = document.getElementById(id);
  return el ? el.value : '';
}

function lowEndDevice(){
  const dm = navigator.deviceMemory || 4;
  const cores = navigator.hardwareConcurrency || 4;
  const ua = navigator.userAgent || '';
  const oldAndroid = /Android [4-7]\./.test(ua);

  return oldAndroid || dm <= 2 || cores <= 4;
}

function performanceMode(){
  return (state.settings && state.settings.performance) || 'auto';
}

function isLiteMode(){
  const m = performanceMode();

  return m === 'lite' || (m === 'auto' && lowEndDevice());
}

function applyPerformance(){
  document.documentElement.classList.toggle('perf-lite', isLiteMode());
  document.body.classList.toggle('perf-lite', isLiteMode());
}

function setPerformanceMode(mode){
  state.settings = state.settings || {};
  state.settings.performance = ['auto', 'smooth', 'lite'].includes(mode)
    ? mode
    : 'auto';

  save();
}

function activeTheme(){
  return state.settings && state.settings.theme === 'light' ? 'light' : 'dark';
}

function applyTheme(){
  const th = activeTheme();

  document.body.classList.toggle('theme-light', th === 'light');

  const meta = document.querySelector('meta[name="theme-color"]');

  if(meta){
    meta.setAttribute('content', th === 'light' ? '#f6f8fb' : '#071427');
  }

  const b = document.getElementById('themeToggle');

  if(b){
    b.textContent = th === 'light' ? '☀️ Light' : '🌙 Dark';
  }
}

function toggleTheme(ev){
  const x = ev && ev.clientX ? ev.clientX : window.innerWidth - 48;
  const y = ev && ev.clientY ? ev.clientY : 38;

  playThemeRipple(x, y);

  state.settings = state.settings || {};
  state.settings.theme = activeTheme() === 'light' ? 'dark' : 'light';

  setTimeout(save, 60);
}

function setTheme(th){
  playThemeRipple(window.innerWidth / 2, window.innerHeight / 2);

  state.settings = state.settings || {};
  state.settings.theme = th === 'light' ? 'light' : 'dark';

  setTimeout(save, 60);
}

function glassEnabled(){
  return !(state.settings && state.settings.glassEnabled === false);
}

function glassOpacity(){
  const raw =
    state.settings && state.settings.glassOpacity != null
      ? Number(state.settings.glassOpacity)
      : 100;

  return Math.max(0, Math.min(100, Number.isFinite(raw) ? raw : 100));
}

function applyGlassControl(){
  const light = activeTheme() === 'light';
  const enabled = glassEnabled();
  const op = enabled ? glassOpacity() / 100 : 0;
  const topBase = light ? 0.80 : 0.18;
  const bottomBase = light ? 0.22 : 0.03;

  const doc = document.documentElement;
  const body = document.body;

  doc.classList.toggle('glass-off', !enabled);
  body.classList.toggle('glass-off', !enabled);

  doc.style.setProperty('--glass-top', `rgba(255,255,255,${(topBase * op).toFixed(3)})`);
  doc.style.setProperty('--glass-bottom', `rgba(255,255,255,${(bottomBase * op).toFixed(3)})`);
}

function setGlassEnabled(flag){
  state.settings = state.settings || {};
  state.settings.glassEnabled = !!flag;
  save();
}

function updateGlassOpacityLabel(val){
  const el = document.getElementById('glassOpacityValue');

  if(el){
    el.textContent = Math.round(Number(val) || 0) + '%';
  }
}

function setGlassOpacity(val){
  state.settings = state.settings || {};
  state.settings.glassOpacity = Math.max(0, Math.min(100, Number(val) || 0));
  save();
}

function forceReadableFont(){
  document.documentElement.classList.add('readable-font');
  document.body.classList.add('readable-font');
}

let devTapCount = 0;

function devModeEnabled(){
  return !!(state.settings && state.settings.devMode);
}

function devTap(){
  devTapCount++;

  if(devTapCount >= 7){
    state.settings = state.settings || {};
    state.settings.devMode = !state.settings.devMode;
    devTapCount = 0;
    save();

    alert(state.settings.devMode ? 'Developer Mode unlocked' : 'Developer Mode hidden');
  }
}

function setBackendUrl(){
  state.profile = state.profile || {};
  state.profile.backendUrl = v('devBackendUrl').trim();
  save();
}

function setBillingMode(mode){
  state.settings = state.settings || {};
  state.settings.billingMode = mode;
  save();
}

async function testBackend(){
  const el = document.getElementById('devBackendStatus');
  const url = (state.profile && state.profile.backendUrl || '').trim();

  if(!el) return;

  if(!url){
    el.textContent = 'Add endpoint first.';
    return;
  }

  el.textContent = 'Testing...';

  try{
    const res = await fetch(url.replace(/\/extractBill$/, '') + '/', {
      method: 'GET'
    });

    el.textContent = res.ok ? 'Connected' : 'Endpoint found but failed';
  }catch(e){
    el.textContent = 'Not connected. Check URL, CORS, deployment and internet.';
  }
}

function planLevel(plan){
  if(plan === 'free') return 1;
  if(plan === 'pro') return 2;
  if(plan === 'business') return 3;

  return 1;
}

function getSubscriptionToken(){
  if(
    state &&
    state.subscription &&
    typeof state.subscription.token === 'string'
  ){
    return state.subscription.token.trim();
  }

  return '';
}

function getCurrentPlan(){
  const token = getSubscriptionToken();

  if(
    token &&
    state &&
    state.subscription &&
    state.subscription.verified === true &&
    (
      state.subscription.plan === 'pro' ||
      state.subscription.plan === 'business'
    )
  ){
    return state.subscription.plan;
  }

  return 'free';
}

function requirePlan(requiredPlan){
  const planRank = {
    free: 0,
    pro: 1,
    business: 2
  };

  const currentPlan = getCurrentPlan();

  if(planRank[currentPlan] >= planRank[requiredPlan]){
    return true;
  }

  alert(requiredPlan.toUpperCase() + ' plan required');

  setTab('subscription');

  return false;
}

function authJsonHeaders(){
  return {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + getSubscriptionToken()
  };
}

function authFileHeaders(){
  return {
    'Authorization': 'Bearer ' + getSubscriptionToken()
  };
}

function requirePlan(requiredPlan){
  const planRank = {
    free: 0,
    pro: 1,
    business: 2
  };

  const currentPlan = getCurrentPlan();

  if(planRank[currentPlan] >= planRank[requiredPlan]){
    return true;
  }

  alert(requiredPlan.toUpperCase() + ' plan required');

  setTab('subscription');

  return false;
}


function setTab(tab, withLoader = false){
  if(tab === 'upload' && !requirePlan('pro')) return;
  if(tab === 'analytics' && !requirePlan('pro')) return;
  if(tab === 'stock' && !requirePlan('business')) return;

  if(withLoader) showTabLoader();

  currentTab = tab;

  document.querySelectorAll('.screen').forEach(s => s.classList.add('hide'));

  const screen = document.getElementById('screen-' + tab);

  if(screen){
    screen.classList.remove('hide');
  }

  document.querySelectorAll('.nav button').forEach(b => {
    b.classList.toggle('active', b.dataset.tab === tab);
  });

  if(tab === 'analytics'){
    setTimeout(drawAnalyticsCharts, 0);
  }
}

function renderNav(){
  const nav = document.getElementById('nav');

  if(!nav) return;

  nav.innerHTML = tabs.map(([id, name]) => `
    <button
      data-tab="${id}"
      class="${id === currentTab ? 'active' : ''}"
      onclick="setTab('${id}', true)"
    >
      ${name}
    </button>
  `).join('');
}

function totals(){
  const itemSaleTotal = state.sales.reduce(
    (a, x) => a + (+x.sellingPrice || 0) * (+x.qty || 0),
    0
  );

  const itemProfit = state.sales.reduce(
    (a, x) => a + ((+x.sellingPrice || 0) - (+x.purchasePrice || 0)) * (+x.qty || 0),
    0
  );

  const monthlyProfit = state.monthly.reduce(
    (a, x) => a + (+x.profit || 0),
    0
  );

  const dailySaleTotal = (state.daily || []).reduce(
    (a, x) => a + num(x.sale),
    0
  );

  const dailyProfit = (state.daily || []).reduce(
    (a, x) => a + num(x.profit),
    0
  );

  const saleTotal = itemSaleTotal + dailySaleTotal;
  const profit = itemProfit + monthlyProfit + dailyProfit;
  const qty = state.sales.reduce((a, x) => a + (+x.qty || 0), 0);
  const margin = saleTotal ? profit / saleTotal * 100 : 0;

  return {
    saleTotal,
    profit,
    qty,
    margin
  };
}

function render(){
  forceReadableFont();
  applyTheme();
  applyGlassControl();
  applyPerformance();

  const badge = document.getElementById('planBadge');

  badge.textContent = getCurrentPlan().toUpperCase() + ' Plan';

  renderNav();
  renderHome();
  renderUpload();
  renderSales();
  renderStock();
  renderAnalytics();
  renderCalculator();
  renderSubscription();
  renderSettings();

  setTab(currentTab);
}

function renderHome(){
  const el = document.getElementById('screen-home');
  if(!el) return;

  const t = totals();
  const ms = monthlyStats();

  el.innerHTML = `
    <div class="stats">
      <div class="stat">
        <span class="muted">Sales</span>
        <b>${money(t.saleTotal)}</b>
      </div>

      <div class="stat">
        <span class="muted">Profit</span>
        <b>${money(t.profit)}</b>
      </div>

      <div class="stat">
        <span class="muted">Avg Monthly</span>
        <b>${money(ms.avg)}</b>
      </div>

      <div class="stat">
        <span class="muted">Margin</span>
        <b>${pct(t.margin)}</b>
      </div>

      <div class="stat">
        <span class="muted">Goal Progress</span>
        <b>${pct((t.profit / (state.profile.monthlyGoal || 1)) * 100)}</b>
      </div>
    </div>

    <div class="hero" style="margin-top:14px">
      <div class="card">
        <p class="pill">Offline-first business manager</p>
        <h2 class="hero-title">AI business manager for small retailers.</h2>
        <p class="muted">
          Upload labels, track profit, manage stock, view analytics and keep your data backed up.
        </p>

        <div class="row">
          <button class="btn primary" onclick="setTab('upload')">
            AI Upload
          </button>

          <button class="btn gold" onclick="setTab('analytics')">
            Profit Graph
          </button>
        </div>
      </div>

      <div class="card">
        <label>Business Name</label>
        <input
          value="${esc(state.profile.businessName)}"
          onchange="state.profile.businessName=this.value;save()"
        >

        <label>Location Type</label>
        <select onchange="state.profile.locationType=this.value;save()">
          ${['Rural','Tier 3 City','Tier 2 City','Metro'].map(x => `
            <option ${x === state.profile.locationType ? 'selected' : ''}>${x}</option>
          `).join('')}
        </select>

        <label>Monthly Goal</label>
        <input
          type="number"
          value="${state.profile.monthlyGoal}"
          onchange="state.profile.monthlyGoal=+this.value;save()"
        >
      </div>
    </div>

    <div class="card" style="margin-top:14px">
      <h3>Next Best Action</h3>
      <p>${nextAction(t)}</p>
    </div>
  `;
}
function renderUpload(){
  const el = document.getElementById('screen-upload');

  if(!el){
    return;
  }

  el.innerHTML = `
    <div class="card">
      <h2>Data Upload</h2>

      <p class="muted">
        Profit, Stock aur Sale data JSON / CSV / TXT file se upload karo.
        AI image scanner abhi hold par hai.
      </p>

      <label>Upload Type</label>
      <select id="uploadType">
        <option value="auto">Auto Detect</option>
        <option value="profit">Profit</option>
        <option value="stock">Stock</option>
        <option value="sale">Sale</option>
      </select>

      <label style="margin-top:14px;display:block">
        Upload JSON / CSV / TXT
      </label>

      <input
        id="uploadFile"
        type="file"
        accept=".json,.csv,.txt"
      >

      <div class="actions">
        <button class="btn primary" onclick="analyzeFile()">
          Analyze and Import
        </button>

        <button class="btn" onclick="downloadSampleJson()">
          Sample JSON
        </button>

        <button class="btn" onclick="downloadSampleCsv()">
          Sample CSV
        </button>
      </div>

      <div id="uploadStatus" class="notice" style="margin-top:12px">
        File choose karo, type select karo, phir Analyze and Import dabao.
      </div>
    </div>

    <div class="card" style="margin-top:14px">
      <h2>Upload Format Help</h2>

      <div class="notice success">
        Profit fields: year, month, profit<br>
        Stock fields: product/item/name, qty, lowStock<br>
        Sale fields: date, product, purchasePrice, sellingPrice, qty
      </div>
    </div>
  `;
}

function nextAction(t){
  if(t.profit < state.profile.monthlyGoal * 0.4){
    return 'Daily sale/profit entry regular karo aur fast moving stock identify karo.';
  }

  if(t.margin < 20){
    return 'Profit margin low hai. Purchase price aur selling margin review karo.';
  }

  return 'Tracking improve ho raha hai. Ab stock rotation aur repeat customers par focus karo.';
}


function setScanMode(mode){
  const input = document.getElementById('scanMode');
  const qtyBox = document.getElementById('scanQtyBox');
  const qtyInput = document.getElementById('scanQty');
  const status = document.getElementById('boxScanStatus');

  if(input){
    input.value = mode;
  }

  if(qtyBox){
    qtyBox.style.display = mode === 'box' || mode === 'carton' ? 'block' : 'none';
  }

  if(qtyInput){
    if(mode === 'box') qtyInput.value = 1;
    if(mode === 'carton') qtyInput.value = 12;
  }

  if(status){
    status.style.display = 'block';
    status.className = 'notice success';

    if(mode === 'box'){
      status.textContent = 'Scan Box Label selected. Quantity confirm karo.';
    }

    if(mode === 'carton'){
      status.textContent = 'Scan Carton selected. Carton me kitne pair hain quantity me daalo.';
    }

    if(mode === 'manual'){
      status.textContent = 'Manual Qty Confirm selected.';
    }
  }
}

async function scanBoxLabel(){
  const fileInput = document.getElementById('boxLabelFile');
  const status = document.getElementById('boxScanStatus');

  if(status){
    status.style.display = 'block';
    status.className = 'notice';
    status.textContent = 'Button clicked. Checking photo...';
  } else {
    alert('boxScanStatus missing in renderUpload');
    return;
  }

  if(!fileInput){
    status.className = 'notice bad';
    status.textContent = 'boxLabelFile input missing in renderUpload';
    return;
  }

  if(!fileInput.files || !fileInput.files[0]){
    status.className = 'notice bad';
    status.textContent = 'Pehle box label photo choose karo.';
    return;
  }

  const modeInput = document.getElementById('scanMode');
  const qtyInput = document.getElementById('scanQty');

  const mode = modeInput ? modeInput.value : 'box';
  const qty = qtyInput ? num(qtyInput.value) : 1;

  const backendUrl = 'https://vypar-backend.onrender.com';

  const formData = new FormData();
  formData.append('file', fileInput.files[0]);
  formData.append('mode', mode);
  formData.append('qty', qty || 1);

  status.className = 'notice';
  status.textContent = 'AI reading started... Please wait.';

  try{
   const res = await fetch(backendUrl + '/ai/scan-box-label', {
  method: 'POST',
  headers: authFileHeaders(),
  body: formData
   });
    const text = await res.text();

    let data;

    try{
      data = JSON.parse(text);
    }catch(e){
      status.className = 'notice bad';
      status.textContent = 'Backend JSON nahi bhej raha. Endpoint missing ya deploy nahi hua.';
      console.log('Backend raw response:', text);
      return;
    }

    if(!res.ok || !data.success){
      status.className = 'notice bad';
      status.textContent = 'Scan failed: ' + (data.message || res.status);
      console.log('Scan error response:', data);
      return;
    }

    if(!data.items || !data.items.length){
      status.className = 'notice bad';
      status.textContent = 'AI ne label se product read nahi kiya. Clear photo lo.';
      console.log('Empty AI response:', data);
      return;
    }

    status.className = 'notice success';
    status.textContent = 'AI read successful. Preview table check karo.';

    showStockScanPreview(data.items);

  }catch(error){
    status.className = 'notice bad';
    status.textContent = 'Scan error: ' + error.message;
    console.log('Scan exception:', error);
  }
}

function makeSku(brand, article, size){
  const b = String(brand || 'GEN')
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(0, 3)
    .toUpperCase();

  const a = String(article || 'ITEM')
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(0, 6)
    .toUpperCase();

  const s = String(size || '00')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase();

  return b + '-' + a + '-' + s;
}

function normalizeStockScanItem(row){
  const brand = row.brand || row.Brand || '';
  const article = row.article || row.model || row.Article || row.Model || '';
  const size = row.size || row.Size || '';
  const color = row.color || row.Color || '';
  const mrp = num(row.mrp || row.MRP || row.price || 0);
  const qty = num(row.qty || row.quantity || row.Qty || 1) || 1;

  const productName = [
    brand,
    article,
    size ? 'Size ' + size : '',
    color
  ].filter(Boolean).join(' ');

  return {
    id: uid(),
    item: productName || 'Scanned Product',
    product: productName || 'Scanned Product',
    brand,
    article,
    size,
    color,
    mrp,
    qty,
    min: 5,
    lowStock: 5,
    sku: makeSku(brand, article, size),
    source: 'box-label-scan'
  };
}

function showStockScanPreview(items){
  scannedStockItems = items.map(normalizeStockScanItem);

  const area = document.getElementById('stockPreviewArea');

  if(!area){
    alert('stockPreviewArea missing in renderUpload()');
    return;
  }

  if(!scannedStockItems.length){
    area.innerHTML = `
      <div class="notice bad">
        Koi product read nahi hua.
      </div>
    `;
    return;
  }

  area.innerHTML = `
    <div class="card">
      <h2>Scanned Stock Preview</h2>
      <p class="muted">
        Check karo. Galat ho to edit karo, phir stock me add karo.
      </p>

      <div class="scroll">
        <table class="table">
          <thead>
            <tr>
              <th>Product</th>
              <th>SKU</th>
              <th>Size</th>
              <th>MRP</th>
              <th>Qty</th>
            </tr>
          </thead>

          <tbody>
            ${scannedStockItems.map((x, i) => `
              <tr>
                <td>
                  <input value="${esc(x.item)}"
                    onchange="scannedStockItems[${i}].item=this.value; scannedStockItems[${i}].product=this.value;">
                </td>

                <td>
                  <input value="${esc(x.sku)}"
                    onchange="scannedStockItems[${i}].sku=this.value;">
                </td>

                <td>
                  <input value="${esc(x.size)}"
                    onchange="scannedStockItems[${i}].size=this.value;">
                </td>

                <td>
                  <input type="number" value="${x.mrp}"
                    onchange="scannedStockItems[${i}].mrp=num(this.value);">
                </td>

                <td>
                  <input type="number" value="${x.qty}"
                    onchange="scannedStockItems[${i}].qty=num(this.value);">
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <div class="actions" style="margin-top:12px">
        <button class="btn primary" onclick="confirmAddScannedStock()">
          Confirm & Add to Stock
        </button>

        <button class="btn danger" onclick="clearStockPreview()">
          Cancel
        </button>
      </div>
    </div>
  `;
}

function confirmAddScannedStock(){
  state.stocks = state.stocks || [];

  scannedStockItems.forEach(item => {
    const existing = state.stocks.find(x =>
      String(x.sku || '').toLowerCase() === String(item.sku || '').toLowerCase()
    );

    if(existing){
      existing.qty = num(existing.qty) + num(item.qty);
      existing.mrp = item.mrp || existing.mrp;
      existing.size = item.size || existing.size;
      existing.color = item.color || existing.color;
      existing.brand = item.brand || existing.brand;
      existing.article = item.article || existing.article;
    } else {
      state.stocks.push(item);
    }
  });

  scannedStockItems = [];
  save();
}

function clearStockPreview(){
  scannedStockItems = [];

  const area = document.getElementById('stockPreviewArea');

  if(area){
    area.innerHTML = '';
  }
}

async function analyzeFile(){
  const input = document.getElementById('uploadFile');
  const typeInput = document.getElementById('uploadType');
  const box = document.getElementById('uploadStatus');

  const file = input && input.files && input.files[0];
  const uploadType = typeInput ? typeInput.value : 'auto';

  if(!box){
    alert('uploadStatus missing');
    return;
  }

  box.style.display = 'block';

  if(!file){
    box.textContent = 'Pehle JSON / CSV / TXT file choose karo.';
    box.className = 'notice bad';
    return;
  }

  const fileName = String(file.name || '').toLowerCase();

  try{
    box.textContent = 'Reading file...';
    box.className = 'notice';

    if(fileName.endsWith('.json')){
      const text = (await file.text()).replace(/^\uFEFF/, '').trim();
      const data = JSON.parse(text);

      const result = importDataByType(data, uploadType, 'json-import');

      statusResult(result, uploadType === 'auto' ? 'JSON Auto' : 'JSON ' + uploadType.toUpperCase());
      return;
    }

    if(fileName.endsWith('.csv') || fileName.endsWith('.txt')){
      const text = (await file.text()).replace(/^\uFEFF/, '').trim();

      let result;

      if(uploadType === 'auto'){
        result = importCsvOrText(text, {
          source: fileName.endsWith('.csv') ? 'csv-import' : 'txt-import'
        });
      } else {
        result = importCsvTextByType(
          text,
          uploadType,
          fileName.endsWith('.csv') ? 'csv-import' : 'txt-import'
        );
      }

      statusResult(result, uploadType === 'auto' ? 'CSV/TXT Auto' : 'CSV/TXT ' + uploadType.toUpperCase());
      return;
    }

    box.textContent = 'Only JSON, CSV, TXT supported.';
    box.className = 'notice bad';

  } catch(error) {
    box.textContent = 'Import failed: ' + error.message;
    box.className = 'notice bad';
  }
}
function importDataByType(data, uploadType, source){
  if(uploadType === 'auto'){
    return importExtracted(data, {
      source: source
    });
  }

  const result = {
    profit: 0,
    updated: 0,
    sales: 0,
    stock: 0,
    skipped: 0
  };

  const rows = normalizeRows(data);

  rows.forEach(row => {
    if(uploadType === 'profit'){
      const added = addMonthlyFromRow(row, source);

      if(added === 'updated'){
        result.updated++;
      } else if(added){
        result.profit++;
      } else {
        result.skipped++;
      }

      return;
    }

    if(uploadType === 'stock'){
      if(addStockFromRow(row, source)){
        result.stock++;
      } else {
        result.skipped++;
      }

      return;
    }

    if(uploadType === 'sale'){
      if(addSaleFromRow(row, source)){
        result.sales++;
      } else {
        result.skipped++;
      }

      return;
    }

    result.skipped++;
  });

  return result;
}

function importCsvTextByType(text, uploadType, source){
  const result = {
    profit: 0,
    updated: 0,
    sales: 0,
    stock: 0,
    skipped: 0
  };

  const rows = csvTextToObjects(text);

  rows.forEach(row => {
    if(uploadType === 'profit'){
      const added = addMonthlyFromRow(row, source);

      if(added === 'updated'){
        result.updated++;
      } else if(added){
        result.profit++;
      } else {
        result.skipped++;
      }

      return;
    }

    if(uploadType === 'stock'){
      if(addStockFromRow(row, source)){
        result.stock++;
      } else {
        result.skipped++;
      }

      return;
    }

    if(uploadType === 'sale'){
      if(addSaleFromRow(row, source)){
        result.sales++;
      } else {
        result.skipped++;
      }

      return;
    }

    result.skipped++;
  });

  return result;
}

function csvTextToObjects(text){
  const arr = parseCsv(text);

  if(arr.length < 2){
    return [];
  }

  const headers = arr[0].map(header => {
    return String(header)
      .trim()
      .toLowerCase()
      .replace(/[.\s/_-]+/g, '');
  });

  return arr.slice(1).map(values => {
    const raw = {};

    headers.forEach((header, index) => {
      raw[header] = values[index];
    });

    return {
      type: raw.type,
      category: raw.category,
      date: raw.date,
      year: raw.year,
      month: raw.month,

      profit: raw.profit || raw.netprofit || raw.monthlyprofit,
      amount: raw.amount,
      income: raw.income,
      entries: raw.entries,
      remark: raw.remark || raw.note,

      product: raw.product || raw.item || raw.name,
      item: raw.item || raw.product || raw.name,
      name: raw.name || raw.product || raw.item,

      purchasePrice: raw.purchaseprice || raw.buy || raw.cost,
      sellingPrice: raw.sellingprice || raw.sell || raw.saleprice,
      qty: raw.qty || raw.quantity || raw.stockqty || raw.qtyinstock,

      lowStock: raw.lowstock || raw.reorder || raw.min,
      stockQty: raw.stockqty || raw.qtyinstock
    };
  });
}

function statusResult(r, type){
  const box = document.getElementById('uploadStatus');

  const ok = (r.profit + r.sales + r.stock + r.updated) > 0;

  box.className = 'notice ' + (ok ? 'success' : 'bad');

  box.innerHTML = `
    ${type} import complete.<br>
    <b>${r.profit}</b> profit record added,
    <b>${r.updated}</b> profit month updated,
    <b>${r.sales}</b> sales added,
    <b>${r.stock}</b> stock added,
    <b>${r.skipped}</b> skipped.
  `;

  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));

  renderHome();
  renderSales();
  renderStock();
  renderAnalytics();

  if(currentTab === 'analytics'){
    setTimeout(drawAnalyticsCharts, 0);
  }
}

function normalizeRows(data){
  let rows = [];

  if(Array.isArray(data)){
    rows = data;
  } else if(data && typeof data === 'object'){
    ['profit','profits','monthlyProfits','monthly','records','data','items'].forEach(k => {
      if(Array.isArray(data[k])){
        rows = rows.concat(data[k]);
      }
    });

    if(!rows.length && (data.year || data.month || data.profit || data.amount || data.income)){
      rows = [data];
    }
  }

  return rows.filter(x => x && typeof x === 'object');
}

function importExtracted(data, opt = {}){
  const result = {
    profit: 0,
    updated: 0,
    sales: 0,
    stock: 0,
    skipped: 0
  };

  const source = opt.source || 'import';

  if(data && Array.isArray(data.sales)){
    data.sales.forEach(x => {
      if(addSaleFromRow(x, source)) result.sales++;
      else result.skipped++;
    });
  }

  if(data && (Array.isArray(data.stock) || Array.isArray(data.stocks))){
    (data.stock || data.stocks).forEach(x => {
      if(addStockFromRow(x, source)) result.stock++;
      else result.skipped++;
    });
  }

  const rows = normalizeRows(data);

  rows.forEach(row => {
    const type = String(row.type || row.category || row.dataType || '').toLowerCase();

    const looksProfit =
      type.includes('profit') ||
      row.profit !== undefined ||
      row.netProfit !== undefined ||
      row.monthlyProfit !== undefined ||
      (row.year !== undefined && row.month !== undefined && (row.amount !== undefined || row.income !== undefined));

    const looksSale =
      type === 'sale' ||
      type === 'sales' ||
      row.sellingPrice !== undefined ||
      row.salePrice !== undefined ||
      row.sell !== undefined;

    const looksStock =
      type === 'stock' ||
      type === 'stocks' ||
      row.qtyInStock !== undefined ||
      row.stockQty !== undefined ||
      row.stockqty !== undefined;

    if(looksProfit && !looksSale){
      const added = addMonthlyFromRow(row, source);

      if(added === 'updated') result.updated++;
      else if(added) result.profit++;
      else result.skipped++;

      return;
    }

    if(looksSale){
      if(addSaleFromRow(row, source)) result.sales++;
      else result.skipped++;

      return;
    }

    if(looksStock){
      if(addStockFromRow(row, source)) result.stock++;
      else result.skipped++;

      return;
    }

    result.skipped++;
  });

  return result;
}

function addMonthlyFromRow(row, source){
  const amount = num(
    row.profit ??
    row.netProfit ??
    row.monthlyProfit ??
    row.amount ??
    row.income ??
    row.value
  );

  const ym = yearMonth(row.year, row.month, row.date);

  if(!amount || !/^\d{4}-\d{2}$/.test(ym)){
    return false;
  }

  const existing = state.monthly.find(x => x.month === ym);

  if(existing){
    existing.profit = amount;
    existing.source = source;
    existing.entries = row.entries ?? existing.entries;
    existing.remark = row.remark || row.note || existing.remark || '';

    return 'updated';
  }

  state.monthly.push({
    id: uid(),
    month: ym,
    profit: amount,
    entries: row.entries ?? null,
    remark: row.remark || row.note || '',
    source
  });

  return true;
}

function addSaleFromRow(row, source){
  const sell = num(row.sellingPrice ?? row.sell ?? row.salePrice ?? row.amount);
  const buy = num(row.purchasePrice ?? row.buy ?? row.cost);

  if(!sell && !buy) return false;

  state.sales.push({
    id: uid(),
    date: row.date || new Date().toISOString().slice(0, 10),
    product: row.product || row.item || row.name || 'Imported item',
    category: row.category || 'General',
    purchasePrice: buy,
    sellingPrice: sell,
    qty: num(row.qty ?? row.quantity ?? 1) || 1,
    source
  });

  return true;
}

function addStockFromRow(row, source){
  const qty = num(row.qty ?? row.quantity ?? row.stockQty ?? row.qtyInStock ?? row.stockqty);
  const name = row.product || row.item || row.name;

  if(!name && !qty) return false;

  state.stocks.push({
    id: uid(),
    item: name || 'Imported stock',
    product: name || 'Imported stock',
    category: row.category || 'General',
    qty,
    lowStock: num(row.lowStock ?? row.reorder ?? 5) || 5,
    min: num(row.lowStock ?? row.reorder ?? 5) || 5,
    source
  });

  return true;
}

function parseCsv(txt){
  const rows = [];
  let row = [];
  let cur = '';
  let q = false;

  for(let i = 0; i < txt.length; i++){
    const c = txt[i];
    const n = txt[i + 1];

    if(c === '"' && q && n === '"'){
      cur += '"';
      i++;
      continue;
    }

    if(c === '"'){
      q = !q;
      continue;
    }

    if(c === ',' && !q){
      row.push(cur);
      cur = '';
      continue;
    }

    if((c === '\n' || c === '\r') && !q){
      if(c === '\r' && n === '\n') i++;
      row.push(cur);

      if(row.some(v => String(v).trim() !== '')){
        rows.push(row);
      }

      row = [];
      cur = '';
      continue;
    }

    cur += c;
  }

  row.push(cur);

  if(row.some(v => String(v).trim() !== '')){
    rows.push(row);
  }

  return rows;
}

function importCsvOrText(txt, opt = {}){
  const result = {
    profit: 0,
    updated: 0,
    sales: 0,
    stock: 0,
    skipped: 0
  };

  const arr = parseCsv(txt);

  if(arr.length >= 2){
    const headers = arr[0].map(h =>
      String(h).trim().toLowerCase().replace(/[.\s/_-]+/g, '')
    );

    const hasHeader = headers.some(h =>
      ['type','year','month','profit','amount','date','sellingprice','purchaseprice','product','item','name','qty','quantity','entries','remark'].includes(h)
    );

    if(hasHeader){
      arr.slice(1).forEach(vals => {
        const row = {};

        headers.forEach((h, i) => {
          row[h] = vals[i];
        });

        const normalized = {
          type: row.type,
          category: row.category,
          date: row.date,
          year: row.year,
          month: row.month,
          amount: row.amount,
          profit: row.profit || row.netprofit || row.monthlyprofit,
          income: row.income,
          entries: row.entries,
          remark: row.remark || row.note,
          product: row.product || row.item || row.name,
          purchasePrice: row.purchaseprice || row.buy || row.cost,
          sellingPrice: row.sellingprice || row.sell || row.saleprice,
          qty: row.qty || row.quantity,
          stockQty: row.stockqty || row.qtyinstock
        };

        const type = String(normalized.type || '').toLowerCase();

        if(type.includes('profit') || normalized.profit || ((normalized.year && normalized.month) && normalized.amount)){
          const a = addMonthlyFromRow(normalized, opt.source || 'csv-import');

          if(a === 'updated') result.updated++;
          else if(a) result.profit++;
          else result.skipped++;

        } else if(type.includes('sale') || normalized.sellingPrice){
          if(addSaleFromRow(normalized, opt.source || 'csv-import')) result.sales++;
          else result.skipped++;

        } else if(type.includes('stock') || normalized.stockQty){
          if(addStockFromRow(normalized, opt.source || 'csv-import')) result.stock++;
          else result.skipped++;

        } else {
          result.skipped++;
        }
      });

      return result;
    }
  }

  txt.split(/\n+/).forEach(line => {
    const m = line.match(/(20\d{2}).{0,12}(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|january|february|march|april|june|july|august|september|october|november|december).{0,30}([0-9][0-9,]{2,})/i);

    if(m){
      const a = addMonthlyFromRow({
        year: m[1],
        month: m[2],
        profit: m[3]
      }, opt.source || 'txt-import');

      if(a === 'updated') result.updated++;
      else if(a) result.profit++;
      else result.skipped++;
    }
  });

  return result;
}

function downloadBlob(blob, name){
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();

  setTimeout(() => {
    URL.revokeObjectURL(a.href);
    a.remove();
  }, 500);
}

function downloadSampleJson(){
  const sample = [
    {
      type: 'profit',
      year: 2026,
      month: 'July',
      profit: 25000,
      remark: 'Monthly net profit'
    },
    {
      type: 'stock',
      product: 'Aqualite Sandal',
      qty: 12,
      lowStock: 5
    },
    {
      type: 'sale',
      date: '2026-07-07',
      product: 'School Shoes',
      purchasePrice: 300,
      sellingPrice: 450,
      qty: 1
    }
  ];

  downloadBlob(
    new Blob([JSON.stringify(sample, null, 2)], {
      type: 'application/json'
    }),
    'vyapar-ai-data-sample.json'
  );
}
function downloadSampleCsv(){
  const sample =
    'type,date,year,month,profit,product,purchasePrice,sellingPrice,qty,lowStock,remark\n' +
    'profit,,2026,July,25000,,,,,,Monthly net profit\n' +
    'stock,,,,,Aqualite Sandal,,,12,5,\n' +
    'sale,2026-07-07,,,,School Shoes,300,450,1,,\n';

  downloadBlob(
    new Blob([sample], {
      type: 'text/csv'
    }),
    'vyapar-ai-data-sample.csv'
  );
}

function removeBadImportedSales(){
  const before = state.sales.length;

  state.sales = state.sales.filter(x => {
    const src = String(x.source || '').toLowerCase();
    const junkSource = src.includes('csv') || src.includes('json') || src.includes('import');
    const junkName = /imported|profit|month|undefined/i.test(String(x.product || ''));
    const tiny = num(x.sellingPrice) < 100 && num(x.purchasePrice) === 0;

    return !(junkSource || junkName || tiny);
  });

  const removed = before - state.sales.length;

  save();

  setTimeout(() => {
    const el = document.getElementById('settingsStatus');

    if(el){
      el.textContent = removed + ' bad imported sales removed.';
      el.className = 'notice success';
    }
  }, 50);
}

function renderSales(){
  const el = document.getElementById('screen-sales');
  if(!el) return;

  const e = state.sales.find(x => x.id === editSaleId);
  const m = state.monthly.find(x => x.id === editMonthlyId);
  const today = new Date().toISOString().slice(0, 10);

  const todayDaily = (state.daily || []).filter(x => x.date === today);
  const todaySale = todayDaily.reduce((a, x) => a + num(x.sale), 0);
  const todayProfit = todayDaily.reduce((a, x) => a + num(x.profit), 0);

  el.innerHTML = `
    <div class="grid">
      <div class="card">
        <h2>${e ? 'Edit Sale' : 'Add Item Sale'}</h2>

        <label>Date</label>
        <input id="sdate" type="date" value="${e ? esc(e.date) : today}">

        <label>Product</label>
        <input id="sproduct" placeholder="School shoes" value="${e ? esc(e.product) : ''}">

        <div class="row">
          <div>
            <label>Category</label>
            <input id="scategory" placeholder="Footwear" value="${e ? esc(e.category) : ''}">
          </div>

          <div>
            <label>Quantity</label>
            <input id="sqty" type="number" value="${e ? e.qty : 1}">
          </div>
        </div>

        <div class="row">
          <div>
            <label>Purchase Price</label>
            <input id="sbuy" type="number" value="${e ? e.purchasePrice : ''}">
          </div>

          <div>
            <label>Selling Price</label>
            <input id="ssell" type="number" value="${e ? e.sellingPrice : ''}">
          </div>
        </div>

        <div class="actions">
          ${
            e
            ? `<button class="btn primary" onclick="updateSale()">Update Sale</button>
               <button class="btn" onclick="cancelSaleEdit()">Cancel</button>`
            : `<button class="btn primary" onclick="addSale()">Save Sale</button>`
          }
        </div>
      </div>

      <div class="card">
        <h2>Daily Quick Entry</h2>
        <p class="muted">Sirf total amount daalo. Product wise entry compulsory nahi.</p>

        <label>Date</label>
        <input id="ddate" type="date" value="${today}">

        <label>Total Daily Sale</label>
        <input id="dsale" type="number" placeholder="Example: 8500">

        <label>Daily Profit</label>
        <input id="dprofit" type="number" placeholder="Example: 1200">

        <button class="btn gold" onclick="addDaily()">
          Save Daily Entry
        </button>

        <div class="notice success" style="margin-top:12px">
          Today Sale: <b>${money(todaySale)}</b><br>
          Today Profit: <b>${money(todayProfit)}</b>
        </div>
      </div>

      <div class="card">
        <h2>${m ? 'Edit Monthly Profit' : 'Monthly Profit Entry'}</h2>

        <label>Month</label>
        <input id="mmonth" type="month" value="${m ? esc(m.month) : monthKey()}">

        <label>Net Profit</label>
        <input id="mprofit" type="number" value="${m ? m.profit : ''}">

        <div class="actions">
          ${
            m
            ? `<button class="btn gold" onclick="updateMonthly()">Update Profit</button>
               <button class="btn" onclick="cancelMonthlyEdit()">Cancel</button>`
            : `<button class="btn gold" onclick="addMonthly()">Save Monthly Profit</button>`
          }
        </div>
      </div>
    </div>

    <div class="card" style="margin-top:14px">
      <h2>Daily Records</h2>

      <div class="scroll">
        <table class="table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Total Sale</th>
              <th>Profit</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            ${
              (state.daily || []).slice().reverse().map(x => `
                <tr>
                  <td>${esc(x.date)}</td>
                  <td>${money(x.sale)}</td>
                  <td>${money(x.profit)}</td>
                  <td>
                    <button class="btn mini danger" onclick="delDaily('${x.id}')">
                      Delete
                    </button>
                  </td>
                </tr>
              `).join('')
              || `<tr><td colspan="4" class="muted">No daily records yet.</td></tr>`
            }
          </tbody>
        </table>
      </div>
    </div>

    <div class="card" style="margin-top:14px">
      <h2>Sales Records</h2>

      <div class="scroll">
        <table class="table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Product</th>
              <th>Qty</th>
              <th>Buy</th>
              <th>Sell</th>
              <th>Profit</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            ${
              state.sales.slice().reverse().map(x => `
                <tr>
                  <td>${esc(x.date)}</td>
                  <td>${esc(x.product)}</td>
                  <td>${x.qty}</td>
                  <td>${money(x.purchasePrice)}</td>
                  <td>${money(x.sellingPrice)}</td>
                  <td>${money((x.sellingPrice - x.purchasePrice) * x.qty)}</td>
                  <td>
                    <div class="actions">
                      <button class="btn mini" onclick="editSale('${x.id}')">Edit</button>
                      <button class="btn mini danger" onclick="delSale('${x.id}')">Delete</button>
                    </div>
                  </td>
                </tr>
              `).join('')
              || `<tr><td colspan="7" class="muted">No sale records yet.</td></tr>`
            }
          </tbody>
        </table>
      </div>
    </div>

    <div class="card" style="margin-top:14px">
      <h2>Monthly Profit Records</h2>

      <div class="scroll">
        <table class="table">
          <thead>
            <tr>
              <th>Month</th>
              <th>Net Profit</th>
              <th>Source</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            ${
              state.monthly.slice()
                .sort((a, b) => String(b.month).localeCompare(String(a.month)))
                .map(x => `
                  <tr>
                    <td>${monthLabel(x.month)}</td>
                    <td>${money(x.profit)}</td>
                    <td>${esc(x.source || 'manual')}</td>
                    <td>
                      <div class="actions">
                        <button class="btn mini" onclick="editMonthly('${x.id}')">Edit</button>
                        <button class="btn mini danger" onclick="delMonthly('${x.id}')">Delete</button>
                      </div>
                    </td>
                  </tr>
                `).join('')
              || `<tr><td colspan="4" class="muted">No monthly profit records yet.</td></tr>`
            }
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function saleFormData(){
  return {
    id: editSaleId || uid(),
    date: v('sdate'),
    product: v('sproduct') || 'Sale item',
    category: v('scategory') || 'General',
    purchasePrice: +v('sbuy') || 0,
    sellingPrice: +v('ssell') || 0,
    qty: +v('sqty') || 1
  };
}

function addSale(){
  state.sales.push(saleFormData());
  save();
}

function editSale(id){
  editSaleId = id;
  currentTab = 'sales';
  render();
}

function updateSale(){
  const i = state.sales.findIndex(x => x.id === editSaleId);

  if(i >= 0){
    state.sales[i] = saleFormData();
  }

  editSaleId = '';
  save();
}

function cancelSaleEdit(){
  editSaleId = '';
  render();
}

function delSale(id){
  if(confirm('Delete this sale record?')){
    state.sales = state.sales.filter(x => x.id !== id);

    if(editSaleId === id){
      editSaleId = '';
    }

    save();
  }
}

function addDaily(){
  state.daily = state.daily || [];

  state.daily.push({
    id: uid(),
    date: v('ddate') || new Date().toISOString().slice(0, 10),
    sale: num(v('dsale')),
    profit: num(v('dprofit')),
    source: 'manual-daily'
  });

  save();
}

function delDaily(id){
  if(confirm('Delete this daily entry?')){
    state.daily = (state.daily || []).filter(x => x.id !== id);
    save();
  }
}

function addMonthly(){
  state.monthly.push({
    id: uid(),
    month: v('mmonth'),
    profit: +v('mprofit') || 0,
    source: 'manual'
  });

  save();
}

function editMonthly(id){
  editMonthlyId = id;
  currentTab = 'sales';
  render();
}

function updateMonthly(){
  const i = state.monthly.findIndex(x => x.id === editMonthlyId);

  if(i >= 0){
    state.monthly[i] = {
      ...state.monthly[i],
      month: v('mmonth'),
      profit: +v('mprofit') || 0,
      source: state.monthly[i].source || 'manual'
    };
  }

  editMonthlyId = '';
  save();
}

function cancelMonthlyEdit(){
  editMonthlyId = '';
  render();
}

function delMonthly(id){
  if(confirm('Delete this monthly profit entry?')){
    state.monthly = state.monthly.filter(x => x.id !== id);

    if(editMonthlyId === id){
      editMonthlyId = '';
    }

    save();
  }
}

function monthLabel(m){
  if(!m) return '-';

  const [y, mo] = String(m).split('-');

  const names = [
    'Jan','Feb','Mar','Apr','May','Jun',
    'Jul','Aug','Sep','Oct','Nov','Dec'
  ];

  return `${names[(+mo || 1) - 1]} ${y || ''}`;
}

function renderStock(){
  const el = document.getElementById('screen-stock');
  if(!el) return;

  const stockValue = (state.stocks || []).reduce((sum, x) => {
    const price = num(x.purchasePrice || x.buy || x.cost || x.mrp || 0);
    return sum + price * num(x.qty);
  }, 0);

  el.innerHTML = `
    <div class="stats">
      <div class="stat">
        <span class="muted">Items</span>
        <b>${(state.stocks || []).length}</b>
      </div>

      <div class="stat">
        <span class="muted">Stock Value</span>
        <b>${money(stockValue)}</b>
      </div>
    </div>

    <div class="card" style="margin-top:14px">
      <h2>Stock Manager</h2>

      <div class="grid3">
        <div>
          <label>Item</label>
          <input id="stockItem">
        </div>

        <div>
          <label>Available Qty</label>
          <input id="stockQty" type="number">
        </div>

        <div>
          <label>Min Alert Qty</label>
          <input id="stockMin" type="number" value="5">
        </div>
      </div>

      <button class="btn primary" onclick="addStock()">
        Save Stock
      </button>
    </div>

    <div class="card" style="margin-top:14px">
      <h3>Stock Alerts</h3>

      ${
        state.stocks.map(s => `
          <p class="pill">
            ${esc(s.item || s.product || 'Item')}: ${num(s.qty)} left
            ${num(s.qty) <= num(s.min || s.lowStock || 5) ? '<b class="danger-text"> Reorder</b>' : ''}
          </p>
        `).join(' ')
        || '<p class="muted">No stock data yet.</p>'
      }
    </div>
  `;
}

function addStock(){
  state.stocks.push({
    id: uid(),
    item: v('stockItem') || 'Stock item',
    product: v('stockItem') || 'Stock item',
    qty: +v('stockQty') || 0,
    min: +v('stockMin') || 5,
    lowStock: +v('stockMin') || 5,
    source: 'manual'
  });

  save();
}

function monthlySeriesAll(){
  const map = {};
  const monthlyMonths = new Set();

  state.monthly.forEach(x => {
    if(!x.month) return;

    map[x.month] = (+x.profit || 0);
    monthlyMonths.add(x.month);
  });

  (state.daily || []).forEach(x => {
    const k = monthKey(x.date);

    if(monthlyMonths.has(k)) return;

    map[k] = (map[k] || 0) + num(x.profit);
  });

  state.sales.forEach(x => {
    const k = monthKey(x.date);

    if(monthlyMonths.has(k)) return;

    const profit =
      ((+x.sellingPrice || 0) - (+x.purchasePrice || 0)) *
      (+x.qty || 0);

    map[k] = (map[k] || 0) + profit;
  });

  return Object.entries(map)
    .filter(x => x[0])
    .sort();
}

function monthlySeries(){
  return monthlySeriesAll().slice(-12);
}

function availableYears(){
  return [
    ...new Set(
      monthlySeriesAll()
        .map(x => String(x[0]).slice(0, 4))
        .filter(Boolean)
    )
  ].sort();
}

function yearlySeries(){
  const out = {};

  monthlySeriesAll().forEach(([k, v]) => {
    const y = String(k).slice(0, 4);
    out[y] = (out[y] || 0) + (+v || 0);
  });

  return Object.entries(out).sort();
}

function monthlySeriesForYear(year){
  const yearStr = String(year);
  const base = Object.fromEntries(
    monthlySeriesAll().filter(([k]) => String(k).startsWith(yearStr + '-'))
  );

  return Array.from({ length: 12 }, (_, i) => {
    const mm = String(i + 1).padStart(2, '0');
    const key = `${yearStr}-${mm}`;

    return [key, +base[key] || 0];
  });
}

function seriesStats(series){
  const vals = series.map(x => +x[1] || 0);
  const total = vals.reduce((a, b) => a + b, 0);

  return {
    count: vals.length,
    avg: vals.length ? total / vals.length : 0,
    high: vals.length ? Math.max(...vals) : 0,
    low: vals.length ? Math.min(...vals) : 0,
    total
  };
}

function monthlyStats(){
  const s = monthlySeriesAll();
  const vals = s.map(x => +x[1] || 0);
  const sum = vals.reduce((a, b) => a + b, 0);

  return {
    count: vals.length,
    avg: vals.length ? sum / vals.length : 0,
    high: vals.length ? Math.max(...vals) : 0,
    low: vals.length ? Math.min(...vals) : 0
  };
}

function renderAnalytics(){
  const el = document.getElementById('screen-analytics');
  if(!el) return;

  const ms = monthlyStats();
  const years = availableYears();

  const investment = num(state.profile.totalInvestment);
  const valuationMultiple = 2;

  const annualProfit = ms.avg * 12;
  const value = Math.max(annualProfit * valuationMultiple, 0);

  const roi = investment > 0 ? (annualProfit / investment) * 100 : 0;
  const paybackMonths = investment > 0 && ms.avg > 0 ? investment / ms.avg : 0;

  const totalNetProfit = monthlySeriesAll().reduce((sum, item) => {
    return sum + (+item[1] || 0);
  }, 0);

  el.innerHTML = `
    <div class="stats">
      <div class="stat">
        <span>Net Profit</span>
        <b>${money(totalNetProfit)}</b>
      </div>

      <div class="stat">
        <span>Average Monthly</span>
        <b>${money(ms.avg)}</b>
      </div>

      <div class="stat">
        <span>Annual Profit</span>
        <b>${money(annualProfit)}</b>
      </div>

      <div class="stat">
        <span>Total Investment</span>
        <b>${money(investment)}</b>
      </div>

      <div class="stat">
        <span>ROI</span>
        <b>${investment > 0 ? pct(roi) : '-'}</b>
      </div>

      <div class="stat">
        <span>Payback</span>
        <b>${paybackMonths > 0 ? paybackMonths.toFixed(1) + ' months' : '-'}</b>
      </div>

      <div class="stat">
        <span>Highest Month</span>
        <b>${money(ms.high)}</b>
      </div>

      <div class="stat">
        <span>Base Valuation</span>
        <b>${money(value)}</b>
      </div>
    </div>

    <div class="card" style="margin-top:14px">
      <h2>Total Investment</h2>
      <p class="muted">
        Stock, furniture, renovation, computer, setup cost sabka total daalo.
      </p>

      <label>Total Investment Amount</label>
      <input
        type="number"
        value="${investment}"
        placeholder="Example: 500000"
        onchange="state.profile.totalInvestment=num(this.value);save()"
      >
    </div>

    <div class="card chart-wrap" style="margin-top:14px">
      <h2>Year Wise Profit Graph</h2>
      <canvas id="yearlyProfitCanvas"></canvas>
    </div>

    <div class="card chart-wrap" style="margin-top:14px">
      <h2>Monthly Comparison Graph</h2>
      <canvas id="monthlyComparisonCanvas"></canvas>
    </div>

    ${
      years.length
      ? years.map(y => `
        <div class="card chart-wrap" style="margin-top:14px">
          <h2>${y} Monthly Profit Graph</h2>
          <canvas id="monthlyProfitCanvas-${y}"></canvas>
        </div>
      `).join('')
      : `<div class="notice bad" style="margin-top:14px">Abhi analytics data nahi hai.</div>`
    }

    <div class="card" style="margin-top:14px">
      <h2>10 Year Plan</h2>
      <ol>${plan10({ profit: totalNetProfit }).map(x => `<li>${x}</li>`).join('')}</ol>
    </div>
  `;
}

function drawProfitChart(){
  drawAnalyticsCharts();
}

function drawAnalyticsCharts(){
  drawYearlyProfitChart();
  drawMonthlyComparisonChart();
  availableYears().forEach(y => drawMonthlyYearChart(y));
}

function chartTheme(){
  const css = getComputedStyle(document.body);

  return {
    text: css.getPropertyValue('--text').trim() || '#eef7ff',
    muted: css.getPropertyValue('--muted').trim() || '#9fb4ca',
    line: css.getPropertyValue('--line').trim() || '#1f3b59',
    teal: css.getPropertyValue('--teal').trim() || '#19c2bf',
    gold: css.getPropertyValue('--gold').trim() || '#f4bd38'
  };
}

function setupCanvas(c, height){
  if(!c) return null;

  const ctx = c.getContext('2d');
  const lite = isLiteMode();
  const dpr = lite ? 1 : Math.min(window.devicePixelRatio || 1, 1.5);

  const w = Math.max(c.offsetWidth || 320, 320);
  const h = height || (window.innerWidth < 800 ? 260 : 300);

  c.width = Math.floor(w * dpr);
  c.height = Math.floor(h * dpr);
  c.style.height = h + 'px';

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);

  return { ctx, w, h, lite, dpr };
}

function drawEmptyChart(c, msg){
  const setup = setupCanvas(c, 260);
  if(!setup) return;

  const { ctx } = setup;
  const theme = chartTheme();

  ctx.fillStyle = theme.muted;
  ctx.font = '13px system-ui, sans-serif';
  ctx.fillText(msg || 'No data available.', 18, 42);
}

function drawYearlyProfitChart(){
  const c = document.getElementById('yearlyProfitCanvas');
  if(!c) return;

  const series = yearlySeries();

  if(!series.length){
    drawEmptyChart(c, 'No year-wise profit data available.');
    return;
  }

  drawBarChart(c, series.map(x => x[0]), series.map(x => +x[1] || 0));
}

function drawMonthlyComparisonChart(){
  const c = document.getElementById('monthlyComparisonCanvas');
  if(!c) return;

  const s = monthlySeries().slice(-12);

  if(!s.length){
    drawEmptyChart(c, 'No monthly data available.');
    return;
  }

  drawBarChart(c, s.map(x => monthLabel(x[0])), s.map(x => +x[1] || 0));
}

function drawMonthlyYearChart(year){
  const c = document.getElementById('monthlyProfitCanvas-' + year);
  if(!c) return;

  const s = monthlySeriesForYear(year);

  if(!s.some(x => (+x[1] || 0) !== 0)){
    drawEmptyChart(c, 'No monthly data for ' + year + '.');
    return;
  }

  drawBarChart(c, s.map(x => monthLabel(x[0]).split(' ')[0]), s.map(x => +x[1] || 0));
}

function drawBarChart(c, labels, values){
  const setup = setupCanvas(c, 280);
  if(!setup) return;

  const { ctx, w, h } = setup;
  const theme = chartTheme();

  const max = Math.max(...values, 1);
  const padL = 52;
  const padR = 14;
  const padT = 24;
  const padB = 42;
  const plotW = w - padL - padR;
  const plotH = h - padT - padB;

  ctx.strokeStyle = theme.line;
  ctx.fillStyle = theme.muted;
  ctx.font = '11px system-ui, sans-serif';

  for(let i = 0; i <= 4; i++){
    const gy = padT + i * plotH / 4;

    ctx.beginPath();
    ctx.moveTo(padL, gy);
    ctx.lineTo(w - padR, gy);
    ctx.stroke();

    ctx.fillText(shortMoney(max - (max * i / 4)), 4, gy + 4);
  }

  const gap = 8;
  const barW = Math.max(10, (plotW - gap * (values.length - 1)) / values.length);

  values.forEach((val, i) => {
    const bh = Math.max(val ? 2 : 0, (val / max) * plotH);
    const x = padL + i * (barW + gap);
    const y = padT + plotH - bh;

    const grad = ctx.createLinearGradient(0, y, 0, padT + plotH);
    grad.addColorStop(0, 'rgba(25,194,191,.95)');
    grad.addColorStop(1, 'rgba(244,189,56,.70)');

    ctx.fillStyle = grad;
    ctx.fillRect(x, y, barW, bh);

    ctx.fillStyle = theme.muted;
    ctx.font = '10px system-ui, sans-serif';
    ctx.fillText(String(labels[i]).slice(0, 6), x, h - 16);
  });
}

function shortMoney(v){
  const n = Number(v) || 0;
  const abs = Math.abs(n);

  if(abs >= 10000000) return '₹' + (n / 10000000).toFixed(1) + 'Cr';
  if(abs >= 100000) return '₹' + (n / 100000).toFixed(1) + 'L';
  if(abs >= 1000) return '₹' + (n / 1000).toFixed(0) + 'k';

  return money(n);
}

function plan10(t){
  const base = Math.max(t.profit, state.profile.monthlyGoal || 50000);

  return Array.from({ length: 10 }, (_, i) => {
    return `Year ${i + 1}: target monthly net profit ${money(base * Math.pow(1.18, i))}.`;
  });
}
function renderCalculator(){
  const el = document.getElementById('screen-calculator');

  if(!el){
    return;
  }

  el.innerHTML = `
    <div class="calculator-page">

      <div class="card calculator-card">
        <div class="calculator-head">
          <div>
            <h2>Calculator</h2>
            <p class="muted">
              Mobile keyboard ki need nahi. Buttons se calculate karo.
            </p>
          </div>

          <span class="pill">₹ Calculator</span>
        </div>

        <div class="calc-display-wrap">
          <input
            id="normalCalc"
            class="calc-display"
            value=""
            placeholder="0"
            readonly
          >

          <div id="normalResult" class="calc-result">
            Total: ₹0
          </div>
        </div>

        <div class="calc-keypad">
          <button class="calc-key danger" onclick="calcClear('normalCalc', 'normalResult')">C</button>
          <button class="calc-key" onclick="calcBackspace('normalCalc')">⌫</button>
          <button class="calc-key" onclick="calcPress('normalCalc', '%')">%</button>
          <button class="calc-key operator" onclick="calcPress('normalCalc', '/')">÷</button>

          <button class="calc-key" onclick="calcPress('normalCalc', '7')">7</button>
          <button class="calc-key" onclick="calcPress('normalCalc', '8')">8</button>
          <button class="calc-key" onclick="calcPress('normalCalc', '9')">9</button>
          <button class="calc-key operator" onclick="calcPress('normalCalc', '*')">×</button>

          <button class="calc-key" onclick="calcPress('normalCalc', '4')">4</button>
          <button class="calc-key" onclick="calcPress('normalCalc', '5')">5</button>
          <button class="calc-key" onclick="calcPress('normalCalc', '6')">6</button>
          <button class="calc-key operator" onclick="calcPress('normalCalc', '-')">−</button>

          <button class="calc-key" onclick="calcPress('normalCalc', '1')">1</button>
          <button class="calc-key" onclick="calcPress('normalCalc', '2')">2</button>
          <button class="calc-key" onclick="calcPress('normalCalc', '3')">3</button>
          <button class="calc-key operator" onclick="calcPress('normalCalc', '+')">+</button>

          <button class="calc-key" onclick="calcPress('normalCalc', '0')">0</button>
          <button class="calc-key" onclick="calcPress('normalCalc', '00')">00</button>
          <button class="calc-key" onclick="calcPress('normalCalc', '.')">.</button>
          <button class="calc-key equal" onclick="calcNormal()">=</button>
        </div>

        <div class="quick-row">
          <button class="btn mini" onclick="calcPress('normalCalc', '100')">100</button>
          <button class="btn mini" onclick="calcPress('normalCalc', '250')">250</button>
          <button class="btn mini" onclick="calcPress('normalCalc', '500')">500</button>
          <button class="btn mini" onclick="calcPress('normalCalc', '1000')">1000</button>
        </div>
      </div>

    </div>
  `;
}

function calcPress(targetId, value){
  const input = document.getElementById(targetId);

  if(!input){
    return;
  }

  const oldValue = input.value || '';
  const operators = ['+', '-', '*', '/', '%'];
  const lastChar = oldValue.slice(-1);

  if(operators.includes(value) && operators.includes(lastChar)){
    input.value = oldValue.slice(0, -1) + value;
    return;
  }

  input.value = oldValue + value;
}

function calcBackspace(targetId){
  const input = document.getElementById(targetId);

  if(!input){
    return;
  }

  input.value = input.value.slice(0, -1);
}

function calcClear(targetId, resultId){
  const input = document.getElementById(targetId);
  const result = document.getElementById(resultId);

  if(input){
    input.value = '';
  }

  if(result){
    result.textContent = 'Total: ₹0';
  }
}

function calcNormal(){
  const input = document.getElementById('normalCalc');
  const result = document.getElementById('normalResult');

  if(!input || !result){
    return;
  }

  const raw = input.value.trim();

  if(!raw){
    result.textContent = 'Total: ₹0';
    return;
  }

  const expr = raw
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/[–—]/g, '-');

  if(/[^0-9+\-*/().%\s]/.test(expr)){
    result.textContent = 'Invalid expression';
    return;
  }

  try{
    const safeExpr = expr.replace(/%/g, '/100');
    const total = Function('"use strict"; return (' + safeExpr + ')')();

    result.textContent = 'Total: ' + money(Number(total) || 0);
  } catch(error) {
    result.textContent = 'Invalid expression';
  }
}


function renderSubscription(){
  const el = document.getElementById('screen-subscription');
  if(!el) return;

  const currentPlan = getCurrentPlan();

  el.innerHTML = `
    <div class="grid3">
      <div class="card ${currentPlan === 'free' ? 'active-plan' : ''}">
        <h2>Free</h2>
        <h3>₹0</h3>
        <p class="muted">Manual sale entry</p>
        <p class="muted">Basic profit calculation</p>
        <p class="muted">Basic reports</p>

        <button class="btn primary" onclick="selectPlan('free')">
          ${currentPlan === 'free' ? 'Active Plan' : 'Select Free'}
        </button>
      </div>

      <div class="card ${currentPlan === 'pro' ? 'active-plan' : ''}">
        <h2>Pro</h2>
        <h3>₹199/month</h3>
        <p class="muted">AI upload</p>
        <p class="muted">Analytics</p>
        <p class="muted">Business valuation</p>

        <button class="btn primary" onclick="startPayment('pro')">
          ${currentPlan === 'pro' ? 'Active Plan' : 'Select Pro'}
        </button>
      </div>

      <div class="card ${currentPlan === 'business' ? 'active-plan' : ''}">
        <h2>Business</h2>
        <h3>₹499/month</h3>
        <p class="muted">All Pro features</p>
        <p class="muted">Advanced stock</p>
        <p class="muted">Multi-shop support</p>

        <button class="btn primary" onclick="startPayment('business')">
          ${currentPlan === 'business' ? 'Active Plan' : 'Select Business'}
        </button>
      </div>
    </div>

    <div class="notice success" style="margin-top:14px">
      Current Plan: <b>${currentPlan.toUpperCase()}</b>
    </div>
  `;
}

function selectPlan(planName){
  if(planName === 'free'){
    state.plan = 'free';

    state.subscription = {
      plan: 'free',
      verified: false,
      token: ''
    };

    save();
    renderSubscription();

    const badge = document.getElementById('planBadge');

    if(badge){
      badge.textContent = 'FREE Plan';
    }

    return;
  }

  state.plan = planName;

  save();
  renderSubscription();

  const badge = document.getElementById('planBadge');

  if(badge){
    badge.textContent = planName.toUpperCase() + ' Plan';
  }
}

async function startPayment(planName){
  if(planName === 'free'){
    selectPlan('free');
    return;
  }

  if(typeof Razorpay === 'undefined'){
    alert('Razorpay script missing in index.html');
    return;
  }

  const backendUrl = 'https://vypar-backend.onrender.com';

  try{
    showPaymentLoader('Opening Razorpay payment...');

    const orderRes = await fetch(backendUrl + '/payment/create-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        plan: planName
      })
    });

    const orderData = await orderRes.json();

    if(!orderData.success){
      hidePaymentLoader();
      alert(orderData.message || 'Order create failed');
      return;
    }

    const options = {
      key: orderData.keyId,
      amount: orderData.amount,
      currency: orderData.currency,
      name: 'Vyapar AI',
      description: planName.toUpperCase() + ' Plan',
      order_id: orderData.orderId,

      handler: async function(response){
        try{
          showPaymentLoader('Verifying payment...');

          const verifyRes = await fetch(backendUrl + '/payment/verify', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              plan: planName
            })
          });

          const verifyData = await verifyRes.json();
          if(verifyData.success && verifyData.subscriptionToken){
  state.subscription = {
    plan: verifyData.plan || planName,
    verified: true,
    token: verifyData.subscriptionToken
  };

  state.plan = verifyData.plan || planName;

  save();

  showPlanSuccessPopup(verifyData.plan || planName);

  return;
}

          hidePaymentLoader();

          if(verifyData.success && verifyData.subscriptionToken){
  const activePlan = verifyData.plan || planName;

  state.subscription = {
    plan: activePlan,
    verified: true,
    token: verifyData.subscriptionToken
  };

  state.plan = activePlan;

  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));

  const badge = document.getElementById('planBadge');

  if(badge){
    badge.textContent = activePlan.toUpperCase() + ' Plan';
  }

  hidePaymentLoader();

  renderSubscription();

  setTimeout(function(){
    hidePaymentLoader();
    showPlanSuccessPopup(activePlan);
  }, 200);

  return;
}
              

          alert(verifyData.message || 'Payment verify failed');

        } catch(error) {
          hidePaymentLoader();
          alert('Payment verify error: ' + error.message);
        }
      },

      modal: {
        ondismiss: function(){
          hidePaymentLoader();

          setTimeout(function(){
            showPaymentCancelPopup(planName);
          }, 300);
        }
      },

      theme: {
        color: '#22d3ee'
      }
    };

    const razorpay = new Razorpay(options);

    hidePaymentLoader();
    razorpay.open();

  } catch(error) {
    hidePaymentLoader();
    alert('Payment error: ' + error.message);
  }
}
function showPaymentLoader(message){
  hidePaymentLoader();

  const loader = document.createElement('div');
  loader.id = 'paymentLoader';

  loader.innerHTML = `
    <div style="
      background:#101827;
      border:1px solid #22d3ee;
      border-radius:18px;
      padding:22px;
      min-width:240px;
      text-align:center;
      box-shadow:0 0 35px rgba(34,211,238,0.35);
    ">
      <div style="
        width:42px;
        height:42px;
        border:4px solid rgba(255,255,255,0.2);
        border-top-color:#22d3ee;
        border-radius:50%;
        margin:0 auto 14px;
        animation:spinPay 0.8s linear infinite;
      "></div>

      <b id="paymentLoaderText">
        ${message || 'Opening payment...'}
      </b>
    </div>
  `;

  loader.style.cssText = `
    position:fixed;
    inset:0;
    background:rgba(0,0,0,0.65);
    display:flex;
    align-items:center;
    justify-content:center;
    z-index:999999999;
    color:white;
    font-family:Arial,sans-serif;
  `;

  document.body.appendChild(loader);

  if(!document.getElementById('paymentSpinStyle')){
    const style = document.createElement('style');
    style.id = 'paymentSpinStyle';

    style.innerHTML = `
      @keyframes spinPay {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
    `;

    document.head.appendChild(style);
  }
}

function hidePaymentLoader(){
  document.querySelectorAll('#paymentLoader').forEach(loader => {
    loader.remove();
  });

  const tabLoader = document.getElementById('tabLoader');

  if(tabLoader){
    tabLoader.classList.remove('show');
  }
}

function showPlanSuccessPopup(planName){
  hidePaymentLoader();
  const oldPopup = document.getElementById('planSuccessPopup');


  if(oldPopup){
    oldPopup.remove();
  }

  const popup = document.createElement('div');
  popup.id = 'planSuccessPopup';

  popup.style.cssText = `
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.75);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 999999999;
    padding: 20px;
  `;

  popup.innerHTML = `
    <div style="
      width: min(92vw, 380px);
      background: linear-gradient(180deg, #0f172a, #111827);
      border: 1px solid rgba(34,211,238,0.45);
      border-radius: 24px;
      padding: 28px 22px;
      text-align: center;
      color: white;
      box-shadow: 0 25px 70px rgba(0,0,0,0.55);
      font-family: Arial, sans-serif;
    ">
      <div style="
        width: 76px;
        height: 76px;
        border-radius: 50%;
        background: linear-gradient(135deg, #22c55e, #16a34a);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 38px;
        font-weight: 900;
        margin: 0 auto 16px;
      ">✓</div>

      <h2 style="margin: 0 0 10px; font-size: 24px;">
        Subscription Activated
      </h2>

      <p style="margin: 0 0 18px; color: #cbd5e1; font-size: 15px;">
        You are now on the
        <b style="
          background: linear-gradient(135deg, #22d3ee, #2563eb);
          padding: 6px 12px;
          border-radius: 999px;
          color: white;
        ">${planName.toUpperCase()}</b>
        plan
      </p>

      <button id="closePlanSuccessPopup" style="
        width: 100%;
        border: none;
        border-radius: 14px;
        padding: 14px;
        background: linear-gradient(135deg, #22d3ee, #2563eb);
        color: white;
        font-size: 15px;
        font-weight: 800;
      ">
        Continue
      </button>
    </div>
  `;

  document.body.appendChild(popup);

  document.getElementById('closePlanSuccessPopup').onclick = function(){
    popup.remove();
  };

  setTimeout(function(){
    if(document.getElementById('planSuccessPopup')){
      popup.remove();
    }
  }, 5000);
}

function showPaymentCancelPopup(planName){
  const oldPopup = document.getElementById('paymentCancelPopup');

  if(oldPopup){
    oldPopup.remove();
  }

  const popup = document.createElement('div');
  popup.id = 'paymentCancelPopup';

  popup.style.cssText = `
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.72);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 999999999;
    padding: 20px;
  `;

  popup.innerHTML = `
    <div style="
      width: min(92vw, 360px);
      background: linear-gradient(180deg, #111827, #0f172a);
      border: 1px solid rgba(248,113,113,0.45);
      border-radius: 24px;
      padding: 26px 22px;
      text-align: center;
      color: white;
      box-shadow: 0 25px 70px rgba(0,0,0,0.55);
      font-family: Arial, sans-serif;
    ">
      <div style="
        width: 70px;
        height: 70px;
        border-radius: 50%;
        background: linear-gradient(135deg, #ef4444, #b91c1c);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 36px;
        font-weight: 900;
        margin: 0 auto 15px;
      ">×</div>

      <h2 style="margin:0 0 8px; font-size:24px;">
        Payment Cancelled
      </h2>

      <p style="margin:0 0 18px; color:#cbd5e1; font-size:15px;">
        ${planName.toUpperCase()} plan activate nahi hua.
      </p>

      <button id="retryPaymentBtn" style="
        width:100%;
        border:none;
        border-radius:14px;
        padding:14px;
        background:linear-gradient(135deg,#22d3ee,#2563eb);
        color:white;
        font-size:15px;
        font-weight:800;
        margin-bottom:10px;
      ">
        Try Again
      </button>

      <button id="closeCancelPopup" style="
        width:100%;
        border:1px solid rgba(255,255,255,0.15);
        border-radius:14px;
        padding:13px;
        background:rgba(255,255,255,0.06);
        color:white;
        font-size:14px;
        font-weight:700;
      ">
        Close
      </button>
    </div>
  `;

  document.body.appendChild(popup);

  document.getElementById('retryPaymentBtn').onclick = function(){
    popup.remove();
    startPayment(planName);
  };

  document.getElementById('closeCancelPopup').onclick = function(){
    popup.remove();
  };
}

function showUpgradePopup(requiredPlan, currentPlan){
  const oldPopup = document.getElementById('upgradePlanPopup');

  if(oldPopup){
    oldPopup.remove();
  }

  const planName = requiredPlan.toUpperCase();
  const price = requiredPlan === 'business' ? '₹499/month' : '₹199/month';

  const features = requiredPlan === 'business'
    ? ['Advanced stock tools', 'Business level analytics', 'Multi-shop growth tools']
    : ['AI upload unlocked', 'Analytics unlocked', 'Business valuation unlocked'];

  const popup = document.createElement('div');
  popup.id = 'upgradePlanPopup';

  popup.style.cssText = `
    position:fixed;
    inset:0;
    background:rgba(2,6,23,0.78);
    display:flex;
    align-items:center;
    justify-content:center;
    z-index:999999999;
    padding:20px;
  `;

  popup.innerHTML = `
    <div style="
      width:min(92vw,390px);
      border-radius:28px;
      padding:28px 22px 22px;
      text-align:center;
      color:#f8fafc;
      background:linear-gradient(180deg,#0f172a,#020617);
      border:1px solid rgba(34,211,238,0.32);
      box-shadow:0 25px 80px rgba(0,0,0,0.58);
      font-family:Arial,sans-serif;
    ">
      <button id="closeUpgradePopup" style="
        float:right;
        width:34px;
        height:34px;
        border-radius:50%;
        border:1px solid rgba(255,255,255,0.12);
        background:rgba(255,255,255,0.06);
        color:white;
        font-size:22px;
      ">×</button>

      <div style="font-size:44px;margin:10px 0;">👑</div>

      <p style="
        display:inline-block;
        padding:7px 13px;
        border-radius:999px;
        background:rgba(34,211,238,0.12);
        color:#67e8f9;
        font-size:12px;
        font-weight:800;
      ">
        Premium Feature Locked
      </p>

      <h2>This needs ${planName} Plan</h2>

      <p style="color:#cbd5e1;font-size:14px;">
        Your current plan is <b>${currentPlan.toUpperCase()}</b>.
        Upgrade to unlock this feature.
      </p>

      <div style="
        display:flex;
        justify-content:space-between;
        align-items:center;
        margin-bottom:14px;
        padding:14px;
        border-radius:18px;
        background:rgba(255,255,255,0.06);
      ">
        <span>${planName} Plan</span>
        <b style="color:#facc15;font-size:20px;">${price}</b>
      </div>

      <div style="text-align:left;margin-bottom:18px;">
        ${features.map(x => `<div style="padding:7px 0;">✓ ${x}</div>`).join('')}
      </div>

      <button id="goToPlansBtn" style="
        width:100%;
        border:none;
        border-radius:16px;
        padding:14px;
        background:linear-gradient(135deg,#22d3ee,#2563eb);
        color:white;
        font-size:15px;
        font-weight:900;
      ">
        Upgrade Now
      </button>

      <button id="upgradeLaterBtn" style="
        width:100%;
        margin-top:10px;
        border:1px solid rgba(255,255,255,0.12);
        border-radius:16px;
        padding:13px;
        background:rgba(255,255,255,0.05);
        color:#cbd5e1;
        font-size:14px;
        font-weight:800;
      ">
        Maybe Later
      </button>
    </div>
  `;

  document.body.appendChild(popup);

  document.getElementById('closeUpgradePopup').onclick = () => popup.remove();
  document.getElementById('upgradeLaterBtn').onclick = () => popup.remove();

  document.getElementById('goToPlansBtn').onclick = function(){
    popup.remove();
    setTab('subscription', true);
  };
}

function renderSettings(){
  const el = document.getElementById('screen-settings');
  if(!el) return;

  const pm = performanceMode();
  const glassOn = glassEnabled();
  const gop = glassOpacity();
  const dev = devModeEnabled();
  const backendUrl = state.profile && state.profile.backendUrl ? state.profile.backendUrl : '';
  const billing = state.settings && state.settings.billingMode ? state.settings.billingMode : 'play';

  el.innerHTML = `
    <div class="grid">
      <div class="card">
        <h2>Appearance</h2>
        <p class="muted">
          Current: <b>${activeTheme() === 'light' ? 'Light' : 'Dark'}</b>
        </p>

        <div class="row">
          <button class="btn primary" onclick="setTheme('light')">Light Mode</button>
          <button class="btn gold" onclick="setTheme('dark')">Dark Mode</button>
        </div>
      </div>

      <div class="card">
        <h2>Liquid Glass</h2>
        <p class="muted">Current: <b>${glassOn ? 'On' : 'Off'}</b></p>

        <div class="actions">
          <button class="btn ${glassOn ? 'primary' : ''}" onclick="setGlassEnabled(true)">Glass On</button>
          <button class="btn ${!glassOn ? 'primary' : ''}" onclick="setGlassEnabled(false)">Glass Off</button>
        </div>

        <label style="margin-top:12px;display:block">Glass Opacity</label>

        <div class="range-row">
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value="${gop}"
            oninput="updateGlassOpacityLabel(this.value)"
            onchange="setGlassOpacity(this.value)"
          >

          <div class="pill range-value" id="glassOpacityValue">${gop}%</div>
        </div>
      </div>

      <div class="card">
        <h2>Performance</h2>
        <p class="muted">Current: <b>${pm === 'lite' ? 'Lite' : pm === 'smooth' ? 'Smooth' : 'Auto'}</b></p>

        <div class="grid3">
          <button class="btn ${pm === 'auto' ? 'primary' : ''}" onclick="setPerformanceMode('auto')">Auto</button>
          <button class="btn ${pm === 'smooth' ? 'primary' : ''}" onclick="setPerformanceMode('smooth')">Smooth UI</button>
          <button class="btn ${pm === 'lite' ? 'primary' : ''}" onclick="setPerformanceMode('lite')">Lite Mode</button>
        </div>
      </div>

      <div class="card">
        <h2>Data Safety</h2>
        <p class="muted">
          Auto-save active hai. Backup regularly download karo.
        </p>

        <button class="btn primary" onclick="downloadBackup()">
          Download JSON Backup
        </button>

        <label>Restore JSON</label>
        <input
          type="file"
          accept=".json"
          onchange="restoreBackup(this.files[0])"
        >

        <div class="actions" style="margin-top:10px">
          <button class="btn gold" onclick="removeBadImportedSales()">
            Remove Bad Imported Sales
          </button>
        </div>

        <div id="settingsStatus" class="notice" style="margin-top:10px">
          Backup rakhna safe hai.
        </div>
      </div>

      ${
        dev
        ? `
          <div class="card dev-card">
            <h2>Developer Mode</h2>
            <p class="muted">Hidden setup. Normal customers will not see this section.</p>

            <label>Backend URL</label>
            <input id="devBackendUrl" value="${esc(backendUrl)}">

            <div class="actions">
              <button class="btn primary" onclick="setBackendUrl()">Save Endpoint</button>
              <button class="btn" onclick="testBackend()">Test</button>
            </div>

            <div id="devBackendStatus" class="small muted" style="margin-top:8px">
              Endpoint status will appear here.
            </div>

            <label style="margin-top:12px;display:block">Billing Mode</label>

            <select onchange="setBillingMode(this.value)">
              <option value="play" ${billing === 'play' ? 'selected' : ''}>Google Play Billing</option>
              <option value="razorpay" ${billing === 'razorpay' ? 'selected' : ''}>Razorpay / website payment</option>
              <option value="manual" ${billing === 'manual' ? 'selected' : ''}>Manual activation</option>
            </select>
          </div>
        `
        : ''
      }
    </div>
  `;
}


function downloadBackup(){
  const blob = new Blob([JSON.stringify(state, null, 2)], {
    type: 'application/json'
  });

  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'vyapar-ai-backup.json';
  a.click();
}

async function restoreBackup(file){
  if(!file) return;

  try{
    state = normalizeState(JSON.parse(await file.text()));
    save();
  }catch(e){
    alert('Backup restore failed: ' + e.message);
  }
}

render();