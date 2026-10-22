---
name: measure-page-load
description: >-
  Mở trình duyệt, tải page và ghi TTFB, DOMContentLoaded, load, LCP. Dùng khi
  Cursor hoặc Claude Code cần đo tốc độ tải thật của một URL, trước hoặc sau
  khi tối ưu Vietnix Pagespeed.
---

# Đo tốc độ tải thật

Chỉ Cursor và Claude Code làm bước này, và chỉ khi có điểm PageSpeed để ghi cùng báo cáo. Điểm đó lấy qua `vnx_analyze_pagespeed` khi host `site_url` trùng miền, hoặc PSI API bằng key trong `Do.md` hay pagespeed.web.dev khi không có MCP hoặc MCP đang nối site khác (xem skill `audit-pagespeed`). Claude trên web và Codex không mở trình duyệt. Các agent đó chỉ dùng điểm PageSpeed Insights từ skill `audit-pagespeed`. File `vietnix-pagespeed-bridge.mjs` chỉ Cursor dùng khi gọi tool `vnx_*`. Claude Code nối HTTP trực tiếp, không copy file bridge. Lệnh đo mở URL trong `Do.md`, không mở `site_url` của MCP.

Plugin không mở trình duyệt và không nhận số đo nếu agent không ghi vào báo cáo.

## Cách đo

Chạy `node audit-website/scripts/measure-run.js --url <URL> --scratch <thư mục tạm> --assets <assets của lần chạy>`. PageSpeed (key đọc từ `Do.md`, đổi file bằng `--do`) và Chrome đi cùng lệnh. Có điểm MCP rồi thì thêm `--skip-psi`; chỉ cần PSI thì `--skip-browser`. Kết quả ở `<thư mục tạm>/summary.json`. Không viết script đo mới. Không đo lần hai khi `summary.json` đã có bốn mốc, LCP và CLS. Ngoại lệ: mốc "trước" ở bước 2b và Double check, nghiệm thu ở bước 4 đo 3 lần, mỗi lần một `--scratch` riêng, lấy trung vị từng chỉ số (mục **Đo nhiều lần** trong bước 4 của `audit-website/README.md`).

Script tự làm phần mở trang, chờ, đo và chụp ở các bước dưới đây. Agent đọc `summary.json` và ghi vào báo cáo.

1. Mở đúng URL gốc người dùng đưa, không thêm `?vnx-device=` (tham số đó chỉ ép `wp_is_mobile()` của plugin; LiteSpeed vẫn chọn cache theo User-Agent, và URL có query được cache riêng). Script dùng profile Chrome mới, mở URL một lần cho cache của page ấm (nhất là khi vừa purge), rồi tải lại, bỏ cache trình duyệt, và đo lần tải lại.
   - Site bật LiteSpeed Guest Mode: lượt mở đầu đã nhận cookie, nên lần đo là **bản khách thường**, không phải bản guest mà PSI và curl thấy. Key `_client` đang tắt thì hai bản khác nhau (`audit-website/PLUGIN.md` mục 1). Ghi rõ điều này khi so tải thật với PSI.
2. Đợi trang tải xong. Ảnh lazyload của guest có timer 4000 ms, của khách thường 100 ms. CSS delay không có timer: chờ thêm vài giây không làm CSS nạp. CSS chỉ nạp khi có tương tác ở bước 7. Đọc Navigation Timing và LCP của lần tải đó, không ước lượng.
3. Ghi bốn mốc (mili giây) và CLS:

| Mốc | Nguồn |
| --- | --- |
| TTFB | Thời gian tới byte đầu của tài liệu |
| DOMContentLoaded | Mốc DOMContentLoaded |
| Load | Mốc load |
| LCP | Largest Contentful Paint nếu trình duyệt trả về |
| CLS | Tổng dịch chuyển layout theo cửa sổ phiên, cách tính như Lighthouse. Đọc 3 giây sau mốc load, trước bước tương tác. `clsShifts` ghi tối đa 3 lần dịch lớn nhất kèm thời điểm và phần tử |

4. Ghi kèm máy đang đo, vì số này là tải từ máy chạy agent, không phải lab của Google.
5. Luôn đo cả mobile và desktop (desktop trước, cùng profile), mạng và CPU bình thường, không bật Slow 4G hay làm chậm CPU. Desktop: viewport 1350×900, DPR 1, UA Chrome macOS. Mobile: máy Moto G Power (2022), viewport 412×823, DPR 1,75, UA `Mozilla/5.0 (Linux; Android 11; moto g power (2022)) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36`. Thiếu UA mobile thì server trả HTML desktop, vì plugin chọn bản theo `wp_is_mobile()`. Đo trước và sau phải cùng UA. Báo cáo ghi rõ máy mobile là Moto G Power. Nếu trình duyệt chỉ có một dạng, ghi rõ dạng đã đo.
6. Ghi phần tử LCP (thẻ, id hoặc class, URL ảnh) và thời điểm request ảnh LCP bắt đầu. Request bắt đầu muộn hơn mốc load nhiều giây nghĩa là ảnh bị lazyload bằng JS. Kiểm tra `data-vnx-lazy` và `src` SVG giữ chỗ theo skill `audit-pagespeed`. Sau VPI, ảnh vẫn có `data-vnx-lazy="1"` nhưng `src` là URL thật.
7. Sau khi đọc CLS, script rê chuột một lần rồi ghi độ dịch chuyển của khối nội dung đầu theo px (`shiftPx`). Số này chỉ có ý nghĩa khi delay CSS đang bật: CSS thật nạp lúc tương tác và trang có thể nhảy. PSI không đo bước này vì Lighthouse không tương tác.
8. Ghi số vào file báo cáo `audit-website/reports/YYYY-MM-DD-ten-mien/YYYY-MM-DD-ten-mien.md`, cột **Tải thật**, cạnh điểm PageSpeed của cùng URL. Báo cáo chỉ nằm trong thư mục của lần chạy, không lưu lên site. Kèm `shiftPx` khi delay CSS đang bật.

## Ảnh chụp

Lưu ảnh vào `audit-website/reports/YYYY-MM-DD-ten-mien/assets/`. Công cụ chụp của trình duyệt có thể chỉ ghi được vào thư mục dự án.

- Bằng chứng giật ảnh: script chụp `load-<thiết bị>-after-load.png` ngay sau khi trang load xong, và chụp thêm `load-<thiết bị>-after-4s.png` sau 4,5 giây khi ảnh LCP hoặc ảnh hero vẫn là SVG giữ chỗ. Dùng cho báo cáo kỹ thuật hoặc khi người dùng hỏi bằng chứng.
- Agent không chụp được giao diện DevTools. Ảnh tab Network (thanh `DOMContentLoaded / Load`) cho báo cáo Word khách do người dùng tự chụp.
- Báo cáo Word khách: mục Tốc độ load chỉ ghi mốc Load của Desktop và Mobile. Tiêu chí ĐẠT là Desktop ≤ 2s, Mobile ≤ 3s.

Đo lại sau khi tối ưu: purge đúng page, rồi chạy lệnh 3 lần như mục **Cách đo** (script tự mở trang cho cache ấm). Kiểm tra `cache` là `hit` ở cả 3 lần. Giữ cả số trước và số sau.

Không dùng bước này để sinh Critical CSS. Không thay thế `vnx_analyze_pagespeed`.
