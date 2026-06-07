import gi
gi.require_version('Gtk', '3.0')
# If you installed the 4.0 package in the previous step, change the line below to '4.0'
gi.require_version('WebKit2', '4.1') 
from gi.repository import Gtk, WebKit2

# 1. Read your optimized JavaScript file
with open("/home/aaron_elgin/Kiosk/lichess_autoplay.js", "r") as f:
    custom_js = f.read()

# 2. Create the UserScript object
# InjectionTime.END ensures your MutationObserver only starts after the DOM exists
user_script = WebKit2.UserScript.new(
    custom_js,
    WebKit2.UserContentInjectedFrames.ALL_FRAMES,
    WebKit2.UserScriptInjectionTime.END,
    None, None
)

# 3. Add the script to the web view's content manager
content_manager = WebKit2.UserContentManager.new()
content_manager.add_script(user_script)

# 4. Create the WebView and load Lichess
web_view = WebKit2.WebView.new_with_user_content_manager(content_manager)
web_view.load_uri("https://lichess.org/@/AaronsEngine/tv")

# 5. Create a fullscreen window to hold the browser
window = Gtk.Window()
window.add(web_view)
window.fullscreen()
window.connect("destroy", Gtk.main_quit)
window.show_all()

Gtk.main()
