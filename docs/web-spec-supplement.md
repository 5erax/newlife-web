# Kế hoạch remake NewLife bản web — phần viết tiếp

Ngày viết: 12/10/2026. Nối tiếp mục 1–12 trong bản kế hoạch bạn gửi.

**Trạng thái:** đặc tả đề xuất để chuẩn bị triển khai; chưa phải chức năng đã làm hoặc nội dung gốc đã thu thập. Các danh mục, công thức và tình huống dưới đây được thiết kế mới cho bản web. Chúng không xác nhận số lượng hoặc cơ chế thực tế của NewLife hay BitLife.

Phần này dùng các lựa chọn ghi tại mục 11.3 làm cơ sở: 150 sự kiện cho bản đầu, tiếng Việt, chơi cá nhân, giữ các hệ quan hệ và hoạt động rủi ro, không đồng bộ qua máy chủ, hình đại diện SVG đơn giản. Những chỗ bản kế hoạch mâu thuẫn được ghi riêng tại mục 13; không tự xem chúng là quyết định đã được bạn chốt.

## 13. Làm rõ các điểm mâu thuẫn trước khi triển khai

### 13.1. Thế nào là “đầy đủ”

Cần phân biệt ba mức:

| Mức | Ý nghĩa | Có thể kiểm chứng hiện tại? |
| --- | --- | --- |
| Đủ nhóm chức năng | Có các hệ cuộc đời, học tập, nghề, tiền, tài sản, hoạt động, quan hệ, thành tích, truyện, kết thúc | Có thể đối chiếu với danh mục dấu vết từ APK |
| Đủ nội dung của bản web | Tất cả mục đã ghi trong danh mục bản web đều có dữ liệu và hành vi chạy được | Có thể kiểm bằng manifest nội dung và kiểm thử khi triển khai |
| Đủ mọi nội dung gốc | Không thiếu bất kỳ sự kiện, lựa chọn, hậu quả hoặc truyện của NewLife | Chưa kiểm được vì chưa có nguồn dữ liệu đầy đủ |

Mốc nghiệm thu đề xuất là hai mức đầu. Yêu cầu mức thứ ba vẫn được ghi nhận là chưa đáp ứng; không đổi tên phần tự sáng tác thành “nội dung gốc phục hồi”. Nếu sau này có dữ liệu gốc phù hợp, phải lập bảng đối chiếu riêng.

### 13.2. Các đề xuất hiệu chỉnh

| Vị trí trong bản trước | Điểm cần làm rõ | Đề xuất cho bản tiếp theo |
| --- | --- | --- |
| 1.1, 1.2, 2.3, 7, 8.6, 11.2 | Có đoạn yêu cầu dùng lại tài nguyên APK, có đoạn yêu cầu tự tạo | Ghi trạng thái quyền sử dụng cho từng tài nguyên. Khi chưa rõ, dùng SVG và văn bản tự tạo để triển khai; không mặc định mọi tài nguyên APK đều được dùng |
| 2.3 | Kiểm tra tĩnh bị diễn đạt thành khẳng định mọi nội dung nằm trên máy chủ | Chỉ khẳng định đã thấy bộ xử lý mạng, chưa lấy được dataset đầy đủ; chưa loại trừ dữ liệu nhúng trong binary |
| 3.1, 6.10, 10.6 so với 11.3 | Có kế hoạch tiếng Anh nhưng quyết định cuối ghi chỉ tiếng Việt | Bản đầu chỉ có `vi.json`; không làm bản dịch hoặc bộ chọn ngôn ngữ |
| 4.3 | “Tập” cờ và thành tích không có dạng JSON rõ ràng | Lưu thành mảng ID duy nhất; chỉ chuyển thành Set trong lúc tính toán nếu cần |
| 5.4 | Với công thức hiện tại, sức khoẻ 100 làm hệ số tử vong bằng 0 | Thay bằng công thức tại 14.5, có hệ số 0,5 khi sức khoẻ 100 |
| 6.7 và 12.4 | Nhiều thành tích vĩnh viễn bị trộn với một danh hiệu cuối đời | Tách thành tích, huy chương và danh hiệu cuối đời tại mục 19 |
| 6.9 | Thừa kế qua đời kế tiếp chưa có quy tắc chọn người nhận | Bổ sung hai kiểu bắt đầu đời mới, chỉ chuyển tiền khi tiếp tục làm một người con hợp lệ |
| 9.3 | Dòng “lặp quá 2 lần: Có” không phải ngưỡng kiểm được | Sự kiện thường mặc định tối đa 2 lần/đời; sự kiện lặp định kỳ phải khai báo ngoại lệ |
| 11.4 | Vẫn yêu cầu trả lời các câu hỏi đã đánh dấu hoàn tất | Thay bước tiếp theo bằng rà mục 13, rồi dựng lát cắt chức năng ở mục 23 |

Không suy ra NewLife và BitLife có cùng dataset. Mục 12 chỉ là tài liệu tham khảo về cách tổ chức một game cùng thể loại.

### 13.3. Nguyên tắc ghi nguồn nội dung

Mỗi mục nội dung có `sourceKind`: `original_web`, `apk_observation`, `public_reference` hoặc `provided_dataset`. Danh mục triển khai phải phân biệt quan sát từ APK với nội dung tự thiết kế.

Tài nguyên hình/phông có sổ theo dõi: tên tệp, nguồn, giấy phép hoặc bằng chứng cho phép sử dụng, yêu cầu ghi công, trạng thái được phép đóng gói. Bản chơi cá nhân không được dùng làm bằng chứng tự động về quyền sử dụng. Tài liệu này chưa đưa ra kết luận pháp lý về tên game hoặc tài nguyên gốc.

## 14. Đặc tả một năm chơi và các trạng thái chờ

### 14.1. Trạng thái tối thiểu

Ngoài Character ở mục 4.3, GameState cần những trường sau:

| Trường | Mục đích |
| --- | --- |
| `schemaVersion` | Phiên bản cấu trúc file lưu |
| `contentVersion` | Phiên bản bộ nội dung dùng cho đời này |
| `lifeId` | ID duy nhất của cuộc đời; không lấy tên nhân vật làm ID |
| `revision` | Số lần thay đổi trạng thái thành công; phát hiện ghi đè từ tab cũ |
| `phase` | `ready`, `resolving_year`, `awaiting_choice`, `dead` |
| `rngState` | Trạng thái hiện tại của RNG; lưu cùng mọi kết quả đã bốc |
| `pendingEvent` | Sự kiện đang chờ, ID phiên xuất hiện và các lựa chọn hợp lệ |
| `yearQueue` | Danh sách mốc bắt buộc, sự kiện thường và nhánh sẽ xử lý |
| `scheduledEvents` | Sự kiện hẹn năm sau; có năm đến hạn và đối tượng liên quan |
| `activityUses` | Số lần làm từng hoạt động trong năm hiện tại |
| `activityBudget` | Điểm thời gian còn lại trong năm |
| `annualLedger` | Thu nhập, chi phí, thuế hư cấu và thay đổi tài sản của năm |
| `educationProgress` | Chương trình đang học, năm đã hoàn thành, điểm và trạng thái đóng học phí |
| `prisonState` | Án còn lại, thời điểm bắt đầu; rỗng nếu không ngồi tù |
| `storyState` | Truyện đang chơi, nút hiện tại, cờ và tiến độ riêng |

Thành tích toàn bộ các đời và cài đặt nằm trong hồ sơ cục bộ, không nằm duy nhất trong Character. Các trường ngày giờ thực tế chỉ dùng cho giao diện hoặc bản lưu; không tham gia kết quả mô phỏng.

### 14.2. Quy trình tăng tuổi

1. Chỉ nhận `ageUp` ở pha `ready`, khi nhân vật còn sống. Chặn tăng tuổi khi đang chờ lựa chọn hoặc đang lưu hành động trước.
2. Tăng tuổi đúng một lần; đặt lại giới hạn hoạt động và tạo sổ thu chi mới.
3. Cập nhật tuổi người thân, tiến độ học và nghề; tính lương, chi phí và lão hoá. Một bước năm không được chạy hai lần sau khi tải lại.
4. Đưa mốc bắt buộc và sự kiện đến hạn vào hàng đợi. Chọn sự kiện ngẫu nhiên từng cái theo trạng thái hiện tại, thay vì bốc sẵn tất cả trước khi hậu quả đầu tiên xảy ra.
5. Xử lý từng sự kiện. Khi cần lựa chọn, lưu pha `awaiting_choice` và chờ. Sau lựa chọn, kiểm tra điều kiện còn hợp lệ của phần còn lại trong hàng đợi.
6. Nếu sự kiện gây chết trực tiếp, kết thúc ngay. Nếu vẫn sống sau mọi sự kiện của năm, bốc tử vong nền đúng một lần.
7. Kiểm tra thành tích, đóng sổ năm, lưu trạng thái. Nếu còn sống, trở về `ready`.

