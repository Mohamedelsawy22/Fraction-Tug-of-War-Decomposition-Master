// Game Constants & Types
const GameStatus = {
    START: 'START',
    PLAYING: 'PLAYING',
    FINISHED: 'FINISHED'
};

// State Management
let state = {
    status: GameStatus.START,
    ropePosition: 0,
    team1Score: 0,
    team2Score: 0,
    winner: null,
    team1Problem: null,
    team2Problem: null,
    isActivelyPulling: false,
    team1Flipped: false,
    team2Flipped: false,
    team1ErrorIndex: null,
    team2ErrorIndex: null
};

// --- Math Logic ---

function generateProblem() {
    const denominator = Math.floor(Math.random() * 8) + 3; // 3 to 10
    const operator = Math.random() > 0.5 ? '+' : '-';
    
    let n1, n2, correctNumerator;
    
    if (operator === '+') {
        n1 = Math.floor(Math.random() * (denominator - 1)) + 1;
        n2 = Math.floor(Math.random() * (denominator - n1)) + 1;
        correctNumerator = n1 + n2;
    } else {
        n1 = Math.floor(Math.random() * (denominator - 1)) + 2;
        n2 = Math.floor(Math.random() * (n1 - 1)) + 1;
        correctNumerator = n1 - n2;
    }
    
    const optionNumerators = new Set();
    optionNumerators.add(correctNumerator);
    
    while (optionNumerators.size < 4) {
        let distractor;
        const coinFlip = Math.random();
        if (coinFlip < 0.4) {
            distractor = correctNumerator + (Math.random() > 0.5 ? 1 : -1);
        } else if (coinFlip < 0.7) {
            distractor = operator === '+' ? n1 : n1 + n2;
        } else {
            distractor = Math.floor(Math.random() * (denominator + 2));
        }
        if (distractor >= 0 && distractor !== correctNumerator) {
            optionNumerators.add(distractor);
        }
    }
    
    const shuffledNumerators = Array.from(optionNumerators).sort(() => Math.random() - 0.5);
    const correctIndex = shuffledNumerators.indexOf(correctNumerator);

    return {
        id: Math.random().toString(36).substr(2, 9),
        operands: [{ numerator: n1, denominator }, { numerator: n2, denominator }],
        operator,
        options: shuffledNumerators.map(n => ({ numerator: n, denominator })),
        correctIndex
    };
}

// --- Game Actions ---

function startGame() {
    state.status = GameStatus.PLAYING;
    state.ropePosition = 0;
    state.team1Score = 0;
    state.team2Score = 0;
    state.winner = null;
    state.team1Problem = generateProblem();
    state.team2Problem = generateProblem();
    render();
}

function handleSolve(team, index) {
    if (state.status !== GameStatus.PLAYING) return;

    const problem = team === 'TEAM_1' ? state.team1Problem : state.team2Problem;
    const isCorrect = index === problem.correctIndex;

    if (isCorrect) {
        state.isActivelyPulling = true;
        const pullAmount = team === 'TEAM_1' ? -20 : 20;
        state.ropePosition = Math.min(100, Math.max(-100, state.ropePosition + pullAmount));
        
        if (team === 'TEAM_1') {
            state.team1Score++;
            state.team1Problem = generateProblem();
        } else {
            state.team2Score++;
            state.team2Problem = generateProblem();
        }

        setTimeout(() => {
            state.isActivelyPulling = false;
            render();
        }, 800);
    } else {
        const pushBackAmount = team === 'TEAM_1' ? 20 : -20;
        state.ropePosition = Math.min(100, Math.max(-100, state.ropePosition + pushBackAmount));
        
        if (team === 'TEAM_1') {
            state.team1Score = Math.max(0, state.team1Score - 1);
            state.team1ErrorIndex = index;
            setTimeout(() => { state.team1ErrorIndex = null; render(); }, 500);
        } else {
            state.team2Score = Math.max(0, state.team2Score - 1);
            state.team2ErrorIndex = index;
            setTimeout(() => { state.team2ErrorIndex = null; render(); }, 500);
        }
    }

    // Check win condition
    if (state.ropePosition <= -98) {
        state.status = GameStatus.FINISHED;
        state.winner = 'TEAM_1';
    } else if (state.ropePosition >= 98) {
        state.status = GameStatus.FINISHED;
        state.winner = 'TEAM_2';
    }

    render();
}

