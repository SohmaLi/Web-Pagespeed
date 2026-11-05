# Phiếu thông tin website — W3 Total Cache (plugin Vietnix Pagespeed PUB)

Người dùng gửi link trong chat, hoặc tự điền mục 1 và mục 2. Agent điền phần còn lại. Ô chưa biết để `[chưa rõ]`, không đoán. Cách dùng và các điểm riêng của W3TC: `README.md`. Quy trình chung: `../shared/README.md` mục **Quy trình**; skill W3TC trong thư mục này.

Mỗi phiếu một miền. Link mới cùng miền thì thêm dòng ở mục 2. Miền khác thì ghi đè phiếu; báo cáo cũ vẫn nằm trong `reports/`. Không ghi token MCP hay API key vào file này.

## 1. Người dùng cung cấp

| Mục               | Giá trị                |
| ----------------- | ---------------------- |
| Tên khách hàng    | `[chưa rõ]`            |
| Tên miền          | `pagespeed.vietnix.dev` |
| Trường hợp        | `2`                    |
| API key PageSpeed | `[trong shared/.env]`  |
| Ghi chú           | Site W3 Total Cache, plugin PUB. 2026-11-04: thêm link 5, trường hợp 1 (chỉ khảo sát) |

## 2. Link cần đo

```text
https://pagespeed.vietnix.dev/
https://pagespeed.vietnix.dev/bo-suu-tap/
https://pagespeed.vietnix.dev/gioi-thieu/
https://pagespeed.vietnix.dev/lien-he/
https://pagespeed.vietnix.dev/thu-vien-hinh-anh/
```

| # | URL                                       | Loại trang | `type` / `source_id` | Ưu tiên | Tối ưu |
| - | ----------------------------------------- | ---------- | -------------------- | ------- | ------ |
| 1 | https://pagespeed.vietnix.dev/            | Trang chủ  | `home` / `home`      | 1       | `có` |
| 2 | https://pagespeed.vietnix.dev/bo-suu-tap/ | Page       | `post` / `59`        | 2       | `có` |
| 3 | https://pagespeed.vietnix.dev/gioi-thieu/ | Page       | `post` / `67`        | 3       | `có` |
| 4 | https://pagespeed.vietnix.dev/lien-he/    | Page       | `post` / `48`        | 4       | `có` |
| 5 | https://pagespeed.vietnix.dev/thu-vien-hinh-anh/ | Page (Elementor) | `post` / `102` | 5 | `—` (khảo sát) |

`type` / `source_id` lấy bằng `w3tc_resolve_url`.

## 3. Agent điền

| Mục                                       | Giá trị |
| ----------------------------------------- | ------- |
| Plugin Vietnix Pagespeed PUB trên site    | Đã cài, 1.0.1, MCP bật |
| MCP `vietnix-pagespeed` nối đúng miền này | Có (`site_url` = https://pagespeed.vietnix.dev) |
| Trạng thái plugin/MCP                     | MCP đúng miền |
| Cache                                     | W3 Total Cache 2.11.0, Page Cache Disk: Enhanced, đã tách mobile (`phones`) |
| Báo cáo Phase 1                           | `reports/2026-11-05-pagespeed.vietnix.dev/` (gộp 2026-11-03 và 2026-11-04: Phần A link 1–4, Phần B link 5) |
| Giai đoạn                                 | Link 1–4: đã nghiệm thu; link 5: Phase 1 xong (khảo sát) |
| Theme hoặc page builder                   | Bricks (WordPress 7.1.4); link 5 dựng bằng Elementor 4.3.6 |
