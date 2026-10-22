# Cách AI hiểu và thực hiện yêu cầu phân tích, tối ưu

> Ngày viết: 2026-10-20. Đây là cách agent hiểu quy trình ở `README.md` (mục **Quy trình**), `PLUGIN.md` và các chỉ dẫn của người dùng trong các phiên làm việc. Khi tài liệu này khác `README.md`, làm theo `README.md`. Số liệu ví dụ lấy từ frozen-top.io.vn ngày 2026-10-20, chỉ để minh họa, không dùng làm mốc hay ngưỡng.

## 1. Nhận yêu cầu

| Người dùng gửi | AI hiểu là | Việc đầu tiên |
| --- | --- | --- |
| Danh sách link | Bắt đầu một lần chạy | Điền tên miền và link vào `Do.md` |
| "Kiểm tra", "khảo sát", "đo và báo cáo" | **Trường hợp 1**: chỉ Phase 1 | Đo, báo cáo hiện trạng, kết thúc. Không ghi gì lên site |
| "Tối ưu" | **Trường hợp 2**: Phase 1 rồi Phase 2 | Có báo cáo Phase 1 của đúng miền thì dùng lại; chưa có thì làm Phase 1 trước |
| Không rõ trường hợp nào | — | Hỏi lại, không đoán |

**Bước 0 (cả hai trường hợp):**
- Kiểm tra plugin đã cài chưa.
- Gọi `vnx_get_status` một lần để biết MCP đang nối site nào, so với tên miền trong `Do.md`.
- Sai miền hoặc chưa có MCP thì vẫn đo, nhưng không gọi tool `vnx_*` khác.

## 2. Trường hợp 1 — Phân tích (Phase 1)

1. **Đo** mỗi link:
   - PSI mobile và desktop: qua `vnx_analyze_pagespeed` khi MCP đúng miền; nếu không thì dùng API key trong `Do.md`.
   - Tải thật: `measure-run.js` (TTFB, Load, LCP, CLS, cache, ảnh màn hình đầu).
2. **Đọc trang:** HTML và header; theme hoặc page builder; plugin tối ưu đang có; ảnh màn hình đầu có bị lazyload không; script bên thứ ba.
3. **Đánh giá 6 thông số:**

| Thông số | Đạt khi |
| --- | --- |
| Điểm PSI mobile | ≥ 90 |
| Điểm PSI desktop | ≥ 90 |
| Tốc độ load thật | Desktop ≤ 2 s, Mobile ≤ 3 s |
| Cache | `x-litespeed-cache: hit` |
| Giật ảnh do tải chậm | Ảnh màn hình đầu có `src` thật, hiện ngay; CLS ≤ 0,25 |
| Bên thứ 3 | Không đáng kể |

   - Trang đạt cả 6: ghi **Không cần tối ưu**.
   - Trang chưa đạt: chỉ đề xuất việc cho đúng thông số chưa đạt. Dòng plugin xử lý được ghi `proposed` (hoặc `cần plugin` khi chưa có MCP); việc khác ghi `theo dõi` hoặc `ngoài phạm vi`.
4. **Báo cáo:** file `.md` kỹ thuật và file Word cho khách `Báo cáo - Hiện trạng website trước khi tối ưu - <miền>.docx`, cùng nằm trong `reports/YYYY-MM-DD-<miền>/`.
5. **Kết thúc:** trình tóm tắt từng link. Không hỏi về tối ưu.

## 3. Trường hợp 2 — Tối ưu (Phase 2)

### 3.1 Chuẩn bị

1. **Plugin và MCP:** chưa cài plugin, MCP chưa nối hoặc nối sai miền thì dừng, nhờ người dùng xử lý rồi nhắn `tiếp tục`.
2. **Mốc "trước":** đo lại sau khi cài plugin, PSI 3 lần và tải thật 3 lần, lấy trung vị. Đánh giá lại 6 thông số trên mốc này.
3. **Cấu hình đã có:** kiểm tra option và các dòng VPI, Critical CSS, lazyload HTML đang có. Mỗi mục kết luận `giữ`, `thay` hoặc `gỡ`, kèm bằng chứng.
4. **Hỏi người dùng:** link nào cần tối ưu (ghi cột **Tối ưu** trong `Do.md`) và dòng `proposed` nào được duyệt.
5. **Bản chụp cấu hình:** trước lần ghi đầu tiên, lưu `cau-hinh-truoc-toi-uu.json` làm điểm khôi phục.

