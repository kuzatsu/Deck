// Game state
const gameState = {
    floor: 1,
    corridor: 0,
    chips: 0,
    monstersDefeated: 0,
    monsterDeck: [],
    bosses: [],
    currentMonsters: [],
    defeatedMonsters: new Set(),
    battlePhase: 'selection', // 'selection', 'combat', 'complete'
    selectedMonster: null,
    activeBattleMonsters: [],
    monsterHealth: new Map() // Track current health of monsters
};

// DOM elements
const introSection = document.getElementById('introSection');
const gameSection = document.getElementById('gameSection');
const startGameBtn = document.getElementById('startGame');
const exploreBtn = document.getElementById('exploreBtn');
const nextFloorBtn = document.getElementById('nextFloorBtn');
const battleArea = document.getElementById('battleArea');
const gameLog = document.getElementById('gameLog');
const floorNumber = document.getElementById('floorNumber');
const corridorNumber = document.getElementById('corridorNumber');
const chipsCount = document.getElementById('chipsCount');
const monstersDefeated = document.getElementById('monstersDefeated');

// Initialize the game
function initGame() {
    // Load tarot data (you'll need to implement this based on your existing code)
    loadTarotData().then(() => {
        setupGame();
        updateURLParams();
        updateStats();
    });

    // Set up event listeners
    startGameBtn.addEventListener('click', startGame);
    exploreBtn.addEventListener('click', exploreCorridor);
    nextFloorBtn.addEventListener('click', proceedToNextFloor);
}

// Load tarot data (pseudo-code - adapt from your existing implementation)
async function loadTarotData() {
    // This should load your tarot-data.json
    // For now, we'll use a placeholder
    const response = await fetch('data/tarot-data.json');
    window.tarotData = await response.json();
    return window.tarotData;
}

// Set up the game based on URL parameters or default state
function setupGame() {
    const params = new URLSearchParams(window.location.search);

    if (params.has('floor')) gameState.floor = parseInt(params.get('floor'));
    if (params.has('corridor')) gameState.corridor = parseInt(params.get('corridor'));
    if (params.has('chips')) gameState.chips = parseInt(params.get('chips'));
    if (params.has('defeated')) {
        gameState.defeatedMonsters = new Set(params.get('defeated').split(','));
    }

    // Prepare the monster deck
    prepareMonsterDeck();
}

// Prepare the monster deck according to game rules
function prepareMonsterDeck() {
    // Separate major and minor arcana
    const majorArcana = tarotData.cards.filter(card => card.type === 'major');
    const minorArcana = tarotData.cards.filter(card => card.type === 'minor');

    // Shuffle both decks
    shuffleArray(majorArcana);
    shuffleArray(minorArcana);

    // Select 4 random major arcana for bosses
    gameState.bosses = majorArcana.slice(0, 4);

    // Build the monster deck: 1 major + 14 minor, repeated
    gameState.monsterDeck = [];
    for (let i = 0; i < 4; i++) {
        gameState.monsterDeck.push(gameState.bosses[i]);
        gameState.monsterDeck.push(...minorArcana.slice(i * 14, (i + 1) * 14));
    }

    // Shuffle the final deck
    shuffleArray(gameState.monsterDeck);
}

// Start the game
function startGame() {
    introSection.classList.remove('active');
    gameSection.classList.add('active');
    addLogEntry("Game started! The monster deck has been prepared.");
}

// Explore a corridor
function exploreCorridor() {
    gameState.corridor++;
    gameState.battlePhase = 'selection';
    gameState.selectedMonster = null;
    gameState.activeBattleMonsters = [];
    gameState.monsterHealth.clear();

    // Check if we've reached a boss corridor (every 5th corridor)
    if (gameState.corridor % 5 === 0) {
        encounterBoss();
    } else {
        // Draw 2 face-up and 1 face-down cards
        gameState.currentMonsters = [
            drawMonsterCard(true),
            drawMonsterCard(true),
            drawMonsterCard(false)
        ];

        displayMonsters();
        addLogEntry(`Exploring corridor ${gameState.corridor}. Choose a monster to battle!`);
    }

    updateStats();
    updateURLParams();
}

