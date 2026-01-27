// --- DATA: SUPPLIER MODE ---
const suppliers = {
    'ritsukyo': { name: "RITSUKYO CO.,LTD.", address: "3-chōme-14-10 Higashinitpori, Arakawa City, Tokyo 116-0014, Japan", currency: "USD", defaultLine: "components", theme: "style-a" },
    'alterural': { name: "UDRUZENJE ALTERURAL", address: "Sarajevo, Bosnia and Herzegovina", currency: "USD", defaultLine: "components", theme: "style-b" },
    'winteam_supply': { name: "WIN TEAM CO.,LTD.", address: "NO.117, KANGLE ST., NEIHU DIST., Taipei City, Taiwan", currency: "USD", defaultLine: "equipment", theme: "style-c" },
    'good_shepherd': { name: "GOOD SHEPHERD", address: "International Relief Office, Non-Profit Org.", currency: "USD", defaultLine: "equipment", theme: "style-a" },
    'dili': { name: "DILI KHAYRKHOH", address: "Dushanbe, Tajikistan", currency: "USD", defaultLine: "components", theme: "style-b" },
    'adra_group': { name: "ADRA GROUP", address: "International NGO", currency: "USD", defaultLine: "components", theme: "style-a" },
    'good_neighbors': { name: "Good Neighbors Guatemala", address: "Guatemala", currency: "USD", defaultLine: "components", theme: "style-b" },
    'agencia_desarrollo': { name: "AGENCIA PARA EL DESARROLLOY", address: "International Development Agency", currency: "USD", defaultLine: "components", theme: "style-c" },
    'bancolombia': { name: "BANCOLOMBIA", address: "Colombia", currency: "USD", defaultLine: "components", theme: "style-a" },
    'cfc_chongsu': { name: "Community Foundation Chongsu(CFC)", address: "Non-Profit Organization", currency: "USD", defaultLine: "components", theme: "style-b" },
    'pacos_trustees': { name: "The Registered Trustees of PACOS", address: "Trustee Organization", currency: "USD", defaultLine: "components", theme: "style-c" }
};

const supplierProductLines = {
    components: [
        { id: 'JC-108A-08', desc: 'Bottom Housing-JC-8GB (Raw)', price: 1.50 },
        { id: 'JC-108B-08', desc: 'Bottom Housing-JC-8GB (Raw)', price: 1.40 },
        { id: 'JC-109A-08', desc: 'Bottom Housing-JC-8GB (Raw)', price: 2.00 }
    ],
    equipment: [
        { id: 'K 2 - 0 6', desc: 'Intelligent cooking machine', price: 6300.00 },
        { id: 'J D J - A 1', desc: 'Auto egg fryer', price: 2100.00 },
        { id: 'Accessories', desc: 'Feeding boxes and accessories', price: 420.00 }
    ]
};

const toptecBuyerInfo = `
    <strong>TOPTEC GLOBAL PTE. LTD.</strong><br>
    60 Paya Lebar Road, #07-42 Paya Lebar Square<br>
    Singapore 409051
`;

// --- GLOBAL STATE ---
let currentInvoiceData = {};
let generationArgs = {};
let foundSolutions = [];
let currentSolutionIndex = 0;

// --- COMPANY & PRICE CONFIGS (Sell Mode) ---
const TOPTEC_GLOBAL = {
  name: "TOPTEC GLOBAL PTE. LTD.",
  address: "60 Paya Lebar Road, #07-42 Paya Lebar Square\nSingapore 409051",
  tel: "+65 8965 6938",
  email: "sales@toptec.com.sg",
  uen: "201932202N",
  country: "SINGAPORE"
};

const BANK_DETAILS = {
  uob: `
    <div class="remittance-details" style="margin-top: 30px; font-size: 0.75rem; text-align: left;">
      <p style="font-weight: bold;">REMITTANCE DETAILS</p>
      <p><strong>Account Name:</strong> Toptec Global Pte. Ltd.</p>
      <p><strong>Name of Bank:</strong> United Overseas Bank Limited</p>
      <p><strong>Branch:</strong> UOB PLQ Branch</p>
      <p><strong>SWIFT Code:</strong> UOVB SGSG</p>
      <p><strong>Bank Address:</strong> 10 Paya Lebar Road #02-10 Paya Lebar Quarter Singapore 409057</p>
      <p><strong>USD Account No.:</strong> 335-901-080-8</p>
    </div>
  `,
  ocbc: `
    <div class="remittance-details" style="margin-top: 30px; font-size: 0.75rem; text-align: left;">
      <p style="font-weight: bold;">REMITTANCE DETAILS</p>
      <p><strong>Account Name:</strong> TOPTEC GLOBAL PTE. LTD.</p>
      <p><strong>Address:</strong> 60 PAYA LEBAR Road, #07-42, PAYA LEBAR SQUARE, Singapore 409051</p>
      <p><strong>Name of Bank:</strong> OCBC Bank</p>
      <p><strong>SWIFT Code:</strong> OCBCSGSGXXX</p>
      <p><strong>Bank Code:</strong> 7339</p>
      <p><strong>Branch Code:</strong> 501</p>
      <p><strong>Bank Address:</strong> 65 Chulia Street OCBC Centre Singapore 049513</p>
      <p><strong>USD Account No.:</strong> 687401091201</p>
    </div>
  `
};

