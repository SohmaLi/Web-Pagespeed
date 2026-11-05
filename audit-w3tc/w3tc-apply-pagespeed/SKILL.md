---
name: w3tc-apply-pagespeed
description: >-
  Phase 2 cho site W3 Total Cache chạy Vietnix Pagespeed PUB: ghi phương án đã
  duyệt (Critical CSS, Delay CSS, VPI, Delay JS, lazyload HTML) bằng tool `w3tc_*`
  và `vnx_save_*`, dry-run trước, purge đúng URL, đo lại 5 lần, nghiệm thu, báo
  cáo kết quả và đề xuất bổ sung. Dùng sau khi người dùng duyệt bảng `proposed`.
---

# Tối ưu PageSpeed — site W3 Total Cache

Chỉ chạy ở trường hợp 2, khi `w3tc_get_status` cho `site_url` trùng đúng miền trong `audit-w3tc/Do.md`, trên link cột **Tối ưu** là `có`, và chỉ dòng `proposed` người dùng đã duyệt. Mỗi thay đổi gắn với một thông số chưa đạt.

| Việc | Tool |
| --- | --- |
| Ghi option plugin | `w3tc_set_options` (`approve_core_keywords` khi có `jquery` / `wp-includes`) |
| Cào Critical CSS | `w3tc_critical_crawler` (trả script + `crawl_url`) |
| Lưu Critical CSS / VPI / lazyload HTML | `vnx_save_critical_css`, `vnx_save_vpi`, `vnx_save_lazyload_html` |
| Gỡ dòng | `vnx_remove_row` (Critical CSS: `id` gỡ 1 thiết bị; `type` + `source_id` + `mobile` gỡ 1 thiết bị; chỉ `type` + `source_id` gỡ cả trang) |
| Khôi phục option lần ghi gần nhất | `vnx_rollback_options` |
| Purge | `w3tc_purge` (1 URL, cùng host, đã dùng trong phiên) |
| Kiểm tra | `w3tc_resolve_url`, `w3tc_test_selector`, `w3tc_cache_state`, `vnx_list_rows`, curl HTML |

## Quy tắc ghi

1. **Sao lưu** trước mọi thay đổi: `~/Documents/pagespeed/backup/<ngày>-<việc>/` (nội dung dòng sắp thay, file báo cáo sắp sửa).
2. Trước lần ghi đầu: lưu `cau-hinh-truoc-toi-uu.json` trong thư mục báo cáo (`w3tc_list_options` + `vnx_list_rows` 3 bảng, Critical CSS có nội dung). Không ghi đè ở vòng sau.
3. Mọi tool ghi: `dry_run: true` trước, trình diff, chờ người dùng duyệt, rồi `dry_run: false`. Dry-run phải khớp đúng việc đã duyệt (`replaces_ids`, `action`, `rows`).
4. Công tắc bật là `"1"`, tắt là `""`. `mobile` của Critical CSS là chuỗi `"true"` / `"false"`.
5. Sau mỗi lần ghi: `w3tc_purge` từng URL bị ảnh hưởng (dry-run trước nếu chưa chắc) → mở lại / curl để W3TC dựng cache → kiểm tra HTML desktop và mobile.
6. Người dùng thao tác trong admin giữa chừng (lưu option, bấm "Craw" Critical CSS): gọi lại `w3tc_list_options` và `vnx_list_rows` trước khi đo. Lưu từ admin có thể ghi lại dòng đã cố ý gỡ. Trước khi khôi phục bản sao lưu, giữ lại thay đổi của chính người dùng.
7. Gửi CSS lớn: dùng `shared/scripts/mcp-call.py vnx_save_critical_css '<json>' <file.css>` để gửi nguyên file, không chép tay vào chat.

## Thứ tự cho mỗi trang

Chỉ làm bước gắn với thông số chưa đạt. Đo lại sau mỗi nhóm thay đổi trước khi làm tiếp.

