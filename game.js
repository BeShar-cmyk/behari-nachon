// ===== קטגוריות =====
const CATEGORIES = [
    { name: "בעלי חיים",  items: ["כלב","חתול","ארנב","פרה","עז","סוס","עכבר","פיל","ציפור","דג","אריה","נמר"],     notItems: ["שולחן","ספר","מכונית","בית","עיפרון","מחשב","טלפון","כיסא","חלון","דלת"] },
    { name: "פירות",       items: ["תפוח","בננה","תפוז","ענב","אבטיח","תות","מנגו","אגס","לימון","דובדבן","קיווי"],  notItems: ["גזר","עגבנייה","תפוח אדמה","בצל","שולחן","עיפרון","כלב","מכונית","ספר"] },
    { name: "ירקות",       items: ["גזר","עגבנייה","מלפפון","בצל","תרד","כרוב","חסה","פלפל","שום","קישואים"],         notItems: ["תפוח","בננה","כלב","מכונית","ספר","עיפרון","שולחן","כיסא"] },
    { name: "מקצועות",    items: ["רופא","מורה","שוטר","אופה","עורך דין","מהנדס","אחות","נהג","טבח","צייר"],          notItems: ["כלב","תפוח","ים","הר","עץ","בית","מכונית","שולחן","ספר"] },
    { name: "צבעים",       items: ["אדום","כחול","ירוק","צהוב","סגול","כתום","ורוד","לבן","שחור","חום","תכלת"],       notItems: ["גדול","מהיר","יפה","חכם","שמח","כלב","תפוח","ספר","שולחן"] },
    { name: "ספורט",       items: ["כדורגל","שחייה","טניס","כדורסל","ריצה","גלישה","התעמלות","אופניים","יוגה","גולף"], notItems: ["ספר","מוסיקה","אוכל","שינה","כלב","תפוח","מכונית","שולחן"] },
    { name: "כלי נגינה",  items: ["גיטרה","פסנתר","חליל","תופים","כינור","חצוצרה","אקורדיון","סקסופון","בנג'ו"],      notItems: ["שולחן","כלב","תפוח","מכונית","ספר","עיפרון","כיסא","חלון"] },
    { name: "מדינות",      items: ["ישראל","צרפת","גרמניה","ברזיל","יפן","מצרים","איטליה","הודו","סין","קנדה"],        notItems: ["תל אביב","ירושלים","תפוח","כלב","מכונית","ספר","שולחן","גיטרה"] },
    { name: "כלי אוכל",   items: ["מזלג","כף","סכין","צלחת","כוס","סיר","מחבת","קערה","מגש","קומקום"],               notItems: ["גיטרה","ספר","כדורגל","כלב","תפוח","שולחן","מכונית"] },
    { name: "חלקי גוף",   items: ["יד","רגל","עין","אוזן","אף","פה","ראש","כתף","ברך","אצבע","גב"],                   notItems: ["שולחן","ספר","מכונית","תפוח","כלב","גיטרה","כדורגל"] }
];

const SYMBOLS = [
    { color: '#e94560', clip: '',                                                                                                                     radius: '50%' },
    { color: '#4CAF50', clip: '',                                                                                                                     radius: '6px' },
    { color: '#FF9800', clip: 'polygon(50% 0%, 0% 100%, 100% 100%)',                                                                                 radius: '0' },
    { color: '#9C27B0', clip: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',                    radius: '0' },
    { color: '#2196F3', clip: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',                                                                         radius: '0' },
    { color: '#F44336', clip: 'polygon(33% 0%, 67% 0%, 67% 33%, 100% 33%, 100% 67%, 67% 67%, 67% 100%, 33% 100%, 33% 67%, 0% 67%, 0% 33%, 33% 33%)', radius: '0' }
];

const TOTAL_ROUNDS = 10;
const TIMER_SECS   = 5;

let score, round, streak, timerInterval, timeLeft, canAnswer, currentCorrect, soundOn;
soundOn = true;

// ===== אודיו (Web Audio API - ללא קבצים) =====
let audioCtx = null;
function getCtx() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    return audioCtx;
}

function playSound(type) {
    if (!soundOn) return;
    try {
        const ctx = getCtx();
        const sequences = {
            correct: [[523,0,0.12],[659,0.1,0.12],[784,0.2,0.25]],
            wrong:   [[260,0,0.1],[180,0.1,0.2]],
            timeout: [[350,0,0.08],[220,0.1,0.2]],
            combo:   [[784,0,0.08],[1047,0.08,0.08],[1319,0.16,0.2]],
            win:     [[523,0,0.08],[659,0.08,0.08],[784,0.16,0.08],[1047,0.24,0.35]],
            click:   [[900,0,0.04]]
        };
        (sequences[type] || []).forEach(([freq, t, dur]) => {
            const osc  = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain); gain.connect(ctx.destination);
            osc.type = (type === 'wrong' || type === 'timeout') ? 'sawtooth' : 'sine';
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0.18, ctx.currentTime + t);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + dur);
            osc.start(ctx.currentTime + t);
            osc.stop(ctx.currentTime + t + dur + 0.01);
        });
    } catch(e) {}
}

