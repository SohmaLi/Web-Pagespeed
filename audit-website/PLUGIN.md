# Vietnix Pagespeed PRO — cách plugin hoạt động

Đọc file này trước khi đề xuất hoặc ghi option, dòng VPI, Critical CSS, lazyload HTML. Mục 1–9 là cách plugin xử lý trang (mã frontend `inc/frontend/*.php`), mục 10 là các tool MCP agent dùng (`inc/mcp/`). Mã nguồn: `~/Documents/vietnix/wordpress/vietnix.vn/wp-content/plugins/vietnix-pagespeed-pro`. Thấy plugin chạy khác file này thì đọc lại mã nguồn.

Option lưu trong `wp_options` với tiền tố `vnx_` (ví dụ `vnx_delay_js`). Qua MCP chỉ dùng tên không có tiền tố.

## 1. Khi nào plugin tối ưu một request

Mọi tính năng đi qua `is_optimize()`:

| Điều kiện | Kết quả |
| --- | --- |
| Trang giỏ hàng, thanh toán, tài khoản WooCommerce, `?add-to-cart`, `?download_file` | Không tối ưu |
| URL `.xml`, `.xsl`, `.ico`, AJAX, cron, wp-admin, trang đăng nhập | Không tối ưu |
| URL có `vnx-crawl=<token>` còn hạn (do `vnx_critical_crawler` tạo) | Không tối ưu, LiteSpeed không cache request đó |
| Request guest của LiteSpeed (`LITESPEED_GUEST`, Guest Mode bật) và `active_all` = `1` | Tối ưu. Key thường áp dụng, không cần key `_client` |
| Người dùng đã đăng nhập | Không tối ưu |
| `active_all` khác `1` | Không tối ưu |
| Khách thường (không phải guest) | Chỉ tối ưu khi key `_client` của tính năng đó = `1` |

Hệ quả:

- `active_all` là **công tắc tổng**. Tắt thì không tính năng nào chạy. Không phải "tối ưu cả site thay vì một trang".
- Key không hậu tố là công tắc chính của tính năng. Key `_client` là công tắc phụ, mở thêm cho khách không phải guest. Tính năng chạy cho khách thường khi **cả hai** key = `1`.
- JS (`delay_js`, `optimize_ls_delay_js`, `bot_verifying_popup`, `flatsome_prefetch`) và `additional_css` không có key `_client`: chỉ chạy cho request guest.
- Admin đang đăng nhập không bao giờ thấy bản tối ưu. Đo bằng trình duyệt chưa đăng nhập.
- Option là toàn site. Muốn chỉ một trang thì dùng dòng theo trang (VPI, Critical CSS, lazyload HTML) hoặc loại trừ ở mục 7.

Thứ tự xử lý HTML trong `litespeed_buffer_finalize` (số nhỏ chạy trước):

| Ưu tiên | Hàm | Option |
| --- | --- | --- |
| 30 | `delay_litespeed_combined_css` | `LS_delay_combined_css` |
| 35 | `async_litespeed_combined_css` | `ls_async_combined_css` |
| 35 | `viewport_image_init` | `vietnix_vpi_active` + dòng VPI |
| 40 | `optimize_litespeed_lazyload` | `LS_optimize_lazyload` |
| 50 | `lazyload_picture_element` | `LS_optimize_lazyload` |
| 50 | `add_lazyload_html_data` | `lazyload_html` + dòng lazyload HTML |
| 50 | `add_robot_verifying_popup` | `bot_verifying_popup` |
| 60 | `remove_litespeed_critical_css` | `remove_litespeed_critical` |
| 60 | `optimize_ls_delay_js` | `optimize_ls_delay_js` |
| 70 | `delay_javascript_by_js` | `delay_js` + `delay_js_list` |
| 80 | `delay_style_tags` | `delay_style_tags` |
| 90 | `delay_styles_by_keyword` | `style_by_keyword` |

`litespeed_optm_html_head` chèn `add_critical_css` (10) và `head_async_css_script` (30) vào đầu `<head>`.

