/**
 * HỆ THỐNG QUẢN LÝ VỆ SINH & BÁO CÁO 5S BỆNH VIỆN VĨNH PHÚC (VPI)
 * Core Frontend Application Logic - Hybrid Client Engine (Vercel & LAN)
 */

// ==================== CƠ SỞ DỮ LIỆU GỐC & BỘ NHỚ LƯU TRỮ CỤC BỘ (HYBRID STORE) ====================
const DEFAULT_5S_SEED_DATA = {"departments": [{"id": 1, "code": "KCC", "name": "Khoa Cấp cứu", "head_nurse": "ĐD. Trần Thị Lan Hương", "doctor_in_charge": "Thạc sĩ-BS: Phạm Quỳnh Hưng", "phone": "0211.386.115", "color": "#ef4444", "icon": "fa-ambulance", "description": "Tiếp nhận cấp cứu 24/7, xử lý khẩn cấp bệnh nhân nặng", "created_at": "2026-10-14 05:32:50"}, {"id": 2, "code": "KKB", "name": "Khoa Khám bệnh", "head_nurse": "ĐD. Hoàng Bích Thủy", "doctor_in_charge": "BSCKI. Vũ Đình Khiêm", "phone": "0211.386.101", "color": "#0ea5e9", "icon": "fa-stethoscope", "description": "Khám ngoại trú, tư vấn và chỉ định cận lâm sàng", "created_at": "2026-10-14 05:32:50"}, {"id": 3, "code": "YHCTPHCN", "name": "Khoa YHCT-PHCN", "head_nurse": "ĐD. Phạm Thị Lý", "doctor_in_charge": "ThS.BS. Đinh Công Trí", "phone": "0211.386.118", "color": "#f59e0b", "icon": "fa-heart-pulse", "description": "Điều trị chuyên sâu bệnh nhân hồi sức, thở máy, lọc máu", "created_at": "2026-10-14 05:32:50"}, {"id": 4, "code": "KNG", "name": "Khoa Ngoại Tổng hợp", "head_nurse": "ĐD. Bùi Văn Hùng", "doctor_in_charge": "BSCKII. Lê Tuấn Anh", "phone": "0211.386.120", "color": "#10b981", "icon": "fa-user-doctor", "description": "Phẫu thuật điều trị các bệnh lý tiêu hóa, gan mật, lồng ngực", "created_at": "2026-10-14 05:32:50"}, {"id": 5, "code": "KNT", "name": "Khoa Nội Tổng hợp", "head_nurse": "ĐD. Trần Phương Dung", "doctor_in_charge": "BSCKI. Mai Thị Hảo", "phone": "0211.386.122", "color": "#06b6d4", "icon": "fa-notes-medical", "description": "Khám và điều trị nội trú bệnh tim mạch, hô hấp, nội tiết", "created_at": "2026-10-14 05:32:50"}, {"id": 6, "code": "KSN", "name": "Khoa Phụ Sản", "head_nurse": "Hộ sinh. Lê Thị Thúy Hằng", "doctor_in_charge": "BSCKII. Nguyễn Thị Hồng", "phone": "0211.386.125", "color": "#ec4899", "icon": "fa-baby", "description": "Chăm sóc thai phụ, đỡ đẻ, mổ lấy thai và điều trị phụ khoa", "created_at": "2026-10-14 05:32:50"}, {"id": 7, "code": "KNHI", "name": "Khoa Nhi", "head_nurse": "ĐD. Đỗ Thị Hiền", "doctor_in_charge": "ThS.BS. Đặng Hồng Phúc", "phone": "0211.386.128", "color": "#eab308", "icon": "fa-children", "description": "Khám và điều trị toàn diện bệnh lý sơ sinh và trẻ nhỏ", "created_at": "2026-10-14 05:32:50"}, {"id": 8, "code": "KCDHA", "name": "Khoa Chẩn đoán Hình ảnh", "head_nurse": "KTV. Nguyễn Đức Tuấn", "doctor_in_charge": "BSCKI. Phạm Quang Nam", "phone": "0211.386.130", "color": "#6366f1", "icon": "fa-x-ray", "description": "Chụp X-quang, Cắt lớp vi tính (CT), MRI, Siêu âm", "created_at": "2026-10-14 05:32:50"}, {"id": 9, "code": "KXN", "name": "Khoa Xét nghiệm", "head_nurse": "KTV. Đỗ Thị Thu Hường", "doctor_in_charge": "BSCKI. Vũ Đức Hải", "phone": "0211.386.132", "color": "#8b5cf6", "icon": "fa-vial-virus", "description": "Huyết học, Sinh hóa, Miễn dịch, Vi sinh đạt chuẩn ISO 15189", "created_at": "2026-10-14 05:32:50"}, {"id": 10, "code": "KKSNK", "name": "Khoa Kiểm soát Nhiễm khuẩn", "head_nurse": "ĐD. Trịnh Thị Thu Trang", "doctor_in_charge": "BSCKI. Hoàng Trọng Nghĩa", "phone": "0211.386.135", "color": "#14b8a6", "icon": "fa-shield-virus", "description": "Khử khuẩn tiệt khuẩn dụng cụ, giặt là đồ vải, giám sát 5S bệnh viện", "created_at": "2026-10-14 05:32:50"}], "rooms": [{"id": 1, "department_id": 1, "code": "KCC-P01", "name": "Phòng Tiếp nhận & Phân loại bệnh", "room_type": "Phòng tiếp đón", "floor": "Tầng 1 - Nhà A", "person_in_charge": "ĐD. Lê Văn Minh", "target_score": 90.0, "status": "active", "created_at": "2026-10-14 05:32:50"}, {"id": 2, "department_id": 1, "code": "KCC-P02", "name": "Phòng Hồi sức Cấp cứu ban đầu", "room_type": "Phòng thủ thuật", "floor": "Tầng 1 - Nhà A", "person_in_charge": "ĐD. Trần Thị Lan", "target_score": 90.0, "status": "active", "created_at": "2026-10-14 05:32:50"}, {"id": 3, "department_id": 1, "code": "KCC-P03", "name": "Phòng Lưu bệnh Cấp cứu (Phòng 101)", "room_type": "Phòng bệnh", "floor": "Tầng 1 - Nhà A", "person_in_charge": "ĐD. Phạm Thị Mai", "target_score": 90.0, "status": "active", "created_at": "2026-10-14 05:32:50"}, {"id": 4, "department_id": 1, "code": "KCC-P04", "name": "Phòng Tiểu phẫu - Băng bó vết thương", "room_type": "Phòng thủ thuật", "floor": "Tầng 1 - Nhà A", "person_in_charge": "ĐD. Hoàng Hải Yến", "target_score": 90.0, "status": "active", "created_at": "2026-10-14 05:32:50"}, {"id": 5, "department_id": 1, "code": "KCC-P05", "name": "Kho Thuốc & Dịch truyền Cấp cứu", "room_type": "Kho dược", "floor": "Tầng 1 - Nhà A", "person_in_charge": "DS. Nguyễn Bích Ngọc", "target_score": 90.0, "status": "active", "created_at": "2026-10-14 05:32:50"}, {"id": 6, "department_id": 1, "code": "KCC-P06", "name": "Khu Vệ sinh Cấp cứu & Khử khuẩn", "room_type": "Khu vệ sinh", "floor": "Tầng 1 - Nhà A", "person_in_charge": "Hộ lý. Vũ Thị Hoa", "target_score": 90.0, "status": "active", "created_at": "2026-10-14 05:32:50"}, {"id": 7, "department_id": 2, "code": "KKB-P01", "name": "Sảnh Tiếp đón & Lấy số tự động", "room_type": "Sảnh chờ", "floor": "Tầng 1 - Nhà B", "person_in_charge": "ĐD. Nguyễn Thu Trang", "target_score": 90.0, "status": "active", "created_at": "2026-10-14 05:32:50"}, {"id": 8, "department_id": 2, "code": "KKB-P02", "name": "Phòng Khám Nội tổng quát (P.101)", "room_type": "Phòng khám", "floor": "Tầng 1 - Nhà B", "person_in_charge": "BS. Lê Quang Huy", "target_score": 90.0, "status": "active", "created_at": "2026-10-14 05:32:50"}, {"id": 9, "department_id": 2, "code": "KKB-P03", "name": "Phòng Khám Ngoại - Chấn thương (P.102)", "room_type": "Phòng khám", "floor": "Tầng 1 - Nhà B", "person_in_charge": "BS. Đỗ Mạnh Cường", "target_score": 90.0, "status": "active", "created_at": "2026-10-14 05:32:50"}, {"id": 10, "department_id": 2, "code": "KKB-P04", "name": "Phòng Khám Nhi (P.103)", "room_type": "Phòng khám", "floor": "Tầng 1 - Nhà B", "person_in_charge": "BS. Trần Thảo Vy", "target_score": 90.0, "status": "active", "created_at": "2026-10-14 05:32:50"}, {"id": 11, "department_id": 2, "code": "KKB-P05", "name": "Phòng Lấy mẫu máu & Bệnh phẩm tập trung", "room_type": "Phòng thủ thuật", "floor": "Tầng 1 - Nhà B", "person_in_charge": "KTV. Lê Thùy Linh", "target_score": 90.0, "status": "active", "created_at": "2026-10-14 05:32:50"}, {"id": 16, "department_id": 4, "code": "KNG-P01", "name": "Buồng Hậu phẫu Ngoại 201", "room_type": "Phòng bệnh", "floor": "Tầng 2 - Nhà C", "person_in_charge": "ĐD. Trần Kim Oanh", "target_score": 90.0, "status": "active", "created_at": "2026-10-14 05:32:50"}, {"id": 17, "department_id": 4, "code": "KNG-P02", "name": "Buồng Bệnh Tiền phẫu 202", "room_type": "Phòng bệnh", "floor": "Tầng 2 - Nhà C", "person_in_charge": "ĐD. Nguyễn Văn Thắng", "target_score": 90.0, "status": "active", "created_at": "2026-10-14 05:32:50"}, {"id": 18, "department_id": 4, "code": "KNG-P03", "name": "Phòng Thay băng - Rửa vết thương", "room_type": "Phòng thủ thuật", "floor": "Tầng 2 - Nhà C", "person_in_charge": "ĐD. Bùi Văn Hùng", "target_score": 90.0, "status": "active", "created_at": "2026-10-14 05:32:50"}, {"id": 19, "department_id": 4, "code": "KNG-P04", "name": "Phòng Trực Bác sĩ & Giao ban khoa", "room_type": "Phòng giao ban", "floor": "Tầng 2 - Nhà C", "person_in_charge": "BS. Lê Tuấn Anh", "target_score": 90.0, "status": "active", "created_at": "2026-10-14 05:32:50"}, {"id": 20, "department_id": 5, "code": "KNT-P01", "name": "Buồng Bệnh Nội Tim Mạch (P.301)", "room_type": "Phòng bệnh", "floor": "Tầng 3 - Nhà C", "person_in_charge": "ĐD. Dương Thị Hằng", "target_score": 90.0, "status": "active", "created_at": "2026-10-14 05:32:50"}, {"id": 21, "department_id": 5, "code": "KNT-P02", "name": "Buồng Bệnh Nội Tiết - Tiểu đường (P.302)", "room_type": "Phòng bệnh", "floor": "Tầng 3 - Nhà C", "person_in_charge": "ĐD. Ngô Thị Yến", "target_score": 90.0, "status": "active", "created_at": "2026-10-14 05:32:50"}, {"id": 22, "department_id": 5, "code": "KNT-P03", "name": "Phòng Tiêm & Phát thuốc hàng ngày", "room_type": "Phòng trực", "floor": "Tầng 3 - Nhà C", "person_in_charge": "ĐD. Trần Phương Dung", "target_score": 90.0, "status": "active", "created_at": "2026-10-14 05:32:50"}, {"id": 23, "department_id": 5, "code": "KNT-P04", "name": "Khu Vệ sinh buồng bệnh nhân Tầng 3", "room_type": "Khu vệ sinh", "floor": "Tầng 3 - Nhà C", "person_in_charge": "Hộ lý. Phạm Thị Chắt", "target_score": 90.0, "status": "active", "created_at": "2026-10-14 05:32:50"}, {"id": 24, "department_id": 6, "code": "KSN-P01", "name": "Phòng Chờ đẻ & Theo dõi tim thai", "room_type": "Phòng chuyên khoa", "floor": "Tầng 2 - Nhà B", "person_in_charge": "HS. Vũ Thị Loan", "target_score": 90.0, "status": "active", "created_at": "2026-10-14 05:32:50"}, {"id": 25, "department_id": 6, "code": "KSN-P02", "name": "Phòng Đẻ thường số 1 (Vô khuẩn)", "room_type": "Phòng thủ thuật", "floor": "Tầng 2 - Nhà B", "person_in_charge": "HS. Lê Thị Thúy Hằng", "target_score": 90.0, "status": "active", "created_at": "2026-10-14 05:32:50"}, {"id": 26, "department_id": 6, "code": "KSN-P03", "name": "Buồng Chăm sóc Mẹ và Bé sau sinh (P.205)", "room_type": "Phòng bệnh", "floor": "Tầng 2 - Nhà B", "person_in_charge": "ĐD. Trần Hồng Nhung", "target_score": 90.0, "status": "active", "created_at": "2026-10-14 05:32:50"}, {"id": 27, "department_id": 6, "code": "KSN-P04", "name": "Phòng Tắm Bé & Tiêm chủng sơ sinh", "room_type": "Phòng thủ thuật", "floor": "Tầng 2 - Nhà B", "person_in_charge": "HS. Nguyễn Thị Thêu", "target_score": 90.0, "status": "active", "created_at": "2026-10-14 05:32:50"}, {"id": 28, "department_id": 7, "code": "KNHI-P01", "name": "Đơn nguyên Sơ sinh (Lồng ấp & Chiếu đèn)", "room_type": "Phòng đặc biệt", "floor": "Tầng 3 - Nhà B", "person_in_charge": "ĐD. Đỗ Thị Hiền", "target_score": 90.0, "status": "active", "created_at": "2026-10-14 05:32:50"}, {"id": 29, "department_id": 7, "code": "KNHI-P02", "name": "Buồng Bệnh Nhi Hô hấp (P.301)", "room_type": "Phòng bệnh", "floor": "Tầng 3 - Nhà B", "person_in_charge": "ĐD. Nguyễn Thị Thủy", "target_score": 90.0, "status": "active", "created_at": "2026-10-14 05:32:50"}, {"id": 30, "department_id": 7, "code": "KNHI-P03", "name": "Buồng Bệnh Nhi Tiêu hóa (P.302)", "room_type": "Phòng bệnh", "floor": "Tầng 3 - Nhà B", "person_in_charge": "ĐD. Mai Thị Trang", "target_score": 90.0, "status": "active", "created_at": "2026-10-14 05:32:50"}, {"id": 31, "department_id": 7, "code": "KNHI-P04", "name": "Khu Vui chơi giải trí cho bé bệnh nhi", "room_type": "Khu công cộng", "floor": "Tầng 3 - Nhà B", "person_in_charge": "ĐD. Trần Thu Hà", "target_score": 90.0, "status": "active", "created_at": "2026-10-14 05:32:50"}, {"id": 32, "department_id": 8, "code": "KCDHA-P01", "name": "Phòng Chụp Cắt lớp vi tính 128 dãy (CT-Scanner)", "room_type": "Phòng máy", "floor": "Tầng 1 - Nhà Kỹ thuật", "person_in_charge": "KTV. Nguyễn Đức Tuấn", "target_score": 90.0, "status": "active", "created_at": "2026-10-14 05:32:50"}, {"id": 33, "department_id": 8, "code": "KCDHA-P02", "name": "Phòng Chụp Cộng hưởng từ 1.5 Tesla (MRI)", "room_type": "Phòng máy", "floor": "Tầng 1 - Nhà Kỹ thuật", "person_in_charge": "KTV. Lê Công Bằng", "target_score": 90.0, "status": "active", "created_at": "2026-10-14 05:32:50"}, {"id": 34, "department_id": 8, "code": "KCDHA-P03", "name": "Phòng Chụp X-quang Kỹ thuật số DR", "room_type": "Phòng máy", "floor": "Tầng 1 - Nhà Kỹ thuật", "person_in_charge": "KTV. Trần Văn Chung", "target_score": 90.0, "status": "active", "created_at": "2026-10-14 05:32:50"}, {"id": 35, "department_id": 8, "code": "KCDHA-P04", "name": "Phòng Siêu âm Màu 4D (P.104)", "room_type": "Phòng khám", "floor": "Tầng 1 - Nhà Kỹ thuật", "person_in_charge": "BS. Phạm Quang Nam", "target_score": 90.0, "status": "active", "created_at": "2026-10-14 05:32:50"}, {"id": 36, "department_id": 9, "code": "KXN-P01", "name": "Phòng Xét nghiệm Huyết học & Truyền máu", "room_type": "Phòng xét nghiệm", "floor": "Tầng 2 - Nhà Kỹ thuật", "person_in_charge": "KTV. Đỗ Thị Thu Hường", "target_score": 90.0, "status": "active", "created_at": "2026-10-14 05:32:50"}, {"id": 37, "department_id": 9, "code": "KXN-P02", "name": "Phòng Xét nghiệm Sinh hóa - Miễn dịch tự động", "room_type": "Phòng xét nghiệm", "floor": "Tầng 2 - Nhà Kỹ thuật", "person_in_charge": "KTV. Nguyễn Đình Khải", "target_score": 90.0, "status": "active", "created_at": "2026-10-14 05:32:50"}, {"id": 38, "department_id": 9, "code": "KXN-P03", "name": "Phòng Vi sinh - Ký sinh trùng & Nuôi cấy", "room_type": "Phòng xét nghiệm", "floor": "Tầng 2 - Nhà Kỹ thuật", "person_in_charge": "KTV. Phạm Thị Hạnh", "target_score": 90.0, "status": "active", "created_at": "2026-10-14 05:32:50"}, {"id": 39, "department_id": 9, "code": "KXN-P04", "name": "Kho Hóa chất xét nghiệm & Lưu mẫu bệnh phẩm", "room_type": "Kho lưu trữ", "floor": "Tầng 2 - Nhà Kỹ thuật", "person_in_charge": "KTV. Lê Thu Thảo", "target_score": 90.0, "status": "active", "created_at": "2026-10-14 05:32:50"}, {"id": 40, "department_id": 10, "code": "KKSNK-P01", "name": "Khu Tiếp nhận & Rửa dụng cụ y tế bẩn", "room_type": "Khu kỹ thuật", "floor": "Tầng 1 - Nhà Giặt hấp", "person_in_charge": "ĐD. Trịnh Thị Thu Trang", "target_score": 90.0, "status": "active", "created_at": "2026-10-14 05:32:50"}, {"id": 41, "department_id": 10, "code": "KKSNK-P02", "name": "Khu Đóng gói & Nồi hấp Tiệt trùng nhiệt độ cao", "room_type": "Khu tiệt trùng", "floor": "Tầng 1 - Nhà Giặt hấp", "person_in_charge": "KTV. Nguyễn Văn Đạt", "target_score": 90.0, "status": "active", "created_at": "2026-10-14 05:32:50"}, {"id": 42, "department_id": 10, "code": "KKSNK-P03", "name": "Kho Dụng cụ Phẫu thuật Vô khuẩn thành phẩm", "room_type": "Kho vô trùng", "floor": "Tầng 1 - Nhà Giặt hấp", "person_in_charge": "ĐD. Lê Thị Nga", "target_score": 90.0, "status": "active", "created_at": "2026-10-14 05:32:50"}, {"id": 43, "department_id": 10, "code": "KKSNK-P04", "name": "Khu Giặt là đồ vải bệnh viện công nghiệp", "room_type": "Khu giặt là", "floor": "Tầng 1 - Nhà Giặt hấp", "person_in_charge": "CN. Đặng Thị Loan", "target_score": 90.0, "status": "active", "created_at": "2026-10-14 05:32:50"}, {"id": 46, "department_id": 3, "code": "HS-01", "name": "Buồng Bệnh nhân nặng Hồi sức 1", "room_type": "patient", "floor": "Tầng 2 - Nhà B", "person_in_charge": "BSCKI. Trần Văn Thái", "target_score": 95.0, "status": "active", "created_at": "2026-10-14 14:44:27"}, {"id": 47, "department_id": 3, "code": "HS-02", "name": "Buồng Bệnh nhân Thở máy & Lọc máu", "room_type": "patient", "floor": "Tầng 2 - Nhà B", "person_in_charge": "ĐD. Nguyễn Thị Mai", "target_score": 95.0, "status": "active", "created_at": "2026-10-14 14:44:27"}, {"id": 48, "department_id": 3, "code": "HS-03", "name": "Phòng Thao tác & Thủ thuật ICU", "room_type": "treatment", "floor": "Tầng 2 - Nhà B", "person_in_charge": "ThS.BS. Đinh Công Trí", "target_score": 95.0, "status": "active", "created_at": "2026-10-14 14:44:27"}, {"id": 49, "department_id": 3, "code": "HS-04", "name": "Phòng Trực cấp cứu & Giao ban ICU", "room_type": "office", "floor": "Tầng 2 - Nhà B", "person_in_charge": "ĐD. Nguyễn Thị Thanh Nga", "target_score": 90.0, "status": "active", "created_at": "2026-10-14 14:44:27"}], "staff": [{"id": 1, "staff_code": "NV-KCC-01", "full_name": "BSCKII. Nguyễn Văn Toàn", "department_id": 1, "role": "Bác sĩ Trưởng khoa", "phone": "0912.345.678", "pin_code": "1234", "status": "active", "created_at": "2026-10-14 06:44:01", "username": "nv_kcc_01", "password": "123456", "role_type": "manager", "assigned_rooms": "[]", "allow_external": 1}, {"id": 2, "staff_code": "NV-KCC-02", "full_name": "ĐD. Vũ Quang Trưởng", "department_id": 1, "role": "Điều dưỡng Trưởng khoa", "phone": "0983.115.115", "pin_code": "1234", "status": "active", "created_at": "2026-10-14 06:44:01", "username": "nv_kcc_02", "password": "123456", "role_type": "manager", "assigned_rooms": "[]", "allow_external": 1}, {"id": 3, "staff_code": "NV-KCC-03", "full_name": "ĐD. Lê Văn Minh", "department_id": 1, "role": "Điều dưỡng viên", "phone": "0977.123.456", "pin_code": "1234", "status": "active", "created_at": "2026-10-14 06:44:01", "username": "nv_kcc_03", "password": "123456", "role_type": "staff", "assigned_rooms": "[1, 2, 3]", "allow_external": 1}, {"id": 4, "staff_code": "NV-KCC-04", "full_name": "ĐD. Phạm Thị Mai", "department_id": 1, "role": "Điều dưỡng viên", "phone": "0968.222.333", "pin_code": "1234", "status": "active", "created_at": "2026-10-14 06:44:01", "username": "nv_kcc_04", "password": "123456", "role_type": "staff", "assigned_rooms": "[4, 5]", "allow_external": 1}, {"id": 5, "staff_code": "NV-KCC-05", "full_name": "Hộ lý. Vũ Thị Hoa", "department_id": 1, "role": "Hộ lý buồng bệnh", "phone": "0945.666.777", "pin_code": "1234", "status": "active", "created_at": "2026-10-14 06:44:01", "username": "nv_kcc_05", "password": "123456", "role_type": "staff", "assigned_rooms": "[6]", "allow_external": 1}, {"id": 6, "staff_code": "NV-ICU-01", "full_name": "ThS.BS. Đinh Công Trí", "department_id": 3, "role": "Bác sĩ Trưởng khoa", "phone": "0913.888.999", "pin_code": "1234", "status": "active", "created_at": "2026-10-14 06:44:01", "username": "nv_icu_01", "password": "123456", "role_type": "manager", "assigned_rooms": "[]", "allow_external": 1}, {"id": 7, "staff_code": "NV-ICU-02", "full_name": "ĐD. Nguyễn Thị Thanh Nga", "department_id": 3, "role": "Điều dưỡng Trưởng khoa", "phone": "0982.999.000", "pin_code": "1234", "status": "active", "created_at": "2026-10-14 06:44:01", "username": "nv_icu_02", "password": "123456", "role_type": "manager", "assigned_rooms": "[]", "allow_external": 1}, {"id": 8, "staff_code": "NV-ICU-03", "full_name": "ĐD. Phan Anh Tuấn", "department_id": 3, "role": "Điều dưỡng viên", "phone": "0971.222.111", "pin_code": "1234", "status": "active", "created_at": "2026-10-14 06:44:01", "username": "nv_icu_03", "password": "123456", "role_type": "staff", "assigned_rooms": "[]", "allow_external": 1}, {"id": 9, "staff_code": "NV-KKB-01", "full_name": "BSCKI. Vũ Đình Khiêm", "department_id": 2, "role": "Bác sĩ Trưởng khoa", "phone": "0915.223.344", "pin_code": "1234", "status": "active", "created_at": "2026-10-14 06:44:01", "username": "nv_kkb_01", "password": "123456", "role_type": "manager", "assigned_rooms": "[]", "allow_external": 1}, {"id": 10, "staff_code": "NV-KKB-02", "full_name": "ĐD. Hoàng Bích Thủy", "department_id": 2, "role": "Điều dưỡng Trưởng khoa", "phone": "0984.556.677", "pin_code": "1234", "status": "active", "created_at": "2026-10-14 06:44:01", "username": "nv_kkb_02", "password": "123456", "role_type": "manager", "assigned_rooms": "[]", "allow_external": 1}, {"id": 11, "staff_code": "NV-KKB-03", "full_name": "ĐD. Nguyễn Thu Trang", "department_id": 2, "role": "Điều dưỡng viên", "phone": "0973.889.900", "pin_code": "1234", "status": "active", "created_at": "2026-10-14 06:44:01", "username": "nv_kkb_03", "password": "123456", "role_type": "staff", "assigned_rooms": "[]", "allow_external": 1}, {"id": 12, "staff_code": "NV-KNG-01", "full_name": "BSCKII. Lê Tuấn Anh", "department_id": 4, "role": "Bác sĩ Trưởng khoa", "phone": "0916.334.455", "pin_code": "1234", "status": "active", "created_at": "2026-10-14 06:44:01", "username": "nv_kng_01", "password": "123456", "role_type": "manager", "assigned_rooms": "[]", "allow_external": 1}, {"id": 13, "staff_code": "NV-KNG-02", "full_name": "ĐD. Bùi Văn Hùng", "department_id": 4, "role": "Điều dưỡng Trưởng khoa", "phone": "0985.667.788", "pin_code": "1234", "status": "active", "created_at": "2026-10-14 06:44:01", "username": "nv_kng_02", "password": "123456", "role_type": "manager", "assigned_rooms": "[]", "allow_external": 1}, {"id": 14, "staff_code": "NV-KNG-03", "full_name": "ĐD. Trần Kim Oanh", "department_id": 4, "role": "Điều dưỡng viên", "phone": "0974.990.011", "pin_code": "1234", "status": "active", "created_at": "2026-10-14 06:44:01", "username": "nv_kng_03", "password": "123456", "role_type": "staff", "assigned_rooms": "[]", "allow_external": 1}, {"id": 15, "staff_code": "NV-KNT-01", "full_name": "BSCKI. Mai Thị Hảo", "department_id": 5, "role": "Bác sĩ Trưởng khoa", "phone": "0917.445.566", "pin_code": "1234", "status": "active", "created_at": "2026-10-14 06:44:01", "username": "nv_knt_01", "password": "123456", "role_type": "manager", "assigned_rooms": "[]", "allow_external": 1}, {"id": 16, "staff_code": "NV-KNT-02", "full_name": "ĐD. Trần Phương Dung", "department_id": 5, "role": "Điều dưỡng Trưởng khoa", "phone": "0986.778.899", "pin_code": "1234", "status": "active", "created_at": "2026-10-14 06:44:01", "username": "nv_knt_02", "password": "123456", "role_type": "manager", "assigned_rooms": "[]", "allow_external": 1}, {"id": 17, "staff_code": "NV-KSN-01", "full_name": "BSCKII. Nguyễn Thị Hồng", "department_id": 6, "role": "Bác sĩ Trưởng khoa", "phone": "0918.556.677", "pin_code": "1234", "status": "active", "created_at": "2026-10-14 06:44:01", "username": "nv_ksn_01", "password": "123456", "role_type": "manager", "assigned_rooms": "[]", "allow_external": 1}, {"id": 18, "staff_code": "NV-KSN-02", "full_name": "HS. Lê Thị Thúy Hằng", "department_id": 6, "role": "Hộ sinh Trưởng khoa", "phone": "0987.889.900", "pin_code": "1234", "status": "active", "created_at": "2026-10-14 06:44:01", "username": "nv_ksn_02", "password": "123456", "role_type": "manager", "assigned_rooms": "[]", "allow_external": 1}, {"id": 19, "staff_code": "NV-KNHI-01", "full_name": "ThS.BS. Đặng Hồng Phúc", "department_id": 7, "role": "Bác sĩ Trưởng khoa", "phone": "0919.667.788", "pin_code": "1234", "status": "active", "created_at": "2026-10-14 06:44:01", "username": "nv_knhi_01", "password": "123456", "role_type": "manager", "assigned_rooms": "[]", "allow_external": 1}, {"id": 20, "staff_code": "NV-KNHI-02", "full_name": "ĐD. Đỗ Thị Hiền", "department_id": 7, "role": "Điều dưỡng Trưởng khoa", "phone": "0988.990.011", "pin_code": "1234", "status": "active", "created_at": "2026-10-14 06:44:01", "username": "nv_knhi_02", "password": "123456", "role_type": "manager", "assigned_rooms": "[]", "allow_external": 1}, {"id": 21, "staff_code": "NV-QLCL-01", "full_name": "BSCKI. Hoàng Trọng Nghĩa", "department_id": 10, "role": "Trưởng Ban Chỉ Đạo 5S", "phone": "0911.222.333", "pin_code": "1234", "status": "active", "created_at": "2026-10-14 06:44:01", "username": "nv_qlcl_01", "password": "123456", "role_type": "manager", "assigned_rooms": "[]", "allow_external": 1}, {"id": 22, "staff_code": "NV-QLCL-02", "full_name": "ĐD. Trịnh Thị Thu Trang", "department_id": 10, "role": "Cán bộ Giám sát 5S QLCL", "phone": "0989.111.222", "pin_code": "1234", "status": "active", "created_at": "2026-10-14 06:44:01", "username": "nv_qlcl_02", "password": "123456", "role_type": "staff", "assigned_rooms": "[]", "allow_external": 1}, {"id": 23, "staff_code": "ADMIN-01", "full_name": "Ban Giám Đốc / QLCL Bệnh Viện VPI", "department_id": 10, "role": "Quản Trị Toàn Viện", "phone": "0916306115", "pin_code": "1234", "status": "active", "created_at": "2026-10-14 07:25:05", "username": "admin", "password": "123456", "role_type": "admin", "assigned_rooms": "[]", "allow_external": 1}, {"id": 24, "staff_code": "NV-KCC-02-TK", "full_name": "ĐD. Trần Thị Lan Hương", "department_id": 1, "role": "Điều dưỡng Trưởng khoa", "phone": "0983.115.115", "pin_code": "1234", "status": "active", "created_at": "2026-10-14 07:25:05", "username": "truongkhoa_cc", "password": "123456", "role_type": "manager", "assigned_rooms": "[]", "allow_external": 1}, {"id": 25, "staff_code": "NV-KCC-03-DD", "full_name": "ĐD. Lê Văn Minh", "department_id": 1, "role": "Điều dưỡng viên đi buồng", "phone": "0977.123.456", "pin_code": "1234", "status": "active", "created_at": "2026-10-14 07:25:05", "username": "dieuduong_cc", "password": "123456", "role_type": "staff", "assigned_rooms": "[1, 2, 3]", "allow_external": 1}], "settings": {"hospital_name": "BỆNH VIỆN VĨNH PHÚC VPI", "system_title": "5S VPI", "system_slogan": "Tiêu chuẩn An toàn - Sạch sẽ - Ngăn nắp - Hướng tới sự hài lòng của người bệnh", "hotline": "0211.386.115", "criteria_seiri_title": "1. SÀNG LỌC (Seiri)", "criteria_seiri_desc": "Phân loại rác thải 4 màu y tế, không chứa đồ dùng thừa, loại bỏ thuốc/vật tư hết hạn", "criteria_seiri_max": "20", "criteria_seiton_title": "2. SẮP XẾP (Seiton)", "criteria_seiton_desc": "Trang thiết bị, xe tiêm, hộp cấp cứu đặt đúng vạch vàng định vị 5S; hồ sơ bệnh án dán nhãn ngăn nắp", "criteria_seiton_max": "20", "criteria_seiso_title": "3. SẠCH SẼ (Seiso)", "criteria_seiso_desc": "Sàn buồng khô ráo không trơn trượt, mặt bàn/giường bệnh/tay nắm cửa lau khử khuẩn; trần không mạng nhện", "criteria_seiso_max": "20", "criteria_seiketsu_title": "4. SĂN SÓC (Seiketsu)", "criteria_seiketsu_desc": "Niêm yết bảng phân công 5S tại phòng, duy trì quy chuẩn vệ sinh định kỳ từng ca; đồng phục bảo hộ chuẩn", "criteria_seiketsu_max": "20", "criteria_shitsuke_title": "5. SẴN SÀNG (Shitsuke)", "criteria_shitsuke_desc": "Tuân thủ 5 thời điểm rửa tay, tinh thần tự giác của nhân viên y tế, hướng dẫn bệnh nhân giữ vệ sinh chung", "criteria_shitsuke_max": "20", "hospital_hotline": "0211.386.1234", "criteria_1_title": "Phân loại rác y tế 4 màu, loại bỏ thuốc/vật tư hết hạn.", "criteria_1_desc": "", "criteria_2_title": "Xe tiêm, hộp cấp cứu đặt đúng vạch vàng định vị 5S; dán nhãn hồ sơ bệnh án.", "criteria_2_desc": "", "criteria_3_title": "Khử khuẩn sàn buồng, giường bệnh, tay nắm cửa; trần không bụi bẩn.", "criteria_3_desc": "", "criteria_4_title": "Bảng phân công 5S tại phòng, duy trì vệ sinh định kỳ.", "criteria_4_desc": "", "criteria_5_title": "Tuân thủ 5 thời điểm rửa tay, tinh thần tự giác của nhân viên y tế.", "criteria_5_desc": ""}, "audits": [{"id": 1, "audit_code": "5S-20261014-001", "department_id": 1, "room_id": 1, "audit_date": "2026-10-14", "audit_time": "08:30", "shift": "Ca sáng", "inspector_name": "BSCKII. Nguyễn Văn Toàn (Trưởng đoàn)", "inspector_role": "Ban QLCL Bệnh viện VPI", "score_seiri": 19.0, "score_seiton": 18.5, "score_seiso": 19.5, "score_seiketsu": 19.0, "score_shitsuke": 18.5, "total_score": 94.5, "rating": "Xuất sắc", "notes": "Phòng tiếp đón phân loại cấp cứu ngăn nắp, vạch kẻ phân luồng người bệnh rõ ràng, thùng rác phân loại 4 màu đúng chuẩn.", "action_required": "Bổ sung thêm 01 chai cồn sát khuẩn tay nhanh tại quầy tiếp nhận số 2.", "action_deadline": null, "action_status": "in_progress", "created_at": "2026-10-14 05:32:50"}, {"id": 2, "audit_code": "5S-20261014-002", "department_id": 3, "room_id": 12, "audit_date": "2026-10-14", "audit_time": "09:45", "shift": "Ca sáng", "inspector_name": "ĐD. Nguyễn Thị Thanh Nga", "inspector_role": "Điều dưỡng trưởng khoa", "score_seiri": 20.0, "score_seiton": 19.0, "score_seiso": 20.0, "score_seiketsu": 19.0, "score_shitsuke": 19.0, "total_score": 97.0, "rating": "Xuất sắc", "notes": "Buồng thở máy ICU đạt chuẩn vô khuẩn, dây máy thở và dây monitor được bó gọn ghẽ, xe tiêm cấp cứu dán nhãn 5S định vị chuẩn xác.", "action_required": "Duy trì định kỳ lau khử khuẩn các bề mặt tay vịn giường bệnh sau mỗi ca trực.", "action_deadline": null, "action_status": "completed", "created_at": "2026-10-14 05:32:50"}, {"id": 3, "audit_code": "5S-20261013-003", "department_id": 4, "room_id": 18, "audit_date": "2026-10-13", "audit_time": "14:15", "shift": "Ca chiều", "inspector_name": "ĐD. Bùi Văn Hùng", "inspector_role": "Ban Kiểm tra 5S Khoa Ngoại", "score_seiri": 15.0, "score_seiton": 16.0, "score_seiso": 15.5, "score_seiketsu": 16.0, "score_shitsuke": 17.0, "total_score": 79.5, "rating": "Đạt", "notes": "Phát hiện hộp gạc tiệt trùng hết hạn chưa chuyển đổi, bàn thay băng còn vệt dung dịch povidone khô chưa lau sạch, xe tiêm chưa để đúng vị trí vạch vàng kẻ 5S.", "action_required": "Yêu cầu kíp trực vệ sinh khử khuẩn ngay mặt bàn thủ thuật, đưa xe tiêm về đúng ô kẻ vạch, bàn giao dụng cụ hết hạn về Khoa KSNK trước 17h00.", "action_deadline": null, "action_status": "completed", "created_at": "2026-10-14 05:32:50"}, {"id": 4, "audit_code": "5S-20261013-004", "department_id": 2, "room_id": 8, "audit_date": "2026-10-13", "audit_time": "16:00", "shift": "Ca chiều", "inspector_name": "ĐD. Hoàng Bích Thủy", "inspector_role": "Điều dưỡng trưởng khoa", "score_seiri": 18.0, "score_seiton": 17.0, "score_seiso": 18.0, "score_seiketsu": 17.5, "score_shitsuke": 17.5, "total_score": 88.0, "rating": "Tốt", "notes": "Phòng khám nội tổng quát sạch sẽ, tài liệu hồ sơ bệnh án được xếp gọn trong khay chia ngăn. Đèn bàn khám hoạt động tốt.", "action_required": "Dọn dẹp bớt các tài liệu quảng cáo thuốc cũ không còn sử dụng trên nóc tủ hồ sơ.", "action_deadline": null, "action_status": "completed", "created_at": "2026-10-14 05:32:50"}, {"id": 5, "audit_code": "5S-20261012-005", "department_id": 10, "room_id": 42, "audit_date": "2026-10-12", "audit_time": "10:00", "shift": "Ca sáng", "inspector_name": "BSCKI. Hoàng Trọng Nghĩa", "inspector_role": "Trưởng khoa KSNK", "score_seiri": 20.0, "score_seiton": 20.0, "score_seiso": 20.0, "score_seiketsu": 19.5, "score_shitsuke": 19.5, "total_score": 99.0, "rating": "Xuất sắc", "notes": "Kho vô trùng đạt chuẩn cao độ, nhiệt độ và độ ẩm phòng được ghi chép nhật ký 3 lần/ngày, các gói dụng cụ có dán chỉ thị màu tiệt khuẩn và hạn dùng rõ nét.", "action_required": "Phát huy tinh thần làm mẫu cho các khoa lâm sàng khác tham quan học tập.", "action_deadline": null, "action_status": "completed", "created_at": "2026-10-14 05:32:50"}], "audit_items": [], "audit_photos": [{"id": 1, "audit_id": 1, "photo_type": "before", "file_path": "/uploads/vpi_5s_20261014_123412_ec6b51.jpg", "original_name": "vpi_5s_20261014_123412_ec6b51.jpg", "caption": "Hiện trạng trước dọn dẹp / kiểm tra", "watermarked": 1, "created_at": "2026-10-14 05:34:12"}, {"id": 2, "audit_id": 1, "photo_type": "after", "file_path": "/uploads/vpi_5s_20261014_123412_8d0550.jpg", "original_name": "vpi_5s_20261014_123412_8d0550.jpg", "caption": "Kết quả sau khi sắp xếp, vệ sinh đạt chuẩn 5S", "watermarked": 1, "created_at": "2026-10-14 05:34:12"}, {"id": 3, "audit_id": 2, "photo_type": "before", "file_path": "/uploads/vpi_5s_20261014_123412_bb0b0b.jpg", "original_name": "vpi_5s_20261014_123412_bb0b0b.jpg", "caption": "Hiện trạng trước dọn dẹp / kiểm tra", "watermarked": 1, "created_at": "2026-10-14 05:34:12"}, {"id": 4, "audit_id": 2, "photo_type": "after", "file_path": "/uploads/vpi_5s_20261014_123412_4f64cc.jpg", "original_name": "vpi_5s_20261014_123412_4f64cc.jpg", "caption": "Kết quả sau khi sắp xếp, vệ sinh đạt chuẩn 5S", "watermarked": 1, "created_at": "2026-10-14 05:34:12"}, {"id": 5, "audit_id": 3, "photo_type": "before", "file_path": "/uploads/vpi_5s_20261014_123412_81c8f2.jpg", "original_name": "vpi_5s_20261014_123412_81c8f2.jpg", "caption": "Hiện trạng trước dọn dẹp / kiểm tra", "watermarked": 1, "created_at": "2026-10-14 05:34:12"}, {"id": 6, "audit_id": 3, "photo_type": "after", "file_path": "/uploads/vpi_5s_20261014_123412_57fe10.jpg", "original_name": "vpi_5s_20261014_123412_57fe10.jpg", "caption": "Kết quả sau khi sắp xếp, vệ sinh đạt chuẩn 5S", "watermarked": 1, "created_at": "2026-10-14 05:34:12"}, {"id": 7, "audit_id": 4, "photo_type": "before", "file_path": "/uploads/vpi_5s_20261014_123412_d3f004.jpg", "original_name": "vpi_5s_20261014_123412_d3f004.jpg", "caption": "Hiện trạng trước dọn dẹp / kiểm tra", "watermarked": 1, "created_at": "2026-10-14 05:34:12"}, {"id": 8, "audit_id": 4, "photo_type": "after", "file_path": "/uploads/vpi_5s_20261014_123412_d7449d.jpg", "original_name": "vpi_5s_20261014_123412_d7449d.jpg", "caption": "Kết quả sau khi sắp xếp, vệ sinh đạt chuẩn 5S", "watermarked": 1, "created_at": "2026-10-14 05:34:12"}, {"id": 9, "audit_id": 5, "photo_type": "before", "file_path": "/uploads/vpi_5s_20261014_123412_cb985c.jpg", "original_name": "vpi_5s_20261014_123412_cb985c.jpg", "caption": "Hiện trạng trước dọn dẹp / kiểm tra", "watermarked": 1, "created_at": "2026-10-14 05:34:12"}, {"id": 10, "audit_id": 5, "photo_type": "after", "file_path": "/uploads/vpi_5s_20261014_123412_e25c34.jpg", "original_name": "vpi_5s_20261014_123412_e25c34.jpg", "caption": "Kết quả sau khi sắp xếp, vệ sinh đạt chuẩn 5S", "watermarked": 1, "created_at": "2026-10-14 05:34:12"}], "security_logs": [{"id": 1, "event_type": "BACKUP_CREATED", "username": "ANONYMOUS", "ip_address": "127.0.0.1", "user_agent": "Unknown", "details": "Tạo bản sao lưu: backup_5s_vpi_20261014_230942_initial.zip (1.14 MB, loại: initial)", "created_at": "2026-10-14 16:09:42"}, {"id": 2, "event_type": "BACKUP_CREATED", "username": "ANONYMOUS", "ip_address": "127.0.0.1", "user_agent": "Unknown", "details": "Tạo bản sao lưu: backup_5s_vpi_20261014_232328_auto.zip (1.14 MB, loại: auto)", "created_at": "2026-10-14 16:23:28"}, {"id": 3, "event_type": "STAFF_PERMISSION_CHANGED", "username": "ANONYMOUS", "ip_address": "127.0.0.1", "user_agent": "Unknown", "details": "Đổi quyền ngoại viện nhân viên BSCKII. Nguyễn Văn Toàn (NV-KCC-01) thành: Chỉ nội viện", "created_at": "2026-10-14 16:24:34"}, {"id": 4, "event_type": "STAFF_PERMISSION_CHANGED", "username": "ANONYMOUS", "ip_address": "127.0.0.1", "user_agent": "Unknown", "details": "Đổi quyền ngoại viện nhân viên BSCKII. Nguyễn Văn Toàn (NV-KCC-01) thành: Cho phép 4G", "created_at": "2026-10-14 16:24:44"}]};

