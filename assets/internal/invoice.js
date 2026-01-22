
    // --- GLOBAL STATE ---
    let currentInvoiceData = {};
    let generationArgs = {};
    let foundSolutions = [];
    let currentSolutionIndex = 0;

    // --- COMPANY & PRICE CONFIGS ---
const TOPTEC_GLOBAL = {
  name: "TOPTEC GLOBAL PTE. LTD.",
  address: "60 Paya Lebar Road, #07-42 Paya Lebar Square\nSingapore 409051",
  tel: "+65 8965 6938",
  email: "sales@toptec.com.sg",
  uen: "201932202N",
  country: "SINGAPORE"
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
        type: 'sell', name: "WIN TEAM CO.,LTD.", address: "NO.117,KANGLE ST.,NEIHU DIST., Taipei City ,114038,Taiwan (R.O.C.)", tel: "886-2-26339869", country: "TAIWAN", priceTerm: "FOB TAIPEI", paymentTerms: "T/T", currencySymbol: 'US$', currencyCode: 'USD',
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

function buildInvoiceNoFromDate(yyyymmdd){
  if(!/^\d{8}$/.test(yyyymmdd)) return '';
  return `TOP${yyyymmdd}001`;
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
    invoiceField.value = buildInvoiceNoFromDate(adjustedDate);
  }
}

    // ---- JC 美觀排序（僅套用 JC 系列） ----
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

    // 基礎排序(非 JC)：先看 roundness，再看標準差（小→大）
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
      // 只要產品 id 以 "JC-" 開頭就視為 JC 系列（至少一個即可）
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

    // ---- 求解器們 ----