Năm sinh ở tuổi 0 có phần khởi tạo riêng. Xác suất tử vong tuổi 0, nếu giữ, được bốc tại bước khởi tạo đó, không chờ tới lần tăng lên tuổi 1.

### 14.3. Chọn đáp án và chống nhận hai lần

Mỗi lần xuất hiện sự kiện có `instanceId` riêng, kể cả khi dùng cùng event ID. `chooseOption` phải kiểm tra instance đang chờ, lựa chọn tồn tại, điều kiện của lựa chọn và revision hiện tại.

Hành động thành công là một thay đổi nguyên khối: bốc kết quả, cập nhật RNG, trừ/nhận tiền, thay đổi chỉ số, ghi nhật ký, xoá lựa chọn đang chờ và lập nhánh tiếp theo. Nhấn hai lần hoặc gửi lại instance đã xử lý không được nhận tiền, mất máu hoặc mở nhánh lần nữa.

Kết quả không được bốc lại khi tải trang, mở màn tài sản hoặc xem lịch sử. Giao diện hiển thị kết quả đã ghi, không tự sinh kết quả mới.

### 14.4. Nhánh nối ngay và nhánh ở năm sau

- `nextEvent` trong schema cũ có nghĩa là nối ngay trong cùng năm.
- Muốn hẹn tương lai, dùng `scheduleEvent` với `eventId`, `afterYears` và ID đối tượng liên quan. Không ngầm dùng cooldown thay cho lịch hẹn.
- Sự kiện của nhánh không được đồng thời xuất hiện trong pool ngẫu nhiên nếu chưa đến lượt.
- Khi một nhánh không còn hợp lệ vì nhân vật chết, chia tay hoặc đổi nghề, dùng kết thúc thay thế được khai báo. Không tự bỏ nhánh mà không có nhật ký.
- Giới hạn an toàn đề xuất: 32 nút nối ngay cho một chuỗi. Vượt giới hạn là lỗi nội dung; lưu snapshot để kiểm tra, không tự tăng tuổi hoặc tự chọn hộ người chơi.
- Quy tắc hoàn thành truyện: mọi tuyến không lặp phải tới một kết thúc; tuyến có vòng lặp phải có điều kiện thoát hoặc giới hạn lượt rõ ràng.

### 14.5. Hiệu chỉnh tử vong

Công thức đề xuất thay cho 5.4:

```text
healthFactor = 2 ^ ((50 - health) / 50)
annualDeathChance = min(1, ageBaseChance × healthFactor)
```

| Sức khoẻ | Hệ số so với xác suất nền |
| --- | --- |
| 0 | 2 |
| 50 | 1 |
| 100 | 0,5 |

Các xác suất nền của bảng 5.4 vẫn chỉ là tham số thử nghiệm. Chưa khẳng định công thức này đạt tuổi thọ trung bình 70–80. Phải mô phỏng rồi cân bằng.

Sức khoẻ 0 không tự động làm chết ở mọi thao tác; nó áp dụng hệ số trên và có thể kích hoạt tình huống bệnh. Tử vong trực tiếp chỉ đến từ kết quả khai báo rõ. Khi nhân vật đã chết, dừng mọi thu nhập, tương tác và nhánh chưa giải quyết.

## 15. Học tập, nghề nghiệp và tiến trình mở khoá

Các độ tuổi, học phí, bằng cấp và lương dưới đây là quy tắc hư cấu trong game, không mô tả quy định hoặc mức thu nhập thực tế ở Việt Nam.

### 15.1. Danh mục chương trình học

| ID | Chương trình | Thời lượng | Mở cơ hội |
| --- | --- | --- | --- |
| `edu_primary` | Tiểu học | 5 năm, từ tuổi 6 | Bạn học, điểm, thói quen học |
| `edu_lower_secondary` | THCS | 4 năm, từ tuổi 11 | Câu lạc bộ, kỹ năng, bạn bè |
| `edu_upper_secondary` | THPT | 3 năm, từ tuổi 15 | Thi tốt nghiệp, chọn hướng sau phổ thông |
| `edu_vocational` | Học nghề | 2 năm sau THCS/THPT | Kỹ thuật, xây dựng, dịch vụ |
| `edu_college` | Cao đẳng | 3 năm sau THPT | Nghề chuyên môn cấp đầu |
| `edu_university` | Đại học | 4 năm sau THPT | Nghề theo chuyên ngành |
| `edu_medical` | Chương trình y khoa | 6 năm sau THPT | Nghề bác sĩ trong game |
| `edu_postgraduate` | Sau đại học | 2 năm sau đại học | Nghiên cứu, bậc nghề chuyên sâu |
| `edu_return_school` | Hoàn thành phổ thông muộn | Theo cấp còn thiếu | Người bỏ học quay lại học |
| `edu_short_course` | Khoá ngắn hạn | Không chiếm chương trình chính | Kỹ năng phụ, chuyển nghề |

Chuyên ngành đề xuất: công nghệ, kinh tế, sư phạm, y tế, luật, nghệ thuật, thể thao, nông nghiệp, xây dựng và quản trị công. Một khoá ngắn hạn không thay bằng đại học trong điều kiện nghề.

Mầm non là mốc tuổi, không cần quản lý điểm hoặc học phí như chương trình chính. Nhân vật chỉ có một chương trình chính đang học; khoá ngắn hạn có thể chạy song song.

### 15.2. Điểm, học phí và học bổng

Điểm học dùng thang 0–100 để tránh lẫn với chỉ số trí tuệ hoặc GPA hệ 4. Đổi tên trường `gpa` thành `schoolScore` trong mô hình mới, hoặc ghi rõ phép chuyển đổi khi nâng cấp file lưu.

Điểm năm được tính từ trí tuệ, lựa chọn học, số hoạt động học và biến cố. Chưa chốt trọng số trước mô phỏng. Tốt nghiệp dựa trên số năm hoàn thành và điểm tối thiểu, không chỉ dựa vào tuổi.

Học phí được thu khi nhập học và đầu mỗi năm còn theo học. Thu một lần cho đúng chương trình/năm; có học bổng thì giảm trước khi ghi khoản chi. Không đủ tiền dẫn tới lựa chọn xin hỗ trợ, nghỉ học một năm hoặc vay trong giới hạn đã khai báo.

Vay học phí tạo khoản nợ có số dư và lịch trả riêng; không chỉ làm `money` âm mà không biết nguyên nhân. Học lại không xoá bằng đã đạt hoặc biến trí tuệ về số ban đầu.

### 15.3. Khung 48 nghề độc lập

Mỗi tên trong cột “Nghề” là một job ID độc lập; các bậc thăng tiến trong nghề không được đếm thành nghề mới. Dải lương là lương tháng khởi điểm đề xuất, đơn vị triệu đồng trong game; engine nhân 12 để tính lương năm.

| Ngành / tiền tố ID | 4 nghề | Yêu cầu điển hình | Lương tháng thử nghiệm |
| --- | --- | --- | --- |
| Y tế / `job_yte` | Điều dưỡng; bác sĩ; dược sĩ; kỹ thuật viên xét nghiệm | Bằng chuyên ngành tương ứng | 8–20 |
| Giáo dục / `job_giaoduc` | Giáo viên mầm non; giáo viên phổ thông; giảng viên; gia sư toàn thời gian | Sư phạm hoặc bằng phù hợp | 6–14 |
| Công nghệ / `job_congnghe` | Lập trình viên; kiểm thử viên; kỹ thuật viên IT; phân tích dữ liệu | Nghề kỹ thuật hoặc đại học, kỹ năng phù hợp | 8–18 |
| Kinh doanh / `job_kinhdoanh` | Kế toán; nhân viên bán hàng doanh nghiệp; chuyên viên marketing; chuyên viên nhân sự | THPT tới đại học theo nghề | 6–12 |
| Nghệ thuật / `job_nghethuat` | Diễn viên; ca sĩ; thiết kế đồ hoạ; nhiếp ảnh gia | Kỹ năng hoặc bằng nghệ thuật | 5–12 |
| Thể thao / `job_thethao` | Vận động viên; huấn luyện viên; trọng tài; hướng dẫn viên thể hình | Kỹ năng và thể lực theo nghề | 6–12 |
| Pháp luật / `job_phapluat` | Trợ lý pháp lý; luật sư; công chứng viên; chuyên viên pháp chế | Học luật và điều kiện nghề hư cấu | 7–15 |
| Nông nghiệp / `job_nongnghiep` | Trồng trọt; chăn nuôi; kỹ thuật nông nghiệp; quản lý trang trại thuê | Từ không yêu cầu bằng đến chuyên ngành | 5–10 |
| Xây dựng / `job_xaydung` | Thợ xây; thợ điện; kỹ sư xây dựng; kiến trúc sư | Học nghề hoặc đại học theo việc | 6–15 |
| Dịch vụ / `job_dichvu` | Đầu bếp; nhân viên khách sạn; hướng dẫn viên du lịch; thợ làm tóc | Kỹ năng hoặc học nghề | 5–10 |
| Nhà nước / `job_nhanuoc` | Nhân viên hành chính; nhân viên thư viện; lính cứu hoả; cảnh sát | Bằng và điều kiện tuyển riêng của game | 6–10 |
| Quân đội / `job_quandoi` | Binh sĩ chuyên nghiệp; sĩ quan chỉ huy; kỹ thuật viên quân đội; nhân viên quân y | Nhập ngũ hoặc bằng phù hợp | 6–12 |