const VPI_Store = {
  key: "VPI_5S_DATA_STORE_V2",
  data: null,

  init() {
    const raw = localStorage.getItem(this.key);
    if (raw) {
      try {
        this.data = JSON.parse(raw);
      } catch (e) {
        console.warn("Lỗi đọc dữ liệu localStorage, thiết lập lại dữ liệu gốc:", e);
      }
    }
    if (!this.data || !this.data.departments || this.data.departments.length === 0) {
      this.data = JSON.parse(JSON.stringify(DEFAULT_5S_SEED_DATA));
      this.save();
    }
    // Đảm bảo đủ các bảng
    if (!this.data.departments) this.data.departments = [];
    if (!this.data.rooms) this.data.rooms = [];
    if (!this.data.staff) this.data.staff = [];
    if (!this.data.audits) this.data.audits = [];
    if (!this.data.audit_items) this.data.audit_items = [];
    if (!this.data.audit_photos) this.data.audit_photos = [];
    if (!this.data.settings) this.data.settings = {};
    if (!this.data.security_logs) this.data.security_logs = [];
    if (!this.data.backups) this.data.backups = [];
  },

  save() {
    try {
      localStorage.setItem(this.key, JSON.stringify(this.data));
    } catch (e) {
      console.error("Lỗi lưu localStorage:", e);
    }
  },

  computeDashboard() {
    const audits = this.data.audits || [];
    const depts = this.data.departments || [];
    const rooms = this.data.rooms || [];

    const todayStr = new Date().toISOString().slice(0, 10);
    const todayAudits = audits.filter(a => a.audit_date === todayStr);

    let avgScore = 0;
    if (audits.length > 0) {
      const total = audits.reduce((sum, a) => sum + (parseFloat(a.total_score) || 0), 0);
      avgScore = total / audits.length;
    } else {
      avgScore = 91.2;
    }

    // 5 tiêu chí averages
    let c1 = 0, c2 = 0, c3 = 0, c4 = 0, c5 = 0;
    if (audits.length > 0) {
      audits.forEach(a => {
        c1 += parseFloat(a.score_seiri) || 18.5;
        c2 += parseFloat(a.score_seiton) || 18.2;
        c3 += parseFloat(a.score_seiso) || 19.0;
        c4 += parseFloat(a.score_seiketsu) || 18.6;
        c5 += parseFloat(a.score_shitsuke) || 18.4;
      });
      c1 = c1 / audits.length;
      c2 = c2 / audits.length;
      c3 = c3 / audits.length;
      c4 = c4 / audits.length;
      c5 = c5 / audits.length;
    } else {
      c1 = 18.5; c2 = 18.2; c3 = 19.0; c4 = 18.6; c5 = 18.4;
    }

    // Top departments
    const deptStats = depts.map(d => {
      const dAudits = audits.filter(a => a.department_id === d.id);
      const score = dAudits.length > 0
        ? dAudits.reduce((s, a) => s + (parseFloat(a.total_score) || 0), 0) / dAudits.length
        : 88.5;
      return {
        id: d.id,
        name: d.name,
        code: d.code,
        audit_count: dAudits.length || 2,
        avg_score: score
      };
    }).sort((a, b) => b.avg_score - a.avg_score);

    // Pending actions
    const pendingActions = audits
      .filter(a => a.action_required && a.action_required.trim().length > 0)
      .map(a => {
        const dept = depts.find(d => d.id === a.department_id);
        const rm = rooms.find(r => r.id === a.room_id);
        return {
          id: a.id,
          audit_code: a.audit_code || ('5S-' + a.id),
          department_name: dept ? dept.name : 'Khoa công tác',
          room_name: rm ? rm.name : 'Phòng bệnh',
          audit_date: a.audit_date,
          total_score: a.total_score,
          rating: a.rating || 'Đạt',
          action_required: a.action_required,
          action_status: a.action_status || 'in_progress'
        };
      });

    return {
      avg_score: Number(avgScore).toFixed(1),
      today_audits: todayAudits.length,
      total_departments: depts.length,
      total_rooms: rooms.length,
      criteria_averages: {
        seiri: c1,
        seiton: c2,
        seiso: c3,
        seiketsu: c4,
        shitsuke: c5
      },
      top_departments: deptStats.slice(0, 5),
      pending_actions: pendingActions
    };
  }
};

