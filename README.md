# NewLife Web

Game mô phỏng cuộc đời bằng tiếng Việt. Có học/nghề, tiền/tài sản, hoạt động, bệnh, gia đình, thú cưng, tù, di chúc, nhiều đời và truyện. Giao diện ưu tiên điện thoại; tự lưu cục bộ và offline sau lần tải đủ đầu tiên.

Bản chơi web: https://newlife-5erax.dha260803.chatgpt.site. Site hiện có audience public theo trạng thái đọc ngày 13/10/2026; GitHub private và audience Site là hai cơ chế riêng.

Nội dung tự viết: 214 sự kiện thường/chuỗi + 144 tình huống nghề, 48 nghề/12 ngành, 10 chương trình học, 150 hoạt động, 24 tài sản, 42 thành tích, 3 huy chương, 10 danh hiệu và 5 truyện/60 node/15 kết thúc. [Manifest](src/content/manifest.json), [đồ thị](docs/content/graph.md). Chưa phục hồi đủ dataset Android; không xác nhận tái tạo mọi nội dung gốc.

Bản 1.1 thêm Danh vọng, Tình yêu, Tâm trí và thể chất, Salon và spa; 25 nhạc cụ, 6 môn võ; 34 sản phẩm đầu tư khởi đầu thuộc 5 nhóm, coin mới, biến động mạnh và rủi ro mất toàn bộ. Có casino, 20 chuỗi sự kiện, xuất thân/tiền địa phương, trợ cấp học phí và nhật ký giải thích thay đổi.

Bản 1.2 có bộ Việt hóa từ APK người dùng cung cấp: 1.074 tình huống/3.948 lựa chọn, danh mục 168 nghề, 28 chuyên ngành và 21 coin. Chọn bộ nội dung khi tạo đời mới; các đời cũ vẫn giữ bộ web. [Phạm vi và giới hạn chuyển đổi](docs/bitlife-apk-port.md) ghi rõ 180 dòng lõi và 48 bảng tình huống còn cần logic native. Chưa coi đây là BitLife 1:1 hoặc đủ toàn bộ nội dung gốc.

Bản 1.3 bổ sung đủ 124 dòng của ba bảng du lịch/cắm trại/leo núi: tổng 1.198 tình huống APK và 4.416 lựa chọn. Chọn người đồng hành khi Lên núi, Cắm trại, Đi nước ngoài hoặc Du lịch tàu biển; tình huống hiện trong chuyến đi và giữ nguyên qua tải lại. Còn 180 dòng lõi và 45 bảng khác chưa chuyển; một hiệu ứng nguồn lỗi định dạng được ghi trong coverage, dùng tác động trung tính có công bố.

Vercel: https://newlife-web-gray.vercel.app. Project đã kết nối GitHub; nhánh chính triển khai production, nhánh tính năng tạo preview. Bản lưu thuộc từng địa chỉ web: xuất JSON trên địa chỉ cũ rồi nhập tại địa chỉ mới.

Bản 1.4 bổ sung 29 tình huống bạn bè/91 lựa chọn: bảng bạn bè đã đủ 37 dòng/120 lựa chọn, tổng 1.227 tình huống APK/4.507 lựa chọn. NPC có học/việc, gia đình, tính bốc đồng và thù địch; xem trong Quan hệ, xây lại gắn bó để làm hòa. Tiến độ đầy đủ và trạng thái nghiệm thu nằm ở [task #114](https://github.com/5erax/newlife-web/issues/114); 151 dòng lõi và 45 bảng khác vẫn chưa chuyển.

Bản 1.5 đang nghiệm thu tại [task #116](https://github.com/5erax/newlife-web/issues/116): thêm phỏng vấn xin việc từ APK, đủ 46 câu hỏi/810 đáp án (796 thường + 14 mặc định), giữ điểm từ nguồn. Câu hỏi không vào pool tăng tuổi; file 1.4 nâng được và giữ bộ nội dung/RNG. Còn 151 dòng lõi và 44 bảng/2.073 dòng; tiến độ deployment thực tế ghi trong issue, không suy ra từ version trong mã.

Bản 1.6 bổ sung roulette 0–12 với luật màu/lãi ròng đã đọc từ ARM64 và đủ 107 cổ phiếu APK theo 8 ngành. Đời mới dùng bộ APK nhận danh mục mới; file cũ giữ giá/vị thế/RNG. Giá và biến động đầu tư vẫn là mô hình web, chưa đạt 1:1. Phạm vi còn lại và tiến độ nghiệm thu nằm ở [#118](https://github.com/5erax/newlife-web/issues/118); bằng chứng và giới hạn trong [tài liệu port](docs/bitlife-apk-port.md).

## Chạy trên máy

Node.js 24+, npm, dùng lockfile:

```sh
npm ci
npm run dev
```

Production/PWA:

```sh
npm run build
npm run preview -- --port 4173
```

Mở http://127.0.0.1:4173. PWA cần HTTPS hoặc localhost; file:// không phải cách cài game. Không cần backend/tài khoản game; login hosted chỉ bảo vệ truy cập Site.

## Kiểm tra

```sh
npm test
npm run build
npm run simulate -- 10000 --report
npm run content:graph
npx tsx src/tools/benchmark.ts
npm run test:e2e
```

E2E dùng Chrome đã cài trên Windows; CI cài Chromium của Playwright. Engine TypeScript thuần, RNG có seed, dữ liệu JSON, IndexedDB so revision trong transaction. File nhập tạo ô mới và không xoá ô cũ khi lỗi.

## Tài liệu

- [Chơi và sao lưu](docs/player-guide.md), [xử lý sự cố](docs/troubleshooting.md).
- [Contract](docs/engine-contract.md), [quyết định](docs/decisions.md), [viết nội dung](docs/content-authoring.md).
- [QA](docs/qa/verification.md), [phát hành](docs/release-v1.md), [changelog](CHANGELOG.md).
- [Đặc tả](docs/web-spec-supplement.md), [nghiên cứu APK](docs/apk-research.md), [index Issues](tasks/plan.md).

Code/nội dung web đã triển khai. Candidate giữ gate kiểm điện thoại vật lý, screen reader và hiệu năng điện thoại mở; không gọi là đã vượt mọi gate. GitHub Issues là nơi theo dõi task chính.

SVG/icon tự tạo; nội dung tự viết và bản dịch APK được đánh dấu nguồn riêng. Không đóng gói APK, binary trích xuất, quảng cáo/thanh toán/xếp hạng trực tuyến. [Sổ nguồn](docs/asset-sources.md) phân biệt dữ liệu chuyển đổi với tài nguyên tự tạo.
