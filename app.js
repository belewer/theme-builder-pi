/* Pi Theme Builder: deliberately dependency-free and browser-only. */
const SCHEMA = 'https://raw.githubusercontent.com/earendil-works/pi/main/packages/coding-agent/src/modes/interactive/theme/theme-schema.json';
const groups = {
  Core: ['accent','border','borderAccent','borderMuted','success','error','warning','muted','dim','text','thinkingText','scrollbarTrack','scrollbarThumb'],
  'Backgrounds & content': ['selectedBg','searchMatchBg','searchMatchText','userMessageBg','userMessageText','customMessageBg','customMessageText','customMessageLabel','toolPendingBg','toolSuccessBg','toolErrorBg','toolTitle','toolOutput'],
  Markdown: ['mdHeading','mdLink','mdLinkUrl','mdCode','mdCodeBlock','mdCodeBlockBorder','mdQuote','mdQuoteBorder','mdHr','mdListBullet'],
  'Tool diffs': ['toolDiffAdded','toolDiffRemoved','toolDiffContext'],
  Syntax: ['syntaxComment','syntaxKeyword','syntaxFunction','syntaxVariable','syntaxString','syntaxNumber','syntaxType','syntaxOperator','syntaxPunctuation'],
  'Thinking borders': ['thinkingOff','thinkingMinimal','thinkingLow','thinkingMedium','thinkingHigh','thinkingXhigh','thinkingMax'],
  'Bash mode': ['bashMode']
};
const allTokens = Object.values(groups).flat();
const optionalTokens = new Set(['scrollbarTrack','scrollbarThumb','searchMatchBg','searchMatchText','thinkingMax']);
const desc = {
  accent:'Logo, selected items, cursor', border:'Normal borders', borderAccent:'Highlighted borders', borderMuted:'Subtle editor borders', success:'Success states', error:'Error states', warning:'Warnings', muted:'Secondary text', dim:'Tertiary text', text:'Default text', thinkingText:'Thinking block text', scrollbarTrack:'Scrollbar track (optional)', scrollbarThumb:'Scrollbar thumb (optional)', selectedBg:'Selected line background', searchMatchBg:'Search match background (optional)', searchMatchText:'Search match text (optional)', userMessageBg:'User message background', userMessageText:'User message text', customMessageBg:'Extension message background', customMessageText:'Extension message text', customMessageLabel:'Extension message label', toolPendingBg:'Pending tool box', toolSuccessBg:'Successful tool box', toolErrorBg:'Failed tool box', toolTitle:'Tool title', toolOutput:'Tool output', mdHeading:'Markdown headings', mdLink:'Markdown link text', mdLinkUrl:'Link URL', mdCode:'Inline code', mdCodeBlock:'Code block content', mdCodeBlockBorder:'Code fence border', mdQuote:'Blockquote text', mdQuoteBorder:'Blockquote border', mdHr:'Horizontal rule', mdListBullet:'List bullets', toolDiffAdded:'Added diff lines', toolDiffRemoved:'Removed diff lines', toolDiffContext:'Context diff lines', syntaxComment:'Comments', syntaxKeyword:'Keywords', syntaxFunction:'Function names', syntaxVariable:'Variables', syntaxString:'Strings', syntaxNumber:'Numbers', syntaxType:'Types', syntaxOperator:'Operators', syntaxPunctuation:'Punctuation', thinkingOff:'Thinking off border', thinkingMinimal:'Minimal thinking border', thinkingLow:'Low thinking border', thinkingMedium:'Medium thinking border', thinkingHigh:'High thinking border', thinkingXhigh:'Extra-high thinking border', thinkingMax:'Maximum thinking border', bashMode:'Bash mode editor border'
};
const dark = {accent:'#7dd3fc',border:'#334155',borderAccent:'#22d3ee',borderMuted:'#263449',success:'#4ade80',error:'#fb7185',warning:'#fbbf24',muted:'#94a3b8',dim:'#64748b',text:'',thinkingText:'#cbd5e1',scrollbarTrack:238,scrollbarThumb:244,selectedBg:'#203047',searchMatchBg:'#594b19',searchMatchText:'',userMessageBg:'#172b3c',userMessageText:'',customMessageBg:'#1d2433',customMessageText:'',customMessageLabel:'#c084fc',toolPendingBg:'#17253b',toolSuccessBg:'#173322',toolErrorBg:'#3a1d29',toolTitle:'#67e8f9',toolOutput:'',mdHeading:'#f0abfc',mdLink:'#7dd3fc',mdLinkUrl:'#94a3b8',mdCode:'#fbbf24',mdCodeBlock:'#dbeafe',mdCodeBlockBorder:'#475569',mdQuote:'#a5b4fc',mdQuoteBorder:'#6366f1',mdHr:'#475569',mdListBullet:'#67e8f9',toolDiffAdded:'#4ade80',toolDiffRemoved:'#fb7185',toolDiffContext:'#94a3b8',syntaxComment:'#64748b',syntaxKeyword:'#c084fc',syntaxFunction:'#7dd3fc',syntaxVariable:'#fbbf24',syntaxString:'#86efac',syntaxNumber:'#f0abfc',syntaxType:'#67e8f9',syntaxOperator:'#c084fc',syntaxPunctuation:'#94a3b8',thinkingOff:'#334155',thinkingMinimal:'#475569',thinkingLow:'#38bdf8',thinkingMedium:'#22d3ee',thinkingHigh:'#a78bfa',thinkingXhigh:'#f472b6',thinkingMax:'#fb7185',bashMode:'#fbbf24'};
const light = {...dark,accent:'#0369a1',border:'#94a3b8',borderAccent:'#0284c7',borderMuted:'#cbd5e1',success:'#15803d',error:'#be123c',warning:'#a16207',muted:'#475569',dim:'#64748b',thinkingText:'#334155',selectedBg:'#dbeafe',userMessageBg:'#e0f2fe',userMessageText:'#0f172a',customMessageBg:'#f3e8ff',customMessageText:'#1e1b4b',toolPendingBg:'#e0f2fe',toolSuccessBg:'#dcfce7',toolErrorBg:'#ffe4e6',mdHeading:'#9d174d',mdLink:'#0369a1',mdLinkUrl:'#475569',mdCode:'#a16207',mdCodeBlock:'#1e293b',mdCodeBlockBorder:'#64748b',mdQuote:'#4338ca',mdQuoteBorder:'#6366f1',syntaxKeyword:'#7e22ce',syntaxFunction:'#0369a1',syntaxVariable:'#a16207',syntaxString:'#15803d',syntaxNumber:'#be185d',syntaxType:'#0e7490'};
const modeFor = {};
Object.assign(modeFor, {accent:'states',border:'states',borderAccent:'states',borderMuted:'states',success:'states',error:'states',warning:'states',muted:'states',dim:'states',text:'session',thinkingText:'thinking',scrollbarTrack:'session',scrollbarThumb:'session',selectedBg:'states',searchMatchBg:'states',searchMatchText:'states',userMessageBg:'session',userMessageText:'session',customMessageBg:'session',customMessageText:'session',customMessageLabel:'session',toolPendingBg:'session',toolSuccessBg:'session',toolErrorBg:'session',toolTitle:'session',toolOutput:'session',mdHeading:'markdown',mdLink:'markdown',mdLinkUrl:'markdown',mdCode:'markdown',mdCodeBlock:'markdown',mdCodeBlockBorder:'markdown',mdQuote:'markdown',mdQuoteBorder:'markdown',mdHr:'markdown',mdListBullet:'markdown',toolDiffAdded:'session',toolDiffRemoved:'session',toolDiffContext:'session',syntaxComment:'markdown',syntaxKeyword:'markdown',syntaxFunction:'markdown',syntaxVariable:'markdown',syntaxString:'markdown',syntaxNumber:'markdown',syntaxType:'markdown',syntaxOperator:'markdown',syntaxPunctuation:'markdown',thinkingOff:'thinking',thinkingMinimal:'thinking',thinkingLow:'thinking',thinkingMedium:'thinking',thinkingHigh:'thinking',thinkingXhigh:'thinking',thinkingMax:'thinking',bashMode:'thinking'});
const tabs = [['session','Full Session'],['states','State gallery'],['markdown','Syntax / Markdown'],['thinking','Thinking / Bash'],['html','HTML export']];
const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const make = (tag, className, text) => { const node = document.createElement(tag); if (className) node.className = className; if (text !== undefined) node.textContent = String(text); return node; };
let state = {name:'my-theme',vars:{},colors:{...dark},export:{pageBg:'#080b12',cardBg:'#101621',infoBg:'#19334a'}};
let history = [];
let activeMode = 'session';
let sessionState = {kind:'demo', name:'Built-in comprehensive demo', records:[]};
const limits = {bytes:5 * 1024 * 1024, records:2000, field:12000, output:16000};