ID hoàn chỉnh theo thứ tự trong hàng, ví dụ `job_congnghe_01` là lập trình viên. Đặc tả dữ liệu từng nghề phải ghi rõ bậc, lương năm, chuyên ngành, chỉ số tối thiểu, kinh nghiệm, điều kiện tiền án và tuổi. Bảng này mới là danh mục thiết kế, chưa phải 48 bản ghi JSON hoàn chỉnh.

### 15.4. Quy tắc làm việc

Một nhân vật có tối đa một nghề toàn thời gian và một việc làm thêm. Xin việc mới thành công thay nghề cũ trong một giao dịch; thất bại vẫn giữ nghề cũ. Không nghỉ việc trước khi biết kết quả tuyển.

Lương đầu năm dùng nghề đã giữ trong năm vừa kết thúc. Nhận việc ở tuổi hiện tại không trả ngược nguyên một năm lương ngay. Thưởng nhận việc, nếu có, phải là một khoản riêng ghi rõ.

Mỗi nghề có hiệu suất 0–100. Nỗ lực, kỹ năng và sự kiện công sở thay đổi hiệu suất. Thăng chức chỉ được xét một lần/năm và cần đủ năm tại bậc hiện tại. Điều kiện giữ nghề mất hiệu lực phải tạo lý do rõ: sức khoẻ, bằng/chứng chỉ, tiền án hoặc vi phạm trong game.

Nghỉ hưu chấm dứt lương nghề và mở lương hưu từ năm kế tiếp. Công thức lương hưu dùng mức lương đã lưu tại thời điểm nghỉ, không tăng ngược khi danh mục nghề được cập nhật.

### 15.5. Làm thêm, tự do và kinh doanh nhỏ

Việc làm thêm/tự do có thể mở từ tuổi 13 theo thiết kế game: phụ quán, gia sư nhỏ, dắt thú cưng, trông thú cưng, làm vườn, giao việc vặt, viết bài, thiết kế đơn giản. Từng việc có điều kiện tuổi riêng; không mở đồng loạt nghề của người trưởng thành.

Thu nhập làm thêm gắn với hành động và điểm thời gian đã tiêu, tránh vừa nhận lương năm tự động vừa nhận lại cùng khoản qua hoạt động. Kinh doanh nhỏ là một hoạt động có vốn và kết quả ngẫu nhiên ở bản đầu; chưa bổ sung hệ quản trị doanh nghiệp riêng.

## 16. Danh mục 108 hoạt động cho bản web

### 16.1. Cách đếm và quy tắc chung

Bảng dưới có 12 nhóm, mỗi nhóm 9 hoạt động, tổng **108 ID độc lập**. Mỗi hoạt động phải có tình huống hoặc kết quả riêng; đổi tên một nút mà giữ nguyên toàn bộ hành vi không được tính thêm nội dung.

ID theo thứ tự của hàng: `act_<nhóm>_01` đến `act_<nhóm>_09`. Ví dụ `act_thechat_01` là đi bộ, `act_thechat_09` là tham gia giải phong trào.

Đề xuất mỗi năm có 12 điểm thời gian, kể cả hoạt động miễn phí cũng tiêu ít nhất 1 điểm. Hoạt động lớn tiêu 2–4 điểm; giới hạn riêng mặc định 2 lần/năm. Hành động quản lý như xem tài sản, xem nhật ký, xuất file lưu không tiêu điểm.

Chi phí, thưởng và xác suất là dữ liệu của từng ID. Giá tiền kiểm tra ở engine trước khi bốc kết quả. Tài khoản thiếu tiền hoặc điểm thời gian không được bị trừ trước rồi mới báo lỗi.

### 16.2. Danh sách theo nhóm

| Nhóm ID | 9 hoạt động độc lập |
| --- | --- |
| `thechat` | Đi bộ; chạy bộ; đạp xe; bơi; tập gym; yoga; đá bóng; cầu lông; tham gia giải phong trào |
| `suckhoe` | Khám tổng quát; khám răng; điều trị bệnh đã có; nghỉ dưỡng hồi sức; điều chỉnh giấc ngủ; ăn uống lành mạnh; tập phục hồi chức năng; tư vấn tâm lý; chăm sóc ngoại hình |
| `hoctap` | Đọc sách; học nhóm; học ngoại ngữ; học lập trình; học nhạc cụ; luyện thi; học kỹ năng thuyết trình; làm dự án cá nhân; tham gia cuộc thi kiến thức |
| `xahoi` | Gặp bạn; gọi bạn cũ; đi sinh nhật; tham gia câu lạc bộ; làm tình nguyện; tổ chức gặp mặt; đi sự kiện cộng đồng; kết bạn mới; xin lỗi sau mâu thuẫn |
| `giadinh` | Thăm cha mẹ; gọi người thân; ăn tối gia đình; tặng quà người thân; chăm người thân ốm; hỗ trợ học phí con; đi chơi với con; họp gia đình; giúp anh chị em việc khó |
| `tinhcam` | Làm quen; hẹn cà phê; hẹn xem phim; nấu ăn cùng nhau; tặng quà người yêu; trò chuyện nghiêm túc; kỷ niệm ngày yêu; làm hoà; đi chuyến riêng với bạn đời |
| `giaitri` | Chơi game; xem phim; nghe nhạc; câu cá; làm vườn thư giãn; nấu món mới; vẽ; chụp ảnh dạo; đi bảo tàng |
| `dulich` | Dã ngoại; về quê; đi biển; lên núi; cắm trại; đi thành phố khác; tham quan di tích; đi nước ngoài; tổ chức chuyến đi gia đình |
| `taichinh` | Nhận việc ngắn hạn; bán đồ không dùng; mở gian hàng nhỏ; tham gia hội chợ; thương lượng lương; học quản lý chi tiêu; nhận dự án tự do; bán sản phẩm tự làm; xin hỗ trợ từ gia đình |
| `nhacua` | Dọn nhà; sửa chữa nhỏ; mua đồ trang trí; tổ chức tiệc tại nhà; chống dột; kiểm tra phương tiện; tự rửa xe; cải tạo góc làm việc; nâng cấp nội thất |
| `thucung` | Nhận nuôi; chơi với thú cưng; dắt đi dạo; khám thú y; mua đồ chơi; huấn luyện cơ bản; chăm thú cưng già; tìm thú cưng thất lạc; gửi chăm sóc khi đi xa |
| `ruiro` | Chơi trò may rủi; đua xe trái phép; tiệc quá đà; trộm đồ; lừa người mua; buôn bán hàng cấm hư cấu; gây gổ; tham gia vụ cướp hư cấu; đánh cược vào một thương vụ thiếu thông tin |

Các tình huống phạm tội chỉ mô tả lựa chọn và hậu quả trong game; không viết quy trình thực hiện ngoài đời. Năm nhóm phạm tội để tính bộ đếm là trộm cắp, lừa đảo, buôn bán phi pháp, bạo lực và cướp. May rủi hoặc tiệc quá đà không tự động đặt tiền án.

### 16.3. Điều kiện mở khoá theo nhóm

