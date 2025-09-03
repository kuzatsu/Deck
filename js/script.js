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
                    <div class="card-index">${card.index}</div>
                    <div class="card-overlay">
                        <div class="card-name">${card.name}</div>
                        <div class="overlay-effect">${card.effects[currentDeck]}</div>
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
    // Create unique IDs for each card's sections
    const cardId = `card-${card.index}`;
    
    return `
        <div class="card-image" style="background-image: url('${card.image}')">
            <div class="card-index">${card.index}</div>
            <div class="card-overlay">
                <div class="card-name">${card.name}
                    <div class="toggle-container">
                        <button class="toggle-btn active" data-card="${cardId}" data-target="abilities">Abilities</button>      
                        <button class="toggle-btn" data-card="${cardId}" data-target="activation">Activation</button>
                    </div>
                </div>
                
                <!-- Toggle buttons - should be near the top -->
               
                
                <div class="contents">
                    <!-- Abilities section with unique ID -->
                    <div id="${cardId}-abilities" class="content-section  active">
                        <div class="overlay-effect solo">${card.effects[currentDeck]}</div>
                        <div class="overlay-effect critical">
                            <div><span class="title">Critical: </span>${stats.critical}</div>
                        </div>
                        <div class="overlay-effect ability">
                            <div><span class="title">Forlorn: </span>${stats.forlorn}</div>
                        </div>
                    </div>
                    
                    <!-- Activation section with unique ID -->
                    <div id="${cardId}-activation" class="content-section overlay-effect">
                        <div class="title">Activation:</div>
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
        </div>
    `;
}

// Event delegation for toggle buttons (add this after card creation)
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

// Call this function after you've created all cards
setupToggleButtons();

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