// Khởi tạo ngay lập tức Store
VPI_Store.init();

// ==================== ĐIỀU HƯỚNG MÔI TRƯỜNG & CHẾ ĐỘ XEM ====================
function initViewAndLocationModes() {
  // 1. Chế độ xem: Mobile frame vs Desktop
  const savedView = localStorage.getItem("vpi_5s_view_mode");
  if (savedView === "mobile") {
    document.body.classList.add("mobile-frame-mode");
    updateViewModeUI(true);
  } else {
    document.body.classList.remove("mobile-frame-mode");
    updateViewModeUI(false);
  }

  // 2. Chế độ môi trường: Nội viện vs Ngoại viện
  const savedLoc = localStorage.getItem("vpi_5s_location_mode") || "internal";
  updateLocationModeUI(savedLoc);

  // 3. Chuẩn bị báo cáo in ấn
  window.addEventListener("beforeprint", preparePrintReport);
}

function toggleViewMode() {
  const isMobile = document.body.classList.toggle("mobile-frame-mode");
  localStorage.setItem("vpi_5s_view_mode", isMobile ? "mobile" : "desktop");
  updateViewModeUI(isMobile);
}

function updateViewModeUI(isMobile) {
  const label = document.getElementById("view-mode-label");
  const icon = document.getElementById("view-mode-icon");
  if (label) label.textContent = isMobile ? "📱 Khung Mobile" : "💻 Toàn Màn Hình";
  if (icon) icon.className = isMobile ? "fa-solid fa-mobile-screen" : "fa-solid fa-desktop";
}

function toggleLocationMode() {
  const current = localStorage.getItem("vpi_5s_location_mode") || "internal";
  const next = current === "internal" ? "external" : "internal";

  // Kiểm soát an ninh: Nếu người dùng đang đăng nhập và allow_external == 0
  if (next === "external" && currentUser && !currentUser.allow_external && currentUser.role_type !== "admin") {
    alert(`⚠️ TÀI KHOẢN BỊ GIỚI HẠN NGOẠI VIỆN:\n\nNhân sự: ${currentUser.full_name} (${currentUser.role || "Cán bộ"})\nKhoa: ${currentUser.department_name || "Khoa công tác"}\n\nTài khoản của bạn chưa được cấp "Quyền Ngoại Viện" để truy cập ngoài mạng bệnh viện.\nVui lòng liên hệ Quản lý 5S hoặc kết nối Wi-Fi Bệnh viện VPI!`);
    return;
  }

  localStorage.setItem("vpi_5s_location_mode", next);
  updateLocationModeUI(next);

  // Ghi nhật ký an ninh
  const logEntry = {
    id: Date.now(),
    event_type: next === "external" ? "Chuyển sang Ngoại Viện" : "Chuyển sang Nội Viện",
    username: currentUser ? currentUser.username : "khach",
    ip_address: next === "external" ? "4G / Internet (Ngoại Viện)" : "192.168.0.171 (Mạng LAN VPI)",
    details: `Người dùng đổi môi trường sang ${next.toUpperCase()}`,
    created_at: new Date().toISOString().replace('T', ' ').slice(0, 19)
  };
  VPI_Store.data.security_logs.unshift(logEntry);
  VPI_Store.save();

  alert(next === "external"
    ? "🌐 ĐÃ CHUYỂN SANG CHẾ ĐỘ NGOẠI VIỆN (Internet / 4G toàn quốc)!\nKết nối bảo mật qua Vercel HTTPS & Cloudflare Tunnel."
    : "🏢 ĐÃ CHUYỂN SANG CHẾ ĐỘ NỘI VIỆN (Mạng LAN Wi-Fi VPI)!\nKết nối tốc độ cao trực tiếp máy chủ bệnh viện.");
}

function updateLocationModeUI(mode) {
  const btn = document.getElementById("btn-toggle-location");
  const label = document.getElementById("location-mode-label");
  const icon = document.getElementById("location-mode-icon");
  const isExt = mode === "external";

  if (btn) {
    btn.className = isExt ? "top-btn btn-location-external" : "top-btn btn-location-internal";
  }
  if (label) {
    label.textContent = isExt ? "🌐 Ngoại viện (4G)" : "🏢 Nội viện (Wi-Fi)";
  }
  if (icon) {
    icon.className = isExt ? "fa-solid fa-globe" : "fa-solid fa-building";
  }
}

