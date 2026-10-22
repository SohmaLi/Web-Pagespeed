# Hướng dẫn dùng

Bộ `audit-website` dùng AI agent (Claude Code hoặc Cursor) để đo tốc độ website và lập báo cáo gửi khách. Khi khách cần tối ưu, agent tối ưu qua plugin Vietnix Pagespeed PRO trên site WordPress.

Bạn chỉ cần đọc file này và chat với agent. Phần kỹ thuật (`README.md`, `PLUGIN.md`, skill, script) là để agent đọc, bạn không cần mở. Agent không ghi gì lên site khi bạn chưa xác nhận.

## Hai trường hợp

Công việc chia hai giai đoạn: **Phase 1** khảo sát (đo và báo cáo hiện trạng), **Phase 2** tối ưu và nghiệm thu. Sơ đồ nằm trong thư mục `quy-trinh/`.

| | Trường hợp 1. Chỉ khảo sát | Trường hợp 2. Khảo sát và tối ưu |
| --- | --- | --- |
| Gồm | Phase 1 | Phase 1 (nếu chưa có) rồi Phase 2 |
| Khi nào | Khách chỉ cần biết hiện trạng | Khách cần tối ưu |
| Bạn cần | Link cần đo, API key PageSpeed | Thêm file plugin, tài khoản admin WordPress |
| Các bước | Gửi link → nhận báo cáo | Gửi link → cài plugin (nếu chưa) → chọn và duyệt → nghiệm thu → bạn đổi plugin lite |
| Nhận được | Báo cáo hiện trạng (Word và `.md`) | Báo cáo hiện trạng, báo cáo kết quả sau tối ưu (nghiệm thu), đề xuất bổ sung |
| Agent ghi lên site | Không | Chỉ sau khi bạn xác nhận từng thay đổi |

**Bạn nói rõ trường hợp khi gửi link** (xem **Gửi link**). Không nói thì agent hỏi lại.

Trường hợp 2 mà đã có báo cáo khảo sát (Phase 1) của tên miền này trong `reports/`, agent dùng lại báo cáo đó và làm tiếp Phase 2. Chưa có thì agent khảo sát trước rồi mới tối ưu.

**Cần có cho cả hai trường hợp:**

- Máy Mac có Google Chrome, Node.js và Python 3.
- Claude Code hoặc Cursor, mở tại thư mục chứa `audit-website`. Claude trên web và Codex chỉ đo được điểm PageSpeed, không đo tải thật.
- API key PageSpeed Insights. Lấy tại Google Cloud Console: **APIs & Services** → bật **PageSpeed Insights API** → **Credentials** → **Create credentials** → **API key**. Nên giới hạn key chỉ cho PageSpeed Insights API.

## Trường hợp 1. Chỉ khảo sát

Không cần cài plugin. Dùng được cho site bất kỳ. Site đã cài plugin vẫn chỉ đo và báo cáo, không tối ưu.

1. Mở `Do.md`, dán API key PageSpeed vào mục 1. Chỉ làm một lần, đổi miền vẫn giữ key. Để trống thì agent lấy điểm trên pagespeed.web.dev.
2. Gửi link cho agent, nói rõ chỉ khảo sát (xem **Gửi link**). Agent tự đo và viết báo cáo, không hỏi gì.
3. Nhận báo cáo hiện trạng trong `reports/` (xem **Kết quả**). Mỗi trang có kết luận `Không cần tối ưu` hoặc `Cần tối ưu` kèm thông số chưa đạt (xem **Tiêu chí ĐẠT**). Dán ảnh Network vào file Word rồi gửi khách.

Việc plugin làm được sau khi cài được ghi trong báo cáo là `cần plugin`. Khách muốn tối ưu sau: gửi lại link và nói tối ưu (trường hợp 2). Agent dùng lại báo cáo này.

## Trường hợp 2. Khảo sát và tối ưu

### Bước 1. Gửi link

Gửi link cho agent, nói rõ cần tối ưu (xem **Gửi link**). Agent làm:

- Đã có báo cáo khảo sát của tên miền này: đọc lại, không đo lại từ đầu. Link nào chưa có trong báo cáo thì khảo sát thêm link đó. Agent chỉ dùng báo cáo đúng tên miền, không lấy báo cáo hay số đo của site khác để so sánh.
- Chưa có: khảo sát (đo, báo cáo hiện trạng) như trường hợp 1.

