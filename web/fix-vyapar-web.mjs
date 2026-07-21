#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = path.resolve(process.argv[2] || ".");
const supportEmail = "anujguptaofficial09@gmail.com";
const assetVersion = "20260721fix1";

const changedFiles = [];
const warnings = [];

const requiredFiles = [
  "index.html",
  "style.css",
  "script.js",
  "production.js",
  "otp-gate.js"
];

for (const fileName of requiredFiles) {
  const filePath = path.join(root, fileName);

  if (!fs.existsSync(filePath)) {
    console.error(`❌ Missing required file: ${fileName}`);
    process.exit(1);
  }
}

function readFile(fileName) {
  return fs
    .readFileSync(path.join(root, fileName), "utf8")
    .replace(/\r\n/g, "\n");
}

function writeFile(fileName, original, updated) {
  if (updated === original) {
    return;
  }

  const filePath = path.join(root, fileName);
  const backupPath = `${filePath}.before-vyapar-fix.bak`;

  if (!fs.existsSync(backupPath)) {
    fs.copyFileSync(filePath, backupPath);
  }

  fs.writeFileSync(filePath, updated, "utf8");
  changedFiles.push(fileName);
}

function replaceBlock(
  source,
  possibleStarts,
  endMarker,
  replacement,
  label
) {
  const starts = Array.isArray(possibleStarts)
    ? possibleStarts
    : [possibleStarts];

  let startIndex = -1;
  let matchedStart = "";

  for (const startMarker of starts) {
    const index = source.indexOf(startMarker);

    if (index !== -1) {
      startIndex = index;
      matchedStart = startMarker;
      break;
    }
  }

  if (startIndex === -1) {
    warnings.push(`${label}: start marker not found`);
    return source;
  }

  const endIndex = source.indexOf(
    endMarker,
    startIndex + matchedStart.length
  );

  if (endIndex === -1) {
    warnings.push(`${label}: end marker not found`);
    return source;
  }

  return (
    source.slice(0, startIndex) +
    replacement.trim() +
    "\n\n" +
    source.slice(endIndex)
  );
}

function fixRgbaAlpha(source) {
  return source.replace(
    /rgba\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d+)\s*\)/g,
    (match, red, green, blue, alpha) => {
      const numericAlpha = Number(alpha);

      if (numericAlpha <= 1) {
        return `rgba(${red},${green},${blue},${alpha})`;
      }

      return `rgba(${red},${green},${blue},0.${alpha})`;
    }
  );
}

function fixBrokenCssSelectors(source) {
  const replacements = [
    [
      ".nav button,btn,theme-toggle,badge,pill,glass-chip,input,select,textarea",
      ".nav button,.btn,.theme-toggle,.badge,.pill,.glass-chip,input,select,textarea"
    ],
    [
      "html,body,app,button,input,select,textarea,label,btn,nav button,pill,glass-chip,badge,theme-toggle",
      "html,body,.app,button,input,select,textarea,label,.btn,.nav button,.pill,.glass-chip,.badge,.theme-toggle"
    ],
    [
      "p,muted,input,select,textarea,notice,code-note,code-preview,table th,table td",
      "p,.muted,input,select,textarea,.notice,.code-note,.code-preview,.table th,.table td"
    ],
    [
      "label,small,footer,nav button,btn.mini",
      "label,small,.footer,.nav button,.btn.mini"
    ],
    [
      ".badge,theme-toggle,pill,glass-chip",
      ".badge,.theme-toggle,.pill,.glass-chip"
    ],
    [
      ".nav button:hover,btn:hover",
      ".nav button:hover,.btn:hover"
    ],
    [
      ".nav button.active,btn.primary",
      ".nav button.active,.btn.primary"
    ],
    [
      ".nav button,btn",
      ".nav button,.btn"
    ],
    [
      ".hero,grid,grid3,row",
      ".hero,.grid,.grid3,.row"
    ],
    [
      ".card,stat",
      ".card,.stat"
    ],
    [
      ".code-layout,code-shell",
      ".code-layout,.code-shell"
    ],
    [
      ".btn,nav button",
      ".btn,.nav button"
    ]
  ];

  let output = source;

  for (let pass = 0; pass < 2; pass += 1) {
    for (const [broken, fixed] of replacements) {
      output = output.replaceAll(broken, fixed);
    }
  }

  return output;
}

function addNoopener(source) {
  return source.replace(
    /target="_blank"(?!\s+rel=)/g,
    'target="_blank" rel="noopener noreferrer"'
  );
}

/* ------------------------------------------------------------------ */
/* style.css                                                           */
/* ------------------------------------------------------------------ */

{
  const original = readFile("style.css");
  let updated = fixRgbaAlpha(original);

  updated = fixBrokenCssSelectors(updated);

  updated = updated
    .replaceAll(
      "transition:opacity 1s ease, visibility 1s ease",
      "transition:opacity .2s ease, visibility .2s ease"
    )
    .replaceAll(
      "cubic-bezier(.2,8,2,1)",
      "cubic-bezier(.2,.8,.2,1)"
    );

  if (!updated.includes("/* VYAPAR_FIX_20260721 */")) {
    updated += String.raw`

/* VYAPAR_FIX_20260721
   Keep permanent no-glass mode without removing semantic button colors.
*/
.glass-off .btn.primary{
  border-color:transparent!important;
  background:linear-gradient(
    180deg,
    rgba(116,255,243,.92),
    rgba(37,180,224,.92)
  )!important;
  color:#04111f!important;
}

.glass-off .btn.gold{
  border-color:transparent!important;
  background:linear-gradient(
    180deg,
    rgba(255,218,126,.95),
    rgba(236,163,36,.94)
  )!important;
  color:#16100a!important;
}

.glass-off .btn.danger{
  background:linear-gradient(
    180deg,
    rgba(120,18,33,.88),
    rgba(73,12,20,.88)
  )!important;
  color:#ffe4e6!important;
}

button:focus-visible,
a:focus-visible,
input:focus-visible,
select:focus-visible,
textarea:focus-visible{
  outline:3px solid var(--teal);
  outline-offset:2px;
}
`;
  }

  writeFile("style.css", original, updated);
}

