# Đối chiếu thị trường native — 14/10/2026

[Task #122](https://github.com/5erax/newlife-web/issues/122), thuộc [epic #118](https://github.com/5erax/newlife-web/issues/118). Đây là bằng chứng phục hồi một phần cơ chế, chưa phải bản chuyển công thức thị trường hoàn chỉnh. Engine/gameplay vẫn dùng bản 1.6 đã phát hành.

## Bằng chứng có thể tái tạo

`tools/inspect-bitlife-market.py` đọc ELF ARM64 và các khai báo C# có attribute địa chỉ. Không chạy mã APK/DLL. Công cụ kiểm hash binary và metadata đúng bản đã phân tích, ánh xạ raw/virtual qua ELF PT_LOAD, hiệu chuẩn bằng getter giá cổ phiếu `ldr d0,[x0,#0x30];ret`; từ chối binary khác hoặc hàm giải mã không đủ độ dài.

Xuất metadata dạng văn bản bằng Cpp2IL đã dùng trong phân tích:

```text
cpp2il.exe --force-binary-path libil2cpp.so --force-metadata-path global-metadata.dat --force-unity-version 6000.3.9f1 --use-processor attributeinjector --output-as diffable-cs --output-to cpp2il-native-text
python tools/inspect-bitlife-market.py ANALYSIS_DIRECTORY
```

Python cần `capstone` và `pyelftools` trong môi trường phân tích. Không thêm chúng vào runtime web. Thư mục đầu vào cần binary/metadata và `cpp2il-native-text/DiffableCs` của cùng bản. Output chuẩn là JSON; chỉ ghi tệp khi công cụ kết thúc thành công. Bản đã kiểm nằm ở `docs/qa/apk-market-native.json`.

Tra địa chỉ từ văn bản tránh tải graph tham chiếu CLR từng gây chậm trong dnfile. Địa chỉ chia sẻ giữa các khai báo/generic giữ **mọi ứng viên**, không tự chọn một tên làm hàm đã xác minh. Call chưa tìm được khai báo giữ danh sách rỗng. Không xem các thân C# `{ }` là mã nguồn game đã phục hồi.

## Quy tắc chọn mẫu cổ phiếu đã xác minh

Constructor `SimStock` đọc trường `DataFinancialUniversalStock.WinnerScore` tại offset0x2C rồi tail-call `SetupLifecyclePattern` (raw0x2ADAC68). Hàm truyền `(1,21)` cho `GameReference.GetRandomNumber`, sau đó chọn ID mẫu1/2/3 bằng các nhánh so sánh. Bộ đọc thực thi riêng các lệnh compare/branch/mov/store của đoạn chọn mẫu, đối chiếu bảng boundary độc lập cho đủ **5 điểm × 20 giá trị bốc = 100 trường hợp**. Không giả lập toàn bộ ARM64 hoặc gọi lại engine web để sinh expected.

| Winner Score | Mẫu2: số trường hợp | Mẫu3: số trường hợp | Mẫu1: số trường hợp |
| --- | ---: | ---: | ---: |
| 1 | 12 | 6 | 2 |
| 2 | 8 | 8 | 4 |
| 3 | 5 | 10 | 5 |
| 4 | 4 | 8 | 8 |
| 5 | 4 | 6 | 10 |

Bảng này đếm các input1–20, **chưa gán ý nghĩa tăng/giảm cho ID mẫu hoặc gọi các con số là xác suất thắng/lợi nhuận**. Wrapper random có lời gọi virtual và đồng bộ trạng thái; cần xác minh implementation/dispatch và chính sách RNG trước khi chốt phân phối. Toàn bộ dãy giá, phá sản, tác động ngành và phí vẫn phải phục hồi. Không đưa một helper chọn mẫu chưa nối với công thức giá vào gameplay chỉ để tăng số chức năng.

## Những đường native đã khoanh vùng

- `SimCrypto.SetupCryptoLifecycle`, GetMonthlyValueList/GetCurrentPrice/GetPeakAgeList: báo cáo giữ hash/địa chỉ và các call target đã tìm được. GetMonthlyValueList có vòng lặp tạo12 phần tử, các lời gọi random và `Math.Round(double,int,MidpointRounding)`; chưa chuyển thành công thức JS khi chưa giải đủ hướng thay đổi, loại vòng đời, mốc đỉnh và kiểu làm tròn/float32.
- `SimStock.SetupStockLifecycle`, SetNextLiveValue/WillGoBankrupt/HandleBankruptcy: có call summary để theo tiếp event/sector và thay mã sau phá sản. Không thay bằng boom/crash ngẫu nhiên của web rồi gọi đó là native.
- Bằng chứng nhỏ bổ sung gồm constructor cổ phiếu, GameReference.GetRandomNumber, Math.Max và Math.Round. Vẫn cần đọc các hàm được gọi, virtual dispatch, dữ liệu tháng/năm và fixture giá có expected độc lập.

## Phát hành đã hoàn tất

PR #121 đã merge main `c692955d4f09f848413a009055cc281f67f2c178`. Hai CI của source `c95ecf54c2dd91c083ef7c8d9657521ad38d2960` (38491982616/38492040527) SUCCESS; 97unit/16browser, build/content/PWA, 10.000đời không crash/stuck/missingdelta; 100đời APK riêng và6luồng APK hosted PASS. #119 roulette và #120 catalog107cổphiếu đã đóng theo đúng phạm vi hẹp.

Vercel production mainc692955 READY tại https://newlife-web-gray.vercel.app/ (kiểm metadata). Sites version8/sourcec95ecf5/deploymentappgdep_6aced14a68d48191a07cf8de772d3ca0 SUCCEEDED và browser QA6luồng PASS; audience public giữ nguyên. #122/#118/#111 còn mở. Chưa QA trên điện thoại vật lý; đầu tư và các minigame còn lại chưa native1:1.