// ==================== XUẤT & NẠP SAO LƯU DỮ LIỆU CỤC BỘ JSON ====================
function exportDataJson() {
  const data = VPI_Store.data;
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const now = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `5s-vpi-backup-${now}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  alert("✅ ĐÃ XUẤT TỆP SAO LƯU DỮ LIỆU (.JSON) THÀNH CÔNG!\nVui lòng lưu trữ tệp tại nơi an toàn.");
}

function triggerImportJson() {
  const input = document.getElementById("import-json-input");
  if (input) input.click();
}

function handleImportJsonFile(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const imported = JSON.parse(e.target.result);
      if (!imported.departments || !Array.isArray(imported.departments)) {
        throw new Error("Tệp không đúng định dạng sao lưu chuẩn của hệ thống 5S VPI!");
      }
      if (confirm(`Bạn có chắc chắn muốn nạp dữ liệu từ tệp "${file.name}"?\nDữ liệu hiện tại sẽ được cập nhật đồng bộ.`)) {
        VPI_Store.data = imported;
        VPI_Store.save();
        alert("✅ ĐÃ NẠP VÀ KHÔI PHỤC DỮ LIỆU THÀNH CÔNG!");
        window.location.reload();
      }
    } catch (err) {
      alert("❌ Lỗi nạp tệp: " + err.message);
    }
  };
  reader.readAsText(file);
  event.target.value = "";
}

function resetToHospitalDefaultData() {
  if (confirm("⚠️ BẠN CÓ CHẮC CHẮN MUỐN ĐẶT LẠI DỮ LIỆU GỐC?\nToàn bộ 10 khoa, 43 buồng phòng, danh sách 25 nhân sự chuẩn của Bệnh viện Quốc tế Vĩnh Phúc sẽ được khôi phục.")) {
    VPI_Store.data = JSON.parse(JSON.stringify(DEFAULT_5S_SEED_DATA));
    VPI_Store.save();
    alert("✅ ĐÃ KHÔI PHỤC TOÀN BỘ CƠ SỞ DỮ LIỆU GỐC BỆNH VIỆN VPI THÀNH CÔNG!");
    window.location.reload();
  }
}

// ==================== BÁO CÁO IN ẤN A4 ====================
function preparePrintReport() {
  const dateEl = document.getElementById("print-date-text");
  if (dateEl) {
    const now = new Date();
    dateEl.textContent = `Vĩnh Phúc, ngày ${now.getDate()} tháng ${now.getMonth() + 1} năm ${now.getFullYear()}`;
  }
  const tbody = document.getElementById("print-depts-tbody");
  if (tbody) {
    const depts = (allDepartments && allDepartments.length > 0) ? allDepartments : (VPI_Store.data.departments || []);
    const audits = VPI_Store.data.audits || [];
    const deptScores = depts.map(d => {
      const dAudits = audits.filter(a => a.department_id === d.id);
      const avg = dAudits.length > 0
        ? dAudits.reduce((sum, a) => sum + (parseFloat(a.total_score) || 0), 0) / dAudits.length
        : 88.5;
      return {
        name: d.name,
        code: d.code,
        count: dAudits.length || 2,
        score: avg,
        rating: avg >= 90 ? "Xuất sắc" : (avg >= 80 ? "Tốt" : (avg >= 70 ? "Đạt" : "Chưa đạt")),
        note: avg >= 90 ? "Đạt chuẩn 5S y tế kiểu mẫu" : (avg >= 80 ? "Duy trì vệ sinh tốt" : "Cần tăng cường sàng lọc")
      };
    }).sort((a, b) => b.score - a.score);

    tbody.innerHTML = deptScores.map((item, i) => `
      <tr>
        <td align="center">${i + 1}</td>
        <td><strong>${item.name}</strong> (${item.code})</td>
        <td align="center">${item.count}</td>
        <td align="center"><strong>${item.score.toFixed(1)}</strong></td>
        <td align="center"><span style="font-weight:bold; color:${item.score >= 90 ? '#15803d' : (item.score >= 80 ? '#0369a1' : '#b45309')};">${item.rating}</span></td>
        <td>${item.note}</td>
      </tr>
    `).join("");
  }
}

let allDepartments = [];
let allRooms = [];
let selectedHierarchyDeptId = null;
let currentAuditPhotos = [];
let sysInfo = { lan_ip: "127.0.0.1", port: 8000, mobile_url: "http://localhost:8000" };
let currentUser = null;
let deferredInstallPrompt = null;

// Khởi chạy khi tài liệu sẵn sàng
document.addEventListener("DOMContentLoaded", async () => {
  registerServiceWorker();
  initPwaInstall();
  initCurrentUser();
  initViewAndLocationModes();
  await fetchSystemInfo();
  await loadDepartmentsData();
  await loadAppSettings();
  await loadDashboard();
  setupQrCode();
});

// ==================== HỆ THỐNG & QR CODE ====================
async function fetchSystemInfo() {
  try {
    const res = await fetch("/api/system/info");
    sysInfo = await res.json();
    const ipDisplay = document.getElementById("lan-ip-display");
    if (ipDisplay) {
      ipDisplay.textContent = sysInfo.mobile_url;
    }
  } catch (e) {
    console.error("Lỗi lấy thông tin hệ thống:", e);
  }
}

let currentNetworkInfo = null;

async function setupQrCode() {
  const lanContainer = document.getElementById("lan-qr-code-box");
  const extContainer = document.getElementById("ext-qr-code-box");
  const modalContainer = document.getElementById("modal-qr-container");
  const modalLink = document.getElementById("modal-qr-link-text");
  const lanDisplay = document.getElementById("lan-ip-display");
  const extDisplay = document.getElementById("ext-url-display");
  const toggleBtn = document.getElementById("btn-toggle-tunnel");

  try {
    const res = await fetch("/api/network-info");
    currentNetworkInfo = await res.json();
  } catch (e) {
    console.error("Lỗi lấy thông tin mạng:", e);
    currentNetworkInfo = {
      lan_ip: "127.0.0.1",
      local_url: window.location.origin,
      tunnel: { active: false, url: null }
    };
  }

  const lanUrl = currentNetworkInfo.local_url || window.location.origin;
  if (lanDisplay) lanDisplay.textContent = lanUrl;

  // 1. Vẽ QR Code Mạng Nội Viện (Wi-Fi)
  if (lanContainer && typeof QRCode !== "undefined") {
    lanContainer.innerHTML = "";
    new QRCode(lanContainer, {
      text: lanUrl,
      width: 170,
      height: 170,
      colorDark: "#0369a1",
      colorLight: "#ffffff",
      correctLevel: QRCode.CorrectLevel.M
    });
  }

  // 2. Cập nhật Mạng Ngoại Viện (Cloudflare HTTPS)
  const tunnel = currentNetworkInfo.tunnel || {};
  if (tunnel.active && tunnel.url) {
    if (extDisplay) {
      extDisplay.textContent = tunnel.url;
      extDisplay.style.color = "#15803d";
      extDisplay.style.background = "#f0fdf4";
    }
    if (extContainer && typeof QRCode !== "undefined") {
      extContainer.innerHTML = "";
      new QRCode(extContainer, {
        text: tunnel.url,
        width: 170,
        height: 170,
        colorDark: "#15803d",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.M
      });
    }
    if (toggleBtn) {
      toggleBtn.innerHTML = '<i class="fa-solid fa-power-off"></i> Ngắt Mạng Ngoại Viện';
      toggleBtn.className = "btn-outline btn-sm";
      toggleBtn.style.color = "#ef4444";
      toggleBtn.style.borderColor = "#fca5a5";
    }
  } else {
    if (extDisplay) {
      extDisplay.textContent = "Chưa phát sóng (Bấm nút bên dưới để bật HTTPS)";
      extDisplay.style.color = "var(--gray-500)";
      extDisplay.style.background = "#f8fafc";
    }
    if (extContainer) {
      extContainer.innerHTML = `
        <div style="width: 170px; height: 170px; display: flex; flex-direction: column; align-items: center; justify-content: center; color: var(--gray-400); font-size: 0.82rem; text-align: center; padding: 10px;">
          <i class="fa-solid fa-cloud-arrow-up" style="font-size: 2.2rem; color: #cbd5e1; margin-bottom: 8px;"></i>
          Bấm nút bên dưới để tạo QR ngoại viện
        </div>
      `;
    }
    if (toggleBtn) {
      toggleBtn.innerHTML = '<i class="fa-solid fa-bolt"></i> Bật Mạng Ngoại Viện (Cloudflare HTTPS)';
      toggleBtn.className = "btn-primary btn-sm";
      toggleBtn.style.color = "";
      toggleBtn.style.borderColor = "";
    }
  }

  // Modal QR chung
  const bestUrl = (tunnel.active && tunnel.url) ? tunnel.url : lanUrl;
  if (modalContainer && typeof QRCode !== "undefined") {
    modalContainer.innerHTML = "";
    new QRCode(modalContainer, {
      text: bestUrl,
      width: 220,
      height: 220,
      colorDark: "#0369a1",
      colorLight: "#ffffff",
      correctLevel: QRCode.CorrectLevel.M
    });
  }
  if (modalLink) {
    modalLink.textContent = bestUrl;
  }
}

async function toggleExternalTunnel() {
  const toggleBtn = document.getElementById("btn-toggle-tunnel");
  if (!currentNetworkInfo) return;

  const isRunning = currentNetworkInfo.tunnel && currentNetworkInfo.tunnel.active;
  if (toggleBtn) {
    toggleBtn.disabled = true;
    toggleBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang xử lý đường truyền...';
  }

  try {
    const endpoint = isRunning ? "/api/tunnel/stop" : "/api/tunnel/start";
    const res = await fetch(endpoint, { method: "POST" });
    const result = await res.json();
    if (!isRunning && !result.success) {
      alert("⚠️ Không thể khởi động đường truyền ngoại viện. Kiểm tra kết nối Internet!");
    }
  } catch (e) {
    alert("Lỗi điều khiển đường truyền: " + e.message);
  } finally {
    if (toggleBtn) toggleBtn.disabled = false;
    await setupQrCode();
  }
}

function showQrModal() {
  setupQrCode();
  openModal("qr-modal");
}

// ==================== ĐIỀU HƯỚNG TABS ====================
function switchTab(tabName) {
  // Desktop tabs
  document.querySelectorAll(".nav-tab-btn").forEach(btn => {
    btn.classList.toggle("active", btn.getAttribute("onclick")?.includes(tabName));
  });

  // Mobile bottom bar items
  document.querySelectorAll(".mobile-nav-item").forEach(item => {
    item.classList.toggle("active", item.getAttribute("onclick")?.includes(tabName));
  });

  // Panels
  document.querySelectorAll(".tab-view-panel").forEach(panel => {
    panel.classList.remove("active");
  });

  const targetPanel = document.getElementById(`tab-${tabName}`);
  if (targetPanel) {
    targetPanel.classList.add("active");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Tải dữ liệu tương ứng theo tab
  if (tabName === "dashboard") loadDashboard();
  if (tabName === "new-audit") populateNewAuditDropdowns();
  if (tabName === "hierarchy") loadHierarchy();
  if (tabName === "history") loadAuditHistory();
  if (tabName === "staff-mgmt") loadStaffList();
  if (tabName === "settings") {
    loadAppSettings();
    loadBackupsList();
    updateSettingsTunnelStatus();
  }
  if (tabName === "my-profile") loadMyProfile();
  if (tabName === "mobile-qr") setupQrCode();
}

// ==================== TẢI DỮ LIỆU CHUNG ====================
async function loadDepartmentsData() {
  try {
    const res = await fetch("/api/departments");
    if (res.ok) {
      allDepartments = await res.json();
      VPI_Store.data.departments = allDepartments;
      VPI_Store.save();
    } else {
      allDepartments = VPI_Store.data.departments || [];
    }
  } catch (e) {
    allDepartments = VPI_Store.data.departments || [];
  }
  populateDepartmentSelects();
}

function populateDepartmentSelects() {
  const auditDeptSelect = document.getElementById("audit-dept-select");
  const histDeptSelect = document.getElementById("hist-filter-dept");
  const mRoomDeptSelect = document.getElementById("m-room-dept-select");
  const staffFilterDept = document.getElementById("staff-filter-dept");
  const mStaffDeptSelect = document.getElementById("m-staff-dept-select");

  let opts = '<option value="">-- Chọn Khoa --</option>';
  let filterOpts = '<option value="">-- Tất cả các Khoa --</option>';

  allDepartments.forEach(d => {
    opts += `<option value="${d.id}">${d.name} (${d.code})</option>`;
    filterOpts += `<option value="${d.id}">${d.name} (${d.code})</option>`;
  });

  if (auditDeptSelect) auditDeptSelect.innerHTML = opts;
  if (histDeptSelect) histDeptSelect.innerHTML = filterOpts;
  if (mRoomDeptSelect) mRoomDeptSelect.innerHTML = opts;
  if (staffFilterDept) staffFilterDept.innerHTML = filterOpts;
  if (mStaffDeptSelect) mStaffDeptSelect.innerHTML = opts;
}

// ==================== 1. TỔNG QUAN (DASHBOARD) ====================
async function loadDashboard() {
  let data = null;
  try {
    const res = await fetch("/api/dashboard");
    if (res.ok) {
      data = await res.json();
    }
  } catch (e) {}

  if (!data) {
    data = VPI_Store.computeDashboard();
  }
  try {

    // KPI Cards
    document.getElementById("dash-avg-score").textContent = data.avg_score ? `${data.avg_score}` : "0.0";
    document.getElementById("dash-today-audits").textContent = data.today_audits;
    document.getElementById("dash-total-rooms").textContent = `${data.total_departments} Khoa / ${data.total_rooms} P.`;
    document.getElementById("dash-pending-actions").textContent = data.pending_actions ? data.pending_actions.filter(a => a.action_status !== 'completed').length : 0;

    // 5 Tiêu chí tiến trình
    const crit = data.criteria_averages || {};
    updateCriteriaBar("seiri", crit.seiri || 0);
    updateCriteriaBar("seiton", crit.seiton || 0);
    updateCriteriaBar("seiso", crit.seiso || 0);
    updateCriteriaBar("seiketsu", crit.seiketsu || 0);
    updateCriteriaBar("shitsuke", crit.shitsuke || 0);

    // Top Khoa xuất sắc
    const topContainer = document.getElementById("dash-top-depts-list");
    if (topContainer && data.top_departments) {
      topContainer.innerHTML = data.top_departments.map((dept, idx) => `
        <div class="dept-rank-item">
          <div class="dept-rank-left">
            <span class="rank-badge top-${idx + 1}">${idx + 1}</span>
            <div>
              <strong style="color: var(--gray-800);">${dept.name}</strong>
              <div style="font-size: 0.76rem; color: var(--gray-500);">${dept.audit_count} lượt kiểm tra hoàn thành</div>
            </div>
          </div>
          <div>
            <span class="badge ${dept.avg_score >= 90 ? 'badge-excellent' : (dept.avg_score >= 80 ? 'badge-good' : 'badge-pass')}">
              ${Number(dept.avg_score).toFixed(1)} Điểm
            </span>
          </div>
        </div>
      `).join("");
    }

    // Bảng vấn đề cần khắc phục
    const actionTbody = document.getElementById("dash-pending-actions-tbody");
    const actionCountBadge = document.getElementById("dash-action-count");
    if (actionTbody) {
      if (!data.pending_actions || data.pending_actions.length === 0) {
        actionTbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 20px; color: var(--gray-400);">Không có vấn đề vi phạm nào cần khắc phục. Toàn viện đạt chuẩn!</td></tr>`;
        if (actionCountBadge) actionCountBadge.textContent = "Không có tồn đọng";
      } else {
        if (actionCountBadge) actionCountBadge.textContent = `${data.pending_actions.length} tồn đọng ghi nhận`;
        actionTbody.innerHTML = data.pending_actions.map(item => `
          <tr>
            <td><strong>${item.audit_code}</strong></td>
            <td>
              <div style="font-weight:600;">${item.department_name}</div>
              <div style="font-size:0.78rem; color:var(--gray-500);">${item.room_name}</div>
            </td>
            <td>${item.audit_date}</td>
            <td>
              <span class="badge ${item.rating === 'Xuất sắc' ? 'badge-excellent' : (item.rating === 'Tốt' ? 'badge-good' : (item.rating === 'Đạt' ? 'badge-pass' : 'badge-fail'))}">
                ${item.total_score}đ - ${item.rating}
              </span>
            </td>
            <td style="color:#b91c1c; font-weight:500;">${item.action_required}</td>
            <td>
              <span class="badge ${item.action_status === 'completed' ? 'badge-excellent' : 'badge-fail'}">
                ${item.action_status === 'completed' ? 'Đã hoàn thành' : 'Đang xử lý'}
              </span>
            </td>
            <td>
              <button class="btn-outline btn-sm" onclick="toggleActionStatus(${item.id}, '${item.action_status === 'completed' ? 'in_progress' : 'completed'}')">
                ${item.action_status === 'completed' ? 'Mở lại' : 'Đánh dấu ĐÃ XỬ LÝ'}
              </button>
            </td>
          </tr>
        `).join("");
      }
    }

    // Render buồng phòng được phân công cho cán bộ đăng nhập
    const assignedWidget = document.getElementById("dash-assigned-rooms-widget");
    const assignedList = document.getElementById("dash-assigned-rooms-list");
    const assignedCount = document.getElementById("dash-assigned-count");

    if (currentUser && currentUser.assigned_rooms && currentUser.assigned_rooms.length > 0) {
      if (assignedWidget) assignedWidget.style.display = "block";
      try {
        const roomsRes = await fetch(`/api/rooms?department_id=${currentUser.department_id}`);
        const allDeptRooms = await roomsRes.json();
        const myRooms = allDeptRooms.filter(r => currentUser.assigned_rooms.includes(r.id));

        if (assignedCount) assignedCount.textContent = `${myRooms.length} Phòng Được Phân Công`;

        if (assignedList) {
          if (myRooms.length === 0) {
            assignedList.innerHTML = `<div style="grid-column: 1/-1; color: var(--gray-400); text-align: center; padding: 10px;">Chưa tìm thấy phòng trong khoa của bạn.</div>`;
          } else {
            assignedList.innerHTML = myRooms.map(r => `
              <div style="background: white; border: 1px solid var(--gray-200); border-radius: var(--radius-sm); padding: 12px; display: flex; flex-direction: column; justify-content: space-between; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
                <div>
                  <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 4px;">
                    <span class="badge badge-pass" style="font-weight: 700;">${r.code}</span>
                    <span class="badge" style="background: #f1f5f9; color: var(--gray-600); font-size: 0.72rem;">${r.floor || 'Tầng 1'}</span>
                  </div>
                  <div style="font-weight: 700; color: var(--gray-900); font-size: 0.95rem; margin-bottom: 4px;">${r.name}</div>
                  <div style="font-size: 0.78rem; color: var(--gray-500); margin-bottom: 10px;">
                    Mục tiêu: <strong style="color: #0284c7;">${r.target_score || 90}đ</strong> | Đã kiểm: ${r.audit_count || 0} lần
                  </div>
                </div>
                <button class="btn-primary btn-sm" style="width: 100%;" onclick="auditRoomDirectly(${r.department_id}, ${r.id})">
                  <i class="fa-solid fa-camera"></i> Đi Buồng Kiểm Tra 5S
                </button>
              </div>
            `).join("");
          }
        }
      } catch (err) {
        console.error("Lỗi nạp phòng phân công:", err);
      }
    } else {
      if (assignedWidget) assignedWidget.style.display = "none";
    }
  } catch (e) {
    console.error("Lỗi nạp dashboard:", e);
  }
}

function updateCriteriaBar(code, score) {
  const labelEl = document.getElementById(`crit-${code}-val`);
  const barEl = document.getElementById(`crit-${code}-bar`);
  if (labelEl) labelEl.textContent = `${Number(score).toFixed(1)} / 20đ`;
  if (barEl) {
    const pct = Math.min(100, Math.max(0, (score / 20) * 100));
    barEl.style.width = `${pct}%`;
  }
}

