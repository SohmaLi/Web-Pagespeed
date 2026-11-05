# Vì sao Vietnix Pagespeed PUB dùng W3 Total Cache

Vietnix Pagespeed PUB 1.0.0 chạy trên 2 plugin cache: LiteSpeed Cache cho server LiteSpeed và W3 Total Cache (W3TC) cho các trường hợp còn lại. W3TC được chọn vì nó không bắt buộc server LiteSpeed, phục vụ trang từ file ở tầng webserver, và có đủ điểm móc để PUB tối ưu HTML, tách bản theo thiết bị và tách bản theo cookie.

PUB không tự lưu trang. Nó cần một plugin cache để tối ưu HTML đúng lúc plugin đó chuẩn bị lưu trang, sau đó khách nhận bản đã lưu. Vì vậy chọn plugin cache quyết định PUB chạy được ở đâu và tốt tới mức nào.

Số liệu trong báo cáo đo ngày 02/11/2026 với W3TC 2.11.0 trên một site local: Apache 2.4, PHP 8.3, WordPress 7.1, dùng Bricks.

## 1. Lý do chọn

| PUB cần | W3TC có | Kết quả kiểm tra |
| --- | --- | --- |
| Chạy khi không có server LiteSpeed | Chạy như plugin WordPress thông thường | Đã chạy trên Apache |
| Tối ưu HTML trước khi lưu cache | 2 điểm móc: `w3tc_process_content`, `w3tc_processed_content` | VPI chạy trước lazyload của W3TC, các bước còn lại chạy ngay trước khi lưu trang |
| Trả trang thật nhanh | Disk: Enhanced lưu file HTML, rule webserver trả thẳng file | Các lượt sau 3–7 ms, không chạy PHP |
| Bản riêng cho điện thoại | User Agent Groups | Bản desktop và bản `phones` tách đúng file |
| Bản riêng cho khách cũ | Cookie Groups, có cả rule webserver | 4 bản cache đúng trên 2 trang thử |
| Xóa đúng một trang | `w3tc_flush_url` | Xóa đủ các bản của URL, trang khác còn nguyên |
| Không cache bản dùng để cào CSS | Tôn trọng `DONOTCACHEPAGE` | Trang cào không vào cache |

Cookie Groups là điểm quan trọng nhất. W3TC không có Guest Mode, nhưng nhờ tách bản theo cookie, PUB cho khách mới nhận bản Critical CSS và khách cũ nhận bản thường, không cần tải lại trang.

## 2. Số đo

| Hạng mục | Kết quả |
| --- | --- |
| Lượt đầu, chạy PHP | 599–878 ms |
| Lượt sau, Apache trả file | 3–7 ms |
| Tool MCP trên W3TC | 17/17 đạt |
| Khách cũ, trang đối tác desktop | CLS 0,005 |
| Khách cũ, trang chủ mobile | CLS 0 |

Đo trên site local nên thời gian phản hồi không đại diện cho server thật. CLS mỗi trường hợp có ít lượt đo và dao động lớn giữa các lượt.

## 3. So với LiteSpeed Cache

| | LiteSpeed Cache | W3 Total Cache |
| --- | --- | --- |
| Yêu cầu server | Cần server LiteSpeed để có page cache | Không bắt buộc |
| Nơi lưu | Cache của server | File trong `wp-content/cache/page_enhanced/` |
| Tách bản cho khách mới | Guest Mode, có tải lại trang | Cookie Groups, không tải lại trang |
| Thời gian giữ cache mặc định | 7 ngày | 1 giờ, cần đổi `pgcache.lifetime` |
| Tách mobile mặc định | Tắt, cần bật trong cấu hình | Tắt, cần bật User Agent Groups |
| Dọn cache | Server quản lý | WP-Cron |

Server LiteSpeed vẫn nên dùng LiteSpeed Cache. W3TC dành cho site không chạy LiteSpeed.

## 4. Điểm yếu và cách xử lý

| Điểm yếu | Cách xử lý |
| --- | --- |
| Mặc định không tách mobile | Bật nhóm `phones`. Chưa bật thì PUB in bản desktop cho mọi khách và cảnh báo |
| Giữ cache ngắn | Đặt `pgcache.lifetime` = 604.800 giây |
| Lazy Load, Delay Scripts, Remove CSS/JS trùng chức năng PUB | PUB cảnh báo, chỉ bật một bên |
| Không có Guest Mode | Bật các ô "( for Client )" và tạo Cookie Group |
| Sau khi xóa, file dưới 30 giây tuổi vẫn trả bản cũ | `w3tc_purge` báo `old_copy_seconds` |
| Dọn cache phụ thuộc WP-Cron | Dùng cron hệ thống trên site thật |
| Nhiều kiểu lưu cache | Tool chỉ đọc được file của Disk: Enhanced, kiểu khác vẫn xóa được |

Khách lần đầu vẫn thấy Critical CSS rồi mới chuyển sang CSS đầy đủ. CCSS càng lệch giao diện thật thì trang càng nhảy, và CSS tải vào có thể làm LCP đo được cao hơn so với lúc CSS bị giữ lại.

## 5. Cấu hình cần có

| Thiết lập | Giá trị |
| --- | --- |
| Page Cache | Bật, Disk: Enhanced |
| User Agent Groups | Bật nhóm `phones` |
| Lazy Load Images | Tắt |
| Cache URIs with query string variables | Tắt |
| Don't cache pages for logged in users | Bật |
| `pgcache.lifetime` | 604.800 |
| Cookie Group `vnx_returning` | Cookie `vnx_returning=1`, bật Enabled và Cache |
| Trong PUB | Bật các ô "( for Client )" |

## 6. Chưa kiểm chứng

- Chưa chạy trên site khách thật, chưa đo PageSpeed thật.
- Chưa test Minify, CDN, Redis/Memcached và Nginx với W3TC.
- Chưa test theme khác, Elementor, WooCommerce, site cài ở thư mục con.
- Mới có một site thử, nên các ưu điểm trên chưa đủ để kết luận cho mọi loại website.
