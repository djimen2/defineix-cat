# DEFINEIX! · Backend Supabase

Aquesta carpeta prepara la capa cloud de DEFINEIX! sense modificar el funcionament local actual del joc.

## Objectius

- Recuperar un perfil en qualsevol dispositiu.
- Guardar XP, punts, reptes diaris i estadístiques al núvol.
- Activar rànquings reals: global, curs, cicle, escola, municipi i temporada.
- Mantenir el joc compatible amb GitHub Pages: al navegador només hi haurà la URL del projecte i la clau `anon`; mai una `service_role`.
- Evitar exposar directament les taules: les operacions del client passen per funcions RPC controlades.

## Identitat del jugador

El joc no demana nom complet, correu, telèfon ni data de naixement.

Cada jugador tindrà:

1. **Àlies**: el nom visible als rànquings.
2. **Codi públic curt**: identificador visible, no serveix per entrar al perfil.
3. **Codi de recuperació secret**: 20 caràcters aleatoris en quatre blocs. Permet recuperar el perfil en un dispositiu nou.
4. **Token de dispositiu**: secret llarg generat pel servidor i desat localment al navegador. És el que autoritza les escriptures habituals sense haver de tornar a introduir el codi de recuperació.

El servidor només desa hashes dels secrets; ni el codi de recuperació ni els tokens de dispositiu queden guardats en text pla.

## Taules principals

- `players`: perfil, curs i totals.
- `player_secrets`: hash del codi de recuperació.
- `player_devices`: sessions de dispositiu.
- `sessions`: partides enviades al servidor, amb protecció contra enviaments duplicats.
- `attempts`: intents de cada paraula i tipus de repte.
- `daily_results`: resultat únic del repte diari per jugador i dia.
- `seasons`: trimestres/curs/estiu configurables.
- `player_season_stats`: totals de cada jugador dins de cada temporada.

## RPC públiques

- `register_defineix_player(...)`
- `recover_defineix_player(...)`
- `get_defineix_profile(...)`
- `update_defineix_profile(...)`
- `submit_defineix_session(...)`
- `get_defineix_leaderboard(...)`

Les funcions internes de generació i validació de tokens no són executables directament pel client.

## Rànquings

`get_defineix_leaderboard` admet:

- punts o reptes diaris completats;
- temporada concreta o acumulat general;
- curs;
- cicle;
- escola;
- municipi.

No s’han fixat dates de trimestre a la migració. Les temporades s’afegiran com a dades configurables perquè cada curs escolar es pugui ajustar sense modificar el codi.

## Ordre d’activació

1. Connectar/crear el projecte Supabase.
2. Aplicar `migrations/001_defineix_core.sql`.
3. Fer proves de registre, recuperació i enviament d’una partida fictícia.
4. Afegir la URL i la clau `anon` al frontend.
5. Migrar perfils locals existents al núvol sense perdre XP, punts ni historial.
6. Activar rànquings compartits.
7. Configurar temporades del curs escolar.

Fins que no es completi aquest procés, DEFINEIX! continua funcionant íntegrament amb `localStorage` com fins ara.