function isPlainObject(value) { return value !== null && typeof value === 'object' && !Array.isArray(value); }
function isHex(value) { return typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value); }
function validScalar(value) { return value === '' || isHex(value) || (Number.isInteger(value) && value >= 0 && value <= 255); }
function snapshot() { history.push(JSON.stringify(state)); if (history.length > 30) history.shift(); }
function parseScalar(value) { const v = String(value).trim(); return /^\d+$/.test(v) ? Number(v) : v; }
function validateMap(map, vars, label) {
  if (!isPlainObject(map)) throw Error(label + ' must be a plain object');
  for (const [key,value] of Object.entries(map)) {
    if (validScalar(value)) continue;
    if (typeof value === 'string' && Object.prototype.hasOwnProperty.call(vars,value)) continue;
    throw Error('Invalid ' + label + ' value for ' + key);
  }
  for (const [key,value] of Object.entries(vars)) {
    if (!validScalar(value) && !(typeof value === 'string' && Object.prototype.hasOwnProperty.call(vars,value))) throw Error('Invalid vars value for ' + key);
  }
  for (const key of Object.keys(vars)) {
    const seen = []; let value = key;
    while (typeof vars[value] === 'string' && !validScalar(vars[value])) {
      if (seen.includes(value)) throw Error('Variable cycle involving ' + value);
      seen.push(value);
      if (!Object.prototype.hasOwnProperty.call(vars,vars[value])) throw Error('Missing variable ' + vars[value]);
      value = vars[value];
    }
  }
}
function resolveVar(value, seen = []) {
  if (validScalar(value)) return value;
  if (typeof value !== 'string' || !Object.prototype.hasOwnProperty.call(state.vars,value) || seen.includes(value)) return '';
  return resolveVar(state.vars[value], seen.concat(value));
}
function resolve(name) { return resolveVar(state.colors[name]); }
function xtermRgb(number) {
  const n = Number(number);
  if (n < 16) return ['#000000','#800000','#008000','#808000','#000080','#800080','#008080','#c0c0c0','#808080','#ff0000','#00ff00','#ffff00','#0000ff','#ff00ff','#00ffff','#ffffff'][n];
  if (n >= 16 && n <= 231) { const i = n - 16, r = Math.floor(i / 36), g = Math.floor((i % 36) / 6), b = i % 6; const cube = [0,95,135,175,215,255]; return '#' + [cube[r],cube[g],cube[b]].map(v=>v.toString(16).padStart(2,'0')).join(''); }
  if (n >= 232 && n <= 255) { const v = 8 + (n - 232) * 10; return '#' + [v,v,v].map(x=>x.toString(16).padStart(2,'0')).join(''); }
  return '#808080';
}
const defaultColors = {text:'#d9e1ed',muted:'#8390a5',dim:'#637083',thinkingText:'#cbd5e1',toolOutput:'#c1cad8',searchMatchText:'#fff7cc',userMessageText:'#e7f7ff',customMessageText:'#f2eaff'};
const fallbackToken = {scrollbarTrack:'muted',scrollbarThumb:'text',searchMatchBg:'selectedBg',searchMatchText:'text',thinkingMax:'thinkingXhigh'};
function browserColor(name, seen = []) {
  const raw = resolve(name);
  if (typeof raw === 'number') return xtermRgb(raw);
  if (isHex(raw)) return raw;
  if (raw === '' && fallbackToken[name] && !seen.includes(name)) return browserColor(fallbackToken[name],seen.concat(name));
  return defaultColors[name] || '#172231';
}
function colorInfo(name) {
  const raw = resolve(name);
  return {color:browserColor(name), approximate:typeof raw === 'number' || raw === '', raw};
}
function setThemeVars(root) { for (const token of allTokens) root.style.setProperty('--' + token, browserColor(token)); }
function refCount(name) { let count = 0; for (const map of [state.colors,state.export || {},state.vars]) for (const value of Object.values(map)) if (value === name) count++; return count; }
function sortedVarNames() { return Object.keys(state.vars).sort((a,b)=>a.localeCompare(b,undefined,{sensitivity:'base',numeric:true})); }
function sortedVarsObject() { return Object.fromEntries(sortedVarNames().map(name=>[name,state.vars[name]])); }