Mọi bước trên chạy khi LiteSpeed dựng trang. Trang đã cache chỉ đổi sau khi purge.

## 2. Kiểu giá trị option

| Kiểu | Key | Giá trị |
| --- | --- | --- |
| Công tắc | Hầu hết key | `"1"` bật, `""` tắt. Giá trị khác `"1"` coi như tắt |
| Số | `delay_js_time` | Mili giây. Rỗng, âm hoặc trên `10000` thành `10000` |
| Chọn size | `vpi_replace_size_desktop`, `vpi_replace_size_mobile` | Tên size WordPress (`medium`, `medium_large`, `large`…). Rỗng là không thay |
| Mảng | `delay_js_list`, `style_by_keyword`, `style_by_script`, `delay_style_tags` | Admin lưu mảng, mỗi phần tử một keyword hoặc selector. Qua MCP, dry-run trước để xem `to` lưu đúng kiểu mảng |
| Chuỗi nhiều dòng | `exclude_post_id`, `exclude_term_id`, `exclude_archives` | Một giá trị một dòng (`\n`) |
| Chuỗi, cách nhau dấu phẩy | `critical_include`, `critical_exclude` | Đoạn URL file CSS. Bộ cào Critical CSS chỉ lấy (hoặc bỏ) file `<link>` có URL chứa một đoạn trong danh sách. Rỗng là lấy mọi file cùng host |
| CSS | `critical_added`, `critical_added_after`, `additional_css` | CSS thô |

Gateway MCP kiểm tra kiểu khi ghi (`invalid_option_value` nếu sai): công tắc chỉ nhận `"1"` hoặc `""`; bốn key mảng phải là mảng chuỗi; `delay_js_time` là số nguyên 0–10000; các key chuỗi không nhận mảng. Tên size VPI không được kiểm tra: chỉ dùng size site đang có.

## 3. CSS

| Key | Cách chạy | Lưu ý |
| --- | --- | --- |
| `LS_delay_combined_css` (+ `_client`) | Đổi mọi `<link rel="stylesheet" href=…>` (đúng thứ tự thuộc tính đó) và link UCSS async của LiteSpeed thành `rel="preload"` trỏ file CSS rỗng, URL thật ở `data-href`. CSS thật chỉ nạp khi người dùng tương tác (`mouseover`, `click`, `keydown`, `wheel`, `touchmove`, `touchstart`), **không có timer** | Cần Critical CSS cho trang, nếu không trang hiện không style đến khi tương tác. Áp cả khi LiteSpeed không gộp CSS. Khi UCSS nạp xong, khối Critical CSS Vietnix bị tắt (`media="null"`) |
| `ls_async_combined_css` (+ `_client`) | Chỉ đổi `link[data-optimized=2]` (CSS gộp hoặc UCSS của LiteSpeed) sang preload, `onload` thành stylesheet | Cần LiteSpeed bật `optm-css_comb` hoặc `optm-ucss`. Delay đang bật thì async tự bỏ qua. Gateway MCP trả `css_mode_conflict` khi cặp delay/async (hoặc cặp `_client` của chúng) cùng bật sau lần ghi |
| `remove_litespeed_critical` (+ `_client`) | Xóa `<style id="litespeed-ccss">` | Chỉ bật khi trang đã có Critical CSS Vietnix. Gateway chỉ kiểm tra site có ít nhất một dòng Critical CSS (`critical_css_missing` nếu không có), không kiểm tra từng trang |
| `vnx_critical_client` | Với guest, Critical CSS Vietnix luôn chèn khi trang có dòng CCSS. Key này mở thêm cho khách thường | Không có công tắc chính. Guest luôn nhận CCSS nếu có dòng |
| `style_by_script` (+ `_client`) | Mảng handle stylesheet WordPress. Gỡ đăng ký rồi nạp lại bằng JS sau tải | Handle là ID của `wp_enqueue_style`, không có hậu tố `-css` |
| `style_by_keyword` (+ `_client`) | Mảng keyword. `<link>` nào có keyword trong `outerHTML` thì delay như delay combined | |
| `delay_style_tags` (+ `_client`) | Mảng selector thẻ `<style>`, nhận `{n}`. Đặt `media="null"`, bật lại ở `DOMContentLoaded` | Chỉ áp thẻ `<style>`, bỏ qua thẻ nằm trong `<noscript>` |
| `critical_added`, `critical_added_after` | Chèn trước và sau nội dung CCSS | Khối CCSS luôn bắt đầu bằng `body{overflow-x:hidden;margin:0}` |
| `additional_css` | In `<style id="vnx-additional-css">` trong `<head>` | Chỉ guest |

