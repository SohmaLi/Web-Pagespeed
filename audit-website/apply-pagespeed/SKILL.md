---
name: apply-pagespeed
description: >-
  Áp dụng phương án PageSpeed đã duyệt qua MCP của Vietnix Pagespeed PRO, rồi
  purge đúng page. Dùng khi người dùng chấp nhận báo cáo audit và yêu cầu thực
  thi tối ưu CSS, JS, ảnh hoặc HTML.
---

# Thực thi tối ưu qua MCP

Chỉ chạy ở trường hợp 2 khi host `site_url` trùng miền trong `Do.md` (đã cài plugin, MCP bật, agent nối đúng miền; xem mục **Quy trình** trong `audit-website/README.md`), chỉ trên link người dùng yêu cầu tối ưu (cột **Tối ưu** là `có` ở mục 2 của `Do.md`) và chỉ dòng đã duyệt, trạng thái `proposed`. MCP tắt hoặc `site_url` khác miền thì không chạy skill này: audit dừng ở bước 2b chờ nối MCP đúng miền. MCP tắt thì admin tự lưu trên màn hình plugin. Mỗi thay đổi phải gắn với một thông số chưa đạt của trang (cột **Thông số**, mục **Đánh giá trang** trong README). Bỏ qua dòng `suggestion`, `theo dõi`, `cần plugin` và `ngoài phạm vi`.

Trước tool ghi đầu tiên, gọi `vnx_get_status` và so host `site_url` với miền đang tối ưu. Khác host thì dừng, không gọi tool ghi.

MCP vẫn bật trên site nhưng agent chưa có tool `vnx_*` thì dừng. Báo người dùng và đưa lệnh nối ở mục **Kết nối** trong `audit-website/README.md`, nhắc khởi động lại agent. Không ghi option bằng đường nào khác.

Không dán token MCP hay API key PageSpeed vào báo cáo, log, hoặc file trong repo.

So trước/sau chỉ dùng số trong thư mục báo cáo của lần chạy này, cùng URL, cùng thiết bị, cùng nguồn đo (mục **Nguồn so sánh** trong `audit-website/README.md`). Không so với tên miền khác hay số ví dụ trong `quy-trinh/`.

## Dry-run

Mọi tool ghi gọi trước với `dry_run: true`. Chỉ gọi lại với `dry_run: false` sau khi người dùng xác nhận diff. `dry_run` mặc định là `true`, thiếu field thì không ghi database.

`vnx_set_options` nhận mảng `options`. Mỗi phần tử có `meta_key` và `meta_value`. Công tắc bật là `"1"`, tắt là `""`. Giữ kiểu chuỗi đúng như `vnx_list_options` trả về. Dry-run trả `diff` với `from` và `to`.

```json
{
  "dry_run": true,
  "options": [
    { "meta_key": "delay_js", "meta_value": "1" }
  ]
}
```

## Cấu hình đã có

Site đã có option hoặc dòng plugin từ trước: kiểm tra và kết luận `giữ`, `thay`, `gỡ` theo bước 2b mục 5 trong `audit-website/README.md` trước khi đề xuất thêm. Chỉ ghi các mục `thay`/`gỡ` người dùng đã duyệt.

