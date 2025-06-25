const topics = document.querySelectorAll('#topics li');
const copyBtn = document.getElementById('copy-btn');
const codeOutput = document.getElementById('code-output');
const sections = Array.from(document.querySelectorAll('.topic'));

topics.forEach(li =>
  li.addEventListener('click', () => switchTopic(li.dataset.topic))
);

copyBtn.addEventListener('click', () =>
  navigator.clipboard.writeText(codeOutput.textContent)
);

sections.forEach(sec => {
  sec.querySelectorAll('input, textarea, select').forEach(el => {
    const evt = el.type === 'radio' ? 'change' : 'input';
    el.addEventListener(evt, () => {
      saveCache(sec.id);
      renderAll();
    });
  });
});


function switchTopic(topic) {
  const current = document.querySelector('.topic.active');
  if (current) saveCache(current.id);

  document.querySelectorAll('.topic').forEach(sec =>
    sec.classList.remove('active')
  );
  document.getElementById(topic).classList.add('active');

  topics.forEach(li =>
    li.classList.toggle('active', li.dataset.topic === topic)
  );

  loadCache(topic);
  renderAll();
}

function saveCache(topic) {
  const data = {};

  document
    .getElementById(topic)
    .querySelectorAll('input, textarea, select')
    .forEach(el => {
      if (el.type === 'radio') {
        if (el.checked) data[el.name] = el.value;
      } else {
        data[el.id] = el.value;
      }
    });

  localStorage.setItem(topic, JSON.stringify(data));
}

function loadCache(topic) {
  const saved = JSON.parse(localStorage.getItem(topic) || '{}');

  document
    .getElementById(topic)
    .querySelectorAll('input, textarea, select')
    .forEach(el => {
      if (el.type === 'radio') {
        if (saved[el.name] != null) {
          el.checked = (el.value === saved[el.name]);
        }
      } else {
        if (saved[el.id] != null) el.value = saved[el.id];
      }
    });
}

const resetBtn = document.getElementById('reset-btn');

resetBtn.addEventListener('click', () => {
  if (!confirm('Isso apagará todos os dados salvos e limpará os campos.\nContinuar?')) return;

  localStorage.clear();

  document.querySelectorAll('.topic input, .topic textarea, .topic select').forEach(el => {
    if (el.type === 'radio') {
      el.checked = el.defaultChecked;
    } else if (el.tagName === 'SELECT') {
      el.selectedIndex = 0;
    } else {
      el.value = '';
    }
  });
  renderAll();
});

(function initSpriteJumps() {
  const sprites = Array.from(document.querySelectorAll('.pokemon-sprite'));
  const nav = document.querySelector('.navbar');
  const titleEl = document.querySelector('.navbar-title');
  const resetBtn = document.getElementById('reset-btn');

  function safeBounds() {
    return {
      left: titleEl.offsetWidth + 12,
      right: nav.offsetWidth - resetBtn.offsetWidth - 50
    };
  }

  const { left, right } = safeBounds();
  const stride = (right - left) / (sprites.length + 1);
  sprites.forEach((sp, idx) => {
    const x = left + stride * (idx + 1);
    sp.style.left = `${x}px`;
    sp.dataset.x = x;
    scheduleJump(sp);
  });

  function scheduleJump(sp) {
    const delay = Math.random() * 2000 + 1000;
    setTimeout(() => jump(sp), delay);
  }

  function jump(sp) {
    const bounds = safeBounds();
    let x = parseFloat(sp.dataset.x);
    const dir = Math.random() < 0.5 ? -1 : 1;     
    const delta = dir * 40;

    x = Math.max(bounds.left, Math.min(bounds.right, x + delta));

    sp.dataset.x = x;
    sp.style.left = `${x}px`;

    if (dir > 0) {
      sp.classList.add('flip-right');
      sp.classList.remove('flip-left');
    } else {
      sp.classList.add('flip-left');
      sp.classList.remove('flip-right');
    }

    // anima pulo
    sp.classList.add('sprite-jump');
    setTimeout(() => sp.classList.remove('sprite-jump'), 350);

    // agenda próximo
    scheduleJump(sp);
  }


  window.addEventListener('resize', () => {
    const bounds = safeBounds();
    sprites.forEach(sp => {
      let x = parseFloat(sp.dataset.x);
      x = Math.max(bounds.left, Math.min(bounds.right, x));
      sp.dataset.x = x;
      sp.style.left = `${x}px`;
    });
  });
})();


