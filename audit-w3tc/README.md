# audit-w3tc — khảo sát và tối ưu site W3 Total Cache

Thư mục này dùng cho site cài plugin **Vietnix Pagespeed PUB** chạy với **W3 Total Cache** (W3TC). Site chạy LiteSpeed Cache thì dùng `../audit-website/`.

Phần dùng chung với `audit-website/` (kết nối MCP, quy trình Phase 1 / Phase 2, tiêu chí, báo cáo, script, mẫu Word, API key, sơ đồ quy trình) nằm ở `../shared/` (`../shared/README.md`). File này và các skill `w3tc-*` chỉ ghi phần riêng của W3TC.

## Cách dùng

**Người dùng:**

1. Kiểm tra site đã cài plugin PUB (gói `vietnix-pagespeed-pub-*.zip`), bật MCP, và chỉ có W3TC là plugin cache.
2. Kết nối MCP `vietnix-pagespeed` của site đó vào agent (mục **Kết nối**).
3. Gửi link trong chat, nói "khảo sát" (trường hợp 1) hoặc "tối ưu" (trường hợp 2). Hoặc tự điền `Do.md` mục 1 và mục 2.
4. Duyệt từng lần ghi khi agent hỏi, và tự làm các việc trong W3TC mà agent đề xuất, ví dụ bật User Agent Groups.
5. Nhận kết quả trong `reports/YYYY-MM-DD-ten-mien/`: báo cáo Word và file "Đề xuất bổ sung".

**Agent:** dùng bộ skill riêng của thư mục này. Các skill đã viết sẵn tên tool `w3tc_*`, không cần đổi tên tool của `audit-website`.

1. Điền `Do.md`.
2. Phase 1 (khảo sát): `w3tc-audit-pagespeed/SKILL.md`.
3. Phase 2 (tối ưu, trường hợp 2, sau khi người dùng duyệt): `w3tc-apply-pagespeed/SKILL.md`.
4. Đo tải thật: `w3tc-measure-page-load/SKILL.md`.
5. Lưu mọi thứ vào `reports/YYYY-MM-DD-ten-mien/`.

Các mục dưới đây của README là tài liệu tra cứu cho skill: bảng tool, khóa `_client`, cài đặt W3TC, Delay CSS, dòng VPI, Critical CSS.

## Thư mục

| Đường dẫn | Nội dung | Dùng khi tối ưu site |
| --- | --- | --- |
| `README.md` | File này | Có |
| `Do.md` | Phiếu thông tin site: tên miền, trường hợp, link cần đo. Mỗi phiếu một miền; miền mới thì ghi đè | Có |
| `reports/YYYY-MM-DD-ten-mien/` | Báo cáo của từng lần làm (xem mục **Báo cáo**). Chỉ lưu ở máy, không đưa lên git | Có |
| `w3tc-audit-pagespeed/SKILL.md` | Skill Phase 1: đo, đọc audit, đánh giá 6 thông số, bảng `proposed`, báo cáo hiện trạng | Có |
| `w3tc-apply-pagespeed/SKILL.md` | Skill Phase 2: ghi phương án đã duyệt, purge, đo lại, nghiệm thu, báo cáo kết quả, đề xuất bổ sung | Có |
| `w3tc-measure-page-load/SKILL.md` | Skill đo tải thật trên cache W3TC | Có |
| `../shared/` | Phần dùng chung: `README.md` (kết nối, quy trình, báo cáo), `scripts/` (`psi-rounds.sh`, `psi-api.sh`, `mcp-call.py`, `rm-network-rows.py`, `measure-run.js`, `fill-status-docx.py`), mẫu Word, `.env` (API key PageSpeed), `quy-trinh/` | Có |
| `TAI-SAO-DUNG-W3TC.md` | Lý do chọn W3TC cho máy chủ không phải LiteSpeed | Đọc thêm |
| `vietnix-pagespeed-pub-*.zip` | Gói plugin để cài lên site | Chỉ khi cài plugin |
| `vietnix-pagespeed-pub/` | Mã nguồn plugin, phần phát triển plugin. Không đưa lên git | Không. Không sửa khi đang tối ưu site |

