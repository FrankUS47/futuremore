/* 100 支籤的方格:籤內容看不到,位置與籤號每次重新洗牌,使用者隨意選一支。 */
window.QQ = window.QQ || {};

QQ.grid = {
  render(container, total, onPick) {
    const numbers = QQ.random.shuffle(Array.from({ length: total }, (_, i) => i + 1));
    container.innerHTML = '';
    const frag = document.createDocumentFragment();
    numbers.forEach((num, idx) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'stick';
      b.setAttribute('aria-label', `第 ${idx + 1} 支籤(籤號尚未揭曉)`);
      b.innerHTML = '<span class="tie"></span><span class="mark">籤</span>';
      b.addEventListener('click', () => {
        container.classList.add('picked');
        container.querySelectorAll('.stick').forEach(s => (s.disabled = true));
        b.classList.add('chosen');
        onPick(num, b);
      });
      frag.appendChild(b);
    });
    container.appendChild(frag);
  }
};
