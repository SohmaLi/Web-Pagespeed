---
name: w3tc-measure-page-load
description: >-
  Đo tốc độ tải thật (TTFB, DOMContentLoaded, Load, LCP, CLS) của site W3 Total
  Cache, desktop và mobile, 3 lần, trên cache W3TC đã ấm. Dùng trước và sau khi
  tối ưu bằng Vietnix Pagespeed PUB, cho mục "Tốc độ load" của báo cáo.
---

# Đo tải thật — site W3 Total Cache

Dùng script có sẵn, không viết script đo mới:

```bash
node shared/scripts/measure-run.js --url <URL> --scratch <thư mục tạm>/lan-<n> --skip-psi [--assets <reports/…/assets/<trang>>]
```

- `--skip-psi`: điểm PSI lấy riêng bằng `w3tc_analyze_pagespeed` hoặc `shared/scripts/psi-rounds.sh`.
- Kết quả: `<thư mục tạm>/lan-<n>/summary.json`, mảng `browser` có `device`, `ttfb`, `dcl`, `load`, `lcp`, `lcpElement`, `cls`, `clsShifts`, `dclMarkers`.
- Chạy 3 lần, mỗi lần một `--scratch` riêng; lần cuối thêm `--assets` để lưu ảnh. Lấy trung vị từng chỉ số.
- Mở đúng URL người dùng đưa, không thêm query (`?nc=`, `?vnx-device=`): khi "Cache URIs with query string variables" tắt (cài đặt nên dùng), URL có query không qua cache, nên đo trên đó là đo bản không cache.

## Thiết bị

Script tự đo desktop rồi mobile, mạng và CPU bình thường:

| Thiết bị | Viewport | UA |
| --- | --- | --- |
| Desktop | 1350×900, DPR 1 | Chrome macOS |
| Mobile | 412×823, DPR 1,75 | Moto G Power (2022), Android 11 |

UA mobile khớp nhóm `phones` của W3TC User Agent Groups, nên nhận bản cache điện thoại. W3TC chưa tách mobile thì cả hai nhận bản desktop: ghi rõ trong báo cáo.

## Cache W3TC

- Script mở URL một lần cho cache ấm (nhất là ngay sau `w3tc_purge`), rồi tải lại và đo.
- Kiểm tra cache bằng `w3tc_cache_state` (file desktop và mobile, tuổi, hết hạn) hoặc dòng `Served from: … by W3 Total Cache` cuối HTML (curl).
- Vừa ghi option hoặc dòng mà chưa purge thì số đo là của HTML cũ.

## Đọc kết quả

- **Load**: mốc dùng cho báo cáo Word, Desktop ≤ 2 s, Mobile ≤ 3 s là đạt. Load cao bất thường so với DCL: tìm request chậm hoặc lỗi giữ sự kiện load. Ví dụ font 404 do `url()` tương đối trong Critical CSS từng giữ Load 2,4 s.
- **CLS** và `clsShifts`: phần tử dịch và thời điểm. Dịch lúc ~1 s khi có Delay CSS: Critical CSS thiếu rule so với CSS đầy đủ.
- **LCP** và `lcpElement`: ảnh LCP có đúng bản đã đổi size (VPI) không; request ảnh bắt đầu trước mốc load.
- `dclMarkers`: `critical: true`, số `delayed` là số file CSS đang chờ (Delay CSS).
- Tải thật thường rất nhanh trong khi PSI chậm hơn, vì PSI giả lập mạng và CPU chậm. Lấy PSI cho điểm, tải thật cho mục "Tốc độ load".

## Ghi báo cáo

Ghi vào `audit-w3tc/reports/YYYY-MM-DD-ten-mien/YYYY-MM-DD-ten-mien.md`: Load / LCP / CLS từng lần (ms) cho desktop và mobile, trung vị, máy đo. Ảnh lưu trong `assets/<trang>/`. Báo cáo Word chỉ ghi mốc Load.

Không dùng bước này để sinh Critical CSS hay để chẩn đoán bằng cách sửa trang trong trình duyệt.
