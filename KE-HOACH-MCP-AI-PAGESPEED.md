# Kế hoạch phát triển plugin tối ưu

Vietnix Pagespeed PRO giữ nguyên mọi tối ưu đang có. Phần phát triển mới là lớp MCP để agent (Cursor, Claude, Codex và client MCP khác) phân tích PageSpeed, lập báo cáo, rồi thực thi bằng đúng chức năng plugin.

Từ 2026-10-16, quy trình vận hành chia hai giai đoạn: **Phase 1** khảo sát (đo, báo cáo hiện trạng) và **Phase 2** tối ưu và nghiệm thu. Mục 1–8 dưới đây tóm tắt theo quy trình đó. Chi tiết từng bước: `audit-website/README.md` mục **Quy trình**; sơ đồ và lý do thay đổi: `audit-website/quy-trinh/`. Mục 9 trở đi là nhật ký sửa plugin theo từng bản, giữ nguyên.

## 1. Mục tiêu

- AI kiểm tra URL, nêu lý do trang chậm và điểm PageSpeed thấp.
- Một endpoint MCP trên website, không gắn với một agent cố định.
- AI tối ưu bằng option của plugin PRO. Với LiteSpeed chỉ xóa cache đúng page đang tối ưu.
- Hai trường hợp, chọn theo yêu cầu của khách: **1** chỉ khảo sát (Phase 1, không cần plugin); **2** khảo sát và tối ưu (Phase 1 nếu chưa có báo cáo, rồi Phase 2 đến nghiệm thu).
- AI kết thúc sau báo cáo nghiệm thu. Đổi sang plugin lite là việc của người dùng.

## 2. Nguyên tắc

- Không viết lại bộ lọc frontend. MCP ghi option qua `VNX_Ajax::save_option()` đang có.
- MCP mặc định tắt. Tắt MCP thì admin vẫn tối ưu thủ công trên các tab hiện có: bật option, lưu Critical CSS, VPI, lazyload HTML, rồi purge từng page trên LiteSpeed. Không cần API key PageSpeed cho đường thủ công.
- Delay combined CSS và async combined CSS không bật cùng lúc.
- LiteSpeed không bị ghi cấu hình. Chín thông số minify CSS, combine CSS, UCSS, CCSS, JS defer, JS delay, lazyload, guest mode và cache chỉ hiện ở mục Đề xuất của báo cáo.
- Action LiteSpeed duy nhất được gọi là `litespeed_purge_url` cho page đang tối ưu. Không có `litespeed_purge_all`.
- PHP 7.4. Server MCP tự viết theo Streamable HTTP. Không dùng WordPress Abilities API.
- Token MCP chỉ tạo khi admin có quyền `manage_options` bật MCP. Request của agent kiểm tra token, không dùng cookie.
- Khi bật MCP và đã có API key, màn hình hiện các mẫu kết nối theo từng agent: Cursor, Claude Code, Claude và Codex. Mỗi mẫu có đủ URL, token và API PageSpeed. Plugin không gắn key sẵn. API không tính phí theo lượt gọi. Thiếu key thì không hiện mẫu và không đo điểm PageSpeed.
- Quota của API key PageSpeed là 25.000 request mỗi ngày và 30 request mỗi phút. Mỗi URL đo mobile và desktop tốn 2 request. Phase 2 đo mỗi link 3 lần lấy trung vị (mốc "trước", mỗi vòng kiểm tra lại, nghiệm thu), tức 6 request mỗi lần đo. Hết quota thì dừng, không bịa điểm, không kết luận từ một lần đo.
- Cursor và Claude Code tự mở trình duyệt để đo tốc độ tải thật của page. Plugin không nhúng trình duyệt. Claude trên web và Codex vẫn đo bằng PageSpeed Insights API.
- Chỉ tối ưu trang người dùng yêu cầu, và chỉ thông số chưa đạt của trang đó. Trang đạt cả 6 thông số ghi `Không cần tối ưu`. Ưu tiên dòng theo trang (VPI, Critical CSS, lazyload HTML); option plugin là toàn site, chỉ đổi khi người dùng yêu cầu rõ.
- So trước/sau chỉ trong thư mục báo cáo của lần chạy, cùng URL, cùng thiết bị, cùng nguồn đo. Không so với miền khác hay số minh họa trong tài liệu.
- Không chỉ nhìn điểm PSI: Phase 2 kiểm tra thêm **Site health** (tốc độ và giao diện ở cửa sổ ẩn danh, cả bản sau khi LiteSpeed Guest Mode tự tải lại trang).

## 3. Giữ nguyên

Plugin hiện vào từ `vietnix-pagespeed-pro/vnx-pagespeed.php`. Các file `class.vnx-ajax.php`, `css-optimize.php`, `js-optimize.php`, `image-optimize.php`, `lazyload-html.php` không đổi hành vi.

| Nhóm | Việc plugin đang làm |
| --- | --- |
| CSS | Delay hoặc async CSS gộp, xóa CCSS LiteSpeed, Critical CSS Vietnix, delay theo ID, keyword, thẻ style |
| JS | Delay JS, danh sách keyword, chặn script LiteSpeed chạy sớm, tắt prefetch Flatsome |
| Ảnh | Tối ưu lazyload, VPI, đổi size desktop và mobile |
| HTML | Lazyload vùng dưới màn hình đầu |
| Dữ liệu | Bảng Critical CSS, VPI, Lazyload HTML |

CSS, ảnh và HTML có cặp guest và client. JS dùng chung, riêng `optimize_ls_delay_js` chỉ cho guest. Guest nhận bằng hằng `LITESPEED_GUEST`.

## 4. Các công việc

### Việc 1. Kết nối MCP

Làm:

- Endpoint `POST /wp-json/vnx-ps/v1/mcp`, giao thức JSON-RPC (`initialize`, `tools/list`, `tools/call`).
- Option `vnx_mcp_enabled` mặc định tắt. Admin bật tại Vietnix Optimization, tab General, khối MCP.
- Khối MCP có ô API key PageSpeed. Admin dán key đã tạo trên Google Cloud. Plugin không nhúng key sẵn.
- Khi MCP đang bật và đã có API key, hiện các mẫu kết nối để copy theo từng agent. Mỗi mẫu điền sẵn URL, token và API PageSpeed.
- File mới trong `vietnix-pagespeed-pro/inc/mcp/`: server, auth, tools, analyzer, audit map, bridge LiteSpeed, report.
- Thư mục `audit-website/reports/YYYY-MM-DD-ten-mien/` là nơi agent ghi báo cáo sau mỗi lần kiểm tra web qua MCP. Skill hướng dẫn agent nằm trong `audit-website/audit-pagespeed`, `measure-page-load` và `apply-pagespeed`.

Xong khi Cursor và một agent khác cùng liệt kê được tool, và màn MCP hiện đủ bốn mẫu.

Mẫu Cursor trên trang admin là khối `url` và `headers`. Cursor đang dùng không gắn được hai header đó, nên nối qua file bridge `audit-website/scripts/vietnix-pagespeed-bridge.mjs`. Cách dán vào `~/.cursor/mcp.json` nằm ở mục **Kết nối** trong `audit-website/README.md`. Claude Code, Claude và Codex vẫn gửi header thẳng, không copy file bridge.

