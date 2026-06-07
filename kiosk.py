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

# Extra CSS: hide heavy/nonessential UI parts and reduce animations
custom_css = custom_css = """
/* Remove top navigation */
#top,
.site-title,
.site-nav,
.site-buttons,
.site-menu,
header,
nav {
    display: none !important;
}

/* Remove some side/extra panels */
.round__underboard,
.underboard,
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

/* Remove page margins/padding */
html,
body {
    margin: 0 !important;
    padding: 0 !important;
    overflow: hidden !important;
}

/* Make the main Lichess area use the whole screen */
main,
.round {
    margin: 0 !important;
    padding: 0 !important;
    width: 100vw !important;
    max-width: none !important;
    height: 100vh !important;
}

/* Try to make the board as large as possible while keeping right panel */
.round {
    display: grid !important;
    grid-template-columns: 1fr min(88vh, 72vw) 350px 1fr !important;
    grid-template-rows: 100vh !important;
    column-gap: 12px !important;
    align-items: center !important;
}

/* Board area */
.round__app {
    grid-column: 2 !important;
    width: min(88vh, 72vw) !important;
    height: min(88vh, 72vw) !important;
    max-width: none !important;
    max-height: none !important;
}

/* Right panel: clocks / moves */
.round__side {
    grid-column: 3 !important;
    width: 350px !important;
    max-width: 350px !important;
    margin: 0 !important;
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
