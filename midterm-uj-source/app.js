const palette={D:'#527eaa',R:'#c57060',O:'#a08a47',U:'#c4bba0',N:'#e9eae1'};
const abbreviations='Alabama AL Alaska AK Arizona AZ Arkansas AR California CA Colorado CO Connecticut CT Delaware DE Florida FL Georgia GA Hawaii HI Idaho ID Illinois IL Indiana IN Iowa IA Kansas KS Kentucky KY Louisiana LA Maine ME Maryland MD Massachusetts MA Michigan MI Minnesota MN Mississippi MS Missouri MO Montana MT Nebraska NE Nevada NV New_Hampshire NH New_Jersey NJ New_Mexico NM New_York NY North_Carolina NC North_Dakota ND Ohio OH Oklahoma OK Oregon OR Pennsylvania PA Rhode_Island RI South_Carolina SC South_Dakota SD Tennessee TN Texas TX Utah UT Vermont VT Virginia VA Washington WA West_Virginia WV Wisconsin WI Wyoming WY'.split(' ');const ab={};for(let i=0;i<abbreviations.length;i+=2)ab[abbreviations[i].replaceAll('_',' ')]=abbreviations[i+1];
const demStates=['Colorado','Delaware','Georgia','Illinois','Massachusetts','Michigan','Minnesota','New Hampshire','New Jersey','New Mexico','Oregon','Rhode Island','Virginia'];
const siena='https://sri.siena.edu/2026/';
const sources={oct3:siena+'10/03/nytimes-siena-poll-of-likely-voters-senate-races/',sept24:siena+'09/24/nytimes-siena-poll-of-likely-voters/',oct28:siena+'10/28/nytimes-siena-poll-of-likely-voters-florida-minnesota-and-south-carolina/',tx:siena+'10/13/talarico-maintains-small-lead-over-paxton/',ne:siena+'10/31/nytimes-siena-poll-of-likely-nebraska-voters/'};
const sienaPolls={
'Alaska':{v:{'Mary Peltola':50,'Dan S. Sullivan':43},date:'Oct 3, 2026',src:'oct3'},
'Iowa':{v:{'Ashley Hinson':48,'Josh Turek':47},date:'Oct 3, 2026',src:'oct3'},
'Kansas':{v:{'Adam Hamilton':45,'Roger Marshall':45,'David Graham':3},date:'Oct 3, 2026',src:'oct3'},
'Ohio':{v:{'Sherrod Brown':49,'Jon Husted':46},date:'Oct 3, 2026',src:'oct3'},
'Texas':{v:{'James Talarico':48,'Ken Paxton':44},date:'Oct 13, 2026',src:'tx'},
'Maine':{v:{'Susan Collins':49,'Troy Dale Jackson':46},date:'Sep 24, 2026',src:'sept24'},
'Michigan':{v:{'Abdul El-Sayed':49,'Mike Rogers':44},date:'Sep 24, 2026',src:'sept24'},
'New Hampshire':{v:{'Chris Pappas':50,'John Sununu':45},date:'Sep 24, 2026',src:'sept24'},
'Florida':{v:{'Ashley Moody':50,'Angie Nixon':44},date:'Oct 28, 2026',src:'oct28'},
'Minnesota':{v:{'Peggy Flanagan':54,'Michele Tafoya':40},date:'Oct 28, 2026',src:'oct28'},
'South Carolina':{v:{'Annie Andrews':48,'Darline Graham':48},date:'Oct 28, 2026',src:'oct28'},
'Nebraska':{v:{'Pete Ricketts':49,'Dan Osborn':43},date:'Oct 31, 2026',src:'ne'}};
// Latest verified release per pollster; equal weight among polls reporting a candidate.
const cnnSource='https://ssrs.com/news/democrats-in-striking-distance-new-cnn-polls-in-four-states-highlight-democrats-path-to-senate-majority/';
const cnnPolls={
 Kansas:{v:{'Adam Hamilton':49,'Roger Marshall':45},fieldwork:'Oct 20–26, 2026'},
 Maine:{v:{'Troy Dale Jackson':49,'Susan Collins':45},fieldwork:'Oct 20–26, 2026'},
 Michigan:{v:{'Abdul El-Sayed':49,'Mike Rogers':42},fieldwork:'Oct 20–27, 2026'},
 Texas:{v:{'James Talarico':49,'Ken Paxton':43},fieldwork:'Oct 20–27, 2026'}
};
function averagePolls(releases){
 const names=[...new Set(releases.flatMap(p=>Object.keys(p.v)))];
 const counts=Object.fromEntries(names.map(n=>[n,releases.filter(p=>p.v[n]!==undefined).length]));
 const v=Object.fromEntries(names.map(n=>[n,releases.reduce((sum,p)=>sum+(p.v[n]??0),0)/counts[n]]));
 return {v,counts,releases,date:releases.map(p=>p.date).join(' / ')};
}
const polls=Object.fromEntries([...new Set([...Object.keys(sienaPolls),...Object.keys(cnnPolls)])].map(state=>{
 const releases=[];
 const sp=sienaPolls[state],cp=cnnPolls[state];
 if(sp)releases.push({...sp,label:sp.src==='tx'?'Siena / Texas Poll':'NYT / Siena',url:sources[sp.src]});
 if(cp)releases.push({...cp,label:'CNN / SSRS',url:cnnSource,date:'Oct 29, 2026'});
 return [state,averagePolls(releases)];
}));
const montanaPoll={v:{'Kurt Alme':30,'Seth Bodnar':26,'Alani Bankhead':21},label:'User-provided screenshot',date:'Poll date not supplied'};
polls.Montana=averagePolls([montanaPoll]);
function pollShare(state,name){const p=polls[state];return p?.v[name]===undefined?'':`${p.v[name]}%${p.releases.length>1&&p.counts[name]<p.releases.length?' (1 poll)':''}`}
const ratingsSource='https://www.cookpolitical.com/ratings/senate-race-ratings?check_logged_in=1';
const ratings={};
for(const [rating,states] of Object.entries({
 'Solid Democratic':['Colorado','Delaware','Illinois','Massachusetts','New Jersey','New Mexico','Oregon','Rhode Island','Virginia'],
 'Likely Democratic':['Georgia','North Carolina'],
 'Lean Democratic':['Minnesota','New Hampshire'],
 'Toss-up':['Alaska','Iowa','Kansas','Maine','Michigan','Ohio','Texas'],
 'Lean Republican':['Nebraska','South Carolina'],
 'Likely Republican':['Florida','Mississippi'],
 'Solid Republican':['Alabama','Arkansas','Idaho','Kentucky','Louisiana','Montana','Oklahoma','South Dakota','Tennessee','West Virginia','Wyoming']
}))for(const state of states)ratings[state]=rating;
function expectedWinner(state){const rating=ratings[state];if(!rating||rating==='Toss-up')return null;return candidates[state]?.find(c=>party(c[1])===(rating.includes('Democratic')?'D':'R'))?.[0]||null}
function scenarioWinner(state){return polls[state]?winner(state):expectedWinner(state)}
function scenarioLabel(state){return polls[state]?(winner(state)||'Tied poll · uncalled'):(expectedWinner(state)?expectedWinner(state)+' · expected winner (rating assumption)':'No clear favorite · uncalled')}

