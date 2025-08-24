// =========================================================================
// 1. 기본 설정 및 초기화
// =========================================================================
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const API_KEY = '$2a$10$7eC/WMxnHG69g8oVI1jBkOQWKu6jZF5eOtprIHYEcZx3RKq0veh4.';
const BIN_ID = '68a95d74d0ea881f4061154b';
const JSONBIN_URL = `https://api.jsonbin.io/v3/b/${BIN_ID}`;

let gameState = 'modeSelection';
let controlMode = 'keyboard';
let score = 10;
let coins = 0;
let upgradeLevels = { hp: 0, power: 0, ammo: 0 };

let keys = {};
let gameTime = 0, startTime = Date.now();
let finalScoreType = '', finalScore = 0;
let sewerRankings = [], droneRankings = [], bossRankings = [];
let inputState = { up: false, down: false, left: false, right: false, action: false, actionHold: false, actionPressed: false, upPressed: false, downPressed: false };

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
        let upJustPressed = keys['w'] && !inputState.upPressed; inputState.up = upJustPressed; inputState.upPressed = keys['w'] || false;
        let downJustPressed = keys['s'] && !inputState.downPressed; inputState.down = downJustPressed; inputState.downPressed = keys['s'] || false;
        inputState.left = keys['a'] || false; inputState.right = keys['d'] || false;
        let actionJustPressed = keys[' '] && !inputState.actionPressed; inputState.action = actionJustPressed; inputState.actionHold = keys[' '] || false; inputState.actionPressed = keys[' '] || false;
    }

    if (gameState === 'modeSelection') updateModeSelection();
    else if (gameState === 'start') updateStartScreen();
    else if (gameState === 'upgradeScreen') updateUpgradeScreen();
    else if (gameState === 'mario') updateMario();
    else if (gameState === 'choice') updateChoice();
    else if (gameState === 'sewerRun') updateSewerRun();
    else if (gameState === 'droneShooter') updateDroneShooter();
    else if (gameState === 'bossFight') boss_updateBossFight();
    else if (gameState === 'gameOver') updateGameOver();
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (gameState === 'modeSelection') drawModeSelection();
    else if (gameState === 'start') drawStartScreen();
    else if (gameState === 'upgradeScreen') drawUpgradeScreen();
    else if (gameState === 'mario') drawMario();
    else if (gameState === 'choice') drawChoice();
    else if (gameState === 'sewerRun') drawSewerRun();
    else if (gameState === 'droneShooter') drawDroneShooter();
    else if (gameState === 'bossFight') boss_drawBossFight();
    else if (gameState === 'gameOver') drawGameOver();

    if (controlMode === 'mobile' && (gameState === 'mario' || gameState === 'sewerRun' || gameState === 'droneShooter' || gameState === 'bossFight')) {
        drawMobileUI();
    }
}