- Trước lần ghi đầu tiên, lưu `cau-hinh-truoc-toi-uu.json` (bước 3 mục 0 trong README): `vnx_list_options` và `vnx_list_rows` ba bảng, Critical CSS có nội dung. Không ghi đè file ở vòng sau.
- `thay` option: `vnx_set_options` với giá trị mới. Diff dry-run phải có `from` đúng giá trị trong bảng **Cấu hình đã có**. Khác thì có người vừa sửa trong admin: đọc lại `vnx_list_options` và trình lại cho người dùng.
- `thay` dòng VPI hoặc lazyload HTML: gửi kèm `id` của dòng cũ, dry-run phải trả `action: update`. Trả `insert` là thiếu `id`; trả `skip` + `duplicate` là trang đã có dòng khác: dùng `existing_id`.
- `thay` Critical CSS: `vnx_save_critical_css` cùng `type`, `source_id`, cho cả bản mobile và desktop. Chỉ khi đã có nội dung CSS mới.
- `gỡ`: `vnx_remove_row` theo `id` (Critical CSS theo `type` + `source_id`). Gỡ Critical CSS của trang đang bật delay CSS sẽ làm trang mất style: thay bằng bản mới hoặc tắt delay trước.
- Không sửa dòng nhóm đang áp cho trang khác nếu người dùng chưa duyệt rõ. Thêm dòng riêng cho trang đang tối ưu.
- Mỗi lần thay hoặc gỡ ghi vào `.md`: giá trị cũ, giá trị mới, `id`, kết quả kiểm tra HTML.

## Thứ tự

Trang tag: `vnx_resolve_url` trả `body_classes`. Có class `tag-<id>` và `type` là `term` của taxonomy `post_tag` thì không ghi dòng VPI, Critical CSS, lazyload HTML. `get_source_data()` không gọi `is_tag()`, dòng không được áp. Giữ trạng thái `ngoài phạm vi`.

Dòng VPI, Critical CSS, lazyload HTML: báo cáo và dòng `proposed` theo từng link. Trước dry-run, các link được duyệt cùng post type và cùng template thì đề xuất một dòng nhóm (`post_type`, `post_in-<taxonomy>`, `group_post`, `taxonomy`) thay cho từng `post` / ID hay `term` / ID. Người dùng chọn nhóm hay từng trang khi xem diff. Điều kiện, cách thử selector, `craw_id` và purge ở bước 3 mục 3 trong `audit-website/README.md`.

Mỗi trang đi theo thứ tự dưới đây (bước 3 mục 2 trong README), chỉ làm bước gắn với thông số chưa đạt. Mỗi lần ghi: dry-run → người dùng xác nhận → ghi → purge URL đó → mở HTML kiểm tra.

1. `active_all` là công tắc tổng (xem `audit-website/PLUGIN.md`). Đang `"1"` thì giữ. Đang tắt thì báo người dùng rằng bật sẽ áp mọi option đang lưu cho toàn site, chỉ bật khi họ duyệt. Tool `vnx_set_options`.
2. Critical CSS: sinh bằng `vnx_critical_crawler` cho mobile và desktop, kiểm tra trang chỉ với CSS đó, rồi `vnx_save_critical_css` (mục **Sinh Critical CSS** ở bước 3 trong README). Truyền `mobile` dạng chuỗi `"true"`/`"false"`. Không xóa CCSS LiteSpeed (`remove_litespeed_critical`) khi trang chưa có bản Vietnix.
3. Ảnh: `LS_optimize_lazyload` và `vietnix_vpi_active` phải đang bật (option toàn site: đang tắt thì hỏi trước), rồi `vnx_save_vpi` cho ảnh LCP và ảnh trên màn hình đầu. Ảnh màn hình đầu bị `data-vnx-lazy` trong audit thì phải có dòng VPI để nạp ngay.
   - Mỗi `type` + `source_id` chỉ có một dòng VPI: plugin đọc dòng đầu tiên khớp, dòng thêm sau bị bỏ qua. Trước khi thêm, `vnx_list_rows` (`table: vpi`, `type`, `source_id`) xem trang đã có dòng chưa. Có thì sửa dòng đó bằng `id`, hoặc gỡ bằng `vnx_remove_row` (dry-run trước). Dry-run `vnx_save_vpi` báo `action: skip` + `duplicate` khi thêm mới cho trang đã có dòng: dòng đó sẽ không được ghi.
   - Thử selector bằng `vnx_test_selector` cho `mobile` và `desktop`: `count` đúng số ảnh muốn chọn, `hidden` là 0, `above_fold` là `true`. `above_fold` chỉ là ước lượng theo cấu trúc HTML: trên mobile một cột, đối chiếu đỉnh ảnh với viewport trước khi ghi. Ảnh dưới viewport không đưa vào dòng VPI mobile dù gateway trả `above_fold: true`. Logo mobile và logo desktop thường là hai phần tử khác nhau.
   - Ảnh LCP đặt ở **dòng cuối** của mỗi cột: preload và `data-vnx-lcp` gắn vào dòng cuối.
   - Đổi sang ảnh nhỏ hơn: `(replace [sz-…-sz] keep)`, size lấy theo bề rộng hiển thị × DPR. Thiếu `keep` thì script lazyload đổi `src` về ảnh gốc sau đó và khách tải hai lần. Không dùng `(replace)` chung khi `vpi_replace_size_mobile` hoặc `vpi_replace_size_desktop` nhỏ hơn kích thước cần. Gateway không kiểm tra tên size: chỉ dùng size WordPress có sẵn của site.
   - Khách thường chỉ nhận VPI khi `vietnix_vpi_active_client` (và `vpi_replace_size_client` nếu đổi size) bật. Đây là option toàn site: ghi rõ ai thực sự nhận thay đổi, chỉ bật khi người dùng yêu cầu.
   - Cấu trúc `rows`, `type`/`source_id`, `{n}`, `(…)` và preload ở mục 8 trong `audit-website/PLUGIN.md`.
