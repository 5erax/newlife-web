# Xử lý sự cố

Chưa lưu được: giữ tab, vào Ô lưu và xuất bản đang mở; file lấy từ bộ nhớ, gồm thao tác vừa làm. Giải phóng dung lượng/bật quyền lưu, đổi tên ô để thử lưu toàn bộ. Đừng reload/cập nhật/xoá khi chưa có bản sao.

Tab cũ chỉ đọc: tab khác đã cập nhật ô. Xuất tiến trình chưa lưu nếu muốn giữ, chọn Tải bản mới. Revision quyết định quyền ghi; timestamp chỉ để hiển thị. Di sản đã nhận ở ô khác bị chặn; bản cha/mẹ được giữ nguyên.

File nhập lỗi: giữ file gốc, không sửa version để ép nhập. Game kiểm schema/contentVersion/ID/ngày/tiền/di chúc/estate/pending trước ghi. Envelope 0 migrate trên bản sao, schema tương lai không tự đoán. Dùng bản export trước hoặc source đúng phiên bản để mở lại.

Không offline: tải lại cùng origin khi có mạng và chờ sẵn sàng. file://, chế độ riêng tư hoặc chính sách browser có thể chặn. Dọn cache không chủ động xoá IndexedDB; xoá toàn bộ dữ liệu trang qua browser có thể xoá cả hai.

Ô mất: kiểm browser/profile/origin; localhost và Site có kho riêng. Nhập bản JSON đã xuất. Persist không bảo đảm dữ liệu được giữ mãi; không có đồng bộ máy chủ. Rollback ứng dụng không khôi phục file người dùng đã xoá.