Loại trừ ở mục 7 chỉ áp cho các tính năng CSS trong bảng này.

Ba script nạp CSS của plugin (`vnx-inline-delay-css`, `vnx-inline-asyns-css`, `vnx-inline-delay-style-tag`) có `data-no-optimize="1"` và `data-no-defer="1"` để LiteSpeed JS delay không hoãn chúng. HTML thấy các script này mang `type="litespeed/javascript"` thì CSS chỉ nạp sau bộ nạp JS của LiteSpeed: ghi P1 (skill `audit-pagespeed`, mục Q).

## 4. JS

Chỉ chạy cho request guest.

| Key | Cách chạy |
| --- | --- |
| `delay_js` + `delay_js_list` | Script không có `type`, hoặc `type` là `text/javascript`/`application/javascript`, mà `outerHTML` chứa một keyword trong `delay_js_list` thì đổi `src` sang `data-src` (script inline được mã hóa base64). Nạp lần lượt, mỗi script cách 100 ms, khi người dùng tương tác hoặc sau `delay_js_time` |
| `delay_js_time` | Mốc nạp script delay, tối đa 10000 ms. Cũng là timer ảnh lazyload khi `optimize_ls_delay_js` bật |
| `optimize_ls_delay_js` | Script inline có `litespeed_ui_events` (JS delay của LiteSpeed) bị giữ đến `delay_js_time` |
| `bot_verifying_popup` | Khi LiteSpeed reload trang vì `litespeed_vary`, hiện popup "verifying you are not a robot" |
| `flatsome_prefetch` | Gỡ `flatsome_prefetch_scripts` của theme Flatsome |

Keyword so khớp chuỗi con trong `outerHTML`. Keyword ngắn như `js` sẽ delay gần hết script. Keyword nào chứa `jquery` hoặc `wp-includes` (kể cả `jquery-migrate`) cần `approve_core_keywords: true` qua MCP, nếu không gateway trả `keyword_not_approved`. `keywords` do `vnx_analyze_pagespeed` đề xuất chỉ lấy từ file script (bỏ URL trang, tức script inline, và `Unattributable`; tên không đuôi lấy 2 đoạn cuối, ví dụ `gtag/js`); khi chỉ còn script inline, dòng audit có trạng thái `ngoài phạm vi`. Dòng `mainthread-work-breakdown` lấy `keywords` từ `bootup-time` cùng báo cáo (có `keywords_from: bootup-time`); khi `bootup-time` không có file script nào, dòng đó có trạng thái `ngoài phạm vi`.

## 5. Ảnh

### Lazyload (`LS_optimize_lazyload`, + `_client`)

- Cần LiteSpeed bật `media-lazy`. Plugin đổi `<img data-lazyloaded="1"` của LiteSpeed thành `<img data-vnx-lazy="1"`: `src` là SVG giữ chỗ, ảnh thật ở `data-src`.
- Mọi `<source srcset>` chuyển sang `data-srcset`.
- Ảnh nạp khi người dùng tương tác (`mouseover`, `keydown`, `touchstart`, `touchmove`, `wheel`; không gồm `click`) hoặc khi hết timer:

| Request | Timer |
| --- | --- |
| Guest | 4000 ms |
| Guest, `optimize_ls_delay_js` bật | `delay_js_time` |
| Khách thường | 100 ms |