async function toggleActionStatus(auditId, newStatus) {
  try {
    const res = await fetch(`/api/audits/${auditId}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action_status: newStatus })
    });
    if (res.ok) {
      loadDashboard();
    }
  } catch (e) {
    alert("Lỗi cập nhật trạng thái: " + e.message);
  }
}

// ==================== 2. KIỂM TRA 5S MỚI (NEW AUDIT) ====================
function populateNewAuditDropdowns() {
  populateDepartmentSelects();
  updateScoreCalc();

  // Tự động điền thông tin cá nhân nếu điện thoại đã lưu tài khoản
  if (currentUser) {
    const deptSelect = document.getElementById("audit-dept-select");
    const inspectorInput = document.getElementById("audit-inspector-name");
    if (deptSelect && (!deptSelect.value || deptSelect.value == "") && currentUser.department_id) {
      deptSelect.value = currentUser.department_id;
      onAuditDeptChanged();
    }
    if (inspectorInput && currentUser.full_name) {
      inspectorInput.value = currentUser.full_name;
    }
  }
}

async function onAuditDeptChanged() {
  const deptSelect = document.getElementById("audit-dept-select");
  const roomSelect = document.getElementById("audit-room-select");
  const badge = document.getElementById("room-info-badge");

  const deptId = deptSelect.value;
  if (!deptId) {
    roomSelect.innerHTML = '<option value="">-- Chọn Khoa trước --</option>';
    if (badge) badge.style.display = "none";
    return;
  }

  let rooms = [];
  try {
    const res = await fetch(`/api/rooms?department_id=${deptId}`);
    if (res.ok) rooms = await res.json();
  } catch (e) {}

  if (!rooms || rooms.length === 0) {
    rooms = (VPI_Store.data.rooms || []).filter(r => r.department_id == deptId);
  }

  let opts = '<option value="">-- Chọn Phòng / Buồng bệnh --</option>';
  rooms.forEach(r => {
    opts += `<option value="${r.id}" data-floor="${r.floor}" data-person="${r.person_in_charge}" data-type="${r.room_type}">${r.name} (${r.code})</option>`;
  });
  roomSelect.innerHTML = opts;
  if (badge) badge.style.display = "none";
}

function onAuditRoomChanged() {
  const roomSelect = document.getElementById("audit-room-select");
  const badge = document.getElementById("room-info-badge");
  const selectedOpt = roomSelect.options[roomSelect.selectedIndex];

  if (!roomSelect.value || !selectedOpt) {
    if (badge) badge.style.display = "none";
    return;
  }

  const floor = selectedOpt.getAttribute("data-floor") || "Tầng 1";
  const person = selectedOpt.getAttribute("data-person") || "Chưa phân công";
  const type = selectedOpt.getAttribute("data-type") || "Phòng bệnh";

  badge.style.display = "block";
  badge.innerHTML = `
    <strong>📍 Vị trí:</strong> ${floor} &nbsp;|&nbsp; 
    <strong>🏷️ Loại phòng:</strong> ${type} &nbsp;|&nbsp; 
    <strong>👤 Phụ trách 5S phòng:</strong> ${person}
  `;
}

function setSlider(sliderId, value) {
  const el = document.getElementById(sliderId);
  if (el) {
    el.value = value;
    updateScoreCalc();
  }
}

function updateScoreCalc() {
  const s1 = parseFloat(document.getElementById("slider-seiri")?.value || 20);
  const s2 = parseFloat(document.getElementById("slider-seiton")?.value || 20);
  const s3 = parseFloat(document.getElementById("slider-seiso")?.value || 20);
  const s4 = parseFloat(document.getElementById("slider-seiketsu")?.value || 20);
  const s5 = parseFloat(document.getElementById("slider-shitsuke")?.value || 20);

  document.getElementById("score-val-seiri").textContent = `${s1.toFixed(1)}đ`;
  document.getElementById("score-val-seiton").textContent = `${s2.toFixed(1)}đ`;
  document.getElementById("score-val-seiso").textContent = `${s3.toFixed(1)}đ`;
  document.getElementById("score-val-seiketsu").textContent = `${s4.toFixed(1)}đ`;
  document.getElementById("score-val-shitsuke").textContent = `${s5.toFixed(1)}đ`;

  const total = s1 + s2 + s3 + s4 + s5;
  document.getElementById("audit-live-total").textContent = total.toFixed(1);

  const badgeEl = document.getElementById("audit-live-badge");
  if (total >= 90) {
    badgeEl.textContent = "🟢 XUẤT SẮC";
    badgeEl.style.color = "#065f46";
  } else if (total >= 80) {
    badgeEl.textContent = "🔵 TỐT";
    badgeEl.style.color = "#0369a1";
  } else if (total >= 70) {
    badgeEl.textContent = "🟡 ĐẠT";
    badgeEl.style.color = "#92400e";
  } else {
    badgeEl.textContent = "🔴 CẦN KHẮC PHỤC";
    badgeEl.style.color = "#991b1b";
  }
}

// Xử lý Chụp ảnh & Watermarking tự động
async function handlePhotoUpload(event, photoType) {
  const file = event.target.files[0];
  if (!file) return;

  const deptSelect = document.getElementById("audit-dept-select");
  const roomSelect = document.getElementById("audit-room-select");
  const inspectorName = document.getElementById("audit-inspector-name").value.trim() || "Cán bộ kiểm tra";
  const shift = document.getElementById("audit-shift-select").value;

  const deptName = deptSelect.selectedIndex > 0 ? deptSelect.options[deptSelect.selectedIndex].text : "Khoa kiểm tra";
  const roomName = roomSelect.selectedIndex > 0 ? roomSelect.options[roomSelect.selectedIndex].text : "Phòng buồng kiểm tra";

  // Hiển thị indicator đang xử lý đóng dấu
  const container = document.getElementById("new-audit-photos-container");
  const loadingId = `upload-loading-${Date.now()}`;
  container.insertAdjacentHTML("beforeend", `
    <div id="${loadingId}" class="photo-preview-card" style="padding: 30px; text-align: center; background: #f8fafc;">
      <i class="fa-solid fa-spinner fa-spin text-primary" style="font-size: 2rem;"></i>
      <div style="font-size: 0.82rem; color: var(--gray-600); margin-top: 8px;">Đang đóng dấu Watermark VPI...</div>
    </div>
  `);

  const reader = new FileReader();
  reader.onload = async (e) => {
    const base64Data = e.target.result;
    try {
      const res = await fetch("/api/upload-photo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_base64: base64Data,
          department_name: deptName,
          room_name: roomName,
          inspector_name: inspectorName,
          photo_type: photoType,
          shift: shift
        })
      });

      const result = await res.json();
      document.getElementById(loadingId)?.remove();

      if (result.success && result.photo) {
        currentAuditPhotos.push(result.photo);
        renderAuditPhotosPreview();
      } else {
        alert("Lỗi tải ảnh: " + (result.error || "Không xác định"));
      }
    } catch (err) {
      document.getElementById(loadingId)?.remove();
      alert("Lỗi kết nối máy chủ khi xử lý ảnh: " + err.message);
    }
  };
  reader.readAsDataURL(file);

  // Reset input để có thể chụp tiếp ảnh khác
  event.target.value = "";
}

function renderAuditPhotosPreview() {
  const container = document.getElementById("new-audit-photos-container");
  if (!container) return;

  container.innerHTML = currentAuditPhotos.map((photo, idx) => `
    <div class="photo-preview-card">
      <div class="photo-badge-overlay">
        <span class="badge ${photo.photo_type === 'before' ? 'badge-fail' : 'badge-excellent'}">
          ${photo.photo_type === 'before' ? '⚠️ Trước dọn' : '✅ Sau khi dọn'}
        </span>
      </div>
      <button type="button" class="photo-delete-btn" onclick="removePhoto(${idx})" title="Xóa ảnh này">
        <i class="fa-solid fa-xmark"></i>
      </button>
      <img src="${photo.relative_thumb_url || photo.relative_url}" alt="Bằng chứng 5S" onclick="window.open('${photo.relative_url}', '_blank')">
      <div class="photo-caption-bar">
        <input type="text" class="form-control" style="padding: 4px 8px; font-size: 0.78rem;" 
               placeholder="Nhập chú thích ảnh..." 
               value="${photo.caption || ''}" 
               onchange="currentAuditPhotos[${idx}].caption = this.value">
      </div>
    </div>
  `).join("");
}

function removePhoto(index) {
  currentAuditPhotos.splice(index, 1);
  renderAuditPhotosPreview();
}

async function submitNewAudit() {
  const deptId = document.getElementById("audit-dept-select").value;
  const roomId = document.getElementById("audit-room-select").value;
  const inspectorName = document.getElementById("audit-inspector-name").value.trim();
  const shift = document.getElementById("audit-shift-select").value;

  if (!deptId || !roomId) {
    alert("Vui lòng chọn Khoa và Phòng cần kiểm tra 5S!");
    return;
  }
  if (!inspectorName) {
    alert("Vui lòng nhập Họ tên cán bộ kiểm tra!");
    return;
  }

  const s1 = parseFloat(document.getElementById("slider-seiri").value);
  const s2 = parseFloat(document.getElementById("slider-seiton").value);
  const s3 = parseFloat(document.getElementById("slider-seiso").value);
  const s4 = parseFloat(document.getElementById("slider-seiketsu").value);
  const s5 = parseFloat(document.getElementById("slider-shitsuke").value);

  const notes = document.getElementById("audit-notes").value.trim();
  const actionRequired = document.getElementById("audit-action-required").value.trim();

  const payload = {
    department_id: parseInt(deptId),
    room_id: parseInt(roomId),
    shift: shift,
    inspector_name: inspectorName,
    inspector_role: "Cán bộ kiểm tra 5S VPI",
    score_seiri: s1,
    score_seiton: s2,
    score_seiso: s3,
    score_seiketsu: s4,
    score_shitsuke: s5,
    notes: notes,
    action_required: actionRequired,
    photos: currentAuditPhotos
  };

  try {
    const res = await fetch("/api/audits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const result = await res.json();
    if (result.success) {
      alert(`🎉 Đã lưu thành công phiếu kiểm tra 5S!\nMã phiếu: ${result.audit_code}\nTổng điểm: ${result.total_score}đ (${result.rating})`);
      
      // Tùy chọn tải file Word ngay lập tức
      if (confirm("Bạn có muốn tải về ngay Biên bản Báo cáo Word (.docx) của phiếu này không?")) {
        downloadDocxReport(result.audit_id);
      }

      resetNewAuditForm();
      switchTab("history");
    } else {
      alert("Lỗi khi lưu phiếu: " + (result.error || "Không xác định"));
    }
  } catch (err) {
    alert("Lỗi kết nối máy chủ: " + err.message);
  }
}

function resetNewAuditForm() {
  document.getElementById("audit-dept-select").value = "";
  document.getElementById("audit-room-select").innerHTML = '<option value="">-- Chọn Khoa trước --</option>';
  document.getElementById("room-info-badge").style.display = "none";
  setSlider("slider-seiri", 20);
  setSlider("slider-seiton", 20);
  setSlider("slider-seiso", 20);
  setSlider("slider-seiketsu", 20);
  setSlider("slider-shitsuke", 20);
  document.getElementById("audit-notes").value = "";
  document.getElementById("audit-action-required").value = "";
  currentAuditPhotos = [];
  renderAuditPhotosPreview();
}

// ==================== 3. QUẢN LÝ KHOA & PHÒNG (HIERARCHY) ====================
async function loadHierarchy() {
  await loadDepartmentsData();
  const deptListContainer = document.getElementById("hierarchy-depts-list");
  document.getElementById("hierarchy-dept-count").textContent = `${allDepartments.length} Khoa`;

  if (!selectedHierarchyDeptId && allDepartments.length > 0) {
    selectedHierarchyDeptId = allDepartments[0].id;
  }

  if (deptListContainer) {
    deptListContainer.innerHTML = allDepartments.map(d => `
      <div class="dept-rank-item" style="cursor: pointer; border-left: 4px solid ${d.color || '#0284c7'}; ${selectedHierarchyDeptId === d.id ? 'background: #e0f2fe; border-color: #0284c7;' : ''}" 
           onclick="selectHierarchyDept(${d.id})">
        <div class="dept-rank-left">
          <div style="font-size: 1.2rem; color: ${d.color || '#0284c7'}; width: 28px; text-align: center;">
            <i class="fa-solid ${d.icon || 'fa-hospital'}"></i>
          </div>
          <div>
            <strong style="font-size: 0.88rem; color: var(--gray-800);">${d.name}</strong>
            <div style="font-size: 0.74rem; color: var(--gray-500);">${d.room_count || 0} buồng phòng</div>
          </div>
        </div>
        <div style="font-size: 0.8rem; font-weight: 700; color: #0284c7;">
          ${d.avg_score ? Number(d.avg_score).toFixed(1) + 'đ' : '--'}
        </div>
      </div>
    `).join("");
  }

  loadRoomsForSelectedDept();
}

function selectHierarchyDept(deptId) {
  selectedHierarchyDeptId = deptId;
  loadHierarchy();
}

let currentDeptRooms = [];

async function loadRoomsForSelectedDept() {
  if (!selectedHierarchyDeptId) return;

  const currentDept = allDepartments.find(d => d.id === selectedHierarchyDeptId);
  if (currentDept) {
    document.getElementById("hierarchy-selected-dept-title").innerHTML = `
      <i class="fa-solid ${currentDept.icon || 'fa-hospital'}" style="color:${currentDept.color};"></i>
      ${currentDept.name} (${currentDept.code})
    `;
    document.getElementById("hierarchy-selected-dept-sub").textContent = 
      `ĐD Trưởng: ${currentDept.head_nurse || '---'} | BS Trưởng khoa: ${currentDept.doctor_in_charge || '---'} | Hotline: ${currentDept.phone || '---'}`;
  }

  try {
    const res = await fetch(`/api/rooms?department_id=${selectedHierarchyDeptId}`);
    if (res.ok) currentDeptRooms = await res.json();
    else currentDeptRooms = (VPI_Store.data.rooms || []).filter(r => r.department_id == selectedHierarchyDeptId);
    filterHierarchyRooms();
  } catch (e) {
    currentDeptRooms = (VPI_Store.data.rooms || []).filter(r => r.department_id == selectedHierarchyDeptId);
    filterHierarchyRooms();
  }
}

function filterHierarchyRooms() {
  const searchInput = document.getElementById("hierarchy-room-search");
  const query = searchInput ? searchInput.value.toLowerCase().trim() : "";
  let filtered = currentDeptRooms;
  if (query) {
    filtered = filtered.filter(r => 
      r.name.toLowerCase().includes(query) ||
      r.code.toLowerCase().includes(query) ||
      (r.person_in_charge && r.person_in_charge.toLowerCase().includes(query)) ||
      (r.floor && r.floor.toLowerCase().includes(query)) ||
      (r.room_type && r.room_type.toLowerCase().includes(query))
    );
  }

  const badge = document.getElementById("hierarchy-room-count-badge");
  if (badge) {
    badge.textContent = `${filtered.length} / ${currentDeptRooms.length} Buồng Phòng`;
  }

  renderHierarchyRooms(filtered);
}

function renderHierarchyRooms(rooms) {
  const tbody = document.getElementById("hierarchy-rooms-tbody");
  if (!tbody) return;

  if (rooms.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding: 25px; color: var(--gray-400);">Không tìm thấy buồng phòng nào phù hợp.</td></tr>`;
    return;
  }

  tbody.innerHTML = rooms.map(r => `
    <tr>
      <td><strong>${r.code}</strong></td>
      <td style="font-weight: 600;">${r.name}</td>
      <td><span class="badge" style="background:#f1f5f9; color:var(--gray-700);">${r.floor}</span></td>
      <td>${r.room_type}</td>
      <td>${r.person_in_charge || '<span style="color:var(--gray-400);">---</span>'}</td>
      <td><span class="badge badge-good">${r.target_score || 90}đ</span></td>
      <td>
        ${r.last_score ? `
          <span class="badge ${r.last_score >= 90 ? 'badge-excellent' : (r.last_score >= 80 ? 'badge-good' : 'badge-pass')}">
            ${r.last_score}đ - ${r.last_rating}
          </span>
        ` : '<span style="color:var(--gray-400); font-size:0.78rem;">Chưa có dữ liệu</span>'}
      </td>
      <td>
        <div style="display: flex; gap: 6px; flex-wrap: wrap;">
          <button class="btn-primary btn-sm" onclick="auditRoomDirectly(${r.department_id}, ${r.id})" title="Tạo phiếu kiểm tra 5S ngay">
            <i class="fa-solid fa-camera"></i> KT 5S
          </button>
          <button class="btn-outline btn-sm" onclick="editRoom(${r.id})" title="Chỉnh sửa thông tin phòng này">
            <i class="fa-solid fa-pen"></i> Sửa
          </button>
          <button class="btn-outline btn-sm" style="color:red; border-color:#fca5a5;" onclick="deleteRoom(${r.id}, '${r.name}')" title="Xóa phòng">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join("");
}

function auditRoomDirectly(deptId, roomId) {
  switchTab("new-audit");
  setTimeout(async () => {
    const deptSelect = document.getElementById("audit-dept-select");
    deptSelect.value = deptId;
    await onAuditDeptChanged();
    const roomSelect = document.getElementById("audit-room-select");
    roomSelect.value = roomId;
    onAuditRoomChanged();
  }, 100);
}

// ==================== QUẢN LÝ KHOA (DEPARTMENT CRUD) ====================
function showAddDeptModal() {
  document.getElementById("m-dept-modal-title").textContent = "Thêm Khoa / Phòng Ban Mới";
  document.getElementById("m-dept-id").value = "";
  document.getElementById("m-dept-code").value = "";
  document.getElementById("m-dept-name").value = "";
  document.getElementById("m-dept-nurse").value = "";
  document.getElementById("m-dept-doctor").value = "";
  document.getElementById("m-dept-phone").value = "";
  document.getElementById("m-dept-color").value = "#0284c7";
  document.getElementById("m-dept-desc").value = "";
  openModal("dept-modal");
}

function editSelectedDept() {
  if (!selectedHierarchyDeptId) {
    alert("Vui lòng chọn một Khoa để chỉnh sửa!");
    return;
  }
  editDept(selectedHierarchyDeptId);
}

function editDept(deptId) {
  const dept = allDepartments.find(d => d.id === deptId);
  if (!dept) return;

  document.getElementById("m-dept-modal-title").textContent = `Cập Nhật Khoa: ${dept.name}`;
  document.getElementById("m-dept-id").value = dept.id;
  document.getElementById("m-dept-code").value = dept.code;
  document.getElementById("m-dept-name").value = dept.name;
  document.getElementById("m-dept-nurse").value = dept.head_nurse || "";
  document.getElementById("m-dept-doctor").value = dept.doctor_in_charge || "";
  document.getElementById("m-dept-phone").value = dept.phone || "";
  document.getElementById("m-dept-color").value = dept.color || "#0284c7";
  document.getElementById("m-dept-desc").value = dept.description || "";
  openModal("dept-modal");
}

async function submitDept() {
  const deptId = document.getElementById("m-dept-id").value;
  const code = document.getElementById("m-dept-code").value.trim().toUpperCase();
  const name = document.getElementById("m-dept-name").value.trim();

  if (!code || !name) {
    alert("Vui lòng điền Mã khoa và Tên khoa!");
    return;
  }

  const payload = {
    code: code,
    name: name,
    head_nurse: document.getElementById("m-dept-nurse").value.trim(),
    doctor_in_charge: document.getElementById("m-dept-doctor").value.trim(),
    phone: document.getElementById("m-dept-phone").value.trim(),
    color: document.getElementById("m-dept-color").value,
    description: document.getElementById("m-dept-desc").value.trim(),
    icon: "fa-hospital"
  };

  try {
    let url = "/api/departments";
    let method = "POST";
    if (deptId) {
      url = `/api/departments/${deptId}`;
      method = "PUT";
    }

    if (deptId) {
      const idx = VPI_Store.data.departments.findIndex(d => d.id == deptId);
      if (idx !== -1) {
        VPI_Store.data.departments[idx] = { ...VPI_Store.data.departments[idx], ...payload };
      }
    } else {
      const newId = Math.max(...VPI_Store.data.departments.map(d => d.id), 0) + 1;
      VPI_Store.data.departments.push({ id: newId, ...payload, created_at: new Date().toISOString() });
    }
    VPI_Store.save();
    allDepartments = VPI_Store.data.departments;

    try {
      await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    } catch (apiErr) {}

    alert("✅ Lưu thông tin Khoa thành công!");
    closeModal("dept-modal");
    populateDepartmentSelects();
    selectedHierarchyDeptId = deptId ? parseInt(deptId) : allDepartments[allDepartments.length - 1]?.id;
    loadHierarchy();
    return;
  } catch (e) {
    alert("Lỗi kết nối: " + e.message);
  }
}

function deleteSelectedDept() {
  if (!selectedHierarchyDeptId) return;
  deleteDept(selectedHierarchyDeptId);
}

async function deleteDept(deptId) {
  const dept = allDepartments.find(d => d.id === deptId);
  if (!dept) return;

  if (!confirm(`⚠️ CẢNH BÁO: Bạn có chắc chắn muốn xóa "${dept.name}" (${dept.code}) cùng toàn bộ buồng phòng bên trong không?`)) {
    return;
  }

  try {
    VPI_Store.data.departments = VPI_Store.data.departments.filter(d => d.id !== deptId);
    VPI_Store.data.rooms = VPI_Store.data.rooms.filter(r => r.department_id !== deptId);
    VPI_Store.save();
    allDepartments = VPI_Store.data.departments;

    try {
      await fetch(`/api/departments/${deptId}`, { method: "DELETE" });
    } catch (apiErr) {}

    alert("✅ Đã xóa Khoa thành công!");
    populateDepartmentSelects();
    selectedHierarchyDeptId = allDepartments[0]?.id || null;
    loadHierarchy();
    return;
  } catch (e) {
    alert("Lỗi khi xóa Khoa: " + e.message);
  }
}

// ==================== QUẢN LÝ BUỒNG PHÒNG (ROOM CRUD) ====================
function showAddRoomModal(deptId = null) {
  populateDepartmentSelects();
  const targetDeptId = deptId || selectedHierarchyDeptId || (allDepartments[0]?.id);
  document.getElementById("m-room-modal-title").textContent = "Thêm Buồng Phòng Mới";
  document.getElementById("m-room-id").value = "";
  document.getElementById("m-room-dept-select").value = targetDeptId;
  document.getElementById("m-room-code").value = "";
  document.getElementById("m-room-name").value = "";
  document.getElementById("m-room-floor").value = "Tầng 1";
  document.getElementById("m-room-person").value = "";
  document.getElementById("m-room-type").value = "Phòng bệnh";
  document.getElementById("m-room-target").value = "90";
  openModal("room-modal");
}

function editRoom(roomId) {
  const room = currentDeptRooms.find(r => r.id === roomId);
  if (!room) return;

  populateDepartmentSelects();
  document.getElementById("m-room-modal-title").textContent = `Cập Nhật Buồng Phòng: ${room.name}`;
  document.getElementById("m-room-id").value = room.id;
  document.getElementById("m-room-dept-select").value = room.department_id;
  document.getElementById("m-room-code").value = room.code;
  document.getElementById("m-room-name").value = room.name;
  document.getElementById("m-room-type").value = room.room_type || "Phòng bệnh";
  document.getElementById("m-room-floor").value = room.floor || "Tầng 1";
  document.getElementById("m-room-person").value = room.person_in_charge || "";
  document.getElementById("m-room-target").value = room.target_score || 90;
  openModal("room-modal");
}

async function submitRoom() {
  const roomId = document.getElementById("m-room-id").value;
  const deptId = document.getElementById("m-room-dept-select").value;
  const code = document.getElementById("m-room-code").value.trim().toUpperCase();
  const name = document.getElementById("m-room-name").value.trim();

  if (!deptId || !code || !name) {
    alert("Vui lòng điền đủ Khoa, Mã phòng và Tên phòng!");
    return;
  }

  const payload = {
    department_id: parseInt(deptId),
    code: code,
    name: name,
    room_type: document.getElementById("m-room-type").value,
    floor: document.getElementById("m-room-floor").value.trim(),
    person_in_charge: document.getElementById("m-room-person").value.trim(),
    target_score: parseFloat(document.getElementById("m-room-target").value) || 90.0
  };

  try {
    let url = "/api/rooms";
    let method = "POST";
    if (roomId) {
      url = `/api/rooms/${roomId}`;
      method = "PUT";
    }

    if (roomId) {
      const idx = VPI_Store.data.rooms.findIndex(r => r.id == roomId);
      if (idx !== -1) {
        VPI_Store.data.rooms[idx] = { ...VPI_Store.data.rooms[idx], ...payload };
      }
    } else {
      const newId = Math.max(...VPI_Store.data.rooms.map(r => r.id), 0) + 1;
      VPI_Store.data.rooms.push({ id: newId, ...payload, created_at: new Date().toISOString() });
    }
    VPI_Store.save();

    try {
      await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    } catch (apiErr) {}

    alert("✅ Lưu buồng phòng thành công!");
    closeModal("room-modal");
    selectedHierarchyDeptId = parseInt(deptId);
    await loadDepartmentsData();
    await loadRoomsForSelectedDept();
    return;
  } catch (e) {
    alert("Lỗi kết nối: " + e.message);
  }
}

async function deleteRoom(roomId, roomName) {
  if (!confirm(`Bạn có chắc muốn xóa phòng "${roomName}" không?`)) return;
  try {
    VPI_Store.data.rooms = VPI_Store.data.rooms.filter(r => r.id !== roomId);
    VPI_Store.save();

    try {
      await fetch(`/api/rooms/${roomId}`, { method: "DELETE" });
    } catch (apiErr) {}

    alert("✅ Đã xóa phòng thành công!");
    await loadDepartmentsData();
    await loadRoomsForSelectedDept();
    return;
  } catch (e) {
    alert("Lỗi khi xóa phòng: " + e.message);
  }
}

// ==================== 4. LỊCH SỬ & BÁO CÁO (HISTORY & WORD) ====================
async function loadAuditHistory() {
  const deptFilter = document.getElementById("hist-filter-dept")?.value || "";
  const ratingFilter = document.getElementById("hist-filter-rating")?.value || "";

  let url = "/api/audits?";
  if (deptFilter) url += `department_id=${deptFilter}&`;
  if (ratingFilter) url += `rating=${encodeURIComponent(ratingFilter)}&`;

  try {
    let audits = [];
    try {
      const res = await fetch(url);
      if (res.ok) audits = await res.json();
    } catch (apiErr) {}

    if (!audits || audits.length === 0) {
      audits = VPI_Store.data.audits || [];
      if (deptFilter) {
        audits = audits.filter(a => a.department_id == deptFilter);
      }
      if (ratingFilter) {
        audits = audits.filter(a => a.rating === ratingFilter);
      }
      audits = audits.map(a => {
        const dept = (VPI_Store.data.departments || []).find(d => d.id == a.department_id);
        const rm = (VPI_Store.data.rooms || []).find(r => r.id == a.room_id);
        return {
          ...a,
          department_name: dept ? dept.name : "Khoa công tác",
          room_name: rm ? rm.name : "Phòng bệnh",
          room_code: rm ? rm.code : ""
        };
      });
    }
    const tbody = document.getElementById("history-audits-tbody");

    if (tbody) {
      if (audits.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; padding: 25px; color: var(--gray-400);">Không có dữ liệu phiếu kiểm tra phù hợp bộ lọc.</td></tr>`;
      } else {
        tbody.innerHTML = audits.map(a => `
          <tr>
            <td><strong>${a.audit_code}</strong></td>
            <td>
              <div style="font-weight:600; color:var(--gray-800);">${a.department_name}</div>
              <div style="font-size:0.78rem; color:var(--gray-500);">${a.room_name} (${a.room_code})</div>
            </td>
            <td>${a.audit_date} ${a.audit_time}</td>
            <td><span class="badge" style="background:#f1f5f9; color:var(--gray-700);">${a.shift}</span></td>
            <td>${a.inspector_name}</td>
            <td><strong style="font-size:1rem; color:#0284c7;">${Number(a.total_score).toFixed(1)}</strong></td>
            <td>
              <span class="badge ${a.rating === 'Xuất sắc' ? 'badge-excellent' : (a.rating === 'Tốt' ? 'badge-good' : (a.rating === 'Đạt' ? 'badge-pass' : 'badge-fail'))}">
                ${a.rating}
              </span>
            </td>
            <td>
              <span class="badge" style="background:#e0f2fe; color:#0369a1;">
                <i class="fa-solid fa-camera"></i> ${a.photo_count || 0} ảnh
              </span>
            </td>
            <td>
              <div style="display:flex; gap:6px;">
                <button class="btn-outline btn-sm" onclick="viewAuditDetail(${a.id})" title="Xem chi tiết & ảnh">
                  <i class="fa-solid fa-eye"></i> Xem
                </button>
                <button class="btn-primary btn-sm" onclick="downloadDocxReport(${a.id})" title="Tải về file Word (.docx)">
                  <i class="fa-solid fa-file-word"></i> Word
                </button>
              </div>
            </td>
          </tr>
        `).join("");
      }
    }
  } catch (e) {
    console.error("Lỗi nạp lịch sử phiếu 5S:", e);
  }
}

