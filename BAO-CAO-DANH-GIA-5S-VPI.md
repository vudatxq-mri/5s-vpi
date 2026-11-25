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

## C. Phân quyền DUYỆT ẢNH 5S theo "DANH SÁCH TOÀN VIỆN VPI.xlsx" (bản V26 — 22/11/2026)

- Nguồn: cột F "Duyệt ảnh 5S". Kết quả trong app: **1 Admin (BV-345) + 31 người "Được duyệt" + 494 người chỉ gửi ảnh** = 526 tài khoản.
- 31 mã được duyệt: BV-001, 002, 004, 026, 042, 121A, 157, 196, 202, 243, 245, 254, 269, 289, 305, 306, 308, 326,
  342, 386, 428, 467, 468, 489, 525, 568, 596, 658, 725, 747, 754.
- Trước đây quyền duyệt được suy ra từ chữ "trưởng / giám sát / chỉ đạo…" trong chức danh và một danh sách mã cố định,
  nên **22 người ngoài danh sách** vẫn duyệt được (VD: BV-280 Trưởng khoa CĐHA, BV-115, BV-007, BV-279, BV-076, BV-332,
  BV-543, BV-476, BV-338, BV-389, BV-377, BV-101, BV-523, BV-263, BV-059, BV-491, BV-780, BV-343/344/660 Giặt là…).
  Nay họ **chỉ được gửi ảnh**. Nếu cần, Admin bật lại từng người.
- 6 tài khoản có trong app nhưng không có trong Excel (BV-059, BV-204, BV-116A, BV-530, BV-708, BV-764) → chỉ gửi ảnh.
- Admin bật/tắt quyền duyệt từng người: Nhân sự → Sửa → ô "✅ Được phép DUYỆT ẢNH 5S". Thẻ nhân sự hiện nhãn
  "✅ Duyệt ảnh" / "📷 Chỉ gửi ảnh".
- Danh sách áp dụng 1 lần trên mỗi máy (khóa `REVIEW_POLICY.version` đầu app.js). Muốn áp lại danh sách Excel mới:
  sửa `REVIEWER_CODES` và đổi `version`.
- Sửa kèm lỗi nghiêm trọng: Sửa nhân sự có vai trò "supervisor" rồi Lưu → bị đổi thành **Admin** (ô chọn rơi về mục đầu).
  Chỉ Admin mới đổi được vai trò / quyền duyệt; trưởng khoa không còn tự gán Admin cho người khác.
- Hạn chế: do chưa có máy chủ đồng bộ, việc Admin bật/tắt quyền chỉ có hiệu lực trên máy Admin; danh sách Excel thì có
  hiệu lực trên mọi máy vì nằm trong app.js.

## D. Máy chủ đồng bộ & đăng nhập (bản V27 — 22/11/2026) — giải quyết mục B1, B2, B4

- **Backend:** Vercel Functions (Python, thư mục `api/`) + Supabase (CSDL Postgres + kho ảnh `photos`).
  - `POST /api/login` — kiểm tra mật khẩu trên máy chủ (mã hóa PBKDF2), khóa 5 phút sau 5 lần sai, trả mã phiên 30 ngày.
  - `GET/POST /api/sync` — chỉ tải phần thay đổi; máy chủ **tự kiểm tra quyền** từng thay đổi (người chỉ gửi ảnh
    không thể tự duyệt, tự nâng quyền, xóa phiếu đã duyệt…).
  - `POST /api/password` — đổi mật khẩu có hiệu lực mọi máy (các máy khác phải đăng nhập lại).
  - `POST /api/upload` — ảnh được tải lên kho ảnh, dữ liệu chỉ lưu đường link (không còn base64 nặng).
- **app.js:** bỏ 526 hồ sơ nhân sự + mật khẩu + 12 phiếu demo khỏi mã nguồn công khai (906 KB → ~650 KB). Danh sách
  chỉ tải về sau khi đăng nhập. Mất mạng vẫn chụp/nộp được: thay đổi nằm trong hàng đợi, tự gửi khi có mạng.
- Mật khẩu ban đầu của mọi tài khoản: `123456`, bắt buộc đổi ở lần đăng nhập đầu. Quyền duyệt theo mục C, Admin
  thay đổi trên app → có hiệu lực mọi máy.
- Bỏ tính năng "chuyển tài khoản không cần mật khẩu".

## D2. Bản V28 (23/11/2026)

- **Sửa lỗi tự tải lại / nhảy trang:** cứ 10 giây app vẽ lại toàn màn hình (do vùng tải chồng lấn 50 phiên bản
  luôn trả về bản ghi cũ). Nay chỉ vẽ lại khi thật sự có dữ liệu mới, và hoãn khi người dùng đang cuộn/chạm.
  Chuyển tab mở từ đầu trang. Kiểm chứng: 35 giây để yên → 0 lần vẽ lại, giữ nguyên vị trí cuộn.