let simulation={},simulationDetails={},simulationRuns=0;
let swingMode='random',fixedSwing=0,lastSimulation=null;
function formatSwing(value){const n=Math.round(value*10)/10;return Math.abs(n)<0.05?'Neutral · 0.0 pp':(n>0?'D / non-R +':'R +')+Math.abs(n).toFixed(1)+' pp'}
function seatChange(value){return value>0?'+'+value:String(value)}
function setSwing(mode,value=fixedSwing){if(!['random','fixed'].includes(mode)||!Number.isFinite(value)||value< -20||value>20)return false;swingMode=mode;fixedSwing=Math.round(value*10)/10;return true}
const simulatorMargins={Georgia:8,'North Carolina':12};
const threeWayScenarios={
 Montana:{support:{...montanaPoll.v},label:'User-provided screenshot: Alme 30%, Bodnar 26%, Bankhead 21%. Pollster and fieldwork dates not supplied. Simulator normalizes these shares to 100% among the three modeled candidates, excluding the remaining 23%.',independent:'Seth Bodnar',jitter:2},
 Alaska:{support:{'Mary Peltola':53,'Dan S. Sullivan':46,'Daniel J. Sullivan Jr.':1},label:'For-fun assumption: Daniel J. Sullivan Jr. starts at 1%. The other two start at 53% and 46%, retaining the Siena 7-point Peltola–incumbent margin. This is an illustrative scenario, not a three-way poll.',independent:'Daniel J. Sullivan Jr.',jitter:.75}
};
function roundedShares(values){const entries=Object.entries(values),sum=entries.reduce((a,[,v])=>a+Math.max(.001,v),0);const units=entries.map(([n,v])=>({n,raw:Math.max(.001,v)/sum*1000}));units.forEach(v=>v.units=Math.floor(v.raw));let left=1000-units.reduce((a,v)=>a+v.units,0);const order=[...units].sort((a,b)=>(b.raw-b.units)-(a.raw-a.units));for(let i=0;i<left;i++)order[i%order.length].units++;return Object.fromEntries(units.map(v=>[v.n,v.units/10]))}
function multiwayResult(state,national,stateSwing,rng){
 const cfg=threeWayScenarios[state],base=Object.fromEntries(Object.entries(cfg.support).map(([n,v])=>[n,v/Object.values(cfg.support).reduce((a,b)=>a+b,0)*100]));
 const rep=candidates[state].find(([n,p])=>base[n]!==undefined&&party(p)==='R')[0];
 const nonR=Object.keys(base).filter(n=>n!==rep),nonTotal=nonR.reduce((a,n)=>a+base[n],0),totalSwing=national+stateSwing;
 const raw={...base};raw[rep]-=totalSwing/2;for(const n of nonR)raw[n]+=totalSwing/2*(base[n]/nonTotal);
 const independentSwing=normalRandom(rng)*cfg.jitter,other=nonR.find(n=>n!==cfg.independent);
 raw[cfg.independent]+=independentSwing;raw[other]-=independentSwing;
 const shares=roundedShares(raw),rank=Object.keys(shares).sort((a,b)=>shares[b]-shares[a]||raw[b]-raw[a]);
 // Keep the displayed winner unambiguous if rounding created a tie.
 if(shares[rank[0]]===shares[rank[1]]){shares[rank[0]]=Math.round((shares[rank[0]]+.1)*10)/10;shares[rank[1]]=Math.round((shares[rank[1]]-.1)*10)/10}
 return {winner:rank[0],shares,margin:Math.round((shares[rank[0]]-shares[rank[1]])*10)/10,nationalSwing:national,stateSwing,totalSwing,baseShares:base,independentSwing,baselineMargin:nonTotal-base[rep],simulatedMargin:100-2*shares[rep],threeWay:true};
}
function simulatorBasisHtml(state){
 if(simulatorMargins[state]!==undefined)return `<p class="sim-basis">Simulator starting margin: <b>${state==='Georgia'?'Jon Ossoff':'Roy Cooper'} +${simulatorMargins[state]}</b> · Your scenario setting, before swing.</p>`;
 const cfg=threeWayScenarios[state];return cfg?`<div class="sim-basis"><b>Three-way simulator baseline</b><p>${esc(cfg.label)}</p>${cfg.url?`<a href="${cfg.url}" target="_blank" rel="noopener">Poll source ↗</a>`:''}</div>`:'';
}
// Illustrative assumptions, not calibrated win probabilities or Siena estimates.
function normalRandom(rng=Math.random){return Math.sqrt(-2*Math.log(Math.max(Number.EPSILON,rng())))*Math.cos(2*Math.PI*rng())}
function simulationPair(state){
 if(polls[state])return Object.entries(polls[state].v).sort((a,b)=>b[1]-a[1]).slice(0,2).map(([name])=>candidates[state].find(c=>c[0]===name));
 const field=candidates[state],r=field.find(c=>party(c[1])==='R'),d=field.find(c=>party(c[1])==='D');
 const independent={Idaho:'Todd Achilles',Nebraska:'Dan Osborn','South Dakota':'Brian Bengs'}[state];
 return [d||field.find(c=>c[0]===independent)||field.find(c=>party(c[1])!=='R'),r].filter(Boolean);
}
function simulateElection(rng=Math.random){
 const next={},details={},national=swingMode==='fixed'?fixedSwing:normalRandom(rng)*3;
 for(const state of Object.keys(candidates)){
  if(threeWayScenarios[state]){const r=multiwayResult(state,national,normalRandom(rng)*4,rng);next[state]=r.winner;details[state]=r;continue}
  const pair=simulationPair(state);if(pair.length<2){next[state]=pair[0][0];details[state]={shares:{[pair[0][0]]:100},margin:100};continue}
  const [a,b]=pair;let margin;
  if(simulatorMargins[state]!==undefined)margin=simulatorMargins[state]*(party(a[1])==='D'?1:-1);
  else if(polls[state])margin=polls[state].v[a[0]]-polls[state].v[b[0]];
  else {const r=ratings[state]||'Toss-up',size=r.startsWith('Solid')?20:r.startsWith('Likely')?10:r.startsWith('Lean')?5:0;const favored=r.includes('Democratic')?'D':'R';margin=party(a[1])===favored?size:-size}
  // A common national shift moves Democrats (or the main non-R challenger) together.
  const direction=party(a[1])==='R'?-1:1;
  const stateSwing=normalRandom(rng)*4,totalSwing=national+stateSwing;
  const finalMargin=margin+totalSwing*direction;
  next[state]=(finalMargin>=0?a:b)[0];
  // Convert this run's margin into two-contender shares, rounded to 0.1%.
  let aShare=Math.max(0,Math.min(100,Math.round((100+finalMargin)*5)/10));
  if(aShare===50)aShare=finalMargin>=0?50.1:49.9;
  const bShare=Math.round((100-aShare)*10)/10;
  details[state]={shares:{[a[0]]:aShare,[b[0]]:bShare},margin:Math.round(Math.abs(aShare-bShare)*10)/10,nationalSwing:national,stateSwing,totalSwing,baselineMargin:margin,simulatedMargin:finalMargin,baseShares:{[a[0]]:(100+margin)/2,[b[0]]:(100-margin)/2}};
 }
 simulation=next;simulationDetails=details;lastSimulation={national,mode:swingMode};simulationRuns++;return next;
}
function simulationSummary(){if(!simulationRuns)return 'Press the button to reveal one possible election.';const t=total('sim');return 'Run '+simulationRuns+' · '+(t.D>=51?'Democratic-aligned majority':t.R>=50?(t.R===50?'Republican control with the VP’s tie-break':'Republican majority'):'Control depends on independent caucusing')}
function simulationResult(state){return simulation[state]?'Simulated winner: '+simulation[state]:'No simulation run yet'}