// Draw a monster card from the deck
function drawMonsterCard(faceUp) {
    if (gameState.monsterDeck.length === 0) {
        addLogEntry("The monster deck is empty! Reshuffling...");
        prepareMonsterDeck();
    }

    const card = gameState.monsterDeck.pop();
    card.faceUp = faceUp;
    return card;
}

// Calculate monster health based on attack and defence stats
function calculateMonsterHealth(monster) {
    const stats = monster.soloterrareStats || {};
    
    // Extract chips value (handles comma-formatted numbers like "10,000")
    let chipsValue = stats.chips || "100";
    
    // Remove commas and convert to number
    chipsValue = parseInt(chipsValue.toString().replace(/,/g, '')) || 100;
    
    return chipsValue;
}

// Create monster card HTML using the new structure
function createMonsterCardHTML(monster, index) {
    const cardId = `monster-${index}`;
    const stats = monster.soloterrareStats || {};
    const isDefeated = gameState.defeatedMonsters.has(monster.index);
    const healthData = gameState.monsterHealth.get(cardId);
    const isInBattle = gameState.activeBattleMonsters.includes(index);
    const isSelected = gameState.selectedMonster === index;
    const isDiscarded = gameState.battlePhase === 'combat' && !isInBattle && gameState.selectedMonster !== null;
    
    // Handle discarded cards (don't display them)
    if (isDiscarded) {
        return '';
    }
    
    // Handle face-down cards
    if (!monster.faceUp) {
        return `
            <div class="monster-card face-down ${monster.type === 'major' ? 'boss' : ''} ${isDefeated ? 'defeated' : ''} ${isSelected ? 'selected' : ''}" data-monster-index="${index}">
                <div class="card-image" style="background-image: url('https://www.wopc.co.uk/images/subjects/tarot/rider-waite/pam-b-back.jpg')">
                    <div class="card-index">??</div>
                    <div class="card-overlay">
                        <div class="overlay-effect card-name">Face Down Card</div>
                        <div class="contents">
                            <div class="overlay-effect pixel-rounded solo">A mysterious card awaits...</div>
                            ${gameState.battlePhase === 'selection' ? 
                                `<button class="btn select-btn" data-index="${index}">Select & Reveal</button>` : 
                                `<button class="btn defeat-btn" data-index="${index}">Reveal</button>`
                            }
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    // Create health bar HTML for combat phase
    const healthBarHTML = healthData ? `
        <div class="health-section controls">
            <div class="health-bar">
                <div class="health-fill" style="width: ${(healthData.current / healthData.max) * 100}%"></div>
                <div class="health-text">${healthData.current}/${healthData.max}</div>
            </div>
            <div class="damage-input-section">
                <label for="${cardId}-damage">Deal Damage:</label>
                <input type="number" id="${cardId}-damage" class="damage-input" min="0" max="${healthData.current}" placeholder="Enter damage">
                <button class="btn deal-damage-btn" data-index="${index}">Apply Damage</button>
            </div>
            ${healthData.totalDamage > 0 ? `<div class="total-damage">Total Damage: ${healthData.totalDamage}</div>` : ''}
        </div>
    ` : '';
    
    return `
    ${healthBarHTML}
        <div class="monster-card ${monster.type === 'major' ? 'boss' : ''} ${isDefeated ? 'defeated' : ''} ${isSelected ? 'selected' : ''} ${isInBattle ? 'in-battle' : ''}" data-monster-index="${index}">
            <div class="card-image" style="background-image: url('${monster.image || 'path/to/default-monster.jpg'}')">
                <div class="card-index">${monster.index || '??'}</div>
                <div class="card-overlay">
                    <div class="overlay-effect card-name">${monster.name}
                        <div class="toggle-container">
                            <button class="toggle-btn active" data-card="${cardId}" data-target="abilities">Enemy</button>      
                            <button class="toggle-btn" data-card="${cardId}" data-target="activation">Item</button>
                        </div>
                    </div>
                    
                    <div class="contents">
                        
                        
                        <!-- Abilities section with unique ID -->
                        <div id="${cardId}-abilities" class="content-section active">
                            <div class="overlay-effect pixel-rounded solo">${monster.effects?.soloterrare || monster.description || 'A mysterious creature from the depths.'}</div>
                            <div class="overlay-effect critical">
                                <div><span class="title">Critical: </span>${stats.critical || 'Unknown ability'}</div>
                            </div>
                            <div class="overlay-effect ability">
                                <div><span class="title">Forlorn: </span>${stats.forlorn || 'Unknown ability'}</div>
                            </div>
                            <div class="soloterrare-stats">
                                <div class="stat attack">
                                    <div class="stat-value">${stats.attack || 'N/A'}</div>
                                    <div class="stat-label">Attack</div>
                                </div>
                                <div class="stat defence">
                                    <span class="stat-value">${stats.defence || 'N/A'}</span>
                                    <div class="stat-label">Defense</div>
                                </div>
                                <div class="stat chips">
                                    <span class="stat-value">${stats.chips || 'N/A'}</span>
                                    <div class="stat-label">Chips</div>
                                </div>
                            </div>
                            
                            ${gameState.battlePhase === 'selection' && !isDefeated ? 
                                `<button class="btn select-btn" data-index="${index}">Select to Battle</button>` :
                                gameState.battlePhase === 'combat' && isInBattle && !isDefeated ?
                                `<div class="combat-status">
                                    <div class="combat-message">In Combat - Use damage input above</div>
                                </div>` :
                                isDefeated ?
                                `<button class="btn defeated-btn disabled" disabled>Defeated</button>` :
                                `<button class="btn not-selected-btn disabled" disabled>Not Selected</button>`
                            }
                        </div>
                        
                        <!-- Activation section with unique ID -->
                        <div id="${cardId}-activation" class="content-section activation overlay-effect">
                            <div><span class="title">Activation: </span>${stats.activation || 'No special activation'}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Function to handle toggle button functionality
function setupToggleButtons(cardId) {
    const toggleButtons = document.querySelectorAll(`[data-card="${cardId}"]`);
    
    toggleButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.stopPropagation();
            
            const targetSection = this.dataset.target;
            const cardButtons = document.querySelectorAll(`[data-card="${cardId}"]`);
            const contentSections = document.querySelectorAll(`#${cardId}-abilities, #${cardId}-activation`);
            
            cardButtons.forEach(btn => btn.classList.remove('active'));
            contentSections.forEach(section => section.classList.remove('active'));
            
            this.classList.add('active');
            
            const targetElement = document.getElementById(`${cardId}-${targetSection}`);
            if (targetElement) {
                targetElement.classList.add('active');
            }
        });
    });
}