## Kết nối

MCP tên `vietnix-pagespeed`, cấu hình theo `../shared/README.md` mục **Kết nối** (cùng endpoint, cùng 2 header). Đo PSI cần header `X-Pagespeed-Api-Key`.

Nếu MCP được thêm giữa phiên và Claude Code chưa nhận tool, gọi thẳng endpoint bằng JSON-RPC, lấy URL và header từ `~/.claude.json`. Không in token MCP, API key hay mật khẩu WordPress ra màn hình hoặc vào file.

## Tool: LiteSpeed và W3TC

Site W3TC chỉ nhận tool `w3tc_*` cùng 6 tool dùng chung. Gọi tên tool LiteSpeed sẽ nhận lỗi `tool_not_in_mode`, trường `use` là tên tool thay thế.

| Trên LiteSpeed | Trên W3TC | Ghi chú |
| --- | --- | --- |
| `vnx_get_status` | `w3tc_get_status` | Thêm trạng thái Page Cache, engine, tách mobile, pipeline có chạy không |
| `vnx_read_litespeed_conf` | `w3tc_read_conf` | Chỉ đọc. Truyền giá trị để ghi sẽ bị từ chối (`w3tc_conf_forbidden`) |
| `vnx_list_options` | `w3tc_list_options` | Chỉ trả option dùng được trên W3TC, kèm tên các option không dùng được |
| `vnx_list_actions` | `w3tc_list_pipeline` | Các bước tối ưu chạy quanh W3TC, theo thứ tự |
| `vnx_analyze_pagespeed` | `w3tc_analyze_pagespeed` | Đề xuất chỉ gồm option dùng được trên W3TC. `suggestion` là cài đặt W3TC cho người dùng tự làm |
| `vnx_resolve_url` | `w3tc_resolve_url` | `type` / `source_id`, dòng khớp đầu tiên, các option "for Client" |
| `vnx_test_selector` | `w3tc_test_selector` | Đếm trên HTML mà khách của thiết bị đó nhận |
| `vnx_set_options` | `w3tc_set_options` | `dry_run` mặc định `true`. Trang đã cache giữ HTML cũ cho tới khi purge |
| `vnx_critical_crawler` | `w3tc_critical_crawler` | Thiết bị `mobile` bị từ chối khi W3TC chưa tách mobile |
| purge của LiteSpeed | `w3tc_purge` | Purge 1 URL đã dùng trong phiên tối ưu, cùng host. `old_copy_seconds` là thời gian W3TC còn có thể trả bản cũ |
| — | `w3tc_cache_state` | Mới: file cache desktop và mobile của 1 URL (kích thước, tuổi, hết hạn). Chỉ đọc được với Disk: Enhanced |

Dùng chung, cách dùng như LiteSpeed: `vnx_list_rows`, `vnx_save_vpi`, `vnx_save_critical_css`, `vnx_save_lazyload_html`, `vnx_remove_row`, `vnx_rollback_options`.

Không có trên W3TC: `ls_async_combined_css`, `remove_litespeed_critical`, `optimize_ls_delay_js`, `bot_verifying_popup` (cả bản `_client`).

## Những chỗ W3TC khác LiteSpeed

### Không có Guest Mode, phải bật khóa `_client`

Cặp option "thường" và "for Client" có từ thời plugin chỉ chạy với LiteSpeed Cache:

| Nhóm khách trên LiteSpeed | Là ai | Option áp dụng |
| --- | --- | --- |
| Guest | Lượt đầu chưa có cookie, LiteSpeed Guest Mode trả bản HTML chung. Bot PSI/Lighthouse luôn ở nhóm này | Option thường |
| Client | Khách thật từ lượt thứ hai, chưa đăng nhập | Option "for Client" (khóa `_client`) |

W3TC không có Guest Mode. **Bot PSI và khách cùng thiết bị nhận cùng một file cache**, nên mọi khách chưa đăng nhập đều là "Client". Một tính năng chỉ chạy khi `active_all` bật, option thường của nó bật, và khóa `_client` của nó cũng bật. Bật option thường mà thiếu `_client` thì tính năng gần như không có tác dụng.

