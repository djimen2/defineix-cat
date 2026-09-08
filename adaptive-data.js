(() => {
  'use strict';
  const data=window.DEFINEIX_DATA;
  if(!Array.isArray(data)) return;

  const meta={
    'ci-gos':[1,1,'quotidia'],'ci-bicicleta':[1,1,'quotidia'],'ci-riu':[2,2,'escolar'],'ci-motxilla':[1,1,'quotidia'],'ci-pluja':[1,1,'escolar'],'ci-triangle':[2,2,'escolar'],'ci-biblioteca':[2,2,'escolar'],'ci-metge':[2,2,'quotidia'],'ci-correr':[1,1,'quotidia'],'ci-content':[2,3,'quotidia'],
    'cm-gos':[2,2,'escolar'],'cm-bicicleta':[2,2,'quotidia'],'cm-riu':[3,3,'curricular'],'cm-volca':[4,4,'curricular'],'cm-fraccio':[3,3,'curricular'],'cm-ajuntament':[4,4,'curricular'],'cm-llegenda':[3,3,'escolar'],'cm-muscul':[4,4,'curricular'],'cm-reciclar':[3,3,'curricular'],'cm-valent':[3,3,'quotidia'],
    'cs-gos':[2,2,'escolar'],'cs-bicicleta':[2,2,'quotidia'],'cs-riu':[3,3,'curricular'],'cs-democracia':[4,4,'curricular'],'cs-cellula':[4,4,'curricular'],'cs-percentatge':[3,3,'curricular'],'cs-energia':[5,4,'curricular'],'cs-metafora':[4,4,'escolar'],'cs-evaporacio':[4,4,'curricular'],'cs-argumentar':[3,3,'escolar'],'cs-sostenible':[4,4,'curricular']
  };

  for(const entry of data){
    const m=meta[entry.id]||[3,3,'escolar'];
    entry.conceptDifficulty=m[0];
    entry.definitionDifficulty=m[1];
    entry.vocab=m[2];
  }

  const additions=[
    {id:'ci-got',word:'got',grades:[1,2],area:'Vida quotidiana',kind:'nom',conceptDifficulty:1,definitionDifficulty:1,vocab:'quotidia',segments:[
      {label:'QUÈ ÉS?',correct:'Un recipient petit',options:['Un recipient petit','Una peça de roba','Un animal domèstic']},
      {label:'PER A QUÈ SERVEIX?',correct:'que serveix per beure líquids',options:['que serveix per beure líquids','que serveix per esborrar la pissarra','que serveix per tallar fusta']}
    ],extra:'que pot ser de molts colors'},
    {id:'ci-sabata',word:'sabata',grades:[1,2],area:'Vida quotidiana',kind:'nom',conceptDifficulty:1,definitionDifficulty:1,vocab:'quotidia',segments:[
      {label:'QUÈ ÉS?',correct:'Una peça de calçat',options:['Una peça de calçat','Un estri de cuina','Una joguina amb rodes']},
      {label:'ON ES POSA I PER A QUÈ SERVEIX?',correct:'que es posa al peu per protegir-lo quan caminem',options:['que es posa al peu per protegir-lo quan caminem','que es posa al cap per protegir-nos del sol','que es posa a la taula per menjar']}
    ],extra:'que es pot guardar en una capsa'},
    {id:'ci-esmorzar',word:'esmorzar',grades:[1,2],area:'Vida quotidiana',kind:'nom',conceptDifficulty:1,definitionDifficulty:2,vocab:'quotidia',segments:[
      {label:'QUÈ ÉS?',correct:'Un àpat',options:['Un àpat','Una assignatura','Una peça de roba']},
      {label:'QUAN ES FA?',correct:'que es fa normalment al matí',options:['que es fa normalment al matí','que només es fa de matinada','que es fa sempre després de sopar']}
    ],extra:'que a cada persona li pot agradar diferent'},
    {id:'ci-ajudar',word:'ajudar',grades:[1,2],area:'Valors',kind:'verb',conceptDifficulty:2,definitionDifficulty:2,vocab:'quotidia',segments:[
      {label:'QUINA ACCIÓ ÉS?',correct:'Fer alguna cosa per una altra persona',options:['Fer alguna cosa per una altra persona','Amagar una cosa perquè no la trobi ningú','Marxar corrents sense escoltar']},
      {label:'AMB QUINA FINALITAT?',correct:'per facilitar-li una tasca o una dificultat',options:['per facilitar-li una tasca o una dificultat','per fer-li més difícil la feina','perquè no pugui acabar allò que fa']}
    ],extra:'que es pot fer a l’escola o a casa'},
    {id:'ci-equip',word:'equip',grades:[1,2],area:'Educació física',kind:'nom',conceptDifficulty:2,definitionDifficulty:3,vocab:'escolar',segments:[
      {label:'QUÈ ÉS?',correct:'Un grup de persones',options:['Un grup de persones','Un objecte de metall','Una habitació de la casa']},
      {label:'QUÈ FAN JUNTES?',correct:'que treballen o juguen juntes per aconseguir un objectiu',options:['que treballen o juguen juntes per aconseguir un objectiu','que sempre fan coses diferents i sense parlar','que només poden estar assegudes']}
    ],extra:'que pot portar una samarreta del mateix color'},
    {id:'ci-ombra',word:'ombra',grades:[1,2],area:'Medi',kind:'nom',conceptDifficulty:3,definitionDifficulty:3,vocab:'escolar',segments:[
      {label:'QUÈ ÉS?',correct:'Una zona amb menys llum',options:['Una zona amb menys llum','Una olor molt forta','Un so molt agut']},
      {label:'COM ES FORMA?',correct:'que apareix quan un objecte tapa la llum',options:['que apareix quan un objecte tapa la llum','que apareix quan l’aigua comença a bullir','que apareix quan sona una campana']}
    ],extra:'que pot canviar de mida al llarg del dia'},

    {id:'cm-ordinador',word:'ordinador',grades:[3,4],area:'Digital',kind:'nom',conceptDifficulty:1,definitionDifficulty:2,vocab:'quotidia',segments:[
      {label:'QUÈ ÉS?',correct:'Un dispositiu electrònic',options:['Un dispositiu electrònic','Un aliment elaborat','Un animal vertebrat']},
      {label:'QUÈ FA?',correct:'que rep i processa informació',options:['que rep i processa informació','que transforma l’aigua en fusta','que només serveix per fer llum']},
      {label:'PER A QUÈ SERVEIX?',correct:'i permet fer moltes tasques mitjançant programes',options:['i permet fer moltes tasques mitjançant programes','i només serveix per guardar sabates','i funciona sense cap instrucció']}
    ],extra:'que pot tenir una funda'},
    {id:'cm-noticia',word:'notícia',grades:[3,4],area:'Llengua',kind:'nom',conceptDifficulty:2,definitionDifficulty:2,vocab:'escolar',segments:[
      {label:'QUÈ ÉS?',correct:'Una informació sobre un fet recent o d’interès',options:['Una informació sobre un fet recent o d’interès','Una recepta per cuinar un plat','Una llista de nombres']},
      {label:'ON ES DIFON?',correct:'que es comunica a través d’un mitjà',options:['que es comunica a través d’un mitjà','que només es pot explicar en secret','que sempre queda guardada en una capsa']},
      {label:'AMB QUINA FINALITAT?',correct:'amb la intenció d’informar',options:['amb la intenció d’informar','amb la intenció de donar instruccions de muntatge','amb la intenció de fer una operació matemàtica']}
    ],extra:'que pot anar acompanyada d’una fotografia'},
    {id:'cm-colaborar',word:'col·laborar',grades:[3,4],area:'Valors',kind:'verb',conceptDifficulty:2,definitionDifficulty:2,vocab:'quotidia',segments:[
      {label:'QUINA ACCIÓ ÉS?',correct:'Treballar amb altres persones',options:['Treballar amb altres persones','Ignorar sempre les altres persones','Fer una tasca sense cap objectiu']},
      {label:'COM?',correct:'compartint esforços o idees',options:['compartint esforços o idees','amagant tota la informació','evitant qualsevol acord']},
      {label:'AMB QUINA FINALITAT?',correct:'per aconseguir un objectiu comú',options:['per aconseguir un objectiu comú','perquè ningú pugui acabar la tasca','per fer sempre coses oposades']}
    ],extra:'que de vegades es fa assegut'},
    {id:'cm-instruccio',word:'instrucció',grades:[3,4],area:'Llengua',kind:'nom',conceptDifficulty:2,definitionDifficulty:3,vocab:'escolar',segments:[
      {label:'QUÈ ÉS?',correct:'Una indicació que explica què cal fer',options:['Una indicació que explica què cal fer','Una història fantàstica molt llarga','Un objecte que serveix per mesurar']},
      {label:'PER A QUÈ SERVEIX?',correct:'per completar una tasca o seguir un procés',options:['per completar una tasca o seguir un procés','per substituir qualsevol pregunta','per saber la temperatura exterior']},
      {label:'COM HA DE SER?',correct:'de manera clara i ordenada',options:['de manera clara i ordenada','sense cap ordre ni relació','amb paraules triades a l’atzar']}
    ],extra:'que pot estar escrita amb lletra gran'},
    {id:'cm-habitat',word:'hàbitat',grades:[3,4],area:'Medi',kind:'nom',conceptDifficulty:3,definitionDifficulty:3,vocab:'curricular',segments:[
      {label:'QUÈ ÉS?',correct:'El lloc o ambient on viu habitualment un ésser viu',options:['El lloc o ambient on viu habitualment un ésser viu','El nom científic de qualsevol animal','Una part de l’esquelet']},
      {label:'QUÈ HI TROBA?',correct:'on troba les condicions que necessita',options:['on troba les condicions que necessita','on sempre hi ha la mateixa temperatura','on no existeix cap recurs']},
      {label:'PER A QUÈ?',correct:'per alimentar-se, refugiar-se i reproduir-se',options:['per alimentar-se, refugiar-se i reproduir-se','per convertir-se en una planta','per deixar de relacionar-se amb el medi']}
    ],extra:'que pot aparèixer en un documental'},
    {id:'cm-temperatura',word:'temperatura',grades:[3,4],area:'Medi',kind:'nom',conceptDifficulty:3,definitionDifficulty:4,vocab:'curricular',segments:[
      {label:'QUÈ INDICA?',correct:'Com de calent o fred està un cos o un ambient',options:['Com de calent o fred està un cos o un ambient','La quantitat de llum d’una habitació','La longitud d’un objecte']},
      {label:'COM S’EXPRESSA?',correct:'i s’expressa habitualment en graus',options:['i s’expressa habitualment en graus','i s’expressa sempre en litres','i només es pot expressar amb paraules']},
      {label:'AMB QUÈ ES MESURA?',correct:'amb instruments com el termòmetre',options:['amb instruments com el termòmetre','amb una brúixola','amb una regla de dibuix']}
    ],extra:'que es consulta sovint abans de sortir de casa'},
    {id:'cm-ecosistema',word:'ecosistema',grades:[3,4],area:'Medi',kind:'nom',conceptDifficulty:5,definitionDifficulty:4,vocab:'curricular',segments:[
      {label:'QUÈ ÉS?',correct:'Un conjunt d’éssers vius i del medi on viuen',options:['Un conjunt d’éssers vius i del medi on viuen','Una sola espècie sense cap entorn','Una construcció feta només de pedra']},
      {label:'QUINA RELACIÓ HI HA?',correct:'que es relacionen entre ells',options:['que es relacionen entre ells','que no tenen cap contacte ni influència','que sempre viuen separats']},
      {label:'QUÈ INTERCANVIEN?',correct:'intercanviant matèria i energia',options:['intercanviant matèria i energia','intercanviant només nombres','sense cap canvi al llarg del temps']}
    ],extra:'que es pot representar en un esquema'},

    {id:'cs-motxilla',word:'motxilla',grades:[5,6],area:'Vida quotidiana',kind:'nom',conceptDifficulty:1,definitionDifficulty:1,vocab:'quotidia',segments:[
      {label:'QUÈ ÉS?',correct:'Una bossa que es porta habitualment a l’esquena',options:['Una bossa que es porta habitualment a l’esquena','Un aparell per escalfar menjar','Un tipus de calçat esportiu']},
      {label:'COM ES PORTA?',correct:'subjectada normalment amb dues corretges',options:['subjectada normalment amb dues corretges','enganxada sempre al sostre','col·locada únicament sobre una taula']},
      {label:'PER A QUÈ SERVEIX?',correct:'i serveix per transportar objectes',options:['i serveix per transportar objectes','i serveix per mesurar la temperatura','i serveix per produir electricitat']}
    ],extra:'i pot tenir butxaques de diferents mides'},
    {id:'cs-fotografia',word:'fotografia',grades:[5,6],area:'Vida quotidiana',kind:'nom',conceptDifficulty:1,definitionDifficulty:2,vocab:'quotidia',segments:[
      {label:'QUÈ ÉS?',correct:'Una imatge obtinguda amb una càmera o un dispositiu similar',options:['Una imatge obtinguda amb una càmera o un dispositiu similar','Una explicació feta només amb sons','Una operació matemàtica']},
      {label:'QUÈ REPRESENTA?',correct:'que representa un instant, una escena o un objecte',options:['que representa un instant, una escena o un objecte','que sempre explica una història inventada','que només pot mostrar lletres']},
      {label:'ON ES POT GUARDAR?',correct:'i es pot conservar en format digital o imprès',options:['i es pot conservar en format digital o imprès','i només existeix mentre es fa','i no es pot compartir mai']}
    ],extra:'i pot tenir un marc decoratiu'},
    {id:'cs-horari',word:'horari',grades:[5,6],area:'Escola',kind:'nom',conceptDifficulty:1,definitionDifficulty:2,vocab:'quotidia',segments:[
      {label:'QUÈ ÉS?',correct:'Una distribució d’activitats al llarg del temps',options:['Una distribució d’activitats al llarg del temps','Un tipus de mapa físic','Una llista de paraules sinònimes']},
      {label:'QUÈ INDICA?',correct:'que indica quan comença o acaba cada activitat',options:['que indica quan comença o acaba cada activitat','que indica el pes de cada objecte','que explica com es fabrica un producte']},
      {label:'PER A QUÈ SERVEIX?',correct:'i ajuda a organitzar-se',options:['i ajuda a organitzar-se','i serveix per calcular una àrea','i permet canviar la temperatura']}
    ],extra:'i es pot imprimir en paper'},
    {id:'cs-podcast',word:'pòdcast',grades:[5,6],area:'Digital',kind:'nom',conceptDifficulty:2,definitionDifficulty:2,vocab:'quotidia',segments:[
      {label:'QUÈ ÉS?',correct:'Un programa d’àudio publicat a internet',options:['Un programa d’àudio publicat a internet','Una imatge que només es pot imprimir','Un videojoc sense so']},
      {label:'COM S’ORGANITZA?',correct:'format per un o més episodis',options:['format per un o més episodis','format sempre per una sola fotografia','format només per números']},
      {label:'COM ES CONSUMEIX?',correct:'que es pot escoltar quan l’usuari vol',options:['que es pot escoltar quan l’usuari vol','que només es pot sentir en directe una vegada','que necessita una pantalla encesa tota l’estona']}
    ],extra:'i pot tenir una imatge de portada'},
    {id:'cs-contrasenya',word:'contrasenya',grades:[5,6],area:'Digital',kind:'nom',conceptDifficulty:2,definitionDifficulty:2,vocab:'quotidia',segments:[
      {label:'QUÈ ÉS?',correct:'Una combinació secreta de caràcters',options:['Una combinació secreta de caràcters','Una adreça postal completa','Una fotografia de perfil']},
      {label:'PER A QUÈ SERVEIX?',correct:'que permet verificar l’accés a un compte o dispositiu',options:['que permet verificar l’accés a un compte o dispositiu','que serveix per augmentar el volum dels altaveus','que indica la mida d’una pantalla']},
      {label:'QUINA CARACTERÍSTICA TÉ?',correct:'i que s’ha de mantenir privada',options:['i que s’ha de mantenir privada','i que s’ha de publicar perquè tothom la conegui','i que sempre ha de ser el nom de l’usuari']}
    ],extra:'i pot contenir lletres, nombres i símbols'},
    {id:'cs-amistat',word:'amistat',grades:[5,6],area:'Valors',kind:'nom',conceptDifficulty:2,definitionDifficulty:3,vocab:'quotidia',segments:[
      {label:'QUÈ ÉS?',correct:'Una relació d’afecte i confiança entre persones',options:['Una relació d’afecte i confiança entre persones','Una competició per veure qui guanya','Una norma escrita en un reglament']},
      {label:'EN QUÈ ES BASA?',correct:'que es construeix amb respecte, confiança i temps compartit',options:['que es construeix amb respecte, confiança i temps compartit','que obliga a pensar sempre exactament igual','que només existeix si les persones viuen juntes']},
      {label:'QUÈ POT IMPLICAR?',correct:'i pot incloure suport i ajuda mútua',options:['i pot incloure suport i ajuda mútua','i impedeix demanar ajuda','i obliga a competir constantment']}
    ],extra:'i pot començar en molts llocs diferents'},
    {id:'cs-respecte',word:'respecte',grades:[5,6],area:'Valors',kind:'nom',conceptDifficulty:2,definitionDifficulty:3,vocab:'quotidia',segments:[
      {label:'QUÈ ÉS?',correct:'Una actitud de consideració cap a les persones, les normes o l’entorn',options:['Una actitud de consideració cap a les persones, les normes o l’entorn','Una manera de córrer més de pressa','Una tècnica per dibuixar cercles']},
      {label:'COM ES MOSTRA?',correct:'que implica tractar-los de manera adequada',options:['que implica tractar-los de manera adequada','que permet ignorar sempre els altres','que consisteix a imposar la pròpia opinió']},
      {label:'QUAN ÉS IMPORTANT?',correct:'també quan no compartim una opinió o una decisió',options:['també quan no compartim una opinió o una decisió','només quan tothom pensa igual','únicament durant una competició esportiva']}
    ],extra:'i es pot demostrar amb accions petites'},
    {id:'cs-tutorial',word:'tutorial',grades:[5,6],area:'Digital',kind:'nom',conceptDifficulty:2,definitionDifficulty:3,vocab:'escolar',segments:[
      {label:'QUÈ ÉS?',correct:'Una explicació que ensenya a fer o aprendre alguna cosa',options:['Una explicació que ensenya a fer o aprendre alguna cosa','Una notícia sobre un fet recent','Una classificació de resultats esportius']},
      {label:'COM S’ORGANITZA?',correct:'normalment mitjançant passos o indicacions ordenades',options:['normalment mitjançant passos o indicacions ordenades','sense cap ordre ni explicació','només amb una paraula repetida']},
      {label:'EN QUIN FORMAT POT SER?',correct:'i pot ser escrit, visual o audiovisual',options:['i pot ser escrit, visual o audiovisual','i només pot existir en paper','i sempre ha de ser una trucada telefònica']}
    ],extra:'i pot tenir una miniatura de portada'},
    {id:'cs-debat',word:'debat',grades:[5,6],area:'Llengua',kind:'nom',conceptDifficulty:3,definitionDifficulty:3,vocab:'escolar',segments:[
      {label:'QUÈ ÉS?',correct:'Un intercanvi d’idees o opinions sobre un tema',options:['Un intercanvi d’idees o opinions sobre un tema','Una activitat en què ningú pot parlar','Una narració que sempre és fantàstica']},
      {label:'COM ES PARTICIPA?',correct:'en què els participants exposen arguments i escolten els altres',options:['en què els participants exposen arguments i escolten els altres','en què només es poden repetir frases memoritzades','en què està prohibit respondre']},
      {label:'QUINA NORMA AJUDA?',correct:'respectant torns i normes de participació',options:['respectant torns i normes de participació','parlant tots alhora sense escoltar','evitant qualsevol opinió diferent']}
    ],extra:'i es pot fer asseguts en rotllana'},
    {id:'cs-font-informacio',word:'font d’informació',grades:[5,6],area:'Llengua',kind:'nom',conceptDifficulty:3,definitionDifficulty:4,vocab:'escolar',segments:[
      {label:'QUÈ ÉS?',correct:'Un recurs del qual obtenim dades o coneixements',options:['Un recurs del qual obtenim dades o coneixements','Un objecte que només serveix per decorar','Una activitat física sense informació']},
      {label:'QUÈ POT SER?',correct:'com una persona, un llibre, una web o un document',options:['com una persona, un llibre, una web o un document','només una fotografia sense context','sempre un únic tipus de llibre']},
      {label:'PER A QUÈ LA FEM SERVIR?',correct:'per informar-nos, contrastar o comprovar informació',options:['per informar-nos, contrastar o comprovar informació','per substituir qualsevol opinió per una ordre','per evitar revisar si una dada és fiable']}
    ],extra:'i pot tenir una data de publicació'},
    {id:'cs-ecosistema-nou',word:'ecosistema',grades:[5,6],area:'Medi',kind:'nom',conceptDifficulty:4,definitionDifficulty:4,vocab:'curricular',segments:[
      {label:'QUÈ ÉS?',correct:'Un sistema format pels éssers vius d’un lloc i el medi físic',options:['Un sistema format pels éssers vius d’un lloc i el medi físic','Una sola espècie sense relació amb el medi','Una màquina formada només per peces metàl·liques']},
      {label:'QUINA RELACIÓ HI HA?',correct:'que interactuen entre ells de manera contínua',options:['que interactuen entre ells de manera contínua','que no s’influeixen mai','que sempre estan completament aïllats']},
      {label:'QUÈ HI CIRCULA?',correct:'amb intercanvis de matèria i energia',options:['amb intercanvis de matèria i energia','amb intercanvis només de paraules','sense cap canvi d’energia']}
    ],extra:'i pot representar-se amb xarxes alimentàries'},
    {id:'cs-algoritme',word:'algoritme',grades:[5,6],area:'Digital',kind:'nom',conceptDifficulty:4,definitionDifficulty:4,vocab:'curricular',segments:[
      {label:'QUÈ ÉS?',correct:'Un conjunt ordenat de passos o instruccions',options:['Un conjunt ordenat de passos o instruccions','Una fotografia amb molts colors','Un tipus de memòria humana']},
      {label:'PER A QUÈ SERVEIX?',correct:'que permet resoldre una tasca o un problema',options:['que permet resoldre una tasca o un problema','que serveix només per decorar una pantalla','que impedeix seguir cap ordre']},
      {label:'COM HA DE SER?',correct:'de manera clara i seguint una seqüència definida',options:['de manera clara i seguint una seqüència definida','sense cap ordre ni criteri','canviant tots els passos a l’atzar']}
    ],extra:'i es pot representar amb un diagrama'},
    {id:'cs-probabilitat',word:'probabilitat',grades:[5,6],area:'Matemàtiques',kind:'nom',conceptDifficulty:5,definitionDifficulty:4,vocab:'curricular',segments:[
      {label:'QUÈ EXPRESSA?',correct:'La possibilitat que passi un esdeveniment',options:['La possibilitat que passi un esdeveniment','La longitud exacta d’un objecte','La temperatura d’un líquid']},
      {label:'ENTRE QUINS EXTREMS?',correct:'des d’un fet impossible fins a un fet segur',options:['des d’un fet impossible fins a un fet segur','des d’un metre fins a un quilòmetre','des d’un color clar fins a un color fosc']},
      {label:'PER A QUÈ SERVEIX?',correct:'i permet comparar com de probable és cada resultat',options:['i permet comparar com de probable és cada resultat','i serveix per ordenar paraules alfabèticament','i només es fa servir per mesurar el temps']}
    ],extra:'i es pot expressar amb fraccions o percentatges'}
  ];

  const existing=new Set(data.map(x=>x.id));
  for(const entry of additions){ if(!existing.has(entry.id)){ data.push(entry); existing.add(entry.id); } }
})();
