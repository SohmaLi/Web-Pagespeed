# Thay đổi quy trình — 2026-10-16

> **Lưu ý khi đọc:** Số liệu trong tài liệu này lấy từ lần chạy frozen-top.io.vn ngày 2026-10-15 – 16, chỉ để giải thích lý do thay đổi quy trình. Không dùng làm mốc so sánh, ngưỡng đạt hay kết quả mong đợi cho site khác, hoặc cho lần chạy khác của chính frozen-top.io.vn (cấu hình plugin đã đổi từ đó). Tiêu chí và quy trình hiện hành: `README.md` mục **Quy trình**.
>
> Một số khó khăn bên dưới plugin đã xử lý sau đó: `vnx_critical_crawler` để AI sinh Critical CSS, tùy chọn VPI `keep` (ảnh `(replace)` không còn bị đổi về ảnh gốc), script nạp CSS không còn bị LiteSpeed hoãn. Cách plugin chạy hiện tại: `PLUGIN.md`.

Quy trình audit và tối ưu chuyển sang hai giai đoạn theo sơ đồ `Phase 1.png`, `Phase 2.png`. Phân tích chi tiết: `Phân tích quy trình.md` (và bản PDF) trong thư mục này.

## Điểm chính

| Trước | Sau |
| --- | --- |
| Trường hợp chọn theo trạng thái plugin: 1 = chưa cài, 2 = đã cài | Trường hợp chọn theo **yêu cầu của khách**: 1 = chỉ khảo sát (Phase 1), 2 = khảo sát và tối ưu (Phase 1 rồi Phase 2) |
| Agent tự nhận ra trường hợp | Người dùng nói "khảo sát" hoặc "tối ưu", hoặc điền ô **Trường hợp** trong `Do.md`. Không rõ thì agent hỏi |
| Site chưa cài plugin: đo, báo cáo, dừng | Trường hợp 2: làm Phase 1, rồi dừng chờ cài plugin và nối MCP, sau đó làm tiếp Phase 2 |
| Site đã cài plugin: luôn hỏi tối ưu | Trường hợp 1: chỉ báo cáo, không hỏi tối ưu, không ghi lên site |
| Mỗi lần chạy đo lại từ đầu | Trường hợp 2 dùng lại báo cáo Phase 1 đã có của tên miền (bước 0b); chỉ khảo sát thêm link còn thiếu |
| Mốc "trước" là lần đo đầu tiên | Đo lại sau khi cài plugin (bước 2b) làm mốc "trước"; số Phase 1 giữ để tham khảo |
| Đo lại sau tối ưu: điểm PSI và tải thật | **Double check**: Point (PSI) và **Site health** (tốc độ và giao diện ở cửa sổ ẩn danh: ảnh trống/mờ, bố cục, mất style, lỗi script, bản sau khi trang tự tải lại) |
| Báo cáo kết quả | **Nghiệm thu**: lần đo điểm cuối sau khi đạt, kèm báo cáo kết quả và đề xuất bổ sung. AI kết thúc ở đây |
| — | Đổi sang plugin lite: việc của người dùng, bắt buộc, sau khi AI kết thúc. Bản lite ẩn các option (chi tiết cập nhật sau) |
| Đề xuất đổi option toàn site khi cần | Chỉ tối ưu trang được yêu cầu. Option toàn site chỉ đổi khi người dùng yêu cầu rõ |
| Mọi audit dưới 0,9 đều thành dòng đề xuất | Đánh giá từng trang theo 6 thông số. Đạt hết: báo cáo ghi **Không cần tối ưu**. Có thông số chưa đạt: chỉ tối ưu thông số đó |

## Lý do (từ lần chạy frozen-top.io.vn, 2026-10-15 – 16)

- Cài plugin đã làm PSI mobile đổi 90 → 93 trước khi tối ưu: plugin lazyload ảnh hero nên PSI không thấy ảnh. So nghiệm thu với số Phase 1 sẽ sai mốc.
- Điểm PSI có thể tăng mà khách thật không nhanh hơn: PSI mobile 93 → 96, nhưng Load tải thật 243 → 371 ms và khách vẫn tải ảnh gốc 1,94 MB. Cần thêm Site health.
- Tối ưu cần nhiều vòng (vòng 1 phải rollback), nên Double check phải có nhánh "chưa đạt" và "tệ hơn".

