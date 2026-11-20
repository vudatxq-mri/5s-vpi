# Báo cáo đánh giá App 5S VPI (https://5s-vpi.vercel.app) — 20/11/2026

Phạm vi: rà soát mã nguồn front-end đang chạy (index.html, app.js v24 ~906 KB, sw.js, manifest), đo hiệu năng
và kiểm thử bản sửa trên máy (localhost). Bản gốc lưu trong thư mục `original/`.

## A. Lỗi đã sửa trong thư mục này (bản V25 — cần deploy lên Vercel)

| # | Mức độ | Vấn đề | Đã sửa |
|---|---|---|---|
| 1 | NGHIÊM TRỌNG | Mọi tài khoản, kể cả Admin/Giám đốc, đăng nhập được bằng mật khẩu `123` hoặc `123456` dù đã đổi mật khẩu | Chỉ chấp nhận đúng mật khẩu của tài khoản (đã kiểm thử) |
| 2 | NGHIÊM TRỌNG | "Ghi nhớ đăng nhập" lưu mật khẩu dạng chữ thường trong trình duyệt | Chỉ lưu Mã NV; tự xóa mật khẩu đã lưu ở bản cũ |
| 3 | Cao | Màn hình đăng nhập công khai "Mặc định ban đầu: 123456" | Bỏ dòng gợi ý; bắt buộc đổi mật khẩu mặc định ngay lần đăng nhập đầu; mật khẩu mới ≥ 6 ký tự, chặn mật khẩu dễ đoán |
| 4 | Cao | Thiếu dữ liệu phiên → tự đăng nhập bằng tài khoản quản trị BV-345; tài khoản bị xóa → nhận quyền của Tổng Giám đốc (staff[0]) | Mặc định chưa đăng nhập; tài khoản không tồn tại → đăng xuất / không có quyền |
| 5 | Cao | Lịch buồng phòng: bấm chọn ngày khác KHÔNG đổi dữ liệu (hàm `setScheduleDay` bị định nghĩa trùng, bản sau ghi đè bản đúng), 2 ngày cùng sáng | Xóa hàm trùng (đã kiểm thử) |
| 6 | Cao | Nút "In Báo Cáo A4" trên thanh trên cùng in bảng **dữ liệu mẫu cố định** (ngày 14/10/2026, điểm giả) | Mở hộp chọn ngày/khoa và in số liệu thực |
| 7 | Hiệu năng | Gọi `/api/sync` mỗi 6 giây mãi mãi (10 lần/phút/máy) kể cả khi app chạy nền và máy chủ trả 404 | Đồng bộ thông minh: 10 giây, giãn dần tới 5 phút khi lỗi, dừng khi app chạy nền |
| 8 | Hiệu năng | Đồng bộ nền render lại toàn màn hình khi đang gõ / đang mở hộp thoại chụp ảnh (mất chữ, mất ảnh chưa gửi) | Hoãn render tới khi đóng hộp thoại |
| 9 | Hiệu năng | Tab Nhân sự render 526 thẻ cùng lúc: 19.174 phần tử DOM, 133 ms trên PC (~1 s trên điện thoại) | Phân trang 40 người + nút "Xem thêm": 1.679 phần tử, 21 ms |
| 10 | Hiệu năng | Ảnh chụp camera giữ nguyên độ phân giải gốc (1080p–4K, 0,5–2 MB/ảnh) → đầy bộ nhớ 5 MB chỉ sau vài ảnh, app tự xóa ảnh cũ | Thu nhỏ còn tối đa 1024 px |
| 11 | Hiệu năng | Logo PNG 218 KB cho ảnh hiển thị 48 px | Thu còn 44 KB |
| 12 | Ổn định | Thư viện icon nạp `lucide@latest` (có thể vỡ giao diện bất cứ lúc nào khi thư viện cập nhật), chặn hiển thị | Ghim bản 1.76.0, tải `defer` |
| 13 | Ổn định | Service Worker nạp sẵn Font Awesome + QRCode.js (không dùng); khi mất mạng trả mã 200 giả cho API | Nạp sẵn app.js/CSS/logo để mở nhanh & dùng offline; API mất mạng trả 503; chỉ cache GET |
| 14 | Nhỏ | Chế độ xem trên điện thoại luôn bị ép về "Mobile Frame" | Sửa logic đọc lựa chọn đã lưu |
| 15 | Nhỏ | Manifest: màu xanh dương (#0284c7) lệch màu app, tên "Đa khoa Vĩnh Phúc" | Đồng bộ màu #059669, tên VPI |
| 16 | Nhỏ | Số lượt xem "1.286" viết cứng trong HTML | Bỏ số cứng (app tự điền) |
| 17 | Bổ sung | Không có header bảo mật / cache ảnh | Thêm `vercel.json` (nosniff, chống nhúng iframe, cache ảnh 7 ngày) |

## B. Vấn đề lớn CHƯA sửa — cần quyết định

1. **Đồng bộ liên thiết bị KHÔNG hoạt động trên Vercel.** `/api/sync` trả 404 (chỉ chạy với máy chủ Python cũ
   tại 127.0.0.1:8000). Hệ quả: mỗi điện thoại một kho dữ liệu riêng; ảnh 5S nhân viên nộp **không tới** máy
   của người duyệt; đổi mật khẩu chỉ có tác dụng trên 1 máy. Cần backend: Vercel Function + CSDL
   (Supabase/Neon/Upstash) + Vercel Blob để lưu ảnh (không nhét ảnh base64 vào JSON — giới hạn 4,5 MB/request).
2. **Đăng nhập chỉ kiểm tra trên trình duyệt.** Toàn bộ 526 hồ sơ (họ tên, năm sinh, chức danh, khoa) và mật khẩu
   nằm công khai trong app.js — ai mở trang cũng tải được; có thể tự sửa localStorage để thành Admin.
   Rủi ro theo Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân. Phải chuyển xác thực + dữ liệu nhân sự lên máy chủ (đi cùng mục 1).
3. **Điểm bị gán sẵn:** mỗi lần nộp ảnh bàn giao ca tự ghi 98 điểm "Xuất sắc" trước khi được chấm.
4. **Dữ liệu mẫu trộn dữ liệu thật:** khi chưa có phiếu nào app tự nạp 12 phiếu demo; biểu tượng thông báo luôn hiện "3".
5. **XSS:** nội dung người dùng nhập (góp ý, tên, ghi chú) chèn thẳng vào `innerHTML` — khi đồng bộ hoạt động sẽ thành lỗ hổng giữa các tài khoản.
6. **Ảnh lưu 2 lần** (audit.after_photo và post_shift_5s.photo) trong localStorage 5 MB.
7. **Tailwind CDN dùng cho production** (~400 KB, biên dịch CSS lúc chạy, chậm trên máy yếu) → nên build CSS tĩnh.
8. `user-scalable=no` chặn phóng to chữ (khó cho người lớn tuổi); app.js 906 KB một file, 280 KB là dữ liệu khởi tạo.

## C. Cách triển khai bản V25

Chép các file trong thư mục này (trừ `original/`, `.claude/`, file báo cáo) đè lên mã nguồn dự án Vercel rồi deploy.
Lưu ý: nếu mã nguồn gốc của anh/chị khác bản đang chạy, hãy so sánh với `original/` trước khi chép đè.