/* ------------------------------------------------------------------ */
/* legal.css                                                           */
/* ------------------------------------------------------------------ */

if (fs.existsSync(path.join(root, "legal.css"))) {
  const original = readFile("legal.css");
  const updated = fixRgbaAlpha(original);

  writeFile("legal.css", original, updated);
}

/* ------------------------------------------------------------------ */
/* script.js                                                           */
/* ------------------------------------------------------------------ */

{
  const original = readFile("script.js");
  let updated = original;

  updated = replaceBlock(
    updated,
    "function num(v){",
    "function monthNameToNum(m){",
    String.raw`
function num(v){
  if(v === null || v === undefined || v === ''){
    return 0;
  }

  const n = Number(
    String(v).replace(/[₹,\s]/g, '')
  );

  return Number.isFinite(n) ? n : 0;
}

function localDateKey(value = new Date()){
  const parsed =
    value instanceof Date
      ? value
      : new Date(value);

  const date =
    Number.isNaN(parsed.getTime())
      ? new Date()
      : parsed;

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0')
  ].join('-');
}

function monthKey(value){
  const raw = String(value ?? '').trim();

  if(/^\d{4}-(0[1-9]|1[0-2])/.test(raw)){
    return raw.slice(0, 7);
  }

  const date =
    value === undefined ||
    value === null ||
    value === ''
      ? new Date()
      : new Date(value);

  if(Number.isNaN(date.getTime())){
    return '';
  }

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0')
  ].join('-');
}
`,
    "number and local-date helpers"
  );

  updated = replaceBlock(
    updated,
    "function yearMonth(year, month, date){",
    "function defaultCodeMap(){",
    String.raw`
function yearMonth(year, month, date){
  const dateText = String(date ?? '').trim();

  if(/^\d{4}-(0[1-9]|1[0-2])/.test(dateText)){
    return dateText.slice(0, 7);
  }

  const rawYear = String(year ?? '').trim();
  const rawMonth = String(month ?? '').trim();

  let mm = monthNameToNum(rawMonth);

  if(!mm && /^(0?[1-9]|1[0-2])$/.test(rawMonth)){
    mm = rawMonth.padStart(2, '0');
  }

  if(/^\d{4}$/.test(rawYear) && mm){
    return rawYear + '-' + mm;
  }

  return '';
}
`,
    "year-month parsing"
  );

  updated = replaceBlock(
    updated,
    [
      "function cleanText(value, maxLength = 2000, preserveNewlines = false){",
      "function normalizeState(raw){"
    ],
    "function loadState(){",
    String.raw`
function cleanText(
  value,
  maxLength = 2000,
  preserveNewlines = false
){
  const text = String(value ?? '');

  const cleaned = preserveNewlines
    ? text.replace(
        /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g,
        ''
      )
    : text.replace(
        /[\u0000-\u001F\u007F]/g,
        ' '
      );

  return cleaned.trim().slice(0, maxLength);
}

function normalizeRecords(list){
  if(!Array.isArray(list)){
    return [];
  }

  const usedIds = new Set();

  return list
    .slice(0, 50000)
    .filter(record =>
      record &&
      typeof record === 'object' &&
      !Array.isArray(record)
    )
    .map(record => {
      const copy = { ...record };

      let id = cleanText(copy.id, 100);

      if(
        !/^[A-Za-z0-9_-]+$/.test(id) ||
        usedIds.has(id)
      ){
        id = uid();
      }

      usedIds.add(id);
      copy.id = id;

      Object.keys(copy).forEach(key => {
        if(typeof copy[key] === 'string'){
          copy[key] = cleanText(copy[key], 2000);
        }
      });

      return copy;
    });
}

function normalizeState(raw){
  const d = defaults();

  const input =
    raw &&
    typeof raw === 'object' &&
    !Array.isArray(raw)
      ? raw
      : {};

  const profile =
    input.profile &&
    typeof input.profile === 'object'
      ? input.profile
      : {};

  const settings =
    input.settings &&
    typeof input.settings === 'object'
      ? input.settings
      : {};

  const subscription =
    input.subscription &&
    typeof input.subscription === 'object'
      ? input.subscription
      : {};

  const plan =
    subscription.plan === 'pro' ||
    subscription.plan === 'business'
      ? subscription.plan
      : 'free';

  return {
    ...d,
    ...input,

    profile: {
      ...d.profile,
      ...profile,

      businessName:
        cleanText(
          profile.businessName ??
          d.profile.businessName,
          200
        ),

      locationType:
        cleanText(
          profile.locationType ??
          d.profile.locationType,
          100
        ),

      category:
        cleanText(
          profile.category ??
          d.profile.category,
          100
        ),

      monthlyGoal:
        Math.max(
          0,
          num(
            profile.monthlyGoal ??
            d.profile.monthlyGoal
          )
        ),

      totalInvestment:
        Math.max(
          0,
          num(
            profile.totalInvestment ??
            d.profile.totalInvestment
          )
        ),

      backendUrl: API_BASE_URL
    },

    plan,

    subscription: {
      ...d.subscription,
      ...subscription,
      plan,
      verified:
        subscription.verified === true,
      token:
        cleanText(
          subscription.token,
          4096
        )
    },

    settings: {
      ...d.settings,
      ...settings,

      theme:
        settings.theme === 'light'
          ? 'light'
          : 'dark',

      performance:
        ['auto', 'smooth', 'lite']
          .includes(settings.performance)
            ? settings.performance
            : d.settings.performance,

      glassEnabled: false,
      glassOpacity: 0,

      codeMap:
        cleanText(
          settings.codeMap ??
          d.settings.codeMap,
          20000,
          true
        )
    },

    sales:
      normalizeRecords(input.sales),

    stocks:
      normalizeRecords(input.stocks),

    monthly:
      normalizeRecords(input.monthly),

    daily:
      normalizeRecords(input.daily)
  };
}
`,
    "state normalization"
  );

  updated = replaceBlock(
    updated,
    "function loadState(){",
    "function v(id){",
    String.raw`
function loadState(){
  try{
    const saved =
      JSON.parse(
        localStorage.getItem(STORAGE_KEY)
      ) || {};

    const clean =
      normalizeState(saved);

    /*
      Paid status is restored by production.js from
      the authenticated account cache/server.
      A backup or edited localStorage value must not
      activate paid UI by itself.
    */
    clean.subscription = {
      plan: 'free',
      verified: false,
      token: ''
    };

    clean.plan = 'free';

    return clean;

  }catch(error){
    console.warn(
      'Saved state could not be loaded:',
      error
    );

    return defaults();
  }
}

function save(){
  try{
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(state)
    );

  }catch(error){
    console.error(
      'Local data save failed:',
      error
    );

    alert(
      'Data save nahi ho saka. Browser storage full ho sakta hai. Backup download karo.'
    );

    return false;
  }

  render();
  return true;
}

function esc(value){
  return String(value ?? '')
    .replace(/[&<>"']/g, character => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    }[character]));
}
`,
    "safe loading, saving and escaping"
  );

  updated = replaceBlock(
    updated,
    [
      "function detailedBusinessData(){",
      "function totals(){"
    ],
    "function render(){",
    String.raw`
function detailedBusinessData(){
  const itemByDate = new Map();
  const dailyByDate = new Map();

  let qty = 0;

  (state.sales || []).forEach(item => {
    const date =
      String(item.date || '').trim();

    if(!/^\d{4}-\d{2}-\d{2}$/.test(date)){
      return;
    }

    const quantity =
      Math.max(0, num(item.qty));

    const sellingPrice =
      Math.max(0, num(item.sellingPrice));

    const purchasePrice =
      Math.max(0, num(item.purchasePrice));

    qty += quantity;

    const current =
      itemByDate.get(date) || {
        sale: 0,
        profit: 0
      };

    current.sale +=
      sellingPrice * quantity;

    current.profit +=
      (
        sellingPrice -
        purchasePrice
      ) * quantity;

    itemByDate.set(date, current);
  });

  (state.daily || []).forEach(item => {
    const date =
      String(item.date || '').trim();

    if(!/^\d{4}-\d{2}-\d{2}$/.test(date)){
      return;
    }

    const current =
      dailyByDate.get(date) || {
        sale: 0,
        profit: 0
      };

    current.sale +=
      Math.max(0, num(item.sale));

    current.profit +=
      num(item.profit);

    dailyByDate.set(date, current);
  });

  const allDates =
    new Set([
      ...itemByDate.keys(),
      ...dailyByDate.keys()
    ]);

  const profitByMonth = {};
  let saleTotal = 0;

  allDates.forEach(date => {
    /*
      A daily entry represents the final daily total.
      When it exists, item-wise entries for the same
      date are not counted a second time.
    */
    const chosen =
      dailyByDate.has(date)
        ? dailyByDate.get(date)
        : itemByDate.get(date);

    saleTotal += chosen.sale;

    const month =
      date.slice(0, 7);

    profitByMonth[month] =
      (profitByMonth[month] || 0) +
      chosen.profit;
  });

  return {
    saleTotal,
    qty,
    profitByMonth
  };
}

function resolvedMonthlyProfitSeries(){
  const detailed =
    detailedBusinessData();

  const map = {
    ...detailed.profitByMonth
  };

  /*
    A monthly record is treated as the final profit
    for that month and overrides granular records.
  */
  (state.monthly || []).forEach(item => {
    const month =
      String(item.month || '').trim();

    if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)){
      return;
    }

    map[month] =
      num(item.profit);
  });

  return Object.entries(map)
    .filter(([month]) => Boolean(month))
    .sort(([a], [b]) =>
      a.localeCompare(b)
    );
}

function totals(){
  const detailed =
    detailedBusinessData();

  const profit =
    resolvedMonthlyProfitSeries()
      .reduce(
        (sum, item) =>
          sum + num(item[1]),
        0
      );

  const saleTotal =
    detailed.saleTotal;

  const margin =
    saleTotal
      ? profit / saleTotal * 100
      : 0;

  return {
    saleTotal,
    profit,
    qty: detailed.qty,
    margin
  };
}
`,
    "consistent business totals"
  );

  updated = updated.replace(
    /const badge = document\.getElementById\('planBadge'\);\s*badge\.textContent = getCurrentPlan\(\)\.toUpperCase\(\) \+ ' Plan';/,
    String.raw`const badge = document.getElementById('planBadge');

  if(badge){
    badge.textContent =
      getCurrentPlan().toUpperCase() +
      ' Plan';
  }`
  );

  updated = updated
    .replace(
      "const price = num(x.purchasePrice || x.buy || x.cost || x.mrp || 0);",
      "const price = Math.max(0, num(x.purchasePrice ?? x.buy ?? x.cost ?? 0));"
    )
    .replace(
      "return sum + price * num(x.qty);",
      "return sum + price * Math.max(0, num(x.qty));"
    )
    .replace(
      '<span class="muted">Stock Value</span>',
      '<span class="muted">Stock Cost Value</span>'
    );

  updated = replaceBlock(
    updated,
    "function addStock(){",
    "function monthlySeriesAll(){",
    String.raw`
function addStock(){
  const item =
    String(v('stockItem') || '').trim();

  const qty =
    num(v('stockQty'));

  const minInput =
    String(v('stockMin') || '').trim();

  const min =
    minInput === ''
      ? 5
      : num(minInput);

  if(!item){
    alert('Stock item name required hai.');
    return;
  }

  if(qty < 0){
    alert('Stock quantity negative nahi ho sakti.');
    return;
  }

  if(min < 0){
    alert('Minimum alert quantity negative nahi ho sakti.');
    return;
  }

  state.stocks =
    state.stocks || [];

  state.stocks.push({
    id: uid(),
    item,
    product: item,
    qty,
    min,
    lowStock: min,
    source: 'manual'
  });

  save();
}
`,
    "stock validation"
  );

  updated = replaceBlock(
    updated,
    "function monthlySeriesAll(){",
    "function monthlySeries(){",
    String.raw`
function monthlySeriesAll(){
  return resolvedMonthlyProfitSeries();
}
`,
    "analytics total consistency"
  );

  updated = replaceBlock(
    updated,
    "function saleFormData(){",
    "function editSale(id){",
    String.raw`
function saleFormData(){
  const existing =
    editSaleId
      ? state.sales.find(
          item => item.id === editSaleId
        )
      : null;

  const date =
    String(
      v('sdate') ||
      localDateKey()
    ).trim();

  const product =
    String(
      v('sproduct') || ''
    ).trim();

  const category =
    String(
      v('scategory') ||
      'General'
    ).trim();

  const purchasePrice =
    num(v('sbuy'));

  const sellingPrice =
    num(v('ssell'));

  const qty =
    num(v('sqty'));

  if(!/^\d{4}-\d{2}-\d{2}$/.test(date)){
    throw new Error('Valid sale date required hai.');
  }

  if(!product){
    throw new Error('Product name required hai.');
  }

  if(qty <= 0){
    throw new Error('Quantity zero se greater honi chahiye.');
  }

  if(
    purchasePrice < 0 ||
    sellingPrice < 0
  ){
    throw new Error('Prices negative nahi ho sakte.');
  }

  if(
    purchasePrice === 0 &&
    sellingPrice === 0
  ){
    throw new Error('Purchase ya selling price enter karo.');
  }

  return {
    ...(existing || {}),
    id:
      editSaleId ||
      uid(),
    date,
    product,
    category:
      category ||
      'General',
    purchasePrice,
    sellingPrice,
    qty,
    source:
      existing &&
      existing.source
        ? existing.source
        : 'manual'
  };
}

function addSale(){
  try{
    state.sales =
      state.sales || [];

    state.sales.push(
      saleFormData()
    );

    save();

  }catch(error){
    alert(error.message);
  }
}
`,
    "sale validation"
  );

  updated = replaceBlock(
    updated,
    "function updateSale(){",
    "function cancelSaleEdit(){",
    String.raw`
function updateSale(){
  const index =
    state.sales.findIndex(
      item => item.id === editSaleId
    );

  if(index < 0){
    alert('Sale record nahi mila.');
    editSaleId = '';
    render();
    return;
  }

  try{
    state.sales[index] =
      saleFormData();

    editSaleId = '';
    save();

  }catch(error){
    alert(error.message);
  }
}
`,
    "sale update validation"
  );

  updated = replaceBlock(
    updated,
    "function addDaily(){",
    "function delDaily(id){",
    String.raw`
function addDaily(){
  const date =
    String(
      v('ddate') ||
      localDateKey()
    ).trim();

  const sale =
    num(v('dsale'));

  const profit =
    num(v('dprofit'));

  if(!/^\d{4}-\d{2}-\d{2}$/.test(date)){
    alert('Valid daily entry date required hai.');
    return;
  }

  if(sale < 0){
    alert('Daily sale negative nahi ho sakti.');
    return;
  }

  if(sale === 0 && profit === 0){
    alert('Sale ya profit amount enter karo.');
    return;
  }

  state.daily =
    state.daily || [];

  state.daily.push({
    id: uid(),
    date,
    sale,
    profit,
    source: 'manual-daily'
  });

  save();
}
`,
    "daily-entry validation"
  );

  updated = replaceBlock(
    updated,
    "function addMonthly(){",
    "function editMonthly(id){",
    String.raw`
function addMonthly(){
  const month =
    String(v('mmonth') || '').trim();

  const profit =
    num(v('mprofit'));

  if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)){
    alert('Valid month select karo.');
    return;
  }

  state.monthly =
    state.monthly || [];

  const existing =
    state.monthly.find(
      item => item.month === month
    );

  if(existing){
    existing.profit = profit;
    existing.source = 'manual';

  }else{
    state.monthly.push({
      id: uid(),
      month,
      profit,
      source: 'manual'
    });
  }

  save();
}
`,
    "monthly-entry deduplication"
  );

  updated = replaceBlock(
    updated,
    "function updateMonthly(){",
    "function cancelMonthlyEdit(){",
    String.raw`
function updateMonthly(){
  const month =
    String(v('mmonth') || '').trim();

  const profit =
    num(v('mprofit'));

  if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)){
    alert('Valid month select karo.');
    return;
  }

  const index =
    state.monthly.findIndex(
      item => item.id === editMonthlyId
    );

  if(index < 0){
    editMonthlyId = '';
    render();
    return;
  }

  const duplicate =
    state.monthly.find(
      item =>
        item.id !== editMonthlyId &&
        item.month === month
    );

  if(duplicate){
    duplicate.profit = profit;

    state.monthly =
      state.monthly.filter(
        item => item.id !== editMonthlyId
      );

  }else{
    state.monthly[index] = {
      ...state.monthly[index],
      month,
      profit,
      source:
        state.monthly[index].source ||
        'manual'
    };
  }

  editMonthlyId = '';
  save();
}
`,
    "monthly update deduplication"
  );

  updated = replaceBlock(
    updated,
    [
      "function skuPart(value, fallback, maxLength){",
      "function makeSku(brand, article, size){"
    ],
    "function showStockScanPreview(items){",
    String.raw`
function skuPart(
  value,
  fallback,
  maxLength
){
  const cleaned =
    String(value || fallback)
      .replace(/[^a-zA-Z0-9]/g, '')
      .slice(0, maxLength)
      .toUpperCase();

  return cleaned || fallback;
}

function makeSku(
  brand,
  article,
  size,
  color
){
  const b =
    skuPart(brand, 'GEN', 3);

  const a =
    skuPart(article, 'ITEM', 6);

  const s =
    skuPart(size, '00', 5);

  const c =
    skuPart(color, 'NA', 4);

  return [
    b,
    a,
    s,
    c
  ].join('-');
}

function normalizeStockScanItem(row){
  const brand =
    row.brand ||
    row.Brand ||
    '';

  const article =
    row.article ||
    row.model ||
    row.Article ||
    row.Model ||
    '';

  const size =
    row.size ||
    row.Size ||
    '';

  const color =
    row.color ||
    row.Color ||
    '';

  const mrp =
    Math.max(
      0,
      num(
        row.mrp ??
        row.MRP ??
        row.price ??
        0
      )
    );

  const rawQty =
    num(
      row.qty ??
      row.quantity ??
      row.Qty ??
      1
    );

  const qty =
    rawQty > 0
      ? rawQty
      : 1;

  const productName = [
    brand,
    article,
    size
      ? 'Size ' + size
      : '',
    color
  ]
    .filter(Boolean)
    .join(' ');

  return {
    id: uid(),
    item:
      productName ||
      'Scanned Product',
    product:
      productName ||
      'Scanned Product',
    brand,
    article,
    size,
    color,
    mrp,
    qty,
    min: 5,
    lowStock: 5,
    sku:
      makeSku(
        brand,
        article,
        size,
        color
      ),
    source: 'box-label-scan'
  };
}
`,
    "unique scanned-stock SKU"
  );

  if (!updated.includes("function authFileHeaders(){")) {
    updated = updated.replace(
      "async function scanBoxLabel(){",
      String.raw`
function authFileHeaders(){
  const accountToken =
    String(
      localStorage.getItem(
        'vyapar_ai_auth_token_v1'
      ) || ''
    ).trim();

  const legacyToken =
    typeof getSubscriptionToken ===
    'function'
      ? getSubscriptionToken()
      : '';

  const token =
    accountToken ||
    legacyToken;

  return token
    ? {
        Authorization:
          'Bearer ' + token
      }
    : {};
}

async function scanBoxLabel(){`
    );
  }

  updated = replaceBlock(
    updated,
    "function calcNormal(){",
    "function renderSubscription(){",
    String.raw`
function calcNormal(){
  const input =
    document.getElementById(
      'normalCalc'
    );

  const result =
    document.getElementById(
      'normalResult'
    );

  if(!input || !result){
    return;
  }

  const raw =
    input.value.trim();

  if(!raw){
    result.textContent =
      'Total: ₹0';

    return;
  }

  const expression = raw
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/[–—]/g, '-');

  if(/[^0-9+\-*/().%\s]/.test(expression)){
    result.textContent =
      'Invalid expression';

    return;
  }

  try{
    const safeExpression =
      expression.replace(
        /%/g,
        '/100'
      );

    const evaluated =
      Function(
        '"use strict"; return (' +
        safeExpression +
        ')'
      )();

    const total =
      Number(evaluated);

    if(!Number.isFinite(total)){
      throw new Error(
        'Result is not finite'
      );
    }

    result.textContent =
      'Total: ' +
      money(total);

  }catch(error){
    result.textContent =
      'Invalid expression';
  }
}
`,
    "calculator finite-result handling"
  );

  updated = replaceBlock(
    updated,
    "function addMonthlyFromRow(row, source){",
    "function addSaleFromRow(row, source){",
    String.raw`
function addMonthlyFromRow(row, source){
  const rawAmount =
    row.profit ??
    row.netProfit ??
    row.monthlyProfit ??
    row.amount ??
    row.income ??
    row.value;

  if(
    rawAmount === null ||
    rawAmount === undefined ||
    String(rawAmount).trim() === ''
  ){
    return false;
  }

  const amount =
    num(rawAmount);

  const ym =
    yearMonth(
      row.year,
      row.month,
      row.date
    );

  if(
    !/^\d{4}-(0[1-9]|1[0-2])$/
      .test(ym)
  ){
    return false;
  }

  const existing =
    state.monthly.find(
      item => item.month === ym
    );

  if(existing){
    existing.profit = amount;
    existing.source = source;
    existing.entries =
      row.entries ??
      existing.entries;

    existing.remark =
      row.remark ||
      row.note ||
      existing.remark ||
      '';

    return 'updated';
  }

  state.monthly.push({
    id: uid(),
    month: ym,
    profit: amount,
    entries:
      row.entries ??
      null,
    remark:
      row.remark ||
      row.note ||
      '',
    source
  });

  return true;
}
`,
    "zero-profit import"
  );

  updated = replaceBlock(
    updated,
    "function addSaleFromRow(row, source){",
    "function addStockFromRow(row, source){",
    String.raw`
function addSaleFromRow(row, source){
  const sell =
    num(
      row.sellingPrice ??
      row.sell ??
      row.salePrice ??
      row.amount
    );

  const buy =
    num(
      row.purchasePrice ??
      row.buy ??
      row.cost
    );

  const quantity =
    num(
      row.qty ??
      row.quantity ??
      1
    );

  const rawDate =
    String(row.date ?? '').trim();

  const date =
    rawDate ||
    localDateKey();

  if(
    !/^\d{4}-\d{2}-\d{2}$/
      .test(date) ||
    quantity <= 0 ||
    sell < 0 ||
    buy < 0 ||
    (
      sell === 0 &&
      buy === 0
    )
  ){
    return false;
  }

  state.sales.push({
    id: uid(),
    date,
    product:
      cleanText(
        row.product ||
        row.item ||
        row.name ||
        'Imported item',
        300
      ),
    category:
      cleanText(
        row.category ||
        'General',
        100
      ),
    purchasePrice: buy,
    sellingPrice: sell,
    qty: quantity,
    source:
      cleanText(
        source ||
        'import',
        100
      )
  });

  return true;
}
`,
    "safe sale import"
  );

  updated = replaceBlock(
    updated,
    "function addStockFromRow(row, source){",
    "function parseCsv(txt){",
    String.raw`
function addStockFromRow(row, source){
  const qty =
    num(
      row.qty ??
      row.quantity ??
      row.stockQty ??
      row.qtyInStock ??
      row.stockqty
    );

  const name =
    cleanText(
      row.product ||
      row.item ||
      row.name ||
      '',
      300
    );

  if(!name && qty === 0){
    return false;
  }

  if(qty < 0){
    return false;
  }

  const thresholdRaw =
    row.lowStock ??
    row.reorder ??
    row.min;

  const threshold =
    thresholdRaw === undefined ||
    thresholdRaw === null ||
    String(thresholdRaw).trim() === ''
      ? 5
      : Math.max(
          0,
          num(thresholdRaw)
        );

  state.stocks.push({
    id: uid(),
    item:
      name ||
      'Imported stock',
    product:
      name ||
      'Imported stock',
    category:
      cleanText(
        row.category ||
        'General',
        100
      ),
    qty,
    lowStock: threshold,
    min: threshold,
    purchasePrice:
      Math.max(
        0,
        num(
          row.purchasePrice ??
          row.buy ??
          row.cost ??
          0
        )
      ),
    mrp:
      Math.max(
        0,
        num(
          row.mrp ??
          row.MRP ??
          row.retailPrice ??
          0
        )
      ),
    sku:
      cleanText(
        row.sku ||
        '',
        100
      ),
    source:
      cleanText(
        source ||
        'import',
        100
      )
  });

  return true;
}
`,
    "safe stock import"
  );

  updated = replaceBlock(
    updated,
    "function removeBadImportedSales(){",
    "function renderSales(){",
    String.raw`
function removeBadImportedSales(){
  const sales =
    Array.isArray(state.sales)
      ? state.sales
      : [];

  function isBadImportedSale(item){
    if(
      !item ||
      typeof item !== 'object'
    ){
      return true;
    }

    const source =
      String(item.source || '')
        .toLowerCase();

    const imported =
      /csv|json|txt|import/
        .test(source);

    if(!imported){
      return false;
    }

    const product =
      String(item.product || '')
        .trim();

    const date =
      String(item.date || '')
        .trim();

    const qty =
      num(item.qty);

    const buy =
      num(item.purchasePrice);

    const sell =
      num(item.sellingPrice);

    const invalidName =
      !product ||
      /^(undefined|null|nan)$/i
        .test(product);

    const invalidDate =
      !/^\d{4}-\d{2}-\d{2}$/
        .test(date);

    const invalidNumbers =
      qty <= 0 ||
      buy < 0 ||
      sell < 0 ||
      (
        buy === 0 &&
        sell === 0
      );

    return (
      invalidName ||
      invalidDate ||
      invalidNumbers
    );
  }

  const invalidRecords =
    sales.filter(
      isBadImportedSale
    );

  const status =
    document.getElementById(
      'settingsStatus'
    );

  if(!invalidRecords.length){
    if(status){
      status.textContent =
        'No invalid imported sales found.';

      status.className =
        'notice success';
    }

    return;
  }

  const approved =
    confirm(
      'Remove ' +
      invalidRecords.length +
      ' invalid imported sale record(s)? Valid imported sales will remain.'
    );

  if(!approved){
    return;
  }

  const invalidSet =
    new Set(invalidRecords);

  state.sales =
    sales.filter(
      item => !invalidSet.has(item)
    );

  const saved = save();

  if(saved){
    const freshStatus =
      document.getElementById(
        'settingsStatus'
      );

    if(freshStatus){
      freshStatus.textContent =
        invalidRecords.length +
        ' invalid imported sale record(s) removed.';

      freshStatus.className =
        'notice success';
    }
  }
}
`,
    "non-destructive import cleanup"
  );

  updated = replaceBlock(
    updated,
    "function downloadBackup(){",
    "render();",
    String.raw`
function downloadBackup(){
  downloadBlob(
    new Blob(
      [
        JSON.stringify(
          state,
          null,
          2
        )
      ],
      {
        type: 'application/json'
      }
    ),
    'vyapar-ai-backup.json'
  );
}

async function restoreBackup(file){
  if(!file){
    return;
  }

  const maxBackupSize =
    10 * 1024 * 1024;

  if(file.size > maxBackupSize){
    alert(
      'Backup file bahut badi hai. Maximum size 10 MB hai.'
    );

    return;
  }

  try{
    const parsed =
      JSON.parse(
        await file.text()
      );

    const restored =
      normalizeState(parsed);

    /*
      A business-data backup must never replace
      the authenticated account or paid plan.
    */
    restored.subscription = {
      ...state.subscription
    };

    restored.plan =
      state.plan;

    state = restored;
    save();

  }catch(error){
    alert(
      'Backup restore failed: ' +
      error.message
    );
  }
}
`,
    "safe backup restore"
  );

  updated = updated
    .replaceAll(
      "new Date().toISOString().slice(0, 10)",
      "localDateKey()"
    )
    .replaceAll(
      "cubic-bezier(.2,8,2,1)",
      "cubic-bezier(.2,.8,.2,1)"
    );

  updated = fixRgbaAlpha(updated);

  writeFile("script.js", original, updated);
}

