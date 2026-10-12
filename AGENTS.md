# Hướng dẫn làm việc

- Đọc README, `tasks/plan.md` và issue được giao trước khi thay đổi.
- Theo dõi task bằng GitHub Issues. Không tạo `tasks/todo.md` trùng backlog.
- Phạm vi và thứ tự nằm trong issue; không tự đóng một hệ chức năng để giảm khối lượng.
- Kế hoạch ban đầu được giữ nguyên làm nguồn tham khảo. Đọc mục 13 của đặc tả bổ sung để biết các mâu thuẫn; resolve issue quyết định trước khi coi đề xuất là quy tắc đã chốt.
- Engine không import React, không dùng Math.random hoặc thời gian thực để quyết định game. RNG và kết quả đã bốc được lưu.
- Không ghi đè ô lưu cũ khi nhập/nâng cấp thất bại. Kiểm điều kiện ở engine, không chỉ trên nút UI.
- Không commit APK, binary trích xuất, token, secret hoặc tài nguyên chưa xác định quyền dùng.
- Làm từng lát cắt có thể kiểm tra; không thêm backend, xếp hạng mạng, quảng cáo, mua hàng hoặc tiếng Anh.
- Mỗi PR dẫn issue và ghi hành vi thay đổi, kiểm tra đã chạy, giới hạn còn lại. Đóng issue sau khi có bằng chứng đạt acceptance criteria.
- Sau khi dependency được đóng, rà issue phụ thuộc và cập nhật `status:blocked`/`status:ready`; các nhãn này không tự đồng bộ.
- Issue phase là gate nghiệm thu, không phải xác nhận đã viết đủ số file.