const companyConfigs = {
      // --- SELL CONFIGS ---
      'anxin': {
        type: 'sell', name: "An Xin Enterprise Co.,Ltd", address: "9F., No. 222, Sec. 1, Fuxing S. Rd., Da’an Dist., Taipei City ,106458,Taiwan (R.O.C.)", tel: "886-968-353738", country: "TAIWAN", priceTerm: "FOB TAIPEI", paymentTerms: "T/T", currencySymbol: 'US$', currencyCode: 'USD',
        products: [ 
          { id: 'JC-108A-08', desc: 'Bottom Housing-JC-8GB', price: 1.65, est: { pcs_per_carton: 2000, net_weight_per_pc_kg: 0.005, packaging_weight_per_carton_kg: 0.8, volume_per_carton_cbm: 0.035 } }, 
          { id: 'JC-108B-08', desc: 'Bottom Housing-JC-8GB', price: 1.55, est: { pcs_per_carton: 2000, net_weight_per_pc_kg: 0.005, packaging_weight_per_carton_kg: 0.8, volume_per_carton_cbm: 0.035 } }, 
          { id: 'JC-109A-08', desc: 'Bottom Housing-JC-8GB', price: 2.10, est: { pcs_per_carton: 1500, net_weight_per_pc_kg: 0.008, packaging_weight_per_carton_kg: 0.8, volume_per_carton_cbm: 0.04 } } 
        ],
        findQuantities: findQuantitiesAnXinUSD, extraInvoiceLines: () => `<tr class="h-4"><td class="no-border"></td><td class="no-border"></td><td class="no-border"></td><td class="no-border"></td></tr>`,
      },
      'anxin_eur': {
        type: 'sell', name: "An Xin Enterprise Co.,Ltd", address: "9F., No. 222, Sec. 1, Fuxing S. Rd., Da’an Dist., Taipei City ,106458,Taiwan (R.O.C.)", tel: "886-968-353738", country: "TAIWAN", priceTerm: "FOB TAIPEI", paymentTerms: "T/T", currencySymbol: '€', currencyCode: 'EUR',
        products: [ 
          { id: 'JC-108A-08', desc: 'Bottom Housing-JC-8GB', price: 1.55, est: { pcs_per_carton: 2000, net_weight_per_pc_kg: 0.005, packaging_weight_per_carton_kg: 0.8, volume_per_carton_cbm: 0.035 } }, 
          { id: 'JC-108B-08', desc: 'Bottom Housing-JC-8GB', price: 1.45, est: { pcs_per_carton: 2000, net_weight_per_pc_kg: 0.005, packaging_weight_per_carton_kg: 0.8, volume_per_carton_cbm: 0.035 } }, 
          { id: 'JC-109A-08', desc: 'Bottom Housing-JC-8GB', price: 2.00, est: { pcs_per_carton: 1500, net_weight_per_pc_kg: 0.008, packaging_weight_per_carton_kg: 0.8, volume_per_carton_cbm: 0.04 } } 
        ],
        findQuantities: findQuantitiesAnXinEur, extraInvoiceLines: () => `<tr class="h-4"><td class="no-border"></td><td class="no-border"></td><td class="no-border"></td><td class="no-border"></td></tr>`,
      },
      'winteam': {
        type: 'sell', name: "WIN TEAM CO.,LTD.(B D STORE INTELLIGENT)", address: "NO.117,KANGLE ST.,NEIHU DIST., Taipei City ,114038,Taiwan (R.O.C.)", tel: "886-2-26339869", country: "TAIWAN", priceTerm: "FOB TAIPEI", paymentTerms: "T/T", currencySymbol: 'US$', currencyCode: 'USD',
        products: [ 
          { id: 'K 2 - 0 6', desc: 'Intelligent cooking machine', price: 9000, est: { pcs_per_carton: 1, net_weight_per_pc_kg: 12.50, packaging_weight_per_carton_kg: 2.0, volume_per_carton_cbm: 0.16 } }, 
          { id: 'J D J - A 1', desc: 'Fully automatic intelligent egg fryer', price: 3000, est: { pcs_per_carton: 1, net_weight_per_pc_kg: 8.50, packaging_weight_per_carton_kg: 1.5, volume_per_carton_cbm: 0.12 } }, 
          { id: 'Accessories', desc: 'Feeding boxes and accessories', price: 600, est: { pcs_per_carton: 50, net_weight_per_pc_kg: 0.50, packaging_weight_per_carton_kg: 1.0, volume_per_carton_cbm: 0.05 } } 
        ],
        findQuantities: findQuantitiesWinTeam, extraInvoiceLines: () => ``, 
      },
      'styleup': {
        type: 'sell', name: "StyleUp Technology Co., Ltd.", address: "10 F., No. 150, Sec. 2, Nanjing E. Rd., Zhongshan Dist., Taipei City 104695, Taiwan (R.O.C.)", tel: "886-989-553839", country: "TAIWAN", priceTerm: "FOB TAIPEI", paymentTerms: "T/T", currencySymbol: 'US$', currencyCode: 'USD',
        products: [ 
          { id: 'JC-108A-08', desc: 'Bottom Housing-JC-8GB', price: 1.65, est: { pcs_per_carton: 2000, net_weight_per_pc_kg: 0.005, packaging_weight_per_carton_kg: 0.8, volume_per_carton_cbm: 0.035 } }, 
          { id: 'JC-108B-08', desc: 'Bottom Housing-JC-8GB', price: 1.60, est: { pcs_per_carton: 2000, net_weight_per_pc_kg: 0.005, packaging_weight_per_carton_kg: 0.8, volume_per_carton_cbm: 0.035 } }, 
          { id: 'JC-109A-08', desc: 'Bottom Housing-JC-8GB', price: 2.10, est: { pcs_per_carton: 1500, net_weight_per_pc_kg: 0.008, packaging_weight_per_carton_kg: 0.8, volume_per_carton_cbm: 0.04 } } 
        ],
        findQuantities: findQuantitiesStyleUp, extraInvoiceLines: () => `<tr class="h-4"><td class="no-border"></td><td class="no-border"></td><td class="no-border"></td><td class="no-border"></td></tr>`,
      },
      'converge': {
        type: 'sell', name: "Converge Cloud Co., Ltd.", address: "Morgan Tower, Floor 35th Unit 08B-11, Street Sopheak Mongkul,\nPhum 14, Sangkat Tonle Bassac, Khan Chamka Mon, Phnom Penh, Cambodia", tel: "088-590-9999", country: "Cambodia", priceTerm: "", paymentTerms: "T/T-USD/USTD", currencySymbol: 'US$', currencyCode: 'USD',
        products: [ { id: 'AI Cloud storage and advertising service charges', desc: '', price: 0, est: { pcs_per_carton: 999999, net_weight_per_pc_kg: 0, packaging_weight_per_carton_kg: 0, volume_per_carton_cbm: 0 } } ],
        findQuantities: (totalAmount) => ([{ q1: 1 }]), extraInvoiceLines: () => ``, 
      },
      // --- BUY CONFIGS ---
      'buy_foreign_usd': {
        type: 'buy', name: "外國公司 (Foreign Company)", address: " ", tel: " ", country: " ", priceTerm: " ", paymentTerms: "T/T", currencySymbol: 'US$', currencyCode: 'USD',
        products: [ 
          { id: 'JC-108A-08', desc: 'Bottom Housing-JC-8GB', price: 1.5, est: { pcs_per_carton: 2000, net_weight_per_pc_kg: 0.005, packaging_weight_per_carton_kg: 0.8, volume_per_carton_cbm: 0.035 } }, 
          { id: 'JC-108B-08', desc: 'Bottom Housing-JC-8GB', price: 1.4, est: { pcs_per_carton: 2000, net_weight_per_pc_kg: 0.005, packaging_weight_per_carton_kg: 0.8, volume_per_carton_cbm: 0.035 } }, 
          { id: 'JC-109A-08', desc: 'Bottom Housing-JC-8GB', price: 2.0, est: { pcs_per_carton: 1500, net_weight_per_pc_kg: 0.008, packaging_weight_per_carton_kg: 0.8, volume_per_carton_cbm: 0.04 } } 
        ],
        findQuantities: findQuantitiesAnXinUSD, extraInvoiceLines: () => `<tr class="h-4"><td class="no-border"></td><td class="no-border"></td><td class="no-border"></td><td class="no-border"></td></tr>`,
      },
      'buy_foreign_eur': {
        type: 'buy', name: "外國公司 (Foreign Company)", address: " ", tel: " ", country: " ", priceTerm: " ", paymentTerms: "T/T", currencySymbol: '€', currencyCode: 'EUR',
        products: [ 
          { id: 'JC-108A-08', desc: 'Bottom Housing-JC-8GB', price: 1.40, est: { pcs_per_carton: 2000, net_weight_per_pc_kg: 0.005, packaging_weight_per_carton_kg: 0.8, volume_per_carton_cbm: 0.035 } }, 
          { id: 'JC-108B-08', desc: 'Bottom Housing-JC-8GB', price: 1.30, est: { pcs_per_carton: 2000, net_weight_per_pc_kg: 0.005, packaging_weight_per_carton_kg: 0.8, volume_per_carton_cbm: 0.035 } }, 
          { id: 'JC-109A-08', desc: 'Bottom Housing-JC-8GB', price: 1.85, est: { pcs_per_carton: 1500, net_weight_per_pc_kg: 0.008, packaging_weight_per_carton_kg: 0.8, volume_per_carton_cbm: 0.04 } } 
        ],
        findQuantities: findQuantitiesAnXinEur, extraInvoiceLines: () => `<tr class="h-4"><td class="no-border"></td><td class="no-border"></td><td class="no-border"></td><td class="no-border"></td></tr>`,
      },
};