| Nhóm | Điều kiện tối thiểu cần kiểm ở từng hoạt động |
| --- | --- |
| Thể chất | Tuổi, sức khoẻ, địa điểm hoặc vật dụng nếu cần |
| Sức khoẻ | Có bệnh đúng loại đối với chữa bệnh; chương trình hồi phục nếu cần |
| Học tập | Cấp học, kỹ năng trước đó, khả năng đóng học phí |
| Xã hội | Người liên quan còn sống, quan hệ còn tồn tại |
| Gia đình | Đúng vai trò cha mẹ/con/anh chị em; tránh chi phí cho người đã mất |
| Tình cảm | Tuổi và trạng thái độc thân/hẹn hò/kết hôn của đối tượng |
| Giải trí | Tiền, điểm thời gian, giới hạn và tuổi phù hợp |
| Du lịch | Không ngồi tù, đủ tiền; chuyến gia đình cần người đồng hành |
| Tài chính | Tuổi, nghề/kỹ năng và vốn khi hành động cần vốn |
| Nhà cửa | Đang thuê hoặc sở hữu đúng tài sản; chỉ sửa phương tiện mình có |
| Thú cưng | Đúng thú cưng đang sống; tìm thất lạc chỉ khi có cờ thất lạc |
| Rủi ro | Tuổi, trạng thái tù, mức rủi ro và giới hạn tiền đặt cược |

Không gộp mọi hiệu ứng vào một chỉ số. “Đọc sách” có thể tăng kỹ năng hoặc trí tuệ; “tặng quà” chủ yếu tác động quan hệ; “sửa xe” thay độ bền. Các kết quả phụ phải được mô tả trong câu nhật ký.

### 16.4. Hợp đồng dữ liệu của một hoạt động

Các trường bắt buộc: `id`, `group`, `name`, `description`, `minAge`, `conditions`, `cost`, `timeCost`, `maxUsesPerYear`, `outcomes`. Trường tuỳ loại: `targetRole`, `requiredAssetCategory`, `crimeCategory`.

Hoạt động có đối tượng phải nhận instance ID của đối tượng, không chỉ role. Hai người con hoặc hai xe có cùng loại vẫn phải xác định đúng người/xe đang tác động.

Một hoạt động dùng cấu trúc hậu quả chung với sự kiện, nhưng không được tự gọi `ageUp`. Nếu cần đẩy sang năm sau, tạo sự kiện hẹn trong hàng đợi.

## 17. Tài sản, chi phí sinh hoạt và sổ tiền

### 17.1. Danh mục 24 tài sản

Các mức giá dưới đây là giá ban đầu trong game, đơn vị triệu đồng. Giá thực tế ngoài đời không phải nguồn của bảng này.

| Nhóm | 4 tài sản / giá khởi điểm | Quy tắc giá trị đề xuất |
| --- | --- | --- |
| Nhà / `asset_nha` | Căn hộ nhỏ 700; căn hộ rộng 1.500; nhà phố 3.000; biệt thự 8.000 | Cập nhật một lần/năm theo kịch bản thị trường |
| Phương tiện / `asset_xe` | Xe đạp 3; xe máy 30; ô tô phổ thông 500; ô tô cao cấp 2.000 | Hao mòn theo tuổi và độ bền |
| Đầu tư / `asset_dautu` | Gói vàng 10; gói cổ phiếu hư cấu 10; chứng chỉ quỹ hư cấu 10; đất 500 | Giữ số đơn vị; định giá bằng một mức giá thị trường cho cả năm |
| Đồ dùng / `asset_dodung` | Laptop 15; máy ảnh 20; nhạc cụ 8; thiết bị tập tại nhà 10 | Giảm giá theo năm; mở hoạt động hoặc kỹ năng |
| Xa xỉ / `asset_xaxi` | Đồng hồ 50; trang sức 80; bộ sưu tập nghệ thuật 200; du thuyền 3.000 | Phí duy trì theo loại; dao động theo năm |
| Thú cưng / `asset_thucung` | Mèo 2; chó 3; thỏ 1; chim cảnh 1 | Có tuổi, sức khoẻ và trạng thái sống; không áp dụng mô hình đầu tư |

ID theo thứ tự trong hàng, ví dụ `asset_xe_02` là xe máy. Giá nhận nuôi có thể bao gồm phí chăm sóc ban đầu; không bắt buộc mô tả thú cưng như món hàng mua bán.

Phòng trọ là **hợp đồng thuê**, không phải tài sản mua được rồi bán lại. Chỉ có một chỗ ở chính; có thể sở hữu nhiều nhà nhưng chỉ một nhà cho hiệu ứng nơi ở. Hệ cho thuê nhà không tự thêm vào bản đầu nếu chưa có đặc tả.

### 17.2. Bản ghi sở hữu

Một tài sản sở hữu cần `instanceId`, `catalogId`, `acquiredAge`, `purchasePrice`, `currentValue`, `condition`, `annualUpkeep`, `isPrimary` và `quantity` nếu thuộc nhóm đầu tư. Không dùng catalog ID làm khóa duy nhất vì người chơi có thể sở hữu hai xe cùng mẫu.

Thú cưng bổ sung tuổi, sức khoẻ, độ gắn bó và trạng thái thất lạc/sống/chết. ID thú cưng trong quan hệ trỏ tới cùng một thực thể, tránh có hai bản tuổi độc lập.

### 17.3. Mua bán và tránh kiếm tiền vô hạn

- Mua trừ đúng giá đã hiển thị, sau khi kiểm tuổi, tiền, số lượng và các điều kiện.
- Bán dùng giá hiện tại trừ phí giao dịch theo loại. Không bốc một giá mới sau mỗi lần bấm xem hoặc bán.
- Bảng giá thị trường chỉ thay vào đầu năm. Mua rồi bán trong cùng năm không tạo lời chắc chắn.
- Mọi phép tính tiền dùng đồng nguyên; quy tắc làm tròn được áp dụng một lần khi ghi khoản tiền.
- Từ chối giá trị NaN, vô hạn, số lượng không hợp lệ hoặc số tiền vượt giới hạn số nguyên an toàn đã đặt cho game.
- Một giao dịch chỉ có một `transactionId`; gửi lại cùng giao dịch không chuyển tiền lần thứ hai.

### 17.4. Chi phí sinh hoạt và nợ

Chi phí năm gồm ba dòng khác nhau: sinh hoạt cơ bản, thuê chỗ ở, duy trì tài sản. Học phí, quà, hoạt động và phí điều trị là giao dịch riêng. Hiệu ứng tài sản không được tính phí duy trì thêm một lần ở menu hoạt động.

Trẻ em dưới 18 tuổi không bị trừ toàn bộ tiền thuê/sinh hoạt của người trưởng thành; các khoản do gia đình hỗ trợ có ghi rõ. Khi trưởng thành, chuyển sang chế độ tự trang trải tại một mốc bắt buộc.

Đề xuất không vay tự do để mua mọi tài sản trong bản đầu. Chỉ hỗ trợ nợ học phí và nợ sinh hoạt có giới hạn. Mỗi khoản nợ có ID, số dư, lãi năm trong game và lịch trả; phần tiền mặt không tự làm nhiệm vụ sổ nợ.

Tài sản ròng = tiền mặt + giá trị tài sản sở hữu − nợ. Không cộng nhà thuê, tiền lương tương lai hoặc tài sản riêng của người thân vào tài sản ròng.

## 18. Quan hệ, gia đình, nhiều đời và trạng thái đặc biệt

### 18.1. Tương tác quan hệ

| Hành động | Điều kiện | Hậu quả chính |
| --- | --- | --- |
| Trò chuyện | Đối tượng còn sống và quan hệ còn tồn tại | Thay độ thân thiết, có thể mở tình huống |
| Đi chơi | Đủ điểm thời gian và tiền nếu có | Thân thiết, hạnh phúc; kết quả theo tính cách |
| Tặng quà | Quà hợp lệ và đủ tiền | Trừ tiền một lần, đổi thân thiết |
| Xin hỗ trợ | Đối tượng có nguồn lực, chưa vượt giới hạn | Có thể nhận tiền; không bảo đảm thành công |
| Xin lỗi | Có mâu thuẫn chưa giải quyết | Có thể giảm căng thẳng; không xoá lịch sử |
| Tranh cãi | Quan hệ đang hoạt động | Thân thiết giảm; có thể thành chuỗi |
| Hẹn hò / cầu hôn | Đủ tuổi, đối tượng phù hợp và trạng thái tình cảm hợp lệ | Chuyển quan hệ khi thành công |
| Chia tay / ly hôn | Đúng quan hệ hiện tại | Đóng quan hệ tình cảm; xét con cái và tiền |

Tuổi người thân tăng mỗi năm đúng một lần. Khi đã mất, chỉ xem được ký ức và nhật ký; không thể tặng quà, xin tiền hoặc bốc sự kiện người đó còn sống.

### 18.2. Hôn nhân và con cái

Đề xuất bản đầu có tối đa một người yêu hoặc vợ/chồng đang hoạt động. Quan hệ cũ vẫn giữ trong lịch sử. Mọi nội dung tình cảm người trưởng thành và tạo gia đình có điều kiện tuổi; không dựa vào giao diện để chặn mà phải kiểm trong engine.