function renderVars() {
  const list = $('#varsList'); list.replaceChildren();
  const entries = sortedVarNames().map(name=>[name,state.vars[name]]);
  if (!entries.length) { list.append(make('div','empty-vars','No variables yet — add one to build a reusable palette.')); return; }
  for (const [name,value] of entries) {
    const row = make('div','var-row'); const meta = make('div','var-meta');
    meta.append(make('strong','',name), make('span','',`${refCount(name)} reference${refCount(name) === 1 ? '' : 's'} · resolved ${resolveVar(value) || 'terminal default'}`));
    const swatch = make('span','var-swatch'); swatch.style.background = isHex(resolveVar(value)) ? resolveVar(value) : '#808080';
    const input = make('input','var-value'); input.value = value; input.dataset.var = name;
    const rename = make('button','', 'Rename'); rename.type = 'button'; rename.dataset.var = name; rename.className = 'rename-var';
    const remove = make('button','', 'Delete'); remove.type = 'button'; remove.dataset.var = name; remove.className = 'delete-var';
    row.append(meta,swatch,input,rename,remove); list.append(row);
    input.onchange = () => { const before = JSON.stringify(state); snapshot(); state.vars[name] = parseScalar(input.value); try { validateInteractive(); render(); } catch (error) { state = JSON.parse(before); history.pop(); toast('Invalid variable: ' + error.message); render(); } };
    rename.onclick = () => renameVariable(name);
    remove.onclick = () => deleteVariable(name);
  }
}
function renameVariable(oldName) {
  const next = prompt('New variable name',oldName)?.trim();
  if (!next || next === oldName) return;
  if (!/^[A-Za-z][A-Za-z0-9_-]*$/.test(next) || Object.prototype.hasOwnProperty.call(state.vars,next)) { toast('Use a unique variable name'); return; }
  const before = JSON.stringify(state); snapshot();
  for (const map of [state.colors,state.export || {}]) for (const key of Object.keys(map)) if (map[key] === oldName) map[key] = next;
  for (const key of Object.keys(state.vars)) if (key !== oldName && state.vars[key] === oldName) state.vars[key] = next;
  state.vars[next] = state.vars[oldName]; delete state.vars[oldName];
  try { validateInteractive(); render(); } catch (error) { state = JSON.parse(before); history.pop(); toast('Cannot rename variable: ' + error.message); render(); }
}
function deleteVariable(name) {
  const references = refCount(name);
  if (references && !confirm(`${name} is referenced ${references} time${references === 1 ? '' : 's'}. Replace references with its resolved value and delete it?`)) return;
  snapshot(); const direct = resolveVar(state.vars[name]);
  for (const map of [state.colors,state.export || {},state.vars]) for (const key of Object.keys(map)) if (map[key] === name) map[key] = direct;
  delete state.vars[name]; render();
}
function renderTokens() {
  const list = $('#tokenList'); list.replaceChildren(); const query = $('#search').value.toLowerCase(); let shown = 0;
  for (const [group,names] of Object.entries(groups)) {
    const visible = names.filter(name => !query || name.toLowerCase().includes(query) || (desc[name] || '').toLowerCase().includes(query)); if (!visible.length) continue;
    list.append(make('div','category',group));
    for (const name of visible) {
      shown++; const row = make('div','token'); row.dataset.token = name;
      const info = make('div'); info.append(make('div','token-name',name), make('div','token-desc',`${desc[name]} · resolved ${resolve(name) || 'terminal default'}`));
      const picker = make('input','swatch'); picker.type = 'color'; picker.value = isHex(browserColor(name)) ? browserColor(name) : '#808080'; picker.dataset.color = name; picker.title = 'Browser approximation; edit the value field for xterm numbers or defaults';
      const value = make('input','value'); value.value = state.colors[name] ?? ''; value.dataset.value = name;
      const assign = make('select','assign-var'); assign.dataset.value = name; assign.append(make('option','', 'Direct value')); for (const variable of sortedVarNames()) { const option = make('option','',variable); option.value = variable; option.selected = state.colors[name] === variable; assign.append(option); }
      row.append(info,picker,value,assign); list.append(row);
    }
  }
  const total = allTokens.length; $('#count').textContent = shown === total ? `${total} tokens` : `${shown} of ${total} tokens`;
  bindTokenEvents();
}
function bindTokenEvents() {
  $$('.token').forEach(row => row.onclick = event => { if (event.target.matches('input,select,option')) return; focusToken(row.dataset.token); });
  $$('.value').forEach(input => input.onchange = () => { snapshot(); state.colors[input.dataset.value] = parseScalar(input.value); render(); });
  $$('.assign-var').forEach(select => select.onchange = () => { snapshot(); const name = select.dataset.value; if (select.value) state.colors[name] = select.value; else state.colors[name] = resolve(name); render(); });
  $$('.swatch').forEach(input => { input.onfocus = () => { input.dataset.before = JSON.stringify(state); }; input.oninput = () => { state.colors[input.dataset.color] = input.value; const field = document.querySelector(`.value[data-value="${input.dataset.color}"]`); if (field) field.value = input.value; renderPreview(); }; input.onchange = () => { if (input.dataset.before) history.push(input.dataset.before); delete input.dataset.before; render(); }; });
}
function focusToken(token) { activeMode = modeFor[token] || 'session'; renderPreview(); const row = document.querySelector(`.token[data-token="${token}"]`); if (row) { $$('.token').forEach(x => x.classList.remove('focus')); row.classList.add('focus'); } requestAnimationFrame(() => { const target = document.querySelector(`#preview [data-focus="${token}"]`); if (target) { target.classList.add('focus-hit'); target.scrollIntoView({behavior:'smooth',block:'center'}); setTimeout(() => target.classList.remove('focus-hit'),1800); } }); }

