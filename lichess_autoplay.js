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

    function isVisible(el) {
        if (!el || !el.isConnected) return false;

        const style = getComputedStyle(el);
        if (style.display === "none" || style.visibility === "hidden") return false;

        const rect = el.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
    }

    function getReplayControls() {
        const buttons = Array.from(document.querySelectorAll("button.fbt.repeatable"))
            .filter(isVisible);

        if (buttons.length < 4) return null;

        // Lichess order: first, prev, next, last
        return {
            first: buttons[0],
            prev: buttons[1],
            next: buttons[2],
            last: buttons[3]
        };
    }

    function clickControl(button) {
        if (!button || button.disabled) return false;

        const rect = button.getBoundingClientRect();
        const clientX = Math.round(rect.left + rect.width / 2);
        const clientY = Math.round(rect.top + rect.height / 2);

        const pointerInit = {
            bubbles: true,
            cancelable: true,
            composed: true,
            pointerId: 1,
            pointerType: "mouse",
            isPrimary: true,
            button: 0,
            buttons: 1,
            clientX,
            clientY
        };

        const mouseDownInit = {
            bubbles: true,
            cancelable: true,
            button: 0,
            buttons: 1,
            clientX,
            clientY
        };

        const mouseUpInit = {
            bubbles: true,
            cancelable: true,
            button: 0,
            buttons: 0,
            clientX,
            clientY
        };

        try {
            if (typeof PointerEvent === "function") {
                button.dispatchEvent(new PointerEvent("pointerdown", pointerInit));
            }

            button.dispatchEvent(new MouseEvent("mousedown", mouseDownInit));
            button.dispatchEvent(new MouseEvent("mouseup", mouseUpInit));
            button.dispatchEvent(new MouseEvent("click", mouseUpInit));

            if (typeof PointerEvent === "function") {
                button.dispatchEvent(new PointerEvent("pointerup", {
                    ...pointerInit,
                    buttons: 0
                }));
            }
        } catch (_) {
            return false;
        }

        return true;
    }

    function pressKey(key, keyCode) {
        const eventInit = {
            key: key,
            code: key,
            keyCode: keyCode,
            which: keyCode,
            bubbles: true,
            cancelable: true
        };

        const targets = [
            document.activeElement,
            document.body,
            document,
            window
        ];

        for (const target of targets) {
            if (!target || typeof target.dispatchEvent !== "function") continue;

            target.dispatchEvent(new KeyboardEvent("keydown", eventInit));
        }
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
        const controls = getReplayControls();
        if (controls) {
            return controls.next.disabled;
        }

        const moves = document.querySelectorAll("m, move, rm6 kwdb");
        if (!moves.length) return false;

        const activeMove =
            document.querySelector("m.active") ||
            document.querySelector("move.active") ||
            document.querySelector("rm6 kwdb.a1t");

        if (!activeMove) return false;

        return activeMove === moves[moves.length - 1];
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

        const controls = getReplayControls();

        if (controls) {
            if (controls.next.disabled) {
                replaying = false;
                replayTimer = null;
                scheduleRestartFromBeginning();
                return;
            }

            clickControl(controls.next);
            replayTimer = setTimeout(replayStep, STEP_DELAY_MS);
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
        const controls = getReplayControls();
        if (!controls || !clickControl(controls.first)) {
            pressKey("ArrowUp", 38);
        }

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