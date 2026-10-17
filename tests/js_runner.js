const Aq=require('../docs/hydraulics.js').Aq;const cases=JSON.parse(require('fs').readFileSync(process.argv[2]));
console.log(JSON.stringify(cases.map(c=>({results:Aq.design(c).results,best:Aq.costScan(c).best}))));
