// Create a popup for the treasure code in the center of the screen
const createTreasurePopup = () => {
    // Popup window
    const popup = document.createElement('div');
    popup.style.position = 'fixed';
    popup.style.top = '50%';
    popup.style.left = '50%';
    popup.style.transform = 'translate(-50%, -50%)';
    popup.style.width = '300px';
    popup.style.padding = '20px';
    popup.style.backgroundColor = '#101010';
    popup.style.color = '#fff';
    popup.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
    popup.style.borderRadius = '20px';
    popup.style.textAlign = 'center';
    popup.style.display = 'none';
    popup.style.zIndex = 2000;

    // Overlay layer
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = 0;
    overlay.style.left = 0;
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    overlay.style.display = 'none';
    overlay.style.zIndex = 1500;
    overlay.addEventListener('click', () => {
        popup.style.display = 'none';
        overlay.style.display = 'none';
    });

    // Treasure code
    const treasureCode = document.createElement('div');
    treasureCode.style.fontSize = '18px';
    treasureCode.style.marginBottom = '10px';
    treasureCode.style.padding = '10px';
    treasureCode.style.backgroundColor = '#202020';
    treasureCode.style.borderRadius = '15px';
    treasureCode.style.cursor = 'pointer';
    treasureCode.innerText = 'TREASURE123';
    treasureCode.addEventListener('click', () => {
        navigator.clipboard.writeText(treasureCode.innerText).then(() => {
            alert('Treasure code copied to clipboard!');
        });
    });

    // Message
    const message = document.createElement('p');
    message.style.marginTop = '15px';
    message.style.fontSize = '14px';
    message.innerText = 'Go to the earn page, enter the treasure code, check your balance, and enjoy 1 million coins!';

    // Close button
    const closeButton = document.createElement('button');
    closeButton.style.marginTop = '15px';
    closeButton.style.padding = '8px 16px';
    closeButton.style.backgroundColor = '#333';
    closeButton.style.color = '#fff';
    closeButton.style.border = 'none';
    closeButton.style.borderRadius = '15px';
    closeButton.style.cursor = 'pointer';
    closeButton.innerText = 'Close';
    closeButton.addEventListener('click', () => {
        popup.style.display = 'none';
        overlay.style.display = 'none';
    });

    // Add elements to the popup
    popup.appendChild(treasureCode);
    popup.appendChild(message);
    popup.appendChild(closeButton);

    // Add elements to the document
    document.body.appendChild(overlay);
    document.body.appendChild(popup);

    return { popup, overlay };
};

// Initialize the button and popup
document.addEventListener('DOMContentLoaded', () => {
    const promocodeButton = document.getElementById('tasknavbarBalanceDisplay');
    const { popup, overlay } = createTreasurePopup();

    let timer;
    
    promocodeButton.addEventListener('mousedown', () => {
        timer = setTimeout(() => {
            popup.style.display = 'block';
            overlay.style.display = 'block';
        }, 3000); // 3 seconds
    });

    promocodeButton.addEventListener('mouseup', () => {
        clearTimeout(timer);
    });

    promocodeButton.addEventListener('mouseleave', () => {
        clearTimeout(timer);
    });
});