Sinh con không tự xảy ra trong mỗi năm kết hôn. Nó là một lựa chọn hoặc sự kiện có điều kiện. Con có hai ID cha/mẹ phù hợp với quan hệ được mô hình hoá; tuổi không được âm. Có thể nhận nuôi qua một luồng riêng, không ép mọi gia đình dùng cùng tình huống.

Chi phí nuôi con là khoản năm có số lượng trẻ phụ thuộc. Con trưởng thành không tự bị tính như trẻ nhỏ. Sự kiện của con kiểm tra vai trò, tuổi và trạng thái sống hiện tại.

### 18.3. Ly hôn và thừa kế trong game

Ly hôn dùng quy tắc tài sản hư cấu, được giải thích trước xác nhận. Không tự chia tài sản riêng của hai người nếu trạng thái không lưu thông tin sở hữu chung. Bản đầu đề xuất một khoản thoả thuận tiền xác định từ tài sản chung đã đánh dấu, không giả lập pháp luật thực tế.

Di chúc cho phép chọn người nhận còn sống và tỉ lệ phân bổ tổng 100%. Khi không có người nhận hợp lệ, dùng lựa chọn dự phòng đã đặt: chuyển cho người con hợp lệ khác hoặc làm khoản cho đi trong game. Không âm thầm tạo một người thừa kế.

Nợ được giải quyết trong mô hình di sản trước khi phân chia. Giá trị được chia là tiền ròng từ di sản sau chi phí/nợ; không tặng lại cả tiền bán nhà lẫn căn nhà trong cùng lần kết toán.

### 18.4. Hai cách bắt đầu đời tiếp theo

**Cuộc đời độc lập:** nhân vật mới ở tuổi 0, RNG mới, không mang tiền, nghề, chỉ số hoặc cờ từ đời trước. Thành tích toàn cục vẫn giữ.

**Tiếp tục làm người con:** chọn một người con đang sống đã tồn tại trong gia đình. Bắt đầu ở tuổi hiện tại của người đó, nhận đúng phần di sản của người đó, giữ cha mẹ và quan hệ đã biết. Chỉ bổ sung thông tin nghề/học còn thiếu bằng quy tắc thiết kế; ghi rõ đây là dữ liệu được tạo cho bản web, không lịch sử đã mô phỏng trước đó.

Không vừa bắt đầu lại ở tuổi 0 vừa mang nguyên số tuổi hoặc nghề của người con. Một di sản có ID xử lý duy nhất, không nhận lại khi mở màn tổng kết.

### 18.5. Ngồi tù và bệnh

Ngồi tù không nhảy qua nhiều năm bằng một thao tác không thể lưu. Mỗi năm tù vẫn đi qua vòng năm: tuổi, sức khoẻ, người thân, chi phí phù hợp và sự kiện tù. Các hoạt động bên ngoài bị chặn trong engine. Hết án mở mốc ra tù; nghề bị mất không tự khôi phục.

Bệnh có instance ID, loại, mức độ, năm phát hiện và tiến độ điều trị. Đi khám có thể phát hiện bệnh hoặc không; điều trị có thể cải thiện nhưng không biến mọi bệnh thành “mất tiền, luôn khỏi”. Khỏi bệnh chỉ xoá instance đã chữa, không xoá tất cả bệnh.

## 19. Thành tích, huy chương và danh hiệu cuối đời

### 19.1. Ba hệ khác nhau

| Hệ | Cách nhận | Nơi lưu | Số lượng trong một đời |
| --- | --- | --- | --- |
| Thành tích | Khi đạt điều kiện ở một thời điểm | Hồ sơ toàn cục + đời đã mở khoá | Có thể nhiều |
| Huy chương | Phần thưởng của nghề hoặc sự kiện cụ thể | Cuộc đời; hồ sơ có thể ghi bộ sưu tập | Có thể nhiều |
| Danh hiệu cuối đời | Chấm các kiểu sống khi kết thúc | Bản tổng kết của đời | Một danh hiệu chính |

Việc tham khảo ribbon của BitLife không được dùng để xoá hệ thành tích nhiều mục đã dự định ở 6.7. Hai cơ chế có thể tồn tại cùng nhau mà không mâu thuẫn.

### 19.2. Khung 40 thành tích

Đây là tên thiết kế mới, chia 8 nhóm, mỗi nhóm 5 mục. Ngưỡng số cụ thể được ghi trong dữ liệu khi cân bằng.

| Nhóm | 5 thành tích đề xuất |
| --- | --- |
| Tuổi và sức khoẻ | Qua tuổi trưởng thành; sáu mươi mùa xuân; trăm năm chuyện kể; vượt qua bệnh nặng; chăm mình đều đặn |
| Học tập | Tốt nghiệp phổ thông; bằng đại học đầu tiên; học tiếp sau đại học; học bổng đáng nhớ; quay lại lớp sau bỏ học |
| Nghề nghiệp | Việc đầu tiên; lần thăng chức đầu; mười năm một nghề; đổi nghề thành công; nghỉ hưu đủ đầy |
| Tài chính | Khoản tiết kiệm đầu; căn nhà đầu tiên; hết nợ; đạt mốc tài sản lớn; một khoản cho đi đáng kể |
| Gia đình | Lần đầu kết hôn; lần đầu làm cha mẹ; nuôi con trưởng thành; đoàn tụ sau mâu thuẫn; tiếp nối một đời con |
| Bạn bè và cộng đồng | Bạn lâu năm; hoà giải; hoạt động tình nguyện; tổ chức buổi gặp mặt; hỗ trợ người thân lúc khó |
| Khám phá và sở thích | Chuyến đi đầu; thành thạo một sở thích; hoàn thành giải phong trào; chăm thú cưng tới tuổi già; thử đủ các nhóm hoạt động |
| Truyện và lựa chọn | Kết thúc truyện đầu; đủ các kết thúc một truyện; hoàn thành năm truyện; tránh một rủi ro lớn; làm lại sau sai lầm |

ID: `ach_<nhóm>_01..05`. Không tính thành tích đã mở khoá hai lần khi tải lại; một đời mới có thể đạt lại điều kiện nhưng hồ sơ chỉ ghi thêm lịch sử, không tăng số mục sưu tập.

### 19.3. Chọn danh hiệu

Danh hiệu đề xuất: chăm học, tận tâm với nghề, vì gia đình, rộng lượng, thích khám phá, sống thọ, dựng lại từ khó khăn, giàu có, liều lĩnh và bình dị.

Mỗi danh hiệu có điều kiện đủ tư cách và điểm chuẩn hoá. Không cộng trực tiếp “số đồng” với “số lần thăm gia đình” vì thang đo khác nhau. Tie-break dùng thứ tự ưu tiên cố định trong dữ liệu, không bốc lại danh hiệu mỗi lần xem tổng kết.

Danh hiệu không được mô tả một đời ít tiền, ít học hoặc chết sớm như thất bại về giá trị con người. Văn phong tổng kết giữ nhẹ nhàng, phù hợp mục tiêu game vui.

## 20. Nội dung sự kiện: kế hoạch 150 mục và 20 bản nháp

### 20.1. Phân bổ 150 sự kiện thường

| Nhóm tuổi | Phân bổ chủ đề | Tổng |
| --- | --- | --- |
| 0–5 | Gia đình 6; khám phá/thói quen 5; sức khoẻ nhỏ 4 | 15 |
| 6–17 | Trường học 15; bạn bè 10; gia đình 8; sở thích và lớn lên 7 | 40 |
| 18–30 | Học/nghề 14; tình cảm 10; tiền/chỗ ở 9; xã hội/rủi ro 7 | 40 |
| 31–59 | Nghề 10; gia đình 10; sức khoẻ 8; cộng đồng/biến cố 7 | 35 |
| 60+ | Nghỉ hưu 5; gia đình 5; sức khoẻ 5; di sản/sở thích 5 | 20 |
| **Tổng** | | **150** |

150 là mục tiêu của pool sự kiện đời thường. Không cộng lẫn 108 hoạt động, nút truyện, 48 nghề hoặc sự kiện dự phòng để đạt chỉ tiêu này. Các sự kiện nghề riêng là phần mở rộng, không mặc định 48 nghề × 5 sự kiện đã tồn tại.

Mỗi mục phải có đầy đủ văn bản mở đầu, lựa chọn, mọi kết quả có thể xảy ra, điều kiện và hiệu ứng. Một ý tưởng có ID mới là bản nháp, không được đánh dấu đã triển khai.

### 20.2. Hai mươi tình huống mở đầu tự viết

