/* Dependency-free smoke tests: run from the project root with `node tests/smoke-test.js`. */
'use strict';
const vm = require('node:vm');
const fs = require('node:fs');
const assert = require('node:assert/strict');
const store = {};
const context = {
  console,
  window: {},
  localStorage: {
    getItem: key => store[key] ?? null,
    setItem: (key,value) => { store[key] = value; }
  },
  document: {
    body:{dataset:{page:'home'}}, activeElement: null,
    querySelector: () => null,
    querySelectorAll: () => [],
    addEventListener: () => {}
  }
};
vm.createContext(context);
vm.runInContext(fs.readFileSync('js/data.js','utf8'),context);
let app = fs.readFileSync('js/app.js','utf8');
app = app.replace("  document.addEventListener('click',event=>{", "  globalThis.__GG_TEST = {state,byId,amountLabel,parseAmount,displayQuantity,aggregate,setGuests};\n  document.addEventListener('click',event=>{");
assert.ok(app.includes('globalThis.__GG_TEST'));
vm.runInContext(app,context);
const t = context.__GG_TEST;
const recipes = context.window.GG_RECIPES;
assert.equal(recipes.length,7);
assert.equal(recipes.map(r=>r.ingredients.length).reduce((a,b)=>a+b,0),94);
assert.ok(recipes.every(r=>r.steps.length>=5));
assert.equal(t.state.guests,12);
assert.equal(t.amountLabel(1.5),'1 1/2');
assert.equal(t.amountLabel(0.75),'3/4');
assert.equal(t.amountLabel(1/3),'1/3');
assert.equal(t.parseAmount('1 1/2'),1.5);
assert.equal(t.parseAmount('1½'),1.5);
assert.equal(t.parseAmount('½'),0.5);
assert.equal(t.parseAmount('-20'),-20);
assert.equal(t.parseAmount('bad'),Number.NaN); // verified by Number.isNaN below
assert.ok(Number.isNaN(t.parseAmount('bad')));
assert.equal(t.displayQuantity(2,'cup',false),'2 cups');
t.state.selected.push('cranberry-sauce','mashed-potatoes');
assert.ok(t.aggregate().length>8);
const before = t.aggregate().find(x=>x.id==='fresh-or-frozen-cranberries');
assert.ok(before);
t.setGuests(24);
const after = t.aggregate().find(x=>x.id==='fresh-or-frozen-cranberries');
assert.equal(after.amount,2*before.amount);
assert.equal(JSON.parse(Object.values(store)[0]).guests,24);
console.log('PASS 7 recipes, 94 ingredient records, parsed fractions, guest scaling, grocery aggregation, and local browser storage.');
