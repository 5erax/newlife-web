# Viết nội dung

Nội dung tự viết có ID ổn định, `sourceKind: original_web`, chữ Việt và hậu quả thực sự. Nội dung chuyển từ APK nằm riêng trong content/apk với `sourceKind: apk_translation`; xem [quy tắc adapter](bitlife-apk-port.md). 150 sự kiện thường nằm ở events.json; 144 sự kiện nghề nằm riêng. Fallback, truyện, bậc nghề và biến thể chỉ số không cộng vào số 150/48.

Sự kiện cần tuổi, weight, once/cooldown/maxOccurrences, điều kiện, văn bản và ít nhất một lựa chọn không bị khoá. Mỗi lựa chọn có một hoặc nhiều outcome; tổng chance = 1 (sai số 10^-8). `nextEvent` nối cùng năm; `schedule` hẹn tương lai. Khi người thân/nghề không còn phù hợp, engine bỏ hẹn có giải thích, không áp dụng hiệu ứng lên đối tượng khác.

Hoạt động cần chi phí, timeCost ≥ 1, maxUsesPerYear, minAge, outcome và target khi thao tác trên người/thú/tài sản/bệnh. Engine kiểm category và instance của target; không chỉ khoá nút. Nghề có 3 bậc, specialty và yêu cầu đủ bằng; tình huống nghề thứ 2/3 chỉ mở ở bậc tương ứng.

Truyện 10–25 node có đích hợp lệ, ≥3 kết thúc và lối ra. Giữ văn bản/kết quả tách khỏi cuộc đời thường. SVG/icon tự tạo; bản dịch APK do người dùng yêu cầu có provenance riêng. Không thêm hình hoặc binary native.

Sau sửa: `npm run validate-content`, `npm test`, `npm run content:graph`, `npm run build`. Fixture trong catalog-flows thực thi mọi event choice/outcome và activity outcome; systems đi mọi ending. Thêm fixture mới nếu điều kiện/operation không có trạng thái mẫu. Đồ thị hỗ trợ phát hiện nhánh mất, không chứng minh mọi predicate tổng quát. Status verified trong manifest là bằng chứng schema/ref/fixture, không thay nghiệm thu thiết bị hay bằng chứng phục hồi nội dung gốc.