4. Đo lại theo mục 8 để biết Critical CSS và VPI có tác dụng không, trước khi làm tiếp.
5. CSS/JS còn bị PSI báo chậm (render-blocking, `bootup-time`, `unused-javascript`):
   - CSS: chọn một trong delay combined hoặc async combined. Không bật `LS_delay_combined_css` khi `vnx_list_rows` chưa có dòng Critical CSS cho trang đó. Đang bật mà chưa có dòng thì ghi P1: gắn Critical CSS, hoặc không để delay chạy trên trang chưa có CSS (người dùng duyệt `only_optimized` hoặc tắt delay). HTML có `<script id="vnx-inline-delay-css">` mang `type="litespeed/javascript"` thì ghi P1; agent không sửa file plugin.
   - JS: bật `delay_js` và thêm keyword vào `delay_js_list`. Keyword là tên file script, không quá ngắn (`js`). Dòng audit có `keywords` rỗng (ví dụ `mainthread-work-breakdown`) thì không ghi. `jquery` hoặc `wp-includes` chỉ thêm khi người dùng duyệt đúng keyword đó, và gọi kèm `approve_core_keywords: true`. Script inline và `Unattributable` không delay được: đưa vào đề xuất bổ sung phần A.
   - Cả hai là option toàn site: dòng `proposed` ghi rõ áp cho mọi trang. JS delay chỉ chạy cho request guest.