function swingControlsHtml(){return `<div class="swing-controls" aria-label="Simulation swing controls"><div class="swing-options" role="group" aria-label="Choose national swing mode"><button id="swingrandom" type="button" aria-pressed="${swingMode==='random'}">Random swing</button><button id="swingfixed" type="button" aria-pressed="${swingMode==='fixed'}">Set party swing</button></div>${swingMode==='fixed'?`<label class="swing-input">National swing (margin points)<input id="swingvalue" type="number" min="-20" max="20" step="0.1" value="${fixedSwing}" inputmode="decimal" aria-describedby="swinghelp"></label>`:''}<p id="swinghelp">${swingMode==='fixed'?'Positive favors Democrats / the main non-Republican challenger; negative favors Republicans. Range −20 to +20.':'A fresh national swing is drawn for each simulation.'} Settings apply to the next run. State-level variation stays random.</p></div>`}
function swingSummaryHtml(){if(!lastSimulation)return '<div class="swing-summary"><span>National party swing</span><strong>Run a simulation to reveal the swing</strong></div>';const t=total('sim');return `<div class="swing-summary" aria-label="Swing in this simulation"><div><span>National party swing · ${lastSimulation.mode==='fixed'?'Set by you':'Random'}</span><strong>${formatSwing(lastSimulation.national)}</strong><small>Change to the starting margin; pp = percentage points.</small></div><div><span>Net seat change vs. current Senate</span><strong><b class="dem">D ${seatChange(t.D-47)}</b> <b class="rep">R ${seatChange(t.R-53)}</b>${t.O?` <b>Other +${t.O}</b>`:''}</strong><small>D includes the 2 existing caucusing independents.</small></div></div>`}
function wireSwingControls(){
 for(const [id,mode] of [['swingrandom','random'],['swingfixed','fixed']]){const button=document.getElementById(id);if(button)button.onclick=()=>{setSwing(mode);renderMaps();document.getElementById(id).focus({preventScroll:true})}}
 const field=document.getElementById('swingvalue');if(field)field.oninput=()=>{field.setCustomValidity('');if(field.value.trim()!==''&&field.checkValidity())setSwing('fixed',Number(field.value))};
}
function stateSwingHtml(state){const r=simulationDetails[state];if(!r||r.totalSwing===undefined)return '';const held=demStates.includes(state)?'D':'R',won=color('sim',state);return `<div class="state-swing"><h3>Party swing in this state</h3><dl><div><dt>Total state swing</dt><dd>${formatSwing(r.totalSwing)}</dd></div><div><dt>National component</dt><dd>${formatSwing(r.nationalSwing)}</dd></div><div><dt>State-only component</dt><dd>${formatSwing(r.stateSwing)}</dd></div><div><dt>Seat outcome</dt><dd>${held===won?(won==='D'?'Democratic':'Republican')+' hold':held+' → '+(won==='O'?'Other / Independent':won)+' flip'}</dd></div></dl><p class="fine">Total = national + state-only shift to the starting margin, before rounding. Positive shifts favor Democrats or the main non-Republican challenger. ${r.threeWay?'In this three-way race, the non-Republican share change is divided proportionally between the Democrat and independent. An additional independent-vs-Democrat shift is drawn: '+(r.independentSwing>=0?'+':'')+r.independentSwing.toFixed(1)+' pp to the independent. Shares are then bounded and normalized.':'A 2-point margin shift changes each contender’s share by 1 point.'}</p></div>`}