function findQuantitiesAnXinUSD(totalAmount) {
      const companyKey = document.getElementById('company').value;
      const config = companyConfigs[companyKey];
      const prices = config.products.map(p=>p.price);
      const useFlexibleUnits = document.getElementById('flexible-quantity-checkbox').checked;
      const MAX_SOLUTIONS_PER_UNIT = 220;
      const SINGLE_UNIT_THRESHOLD = 20000;
      const CLAMP_Q1_FOR_UNIT1 = 15000;

      const solveByUnit = (amount, unit) => {
        let solutions = [];
        const diffLimit = unit >= 1000 ? 10 : (unit >= 100 ? 100 : 1000);
        const p_unit = { p1: prices[0]*unit, p2: prices[1]*unit, p3: prices[2]*unit };
        const minQtyUnit = unit >= 1000 ? 1 : (unit >= 100 ? 10 : (unit >= 10 ? 10 : 1));
        let maxQ1 = Math.floor(amount / (prices[0]*unit));
        if(unit === 1 && maxQ1 > CLAMP_Q1_FOR_UNIT1){ maxQ1 = CLAMP_Q1_FOR_UNIT1; }
        let iterations = 0; const ITERATION_CAP = unit === 1 ? 450000 : 900000;
        for(let q1=maxQ1; q1>=minQtyUnit; q1--){
          const maxQ2 = Math.min(q1, Math.floor((amount - q1*p_unit.p1)/p_unit.p2));
          for(let q2=maxQ2; q2>=minQtyUnit; q2--){
            iterations++; if(iterations>ITERATION_CAP) return solutions;
            const remainder = amount - (q1*p_unit.p1) - (q2*p_unit.p2);
            const q3c = remainder / p_unit.p3;
            if(q3c>0 && Math.abs(q3c - Math.round(q3c)) < 0.001){
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
          if(all.length===0 && Math.abs((amount % 1000) - 500) < 0.01) all = all.concat(solveByUnit(amount, 100));
          if(all.length<5) all = all.concat(solveByUnit(amount, 10));
          all = dedup(all);
        }
        return all.slice(0, MAX_SOLUTIONS_PER_UNIT);
      };

      let solutions = solveForAmount(totalAmount);
      if(solutions && solutions.length>0){
        return scoreAndSortSolutionsForConfig(config, solutions, totalAmount);
      }

      // 向上微調尋找
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
      const prices = config.products; const p1=prices[0].price, p2=prices[1].price, p3=prices[2].price;
      const p1_c=p1*100, p2_c=p2*100, p3_c=p3*100; const sum_p_c=p1_c+p2_c+p3_c; const p2p3_c=p2_c+p3_c;
      const searchLimit=Math.min(1400, Math.max(600, Math.ceil(totalAmount/50))); const solutionsLimit = 220;
      let solutions=[]; const seen=new Set();
      for(let d1=0; d1<=searchLimit; d1++){
        for(let d2=1; d2<=searchLimit; d2++){
          const numerator = (totalAmount*100) + (p2p3_c*d1) + (p3_c*d2);
          if(numerator>0 && numerator % sum_p_c === 0){
            const q1 = numerator / sum_p_c; const q2 = q1 - d1; const q3 = q2 - d2;
            if(q1>0 && q2>0 && q3>0 && Number.isInteger(q1) && Number.isInteger(q2) && Number.isInteger(q3)){
              const key=`${q1}-${q2}-${q3}`; if(!seen.has(key)){ solutions.push({q1,q2,q3}); seen.add(key);} }
          }
          if(solutions.length>=solutionsLimit) break;
        }
        if(solutions.length>=solutionsLimit) break;
      }
      return scoreAndSortSolutionsForConfig(config, solutions, totalAmount);
    }

    function findQuantitiesWinTeam(totalAmount){
      const config = companyConfigs.winteam;
      const prices = config.products.map(p=>p.price);
      const [p1,p2,p3] = prices; const gcd=600; let solutions=[]; const seen=new Set();
      let adjustedAmount = totalAmount; if(totalAmount % gcd !== 0){ adjustedAmount = totalAmount - (totalAmount % gcd) + gcd; }
      const p_set = p1 + p2; const max_sets = Math.floor(adjustedAmount / p_set);
      const meetsRatio = (machines, accessories) => machines > 0 && accessories >= machines * 6;
      const hasCoreProducts = (machines, fryers) => machines > 0 && fryers > 0;
      for(let q_set = max_sets; q_set>0; q_set--){
        const rem = adjustedAmount - (q_set*p_set); if(rem>=0 && rem%p3===0){
          const q3 = rem / p3; if(!meetsRatio(q_set, q3)) continue;
          const sol={q1:q_set, q2:q_set, q3}; const key=`${sol.q1}-${sol.q2}-${sol.q3}`; if(!seen.has(key)){ solutions.push(sol); seen.add(key);} }
      }
      const maxQ1 = Math.floor(adjustedAmount / p1);
      for(let q1=maxQ1; q1>=0; q1--){
        const r1 = adjustedAmount - (q1*p1); const maxQ2 = Math.floor(r1/p2);
        for(let q2=maxQ2; q2>=0; q2--){ const r2 = r1 - (q2*p2); if(r2>=0 && r2%p3===0){ const q3=r2/p3; if(q1===0&&q2===0&&q3===0) continue; if(!hasCoreProducts(q1,q2)) continue; if(!meetsRatio(q1, q3)) continue; const sol={q1,q2,q3}; const key=`${sol.q1}-${sol.q2}-${sol.q3}`; if(!seen.has(key)){ solutions.push(sol); seen.add(key);} } }
      }
      if(solutions.length>0 && totalAmount!==adjustedAmount){
        const statusDiv=document.getElementById('status');
        statusDiv.innerHTML = `<span class="font-bold">注意：</span>您輸入的金額 ${totalAmount.toLocaleString()} 無法整除。<br>已自動<span class="font-bold">向上調整</span>為最接近的有效金額 <span class="font-bold">${adjustedAmount.toLocaleString()}</span> 並生成發票。`;
        statusDiv.className='mt-4 text-center text-orange-200 font-semibold';
        solutions.forEach(s=> s.adjustedAmount = adjustedAmount);
      }
      // 非 JC，採用 basic 排序
      return scoreAndSortSolutionsForConfig(config, solutions, adjustedAmount);
    }

    function findQuantitiesStyleUp(totalAmount){
      const companyKey = document.getElementById('company').value;
      const config = companyConfigs[companyKey];
      const prices = config.products.map(p=>p.price);
      const priceSum = prices[0]+prices[1]+prices[2];
      let solutions=[];
      if(totalAmount>0 && totalAmount % priceSum === 0){ const q = totalAmount / priceSum; if(q>0) solutions.push({q1:q, q2:q, q3:q}); }
      return scoreAndSortSolutionsForConfig(config, solutions, totalAmount);
    }

    // ---- 格式化 ----
    function formatDate(yyyymmdd){ if(!yyyymmdd||yyyymmdd.length!==8) return ''; const y=yyyymmdd.substring(0,4); const m=yyyymmdd.substring(4,6); const d=yyyymmdd.substring(6,8); const date=new Date(`${y}-${m}-${d}T00:00:00Z`); const monthNames=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]; return `${monthNames[date.getUTCMonth()]}.${d}.${y}`; }
    function formatCurrency(num, symbol='US$'){ return `${symbol}${num.toLocaleString('en-US',{minimumFractionDigits:2, maximumFractionDigits:2})}`; }
    function numberToCurrency(num){ return num.toLocaleString('en-US',{minimumFractionDigits:2, maximumFractionDigits:2}); }

function generateInvoiceHTML(config, inputs, totalAmount, quantities){
  const { dateInput, invoiceType, invoiceNo } = inputs;
  const formattedDate = formatDate(dateInput);
  const isBuyInvoice = config.type === 'buy';
  const seller = isBuyInvoice ? { name: config.name, address: config.address, tel: config.tel } : TOPTEC_GLOBAL;
  const buyer  = isBuyInvoice ? TOPTEC_GLOBAL : { name: config.name, address: config.address, tel: config.tel };
  const sellerLogoHTML = isBuyInvoice
    ? `<div class="text-left font-bold text-lg">${seller.name}</div>`
    : `<img src="../assets/img/toptec-logo.svg" alt="TOPTEC logo" class="invoice-logo">`;

      let tableRows='';
      if(quantities && Object.keys(quantities).length>0){
        tableRows = config.products.map((p,i)=>{
          const qty = quantities[`q${i+1}`]; if(!qty||qty===0) return '';
          const unitPrice = (config.name.startsWith("Converge")) ? totalAmount : p.price; // Converge 特案
          const amount = qty * unitPrice;
          return `
            <tr><td>${p.id}</td><td>${qty.toLocaleString()}</td><td>${numberToCurrency(unitPrice)}</td><td>${numberToCurrency(amount)}</td></tr>
            ${p.desc ? `<tr><td class="text-left pl-4">${p.desc}</td><td></td><td></td><td></td></tr>` : ''}
          `;
        }).join('');
  }

  const headerDetailsHTML = config.country.trim() || config.paymentTerms.trim() ? `
    <div class="invoice-terms">
      <div class="flex justify-between">
        ${config.country.trim()? `<p class="w-1/2"><strong>Country of Origin:</strong> ${config.country}</p>` : '<p class="w-1/2"></p>'}
        ${config.paymentTerms.trim()? `<p class="w-1/2"><strong>Payment Terms:</strong> ${config.paymentTerms}</p>` : '<p class="w-1/2"></p>'}
      </div>
    </div>
  ` : '';

      const scoresHTML = '';

      const invoiceHTML = `
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
      <div class="w-2/3 buyer-card">
        <p><strong>BUYER:</strong> ${buyer.name}</p>
        <p><strong>BUYER ADD:</strong> ${buyer.address.replace(/\n/g,'<br>')}</p>
        <p><strong>TEL:</strong> ${buyer.tel}</p>
      </div>
      <div class="w-1/3 text-left invoice-card">
        <p><strong>INV.No.:</strong> <span id="inv-no">${invoiceNo}</span></p>
        <p><strong>Date:</strong> ${formattedDate}</p>
        ${scoresHTML}
      </div>
    </div>
    ${headerDetailsHTML}
    <table class="w-full invoice-table invoice-body-table mb-3">
      <thead>
        <tr class="font-bold"><td class="w-1/4">ITEM NO.</td><td class="w-1/4">Q'TY</td><td class="w-1/4">UNIT PRC</td><td class="w-1/4">TTL AMT</td></tr>
        <tr class="font-bold"><td></td><td>PCS</td><td>${config.currencyCode}/PCS</td><td>${config.currencyCode}</td></tr>
      </thead>
      <tbody>${tableRows}</tbody>
    </table>
    <div class="flex justify-end mt-6 invoice-summary">
      <div class="w-2/5 summary-card">
        <div class="flex justify-between"><strong>SAY TOTAL:</strong><strong id="say-total-amount" class="text-right flex-1 ml-2"></strong></div>
        <div class="flex justify-between border-t border-black pt-1 mt-2"><strong>TOTAL:</strong><strong>${formatCurrency(totalAmount, config.currencySymbol)}</strong></div>
      </div>
    </div>
    <div class="flex justify-end" style="margin-top:60px;"><div class="w-1/3 text-center"><div class="border-t border-black pt-1">AUTHORIZED SIGNATURE</div></div></div>
  `;
      document.getElementById('invoice-preview').innerHTML = invoiceHTML;
    }

    // 金額英文
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
      let result=currencyName+' '+words.trim(); if(fractionalPart>0){ if(integerPart>0){ result+=' AND '+String(fractionalPart).padStart(2,'0')+'/100'; } else { result=currencyName+' '+String(fractionalPart).padStart(2,'0')+'/100'; } }
      result+=' ONLY'; return result.replace(/\s\s+/g,' ').trim().toUpperCase();
    }
    function generateSayTotal(amount, currencyCode){ const el=document.getElementById('say-total-amount'); if(!el) return; const txt=numberToWords(amount, currencyCode); el.textContent = txt || 'Could not generate.'; }

    // Packing List (estimated values)
    function showModal(id, content){ const m=document.getElementById(id); m.innerHTML=content; m.classList.remove('hidden'); }
    function closeModal(id){ document.getElementById(id).classList.add('hidden'); document.body.classList.remove('print-packing'); }
    function formatAddressHTML(address){
      if(!address) return '';
      return address.split('\n').map(line=>line.trim()).filter(Boolean).join('<br>');
    }
    function formatPackingValue(value, fallback='--'){
      const text = value === undefined || value === null ? '' : String(value).trim();
      return text ? text : fallback;
    }
    function buildPartyHTML(party){
      if(!party) return '';
      const lines = [];
      if(party.name) lines.push(`<strong>${party.name}</strong>`);
      const address = formatAddressHTML(party.address);
      if(address) lines.push(address);
      if(party.tel) lines.push(`Tel: ${party.tel}`);
      if(party.email) lines.push(`Email: ${party.email}`);
      return lines.join('<br>');
    }
    function printPackingList(){
      document.body.classList.add('print-packing');
      window.print();
    }
    window.addEventListener('afterprint', ()=> document.body.classList.remove('print-packing'));
    function generatePackingList(){
      const modalId='packingListModal';
      showModal(modalId, `<div class="modal-content"><h2 class="text-xl font-bold mb-4">Generating packing list...</h2><div class="flex justify-center items-center h-24"><div class="loader"></div></div></div>`);
      const { config, inputs } = generationArgs;
      if(!config || !inputs){
        showModal(modalId, `<div class="modal-content"><div class="flex justify-between items-center mb-4"><h2 class="text-xl font-bold">Packing List</h2><button onclick="closeModal('${modalId}')" class="text-gray-500 hover:text-gray-800 font-bold text-2xl">X</button></div><p class="text-sm">Please generate the invoice before creating the packing list.</p></div>`);
        return;
      }
      const isBuyInvoice = config.type === 'buy';
      const seller = isBuyInvoice ? { name: config.name, address: config.address, tel: config.tel } : TOPTEC_GLOBAL;
      const buyer = isBuyInvoice ? TOPTEC_GLOBAL : { name: config.name, address: config.address, tel: config.tel };
      const invoiceNo = (inputs.invoiceNo || currentInvoiceData.invoiceNo || '').trim();
      const invoiceDate = inputs.dateInput ? formatDate(inputs.dateInput) : (currentInvoiceData.date || '');
      const packingListNo = invoiceNo ? `${invoiceNo}-PL` : '';
      const originCountry = formatPackingValue(isBuyInvoice ? config.country : TOPTEC_GLOBAL.country);
      const destinationCountry = formatPackingValue(isBuyInvoice ? TOPTEC_GLOBAL.country : config.country);
      const priceTerm = formatPackingValue(config.priceTerm);
      const paymentTerms = formatPackingValue(config.paymentTerms);
      const currencyCode = formatPackingValue(config.currencyCode);
      const items = (currentInvoiceData.items||[]).filter(x=>x && x.qty>0);
      const DEFAULT_EST = { pcs_per_carton: 1000, net_weight_per_pc_kg: 0.085, packaging_weight_per_carton_kg: 2.0, volume_per_carton_cbm: 0.06 };
      const lookupProduct = (id)=> (config.products || []).find(p=>p.id === id) || {};
      let rows=[], sum={ total_cartons:0, total_quantity:0, total_net_weight:0, total_gross_weight:0, total_volume:0 };
      items.forEach(it=>{
        const product = lookupProduct(it.id);
        const est = product.est || DEFAULT_EST;
        const q = it.qty;
        const isService = est.net_weight_per_pc_kg === 0;
        const cartons = isService ? 0 : Math.ceil(q/est.pcs_per_carton);
        const nw = q*est.net_weight_per_pc_kg;
        const gw = nw + cartons*est.packaging_weight_per_carton_kg;
        const vol = cartons*est.volume_per_carton_cbm;
        const description = (product.desc || it.desc || it.id || '').trim();
        rows.push({ item_no: it.id, description, cartons, total_quantity: q, net_weight_kgs: nw, gross_weight_kgs: gw, volume_cbm: vol });
        sum.total_cartons += cartons;
        sum.total_quantity += q;
        sum.total_net_weight += nw;
        sum.total_gross_weight += gw;
        sum.total_volume += vol;
      });
      const sellerLines = buildPartyHTML(seller);
      const buyerLines = buildPartyHTML(buyer);
      const headerDetails = [
        formatAddressHTML(seller.address),
        seller.tel ? `Tel: ${seller.tel}` : '',
        seller.email ? `Email: ${seller.email}` : '',
        !isBuyInvoice && TOPTEC_GLOBAL.uen ? `UEN: ${TOPTEC_GLOBAL.uen}` : ''
      ].filter(Boolean).join('<br>');
      setTimeout(()=>{
        const body = rows.map(r=>`<tr><td>${r.item_no}</td><td class="packing-desc">${r.description}</td><td>${r.cartons}</td><td>${r.total_quantity.toLocaleString()}</td><td>${r.net_weight_kgs.toFixed(2)}</td><td>${r.gross_weight_kgs.toFixed(2)}</td><td>${r.volume_cbm.toFixed(3)}</td></tr>`).join('');
        const totalRow = `<tr class="packing-total-row"><td colspan="2">TOTAL</td><td>${sum.total_cartons}</td><td>${sum.total_quantity.toLocaleString()}</td><td>${sum.total_net_weight.toFixed(2)}</td><td>${sum.total_gross_weight.toFixed(2)}</td><td>${sum.total_volume.toFixed(3)}</td></tr>`;
        const packingHTML = `
          <div class="modal-content packing-modal">
            <div class="packing-actions no-print">
              <button onclick="printPackingList()" class="rounded-md border border-slate-300 bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800">Print / Export PDF</button>
              <button onclick="closeModal('${modalId}')" class="rounded-md border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">Close</button>
            </div>
            <div class="packing-sheet">
              <div class="packing-header">
                <div class="packing-brand">
                  ${isBuyInvoice ? '' : '<img src="../assets/img/toptec-logo.svg" alt="TOPTEC logo" class="packing-logo">'}
                  <div>
                    <div class="packing-company-name">${seller.name || ''}</div>
                    <div class="packing-company-details">${headerDetails || ''}</div>
                  </div>
                </div>
                <div class="packing-doc">
                  <div class="packing-title">PACKING LIST</div>
                  <table class="packing-meta">
                    <tr><td>PACKING LIST NO.</td><td>${formatPackingValue(packingListNo)}</td></tr>
                    <tr><td>INVOICE NO.</td><td>${formatPackingValue(invoiceNo)}</td></tr>
                    <tr><td>INVOICE DATE</td><td>${formatPackingValue(invoiceDate)}</td></tr>
                    <tr><td>CURRENCY</td><td>${currencyCode}</td></tr>
                    <tr><td>PAYMENT TERMS</td><td>${paymentTerms}</td></tr>
                    <tr><td>PRICE TERM</td><td>${priceTerm}</td></tr>
                  </table>
                </div>
              </div>

              <div class="packing-parties">
                <div class="packing-party">
                  <div class="packing-party-title">SHIPPER / EXPORTER</div>
                  <div class="packing-party-body">${sellerLines}</div>
                </div>
                <div class="packing-party">
                  <div class="packing-party-title">CONSIGNEE</div>
                  <div class="packing-party-body">${buyerLines}</div>
                </div>
              </div>

              <div class="overflow-x-auto">
                <table class="w-full packing-table">
                  <thead>
                    <tr>
                      <th>ITEM NO.</th>
                      <th>DESCRIPTION</th>
                      <th>CTN</th>
                      <th>QTY (PCS)</th>
                      <th>NET WT (KGS)</th>
                      <th>GROSS WT (KGS)</th>
                      <th>MEAS (CBM)</th>
                    </tr>
                  </thead>
                  <tbody>${body}${totalRow}</tbody>
                </table>
              </div>

              <div class="packing-summary">
                <table class="packing-summary-table">
                  <tr><td>TOTAL CARTONS</td><td>${sum.total_cartons}</td></tr>
                  <tr><td>TOTAL QTY (PCS)</td><td>${sum.total_quantity.toLocaleString()}</td></tr>
                  <tr><td>TOTAL NET WT (KGS)</td><td>${sum.total_net_weight.toFixed(2)}</td></tr>
                  <tr><td>TOTAL GROSS WT (KGS)</td><td>${sum.total_gross_weight.toFixed(2)}</td></tr>
                  <tr><td>TOTAL MEAS (CBM)</td><td>${sum.total_volume.toFixed(3)}</td></tr>
                </table>
              </div>

              <div class="packing-signature">
                <div class="signature-line">AUTHORIZED SIGNATURE</div>
              </div>
            </div>
          </div>`;
        showModal(modalId, packingHTML);
      }, 120);
    }