6. HTML: `vnx_save_lazyload_html` cho vùng dưới màn hình đầu. Không chọn header hoặc hero. Thử trước bằng `vnx_test_selector`: `above_fold` phải `false`. Gateway trả `selector_forbidden` khi selector có chữ `header`/`hero` hoặc nằm ở màn hình đầu (kể cả lúc dry-run); trả cảnh báo `above_fold_not_checked` khi trang không có URL (nhóm trang, post không tồn tại): khi đó tự kiểm tra trên trang thật.
7. `litespeed_purge` với đúng một URL của page vừa sửa, cùng host, có trong danh sách purge (40 URL gần nhất đã qua `vnx_analyze_pagespeed`, `vnx_resolve_url`, `vnx_test_selector` hoặc `vnx_critical_crawler`). Nhiều page thì gọi lần lượt. `vnx_remove_row` không đưa URL vào danh sách: sau khi gỡ dòng mà URL chưa có trong danh sách thì gọi `vnx_resolve_url` trước. Bảng VPI hoặc Critical CSS trống mà HTML cache còn `src` thật và preload thì ghi cache cũ, purge, rồi đo trên bản cache mới.
8. Mở page một lần cho cache ấm. Gọi lại `vnx_analyze_pagespeed` 3 lần, cách nhau ít nhất 75 giây (gọi sát nhau thì PSI trả kết quả cache). Cursor hoặc Claude Code đo lại tải thật 3 lần theo skill `measure-page-load`. Lấy trung vị từng chỉ số, chênh lệch trong ngưỡng nhiễu coi là không đổi (mục **Đo nhiều lần**, bước 4 trong `audit-website/README.md`). Kiểm tra ảnh màn hình đầu có `src` là URL ảnh thật (không còn SVG giữ chỗ) và request ảnh LCP bắt đầu trước mốc load. Ảnh đã qua VPI vẫn giữ `data-vnx-lazy="1"`, nên không dùng thuộc tính này để kết luận.
9. Người dùng thao tác trong admin giữa chừng thì gọi lại `vnx_list_options` và `vnx_list_rows` trước khi purge và đo. `active_all` phải còn `"1"`. Nút Lưu chỉ gửi option đã đổi.
10. Nếu trung vị điểm mobile hoặc CLS tệ hơn mốc "trước" quá ngưỡng nhiễu, gọi `vnx_rollback_options`. Tool này chỉ khôi phục option từ lần `vnx_set_options` gần nhất. Dòng Critical CSS, VPI, hoặc lazyload HTML vừa thêm thì gỡ bằng `vnx_remove_row`, cũng dry-run trước, rồi purge URL của trang đó. Cần quay về cấu hình trước khi tối ưu (nhiều lần ghi, hoặc đã thay/gỡ dòng cũ) thì khôi phục từ `cau-hinh-truoc-toi-uu.json` theo bước 4 mục 4 trong `audit-website/README.md`.

## Lỗi gateway

| Mã | Nghĩa | Xử lý |
| --- | --- | --- |
| `critical_css_empty` | CSS rỗng | Không lưu. Cào lại bằng `vnx_critical_crawler` |
| `critical_css_missing` | Lưu CSS thiếu `type`/`source_id`, hoặc bật `remove_litespeed_critical` khi site chưa có dòng Critical CSS nào (gateway không xét từng trang) | Lưu Critical CSS trước; tự kiểm tra trang đang tối ưu đã có dòng |
| `critical_css_file` | Không ghi được file CSS vào uploads | Báo người dùng kiểm tra quyền ghi thư mục uploads |
| `crawler_missing` | Thiếu `assets/js/mcp/critical-crawler.js` trên site | Cài lại plugin |
| `empty_options` | `options` hoặc `rows` rỗng | Kiểm tra lại dữ liệu cần ghi |
| `css_mode_conflict` | Delay combined và async combined (hoặc hai key `_client`) cùng bật sau lần ghi | Dừng, database không đổi. Chọn một trong hai, không ghi đường khác |
| `keyword_not_approved` | Keyword chứa `jquery`/`wp-includes` mà thiếu `approve_core_keywords: true` | Hỏi người dùng duyệt đúng keyword đó, hoặc bỏ keyword |
| `purge_all_forbidden` | Purge all, `tag`, `post_type`, URL rỗng, hoặc URL khác host | Purge lại đúng URL của page |
| `url_not_in_session` | URL cùng host nhưng không có trong danh sách purge | Gọi `vnx_resolve_url` cho URL đó rồi purge lại |
| `url_forbidden` | URL khác host của `home_url`, kể cả khác `www.` | Dùng URL đúng host site đang nối |
| `invalid_option_value` | Sai kiểu: công tắc khác `"1"`/`""`, danh sách không phải mảng chuỗi, `delay_js_time` không phải số 0–10000, key chuỗi nhận mảng | Sửa giá trị, dry-run lại |
| `option_not_allowed` | Key hoặc bảng không có trong danh sách | Xem mục 1–7 trong `PLUGIN.md` |
| `row_invalid` | Dòng thiếu `type` hoặc `source_id` | Thêm hai trường đó |
| `row_not_found` | `id` không có trong bảng (`vnx_save_*`, `vnx_remove_row`) | `vnx_list_rows` lấy đúng `id` |
| `selector_forbidden` | Lazyload HTML chọn header/hero (`header_or_hero`) hoặc phần tử màn hình đầu (`above_fold`) | Chọn khối dưới màn hình đầu |
| `invalid_device` | `device` khác `mobile`/`desktop` | Sửa tham số |
| `page_fetch_failed` | Gateway không tải được HTML của URL | Host chặn request về chính nó, hoặc trang lỗi. Kiểm tra bằng trình duyệt |
| Cảnh báo `html_not_loaded`, `html_not_parsed` | Không tải hoặc không đọc được HTML guest của một thiết bị | Tự kiểm tra ảnh và selector trên trình duyệt |
| Cảnh báo `above_fold_not_checked` | Dòng không có URL (nhóm trang, post không tồn tại) | Tự kiểm tra trên trang thật |
| `pagespeed_api_key_missing` | Agent không gửi header `X-Pagespeed-Api-Key` | Nối lại MCP theo mẫu, hoặc đo bằng key ở `Do.md` |
| `quota_exceeded`, `pagespeed_request_failed` | Hết quota PSI, hoặc PSI lỗi | Dừng đo, báo người dùng. Không bịa số |
| `rollback_empty` | Chưa có lần `vnx_set_options` nào để khôi phục | Khôi phục từ `cau-hinh-truoc-toi-uu.json` nếu cần |
| `litespeed_inactive` | LiteSpeed đang tắt | Option vẫn đã ghi. Báo người dùng, bỏ bước purge |
| `litespeed_conf_forbidden` | Ghi conf LiteSpeed | Không có đường ghi. Giữ dòng ở mục Đề xuất |

