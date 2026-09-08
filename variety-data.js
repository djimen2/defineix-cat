(() => {
  'use strict';

  const data = window.DEFINEIX_DATA;
  if (!Array.isArray(data)) return;

  const cycles = {
    ci: { grades:[1,2], conceptDifficulty:1 },
    cm: { grades:[3,4], conceptDifficulty:1 },
    cs: { grades:[5,6], conceptDifficulty:1 }
  };

  const specs = [
    {
      word:'casa', area:'Vida quotidiana', extra:'que pot tenir les parets pintades de molts colors',
      ci:[['QUÈ ÉS?','Un lloc o edifici on viuen persones'],['PER A QUÈ SERVEIX?','que serveix per viure, descansar i fer activitats de cada dia']],
      cm:[['QUÈ ÉS?','Un edifici o part d’un edifici on viuen persones'],['QUÈ HI HA?','que té diferents espais per fer activitats quotidianes'],['PER A QUÈ SERVEIX?','i protegeix les persones mentre hi viuen']],
      cs:[['QUÈ ÉS?','Un edifici o part d’un edifici destinat a viure-hi'],['COM S’ORGANITZA?','que disposa d’espais per a les activitats quotidianes'],['QUÈ PROPORCIONA?','i ofereix refugi i privacitat a les persones que hi viuen']]
    },
    {
      word:'cotxe', area:'Vida quotidiana', extra:'que pot ser de molts colors diferents',
      ci:[['QUÈ ÉS?','Un vehicle amb rodes'],['PER A QUÈ SERVEIX?','que serveix per transportar persones d’un lloc a un altre']],
      cm:[['QUÈ ÉS?','Un vehicle de motor que circula per carretera'],['COM ÉS?','que normalment té quatre rodes'],['PER A QUÈ SERVEIX?','i serveix principalment per transportar persones']],
      cs:[['QUÈ ÉS?','Un vehicle de carretera impulsat habitualment per un motor'],['COM ÉS?','que sol tenir quatre rodes i espai per a diversos ocupants'],['PER A QUÈ SERVEIX?','i s’utilitza sobretot per al transport de persones']]
    },
    {
      word:'pa', area:'Alimentació', extra:'que es pot comprar tallat a llesques',
      ci:[['QUÈ ÉS?','Un aliment fet principalment amb farina i aigua'],['COM ES PREPARA?','que es cou fins que queda preparat per menjar']],
      cm:[['QUÈ ÉS?','Un aliment elaborat principalment amb farina i aigua'],['COM ES FA?','que es prepara fent una massa i coent-la'],['COM ES MENJA?','i es pot menjar sol o acompanyant altres aliments']],
      cs:[['QUÈ ÉS?','Un aliment obtingut a partir d’una massa de farina i aigua'],['COM S’ELABORA?','que habitualment es pasta, es deixa reposar i es cou'],['COM S’UTILITZA?','i forma part de molts àpats i preparacions alimentàries']]
    },
    {
      word:'aigua', area:'Vida quotidiana', extra:'que es pot guardar en ampolles de formes diferents',
      ci:[['QUÈ ÉS?','Un líquid que bevem'],['PER QUÈ ÉS IMPORTANT?','que necessitem per viure i mantenir el cos hidratat']],
      cm:[['QUÈ ÉS?','Un líquid transparent essencial per als éssers vius'],['ON LA TROBEM?','que es troba en rius, llacs, mars i altres llocs'],['PER A QUÈ LA NECESSITEM?','i és necessària per beure i per a moltes activitats quotidianes']],
      cs:[['QUÈ ÉS?','Una substància líquida essencial per a la vida'],['ON ÉS PRESENT?','que és present en els éssers vius i en molts espais del planeta'],['PER QUÈ ÉS IMPORTANT?','i intervé en nombrosos processos naturals i activitats humanes']]
    },
    {
      word:'llit', area:'Vida quotidiana', extra:'que pot tenir llençols amb dibuixos',
      ci:[['QUÈ ÉS?','Un moble preparat per estirar-s’hi'],['PER A QUÈ SERVEIX?','que serveix principalment per dormir i descansar']],
      cm:[['QUÈ ÉS?','Un moble format per una superfície preparada per estirar-s’hi'],['QUÈ SOL TENIR?','que normalment porta un matalàs'],['PER A QUÈ SERVEIX?','i s’utilitza principalment per dormir o descansar']],
      cs:[['QUÈ ÉS?','Un moble destinat al descans en posició estirada'],['COM ESTÀ FORMAT?','que habitualment combina una estructura i un matalàs'],['QUINA FUNCIÓ TÉ?','i proporciona una superfície adequada per dormir o reposar']]
    },
    {
      word:'rellotge', area:'Vida quotidiana', extra:'que pot tenir una corretja de color blau',
      ci:[['QUÈ ÉS?','Un aparell que indica l’hora'],['PER A QUÈ SERVEIX?','que serveix per saber en quin moment del dia som']],
      cm:[['QUÈ ÉS?','Un aparell que mesura i indica el pas del temps'],['QUÈ MOSTRA?','que permet veure hores i minuts'],['ON EL PODEM TROBAR?','i pot estar al canell, en una paret o en altres dispositius']],
      cs:[['QUÈ ÉS?','Un instrument destinat a mesurar i indicar el temps'],['QUÈ REPRESENTA?','que mostra unitats com les hores, els minuts i els segons'],['COM POT FUNCIONAR?','i pot utilitzar mecanismes o sistemes electrònics diferents']]
    },
    {
      word:'carrer', area:'Entorn', extra:'que pot tenir arbres plantats a les voreres',
      ci:[['QUÈ ÉS?','Un espai per on passen persones i vehicles entre edificis'],['ON ÉS?','que forma part dels pobles i de les ciutats']],
      cm:[['QUÈ ÉS?','Una via pública situada habitualment entre edificis'],['QUI HI CIRCULA?','que permet el pas de persones i sovint de vehicles'],['QUÈ CONNECTA?','i comunica diferents punts d’un poble o d’una ciutat']],
      cs:[['QUÈ ÉS?','Una via pública urbana delimitada habitualment per edificis o altres espais'],['QUINA FUNCIÓ TÉ?','que facilita la circulació de vianants i vehicles'],['QUÈ PERMET?','i connecta diferents zones dins d’un nucli habitat']]
    },
    {
      word:'arbre', area:'Medi', extra:'que pot aparèixer dibuixat en un logotip',
      ci:[['QUÈ ÉS?','Una planta gran amb un tronc de fusta'],['QUÈ TÉ?','que té branques i normalment també fulles']],
      cm:[['QUÈ ÉS?','Una planta de tija llenyosa que forma un tronc'],['COM CREIX?','que desenvolupa branques a una certa altura'],['QUÈ POT PRODUIR?','i segons l’espècie pot produir flors, fruits o llavors']],
      cs:[['QUÈ ÉS?','Una planta perenne de tija llenyosa que forma un tronc principal'],['COM S’ESTRUCTURA?','que es ramifica a una certa altura formant una capçada'],['COM ES REPRODUEIX?','i produeix estructures reproductores diferents segons l’espècie']]
    },
    {
      word:'gat', area:'Animals', extra:'que pot dormir damunt d’un sofà',
      ci:[['QUÈ ÉS?','Un animal mamífer que sovint viu amb les persones'],['COM ÉS?','que té quatre potes, pèl i una cua']],
      cm:[['QUÈ ÉS?','Un mamífer domèstic de la família dels felins'],['COM ÉS?','que té quatre potes, urpes i sentits molt desenvolupats'],['COM ES RELACIONA AMB LES PERSONES?','i sovint conviu amb les persones com a animal de companyia']],
      cs:[['QUÈ ÉS?','Un mamífer carnívor domèstic de la família dels felins'],['QUINES CARACTERÍSTIQUES TÉ?','que presenta urpes retràctils, bona visió i gran agilitat'],['QUINA RELACIÓ TÉ AMB LES PERSONES?','i conviu sovint amb els humans com a animal de companyia']]
    },
    {
      word:'mà', area:'Cos humà', extra:'que pot portar un anell en un dels dits',
      ci:[['QUÈ ÉS?','Una part del cos situada al final del braç'],['QUÈ TÉ?','que té cinc dits i permet agafar coses']],
      cm:[['QUÈ ÉS?','La part del cos que es troba a l’extrem del braç'],['COM ESTÀ FORMADA?','que inclou el palmell i cinc dits'],['QUÈ ENS PERMET FER?','i permet agafar, tocar i manipular objectes']],
      cs:[['QUÈ ÉS?','La part terminal de l’extremitat superior humana'],['COM ESTÀ FORMADA?','que està formada pel palmell i cinc dits articulats'],['QUINA FUNCIÓ TÉ?','i permet realitzar moviments de prensió, tacte i manipulació precisa']]
    },
    {
      word:'plat', area:'Vida quotidiana', extra:'que pot tenir dibuixos decoratius a la vora',
      ci:[['QUÈ ÉS?','Un recipient baix on posem menjar'],['PER A QUÈ SERVEIX?','que serveix per posar-hi aliments quan mengem']],
      cm:[['QUÈ ÉS?','Un recipient baix i generalment rodó utilitzat a taula'],['QUÈ HI POSEM?','que serveix per contenir aliments'],['COM S’UTILITZA?','i s’empra sobretot per servir o menjar els àpats']],
      cs:[['QUÈ ÉS?','Una peça de vaixella baixa i habitualment circular'],['QUINA FUNCIÓ TÉ?','que està destinada a contenir una ració d’aliment'],['COM S’UTILITZA?','i s’utilitza principalment per servir i consumir menjar']]
    },
    {
      word:'ampolla', area:'Vida quotidiana', extra:'que pot portar una etiqueta de paper',
      ci:[['QUÈ ÉS?','Un recipient allargat que pot contenir líquids'],['COM ÉS?','que té una obertura estreta per on entra i surt el líquid']],
      cm:[['QUÈ ÉS?','Un recipient de coll estret destinat sobretot a contenir líquids'],['COM ES TANCA?','que normalment disposa d’un tap o d’un sistema de tancament'],['PER A QUÈ SERVEIX?','i permet guardar, transportar o servir líquids']],
      cs:[['QUÈ ÉS?','Un recipient rígid o flexible amb el coll més estret que el cos'],['QUÈ POT CONTENIR?','que està dissenyat especialment per contenir líquids'],['QUINA FUNCIÓ TÉ?','i facilita la conservació, el transport i l’abocament del contingut']]
    },
    {
      word:'semàfor', area:'Entorn', extra:'que pot estar instal·lat al costat d’un arbre',
      ci:[['QUÈ ÉS?','Un aparell amb llums de colors que regula el pas'],['PER A QUÈ SERVEIX?','que indica quan podem passar i quan hem d’aturar-nos']],
      cm:[['QUÈ ÉS?','Un dispositiu de senyalització amb llums de colors'],['QUÈ INDICA?','que dona instruccions diferents segons el color encès'],['PER A QUÈ SERVEIX?','i regula el pas de vehicles o de vianants']],
      cs:[['QUÈ ÉS?','Un dispositiu de senyalització lluminosa utilitzat en la circulació'],['COM FUNCIONA?','que comunica ordres mitjançant una seqüència de colors'],['QUINA FUNCIÓ TÉ?','i organitza el pas de vehicles i vianants per augmentar la seguretat']]
    },
    {
      word:'nevera', area:'Vida quotidiana', extra:'que pot tenir imants enganxats a la porta',
      ci:[['QUÈ ÉS?','Un electrodomèstic que manté els aliments freds'],['PER A QUÈ SERVEIX?','que serveix per conservar millor el menjar i les begudes']],
      cm:[['QUÈ ÉS?','Un electrodomèstic que manté el seu interior a baixa temperatura'],['QUÈ HI GUARDEM?','que s’utilitza per guardar aliments i begudes'],['PER A QUÈ SERVEIX?','i ajuda a conservar-los en bon estat durant més temps']],
      cs:[['QUÈ ÉS?','Un electrodomèstic destinat a conservar productes a baixa temperatura'],['COM FUNCIONA?','que extreu calor del seu interior mitjançant un sistema de refrigeració'],['QUINA FUNCIÓ TÉ?','i retarda el deteriorament de molts aliments i begudes']]
    },
    {
      word:'autobús', area:'Transport', extra:'que pot portar publicitat a la part exterior',
      ci:[['QUÈ ÉS?','Un vehicle gran que transporta moltes persones'],['ON CIRCULA?','que circula per carrers i carreteres']],
      cm:[['QUÈ ÉS?','Un vehicle de carretera preparat per transportar molts passatgers'],['COM S’UTILITZA?','que acostuma a seguir un recorregut amb diferents parades'],['PER A QUÈ SERVEIX?','i permet desplaçar grups de persones d’un lloc a un altre']],
      cs:[['QUÈ ÉS?','Un vehicle de transport col·lectiu per carretera'],['COM S’ORGANITZA EL SERVEI?','que pot seguir una ruta establerta amb parades i horaris'],['QUINA FUNCIÓ TÉ?','i permet el desplaçament simultani d’un nombre elevat de passatgers']]
    }
  ];

  const difficultyByCycle = {
    ci:[1,2,2,2,2,2,2,3,2,2,2,2,3,3,3],
    cm:[2,2,2,3,2,3,3,3,3,3,3,3,4,4,4],
    cs:[3,3,3,3,3,3,3,4,3,3,3,3,4,4,4]
  };

  function hasOverlap(entry, grades){
    return Array.isArray(entry.grades) && entry.grades.some(g => grades.includes(Number(g)));
  }

  function optionsFor(specIndex, cycle, segmentIndex){
    const correct = specs[specIndex][cycle][segmentIndex][1];
    const alternatives = [];
    for(let step=1; step<specs.length && alternatives.length<2; step++){
      const other = specs[(specIndex + step * 3) % specs.length][cycle];
      if(!other || !other.length) continue;
      const piece = other[Math.min(segmentIndex, other.length-1)][1];
      if(piece !== correct && !alternatives.includes(piece)) alternatives.push(piece);
    }
    return [correct, ...alternatives];
  }

  for (const [cycle, cfg] of Object.entries(cycles)) {
    specs.forEach((spec, specIndex) => {
      if(data.some(entry => entry.word === spec.word && hasOverlap(entry, cfg.grades))) return;
      const pieces = spec[cycle];
      const segments = pieces.map((piece, segmentIndex) => ({
        label: piece[0],
        correct: piece[1],
        options: optionsFor(specIndex, cycle, segmentIndex)
      }));
      data.push({
        id:`${cycle}-var-${spec.word.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/gi,'-')}`,
        word:spec.word,
        grades:cfg.grades,
        area:spec.area,
        kind:'nom',
        conceptDifficulty:cfg.conceptDifficulty,
        definitionDifficulty:difficultyByCycle[cycle][specIndex],
        vocab:'quotidia',
        segments,
        extra:spec.extra
      });
    });
  }
})();
