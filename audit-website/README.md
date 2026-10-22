# Vietnix Pagespeed — hướng dẫn cho agent

Người dùng đọc `audit-website/HUONG-DAN.md`. Agent đọc file này trước khi đo điểm hoặc ghi cấu hình. Plugin giữ tối ưu. MCP chỉ là cổng đọc điểm và ghi đúng option đang có.

Không dán token MCP hay API key PageSpeed vào báo cáo, log, hoặc file trong repo. Ngoại lệ duy nhất: ô API key PageSpeed ở mục 1 của `Do.md`, do người dùng điền để đo khi không có MCP. Gọi `vnx_list_options` để biết giá trị hiện tại. Danh sách key nằm ở `PLUGIN.md`.

Skill chi tiết: `audit-website/audit-pagespeed`, `audit-website/measure-page-load`, `audit-website/apply-pagespeed`. Cách từng option và dòng của plugin chạy trên frontend: `audit-website/PLUGIN.md`.

| Đường dẫn                                                                     | Nội dung                                                                                                                                                     |
| --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `audit-website/HUONG-DAN.md`                                                    | Hướng dẫn dùng và quy trình cho người vận hành. Bản trình chiếu `HUONG-DAN.pptx` và bản in `HUONG-DAN.pdf` giữ cùng nội dung            |
| `audit-website/README.md`                                                       | File này: nối MCP, quy trình agent, schema báo cáo                                                                                                       |
| `audit-website/Do.md`                                                           | Phiếu thông tin website: tên miền, link, API key                                                                                                          |
| `audit-website/PLUGIN.md`                                                       | Cách plugin chạy: điều kiện tối ưu, guest và client, từng option, cú pháp dòng VPI, lazyload HTML, Critical CSS                                   |
| `audit-website/Mẫu báo cáo - Hiện trạng website trước khi tối ưu.docx` | Mẫu báo cáo Word gửi khách                                                                                                                               |
| `audit-website/audit-pagespeed/`, `measure-page-load/`, `apply-pagespeed/`  | Ba skill: đo và báo cáo hiện trạng, đo tải thật, ghi tối ưu qua MCP                                                                                |
| `audit-website/scripts/`                                                        | `measure-run.js` (đo PSI và tải thật), `fill-status-docx.py` (điền file Word), `vietnix-pagespeed-bridge.mjs` (bridge MCP cho Cursor)             |
| `audit-website/quy-trinh/`                                                      | Sơ đồ nghiệp vụ Phase 1, Phase 2, bản phân tích và nhật ký thay đổi quy trình. Số liệu trong đó chỉ để minh họa, không dùng làm mốc |
| `audit-website/reports/YYYY-MM-DD-ten-mien/`                                    | Thư mục của một lần audit. Mọi file của lần đó nằm ở đây                                                                                        |
| `…/YYYY-MM-DD-ten-mien.md`                                                     | Báo cáo kỹ thuật cho agent và admin                                                                                                                      |
| `…/Báo cáo - Hiện trạng website trước khi tối ưu - ten-mien.docx`      | Báo cáo Word gửi khách, trước tối ưu                                                                                                                  |
| `…/Báo cáo - Kết quả sau tối ưu - ten-mien.docx`                         | Báo cáo Word gửi khách, sau tối ưu                                                                                                                      |
| `…/Đề xuất bổ sung - ten-mien.md`                                          | Việc còn lại sau tối ưu: người dùng tự làm, hoặc AI làm khi được duyệt. Chỉ tạo khi có việc còn lại                                     |
| `…/cau-hinh-truoc-toi-uu.json`                                                 | Bản chụp cấu hình plugin trước lần ghi đầu tiên (trường hợp 2), dùng để khôi phục                                                           |
| `…/assets/`                                                                    | Ảnh chụp PageSpeed và ảnh trang của lần đo                                                                                                             |
| `…/critical-css/`                                                              | CSS do `vnx_critical_crawler` cào và ảnh so sánh trang đầy đủ với trang chỉ có Critical CSS. Chỉ tạo khi sinh Critical CSS                           |
| `…/anh-toi-uu/`                                                                | Ảnh đã nén và `HUONG-DAN-THAY-ANH.md` (mục **Thay ảnh ngoài plugin**). Chỉ tạo khi có việc nén ảnh                                      |
| `…/sao-luu-noi-dung/`                                                          | Nội dung trang hoặc template sao lưu trước khi AI sửa (mục **Thay ảnh ngoài plugin**)                                                          |

Không lưu báo cáo hay ảnh ở thư mục gốc. Mọi file của một lần audit nằm trong `audit-website/reports/YYYY-MM-DD-ten-mien/`.

## Kết nối

Endpoint: `POST /wp-json/vnx-ps/v1/mcp`. Giao thức JSON-RPC: `initialize`, `tools/list`, `tools/call`.

Mỗi request cần hai header:

| Header                  | Vai trò                                                                                           |
| ----------------------- | -------------------------------------------------------------------------------------------------- |
| `Authorization`       | `Bearer` cộng token MCP. Sai token trả 401.                                                    |
| `X-Pagespeed-Api-Key` | API key PageSpeed Insights. Thiếu header thì không đo điểm. Plugin không trả key này về. |

Lệnh nối mẫu nằm ở mục **Mẫu kết nối** trong trang admin plugin. Bốn agent dùng chung endpoint và hai header. Chỉ Cursor chạy file bridge. Claude Code, Claude và Codex gửi header thẳng tới URL plugin, không copy `vietnix-pagespeed-bridge.mjs`.

| Agent                                 | Chỗ cấu hình                                                | File bridge |
| ------------------------------------- | -------------------------------------------------------------- | ----------- |
| Cursor                                | `~/.cursor/mcp.json` hoặc `.cursor/mcp.json` của project | Có         |
| Claude Code                           | `claude mcp add`, lưu ở `~/.claude.json`                 | Không      |
| Claude (claude.ai và Claude Desktop) | Settings → Connectors → Add custom connector                 | Không      |
| Codex                                 | `~/.codex/config.toml`                                       | Không      |

Cursor và Claude Code đo thêm tốc độ tải thật. Claude trên web và Codex chỉ dùng điểm PageSpeed Insights.

### Cursor

Tiến trình Cursor cần một lệnh cục bộ để gắn hai header. Bản gốc nằm ở `audit-website/scripts/vietnix-pagespeed-bridge.mjs`. Bản đang chạy là đường dẫn trong `args`, mặc định `~/.cursor/vietnix-pagespeed-bridge.mjs`. `command` là `node` của máy đó (`which node`).

```json
{
  "mcpServers": {
    "vietnix-pagespeed": {
      "command": "node",
      "args": [
        "/đường/dẫn/home/.cursor/vietnix-pagespeed-bridge.mjs"
      ],
      "env": {
        "VNX_MCP_URL": "https://ten-mien/wp-json/vnx-ps/v1/mcp",
        "VNX_MCP_AUTHORIZATION": "Bearer TOKEN",
        "VNX_MCP_PAGESPEED_KEY": "PAGESPEED_API_KEY",
        "VNX_MCP_CLIENT": "cursor-4"
      }
    }
  }
}
```

`VNX_MCP_URL`, `VNX_MCP_AUTHORIZATION` và `VNX_MCP_PAGESPEED_KEY` lấy từ trang **Mẫu kết nối** của đúng site. `VNX_MCP_CLIENT` là nhãn client, bridge không đọc biến này. Không ghi token hay API key vào file bridge, báo cáo, hoặc repo.

### Claude Code

```bash
claude mcp add --transport http vietnix-pagespeed \
  "https://ten-mien/wp-json/vnx-ps/v1/mcp" \
  --header "Authorization: Bearer TOKEN" \
  --header "X-Pagespeed-Api-Key: PAGESPEED_API_KEY"
```

Lệnh ghi vào `~/.claude.json`, khóa `mcpServers.vietnix-pagespeed.url`. Có thể dán cùng nội dung vào `.mcp.json` của project với `"type": "http"`.

### Claude

Không dán file JSON. Vào Settings → Connectors → Add custom connector. Điền URL plugin, rồi hai request header: `Authorization` là `Bearer TOKEN`, `X-Pagespeed-Api-Key` là API key PageSpeed.

### Codex

Dán vào `~/.codex/config.toml`:

```toml
[mcp_servers.vietnix-pagespeed]
url = "https://ten-mien/wp-json/vnx-ps/v1/mcp"

[mcp_servers.vietnix-pagespeed.http_headers]
Authorization = "Bearer TOKEN"
X-Pagespeed-Api-Key = "PAGESPEED_API_KEY"
```

Server thêm giữa phiên chỉ nạp sau khi khởi động lại agent. Claude Code chưa khởi động lại vẫn gọi được endpoint bằng JSON-RPC (`tools/call`): đọc `url` và `headers` từ `~/.claude.json` trong script, không in token hay key, ghi vào báo cáo là tool gọi qua JSON-RPC. Trang **Mẫu kết nối** hiện token và key thật, nên không chụp hoặc gửi trang đó ra ngoài. Nếu đã lộ, tạo token và key mới.

Route chỉ nhận POST. GET trả 404. Client nào mở SSE trên cùng URL sẽ coi session đã chết. Gửi JSON-RPC bằng POST.

Quota PageSpeed: 25.000 request mỗi ngày, 30 request mỗi phút. Mỗi URL đo mobile và desktop tốn 2 request. Hết quota thì đo trên pagespeed.web.dev, không bịa điểm.

Một server MCP chỉ nối một site. `vnx_get_status` là lệnh duy nhất được gọi để lấy `site_url`, kể cả khi host khác miền trong `Do.md`. So host đó với miền cần làm. Tool nhận `url` so host theo đúng chữ với `home_url`, kể cả `www.`: URL khác dạng trả `url_forbidden`, nên chép URL vào `Do.md` đúng dạng site đang dùng.

Đo, phân tích và báo cáo hiện trạng luôn chạy trên URL trong `Do.md`: PageSpeed bằng key mục 1, tải thật bằng `measure-run.js`, HTML và header của đúng URL đó. Các việc này không gọi tool `vnx_*` khác.

Đọc option, dòng VPI, Critical CSS, lazyload HTML, conf LiteSpeed, `vnx_analyze_pagespeed`, `vnx_resolve_url`, `vnx_test_selector`, và mọi tool ghi chỉ chạy khi host `site_url` trùng miền cần làm. Khác host thì không gọi chúng, vì chúng đọc hoặc ghi site đang nối chứ không phải miền cần làm: chỉ làm Phase 1, trường hợp 2 dừng ở bước 2b chờ nối MCP đúng miền. 

Agent thiếu tool nào trong mục **Tool** thì nhắc người dùng cập nhật plugin trên site rồi khởi động lại agent: tool mới chỉ hiện sau khi khởi động lại phiên.

### Hai trường hợp

Trường hợp chọn theo **yêu cầu của người dùng**, không theo trạng thái plugin.

| Trường hợp | Gồm                            | Luồng                                                                                                                                                                                                                                                                                                                |
| ------------- | ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1**   | Chỉ Phase 1 (khảo sát)       | Đo PSI và tốc độ load, báo cáo hiện trạng, kết thúc. Không ghi gì lên site                                                                                                                                                                                                                              |
| **2**   | Phase 1 rồi Phase 2 (tối ưu) | Đã có báo cáo Phase 1 của miền này: dùng lại, làm tiếp Phase 2. Chưa có: làm Phase 1 từ đầu rồi sang Phase 2. Phase 2: cài plugin và nối MCP (nếu chưa), đo lại sau cài plugin, duyệt, tối ưu, double check (Point + Site health), nghiệm thu. AI kết thúc sau báo cáo nghiệm thu |

