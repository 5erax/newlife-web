# Hướng dẫn nhãn và quản lý backlog

GitHub Issues là trạng thái công việc chính. tasks/backlog-spec.json là bản định nghĩa lúc khởi tạo để đối chiếu, không tự cập nhật tiến độ và không thay cho Issues.

## Các nhóm nhãn

| Nhóm | Cách dùng |
| --- | --- |
| phase:* | Phase của task; dùng cùng milestone để lọc. |
| area:* | Hệ thống hoặc phạm vi chính. |
| type:* | Feature, content, docs, chore, test hoặc bug. |
| priority:* | P0: nền tảng, dữ liệu hoặc gate; P1: chức năng cần làm; P2: polish vẫn trong phạm vi. |
| kind:* | Task triển khai hoặc epic/gate/index. |
| status:* | Ready nếu không còn dependency mở; blocked nếu còn phụ thuộc. Cập nhật thủ công sau đóng issue. |

## Danh sách nhãn dự án

| Nhãn | Mô tả |
| --- | --- |
| phase:0-design | Phase 0 — Thiết kế và nền dự án |
| phase:1-engine | Phase 1 — Engine cuộc đời |
| phase:2-playable | Phase 2 — Bản chơi được đầu tiên |
| phase:3-systems | Phase 3 — Các hệ thống chức năng |
| phase:4-content | Phase 4 — Sản xuất và kiểm kê nội dung |
| phase:5-quality | Phase 5 — Cân bằng, offline và chất lượng |
| phase:6-release | Phase 6 — Hoàn thiện và phát hành cá nhân |
| area:decisions | Phạm vi chính: decisions |
| area:content | Phạm vi chính: content |
| area:tooling | Phạm vi chính: tooling |
| area:engine | Phạm vi chính: engine |
| area:persistence | Phạm vi chính: persistence |
| area:quality | Phạm vi chính: quality |
| area:ui | Phạm vi chính: ui |
| area:economy | Phạm vi chính: economy |
| area:education | Phạm vi chính: education |
| area:careers | Phạm vi chính: careers |
| area:assets | Phạm vi chính: assets |
| area:relationships | Phạm vi chính: relationships |
| area:stories | Phạm vi chính: stories |
| area:release | Phạm vi chính: release |
| area:docs | Phạm vi chính: docs |
| type:feature | Loại công việc: feature |
| type:content | Loại công việc: content |
| type:docs | Loại công việc: docs |
| type:chore | Loại công việc: chore |
| type:test | Loại công việc: test |
| type:bug | Loại công việc: bug |
| priority:P0 | Nền tảng, mất dữ liệu hoặc gate bắt buộc |
| priority:P1 | Chức năng/nội dung cần hoàn tất |
| priority:P2 | Polish trong phạm vi; không tự bỏ |
| kind:task | Một task có phạm vi và cách xác minh |
| kind:epic | Index hoặc gate phase; không thay task con |
| status:ready | Không còn dependency mở; cần cập nhật thủ công |
| status:blocked | Có dependency chưa đóng; không phải yêu cầu cấp quyền |

Các nhãn mặc định do GitHub tạo được giữ lại. Không gán assignee hoặc deadline khi chưa có người nhận việc và lịch thực tế.

## Quy trình hoàn tất task

1. Kiểm các dependency; chuyển status:ready khi không còn issue phụ thuộc mở.
2. Làm phạm vi và kiểm chứng acceptance criteria; dẫn PR/commit và bằng chứng.
3. Đóng task sau khi đạt, rồi rà các task bị chặn bởi nó.
4. Gate phase chỉ đóng sau task con và kiểm tra nghiệm thu phase.
5. Roadmap cuối chỉ đóng sau tất cả gate; số lượng file hoặc draft không thay bằng chứng.
