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

    const STEP_DELAY_MS = 2500;       // Time between moves during replay
    const START_DELAY_MS = 900;       // Wait after reset-to-start
    const END_PAUSE_MS = 10000;       // Pause at game end before restarting replay
    const REPLAY_WATCH_MS = 2500;     // Low-cost polling for game state changes

    let replaying = false;
    let stepTimer = null;
    let restartTimer = null;

    function clearTimer(timerId) {
        if (timerId !== null) {
            clearTimeout(timerId);
        }
    }

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
        clearTimer(stepTimer);
        clearTimer(restartTimer);

        stepTimer = null;
        restartTimer = null;
        replaying = false;
    }

    function scheduleRestartFromBeginning() {
        clearTimer(restartTimer);

        restartTimer = setTimeout(() => {
            restartTimer = null;

            if (gameLooksFinished()) {
                startReplay();
            } else {
                stopReplay();
            }
        }, END_PAUSE_MS);
    }

    function jumpToStart() {
        const controls = getReplayControls();
        if (controls && clickControl(controls.first)) {
            return;
        }

        pressKey("ArrowUp", 38);
    }

    function stepForward() {
        const controls = getReplayControls();
        if (controls && clickControl(controls.next)) {
            return;
        }

        pressKey("ArrowRight", 39);
    }

    function replayStep() {
        if (!replaying) return;

        if (!gameLooksFinished()) {
            stopReplay();
            return;
        }

        if (isAtLastMove()) {
            replaying = false;
            stepTimer = null;
            scheduleRestartFromBeginning();
            return;
        }

        stepForward();
        stepTimer = setTimeout(replayStep, STEP_DELAY_MS);
    }

    function startReplay() {
        if (replaying) return;
        if (!gameLooksFinished()) return;

        clearTimer(stepTimer);
        clearTimer(restartTimer);

        replaying = true;

        jumpToStart();
        stepTimer = setTimeout(replayStep, START_DELAY_MS);
    }

    function watchReplayState() {
        if (gameLooksFinished()) {
            startReplay();
        } else if (replaying || restartTimer !== null) {
            stopReplay();
        }
    }

    watchReplayState();
    setInterval(watchReplayState, REPLAY_WATCH_MS);
    window.addEventListener("hashchange", watchReplayState, { passive: true });

})();

(function () {
    "use strict";

    const DOCK_ID = "kiosk-round-dock";
    const FORCED_BOARD_THEME = "wood4";
    const MAINTENANCE_MS = 6000;

    const PRUNE_SELECTORS = [
        "#top",
        "header",
        "nav",
        ".site-title",
        ".site-nav",
        ".site-buttons",
        ".site-menu",
        ".ad",
        ".ads",
        ".tour__standing",
        ".streamer-box",
        ".tv-history",
        ".chat__members",
        ".mchat",
        ".round__underboard",
        ".round__underchat",
        ".analyse__underboard",
        ".analyse__round-training",
        ".analyse__controls",
        ".analyse__side"
    ];

    function findDirectChild(parent, selector) {
        return Array.from(parent.children).find(el => el.matches(selector)) || null;
    }

    function applyBoardTheme() {
        if (!document.body) return;

        if (document.body.dataset.board !== FORCED_BOARD_THEME) {
            document.body.dataset.board = FORCED_BOARD_THEME;
        }
    }

    function pruneHeavyDom() {
        for (const selector of PRUNE_SELECTORS) {
            document.querySelectorAll(selector).forEach(el => {
                if (el.id === DOCK_ID) return;
                if (!el.isConnected) return;
                el.remove();
            });
        }
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

    function runMaintenance() {
        applyBoardTheme();
        dockRoundWidgets();
        pruneHeavyDom();
    }

    runMaintenance();
    setInterval(runMaintenance, MAINTENANCE_MS);
    window.addEventListener("hashchange", runMaintenance, { passive: true });
    document.addEventListener("visibilitychange", () => {
        if (!document.hidden) runMaintenance();
    });
    document.addEventListener("DOMContentLoaded", runMaintenance, { once: true });
})();