Người dùng không nói trường hợp nào thì hỏi lại, không đoán. Ví dụ "đo và báo cáo", "khảo sát" là trường hợp 1; "tối ưu" là trường hợp 2.

Trạng thái plugin và MCP chỉ quyết định nguồn đo và lúc nào Phase 2 bắt đầu được:

| Trạng thái (bước 0)                                            | Phase 1                                                                                                          | Phase 2                                                                  |
| ------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Chưa cài plugin                                                  | Đo bằng key mục 1 của `Do.md` (hoặc pagespeed.web.dev) và `measure-run.js`. Không gọi tool `vnx_*` | Dừng, nhờ người dùng cài plugin và nối MCP                       |
| Đã cài, chưa nối MCP hoặc MCP tắt (403)                     | Như trên                                                                                                       | Dừng, nhờ người dùng bật và nối MCP, khởi động lại agent     |
| **MCP site khác**: `site_url` khác miền trong `Do.md` | Như trên. Không đọc option, không ghi                                                                      | Dừng, nhờ người dùng nối MCP đúng miền, khởi động lại agent |
| Đã cài, MCP đúng miền, `vnx_get_status` đủ               | Đo qua `vnx_analyze_pagespeed` và `measure-run.js --skip-psi`. Chỉ đọc, không ghi                      | Làm được                                                             |

Quy trình nằm ở mục **Quy trình** bên dưới. `Do.md` chỉ chứa thông tin website. MCP tắt thì admin vẫn lưu option trên các tab plugin, không cần API key.

### Đo PSI bằng API key

Dùng khi không đo qua MCP: chưa cài plugin, chưa nối MCP, MCP tắt, hoặc MCP đang nối site khác (mục **Đo khi chưa có MCP đúng miền**). Đọc key từ `Do.md` vào biến, để key không xuất hiện trong lệnh hay kết quả:

```bash
KEY=$(awk -F'|' '/^\| API key PageSpeed/{gsub(/[ `]/,"",$3); if ($3 !~ /^\[/) print $3}' audit-website/Do.md)
for s in mobile desktop; do
  curl -sG "https://www.googleapis.com/pagespeedonline/v5/runPagespeed" \
    --data-urlencode "url=$URL" -d "strategy=$s" -d "category=performance" -d "key=$KEY" \
    -o "$SCRATCH/psi-$s.json"
done
```

- `KEY` rỗng nghĩa là ô còn trống hoặc trong ngoặc vuông (`[chưa rõ]`): đo trên pagespeed.web.dev.
- `measure-run.js` tự đọc key từ cùng ô này (tham số `--do`, mặc định `audit-website/Do.md`), không cần truyền key.
- Lưu JSON vào thư mục tạm của agent, không lưu vào `reports/`. Chỉ đưa số liệu vào báo cáo.
- Không `echo` biến `KEY`, không ghi key vào báo cáo hay file nào khác.
- Lỗi 400 `API key not valid` hoặc 403: báo người dùng kiểm tra key, không thử key khác. 429: hết quota, đo trên pagespeed.web.dev.
- Nên giới hạn key chỉ cho PageSpeed Insights API trong Google Cloud (Credentials → API restrictions).

Cursor và Claude Code không viết lệnh đo mới trong phiên. Một lệnh chạy PageSpeed và tải thật cùng lúc, mỗi URL một lần (Phase 1). Mốc "trước" ở bước 2b và mọi lần đo ở bước 4: 3 lần lấy trung vị, xem **Đo nhiều lần** ở bước 4:

```bash
node audit-website/scripts/measure-run.js --url "$URL" --scratch "$SCRATCH" --assets "$ASSETS"
```

`$SCRATCH` nằm ngoài `reports/`. `$ASSETS` là `assets/` của lần chạy. Đã có điểm từ `vnx_analyze_pagespeed` thì thêm `--skip-psi` và bật lệnh này cùng lúc với tool MCP, không đợi điểm xong. `--skip-browser` chỉ đo PSI. Lệnh trả `summary.json`: điểm, audit dưới 0,9, TTFB, DOMContentLoaded, Load, LCP, phần tử LCP, CLS và phần tử gây dịch chuyển (`clsShifts`), cache (`x-litespeed-cache` hoặc `cf-cache-status`), độ dịch chuyển sau một lần rê chuột (`shiftPx`). Ảnh `load-<thiết bị>-after-load.png` luôn chụp khi có `--assets`; `load-<thiết bị>-after-4s.png` chỉ chụp thêm khi ảnh LCP hoặc ảnh hero vẫn là SVG giữ chỗ. Exit 2 nghĩa là một nhánh lỗi: nhánh kia đã có số, không đo lại nhánh đó. Exit 1 là cả hai nhánh lỗi.

Tải thật đo trên profile Chrome mới: mở URL một lần, rồi tải lại bỏ cache trình duyệt và đo lần tải lại. Site bật LiteSpeed Guest Mode thì lượt mở đầu đã nhận cookie, nên số tải thật là của **bản khách thường**, còn PSI và HTML curl là **bản guest**. Hai bản có thể khác nhau khi key `_client` đang tắt (`PLUGIN.md` mục 1). File Word điền bằng `audit-website/scripts/fill-status-docx.py`, không sửa `document.xml` bằng tay. Khóa `ratings` trong JSON là 4 cặp `[hiện trạng, đánh giá]` theo thứ tự Cache, Tốc độ load thực, Giật ảnh, Bên thứ 3. Khóa `note` (tùy chọn, theo từng trang) là dòng chú ý các chỉ số không cần cải thiện, in dưới bảng của trang. Script đổi chữ và màu ô: ĐẠT xanh, KHÔNG ĐẠT đỏ, "Không đáng kể" vàng.

`vnx_get_status` chỉ để biết `site_url`. Host khớp miền trong `Do.md` thì cần thêm `plugin_active`, `mcp_enabled`, và `pagespeed_api_key_header` là `present` trước khi gọi `vnx_analyze_pagespeed` và các tool đọc option. Host khác thì bỏ qua các điều kiện đó và đo URL trong `Do.md` bằng key mục 1. Kết quả có `site_url`, `home_url` và `rows` của site đang nối, không phải của miền đang kiểm tra.

## Quy trình

Đọc `Do.md` để lấy tên miền, trường hợp, link và API key. Điền plugin, MCP, trạng thái, báo cáo Phase 1, giai đoạn và theme vào mục 3 của phiếu. Không ghi nhật ký vào `Do.md`. Sơ đồ nghiệp vụ: `audit-website/quy-trinh/` (`Quy trình hoạt động.bpmn` và bản `.png`/`.svg`: sơ đồ BPMN tổng, hai làn Người dùng và AI agent; `Phase 1.png`, `Phase 2.png`, `Phân tích quy trình.md`). Số liệu trong `quy-trinh/` là ví dụ của một lần chạy cũ trên site khác, chỉ giải thích lý do của quy trình: không dùng làm mốc, ngưỡng hay kết quả mong đợi.

| Trường hợp                     | Các bước                                                                                                                                                               |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1. Chỉ Phase 1**         | Bước 0 → 1 → 2 → kết thúc                                                                                                                                          |
| **2. Phase 1 rồi Phase 2** | Bước 0 → tìm báo cáo Phase 1 (**Bước 0b**) → bước 1–2 nếu chưa có hoặc thiếu link → **Bước 2b** (vào Phase 2) → 3 → 4 → AI kết thúc |

Trường hợp lấy từ ô **Trường hợp** ở mục 1 của `Do.md`, hoặc từ tin nhắn ("khảo sát" là 1, "tối ưu" là 2) rồi ghi vào ô đó. Vẫn chưa rõ: hỏi lại trước bước 1.

Điểm dừng bắt buộc:

- Trường hợp 1: kết thúc sau báo cáo hiện trạng. Không hỏi tối ưu, không gọi tool ghi.
- Trường hợp 2, bước 2b, plugin chưa cài, MCP chưa nối, MCP tắt hoặc MCP site khác: dừng, nhờ người dùng cài plugin hoặc nối MCP đúng miền và khởi động lại agent. Người dùng nhắn `tiếp tục` thì làm lại bước 0 mục 4–6 rồi tiếp bước 2b.
- Trường hợp 2, cuối bước 2b: hỏi link nào cần tối ưu và dòng `proposed` nào được duyệt. Ghi `có` hoặc `không` vào cột **Tối ưu** ở mục 2 của `Do.md`. Người dùng không cần tối ưu thì kết thúc.
- Trước mỗi lần ghi thật ở bước 3 và mỗi lần rollback ở bước 4: chờ người dùng xác nhận diff của dry-run.
- Bước 4 chưa đạt mà còn việc plugin làm được: hỏi người dùng trước khi tối ưu thêm vòng nữa.
- Bước 0, 1 và phần đo của bước 2b và bước 4 chạy liền, không cần hỏi.
- AI kết thúc sau báo cáo nghiệm thu (bước 4). Đổi sang plugin lite là việc của người dùng: AI không làm, không lên kế hoạch cho bước này.

Báo cáo chỉ lưu trong `audit-website/reports/YYYY-MM-DD-ten-mien/`. Không lưu gì lên site ngoài thao tác của plugin tối ưu qua MCP (option, Critical CSS, VPI, lazyload HTML, purge). Ngoại lệ duy nhất: thay ảnh khi người dùng yêu cầu rõ, theo mục **Thay ảnh ngoài plugin**.

Chỉ tối ưu các URL ở mục 2 của `Do.md` có cột **Tối ưu** là `có`. Đọc `audit-website/PLUGIN.md` trước bước 2.

Chỉ tối ưu trang được yêu cầu. Dùng dòng theo trang (VPI, Critical CSS, lazyload HTML) cho từng trang. Option của plugin là toàn site: chỉ đề xuất ghi khi không có cách theo trang và người dùng yêu cầu rõ thay đổi toàn site; còn lại ghi `skipped` hoặc đưa vào file đề xuất bổ sung, ghi rõ là áp mọi trang. `active_all` là công tắc tổng: không tắt; đang tắt thì báo người dùng trước khi đề xuất bật.

Thư mục của lần chạy: `audit-website/reports/YYYY-MM-DD-ten-mien/`. Báo cáo, ảnh, file Word đều nằm ở đây. Ngày là ngày bắt đầu bước 1 của Phase 1. Trường hợp 2 dùng lại báo cáo Phase 1 thì ghi tiếp vào thư mục đó, không tạo thư mục mới.

**Nguồn so sánh.** Mốc "trước" và số "sau" chỉ lấy trong thư mục của lần chạy hiện tại (hoặc báo cáo Phase 1 tìm được ở bước 0b), và chỉ so số của cùng URL, cùng thiết bị, cùng nguồn đo (MCP, API key, pagespeed.web.dev, tải thật). Không so với báo cáo của tên miền khác, số liệu trong `quy-trinh/`, `HUONG-DAN.md`, ví dụ trong tài liệu, hay số nhớ từ phiên trước. Tiêu chí đạt chỉ lấy từ bảng thông số ở bước 2 và bước 4.

### Bước 0. Kiểm tra trước

Chung cho cả hai trường hợp.

1. Kiểm tra cách nối theo agent đang chạy. Việc này không chặn đo, phân tích và báo cáo. Cursor: đọc `~/.cursor/mcp.json`, khối `mcpServers.vietnix-pagespeed`. Đường dẫn file là phần tử `args` kết thúc bằng `vietnix-pagespeed-bridge.mjs`. Khối chưa có `args` thì dùng `~/.cursor/vietnix-pagespeed-bridge.mjs`. File chưa có tại đường dẫn đó: copy từ `audit-website/scripts/vietnix-pagespeed-bridge.mjs`, giữ nguyên nội dung. Claude Code, Claude và Codex không copy file bridge. Khối MCP chưa có, hoặc thiếu `VNX_MCP_URL`, `VNX_MCP_AUTHORIZATION`, `VNX_MCP_PAGESPEED_KEY`: ghi MCP chưa nối, không bịa token, rồi vẫn đo URL trong `Do.md`. File hoặc cấu hình MCP vừa thêm giữa phiên thì nhắc khởi động lại agent trước khi gọi `vnx_*`.
2. Đọc `Do.md`. URL là từng dòng trong khối plain text ở mục 2. Thiếu tên miền hoặc không có URL nào thì hỏi lại, không đoán. Ô **Trường hợp** ở mục 1 còn `[chưa rõ]` và tin nhắn không nói thì hỏi.
3. Bỏ URL khác host, báo người dùng.
4. Plugin đã cài chưa: kiểm tra lần lượt `wp-content/plugins/vietnix-pagespeed-pro/vnx-pagespeed.php` và `wp-content/plugins/vietnix-pagespeed/vnx-pagespeed.php`. `200` là đã cài (có thể chưa bật). Cả hai `404` mới là chưa cài ở thư mục mặc định. Thêm dấu vết trong HTML: `vnx-critical-css-inline`, `data-vnx-lazy`.
5. MCP có nối đúng miền không. Gọi `vnx_get_status` một lần và so host của `site_url` với tên miền. Khác host: ghi `site_url` đang nối vào mục 3 của `Do.md`, trạng thái **MCP site khác**, không gọi tool `vnx_*` nào nữa. Đo, phân tích và báo cáo vẫn chạy trên URL trong `Do.md`.
6. MCP đúng miền: cần `plugin_active`, `mcp_enabled`, `pagespeed_api_key_header` là `present` trước khi gọi tool đọc option hoặc `vnx_analyze_pagespeed`. Agent thiếu tool trong mục **Tool** thì nhắc người dùng khởi động lại phiên agent.
7. Ghi plugin, MCP và trạng thái vào mục 3 của `Do.md`; trường hợp ghi ở mục 1. Trạng thái theo bảng ở mục **Hai trường hợp**: chưa cài plugin, chưa có MCP, MCP site khác, hoặc MCP đúng miền. Đã cài, MCP đúng miền nhưng thiếu `pagespeed_api_key_header`: đo PSI bằng key ở mục 1 của `Do.md` hoặc trên pagespeed.web.dev, ghi rõ nguồn.

### Bước 0b. Tìm báo cáo Phase 1 (trường hợp 2)

Tìm trong `audit-website/reports/` thư mục `YYYY-MM-DD-ten-mien/` mới nhất có file `.md` hiện trạng và `Báo cáo - Hiện trạng website trước khi tối ưu - ten-mien.docx`. Phần sau ngày (bỏ `YYYY-MM-DD-`) phải trùng **đúng** tên miền trong `Do.md`, không khớp theo đuôi: `abc.vn` không dùng thư mục `YYYY-MM-DD-shop-abc.vn`. `www.` và không `www.` là cùng miền; tên miền con khác là miền khác. Khớp từng link theo URL đầy đủ (cùng đường dẫn, bỏ `#`, chuẩn hóa dấu `/` cuối), không theo tên trang. Báo cáo ghi trạng thái plugin hoặc ngày khác với hiện tại thì vẫn dùng làm tham khảo, mốc "trước" lấy ở bước 2b mục 3.

