# Vietnix Pagespeed — hướng dẫn cho agent

Người dùng đọc `audit-website/HUONG-DAN.md`. Agent đọc file này trước khi đo điểm hoặc ghi cấu hình. Plugin giữ tối ưu. MCP chỉ là cổng đọc điểm và ghi đúng option đang có.

Không dán token MCP hay API key PageSpeed vào báo cáo, log, hoặc file trong repo. API key PageSpeed nằm trong `shared/.env` (chỉ ở máy, không lên git). Gọi `vnx_list_options` để biết giá trị hiện tại. Danh sách key nằm ở `PLUGIN.md`.

Phần dùng chung với `audit-w3tc` (kết nối MCP, quy trình, tiêu chí, báo cáo, script, mẫu Word, sơ đồ quy trình) nằm ở `shared/README.md`. File này chỉ giữ phần riêng của LiteSpeed: tool `vnx_*`, dòng VPI / lazyload HTML / Critical CSS, key plugin, key LiteSpeed, action.

### Plugin PUB chọn bộ tool theo plugin cache

Site dùng plugin **Vietnix Pagespeed PUB** (thư mục `wp-content/plugins/vietnix-pagespeed-pub/`). PUB tự kiểm tra site đang chạy plugin cache nào và trả bộ tool MCP tương ứng. AI dùng đúng bộ tool đó và đúng thư mục:

| Site có | Tool PUB trả | AI dùng |
| --- | --- | --- |
| LiteSpeed Cache | `vnx_*` + `litespeed_purge` | `audit-website/` (file này, `PLUGIN.md`, skill `audit-pagespeed` / `apply-pagespeed` / `measure-page-load`) |
| W3 Total Cache | `w3tc_*` + 6 tool dùng chung | `audit-w3tc/` (README và skill `w3tc-*`) |
| Hai plugin cache cùng bật | Không tối ưu gì (`cache_conflict`) | Báo người dùng chỉ giữ một |
| Plugin cache khác | Không tối ưu gì (`cache_unsupported`) | Báo người dùng chuyển sang LiteSpeed Cache hoặc W3TC |

Cách biết: gọi `vnx_get_status` một lần ở bước 0.

- Trả kết quả bình thường: site LiteSpeed, làm tiếp theo thư mục này. Trường `environment` cho biết chế độ an toàn (hai plugin cache, plugin cache chưa hỗ trợ).
- Trả `tool_not_in_mode` kèm `use: w3tc_get_status`: site W3TC, chuyển sang `audit-w3tc/`.

Trên LiteSpeed:

- `vnx_list_options` có `applies` cho từng option: option đó có tác dụng trên site này không.
- Delay CSS Time để trống thì không hẹn giờ: CSS đầy đủ chỉ nạp khi khách tương tác.
- `additional_css` chỉ áp cho khách Guest Mode. Muốn khách thường nhận thay đổi thì bật khóa `_client` tương ứng (`PLUGIN.md` mục 1).
- Critical CSS dùng file rỗng `vnx-empty.css` để LiteSpeed gộp CSS.
- Dòng VPI có cờ `lazy`: `(replace [sz-…-sz] keep lazy)` đổi size nhưng giữ `loading="lazy"`, không preload, kể cả ở dòng cuối. Dùng cho ảnh dưới màn hình đầu.
- Delay JS nạp từng script theo thứ tự, chờ script trước nạp xong.
- `vnx_remove_row` cho Critical CSS: `id` gỡ đúng một thiết bị; `type` + `source_id` + `mobile` (`"true"` / `"false"`) gỡ một thiết bị; chỉ `type` + `source_id` gỡ cả trang.
- Cào Critical CSS bằng `vnx_critical_crawler`. Nút "Craw Desktop / Craw Mobile" trong admin bỏ phần `[...]`, `(...)` của selector khi so khớp nên có thể thiếu rule.

Skill chi tiết: `audit-website/audit-pagespeed`, `audit-website/measure-page-load`, `audit-website/apply-pagespeed`. Cách từng option và dòng của plugin chạy trên frontend: `audit-website/PLUGIN.md`.