## Quy tắc đánh giá trang

Áp dụng từ báo cáo hiện trạng (bước 2). Trường hợp 2 đánh giá lại trên mốc đo sau khi cài plugin (bước 2b).

| Thông số | Đạt khi | Chưa đạt thì tập trung vào |
| --- | --- | --- |
| Điểm tổng hiệu suất PSI mobile | ≥ 90 (xanh) | Khi tối ưu: chỉ số con chưa xanh (FCP, LCP, TBT, CLS, Speed Index, TTFB) |
| Điểm tổng hiệu suất PSI desktop | ≥ 90 | Như trên, cho desktop |
| Tốc độ load thật | Desktop ≤ 2 s, Mobile ≤ 3 s | TTFB, CSS/JS chặn hiển thị, ảnh lớn ở màn hình đầu |
| Cache | Có cache (`hit`) | Ngoài plugin: đề xuất LiteSpeed và đề xuất bổ sung |
| Giật ảnh do tải chậm | Ảnh màn hình đầu có `src` thật, hiện ngay; CLS ≤ 0,25 | VPI, lazyload ảnh, size ảnh theo khung |
| Load chậm do bên thứ 3 | Không đáng kể | Trì hoãn script bên thứ ba |

- **Đạt cả 6 thông số:** báo cáo ghi `Không cần tối ưu` kèm số đo. Vấn đề nhỏ ghi trạng thái `theo dõi`, không đề xuất sửa. Mục `TỐI ƯU DỰ KIẾN` trong file Word ghi "Không cần tối ưu: trang đã đạt các tiêu chí".
- **Có thông số chưa đạt:** ghi rõ thông số và số đo. Chỉ dòng gắn với thông số đó là `proposed`; dòng khác `theo dõi`. Bảng audit có thêm cột **Thông số**.
- Bước duyệt đề xuất sẵn: trang đạt → không tối ưu, trang chưa đạt → tối ưu. Người dùng vẫn chọn khác được.
- Mọi trang đạt và người dùng đồng ý: kết thúc ở báo cáo hiện trạng, không cần nghiệm thu.
- Nghiệm thu đạt khi thông số chưa đạt nay đã đạt, và thông số đã đạt không tụt xuống.
- **Báo cáo chỉ xét điểm tổng hiệu suất PageSpeed.** FCP, LCP, TBT, CLS, Speed Index, TTFB chỉ dùng khi tối ưu: chọn dòng đề xuất cho trang có điểm tổng chưa đạt, và so trước/sau ở Double check để biết thay đổi nào có tác dụng.
- **Dòng chú ý dưới bảng đo:** mỗi trang có một dòng liệt kê các chỉ số không cần cải thiện (điểm tổng PSI ≥ 90; Load trong ngưỡng, cache `hit`, CLS ≤ 0,1). Có ở báo cáo `.md` và file Word (khóa `note` mới của `scripts/fill-status-docx.py`).

Lý do: trang chủ frozen-top đã đạt cả 4 tiêu chí Word và PSI mobile 93 / desktop 100 trước khi tối ưu. Ba vòng tối ưu gần như không làm khách thật nhanh hơn (Load mobile 243 → 371 ms) và còn sinh lỗi mới (vòng 1 điểm giảm, vòng 3 ảnh mờ).

## Khó khăn khi thực thi tối ưu

Ghi lại từ lần chạy frozen-top.io.vn (trang chủ, theme Bricks, LiteSpeed Cache có Guest Mode), ngày 2026-10-15 – 16. Số liệu trích ngay trong tài liệu này; thư mục báo cáo của lần chạy đó không còn trong `reports/`.

### 1. Điểm PageSpeed và trải nghiệm thật đi ngược nhau