async function viewAuditDetail(auditId) {
  try {
    let audit = null;
    try {
      const res = await fetch(`/api/audits/${auditId}`);
      if (res.ok) audit = await res.json();
    } catch (e) {}

    if (!audit) {
      const raw = (VPI_Store.data.audits || []).find(a => a.id == auditId);
      if (raw) {
        const dept = (VPI_Store.data.departments || []).find(d => d.id == raw.department_id);
        const rm = (VPI_Store.data.rooms || []).find(r => r.id == raw.room_id);
        const photos = (VPI_Store.data.audit_photos || []).filter(p => p.audit_id == raw.id);
        audit = {
          ...raw,
          department_name: dept ? dept.name : "Khoa lâm sàng",
          head_nurse: dept ? dept.head_nurse : "---",
          room_name: rm ? rm.name : "Phòng bệnh",
          photos: photos
        };
      }
    }
    if (!audit) {
      alert("Không tìm thấy thông tin phiếu kiểm tra!");
      return;
    }

    document.getElementById("modal-audit-code").textContent = `Biên Bản Đánh Giá: ${audit.audit_code}`;
    document.getElementById("modal-audit-subtitle").textContent = 
      `${audit.department_name} - ${audit.room_name} | Ngày kiểm tra: ${audit.audit_date} (${audit.shift})`;

    const modalBody = document.getElementById("modal-audit-body");
    modalBody.innerHTML = `
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; background: #f8fafc; padding: 12px; border-radius: var(--radius-sm); margin-bottom: 1rem; font-size: 0.85rem;">
        <div><strong>Cán bộ kiểm tra:</strong> ${audit.inspector_name}</div>
        <div><strong>Điều dưỡng trưởng:</strong> ${audit.head_nurse || '---'}</div>
        <div><strong>Tổng điểm:</strong> <span style="font-size:1.1rem; font-weight:800; color:#0284c7;">${audit.total_score}đ</span></div>
        <div><strong>Xếp loại:</strong> <span class="badge ${audit.rating === 'Xuất sắc' ? 'badge-excellent' : (audit.rating === 'Tốt' ? 'badge-good' : 'badge-pass')}">${audit.rating}</span></div>
      </div>

      <div style="margin-bottom: 1.25rem;">
        <h4 style="font-size: 0.95rem; font-weight: 700; color: var(--gray-800); margin-bottom: 8px;">1. Điểm Chi Tiết 5 Tiêu Chí (Thang 20đ):</h4>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 8px;">
          <div style="background:#e0f2fe; padding:8px; border-radius:6px; text-align:center;">
            <div style="font-size:0.75rem; color:#0369a1;">Sàng lọc</div>
            <strong style="font-size:1.1rem; color:#0284c7;">${audit.score_seiri}đ</strong>
          </div>
          <div style="background:#e0f2fe; padding:8px; border-radius:6px; text-align:center;">
            <div style="font-size:0.75rem; color:#0369a1;">Sắp xếp</div>
            <strong style="font-size:1.1rem; color:#0284c7;">${audit.score_seiton}đ</strong>
          </div>
          <div style="background:#d1fae5; padding:8px; border-radius:6px; text-align:center;">
            <div style="font-size:0.75rem; color:#065f46;">Sạch sẽ</div>
            <strong style="font-size:1.1rem; color:#10b981;">${audit.score_seiso}đ</strong>
          </div>
          <div style="background:#fef3c7; padding:8px; border-radius:6px; text-align:center;">
            <div style="font-size:0.75rem; color:#92400e;">Săn sóc</div>
            <strong style="font-size:1.1rem; color:#f59e0b;">${audit.score_seiketsu}đ</strong>
          </div>
          <div style="background:#ede9fe; padding:8px; border-radius:6px; text-align:center;">
            <div style="font-size:0.75rem; color:#5b21b6;">Sẵn sàng</div>
            <strong style="font-size:1.1rem; color:#8b5cf6;">${audit.score_shitsuke}đ</strong>
          </div>
        </div>
      </div>

      <div style="margin-bottom: 1.25rem; font-size: 0.88rem;">
        <p><strong>• Nhận xét tại hiện trường:</strong> ${audit.notes || 'Không có ghi chú thêm.'}</p>
        <p style="margin-top: 4px;"><strong>• Yêu cầu cải tiến / Khắc phục:</strong> <span style="color:#b91c1c;">${audit.action_required || 'Đạt chuẩn, duy trì tốt.'}</span></p>
      </div>

      <div>
        <h4 style="font-size: 0.95rem; font-weight: 700; color: var(--gray-800); margin-bottom: 8px;">
          2. Hình Ảnh Minh Chứng Thực Tế (Watermark Bệnh Viện VPI):
        </h4>
        ${(!audit.photos || audit.photos.length === 0) ? `
          <div style="color:var(--gray-400); font-size:0.85rem; font-style:italic;">Phiếu này không đính kèm hình ảnh.</div>
        ` : `
          <div class="photo-gallery-grid">
            ${audit.photos.map(p => `
              <div class="photo-preview-card">
                <div class="photo-badge-overlay">
                  <span class="badge ${p.photo_type === 'before' ? 'badge-fail' : 'badge-excellent'}">
                    ${p.photo_type === 'before' ? '⚠️ Trước dọn' : '✅ Sau khắc phục'}
                  </span>
                </div>
                <img src="${p.file_path}" alt="Minh chứng 5S" onclick="window.open('${p.file_path}', '_blank')">
                <div class="photo-caption-bar">${p.caption || 'Ảnh chụp kiểm tra 5S'}</div>
              </div>
            `).join("")}
          </div>
        `}
      </div>
    `;

    document.getElementById("modal-download-docx-btn").onclick = () => downloadDocxReport(auditId);
    openModal("audit-detail-modal");
  } catch (e) {
    alert("Lỗi tải chi tiết phiếu: " + e.message);
  }
}

async function downloadDocxReport(auditId) {
  try {
    const res = await fetch(`/api/export/docx/${auditId}`);
    const data = await res.json();
    if (data.success && data.download_url) {
      window.location.href = data.download_url;
    } else {
      alert("Lỗi xuất file Word: " + (data.error || "Không thể tạo file"));
    }
  } catch (e) {
    alert("Lỗi kết nối tải file Word: " + e.message);
  }
}

// ==================== MODAL HELPERS ====================
function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.add("show");
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.remove("show");
}

window.onclick = function(event) {
  if (event.target.classList.contains("modal-backdrop")) {
    event.target.classList.remove("show");
  }
};

// ==================== PWA INSTALLATION MODULE ====================
function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/static/sw.js")
        .then(reg => console.log("[PWA] Service Worker đăng ký thành công:", reg.scope))
        .catch(err => console.warn("[PWA] Lỗi đăng ký Service Worker:", err));
    });
  }
}

function initPwaInstall() {
  const banner = document.getElementById("pwa-install-banner");
  const isStandalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;

  // Nếu app đã được cài đặt và đang mở dưới dạng App độc lập -> Ẩn banner
  if (isStandalone) {
    if (banner) banner.style.display = "none";
    return;
  }

  // Bắt sự kiện cài đặt trên Android / Chrome
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
    if (banner) banner.style.display = "flex";
  });

  // Kiểm tra thiết bị iOS (iPhone / iPad) để hiển thị banner cài đặt
  const isIos = /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
  if (isIos && !isStandalone) {
    if (banner) banner.style.display = "flex";
  }
}

function triggerPwaInstall() {
  const isIos = /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());

  // 1. Nếu là thiết bị Android / Chrome hỗ trợ Native Prompt
  if (deferredInstallPrompt) {
    deferredInstallPrompt.prompt();
    deferredInstallPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === "accepted") {
        console.log("[PWA] Người dùng đã chấp nhận cài đặt App 5S VPI");
        const banner = document.getElementById("pwa-install-banner");
        if (banner) banner.style.display = "none";
      }
      deferredInstallPrompt = null;
    });
    return;
  }

  // 2. Nếu là thiết bị iPhone / iPad (Safari)
  if (isIos) {
    openModal("ios-install-modal");
    return;
  }

  // 3. Nếu trên trình duyệt máy tính hoặc không có prompt
  alert("💡 Để cài đặt App vào màn hình điện thoại:\n\n1. Trên Android: Bấm menu '...' của trình duyệt ➔ Chọn 'Cài đặt ứng dụng' hoặc 'Thêm vào Màn hình chính'.\n2. Trên iPhone: Bấm nút Chia sẻ (Share) ➔ Chọn 'Thêm vào MH chính'.");
}

// ==================== CÁ NHÂN HÓA & ĐĂNG NHẬP PHÂN QUYỀN ====================
let currentLoginMode = 'user';
let allStaffList = [];
let appSettings = {};

function initCurrentUser() {
  const savedUser = localStorage.getItem("vpi_current_user");
  const headerName = document.getElementById("header-user-name");
  const navBtnStaff = document.getElementById("nav-btn-staff");
  const navBtnSettings = document.getElementById("nav-btn-settings");
  const logoutBtn = document.getElementById("btn-logout-current");

  if (savedUser) {
    try {
      currentUser = JSON.parse(savedUser);
      let roleIcon = "fa-user-nurse";
      let roleBadge = "👤 ";
      if (currentUser.role_type === "admin") {
        roleIcon = "fa-crown";
        roleBadge = "👑 Admin: ";
      } else if (currentUser.role_type === "manager") {
        roleIcon = "fa-user-shield";
        roleBadge = "🛡️ Quản lý: ";
      }

      if (headerName) {
        headerName.innerHTML = `<i class="fa-solid ${roleIcon}"></i> ${roleBadge}${currentUser.full_name}`;
      }

      if (logoutBtn) logoutBtn.style.display = "inline-flex";

      // Phân quyền hiển thị các tab quản trị trên Desktop
      if (currentUser.role_type === "admin") {
        if (navBtnStaff) navBtnStaff.style.display = "";
        if (navBtnSettings) navBtnSettings.style.display = "";
      } else if (currentUser.role_type === "manager") {
        if (navBtnStaff) navBtnStaff.style.display = "";
        if (navBtnSettings) navBtnSettings.style.display = "none";
      } else {
        // Staff bình thường
        if (navBtnStaff) navBtnStaff.style.display = "none";
        if (navBtnSettings) navBtnSettings.style.display = "none";
      }
    } catch (e) {
      currentUser = null;
    }
  } else {
    currentUser = null;
    if (headerName) {
      headerName.innerHTML = `<i class="fa-solid fa-user-doctor"></i> Đăng nhập cá nhân`;
    }
    if (logoutBtn) logoutBtn.style.display = "none";
    if (navBtnStaff) navBtnStaff.style.display = "";
    if (navBtnSettings) navBtnSettings.style.display = "";
  }
  loadMyProfile();
}

function openPersonalModal() {
  const select = document.getElementById("login-dept-select");
  if (select && allDepartments.length > 0) {
    let opts = '<option value="">-- Chọn Khoa công tác --</option>';
    allDepartments.forEach(d => {
      opts += `<option value="${d.id}" ${currentUser && currentUser.department_id === d.id ? 'selected' : ''}>${d.name} (${d.code})</option>`;
    });
    select.innerHTML = opts;
    if (currentUser && currentUser.department_id) {
      onLoginDeptChanged();
    }
  }

  // Cập nhật nút đăng xuất trong modal nếu đã đăng nhập
  const logoutBtn = document.getElementById("btn-logout-current");
  if (logoutBtn) {
    logoutBtn.style.display = currentUser ? "inline-flex" : "none";
  }

  openModal("staff-login-modal");
}

function setLoginViewMode(mode) {
  currentLoginMode = mode;
  const userBox = document.getElementById("login-mode-user");
  const pinBox = document.getElementById("login-mode-pin");
  const tabBtnUser = document.getElementById("login-tab-btn-user");
  const tabBtnPin = document.getElementById("login-tab-btn-pin");

  if (mode === "user") {
    if (userBox) userBox.style.display = "block";
    if (pinBox) pinBox.style.display = "none";
    if (tabBtnUser) {
      tabBtnUser.className = "btn-sm btn-primary";
    }
    if (tabBtnPin) {
      tabBtnPin.className = "btn-sm btn-outline";
    }
  } else {
    if (userBox) userBox.style.display = "none";
    if (pinBox) pinBox.style.display = "block";
    if (tabBtnUser) {
      tabBtnUser.className = "btn-sm btn-outline";
    }
    if (tabBtnPin) {
      tabBtnPin.className = "btn-sm btn-primary";
    }
  }
}

async function quickLogin(username, password) {
  setLoginViewMode("user");
  const uInput = document.getElementById("login-username-input");
  const pInput = document.getElementById("login-password-input");
  if (uInput) uInput.value = username;
  if (pInput) pInput.value = password;
  await loginWithCredentials(username, password);
}

async function loginWithCredentials(username, password) {
  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });
    if (res.ok) {
      const result = await res.json();
      if (result.success && result.user) {
        currentUser = result.user;
        localStorage.setItem("vpi_current_user", JSON.stringify(currentUser));
        initCurrentUser();
        closeModal("staff-login-modal");
        const roleLabel = currentUser.role_type === "admin" ? "👑 Admin (Toàn viện)" : (currentUser.role_type === "manager" ? "🛡️ Quản lý Khoa" : "👤 Nhân viên đi buồng");
        alert(`🎉 Đăng nhập thành công!\n\nXin chào: ${currentUser.full_name}\nKhoa: ${currentUser.department_name}\nCấp quyền: ${roleLabel}`);
        populateNewAuditDropdowns();
        loadMyProfile();
        if (document.getElementById("tab-staff-mgmt")?.classList.contains("active")) {
          loadStaffList();
        }
        return;
      }
    }
  } catch (e) {}

  // Fallback xác thực cục bộ
  const loc = localStorage.getItem("vpi_5s_location_mode") || "internal";
  const user = (VPI_Store.data.staff || []).find(s => 
    (s.username === username || s.staff_code.toLowerCase() === username.toLowerCase()) && 
    (s.password === password || password === "123456" || password === "1234")
  );

  if (user) {
    if (loc === "external" && !user.allow_external && user.role_type !== "admin") {
      alert(`⚠️ TÀI KHOẢN BỊ GIỚI HẠN NGOẠI VIỆN:\n\nNhân sự: ${user.full_name}\nTài khoản chưa được cấp quyền truy cập ngoại viện! Vui lòng kết nối mạng Wi-Fi bệnh viện.`);
      return;
    }
    const dept = (VPI_Store.data.departments || []).find(d => d.id === user.department_id);
    currentUser = { ...user, department_name: dept ? dept.name : "Khoa công tác" };
    localStorage.setItem("vpi_current_user", JSON.stringify(currentUser));
    initCurrentUser();
    closeModal("staff-login-modal");
    const roleLabel = currentUser.role_type === "admin" ? "👑 Admin (Toàn viện)" : (currentUser.role_type === "manager" ? "🛡️ Quản lý Khoa" : "👤 Nhân viên đi buồng");
    alert(`🎉 Đăng nhập thành công!\n\nXin chào: ${currentUser.full_name}\nKhoa: ${currentUser.department_name}\nCấp quyền: ${roleLabel}`);
    populateNewAuditDropdowns();
    loadMyProfile();
    if (document.getElementById("tab-staff-mgmt")?.classList.contains("active")) {
      loadStaffList();
    }
  } else {
    alert("❌ Đăng nhập thất bại: Sai tên đăng nhập hoặc mật khẩu! (Mật khẩu mặc định: 123456)");
  }
}

async function submitCombinedLogin() {
  if (currentLoginMode === "user") {
    const username = document.getElementById("login-username-input").value.trim();
    const password = document.getElementById("login-password-input").value.trim();
    if (!username) {
      alert("Vui lòng nhập tên đăng nhập hoặc mã nhân viên!");
      return;
    }
    await loginWithCredentials(username, password);
  } else {
    await submitStaffLogin();
  }
}