// --- SUPPLIER MODE LOGIC ---
function calculateSupplierQuantities(totalAmount, lineType) {
    const productLine = supplierProductLines[lineType];
    if (!productLine || productLine.length === 0) return null;

    const quantities = [];
    const amounts = [];
    let calculatedTotalCents = 0;
    const totalAmountCents = Math.round(totalAmount * 100);
    const tempProductLine = JSON.parse(JSON.stringify(productLine));
    const useFlexibleQuantities = document.getElementById('flexible-quantity-checkbox').checked;

    // Allocate amounts based on 40/40/20 split
    const allocations = [0.4, 0.4, 0.2];
    for (let i = 0; i < tempProductLine.length; i++) {
        const product = tempProductLine[i];
        const allocation = i < allocations.length ? allocations[i] : 0;
        const targetAmountCents = Math.round(totalAmountCents * allocation);
        const priceCents = Math.round(product.price * 100);

        let qty = 0;
        if (priceCents > 0) {
            qty = Math.floor(targetAmountCents / priceCents);
            if (!useFlexibleQuantities) {
                qty = Math.round(qty / 10) * 10; // Round to nearest 10 if flexible mode is off
            } else {
                if (qty === 0 && targetAmountCents > 0) qty = 1;
            }
        }
        
        quantities[i] = qty;
        const itemTotalCents = qty * priceCents;
        amounts[i] = itemTotalCents;
        calculatedTotalCents += itemTotalCents;
    }

    // Error correction to meet the original totalAmount by adjusting the last item's price.
    let differenceCents = totalAmountCents - calculatedTotalCents;
    const lastProductIndex = tempProductLine.length - 1;

    if (lastProductIndex >= 0) {
        const lastProduct = tempProductLine[lastProductIndex];
        const lastQty = quantities[lastProductIndex];
        
        if (lastQty > 0) {
            const originalAmountCents = amounts[lastProductIndex];
            const newAmountCents = originalAmountCents + differenceCents;
            const adjustedPriceCents = Math.round(newAmountCents / lastQty);
            lastProduct.adjustedPrice = adjustedPriceCents / 100;
        } else if (differenceCents > 0) {
            quantities[lastProductIndex] = 1;
            lastProduct.adjustedPrice = Math.round(differenceCents) / 100;
        }
    }
    
    const finalQuantities = {};
    for(let i=0; i < quantities.length; i++) {
        finalQuantities[`q${i+1}`] = quantities[i];
    }

    return { quantities: finalQuantities, products: tempProductLine };
}


// --- UTILITIES ---
function adjustDate(yyyymmdd, days) {
  const year = parseInt(yyyymmdd.substring(0, 4), 10);
  const month = parseInt(yyyymmdd.substring(4, 6), 10) - 1;
  const day = parseInt(yyyymmdd.substring(6, 8), 10);
  const date = new Date(Date.UTC(year, month, day));
  date.setUTCDate(date.getUTCDate() + days);
  const newYear = date.getUTCFullYear();
  const newMonth = String(date.getUTCMonth() + 1).padStart(2, '0');
  const newDay = String(date.getUTCDate()).padStart(2, '0');
  return `${newYear}${newMonth}${newDay}`;
}

function buildInvoiceNoFromDate(yyyymmdd, prefix = 'TOP'){
  if(!/^\d{8}$/.test(yyyymmdd)) return '';
  return `${prefix}${yyyymmdd}001`;
}

function getDateForInvoiceNo(rawDate){
  if(!/^\d{8}$/.test(rawDate)) return '';
  const shouldOffset = document.getElementById('date-adjust-checkbox').checked;
  return shouldOffset ? adjustDate(rawDate, -3) : rawDate;
}

function syncInvoiceNoFromDate(){
  const rawDate = document.getElementById('date').value;
  const adjustedDate = getDateForInvoiceNo(rawDate);
  const invoiceField = document.getElementById('invoiceNo');
  if(adjustedDate){
    const isSupplierMode = document.getElementById('mode-supplier-toggle').checked;
    let prefix = 'TOP';
    if (isSupplierMode) {
        const supplierKey = document.getElementById('supplier-select').value;
        if(supplierKey) {
          prefix = supplierKey.replace(/_supply/i, '').replace(/_/g, '').substring(0, 3).toUpperCase();
        }
    }
    invoiceField.value = buildInvoiceNoFromDate(adjustedDate, prefix);
  }
}

// ---- SORTING & SCORING (FOR SELL MODE) ----
const BEAUTY_WEIGHTS = { roundness: 1, evenness: 6, gapSymmetry: 3, ratio: 2, spread: 2 };
function dynamicBeautyLimits(totalAmount){
  const baseSpread = totalAmount < 30000 ? 4000 : 6000;
  return { maxRatio: 2.0, maxSpread: baseSpread };
}
function roundnessScore(q){ if(q%1000===0) return 4; if(q%100===0) return 3; if(q%10===0) return 2; if(q%5===0) return 1; return 0; }
function computeBeautyFeatures(q1,q2,q3){
  const mean=(q1+q2+q3)/3;
  const sd=Math.sqrt(((q1-mean)**2+(q2-mean)**2+(q3-mean)**2)/3);
  const gap1=q1-q2, gap2=q2-q3; const gapAsym=Math.abs(gap1-gap2);
  const ratio=q3>0? q1/q3: Infinity; const spread=Math.max(q1,q2,q3)-Math.min(q1,q2,q3);
  const roundness=roundnessScore(q1)+roundnessScore(q2)+roundnessScore(q3);
  return {mean, sd, gap1, gap2, gapAsym, ratio, spread, roundness};
}
function compositeScore(feat,weights=BEAUTY_WEIGHTS){
  const denom=feat.mean||1;
  return (
    weights.roundness*feat.roundness
    - weights.evenness*(feat.sd/denom)
    - weights.gapSymmetry*(feat.gapAsym/denom)
    - weights.ratio*Math.max(0,(feat.ratio-1))
    - weights.spread*(feat.spread/denom)
  );
}

function basicRoundEvenSort(solutions){
  const getRound = (q)=> roundnessScore(q);
  const evenness = (a,b,c)=>{ const m=(a+b+c)/3; return Math.sqrt(((a-m)**2+(b-m)**2+(c-m)**2)/3); };
  return solutions.slice().sort((A,B)=>{
    const rA=getRound(A.q1)+getRound(A.q2)+getRound(A.q3);
    const rB=getRound(B.q1)+getRound(B.q2)+getRound(B.q3);
    if(rB!==rA) return rB-rA; // roundness 多者優先
    const sA=evenness(A.q1,A.q2,A.q3), sB=evenness(B.q1,B.q2,B.q3);
    return sA-sB; // 標準差小者優先
  });
}

function winTeamSortSolutions(solutions){
  return solutions.slice().sort((A,B)=>{
    const diffA = Math.abs(A.q1 - A.q2);
    const diffB = Math.abs(B.q1 - B.q2);
    if(diffA !== diffB) return diffA - diffB;
    const minA = Math.min(A.q1, A.q2);
    const minB = Math.min(B.q1, B.q2);
    if(minA !== minB) return minB - minA;
    const ratioA = A.q1 > 0 ? A.q3 / A.q1 : Number.POSITIVE_INFINITY;
    const ratioB = B.q1 > 0 ? B.q3 / B.q1 : Number.POSITIVE_INFINITY;
    const ratioGapA = Math.abs(ratioA - 6);
    const ratioGapB = Math.abs(ratioB - 6);
    if(ratioGapA !== ratioGapB) return ratioGapA - ratioGapB;
    const totalA = A.q1 + A.q2;
    const totalB = B.q1 + B.q2;
    if(totalA !== totalB) return totalB - totalA;
    return A.q3 - B.q3;
  });
}

function isJCConfig(config){
  return (config.products||[]).some(p=> typeof p.id === 'string' && p.id.startsWith('JC-'));
}

function scoreAndSortSolutionsForConfig(config, solutions, totalAmount){
  if(!solutions || solutions.length===0) return [];
  if(isJCConfig(config)){
    const LIMITS = dynamicBeautyLimits(totalAmount);
    const filtered = solutions.filter(s=>{
      const {q1,q2,q3}=s; if(q3<=0) return false; const f=computeBeautyFeatures(q1,q2,q3);
      return f.ratio<=LIMITS.maxRatio && f.spread<=LIMITS.maxSpread;
    });
    const base = filtered.length? filtered: solutions;
    return base.map(s=>{ const f=computeBeautyFeatures(s.q1,s.q2,s.q3); return {
      ...s,
      scores: {
        roundness: f.roundness,
        stddev: +f.sd.toFixed(2),
        gapAsym: +((f.gap1 - f.gap2)).toFixed(2),
        ratio: +f.ratio.toFixed(2),
        spread: f.spread,
        composite: +compositeScore(f).toFixed(2)
      }
    }; }).sort((a,b)=> b.scores.composite - a.scores.composite);
  } else if(config === companyConfigs.winteam){
    const coreSolutions = solutions.filter(s=> s.q1>0 && s.q2>0);
    const base = coreSolutions.length ? coreSolutions : solutions;
    return winTeamSortSolutions(base);
  } else {
    return basicRoundEvenSort(solutions);
  }
}

