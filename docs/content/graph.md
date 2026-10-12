# Đồ thị nội dung v1

Có 294 sự kiện trong pool: 150 thường + 144 nghề. Có 5 dự phòng, được đếm riêng. Các nhánh khó đạt được kiểm bằng fixture; bot mô phỏng không bảo đảm gặp hết nghề.

## Chuỗi đời thường

```mermaid
flowchart LR
  youth_05 -->|sau 1 năm| youth_12
  youth_08 -->|cùng năm| youth_14
  youth_11 -->|sau 1 năm| youth_10
  midlife_16 -->|sau 1 năm| midlife_21
  midlife_22 -->|sau 1 năm| midlife_26
```

## Chiếc đồng hồ ở chợ cũ

```mermaid
flowchart LR
  start["start"]
  start --> n1
  start --> n2
  n1["n1"]
  n1 --> n3
  n1 --> n4
  n2["n2"]
  n2 --> n4
  n2 --> n5
  n3["n3"]
  n3 --> n6
  n3 --> n7
  n4["n4"]
  n4 --> n6
  n4 --> n8
  n5["n5"]
  n5 --> n7
  n5 --> n8
  n6["n6"]
  n6 --> end_a
  n6 --> end_b
  n7["n7"]
  n7 --> end_b
  n7 --> end_c
  n8["n8"]
  n8 --> end_a
  n8 --> end_c
  end_a["Những ngày còn nhớ"]
  end_b["Trả lại thời gian"]
  end_c["Ngày hoàn hảo"]
```

## Khu vườn trên mái

```mermaid
flowchart LR
  start["start"]
  start --> n1
  start --> n2
  n1["n1"]
  n1 --> n3
  n1 --> n4
  n2["n2"]
  n2 --> n4
  n2 --> n5
  n3["n3"]
  n3 --> n6
  n3 --> n7
  n4["n4"]
  n4 --> n6
  n4 --> n8
  n5["n5"]
  n5 --> n7
  n5 --> n8
  n6["n6"]
  n6 --> end_a
  n6 --> end_b
  n7["n7"]
  n7 --> end_b
  n7 --> end_c
  n8["n8"]
  n8 --> end_a
  n8 --> end_c
  end_a["Vườn chung còn xanh"]
  end_b["Rễ mới"]
  end_c["Một góc vừa sức"]
```

## Chuyến xe lúc nửa đêm

```mermaid
flowchart LR
  start["start"]
  start --> n1
  start --> n2
  n1["n1"]
  n1 --> n3
  n1 --> n4
  n2["n2"]
  n2 --> n4
  n2 --> n5
  n3["n3"]
  n3 --> n6
  n3 --> n7
  n4["n4"]
  n4 --> n6
  n4 --> n8
  n5["n5"]
  n5 --> n7
  n5 --> n8
  n6["n6"]
  n6 --> end_a
  n6 --> end_b
  n7["n7"]
  n7 --> end_b
  n7 --> end_c
  n8["n8"]
  n8 --> end_a
  n8 --> end_c
  end_a["Bến hiện tại"]
  end_b["Một lời hẹn được nói"]
  end_c["Vé một chiều"]
```

## Tiệm thư chưa gửi

```mermaid
flowchart LR
  start["start"]
  start --> n1
  start --> n2
  n1["n1"]
  n1 --> n3
  n1 --> n4
  n2["n2"]
  n2 --> n4
  n2 --> n5
  n3["n3"]
  n3 --> n6
  n3 --> n7
  n4["n4"]
  n4 --> n6
  n4 --> n8
  n5["n5"]
  n5 --> n7
  n5 --> n8
  n6["n6"]
  n6 --> end_a
  n6 --> end_b
  n7["n7"]
  n7 --> end_b
  n7 --> end_c
  n8["n8"]
  n8 --> end_a
  n8 --> end_c
  end_a["Những lá thư đã đến"]
  end_b["Bí mật được giữ đúng"]
  end_c["Lá thư của mình"]
```

## Đội hội làng bất đắc dĩ

```mermaid
flowchart LR
  start["start"]
  start --> n1
  start --> n2
  n1["n1"]
  n1 --> n3
  n1 --> n4
  n2["n2"]
  n2 --> n4
  n2 --> n5
  n3["n3"]
  n3 --> n6
  n3 --> n7
  n4["n4"]
  n4 --> n6
  n4 --> n8
  n5["n5"]
  n5 --> n7
  n5 --> n8
  n6["n6"]
  n6 --> end_a
  n6 --> end_b
  n7["n7"]
  n7 --> end_b
  n7 --> end_c
  n8["n8"]
  n8 --> end_a
  n8 --> end_c
  end_a["Lễ hội ấm áp"]
  end_b["Tên trên sân khấu"]
  end_c["Nhỏ mà vui"]
```
