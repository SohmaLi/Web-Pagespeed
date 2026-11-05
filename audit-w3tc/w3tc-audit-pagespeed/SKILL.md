---
name: w3tc-audit-pagespeed
description: >-
  Phase 1 cho site W3 Total Cache chạy plugin Vietnix Pagespeed PUB: đo PSI 5 lần,
  đo tải thật, đọc audit, đánh giá 6 thông số, lập báo cáo hiện trạng và bảng
  phương án `proposed` bằng tool `w3tc_*`. Dùng khi người dùng gửi link site W3TC
  cần khảo sát hoặc tối ưu.
---

# Khảo sát PageSpeed — site W3 Total Cache

Skill này dùng tên tool W3TC từ đầu tới cuối. Không gọi tool LiteSpeed (`vnx_get_status`, `vnx_analyze_pagespeed`, `vnx_resolve_url`, `vnx_test_selector`, `vnx_set_options`, `vnx_critical_crawler`, `vnx_read_litespeed_conf`, `litespeed_purge`). Gọi nhầm thì plugin trả `tool_not_in_mode`.

| Việc | Tool |
| --- | --- |
| Trạng thái plugin + W3TC | `w3tc_get_status` |
| Cài đặt W3TC (chỉ đọc) | `w3tc_read_conf` |
| Option plugin | `w3tc_list_options` |
| Các bước tối ưu quanh W3TC | `w3tc_list_pipeline` |
| PSI mobile + desktop, kèm `rows` đề xuất | `w3tc_analyze_pagespeed` |
| `type` / `source_id`, dòng đang khớp, option "for Client" | `w3tc_resolve_url` |
| Đếm selector trên HTML khách nhận | `w3tc_test_selector` |
| File cache desktop/mobile của 1 URL | `w3tc_cache_state` |
| Dòng VPI / lazyload HTML / Critical CSS | `vnx_list_rows` (dùng chung) |

Script dùng chung trong `shared/scripts/`: `psi-rounds.sh`, `psi-api.sh` (PSI, key trong `shared/.env`), `mcp-call.py` (gọi MCP bằng JSON-RPC), `rm-network-rows.py`, `measure-run.js`, `fill-status-docx.py`. Quy trình, tiêu chí và cách lập báo cáo chung: `shared/README.md`.

## Bước 0 — chuẩn bị

1. Điền `audit-w3tc/Do.md`: tên miền, trường hợp (1 = chỉ khảo sát, 2 = khảo sát rồi tối ưu), bảng link, cột **Tối ưu** (`có` cho trang được tối ưu).
2. `w3tc_get_status` một lần. So host `site_url` với miền trong `Do.md`, phải trùng **đúng** (không khớp theo đuôi). Khác host thì không gọi tool nào khác của MCP; đo bằng PSI API (`shared/scripts/psi-rounds.sh`) và báo người dùng nối MCP đúng miền.
3. Đọc trong `w3tc_get_status`: `plugin_active`, `mcp_enabled`, `status`, `pipeline_runs`, `warnings`, `w3tc.page_cache`, `w3tc.engine`, `mobile_split`, `pagespeed_api_key_header`. Mã cảnh báo và cách xử lý ở `audit-w3tc/README.md` mục **Cảnh báo cài đặt W3TC**.
4. `w3tc_read_conf`, so với bảng **Cài đặt W3TC nên dùng** trong README. Mục lệch ghi vào báo cáo, trạng thái `suggestion` (người dùng tự đổi trong W3TC; agent không ghi được cài đặt W3TC).
5. `w3tc_resolve_url` cho từng link: ghi `type` / `source_id` vào `Do.md`, dòng đang khớp, các option "for Client".
6. `w3tc_list_options` và `vnx_list_rows` (3 bảng): ghi bảng **Cấu hình đã có**. Trường hợp 2: mỗi option và dòng cũ kết luận `giữ` / `thay` / `gỡ`.
7. Trường hợp 2, chỉ dùng báo cáo cũ có thư mục trùng đúng tên miền. Số so sánh chỉ lấy trong thư mục của lần chạy này, cùng URL, cùng thiết bị, cùng nguồn đo.
8. Kiểm tra cache cũ: trang có dòng vừa bị xóa mà chưa purge thì HTML cache còn cấu hình cũ. So HTML đang cache với `?nc=<số>` trước khi lấy mốc.