- **Bảo mật:**
  - Máy chủ vô hiệu hóa mã độc trong mọi nội dung nhập (`<`, `>`, dấu nháy…), chặn ảnh SVG, kiểm tra khóa bản ghi.
  - Chính sách CSP: chỉ tải mã/ảnh từ nguồn tin cậy; cố định phiên bản Tailwind; thêm HSTS.
  - Ngày sinh, SĐT nhân sự không còn gửi xuống máy người khác (chỉ Admin / bản thân / quản lý khoa thấy SĐT).
  - Hộp thư Admin chỉ Admin/Ban chỉ đạo và người gửi xem được.
  - "Quên mật khẩu" nay gửi được tới Admin (trước đây không tới), chống spam 10 phút, không lộ mã NV có tồn tại.
- **Nội dung:** bỏ nút "ảnh mẫu minh chứng" (cho nộp ảnh giả), bỏ điểm gán sẵn 98 "Xuất sắc", bỏ ghi chú soạn sẵn,
  bỏ thông báo khẩn cũ 16/10, bỏ bộ đếm lượt xem giả (1.286/48), bỏ nhật ký truy cập giả, số trên quả chuông = số thật.

## D3. Bản V29 (25/11/2026)

- **Danh mục khu vực 5S** theo Google Sheet "DS các khu vực 5S toàn viện VPI": 18 khoa/phòng, 57 vị trí (mã phòng 101–157).
  Ghép với khoa cũ: CĐHA(8), Khám bệnh(2), Xét nghiệm(9), Ngoại TH(4), Nhi(7), Nội TH(5), YHCT-PHCN(3), Dược(15),
  Cấp cứu(1 → "Phòng Cấp cứu"), TCKT(20), QLCL(16), HCNS(19). Tạo mới: HDKH(21), Kinh doanh Bảo hiểm(22), Marketing(23),
  KHVH(24), Nhà 3 tầng(25), Trung tâm Tiêu hóa(26). 8 khoa cũ không có trong sheet (ICU, PTGM, Sản, LCK, TDCN, KSNK, KHTH,
  Điều dưỡng) giữ lại vì còn nhân sự, đánh dấu `in_5s:false`. **Admin vào tab Thống kê → "Áp dụng"** để đưa lên máy chủ;
  79 vị trí cũ bị **xóa hẳn** (gỡ cả khỏi phân quyền khu vực và danh sách phụ trách của nhân sự).
- **Xóa toàn bộ dữ liệu 5S để triển khai mới** (V29b, Admin): Thống kê → "Xóa dữ liệu & triển khai mới" → gõ `XOA DU LIEU 5S`.
  Gọi `POST /api/reset`: đánh dấu xóa mọi phiếu 5S, lịch/ảnh bàn giao khu vực, đánh giá khoa; xóa ảnh trong kho `photos`
  (giới hạn ~11 giây/lần, còn sót thì bấm lại); ghi mốc `singleton/data_reset`. Máy chưa nhận mốc mới bị từ chối gửi dữ liệu 5S
  cũ (`reset_at` trong `POST /api/sync`), tự bỏ hàng đợi cũ và tải lại. Giữ nguyên tài khoản, mật khẩu, nhân sự, quyền, khoa phòng.
- Đổi "Tác giả: Vũ Đạt" thành "Phát triển bởi Vũ Đạt, Bệnh viện Vĩnh Phúc VPI".
- **Cấp lại mật khẩu** (V29c): Nhân sự → "Cấp lại mật khẩu" (hoặc biểu tượng chìa khóa ở từng người, hoặc nút dưới yêu cầu
  "Cấp lại mật khẩu" trong Hộp thư). Gọi `POST /api/password {reset_for, msg_id}`: máy chủ sinh mật khẩu tạm (VD `Vpi482KQ`),
  bắt buộc đổi ở lần đăng nhập kế tiếp, đăng xuất mọi phiên cũ, tự đánh dấu yêu cầu trong hộp thư là đã xử lý (không ghi mật khẩu
  vào tin nhắn). Admin cấp cho mọi người; lãnh đạo khoa cấp cho nhân viên trong khoa không có quyền duyệt.
- **Thông báo hòm thư cho Admin** (V29c): số tin chưa đọc trên quả chuông, dải đỏ "Hòm thư có N tin mới", chuông + rung,
  thông báo nổi của hệ điều hành khi app chạy nền (Admin bấm "Bật thông báo" trong hộp thư; app nền kiểm tra mỗi 60 giây).
  Mở hộp thư => tin được đánh dấu `admin_read` trên mọi máy của Admin. Giới hạn: khi app đã đóng hẳn / điện thoại khóa lâu,
  tin mới chỉ báo khi mở lại app (chưa có Web Push).