Các dòng dưới là bản nháp biên tập để thử giọng văn và đánh đổi. Chưa phải JSON được validator chấp nhận. ID và tuổi phải được giữ khi chuyển thành dữ liệu để theo dõi tiến độ.

| ID / tuổi | Tình huống | Lựa chọn và hướng hậu quả |
| --- | --- | --- |
| `infancy_robot_box_01` / 3–5 | Bạn quyết định chiếc thùng giấy là một robot. Cả nhà chưa kịp hiểu thì robot đã mắc ở cửa. | Nhờ giúp: thân thiết tăng; tự tháo: trí tuệ tăng nhẹ, có thể buồn vì robot hỏng |
| `infancy_first_pet_01` / 4–5 | Một chú mèo quanh nhà cứ đi theo bạn, nhưng bố mẹ chưa đồng ý nuôi. | Xin chăm thử: mở chuỗi trách nhiệm; để mèo ở ngoài và cho ăn cùng người lớn: tăng tình cảm, không tạo sở hữu tự động |
| `infancy_drawing_01` / 3–5 | Bạn vẽ cả gia đình, nhưng mọi người đều có ba chân. | Kể câu chuyện: tăng vui và thân thiết; sửa tranh: mở sở thích vẽ |
| `infancy_small_fever_01` / 1–5 | Bạn bị sốt nhẹ, kế hoạch đi chơi của cả nhà phải đổi. | Nghỉ cùng người thân: hồi phục và thân thiết; đòi ra ngoài: có thể vui nhưng hồi phục chậm |
| `school_group_project_01` / 12–17 | Nhóm giao bạn làm slide vì bạn là người duy nhất biết đổi màu nền. | Nhận việc: tăng kỹ năng, mất thời gian; chia việc rõ: tăng phối hợp, có khả năng tranh luận |
| `school_lost_lunch_01` / 6–11 | Hộp cơm biến mất. Bạn phát hiện mình cất nó vào ngăn đồ thủ công. | Cười và ăn cùng bạn: thân thiết tăng; giữ kín: đỡ ngại nhưng bỏ lỡ cơ hội kết bạn |
| `school_club_choice_01` / 11–17 | Hai câu lạc bộ cùng mời bạn vào đúng một buổi. | Chọn thể thao: mở kỹ năng thể lực; chọn sáng tác: mở kỹ năng nghệ thuật; chưa chọn: giữ thời gian cho học |
| `school_help_friend_01` / 10–17 | Bạn cùng bàn hỏi bài ngay lúc bạn đang ôn phần khó nhất. | Giúp: thân thiết tăng, ít thời gian ôn; hẹn sau giờ: hiệu quả học cao hơn, có thể bị hiểu lầm |
| `youth_first_interview_01` / 18–25 | Bạn chuẩn bị kỹ câu giới thiệu, nhưng nhà tuyển dụng hỏi điều bạn không đoán trước. | Thành thật suy nghĩ: xét kỹ năng; nói cho tự tin: có thể được đánh giá tốt hoặc lộ thiếu chuẩn bị |
| `youth_roommate_bills_01` / 18–30 | Bạn cùng phòng bảo tiền điện tăng vì “quạt cũng cần sống thoải mái”. | Lập bảng chi: tăng kỹ năng tiền, mở thương lượng; trả phần tăng: tốn tiền, giữ hoà khí tạm thời |
| `youth_old_friend_01` / 18–30 | Một người bạn cũ nhắn “còn nhớ mình không”, kèm ảnh lớp mà bạn đứng nhầm hàng. | Hẹn gặp: phục hồi quan hệ; gọi ngắn: ít thời gian hơn, tăng thân thiết ít hơn |
| `youth_side_project_01` / 18–30 | Sản phẩm bạn làm cuối tuần được người lạ hỏi mua. Bạn còn chưa nghĩ ra tên. | Bán thử: mở kinh doanh nhỏ có rủi ro; hoàn thiện trước: tăng kỹ năng, bỏ lỡ đơn đầu |
| `midlife_parent_visit_01` / 31–59 | Người thân bảo “đừng mang gì”, rồi hỏi bạn có nhớ món bánh ở đầu ngõ không. | Mang bánh và ghé: tốn thời gian/tiền, thân thiết tăng; gọi trước và hẹn ngày khác: giữ thời gian, tăng thân thiết ít |
| `midlife_child_question_01` / 31–59 | Con hỏi vì sao người lớn nói phải ngủ sớm nhưng vẫn cầm điện thoại tới khuya. | Cùng đặt giờ tắt máy: cải thiện thói quen; đùa cho qua: vui nhẹ, không giải quyết thói quen |
| `midlife_career_switch_01` / 31–59 | Một nghề từng bỏ qua nay có cơ hội tuyển. Công việc hiện tại vẫn ổn. | Thử phỏng vấn: tốn thời gian, không mất việc cũ; học thêm trước: chi phí học, mở kỹ năng |
| `midlife_house_repair_01` / 31–59 | Mưa vừa tới thì trần nhà bắt đầu “góp nhịp” vào bản nhạc bạn đang nghe. | Sửa ngay: mất tiền, giữ độ bền; xử lý tạm: rẻ hơn, nguy cơ sửa lớn năm sau |
| `elder_new_hobby_01` / 60–90 | Bạn đăng ký lớp vẽ và phát hiện người lớn tuổi nhất lớp chưa chắc là người vẽ chậm nhất. | Tham gia: tăng vui/kỹ năng, kết bạn; thử tại nhà: rẻ hơn, ít giao tiếp |
| `elder_photo_album_01` / 60–100 | Một tấm ảnh cũ làm bạn nhớ người bạn đã mất liên lạc nhiều năm. | Tìm liên hệ: mở chuỗi đoàn tụ; viết lại kỷ niệm: tăng vui, ghi dấu vào nhật ký |
| `elder_family_meal_01` / 60–100 | Bạn đề nghị một bữa cơm không ai chụp ảnh trước khi ăn. Cả bàn im lặng ba giây. | Cùng đặt điện thoại xuống: tăng gắn kết; biến thành trò chơi: vui hơn, có thể không ai tuân thủ |
| `elder_legacy_letter_01` / 65–100 | Bạn muốn để lại điều gì đó ngoài giấy tờ và những món đồ. | Viết thư: mở mục di sản tinh thần; ghi âm câu chuyện: tốn thời gian, tăng gắn bó với người nhận |

### 20.3. Mẫu JSON hoàn chỉnh cho một sự kiện độc lập

Mẫu này dùng các trường đã có ở 4.4, không phụ thuộc nhánh mới hoặc loại effect chưa đặc tả. Đây là nội dung tự viết để kiểm tra schema, không trích từ game gốc.

```json
{
  "id": "school_rain_walk_01",
  "group": "school",
  "minAge": 12,
  "maxAge": 17,
  "weight": 2,
  "once": false,
  "cooldownYears": 3,
  "conditions": [
    { "flag": "in_school", "is": true }
  ],
  "text": "Tan học thì mưa. Bạn bè đề nghị chờ dưới mái hiên và kể chuyện cho hết giờ.",
  "choices": [
    {
      "id": "wait_with_friends",
      "label": "Ở lại cùng bạn bè",
      "outcomes": [
        {
          "chance": 1,
          "text": "Bạn về muộn một chút, nhưng câu chuyện về buổi trực nhật làm cả nhóm cười mãi.",
          "effects": [
            { "stat": "happiness", "delta": 4 }
          ]
        }
      ]
    },
    {
      "id": "run_home",
      "label": "Chạy về để kịp làm việc riêng",
      "outcomes": [
        {
          "chance": 0.75,
          "text": "Bạn kịp về sớm. Một buổi chiều yên tĩnh giúp bạn đọc xong cuốn sách còn dang dở.",
          "effects": [
            { "stat": "intelligence", "delta": 2 }
          ]
        },
        {
          "chance": 0.25,
          "text": "Bạn về sớm nhưng mệt vì chạy giữa trời mưa. Kế hoạch buổi chiều đổi thành nghỉ ngơi.",
          "effects": [
            { "stat": "health", "delta": -2 },
            { "stat": "happiness", "delta": -1 }
          ]
        }
      ]
    }
  ]
}
```

Mẫu độc lập này bổ sung cho 20 tình huống ở bảng trên; không giả vờ rằng cả bảng đã có JSON. Phải kiểm bằng schema thực tế khi engine được triển khai.

### 20.4. Chống lặp và kiểm độ phủ

Một event ID có bộ đếm số lần đã gặp và năm gần nhất. `once` chặn lần thứ hai; cooldown tính bằng năm game, không theo thời gian thực. Đề xuất thêm `maxOccurrences` mặc định 2 cho sự kiện thường; validator phải kiểm được trường này trước khi dùng.

