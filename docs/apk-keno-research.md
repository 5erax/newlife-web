# Keno: bằng chứng native — 14/10/2026

[Task #126](https://github.com/5erax/newlife-web/issues/126), thuộc [#118](https://github.com/5erax/newlife-web/issues/118) và [#111](https://github.com/5erax/newlife-web/issues/111). Đây là nghiên cứu để chuyển đúng luật, chưa thêm Keno vào bản chơi. Game phát hành vẫn là 1.7.

## Tái tạo và phạm vi

Chạy `python tools/inspect-bitlife-keno.py ANALYSIS_DIRECTORY` trong môi trường phân tích có `capstone` và `pyelftools`. Thư mục chứa `libil2cpp.so` và `global-metadata.dat` đã trích từ APK người dùng cung cấp. Công cụ pin SHA của cả hai tệp, ánh xạ từng raw Offset qua ELF PT_LOAD, giải mã đủ độ dài 11 hàm và hiệu chuẩn getter giá cổ phiếu đã biết. Không chạy APK/DLL, không thêm dependency cho game. Chỉ lưu stdout JSON khi exit code bằng 0; bản đã kiểm nằm ở `docs/qa/apk-keno-native.json`.

Tên/Offset/độ dài được đối chiếu khai báo Cpp2IL `attributeinjector`, output `diffable-cs`, Unity6000.3.9f1, metadata39. Thân C# rỗng là stub, không phải logic phục hồi. Proof lưu disassembly, hash từng hàm và 12 fixture từ các nhánh payout đọc được; không chứa binary hoặc hình ảnh APK.

| Hàm | Raw Offset | Kết luận đã kiểm |
| --- | --- | --- |
| MiniGameKeno.InitWithParameters | 0x2E1C948 | Trường gridSize0x38 nhận cặp float32 `(5,4)` từ VA0xFB49D8. |
| AllNumbersPicked | 0x2E1E998 | Đếm các ô đã chọn, trả true khi số lượng lớn hơn2. Đây là gate đủ số; chưa chứng minh toàn bộ giới hạn chọn trong input handler. |
| PickKenoBalls | 0x2E1EAD8 | Gọi GetRandomNumber với `(1,21)`, loại bóng đã tồn tại, lặp tới sáu bóng; tăng matchedCount khi số bốc thuộc lựa chọn. |
| KenoBallExists | 0x2E1F354 | Duyệt Number tại offset0x24 và so sánh số ứng viên để tránh trùng. |
| ExitGame | 0x2E1DC64 | Ghi LastWinnings theo số trúng; trúng3 ghi WinType2. |
| ScenarioGameKeno.MiniGameCompleted | 0x3569680 | Với nhánh thắng thường, cộng LastBetAmount + LastWinnings rồi gọi SimFinances.AdjustBankBalanceByAmount. Casino sở hữu có nhánh xử lý khác. |

## Bảng kết toán đã kiểm

`LastBetAmount` nằm tại session0x10, `LastWinnings` tại0x14; matchedCount tại minigame0xA8. Bộ đọc thực thi riêng compare/branch/float/store của khối ExitGame với đối tượng hợp lệ, rồi so bảng expected độc lập cho bốn kết quả và ba mức cược1/1.000/1.000.000. Các mức này phục vụ kiểm công thức, không xác nhận hạn mức cược native.

| Số trúng | LastWinnings / tiền cược | Đánh dấu |
| --- | --- | --- |
| 0 | −1 | Không ghi thắng đặc biệt |
| 1 | +1 | Không ghi thắng đặc biệt |
| 2 | +2 | Không ghi thắng đặc biệt |
| 3 | +3 | WinType2 |

Giá trị dương là phần thắng lưu trong session; caller hoàn tiền cược kèm phần thắng. Còn phải theo nơi trừ tiền trước ván và phần kiểm hạn mức/cap trong SimFinances trước khi xác nhận toàn bộ luồng tiền tương đương native. Script không mô phỏng toàn bộ CLR, UI hay allocator; chỉ thực thi khối payout đã kiểm với phép nhân chính xác ở các fixture đã chọn.

## Nhánh đổi kết quả của nhà cái

PickKenoBalls đọc `session.Game.HouseWinRate` (game0x20). Khi matchedCount≥1 và HouseWinRate>0, hàm gọi GetRandomNumber `(0,100)`; nếu HouseWinRate lớn hơn số bốc, mã xóa matchedCount và đi vào nhánh thay các bóng trúng. Nhánh thay lại loại số đã có và số thuộc lựa chọn của người chơi. Không được bỏ nhánh này rồi gọi kết quả ngẫu nhiên đều là APK1:1.

Các span và branch target được script kiểm trực tiếp. Full disassembly giữ cả đường duyệt/xóa/tạo bóng để tiếp tục port. Nguồn cấp HouseWinRate cho casino thường/casino sở hữu vẫn chưa truy hết; constructor Keno không ghi trường0x20. Không suy từ điều này rằng mọi đường vào game đều có HouseWinRate0, và không tự đặt tỷ lệ web.

## Phần còn thiếu trước khi đưa lên web

- GetRandomNumber đi qua virtual dispatch của RNG. Đã kiểm đối số `(1,21)`/`(0,100)`, chưa xác minh endpoint/seed/chuỗi số native; chưa công bố xác suất chính xác từ các đối số này.
- Giới hạn chọn số, toàn bộ cấp HouseWinRate, tiền cược bị trừ ở entry và giới hạn tiền. `GetSkippedGameWinnings` được lưu riêng trong proof, chưa dùng làm luật của minigame thật.
- Engine seeded, state kết quả, validation/save replay và nâng file1.7, UI tiếng Việt, kiểm tra offline/reload/hosted. Không đổi save hoặc gameplay trong commit nghiên cứu.

Đã chạy self-check 12 fixture/11 hàm; tái tạo output giống từng byte. Thử sai hash đầu vào bị từ chối; thay expected nhánh trúng3 thành2 gây AssertionError, và thay expected phần thắng trúng3 từ3× thành2× cũng gây AssertionError. Không cần chạy lại toàn bộ game local vì diff chỉ gồm công cụ phân tích/tài liệu/proof; workflow GitHub vẫn chạy các gate game trước khi merge. Chưa chạy Android runtime hay kiểm điện thoại vật lý.
