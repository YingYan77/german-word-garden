const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {randomUUID}=require('node:crypto');
const root=path.resolve(__dirname,'..');
const seed=JSON.parse(fs.readFileSync(path.join(root,'source/words.json'),'utf8'));
const code=['app.js','quiz.js'].map(p=>fs.readFileSync(path.join(root,'source',p),'utf8')).join('\n');
const fields=['word','type','pron','en','cn','de','exen','excn','sourceDe','sourceEn','sourceCn','learningLabel','addedOn','quizDe','quizEn','quizCn','verbPresent','verbPast','verbPerfect'];

// A deliberately small DOM adapter: tests exercise real event handlers and persistence,
// not a second implementation of quiz grading or mastery.
function boot(saved={},failWrites=false){
 const nodes={},store={...saved};let exported;
 const el=()=>({value:'',textContent:'',innerHTML:'',style:{},dataset:{},hidden:false,attrs:{},click(){},focus(){},setAttribute(k,v){this.attrs[k]=v},showModal(){this.open=true},close(){this.open=false}});
 const get=s=>nodes[s]??=el();
 get('#vocabulary-data').textContent=JSON.stringify(seed);
 get('#form').elements=Object.fromEntries(fields.map(k=>[k,el()]));
 get('#form').reset=()=>fields.forEach(k=>get('#form').elements[k].value=k==='type'?'adj':'');
 nodes['#form select']=get('#form').elements.type;
 get('#quiz-mode').value='mixed';get('#quiz-language').value='either';get('#quiz-length').value='10';
 const context={document:{querySelector:get,getElementById:id=>get('#'+id),querySelectorAll:()=>[],documentElement:{},createElement:el},localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{if(failWrites)throw Error('quota');store[k]=v}},crypto:{randomUUID},setTimeout:()=>{},FormData:class{constructor(form){return Object.entries(form.elements).map(([k,v])=>[k,v.value])}},Blob,URL:{createObjectURL:b=>{exported=b;return 'blob:test'},revokeObjectURL(){}},window:{},confirm:()=>true};
 vm.createContext(context);vm.runInContext(code,context);
 return {get,store,run:s=>vm.runInContext(s,context),exported:()=>exported};
}
function answer(app,correct=true,unknown=false){
 app.get('#quiz-answer').value=app.run('currentQuestion().answers[0]');
 app.run(`revealAnswer(${unknown})`);app.run(`gradeAnswer(${correct})`);
}
async function importBackup(app,data){await app.get('#file').onchange({target:{files:[{size:JSON.stringify(data).length,text:async()=>JSON.stringify(data)}],value:'file'}})}
function event(w,kind,correct,index){return {id:'test-'+index,wordKey:JSON.stringify([w.word.normalize('NFKC').trim().toLocaleLowerCase(),w.type]),kind,correct,at:new Date(Date.UTC(2026,9,17,10,0,index)).toISOString()}}

