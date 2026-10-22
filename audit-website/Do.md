# Phiếu thông tin website

Người dùng gửi link trong chat, hoặc tự điền mục 1 và mục 2. Agent điền phần còn lại. Ô chưa biết để `[chưa rõ]`, không đoán. Quy trình: `README.md` mục **Quy trình**, sơ đồ trong `quy-trinh/`.

Mỗi phiếu một miền. Link mới cùng miền thì thêm dòng ở mục 2. Miền khác thì ghi đè phiếu, giữ ô API key; báo cáo cũ vẫn nằm trong `reports/`. Không ghi token MCP vào file này.

## 1. Người dùng cung cấp

| Mục               | Giá trị                                 |
| ----------------- | --------------------------------------- |
| Tên khách hàng    | `[chưa rõ]`                             |
| Tên miền          | `[chưa rõ]`                             |
| Trường hợp        | `[chưa rõ]`                             |
| API key PageSpeed | [chưa rõ] |
| Ghi chú           |                                         |

| Mục               | Bắt buộc             | Cách điền                                                                                                                                                                                 |
| ----------------- | -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tên khách hàng    | Không                | In trên báo cáo Word. Chưa có thì giữ `[chưa rõ]`                                                                                                                                         |
| Tên miền          | Có                   | Chỉ gửi link thì agent lấy miền từ URL                                                                                                                                                    |
| Trường hợp        | Có                   | `1` chỉ khảo sát (Phase 1). `2` khảo sát và tối ưu (Phase 1 nếu chưa có báo cáo, rồi Phase 2). Trong chat nói "khảo sát" hoặc "tối ưu" thì agent tự điền. Còn `[chưa rõ]` thì agent hỏi lại |
| Key PageSpeed     | Khi không đo qua MCP | Agent đọc bằng lệnh, không in, không chép sang báo cáo                                                                                                                                    |
| Ghi chú           | Không                | Việc đặc biệt của lần chạy                                                                                                                                                                |

## 2. Link cần đo

Dán URL vào khối bên dưới, mỗi dòng một URL, ít nhất một URL, cùng host với tên miền. Mỗi URL tốn 2 request PageSpeed (mobile và desktop).

```text

```

Agent chép từng dòng sang bảng và điền các cột còn lại:

| # | URL | Loại trang | `type` / `source_id` | Ưu tiên | Tối ưu |
| - | --- | ---------- | -------------------- | ------- | ------ |

- **Loại trang**, `type` / `source_id`: MCP đúng miền thì lấy bằng `vnx_resolve_url`. Ngược lại lấy từ class `home`, `page-id-N`, `postid-N`, `term-N` trên `<body>`. Class `tag-N` là trang tag: không đề xuất dòng theo trang.
- **Ưu tiên**: thứ tự đo.
- **Tối ưu**: trường hợp 2 ghi `có` hoặc `không` khi người dùng chọn link ở bước 2b. Trường hợp 1 để `—`.

## 3. Agent điền

| Mục                                       | Giá trị     |
| ----------------------------------------- | ----------- |
| Plugin Vietnix Pagespeed PRO trên site    | `[chưa rõ]` |
| MCP `vietnix-pagespeed` nối đúng miền này | `[chưa rõ]` |
| Trạng thái plugin/MCP                     | `[chưa rõ]` |
| Báo cáo Phase 1                           | `[chưa rõ]` |
| Giai đoạn                                 | `[chưa rõ]` |
| Theme hoặc page builder                   | `[chưa rõ]` |

- **Trạng thái plugin/MCP**: `chưa cài plugin`, `chưa có MCP` (chưa nối hoặc MCP tắt), `MCP site khác`, hoặc `MCP đúng miền`. Chỉ quyết định nguồn đo và lúc nào bắt đầu được Phase 2.
- **Báo cáo Phase 1**: thư mục báo cáo khảo sát đang dùng (bước 0b), phần tên sau ngày trùng đúng tên miền ở mục 1. Không dùng báo cáo của miền khác. Trường hợp 2 ghi tiếp vào thư mục này.
- **Giai đoạn**: `Phase 1`, `chờ cài plugin / nối MCP`, `chờ duyệt`, `Phase 2 vòng N`, `đã nghiệm thu`.
