# Triển khai cá nhân

Source GitHub private; Site dùng audience chủ sở hữu, không chọn public. Site ID trong .openai/hosting.json, static dist, không có backend game, connector hay secret runtime. URL: https://newlife-5erax.dha260803.chatgpt.site.

Localhost 127.0.0.1 không tự mở LAN. HTTPS hosted thuận tiện trên điện thoại, login Site bảo vệ truy cập mạng; repo private hoặc URL khó đoán không phải chứng cứ website private. Native owner-private deploy kiểm audience. Kết quả deploy thật được ghi trong QA.

Save và cache nằm trên máy đã tải. Người dùng browser/profile đó có thể đọc dữ liệu cục bộ; logout cổng hosted không được mô tả là xoá cache/save. Đổi origin dùng export/import để chuyển.

Artifact chứa hosting manifest và dist của đúng source SHA đã push tới Sites. Credential ngắn hạn không được lưu. Rollback qua version Sites đã lưu hoặc rebuild tag; xuất save trước thay contentVersion.