## Bước 1 — đo

- **PSI:** 5 lần mỗi link, mobile và desktop. Dùng `w3tc_analyze_pagespeed` (mỗi URL một lần gọi), hoặc chạy nhanh:
  ```bash
  shared/scripts/psi-rounds.sh <scratch>/psi-<tên> 5 <url1> <url2> …
  ```
  Script tự đo mobile và desktop song song, cùng URL cách nhau ≥ 82 giây (gọi sát nhau PSI trả cùng kết quả), in mỗi lần một dòng: điểm, FCP, LCP, TBT, CLS, SI. JSON giữ để đọc audit.
- **Tải thật:** theo skill `w3tc-measure-page-load`, 3 lần mỗi link.
- **pagespeed.web.dev:** chụp tối đa 1 lần mỗi trang cho báo cáo Word, chỉ để minh họa. Kết luận theo 5 lần PSI.
- Loại lần đo lỗi (timeout, `FAILED_DOCUMENT_REQUEST`, HTML tải > 1 s do mạng PSI, ảnh LCP không tải), ghi lý do.

## Bước 2 — đọc audit

Từ JSON PSI và `rows` của `w3tc_analyze_pagespeed`, với mỗi audit điểm < 0,9 ghi: mã, số, nguyên nhân (file, phần tử, kích thước), thông số bị ảnh hưởng.

Kiểm tra thêm bằng curl HTML (UA desktop và UA mobile Moto G Power), không dùng trình duyệt để chẩn đoán:

- Ảnh LCP: thẻ `img` hay ảnh nền CSS; có `loading="lazy"`, `src` SVG giữ chỗ (lazyload của builder), `srcset` trỏ file gốc lớn không.
- CSS chặn hiển thị: số file `<link rel="stylesheet">`, Google Fonts.
- JS: script đồng bộ, thư viện bên thứ 3, YouTube, Maps, chat, quảng cáo.
- CLS: phần tử dịch chuyển trong `layout-shifts`; CSS của page builder in cuối `<body>` (Bricks: CSS loading method = inline), thanh chèn bằng JS, ảnh thiếu `width`/`height`.
- Selector ảnh: thử bằng `w3tc_test_selector` cho `mobile` và `desktop` (`count`, `hidden`, `above_fold`).

## Bước 3 — đánh giá 6 thông số

| Thông số | Đạt khi |
| --- | --- |
| PSI mobile | **Mọi lần** trong 5 lần ≥ 90 |
| PSI desktop | **Mọi lần** trong 5 lần ≥ 90 |
| Tốc độ load thật | Load Desktop ≤ 2 s, Mobile ≤ 3 s (trung vị 3 lần) |
| Cache | Page Cache W3TC bật, Disk: Enhanced, tách `phones` |
| Giật ảnh | Ảnh màn hình đầu không bị tải chậm, không ô trống; CLS ≤ 0,25 |
| Bên thứ 3 | Script / tài nguyên ngoài không làm chậm đáng kể |

- Trang đạt cả 6: kết luận **Không cần tối ưu**, mọi dòng `theo dõi`.
- Trang chưa đạt: chỉ đề xuất cho thông số chưa đạt. Dưới bảng ghi "Chú ý: … đã đạt, không cần cải thiện".

## Bước 4 — bảng phương án

Mỗi dòng: `#`, thao tác (tool), áp cho (trang / toàn site), giá trị dự kiến, lý do, thông số, trạng thái (`proposed`, `theo dõi`, `ngoài phạm vi`, `suggestion`). Ghi rõ rủi ro trước khi ghi.