Sự kiện hiếm cần đánh dấu `rare` cùng lý do và một fixture có thể kích hoạt. Không đánh dấu hiếm chỉ để tránh báo cáo thiếu phủ.

Mô phỏng ngẫu nhiên không chứng minh mọi nhánh đi được. Bổ sung kiểm thử điều kiện riêng: tạo trạng thái đáp ứng từng sự kiện, chọn từng đáp án, và kiểm các kết quả có xác suất. Phát hiện điều kiện bất khả thi trong trường hợp tổng quát là khó; validator chỉ kết luận các mâu thuẫn nó chứng minh được, không hứa bắt hết chỉ bằng schema.

## 21. Năm truyện mới và hợp đồng tách khỏi đời thường

Đề xuất mỗi truyện 10–25 nút, tối thiểu 3 kết thúc. Các ý tưởng này độc lập với năm nhóm hình thấy trong APK; không khẳng định chúng là cốt truyện gốc.

| ID | Tên truyện tự viết | Mạch chính | 3 kết thúc tối thiểu |
| --- | --- | --- | --- |
| `story_market_clock` | Chiếc đồng hồ ở chợ cũ | Nhặt đồng hồ → sửa hay giữ → mỗi lần quay lại mất một ký ức → chọn điều muốn giữ | Trả đồng hồ; giữ ký ức gia đình; mắc kẹt trong ngày hoàn hảo |
| `story_rooftop_garden` | Khu vườn trên mái | Chung cư định dỡ vườn → tập hợp hàng xóm → chăm cây và giải quyết bất đồng → thương lượng | Giữ vườn chung; chuyển cây sang nơi mới; giữ một khu vườn nhỏ riêng |
| `story_midnight_bus` | Chuyến xe lúc nửa đêm | Lên xe lạ → gặp người quen ở tuổi khác → đổi hành trình → chọn bến xuống | Về hiện tại; giúp một người hoà giải; chọn một cuộc đời khác |
| `story_letter_shop` | Tiệm thư chưa gửi | Nhận làm ở tiệm → phân loại thư → gặp người không muốn nhận → quyết định giao hay giữ | Trao đủ những lá thư; giữ bí mật có lý do; viết lá thư của chính mình |
| `story_festival_team` | Đội hội làng bất đắc dĩ | Bị giao tổ chức hội → tuyển đội → sự cố ngày diễn → chia công hay nhận hết | Một lễ hội ấm áp; nổi tiếng nhưng mất bạn; nhỏ mà vui |

### 21.1. Trạng thái truyện

Truyện dùng RNG và cờ riêng, lưu `storyId`, `nodeId`, số lượt, lựa chọn đã đi và kết thúc đã đạt. Bấm sang truyện không tăng tuổi cuộc đời đang chơi.

Chỉ khi truyện khai báo rõ phần thưởng mới chuyển thành tích hoặc phần thưởng về hồ sơ. Không để một truyện kỳ ảo tự tăng tiền, đổi tuổi hoặc làm chết nhân vật đời thường.

Lưu giữa một nút phải khôi phục đúng nút và lựa chọn đang chờ. “Chơi lại truyện” tạo lượt mới, không xoá bộ sưu tập kết thúc đã có.

### 21.2. Điều kiện hoàn tất một truyện

- Có văn bản và lựa chọn cho tất cả nút; không chỉ là sơ đồ tên nút.
- Mọi tham chiếu trỏ tới một nút cùng truyện hoặc một kết thúc hợp lệ.
- Mỗi kết thúc có đường đi chứng minh được bằng một kịch bản kiểm thử.
- Không có nhánh bắt buộc mua hàng hoặc gọi máy chủ.
- Mỗi nút luôn còn ít nhất một lựa chọn hợp lệ khi được mở.
- Các vòng lặp có giới hạn hoặc thay đổi trạng thái dẫn tới lối thoát.
- Câu chữ và hình minh hoạ có nguồn được ghi rõ.

## 22. Lưu game, sao lưu, offline và cập nhật

### 22.1. Tự lưu không phải bản sao lưu độc lập

Tự lưu vào IndexedDB giúp tiếp tục sau khi đóng trang. Bản xuất JSON mới là cách mang dữ liệu ra khỏi trình duyệt. Cài PWA không đồng nghĩa dữ liệu không thể mất; trình duyệt có giới hạn dung lượng và cơ chế xoá dữ liệu. [MDN: Storage quotas and eviction](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria).

Đề xuất lưu sau mỗi hành động đã hoàn tất, gồm cả lựa chọn trong một năm. Giữ bản gần nhất trước thay đổi để phục hồi. Khi ghi thất bại, hiển thị “Chưa lưu được” và cho xuất trạng thái trong bộ nhớ; không hiện nhãn “Đã lưu”.

Lưu snapshot đời, tiến độ truyện và cập nhật thành tích liên quan trong một transaction khi chúng thay đổi cùng nhau. Chỉ xác nhận thành công sau transaction hoàn tất. [MDN: Using IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB).

### 22.2. File xuất và nhập

File xuất gồm `format`, `schemaVersion`, `contentVersion`, các ô lưu được chọn và hồ sơ toàn cục. Không dùng một file tuỳ ý làm JavaScript chạy trong ứng dụng.

Quy trình nhập:

1. Giới hạn kích thước file, đề xuất 10 MB cho bản đầu; báo rõ nếu vượt.
2. Parse JSON và kiểm schema, phiên bản, ID, giới hạn tiền/chỉ số, trạng thái chờ, quan hệ và RNG.
3. Nâng cấp trên bản sao, không sửa hoặc ghi đè file gốc.
4. Hiển thị tóm tắt tên nhân vật, tuổi, phiên bản và ô lưu đích.
5. Nhập vào ô mới theo mặc định. Ghi đè ô cũ là lựa chọn có xác nhận cụ thể.
6. Chỉ báo thành công khi transaction lưu hoàn tất.

File có schema mới hơn ứng dụng bị từ chối với thông báo cần cập nhật. ID nội dung đã mất không được tự thay bằng sự kiện ngẫu nhiên; cần bảng di chuyển rõ hoặc giữ ô lưu ở chế độ xem/xuất để tránh mất dữ liệu.

### 22.3. Hai tab cùng mở

Mỗi thay đổi mang revision. Nếu tab khác đã ghi revision mới hơn, tab cũ không được ghi đè; chuyển sang chỉ đọc và cho tải bản mới. Một `lifeId` không được có hai luồng cùng tăng tuổi rồi ghi thay nhau.

Không dùng timestamp làm nguồn duy nhất phân xử vì đồng hồ thực tế không phải thứ tự hành động game. Timestamp chỉ phục vụ hiển thị “lưu gần đây”.

### 22.4. Chuẩn bị chơi offline

Service worker chạy trong ngữ cảnh an toàn như HTTPS hoặc localhost. Mở trực tiếp `index.html` bằng `file://`, hoặc dùng HTTP từ địa chỉ IP trong mạng nhà, không được mặc định là môi trường PWA hợp lệ. [MDN: Using Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers).

Đối với game tự chứa dữ liệu, phải cache toàn bộ nội dung cần cho các tuổi và truyện trước khi hiển thị “Sẵn sàng chơi offline”. Nếu chỉ cache màn đầu và nạp nội dung theo tuổi qua mạng, sẽ có nguy cơ kẹt ở tuổi chưa từng chơi.

Tách hai chỉ tiêu: bundle khởi động nhỏ để mở nhanh, và bộ nội dung offline hoàn chỉnh được tải/cached thành công. Thư viện, phông và biểu tượng cần dùng lúc offline phải có trong bản đóng gói; không phụ thuộc CDN.

### 22.5. Cập nhật an toàn

Ứng dụng, manifest nội dung và cache dùng cùng version. Bản mới chỉ được kích hoạt sau khi đủ tệp, đồng thời không tự tải lại giữa một lựa chọn đang chờ. Nếu nội dung mới không tương thích ô lưu, giữ bản đang dùng hoặc yêu cầu nâng cấp có kiểm tra.

Cache ứng dụng có thể dọn theo phiên bản, nhưng không xoá IndexedDB như một bước “làm sạch” khi cập nhật. Không gộp nút xoá cache với xoá toàn bộ cuộc đời.

### 22.6. Chơi cá nhân và địa chỉ truy cập

“Không có backend game” vẫn có thể dùng máy chủ tĩnh để phát file web. “Chơi cá nhân” cần quyết định cách giới hạn truy cập trước khi đưa lên mạng. Kho mã nguồn riêng tư hoặc URL khó đoán không tự bảo đảm website chỉ mình bạn mở được.

