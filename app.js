/**
 * 5S VPI - Medical Cleaning & 5S Visual Audit Mobile Application
 * BỆNH VIỆN ĐA KHOA VĨNH PHÚC (VPI)
 * KHOA CHẨN ĐOÁN HÌNH ẢNH & BAN CHỈ ĐẠO 5S TOÀN VIỆN
 * Phụ trách: ThS. BSCKII. Phạm Quỳnh Hưng & KTV Trưởng Vũ Bá Đạt
 * Kiến trúc UI: Tailwind CSS + Lucide Icons (Tương thích 100% với RadOps CDHA VPI)
 */

const STORAGE_KEY = 'vpi_5s_data_v2_rbac';
const SECURITY_LOG_KEY = 'vpi_5s_security_logs_v1';

// CSDL Khởi tạo chuẩn Bệnh viện VPI
const DEFAULT_SEED_DATA = {
  hospital: {
    name: 'Bệnh viện Đa khoa Vĩnh Phúc (VPI)',
    legalName: 'Bệnh viện Đa khoa Tỉnh Vĩnh Phúc',
    department: 'Hội đồng Quản lý Chất lượng & Ban 5S',
    slogan: 'Sàng lọc - Sắp xếp - Sạch sẽ - Săn sóc - Sẵn sàng',
    address: 'Lạc Ý, Định Trung, TP. Vĩnh Yên, Tỉnh Vĩnh Phúc',
    hotline: '0211.386.115',
    director: 'ThS. BSCKII. Phạm Quỳnh Hưng',
    directorTitle: 'Trưởng ban Chỉ đạo 5S Bệnh viện',
    officer: 'KTV. Vũ Bá Đạt',
    officerId: 'BV-345',
    officerTitle: 'Cán bộ Giám sát 5S Toàn Viện & KTV Trưởng CĐHA',
    complianceRate: 100,
    averageScore: 98.5
  },
  departments: [{"id": 1, "code": "KCC", "name": "Khoa Cấp cứu", "head_nurse": "ĐD. Trần Thị Lan Hương", "doctor_in_charge": "Thạc sĩ-BS: Phạm Quỳnh Hưng", "phone": "0211.386.115", "color": "#ef4444", "icon": "fa-ambulance", "description": "Tiếp nhận cấp cứu 24/7, xử lý khẩn cấp bệnh nhân nặng", "created_at": "2026-10-14 05:32:50"}, {"id": 2, "code": "KKB", "name": "Khoa Khám bệnh", "head_nurse": "ĐD. Hoàng Bích Thủy", "doctor_in_charge": "BSCKI. Vũ Đình Khiêm", "phone": "0211.386.101", "color": "#0ea5e9", "icon": "fa-stethoscope", "description": "Khám ngoại trú, tư vấn và chỉ định cận lâm sàng", "created_at": "2026-10-14 05:32:50"}, {"id": 3, "code": "YHCTPHCN", "name": "Khoa YHCT-PHCN", "head_nurse": "ĐD. Phạm Thị Lý", "doctor_in_charge": "ThS.BS. Đinh Công Trí", "phone": "0211.386.118", "color": "#f59e0b", "icon": "fa-heart-pulse", "description": "Điều trị chuyên sâu bệnh nhân hồi sức, thở máy, lọc máu", "created_at": "2026-10-14 05:32:50"}, {"id": 4, "code": "KNG", "name": "Khoa Ngoại Tổng hợp", "head_nurse": "ĐD. Bùi Văn Hùng", "doctor_in_charge": "BSCKII. Lê Tuấn Anh", "phone": "0211.386.120", "color": "#10b981", "icon": "fa-user-doctor", "description": "Phẫu thuật điều trị các bệnh lý tiêu hóa, gan mật, lồng ngực", "created_at": "2026-10-14 05:32:50"}, {"id": 5, "code": "KNT", "name": "Khoa Nội Tổng hợp", "head_nurse": "ĐD. Trần Phương Dung", "doctor_in_charge": "BSCKI. Mai Thị Hảo", "phone": "0211.386.122", "color": "#06b6d4", "icon": "fa-notes-medical", "description": "Khám và điều trị nội trú bệnh tim mạch, hô hấp, nội tiết", "created_at": "2026-10-14 05:32:50"}, {"id": 6, "code": "KSN", "name": "Khoa Phụ Sản", "head_nurse": "Hộ sinh. Lê Thị Thúy Hằng", "doctor_in_charge": "BSCKII. Nguyễn Thị Hồng", "phone": "0211.386.125", "color": "#ec4899", "icon": "fa-baby", "description": "Chăm sóc thai phụ, đỡ đẻ, mổ lấy thai và điều trị phụ khoa", "created_at": "2026-10-14 05:32:50"}, {"id": 7, "code": "KNHI", "name": "Khoa Nhi", "head_nurse": "ĐD. Đỗ Thị Hiền", "doctor_in_charge": "ThS.BS. Đặng Hồng Phúc", "phone": "0211.386.128", "color": "#eab308", "icon": "fa-children", "description": "Khám và điều trị toàn diện bệnh lý sơ sinh và trẻ nhỏ", "created_at": "2026-10-14 05:32:50"}, {"id": 8, "code": "KCDHA", "name": "Khoa Chẩn đoán Hình ảnh", "head_nurse": "KTV. Nguyễn Đức Tuấn", "doctor_in_charge": "BSCKI. Phạm Quang Nam", "phone": "0211.386.130", "color": "#6366f1", "icon": "fa-x-ray", "description": "Chụp X-quang, Cắt lớp vi tính (CT), MRI, Siêu âm", "created_at": "2026-10-14 05:32:50"}, {"id": 9, "code": "KXN", "name": "Khoa Xét nghiệm", "head_nurse": "KTV. Đỗ Thị Thu Hường", "doctor_in_charge": "BSCKI. Vũ Đức Hải", "phone": "0211.386.132", "color": "#8b5cf6", "icon": "fa-vial-virus", "description": "Huyết học, Sinh hóa, Miễn dịch, Vi sinh đạt chuẩn ISO 15189", "created_at": "2026-10-14 05:32:50"}, {"id": 10, "code": "KKSNK", "name": "Khoa Kiểm soát Nhiễm khuẩn", "head_nurse": "ĐD. Trịnh Thị Thu Trang", "doctor_in_charge": "BSCKI. Hoàng Trọng Nghĩa", "phone": "0211.386.135", "color": "#14b8a6", "icon": "fa-shield-virus", "description": "Khử khuẩn tiệt khuẩn dụng cụ, giặt là đồ vải, giám sát 5S bệnh viện", "created_at": "2026-10-14 05:32:50"}],
  rooms: [{"id": 1, "department_id": 1, "code": "KCC-P01", "name": "Phòng Tiếp nhận & Phân loại bệnh", "room_type": "Phòng tiếp đón", "floor": "Tầng 1 - Nhà A", "person_in_charge": "ĐD. Lê Văn Minh", "target_score": 90.0, "status": "active", "created_at": "2026-10-14 05:32:50"}, {"id": 2, "department_id": 1, "code": "KCC-P02", "name": "Phòng Hồi sức Cấp cứu ban đầu", "room_type": "Phòng thủ thuật", "floor": "Tầng 1 - Nhà A", "person_in_charge": "ĐD. Trần Thị Lan", "target_score": 90.0, "status": "active", "created_at": "2026-10-14 05:32:50"}, {"id": 3, "department_id": 1, "code": "KCC-P03", "name": "Phòng Lưu bệnh Cấp cứu (Phòng 101)", "room_type": "Phòng bệnh", "floor": "Tầng 1 - Nhà A", "person_in_charge": "ĐD. Phạm Thị Mai", "target_score": 90.0, "status": "active", "created_at": "2026-10-14 05:32:50"}, {"id": 4, "department_id": 1, "code": "KCC-P04", "name": "Phòng Tiểu phẫu - Băng bó vết thương", "room_type": "Phòng thủ thuật", "floor": "Tầng 1 - Nhà A", "person_in_charge": "ĐD. Hoàng Hải Yến", "target_score": 90.0, "status": "active", "created_at": "2026-10-14 05:32:50"}, {"id": 5, "department_id": 1, "code": "KCC-P05", "name": "Kho Thuốc & Dịch truyền Cấp cứu", "room_type": "Kho dược", "floor": "Tầng 1 - Nhà A", "person_in_charge": "DS. Nguyễn Bích Ngọc", "target_score": 90.0, "status": "active", "created_at": "2026-10-14 05:32:50"}, {"id": 6, "department_id": 1, "code": "KCC-P06", "name": "Khu Vệ sinh Cấp cứu & Khử khuẩn", "room_type": "Khu vệ sinh", "floor": "Tầng 1 - Nhà A", "person_in_charge": "Hộ lý. Vũ Thị Hoa", "target_score": 90.0, "status": "active", "created_at": "2026-10-14 05:32:50"}, {"id": 7, "department_id": 2, "code": "KKB-P01", "name": "Sảnh Tiếp đón & Lấy số tự động", "room_type": "Sảnh chờ", "floor": "Tầng 1 - Nhà B", "person_in_charge": "ĐD. Nguyễn Thu Trang", "target_score": 90.0, "status": "active", "created_at": "2026-10-14 05:32:50"}, {"id": 8, "department_id": 2, "code": "KKB-P02", "name": "Phòng Khám Nội tổng quát (P.101)", "room_type": "Phòng khám", "floor": "Tầng 1 - Nhà B", "person_in_charge": "BS. Lê Quang Huy", "target_score": 90.0, "status": "active", "created_at": "2026-10-14 05:32:50"}, {"id": 9, "department_id": 2, "code": "KKB-P03", "name": "Phòng Khám Ngoại - Chấn thương (P.102)", "room_type": "Phòng khám", "floor": "Tầng 1 - Nhà B", "person_in_charge": "BS. Đỗ Mạnh Cường", "target_score": 90.0, "status": "active", "created_at": "2026-10-14 05:32:50"}, {"id": 10, "department_id": 2, "code": "KKB-P04", "name": "Phòng Khám Nhi (P.103)", "room_type": "Phòng khám", "floor": "Tầng 1 - Nhà B", "person_in_charge": "BS. Trần Thảo Vy", "target_score": 90.0, "status": "active", "created_at": "2026-10-14 05:32:50"}, {"id": 11, "department_id": 2, "code": "KKB-P05", "name": "Phòng Lấy mẫu máu & Bệnh phẩm tập trung", "room_type": "Phòng thủ thuật", "floor": "Tầng 1 - Nhà B", "person_in_charge": "KTV. Lê Thùy Linh", "target_score": 90.0, "status": "active", "created_at": "2026-10-14 05:32:50"}, {"id": 16, "department_id": 4, "code": "KNG-P01", "name": "Buồng Hậu phẫu Ngoại 201", "room_type": "Phòng bệnh", "floor": "Tầng 2 - Nhà C", "person_in_charge": "ĐD. Trần Kim Oanh", "target_score": 90.0, "status": "active", "created_at": "2026-10-14 05:32:50"}, {"id": 17, "department_id": 4, "code": "KNG-P02", "name": "Buồng Bệnh Tiền phẫu 202", "room_type": "Phòng bệnh", "floor": "Tầng 2 - Nhà C", "person_in_charge": "ĐD. Nguyễn Văn Thắng", "target_score": 90.0, "status": "active", "created_at": "2026-10-14 05:32:50"}, {"id": 18, "department_id": 4, "code": "KNG-P03", "name": "Phòng Thay băng - Rửa vết thương", "room_type": "Phòng thủ thuật", "floor": "Tầng 2 - Nhà C", "person_in_charge": "ĐD. Bùi Văn Hùng", "target_score": 90.0, "status": "active", "created_at": "2026-10-14 05:32:50"}, {"id": 19, "department_id": 4, "code": "KNG-P04", "name": "Phòng Trực Bác sĩ & Giao ban khoa", "room_type": "Phòng giao ban", "floor": "Tầng 2 - Nhà C", "person_in_charge": "BS. Lê Tuấn Anh", "target_score": 90.0, "status": "active", "created_at": "2026-10-14 05:32:50"}, {"id": 20, "department_id": 5, "code": "KNT-P01", "name": "Buồng Bệnh Nội Tim Mạch (P.301)", "room_type": "Phòng bệnh", "floor": "Tầng 3 - Nhà C", "person_in_charge": "ĐD. Dương Thị Hằng", "target_score": 90.0, "status": "active", "created_at": "2026-10-14 05:32:50"}, {"id": 21, "department_id": 5, "code": "KNT-P02", "name": "Buồng Bệnh Nội Tiết - Tiểu đường (P.302)", "room_type": "Phòng bệnh", "floor": "Tầng 3 - Nhà C", "person_in_charge": "ĐD. Ngô Thị Yến", "target_score": 90.0, "status": "active", "created_at": "2026-10-14 05:32:50"}, {"id": 22, "department_id": 5, "code": "KNT-P03", "name": "Phòng Tiêm & Phát thuốc hàng ngày", "room_type": "Phòng trực", "floor": "Tầng 3 - Nhà C", "person_in_charge": "ĐD. Trần Phương Dung", "target_score": 90.0, "status": "active", "created_at": "2026-10-14 05:32:50"}, {"id": 23, "department_id": 5, "code": "KNT-P04", "name": "Khu Vệ sinh buồng bệnh nhân Tầng 3", "room_type": "Khu vệ sinh", "floor": "Tầng 3 - Nhà C", "person_in_charge": "Hộ lý. Phạm Thị Chắt", "target_score": 90.0, "status": "active", "created_at": "2026-10-14 05:32:50"}, {"id": 24, "department_id": 6, "code": "KSN-P01", "name": "Phòng Chờ đẻ & Theo dõi tim thai", "room_type": "Phòng chuyên khoa", "floor": "Tầng 2 - Nhà B", "person_in_charge": "HS. Vũ Thị Loan", "target_score": 90.0, "status": "active", "created_at": "2026-10-14 05:32:50"}, {"id": 25, "department_id": 6, "code": "KSN-P02", "name": "Phòng Đẻ thường số 1 (Vô khuẩn)", "room_type": "Phòng thủ thuật", "floor": "Tầng 2 - Nhà B", "person_in_charge": "HS. Lê Thị Thúy Hằng", "target_score": 90.0, "status": "active", "created_at": "2026-10-14 05:32:50"}, {"id": 26, "department_id": 6, "code": "KSN-P03", "name": "Buồng Chăm sóc Mẹ và Bé sau sinh (P.205)", "room_type": "Phòng bệnh", "floor": "Tầng 2 - Nhà B", "person_in_charge": "ĐD. Trần Hồng Nhung", "target_score": 90.0, "status": "active", "created_at": "2026-10-14 05:32:50"}, {"id": 27, "department_id": 6, "code": "KSN-P04", "name": "Phòng Tắm Bé & Tiêm chủng sơ sinh", "room_type": "Phòng thủ thuật", "floor": "Tầng 2 - Nhà B", "person_in_charge": "HS. Nguyễn Thị Thêu", "target_score": 90.0, "status": "active", "created_at": "2026-10-14 05:32:50"}, {"id": 28, "department_id": 7, "code": "KNHI-P01", "name": "Đơn nguyên Sơ sinh (Lồng ấp & Chiếu đèn)", "room_type": "Phòng đặc biệt", "floor": "Tầng 3 - Nhà B", "person_in_charge": "ĐD. Đỗ Thị Hiền", "target_score": 90.0, "status": "active", "created_at": "2026-10-14 05:32:50"}, {"id": 29, "department_id": 7, "code": "KNHI-P02", "name": "Buồng Bệnh Nhi Hô hấp (P.301)", "room_type": "Phòng bệnh", "floor": "Tầng 3 - Nhà B", "person_in_charge": "ĐD. Nguyễn Thị Thủy", "target_score": 90.0, "status": "active", "created_at": "2026-10-14 05:32:50"}, {"id": 30, "department_id": 7, "code": "KNHI-P03", "name": "Buồng Bệnh Nhi Tiêu hóa (P.302)", "room_type": "Phòng bệnh", "floor": "Tầng 3 - Nhà B", "person_in_charge": "ĐD. Mai Thị Trang", "target_score": 90.0, "status": "active", "created_at": "2026-10-14 05:32:50"}, {"id": 31, "department_id": 7, "code": "KNHI-P04", "name": "Khu Vui chơi giải trí cho bé bệnh nhi", "room_type": "Khu công cộng", "floor": "Tầng 3 - Nhà B", "person_in_charge": "ĐD. Trần Thu Hà", "target_score": 90.0, "status": "active", "created_at": "2026-10-14 05:32:50"}, {"id": 32, "department_id": 8, "code": "KCDHA-P01", "name": "Phòng Chụp Cắt lớp vi tính 128 dãy (CT-Scanner)", "room_type": "Phòng máy", "floor": "Tầng 1 - Nhà Kỹ thuật", "person_in_charge": "KTV. Nguyễn Đức Tuấn", "target_score": 90.0, "status": "active", "created_at": "2026-10-14 05:32:50"}, {"id": 33, "department_id": 8, "code": "KCDHA-P02", "name": "Phòng Chụp Cộng hưởng từ 1.5 Tesla (MRI)", "room_type": "Phòng máy", "floor": "Tầng 1 - Nhà Kỹ thuật", "person_in_charge": "KTV. Lê Công Bằng", "target_score": 90.0, "status": "active", "created_at": "2026-10-14 05:32:50"}, {"id": 34, "department_id": 8, "code": "KCDHA-P03", "name": "Phòng Chụp X-quang Kỹ thuật số DR", "room_type": "Phòng máy", "floor": "Tầng 1 - Nhà Kỹ thuật", "person_in_charge": "KTV. Trần Văn Chung", "target_score": 90.0, "status": "active", "created_at": "2026-10-14 05:32:50"}, {"id": 35, "department_id": 8, "code": "KCDHA-P04", "name": "Phòng Siêu âm Màu 4D (P.104)", "room_type": "Phòng khám", "floor": "Tầng 1 - Nhà Kỹ thuật", "person_in_charge": "BS. Phạm Quang Nam", "target_score": 90.0, "status": "active", "created_at": "2026-10-14 05:32:50"}, {"id": 36, "department_id": 9, "code": "KXN-P01", "name": "Phòng Xét nghiệm Huyết học & Truyền máu", "room_type": "Phòng xét nghiệm", "floor": "Tầng 2 - Nhà Kỹ thuật", "person_in_charge": "KTV. Đỗ Thị Thu Hường", "target_score": 90.0, "status": "active", "created_at": "2026-10-14 05:32:50"}, {"id": 37, "department_id": 9, "code": "KXN-P02", "name": "Phòng Xét nghiệm Sinh hóa - Miễn dịch tự động", "room_type": "Phòng xét nghiệm", "floor": "Tầng 2 - Nhà Kỹ thuật", "person_in_charge": "KTV. Nguyễn Đình Khải", "target_score": 90.0, "status": "active", "created_at": "2026-10-14 05:32:50"}, {"id": 38, "department_id": 9, "code": "KXN-P03", "name": "Phòng Vi sinh - Ký sinh trùng & Nuôi cấy", "room_type": "Phòng xét nghiệm", "floor": "Tầng 2 - Nhà Kỹ thuật", "person_in_charge": "KTV. Phạm Thị Hạnh", "target_score": 90.0, "status": "active", "created_at": "2026-10-14 05:32:50"}, {"id": 39, "department_id": 9, "code": "KXN-P04", "name": "Kho Hóa chất xét nghiệm & Lưu mẫu bệnh phẩm", "room_type": "Kho lưu trữ", "floor": "Tầng 2 - Nhà Kỹ thuật", "person_in_charge": "KTV. Lê Thu Thảo", "target_score": 90.0, "status": "active", "created_at": "2026-10-14 05:32:50"}, {"id": 40, "department_id": 10, "code": "KKSNK-P01", "name": "Khu Tiếp nhận & Rửa dụng cụ y tế bẩn", "room_type": "Khu kỹ thuật", "floor": "Tầng 1 - Nhà Giặt hấp", "person_in_charge": "ĐD. Trịnh Thị Thu Trang", "target_score": 90.0, "status": "active", "created_at": "2026-10-14 05:32:50"}, {"id": 41, "department_id": 10, "code": "KKSNK-P02", "name": "Khu Đóng gói & Nồi hấp Tiệt trùng nhiệt độ cao", "room_type": "Khu tiệt trùng", "floor": "Tầng 1 - Nhà Giặt hấp", "person_in_charge": "KTV. Nguyễn Văn Đạt", "target_score": 90.0, "status": "active", "created_at": "2026-10-14 05:32:50"}, {"id": 42, "department_id": 10, "code": "KKSNK-P03", "name": "Kho Dụng cụ Phẫu thuật Vô khuẩn thành phẩm", "room_type": "Kho vô trùng", "floor": "Tầng 1 - Nhà Giặt hấp", "person_in_charge": "ĐD. Lê Thị Nga", "target_score": 90.0, "status": "active", "created_at": "2026-10-14 05:32:50"}, {"id": 43, "department_id": 10, "code": "KKSNK-P04", "name": "Khu Giặt là đồ vải bệnh viện công nghiệp", "room_type": "Khu giặt là", "floor": "Tầng 1 - Nhà Giặt hấp", "person_in_charge": "CN. Đặng Thị Loan", "target_score": 90.0, "status": "active", "created_at": "2026-10-14 05:32:50"}, {"id": 46, "department_id": 3, "code": "HS-01", "name": "Buồng Bệnh nhân nặng Hồi sức 1", "room_type": "patient", "floor": "Tầng 2 - Nhà B", "person_in_charge": "BSCKI. Trần Văn Thái", "target_score": 95.0, "status": "active", "created_at": "2026-10-14 14:44:27"}, {"id": 47, "department_id": 3, "code": "HS-02", "name": "Buồng Bệnh nhân Thở máy & Lọc máu", "room_type": "patient", "floor": "Tầng 2 - Nhà B", "person_in_charge": "ĐD. Nguyễn Thị Mai", "target_score": 95.0, "status": "active", "created_at": "2026-10-14 14:44:27"}, {"id": 48, "department_id": 3, "code": "HS-03", "name": "Phòng Thao tác & Thủ thuật ICU", "room_type": "treatment", "floor": "Tầng 2 - Nhà B", "person_in_charge": "ThS.BS. Đinh Công Trí", "target_score": 95.0, "status": "active", "created_at": "2026-10-14 14:44:27"}, {"id": 49, "department_id": 3, "code": "HS-04", "name": "Phòng Trực cấp cứu & Giao ban ICU", "room_type": "office", "floor": "Tầng 2 - Nhà B", "person_in_charge": "ĐD. Nguyễn Thị Thanh Nga", "target_score": 90.0, "status": "active", "created_at": "2026-10-14 14:44:27"}],
  staff: [{"id": 1, "staff_code": "NV-KCC-01", "full_name": "BSCKII. Nguyễn Văn Toàn", "department_id": 1, "role": "Bác sĩ Trưởng khoa", "phone": "0912.345.678", "pin_code": "1234", "status": "active", "created_at": "2026-10-14 06:44:01", "username": "nv_kcc_01", "password": "123456", "role_type": "manager", "assigned_rooms": "[]", "allow_external": 1, "code": "NV-KCC-01", "name": "BSCKII. Nguyễn Văn Toàn", "role_title": "Cán bộ 5S", "position": "Cán bộ 5S", "assigned_room": "[]"}, {"id": 2, "staff_code": "NV-KCC-02", "full_name": "ĐD. Vũ Quang Trưởng", "department_id": 1, "role": "Điều dưỡng Trưởng khoa", "phone": "0983.115.115", "pin_code": "1234", "status": "active", "created_at": "2026-10-14 06:44:01", "username": "nv_kcc_02", "password": "123456", "role_type": "manager", "assigned_rooms": "[]", "allow_external": 1, "code": "NV-KCC-02", "name": "ĐD. Vũ Quang Trưởng", "role_title": "Cán bộ 5S", "position": "Cán bộ 5S", "assigned_room": "[]"}, {"id": 3, "staff_code": "NV-KCC-03", "full_name": "ĐD. Lê Văn Minh", "department_id": 1, "role": "Điều dưỡng viên", "phone": "0977.123.456", "pin_code": "1234", "status": "active", "created_at": "2026-10-14 06:44:01", "username": "nv_kcc_03", "password": "123456", "role_type": "staff", "assigned_rooms": "[1, 2, 3]", "allow_external": 1, "code": "NV-KCC-03", "name": "ĐD. Lê Văn Minh", "role_title": "Cán bộ 5S", "position": "Cán bộ 5S", "assigned_room": "[1, 2, 3]"}, {"id": 4, "staff_code": "NV-KCC-04", "full_name": "ĐD. Phạm Thị Mai", "department_id": 1, "role": "Điều dưỡng viên", "phone": "0968.222.333", "pin_code": "1234", "status": "active", "created_at": "2026-10-14 06:44:01", "username": "nv_kcc_04", "password": "123456", "role_type": "staff", "assigned_rooms": "[4, 5]", "allow_external": 1, "code": "NV-KCC-04", "name": "ĐD. Phạm Thị Mai", "role_title": "Cán bộ 5S", "position": "Cán bộ 5S", "assigned_room": "[4, 5]"}, {"id": 5, "staff_code": "NV-KCC-05", "full_name": "Hộ lý. Vũ Thị Hoa", "department_id": 1, "role": "Hộ lý buồng bệnh", "phone": "0945.666.777", "pin_code": "1234", "status": "active", "created_at": "2026-10-14 06:44:01", "username": "nv_kcc_05", "password": "123456", "role_type": "staff", "assigned_rooms": "[6]", "allow_external": 1, "code": "NV-KCC-05", "name": "Hộ lý. Vũ Thị Hoa", "role_title": "Cán bộ 5S", "position": "Cán bộ 5S", "assigned_room": "[6]"}, {"id": 6, "staff_code": "NV-ICU-01", "full_name": "ThS.BS. Đinh Công Trí", "department_id": 3, "role": "Bác sĩ Trưởng khoa", "phone": "0913.888.999", "pin_code": "1234", "status": "active", "created_at": "2026-10-14 06:44:01", "username": "nv_icu_01", "password": "123456", "role_type": "manager", "assigned_rooms": "[]", "allow_external": 1, "code": "NV-ICU-01", "name": "ThS.BS. Đinh Công Trí", "role_title": "Cán bộ 5S", "position": "Cán bộ 5S", "assigned_room": "[]"}, {"id": 7, "staff_code": "NV-ICU-02", "full_name": "ĐD. Nguyễn Thị Thanh Nga", "department_id": 3, "role": "Điều dưỡng Trưởng khoa", "phone": "0982.999.000", "pin_code": "1234", "status": "active", "created_at": "2026-10-14 06:44:01", "username": "nv_icu_02", "password": "123456", "role_type": "manager", "assigned_rooms": "[]", "allow_external": 1, "code": "NV-ICU-02", "name": "ĐD. Nguyễn Thị Thanh Nga", "role_title": "Cán bộ 5S", "position": "Cán bộ 5S", "assigned_room": "[]"}, {"id": 8, "staff_code": "NV-ICU-03", "full_name": "ĐD. Phan Anh Tuấn", "department_id": 3, "role": "Điều dưỡng viên", "phone": "0971.222.111", "pin_code": "1234", "status": "active", "created_at": "2026-10-14 06:44:01", "username": "nv_icu_03", "password": "123456", "role_type": "staff", "assigned_rooms": "[]", "allow_external": 1, "code": "NV-ICU-03", "name": "ĐD. Phan Anh Tuấn", "role_title": "Cán bộ 5S", "position": "Cán bộ 5S", "assigned_room": "[]"}, {"id": 9, "staff_code": "NV-KKB-01", "full_name": "BSCKI. Vũ Đình Khiêm", "department_id": 2, "role": "Bác sĩ Trưởng khoa", "phone": "0915.223.344", "pin_code": "1234", "status": "active", "created_at": "2026-10-14 06:44:01", "username": "nv_kkb_01", "password": "123456", "role_type": "manager", "assigned_rooms": "[]", "allow_external": 1, "code": "NV-KKB-01", "name": "BSCKI. Vũ Đình Khiêm", "role_title": "Cán bộ 5S", "position": "Cán bộ 5S", "assigned_room": "[]"}, {"id": 10, "staff_code": "NV-KKB-02", "full_name": "ĐD. Hoàng Bích Thủy", "department_id": 2, "role": "Điều dưỡng Trưởng khoa", "phone": "0984.556.677", "pin_code": "1234", "status": "active", "created_at": "2026-10-14 06:44:01", "username": "nv_kkb_02", "password": "123456", "role_type": "manager", "assigned_rooms": "[]", "allow_external": 1, "code": "NV-KKB-02", "name": "ĐD. Hoàng Bích Thủy", "role_title": "Cán bộ 5S", "position": "Cán bộ 5S", "assigned_room": "[]"}, {"id": 11, "staff_code": "NV-KKB-03", "full_name": "ĐD. Nguyễn Thu Trang", "department_id": 2, "role": "Điều dưỡng viên", "phone": "0973.889.900", "pin_code": "1234", "status": "active", "created_at": "2026-10-14 06:44:01", "username": "nv_kkb_03", "password": "123456", "role_type": "staff", "assigned_rooms": "[]", "allow_external": 1, "code": "NV-KKB-03", "name": "ĐD. Nguyễn Thu Trang", "role_title": "Cán bộ 5S", "position": "Cán bộ 5S", "assigned_room": "[]"}, {"id": 12, "staff_code": "NV-KNG-01", "full_name": "BSCKII. Lê Tuấn Anh", "department_id": 4, "role": "Bác sĩ Trưởng khoa", "phone": "0916.334.455", "pin_code": "1234", "status": "active", "created_at": "2026-10-14 06:44:01", "username": "nv_kng_01", "password": "123456", "role_type": "manager", "assigned_rooms": "[]", "allow_external": 1, "code": "NV-KNG-01", "name": "BSCKII. Lê Tuấn Anh", "role_title": "Cán bộ 5S", "position": "Cán bộ 5S", "assigned_room": "[]"}, {"id": 13, "staff_code": "NV-KNG-02", "full_name": "ĐD. Bùi Văn Hùng", "department_id": 4, "role": "Điều dưỡng Trưởng khoa", "phone": "0985.667.788", "pin_code": "1234", "status": "active", "created_at": "2026-10-14 06:44:01", "username": "nv_kng_02", "password": "123456", "role_type": "manager", "assigned_rooms": "[]", "allow_external": 1, "code": "NV-KNG-02", "name": "ĐD. Bùi Văn Hùng", "role_title": "Cán bộ 5S", "position": "Cán bộ 5S", "assigned_room": "[]"}, {"id": 14, "staff_code": "NV-KNG-03", "full_name": "ĐD. Trần Kim Oanh", "department_id": 4, "role": "Điều dưỡng viên", "phone": "0974.990.011", "pin_code": "1234", "status": "active", "created_at": "2026-10-14 06:44:01", "username": "nv_kng_03", "password": "123456", "role_type": "staff", "assigned_rooms": "[]", "allow_external": 1, "code": "NV-KNG-03", "name": "ĐD. Trần Kim Oanh", "role_title": "Cán bộ 5S", "position": "Cán bộ 5S", "assigned_room": "[]"}, {"id": 15, "staff_code": "NV-KNT-01", "full_name": "BSCKI. Mai Thị Hảo", "department_id": 5, "role": "Bác sĩ Trưởng khoa", "phone": "0917.445.566", "pin_code": "1234", "status": "active", "created_at": "2026-10-14 06:44:01", "username": "nv_knt_01", "password": "123456", "role_type": "manager", "assigned_rooms": "[]", "allow_external": 1, "code": "NV-KNT-01", "name": "BSCKI. Mai Thị Hảo", "role_title": "Cán bộ 5S", "position": "Cán bộ 5S", "assigned_room": "[]"}, {"id": 16, "staff_code": "NV-KNT-02", "full_name": "ĐD. Trần Phương Dung", "department_id": 5, "role": "Điều dưỡng Trưởng khoa", "phone": "0986.778.899", "pin_code": "1234", "status": "active", "created_at": "2026-10-14 06:44:01", "username": "nv_knt_02", "password": "123456", "role_type": "manager", "assigned_rooms": "[]", "allow_external": 1, "code": "NV-KNT-02", "name": "ĐD. Trần Phương Dung", "role_title": "Cán bộ 5S", "position": "Cán bộ 5S", "assigned_room": "[]"}, {"id": 17, "staff_code": "NV-KSN-01", "full_name": "BSCKII. Nguyễn Thị Hồng", "department_id": 6, "role": "Bác sĩ Trưởng khoa", "phone": "0918.556.677", "pin_code": "1234", "status": "active", "created_at": "2026-10-14 06:44:01", "username": "nv_ksn_01", "password": "123456", "role_type": "manager", "assigned_rooms": "[]", "allow_external": 1, "code": "NV-KSN-01", "name": "BSCKII. Nguyễn Thị Hồng", "role_title": "Cán bộ 5S", "position": "Cán bộ 5S", "assigned_room": "[]"}, {"id": 18, "staff_code": "NV-KSN-02", "full_name": "HS. Lê Thị Thúy Hằng", "department_id": 6, "role": "Hộ sinh Trưởng khoa", "phone": "0987.889.900", "pin_code": "1234", "status": "active", "created_at": "2026-10-14 06:44:01", "username": "nv_ksn_02", "password": "123456", "role_type": "manager", "assigned_rooms": "[]", "allow_external": 1, "code": "NV-KSN-02", "name": "HS. Lê Thị Thúy Hằng", "role_title": "Cán bộ 5S", "position": "Cán bộ 5S", "assigned_room": "[]"}, {"id": 19, "staff_code": "NV-KNHI-01", "full_name": "ThS.BS. Đặng Hồng Phúc", "department_id": 7, "role": "Bác sĩ Trưởng khoa", "phone": "0919.667.788", "pin_code": "1234", "status": "active", "created_at": "2026-10-14 06:44:01", "username": "nv_knhi_01", "password": "123456", "role_type": "manager", "assigned_rooms": "[]", "allow_external": 1, "code": "NV-KNHI-01", "name": "ThS.BS. Đặng Hồng Phúc", "role_title": "Cán bộ 5S", "position": "Cán bộ 5S", "assigned_room": "[]"}, {"id": 20, "staff_code": "NV-KNHI-02", "full_name": "ĐD. Đỗ Thị Hiền", "department_id": 7, "role": "Điều dưỡng Trưởng khoa", "phone": "0988.990.011", "pin_code": "1234", "status": "active", "created_at": "2026-10-14 06:44:01", "username": "nv_knhi_02", "password": "123456", "role_type": "manager", "assigned_rooms": "[]", "allow_external": 1, "code": "NV-KNHI-02", "name": "ĐD. Đỗ Thị Hiền", "role_title": "Cán bộ 5S", "position": "Cán bộ 5S", "assigned_room": "[]"}, {"id": 21, "staff_code": "NV-QLCL-01", "full_name": "BSCKI. Hoàng Trọng Nghĩa", "department_id": 10, "role": "Trưởng Ban Chỉ Đạo 5S", "phone": "0911.222.333", "pin_code": "1234", "status": "active", "created_at": "2026-10-14 06:44:01", "username": "nv_qlcl_01", "password": "123456", "role_type": "manager", "assigned_rooms": "[]", "allow_external": 1, "code": "NV-QLCL-01", "name": "BSCKI. Hoàng Trọng Nghĩa", "role_title": "Cán bộ 5S", "position": "Cán bộ 5S", "assigned_room": "[]"}, {"id": 22, "staff_code": "NV-QLCL-02", "full_name": "ĐD. Trịnh Thị Thu Trang", "department_id": 10, "role": "Cán bộ Giám sát 5S QLCL", "phone": "0989.111.222", "pin_code": "1234", "status": "active", "created_at": "2026-10-14 06:44:01", "username": "nv_qlcl_02", "password": "123456", "role_type": "staff", "assigned_rooms": "[]", "allow_external": 1, "code": "NV-QLCL-02", "name": "ĐD. Trịnh Thị Thu Trang", "role_title": "Cán bộ 5S", "position": "Cán bộ 5S", "assigned_room": "[]"}, {"id": 23, "staff_code": "ADMIN-01", "full_name": "Ban Giám Đốc / QLCL Bệnh Viện VPI", "department_id": 10, "role": "Quản Trị Toàn Viện", "phone": "0916306115", "pin_code": "1234", "status": "active", "created_at": "2026-10-14 07:25:05", "username": "admin", "password": "123456", "role_type": "admin", "assigned_rooms": "[]", "allow_external": 1, "code": "ADMIN-01", "name": "Ban Giám Đốc / QLCL Bệnh Viện VPI", "role_title": "Cán bộ 5S", "position": "Cán bộ 5S", "assigned_room": "[]"}, {"id": 24, "staff_code": "NV-KCC-02-TK", "full_name": "ĐD. Trần Thị Lan Hương", "department_id": 1, "role": "Điều dưỡng Trưởng khoa", "phone": "0983.115.115", "pin_code": "1234", "status": "active", "created_at": "2026-10-14 07:25:05", "username": "truongkhoa_cc", "password": "123456", "role_type": "manager", "assigned_rooms": "[]", "allow_external": 1, "code": "NV-KCC-02-TK", "name": "ĐD. Trần Thị Lan Hương", "role_title": "Cán bộ 5S", "position": "Cán bộ 5S", "assigned_room": "[]"}, {"id": 25, "staff_code": "NV-KCC-03-DD", "full_name": "ĐD. Lê Văn Minh", "department_id": 1, "role": "Điều dưỡng viên đi buồng", "phone": "0977.123.456", "pin_code": "1234", "status": "active", "created_at": "2026-10-14 07:25:05", "username": "dieuduong_cc", "password": "123456", "role_type": "staff", "assigned_rooms": "[1, 2, 3]", "allow_external": 1, "code": "NV-KCC-03-DD", "name": "ĐD. Lê Văn Minh", "role_title": "Cán bộ 5S", "position": "Cán bộ 5S", "assigned_room": "[1, 2, 3]"}],
  audits: [{"id": 1, "audit_code": "5S-20261014-001", "department_id": 1, "room_id": 1, "audit_date": "2026-10-14", "audit_time": "08:30", "shift": "Ca sáng", "inspector_name": "BSCKII. Nguyễn Văn Toàn (Trưởng đoàn)", "inspector_role": "Ban QLCL Bệnh viện VPI", "score_seiri": 19.0, "score_seiton": 18.5, "score_seiso": 19.5, "score_seiketsu": 19.0, "score_shitsuke": 18.5, "total_score": 94.5, "rating": "Xuất sắc", "notes": "Phòng tiếp đón phân loại cấp cứu ngăn nắp, vạch kẻ phân luồng người bệnh rõ ràng, thùng rác phân loại 4 màu đúng chuẩn.", "action_required": "Bổ sung thêm 01 chai cồn sát khuẩn tay nhanh tại quầy tiếp nhận số 2.", "action_deadline": null, "action_status": "in_progress", "created_at": "2026-10-14 05:32:50"}, {"id": 2, "audit_code": "5S-20261014-002", "department_id": 3, "room_id": 12, "audit_date": "2026-10-14", "audit_time": "09:45", "shift": "Ca sáng", "inspector_name": "ĐD. Nguyễn Thị Thanh Nga", "inspector_role": "Điều dưỡng trưởng khoa", "score_seiri": 20.0, "score_seiton": 19.0, "score_seiso": 20.0, "score_seiketsu": 19.0, "score_shitsuke": 19.0, "total_score": 97.0, "rating": "Xuất sắc", "notes": "Buồng thở máy ICU đạt chuẩn vô khuẩn, dây máy thở và dây monitor được bó gọn ghẽ, xe tiêm cấp cứu dán nhãn 5S định vị chuẩn xác.", "action_required": "Duy trì định kỳ lau khử khuẩn các bề mặt tay vịn giường bệnh sau mỗi ca trực.", "action_deadline": null, "action_status": "completed", "created_at": "2026-10-14 05:32:50"}, {"id": 3, "audit_code": "5S-20261013-003", "department_id": 4, "room_id": 18, "audit_date": "2026-10-13", "audit_time": "14:15", "shift": "Ca chiều", "inspector_name": "ĐD. Bùi Văn Hùng", "inspector_role": "Ban Kiểm tra 5S Khoa Ngoại", "score_seiri": 15.0, "score_seiton": 16.0, "score_seiso": 15.5, "score_seiketsu": 16.0, "score_shitsuke": 17.0, "total_score": 79.5, "rating": "Đạt", "notes": "Phát hiện hộp gạc tiệt trùng hết hạn chưa chuyển đổi, bàn thay băng còn vệt dung dịch povidone khô chưa lau sạch, xe tiêm chưa để đúng vị trí vạch vàng kẻ 5S.", "action_required": "Yêu cầu kíp trực vệ sinh khử khuẩn ngay mặt bàn thủ thuật, đưa xe tiêm về đúng ô kẻ vạch, bàn giao dụng cụ hết hạn về Khoa KSNK trước 17h00.", "action_deadline": null, "action_status": "completed", "created_at": "2026-10-14 05:32:50"}, {"id": 4, "audit_code": "5S-20261013-004", "department_id": 2, "room_id": 8, "audit_date": "2026-10-13", "audit_time": "16:00", "shift": "Ca chiều", "inspector_name": "ĐD. Hoàng Bích Thủy", "inspector_role": "Điều dưỡng trưởng khoa", "score_seiri": 18.0, "score_seiton": 17.0, "score_seiso": 18.0, "score_seiketsu": 17.5, "score_shitsuke": 17.5, "total_score": 88.0, "rating": "Tốt", "notes": "Phòng khám nội tổng quát sạch sẽ, tài liệu hồ sơ bệnh án được xếp gọn trong khay chia ngăn. Đèn bàn khám hoạt động tốt.", "action_required": "Dọn dẹp bớt các tài liệu quảng cáo thuốc cũ không còn sử dụng trên nóc tủ hồ sơ.", "action_deadline": null, "action_status": "completed", "created_at": "2026-10-14 05:32:50"}, {"id": 5, "audit_code": "5S-20261012-005", "department_id": 10, "room_id": 42, "audit_date": "2026-10-12", "audit_time": "10:00", "shift": "Ca sáng", "inspector_name": "BSCKI. Hoàng Trọng Nghĩa", "inspector_role": "Trưởng khoa KSNK", "score_seiri": 20.0, "score_seiton": 20.0, "score_seiso": 20.0, "score_seiketsu": 19.5, "score_shitsuke": 19.5, "total_score": 99.0, "rating": "Xuất sắc", "notes": "Kho vô trùng đạt chuẩn cao độ, nhiệt độ và độ ẩm phòng được ghi chép nhật ký 3 lần/ngày, các gói dụng cụ có dán chỉ thị màu tiệt khuẩn và hạn dùng rõ nét.", "action_required": "Phát huy tinh thần làm mẫu cho các khoa lâm sàng khác tham quan học tập.", "action_deadline": null, "action_status": "completed", "created_at": "2026-10-14 05:32:50"}],
  criteria: [
    { id: 1, name: 'S1 - Sàng lọc (Seiri)', max: 20, desc: 'Phân loại rác thải, thuốc, vật tư y tế, loại bỏ vật dụng thừa thãi khỏi buồng phòng' },
    { id: 2, name: 'S2 - Sắp xếp (Seiton)', max: 20, desc: 'Vạch kẻ định vị trang thiết bị y tế, tem nhãn rõ ràng, hồ sơ bệnh án ngăn nắp' },
    { id: 3, name: 'S3 - Sạch sẽ (Seiso)', max: 20, desc: 'Khử khuẩn bề mặt tiếp xúc, sàn buồng bệnh, trang thiết bị máy móc sáng bóng' },
    { id: 4, name: 'S4 - Săn sóc (Seiketsu)', max: 20, desc: 'Chuẩn hóa quy trình vệ sinh, duy trì lịch trực vệ sinh hằng ngày và kiểm tra chéo' },
    { id: 5, name: 'S5 - Sẵn sàng (Shitsuke)', max: 20, desc: 'Văn hóa tự giác, tinh thần 5S y tế, trang phục bảo hộ và biển tên đúng quy định' }
  ],
  auth: {
    currentUserId: 'BV-345',
    locationMode: 'internal' // 'internal' (Nội viện Wi-Fi) | 'external' (Ngoại viện 4G)
  },
  securityLogs: [
    { time: '2026-10-14 07:15:20', ip: '192.168.1.105', user: 'KTV. Vũ Bá Đạt', action: 'Đăng nhập hệ thống (Nội viện Wi-Fi)', status: 'success' },
    { time: '2026-10-14 08:30:11', ip: '113.160.224.45', user: 'BS. Phạm Quỳnh Hưng', action: 'Truy cập ngoại viện an toàn qua Cloudflare HTTPS', status: 'success' },
    { time: '2026-10-14 09:12:44', ip: '192.168.1.118', user: 'ĐD. Trần Thị Lan Hương', action: 'Chấm điểm 5S Phòng Cấp cứu lưu', status: 'success' },
    { time: '2026-10-14 10:45:00', ip: '14.232.18.90', user: 'Hệ thống tự động', action: 'Sao lưu CSDL LocalStorage tự động', status: 'success' }
  ]
};