function simulatedResultsHtml(state){
 const r=simulationDetails[state];
 if(!r)return '<div class="simresult"><b>No simulated results yet.</b><p>Press “Simulate election” on map 5, then click this state to see its vote shares.</p></div>';
 const rows=Object.entries(r.shares).sort((a,b)=>b[1]-a[1]);
 const remaining=candidates[state].filter(([n])=>r.shares[n]===undefined);
 return `<section class="state-results" aria-label="Simulated results for ${esc(state)}"><div class="eyebrow">SIMULATION ${simulationRuns} · ${r.threeWay?'THREE-WAY':'TWO-CONTENDER'} VOTE SHARE</div><p class="simresult"><b>${esc(simulation[state])} wins</b><br>Winning margin: <b>${r.margin.toFixed(1)} percentage points</b></p>${simulatorBasisHtml(state)}${stateSwingHtml(state)}${rows.map(([n,share])=>{const c=candidates[state].find(c=>c[0]===n);return `<div class="result-row"><div class="result-label"><span><i class="partydot ${party(c[1])}"></i> ${esc(n)}<small>${esc(c[1])}${n===simulation[state]?' · Simulated winner':''}${r.baseShares?'<br>Start '+r.baseShares[n].toFixed(1)+'% · '+(share-r.baseShares[n]>=0?'+':'')+(share-r.baseShares[n]).toFixed(1)+' pp':''}</small></span><strong>${share.toFixed(1)}%</strong></div><div class="result-track"><div style="width:${share}%;background:${palette[party(c[1])]}"></div></div></div>`}).join('')}<p class="fine">Illustrative simulated vote shares among these ${rows.length===2?'two contenders':'three contenders'}, totaling 100%. These are not polling percentages, win probabilities, actual results, or turnout.</p>${remaining.length?`<details class="other-contenders"><summary>Other ballot-listed candidates (not modeled)</summary><p>${remaining.map(([n,p])=>esc(n)+' ('+esc(p)+')').join('<br>')}</p></details>`:''}</section>`;
}