| Kết quả                                             | Việc làm                                                                                                                                   |
| ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Có, báo cáo có mục cho mọi link trong `Do.md` | Đọc báo cáo: điểm, tải thật, audit, `type`/`source_id`, theme, trạng thái plugin lúc đo. Bỏ qua bước 1–2, sang bước 2b |
| Có, thiếu một số link                             | Làm bước 1–2 cho các link còn thiếu. Ghi thêm vào cùng file `.md`, thêm bảng vào file Word hiện trạng. Rồi sang bước 2b  |
| Chưa có                                             | Làm bước 1–2 cho mọi link, rồi sang bước 2b                                                                                          |

Ghi vào đầu mục mới của file `.md`: dùng lại báo cáo Phase 1 ngày nào, cho link nào.

### Bước 1. Phân tích

Phase 1. Theo skill `audit-pagespeed` và `measure-page-load`. Chưa gọi tool ghi.

Phần đo và phân tích URL trong `Do.md` không dùng tool của site đang nối. `vnx_analyze_pagespeed`, `vnx_list_options`, `vnx_read_litespeed_conf`, `vnx_list_rows`, `vnx_resolve_url` chỉ gọi khi host `site_url` trùng miền.

1. Điểm PSI: host `site_url` trùng miền thì `vnx_analyze_pagespeed` từng URL theo thứ tự ưu tiên, giữ quota 30 request mỗi phút, và chạy `measure-run.js --skip-psi` cùng lúc. Host khác, chưa có MCP, hoặc chưa cài plugin: một lệnh `audit-website/scripts/measure-run.js` không có `--skip-psi` (xem **Đo khi chưa có MCP đúng miền**).
2. Claude Code hoặc Cursor lấy tải thật từ `summary.json` của script đó, trên URL gốc, không thêm `?vnx-device=`. Không đo lại khi đã có TTFB, DOMContentLoaded, Load và LCP. `PLUGIN.md` đọc trong lúc lệnh đo chạy, trước khi viết dòng `proposed`.
3. Ảnh màn hình đầu: host khớp và `vnx_analyze_pagespeed` trả dòng `vnx-lazy-hero` thì đối chiếu `selectors`, `image_url`, `type`/`source_id`. Mọi trường hợp đều xác nhận trên HTML của đúng URL: ảnh có `data-vnx-lazy` và `src` SVG giữ chỗ. Có thì chụp bằng chứng vào `assets/` (ngay sau load và vài giây sau).
4. Chỉ khi host `site_url` trùng miền: `vnx_list_options` để biết cấu hình hiện tại, `vnx_read_litespeed_conf` cho mục Đề xuất, `vnx_list_rows` cho `vpi`, `lazyload_html`, `critical_css`. Host khác thì bỏ mục này. Trường hợp 2 chưa có MCP thì làm mục này ở bước 2b.
5. Chỉ khi host `site_url` trùng miền: `vnx_resolve_url` từng URL để lấy `type`/`source_id`, `body_classes`, dòng đang khớp. Host khác: lấy loại trang và `type`/`source_id` từ class `home`, `page-id-N`, `postid-N`, `term-N` trên `<body>` của đúng URL. Không phải WordPress thì ghi `—`. Class `tag-<id>` và taxonomy `post_tag`: frontend không áp dòng theo trang. Ghi `ngoài phạm vi`, không đưa vào `proposed`.
6. Đọc HTML và header để ghi theme hoặc page builder, plugin tối ưu đang có, ảnh màn hình đầu, font và script bên thứ ba. Điền theme vào mục 3 của `Do.md`.

### Bước 2. Báo cáo hiện trạng

Phase 1.

1. Ghi `YYYY-MM-DD-ten-mien.md` theo mục **Báo cáo** trong file này. Đầu báo cáo ghi trường hợp, trạng thái plugin/MCP và nguồn điểm. Mỗi URL một bảng audit và một bảng **Đánh giá thông số** (mục **Đánh giá trang** bên dưới). Dòng plugin xử lý được và gắn với thông số chưa đạt: `proposed` khi MCP đúng miền, `cần plugin` khi chưa cài plugin hoặc chưa có MCP đúng miền. Dòng không gắn với thông số chưa đạt: `theo dõi`. Việc plugin không xử lý được ghi `ngoài phạm vi`.
2. Thêm mục **Đề xuất LiteSpeed** một lần cho cả site, trạng thái `suggestion`, chỉ khi host `site_url` trùng miền và đã gọi `vnx_read_litespeed_conf`. Host khác thì không lập mục này.
3. Báo cáo chỉ nằm trong thư mục của lần chạy, không lưu lên site.
4. Chụp pagespeed.web.dev một lần, tối đa 40 giây. Trang báo `Unable to resolve` hoặc chưa hiện điểm thì dừng, ghi số từ API hoặc MCP vào ô ảnh. Không chụp lại.
5. Tạo `Báo cáo - Hiện trạng website trước khi tối ưu - ten-mien.docx` từ file mẫu, theo mục **Báo cáo Word cho khách**. Mục Tốc độ load chỉ ghi mốc Load. Ô ảnh Network để trống cho người dùng tự chụp. Mục `TỐI ƯU DỰ KIẾN` chỉ ghi việc cho thông số chưa đạt, không ghi tên option (thay nội dung mẫu qua khóa `extra` của `fill-status-docx.py`). Trang đạt hết: ghi `Không cần tối ưu: trang đã đạt các tiêu chí`.
6. Có dòng VPI, Critical CSS hoặc lazyload HTML trong phương án, và host `site_url` trùng miền: ghi trang đó đã có dòng chưa (`vnx_resolve_url`, `vnx_list_rows`), dòng cũ còn đúng không (`vnx_test_selector`, `count: 0` là trỏ vào phần tử không còn). Host khác thì bỏ mục này.

#### Đánh giá trang

Đánh giá từng URL theo 6 thông số. Trường hợp 1 dùng số Phase 1. Trường hợp 2 đánh giá lại trên mốc "trước" (bước 2b mục 3).

Với PageSpeed, báo cáo chỉ xét **điểm tổng hiệu suất** (Performance) của mobile và desktop. Các chỉ số con FCP, LCP, TBT, CLS, Speed Index, TTFB vẫn ghi trong bảng đo của file `.md` làm dữ liệu, nhưng không dùng để kết luận đạt hay chưa đạt, không đưa vào dòng chú ý, tóm tắt hay file Word. Chỉ số con chỉ dùng khi tối ưu (lập dòng `proposed` cho trang có điểm tổng chưa đạt, bước 3, bước 4 Double check).

| Thông số                           | Đạt khi                                                        | Chưa đạt thì tập trung vào                                                                                                |
| ------------------------------------ | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Điểm tổng hiệu suất PSI mobile  | ≥ 90 (xanh, theo mục `TỐI ƯU DỰ KIẾN` của mẫu Word)    | Khi tối ưu: chỉ số con chưa xanh của mobile (FCP, LCP, TBT, CLS, Speed Index, TTFB) và audit dưới 0,9 gắn với chúng |
| Điểm tổng hiệu suất PSI desktop | ≥ 90                                                            | Như trên, cho desktop                                                                                                         |
| Tốc độ load thật                 | Desktop ≤ 2 s, Mobile ≤ 3 s                                    | TTFB, CSS/JS chặn hiển thị, ảnh lớn ở màn hình đầu                                                                    |
| Cache                                | `x-litespeed-cache: hit` hoặc tương đương                | Ngoài plugin: đưa vào **Đề xuất LiteSpeed** và file đề xuất bổ sung                                           |
| Giật ảnh do tải chậm             | Ảnh màn hình đầu có `src` thật, hiện ngay; CLS ≤ 0,25 | VPI cho ảnh màn hình đầu, `LS_optimize_lazyload`, size ảnh theo khung                                                   |
| Load chậm do bên thứ 3            | Không ảnh hưởng hoặc không đáng kể                      | `delay_js`, `delay_js_list` cho script bên thứ ba                                                                         |