| Đường dẫn                                                                     | Nội dung                                                                                                                                                     |
| --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `audit-website/HUONG-DAN.md`                                                    | Hướng dẫn dùng và quy trình cho người vận hành. Bản trình chiếu `HUONG-DAN.pptx` và bản in `HUONG-DAN.pdf` giữ cùng nội dung            |
| `audit-website/README.md` | File này: phần riêng LiteSpeed (tool, key, action). Kết nối, quy trình, báo cáo: `shared/README.md` |
| `audit-website/Do.md` | Phiếu thông tin website: tên miền, link. API key PageSpeed ở `shared/.env` |
| `audit-website/PLUGIN.md`                                                       | Cách plugin PUB chạy trên site LiteSpeed: điều kiện tối ưu, guest và client, từng option, cú pháp dòng VPI, lazyload HTML, Critical CSS                                   |
| `shared/Mẫu báo cáo - Hiện trạng website trước khi tối ưu.docx` | Mẫu báo cáo Word gửi khách (dùng chung) |
| `audit-website/audit-pagespeed/`, `measure-page-load/`, `apply-pagespeed/`  | Ba skill: đo và báo cáo hiện trạng, đo tải thật, ghi tối ưu qua MCP                                                                                |
| `shared/scripts/` | Script dùng chung: `measure-run.js` (đo PSI và tải thật), `fill-status-docx.py` (điền file Word), `psi-api.sh`, `psi-rounds.sh`, `mcp-call.py`, `rm-network-rows.py`, `vietnix-pagespeed-bridge.mjs` (bridge MCP cho Cursor) |
| `shared/quy-trinh/` | Sơ đồ nghiệp vụ Phase 1, Phase 2, bản phân tích và nhật ký thay đổi quy trình (dùng chung). Số liệu trong đó chỉ để minh họa, không dùng làm mốc |
| `audit-website/reports/YYYY-MM-DD-ten-mien/`                                    | Thư mục của một lần audit. Mọi file của lần đó nằm ở đây                                                                                        |
| `…/YYYY-MM-DD-ten-mien.md`                                                     | Báo cáo kỹ thuật cho agent và admin                                                                                                                      |
| `…/Báo cáo - Hiện trạng website trước khi tối ưu - ten-mien.docx`      | Báo cáo Word gửi khách, trước tối ưu                                                                                                                  |
| `…/Báo cáo - Kết quả sau tối ưu - ten-mien.docx`                         | Báo cáo Word gửi khách, sau tối ưu                                                                                                                      |
| `…/Đề xuất bổ sung - ten-mien.md`                                          | Việc còn lại sau tối ưu: người dùng tự làm, hoặc AI làm khi được duyệt. Chỉ tạo khi có việc còn lại                                     |
| `…/cau-hinh-truoc-toi-uu.json`                                                 | Bản chụp cấu hình plugin trước lần ghi đầu tiên (trường hợp 2), dùng để khôi phục                                                           |
| `…/assets/`                                                                    | Ảnh chụp PageSpeed và ảnh trang của lần đo                                                                                                             |
| `…/critical-css/`                                                              | CSS do `vnx_critical_crawler` cào và ảnh so sánh trang đầy đủ với trang chỉ có Critical CSS. Chỉ tạo khi sinh Critical CSS                           |
| `…/anh-toi-uu/`                                                                | Ảnh đã nén và `HUONG-DAN-THAY-ANH.md` (mục **Thay ảnh ngoài plugin**). Chỉ tạo khi có việc nén ảnh                                      |
| `…/sao-luu-noi-dung/`                                                          | Nội dung trang hoặc template sao lưu trước khi AI sửa (mục **Thay ảnh ngoài plugin**)                                                          |

Không lưu báo cáo hay ảnh ở thư mục gốc. Mọi file của một lần audit nằm trong `audit-website/reports/YYYY-MM-DD-ten-mien/`.

## Kết nối

Chuyển sang `shared/README.md` mục **Kết nối** (endpoint, header, cấu hình Cursor / Claude Code / Claude / Codex, **Hai trường hợp**, **Đo PSI bằng API key**).

## Quy trình

Chuyển sang `shared/README.md` mục **Quy trình** (bước 0 → 4, **Đánh giá trang**, **Sinh Critical CSS**, **Đo nhiều lần**, **Thay ảnh ngoài plugin**). Trên site LiteSpeed dùng đúng tên tool `vnx_*` như trong file đó.

## Tool

Plugin có 16 tool. Cách từng tool chạy bên trong: `PLUGIN.md` mục 10.

Đọc, không ghi option:

| Tool                                 | Việc                                                                                                                                                                                                                                                                        | Tham số                                                                                     |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `vnx_get_status`                   | `site_url`, `home_url`, `version`, `plugin_active`, `mcp_enabled`, `litespeed_active`, `pagespeed_api_key_header` (`present`/`missing`), số dòng mỗi bảng                                                                                                        | không                                                                                       |
| `vnx_list_options`                 | Mọi option plugin. Không có token MCP hay API key                                                                                                                                                                                                                         | không                                                                                       |
| `vnx_list_actions`                 | Hook LiteSpeed plugin đã gắn. Chỉ để đọc                                                                                                                                                                                                                             | không                                                                                       |
| `vnx_read_litespeed_conf`          | Chín key LiteSpeed cho mục Đề xuất                                                                                                                                                                                                                                      | `keys` tùy chọn, mảng con của chín key                                                |
| `vnx_analyze_pagespeed`            | PageSpeed Insights mobile và desktop, bảng audit đã map sang phương án, dòng `vnx-lazy-hero`, `suggestions`, `quota`. Cần header API key                                                                                                                       | `url` hoặc `urls`                                                                       |
| `vnx_list_rows`                    | Dòng VPI, lazyload HTML, Critical CSS kèm `id`. Critical CSS có nội dung CSS và `duplicates` nếu còn dòng trùng                                                                                                                                              | `table` (`vpi`, `lazyload_html`, `critical_css`), `type`, `source_id` tùy chọn |
| `vnx_resolve_url`                  | `type`/`source_id` plugin dùng cho URL, `body_classes`, chuỗi dò, dòng đang khớp ở từng bảng                                                                                                                                                                   | `url` cùng host                                                                           |
| `vnx_test_selector`                | Trên HTML guest của thiết bị: `count` phần tử khớp, `hidden` phần tử bị CSS inline ẩn, `above_fold` (ước lượng theo cấu trúc HTML)                                                                                                                   | `url` cùng host, `device` (`mobile`, `desktop`), `selectors`                      |
| `vnx_critical_crawler`            | Bộ cào Critical CSS: `crawl_url` (tắt tối ưu Vietnix và cache 15 phút bằng token), viewport, UA, trường `save`, Critical CSS đang có, script. Cách dùng: mục **Sinh Critical CSS** ở bước 3                                                                         | `url` cùng host, `device`, `additional`, `exclude` tùy chọn                       |

Bốn tool nhận `url` ở trên (trừ `vnx_list_rows`) đưa URL vào danh sách purge của `litespeed_purge`.

Ghi. Luôn dry-run trước:

| Tool                       | Việc                                                      | Tham số                                                               |
| -------------------------- | ---------------------------------------------------------- | ---------------------------------------------------------------------- |
| `vnx_set_options`        | Ghi option qua đường Save hiện có                     | `options`, `dry_run`, `approve_core_keywords`                    |
| `vnx_save_critical_css`  | Lưu CSS đã có (sinh bằng `vnx_critical_crawler`). Trang đã có dòng thì cập nhật dòng đó | `css`, `mobile` (`"true"`/`"false"`), `type`, `source_id`, `craw_id`, `dry_run` |
| `vnx_save_vpi`           | Lưu dòng VPI                                             | `rows`, `dry_run`                                                  |
| `vnx_save_lazyload_html` | Lưu dòng lazyload HTML                                   | `rows`, `dry_run`                                                  |
| `vnx_remove_row`         | Xóa một dòng Critical CSS, VPI, hoặc lazyload HTML     | `table`, `id`, `type`, `source_id`, `dry_run`                |
| `litespeed_purge`        | Xóa cache một URL cùng host, có trong danh sách purge | `url`, `dry_run`                                                   |
| `vnx_rollback_options`   | Khôi phục các key của lần `vnx_set_options` gần nhất. Không khôi phục dòng VPI, lazyload HTML, Critical CSS | `dry_run`                                                            |

`dry_run` mặc định là `true`: thiếu field thì tool không ghi.

`vnx_set_options` nhận mảng `options`. Mỗi phần tử là `meta_key` và `meta_value`. Dry-run trả `diff` với `from` và `to` (giá trị sau khi chuẩn hóa), không ghi database. Gateway kiểm tra kiểu: công tắc chỉ nhận `"1"` hoặc `""`; `delay_js_list`, `style_by_keyword`, `style_by_script`, `delay_style_tags` phải là mảng chuỗi; `delay_js_time` là số nguyên từ 0 đến 10000. Sai thì trả `invalid_option_value`. `vpi_replace_size_desktop` và `vpi_replace_size_mobile` vẫn nhận mọi tên size. Key không có trong danh sách trả `option_not_allowed`; key LiteSpeed trả `litespeed_conf_forbidden`.

```json
{
  "dry_run": true,
  "options": [
    { "meta_key": "delay_js", "meta_value": "1" }
  ]
}
```

Công tắc bật là `"1"`, tắt là `""`. Giữ kiểu chuỗi đúng như `vnx_list_options` trả về.

`approve_core_keywords: true` là bắt buộc khi một keyword trong `delay_js_list` chứa `jquery` hoặc `wp-includes`, nếu không gateway trả `keyword_not_approved`. Không thêm hai keyword đó nếu người dùng chưa duyệt đúng keyword.

