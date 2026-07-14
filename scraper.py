# पुरानी पाइथन को हटाकर सीधे जावास्क्रिप्ट आधारित लोडर पेज बनाना
styled_html = """
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>VB-GRAM G LIVE DATA</title>
    <style>
        body { font-family: Arial, sans-serif; text-align: center; background-color: #f4f4f4; padding: 20px; }
        #loading { font-size: 18px; color: #666; margin-top: 50px; font-weight: bold; }
        iframe { width: 100%; height: 90vh; border: none; background: white; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
    </style>
</head>
<body>
    <div id="loading">सरकारी पोर्टल से लाइव डेटा सुरक्षित रूप से कनेक्ट किया जा रहा है, कृपया प्रतीक्षा करें...</div>
    
    <!-- यह लाइन सीधे आपके ब्राउज़र का उपयोग करके लाइव पेज को आपके सामने लोड कर देगी -->
    <iframe id="dataFrame" src="https://dord.gov.in" onload="document.getElementById('loading').style.display='none';"></iframe>

    <script>
        // हर 5 मिनट में डेटा को अपने आप रिफ्रेश करने के लिए
        setInterval(function() {
            document.getElementById('dataFrame').src = document.getElementById('dataFrame').src;
        }, 300000);
    </script>
</body>
</html>
"""

# हमेशा एक index.html फाइल बनाकर रखेगा ताकि गिटहब एरर न दे
with open("index.html", "w", encoding="utf-8") as f:
    f.write(styled_html)
print("Loader index.html successfully created!")
