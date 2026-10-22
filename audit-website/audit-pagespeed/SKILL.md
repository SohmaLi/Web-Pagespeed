---
name: audit-pagespeed
description: >-
  Đo điểm PageSpeed Insights qua MCP của Vietnix Pagespeed PRO, lập báo cáo
  phương án plugin và mục đề xuất LiteSpeed. Dùng khi người dùng đưa URL cần
  kiểm tra tốc độ, điểm PageSpeed, nguyên nhân chậm, hoặc yêu cầu audit website.
---

# Audit PageSpeed qua MCP

Đọc `audit-website/PLUGIN.md` để biết option và dòng nào chạy trên trang nào. Plugin Vietnix Pagespeed PRO là nơi ghi cấu hình. MCP là cổng để agent đọc điểm và ghi option. Không sửa file tối ưu frontend của plugin trong lúc audit.

## Trước khi đo

Làm theo bước 0 trong mục **Quy trình** của `audit-website/README.md`. Thông tin website nằm ở `audit-website/Do.md`. Trường hợp 2 làm thêm bước 0b: chỉ dùng báo cáo Phase 1 có thư mục trùng **đúng** tên miền, không khớp theo đuôi. Số so sánh theo mục **Nguồn so sánh** trong README: chỉ trong thư mục của lần chạy, cùng URL, cùng thiết bị, cùng nguồn đo.

Trước mục dưới đây, kiểm tra cách nối theo agent. Cursor: file `vietnix-pagespeed-bridge.mjs` phải có tại đường dẫn `args` trong `~/.cursor/mcp.json` (mặc định `~/.cursor/vietnix-pagespeed-bridge.mjs`) trước khi gọi tool `vnx_*`. Chưa có thì copy từ `audit-website/scripts/vietnix-pagespeed-bridge.mjs`. Claude Code, Claude và Codex không copy file bridge. Thiếu khối MCP thì vẫn đo URL trong `Do.md` bằng key mục 1, không bịa token.

1. Plugin đã cài chưa trên miền trong `Do.md`: kiểm tra `wp-content/plugins/vietnix-pagespeed-pro/vnx-pagespeed.php` rồi `wp-content/plugins/vietnix-pagespeed/vnx-pagespeed.php`. `200` là đã cài (có thể chưa bật). Cả hai `404` mà HTML vẫn có `vnx-critical-css-inline` hoặc `data-vnx-lazy` thì plugin nằm ở thư mục tên khác: vẫn coi là đã cài.
2. Gọi `vnx_get_status` một lần, so host của `site_url` với miền cần đo. Khác host: không gọi tool `vnx_*` nào khác. Đo, phân tích và báo cáo hiện trạng vẫn chạy. Trường hợp 1 kết thúc; trường hợp 2 dừng ở bước 2b chờ nối MCP đúng miền.
3. MCP đúng miền: cần `plugin_active`, `mcp_enabled`, và `pagespeed_api_key_header` là `present` trước `vnx_analyze_pagespeed`. Thiếu API key thì đo PSI trên pagespeed.web.dev thay cho `vnx_analyze_pagespeed`, ghi rõ nguồn. Không bịa điểm.

### Đo khi không có MCP

Chưa cài plugin, chưa nối MCP, MCP tắt, hoặc MCP đang nối site khác (ở cả hai trường hợp): làm theo bước 0 và mục **Đo khi chưa có MCP đúng miền** trong `audit-website/README.md` cho phần đo và báo cáo. Không gọi tool `vnx_*` cho miền này, ngoài một lần `vnx_get_status` để so `site_url`. Không dán API key hay token vào báo cáo. Key ở `Do.md` chỉ đọc vào biến, không in ra.

## Đo

Khởi chạy đo trước khi đọc hết `PLUGIN.md`. Host `site_url` trùng miền thì gọi `vnx_analyze_pagespeed` cho từng URL, cả mobile và desktop, và cùng lúc chạy `audit-website/scripts/measure-run.js --skip-psi` cho tải thật. Host khác, chưa có MCP, hoặc chưa cài plugin: bỏ `--skip-psi`, một lệnh lấy cả điểm lẫn tải thật, không gọi `vnx_analyze_pagespeed`. Mỗi URL tốn 2 request. Quota API key là 25.000 request mỗi ngày và 30 request mỗi phút. Hết quota thì đo trên pagespeed.web.dev, không bịa điểm. Lệnh exit 2: giữ nhánh đã có số, không chạy lại nhánh đó.

Chụp pagespeed.web.dev tối đa một lần, 40 giây. `Unable to resolve` hoặc chưa thấy điểm thì dừng.

Với mỗi lần đo, giữ:

- Điểm performance.
- FCP, LCP, TBT, CLS, Speed Index, TTFB.
- Audit có điểm dưới 0,9: mã, mô tả, file hoặc phần tử gây chậm.

Mỗi dòng trong `rows` có `action`, `status`, `options`, `cause`, có khi kèm `selector`, `image_url`, `keywords`. Dùng làm điểm khởi đầu, vẫn đối chiếu với HTML thật. `warnings` có `html_not_loaded` nghĩa là gateway không tải được HTML guest của thiết bị đó: tự kiểm tra ảnh lazy bằng trình duyệt.

Việc plugin không xử lý được thì ghi `ngoài phạm vi`. Không đưa dòng đó vào bước thực thi.

Nếu agent là Cursor hoặc Claude Code, đo thêm tốc độ tải thật theo skill `measure-page-load` và ghi vào cùng báo cáo.

Điểm PSI cao chưa chắc khách thật thấy nhanh. Kiểm tra phần tử LCP mà PSI trả về:

- Dòng `vnx-lazy-hero` (P1) báo ảnh màn hình đầu có `data-vnx-lazy` và `src` SVG giữ chỗ, kèm `selectors` theo cú pháp VPI, `image_url`, `type`/`source_id`. Gateway đoán màn hình đầu theo cấu trúc HTML, không đo vị trí, nên xác nhận bằng ảnh chụp trang ngay sau khi tải.
- Không có dòng đó mà LCP là chữ trong khi màn hình đầu có ảnh lớn, hoặc ảnh thu nhỏ trong PSI có ô trống: mở HTML và tìm `data-vnx-lazy` trên ảnh đó.
- Đối chiếu với LCP tải thật. Nếu khớp thì ghi dòng audit P1, nguyên nhân là ảnh nào và request ảnh bắt đầu lúc nào.
- Ghi `type`/`source_id` bằng `vnx_resolve_url` và selector ảnh (id hoặc class, kèm `{n}`). Đọc `body_classes`. Class `tag-<id>` và taxonomy `post_tag`: dòng theo trang không chạy trên frontend, ghi `ngoài phạm vi`. Thử selector bằng `vnx_test_selector` cho mobile và desktop. Ghi trang đã có dòng VPI chưa: `vnx_resolve_url` trả dòng đang khớp, `vnx_list_rows` trả mọi dòng kèm `id`.

### Kiểm tra HTML và cache

- **Q.** Tìm `<script id="vnx-inline-delay-css">`. Nếu `type` là `litespeed/javascript` và thiếu `data-no-optimize="1"` cùng `data-no-defer="1"` thì ghi P1: CSS delay phụ thuộc bộ nạp JS của LiteSpeed. Không sửa file plugin trong lúc audit.
- **R.** `LS_delay_combined_css` là `"1"` mà `vnx_list_rows` không có dòng Critical CSS cho trang thì ghi P1. Phương án là Critical CSS khi đã có nội dung, hoặc không bật delay cho trang đó. PSI không thấy nhảy bố cục vì không tương tác. Số px lấy từ skill `measure-page-load`.
- **T.** HTML cache (`x-litespeed-cache: hit`) trỏ thư mục plugin khác thư mục đang chạy và file đó trả 404: ghi cảnh báo và yêu cầu purge trang đó trước khi đo lại.

## Báo cáo

Ghi báo cáo ra file trong repo. Báo cáo không lưu trên site:

`audit-website/reports/YYYY-MM-DD-ten-mien/YYYY-MM-DD-ten-mien.md`

Một miền một thư mục và một file trong ngày. Báo cáo Word và ảnh của lần đó cũng nằm trong thư mục này, không lưu ở thư mục gốc. Kiểm tra lại cùng ngày thì ghi thêm mục vào file đó, không tạo file thứ hai. Chưa gọi tool ghi option.

Mỗi URL có điểm mobile và desktop, kèm một dòng chú ý ngay dưới bảng điểm và metric: các chỉ số không cần cải thiện (điểm tổng hiệu suất PSI ≥ 90; tải thật trong ngưỡng). Báo cáo chỉ kết luận theo điểm tổng; FCP, LCP, TBT, CLS, Speed Index, TTFB chỉ dùng để chọn dòng `proposed` khi điểm tổng chưa đạt. Cách ghi theo mục **Báo cáo** của `audit-website/README.md`. Rồi bảng:

| Cột | Nội dung |
| --- | --- |
| URL | Link đã nhập |
| Thiết bị | mobile hoặc desktop |
| Điểm | Performance |
| Metric | FCP, LCP, TBT, CLS, Speed Index, TTFB |
| Mã audit | id PageSpeed |
| Vấn đề | Tiêu đề và giá trị hiển thị |
| Nguyên nhân | File, kích thước, hoặc phần tử LCP |
| Phương án | Option của plugin PRO |
| Độ ưu tiên | P1 chỉ số chính fail, P2 tiết kiệm trên 200 ms, P3 còn lại |
| Thông số | Thông số trong mục **Đánh giá trang** của `audit-website/README.md` mà dòng này ảnh hưởng |
| Trạng thái | Gắn với thông số chưa đạt: `proposed` khi MCP đúng miền, `cần plugin` khi chưa cài plugin hoặc chưa có MCP đúng miền. Gắn với thông số đã đạt: `theo dõi`. Trang đạt cả 6 thông số: mọi dòng `theo dõi`, kết luận `Không cần tối ưu` |
| Tải thật | Chỉ khi đã đo bằng trình duyệt |

Chỉ khi MCP đúng miền: gọi `vnx_read_litespeed_conf` và thêm mục **Đề xuất** một lần cho cả site. Chỉ chín thông số: minify CSS, combine CSS, UCSS, CCSS, JS defer, JS delay, lazyload, guest mode, cache. Mỗi dòng ghi hiện trạng, đề xuất bật, tắt hoặc giữ nguyên, lý do, trạng thái `suggestion`.

Không áp dòng `suggestion`. Không ghi cấu hình LiteSpeed.

## Map audit sang plugin

| Dấu hiệu | Phương án |
| --- | --- |
| CSS chặn render, CSS thừa, CSS chưa nén | Critical CSS cho trang (`vnx_critical_crawler` rồi `vnx_save_critical_css`), sau đó `LS_delay_combined_css` (chỉ khi trang đã có Critical CSS) hoặc `ls_async_combined_css` (cần LiteSpeed combine hoặc UCSS). Không bật cả hai |
| `LS_delay_combined_css` bật, trang không có dòng Critical CSS | P1. Không bật delay cho trang đó. Sinh Critical CSS cho trang |
| `<script id="vnx-inline-delay-css">` là `type="litespeed/javascript"`, thiếu `data-no-optimize` và `data-no-defer` | P1. CSS delay phụ thuộc bộ nạp JS của LiteSpeed. Báo người dùng cập nhật plugin. Không sửa file plugin trong lúc audit |
| HTML cache trỏ thư mục plugin khác, file 404 | Purge trang đó trước khi đo lại |
| JS thừa, TBT cao, script bên thứ ba | `delay_js` và keyword (tên file script) trong `delay_js_list`. Chỉ có script inline hoặc `Unattributable`: `ngoài phạm vi` |
| Ảnh ngoài màn hình đầu | `LS_optimize_lazyload` |
| Ảnh dư kích thước, phần tử LCP là ảnh | `vietnix_vpi_active` và `vnx_save_vpi`, đổi size bằng `(replace [sz-…-sz] keep)` theo bề rộng hiển thị × DPR |
| Phần tử LCP là chữ | Không dùng VPI. Critical CSS và delay/async combined CSS; font chậm ngoài plugin |
| Ảnh màn hình đầu có `data-vnx-lazy`, `src` là SVG giữ chỗ (dòng `vnx-lazy-hero`) | `vietnix_vpi_active` và `vnx_save_vpi` cho ảnh đó để nạp ngay, không lazyload. Báo cáo khách ghi "Giật ảnh do tải chậm" |
| Ảnh thiếu `width`/`height`, ảnh chưa nén hoặc chưa WebP | Ngoài plugin |
| HTML lớn | `lazyload_html` và `vnx_save_lazyload_html` cho vùng dưới màn hình đầu. Không chọn header hoặc hero |
| TTFB cao | Ngoài plugin. Sau khi tối ưu chỉ `litespeed_purge` đúng page |
| LCP, TBT, CLS | Tách thành audit con, không gom một nút |

## Báo cáo Word cho khách

Tạo bản gửi khách theo mục **Báo cáo Word cho khách** trong `audit-website/README.md`. Ảnh chụp lưu ở `audit-website/reports/YYYY-MM-DD-ten-mien/assets/`.

Trường hợp 1 (chỉ Phase 1): trình tóm tắt rồi kết thúc, không hỏi tối ưu. Trường hợp 2: sang bước 2b trong mục **Quy trình** của `audit-website/README.md` (cài plugin và nối MCP nếu chưa, đo lại sau cài plugin 3 lần lấy trung vị làm mốc "trước", kiểm tra cấu hình đã có: mỗi option và dòng cũ là `giữ`, `thay` hoặc `gỡ`), rồi trình tóm tắt từng link, bảng **Cấu hình đã có** và bảng `proposed`, hỏi link nào cần tối ưu và dòng nào duyệt. Dừng tại đây cho đến khi người dùng trả lời.
