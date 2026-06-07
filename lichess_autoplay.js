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

})();// ==UserScript==
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

})();import os

# Put environment options before importing GTK/WebKit
os.environ["WEBKIT_DISABLE_COMPOSITING_MODE"] = "1"
os.environ["WEBKIT_DISABLE_DMABUF_RENDERER"] = "1"

import gi
gi.require_version("Gtk", "3.0")
gi.require_version("WebKit2", "4.1")
from gi.repository import Gtk, WebKit2, GLib


URL = "https://lichess.org/@/AaronsEngine/tv"

with open("/home/aaron_elgin/Kiosk/lichess_autoplay.js", "r") as f:
    custom_js = f.read()

# Extra CSS: hide heavy/nonessential UI parts and reduce animations
custom_css = """
* {
    animation: none !important;
    transition: none !important;
    scroll-behavior: auto !important;
}

.site-title,
.site-buttons,
.lobby__app__content,
.chat__members,
.mchat,
#friend_box,
.site-buttons,
.dasher,
.notifications,
.streamer-box,
.underboard,
.round__underboard,
.tv-history,
.tour__standing,
.ad,
.ads {
    display: none !important;
}
"""

content_manager = WebKit2.UserContentManager.new()

user_script = WebKit2.UserScript.new(
    custom_js,
    WebKit2.UserContentInjectedFrames.ALL_FRAMES,
    WebKit2.UserScriptInjectionTime.END,
    None,
    None,
)
content_manager.add_script(user_script)

user_css = WebKit2.UserStyleSheet.new(
    custom_css,
    WebKit2.UserContentInjectedFrames.ALL_FRAMES,
    WebKit2.UserStyleLevel.USER,
    None,
    None,
)
content_manager.add_style_sheet(user_css)

web_view = WebKit2.WebView.new_with_user_content_manager(content_manager)

settings = web_view.get_settings()

# Keep JavaScript enabled because Lichess needs it
settings.set_enable_javascript(True)

# Disable things usually not needed for your kiosk
def try_set(name, value):
    setter = getattr(settings, name, None)
    if setter:
        try:
            setter(value)
        except Exception:
            pass

try_set("set_enable_plugins", False)
try_set("set_enable_developer_extras", False)
try_set("set_javascript_can_open_windows_automatically", False)
try_set("set_enable_smooth_scrolling", False)
try_set("set_enable_media_stream", False)
try_set("set_enable_webaudio", False)
try_set("set_enable_page_cache", False)
try_set("set_enable_offline_web_application_cache", False)
try_set("set_enable_html5_database", False)

# Do NOT disable JavaScript; Lichess will break.
# You can test this, but it may break piece/board rendering:
# settings.set_auto_load_images(False)

web_view.load_uri(URL)

window = Gtk.Window()
window.add(web_view)
window.fullscreen()
window.connect("destroy", Gtk.main_quit)
window.show_all()

Gtk.main()// ==UserScript==
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
    const START_DELAY_MS = 8000;      // Wait after jumping to start
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
    const START_DELAY_MS = 8000;      // Wait after jumping to start
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
    const START_DELAY_MS = 8000;      // Wait after jumping to start
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
(() => {
    const EDGE = 8;

    // Tune these for your screen.
    const SIDE_MIN = 300;
    const SIDE_MAX = 420;
    const SIDE_FRACTION = 0.28;

    const BOARD_SELECTORS = [
        ".main-board",
        ".analyse__board",
        ".cg-wrap",
        "cg-board"
    ];

    const PANEL_SELECTORS = [
        ".game__meta",
        ".round__meta",
        ".round__side",
        ".analyse__side",
        ".analyse__tools",
        ".tv-history"
    ];

    let scheduled = false;

    function isVisible(el) {
        if (!el || !el.isConnected) return false;
        const style = getComputedStyle(el);
        return style.display !== "none" && style.visibility !== "hidden";
    }

    function findBoardBox() {
        for (const selector of BOARD_SELECTORS) {
            const el = document.querySelector(selector);
            if (!el) continue;

            return (
                el.closest(".main-board") ||
                el.closest(".analyse__board") ||
                el.closest(".cg-wrap") ||
                el
            );
        }

        return null;
    }

    function setSizes() {
        const side = Math.round(
            Math.min(SIDE_MAX, Math.max(SIDE_MIN, window.innerWidth * SIDE_FRACTION))
        );

        const board = Math.floor(
            Math.min(
                window.innerHeight - EDGE * 2,
                window.innerWidth - side - EDGE * 3
            )
        );

        document.documentElement.style.setProperty("--kiosk-edge", `${EDGE}px`);
        document.documentElement.style.setProperty("--kiosk-side", `${side}px`);
        document.documentElement.style.setProperty("--kiosk-board-size", `${board}px`);
    }

    function topLevelOnly(elements) {
        const unique = Array.from(new Set(elements));

        return unique.filter(el => {
            return !unique.some(other => other !== el && other.contains(el));
        });
    }

    function applyLayoutNow() {
        scheduled = false;

        document.documentElement.classList.add("lichess-kiosk");
        setSizes();

        const boardBox = findBoardBox();
        if (!boardBox) return;

        document.querySelectorAll(".kiosk-board-box").forEach(el => {
            if (el !== boardBox) el.classList.remove("kiosk-board-box");
        });

        boardBox.classList.add("kiosk-board-box");

        let rightColumn = document.getElementById("kiosk-right-column");
        if (!rightColumn) {
            rightColumn = document.createElement("div");
            rightColumn.id = "kiosk-right-column";
            document.body.appendChild(rightColumn);
        }

        const rawPanels = [];

        for (const selector of PANEL_SELECTORS) {
            document.querySelectorAll(selector).forEach(el => rawPanels.push(el));
        }

        const panels = topLevelOnly(rawPanels).filter(el => {
            if (!isVisible(el)) return false;
            if (el === rightColumn) return false;
            if (el.contains(boardBox)) return false;
            if (boardBox.contains(el)) return false;
            return true;
        });

        panels.forEach(el => {
            el.classList.add("kiosk-panel");
            rightColumn.appendChild(el);
        });

        // Lichess/chessground often needs a resize event after forced board sizing.
        window.dispatchEvent(new Event("resize"));
    }

    function applyLayout() {
        if (scheduled) return;
        scheduled = true;
        requestAnimationFrame(applyLayoutNow);
    }

    window.addEventListener("resize", applyLayout);
    document.addEventListener("DOMContentLoaded", applyLayout);

    const observer = new MutationObserver(applyLayout);
    observer.observe(document.documentElement, {
        childList: true,
        subtree: true
    });

    applyLayout();
    setInterval(applyLayout, 2000);
})();// ==UserScript==
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
    const START_DELAY_MS = 8000;      // Wait after jumping to start
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