function target(token, tag, text, className) { const node = make(tag || 'span', className || '', text); node.dataset.focus = token; const info = colorInfo(token); node.title = `${token}: ${info.raw === '' ? 'terminal default (browser approximation)' : info.approximate ? `${info.raw} (browser approximation)` : info.raw}`; return node; }
function line(children, className) { const node = make('div',className || 'line'); for (const child of children) node.append(typeof child === 'string' ? document.createTextNode(child) : child); return node; }
function section(title) { return make('h3','preview-section-title',title); }
function addTextRow(parent, token, text, className) { parent.append(line([target(token,'span',text,className)])); }

function buildSession(parent) {
  parent.append(make('div','session-meta','pi · '+state.name+' · ~/projects/demo · local preview'));
  if (sessionState.kind === 'imported') renderImportedRecords(parent,sessionState.records); else renderDemoRecords(parent);
  parent.append(section('Theme reference · Pi transcript surfaces'));
  parent.append(line([target('accent','span','◆','accent-mark'),' assistant · comprehensive rendering reference'], 'line assistant-line'));
  parent.append(line([target('text','span','Assistant prose uses the theme text token. Markdown below is intentionally representative.')], 'line'));
  const user = make('div','message user-message'); user.append(target('userMessageBg','strong','You'), document.createTextNode('  Please inspect the theme and explain the contrast. '), target('userMessageText','span','(user text)')); user.dataset.focus='userMessageBg'; parent.append(user);
  const assistant = make('div','assistant-message'); assistant.append(target('mdHeading','span','# A useful response', 'heading'), make('br'), document.createTextNode('A '), target('mdLink','a','link text','link'), document.createTextNode(' '), target('mdLinkUrl','span','https://example.dev/docs','url'), document.createTextNode(' with '), target('mdCode','code','inline code','code'), document.createTextNode(' and a careful explanation.')); parent.append(assistant);
  const quote = make('div','quote'); quote.append(target('mdQuoteBorder','span','│','quote-border'), document.createTextNode(' '), target('mdQuote','span','A quote can retain hierarchy without shouting.')); parent.append(quote);
  const list = make('div','list-example'); list.append(target('mdListBullet','span','•','bullet'), document.createTextNode(' first item  '), target('mdListBullet','span','•','bullet'), document.createTextNode(' second item')); parent.append(list);
  const hr = target('mdHr','div','────────────────────────────────────────','hr'); parent.append(hr);
  const code = make('div','code-block'); code.append(target('mdCodeBlockBorder','span','┌─ code fence ─────────────────────┐','code-fence'), make('br'), target('mdCodeBlock','span','const theme = loadTheme("my-theme");','code-block-text'), make('br'), target('mdCodeBlockBorder','span','└──────────────────────────────────┘','code-fence')); parent.append(code);
  const search = make('div','search-row'); search.append(target('searchMatchBg','span',' normal match ','search-match'), document.createTextNode(' and '), target('searchMatchText','span','current match','search-current')); parent.append(search);
  const selected = make('div','selected-row'); selected.append(target('selectedBg','span','›  Selected row · Continue with your theme','selected-content')); parent.append(selected);
  const custom = make('div','custom-message'); custom.append(target('customMessageLabel','strong','extension'), document.createTextNode('  '), target('customMessageText','span','Custom message from a local extension')); custom.dataset.focus='customMessageBg'; parent.append(custom);
  const toolPending = toolCard('toolPendingBg','◌','read_file','pending','waiting for tool result…'); parent.append(toolPending);
  const toolSuccess = toolCard('toolSuccessBg','✓','edit_file','success','applied 3 changes'); parent.append(toolSuccess);
  const toolError = toolCard('toolErrorBg','×','shell','error','command failed (exit 1)'); parent.append(toolError);
  const output = make('div','tool-output'); output.append(target('toolTitle','strong','tool output'), document.createTextNode('  '), target('toolOutput','span','3 lines · 1.2 KB')); parent.append(output);
  const hint = target('toolOutput','div','  ↳ press e to expand output  ·  output is collapsed','expanded-hint'); parent.append(hint);
  const diffs = make('div','diff'); diffs.append(target('toolDiffAdded','div','+ added line','diff-added'), target('toolDiffRemoved','div','- removed line','diff-removed'), target('toolDiffContext','div','  context line','diff-context')); parent.append(diffs);
  const states = make('div','state-strip'); states.append(target('success','span','success','state-success'), target('warning','span','warning','state-warning'), target('error','span','error','state-error'), target('muted','span','muted','state-muted'), target('dim','span','dim','state-dim')); parent.append(states);
  const scroll = make('div','scroll-approx'); scroll.append(document.createTextNode('scrollbar approximation '), target('scrollbarTrack','span','     ','scroll-track'), target('scrollbarThumb','span','██','scroll-thumb'), document.createTextNode('  (xterm values shown as browser RGB)')); parent.append(scroll);
}
function toolCard(bgToken, icon, name, className, detail) { const card = make('div','tool-card '+className); card.dataset.focus=bgToken; card.append(target(bgToken,'span',icon,'tool-icon'), document.createTextNode(' '), target('toolTitle','strong',name), document.createTextNode('  '), target('toolOutput','span',detail)); return card; }
function renderDemoRecords(parent) {
  const notice = make('div','demo-record'); notice.append(make('span','record-label','DEMO SESSION'), document.createTextNode('  A complete Pi-like conversation and state reference.')); parent.append(notice);
  for (const record of sessionState.records) renderRecord(parent,record);
}
function renderImportedRecords(parent, records) {
  const label = make('div','imported-label'); label.append(make('strong','',`READ-ONLY · ${sessionState.name}`), document.createTextNode('  Imported records are displayed locally; this browser cannot resume a Pi session.')); parent.append(label);
  if (!records.length) { parent.append(make('div','empty-vars','No renderable records found.')); return; }
  for (const record of records) renderRecord(parent,record);
}
function bounded(value, max = limits.output) { const text = typeof value === 'string' ? value : JSON.stringify(value); if (!text) return ''; return text.length > max ? text.slice(0,max) + ' … [truncated]' : text; }
function recordText(record) {
  const message = isPlainObject(record.message) ? record.message : record;
  const content = message.content ?? message.text ?? message.output ?? message.result ?? '';
  if (Array.isArray(content)) return content.map(part => isPlainObject(part) ? (part.text ?? part.content ?? part.thinking ?? (part.type === 'toolCall' ? `[tool call: ${part.name || part.toolName || 'tool'}]` : '') ?? '') : part).join('');
  return typeof content === 'string' ? content : bounded(content);
}
function recordToolCall(message) {
  if (message.toolCall || message.tool_calls) return message.toolCall || message.tool_calls;
  if (Array.isArray(message.content)) return message.content.filter(part => isPlainObject(part) && (part.type === 'toolCall' || part.type === 'tool_use'));
  return null;
}
function renderRecord(parent, record) {
  const message = isPlainObject(record.message) ? record.message : record; const role = String(message.role || '');
  const type = String(record.type || role || 'unknown');
  if ((type === 'message' || type === 'user' || type === 'assistant') && (role === 'user' || role === 'assistant' || type === 'user' || type === 'assistant')) {
    const card = make('div','record-card '+role); card.dataset.focus = role === 'user' ? 'userMessageBg' : 'text'; card.append(make('div','record-label',role));
    const content = recordText(record); card.append(make('div','record-content',bounded(content)));
    if (role === 'assistant' && (message.thinking || (Array.isArray(message.content) && message.content.some(x=>isPlainObject(x)&&x.type==='thinking')))) card.append(make('div','thinking-snippet',bounded(message.thinking || 'thinking…')));
    const toolCall = recordToolCall(message); if (toolCall) card.append(make('div','record-tool',bounded(toolCall)));
    parent.append(card); return;
  }
  const map = {toolResult:['tool-success','tool result'],tool:['tool-success','tool result'],bashExecution:['bash-record','bash execution'],custom:['custom-message','custom'],custom_message:['custom-message','custom message'],compaction:['record-muted','compaction'],branch_summary:['record-muted','branch summary'],model_change:['record-info','model change'],thinking_level_change:['record-info','thinking level'],label:['record-info','label'],session_info:['record-info','session info'],session:['record-info','session info']};
  const recordType = type === 'message' && role ? role : type;
  const config = map[recordType];
  if (config) { const card = make('div','record-card '+config[0]); card.dataset.focus = recordType === 'toolResult' || recordType === 'tool' ? 'toolSuccessBg' : recordType === 'bashExecution' ? 'bashMode' : recordType === 'custom' || recordType === 'custom_message' ? 'customMessageBg' : 'muted'; card.append(make('div','record-label',config[1]),make('div','record-content',bounded(recordText(record) || record.summary || record.output || record.command || record.message || record.model || record.level || record.label || '—'))); parent.append(card); return; }
  const generic = make('div','record-card generic-record'); generic.append(make('div','record-label','unknown record'),make('div','record-content',bounded(JSON.stringify(record)))); parent.append(generic);
}