```json
{
  "mcpServers": {
    "vietnix-pagespeed": {
      "url": "https://example.com/wp-json/vnx-ps/v1/mcp",
      "headers": {
        "Authorization": "Bearer TOKEN",
        "X-Pagespeed-Api-Key": "PAGESPEED_API_KEY"
      }
    }
  }
}
```

Mẫu Claude Code, dán vào `.mcp.json`:

```json
{
  "mcpServers": {
    "vietnix-pagespeed": {
      "type": "http",
      "url": "https://example.com/wp-json/vnx-ps/v1/mcp",
      "headers": {
        "Authorization": "Bearer TOKEN",
        "X-Pagespeed-Api-Key": "PAGESPEED_API_KEY"
      }
    }
  }
}
```

Mẫu Claude (claude.ai và Claude Desktop): không dán file JSON. Vào Settings, Connectors, Add custom connector. Điền URL plugin, rồi hai request header: `Authorization` = `Bearer TOKEN` và `X-Pagespeed-Api-Key` = `PAGESPEED_API_KEY`.

Mẫu Codex, dán vào `~/.codex/config.toml`:

```toml
[mcp_servers.vietnix-pagespeed]
url = "https://example.com/wp-json/vnx-ps/v1/mcp"

[mcp_servers.vietnix-pagespeed.http_headers]
Authorization = "Bearer TOKEN"
X-Pagespeed-Api-Key = "PAGESPEED_API_KEY"
```

Mọi agent gửi header `X-Pagespeed-Api-Key` trên mỗi request. Plugin dùng đúng key đó để gọi PageSpeed Insights. Log không ghi key. Thiếu header này thì không đo.

### Việc 2. Phân tích URL và lập báo cáo

Làm:

- Phase 1 không cần plugin hay MCP: đo PSI bằng API key ở `audit-website/Do.md` (hoặc đọc trên pagespeed.web.dev). Có MCP đúng miền thì đo qua `vnx_analyze_pagespeed`, với API key admin lưu trong màn MCP. Không đo được thì ghi `không đo được`, không bịa điểm.
- Nhận danh sách URL. Gọi PageSpeed Insights API v5 cho mobile và desktop. Thiếu key thì báo lỗi, không bịa điểm. Quota key là 25.000 request/ngày và 30 request/phút. Hết quota thì dừng.
- Lưu điểm, FCP, LCP, TBT, CLS, Speed Index, TTFB và các audit dưới 0,9 điểm.
- Đánh giá từng URL theo 6 thông số: điểm PSI mobile ≥ 90, desktop ≥ 90, tải thật (Desktop ≤ 2 s, Mobile ≤ 3 s), cache `hit`, ảnh màn hình đầu không giật (CLS ≤ 0,25), bên thứ ba không làm chậm đáng kể. Đạt hết: `Không cần tối ưu`.
- Map audit sang phương án plugin PRO. Chỉ dòng gắn với thông số chưa đạt là `proposed`; dòng khác `theo dõi`. Việc plugin không làm được ghi “ngoài phạm vi”, không đưa vào bước thực thi. Site chưa cài plugin: dòng plugin làm được ghi `cần plugin`.
- Đọc chín thông số LiteSpeed và ghi mục Đề xuất: hiện trạng, nên bật, tắt hoặc giữ nguyên, kèm lý do. Trạng thái `suggestion`.
- Nếu agent là Cursor hoặc Claude Code: tự mở trình duyệt, tải đúng URL, đọc thời gian tải thật rồi ghi vào báo cáo. Số liệu lấy sau khi trang đã tải xong: TTFB, DOMContentLoaded, thời điểm load, và LCP nếu trình duyệt trả về. Ghi rõ số đo từ máy đang chạy agent. Claude trên web và Codex bỏ qua bước này.

Xong khi một URL có đủ điểm mobile, desktop, bảng phương án và mục Đề xuất có số liệu thật. Với Cursor hoặc Claude Code, báo cáo còn có thời gian tải thật trước khi tối ưu.

### Việc 3. Thực thi tối ưu bằng plugin

Phase 2 (trường hợp 2). Chỉ chạy trên link người dùng chọn tối ưu, chỉ dòng đã duyệt, trạng thái `proposed`. `dry_run` mặc định bật. Ghi thật khi `dry_run` là false, sau khi người dùng xác nhận diff.

Trước khi ghi:

- Cài plugin xong thì **đo lại** (3 lần, trung vị) làm mốc "trước" của nghiệm thu. Cài plugin tự làm đổi trang, nên số Phase 1 chỉ giữ để tham khảo.
- Site đã có option hoặc dòng từ trước: kết luận `giữ`, `thay` hoặc `gỡ` cho từng mục, kèm bằng chứng. Dòng `proposed` có cột **Thao tác** (`thêm`, `thay`, `gỡ`).
- Lưu `cau-hinh-truoc-toi-uu.json` (option và ba bảng dòng, kể cả nội dung Critical CSS) trước lần ghi đầu tiên, để khôi phục được.

Thứ tự ghi, chỉ cho thông số chưa đạt:

1. `active_all` là công tắc tổng: không tắt; đang tắt thì báo người dùng trước khi đề xuất bật. Option toàn site khác chỉ ghi khi người dùng yêu cầu rõ.
2. CSS: Critical CSS Vietnix cho trang khi đã có nội dung CSS. Delay combined hoặc async combined (một trong hai) là option toàn site. Không xóa CCSS LiteSpeed nếu chưa có bản thay.
3. JS: delay và keyword từ audit. Không delay `jquery` hay `wp-includes` trừ khi người dùng duyệt đúng keyword đó.
4. Ảnh: VPI cho ảnh LCP và ảnh màn hình đầu của trang.
5. HTML: lazyload selector dưới màn hình đầu, không đụng header hay hero.
6. Purge đúng page vừa tối ưu.
7. **Double check**: tải lại page một lần cho cache ấm, rồi đo song song **Point** (PSI 3 lần, trung vị) và **Site health** (tốc độ 3 lần, trung vị; ảnh màn hình đầu, bố cục, lỗi script, bản sau khi trang tự tải lại).
8. Cổng kết quả: **tệ hơn** (trung vị điểm mobile hoặc CLS kém hơn mốc quá ngưỡng nhiễu, hoặc Site health có lỗi mới) → rollback, dry-run và xác nhận; về cấu hình ban đầu thì khôi phục từ `cau-hinh-truoc-toi-uu.json`. **Chưa đạt**, plugin còn làm được → hỏi người dùng, làm vòng tiếp. **Đạt** hoặc plugin hết việc → nghiệm thu.
9. **Nghiệm thu**: đo điểm cuối (3 lần, trung vị), báo cáo kết quả sau tối ưu (`.md` + Word) và `Đề xuất bổ sung`. AI kết thúc.

Ngưỡng nhiễu: điểm PSI ≤ 3, Load/LCP/FCP ≤ 200 ms, CLS ≤ 0,02 coi là không đổi.

