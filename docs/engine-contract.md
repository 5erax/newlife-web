# Contract engine v1

`newLife(options, profile?)` tạo dữ liệu JSON độc lập; `reduce(state, action)` trả bản mới hoặc ném lỗi mà không đổi input. UI cấp life ID ngẫu nhiên, còn mô phỏng dùng identity theo seed để tái hiện. Đời con có identity phụ thuộc người con; receipt di sản dùng digest ổn định, không dài thêm qua thế hệ.

Ba trạng thái được lưu: `ready`, `awaiting_choice`, `dead`. `resolving_year` là phần thực thi đồng bộ bên trong reducer, không có cửa sổ nhập khác hoặc snapshot giữa bước này. `revision` tăng theo action; revision của ô lưu là số riêng dùng so sánh trong giao dịch IndexedDB. Đồng hồ chỉ dùng để sắp xếp/hiển thị ô lưu.

Tăng tuổi: tăng tuổi nhân vật/người thân → reset 12 điểm, giới hạn lượt và việc làm thêm → tuổi già/bệnh → lương, sinh hoạt, nợ, thị trường, tài sản → học → tù → lịch hẹn → 1–3 sự kiện thường. Mỗi lựa chọn tiêu một instance ID; kết quả có thể nối cùng năm hoặc hẹn năm sau. Điều kiện được xét lại trước nhánh hẹn, trường hợp không còn phù hợp ghi log thay thế rồi mở sự kiện hợp lệ. Tối đa 32 bước sự kiện một năm. Kết thúc sau lựa chọn cuối hoặc ngay khi hiệu ứng gây chết.

RNG uint32 nằm trong state. Engine không dùng thời gian, mạng, React hoặc Math.random. Xem lại menu, render hay truyện không tiêu RNG cuộc đời. Story lưu story/node/flags/turns/RNG riêng; giới hạn 64 lượt; chỉ collection ending và achievement được chuyển sang hồ sơ.

Tiền nguyên đơn vị đồng hư cấu, tối đa 10^15; net worth = tiền + tài sản sống − nợ. Trẻ chưa 18 không bị tính sinh hoạt người lớn. Nợ sinh hoạt/học phí dùng hạn mức tổng 30 triệu và có ledger riêng theo khoản phát sinh; không phải mô phỏng khoản vay thực tế. Phí mua 2%, bán 8%; giá chỉ đổi đầu năm. Thuê có cọc 2 triệu, sinh hoạt/thuê 36 triệu/năm, không tạo ownership. Nhà/xe có giá và tình trạng riêng, độ hao hụt thị trường đã nằm trong yearlyChange. Học bổng 50% xét lại khi nhập từng chương trình; không thu thêm phí vào năm tốt nghiệp.

Tài sản bản này đứng tên nhân vật. Không có ownership chung được ghi nhận, nên ly hôn giữ tài sản riêng, không tự lấy một phần tiền của người khác. Di sản: trừ nợ qua net worth, phí kết toán hư cấu 2%, phân chia theo tỉ lệ sống hoặc mặc định các con sống. Kết toán idempotent theo trạng thái đời, summary được thay theo life ID khi người chơi phục hồi một snapshot trước đó. Claim di sản được kiểm thêm trong giao dịch với hồ sơ toàn cục, tránh hai tab nhận lại.

Giới hạn chống dữ liệu quá lớn: 250 người trong đời, 200 tài sản sống/500 record, 20 bệnh, 10.000 log/ledger, 100 summary, 2.000 receipt. Nhập vượt hạn mức bị từ chối; không xoá dữ liệu đang có. Hồ sơ merge được validate trước commit. Không coi file JSON có thể chỉnh sửa là hệ chống gian lận trực tuyến.
