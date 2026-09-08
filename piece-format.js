(() => {
  'use strict';

  const app = document.getElementById('app');
  if (!app) return;

  const stripEnding = value => String(value || '').trim().replace(/[.!?;:…]+$/u, '');

  function neutralText(value) {
    const text = stripEnding(value);
    return text.replace(/^(\s*["'«“¿¡(\[]*)([A-ZÀ-ÖØ-ÝÇ])/, (all, prefix, letter) =>
      prefix + letter.toLocaleLowerCase('ca')
    );
  }

  function comparable(value) {
    return stripEnding(value).replace(/\s+/g, ' ').trim().toLocaleLowerCase('ca');
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
    const candidates = (window.DEFINEIX_DATA || []).filter(entry =>
      entry.word === word && Array.isArray(entry.segments) && entry.segments.length === slots.length
    );

    slots.forEach((slot, index) => {
      const button = slot.querySelector('.order-piece.selected');
      if (!button) return;

      const current = button.textContent;
      const matchingEntry = candidates.find(entry =>
        comparable(entry.segments[index].correct) === comparable(current)
      );

      if (matchingEntry) {
        // Quan la peça és al lloc correcte recupera l'escriptura correcta,
        // però el punt final només apareix en la definició completa.
        setText(button, stripEnding(matchingEntry.segments[index].correct));
      } else {
        setText(button, neutralText(current));
      }
    });
  }

  function applyFormatting() {
    neutralizeLoosePieces();
    formatPlacedOrderPieces();
  }

  let scheduled = false;
  const observer = new MutationObserver(() => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      applyFormatting();
    });
  });

  observer.observe(app, { childList: true, subtree: true, characterData: true });
  applyFormatting();
})();
