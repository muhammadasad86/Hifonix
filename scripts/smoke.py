"""Milestone 1 browser test: exterior render, door hover/click entry, interior arrival, exit, reduced motion, mobile."""
import sys, time, json
from playwright.sync_api import sync_playwright

URL = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:5173/"
OUT = sys.argv[2] if len(sys.argv) > 2 else "."
ARGS = ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"]

def run(p, name, viewport, reduced=False, frames=(0.0, 1.2, 2.4, 3.4, 4.2, 5.4)):
    b = p.chromium.launch(args=ARGS)
    ctx = b.new_context(viewport=viewport, reduced_motion="reduce" if reduced else "no-preference", device_scale_factor=1)
    page = ctx.new_page()
    logs = []
    page.on("console", lambda m: logs.append(f"{m.type}: {m.text}") if m.type in ("error", "warning") else None)
    page.on("pageerror", lambda e: logs.append(f"pageerror: {e}"))
    page.goto(URL, wait_until="networkidle")
    page.wait_for_selector("canvas", timeout=30000)
    time.sleep(4)
    page.screenshot(path=f"{OUT}/{name}-0-exterior.png")
    if name == "desktop":
        # hover the doorway centre to verify hotspot
        vw, vh = viewport["width"], viewport["height"]
        page.mouse.move(vw * 0.5, vh * 0.66)
        time.sleep(1)
        page.screenshot(path=f"{OUT}/{name}-1-hover.png")
        hover = page.evaluate("window.__hifonix.getState().hoverEntrance")
        logs.append(f"info: hoverEntrance={hover}")
        page.mouse.click(vw * 0.5, vh * 0.66)
    else:
        page.click("button.enter")
    t0 = time.time()
    for i, t in enumerate(frames[1:], start=2):
        while time.time() - t0 < t:
            time.sleep(0.02)
        page.screenshot(path=f"{OUT}/{name}-{i}-t{t:.1f}.png")
    time.sleep(2)
    state = page.evaluate("JSON.stringify(window.__hifonix.getState())")
    page.screenshot(path=f"{OUT}/{name}-9-interior.png")
    fps = page.evaluate("""() => new Promise(r => { let n=0; const s=performance.now(); function f(){ n++; if(performance.now()-s<2000) requestAnimationFrame(f); else r(n/2);} requestAnimationFrame(f); })""")
    page.keyboard.press("Escape")
    time.sleep(5)
    back = page.evaluate("window.__hifonix.getState().phase")
    page.screenshot(path=f"{OUT}/{name}-10-after-exit.png")
    print(json.dumps({"run": name, "state": json.loads(state), "afterExit": back, "fps_swiftshader": fps, "logs": logs[:25]}, indent=1))
    b.close()

with sync_playwright() as p:
    which = sys.argv[3] if len(sys.argv) > 3 else "all"
    if which in ("all", "desktop"):
        run(p, "desktop", {"width": 1440, "height": 900})
    if which in ("all", "mobile"):
        run(p, "mobile", {"width": 390, "height": 844})
    if which in ("all", "reduced"):
        run(p, "reduced", {"width": 1280, "height": 800}, reduced=True, frames=(0, 0.3, 0.6, 1.0))