// =========================================================================
// 3. 모바일 UI 및 통합 입력 처리 (마우스 + 터치)
// =========================================================================
const joystick = { x: 120, y: canvas.height - 120, radius: 80, stickRadius: 40, active: false, pointerId: null, dx: 0, dy: 0 };
const actionButton = { x: canvas.width - 120, y: canvas.height - 120, radius: 60, active: false, pointerId: null };
function getCanvasCoordinates(event) { const rect = canvas.getBoundingClientRect(); const scaleX = canvas.width / rect.width; const scaleY = canvas.height / rect.height; const clientX = event.clientX !== undefined ? event.clientX : event.touches[0].clientX; const clientY = event.clientY !== undefined ? event.clientY : event.touches[0].clientY; const x = (clientX - rect.left) * scaleX; const y = (clientY - rect.top) * scaleY; return { x, y }; }
function getTouchCoordinates(touch) { const rect = canvas.getBoundingClientRect(); const scaleX = canvas.width / rect.width; const scaleY = canvas.height / rect.height; const x = (touch.clientX - rect.left) * scaleX; const y = (touch.clientY - rect.top) * scaleY; return { x, y }; }
function drawMobileUI() { ctx.globalAlpha = 0.5; ctx.fillStyle = 'grey'; ctx.beginPath(); ctx.arc(joystick.x, joystick.y, joystick.radius, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(actionButton.x, actionButton.y, actionButton.radius, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = actionButton.active ? 'white' : 'lightgrey'; ctx.beginPath(); ctx.arc(actionButton.x, actionButton.y, actionButton.radius - 5, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = 'white'; ctx.beginPath(); ctx.arc(joystick.x + joystick.dx, joystick.y + joystick.dy, joystick.stickRadius, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1.0; }
function handleMouseDown(e) { if (controlMode !== 'mobile') return; const fakeTouch = { clientX: e.clientX, clientY: e.clientY, identifier: 'mouse' }; const fakeEvent = { changedTouches: [fakeTouch], preventDefault: () => {} }; handleTouchStart(fakeEvent); }
function handleMouseMove(e) { if (controlMode !== 'mobile') return; const fakeTouch = { clientX: e.clientX, clientY: e.clientY, identifier: 'mouse' }; const fakeEvent = { changedTouches: [fakeTouch], touches: [fakeTouch], preventDefault: () => {} }; handleTouchMove(fakeEvent); }
function handleMouseUp(e) { if (controlMode !== 'mobile') return; const fakeTouch = { clientX: e.clientX, clientY: e.clientY, identifier: 'mouse' }; const fakeEvent = { changedTouches: [fakeTouch], preventDefault: () => {} }; handleTouchEnd(fakeEvent); }
function handleTouchStart(e) { e.preventDefault(); const touches = e.changedTouches; if (gameState === 'modeSelection' || gameState === 'start' || gameState === 'gameOver' || gameState === 'upgradeScreen') { handleMouseClick({ clientX: touches[0].clientX, clientY: touches[0].clientY }); return; } if (controlMode !== 'mobile') return; for (let i = 0; i < touches.length; i++) { const touch = touches[i]; const { x, y } = getTouchCoordinates(touch); const distToAction = Math.hypot(x - actionButton.x, y - actionButton.y); if (distToAction < actionButton.radius && !actionButton.active) { actionButton.active = true; actionButton.pointerId = touch.identifier; inputState.action = true; inputState.actionHold = true; } const distToJoy = Math.hypot(x - joystick.x, y - joystick.y); if (distToJoy < joystick.radius && !joystick.active) { joystick.active = true; joystick.pointerId = touch.identifier; } } }
function handleTouchMove(e) { if (controlMode !== 'mobile') return; e.preventDefault(); for (let i = 0; i < e.touches.length; i++) { const touch = e.touches[i]; if (touch.identifier === joystick.pointerId) { const { x, y } = getTouchCoordinates(touch); const dx = x - joystick.x; const dy = y - joystick.y; const dist = Math.hypot(dx, dy); const angle = Math.atan2(dy, dx); const moveDist = Math.min(dist, joystick.radius - joystick.stickRadius); joystick.dx = Math.cos(angle) * moveDist; joystick.dy = Math.sin(angle) * moveDist; const threshold = joystick.radius * 0.2; inputState.right = joystick.dx > threshold; inputState.left = joystick.dx < -threshold; const verticalThreshold = joystick.radius * 0.4; let upNow = joystick.dy < -verticalThreshold; let downNow = joystick.dy > verticalThreshold; if (upNow && !inputState.upPressed) { inputState.up = true; } else { inputState.up = false; } inputState.upPressed = upNow; if (downNow && !inputState.downPressed) { inputState.down = true; } else { inputState.down = false; } inputState.downPressed = downNow; } } }
function handleTouchEnd(e) { if (controlMode !== 'mobile') return; e.preventDefault(); for (let i = 0; i < e.changedTouches.length; i++) { const touch = e.changedTouches[i]; if (touch.identifier === actionButton.pointerId) { actionButton.active = false; actionButton.pointerId = null; inputState.action = false; inputState.actionHold = false; } if (touch.identifier === joystick.pointerId) { joystick.active = false; joystick.pointerId = null; joystick.dx = 0; joystick.dy = 0; inputState.up = false; inputState.down = false; inputState.left = false; inputState.right = false; inputState.upPressed = false; inputState.downPressed = false; } } }

// =========================================================================
// 4. 모드 선택, 시작 화면, 선택, 게임 오버, 업그레이드 파트
// =========================================================================
const startMinigameButton = { x: canvas.width / 2 - 150, y: 200, width: 300, height: 60 };
const startBossButton = { x: canvas.width / 2 - 150, y: 280, width: 300, height: 60 };
const startUpgradeButton = { x: canvas.width / 2 - 150, y: 360, width: 300, height: 60 };
const restartButton = { x: canvas.width / 2 - 125, y: canvas.height / 2 + 60, width: 250, height: 50 };
const hpUpgradeButton = { x: 100, y: 200, width: 200, height: 150 };
const powerUpgradeButton = { x: 350, y: 200, width: 200, height: 150 };
const ammoUpgradeButton = { x: 600, y: 200, width: 200, height: 150 };
const backButton = { x: canvas.width / 2 - 100, y: 450, width: 200, height: 50 };

function initModeSelection() { gameState = 'modeSelection'; }
function updateModeSelection() {}
function drawModeSelection() { ctx.fillStyle = 'black'; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.fillStyle = '#444'; ctx.fillRect(100, 200, 250, 200); ctx.fillRect(450, 200, 250, 200); ctx.fillStyle = 'white'; ctx.font = '30px Arial'; ctx.textAlign = 'center'; ctx.fillText("PC 버전", 225, 310); ctx.fillText("(키보드)", 225, 350); ctx.fillText("모바일 버전", 575, 310); ctx.fillText("(터치)", 575, 350); ctx.textAlign = 'left'; }

function handleMouseClick(event) {
    const { x, y } = getCanvasCoordinates(event);
    if (gameState === 'modeSelection') {
        if (x > 100 && x < 350 && y > 200 && y < 400) { controlMode = 'keyboard'; initStartScreen(); }
        if (x > 450 && x < 700 && y > 200 && y < 400) { controlMode = 'mobile'; initStartScreen(); }
    } else if (gameState === 'start') {
        if (x > startMinigameButton.x && x < startMinigameButton.x + startMinigameButton.width && y > startMinigameButton.y && y < startMinigameButton.y + startMinigameButton.height) { initMario(); }
        if (x > startBossButton.x && x < startBossButton.x + startBossButton.width && y > startBossButton.y && y < startBossButton.y + startBossButton.height) { boss_initBossFight(); }
        if (x > startUpgradeButton.x && x < startUpgradeButton.x + startUpgradeButton.width && y > startUpgradeButton.y && y < startUpgradeButton.y + startUpgradeButton.height) { initUpgradeScreen(); }
    } else if (gameState === 'upgradeScreen') {
        if (x > hpUpgradeButton.x && x < hpUpgradeButton.x + hpUpgradeButton.width && y > hpUpgradeButton.y && y < hpUpgradeButton.y + hpUpgradeButton.height) { purchaseUpgrade('hp'); }
        if (x > powerUpgradeButton.x && x < powerUpgradeButton.x + powerUpgradeButton.width && y > powerUpgradeButton.y && y < powerUpgradeButton.y + powerUpgradeButton.height) { purchaseUpgrade('power'); }
        if (x > ammoUpgradeButton.x && x < ammoUpgradeButton.x + ammoUpgradeButton.width && y > ammoUpgradeButton.y && y < ammoUpgradeButton.y + ammoUpgradeButton.height) { purchaseUpgrade('ammo'); }
        if (x > backButton.x && x < backButton.x + backButton.width && y > backButton.y && y < backButton.y + backButton.height) { initStartScreen(); }
    } else if (gameState === 'gameOver') {
        if (x > restartButton.x && x < restartButton.x + restartButton.width && y > restartButton.y && y < restartButton.y + restartButton.height) {
            initStartScreen();
        }
    }
}

function initStartScreen(isRestart = false) {
    gameState = 'start';
    if (isRestart) {
        score = 10;
        coins = 0;
        upgradeLevels = { hp: 0, power: 0, ammo: 0 };
    }
    fetchRankings();
}
function updateStartScreen() {}
function drawStartScreen() {
    ctx.fillStyle = 'black'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white'; ctx.font = '50px Arial'; ctx.textAlign = 'center';
    ctx.fillText("수질 정화 대작전", canvas.width / 2, 120);
    ctx.font = '24px Arial';
    ctx.fillText(`보유 코인: ${coins} G`, canvas.width / 2, 160);

    ctx.fillStyle = '#4CAF50'; ctx.fillRect(startMinigameButton.x, startMinigameButton.y, startMinigameButton.width, startMinigameButton.height);
    ctx.fillStyle = '#f44336'; ctx.fillRect(startBossButton.x, startBossButton.y, startBossButton.width, startBossButton.height);
    ctx.fillStyle = '#2196F3'; ctx.fillRect(startUpgradeButton.x, startUpgradeButton.y, startUpgradeButton.width, startUpgradeButton.height);
    ctx.fillStyle = 'white'; ctx.font = '30px Arial';
    ctx.fillText("미니게임 (자원 수집)", canvas.width / 2, startMinigameButton.y + 40);
    ctx.fillText("보스전", canvas.width / 2, startBossButton.y + 40);
    ctx.fillText("업그레이드", canvas.width / 2, startUpgradeButton.y + 40);

    ctx.textAlign = 'left'; ctx.font = '20px Arial';
    ctx.fillText("--- 하수구 랭킹 (Top 5) ---", 50, 460);
    if (sewerRankings.length > 0) { sewerRankings.slice(0, 5).forEach((rank, i) => { ctx.fillText(`${i + 1}. ${rank} 점`, 50, 490 + i * 25); }); } else { ctx.fillText("랭킹 데이터 없음...", 50, 490); }
    ctx.fillText("--- 드론 랭킹 (Top 5) ---", 300, 460);
    if (droneRankings.length > 0) { droneRankings.slice(0, 5).forEach((rank, i) => { ctx.fillText(`${i + 1}. ${rank} 점`, 300, 490 + i * 25); }); } else { ctx.fillText("랭킹 데이터 없음...", 300, 490); }
    ctx.fillText("--- 보스 클리어 타임 (Top 5) ---", 550, 460);
    if (bossRankings.length > 0) { bossRankings.slice(0, 5).forEach((rank, i) => { ctx.fillText(`${i + 1}. ${rank} 초`, 550, 490 + i * 25); }); } else { ctx.fillText("랭킹 데이터 없음...", 550, 490); }
    ctx.textAlign = 'center';
}

function updateChoice() { if (keys['1']) { initSewerRun(); } else if (keys['2']) { initDroneShooter(); } }
function drawChoice() { ctx.fillStyle = 'black'; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.fillStyle = 'white'; ctx.font = '30px Arial'; ctx.textAlign = 'center'; ctx.fillText(`수집한 미생물: ${score}개`, canvas.width / 2, 150); ctx.fillText("어떤 방법으로 정화하시겠습니까?", canvas.width / 2, 250); ctx.font = '24px Arial'; ctx.fillText("1. 하수구 직접 정화", canvas.width / 2, 350); ctx.fillText("2. 드론으로 강 정화", canvas.width / 2, 400); ctx.textAlign = 'left'; }

function updateGameOver() { if (keys['r']) { initStartScreen(); } }
function drawGameOver() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white'; ctx.font = '50px Arial'; ctx.textAlign = 'center';
    ctx.fillText(finalScoreType === 'boss' && finalScore > 0 ? "도전 성공!" : "도전 실패!", canvas.width / 2, canvas.height / 2 - 40);
    ctx.font = '24px Arial';
    let scoreText = finalScoreType === 'boss' ? `클리어 타임: ${finalScore} 초` : `최종 점수: ${finalScore} 점`;
    if (finalScoreType === 'boss' && finalScore > 0) scoreText += ` (50 코인 획득!)`;
    if (finalScoreType !== 'boss') scoreText += ` (${finalScore} 코인 획득!)`;
    if (finalScoreType === 'boss' && finalScore === 0) scoreText = "HP가 모두 소진되었습니다.";
    ctx.fillText(scoreText, canvas.width / 2, canvas.height / 2 + 20);
    ctx.fillStyle = '#4CAF50'; ctx.fillRect(restartButton.x, restartButton.y, restartButton.width, restartButton.height);
    ctx.fillStyle = 'white'; ctx.font = '24px Arial';
    ctx.fillText("메인 화면으로", canvas.width / 2, restartButton.y + 32);
    ctx.textAlign = 'left';
}

function initUpgradeScreen() { gameState = 'upgradeScreen'; }
function updateUpgradeScreen() { }
function drawUpgradeScreen() {
    ctx.fillStyle = 'black'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white'; ctx.font = '50px Arial'; ctx.textAlign = 'center';
    ctx.fillText("업그레이드", canvas.width / 2, 80);
    ctx.font = '24px Arial';
    ctx.fillText(`보유 코인: ${coins} G`, canvas.width / 2, 140);

    ctx.fillStyle = '#444'; ctx.fillRect(hpUpgradeButton.x, hpUpgradeButton.y, hpUpgradeButton.width, hpUpgradeButton.height);
    ctx.fillStyle = 'white'; ctx.fillText("최대 HP", hpUpgradeButton.x + 100, hpUpgradeButton.y + 40);
    ctx.fillText(`Lv. ${upgradeLevels.hp} / 5`, hpUpgradeButton.x + 100, hpUpgradeButton.y + 80);
    const hpCost = calculateUpgradeCost(upgradeLevels.hp);
    ctx.fillText(hpCost === Infinity ? "MAX" : `비용: ${hpCost} G`, hpUpgradeButton.x + 100, hpUpgradeButton.y + 120);

    ctx.fillStyle = '#444'; ctx.fillRect(powerUpgradeButton.x, powerUpgradeButton.y, powerUpgradeButton.width, powerUpgradeButton.height);
    ctx.fillStyle = 'white'; ctx.fillText("공격력", powerUpgradeButton.x + 100, powerUpgradeButton.y + 40);
    ctx.fillText(`Lv. ${upgradeLevels.power} / 5`, powerUpgradeButton.x + 100, powerUpgradeButton.y + 80);
    const powerCost = calculateUpgradeCost(upgradeLevels.power);
    ctx.fillText(powerCost === Infinity ? "MAX" : `비용: ${powerCost} G`, powerUpgradeButton.x + 100, powerUpgradeButton.y + 120);

    ctx.fillStyle = '#444'; ctx.fillRect(ammoUpgradeButton.x, ammoUpgradeButton.y, ammoUpgradeButton.width, ammoUpgradeButton.height);
    ctx.fillStyle = 'white'; ctx.fillText("탄약 보충량", ammoUpgradeButton.x + 100, ammoUpgradeButton.y + 40);
    ctx.fillText(`Lv. ${upgradeLevels.ammo} / 5`, ammoUpgradeButton.x + 100, ammoUpgradeButton.y + 80);
    const ammoCost = calculateUpgradeCost(upgradeLevels.ammo);
    ctx.fillText(ammoCost === Infinity ? "MAX" : `비용: ${ammoCost} G`, ammoUpgradeButton.x + 100, ammoUpgradeButton.y + 120);

    ctx.fillStyle = '#f44336'; ctx.fillRect(backButton.x, backButton.y, backButton.width, backButton.height);
    ctx.fillStyle = 'white'; ctx.font = '30px Arial';
    ctx.fillText("뒤로가기", backButton.x + 100, backButton.y + 35);
}
function calculateUpgradeCost(level) {
    if (level >= 5) return Infinity;
    return Math.round(8 * Math.pow(1.5, level));
}
function purchaseUpgrade(type) {
    const level = upgradeLevels[type];
    if (level >= 5) return;
    const cost = calculateUpgradeCost(level);
    if (coins >= cost) {
        coins -= cost;
        upgradeLevels[type]++;
    } else {
        console.log("코인이 부족합니다!");
    }
}

// =========================================================================
// 5. 미니게임 파트
// =========================================================================
let marioPlayer, goal, groundTiles, platforms, coins_mario; let backgroundX = 0; const MARIO_GRAVITY = 0.8;
const MARIO_GOAL_TIME = 60;
const MARIO_SCROLL_THRESHOLD = canvas.width / 2; const PLATFORM_MIN_GAP = 150, PLATFORM_MAX_GAP = 300; const COIN_SPAWN_CHANCE = 0.25; let particles;
function initMario() { gameState = 'mario'; startTime = Date.now(); marioPlayer = { x: 50, y: 400, width: 50, height: 50, speed: 5, vy: 0, isJumping: true }; goal = { x: 0, y: 0, width: 20, height: 1000, isActive: false }; groundTiles = []; platforms = []; coins_mario = []; backgroundX = 0; particles = []; groundTiles.push({ x: 0, y: 550, width: canvas.width, height: 50 }); groundTiles.push({ x: canvas.width, y: 550, width: canvas.width, height: 50 }); let currentX = canvas.width / 2; for (let i = 0; i < 10; i++) { currentX = generateMarioObjects(currentX); } }
function generateMarioObjects(currentX) { const gap = Math.random() * (PLATFORM_MAX_GAP - PLATFORM_MIN_GAP) + PLATFORM_MIN_GAP; const nextX = currentX + gap; if (Math.random() < 0.8) { const width1 = Math.random() * 70 + 80; platforms.push({ x: nextX, y: 430, width: width1, height: 15 }); if (Math.random() < COIN_SPAWN_CHANCE) { coins_mario.push({ x: nextX + width1 / 2 - 10, y: 400, width: 20, height: 20 }); } if (Math.random() < 0.5) { const width2 = Math.random() * 70 + 80; platforms.push({ x: nextX, y: 300, width: width2, height: 15 }); if (Math.random() < COIN_SPAWN_CHANCE) { coins_mario.push({ x: nextX + width2 / 2 - 10, y: 270, width: 20, height: 20 }); } } } return nextX; }
function updateMario() { gameTime = (Date.now() - startTime) / 1000; let scrollSpeed = 0; if (inputState.right) { if (marioPlayer.x < MARIO_SCROLL_THRESHOLD) { marioPlayer.x += marioPlayer.speed; } else { scrollSpeed = marioPlayer.speed; } } if (inputState.left && marioPlayer.x > 0) { marioPlayer.x -= marioPlayer.speed; } if (scrollSpeed > 0) { backgroundX -= scrollSpeed * 0.3; if (backgroundX <= -canvas.width) { backgroundX = 0; } [...groundTiles, ...platforms, ...coins_mario, goal].forEach(obj => { obj.x -= scrollSpeed; }); } if (inputState.up && !marioPlayer.isJumping) { marioPlayer.vy = -18; } marioPlayer.vy += MARIO_GRAVITY; marioPlayer.y += marioPlayer.vy; let onSomething = false; groundTiles.forEach(tile => { if (marioPlayer.y + marioPlayer.height >= tile.y && marioPlayer.x < tile.x + tile.width && marioPlayer.x + marioPlayer.width > tile.x) { marioPlayer.y = tile.y - marioPlayer.height; marioPlayer.vy = 0; onSomething = true; } }); platforms.forEach(p => { if (marioPlayer.vy > 0 && marioPlayer.y + marioPlayer.height >= p.y && marioPlayer.y + marioPlayer.height - marioPlayer.vy <= p.y + 5 && marioPlayer.x < p.x + p.width && marioPlayer.x + marioPlayer.width > p.x) { marioPlayer.y = p.y - marioPlayer.height; marioPlayer.vy = 0; onSomething = true; } }); marioPlayer.isJumping = !onSomething; for (let i = coins_mario.length - 1; i >= 0; i--) { const c = coins_mario[i]; if (marioPlayer.x < c.x + c.width && marioPlayer.x + marioPlayer.width > c.x && marioPlayer.y < c.y + c.height && marioPlayer.y + marioPlayer.height > c.y) { score++; coins_mario.splice(i, 1); } } let rightmostX = 0; [...groundTiles, ...platforms].forEach(obj => { if (obj.x + obj.width > rightmostX) rightmostX = obj.x + obj.width; }); if (!goal.isActive && rightmostX < canvas.width * 2) { generateMarioObjects(rightmostX); } groundTiles.forEach((t, i) => { if (t.x + t.width < 0) { const other = i === 0 ? 1 : 0; t.x = groundTiles[other].x + groundTiles[other].width; } }); if (gameTime >= MARIO_GOAL_TIME && !goal.isActive) { goal.isActive = true; goal.x = rightmostX; } if (goal.isActive && marioPlayer.x + marioPlayer.width > goal.x) { gameState = 'choice'; } if (marioPlayer.y > canvas.height) { initStartScreen(); } }
function drawMario() { ctx.drawImage(backgroundImage, backgroundX, 0, canvas.width, canvas.height); ctx.drawImage(backgroundImage, backgroundX + canvas.width, 0, canvas.width, canvas.height); ctx.fillStyle = 'green'; groundTiles.forEach(t => ctx.fillRect(t.x, t.y, t.width, t.height)); ctx.fillStyle = 'gold'; coins_mario.forEach(c => { ctx.beginPath(); ctx.arc(c.x + 10, c.y + 10, 10, 0, Math.PI * 2); ctx.fill(); }); ctx.fillStyle = 'saddlebrown'; platforms.forEach(p => ctx.fillRect(p.x, p.y, p.width, p.height)); ctx.drawImage(playerImage, marioPlayer.x, marioPlayer.y, marioPlayer.width, marioPlayer.height); ctx.fillStyle = 'black'; ctx.font = '20px Arial'; ctx.fillText(`Time: ${Math.floor(MARIO_GOAL_TIME - gameTime)}s`, 60, 30); ctx.fillText(`미생물: ${score}`, 60, 60); }
let sewerPlayer, sewerTiles, sewerRunObjects; let sewerRunScore = 0; const LANE_Y_POSITIONS = [250, 350, 450, 550]; const SEWER_AUTO_SCROLL_SPEED = -3; let laneObstacleTimers = [];
function initSewerRun() { gameState = 'sewerRun'; sewerRunScore = 0; sewerPlayer = { x: 100, width: 50, height: 50, speed: 5, currentLane: 1, y: LANE_Y_POSITIONS[1] }; sewerTiles = []; sewerRunObjects = []; laneObstacleTimers = []; const tileWidth = 200; const numTiles = Math.ceil(canvas.width / tileWidth) + 1; for (let i = 0; i < numTiles; i++) { sewerTiles.push({ x: i * tileWidth, y: 0 }); } for (let i = 0; i < 4; i++) { laneObstacleTimers.push(Math.random() * 120 + 60); } let currentX = canvas.width; for (let i = 0; i < 5; i++) { currentX = generateSewer(currentX); } }
function generateSewer(currentX) { const gap = Math.random() * 400 + 300; const nextX = currentX + gap; const laneIndex = Math.floor(Math.random() * 4); if (Math.random() < 0.5) { sewerRunObjects.push({ type: 'sewer', x: nextX, y: LANE_Y_POSITIONS[laneIndex] + 5, radius: 20, isCleaned: false, lane: laneIndex }); } return nextX; }
function updateSewerRun() { if (score <= 0) { finalScoreType = 'sewer'; finalScore = sewerRunScore; coins += sewerRunScore; submitScore(finalScoreType, finalScore); gameState = 'gameOver'; return; } laneObstacleTimers.forEach((timer, i) => { laneObstacleTimers[i]--; if (laneObstacleTimers[i] <= 0) { if (Math.random() < 0.3) { sewerRunObjects.push({ type: 'obstacle', x: canvas.width + 50, y: LANE_Y_POSITIONS[i], width: 40, height: 40, lane: i }); } laneObstacleTimers[i] = Math.random() * 120 + 60; } }); let playerScrollSpeed = 0; if (inputState.left) { playerScrollSpeed = sewerPlayer.speed; } if (inputState.right) { playerScrollSpeed = -sewerPlayer.speed; } sewerTiles.forEach(tile => { tile.x += playerScrollSpeed; }); sewerRunObjects.forEach(obj => { if (obj.type === 'obstacle') { obj.x += SEWER_AUTO_SCROLL_SPEED + playerScrollSpeed; } else if (obj.type === 'sewer') { obj.x += playerScrollSpeed; } }); sewerTiles.forEach(tile => { if (tile.x < -200) { tile.x += sewerTiles.length * 200; } else if (tile.x > canvas.width) { tile.x -= sewerTiles.length * 200; } }); if (inputState.up) { if (sewerPlayer.currentLane > 0) sewerPlayer.currentLane--; } if (inputState.down) { if (sewerPlayer.currentLane < LANE_Y_POSITIONS.length - 1) sewerPlayer.currentLane++; } sewerPlayer.y = LANE_Y_POSITIONS[sewerPlayer.currentLane]; for (let i = sewerRunObjects.length - 1; i >= 0; i--) { const obj = sewerRunObjects[i]; if (obj.x < -100) { sewerRunObjects.splice(i, 1); continue; } if (obj.lane !== sewerPlayer.currentLane) continue; const playerBox = { x: sewerPlayer.x, y: sewerPlayer.y, width: sewerPlayer.width, height: sewerPlayer.height }; if (obj.type === 'obstacle') { const obstacleBox = { x: obj.x, y: obj.y, width: obj.width, height: obj.height }; if (playerBox.x < obstacleBox.x + obstacleBox.width && playerBox.x + playerBox.width > obstacleBox.x && playerBox.y < obstacleBox.y + obstacleBox.height && playerBox.y + playerBox.height > obstacleBox.y) { score--; sewerRunObjects.splice(i, 1); } } else if (obj.type === 'sewer') { if (inputState.action && !obj.isCleaned && Math.abs((sewerPlayer.x + sewerPlayer.width / 2) - obj.x) < 40) { if (score > 0) { score--; obj.isCleaned = true; sewerRunScore++; } } } } let rightmostSewerX = 0; sewerRunObjects.forEach(obj => { if (obj.type === 'sewer' && obj.x > rightmostSewerX) rightmostSewerX = obj.x; }); if (rightmostSewerX < canvas.width + 400) { generateSewer(rightmostSewerX); } }
function drawSewerRun() { ctx.fillStyle = '#333333'; ctx.fillRect(0, 0, canvas.width, canvas.height); sewerTiles.forEach(tile => { ctx.fillStyle = '#424242'; ctx.fillRect(tile.x, 250, 200, 400); ctx.strokeStyle = '#333333'; ctx.lineWidth = 2; for (let i = 0; i < 10; i++) { ctx.beginPath(); ctx.moveTo(tile.x + i * 20, 250); ctx.lineTo(tile.x + i * 20, canvas.height); ctx.stroke(); } for (let i = 0; i < 20; i++) { ctx.beginPath(); ctx.moveTo(tile.x, 250 + i * 20); ctx.lineTo(tile.x + 200, 250 + i * 20); ctx.stroke(); } }); ctx.strokeStyle = '#212121'; ctx.lineWidth = 4; LANE_Y_POSITIONS.forEach((yPos, i) => { if (i < 3) { const lineY = yPos + 75; ctx.beginPath(); ctx.moveTo(0, lineY); ctx.lineTo(canvas.width, lineY); ctx.stroke(); } }); sewerRunObjects.forEach(obj => { if (obj.type === 'obstacle') { ctx.fillStyle = 'red'; ctx.fillRect(obj.x, obj.y, obj.width, obj.height); } else if (obj.type === 'sewer') { ctx.fillStyle = obj.isCleaned ? 'deepskyblue' : 'black'; ctx.beginPath(); ctx.arc(obj.x, obj.y, obj.radius, 0, Math.PI * 2); ctx.fill(); } }); ctx.drawImage(playerImage, sewerPlayer.x, sewerPlayer.y, sewerPlayer.width, sewerPlayer.height); ctx.fillStyle = 'white'; ctx.font = '20px Arial'; ctx.fillText(`미생물: ${score}`, 60, 30); ctx.fillText(`정화: ${sewerRunScore}`, 60, 60); }
let droneShooterPlayer, bullets, pollutants; let droneShooterScore = 0; let shootCooldown = 0; let pollutantSpawnTimer = 0; const RIVER_MARGIN_MINIGAME = 150;
function initDroneShooter() { gameState = 'droneShooter'; droneShooterScore = 0; droneShooterPlayer = { x: canvas.width / 2 - 25, y: canvas.height - 80, width: 50, height: 50, speed: 6 }; bullets = []; pollutants = []; shootCooldown = 0; pollutantSpawnTimer = 60; }
function updateDroneShooter() { if (score < 0.1) { finalScoreType = 'drone'; finalScore = droneShooterScore; coins += droneShooterScore; submitScore(finalScoreType, finalScore); gameState = 'gameOver'; return; } shootCooldown--; pollutantSpawnTimer--; if (inputState.left) { droneShooterPlayer.x -= droneShooterPlayer.speed; } if (inputState.right) { droneShooterPlayer.x += droneShooterPlayer.speed; } if (droneShooterPlayer.x < RIVER_MARGIN_MINIGAME) droneShooterPlayer.x = RIVER_MARGIN_MINIGAME; if (droneShooterPlayer.x + droneShooterPlayer.width > canvas.width - RIVER_MARGIN_MINIGAME) droneShooterPlayer.x = canvas.width - RIVER_MARGIN_MINIGAME - droneShooterPlayer.width; if (inputState.actionHold && score >= 0.1 && shootCooldown <= 0) { score -= 0.1; bullets.push({ x: droneShooterPlayer.x + droneShooterPlayer.width / 2 - 5, y: droneShooterPlayer.y, width: 10, height: 20, speed: 8 }); shootCooldown = 12; } for (let i = bullets.length - 1; i >= 0; i--) { bullets[i].y -= bullets[i].speed; if (bullets[i].y < 0) bullets.splice(i, 1); } if (pollutantSpawnTimer <= 0) { pollutants.push({ x: Math.random() * (canvas.width - RIVER_MARGIN_MINIGAME * 2 - 40) + RIVER_MARGIN_MINIGAME, y: -50, width: 40, height: 40, speedY: Math.random() * 1 + 1, hp: Math.floor(Math.random() * 3) + 1, maxHp: 3 }); pollutantSpawnTimer = Math.random() * 90 + 30; } for (let i = pollutants.length - 1; i >= 0; i--) { const p = pollutants[i]; p.y += p.speedY; if (p.y > canvas.height) { pollutants.splice(i, 1); continue; } for (let j = bullets.length - 1; j >= 0; j--) { const b = bullets[j]; if (b.x < p.x + p.width && b.x + b.width > p.x && b.y < p.y + p.height && b.y + b.height > p.y) { bullets.splice(j, 1); p.hp -= 0.5; if (p.hp <= 0) { pollutants.splice(i, 1); droneShooterScore++; break; } } } } }
function drawDroneShooter() { ctx.fillStyle = '#616161'; ctx.fillRect(0, 0, RIVER_MARGIN_MINIGAME, canvas.height); ctx.fillRect(canvas.width - RIVER_MARGIN_MINIGAME, 0, RIVER_MARGIN_MINIGAME, canvas.height); ctx.fillStyle = '#1a237e'; ctx.fillRect(RIVER_MARGIN_MINIGAME, 0, canvas.width - RIVER_MARGIN_MINIGAME * 2, canvas.height); ctx.fillStyle = 'deepskyblue'; bullets.forEach(b => { ctx.beginPath(); ctx.arc(b.x + 5, b.y + 10, 5, 0, Math.PI * 2); ctx.fill(); }); pollutants.forEach(p => { const colorValue = Math.floor(150 * (1 - p.hp / p.maxHp)); ctx.fillStyle = `rgb(${colorValue}, ${colorValue}, ${colorValue})`; ctx.beginPath(); ctx.arc(p.x + p.width / 2, p.y + p.height / 2, p.width / 2, 0, Math.PI * 2); ctx.fill(); }); ctx.drawImage(playerImage, droneShooterPlayer.x, droneShooterPlayer.y, droneShooterPlayer.width, droneShooterPlayer.height); ctx.fillStyle = 'white'; ctx.font = '20px Arial'; ctx.fillText(`미생물: ${score.toFixed(1)}`, 60, 30); ctx.fillText(`정화: ${droneShooterScore}`, 60, 60); }

// =========================================================================
// 6. 보스전 파트
// =========================================================================
let boss_boss, boss_player, boss_bullets, boss_ammoItems, boss_bossAttacks, boss_sideAttacks, boss_waterSplash; let boss_bossFightState = 'playerTurn'; let boss_turnTimer = 0; let boss_playerHp = 0; let boss_maxHp = 10; let boss_ammo = 0; let boss_playerAttackPower = 0.3; let boss_shootCooldown = 0, boss_ammoSpawnTimer = 0, boss_bossAttackTimer = 0, boss_sideAttackTimer = 0, boss_tsunamiTimer = 0; let boss_areaAttackState = 'none', boss_areaAttackTimer = 0; let boss_bossMario_ground = [], boss_bossMario_platforms = []; let boss_bossSewer_lanes = [250, 350, 450, 550]; let boss_laneSwitchCooldown = 0; let boss_startTime; const BOSS_JUMP_HEIGHT = 220; const BOSS_JUMP_DURATION = 120; const BOSS_MARIO_GRAVITY = 0.8;
function boss_initBossFight() {
    gameState = 'bossFight'; boss_bossFightState = 'playerTurn'; boss_startTime = Date.now();
    boss_maxHp = score + (upgradeLevels.hp * 2);
    boss_playerAttackPower = 0.3 + (upgradeLevels.power * (5 / 7));
    boss_playerHp = boss_maxHp; boss_ammo = 10;
    boss_boss = { x: canvas.width / 2 - 100, y: 100, width: 200, height: 80, hp: 2500, maxHp: 2500, vx: 0, vy: 0, targetX: 0, startX: 0, startY: 0, jumpProgress: 0, isJumping: false };
    boss_player = { x: canvas.width / 2 - 25, y: canvas.height - 80, width: 50, height: 50, speed: 6, vy: 0, isJumping: true, currentLane: 1 };
    boss_bullets = []; boss_ammoItems = []; boss_bossAttacks = []; boss_sideAttacks = []; boss_waterSplash = [];
    boss_shootCooldown = 0; boss_ammoSpawnTimer = 120; boss_turnTimer = 600;
}
function boss_updateBossFight() { if (boss_playerHp <= 0) { finalScore = 0; finalScoreType = 'boss'; gameState = 'gameOver'; return; } if (boss_boss.hp <= 0) { const clearTime = ((Date.now() - boss_startTime) / 1000).toFixed(2); finalScore = parseFloat(clearTime); finalScoreType = 'boss'; coins += 50; submitScore(finalScoreType, finalScore); gameState = 'gameOver'; return; } boss_turnTimer--; if (boss_turnTimer <= 0) { const previousState = boss_bossFightState; if (boss_bossFightState === 'playerTurn') { boss_bossFightState = 'bossTurn'; boss_turnTimer = 1200; const rand = Math.random(); if (rand < 0.33) { boss_initBossAutoAimPattern(); } else if (rand < 0.66) { boss_initBossMarioPattern(); } else { boss_initBossSewerPattern(); } } else { boss_bossFightState = 'playerTurn'; boss_turnTimer = 600; boss_bossAttacks = []; if (previousState !== 'bossTurn_autoAim') { boss_player.x = canvas.width / 2 - 25; boss_player.y = canvas.height - 80; } boss_boss.x = canvas.width / 2 - 100; boss_boss.y = 100; } } boss_updateSharedBossMechanics(); if (boss_bossFightState === 'bossTurn_autoAim') { boss_updateBossAutoAimPattern(); } else if (boss_bossFightState === 'bossTurn_mario') { boss_updateBossMarioPattern(); } else if (boss_bossFightState === 'bossTurn_sewer') { boss_updateBossSewerPattern(); } }
function boss_updateSharedBossMechanics() { if (boss_bossFightState === 'bossTurn_mario') { if (inputState.up && !boss_player.isJumping) { boss_player.vy = -22; } if (inputState.right) { boss_player.x += boss_player.speed; } if (inputState.left) { boss_player.x -= boss_player.speed; } if (boss_player.x < 0) boss_player.x = 0; if (boss_player.x + boss_player.width > canvas.width) boss_player.x = canvas.width - boss_player.width; boss_player.vy += BOSS_MARIO_GRAVITY; boss_player.y += boss_player.vy; let onSomething = false; [...boss_bossMario_ground, ...boss_bossMario_platforms].forEach(g => { if (boss_player.vy > 0 && boss_player.y + boss_player.height >= g.y && boss_player.y + boss_player.height - boss_player.vy <= g.y + 5 && boss_player.x < g.x + g.width && boss_player.x + boss_player.width > g.x) { boss_player.y = g.y - boss_player.height; boss_player.vy = 0; onSomething = true; } }); boss_player.isJumping = !onSomething; } else if (boss_bossFightState === 'bossTurn_sewer') { boss_laneSwitchCooldown--; if (inputState.up && boss_laneSwitchCooldown <= 0) { if (boss_player.currentLane > 0) { boss_player.currentLane--; boss_laneSwitchCooldown = 12; } } if (inputState.down && boss_laneSwitchCooldown <= 0) { if (boss_player.currentLane < 3) { boss_player.currentLane++; boss_laneSwitchCooldown = 12; } } if (inputState.left) { boss_player.x -= boss_player.speed; } if (inputState.right) { boss_player.x += boss_player.speed; } if (boss_player.x < 0) boss_player.x = 0; if (boss_player.x + boss_player.width > canvas.width) boss_player.x = canvas.width - boss_player.width; boss_player.y = boss_bossSewer_lanes[boss_player.currentLane]; } else { if (inputState.left) { boss_player.x -= boss_player.speed; } if (inputState.right) { boss_player.x += boss_player.speed; } if (inputState.upPressed) { boss_player.y -= boss_player.speed; } if (inputState.downPressed) { boss_player.y += boss_player.speed; } if (boss_player.x < 0) boss_player.x = 0; if (boss_player.x + boss_player.width > canvas.width) boss_player.x = canvas.width - boss_player.width; if (boss_player.y < 0) boss_player.y = 0; if (boss_player.y + boss_player.height > canvas.height) boss_player.y = canvas.height - boss_player.height; } boss_shootCooldown--; if (boss_bossFightState === 'bossTurn_mario') { if (inputState.action && boss_ammo > 0 && boss_shootCooldown <= 0) { boss_ammo--; for (let i = 0; i < 20; i++) { boss_waterSplash.push({ x: boss_player.x + 25, y: boss_player.y + 25, radius: Math.random() * 2 + 2, vx: (Math.random() - 0.5) * 8, vy: (Math.random() - 0.5) * 5 - 3, lifespan: 60 }); } boss_shootCooldown = 6; } } else if (boss_bossFightState !== 'bossTurn_sewer') { if (inputState.actionHold && boss_ammo > 0 && boss_shootCooldown <= 0) { boss_ammo -= 0.1; boss_bullets.push({ x: boss_player.x + boss_player.width / 2 - 5, y: boss_player.y, speed: 10 }); boss_shootCooldown = 6; } } for (let i = boss_bullets.length - 1; i >= 0; i--) { const b = boss_bullets[i]; b.y -= b.speed; if (b.x > boss_boss.x && b.x < boss_boss.x + boss_boss.width && b.y < boss_boss.y + boss_boss.height) { boss_bullets.splice(i, 1); boss_boss.hp -= boss_playerAttackPower; } else if (b.y < 0) { boss_bullets.splice(i, 1); } } for (let i = boss_waterSplash.length - 1; i >= 0; i--) { const p = boss_waterSplash[i]; p.vy += BOSS_MARIO_GRAVITY * 0.3; p.x += p.vx; p.y += p.vy; p.lifespan--; if (p.x > boss_boss.x && p.x < boss_boss.x + boss_boss.width && p.y > boss_boss.y && p.y < boss_boss.y + boss_boss.height) { boss_boss.hp -= boss_playerAttackPower; boss_waterSplash.splice(i, 1); } else if (p.lifespan <= 0) { boss_waterSplash.splice(i, 1); } } if (boss_bossFightState === 'playerTurn' || boss_bossFightState === 'bossTurn_autoAim') { boss_sideAttackTimer--; if (boss_sideAttackTimer <= 0) { boss_sideAttacks.push({ x: 0, y: Math.random() * canvas.height, vx: 3.5, radius: 8 }); boss_sideAttacks.push({ x: canvas.width, y: Math.random() * canvas.height, vx: -3.5, radius: 8 }); boss_sideAttackTimer = 120; } } for (let i = boss_sideAttacks.length - 1; i >= 0; i--) { const attack = boss_sideAttacks[i]; attack.x += attack.vx; const distToPlayer = Math.hypot(boss_player.x + boss_player.width / 2 - attack.x, boss_player.y + boss_player.height / 2 - attack.y); if (distToPlayer < boss_player.width / 2 + attack.radius) { boss_playerHp -= 1; boss_sideAttacks.splice(i, 1); } else if (attack.x < -20 || attack.x > canvas.width + 20) { boss_sideAttacks.splice(i, 1); } } if (boss_bossFightState === 'playerTurn' || boss_bossFightState === 'bossTurn_autoAim') { boss_ammoSpawnTimer--; if (boss_ammoSpawnTimer <= 0) { const xPos = Math.random() * (canvas.width - 40) + 20; const yPos = Math.random() * (canvas.height - 40) + 20; if (Math.random() < 0.1) { boss_ammoItems.push({ type: 'potion', x: xPos, y: yPos, width: 20, height: 20 }); } else { boss_ammoItems.push({ type: 'ammo', x: xPos, y: yPos, width: 20, height: 20, lifespan: 600 }); } boss_ammoSpawnTimer = Math.random() * 180 + 120; } } for (let i = boss_ammoItems.length - 1; i >= 0; i--) { const item = boss_ammoItems[i]; if (item.type === 'ammo') { item.lifespan--; if (item.lifespan <= 0) { boss_ammoItems.splice(i, 1); continue; } } if (boss_player.x < item.x + item.width && boss_player.x + boss_player.width > item.x && boss_player.y < item.y + item.height && boss_player.y + boss_player.height > item.y) { if (item.type === 'potion') { boss_playerHp += boss_maxHp * 0.2; if (boss_playerHp > boss_maxHp) boss_playerHp = boss_maxHp; } else { boss_ammo += (5 + upgradeLevels.ammo); } boss_ammoItems.splice(i, 1); } } }
function boss_initBossAutoAimPattern() { boss_bossFightState = 'bossTurn_autoAim'; boss_bossAttackTimer = 180; boss_player.x = canvas.width / 2 - 25; boss_player.y = canvas.height - 80; }
function boss_updateBossAutoAimPattern() { boss_bossAttackTimer--; if (boss_bossAttackTimer <= 0) { const dx = (boss_player.x + boss_player.width / 2) - (boss_boss.x + boss_boss.width / 2); const dy = (boss_player.y + boss_player.height / 2) - (boss_boss.y + boss_boss.height / 2); const dist = Math.hypot(dx, dy); const vx = (dx / dist) * 4.5; const vy = (dy / dist) * 4.5; boss_bossAttacks.push({ type: 'autoAim', x: boss_boss.x + boss_boss.width / 2, y: boss_boss.y + boss_boss.height, radius: 10, vx, vy }); boss_bossAttackTimer = 180; } for (let i = boss_bossAttacks.length - 1; i >= 0; i--) { const attack = boss_bossAttacks[i]; attack.x += attack.vx; attack.y += attack.vy; const distToPlayer = Math.hypot(boss_player.x + boss_player.width / 2 - attack.x, boss_player.y + boss_player.height / 2 - attack.y); if (distToPlayer < boss_player.width / 2 + attack.radius) { boss_playerHp -= 2; boss_bossAttacks.splice(i, 1); } else if (attack.y > canvas.height || attack.x < 0 || attack.x > canvas.width) { boss_bossAttacks.splice(i, 1); } } }
function boss_initBossMarioPattern() { boss_bossFightState = 'bossTurn_mario'; boss_bossAttacks = []; boss_bossMario_ground = [{ x: 0, y: 550, width: canvas.width, height: 50 }]; boss_bossMario_platforms = [{ x: 50, y: 450, width: 150, height: 15 }, { x: 50, y: 350, width: 150, height: 15 }, { x: canvas.width - 200, y: 450, width: 150, height: 15 }, { x: canvas.width - 200, y: 350, width: 150, height: 15 }]; boss_player.x = 100; boss_player.y = 400; boss_player.vy = 0; boss_player.isJumping = true; boss_boss.x = 500; boss_boss.y = 550 - boss_boss.height; boss_boss.isJumping = false; boss_areaAttackState = 'waiting'; boss_areaAttackTimer = 180; boss_tsunamiTimer = 150; }
function boss_updateBossMarioPattern() { boss_areaAttackTimer--; if (boss_areaAttackTimer <= 0 && !boss_boss.isJumping) { boss_boss.isJumping = true; boss_boss.jumpProgress = 0; boss_boss.startX = boss_boss.x; boss_boss.startY = boss_boss.y; if (boss_boss.x > canvas.width / 2) { boss_boss.targetX = 100; boss_areaAttackState = 'telegraphLeft'; } else { boss_boss.targetX = 500; boss_areaAttackState = 'telegraphRight'; } boss_areaAttackTimer = 120; } if (boss_boss.isJumping) { boss_boss.jumpProgress++; let t = boss_boss.jumpProgress / BOSS_JUMP_DURATION; if (t >= 1) { t = 1; boss_boss.isJumping = false; boss_boss.x = boss_boss.targetX; boss_boss.y = boss_boss.startY; boss_areaAttackState = boss_areaAttackState.replace('telegraph', 'attack'); boss_areaAttackTimer = 60; } else { const currentX = boss_boss.startX + (boss_boss.targetX - boss_boss.startX) * t; const currentY = boss_boss.startY - Math.sin(t * Math.PI) * BOSS_JUMP_HEIGHT; boss_boss.x = currentX; boss_boss.y = currentY; } } else { if (boss_areaAttackState.includes('attack')) { boss_areaAttackTimer--; if (boss_areaAttackTimer <= 0) { boss_areaAttackState = 'waiting'; boss_areaAttackTimer = 180; } } } if (boss_areaAttackState === 'attackLeft' && boss_player.x < canvas.width / 2) { boss_playerHp -= 0.1; } if (boss_areaAttackState === 'attackRight' && boss_player.x > canvas.width / 2) { boss_playerHp -= 0.1; } boss_tsunamiTimer--; if (boss_tsunamiTimer <= 0) { boss_bossAttacks.push({ type: 'tsunami', x: -20, y: 520, vx: 4, radius: 24 }); boss_tsunamiTimer = 300; } for (let i = boss_bossAttacks.length - 1; i >= 0; i--) { const attack = boss_bossAttacks[i]; attack.x += attack.vx; const distToPlayer = Math.hypot(boss_player.x + boss_player.width / 2 - attack.x, boss_player.y + boss_player.height / 2 - attack.y); if (distToPlayer < boss_player.width / 2 + attack.radius) { boss_playerHp -= 5; boss_bossAttacks.splice(i, 1); } } }
function boss_initBossSewerPattern() { boss_bossFightState = 'bossTurn_sewer'; boss_bossAttacks = []; boss_player.x = 100; boss_player.currentLane = 1; boss_player.y = boss_bossSewer_lanes[1]; boss_laneSwitchCooldown = 0; }
function boss_updateBossSewerPattern() { if (boss_turnTimer % 60 === 0) { const laneIndex = Math.floor(Math.random() * 4); const fromLeft = Math.random() < 0.5; if (Math.random() < 0.2) { boss_bossAttacks.push({ type: 'sewer_potion', lane: laneIndex, x: fromLeft ? -40 : canvas.width + 40, y: boss_bossSewer_lanes[laneIndex], vx: fromLeft ? 4 : -4 }); } else { boss_bossAttacks.push({ type: 'sewer_obstacle', lane: laneIndex, x: fromLeft ? -40 : canvas.width + 40, y: boss_bossSewer_lanes[laneIndex], vx: fromLeft ? 4 : -4 }); } } for (let i = boss_bossAttacks.length - 1; i >= 0; i--) { const attack = boss_bossAttacks[i]; attack.x += attack.vx; if (attack.lane === boss_player.currentLane && Math.abs(attack.x - boss_player.x) < boss_player.width) { if (attack.type === 'sewer_obstacle') { boss_playerHp -= 1; } else { boss_playerHp += boss_maxHp * 0.2; if (boss_playerHp > boss_maxHp) boss_playerHp = boss_maxHp; } boss_bossAttacks.splice(i, 1); } } }
function boss_drawBossFight() { if (boss_bossFightState === 'bossTurn_mario') { boss_drawBossMarioPattern(); } else if (boss_bossFightState === 'bossTurn_sewer') { boss_drawBossSewerPattern(); } else { boss_drawBossDronePattern(); } boss_ammoItems.forEach(item => { if (item.type === 'potion') { ctx.fillStyle = 'lime'; } else { ctx.fillStyle = 'gold'; } ctx.beginPath(); ctx.arc(item.x + 10, item.y + 10, 10, 0, Math.PI * 2); ctx.fill(); }); ctx.fillStyle = '#ff5722'; boss_sideAttacks.forEach(a => { ctx.beginPath(); ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2); ctx.fill(); }); ctx.drawImage(playerImage, boss_player.x, boss_player.y, boss_player.width, boss_player.height); ctx.fillStyle = 'white'; ctx.font = '20px Arial'; ctx.textAlign = 'left'; ctx.fillText(`Player HP: ${Math.ceil(boss_playerHp)} / ${Math.floor(boss_maxHp)}`, 60, 30); ctx.fillText(`Ammo: ${Math.floor(boss_ammo)}`, 60, 60); ctx.fillText(`Boss HP: ${Math.ceil(boss_boss.hp)}`, canvas.width - 140, 30); ctx.font = '24px Arial'; ctx.textAlign = 'center'; if (boss_bossFightState === 'playerTurn') { ctx.fillStyle = 'cyan'; ctx.fillText("ATTACK PHASE!", canvas.width / 2, canvas.height - 20); } else { ctx.fillStyle = 'red'; ctx.fillText("DEFENSE PHASE!", canvas.width / 2, canvas.height - 20); } }
function boss_drawBossDronePattern() { ctx.fillStyle = '#1a237e'; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.fillStyle = 'green'; ctx.fillRect(boss_boss.x, boss_boss.y, boss_boss.width, boss_boss.height); ctx.fillStyle = 'deepskyblue'; boss_bullets.forEach(b => { ctx.beginPath(); ctx.arc(b.x, b.y, 5, 0, Math.PI * 2); ctx.fill(); }); ctx.fillStyle = '#9c27b0'; boss_bossAttacks.forEach(a => { ctx.beginPath(); ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2); ctx.fill(); }); }
function boss_drawBossMarioPattern() { ctx.fillStyle = '#a75934'; ctx.fillRect(0, 0, canvas.width, canvas.height); boss_bossMario_ground.forEach(g => { ctx.fillStyle = '#6d4c41'; ctx.fillRect(g.x, g.y, g.width, g.height); }); boss_bossMario_platforms.forEach(p => { ctx.fillStyle = '#8d6e63'; ctx.fillRect(p.x, p.y, p.width, p.height); }); if (boss_areaAttackState.includes('telegraph')) { ctx.fillStyle = 'rgba(255, 0, 0, 0.2)'; if (boss_areaAttackState === 'telegraphLeft') ctx.fillRect(0, 0, canvas.width / 2, canvas.height); else ctx.fillRect(canvas.width / 2, 0, canvas.width / 2, canvas.height); } else if (boss_areaAttackState.includes('attack')) { ctx.fillStyle = 'rgba(255, 0, 0, 0.6)'; if (boss_areaAttackState === 'attackLeft') ctx.fillRect(0, 0, canvas.width / 2, canvas.height); else ctx.fillRect(canvas.width / 2, 0, canvas.width / 2, canvas.height); } ctx.fillStyle = 'green'; ctx.fillRect(boss_boss.x, boss_boss.y, boss_boss.width, boss_boss.height); ctx.fillStyle = 'rgba(0, 255, 255, 0.7)'; boss_waterSplash.forEach(p => { ctx.beginPath(); ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2); ctx.fill(); }); ctx.fillStyle = '#9c27b0'; boss_bossAttacks.forEach(a => { ctx.beginPath(); ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2); ctx.fill(); }); }
function boss_drawBossSewerPattern() { ctx.fillStyle = '#333333'; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.strokeStyle = '#212121'; ctx.lineWidth = 4; boss_bossSewer_lanes.forEach((yPos, i) => { if (i < 3) { const lineY = yPos + 75; ctx.beginPath(); ctx.moveTo(0, lineY); ctx.lineTo(canvas.width, lineY); ctx.stroke(); } }); boss_bossAttacks.forEach(attack => { if (attack.type === 'sewer_obstacle') { ctx.fillStyle = 'red'; ctx.fillRect(attack.x, attack.y, 40, 40); } else { ctx.fillStyle = 'lime'; ctx.beginPath(); ctx.arc(attack.x + 20, attack.y + 20, 20, 0, Math.PI * 2); ctx.fill(); } }); }