let candidates={},geography=[],picks={shaurya:{},shipra:{}};try{let stored=JSON.parse(localStorage.getItem('midterm-uj-picks-v1'));if(stored&&typeof stored==='object')for(let who of ['shaurya','shipra'])if(stored[who]&&typeof stored[who]==='object')picks[who]=stored[who]}catch{}
const cfg=[{id:'current',name:'Current party control',tag:'THE STARTING POINT',desc:'The party holding each Senate seat on the 2026 ballot.'},{id:'shaurya',name:'Shaurya’s map',tag:'YOUR PREDICTION',desc:'Click a state to choose a candidate. Make your call.'},{id:'shipra',name:'Shipra’s map',tag:'YOUR PREDICTION',desc:'Your own view of the race. Click a state to make a pick.'},{id:'poll',name:'Polling average map',tag:'POLLS + EXPECTATIONS',desc:'Siena + CNN/SSRS averages where available; expected winners elsewhere. Stripes = assumption.'},{id:'sim',name:'Election simulator',tag:'ONE POSSIBLE OUTCOME',desc:'Press once for a complete election. Click a state for its simulated vote shares.'}];
const esc=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function party(p){return p.startsWith('Democratic')?'D':p==='Republican'?'R':'O'}
function winner(state){const p=polls[state];if(!p)return null;const order=Object.entries(p.v).sort((a,b)=>b[1]-a[1]);return order[0][1]===order[1][1]?null:order[0][0]}
function color(who,state){if(!candidates[state])return 'N';if(who==='current')return demStates.includes(state)?'D':'R';const name=who==='sim'?simulation[state]:who==='poll'?scenarioWinner(state):picks[who][state];const c=candidates[state].find(x=>x[0]===name);return c?party(c[1]):'U'}
function total(who){const t={D:34,R:31,O:0,U:0};for(const s of Object.keys(candidates))t[color(who,s)]++;return t}
function notify(msg){const el=document.getElementById('toast');el.textContent=msg;el.style.display='block';clearTimeout(window.toasttimer);window.toasttimer=setTimeout(()=>el.style.display='none',2500)}
function save(){try{localStorage.setItem('midterm-uj-picks-v1',JSON.stringify(picks));notify('Prediction saved in this browser')}catch{notify('Storage unavailable — picks remain for this session')}}
function setPick(who,state,name){if(name)picks[who][state]=name;else delete picks[who][state];save();renderMaps();renderTable()}
function tally(t){return `<span class="dem">${t.D}<small>D-aligned</small></span><span class="rep">${t.R}<small>R</small></span>${t.O?`<span style="color:var(--other)">${t.O}<small>Other</small></span>`:''}<span style="color:var(--muted)">${t.U}<small>Uncalled</small></span>`}
// Reported AP race calls; checked November 6, 2026. Not certified results.
const actualResults={Alabama:'Barry Moore',Arkansas:'Tom Cotton',Colorado:'John Hickenlooper',Delaware:'Chris Coons',Florida:'Ashley Moody',Georgia:'Jon Ossoff',Idaho:'Jim Risch',Illinois:'Juliana Stratton',Iowa:'Josh Turek',Kansas:'Adam Hamilton',Kentucky:'Andy Barr',Louisiana:'Julia Letlow',Maine:'Troy Dale Jackson',Massachusetts:'Edward J. Markey',Michigan:'Abdul El-Sayed',Minnesota:'Peggy Flanagan',Montana:'Kurt Alme',Nebraska:'Pete Ricketts','New Hampshire':'Chris Pappas','New Jersey':'Cory Booker','New Mexico':'Ben Ray Luján','North Carolina':'Roy Cooper',Ohio:'Sherrod Brown',Oklahoma:'Kevin Hern',Oregon:'Jeff Merkley','Rhode Island':'Jack Reed','South Carolina':'Annie Andrews','South Dakota':'Mike Rounds',Tennessee:'Bill Hagerty',Texas:'James Talarico',Virginia:'Mark Warner','West Virginia':'Shelley Moore Capito',Wyoming:'Harriet Hageman'};
const resultsSource='https://www.ap.org/the-definitive-source/behind-the-news/calling-control-of-congress-in-the-2026-midterm-elections/';
function isScoredMap(who){return ['shaurya','shipra','poll'].includes(who)}
function predictionFor(who,state){return who==='poll'?scenarioWinner(state):picks[who]?.[state]||null}
function accuracyStatus(who,state){if(!isScoredMap(who)||!candidates[state])return null;if(!actualResults[state])return 'pending';if(!predictionFor(who,state))return 'unpicked';return predictionFor(who,state)===actualResults[state]?'correct':'incorrect'}
const accuracyLabels={correct:'Correct pick',incorrect:'Incorrect pick',pending:'Result uncalled',unpicked:'No prediction'};
const accuracySymbols={correct:'✓',incorrect:'×',pending:'…',unpicked:'–'};
function accuracyStats(who){const counts={correct:0,incorrect:0,pending:0,unpicked:0};for(const state of Object.keys(candidates))counts[accuracyStatus(who,state)]++;const scored=counts.correct+counts.incorrect;return {...counts,scored,percent:scored?counts.correct/scored*100:null}}
function accuracySummaryHtml(who){if(!isScoredMap(who))return '';const a=accuracyStats(who);return `<section class="accuracy-summary" aria-label="Accuracy against actual election results"><div><span class="eyebrow">ACCURACY · ACTUAL RESULTS</span><strong>${a.percent===null?'—':a.percent.toFixed(1)+'%'}</strong><span>${a.correct} correct / ${a.scored} scored predictions</span></div><p><span class="accuracy-correct">✓ ${a.correct} correct</span> · <span class="accuracy-incorrect">× ${a.incorrect} incorrect</span><br>– ${a.unpicked} without a pick · … ${a.pending} results uncalled</p><small>Correct ÷ scored picks. Blank picks, tied polling and uncalled results are excluded. AP calls checked Nov 6, 2026; not certified. <a href="${resultsSource}" target="_blank" rel="noopener">Result source ↗</a></small></section>`}
function accuracyMarker(who,g){const status=accuracyStatus(who,g.name);return status?`<g class="accuracy-marker accuracy-${status}" aria-hidden="true"><circle cx="${g.x+15}" cy="${g.y-11}" r="9"/><text x="${g.x+15}" y="${g.y-7}" text-anchor="middle">${accuracySymbols[status]}</text></g>`:''}
function accuracyDetailHtml(who,state){if(!isScoredMap(who))return '';const status=accuracyStatus(who,state),pick=predictionFor(who,state);return `<section class="accuracy-detail accuracy-${status}"><h3>${accuracySymbols[status]} ${accuracyLabels[status]}</h3><p>Map prediction: <b>${esc(pick||'No prediction / tied poll')}</b><br>Actual result: <b>${esc(actualResults[state]||'Uncalled — still counting')}</b></p><small>Reported AP winner · checked November 6, 2026. Uncalled races and missing predictions are not scored. <a href="${resultsSource}" target="_blank" rel="noopener">Source ↗</a></small></section>`}

