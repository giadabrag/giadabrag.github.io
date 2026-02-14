(() => {
  const elA = document.getElementById('a');
  const elB = document.getElementById('b');
  const slot = document.getElementById('slot');

  const scoreEl = document.getElementById('score');
  const streakEl = document.getElementById('streak');
  const msgBig = document.getElementById('msgBig');
  const msgSmall = document.getElementById('msgSmall');

  const okEl = document.getElementById('ok');
  const totEl = document.getElementById('tot');
  const levelEl = document.getElementById('level');
  const confetti = document.getElementById('confetti');

  const choicesWrap = document.getElementById('choices');
  const nextWrap = document.getElementById('nextWrap');
  const btnNextBig = document.getElementById('btnNextBig');
  const btnNew = document.getElementById('btnNew');

  const choiceButtons = Array.from(document.querySelectorAll('button.choice'));

  // State
  let a = 1, b = 2;
  let score = 0;
  let streak = 0;
  let correct = 0;
  let total = 0;
  let locked = false;

  function randInt(min, max){
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function showChoices(){
    choicesWrap.classList.remove('hide');
    nextWrap.classList.remove('show');
  }
  function showNext(){
    choicesWrap.classList.add('hide');
    nextWrap.classList.add('show');
    btnNextBig.focus?.();
  }

  // Sempre numeri diversi (niente "=")
  function pickNewExercise(){
    locked = false;
    slot.textContent = '?';
    msgBig.textContent = 'Tocca un simbolo!';
    msgBig.className = 'big';
    msgSmall.textContent = 'Se A è più grande di B scegli “>”, se è più piccolo scegli “<”.';

    a = randInt(1, 10);
    b = (randInt(1, 10 - 1) + a - 1) % 10 + 1;
    // do { b = randInt(1, 10); } while (b === a);

    elA.textContent = a;
    elB.textContent = b;

    showChoices();
  }

  function resetGame(){
    score = 0;
    streak = 0;
    correct = 0;
    total = 0;
    locked = false;

    updateHUD();
    pickNewExercise();

    msgBig.textContent = 'Partita nuova! 🚀';
    msgBig.className = 'big';
    msgSmall.textContent = 'Inizia da qui: scegli < oppure >.';
  }

  function correctSymbol(){
    return (a < b) ? '<' : '>';
  }

  function spawnConfetti(){
    confetti.innerHTML = '';
    const count = 18;
    for (let i=0;i<count;i++){
      const p = document.createElement('i');
      p.style.left = (Math.random() * 100) + '%';
      p.style.top = (-10 - Math.random() * 30) + 'px';
      p.style.animationDuration = (700 + Math.random()*500) + 'ms';
      p.style.width = (7 + Math.random()*9) + 'px';
      p.style.height = (10 + Math.random()*12) + 'px';
      p.style.background = `hsl(${Math.floor(Math.random()*360)} 85% 65%)`;
      confetti.appendChild(p);
    }
    setTimeout(() => { confetti.innerHTML = ''; }, 1200);
  }

  function updateHUD(){
    scoreEl.textContent = score;
    streakEl.textContent = streak;
    okEl.textContent = correct;
    totEl.textContent = total;

    // livello aumenta ogni 10 corrette
    const level = 1 + Math.floor(correct / 10);
    levelEl.textContent = level;
  }

  function onAnswer(sym){
    if (locked) return;
    locked = true;

    total++;
    const cs = correctSymbol();
    const ok = (sym === cs);

    slot.textContent = sym;

    if (ok){
      correct++;
      streak++;
      score += 10 + Math.min(10, streak);

      msgBig.textContent = 'Esatto! ✅';
      msgBig.className = 'big badgeOk';
      msgSmall.textContent = (cs === '<')
        ? `${a} è minore di ${b}. Quindi: ${a} < ${b}.`
        : `${a} è maggiore di ${b}. Quindi: ${a} > ${b}.`;

      spawnConfetti();
    } else {
      streak = 0;
      score = Math.max(0, score - 3);

      msgBig.textContent = 'Ops… riproviamo! ❌';
      msgBig.className = 'big badgeBad';
      msgSmall.textContent = (cs === '<')
        ? `${a} è minore di ${b}. La risposta giusta era “<”.`
        : `${a} è maggiore di ${b}. La risposta giusta era “>”.`;
    }

    updateHUD();

    // Dopo la risposta: mostra AVANTI al posto dei due tasti
    showNext();
  }

  // Click handlers
  choiceButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      onAnswer(btn.dataset.sym); // '<' o '>'
    }, { passive: true });
  });

  // AVANTI: prossimo esercizio
  btnNextBig.addEventListener('click', () => {
    pickNewExercise();
  }, { passive: true });

  // NUOVO: reset partita
  btnNew.addEventListener('click', resetGame, { passive: true });

  // Desktop testing (opzionale)
  window.addEventListener('keydown', (e) => {
    if (!locked){
      if (e.key === '<') onAnswer('<');
      if (e.key === '>') onAnswer('>');
    } else {
      if (e.key === 'Enter') pickNewExercise();
    }
  });

  updateHUD();
  pickNewExercise();
})();
