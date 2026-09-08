(() => {
  const app = document.getElementById('app');
  if (!app) return;

  const replacements = [
    [/\b1è\b/g, '1r'],
    [/\b2è\b/g, '2n'],
    [/\b3è\b/g, '3r'],
    [/\b4è\b/g, '4t'],
    [/\b2rn\b/g, '2n'],
    [/\b3rr\b/g, '3r'],
    [/\b4rè\b/g, '4t'],
    [/\b5rè\b/g, '5è'],
    [/\b6rè\b/g, '6è']
  ];

  function fixCourseLabels() {
    const walker = document.createTreeWalker(app, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      let text = node.nodeValue;
      for (const [pattern, value] of replacements) text = text.replace(pattern, value);
      if (text !== node.nodeValue) node.nodeValue = text;
    }
  }

  new MutationObserver(fixCourseLabels).observe(app, {
    childList: true,
    subtree: true,
    characterData: true
  });
  fixCourseLabels();
})();
