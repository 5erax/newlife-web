# Việt hóa dữ liệu BitLife 3.25 cho NewLife Web

Theo dõi phạm vi đầy đủ tại [issue #111](https://github.com/5erax/newlife-web/issues/111). Bản 1.2 là một bản chuyển nội dung có thể chơi; issue vẫn mở vì chưa chuyển toàn bộ cơ chế native.

## Các đợt chuyển nội dung

### Trạng thái bạn bè 1.4

[Task #114](https://github.com/5erax/newlife-web/issues/114) bổ sung 29 dòng còn thiếu của bảng bạn bè: bảng này đã có đủ **37 tình huống/120 lựa chọn**, tăng 91 lựa chọn. Tổng hiện tại **1.227 tình huống/4.507 lựa chọn**; còn 151 dòng lõi (119 hoàng gia/ma cà rồng, 32 nghề đặc biệt) và 45 bảng/2.119 dòng khác. Đây là độ phủ dòng tình huống, không phải tỷ lệ hoàn thiện toàn bộ game.

- Giữ sáu trường từ nguồn: Friend Min Craziness, Has Job, Is Student, Has Child, Is Married, Is Enemy; kiểm tuổi/giới tính/đang sống và toàn bộ điều kiện trên cùng một người bạn. Friend Impact tác động đúng người được chọn bởi bộ lọc, kể cả khi người khác đứng trước trong danh sách. `Friend Is Enemy` trống dùng nhóm bạn bình thường; đánh dấu x dùng nhóm thù địch theo chính sách lọc của web.
- Hồ sơ NPC gồm tính bốc đồng 0–100, học/việc, hôn nhân, số con và thù địch. Với đời cũ chưa có hồ sơ, dùng hash ổn định của ID, không bốc RNG và không tự ghi hồ sơ khi render/import. Khi NPC qua năm hoặc quan hệ thay đổi, hồ sơ được lưu. File 1.3 nâng lên 1.4 giữ RNG/tiền/pending; 1.198 sự kiện đã phát hành giữ canonical.
- **Mốc NPC là quy tắc viết lại của web:** học từ 6 tuổi, kết thúc tuổi 21–24; làm từ 16 tuổi, một số đi làm khi học, một số không có việc; nghỉ việc tuổi 65–69. Hash ID chọn mốc kết hôn 22–37, 1–2 con sau đó. Mốc gia đình chỉ diễn ra đúng năm vượt ngưỡng và khi phù hợp, không phát lại mốc cũ sau chia tay/ly hôn. Khi là người yêu/vợ chồng, học/việc vẫn cập nhật, hôn nhân theo vai trò và con theo lịch sử gia đình đã biết. Giới hạn số con NPC 250 theo giới hạn hồ sơ web.
- **Quan hệ thù địch là quy tắc web:** từ 6 tuổi, còn thời gian, ngoài tù; mỗi thao tác mất 1 điểm thời gian, tối đa 2 lần đổi trạng thái/năm. Tuyên bố thù địch giảm gắn bó xuống tối đa 10 và hạnh phúc −3; làm hòa cần gắn bó 40+, hạnh phúc +3. Trò chuyện/tặng quà/xin lỗi có thể xây lại gắn bó; hỗ trợ/hẹn hò và đi cùng chuyến đi bị chặn khi thù địch. Người đã kết hôn không mở hẹn hò mới.
- Không phục hồi lịch nghề/học, tuổi gia đình, xác suất chấp nhận hòa giải hoặc đầy đủ cây gia đình NPC native. Những thuộc tính này có trạng thái thực trong web, không phải cách đánh dấu mọi tình huống luôn đủ điều kiện. Không gọi đây là mô phỏng NPC BitLife 1:1.
- Kiểm bằng `tests/npc-friends.test.ts`, toàn bộ lựa chọn trong `tests/apk-port.test.ts`, migration/bounds/đổi vai trò/mốc năm và E2E tuyên bố thù địch → reload → xây lại gắn bó → hòa giải. Đời dùng bộ web giữ cách vận hành/RNG cũ.

Bản 1.3 hiện có **1.198 tình huống/4.416 lựa chọn**: giữ 1.074 tình huống lõi và thêm đủ 59 dòng du lịch (39 kỳ nghỉ, 20 tàu biển), 36 dòng cắm trại, 29 dòng leo núi. Các bảng mới chỉ bốc khi dùng hoạt động tương ứng; không vào pool tăng tuổi. 180 dòng lõi và 45 bảng/2.119 dòng khác vẫn chưa chuyển, không coi toàn bộ APK đã hợp nhất.

### Quy tắc chuyến đi 1.3

- Lên núi, Cắm trại, Đi nước ngoài và Du lịch tàu biển có danh sách người đồng hành tùy chọn. Engine kiểm ID, quan hệ và thú cưng còn sống; tình huống cần chó không dùng mèo hoặc thỏ thay thế. Bộ web cũ giữ cách hoạt động trước đây.
- Lọc tuổi và `Requires Companion`/`Companion Type`, các yêu cầu friend từ tag; giữ Choice/Narrative và hiệu ứng số theo nguồn. `Smarts` dùng trí tuệ, `Health` dùng sức khỏe. **Enjoyment chuyển sang hạnh phúc của web**, không phải phục hồi chỉ số enjoyment native riêng của một chuyến đi.
- Bốc một tình huống đủ điều kiện với trọng số bằng nhau sau hoạt động; cooldown 5 năm/tối đa 24 lần của web. Chi phí, thời gian, hạnh phúc nền của hoạt động và nhãn địa điểm là quy tắc web. Chưa phục hồi phân phối tình huống/địa điểm, biến thể giống/chủ thú cưng hoặc kết quả tổng kết chuyến đi native.
- Lưu activityId, companionId và templateSeed cùng pending. Reload/import kiểm lại ngữ cảnh; lựa chọn kết thúc trở về năm hiện tại, không bốc tử vong hoặc tính phí lần nữa. `<rb3>` và các biến thể thứ ba trở lên được ghi nhớ.
- **Anomaly nguồn:** hiking bản ghi 27, `Enjoyment Impact 1` là `1-`, không phải số hợp lệ. Giữ tình huống và mọi lựa chọn, dùng **0 như override trung tính của web**, lưu raw/field/record trong `coverage.unverifiedEffects`. Chưa xác minh đây là +1 hay −1; không tính là hiệu ứng native đã phục hồi. Generator kiểm định dạng mọi hiệu ứng không rỗng và ghi anomaly thay vì đổi âm thầm.
- `tests/apk-trips.test.ts` chạy cả 124 dòng, mọi lựa chọn, tác động chỉ số, roundtrip, đồng hành chết/không tồn tại và file giả mạo ngữ cảnh. E2E đi qua nhập đời trưởng thành → chọn chó → cắm trại → reload → lựa chọn → trở về hoạt động. Review chạy thêm 3.968 render (124×32 seeds).

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

`src/content/apk/coverage.json` kiểm kê từng dòng lõi chưa chuyển và 45 bảng tình huống khác. Tổng 55 bảng chứa lựa chọn có 3.497 dòng; không cộng lựa chọn, biến thể hoặc các bảng kỹ thuật thành sự kiện. `event-sources.json` liên kết ID web với bảng, Index và vị trí bản ghi. Khi source có Index trùng, suffix vị trí bản ghi giữ cả hai dòng, không ghi đè.

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

45 bảng lựa chọn còn lại bao gồm diễn viên, doanh nghiệp, người mẫu, nhạc sĩ, đấu sĩ, phi hành gia, mafia, chính trị, casino mở rộng, gián điệp, giáo phái, zoo, vampire, racing, bảo tàng/chợ đen, podcast, SoundCloud và các tình huống ngoại khóa. Các bảng Genesis có filter/action expression và state machine riêng. Chúng đã được nhận diện trong kiểm kê, nhưng chưa được gắn những nút giả coi như đã triển khai.

Các hệ Fame/Love/Mind & Body/Salon, đầu tư và Blackjack/Ba cao trước đó vẫn là hệ web đã viết. Các ảnh chụp BitLife dùng đối chiếu; không đóng gói lại ảnh, icon, DLL, APK, SDK quảng cáo hoặc các bản mod/in-app purchase bypass.

## Kiểm tra

`tests/apk-port.test.ts` chạy mỗi lựa chọn của 1.074 tình huống, roundtrip pending và kết quả, điều kiện student/job/prison/orphan, lương tuổi 16, yêu cầu chuyên ngành/bằng lái và migration đời cũ. Browser test kiểm nhập pending, reload giữ cùng văn bản, lựa chọn áp dụng đúng Job/Karma, danh mục nghề và tiếng Việt. Các kiểm tra này xác nhận adapter web, không chứng minh đầy đủ runtime Android. Chưa QA trên điện thoại vật lý hoặc đối chiếu toàn bộ xác suất native.

### Checkpoint 14/10/2026 — bạn bè 1.4

Nhánh `feature/apk-friend-states`, task #114. `d5c0337` lưu hồ sơ NPC và thao tác thù địch; lượt tích hợp tiếp theo mở cả bảng 37 dòng, nâng nội dung/file lưu lên 1.4. Tiến độ CI/merge/phát hành được cập nhật trong issue, không suy ra từ số version trong mã.

- `npm test`: **86/86**, 15 file. `npm run build`: typecheck, kiểm nội dung và PWA qua. `npm run test:e2e`: **13/13** trên build cuối, gồm offline, nhập lỗi không ghi đè và xung đột hai tab.
- Kiểm tất cả 37 dòng/120 lựa chọn, sáu thuộc tính trên cùng NPC, Friend Impact đúng người; so sánh canonical xác nhận toàn bộ 1.198 sự kiện đã phát hành không đổi.
- Rà soát độc lập phát hiện học/việc bị đóng băng khi chuyển bạn thành người yêu/vợ chồng và mốc gia đình bị phát lại. Đã sửa và thêm hồi quy; thử đưa lỗi đóng băng trở lại làm kiểm thử thất bại, khôi phục mã đúng rồi chạy xanh. Tự rà soát tìm thêm lỗi mất số con có trước khi chia tay; kiểm thử đỏ trước sửa, xanh sau sửa và giữ qua roundtrip.
- Đã xem ảnh giao diện Quan hệ tiếng Việt ở viewport điện thoại. Lượt rà soát độc lập cuối không hoàn tất do giới hạn sử dụng công cụ; không ghi nhận nó là một lượt duyệt thành công. CI và QA hosted cần hoàn tất trước khi đóng task.
- Chưa kiểm trên điện thoại vật lý; bundle JS khoảng 4,25 MB (gzip 630 KB), cảnh báo chunk lớn còn tồn tại. 151 dòng lõi và 45 bảng/2.119 dòng vẫn chờ cơ chế phù hợp; epic #111 còn mở.