Site chưa cài plugin hoặc agent chưa nối đúng site: agent dừng và nhắc bạn làm bước 2.

### Bước 2. Cài plugin và nối agent

Làm một lần cho mỗi site. Site đã cài và đã nối thì bỏ qua.

1. Vào wp-admin → **Plugins** → **Add New** → **Upload Plugin**, chọn `vietnix-pagespeed-pro.zip`, bấm **Install Now** rồi **Activate**.
2. Vào menu **Vietnix Optimization**, tab **MCP**. Tick **Bật MCP**, dán **API key PageSpeed**, bấm **Lưu MCP**.
3. Ở mục **Mẫu kết nối**, bấm **Copy** ở mẫu của agent bạn dùng, rồi dán:

| Agent | Dán mẫu vào đâu |
| --- | --- |
| Claude Code | Mẫu **Claude Code (CLI)**: dán vào Terminal rồi Enter. Hoặc mẫu `.mcp.json`: dán vào file `.mcp.json` của thư mục dự án |
| Cursor | Dán vào `~/.cursor/mcp.json`. File bridge đi kèm do agent tự copy ở lần chạy đầu |
| Claude (claude.ai, Claude Desktop) | **Settings** → **Connectors** → **Add custom connector**. Điền URL và hai header theo mẫu |
| Codex | Dán vào `~/.codex/config.toml` |

4. **Thoát và mở lại agent**, rồi nhắn `MCP vietnix-pagespeed đang nối site nào?`. Agent phải trả đúng tên miền sắp làm. Sau đó nhắn `tiếp tục`.

Một kết nối MCP chỉ trỏ tới một site. Sang site khác thì gỡ kết nối cũ rồi dán mẫu của site mới. Với Claude Code, chạy `claude mcp remove vietnix-pagespeed` trước khi dán.

Trang **Mẫu kết nối** chứa token và key thật. Không chụp màn hình, không gửi cho ai. Lỡ để lộ thì bấm **Tạo token mới** (giữ ô **Bật MCP**) và tạo API key mới trên Google Cloud.

**Agent đo lại sau khi cài plugin.** Chỉ riêng việc cài plugin đã làm trang thay đổi, nên số khảo sát cũ không dùng để so sánh. Số đo lại này là mốc "trước" trong báo cáo kết quả; số khảo sát cũ giữ để tham khảo. Mốc này đo 3 lần, lấy số giữa, như ở bước 4.

**Site đã có cấu hình plugin từ trước** (tối ưu lần trước, hoặc ai đó đã chỉnh trong wp-admin): agent kiểm tra từng option và từng dòng cũ của trang cần tối ưu, rồi ghi một trong ba kết luận:

| Kết luận | Nghĩa |
| --- | --- |
| Giữ | Còn đúng, đang có tác dụng. Không đụng tới |
| Thay | Sai hoặc đã cũ (ví dụ chỉ vào ảnh không còn trên trang, ảnh bị mờ, trì hoãn CSS mà chưa có CSS màn hình đầu). Agent đề xuất giá trị mới |
| Gỡ | Không còn cần hoặc đang gây lỗi (ví dụ trì hoãn phần đầu trang) |

Agent chỉ đề xuất thay hoặc gỡ ở trang chưa đạt, cho đúng thông số chưa đạt hoặc lỗi đang thấy. Trang đã đạt thì giữ nguyên. Việc thay, gỡ được duyệt cùng các dòng đề xuất ở bước 3. Trước lần ghi đầu tiên, agent lưu bản cấu hình cũ (`cau-hinh-truoc-toi-uu.json`) để khôi phục được khi cần.

### Bước 3. Chọn và duyệt

Agent chỉ dừng hỏi ở các điểm sau:

| Agent hỏi | Bạn xem gì | Trả lời mẫu |
| --- | --- | --- |
| Link nào cần tối ưu, dòng đề xuất nào được duyệt | Tóm tắt từng link (điểm, thời gian Load, `Không cần tối ưu` hoặc thông số chưa đạt) và danh sách thay đổi đề xuất, gồm cả thay hoặc gỡ cấu hình cũ. Agent đề xuất sẵn: trang đã đạt thì không tối ưu | `Tối ưu link 1 và 3. Duyệt dòng 1, 2, bỏ dòng 4.` hoặc `Không tối ưu.` |
| Trước mỗi lần ghi lên site: kết quả chạy thử (dry-run) | Thay đổi gì, từ giá trị nào sang giá trị nào. Dòng VPI, Critical CSS, lazyload HTML áp cho **một trang**, hoặc cho **mọi trang cùng mẫu** (ví dụ mọi bài viết, mọi trang danh mục) nếu bạn chọn ghi chung. Đổi option là áp cho **cả site**: agent chỉ đề xuất khi bạn yêu cầu rõ | `Đồng ý ghi.` hoặc `Bỏ thay đổi này.` |
| Thêm `jquery` hoặc `wp-includes` vào danh sách trì hoãn JS của plugin Vietnix | Dễ làm hỏng menu, slider, form | Chỉ đồng ý khi đã thử trang sau thay đổi |
| Kiểm tra lại mà chưa đạt | Lý do chưa đạt và việc plugin còn làm được | `Làm tiếp vòng 2.` hoặc `Dừng, nghiệm thu.` |
| Điểm mobile, CLS hoặc giao diện tệ hơn trước: đề xuất rollback | Danh sách thay đổi sẽ được hoàn tác | `Đồng ý rollback.` hoặc `Khôi phục cấu hình trước khi tối ưu.` |

Agent chỉ tối ưu các trang bạn yêu cầu, và chỉ tối ưu thông số chưa đạt của trang đó. Mọi trang đã đạt và bạn đồng ý không tối ưu: agent kết thúc, báo cáo hiện trạng là kết quả cuối. Lúc nào cũng có thể hỏi thêm, ví dụ `Dòng 2 làm gì, ảnh hưởng trang nào?`.

### Bước 4. Kiểm tra lại và nghiệm thu

Sau mỗi lần tối ưu, agent kiểm tra lại hai phần cùng lúc:

- **Điểm (Point):** đo lại điểm PageSpeed mobile và desktop.
- **Site health:** mở trang như khách mới vào bằng cửa sổ ẩn danh, xem tốc độ và giao diện có lỗi không: trang tải chậm, ảnh màn hình đầu trống hoặc mờ, bố cục nhảy, mất style, menu hay nút không bấm được.

**Đo 3 lần, lấy số giữa.** Cùng một trang, đo hai lần liền nhau đã có thể lệch vài điểm PageSpeed và vài trăm mili giây. Vì vậy ở mốc "trước" và mỗi lần kiểm tra lại, agent đo mỗi link 3 lần rồi lấy số ở giữa (trung vị). Ba lần lệch nhau nhiều thì đo thêm 2 lần. Chênh lệch nhỏ (điểm trong 3, thời gian trong 0,2 giây, CLS trong 0,02) được coi là không đổi, không tính là tốt hơn hay tệ hơn. Mỗi vòng kiểm tra lâu hơn và tốn quota PageSpeed gấp 3 (6 lượt mỗi link). Báo cáo ghi số giữa; báo cáo kỹ thuật `.md` ghi thêm số từng lần.

Chưa đạt thì agent hỏi bạn làm thêm vòng hay dừng (bước 3). Tệ hơn trước thì agent đề xuất rollback.

**Nghiệm thu** là lần đo điểm cuối cùng sau khi tối ưu đã đạt (hoặc plugin không còn việc làm được). Agent tạo báo cáo kết quả sau tối ưu và đề xuất bổ sung (xem **Kết quả**). Dán ảnh Network vào cả hai file Word rồi gửi khách.

**Agent kết thúc ở đây.**

### Bước 5. Đổi sang plugin lite

Việc của bạn, làm sau khi agent kết thúc. Bắt buộc. Bản lite ẩn các option của plugin. Hướng dẫn chi tiết sẽ cập nhật sau.

## Gửi link

Dán link vào chat, kèm trường hợp:

```text
Khảo sát các link sau:
https://ten-mien.vn/
https://ten-mien.vn/lien-he/
```

```text
Tối ưu các link sau:
https://ten-mien.vn/
https://ten-mien.vn/lien-he/
```