function buildStates(parent) {
  parent.append(section('Selection and semantic state gallery'));
  const grid = make('div','state-grid');
  const entries = [['accent','◆ accent / cursor'],['border','normal border'],['borderAccent','focused border'],['borderMuted','muted border'],['selectedBg','› selected row'],['searchMatchBg','search match'],['searchMatchText','current match text'],['success','success'],['warning','warning'],['error','error'],['muted','muted text'],['dim','dim text']];
  for (const [token,label] of entries) { const card = make('div','state-card'); card.dataset.focus=token; if (['border','borderAccent','borderMuted'].includes(token)) card.style.borderColor=browserColor(token); if (['selectedBg','searchMatchBg'].includes(token)) card.style.background=browserColor(token); if (['accent','searchMatchText'].includes(token)) card.style.color=browserColor(token); card.append(target(token,'span',label,'state-sample')); grid.append(card); }
  parent.append(grid, section('Search and selected-row behavior'));
  const search = make('div','search-demo'); search.append(target('searchMatchBg','span','  match  ','search-match'),document.createTextNode(' normal result  '),target('searchMatchText','span','  current result  ','search-current')); parent.append(search);
  const row = make('div','selected-row'); row.append(target('selectedBg','span','›  Keyboard-selected item','selected-content')); parent.append(row);
}
function buildMarkdown(parent) {
  parent.append(section('Markdown rendering')); const md = make('div','markdown-gallery');
  const heading = make('div'); heading.append(target('mdHeading','h2','# Heading and structure','heading')); md.append(heading);
  const links = make('p'); links.append(document.createTextNode('A '),target('mdLink','a','Markdown link','link'),document.createTextNode(' points at '),target('mdLinkUrl','span','https://pi.dev/guide','url')); md.append(links);
  const inline = make('p'); inline.append(document.createTextNode('Inline '),target('mdCode','code','code()','code'),document.createTextNode(' stays distinct from a fenced block.')); md.append(inline);
  const quote = make('blockquote'); quote.append(target('mdQuoteBorder','span','│','quote-border'),document.createTextNode(' '),target('mdQuote','span','quoted context from the assistant')); md.append(quote);
  md.append(target('mdHr','div','────────────────────────────────────','hr'));
  const list = make('div','list-example'); list.append(target('mdListBullet','span','•','bullet'),document.createTextNode(' first item'),make('br'),target('mdListBullet','span','•','bullet'),document.createTextNode(' second item')); md.append(list);
  const fence = make('pre','code-block'); fence.append(target('mdCodeBlockBorder','span','``` javascript\n','code-fence'),target('mdCodeBlock','span','const answer = await think();\nreturn answer;','code-block-text'),target('mdCodeBlockBorder','span','\n```','code-fence')); md.append(fence); parent.append(md);
  parent.append(section('Syntax categories')); const code = make('pre','syntax-sample');
  const syntax = [['syntaxComment','// comment'],['syntaxKeyword','const'],['syntaxFunction','renderPreview'],['syntaxVariable','theme'],['syntaxString','"hello"'],['syntaxNumber','42'],['syntaxType','Theme'],['syntaxOperator','=>'],['syntaxPunctuation','{}();']];
  for (const [token,text] of syntax) { code.append(target(token,'span',text,'syntax-'+token.replace('syntax','').toLowerCase()),document.createTextNode('  ')); } parent.append(code);
}
function buildThinking(parent) {
  parent.append(section('Thinking-level editor borders')); const levels = [['thinkingOff','off'],['thinkingMinimal','minimal'],['thinkingLow','low'],['thinkingMedium','medium'],['thinkingHigh','high'],['thinkingXhigh','xhigh'],['thinkingMax','max']];
  const grid = make('div','thinking-grid'); for (const [token,label] of levels) { const card = make('div','thinking-card'); card.dataset.focus=token; card.style.borderLeftColor=browserColor(token); card.append(target(token,'strong',label,'thinking-level'),document.createTextNode('  reasoning preview')); grid.append(card); } parent.append(grid);
  const editor = make('div','editor-demo'); editor.dataset.focus='border'; editor.append(target('border','span','  editor · border  ','editor-label'),document.createTextNode(' theme.json  '),target('borderAccent','span','●','cursor')); parent.append(editor);
  const bash = make('div','bash-card'); bash.dataset.focus='bashMode'; bash.append(target('bashMode','strong','$ bash mode','bash-label'),document.createTextNode('  '),target('text','span','echo "safe preview"')); parent.append(bash);
  const thought = make('div','thinking-block'); thought.append(target('thinkingText','strong','thinking…','thinking-label'),document.createTextNode('  comparing seven border levels')); parent.append(thought);
}
function buildHtml(parent) {
  parent.append(section('HTML export surfaces · browser approximation')); const note = make('div','approx-note','These colors belong to the theme export map and are previewed as surfaces; no HTML is generated or uploaded.'); parent.append(note);
  const page = make('div','html-page'); page.style.background=resolveExport('pageBg','#080b12'); const card = make('div','html-card'); card.style.background=resolveExport('cardBg','#101621'); card.append(make('h3','','Pi HTML export'),make('p','','A static conversation surface exported by Pi.')); const info = make('div','html-info'); info.style.background=resolveExport('infoBg','#19334a'); info.textContent='Info panel / tool summary'; card.append(info); page.append(card); parent.append(page);
  parent.append(make('p','muted','Pi command: pi --export session.jsonl output.html'));
}
function resolveExport(name,fallback) { const value = resolveVar(state.export && state.export[name]); if (isHex(value)) return value; if (typeof value === 'number') return xtermRgb(value); return fallback; }
function renderPreview() {
  const preview = $('#preview'); preview.replaceChildren(); setThemeVars(preview); preview.dataset.mode=activeMode;
  const title = tabs.find(tab=>tab[0]===activeMode)?.[1] || 'Preview'; $('#previewTitle').textContent = title;
  $$('#previewTabs button').forEach(button => { const selected=button.dataset.mode===activeMode; button.classList.toggle('active',selected); button.setAttribute('aria-selected',String(selected)); });
  if (activeMode === 'session') buildSession(preview); else if (activeMode === 'states') buildStates(preview); else if (activeMode === 'markdown') buildMarkdown(preview); else if (activeMode === 'thinking') buildThinking(preview); else buildHtml(preview);
}
function renderTabs() { const host=$('#previewTabs'); host.replaceChildren(); for (const [mode,label] of tabs) { const button=make('button','preview-tab',label); button.type='button'; button.dataset.mode=mode; button.role='tab'; button.onclick=()=>{activeMode=mode;renderPreview();}; host.append(button); } }