- **Thống kê** (V29c): bỏ "Không tính Chủ nhật" (5S làm cả 7 ngày); bộ lọc Tất cả / Đã thực hiện / Chưa thực hiện kèm số lượng.
- **Chức danh** (V29d): danh mục chung cho Thêm/Sửa tài khoản: Hội đồng quản trị, Ban giám đốc, Ban chỉ đạo 5S, lãnh đạo khoa
  (Trưởng/Phó Trưởng khoa...), lãnh đạo phòng chức năng (Trưởng phòng, Phó Trưởng phòng, Kế toán trưởng, Phó Kế toán trưởng...),
  nhân viên phòng chức năng (Chuyên viên, Kế toán viên, Thủ quỹ...). Khoa/phòng nhập được nhiều Phó khoa/Phó phòng (`departments.deputies`),
  kèm tự nhận nhân sự có chức danh "Phó ...".
- **HĐQT / Ban giám đốc** (V29d): trường `staff.leader_group` (`hdqt` | `bgd`, chỉ Admin sửa, máy chủ bảo vệ); tab Nhân sự hiện
  2 danh sách riêng ở đầu; thành viên được xem báo cáo toàn viện.
- **Quyền** (V29d): "Xóa dữ liệu & triển khai mới" chỉ tài khoản Admin chính (`ADMIN_CODES`), kể cả máy chủ. Báo cáo 5S / Xuất Excel /
  In báo cáo / tab Thống kê chỉ cho lãnh đạo khoa phòng, người duyệt 5S, HĐQT/BGĐ, Admin; tài khoản thường bị ẩn và máy chủ từ chối `/api/report`.
- **Phân quyền khu vực** (`staff.area_scope = {all, rooms[]}`, chỉ Admin sửa, máy chủ kiểm tra): Thống kê → "Phân quyền khu vực"
  hoặc Nhân sự → Sửa → "📍 Phân quyền khu vực 5S". Mặc định: người duyệt = toàn viện; lãnh đạo khoa = khu vực khoa mình.
- **Bỏ tải ảnh từ máy**: chỉ chụp camera; camera hệ thống chỉ nhận ảnh chụp trong 3 phút; camera lỗi không tạo ảnh giả.
  Nộp ảnh luôn ghi cho **ngày hôm nay**; ảnh **chưa lên máy chủ = chưa thực hiện** (hiện "ẢNH CHƯA GỬI ĐƯỢC").
  Máy chủ từ chối ảnh không nằm trong kho ảnh, từ chối nộp bù ngày cũ, tự ghi `server_at` và người nộp.
- **Bỏ chấm điểm số**: chỉ còn Đạt / Không đạt (phiếu, đánh giá khoa, báo cáo, CSV).
- **Tab Thống kê** (+ API `GET /api/report?from=&to=`, không giới hạn 90 ngày): khu vực đã/chưa thực hiện; biểu đồ & bảng xếp
  hạng thi đua khoa phòng (% hoàn thành, % đạt, ngưỡng xếp loại chỉnh được); danh sách cá nhân vi phạm (không thực hiện /
  không đạt / nộp muộn, chi tiết từng lần); xuất Excel (CSV), in A4.
- **Sửa lỗi "chạy lại app"** khi thêm/sửa (Tùy chỉnh ca & nhân sự...): giao diện cập nhật tại chỗ (DOM morph), giữ vị trí cuộn,
  không chạy lại hiệu ứng mở hộp thoại, ảnh không tải lại.
- Sửa kèm: hàm thêm nhân sự vào phòng ghi nhầm cả danh mục 20 khoa vào hồ sơ nhân sự; ảnh vừa chụp ở phòng này có thể bị nộp
  cho phòng khác.
- Bản V28 lưu tại `original/v28/`. Kiểm thử giao diện trên máy bằng `tools/static_server.ps1` (không có API).

## E. Cách triển khai bản V27

1. Supabase → SQL Editor → chạy `supabase/schema.sql` (hiện 3 dòng "OK").
2. Dán Secret key vào `.env.local` (KHÔNG gửi qua chat, KHÔNG đưa lên GitHub) → chạy `python tools/seed_supabase.py`
   để nạp khoa phòng, buồng phòng, 526 nhân sự.
3. Vercel → Project → Settings → Environment Variables: thêm `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `APP_SECRET`,
   `RETENTION_DAYS` (giá trị như trong `.env.local`).
4. Đưa mã nguồn lên GitHub (repo nên để **Private**); `.gitignore`/`.vercelignore` đã loại `.env.local`, `original/`,
   `tools/`. Vercel tự deploy.
5. Mở https://5s-vpi.vercel.app/api/health → `"ok": true, "staff_records": 526`.