Agent tự điền `Do.md` rồi chạy. Bạn cũng có thể tự điền mục 1 (tên khách hàng, tên miền, trường hợp `1` hoặc `2`) và mục 2 (mỗi dòng một URL) của `Do.md`, rồi nhắn `Khảo sát các link trong Do.md` hoặc `Tối ưu các link trong Do.md`.

- Mỗi lần chạy chỉ một tên miền. Link khác tên miền sẽ bị bỏ.
- Mỗi link tốn 2 lượt PageSpeed (mobile và desktop). Quota là 25.000 lượt mỗi ngày, 30 lượt mỗi phút.
- Sang miền khác thì agent ghi đè `Do.md` và giữ ô API key. Báo cáo cũ vẫn nằm trong `reports/`.

## Kết quả

Mọi file nằm trong `audit-website/reports/YYYY-MM-DD-ten-mien/`. Trường hợp 2 dùng lại báo cáo khảo sát thì ghi tiếp vào đúng thư mục đó.

| File | Trường hợp | Dùng để |
| --- | --- | --- |
| `Báo cáo - Hiện trạng website trước khi tối ưu - ten-mien.docx` | 1 và 2 | Gửi khách |
| `YYYY-MM-DD-ten-mien.md` | 1 và 2 | Báo cáo kỹ thuật nội bộ. Trường hợp 2 có thêm mục đo lại sau cài plugin và kết quả sau tối ưu |
| `assets/` | 1 và 2 | Ảnh PageSpeed và ảnh trang |
| `Báo cáo - Kết quả sau tối ưu - ten-mien.docx` | 2 | Báo cáo nghiệm thu, gửi khách |
| `Đề xuất bổ sung - ten-mien.md` | 2, khi còn việc plugin không làm được | Việc bạn tự làm (A), việc AI làm khi được duyệt (B) |
| `cau-hinh-truoc-toi-uu.json` | 2, khi agent đã ghi lên site | Bản cấu hình plugin trước lần ghi đầu tiên, dùng để khôi phục |
| `anh-toi-uu/` | Khi bạn yêu cầu nén ảnh | Ảnh đã nén và hướng dẫn thay |
| `sao-luu-noi-dung/` | Khi agent thay ảnh trên site | Nội dung trang trước khi sửa, dùng để trả lại ảnh cũ |

**Ảnh Network trong file Word** để trống cho bạn tự chụp:

1. Mở link trong Chrome, bấm F12 (Mac: ⌥⌘I), chọn tab **Network**.
2. Tải lại trang (⌘R) và chờ trang tải xong.
3. Chụp thanh dưới cùng có **DOMContentLoaded** và **Load**, rồi dán vào ô ảnh Network.

### Tiêu chí ĐẠT

| Tiêu chí | Đạt khi |
| --- | --- |
| Điểm PageSpeed mobile và desktop | Từ 90 trở lên (xanh) |
| Tốc độ load | Desktop ≤ 2 giây, Mobile ≤ 3 giây |
| Cache | Trang có cache |
| Giật ảnh do tải chậm | Ảnh màn hình đầu hiện ngay khi tải, không chờ vài giây, và bố cục không nhảy khi tải (CLS ≤ 0,25) |
| Load chậm do bên thứ ba | Không ảnh hưởng hoặc ảnh hưởng không đáng kể |

Agent đánh giá từng trang theo bảng trên ngay từ báo cáo hiện trạng:

- Báo cáo chỉ xét **điểm tổng** PageSpeed (hiệu suất) của mobile và desktop. Các chỉ số chi tiết (FCP, LCP, TBT, CLS, Speed Index, TTFB) agent chỉ dùng khi tối ưu, để biết cần sửa gì.
- Dưới bảng số đo của mỗi trang có một dòng **Chú ý** liệt kê các chỉ số đã tốt, không cần cải thiện (điểm PageSpeed từ 90, tốc độ load thật trong ngưỡng, có cache). Dòng này có cả trong file Word gửi khách.
- **Đạt hết:** báo cáo ghi `Không cần tối ưu` cho trang đó, kèm số đo. Lỗi nhỏ vẫn ghi lại để theo dõi, không đề xuất sửa.
- **Có tiêu chí chưa đạt:** báo cáo ghi rõ tiêu chí nào, số đo bao nhiêu. Agent chỉ đề xuất thay đổi cho tiêu chí đó.