Xong khi một URL thử qua Critical CSS, delay JS và VPI, purge đúng URL đó, trung vị điểm mobile không giảm quá ngưỡng nhiễu, Site health không có lỗi mới, và màn admin hiện cùng giá trị agent đã ghi.

### Việc 4. Ranh giới LiteSpeed

Được đọc, chỉ để điền mục Đề xuất:

| Thông số | Key | Đề xuất khi |
| --- | --- | --- |
| Minify CSS | `optm-css_min` | CSS chưa nén |
| Combine CSS | `optm-css_comb` | Nhiều file CSS chặn render |
| UCSS | `optm-ucss` | CSS không dùng chiếm dung lượng lớn |
| CCSS | `optm-ccss` | CSS chặn render và plugin chưa có Critical CSS |
| JS defer | `optm-js_defer` | JS chặn render, TBT cao |
| JS delay | `optm-js_delay` | JS không dùng hoặc bên thứ ba nặng |
| Lazyload | `media-lazy` | Ảnh ngoài màn hình đầu |
| Guest mode | `guest_optm` | Điểm mobile thấp với khách ẩn danh |
| Cache | `cache` | TTFB cao và cache đang tắt |

Được gọi: `litespeed_purge_url` cho từng page đang tối ưu, cùng host. Nhiều page thì gọi lần lượt.

Không được: ghi conf LiteSpeed, purge all, purge theo tag, purge theo post type, purge page ngoài phiên, crawler, QUIC, CDN, object cache.

### Việc 5. Kiểm tra

- MCP tắt thì endpoint trả 403. Các tab tối ưu và nút Save vẫn lưu option như hiện tại. Frontend vẫn áp option đã lưu.
- Token sai trả 401.
- Delay CSS và async CSS cùng bật thì từ chối, database không đổi.
- URL khác domain, URL rỗng, hoặc yêu cầu purge all thì trả `purge_all_forbidden`.
- Đọc conf chỉ trả chín key. Ghi conf trả `litespeed_conf_forbidden`.
- LiteSpeed tắt thì purge trả `litespeed_inactive`. Option plugin vẫn ghi được.
- Nút Save trên admin và MCP ghi cùng một key ra cùng một giá trị.
- IP allowlist của màn hình nâng cao không đổi.
- Chưa có API key PageSpeed thì không hiện mẫu kết nối. Request đo thiếu header `X-Pagespeed-Api-Key` thì từ chối.

## 5. Tool MCP

Đọc: `vnx_get_status`, `vnx_list_options`, `vnx_list_actions`, `vnx_read_litespeed_conf`, `vnx_analyze_pagespeed`, `vnx_list_rows`, `vnx_resolve_url`, `vnx_test_selector` (ba tool cuối từ bản 1.2).

Ghi, cần `dry_run: false`: `vnx_set_options`, `vnx_save_critical_css`, `vnx_save_vpi`, `vnx_save_lazyload_html`, `vnx_remove_row`, `litespeed_purge`, `vnx_rollback_options`. `vnx_save_report` và `vnx_get_report` đã gỡ từ bản 1.2.

`vnx_list_actions` chỉ mô tả hook plugin đã gắn (`litespeed_buffer_finalize`, `litespeed_optm_html_head`). Agent không gọi các hook đó.

## 6. Luồng thực thi (Phase 1, Phase 2)

MCP tắt thì không có Phase 2 qua AI. Admin vào Vietnix Optimization và tối ưu thủ công như plugin đang làm.

Người dùng gửi link và nói "khảo sát" (trường hợp 1) hoặc "tối ưu" (trường hợp 2), hoặc điền ô **Trường hợp** trong `audit-website/Do.md`.

**Phase 1 — khảo sát** (cả hai trường hợp; không cần plugin):

1. Bước 0: kiểm tra plugin đã cài chưa, MCP có nối đúng miền không (`vnx_get_status`, so host `site_url`). MCP khác miền thì không gọi tool `vnx_*` nào khác.
2. Trường hợp 2, bước 0b: tìm báo cáo Phase 1 có thư mục trùng **đúng** tên miền. Có đủ link thì dùng lại; thiếu link thì khảo sát thêm link đó.
3. Đo PSI và tải thật, đánh giá 6 thông số, lập báo cáo hiện trạng (`.md` + Word) trong `audit-website/reports/YYYY-MM-DD-ten-mien/`. Chưa ghi cấu hình. Trường hợp 1 kết thúc ở đây.

**Phase 2 — tối ưu và nghiệm thu** (trường hợp 2):

4. Chưa có plugin hoặc MCP đúng miền: dừng, người dùng cài plugin, bật MCP, nhập API key PageSpeed, copy mẫu kết nối đúng agent, khởi động lại agent, nhắn `tiếp tục`.
5. Đo lại sau cài plugin làm mốc "trước" (3 lần, trung vị); kiểm tra cấu hình đã có (`giữ`/`thay`/`gỡ`).
6. Người dùng chọn link cần tối ưu và duyệt dòng `proposed`. Không tối ưu thì kết thúc.
7. Ghi theo thứ tự việc 3 (dry-run, xác nhận, ghi, purge), Double check, cổng kết quả, lặp vòng nếu cần.
8. Nghiệm thu: báo cáo kết quả sau tối ưu và đề xuất bổ sung. AI kết thúc. Người dùng đổi sang plugin lite.

## 7. Báo cáo

Agent ghi mỗi lần kiểm tra vào thư mục `audit-website/reports/YYYY-MM-DD-ten-mien/`. File kỹ thuật: `YYYY-MM-DD-ten-mien.md`. Cùng miền trong cùng ngày thì bổ sung vào file đó, không tạo thư mục thứ hai. Trường hợp 2 dùng lại báo cáo Phase 1 thì ghi tiếp vào thư mục đó (mục **Kiểm tra lại — sau cài plugin**, rồi **Kết quả sau tối ưu**). Cùng thư mục còn báo cáo Word gửi khách, file đề xuất bổ sung khi có việc còn lại, và `assets/`. Báo cáo không lưu trên site: agent không gọi `vnx_save_report` (xem mục 9).

Báo cáo hiện trạng (Phase 1) không cần MCP: đo bằng API key trong `Do.md` hoặc pagespeed.web.dev, ghi rõ nguồn. Đọc option, dòng plugin và conf LiteSpeed chỉ khi MCP nối đúng miền.

Mỗi URL có điểm tổng hiệu suất mobile và desktop (dùng để kết luận; FCP, LCP, TBT, CLS, Speed Index, TTFB chỉ là dữ liệu cho bước tối ưu), bảng **Đánh giá thông số** (6 thông số, kết luận `Không cần tối ưu` hoặc `Cần tối ưu: <thông số>`), rồi bảng audit:

| Cột | Nội dung |
| --- | --- |
| URL | Link đã nhập |
| Thiết bị | mobile hoặc desktop |
| Điểm | Performance |
| Metric | FCP, LCP, TBT, CLS, Speed Index, TTFB |
| Mã audit | id PageSpeed |
| Thông số | Thông số trong 6 thông số mà dòng đó ảnh hưởng |
| Vấn đề | Tiêu đề và giá trị hiển thị |
| Nguyên nhân | File, kích thước, hoặc phần tử LCP |
| Phương án | Option hoặc dòng plugin PRO. Trường hợp 2 có thêm cột **Thao tác**: `thêm`, `thay`, `gỡ`, giá trị cũ → mới |
| Độ ưu tiên | P1 chỉ số chính fail, P2 tiết kiệm trên 200 ms, P3 còn lại |
| Trạng thái | `proposed` (thông số chưa đạt), `theo dõi` (thông số đã đạt), `ngoài phạm vi`, `cần plugin`; sau thực thi `applied` hoặc `skipped` |
| Tải thật | TTFB, DOMContentLoaded, load, LCP. Chỉ khi agent là Cursor hoặc Claude Code. Ghi máy đo |

Mục Đề xuất LiteSpeed đứng sau, một lần cho cả site, trạng thái `suggestion`. Sau nghiệm thu, file `.md` thêm mục **Kết quả sau tối ưu**: bảng trước/sau từng link (trung vị; "trước" là mốc đo lại sau cài plugin), kết quả Site health, dòng `applied`/`skipped`/rollback. Cùng thư mục có `Báo cáo - Kết quả sau tối ưu - ten-mien.docx`, `cau-hinh-truoc-toi-uu.json`, và `Đề xuất bổ sung - ten-mien.md` khi còn việc (A người dùng làm, B AI làm khi duyệt, C không đề xuất).

Map audit sang plugin:

| Audit | Phương án plugin |
| --- | --- |
| CSS chặn render, CSS không dùng, CSS chưa nén | Delay combined hoặc async combined. Critical CSS Vietnix nếu đã có file |
| JS không dùng, TBT, main thread, bên thứ ba | Delay JS và keyword |
| Ảnh chưa kích thước, ảnh ngoài màn hình, ảnh LCP | Lazyload và VPI |
| DOM lớn | Lazyload HTML |
| TTFB | Ngoài plugin. Sau tối ưu chỉ purge đúng page |
| LCP, TBT, CLS | Tách thành audit con phía trên |

## 8. Ngoài phạm vi

- Không đổi giao diện các tab tối ưu hiện có.
- Không tự sinh Critical CSS bằng trình duyệt trong giai đoạn này. Agent chỉ ghi CSS khi đã có nội dung.
- Plugin không mở trình duyệt. Đo tải thật do Cursor và Claude Code thực hiện khi đang kết nối MCP.
- Không sửa hosting, CDN bên thứ ba, theme hay plugin khác.
- Không chạy PHP tùy ý và không gọi hook ngoài `litespeed_purge_url`.
- Không đổi sang plugin lite: việc của người dùng sau khi AI kết thúc ở nghiệm thu.
- Việc ngoài plugin (WebP, size ảnh trong page builder, tự host font, cấu hình LiteSpeed) chỉ nằm ở phần A của đề xuất bổ sung.

## 9. Điều chỉnh sau lần chạy thật

_Nhật ký sửa plugin theo từng bản, giữ nguyên như lúc ghi. Số liệu và tên site ở đây là bằng chứng của lần chạy đó, không dùng làm mốc so sánh. Quy trình hiện hành: mục 6 và `audit-website/README.md`._

Căn cứ: lần audit và tối ưu frozen-top.io.vn ngày 2026-10-08 (plugin 1.0), kết quả các tool trong phiên đó, 7 lần dry-run thử (không ghi database), và mã nguồn admin bản 1.0. Mã nguồn MCP chưa có trên máy, nên các lỗi dưới đây ghi theo hành vi quan sát được.

Giữ nguyên, đã chạy đúng: danh sách key được phép (`option_not_allowed`), chặn delay và async CSS cùng bật (`css_mode_conflict`), bắt duyệt `jquery`/`wp-includes` (`keyword_not_approved`), chặn selector `header` (`selector_forbidden`), purge một URL cùng host, `dry_run` mặc định bật, diff `from`/`to` của `vnx_set_options`, không ghi conf LiteSpeed.

### Lỗi cần sửa

| # | Ưu tiên | Tool hoặc file | Hiện trạng | Bằng chứng | Cách sửa |
| --- | --- | --- | --- | --- | --- |
| 1 | Cao | `vnx_analyze_pagespeed` (`rows`) | Map audit gần như luôn ra "Ngoài phạm vi". Cột `cause` thường trống | frozen-top: 100% dòng là `ngoài phạm vi`, 0 dòng `proposed`. `image-delivery-insight` (dư 39–71 KiB) và FCP mobile 2,3 s đều bị loại | Map `image-delivery-insight` sang VPI `(replace [sz-…-sz])` hoặc `vpi_replace_size_*`. Map render-blocking và FCP sang delay combined CSS + Critical CSS. Map JS không dùng, bên thứ ba sang `delay_js` + keyword lấy từ URL trong audit. Điền `cause` bằng URL, kích thước hoặc selector |
| 2 | Cao | `vnx_analyze_pagespeed` | Không trả phần tử LCP, không phát hiện ảnh màn hình đầu bị lazyload | Lỗi chính của frozen-top (ảnh hero `data-vnx-lazy`, hiện sau 4 s) chỉ phát hiện được bằng trình duyệt. Lighthouse kết thúc trước timer nên LCP lấy chữ | Trả `largest-contentful-paint-element` (selector, URL ảnh), `lcp-discovery-insight`. Đánh dấu P1 khi phần tử LCP hoặc ảnh màn hình đầu có `data-vnx-lazy` + `src` SVG trong HTML guest |
| 3 | Cao | `vnx_analyze_pagespeed` (`suggestions`) | Cả 9 thông số LiteSpeed đều "giữ nguyên", `reason` là câu điều kiện cố định | Minify CSS đang bật vẫn ghi lý do "CSS chưa nén" | Tính đề xuất từ audit và conf thật. "Giữ nguyên" thì ghi lý do thật, ví dụ "đang bật" hoặc "không có audit liên quan" |
| 4 | Cao | `assets/js/admin/save.js` | Nút Save gửi lại mọi option trên trang với giá trị lúc mở trang (đoạn so `data-old` bị comment). Tab admin mở trước khi MCP ghi sẽ xóa thay đổi của MCP | Trong phiên, `active_all` từ `"1"` thành `""` sau khi người dùng xóa một dòng VPI và bấm Save. Cơ chế thấy trong mã, chưa tái hiện | Chỉ gửi option có giá trị khác `data-old`. Hoặc so giá trị trong DB với `data-old` trước khi lưu và cảnh báo khi đã đổi |
| 5 | Cao | Thiếu tool đọc bảng | MCP không đọc được bảng VPI, lazyload HTML, Critical CSS | Dòng `Home` cũ (`#brxe-fdf742 img {0}`, phần tử không còn) chặn dòng mới vì plugin đọc dòng khớp đầu tiên. Agent phải nhờ người dùng mở admin. `vnx_remove_row` theo `id` không dùng được vì không biết `id` | Thêm `vnx_list_rows` (xem bảng tool mới) |
| 6 | Trung bình | `vnx_set_options` | Không kiểm tra kiểu và giá trị | Dry-run nhận `delay_js` = `"yes"` (frontend coi là tắt). `delay_js_time` = `-5` hiện diff `-5` nhưng khi lưu thành `10000`. `delay_js_list` = chuỗi `"analytics"`: frontend `foreach` trên chuỗi (`js-optimize.php:205`, `class.vnx-frontend.php:445`), PHP cảnh báo và delay JS không chạy | Kiểm tra theo key: công tắc chỉ `"1"`/`""`; danh sách (`delay_js_list`, `style_by_keyword`, `style_by_script`, `delay_style_tags`) phải là mảng chuỗi; số trong khoảng hợp lệ. Diff hiện giá trị sau khi chuẩn hóa |
| 7 | Trung bình | `vnx_save_vpi`, `vnx_save_lazyload_html` | Dry-run trả lại nguyên input, không kiểm tra cấu trúc, không báo thêm mới hay sửa, không báo trùng | Dry-run nhận `{"url": …}` thiếu `type`/`source_id`. Ghi thật trả `{"saved":2}` | Từ chối dòng thiếu `type`/`source_id`. Trả `action: insert/update` cho từng dòng. Cảnh báo khi đã có dòng cùng `type` + `source_id` (dòng mới sẽ bị bỏ qua) |
| 8 | Trung bình | `vnx_save_lazyload_html` | Chỉ chặn header và hero theo tên trong selector | `header` bị chặn, `#brxe-q16kap` (ảnh hero) được nhận | Kiểm tra vị trí thật: từ chối phần tử nằm trong màn hình đầu của HTML guest (hoặc tổ tiên của phần tử LCP), không chỉ dựa vào tên |
| 9 | Trung bình | `vnx_remove_row` | Dry-run không cho biết dòng có tồn tại | `vpi` / `post` / `999999` vẫn trả dry-run bình thường | Dry-run trả dòng sẽ xóa, hoặc `row_not_found` |
| 10 | Thấp | `vnx_get_status` | Không trả tên miền | Agent phải đọc URL server trong cấu hình client để xác nhận đúng site | Thêm `site_url`, `home_url`, số dòng mỗi bảng |
| 11 | Thấp | `vnx_analyze_pagespeed` (`quota`) | Chỉ trả hạn mức cố định | `{"daily_limit":25000,"minute_limit":30}` | Trả số request đã dùng trong ngày và trong phút |
| 12 | Thấp | `vnx_save_report`, `vnx_get_report`, `vnx_list_actions` | Quy trình hiện tại không dùng | Báo cáo chỉ lưu ở `audit-website/reports/` | Gỡ hai tool báo cáo hoặc ẩn sau option. `vnx_list_actions` giữ nếu cần chẩn đoán |