const demoRecords = [
  {type:'session_info',id:'demo-root',summary:'Pi demo session · read-only preview'},
  {type:'message',id:'demo-user',parentId:'demo-root',message:{role:'user',content:'Build a polished theme preview.'}},
  {type:'message',id:'demo-assistant',parentId:'demo-user',message:{role:'assistant',content:'I will show Markdown, tools, diffs, and editor states.',thinking:'First I compare the available visual hierarchy.'}},
  {type:'toolResult',id:'demo-tool',parentId:'demo-assistant',message:{role:'toolResult',content:'read_file completed successfully'}},
  {type:'bashExecution',id:'demo-bash',parentId:'demo-tool',command:'echo demo',output:'demo output'},
  {type:'custom_message',id:'demo-custom',parentId:'demo-bash',content:'An extension can add a custom message.'},
  {type:'model_change',id:'demo-model',parentId:'demo-custom',model:'demo-model'},
  {type:'thinking_level_change',id:'demo-thinking',parentId:'demo-model',level:'medium'},
  {type:'label',id:'demo-label',parentId:'demo-thinking',label:'review'},
  {type:'compaction',id:'demo-compaction',parentId:'demo-label',summary:'Earlier context compacted.'},
  {type:'branch_summary',id:'demo-branch',parentId:'demo-compaction',summary:'Active branch summary.'}
];
sessionState.records=demoRecords;