- **Trang đạt cả 6 thông số:** ghi kết luận `Không cần tối ưu` cho trang đó, kèm lý do (các số đạt). Mọi dòng audit của trang là `theo dõi`, không có dòng `proposed`. Lỗi kỹ thuật vẫn ghi lại để theo dõi (ví dụ ảnh hero `src` SVG nhưng hiện trong 0,3 s), không đề xuất sửa.
- **Trang có thông số chưa đạt:** ghi rõ thông số nào chưa đạt và số đo. Chỉ đề xuất dòng `proposed` gắn với thông số đó (cột **Thông số** trong bảng audit). Dòng khác là `theo dõi`. Thứ tự ưu tiên: thông số chưa đạt xa ngưỡng nhất trước. Điểm tổng PSI chưa đạt: chọn dòng `proposed` theo chỉ số con chưa xanh (FCP, LCP, TBT, CLS, Speed Index, TTFB) của đúng thiết bị đó.
- Tóm tắt từng link: `Không cần tối ưu`, hoặc `Cần tối ưu: <thông số chưa đạt>`.

**Trường hợp 1: kết thúc.** Trình tóm tắt từng link (điểm, Load, ĐẠT hoặc KHÔNG ĐẠT, `Không cần tối ưu` hoặc thông số cần tối ưu), trạng thái plugin/MCP và đường dẫn hai file báo cáo. Không hỏi tối ưu. Không tạo file đề xuất bổ sung.

**Trường hợp 2:** sang bước 2b, không dừng.

### Bước 2b. Vào Phase 2 (trường hợp 2)

1. Plugin và MCP: trạng thái chưa cài plugin, chưa có MCP, MCP tắt hoặc MCP site khác thì **dừng**. Trình tóm tắt Phase 1 và nhờ người dùng: cài plugin, bật MCP, nối agent theo mục **Kết nối**, khởi động lại agent, rồi nhắn `tiếp tục`. Khi tiếp tục: làm lại bước 0 mục 4–7.
2. MCP đúng miền và `vnx_get_status` đủ: làm bước 1 mục 4–5 nếu Phase 1 chưa làm (`vnx_list_options`, `vnx_read_litespeed_conf`, `vnx_list_rows`, `vnx_resolve_url`).
3. **Đo lại sau cài plugin** khi số Phase 1 đo lúc chưa cài plugin, chưa có MCP đúng miền, hoặc ở ngày trước. Cài plugin tự làm đổi trang (ví dụ plugin lazyload ảnh hero làm PSI không thấy ảnh, điểm tăng mà trang không nhanh hơn), nên số Phase 1 không dùng làm mốc so sánh. Đo như bước 1 mục 1–3, ghi mục **Kiểm tra lại — sau cài plugin** vào file `.md`: điểm, tải thật, audit, dòng `proposed` mới (thay các dòng `cần plugin`), mục **Đề xuất LiteSpeed**, và bước 2 mục 6. Đo 3 lần lấy trung vị như mục **Đo nhiều lần** ở bước 4. Số này là mốc "trước" của nghiệm thu; số Phase 1 giữ để tham khảo. Trước khi đo mốc, đối chiếu `vnx_list_rows` với HTML đang cache: dòng đã gỡ hoặc sửa mà chưa purge thì cache vẫn trả bản cũ. So HTML URL gốc với bản tải kèm `?nc=<số bất kỳ>` (Critical CSS inline, preload, `src` ảnh VPI); khác nhau thì xin purge URL đó trước khi đo. Phase 1 vừa đo trong phiên này với MCP đúng miền thì dùng luôn số đó, không đo lại; Phase 1 chỉ đo một lần thì đo thêm 2 lần trước lần ghi đầu tiên ở bước 3 để mốc cũng là trung vị của 3.
4. Đánh giá lại từng trang trên mốc "trước" theo **Đánh giá trang** (bước 2). Cài plugin có thể làm một thông số đổi từ đạt sang chưa đạt hoặc ngược lại.
5. **Kiểm tra cấu hình đã có.** Site đã có option hoặc dòng plugin từ trước (do người khác, lần tối ưu cũ, hoặc admin tự lưu) thì kiểm tra từng mục trước khi đề xuất thêm. Dùng `vnx_list_options`, `vnx_list_rows` (ba bảng), `vnx_resolve_url` và `vnx_test_selector` của từng link. Ghi bảng **Cấu hình đã có** vào file `.md` (mục **Báo cáo**), mỗi mục kết luận `giữ`, `thay` hoặc `gỡ`, kèm lý do và bằng chứng:

| Mục                                                                                       | Kiểm tra                                                                                                                             | `thay` hoặc `gỡ` khi                                                                                                                                                                                     |
| ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `active_all`                                                                             | Còn `"1"`                                                                                                                          | Đang tắt: báo người dùng, không tự bật (bật là áp mọi option đang lưu cho toàn site)                                                                                                           |
| `LS_delay_combined_css`, `ls_async_combined_css`                                       | Trang có dòng Critical CSS chưa; hai option có cùng bật không                                                                  | Delay bật mà trang chưa có Critical CSS (P1); cả hai cùng bật. Thay bằng: gắn Critical CSS cho trang, hoặc chọn một trong hai                                                                      |
| `delay_js_list`, `delay_js_time`                                                       | Keyword nào còn khớp script trên HTML của trang                                                                                  | Keyword quá ngắn (`js`), `jquery`/`wp-includes` chưa được duyệt, keyword không còn khớp script nào, script bên thứ ba chưa đạt mà chưa có keyword                                     |
| Key `_client`                                                                            | Ai thực sự nhận tối ưu (guest hay khách thường)                                                                               | Đang bật mà không ai yêu cầu, hoặc thông số chưa đạt ở bản khách thường                                                                                                                       |
| Dòng VPI                                                                                  | `vnx_test_selector` mobile và desktop; ảnh có ở màn hình đầu không; size `(replace)` so với bề rộng hiển thị × DPR | `count: 0` (dòng cũ); ảnh dưới viewport; ảnh LCP chưa có trong dòng; size nhỏ hơn khung (ảnh mờ) hoặc lớn hơn nhiều; dòng thứ hai cùng `type` + `source_id` (không bao giờ chạy)  |
| Dòng lazyload HTML                                                                        | Selector trỏ vùng nào                                                                                                              | Trỏ header, hero hoặc màn hình đầu; `count: 0`                                                                                                                                                         |
| Dòng Critical CSS                                                                         | Có đủ bản mobile và desktop; trang có mất style hoặc nhảy bố cục trước khi tương tác                                  | Thiếu một bản; nội dung rỗng; trang mất style, chữ mất nền, nhảy bố cục (`shiftPx`) khi delay CSS chạy                                                                                          |
| Dòng nhóm (`post_type`, `taxonomy`, `group_post`, `post_in-*`) đang khớp trang | Trang có dòng riêng chưa                                                                                                          | Dòng nhóm sai với trang này: thêm dòng riêng cho trang, không sửa dòng nhóm vì nó áp cho trang khác. Sửa dòng nhóm chỉ khi người dùng duyệt rõ, kèm danh sách trang bị ảnh hưởng |

- Trang `Không cần tối ưu`: mọi mục là `giữ`, mục bất thường ghi `theo dõi`. Không thay, trừ khi người dùng yêu cầu.
- Trang có thông số chưa đạt: chỉ `thay` hoặc `gỡ` mục gắn với thông số đó, hoặc mục đang gây lỗi (P1). Mục `thay`/`gỡ` thành dòng `proposed`, cột **Thao tác** ghi `thay` hoặc `gỡ` và giá trị cũ → mới. Mục còn đúng là `giữ`.
- Trang đã có dòng thì sửa dòng đó bằng `id`, không thêm dòng mới.
- Option là toàn site: `thay` chỉ khi option đó đang gây lỗi trên trang được tối ưu hoặc người dùng yêu cầu rõ. Dòng `proposed` ghi rõ áp cho mọi trang.

6. **Dừng và hỏi yêu cầu tối ưu.** Trình tóm tắt từng link (điểm, Load, `Không cần tối ưu` hoặc `Cần tối ưu: <thông số>`) và bảng `proposed`, rồi hỏi:
   - Link nào cần tối ưu. Đề xuất sẵn: trang `Không cần tối ưu` là `không`, trang có thông số chưa đạt là `có`. Người dùng vẫn chọn tối ưu trang đã đạt được, khi đó ghi rõ là theo yêu cầu. Ghi `có`/`không` vào cột **Tối ưu** ở mục 2 của `Do.md`.
   - Dòng `proposed` nào duyệt, dòng nào bỏ.

Mọi trang `Không cần tối ưu` và người dùng đồng ý: kết thúc, báo cáo hiện trạng là kết quả cuối, không tạo báo cáo nghiệm thu. Người dùng không cần tối ưu thì kết thúc.

### Bước 3. Tối ưu

Phase 2. Theo skill `apply-pagespeed`. Chỉ khi host `site_url` trùng miền trong `Do.md`, chỉ link có cột **Tối ưu** là `có` và dòng `proposed` đã duyệt. Mỗi thay đổi phải gắn với một thông số chưa đạt của trang đó; không tối ưu thêm thông số đã đạt. Bỏ dòng `suggestion`, `theo dõi` và `ngoài phạm vi`. Host khác thì không vào bước này.

0. **Bản chụp cấu hình.** Trước lần ghi đầu tiên trên site, lưu `cau-hinh-truoc-toi-uu.json` vào thư mục của lần chạy: thời điểm, `site_url`, kết quả `vnx_list_options`, `vnx_list_rows` của `vpi`, `lazyload_html`, `critical_css` (Critical CSS có nội dung). Không có token hay API key trong file. Đã có file thì giữ nguyên, không ghi đè ở vòng sau: đây là điểm khôi phục về cấu hình trước khi AI tối ưu.
1. Mỗi tool ghi gọi `dry_run: true` trước. Trình `diff` cho người dùng. Chỉ gọi `dry_run: false` sau khi người dùng xác nhận diff đó.
2. Thứ tự trên mỗi trang, chỉ làm bước gắn với thông số chưa đạt:
   1. **Critical CSS**: sinh theo mục **Sinh Critical CSS** bên dưới, lưu bằng `vnx_save_critical_css`.
   2. **Ảnh màn hình đầu**: `LS_optimize_lazyload` và `vietnix_vpi_active` phải đang bật (là option toàn site: đang tắt thì hỏi trước), rồi dòng VPI.
   3. **Đo** theo **Đo nhiều lần** ở bước 4 để biết hai bước trên có tác dụng không.
   4. **CSS/JS PSI còn báo chậm** (`render-blocking`, `bootup-time`, `unused-javascript`): delay CSS (`LS_delay_combined_css` chỉ khi trang đã có Critical CSS) và `delay_js` + `delay_js_list`. Đây là option toàn site: ghi rõ áp cho mọi trang.
   5. **Lazyload HTML** cho khối dưới màn hình đầu khi DOM lớn.

   Dòng VPI, lazyload HTML, Critical CSS viết theo mục 8 trong `PLUGIN.md`, dùng `type`/`source_id` ở mục 2 của `Do.md`. Thử selector bằng `vnx_test_selector` cho cả `mobile` và `desktop` trước khi ghi: `count` phải đúng số phần tử muốn chọn. `above_fold` là ước lượng và size ảnh lấy theo bề rộng hiển thị × DPR: làm theo skill `apply-pagespeed`. Trang đã có dòng thì sửa dòng đó bằng `id` (dry-run báo `skip` + `duplicate` nếu thêm mới), hoặc gỡ bằng `vnx_remove_row`.