// =========================================================================
// 7. JSONBin 통신 및 이미지 로딩
// =========================================================================
function fetchRankings() { if (!API_KEY || !BIN_ID || API_KEY === 'YOUR_X_MASTER_KEY') return; fetch(`${JSONBIN_URL}/latest`, { headers: { 'X-Master-Key': API_KEY } }).then(response => response.json()).then(data => { sewerRankings = data.record.sewer ? data.record.sewer.map(r => r.score).sort((a, b) => b - a) : []; droneRankings = data.record.drone ? data.record.drone.map(r => r.score).sort((a, b) => b - a) : []; bossRankings = data.record.boss ? data.record.boss.map(r => r.score).sort((a, b) => a - b) : []; }).catch(error => console.error('랭킹 로딩 실패:', error)); }
function submitScore(gameType, finalScore) { if (!API_KEY || !BIN_ID || API_KEY === 'YOUR_X_MASTER_KEY') return; fetch(`${JSONBIN_URL}/latest`, { headers: { 'X-Master-Key': API_KEY } }).then(response => response.json()).then(data => { let currentRankings = data.record; if (!currentRankings[gameType]) { currentRankings[gameType] = []; } currentRankings[gameType].push({ score: finalScore, date: new Date().toISOString() }); if (gameType === 'boss') { currentRankings[gameType].sort((a, b) => a.score - b.score); } else { currentRankings[gameType].sort((a, b) => b.score - a.score); } currentRankings[gameType] = currentRankings[gameType].slice(0, 10); return fetch(JSONBIN_URL, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'X-Master-Key': API_KEY }, body: JSON.stringify(currentRankings) }); }).then(response => response.json()).then(() => { fetchRankings(); }).catch(error => console.error('점수 제출 실패:', error)); }

const playerImage = new Image();
const backgroundImage = new Image();
playerImage.src = 'player.gif';
backgroundImage.src = 'background.png';

let imagesLoaded = 0;
const totalImages = 2;
function onImageLoad() {
    imagesLoaded++;
    if (imagesLoaded === totalImages) {
        initModeSelection();
        gameLoop();
    }
}
playerImage.onload = onImageLoad;
backgroundImage.onload = onImageLoad;