function showSessionNotice(text,kind) { const notice=$('#sessionNotice'); notice.textContent=text || ''; notice.className='session-notice' + (kind ? ' '+kind : ''); }
function toast(text) { const node=$('#toast'); node.textContent=text; node.classList.add('show'); clearTimeout(toast.timer); toast.timer=setTimeout(()=>node.classList.remove('show'),2600); }
function resetDemo() { sessionState={kind:'demo',name:'Built-in comprehensive demo',records:demoRecords}; activeMode='session'; $('#clearSessionBtn').disabled=true; showSessionNotice('Built-in demo active. Imported session content is never saved to localStorage.'); renderPreview(); }
function clearImported() { resetDemo(); toast('Imported session cleared'); }
function parseSessionFile(file) {
  if (!file) throw Error('No file selected'); if (file.size > limits.bytes) throw Error('File exceeds the 5 MB safety limit');
  return file.text().then(text => { const lines=text.split(/\r?\n/); const records=[];
    for (let i=0;i<lines.length;i++) { const line=lines[i]; if (!line.trim()) continue; if (line.length > limits.field * 2) throw Error(`Line ${i+1} exceeds the safety limit`); let item; try { item=JSON.parse(line); } catch (error) { throw Error(`Malformed JSONL at line ${i+1}`); } if (!isPlainObject(item)) throw Error(`Line ${i+1} is not a JSON object`); const encoded=JSON.stringify(item); if (encoded.length > limits.field * 4) throw Error(`Record ${records.length + 1} is too large`); validateSessionFields(item,`record ${records.length + 1}`); records.push(item); if (records.length > limits.records) throw Error(`Session exceeds ${limits.records} records`); }
    validateSessionLinks(records); return records;
  });
}
function validateSessionFields(value, path, depth = 0) {
  if (depth > 20) throw Error(`${path} is nested too deeply`);
  if (typeof value === 'string' && value.length > limits.field) throw Error(`${path} field exceeds ${limits.field} characters`);
  if (Array.isArray(value)) { for (let i=0;i<value.length;i++) validateSessionFields(value[i],`${path}[${i}]`,depth+1); return; }
  if (isPlainObject(value)) for (const [key,child] of Object.entries(value)) validateSessionFields(child,`${path}.${key}`,depth+1);
}
function validateSessionLinks(records) {
  const ids=new Map(); for (const record of records) { if (record.id !== undefined && record.id !== null) { const id=String(record.id); if (!id || id.length > 300) throw Error('Invalid record id'); if (ids.has(id)) throw Error('Duplicate record id: '+id); ids.set(id,record); } }
  for (const record of records) { if (record.parentId !== undefined && record.parentId !== null && String(record.parentId) !== '' && !ids.has(String(record.parentId))) throw Error('Orphan parent chain: '+record.parentId); }
  const visiting=new Set(), visited=new Set();
  function visit(id) { if (visiting.has(id)) throw Error('Cyclic parent chain at '+id); if (visited.has(id)) return; visiting.add(id); const record=ids.get(id); if (record && record.parentId !== undefined && record.parentId !== null && String(record.parentId) !== '') visit(String(record.parentId)); visiting.delete(id); visited.add(id); }
  for (const id of ids.keys()) visit(id);
}
function activePath(records) {
  const ids=new Map(records.filter(record=>record.id !== undefined && record.id !== null).map(record=>[String(record.id),record])); let current;
  for (let i=records.length-1;i>=0;i--) if (records[i].id !== undefined && records[i].id !== null) { current=String(records[i].id); break; }
  if (!current) return records;
  const path=[]; const seen=new Set(); while (current && ids.has(current) && !seen.has(current)) { seen.add(current); const record=ids.get(current); path.unshift(record); current=record.parentId === undefined || record.parentId === null ? '' : String(record.parentId); }
  const roots=records.filter(record=>!record.id && (record.type==='session' || record.type==='session_info')); return roots.concat(path);
}
async function importSession(file) {
  const previous=sessionState;
  try { const records=await parseSessionFile(file); sessionState={kind:'imported',name:file.name || 'Imported Pi session',records:activePath(records)}; activeMode='session'; $('#clearSessionBtn').disabled=false; showSessionNotice(`Read-only local viewer · ${records.length} records accepted · active branch reconstructed. Pi runtime import/resume is not available here.`); renderPreview(); toast('Pi session JSONL viewed locally'); }
  catch (error) { sessionState=previous; showSessionNotice('Import rejected: '+error.message,'error'); toast('Session not imported: '+error.message); }
}

function validateInteractive() { validateMap(state.colors,state.vars,'colors'); if (state.export !== undefined) validateMap(state.export,state.vars,'export colors'); }
function render() { document.documentElement.style.setProperty('--accent',browserColor('accent')); $('#themeName').value=state.name; renderVars(); renderTokens(); renderPreview(); }
function loadPreset(preset) { snapshot(); state={name:preset+'-theme',vars:{},colors:{...(preset==='light'?light:dark)},export:{pageBg:preset==='light'?'#f8fafc':'#080b12',cardBg:preset==='light'?'#ffffff':'#101621',infoBg:preset==='light'?'#e0f2fe':'#19334a'}}; render(); }
function output() {
  const required=allTokens.filter(token=>!optionalTokens.has(token)); const missing=required.filter(token=>state.colors[token]===undefined); if (missing.length) { toast('Missing: '+missing.join(', ')); return null; }
  try { validateInteractive(); return JSON.stringify({$schema:SCHEMA,name:(state.name||'my-theme').replaceAll('/','-'),...(Object.keys(state.vars).length?{vars:sortedVarsObject()}:{}),colors:state.colors,...(state.export?{export:state.export}:{})},null,2); } catch (error) { toast('Cannot export: '+error.message); return null; }
}
async function exportTheme() { const text=output(); if (!text) return; const file=(state.name||'my-theme').replace(/[^a-z0-9_-]/gi,'-')+'.json'; try { if (window.showSaveFilePicker) { const handle=await window.showSaveFilePicker({suggestedName:file,types:[{description:'Pi theme JSON',accept:{'application/json':['.json']}}]}); const writer=await handle.createWritable(); await writer.write(text); await writer.close(); } else { const link=document.createElement('a'); link.href=URL.createObjectURL(new Blob([text],{type:'application/json'})); link.download=file; link.click(); setTimeout(()=>URL.revokeObjectURL(link.href),1000); } toast('Theme exported'); } catch (error) { if (error.name!=='AbortError') toast('Export cancelled or unavailable'); } }

