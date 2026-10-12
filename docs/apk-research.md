# Kết quả kiểm tra NewLife trước khi làm phiên bản web

Ngày kiểm tra: 12/10/2026 (Asia/Saigon).

## Kết luận

Đã lấy được bản cài Android NewLife 2.0 để kiểm tra tĩnh. Chưa thu thập được toàn bộ nội dung game và chưa thể bảo đảm bản web không thiếu nội dung nào. Chưa triển khai bản web vì yêu cầu của người dùng là nghiên cứu toàn bộ nội dung trước.

APK là sản phẩm đã biên dịch, không phải kho mã nguồn có thể clone bằng Git. Không tìm thấy kho mã nguồn công khai trong các tìm kiếm theo tên game, nhà phát hành và package. Điều này không chứng minh mã nguồn không tồn tại.

## Bản cài đã kiểm tra

| Thuộc tính | Kết quả |
| --- | --- |
| Tên trên trang lưu trữ | NewLife - Game New Life Simulator |
| Nhà phát hành | Ylinkee Game |
| Package Android | `com.app_life_simulator` |
| Version name / code | `2.0` / `1040` |
| Kích thước | 31.420.365 byte |
| MD5 | `024b1786ba3f6a273bb2fb2fb808376a` |
| Đối chiếu tải xuống | MD5 khớp với metadata trên trang lưu trữ |
| Công nghệ tìm thấy | Flutter, thư viện ứng dụng đã biên dịch cho ba kiến trúc |