### Tool mới

| Tool | Tham số | Trả về | Phục vụ |
| --- | --- | --- | --- |
| `vnx_list_rows` | `table` (`vpi`, `lazyload_html`, `critical_css`), `type?`, `source_id?` | `id`, `type`, `source_id`, nội dung mobile và desktop | Phát hiện dòng trùng, dòng cũ trỏ vào phần tử không còn; lấy `id` để sửa hoặc gỡ |
| `vnx_resolve_url` | `url` | `type`/`source_id` plugin dùng cho URL theo thứ tự dò (`post` → `group_post` → `post_in-*` → `post_body_class` → `post_type`), dòng VPI, lazyload HTML, Critical CSS đang khớp, guest có qua `is_optimize()` không | Bỏ bước đoán `type`/`source_id` từ class `<body>` |
| `vnx_test_selector` | `url`, `device` (`mobile`, `desktop`), `selectors` | Số phần tử khớp từng selector trên HTML guest, dùng đúng `dom-parser.php` của plugin, kèm `{n}` | Thử selector VPI và lazyload HTML trước khi ghi, đúng HTML mobile |

### Xong khi

- Chạy lại audit frozen-top.io.vn trên bản trước khi thêm VPI (hoặc site thử tương tự): `vnx_analyze_pagespeed` ra dòng P1 cho ảnh hero bị lazyload, có selector ảnh và `type`/`source_id`, trạng thái `proposed`.
- `image-delivery-insight` ra dòng `proposed` với VPI `(replace)`, không còn "Ngoài phạm vi".
- `suggestions` không còn lý do mâu thuẫn với hiện trạng.
- Mở tab admin, ghi một option qua MCP, rồi bấm Save ở tab đó: option MCP vừa ghi không bị đổi.
- `vnx_set_options` từ chối `"yes"` cho công tắc và chuỗi cho `delay_js_list`.
- `vnx_save_vpi` dry-run báo trùng khi đã có dòng cùng `type` + `source_id`.
- `vnx_list_rows`, `vnx_resolve_url`, `vnx_test_selector` trả đúng dữ liệu cho `home`/`home` và `post`/`56` của frozen-top.

### Kết quả kiểm tra bản sửa

Bản kiểm tra: `vietnix-pagespeed-pro.zip` (2026-10-08 14:35), có thư mục `inc/mcp/`, `VNX_PS_VERSION` vẫn là `1.0`. Bản này chưa cài lên frozen-top.io.vn (`vnx_get_status` trên site vẫn trả kiểu cũ), nên chỉ kiểm tra bằng đọc mã, `php -l` (không lỗi cú pháp) và chạy thử các hàm với dữ liệu thật: Lighthouse 12.8.2 chạy trên máy cho trang chủ, HTML guest của trang chủ lấy bằng `?vnx-device=`.

| # | Trạng thái | Ghi chú |
| --- | --- | --- |
| 1 | Sửa một phần | Đã map FCP, render-blocking sang CSS; ảnh sang VPI `(replace)`; JS sang `delay_js` + keyword; `cause` có URL và dung lượng. Còn lỗi A, B |
| 2 | Sửa một phần | Đã thêm `lazy_hero` và phần tử LCP. Còn lỗi C, D |
| 3 | Đã sửa | `reason` là "đang bật", "không có audit liên quan" hoặc lý do thật |
| 4 | Đã sửa | `save.js` chỉ gửi option có giá trị khác lúc mở trang |
| 5 | Đã sửa | `vnx_list_rows` |
| 6 | Đã sửa | Công tắc chỉ nhận `"1"`/`""`, danh sách phải là mảng, `delay_js_time` 0–10000, diff hiện giá trị đã chuẩn hóa. Còn: `vpi_replace_size_*` nhận chuỗi bất kỳ |
| 7 | Đã sửa | `row_invalid`, `action` là `insert`/`update`/`skip`, báo `duplicate` kèm `existing_id`. Còn lỗi H |
| 8 | Sửa một phần | Có kiểm tra vị trí trong HTML, nhưng dựa trên ảnh lazy đầu tiên. Xem lỗi D |
| 9 | Đã sửa | Dry-run trả dòng sẽ xóa hoặc `row_not_found` |
| 10 | Đã sửa | `site_url`, `home_url`, `rows` |
| 11 | Đã sửa | `daily_used`, `minute_used` |
| 12 | Đã sửa | `vnx_save_report`, `vnx_get_report` đã gỡ khỏi danh sách tool. `VNX_MCP_Report::save()`/`get()` còn lại nhưng không dùng |

