(() => {
  const scoreEl = document.getElementById('score');
  const streakEl = document.getElementById('streak');

  const msgBig = document.getElementById('msgBig');
  const question = document.getElementById('question');
  // const msgSmall = document.getElementById('msgSmall');

  const okEl = document.getElementById('ok');
  const totEl = document.getElementById('tot');
  const levelEl = document.getElementById('level');
  const gridWrap = document.querySelector('.gridWrap');

  const grid = document.getElementById('grid');
  const nextWrap = document.getElementById('nextWrap');
  const btnNextBig = document.getElementById('btnNextBig');
  const btnNew = document.getElementById('btnNew');
  const confetti = document.getElementById('confetti');

  // State
  let score = 0;
  let streak = 0;
  let correct = 0;
  let total = 0;

  let base = 0;      // numero mostrato
  let expected = 1;  // seguente

  function randInt(min, max){
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function showNext(show){
    gridWrap.classList.toggle('show-next', !!show);
  }

  function setGridEnabled(enabled){
    grid.querySelectorAll('button.choice').forEach(b => {
      b.disabled = !enabled;
    });
  }

  function buildGrid(){
    grid.innerHTML = '';

    // ordine esplicito dei numeri (layout desiderato)
    const numbers = [1,2,3,4,5,6,7,8,9,0,10];

    numbers.forEach(n => {
      const btn = document.createElement('button');
      btn.className = 'choice';
      btn.type = 'button';
      btn.textContent = String(n);
      btn.dataset.n = String(n);
      btn.setAttribute('aria-label', `Numero ${n}`);

      // il 10 deve essere largo il doppio
      if (n === 10) btn.classList.add('wide10');

      btn.addEventListener('click', () => onAnswer(n), { passive: true });
      grid.appendChild(btn);
    });
  }

  function pickNewExercise(){
    // base deve essere 0..9 per avere seguente 1..10
    base = randInt(0, 9);
    task = randInt(0, 1) === 0 ? "precedente" : "seguente";

    expected = base + 1;
    if (task === "precedente")
    {
      // Swap expected and base
      let tmp = base;
      base = expected;
      expected = tmp;
    }

    question.textContent = "Qual è il " + task + " del " + base + "?";


    msgBig.textContent = 'Scegli un numero!';
    msgBig.className = 'big';
    // msgSmall.textContent = 'Trova il numero subito dopo.';

    showNext(false);
    setGridEnabled(true);
  }

  function resetGame(){
    score = 0;
    streak = 0;
    correct = 0;
    total = 0;

    updateHUD();
    pickNewExercise();

    msgBig.textContent = 'Partita nuova! 🚀';
    msgBig.className = 'big';
    // msgSmall.textContent = 'Inizia: scegli il seguente.';
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

    const level = 1 + Math.floor(correct / 10);
    levelEl.textContent = level;
  }

  function onAnswer(n){
    // Se sbaglia: NON bloccare, NON andare avanti
    if (n !== expected){
      streak = 0;
      score = Math.max(0, score - 1); // penalità leggera
      total++; // conteggiamo il tentativo (se preferisci non contarlo, dimmelo)
      msgBig.textContent = 'Ops… riprova! ❌';
      msgBig.className = 'big badgeBad';
      // msgSmall.textContent = `Prova ancora: qual è il seguente del ${base}?`;
      updateHUD();
      return;
    }

    // Risposta corretta
    total++;
    correct++;
    streak++;
    score += 10 + Math.min(10, streak);

    msgBig.textContent = 'Bravissimo! ✅';
    msgBig.className = 'big badgeOk';
    // msgSmall.textContent = `Giusto: il seguente di ${base} è ${expected}.`;

    updateHUD();
    setGridEnabled(false);
    showNext(true);
    spawnConfetti();
  }

  // AVANTI: nuovo esercizio
  btnNextBig.addEventListener('click', () => {
    pickNewExercise();
  }, { passive: true });

  // NUOVO: reset partita
  btnNew.addEventListener('click', resetGame, { passive: true });

  // Init
  buildGrid();
  updateHUD();
  pickNewExercise();
})();
