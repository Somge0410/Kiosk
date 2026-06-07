// ==UserScript==
// @name         Lichess Kiosk Auto-Replay Lightweight
// @namespace    http://tampermonkey.net/
// @version      3.0
// @description  Replays finished Lichess TV games in a CPU-friendlier way
// @match        https://lichess.org/@/*/tv
// @grant        none
// ==/UserScript==

(function () {
    "use strict";

    const STEP_DELAY_MS = 2500;       // Time between moves
    const START_DELAY_MS = 1000;      // Wait after jumping to start
    const END_PAUSE_MS = 10000;       // Wait at end, then replay from start
    const DOM_SETTLE_MS = 250;        // Wait after key press before checking active move
    const CHECK_DEBOUNCE_MS = 2000;   // Avoid checking too often after DOM changes
    const SAFETY_CHECK_MS = 15000;    // Slow fallback check

    let replaying = false;
    let replayTimer = null;
    let restartTimer = null;
    let checkTimer = null;

    function pressKey(key, keyCode) {
        document.body.dispatchEvent(new KeyboardEvent("keydown", {
            key: key,
            code: key,
            keyCode: keyCode,
            which: keyCode,
            bubbles: true,
            cancelable: true
        }));
    }

    function clearTimer(timer) {
        if (timer !== null) {
            clearTimeout(timer);
        }
    }

    function gameLooksFinished() {
        return Boolean(document.querySelector(".result, .status"));
    }

    function isAtLastMove() {
        const moves = document.querySelectorAll("m");
        if (!moves.length) return false;

        const lastMove = moves[moves.length - 1];
        return lastMove.classList.contains("active");
    }

    function stopReplay() {
        clearTimer(replayTimer);
        clearTimer(restartTimer);

        replayTimer = null;
        restartTimer = null;
        replaying = false;
    }

    function scheduleRestartFromBeginning() {
        clearTimer(restartTimer);

        restartTimer = setTimeout(() => {
            restartTimer = null;

            // Only restart replay if the game is still finished.
            // If a new live game started meanwhile, do nothing.
            if (gameLooksFinished()) {
                startReplay();
            } else {
                stopReplay();
            }
        }, END_PAUSE_MS);
    }

    function replayStep() {
        if (!replaying) return;

        // A new live game probably started.
        if (!gameLooksFinished()) {
            stopReplay();
            return;
        }

        pressKey("ArrowRight", 39);

        replayTimer = setTimeout(() => {
            if (!replaying) return;

            if (!gameLooksFinished()) {
                stopReplay();
                return;
            }

            if (isAtLastMove()) {
                replaying = false;
                replayTimer = null;
                scheduleRestartFromBeginning();
                return;
            }

            replayTimer = setTimeout(replayStep, STEP_DELAY_MS);
        }, DOM_SETTLE_MS);
    }

    function startReplay() {
        if (replaying) return;
        if (!gameLooksFinished()) return;

        clearTimer(replayTimer);
        clearTimer(restartTimer);

        replaying = true;

        // Jump to beginning of the finished game.
        pressKey("ArrowUp", 38);

        replayTimer = setTimeout(replayStep, START_DELAY_MS);
    }

    function scheduleStatusCheck() {
        if (checkTimer !== null) return;

        checkTimer = setTimeout(() => {
            checkTimer = null;

            if (gameLooksFinished()) {
                startReplay();
            } else if (replaying || restartTimer !== null) {
                stopReplay();
            }
        }, CHECK_DEBOUNCE_MS);
    }

    // Prefer observing the main app area instead of the whole document body.
    const observerTarget =
        document.querySelector("main") ||
        document.querySelector(".round") ||
        document.body;

    const observer = new MutationObserver(scheduleStatusCheck);

    observer.observe(observerTarget, {
        childList: true,
        subtree: true
    });

    // Initial check.
    scheduleStatusCheck();

    // Very slow fallback in case Lichess changes without triggering our observer target.
    setInterval(scheduleStatusCheck, SAFETY_CHECK_MS);

})();

(function () {
    "use strict";

    const DOCK_ID = "kiosk-round-dock";

    function findDirectChild(parent, selector) {
        return Array.from(parent.children).find(el => el.matches(selector)) || null;
    }

    function ensureDock(side) {
        let dock = document.getElementById(DOCK_ID);

        if (!dock) {
            dock = document.createElement("div");
            dock.id = DOCK_ID;
        }

        if (dock.parentElement !== side) {
            side.appendChild(dock);
        }

        return dock;
    }

    function dockRoundWidgets() {
        const main = document.querySelector("main.round");
        if (!main) return;

        const side = findDirectChild(main, ".round__side");
        const app = findDirectChild(main, ".round__app");
        if (!side || !app) return;

        const dock = ensureDock(side);
        const gameMeta = side.querySelector(".game__meta");

        if (gameMeta && gameMeta.nextElementSibling !== dock) {
            side.insertBefore(dock, gameMeta.nextElementSibling);
        }

        const topClock = findDirectChild(app, ".rclock.rclock-top");
        const movePanel = findDirectChild(app, ".round__app__table");
        const topUser = findDirectChild(app, ".ruser-top");
        const moves = findDirectChild(app, "rm6");
        const bottomUser = findDirectChild(app, ".ruser-bottom");
        const bottomClock = findDirectChild(app, ".rclock.rclock-bottom");

        [topClock, topUser, movePanel, moves, bottomUser, bottomClock].forEach(el => {
            if (el && el.parentElement !== dock) {
                dock.appendChild(el);
            }
        });
    }

    let dockQueued = false;

    function scheduleDock() {
        if (dockQueued) return;
        dockQueued = true;

        requestAnimationFrame(() => {
            dockQueued = false;
            dockRoundWidgets();
        });
    }

    const dockObserver = new MutationObserver(scheduleDock);
    dockObserver.observe(document.body, {
        childList: true,
        subtree: true
    });

    scheduleDock();
    setInterval(scheduleDock, 2000);
})();

(function () {
    "use strict";

    const FORCED_BOARD_THEME = "wood4";
    const THEME_CHECK_MS = 2000;

    function applyBoardTheme() {
        if (!document.body) return;

        if (document.body.dataset.board !== FORCED_BOARD_THEME) {
            document.body.dataset.board = FORCED_BOARD_THEME;
        }
    }

    applyBoardTheme();
    setInterval(applyBoardTheme, THEME_CHECK_MS);
})();