1. **Công tắc:** `active_all` đang tắt thì báo người dùng (bật là áp mọi option đã lưu cho toàn site), chỉ bật khi duyệt. Tính năng nào dùng thì bật **cả cặp** option + `_client`; không dùng thì tắt cả cặp. Không bật hết.
2. **Critical CSS** (CSS chặn hiển thị):
   - `w3tc_critical_crawler` cho `mobile` và `desktop` (mobile cần W3TC đã tách `phones`). Mở `crawl_url` trong phiên Chrome mới với đúng viewport + UA tool trả, chạy script **một lần**, lưu kết quả ra `critical-css/<trang>-<thiết bị>.css` **nguyên văn**.
   - Không sửa CSS, không tự viết CSS bổ sung (`critical_added*`, `additional_css`). Thiếu rule thì cào lại với tham số `additional` / `exclude` của crawler.
   - Không dùng nút "Craw Desktop / Craw Mobile" trong admin: thiếu rule selector có `[...]`, `(...)` (đã gây CLS 0,11–0,34).
   - Kiểm tra trước khi lưu: `url()` trong CSS là đường dẫn tuyệt đối và trả 200 (curl); thử dựng trang chỉ với Critical CSS trong cùng phiên crawler (tắt mọi `<link rel="stylesheet">`, chèn CSS, so vị trí phần tử màn hình đầu với bản đầy đủ), chỉ khi CSS mới khác bản đã thử.
   - `vnx_save_critical_css` (dry-run → duyệt → ghi), bật `vnx_critical_client`, `LS_delay_combined_css` + `LS_delay_combined_css_client`, purge.
   - Trang có font Google: chữ hiện font dự phòng rồi đổi, có thể gây CLS nhỏ hoặc đổi LCP. Trang đạt tốt không cần Critical CSS desktop thì không thêm (từng làm CLS desktop 0,687 do đổi font).
3. **Ảnh** (VPI): `vietnix_vpi_active` + `vietnix_vpi_active_client`, `vpi_replace_size_client` bật.
   - Mỗi `type` + `source_id` một dòng VPI; đã có thì sửa bằng `id`.
   - `w3tc_test_selector` cả 2 thiết bị: `count` đúng, `hidden` 0. Ảnh màn hình đầu không `lazy`; ảnh dưới màn hình đầu thêm `lazy`; ảnh LCP dòng cuối.
   - Ảnh nền trong CSS: dòng URL ảnh ở cuối cột. Chỉ đổi trong Critical CSS; sau khi CSS đầy đủ nạp ảnh nền về bản gốc.
   - Cú pháp và tên size: README mục **Dòng VPI**. Size phải có sẵn trong Thư viện Media.
4. **JS** (TBT, `bootup-time`): `delay_js` + `delay_js_client`, keyword tên file trong `delay_js_list`. Script inline cần keyword có trong nội dung (plugin so `outerHTML`).
   - Delay script theo thứ tự (plugin chờ script trước nạp xong). Delay thư viện mà script khác phụ thuộc (jQuery, Swiper) phải thử trên bản sao HTML ở máy trước: lỗi `undefined` nghĩa là thứ tự sai.
   - Mốc tự nạp tối đa 10 s. Không tăng: dễ delay luôn script quảng cáo. Trace Lighthouse dài hơn 10 s sẽ bắt được JS đã delay (TBT tăng): giải quyết tận gốc ở trang (đề xuất A).
   - Script page builder có hiệu ứng xuất hiện (Elementor `elementor-invisible`): delay JS đó làm phần tử bị ẩn tới khi tương tác. Kiểm tra khối đầu trang trước khi kết luận.
5. **HTML** (DOM lớn): `vnx_save_lazyload_html` cho khối dưới màn hình đầu, không header/hero; `lazyload_html` + `_client`. Đo kỹ CLS trên PSI.
6. **Site health** sau mỗi nhóm thay đổi: Chrome phiên mới, mobile và desktop, **không tương tác**, chờ quá mốc delay (≥ 11 s khi có delay JS): giao diện đầy đủ, CSS delay đã nạp (`vnx-css-delayed="2"`), Critical CSS tắt (`media="null"`), ảnh màn hình đầu đúng, script chạy, không lỗi console, không phần tử bị ẩn. Chụp ảnh lưu `assets/`.

## Đo lại và nghiệm thu