Lighthouse không tương tác, nên với guest ảnh màn hình đầu xuất hiện sau ~4 s. Đây là nguồn của lỗi "Giật ảnh do tải chậm". Cách sửa là dòng VPI cho ảnh màn hình đầu. Không tắt lazyload toàn site.

### VPI (`vietnix_vpi_active`, + `_client`)

Đổi size bằng `(replace)` chạy cho guest luôn, cho khách thường khi `vpi_replace_size_client` = `1`.

VPI chạy trước lazyload (ưu tiên 35 so với 40). Với mỗi selector trong dòng VPI của trang:

| Phần tử khớp | Việc plugin làm |
| --- | --- |
| `<img>` LiteSpeed đang lazyload | Bỏ `data-lazyloaded`, `src` = ảnh thật (đổi size nếu có `(replace)`), bỏ `loading="lazy"` và `decoding`. Vẫn giữ `data-vnx-lazy="1"` |
| `<img>` không lazyload | Chỉ đổi size khi có `(replace)`, bỏ `loading="lazy"` |
| `<picture>` cha | `<source srcset>` chuyển `data-srcset` (guest luôn; khách thường khi `vpi_replace_size_client` = `1`) |
| Phần tử có `style="background…url()"` | Đổi size ảnh nền khi có `(replace)` |
| Thẻ `<style>` | Đổi size mọi `url()` khi có `(replace)`, trả lại URL gốc khi người dùng tương tác |
| Selector **dòng cuối** | Thêm `<link rel="preload" as="image" fetchpriority="high">` cho mọi phần tử khớp, phần tử cuối có thêm `data-vnx-lcp="1"` và `fetchpriority="high"` |

Kiểm tra VPI đã có tác dụng: ảnh có `src` là URL thật và `<head>` có preload. Không dựa vào `data-vnx-lazy`.

## 6. HTML (`lazyload_html`, + `_client`)

- Thêm class `vnx_lazyload_html` cho phần tử khớp selector trong dòng lazyload HTML của trang.
- CSS `content-visibility:hidden; contain-intrinsic-size:1px 1000px` đến khi phần tử còn cách khung nhìn 300 px phía dưới (IntersectionObserver), rồi thêm class `html_loaded`.
- Khối không hiện sẽ giữ chỗ cao 1000 px. Chọn khối dưới màn hình đầu. Không chọn header, hero, khối có anchor link hoặc nội dung SEO cần thấy ngay.

## 7. Loại trừ trang

Chỉ áp cho tính năng CSS (mục 3). VPI, lazyload ảnh, JS, lazyload HTML vẫn chạy trên trang bị loại trừ.

| Key | Cách chạy |
| --- | --- |
| `only_optimized` | Bỏ tính năng CSS trên trang chưa có dòng Critical CSS |
| `exclude_home` | Bỏ tính năng CSS trên trang chủ |
| `exclude_post_id` | Post ID, một dòng một ID |
| `exclude_term_id` | Term ID, một dòng một ID |
| `exclude_archives` | Tên post type của trang archive, một dòng một type |

## 8. Dòng theo trang: VPI, lazyload HTML, Critical CSS

### Xác định trang

Plugin lấy `type`/`source_id` của request như sau:

| Trang | Lượt 1 | Lượt cuối |
| --- | --- | --- |
| Trang chủ (`is_front_page`) | `home` / `home` | — |
| Archive post type | `archive` / tên post type | — |
| Trang bài viết (`page_for_posts`) | `post` / ID trang đó | `post_type` / post type |
| Post, page, sản phẩm (`is_singular`) | `post` / post ID | `post_type` / post type |
| Danh mục (`is_category`), taxonomy tùy chỉnh (`is_tax`) | `term` / term ID | `taxonomy` / tên taxonomy |

Với `post`, nếu không có dòng `post`/ID, plugin thử lần lượt: `group_post` → `post_in-<taxonomy>` → `post_body_class` → `post_type`. Với `term`, thử `taxonomy`.

