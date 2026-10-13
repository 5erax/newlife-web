# Lộ trình triển khai NewLife Web

Ngày lập: 12/10/2026. Theo dõi task trong [GitHub Issues](https://github.com/5erax/newlife-web/issues). Không tạo tasks/todo.md hoặc checklist task thứ hai.

## Phạm vi và quyết định

Đọc [README](../README.md), [đặc tả bổ sung](../docs/web-spec-supplement.md) và [kết quả kiểm tra APK](../docs/apk-research.md). Mục 13 của đặc tả giải thích các mâu thuẫn chưa thể mặc định đã resolve. Phase 0 có issue xử lý từng quyết định/nguồn tài nguyên. Không khẳng định đủ dataset gốc.

## Cấu trúc backlog

Có 84 task triển khai, 7 gate phase và 1 roadmap. Mỗi task có mục tiêu, 3 tiêu chí chấp nhận, xác minh, dependency và đường dẫn dự kiến. Đây là kế hoạch, không phải trạng thái công việc đã làm. Không gán assignee hoặc deadline giả định.

Các nhãn: phase, area, type, priority, kind và status. P0 là nền tảng/mất dữ liệu/gate, P1 là chức năng cần làm, P2 là polish trong phạm vi. status:blocked/ready phản ánh dependency và phải cập nhật thủ công.

## Index

[Roadmap tổng](https://github.com/5erax/newlife-web/issues/1)

### Phase 0 — Thiết kế và nền dự án

[Gate #2](https://github.com/5erax/newlife-web/issues/2) · [Milestone](https://github.com/5erax/newlife-web/milestone/1)

- [#9 — P0-01: Hợp nhất phạm vi và các quyết định còn mâu thuẫn](https://github.com/5erax/newlife-web/issues/9)
- [#10 — P0-02: Lập sổ nguồn và quyền dùng tài nguyên](https://github.com/5erax/newlife-web/issues/10)
- [#11 — P0-03: Khởi tạo ứng dụng TypeScript, React và Vite](https://github.com/5erax/newlife-web/issues/11)
- [#12 — P0-04: Định nghĩa schema điều kiện, hiệu ứng và nội dung](https://github.com/5erax/newlife-web/issues/12)
- [#13 — P0-05: Chốt GameState và contract hành động một năm](https://github.com/5erax/newlife-web/issues/13)
- [#14 — P0-06: Tạo validator, manifest và báo cáo dữ liệu](https://github.com/5erax/newlife-web/issues/14)
- [#15 — P0-07: Thiết lập kiểm tra tự động cho PR](https://github.com/5erax/newlife-web/issues/15)

### Phase 1 — Engine cuộc đời

[Gate #3](https://github.com/5erax/newlife-web/issues/3) · [Milestone](https://github.com/5erax/newlife-web/milestone/2)

- [#16 — P1-01: RNG có seed và khôi phục chính xác](https://github.com/5erax/newlife-web/issues/16)
- [#17 — P1-02: Tạo nhân vật và gia đình ban đầu](https://github.com/5erax/newlife-web/issues/17)
- [#18 — P1-03: Đánh giá điều kiện và lựa chọn kết quả](https://github.com/5erax/newlife-web/issues/18)
- [#19 — P1-04: Áp dụng hậu quả nguyên khối và giới hạn dữ liệu](https://github.com/5erax/newlife-web/issues/19)
- [#20 — P1-05: Pool sự kiện, cooldown và lịch hẹn](https://github.com/5erax/newlife-web/issues/20)
- [#21 — P1-06: Reducer lựa chọn và chặn xử lý trùng](https://github.com/5erax/newlife-web/issues/21)
- [#22 — P1-07: Vòng năm, lão hoá và thứ tự mốc bắt buộc](https://github.com/5erax/newlife-web/issues/22)
- [#23 — P1-08: Tử vong nền và kết thúc trực tiếp](https://github.com/5erax/newlife-web/issues/23)
- [#24 — P1-09: Snapshot, phiên bản và nâng cấp file lưu](https://github.com/5erax/newlife-web/issues/24)
- [#25 — P1-10: Bot mô phỏng lõi và báo cáo seed lỗi](https://github.com/5erax/newlife-web/issues/25)

### Phase 2 — Bản chơi được đầu tiên

[Gate #4](https://github.com/5erax/newlife-web/issues/4) · [Milestone](https://github.com/5erax/newlife-web/milestone/3)

- [#26 — P2-01: Khung UI điện thoại và điều hướng](https://github.com/5erax/newlife-web/issues/26)
- [#27 — P2-02: Màn bắt đầu và tạo nhân vật](https://github.com/5erax/newlife-web/issues/27)
- [#28 — P2-03: Màn chính: tuổi, tiền, chỉ số và nhật ký](https://github.com/5erax/newlife-web/issues/28)
- [#29 — P2-04: Hộp thoại lựa chọn có thể khôi phục](https://github.com/5erax/newlife-web/issues/29)
- [#30 — P2-05: Tự lưu IndexedDB và cảnh báo chưa lưu](https://github.com/5erax/newlife-web/issues/30)
- [#31 — P2-06: Tổng kết đời và tạo đời độc lập mới](https://github.com/5erax/newlife-web/issues/31)
- [#32 — P2-07: Avatar SVG và tuỳ chọn hiển thị cơ bản](https://github.com/5erax/newlife-web/issues/32)
- [#33 — P2-08: Kiểm vòng đời đầu tiên từ UI tới snapshot](https://github.com/5erax/newlife-web/issues/33)

### Phase 3 — Các hệ thống chức năng

[Gate #5](https://github.com/5erax/newlife-web/issues/5) · [Milestone](https://github.com/5erax/newlife-web/milestone/4)

- [#34 — P3-01: Sổ thu chi năm và khoản nợ có định danh](https://github.com/5erax/newlife-web/issues/34)
- [#35 — P3-02: Học tập: ghi danh, điểm, học phí và tốt nghiệp](https://github.com/5erax/newlife-web/issues/35)
- [#36 — P3-03: Nghề toàn thời gian: tuyển, bậc, mất việc và hưu](https://github.com/5erax/newlife-web/issues/36)
- [#37 — P3-04: Làm thêm và dự án tự do theo điểm thời gian](https://github.com/5erax/newlife-web/issues/37)
- [#38 — P3-05: Sở hữu tài sản, thuê nhà và mua bán](https://github.com/5erax/newlife-web/issues/38)
- [#39 — P3-06: Định giá năm, đầu tư và phí duy trì](https://github.com/5erax/newlife-web/issues/39)
- [#40 — P3-07: Thú cưng là thực thể có tuổi và sức khoẻ](https://github.com/5erax/newlife-web/issues/40)
- [#41 — P3-08: Hoạt động: chi phí, ngân sách năm và đối tượng](https://github.com/5erax/newlife-web/issues/41)
- [#42 — P3-09: Bệnh, khám và điều trị có trạng thái](https://github.com/5erax/newlife-web/issues/42)
- [#43 — P3-10: Gia đình và bạn bè: tương tác theo đúng người](https://github.com/5erax/newlife-web/issues/43)
- [#44 — P3-11: Tình cảm, hôn nhân và ly hôn](https://github.com/5erax/newlife-web/issues/44)
- [#45 — P3-12: Sinh/nhận nuôi con và người phụ thuộc](https://github.com/5erax/newlife-web/issues/45)
- [#46 — P3-13: Rủi ro, tiền án và năm ngồi tù](https://github.com/5erax/newlife-web/issues/46)
- [#47 — P3-14: Di chúc và kết toán di sản một lần](https://github.com/5erax/newlife-web/issues/47)
- [#48 — P3-15: Tiếp tục cuộc đời làm người con](https://github.com/5erax/newlife-web/issues/48)
- [#49 — P3-16: Thành tích vĩnh viễn và bộ sưu tập toàn cục](https://github.com/5erax/newlife-web/issues/49)
- [#50 — P3-17: Huy chương và danh hiệu cuối đời](https://github.com/5erax/newlife-web/issues/50)
- [#51 — P3-18: Engine truyện có nhánh và trạng thái riêng](https://github.com/5erax/newlife-web/issues/51)
- [#52 — P3-19: UI truyện, chơi lại và bộ sưu tập kết thúc](https://github.com/5erax/newlife-web/issues/52)
- [#53 — P3-20: Nhiều ô lưu, bản trước và xuất file](https://github.com/5erax/newlife-web/issues/53)
- [#54 — P3-21: Nhập file an toàn và phục hồi migration lỗi](https://github.com/5erax/newlife-web/issues/54)
- [#55 — P3-22: Chống ghi đè từ hai tab bằng revision](https://github.com/5erax/newlife-web/issues/55)
- [#56 — P3-23: Cài đặt cá nhân và thông báo game](https://github.com/5erax/newlife-web/issues/56)

### Phase 4 — Sản xuất và kiểm kê nội dung

[Gate #6](https://github.com/5erax/newlife-web/issues/6) · [Milestone](https://github.com/5erax/newlife-web/milestone/5)

- [#57 — P4-01: Bộ tên, quê quán và gia đình hư cấu](https://github.com/5erax/newlife-web/issues/57)
- [#58 — P4-02: Hoàn thiện dữ liệu 10 chương trình và 48 nghề](https://github.com/5erax/newlife-web/issues/58)
- [#59 — P4-03: Viết 27 hoạt động thể chất, sức khoẻ và học tập](https://github.com/5erax/newlife-web/issues/59)
- [#60 — P4-04: Viết 27 hoạt động xã hội, gia đình và tình cảm](https://github.com/5erax/newlife-web/issues/60)
- [#61 — P4-05: Viết 27 hoạt động giải trí, du lịch và nhà cửa](https://github.com/5erax/newlife-web/issues/61)
- [#62 — P4-06: Viết 27 hoạt động tài chính, thú cưng và rủi ro](https://github.com/5erax/newlife-web/issues/62)
- [#63 — P4-07: Hoàn thiện 24 tài sản và hợp đồng thuê](https://github.com/5erax/newlife-web/issues/63)
- [#64 — P4-08: Viết 15 sự kiện tuổi 0–5](https://github.com/5erax/newlife-web/issues/64)
- [#65 — P4-09: Viết 40 sự kiện tuổi 6–17](https://github.com/5erax/newlife-web/issues/65)
- [#66 — P4-10: Viết 40 sự kiện tuổi 18–30](https://github.com/5erax/newlife-web/issues/66)
- [#67 — P4-11: Viết 35 sự kiện tuổi 31–59](https://github.com/5erax/newlife-web/issues/67)
- [#68 — P4-12: Viết 20 sự kiện tuổi 60+](https://github.com/5erax/newlife-web/issues/68)
- [#69 — P4-13: 40 thành tích, 10 danh hiệu và huy chương có nguồn](https://github.com/5erax/newlife-web/issues/69)
- [#70 — P4-14: Truyện 1: Chiếc đồng hồ ở chợ cũ](https://github.com/5erax/newlife-web/issues/70)
- [#71 — P4-15: Truyện 2: Khu vườn trên mái](https://github.com/5erax/newlife-web/issues/71)
- [#72 — P4-16: Truyện 3: Chuyến xe lúc nửa đêm](https://github.com/5erax/newlife-web/issues/72)
- [#73 — P4-17: Truyện 4: Tiệm thư chưa gửi](https://github.com/5erax/newlife-web/issues/73)
- [#74 — P4-18: Truyện 5: Đội hội làng bất đắc dĩ](https://github.com/5erax/newlife-web/issues/74)
- [#75 — P4-19: Sự kiện nghề riêng: y tế, giáo dục, công nghệ, kinh doanh](https://github.com/5erax/newlife-web/issues/75)
- [#76 — P4-20: Sự kiện nghề riêng: nghệ thuật, thể thao, pháp luật, nông nghiệp](https://github.com/5erax/newlife-web/issues/76)
- [#77 — P4-21: Sự kiện nghề riêng: xây dựng, dịch vụ, nhà nước, quân đội](https://github.com/5erax/newlife-web/issues/77)
- [#78 — P4-22: Graph nội dung và fixture cho các nhánh khó đạt](https://github.com/5erax/newlife-web/issues/78)
- [#79 — P4-23: Rà biên tập và đóng băng manifest nội dung v1](https://github.com/5erax/newlife-web/issues/79)

### Phase 5 — Cân bằng, offline và chất lượng

[Gate #7](https://github.com/5erax/newlife-web/issues/7) · [Milestone](https://github.com/5erax/newlife-web/milestone/6)

- [#80 — P5-01: Cân bằng tuổi thọ và chạy 10.000 đời đủ hệ](https://github.com/5erax/newlife-web/issues/80)
- [#81 — P5-02: Kiểm exploit tiền, lương, nợ và di sản](https://github.com/5erax/newlife-web/issues/81)
- [#82 — P5-03: Luồng đủ hệ, gia đình nhiều đời và mọi kết thúc truyện](https://github.com/5erax/newlife-web/issues/82)
- [#83 — P5-04: Rà khả năng tiếp cận và dữ liệu UI cực đoan](https://github.com/5erax/newlife-web/issues/83)
- [#84 — P5-05: Đo hiệu năng và tối ưu đường chơi năm](https://github.com/5erax/newlife-web/issues/84)
- [#85 — P5-06: PWA và tải đủ bộ nội dung offline](https://github.com/5erax/newlife-web/issues/85)
- [#86 — P5-07: Cập nhật cache và content version không mất ô lưu](https://github.com/5erax/newlife-web/issues/86)
- [#87 — P5-08: Kiểm phục hồi dữ liệu và sự cố lưu trữ](https://github.com/5erax/newlife-web/issues/87)
- [#88 — P5-09: Chơi thử thiết bị thật và sửa lỗi chặn chơi](https://github.com/5erax/newlife-web/issues/88)

### Phase 6 — Hoàn thiện và phát hành cá nhân

[Gate #8](https://github.com/5erax/newlife-web/issues/8) · [Milestone](https://github.com/5erax/newlife-web/milestone/7)

- [#89 — P6-01: Chọn và cấu hình nơi chạy cá nhân](https://github.com/5erax/newlife-web/issues/89)
- [#90 — P6-02: Đóng bản v1 có tag, changelog và artifact](https://github.com/5erax/newlife-web/issues/90)
- [#91 — P6-03: Hướng dẫn chơi, cài và sao lưu/phục hồi](https://github.com/5erax/newlife-web/issues/91)
- [#92 — P6-04: Nghiệm thu bản phát hành trên môi trường đã chọn](https://github.com/5erax/newlife-web/issues/92)

## Phụ thuộc và rủi ro

Dependency cụ thể nằm trong từng issue. Graph của backlog được kiểm không có chu trình trước khi tạo. Nội dung Phase 4 viết song song theo task; nghiệm thu đủ hệ trước cân bằng và phát hành.

Rủi ro lớn: chưa có dataset gốc; nhiều nội dung tự viết; sai tiền/lưu ở nhánh dài; offline thiếu gói tuổi; truy cập public ngoài dự kiến. Các task và gate có kiểm tra riêng cho mỗi rủi ro. Quyền tài nguyên và các quyết định chưa rõ được giữ ở Phase 0, không âm thầm bỏ qua.

## Mở rộng theo yêu cầu 13.1–13.13

[Gate #95](https://github.com/5erax/newlife-web/issues/95)

- [#96 — 13.1–13.2: Deltas engine, nhật ký có nguyên nhân và migration save](https://github.com/5erax/newlife-web/issues/96)
- [#97 — 13.1–13.2: Chip nhảy, bóng chỉ số, Năm nay và bộ lọc nhật ký](https://github.com/5erax/newlife-web/issues/97)
- [#98 — 13.3–13.4: Lão hoá và cân bằng bốn chỉ số](https://github.com/5erax/newlife-web/issues/98)
- [#99 — 13.5: Gia cảnh và trợ cấp học phí cha mẹ](https://github.com/5erax/newlife-web/issues/99)
- [#100 — 13.6–13.7: Xuất thân toàn cầu, tên theo giới, SVG và tiền địa phương](https://github.com/5erax/newlife-web/issues/100)
- [#101 — 13.8: Hiệu ứng sự kiện và hiệu chỉnh thống kê](https://github.com/5erax/newlife-web/issues/101)
- [#102 — 13.9: Hoạt động miễn phí, bậc giá và giảm hiệu quả lặp](https://github.com/5erax/newlife-web/issues/102)
- [#103 — 13.10: Casino seeded blackjack và ba cào](https://github.com/5erax/newlife-web/issues/103)
- [#104 — 13.11: Modifier, lịch chuỗi và 20 câu chuyện dài](https://github.com/5erax/newlife-web/issues/104)
- [#105 — 13.12: Weighted cases lồng nhau, pools và text variants](https://github.com/5erax/newlife-web/issues/105)
- [#106 — 13.12–13.13: Graph, branch coverage và mô phỏng 10k](https://github.com/5erax/newlife-web/issues/106)
- [#107 — 13.13: Nghiệm thu browser, hướng dẫn, PR và phát hành riêng tư](https://github.com/5erax/newlife-web/issues/107)

- [#108 — Hoạt động Danh vọng, Tình yêu, Tâm trí và thể chất, Salon và spa](https://github.com/5erax/newlife-web/issues/108)
- [#109 — Thị trường đầu tư đa dạng, crypto biến động và coin mới](https://github.com/5erax/newlife-web/issues/109)