/* ------------------------------------------------------------------ */
/* production.js                                                       */
/* ------------------------------------------------------------------ */

{
  const original = readFile("production.js");
  let updated = fixRgbaAlpha(original);

  updated = updated
    .replaceAll(
      'String(value || "")',
      'String(value ?? "")'
    );

  updated = updated.replace(
    /checkout\.open\(\);\s*setTimeout\(function\(\)\{[\s\S]*?paymentBusy\s*=\s*false;[\s\S]*?\},\s*15000\);/,
    "checkout.open();"
  );

  updated = addNoopener(updated);

  writeFile("production.js", original, updated);
}

/* ------------------------------------------------------------------ */
/* otp-gate.js                                                         */
/* ------------------------------------------------------------------ */

{
  const original = readFile("otp-gate.js");
  let updated = original;

  updated = replaceBlock(
    updated,
    "  async function readResponse(",
    '  document.getElementById(\n    "sendOtpButton"',
    String.raw`
  async function readResponse(
    response
  ){
    const text =
      await response.text();

    let data = {};

    try{
      data =
        text
          ? JSON.parse(text)
          : {};

    }catch(error){
      const invalidResponse =
        new Error(
          "Backend valid response nahi bhej raha"
        );

      invalidResponse.status =
        response.status;

      throw invalidResponse;
    }

    if(
      !response.ok ||
      data.success === false
    ){
      const requestError =
        new Error(
          data.message ||
          "Request failed"
        );

      requestError.status =
        response.status;

      throw requestError;
    }

    return data;
  }
`,
    "OTP response status"
  );

  updated = replaceBlock(
    updated,
    [
      "  function hasCachedLocalAccess(){",
      "  async function restoreSession(){"
    ],
    "  restoreSession();",
    String.raw`
  function hasCachedLocalAccess(){
    try{
      const cachedAccount =
        JSON.parse(
          localStorage.getItem(
            ACCOUNT_KEY
          ) || "null"
        );

      if(
        cachedAccount &&
        cachedAccount.user
      ){
        return true;
      }

    }catch(error){
      console.warn(
        "Account cache read failed:",
        error
      );
    }

    try{
      const localState =
        JSON.parse(
          localStorage.getItem(
            "vyapar_ai_prod_v1"
          ) || "{}"
        );

      return Boolean(
        (
          Array.isArray(
            localState.sales
          ) &&
          localState.sales.length
        ) ||
        (
          Array.isArray(
            localState.stocks
          ) &&
          localState.stocks.length
        ) ||
        (
          Array.isArray(
            localState.monthly
          ) &&
          localState.monthly.length
        ) ||
        (
          Array.isArray(
            localState.daily
          ) &&
          localState.daily.length
        )
      );

    }catch(error){
      return false;
    }
  }

  async function restoreSession(){
    const token =
      String(
        localStorage.getItem(
          TOKEN_KEY
        ) || ""
      ).trim();

    if(!token){
      return;
    }

    document.getElementById(
      "otpSubtitle"
    ).textContent =
      "Secure session checking...";

    emailStep.style.display =
      "none";

    try{
      const response =
        await fetch(
          API_BASE + "/auth/me",
          {
            headers: {
              Authorization:
                "Bearer " + token
            }
          }
        );

      const data =
        await readResponse(
          response
        );

      localStorage.setItem(
        ACCOUNT_KEY,
        JSON.stringify({
          user:
            data.user,

          subscription:
            data.subscription
        })
      );

      gate.remove();

    }catch(error){
      const rejected =
        error &&
        (
          error.status === 401 ||
          error.status === 403
        );

      if(rejected){
        localStorage.removeItem(
          TOKEN_KEY
        );

        localStorage.removeItem(
          ACCOUNT_KEY
        );

        document.getElementById(
          "otpSubtitle"
        ).textContent =
          "Email OTP verify karke dashboard open karo.";

        emailStep.style.display =
          "block";

        showMessage(
          "Session expired. Email OTP se dobara login karo.",
          "error"
        );

        return;
      }

      /*
        Temporary internet or Render outage must not
        delete an otherwise valid cached session.
      */
      if(hasCachedLocalAccess()){
        console.warn(
          "Session could not be checked online. Opening cached local app.",
          error
        );

        gate.remove();
        return;
      }

      document.getElementById(
        "otpSubtitle"
      ).textContent =
        "Server temporarily unavailable.";

      emailStep.style.display =
        "block";

      showMessage(
        "Internet ya server connection check karke dobara try karo.",
        "error"
      );
    }
  }
`,
    "OTP temporary-outage handling"
  );

  writeFile("otp-gate.js", original, updated);
}