Lỗi còn lại và lỗi mới:

| Mã | Ưu tiên | Vị trí | Lỗi | Bằng chứng | Cách sửa |
| --- | --- | --- | --- | --- | --- |
| A | Cao | `class.vnx-audit-map.php:23, 102–113` | `largest-contentful-paint-element` luôn ra dòng P1 `proposed` "VPI cho phần tử LCP", kể cả khi LCP là chữ | Trang chủ: LCP là `h1#brxe-yl0h8e`, vẫn ra dòng VPI với selector `h1` | Chỉ đề xuất VPI khi phần tử LCP là `img`, `picture` hoặc có ảnh nền. LCP là chữ thì ghi dòng CSS (Critical CSS, font) hoặc `ngoài phạm vi` |
| B | Cao | `class.vnx-audit-map.php:23–27` | Audit `scoreDisplayMode` = `notApplicable` (score `null`) vẫn được giữ cho ba audit trong `$keep_null_score` | `lcp-discovery-insight` `notApplicable` ra dòng P1 `proposed`, `cause` rỗng | Bỏ audit `notApplicable`. Chỉ giữ `null` khi `scoreDisplayMode` là `informative`/`metricSavings` và có `details.items` |
| C | Cao | `class.vnx-mcp-page.php:198–232` | `lazy_hero` lấy ảnh `data-vnx-lazy` + SVG **đầu tiên trong DOM**, không xét vị trí. Sau khi ảnh hero đã có VPI, ảnh lazy kế tiếp (dưới màn hình đầu) bị báo P1 "Ảnh màn hình đầu bị lazyload" | HTML desktop trang chủ hiện tại: báo `img#brxe-eub6j9` (`.sm-gu__img`, khối "Chọn gu" bên dưới hero) | Chỉ báo khi ảnh nằm trong khối đầu trang: trùng phần tử LCP của PSI, hoặc trong N phần tử đầu của `<main>`/khối section đầu tiên. Đối chiếu với `largest-contentful-paint-element` |
| D | Cao | `class.vnx-mcp-page.php:420–448, 468–474` | Kiểm tra "màn hình đầu" coi ảnh lazy đầu tiên là hero (cùng nguyên nhân C), và chỉ dò từ phần tử lên tổ tiên: khối bao ngoài chứa ảnh hero không bị chặn trừ khi tên có `header`/`hero`. `node_selector` không có `id` thì trả `img[data-vnx-lazy]`, khớp **mọi** ảnh lazy | `vnx_test_selector`: `img#brxe-eub6j9` (dưới màn hình đầu) ra `above_fold: true`. Dòng VPI dùng `img[data-vnx-lazy]` sẽ bỏ lazyload và preload mọi ảnh | Dò cả chiều xuống (khối chứa phần tử LCP/hero). Selector dự phòng dùng class + `{n}` hoặc trả rỗng kèm cảnh báo, không trả selector chung |
| E | Cao | `class.vnx-mcp-page.php:169–196, 371–385` | `vnx_test_selector` không kiểm tra host: server tải bất kỳ URL nào agent đưa (SSRF) | Chạy thử: `http://169.254.169.254/latest/meta-data/` được đưa vào `wp_remote_get` | Gọi `VNX_MCP_Rules::same_host( $url, home host )` trước khi tải, như `vnx_analyze_pagespeed`. Áp cho cả `vnx_resolve_url` |
| F | Trung bình | `class.vnx-mcp-page.php:296–333` | `vnx_resolve_url` chỉ nhận trang chủ và post/page. Không nhận archive, danh mục, taxonomy, trang bài viết (`page_for_posts`). `post_body_class` đoán là `single-<post_type>` và so khớp nguyên chuỗi, trong khi frontend tách `source_id` theo dấu phẩy và so với mọi class của `<body>` | Mã `target_for_url` chỉ có hai nhánh. Frontend: `image-optimize.php:409–420` | Dùng cùng thứ tự `get_source_data()` của frontend (archive, `page_for_posts`, term/taxonomy). `post_body_class`: tách theo dấu phẩy, so với class `<body>` lấy từ HTML |
| G | Trung bình | `class.vnx-mcp-rules.php:192–210`, `class.vnx-mcp-auth.php:62–78` | `litespeed_purge` chỉ nhận URL đã qua `vnx_analyze_pagespeed`, nếu không trả `purge_all_forbidden` (sai nghĩa). Khi thiếu header API key, agent đo PSI ngoài MCP nên không purge được | Mã `classify_purge` | Ghi nhận URL cả khi gọi `vnx_resolve_url`, `vnx_test_selector`, `vnx_save_*`. Trả mã riêng `url_not_in_session` |
| H | Trung bình | `class.vnx-mcp-page.php:82–98` | Dòng có `id` không tồn tại vẫn là `update`, ghi thật không đổi gì nhưng vẫn đếm vào `saved`. Hai dòng cùng `type` + `source_id` trong một lần gọi đều `insert` | Mã `prepare_config_rows` | Kiểm tra `id` tồn tại (`row_not_found`). Kiểm tra trùng trong cùng lô |
| I | Thấp | `class.vnx-mcp-page.php:171–172` | `device` sai trả `url_forbidden` | Mã | Trả `invalid_device` |
| J | Thấp | `class.vnx-mcp-page.php:138–141`, `class.vnx-psi-analyzer.php:81` | Host chặn loopback thì `fetch_html` rỗng: `lazy_hero` im lặng trả `null`, agent tưởng không có lỗi giật ảnh | Mã | Trả cảnh báo `html_not_loaded` trong kết quả `vnx_analyze_pagespeed` |
| K | Thấp | `class.vnx-ajax.php:165` | `persist_remove_critical` ghép chuỗi SQL `source_id = '$source_id'` (có từ bản 1.0), nay MCP cũng gọi tới | Mã | Dùng `$wpdb->prepare` |
| L | Thấp | `vnx-pagespeed.php:38` | Bản có MCP mới vẫn để `VNX_PS_VERSION` = `1.0`. Agent không phân biệt được bản cũ và bản mới qua `vnx_get_status` | Mã | Tăng phiên bản (ví dụ `1.2`) |

Sau khi sửa A–E và cài lên site, chạy lại mục **Xong khi** ở trên. Thêm các kiểm tra:

- Trang chủ frozen-top hiện tại (hero đã có VPI): `vnx_analyze_pagespeed` không ra dòng `vnx-lazy-hero`, không ra dòng VPI cho `h1`.
- `vnx_test_selector` với URL khác host trả lỗi, không tải trang.
- `vnx_resolve_url` cho một trang danh mục trả `term` / ID danh mục.

### Đã sửa trong mã nguồn

Sửa ngày 2026-10-08 tại `vietnix.vn/wp-content/plugins/vietnix-pagespeed-pro` (nhánh `Master_PRO`, chưa commit), phiên bản `1.2`. Chưa cài lên site.