// Display monsters in the battle area
function displayMonsters() {
    battleArea.innerHTML = '';

    gameState.currentMonsters.forEach((monster, index) => {
        const monsterHTML = createMonsterCardHTML(monster, index);
        if (monsterHTML) { // Only add if not discarded
            battleArea.insertAdjacentHTML('beforeend', monsterHTML);
            
            if (monster.faceUp) {
                const cardId = `monster-${index}`;
                setupToggleButtons(cardId);
            }
        }
    });

    // Add event listeners
    setupBattleEventListeners();
}

// Set up battle event listeners
function setupBattleEventListeners() {
    // Selection phase buttons
    document.querySelectorAll('.select-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const index = parseInt(btn.getAttribute('data-index'));
            selectMonsterForBattle(index);
        });
    });

    // Damage dealing buttons
    document.querySelectorAll('.deal-damage-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const index = parseInt(btn.getAttribute('data-index'));
            const damageInput = document.getElementById(`monster-${index}-damage`);
            const damage = parseInt(damageInput.value) || 0;
            
            if (damage > 0) {
                dealDamage(index, damage);
                damageInput.value = ''; // Clear input after dealing damage
            }
        });
    });

    // Allow Enter key to deal damage
    document.querySelectorAll('.damage-input').forEach(input => {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const index = parseInt(input.id.split('-')[1]);
                const damage = parseInt(input.value) || 0;
                
                if (damage > 0) {
                    dealDamage(index, damage);
                    input.value = '';
                }
            }
        });
    });
}