function renderMaps(){document.getElementById('mapgrid').innerHTML=cfg.map((c,i)=>{const t=total(c.id);return `<article class="card ${c.id==='sim'?'simcard':''}" ${c.id==='sim'?'id="simulation"':''}><div class="cardhead"><h2><span class="num">0${i+1}</span>${c.name}</h2><span class="tag">${c.tag}</span></div><p class="carddesc">${c.desc}</p>${accuracySummaryHtml(c.id)}${c.id==='sim'?`<div class="simtoolbar"><button id="simulate" class="simbutton">↻ ${simulationRuns?'Simulate again':'Simulate election'}</button><span id="simstatus" role="status" aria-live="polite">${simulationSummary()}</span></div>${swingControlsHtml()}<p class="sim-scenarios">Starting margins: Ossoff +8 · Cooper +12. Three-way races: Montana (Bodnar / Alme / Bankhead) and Alaska (Peltola / incumbent Dan S. Sullivan / Daniel J. Sullivan Jr.). Click a state for the baseline and simulated shares.</p>${swingSummaryHtml()}`:''}<svg class="map" viewBox="-15 -5 1005 625" aria-label="${c.name}, 2026 Senate races"><defs>${['D','R'].map(k=>`<pattern id="assumed-${c.id}-${k}" patternUnits="userSpaceOnUse" width="10" height="10" patternTransform="rotate(35)"><rect width="10" height="10" fill="${palette[k]}"/><rect width="2" height="10" fill="#fff" opacity=".3"/></pattern>`).join('')}</defs>${geography.filter(g=>g.name!=='District of Columbia').map(g=>{const col=color(c.id,g.name),active=!!candidates[g.name];return `<path class="state" d="${g.path}" fill="${c.id==='poll'&&active&&!polls[g.name]&&col!=='U'?`url(#assumed-${c.id}-${col})`:palette[col]}" data-none="${!active}" ${active?`tabindex="0" role="button" data-map="${c.id}" data-state="${esc(g.name)}" aria-label="${esc(g.name)}: ${col==='U'?'Uncalled':col}${isScoredMap(c.id)?' · '+accuracyLabels[accuracyStatus(c.id,g.name)]:''}"`:''}><title>${g.name} · ${active?(c.id==='current'?(col==='D'?'Democratic-held':'Republican-held'):c.id==='poll'?scenarioLabel(g.name):c.id==='sim'?simulationResult(g.name):(picks[c.id][g.name]||'Choose a candidate'))+(isScoredMap(c.id)?' · '+accuracyLabels[accuracyStatus(c.id,g.name)]:''):'No Senate election in 2026'}</title></path>${active?`<text x="${g.x}" y="${g.y+4}" text-anchor="middle">${ab[g.name]||''}</text>${accuracyMarker(c.id,g)}`:''}`}).join('')}</svg><div class="cardfoot"><div class="tallies" aria-label="Full Senate totals">${tally(t)}</div>${['shaurya','shipra'].includes(c.id)?`<button data-reset="${c.id}">Reset picks</button>`:`<span class="fine">Full Senate · 100 seats</span>`}</div><div class="seats" aria-hidden="true">${['D','O','U','R'].map(k=>`<span style="width:${t[k]}%;background:${palette[k]}"></span>`).join('')}</div></article>`}).join('');const simButton=document.getElementById('simulate');wireSwingControls();if(simButton)simButton.onclick=()=>{const field=document.getElementById('swingvalue');if(swingMode==='fixed'&&field){if(field.value.trim()===''||!field.checkValidity()){field.reportValidity();field.focus();return}if(!setSwing('fixed',Number(field.value)))return}simulateElection();renderMaps();document.getElementById('simulate').focus({preventScroll:true})};document.querySelectorAll('[data-map]').forEach(el=>{el.onclick=()=>openRace(el.dataset.map,el.dataset.state);el.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();el.click()}}});document.querySelectorAll('[data-reset]').forEach(el=>el.onclick=()=>{const who=el.dataset.reset;document.getElementById('detailcontent').innerHTML=`<div class="eyebrow">RESET PREDICTIONS</div><h2>Clear ${who==='shaurya'?'Shaurya':'Shipra'}’s picks?</h2><p>This removes all 35 predictions for this map in this browser.</p><button class="choice" id="confirmreset">Clear picks</button>`;document.getElementById('confirmreset').onclick=()=>{picks[who]={};save();renderMaps();renderTable();document.getElementById('detail').close()};document.getElementById('detail').showModal()})}
function options(state,who){return `<option value="">Choose candidate</option>`+candidates[state].map(([n,p])=>`<option value="${esc(n)}" ${picks[who][state]===n?'selected':''}>${esc(n)} (${party(p)})</option>`).join('')}
function pollHtml(state){const p=polls[state];if(!p){const n=expectedWinner(state);return `<span class="pollpill assumption">${n?esc(n)+' expected':'No clear favorite'}</span><span class="pollsource">No verified Siena or CNN/SSRS poll<br>Assumption · ${esc(ratings[state]||'Unrated')}</span><a class="pollsource" href="${ratingsSource}" target="_blank" rel="noopener">Cook rating · Oct 30, 2026 ↗</a>`;}const n=winner(state),v=Object.values(p.v).sort((a,b)=>b-a);return `<span class="pollpill">${n?esc(n.split(' ').slice(-1)[0])+' +'+Number((v[0]-v[1]).toFixed(2)):'Tied · uncalled'}</span><span class="pollsource">${p.releases.length>1?'Equal-weight average · '+p.releases.length+' polls':'Single poll'}</span>${p.releases.map(r=>`${r.url?`<a class="pollsource" href="${r.url}" target="_blank" rel="noopener">`:'<span class="pollsource">'}${esc(r.label)}${r.url?' ↗':''} · ${r.date}${r.fieldwork?'<br>Fieldwork: '+r.fieldwork:''}<br>${Object.entries(r.v).map(([name,share])=>esc(name)+' '+share+'%').join(' · ')}${r.url?'</a>':'</span>'}`).join('')}`}