test('every existing word has concise answers and both translation directions',()=>{
 const app=boot();assert.equal(app.run("makeQuestions(words,'deToMeaning','en').length"),seed.length);
 assert.equal(app.run("makeQuestions(words,'meaningToDe','cn').length"),seed.length);
 assert.ok(seed.every(w=>w.quizDe&&w.quizEn&&w.quizCn));
 const q=app.run("makeQuestions(words,'meaningToDe','cn')[0]");assert.equal(q.promptLang,'zh-CN');assert.ok(!q.prompt.includes(q.answers[0]));
});
test('all verbs have three complete tense tests, including separable and reflexive forms',()=>{
 const app=boot(),verbs=seed.filter(w=>w.type==='verb');assert.ok(verbs.length>=7);
 assert.equal(app.run("makeQuestions(words,'verbs','en').length"),verbs.length*3);
 assert.equal(seed.find(w=>w.id==='hineinspringen-verb').verbPerfect,'er ist hineingesprungen');
 assert.equal(seed.find(w=>w.id==='entwickeln-verb').verbPast,'er entwickelte sich');
 assert.equal(seed.find(w=>w.id==='sich-treffen-verb').verbPerfect,'er hat sich getroffen');
});
test('question builder never invents missing verb forms',()=>{
 const app=boot();assert.equal(app.run("makeQuestions([{word:'testen',type:'verb',en:'test',cn:'测试'}],'verbs','en').length"),0);
});
test('reference matching accepts case, punctuation, English to, Chinese and Swiss ss',()=>{
 const app=boot();assert.equal(app.run("answerMatches(' MOVE! ',{kind:'deToMeaning',answers:['to move']})"),true);
 assert.equal(app.run("answerMatches('跳进去。',{kind:'deToMeaning',answers:['跳进去']})"),true);
 assert.equal(app.run("answerMatches('ausserhalb',{kind:'meaningToDe',answers:['außerhalb']})"),true);
 assert.equal(app.run("answerMatches('he sprang hinein',{kind:'past',answers:['er sprang hinein']})"),false);
 assert.equal(app.run("answerMatches('to',{kind:'deToMeaning',answers:['to move']})"),false);
});
test('practice respects date, source, category and text filters',()=>{
 const app=boot();app.get('#search').value='hineinspringen';app.get('#filter-source').onchange({target:{value:'label:B1'}});
 app.get('#filter-from').value='2026-10-17';app.get('#filter-to').value='2026-10-17';
 app.run('startQuiz()');assert.equal(app.run('quizSession.questions.length'),5);
 assert.equal(app.run("quizSession.questions.every(q=>q.word.id==='hineinspringen-verb')"),true);
});
test('reference answers are hidden until an answer is submitted',()=>{
 const app=boot();app.run('startQuiz()');assert.ok(!app.get('#practice-body').innerHTML.includes('class="quiz-feedback"'));
 const before=app.run('practiceAttempts.length');app.run('revealAnswer()');assert.equal(app.run('quizSession.revealed'),false);
 app.get('#quiz-answer').value='A synonym';app.run('revealAnswer()');assert.ok(app.get('#practice-body').innerHTML.includes('class="quiz-feedback"'));
 assert.equal(app.run('practiceAttempts.length'),before);
});
test('manual synonym acceptance records one attempt, with duplicate clicks ignored',()=>{
 const app=boot();app.run('startQuiz()');app.get('#quiz-answer').value='My valid synonym';app.run('revealAnswer();gradeAnswer(true);gradeAnswer(false)');
 assert.equal(app.run('practiceAttempts.length'),1);assert.equal(app.run('quizSession.correct'),1);
 assert.equal(app.run('practiceAttempts[0].correct'),true);
});
test('unknown answers count as misses even if called with a correct grade',()=>{
 const app=boot();app.run('startQuiz();revealAnswer(true);gradeAnswer(true)');assert.equal(app.run('practiceAttempts[0].correct'),false);
 assert.equal(app.run('quizSession.correct'),0);
});
test('session advances only after grading and retains earlier records when ended',()=>{
 const app=boot();app.run('startQuiz();nextQuestion()');assert.equal(app.run('quizSession.index'),0);
 answer(app);app.run('nextQuestion()');assert.equal(app.run('quizSession.index'),1);
 app.run('endQuiz()');assert.equal(app.run('quizSession.ended'),true);assert.equal(app.run('practiceAttempts.length'),1);
});
test('mastery requires evidence in both translation directions, not just high overall accuracy',()=>{
 const w=seed.find(w=>w.type==='noun'),attempts=Array.from({length:3},(_,i)=>event(w,'deToMeaning',true,i));
 const app=boot({'wortgarten-practice-v1':JSON.stringify({version:1,attempts})});
 assert.equal(app.run(`wordStatus(words.find(w=>w.id==='${w.id}'))`),'learning');
 const more=Array.from({length:3},(_,i)=>event(w,'meaningToDe',true,i+3));
 const mastered=boot({'wortgarten-practice-v1':JSON.stringify({version:1,attempts:[...attempts,...more]})});
 assert.equal(mastered.run(`wordStatus(words.find(w=>w.id==='${w.id}'))`),'mastered');
});
test('verb mastery requires all three tenses as well as both translation directions',()=>{
 const w=seed.find(w=>w.type==='verb');let index=0;
 const attempts=['deToMeaning','meaningToDe'].flatMap(k=>Array.from({length:3},()=>event(w,k,true,index++)));
 let app=boot({'wortgarten-practice-v1':JSON.stringify({version:1,attempts})});assert.equal(app.run(`wordStatus(words.find(w=>w.id==='${w.id}'))`),'learning');
 for(const k of ['present','past','perfect'])for(let i=0;i<2;i++)attempts.push(event(w,k,true,index++));
 app=boot({'wortgarten-practice-v1':JSON.stringify({version:1,attempts})});assert.equal(app.run(`wordStatus(words.find(w=>w.id==='${w.id}'))`),'mastered');
});
test('weak skills cannot be hidden by correct answers in other skills',()=>{
 const w=seed[0],attempts=[event(w,'meaningToDe',false,0),event(w,'meaningToDe',false,1),...Array.from({length:10},(_,i)=>event(w,'deToMeaning',true,i+2))];
 const app=boot({'wortgarten-practice-v1':JSON.stringify({version:1,attempts})});
 assert.equal(app.run('wordStatus(words[0])'),'difficult');app.run('startQuiz(true)');assert.equal(app.run('quizSession.questions.every(q=>wordStatus(q.word)==="difficult")'),true);
});
test('practice and progress survive reload',()=>{
 const app=boot();app.run('startQuiz()');answer(app);const reloaded=boot(app.store);
 assert.equal(reloaded.run('practiceAttempts.length'),1);assert.equal(reloaded.run('practiceAttempts[0].correct'),true);
});
test('backup round trip preserves practice and repeat imports cannot double-count',async()=>{
 const app=boot();app.run('startQuiz()');answer(app);app.get('#export').onclick();const data=JSON.parse(await app.exported().text());
 assert.equal(data.version,2);assert.equal(data.practice.attempts.length,1);
 const other=boot();await importBackup(other,data);await importBackup(other,data);
 assert.equal(other.run('practiceAttempts.length'),1);assert.equal(other.run('words.length'),seed.length);
 assert.equal(boot(other.store).run('practiceAttempts.length'),1);
});
test('separate device histories merge, but conflicting IDs are rejected',async()=>{
 const app=boot(),a=event(seed[0],'deToMeaning',true,0),b=event(seed[0],'meaningToDe',false,1);
 await importBackup(app,{words:[],practice:{version:1,attempts:[a]}});
 await importBackup(app,{words:[],practice:{version:1,attempts:[b]}});assert.equal(app.run('practiceAttempts.length'),2);
 await importBackup(app,{words:[],practice:{version:1,attempts:[{...a,correct:false}]}});
 assert.equal(app.run('practiceAttempts.length'),2);assert.equal(app.get('#notice').textContent,'Invalid backup file');
});
test('old word-only backups remain compatible and imported cards keep quiz fields',async()=>{
 const app=boot(),w={...seed[0],word:'New card',quizEn:'new answer',verbPast:'er testete'};
 await importBackup(app,{version:1,words:[w]});assert.equal(app.run('words[words.length-1].quizEn'),'new answer');
 assert.equal(app.run('practiceAttempts.length'),0);
});
test('invalid practice data rejects the whole import before adding words',async()=>{
 const app=boot();await importBackup(app,{words:[{...seed[0],word:'Should not import'}],practice:{version:1,attempts:[{...event(seed[0],'past',true,0),correct:'yes'}]}});
 assert.equal(app.run('words.length'),seed.length);assert.equal(app.run('practiceAttempts.length'),0);
});
test('storage failure never claims that imported progress was saved',async()=>{
 const app=boot({},true);await importBackup(app,{words:[],practice:{version:1,attempts:[event(seed[0],'past',true,0)]}});
 assert.equal(app.get('#notice').textContent,'Could not save. Please export a backup.');
});
test('corrupt practice storage is retained for recovery, not overwritten',async()=>{
 const raw='{broken',app=boot({'wortgarten-practice-v1':raw});app.run('startQuiz()');assert.equal(app.run('quizSession'),null);
 app.get('#export').onclick();const data=JSON.parse(await app.exported().text());assert.equal(data.practiceRecovery,raw);
 assert.equal(app.store['wortgarten-practice-v1'],raw);
});
test('existing saved card edits remain while new quiz metadata is supplied',()=>{
 const saved=seed.map(w=>{const x={...w};for(const k of ['quizDe','quizEn','quizCn','verbPresent','verbPast','verbPerfect'])delete x[k];return x});saved[0].en='My edited meaning';
 const app=boot({'wortgarten-offline-words':JSON.stringify(saved)});assert.equal(app.run('words[0].en'),'My edited meaning');assert.equal(app.run('words[0].quizEn'),seed[0].quizEn);
});
test('interface language changes preserve typed answers and update practice labels',()=>{
 const app=boot();app.run('startQuiz()');app.get('#quiz-answer').value='My unfinished answer';app.get('#locale').onchange({target:{value:'cn'}});
 assert.equal(app.run('quizSession.answer'),'My unfinished answer');assert.match(app.get('#practice-body').innerHTML,/你的答案/);
});
test('renaming a word preserves progress without changing immutable attempt records',async()=>{
 const app=boot({'wortgarten-practice-v1':JSON.stringify({version:1,attempts:[event(seed[0],'deToMeaning',true,0)]})});
 const originalAttempt=app.run('JSON.stringify(practiceAttempts[0])');
 app.run("openEditor(words[0])");app.get('#form').elements.word.value='Renamed vocabulary';
 app.get('#form').onsubmit({preventDefault(){},target:app.get('#form')});
 assert.equal(app.run('wordAttempts(words[0]).length'),1);assert.equal(app.run('JSON.stringify(practiceAttempts[0])'),originalAttempt);
 const original=JSON.parse(originalAttempt);
 await importBackup(app,{words:[],practice:{version:1,attempts:[original]}});assert.equal(app.run('practiceAttempts.length'),1);
 app.get('#export').onclick();const data=JSON.parse(await app.exported().text()),other=boot();await importBackup(other,data);
 assert.equal(other.run("wordAttempts(words.find(w=>w.word==='Renamed vocabulary')).length"),1);
});
test('a failed skill removes mastered status even when cumulative accuracy stays high',()=>{
 const w=seed.find(w=>w.type==='noun');let index=0;
 const attempts=['deToMeaning','meaningToDe'].flatMap(k=>Array.from({length:10},()=>event(w,k,true,index++)));
 attempts.push(event(w,'meaningToDe',false,index++));
 const app=boot({'wortgarten-practice-v1':JSON.stringify({version:1,attempts})});
 assert.equal(app.run(`wordStatus(words.find(w=>w.id==='${w.id}'))`),'learning');
});
test('practice on an empty selection leaves current records unchanged',()=>{
 const app=boot();app.get('#search').value='not-a-vocabulary-word';app.run('startQuiz()');
 assert.equal(app.run('quizSession'),null);assert.equal(app.run('practiceAttempts.length'),0);
});
test('switching panes preserves an unfinished answer and keeps notebook hints hidden',()=>{
 const app=boot();app.run('startQuiz()');app.get('#quiz-answer').value='unfinished';app.run("setPane('progress');setPane('practice')");
 assert.equal(app.run('quizSession.answer'),'unfinished');assert.equal(app.get('#notebook-pane').hidden,true);assert.equal(app.get('#progress-pane').hidden,true);
});

test('new dated cards keep their date during first-run date migration',()=>{
 const app=boot();
 assert.equal(app.run("words.find(w=>w.id==='bankenviertel-noun').addedOn"),'2026-10-23');
 assert.ok(app.get('#cards').innerHTML.includes('<time datetime="2026-10-23">'));
});
test('new embedded card merges into saved words with its date and user edits intact',()=>{
 const previous=seed.filter(w=>w.id!=='bankenviertel-noun').map(w=>({...w}));
 previous[0].en='My personal meaning';
 const app=boot({'wortgarten-offline-words':JSON.stringify(previous),'wortgarten-offline-embedded-ids':JSON.stringify(previous.map(w=>w.id)),'wortgarten-start-date-2026-10-17':'done'});
 assert.equal(app.run("words.filter(w=>w.id==='bankenviertel-noun').length"),1);
 assert.equal(app.run("words.find(w=>w.id==='bankenviertel-noun').addedOn"),'2026-10-23');
 assert.equal(app.run('words[0].en'),'My personal meaning');
 const reloaded=boot(app.store);
 assert.equal(reloaded.run("words.filter(w=>w.id==='bankenviertel-noun').length"),1);
});