Bản kế hoạch này chưa chọn dịch vụ hosting hoặc tạo deployment. Bước triển khai phải xác minh cơ chế truy cập của dịch vụ đã chọn, giữ dữ liệu chơi trong trình duyệt và không thêm đồng bộ tài khoản ngoài phạm vi.

## 23. Nghiệm thu, tiến độ nội dung và thứ tự triển khai

### 23.1. Danh mục theo dõi nội dung

Một manifest chứa ID, nhóm, trạng thái, nguồn và phiên bản của từng mục. Trạng thái gồm `draft`, `reviewed`, `implemented`, `verified`. Các bảng danh mục trong tài liệu này đang ở mức draft; tên và ID không đồng nghĩa có nội dung chạy được.

| Gói | Mục tiêu | Điều kiện hoàn tất |
| --- | --- | --- |
| Sự kiện thường | 150 | Văn bản + mọi lựa chọn/kết quả + điều kiện + fixture hợp lệ |
| Nghề | 48 | Điều kiện, bậc, lương, thăng chức, mất việc và nghỉ hưu được kiểm |
| Hoạt động | 108 | Chi phí, điểm thời gian, giới hạn, đối tượng và mọi kết quả được kiểm |
| Tài sản | 24 | Mua/nhận, bán hoặc kết thúc sở hữu, phí năm, định giá và tương tác được kiểm |
| Chương trình học | 10 ID ở 15.1 | Nhập học, tiến độ, điểm, phí, tốt nghiệp hoặc bỏ học đúng |
| Thành tích | 40 | Điều kiện mở khoá và lưu toàn cục; không mở trùng |
| Truyện | 5 | 10–25 nút/truyện, ít nhất 3 kết thúc/truyện, mọi nhánh có kiểm thử |
| Danh hiệu cuối đời | 10 | Điều kiện, điểm chuẩn hoá và tie-break cố định |
| Sự kiện dự phòng | 5 nhóm tuổi | Có lựa chọn an toàn và không thay vào số đếm 150 |

Không thêm huy chương vào một tổng số chưa được định nghĩa. Danh mục huy chương sẽ viết theo sự kiện/nghề cần chúng, tránh tạo hàng chục biểu tượng không có cách nhận.

### 23.2. Các kịch bản bắt buộc

| Kịch bản | Kết quả phải có |
| --- | --- |
| Bấm tăng tuổi hai lần liên tiếp | Chỉ xử lý một năm khi pha đã chuyển |
| Tải lại khi đang chọn sự kiện | Giữ đúng instance, hàng đợi và RNG |
| Nhấn đáp án hai lần | Chỉ áp dụng một kết quả |
| Không có sự kiện thường hợp lệ | Mở dự phòng phù hợp, không kẹt |
| Nhánh hẹn gặp lại người đã mất | Dùng nhánh thay thế đã khai báo |
| Không đủ tiền mua/chữa/học | Không trừ tiền hoặc tiêu điểm; giải thích điều kiện |
| Mua rồi bán ngay | Không sinh tiền do bốc lại giá |
| Đầu năm đã trừ phí, sau đó tải lại | Không trừ phí lần hai |
| Nhân vật chết trong sự kiện | Dừng phần còn lại của năm, kết toán một lần |
| Tiếp tục làm con sau nhận di sản | Đúng tuổi/quan hệ; không nhận di sản lần hai |
| Nhập file hỏng hoặc phiên bản mới hơn | Giữ nguyên ô lưu hiện có |
| IndexedDB hết chỗ hoặc ghi lỗi | Báo chưa lưu được, cho xuất trạng thái |
| Hai tab thay đổi cùng ô lưu | Không cho tab cũ ghi đè |
| Tắt mạng sau khi đã sẵn sàng offline | Mở được mọi gói tuổi và truyện |
| Cập nhật ứng dụng giữa lựa chọn | Không mất sự kiện đang chờ hoặc trộn version |

### 23.3. Các lớp xác minh

1. **Schema:** kiểu trường, giá trị hữu hạn, xác suất và ID.
2. **Tham chiếu:** mọi nghề, tài sản, người liên quan, sự kiện nối và kết thúc có đích hợp lệ.
3. **Fixture theo nội dung:** dựng trạng thái để mở từng mục; kiểm tất cả lựa chọn và nhánh kết quả.
4. **Mô phỏng:** 10.000 đời với nhiều chiến lược, ghi seed khi crash/kẹt, tuổi thọ, tiền, nghề, độ phủ và tần suất lặp.
5. **Luồng trình duyệt:** tạo đời, chọn đáp án, lưu/tải, mua/bán, chơi truyện, nhập/xuất và offline.
6. **Thiết bị thật:** đọc chữ, thao tác một tay, bàn phím, thoại đọc màn hình và chuyển ứng dụng trên điện thoại.

Mô phỏng chọn ngẫu nhiên có thể bỏ lỡ nghề hoặc sự kiện yêu cầu chuỗi lựa chọn dài. Tách báo cáo “chưa gặp trong mô phỏng” khỏi lỗi “không có trạng thái hợp lệ”. Không ép mọi nội dung hiếm xuất hiện trong 10.000 đời bằng cách tăng xác suất vô lý.

Yêu cầu “không có hai đời liên tiếp giống nhau” ở 1.6 được sửa thành chỉ tiêu đo tỉ lệ trùng; ngẫu nhiên có seed không bảo đảm hai chuỗi không bao giờ trùng. Cùng seed, cùng content version và cùng hành động phải tái hiện cùng kết quả.

### 23.4. Thứ tự làm các lát cắt có thể chơi

| Lát cắt | Nội dung cần có | Điều kiện chuyển tiếp |
| --- | --- | --- |
| A — Một đời cơ bản | Tạo nhân vật, RNG, 20 sự kiện đã chuyển JSON, lựa chọn, tử vong, tự lưu, tổng kết | Chơi được và tái hiện một đời sau lưu/tải |
| B — Học và nghề | Các cấp học đầu, 4 nghề mẫu ở những ngành khác nhau, thu chi năm | Không trùng lương/phí, nghề có điều kiện thực |
| C — Tiền và hoạt động | 12 hoạt động mẫu, nhà/xe mẫu, định giá, nợ cơ bản | Không có vòng giao dịch tạo tiền chắc chắn |
| D — Gia đình | Cha mẹ, bạn bè, người yêu, kết hôn, con, mất người thân | Quan hệ và tuổi nhất quán qua tải lại |
| E — Mở rộng danh mục | 150 sự kiện, 48 nghề, 108 hoạt động, 24 tài sản, thành tích | Manifest đủ mục verified; mô phỏng và fixture đạt |
| F — Truyện và nhiều đời | 5 truyện, di chúc, tiếp tục làm con, danh hiệu | Các kết thúc có đường đi; chuyển đời không lặp di sản |
| G — Offline và hoàn thiện | Bộ cache đầy đủ, nhập/xuất, cập nhật, kiểm thiết bị | Đạt các kịch bản 23.2 và yêu cầu offline |

Các mốc đầu có ít dữ liệu để thử engine, không gọi là bản hoàn chỉnh. Truyện, nhiều đời và hoạt động rủi ro vẫn nằm trong phạm vi đầy đủ; lộ trình chỉ xác định thứ tự, không tự cắt yêu cầu.

### 23.5. Công việc tài liệu tiếp theo khi bắt đầu triển khai

- Chuyển các danh mục draft thành dữ liệu có ID và thông số cụ thể, bắt đầu từ lát cắt A.
- Viết schema chung cho điều kiện và hiệu ứng trước khi tạo hàng loạt JSON.
- Ghi công thức và bảng cân bằng vào một nguồn cấu hình dùng bởi engine và mô phỏng.
- Cập nhật manifest bằng bằng chứng kiểm thử; không chỉ đánh dấu hoàn tất theo số lượng file.
- Thêm hướng dẫn tác giả nội dung: viết một sự kiện, chạy validator, xem kết quả và sửa lỗi.

## 24. Phạm vi của lần bổ sung này

Đã bổ sung: các điểm cần hiệu chỉnh; quy trình năm và lựa chọn; khung 48 nghề, 108 hoạt động, 24 tài sản; học tập; gia đình và nhiều đời; 40 thành tích; 20 tình huống nháp và một JSON mẫu; 5 truyện mới; lưu/offline; bảng nghiệm thu và thứ tự triển khai.

Chưa làm trong lần này: 150 JSON sự kiện hoàn chỉnh, mọi thông số của 108 hoạt động và 48 nghề, toàn văn 5 truyện, schema chạy được, mã game, kiểm thử engine, deployment hoặc khôi phục dataset gốc. Đây là phần tiếp tục tài liệu thiết kế, không phải bằng chứng đã hoàn thành bản remake.