| Tính năng | Option cần bật |
| --- | --- |
| Công tắc tổng | `active_all` |
| VPI | `vietnix_vpi_active` + `vietnix_vpi_active_client`, `vpi_replace_size_client` |
| Critical CSS | `vnx_critical_client` |
| Delay CSS (trang có Critical CSS) | `LS_delay_combined_css` + `LS_delay_combined_css_client` |
| Delay JS | `delay_js` + `delay_js_client`, kèm `delay_js_list` |
| Lazyload HTML | `lazyload_html` + `lazyload_html_client` |

Quy tắc:

- **Dùng tính năng nào thì bật cả cặp, không dùng thì tắt cả cặp.** Không có kiểu "chỉ bật cho bot" trên W3TC.
- **Không bật hết.** Chỉ bật tính năng nhắm vào thông số đang chưa đạt, có dòng cấu hình, đã thử như khách thật và đo 5 lần. Lý do:
  - Tính năng bật mà chưa có dòng cấu hình thì không làm gì, chỉ làm cài đặt rối hơn.
  - Có tính năng làm hỏng giao diện nếu bật không thử. Ví dụ Lazyload HTML từng làm Lighthouse đo CLS khoảng 1.
  - Option có tác dụng toàn site. Ví dụ keyword của Delay JS khớp script trên mọi trang, kể cả quảng cáo hay chat gắn sau này.
  - "Delay" và "async" CSS gộp không bật cùng lúc.
- Không phục vụ bot một bản khác khách (nhận diện theo User-Agent). Google coi đó là cloaking. Thứ hạng dùng Core Web Vitals của người dùng thật (CrUX), không dùng điểm PSI đo thử.

Sau khi ghi, gọi `w3tc_resolve_url` để xem các option "for Client" đã đúng chưa.

### Tách bản mobile bằng User Agent Groups

Nếu chưa bật User Agent Groups, mọi khách nhận chung bản desktop. Khi đó cột mobile của dòng VPI và Critical CSS mobile không có tác dụng, và tool trả cảnh báo `w3tc_mobile_off`.

Cách bật (người dùng tự làm): Performance → Cache Groups → Manage User Agent Groups, bật nhóm `phones`. Đây là thay đổi toàn site.

### Cài đặt W3TC nên dùng

Kiểm tra bằng `w3tc_read_conf` ở bước 0. Cài đặt do người dùng tự đổi trong W3TC; agent chỉ đọc.