| Khó khăn | Bằng chứng | Ảnh hưởng | Cách xử lý |
| --- | --- | --- | --- |
| Plugin lazyload ảnh màn hình đầu nên PSI không thấy ảnh, lấy chữ làm LCP và chấm điểm cao hơn thực tế | Ngay sau cài plugin: PSI mobile 90 → 93, `src` ảnh hero là SVG giữ chỗ, khung hero trống trong ảnh PSI | Điểm "đẹp" nhưng khách thật tải ảnh gốc 1,99 MB sau mốc Load | Đo lại sau cài plugin làm mốc "trước"; kiểm tra `data-vnx-lazy` trên HTML, không chỉ nhìn điểm |
| Sửa đúng lỗi lại làm điểm giảm | Ghi VPI cho ảnh hero: PSI mobile 93 → 88, LCP chữ 2,3 s → ảnh 3,1 s (PNG 194 KB trên mạng chậm) | Vi phạm điều kiện "điểm mobile không tệ hơn"; vòng 1 phải rollback | Báo trước cho người dùng; ưu tiên làm nhẹ file ảnh (WebP) trước khi bỏ lazyload |
| Điểm tăng nhờ hạ chất lượng ảnh | Đổi ảnh VPI mobile sang bản 300 px: PSI mobile 88 → 96, nhưng khung cần ~651 px nên ảnh mờ | Khách thấy ảnh mờ đến khi bản gốc tải xong | Thêm Site health (kiểm tra ảnh mờ); giữ 300 px tạm thời, đổi về 768 px sau khi có WebP |
| Điểm tăng nhưng tải thật không nhanh hơn | Sau 3 vòng: PSI mobile 93 → 96, Load tải thật mobile 243 → 371 ms (có lần 811 ms) | Báo cáo dễ hiểu sai là "đã nhanh hơn" | Báo cáo nghiệm thu ghi cả tải thật và Site health, không chỉ điểm |

### 2. Khách thật không nhận được tối ưu như PSI

| Khó khăn | Bằng chứng | Ảnh hưởng | Cách xử lý |
| --- | --- | --- | --- |
| LiteSpeed Guest Mode: lượt đầu nhận bản guest, rồi trang tự tải lại thành bản khách thường | `navigation.type` = `reload` khi mở phiên mới; curl và PSI giữ bản guest | Tối ưu của plugin chỉ tới PSI và lượt tải đầu | Kiểm tra cả bản sau khi tải lại (Site health) |
| Muốn khách thường nhận tối ưu phải bật key `_client` — đây là option toàn site | VPI chỉ tới khách thật sau khi bật `vietnix_vpi_active_client`, `vpi_replace_size_client`; Critical CSS cần `vnx_critical_client` (đo vòng 3: `critical` = false) | Mâu thuẫn với quy tắc "chỉ tối ưu trang được yêu cầu" | Chỉ bật khi người dùng yêu cầu rõ; ghi rõ ai thực sự nhận thay đổi |
| Sau mốc Load, plugin trả `src` về ảnh gốc | Sau VPI, trình duyệt vẫn tải `HERO.png` 1,94 MB (bắt đầu ~533 ms) cộng thêm bản preload | Tổng dung lượng tăng, không giảm | Sửa size ảnh trong Bricks (việc của người dùng) |

### 3. Nút thắt nằm ngoài khả năng của plugin

| Khó khăn | Bằng chứng | Ai làm |
| --- | --- | --- |
| Ảnh hero PNG lớn, chưa có WebP | `HERO.png` 1,99 MB; `HERO-768x315.png.webp` trả 404 | Người dùng: LiteSpeed Image Optimization hoặc xuất lại ảnh |
| Page builder chèn ảnh size `full`, `sizes="100vw"` | Khung 548 px (desktop), 372 px (mobile) nhưng tải bản 2504 px | Người dùng: chọn size trong Bricks |
| Font Google chặn hiển thị chữ | 11 file WOFF2 Be Vietnam Pro; FCP mobile 2,3 s không đổi dù đã có Critical CSS | Người dùng: tự host font |
| Nền hero do page builder lazyload | `bricks-lazy-hidden`, chữ trắng trên nền kem trong ảnh PSI | Người dùng: tắt lazyload phần tử màn hình đầu trong Bricks |
| MCP không sinh được nội dung Critical CSS | Phải sinh bằng công cụ ngoài rồi mới lưu qua MCP | Người dùng hoặc công cụ ngoài |

Hệ quả: AI qua MCP chỉ xử lý được phần cấu hình plugin. Phần lớn cải thiện thật nằm ở file `Đề xuất bổ sung` (phần A).

### 4. Ghi nhận và đo đạc

