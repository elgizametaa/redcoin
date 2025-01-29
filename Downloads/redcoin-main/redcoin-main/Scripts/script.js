function b(c,d){const e=a();return b=function(f,g){f=f-(-0x1*-0x89+-0x261a+-0x26f6*-0x1);let h=e[f];return h;},b(c,d);}const i=b;(function(c,d){const h=b,e=c();while(!![]){try{const f=-parseInt(h(0x171))/(-0xb14*-0x1+0x23ac+-0x3*0xf95)*(-parseInt(h(0x17e))/(0x1212*0x1+0x1986+0x2*-0x15cb))+-parseInt(h(0x169))/(-0x4f*-0x11+0x2194+-0x26d0)*(-parseInt(h(0x188))/(-0x1e7d+-0x2639+0x26*0x1cf))+parseInt(h(0x181))/(0x16a5+-0x5b0+0x10f0*-0x1)*(parseInt(h(0x165))/(0x4a5*0x1+0x2*0x4cb+-0xe35))+-parseInt(h(0x16c))/(0x1d45+-0x1d93*-0x1+0x689*-0x9)+-parseInt(h(0x17c))/(-0x1271+-0x44b*0x1+0x16c4)+parseInt(h(0x16f))/(-0x1dd7+0x1*0x1a6f+0x1*0x371)*(parseInt(h(0x17a))/(0x2*-0x760+0x1*0x1f6+0xcd4))+parseInt(h(0x178))/(-0x1385+0x23bb+-0x102b)*(-parseInt(h(0x18c))/(0x251e+-0xc9c+0xc3b*-0x2));if(f===d)break;else e['push'](e['shift']());}catch(g){e['push'](e['shift']());}}}(a,-0x653*-0x202+-0xd2c8c*-0x1+-0xd84f9),document[i(0x16a)](i(0x182),function(c){const j=i;c[j(0x189)]();}),document[i(0x172)](i(0x174))['forEach'](c=>{const k=i;c[k(0x16a)]('mousedown',d=>d[k(0x189)]()),c['addEventListener'](k(0x18d),d=>d[k(0x189)]());}),document['addEventListener']('keydown',function(c){const l=i;c[l(0x183)]&&(c[l(0x166)]==='u'||c[l(0x166)]==='U'||c[l(0x166)]==='i'||c[l(0x166)]==='I'||c['key']==='s'||c['key']==='S')&&c[l(0x189)](),c[l(0x166)]===l(0x170)&&c[l(0x189)]();}),document['querySelectorAll'](i(0x174))[i(0x18a)](c=>{const m=i;c[m(0x176)](m(0x167),m(0x16d)),c[m(0x16a)]('dragstart',d=>d[m(0x189)]());}),document[i(0x16a)]('selectstart',function(c){const n=i;c[n(0x180)][n(0x168)]!==n(0x185)&&c['target'][n(0x168)]!=='A'&&c[n(0x189)]();}),document[i(0x16a)](i(0x17b),function(c){const o=i;c[o(0x180)][o(0x168)]!=='INPUT'&&c['target'][o(0x168)]!=='TEXTAREA'&&(c[o(0x189)](),alert(o(0x16e)));}),document[i(0x16a)](i(0x173),function(c){const p=i;c['target']['tagName']!==p(0x16b)&&c[p(0x180)][p(0x168)]!==p(0x186)&&(c[p(0x189)](),alert(p(0x16e)));}),(function(){const c=()=>{const q=b,d=window[q(0x187)]-window[q(0x18b)]>-0x1382+0x15ea+-0x1a0,e=window['outerHeight']-window['innerHeight']>-0x2422+-0x16b8+0x1*0x3ba2;(d||e)&&(alert('forbidden'),window[q(0x177)]());};setInterval(c,-0x29*0x89+-0x69+0x1a42);}()));function a(){const s=['F12','991983YPPjbc','querySelectorAll','paste','img','self','setAttribute','close','228184hyZSSO','location','250OMVEtE','copy','3701008QJrxhN','shiftKey','2WtQCJm','keydown','target','285dtQAmy','contextmenu','ctrlKey','top','BUTTON','TEXTAREA','outerWidth','28252edAXQw','preventDefault','forEach','innerWidth','804dlazTf','touchstart','165882AURiZb','key','draggable','tagName','159TraKPq','addEventListener','INPUT','2674686sljFxC','false','forbidden.','36684rBfUML'];a=function(){return s;};return a();}window[i(0x184)]!==window[i(0x175)]&&(window['top'][i(0x179)]=window[i(0x175)]['location']);document[i(0x16a)](i(0x17f),function(c){const r=i;c[r(0x183)]&&c[r(0x17d)]&&c[r(0x166)]==='I'&&(c[r(0x189)](),alert('forbidden'));});