// ---- SOLVER FUNCTIONS (FOR SELL MODE) ----
function findQuantitiesAnXinUSD(totalAmount) {
      const companyKey = document.getElementById('company').value;
      const config = companyConfigs[companyKey];
      const prices = config.products.map(p=>p.price);
      const useFlexibleUnits = document.getElementById('flexible-quantity-checkbox').checked;
      const MAX_SOLUTIONS_PER_UNIT = 220;
      const SINGLE_UNIT_THRESHOLD = 20000;

      const solveByUnit = (amount, unit) => {
        let solutions = [];
        const diffLimit = unit >= 1000 ? 50 : (unit >= 100 ? 500 : 5000);
        const amount_c = Math.round(amount * 100);
        const p_unit_c = {
            p1: Math.round(prices[0] * 100) * unit,
            p2: Math.round(prices[1] * 100) * unit,
            p3: Math.round(prices[2] * 100) * unit
        };

        const minQtyUnit = unit >= 1000 ? 1 : (unit >= 100 ? 10 : (unit >= 10 ? 10 : 1));
        const maxQ1_limit = p_unit_c.p1 > 0 ? Math.floor(amount_c / p_unit_c.p1) : 0;
        
        const sumP = p_unit_c.p1 + p_unit_c.p2 + p_unit_c.p3;
        const lowerBoundQ1 = Math.floor(amount_c / sumP);
        const upperBoundQ1 = Math.floor((amount_c + diffLimit * (p_unit_c.p2 + p_unit_c.p3)) / sumP) + 2;
        
        let startQ1 = Math.min(maxQ1_limit, upperBoundQ1);
        let endQ1 = Math.max(minQtyUnit, lowerBoundQ1 - 2);

        let iterations = 0; const ITERATION_CAP = unit === 1 ? 450000 : 900000;
        for(let q1=startQ1; q1>=endQ1; q1--){
          const maxQ2 = p_unit_c.p2 > 0 ? Math.min(q1, Math.floor((amount_c - q1*p_unit_c.p1)/p_unit_c.p2)) : 0;
          for(let q2=maxQ2; q2>=minQtyUnit; q2--){
            iterations++; if(iterations>ITERATION_CAP) return solutions; 
            const remainder_c = amount_c - (q1*p_unit_c.p1) - (q2*p_unit_c.p2);
            if (p_unit_c.p3 === 0) continue;
            const q3c = remainder_c / p_unit_c.p3;
            if(q3c > 0 && Math.abs(q3c - Math.round(q3c)) < 0.00001){
              const q3 = Math.round(q3c);
              if(q1>=q2 && q2>q3 && q3>=minQtyUnit && (q1 - q3) <= diffLimit){
                solutions.push({ q1:q1*unit, q2:q2*unit, q3:q3*unit });
                if(solutions.length>=MAX_SOLUTIONS_PER_UNIT) return solutions;
              }
            }
          }
        }
        return solutions;
      };

      const dedup = (arr)=>{
        const seen=new Set(); const out=[]; 
        for(const s of arr){ const k=`${s.q1}-${s.q2}-${s.q3}`;
          if(!seen.has(k)){
            seen.add(k);
            out.push(s);}
        } return out;
      };

      const solveForAmount = (amount)=>{
        let all=[];
        if(useFlexibleUnits){
          const unitsToTry = (amount > SINGLE_UNIT_THRESHOLD) ? [1000,100,10] : [1000,100,10,1];
          for(const unit of unitsToTry){
            all = all.concat(solveByUnit(amount, unit));
            if(all.length >= MAX_SOLUTIONS_PER_UNIT) break;
          }
          all = dedup(all);
        } else {
          all = solveByUnit(amount, 1000);
          if(all.length < 5) all = all.concat(solveByUnit(amount, 100));
          if(all.length < 5) all = all.concat(solveByUnit(amount, 10));
          all = dedup(all);
        }
        return all.slice(0, MAX_SOLUTIONS_PER_UNIT);
      };

      let solutions = solveForAmount(totalAmount);
      if(solutions && solutions.length>0){
        return scoreAndSortSolutionsForConfig(config, solutions, totalAmount);
      }

      let adjustedAmount = totalAmount; const searchLimit = totalAmount + 200;
      while(adjustedAmount < searchLimit){
        adjustedAmount = parseFloat((adjustedAmount + 0.05).toFixed(2));
        solutions = solveForAmount(adjustedAmount);
        if(solutions && solutions.length>0){
          const statusDiv = document.getElementById('status');
          statusDiv.innerHTML = `<span class="font-bold">注意：</span>您輸入的金額 ${totalAmount.toLocaleString()} 無法找到組合。<br>已自動<span class="font-bold">向上調整</span>為最接近的有效金額 <span class="font-bold">${adjustedAmount.toLocaleString()}</span> 並生成發票。`;
          statusDiv.className = 'mt-4 text-center text-orange-200 font-semibold';
          const sorted = scoreAndSortSolutionsForConfig(config, solutions, adjustedAmount);
          sorted.forEach(s=> s.adjustedAmount = adjustedAmount);
          return sorted;
        }
      }
      return [];
}

function findQuantitiesAnXinEur(totalAmount){
    const companyKey = document.getElementById('company').value;
    const config = companyConfigs[companyKey];
    const prices = config.products.map(p=>p.price);
    const useFlexibleUnits = document.getElementById('flexible-quantity-checkbox').checked;
    const MAX_SOLUTIONS_PER_UNIT = 220;

    const solveByUnit = (amount, unit) => {
        let solutions = [];
        const diffLimit = unit >= 1000 ? 50 : (unit >= 100 ? 500 : 5000);
        const amount_c = Math.round(amount * 100);
        const p_unit_c = {
            p1: Math.round(prices[0] * 100) * unit,
            p2: Math.round(prices[1] * 100) * unit,
            p3: Math.round(prices[2] * 100) * unit
        };
        const minQtyUnit = unit >= 1000 ? 1 : (unit >= 100 ? 10 : (unit >= 10 ? 10 : 1));
        const maxQ1_limit = p_unit_c.p1 > 0 ? Math.floor(amount_c / p_unit_c.p1) : 0;
        const sumP = p_unit_c.p1 + p_unit_c.p2 + p_unit_c.p3;
        const lowerBoundQ1 = Math.floor(amount_c / sumP);
        const upperBoundQ1 = Math.floor((amount_c + diffLimit * (p_unit_c.p2 + p_unit_c.p3)) / sumP) + 2;
        let startQ1 = Math.min(maxQ1_limit, upperBoundQ1);
        let endQ1 = Math.max(minQtyUnit, lowerBoundQ1 - 2);
        let iterations = 0; const ITERATION_CAP = unit === 1 ? 450000 : 900000;
        for(let q1=startQ1; q1>=endQ1; q1--){
          const maxQ2 = p_unit_c.p2 > 0 ? Math.min(q1, Math.floor((amount_c - q1*p_unit_c.p1)/p_unit_c.p2)) : 0;
          for(let q2=maxQ2; q2>=minQtyUnit; q2--){
            iterations++; if(iterations>ITERATION_CAP) return solutions; 
            const remainder_c = amount_c - (q1*p_unit_c.p1) - (q2*p_unit_c.p2);
            if (p_unit_c.p3 === 0) continue;
            const q3c = remainder_c / p_unit_c.p3;
            if(q3c > 0 && Math.abs(q3c - Math.round(q3c)) < 0.00001){
              const q3 = Math.round(q3c);
              if(q1>=q2 && q2>q3 && q3>=minQtyUnit && (q1 - q3) <= diffLimit){
                solutions.push({ q1:q1*unit, q2:q2*unit, q3:q3*unit });
                if(solutions.length>=MAX_SOLUTIONS_PER_UNIT) return solutions;
              }
            }
          }
        }
        return solutions;
    };
    const dedup = (arr)=>{ const seen=new Set(); const out=[]; for(const s of arr){ const k=`${s.q1}-${s.q2}-${s.q3}`; if(!seen.has(k)){ seen.add(k); out.push(s);} } return out; };
    let all=[];
    if(useFlexibleUnits){
        for(const unit of [1000,100,10,1]){ all = all.concat(solveByUnit(totalAmount, unit)); if(all.length >= MAX_SOLUTIONS_PER_UNIT) break; }
        all = dedup(all);
    } else {
        all = solveByUnit(totalAmount, 1000);
        if(all.length < 5) all = all.concat(solveByUnit(totalAmount, 100));
        if(all.length < 5) all = all.concat(solveByUnit(totalAmount, 10));
        all = dedup(all);
    }
    return scoreAndSortSolutionsForConfig(config, all, totalAmount);
}