| Khó khăn | Bằng chứng | Cách xử lý |
| --- | --- | --- |
| Có thay đổi ghi lên site nhưng không có log | Critical CSS id 26/27 và đổi size ảnh mobile được ghi sau khi báo cáo đã chốt, không có dry-run lưu lại; ảnh chụp lần 4 là bản sao của lần 3 | Mọi lần ghi (kể cả rollback) ghi vào `.md` ngay sau khi ghi (README bước 3 mục 8); đối chiếu `vnx_list_rows`, `vnx_list_options` với báo cáo trước khi nghiệm thu |
| Số đo dao động | Cùng một phút PSI mobile ra 93 và 95; mỗi vòng chỉ đo tải thật một lần | Đã áp dụng: mốc "trước", Double check và nghiệm thu đo 3 lần (lệch nhiều thì 5), lấy trung vị; chênh lệch trong ngưỡng nhiễu coi là không đổi (xem **Bổ sung: đo nhiều lần, lấy trung vị**) |
| Cache làm sai số đo | Phase 1: cache LiteSpeed còn HTML của plugin cũ đã gỡ; vòng 3 desktop `cache: miss` sau purge | Purge đúng trang trước khi đo; ghi trạng thái cache vào báo cáo |
| Khó xác định plugin đã cài | File `vnx-pagespeed.php` trả 404 ở cả 2 thư mục mặc định dù plugin đang chạy (thư mục tên khác) | Dựa thêm vào dấu vết HTML và `vnx_get_status` |

### 5. Kết nối và công cụ

| Khó khăn | Cách xử lý |
| --- | --- |
| Một kết nối MCP chỉ trỏ một site; thêm MCP giữa phiên phải khởi động lại agent | Bước 0 kiểm tra `site_url`; trường hợp 2 dừng ở bước 2b chờ nối đúng miền |
| Purge chỉ nhận URL đã đi qua phiên (`url_not_in_session`) | Gọi `vnx_resolve_url` hoặc `vnx_test_selector` cho URL trước khi purge |
| Máy chạy agent thiếu LibreOffice/Poppler nên khó kiểm tra trực quan file `.pptx`, `.pdf` | Dùng bản xem trước Quick Look (không hiện hết hình khối); nên mở bằng PowerPoint/Keynote kiểm tra lại |

## Các bước mới (README, mục Quy trình)

| Bước | Giai đoạn | Việc |
| --- | --- | --- |
| 0 | Chung | Kiểm tra plugin, MCP, trường hợp |
| 0b | Trường hợp 2 | Tìm báo cáo Phase 1 để dùng lại |
| 1 | Phase 1 | Phân tích: PSI, tải thật, HTML |
| 2 | Phase 1 | Báo cáo hiện trạng (`.md` + Word), đánh giá 6 thông số từng trang: `Không cần tối ưu` hoặc thông số cần tối ưu. Trường hợp 1 kết thúc |
| 2b | Phase 2 | Chờ cài plugin / nối MCP nếu cần, đo lại sau cài plugin, đánh giá lại thông số, hỏi duyệt |
| 3 | Phase 2 | Tối ưu: dry-run, xác nhận, ghi, purge, kiểm tra HTML |
| 4 | Phase 2 | Double check (Point + Site health), cổng kết quả, nghiệm thu. AI kết thúc |
| — | Người dùng | Đổi sang plugin lite |

## File đã sửa

