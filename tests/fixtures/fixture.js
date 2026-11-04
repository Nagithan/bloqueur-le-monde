const list = document.querySelector('[data-element="comments-container"]');
let serial = 0;
function comment(name, id, text, replies = '') {
  const root = document.createElement('div'); root.className = 'ds-comments-container'; root.dataset.component = 'comments-container'; root.dataset.commentId = id;
  root.innerHTML = '<article class="ds-comment"><header class="ds-comment__header"><div class="ds-comment-signature"><h3 class="ds-comment-signature__info"><span class="ds-comment-signature__name"></span><span class="ds-comment-signature__date">Aujourd’hui à 10 h 30</span></h3></div></header><p class="ds-comment__content"></p><footer class="ds-comment__footer"><div class="ds-comment-meta"><div><button class="native-action" data-action="reply">Répondre</button></div><div class="ds-comment-meta__right"><a class="ds-comment-meta__link--report" href="mailto:moderation@example.test">Signaler</a></div></div></footer></article><button class="ds-comment__collapse-button" data-element="collapse-button" data-count="0">Voir les réponses</button><div class="ds-comments-container__replies" data-element="replies-container"></div>';
  root.querySelector('.ds-comment-signature__name').textContent = name; root.querySelector('.ds-comment__content').textContent = text;
  root.querySelector('[data-element="collapse-button"]').hidden = !replies;
  if (replies) { root.querySelector('[data-element="collapse-button"]').dataset.count = '1'; root.querySelector('[data-element="replies-container"]').append(comment('Autrice de la réponse', 'reply-1', 'Je propose une précision. Cette réponse doit rester disponible.')); }
  root.querySelector('[data-action="reply"]').onclick = () => { if (!root.querySelector('textarea')) { const field = document.createElement('textarea'); field.setAttribute('aria-label', 'Brouillon de réponse'); root.append(field); field.focus(); } };
  return root;
}
function fill() {
  list.replaceChildren(comment('Peps72', 'default-1', 'Commentaire témoin pour vérifier la liste initiale.'), comment('Auteur calme', 'calm-1', 'Un éclairage complémentaire sur le sujet.'), comment('Auteur du fil', 'parent-1', 'Le début d’un échange avec une autre lectrice.', 'yes'));
  document.dispatchEvent(new CustomEvent('commentsLoaded'));
}
document.querySelector('#open').onclick = () => { document.querySelector('[data-component="comments-popin"]').dataset.active = 'true'; if (!list.children.length) setTimeout(fill, 100); };
document.querySelector('#close').onclick = () => { document.querySelector('[data-component="comments-popin"]').dataset.active = 'false'; };
document.querySelector('#late').onclick = () => { list.append(comment('Auteur tardif', `late-${++serial}`, 'Ce commentaire arrive après le chargement initial.')); document.dispatchEvent(new CustomEvent('commentsAdded')); };
document.querySelector('#rebuild').onclick = fill;
document.querySelector('#theme').onclick = () => document.body.classList.toggle('dark');
document.querySelector('#unknown').onclick = () => { list.replaceChildren(Object.assign(document.createElement('p'), { textContent: 'Contenu dont la structure n’est pas reconnue.' })); };
document.addEventListener('keydown', event => { if (event.key === 'Escape') document.querySelector('[data-component="comments-popin"]').dataset.active = 'false'; });