/* ------------------------------------------------------------------ */
/* android-ui.js                                                       */
/* ------------------------------------------------------------------ */

if (fs.existsSync(path.join(root, "android-ui.js"))) {
  const original = readFile("android-ui.js");
  const updated = addNoopener(original);

  writeFile("android-ui.js", original, updated);
}

/* ------------------------------------------------------------------ */
/* android-ui.css                                                      */
/* ------------------------------------------------------------------ */

if (fs.existsSync(path.join(root, "android-ui.css"))) {
  const original = readFile("android-ui.css");
  const updated = fixRgbaAlpha(original);

  writeFile("android-ui.css", original, updated);
}

/* ------------------------------------------------------------------ */
/* index.html                                                          */
/* ------------------------------------------------------------------ */

{
  const original = readFile("index.html");

  let updated = original
    .replace(
      "width=device-width, initial-scale=1.0, maximum-scale=1.0, viewport-fit=cover",
      "width=device-width, initial-scale=1.0, viewport-fit=cover"
    )
    .replace(
      /v=20260715d/g,
      `v=${assetVersion}`
    );

  updated = addNoopener(updated);

  writeFile("index.html", original, updated);
}

/* ------------------------------------------------------------------ */
/* Legal HTML pages                                                    */
/* ------------------------------------------------------------------ */

