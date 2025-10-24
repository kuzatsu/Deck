        // Get elements
        const printButton = document.querySelector('.print-button');
        const printModal = document.querySelector('.print-modal');
        const closeButtons = document.querySelectorAll('.modal-close, #cancel-print');
        const confirmPrintButton = document.querySelector('#confirm-print');

        // Open modal when print button is clicked
        if (printButton && printModal) {
            printButton.addEventListener('click', () => {
                printModal.classList.add('active');
            });
        }

        // Close modal when close button or cancel is clicked
        if (closeButtons && closeButtons.length) {
            closeButtons.forEach(button => {
                button.addEventListener('click', () => {
                    printModal.classList.remove('active');
                });
            });
        }

        // Close modal when clicking outside the modal content
        if (printModal) {
            printModal.addEventListener('click', (e) => {
                if (e.target === printModal) {
                    printModal.classList.remove('active');
                }
            });
        }

        // Optional legacy confirm button guard
        if (confirmPrintButton) {
            confirmPrintButton.addEventListener('click', () => {
                window.print();
                printModal.classList.remove('active');
            });
        }

        // Close modal with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && printModal && printModal.classList.contains('active')) {
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
                // Open print-friendly view in a new tab
                this.openPrintTab(deckType, cardSize);
                if (printModal) {
                    printModal.classList.remove('active');
                }
            });
        }
    }

    // Opens a new tab with print-friendly HTML that keeps card styling
    openPrintTab(deckType = 'regular', cardSize = 'poker') {
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            alert('Popup blocked. Please allow popups to print.');
            return;
        }

        const { widthMm, heightMm, columns } = this.getPrintLayout(cardSize);
        const cardsHtml = this.generateCardsMarkup(deckType, widthMm, heightMm);
        const filtersSvg = this.generateFiltersSvg();
        const baseHref = (new URL('.', window.location.href)).href;

        const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Print Preview - ${deckType} deck</title>
  <base href="${baseHref}">
  <link rel="stylesheet" href="css/style.css" />
  <style>
    html, body { margin: 0; padding: 0; }
    body { background: #fff !important; color: #000; }
    /* Container */
    .print-toolbar { position: sticky; top: 0; background: #fff; padding: 10px; display: flex; gap: 10px; border-bottom: 1px solid #ddd; }
    .print-grid { display: grid; grid-template-columns: repeat(${columns}, ${widthMm}mm); gap: 5mm; justify-content: center; padding: 10mm; }
    /* Ensure cards size to print dimensions */
    .card.print-card { width: ${widthMm}mm !important; height: ${heightMm}mm !important; max-width: none !important; border: 1px solid #000; }
    .card.print-card .card-image { height: 100% !important; }
    /* Avoid page background ink */
    @media print {
      .print-toolbar { display: none !important; }
      body { background: #fff !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .print-grid { padding: 0; gap: 3mm; }
    }
  </style>
  <script>
    function triggerPrint(){ window.print(); }
  </script>
  </head>
  <body>
    ${filtersSvg}
    <div class="print-toolbar">
      <button onclick="window.close()">Close</button>
      <button onclick="triggerPrint()">Print</button>
      <span style="margin-left:auto">Deck: ${deckType} · Size: ${cardSize}</span>
    </div>
    <div class="print-grid">
      ${cardsHtml}
    </div>
  </body>
</html>`;

        printWindow.document.open();
        printWindow.document.write(html);
        printWindow.document.close();
    }

    // Build card markup using the existing on-page card structure
    generateCardsMarkup(deckType, widthMm, heightMm) {
        if (!window.tarotData || !window.tarotData.cards) {
            return '<p>Card data not loaded.</p>';
        }
        const isSoloterrare = deckType === 'soloterrare';
        return window.tarotData.cards
            .map(card => {
                if (isSoloterrare && card.soloterrareStats) {
                    return `
                    <div class="card soloterrare-card print-card" style="width:${widthMm}mm;height:${heightMm}mm">
                        ${this.createSoloterrareCardHTML(card, deckType)}
                    </div>`;
                }
                return `
                <div class="card print-card" style="width:${widthMm}mm;height:${heightMm}mm">
                    <div class="card-image" style="background-image: url('${card.image}')">
                        <div class="card-index">${card.index}</div>
                        <div class="card-overlay">
                            <div class="card-name overlay-effect">${card.name}</div>
                            <div class="overlay-effect">${card.effects[deckType] || ''}</div>
                        </div>
                    </div>
                </div>`;
            })
            .join('');
    }

    // Copy of the soloterrare markup used on the main page
    createSoloterrareCardHTML(card, deckType) {
        const stats = card.soloterrareStats || {};
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
                    <div id="${cardId}-abilities" class="content-section active">
                        <div class="overlay-effect solo">${card.effects[deckType] || ''}</div>
                        <div class="overlay-effect critical">
                            <div><span class="title">Critical: </span>${stats.critical || ''}</div>
                        </div>
                        <div class="overlay-effect ability">
                            <div><span class="title">Forlorn: </span>${stats.forlorn || ''}</div>
                        </div>
                        <div class="soloterrare-stats">
                            <div class="stat attack">
                                <div class="stat-value">${stats.attack ?? ''}</div>
                                <div class="stat-label">Attack</div>
                            </div>
                            <div class="stat defence">
                                <span class="stat-value">${stats.defence ?? ''}</span>
                                <div class="stat-label">Defense</div>
                            </div>
                            <div class="stat chips">
                                <span class="stat-value">${stats.chips ?? ''}</span>
                                <div class="stat-label">Chips</div>
                            </div>
                        </div>
                    </div>
                    <div id="${cardId}-activation" class="content-section activation overlay-effect">
                        <div><span class="title">Activation: </span>${stats.activation || ''}</div>
                    </div>
                </div>
            </div>
        </div>`;
    }

    // Define the card layout per selection
    getPrintLayout(cardSize) {
        switch (cardSize) {
            case 'poker':
                return { widthMm: 63.5, heightMm: 88.9, columns: 3 };
            case 'tarot':
                return { widthMm: 70, heightMm: 120, columns: 3 };
            case 'a4':
                return { widthMm: 63, heightMm: 88, columns: 3 };
            default:
                return { widthMm: 63.5, heightMm: 88.9, columns: 3 };
        }
    }

    // Inline the filters needed by style.css for pixelation overlays
    generateFiltersSvg() {
        return `
        <svg width="0" height="0" aria-hidden="true">
            <filter id="Pixelate">
                <feFlood x="1" y="1" width="1" height="1" />
                <feComposite width="3" height="3" />
                <feTile result="tiled" />
                <feComposite in="SourceGraphic" in2="tiled" operator="in" />
                <feMorphology operator="dilate" radius="1" />
            </filter>
            <filter id="PixelateSmall">
                <feFlood x="1" y="1" width="1" height="1" />
                <feComposite width="3" height="3" />
                <feTile result="tiled" />
                <feComposite in="SourceGraphic" in2="tiled" operator="in" />
                <feMorphology operator="dilate" radius="1" />
            </filter>
            <filter id="PixelateMedium">
                <feFlood x="2" y="2" width="1" height="1" />
                <feComposite width="5" height="5" />
                <feTile result="tiled" />
                <feComposite in="SourceGraphic" in2="tiled" operator="in" />
                <feMorphology operator="dilate" radius="2" />
            </filter>
        </svg>`;
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