| File | Thay đổi |
| --- | --- |
| `README.md` | Viết lại mục **Hai trường hợp** và **Quy trình** (bước 0, 0b, 1, 2, 2b, 3, 4; mục **Đo khi chưa có MCP đúng miền** thay mục "Trường hợp 1"). Thêm `quy-trinh/` vào bảng file |
| `HUONG-DAN.md` | Hai trường hợp mới; trường hợp 2 gồm 5 bước (Gửi link → Cài plugin → Chọn và duyệt → Kiểm tra lại và nghiệm thu → Đổi plugin lite); tin nhắn mẫu "Khảo sát…" / "Tối ưu…"; thêm thuật ngữ Phase 1, Phase 2, Site health, Nghiệm thu |
| `HUONG-DAN.pptx` | 19 → 20 slide: sửa slide 2, 4–7, 10–15, 20; "Gửi link" thành Bước 1, "Cài plugin" thành Bước 2; slide mới "Bước 4. Kiểm tra lại và nghiệm thu"; đánh lại số trang |
| `HUONG-DAN.pdf` | Tạo lại từ `HUONG-DAN.md` |
| `scripts/fill-status-docx.py` | Thêm khóa `note` theo từng trang: in dòng "Chú ý: …" dưới bảng của trang |
| `Do.md` | Thêm ô **Trường hợp** ở mục 1; mục 2 đổi tên "Link cần đo"; mục 3 thêm **Trạng thái plugin/MCP**, **Báo cáo Phase 1**, **Giai đoạn** |
| `audit-pagespeed/SKILL.md` | Bỏ cách chia trường hợp theo plugin; trường hợp 2 sang bước 2b sau báo cáo hiện trạng; cột **Thông số** và trạng thái `theo dõi` trong bảng audit |
| `apply-pagespeed/SKILL.md` | Dừng ở bước 2b khi chưa có MCP đúng miền; chỉ ghi thay đổi gắn với thông số chưa đạt; Double check, nghiệm thu; AI kết thúc sau nghiệm thu |
| `quy-trinh/Phân tích quy trình.md` (+ `.pdf`) | Bản phân tích sơ đồ Phase 1, Phase 2 và quy trình đề xuất |

Bản sao các file trước khi sửa nằm trong thư mục tạm của phiên làm việc, không lưu trong bộ.

## Người vận hành cần biết

1. Khi gửi link, nói rõ **"Khảo sát các link sau"** (trường hợp 1) hoặc **"Tối ưu các link sau"** (trường hợp 2). Hoặc điền ô **Trường hợp** trong `Do.md`.
2. Khách đã có báo cáo khảo sát mà giờ muốn tối ưu: gửi lại link và nói "tối ưu". Agent dùng lại báo cáo cũ, không đo lại từ đầu.
3. Site chưa cài plugin: agent khảo sát xong sẽ dừng, nhờ cài plugin và nối agent. Cài xong nhắn `tiếp tục`.
4. Báo cáo kết quả sau tối ưu là **báo cáo nghiệm thu**. Agent dừng ở đây; sau đó bạn đổi sang plugin lite.
5. Mốc "trước" và mỗi lần kiểm tra lại, agent đo mỗi link 3 lần và lấy số giữa. Mỗi vòng lâu hơn và tốn quota PageSpeed gấp 3; chênh lệch nhỏ được coi là không đổi.
6. Agent chỉ so số trong báo cáo đúng tên miền, của cùng link. Không dùng báo cáo của site khác.

## Còn mở

- Chi tiết bản lite (option nào ẩn, dữ liệu có giữ không): chờ cập nhật.
- Slide "Thuật ngữ" trong pptx đã đầy, chưa thêm Phase 1, Phase 2, Site health, Nghiệm thu (đã có trong `HUONG-DAN.md` và PDF).
- Chưa xem được chữ trong ô mẫu tin nhắn (slide 8) và sơ đồ slide "Tóm lại" (slide 20) bằng PowerPoint; nên mở kiểm tra một lần.
- Slide 12 (thẻ Point) và slide 17 (hàng lỗi 429) đã sửa chữ, chỉ đo độ vừa bằng trình duyệt; nên mở bằng PowerPoint kiểm tra một lần.
- Ngưỡng nhiễu (điểm 3, 200 ms, CLS 0,02) đặt theo một lần chạy; xem lại khi có thêm dữ liệu.

## Bổ sung: site đã có cấu hình plugin từ trước

Site cần tối ưu lại mà đã có option hoặc dòng VPI, Critical CSS, lazyload HTML từ trước (lần tối ưu cũ, người khác chỉnh trong wp-admin).