| `type` | `source_id` | Áp cho |
| --- | --- | --- |
| `home` | `home` | Trang chủ |
| `post` | Post ID | Một post hoặc page |
| `group_post` | Nhiều post ID, cách nhau dấu phẩy | Nhóm post dùng chung bố cục |
| `post_in-<taxonomy>` | Term ID, cách nhau dấu phẩy | Mọi post thuộc các term đó, ví dụ `post_in-product_cat` |
| `post_body_class` | Class trên `<body>`, cách nhau dấu phẩy | Mọi post có class đó, ví dụ `single-product` |
| `post_type` | Tên post type | Mọi post của type đó, ví dụ `product` |
| `archive` | Tên post type | Trang archive của type đó |
| `term` | Term ID | Một danh mục hoặc một term của taxonomy tùy chỉnh. Không áp cho trang tag |
| `taxonomy` | Tên taxonomy | Mọi term của taxonomy đó |

Lấy ID bằng `vnx_resolve_url`. Kết quả có `body_classes`. Chưa có MCP thì lấy từ class `home`, `page-id-N`, `postid-N`, `term-N` trên `<body>`.

Trang tag không nằm trong `get_source_data()`: hàm không gọi `is_tag()`. `vnx_resolve_url` vẫn trả `term` khi `<body>` có class `tag-<id>`. Dòng VPI, Critical CSS hoặc lazyload HTML ghi cho `term` đó không được frontend áp dụng. Khi audit gặp class `tag-<id>` và taxonomy `post_tag`, ghi `ngoài phạm vi`, không đưa vào bước ghi.

Khi trang không có dòng riêng, frontend chạy thêm `group_post`, `post_in-*`, `post_body_class` cho **mọi loại trang**, không riêng post. Ví dụ dòng `post_body_class` với `source_id` là `page` cũng áp cho trang chủ nếu `<body>` của trang chủ có class `page`.

**Mỗi `type` + `source_id` chỉ một dòng.** Plugin đọc dòng đầu tiên khớp, dòng sau bị bỏ qua dù đúng. Trước khi thêm, đọc bảng bằng `vnx_list_rows`. Có dòng cũ thì sửa dòng đó bằng `id` hoặc gỡ bằng `vnx_remove_row` rồi mới thêm.

Trang chủ không rơi về `post_type`. Dòng `post` / ID trang chủ không có tác dụng, phải dùng `home` / `home`.

### Dòng VPI và lazyload HTML

Cùng cấu trúc:

```json
{
  "dry_run": true,
  "rows": [
    { "type": "home", "source_id": "home",
      "mobile_data": "img#hero",
      "desktop_data": "img#hero" },
    { "type": "post", "source_id": "123",
      "mobile_data": "img.card__img{0}",
      "desktop_data": "img.card__img{0}\nimg.card__img{1}" }
  ]
}
```

- Thêm `"id"` thì sửa dòng có id đó, không có thì thêm dòng mới. Thiếu `type` hoặc `source_id` thì gateway trả `row_invalid`.
- `mobile_data` dùng khi `wp_is_mobile()` đúng, `desktop_data` cho trường hợp còn lại. Để trống một cột thì thiết bị đó không có VPI.
- Mỗi dòng một selector, cách nhau `\n`.
- Dry-run trả `action` cho từng dòng: `insert`, `update`, hoặc `skip` (kèm `duplicate`, `duplicate_in_request`, hoặc `empty_row` khi cả `mobile_data` lẫn `desktop_data` đều rỗng, có `ignored_keys` nếu gửi sai tên trường). Chi tiết ở mục 10.

Cú pháp một dòng selector:

```text
<selector CSS>{n} (tùy chọn)
```

