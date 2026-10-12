# Lộ trình triển khai NewLife Web

Ngày lập: 12/10/2026. Theo dõi task trong [GitHub Issues](https://github.com/5erax/newlife-web/issues). Không tạo tasks/todo.md hoặc checklist task thứ hai.

## Phạm vi và quyết định

Đọc [README](../README.md), [đặc tả bổ sung](../docs/web-spec-supplement.md) và [kết quả kiểm tra APK](../docs/apk-research.md). Mục 13 của đặc tả giải thích các mâu thuẫn chưa thể mặc định đã resolve. Phase 0 có issue xử lý từng quyết định/nguồn tài nguyên. Không khẳng định đủ dataset gốc.

## Cấu trúc backlog

Có 84 task triển khai, 7 gate phase và 1 roadmap. Mỗi task có mục tiêu, 3 tiêu chí chấp nhận, xác minh, dependency và đường dẫn dự kiến. Đây là kế hoạch, không phải trạng thái công việc đã làm. Không gán assignee hoặc deadline giả định.

Các nhãn: phase, area, type, priority, kind và status. P0 là nền tảng/mất dữ liệu/gate, P1 là chức năng cần làm, P2 là polish trong phạm vi. status:blocked/ready phản ánh dependency và phải cập nhật thủ công.

## Index

Các issue đang chờ tạo.
## Phụ thuộc và rủi ro

Dependency cụ thể nằm trong từng issue. Graph của backlog được kiểm không có chu trình trước khi tạo. Nội dung Phase 4 viết song song theo task; nghiệm thu đủ hệ trước cân bằng và phát hành.

Rủi ro lớn: chưa có dataset gốc; nhiều nội dung tự viết; sai tiền/lưu ở nhánh dài; offline thiếu gói tuổi; truy cập public ngoài dự kiến. Các task và gate có kiểm tra riêng cho mỗi rủi ro. Quyền tài nguyên và các quyết định chưa rõ được giữ ở Phase 0, không âm thầm bỏ qua.