// --- Rendering Logic ---

function render() {
    const app = document.getElementById('app');
    
    if (state.status === GameStatus.START) {
        app.innerHTML = renderStartScreen();
    } else if (state.status === GameStatus.FINISHED) {
        app.innerHTML = renderFinishScreen();
    } else {
        app.innerHTML = renderGameScreen();
    }
}

function renderStartScreen() {
    return `
        <div class="min-h-screen bg-[#bfe7ea] flex flex-col items-center justify-center text-gray-800 p-6 relative overflow-hidden">
            <div class="bg-white/90 backdrop-blur-xl p-16 rounded-[4rem] border-4 border-white shadow-2xl text-center max-w-2xl relative z-10">
                <div class="flex justify-center items-center space-x-12 mb-10">
                    <div class="w-24 h-24 bg-[#ef4444] rounded-3xl rotate-12 flex items-center justify-center shadow-2xl border-2 border-white/50">
                        <i class="fas fa-fire-alt text-white text-5xl"></i>
                    </div>
                    <div class="text-gray-300 text-6xl font-black italic select-none">VS</div>
                    <div class="w-24 h-24 bg-[#3b82f6] rounded-3xl -rotate-12 flex items-center justify-center shadow-2xl border-2 border-white/50">
                        <i class="fas fa-bolt text-white text-5xl"></i>
                    </div>
                </div>
                <h1 class="text-7xl font-black mb-6 tracking-tighter uppercase leading-[0.9] text-[#2d5a5c]">
                    FRACTION<br/><span class="text-[#e67e22]">TUG-OF-WAR</span>
                </h1>
                <p class="text-xl text-gray-500 mb-12 font-medium">
                    Add and subtract fractions with same denominators. Pull the rope. Win the match!
                </p>
                <button onclick="startGame()" class="bg-[#e67e22] hover:bg-[#d35400] text-white font-black text-4xl px-20 py-6 rounded-3xl shadow-xl transition-all active:scale-95">
                    PLAY MATCH
                </button>
            </div>
        </div>
    `;
}

function renderFinishScreen() {
    const winnerColor = state.winner === 'TEAM_1' ? 'text-[#ef4444]' : 'text-[#3b82f6]';
    return `
        <div class="min-h-screen bg-[#bfe7ea] flex flex-col items-center justify-center p-6 text-gray-800">
            <div class="bg-white/95 backdrop-blur-2xl p-20 rounded-[4rem] border-8 border-white shadow-2xl text-center">
                <div class="relative inline-block mb-10">
                    <i class="fas fa-trophy text-[12rem] text-yellow-400 drop-shadow-2xl"></i>
                </div>
                <h2 class="text-8xl font-black mb-6 uppercase tracking-tighter ${winnerColor}">
                    ${state.winner === 'TEAM_1' ? 'MAGMA' : 'VOLT'} TEAM WINS!
                </h2>
                <div class="flex items-center justify-center space-x-16 mb-16">
                    <div class="text-center">
                        <div class="text-[#ef4444] text-7xl font-black">${state.team1Score}</div>
                        <div class="text-[12px] uppercase tracking-widest text-gray-400 font-bold">Magma Score</div>
                    </div>
                    <div class="text-gray-200 text-5xl font-thin">/</div>
                    <div class="text-center">
                        <div class="text-[#3b82f6] text-7xl font-black">${state.team2Score}</div>
                        <div class="text-[12px] uppercase tracking-widest text-gray-400 font-bold">Volt Score</div>
                    </div>
                </div>
                <button onclick="startGame()" class="bg-[#2d5a5c] text-white font-black text-3xl px-16 py-5 rounded-3xl shadow-xl transition-all active:scale-95">
                    REMATCH
                </button>
            </div>
        </div>
    `;
}