| Phần | Ý nghĩa |
| --- | --- |
| `<selector CSS>` | Cú pháp simple_html_dom: `tag`, `#id`, `.class`, `[attr=value]`, `[attr*=value]`, dấu cách, `>`, `+`, `~`. Không có pseudo-class (`:nth-child`, `:first-child`…): dùng `{n}` thay thế |
| `{n}` | Chỉ lấy phần tử thứ n, đếm từ 0. `{-1}` là phần tử cuối. Không có thì lấy mọi phần tử khớp |
| `(…)` | Tùy chọn của VPI, gộp trong một cặp ngoặc đầu tiên: `replace` đổi sang size ở `vpi_replace_size_*`; `[sz-<size>-sz]` đổi sang size chỉ định, ví dụ `(replace [sz-large-sz])`; `srcset` chuyển `srcset` sang lazy; một URL ảnh `https://…` để preload ảnh nền có trong Critical CSS. Mặc định `replace` chỉ là ảnh tạm: `data-src` giữ ảnh gốc và script lazyload đổi về ảnh gốc sau (tải 2 lần). Thêm `keep`, ví dụ `(replace [sz-1536x1536-sz] keep)`, để giữ size nhỏ luôn: `data-src` cũng trỏ bản nhỏ, bỏ `srcset`/`sizes`, thẻ `<style>` không trả lại URL gốc |

Ví dụ:

```text
img#hero
img.card__img{0}
.hero-slide img{0} (replace [sz-large-sz])
.banner (https://ten-mien/wp-content/uploads/banner.webp)
```

Preload (`<link rel=preload>`, `data-vnx-lcp`, `fetchpriority=high`) gắn cho **dòng selector cuối cùng** của cột thiết bị: đặt ảnh LCP ở dòng cuối.

Thử selector trên HTML thật của trang trước khi ghi bằng `vnx_test_selector` (đúng bộ parser của plugin, kể cả `{n}`). Selector có thể đúng ở desktop nhưng không có ở HTML mobile.

Selector lazyload HTML dùng cùng cú pháp `{n}`, không có tùy chọn `(…)`.

### Critical CSS

| Trường | Giá trị |
| --- | --- |
| `type`, `source_id` | Như bảng trên |
| `mobile` | Chuỗi `"true"` (bản mobile) hoặc `"false"` (desktop). Frontend chỉ khớp đúng hai chuỗi này; gateway tự chuẩn hóa (`true`, `1`, `mobile`, `yes` thành `"true"`, còn lại `"false"`). Mỗi trang cần hai dòng |
| `css` | Nội dung CSS. Rỗng trả `critical_css_empty` |
| `craw_id` | ID post hoặc term mẫu đã dùng để sinh CSS, cho `type` nhóm (`post_type`, `taxonomy`, `group_post`, `post_in-*`, `post_body_class`) |

CSS lưu thành file trong thư mục uploads của plugin. Lưu lại cùng `type` + `source_id` + `mobile` thì cập nhật dòng cũ và xóa file cũ. `vnx_list_rows` còn báo `duplicates` thì frontend đang dùng dòng cũ nhất: gỡ bằng `vnx_remove_row` rồi lưu lại. `vnx_remove_row` với `table` Critical CSS gỡ theo `type` + `source_id`, xóa cả bản mobile và desktop cùng file.

Sinh nội dung bằng `vnx_critical_crawler` (mục 10) hoặc nút Craw trong admin. MCP không tự sinh CSS khi lưu.

## 9. Mẹo kiểm tra

| Việc | Cách |
| --- | --- |
| Xem HTML theo thiết bị | Thêm `?vnx-device=mobile` (hoặc `desktop`) vào URL **và** gửi UA cùng thiết bị. Tham số chỉ ép `wp_is_mobile()` của plugin; LiteSpeed vẫn chọn bản tối ưu và cache theo UA. Đã thấy trên LiteSpeed: `?vnx-device=mobile` kèm UA desktop trả bản không lazyload, `no-cache`. URL có query string được cache riêng, không đụng cache của URL gốc. Chỉ dùng để xem HTML, không dùng để đo tốc độ |
| Ẩn admin bar khi xem lúc đăng nhập | `?vnx-pagespeed=1`. Đăng nhập thì vẫn không tối ưu |
| Bản HTML cache vừa dựng | Header `x-litespeed-cache: miss` lần đầu sau purge, `hit` lần sau |
| Log | `active_debug` = `1` và IP được phép thì ghi `VNX_LOG` vào error log PHP. Chỉ bật khi cần, tắt sau khi xong |

