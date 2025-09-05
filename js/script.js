// Current deck type
let currentDeck = 'regular';
let currentSuit = 'all'; // Add this variable
let tarotData = null;

// DOM elements
const cardGrid = document.getElementById('cardGrid');
const searchInput = document.getElementById('searchInput');
const deckSelect = document.getElementById('deckSelect');
const suitSelect = document.getElementById('suitSelect'); // Add this element

// Initialize the page
function init() {
    loadTarotData();
}

// Load tarot data from JSON file
function loadTarotData() {
    fetch('data/tarot-data.json')
        .then(response => response.json())
        .then(data => {
            tarotData = data;
            displayCards(tarotData.cards);
            setupEventListeners();
        })
        .catch(error => {
            console.error('Error loading tarot data:', error);
            cardGrid.innerHTML = '<div class="no-results">Error loading tarot cards. Please try again later.</div>';
        });
}

// Set up event listeners
function setupEventListeners() {
    // Search functionality
    searchInput.addEventListener('input', () => {
        filterCards();
    });
    
    // Deck selection
    deckSelect.addEventListener('change', () => {
        currentDeck = deckSelect.value;
        filterCards();
    });
    
    // Suit selection - ADD THIS
    suitSelect.addEventListener('change', () => {
        currentSuit = suitSelect.value;
        filterCards();
    });
}

function displayCards(cards) {
    cardGrid.innerHTML = '';
    
    if (cards.length === 0) {
        cardGrid.innerHTML = '<div class="no-results">No cards found matching your search.</div>';
        return;
    }
    
    // If filtering by a specific suit, show without headers
    if (currentSuit !== 'all') {
        cards.forEach(card => addCardElement(card));
        return;
    }
    
    // Group cards by type (major) or suit (minor) - only when showing all
    const groupedCards = groupCardsByTypeOrSuit(cards);
    
    // Display each group with its appropriate header
    for (const [groupName, groupCards] of Object.entries(groupedCards)) {
        // Add section header - convert suit to proper case
        const headerText = groupName === 'major' ? 'MAJOR ARCANA' : groupName.toUpperCase();
        addSectionHeader(headerText);
        
        // Add cards for this group
        groupCards.forEach(card => addCardElement(card));
    }
}

// Group cards by type for major, by suit for minor
function groupCardsByTypeOrSuit(cards) {
    const groups = {};
    
    cards.forEach(card => {
        let groupName;
        
        if (card.type === 'major') {
            groupName = 'major';
        } else {
            // Use the suit name for minor arcana
            groupName = card.suit || 'other';
        }
        
        if (!groups[groupName]) {
            groups[groupName] = [];
        }
        
        groups[groupName].push(card);
    });
    
    // Sort the groups in a specific order: Major first, then suits in traditional order
    const orderedGroups = {};
    const order = ['major', 'wands', 'cups', 'swords', 'pentacles'];
    
    order.forEach(group => {
        if (groups[group]) {
            orderedGroups[group] = groups[group];
            // Sort cards within each group by index
            orderedGroups[group].sort((a, b) => a.index - b.index);
        }
    });
    
    // Add any remaining groups that weren't in the order array
    Object.keys(groups).forEach(group => {
        if (!orderedGroups[group]) {
            orderedGroups[group] = groups[group];
            orderedGroups[group].sort((a, b) => a.index - b.index);
        }
    });
    
    return orderedGroups;
}

// Helper function to add section headers
function addSectionHeader(title) {
    const headerElement = document.createElement('div');
    headerElement.className = 'section-header';
    headerElement.textContent = title;
    
    // Add data attribute for styling
    const type = title === 'MAJOR ARCANA' ? 'major' : title.toLowerCase();
    headerElement.setAttribute('data-type', type);
    
    cardGrid.appendChild(headerElement);
}

