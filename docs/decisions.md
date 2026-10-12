# Quyết định triển khai — 12/10/2026

Áp dụng đặc tả bổ sung mục 13–24 cho bản web; kế hoạch gốc được giữ làm tham khảo.

- Nội dung tự viết và SVG tự tạo. Chưa có bộ nội dung gốc đầy đủ; không gắn nhãn đã phục hồi toàn bộ NewLife Android.
- Giữ tên NewLife trong bản cá nhân. Không đóng gói tài nguyên APK chưa xác định quyền dùng.
- Chỉ tiếng Việt. Engine TypeScript thuần, React/Vite cho UI. Dùng npm đang có trên máy thay vì thêm trình quản lý gói; lockfile pin các phiên bản.
- Thành tích toàn cục, huy chương theo đời và một danh hiệu cuối đời là ba hệ riêng.
- Sức khoẻ 0/50/100 có hệ số tử vong nền 2/1/0,5. Sự kiện gây chết kết thúc trực tiếp.
- Ngẫu nhiên được lưu bằng state; lựa chọn chỉ áp dụng một lần. Mọi thay đổi được validate trên bản sao trước khi nhận.
- Đời độc lập bắt đầu ở tuổi 0. Tiếp tục làm con dùng tuổi/quan hệ đã biết và chỉ nhận di sản một lần.
- Chơi offline sau khi bộ ứng dụng đã tải đủ. Tự lưu trên trình duyệt không thay cho bản sao JSON xuất ra thiết bị.
- Không thêm backend game, quảng cáo, thanh toán, xếp hạng trực tuyến hoặc tự đổi audience public.