function renderGameScreen() {
    return `
        <div class="min-h-screen bg-white flex flex-col overflow-hidden font-fredoka">
            <header class="bg-white/90 backdrop-blur-md border-b-2 border-gray-100 p-4 flex justify-between items-center px-12 z-30 shadow-sm">
                <div class="flex items-center space-x-8">
                    <div class="flex items-center space-x-4">
                        <div class="w-12 h-12 bg-[#e67e22] rounded-2xl flex items-center justify-center text-white shadow-lg">
                            <i class="fas fa-graduation-cap text-2xl"></i>
                        </div>
                        <span class="font-black text-gray-800 text-2xl uppercase tracking-wider hidden sm:inline">Fraction Tug-of-War</span>
                    </div>
                    <button onclick="if(confirm('End match?')) state.status = GameStatus.START; render();" class="flex items-center space-x-3 px-6 py-2.5 bg-gray-100 hover:bg-red-50 hover:text-red-600 rounded-2xl font-bold transition-all active:scale-95 text-gray-500 border border-transparent hover:border-red-100 shadow-sm">
                        <i class="fas fa-power-off"></i>
                        <span class="text-xs uppercase tracking-[0.2em] font-black">Quit Game</span>
                    </button>
                </div>
                <div class="flex items-center space-x-12">
                    <div class="flex flex-col items-end">
                        <span class="text-[#ef4444] font-black text-xl uppercase leading-none">Magma Team</span>
                        <span class="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">P1</span>
                    </div>
                    <div class="h-10 w-[2px] bg-gray-100"></div>
                    <div class="flex flex-col items-start">
                        <span class="text-[#3b82f6] font-black text-xl uppercase leading-none">Volt Team</span>
                        <span class="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">P2</span>
                    </div>
                </div>
            </header>

            <main class="flex-grow flex flex-col lg:flex-row p-6 lg:p-10 gap-8 items-stretch overflow-hidden">
                <div class="flex-1 min-w-0">
                    ${renderMathCard('TEAM_1', state.team1Problem, state.team1Score, 'red', state.team1Flipped, state.team1ErrorIndex)}
                </div>

                <div class="w-full lg:w-[480px] xl:w-[650px] flex flex-col justify-center bg-[#f0f9fa] rounded-[4rem] border-8 border-white shadow-2xl p-1 relative overflow-hidden shrink-0">
                    ${renderTugOfWar()}
                    <div class="p-6 grid grid-cols-2 gap-6 bg-white/60 border-t-4 border-white">
                        <div class="bg-white p-6 rounded-[2.5rem] border-4 border-[#ef4444]/10 shadow-lg text-center">
                            <div class="text-[#ef4444] font-black text-5xl">${state.team1Score}</div>
                            <div class="text-gray-400 text-[11px] uppercase font-black tracking-widest mt-2">Red Points</div>
                        </div>
                        <div class="bg-white p-6 rounded-[2.5rem] border-4 border-[#3b82f6]/10 shadow-lg text-center">
                            <div class="text-[#3b82f6] font-black text-5xl">${state.team2Score}</div>
                            <div class="text-gray-400 text-[11px] uppercase font-black tracking-widest mt-2">Blue Points</div>
                        </div>
                    </div>
                </div>

                <div class="flex-1 min-w-0">
                    ${renderMathCard('TEAM_2', state.team2Problem, state.team2Score, 'blue', state.team2Flipped, state.team2ErrorIndex)}
                </div>
            </main>
        </div>
    `;
}