## Dòng VPI, lazyload HTML, Critical CSS

Cấu trúc `rows`, bảng `type`/`source_id`, cú pháp selector `{n}` và `(replace)`, quy tắc một dòng mỗi trang: xem mục 8 trong `audit-website/PLUGIN.md`. Dry-run của `vnx_save_vpi` và `vnx_save_lazyload_html` trả `action` cho từng dòng: `insert`, `update`, hoặc `skip` kèm `duplicate` (trang đã có dòng, có `existing_id`) , `duplicate_in_request` hay `empty_row` (dòng không có `mobile_data` lẫn `desktop_data`; `ignored_keys` liệt kê trường gửi sai tên). Dòng `skip` không được ghi: sửa dòng cũ bằng `id`. Sau khi ghi vẫn phải purge rồi mở HTML trang để xác nhận.

CSS rỗng trả `critical_css_empty`. `rows` rỗng trả `empty_options`. Delay combined và async combined (hoặc hai key `_client` của chúng) cùng bật sau lần ghi thì gateway trả `css_mode_conflict`, database không đổi. Khi đó dừng, không ghi bằng đường khác.

## Key option plugin

Danh sách key, kiểu giá trị, guest và client, cách từng option chạy: mục 1–7 trong `audit-website/PLUGIN.md`.

Option là toàn site. `active_all` khác `"1"` thì không tính năng nào chạy. Ảnh đã qua VPI vẫn mang `data-vnx-lazy="1"`. Delay CSS không có timer và cần Critical CSS cho trang. Mỗi `type` + `source_id` chỉ một dòng.

## Key LiteSpeed — chỉ đọc

`vnx_read_litespeed_conf` trả đúng chín key dưới đây. Ghi chúng vào mục Đề xuất, trạng thái `suggestion`. Không có tool ghi các key này.

| Key               | Thông số  | Đề xuất khi                                     |
| ----------------- | ----------- | -------------------------------------------------- |
| `optm-css_min`  | Minify CSS  | CSS chưa nén                                     |
| `optm-css_comb` | Combine CSS | Nhiều file CSS chặn render                       |
| `optm-ucss`     | UCSS        | CSS không dùng chiếm dung lượng lớn          |
| `optm-ccss`     | CCSS        | CSS chặn render và plugin chưa có Critical CSS |
| `optm-js_defer` | JS defer    | JS chặn render, TBT cao                           |
| `optm-js_delay` | JS delay    | JS không dùng hoặc bên thứ ba nặng           |
| `media-lazy`    | Lazyload    | Ảnh ngoài màn hình đầu                       |
| `guest_optm`    | Guest mode  | Điểm mobile thấp với khách ẩn danh           |
| `cache`         | Cache       | TTFB cao và cache đang tắt                      |

Ghi conf LiteSpeed trả `litespeed_conf_forbidden`.

## Action được gọi và action cấm

Được gọi: `litespeed_purge` với một `url` cùng host của page đang tối ưu. LiteSpeed tắt thì trả `litespeed_inactive`. Option plugin vẫn ghi được. Báo người dùng và bỏ bước purge.

Không gửi `purge_all`, `tag`, hay `post_type`. Purge all, URL rỗng, hoặc URL khác host trả `purge_all_forbidden`. URL cùng host nhưng không có trong danh sách purge trả `url_not_in_session`: gọi `vnx_resolve_url` cho URL đó trước. Danh sách lưu trên site (40 URL gần nhất), nên không mất khi khởi động lại agent. `vnx_remove_row` không đưa URL vào danh sách. Không có `litespeed_purge_all`.

`vnx_list_actions` chỉ liệt kê hook plugin đã gắn vào `litespeed_buffer_finalize` và `litespeed_optm_html_head`. Agent không gọi các hook này. Thứ tự hook ở mục 1 trong `PLUGIN.md`.

## Map audit sang key

Bảng map nằm trong skill `audit-website/audit-pagespeed`. `vnx_analyze_pagespeed` trả mỗi dòng đã map (`action`, `status`, `options`, `cause`). Đối chiếu với HTML thật trước khi đề xuất. Dòng `vnx-lazy-hero` đoán màn hình đầu theo cấu trúc HTML: xác nhận bằng ảnh chụp trang trước khi đưa vào báo cáo.

## Báo cáo

Chuyển sang `shared/README.md` mục **Báo cáo** (cấu trúc file `.md`, **Đề xuất bổ sung**, **Tải thật**, **Báo cáo Word cho khách**). Thư mục báo cáo của site LiteSpeed: `audit-website/reports/YYYY-MM-DD-ten-mien/`.
