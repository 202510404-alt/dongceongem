// =========================================================================
// 1. 기본 설정 및 초기화
// =========================================================================
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const API_KEY = 'YOUR_X_MASTER_KEY';
const BIN_ID = 'YOUR_BIN_ID';
const JSONBIN_URL = `https://api.jsonbin.io/v3/b/${BIN_ID}`;

let gameState = 'modeSelection';
let controlMode = 'keyboard';
let score = 0;
let keys = {};
let gameTime = 0, startTime = Date.now();
let finalScoreType = '', finalScore = 0;
let sewerRankings = [], droneRankings = [];
let inputState = { up: false, down: false, left: false, right: false, action: false };

document.addEventListener('keydown', (e) => { keys[e.key.toLowerCase()] = true; });
document.addEventListener('keyup', (e) => { keys[e.key.toLowerCase()] = false; });
canvas.addEventListener('click', handleMouseClick);
canvas.addEventListener('mousedown', handleMouseDown);
canvas.addEventListener('mousemove', handleMouseMove);
document.addEventListener('mouseup', handleMouseUp);
canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
canvas.addEventListener('touchend', handleTouchEnd, { passive: false });


// =========================================================================
// 2. 게임 루프 및 입력 처리
// =========================================================================
function gameLoop() { update(); draw(); requestAnimationFrame(gameLoop); }
function update() {
    if (controlMode === 'keyboard') {
        inputState.up = keys['w'] || false;
        inputState.down = keys['s'] || false;
        inputState.left = keys['a'] || false;
        inputState.right = keys['d'] || false;
        inputState.action = keys[' '] || false;
    }
    if (gameState === 'modeSelection') updateModeSelection();
    else if (gameState === 'start') updateStartScreen();
    else if (gameState === 'mario') updateMario();
    else if (gameState === 'choice') updateChoice();
    else if (gameState === 'sewerRun') updateSewerRun();
    else if (gameState === 'droneShooter') updateDroneShooter();
    else if (gameState === 'gameOver') updateGameOver();
}
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (gameState === 'modeSelection') drawModeSelection();
    else if (gameState === 'start') drawStartScreen();
    else if (gameState === 'mario') drawMario();
    else if (gameState === 'choice') drawChoice();
    else if (gameState === 'sewerRun') drawSewerRun();
    else if (gameState === 'droneShooter') drawDroneShooter();
    else if (gameState === 'gameOver') drawGameOver();
    if (controlMode === 'mobile' && (gameState === 'mario' || gameState === 'sewerRun' || gameState === 'droneShooter')) {
        drawMobileUI();
    }
}


// =========================================================================
// 3. 모바일 UI 및 통합 입력 처리 (마우스 + 터치)
// =========================================================================
const joystick = { x: 120, y: canvas.height - 120, radius: 80, stickRadius: 40, active: false, pointerId: null, dx: 0, dy: 0 };
const actionButton = { x: canvas.width - 120, y: canvas.height - 120, radius: 60, active: false, pointerId: null };

// !!! 여기가 수정된 부분: 좌표 변환기 함수 !!!
function getCanvasCoordinates(event) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    // 터치 이벤트와 마우스 이벤트를 모두 처리
    const clientX = event.clientX !== undefined ? event.clientX : event.touches[0].clientX;
    const clientY = event.clientY !== undefined ? event.clientY : event.touches[0].clientY;

    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;
    return { x, y };
}
// 단일 터치 객체를 위한 변환기
function getTouchCoordinates(touch) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (touch.clientX - rect.left) * scaleX;
    const y = (touch.clientY - rect.top) * scaleY;
    return { x, y };
}


