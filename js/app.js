'use strict';
(() => {
  const recipes = window.GG_RECIPES || [];
  const byId = new Map(recipes.map(recipe => [recipe.id, recipe]));
  const key = 'gather-and-grace-state-v1';
  const defaults = { guests:12, selected:[], pantry:[], unitMode:'us', planner:[] };
  const knownIngredients = new Set(recipes.flatMap(recipe => recipe.ingredients.map(ingredient => ingredient[0])));
  let state = {...defaults};
  try {
    const saved = JSON.parse(localStorage.getItem(key) || '{}');
    state.guests = Number.isInteger(saved.guests) ? Math.max(1,Math.min(40,saved.guests)) : 12;
    state.selected = Array.isArray(saved.selected) ? saved.selected.filter(id => byId.has(id)) : [];
    state.pantry = Array.isArray(saved.pantry) ? saved.pantry.filter(id => knownIngredients.has(id)) : [];
    state.unitMode = saved.unitMode === 'metric' ? 'metric' : 'us';
    state.planner = Array.isArray(saved.planner) ? saved.planner.filter(id => /^task-\d+$/.test(id)) : [];
  } catch (_) { /* Local storage may be disabled or reset. */ }
  const qs = (selector, context=document) => context.querySelector(selector);
  const qsa = (selector, context=document) => [...context.querySelectorAll(selector)];
  const setText = (selector, value, context=document) => { const el=qs(selector,context); if(el) el.textContent=value; };
  const names = {main:'Main dish',side:'Side dish',sauce:'Sauces & condiments',dessert:'Dessert'};
  const diets = {'gluten-free':'Gluten-free','dairy-free':'Dairy-free','nut-free':'Nut-free'};
  function save() { try {localStorage.setItem(key,JSON.stringify(state));} catch (_) {} }
  function setGuests(value) {
    const number = Number(value);
    if (!Number.isFinite(number)) return;
    state.guests=Math.max(1,Math.min(40,Math.round(number)));
    save(); refreshShared();
  }
  function word(amount,singular,plural) { return `${amount} ${Math.abs(amount-1)<1e-8 ? singular : (plural || singular+'s')}`; }
  function amountLabel(number) {
    if(!Number.isFinite(number)) return '—';
    const sign=number<0?'-':'';
    const n=Math.abs(number); const whole=Math.floor(n+1e-8); const remainder=n-whole;
    if(remainder < 0.025) return sign+String(whole);
    if(1-remainder < 0.025) return sign+String(whole+1);
    for(const denominator of [2,3,4,8,16]) {
      const numerator=Math.round(remainder*denominator);
      if(numerator>0 && numerator<denominator && Math.abs(numerator/denominator-remainder)<0.012) {
        return sign+(whole ? whole+' ' : '')+numerator+'/'+denominator;
      }
    }
    return sign+String(Number(n.toFixed(2)));
  }
  const units = {
    tsp:{type:'volume',factor:1,singular:'tsp',plural:'tsp'},
    tbsp:{type:'volume',factor:3,singular:'tbsp',plural:'tbsp'},
    cup:{type:'volume',factor:48,singular:'cup',plural:'cups'},
    'fl oz':{type:'volume',factor:6,singular:'fl oz',plural:'fl oz'},
    mL:{type:'volume',factor:48/236.588,singular:'mL',plural:'mL'},
    L:{type:'volume',factor:48/0.236588,singular:'L',plural:'L'},
    g:{type:'weight',factor:1,singular:'g',plural:'g'},
    kg:{type:'weight',factor:1000,singular:'kg',plural:'kg'},
    oz:{type:'weight',factor:28.349523125,singular:'oz',plural:'oz'},
    lb:{type:'weight',factor:453.59237,singular:'lb',plural:'lb'},
    piece:{type:'count',factor:1,singular:'',plural:''},
    sprig:{type:'count',factor:1,singular:'sprig',plural:'sprigs'},
    can:{type:'count',factor:1,singular:'can',plural:'cans'}
  };
  function displayQuantity(amount,unit,metric=state.unitMode==='metric') {
    if(!units[unit]) return amountLabel(amount)+' '+unit;
    const type=units[unit].type;
    if(metric && type==='weight') {
      const grams=amount*units[unit].factor;
      return grams>=1000 ? amountLabel(grams/1000)+' kg' : `${Math.round(grams)} g`;
    }
    if(metric && type==='volume') {
      const ml=amount*units[unit].factor/units.mL.factor;
      return ml>=1000 ? amountLabel(ml/1000)+' L' : `${Math.round(ml)} mL`;
    }
    if(unit==='piece') return amountLabel(amount);
    return `${amountLabel(amount)} ${Math.abs(amount-1)<0.0001 ? units[unit].singular:units[unit].plural}`;
  }
  const recipeHref = id => `recipes/${id}.html`;
  const imageHref = id => `assets/images/${id}.webp`;
  function refreshShared() {
    qsa('.js-selected-count').forEach(el=>el.textContent=String(state.selected.length));
    qsa('[data-guests]').forEach(el=> { if(document.activeElement!==el) el.value=String(state.guests); });
    qsa('[data-unit-mode]').forEach(el=>el.value=state.unitMode);
    qsa('[data-toggle-recipe]').forEach(button=> {
      const selected=state.selected.includes(button.dataset.id);
      button.setAttribute('aria-pressed',String(selected));
      button.classList.toggle('is-selected',selected);
      const label=button.dataset.context==='detail' ? (selected?'✓ Added to your feast':'Add ingredients to my feast') : (selected?'✓ Added to feast':'+ Add to feast');
      button.textContent=label;
    });
    const page=document.body.dataset.page;
    if(page==='recipe-detail') renderIngredients();
    if(page==='grocery') renderGrocery();
    if(page==='calculators') renderGuestEstimate();
    if(page==='recipes') setText('#selected-recipe-label',`${state.selected.length} selected for your feast`);
  }
  function toggleRecipe(id) {
    if(!byId.has(id)) return;
    state.selected = state.selected.includes(id) ? state.selected.filter(item=>item!==id) : [...state.selected,id];
    save(); refreshShared();
  }
  function onPantry(id,checked) {
    state.pantry=checked ? [...new Set([...state.pantry,id])] : state.pantry.filter(item=>item!==id);
    save();
    if(document.body.dataset.page==='grocery') renderGrocery();
    if(document.body.dataset.page==='recipe-detail') renderIngredients();
  }
  function recipeCard(recipe) {
    const article=document.createElement('article');article.className='recipe-card';
    article.innerHTML=`<a class="recipe-card-image" href="${recipeHref(recipe.id)}"><img src="${imageHref(recipe.id)}" alt="${recipe.title} served on a Thanksgiving table" width="440" height="440" loading="lazy"></a>
      <div class="recipe-card-body"><div class="eyebrow">${names[recipe.course]}</div><h3><a href="${recipeHref(recipe.id)}">${recipe.title}</a></h3>
      <p class="card-summary">${recipe.short}</p><div class="recipe-meta"><span>◷ ${recipe.prep+recipe.cook} min${recipe.thaw?' + thawing':''}</span><span>◎ ${recipe.servings} servings</span></div>
      <div class="card-actions"><a class="text-link" href="${recipeHref(recipe.id)}">View recipe <span aria-hidden="true">↗</span></a><button class="button button-small button-outline" type="button" data-toggle-recipe data-id="${recipe.id}" aria-pressed="false">+ Add to feast</button></div></div>`;
    return article;
  }
  function initRecipes() {
    const results=qs('#recipe-results');
    if(!results) return;
    const search=qs('#search-recipes'); const course=qs('#filter-course'); const diet=qs('#filter-diet'); const time=qs('#filter-time');
    const render=() => {
      const query=search.value.trim().toLocaleLowerCase();
      const filtered=recipes.filter(recipe => (!query || [recipe.title,recipe.short,recipe.course,...recipe.ingredients.map(i=>i[1])].join(' ').toLocaleLowerCase().includes(query)) &&
        (!course.value || recipe.course===course.value) && (!diet.value || recipe.diets.includes(diet.value)) &&
        (!time.value || recipe.prep+recipe.cook <= Number(time.value)));
      results.replaceChildren(...filtered.map(recipeCard));
      setText('#results-count',`${filtered.length} ${filtered.length===1?'recipe':'recipes'} found`);
      qs('#no-results').hidden=filtered.length>0;
      refreshShared();
    };
    [search,course,diet,time].forEach(input=>input.addEventListener(input===search?'input':'change',render));
    qs('#clear-filters').addEventListener('click',()=>{search.value='';course.value='';diet.value='';time.value='';render();search.focus();});
    render();
  }
  function ingredientRow(ingredient,scale) {
    const [id,name,amount,unit,,note]=ingredient;
    const checked=state.pantry.includes(id);
    const li=document.createElement('li');li.className='ingredient-row'+(checked?' have':'');
    const label=document.createElement('label');label.className='ingredient-label';
    const input=document.createElement('input');input.type='checkbox';input.checked=checked;input.dataset.pantryId=id;
    input.setAttribute('aria-label',`I already have ${name}`);
    const text=document.createElement('span');
    const strong=document.createElement('strong');strong.textContent=amount===null?name:(displayQuantity(amount*scale,unit)+' '+name);
    text.append(strong);
    if(note){const small=document.createElement('small');small.textContent=note;text.append(small);}
    label.append(input,text);li.append(label);return li;
  }
  function renderIngredients() {
    const id=document.body.dataset.recipeId;const recipe=byId.get(id);const list=qs('#ingredient-list');
    if(!recipe||!list)return;
    list.replaceChildren(...recipe.ingredients.map(i=>ingredientRow(i,state.guests/recipe.servings)));
    setText('#recipe-servings',`${state.guests} servings`);
    setText('#ingredient-servings',`${state.guests} guests`);
  }
  function initRecipe() {
    const recipe=byId.get(document.body.dataset.recipeId);
    if (!recipe) return;
    const steps=qs(`#method-list-${recipe.id}`);
    if(steps) steps.replaceChildren(...recipe.steps.map(step=>{
      const li=document.createElement('li');li.textContent=step;return li;
    }));
    setText(`#kitchen-note-${recipe.id} .kitchen-note-copy`,recipe.note);
    renderIngredients();
  }
  function aggregate() {
    const map=new Map();
    state.selected.forEach(id=>{
      const recipe=byId.get(id);
      if(!recipe)return;
      recipe.ingredients.forEach(([ingredientId,name,amount,unit,aisle,note])=>{
        const type=units[unit]?.type||unit;
        const index=`${ingredientId}|${type}`;
        const scaled=amount===null?0:amount*state.guests/recipe.servings;
        if(!map.has(index))map.set(index,{id:ingredientId,name,amount:0,unit,aisle,note,kind:type,sourceIds:[]});
        const item=map.get(index);
        item.amount+=scaled*(units[unit]?.factor || 1)/(units[item.unit]?.factor || 1);
        item.sourceIds.push(id);
      });
    });
    return [...map.values()].sort((a,b)=>a.name.localeCompare(b.name));
  }
  function renderGrocery() {
    const selectedList=qs('#selected-recipes-list');if(!selectedList)return;
    selectedList.replaceChildren();
    state.selected.forEach(id=>{
      const recipe=byId.get(id);const li=document.createElement('li');li.className='selected-recipe';
      const link=document.createElement('a');link.href=recipeHref(id);link.textContent=recipe.title;
      const button=document.createElement('button');button.type='button';button.className='remove-icon';button.dataset.removeRecipe=id;button.textContent='×';button.setAttribute('aria-label',`Remove ${recipe.title} from feast`);
      li.append(link,button);selectedList.append(li);
    });
    qs('#empty-selected').hidden=state.selected.length>0;
    const grocery=qs('#grocery-groups');grocery.replaceChildren();
    const items=aggregate();
    const visible=qs('#only-needed')?.checked ? items.filter(item=>!state.pantry.includes(item.id)) : items;
    window.GG_AISLES.forEach(aisle=>{
      const aisleItems=visible.filter(item=>item.aisle===aisle);
      if(!aisleItems.length)return;
      const section=document.createElement('section');section.className='aisle-group';
      const title=document.createElement('h3');title.textContent=aisle;section.append(title);
      const ul=document.createElement('ul');ul.className='grocery-items';
      aisleItems.forEach(item=>{
        const li=document.createElement('li');li.className='grocery-row'+(state.pantry.includes(item.id)?' have':'');
        const label=document.createElement('label');
        const input=document.createElement('input');input.type='checkbox';input.checked=state.pantry.includes(item.id);input.dataset.pantryId=item.id;
        input.setAttribute('aria-label',`Already have ${item.name}`);
        const span=document.createElement('span');span.textContent=`${item.amount===0?'':displayQuantity(item.amount,item.unit)+' '}${item.name}${item.note?' ('+item.note+')':''}`;
        label.append(input,span);li.append(label);ul.append(li);
      });
      section.append(ul);grocery.append(section);
    });
    setText('#list-status',items.length ? `${items.filter(i=>!state.pantry.includes(i.id)).length} to buy · ${items.filter(i=>state.pantry.includes(i.id)).length} already have` : 'No items yet');
    qs('#empty-grocery').hidden=items.length>0;
    if(items.length && !visible.length) {
      const p=document.createElement('p');p.className='success-note';p.textContent='You have everything on this list. Nice work!';grocery.append(p);
    }
  }
  function initGrocery() {
    qs('#clear-feast')?.addEventListener('click',()=>{
      state.selected=[];save();refreshShared();
      setText('#list-notice','Your selected recipes have been cleared.');
    });
    qs('#only-needed')?.addEventListener('change',renderGrocery);
    qs('#print-grocery')?.addEventListener('click',()=>window.print());
    renderGrocery();
  }
  function guestEstimateRow(name,qty,unit) {
    const li=document.createElement('li');const strong=document.createElement('strong');strong.textContent=name;
    const span=document.createElement('span');span.textContent=displayQuantity(qty,unit);
    li.append(strong,span);return li;
  }
  function renderGuestEstimate() {
    const list=qs('#portion-results');if(!list)return;
    const n=state.guests;
    list.replaceChildren(guestEstimateRow('Whole turkey (raw)',n*1.5,'lb'),guestEstimateRow('Stuffing',n*0.75,'cup'),guestEstimateRow('Potatoes',n*0.5,'lb'),guestEstimateRow('Pumpkin pie',n/8,'piece'));
    setText('#portion-note',`Estimated amounts for ${n} guests. Turkey sizes vary; allow extra for leftovers and round up packages or pies.`);
  }
  const choices={
    volume:[['tsp','Teaspoons (tsp)'],['tbsp','Tablespoons (tbsp)'],['cup','Cups'],['fl oz','Fluid ounces'],['mL','Milliliters (mL)'],['L','Liters (L)']],
    weight:[['g','Grams (g)'],['kg','Kilograms (kg)'],['oz','Ounces (oz)'],['lb','Pounds (lb)']],
    temperature:[['F','Fahrenheit (°F)'],['C','Celsius (°C)']]
  };
  const panAreas={'8-square':64,'9-square':81,'9x13':117,'8-round':Math.PI*16,'9-round':Math.PI*20.25};
  function parseAmount(text) {
    let str=String(text).trim().replace(/\u00a0/g,' ');
    const fractions={'½':'1/2','⅓':'1/3','⅔':'2/3','¼':'1/4','¾':'3/4','⅛':'1/8','⅜':'3/8','⅝':'5/8','⅞':'7/8'};
    for(const [symbol,expansion] of Object.entries(fractions))str=str.replaceAll(symbol,` ${expansion}`);
    str=str.trim();
    const negative=str.startsWith('-');
    if(negative) str=str.slice(1).trim();
    if(!/^(?:\d+(?:\.\d+)?)(?:\s+\d+\/\d+)?$|^\d+\/\d+$/.test(str)) return NaN;
    const parsed=str.split(/\s+/).reduce((sum,part)=>{
      if(part.includes('/')){const [num,den]=part.split('/').map(Number);return sum+(den?num/den:NaN);}
      return sum+Number(part);
    },0);
    return negative?-parsed:parsed;
  }
  function initCalculators() {
    const type=qs('#conversion-type'),from=qs('#conversion-from'),to=qs('#conversion-to'),amount=qs('#conversion-amount');
    const loadChoices=()=>{
      const collection=choices[type.value]||choices.volume;
      from.replaceChildren(...collection.map(([value,label])=>new Option(label,value)));
      to.replaceChildren(...collection.map(([value,label])=>new Option(label,value)));
      if(type.value==='volume'){from.value='cup';to.value='mL';}
      if(type.value==='weight'){from.value='oz';to.value='g';}
      if(type.value==='temperature'){from.value='F';to.value='C';}
      compute();
    };
    const compute=()=>{
      const n=parseAmount(amount.value);
      if(!Number.isFinite(n)||(n<0&&type.value!=='temperature')){setText('#conversion-result','Enter a valid amount (e.g. 1 1/2).');return;}
      let result;
      if(type.value==='temperature') result=from.value===to.value?n:from.value==='F'?(n-32)*5/9:n*9/5+32;
      else result=n*units[from.value].factor/units[to.value].factor;
      const converted=type.value==='temperature'?`${Number(result.toFixed(1))} °${to.value}`:`${amountLabel(result)} ${to.value}`;
      setText('#conversion-result',type.value==='temperature'?`${amountLabel(n)}°${from.value} = ${converted}`:`${amountLabel(n)} ${from.value} = ${converted}`);
    };
    type.addEventListener('change',loadChoices);[from,to].forEach(el=>el.addEventListener('change',compute));amount.addEventListener('input',compute);
    const panFrom=qs('#pan-from'),panTo=qs('#pan-to'),panCount=qs('#pan-count');
    const panCalc=()=>{
      const count=Math.max(1,Math.min(6,Number(panCount.value)||1));
      const factor=panAreas[panTo.value]*count/panAreas[panFrom.value];
      setText('#pan-result',`Use about ${Number(factor.toFixed(2))}× the original ingredient amounts for ${count} target ${count===1?'pan':'pans'}.`);
    };
    [panFrom,panTo,panCount].forEach(el=>el.addEventListener('input',panCalc));
    qs('#print-calculators')?.addEventListener('click',()=>window.print());
    qs('#reset-tools').addEventListener('click',()=>{
      type.value='volume';amount.value='1 1/2';panFrom.value='9x13';panTo.value='9x13';panCount.value='1';
      setGuests(12);loadChoices();panCalc();
      setText('#reset-announcement','Calculator values reset to defaults.');
    });
    loadChoices();panCalc();renderGuestEstimate();
  }
  const schedule=[
    [
        -390,
        "Take the turkey out of the refrigerator to…",
        "Take the turkey out of the refrigerator to sit at room temperature for up to 1 hour. Make the herb butter if you haven't already."
    ],
    [
        -360,
        "Heat the oven to 425°F (220°C)",
        "Heat the oven to 425°F (220°C). Prepare the roasting pan with vegetables and stock. Butter the turkey."
    ],
    [
        -330,
        "Turkey into the oven at 425°F (220°C)",
        "Turkey into the oven at 425°F (220°C)."
    ],
    [
        -300,
        "Reduce the oven to 325°F (165°C)",
        "Reduce the oven to 325°F (165°C). Continue roasting."
    ],
    [
        -270,
        "Take the stuffing base, mashed potatoes and…",
        "Take the stuffing base, mashed potatoes and green bean casserole out of the fridge to lose their chill. Take the pie out of the fridge if serving at room temperature later."
    ],
    [
        -240,
        "Check the pan",
        "Check the pan; add a little stock if it's dry. Tent the breast with foil if it's browning too fast. Tidy the kitchen and run the dishwasher."
    ],
    [
        -180,
        "Start checking the turkey's temperature in…",
        "Start checking the turkey's temperature in the thigh and breast. Mix the egg and stock into the stuffing and spread it in a buttered dish."
    ],
    [
        -150,
        "Put the mashed potatoes in a slow cooker on…",
        "Put the mashed potatoes in a slow cooker on LOW (or plan to reheat them in the oven after the turkey). Set out appetizers and drinks."
    ],
    [
        -120,
        "Turkey should be close to done (165°F /…",
        "Turkey should be close to done (165°F / 74°C in the thigh and breast). Remove from the oven and rest, tented with foil. Strain and skim the pan drippings."
    ],
    [
        -105,
        "Raise the oven to 375°F (190°C)",
        "Raise the oven to 375°F (190°C). Bake the stuffing, covered. Put the green bean casserole in alongside it. (Mashed potatoes go in now if reheating in the oven.)"
    ],
    [
        -80,
        "Uncover the stuffing",
        "Uncover the stuffing. Stir half the crispy shallots into the casserole."
    ],
    [
        -60,
        "Reheat the gravy base on the stove and…",
        "Reheat the gravy base on the stove and whisk in the pan drippings. Season to taste. Keep warm on low."
    ],
    [
        -45,
        "Top the casserole with the rest of the…",
        "Top the casserole with the rest of the shallots and bake 5 more minutes. Check the stuffing is golden and 165°F (74°C) in the center."
    ],
    [
        -30,
        "Carve the turkey and arrange on a warm platter",
        "Carve the turkey and arrange on a warm platter. Stir the mashed potatoes and add a splash of warm milk. Move cranberry sauce to a serving bowl."
    ],
    [
        -15,
        "Transfer sides to serving dishes",
        "Transfer sides to serving dishes. Pour gravy into a warm gravy boat. Warm rolls in the oven for 10 minutes. Whip the cream for the pie and refrigerate."
    ],
    [
        0,
        "Dinner is served!",
        "Dinner is served!"
    ]
];
  function initPlanner() {
    qsa('[data-planner-task]').forEach(box=>{
      box.checked=state.planner.includes(box.dataset.plannerTask);
      box.addEventListener('change',()=>{
        const id=box.dataset.plannerTask;
        state.planner=box.checked?[...new Set([...state.planner,id])]:state.planner.filter(item=>item!==id);
        save();
      });
    });
    const dinner=qs('#dinner-time');const output=qs('#day-schedule');
    const render=()=>{
      const [h,m]=dinner.value.split(':').map(Number);
      const minutes=Number.isFinite(h)&&Number.isFinite(m)?h*60+m:16*60;
      output.replaceChildren(...schedule.map(([offset,title,note])=>{
        const li=document.createElement('li');li.className='schedule-item';
        const time=document.createElement('time');const value=(minutes+offset+1440)%1440;const hour=Math.floor(value/60);const minute=value%60;
        time.textContent=`${hour%12||12}:${String(minute).padStart(2,'0')} ${hour<12?'AM':'PM'}`;
        const body=document.createElement('div');const h3=document.createElement('h3');h3.textContent=title;const p=document.createElement('p');p.textContent=note;body.append(h3,p);li.append(time,body);return li;
      }));
    };
    dinner.addEventListener('input',render);qs('#print-planner')?.addEventListener('click',()=>window.print());render();
  }
  function initContact() {
    const form=qs('#share-form');
    if(!form)return;
    form.addEventListener('submit',event=>{
      event.preventDefault();
      if(!form.reportValidity())return;
      form.reset();
      const note=qs('#form-feedback');note.hidden=false;note.textContent='Demo complete! Nothing was sent, saved or collected. Thank you for trying the form.';note.focus();
    });
  }
  function initNav() {
    const toggle=qs('#menu-toggle'),nav=qs('#primary-navigation');
    if(toggle&&nav){
      const close=()=>{toggle.setAttribute('aria-expanded','false');nav.classList.remove('open');};
      toggle.addEventListener('click',()=>{
        const open=toggle.getAttribute('aria-expanded')!=='true';toggle.setAttribute('aria-expanded',String(open));nav.classList.toggle('open',open);
      });
      document.addEventListener('keydown',event=>{if(event.key==='Escape')close();});
      qsa('a',nav).forEach(link=>link.addEventListener('click',close));
    }
    setText('#footer-year',String(new Date().getFullYear()));
  }
  document.addEventListener('click',event=>{
    const toggle=event.target.closest('[data-toggle-recipe]');if(toggle){toggleRecipe(toggle.dataset.id);return;}
    const remove=event.target.closest('[data-remove-recipe]');if(remove){toggleRecipe(remove.dataset.removeRecipe);}
  });
  document.addEventListener('change',event=>{
    const pantry=event.target.closest('[data-pantry-id]');if(pantry){onPantry(pantry.dataset.pantryId,pantry.checked);return;}
    if(event.target.matches('[data-unit-mode]')){state.unitMode=event.target.value==='metric'?'metric':'us';save();refreshShared();return;}
    if(event.target.matches('[data-guests]'))setGuests(event.target.value);
  });
  document.addEventListener('input',event=>{
    if(event.target.matches('[data-guests]')) {
      const value=Number(event.target.value);
      if(Number.isInteger(value)&&value>=1&&value<=40)setGuests(value);
    }
  });
  initNav();
  const page=document.body.dataset.page;
  if(page==='recipes')initRecipes();
  if(page==='recipe-detail')initRecipe();
  if(page==='grocery')initGrocery();
  if(page==='calculators')initCalculators();
  if(page==='planner')initPlanner();
  if(page==='contact')initContact();
  refreshShared();
})();
