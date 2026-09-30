import urllib.request
import re
import json

url = "https://campus-shield-command.base44.app/"
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    with urllib.request.urlopen(req) as resp:
        html = resp.read().decode('utf-8')
        print(f"HTML Length: {len(html)}")
        scripts = re.findall(r'src=["\']([^"\']+\.js)["\']', html)
        print("Scripts found:", scripts)
        # Find title, meta, any text
        titles = re.findall(r'<title>(.*?)</title>', html, re.IGNORECASE)
        print("Title:", titles)
        # If there are assets, let's inspect the main script
        for s in scripts:
            full_url = s if s.startswith('http') else "https://campus-shield-command.base44.app" + s
            print("Fetching script:", full_url)
            s_req = urllib.request.Request(full_url, headers={'User-Agent': 'Mozilla/5.0'})
            try:
                with urllib.request.urlopen(s_req) as s_resp:
                    content = s_resp.read().decode('utf-8')
                    print(f"Script {s} length: {len(content)}")
                    # Find notable strings like titles, tabs, pages, keywords
                    keywords = re.findall(r'["\']([A-Z][a-zA-Z0-9\s]{3,30})["\']', content)
                    interesting = [k for k in set(keywords) if any(w in k.lower() for w in ['incident', 'crowd', 'cctv', 'sos', 'dispatch', 'patrol', 'guard', 'alert', 'camera', 'officer', 'student', 'security', 'shield', 'command', 'map'])]
                    print("Notable keywords in script:", sorted(interesting)[:50])
            except Exception as e:
                print("Error fetching script:", e)
except Exception as e:
    print("Error fetching base44:", e)