async function getTypes(pokemonName) {
  const slug = pokemonName.toLowerCase().replace(/_/g, '-');
  try {
    const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${slug}`);
    if (!res.ok) throw new Error('Not found');
    const data = await res.json();
    const types = data.types.map(t => t.type.name.charAt(0).toUpperCase() + t.type.name.slice(1));
    return [types[0], types[1] || null];
  } catch {
    return ['Null', null];
  }
}

function parseEncounters(text) {
  const lines = text.split('\n');
  const sections = {};
  let current = null;
  for (let raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    if (/^[A-Za-z]/.test(line)) {
      current = line;
      sections[current] = [];
    } else if (current) {
      const parts = line.split(',').map(s => s.trim());
      if (parts.length === 4) {
        sections[current].push(parts);
      }
    }
  }
  return sections;
}

function generateEntry(name, locType, rate, minLv, maxLv, type1, type2) {
  const levelRange = `${minLv}-${maxLv}`;
  if (['SKITTY', 'DELCATTY'].includes(name.toUpperCase()) && (!type2 || type2 === 'Null')) {
    type2 = 'Fairy';
  }
  let typeStr = `|type1=${type1}`;
  if (type2 && type2 !== 'Null') typeStr += `|type2=${type2}`;
  const disp = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
  return `{{Catch/entry|${disp}|${disp}|${locType}|${levelRange}|all=${rate}%${typeStr}}}`;
}

function codeLocalization() {
  const name = document.getElementById('loc-name').value.trim();
  if (!name) return '';
  const dirs = ['north', 'south', 'east', 'west']
    .map(d => ({
      d,
      v: document.getElementById(`loc-${d}`).value.trim()
    }))
    .filter(o => o.v);
  const inf = `{{Town infobox|name=${name}${dirs
    .map(o => `|${o.d}=${o.v}`)
    .join('')}}}`;
  const img = name.replace(/\s+/g, '_') + '_Map.png';
  const locs = dirs.map(o => `[[${o.v}]]`);
  let txt = 'Between ';
  if (locs.length === 1) txt += locs[0];
  else if (locs.length === 2) txt += locs.join(' and ');
  else
    txt +=
      locs.slice(0, -1).join(', ') + ' and ' + locs.slice(-1);
  return inf + `\n{{Location|image=${img}|location=${txt}}}`;
}

function codeDescription() {
  const txt = document.getElementById('desc-text').value.trim();
  return "\n" + txt
}

async function codeEncounters() {
  const locationName = document.getElementById('loc-name').value.trim() || 'null';
  const intro = [`\n==Pokémon Encounters==\nThe following Pokémon can be found on ${locationName}:\n===Land===`];
  const txt = document.getElementById('enc-text').value;
  if (!txt) return `\n==Pokémon Encounters==\nNo Pokémon can be found on ${locationName}.`
  const sections = parseEncounters(txt);
  const output = ['{{Encounters/Header}}', '{{Catch/div}}'];
  let rodStarted = false;
  const rodMap = { OldRod: 'Fish Old', GoodRod: 'Fish Good', SuperRod: 'Fish Super' };

  for (const [sec, entries] of Object.entries(sections)) {
    if (rodMap[sec] && !rodStarted) {
      output.push('{{Catch/div|Fishing|fishing}}');
      rodStarted = true;
    }
    const landType = document.querySelector('input[name="land-type"]:checked')?.value || 'Grass';
    const locType = sec === 'Land' ? landType : (rodMap[sec] || landType);
    for (const [rate, name, minLv, maxLv] of entries) {
      const [t1, t2] = await getTypes(name);
      output.push(generateEntry(name, locType, rate, minLv, maxLv, t1, t2));
    }
  }
  output.push(`{{Catch/footer|${locationName}}}`);
  return intro + "\n" + output.join('\n');
}

function codeTrainers() {
  const locationName = document.getElementById('loc-name').value.trim() || 'null';
  const tbattle = document.getElementById('trn-text').value.trim(); if (!tbattle) return `\n\n==Trainer Battles==\nThere are no trainer battles on ${locationName}.`;

  const lines = tbattle.split('\n').map(l => l.trim()).filter(Boolean);

  const trainers = lines.map(line => {
    const parts = line.split('|').map(p => p.trim()).filter(Boolean);
    if (parts.length < 3) return '';

    const trainerClass = parts[0];
    const trainerName = parts[1];
    const monParts = parts.slice(2);

    const mons = monParts.map(mp => {
      const [spec, lvl, item] = mp.split(':').map(s => s.trim());
      const itemStr = item || 'None';
      return `${spec}|${spec}|B|${lvl}|${itemStr}`;
    });

    const num = mons.length;
    const img = trainerClass.replace(/\s+/g, '_') + '.png';

    return `{{Trainerentry|${img}|${trainerClass}|${trainerName}|0|${num}|${mons.join('|')}}}`;
  }).filter(Boolean);

  if (!trainers.length) return '';

  return ('\n\n==Trainer Battles==\n' + `The following trainers are found on ${locationName}:\n` + '{{Trainerheader|Road}}\n' + trainers.join('\n')) + "\n{{Trainerfooter|Road}}";
}

function codeStory() {
  const raw = document.getElementById('story-text').value;
  if (!raw.trim()) return '';

  const lines = raw.split('\n');
  const blocks = [];
  let current = null;
  for (const l of lines) {
    if (/^\[.*\]$/.test(l.trim())) {
      if (current) blocks.push(current);
      current = [l];
    } else if (current) {
      current.push(l);
    }
  }
  if (current) blocks.push(current);
  if (!blocks.length) return '';

  const all = ['\n\n==Story Battles=='];

  blocks.forEach(blockLines => {
    const header = blockLines[0].slice(1, -1).split(',').map(s => s.trim());
    const [, trainerName = 'FIX', pokeCount = 'FIX'] = header;

    all.push(`===Pokemon Trainer ${trainerName}===\n[[${trainerName}]] is battled in a single battle format.`);
    all.push(`{{Party/Single|theme=FIX|sprite=${trainerName}-002.png|size=100px|class=Pokemon Trainer|name=${trainerName}|location=FIX|pokemon=${pokeCount}}}`);

    const pokes = [];
    let cur = null;
    for (let i = 1; i < blockLines.length; i++) {
      const line = blockLines[i];
      if (/^\s*Pokemon\s*=/i.test(line)) {
        const [, specLv] = line.split('=');
        const [spec, lv] = specLv.split(',').map(s => s.trim());
        cur = { species: spec, level: lv, attrs: {} };
        pokes.push(cur);
      } else if (cur && /^\s+\S/.test(line)) {
        const [k, v] = line.trim().split('=').map(s => s.trim());
        cur.attrs[k.toLowerCase()] = v.replace(/^"|"$/g, '');
      }
    }

    pokes.forEach(p => {
      const a = p.attrs;
      const moves = (a.moves ? a.moves.split(',').map(m => m.trim()) : []).slice(0, 4);
      const ivs = a.iv || 'FIX,FI​X,FI​X,FI​X,FI​X,FI​X';

      const fields = {
        type1: 'FIX',
        sprite: `${p.species}.png`,
        spritegender: a.gender || 'FIX',
        pokemon: p.species,
        ability: a.ability || 'FIX',
        nature: a.nature || 'FIX',
        gender: a.gender || 'FIX',
        level: p.level || 'FIX',
        StatIVs: ivs
      };
      if (a.item) fields.item = a.item;
      if (a.shiny) fields.shiny = a.shiny;
      if (a.name) fields.nickname = a.name;

      moves.forEach((m, i) => {
        const idx = i + 1;
        fields[`move${idx}`] = m;
        fields[`move${idx}type`] = 'FIX';
        fields[`move${idx}cat`] = 'FIX';
      });

      const body = Object.entries(fields).map(([k, v]) => `${k}=${v}`).join('|');
      all.push(`{{Pokémon|${body}}}`);
    });

    all.push('{{Party/Footer}}');
  });

  return all.join('\n');
}

function codeItems() {
  const locationName = document.getElementById('loc-name').value.trim() || 'null';
  const items = document.getElementById('item-text').value.trim(); if (!items) return `\n\n==Items==\nThere are no items available at ${locationName}.`;

  const lines = items.split('\n').map(l => l.trim()).filter(Boolean);

  const entries = lines.map(line => {
    const [itemName, ...descParts] = line.split('|');
    const name = itemName.trim();
    const desc = descParts.join('|').trim() || 'No description provided.';
    return `{{Itemlist|${name}|${desc}}}`;
  });

  if (!entries.length) return '';

  return (`\n\n==Items==\n${locationName} contains the following items:\n` + '{{Itlisth}}\n' + entries.join('\n') + '\n{{Itlistfoot}}');
}


function codeGimmighoul() { const gimmighoul = document.getElementById('gimm-text').value.trim(); if (!gimmighoul) return '\n\n==Gimmighoul==\n{{Gimmighoul|Gimmighoul cannot be found on this area.}}'; return `\n\n==Gimmighoul==\n{{Gimmighoul|${gimmighoul}}}`; }

function codeQuests() { const quest = document.getElementById('quest-text').value.trim(); if (!quest) return `\n\n==Quest==\nThere are no quests available on this area.`; return `\n\n==Quest==\n${quest}`; }

function codeAchievements() {
  const raw = document.getElementById('ach-text').value.trim(); if (!raw) return '\n\n==Achievements==\nThere are no achievements related to this area.';

  const achievements = raw
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean);

  const entries = achievements.map(line => {
    const [titlePart, ...descParts] = line.split('|');
    const title = titlePart.trim();
    const desc = descParts.join('|').trim() || 'No description provided.';
    const img = title.replace(/\s+/g, '_') + '.png';
    return `===${title}===\n[[File:${img}|thumb]]\n${desc}`;
  });

  return '\n\n==Achievements==\n' + entries.join('\n\n');
}

async function renderAll() {
  const loc = codeLocalization();
  const desc = codeDescription();
  const enc = await codeEncounters();
  const trn = codeTrainers();
  const str = codeStory();
  const itm = codeItems();
  const gim = codeGimmighoul();
  const que = codeQuests();
  const ach = codeAchievements();

  const parts = [loc, desc, enc, trn, str, itm, gim, que, ach];
  codeOutput.textContent = parts.filter(p => p).join('');
}

sections.forEach(sec => loadCache(sec.id));
renderAll();