Sau tối ưu, trang đạt khi các tiêu chí chưa đạt nay đã đạt, các tiêu chí đã đạt không tụt xuống, và kiểm tra ẩn danh (Site health) không có lỗi.

## Plugin không làm

- Minify, gộp file, cache, sửa theme, đổi file ảnh hoặc font.
- Sửa cấu hình LiteSpeed. Các thông số LiteSpeed chỉ nằm ở mục đề xuất của báo cáo.
- Xóa cache toàn site. Agent chỉ xóa cache đúng URL vừa tối ưu.
- Tối ưu riêng cho trang tag.

Những việc này, nếu cần, nằm trong file `Đề xuất bổ sung`. Riêng ảnh quá nặng, agent hỗ trợ được theo mục **Thay ảnh nặng**.

## Thay ảnh nặng

Plugin không đổi file ảnh. Khi ảnh trên trang quá nặng (ví dụ ảnh vài MB), báo cáo ghi việc này ở phần A của `Đề xuất bổ sung`. Agent giúp được hai mức:

| Mức | Agent làm | Bạn cần |
| --- | --- | --- |
| Nén sẵn | Đo khung hiển thị thật của từng ảnh, nén sang WebP đúng kích thước, để trong thư mục `anh-toi-uu/` kèm hướng dẫn thay | Nhắn `Nén ảnh của link 1`. Không cần tài khoản |
| Thay trên site | Tải ảnh mới lên Media, đổi ảnh trong trang, kiểm tra lại, đo lại | Yêu cầu rõ và có tài khoản wp-admin (xem dưới) |

Điều kiện để agent thay ảnh trên site:

1. Bạn nhắn rõ, ví dụ `Thay ảnh đã nén lên site cho link 1`. Nhắn nén ảnh thôi thì agent chỉ nén.
2. Có tài khoản wp-admin: bạn tự đăng nhập trong cửa sổ trình duyệt agent mở, hoặc ghi hai dòng `WP_USER=...`, `WP_PASS=...` vào file `audit-website/.env`. Nên tạo Application Password riêng (wp-admin → **Users → Profile → Application Passwords**). Không gửi mật khẩu qua chat.
3. Chỉ trên link bạn đã chọn tối ưu.
4. Agent sao lưu nội dung trang trước khi sửa và hỏi bạn trước mỗi lần lưu. Ảnh gốc vẫn giữ trong Media.

Agent làm được với trang dựng bằng Gutenberg, Classic editor, Flatsome, WPBakery, Divi, Bricks và Elementor. Ảnh trong slider, widget, cài đặt theme hoặc viết cứng trong file theme: agent ghi hướng dẫn để bạn tự thay.

Cần biết:

- Ảnh nằm trong khối hoặc mẫu dùng chung (header, footer, template): đổi ở đó thì mọi trang dùng chung cũng đổi theo. Agent báo trước khi lưu.
- Muốn trả lại ảnh cũ: nhắn `Gỡ ảnh đã thay, trả lại ảnh cũ.` Agent ghi lại nội dung từ bản sao lưu.
- Xong việc, xóa hai dòng `WP_USER`, `WP_PASS` khỏi `.env`.

## Gặp lỗi

| Hiện tượng | Cách xử lý |
| --- | --- |
| Agent không thấy tool `vnx_*` | Thoát và mở lại agent sau khi nối MCP |
| Agent báo lỗi 401 | Token sai hoặc vừa tạo token mới. Copy lại mẫu kết nối, nối lại, khởi động lại agent |
| Agent báo lỗi 403 hoặc MCP tắt | Vào tab **MCP**, tick **Bật MCP**, bấm **Lưu MCP** |
| MCP trả tên miền khác | Agent đang nối site cũ. Gỡ kết nối cũ, dán mẫu của site đúng, khởi động lại, nhắn `tiếp tục` |
| `API key not valid` (lỗi 400) | Key sai hoặc chưa bật PageSpeed Insights API trên Google Cloud |
| Lỗi 429 | Hết quota. Kiểm tra lại sau tối ưu tốn 6 lượt mỗi link mỗi vòng, nên dễ hết hơn khảo sát. Chờ rồi chạy lại, hoặc để agent lấy số trên pagespeed.web.dev. Agent không kết luận đạt hay tệ hơn khi chưa đủ số lần đo |
| Báo cáo ghi `không đo được` | PageSpeed lỗi hai lần. Chạy lại sau. Agent không tự đặt ra số liệu |
| Sau tối ưu, trang vỡ giao diện hoặc menu không bấm được | Nhắn agent `Trang <link> lỗi sau tối ưu, rollback thay đổi vừa ghi.` Khẩn cấp: wp-admin → **Vietnix Optimization** → tab **Options** → tắt **Active All Optimize**, xóa cache LiteSpeed, rồi báo agent |