// Select monster for battle
function selectMonsterForBattle(index) {
    const monster = gameState.currentMonsters[index];

    // If card is face down, reveal it first
    if (!monster.faceUp) {
        monster.faceUp = true;
        addLogEntry(`You revealed: ${monster.name}`);
    }

    // Initialize health for the selected monster
    const cardId = `monster-${index}`;
    const maxHealth = calculateMonsterHealth(monster);
    gameState.monsterHealth.set(cardId, {
        current: maxHealth,
        max: maxHealth,
        totalDamage: 0
    });

    // Check if it's a boss - if so, battle all 3 monsters
    if (monster.type === 'major') {
        addLogEntry("It's a boss! You must battle all 3 monsters together!");
        
        // Initialize health for all monsters in boss battle
        gameState.currentMonsters.forEach((m, i) => {
            if (!m.faceUp) m.faceUp = true; // Reveal all cards
            const cId = `monster-${i}`;
            const mHealth = calculateMonsterHealth(m);
            gameState.monsterHealth.set(cId, {
                current: mHealth,
                max: mHealth,
                totalDamage: 0
            });
        });
        
        gameState.activeBattleMonsters = [0, 1, 2]; // All monsters
        gameState.selectedMonster = index;
    } else {
        // Regular monster - battle only this one, discard others
        gameState.activeBattleMonsters = [index];
        gameState.selectedMonster = index;
        addLogEntry(`You selected ${monster.name} for battle! Other cards are discarded.`);
    }

    gameState.battlePhase = 'combat';
    displayMonsters();
}

// Deal damage to a monster
function dealDamage(index, damage) {
    const monster = gameState.currentMonsters[index];
    const cardId = `monster-${index}`;
    const healthData = gameState.monsterHealth.get(cardId);

    if (!healthData || damage <= 0) return;

    // Deal damage (can't exceed current health)
    const actualDamage = Math.min(damage, healthData.current);
    healthData.current -= actualDamage;
    healthData.totalDamage += actualDamage;

    addLogEntry(`You dealt ${actualDamage} damage to ${monster.name}!`);

    // Check if monster is defeated
    if (healthData.current <= 0) {
        gameState.defeatedMonsters.add(monster.index);
        gameState.monstersDefeated++;
        
        const chipsReward = parseInt(monster.soloterrareStats?.chips) || 100;
        gameState.chips += chipsReward;
        
        addLogEntry(`${monster.name} defeated! You gained ${chipsReward} chips!`);
        
        // Remove from active battle
        gameState.activeBattleMonsters = gameState.activeBattleMonsters.filter(i => i !== index);
    }

    // Check if all active monsters are defeated
    if (gameState.activeBattleMonsters.every(i => gameState.defeatedMonsters.has(gameState.currentMonsters[i].index))) {
        gameState.battlePhase = 'complete';
        addLogEntry("All monsters defeated! You can now explore the next corridor.");
        exploreBtn.style.display = 'block';
    }

    updateStats();
    updateURLParams();
    displayMonsters();
}

// Boss encounter
function encounterBoss() {
    addLogEntry(`You've reached a boss room on floor ${gameState.floor}!`);
    // Similar to regular encounter but force boss battle logic
}

// Proceed to next floor
function proceedToNextFloor() {
    gameState.floor++;
    gameState.corridor = 0;
    gameState.battlePhase = 'selection';
    gameState.selectedMonster = null;
    gameState.activeBattleMonsters = [];
    gameState.monsterHealth.clear();
    
    addLogEntry(`Moving to floor ${gameState.floor}`);
    updateStats();
    updateURLParams();
    nextFloorBtn.style.display = 'none';
    exploreBtn.style.display = 'block';
}

// Update game statistics display
function updateStats() {
    floorNumber.textContent = gameState.floor;
    corridorNumber.textContent = gameState.corridor;
    chipsCount.textContent = gameState.chips;
    monstersDefeated.textContent = gameState.monstersDefeated;
}

// Update URL parameters to save game state
function updateURLParams() {
    const params = new URLSearchParams();
    params.set('floor', gameState.floor);
    params.set('corridor', gameState.corridor);
    params.set('chips', gameState.chips);
    params.set('defeated', Array.from(gameState.defeatedMonsters).join(','));

    window.history.replaceState({}, '', `${window.location.pathname}?${params}`);
}

// Add entry to game log
function addLogEntry(message) {
    const entry = document.createElement('div');
    entry.className = 'log-entry';
    entry.textContent = message;
    gameLog.appendChild(entry);
    gameLog.scrollTop = gameLog.scrollHeight;
}

// Utility function to shuffle arrays
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', initGame);