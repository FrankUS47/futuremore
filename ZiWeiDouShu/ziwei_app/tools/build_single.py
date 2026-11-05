#!/usr/bin/env python3
"""把整個專案合併成「單一 HTML 檔」(dist/ziwei_single.html):
CSS 與全部 JS 都內嵌,不需要網路、不需要其他檔案,可直接傳到手機用瀏覽器開啟。
用法:  python3 tools/build_single.py
"""
import re, pathlib, base64
root = pathlib.Path(__file__).resolve().parent.parent
html = (root / "index.html").read_text(encoding="utf-8")

def inline_css(m):
    return "<style>\n" + (root / m.group(1)).read_text(encoding="utf-8") + "\n</style>"
html = re.sub(r'<link rel="stylesheet" href="([^"]+)">', inline_css, html)

def inline_js(m):
    src = (root / m.group(1)).read_text(encoding="utf-8").replace("</script", "<\\/script")
    return "<script>\n" + src + "\n</script>"
html = re.sub(r'<script src="([^"]+)"></script>', inline_js, html)

# 單檔版不需要 manifest / 圖示連結;圖示改成內嵌
icon = base64.b64encode((root / "icons/apple-touch-icon.png").read_bytes()).decode()
html = re.sub(r'\s*<link rel="manifest"[^>]*>', "", html)
html = re.sub(r'<link rel="icon"[^>]*>', f'<link rel="icon" type="image/png" href="data:image/png;base64,{icon}">', html)
html = re.sub(r'<link rel="apple-touch-icon"[^>]*>', f'<link rel="apple-touch-icon" href="data:image/png;base64,{icon}">', html)

out = root / "dist"
out.mkdir(exist_ok=True)
(out / "ziwei_single.html").write_text(html, encoding="utf-8")
print("OK", out / "ziwei_single.html", f"{len(html)/1024:.0f} KB")