| Trước | Sau |
| --- | --- |
| Đọc `vnx_list_options`, `vnx_list_rows` chỉ để biết hiện trạng; đề xuất thêm dòng mới | **Bước 2b mục 5:** kiểm tra từng option và dòng cũ của trang, kết luận `giữ`, `thay` hoặc `gỡ` kèm bằng chứng (bảng **Cấu hình đã có** trong `.md`) |
| Dòng `proposed` chỉ là việc thêm | Dòng `proposed` có cột **Thao tác**: `thêm`, `thay`, `gỡ`, ghi giá trị cũ → mới. Trang đã có dòng thì sửa theo `id` |
| Rollback chỉ có `vnx_rollback_options` (lần `vnx_set_options` gần nhất) | **Bước 3 mục 0:** lưu `cau-hinh-truoc-toi-uu.json` (option và ba bảng dòng, kể cả nội dung Critical CSS) trước lần ghi đầu tiên. **Bước 4:** khôi phục về cấu hình trước khi tối ưu từ file này |

Quy tắc giữ nguyên: trang đạt cả 6 thông số thì mọi mục là `giữ`; trang chưa đạt chỉ thay hoặc gỡ mục gắn với thông số chưa đạt hoặc đang gây lỗi; option toàn site chỉ thay khi đang gây lỗi trên trang được tối ưu hoặc người dùng yêu cầu rõ; dòng nhóm áp cho trang khác không sửa khi chưa được duyệt.

Lý do: `vnx_list_rows` trả cả nội dung Critical CSS nên lưu được bản đầy đủ. Lần chạy frozen-top có nhiều lần ghi và thay dòng cũ, nhưng `vnx_rollback_options` không đưa được site về cấu hình ban đầu.

File đã sửa: `README.md` (bước 2b mục 5, bước 3 mục 0, bước 4 cổng kết quả, mục **Báo cáo**), `apply-pagespeed/SKILL.md` (mục **Cấu hình đã có**, mục 9), `audit-pagespeed/SKILL.md`, `HUONG-DAN.md` (bước 2, bước 3, bảng **Kết quả**) và `HUONG-DAN.pptx`.

## Bổ sung: đo nhiều lần, lấy trung vị

Một lần đo dao động vài điểm PSI và vài trăm mili giây tải thật, đủ để cổng kết quả ở bước 4 chọn sai nhánh: rollback một thay đổi đúng, hoặc báo "đã nhanh hơn" khi chỉ là nhiễu.

| Trước | Sau |
| --- | --- |
| Mỗi lần đo chạy PSI và tải thật một lần | Mốc "trước" (bước 2b mục 3), Double check (Point và tốc độ load của Site health) và nghiệm thu: mỗi link, mỗi thiết bị đo **3 lần** liên tiếp, không ghi hay purge xen giữa. Phase 1 vẫn đo một lần |
| Lấy số của lần đo đó | Lấy **trung vị riêng từng chỉ số** (điểm, FCP, LCP, TBT, CLS, Speed Index, TTFB, Load), không lấy trọn một lần "đẹp nhất". Ngưỡng đạt xét trên trung vị |
| — | 3 lần lệch nhiều (điểm chênh trên 5, hoặc Load chênh trên 300 ms) thì đo thêm 2 lần, lấy trung vị của 5. Lần có cache không `hit` hoặc lỗi thì bỏ, đo bù |
| Mọi chênh lệch đều tính là tốt hơn hoặc tệ hơn | **Ngưỡng nhiễu**: điểm PSI ≤ 3, Load/LCP/FCP ≤ 200 ms, CLS ≤ 0,02 coi là không đổi. Nhánh "tệ hơn" chỉ chọn khi trung vị kém hơn mốc quá ngưỡng này |
| Mốc "trước" có thể là một lần đo Phase 1 | Mốc cũng là trung vị của 3 lần. Dùng lại số Phase 1 đo một lần thì đo thêm 2 lần trước lần ghi đầu tiên ở bước 3 |
| Báo cáo ghi một số | Báo cáo ghi trung vị; phần dữ liệu kỹ thuật ghi số từng lần (hoặc thấp nhất – cao nhất) và số lần đo |
| — | Mỗi vòng tốn 6 request PSI mỗi link. Hết quota thì dừng, báo người dùng; không kết luận đạt hay tệ hơn từ một lần đo |

Cách chạy: `vnx_analyze_pagespeed` 3 lần; `measure-run.js` 3 lần, mỗi lần một `--scratch` riêng, chỉ lần thứ 3 có `--assets`; có điểm MCP thì thêm `--skip-psi`.

