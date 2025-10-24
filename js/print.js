        // Get elements
        const printButton = document.querySelector('.print-button');
        const printModal = document.querySelector('.print-modal');
        const closeButtons = document.querySelectorAll('.modal-close, #cancel-print');
        const confirmPrintButton = document.querySelector('#confirm-print');
        
        // Open modal when print button is clicked
        printButton.addEventListener('click', () => {
            printModal.classList.add('active');
        });
        
        // Close modal when close button or cancel is clicked
        closeButtons.forEach(button => {
            button.addEventListener('click', () => {
                printModal.classList.remove('active');
            });
        });
        
        // Close modal when clicking outside the modal content
        printModal.addEventListener('click', (e) => {
            if (e.target === printModal) {
                printModal.classList.remove('active');
            }
        });
        
        // Print when confirm button is clicked
        confirmPrintButton.addEventListener('click', () => {
            window.print();
            printModal.classList.remove('active');
        });
        
        // Close modal with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && printModal.classList.contains('active')) {
                printModal.classList.remove('active');
            }
        });



        // PDF Export functionality
class TarotCardExporter {
    constructor() {
        this.setupExportListeners();
    }
    
    setupExportListeners() {
        const exportBtn = document.getElementById('exportPdf');
        const deckSelect = document.getElementById('exportDeckSelect');
        const sizeSelect = document.getElementById('exportSize');
        
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                const deckType = deckSelect ? deckSelect.value : 'regular';
                const cardSize = sizeSelect ? sizeSelect.value : 'poker';
                this.exportCardsAsPDF(deckType, cardSize);
            });
        }
    }
    
    async exportCardsAsPDF(deckType = 'regular', cardSize = 'poker') {
        try {
            // Show loading state
            this.showLoading('Generating PDF...');
            
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });
            
            // Get all cards data
            const cards = this.prepareCardsForExport(deckType);
            
            // Generate PDF based on selected size
            if (cardSize === 'a4') {
                await this.generateA4Layout(pdf, cards, deckType);
            } else {
                await this.generateCuttingLayout(pdf, cards, deckType, cardSize);
            }
            
            // Save the PDF
            const fileName = `tarot-cards-${deckType}-${new Date().getTime()}.pdf`;
            pdf.save(fileName);
            
            this.hideLoading();
            this.showSuccess('PDF generated successfully!');
            
        } catch (error) {
            console.error('PDF export error:', error);
            this.hideLoading();
            this.showError('Failed to generate PDF. Please try again.');
        }
    }
    
    prepareCardsForExport(deckType) {
        return tarotData.cards.map(card => ({
            ...card,
            displayEffect: card.effects[deckType],
            isSoloterrare: deckType === 'soloterrare' && card.soloterrareStats
        }));
    }
    
    async generateA4Layout(pdf, cards, deckType) {
        const cardsPerPage = 9;
        const cardsPerRow = 3;
        const cardWidth = 63;
        const cardHeight = 88;
        const margin = 10;
        
        for (let page = 0; page < Math.ceil(cards.length / cardsPerPage); page++) {
            if (page > 0) {
                pdf.addPage();
            }
            
            const startIndex = page * cardsPerPage;
            const endIndex = Math.min(startIndex + cardsPerPage, cards.length);
            const pageCards = cards.slice(startIndex, endIndex);
            
            for (let i = 0; i < pageCards.length; i++) {
                const card = pageCards[i];
                const row = Math.floor(i / cardsPerRow);
                const col = i % cardsPerRow;
                
                const x = margin + (col * (cardWidth + 5));
                const y = margin + (row * (cardHeight + 5));
                
                await this.addCardToPDF(pdf, card, x, y, cardWidth, cardHeight, deckType);
            }
        }
    }
    
    async generateCuttingLayout(pdf, cards, deckType, cardSize) {
        const dimensions = this.getCardDimensions(cardSize);
        const cardsPerPage = this.getCardsPerPage(cardSize);
        
        for (let page = 0; page < Math.ceil(cards.length / cardsPerPage); page++) {
            if (page > 0) {
                pdf.addPage();
            }
            
            const startIndex = page * cardsPerPage;
            const endIndex = Math.min(startIndex + cardsPerPage, cards.length);
            const pageCards = cards.slice(startIndex, endIndex);
            
            // Add cutting guides
            this.addCuttingGuides(pdf, dimensions, cardSize);
            
            for (let i = 0; i < pageCards.length; i++) {
                const card = pageCards[i];
                const position = this.getCardPosition(i, cardSize);
                
                await this.addCardToPDF(
                    pdf, 
                    card, 
                    position.x, 
                    position.y, 
                    dimensions.width, 
                    dimensions.height, 
                    deckType
                );
            }
        }
    }
    
    getCardDimensions(cardSize) {
        switch(cardSize) {
            case 'poker':
                return { width: 63.5, height: 88.9 }; // 2.5" x 3.5" in mm
            case 'tarot':
                return { width: 70, height: 120 }; // 2.75" x 4.75" in mm
            default:
                return { width: 63.5, height: 88.9 };
        }
    }
    
    getCardsPerPage(cardSize) {
        switch(cardSize) {
            case 'poker':
            case 'tarot':
                return 9; // 3x3 grid
            case 'a4':
                return 9;
            default:
                return 9;
        }
    }
    
    getCardPosition(index, cardSize) {
        const cardsPerRow = 3;
        const row = Math.floor(index / cardsPerRow);
        const col = index % cardsPerRow;
        
        const dimensions = this.getCardDimensions(cardSize);
        const margin = 10;
        const spacing = 5;
        
        return {
            x: margin + (col * (dimensions.width + spacing)),
            y: margin + (row * (dimensions.height + spacing))
        };
    }
    
    async addCardToPDF(pdf, card, x, y, width, height, deckType) {
        // Create a temporary div for the card
        const tempCard = document.createElement('div');
        tempCard.className = `print-card card-size-${this.getSizeClass(width)}`;
        tempCard.style.width = `${width}mm`;
        tempCard.style.height = `${height}mm`;
        tempCard.style.position = 'absolute';
        tempCard.style.left = '-9999px';
        tempCard.style.top = '0';
        tempCard.style.background = '#3a2471';
        tempCard.style.borderRadius = '8px';
        tempCard.style.padding = '5mm';
        tempCard.style.boxSizing = 'border-box';
        tempCard.style.fontSize = '8pt';
        tempCard.style.color = 'white';
        
        // Build card content
        tempCard.innerHTML = this.generateCardHTML(card, deckType);
        document.body.appendChild(tempCard);
        
        try {
            // Convert to canvas
            const canvas = await html2canvas(tempCard, {
                scale: 2,
                useCORS: true,
                allowTaint: true,
                backgroundColor: '#3a2471'
            });
            
            // Add to PDF
            const imgData = canvas.toDataURL('image/jpeg', 0.9);
            pdf.addImage(imgData, 'JPEG', x, y, width, height);
            
        } catch (error) {
            console.error('Error rendering card:', card.name, error);
            // Fallback: Add simple text representation
            this.addTextCard(pdf, card, x, y, width, height, deckType);
        }
        
        // Clean up
        document.body.removeChild(tempCard);
    }
    
    generateCardHTML(card, deckType) {
        const stats = card.soloterrareStats || {};
        const isSoloterrare = deckType === 'soloterrare' && card.soloterrareStats;
        
        return `
            <div style="text-align: center; margin-bottom: 2mm;">
                <strong style="color: #e9c46a; font-size: 10pt;">${card.name}</strong>
                <div style="font-size: 7pt; color: #d0c4e4;">#${card.index}</div>
            </div>
            
            ${isSoloterrare ? `
            <div style="margin-bottom: 2mm; font-size: 7pt;">
                <div><strong>Attack:</strong> ${stats.attack}</div>
                <div><strong>Defense:</strong> ${stats.defence}</div>
                <div><strong>Chips:</strong> ${stats.chips}</div>
            </div>
            
            <div style="font-size: 6pt; line-height: 1.2;">
                <div><strong>Critical:</strong> ${stats.critical}</div>
                <div><strong>Forlorn:</strong> ${stats.forlorn}</div>
                <div><strong>Activation:</strong> ${stats.activation}</div>
            </div>
            ` : `
            <div style="font-size: 7pt; line-height: 1.3;">
                ${card.effects[deckType]}
            </div>
            `}
        `;
    }
    
    addTextCard(pdf, card, x, y, width, height, deckType) {
        pdf.setFillColor(58, 36, 113); // #3a2471
        pdf.rect(x, y, width, height, 'F');
        
        pdf.setTextColor(233, 196, 106); // #e9c46a
        pdf.setFontSize(10);
        pdf.text(card.name, x + 5, y + 8);
        
        pdf.setTextColor(208, 196, 228); // #d0c4e4
        pdf.setFontSize(6);
        pdf.text(`#${card.index}`, x + 5, y + 12);
        
        const effect = card.effects[deckType];
        const lines = pdf.splitTextToSize(effect, width - 10);
        pdf.setFontSize(5);
        pdf.text(lines, x + 5, y + 20);
    }
    
    addCuttingGuides(pdf, dimensions, cardSize) {
        pdf.setDrawColor(200, 200, 200);
        pdf.setLineWidth(0.1);
        
        // Add cutting lines between cards
        const cardsPerRow = 3;
        const margin = 10;
        const spacing = 5;
        
        for (let i = 1; i < cardsPerRow; i++) {
            const x = margin + (i * dimensions.width) + ((i - 1) * spacing);
            pdf.line(x, 0, x, 297); // A4 height
        }
        
        for (let i = 1; i < cardsPerRow; i++) {
            const y = margin + (i * dimensions.height) + ((i - 1) * spacing);
            pdf.line(0, y, 210, y); // A4 width
        }
    }
    
    getSizeClass(width) {
        if (width === 63.5) return 'poker';
        if (width === 70) return 'tarot';
        return 'a4';
    }
    
    showLoading(message) {
        // Implement loading indicator
        console.log('Loading:', message);
    }
    
    hideLoading() {
        // Hide loading indicator
        console.log('Loading complete');
    }
    
    showSuccess(message) {
        // Implement success notification
        alert(message);
    }
    
    showError(message) {
        // Implement error notification
        alert(message);
    }
}

// Initialize exporter when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.tarotExporter = new TarotCardExporter();
});