function toggleSound() {
    soundOn = !soundOn;
    document.getElementById('sound-btn').textContent = soundOn ? '🔊' : '🔇';
}

// ===== פרטיקלים =====
function spawnParticles(x, y) {
    const colors = ['#FFD700','#FF6B6B','#4CAF50','#2196F3','#9C27B0','#FF9800','#fff','#e94560'];
    for (let i = 0; i < 22; i++) {
        const p = document.createElement('div');
        p.className = 'particle';
        p.style.cssText = `left:${x}px; top:${y}px; background:${colors[i % colors.length]}; border-radius:${Math.random()>0.5?'50%':'3px'};`;
        const angle = (Math.random() * 360) * Math.PI / 180;
        const dist  = 55 + Math.random() * 130;
        p.style.setProperty('--dx', (Math.cos(angle)*dist) + 'px');
        p.style.setProperty('--dy', (Math.sin(angle)*dist) + 'px');
        document.body.appendChild(p);
        setTimeout(() => p.remove(), 800);
    }
}

// ===== ניקוד צף =====
function showFloatingScore(pts, x, y) {
    const el = document.createElement('div');
    el.className   = 'float-score';
    el.textContent = '+' + pts;
    el.style.left  = x + 'px';
    el.style.top   = y + 'px';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1050);
}

// ===== רעידת מסך =====
function shakeScreen() {
    const c = document.getElementById('game-container');
    c.classList.add('shake-anim');
    c.addEventListener('animationend', () => c.classList.remove('shake-anim'), { once: true });
}

// ===== פלאש מסך =====
function flashScreen(color) {
    const ov = document.getElementById('feedback-overlay');
    ov.className = color === 'green' ? 'flash-green' : 'flash-red';
    setTimeout(() => { ov.className = ''; }, 300);
}

// ===== קונפטי סוף =====
function launchConfetti() {
    const colors = ['#FFD700','#FF6B6B','#4CAF50','#2196F3','#FF9800','#9C27B0','#fff'];
    for (let i = 0; i < 70; i++) {
        setTimeout(() => {
            const p = document.createElement('div');
            p.className = 'confetti-piece';
            p.style.cssText = `
                left: ${Math.random()*100}vw;
                background: ${colors[Math.floor(Math.random()*colors.length)]};
                border-radius: ${Math.random()>0.5?'50%':'2px'};
                width: ${8+Math.random()*8}px;
                height: ${8+Math.random()*8}px;
                animation-duration: ${1.5+Math.random()*2}s;
                animation-delay: ${Math.random()*0.3}s;
            `;
            document.body.appendChild(p);
            setTimeout(() => p.remove(), 3200);
        }, i * 35);
    }
}

// ===== היפוך כרטיס =====
function flipCard(callback) {
    const card = document.getElementById('card');
    card.classList.add('flip-anim');
    card.addEventListener('animationend', () => {
        card.classList.remove('flip-anim');
        callback();
    }, { once: true });
}

// ===== ריפל על כפתור =====
function addRipple(btn, e) {
    const rect   = btn.getBoundingClientRect();
    const ripple = document.createElement('span');
    const size   = Math.max(rect.width, rect.height);
    ripple.className = 'ripple';
    ripple.style.cssText = `width:${size}px; height:${size}px; left:${e.clientX-rect.left-size/2}px; top:${e.clientY-rect.top-size/2}px;`;
    btn.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
}

// ===== עזרים =====
function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length-1; i > 0; i--) {
        const j = Math.floor(Math.random()*(i+1));
        [a[i],a[j]] = [a[j],a[i]];
    }
    return a;
}
function randItem(arr) { return arr[Math.floor(Math.random()*arr.length)]; }
function show(id)      { document.getElementById(id).classList.remove('hidden'); }
function hide(id)      { document.getElementById(id).classList.add('hidden'); }
function setText(id,t) { document.getElementById(id).textContent = t; }

function updateHeader() {
    setText('score', score);
    setText('round', round);
    setText('streak', streak);
    const badge = document.getElementById('streak-badge');
    badge.style.color = streak >= 3 ? '#FF9800' : 'white';
    badge.style.textShadow = streak >= 3 ? '0 0 12px rgba(255,152,0,0.8)' : 'none';
}

function showCombo(n) {
    const banner = document.getElementById('combo-banner');
    setText('combo-num', n);
    banner.classList.remove('hidden');
    setTimeout(() => banner.classList.add('hidden'), 900);
}

function renderSymbol(sym) {
    const el = document.getElementById('symbol-shape');
    el.style.background   = sym.color;
    el.style.borderRadius = sym.radius;
    el.style.clipPath      = sym.clip;
}

