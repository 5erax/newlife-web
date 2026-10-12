# NewLife Web

Kế hoạch remake game mô phỏng cuộc đời bằng tiếng Việt, ưu tiên điện thoại, chơi cá nhân và offline. Repository riêng tư này hiện chứa tài liệu và backlog; **chưa có ứng dụng chơi được**.

## Tài liệu

- [Kế hoạch ban đầu do người dùng cung cấp](docs/original-plan.txt).
- [Đặc tả bổ sung, mục 13–24](docs/web-spec-supplement.md).
- [Kết quả kiểm tra tĩnh APK](docs/apk-research.md).
- [Lộ trình, milestone và index issue](tasks/plan.md).
- [Cách dùng nhãn và cập nhật trạng thái backlog](docs/backlog-guide.md).

GitHub Issues là nơi theo dõi công việc chính. Tài liệu kế hoạch chỉ giữ index và các quyết định; không duy trì một checklist task thứ hai ngoài Issues.

## Phạm vi

- Cuộc đời từ 0 tuổi tới khi kết thúc; sự kiện có lựa chọn, bốn chỉ số và nhật ký.
- Học tập, nghề, tiền, tài sản, hoạt động, bệnh, quan hệ, gia đình, nhiều đời.
- Thành tích, huy chương, danh hiệu cuối đời, truyện có nhánh.
- Lưu cục bộ, xuất/nhập, chơi offline, hỗ trợ điện thoại.
- Nội dung bản web được tự thiết kế và có danh mục đối chiếu. Chưa có dataset để bảo đảm đủ mọi sự kiện gốc.

Không có backend game, xếp hạng mạng, quảng cáo, mua hàng hoặc bản dịch tiếng Anh trong phạm vi hiện tại. Giữ toàn bộ các hệ đã yêu cầu; các bản chơi thử nhỏ chỉ là mốc triển khai.

## Quy tắc triển khai

Engine TypeScript thuần tách khỏi React; nội dung là dữ liệu có ID; ngẫu nhiên có seed và trạng thái lưu; mọi thay đổi tiền hoặc lựa chọn chỉ được áp dụng một lần. Chuỗi sự kiện đang chờ phải khôi phục được sau khi tải lại.

Mỗi issue task có phạm vi, tiêu chí chấp nhận, cách xác minh, đường dẫn dự kiến và phụ thuộc. Issue phase là checkpoint: chỉ đóng khi các task của phase và kiểm tra nghiệm thu thực sự hoàn tất.

## Tài nguyên và quyền sử dụng

Không đưa APK, thư viện đã biên dịch, kho chuỗi trích xuất, token hoặc dữ liệu nghiên cứu thô vào Git. Tài nguyên chưa rõ quyền sử dụng được thay bằng nội dung/hình tự tạo cho tới khi có bằng chứng phù hợp. Các điểm mâu thuẫn của kế hoạch cũ được theo dõi bằng issue Phase 0; không xem riêng tư là bằng chứng quyền sử dụng.

## Trạng thái công nghệ

Hướng dự kiến: TypeScript strict, React, Vite, schema nội dung, IndexedDB, RNG có seed và kiểm thử mô phỏng. Chưa pin phiên bản thư viện hoặc đưa cấu hình ứng dụng vào repo; việc đó thuộc task bootstrap. Các lệnh được ghi trong issue là hợp đồng cần tạo, chưa phải lệnh đang chạy được tại thời điểm khởi tạo repo.