| Mã | Cách sửa | File |
| --- | --- | --- |
| A | Xác định phần tử LCP là ảnh hay chữ từ `snippet`/selector và các insight LCP. LCP là chữ thì ra dòng CSS (delay/async combined + Critical CSS), không ra VPI | `class.vnx-audit-map.php` |
| B | Bỏ audit `notApplicable`, `manual`, `error`. Audit score `null` chỉ giữ khi có `details.items`. Kèm: `unsized-images` và nhóm định dạng/nén ảnh chuyển sang `ngoài phạm vi`; `offscreen-images` chỉ đề xuất lazyload | `class.vnx-audit-map.php` |
| C | `lazy_hero` chỉ xét ảnh lazy trong màn hình đầu: header của site, khối chứa phần tử LCP của PSI (hoặc khối nội dung đầu tiên), và khối kế tiếp khi khối đầu là banner ngắn không có ảnh. Tối đa 3 ảnh. `image_url` lấy từ `data-src` | `class.vnx-mcp-page.php`, `class.vnx-psi-analyzer.php` |
| D | Kiểm tra màn hình đầu xét cả chiều xuống (khối bao ngoài cũng tính). Selector ảnh là `tag#id` hoặc `tag.class{n}` với class ít trùng nhất; không có thì bỏ qua kèm cảnh báo, không còn `img[data-vnx-lazy]` | `class.vnx-mcp-page.php` |
| E | `vnx_test_selector`, `vnx_resolve_url` từ chối URL khác host trước khi tải (`url_forbidden`). Tải trang bằng `wp_safe_remote_get` | `class.vnx-mcp-tools.php`, `class.vnx-mcp-page.php` |
| F | `vnx_resolve_url` đọc class `<body>` từ HTML guest, theo đúng thứ tự `get_source_data()`: trang chủ, archive, trang bài viết, singular, term (kèm `taxonomy`). Chuỗi dò giống frontend: dòng trang, `group_post`, `post_in-*`, `post_body_class` (so với mọi class `<body>`), dòng dự phòng | `class.vnx-mcp-page.php` |
| G | URL đã qua `vnx_resolve_url`, `vnx_test_selector` cũng purge được. URL chưa có trong phiên trả `url_not_in_session` | `class.vnx-mcp-tools.php`, `class.vnx-mcp-rules.php` |
| H | `id` không tồn tại trả `row_not_found`. Dòng thêm mới trùng trang trong cùng lần gọi là `skip` + `duplicate_in_request` | `class.vnx-mcp-page.php` |
| I | `device` sai trả `invalid_device` | `class.vnx-mcp-page.php` |
| J | Không tải được HTML guest thì `vnx_analyze_pagespeed` trả `warnings` (`html_not_loaded`) cho thiết bị đó | `class.vnx-psi-analyzer.php` |
| K | `persist_remove_critical` dùng `$wpdb->prepare` | `class.vnx-ajax.php` |
| L | `VNX_PS_VERSION` và header plugin lên `1.2` | `vnx-pagespeed.php` |

Kiểm tra đã chạy:

- `php -l` mọi file PHP: không lỗi.
- `tests/mcp-rules-test.php` (thêm test A, B) và `tests/mcp-page-test.php` (mới: C, D, E, F, G, H, I): đều `ok`.
- Lighthouse 12.8.2 thật của trang chủ: không còn dòng VPI cho `h1`, không còn dòng `lcp-discovery-insight`.
- HTML guest thật của frozen-top: trang chủ và Sản phẩm hiện tại không còn dòng `vnx-lazy-hero`. Giả lập trước VPI: trang chủ báo `img#brxe-q16kap`, Sản phẩm báo ảnh thẻ sản phẩm đầu tiên (`post`/`56`). `img.sm-gu__img`, `section#chon-gu` ra dưới màn hình đầu; `#brx-content` ra trên màn hình đầu.

Giới hạn còn lại:

- "Màn hình đầu" đoán theo cấu trúc HTML, không đo vị trí thật. Theme không dùng `<main>`/`<section>` có thể bị đoán rộng hoặc hẹp hơn thực tế. Agent vẫn phải xem trang thật trước khi ghi VPI hoặc lazyload HTML.
- `vpi_replace_size_*` vẫn nhận tên size bất kỳ.
- `VNX_MCP_Report::save()`/`get()` còn trong mã nhưng không dùng.
- Chưa chạy trên WordPress thật. Sau khi cài, chạy lại mục **Xong khi** và các kiểm tra thêm ở trên.

### Kiểm tra trên site sau khi cài 1.2

Ngày 2026-10-08, frozen-top.io.vn, gọi endpoint MCP trực tiếp (chỉ đọc và dry-run).

| Kiểm tra | Kết quả |
| --- | --- |
| `vnx_get_status` | `1.2`, có `site_url`, `rows` (`vpi: 2`) |
| `tools/list` | Có `vnx_list_rows`, `vnx_resolve_url`, `vnx_test_selector`; không còn tool báo cáo |
| `vnx_list_rows` | Đọc được 2 dòng VPI kèm `id` (2: `home`/`home`, 3: `post`/`56`). Bảng sai trả `option_not_allowed` |
| `vnx_resolve_url` | `/` ra `home`/`home`, khớp dòng 2. `/san-pham/` ra `post`/`56`, khớp dòng 3. Khác host trả `url_forbidden` |
| `vnx_test_selector` | Ảnh hero, thẻ sản phẩm 0–2 ra trên màn hình đầu; `img.sm-gu__img`, `section#chon-gu`, thẻ cuối, `footer` ra dưới. Khác host (`169.254.169.254`) trả `url_forbidden`, thiết bị sai trả `invalid_device` |
| `vnx_set_options` dry-run | `"yes"`, chuỗi cho `delay_js_list`, `-5` đều trả `invalid_option_value`. Mảng hợp lệ ra diff |
| `vnx_save_vpi` dry-run | Trùng trang ra `skip` + `existing_id: 2`; `id` 99999 trả `row_not_found`; thiếu `type` trả `row_invalid`; `id` 2 ra `update` |
| `vnx_save_lazyload_html` dry-run | `#brx-content` trả `selector_forbidden` (`above_fold`) |
| `vnx_remove_row` dry-run | Dòng không có trả `row_not_found`; dòng 3 trả nội dung dòng |
| `litespeed_purge` dry-run | URL chưa qua phiên trả `url_not_in_session`; URL đã `vnx_resolve_url` thì nhận; `purge_all` trả `purge_all_forbidden` |
| `vnx_analyze_pagespeed` | Mobile 95/95, desktop 100/100. Không còn dòng `vnx-lazy-hero` sai, không còn VPI cho `h1`, không còn audit `notApplicable`. `suggestions` ghi "đang bật"/"không có audit liên quan". `quota` có `daily_used`, `minute_used` |

Lỗi mới phát hiện và đã sửa ở `1.2.1`:

| Mã | Lỗi | Bằng chứng | Cách sửa |
| --- | --- | --- | --- |
| M | Plugin tải HTML mobile bằng `?vnx-device=mobile` nhưng User-Agent của WordPress. LiteSpeed chọn bản tối ưu và cache theo User-Agent, nên trả bản không lazyload, `no-cache`. Kiểm tra ảnh lazy và vị trí trên mobile xem sai HTML | `curl` trang chủ: UA mobile có 9 ảnh `data-vnx-lazy`; `?vnx-device=mobile` + UA desktop hoặc UA WordPress có 0 ảnh, `x-litespeed-cache: no-cache`; `?vnx-device=mobile` + UA mobile có 9 ảnh | `fetch_html` gửi User-Agent khớp thiết bị (Android Chrome cho mobile, Chrome desktop cho desktop) |
| N | Dòng lazyload HTML của trang không có URL (post/term không tồn tại, hoặc `group_post`, `post_type`…) được nhận mà không báo vị trí chưa kiểm tra | Dry-run `post`/`99998` với `section#chon-gu` ra `insert`, `warnings: []` | Trả cảnh báo `above_fold_not_checked`. Kiểm tra tên header/hero vẫn chạy |

Gói `vietnix-pagespeed-pro.zip` đã đóng lại với bản `1.2.1`. Chưa kiểm tra được trên site: phần đọc HTML mobile (lỗi M) và kiểm tra nút Save trong admin (lỗi 4, cần thao tác tay trong admin).

### Kiểm tra trên site sau khi cài 1.2.1

- `vnx_get_status` trả `1.2.1`. Người dùng đã bấm Lưu trong admin: mọi option giữ nguyên (`active_all` vẫn `"1"`, 9 option khác rỗng không đổi), 2 dòng VPI còn nguyên.
- Lỗi M đã hết: `vnx_test_selector` mobile thấy 9 ảnh `data-vnx-lazy` trên cả hai trang (bản 1.2 thấy 0).
- Lỗi mới O: khi HTML mobile đã đúng, trang Sản phẩm mobile báo nhầm thẻ sản phẩm thứ 3 là ảnh màn hình đầu. Trên màn hình hẹp các thẻ xếp dọc, thẻ thứ 3 nằm dưới. Sửa ở `1.2.2`: trong một khối nội dung, chỉ 2 ảnh đầu (mobile) hoặc 4 ảnh đầu (desktop) tính là màn hình đầu; khối bao ngoài và header không áp giới hạn này; kiểm tra lazyload HTML không đổi. Hai con số là ước lượng chung theo bố cục phổ biến, không đo vị trí thật.
- Đối chiếu HTML thật của frozen-top với `1.2.2`: trang hiện tại không có dòng `vnx-lazy-hero` ở cả 4 trường hợp; giả lập trước VPI báo đúng ảnh hero (trang chủ) và thẻ đầu tiên (Sản phẩm) ở cả mobile và desktop. Thẻ sản phẩm: mobile 0–1 trên, 2 dưới; desktop 0–2 trên, 3 dưới; khớp với dòng VPI đã chọn tay.
- Còn lại: thử nút Lưu khi tab admin mở trước một lần ghi qua MCP (lỗi 4).

### Thử nút Lưu với bản 1.2.2

- Tab admin mở trước, MCP ghi `flatsome_prefetch` `""` → `"1"`, người dùng bật Debug Log rồi Lưu, tắt Debug Log rồi Lưu.
- Kết quả: `flatsome_prefetch` vẫn `"1"`: **lỗi 4 đã hết**, nút Lưu không còn ghi đè thay đổi của MCP.
- Lỗi mới P: `active_debug` vẫn `"1"` sau lần Lưu thứ hai. `save.js` chỉ ghi giá trị gốc lúc mở trang. Nếu trang không tải lại sau lần Lưu đầu, đổi option về giá trị lúc mở trang bị coi là "không đổi", không gửi gì, popup vẫn báo "Options is saved". Sửa ở `1.2.3`: sau khi lưu thành công thì cập nhật giá trị gốc (`rememberOptionValues()`); không có thay đổi thì báo "No changes to save". Cơ chế khớp kết quả nhưng chưa tái hiện được trên trình duyệt.

### Thử nút Lưu với bản 1.2.3

Cùng các bước như trên, lần Lưu thứ hai đóng popup mà không tải lại trang. Kết quả: `flatsome_prefetch` vẫn `"1"`, `active_debug` về `""`, các option khác và 2 dòng VPI không đổi. Lỗi 4 và lỗi P đều đã hết.

### Việc còn mở sau audit chiều 2026-10-08 (1.2.3)

Căn cứ: audit trang chủ và `/cau-chuyen/` của frozen-top.io.vn trên 1.2.3. Cùng nội dung với mục 10 của `Ke-hoach-phat-trien-plugin-toi-uu-v2.pdf`.

| Mã | Ưu tiên | Vấn đề và bằng chứng | Hướng sửa |
| --- | --- | --- | --- |
| Q | Cao | `<script id="vnx-inline-delay-css">` không có `data-no-optimize`/`data-no-defer`, LiteSpeed đổi thành `type="litespeed/javascript"` (cả 4 bản HTML: 2 trang × 2 thiết bị). CSS delay phụ thuộc bộ nạp JS của LiteSpeed | Thêm `data-no-optimize="1" data-no-defer="1"` như script `vnx-lazyload`. Kiểm tra bằng thao tác thật: CSS nạp sau đúng một lần tương tác |
| R | Cao | `LS_delay_combined_css` bật, trang không có Critical CSS: khi CSS gộp nạp, màn hình đầu dời 114 px desktop (layout shift 0,086), 165 px mobile (0,18). PSI không thấy | `vnx_analyze_pagespeed` thêm dòng P1 khi delay CSS bật và trang không có dòng Critical CSS. `vnx_set_options` cảnh báo khi bật delay CSS mà chưa có Critical CSS. Nhắc `only_optimized` |
| S | Trung bình | Gỡ dòng (MCP hoặc admin) không purge: bảng VPI trống nhưng HTML cache trang chủ vẫn có ảnh hero `src` thật và preload | `vnx_remove_row` trả URL cần purge. `vnx_analyze_pagespeed` so HTML cache với HTML mới, cảnh báo `cache_stale` |
| T | Trung bình | `/cau-chuyen/` cache từ 2026-10-02 trỏ `vietnix-pagespeed-pro-edit/assets/css/vnx-empty.css` (404) | Cảnh báo khi HTML cache chứa đường dẫn plugin khác thư mục hiện tại. Hướng dẫn admin purge all trong LiteSpeed sau khi đổi thư mục hoặc nâng bản |
| U | Trung bình | `img#brxe-498nzg` (`/cau-chuyen/`, mobile) trả `above_fold: true`, đỉnh thật 1 274 px (viewport 915 px). Giới hạn 2 ảnh mỗi khối sai khi thẻ xếp một cột | Khối một cột trên mobile chỉ tính 1 ảnh, hoặc trả `above_fold: "guess"` |
| V | Thấp | `image-delivery-insight` đề xuất `(replace)` chung; `vpi_replace_size_mobile` = `medium` (300 px) trong khi hero mobile cần 977 px | Đề xuất `[sz-…-sz]` theo bề rộng hiển thị × DPR |
| W | Thấp | `vpi_replace_size_*` nhận tên size bất kỳ | Kiểm tra theo danh sách size WordPress |
| X | Thấp | `VNX_MCP_Report::save()`/`get()` còn trong mã, không dùng | Gỡ |