// Helper function to add card elements
function addCardElement(card) {
    const cardElement = document.createElement('div');
    
    if (currentDeck === 'soloterrare' && card.soloterrareStats) {
        cardElement.className = 'card soloterrare-card';
        cardElement.innerHTML = createSoloterrareCardHTML(card);
    } else {
        cardElement.className = 'card';
        cardElement.innerHTML = `
            <div class="card-image" style="background-image: url('${card.image}')">
                <div class="card-index">${card.index}</div>
                <div class="card-overlay">
                    <div class="card-name overlay-effect">${card.name}</div>
                    <div class="overlay-effect">${card.effects[currentDeck]}</div>
                </div>
            </div>
        `;
    }
    
    cardGrid.appendChild(cardElement);
}

// Create HTML for Soloterrare cards
function createSoloterrareCardHTML(card) {
    const stats = card.soloterrareStats;
    // Create unique IDs for each card's sections
    const cardId = `card-${card.index}`;
    
    return `
        <div class="card-image" style="background-image: url('${card.image}')">
            <div class="card-index">${card.index}</div>
            <div class="card-overlay">
                <div class="overlay-effect card-name">${card.name}
                    <div class="toggle-container">
                        <button class="toggle-btn active" data-card="${cardId}" data-target="abilities">Enemy</button>      
                        <button class="toggle-btn" data-card="${cardId}" data-target="activation">Item</button>
                    </div>
                </div>
                
                <div class="contents">
                    <!-- Abilities section with unique ID -->
                    <div id="${cardId}-abilities" class="content-section  active">
                        <div class="overlay-effect pixel-rounded solo">${card.effects[currentDeck]}</div>
                        <div class="overlay-effect critical">
                            <div><span class="title">Critical: </span>${stats.critical}</div>
                        </div>
                        <div class="overlay-effect ability">
                            <div><span class="title">Forlorn: </span>${stats.forlorn}</div>
                        </div>
                        <div class="soloterrare-stats">
                        <div class="stat attack">
                            <div class="stat-value">${stats.attack}</div>
                            <div class="stat-label">Attack</div>
                        </div>
                        <div class="stat defence">
                            <span class="stat-value">${stats.defence}</span>
                            <div class="stat-label">Defense</div>
                        </div>
                        <div class="stat chips">
                            <span class="stat-value">${stats.chips}</span>
                            <div class="stat-label">Chips</div>
                        </div>
                    </div>
                    </div>
                    
                    <!-- Activation section with unique ID -->
                    <div id="${cardId}-activation" class="content-section activation overlay-effect">
                        <div><span class="title">Activation: </span>${stats.activation}</div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Event delegation for toggle buttons
function setupToggleButtons() {
    // Use event delegation for dynamically created buttons
    document.addEventListener('click', function(e) {
        if (e.target && e.target.classList.contains('toggle-btn')) {
            const button = e.target;
            const targetSection = button.getAttribute('data-target');
            const cardId = button.getAttribute('data-card');
            
            // Find the parent card
            const card = button.closest('.card-overlay');
            if (!card) return;
            
            // Remove active class from all buttons in this card
            card.querySelectorAll('.toggle-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            
            // Add active class to clicked button
            button.classList.add('active');
            
            // Hide all content sections in this card
            card.querySelectorAll('.content-section').forEach(section => {
                section.classList.remove('active');
            });
            
            // Show the targeted content section
            const targetElement = card.querySelector(`#${cardId}-${targetSection}`);
            if (targetElement) {
                targetElement.classList.add('active');
            }
        }
    });
}

// Filter cards based on search input AND suit filter
function filterCards() {
    const searchTerm = searchInput.value.toLowerCase();
    
    let filteredCards = tarotData.cards;
    
    // Apply suit filter first
    if (currentSuit !== 'all') {
        if (currentSuit === 'major') {
            filteredCards = filteredCards.filter(card => card.type === 'major');
        } else {
            filteredCards = filteredCards.filter(card => card.suit === currentSuit);
        }
    }
    
    // Then apply search filter
    if (searchTerm !== '') {
        filteredCards = filteredCards.filter(card => {
            return card.name.toLowerCase().includes(searchTerm) || 
                   card.effects[currentDeck].toLowerCase().includes(searchTerm);
        });
    }
    
    displayCards(filteredCards);
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', init);

// Call this function after you've created all cards
setupToggleButtons();