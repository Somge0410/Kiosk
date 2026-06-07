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
#top,
.site-title,
.site-nav,
.site-buttons,
.site-menu,
header,
nav,
.round__side,
.round__underboard,
.underboard,
.mchat,
.chat,
.crosstable,
.tv-history,
.ad,
.ads {
    display: none !important;
}

# html,
# body {
#     margin: 0 !important;
#     padding: 0 !important;
#     overflow: hidden !important;
# }

main,
.round {
    margin: 0 !important;
    padding: 0 !important;
    width: 100vw !important;
    height: 100vh !important;
    max-width: none !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
}

.round__app {
    width: min(96vw, 96vh) !important;
    height: min(96vw, 96vh) !important;
    max-width: none !important;
    max-height: none !important;
}

* {
    animation: none !important;
    transition: none !important;
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