function renderTable(){const q=document.getElementById('search').value.toLowerCase(),filter=document.getElementById('pollfilter').value;const states=Object.keys(candidates).sort().filter(s=>(s+' '+candidates[s].flat().join(' ')).toLowerCase().includes(q)).filter(s=>filter==='all'||filter==='polled'&&polls[s]||filter==='unpolled'&&!polls[s]||filter==='special'&&['Florida','Ohio'].includes(s));document.getElementById('rows').innerHTML=states.map(s=>`<tr><td><strong>${s}</strong><small>${demStates.includes(s)?'Democratic-held':'Republican-held'}</small>${['Florida','Ohio'].includes(s)?'<span class="special">SPECIAL ELECTION</span>':''}</td><td>${candidates[s].map(([n,p])=>`<div class="candidate"><i class="partydot ${party(p)}"></i><span>${esc(n)} <span style="color:var(--muted)">(${esc(p)})</span></span>${polls[s]?.v[n]!==undefined?`<span class="pollpct">${pollShare(s,n)}</span>`:''}</div>`).join('')}</td><td>${pollHtml(s)}</td>${['shaurya','shipra'].map(w=>`<td><select data-who="${w}" data-state="${esc(s)}" aria-label="${w==='shaurya'?'Shaurya':'Shipra'}’s pick for ${s}">${options(s,w)}</select></td>`).join('')}</tr>`).join('')||'<tr><td colspan="5">No races match your search.</td></tr>';document.getElementById('rowcount').textContent=`Showing ${states.length} of 35 races · Percentages are poll support, not chances of winning.`;document.querySelectorAll('td select').forEach(el=>el.onchange=()=>setPick(el.dataset.who,el.dataset.state,el.value))}
function openRace(who,state){
 const personal=['shaurya','shipra'].includes(who),sim=who==='sim';
 document.getElementById('detailcontent').innerHTML=`<div class="eyebrow">${sim?'SIMULATED STATE RESULTS':personal?(who==='shaurya'?'SHAURYA’S':'SHIPRA’S')+' MAP':'2026 SENATE RACE'}</div><h2>${state}${['Florida','Ohio'].includes(state)?' · Special':''}</h2><p>Current seat: ${demStates.includes(state)?'Democratic':'Republican'}${personal?' · Choose your predicted winner.':''}</p>${accuracyDetailHtml(who,state)}${sim?simulatedResultsHtml(state):candidates[state].map(([n,p])=>personal?`<button class="choice" data-choice="${esc(n)}" aria-pressed="${picks[who][state]===n}"><i class="partydot ${party(p)}"></i> ${esc(n)} <small>(${esc(p)})</small></button>`:`<p><i class="partydot ${party(p)}"></i> ${esc(n)} (${esc(p)}) ${polls[state]?.v[n]!==undefined?' — '+pollShare(state,n):''}</p>`).join('')}${personal?'<button class="choice" data-choice="">Leave uncalled / clear pick</button>':''}<hr style="border:0;border-top:1px solid var(--line);margin-top:20px">${sim?'<h3>Reference data · poll or rating (simulator overrides shown above)</h3>':''}<div>${pollHtml(state)}</div>`;
 document.querySelectorAll('[data-choice]').forEach(el=>el.onclick=()=>{setPick(who,state,el.dataset.choice);document.getElementById('detail').close()});
 document.getElementById('detail').showModal();
}

