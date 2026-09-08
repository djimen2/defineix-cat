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
        setText(button, stripEnding(correctEntry.segments[index].correct));
      } else {
        setText(button, neutralText(current));
      }
    });
  }

  function challengeInfo(kickerText) {
    const text = String(kickerText || '').toUpperCase();
    if (text.includes('QUÈ HI SOBRA')) {
      return {
        type: 'surplus',
        icon: '🧹',
        title: 'TROBA LA PEÇA QUE SOBRA',
        detail: 'Marca la informació que NO és necessària per definir la paraula.'
      };
    }
    if (text.includes('QUÈ HI FALTA')) {
      return {
        type: 'missing',
        icon: '🕳️',
        title: 'COMPLETA LA DEFINICIÓ',
        detail: 'Tria la peça que falta perquè la definició quedi completa.'
      };
    }
    if (text.includes('ORDENA-LA')) {
      return {
        type: 'order',
        icon: '🔀',
        title: 'POSA CADA PEÇA AL SEU LLOC',
        detail: 'Ordena les peces segons la part de la definició que expliquen.'
      };
    }
    if (text.includes('CONSTRUEIX')) {
      return {
        type: 'build',
        icon: '🧩',
        title: 'TRIA LA PEÇA CORRECTA',
        detail: 'Construeix la definició pas a pas triant la millor peça a cada moment.'
      };
    }
    return null;
  }

  function enhanceChallengeClarity() {
    const card = app.querySelector('.game-card');
    if (!card) return;
    const kicker = card.querySelector('.word-kicker');
    const title = card.querySelector('.word-title');
    if (!kicker || !title) return;

    const info = challengeInfo(kicker.textContent);
    if (!info) return;

    card.dataset.challengeType = info.type;

    let callout = card.querySelector('.task-callout');
    if (!callout) {
      callout = document.createElement('div');
      callout.className = 'task-callout';
      title.insertAdjacentElement('afterend', callout);
    }
    callout.className = `task-callout task-${info.type}`;
    callout.innerHTML = `<strong><span class="task-icon">${info.icon}</span>${info.title}</strong><span>${info.detail}</span>`;

    // A "Què hi sobra?" reduïm encara més l'ambigüitat de l'enunciat llarg.
    if (info.type === 'surplus') {
      const challengeTitle = card.querySelector('.challenge-title');
      if (challengeTitle) challengeTitle.innerHTML = 'Una peça <strong>sobra</strong>: és certa o possible, però <strong>no cal</strong> per definir aquesta paraula.';
    }
  }

  function applyFormatting() {
    neutralizeLoosePieces();
    formatPlacedOrderPieces();
    enhanceChallengeClarity();
  }

  let applying = false;
  const observer = new MutationObserver(() => {
    if (applying) return;
    applying = true;
    applyFormatting();
    applying = false;
  });
  observer.observe(app, { childList: true, subtree: true, characterData: true });

  app.addEventListener('click', () => {
    queueMicrotask(applyFormatting);
    setTimeout(applyFormatting, 0);
  }, true);

  applyFormatting();
  setTimeout(applyFormatting, 0);
  setTimeout(applyFormatting, 50);
})();