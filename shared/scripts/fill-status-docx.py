#!/usr/bin/env python3
"""Fill the status Word template. Deletes only the instruction paragraph."""

import json
import re
import shutil
import struct
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TEMPLATE = ROOT / "Mẫu báo cáo - Hiện trạng website trước khi tối ưu.docx"
INSTRUCTION = '<w:p><w:pPr><w:spacing w:after="120" w:before="120"/></w:pPr>'


def xml_text(value):
    return str(value).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def replace_once(xml, old, new):
    new = xml_text(new)
    count = xml.count(old)
    if count != 1:
        raise SystemExit(f"expected 1 occurrence of {old[:80]!r}, found {count}")
    return xml.replace(old, new, 1)


def replace_image_note(xml, label, note):
    token = f"[Dán ảnh PageSpeed – {label}]"
    index = xml.find(token)
    if index < 0:
        raise SystemExit("missing " + token)
    start = xml.rfind("<w:r>", 0, index)
    end = xml.find("</w:r>", index) + len("</w:r>")
    block = xml[start:end].replace('<w:highlight w:val="yellow"/>', "").replace(token, xml_text(note))
    return xml[:start] + block + xml[end:]


# (text color, fill) of the Google Docs dropdown chips.
GOOD = ("d4edbc", "11734b")
WARN = ("473821", "ffe5a0")
BAD = ("ffcfc9", "b10202")


def set_dropdown(sdt, value, colors):
    if f'w:displayText="{value}"' not in sdt:
        raise SystemExit(f"{value!r} is not a dropdown option")
    sdt = re.sub(r'w:lastValue="[^"]*"', f'w:lastValue="{value}"', sdt, count=1)
    head, content = sdt.split("<w:sdtContent>", 1)
    content = re.sub(r'<w:color w:val="[^"]*"/>', f'<w:color w:val="{colors[0]}"/>', content, count=1)
    content = re.sub(r'<w:shd w:fill="[^"]*"', f'<w:shd w:fill="{colors[1]}"', content, count=1)
    content = re.sub(r"(<w:t[^>]*>)[^<]*(</w:t>)", lambda m: m.group(1) + value + m.group(2), content, count=1)
    return head + "<w:sdtContent>" + content