| Mục W3TC | Vị trí trong wp-admin | Khóa `w3tc_read_conf` | Nên để | Chức năng |
| --- | --- | --- | --- | --- |
| Page Cache | Performance → General Settings → Page Cache → Enable | `pgcache.enabled` | Bật | Lưu sẵn HTML từng trang, khách nhận file có sẵn mà không chạy PHP. Đây là phần làm "Load" nhanh |
| Page Cache Method | Performance → General Settings → Page Cache → Page Cache Method | `pgcache.engine` | Disk: Enhanced (`file_generic`) | Lưu HTML thành file, webserver trả thẳng. `w3tc_cache_state` chỉ đọc được kiểu này |
| User Agent Groups | Performance → Cache Groups → Manage User Agent Groups → nhóm `phones` → Enabled | `mobile.enabled` | Bật nhóm `phones` | Tách cache điện thoại và máy tính. Thiếu thì cột Mobile của VPI và Critical CSS mobile không có tác dụng |
| Referrer Groups | Performance → Cache Groups → Manage Referrer Groups | `referrer.enabled` | Tắt | Tách cache theo nguồn khách đến. Không cần |
| Lazy Load Images | Performance → General Settings → User Experience → Lazy Load Images | `lazyload.enabled` | Tắt | Trùng VPI của plugin, làm ảnh màn hình đầu bị tải chậm |
| Minify | Performance → General Settings → Minify → Enable | `minify.enabled` | Tắt | Gộp và đổi tên file CSS/JS, nên Critical CSS, Delay CSS và keyword Delay JS có thể không khớp. Chưa thử với plugin |
| Browser Cache | Performance → General Settings → Browser Cache → Enable | `browsercache.enabled` | Bật | Trình duyệt giữ CSS, JS, ảnh, font cho lượt sau |
| Object Cache, Database Cache | Performance → General Settings → Object Cache / Database Cache | `objectcache.enabled`, `dbcache.enabled` | Tắt khi không có Redis/Memcached | Chỉ có lợi khi có bộ nhớ đệm riêng. Khách đã nhận trang từ Page Cache |
| CDN | Performance → General Settings → CDN | `cdn.enabled` | Tắt | Chưa thử với plugin |
| Cache front page | Performance → Page Cache → General | `pgcache.cache.home` | Bật | Cache trang chủ |
| Cache SSL (HTTPS) requests | Performance → Page Cache → General | `pgcache.cache.ssl` | Bật | Cache trang `https` |
| Cache feeds | Performance → Page Cache → General | `pgcache.cache.feed` | Tùy chọn (thường tắt) | Cache RSS feed, không ảnh hưởng tốc độ trang |
| Cache URIs with query string variables | Performance → Page Cache → General | `pgcache.cache.query` | Tắt | Nếu bật, link crawler Critical CSS và link thử `?nc=` cũng bị cache, làm sai kết quả cào và đo |
| Don't cache pages for logged in users | Performance → Page Cache → General | `pgcache.reject.logged` | Bật | Người đăng nhập luôn nhận trang mới. Plugin cũng không tối ưu cho người đăng nhập |
| Automatically prime the page cache | Performance → Page Cache → Cache Preload | `pgcache.prime.enabled`, `pgcache.prime.interval` | Tùy chọn | Tự tạo cache trước từ sitemap. Tắt thì khách đầu tiên sau khi cache hết hạn nhận trang chậm hơn một chút |
| Max age / Garbage collection interval | Performance → Page Cache → Advanced | `pgcache.lifetime`, `pgcache.file.gc` | 3600 s (mặc định) | Bản cache dùng tối đa 1 giờ, mỗi giờ dọn file hết hạn. Đổi cấu hình plugin thì phải purge, nếu không khách nhận HTML cũ tới hết thời gian này |

Hướng dẫn người dùng bật hoặc tắt:

1. Vào đúng vị trí trong bảng, đổi mục, bấm **Save Settings & Purge Caches** (hoặc **Save all settings** rồi purge).
2. Bật Page Cache lần đầu hoặc đổi Page Cache Method: W3TC có thể yêu cầu ghi rule vào `.htaccess` hoặc bật `WP_CACHE` trong `wp-config.php`. Làm theo thông báo của W3TC.
3. Bật User Agent Groups: purge toàn bộ cache để bản điện thoại được dựng riêng.
4. Agent gọi lại `w3tc_read_conf` và `w3tc_get_status` để xác nhận (không còn cảnh báo), rồi mới đo.

Tên mục có thể lệch chút theo bản W3TC. Đối chiếu bằng khóa ở cột `w3tc_read_conf`.

Chia việc:

| Bên | Lo việc gì |
| --- | --- |
| W3TC | Trả HTML nhanh (Page Cache), tách bản điện thoại và máy tính, Browser Cache |
| Plugin PUB | Những gì PSI chấm trong trang: Critical CSS + Delay CSS, Delay JS, VPI đổi ảnh nhỏ và tải trước ảnh LCP |

W3TC không làm CSS bớt chặn hiển thị, không hoãn JS nặng, không thu nhỏ ảnh. Tính năng W3TC trùng việc với plugin (Lazy Load, Minify, Delay Scripts, Remove CSS/JS) để tắt.

### Cảnh báo cài đặt W3TC

`w3tc_get_status` và `w3tc_analyze_pagespeed` trả các mã sau. Đây là việc của người dùng, ghi vào mục `suggestion`:

| Mã | Nghĩa | Việc cần làm |
| --- | --- | --- |
| `w3tc_wp_cache_off` | `WP_CACHE` chưa bật nên W3TC chưa chạy | Bật trong `wp-config.php` |
| `w3tc_pgcache_off` | Page Cache tắt | Performance → General Settings, bật Page Cache |
| `w3tc_mobile_off` | Chưa tách cache theo thiết bị | Bật User Agent Groups (mục trên) |
| `w3tc_query_cached` | URL có query string vẫn được cache | Tắt "Cache URIs with query string variables" |
| `w3tc_logged_cached` | Người đăng nhập vẫn nhận cache | Bật "Don't cache pages for logged in users" |
| `w3tc_lazyload_on` | Lazyload W3TC trùng lazyload plugin | Chỉ bật một bên |
| `w3tc_feature_overlap` | Delay Scripts / Remove CSS/JS của W3TC trùng delay của plugin | Chỉ bật một bên |
| `html_not_optimized` | Pipeline không chạy, khách nhận HTML gốc | Xem `status` trong `w3tc_get_status` |

Mỗi site chỉ dùng một plugin cache. Có thêm plugin cache khác thì plugin báo `cache_conflict`.

### Purge và kiểm tra cache sau mỗi lần ghi

Mỗi lần ghi option hoặc dòng cấu hình:

1. Purge từng URL bị ảnh hưởng bằng `w3tc_purge` (chạy `dry_run` trước).
2. Mở lại URL để W3TC dựng cache mới.
3. Kiểm tra bằng `w3tc_cache_state` (bản desktop và mobile) và `w3tc_test_selector`.

Nếu chưa purge, khách vẫn nhận HTML cũ tới hết max age của Page Cache (thường 3 600 s). Vì vậy tắt hoặc bật option mà chưa purge thì điểm đo được không phản ánh cấu hình mới.

## Quy trình

Các bước chung ở `../shared/README.md` mục **Quy trình**; skill `w3tc-audit-pagespeed` và `w3tc-apply-pagespeed` đã viết sẵn theo tool W3TC. Thêm các điểm sau:

- **Bước 0:** `w3tc_get_status` + `w3tc_read_conf`, so với bảng **Cài đặt W3TC nên dùng**. Ghi cảnh báo W3TC và mục lệch vào báo cáo. Chụp cấu hình vào `cau-hinh-truoc-toi-uu.json` trước lần ghi đầu.
- **Sao lưu:** trước mọi thay đổi, lưu bản hiện tại vào `~/Documents/pagespeed/backup/<ngày>-<việc>/`.
- **Ghi:** luôn `dry_run` trước, chờ người dùng duyệt rồi mới ghi.
- **Phạm vi:** chỉ tối ưu trang được đánh dấu `có` trong `Do.md`, và chỉ tối ưu thông số chưa đạt.

### Đo PSI

- Đo 5 lần cho mỗi URL. Các lần đo cùng URL cách nhau **ít nhất 80 giây**, vì gọi sát nhau PSI trả lại cùng một kết quả.
- Đo nhiều trang trong một vòng thì chờ cho đủ 80 giây trước khi đo lại trang đầu.
- Gọi PSI cho từng URL, không gộp nhiều URL vào một lần gọi (dễ timeout).
- Loại các lần đo lỗi, ghi lý do: timeout, `FAILED_DOCUMENT_REQUEST`, ảnh LCP hoặc CSS không tải, chỉ số bất thường.
- **Tiêu chí đạt: lần đo nào cũng ≥ 90**, không chỉ trung vị. Ảnh chụp pagespeed.web.dev chỉ là 1 lần đo, nên chỉ chụp sau khi 5 lần đều đạt.
- Không kết luận "đã xong" sau một thay đổi khi chưa đủ 5 lần đo.

### Delay CSS

Chỉ chạy trên trang đã có dòng Critical CSS. Trang chưa có thì CSS tải bình thường.

1. Mỗi thẻ `<link rel="stylesheet">` thành thẻ chờ (`vnx-css-delayed="1"`, URL thật ở `data-href`), nên không chặn hiển thị.
2. Trang vẽ ngay bằng Critical CSS trong `<style id="vnx-critical-css-inline">`.
3. CSS đầy đủ tải khi khách tương tác (rê chuột, click, gõ phím, cuộn, chạm), hoặc khi hết **Delay CSS Time**, việc nào đến trước.
4. Mọi file CSS đã tải xong (hoặc lỗi) thì Critical CSS tắt (`media="null"`).