function renderMathCard(team, problem, score, color, isFlipped, errorIndex) {
    const mainColorClass = color === 'blue' ? 'bg-[#1e3a8a]' : 'bg-[#7f1d1d]';
    const cardGradient = color === 'blue' ? 'from-[#1e3a8a] to-[#2563eb]' : 'from-[#7f1d1d] to-[#dc2626]';
    const accentColor = color === 'blue' ? '#3b82f6' : '#ef4444';
    const teamName = team === 'TEAM_1' ? 'Magma Riders' : 'Volt Blasters';

    return `
        <div class="math-card-root flex flex-col h-full ${mainColorClass} bg-gradient-to-br ${cardGradient} p-6 rounded-[3rem] shadow-2xl border-b-[12px] border-black/30 touch-none relative select-none overflow-hidden ${isFlipped ? 'flipped' : ''}">
            <div class="flex justify-between items-center mb-6 relative z-10">
                <div class="flex items-center space-x-4">
                    <div class="bg-white/20 p-4 rounded-3xl backdrop-blur-md border border-white/20">
                        <i class="fas ${color === 'red' ? 'fa-fire-alt' : 'fa-bolt'} text-white text-3xl"></i>
                    </div>
                    <div>
                        <h2 class="text-white text-[10px] font-bold uppercase tracking-[0.4em] opacity-80">STRIKER</h2>
                        <h3 class="text-white text-3xl font-black uppercase tracking-tight">${teamName}</h3>
                    </div>
                </div>
                <div class="bg-black/20 px-8 py-3 rounded-full text-white font-black text-4xl border-2 border-white/20 shadow-inner min-w-[120px] text-center">
                    ${score}
                </div>
            </div>

            <div class="bg-white rounded-[3rem] p-10 flex-grow flex flex-col items-center justify-center shadow-[inset_0_8px_24px_rgba(0,0,0,0.1)] mb-6 relative border-4 border-white/40">
                <div class="absolute top-6 left-1/2 -translate-x-1/2 text-gray-300 text-[10px] uppercase font-black tracking-[0.4em]">Solve Expression</div>
                <div class="flex items-center space-x-8">
                    ${problem.operands.map((part, idx) => `
                        <div class="flex flex-col items-center">
                            <span class="text-6xl font-black text-gray-800 leading-tight">${part.numerator}</span>
                            <div class="w-full h-2 bg-gray-800 my-1 rounded-full"></div>
                            <span class="text-3xl font-bold text-gray-400">${part.denominator}</span>
                        </div>
                        ${idx < problem.operands.length - 1 ? `<span class="text-6xl font-black text-gray-300">${problem.operator}</span>` : ''}
                    `).join('')}
                    <span class="text-6xl font-black text-gray-300">=</span>
                    <div class="w-24 h-32 border-4 border-dashed border-gray-200 rounded-3xl flex items-center justify-center">
                        <span class="text-6xl font-black text-gray-100">?</span>
                    </div>
                </div>
            </div>

            <div class="p-6 bg-black/10 rounded-[3rem] backdrop-blur-xl border border-white/10 shadow-inner">
                <div class="flex justify-between items-center mb-4 px-4">
                    <span class="text-white text-[12px] font-bold uppercase tracking-[0.3em] opacity-80">Choose the Correct Result</span>
                    <button onclick="state.${team === 'TEAM_1' ? 'team1Flipped' : 'team2Flipped'} = !state.${team === 'TEAM_1' ? 'team1Flipped' : 'team2Flipped'}; render();" class="text-white opacity-40 hover:opacity-100 transition-opacity">
                        <i class="fas fa-arrows-rotate"></i>
                    </button>
                </div>
                <div class="grid grid-cols-2 gap-4 place-items-center">
                    ${problem.options.map((opt, i) => `
                        <div onclick="handleSolve('${team}', ${i})" class="group relative flex flex-col items-center justify-center bg-white rounded-3xl shadow-lg border-4 select-none cursor-pointer touch-none w-32 h-36 transition-all duration-150 ${errorIndex === i ? 'border-red-500 animate-shake' : 'border-gray-100 hover:border-blue-300'} shadow-[0_8px_0_0_rgba(0,0,0,0.1)] active:scale-90 active:translate-y-[4px] active:shadow-none">
                            <span class="text-4xl font-black text-gray-800 pointer-events-none">${opt.numerator}</span>
                            <div class="w-2/3 h-2 my-1.5 rounded-full opacity-40 pointer-events-none" style="background-color: ${accentColor}"></div>
                            <span class="text-2xl font-bold text-gray-400 pointer-events-none">${opt.denominator}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
}