## Cấm

- Ghi cấu hình LiteSpeed. Không có tool ghi `litespeed.conf.*`.
- `litespeed_purge_all`, `purge_all`, purge theo `tag`, purge theo `post_type`, URL rỗng, URL khác page đang tối ưu.
- Gọi `litespeed_buffer_finalize` hoặc `litespeed_optm_html_head`. Hai hook đó plugin đã gắn khi render trang.
- Bật delay combined và async combined cùng lúc.
- Bật `LS_delay_combined_css` cho trang chưa có dòng Critical CSS.
- Áp dòng đề xuất minify, combine, UCSS, CCSS, JS defer, JS delay, lazyload, guest mode, cache của LiteSpeed.

## Báo cáo

Double check (Point + Site health) và nghiệm thu theo bước 4 trong mục **Quy trình** của `audit-website/README.md`. Chưa đạt mà còn việc plugin làm được thì đề xuất dòng mới, hỏi người dùng rồi làm thêm vòng. Đạt hoặc hết việc plugin làm được thì đo điểm cuối (nghiệm thu) và sửa đúng file `audit-website/reports/YYYY-MM-DD-ten-mien/YYYY-MM-DD-ten-mien.md` của lần kiểm tra này. Không lưu báo cáo lên site. Dòng đã ghi là `applied`, dòng người dùng bỏ là `skipped`. Mục Đề xuất LiteSpeed giữ `suggestion`. Thêm điểm sau và thời gian tải thật sau, giữ cả số trước. Ảnh chụp sau tối ưu lưu vào `assets/` của cùng thư mục. AI kết thúc sau báo cáo nghiệm thu; đổi sang plugin lite là việc của người dùng.

Có việc còn lại (dòng `ngoài phạm vi`, audit mới sau tối ưu, việc trong admin) thì tạo `Đề xuất bổ sung - ten-mien.md` cùng thư mục, theo mục **Đề xuất bổ sung** trong `audit-website/README.md`.