| Delay CSS Time | Trên W3TC |
| --- | --- |
| Để trống | 1000 ms, tính từ `DOMContentLoaded` |
| Số 0–10 000 | Dùng số đó (ms). Số lớn hơn được đưa về 10 000 |

Trên LiteSpeed, để trống nghĩa là không hẹn giờ, CSS chỉ tải khi tương tác. Nên để trống. Số lớn hơn có thể làm PSI nhích lên, nhưng khách không tương tác sẽ thấy trang chỉ có Critical CSS lâu hơn (font dự phòng, phần dưới chưa có style). Số nhỏ thì CSS về sớm và có thể bị PSI tính. Đổi số thì đo lại 5 lần.

### Dòng VPI

Mỗi dòng trong ô Mobile / Desktop Selector khai báo một nhóm ảnh: `<selector>{N} (replace [sz-<size>-sz] keep lazy)`. Khách điện thoại nhận ô Mobile, máy tính nhận ô Desktop.

| Phần | Ý nghĩa |
| --- | --- |
| Selector CSS | Ảnh cần xử lý. Không có `{N}` thì áp cho mọi ảnh khớp |
| `{N}` | Chỉ lấy ảnh thứ N, đếm từ 0 |
| `replace` | Đổi `src` (và `srcset`) sang size khác của ảnh trong Thư viện Media |
| `[sz-<size>-sz]` | Tên size: `thumbnail` 150, `medium` 300, `medium_large` 768, `large` 1024, `1536x1536`, `2048x2048`, hoặc size của theme. Không ghi thì dùng size mặc định trong Settings |
| `keep` | Giữ ảnh đã đổi size, không để lazyload đổi lại về ảnh gốc |
| `lazy` | Ảnh vẫn tải chậm, không tải trước kể cả khi là dòng cuối. Dùng cho ảnh dưới màn hình đầu |

- Dòng không có `lazy`: bỏ `loading="lazy"`, ảnh tải ngay. Dùng cho ảnh trong màn hình đầu.
- **Dòng cuối** (không có `lazy`) được tải trước (preload) và gắn `fetchpriority="high"`. Ảnh LCP để ở dòng cuối.
- **Dòng là URL ảnh** (ví dụ `https://…/anh.jpg (replace [sz-large-sz] keep)`): cho ảnh nền viết trong file CSS. Plugin đổi URL đó trong Critical CSS sang size đã chọn; là dòng cuối thì ảnh cũng được tải trước. Dòng này chỉ sửa ảnh trong Critical CSS. Khi CSS đầy đủ nạp, ảnh nền về lại ảnh gốc. Sửa tận gốc bằng cách chọn size nhỏ trong page builder.
- **Không cần tạo file size trước.** WordPress tự tạo các size khi tải ảnh lên Thư viện Media; plugin tìm ảnh theo URL rồi lấy URL của size. Cần làm thêm khi:
  - ảnh không nằm trong Thư viện Media (FTP, thư mục theme, domain khác): plugin giữ URL gốc;
  - ảnh gốc nhỏ hơn size yêu cầu: không có bản đó;
  - size được thêm sau khi tải ảnh: chạy Regenerate Thumbnails.

  Kiểm tra bằng cách mở thẳng URL `…-1536x1024.jpg`, hoặc xem thẻ preload trong HTML sau khi purge.

### Critical CSS

- Gọi `w3tc_critical_crawler`, chạy script trả về trên `crawl_url` trong một phiên Chrome mới.
- Dùng crawler MCP, không dùng nút "Craw Desktop / Craw Mobile" trong admin. Bộ cào trong admin bỏ phần trong `[...]` và `(...)` của selector trước khi so, nên thiếu các rule như `[class*="brxe-"]{max-width:100%}` (đã gây CLS 0,11–0,34 trên trang Bricks) và không xuất `@font-face`. Lưu từ admin còn có thể ghi lại dòng đã cố ý gỡ. Sau mỗi lần ai đó cào trong admin, kiểm tra bằng `vnx_list_rows`.
- Lưu nguyên kết quả cào, không sửa tay.
- Trước khi lưu, thử dựng trang chỉ với Critical CSS để chắc màn hình đầu đủ bố cục.
- Lưu bằng `vnx_save_critical_css`, bật các khóa `_client` (mục trên), rồi purge.
- Sửa bố cục trong page builder thì phải cào lại Critical CSS của trang đó.