// --- OPTIMIZED SOLVER FUNCTIONS (INTEGER MATH) ---

function findQuantitiesWinTeam(totalAmount){
  const config = companyConfigs.winteam;
  const prices = config.products.map(p=>p.price);
  // Convert to cents
  const p1_c = Math.round(prices[0] * 100);
  const p2_c = Math.round(prices[1] * 100);
  const p3_c = Math.round(prices[2] * 100);
  const totalAmount_c = Math.round(totalAmount * 100);

  let solutions=[]; 
  const seen=new Set();

  // Logic: Iterate possible quantities for expensive items first
  const maxQ1 = Math.floor(totalAmount_c / p1_c);

  for(let q1 = maxQ1; q1 >= 0; q1--){
      const rem1 = totalAmount_c - (q1 * p1_c);
      const maxQ2 = Math.floor(rem1 / p2_c);
      
      for(let q2 = maxQ2; q2 >= 0; q2--){
          const rem2 = rem1 - (q2 * p2_c);
          
          if(rem2 >= 0 && rem2 % p3_c === 0){
              const q3 = rem2 / p3_c;
              
              // Business Logic Checks
              if(q1 === 0 && q2 === 0 && q3 === 0) continue;
              
              const sol = {q1, q2, q3};
              const key = `${q1}-${q2}-${q3}`;
              if(!seen.has(key)){
                  solutions.push(sol); 
                  seen.add(key);
              }
          }
      }
  }

  // Fallback: If no exact solution, try adjusting amount slightly (Logic retained from original but updated)
  if(solutions.length === 0){
      // Try finding nearest valid amount (simplistic approach: fit to smallest unit)
      const gcd_c = 60000; // 600.00 USD in cents
      let adjustedAmount_c = totalAmount_c;
      if(totalAmount_c % gcd_c !== 0){
          adjustedAmount_c = totalAmount_c - (totalAmount_c % gcd_c) + gcd_c;
      }
      
      if(adjustedAmount_c !== totalAmount_c){
           const statusDiv = document.getElementById('status');
           const adjFloat = adjustedAmount_c / 100;
           statusDiv.innerHTML = `<span class="font-bold">注意：</span>金額 ${totalAmount.toLocaleString()} 無法整除。<br>建議調整為 <span class="font-bold">${adjFloat.toLocaleString()}</span>`;
           statusDiv.className='mt-4 text-center text-orange-200 font-semibold';
      }
  }

  return scoreAndSortSolutionsForConfig(config, solutions, totalAmount);
}

function findQuantitiesStyleUp(totalAmount){
  const companyKey = document.getElementById('company').value;
  const config = companyConfigs[companyKey];
  const prices = config.products.map(p=>p.price);
  
  const total_c = Math.round(totalAmount * 100);
  const pSum_c = Math.round((prices[0] + prices[1] + prices[2]) * 100);
  
  let solutions=[];
  if(total_c > 0 && total_c % pSum_c === 0){ 
      const q = total_c / pSum_c; 
      if(q > 0) solutions.push({q1:q, q2:q, q3:q}); 
  }
  return scoreAndSortSolutionsForConfig(config, solutions, totalAmount);
}