## 10. Tool MCP

Mã ở `inc/mcp/`. Endpoint, token, header API key: xem mục **Kết nối** trong `README.md`. Tham số và mã lỗi của từng tool: mục **Tool** trong `README.md` và bảng **Lỗi gateway** trong skill `apply-pagespeed`.

Mọi tool nhận `url` so host của URL với host của `home_url` theo đúng chữ, kể cả `www.`: khác thì trả `url_forbidden`. URL trong `Do.md` phải dùng đúng host site trả về (có hoặc không có `www.`).

| Tool | Cách chạy |
| --- | --- |
| `vnx_get_status` | Trả `plugin_active`, `version`, `site_url`, `home_url`, `mcp_enabled`, `litespeed_active`, `pagespeed_api_key_header` (`present`/`missing`), `rows` (số dòng mỗi bảng) |
| `vnx_analyze_pagespeed` | Gọi PSI v5 mobile và desktop bằng key trong header (thiếu key: `pagespeed_api_key_missing`; hết quota: `quota_exceeded`). Map audit dưới 0,9 sang `rows`; bỏ audit `notApplicable`/`manual`/`error`. Thêm dòng `vnx-lazy-hero` từ HTML guest. Ghi URL vào danh sách purge |
| `vnx_list_rows` | Đọc bảng `vpi`, `lazyload_html`, `critical_css`. Critical CSS gộp mobile/desktop theo `type` + `source_id`, kèm nội dung CSS, và báo `duplicates` khi còn dòng trùng frontend không dùng |
| `vnx_resolve_url` | Tải HTML guest desktop, đọc class `<body>`, xác định `type`/`source_id` theo thứ tự frontend: trang chủ, archive, trang bài viết, singular, term (dự phòng `taxonomy`). Trả `body_classes`, chuỗi dò và dòng khớp đầu tiên ở từng bảng. Ghi URL vào danh sách purge |
| `vnx_test_selector` | Tải HTML guest theo `device`, đếm phần tử khớp (cú pháp VPI, có `{n}`), báo `above_fold` và `hidden`: số phần tử bị ẩn bởi CSS inline của trang (Critical CSS Vietnix, thẻ `<style>`, `style="display:none"`, thuộc tính `hidden`); phần tử ẩn không tính vào `above_fold`. Ghi URL vào danh sách purge |
| `vnx_critical_crawler` | Không ghi gì lên site ngoài token tạm. Trả `crawl_url` (`?vnx-pagespeed=true&vnx-device=…&vnx-crawl=<token>`, token sống 15 phút), `viewport` và `user_agent` giống nút Craw (mobile 412×832 DPR 1,75, desktop 1350×940), `options` (`critical_include`/`critical_exclude`, `additional`, `exclude`), `save` (`type`, `source_id`, `mobile` dạng chuỗi), `existing_critical_css`, `steps` và `script` (`assets/js/mcp/critical-crawler.js`). Ghi URL vào danh sách purge |
| `vnx_set_options` | Kiểm tra key, kiểu giá trị, xung đột delay/async CSS, keyword `jquery`/`wp-includes`, Critical CSS khi bật `remove_litespeed_critical`. Chụp giá trị cũ của các key sắp ghi để `vnx_rollback_options` khôi phục |
| `vnx_save_critical_css` | Lưu CSS đã có (mục 8). Dry-run trả `action` `insert`/`update` và `replaces_ids` |
| `vnx_save_vpi`, `vnx_save_lazyload_html` | Trả `action` từng dòng (`insert`, `update`, `skip`). Dòng không có `mobile_data` lẫn `desktop_data` bị `skip` với `empty_row` (kèm `ignored_keys` nếu có trường lạ); muốn xóa selector của trang thì dùng `vnx_remove_row`. Lazyload HTML từ chối selector có chữ `header`/`hero` hoặc nằm ở màn hình đầu (`selector_forbidden`), kể cả khi dry-run |
| `vnx_remove_row` | Gỡ một dòng VPI hoặc lazyload HTML theo `id`, hoặc Critical CSS theo `type` + `source_id`. Không purge, không ghi URL vào danh sách purge |
| `vnx_rollback_options` | Ghi lại giá trị của lần `vnx_set_options` gần nhất. Chưa có lần ghi nào: `rollback_empty` |
| `litespeed_purge` | Chỉ một URL cùng host, có trong danh sách purge |

