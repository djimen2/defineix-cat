(() => {
  'use strict';

  const data = window.DEFINEIX_DATA;
  const rows = window.DEFINEIX_BANK_ROWS;
  if (!Array.isArray(data) || !Array.isArray(rows) || !rows.length) return;

  const cycles = {
    ci:{grades:[1,2], offset:0},
    cm:{grades:[3,4], offset:1},
    cs:{grades:[5,6], offset:1}
  };

  const slug = value => String(value || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');

  const hash = value => {
    let h = 2166136261;
    for (let i=0;i<value.length;i++) {
      h ^= value.charCodeAt(i);
      h = Math.imul(h,16777619);
    }
    return h >>> 0;
  };

  const hasOverlap = (entry, grades) => Array.isArray(entry.grades) && entry.grades.some(g => grades.includes(Number(g)));

  function labels(kind, count){
    if(kind === 'verb'){
      return count === 2
        ? ['QUÈ VOL DIR?','QUÈ ACONSEGUEIX?']
        : ['QUÈ VOL DIR?','COM PASSA?','QUÈ ACONSEGUEIX?'];
    }
    return count === 2
      ? ['QUÈ ÉS?','QUINA FUNCIÓ O CARACTERÍSTICA TÉ?']
      : ['QUÈ ÉS?','COM ÉS O QUÈ EL CARACTERITZA?','QUINA FUNCIÓ O IMPORTÀNCIA TÉ?'];
  }

  function piecesFor(row, cycle){
    const first=row[3], second=row[4], third=row[5];
    if(cycle === 'ci') return [first, third];
    return [first, second, third];
  }

  function irrelevantFor(row){
    const kind=row[2], area=row[1];
    if(kind === 'verb') return 'que es pot fer tant un dilluns com un dissabte';
    if(area === 'Animals') return 'que pot aparèixer dibuixat en un conte';
    if(area === 'Natura') return 'que pot aparèixer en una fotografia penjada a una paret';
    if(area === 'Alimentació') return 'que es pot veure en una fotografia d’un àpat';
    if(area === 'Roba') return 'que pot aparèixer en un anunci o en una fotografia';
    return 'que pot aparèixer en una fotografia o en un dibuix';
  }

  const generated=[];
  for(const [cycle,cfg] of Object.entries(cycles)){
    rows.forEach((row,rowIndex)=>{
      const [word,area,kind,,,,baseDifficulty] = row;
      if(data.some(entry => entry.word === word && hasOverlap(entry,cfg.grades))) return;
      const texts=piecesFor(row,cycle);
      generated.push({cycle,cfg,row,rowIndex,word,area,kind,texts,baseDifficulty:Number(baseDifficulty)||1});
    });
  }

  function distractorsFor(item,segmentIndex){
    const correct=item.texts[segmentIndex];
    const wantedLength=correct.length;
    const candidates=[];
    for(const other of generated){
      if(other===item || other.cycle!==item.cycle || other.kind!==item.kind) continue;
      const text=other.texts[Math.min(segmentIndex,other.texts.length-1)];
      if(!text || text===correct || candidates.some(x=>x.text===text)) continue;
      let score=Math.abs(text.length-wantedLength);
      if(other.area===item.area) score-=18;
      else score+=4;
      score+=(hash(item.word+'|'+other.word+'|'+segmentIndex)%100)/100;
      candidates.push({text,score});
    }
    candidates.sort((a,b)=>a.score-b.score);
    return candidates.slice(0,2).map(x=>x.text);
  }

  for(const item of generated){
    const labs=labels(item.kind,item.texts.length);
    const segments=item.texts.map((correct,i)=>({
      label:labs[i],
      correct,
      options:[correct,...distractorsFor(item,i)]
    }));
    const difficulty=Math.max(1,Math.min(5,item.baseDifficulty+item.cfg.offset));
    data.push({
      id:`${item.cycle}-mega-${slug(item.word)}`,
      word:item.word,
      grades:item.cfg.grades,
      area:item.area,
      kind:item.kind,
      conceptDifficulty:Math.max(1,Math.min(3,item.baseDifficulty)),
      definitionDifficulty:difficulty,
      vocab:'quotidia',
      segments,
      extra:irrelevantFor(item)
    });
  }

  window.DEFINEIX_BANK_STATS={
    sourceRows:rows.length,
    generatedEntries:generated.length,
    totalEntries:data.length
  };
})();