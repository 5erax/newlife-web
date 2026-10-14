# Việt hóa dữ liệu BitLife 3.25 cho NewLife Web

Theo dõi phạm vi đầy đủ tại [issue #111](https://github.com/5erax/newlife-web/issues/111). Bản 1.2 là một bản chuyển nội dung có thể chơi; issue vẫn mở vì chưa chuyển toàn bộ cơ chế native.

## Các đợt chuyển nội dung

### Máy xèng 1.7

[Task #124](https://github.com/5erax/newlife-web/issues/124) bổ sung minigame Máy xèng trong bộ APK. Bảng thưởng đã đọc từ ARM64 và giải chuỗi qua ELF relocations/metadata39: AAA20, BBB18, CCC15, DDD12, EEE10, FFF8, ABC6, FED3; đúng hai A/B/C ở bất kỳ vị trí nào lần lượt trả5/4/3. Đây là **tổng trả gồm cược**; native OnSpinDone cộng cược×hệ số rồi trừ cược, nên AAA lãi19lần, thua mất cược.

- Native không quay ba ô độc lập: ngưỡng thắng float32≈15%, trọng số nhóm ba giống cao4%, ba giống thấp6%, hai giống60%, đặc biệt30%. Chọn tổ hợp trong nhóm tương ứng; 216tổhợp gồm53thắng/163thua. `tools/inspect-bitlife-slots.py` pin hash binary/metadata, hiệu chuẩn getter giá, giải literal qua relocations và kiểm bảng/float constants; bằng chứng disassembly tại `docs/qa/apk-slots-native.json`. Không chạy APK/DLL.
- Web dùng Mulberry32 thay RNG Unity/GameReference, số nguyên an toàn thay float32 cho tiền, biểu tượng chữ A–F và quay nguyên tử thay coroutine/animation Android. Không khẳng định giống từng bit hoặc toàn bộ native runtime. Luật phiên tuổi15/20ván/năm, hạn mức/ban/nghiện giữ chính sách web; bảo vệ headroom theo lãi tối đa19lần. Các ván bài/roulette cũ giữ logic riêng.
- Lưu100biênnhận seed/cược/biểu tượng/net/tuổi; import bốc lại trên RNG tạm để kiểm kết quả và tính lại net, không đổi RNG đời. File1.6 nâng1.7 giữ tiền/danh mục/vị thế/RNG và lịch sử bài/roulette cũ. Renderer/reload không quay lại.
- Local100unit/17browser, typecheck/content/build/PWA PASS; 216bảngthưởng,50.000lượt kiểm trọng số/reproducibility, input/tuổi/phạm vi/cược/filegiả và migration. Đã xem ảnh máy xèng390px và chạy lại luồng mới sau format. Lượt full Vitest mặc định trên Windows gặp8worker exit0xC0000409, không ghi là PASS; chạy lại đầy đủ với `--maxWorkers=2` qua100test. Nguyên nhân sâu trong worker native chưa xác định; CI Linux dùng cấu hình hiện có để kiểm riêng. Chưa QA điện thoại thật.
- #118/#111 vẫn mở: Craps, Cao–thấp, Keno, Cá cược thể thao, Texas Hold’em, Đảo ba lá và các hệ khác còn thiếu; Blackjack chưa đối chiếu đủ native. #122côngthứcgiá vẫn mở. CI/hosted/phát hành được cập nhật riêng trong issue trước nghiệm thu #124.

### Đánh bạc và đầu tư 1.6

Đã nghiệm thu các lát cắt #119/#120 sau PR #121, hai CI đầy đủ và sáu luồng hosted PASS; Vercel production đã lên main `c692955`. Công thức thị trường còn mở tại #122. [Bằng chứng nghiên cứu vòng đời](apk-market-research.md) ghi riêng những nhánh native đã xác minh và phần còn thiếu.

[Epic #118](https://github.com/5erax/newlife-web/issues/118) giữ phạm vi 1:1 của hai hệ. Đợt này triển khai [roulette #119](https://github.com/5erax/newlife-web/issues/119) và [catalog cổ phiếu #120](https://github.com/5erax/newlife-web/issues/120); không nghiệm thu cả hai hệ chỉ vì các lát cắt này đã chạy.

- **Luật roulette đã đối chiếu ARM64:** 13 ô từ 0 đến 12, số lẻ đỏ/số chẵn đen, 0 không màu. `MultiplierForBetType` đọc bảng `[13,1,13]`; `OnSpinDone` ghi số tiền cược nhân hệ số khi thắng, âm tiền cược khi thua, rồi cộng vào tổng kết quả phiên. Vì vậy thắng số (kể cả 0) **lãi ròng 13 lần**, thắng màu lãi ròng 1 lần; thua mất cược. Không nhầm hệ số này thành tổng trả 13 lần hoặc đổi sang luật roulette 37/38 ô. Luật cược số này có kỳ vọng dương nếu các ô đồng xác suất; đây là hành vi đã đọc từ bản APK được cung cấp, không phải lời hứa luôn thắng.
- Bằng chứng tại `docs/qa/apk-roulette-native.json`: hash binary/metadata, offset raw, địa chỉ virtual, hash và disassembly sáu hàm; công cụ `tools/inspect-bitlife-roulette.py` đọc tĩnh, không chạy DLL/APK. Chạy bằng Python có `dnfile`, `capstone`, `pyelftools`, truyền thư mục phân tích có `libil2cpp.so`, `global-metadata.dat`, `cpp2il-addresses/Assembly-CSharp.dll`. Cpp2IL inject offset raw cho bản này: phải ánh xạ qua ELF PT_LOAD, không trừ nhầm virtual address. Tự kiểm bằng getter giá cổ phiếu `ldr d0,[x0,#0x30];ret`, lệnh truyền giới hạn 13, bảng hệ số và đủ hàm bằng chứng. Không commit binary trích xuất.
- **Phần roulette viết lại trên web:** Mulberry32 seeded thay RNG Unity; lượt quay thanh toán nguyên tử và lưu biên nhận (cược/lựa chọn/kết quả/seed/tuổi/lãi ròng), giữ 100 lượt gần nhất. Import kiểm lại kết quả theo seed và hệ số, từ chối dữ liệu giả. Tuổi 15, 20 ván/năm, hạn mức tiền/thu nhập, nghiện/bị mời ra, số nguyên an toàn và trần tài sản là chính sách web hiện có; chưa chứng minh khớp native. Các ván Blackjack/Ba cào vẫn giữ cơ chế và thứ tự RNG trước đó.
- **Đủ catalog cổ phiếu gốc:** 107 mã của `a16_financial-universal-stocks-enc`, 8 ngành; giữ Name/Symbol/Sector/Min Price/Max Price/Winner Score/Hero Ownership Cap và provenance dòng. Tên công ty/mã giữ như nguồn, nhãn ngành và thao tác bằng tiếng Việt. Đời APK mới dùng 107 cổ phiếu và 21 coin gốc; đời/file cũ giữ nguyên danh mục, giá, vị thế và RNG, không tự thay tài sản đang nắm. Muốn danh mục mới, tạo đời mới dùng bộ APK.
- **Giá/lợi nhuận cổ phiếu chưa phải native:** giá khởi điểm trung điểm Min/Max nhân 1.000, rủi ro 50, thanh khoản 0,9, yield 1%, chu kỳ năm và phí mỗi chiều 1% dùng mô hình web. Winner Score không được suy ra thành xác suất thắng; Hero Ownership Cap được giữ trong dữ liệu nguồn nhưng chưa áp dụng khi công thức chưa được xác minh. Crypto lifecycle/tháng, tư vấn/tin/ý kiến, thuế, phí và giới hạn sở hữu native còn chờ phục hồi. Việc đủ 107 mã không đồng nghĩa đầu tư đã 1:1.
- Kiểm tất cả **195 tổ hợp cược/kết quả**, thanh toán/lưu/reload, input không bị sửa và biên nhận không giữ tham chiếu tới action; boundary/headroom và migration 1.5. Mua/bán/roundtrip từng mã trong **107 cổ phiếu**, không tạo lời từ giao dịch tức thời sau phí. Đối chiếu canonical xác nhận sáu catalog sự kiện/provenance/nghề/chuyên ngành/coin/phỏng vấn cũ không đổi. Bài kiểm thử 810 đáp án vẫn kiểm đủ reducer/roundtrip, dùng fixture nền chung và timeout riêng 30 giây cho danh mục lớn hơn, không giảm số trường hợp.
- Local: **97 unit/16 browser PASS**, typecheck/content/build/PWA PASS; **100 cuộc đời APK, 4 chiến lược, 0 lỗi** (báo cáo `docs/qa/apk-v16-simulation.json`). Thử thay hệ số cược số 13 thành 12 làm kiểm thử thất bại, khôi phục rồi chạy xanh. Xem ảnh 390px phát hiện số trên nền bàn khó đọc; đã sửa màu/độ tương phản và chạy lại hai luồng mới. Bundle JS 4,37 MB/gzip 652 KB; chưa QA điện thoại vật lý. CI/hosted QA và quyết định nghiệm thu ghi riêng trong issue, không coi kết quả local là bằng chứng đã deploy.

| Phần còn phải đối chiếu trong #118 | Trạng thái sau 1.6 |
| --- | --- |
| Roulette | Luật số/màu/lãi ròng đã xác minh; luật phiên/hạn mức và RNG vẫn web |
| Blackjack | Bàn web có rút/dừng; chưa xác minh toàn bộ luật native |
| Craps, Cao–thấp, Keno, Máy xèng, Cá cược thể thao, Texas Hold’em, Đảo ba lá | Chưa triển khai các minigame native |
| Xổ số, đua ngựa, cược đấu võ; sở hữu/quản lý casino | Phạm vi riêng còn mở, không thay bằng nút kết quả ngẫu nhiên |
| Cổ phiếu | 107 mã/8 ngành và trường nguồn đủ; công thức native còn mở |
| Crypto | 21 coin gốc có thể giao dịch; lifecycle/tháng và xác suất native còn mở |
| Trái phiếu, quỹ, cổ phiếu giá thấp | Mô hình web; dữ liệu/đáo hạn/rủi ro native còn mở |
| Cố vấn, tin tài chính, ý kiến, thống kê | Công cụ web; bộ nội dung và resolver native còn mở |

### Phỏng vấn tuyển dụng 1.5

[Task #116](https://github.com/5erax/newlife-web/issues/116) chuyển `a16_interview-questions-enc`: **46 câu hỏi, 796 đáp án thường và 14 đáp án mặc định**, giữ Choice Score/Default Choice Score 1–5 và Commonness Score. ID theo vị trí bản ghi, mỗi câu có provenance bảng/record trong `interviews.vi.json`. Thêm 9 bản dịch mặc định thủ công; generator dừng trước ghi tệp nếu còn thiếu bản dịch. Không cộng 810 đáp án thành 810 sự kiện.

- Xin một nghề thuộc catalog APK kiểm điều kiện rồi mở phỏng vấn. Lưu ID lượt/vị trí/tuổi/câu hỏi và ba đáp án đã chọn; đáp án mặc định từ bảng được thêm khi có. Reload/render không bốc lại hoặc đổi RNG. UI hỗ trợ phím số và rút hồ sơ; tự lưu như lựa chọn khác.
- Kiểm điều kiện nghề cả lúc mở và trả lời; chặn tăng tuổi, thay nghề, truyện và mọi hành động reducer khác trong lúc chờ. Import từ chối ID/đáp án lạ, đáp án trùng, sai tuổi, sai bộ nội dung, trạng thái đồng thời với sự kiện/lời mời/casino hoặc đang thụ án. Điểm đọc từ catalog, không nhận điểm do client gửi.
- Trúng tuyển mới đổi nghề và xóa hưu; tiền/lương không trả ngay, thu nhập bắt đầu ở năm làm việc tiếp theo như engine hiện tại. Bị từ chối/rút giữ nghề, lương, hiệu suất và hưu cũ. Đời dùng bộ web vẫn nhận việc ngay và không thêm lượt RNG/thời gian.
- **Quy tắc web chưa phải công thức native:** chọn câu theo trọng số Commonness Score, lấy ba đáp án thường ngẫu nhiên không lặp, thêm đáp án mặc định nếu có, nhận việc khi điểm ≥4/5, mất một điểm thời gian khi mở (không hoàn lại khi rút). Không bảo đảm ba đáp án lấy mẫu có đáp án đạt ngưỡng. Metadata có DataInterviewQuestion/Answer và ScenarioJobInterview, `_choice4IsDefault`, `_bestAnswerScore`; thân hàm chưa phục hồi nên không suy diễn chúng thành bằng chứng xác suất/tiêu chuẩn trúng tuyển gốc.
- Tổng sự kiện vẫn 1.227/4.507 lựa chọn, riêng phỏng vấn thêm 46/810. Còn **151 dòng lõi và 44 bảng/2.073 dòng** chưa chuyển. Nội dung công việc/salary/coin và canonical 1.227 sự kiện cũ không đổi.
- Local: **91 unit/14 browser PASS**, typecheck/content/build/PWA PASS; **100 cuộc đời APK, 4 chiến lược, 0 lỗi**. Tất cả 810 đáp án chạy qua reducer/roundtrip; boundary/ID giả/withdraw/refusal/giữ nghề cũ/migration1.4 có kiểm thử. Thử thay ngưỡng 4 thành 5 làm kiểm thử thất bại, khôi phục và chạy xanh. Đã xem ảnh dialog tiếng Việt ở viewport 390px; CI/hosted QA chưa xác nhận tại checkpoint này.

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

Phần 1.4 đã nghiệm thu sau checkpoint trên: PR #115 merge tại main `6eeee01`, CI push38485333184/PR38485393155 SUCCESS, ba luồng APK hosted trên Site PASS. Vercel production READY từ main6eeee01; Sites public version7, sourceeb67645, deployment `appgdep_6acec37aef5c8191ab68618824b9948a` SUCCEEDED. #114 đã đóng; #111 còn mở. Bản 1.5 ở nhánh `feature/apk-job-interviews`, #116 vẫn cần CI/review/hosted QA trước nghiệm thu.
## Nghiên cứu Keno tiếp theo

[Bằng chứng Keno](apk-keno-research.md) và [task #126](https://github.com/5erax/newlife-web/issues/126) xác minh khối payout, lưới5×4, sáu bóng và nhánh HouseWinRate. Đây là nghiên cứu, chưa có Keno chơi được trên web; RNG native, nguồn HouseWinRate và toàn bộ luồng tiền còn cần đối chiếu.

## Đợt casino và đầu tư 1.8

Theo [#128](https://github.com/5erax/newlife-web/issues/128), triển khai đồng thời Keno, Craps và phân tích danh mục/lọc8ngành cổ phiếu. Keno chọn đúng3số từ1–20, bốc6bóng không trùng, lãi−1/+1/+2/+3×cược theo0/1/2/3số trúng. Craps đọc bảng11tổng từ ARM64:7/11thắng,2/3/12thua,các tổng khác lắc tiếp; đây không phải luật giữ điểm của Craps phổ thông. `tools/inspect-bitlife-craps.py` pinhash và hiệu chuẩn ELF, xuất36fixture/6hàm vào `docs/qa/apk-craps-native.json`. Keno dùng proof12fixture/11hàm ở tài liệu nghiên cứu, input handler `HandleTouchDown` raw0x2E1C4A0 gọi AllNumbersPicked trước chọn ô mới nên giới hạn3số được xác minh tiếp.

Engine kết toán nguyên tử, giữ100biên nhận mỗi trò và replayseed khi nhập; các bản1.7nâng được, không thay RNG/portfolio/lịch sử cũ. Giao diện tiếng Việt cho chọn số/bóng/lần lắc/lãi ròng và giữ qua reload. Craps tự lắc các tổng trung gian tới kết quả, thay cho thao tác bấm từng lần của native; đây là chính sách UIweb đã công bố. Trần1000lần tạo kết quả là giới hạn chống vòng lặp bất thường của web, không tuyên bố là trần native.

Giới hạn: RNGseededweb và tiền integer hiện có; HouseWinRate dùng0cho casino web thường, chưa khớp các cấu hình casino native/casino sở hữu. Các nhánh điều chỉnh HouseWinRate củaKeno/Craps vẫn có trong proof, chưa được áp vào gameplay. Không tuyên bố toàncasino1:1, chưa phụ kiện thưởng đặc biệt hoặc sở hữu casino. High-Low/Poker/SportsBetting/ThreeCardShuffle/Blackjacknative vẫn cần theo luật đầy đủ. #118/#111còn mở.

Đầu tư bổ sung lọc8ngành từ catalog107cổphiếu và cơ cấu vị thế theo5nhóm: giá trị hiện tại/tỷ trọng/lãi chưa chốt, dùng đúng hàm định giá đơn vị lẻ của engine; nhóm rỗng0%, không chia0. Chuyển loại đầu tư xóa bộ lọc ngành để không làm mất danh sách coin/trái phiếu. Đây là công cụ phân tích vị thế; giá/chu kỳ/phí/thuế vẫn mô hìnhweb, #122còn mở. Không gán luật giá native chưa xác minh.