## Bảo mật

- Không gửi token MCP hay ảnh trang **Mẫu kết nối** cho ai.
- Mục 1 của `Do.md` chứa API key PageSpeed. Xóa ô này trước khi chia sẻ thư mục `audit-website`.
- Báo cáo không chứa token hay key, và không được lưu lên site.
- File `.env` có thể chứa tài khoản wp-admin (mục **Thay ảnh nặng**). Xóa sau khi xong và không chia sẻ file này.

## Thuật ngữ

| Từ | Nghĩa |
| --- | --- |
| Phase 1 | Khảo sát: đo và báo cáo hiện trạng |
| Phase 2 | Tối ưu: cài plugin, tối ưu, kiểm tra lại, nghiệm thu |
| Site health | Kiểm tra tốc độ và giao diện bằng cửa sổ ẩn danh, xem có lỗi không |
| Nghiệm thu | Lần đo điểm cuối sau khi tối ưu đạt, kèm báo cáo kết quả |
| PageSpeed (PSI) | Điểm 0–100 của Google cho tốc độ trang, đo riêng mobile và desktop |
| Load | Thời gian trình duyệt tải xong trang khi đo thật |
| Trung vị (số giữa) | Số đứng giữa khi xếp các lần đo từ thấp đến cao. Ít bị ảnh hưởng bởi một lần đo quá tốt hoặc quá tệ |
| LCP | Thời điểm phần tử lớn nhất màn hình đầu hiện ra |
| CLS | Mức nội dung bị xô lệch khi tải. Càng nhỏ càng tốt |
| MCP | Cổng kết nối để agent đọc điểm và ghi cấu hình plugin |
| Dry-run | Chạy thử, chỉ hiện thay đổi, chưa ghi lên site |
| Purge | Xóa cache một trang để thay đổi có hiệu lực |
| VPI | Cho ảnh màn hình đầu tải ngay, không chờ lazyload |
| Critical CSS | CSS cần cho màn hình đầu, nhúng sẵn để trang hiện nhanh |
| Lazyload HTML | Hoãn hiển thị khối nội dung phía dưới đến khi cuộn gần tới |
| Rollback | Hoàn tác thay đổi đã ghi |
| `proposed`, `applied`, `skipped` | Đề xuất chờ duyệt, đã ghi lên site, bạn đã bỏ |
| `suggestion`, `ngoài phạm vi` | Đề xuất bạn tự làm, việc plugin không xử lý được |
| `theo dõi` | Vấn đề ghi lại nhưng không tối ưu, vì tiêu chí liên quan đã đạt |
| `Không cần tối ưu` | Kết luận cho trang đã đạt mọi tiêu chí |
| `cần plugin` | Việc plugin làm được sau khi cài lên site |

## Các file trong bộ

| File | Bạn có cần mở không |
| --- | --- |
| `HUONG-DAN.md` | Có. File này |
| `Do.md` | Tùy chọn. Phiếu thông tin website. Agent tự điền nếu bạn gửi link trong chat |
| `reports/` | Có. Nơi nhận báo cáo |
| `quy-trinh/` | Tùy chọn. Sơ đồ tổng `Quy trình hoạt động.png` (bản sửa được: `.bpmn`, mở trên bpmn.io), sơ đồ Phase 1, Phase 2 và bản phân tích quy trình |
| Còn lại: `README.md`, `PLUGIN.md`, ba thư mục skill, `scripts/`, file Word mẫu | Không. Agent đọc và dùng |