function renderTugOfWar() {
    const leftPercent = 50 + (state.ropePosition / 2);
    return `
        <div class="relative w-full h-[450px] flex flex-col items-center justify-end overflow-hidden bg-gradient-to-b from-[#bfe7ea] to-[#a7dadc] rounded-[3rem] shadow-inner">
            <div class="absolute w-[150%] h-64 bg-[#c99a65] rounded-[100%] -bottom-32 z-0 border-t-[12px] border-[#b08554] shadow-[inset_0_20px_40px_rgba(0,0,0,0.1)]"></div>
            <div class="absolute w-[400%] h-4 z-30 flex items-center transition-all duration-700 bottom-36 ${state.isActivelyPulling ? 'animate-rope-pull-vibration' : ''}" style="left: calc(${leftPercent}% - 200%)">
                <div class="absolute inset-x-0 h-[14px] bg-[#fdfaf5] shadow-[0_8px_16px_rgba(0,0,0,0.3)] border-y-2 border-gray-300 rounded-full overflow-hidden">
                    <div class="w-full h-full opacity-40 bg-[repeating-linear-gradient(60deg,transparent,transparent_12px,#8b5e3c_12px,#8b5e3c_24px)]"></div>
                </div>
                <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-40">
                    <div class="w-6 h-12 bg-[#e74c3c] rounded-sm shadow-2xl border-x-2 border-[#c0392b]"></div>
                </div>
                <!-- Characters would go here - simplified for vanilla version or use SVG templates -->
                <div class="absolute right-[calc(50%+35px)] flex space-x-[-45px] items-end pb-0">
                    ${renderCharacter('boy-blonde', '#e63946', state.ropePosition < 0, true)}
                    ${renderCharacter('boy-spiky', '#c1121f', state.ropePosition < 0, true)}
                </div>
                <div class="absolute left-[calc(50%+35px)] flex space-x-[-45px] items-end pb-0">
                    ${renderCharacter('boy-short', '#2980b9', state.ropePosition > 0, false)}
                    ${renderCharacter('boy-afro', '#3498db', state.ropePosition > 0, false)}
                </div>
            </div>
        </div>
    `;
}

function renderCharacter(type, shirtColor, isPulling, facingRight) {
    const scaleX = facingRight ? 1 : -1;
    const baseLeanAngle = facingRight ? -32 : 32;
    const currentLeanAngle = isPulling ? baseLeanAngle : 0;
    const animationClass = isPulling ? 'animate-character-bounce' : 'animate-character-idle';

    return `
        <div class="relative w-32 h-48 flex flex-col items-center justify-end overflow-visible" style="--ra: ${baseLeanAngle}deg">
            <div class="w-full h-full flex flex-col items-center justify-end overflow-visible ${animationClass}" style="transform: scaleX(${scaleX}) rotate(${currentLeanAngle}deg)">
                <svg viewBox="0 0 100 160" class="w-full h-full overflow-visible drop-shadow-[0_10px_20px_rgba(0,0,0,0.3)]">
                    <circle cx="50" cy="40" r="25" fill="#fdf1e6" />
                    <rect x="30" y="65" width="40" height="50" rx="10" fill="${shirtColor}" />
                    <rect x="30" y="115" width="18" height="30" rx="5" fill="#2c3e50" />
                    <rect x="52" y="115" width="18" height="30" rx="5" fill="#2c3e50" />
                    <!-- Simple Arms -->
                    <path d="M30 80 L10 100" stroke="#fdf1e6" stroke-width="10" stroke-linecap="round" />
                    <path d="M70 80 L90 100" stroke="#fdf1e6" stroke-width="10" stroke-linecap="round" />
                </svg>
            </div>
        </div>
    `;
}

// --- Pointer Debugger Logic ---

const debuggerState = {
    enabled: false,
    pointers: new Map()
};

window.addEventListener('pointerdown', (e) => {
    if (e.clientX < 100 && e.clientY < 100 && e.detail >= 3) {
        debuggerState.enabled = !debuggerState.enabled;
        if (!debuggerState.enabled) {
            document.getElementById('pointer-debugger').innerHTML = '';
        }
    }
    if (debuggerState.enabled) {
        debuggerState.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
        renderDebugger();
    }
});

window.addEventListener('pointermove', (e) => {
    if (debuggerState.enabled && debuggerState.pointers.has(e.pointerId)) {
        debuggerState.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
        renderDebugger();
    }
});

window.addEventListener('pointerup', (e) => {
    if (debuggerState.enabled) {
        debuggerState.pointers.delete(e.pointerId);
        renderDebugger();
    }
});

function renderDebugger() {
    const container = document.getElementById('pointer-debugger');
    if (!debuggerState.enabled) return;
    
    let html = '';
    debuggerState.pointers.forEach((p, id) => {
        html += `<div class="pointer-debug-point" style="left: ${p.x}px; top: ${p.y}px; border-color: hsl(${id * 40}, 70%, 50%)">${id}</div>`;
    });
    container.innerHTML = html;
}

// Initial Render
render();
