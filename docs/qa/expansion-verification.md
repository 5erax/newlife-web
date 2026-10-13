# Xác minh bản 1.1

Unit/content/storage: 64 kiểm thử đã qua trên Windows. Fixture ép từng nhánh cases, kiểm delta thực và roundtrip; giữ 593 outcomes cũ cho file đang chờ từ bản 1.0.

358 events +5 fallback, 150 activities, 48 jobs, 10 education, 24 assets,42 achievements. 20 chuỗi; trung bình10,73lá,30,73% có lựa chọn lồng. 10.000 lần sinh kiểm tên/giới/parent roles/avatar.

Casino500.000 ván: hit/stand blackjack lợi thế nhà cái2,299%, Ba cào3,014%. Không tuyên bố blackjack0,5% khi chưa có split/double.

Báo cáo mô phỏng cuối và branch coverage: expansion-simulation.json, branch-coverage.json. Chrome trên Windows: 10/10 luồng E2E qua; gồm tên dài, 550 log, 320–1440px, offline, stale tabs/quota/import, màu tóc/LGBTQ reload, giao dịch đầu tư và hand casino reload. Tester đọc snapshot/ảnh thật: thấy delta, nhật ký/nguyên nhân và ngoại hình đổi 36→29 sau tuổi đầu. CI bổ sung đang chạy, ghi kết quả vào PR trước merge.

Giới hạn: không kiểm Android vật lý, screen reader thật; không có dataset Android nguyên bản đầy đủ. Graph chỉ chứng minh mâu thuẫn điều kiện đơn giản, fixture đi nhánh hợp lệ và bot báo nhánh chưa gặp; không phải SAT proof mọi tổ hợp.

## Mô phỏng 10.000 đời bản 1.1

Crash 0, kẹt 0; 762.181 mẫu năm. Tuổi trung bình 76.22, median 79, trước 20 tuổi 1.08%. Thay đổi NET tuyệt đối trung bình: sức khỏe 5.369, hạnh phúc 3.606, trí tuệ 4.679, ngoại hình 5.659. Cả bốn nằm trong 3–6. Ngoại hình hằng 20 năm: 0; thiếu lý do delta: 0; SD mọi nhóm tuổi >0.

Bot gặp 234/358 sự kiện, 2028/4062 case keys trong pool (thêm 13 case fallback). Chưa gặp 2034, hiếm (<5 lần) 180. Fixture riêng đi qua mọi authored case; không diễn giải bot như độ phủ tự nhiên 100%.

Bundle JS ~255 KB gzip + CSS ~7,2 KB + workbox ~2,3 KB; precache ~1,7 MiB. Vite vẫn báo chunk lớn, không giấu cảnh báo. 200 tài sản bảo trì 100 năm vẫn serialize/parse trong giới hạn 10 MB. npm audit production: 0 lỗ hổng được báo tại lúc kiểm.