### 3.2 Quy trình tối ưu một trang

Mỗi trang đi lần lượt 4 bước dưới đây. Mỗi lần ghi theo cùng một vòng:

> Chạy thử (dry-run) → trình thay đổi → **người dùng xác nhận** → ghi → purge riêng URL đó → mở HTML kiểm tra thay đổi đã có hiệu lực → đo.

**Bước 1. Critical CSS Generator**
- Gọi `vnx_critical_crawler` lấy link cào. Link này tạm tắt tối ưu Vietnix và cache LiteSpeed trong 15 phút.
- Chạy script cào trong Chrome cho mobile (412×832) và desktop (1350×940).
- Kiểm tra trước khi ghi:
  - Chụp trang đầy đủ và trang chỉ dùng Critical CSS; hai ảnh phải giống nhau.
  - Thay Critical CSS mới vào trang ngay trên máy để đo layout shift.
- Lưu ý:
  - Trang có nội dung chèn muộn (khối quảng cáo, khối test): cào khi đã tắt phần đó. Nếu không, nội dung màn hình đầu bị đẩy xuống và mất CSS. Ví dụ frozen-top: Critical CSS desktop thiếu CSS gallery, CLS 0,042; cào lại với `?nocls` thì còn 0,003.
  - Giữ các quy tắc người khác đã thêm tay vào Critical CSS.
  - Chỉ giữ `background-image` của ảnh LCP; bỏ ảnh nền khác để không tranh băng thông với ảnh LCP.
- Lưu lại sẽ ghi đè đúng dòng cũ của trang (dry-run báo `update` kèm `replaces_ids`).

**Bước 2. Viewport Image Configurations (VPI)**
- Tìm ảnh LCP và các ảnh thật sự hiện ở màn hình đầu nhưng đang bị lazyload (logo, icon). Đối chiếu dòng `vnx-lazy-hero`, rồi xác nhận trên trình duyệt. Tool đã tự bỏ qua ảnh bị ẩn bằng CSS inline.
- Thử selector bằng `vnx_test_selector` cho mobile và desktop: `count` đúng, `hidden` = 0, `above_fold` = true. Mỗi thiết bị có selector riêng; logo mobile và logo desktop thường là hai phần tử khác nhau.
- **Đặt ảnh LCP ở dòng cuối** của mỗi cột, vì preload và `data-vnx-lcp` gắn vào dòng cuối.
- Muốn đổi sang ảnh nhỏ hơn thì dùng `(replace [sz-…-sz] keep)`. Thiếu `keep`, plugin sẽ đổi lại về ảnh gốc khi lazyload chạy.
- Trang đã có dòng VPI thì sửa dòng đó bằng `id`, không thêm dòng mới.

**Bước 3. Đo PSI**
- **Đo 3 lần, cách nhau khoảng 80 giây.** PSI trả kết quả cache nếu gọi sát nhau.
- **Lấy trung vị riêng từng chỉ số.** Lệch trên 5 điểm thì đo thêm 2 lần, lấy trung vị của 5.
- **Ngưỡng nhiễu:** chênh lệch trong mức này coi như không đổi.
  - Điểm: ≤ 3
  - LCP, Load: ≤ 200 ms
  - CLS: ≤ 0,02
- **Khi một chỉ số xấu đi**, tìm nguyên nhân bằng đo thật trước khi kết luận:
  - PerformanceObserver ghi layout shift kèm phần tử.
  - Thời điểm tải từng file.
  - Thay nội dung trang ngay trên máy để so sánh.
  - Không chứng minh được thì đề xuất khôi phục bản trước. Ví dụ frozen-top: mobile 71 → 67 → 69; bản cũ khôi phục cũng ra 69, nên đó là dao động của PSI.

**Bước 4. Kết thúc: CSS/JS chậm → delay CSS/JS của plugin**
- Ghi nhận CSS/JS bị PSI báo chậm (`bootup-time`, `unused-javascript`, render-blocking).
- Đề xuất thêm vào delay CSS/JS của plugin. Keyword phải là tên file script, không quá ngắn (`js`). `jquery` hoặc `wp-includes` chỉ thêm khi người dùng duyệt đúng keyword đó.
- Script inline, `Unattributable`, script cố ý làm chậm: ngoài phạm vi plugin; ghi vào phần việc của người dùng.

### 3.3 Double check và nghiệm thu