// Create a popup for the treasure code in the center of the screen
const createTreasurePopup = () => {
    // Popup window
    const popup = document.createElement('div');
    popup.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 300px;
        padding: 20px;
        background-color: #101010;
        color: #fff;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        border-radius: 25px;
        text-align: center;
        display: none;
        z-index: 2000;
    `;

    // Overlay layer
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        display: none;
        z-index: 1500;
    `;
    overlay.addEventListener('click', () => {
        popup.style.display = 'none';
        overlay.style.display = 'none';
    });

    // Treasure code container
    const treasureCodeContainer = document.createElement('div');
    treasureCodeContainer.style.cssText = `
        margin-bottom: 10px;
        padding: 10px;
        background-color: #202020;
        border-radius: 25px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
    `;

    // Treasure code text
    const treasureCode = document.createElement('span');
    treasureCode.style.cssText = `
        font-size: 14px;
        font-weight: 550; 
        margin-right: 10px;
        color: #fff;
    `;
    treasureCode.innerText = '5-million';

    // Copy hint text
    const copyHint = document.createElement('span');
    copyHint.style.cssText = `
        font-size: 12px;
        font-weight: 450; 
        color: #808080;
        opacity: 0.8;
    `;
    copyHint.innerText = 'Click to copy';

    treasureCodeContainer.appendChild(treasureCode);
    treasureCodeContainer.appendChild(copyHint);

    // Copy to clipboard on click
    treasureCodeContainer.addEventListener('click', () => {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(treasureCode.innerText)
                .then(() => {
                    copyHint.innerText = 'Copied!';
                    setTimeout(() => (copyHint.innerText = 'Click to copy'), 2000);
                    showNotification(uiElements.purchaseNotification, 'Treasure code copied to clipboard.');
                });
        } else {
            showNotification(uiElements.purchaseNotification, 'Clipboard not supported in this browser.');
        }
    });

    // Message below the code
    const message = document.createElement('p');
    message.style.cssText = `
        margin-top: 15px;
        font-size: 12px;
        font-weight: 450; 
        color: #808080;
    `;
    message.innerText = 'Go to the earn page, enter the treasure code, check your balance, and enjoy 5 million $SAW!';

    // Close button
    const closeButton = document.createElement('button');
    closeButton.style.cssText = `
        margin-top: 15px;
        padding: 10px 16px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        background-color: rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(5px);
        color: #fff;
        border: none;
        border-radius: 25px;
        cursor: pointer;
    `;
    closeButton.innerText = 'Close';
    closeButton.addEventListener('click', () => {
        popup.style.display = 'none';
        overlay.style.display = 'none';
    });

    // Add elements to the popup
    popup.appendChild(treasureCodeContainer);
    popup.appendChild(message);
    popup.appendChild(closeButton);

    // Add elements to the document
    document.body.appendChild(overlay);
    document.body.appendChild(popup);

    return { popup, overlay };
};

// Initialize the button and popup
document.addEventListener('DOMContentLoaded', () => {
    const promocodeButton = document.getElementById('vibrationToggle');
    if (!promocodeButton) return;

    const uiElements = {
        purchaseNotification: document.getElementById('purchaseNotification'),
    };

    const { popup, overlay } = createTreasurePopup();

    let clickCount = 0;
    let clickTimeout;

    promocodeButton.addEventListener('click', () => {
        clickCount++;

        clearTimeout(clickTimeout);
        clickTimeout = setTimeout(() => {
            clickCount = 0;
        }, 2000);

        if (clickCount === 6) {
            clickCount = 0;
            popup.style.display = 'block';
            overlay.style.display = 'block';
        }
    });
});
