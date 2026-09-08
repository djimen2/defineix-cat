(() => {
  'use strict';

  const app = document.getElementById('app');
  if (!app) return;

  const stripEnding = value => String(value || '').trim().replace(/[.!?;:…]+$/u, '');

  function neutralText(value) {
    const text = stripEnding(value);
    return text.replace(/^(\s*["'«“¿¡(\[]*)([A-ZÀ-ÖØ-ÝÇ])/, (all, prefix, letter) =>
      prefix + letter.toLowerCase()
    );
  }

  function comparable(value) {
    return stripEnding(value).replace(/\s+/g, ' ').trim().toLowerCase();
  }

  function setText(element, value) {
    if (element && element.textContent !== value) element.textContent = value;
  }

  function neutralizeLoosePieces() {
    app.querySelectorAll('.option-grid .option, .order-pool .order-piece').forEach(button => {
      setText(button, neutralText(button.textContent));
    });
  }

  function formatPlacedOrderPieces() {
    const wordElement = app.querySelector('.word-title');
    const slots = [...app.querySelectorAll('.order-slot')];
    if (!wordElement || !slots.length) return;

    const word = wordElement.textContent.trim();
    const entries = (window.DEFINEIX_DATA || []).filter(entry =>
      entry.word === word && Array.isArray(entry.segments) && entry.segments.length === slots.length
    );

    slots.forEach((slot, index) => {
      const button = slot.querySelector('.order-piece.selected');
      if (!button) return;

      const current = button.textContent;
      const correctEntry = entries.find(entry =>
        comparable(entry.segments[index].correct) === comparable(current)
      );

      if (correctEntry) {
        // Només una peça situada al seu espai correcte recupera la grafia correcta.
        // La puntuació final es reserva per a la definició completa.
        setText(button, stripEnding(correctEntry.segments[index].correct));
      } else {
        setText(button, neutralText(current));
      }
    });
  }

  function applyFormatting() {
    neutralizeLoosePieces();
    formatPlacedOrderPieces();
  }

  // Aplica el format immediatament després de qualsevol re-renderitzat.
  let applying = false;
  const observer = new MutationObserver(() => {
    if (applying) return;
    applying = true;
    applyFormatting();
    applying = false;
  });
  observer.observe(app, { childList: true, subtree: true, characterData: true });

  // També ho reapliquem després de clics, perquè moltes pantalles es regeneren en el mateix tick.
  app.addEventListener('click', () => {
    queueMicrotask(applyFormatting);
    setTimeout(applyFormatting, 0);
  }, true);

  // Garantia inicial per a contingut que ja existia abans d'activar l'observador.
  applyFormatting();
  setTimeout(applyFormatting, 0);
  setTimeout(applyFormatting, 50);
})();