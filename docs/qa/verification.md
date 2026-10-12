# Xác minh candidate — 12/10/2026

App/content1.0.0, schema1. Những kết quả dưới đây là kiểm trên phần mềm và Windows/Chrome; không được diễn giải thành đã kiểm điện thoại vật lý hoặc phục hồi đủ nội dung Android.

| Kiểm tra | Kết quả |
| --- | --- |
| Tên/gia đình |Họ/tên đệm/tên,16quê cóID;10.000birthfixture kiểm tuổi/ID, phân bố anh chị em60–70% |
| TypeScript strict + production build | Đạt |
| Unit/schema/content/lifecycle/storage | 42 tests, 8 files, đạt |
| Browser E2E | 7 luồng, Chrome thật trên Windows, đạt |
| 150 thường +144 nghề +5fallback | 593 choice/outcome được ép seed đúng và thực thi; kiểm log đúng outcome, serialize/reload |
| Hoạt động |108 ID, mọi outcome/target được thực thi |
| Nghề/học/tài sản |48 nghề đủ điều kiện + bị chặn,10 chương trình tốt nghiệp,24 tài sản mua/bán/không bán thú đúng |
| Thành tích/danh hiệu/truyện |40 unlock +first life,10 title winners,5 truyện/60node/15ending có trace |
| Nhiều đời |Học→nghề→nhà→kết hôn→con→di chúc→di sản→3thế hệ; identity/receipt không trùng |
| Lưu lỗi |Restore trước chết, hai tab cùng/khác estate, global merge quá hạn, import lỗi, quota, rename unsaved có regression |
| Mobile emulation |320/390/768/1024/1440px, tên dài/ký tự HTML được escape,550log, dark22px, không tràn ngang |
| Offline |Worker active, tắt mạng/reload và mở/đi nhánh cả5truyện thành công |
| Review |Review độc lập chỉ đọc; sửa findings bằng regression. Mutation bỏ lọc role làm hỏng trace quan hệ hợp lệ; source khôi phục và suite đạt |

## Mô phỏng cuối

10.000 seed `(i*7919+42)>>>0`,4 chiến lược (thể chất/học/công việc+gia đình/rủi ro). Crash0, kẹt0; tuổi trung bình79.36, median82, chết trước20 là1.13%; chết trực tiếp do effect0. Báo cáo đầu khoảng696.44s trên máy hiện tại. ReportJSON ở simulation-10000.json.

Bot gặp159/294event,3 nghề và3 tài sản,2 fallback. Đây là độ phủ chiến lược bot, không phải xác nhận294event xuất hiện tự nhiên. Fixture riêng đi qua toàn bộ294event/choices/outcomes,48nghề,24tài sản. Các nhánh chuyển đời được kiểm riêng bằng lifecycle/storage; bot dừng ở tổng kết.

So baseline đầu: mean81.08 ngoài mục tiêu70–80; chỉnh mortality ở60+ và kiểm sức khoẻ0/50/100 hệ số2/1/0.5. Bản cân bằng cuối đạt mục tiêu; chưa dùng số này như mô hình tuổi thọ thực.

## Hiệu năng

Bundle khởi động: JS177.76KB gzip +workbox2.25KB +CSS6.49KB ≈186.5KB, dưới mục tiêu300KB. Tổng precache khoảng815KiB,11entry; toàn bộ JSON nội dung được bundle. Vite vẫn cảnh báo chunk minified>500KB; chưa tách vì số nén/đo hiện tại đạt, không ẩn cảnh báo.

Windows, Intel i5-12500H, Node24.19.0:300 lần xử lý năm với1.001log,102người,40tài sản; p50=0.1955ms,p95=0.4216ms,max=1.8973ms. Đo này trong Node, không thay phép đo tương tác trên điện thoại. Source benchmark có thể chạy lại.

## Truy cập và giới hạn nghiệm thu

Native get_site xác nhận current user owner, access custom chỉ owner, không group/external visitor. Save/deploy owner-private phải thành công trước coi URL là live; kết quả native/commit được ghi vào PR bàn giao.

Chưa kiểm: iOS/Android vật lý, đổi ứng dụng/khóa màn trên điện thoại, screen reader thực, hiệu năng máy tầm trung và vòng cập nhật giữa hai release thật. Giữ issue tương ứng mở. Không có dataset gốc để xác nhận parity100%; không gắnverified Android cho nội dung tự viết.