for (const fileName of [
  "privacy.html",
  "terms.html",
  "refund.html",
  "delete-account.html"
]) {
  const filePath = path.join(root, fileName);

  if (!fs.existsSync(filePath)) {
    continue;
  }

  const original = readFile(fileName);

  let updated = original
    .replaceAll(
      "YOUR_SUPPORT_EMAIL",
      supportEmail
    )
    .replace(
      new RegExp(
        `(<a\\s+href="mailto:${supportEmail}">)\\s*(</a>)`,
        "g"
      ),
      `$1\n        ${supportEmail}\n      $2`
    );

  updated = addNoopener(updated);

  writeFile(fileName, original, updated);
}

/* ------------------------------------------------------------------ */
/* JavaScript syntax validation                                       */
/* ------------------------------------------------------------------ */

const syntaxFailures = [];

for (const fileName of [
  "script.js",
  "production.js",
  "otp-gate.js",
  "android-ui.js"
]) {
  const filePath = path.join(root, fileName);

  if (!fs.existsSync(filePath)) {
    continue;
  }

  const result = spawnSync(
    process.execPath,
    ["--check", filePath],
    {
      encoding: "utf8"
    }
  );

  if (result.status !== 0) {
    syntaxFailures.push({
      fileName,
      message:
        result.stderr ||
        result.stdout ||
        "Unknown syntax error"
    });
  }
}

console.log("");

if (changedFiles.length) {
  console.log(
    "✔️ Patched files:",
    changedFiles.join(", ")
  );
} else {
  console.log(
    "✔️ Files already contain the requested fixes."
  );
}

if (warnings.length) {
  console.warn("\n⚠️ Patch warnings:");

  for (const warning of warnings) {
    console.warn(`- ${warning}`);
  }
}

if (syntaxFailures.length) {
  console.error(
    "\n❌ JavaScript syntax validation failed:"
  );

  for (const failure of syntaxFailures) {
    console.error(
      `\n${failure.fileName}\n${failure.message}`
    );
  }

  console.error(
    "\nOriginal copies are available as *.before-vyapar-fix.bak"
  );

  process.exit(1);
}

console.log(
  "\n✔️ JavaScript syntax validation passed."
);

console.log(
  "✔️ Original files were preserved as *.before-vyapar-fix.bak"
);

console.log(
  "✔️ Backend URLs, OTP endpoints, Razorpay subscription routes, plan prices and app features were not renamed."
);