function drawMobileUI() { ctx.globalAlpha = 0.5; ctx.fillStyle = 'grey'; ctx.beginPath(); ctx.arc(joystick.x, joystick.y, joystick.radius, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(actionButton.x, actionButton.y, actionButton.radius, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = actionButton.active ? 'white' : 'lightgrey'; ctx.beginPath(); ctx.arc(actionButton.x, actionButton.y, actionButton.radius - 5, 0, Math.PI*2); ctx.fill(); ctx.fillStyle = 'white'; ctx.beginPath(); ctx.arc(joystick.x + joystick.dx, joystick.y + joystick.dy, joystick.stickRadius, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1.0; }
function handleMouseDown(e) { if (controlMode !== 'mobile') return; const fakeTouch = { clientX: e.clientX, clientY: e.clientY, identifier: 'mouse' }; const fakeEvent = { changedTouches: [fakeTouch], preventDefault: () => {} }; handleTouchStart(fakeEvent); }
function handleMouseMove(e) { if (controlMode !== 'mobile') return; const fakeTouch = { clientX: e.clientX, clientY: e.clientY, identifier: 'mouse' }; const fakeEvent = { changedTouches: [fakeTouch], touches: [fakeTouch], preventDefault: () => {} }; handleTouchMove(fakeEvent); }
function handleMouseUp(e) { if (controlMode !== 'mobile') return; const fakeTouch = { clientX: e.clientX, clientY: e.clientY, identifier: 'mouse' }; const fakeEvent = { changedTouches: [fakeTouch], preventDefault: () => {} }; handleTouchEnd(fakeEvent); }

function handleTouchStart(e) {
    e.preventDefault();
    const touches = e.changedTouches;
    if (gameState === 'modeSelection' || gameState === 'start' || gameState === 'gameOver') {
        handleMouseClick({ clientX: touches[0].clientX, clientY: touches[0].clientY });
        return;
    }
    if (controlMode !== 'mobile') return;
    for (let i = 0; i < touches.length; i++) {
        const touch = touches[i];
        const { x, y } = getTouchCoordinates(touch); // !!! 좌표 변환 !!!
        const distToAction = Math.hypot(x - actionButton.x, y - actionButton.y);
        if (distToAction < actionButton.radius && !actionButton.active) {
            actionButton.active = true; actionButton.pointerId = touch.identifier; inputState.action = true;
        }
        const distToJoy = Math.hypot(x - joystick.x, y - joystick.y);
        if (distToJoy < joystick.radius && !joystick.active) {
            joystick.active = true; joystick.pointerId = touch.identifier;
        }
    }
}
function handleTouchMove(e) {
    if (controlMode !== 'mobile' || !joystick.active) return;
    e.preventDefault();
    for (let i = 0; i < e.touches.length; i++) {
        const touch = e.touches[i];
        if (touch.identifier === joystick.pointerId) {
            const { x, y } = getTouchCoordinates(touch); // !!! 좌표 변환 !!!
            const dx = x - joystick.x;
            const dy = y - joystick.y;
            const dist = Math.hypot(dx, dy);
            const angle = Math.atan2(dy, dx);
            const moveDist = Math.min(dist, joystick.radius - joystick.stickRadius);
            joystick.dx = Math.cos(angle) * moveDist;
            joystick.dy = Math.sin(angle) * moveDist;
            const threshold = joystick.radius * 0.2;
            inputState.right = joystick.dx > threshold;
            inputState.left = joystick.dx < -threshold;
            inputState.down = joystick.dy > threshold;
            inputState.up = joystick.dy < -threshold;
        }
    }
}
function handleTouchEnd(e) { if (controlMode !== 'mobile') return; e.preventDefault(); for (let i = 0; i < e.changedTouches.length; i++) { const touch = e.changedTouches[i]; if (touch.identifier === actionButton.pointerId) { actionButton.active = false; actionButton.pointerId = null; inputState.action = false; } if (touch.identifier === joystick.pointerId) { joystick.active = false; joystick.pointerId = null; joystick.dx = 0; joystick.dy = 0; inputState.up = false; inputState.down = false; inputState.left = false; inputState.right = false; } } }

// =========================================================================
// 4. 모드 선택, 시작 화면, 선택, 게임 오버 파트
// =========================================================================
const startButton = { x: canvas.width / 2 - 100, y: 200, width: 200, height: 60 };
const restartButton = { x: canvas.width / 2 - 125, y: canvas.height / 2 + 60, width: 250, height: 50 };
function initModeSelection() { gameState = 'modeSelection'; }
function updateModeSelection() {}
function drawModeSelection() { ctx.fillStyle = 'black'; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.fillStyle = '#444'; ctx.fillRect(100, 200, 250, 200); ctx.fillRect(450, 200, 250, 200); ctx.fillStyle = 'white'; ctx.font = '30px Arial'; ctx.textAlign = 'center'; ctx.fillText("PC 버전", 225, 310); ctx.fillText("(키보드)", 225, 350); ctx.fillText("모바일 버전", 575, 310); ctx.fillText("(터치)", 575, 350); ctx.textAlign = 'left'; }

function handleMouseClick(event) {
    const { x, y } = getCanvasCoordinates(event); // !!! 좌표 변환 !!!
    if (gameState === 'modeSelection') {
        if (x > 100 && x < 350 && y > 200 && y < 400) { controlMode = 'keyboard'; initStartScreen(); }
        if (x > 450 && x < 700 && y > 200 && y < 400) { controlMode = 'mobile'; initStartScreen(); }
    } else if (gameState === 'start') {
        if (x > startButton.x && x < startButton.x + startButton.width && y > startButton.y && y < startButton.y + startButton.height) { initMario(); }
    } else if (gameState === 'gameOver') {
        if (x > restartButton.x && x < restartButton.x + restartButton.width && y > restartButton.y && y < restartButton.y + restartButton.height) { initStartScreen(); }
    }
}
function initStartScreen() { gameState = 'start'; fetchRankings(); }
function updateStartScreen() { if (keys[' ']) { initMario(); } }
function drawStartScreen() { ctx.fillStyle = 'black'; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.fillStyle = 'white'; ctx.font = '50px Arial'; ctx.textAlign = 'center'; ctx.fillText("수질 정화 대작전", canvas.width / 2, 100); ctx.fillStyle = '#4CAF50'; ctx.fillRect(startButton.x, startButton.y, startButton.width, startButton.height); ctx.fillStyle = 'white'; ctx.font = '30px Arial'; ctx.fillText("시작하기", canvas.width / 2, startButton.y + 40); ctx.textAlign = 'left'; ctx.font = '20px Arial'; ctx.fillText("--- 하수구 랭킹 (Top 10) ---", 100, 320); if(sewerRankings.length > 0) { sewerRankings.forEach((rank, i) => { ctx.fillText(`${i + 1}. ${rank} 점`, 100, 350 + i * 25); }); } else { ctx.fillText("랭킹 데이터 없음...", 100, 350); } ctx.fillText("--- 드론 랭킹 (Top 10) ---", 450, 320); if(droneRankings.length > 0) { droneRankings.forEach((rank, i) => { ctx.fillText(`${i + 1}. ${rank} 점`, 450, 350 + i * 25); }); } else { ctx.fillText("랭킹 데이터 없음...", 450, 350); } ctx.textAlign = 'center'; }
function updateChoice() { if (keys['1']) { initSewerRun(); } else if (keys['2']) { initDroneShooter(); } }
function drawChoice() { ctx.fillStyle = 'black'; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.fillStyle = 'white'; ctx.font = '30px Arial'; ctx.textAlign = 'center'; ctx.fillText(`수집한 미생물: ${score}개`, canvas.width / 2, 150); ctx.fillText("어떤 방법으로 정화하시겠습니까?", canvas.width / 2, 250); ctx.font = '24px Arial'; ctx.fillText("1. 하수구 직접 정화", canvas.width / 2, 350); ctx.fillText("2. 드론으로 강 정화", canvas.width / 2, 400); ctx.textAlign = 'left'; }
function updateGameOver() { if (keys['r']) { initStartScreen(); } }
function drawGameOver() { ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.fillStyle = 'white'; ctx.font = '50px Arial'; ctx.textAlign = 'center'; ctx.fillText("미생물 부족!", canvas.width / 2, canvas.height / 2 - 40); ctx.font = '24px Arial'; ctx.fillText(`최종 점수: ${finalScore}개`, canvas.width / 2, canvas.height / 2 + 20); ctx.fillStyle = '#f44336'; ctx.fillRect(restartButton.x, restartButton.y, restartButton.width, restartButton.height); ctx.fillStyle = 'white'; ctx.font = '24px Arial'; ctx.fillText("메인 화면으로", canvas.width / 2, restartButton.y + 32); ctx.textAlign = 'left'; }

// ... (이하 MARIO, 하수구, 드론, JSONBin, 이미지 로딩 코드는 이전과 동일합니다)
let marioPlayer, goal, groundTiles, platforms, coins; let backgroundX = 0; const MARIO_GRAVITY = 0.8; const MARIO_GOAL_TIME = 120; const MARIO_SCROLL_THRESHOLD = canvas.width / 2; const PLATFORM_MIN_GAP = 150, PLATFORM_MAX_GAP = 300; const COIN_SPAWN_CHANCE = 0.25; let particles; function initMario() { gameState = 'mario'; score = 10; startTime = Date.now(); marioPlayer = { x: 50, y: 400, width: 50, height: 50, speed: 5, vy: 0, isJumping: true }; goal = { x: 0, y: 0, width: 20, height: 1000, isActive: false }; groundTiles = []; platforms = []; coins = []; backgroundX = 0; particles = []; groundTiles.push({ x: 0, y: 550, width: canvas.width, height: 50 }); groundTiles.push({ x: canvas.width, y: 550, width: canvas.width, height: 50 }); let currentX = canvas.width / 2; for (let i=0; i < 10; i++) { currentX = generateMarioObjects(currentX); } } function generateMarioObjects(currentX) { const gap = Math.random() * (PLATFORM_MAX_GAP - PLATFORM_MIN_GAP) + PLATFORM_MIN_GAP; const nextX = currentX + gap; if (Math.random() < 0.8) { const width1 = Math.random() * 70 + 80; platforms.push({ x: nextX, y: 430, width: width1, height: 15 }); if (Math.random() < COIN_SPAWN_CHANCE) { coins.push({ x: nextX + width1 / 2 - 10, y: 400, width: 20, height: 20 }); } if (Math.random() < 0.5) { const width2 = Math.random() * 70 + 80; platforms.push({ x: nextX, y: 300, width: width2, height: 15 }); if (Math.random() < COIN_SPAWN_CHANCE) { coins.push({ x: nextX + width2 / 2 - 10, y: 270, width: 20, height: 20 });} } } return nextX; } function updateMario() { gameTime = (Date.now() - startTime) / 1000; let scrollSpeed = 0; if (inputState.right) { if (marioPlayer.x < MARIO_SCROLL_THRESHOLD) { marioPlayer.x += marioPlayer.speed; } else { scrollSpeed = marioPlayer.speed; } } if (inputState.left && marioPlayer.x > 0) { marioPlayer.x -= marioPlayer.speed; } if (scrollSpeed > 0) { backgroundX -= scrollSpeed * 0.3; if (backgroundX <= -canvas.width) { backgroundX = 0; } [...groundTiles, ...platforms, ...coins, goal].forEach(obj => { obj.x -= scrollSpeed; }); } if (inputState.up && !marioPlayer.isJumping) { marioPlayer.vy = -18; marioPlayer.isJumping = true; } marioPlayer.vy += MARIO_GRAVITY; marioPlayer.y += marioPlayer.vy; let onSomething = false; groundTiles.forEach(tile => { if (marioPlayer.y + marioPlayer.height >= tile.y && marioPlayer.x < tile.x + tile.width && marioPlayer.x + marioPlayer.width > tile.x) { marioPlayer.y = tile.y - marioPlayer.height; marioPlayer.vy = 0; onSomething = true; } }); platforms.forEach(p => { if (marioPlayer.vy > 0 && marioPlayer.y + marioPlayer.height >= p.y && marioPlayer.y + marioPlayer.height - marioPlayer.vy <= p.y + 5 && marioPlayer.x < p.x + p.width && marioPlayer.x + marioPlayer.width > p.x) { marioPlayer.y = p.y - marioPlayer.height; marioPlayer.vy = 0; onSomething = true; } }); marioPlayer.isJumping = !onSomething; for (let i = coins.length - 1; i >= 0; i--) { const c = coins[i]; if (marioPlayer.x < c.x + c.width && marioPlayer.x + marioPlayer.width > c.x && marioPlayer.y < c.y + c.height && marioPlayer.y + marioPlayer.height > c.y) { score++; coins.splice(i, 1); } } let rightmostX = 0; [...groundTiles, ...platforms].forEach(obj => { if (obj.x + obj.width > rightmostX) rightmostX = obj.x + obj.width; }); if (!goal.isActive && rightmostX < canvas.width * 2) { generateMarioObjects(rightmostX); } groundTiles.forEach((t, i) => { if (t.x + t.width < 0) { const other = i === 0 ? 1 : 0; t.x = groundTiles[other].x + groundTiles[other].width; } }); if (gameTime >= MARIO_GOAL_TIME && !goal.isActive) { goal.isActive = true; goal.x = rightmostX; } if (goal.isActive && marioPlayer.x + marioPlayer.width > goal.x) { gameState = 'choice'; } } function drawMario() { ctx.drawImage(backgroundImage, backgroundX, 0, canvas.width, canvas.height); ctx.drawImage(backgroundImage, backgroundX + canvas.width, 0, canvas.width, canvas.height); ctx.fillStyle = 'green'; groundTiles.forEach(t => ctx.fillRect(t.x, t.y, t.width, t.height)); ctx.fillStyle = 'gold'; coins.forEach(c => { ctx.beginPath(); ctx.arc(c.x + 10, c.y + 10, 10, 0, Math.PI*2); ctx.fill(); }); ctx.fillStyle = 'saddlebrown'; platforms.forEach(p => ctx.fillRect(p.x, p.y, p.width, p.height)); ctx.drawImage(playerImage, marioPlayer.x, marioPlayer.y, marioPlayer.width, marioPlayer.height); ctx.fillStyle = 'black'; ctx.font = '20px Arial'; ctx.fillText(`Time: ${Math.floor(gameTime)}s`, 10, 30); ctx.fillText(`Microbes: ${score}`, 10, 60); }
let sewerPlayer, sewerTiles, sewerRunObjects; let sewerRunScore = 0; const LANE_Y_POSITIONS = [250, 350, 450, 550]; const SEWER_AUTO_SCROLL_SPEED = -3; let laneObstacleTimers = []; function initSewerRun() { gameState = 'sewerRun'; sewerRunScore = 0; sewerPlayer = { x: 100, width: 50, height: 50, speed: 5, currentLane: 1, y: LANE_Y_POSITIONS[1] }; sewerTiles = []; sewerRunObjects = []; laneObstacleTimers = []; const tileWidth = 200; const numTiles = Math.ceil(canvas.width / tileWidth) + 1; for (let i = 0; i < numTiles; i++) { sewerTiles.push({ x: i * tileWidth, y: 0 }); } for (let i = 0; i < 4; i++) { laneObstacleTimers.push(Math.random() * 120 + 60); } let currentX = canvas.width; for(let i=0; i < 5; i++) { currentX = generateSewer(currentX); } } function generateSewer(currentX) { const gap = Math.random() * 400 + 300; const nextX = currentX + gap; const laneIndex = Math.floor(Math.random() * 4); if (Math.random() < 0.5) { sewerRunObjects.push({ type: 'sewer', x: nextX, y: LANE_Y_POSITIONS[laneIndex] + 5, radius: 20, isCleaned: false, lane: laneIndex }); } return nextX; } function updateSewerRun() { if (score <= 0) { finalScoreType = 'sewer'; finalScore = sewerRunScore; submitScore(finalScoreType, finalScore); gameState = 'gameOver'; return; } laneObstacleTimers.forEach((timer, i) => { laneObstacleTimers[i]--; if (laneObstacleTimers[i] <= 0) { if (Math.random() < 0.3) { sewerRunObjects.push({ type: 'obstacle', x: canvas.width + 50, y: LANE_Y_POSITIONS[i], width: 40, height: 40, lane: i }); } laneObstacleTimers[i] = Math.random() * 120 + 60; } }); let playerScrollSpeed = 0; if (inputState.left) { playerScrollSpeed = sewerPlayer.speed; } if (inputState.right) { playerScrollSpeed = -sewerPlayer.speed; } sewerTiles.forEach(tile => { tile.x += playerScrollSpeed; }); sewerRunObjects.forEach(obj => { if (obj.type === 'obstacle') { obj.x += SEWER_AUTO_SCROLL_SPEED + playerScrollSpeed; } else if (obj.type === 'sewer') { obj.x += playerScrollSpeed; } }); sewerTiles.forEach(tile => { if (tile.x < -200) { tile.x += sewerTiles.length * 200; } else if (tile.x > canvas.width) { tile.x -= sewerTiles.length * 200; } }); if (inputState.up) { if (sewerPlayer.currentLane > 0) sewerPlayer.currentLane--; } if (inputState.down) { if (sewerPlayer.currentLane < LANE_Y_POSITIONS.length - 1) sewerPlayer.currentLane++; } sewerPlayer.y = LANE_Y_POSITIONS[sewerPlayer.currentLane]; for (let i = sewerRunObjects.length - 1; i >= 0; i--) { const obj = sewerRunObjects[i]; if (obj.x < -100) { sewerRunObjects.splice(i, 1); continue; } if (obj.lane !== sewerPlayer.currentLane) continue; const playerBox = { x: sewerPlayer.x, y: sewerPlayer.y, width: sewerPlayer.width, height: sewerPlayer.height }; if (obj.type === 'obstacle') { const obstacleBox = { x: obj.x, y: obj.y, width: obj.width, height: obj.height }; if (playerBox.x < obstacleBox.x + obstacleBox.width && playerBox.x + playerBox.width > obstacleBox.x && playerBox.y < obstacleBox.y + obstacleBox.height && playerBox.y + playerBox.height > obstacleBox.y) { score--; sewerRunObjects.splice(i, 1); } } else if (obj.type === 'sewer') { if (inputState.action && !obj.isCleaned && Math.abs((sewerPlayer.x + sewerPlayer.width / 2) - obj.x) < 40) { if (score > 0) { score--; obj.isCleaned = true; sewerRunScore++; } } } } let rightmostSewerX = 0; sewerRunObjects.forEach(obj => { if (obj.type === 'sewer' && obj.x > rightmostSewerX) rightmostSewerX = obj.x; }); if (rightmostSewerX < canvas.width + 400) { generateSewer(rightmostSewerX); } } function drawSewerRun() { ctx.fillStyle = '#333333'; ctx.fillRect(0, 0, canvas.width, canvas.height); sewerTiles.forEach(tile => { ctx.fillStyle = '#424242'; ctx.fillRect(tile.x, 250, 200, 400); ctx.strokeStyle = '#333333'; ctx.lineWidth = 2; for(let i=0; i<10; i++){ctx.beginPath(); ctx.moveTo(tile.x+i*20, 250); ctx.lineTo(tile.x+i*20, canvas.height); ctx.stroke();} for(let i=0; i<20; i++){ctx.beginPath(); ctx.moveTo(tile.x, 250+i*20); ctx.lineTo(tile.x+200, 250+i*20); ctx.stroke();} }); ctx.strokeStyle = '#212121'; ctx.lineWidth = 4; LANE_Y_POSITIONS.forEach((yPos, i) => { if(i<3){const lineY = yPos + 75; ctx.beginPath(); ctx.moveTo(0, lineY); ctx.lineTo(canvas.width, lineY); ctx.stroke();} }); sewerRunObjects.forEach(obj => { if (obj.type === 'obstacle') { ctx.fillStyle = 'red'; ctx.fillRect(obj.x, obj.y, obj.width, obj.height); } else if (obj.type === 'sewer') { ctx.fillStyle = obj.isCleaned ? 'deepskyblue' : 'black'; ctx.beginPath(); ctx.arc(obj.x, obj.y, obj.radius, 0, Math.PI * 2); ctx.fill(); } }); ctx.drawImage(playerImage, sewerPlayer.x, sewerPlayer.y, sewerPlayer.width, sewerPlayer.height); ctx.fillStyle = 'white'; ctx.font = '20px Arial'; ctx.fillText(`Microbes: ${score}`, 10, 30); ctx.fillText(`Purified: ${sewerRunScore}`, 10, 60); }
let droneShooterPlayer, bullets, pollutants; let droneShooterScore = 0; let shootCooldown = 0; let pollutantSpawnTimer = 0; const RIVER_MARGIN = 150; function initDroneShooter() { gameState = 'droneShooter'; droneShooterScore = 0; droneShooterPlayer = { x: canvas.width / 2 - 25, y: canvas.height - 80, width: 50, height: 50, speed: 6 }; bullets = []; pollutants = []; shootCooldown = 0; pollutantSpawnTimer = 60; } function updateDroneShooter() { if (score < 0.1) { finalScoreType = 'drone'; finalScore = droneShooterScore; submitScore(finalScoreType, finalScore); gameState = 'gameOver'; return; } shootCooldown--; pollutantSpawnTimer--; if (inputState.left) { droneShooterPlayer.x -= droneShooterPlayer.speed; } if (inputState.right) { droneShooterPlayer.x += droneShooterPlayer.speed; } if (droneShooterPlayer.x < RIVER_MARGIN) droneShooterPlayer.x = RIVER_MARGIN; if (droneShooterPlayer.x + droneShooterPlayer.width > canvas.width - RIVER_MARGIN) droneShooterPlayer.x = canvas.width - RIVER_MARGIN - droneShooterPlayer.width; if (inputState.action && score >= 0.1 && shootCooldown <= 0) { score -= 0.1; bullets.push({ x: droneShooterPlayer.x + droneShooterPlayer.width / 2 - 5, y: droneShooterPlayer.y, width: 10, height: 20, speed: 8 }); shootCooldown = 12; } for (let i = bullets.length - 1; i >= 0; i--) { bullets[i].y -= bullets[i].speed; if (bullets[i].y < 0) bullets.splice(i, 1); } if (pollutantSpawnTimer <= 0) { pollutants.push({ x: Math.random() * (canvas.width - RIVER_MARGIN * 2 - 40) + RIVER_MARGIN, y: -50, width: 40, height: 40, speedY: Math.random() * 1 + 1, hp: Math.floor(Math.random() * 3) + 1, maxHp: 3 }); pollutantSpawnTimer = Math.random() * 90 + 30; } for (let i = pollutants.length - 1; i >= 0; i--) { const p = pollutants[i]; p.y += p.speedY; if (p.y > canvas.height) { pollutants.splice(i, 1); continue; } for (let j = bullets.length - 1; j >= 0; j--) { const b = bullets[j]; if (b.x < p.x + p.width && b.x + b.width > p.x && b.y < p.y + p.height && b.y + b.height > p.y) { bullets.splice(j, 1); p.hp -= 0.5; if (p.hp <= 0) { pollutants.splice(i, 1); droneShooterScore++; break; } } } } } function drawDroneShooter() { ctx.fillStyle = '#616161'; ctx.fillRect(0, 0, RIVER_MARGIN, canvas.height); ctx.fillRect(canvas.width - RIVER_MARGIN, 0, RIVER_MARGIN, canvas.height); ctx.fillStyle = '#1a237e'; ctx.fillRect(RIVER_MARGIN, 0, canvas.width - RIVER_MARGIN * 2, canvas.height); ctx.fillStyle = 'deepskyblue'; bullets.forEach(b => { ctx.beginPath(); ctx.arc(b.x + 5, b.y + 10, 5, 0, Math.PI * 2); ctx.fill(); }); pollutants.forEach(p => { const colorValue = Math.floor(150 * (1 - p.hp / p.maxHp)); ctx.fillStyle = `rgb(${colorValue}, ${colorValue}, ${colorValue})`; ctx.beginPath(); ctx.arc(p.x + p.width/2, p.y + p.height/2, p.width/2, 0, Math.PI*2); ctx.fill(); }); ctx.drawImage(playerImage, droneShooterPlayer.x, droneShooterPlayer.y, droneShooterPlayer.width, droneShooterPlayer.height); ctx.fillStyle = 'white'; ctx.font = '20px Arial'; ctx.fillText(`Microbes: ${score.toFixed(1)}`, 10, 30); ctx.fillText(`Purified: ${droneShooterScore}`, 10, 60); }
function fetchRankings() { if (!API_KEY || !BIN_ID || API_KEY === 'YOUR_X_MASTER_KEY') return; fetch(`${JSONBIN_URL}/latest`, { headers: { 'X-Master-Key': API_KEY } }).then(response => response.json()).then(data => { sewerRankings = data.record.sewer.map(r => r.score).sort((a, b) => b - a); droneRankings = data.record.drone.map(r => r.score).sort((a, b) => b - a); }).catch(error => console.error('랭킹 로딩 실패:', error)); }
function submitScore(gameType, finalScore) { if (!API_KEY || !BIN_ID || API_KEY === 'YOUR_X_MASTER_KEY') return; fetch(`${JSONBIN_URL}/latest`, { headers: { 'X-Master-Key': API_KEY } }).then(response => response.json()).then(data => { let currentRankings = data.record; currentRankings[gameType].push({ score: finalScore, date: new Date().toISOString() }); currentRankings[gameType].sort((a, b) => b.score - a.score); currentRankings[gameType] = currentRankings[gameType].slice(0, 10); return fetch(JSONBIN_URL, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'X-Master-Key': API_KEY }, body: JSON.stringify(currentRankings) }); }).then(response => response.json()).then(() => { fetchRankings(); }).catch(error => console.error('점수 제출 실패:', error)); }
const playerImage = new Image(); const backgroundImage = new Image();
playerImage.src = 'player.gif'; backgroundImage.src = 'background.png';
let imagesLoaded = 0; const totalImages = 2;
function onImageLoad() { imagesLoaded++; if (imagesLoaded === totalImages) { initModeSelection(); gameLoop(); } }
playerImage.onload = onImageLoad; backgroundImage.onload = onImageLoad;    
