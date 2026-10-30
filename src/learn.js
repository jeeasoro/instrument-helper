import { LEARN } from './learn-content.js';
import { renderDiagram } from './diagrams.js';
import { getLang, initLanguageSwitch } from './i18n.js';
import { getInstrument, initInstrumentSwitch } from './instrument.js';

function render() {
  const lang = getLang();
  const guide = LEARN[getInstrument()] || LEARN.guitar;
  const content = guide[lang] || guide.en;

  document.getElementById('learnTitle').textContent = content.title;
  document.getElementById('learnSub').textContent = content.sub;

  document.getElementById('toc').innerHTML = content.sections
    .map((s) => `<a href="#${s.id}">${s.title}</a>`)
    .join('');

  document.getElementById('sections').innerHTML = content.sections
    .map((s) => {
      const diagram = s.diagram
        ? `<div class="diagram">${renderDiagram(s.diagram, lang)}</div>`
        : '';
      const note = s.note ? `<aside class="callout">${s.note}</aside>` : '';
      return `<section class="panel" id="${s.id}">
        <h2 class="section-title">${s.title}</h2>
        ${diagram}
        ${s.paras.map((p) => `<p>${p}</p>`).join('')}
        ${note}
      </section>`;
    })
    .join('');
}

initInstrumentSwitch();
initLanguageSwitch();
render();
window.addEventListener('languagechange', render);
window.addEventListener('instrumentchange', render);
