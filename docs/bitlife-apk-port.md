# Việt hóa dữ liệu BitLife 3.25 cho NewLife Web

Theo dõi phạm vi đầy đủ tại [issue #111](https://github.com/5erax/newlife-web/issues/111). Bản 1.2 là một bản chuyển nội dung có thể chơi; issue vẫn mở vì chưa chuyển toàn bộ cơ chế native.

## Bằng chứng tệp đầu vào

Tệp người dùng cung cấp: `BitLife-v3-25-mod.apk`, 262.640.127 byte. SHA-256: `8c1248cb94a7e8cfb4fa8cc6ca2f7886e7cbe8dd318d7ef2abc6b428ab469234`. Manifest nhị phân ghi package `com.candywriter.bitlife`, version `3.25`. UnityFS ghi `6000.3.9f1`; IL2CPP metadata version 39; thư viện máy ARM64. Đây là tệp mod được cung cấp, chưa xác minh nó giống bản phát hành chính thức.

Phân tích tĩnh, không cài hoặc chạy APK. Đọc 1.085 TextAsset bằng [UnityPy](https://github.com/K0lb3/UnityPy), giải được 969 bảng CSV, 87.145 dòng thô. Các dòng này gồm bảng tên, tag, emoji và bảng kỹ thuật; **không phải 87.145 sự kiện**. Một số dữ liệu quốc gia/avatar vẫn là .NET binary và chưa chuyển.

[Cpp2IL](https://github.com/SamboyCoding/Cpp2IL) prerelease 2022.1.0-pre-release.21 đọc được metadata và ánh xạ 149.917 method definitions. Cả đầu ra Diffable C# và đầu ra có tên `dll_il_recovery` đều chưa phục hồi thân hàm gameplay. Kiểm riêng `Assembly-CSharp.dll`: 66.547 method definitions, 66.134 có RVA, **toàn bộ 66.134 thân hàm là `ldnull; throw`**. Không gọi các DLL này là source C# đầy đủ hoặc đem chạy trên web.

## Nội dung đang chạy

| Nội dung                        | Kết quả 1.2                                                                                                                                                   |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 7 bảng tình huống lõi           | 1.254 dòng kiểm kê, 1.074 đưa vào engine                                                                                                                      |
| Lựa chọn trong 1.074 tình huống | 3.948 lựa chọn, giữ hiệu ứng số có trong CSV                                                                                                                  |
| 180 dòng lõi còn lại            | 119 cần xác minh lọc hoàng gia/ma cà rồng; 32 nghề đặc biệt; 29 thuộc tính bạn bè chưa có                                                                     |
| Nghề nghiệp                     | Danh mục đủ 168 dòng; điều kiện tuyển được kiểm trong engine; nghề đặc biệt hoặc cần bằng lái chưa mở có lý do khóa                                           |
| Bậc nghề trên web               | 449 bậc; các track ghi rõ chức danh được dịch thủ công; các marker `Corporate`, `Abbreviated`, `Working Class` dùng 3 bậc web vì chưa có logic mở rộng native |
| Chuyên ngành                    | 28 chuyên ngành từ các yêu cầu nghề; thêm 5 chương trình nha khoa, luật, điều dưỡng, dược, thú y theo quy tắc học của web                                     |
| Crypto                          | 21 tên/ticker thực trong bảng APK; giữ Expense Score/Winner Score trong dữ liệu nghiên cứu                                                                    |
| Nội dung tự viết trước đây      | 358 sự kiện, 150 hoạt động, 48 nghề, các truyện/nhánh và hệ tài sản vẫn được giữ                                                                              |

`src/content/apk/coverage.json` kiểm kê từng dòng lõi chưa chuyển và 48 bảng tình huống khác. Tổng 55 bảng chứa lựa chọn có 3.497 dòng; không cộng lựa chọn, biến thể hoặc các bảng kỹ thuật thành sự kiện. `event-sources.json` liên kết ID web với bảng, Index và vị trí bản ghi. Khi source có Index trùng, suffix vị trí bản ghi giữ cả hai dòng, không ghi đè.

## Các quy tắc viết lại và giới hạn

- Chọn **Chơi bộ Việt hóa từ APK** khi tạo đời mới. Bản lưu 1.0/1.1 tự nâng version nội dung, giữ RNG, tiền, lịch sử và pending cũ; không tự đổi bộ nội dung của đời cũ. Đời con kế thừa bộ nội dung của đời cha/mẹ.
- Khi có tình huống APK phù hợp, engine dành 75% lần bốc cho pool APK; các lần còn lại dùng pool chung. Đây là tỉ lệ của web. Cooldown 5 năm, tối đa 24 lần cũng là chính sách web, không phải xác suất native đã phục hồi.
- Giữ hiệu ứng Appearance/Happiness/Intelligence, Karma/Discipline/Behavior/Respect, Job/Friend Impact. Job tác động đúng hiệu suất; Friend tác động người bạn được ràng buộc. Bốn thuộc tính bổ sung giới hạn 0–100, khởi điểm 50, hiện trong nhật ký.
- CSV lõi ghi một Narrative cho mỗi Choice; web dùng kết quả xác định đó, không tự thêm xác suất thành công/thất bại. Các bảng chỉ có Success/Failure hoặc native expressions chưa được đưa vào pool bằng xác suất giả.
- Template có seed lưu riêng; không bốc lại khi render/reload. Tên, vốn từ tag và đại từ trung tính dùng thế giới web; `<rb>`, `<rb1>`, `<rb2>` tham chiếu biến thể đã chọn. Chưa khẳng định khớp toàn bộ resolver native. Không dùng eval, HTML injection hay BinaryFormatter.
- Tiền lương đầu/cuối lấy từ bảng USD và quy đổi **1 USD trong bảng = 1.000 đơn vị mô phỏng** trước hệ số xuất thân. Đây là hiệu chỉnh gameplay, không phải tỷ giá thật. Lương các bậc trung gian nội suy; thăng tiến, thuế/chi phí/hưu trí dùng engine web. Các track một bậc giữ lương đầu; cơ chế tăng lương trong cùng bậc native chưa chuyển.
- Kiểm tuổi, giới tính, bằng/chuyên ngành, kinh nghiệm tổng, trí tuệ/ngoại hình/sức khỏe, thiện tâm, tiền án, xe và độc thân khi tuyển. Bằng lái/native special careers chưa có vẫn bị khóa ở engine. Bệnh nghề, xét nghiệm, sa thải thuê ngoài, stress, fame cap và tác động cha mẹ của từng nghề chưa phục hồi; không xem đủ 168 dòng là đủ mọi hành vi nghề.
- 21 coin dùng mô hình rủi ro, thanh khoản, boom/sụp đổ và niêm yết của web. Winner Score không được suy diễn thành xác suất lợi nhuận gốc. Giá khởi điểm là thang mô phỏng theo Expense Score.
- Dịch máy cục bộ ở bước biên soạn; tên nghề, chuyên ngành và các track chức danh được sửa thủ công. Các đoạn tình huống còn cần biên tập ngữ cảnh; chưa được người dịch rà toàn bộ. Bản phát hành không gọi dịch thuật qua mạng khi chơi.

## Những hệ chưa đạt mức 1:1

48 bảng lựa chọn còn lại bao gồm diễn viên, doanh nghiệp, người mẫu, nhạc sĩ, đấu sĩ, phi hành gia, mafia, chính trị, casino mở rộng, gián điệp, giáo phái, zoo, vampire, racing, bảo tàng/chợ đen, podcast, SoundCloud và các tình huống ngoại khóa. Các bảng Genesis có filter/action expression và state machine riêng. Chúng đã được nhận diện trong kiểm kê, nhưng chưa được gắn những nút giả coi như đã triển khai.

Các hệ Fame/Love/Mind & Body/Salon, đầu tư và Blackjack/Ba cao trước đó vẫn là hệ web đã viết. Các ảnh chụp BitLife dùng đối chiếu; không đóng gói lại ảnh, icon, DLL, APK, SDK quảng cáo hoặc các bản mod/in-app purchase bypass.

## Kiểm tra

`tests/apk-port.test.ts` chạy mỗi lựa chọn của 1.074 tình huống, roundtrip pending và kết quả, điều kiện student/job/prison/orphan, lương tuổi 16, yêu cầu chuyên ngành/bằng lái và migration đời cũ. Browser test kiểm nhập pending, reload giữ cùng văn bản, lựa chọn áp dụng đúng Job/Karma, danh mục nghề và tiếng Việt. Các kiểm tra này xác nhận adapter web, không chứng minh đầy đủ runtime Android. Chưa QA trên điện thoại vật lý hoặc đối chiếu toàn bộ xác suất native.