## Lưu ý từ các site đã làm

- **Điểm PSI mobile lúc cao lúc thấp với cùng cấu hình** (ví dụ 97 và 82) có thể do Google Fonts về muộn:
  - Khi font về muộn, tiêu đề hiện bằng font dự phòng, nhỏ hơn bản font thật, nên phần tử LCP nhảy sang ảnh.
  - Lúc font đổi, tiêu đề cao lên và gây CLS.
  - Cách xem: phần LCP breakdown của lần thấp trên pagespeed.web.dev.
  - Preload ảnh không sửa được lỗi này. Critical CSS mobile + Delay CSS thì sửa được, đổi lại CLS nhỏ (khoảng 0,05–0,065) vì font Google bị hoãn.
  - Crawler không đọc được CSS khác host, nên Critical CSS không có `@font-face` của Google Fonts.
- **Trang có CSS chặn hiển thị:** tạo Critical CSS mobile ngay từ vòng tối ưu đầu, không chờ điểm tụt.
- **Đề xuất phía khách sớm:** nên đề xuất ngay từ đầu cho khách giảm số độ đậm Google Fonts hoặc chọn font dự phòng có kích thước gần với font chính.
- **VPI preload 1 ảnh mỗi thiết bị:** đó là ảnh ở dòng selector cuối cùng (có `fetchpriority=high`), nên thứ tự dòng có ảnh hưởng.
- **Ảnh có `srcset` viết tay trỏ tới file lớn:** dùng `(replace [sz-<size>-sz] keep)` để thay cả `srcset`.
- **Page builder tự lazyload ảnh màn hình đầu** (`src` SVG giữ chỗ): VPI không thay được, phải tắt lazyload cho ảnh đó trong builder. Cài đặt này của Bricks áp cho mọi thiết bị, nên phải đo lại desktop sau khi đổi.
- **Tải thật thường rất nhanh** trong khi PSI chậm, vì PSI giả lập mạng chậm. Lấy PSI làm chuẩn cho điểm, tải thật cho mục "Tốc độ load".

## Báo cáo

Lưu trong `reports/YYYY-MM-DD-ten-mien/`:

| File / thư mục | Nội dung |
| --- | --- |
| `YYYY-MM-DD-ten-mien.md` | Báo cáo kỹ thuật: hiện trạng, nhật ký ghi, các lần đo, kết quả |
| `Báo cáo - Hiện trạng website trước khi tối ưu - <miền>.docx` | Báo cáo Word Phase 1 |
| `Báo cáo - Kết quả sau tối ưu - <miền>.docx` | Báo cáo Word sau tối ưu |
| `Đề xuất bổ sung - <miền>.md` | Việc còn lại: A (người dùng), B (AI), C (không cần làm), kèm bằng chứng |
| `cau-hinh-truoc-toi-uu.json` | Cấu hình trước lần ghi đầu, dùng để khôi phục |
| `assets/` | Ảnh chụp PSI, site health |
| `critical-css/` | CSS đã cào, script crawler, ảnh thử chỉ dùng Critical CSS |
| `sao-luu-noi-dung/` | Bản sao nội dung trang trước khi sửa trong builder |

File Word tạo từ mẫu trong `../shared/` bằng script dùng chung, chạy từ thư mục báo cáo:

```bash
python3 -I ../../../shared/scripts/fill-status-docx.py values.json "<file>.docx"
```

Script thêm lại các dòng Network của DevTools. Người dùng không muốn có các dòng này trong báo cáo kết quả, nên xóa đi sau khi tạo file:

```bash
python3 -I ../../../shared/scripts/rm-network-rows.py "Báo cáo - Kết quả sau tối ưu - <miền>.docx"
```

Tải thật đo bằng `../shared/scripts/measure-run.js` theo skill `w3tc-measure-page-load`.

Không gọi `vnx_save_report`. Báo cáo chỉ lưu ở máy, không ghi lên site.
