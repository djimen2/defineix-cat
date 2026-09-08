(() => {
  'use strict';
  const data = window.DEFINEIX_DATA;
  if (!Array.isArray(data)) return;

  const additions = [
    // CICLE INICIAL · paraules molt conegudes
    {id:'ci-taula',word:'taula',grades:[1,2],area:'Vida quotidiana',kind:'nom',conceptDifficulty:1,definitionDifficulty:1,vocab:'quotidia',segments:[
      {label:'QUÈ ÉS?',correct:'Un moble',options:['Un moble','Un aliment','Un animal']},
      {label:'COM ÉS I PER A QUÈ SERVEIX?',correct:'que té una superfície plana i serveix per posar-hi coses',options:['que té una superfície plana i serveix per posar-hi coses','que es porta als peus per caminar','que serveix per beure aigua']}
    ],extra:'que pot ser de color marró'},
    {id:'ci-poma',word:'poma',grades:[1,2],area:'Vida quotidiana',kind:'nom',conceptDifficulty:1,definitionDifficulty:1,vocab:'quotidia',segments:[
      {label:'QUÈ ÉS?',correct:'Una fruita',options:['Una fruita','Una eina','Una peça de roba']},
      {label:'D’ON SURT?',correct:'que creix en un arbre anomenat pomera',options:['que creix en un arbre anomenat pomera','que es fabrica amb metall','que viu al fons del mar']}
    ],extra:'que pot ser verda, groga o vermella'},
    {id:'ci-cadira',word:'cadira',grades:[1,2],area:'Vida quotidiana',kind:'nom',conceptDifficulty:1,definitionDifficulty:1,vocab:'quotidia',segments:[
      {label:'QUÈ ÉS?',correct:'Un moble',options:['Un moble','Una beguda','Un vehicle']},
      {label:'PER A QUÈ SERVEIX?',correct:'que serveix perquè una persona s’hi assegui',options:['que serveix perquè una persona s’hi assegui','que serveix per escriure a la pissarra','que serveix per guardar aliments freds']}
    ],extra:'que pot tenir molts colors'},
    {id:'ci-porta',word:'porta',grades:[1,2],area:'Vida quotidiana',kind:'nom',conceptDifficulty:1,definitionDifficulty:1,vocab:'quotidia',segments:[
      {label:'QUÈ ÉS?',correct:'Una part mòbil d’una entrada',options:['Una part mòbil d’una entrada','Un utensili per menjar','Una joguina']},
      {label:'PER A QUÈ SERVEIX?',correct:'que s’obre i es tanca per deixar passar o impedir el pas',options:['que s’obre i es tanca per deixar passar o impedir el pas','que serveix per tallar paper','que es posa als peus']}
    ],extra:'que pot tenir un pom'},
    {id:'ci-llibre',word:'llibre',grades:[1,2],area:'Escola',kind:'nom',conceptDifficulty:1,definitionDifficulty:1,vocab:'quotidia',segments:[
      {label:'QUÈ ÉS?',correct:'Un conjunt de pàgines',options:['Un conjunt de pàgines','Un tipus de menjar','Una peça de calçat']},
      {label:'QUÈ HI PODEM TROBAR?',correct:'que conté textos, imatges o tots dos',options:['que conté textos, imatges o tots dos','que només serveix per beure','que està fet per caminar']}
    ],extra:'que pot tenir una portada de molts colors'},
    {id:'ci-pilota',word:'pilota',grades:[1,2],area:'Educació física',kind:'nom',conceptDifficulty:1,definitionDifficulty:1,vocab:'quotidia',segments:[
      {label:'QUÈ ÉS?',correct:'Un objecte normalment rodó',options:['Un objecte normalment rodó','Un moble amb calaixos','Un aliment líquid']},
      {label:'PER A QUÈ S’UTILITZA?',correct:'que s’utilitza en molts jocs i esports',options:['que s’utilitza en molts jocs i esports','que serveix per pentinar-se','que s’utilitza per obrir portes']}
    ],extra:'que pot ser de molts colors'},
    {id:'ci-llapis',word:'llapis',grades:[1,2],area:'Escola',kind:'nom',conceptDifficulty:1,definitionDifficulty:1,vocab:'quotidia',segments:[
      {label:'QUÈ ÉS?',correct:'Un estri per escriure o dibuixar',options:['Un estri per escriure o dibuixar','Un recipient per beure','Una peça de roba']},
      {label:'COM S’UTILITZA?',correct:'que deixa una marca sobre el paper quan en movem la punta',options:['que deixa una marca sobre el paper quan en movem la punta','que es posa al cap per protegir-lo','que serveix per menjar sopa']}
    ],extra:'que es pot guardar en un estoig'},
    {id:'ci-finestra',word:'finestra',grades:[1,2],area:'Vida quotidiana',kind:'nom',conceptDifficulty:1,definitionDifficulty:2,vocab:'quotidia',segments:[
      {label:'QUÈ ÉS?',correct:'Una obertura en una paret',options:['Una obertura en una paret','Un aliment dolç','Un instrument musical']},
      {label:'PER A QUÈ SERVEIX?',correct:'que deixa entrar llum i permet veure l’exterior',options:['que deixa entrar llum i permet veure l’exterior','que serveix per guardar sabates','que serveix per escriure']}
    ],extra:'que pot tenir cortines'},
    {id:'ci-cullera',word:'cullera',grades:[1,2],area:'Vida quotidiana',kind:'nom',conceptDifficulty:1,definitionDifficulty:1,vocab:'quotidia',segments:[
      {label:'QUÈ ÉS?',correct:'Un utensili per menjar o servir aliments',options:['Un utensili per menjar o servir aliments','Una joguina amb rodes','Una peça de mobiliari']},
      {label:'COM ÉS?',correct:'que té un mànec i una part fonda a l’extrem',options:['que té un mànec i una part fonda a l’extrem','que té dues rodes i pedals','que té pàgines i una portada']}
    ],extra:'que pot ser de metall'},
    {id:'ci-samarreta',word:'samarreta',grades:[1,2],area:'Vida quotidiana',kind:'nom',conceptDifficulty:1,definitionDifficulty:1,vocab:'quotidia',segments:[
      {label:'QUÈ ÉS?',correct:'Una peça de roba',options:['Una peça de roba','Un aliment','Un electrodomèstic']},
      {label:'ON ES PORTA?',correct:'que cobreix la part superior del cos',options:['que cobreix la part superior del cos','que es posa als peus','que es penja sempre a la paret']}
    ],extra:'que pot portar un dibuix'},
    {id:'ci-obrir',word:'obrir',grades:[1,2],area:'Llengua',kind:'verb',conceptDifficulty:1,definitionDifficulty:2,vocab:'quotidia',segments:[
      {label:'QUINA ACCIÓ ÉS?',correct:'Fer que una cosa deixi d’estar tancada',options:['Fer que una cosa deixi d’estar tancada','Fer que una cosa quedi més bruta','Fer que una cosa desaparegui']},
      {label:'QUÈ PERMET?',correct:'per poder passar, mirar o accedir al seu interior',options:['per poder passar, mirar o accedir al seu interior','perquè pesi més','perquè canviï de color']}
    ],extra:'que es pot fer amb una porta'},
    {id:'ci-net',word:'net',grades:[1,2],area:'Llengua',kind:'adjectiu',conceptDifficulty:1,definitionDifficulty:2,vocab:'quotidia',segments:[
      {label:'QUÈ DESCRIU?',correct:'Una cosa que no té brutícia',options:['Una cosa que no té brutícia','Una cosa que sempre pesa molt','Una cosa que està trencada']},
      {label:'COM POT QUEDAR?',correct:'després de rentar-la o netejar-la',options:['després de rentar-la o netejar-la','després de llençar-la a terra','després de pintar-la de vermell']}
    ],extra:'que pot fer bona olor'},

    // CICLE MITJÀ · mateix vocabulari, definicions més precises
    {id:'cm-taula',word:'taula',grades:[3,4],area:'Vida quotidiana',kind:'nom',conceptDifficulty:1,definitionDifficulty:2,vocab:'quotidia',segments:[
      {label:'QUÈ ÉS?',correct:'Un moble format per una superfície plana',options:['Un moble format per una superfície plana','Un aparell que produeix so','Un recipient per guardar líquids']},
      {label:'COM ES MANTÉ AIXECADA?',correct:'sostinguda normalment per potes o un suport',options:['sostinguda normalment per potes o un suport','penjada sempre del sostre','col·locada obligatòriament sobre rodes']},
      {label:'PER A QUÈ SERVEIX?',correct:'i utilitzada per recolzar objectes o fer-hi activitats',options:['i utilitzada per recolzar objectes o fer-hi activitats','i utilitzada per escalfar aliments','i utilitzada per rentar la roba']}
    ],extra:'i que pot ser de fusta'},
    {id:'cm-poma',word:'poma',grades:[3,4],area:'Vida quotidiana',kind:'nom',conceptDifficulty:1,definitionDifficulty:2,vocab:'quotidia',segments:[
      {label:'QUÈ ÉS?',correct:'El fruit de la pomera',options:['El fruit de la pomera','La llavor d’un cereal','Una arrel comestible']},
      {label:'COM ÉS?',correct:'que sol tenir forma arrodonida, pell i polpa',options:['que sol tenir forma arrodonida, pell i polpa','que està formada per plomes i bec','que sempre és buida per dins']},
      {label:'QUÈ EN FEM?',correct:'i que es pot menjar crua o cuinada',options:['i que es pot menjar crua o cuinada','i que només serveix per decorar','i que s’utilitza per escriure']}
    ],extra:'i que pot ser de diferents colors'},
    {id:'cm-cadira',word:'cadira',grades:[3,4],area:'Vida quotidiana',kind:'nom',conceptDifficulty:1,definitionDifficulty:2,vocab:'quotidia',segments:[
      {label:'QUÈ ÉS?',correct:'Un moble pensat perquè s’hi assegui una persona',options:['Un moble pensat perquè s’hi assegui una persona','Un recipient per cuinar aliments','Un vehicle sense rodes']},
      {label:'QUINES PARTS SOL TENIR?',correct:'que té un seient i normalment un respatller',options:['que té un seient i normalment un respatller','que té una pantalla i un teclat','que té pàgines i un llom']},
      {label:'COM SE SOSTÉ?',correct:'i que se sosté sobre potes o una altra base',options:['i que se sosté sobre potes o una altra base','i que sempre penja del sostre','i que flota sobre l’aigua']}
    ],extra:'i que pot tenir coixí'},
    {id:'cm-porta',word:'porta',grades:[3,4],area:'Vida quotidiana',kind:'nom',conceptDifficulty:1,definitionDifficulty:2,vocab:'quotidia',segments:[
      {label:'QUÈ ÉS?',correct:'Un element mòbil que tanca una obertura',options:['Un element mòbil que tanca una obertura','Un objecte per mesurar el temps','Una peça de roba']},
      {label:'ON ES TROBA?',correct:'situada habitualment a l’entrada d’un espai',options:['situada habitualment a l’entrada d’un espai','situada sempre sota l’aigua','col·locada només damunt d’una taula']},
      {label:'PER A QUÈ SERVEIX?',correct:'i que permet controlar el pas d’un lloc a un altre',options:['i que permet controlar el pas d’un lloc a un altre','i que serveix per cuinar aliments','i que serveix per escriure textos']}
    ],extra:'i que pot tenir pany'},
    {id:'cm-llibre',word:'llibre',grades:[3,4],area:'Escola',kind:'nom',conceptDifficulty:1,definitionDifficulty:2,vocab:'quotidia',segments:[
      {label:'QUÈ ÉS?',correct:'Una obra formada per pàgines ordenades',options:['Una obra formada per pàgines ordenades','Un objecte per mesurar temperatures','Una peça de calçat']},
      {label:'QUÈ CONTÉ?',correct:'que conté text, imatges o tots dos',options:['que conté text, imatges o tots dos','que només conté aliments','que sempre està buit']},
      {label:'PER A QUÈ SERVEIX?',correct:'i que es llegeix per informar-se, aprendre o gaudir',options:['i que es llegeix per informar-se, aprendre o gaudir','i que serveix per tallar fusta','i que només s’utilitza per fer esport']}
    ],extra:'i que pot tenir una coberta dura'},
    {id:'cm-pilota',word:'pilota',grades:[3,4],area:'Educació física',kind:'nom',conceptDifficulty:1,definitionDifficulty:2,vocab:'quotidia',segments:[
      {label:'QUÈ ÉS?',correct:'Un objecte de forma generalment esfèrica',options:['Un objecte de forma generalment esfèrica','Un moble rectangular amb calaixos','Un instrument per mesurar longituds']},
      {label:'COM POT SER?',correct:'que pot estar fet de materials diferents i tenir mides diverses',options:['que pot estar fet de materials diferents i tenir mides diverses','que sempre està fet de vidre','que només existeix en una mida']},
      {label:'PER A QUÈ S’UTILITZA?',correct:'i que s’utilitza en nombrosos jocs i esports',options:['i que s’utilitza en nombrosos jocs i esports','i que serveix principalment per cuinar','i que s’utilitza per escriure']}
    ],extra:'i que pot portar dibuixos'},
    {id:'cm-llapis',word:'llapis',grades:[3,4],area:'Escola',kind:'nom',conceptDifficulty:1,definitionDifficulty:2,vocab:'quotidia',segments:[
      {label:'QUÈ ÉS?',correct:'Un instrument per escriure o dibuixar',options:['Un instrument per escriure o dibuixar','Un recipient per cuinar','Una peça de mobiliari']},
      {label:'DE QUÈ ESTÀ FORMAT?',correct:'format per una mina protegida per un cos exterior',options:['format per una mina protegida per un cos exterior','format per dues rodes i pedals','format per fulles i arrels']},
      {label:'COM FUNCIONA?',correct:'que deixa una marca quan la mina frega el paper',options:['que deixa una marca quan la mina frega el paper','que funciona escalfant l’aire','que només funciona amb aigua']}
    ],extra:'i que es pot afilar'},
    {id:'cm-finestra',word:'finestra',grades:[3,4],area:'Vida quotidiana',kind:'nom',conceptDifficulty:1,definitionDifficulty:3,vocab:'quotidia',segments:[
      {label:'QUÈ ÉS?',correct:'Una obertura feta en una paret o estructura',options:['Una obertura feta en una paret o estructura','Un recipient per guardar aliments','Un tipus de calçat']},
      {label:'COM SOL ESTAR TANCADA?',correct:'que sol estar protegida amb vidre',options:['que sol estar protegida amb vidre','que sempre està coberta de terra','que no pot tenir cap material transparent']},
      {label:'QUINA FUNCIÓ TÉ?',correct:'i que permet l’entrada de llum, ventilació o visió de l’exterior',options:['i que permet l’entrada de llum, ventilació o visió de l’exterior','i que serveix per escalfar menjar','i que s’utilitza per escriure']}
    ],extra:'i que pot tenir persianes'},
    {id:'cm-cullera',word:'cullera',grades:[3,4],area:'Vida quotidiana',kind:'nom',conceptDifficulty:1,definitionDifficulty:2,vocab:'quotidia',segments:[
      {label:'QUÈ ÉS?',correct:'Un utensili de taula o de cuina',options:['Un utensili de taula o de cuina','Una peça de roba','Un aparell electrònic']},
      {label:'COM ÉS?',correct:'format per un mànec i una part còncava',options:['format per un mànec i una part còncava','format per quatre rodes i un volant','format per una pantalla i altaveus']},
      {label:'PER A QUÈ SERVEIX?',correct:'que serveix per agafar, menjar o servir aliments',options:['que serveix per agafar, menjar o servir aliments','que serveix per escriure sobre paper','que serveix per obrir finestres']}
    ],extra:'i que pot ser de metall o de fusta'},
    {id:'cm-samarreta',word:'samarreta',grades:[3,4],area:'Vida quotidiana',kind:'nom',conceptDifficulty:1,definitionDifficulty:2,vocab:'quotidia',segments:[
      {label:'QUÈ ÉS?',correct:'Una peça de roba per a la part superior del cos',options:['Una peça de roba per a la part superior del cos','Un utensili de cuina','Un moble per seure']},
      {label:'COM ÉS?',correct:'que normalment té mànigues curtes o llargues i no té cames',options:['que normalment té mànigues curtes o llargues i no té cames','que té rodes i pedals','que està formada per pàgines']},
      {label:'PER A QUÈ SERVEIX?',correct:'i que serveix per vestir i cobrir el tronc',options:['i que serveix per vestir i cobrir el tronc','i que serveix per guardar aliments','i que serveix per mesurar distàncies']}
    ],extra:'i que pot tenir un estampat'},
    {id:'cm-obrir',word:'obrir',grades:[3,4],area:'Llengua',kind:'verb',conceptDifficulty:1,definitionDifficulty:3,vocab:'quotidia',segments:[
      {label:'QUINA ACCIÓ ÉS?',correct:'Fer que allò que estava tancat deixi d’estar-ho',options:['Fer que allò que estava tancat deixi d’estar-ho','Fer que un objecte pesi més','Fer desaparèixer una cosa']},
      {label:'QUÈ POT IMPLICAR?',correct:'separant, movent o retirant allò que en barrava l’accés',options:['separant, movent o retirant allò que en barrava l’accés','afegint-hi sempre aigua','canviant-ne obligatòriament el color']},
      {label:'QUÈ PERMET?',correct:'per permetre el pas, l’entrada o l’accés',options:['per permetre el pas, l’entrada o l’accés','per evitar qualsevol contacte','per impedir sempre que es pugui mirar dins']}
    ],extra:'i que es pot fer amb una capsa'},
    {id:'cm-net',word:'net',grades:[3,4],area:'Llengua',kind:'adjectiu',conceptDifficulty:1,definitionDifficulty:3,vocab:'quotidia',segments:[
      {label:'QUÈ DESCRIU?',correct:'Allò que està lliure de brutícia o taques',options:['Allò que està lliure de brutícia o taques','Allò que pesa necessàriament molt','Allò que està sempre trencat']},
      {label:'COM ES POT ACONSEGUIR?',correct:'normalment després d’un procés de neteja',options:['normalment després d’un procés de neteja','només deixant-ho a terra','afegint-hi més brutícia']},
      {label:'A QUÈ ES POT APLICAR?',correct:'i es pot dir d’objectes, espais, roba o persones',options:['i es pot dir d’objectes, espais, roba o persones','i només es pot dir dels animals','i només es pot dir dels nombres']}
    ],extra:'i de vegades fa bona olor'},

    // CICLE SUPERIOR · conceptes fàcils, definició exigent
    {id:'cs-taula',word:'taula',grades:[5,6],area:'Vida quotidiana',kind:'nom',conceptDifficulty:1,definitionDifficulty:4,vocab:'quotidia',segments:[
      {label:'QUÈ ÉS?',correct:'Un moble constituït principalment per una superfície horitzontal',options:['Un moble constituït principalment per una superfície horitzontal','Un recipient destinat a contenir líquids','Un aparell que transforma energia en llum']},
      {label:'COM SE SOSTÉ?',correct:'elevada del terra mitjançant potes o algun altre suport',options:['elevada del terra mitjançant potes o algun altre suport','suspesa necessàriament del sostre','subjectada sempre a unes rodes']},
      {label:'QUINA FUNCIÓ TÉ?',correct:'i destinada a sostenir objectes o facilitar activitats com menjar, escriure o treballar',options:['i destinada a sostenir objectes o facilitar activitats com menjar, escriure o treballar','i destinada principalment a refrigerar aliments','i destinada a transportar persones per carretera']}
    ],extra:'i que pot estar fabricada de fusta clara'},
    {id:'cs-poma',word:'poma',grades:[5,6],area:'Vida quotidiana',kind:'nom',conceptDifficulty:1,definitionDifficulty:4,vocab:'quotidia',segments:[
      {label:'QUÈ ÉS?',correct:'El fruit comestible de la pomera',options:['El fruit comestible de la pomera','La llavor seca d’un cereal','Una arrel subterrània no comestible']},
      {label:'QUINES PARTS TÉ?',correct:'format per pell, polpa i una zona central que conté llavors',options:['format per pell, polpa i una zona central que conté llavors','format per escates, aletes i brànquies','format únicament per una closca buida']},
      {label:'COM ES POT CONSUMIR?',correct:'i que es pot consumir fresca o utilitzar en diferents preparacions culinàries',options:['i que es pot consumir fresca o utilitzar en diferents preparacions culinàries','i que només es pot utilitzar com a decoració','i que s’utilitza principalment per escriure']}
    ],extra:'i que n’hi ha varietats de colors diferents'},
    {id:'cs-cadira',word:'cadira',grades:[5,6],area:'Vida quotidiana',kind:'nom',conceptDifficulty:1,definitionDifficulty:4,vocab:'quotidia',segments:[
      {label:'QUÈ ÉS?',correct:'Un moble individual dissenyat perquè una persona s’hi assegui',options:['Un moble individual dissenyat perquè una persona s’hi assegui','Un recipient destinat a conservar begudes','Un vehicle de transport col·lectiu']},
      {label:'QUINES PARTS BÀSIQUES TÉ?',correct:'format habitualment per un seient, un respatller i una estructura de suport',options:['format habitualment per un seient, un respatller i una estructura de suport','format per una pantalla, un teclat i un ratolí','format per una coberta i pàgines numerades']},
      {label:'QUINA FUNCIÓ TÉ?',correct:'i que permet mantenir el cos assegut i recolzat',options:['i que permet mantenir el cos assegut i recolzat','i que serveix per refredar aliments','i que permet mesurar la temperatura']}
    ],extra:'i que pot tenir braços laterals'},
    {id:'cs-porta',word:'porta',grades:[5,6],area:'Vida quotidiana',kind:'nom',conceptDifficulty:1,definitionDifficulty:4,vocab:'quotidia',segments:[
      {label:'QUÈ ÉS?',correct:'Un element mòbil que permet tancar una obertura d’accés',options:['Un element mòbil que permet tancar una obertura d’accés','Un instrument per mesurar el temps','Una superfície destinada a escriure']},
      {label:'COM FUNCIONA?',correct:'que pot girar, lliscar o desplaçar-se per obrir i tancar el pas',options:['que pot girar, lliscar o desplaçar-se per obrir i tancar el pas','que només funciona quan rep aigua','que sempre es mou verticalment cap al sostre']},
      {label:'QUINA FUNCIÓ TÉ?',correct:'i que regula l’entrada, la sortida o la separació entre espais',options:['i que regula l’entrada, la sortida o la separació entre espais','i que s’utilitza principalment per tallar aliments','i que serveix per calcular distàncies']}
    ],extra:'i que pot estar pintada de blanc'},
    {id:'cs-llibre',word:'llibre',grades:[5,6],area:'Llengua',kind:'nom',conceptDifficulty:1,definitionDifficulty:4,vocab:'quotidia',segments:[
      {label:'QUÈ ÉS?',correct:'Una obra escrita o il·lustrada organitzada en pàgines',options:['Una obra escrita o il·lustrada organitzada en pàgines','Un aparell destinat a mesurar temperatures','Un recipient utilitzat per cuinar']},
      {label:'COM ES PRESENTA?',correct:'reunides físicament en un volum o disponibles en format digital',options:['reunides físicament en un volum o disponibles en format digital','guardades obligatòriament dins d’una ampolla','impreses sempre sobre una sola pàgina']},
      {label:'QUINA FINALITAT POT TENIR?',correct:'i destinada a transmetre informació, coneixement, històries o creacions literàries',options:['i destinada a transmetre informació, coneixement, històries o creacions literàries','i destinada exclusivament a transportar objectes','i destinada només a fer càlculs automàtics']}
    ],extra:'i que pot tenir una portada amb una fotografia'},
    {id:'cs-pilota',word:'pilota',grades:[5,6],area:'Educació física',kind:'nom',conceptDifficulty:1,definitionDifficulty:4,vocab:'quotidia',segments:[
      {label:'QUÈ ÉS?',correct:'Un objecte de forma habitualment esfèrica o aproximadament esfèrica',options:['Un objecte de forma habitualment esfèrica o aproximadament esfèrica','Un moble format per una superfície plana','Un instrument de vent fet de metall']},
      {label:'DE QUÈ POT ESTAR FETA?',correct:'fabricat amb materials i mides diferents segons l’activitat',options:['fabricat amb materials i mides diferents segons l’activitat','fabricat sempre amb el mateix material i la mateixa mida','format únicament per fusta massissa']},
      {label:'PER A QUÈ S’UTILITZA?',correct:'i utilitzat com a element principal en nombrosos jocs i esports',options:['i utilitzat com a element principal en nombrosos jocs i esports','i utilitzat principalment per conservar aliments','i utilitzat per escriure sobre paper']}
    ],extra:'i que pot portar el logotip d’una marca'},
    {id:'cs-llapis',word:'llapis',grades:[5,6],area:'Escola',kind:'nom',conceptDifficulty:1,definitionDifficulty:4,vocab:'quotidia',segments:[
      {label:'QUÈ ÉS?',correct:'Un instrument manual destinat a escriure o dibuixar',options:['Un instrument manual destinat a escriure o dibuixar','Un recipient destinat a contenir líquids','Un objecte dissenyat per seure-hi']},
      {label:'COM ESTÀ FORMAT?',correct:'format per una mina de grafit o d’un altre material envoltada per una coberta protectora',options:['format per una mina de grafit o d’un altre material envoltada per una coberta protectora','format per rodes, pedals i manillar','format per una pantalla i una bateria']},
      {label:'COM PRODUEIX EL TRAÇ?',correct:'que deixa part del material de la mina sobre una superfície quan hi frega',options:['que deixa part del material de la mina sobre una superfície quan hi frega','que projecta tinta mitjançant electricitat','que només pot marcar superfícies mullades']}
    ],extra:'i que es pot guardar en un estoig de colors'},
    {id:'cs-finestra',word:'finestra',grades:[5,6],area:'Vida quotidiana',kind:'nom',conceptDifficulty:1,definitionDifficulty:5,vocab:'quotidia',segments:[
      {label:'QUÈ ÉS?',correct:'Una obertura practicada en una paret o tancament d’un edifici',options:['Una obertura practicada en una paret o tancament d’un edifici','Un objecte destinat a seure-hi','Un recipient per conservar líquids']},
      {label:'COM SOL ESTAR TANCADA?',correct:'protegida habitualment per un marc i una superfície transparent com el vidre',options:['protegida habitualment per un marc i una superfície transparent com el vidre','coberta sempre amb una peça opaca de metall','sense cap element que la separi de l’exterior']},
      {label:'QUINES FUNCIONS TÉ?',correct:'i destinada a permetre l’entrada de llum, la ventilació i la visió entre espais',options:['i destinada a permetre l’entrada de llum, la ventilació i la visió entre espais','i destinada principalment a refredar aliments','i destinada a transportar persones']}
    ],extra:'i que pot tenir unes cortines decoratives'},
    {id:'cs-cullera',word:'cullera',grades:[5,6],area:'Vida quotidiana',kind:'nom',conceptDifficulty:1,definitionDifficulty:4,vocab:'quotidia',segments:[
      {label:'QUÈ ÉS?',correct:'Un utensili de taula o de cuina format per un mànec i una part còncava',options:['Un utensili de taula o de cuina format per un mànec i una part còncava','Un vehicle lleuger format per dues rodes','Un aparell destinat a produir so']},
      {label:'QUINA FUNCIÓ TÉ?',correct:'dissenyat per recollir, transportar, menjar o servir aliments',options:['dissenyat per recollir, transportar, menjar o servir aliments','dissenyat per escriure textos sobre paper','dissenyat per mesurar la longitud']},
      {label:'AMB QUINS ALIMENTS ÉS ESPECIALMENT ÚTIL?',correct:'especialment quan són líquids, tous o formats per peces petites',options:['especialment quan són líquids, tous o formats per peces petites','només quan són objectes metàl·lics','únicament quan no són comestibles']}
    ],extra:'i que pot tenir un mànec decorat'},
    {id:'cs-samarreta',word:'samarreta',grades:[5,6],area:'Vida quotidiana',kind:'nom',conceptDifficulty:1,definitionDifficulty:4,vocab:'quotidia',segments:[
      {label:'QUÈ ÉS?',correct:'Una peça de vestir destinada principalment a cobrir el tronc',options:['Una peça de vestir destinada principalment a cobrir el tronc','Un utensili destinat a menjar sopa','Un aparell que refreda aliments']},
      {label:'COM ÉS?',correct:'que acostuma a tenir mànigues i una obertura per al coll, però no cobreix les cames',options:['que acostuma a tenir mànigues i una obertura per al coll, però no cobreix les cames','que està formada per rodes, pedals i frens','que sempre té pàgines i una coberta']},
      {label:'QUINA FUNCIÓ TÉ?',correct:'i que s’utilitza com a roba exterior o interior segons el tipus',options:['i que s’utilitza com a roba exterior o interior segons el tipus','i que s’utilitza principalment per cuinar','i que serveix per mesurar el temps']}
    ],extra:'i que pot portar el nom d’un equip esportiu'},
    {id:'cs-obrir',word:'obrir',grades:[5,6],area:'Llengua',kind:'verb',conceptDifficulty:1,definitionDifficulty:5,vocab:'quotidia',segments:[
      {label:'QUINA ACCIÓ ÉS?',correct:'Fer que alguna cosa deixi d’estar tancada, tapada o bloquejada',options:['Fer que alguna cosa deixi d’estar tancada, tapada o bloquejada','Fer que un objecte augmenti necessàriament de pes','Fer que una cosa canviï sempre de color']},
      {label:'COM ES POT FER?',correct:'movent, separant o retirant l’element que n’impedeix l’accés',options:['movent, separant o retirant l’element que n’impedeix l’accés','afegint-hi obligatòriament aigua','reduint-ne sempre la temperatura']},
      {label:'QUIN RESULTAT PRODUEIX?',correct:'de manera que permet entrar, sortir, veure o accedir al seu interior',options:['de manera que permet entrar, sortir, veure o accedir al seu interior','de manera que impedeix qualsevol contacte','de manera que deixa l’objecte permanentment inutilitzable']}
    ],extra:'i que és una acció que fem moltes vegades al dia'},
    {id:'cs-net',word:'net',grades:[5,6],area:'Llengua',kind:'adjectiu',conceptDifficulty:1,definitionDifficulty:5,vocab:'quotidia',segments:[
      {label:'QUÈ SIGNIFICA?',correct:'Que està lliure de brutícia, residus o taques que no hi haurien de ser',options:['Que està lliure de brutícia, residus o taques que no hi haurien de ser','Que té necessàriament una massa molt elevada','Que està obligatòriament trencat o espatllat']},
      {label:'A QUÈ ES POT APLICAR?',correct:'i es pot aplicar a persones, objectes, roba, superfícies o espais',options:['i es pot aplicar a persones, objectes, roba, superfícies o espais','i només es pot aplicar a nombres enters','i només es pot aplicar a animals salvatges']},
      {label:'QUÈ EXPRESSA?',correct:'indicant un estat de netedat, no pas un color o una forma concreta',options:['indicant un estat de netedat, no pas un color o una forma concreta','indicant sempre que una cosa és blanca','indicant obligatòriament que una cosa és rodona']}
    ],extra:'i que de vegades s’associa amb una olor agradable'}
  ];

  const existing = new Set(data.map(entry => entry.id));
  for (const entry of additions) {
    if (!existing.has(entry.id)) data.push(entry);
  }
})();