// ===== התחלת משחק =====
function startGame() {
    score = round = streak = 0;
    updateHeader();
    hide('start-screen');
    show('game-screen');
    nextRound();
}

// ===== סיבוב חדש =====
function nextRound() {
    if (round >= TOTAL_ROUNDS) { endGame(); return; }

    hide('result-screen');
    show('game-screen');
    round++;
    canAnswer = true;
    updateHeader();

    const cat = randItem(CATEGORIES);
    currentCorrect = randItem(cat.items);
    const options  = shuffle([currentCorrect, ...shuffle(cat.notItems).slice(0,3)]);

    flipCard(() => {
        renderSymbol(randItem(SYMBOLS));
        setText('category-name', cat.name);

        const grid = document.getElementById('options-grid');
        grid.innerHTML = '';
        options.forEach(word => {
            const btn = document.createElement('button');
            btn.className   = 'option-btn';
            btn.textContent = word;
            btn.onclick = (e) => {
                addRipple(btn, e);
                playSound('click');
                checkAnswer(btn, word);
            };
            grid.appendChild(btn);
        });

        startTimer(TIMER_SECS);
    });
}

// ===== טיימר =====
function startTimer(seconds) {
    clearInterval(timerInterval);
    const fill  = document.getElementById('timer-fill');
    timeLeft    = seconds * 10;
    const total = timeLeft;
    fill.style.width = '100%';
    fill.className   = '';

    timerInterval = setInterval(() => {
        timeLeft--;
        const pct = (timeLeft / total) * 100;
        fill.style.width = pct + '%';
        if      (pct < 30) fill.className = 'danger';
        else if (pct < 60) fill.className = 'warning';
        if (timeLeft <= 0) { clearInterval(timerInterval); if (canAnswer) timeOut(); }
    }, 100);
}

// ===== בדיקת תשובה =====
function checkAnswer(btn, selected) {
    if (!canAnswer) return;
    canAnswer = false;
    clearInterval(timerInterval);

    const isCorrect = selected === currentCorrect;

    document.querySelectorAll('.option-btn').forEach(b => {
        if (b.textContent === currentCorrect)     b.className = 'option-btn correct';
        else if (b === btn && !isCorrect)          b.className = 'option-btn wrong';
    });

    if (isCorrect) {
        const speedBonus = Math.floor((timeLeft / 50) * 100);
        const pts        = 100 + speedBonus;
        score  += pts;
        streak++;

        // אפקטים
        flashScreen('green');
        playSound(streak >= 3 ? 'combo' : 'correct');

        const rect = btn.getBoundingClientRect();
        spawnParticles(rect.left + rect.width/2, rect.top + rect.height/2);
        showFloatingScore(pts, rect.left + rect.width/2, rect.top);

        if (streak >= 3) showCombo(streak);

        const streakMsg = streak > 1 ? ` | רצף ${streak} 🔥` : '';
        showResult(true, 'כל הכבוד! 🎉', `+${pts} נקודות (בונוס מהירות +${speedBonus})${streakMsg}`);
    } else {
        streak = 0;
        flashScreen('red');
        shakeScreen();
        playSound('wrong');
        showResult(false, 'אוי לא! ❌', `התשובה הנכונה הייתה: ${currentCorrect}`);
    }
}

// ===== פג הזמן =====
function timeOut() {
    canAnswer = false;
    streak    = 0;
    document.querySelectorAll('.option-btn').forEach(b => {
        if (b.textContent === currentCorrect) b.className = 'option-btn missed';
    });
    flashScreen('red');
    shakeScreen();
    playSound('timeout');
    showResult(false, '⏰ נגמר הזמן!', `התשובה הנכונה: ${currentCorrect}`);
}

// ===== הצגת תוצאה =====
function showResult(ok, title, msg) {
    updateHeader();
    setTimeout(() => {
        hide('game-screen');
        show('result-screen');
        setText('result-emoji', ok ? '✅' : '❌');
        setText('result-title', title);
        setText('result-msg',   msg);
        setTimeout(nextRound, 1500);
    }, 550);
}

// ===== סיום =====
function endGame() {
    clearInterval(timerInterval);
    hide('game-screen');
    hide('result-screen');
    show('end-screen');
    playSound('win');
    launchConfetti();

    setText('final-score', score + ' נקודות');

    const pct = (score / (TOTAL_ROUNDS * 200)) * 100;
    let grade;
    if      (pct >= 80) grade = '🏆 מדהים! אתה/את אלוף/ת הקטגוריות!';
    else if (pct >= 60) grade = '⭐ יופי! תוצאה מצוינת!';
    else if (pct >= 40) grade = '👍 לא רע! נסה/י שוב לשפר!';
    else                grade = '💪 אל תוותר/י! תנסה/י שוב!';
    setText('final-grade', grade);
}

// ===== איפוס =====
function resetGame() {
    hide('end-screen');
    show('start-screen');
}
