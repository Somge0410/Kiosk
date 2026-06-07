import os

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

# Extra CSS: hide clutter and force a stable board + side layout.
custom_css = """
/* Remove top navigation and non-kiosk clutter. */
#top,
.site-title,
.site-nav,
.site-buttons,
.site-menu,
header,
nav,
.round__underboard,
.round__underchat,
.analyse__underboard,
.analyse__round-training,
.analyse__controls,
.analyse__side,
.chat__members,
.mchat,
.chat,
.crosstable,
.tv-history,
.ad,
.ads,
.tour__standing,
.streamer-box {
    display: none !important;
}

html,
body {
    margin: 0 !important;
    padding: 0 !important;
    overflow: hidden !important;
}

:root {
    --kiosk-edge: 6px;
    --kiosk-gap: 10px;
    --kiosk-side-min: 190px;
    --kiosk-board: min(
        calc(100vh - (var(--kiosk-edge) * 2)),
        calc(100vw - var(--kiosk-edge) - var(--kiosk-gap) - var(--kiosk-side-min))
    );
}

/* Apply one consistent two-column layout to both live and finished game pages. */
main.round,
main.analyse {
    margin: 0 !important;
    padding: var(--kiosk-edge) 0 var(--kiosk-edge) var(--kiosk-edge) !important;
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    width: 100vw !important;
    max-width: none !important;
    height: 100vh !important;
    box-sizing: border-box !important;
    display: grid !important;
    grid-template-columns: var(--kiosk-board) minmax(var(--kiosk-side-min), 1fr) !important;
    grid-template-rows: var(--kiosk-board) !important;
    column-gap: var(--kiosk-gap) !important;
    justify-content: start !important;
    align-content: start !important;
    align-items: start !important;
    overflow: hidden !important;
}

main.round > .round__app,
main.analyse > .analyse__board {
    grid-column: 1 !important;
    grid-row: 1 !important;
    justify-self: start !important;
    align-self: start !important;
    margin: 0 !important;
    width: var(--kiosk-board) !important;
    height: var(--kiosk-board) !important;
    min-width: 0 !important;
    min-height: 0 !important;
    max-width: none !important;
    max-height: none !important;
}

/* Live TV layout puts clocks/users/moves in a second column inside .round__app.
   Hide those inner widgets so the actual chessboard can use the full square. */
main.round > .round__app {
    display: block !important;
}

main.round > .round__app > .round__app__board.main-board {
    width: var(--kiosk-board) !important;
    height: var(--kiosk-board) !important;
    max-width: none !important;
    max-height: none !important;
    margin: 0 !important;
}

main.round > .round__app > :not(.round__app__board.main-board) {
    display: none !important;
}

main.round > .round__app > .round__app__board.main-board .cg-wrap,
main.round > .round__app > .round__app__board.main-board cg-board {
    width: 100% !important;
    height: 100% !important;
}

main.round > .round__side,
main.analyse > .analyse__tools {
    grid-column: 2 !important;
    grid-row: 1 !important;
    width: auto !important;
    min-width: var(--kiosk-side-min) !important;
    max-width: none !important;
    height: var(--kiosk-board) !important;
    max-height: var(--kiosk-board) !important;
    margin: 0 !important;
    overflow: auto !important;
}

main.round > .round__side > *,
main.analyse > .analyse__tools > * {
    width: 100% !important;
    box-sizing: border-box !important;
}

/* Reduce animations */
* {
    animation: none !important;
    transition: none !important;
    scroll-behavior: auto !important;
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

Gtk.main()