def set_ratings(xml, ratings):
    """ratings: 4 [status, verdict] pairs in row order Cache, Tốc độ load thực, Giật ảnh, Bên thứ 3."""
    sdts = list(re.finditer(r"<w:sdt>.*?</w:sdt>", xml, re.S))
    if len(ratings) != 4 or len(sdts) != 8:
        raise SystemExit("ratings needs 4 [status, verdict] pairs for the 8 dropdowns")
    parts, last = [], 0
    for i, m in enumerate(sdts):
        status, verdict = ratings[i // 2]
        if verdict not in ("ĐẠT", "KHÔNG ĐẠT"):
            raise SystemExit(f"verdict must be ĐẠT or KHÔNG ĐẠT, got {verdict!r}")
        if verdict == "KHÔNG ĐẠT":
            colors = BAD
        elif i % 2 == 0 and status == "Không đáng kể":
            colors = WARN
        else:
            colors = GOOD
        parts += [xml[last : m.start()], set_dropdown(m.group(0), status if i % 2 == 0 else verdict, colors)]
        last = m.end()
    return "".join(parts) + xml[last:]


PAGE_KEYS = ("page_name", "page_url", "psi_link", "load_desktop", "load_mobile", "psi_mobile", "psi_desktop", "ratings")
PAGE_MARKER = "[TÊN TRANG – vd: TRANG CHỦ]"
# Widest picture in the "BÁO CÁO" column, in EMU (3.9 inch).
MAX_IMAGE_EMU = int(3.9 * 914400)
IMAGE_REL = "http://schemas.openxmlformats.org/officeDocument/2006/relationships/image"


def png_size(path):
    head = path.read_bytes()[:24]
    if head[:8] != b"\x89PNG\r\n\x1a\n":
        raise SystemExit(f"{path} is not a PNG")
    return struct.unpack(">II", head[16:24])


def drawing(rid, doc_id, path):
    width, height = png_size(path)
    cx = min(MAX_IMAGE_EMU, width * 9525)
    cy = round(cx * height / width)
    name = xml_text(path.name)
    return (
        f'<w:drawing><wp:inline distB="0" distT="0" distL="0" distR="0"><wp:extent cx="{cx}" cy="{cy}"/>'
        f'<wp:docPr id="{doc_id}" name="{name}"/><a:graphic>'
        '<a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic>'
        f'<pic:nvPicPr><pic:cNvPr id="0" name="{name}"/><pic:cNvPicPr/></pic:nvPicPr>'
        f'<pic:blipFill><a:blip r:embed="{rid}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill>'
        f'<pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="{cx}" cy="{cy}"/></a:xfrm>'
        '<a:prstGeom prst="rect"/></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing>'
    )


def image_path(value, base):
    """A PSI cell value naming an existing .png is a screenshot; anything else is a text note."""
    if not str(value).lower().endswith(".png"):
        return None
    for path in (Path(value), base / value):
        if path.is_file():
            return path
    raise SystemExit(f"screenshot not found: {value}")


def replace_image(xml, label, value, base, media):
    path = image_path(value, base)
    if path is None:
        return replace_image_note(xml, label, value)
    token = f"[Dán ảnh PageSpeed – {label}]"
    index = xml.find(token)
    if index < 0:
        raise SystemExit("missing " + token)
    start = xml.rfind("<w:r>", 0, index)
    end = xml.find("</w:r>", index) + len("</w:r>")
    rid = f"rIdVnxPsi{len(media) + 1}"
    media.append((rid, path))
    return xml[:start] + "<w:r>" + drawing(rid, 1000 + len(media), path) + "</w:r>" + xml[end:]


def fill_page(table, page, base, media):
    pairs = [
        (PAGE_MARKER, page["page_name"]),
        ("[https://ten-mien.com/duong-dan/]", page["page_url"]),
        ("[link kết quả pagespeed.web.dev]", page["psi_link"]),
    ]
    for old, new in pairs:
        table = replace_once(table, old, new)
    table = table.replace(": [x.xx]s", ": " + xml_text(page["load_desktop"]), 1)
    table = table.replace(": [x.xx]s", ": " + xml_text(page["load_mobile"]), 1)
    if ": [x.xx]s" in table:
        raise SystemExit("load placeholders remain")
    table = replace_image(table, "Mobile", page["psi_mobile"], base, media)
    table = replace_image(table, "Desktop", page["psi_desktop"], base, media)
    if table.count("<w:sdt>") != 8 or table.count(">ĐẠT<") < 4:
        raise SystemExit("template controls changed")
    table = set_ratings(table, page["ratings"])
    if "Dán ảnh Network DevTools" not in table:
        raise SystemExit("network placeholder removed")
    return table


def note_paragraph(note):
    """Optional "Chú ý" line under a page table: the metrics that need no improvement."""
    if not note:
        return ""
    return (
        '<w:p><w:pPr><w:spacing w:before="120" w:after="200"/></w:pPr>'
        '<w:r><w:rPr><w:b/><w:i/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">Chú ý: </w:t></w:r>'
        f'<w:r><w:rPr><w:i/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">{xml_text(note)}</w:t></w:r></w:p>'
    )


def renumber_copy(table, n):
    """Second and later page tables: drop paragraph ids and give the dropdowns new ids."""
    table = re.sub(r' w14:(?:paraId|textId)="[^"]*"', "", table)
    ids = iter(range(900000 + n * 100, 900000 + n * 100 + 100))
    return re.sub(r'<w:id w:val="-?\d+"/>', lambda m: f'<w:id w:val="{next(ids)}"/>', table)


def add_media(work, media):
    if not media:
        return
    (work / "word" / "media").mkdir(exist_ok=True)
    rels_path = work / "word" / "_rels" / "document.xml.rels"
    rels = rels_path.read_text()
    for i, (rid, path) in enumerate(media, 1):
        target = f"media/vnx-psi-{i}.png"
        shutil.copyfile(path, work / "word" / target)
        rels = rels.replace(
            "</Relationships>", f'<Relationship Id="{rid}" Type="{IMAGE_REL}" Target="{target}"/></Relationships>', 1
        )
    rels_path.write_text(rels)
    types_path = work / "[Content_Types].xml"
    types = types_path.read_text()
    if 'Extension="png"' not in types:
        types = types.replace("<Default ", '<Default Extension="png" ContentType="image/png"/><Default ', 1)
        types_path.write_text(types)


def main():
    """values.json: domain, summary, issue, and either the page keys at the top level (one page)
    or "pages": a list of them, one table per URL. psi_mobile/psi_desktop: a .png screenshot
    (absolute or relative to values.json) or a text note. Optional "note" per page: the
    metrics that need no improvement, printed as a "Chú ý:" line under that page's table."""
    if len(sys.argv) != 3:
        raise SystemExit("usage: fill-status-docx.py values.json output.docx")
    values_path = Path(sys.argv[1])
    values = json.loads(values_path.read_text())
    pages = values.get("pages") or [{key: values[key] for key in (*PAGE_KEYS, "note") if key in values}]
    output = Path(sys.argv[2])
    with tempfile.TemporaryDirectory() as tmp:
        work = Path(tmp)
        subprocess.check_call(["unzip", "-q", str(TEMPLATE), "-d", str(work)])
        xml_path = work / "word" / "document.xml"
        xml = xml_path.read_text()
        pairs = [
            ("[ten-mien.com]", values["domain"]),
            (
                "[Nhận xét chung: website đã/chưa tối ưu, cache, điểm PageSpeed Mobile/Desktop hiện tại]",
                values["summary"],
            ),
            (
                "[Vấn đề chính cần khắc phục, vd: giật ảnh do tải chậm, script bên thứ 3 load chậm]",
                values["issue"],
            ),
        ]
        for old, new in pairs:
            xml = replace_once(xml, old, new)
        for old, new in values.get("extra", []):
            xml = replace_once(xml, old, new)
        start = xml.rfind("<w:tbl>", 0, xml.index(PAGE_MARKER))
        end = xml.index("</w:tbl>", start) + len("</w:tbl>")
        template_table = xml[start:end]
        if template_table.count("<w:tbl>") != 1:
            raise SystemExit("page table layout changed")
        media = []
        tables = []
        for n, page in enumerate(pages):
            table = template_table if n == 0 else renumber_copy(template_table, n)
            tables.append(fill_page(table, page, values_path.parent, media) + note_paragraph(page.get("note")))
        gap = '<w:p><w:pPr><w:spacing w:after="200"/></w:pPr></w:p>'
        xml = xml[:start] + gap.join(tables) + xml[end:]
        marker = xml.find(INSTRUCTION)
        if marker < 0 or "Hướng dẫn:" not in xml[marker : marker + 900]:
            raise SystemExit("instruction paragraph not found")
        end = xml.find("</w:p>", marker) + len("</w:p>")
        xml = xml[:marker] + xml[end:]
        xml_path.write_text(xml)
        add_media(work, media)
        if output.exists():
            output.unlink()
        subprocess.check_call(["zip", "-X", "-q", "-r", str(output.resolve()), "."], cwd=work)
    print(output)


if __name__ == "__main__":
    main()