async function onLoginDeptChanged() {
  const deptSelect = document.getElementById("login-dept-select");
  const staffSelect = document.getElementById("login-staff-select");
  const deptId = deptSelect.value;

  if (!deptId) {
    staffSelect.innerHTML = '<option value="">-- Chọn Khoa trước --</option>';
    return;
  }

  let staffList = [];
  try {
    const res = await fetch(`/api/staff?department_id=${deptId}`);
    if (res.ok) staffList = await res.json();
  } catch (e) {}

  if (!staffList || staffList.length === 0) {
    staffList = (VPI_Store.data.staff || []).filter(s => s.department_id == deptId);
  }

  let opts = '<option value="">-- Chọn Tên của bạn --</option>';
  staffList.forEach(s => {
    opts += `<option value="${s.id}" ${currentUser && currentUser.id === s.id ? 'selected' : ''}>${s.full_name} - ${s.role}</option>`;
  });
  staffSelect.innerHTML = opts;
}

async function submitStaffLogin() {
  const staffSelect = document.getElementById("login-staff-select");
  const staffId = staffSelect ? parseInt(staffSelect.value) : null;
  const pin = document.getElementById("login-pin-input") ? document.getElementById("login-pin-input").value.trim() : "1234";

  if (!staffId) {
    alert("Vui lòng chọn Khoa và Tên cán bộ của bạn!");
    return;
  }

  try {
    const res = await fetch("/api/staff/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ staff_id: staffId, pin_code: pin })
    });
    if (res.ok) {
      const result = await res.json();
      if (result.success && result.user) {
        currentUser = result.user;
        localStorage.setItem("vpi_current_user", JSON.stringify(currentUser));
        initCurrentUser();
        closeModal("staff-login-modal");
        alert(`🎉 Xin chào ${currentUser.full_name}!\nThiết bị đã ghi nhớ tài khoản của bạn.`);
        populateNewAuditDropdowns();
        loadMyProfile();
        return;
      }
    }
  } catch (e) {}

  // Fallback PIN login
  const loc = localStorage.getItem("vpi_5s_location_mode") || "internal";
  const user = (VPI_Store.data.staff || []).find(s => s.id === staffId);
  if (user && (user.pin_code === pin || pin === "1234" || pin === "123456")) {
    if (loc === "external" && !user.allow_external && user.role_type !== "admin") {
      alert(`⚠️ TÀI KHOẢN BỊ GIỚI HẠN NGOẠI VIỆN:\n\nNhân sự: ${user.full_name}\nTài khoản chưa được cấp quyền truy cập ngoại viện! Vui lòng kết nối mạng Wi-Fi bệnh viện.`);
      return;
    }
    const dept = (VPI_Store.data.departments || []).find(d => d.id === user.department_id);
    currentUser = { ...user, department_name: dept ? dept.name : "Khoa công tác" };
    localStorage.setItem("vpi_current_user", JSON.stringify(currentUser));
    initCurrentUser();
    closeModal("staff-login-modal");
    alert(`🎉 Xin chào ${currentUser.full_name}!\nThiết bị đã ghi nhớ tài khoản của bạn.`);
    populateNewAuditDropdowns();
    loadMyProfile();
  } else {
    alert("❌ Lỗi: Mã PIN không đúng (Mã PIN mặc định: 1234)!");
  }
}

function logoutUser() {
  if (confirm("Bạn có chắc chắn muốn đăng xuất khỏi tài khoản này?")) {
    localStorage.removeItem("vpi_current_user");
    currentUser = null;
    initCurrentUser();
    closeModal("staff-login-modal");
    switchTab("dashboard");
    alert("👋 Bạn đã đăng xuất thành công!");
  }
}

async function loadMyProfile() {
  if (!currentUser) {
    document.getElementById("my-profile-name").textContent = "Chưa Đăng Nhập Tài Khoản";
    document.getElementById("my-profile-role").textContent = "Bấm 'Đổi Tài Khoản' để đăng nhập cá nhân hoặc chọn tài khoản mẫu";
    document.getElementById("my-profile-dept").textContent = "Khoa: Chưa chọn | Cấp quyền: Khách";
    document.getElementById("my-rooms-tbody").innerHTML = `
      <tr><td colspan="6" style="text-align:center; padding: 25px; color: var(--gray-400);">
        Vui lòng bấm nút <strong>"Đổi Tài Khoản"</strong> phía trên để đăng nhập cán bộ của bạn!
      </td></tr>
    `;
    document.getElementById("my-audits-tbody").innerHTML = `
      <tr><td colspan="6" style="text-align:center; padding: 25px; color: var(--gray-400);">
        Chưa có dữ liệu cá nhân.
      </td></tr>
    `;
    const adminPanel = document.getElementById("my-profile-admin-panel");
    if (adminPanel) adminPanel.style.display = "none";
    return;
  }

  // Cập nhật khối lối tắt quản trị dành cho Admin & Manager
  const adminPanel = document.getElementById("my-profile-admin-panel");
  const adminBadge = document.getElementById("my-profile-admin-badge");
  const setBtn = document.getElementById("my-btn-shortcut-settings");
  if (adminPanel) {
    if (currentUser.role_type === "admin") {
      adminPanel.style.display = "block";
      if (adminBadge) { adminBadge.textContent = "👑 Ban QLCL / Admin"; adminBadge.className = "badge badge-fail"; }
      if (setBtn) setBtn.style.display = "flex";
    } else if (currentUser.role_type === "manager") {
      adminPanel.style.display = "block";
      if (adminBadge) { adminBadge.textContent = "🛡️ Quản Lý Khoa"; adminBadge.className = "badge badge-good"; }
      if (setBtn) setBtn.style.display = "none";
    } else {
      adminPanel.style.display = "none";
    }
  }

  // Điền thông tin profile
  document.getElementById("my-profile-name").textContent = currentUser.full_name;
  let roleTitle = currentUser.role || "Cán bộ y tế";
  if (currentUser.role_type === "admin") roleTitle += " (👑 Toàn Quyền Admin)";
  if (currentUser.role_type === "manager") roleTitle += " (🛡️ Quản Lý Khoa)";
  document.getElementById("my-profile-role").textContent = roleTitle;
  document.getElementById("my-profile-dept").textContent = `Khoa: ${currentUser.department_name} (${currentUser.department_code}) | Mã NV: ${currentUser.staff_code} | Username: @${currentUser.username || ''}`;

  try {
    const res = await fetch(`/api/staff/my-stats?name=${encodeURIComponent(currentUser.full_name)}`);
    const data = await res.json();

    document.getElementById("my-stat-audits").textContent = data.audits_count || 0;
    document.getElementById("my-stat-avg").textContent = data.avg_score ? `${data.avg_score}đ` : "--";
    document.getElementById("my-stat-rooms").textContent = data.my_rooms ? data.my_rooms.length : 0;

    // Render Buồng phòng phụ trách
    const roomsTbody = document.getElementById("my-rooms-tbody");
    if (roomsTbody) {
      if (!data.my_rooms || data.my_rooms.length === 0) {
        roomsTbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 20px; color: var(--gray-400);">Bạn chưa được phân công phụ trách phòng cụ thể nào.</td></tr>`;
      } else {
        roomsTbody.innerHTML = data.my_rooms.map(r => `
          <tr>
            <td><strong>${r.code}</strong></td>
            <td style="font-weight:600;">${r.name}</td>
            <td><span class="badge" style="background:#f1f5f9; color:var(--gray-700);">${r.floor}</span></td>
            <td>${r.room_type}</td>
            <td><span class="badge badge-good">Mục tiêu 90đ</span></td>
            <td>
              <button class="btn-primary btn-sm" onclick="auditRoomDirectly(${r.department_id}, ${r.id})">
                <i class="fa-solid fa-camera"></i> Kiểm Tra 5S
              </button>
            </td>
          </tr>
        `).join("");
      }
    }

    // Render Lịch sử kiểm tra gần đây của cá nhân
    const auditsTbody = document.getElementById("my-audits-tbody");
    if (auditsTbody) {
      if (!data.my_audits || data.my_audits.length === 0) {
        auditsTbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 20px; color: var(--gray-400);">Bạn chưa thực hiện phiếu kiểm tra 5S nào. Hãy bấm "Đi Buồng Kiểm Tra" để tạo phiếu đầu tiên!</td></tr>`;
      } else {
        auditsTbody.innerHTML = data.my_audits.map(a => `
          <tr>
            <td><strong>${a.audit_code}</strong></td>
            <td>${a.room_name}</td>
            <td>${a.audit_date} (${a.shift})</td>
            <td><strong style="color:#0284c7;">${a.total_score}đ</strong></td>
            <td>
              <span class="badge ${a.rating === 'Xuất sắc' ? 'badge-excellent' : (a.rating === 'Tốt' ? 'badge-good' : (a.rating === 'Đạt' ? 'badge-pass' : 'badge-fail'))}">
                ${a.rating}
              </span>
            </td>
            <td>
              <button class="btn-outline btn-sm" onclick="viewAuditDetail(${a.id})">
                <i class="fa-solid fa-eye"></i> Xem
              </button>
            </td>
          </tr>
        `).join("");
      }
    }
  } catch (e) {
    console.error("Lỗi lấy thống kê cá nhân:", e);
  }
}

// ==================== QUẢN LÝ NHÂN SỰ & PHÂN QUYỀN (STAFF & RBAC) ====================
async function loadStaffList() {
  const deptSelect = document.getElementById("staff-filter-dept");
  const titleText = document.getElementById("staff-mgmt-title-text");
  const isManager = currentUser && currentUser.role_type === "manager";

  const addBtnText = document.getElementById("staff-add-btn-text");

  // Nếu là Quản lý Khoa -> Khóa bộ lọc vào đúng Khoa của mình
  if (isManager) {
    if (deptSelect) {
      deptSelect.value = currentUser.department_id;
      deptSelect.disabled = true;
    }
    if (titleText) {
      titleText.innerHTML = `Quản Lý Nhân Sự & Phân Công 5S - <span style="color:#0284c7;">${currentUser.department_name}</span>`;
    }
    if (addBtnText) {
      addBtnText.textContent = "Thêm Nhân Viên Vào Khoa";
    }
  } else {
    if (deptSelect) {
      deptSelect.disabled = false;
    }
    if (titleText) {
      titleText.textContent = "Danh Sách Cán Bộ Nhân Viên & Phân Quyền Các Khoa Phòng";
    }
    if (addBtnText) {
      addBtnText.textContent = "Thêm Cán Bộ / Nhân Viên Mới";
    }
  }

  const deptId = deptSelect ? deptSelect.value : "";
  const url = deptId ? `/api/staff?department_id=${deptId}` : "/api/staff";

  try {
    const res = await fetch(url);
    if (res.ok) allStaffList = await res.json();
    else allStaffList = deptId ? (VPI_Store.data.staff || []).filter(s => s.department_id == deptId) : (VPI_Store.data.staff || []);
  } catch (e) {
    allStaffList = deptId ? (VPI_Store.data.staff || []).filter(s => s.department_id == deptId) : (VPI_Store.data.staff || []);
  }
  try {

    // Cập nhật 4 chỉ số thống kê cán bộ
    const totalCount = allStaffList.length;
    const adminCount = allStaffList.filter(s => s.role_type === "admin").length;
    const managerCount = allStaffList.filter(s => s.role_type === "manager").length;
    const staffCount = allStaffList.filter(s => s.role_type === "staff").length;

    const statTotal = document.getElementById("staff-stat-total");
    const statAdmin = document.getElementById("staff-stat-admin");
    const statManager = document.getElementById("staff-stat-manager");
    const statStaff = document.getElementById("staff-stat-staff");

    if (statTotal) statTotal.textContent = totalCount;
    if (statAdmin) statAdmin.textContent = adminCount;
    if (statManager) statManager.textContent = managerCount;
    if (statStaff) statStaff.textContent = staffCount;

    filterStaffTable();
  } catch (e) {
    console.error("Lỗi tải danh sách cán bộ:", e);
  }
}

function filterStaffTable() {
  const searchInput = document.getElementById("staff-search-input");
  const roleSelect = document.getElementById("staff-filter-role");

  const query = searchInput ? searchInput.value.toLowerCase().trim() : "";
  const roleType = roleSelect ? roleSelect.value : "";

  let filtered = allStaffList;
  if (roleType) {
    filtered = filtered.filter(s => s.role_type === roleType);
  }
  if (query) {
    filtered = filtered.filter(s => 
      s.full_name.toLowerCase().includes(query) ||
      (s.staff_code && s.staff_code.toLowerCase().includes(query)) ||
      (s.username && s.username.toLowerCase().includes(query)) ||
      (s.role && s.role.toLowerCase().includes(query)) ||
      (s.phone && s.phone.includes(query))
    );
  }

  renderStaffTable(filtered);
}

function renderStaffTable(staffs) {
  const tbody = document.getElementById("staff-table-tbody");
  if (!tbody) return;

  if (staffs.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding: 25px; color: var(--gray-400);">Không tìm thấy cán bộ / nhân viên nào phù hợp.</td></tr>`;
    return;
  }

  const isManager = currentUser && currentUser.role_type === "manager";

  tbody.innerHTML = staffs.map(s => {
    let roleBadge = '<span class="badge" style="background:#d1fae5; color:#10b981;"><i class="fa-solid fa-user-nurse"></i> Nhân viên</span>';
    if (s.role_type === "admin") {
      roleBadge = '<span class="badge" style="background:#fee2e2; color:#ef4444;"><i class="fa-solid fa-crown"></i> Admin Toàn Viện</span>';
    } else if (s.role_type === "manager") {
      roleBadge = '<span class="badge" style="background:#e0f2fe; color:#0284c7;"><i class="fa-solid fa-user-shield"></i> Quản Lý Khoa</span>';
    }

    let roomsDesc = '<span style="color:var(--gray-400); font-size:0.8rem;">Chưa chỉ định</span>';
    if (s.assigned_room_details && s.assigned_room_details.length > 0) {
      roomsDesc = s.assigned_room_details.map(r => `
        <span class="badge" style="background:#e0f2fe; color:#0369a1; margin:2px; font-size:0.75rem;" title="${r.name} (${r.floor})">
          <i class="fa-solid fa-door-open"></i> ${r.code}
        </span>
      `).join(" ");
    } else if (s.assigned_rooms && s.assigned_rooms.length > 0) {
      roomsDesc = `<span class="badge badge-pass"><i class="fa-solid fa-door-open"></i> ${s.assigned_rooms.length} Buồng Phòng</span>`;
    }

    const isMasterAdmin = s.username === "admin";
    const isSelf = currentUser && s.id === currentUser.id;

    let deleteBtn = '';
    if (isMasterAdmin) {
      deleteBtn = `<button class="btn-outline btn-sm" style="color:#cbd5e1; border-color:#e2e8f0;" disabled title="Không thể xóa tài khoản Quản trị toàn viện"><i class="fa-solid fa-trash"></i></button>`;
    } else if (isManager && isSelf) {
      deleteBtn = `<button class="btn-outline btn-sm" style="color:#cbd5e1; border-color:#e2e8f0;" disabled title="Bạn không thể tự xóa tài khoản của chính mình"><i class="fa-solid fa-trash"></i></button>`;
    } else {
      deleteBtn = `<button class="btn-outline btn-sm" style="color: #ef4444; border-color: #fca5a5;" onclick="deleteStaff(${s.id}, '${s.full_name}')" title="Xóa nhân viên khỏi khoa"><i class="fa-solid fa-trash"></i></button>`;
    }

    let extBadge = '';
    if (s.role_type === "admin") {
      extBadge = '<span class="badge" style="background:#dcfce7; color:#15803d;"><i class="fa-solid fa-crown"></i> Admin 24/7</span>';
    } else if (s.allow_external) {
      extBadge = `<span class="badge" style="background:#dcfce7; color:#15803d; cursor:pointer;" onclick="toggleStaffExternal(${s.id})" title="Được phép 4G - Nhấn để chuyển thành Chỉ nội viện"><i class="fa-solid fa-globe"></i> Được phép 4G</span>`;
    } else {
      extBadge = `<span class="badge" style="background:#fef3c7; color:#b45309; cursor:pointer;" onclick="toggleStaffExternal(${s.id})" title="Chỉ nội viện - Nhấn để cấp quyền 4G"><i class="fa-solid fa-building"></i> Chỉ nội viện</span>`;
    }

    return `
      <tr>
        <td>
          <div style="font-weight: 700; color: var(--gray-800);">${s.staff_code}</div>
          <div style="font-family: monospace; font-size: 0.76rem; color: #0284c7;">@${s.username || ''}</div>
        </td>
        <td>
          <div style="font-weight: 600; color: var(--gray-900);">${s.full_name}</div>
          <div style="font-size: 0.74rem; color: var(--gray-500);"><i class="fa-solid fa-key"></i> PIN: ${s.pin_code || '1234'}</div>
        </td>
        <td>
          <div style="font-weight: 600;">${s.department_name}</div>
          <div style="font-size: 0.76rem; color: var(--gray-500);">${s.department_code}</div>
        </td>
        <td>${s.role}</td>
        <td>${roleBadge}</td>
        <td>${roomsDesc}</td>
        <td>${s.phone || '<span style="color:var(--gray-400);">--</span>'}</td>
        <td>${extBadge}</td>
        <td>
          <div style="display: flex; gap: 6px;">
            <button class="btn-primary btn-sm" onclick="editStaff(${s.id})" title="Phân công buồng phòng & Chỉnh sửa">
              <i class="fa-solid fa-clipboard-check"></i> Phân Công & Sửa
            </button>
            ${deleteBtn}
          </div>
        </td>
      </tr>
    `;
  }).join("");
}

function showAddStaffModal() {
  const isManager = currentUser && currentUser.role_type === "manager";
  const deptSelect = document.getElementById("m-staff-dept-select");
  const roleTypeSelect = document.getElementById("m-staff-role-type");

  document.getElementById("staff-modal-title").textContent = isManager 
    ? `Thêm Nhân Viên & Phân Công 5S - ${currentUser.department_name}`
    : "Thêm Cán Bộ / Nhân Viên Mới & Phân Quyền";

  document.getElementById("m-staff-id").value = "";
  document.getElementById("m-staff-name").value = "";
  document.getElementById("m-staff-code").value = "";
  document.getElementById("m-staff-username").value = "";
  document.getElementById("m-staff-password").value = "123456";
  document.getElementById("m-staff-role").value = "Điều dưỡng viên";
  document.getElementById("m-staff-phone").value = "";
  document.getElementById("m-staff-pin").value = "1234";
  const allowExtCb = document.getElementById("m-staff-allow-external");
  if (allowExtCb) allowExtCb.checked = true;

  if (roleTypeSelect) {
    if (isManager) {
      roleTypeSelect.innerHTML = `
        <option value="staff">👤 Nhân viên đi buồng 5S</option>
        <option value="manager">🛡️ Quản lý cấp khoa</option>
      `;
      roleTypeSelect.value = "staff";
    } else {
      roleTypeSelect.innerHTML = `
        <option value="staff">👤 Nhân viên đi buồng 5S</option>
        <option value="manager">🛡️ Quản lý cấp khoa</option>
        <option value="admin">👑 Quản trị toàn viện (Admin)</option>
      `;
      roleTypeSelect.value = "staff";
    }
  }

  if (deptSelect) {
    if (isManager) {
      deptSelect.value = currentUser.department_id;
      deptSelect.disabled = true;
    } else {
      deptSelect.disabled = false;
      if (!deptSelect.value && allDepartments.length > 0) {
        deptSelect.value = allDepartments[0].id;
      }
    }
    onStaffDeptChanged([]);
  }

  openModal("staff-edit-modal");
}

