# DEFINEIX!

Joc educatiu en català per aprendre a construir definicions de manera progressiva de 1r a 6è de primària.

## v0.1

La primera versió funcional inclou:

- perfil local amb àlies, curs, escola, municipi i codi de jugador;
- tres modalitats: **Jugar**, **Entrenar** i **Repte del dia**;
- quatre tipus de repte: construir, ordenar, completar i detectar informació sobrera;
- dificultat diferenciada per cicle i exemples de paraules que reapareixen amb definicions més precises;
- XP, nivell, punts, ratxa, reptes diaris i insígnies;
- priorització de paraules encara no jugades i entrenament d'errors;
- disseny responsive per ordinador i tauleta;
- desplegament preparat per a GitHub Pages.

## Arquitectura

- `index.html`: entrada de l'aplicació.
- `styles.css`: interfície i disseny responsive.
- `data.js`: base de vocabulari, separada del motor.
- `app.js`: perfils, modes, puntuació i motor de reptes.
- `.github/workflows/pages.yml`: desplegament a GitHub Pages.

## Següents fases

1. Provar i ajustar la mecànica amb alumnes.
2. Connectar Supabase per recuperar el mateix jugador en qualsevol dispositiu.
3. Activar classificacions compartides per curs, cicle, escola, municipi i reptes diaris.
4. Incorporar temporades trimestrals, curs complet i temporada d'estiu.
5. Ampliar la base de vocabulari fins a centenars/milers de paraules graduades.
6. Tancar la identitat visual definitiva, personatges i recursos gràfics.

## Estat de les dades

A la v0.1 el perfil es desa amb `localStorage`. El codi de jugador encara només funciona dins del mateix navegador/dispositiu. La recuperació multiplataforma arribarà amb la base de dades compartida.