- PSI 5 lần mỗi trang đã đổi: `shared/scripts/psi-rounds.sh <scratch>/<tên> 5 <url…>`. Tải thật 3 lần (skill `w3tc-measure-page-load`).
- **Đạt khi mọi lần ≥ 90** ở cả 2 thiết bị, không chỉ trung vị. Lần thấp: đọc JSON (HTML tải bao lâu, ảnh LCP tải bao lâu, `layout-shifts`, `bootup-time`) để tách lỗi trang với dao động mạng PSI; ghi rõ bằng số.
- Tệ hơn mốc "trước" quá ngưỡng nhiễu: `vnx_rollback_options` (option) hoặc `vnx_remove_row` (dòng), dry-run trước, purge. Quay về hẳn trước tối ưu: `cau-hinh-truoc-toi-uu.json`.
- Chưa đạt mà còn việc plugin làm được: đề xuất dòng mới, hỏi người dùng, làm thêm vòng. Hết việc plugin làm được: ghi lý do vào đề xuất bổ sung.

## Báo cáo kết quả

Cùng thư mục `reports/YYYY-MM-DD-ten-mien/`:

1. File `.md`: nhật ký mỗi lần ghi (giá trị cũ → mới, `id`, kết quả HTML, site health), các bảng đo, mục **Kết quả sau tối ưu** (bảng trước → sau: PSI mobile/desktop trung vị và thấp nhất, Load D/M, kết luận), **Dòng và option đã áp** (`applied` / `skipped` / `rolled back`), cấu hình đang chạy so với `cau-hinh-truoc-toi-uu.json`.
2. `Báo cáo - Kết quả sau tối ưu - <miền>.docx`: `fill-status-docx.py` với `extra` đổi tiêu đề ("BÁO CÁO HIỆN TRẠNG WEBSITE TRƯỚC KHI TỐI ƯU" → "BÁO CÁO KẾT QUẢ SAU TỐI ƯU", "TỐI ƯU DỰ KIẾN" → "ĐÃ TỐI ƯU"). Ghi chú mỗi trang nêu trung vị và đủ 5 lần. Rồi `shared/scripts/rm-network-rows.py "<file>.docx"`.
3. `Đề xuất bổ sung - <miền>.md`: A (người dùng / người làm web), B (AI làm khi được duyệt), C (không đề xuất), mỗi mục có căn cứ bằng số.
4. Ảnh pagespeed.web.dev chụp sau khi 5 lần đều đạt; ảnh tải thật, site health trong `assets/`.

AI kết thúc ở báo cáo kết quả. Không gọi `vnx_save_report`.

## Mã lỗi thường gặp

| Mã | Xử lý |
| --- | --- |
| `tool_not_in_mode` | Dùng tên tool trong trường `use` (tool `w3tc_*`) |
| `w3tc_conf_forbidden` | Không ghi được cài đặt W3TC; ghi vào `suggestion` |
| `w3tc_mobile_off` | Người dùng bật User Agent Groups `phones` trước khi làm phần mobile |
| `cache_conflict` | Site có hơn một plugin cache; người dùng tắt bớt |
| `keyword_not_approved` | Hỏi người dùng duyệt đúng keyword, gọi lại với `approve_core_keywords: true` |
| `url_not_in_session` / `url_forbidden` | Gọi `w3tc_resolve_url` cho URL đó rồi purge; dùng đúng host |
| `invalid_option_value` | Sửa kiểu: `"1"` / `""`, số 0–10 000 cho `*_time`, mảng chuỗi cho danh sách |
| `row_not_found` | `vnx_list_rows` lấy đúng `id` |
| `selector_forbidden` | Lazyload HTML chọn header/hero/màn hình đầu: chọn khối khác |
| `critical_css_empty` | Cào lại |
| `pagespeed_api_key_missing`, `quota_exceeded`, `pagespeed_request_failed` | Đo bằng `shared/scripts/psi-rounds.sh` hoặc báo người dùng; không bịa số |
| `html_not_optimized` | Pipeline không chạy; xem `status` của `w3tc_get_status` |

## Cấm

- Purge all, purge theo tag / post type, URL khác host.
- Bật Delay CSS cho trang chưa có Critical CSS; bật cùng lúc delay và async CSS gộp.
- Sửa nội dung Critical CSS cào được; tự viết CSS cho trang.
- Phục vụ bot một bản khác khách.
- Ghi khi chưa có dry-run được duyệt.
- Sửa plugin trong lúc tối ưu site (sửa plugin là việc riêng, có sao lưu, bump version, đóng gói zip, người dùng cài).