3. Gộp dòng theo template. Phân tích, báo cáo và dòng `proposed` vẫn làm theo từng link. Chỉ trước dry-run ghi dòng VPI, Critical CSS, lazyload HTML mới xét nhóm:
   - Các link được duyệt cùng post type và cùng template (`body_classes` giống nhau: `single-post`, `single-product`, cùng `page-template-*`, hoặc cùng template Elementor Theme Builder) thì đề xuất một dòng nhóm thay cho từng `post` / ID: `post_type` / tên post type cho mọi bài cùng loại, `post_in-<taxonomy>` / term ID khi chỉ bài trong danh mục đó dùng template, `group_post` / danh sách ID khi chỉ một nhóm chọn tay. Trang danh mục cùng taxonomy: `taxonomy` / tên taxonomy. Trang có class `elementor-page-N` là bố cục riêng: giữ dòng theo trang.
   - Trang chủ và trang có bố cục riêng luôn ghi dòng theo trang.
   - Dry-run trình rõ dòng nhóm áp cho những trang nào trên site, không chỉ các link đã đo. Người dùng chọn ghi dòng nhóm hay ghi từng trang.
   - Dòng nhóm chỉ chạy trên trang chưa có dòng riêng (`post` / ID, `term` / ID). Đọc `vnx_list_rows` và liệt kê trang trong nhóm đang có dòng riêng.
   - Không dùng `post_body_class` với class chung như `page` hay `single`: khi không có dòng riêng, frontend dò dòng này trên mọi loại trang.
   - Thử selector bằng `vnx_test_selector` trên từng link được duyệt của nhóm, cả `mobile` và `desktop`. Dòng nhóm không có URL nên gateway trả `above_fold_not_checked`.
   - Critical CSS nhóm kèm `craw_id` là ID trang mẫu đã dùng để sinh CSS.
   - Purge từng link đã đo. Trang khác trong nhóm chỉ nhận thay đổi khi cache trang đó hết hạn hoặc được purge theo URL. Ghi điều này vào báo cáo kết quả.
4. `jquery` hoặc `wp-includes` chỉ thêm vào `delay_js_list` khi người dùng duyệt đúng keyword đó lúc xem diff.
5. `litespeed_purge` lần lượt từng URL vừa sửa. Không purge all. URL phải nằm trong danh sách purge (40 URL gần nhất đã qua `vnx_analyze_pagespeed`, `vnx_resolve_url`, `vnx_test_selector` hoặc `vnx_critical_crawler`), nếu không gateway trả `url_not_in_session`.
6. Mở HTML từng trang sau purge, xác nhận thay đổi đã có hiệu lực (ví dụ ảnh VPI có `src` thật và có preload). Chưa có hiệu lực thì dừng, tìm nguyên nhân, báo người dùng.
7. Người dùng vừa thao tác trong admin (xóa dòng, bấm Save): gọi `vnx_list_options` và `vnx_list_rows` trước khi purge và đo, kiểm tra `active_all` vẫn `"1"` và các option, dòng không đổi ngoài ý muốn. Nút Lưu chỉ gửi option đã đổi so với lần mở trang hoặc lần lưu gần nhất. HTML sau purge mất hết dấu vết plugin (không còn `vnx-critical-css-inline`, ảnh mang `data-lazyloaded` của LiteSpeed) thì kiểm tra `active_all` đầu tiên.
8. Mọi lần ghi (kể cả rollback) ghi vào file `.md` ngay sau khi ghi: tool, giá trị trước và sau, `id`, kết quả kiểm tra HTML.

**Dừng** sau mỗi tool ghi nếu gateway trả lỗi. Xử lý theo bảng **Lỗi gateway** trong skill `apply-pagespeed`.

#### Sinh Critical CSS

1. Gọi `vnx_critical_crawler` cho `mobile` và `desktop`. Mở `crawl_url` trong ngữ cảnh trình duyệt mới (chrome-devtools, isolated context) với `viewport` và `user_agent` tool trả về, rồi chạy `script` với `options`. Token sống 15 phút: hết hạn thì gọi lại tool. Trang tự tải lại (LiteSpeed Guest Mode) thì chặn request `guest.vary.php` bằng script chạy trước khi tải trang.
2. Trang có nội dung chèn muộn (khối quảng cáo, khối thử nghiệm, slider chưa ổn định): cào khi phần đó đã tắt hoặc đã đứng yên. Nếu không, nội dung màn hình đầu bị đẩy xuống, rule của nó bị bỏ, và trang nhảy bố cục khi CSS đầy đủ nạp.
3. `existing_critical_css` có rule người khác thêm tay: nối các rule đó vào cuối CSS mới. Chỉ giữ `background-image` của ảnh LCP; ảnh nền khác bỏ để không tranh băng thông với ảnh LCP.
4. Kiểm tra trước khi ghi: tắt mọi `link[rel=stylesheet]`, chèn CSS mới, chụp và so với trang đầy đủ (menu, slider, chữ trên nền phải giống). Đo dịch chuyển bố cục khi CSS đầy đủ nạp. Lưu CSS và ảnh so sánh vào `critical-css/` của lần chạy (chrome-devtools chỉ ghi file trong thư mục dự án).
5. `vnx_save_critical_css` dry-run với các trường trong `save` của tool cào. Trang đã có dòng thì dry-run báo `action: update` và `replaces_ids`. Người dùng xác nhận, ghi, purge, mở HTML kiểm tra có `vnx-critical-css-inline`.
6. Sau khi thay ảnh màn hình đầu (mục **Thay ảnh ngoài plugin**), cào lại: Critical CSS cũ còn URL ảnh nền cũ.

### Bước 4. Double check và nghiệm thu

Phase 2.

**Double check**, chạy song song sau mỗi vòng tối ưu. Mở từng link đã tối ưu một lần cho cache ấm, đúng URL gốc, không thêm `?vnx-device=`.

**Đo nhiều lần, lấy trung vị.** Một lần đo dao động vài điểm PSI và vài trăm mili giây tải thật, đủ làm cổng kết quả chọn sai nhánh. Áp dụng cho Point, tốc độ load của Site health, mốc "trước" (bước 2b mục 3) và nghiệm thu (mục 5):

- Mỗi link, mỗi thiết bị đo **3 lần**, không ghi hay purge xen giữa. Hai lần PSI của cùng URL cách nhau ít nhất 75 giây: gọi sát nhau thì Google trả lại kết quả cache, số giống hệt từng chữ số. Hai lần ra số trùng hệt là kết quả cache, đo lại lần đó. PSI qua MCP: gọi `vnx_analyze_pagespeed` 3 lần. PSI bằng API key và tải thật: chạy `measure-run.js` 3 lần, mỗi lần một `--scratch` riêng (`$SCRATCH/lan-1`, `lan-2`, `lan-3`), chỉ lần thứ 3 có `--assets` để giữ ảnh chụp. Có điểm MCP thì thêm `--skip-psi`.
- Lần nào cache không phải `hit`, hoặc PSI/tải thật lỗi: bỏ lần đó, đo bù một lần. Không bịa số.
- 3 lần lệch nhau nhiều (điểm PSI chênh trên 5, hoặc Load chênh trên 300 ms giữa lần cao nhất và thấp nhất): đo thêm 2 lần, lấy trung vị của 5.
- Lấy **trung vị riêng từng chỉ số** (điểm, FCP, LCP, TBT, CLS, Speed Index, TTFB, Load). Không lấy trọn một lần "đẹp nhất". Ngưỡng đạt (PSI ≥ 90, Load Desktop ≤ 2 s, Mobile ≤ 3 s, CLS ≤ 0,25) xét trên trung vị.
- So với mốc "trước" (cũng là trung vị): chênh lệch trong **ngưỡng nhiễu** coi là không đổi, không tính là tốt hơn hay tệ hơn: điểm PSI ≤ 3, Load/LCP/FCP ≤ 200 ms, CLS ≤ 0,02. Chỉ ngoài ngưỡng này mới dùng cho cổng kết quả.
- Báo cáo ghi trung vị; phần dữ liệu kỹ thuật ghi số từng lần (hoặc thấp nhất – cao nhất) và số lần đo.
- Mỗi lần PSI tốn 2 request (mobile, desktop): 3 lần là 6 request mỗi link mỗi vòng. Hết quota thì dừng, báo người dùng, ghi rõ số lần đã đo; không kết luận đạt/tệ hơn từ một lần đo.

1. **Point**: đo lại PSI cùng nguồn với mốc "trước" (bước 2b mục 3, hoặc bước 1), mobile và desktop, 3 lần lấy trung vị. Đạt hay chưa xét theo điểm tổng hiệu suất. So từng chỉ số con FCP, LCP, TBT, CLS, Speed Index, TTFB với mốc "trước" để biết thay đổi nào có tác dụng và chọn việc cho vòng sau.
2. **Site health**: kiểm tra tốc độ và giao diện như khách mới mở bằng cửa sổ ẩn danh, xem có lỗi không:

| Kiểm tra                        | Cách làm                                                                                                  | Lỗi khi                                                                                                                                                                               |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tốc độ load                   | `measure-run.js --skip-psi` 3 lần, cùng thiết bị, viewport và UA như mốc "trước"; lấy trung vị | Trung vị Desktop > 2 s, Mobile > 3 s, hoặc chậm hơn mốc "trước" quá ngưỡng nhiễu (200 ms)                                                                                   |
| Cache                            | Header `x-litespeed-cache`                                                                                | Không phải `hit`                                                                                                                                                                   |
| Ảnh màn hình đầu            | HTML guest (curl, UA mobile và desktop) và trình duyệt phiên mới                                      | `src` SVG giữ chỗ, ảnh hiện sau vài giây, ảnh nhỏ hơn khung hiển thị × DPR (mờ). Ảnh đã qua VPI vẫn có `data-vnx-lazy="1"`; đạt khi `src` là URL ảnh thật |
| Bố cục                         | Ảnh chụp sau tải (`assets/`), CLS của PSI và `summary.json`                                        | CLS > 0,25, mất style, chữ mất nền, vỡ khung                                                                                                                                      |
| Lỗi script                      | Console của phiên trình duyệt mới (chrome-devtools, isolated context)                                  | Lỗi mới so với trước tối ưu, menu hoặc nút không chạy                                                                                                                       |
| Bản sau khi trang tự tải lại | LiteSpeed Guest Mode tải lại trang ở lượt đầu; xem bản sau tải lại (bản khách thường)         | Mất thay đổi của plugin (preload, Critical CSS) hoặc khác giao diện bản guest                                                                                                  |
| Bên thứ ba                     | Request tới tên miền khác                                                                               | Script ngoài chặn hiển thị đáng kể                                                                                                                                              |

3. Đánh giá từng link theo tiêu chí ở phần Giải thích của file Word mẫu:

| Tiêu chí                | Đạt khi                                                                                            |
| ------------------------- | ---------------------------------------------------------------------------------------------------- |
| Tốc độ load            | Desktop ≤ 2 s, Mobile ≤ 3 s                                                                        |
| Cache                     | Có cache (header `x-litespeed-cache: hit` hoặc tương đương)                                 |
| Giật ảnh do tải chậm  | Ảnh màn hình đầu có `src` thật và hiện ngay khi tải, không chờ vài giây; CLS ≤ 0,25 |
| Load chậm do bên thứ 3 | Không ảnh hưởng hoặc ảnh hưởng không đáng kể                                             |

Kèm điều kiện: điểm PSI mobile và CLS không tệ hơn mốc "trước", và Site health không có lỗi.

