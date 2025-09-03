// Current deck type
let currentDeck = 'regular';
let tarotData = null;

// DOM elements
const cardGrid = document.getElementById('cardGrid');
const searchInput = document.getElementById('searchInput');
const deckSelect = document.getElementById('deckSelect');

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
}

// Display cards based on current deck and search term
function displayCards(cards) {
    cardGrid.innerHTML = '';
    
    if (cards.length === 0) {
        cardGrid.innerHTML = '<div class="no-results">No cards found matching your search.</div>';
        return;
    }
    
    cards.forEach(card => {
        const cardElement = document.createElement('div');
        
        if (currentDeck === 'soloterrare' && card.soloterrareStats) {
            // Special layout for Soloterrare cards
            cardElement.className = 'card soloterrare-card';
            cardElement.innerHTML = createSoloterrareCardHTML(card);
        } else {
            // Standard layout for other decks
            cardElement.className = 'card';
            cardElement.innerHTML = `
                <div class="card-image" style="background-image: url('${card.image}')">
                    <div class="card-index">#${card.index}</div>
                    <div class="card-overlay">
                        <div class="card-name">${card.name}</div>
                        <div class="card-effect">${card.effects[currentDeck]}</div>
                    </div>
                </div>
            `;
        }
        
        cardGrid.appendChild(cardElement);
    });
}

// Create HTML for Soloterrare cards
function createSoloterrareCardHTML(card) {
    const stats = card.soloterrareStats;
    return `
        <div class="card-image" style="background-image: url('${card.image}')">
            <div class="card-index">${card.index}</div>
            <div class="card-overlay">
                <div class="card-name">${card.name}</div>
                <div class="ability">
                    <div class="ability-title">Critical:</div>
                    <div>${stats.critical}</div>
                </div>
                <div class="ability">
                    <div class="ability-title">Forlorn:</div>
                    <div>${stats.forlorn}</div>
                </div>
                <div class="ability">
                    <div class="ability-title">Activation:</div>
                    <div>${stats.activation}</div>
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
        </div>
    `;
}

// Filter cards based on search input
function filterCards() {
    const searchTerm = searchInput.value.toLowerCase();
    
    if (searchTerm === '') {
        displayCards(tarotData.cards);
        return;
    }
    
    const filteredCards = tarotData.cards.filter(card => {
        return card.name.toLowerCase().includes(searchTerm) || 
               card.effects[currentDeck].toLowerCase().includes(searchTerm);
    });
    
    displayCards(filteredCards);
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', init);