document.querySelector('.close').onclick=()=>document.getElementById('detail').close();document.getElementById('detail').onclick=e=>{if(e.target===e.currentTarget){const r=e.currentTarget.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.currentTarget.close()}};document.getElementById('search').oninput=renderTable;document.getElementById('pollfilter').onchange=renderTable;
document.getElementById('export').onclick=()=>{const quote=s=>'"'+String(s??'').replaceAll('"','""')+'"';const rows=[['State','Current seat party','Shaurya pick','Shipra pick','Polling leader','Poll release dates','Scenario winner','Scenario basis'],...Object.keys(candidates).sort().map(s=>[s,demStates.includes(s)?'Democratic':'Republican',picks.shaurya[s]||'',picks.shipra[s]||'',winner(s)||'Uncalled',polls[s]?.date||'',scenarioWinner(s)||'Uncalled',polls[s]?polls[s].releases.map(p=>p.label).join(' + ')+(polls[s].releases.length>1?'; equal-weight average':'; single poll'):(ratings[s]||'Unrated')+'; rating assumption'])];const url=URL.createObjectURL(new Blob([rows.map(r=>r.map(quote).join(',')).join('\r\n')],{type:'text/csv'}));const a=document.createElement('a');a.href=url;a.download='midterm-uj-predictions.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};
Promise.all([fetch('candidates.json').then(r=>r.json()),fetch('map.json').then(r=>r.json())]).then(([c,g])=>{candidates=c;geography=g;for(const who of ['shaurya','shipra'])for(const s in picks[who])if(!c[s]?.some(x=>x[0]===picks[who][s]))delete picks[who][s];renderMaps();renderTable()}).catch(()=>{document.getElementById('mapgrid').innerHTML='<p>Could not load election data. Please reload the page.</p>'});