// --- MAIN RENDER ---
    function renderInvoice(quantities){
      const { config, inputs, originalAmount } = generationArgs;
      const finalTotalAmount = quantities.adjustedAmount || originalAmount;
      generateInvoiceHTML(config, inputs, finalTotalAmount, quantities);
      generateSayTotal(finalTotalAmount, config.currencyCode);
      const buyerForData = config.type === 'buy' ? TOPTEC_GLOBAL.name : config.name;
      currentInvoiceData = {
        date: formatDate(inputs.dateInput), invoiceNo: inputs.invoiceNo, totalAmount: formatCurrency(finalTotalAmount, config.currencySymbol), buyer: buyerForData,
        items: config.products.map((p,i)=> ({ id:p.id, desc: p.desc || '', qty: quantities[`q${i+1}`] }))
      };
    }

    // --- EVENTS ---
    document.getElementById('company').addEventListener('change', (e)=>{
      const key = e.target.value; const cfg = companyConfigs[key];
      const isJC = isJCConfig(cfg);
      const flexBox = document.getElementById('flexible-quantity-container');
      const flexCb  = document.getElementById('flexible-quantity-checkbox');
      if(isJC){ flexBox.classList.remove('hidden'); flexCb.checked = true; }
      else { flexBox.classList.add('hidden'); flexCb.checked = false; }
    });

    document.getElementById('date').addEventListener('input', syncInvoiceNoFromDate);
    document.getElementById('date-adjust-checkbox').addEventListener('change', syncInvoiceNoFromDate);

    // 初始觸發一次
  document.getElementById('company').dispatchEvent(new Event('change'));
  syncInvoiceNoFromDate();

  document.getElementById('generateBtn').addEventListener('click', ()=>{
    const useCustomFields = document.getElementById('custom-fields-checkbox').checked;
    const statusDiv = document.getElementById('status');
    const invoiceWrapper = document.getElementById('invoice-wrapper');
    const findNextBtn = document.getElementById('findNextBtn');
    statusDiv.innerHTML='';
    invoiceWrapper.classList.add('hidden');
    findNextBtn.classList.add('hidden');

    let config;
    let totalAmount = parseFloat(document.getElementById('totalAmount').value);
    let findQuantitiesFunc;

    if (useCustomFields) {
        const customCompanyName = document.getElementById('customCompany').value;
        const productName = document.getElementById('productName').value;
        const unitPrice = parseFloat(document.getElementById('unitPrice').value);
        const itemNo = document.getElementById('customItemNo') ? document.getElementById('customItemNo').value : 'CUSTOM-001';

        if (!customCompanyName || !productName || isNaN(unitPrice) || unitPrice <= 0 || isNaN(totalAmount) || totalAmount <= 0) {
            statusDiv.innerHTML = '錯誤：<br>請填寫所有自定義欄位，並確保單價和總金額為正數。';
            statusDiv.className='mt-4 text-center text-red-300 font-semibold';
            return;
        }

        config = {
            type: 'sell',
            name: customCompanyName,
            address: " ",
            tel: " ",
            country: " ",
            priceTerm: " ",
            paymentTerms: "T/T",
            currencySymbol: 'US$',
            currencyCode: 'USD',
            products: [
                { id: itemNo, desc: productName, price: unitPrice }
            ],
            extraInvoiceLines: () => '',
        };

        findQuantitiesFunc = (total) => {
            if (unitPrice > 0) {
                // 處理精度問題，使用四捨五入到整數
                const quantity = Math.round(total / unitPrice);
                const calculatedTotal = parseFloat((quantity * unitPrice).toFixed(2));
                
                if (Math.abs(calculatedTotal - total) > 0.01) {
                    return []; // 無法整除
                }
                return [{ q1: quantity }];
            }
            return [];
        };
        config.findQuantities = findQuantitiesFunc;

    } else {
        const companyKey = document.getElementById('company').value;
        config = companyConfigs[companyKey];
        findQuantitiesFunc = config.findQuantities;
    }

    const dateInput = document.getElementById('date').value;
    const invoiceType = document.getElementById('invoiceType').value;
    const invoiceField = document.getElementById('invoiceNo');
    const rawInvoiceNo = invoiceField.value.trim();

    let errors=[];
    if(!/^\d{8}$/.test(dateInput)) errors.push('日期格式不正確 (需為 YYYYMMDD)。');
    if(isNaN(totalAmount) || totalAmount<=0) errors.push('總金額必須是有效的正數。');

    const finalDateInput = getDateForInvoiceNo(dateInput) || dateInput;
    const autoInvoiceNo = buildInvoiceNoFromDate(finalDateInput);
    let invoiceNo = rawInvoiceNo || autoInvoiceNo;
    if(!invoiceNo) errors.push('發票號碼為必填項。');

    if(errors.length>0){
        statusDiv.innerHTML = '錯誤：<br>'+errors.join('<br>');
        statusDiv.className='mt-4 text-center text-red-300 font-semibold';
        return;
    }
    invoiceField.value = invoiceNo;

    statusDiv.textContent='請稍候，正在計算並生成文件...';
    statusDiv.className='mt-4 text-center text-blue-200 font-semibold animate-pulse';

    setTimeout(()=>{
        const inputs = { dateInput: finalDateInput, invoiceType, invoiceNo };
        generationArgs = { config, inputs, originalAmount: totalAmount };
        foundSolutions = findQuantitiesFunc(totalAmount);
        if(!foundSolutions || foundSolutions.length===0){
            statusDiv.textContent='錯誤：找不到符合條件的數量組合，請檢查總金額。';
            if (useCustomFields) {
                 statusDiv.textContent='錯誤：無法從總金額和單價計算出數量。請檢查輸入。';
            }
            statusDiv.className='mt-4 text-center text-red-300 font-semibold';
            return;
        }
        currentSolutionIndex = 0;
        renderInvoice(foundSolutions[currentSolutionIndex]);
        if(!statusDiv.innerHTML.includes('注意')){
            statusDiv.textContent='文件已成功生成！';
            statusDiv.className='mt-4 text-center text-green-300 font-semibold';
        }
        if(foundSolutions.length>1){
            findNextBtn.classList.remove('hidden');
        }
        invoiceWrapper.classList.remove('hidden');
        invoiceWrapper.scrollIntoView({ behavior:'smooth' });
    }, 100);
  });

    document.getElementById('findNextBtn').addEventListener('click', ()=>{
      if(foundSolutions.length===0) return; currentSolutionIndex = (currentSolutionIndex + 1) % foundSolutions.length; renderInvoice(foundSolutions[currentSolutionIndex]);
    });

    document.getElementById('printBtn').addEventListener('click', ()=> window.print());
    document.getElementById('packingListBtn').addEventListener('click', generatePackingList);