// ---- FORMATTING & GENERATORS ----
function formatDate(yyyymmdd){ if(!yyyymmdd||yyyymmdd.length!==8) return ''; const y=yyyymmdd.substring(0,4); const m=yyyymmdd.substring(4,6); const d=yyyymmdd.substring(6,8); const date=new Date(`${y}-${m}-${d}T00:00:00Z`); const monthNames=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']; return `${monthNames[date.getUTCMonth()]}.${d}.${y}`; }
function formatCurrency(num, symbol='US$'){ return `${symbol}${numberToCurrency(num, 2)}`; }
function numberToCurrency(num, decimals = 2){ return num.toLocaleString('en-US',{minimumFractionDigits: decimals, maximumFractionDigits: decimals}); }
function numberToWords(amount, currencyCode){
      const currencyNames = { 'USD': 'US DOLLARS', 'EUR': 'EUROS' };
      const ones=['','ONE','TWO','THREE','FOUR','FIVE','SIX','SEVEN','EIGHT','NINE'];
      const teens=['TEN','ELEVEN','TWELVE','THIRTEEN','FOURTEEN','FIFTEEN','SIXTEEN','SEVENTEEN','EIGHTEEN','NINETEEN'];
      const tens=['','', 'TWENTY','THIRTY','FORTY','FIFTY','SIXTY','SEVENTY','EIGHTY','NINETY'];
      const thousands=['','THOUSAND','MILLION','BILLION','TRILLION'];
      function convertGroup(n){ if(n===0) return ''; let str=''; if(n>=100){ str+=ones[Math.floor(n/100)]+' HUNDRED '; n%=100; } 
        if(n>=10 && n<=19){ str+=teens[n-10]+' '; } else { if(n>=20){ str+=tens[Math.floor(n/10)]+' '; n%=10; } if(n>=1 && n<=9){ str+=ones[n]+' '; } } return str; }
      const num=parseFloat(amount); if(isNaN(num)) return '';
      const currencyName=(currencyNames[currencyCode]||currencyCode).toUpperCase();
      if(num===0) return currencyName+' ZERO ONLY';
      const integerPart=Math.floor(num); const fractionalPart=Math.round((num-integerPart)*100);
      let words=''; if(integerPart>0){ let temp=integerPart; let i=0; while(temp>0){ if(temp%1000!==0){ words = convertGroup(temp%1000)+thousands[i]+' '+words; } temp=Math.floor(temp/1000); i++; } }
      let result=currencyName+' '+words.trim(); if(fractionalPart>0){ result+=` AND ${String(fractionalPart).padStart(2,'0')}/100`; }
      result+=' ONLY'; return result.replace(/\s+/g,' ').trim().toUpperCase();
}
function generateSayTotal(amount, currencyCode){ const el=document.getElementById('say-total-amount'); if(el) el.textContent = numberToWords(amount, currencyCode) || ''; }

function generateSupplierInvoiceHTML(supplier, inputs, totalAmount, quantResult) {
    const { dateInput, invoiceNo, style } = inputs;
    const formattedDate = formatDate(dateInput);
    const currencySymbol = supplier.currency === 'USD' ? 'US$' : supplier.currency;
    const currencyCode = supplier.currency;

    // 自動簽名生成邏輯
    const signatureNames = [
        "James Miller", "Sarah Connor", "Robert Smith", "Maria Garcia", "David Wilson", "Michael Brown", "Jennifer Davis", "William Jones", "Elizabeth Taylor", "John Anderson", "Patricia Thomas", "Christopher Jackson", "Linda White", "Joseph Harris", "Barbara Martin", "Thomas Thompson", "Susan Moore", "Charles Robinson", "Margaret Clark", "Daniel Rodriguez"
    ];
    const signerName = signatureNames[Math.floor(Math.random() * signatureNames.length)];
    const signRotation = (Math.random() * 10 - 5).toFixed(1); // -5 to 5 degrees
    
    let tableRows = '';
    if (!quantResult) {
        tableRows = `
            <tr>
                <td>Payment for goods supplied / services rendered as per agreement.</td>
                <td class="text-right">1</td>
                <td class="text-right">${numberToCurrency(totalAmount)}</td>
                <td class="text-right">${numberToCurrency(totalAmount)}</td>
            </tr>`;
    } else {
        const { quantities, products } = quantResult;
        tableRows = products.map((p, i) => {
            const qty = quantities[`q${i+1}`] || 0;
            if (!qty) return '';
            const isAdjusted = p.adjustedPrice !== undefined;
            const unitPrice = isAdjusted ? p.adjustedPrice : p.price;
            const amount = qty * unitPrice;
            const idCell = p.id ? `${p.id} - ` : '';
            
            let priceDisplay = numberToCurrency(unitPrice, 2);

            return `
                <tr>
                    <td>${idCell}${p.desc}</td>
                    <td class="text-right">${qty.toLocaleString()}</td>
                    <td class="text-right">${priceDisplay}</td>
                    <td class="text-right">${numberToCurrency(amount)}</td>
                </tr>`;
        }).join('');
    }

    const invoiceHTML = `
    <div class="invoice-box supplier-mode ${style}" id="invoice-content">
        <div class="flex justify-between items-center mb-6 invoice-header">
          <div class="supplier-name-header">${supplier.name}</div>
          <div class="text-left text-xs seller-block">
          </div>
        </div>
        <h1 class="invoice-title font-bold text-xl mb-5">INVOICE</h1>
        <div class="flex justify-between mb-4 info-row">
          <div class="w-2/3 buyer-card">
            <p><strong>BILL TO:</strong></p>
            ${toptecBuyerInfo}
          </div>
          <div class="w-1/3 text-left invoice-card">
            <p><strong>INVOICE #:</strong> <span id="inv-no">${invoiceNo}</span></p>
            <p><strong>DATE:</strong> ${formattedDate}</p>
          </div>
        </div>
        <table class="w-full invoice-table invoice-body-table mb-3">
          <thead>
            <tr class="font-bold">
              <td>DESCRIPTION</td>
              <td class="w-1/6">QTY</td>
              <td class="w-1/5">UNIT PRICE (${currencyCode})</td>
              <td class="w-1/5">AMOUNT (${currencyCode})</td>
            </tr>
          </thead>
          <tbody>${tableRows}</tbody>
        </table>
        <div class="flex justify-end mt-6 invoice-summary">
          <div class="w-2/5 summary-card">
            <div class="flex justify-between"><strong>SAY TOTAL:</strong><strong id="say-total-amount" class="text-right flex-1 ml-2"></strong></div>
            <div class="flex justify-between border-t border-black pt-1 mt-2"><strong>TOTAL:</strong><strong>${formatCurrency(totalAmount, currencySymbol)}</strong></div>
          </div>
        </div>
        <div class="flex justify-end" style="margin-top:80px;">
          <div class="w-2/5 text-center" style="position: relative;">
            <div style="position: absolute; bottom: 10px; left: 0; right: 0; font-family: 'Mrs Saint Delafield', cursive; font-size: 2.8rem; color: #2c3e50; transform: rotate(${signRotation}deg); pointer-events: none; line-height: 1;">${signerName}</div>
            <div class="border-t border-black pt-1">AUTHORIZED SIGNATURE</div>
          </div>
        </div>
    </div>`;
    document.getElementById('invoice-preview').innerHTML = invoiceHTML;
}

function generateSellInvoiceHTML(config, inputs, totalAmount, quantities){
  const { dateInput, invoiceType, invoiceNo, bankAccount, includeSignature } = inputs;
  const formattedDate = formatDate(dateInput);
  const seller = TOPTEC_GLOBAL;
  const buyer  = { name: config.name, address: config.address, tel: config.tel };
  const sellerLogoHTML = `<img src="../assets/img/toptec-logo.svg" alt="TOPTEC logo" class="invoice-logo">`;

  let tableRows = config.products.map((p,i)=>{
      const qty = quantities[`q${i+1}`] || 0;
      if(qty === 0 && config.products.length > 1) return '';
      const unitPrice = p.price;
      const amount = qty * unitPrice;
      return `
        <tr><td>${p.id}</td><td>${qty > 0 ? qty.toLocaleString() : 'N/A'}</td><td>${numberToCurrency(unitPrice)}</td><td>${numberToCurrency(amount)}</td></tr>
        ${p.desc ? `<tr><td class="text-left pl-4">${p.desc}</td><td></td><td></td><td></td></tr>` : ''}
      `;
    }).join('');

    const remittanceHTML = bankAccount !== 'none' && BANK_DETAILS[bankAccount] ? BANK_DETAILS[bankAccount] : '';
    const signatureImgHTML = includeSignature ? `<img src="../assets/img/GOLD SIGN.png" style="position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%); height: 80px; opacity: 0.95;" alt="Signature">` : '';

    const invoiceHTML = `
    <div class="invoice-box" id="invoice-content">
        <div class="flex justify-between items-start mb-6 invoice-header">
          <div class="flex items-center">${sellerLogoHTML}</div>
          <div class="text-left text-xs seller-block">
            <p class="font-bold text-base leading-tight">${seller.name}</p>
            <p>${seller.address.replace(/\n/g,'<br>')}</p>
            ${seller.tel ? `<p>TEL: ${seller.tel}</p>` : ''}
            ${seller.email ? `<p>Email: ${seller.email}</p>` : ''}
          </div>
        </div>
        <h1 class="invoice-title text-center font-bold text-xl mb-5">${invoiceType}</h1>
        <div class="flex justify-between mb-4 info-row">
            <div class="w-2/3 buyer-card"><p><strong>BUYER:</strong> ${buyer.name}</p></div>
            <div class="w-1/3 text-left invoice-card">
                <p><strong>INV.No.:</strong> <span id="inv-no">${invoiceNo}</span></p>
                <p><strong>Date:</strong> ${formattedDate}</p>
            </div>
        </div>
        <table class="w-full invoice-table invoice-body-table mb-3">
            <thead>
                <tr class="font-bold"><td class="w-1/4">ITEM NO.</td><td class="w-1/4">Q'TY</td><td class="w-1/4">UNIT PRC</td><td class="w-1/4">TTL AMT</td></tr>
                <tr class="font-bold"><td></td><td>PCS</td><td>${config.currencyCode}/PCS</td><td>${config.currencyCode}</td></tr>
            </thead>
            <tbody>${tableRows}${config.extraInvoiceLines ? config.extraInvoiceLines() : ''}</tbody>
        </table>
        <div class="flex justify-end mt-6 invoice-summary">
            <div class="w-2/5 summary-card">
                <div class="flex justify-between"><strong>SAY TOTAL:</strong><strong id="say-total-amount" class="text-right flex-1 ml-2"></strong></div>
                <div class="flex justify-between border-t border-black pt-1 mt-2"><strong>TOTAL:</strong><strong>${formatCurrency(totalAmount, config.currencySymbol)}</strong></div>
            </div>
        </div>
        ${remittanceHTML}
        <div class="flex justify-end" style="margin-top:30px;">
            <div class="w-1/3 text-center" style="position: relative;">
                ${signatureImgHTML}
                <div class="border-t border-black pt-1">AUTHORIZED SIGNATURE</div>
            </div>
        </div>
    </div>`;
    document.getElementById('invoice-preview').innerHTML = invoiceHTML;
}


// --- MAIN EVENT HANDLER & RENDER LOGIC ---

document.getElementById('generateBtn').addEventListener('click', ()=>{
    const useCustomFields = document.getElementById('custom-fields-checkbox').checked;
    const isSupplierMode = document.getElementById('mode-supplier-toggle').checked;
    const statusDiv = document.getElementById('status');
    const invoiceWrapper = document.getElementById('invoice-wrapper');
    const findNextBtn = document.getElementById('findNextBtn');
    
    statusDiv.innerHTML='';
    invoiceWrapper.classList.add('hidden');
    findNextBtn.classList.add('hidden');

    const dateInput = document.getElementById('date').value;
    const invoiceField = document.getElementById('invoiceNo');
    
    const isSupplierModeForPrefix = document.getElementById('mode-supplier-toggle').checked;
    let prefix = 'TOP';
    if (isSupplierModeForPrefix) {
        const supplierKey = document.getElementById('supplier-select').value;
        if(supplierKey) {
          prefix = supplierKey.replace(/_supply/i, '').replace(/_/g, '').substring(0, 3).toUpperCase();
        }
    }
    let invoiceNo = invoiceField.value.trim() || buildInvoiceNoFromDate(getDateForInvoiceNo(dateInput), prefix);
    
    if (!/^\d{8}$/.test(dateInput)) {
        statusDiv.innerHTML = '錯誤：請確保日期 (YYYYMMDD) 已正確填寫。';
        statusDiv.className='mt-4 text-center text-red-300 font-semibold';
        return;
    }
    invoiceField.value = invoiceNo;

    statusDiv.textContent='請稍候，正在計算並生成文件...';
    statusDiv.className='mt-4 text-center text-blue-200 font-semibold animate-pulse';

    setTimeout(() => {
        let success = false;
        let totalAmount = parseFloat(document.getElementById('totalAmount').value);
        let finalTotal = totalAmount;

        const lineType = document.getElementById('product-line-select').value;
        const isSupplierManual = isSupplierMode && lineType === 'manual';

        if (!isSupplierManual && (isNaN(totalAmount) || totalAmount <= 0)) {
            statusDiv.innerHTML = '錯誤：總金額必須是有效數字。';
            statusDiv.className='mt-4 text-center text-red-300 font-semibold';
            return;
        }

        if (useCustomFields) {
            // --- CUSTOM FIELDS LOGIC ---
            const unitPrice = parseFloat(document.getElementById('unitPrice').value);
            if (isNaN(unitPrice) || unitPrice <= 0) {
                 statusDiv.innerHTML = '錯誤：使用自定義欄位時，單價必須是有效數字且大於 0。';
                 statusDiv.className='mt-4 text-center text-red-300 font-semibold';
                 return;
            }
            const findQuantitiesSimple = (total, price) => ([{ q1: Math.floor(total / price) }]);
            const customConfig = {
                type: 'sell', 
                name: document.getElementById('customCompany').value || 'Custom Company',
                address: '', tel: '',
                currencySymbol: 'US$', currencyCode: 'USD',
                products: [{
                    id: document.getElementById('customItemNo').value || 'ITEM-001',
                    desc: document.getElementById('productName').value || 'Custom Product',
                    price: unitPrice
                }],
                findQuantities: (total) => findQuantitiesSimple(total, unitPrice),
                extraInvoiceLines: () => ''
            };
            const inputs = {
                dateInput: getDateForInvoiceNo(dateInput),
                invoiceType: document.getElementById('invoiceType').value,
                invoiceNo,
                bankAccount: document.getElementById('bankAccount').value,
                includeSignature: document.getElementById('includeSignature').checked
            };
            generationArgs = { config: customConfig, inputs, originalAmount: totalAmount };
            foundSolutions = customConfig.findQuantities(totalAmount);
            if(foundSolutions && foundSolutions.length > 0){
                currentSolutionIndex = 0;
                renderSellInvoice(foundSolutions[0]);
                success = true;
            }

        } else if (isSupplierMode) {
            // --- SUPPLIER INVOICE LOGIC ---
            const supplierKey = document.getElementById('supplier-select').value;
            const style = document.getElementById('invoice-style').value;
            let supplier;

            if (supplierKey === 'manual_input') {
                const manualName = document.getElementById('supplier-manual-name').value.trim();
                const manualAddress = document.getElementById('supplier-manual-address').value.trim();
                if (!manualName || !manualAddress) {
                    statusDiv.innerHTML = '錯誤：手動輸入模式下，請填寫供應商名稱和地址。';
                    statusDiv.className = 'mt-4 text-center text-red-300 font-semibold';
                    return;
                }
                supplier = {
                    name: manualName,
                    address: manualAddress.replace(/\n/g, '<br>'),
                    currency: 'USD', // Default currency
                    theme: style
                };
            } else {
                supplier = suppliers[supplierKey];
            }
            
            if (!supplier) {
                statusDiv.innerHTML = '錯誤：請選擇或手動輸入一個有效的供應商。';
                statusDiv.className = 'mt-4 text-center text-red-300 font-semibold';
                return;
            }

            const inputs = { dateInput: getDateForInvoiceNo(dateInput), invoiceNo, style, lineType };
            let quantResult = null;

            if (lineType === 'manual') {
                const price = parseFloat(document.getElementById('supplier-manual-price').value);
                const qty = parseInt(document.getElementById('supplier-manual-qty').value, 10);
                const desc = document.getElementById('supplier-manual-desc').value;

                if (isNaN(price) || isNaN(qty) || price <= 0 || qty <= 0 || !desc) {
                    statusDiv.innerHTML = '錯誤：手動輸入模式下，請填寫有效的品項、單價和數量。';
                    statusDiv.className='mt-4 text-center text-red-300 font-semibold';
                    return;
                }
                finalTotal = price * qty;
                quantResult = {
                    products: [{ id: '', desc: desc, price: price }],
                    quantities: { q1: qty }
                };
            } else {
                quantResult = calculateSupplierQuantities(totalAmount, lineType);
            }
            generateSupplierInvoiceHTML(supplier, inputs, finalTotal, quantResult);
            generateSayTotal(finalTotal, supplier.currency);
            success = true;

        } else {
            // --- REGULAR (SELL) INVOICE LOGIC ---
            const companyKey = document.getElementById('company').value;
            const config = companyConfigs[companyKey];
             if (!config) {
                statusDiv.textContent='錯誤：找不到對應的公司設定。';
                statusDiv.className='mt-4 text-center text-red-300 font-semibold';
                return;
            }
            const inputs = {
                dateInput: getDateForInvoiceNo(dateInput),
                invoiceType: document.getElementById('invoiceType').value,
                invoiceNo,
                bankAccount: document.getElementById('bankAccount').value,
                includeSignature: document.getElementById('includeSignature').checked
            };
            generationArgs = { config, inputs, originalAmount: totalAmount };
            foundSolutions = config.findQuantities(totalAmount);
            
            if(foundSolutions && foundSolutions.length > 0){
                currentSolutionIndex = 0;
                renderSellInvoice(foundSolutions[0]);
                success = true;
                if(foundSolutions.length > 1) findNextBtn.classList.remove('hidden');
            }
        }

        // --- Finalize ---
        if (success) {
            if (!statusDiv.innerHTML.includes('注意')) {
               statusDiv.textContent='文件已成功生成！';
               statusDiv.className='mt-4 text-center text-green-300 font-semibold';
            }
            invoiceWrapper.classList.remove('hidden');
            invoiceWrapper.scrollIntoView({ behavior:'smooth' });
        } else {
            if (!statusDiv.innerHTML.includes('注意')) {
                statusDiv.textContent='錯誤：找不到符合條件的數量組合。';
                statusDiv.className='mt-4 text-center text-red-300 font-semibold';
            }
        }
    }, 100);
});

function renderSellInvoice(quantities){
    const { config, inputs, originalAmount } = generationArgs;
    const finalTotalAmount = quantities.adjustedAmount || originalAmount;
    generateSellInvoiceHTML(config, inputs, finalTotalAmount, quantities);
    generateSayTotal(finalTotalAmount, config.currencyCode);
}


// --- UI SETUP & PERSISTENCE ---

function setupFieldInteractions() {
    const customFieldsToggle = document.getElementById('custom-fields-checkbox');
    const customFieldsContainer = document.getElementById('custom-fields-container');
    const regularCompanySelect = document.getElementById('company');
    const supplierContainer = document.getElementById('mode-supplier-toggle').closest('div.mb-4');
    const supplierModeToggle = document.getElementById('mode-supplier-toggle');

    function setElementDisabled(element, isDisabled) {
        if (!element) return;
        element.classList.toggle('opacity-50', isDisabled);
        element.classList.toggle('pointer-events-none', isDisabled);
        
        const inputs = element.querySelectorAll('input, select');
        if(inputs.length > 0) {
            inputs.forEach(input => input.disabled = isDisabled);
        } else {
            element.disabled = isDisabled;
        }
    }

    customFieldsToggle.addEventListener('change', () => {
        const isCustom = customFieldsToggle.checked;
        customFieldsContainer.classList.toggle('hidden', !isCustom);
        setElementDisabled(regularCompanySelect, isCustom);
        setElementDisabled(supplierContainer, isCustom);
        
        if (isCustom && supplierModeToggle.checked) {
            supplierModeToggle.checked = false;
            supplierModeToggle.dispatchEvent(new Event('change'));
        }
        syncInvoiceNoFromDate();
    });

    supplierModeToggle.addEventListener('change', () => {
        const isSupplier = supplierModeToggle.checked;
        const customContainer = customFieldsToggle.closest('.mt-6');
        const supplierControls = document.getElementById('supplier-controls');
        
        setElementDisabled(regularCompanySelect, isSupplier);
        setElementDisabled(customContainer, isSupplier);
        
        if (supplierControls) {
            supplierControls.classList.toggle('hidden', !isSupplier);
        }
        
        if (isSupplier && customFieldsToggle.checked) {
            customFieldsToggle.checked = false;
            customFieldsToggle.dispatchEvent(new Event('change'));
        }
        syncInvoiceNoFromDate();
    });
}


function setupSupplierMode() {
    const supplierSelect = document.getElementById('supplier-select');
    const styleSelect = document.getElementById('invoice-style');
    const lineSelect = document.getElementById('product-line-select');
    const manualInputs = document.getElementById('supplier-manual-inputs');

    // Create and inject manual supplier fields
    const manualInfoContainer = document.createElement('div');
    manualInfoContainer.id = 'supplier-manual-info-fields';
    manualInfoContainer.className = 'hidden mt-2 space-y-2';
    manualInfoContainer.innerHTML = `
        <input type="text" id="supplier-manual-name" placeholder="手動輸入供應商名稱" class="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
        <textarea id="supplier-manual-address" placeholder="手動輸入供應商地址" rows="3" class="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
    `;
    supplierSelect.parentElement.insertAdjacentElement('afterend', manualInfoContainer);
    
    // Populate dropdown
    Object.keys(suppliers).forEach(key => {
        const s = suppliers[key];
        supplierSelect.add(new Option(s.name, key));
    });
    supplierSelect.add(new Option("--- 手動輸入供應商 ---", "manual_input"), 0);


    lineSelect.addEventListener('change', () => {
        const isManual = lineSelect.value === 'manual';
        manualInputs.classList.toggle('hidden', !isManual);
        saveFormData();
    });

    supplierSelect.addEventListener('change', () => {
        const selectedValue = supplierSelect.value;
        manualInfoContainer.classList.toggle('hidden', selectedValue !== 'manual_input');

        if (selectedValue !== 'manual_input') {
            const supplier = suppliers[selectedValue];
            if (supplier) {
                styleSelect.value = supplier.theme;
            }
        }
        saveFormData();
        syncInvoiceNoFromDate();
    });

    styleSelect.addEventListener('change', saveFormData);
}

const Storage = {
    save: (key, value) => { try { localStorage.setItem(`toptec_invoice_${key}`, JSON.stringify(value)); } catch (e) { console.error("Failed to save to localStorage", e); } },
    load: (key) => { try { const v = localStorage.getItem(`toptec_invoice_${key}`); return v ? JSON.parse(v) : null; } catch (e) { return null; } }
};

function saveFormData() {
    const data = {
        // Regular fields
        company: document.getElementById('company').value,
        totalAmount: document.getElementById('totalAmount').value,
        invoiceType: document.getElementById('invoiceType').value,
        bankAccount: document.getElementById('bankAccount').value,
        includeSignature: document.getElementById('includeSignature').checked,
        flexibleQuantity: document.getElementById('flexible-quantity-checkbox').checked,
        date: document.getElementById('date').value,
        invoiceNo: document.getElementById('invoiceNo').value,
        dateAdjustChecked: document.getElementById('date-adjust-checkbox').checked,
        // Supplier mode
        supplierMode: document.getElementById('mode-supplier-toggle').checked,
        selectedSupplier: document.getElementById('supplier-select').value,
        supplierManualName: document.getElementById('supplier-manual-name').value,
        supplierManualAddress: document.getElementById('supplier-manual-address').value,
        productLine: document.getElementById('product-line-select').value,
        invoiceStyle: document.getElementById('invoice-style').value,
        supplierManualDesc: document.getElementById('supplier-manual-desc').value,
        supplierManualPrice: document.getElementById('supplier-manual-price').value,
        supplierManualQty: document.getElementById('supplier-manual-qty').value,
        // Custom Fields
        customFields: document.getElementById('custom-fields-checkbox').checked,
        customCompany: document.getElementById('customCompany').value,
        customItemNo: document.getElementById('customItemNo').value,
        productName: document.getElementById('productName').value,
        unitPrice: document.getElementById('unitPrice').value,
    };
    Storage.save('form_state', data);
}

function loadFormData() {
    const data = Storage.load('form_state');
    if (!data) return;

    const idMap = {
        company: 'company', totalAmount: 'totalAmount', invoiceType: 'invoiceType',
        bankAccount: 'bankAccount', includeSignature: 'includeSignature', flexibleQuantity: 'flexible-quantity-checkbox',
        date: 'date', invoiceNo: 'invoiceNo', dateAdjustChecked: 'date-adjust-checkbox',
        supplierMode: 'mode-supplier-toggle', selectedSupplier: 'supplier-select',
        supplierManualName: 'supplier-manual-name', supplierManualAddress: 'supplier-manual-address',
        productLine: 'product-line-select', invoiceStyle: 'invoice-style',
        supplierManualDesc: 'supplier-manual-desc', supplierManualPrice: 'supplier-manual-price', supplierManualQty: 'supplier-manual-qty',
        customFields: 'custom-fields-checkbox', customCompany: 'customCompany',
        customItemNo: 'customItemNo', productName: 'productName', unitPrice: 'unitPrice'
    };

    Object.keys(idMap).forEach(key => {
        const elementId = idMap[key];
        const el = document.getElementById(elementId);
        if (el && data[key] !== undefined) {
             if (el.type === 'checkbox') el.checked = data[key];
             else el.value = data[key];
        }
    });
}

// --- INITIALIZATION ---
window.addEventListener('DOMContentLoaded', () => {
    document.getElementById('date').addEventListener('input', syncInvoiceNoFromDate);
    document.getElementById('date-adjust-checkbox').addEventListener('change', syncInvoiceNoFromDate);
    document.getElementById('printBtn').addEventListener('click', () => window.print());
    document.getElementById('packingListBtn').addEventListener('click', ()=>{/* placeholder for original func */});
    document.getElementById('findNextBtn').addEventListener('click', ()=>{
        if(foundSolutions.length === 0) return;
        currentSolutionIndex = (currentSolutionIndex + 1) % foundSolutions.length;
        renderSellInvoice(foundSolutions[currentSolutionIndex]);
    });
    
    document.querySelectorAll('input, select').forEach(el => {
        el.addEventListener('change', saveFormData);
        el.addEventListener('input', (e) => {
            // Avoid saving on every character input for performance, only on blur/change
            if(e.type !== 'input') saveFormData();
        });
    });
    
    setupSupplierMode();
    setupFieldInteractions(); 
    
    loadFormData();
    
    // Trigger events to apply loaded state correctly
    document.getElementById('mode-supplier-toggle').dispatchEvent(new Event('change'));
    document.getElementById('custom-fields-checkbox').dispatchEvent(new Event('change'));
    document.getElementById('product-line-select').dispatchEvent(new Event('change'));
    document.getElementById('supplier-select').dispatchEvent(new Event('change'));
    syncInvoiceNoFromDate();
});