const piBridgeToken = new URLSearchParams(location.search).get('token');
const piBridgeEnabled = location.hostname === '127.0.0.1' && Boolean(piBridgeToken);
async function piRequest(path, options = {}) {
  const response = await fetch(path, {...options,headers:{'X-Theme-Builder-Token':piBridgeToken,'Content-Type':'application/json',...(options.headers || {})}});
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw Error(body.error || 'Pi request failed');
  return body;
}
function loadThemeObject(object) {
  if (!isPlainObject(object)) throw Error('Theme must be an object'); const vars=object.vars===undefined?{}:object.vars;
  if (!isPlainObject(vars) || !isPlainObject(object.colors)) throw Error('colors and vars must be plain objects');
  const required=allTokens.filter(token=>!optionalTokens.has(token)); const missing=required.filter(token=>!Object.prototype.hasOwnProperty.call(object.colors,token));
  if (missing.length) throw Error('Missing required color tokens: '+missing.join(', ')); validateMap(object.colors,vars,'colors');
  if (object.export!==undefined) { if (!isPlainObject(object.export)) throw Error('export must be a plain object'); validateMap(object.export,vars,'export colors'); }
  snapshot(); state={name:typeof object.name==='string'&&object.name?object.name:'imported-theme',vars:{...vars},colors:{...object.colors},...(object.export?{export:{...object.export}}:{})}; render();
}
async function refreshPiThemes(selected = '') {
  const data = await piRequest('/api/themes'); const select=$('#piThemeSelect'); select.replaceChildren(make('option','', 'Pi themes…'));
  for (const filename of data.themes) { const option=make('option','',filename); option.value=filename; select.append(option); }
  select.value=selected || select.value;
}
async function saveToPi() {
  const text=output(); if (!text) return null;
  const result=await piRequest('/api/themes',{method:'POST',body:JSON.stringify({theme:JSON.parse(text)})});
  await refreshPiThemes(result.filename); toast('Theme saved in Pi: '+result.filename); return result.filename;
}
async function enablePiBridge() {
  if (!piBridgeEnabled) return;
  try { await piRequest('/api/config'); $('#piControls').hidden=false; await refreshPiThemes(); }
  catch (error) { console.warn('Pi bridge unavailable',error); }
}

$('#importBtn').onclick=()=>$('#fileInput').click();
$('#fileInput').onchange=async event=>{ const file=event.target.files[0]; try { loadThemeObject(JSON.parse(await file.text())); toast('Theme imported'); } catch (error) { toast('Could not import: '+error.message); } event.target.value=''; };
$('#importSessionBtn').onclick=()=>$('#sessionInput').click();
$('#sessionInput').onchange=event=>{ const file=event.target.files[0]; if (file) importSession(file); event.target.value=''; };
$('#clearSessionBtn').onclick=clearImported; $('#demoBtn').onclick=()=>{resetDemo();toast('Built-in demo restored');};
$('#addVarBtn').onclick=()=>{ const name=prompt('Variable name','primary')?.trim(); if (!name || !/^[A-Za-z][A-Za-z0-9_-]*$/.test(name) || Object.prototype.hasOwnProperty.call(state.vars,name)) { toast('Use a unique variable name'); return; } snapshot(); state.vars[name]='#7dd3fc'; render(); };
$('#preset').onchange=event=>loadPreset(event.target.value); $('#search').oninput=renderTokens;
$('#themeName').oninput=event=>{state.name=event.target.value||'my-theme';renderPreview();}; $('#themeName').onchange=event=>{snapshot();state.name=event.target.value||'my-theme';renderPreview();};
$('#undoBtn').onclick=()=>{if(history.length){state=JSON.parse(history.pop());render();toast('Undid last change');}}; $('#resetBtn').onclick=()=>{if(confirm('Reset this draft to Dark?')) loadPreset('dark');}; $('#exportBtn').onclick=exportTheme;
$('#refreshPiThemesBtn').onclick=async()=>{try { await refreshPiThemes($('#piThemeSelect').value); toast('Pi themes refreshed'); } catch (error) { toast('Could not refresh Pi themes: '+error.message); }};
$('#piThemeSelect').onchange=async event=>{ const filename=event.target.value; if (!filename) return; try { const data=await piRequest('/api/theme?filename='+encodeURIComponent(filename)); loadThemeObject(data.theme); toast('Theme loaded from Pi'); } catch (error) { toast('Could not load Pi theme: '+error.message); }};
$('#saveToPiBtn').onclick=async()=>{try { await saveToPi(); } catch (error) { toast('Could not save to Pi: '+error.message); }};
$('#activatePiThemeBtn').onclick=async()=>{try { const filename=await saveToPi(); if (!filename) return; await piRequest('/api/activate',{method:'POST',body:JSON.stringify({filename})}); toast('Theme activated in this Pi session'); } catch (error) { toast('Could not activate theme: '+error.message); }};
try { const saved=localStorage.getItem('pi-theme-draft'); if (saved) { const candidate=JSON.parse(saved); if (isPlainObject(candidate)&&isPlainObject(candidate.colors)&&isPlainObject(candidate.vars||{})) state=candidate; } } catch (_) { /* localStorage is optional */ }
renderTabs(); $('#clearSessionBtn').disabled=true; showSessionNotice('Built-in demo active. Import is local and read-only; session contents are not persisted.'); render();
enablePiBridge();
setInterval(()=>{try { localStorage.setItem('pi-theme-draft',JSON.stringify(state)); } catch (_) {}},2000);