Lý do: trên frozen-top.io.vn, cùng một phút PSI mobile ra 93 và 95, và mỗi vòng chỉ đo tải thật một lần (Load mobile có lần 371 ms, có lần 811 ms). Với một lần đo, chênh 2 điểm đủ để kích hoạt nhánh "tệ hơn" hoặc kết luận sai là đã cải thiện. Các ngưỡng nhiễu đặt theo mức dao động này và có thể chỉnh sau khi có thêm dữ liệu.

File đã sửa: `README.md` (bước 4 mục **Đo nhiều lần, lấy trung vị**, Point, Site health, cổng kết quả, nghiệm thu mục 5; bước 2b mục 3; mục lệnh đo), `measure-page-load/SKILL.md` (ngoại lệ cho quy tắc "không đo lần hai"), `apply-pagespeed/SKILL.md` (mục 7), `HUONG-DAN.md` (bước 2, bước 4, lỗi 429, thuật ngữ **Trung vị**), `HUONG-DAN.pptx` (slide 17 "Gặp lỗi" hàng lỗi 429, slide 12 "Bước 4" thẻ Point) và `HUONG-DAN.pdf`.

## Bổ sung: nguồn so sánh và tìm báo cáo đúng tên miền

Số đo của site khác, hoặc số minh họa trong tài liệu, có thể bị agent lấy làm mốc và làm sai kết luận đạt / tệ hơn.

| Trước | Sau |
| --- | --- |
| Bước 0b tìm thư mục `*-ten-mien/` (khớp theo đuôi): miền `abc.vn` có thể nhận nhầm thư mục `YYYY-MM-DD-shop-abc.vn` | Phần sau ngày phải trùng **đúng** tên miền. `www.` và không `www.` là cùng miền; tên miền con khác là miền khác. Link khớp theo URL đầy đủ |
| Không nói rõ được so với số nào | Mục **Nguồn so sánh** (README): mốc "trước" và số "sau" chỉ lấy trong thư mục của lần chạy hiện tại (hoặc báo cáo Phase 1 ở bước 0b), cùng URL, cùng thiết bị, cùng nguồn đo |
| `quy-trinh/` được trỏ tới như tài liệu quy trình, có số liệu frozen-top | Ghi chú đầu hai tài liệu và trong README: số liệu `quy-trinh/` chỉ minh họa, không dùng làm mốc, ngưỡng hay kết quả mong đợi |

File đã sửa: `README.md` (mục **Nguồn so sánh**, bước 0b, dòng sơ đồ nghiệp vụ, bảng file), `apply-pagespeed/SKILL.md`, `audit-pagespeed/SKILL.md` (mục **Trước khi đo**), `Do.md` (ô **Báo cáo Phase 1**), `HUONG-DAN.md` (bước 1), `HUONG-DAN.pptx` (slide 7: dùng lại báo cáo đúng tên miền, đo lại 3 lần lấy số giữa), `HUONG-DAN.pdf`, `quy-trinh/Phân tích quy trình.md` (ghi chú đầu, bước kiểm tra báo cáo Phase 1, Double check, mục 5 **Còn mở**) và tài liệu này.

Thư mục `reports/` đã dọn trống ngày 2026-10-16. Các miền đã khảo sát trước đó (frozen-top.io.vn, radiantclean.com.au) cần khảo sát lại Phase 1 nếu tối ưu.

## Bổ sung: kế hoạch phát triển plugin

`KE-HOACH-MCP-AI-PAGESPEED.md` (thư mục gốc) mục 1–8 viết lại theo quy trình mới: hai trường hợp và hai giai đoạn, Phase 1 không cần MCP, 6 thông số và `Không cần tối ưu`, chỉ tối ưu trang và thông số được yêu cầu, cấu hình đã có (`giữ`/`thay`/`gỡ`) và `cau-hinh-truoc-toi-uu.json`, Double check (Point + Site health), đo 3 lần lấy trung vị, cổng kết quả, nghiệm thu, plugin lite do người dùng đổi. Mục 6 đổi tên thành **Luồng thực thi (Phase 1, Phase 2)**. Mục 9 trở đi (nhật ký sửa plugin) giữ nguyên, thêm ghi chú số liệu ở đó không dùng làm mốc. Bản PDF kế hoạch (v1, v2) chưa tạo lại.
