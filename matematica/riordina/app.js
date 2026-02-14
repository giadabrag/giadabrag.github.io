(() => {
  const sequenceEl = document.getElementById('sequence');
  const taskText = document.getElementById('taskText');

  const scoreEl = document.getElementById('score');
  const streakEl = document.getElementById('streak');
  const msgBig = document.getElementById('msgBig');
  const msgSmall = document.getElementById('msgSmall');
  const okEl = document.getElementById('ok');
  const totEl = document.getElementById('tot');
  const levelEl = document.getElementById('level');
  const countInfo = document.getElementById('countInfo');

  const btnCheck = document.getElementById('btnCheck');
  const btnNextBig = document.getElementById('btnNextBig');
  const btnNew = document.getElementById('btnNew');
  const confetti = document.getElementById('confetti');

  let numbers = [];
  let target = [];
  let mode = 'asc';
  let locked = false;
  let mouseDragSourceIndex = -1;
  let touchDrag = {
    active: false,
    pointerId: null,
    sourceIndex: -1,
    sourceTile: null,
    startX: 0,
    startY: 0,
    moved: false,
    insertIndex: -1,
  };

  let score = 0;
  let streak = 0;
  let correct = 0;
  let total = 0;

  function randInt(min, max){
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function shuffle(arr){
    const out = [...arr];
    for (let i = out.length - 1; i > 0; i--){
      const j = randInt(0, i);
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  }

  function arraysEqual(a, b){
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++){
      if (a[i] !== b[i]) return false;
    }
    return true;
  }

  function spawnConfetti(){
    confetti.innerHTML = '';
    const count = 18;
    for (let i = 0; i < count; i++){
      const p = document.createElement('i');
      p.style.left = (Math.random() * 100) + '%';
      p.style.top = (-10 - Math.random() * 30) + 'px';
      p.style.animationDuration = (700 + Math.random() * 500) + 'ms';
      p.style.width = (7 + Math.random() * 9) + 'px';
      p.style.height = (10 + Math.random() * 12) + 'px';
      p.style.background = `hsl(${Math.floor(Math.random() * 360)} 85% 65%)`;
      confetti.appendChild(p);
    }
    setTimeout(() => {
      confetti.innerHTML = '';
    }, 1200);
  }

  function updateHUD(){
    scoreEl.textContent = score;
    streakEl.textContent = streak;
    okEl.textContent = correct;
    totEl.textContent = total;

    const level = 1 + Math.floor(correct / 10);
    levelEl.textContent = level;
  }

  function moveItem(fromIndex, toIndex){
    if (fromIndex === toIndex) return;
    const [item] = numbers.splice(fromIndex, 1);
    numbers.splice(toIndex, 0, item);
    renderSequence();
  }

  function clearInsertionHint(){
    sequenceEl.classList.remove('showInsertHint');
    sequenceEl.style.removeProperty('--insert-x');
  }

  function setInsertionHint(clientX){
    const rect = sequenceEl.getBoundingClientRect();
    const x = Math.min(Math.max(clientX, rect.left), rect.right) - rect.left;
    sequenceEl.style.setProperty('--insert-x', `${x}px`);
    sequenceEl.classList.add('showInsertHint');
  }

  function getInsertIndexFromPointerX(clientX, sourceIndex){
    const tiles = Array.from(sequenceEl.querySelectorAll('.tile'))
      .filter((tile) => Number(tile.dataset.index) !== sourceIndex);

    if (tiles.length === 0) return sourceIndex;

    for (const tile of tiles){
      const targetIndex = Number(tile.dataset.index);
      if (Number.isNaN(targetIndex)) continue;
      const rect = tile.getBoundingClientRect();
      const midX = rect.left + rect.width / 2;
      if (clientX < midX){
        return sourceIndex < targetIndex ? targetIndex - 1 : targetIndex;
      }
    }

    const lastIndex = Number(tiles[tiles.length - 1].dataset.index);
    if (Number.isNaN(lastIndex)) return sourceIndex;
    return sourceIndex < lastIndex ? lastIndex : lastIndex + 1;
  }

  function clearTouchDragVisuals(){
    if (touchDrag.sourceTile){
      touchDrag.sourceTile.classList.remove('dragging');
      touchDrag.sourceTile.style.transform = '';
    }
    clearInsertionHint();
  }

  function resetTouchDragState(){
    clearTouchDragVisuals();
    touchDrag = {
      active: false,
      pointerId: null,
      sourceIndex: -1,
      sourceTile: null,
      startX: 0,
      startY: 0,
      moved: false,
      insertIndex: -1,
    };
  }

  function startTouchDrag(e, tile, index){
    if (e.pointerType === 'mouse' || locked) return;

    touchDrag.active = true;
    touchDrag.pointerId = e.pointerId;
    touchDrag.sourceIndex = index;
    touchDrag.sourceTile = tile;
    touchDrag.startX = e.clientX;
    touchDrag.startY = e.clientY;
    touchDrag.moved = false;
    touchDrag.insertIndex = index;

    tile.setPointerCapture?.(e.pointerId);
  }

  function moveTouchDrag(e){
    if (!touchDrag.active || touchDrag.pointerId !== e.pointerId || !touchDrag.sourceTile) return;

    const dx = e.clientX - touchDrag.startX;
    const dy = e.clientY - touchDrag.startY;

    if (!touchDrag.moved && Math.hypot(dx, dy) < 8) return;

    touchDrag.moved = true;
    e.preventDefault();
    touchDrag.sourceTile.classList.add('dragging');
    touchDrag.sourceTile.style.transform = `translate(${dx}px, ${dy}px) scale(1.03)`;
    touchDrag.insertIndex = getInsertIndexFromPointerX(e.clientX, touchDrag.sourceIndex);
    setInsertionHint(e.clientX);
  }

  function endTouchDrag(e){
    if (!touchDrag.active || touchDrag.pointerId !== e.pointerId) return;

    touchDrag.sourceTile?.releasePointerCapture?.(e.pointerId);

    const moved = touchDrag.moved;
    const sourceIndex = touchDrag.sourceIndex;
    const insertIndex = touchDrag.insertIndex;

    resetTouchDragState();

    if (!moved){
      return;
    }

    const insertAt = insertIndex >= 0
      ? insertIndex
      : getInsertIndexFromPointerX(e.clientX, sourceIndex);

    moveItem(sourceIndex, insertAt);
  }

  function renderSequence(){
    sequenceEl.innerHTML = '';

    numbers.forEach((value, index) => {
      const tile = document.createElement('button');
      tile.className = 'tile';
      tile.type = 'button';
      tile.textContent = String(value);
      tile.setAttribute('aria-label', `Numero ${value}`);
      tile.dataset.index = String(index);

      if (!locked){
        tile.draggable = true;

        tile.addEventListener('pointerdown', (e) => {
          startTouchDrag(e, tile, index);
        });

        tile.addEventListener('pointermove', (e) => {
          moveTouchDrag(e);
        });

        tile.addEventListener('pointerup', (e) => {
          endTouchDrag(e);
        });

        tile.addEventListener('pointercancel', (e) => {
          endTouchDrag(e);
        });

        tile.addEventListener('dragstart', (e) => {
          mouseDragSourceIndex = index;
          tile.classList.add('dragging');
          e.dataTransfer?.setData('text/plain', String(index));
          e.dataTransfer.effectAllowed = 'move';
        });

        tile.addEventListener('dragend', () => {
          mouseDragSourceIndex = -1;
          tile.classList.remove('dragging');
          clearInsertionHint();
        });
      } else {
        tile.disabled = true;
      }

      sequenceEl.appendChild(tile);
    });
  }

  function setTaskText(){
    taskText.classList.remove('up', 'down');
    if (mode === 'asc'){
      taskText.textContent = 'Ordina in ordine crescente';
      taskText.classList.add('up');
    } else {
      taskText.textContent = 'Ordina in ordine decrescente';
      taskText.classList.add('down');
    }
  }

  function showCheck(){
    btnCheck.classList.remove('nextHidden');
    btnNextBig.classList.add('nextHidden');
  }

  function showNext(){
    btnCheck.classList.add('nextHidden');
    btnNextBig.classList.remove('nextHidden');
    btnNextBig.focus?.();
  }

  function makeExercise(){
    locked = false;
    resetTouchDragState();
    mode = Math.random() < 0.5 ? 'asc' : 'desc';

    const baseSize = 5;
    const extra = Math.min(3, Math.floor(correct / 8));
    const count = baseSize + extra;

    const allNumbers = Array.from({ length: 11 }, (_, i) => i);
    const pool = shuffle(allNumbers).slice(0, count);

    target = [...pool].sort((a, b) => mode === 'asc' ? a - b : b - a);

    let shuffled = shuffle(pool);
    let attempts = 0;
    while (arraysEqual(shuffled, target) && attempts < 10){
      shuffled = shuffle(pool);
      attempts++;
    }

    numbers = shuffled;
    setTaskText();
    countInfo.textContent = `${count} numeri`;

    msgBig.textContent = 'Riorganizza la sequenza!';
    msgBig.className = 'big';
    msgSmall.textContent = 'Trascina un numero per spostarlo.';

    showCheck();
    renderSequence();
  }

  function checkAnswer(){
    if (locked) return;

    total++;

    if (arraysEqual(numbers, target)){
      correct++;
      streak++;
      score += 12 + Math.min(10, streak);
      locked = true;

      msgBig.textContent = 'Perfetto! ✅';
      msgBig.className = 'big badgeOk';
      msgSmall.textContent = mode === 'asc'
        ? 'Sequenza corretta in ordine crescente.'
        : 'Sequenza corretta in ordine decrescente.';

      updateHUD();
      renderSequence();
      showNext();
      spawnConfetti();
      return;
    }

    streak = 0;
    score = Math.max(0, score - 2);

    msgBig.textContent = 'Non ancora, riprova! ❌';
    msgBig.className = 'big badgeBad';
    msgSmall.textContent = mode === 'asc'
      ? 'Controlla che i numeri vadano dal piu piccolo al piu grande.'
      : 'Controlla che i numeri vadano dal piu grande al piu piccolo.';

    updateHUD();
  }

  function resetGame(){
    score = 0;
    streak = 0;
    correct = 0;
    total = 0;

    updateHUD();
    makeExercise();

    msgBig.textContent = 'Partita nuova! 🚀';
    msgBig.className = 'big';
    msgSmall.textContent = 'Segui la consegna e metti i numeri nell ordine corretto.';
  }

  btnCheck.addEventListener('click', checkAnswer, { passive: true });
  btnNextBig.addEventListener('click', makeExercise, { passive: true });
  btnNew.addEventListener('click', resetGame, { passive: true });
  sequenceEl.addEventListener('dragover', (e) => {
    if (locked || mouseDragSourceIndex < 0) return;
    e.preventDefault();
    setInsertionHint(e.clientX);
  });
  sequenceEl.addEventListener('drop', (e) => {
    if (locked || mouseDragSourceIndex < 0) return;
    e.preventDefault();
    const insertAt = getInsertIndexFromPointerX(e.clientX, mouseDragSourceIndex);
    const fromIndex = mouseDragSourceIndex;
    mouseDragSourceIndex = -1;
    clearInsertionHint();
    moveItem(fromIndex, insertAt);
  });
  sequenceEl.addEventListener('dragleave', (e) => {
    if (e.currentTarget !== e.target) return;
    clearInsertionHint();
  });

  updateHUD();
  makeExercise();
})();