**Danh sách purge** là 40 URL gần nhất đã qua `vnx_analyze_pagespeed`, `vnx_resolve_url`, `vnx_test_selector` hoặc `vnx_critical_crawler`. Danh sách lưu trên site (option `vnx_mcp_session_urls`), dùng chung cho mọi agent và không mất khi khởi động lại agent. URL ngoài danh sách trả `url_not_in_session`.

**Bộ cào Critical CSS** (`critical-crawler.js`) chạy trong trang mở bằng `crawl_url`: chờ 1,5 giây, giữ phần tử trong màn hình đầu kể cả khi tràn ngang, giữ rule ẩn/định vị của menu, dropdown, khối ngoài màn hình; giữ `@media`, `@supports`, `@layer`, `@font-face` đang dùng và `@keyframes` được nhắc tới; xuất rule theo thứ tự stylesheet. Chỉ đọc file `<link rel="stylesheet">` cùng host, không đọc thẻ `<style>` inline. Kết quả `{ css, stats }`; agent tự kiểm tra trang chỉ với CSS đó rồi lưu bằng `vnx_save_critical_css`.

Tải HTML guest: `wp_safe_remote_get` tới chính site, thêm `?vnx-device=` và UA khớp thiết bị (Android Chrome cho mobile, Chrome desktop cho desktop). Host chặn request về chính nó thì tool trả `html_not_loaded`/`page_fetch_failed`.

"Màn hình đầu" do gateway đoán theo cấu trúc HTML, không đo vị trí:

- Header của site (`<header>` không nằm trong `main`/`article`/`section`).
- Khối chứa phần tử LCP của PSI, hoặc khối nội dung đầu tiên trong `<main>` khi không có LCP. Khối là `<section>` ngoài cùng, hoặc con trực tiếp của `<main>`/`<body>`.
- Khối kế tiếp, khi khối đầu là banner ngắn: không có ảnh, ảnh nền, video, chữ dưới 400 ký tự.
- Với ảnh trong khối nội dung: chỉ 2 ảnh đầu (mobile) hoặc 4 ảnh đầu (desktop). Khối bao ngoài các khối trên cũng tính là màn hình đầu.
- Phần tử có `data-vnx-lcp`, hoặc tên class/id có `header`/`hero`.

Theme không dùng `<main>`/`<section>` có thể bị đoán lệch. Xem trang thật trước khi ghi VPI hoặc lazyload HTML.

Dòng `vnx-lazy-hero`: bỏ qua ảnh bị ẩn như `hidden` ở trên (chỉ đọc CSS inline và `@media` theo chiều rộng 412/1350, không đọc file CSS ngoài); tối đa 3 ảnh mỗi thiết bị, selector là `tag#id` hoặc `tag.class{n}` (class ít trùng nhất). Ảnh không có id và class thì bỏ qua kèm cảnh báo `selector_not_found`, không trả selector chung.

Nút **Lưu thay đổi** trong admin (`assets/js/admin/save.js`) chỉ gửi option đã đổi so với lần mở trang hoặc lần lưu gần nhất. Sau khi người dùng bấm Lưu, vẫn đọc lại `vnx_list_options` để chắc thay đổi qua MCP còn nguyên.