4. **Cổng kết quả:**
   - Tệ hơn (trung vị điểm mobile hoặc CLS kém hơn mốc "trước" quá ngưỡng nhiễu, hoặc Site health có lỗi mới): báo người dùng, đề xuất `vnx_rollback_options` và `vnx_remove_row` cho dòng vừa thêm. Dry-run trước, chờ xác nhận. Rồi quay lại bước 2b mục 4.
   - Cần quay về cấu hình trước khi tối ưu (đã ghi nhiều lần, hoặc đã thay/gỡ dòng cũ): `vnx_rollback_options` chỉ khôi phục lần `vnx_set_options` gần nhất, nên khôi phục từ `cau-hinh-truoc-toi-uu.json`. Option đã đổi: `vnx_set_options` với giá trị trong file. Dòng đã sửa: ghi lại giá trị cũ bằng `id`. Dòng đã gỡ: thêm lại từ file (dòng nhận `id` mới). Dòng mới thêm: `vnx_remove_row`. Critical CSS đã thay hoặc gỡ: `vnx_save_critical_css` với nội dung trong file. Dry-run từng tool, chờ xác nhận, purge từng URL, đối chiếu `vnx_list_options` và `vnx_list_rows` với file, rồi đo lại.
   - Thông số đang tập trung vẫn chưa đạt, còn việc plugin làm được cho thông số đó: ghi dòng `proposed` mới, hỏi người dùng, quay lại bước 3 cho đúng link đó.
   - Chưa đạt, không còn việc plugin làm được: ghi KHÔNG ĐẠT kèm lý do, đưa việc còn lại vào file đề xuất bổ sung, sang nghiệm thu.
   - Đạt: các thông số chưa đạt ở mốc "trước" nay đã đạt, và thông số đã đạt không tụt xuống. Sang nghiệm thu.

**Nghiệm thu** là lần đo điểm cuối sau khi tối ưu đạt yêu cầu (hoặc plugin đã hết việc).

5. Đo điểm cuối: PSI mobile và desktop, tải thật, 3 lần lấy trung vị như **Đo nhiều lần**. Lần Double check cuối không có thay đổi nào sau đó thì dùng luôn trung vị của lần đó. Chụp pagespeed.web.dev và ảnh trang vào `assets/`.
6. Báo cáo kết quả:
   - Sửa đúng file `.md` của Phase 1, thêm mục **Kết quả sau tối ưu**: bảng trước và sau cho từng link (điểm tổng mobile, desktop và Load tải thật để kết luận; FCP, LCP, TBT, CLS, Speed Index, TTFB ghi làm dữ liệu kỹ thuật), "trước" là mốc ở bước 2b mục 3; kết quả Site health; dòng đã ghi là `applied`, dòng người dùng bỏ là `skipped`, dòng rollback ghi rõ.
   - Tạo `Báo cáo - Kết quả sau tối ưu - ten-mien.docx` từ cùng file mẫu, cùng cách sửa XML. Đổi tiêu đề thành `BÁO CÁO KẾT QUẢ SAU TỐI ƯU`, đổi `TỐI ƯU DỰ KIẾN` thành `ĐÃ TỐI ƯU`, điền số và ảnh sau tối ưu, chọn lại ĐẠT hoặc KHÔNG ĐẠT. Xem lại ảnh PSI sau khi cắt: phải thấy điểm và 5 metric.
   - Không lưu báo cáo lên site.
7. Rà căn cứ theo bảng ở mục **Đề xuất bổ sung** (ảnh, font, bên thứ ba, FCP/TTFB, cấu hình plugin, ô Network trong Word).
8. Có việc còn lại thì tạo `Đề xuất bổ sung - ten-mien.md` theo mục **Đề xuất bổ sung**: phần A người dùng tự làm, phần B AI làm khi được duyệt, phần C không đề xuất.

**AI kết thúc.** Trình tóm tắt cho người dùng: link nào đạt, link nào chưa đạt và lý do, việc còn lại nằm trong file đề xuất bổ sung. Nhắc: bước tiếp theo là người dùng đổi sang plugin lite (việc của người dùng, AI không làm).

### Đo khi chưa có MCP đúng miền

Dùng ở Phase 1 khi chưa cài plugin, chưa nối MCP, MCP tắt, hoặc MCP site khác. Không gọi tool `vnx_*` nào cho miền này, ngoài một lần `vnx_get_status` ở bước 0.

1. Số liệu PSI: ô API key ở mục 1 của `Do.md` đã có key thì gọi PageSpeed Insights API v5 theo mục **Đo PSI bằng API key**. Ô còn trống thì đọc trên pagespeed.web.dev. Lỗi thì chạy lại một lần, vẫn lỗi thì ghi `không đo được`, không bịa điểm.
2. Ảnh và link cho báo cáo Word: mở `https://pagespeed.web.dev/analysis?url=<URL>` một lần, tối đa 40 giây. Chưa hiện điểm thì ghi số API vào ô ảnh và giữ link. Không chụp lại.
3. Đo tải thật theo skill `measure-page-load`.
4. Không có mục Đề xuất từ `vnx_read_litespeed_conf`. Dòng plugin xử lý được ghi `cần plugin`.

### Thay ảnh ngoài plugin

Ngoại lệ của quy tắc "không lưu gì lên site ngoài plugin". Plugin và MCP không tải media, không sửa nội dung trang. Ảnh gốc quá nặng (audit `image-delivery-insight`, `total-byte-weight`) mặc định là việc người dùng tự làm, ở phần A của file đề xuất bổ sung.

**Điều kiện, đủ cả bốn mới làm:**

1. Người dùng yêu cầu rõ AI thay ảnh trên site. Yêu cầu nén ảnh chưa phải là yêu cầu thay ảnh trên site.
2. Có tài khoản wp-admin: người dùng tự đăng nhập trong trình duyệt agent điều khiển, hoặc ghi `WP_USER`, `WP_PASS` vào `audit-website/.env`. Nên dùng Application Password riêng. Không hỏi mật khẩu qua chat. Đọc `.env` bằng script tạm: không in giá trị, không đưa vào lệnh gọi tool, xóa script ngay sau khi dùng. Xong việc nhắc người dùng xóa hai dòng đó.
3. Chỉ trên link có cột **Tối ưu** là `có` ở mục 2 của `Do.md`.
4. Sao lưu nội dung trước mỗi lần sửa, và người dùng xác nhận trước mỗi lần lưu.

**Nén ảnh** (làm được kể cả khi không thay trên site):

1. Đo khung hiển thị thật của từng ảnh bằng trình duyệt: desktop 1350 px DPR 1, mobile 412 px DPR 1,75. Lấy cả thẻ `<img>` và ảnh nền CSS (`getComputedStyle(el).backgroundImage`).
2. Kích thước đích = bề rộng cần × DPR. Ảnh `object-fit: cover` hoặc `background-size: cover`: bề rộng cần = max(rộng khung, cao khung × tỷ lệ ảnh). Không phóng to quá ảnh gốc.
3. Tải ảnh gốc vào thư mục tạm riêng. Nén WebP chất lượng khoảng 80, bỏ metadata (`cwebp -q 80 -m 6 -metadata none -resize <rộng> 0`). Mở lại vài ảnh để xem chất lượng.
4. Lưu vào `anh-toi-uu/` của lần chạy, kèm `HUONG-DAN-THAY-ANH.md`: bảng file gốc → file mới (kích thước, dung lượng, khung hiển thị) và nơi ảnh được dùng trên trang.

**Thay trên site:**

1. Tải ảnh lên Media qua REST `POST /wp-json/wp/v2/media`, dùng phiên wp-admin và nonce lấy từ `admin-ajax.php?action=rest-nonce`. Ghi `id`, URL và các size WordPress sinh ra. Không xóa ảnh gốc.
2. Tìm mọi chỗ trang dùng ảnh gốc: phần tử ảnh, ảnh nền của khối bao, ảnh nền theo thiết bị, template hoặc khối dùng chung. Một ảnh có thể được dùng hai lần (thẻ `<img>` và ảnh nền CSS của khối bao). Khi đó gỡ ảnh nền trùng hoặc đổi cả hai.
3. Nội dung nằm trong template hoặc khối dùng chung: báo người dùng rằng trang khác dùng chung cũng đổi theo, trước khi lưu.
4. Sao lưu nội dung từng trang hoặc template vào `sao-luu-noi-dung/` của lần chạy.
5. Sửa và lưu bằng đường lưu của chính builder (bảng dưới). Không ghi thẳng vào database.
6. Mở lại trình dựng hoặc đọc lại nội dung, đối chiếu đúng thay đổi đã định.
7. Tạo lại CSS của builder nếu cần, rồi `litespeed_purge` từng URL. HTML guest mobile và desktop không còn tham chiếu file gốc, kể cả trong Critical CSS và CSS gộp.
8. Trang có Critical CSS: sinh lại, vì Critical CSS có thể chứa ảnh nền cũ. Kiểm tra mọi `url()` trong Critical CSS mới.
9. Đo lại 5 lần như **Đo nhiều lần**. Ghi mọi thao tác vào file `.md`: thao tác, trước và sau, `id`, kết quả kiểm tra.

| Builder                                          | Ảnh nằm ở                                                                                                     | Cách sửa và lưu                                                                                                                                                                                                                                                                                                                                                                                               |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Gutenberg, Classic editor                        | `post_content`: `<img src>`, class `wp-image-ID`                                                           | REST `/wp/v2/pages/{id}` hoặc `/posts/{id}` (`context=edit`), thay URL và ID trong `content.raw`                                                                                                                                                                                                                                                                                                        |
| Flatsome (UX Builder), WPBakery, Divi            | Shortcode trong `post_content`, ví dụ `[ux_image id="…"]`                                                 | Như trên, thay ID hoặc URL trong shortcode                                                                                                                                                                                                                                                                                                                                                                     |
| Bricks                                           | Meta nội dung Bricks. Trang có thể chỉ gồm phần tử Template, ảnh nằm trong template `bricks_template` | Trình dựng `?bricks=run`: sửa `$_state.content` (`settings.image.url`, `settings._background.image`), thêm `content` vào `$_state.unsavedChanges`, gọi `$_savePost()`. Ảnh dạng `external` (URL) thì giữ dạng đó                                                                                                                                                                     |
| Elementor                                        | Meta `_elementor_data`. Ảnh có thể ở template Theme Builder, Global Widget, logo trong Site Settings       | Trình dựng `post.php?post=ID&action=elementor`: `$e.run('document/elements/settings', …)` rồi `$e.run('document/save/publish')`. Widget Image cần đổi cả `id` và `url`. Ảnh nền gồm `background_image` và bản `_tablet`, `_mobile`. Sau khi lưu: **Elementor → Tools → Regenerate CSS & Data** nếu CSS in ra file. **Tools → Replace URL** chỉ đủ cho ảnh nền |
| Slider, ACF, widget, Customizer                  | Bảng hoặc option riêng của từng plugin                                                                      | Xem từng site. Không rõ cách lưu thì đưa vào phần A                                                                                                                                                                                                                                                                                                                                                     |
| Ảnh viết cứng trong file theme hoặc file CSS | File trên server                                                                                                | Ngoài phạm vi: phần A                                                                                                                                                                                                                                                                                                                                                                                          |

Lần đầu dùng một builder trên một site: thử đổi một phần tử và xem trước trong trình dựng, chưa lưu, để chắc lệnh đúng với phiên bản builder đó.

**Cách dự phòng không sửa nội dung trang:** thay file tại chỗ, giữ nguyên tên và đuôi (nén JPEG/PNG cùng tên), rồi tạo lại thumbnail. Cần quyền ghi file (FTP/SSH hoặc plugin thay file). Không đổi sang WebP được, trừ khi bật WebP của LiteSpeed.

