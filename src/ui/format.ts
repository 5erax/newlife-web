export function cash(value: number, full = false) {
  if (full) return new Intl.NumberFormat("vi-VN").format(value) + " ₫";
  const abs = Math.abs(value);
  if (abs >= 1e9)
    return (
      (value / 1e9).toLocaleString("vi-VN", { maximumFractionDigits: 2 }) +
      " tỷ ₫"
    );
  if (abs >= 1e6)
    return (
      (value / 1e6).toLocaleString("vi-VN", { maximumFractionDigits: 1 }) +
      " triệu ₫"
    );
  return new Intl.NumberFormat("vi-VN").format(value) + " ₫";
}
export const ageLabel = (age: number) =>
  age < 6
    ? "Tuổi thơ"
    : age < 18
      ? "Đang lớn"
      : age < 31
        ? "Tuổi trẻ"
        : age < 60
          ? "Trưởng thành"
          : "Những năm an nhiên";
export const GROUP_LABELS: Record<string, string> = {
  thechat: "Thể chất",
  suckhoe: "Sức khoẻ",
  hoctap: "Học tập",
  xahoi: "Xã hội",
  giadinh: "Gia đình",
  tinhcam: "Tình cảm",
  giaitri: "Giải trí",
  dulich: "Du lịch",
  taichinh: "Tài chính",
  nhacua: "Nhà cửa",
  thucung: "Thú cưng",
  ruiro: "Rủi ro",
  house: "Nhà ở",
  vehicle: "Phương tiện",
  investment: "Đầu tư",
  equipment: "Đồ dùng",
  luxury: "Xa xỉ",
  pet: "Thú cưng",
};