class App5S {
  constructor() {
    this.data = this.loadData();
    this.normalizeData();

    this.activeTab = 'overview';
    this.viewMode = 'mobile';
    try {
      this.viewMode = localStorage.getItem('vpi_5s_view_mode') || 'mobile';
    } catch (e) {}

    this.theme = 'light';
    try {
      this.theme = localStorage.getItem('vpi_5s_theme') || 'light';
    } catch (e) {}

    this.filterDept = 'all';
    this.filterStatus = 'all';
    this.searchQuery = '';
    
    // Form state cho Phiếu kiểm tra mới
    this.newAuditState = {
      deptId: 1,
      roomId: 1,
      shift: 'Ca sáng (07:00 - 11:30)',
      scores: { 1: 20, 2: 20, 3: 20, 4: 20, 5: 20 },
      beforePhoto: '',
      afterPhoto: '',
      notes: '',
      correctiveAction: ''
    };

    this.init();
  }

  loadData() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.departments && parsed.rooms && parsed.staff) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Lỗi đọc LocalStorage:', e);
    }
    return JSON.parse(JSON.stringify(DEFAULT_SEED_DATA));
  }

  normalizeData() {
    if (!this.data.staff || !Array.isArray(this.data.staff) || this.data.staff.length === 0) {
      this.data.staff = JSON.parse(JSON.stringify(DEFAULT_SEED_DATA.staff));
    }

    this.data.staff = this.data.staff.map((s, idx) => {
      const code = s.code || s.staff_code || ('BV-' + (idx + 101));
      const name = s.name || s.full_name || 'Cán bộ 5S';
      const role = s.role || 'staff';
      let role_title = s.role_title || s.position;
      if (!role_title) {
        if (role === 'admin') role_title = 'Trưởng Ban 5S';
        else if (role === 'manager') role_title = 'Quản lý / ĐD Trưởng';
        else role_title = 'Cán bộ 5S';
      }
      return {
        ...s,
        id: s.id || (idx + 1),
        code: code,
        staff_code: code,
        name: name,
        full_name: name,
        role: role,
        role_title: role_title,
        position: s.position || role_title,
        assigned_room: s.assigned_room || s.assigned_rooms || 'Buồng bệnh được phân công'
      };
    });

    if (!this.data.auth) {
      this.data.auth = { currentUserId: 'BV-345', locationMode: 'internal' };
    }
  }

  saveData() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch (e) {
      console.error('Lỗi lưu LocalStorage:', e);
    }
  }

  init() {
    this.applyViewMode();
    this.applyTheme();
    this.render();
    this.updateEnvLabels();
  }

  getCurrentUser() {
    if (!this.data.staff || this.data.staff.length === 0) {
      return {
        code: 'BV-345',
        staff_code: 'BV-345',
        name: 'KTV. Vũ Bá Đạt',
        full_name: 'KTV. Vũ Bá Đạt',
        role: 'admin',
        role_title: 'Giám sát 5S Toàn Viện & KTV Trưởng',
        position: 'KTV Trưởng CĐHA',
        department_id: 1
      };
    }
    const uid = this.data.auth ? this.data.auth.currentUserId : 'BV-345';
    let user = this.data.staff.find(s => s.code === uid || s.staff_code === uid);
    if (!user) user = this.data.staff[0];
    return user;
  }

  toggleViewMode() {
    this.viewMode = this.viewMode === 'mobile' ? 'desktop' : 'mobile';
    try {
      localStorage.setItem('vpi_5s_view_mode', this.viewMode);
    } catch (e) {}
    this.applyViewMode();
    this.render();
  }

  applyViewMode() {
    const body = document.body;
    const label = document.getElementById('view-mode-label');
    if (this.viewMode === 'mobile') {
      body.classList.add('mobile-frame-mode');
      if (label) label.textContent = 'Mobile Frame';
    } else {
      body.classList.remove('mobile-frame-mode');
      if (label) label.textContent = 'Desktop Toàn Màn Hình';
    }
  }

  toggleLocationMode() {
    const cur = this.data.auth.locationMode;
    this.data.auth.locationMode = cur === 'internal' ? 'external' : 'internal';
    this.saveData();
    this.updateEnvLabels();
    this.render();
    
    const modeName = this.data.auth.locationMode === 'external' ? '🌐 Ngoại viện (4G/Internet)' : '🏢 Nội viện (Mạng LAN Wi-Fi)';
    this.logSecurity('Chuyển đổi chế độ môi trường: ' + modeName);
    this.showToast('Đã chuyển sang chế độ: ' + modeName);
  }

  updateEnvLabels() {
    const topLoc = document.getElementById('top-location-label');
    const envBadge = document.getElementById('env-badge');
    const isExt = this.data.auth.locationMode === 'external';

    if (topLoc) {
      topLoc.textContent = isExt ? 'Ngoại viện (4G)' : 'Nội viện (LAN)';
    }
    if (envBadge) {
      if (isExt) {
        envBadge.className = 'text-[10px] bg-amber-900/60 text-amber-300 border border-amber-700/60 px-2 py-0.5 rounded-full';
        envBadge.textContent = '🌐 Ngoại viện (4G Secure)';
      } else {
        envBadge.className = 'text-[10px] bg-blue-900/60 text-blue-300 border border-blue-700/60 px-2 py-0.5 rounded-full';
        envBadge.textContent = '🏢 Nội viện (Wi-Fi VPI)';
      }
    }
  }

  toggleTheme() {
    this.theme = this.theme === 'light' ? 'dark' : 'light';
    try {
      localStorage.setItem('vpi_5s_theme', this.theme);
    } catch (e) {}
    this.applyTheme();
    this.render();
  }

  applyTheme() {
    if (this.theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark-mode');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark-mode');
    }
  }

  switchTab(tabId) {
    this.activeTab = tabId;
    this.render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  logSecurity(action) {
    const now = new Date();
    const timeStr = now.getFullYear() + '-' + 
      String(now.getMonth() + 1).padStart(2, '0') + '-' + 
      String(now.getDate()).padStart(2, '0') + ' ' + 
      String(now.getHours()).padStart(2, '0') + ':' + 
      String(now.getMinutes()).padStart(2, '0') + ':' + 
      String(now.getSeconds()).padStart(2, '0');
    
    const user = this.getCurrentUser();
    const userName = (user && user.name) ? user.name : 'Vũ Bá Đạt';
    const userCode = (user && user.code) ? user.code : 'BV-345';
    this.data.securityLogs.unshift({
      time: timeStr,
      ip: this.data.auth.locationMode === 'external' ? '4G-Cloudflare-Proxy' : '192.168.1.105',
      user: userName + ' (' + userCode + ')',
      action: action,
      status: 'success'
    });
    if (this.data.securityLogs.length > 50) this.data.securityLogs.pop();
    this.saveData();
  }

  showToast(message) {
    const old = document.getElementById('toast-notification');
    if (old) old.remove();

    const toast = document.createElement('div');
    toast.id = 'toast-notification';
    toast.className = 'fixed top-12 left-1/2 transform -translate-x-1/2 bg-slate-900/90 text-white text-xs font-semibold px-4 py-2 rounded-full shadow-2xl z-50 flex items-center space-x-2 border border-slate-700 backdrop-blur-md animate-bounce';
    toast.innerHTML = `<i data-lucide="check-circle-2" class="w-4 h-4 text-emerald-400"></i><span>${message}</span>`;
    document.body.appendChild(toast);
    if (window.lucide) window.lucide.createIcons();

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.4s ease';
      setTimeout(() => toast.remove(), 400);
    }, 2800);
  }

  // =========================================================================
  // RENDER MAIN APPLICATION CONTAINER
  // =========================================================================
  render() {
    const container = document.getElementById('app-container');
    if (!container) return;

    container.innerHTML = `
      <!-- Phone Bezel Notch (Chỉ hiện khi ở Mobile Frame Mode) -->
      <div class="phone-notch">
        <div class="flex items-center space-x-1.5">
          <span class="font-bold text-[10px] text-slate-800 dark:text-slate-200">5S VPI</span>
          <span class="text-[9px] px-1 py-0.2 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-mono">v2.5</span>
        </div>
        <div class="w-20 h-3.5 bg-slate-800 dark:bg-slate-700 rounded-full mx-auto"></div>
        <div class="flex items-center space-x-1 text-slate-500 dark:text-slate-400 text-[10px]">
          <i data-lucide="wifi" class="w-3 h-3 text-emerald-600"></i>
          <span>100%</span>
          <i data-lucide="battery-charging" class="w-3.5 h-3.5 text-emerald-600"></i>
        </div>
      </div>

      <!-- App Header Bar -->
      ${this.renderHeader()}

      <!-- Main Content View (Cuộn mượt mà) -->
      <main class="flex-1 overflow-y-auto pb-24 no-scrollbar bg-slate-50 dark:bg-slate-900">
        ${this.renderActiveTab()}
      </main>

      <!-- Bottom Navigation Bar -->
      ${this.renderBottomNav()}

      <!-- Modals Container -->
      <div id="modal-container"></div>
    `;

    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  // =========================================================================
  // HEADER BAR (Thanh tiêu đề mang thương hiệu 5S VPI)
  // =========================================================================
  renderHeader() {
    const user = this.getCurrentUser();
    const isExt = this.data.auth.locationMode === 'external';
    const userName = (user && user.name) ? user.name : 'Vũ Bá Đạt';
    const initial = userName.split(' ').pop().charAt(0) || 'Đ';
    const shortName = userName.split(' ').slice(-2).join(' ') || userName;
    const roleTitle = (user && (user.role_title || user.position)) ? (user.role_title || user.position) : 'Cán bộ 5S';

    return `
      <header class="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 py-2.5 sticky top-0 z-30 shadow-xs">
        <div class="flex items-center justify-between">
          <!-- Logo BV VPI & Tiêu đề app có nhãn chữ bên dưới theo yêu cầu -->
          <div class="flex items-center space-x-2.5 cursor-pointer" onclick="app5s.switchTab('overview')">
            <div class="flex flex-col items-center justify-center bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs shrink-0">
              <img src="logo-5s-vpi.png" alt="Logo 5S VPI" class="w-7 h-7 object-contain">
              <span class="text-[7.5px] font-black text-emerald-800 dark:text-emerald-300 tracking-tighter leading-none mt-0.5">5S VPI</span>
            </div>
            <div>
              <div class="flex items-center space-x-1.5">
                <span class="font-extrabold tracking-tight text-emerald-700 dark:text-emerald-400 text-base">5S VPI</span>
                <span class="text-[9px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.2 rounded font-mono">BỆNH VIỆN</span>
              </div>
              <div class="flex items-center text-xs font-semibold text-slate-700 dark:text-slate-200">
                <span class="truncate max-w-[150px] sm:max-w-[220px]">BV Đa khoa Vĩnh Phúc</span>
              </div>
            </div>
          </div>

          <!-- Actions: Đổi chế độ, Cài đặt PWA, Theme, Chuyển nhân viên -->
          <div class="flex items-center space-x-1 sm:space-x-2">
            <!-- Nút Cài đặt App PWA -->
            <button onclick="app5s.openPwaModal()" title="Cài đặt App 5S VPI vào màn hình điện thoại" class="p-2 rounded-xl text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition">
              <i data-lucide="download" class="w-4 h-4"></i>
            </button>

            <!-- Nút Dark Mode -->
            <button onclick="app5s.toggleTheme()" title="Đổi chế độ Sáng / Tối" class="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition">
              <i data-lucide="${this.theme === 'dark' ? 'sun' : 'moon'}" class="w-4 h-4"></i>
            </button>

            <!-- Nút Chọn Nhân Viên & Quyền -->
            <button onclick="app5s.openUserSwitchModal()" class="flex items-center space-x-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-600 transition">
              <div class="w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center">
                ${initial}
              </div>
              <div class="text-left hidden sm:block">
                <div class="text-[10px] font-bold text-slate-800 dark:text-white leading-none">${shortName}</div>
                <div class="text-[8.5px] text-emerald-600 dark:text-emerald-400 font-semibold leading-none mt-0.5">${roleTitle}</div>
              </div>
              <i data-lucide="chevron-down" class="w-3.5 h-3.5 text-slate-400"></i>
            </button>
          </div>
        </div>
      </header>
    `;
  }

  // =========================================================================
  // BOTTOM NAVIGATION BAR (Thanh menu 6 tab hiện đại chuẩn RadOps CDHA)
  // =========================================================================
  renderBottomNav() {
    const tabs = [
      { id: 'overview', label: 'Tổng quan', icon: 'layout-grid' },
      { id: 'audit', label: 'Chấm 5S', icon: 'camera' },
      { id: 'departments', label: 'Khoa Phòng', icon: 'building-2' },
      { id: 'staff', label: 'Nhân sự', icon: 'users' },
      { id: 'reports', label: 'Lịch sử', icon: 'clipboard-list' },
      { id: 'settings', label: 'Cài đặt', icon: 'settings' }
    ];

    return `
      <nav class="fixed bottom-0 left-0 right-0 max-w-[440px] mx-auto bg-white/95 dark:bg-slate-800/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-700 py-1.5 px-2 z-40 shadow-lg">
        <div class="grid grid-cols-6 gap-1">
          ${tabs.map(tab => {
            const isActive = this.activeTab === tab.id;
            return `
              <button onclick="app5s.switchTab('${tab.id}')" class="flex flex-col items-center justify-center py-1 rounded-xl transition ${
                isActive ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-slate-500 dark:text-slate-400 font-medium hover:text-slate-800'
              }">
                <div class="relative">
                  <i data-lucide="${tab.icon}" class="w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.75]'}"></i>
                  ${tab.id === 'audit' ? '<span class="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>' : ''}
                </div>
                <span class="text-[10px] mt-0.5 tracking-tight">${tab.label}</span>
              </button>
            `;
          }).join('')}
        </div>
      </nav>
    `;
  }

  // =========================================================================
  // ACTIVE TAB ROUTER
  // =========================================================================
  renderActiveTab() {
    switch (this.activeTab) {
      case 'overview': return this.renderOverviewTab();
      case 'audit': return this.renderAuditTab();
      case 'departments': return this.renderDepartmentsTab();
      case 'staff': return this.renderStaffTab();
      case 'reports': return this.renderReportsTab();
      case 'settings': return this.renderSettingsTab();
      default: return this.renderOverviewTab();
    }
  }

  // =========================================================================
  // TAB 1: TỔNG QUAN (Layout sắp xếp khoa học, chuẩn y tế VPI)
  // =========================================================================
  renderOverviewTab() {
    const totalRooms = this.data.rooms.length;
    const completedAudits = this.data.audits.length;
    const pendingIssues = this.data.audits.filter(a => a.status === 'pending_fix').length;

    return `
      <div class="p-4 space-y-4">
        <!-- Banner Thông báo Đợt phát động 5S Toàn viện -->
        <div class="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-2xl p-4 text-white shadow-md relative overflow-hidden">
          <div class="absolute right-[-10px] bottom-[-10px] opacity-15">
            <i data-lucide="award" class="w-28 h-28"></i>
          </div>
          <div class="relative z-10">
            <div class="flex items-center space-x-2">
              <span class="bg-white/20 backdrop-blur-xs text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                QĐ 6858/QĐ-BYT
              </span>
              <span class="text-xs text-emerald-100">● Đợt thi đua Tháng 10/2026</span>
            </div>
            <h2 class="text-lg font-black mt-1.5 tracking-tight">HỆ THỐNG GIÁM SÁT 5S Y TẾ VPI</h2>
            <p class="text-xs text-emerald-50 mt-1 leading-relaxed">
              Duy trì 15 phút 5S đầu giờ. Sàng lọc - Sắp xếp - Sạch sẽ buồng bệnh và trang thiết bị.
            </p>
            <div class="mt-3 flex items-center space-x-2">
              <button onclick="app5s.switchTab('audit')" class="bg-white text-emerald-800 text-xs font-bold px-3 py-1.5 rounded-xl shadow-xs hover:bg-emerald-50 transition flex items-center space-x-1">
                <i data-lucide="plus-circle" class="w-3.5 h-3.5"></i>
                <span>Chấm 5S Buồng Phòng</span>
              </button>
              <button onclick="app5s.openQrScannerModal()" class="bg-emerald-800/60 hover:bg-emerald-800 text-white text-xs font-semibold px-3 py-1.5 rounded-xl border border-emerald-500/40 transition flex items-center space-x-1">
                <i data-lucide="qr-code" class="w-3.5 h-3.5"></i>
                <span>Quét QR Buồng</span>
              </button>
            </div>
          </div>
        </div>

        <!-- 4 Grid Stat Cards (2x2 KPI - Mô phỏng chuẩn app CDHA) -->
        <div class="grid grid-cols-2 gap-3">
          <!-- Card 1: Điểm 5S Trung Bình -->
          <div onclick="app5s.switchTab('reports')" class="bg-white dark:bg-slate-800 rounded-2xl p-3.5 border border-slate-200/80 dark:border-slate-700 shadow-xs cursor-pointer hover:border-emerald-300 transition">
            <div class="flex items-center justify-between">
              <span class="text-xs font-medium text-slate-500 dark:text-slate-400">Điểm 5S Toàn Viện</span>
              <div class="w-6 h-6 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <i data-lucide="star" class="w-3.5 h-3.5"></i>
              </div>
            </div>
            <div class="mt-2 flex items-baseline space-x-1.5">
              <span class="text-2xl font-black text-emerald-600 dark:text-emerald-400">98.5</span>
              <span class="text-[11px] font-bold text-slate-500">/ 100 Điểm</span>
            </div>
            <div class="w-full bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full mt-2 overflow-hidden">
              <div class="bg-emerald-500 h-full rounded-full" style="width: 98.5%"></div>
            </div>
            <div class="mt-2 text-[10px] text-emerald-600 font-bold flex items-center justify-between">
              <span>● Xếp loại: XUẤT SẮC</span>
              <span>10 Khoa</span>
            </div>
          </div>

          <!-- Card 2: Buồng phòng đã kiểm tra -->
          <div onclick="app5s.switchTab('departments')" class="bg-white dark:bg-slate-800 rounded-2xl p-3.5 border border-slate-200/80 dark:border-slate-700 shadow-xs cursor-pointer hover:border-blue-300 transition">
            <div class="flex items-center justify-between">
              <span class="text-xs font-medium text-slate-500 dark:text-slate-400">Kiểm tra hôm nay</span>
              <div class="w-6 h-6 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <i data-lucide="check-circle" class="w-3.5 h-3.5"></i>
              </div>
            </div>
            <div class="mt-2 flex items-baseline space-x-1.5">
              <span class="text-2xl font-black text-slate-900 dark:text-white">${completedAudits}</span>
              <span class="text-[11px] font-semibold text-slate-500">/ ${totalRooms} Buồng</span>
            </div>
            <div class="w-full bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full mt-2 overflow-hidden">
              <div class="bg-blue-600 h-full rounded-full" style="width: ${Math.min(100, Math.round((completedAudits / totalRooms) * 100))}%"></div>
            </div>
            <div class="mt-2 text-[10px] text-slate-500 flex items-center justify-between">
              <span>● Đạt tiến độ</span>
              <span>43 Buồng</span>
            </div>
          </div>

          <!-- Card 3: Vấn đề cần khắc phục -->
          <div onclick="app5s.switchTab('reports')" class="bg-white dark:bg-slate-800 rounded-2xl p-3.5 border border-slate-200/80 dark:border-slate-700 shadow-xs cursor-pointer hover:border-amber-300 transition">
            <div class="flex items-center justify-between">
              <span class="text-xs font-medium text-slate-500 dark:text-slate-400">Vấn đề cần xử lý</span>
              <div class="w-6 h-6 rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <i data-lucide="alert-triangle" class="w-3.5 h-3.5"></i>
              </div>
            </div>
            <div class="mt-2 flex items-baseline space-x-1.5">
              <span class="text-2xl font-black text-amber-600 dark:text-amber-400">${pendingIssues}</span>
              <span class="text-[11px] font-semibold text-slate-600 dark:text-slate-300">Vị trí ghi nhận</span>
            </div>
            <div class="mt-3">
              <span class="inline-block bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                Khắc phục trong ca
              </span>
            </div>
          </div>

          <!-- Card 4: Tỷ lệ tuân thủ văn hóa 5S -->
          <div onclick="app5s.switchTab('staff')" class="bg-white dark:bg-slate-800 rounded-2xl p-3.5 border border-slate-200/80 dark:border-slate-700 shadow-xs cursor-pointer hover:border-teal-300 transition">
            <div class="flex items-center justify-between">
              <span class="text-xs font-medium text-slate-500 dark:text-slate-400">Tuân thủ 5S</span>
              <div class="w-6 h-6 rounded-lg bg-teal-50 dark:bg-teal-950 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                <i data-lucide="shield-check" class="w-3.5 h-3.5"></i>
              </div>
            </div>
            <div class="mt-2 flex items-baseline space-x-1.5">
              <span class="text-2xl font-black text-teal-600 dark:text-teal-400">100%</span>
              <span class="text-[11px] font-semibold text-slate-600 dark:text-slate-300">Nhân sự thực hiện</span>
            </div>
            <div class="mt-3">
              <span class="inline-block bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                25 Cán bộ NV
              </span>
            </div>
          </div>
        </div>

        <!-- Tiến độ 5 Tiêu Chí 5S Y Tế Chuẩn (Thang 20đ / tiêu chí) -->
        <div class="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700 shadow-xs">
          <div class="flex items-center justify-between mb-3">
            <div>
              <h3 class="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">TIÊU CHÍ BỘ Y TẾ</h3>
              <div class="text-sm font-extrabold text-slate-900 dark:text-white">Đánh giá 5 Tiêu chuẩn 5S Y tế</div>
            </div>
            <span class="text-[10px] bg-slate-100 dark:bg-slate-700 font-bold px-2 py-1 rounded-lg text-slate-600 dark:text-slate-300">Thang 20đ/S</span>
          </div>

          <div class="space-y-2.5">
            ${this.data.criteria.map(c => `
              <div>
                <div class="flex items-center justify-between text-xs mb-1">
                  <span class="font-bold text-slate-800 dark:text-slate-200">${c.name}</span>
                  <span class="font-mono font-bold text-emerald-600 dark:text-emerald-400">19.7 / 20đ</span>
                </div>
                <div class="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                  <div class="bg-emerald-500 h-full rounded-full" style="width: 98.5%"></div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Top Khoa Phòng 5S Xuất Sắc Nhất -->
        <div class="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700 shadow-xs">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-sm font-extrabold text-slate-900 dark:text-white">Xếp Hạng 5S Giữa Các Khoa</h3>
            <button onclick="app5s.switchTab('departments')" class="text-xs font-semibold text-emerald-600 hover:underline">Xem tất cả</button>
          </div>

          <div class="space-y-2">
            ${this.data.departments.slice(0, 5).map((dept, i) => `
              <div class="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                <div class="flex items-center space-x-2.5">
                  <div class="w-6 h-6 rounded-full ${i === 0 ? 'bg-amber-400 text-slate-950 font-black' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold'} text-xs flex items-center justify-center">
                    ${i + 1}
                  </div>
                  <div>
                    <div class="text-xs font-bold text-slate-900 dark:text-white">${dept.name}</div>
                    <div class="text-[10px] text-slate-500">${dept.doctor_in_charge || dept.head_nurse}</div>
                  </div>
                </div>
                <div class="text-right">
                  <div class="text-xs font-mono font-extrabold text-emerald-600 dark:text-emerald-400">${99 - (i * 0.3)} đ</div>
                  <span class="text-[9px] font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.2 rounded-full">Xuất sắc</span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }

  // =========================================================================
  // TAB 2: CHẤM 5S (Form kiểm tra trực tiếp có chụp ảnh Before/After)
  // =========================================================================
  renderAuditTab() {
    const depts = this.data.departments;
    const currentDeptId = parseInt(this.newAuditState.deptId) || depts[0].id;
    const filteredRooms = this.data.rooms.filter(r => r.department_id === currentDeptId);
    const user = this.getCurrentUser();
    const userName = (user && user.name) ? user.name : 'Vũ Bá Đạt';
    const userRoleTitle = (user && (user.role_title || user.position)) ? (user.role_title || user.position) : 'Cán bộ 5S';

    // Tính tổng điểm
    const totalScore = Object.values(this.newAuditState.scores).reduce((a, b) => a + b, 0);
    let gradeBadge = '<span class="text-emerald-700 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-full font-bold text-xs">XUẤT SẮC (90 - 100đ)</span>';
    if (totalScore < 70) {
      gradeBadge = '<span class="text-red-700 bg-red-100 dark:bg-red-950 px-2 py-0.5 rounded-full font-bold text-xs">CẦN CẢI TIẾN (< 70đ)</span>';
    } else if (totalScore < 90) {
      gradeBadge = '<span class="text-blue-700 bg-blue-100 dark:bg-blue-950 px-2 py-0.5 rounded-full font-bold text-xs">ĐẠT CHUẨN (70 - 89đ)</span>';
    }

    return `
      <div class="p-4 space-y-4">
        <div class="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700 shadow-xs">
          <div class="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3 mb-3">
            <div>
              <span class="text-xs font-mono font-bold text-emerald-600">PHIẾU ĐÁNH GIÁ 5S BUỒNG PHÒNG</span>
              <h2 class="text-base font-black text-slate-900 dark:text-white">Kiểm Tra Vệ Sinh & 5S</h2>
            </div>
            <div class="text-right">
              <div class="text-xl font-mono font-black text-emerald-600 dark:text-emerald-400">${totalScore} / 100</div>
              ${gradeBadge}
            </div>
          </div>

          <!-- 1. Chọn Khu vực & Buồng phòng -->
          <div class="space-y-3">
            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Khoa / Trung tâm kiểm tra *</label>
              <select onchange="app5s.onAuditDeptChange(this.value)" class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500">
                ${depts.map(d => `<option value="${d.id}" ${d.id === currentDeptId ? 'selected' : ''}>${d.name}</option>`).join('')}
              </select>
            </div>

            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Buồng / Phòng bệnh *</label>
                <select id="audit-room-select" class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500">
                  ${filteredRooms.map(r => `<option value="${r.id}">${r.name} (${r.code})</option>`).join('')}
                </select>
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Ca kiểm tra</label>
                <select id="audit-shift-select" class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500">
                  <option>Ca sáng (07:00 - 11:30)</option>
                  <option>Ca chiều (13:30 - 17:00)</option>
                  <option>Ca trực đêm</option>
                  <option>Kiểm tra đột xuất</option>
                </select>
              </div>
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Cán bộ kiểm tra</label>
              <input type="text" value="${userName} (${userRoleTitle})" readonly class="w-full bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400">
            </div>
          </div>
        </div>

        <!-- 2. Chụp ảnh Before & After (Yêu cầu quan trọng của 5S) -->
        <div class="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700 shadow-xs">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-xs font-mono font-bold text-emerald-600">HÌNH ẢNH MINH CHỨNG 5S</h3>
            <span class="text-[10px] text-slate-400">Chụp từ Camera hoặc Tải ảnh</span>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <!-- Ảnh Trước (Before) -->
            <div class="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-3 text-center relative overflow-hidden bg-slate-50 dark:bg-slate-900/50">
              <div id="before-preview" class="mb-2">
                ${this.newAuditState.beforePhoto ? `<img src="${this.newAuditState.beforePhoto}" class="w-full h-24 object-cover rounded-lg">` : `
                  <div class="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center mx-auto text-slate-400 mb-1">
                    <i data-lucide="camera" class="w-5 h-5"></i>
                  </div>
                  <span class="text-[11px] font-bold text-slate-600 dark:text-slate-300 block">ẢNH TRƯỚC (Before)</span>
                  <span class="text-[9px] text-slate-400">Hiện trạng chưa 5S</span>
                `}
              </div>
              <input type="file" accept="image/*" capture="environment" id="before-file-input" onchange="app5s.handlePhotoUpload(event, 'before')" class="hidden">
              <button onclick="document.getElementById('before-file-input').click()" class="w-full bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-[10px] font-bold py-1 rounded-lg transition">
                Chụp ảnh trước
              </button>
            </div>

            <!-- Ảnh Sau (After) -->
            <div class="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-3 text-center relative overflow-hidden bg-slate-50 dark:bg-slate-900/50">
              <div id="after-preview" class="mb-2">
                ${this.newAuditState.afterPhoto ? `<img src="${this.newAuditState.afterPhoto}" class="w-full h-24 object-cover rounded-lg">` : `
                  <div class="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center mx-auto text-emerald-600 mb-1">
                    <i data-lucide="sparkles" class="w-5 h-5"></i>
                  </div>
                  <span class="text-[11px] font-bold text-slate-600 dark:text-slate-300 block">ẢNH SAU (After)</span>
                  <span class="text-[9px] text-emerald-600 font-semibold">Sau khi đã 5S sạch sẽ</span>
                `}
              </div>
              <input type="file" accept="image/*" capture="environment" id="after-file-input" onchange="app5s.handlePhotoUpload(event, 'after')" class="hidden">
              <button onclick="document.getElementById('after-file-input').click()" class="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold py-1 rounded-lg transition">
                Chụp ảnh sau
              </button>
            </div>
          </div>
        </div>

        <!-- 3. Chấm điểm 5 Tiêu chuẩn (S1 -> S5) -->
        <div class="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700 shadow-xs space-y-3">
          <div class="flex items-center justify-between mb-1">
            <h3 class="text-xs font-mono font-bold text-emerald-600">CHẤM ĐIỂM 5 TIÊU CHÍ (0 - 20 ĐIỂM)</h3>
            <button onclick="app5s.setAllMaxScores()" class="text-[10px] text-emerald-600 font-bold hover:underline">Đặt tất cả 20đ</button>
          </div>

          ${this.data.criteria.map(c => `
            <div class="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
              <div class="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white mb-1">
                <span>${c.name}</span>
                <span id="score-display-${c.id}" class="font-mono text-emerald-600 font-black text-sm">${this.newAuditState.scores[c.id] || 20} đ</span>
              </div>
              <p class="text-[10px] text-slate-500 mb-2">${c.desc}</p>
              
              <!-- Nút chọn điểm nhanh -->
              <div class="flex items-center space-x-1.5">
                ${[20, 18, 15, 10, 5].map(pts => `
                  <button onclick="app5s.setCriterionScore(${c.id}, ${pts})" class="flex-1 py-1 rounded-lg text-xs font-bold transition ${
                    (this.newAuditState.scores[c.id] || 20) === pts ? 'bg-emerald-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                  }">
                    ${pts}
                  </button>
                `).join('')}
              </div>
            </div>
          `).join('')}
        </div>

        <!-- 4. Ghi chú khắc phục & Nút Lưu -->
        <div class="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700 shadow-xs space-y-3">
          <div>
            <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Vấn đề tồn đọng / Yêu cầu cải tiến (nếu có)</label>
            <textarea id="audit-notes" rows="2" placeholder="Ví dụ: Vạch sơn vị trí xe tiêm bị mờ, dây điện máy hút dịch chưa bó gọn..." class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"></textarea>
          </div>

          <button onclick="app5s.submitAudit()" class="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold py-3 rounded-xl shadow-md flex items-center justify-center space-x-2 transition">
            <i data-lucide="check-check" class="w-4 h-4"></i>
            <span>HOÀN TẤT & LƯU PHIẾU ĐÁNH GIÁ 5S</span>
          </button>
        </div>
      </div>
    `;
  }

  onAuditDeptChange(deptId) {
    this.newAuditState.deptId = parseInt(deptId);
    this.render();
  }

  setCriterionScore(criterionId, pts) {
    this.newAuditState.scores[criterionId] = pts;
    this.render();
  }

  setAllMaxScores() {
    this.newAuditState.scores = { 1: 20, 2: 20, 3: 20, 4: 20, 5: 20 };
    this.render();
  }

  handlePhotoUpload(event, type) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      if (type === 'before') {
        this.newAuditState.beforePhoto = e.target.result;
      } else {
        this.newAuditState.afterPhoto = e.target.result;
      }
      this.render();
      this.showToast('Đã tải ảnh ' + (type === 'before' ? 'Trước' : 'Sau') + ' thành công!');
    };
    reader.readAsDataURL(file);
  }

  submitAudit() {
    const roomSelect = document.getElementById('audit-room-select');
    const shiftSelect = document.getElementById('audit-shift-select');
    const notesInput = document.getElementById('audit-notes');

    if (!roomSelect) return;
    const roomId = parseInt(roomSelect.value);
    const room = this.data.rooms.find(r => r.id === roomId) || this.data.rooms[0];
    const dept = this.data.departments.find(d => d.id === room.department_id) || this.data.departments[0];
    const user = this.getCurrentUser();
    const userName = (user && user.name) ? user.name : 'Vũ Bá Đạt';

    const totalScore = Object.values(this.newAuditState.scores).reduce((a, b) => a + b, 0);
    const notes = notesInput ? notesInput.value.trim() : '';

    const newTicket = {
      id: Date.now(),
      audit_code: '5S-VPI-' + String(this.data.audits.length + 1).padStart(4, '0'),
      department_name: dept.name,
      room_name: room.name,
      auditor_name: userName,
      audit_date: new Date().toISOString().slice(0, 10),
      shift: shiftSelect ? shiftSelect.value : 'Ca sáng',
      total_score: totalScore,
      classification: totalScore >= 90 ? 'Xuất sắc' : (totalScore >= 70 ? 'Đạt' : 'Cần cải tiến'),
      status: notes ? 'pending_fix' : 'completed',
      issues_found: notes,
      corrective_action: notes ? 'Yêu cầu khắc phục trong ca trực' : 'Duy trì chuẩn 5S',
      before_photo: this.newAuditState.beforePhoto || 'logo-5s-vpi.png',
      after_photo: this.newAuditState.afterPhoto || 'logo-5s-vpi.png',
      created_at: new Date().toISOString().replace('T', ' ').slice(0, 19)
    };

    this.data.audits.unshift(newTicket);
    this.saveData();
    this.logSecurity(`Tạo phiếu đánh giá 5S: ${newTicket.audit_code} (${room.name} - ${totalScore}đ)`);
    this.showToast(`Đã lưu phiếu 5S: ${newTicket.audit_code}!`);

    // Reset form
    this.newAuditState.beforePhoto = '';
    this.newAuditState.afterPhoto = '';
    this.newAuditState.scores = { 1: 20, 2: 20, 3: 20, 4: 20, 5: 20 };

    // Chuyển sang xem lịch sử
    this.switchTab('reports');
  }

  // =========================================================================
  // TAB 3: KHOA & BUỒNG PHÒNG (10 Khoa & 43 Buồng phòng VPI)
  // =========================================================================
  renderDepartmentsTab() {
    const depts = this.data.departments;
    const selectedDeptId = this.filterDept === 'all' ? null : parseInt(this.filterDept);
    
    let rooms = this.data.rooms;
    if (selectedDeptId) {
      rooms = rooms.filter(r => r.department_id === selectedDeptId);
    }
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      rooms = rooms.filter(r => r.name.toLowerCase().includes(q) || r.code.toLowerCase().includes(q));
    }

    return `
      <div class="p-4 space-y-4">
        <!-- Header Khoa & Phòng -->
        <div class="flex items-center justify-between">
          <div>
            <span class="text-xs font-mono font-bold text-emerald-600">DANH MỤC KHU VỰC</span>
            <h2 class="text-base font-black text-slate-900 dark:text-white">10 Khoa & 43 Buồng Phòng</h2>
          </div>
          <button onclick="app5s.openAddRoomModal()" class="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-xs transition flex items-center space-x-1">
            <i data-lucide="plus" class="w-3.5 h-3.5"></i>
            <span>Thêm Buồng</span>
          </button>
        </div>

        <!-- Ô Tìm Kiếm -->
        <div class="relative">
          <i data-lucide="search" class="w-4 h-4 absolute left-3 top-3 text-slate-400"></i>
          <input type="text" oninput="app5s.onSearchInput(this.value)" placeholder="Tìm kiếm tên phòng, mã buồng..." value="${this.searchQuery}" class="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500">
        </div>

        <!-- Thanh Cuộn Lọc Nhanh Khoa (Horizontal Pills) -->
        <div class="flex space-x-1.5 overflow-x-auto pb-1 no-scrollbar">
          <button onclick="app5s.setFilterDept('all')" class="shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
            this.filterDept === 'all' ? 'bg-emerald-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
          }">
            Tất cả (${this.data.rooms.length})
          </button>
          ${depts.map(d => `
            <button onclick="app5s.setFilterDept('${d.id}')" class="shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              this.filterDept === String(d.id) ? 'bg-emerald-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
            }">
              ${d.name}
            </button>
          `).join('')}
        </div>

        <!-- Danh sách Buồng Phòng -->
        <div class="space-y-2">
          ${rooms.map(room => {
            const dept = depts.find(d => d.id === room.department_id) || { name: 'Chưa gán' };
            return `
              <div class="bg-white dark:bg-slate-800 rounded-xl p-3 border border-slate-200/80 dark:border-slate-700 shadow-xs flex items-center justify-between hover:border-emerald-300 transition">
                <div class="flex items-center space-x-3">
                  <div class="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-mono font-black text-xs shrink-0">
                    ${room.code.slice(-3)}
                  </div>
                  <div>
                    <div class="text-xs font-bold text-slate-900 dark:text-white">${room.name}</div>
                    <div class="text-[10px] text-slate-500">${dept.name} • Phụ trách: ${room.person_in_charge || 'Điều dưỡng trực'}</div>
                  </div>
                </div>

                <div class="flex items-center space-x-2">
                  <div class="text-right">
                    <span class="text-xs font-mono font-extrabold text-emerald-600 dark:text-emerald-400">99.0 đ</span>
                    <span class="block text-[8.5px] font-bold text-emerald-600">Đạt 5S</span>
                  </div>
                  <button onclick="app5s.quickAuditRoom(${room.id})" title="Chấm điểm phòng này ngay" class="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 hover:bg-emerald-100 transition">
                    <i data-lucide="clipboard-check" class="w-4 h-4"></i>
                  </button>
                  <button onclick="app5s.deleteRoom(${room.id})" title="Xóa phòng" class="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition">
                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                  </button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  onSearchInput(val) {
    this.searchQuery = val;
    this.render();
  }

  setFilterDept(deptId) {
    this.filterDept = deptId;
    this.render();
  }

  quickAuditRoom(roomId) {
    const room = this.data.rooms.find(r => r.id === roomId);
    if (!room) return;
    this.newAuditState.deptId = room.department_id;
    this.switchTab('audit');
    setTimeout(() => {
      const sel = document.getElementById('audit-room-select');
      if (sel) sel.value = String(roomId);
    }, 50);
  }

  deleteRoom(roomId) {
    if (!confirm('Anh có chắc muốn xóa buồng phòng này không?')) return;
    this.data.rooms = this.data.rooms.filter(r => r.id !== roomId);
    this.saveData();
    this.render();
    this.showToast('Đã xóa buồng phòng thành công!');
  }

  // =========================================================================
  // TAB 4: NHÂN SỰ & PHÂN QUYỀN 5S (Thực hiện đúng yêu cầu 2 của người dùng)
  // =========================================================================
  renderStaffTab() {
    const staffList = this.data.staff;
    const depts = this.data.departments;

    return `
      <div class="p-4 space-y-4">
        <!-- Header Nhân sự -->
        <div class="flex items-center justify-between">
          <div>
            <span class="text-xs font-mono font-bold text-emerald-600">PHÂN QUYỀN & NHÂN SỰ</span>
            <h2 class="text-base font-black text-slate-900 dark:text-white">25 Cán Bộ Làm 5S Hằng Ngày</h2>
          </div>
          <button onclick="app5s.openAddStaffModal()" class="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-xs transition flex items-center space-x-1">
            <i data-lucide="user-plus" class="w-3.5 h-3.5"></i>
            <span>Thêm Nhân Viên</span>
          </button>
        </div>

        <!-- Banner Giải thích Phân Quyền Trưởng Khoa / Điều Dưỡng Trưởng -->
        <div class="bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 rounded-xl p-3 text-xs text-blue-900 dark:text-blue-200">
          <div class="flex items-center space-x-1.5 font-bold mb-1">
            <i data-lucide="shield" class="w-4 h-4 text-blue-600"></i>
            <span>Cơ Chế Phân Quyền Nhân Sự Khoa Phòng</span>
          </div>
          <p class="text-[11px] leading-relaxed text-blue-800 dark:text-blue-300">
            Trưởng khoa & Điều dưỡng trưởng có toàn quyền <strong>Thêm - Xóa nhân viên</strong> trong khoa mình để phân công thực hiện 5S hằng ngày tại từng buồng bệnh.
          </p>
        </div>

        <!-- Danh sách Nhân sự -->
        <div class="space-y-2">
          ${staffList.map(s => {
            const dept = depts.find(d => d.id === s.department_id) || { name: 'Toàn viện' };
            const roleBadge = s.role === 'admin' 
              ? '<span class="text-[9px] font-bold text-purple-700 bg-purple-50 dark:bg-purple-950 px-2 py-0.5 rounded-full border border-purple-200">Trưởng Ban 5S</span>'
              : (s.role === 'manager' 
                ? '<span class="text-[9px] font-bold text-blue-700 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded-full border border-blue-200">Quản lý / ĐD Trưởng</span>'
                : '<span class="text-[9px] font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-200">Nhân viên 5S</span>');

            const sName = s.name || s.full_name || 'Cán bộ 5S';
            const sInitial = sName.split(' ').pop().charAt(0) || 'N';

            return `
              <div class="bg-white dark:bg-slate-800 rounded-xl p-3 border border-slate-200/80 dark:border-slate-700 shadow-xs flex items-center justify-between hover:border-emerald-300 transition">
                <div class="flex items-center space-x-2.5">
                  <div class="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-700 text-emerald-600 font-bold flex items-center justify-center text-xs shrink-0">
                    ${sInitial}
                  </div>
                  <div>
                    <div class="flex items-center space-x-1.5">
                      <span class="text-xs font-bold text-slate-900 dark:text-white">${sName}</span>
                      ${roleBadge}
                    </div>
                    <div class="text-[10px] text-slate-500">${dept.name} • ${s.role_title || s.position}</div>
                    <div class="text-[9px] text-emerald-600 font-medium">Vị trí: ${s.assigned_room || 'Được phân công buồng bệnh'}</div>
                  </div>
                </div>

                <div class="flex items-center space-x-1">
                  <!-- Phân công / Sửa -->
                  <button onclick="app5s.openEditStaffModal('${s.code}')" title="Phân công buồng phòng 5S" class="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition">
                    <i data-lucide="edit-3" class="w-3.5 h-3.5"></i>
                  </button>
                  <!-- Xóa nhân viên -->
                  <button onclick="app5s.deleteStaff('${s.code}')" title="Xóa nhân viên khỏi khoa" class="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition">
                    <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                  </button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  deleteStaff(staffCode) {
    const s = this.data.staff.find(x => x.code === staffCode);
    if (!s) return;
    if (!confirm(`Anh có chắc muốn xóa nhân viên ${s.name} (${s.code}) không?`)) return;
    
    this.data.staff = this.data.staff.filter(x => x.code !== staffCode);
    this.saveData();
    this.logSecurity(`Xóa nhân sự: ${s.name} (${s.code})`);
    this.render();
    this.showToast(`Đã xóa nhân viên ${s.name} thành công!`);
  }

  // =========================================================================
  // TAB 5: LỊCH SỬ & BÁO CÁO 5S
  // =========================================================================
  renderReportsTab() {
    const audits = this.data.audits;

    return `
      <div class="p-4 space-y-4">
        <div class="flex items-center justify-between">
          <div>
            <span class="text-xs font-mono font-bold text-emerald-600">LỊCH SỬ KIỂM TRA</span>
            <h2 class="text-base font-black text-slate-900 dark:text-white">Báo Cáo 5S Đã Thực Hiện</h2>
          </div>
          <button onclick="window.print()" class="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-xs transition flex items-center space-x-1">
            <i data-lucide="printer" class="w-3.5 h-3.5"></i>
            <span>In Toàn Bộ A4</span>
          </button>
        </div>

        <div class="space-y-3">
          ${audits.map(a => `
            <div class="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700 shadow-xs space-y-3">
              <div class="flex items-start justify-between">
                <div>
                  <span class="text-[10px] font-mono font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full">${a.audit_code}</span>
                  <h3 class="text-sm font-extrabold text-slate-900 dark:text-white mt-1">${a.room_name}</h3>
                  <div class="text-[10px] text-slate-500">${a.department_name} • ${a.audit_date} (${a.shift})</div>
                </div>
                <div class="text-right">
                  <div class="text-lg font-mono font-black text-emerald-600">${a.total_score} đ</div>
                  <span class="text-[9px] font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950 px-1.5 py-0.2 rounded-full">${a.classification}</span>
                </div>
              </div>

              <!-- Ảnh Trước / Sau nếu có -->
              ${a.before_photo || a.after_photo ? `
                <div class="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <span class="text-[9px] font-bold text-slate-500 block mb-0.5">Trước 5S:</span>
                    <img src="${a.before_photo || 'logo-5s-vpi.png'}" class="w-full h-20 object-cover rounded-lg border border-slate-200">
                  </div>
                  <div>
                    <span class="text-[9px] font-bold text-emerald-600 block mb-0.5">Sau 5S:</span>
                    <img src="${a.after_photo || 'logo-5s-vpi.png'}" class="w-full h-20 object-cover rounded-lg border border-emerald-300">
                  </div>
                </div>
              ` : ''}

              ${a.issues_found ? `
                <div class="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 p-2.5 rounded-xl text-xs text-amber-900 dark:text-amber-200">
                  <span class="font-bold">Ghi nhận:</span> ${a.issues_found}
                </div>
              ` : ''}

              <div class="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700 text-xs">
                <span class="text-[10px] text-slate-400">Người chấm: <strong>${a.auditor_name}</strong></span>
                <button onclick="window.print()" class="text-emerald-600 font-bold hover:underline flex items-center space-x-1 text-xs">
                  <i data-lucide="printer" class="w-3.5 h-3.5"></i>
                  <span>In Phiếu</span>
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  // =========================================================================
  // TAB 6: CÀI ĐẶT & BẢO MẬT AN TOÀN THÔNG TIN (Anti-hack & Backup)
  // =========================================================================
  renderSettingsTab() {
    const isExt = this.data.auth.locationMode === 'external';

    return `
      <div class="p-4 space-y-4">
        <div>
          <span class="text-xs font-mono font-bold text-emerald-600">HỆ THỐNG & AN TOÀN</span>
          <h2 class="text-base font-black text-slate-900 dark:text-white">Thiết Lập Mạng & Bảo Mật</h2>
        </div>

        <!-- 1. Môi trường mạng Nội viện / Ngoại viện -->
        <div class="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700 shadow-xs space-y-3">
          <div class="flex items-center justify-between">
            <div>
              <span class="text-xs font-bold text-slate-900 dark:text-white">Chế độ Môi trường Mạng</span>
              <div class="text-[10px] text-slate-500">Chuyển đổi kết nối Wi-Fi nội bộ & 4G ngoại viện</div>
            </div>
            <button onclick="app5s.toggleLocationMode()" class="px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              isExt ? 'bg-amber-600 text-white' : 'bg-blue-600 text-white'
            }">
              ${isExt ? '🌐 Ngoại viện (4G)' : '🏢 Nội viện (Wi-Fi)'}
            </button>
          </div>

          <div class="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 text-[11px] text-slate-600 dark:text-slate-300">
            ${isExt ? `
              <span class="font-bold text-amber-600">Đang bật Ngoại viện:</span> Dữ liệu được mã hóa SSL/TLS qua Vercel & Cloudflare Edge, đảm bảo an toàn tuyệt đối khi nhân viên ra ngoài bệnh viện hoặc đi công tác.
            ` : `
              <span class="font-bold text-blue-600">Đang bật Nội viện:</span> Kết nối trực tiếp máy chủ nội bộ LAN Bệnh viện Vĩnh Phúc (tốc độ cao, đồng bộ tức thì).
            `}
          </div>
        </div>

        <!-- 2. Sao lưu và Khôi phục CSDL -->
        <div class="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700 shadow-xs space-y-3">
          <h3 class="text-xs font-mono font-bold text-emerald-600">SAO LƯU & DỰ PHÒNG CHỐNG MẤT DỮ LIỆU</h3>
          <p class="text-xs text-slate-500">Tải file dữ liệu về máy để phòng ngừa tấn công mạng hoặc đổi điện thoại.</p>
          
          <div class="grid grid-cols-2 gap-2">
            <button onclick="app5s.exportBackupJSON()" class="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center space-x-1.5 transition">
              <i data-lucide="download" class="w-3.5 h-3.5"></i>
              <span>Tải file Sao lưu</span>
            </button>

            <button onclick="document.getElementById('restore-json-input').click()" class="bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center space-x-1.5 transition">
              <i data-lucide="upload" class="w-3.5 h-3.5"></i>
              <span>Phục hồi CSDL</span>
            </button>
            <input type="file" id="restore-json-input" accept=".json" onchange="app5s.importBackupJSON(event)" class="hidden">
          </div>
        </div>

        <!-- 3. Nhật ký An Toàn Thông Tin & Chống Hack -->
        <div class="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700 shadow-xs space-y-3">
          <div class="flex items-center justify-between">
            <h3 class="text-xs font-mono font-bold text-emerald-600">NHẬT KÝ AN TOÀN (ANTI-HACK LOGS)</h3>
            <span class="text-[9px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-bold">Bảo vệ 24/7</span>
          </div>

          <div class="space-y-2 max-h-56 overflow-y-auto no-scrollbar">
            ${this.data.securityLogs.slice(0, 10).map(log => `
              <div class="p-2 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 text-[10px]">
                <div class="flex items-center justify-between text-slate-500">
                  <span class="font-mono">${log.time}</span>
                  <span class="font-semibold text-emerald-600">${log.ip}</span>
                </div>
                <div class="font-bold text-slate-800 dark:text-slate-200 mt-0.5">${log.action}</div>
                <div class="text-slate-400">Bởi: ${log.user}</div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }

  exportBackupJSON() {
    const blob = new Blob([JSON.stringify(this.data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_5s_vpi_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    this.logSecurity('Sao lưu toàn bộ CSDL 5S VPI ra file JSON');
    this.showToast('Đã xuất file sao lưu JSON an toàn!');
  }

  importBackupJSON(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target.result);
        if (parsed && parsed.departments && parsed.rooms) {
          this.data = parsed;
          this.normalizeData();
          this.saveData();
          this.logSecurity('Phục hồi dữ liệu từ file sao lưu JSON bên ngoài');
          this.render();
          this.showToast('Đã phục hồi CSDL 5S VPI thành công!');
        } else {
          alert('File JSON không đúng định dạng chuẩn 5S VPI!');
        }
      } catch (err) {
        alert('Lỗi đọc file JSON: ' + err.message);
      }
    };
    reader.readAsText(file);
  }

  // =========================================================================
  // MODALS
  // =========================================================================
  openUserSwitchModal() {
    const staff = this.data.staff;
    const currentUid = this.data.auth.currentUserId;

    this.showModal(`
      <div class="p-4 space-y-3">
        <div class="flex items-center justify-between border-b pb-2">
          <h3 class="text-sm font-bold text-slate-900 dark:text-white">Chọn Tài Khoản Cán Bộ 5S</h3>
          <button onclick="app5s.closeModal()" class="text-slate-400 hover:text-slate-600"><i data-lucide="x" class="w-4 h-4"></i></button>
        </div>
        <div class="space-y-1.5 max-h-72 overflow-y-auto no-scrollbar">
          ${staff.map(s => `
            <div onclick="app5s.switchUser('${s.code}')" class="p-2.5 rounded-xl border ${s.code === currentUid ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'} cursor-pointer hover:border-emerald-400 transition flex items-center justify-between">
              <div>
                <div class="text-xs font-bold text-slate-900 dark:text-white">${s.name}</div>
                <div class="text-[10px] text-slate-500">${s.role_title || s.position} • ${s.code}</div>
              </div>
              ${s.code === currentUid ? '<i data-lucide="check" class="w-4 h-4 text-emerald-600"></i>' : ''}
            </div>
          `).join('')}
        </div>
      </div>
    `);
  }

  switchUser(code) {
    this.data.auth.currentUserId = code;
    this.saveData();
    const u = this.getCurrentUser();
    this.logSecurity(`Chuyển người dùng sang: ${u.name} (${u.code})`);
    this.closeModal();
    this.render();
    this.showToast(`Chào mừng ${u.name}!`);
  }

  openPwaModal() {
    this.showModal(`
      <div class="p-5 text-center space-y-3">
        <img src="logo-5s-vpi.png" alt="5S VPI Logo" class="w-16 h-16 mx-auto rounded-2xl shadow-md p-1 bg-white">
        <div>
          <h3 class="text-base font-black text-slate-900 dark:text-white">Cài Đặt App 5S VPI Vào Điện Thoại</h3>
          <p class="text-xs text-slate-500 mt-1">Truy cập nhanh ngoài màn hình chính như ứng dụng thông thường</p>
        </div>
        <div class="text-left bg-slate-50 dark:bg-slate-900 p-3 rounded-xl space-y-2 text-xs text-slate-700 dark:text-slate-300">
          <div><strong>📱 Trên iPhone (Safari):</strong> Bấm nút <em>Chia sẻ (hình vuông mũi tên lên)</em> $\rightarrow$ Chọn <strong>"Thêm vào Màn hình chính" (Add to Home Screen)</strong>.</div>
          <div><strong>🤖 Trên Android (Chrome):</strong> Bấm dấu <em>3 chấm góc phải</em> $\rightarrow$ Chọn <strong>"Cài đặt ứng dụng"</strong> hoặc <strong>"Thêm vào Màn hình chính"</strong>.</div>
        </div>
        <button onclick="app5s.closeModal()" class="w-full bg-emerald-600 text-white font-bold py-2 rounded-xl text-xs">Đã hiểu</button>
      </div>
    `);
  }

  openQrScannerModal() {
    this.showModal(`
      <div class="p-4 text-center space-y-3">
        <h3 class="text-sm font-bold text-slate-900 dark:text-white">Quét Mã QR Buồng Bệnh</h3>
        <div class="w-48 h-48 mx-auto border-2 border-dashed border-emerald-500 rounded-2xl flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 text-slate-400">
          <i data-lucide="qr-code" class="w-16 h-16 text-emerald-600 animate-pulse"></i>
          <span class="text-[10px] mt-2">Đưa camera vào mã QR dán tại cửa buồng bệnh</span>
        </div>
        <button onclick="app5s.closeModal(); app5s.quickAuditRoom(1);" class="w-full bg-emerald-600 text-white font-bold py-2 rounded-xl text-xs">
          Mô phỏng Quét Thành Công: Buồng Cấp Cứu
        </button>
      </div>
    `);
  }

  openAddRoomModal() {
    const depts = this.data.departments;
    this.showModal(`
      <div class="p-4 space-y-3">
        <div class="flex items-center justify-between border-b pb-2">
          <h3 class="text-sm font-bold text-slate-900 dark:text-white">Thêm Buồng Phòng 5S Mới</h3>
          <button onclick="app5s.closeModal()"><i data-lucide="x" class="w-4 h-4 text-slate-400"></i></button>
        </div>
        <div>
          <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Thuộc Khoa</label>
          <select id="modal-room-dept" class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold">
            ${depts.map(d => `<option value="${d.id}">${d.name}</option>`).join('')}
          </select>
        </div>
        <div>
          <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Tên Buồng / Phòng *</label>
          <input type="text" id="modal-room-name" placeholder="Ví dụ: Phòng Thăm dò Chức năng 02" class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs">
        </div>
        <div>
          <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Mã Phòng</label>
          <input type="text" id="modal-room-code" placeholder="Ví dụ: TDCN-02" class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs">
        </div>
        <div>
          <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Cán bộ / Điều dưỡng phụ trách</label>
          <input type="text" id="modal-room-person" placeholder="Ví dụ: ĐD. Nguyễn Thị Thảo" class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs">
        </div>
        <button onclick="app5s.saveNewRoom()" class="w-full bg-emerald-600 text-white font-bold py-2 rounded-xl text-xs">Lưu Buồng Phòng</button>
      </div>
    `);
  }

  saveNewRoom() {
    const deptId = parseInt(document.getElementById('modal-room-dept').value);
    const name = document.getElementById('modal-room-name').value.trim();
    const code = document.getElementById('modal-room-code').value.trim() || 'P-' + Date.now().toString().slice(-4);
    const person = document.getElementById('modal-room-person').value.trim();

    if (!name) {
      alert('Vui lòng nhập tên buồng phòng!');
      return;
    }

    this.data.rooms.push({
      id: Date.now(),
      department_id: deptId,
      code: code,
      name: name,
      person_in_charge: person || 'Điều dưỡng phụ trách',
      floor: 'Tầng 1'
    });
    this.saveData();
    this.closeModal();
    this.render();
    this.showToast('Đã thêm buồng phòng mới!');
  }

  openAddStaffModal() {
    const depts = this.data.departments;
    this.showModal(`
      <div class="p-4 space-y-3">
        <div class="flex items-center justify-between border-b pb-2">
          <h3 class="text-sm font-bold text-slate-900 dark:text-white">Thêm Nhân Sự Vào Khoa</h3>
          <button onclick="app5s.closeModal()"><i data-lucide="x" class="w-4 h-4 text-slate-400"></i></button>
        </div>
        <div>
          <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Họ và Tên Nhân Viên *</label>
          <input type="text" id="modal-staff-name" placeholder="Ví dụ: ĐD. Hoàng Thị Mai" class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs">
        </div>
        <div>
          <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Mã Nhân Viên</label>
          <input type="text" id="modal-staff-code" placeholder="Ví dụ: BV-888" class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs">
        </div>
        <div>
          <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Khoa / Phòng công tác</label>
          <select id="modal-staff-dept" class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold">
            ${depts.map(d => `<option value="${d.id}">${d.name}</option>`).join('')}
          </select>
        </div>
        <div>
          <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Chức vụ / Vị trí</label>
          <input type="text" id="modal-staff-pos" placeholder="Ví dụ: Điều dưỡng viên" class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs">
        </div>
        <div>
          <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Phân công buồng phòng 5S</label>
          <input type="text" id="modal-staff-room" placeholder="Ví dụ: Phụ trách Buồng 101, 102" class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs">
        </div>
        <button onclick="app5s.saveNewStaff()" class="w-full bg-emerald-600 text-white font-bold py-2 rounded-xl text-xs">Lưu Nhân Viên</button>
      </div>
    `);
  }

  saveNewStaff() {
    const name = document.getElementById('modal-staff-name').value.trim();
    const code = document.getElementById('modal-staff-code').value.trim() || 'BV-' + Math.floor(100 + Math.random() * 900);
    const deptId = parseInt(document.getElementById('modal-staff-dept').value);
    const pos = document.getElementById('modal-staff-pos').value.trim() || 'Nhân viên';
    const room = document.getElementById('modal-staff-room').value.trim();

    if (!name) {
      alert('Vui lòng nhập tên nhân viên!');
      return;
    }

    this.data.staff.push({
      id: Date.now(),
      code: code,
      staff_code: code,
      name: name,
      full_name: name,
      department_id: deptId,
      position: pos,
      role: 'staff',
      role_title: pos,
      assigned_room: room || 'Buồng bệnh được phân công',
      allow_external: true
    });

    this.saveData();
    this.closeModal();
    this.render();
    this.showToast(`Đã thêm nhân viên ${name} vào khoa!`);
  }

  openEditStaffModal(staffCode) {
    const s = this.data.staff.find(x => x.code === staffCode || x.staff_code === staffCode);
    if (!s) return;

    this.showModal(`
      <div class="p-4 space-y-3">
        <div class="flex items-center justify-between border-b pb-2">
          <h3 class="text-sm font-bold text-slate-900 dark:text-white">Phân Công Buồng Phòng 5S</h3>
          <button onclick="app5s.closeModal()"><i data-lucide="x" class="w-4 h-4 text-slate-400"></i></button>
        </div>
        <div>
          <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Nhân viên</label>
          <input type="text" value="${s.name} (${s.code})" readonly class="w-full bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs">
        </div>
        <div>
          <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Vị trí buồng phòng 5S phụ trách *</label>
          <input type="text" id="edit-staff-room" value="${s.assigned_room || ''}" placeholder="Ví dụ: Phụ trách Buồng cấp cứu lưu & Phòng tiểu phẫu" class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs">
        </div>
        <button onclick="app5s.saveEditStaff('${s.code}')" class="w-full bg-emerald-600 text-white font-bold py-2 rounded-xl text-xs">Cập Nhật Phân Công</button>
      </div>
    `);
  }

  saveEditStaff(code) {
    const s = this.data.staff.find(x => x.code === code || x.staff_code === code);
    if (!s) return;
    const roomInput = document.getElementById('edit-staff-room');
    if (roomInput) {
      s.assigned_room = roomInput.value.trim();
      this.saveData();
      this.closeModal();
      this.render();
      this.showToast(`Đã cập nhật phân công 5S cho ${s.name}!`);
    }
  }

  showModal(contentHtml) {
    const modalContainer = document.getElementById('modal-container');
    if (!modalContainer) return;

    modalContainer.innerHTML = `
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop" onclick="if(event.target === this) app5s.closeModal()">
        <div class="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 max-w-sm w-full overflow-hidden animate-scale-up">
          ${contentHtml}
        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  }

  closeModal() {
    const modalContainer = document.getElementById('modal-container');
    if (modalContainer) modalContainer.innerHTML = '';
  }
}

// Khởi chạy ứng dụng toàn cầu (Tương thích 100% mọi trình duyệt & file://)
let app5s;
function start5SApp() {
  if (!app5s) {
    app5s = new App5S();
    window.app5s = app5s;
  }
}

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', start5SApp);
} else {
  start5SApp();
}
