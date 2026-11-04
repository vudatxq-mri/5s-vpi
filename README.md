# 5S VPI - HỆ THỐNG QUẢN LÝ VỆ SINH & BÁO CÁO 5S BỆNH VIỆN QUỐC TẾ VĨNH PHÚC

Ứng dụng web Progressive Web App (PWA) hỗ trợ giám sát, chụp ảnh vi phạm & cải tiến 5S, chấm điểm theo 5 tiêu chí Bộ Y tế và xuất báo cáo tự động cho Bệnh viện Đa khoa Quốc tế Vĩnh Phúc (VPI).

---

## 🏥 TÍNH NĂNG NỔI BẬT

1. **Chế độ Kép Nội Viện & Ngoại Viện**:
   - `🏢 Nội viện (Wi-Fi VPI)`: Kết nối mạng LAN nội bộ tốc độ cao.
   - `🌐 Ngoại viện (4G Toàn quốc)`: Hoạt động qua Cloudflare HTTPS & Vercel bảo mật.
   - Kiểm soát phân quyền ngoại viện (RBAC) chống truy cập trái phép.

2. **Chế độ Xem Khung Mobile & Desktop Toàn Màn Hình**:
   - Giả lập màn hình điện thoại thông minh (có Notch tai thỏ) giúp điều dưỡng/KTV thao tác nhanh khi đi buồng bệnh.
   - Chế độ toàn màn hình cho Ban Quản lý Chất lượng và Lãnh đạo viện.

3. **In Báo Cáo 5S Chuẩn A4 (Nghị định 30/2020/NĐ-CP)**:
   - Tự động xuất biểu mẫu báo cáo đánh giá 5S toàn viện với bảng xếp hạng 10 khoa, danh mục tồn đọng và chữ ký phê duyệt.

4. **10 Khoa & 43 Buồng Phòng Tiêu Chuẩn**:
   - Khoa Chẩn đoán hình ảnh (KCDHA)
   - Khoa Cấp cứu (KCC)
   - Khoa Khám bệnh (KKB)
   - Khoa Ngoại Tổng hợp (KNG)
   - Khoa Nội Tổng hợp (KNT)
   - Khoa Phụ Sản (KSN)
   - Khoa Nhi (KNHI)
   - Khoa YHCT - PHCN
   - Khoa Xét nghiệm (KXN)
   - Khoa Kiểm soát Nhiễm khuẩn (KKSNK)

5. **Độc lập & Bền bỉ (Hybrid Client Store)**:
   - Tự động lưu trữ và vận hành mượt mà trên trình duyệt qua LocalStorage.
   - Hỗ trợ xuất / nạp file sao lưu `.json` khẩn cấp và khôi phục dữ liệu gốc chuẩn VPI.

---

## 🚀 TRIỂN KHAI TRÊN VERCEL

1. Tạo repository mang tên `5s-vpi` trên GitHub.
2. Tải toàn bộ các file trong thư mục này lên GitHub.
3. Kết nối với Vercel để nhận link trực tuyến: `https://5s-vpi.vercel.app`.