Nguồn bản cài: [Aptoide](https://new-life-ylinkee-game.vn.aptoide.com/app). Đối chiếu nhà phát hành với [Australian Classification](https://www.classification.gov.au/titles/newlife-game-new-life-simulator).

Đây là bản 2.0, không phải bản 2.0.0 / 1041 được liệt kê trên [APKPure](https://apkpure.net/vn/new-life-2021-simulator/com.app_life_simulator/versions). Chưa kiểm tra khác biệt giữa hai bản. Khớp MD5 chỉ xác nhận file khớp bản lưu trữ, không xác nhận tính an toàn hoặc chữ ký với bản chính thức.

## Dữ liệu đóng gói

- 1.079 mục trong APK; 159 mục thuộc thư mục tài nguyên Flutter.
- Có hình đại diện theo tuổi, biểu cảm, biểu tượng chức năng, hình giao diện, phông chữ và tài nguyên truyện.
- Có năm nhóm hình truyện mang tên tệp tương ứng với Bạch Tuyết, hoàng đạo, lâu đài, khủng long và toà thành. Tên tệp chỉ xác nhận tài nguyên; chưa xác nhận nội dung, nhánh và điều kiện của từng truyện.
- Các tệp dữ liệu có đuôi JSON/CSV/DB/SQLite tìm thấy trong danh mục APK: hai manifest, bản dịch tiếng Việt và bản dịch tiếng Anh.
- Bản dịch tiếng Việt có 126 khoá, tiếng Anh có 128 khoá. Đây là chuỗi giao diện và cấu hình, không phải danh mục đầy đủ các sự kiện.
- Kiểm tra danh mục tệp không loại trừ khả năng có dữ liệu nhúng trong mã đã biên dịch hoặc định dạng khác.

## Các phần tìm thấy trong ứng dụng

Các mục dưới đây có dấu vết trong tài nguyên, khoá giao diện hoặc đường dẫn tên tệp Dart lưu trong thư viện ứng dụng. Chưa chạy game để xác nhận hành vi.

| Phần | Bằng chứng | Còn thiếu để tái hiện đầy đủ |
| --- | --- | --- |
| Tạo nhân vật, cuộc đời mới | Trang bắt đầu, tạo nhân vật tuỳ chỉnh; các khoá tên, quê quán, giới tính, ngày sinh | Phân bố ngẫu nhiên, thuộc tính khởi tạo, gia đình |
| Tăng tuổi, nhật ký, lựa chọn | Trang chính, hộp thoại sự kiện, bộ xử lý sự kiện; chuỗi tuyến tăng tuổi và chọn đáp án | Toàn bộ sự kiện, điều kiện, xác suất, hậu quả, liên kết nhánh |
| Bốn chỉ số, số dư | Các khoá chỉ số, biểu tượng và thành phần hiển thị nhân vật | Công thức thay đổi và giới hạn |
| Học tập, công việc, quân đội, nghỉ hưu | Khoá giao diện và trang công việc | Danh mục, yêu cầu, lương, thăng chức và điều kiện tuổi |
| Hoạt động | Trang hoạt động, trang con, WebView và bộ xử lý mạng | Toàn bộ hoạt động, chi phí, tác động, điều kiện |
| Tài sản | Trang tài sản, tài sản đang sở hữu và trang con | Danh mục, giá mua/bán, chi phí duy trì và tác dụng |
| Quan hệ, gia đình | Trang quan hệ và các khoá giao diện | Nhân vật phụ, tương tác, tình cảm, hôn nhân, con cái và hậu quả |
| Truyện | Trang danh sách, chi tiết, gói mua truyện; mô hình phản hồi truyện | Nội dung từng truyện, tất cả lựa chọn, nhánh và kết thúc |
| Thành tích, huy chương | Trang thành tích, hộp thoại nhận huy chương | Danh mục đầy đủ và điều kiện |
| Kết thúc cuộc đời | Các trang kết thúc; khoá tuổi chết, nghề nghiệp, di chúc | Công thức tử vong, tổng kết, kết thúc đặc biệt |
| Xếp hạng | Trang, mô hình và bộ xử lý mạng xếp hạng | Công thức, phạm vi và dữ liệu dịch vụ |
| Cài đặt, ngôn ngữ, mua hàng | Khoá giao diện, trang đổi ngôn ngữ và bộ xử lý mua hàng | Hành vi lưu dữ liệu, quyền mở khoá và phục hồi |

Các con số 12 nhóm ngành, 48 công việc, hơn 100 hoạt động và 5 hình thức sống ẩu xuất hiện trong [mô tả cửa hàng](https://new-life-ylinkee-game.vn.aptoide.com/app). Đây là số liệu quảng bá; chưa phải kết quả kiểm đếm dữ liệu game.

## Bằng chứng phụ thuộc dịch vụ mạng

Thư viện ứng dụng chứa các tên tệp xử lý mạng cho hoạt động, sự kiện, truyện, xếp hạng và người dùng. Các chuỗi tuyến tìm thấy bao gồm:

- `/users/new-life`
- `/users/new-age`
- `/users/event/`
- `/event/make_choice/`
- `/users/activity/`
- `/get-story`
- `/get-medals/`
- `/get-top-users`

Đây là chuỗi trong binary, không phải tài liệu API hoặc xác nhận một API đang hoạt động. Chưa gọi các tuyến tạo nhân vật, thay đổi dữ liệu, mua hàng hoặc xác thực.

Cấu hình tiếng Việt trỏ tới `https://newlifegame.co`; binary còn chứa `https://en.newlifegame.co`.

Khi kiểm tra ngày 12/10/2026:

- Yêu cầu tới tên miền chính nhận HTTP 200 nhưng cuối cùng chuyển đến một tên miền khác có tiêu đề trang xổ số/cá cược. Đây không phải bằng chứng về dịch vụ game đang hoạt động.
- Tên miền tiếng Anh không phân giải DNS từ môi trường kiểm tra.
- Kiểm tra mục lục bản lưu API JSON trên Internet Archive bị trả HTTP 429. Chưa có bản lưu dữ liệu nội dung.

Vì vậy, không thể suy ra rằng tải được APK đồng nghĩa với có đủ các nội dung mà game từng lấy từ máy chủ.

## Dữ liệu cần để tiếp tục yêu cầu không thiếu nội dung

Cần ít nhất một nguồn đầy đủ, có thể đối chiếu:

1. Mã nguồn game kèm dữ liệu nội dung hoặc bản sao lưu backend/database.
2. Bản xuất dữ liệu chứa mọi sự kiện, lựa chọn, hậu quả, điều kiện, truyện, hoạt động, nghề nghiệp, tài sản và thành tích.
3. Một dịch vụ game còn hoạt động và cho phép truy cập, cùng khả năng kiểm kê được toàn bộ nội dung. Chơi thử nhiều lượt hoặc xem video riêng lẻ không chứng minh đã thu thập đủ.

Khi có nguồn phù hợp, bước tiếp theo là thống kê ID và số lượng từng nhóm; ghi lại quan hệ điều kiện/lựa chọn/hậu quả; lập bảng đối chiếu từng mục với phiên bản web; kiểm tra các nhánh và điều kiện mở khoá. Chỉ gọi bản web đầy đủ khi mọi mục có nguồn đối chiếu và không còn phần chưa kiểm chứng.

Tái hiện nguyên văn truyện, lời thoại và sử dụng tài nguyên gốc cần nguồn dữ liệu cùng quyền sử dụng phù hợp. Chưa xác minh quyền sử dụng trong nghiên cứu này.

## Giới hạn kiểm tra

Chưa cài hoặc chạy APK; chưa chơi xuyên các nhánh; chưa giải mã đầy đủ logic native; chưa truy cập dữ liệu backend; chưa kiểm kê đủ nội dung; chưa làm hoặc xuất bản web. Kết quả này là báo cáo kiểm tra tĩnh có bằng chứng, không phải bản sao đầy đủ của game.
