#!/usr/bin/env python3
"""Delete the "[Dán ảnh Network DevTools …]" table rows from a Word report made by
shared/scripts/fill-status-docx.py (the user does not want them in the result report).
Usage: rm-network-rows.py "<file>.docx"
"""
import re
import shutil
import sys
import tempfile
import zipfile

path = sys.argv[1]
with zipfile.ZipFile(path) as z:
    xml = z.read('word/document.xml').decode('utf-8')
    rows = list(re.finditer(r'<w:tr[ >](?:(?!<w:tr[ >]).)*?</w:tr>', xml, re.S))
    kill = [m for m in rows if 'Dán ảnh Network DevTools' in m.group(0)]
    for m in reversed(kill):
        xml = xml[:m.start()] + xml[m.end():]
    tmp = tempfile.mktemp(suffix='.docx')
    with zipfile.ZipFile(tmp, 'w', zipfile.ZIP_DEFLATED) as out:
        for item in z.infolist():
            out.writestr(item, xml.encode('utf-8') if item.filename == 'word/document.xml' else z.read(item.filename))
shutil.move(tmp, path)
print('removed', len(kill), 'rows')
