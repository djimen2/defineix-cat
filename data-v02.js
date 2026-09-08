(() => {
  const overrides = {
    'cs-gos': {
      segments: [
        {label:'QUÈ ÉS?',correct:'Un animal mamífer domèstic de la família dels cànids',options:['Un animal mamífer domèstic de la família dels cànids','Un rèptil aquàtic de sang freda','Una planta amb flor que viu als boscos']},
        {label:'COM ÉS?',correct:'que té quatre potes i els sentits de l’olfacte i l’oïda molt desenvolupats',options:['que té quatre potes i els sentits de l’olfacte i l’oïda molt desenvolupats','que té plomes, bec i ales per volar','que no té cap òrgan dels sentits']},
        {label:'QUINA RELACIÓ TÉ AMB LES PERSONES?',correct:'i que pot conviure amb les persones i ajudar-les en diferents tasques',options:['i que pot conviure amb les persones i ajudar-les en diferents tasques','i que només pot viure lluny de qualsevol persona','i que fabrica el seu aliment amb la llum del Sol']}
      ],
      extra:'i que pot aparèixer en pel·lícules, anuncis o contes'
    },
    'cs-bicicleta': {
      segments: [
        {label:'QUÈ ÉS?',correct:'Un vehicle de dues rodes',options:['Un vehicle de dues rodes','Un aparell que serveix per cuinar aliments','Un instrument que mesura la temperatura']},
        {label:'COM ES MOU?',correct:'que es desplaça quan la persona fa força sobre els pedals',options:['que es desplaça quan la persona fa força sobre els pedals','que només es pot moure amb un motor de gasolina','que avança sempre per unes vies metàl·liques']},
        {label:'COM ES DIRIGEIX?',correct:'i que es dirigeix amb un manillar',options:['i que es dirigeix amb un manillar','i que canvia de direcció amb unes ales','i que no permet decidir cap a on va']}
      ],
      extra:'i que es pot fabricar de molts colors diferents'
    },
    'cs-riu': {
      segments: [
        {label:'QUÈ ÉS?',correct:'Un corrent natural d’aigua',options:['Un corrent natural d’aigua','Una massa de roca situada sota terra','Una acumulació artificial de vapor']},
        {label:'COM CIRCULA?',correct:'que circula per un llit seguint el desnivell del terreny',options:['que circula per un llit seguint el desnivell del terreny','que puja sempre cap als punts més alts','que avança en línia recta sense dependre del relleu']},
        {label:'ON ACABA?',correct:'i que desemboca en un altre riu, un llac o el mar',options:['i que desemboca en un altre riu, un llac o el mar','i que sempre acaba convertit en gel','i que no arriba mai a cap altra massa d’aigua']}
      ],
      extra:'i que pot tenir ponts construïts al damunt'
    },
    'cs-democracia': {
      segments: [
        {label:'QUÈ ÉS?',correct:'Un sistema de govern en què la ciutadania participa en les decisions públiques',options:['Un sistema de govern en què la ciutadania participa en les decisions públiques','Una activitat econòmica basada només en l’agricultura','Una forma de relleu pròpia de les muntanyes']},
        {label:'COM HI PARTICIPA LA CIUTADANIA?',correct:'normalment escollint representants mitjançant eleccions',options:['normalment escollint representants mitjançant eleccions','sense poder intervenir mai en cap decisió','heretant obligatòriament els càrrecs polítics']},
        {label:'QUÈ HA DE RESPECTAR?',correct:'dins d’un marc de drets, llibertats i normes comunes',options:['dins d’un marc de drets, llibertats i normes comunes','sense cap norma ni dret reconegut','amb una sola opinió permesa per a tothom']}
      ],
      extra:'i que és una paraula d’origen grec'
    },
    'cs-cellula': {
      segments: [
        {label:'QUÈ ÉS?',correct:'La unitat més petita que forma els éssers vius i pot realitzar les funcions vitals',options:['La unitat més petita que forma els éssers vius i pot realitzar les funcions vitals','Un òrgan que només tenen els animals vertebrats','Una substància mineral sense cap estructura']},
        {label:'COM ESTÀ FORMADA?',correct:'que està envoltada per una membrana i conté diferents components',options:['que està envoltada per una membrana i conté diferents components','que està formada només per ossos i músculs','que no té cap límit ni cap element al seu interior']},
        {label:'COM POT FORMAR PART DELS ÉSSERS VIUS?',correct:'i que pot viure sola o formar part d’un organisme amb moltes cèl·lules',options:['i que pot viure sola o formar part d’un organisme amb moltes cèl·lules','i que sempre viu completament separada de qualsevol organisme','i que només existeix en els mamífers']}
      ],
      extra:'i que sovint es representa amb dibuixos de colors'
    },
    'cs-percentatge': {
      segments: [
        {label:'QUÈ ÉS?',correct:'Una manera d’expressar una part d’un total',options:['Una manera d’expressar una part d’un total','Una unitat que serveix per mesurar longituds','Un nombre que sempre ha de ser negatiu']},
        {label:'QUINA REFERÈNCIA UTILITZA?',correct:'prenent cent parts com a referència',options:['prenent cent parts com a referència','prenent sempre deu metres com a referència','sense utilitzar cap quantitat de referència']},
        {label:'COM S’ESCRIU?',correct:'i que s’acostuma a representar amb el símbol %',options:['i que s’acostuma a representar amb el símbol %','i que sempre s’escriu amb el símbol €','i que només es pot representar amb paraules']}
      ],
      extra:'i que apareix sovint en anuncis de descomptes'
    },
    'cs-energia': {
      segments: [
        {label:'QUÈ ÉS?',correct:'La capacitat de produir canvis o moviment',options:['La capacitat de produir canvis o moviment','Un tipus de matèria que sempre és líquida','Una unitat que només serveix per mesurar distàncies']},
        {label:'DE QUINES FORMES POT APARÈIXER?',correct:'que pot presentar-se de formes diferents, com l’elèctrica, la tèrmica o la química',options:['que pot presentar-se de formes diferents, com l’elèctrica, la tèrmica o la química','que només pot existir en forma de llum solar','que sempre apareix exactament de la mateixa manera']},
        {label:'QUÈ LI POT PASSAR?',correct:'i que es pot transformar d’una forma en una altra',options:['i que es pot transformar d’una forma en una altra','i que desapareix completament cada vegada que s’utilitza','i que mai pot canviar de forma']}
      ],
      extra:'i que és un tema habitual als llibres de ciències'
    },
    'cs-metafora': {
      segments: [
        {label:'QUÈ ÉS?',correct:'Un recurs expressiu que identifica una realitat amb una altra',options:['Un recurs expressiu que identifica una realitat amb una altra','Una norma que indica on s’han de posar els accents','Un tipus de text que només dona instruccions']},
        {label:'PER QUÈ LES RELACIONA?',correct:'perquè totes dues comparteixen alguna semblança',options:['perquè totes dues comparteixen alguna semblança','perquè han de ser exactament iguals en tot','sense que hi hagi cap relació entre elles']},
        {label:'QUIN EFECTE CREA?',correct:'i que crea una imatge o un significat figurat',options:['i que crea una imatge o un significat figurat','i que elimina qualsevol significat figurat','i que converteix totes les frases en preguntes']}
      ],
      extra:'i que pot aparèixer escrita en una llibreta'
    },
    'cs-evaporacio': {
      segments: [
        {label:'QUÈ ÉS?',correct:'El canvi pel qual un líquid passa a l’estat gasós',options:['El canvi pel qual un líquid passa a l’estat gasós','El canvi pel qual un sòlid es converteix en roca','El moviment de la Terra al voltant del Sol']},
        {label:'ON COMENÇA?',correct:'que es produeix des de la superfície del líquid',options:['que es produeix des de la superfície del líquid','que només comença al centre del líquid','que només es produeix quan el líquid està congelat']},
        {label:'CAL QUE EL LÍQUID BULLI?',correct:'i que pot passar sense que el líquid arribi a bullir',options:['i que pot passar sense que el líquid arribi a bullir','i que només passa exactament quan el líquid bull','i que únicament pot passar dins d’un congelador']}
      ],
      extra:'i que es pot observar en moltes situacions quotidianes'
    },
    'cs-argumentar': {
      segments: [
        {label:'QUINA ACCIÓ ÉS?',correct:'Defensar o justificar una idea o una opinió',options:['Defensar o justificar una idea o una opinió','Repetir una frase sense donar cap motiu','Copiar literalment qualsevol informació']},
        {label:'COM ES FA?',correct:'aportant raons, proves o exemples',options:['aportant raons, proves o exemples','evitant donar qualsevol explicació','canviant de tema cada vegada que algú pregunta']},
        {label:'COM HAN D’ESTAR LES IDEES?',correct:'de manera coherent i relacionada amb el tema',options:['de manera coherent i relacionada amb el tema','sense cap relació entre les idees','utilitzant només paraules soltes']}
      ],
      extra:'i que es pot fer parlant o escrivint'
    },
    'cs-sostenible': {
      segments: [
        {label:'QUÈ DESCRIU?',correct:'Allò que es pot mantenir a llarg termini',options:['Allò que es pot mantenir a llarg termini','Allò que només pot durar uns segons','Qualsevol objecte que sigui de color verd']},
        {label:'COM UTILITZA ELS RECURSOS?',correct:'utilitzant els recursos de manera responsable',options:['utilitzant els recursos de manera responsable','gastant els recursos tan ràpid com sigui possible','sense tenir en compte cap consum']},
        {label:'QUÈ INTENTA EVITAR?',correct:'sense perjudicar el medi ni comprometre les necessitats del futur',options:['sense perjudicar el medi ni comprometre les necessitats del futur','augmentant necessàriament la contaminació','pensant només en el benefici immediat']}
      ],
      extra:'i que és una paraula que apareix sovint als mitjans de comunicació'
    }
  };

  for (const entry of window.DEFINEIX_DATA || []) {
    if (overrides[entry.id]) Object.assign(entry, overrides[entry.id]);
  }
})();
