import urllib.request
import re

url = "https://dord.gov.in"

headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
req = urllib.request.Request(url, headers=headers)

try:
    with urllib.request.urlopen(req) as response:
        html = response.read().decode('utf-8')
        
    table_match = re.search(r'<table[^>]*>([\s\S]*?)<\/table>', html, re.IGNORECASE)
    
    if table_match:
        table_content = table_match.group(1)
        
        # आपकी इमेज जैसा डिज़ाइन देने के लिए CSS स्टाइलिंग जोड़ना
        styled_html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta http-equiv="refresh" content="300">
            <style>
                body {{ font-family: Arial, sans-serif; text-align: center; background-color: #f4f4f4; }}
                table {{ margin: 20px auto; border-collapse: collapse; background: #fff; box-shadow: 0 0 10px rgba(0,0,0,0.1); }}
                tr:nth-child(1) {{ background-color: #000000 !important; color: #ffffff; font-size: 16px; font-weight: bold; }}
                tr:nth-child(2), tr:nth-child(3) {{ font-weight: bold; background: #ffffff; }}
                tr:nth-child(6) {{ background-color: #f3f3f3; font-weight: bold; }}
                td, th {{ border: 1px solid #cccccc; padding: 8px 12px; text-align: center; }}
                tr {{ background-color: #ffffff; }}
                /* Total और Dysfunctional लाइनों को रंगना */
                tr:has(td:first-child:contains("Total")), tr:has(td:first-child:contains("TOTAL")) {{ background-color: #cfe2f3 !important; font-weight: bold; }}
                tr:has(td:first-child:contains("DYSFUNCTIONAL")), tr:has(td:first-child:contains("Dysfunctional")) {{ background-color: #9fc5e8 !important; font-weight: bold; }}
            </style>
            <script>
                // पुराने ब्राउज़रों में रंग सेट करने के लिए जावास्क्रिप्ट सपोर्ट
                window.onload = function() {{
                    var rows = document.getElementsByTagName("tr");
                    for(var i=0; i<rows.length; i++) {{
                        var firstCell = rows[i].cells[0] ? rows[i].cells[0].innerText.toUpperCase() : "";
                        if(firstCell.indexOf("TOTAL") !== -1) rows[i].style.backgroundColor = "#cfe2f3";
                        if(firstCell.indexOf("DYSFUNCTIONAL") !== -1) rows[i].style.backgroundColor = "#9fc5e8";
                    }}
                }}
            </script>
        </head>
        <body>
            <table>{table_content}</table>
        </body>
        </html>
        """
        with open("index.html", "w", encoding="utf-8") as f:
            f.write(styled_html)
            
except Exception as e:
    print("Error:", e)