| Dấu hiệu | Phương án trên W3TC |
| --- | --- |
| CSS chặn hiển thị | Critical CSS (`w3tc_critical_crawler` → `vnx_save_critical_css`) + Delay CSS (`LS_delay_combined_css` + `_client`). Chỉ delay trang đã có Critical CSS |
| Ảnh LCP / màn hình đầu quá lớn | VPI (`vnx_save_vpi`) `(replace [sz-…-sz] keep)`, size theo bề rộng hiển thị × DPR. Ảnh LCP ở dòng cuối |
| Ảnh nền LCP trong file CSS | Dòng URL trong VPI (đổi trong Critical CSS). Sửa tận gốc: chọn size nhỏ trong builder (đề xuất A) |
| Ảnh dưới màn hình đầu quá lớn | VPI có `lazy`: `(replace [sz-…-sz] keep lazy)` |
| Ảnh màn hình đầu bị builder lazyload (`src` SVG) | VPI cho ảnh đó; tắt lazyload trong builder (đề xuất A) |
| TBT cao do script có file | `delay_js` + `delay_js_client`, keyword tên file trong `delay_js_list`. `jquery`, `wp-includes` cần người dùng duyệt riêng (`approve_core_keywords`) |
| TBT do script inline không tên, code trang nặng (biểu đồ, vòng lặp) | `ngoài phạm vi`: đề xuất A sửa trên trang |
| DOM lớn dưới màn hình đầu | Lazyload HTML (`vnx_save_lazyload_html` + `lazyload_html` + `_client`). Thử kỹ: có thể làm Lighthouse đo CLS cao |
| CLS do builder in CSS cuối `<body>` | `ngoài phạm vi`: đổi cách nạp CSS của builder (Bricks: External files) |
| Ảnh thiếu `width`/`height`, chưa nén / WebP, font nhiều độ đậm, thư viện thừa, YouTube/Maps không facade | `ngoài phạm vi`: đề xuất A |
| Cài đặt W3TC lệch (Lazy Load bật, chưa tách mobile, cache query string…) | `suggestion` cho người dùng |
| TTFB cao | `ngoài phạm vi` (máy chủ). Page Cache W3TC phải hit |

Mọi tính năng trên W3TC cần `active_all` + option + khóa `_client` (README mục **Không có Guest Mode**). Option là toàn site: ghi rõ trang nào thực sự bị đổi.

## Bước 5 — báo cáo

Thư mục `audit-w3tc/reports/YYYY-MM-DD-ten-mien/`. Một miền một thư mục trong ngày; kiểm tra lại cùng ngày thì ghi thêm mục vào file cũ.

- `YYYY-MM-DD-ten-mien.md`: bảng thông tin (trường hợp, plugin, MCP, W3TC, theme/builder, nguồn đo, trạng thái plugin lúc đo), **Tóm tắt** (bảng link: PSI mobile, PSI desktop, Load D/M, kết luận), **Ghi chú về các lần đo PSI**, từng trang (**Đo**, **Audit**, **Đánh giá thông số**), **Phương án đề xuất**, **Ngoài phạm vi plugin**, **Cấu hình đã có**.
- `Báo cáo - Hiện trạng website trước khi tối ưu - <miền>.docx`: tạo bằng `fill-status-docx.py` (mục **Báo cáo** trong README). Tốc độ load chỉ ghi mốc Load. Trang không chụp được pagespeed.web.dev thì ô ảnh ghi chữ.
- `assets/`: ảnh pagespeed.web.dev, ảnh tải thật.

Không gọi `vnx_save_report`. Không ghi option ở Phase 1.

**Trường hợp 1:** trình tóm tắt và kết thúc.
**Trường hợp 2:** trình tóm tắt từng link, bảng **Cấu hình đã có** và bảng `proposed`; hỏi link nào tối ưu, dòng nào duyệt. Dừng chờ người dùng, rồi sang skill `w3tc-apply-pagespeed`.

## Không làm

- Không dùng trình duyệt để chẩn đoán hay tự viết CSS. Trình duyệt chỉ để chạy crawler Critical CSS của plugin, chụp ảnh và làm báo cáo. Chẩn đoán bằng MCP, curl, PSI API.
- Không in token MCP, API key, mật khẩu WordPress ra màn hình hay file.
- Không sửa plugin trong lúc khảo sát.