**Gỡ:** ghi lại nội dung từ `sao-luu-noi-dung/` bằng cùng đường lưu, đối chiếu với bản sao lưu, purge, kiểm tra HTML đã về ảnh gốc. Ảnh mới giữ trong Media; chỉ xóa khi người dùng yêu cầu.

## Tool

Plugin có 16 tool. Cách từng tool chạy bên trong: `PLUGIN.md` mục 10.

Đọc, không ghi option:

| Tool                                 | Việc                                                                                                                                                                                                                                                                        | Tham số                                                                                     |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `vnx_get_status`                   | `site_url`, `home_url`, `version`, `plugin_active`, `mcp_enabled`, `litespeed_active`, `pagespeed_api_key_header` (`present`/`missing`), số dòng mỗi bảng                                                                                                        | không                                                                                       |
| `vnx_list_options`                 | Mọi option plugin. Không có token MCP hay API key                                                                                                                                                                                                                         | không                                                                                       |
| `vnx_list_actions`                 | Hook LiteSpeed plugin đã gắn. Chỉ để đọc                                                                                                                                                                                                                             | không                                                                                       |
| `vnx_read_litespeed_conf`          | Chín key LiteSpeed cho mục Đề xuất                                                                                                                                                                                                                                      | `keys` tùy chọn, mảng con của chín key                                                |
| `vnx_analyze_pagespeed`            | PageSpeed Insights mobile và desktop, bảng audit đã map sang phương án, dòng `vnx-lazy-hero`, `suggestions`, `quota`. Cần header API key                                                                                                                       | `url` hoặc `urls`                                                                       |
| `vnx_list_rows`                    | Dòng VPI, lazyload HTML, Critical CSS kèm `id`. Critical CSS có nội dung CSS và `duplicates` nếu còn dòng trùng                                                                                                                                              | `table` (`vpi`, `lazyload_html`, `critical_css`), `type`, `source_id` tùy chọn |
| `vnx_resolve_url`                  | `type`/`source_id` plugin dùng cho URL, `body_classes`, chuỗi dò, dòng đang khớp ở từng bảng                                                                                                                                                                   | `url` cùng host                                                                           |
| `vnx_test_selector`                | Trên HTML guest của thiết bị: `count` phần tử khớp, `hidden` phần tử bị CSS inline ẩn, `above_fold` (ước lượng theo cấu trúc HTML)                                                                                                                   | `url` cùng host, `device` (`mobile`, `desktop`), `selectors`                      |
| `vnx_critical_crawler`            | Bộ cào Critical CSS: `crawl_url` (tắt tối ưu Vietnix và cache 15 phút bằng token), viewport, UA, trường `save`, Critical CSS đang có, script. Cách dùng: mục **Sinh Critical CSS** ở bước 3                                                                         | `url` cùng host, `device`, `additional`, `exclude` tùy chọn                       |

Bốn tool nhận `url` ở trên (trừ `vnx_list_rows`) đưa URL vào danh sách purge của `litespeed_purge`.

Ghi. Luôn dry-run trước:

| Tool                       | Việc                                                      | Tham số                                                               |
| -------------------------- | ---------------------------------------------------------- | ---------------------------------------------------------------------- |
| `vnx_set_options`        | Ghi option qua đường Save hiện có                     | `options`, `dry_run`, `approve_core_keywords`                    |
| `vnx_save_critical_css`  | Lưu CSS đã có (sinh bằng `vnx_critical_crawler`). Trang đã có dòng thì cập nhật dòng đó | `css`, `mobile` (`"true"`/`"false"`), `type`, `source_id`, `craw_id`, `dry_run` |
| `vnx_save_vpi`           | Lưu dòng VPI                                             | `rows`, `dry_run`                                                  |
| `vnx_save_lazyload_html` | Lưu dòng lazyload HTML                                   | `rows`, `dry_run`                                                  |
| `vnx_remove_row`         | Xóa một dòng Critical CSS, VPI, hoặc lazyload HTML     | `table`, `id`, `type`, `source_id`, `dry_run`                |
| `litespeed_purge`        | Xóa cache một URL cùng host, có trong danh sách purge | `url`, `dry_run`                                                   |
| `vnx_rollback_options`   | Khôi phục các key của lần `vnx_set_options` gần nhất. Không khôi phục dòng VPI, lazyload HTML, Critical CSS | `dry_run`                                                            |

`dry_run` mặc định là `true`: thiếu field thì tool không ghi.

`vnx_set_options` nhận mảng `options`. Mỗi phần tử là `meta_key` và `meta_value`. Dry-run trả `diff` với `from` và `to` (giá trị sau khi chuẩn hóa), không ghi database. Gateway kiểm tra kiểu: công tắc chỉ nhận `"1"` hoặc `""`; `delay_js_list`, `style_by_keyword`, `style_by_script`, `delay_style_tags` phải là mảng chuỗi; `delay_js_time` là số nguyên từ 0 đến 10000. Sai thì trả `invalid_option_value`. `vpi_replace_size_desktop` và `vpi_replace_size_mobile` vẫn nhận mọi tên size. Key không có trong danh sách trả `option_not_allowed`; key LiteSpeed trả `litespeed_conf_forbidden`.

```json
{
  "dry_run": true,
  "options": [
    { "meta_key": "delay_js", "meta_value": "1" }
  ]
}
```

Công tắc bật là `"1"`, tắt là `""`. Giữ kiểu chuỗi đúng như `vnx_list_options` trả về.

`approve_core_keywords: true` là bắt buộc khi một keyword trong `delay_js_list` chứa `jquery` hoặc `wp-includes`, nếu không gateway trả `keyword_not_approved`. Không thêm hai keyword đó nếu người dùng chưa duyệt đúng keyword.

## Dòng VPI, lazyload HTML, Critical CSS

Cấu trúc `rows`, bảng `type`/`source_id`, cú pháp selector `{n}` và `(replace)`, quy tắc một dòng mỗi trang: xem mục 8 trong `audit-website/PLUGIN.md`. Dry-run của `vnx_save_vpi` và `vnx_save_lazyload_html` trả `action` cho từng dòng: `insert`, `update`, hoặc `skip` kèm `duplicate` (trang đã có dòng, có `existing_id`) , `duplicate_in_request` hay `empty_row` (dòng không có `mobile_data` lẫn `desktop_data`; `ignored_keys` liệt kê trường gửi sai tên). Dòng `skip` không được ghi: sửa dòng cũ bằng `id`. Sau khi ghi vẫn phải purge rồi mở HTML trang để xác nhận.

CSS rỗng trả `critical_css_empty`. `rows` rỗng trả `empty_options`. Delay combined và async combined (hoặc hai key `_client` của chúng) cùng bật sau lần ghi thì gateway trả `css_mode_conflict`, database không đổi. Khi đó dừng, không ghi bằng đường khác.

## Key option plugin

Danh sách key, kiểu giá trị, guest và client, cách từng option chạy: mục 1–7 trong `audit-website/PLUGIN.md`.

Option là toàn site. `active_all` khác `"1"` thì không tính năng nào chạy. Ảnh đã qua VPI vẫn mang `data-vnx-lazy="1"`. Delay CSS không có timer và cần Critical CSS cho trang. Mỗi `type` + `source_id` chỉ một dòng.

## Key LiteSpeed — chỉ đọc

`vnx_read_litespeed_conf` trả đúng chín key dưới đây. Ghi chúng vào mục Đề xuất, trạng thái `suggestion`. Không có tool ghi các key này.

| Key               | Thông số  | Đề xuất khi                                     |
| ----------------- | ----------- | -------------------------------------------------- |
| `optm-css_min`  | Minify CSS  | CSS chưa nén                                     |
| `optm-css_comb` | Combine CSS | Nhiều file CSS chặn render                       |
| `optm-ucss`     | UCSS        | CSS không dùng chiếm dung lượng lớn          |
| `optm-ccss`     | CCSS        | CSS chặn render và plugin chưa có Critical CSS |
| `optm-js_defer` | JS defer    | JS chặn render, TBT cao                           |
| `optm-js_delay` | JS delay    | JS không dùng hoặc bên thứ ba nặng           |
| `media-lazy`    | Lazyload    | Ảnh ngoài màn hình đầu                       |
| `guest_optm`    | Guest mode  | Điểm mobile thấp với khách ẩn danh           |
| `cache`         | Cache       | TTFB cao và cache đang tắt                      |

Ghi conf LiteSpeed trả `litespeed_conf_forbidden`.

## Action được gọi và action cấm

Được gọi: `litespeed_purge` với một `url` cùng host của page đang tối ưu. LiteSpeed tắt thì trả `litespeed_inactive`. Option plugin vẫn ghi được. Báo người dùng và bỏ bước purge.

Không gửi `purge_all`, `tag`, hay `post_type`. Purge all, URL rỗng, hoặc URL khác host trả `purge_all_forbidden`. URL cùng host nhưng không có trong danh sách purge trả `url_not_in_session`: gọi `vnx_resolve_url` cho URL đó trước. Danh sách lưu trên site (40 URL gần nhất), nên không mất khi khởi động lại agent. `vnx_remove_row` không đưa URL vào danh sách. Không có `litespeed_purge_all`.

`vnx_list_actions` chỉ liệt kê hook plugin đã gắn vào `litespeed_buffer_finalize` và `litespeed_optm_html_head`. Agent không gọi các hook này. Thứ tự hook ở mục 1 trong `PLUGIN.md`.

## Map audit sang key

Bảng map nằm trong skill `audit-website/audit-pagespeed`. `vnx_analyze_pagespeed` trả mỗi dòng đã map (`action`, `status`, `options`, `cause`). Đối chiếu với HTML thật trước khi đề xuất. Dòng `vnx-lazy-hero` đoán màn hình đầu theo cấu trúc HTML: xác nhận bằng ảnh chụp trang trước khi đưa vào báo cáo.

## Báo cáo

Ghi báo cáo ra `audit-website/reports/YYYY-MM-DD-ten-mien/YYYY-MM-DD-ten-mien.md`. Báo cáo chỉ nằm trong thư mục của lần chạy, không lưu lên site. Trên site chỉ ghi thao tác của plugin tối ưu qua MCP (option, Critical CSS, VPI, lazyload HTML, purge). Một miền một thư mục và một file trong ngày. Kiểm tra lại cùng ngày thì ghi thêm mục vào file đó, không tạo file thứ hai.

- Mỗi URL có điểm tổng hiệu suất mobile và desktop (dùng để kết luận), metric FCP, LCP, TBT, CLS, Speed Index, TTFB (dữ liệu cho bước tối ưu, không dùng để kết luận), bảng **Đánh giá thông số** (6 thông số, đạt hoặc chưa đạt, kết luận `Không cần tối ưu` hoặc `Cần tối ưu: <thông số>`), và bảng audit dưới 0,9 với các cột: mã audit, thông số, vấn đề, nguyên nhân, phương án, độ ưu tiên, trạng thái, tải thật.
- Độ ưu tiên: P1 chỉ số chính fail, P2 tiết kiệm trên 200 ms, P3 còn lại.
- **Dòng chú ý**: ngay dưới bảng điểm và metric của mỗi trang, thêm một dòng liệt kê các chỉ số không cần cải thiện.
  - PageSpeed: chỉ xét điểm tổng hiệu suất. Điểm mobile hoặc desktop ≥ 90 thì ghi là không cần cải thiện. Không liệt kê FCP, LCP, TBT, CLS, Speed Index, TTFB trong dòng này.
  - Tải thật không cần cải thiện khi: Load trong ngưỡng (Desktop ≤ 2 s, Mobile ≤ 3 s), cache `hit`, CLS ≤ 0,1.
  - Cách ghi: `> **Chú ý — chỉ số không cần cải thiện:** Điểm PageSpeed mobile 96, desktop 100. Tốc độ load thật (Desktop 0,32 s, Mobile 0,37 s), cache, CLS.` Chỉ số còn lại (cần cải thiện) không nhắc trong dòng này; chúng nằm ở bảng audit. Mọi chỉ số đều đạt: `Tất cả chỉ số đạt, không cần cải thiện.`
  - Ghi ở mọi bảng đo: hiện trạng, đo lại sau cài plugin, kết quả sau tối ưu.
