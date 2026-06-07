// ==UserScript==
// @name         Lichess Kiosk Auto-Replay (Optimized)
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  Automatically rewinds and replays the last game when offline (CPU friendly)
// @match        https://lichess.org/@/*/tv
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    let isReplaying = false;
    let replayInterval = null;

    const pressKey = (keyName, keyCode) => {
        document.body.dispatchEvent(new KeyboardEvent('keydown', {
            key: keyName, code: keyName, keyCode: keyCode, which: keyCode,
            bubbles: true, cancelable: true
        }));
    };

    const startReplay = () => {
        isReplaying = true;

        // Jump to start
        pressKey('ArrowUp', 38);

        // Give the board a moment to render the first move before starting the loop
        setTimeout(() => {
            replayInterval = setInterval(() => {

                // 1. Abort immediately if a new game started (result disappeared)
                if (!document.querySelector('.result') && !document.querySelector('.status')) {
                    stopReplay();
                    isReplaying = false;
                    return;
                }

                // 2. Advance the move
                pressKey('ArrowRight', 39);

                // 3. Check for the end of the game reliably
                // We use a small timeout to let the page update before we check the DOM
                setTimeout(() => {
                    const moves = document.querySelectorAll('m');
                    if (moves.length > 0) {
                        const lastMove = moves[moves.length - 1];

                        // If the very last move in the move-list has the active class, the game is over
                        if (lastMove.classList.contains('active')) {
                            stopReplay();

                            // Wait 5 seconds at the end of the game, then reset the flag
                            // so the MutationObserver can trigger the replay all over again.
                            setTimeout(() => { isReplaying = false; }, 5000);
                        }
                    }
                }, 250);

            }, 2500);
        }, 1000);
    };

    const stopReplay = () => {
        if (replayInterval) {
            clearInterval(replayInterval);
            replayInterval = null;
        }
    };

    // --- CPU OPTIMIZATION: Throttled MutationObserver ---
    let lastCheckTime = 0;

    const checkGameStatus = () => {
        const now = Date.now();
        // Throttle: Ignore all DOM changes unless 2 seconds have passed since the last check
        if (now - lastCheckTime < 2000) return;
        lastCheckTime = now;

        const isGameOver = document.querySelector('.result') || document.querySelector('.status');

        if (isGameOver && !isReplaying) {
            startReplay();
        } else if (!isGameOver && isReplaying) {
            stopReplay();
            isReplaying = false;
        }
    };

    // Listen to changes on the page to detect when a game ends
    const observer = new MutationObserver(checkGameStatus);
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // Run an initial check in case the script loads right as a game is already finished
    checkGameStatus();

})();