// --- Storage Utility ---
const Storage = {
    save: (key, value) => {
        try { localStorage.setItem(`toptec_invoice_${key}`, JSON.stringify(value)); } catch (e) { console.error('Error saving to localStorage', e); }
    },
    load: (key) => {
        try {
            const val = localStorage.getItem(`toptec_invoice_${key}`);
            return val ? JSON.parse(val) : null;
        } catch (e) { console.error('Error loading from localStorage', e); return null; }
    }
};

function saveFormData() {
    const data = {
        company: document.getElementById('company').value,
        date: document.getElementById('date').value,
        totalAmount: document.getElementById('totalAmount').value,
        invoiceType: document.getElementById('invoiceType').value,
        invoiceNo: document.getElementById('invoiceNo').value,
        customFieldsChecked: document.getElementById('custom-fields-checkbox').checked,
        customCompany: document.getElementById('customCompany').value,
        customItemNo: document.getElementById('customItemNo').value,
        productName: document.getElementById('productName').value,
        unitPrice: document.getElementById('unitPrice').value,
        dateAdjustChecked: document.getElementById('date-adjust-checkbox').checked
    };
    Storage.save('form_state', data);
}

function loadFormData() {
    const data = Storage.load('form_state');
    if (!data) return;
    if (data.company) document.getElementById('company').value = data.company;
    if (data.date) document.getElementById('date').value = data.date;
    if (data.totalAmount) document.getElementById('totalAmount').value = data.totalAmount;
    if (data.invoiceType) document.getElementById('invoiceType').value = data.invoiceType;
    if (data.invoiceNo) document.getElementById('invoiceNo').value = data.invoiceNo;
    if (data.customCompany) document.getElementById('customCompany').value = data.customCompany;
    if (data.customItemNo) document.getElementById('customItemNo').value = data.customItemNo;
    if (data.productName) document.getElementById('productName').value = data.productName;
    if (data.unitPrice) document.getElementById('unitPrice').value = data.unitPrice;
    
    if (data.customFieldsChecked !== undefined) {
        const cb = document.getElementById('custom-fields-checkbox');
        cb.checked = data.customFieldsChecked;
        cb.dispatchEvent(new Event('change'));
    }
    if (data.dateAdjustChecked !== undefined) {
        document.getElementById('date-adjust-checkbox').checked = data.dateAdjustChecked;
    }
    document.getElementById('company').dispatchEvent(new Event('change'));
}

// --- Custom Fields Logic ---
const customFieldsCheckbox = document.getElementById('custom-fields-checkbox');
const customFieldsContainer = document.getElementById('custom-fields-container');
const companyDropdown = document.getElementById('company');

if (customFieldsCheckbox && customFieldsContainer && companyDropdown) {
  customFieldsCheckbox.addEventListener('change', () => {
    if (customFieldsCheckbox.checked) {
      customFieldsContainer.classList.remove('hidden');
      companyDropdown.disabled = true;
      companyDropdown.classList.add('bg-slate-800', 'text-slate-500');
    } else {
      customFieldsContainer.classList.add('hidden');
      companyDropdown.disabled = false;
      companyDropdown.classList.remove('bg-slate-800', 'text-slate-500');
    }
    saveFormData();
  });
}

// Attach change listeners to all inputs for auto-save
['company', 'date', 'totalAmount', 'invoiceType', 'invoiceNo', 'customCompany', 'customItemNo', 'productName', 'unitPrice', 'date-adjust-checkbox'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('change', saveFormData);
});

// Load on init
window.addEventListener('DOMContentLoaded', loadFormData);