- Bảng audit có thêm cột **Thông số**: thông số trong **Đánh giá trang** mà dòng đó ảnh hưởng. Dòng mới gắn với thông số chưa đạt có trạng thái `proposed`. Dòng gắn với thông số đã đạt ghi `theo dõi`. Việc plugin không xử lý được ghi `ngoài phạm vi`. Site chưa cài plugin: dòng plugin xử lý được ghi `cần plugin`, không áp được cho đến khi cài plugin và nối MCP.
- Mục Đề xuất LiteSpeed lập một lần cho cả site từ `vnx_read_litespeed_conf`, chỉ chín key ở bảng Key LiteSpeed. Mỗi dòng ghi hiện trạng, đề xuất bật, tắt hoặc giữ nguyên, lý do, trạng thái `suggestion`.
- Trường hợp 2, MCP đúng miền: bảng **Cấu hình đã có** (bước 2b mục 5) với các cột: mục (option hoặc bảng + `id` dòng), giá trị hiện tại, kiểm tra, kết luận `giữ`/`thay`/`gỡ`, lý do và bằng chứng, thông số liên quan. Dòng `proposed` có thêm cột **Thao tác**: `thêm`, `thay` hoặc `gỡ`, kèm giá trị cũ → mới.
- Sau khi thực thi: dòng đã ghi là `applied`, dòng người dùng bỏ là `skipped`. Giữ điểm và tải thật trước và sau. Ảnh sau tối ưu lưu vào `assets/` của cùng thư mục.

### Đề xuất bổ sung

Có việc còn lại sau báo cáo kết quả (dòng `ngoài phạm vi`, audit mới xuất hiện sau tối ưu, cải thiện thêm, việc trong admin) thì tạo `Đề xuất bổ sung - ten-mien.md` trong thư mục của lần chạy. Không có việc còn lại thì không tạo.

- Phần **A. Người dùng tự thực hiện**: việc vượt khả năng của AI qua MCP (sửa theme hoặc page builder, file ảnh, font, cấu hình LiteSpeed, thao tác admin, chụp DevTools, sửa code). Mỗi việc ghi: vấn đề, bằng chứng (số đo, file, selector), vì sao AI không làm, lợi ích ước tính, các bước làm cụ thể, cách kiểm tra, mức ưu tiên. Việc ảnh gốc quá nặng ghi thêm: AI nén sẵn được, và thay trên site được khi người dùng yêu cầu rõ (mục **Thay ảnh ngoài plugin**).
- Phần **B. AI làm được qua MCP nếu người dùng duyệt**: việc dùng được tool `vnx_*`. Ghi giá trị trước và sau, điều kiện cần (ví dụ `id` dòng VPI). Việc nào là cách thay thế cho một việc ở phần A thì ghi rõ chỉ chọn một.
- Phần **C. Không đề xuất**: thông số đã cân nhắc nhưng giữ nguyên, kèm lý do.
- Không hứa con số chắc chắn. Ghi ước tính và điều kiện.

Tìm căn cứ trước khi viết. Mỗi đề xuất phải có số đo hoặc file cụ thể, không ghi chung chung:

| Nhóm                       | Kiểm tra                                                                                                                                      | Cách lấy số                                                                                                                                                                          |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ảnh                        | Audit `image-delivery-insight`, ảnh tải bản lớn hơn khung hiển thị                                                                    | So `naturalWidth` với kích thước hiển thị × DPR. `curl -sI` dung lượng bản gốc và các bản `-1024x…`, `-768x…`. Xem class `size-full`/`size-large` của ảnh |
| Font                        | Font tải từ tên miền ngoài (`fonts.gstatic.com`), file `.ttf`/`.otf` thay vì WOFF2, `@font-face` trùng, thiếu `font-display` | `grep` `@font-face` và `url(…ttf                                                                                                                                                  |
| Script và CSS bên thứ ba | Request tới tên miền khác, `Network dependency tree`, `Forced reflow`, TBT                                                             | Danh sách request trong trình duyệt, audit PSI                                                                                                                                       |
| FCP, TTFB                   | FCP mobile > 1,8 s, TTFB > 0,8 s                                                                                                               | Số đo PSI và tải thật                                                                                                                                                              |
| Cấu hình plugin           | `active_all` còn `"1"`, dòng VPI/lazyload HTML/Critical CSS cũ trỏ vào phần tử không còn                                          | `vnx_list_options`, `vnx_list_rows`, rồi `vnx_test_selector` cho từng selector (`count: 0` là dòng cũ)                                                                     |
| Báo cáo Word              | Ô ảnh Network DevTools còn trống                                                                                                           | Luôn ghi thành một việc ở phần A                                                                                                                                                  |

Việc thuộc theme, page builder, file media, font, LiteSpeed, hosting, code tự viết, thao tác admin: phần A, kèm đường dẫn menu cụ thể (ví dụ **Bricks → Settings → Performance**). Việc làm được bằng tool `vnx_*`: phần B.

### Tải thật

Cursor và Claude Code đo thêm TTFB, DOMContentLoaded, Load, LCP theo skill `measure-page-load`, cả desktop và mobile. Mobile phải dùng UA mobile, vì plugin chọn bản HTML theo `wp_is_mobile()`. Claude trên web và Codex chỉ dùng điểm PageSpeed Insights.

PageSpeed có thể chấm điểm cao trong khi khách thật vẫn thấy chậm: Lighthouse kết thúc trước khi script lazyload nạp ảnh, nên LCP lấy chữ thay cho ảnh. Khi LCP tải thật lệch xa LCP của PSI, kiểm tra ảnh màn hình đầu có `data-vnx-lazy` và `src` là SVG giữ chỗ. Có thì ghi dòng audit P1 `lcp-lazy-loaded` và chụp bằng chứng vào `assets/` (xem skill `audit-pagespeed`).

### Báo cáo Word cho khách

Tạo từ `audit-website/Mẫu báo cáo - Hiện trạng website trước khi tối ưu.docx` bằng `fill-status-docx.py`, lưu vào thư mục của lần audit `audit-website/reports/YYYY-MM-DD-ten-mien/`:

| Lúc tạo    | Tên file                                                                 | Tiêu đề trong file                                                               |
| ------------ | ------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Sau bước 2 | `Báo cáo - Hiện trạng website trước khi tối ưu - ten-mien.docx` | Giữ `BÁO CÁO HIỆN TRẠNG WEBSITE TRƯỚC KHI TỐI ƯU`                        |
| Sau bước 4 | `Báo cáo - Kết quả sau tối ưu - ten-mien.docx`                    | Đổi thành `BÁO CÁO KẾT QUẢ SAU TỐI ƯU`, `TỐI ƯU DỰ KIẾN` thành `ĐÃ TỐI ƯU` (qua khóa `extra`). Điền số và ảnh sau tối ưu |

```bash
python3 audit-website/scripts/fill-status-docx.py "$SCRATCH/values.json" "audit-website/reports/<thư mục>/<tên file>.docx"
```

| Khóa trong `values.json` | Nội dung |
| --- | --- |
| `domain` | Tên miền, thay `[ten-mien.com]` |
| `summary` | Nhận xét chung (điểm, cache, đã hay chưa tối ưu) |
| `issue` | Vấn đề chính cần khắc phục |
| `extra` | Tùy chọn. Mảng cặp `[chữ cũ, chữ mới]`, mỗi chữ cũ phải xuất hiện đúng một lần trong mẫu. Dùng cho nội dung `TỐI ƯU DỰ KIẾN` và tiêu đề báo cáo kết quả |
| `pages` | Mảng, mỗi phần tử một bảng (một URL). Một trang thì có thể đặt các khóa dưới đây ở cấp ngoài |
| `pages[].page_name`, `page_url`, `psi_link` | Tên trang, URL, link kết quả pagespeed.web.dev |
| `pages[].load_desktop`, `load_mobile` | Mốc Load, ví dụ `0.32` (mẫu đã có chữ `s`) |
| `pages[].psi_mobile`, `psi_desktop` | Đường dẫn ảnh `.png` (tuyệt đối hoặc tương đối với `values.json`), hoặc một dòng chữ khi không chụp được |
| `pages[].ratings` | 4 cặp `[hiện trạng, đánh giá]` theo thứ tự Cache, Tốc độ load thực, Giật ảnh, Bên thứ 3. Hiện trạng phải là một lựa chọn của ô dropdown; đánh giá là `ĐẠT` hoặc `KHÔNG ĐẠT` |
| `pages[].note` | Tùy chọn. Dòng **Chú ý** dưới bảng của trang |

Script giữ ô `[Dán ảnh Network DevTools …]` cho người dùng tự dán, chép bảng mẫu cho từng trang, xóa dòng hướng dẫn tô vàng, và dừng với thông báo lỗi khi mẫu bị đổi cấu trúc.

- Mục **Điểm đo Google Pagespeed Insights**: link kết quả trên pagespeed.web.dev, ảnh chụp tab Mobile và tab Desktop. Chạy URL trên pagespeed.web.dev, chụp vùng điểm và metric (viewport 1350px), lưu `assets/psi-<trang>-mobile.png` và `assets/psi-<trang>-desktop.png`.
- Dưới bảng của mỗi trang: một dòng **Chú ý** liệt kê chỉ số không cần cải thiện, cùng nội dung với dòng chú ý trong báo cáo `.md`, viết bằng lời cho khách (không ghi mã audit). Điền bằng khóa `note` của trang trong JSON của `fill-status-docx.py`; script in `Chú ý: <note>` ngay dưới bảng.
- Mục **Tốc độ load**: chỉ ghi mốc Load của Desktop và Mobile. Người dùng tự chụp thanh `DOMContentLoaded / Load` trong tab Network của DevTools rồi dán vào. Agent không chụp được giao diện DevTools.
- Mục **Đánh giá**: chọn ĐẠT hoặc KHÔNG ĐẠT trong ô dropdown. Tiêu chí nằm ở phần Giải thích cuối file. Tốc độ load đạt khi Desktop ≤ 2s và Mobile ≤ 3s. "Giật ảnh do tải chậm" là "Giật nhiều", KHÔNG ĐẠT khi ảnh màn hình đầu chỉ hiện sau vài giây (`src` là SVG giữ chỗ, hoặc ảnh nền CSS/slider mà LCP tải thật trên 2 s desktop hay 3 s mobile), hoặc CLS (PSI hay tải thật, `cls` trong `summary.json`) trên 0,25. CLS 0,1 đến 0,25 là "Không đáng kể", ĐẠT. `src` thật không đủ để ghi "Không": phải xem cả CLS và LCP tải thật.

Script sửa file mẫu bằng XML (giải nén, sửa `word/document.xml`, nén lại) để giữ style và các ô dropdown; không dùng thư viện tạo docx khác vì sẽ mất dropdown. Ảnh trong cột "BÁO CÁO" rộng tối đa 3,9 inch. Mở file kết quả xem lại ảnh PSI: phải thấy điểm và 5 metric.