- **Point:** PSI 3 lần, lấy trung vị, so với mốc "trước".
- **Site health** (như khách mới mở bằng cửa sổ ẩn danh):
  - Tốc độ load, cache.
  - Ảnh màn hình đầu có `src` thật.
  - Bố cục và lỗi console mới.
  - Bản sau khi LiteSpeed tự tải lại trang (khách thường).
  - Script bên thứ ba.
- **Cổng kết quả:**
  - Tệ hơn: đề xuất khôi phục, chạy thử trước, chờ xác nhận.
  - Chưa đạt nhưng plugin còn việc: hỏi trước khi làm vòng mới.
  - Chưa đạt và plugin hết việc: ghi KHÔNG ĐẠT kèm lý do.
  - Đạt: sang nghiệm thu.
- **Nghiệm thu:**
  - Đo cuối, chụp PSI.
  - Thêm mục **Kết quả sau tối ưu** vào file `.md`.
  - Tạo file Word `Báo cáo - Kết quả sau tối ưu - <miền>.docx`.
  - Còn việc thì tạo `Đề xuất bổ sung - <miền>.md`: A người dùng làm, B AI làm khi được duyệt, C không đề xuất.
- **AI kết thúc tại đây.** Đổi sang plugin lite là việc của người dùng.

## 4. Quy tắc luôn giữ

| Quy tắc | Cách làm |
| --- | --- |
| Bảo mật | Không in hay ghi token MCP, API key PageSpeed, mật khẩu WordPress. Đọc `.env` bằng script và không in ra |
| Ghi lên site | Mọi lần ghi và mọi lần khôi phục: chạy thử, trình thay đổi, chờ người dùng xác nhận. Mỗi lần ghi ghi ngay vào file `.md` |
| Phạm vi | Chỉ tối ưu trang được yêu cầu, chỉ cho thông số chưa đạt. Dùng dòng theo trang; option toàn site chỉ đổi khi người dùng yêu cầu rõ. Không purge toàn site |
| Không lưu lên site | Báo cáo chỉ nằm trong `reports/`. Không gọi `vnx_save_report`. Thay ảnh chỉ khi người dùng yêu cầu rõ |
| Việc của AI và việc của người dùng | Việc AI làm được (VPI, Critical CSS) không phải chờ việc của người dùng (gỡ script, nén ảnh) xong |
| Kiểm tra tool | Khi được yêu cầu kiểm tra tool: chỉ báo kết quả tool, không kèm lời khuyên tối ưu |
| Số liệu | Chỉ so trong cùng lần chạy, cùng URL, thiết bị và nguồn đo. Không bịa số; đo lỗi thì ghi "không đo được" |
| Khi sai | Phát hiện kết luận trước đó sai thì đính chính rõ trong báo cáo và tin nhắn |

## 5. Khi phát hiện lỗi plugin

1. Ghi lỗi kèm bằng chứng: tool, đầu vào, kết quả sai, kết quả đúng.
2. Sửa trong bản làm việc `vietnix.vn/wp-content/plugins/vietnix-pagespeed-pro`. Code phải dùng chung cho mọi site, không chứa selector, ID hay domain của khách. Không commit.
3. Thêm test, chạy `php -l` và 2 bộ test. Chạy thử logic mới trên HTML thật của trang trước khi đóng gói.
4. Nâng phiên bản, đóng `vietnix-pagespeed-pro.zip` trong `Web Pagespeed/`, giữ bản trước dạng `.zip.bak`.
5. Người dùng tự cài. AI kiểm tra lại trên site: `vnx_get_status` báo đúng phiên bản, 16 tool chạy, bản sửa cho kết quả đúng. Ghi kết quả vào báo cáo và `PLUGIN.md`.


## 6. Đầu ra của một lần chạy

Thư mục `audit-website/reports/YYYY-MM-DD-<miền>/`:

| File | Trường hợp |
| --- | --- |
| `YYYY-MM-DD-<miền>.md`: số đo, audit, mọi lần ghi và kết quả kiểm tra | 1 và 2 |
| `Báo cáo - Hiện trạng website trước khi tối ưu - <miền>.docx` | 1 và 2 |
| `cau-hinh-truoc-toi-uu.json`: điểm khôi phục | 2 |
| `Báo cáo - Kết quả sau tối ưu - <miền>.docx` | 2 |
| `Đề xuất bổ sung - <miền>.md` | 2, khi còn việc |
| `assets/`: ảnh PSI, ảnh trang; `critical-css/`: CSS đã cào, ảnh so sánh | Theo nhu cầu |