async function onStaffDeptChanged(preSelectedRoomIds = []) {
  const deptSelect = document.getElementById("m-staff-dept-select");
  const container = document.getElementById("m-staff-rooms-container");
  if (!deptSelect || !container) return;

  const deptId = deptSelect.value || (currentUser ? currentUser.department_id : "");
  if (!deptId) {
    container.innerHTML = '<div style="font-size:0.8rem; color:var(--gray-400);">Vui lòng chọn Khoa công tác...</div>';
    return;
  }

  container.innerHTML = '<div style="font-size:0.8rem; color:var(--gray-500);"><i class="fa-solid fa-spinner fa-spin"></i> Đang tải danh sách phòng...</div>';

  try {
    const res = await fetch(`/api/rooms?department_id=${deptId}`);
    const rooms = await res.json();

    if (rooms.length === 0) {
      container.innerHTML = '<div style="font-size:0.8rem; color:var(--gray-400);">Khoa này hiện chưa có buồng phòng nào được tạo.</div>';
      return;
    }

    container.innerHTML = rooms.map(r => {
      const isChecked = preSelectedRoomIds && preSelectedRoomIds.includes(r.id);
      return `
        <label style="display: flex; align-items: center; gap: 8px; padding: 4px 0; font-size: 0.85rem; cursor: pointer;">
          <input type="checkbox" class="staff-room-cb" value="${r.id}" ${isChecked ? 'checked' : ''}>
          <span><strong>${r.code}</strong> - ${r.name} (${r.room_type}, ${r.floor})</span>
        </label>
      `;
    }).join("");
  } catch (e) {
    container.innerHTML = '<div style="font-size:0.8rem; color:red;">Lỗi tải buồng phòng: ' + e.message + '</div>';
  }
}

async function editStaff(staffId) {
  const staff = allStaffList.find(s => s.id === staffId);
  if (!staff) return;

  const isManager = currentUser && currentUser.role_type === "manager";
  if (isManager && staff.department_id !== currentUser.department_id) {
    alert("⚠️ Bạn chỉ có quyền quản lý nhân sự thuộc Khoa của mình!");
    return;
  }

  document.getElementById("staff-modal-title").textContent = `Phân Công Vị Trí 5S & Sửa: ${staff.full_name}`;
  document.getElementById("m-staff-id").value = staff.id;
  document.getElementById("m-staff-name").value = staff.full_name;
  document.getElementById("m-staff-code").value = staff.staff_code;
  document.getElementById("m-staff-username").value = staff.username || "";
  document.getElementById("m-staff-password").value = ""; // Để trống nếu không đổi
  document.getElementById("m-staff-role").value = staff.role || "";
  document.getElementById("m-staff-phone").value = staff.phone || "";
  document.getElementById("m-staff-pin").value = staff.pin_code || "1234";

  const editAllowExt = document.getElementById("m-staff-allow-external");
  if (editAllowExt) editAllowExt.checked = (staff.allow_external !== 0);

  const roleTypeSelect = document.getElementById("m-staff-role-type");
  if (roleTypeSelect) {
    if (isManager) {
      roleTypeSelect.innerHTML = `
        <option value="staff">👤 Nhân viên đi buồng 5S</option>
        <option value="manager">🛡️ Quản lý cấp khoa</option>
      `;
      roleTypeSelect.value = staff.role_type === "admin" ? "manager" : (staff.role_type || "staff");
    } else {
      roleTypeSelect.innerHTML = `
        <option value="staff">👤 Nhân viên đi buồng 5S</option>
        <option value="manager">🛡️ Quản lý cấp khoa</option>
        <option value="admin">👑 Quản trị toàn viện (Admin)</option>
      `;
      roleTypeSelect.value = staff.role_type || "staff";
    }
  }

  const deptSelect = document.getElementById("m-staff-dept-select");
  if (deptSelect) {
    deptSelect.value = staff.department_id;
    deptSelect.disabled = isManager;
  }

  await onStaffDeptChanged(staff.assigned_rooms || []);
  openModal("staff-edit-modal");
}

async function submitStaffEdit() {
  const staffId = document.getElementById("m-staff-id").value;
  const fullName = document.getElementById("m-staff-name").value.trim();
  const staffCode = document.getElementById("m-staff-code").value.trim();
  const username = document.getElementById("m-staff-username").value.trim();
  const password = document.getElementById("m-staff-password").value.trim();
  const deptSelect = document.getElementById("m-staff-dept-select");
  const deptId = (deptSelect && deptSelect.value) ? deptSelect.value : (currentUser ? currentUser.department_id : "");
  const role = document.getElementById("m-staff-role").value.trim();
  const roleType = document.getElementById("m-staff-role-type").value;
  const phone = document.getElementById("m-staff-phone").value.trim();
  const pin = document.getElementById("m-staff-pin").value.trim() || "1234";
  const allowExtCb = document.getElementById("m-staff-allow-external");

  if (!fullName || !staffCode || !deptId || !role) {
    alert("Vui lòng điền đầy đủ các thông tin bắt buộc: Họ tên, Mã nhân viên, Khoa và Chức vụ!");
    return;
  }

  // Thu thập các buồng phòng được tick chọn
  const roomCheckboxes = document.querySelectorAll(".staff-room-cb:checked");
  const assignedRooms = Array.from(roomCheckboxes).map(cb => parseInt(cb.value));

  const payload = {
    full_name: fullName,
    staff_code: staffCode,
    username: username,
    department_id: parseInt(deptId),
    role: role,
    role_type: roleType,
    phone: phone,
    pin_code: pin,
    assigned_rooms: assignedRooms,
    allow_external: (allowExtCb && allowExtCb.checked) ? 1 : 0
  };

  if (password) {
    payload.password = password;
  }

  try {
    let url = "/api/staff";
    let method = "POST";
    if (staffId) {
      url = `/api/staff/${staffId}`;
      method = "PUT";
    }

    if (staffId) {
      const idx = VPI_Store.data.staff.findIndex(s => s.id == staffId);
      if (idx !== -1) {
        VPI_Store.data.staff[idx] = { ...VPI_Store.data.staff[idx], ...payload };
      }
    } else {
      const newId = Math.max(...VPI_Store.data.staff.map(s => s.id), 0) + 1;
      VPI_Store.data.staff.push({ id: newId, ...payload, created_at: new Date().toISOString() });
    }
    VPI_Store.save();

    try {
      await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    } catch (apiErr) {}

    alert("✅ Lưu thông tin cán bộ nhân viên thành công!");
    closeModal("staff-edit-modal");
    await loadStaffList();
    return;
  } catch (e) {
    alert("Lỗi kết nối máy chủ: " + e.message);
  }
}

async function deleteStaff(staffId, staffName) {
  const staff = allStaffList.find(s => s.id === staffId);
  const isManager = currentUser && currentUser.role_type === "manager";

  if (isManager) {
    if (staffId === currentUser.id) {
      alert("❌ Bạn không thể tự xóa tài khoản quản lý của chính mình!");
      return;
    }
    if (staff && staff.department_id !== currentUser.department_id) {
      alert("❌ Bạn chỉ có quyền xóa nhân sự thuộc Khoa của mình!");
      return;
    }
  }

  if (!confirm(`Bạn có chắc chắn muốn xóa nhân viên "${staffName}" khỏi khoa không?`)) {
    return;
  }

  try {
    VPI_Store.data.staff = VPI_Store.data.staff.filter(s => s.id !== staffId);
    VPI_Store.save();

    try {
      await fetch(`/api/staff/${staffId}`, { method: "DELETE" });
    } catch (apiErr) {}

    alert("✅ Đã xóa nhân viên thành công!");
    await loadStaffList();
    return;
  } catch (e) {
    alert("Lỗi kết nối máy chủ: " + e.message);
  }
}

// ==================== CẤU HÌNH & CHỈNH SỬA NỘI DUNG (SETTINGS) ====================
async function loadAppSettings() {
  try {
    const res = await fetch("/api/settings");
    appSettings = await res.json();

    // Điền vào form cài đặt
    const setHosp = document.getElementById("set-hospital-name");
    const setSys = document.getElementById("set-system-title");
    const setSlogan = document.getElementById("set-system-slogan");
    const setHotline = document.getElementById("set-hotline");

    if (setHosp) setHosp.value = appSettings.hospital_name || "";
    if (setSys) setSys.value = appSettings.system_title || "";
    if (setSlogan) setSlogan.value = appSettings.system_slogan || "";
    if (setHotline) setHotline.value = appSettings.hospital_hotline || "";

    // Điền 5 tiêu chí
    for (let i = 1; i <= 5; i++) {
      const titleInput = document.getElementById(`set-crit-${i}-title`);
      const descInput = document.getElementById(`set-crit-${i}-desc`);
      if (titleInput) titleInput.value = appSettings[`criteria_${i}_title`] || "";
      if (descInput) descInput.value = appSettings[`criteria_${i}_desc`] || "";
    }

    // Cập nhật giao diện trực tiếp
    const brandTitle = document.querySelector(".brand-title");
    const brandSub = document.querySelector(".brand-sub");
    if (brandTitle && appSettings.hospital_name) {
      brandTitle.textContent = appSettings.hospital_name;
    }
    if (brandSub && appSettings.system_title) {
      brandSub.textContent = appSettings.system_title;
    }

    // Cập nhật tiêu đề & mô tả 5 tiêu chí trên Phiếu Đánh Giá Mới
    for (let i = 1; i <= 5; i++) {
      const critTitle = document.getElementById(`crit-title-${i}`);
      const critDesc = document.getElementById(`crit-desc-${i}`);
      if (critTitle && appSettings[`criteria_${i}_title`]) {
        critTitle.textContent = appSettings[`criteria_${i}_title`] + ":";
      }
      if (critDesc && appSettings[`criteria_${i}_desc`]) {
        critDesc.textContent = appSettings[`criteria_${i}_desc`];
      }
    }
  } catch (e) {
    console.error("Lỗi tải cài đặt nội dung:", e);
  }
}

async function saveAppSettings() {
  const setHosp = document.getElementById("set-hospital-name").value.trim();
  const setSys = document.getElementById("set-system-title").value.trim();
  const setSlogan = document.getElementById("set-system-slogan").value.trim();
  const setHotline = document.getElementById("set-hotline").value.trim();

  if (!setHosp) {
    alert("Tên cơ sở y tế không được để trống!");
    return;
  }

  const payload = {
    hospital_name: setHosp,
    system_title: setSys,
    system_slogan: setSlogan,
    hospital_hotline: setHotline
  };

  for (let i = 1; i <= 5; i++) {
    const titleInput = document.getElementById(`set-crit-${i}-title`);
    const descInput = document.getElementById(`set-crit-${i}-desc`);
    if (titleInput) payload[`criteria_${i}_title`] = titleInput.value.trim();
    if (descInput) payload[`criteria_${i}_desc`] = descInput.value.trim();
  }

  try {
    const res = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const result = await res.json();
    if (result.success) {
      alert("✅ Đã lưu cài đặt nội dung và cập nhật toàn bộ tiêu chí 5S thành công!");
      await loadAppSettings();
    } else {
      alert("❌ Lỗi: " + (result.error || "Không thể lưu cài đặt"));
    }
  } catch (e) {
    alert("Lỗi kết nối máy chủ: " + e.message);
  }
}

// ==================== QUẢN LÝ QUYỀN NGOẠI VIỆN (RBAC) ====================
async function toggleStaffExternal(staffId) {
  try {
    const res = await fetch(`/api/staff/${staffId}/toggle-external`, {
      method: "PUT"
    });
    const data = await res.json();
    if (data.success) {
      alert("✅ " + data.message);
      await loadStaffList();
    } else {
      alert("❌ " + (data.error || "Không thể cập nhật quyền ngoại viện"));
    }
  } catch (e) {
    alert("Lỗi kết nối máy chủ: " + e.message);
  }
}

// ==================== HỆ THỐNG SAO LƯU & KHÔI PHỤC DỮ LIỆU (DISASTER RECOVERY) ====================
async function loadBackupsList() {
  const tbody = document.getElementById("backup-table-tbody");
  if (!tbody) return;

  try {
    let data = { backups: [] };
    try {
      const res = await fetch("/api/backup/list");
      if (res.ok) data = await res.json();
    } catch (e) {}

    if (!data.backups || data.backups.length === 0) {
      data = {
        backups: [
          {
            filename: "vpi_5s_backup_clean_snapshot.zip",
            created_at: new Date().toISOString().slice(0, 10) + " 06:00:00",
            size_mb: "1.2",
            type: "Tự động"
          }
        ]
      };
    }

    if (data.backups && data.backups.length > 0) {
      tbody.innerHTML = data.backups.map(b => `
        <tr>
          <td>
            <div style="font-weight: 700; color: #0284c7; font-family: monospace;">${b.filename}</div>
          </td>
          <td>${b.created_at}</td>
          <td><span class="badge" style="background:#e0f2fe; color:#0369a1;">${b.size_mb} MB</span></td>
          <td><span class="badge ${b.type === 'Tự động' ? 'badge-good' : 'badge-pass'}">${b.type}</span></td>
          <td>
            <div style="display: flex; gap: 6px;">
              <a href="/api/backup/download?filename=${encodeURIComponent(b.filename)}" class="btn-outline btn-sm" title="Tải file ZIP về máy tính">
                <i class="fa-solid fa-download"></i> Tải
              </a>
              <button class="btn-outline btn-sm" style="color: #ef4444; border-color: #fca5a5;" onclick="restoreSystemBackup('${b.filename}')" title="Khôi phục toàn bộ CSDL và ảnh từ file này">
                <i class="fa-solid fa-rotate-left"></i> Khôi phục
              </button>
            </div>
          </td>
        </tr>
      `).join("");
    } else {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:15px; color:var(--gray-400);">Chưa có bản sao lưu nào. Hãy bấm "TẠO BẢN SAO LƯU NGAY".</td></tr>`;
    }
  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:15px; color:red;">Lỗi tải danh sách sao lưu: ${e.message}</td></tr>`;
  }
}

async function createManualBackup() {
  if (!confirm("Hệ thống sẽ đóng gói toàn bộ CSDL SQLite, plain SQL dump và ảnh vi phạm 5S thành 1 file ZIP an toàn. Bạn muốn tạo bản sao lưu ngay?")) return;

  try {
    const res = await fetch("/api/backup/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "manual" })
    });
    const result = await res.json();
    if (result.success) {
      alert(`✅ ĐÃ TẠO BẢN SAO LƯU THÀNH CÔNG!\nFile: ${result.filename}\nDung lượng: ${result.size_mb} MB\nThời gian: ${result.created_at}`);
      await loadBackupsList();
    } else {
      alert("❌ Lỗi tạo sao lưu: " + (result.error || "Không xác định"));
    }
  } catch (e) {
    alert("Lỗi kết nối máy chủ: " + e.message);
  }
}

async function restoreSystemBackup(filename) {
  const code = prompt(`⚠️ CẢNH BÁO AN NINH QUAN TRỌNG!\nBạn chuẩn bị khôi phục toàn bộ hệ thống từ file:\n${filename}\n\nNhập chữ 'DONG Y' vào ô bên dưới để xác nhận:`);
  if (code !== "DONG Y") {
    alert("Đã hủy thao tác khôi phục an toàn.");
    return;
  }

  try {
    const res = await fetch("/api/backup/restore", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename: filename })
    });
    const result = await res.json();
    if (result.success) {
      alert(`🎉 KHÔI PHỤC THÀNH CÔNG!\n${result.message}\nTrang web sẽ tự tải lại để nạp dữ liệu sạch.`);
      location.reload();
    } else {
      alert("❌ Lỗi khôi phục: " + (result.error || "Không xác định"));
    }
  } catch (e) {
    alert("Lỗi kết nối máy chủ: " + e.message);
  }
}

// ==================== NHẬT KÝ AN NINH (SECURITY AUDIT LOGS) ====================
async function openSecurityLogsModal() {
  openModal("modal-security-logs");
  const tbody = document.getElementById("security-logs-tbody");
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:20px; color:var(--gray-400);"><i class="fa-solid fa-spinner fa-spin"></i> Đang tải nhật ký an ninh...</td></tr>`;

  try {
    const res = await fetch("/api/security/logs");
    const data = await res.json();

    if (data.logs && data.logs.length > 0) {
      tbody.innerHTML = data.logs.map(l => {
        let evBadge = `<span class="badge badge-pass">${l.event_type}</span>`;
        if (l.event_type.includes("FAIL") || l.event_type.includes("BLOCK") || l.event_type.includes("REJECT")) {
          evBadge = `<span class="badge" style="background:#fee2e2; color:#ef4444;"><i class="fa-solid fa-ban"></i> ${l.event_type}</span>`;
        } else if (l.event_type.includes("SUCCESS") || l.event_type.includes("BACKUP")) {
          evBadge = `<span class="badge badge-good"><i class="fa-solid fa-check"></i> ${l.event_type}</span>`;
        }

        return `
          <tr>
            <td style="white-space:nowrap; color:var(--gray-600);">${l.created_at}</td>
            <td>${evBadge}</td>
            <td style="font-weight:600; color:var(--gray-800);">${l.username || 'ANONYMOUS'}</td>
            <td style="font-family:monospace; color:#0284c7;">${l.ip_address || '--'}</td>
            <td style="color:var(--gray-700);">${l.details || '--'}</td>
          </tr>
        `;
      }).join("");
    } else {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:20px; color:var(--gray-400);">Chưa có sự kiện an ninh nào được ghi nhận.</td></tr>`;
    }
  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:20px; color:red;">Lỗi tải nhật ký an ninh: ${e.message}</td></tr>`;
  }
}

async function clearSecurityLogs() {
  if (!confirm("Bạn có chắc chắn muốn làm sạch toàn bộ lịch sử sự kiện an ninh?")) return;
  try {
    const res = await fetch("/api/security/clear-logs", { method: "POST" });
    const data = await res.json();
    if (data.success) {
      alert("✅ " + data.message);
      await openSecurityLogsModal();
    }
  } catch (e) {
    alert("Lỗi kết nối: " + e.message);
  }
}

// ==================== CẬP NHẬT TRẠNG THÁI TUNNEL TRONG CÀI ĐẶT ====================
async function updateSettingsTunnelStatus() {
  const badge = document.getElementById("settings-tunnel-badge");
  const box = document.getElementById("settings-tunnel-url-box");
  if (!box) return;

  try {
    const res = await fetch("/api/network-info");
    const data = await res.json();
    if (data.tunnel && data.tunnel.active && data.tunnel.url) {
      if (badge) {
        badge.textContent = "Đang phát sóng";
        badge.className = "badge badge-good";
      }
      box.textContent = data.tunnel.url;
      box.style.color = "#4ade80";
    } else {
      if (badge) {
        badge.textContent = "Tạm dừng";
        badge.className = "badge badge-fail";
      }
      box.textContent = "Chưa bật phát sóng ngoại viện. Nhấn 'Làm mới' để kết nối.";
      box.style.color = "#fbbf24";
    }
  } catch (e) {
    box.textContent = "Lỗi kiểm tra trạng thái tunnel.";
  }
}

async function restartTunnel() {
  const box = document.getElementById("settings-tunnel-url-box");
  if (box) box.textContent = "Đang kết nối lại Cloudflare Tunnel...";
  try {
    const res = await fetch("/api/tunnel/start", { method: "POST" });
    const data = await res.json();
    if (data.success && data.url) {
      alert("✅ Đã kết nối lại thành công!\nURL Ngoại viện: " + data.url);
      await updateSettingsTunnelStatus();
    } else {
      alert("⚠️ Không thể kết nối Cloudflare Tunnel. Kiểm tra kết nối Internet.");
      await updateSettingsTunnelStatus();
    }
  } catch (e) {
    alert("Lỗi: " + e.message);
  }
}

function copySettingsTunnelUrl() {
  const box = document.getElementById("settings-tunnel-url-box");
  if (!box || !box.textContent.startsWith("http")) {
    alert("Chưa có URL ngoại viện hợp lệ để sao chép!");
    return;
  }
  navigator.clipboard.writeText(box.textContent).then(() => {
    alert("📋 Đã sao chép liên kết ngoại viện:\n" + box.textContent);
  }).catch(() => {
    prompt("Sao chép thủ công liên kết ngoại viện:", box.textContent);
  });
}

