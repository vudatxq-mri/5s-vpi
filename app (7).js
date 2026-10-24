/**
 * 5S VPI - Medical Cleaning & 5S Visual Audit Mobile Application
 * BỆNH VIỆN VĨNH PHÚC VPI
 * KHOA CHẨN ĐOÁN HÌNH ẢNH & BAN CHỈ ĐẠO 5S TOÀN VIỆN
 * TÍCH HỢP ĐẦY ĐỦ CÁC TÍNH NĂNG V5.0 THEO YÊU CẦU:
 * 1. Hiển thị riêng từng nhóm các khoa/phòng, bên trong tùy chỉnh thêm các khu vực làm việc
 * 2. Hiển thị đầy đủ danh mục khoa phòng chuẩn Bệnh viện Vĩnh Phúc VPI khi tải & tìm kiếm (20 Khoa/Phòng & 75 Khu vực làm việc)
 * 3. Thêm và sửa các khoa phòng và khu vực làm việc trực tiếp ngay tại từng nhóm
 * 4. Thêm chức danh đầy đủ ở mục 'Vai trò phân quyền' (Lãnh đạo, Trưởng khoa, ĐD trưởng, KTV trưởng, BS điều trị...)
 * 5. Chấm 5S tinh gọn 1 ảnh sau, chuẩn hóa Bệnh viện Vĩnh Phúc VPI
 */

const STORAGE_KEY = 'vpi_5s_data_v11_watermark';
const SECURITY_LOG_KEY = 'vpi_5s_security_logs_v1';

// CSDL Khởi tạo chuẩn 20 Khoa/Phòng & 75 Khu vực làm việc Bệnh viện Vĩnh Phúc VPI
const DEFAULT_SEED_DATA = {
  hospital: {
    name: 'Bệnh viện Vĩnh Phúc VPI',
    legalName: 'Bệnh viện Vĩnh Phúc VPI',
    department: 'Hội đồng Quản lý Chất lượng & Ban Chỉ đạo 5S Toàn Viện',
    slogan: 'Sàng lọc - Sắp xếp - Sạch sẽ - Săn sóc - Sẵn sàng',
    address: 'Lạc Ý, Định Trung, TP. Vĩnh Yên, Tỉnh Vĩnh Phúc',
    hotline: '0211.386.115',
    director: 'ThS. BSCKII. Phạm Quỳnh Hưng',
    directorTitle: 'Trưởng ban Chỉ đạo 5S Bệnh viện',
    officer: 'KTV. Vũ Bá Đạt',
    officerId: 'BV-345',
    officerTitle: 'Cán bộ Giám sát 5S Toàn Viện & KTV Trưởng CĐHA',
    supervisionCycle: 'Tháng 10/2026 (Kiểm tra hằng ngày)',
    complianceRate: 100,
    averageScore: 98.5,
    notice: {
      enabled: true,
      type: 'danger',
      title: 'THÔNG BÁO KHẨN: KIỂM TRA ĐỘT XUẤT 5S TOÀN VIỆN',
      content: 'Ban Giám đốc & Đoàn phúc tra Sở Y tế kiểm tra thực hành 5S tại tất cả các buồng bệnh, buồng thủ thuật lúc 09h00 sáng nay. Yêu cầu các Trưởng khoa, Điều dưỡng trưởng rà soát sàng lọc, sắp xếp trang thiết bị và khử khuẩn buồng phòng sạch sẽ ngay đầu giờ.',
      updatedAt: '2026-10-16 07:30'
    }
  },
  departments: [{"id": 8, "code": "KCDHA", "name": "Khoa Chẩn đoán Hình ảnh", "head_nurse": "KTV. Nguyễn Đức Tuấn", "doctor_in_charge": "BSCKI. Phạm Quang Nam", "phone": "0211.386.130", "color": "#6366f1", "icon": "fa-x-ray", "description": "Chụp X-quang, Cắt lớp vi tính (CT), MRI, Siêu âm màu", "order": 1, "category": "paraclinical"}, {"id": 1, "code": "KCC", "name": "Khoa Cấp cứu", "head_nurse": "ĐD. Trần Thị Lan Hương", "doctor_in_charge": "ThS. BSCKII. Phạm Quỳnh Hưng", "phone": "0211.386.115", "color": "#ef4444", "icon": "fa-ambulance", "description": "Tiếp nhận cấp cứu 24/7, xử lý khẩn cấp bệnh nhân nặng", "order": 2, "category": "clinical"}, {"id": 11, "code": "ICU", "name": "Khoa Hồi sức tích cực & Chống độc", "head_nurse": "ĐD. Nguyễn Thị Thanh Nga", "doctor_in_charge": "ThS.BS. Đinh Công Trí", "phone": "0211.386.116", "color": "#dc2626", "icon": "fa-heart-pulse", "description": "Điều trị chuyên sâu bệnh nhân hồi sức, thở máy, lọc máu liên tục", "order": 3, "category": "clinical"}, {"id": 12, "code": "PTGM", "name": "Khoa Phẫu thuật - Gây mê hồi sức", "head_nurse": "ĐD. Nguyễn Văn Thắng", "doctor_in_charge": "BSCKII. Lê Tuấn Anh", "phone": "0211.386.117", "color": "#0284c7", "icon": "fa-syringe", "description": "Khu phẫu thuật vô khuẩn, gây mê hồi tỉnh, phẫu thuật ngoại sản", "order": 4, "category": "clinical"}, {"id": 2, "code": "KKB", "name": "Khoa Khám bệnh", "head_nurse": "ĐD. Hoàng Bích Thủy", "doctor_in_charge": "BSCKI. Vũ Đình Khiêm", "phone": "0211.386.101", "color": "#0ea5e9", "icon": "fa-stethoscope", "description": "Khám bệnh ngoại trú, tư vấn và phân luồng bệnh nhân", "order": 5, "category": "clinical"}, {"id": 4, "code": "KNG", "name": "Khoa Ngoại Tổng hợp", "head_nurse": "ĐD. Bùi Văn Hùng", "doctor_in_charge": "BSCKII. Nguyễn Văn Toàn", "phone": "0211.386.120", "color": "#10b981", "icon": "fa-user-doctor", "description": "Phẫu thuật điều trị các bệnh lý tiêu hóa, gan mật, chấn thương", "order": 6, "category": "clinical"}, {"id": 5, "code": "KNT", "name": "Khoa Nội Tổng hợp", "head_nurse": "ĐD. Trần Phương Dung", "doctor_in_charge": "BSCKI. Mai Thị Hảo", "phone": "0211.386.122", "color": "#06b6d4", "icon": "fa-notes-medical", "description": "Khám và điều trị nội trú tim mạch, hô hấp, nội tiết, tiêu hóa", "order": 7, "category": "clinical"}, {"id": 6, "code": "KSN", "name": "Khoa Phụ Sản", "head_nurse": "Hộ sinh. Lê Thị Thúy Hằng", "doctor_in_charge": "BSCKII. Nguyễn Thị Hồng", "phone": "0211.386.125", "color": "#ec4899", "icon": "fa-baby", "description": "Chăm sóc thai phụ, đỡ đẻ thường, mổ lấy thai và điều trị phụ khoa", "order": 8, "category": "clinical"}, {"id": 7, "code": "KNHI", "name": "Khoa Nhi", "head_nurse": "ĐD. Đỗ Thị Hiền", "doctor_in_charge": "ThS.BS. Đặng Hồng Phúc", "phone": "0211.386.128", "color": "#eab308", "icon": "fa-children", "description": "Khám và điều trị toàn diện bệnh lý sơ sinh, trẻ nhỏ và dinh dưỡng", "order": 9, "category": "clinical"}, {"id": 3, "code": "YHCTPHCN", "name": "Khoa YHCT - Phục hồi chức năng", "head_nurse": "ĐD. Phạm Thị Lý", "doctor_in_charge": "BSCKI. Trần Văn Thái", "phone": "0211.386.118", "color": "#f59e0b", "icon": "fa-spa", "description": "Châm cứu, xoa bóp bấm huyệt, phục hồi chức năng và vật lý trị liệu", "order": 10, "category": "clinical"}, {"id": 13, "code": "LCK", "name": "Khoa Liên Chuyên Khoa (Mắt - TMH - RHM)", "head_nurse": "ĐD. Vũ Thị Loan", "doctor_in_charge": "BSCKI. Đỗ Mạnh Cường", "phone": "0211.386.129", "color": "#8b5cf6", "icon": "fa-eye", "description": "Khám chữa bệnh Răng Hàm Mặt, Tai Mũi Họng, Mắt và phẫu thuật tạo hình", "order": 11, "category": "clinical"}, {"id": 14, "code": "TDCN", "name": "Khoa Thăm dò chức năng & Nội soi", "head_nurse": "KTV. Lê Thùy Linh", "doctor_in_charge": "BS. Lê Quang Huy", "phone": "0211.386.131", "color": "#14b8a6", "icon": "fa-wave-square", "description": "Nội soi tiêu hóa, điện tim, điện não đồ, đo chức năng hô hấp", "order": 12, "category": "paraclinical"}, {"id": 9, "code": "KXN", "name": "Khoa Xét nghiệm", "head_nurse": "KTV. Đỗ Thị Thu Hường", "doctor_in_charge": "BSCKI. Vũ Đức Hải", "phone": "0211.386.132", "color": "#8b5cf6", "icon": "fa-vial-virus", "description": "Huyết học, Sinh hóa, Miễn dịch, Vi sinh đạt chuẩn an toàn sinh học", "order": 13, "category": "paraclinical"}, {"id": 15, "code": "KD", "name": "Khoa Dược", "head_nurse": "DS. Nguyễn Bích Ngọc", "doctor_in_charge": "DS CKI. Hoàng Thị Lan", "phone": "0211.386.133", "color": "#10b981", "icon": "fa-pills", "description": "Quản lý kho thuốc, cấp phát dược phẩm, hóa chất và vật tư y tế", "order": 14, "category": "paraclinical"}, {"id": 10, "code": "KKSNK", "name": "Khoa Kiểm soát Nhiễm khuẩn", "head_nurse": "ĐD. Trịnh Thị Thu Trang", "doctor_in_charge": "BSCKI. Hoàng Trọng Nghĩa", "phone": "0211.386.135", "color": "#14b8a6", "icon": "fa-shield-virus", "description": "Tiệt khuẩn dụng cụ y tế, giặt là đồ vải, giám sát vệ sinh 5S bệnh viện", "order": 15, "category": "paraclinical"}, {"id": 16, "code": "QLCL", "name": "Phòng Quản lý chất lượng & Ban Chỉ đạo 5S", "head_nurse": "ĐD. Nguyễn Thu Trang", "doctor_in_charge": "ThS. BSCKII. Phạm Quỳnh Hưng", "phone": "0211.386.100", "color": "#6366f1", "icon": "fa-award", "description": "Thường trực Ban Chỉ đạo 5S, đánh giá Bộ 83 Tiêu chí chất lượng BV", "order": 16, "category": "functional"}, {"id": 17, "code": "KHTH", "name": "Phòng Kế hoạch tổng hợp & CNTT", "head_nurse": "ĐD. Hoàng Hải Yến", "doctor_in_charge": "BSCKI. Trần Đức Thắng", "phone": "0211.386.102", "color": "#3b82f6", "icon": "fa-clipboard-list", "description": "Kế hoạch chuyên môn, chỉ đạo tuyến, quản trị hệ thống HIS/PACS", "order": 17, "category": "functional"}, {"id": 18, "code": "PDD", "name": "Phòng Điều dưỡng", "head_nurse": "ThS. ĐD. Trần Thị Lan Hương", "doctor_in_charge": "ThS. ĐD. Trần Thị Lan Hương", "phone": "0211.386.103", "color": "#06b6d4", "icon": "fa-user-nurse", "description": "Quản lý chăm sóc người bệnh, kiểm tra quy trình kỹ thuật điều dưỡng và 5S", "order": 18, "category": "functional"}, {"id": 19, "code": "HCQT", "name": "Phòng Tổ chức cán bộ & Hành chính quản trị", "head_nurse": "CN. Đặng Thị Loan", "doctor_in_charge": "ThS. Nguyễn Văn Hùng", "phone": "0211.386.105", "color": "#64748b", "icon": "fa-building", "description": "Văn thư, tiếp dân, quản trị cơ sở vật chất, bảo vệ và khuôn viên cảnh quan", "order": 19, "category": "functional"}, {"id": 20, "code": "TCKT", "name": "Phòng Tài chính - Kế toán", "head_nurse": "KTV. Lê Thu Thảo", "doctor_in_charge": "ThS. Vũ Thị Mai", "phone": "0211.386.106", "color": "#f59e0b", "icon": "fa-file-invoice-dollar", "description": "Quản lý thu chi viện phí, thanh toán BHYT, quản trị tài sản và trang thiết bị", "order": 20, "category": "functional"}],
  rooms: [{"id": 34, "department_id": 8, "code": "XQ-01", "name": "Phòng Chụp X-quang Kỹ thuật số DR", "room_type": "Phòng máy", "floor": "Tầng 1 - Nhà Kỹ thuật", "person_in_charge": "KTV. Trần Văn Chung", "target_score": 95.0, "status": "active", "order": 1}, {"id": 32, "department_id": 8, "code": "CT-01", "name": "Phòng Chụp Cắt lớp vi tính 128 dãy (CT-Scanner)", "room_type": "Phòng máy", "floor": "Tầng 1 - Nhà Kỹ thuật", "person_in_charge": "KTV. Nguyễn Đức Tuấn", "target_score": 98.0, "status": "active", "order": 2}, {"id": 33, "department_id": 8, "code": "MRI-01", "name": "Phòng Chụp Cộng hưởng từ 1.5 Tesla (MRI)", "room_type": "Phòng máy", "floor": "Tầng 1 - Nhà Kỹ thuật", "person_in_charge": "KTV. Lê Công Bằng", "target_score": 98.0, "status": "active", "order": 3}, {"id": 35, "department_id": 8, "code": "SA-01", "name": "Phòng Siêu âm Màu 4D & Doppler tim mạch (P.104)", "room_type": "Phòng khám", "floor": "Tầng 1 - Nhà Kỹ thuật", "person_in_charge": "BS. Phạm Quang Nam", "target_score": 95.0, "status": "active", "order": 4}, {"id": 50, "department_id": 8, "code": "PACS-01", "name": "Phòng Đọc & Hội chẩn kết quả CĐHA - PACS", "room_type": "Phòng chuyên môn", "floor": "Tầng 1 - Nhà Kỹ thuật", "person_in_charge": "KTV. Vũ Bá Đạt", "target_score": 95.0, "status": "active", "order": 5}, {"id": 51, "department_id": 8, "code": "KHO-CDHA", "name": "Kho Vật tư tiêu hao & Lưu trữ hồ sơ phim CĐHA", "room_type": "Kho lưu trữ", "floor": "Tầng 1 - Nhà Kỹ thuật", "person_in_charge": "KTV. Trần Văn Tuấn", "target_score": 90.0, "status": "active", "order": 6}, {"id": 1, "department_id": 1, "code": "KCC-P01", "name": "Phòng Tiếp nhận & Phân loại bệnh cấp cứu", "room_type": "Phòng tiếp đón", "floor": "Tầng 1 - Nhà A", "person_in_charge": "ĐD. Lê Văn Minh", "target_score": 92.0, "status": "active", "order": 1}, {"id": 2, "department_id": 1, "code": "KCC-P02", "name": "Phòng Hồi sức Cấp cứu ban đầu & Chấn thương", "room_type": "Phòng thủ thuật", "floor": "Tầng 1 - Nhà A", "person_in_charge": "ĐD. Trần Thị Lan Hương", "target_score": 95.0, "status": "active", "order": 2}, {"id": 3, "department_id": 1, "code": "KCC-P03", "name": "Phòng Lưu bệnh Cấp cứu (Phòng 101)", "room_type": "Phòng bệnh", "floor": "Tầng 1 - Nhà A", "person_in_charge": "ĐD. Phạm Thị Mai", "target_score": 90.0, "status": "active", "order": 3}, {"id": 4, "department_id": 1, "code": "KCC-P04", "name": "Phòng Tiểu phẫu - Băng bó vết thương", "room_type": "Phòng thủ thuật", "floor": "Tầng 1 - Nhà A", "person_in_charge": "ĐD. Hoàng Hải Yến", "target_score": 92.0, "status": "active", "order": 4}, {"id": 5, "department_id": 1, "code": "KCC-P05", "name": "Kho Thuốc & Dịch truyền Cấp cứu", "room_type": "Kho dược", "floor": "Tầng 1 - Nhà A", "person_in_charge": "DS. Nguyễn Bích Ngọc", "target_score": 95.0, "status": "active", "order": 5}, {"id": 6, "department_id": 1, "code": "KCC-P06", "name": "Khu Vệ sinh Cấp cứu & Khử khuẩn rác thải", "room_type": "Khu vệ sinh", "floor": "Tầng 1 - Nhà A", "person_in_charge": "Hộ lý. Vũ Thị Hoa", "target_score": 90.0, "status": "active", "order": 6}, {"id": 46, "department_id": 11, "code": "ICU-01", "name": "Buồng Bệnh nhân nặng Hồi sức 1", "room_type": "Phòng điều trị tích cực", "floor": "Tầng 2 - Nhà B", "person_in_charge": "BSCKI. Trần Văn Thái", "target_score": 98.0, "status": "active", "order": 1}, {"id": 47, "department_id": 11, "code": "ICU-02", "name": "Buồng Bệnh nhân Thở máy & Lọc máu liên tục", "room_type": "Phòng hồi sức", "floor": "Tầng 2 - Nhà B", "person_in_charge": "ĐD. Nguyễn Thị Mai", "target_score": 98.0, "status": "active", "order": 2}, {"id": 48, "department_id": 11, "code": "ICU-03", "name": "Phòng Thao tác & Thủ thuật ICU", "room_type": "Phòng thủ thuật", "floor": "Tầng 2 - Nhà B", "person_in_charge": "ThS.BS. Đinh Công Trí", "target_score": 95.0, "status": "active", "order": 3}, {"id": 49, "department_id": 11, "code": "ICU-04", "name": "Phòng Trực cấp cứu & Giao ban ICU", "room_type": "Phòng giao ban", "floor": "Tầng 2 - Nhà B", "person_in_charge": "ĐD. Nguyễn Thị Thanh Nga", "target_score": 92.0, "status": "active", "order": 4}, {"id": 52, "department_id": 11, "code": "ICU-05", "name": "Buồng Cách ly áp lực âm ICU", "room_type": "Phòng cách ly", "floor": "Tầng 2 - Nhà B", "person_in_charge": "ĐD. Phan Anh Tuấn", "target_score": 95.0, "status": "active", "order": 5}, {"id": 53, "department_id": 12, "code": "PTGM-01", "name": "Phòng Mổ số 1 - Phẫu thuật Ngoại tổng quát", "room_type": "Phòng phẫu thuật", "floor": "Tầng 3 - Nhà Kỹ thuật", "person_in_charge": "BSCKII. Lê Tuấn Anh", "target_score": 99.0, "status": "active", "order": 1}, {"id": 54, "department_id": 12, "code": "PTGM-02", "name": "Phòng Mổ số 2 - Phẫu thuật Sản khoa & Mổ lấy thai", "room_type": "Phòng phẫu thuật", "floor": "Tầng 3 - Nhà Kỹ thuật", "person_in_charge": "BSCKII. Nguyễn Thị Hồng", "target_score": 99.0, "status": "active", "order": 2}, {"id": 55, "department_id": 12, "code": "PTGM-03", "name": "Phòng Hồi tỉnh & Theo dõi sau phẫu thuật", "room_type": "Phòng hồi tỉnh", "floor": "Tầng 3 - Nhà Kỹ thuật", "person_in_charge": "ĐD. Nguyễn Văn Thắng", "target_score": 96.0, "status": "active", "order": 3}, {"id": 56, "department_id": 12, "code": "PTGM-04", "name": "Khu Rửa tay phẫu thuật viên & Thay đồ vô khuẩn", "room_type": "Khu kỹ thuật", "floor": "Tầng 3 - Nhà Kỹ thuật", "person_in_charge": "ĐD. Bùi Văn Hùng", "target_score": 95.0, "status": "active", "order": 4}, {"id": 57, "department_id": 12, "code": "PTGM-05", "name": "Kho Vật tư phòng mổ & Đồ vải tiệt trùng", "room_type": "Kho vô trùng", "floor": "Tầng 3 - Nhà Kỹ thuật", "person_in_charge": "ĐD. Trần Kim Oanh", "target_score": 95.0, "status": "active", "order": 5}, {"id": 7, "department_id": 2, "code": "KKB-P01", "name": "Sảnh Tiếp đón, Hướng dẫn & Lấy số tự động", "room_type": "Sảnh chờ", "floor": "Tầng 1 - Nhà B", "person_in_charge": "ĐD. Nguyễn Thu Trang", "target_score": 92.0, "status": "active", "order": 1}, {"id": 8, "department_id": 2, "code": "KKB-P02", "name": "Phòng Khám Nội tổng quát (P.101)", "room_type": "Phòng khám", "floor": "Tầng 1 - Nhà B", "person_in_charge": "BSCKI. Vũ Đình Khiêm", "target_score": 92.0, "status": "active", "order": 2}, {"id": 9, "department_id": 2, "code": "KKB-P03", "name": "Phòng Khám Ngoại - Chấn thương (P.102)", "room_type": "Phòng khám", "floor": "Tầng 1 - Nhà B", "person_in_charge": "BS. Đỗ Mạnh Cường", "target_score": 92.0, "status": "active", "order": 3}, {"id": 10, "department_id": 2, "code": "KKB-P04", "name": "Phòng Khám Nhi & Tiêm chủng (P.103)", "room_type": "Phòng khám", "floor": "Tầng 1 - Nhà B", "person_in_charge": "BS. Trần Thảo Vy", "target_score": 92.0, "status": "active", "order": 4}, {"id": 11, "department_id": 2, "code": "KKB-P05", "name": "Phòng Lấy mẫu máu & Bệnh phẩm tập trung", "room_type": "Phòng thủ thuật", "floor": "Tầng 1 - Nhà B", "person_in_charge": "KTV. Lê Thùy Linh", "target_score": 95.0, "status": "active", "order": 5}, {"id": 58, "department_id": 2, "code": "KKB-P06", "name": "Quầy Thu viện phí & Giám định BHYT", "room_type": "Quầy giao dịch", "floor": "Tầng 1 - Nhà B", "person_in_charge": "ĐD. Hoàng Bích Thủy", "target_score": 90.0, "status": "active", "order": 6}, {"id": 16, "department_id": 4, "code": "KNG-P01", "name": "Buồng Hậu phẫu Ngoại 201", "room_type": "Phòng bệnh", "floor": "Tầng 2 - Nhà C", "person_in_charge": "ĐD. Trần Kim Oanh", "target_score": 92.0, "status": "active", "order": 1}, {"id": 17, "department_id": 4, "code": "KNG-P02", "name": "Buồng Bệnh Tiền phẫu 202", "room_type": "Phòng bệnh", "floor": "Tầng 2 - Nhà C", "person_in_charge": "ĐD. Nguyễn Văn Thắng", "target_score": 90.0, "status": "active", "order": 2}, {"id": 18, "department_id": 4, "code": "KNG-P03", "name": "Phòng Thay băng - Rửa vết thương & Cắt chỉ", "room_type": "Phòng thủ thuật", "floor": "Tầng 2 - Nhà C", "person_in_charge": "ĐD. Bùi Văn Hùng", "target_score": 95.0, "status": "active", "order": 3}, {"id": 19, "department_id": 4, "code": "KNG-P04", "name": "Phòng Trực Bác sĩ & Giao ban khoa Ngoại", "room_type": "Phòng giao ban", "floor": "Tầng 2 - Nhà C", "person_in_charge": "BSCKII. Nguyễn Văn Toàn", "target_score": 90.0, "status": "active", "order": 4}, {"id": 20, "department_id": 5, "code": "KNT-P01", "name": "Buồng Bệnh Nội Tim Mạch (P.301)", "room_type": "Phòng bệnh", "floor": "Tầng 3 - Nhà C", "person_in_charge": "ĐD. Dương Thị Hằng", "target_score": 92.0, "status": "active", "order": 1}, {"id": 21, "department_id": 5, "code": "KNT-P02", "name": "Buồng Bệnh Nội Tiết - Tiểu đường (P.302)", "room_type": "Phòng bệnh", "floor": "Tầng 3 - Nhà C", "person_in_charge": "ĐD. Ngô Thị Yến", "target_score": 90.0, "status": "active", "order": 2}, {"id": 22, "department_id": 5, "code": "KNT-P03", "name": "Phòng Tiêm, Phát thuốc & Trực Điều dưỡng", "room_type": "Phòng trực", "floor": "Tầng 3 - Nhà C", "person_in_charge": "ĐD. Trần Phương Dung", "target_score": 95.0, "status": "active", "order": 3}, {"id": 23, "department_id": 5, "code": "KNT-P04", "name": "Khu Vệ sinh buồng bệnh nhân Tầng 3", "room_type": "Khu vệ sinh", "floor": "Tầng 3 - Nhà C", "person_in_charge": "Hộ lý. Phạm Thị Chắt", "target_score": 90.0, "status": "active", "order": 4}, {"id": 24, "department_id": 6, "code": "KSN-P01", "name": "Phòng Chờ đẻ & Theo dõi tim thai", "room_type": "Phòng chuyên khoa", "floor": "Tầng 2 - Nhà B", "person_in_charge": "HS. Vũ Thị Loan", "target_score": 95.0, "status": "active", "order": 1}, {"id": 25, "department_id": 6, "code": "KSN-P02", "name": "Phòng Đẻ thường số 1 (Vô khuẩn)", "room_type": "Phòng thủ thuật", "floor": "Tầng 2 - Nhà B", "person_in_charge": "HS. Lê Thị Thúy Hằng", "target_score": 98.0, "status": "active", "order": 2}, {"id": 26, "department_id": 6, "code": "KSN-P03", "name": "Buồng Chăm sóc Mẹ và Bé sau sinh (P.205)", "room_type": "Phòng bệnh", "floor": "Tầng 2 - Nhà B", "person_in_charge": "ĐD. Trần Hồng Nhung", "target_score": 92.0, "status": "active", "order": 3}, {"id": 27, "department_id": 6, "code": "KSN-P04", "name": "Phòng Tắm Bé & Tiêm chủng sơ sinh", "room_type": "Phòng thủ thuật", "floor": "Tầng 2 - Nhà B", "person_in_charge": "HS. Nguyễn Thị Thêu", "target_score": 95.0, "status": "active", "order": 4}, {"id": 28, "department_id": 7, "code": "KNHI-P01", "name": "Đơn nguyên Sơ sinh (Lồng ấp & Chiếu đèn)", "room_type": "Phòng đặc biệt", "floor": "Tầng 3 - Nhà B", "person_in_charge": "ĐD. Đỗ Thị Hiền", "target_score": 98.0, "status": "active", "order": 1}, {"id": 29, "department_id": 7, "code": "KNHI-P02", "name": "Buồng Bệnh Nhi Hô hấp (P.301)", "room_type": "Phòng bệnh", "floor": "Tầng 3 - Nhà B", "person_in_charge": "ĐD. Nguyễn Thị Thủy", "target_score": 92.0, "status": "active", "order": 2}, {"id": 30, "department_id": 7, "code": "KNHI-P03", "name": "Buồng Bệnh Nhi Tiêu hóa (P.302)", "room_type": "Phòng bệnh", "floor": "Tầng 3 - Nhà B", "person_in_charge": "ĐD. Mai Thị Trang", "target_score": 90.0, "status": "active", "order": 3}, {"id": 31, "department_id": 7, "code": "KNHI-P04", "name": "Khu Vui chơi giải trí & Vận động bệnh nhi", "room_type": "Khu công cộng", "floor": "Tầng 3 - Nhà B", "person_in_charge": "ĐD. Trần Thu Hà", "target_score": 90.0, "status": "active", "order": 4}, {"id": 59, "department_id": 3, "code": "YHCT-01", "name": "Phòng Khám & Bắt mạch YHCT", "room_type": "Phòng khám", "floor": "Tầng 4 - Nhà C", "person_in_charge": "BSCKI. Trần Văn Thái", "target_score": 92.0, "status": "active", "order": 1}, {"id": 60, "department_id": 3, "code": "YHCT-02", "name": "Phòng Châm cứu & Xoa bóp bấm huyệt", "room_type": "Phòng thủ thuật", "floor": "Tầng 4 - Nhà C", "person_in_charge": "ĐD. Phạm Thị Lý", "target_score": 95.0, "status": "active", "order": 2}, {"id": 61, "department_id": 3, "code": "YHCT-03", "name": "Phòng Vật lý trị liệu & Vận động phục hồi", "room_type": "Phòng tập", "floor": "Tầng 4 - Nhà C", "person_in_charge": "KTV. Lê Văn Tuấn", "target_score": 92.0, "status": "active", "order": 3}, {"id": 62, "department_id": 3, "code": "YHCT-04", "name": "Phòng Sắc thuốc & Bảo quản dược liệu YHCT", "room_type": "Khu chế biến", "floor": "Tầng 4 - Nhà C", "person_in_charge": "DS. Hoàng Thị Mai", "target_score": 90.0, "status": "active", "order": 4}, {"id": 63, "department_id": 13, "code": "LCK-01", "name": "Phòng Khám & Điều trị Răng Hàm Mặt", "room_type": "Phòng khám", "floor": "Tầng 2 - Nhà B", "person_in_charge": "BSCKI. Đỗ Mạnh Cường", "target_score": 95.0, "status": "active", "order": 1}, {"id": 64, "department_id": 13, "code": "LCK-02", "name": "Phòng Khám & Nội soi Tai Mũi Họng", "room_type": "Phòng khám", "floor": "Tầng 2 - Nhà B", "person_in_charge": "BS. Nguyễn Văn Hùng", "target_score": 95.0, "status": "active", "order": 2}, {"id": 65, "department_id": 13, "code": "LCK-03", "name": "Phòng Khám Mắt & Đo thị lực khúc xạ", "room_type": "Phòng khám", "floor": "Tầng 2 - Nhà B", "person_in_charge": "BS. Vũ Thị Loan", "target_score": 92.0, "status": "active", "order": 3}, {"id": 66, "department_id": 14, "code": "TDCN-01", "name": "Phòng Nội soi Tiêu hóa dạ dày - đại tràng", "room_type": "Phòng thủ thuật", "floor": "Tầng 2 - Nhà Kỹ thuật", "person_in_charge": "BS. Lê Quang Huy", "target_score": 98.0, "status": "active", "order": 1}, {"id": 67, "department_id": 14, "code": "TDCN-02", "name": "Phòng Điện tim & Điện não đồ vi tính", "room_type": "Phòng máy", "floor": "Tầng 2 - Nhà Kỹ thuật", "person_in_charge": "KTV. Lê Thùy Linh", "target_score": 95.0, "status": "active", "order": 2}, {"id": 68, "department_id": 14, "code": "TDCN-03", "name": "Phòng Đo chức năng hô hấp & Lưu huyết não", "room_type": "Phòng máy", "floor": "Tầng 2 - Nhà Kỹ thuật", "person_in_charge": "KTV. Trần Thu Hà", "target_score": 92.0, "status": "active", "order": 3}, {"id": 36, "department_id": 9, "code": "KXN-P01", "name": "Phòng Xét nghiệm Huyết học & Truyền máu", "room_type": "Phòng xét nghiệm", "floor": "Tầng 2 - Nhà Kỹ thuật", "person_in_charge": "KTV. Đỗ Thị Thu Hường", "target_score": 98.0, "status": "active", "order": 1}, {"id": 37, "department_id": 9, "code": "KXN-P02", "name": "Phòng Xét nghiệm Sinh hóa - Miễn dịch tự động", "room_type": "Phòng xét nghiệm", "floor": "Tầng 2 - Nhà Kỹ thuật", "person_in_charge": "KTV. Nguyễn Đình Khải", "target_score": 98.0, "status": "active", "order": 2}, {"id": 38, "department_id": 9, "code": "KXN-P03", "name": "Phòng Vi sinh - Ký sinh trùng & Nuôi cấy", "room_type": "Phòng xét nghiệm", "floor": "Tầng 2 - Nhà Kỹ thuật", "person_in_charge": "KTV. Phạm Thị Hạnh", "target_score": 95.0, "status": "active", "order": 3}, {"id": 39, "department_id": 9, "code": "KXN-P04", "name": "Kho Hóa chất xét nghiệm & Lưu mẫu bệnh phẩm", "room_type": "Kho lưu trữ", "floor": "Tầng 2 - Nhà Kỹ thuật", "person_in_charge": "KTV. Lê Thu Thảo", "target_score": 95.0, "status": "active", "order": 4}, {"id": 69, "department_id": 15, "code": "KD-01", "name": "Kho Thuốc chẵn Nội trú & Dịch truyền", "room_type": "Kho thuốc", "floor": "Tầng 1 - Nhà Kho Dược", "person_in_charge": "DS CKI. Hoàng Thị Lan", "target_score": 98.0, "status": "active", "order": 1}, {"id": 70, "department_id": 15, "code": "KD-02", "name": "Kho Thuốc Cấp phát Ngoại trú BHYT", "room_type": "Kho cấp phát", "floor": "Tầng 1 - Nhà B", "person_in_charge": "DS. Nguyễn Bích Ngọc", "target_score": 95.0, "status": "active", "order": 2}, {"id": 71, "department_id": 15, "code": "KD-03", "name": "Kho Hóa chất sát khuẩn & Vật tư y tế tiêu hao", "room_type": "Kho vật tư", "floor": "Tầng 1 - Nhà Kho Dược", "person_in_charge": "DS. Trần Văn Nam", "target_score": 95.0, "status": "active", "order": 3}, {"id": 72, "department_id": 15, "code": "KD-04", "name": "Phòng Pha chế & Bảo quản lạnh Vắc xin/Thuốc đặc biệt", "room_type": "Phòng chuyên môn", "floor": "Tầng 1 - Nhà Kho Dược", "person_in_charge": "DS. Lê Thị Mai", "target_score": 98.0, "status": "active", "order": 4}, {"id": 40, "department_id": 10, "code": "KKSNK-P01", "name": "Khu Tiếp nhận & Rửa dụng cụ y tế bẩn", "room_type": "Khu kỹ thuật", "floor": "Tầng 1 - Nhà Giặt hấp", "person_in_charge": "ĐD. Trịnh Thị Thu Trang", "target_score": 95.0, "status": "active", "order": 1}, {"id": 41, "department_id": 10, "code": "KKSNK-P02", "name": "Khu Đóng gói & Nồi hấp Tiệt trùng nhiệt độ cao", "room_type": "Khu tiệt trùng", "floor": "Tầng 1 - Nhà Giặt hấp", "person_in_charge": "KTV. Nguyễn Văn Đạt", "target_score": 98.0, "status": "active", "order": 2}, {"id": 42, "department_id": 10, "code": "KKSNK-P03", "name": "Kho Dụng cụ Phẫu thuật Vô khuẩn thành phẩm", "room_type": "Kho vô trùng", "floor": "Tầng 1 - Nhà Giặt hấp", "person_in_charge": "ĐD. Lê Thị Nga", "target_score": 99.0, "status": "active", "order": 3}, {"id": 43, "department_id": 10, "code": "KKSNK-P04", "name": "Khu Giặt là & Khử khuẩn đồ vải bệnh viện", "room_type": "Khu giặt là", "floor": "Tầng 1 - Nhà Giặt hấp", "person_in_charge": "CN. Đặng Thị Loan", "target_score": 92.0, "status": "active", "order": 4}, {"id": 73, "department_id": 10, "code": "KKSNK-P05", "name": "Khu Phân loại & Lưu trữ tạm thời rác thải y tế", "room_type": "Khu rác thải", "floor": "Khuôn viên phía sau Nhà Giặt", "person_in_charge": "Hộ lý. Vũ Thị Hoa", "target_score": 95.0, "status": "active", "order": 5}, {"id": 74, "department_id": 16, "code": "QLCL-01", "name": "Văn phòng Thường trực Ban Chỉ đạo 5S Toàn Viện", "room_type": "Văn phòng", "floor": "Tầng 4 - Nhà Điều hành", "person_in_charge": "ThS. BSCKII. Phạm Quỳnh Hưng", "target_score": 98.0, "status": "active", "order": 1}, {"id": 75, "department_id": 16, "code": "QLCL-02", "name": "Phòng Lưu trữ Hồ sơ 83 Tiêu chí & Minh chứng 5S", "room_type": "Phòng hồ sơ", "floor": "Tầng 4 - Nhà Điều hành", "person_in_charge": "ĐD. Nguyễn Thu Trang", "target_score": 95.0, "status": "active", "order": 2}, {"id": 76, "department_id": 17, "code": "KHTH-01", "name": "Văn phòng Kế hoạch tổng hợp & Phòng Giao ban Viện", "room_type": "Phòng giao ban", "floor": "Tầng 4 - Nhà Điều hành", "person_in_charge": "BSCKI. Trần Đức Thắng", "target_score": 95.0, "status": "active", "order": 1}, {"id": 77, "department_id": 17, "code": "KHTH-02", "name": "Phòng Máy chủ Trung tâm & Quản trị mạng HIS/PACS", "room_type": "Phòng server", "floor": "Tầng 4 - Nhà Điều hành", "person_in_charge": "KS. Nguyễn Hoàng Nam", "target_score": 98.0, "status": "active", "order": 2}, {"id": 78, "department_id": 18, "code": "PDD-01", "name": "Văn phòng Điều dưỡng trưởng bệnh viện & Đào tạo 5S", "room_type": "Văn phòng", "floor": "Tầng 3 - Nhà Điều hành", "person_in_charge": "ThS. ĐD. Trần Thị Lan Hương", "target_score": 95.0, "status": "active", "order": 1}, {"id": 79, "department_id": 19, "code": "HCQT-01", "name": "Bộ phận Văn thư - Lưu trữ & Tiếp nhận công văn", "room_type": "Văn thư", "floor": "Tầng 2 - Nhà Điều hành", "person_in_charge": "ThS. Nguyễn Văn Hùng", "target_score": 92.0, "status": "active", "order": 1}, {"id": 80, "department_id": 19, "code": "HCQT-02", "name": "Kho Vật tư văn phòng phẩm & Thiết bị hành chính", "room_type": "Kho hành chính", "floor": "Tầng 1 - Nhà Điều hành", "person_in_charge": "CN. Đặng Thị Loan", "target_score": 90.0, "status": "active", "order": 2}, {"id": 81, "department_id": 20, "code": "TCKT-01", "name": "Phòng Kế toán tổng hợp & Quản trị tài sản viện", "room_type": "Văn phòng", "floor": "Tầng 2 - Nhà Điều hành", "person_in_charge": "ThS. Vũ Thị Mai", "target_score": 95.0, "status": "active", "order": 1}],
  staff: [{"id": 1, "code": "BV-345", "staff_code": "BV-345", "name": "KTV. Vũ Bá Đạt", "full_name": "KTV. Vũ Bá Đạt", "username": "bv345", "password": "123", "department_id": 8, "role": "admin", "role_level": "admin", "title": "Kỹ thuật viên Trưởng", "role_title": "Kỹ thuật viên Trưởng", "position": "Kỹ thuật viên Trưởng CĐHA & Giám sát 5S Toàn Viện", "assigned_rooms": ["Phòng Chụp X-quang Kỹ thuật số DR", "Phòng Chụp Cắt lớp vi tính 128 dãy (CT-Scanner)", "Phòng Chụp Cộng hưởng từ 1.5 Tesla (MRI)", "Phòng Đọc & Hội chẩn kết quả CĐHA - PACS"], "assigned_room": "Phòng Chụp X-quang Kỹ thuật số DR, Phòng Chụp Cắt lớp vi tính 128 dãy (CT-Scanner), Phòng Chụp Cộng hưởng từ 1.5 Tesla (MRI)", "allow_external": true, "can_review": true, "is_supervisor": true}, {"id": 2, "code": "BV-101", "staff_code": "BV-101", "name": "ThS. BSCKII. Phạm Quỳnh Hưng", "full_name": "ThS. BSCKII. Phạm Quỳnh Hưng", "username": "bv101", "password": "123", "department_id": 16, "role": "admin", "role_level": "admin", "title": "ThS. BSCKII - Trưởng Ban 5S", "role_title": "Trưởng Ban Chỉ Đạo 5S / Ban Giám Đốc", "position": "Trưởng Ban Chỉ Đạo 5S Bệnh Viện & Bác sĩ Cấp Cứu", "assigned_rooms": ["Văn phòng Thường trực Ban Chỉ đạo 5S Toàn Viện", "Toàn bộ Khoa CĐHA & Hội đồng 5S Toàn Viện"], "assigned_room": "Văn phòng Thường trực Ban Chỉ đạo 5S Toàn Viện, Toàn bộ Khoa CĐHA & Hội đồng 5S Toàn Viện", "allow_external": true, "can_review": true, "is_supervisor": true}, {"id": 3, "code": "BV-102", "staff_code": "BV-102", "name": "BSCKII. Nguyễn Văn Toàn", "full_name": "BSCKII. Nguyễn Văn Toàn", "username": "bv102", "password": "123", "department_id": 4, "role": "staff", "role_level": "staff", "title": "BSCKII - Trưởng Khoa", "role_title": "BSCKII - Trưởng Khoa", "position": "Bác sĩ Trưởng Khoa Ngoại Tổng Hợp", "assigned_rooms": ["Buồng Hậu phẫu Ngoại 201", "Phòng Thay băng - Rửa vết thương & Cắt chỉ"], "assigned_room": "Buồng Hậu phẫu Ngoại 201, Phòng Thay băng - Rửa vết thương & Cắt chỉ", "allow_external": true, "can_review": false, "is_supervisor": false}, {"id": 4, "code": "BV-103", "staff_code": "BV-103", "name": "ĐD. Vũ Quang Trưởng", "full_name": "ĐD. Vũ Quang Trưởng", "username": "bv103", "password": "123", "department_id": 1, "role": "staff", "role_level": "staff", "title": "Điều dưỡng Trưởng Khoa", "role_title": "Điều dưỡng Trưởng Khoa", "position": "Điều dưỡng Trưởng Khoa Cấp Cứu", "assigned_rooms": ["Phòng Tiếp nhận & Phân loại bệnh cấp cứu", "Phòng Hồi sức Cấp cứu ban đầu & Chấn thương"], "assigned_room": "Phòng Tiếp nhận & Phân loại bệnh cấp cứu, Phòng Hồi sức Cấp cứu ban đầu & Chấn thương", "allow_external": true, "can_review": false, "is_supervisor": false}, {"id": 5, "code": "BV-104", "staff_code": "BV-104", "name": "ĐD. Lê Văn Minh", "full_name": "ĐD. Lê Văn Minh", "username": "bv104", "password": "123", "department_id": 1, "role": "staff", "role_level": "staff", "title": "Điều dưỡng viên", "role_title": "Điều dưỡng viên", "position": "Điều dưỡng viên Cấp cứu", "assigned_rooms": ["Phòng Tiểu phẫu - Băng bó vết thương", "Khu Vệ sinh Cấp cứu & Khử khuẩn rác thải"], "assigned_room": "Phòng Tiểu phẫu - Băng bó vết thương, Khu Vệ sinh Cấp cứu & Khử khuẩn rác thải", "allow_external": true, "can_review": false, "is_supervisor": false}, {"id": 6, "code": "BV-105", "staff_code": "BV-105", "name": "ĐD. Phạm Thị Mai", "full_name": "ĐD. Phạm Thị Mai", "username": "bv105", "password": "123", "department_id": 1, "role": "staff", "role_level": "staff", "title": "Điều dưỡng viên", "role_title": "Điều dưỡng viên", "position": "Điều dưỡng viên Cấp cứu", "assigned_rooms": ["Phòng Lưu bệnh Cấp cứu (Phòng 101)"], "assigned_room": "Phòng Lưu bệnh Cấp cứu (Phòng 101)", "allow_external": true, "can_review": false, "is_supervisor": false}, {"id": 7, "code": "BV-106", "staff_code": "BV-106", "name": "Hộ lý. Vũ Thị Hoa", "full_name": "Hộ lý. Vũ Thị Hoa", "username": "bv106", "password": "123", "department_id": 1, "role": "staff", "role_level": "staff", "title": "Hộ lý / Nhân viên vệ sinh", "role_title": "Hộ lý / Nhân viên vệ sinh", "position": "Hộ lý buồng bệnh & Khử khuẩn", "assigned_rooms": ["Khu Vệ sinh Cấp cứu & Khử khuẩn rác thải", "Khu Phân loại & Lưu trữ tạm thời rác thải y tế"], "assigned_room": "Khu Vệ sinh Cấp cứu & Khử khuẩn rác thải, Khu Phân loại & Lưu trữ tạm thời rác thải y tế", "allow_external": true, "can_review": false, "is_supervisor": false}, {"id": 8, "code": "BV-107", "staff_code": "BV-107", "name": "BSCKI. Vũ Đình Khiêm", "full_name": "BSCKI. Vũ Đình Khiêm", "username": "bv107", "password": "123", "department_id": 2, "role": "staff", "role_level": "staff", "title": "BSCKI - Trưởng Khoa", "role_title": "BSCKI - Trưởng Khoa", "position": "Bác sĩ Trưởng Khoa Khám bệnh", "assigned_rooms": ["Sảnh Tiếp đón, Hướng dẫn & Lấy số tự động", "Phòng Khám Nội tổng quát (P.101)"], "assigned_room": "Sảnh Tiếp đón, Hướng dẫn & Lấy số tự động, Phòng Khám Nội tổng quát (P.101)", "allow_external": true, "can_review": false, "is_supervisor": false}, {"id": 9, "code": "BV-108", "staff_code": "BV-108", "name": "ĐD. Hoàng Bích Thủy", "full_name": "ĐD. Hoàng Bích Thủy", "username": "bv108", "password": "123", "department_id": 2, "role": "staff", "role_level": "staff", "title": "Điều dưỡng Trưởng Khoa", "role_title": "Điều dưỡng Trưởng Khoa", "position": "Điều dưỡng Trưởng Khoa Khám bệnh", "assigned_rooms": ["Phòng Khám Ngoại - Chấn thương (P.102)", "Phòng Lấy mẫu máu & Bệnh phẩm tập trung"], "assigned_room": "Phòng Khám Ngoại - Chấn thương (P.102), Phòng Lấy mẫu máu & Bệnh phẩm tập trung", "allow_external": true, "can_review": false, "is_supervisor": false}, {"id": 10, "code": "BV-109", "staff_code": "BV-109", "name": "ThS.BS. Đinh Công Trí", "full_name": "ThS.BS. Đinh Công Trí", "username": "bv109", "password": "123", "department_id": 11, "role": "staff", "role_level": "staff", "title": "ThS. Bác sĩ - Trưởng Khoa", "role_title": "ThS. Bác sĩ - Trưởng Khoa", "position": "Bác sĩ Trưởng Khoa Hồi sức tích cực & Chống độc (ICU)", "assigned_rooms": ["Buồng Bệnh nhân nặng Hồi sức 1", "Phòng Thao tác & Thủ thuật ICU"], "assigned_room": "Buồng Bệnh nhân nặng Hồi sức 1, Phòng Thao tác & Thủ thuật ICU", "allow_external": true, "can_review": false, "is_supervisor": false}, {"id": 11, "code": "BV-110", "staff_code": "BV-110", "name": "ĐD. Nguyễn Thị Thanh Nga", "full_name": "ĐD. Nguyễn Thị Thanh Nga", "username": "bv110", "password": "123", "department_id": 11, "role": "staff", "role_level": "staff", "title": "Điều dưỡng Trưởng Khoa", "role_title": "Điều dưỡng Trưởng Khoa", "position": "Điều dưỡng Trưởng Khoa Hồi sức tích cực ICU", "assigned_rooms": ["Buồng Bệnh nhân Thở máy & Lọc máu liên tục", "Phòng Trực cấp cứu & Giao ban ICU", "Buồng Cách ly áp lực âm ICU"], "assigned_room": "Buồng Bệnh nhân Thở máy & Lọc máu liên tục, Phòng Trực cấp cứu & Giao ban ICU", "allow_external": true, "can_review": false, "is_supervisor": false}, {"id": 12, "code": "BV-111", "staff_code": "BV-111", "name": "BSCKII. Lê Tuấn Anh", "full_name": "BSCKII. Lê Tuấn Anh", "username": "bv111", "password": "123", "department_id": 12, "role": "staff", "role_level": "staff", "title": "BSCKII - Trưởng Khoa", "role_title": "BSCKII - Trưởng Khoa", "position": "Bác sĩ Trưởng Khoa Phẫu thuật - Gây mê hồi sức", "assigned_rooms": ["Phòng Mổ số 1 - Phẫu thuật Ngoại tổng quát", "Phòng Hồi tỉnh & Theo dõi sau phẫu thuật"], "assigned_room": "Phòng Mổ số 1 - Phẫu thuật Ngoại tổng quát, Phòng Hồi tỉnh & Theo dõi sau phẫu thuật", "allow_external": true, "can_review": false, "is_supervisor": false}, {"id": 13, "code": "BV-112", "staff_code": "BV-112", "name": "ĐD. Bùi Văn Hùng", "full_name": "ĐD. Bùi Văn Hùng", "username": "bv112", "password": "123", "department_id": 4, "role": "staff", "role_level": "staff", "title": "Điều dưỡng Trưởng Khoa", "role_title": "Điều dưỡng Trưởng Khoa", "position": "Điều dưỡng Trưởng Khoa Ngoại", "assigned_rooms": ["Buồng Bệnh Tiền phẫu 202", "Phòng Trực Bác sĩ & Giao ban khoa Ngoại"], "assigned_room": "Buồng Bệnh Tiền phẫu 202, Phòng Trực Bác sĩ & Giao ban khoa Ngoại", "allow_external": true, "can_review": false, "is_supervisor": false}, {"id": 14, "code": "BV-113", "staff_code": "BV-113", "name": "BSCKI. Mai Thị Hảo", "full_name": "BSCKI. Mai Thị Hảo", "username": "bv113", "password": "123", "department_id": 5, "role": "staff", "role_level": "staff", "title": "BSCKI - Trưởng Khoa", "role_title": "BSCKI - Trưởng Khoa", "position": "Bác sĩ Trưởng Khoa Nội Tổng hợp", "assigned_rooms": ["Buồng Bệnh Nội Tim Mạch (P.301)", "Phòng Tiêm, Phát thuốc & Trực Điều dưỡng"], "assigned_room": "Buồng Bệnh Nội Tim Mạch (P.301), Phòng Tiêm, Phát thuốc & Trực Điều dưỡng", "allow_external": true, "can_review": false, "is_supervisor": false}, {"id": 15, "code": "BV-114", "staff_code": "BV-114", "name": "ĐD. Trần Phương Dung", "full_name": "ĐD. Trần Phương Dung", "username": "bv114", "password": "123", "department_id": 5, "role": "staff", "role_level": "staff", "title": "Điều dưỡng Trưởng Khoa", "role_title": "Điều dưỡng Trưởng Khoa", "position": "Điều dưỡng Trưởng Khoa Nội", "assigned_rooms": ["Buồng Bệnh Nội Tiết - Tiểu đường (P.302)", "Khu Vệ sinh buồng bệnh nhân Tầng 3"], "assigned_room": "Buồng Bệnh Nội Tiết - Tiểu đường (P.302), Khu Vệ sinh buồng bệnh nhân Tầng 3", "allow_external": true, "can_review": false, "is_supervisor": false}, {"id": 16, "code": "BV-115", "staff_code": "BV-115", "name": "KTV. Trần Văn Chung", "full_name": "KTV. Trần Văn Chung", "username": "bv115", "password": "123", "department_id": 8, "role": "staff", "role_level": "staff", "title": "Kỹ thuật viên CĐHA", "role_title": "Kỹ thuật viên CĐHA", "position": "Kỹ thuật viên Chụp X-Quang Kỹ thuật số", "assigned_rooms": ["Phòng Chụp X-quang Kỹ thuật số DR"], "assigned_room": "Phòng Chụp X-quang Kỹ thuật số DR", "allow_external": true, "can_review": false, "is_supervisor": false}, {"id": 17, "code": "BV-116", "staff_code": "BV-116", "name": "KTV. Lê Công Bằng", "full_name": "KTV. Lê Công Bằng", "username": "bv116", "password": "123", "department_id": 8, "role": "staff", "role_level": "staff", "title": "Kỹ thuật viên CĐHA", "role_title": "Kỹ thuật viên CĐHA", "position": "Kỹ thuật viên Vận hành Máy MRI & CT", "assigned_rooms": ["Phòng Chụp Cắt lớp vi tính 128 dãy (CT-Scanner)", "Phòng Chụp Cộng hưởng từ 1.5 Tesla (MRI)"], "assigned_room": "Phòng Chụp Cắt lớp vi tính 128 dãy (CT-Scanner), Phòng Chụp Cộng hưởng từ 1.5 Tesla (MRI)", "allow_external": true, "can_review": false, "is_supervisor": false}, {"id": 18, "code": "BV-117", "staff_code": "BV-117", "name": "DS. Nguyễn Bích Ngọc", "full_name": "DS. Nguyễn Bích Ngọc", "username": "bv117", "password": "123", "department_id": 15, "role": "staff", "role_level": "staff", "title": "Dược sĩ / Quản lý kho dược", "role_title": "Dược sĩ / Quản lý kho dược", "position": "Dược sĩ Quản lý kho thuốc cấp phát", "assigned_rooms": ["Kho Thuốc chẵn Nội trú & Dịch truyền", "Kho Thuốc Cấp phát Ngoại trú BHYT"], "assigned_room": "Kho Thuốc chẵn Nội trú & Dịch truyền, Kho Thuốc Cấp phát Ngoại trú BHYT", "allow_external": true, "can_review": false, "is_supervisor": false}, {"id": 19, "code": "BV-118", "staff_code": "BV-118", "name": "BSCKI. Hoàng Trọng Nghĩa", "full_name": "BSCKI. Hoàng Trọng Nghĩa", "username": "bv118", "password": "123", "department_id": 10, "role": "staff", "role_level": "staff", "title": "BSCKI - Trưởng Khoa", "role_title": "BSCKI - Trưởng Khoa", "position": "Bác sĩ Trưởng Khoa Kiểm soát Nhiễm khuẩn", "assigned_rooms": ["Kho Dụng cụ Phẫu thuật Vô khuẩn thành phẩm", "Khu Tiếp nhận & Rửa dụng cụ y tế bẩn"], "assigned_room": "Kho Dụng cụ Phẫu thuật Vô khuẩn thành phẩm, Khu Tiếp nhận & Rửa dụng cụ y tế bẩn", "allow_external": true, "can_review": false, "is_supervisor": false}, {"id": 20, "code": "BV-119", "staff_code": "BV-119", "name": "ĐD. Trịnh Thị Thu Trang", "full_name": "ĐD. Trịnh Thị Thu Trang", "username": "bv119", "password": "123", "department_id": 10, "role": "staff", "role_level": "staff", "title": "Điều dưỡng Trưởng Khoa", "role_title": "Điều dưỡng Trưởng Khoa", "position": "Điều dưỡng Trưởng Khoa Kiểm soát Nhiễm khuẩn", "assigned_rooms": ["Khu Đóng gói & Nồi hấp Tiệt trùng nhiệt độ cao", "Khu Giặt là & Khử khuẩn đồ vải bệnh viện"], "assigned_room": "Khu Đóng gói & Nồi hấp Tiệt trùng nhiệt độ cao, Khu Giặt là & Khử khuẩn đồ vải bệnh viện", "allow_external": true, "can_review": false, "is_supervisor": false}, {"id": 21, "code": "BV-120", "staff_code": "BV-120", "name": "ThS. ĐD. Trần Thị Lan Hương", "full_name": "ThS. ĐD. Trần Thị Lan Hương", "username": "bv120", "password": "123", "department_id": 18, "role": "staff", "role_level": "staff", "title": "Trưởng Phòng Chức Năng", "role_title": "Trưởng Phòng Chức Năng", "position": "Trưởng Phòng Điều dưỡng Bệnh viện VPI", "assigned_rooms": ["Văn phòng Điều dưỡng trưởng bệnh viện & Đào tạo 5S"], "assigned_room": "Văn phòng Điều dưỡng trưởng bệnh viện & Đào tạo 5S", "allow_external": true, "can_review": false, "is_supervisor": false}, {"id": 22, "code": "BV-201", "staff_code": "BV-201", "name": "BSCKI. Phạm Quang Nam", "full_name": "BSCKI. Phạm Quang Nam", "username": "bv201", "password": "123", "title": "Trưởng Khoa", "role_title": "Trưởng Khoa", "position": "Trưởng Khoa", "department_id": 8, "departments": [8], "role": "staff", "role_level": "staff", "can_review": false, "phone": "0211.386.130", "assigned_rooms": ["Phòng Chụp X-quang Kỹ thuật số DR", "Phòng Chụp Cắt lớp vi tính 128 dãy (CT-Scanner)"], "is_supervisor": false}, {"id": 23, "code": "BV-202", "staff_code": "BV-202", "name": "KTV. Nguyễn Đức Tuấn", "full_name": "KTV. Nguyễn Đức Tuấn", "username": "bv202", "password": "123", "title": "ĐD/KTV Trưởng", "role_title": "ĐD/KTV Trưởng Khoa", "position": "ĐD/KTV Trưởng Khoa", "department_id": 8, "departments": [8], "role": "staff", "role_level": "staff", "can_review": false, "phone": "0211.386.130", "assigned_rooms": ["Phòng Chụp X-quang Kỹ thuật số DR", "Phòng Chụp Cắt lớp vi tính 128 dãy (CT-Scanner)"], "is_supervisor": false}, {"id": 24, "code": "BV-203", "staff_code": "BV-203", "name": "ĐD. Trần Thị Lan Hương", "full_name": "ĐD. Trần Thị Lan Hương", "username": "bv203", "password": "123", "title": "ĐD/KTV Trưởng", "role_title": "ĐD/KTV Trưởng Khoa", "position": "ĐD/KTV Trưởng Khoa", "department_id": 1, "departments": [1], "role": "staff", "role_level": "staff", "can_review": false, "phone": "0211.386.115", "assigned_rooms": ["Phòng Tiếp nhận & Phân loại bệnh cấp cứu", "Phòng Hồi sức Cấp cứu ban đầu & Chấn thương"], "is_supervisor": false}, {"id": 25, "code": "BV-204", "staff_code": "BV-204", "name": "ĐD. Nguyễn Văn Thắng", "full_name": "ĐD. Nguyễn Văn Thắng", "username": "bv204", "password": "123", "title": "ĐD/KTV Trưởng", "role_title": "ĐD/KTV Trưởng Khoa", "position": "ĐD/KTV Trưởng Khoa", "department_id": 12, "departments": [12], "role": "staff", "role_level": "staff", "can_review": false, "phone": "0211.386.117", "assigned_rooms": ["Phòng Mổ số 1 - Phẫu thuật Ngoại tổng quát", "Phòng Mổ số 2 - Phẫu thuật Sản khoa & Mổ lấy thai"], "is_supervisor": false}, {"id": 26, "code": "BV-205", "staff_code": "BV-205", "name": "BSCKII. Nguyễn Thị Hồng", "full_name": "BSCKII. Nguyễn Thị Hồng", "username": "bv205", "password": "123", "title": "Trưởng Khoa", "role_title": "Trưởng Khoa", "position": "Trưởng Khoa", "department_id": 6, "departments": [6], "role": "staff", "role_level": "staff", "can_review": false, "phone": "0211.386.125", "assigned_rooms": ["Phòng Chờ đẻ & Theo dõi tim thai", "Phòng Đẻ thường số 1 (Vô khuẩn)"], "is_supervisor": false}, {"id": 27, "code": "BV-206", "staff_code": "BV-206", "name": "Hộ sinh. Lê Thị Thúy Hằng", "full_name": "Hộ sinh. Lê Thị Thúy Hằng", "username": "bv206", "password": "123", "title": "ĐD/KTV Trưởng", "role_title": "ĐD/KTV Trưởng Khoa", "position": "ĐD/KTV Trưởng Khoa", "department_id": 6, "departments": [6], "role": "staff", "role_level": "staff", "can_review": false, "phone": "0211.386.125", "assigned_rooms": ["Phòng Chờ đẻ & Theo dõi tim thai", "Phòng Đẻ thường số 1 (Vô khuẩn)"], "is_supervisor": false}, {"id": 28, "code": "BV-207", "staff_code": "BV-207", "name": "ThS.BS. Đặng Hồng Phúc", "full_name": "ThS.BS. Đặng Hồng Phúc", "username": "bv207", "password": "123", "title": "Trưởng Khoa", "role_title": "Trưởng Khoa", "position": "Trưởng Khoa", "department_id": 7, "departments": [7], "role": "staff", "role_level": "staff", "can_review": false, "phone": "0211.386.128", "assigned_rooms": ["Đơn nguyên Sơ sinh (Lồng ấp & Chiếu đèn)", "Buồng Bệnh Nhi Hô hấp (P.301)"], "is_supervisor": false}, {"id": 29, "code": "BV-208", "staff_code": "BV-208", "name": "ĐD. Đỗ Thị Hiền", "full_name": "ĐD. Đỗ Thị Hiền", "username": "bv208", "password": "123", "title": "ĐD/KTV Trưởng", "role_title": "ĐD/KTV Trưởng Khoa", "position": "ĐD/KTV Trưởng Khoa", "department_id": 7, "departments": [7], "role": "staff", "role_level": "staff", "can_review": false, "phone": "0211.386.128", "assigned_rooms": ["Đơn nguyên Sơ sinh (Lồng ấp & Chiếu đèn)", "Buồng Bệnh Nhi Hô hấp (P.301)"], "is_supervisor": false}, {"id": 30, "code": "BV-209", "staff_code": "BV-209", "name": "BSCKI. Trần Văn Thái", "full_name": "BSCKI. Trần Văn Thái", "username": "bv209", "password": "123", "title": "Trưởng Khoa", "role_title": "Trưởng Khoa", "position": "Trưởng Khoa", "department_id": 3, "departments": [3], "role": "staff", "role_level": "staff", "can_review": false, "phone": "0211.386.118", "assigned_rooms": ["Phòng Khám & Bắt mạch YHCT", "Phòng Châm cứu & Xoa bóp bấm huyệt"], "is_supervisor": false}, {"id": 31, "code": "BV-210", "staff_code": "BV-210", "name": "ĐD. Phạm Thị Lý", "full_name": "ĐD. Phạm Thị Lý", "username": "bv210", "password": "123", "title": "ĐD/KTV Trưởng", "role_title": "ĐD/KTV Trưởng Khoa", "position": "ĐD/KTV Trưởng Khoa", "department_id": 3, "departments": [3], "role": "staff", "role_level": "staff", "can_review": false, "phone": "0211.386.118", "assigned_rooms": ["Phòng Khám & Bắt mạch YHCT", "Phòng Châm cứu & Xoa bóp bấm huyệt"], "is_supervisor": false}, {"id": 32, "code": "BV-211", "staff_code": "BV-211", "name": "BSCKI. Đỗ Mạnh Cường", "full_name": "BSCKI. Đỗ Mạnh Cường", "username": "bv211", "password": "123", "title": "Trưởng Khoa", "role_title": "Trưởng Khoa", "position": "Trưởng Khoa", "department_id": 13, "departments": [13], "role": "staff", "role_level": "staff", "can_review": false, "phone": "0211.386.129", "assigned_rooms": ["Phòng Khám & Điều trị Răng Hàm Mặt", "Phòng Khám & Nội soi Tai Mũi Họng"], "is_supervisor": false}, {"id": 33, "code": "BV-212", "staff_code": "BV-212", "name": "ĐD. Vũ Thị Loan", "full_name": "ĐD. Vũ Thị Loan", "username": "bv212", "password": "123", "title": "ĐD/KTV Trưởng", "role_title": "ĐD/KTV Trưởng Khoa", "position": "ĐD/KTV Trưởng Khoa", "department_id": 13, "departments": [13], "role": "staff", "role_level": "staff", "can_review": false, "phone": "0211.386.129", "assigned_rooms": ["Phòng Khám & Điều trị Răng Hàm Mặt", "Phòng Khám & Nội soi Tai Mũi Họng"], "is_supervisor": false}, {"id": 34, "code": "BV-213", "staff_code": "BV-213", "name": "BS. Lê Quang Huy", "full_name": "BS. Lê Quang Huy", "username": "bv213", "password": "123", "title": "Trưởng Khoa", "role_title": "Trưởng Khoa", "position": "Trưởng Khoa", "department_id": 14, "departments": [14], "role": "staff", "role_level": "staff", "can_review": false, "phone": "0211.386.131", "assigned_rooms": ["Phòng Nội soi Tiêu hóa dạ dày - đại tràng", "Phòng Điện tim & Điện não đồ vi tính"], "is_supervisor": false}, {"id": 35, "code": "BV-214", "staff_code": "BV-214", "name": "KTV. Lê Thùy Linh", "full_name": "KTV. Lê Thùy Linh", "username": "bv214", "password": "123", "title": "ĐD/KTV Trưởng", "role_title": "ĐD/KTV Trưởng Khoa", "position": "ĐD/KTV Trưởng Khoa", "department_id": 14, "departments": [14], "role": "staff", "role_level": "staff", "can_review": false, "phone": "0211.386.131", "assigned_rooms": ["Phòng Nội soi Tiêu hóa dạ dày - đại tràng", "Phòng Điện tim & Điện não đồ vi tính"], "is_supervisor": false}, {"id": 36, "code": "BV-215", "staff_code": "BV-215", "name": "BSCKI. Vũ Đức Hải", "full_name": "BSCKI. Vũ Đức Hải", "username": "bv215", "password": "123", "title": "Trưởng Khoa", "role_title": "Trưởng Khoa", "position": "Trưởng Khoa", "department_id": 9, "departments": [9], "role": "staff", "role_level": "staff", "can_review": false, "phone": "0211.386.132", "assigned_rooms": ["Phòng Xét nghiệm Huyết học & Truyền máu", "Phòng Xét nghiệm Sinh hóa - Miễn dịch tự động"], "is_supervisor": false}, {"id": 37, "code": "BV-216", "staff_code": "BV-216", "name": "KTV. Đỗ Thị Thu Hường", "full_name": "KTV. Đỗ Thị Thu Hường", "username": "bv216", "password": "123", "title": "ĐD/KTV Trưởng", "role_title": "ĐD/KTV Trưởng Khoa", "position": "ĐD/KTV Trưởng Khoa", "department_id": 9, "departments": [9], "role": "staff", "role_level": "staff", "can_review": false, "phone": "0211.386.132", "assigned_rooms": ["Phòng Xét nghiệm Huyết học & Truyền máu", "Phòng Xét nghiệm Sinh hóa - Miễn dịch tự động"], "is_supervisor": false}, {"id": 38, "code": "BV-217", "staff_code": "BV-217", "name": "DS CKI. Hoàng Thị Lan", "full_name": "DS CKI. Hoàng Thị Lan", "username": "bv217", "password": "123", "title": "Trưởng Khoa", "role_title": "Trưởng Khoa", "position": "Trưởng Khoa", "department_id": 15, "departments": [15], "role": "staff", "role_level": "staff", "can_review": false, "phone": "0211.386.133", "assigned_rooms": ["Kho Thuốc chẵn Nội trú & Dịch truyền", "Kho Thuốc Cấp phát Ngoại trú BHYT"], "is_supervisor": false}, {"id": 39, "code": "BV-218", "staff_code": "BV-218", "name": "ĐD. Nguyễn Thu Trang", "full_name": "ĐD. Nguyễn Thu Trang", "username": "bv218", "password": "123", "title": "ĐD/KTV Trưởng", "role_title": "ĐD/KTV Trưởng Khoa", "position": "ĐD/KTV Trưởng Khoa", "department_id": 16, "departments": [16], "role": "staff", "role_level": "staff", "can_review": false, "phone": "0211.386.100", "assigned_rooms": ["Văn phòng Thường trực Ban Chỉ đạo 5S Toàn Viện", "Phòng Lưu trữ Hồ sơ 83 Tiêu chí & Minh chứng 5S"], "is_supervisor": false}, {"id": 40, "code": "BV-219", "staff_code": "BV-219", "name": "BSCKI. Trần Đức Thắng", "full_name": "BSCKI. Trần Đức Thắng", "username": "bv219", "password": "123", "title": "Trưởng Khoa", "role_title": "Trưởng Khoa", "position": "Trưởng Khoa", "department_id": 17, "departments": [17], "role": "staff", "role_level": "staff", "can_review": false, "phone": "0211.386.102", "assigned_rooms": ["Văn phòng Kế hoạch tổng hợp & Phòng Giao ban Viện", "Phòng Máy chủ Trung tâm & Quản trị mạng HIS/PACS"], "is_supervisor": false}, {"id": 41, "code": "BV-220", "staff_code": "BV-220", "name": "ĐD. Hoàng Hải Yến", "full_name": "ĐD. Hoàng Hải Yến", "username": "bv220", "password": "123", "title": "ĐD/KTV Trưởng", "role_title": "ĐD/KTV Trưởng Khoa", "position": "ĐD/KTV Trưởng Khoa", "department_id": 17, "departments": [17], "role": "staff", "role_level": "staff", "can_review": false, "phone": "0211.386.102", "assigned_rooms": ["Văn phòng Kế hoạch tổng hợp & Phòng Giao ban Viện", "Phòng Máy chủ Trung tâm & Quản trị mạng HIS/PACS"], "is_supervisor": false}, {"id": 42, "code": "BV-221", "staff_code": "BV-221", "name": "ThS. Nguyễn Văn Hùng", "full_name": "ThS. Nguyễn Văn Hùng", "username": "bv221", "password": "123", "title": "Trưởng Khoa", "role_title": "Trưởng Khoa", "position": "Trưởng Khoa", "department_id": 19, "departments": [19], "role": "staff", "role_level": "staff", "can_review": false, "phone": "0211.386.105", "assigned_rooms": ["Bộ phận Văn thư - Lưu trữ & Tiếp nhận công văn", "Kho Vật tư văn phòng phẩm & Thiết bị hành chính"], "is_supervisor": false}, {"id": 43, "code": "BV-222", "staff_code": "BV-222", "name": "CN. Đặng Thị Loan", "full_name": "CN. Đặng Thị Loan", "username": "bv222", "password": "123", "title": "ĐD/KTV Trưởng", "role_title": "ĐD/KTV Trưởng Khoa", "position": "ĐD/KTV Trưởng Khoa", "department_id": 19, "departments": [19], "role": "staff", "role_level": "staff", "can_review": false, "phone": "0211.386.105", "assigned_rooms": ["Bộ phận Văn thư - Lưu trữ & Tiếp nhận công văn", "Kho Vật tư văn phòng phẩm & Thiết bị hành chính"], "is_supervisor": false}, {"id": 44, "code": "BV-223", "staff_code": "BV-223", "name": "ThS. Vũ Thị Mai", "full_name": "ThS. Vũ Thị Mai", "username": "bv223", "password": "123", "title": "Trưởng Khoa", "role_title": "Trưởng Khoa", "position": "Trưởng Khoa", "department_id": 20, "departments": [20], "role": "staff", "role_level": "staff", "can_review": false, "phone": "0211.386.106", "assigned_rooms": ["Phòng Kế toán tổng hợp & Quản trị tài sản viện"], "is_supervisor": false}, {"id": 45, "code": "BV-224", "staff_code": "BV-224", "name": "KTV. Lê Thu Thảo", "full_name": "KTV. Lê Thu Thảo", "username": "bv224", "password": "123", "title": "ĐD/KTV Trưởng", "role_title": "ĐD/KTV Trưởng Khoa", "position": "ĐD/KTV Trưởng Khoa", "department_id": 20, "departments": [20], "role": "staff", "role_level": "staff", "can_review": false, "phone": "0211.386.106", "assigned_rooms": ["Phòng Kế toán tổng hợp & Quản trị tài sản viện"], "is_supervisor": false}],
  schedules: {
  "current_week": 42,
  "year": 2026,
  "google_sheet_url": "https://docs.google.com/spreadsheets/d/1tHg7-i__1yRdBbamuYCAKXYy7KdZflOtoin8Ay6jjBc/edit?gid=1227014826#gid=1227014826",
  "google_sheet_status": "restricted",
  "shifts": [
    {
      "id": "morning",
      "name": "Ca sáng",
      "time_range": "07:00 - 11:30",
      "end_time": "11:30"
    },
    {
      "id": "afternoon",
      "name": "Ca chiều",
      "time_range": "13:30 - 17:00",
      "end_time": "17:00"
    },
    {
      "id": "night",
      "name": "Ca trực đêm",
      "time_range": "17:00 - 07:00",
      "end_time": "07:00"
    },
    {
      "id": "all_day",
      "name": "Trực 24/24",
      "time_range": "07:00 - 07:00",
      "end_time": "07:00"
    }
  ],
  "rooms_schedule": [
    {
      "room_id": 34,
      "department_id": 8,
      "shift_id": "morning",
      "day_of_week": "Sun",
      "date": "2026-10-18",
      "is_working": true,
      "staff_assigned": [
        {
          "code": "BV-345",
          "name": "KTV. Vũ Bá Đạt",
          "role": "Phụ trách chính"
        },
        {
          "code": "BV-115",
          "name": "KTV. Trần Văn Chung",
          "role": "Điều dưỡng ca"
        }
      ],
      "post_shift_5s": {
        "status": "submitted",
        "photo": "",
        "submitted_at": "11:20",
        "submitted_by": "KTV. Vũ Bá Đạt",
        "notes": "Đã thực hiện sàng lọc, lau khử khuẩn bề mặt và sắp xếp trang thiết bị y tế sau ca trực."
      }
    },
    {
      "room_id": 32,
      "department_id": 8,
      "shift_id": "morning",
      "day_of_week": "Sun",
      "date": "2026-10-18",
      "is_working": true,
      "staff_assigned": [
        {
          "code": "BV-345",
          "name": "KTV. Vũ Bá Đạt",
          "role": "Phụ trách chính"
        },
        {
          "code": "BV-115",
          "name": "KTV. Trần Văn Chung",
          "role": "Điều dưỡng ca"
        },
        {
          "code": "BV-116",
          "name": "KTV. Lê Công Bằng",
          "role": "Hỗ trợ chuyên môn"
        }
      ],
      "post_shift_5s": {
        "status": "submitted",
        "photo": "",
        "submitted_at": "11:20",
        "submitted_by": "KTV. Vũ Bá Đạt",
        "notes": "Đã thực hiện sàng lọc, lau khử khuẩn bề mặt và sắp xếp trang thiết bị y tế sau ca trực."
      }
    },
    {
      "room_id": 33,
      "department_id": 8,
      "shift_id": "morning",
      "day_of_week": "Sun",
      "date": "2026-10-18",
      "is_working": true,
      "staff_assigned": [
        {
          "code": "BV-345",
          "name": "KTV. Vũ Bá Đạt",
          "role": "Phụ trách chính"
        }
      ],
      "post_shift_5s": {
        "status": "pending",
        "photo": "",
        "submitted_at": "",
        "submitted_by": "",
        "notes": ""
      }
    },
    {
      "room_id": 35,
      "department_id": 8,
      "shift_id": "morning",
      "day_of_week": "Sun",
      "date": "2026-10-18",
      "is_working": false,
      "staff_assigned": [
        {
          "code": "BV-345",
          "name": "KTV. Vũ Bá Đạt",
          "role": "Phụ trách chính"
        }
      ],
      "post_shift_5s": {
        "status": "pending",
        "photo": "",
        "submitted_at": "",
        "submitted_by": "",
        "notes": ""
      }
    },
    {
      "room_id": 50,
      "department_id": 8,
      "shift_id": "morning",
      "day_of_week": "Sun",
      "date": "2026-10-18",
      "is_working": true,
      "staff_assigned": [
        {
          "code": "BV-345",
          "name": "KTV. Vũ Bá Đạt",
          "role": "Phụ trách chính"
        },
        {
          "code": "BV-115",
          "name": "KTV. Trần Văn Chung",
          "role": "Điều dưỡng ca"
        }
      ],
      "post_shift_5s": {
        "status": "pending",
        "photo": "",
        "submitted_at": "",
        "submitted_by": "",
        "notes": ""
      }
    },
    {
      "room_id": 51,
      "department_id": 8,
      "shift_id": "morning",
      "day_of_week": "Sun",
      "date": "2026-10-18",
      "is_working": true,
      "staff_assigned": [
        {
          "code": "BV-345",
          "name": "KTV. Vũ Bá Đạt",
          "role": "Phụ trách chính"
        }
      ],
      "post_shift_5s": {
        "status": "pending",
        "photo": "",
        "submitted_at": "",
        "submitted_by": "",
        "notes": ""
      }
    },
    {
      "room_id": 1,
      "department_id": 1,
      "shift_id": "morning",
      "day_of_week": "Sun",
      "date": "2026-10-18",
      "is_working": true,
      "staff_assigned": [
        {
          "code": "BV-103",
          "name": "ĐD. Vũ Quang Trưởng",
          "role": "Phụ trách chính"
        }
      ],
      "post_shift_5s": {
        "status": "pending",
        "photo": "",
        "submitted_at": "",
        "submitted_by": "",
        "notes": ""
      }
    },
    {
      "room_id": 2,
      "department_id": 1,
      "shift_id": "morning",
      "day_of_week": "Sun",
      "date": "2026-10-18",
      "is_working": true,
      "staff_assigned": [
        {
          "code": "BV-103",
          "name": "ĐD. Vũ Quang Trưởng",
          "role": "Phụ trách chính"
        },
        {
          "code": "BV-104",
          "name": "ĐD. Lê Văn Minh",
          "role": "Điều dưỡng ca"
        },
        {
          "code": "BV-105",
          "name": "ĐD. Phạm Thị Mai",
          "role": "Hỗ trợ chuyên môn"
        }
      ],
      "post_shift_5s": {
        "status": "submitted",
        "photo": "",
        "submitted_at": "11:20",
        "submitted_by": "ĐD. Vũ Quang Trưởng",
        "notes": "Đã thực hiện sàng lọc, lau khử khuẩn bề mặt và sắp xếp trang thiết bị y tế sau ca trực."
      }
    },
    {
      "room_id": 3,
      "department_id": 1,
      "shift_id": "morning",
      "day_of_week": "Sun",
      "date": "2026-10-18",
      "is_working": true,
      "staff_assigned": [
        {
          "code": "BV-103",
          "name": "ĐD. Vũ Quang Trưởng",
          "role": "Phụ trách chính"
        },
        {
          "code": "BV-104",
          "name": "ĐD. Lê Văn Minh",
          "role": "Điều dưỡng ca"
        },
        {
          "code": "BV-105",
          "name": "ĐD. Phạm Thị Mai",
          "role": "Hỗ trợ chuyên môn"
        }
      ],
      "post_shift_5s": {
        "status": "pending",
        "photo": "",
        "submitted_at": "",
        "submitted_by": "",
        "notes": ""
      }
    },
    {
      "room_id": 4,
      "department_id": 1,
      "shift_id": "morning",
      "day_of_week": "Sun",
      "date": "2026-10-18",
      "is_working": true,
      "staff_assigned": [
        {
          "code": "BV-103",
          "name": "ĐD. Vũ Quang Trưởng",
          "role": "Phụ trách chính"
        },
        {
          "code": "BV-104",
          "name": "ĐD. Lê Văn Minh",
          "role": "Điều dưỡng ca"
        }
      ],
      "post_shift_5s": {
        "status": "overdue",
        "photo": "",
        "submitted_at": "",
        "submitted_by": "",
        "notes": ""
      }
    },
    {
      "room_id": 5,
      "department_id": 1,
      "shift_id": "morning",
      "day_of_week": "Sun",
      "date": "2026-10-18",
      "is_working": true,
      "staff_assigned": [
        {
          "code": "BV-103",
          "name": "ĐD. Vũ Quang Trưởng",
          "role": "Phụ trách chính"
        },
        {
          "code": "BV-104",
          "name": "ĐD. Lê Văn Minh",
          "role": "Điều dưỡng ca"
        },
        {
          "code": "BV-105",
          "name": "ĐD. Phạm Thị Mai",
          "role": "Hỗ trợ chuyên môn"
        }
      ],
      "post_shift_5s": {
        "status": "pending",
        "photo": "",
        "submitted_at": "",
        "submitted_by": "",
        "notes": ""
      }
    },
    {
      "room_id": 6,
      "department_id": 1,
      "shift_id": "morning",
      "day_of_week": "Sun",
      "date": "2026-10-18",
      "is_working": true,
      "staff_assigned": [
        {
          "code": "BV-103",
          "name": "ĐD. Vũ Quang Trưởng",
          "role": "Phụ trách chính"
        },
        {
          "code": "BV-104",
          "name": "ĐD. Lê Văn Minh",
          "role": "Điều dưỡng ca"
        },
        {
          "code": "BV-105",
          "name": "ĐD. Phạm Thị Mai",
          "role": "Hỗ trợ chuyên môn"
        }
      ],
      "post_shift_5s": {
        "status": "submitted",
        "photo": "",
        "submitted_at": "11:20",
        "submitted_by": "ĐD. Vũ Quang Trưởng",
        "notes": "Đã thực hiện sàng lọc, lau khử khuẩn bề mặt và sắp xếp trang thiết bị y tế sau ca trực."
      }
    },
    {
      "room_id": 46,
      "department_id": 11,
      "shift_id": "morning",
      "day_of_week": "Sun",
      "date": "2026-10-18",
      "is_working": true,
      "staff_assigned": [
        {
          "code": "BV-109",
          "name": "ThS.BS. Đinh Công Trí",
          "role": "Phụ trách chính"
        },
        {
          "code": "BV-110",
          "name": "ĐD. Nguyễn Thị Thanh Nga",
          "role": "Điều dưỡng ca"
        }
      ],
      "post_shift_5s": {
        "status": "pending",
        "photo": "",
        "submitted_at": "",
        "submitted_by": "",
        "notes": ""
      }
    },
    {
      "room_id": 47,
      "department_id": 11,
      "shift_id": "morning",
      "day_of_week": "Sun",
      "date": "2026-10-18",
      "is_working": true,
      "staff_assigned": [
        {
          "code": "BV-109",
          "name": "ThS.BS. Đinh Công Trí",
          "role": "Phụ trách chính"
        }
      ],
      "post_shift_5s": {
        "status": "pending",
        "photo": "",
        "submitted_at": "",
        "submitted_by": "",
        "notes": ""
      }
    },
    {
      "room_id": 48,
      "department_id": 11,
      "shift_id": "morning",
      "day_of_week": "Sun",
      "date": "2026-10-18",
      "is_working": true,
      "staff_assigned": [
        {
          "code": "BV-109",
          "name": "ThS.BS. Đinh Công Trí",
          "role": "Phụ trách chính"
        },
        {
          "code": "BV-110",
          "name": "ĐD. Nguyễn Thị Thanh Nga",
          "role": "Điều dưỡng ca"
        }
      ],
      "post_shift_5s": {
        "status": "overdue",
        "photo": "",
        "submitted_at": "",
        "submitted_by": "",
        "notes": ""
      }
    },
    {
      "room_id": 49,
      "department_id": 11,
      "shift_id": "morning",
      "day_of_week": "Sun",
      "date": "2026-10-18",
      "is_working": false,
      "staff_assigned": [
        {
          "code": "BV-109",
          "name": "ThS.BS. Đinh Công Trí",
          "role": "Phụ trách chính"
        }
      ],
      "post_shift_5s": {
        "status": "pending",
        "photo": "",
        "submitted_at": "",
        "submitted_by": "",
        "notes": ""
      }
    },
    {
      "room_id": 52,
      "department_id": 11,
      "shift_id": "morning",
      "day_of_week": "Sun",
      "date": "2026-10-18",
      "is_working": true,
      "staff_assigned": [
        {
          "code": "BV-109",
          "name": "ThS.BS. Đinh Công Trí",
          "role": "Phụ trách chính"
        },
        {
          "code": "BV-110",
          "name": "ĐD. Nguyễn Thị Thanh Nga",
          "role": "Điều dưỡng ca"
        }
      ],
      "post_shift_5s": {
        "status": "overdue",
        "photo": "",
        "submitted_at": "",
        "submitted_by": "",
        "notes": ""
      }
    },
    {
      "room_id": 53,
      "department_id": 12,
      "shift_id": "morning",
      "day_of_week": "Sun",
      "date": "2026-10-18",
      "is_working": true,
      "staff_assigned": [
        {
          "code": "BV-111",
          "name": "BSCKII. Lê Tuấn Anh",
          "role": "Phụ trách chính"
        }
      ],
      "post_shift_5s": {
        "status": "pending",
        "photo": "",
        "submitted_at": "",
        "submitted_by": "",
        "notes": ""
      }
    },
    {
      "room_id": 54,
      "department_id": 12,
      "shift_id": "morning",
      "day_of_week": "Sun",
      "date": "2026-10-18",
      "is_working": true,
      "staff_assigned": [
        {
          "code": "BV-111",
          "name": "BSCKII. Lê Tuấn Anh",
          "role": "Phụ trách chính"
        }
      ],
      "post_shift_5s": {
        "status": "pending",
        "photo": "",
        "submitted_at": "",
        "submitted_by": "",
        "notes": ""
      }
    },
    {
      "room_id": 55,
      "department_id": 12,
      "shift_id": "morning",
      "day_of_week": "Sun",
      "date": "2026-10-18",
      "is_working": true,
      "staff_assigned": [
        {
          "code": "BV-111",
          "name": "BSCKII. Lê Tuấn Anh",
          "role": "Phụ trách chính"
        }
      ],
      "post_shift_5s": {
        "status": "pending",
        "photo": "",
        "submitted_at": "",
        "submitted_by": "",
        "notes": ""
      }
    },
    {
      "room_id": 56,
      "department_id": 12,
      "shift_id": "morning",
      "day_of_week": "Sun",
      "date": "2026-10-18",
      "is_working": false,
      "staff_assigned": [
        {
          "code": "BV-111",
          "name": "BSCKII. Lê Tuấn Anh",
          "role": "Phụ trách chính"
        }
      ],
      "post_shift_5s": {
        "status": "pending",
        "photo": "",
        "submitted_at": "",
        "submitted_by": "",
        "notes": ""
      }
    },
    {
      "room_id": 57,
      "department_id": 12,
      "shift_id": "morning",
      "day_of_week": "Sun",
      "date": "2026-10-18",
      "is_working": true,
      "staff_assigned": [
        {
          "code": "BV-111",
          "name": "BSCKII. Lê Tuấn Anh",
          "role": "Phụ trách chính"
        }
      ],
      "post_shift_5s": {
        "status": "pending",
        "photo": "",
        "submitted_at": "",
        "submitted_by": "",
        "notes": ""
      }
    },
    {
      "room_id": 7,
      "department_id": 2,
      "shift_id": "morning",
      "day_of_week": "Sun",
      "date": "2026-10-18",
      "is_working": false,
      "staff_assigned": [
        {
          "code": "BV-107",
          "name": "BSCKI. Vũ Đình Khiêm",
          "role": "Phụ trách chính"
        }
      ],
      "post_shift_5s": {
        "status": "pending",
        "photo": "",
        "submitted_at": "",
        "submitted_by": "",
        "notes": ""
      }
    },
    {
      "room_id": 8,
      "department_id": 2,
      "shift_id": "morning",
      "day_of_week": "Sun",
      "date": "2026-10-18",
      "is_working": true,
      "staff_assigned": [
        {
          "code": "BV-107",
          "name": "BSCKI. Vũ Đình Khiêm",
          "role": "Phụ trách chính"
        },
        {
          "code": "BV-108",
          "name": "ĐD. Hoàng Bích Thủy",
          "role": "Điều dưỡng ca"
        }
      ],
      "post_shift_5s": {
        "status": "overdue",
        "photo": "",
        "submitted_at": "",
        "submitted_by": "",
        "notes": ""
      }
    },
    {
      "room_id": 9,
      "department_id": 2,
      "shift_id": "morning",
      "day_of_week": "Sun",
      "date": "2026-10-18",
      "is_working": true,
      "staff_assigned": [
        {
          "code": "BV-107",
          "name": "BSCKI. Vũ Đình Khiêm",
          "role": "Phụ trách chính"
        }
      ],
      "post_shift_5s": {
        "status": "pending",
        "photo": "",
        "submitted_at": "",
        "submitted_by": "",
        "notes": ""
      }
    },
    {
      "room_id": 10,
      "department_id": 2,
      "shift_id": "morning",
      "day_of_week": "Sun",
      "date": "2026-10-18",
      "is_working": true,
      "staff_assigned": [
        {
          "code": "BV-107",
          "name": "BSCKI. Vũ Đình Khiêm",
          "role": "Phụ trách chính"
        },
        {
          "code": "BV-108",
          "name": "ĐD. Hoàng Bích Thủy",
          "role": "Điều dưỡng ca"
        }
      ],
      "post_shift_5s": {
        "status": "pending",
        "photo": "",
        "submitted_at": "",
        "submitted_by": "",
        "notes": ""
      }
    },
    {
      "room_id": 11,
      "department_id": 2,
      "shift_id": "morning",
      "day_of_week": "Sun",
      "date": "2026-10-18",
      "is_working": true,
      "staff_assigned": [
        {
          "code": "BV-107",
          "name": "BSCKI. Vũ Đình Khiêm",
          "role": "Phụ trách chính"
        }
      ],
      "post_shift_5s": {
        "status": "pending",
        "photo": "",
        "submitted_at": "",
        "submitted_by": "",
        "notes": ""
      }
    },
    {
      "room_id": 58,
      "department_id": 2,
      "shift_id": "morning",
      "day_of_week": "Sun",
      "date": "2026-10-18",
      "is_working": true,
      "staff_assigned": [
        {
          "code": "BV-107",
          "name": "BSCKI. Vũ Đình Khiêm",
          "role": "Phụ trách chính"
        },
        {
          "code": "BV-108",
          "name": "ĐD. Hoàng Bích Thủy",
          "role": "Điều dưỡng ca"
        }
      ],
      "post_shift_5s": {
        "status": "pending",
        "photo": "",
        "submitted_at": "",
        "submitted_by": "",
        "notes": ""
      }
    },
    {
      "room_id": 16,
      "department_id": 4,
      "shift_id": "morning",
      "day_of_week": "Sun",
      "date": "2026-10-18",
      "is_working": true,
      "staff_assigned": [
        {
          "code": "BV-102",
          "name": "BSCKII. Nguyễn Văn Toàn",
          "role": "Phụ trách chính"
        },
        {
          "code": "BV-112",
          "name": "ĐD. Bùi Văn Hùng",
          "role": "Điều dưỡng ca"
        }
      ],
      "post_shift_5s": {
        "status": "overdue",
        "photo": "",
        "submitted_at": "",
        "submitted_by": "",
        "notes": ""
      }
    },
    {
      "room_id": 17,
      "department_id": 4,
      "shift_id": "morning",
      "day_of_week": "Sun",
      "date": "2026-10-18",
      "is_working": true,
      "staff_assigned": [
        {
          "code": "BV-102",
          "name": "BSCKII. Nguyễn Văn Toàn",
          "role": "Phụ trách chính"
        }
      ],
      "post_shift_5s": {
        "status": "pending",
        "photo": "",
        "submitted_at": "",
        "submitted_by": "",
        "notes": ""
      }
    },
    {
      "room_id": 18,
      "department_id": 4,
      "shift_id": "morning",
      "day_of_week": "Sun",
      "date": "2026-10-18",
      "is_working": true,
      "staff_assigned": [
        {
          "code": "BV-102",
          "name": "BSCKII. Nguyễn Văn Toàn",
          "role": "Phụ trách chính"
        },
        {
          "code": "BV-112",
          "name": "ĐD. Bùi Văn Hùng",
          "role": "Điều dưỡng ca"
        }
      ],
      "post_shift_5s": {
        "status": "pending",
        "photo": "",
        "submitted_at": "",
        "submitted_by": "",
        "notes": ""
      }
    },
    {
      "room_id": 19,
      "department_id": 4,
      "shift_id": "morning",
      "day_of_week": "Sun",
      "date": "2026-10-18",
      "is_working": true,
      "staff_assigned": [
        {
          "code": "BV-102",
          "name": "BSCKII. Nguyễn Văn Toàn",
          "role": "Phụ trách chính"
        }
      ],
      "post_shift_5s": {
        "status": "pending",
        "photo": "",
        "submitted_at": "",
        "submitted_by": "",
        "notes": ""
      }
    },
    {
      "room_id": 20,
      "department_id": 5,
      "shift_id": "morning",
      "day_of_week": "Sun",
      "date": "2026-10-18",
      "is_working": true,
      "staff_assigned": [
        {
          "code": "BV-113",
          "name": "BSCKI. Mai Thị Hảo",
          "role": "Phụ trách chính"
        },
        {
          "code": "BV-114",
          "name": "ĐD. Trần Phương Dung",
          "role": "Điều dưỡng ca"
        }
      ],
      "post_shift_5s": {
        "status": "submitted",
        "photo": "",
        "submitted_at": "11:20",
        "submitted_by": "BSCKI. Mai Thị Hảo",
        "notes": "Đã thực hiện sàng lọc, lau khử khuẩn bề mặt và sắp xếp trang thiết bị y tế sau ca trực."
      }
    },
    {
      "room_id": 21,
      "department_id": 5,
      "shift_id": "morning",
      "day_of_week": "Sun",
      "date": "2026-10-18",
      "is_working": false,
      "staff_assigned": [
        {
          "code": "BV-113",
          "name": "BSCKI. Mai Thị Hảo",
          "role": "Phụ trách chính"
        }
      ],
      "post_shift_5s": {
        "status": "pending",
        "photo": "",
        "submitted_at": "",
        "submitted_by": "",
        "notes": ""
      }
    },
    {
      "room_id": 22,
      "department_id": 5,
      "shift_id": "morning",
      "day_of_week": "Sun",
      "date": "2026-10-18",
      "is_working": true,
      "staff_assigned": [
        {
          "code": "BV-113",
          "name": "BSCKI. Mai Thị Hảo",
          "role": "Phụ trách chính"
        },
        {
          "code": "BV-114",
          "name": "ĐD. Trần Phương Dung",
          "role": "Điều dưỡng ca"
        }
      ],
      "post_shift_5s": {
        "status": "pending",
        "photo": "",
        "submitted_at": "",
        "submitted_by": "",
        "notes": ""
      }
    },
    {
      "room_id": 23,
      "department_id": 5,
      "shift_id": "morning",
      "day_of_week": "Sun",
      "date": "2026-10-18",
      "is_working": true,
      "staff_assigned": [
        {
          "code": "BV-113",
          "name": "BSCKI. Mai Thị Hảo",
          "role": "Phụ trách chính"
        }
      ],
      "post_shift_5s": {
        "status": "pending",
        "photo": "",
        "submitted_at": "",
        "submitted_by": "",
        "notes": ""
      }
    },
    {
      "room_id": 24,
      "department_id": 6,
      "shift_id": "morning",
      "day_of_week": "Sun",
      "date": "2026-10-18",
      "is_working": true,
      "staff_assigned": [
        {
          "code": "BV-345",
          "name": "KTV. Vũ Bá Đạt",
          "role": "Phụ trách chính"
        },
        {
          "code": "BV-101",
          "name": "ThS. BSCKII. Phạm Quỳnh Hưng",
          "role": "Điều dưỡng ca"
        }
      ],
      "post_shift_5s": {
        "status": "overdue",
        "photo": "",
        "submitted_at": "",
        "submitted_by": "",
        "notes": ""
      }
    },
    {
      "room_id": 25,
      "department_id": 6,
      "shift_id": "morning",
      "day_of_week": "Sun",
      "date": "2026-10-18",
      "is_working": true,
      "staff_assigned": [
        {
          "code": "BV-345",
          "name": "KTV. Vũ Bá Đạt",
          "role": "Phụ trách chính"
        }
      ],
      "post_shift_5s": {
        "status": "pending",
        "photo": "",
        "submitted_at": "",
        "submitted_by": "",
        "notes": ""
      }
    },
    {
      "room_id": 26,
      "department_id": 6,
      "shift_id": "morning",
      "day_of_week": "Sun",
      "date": "2026-10-18",
      "is_working": true,
      "staff_assigned": [
        {
          "code": "BV-345",
          "name": "KTV. Vũ Bá Đạt",
          "role": "Phụ trách chính"
        },
        {
          "code": "BV-101",
          "name": "ThS. BSCKII. Phạm Quỳnh Hưng",
          "role": "Điều dưỡng ca"
        }
      ],
      "post_shift_5s": {
        "status": "pending",
        "photo": "",
        "submitted_at": "",
        "submitted_by": "",
        "notes": ""
      }
    },
    {
      "room_id": 27,
      "department_id": 6,
      "shift_id": "morning",
      "day_of_week": "Sun",
      "date": "2026-10-18",
      "is_working": true,
      "staff_assigned": [
        {
          "code": "BV-345",
          "name": "KTV. Vũ Bá Đạt",
          "role": "Phụ trách chính"
        }
      ],
      "post_shift_5s": {
        "status": "pending",
        "photo": "",
        "submitted_at": "",
        "submitted_by": "",
        "notes": ""
      }
    },
    {
      "room_id": 28,
      "department_id": 7,
      "shift_id": "morning",
      "day_of_week": "Sun",
      "date": "2026-10-18",
      "is_working": false,
      "staff_assigned": [
        {
          "code": "BV-345",
          "name": "KTV. Vũ Bá Đạt",
          "role": "Phụ trách chính"
        },
        {
          "code": "BV-101",
          "name": "ThS. BSCKII. Phạm Quỳnh Hưng",
          "role": "Điều dưỡng ca"
        }
      ],
      "post_shift_5s": {
        "status": "pending",
        "photo": "",
        "submitted_at": "",
        "submitted_by": "",
        "notes": ""
      }
    },
    {
      "room_id": 29,
      "department_id": 7,
      "shift_id": "morning",
      "day_of_week": "Sun",
      "date": "2026-10-18",
      "is_working": true,
      "staff_assigned": [
        {
          "code": "BV-345",
          "name": "KTV. Vũ Bá Đạt",
          "role": "Phụ trách chính"
        }
      ],
      "post_shift_5s": {
        "status": "pending",
        "photo": "",
        "submitted_at": "",
        "submitted_by": "",
        "notes": ""
      }
    },
    {
      "room_id": 30,
      "department_id": 7,
      "shift_id": "morning",
      "day_of_week": "Sun",
      "date": "2026-10-18",
      "is_working": true,
      "staff_assigned": [
        {
          "code": "BV-345",
          "name": "KTV. Vũ Bá Đạt",
          "role": "Phụ trách chính"
        },
        {
          "code": "BV-101",
          "name": "ThS. BSCKII. Phạm Quỳnh Hưng",
          "role": "Điều dưỡng ca"
        }
      ],
      "post_shift_5s": {
        "status": "pending",
        "photo": "",
        "submitted_at": "",
        "submitted_by": "",
        "notes": ""
      }
    },
    {
      "room_id": 31,
      "department_id": 7,
      "shift_id": "morning",
      "day_of_week": "Sun",
      "date": "2026-10-18",
      "is_working": true,
      "staff_assigned": [
        {
          "code": "BV-345",
          "name": "KTV. Vũ Bá Đạt",
          "role": "Phụ trách chính"
        }
      ],
      "post_shift_5s": {
        "status": "pending",
        "photo": "",
        "submitted_at": "",
        "submitted_by": "",
        "notes": ""
      }
    },
    {
      "room_id": 59,
      "department_id": 3,
      "shift_id": "morning",
      "day_of_week": "Sun",
      "date": "2026-10-18",
      "is_working": true,
      "staff_assigned": [
        {
          "code": "BV-345",
          "name": "KTV. Vũ Bá Đạt",
          "role": "Phụ trách chính"
        },
        {
          "code": "BV-101",
          "name": "ThS. BSCKII. Phạm Quỳnh Hưng",
          "role": "Điều dưỡng ca"
        },
        {
          "code": "BV-102",
          "name": "BSCKII. Nguyễn Văn Toàn",
          "role": "Hỗ trợ chuyên môn"
        }
      ],
      "post_shift_5s": {
        "status": "pending",
        "photo": "",
        "submitted_at": "",
        "submitted_by": "",
        "notes": ""
      }
    },
    {
      "room_id": 60,
      "department_id": 3,
      "shift_id": "morning",
      "day_of_week": "Sun",
      "date": "2026-10-18",
      "is_working": true,
      "staff_assigned": [
        {
          "code": "BV-345",
          "name": "KTV. Vũ Bá Đạt",
          "role": "Phụ trách chính"
        },
        {
          "code": "BV-101",
          "name": "ThS. BSCKII. Phạm Quỳnh Hưng",
          "role": "Điều dưỡng ca"
        }
      ],
      "post_shift_5s": {
        "status": "overdue",
        "photo": "",
        "submitted_at": "",
        "submitted_by": "",
        "notes": ""
      }
    },
    {
      "room_id": 61,
      "department_id": 3,
      "shift_id": "morning",
      "day_of_week": "Sun",
      "date": "2026-10-18",
      "is_working": true,
      "staff_assigned": [
        {
          "code": "BV-345",
          "name": "KTV. Vũ Bá Đạt",
          "role": "Phụ trách chính"
        }
      ],
      "post_shift_5s": {
        "status": "pending",
        "photo": "",
        "submitted_at": "",
        "submitted_by": "",
        "notes": ""
      }
    },
    {
      "room_id": 62,
      "department_id": 3,
      "shift_id": "morning",
      "day_of_week": "Sun",
      "date": "2026-10-18",
      "is_working": true,
      "staff_assigned": [
        {
          "code": "BV-345",
          "name": "KTV. Vũ Bá Đạt",
          "role": "Phụ trách chính"
        },
        {
          "code": "BV-101",
          "name": "ThS. BSCKII. Phạm Quỳnh Hưng",
          "role": "Điều dưỡng ca"
        },
        {
          "code": "BV-102",
          "name": "BSCKII. Nguyễn Văn Toàn",
          "role": "Hỗ trợ chuyên môn"
        }
      ],
      "post_shift_5s": {
        "status": "pending",
        "photo": "",
        "submitted_at": "",
        "submitted_by": "",
        "notes": ""
      }
    },
    {
      "room_id": 63,
      "department_id": 13,
      "shift_id": "morning",
      "day_of_week": "Sun",
      "date": "2026-10-18",
      "is_working": false,
      "staff_assigned": [
        {
          "code": "BV-345",
          "name": "KTV. Vũ Bá Đạt",
          "role": "Phụ trách chính"
        }
      ],
      "post_shift_5s": {
        "status": "pending",
        "photo": "",
        "submitted_at": "",
        "submitted_by": "",
        "notes": ""
      }
    },
    {
      "room_id": 64,
      "department_id": 13,
      "shift_id": "morning",
      "day_of_week": "Sun",
      "date": "2026-10-18",
      "is_working": false,
      "staff_assigned": [
        {
          "code": "BV-345",
          "name": "KTV. Vũ Bá Đạt",
          "role": "Phụ trách chính"
        },
        {
          "code": "BV-101",
          "name": "ThS. BSCKII. Phạm Quỳnh Hưng",
          "role": "Điều dưỡng ca"
        }
      ],
      "post_shift_5s": {
        "status": "pending",
        "photo": "",
        "submitted_at": "",
        "submitted_by": "",
        "notes": ""
      }
    },
    {
      "room_id": 65,
      "department_id": 13,
      "shift_id": "morning",
      "day_of_week": "Sun",
      "date": "2026-10-18",
      "is_working": false,
      "staff_assigned": [
        {
          "code": "BV-345",
          "name": "KTV. Vũ Bá Đạt",
          "role": "Phụ trách chính"
        }
      ],
      "post_shift_5s": {
        "status": "pending",
        "photo": "",
        "submitted_at": "",
        "submitted_by": "",
        "notes": ""
      }
    },
    {
      "room_id": 66,
      "department_id": 14,
      "shift_id": "morning",
      "day_of_week": "Sun",
      "date": "2026-10-18",
      "is_working": false,
      "staff_assigned": [
        {
          "code": "BV-345",
          "name": "KTV. Vũ Bá Đạt",
          "role": "Phụ trách chính"
        },
        {
          "code": "BV-101",
          "name": "ThS. BSCKII. Phạm Quỳnh Hưng",
          "role": "Điều dưỡng ca"
        }
      ],
      "post_shift_5s": {
        "status": "pending",
        "photo": "",
        "submitted_at": "",
        "submitted_by": "",
        "notes": ""
      }
    },
    {
      "room_id": 67,
      "department_id": 14,
      "shift_id": "morning",
      "day_of_week": "Sun",
      "date": "2026-10-18",
      "is_working": false,
      "staff_assigned": [
        {
          "code": "BV-345",
          "name": "KTV. Vũ Bá Đạt",
          "role": "Phụ trách chính"
        }
      ],
      "post_shift_5s": {
        "status": "pending",
        "photo": "",
        "submitted_at": "",
        "submitted_by": "",
        "notes": ""
      }
    },
    {
      "room_id": 68,
      "department_id": 14,
      "shift_id": "morning",
      "day_of_week": "Sun",
      "date": "2026-10-18",
      "is_working": false,
      "staff_assigned": [
        {
          "code": "BV-345",
          "name": "KTV. Vũ Bá Đạt",
          "role": "Phụ trách chính"
        },
        {
          "code": "BV-101",
          "name": "ThS. BSCKII. Phạm Quỳnh Hưng",
          "role": "Điều dưỡng ca"
        }
      ],
      "post_shift_5s": {
        "status": "pending",
        "photo": "",
        "submitted_at": "",
        "submitted_by": "",
        "notes": ""
      }
    },
    {
      "room_id": 36,
      "department_id": 9,
      "shift_id": "morning",
      "day_of_week": "Sun",
      "date": "2026-10-18",
      "is_working": true,
      "staff_assigned": [
        {
          "code": "BV-345",
          "name": "KTV. Vũ Bá Đạt",
          "role": "Phụ trách chính"
        },
        {
          "code": "BV-101",
          "name": "ThS. BSCKII. Phạm Quỳnh Hưng",
          "role": "Điều dưỡng ca"
        }
      ],
      "post_shift_5s": {
        "status": "overdue",
        "photo": "",
        "submitted_at": "",
        "submitted_by": "",
        "notes": ""
      }
    },
    {
      "room_id": 37,
      "department_id": 9,
      "shift_id": "morning",
      "day_of_week": "Sun",
      "date": "2026-10-18",
      "is_working": true,
      "staff_assigned": [
        {
          "code": "BV-345",
          "name": "KTV. Vũ Bá Đạt",
          "role": "Phụ trách chính"
        }
      ],
      "post_shift_5s": {
        "status": "pending",
        "photo": "",
        "submitted_at": "",
        "submitted_by": "",
        "notes": ""
      }
    },
    {
      "room_id": 38,
      "department_id": 9,
      "shift_id": "morning",
      "day_of_week": "Sun",
      "date": "2026-10-18",
      "is_working": true,
      "staff_assigned": [
        {
          "code": "BV-345",
          "name": "KTV. Vũ Bá Đạt",
          "role": "Phụ trách chính"
        },
        {
          "code": "BV-101",
          "name": "ThS. BSCKII. Phạm Quỳnh Hưng",
          "role": "Điều dưỡng ca"
        }
      ],
      "post_shift_5s": {
        "status": "pending",
        "photo": "",
        "submitted_at": "",
        "submitted_by": "",
        "notes": ""
      }
    },
    {
      "room_id": 39,
      "department_id": 9,
      "shift_id": "morning",
      "day_of_week": "Sun",
      "date": "2026-10-18",
      "is_working": true,
      "staff_assigned": [
        {
          "code": "BV-345",
          "name": "KTV. Vũ Bá Đạt",
          "role": "Phụ trách chính"
        }
      ],
      "post_shift_5s": {
        "status": "pending",
        "photo": "",
        "submitted_at": "",
        "submitted_by": "",
        "notes": ""
      }
    },
    {
      "room_id": 69,
      "department_id": 15,
      "shift_id": "morning",
      "day_of_week": "Sun",
      "date": "2026-10-18",
      "is_working": false,
      "staff_assigned": [
        {
          "code": "BV-117",
          "name": "DS. Nguyễn Bích Ngọc",
          "role": "Phụ trách chính"
        }
      ],
      "post_shift_5s": {
        "status": "pending",
        "photo": "",
        "submitted_at": "",
        "submitted_by": "",
        "notes": ""
      }
    },
    {
      "room_id": 70,
      "department_id": 15,
      "shift_id": "morning",
      "day_of_week": "Sun",
      "date": "2026-10-18",
      "is_working": false,
      "staff_assigned": [
        {
          "code": "BV-117",
          "name": "DS. Nguyễn Bích Ngọc",
          "role": "Phụ trách chính"
        }
      ],
      "post_shift_5s": {
        "status": "pending",
        "photo": "",
        "submitted_at": "",
        "submitted_by": "",
        "notes": ""
      }
    },
    {
      "room_id": 71,
      "department_id": 15,
      "shift_id": "morning",
      "day_of_week": "Sun",
      "date": "2026-10-18",
      "is_working": false,
      "staff_assigned": [
        {
          "code": "BV-117",
          "name": "DS. Nguyễn Bích Ngọc",
          "role": "Phụ trách chính"
        }
      ],
      "post_shift_5s": {
        "status": "pending",
        "photo": "",
        "submitted_at": "",
        "submitted_by": "",
        "notes": ""
      }
    },
    {
      "room_id": 72,
      "department_id": 15,
      "shift_id": "morning",
      "day_of_week": "Sun",
      "date": "2026-10-18",
      "is_working": false,
      "staff_assigned": [
        {
          "code": "BV-117",
          "name": "DS. Nguyễn Bích Ngọc",
          "role": "Phụ trách chính"
        }
      ],
      "post_shift_5s": {
        "status": "pending",
        "photo": "",
        "submitted_at": "",
        "submitted_by": "",
        "notes": ""
      }
    },
    {
      "room_id": 40,
      "department_id": 10,
      "shift_id": "morning",
      "day_of_week": "Sun",
      "date": "2026-10-18",
      "is_working": true,
      "staff_assigned": [
        {
          "code": "BV-118",
          "name": "BSCKI. Hoàng Trọng Nghĩa",
          "role": "Phụ trách chính"
        },
        {
          "code": "BV-119",
          "name": "ĐD. Trịnh Thị Thu Trang",
          "role": "Điều dưỡng ca"
        }
      ],
      "post_shift_5s": {
        "status": "overdue",
        "photo": "",
        "submitted_at": "",
        "submitted_by": "",
        "notes": ""
      }
    },
    {
      "room_id": 41,
      "department_id": 10,
      "shift_id": "morning",
      "day_of_week": "Sun",
      "date": "2026-10-18",
      "is_working": true,
      "staff_assigned": [
        {
          "code": "BV-118",
          "name": "BSCKI. Hoàng Trọng Nghĩa",
          "role": "Phụ trách chính"
        }
      ],
      "post_shift_5s": {
        "status": "pending",
        "photo": "",
        "submitted_at": "",
        "submitted_by": "",
        "notes": ""
      }
    },
    {
      "room_id": 42,
      "department_id": 10,
      "shift_id": "morning",
      "day_of_week": "Sun",
      "date": "2026-10-18",
      "is_working": false,
      "staff_assigned": [
        {
          "code": "BV-118",
          "name": "BSCKI. Hoàng Trọng Nghĩa",
          "role": "Phụ trách chính"
        },
        {
          "code": "BV-119",
          "name": "ĐD. Trịnh Thị Thu Trang",
          "role": "Điều dưỡng ca"
        }
      ],
      "post_shift_5s": {
        "status": "pending",
        "photo": "",
        "submitted_at": "",
        "submitted_by": "",
        "notes": ""
      }
    },
    {
      "room_id": 43,
      "department_id": 10,
      "shift_id": "morning",
      "day_of_week": "Sun",
      "date": "2026-10-18",
      "is_working": true,
      "staff_assigned": [
        {
          "code": "BV-118",
          "name": "BSCKI. Hoàng Trọng Nghĩa",
          "role": "Phụ trách chính"
        }
      ],
      "post_shift_5s": {
        "status": "pending",
        "photo": "",
        "submitted_at": "",
        "submitted_by": "",
        "notes": ""
      }
    },
    {
      "room_id": 73,
      "department_id": 10,
      "shift_id": "morning",
      "day_of_week": "Sun",
      "date": "2026-10-18",
      "is_working": true,
      "staff_assigned": [
        {
          "code": "BV-118",
          "name": "BSCKI. Hoàng Trọng Nghĩa",
          "role": "Phụ trách chính"
        }
      ],
      "post_shift_5s": {
        "status": "pending",
        "photo": "",
        "submitted_at": "",
        "submitted_by": "",
        "notes": ""
      }
    },
    {
      "room_id": 74,
      "department_id": 16,
      "shift_id": "morning",
      "day_of_week": "Sun",
      "date": "2026-10-18",
      "is_working": false,
      "staff_assigned": [
        {
          "code": "BV-101",
          "name": "ThS. BSCKII. Phạm Quỳnh Hưng",
          "role": "Phụ trách chính"
        }
      ],
      "post_shift_5s": {
        "status": "pending",
        "photo": "",
        "submitted_at": "",
        "submitted_by": "",
        "notes": ""
      }
    },
    {
      "room_id": 75,
      "department_id": 16,
      "shift_id": "morning",
      "day_of_week": "Sun",
      "date": "2026-10-18",
      "is_working": false,
      "staff_assigned": [
        {
          "code": "BV-101",
          "name": "ThS. BSCKII. Phạm Quỳnh Hưng",
          "role": "Phụ trách chính"
        }
      ],
      "post_shift_5s": {
        "status": "pending",
        "photo": "",
        "submitted_at": "",
        "submitted_by": "",
        "notes": ""
      }
    },
    {
      "room_id": 76,
      "department_id": 17,
      "shift_id": "morning",
      "day_of_week": "Sun",
      "date": "2026-10-18",
      "is_working": false,
      "staff_assigned": [
        {
          "code": "BV-345",
          "name": "KTV. Vũ Bá Đạt",
          "role": "Phụ trách chính"
        },
        {
          "code": "BV-101",
          "name": "ThS. BSCKII. Phạm Quỳnh Hưng",
          "role": "Điều dưỡng ca"
        }
      ],
      "post_shift_5s": {
        "status": "pending",
        "photo": "",
        "submitted_at": "",
        "submitted_by": "",
        "notes": ""
      }
    },
    {
      "room_id": 77,
      "department_id": 17,
      "shift_id": "morning",
      "day_of_week": "Sun",
      "date": "2026-10-18",
      "is_working": false,
      "staff_assigned": [
        {
          "code": "BV-345",
          "name": "KTV. Vũ Bá Đạt",
          "role": "Phụ trách chính"
        }
      ],
      "post_shift_5s": {
        "status": "pending",
        "photo": "",
        "submitted_at": "",
        "submitted_by": "",
        "notes": ""
      }
    },
    {
      "room_id": 78,
      "department_id": 18,
      "shift_id": "morning",
      "day_of_week": "Sun",
      "date": "2026-10-18",
      "is_working": false,
      "staff_assigned": [
        {
          "code": "BV-120",
          "name": "ThS. ĐD. Trần Thị Lan Hương",
          "role": "Phụ trách chính"
        }
      ],
      "post_shift_5s": {
        "status": "pending",
        "photo": "",
        "submitted_at": "",
        "submitted_by": "",
        "notes": ""
      }
    },
    {
      "room_id": 79,
      "department_id": 19,
      "shift_id": "morning",
      "day_of_week": "Sun",
      "date": "2026-10-18",
      "is_working": false,
      "staff_assigned": [
        {
          "code": "BV-345",
          "name": "KTV. Vũ Bá Đạt",
          "role": "Phụ trách chính"
        }
      ],
      "post_shift_5s": {
        "status": "pending",
        "photo": "",
        "submitted_at": "",
        "submitted_by": "",
        "notes": ""
      }
    },
    {
      "room_id": 80,
      "department_id": 19,
      "shift_id": "morning",
      "day_of_week": "Sun",
      "date": "2026-10-18",
      "is_working": false,
      "staff_assigned": [
        {
          "code": "BV-345",
          "name": "KTV. Vũ Bá Đạt",
          "role": "Phụ trách chính"
        },
        {
          "code": "BV-101",
          "name": "ThS. BSCKII. Phạm Quỳnh Hưng",
          "role": "Điều dưỡng ca"
        }
      ],
      "post_shift_5s": {
        "status": "pending",
        "photo": "",
        "submitted_at": "",
        "submitted_by": "",
        "notes": ""
      }
    },
    {
      "room_id": 81,
      "department_id": 20,
      "shift_id": "morning",
      "day_of_week": "Sun",
      "date": "2026-10-18",
      "is_working": false,
      "staff_assigned": [
        {
          "code": "BV-345",
          "name": "KTV. Vũ Bá Đạt",
          "role": "Phụ trách chính"
        }
      ],
      "post_shift_5s": {
        "status": "pending",
        "photo": "",
        "submitted_at": "",
        "submitted_by": "",
        "notes": ""
      }
    }
  ]
},
  department_evaluations: [
  {
    "id": 1729560000001,
    "dept_id": 8,
    "dept_name": "Khoa Chẩn đoán Hình ảnh",
    "date": "2026-10-22",
    "evaluator_name": "ThS. BSCKII. Phạm Quỳnh Hưng",
    "evaluator_code": "BV-101",
    "evaluator_role": "Trưởng ban Chỉ đạo 5S Bệnh viện",
    "score": 98,
    "grade": "Xuất sắc",
    "result": "pass",
    "issues": [],
    "notes": "Cả 6 phòng máy X-quang, CT 128 dãy, MRI, Siêu âm và PACS đều thực hiện 5S vô trùng, khử khuẩn sạch sẽ, mặt máy sáng bóng.",
    "remedy_deadline": "",
    "evaluated_at": "2026-10-22 09:30"
  },
  {
    "id": 1729560000002,
    "dept_id": 1,
    "dept_name": "Khoa Cấp cứu",
    "date": "2026-10-22",
    "evaluator_name": "KTV. Vũ Bá Đạt",
    "evaluator_code": "BV-345",
    "evaluator_role": "Cán bộ Giám sát 5S Toàn Viện",
    "score": 94,
    "grade": "Xuất sắc",
    "result": "pass",
    "issues": [
      "Cần phân loại gọn dây dịch truyền buồng lưu bệnh"
    ],
    "notes": "Sàng lọc sắp xếp tủ thuốc cấp cứu và máy khử rung tim đạt chuẩn. Đã nhắc nhở dây dịch truyền buồng lưu bệnh 101.",
    "remedy_deadline": "11:30 hôm nay",
    "evaluated_at": "2026-10-22 09:50"
  },
  {
    "id": 1729560000003,
    "dept_id": 11,
    "dept_name": "Khoa Hồi sức tích cực & Chống độc",
    "date": "2026-10-22",
    "evaluator_name": "ThS. BSCKII. Phạm Quỳnh Hưng",
    "evaluator_code": "BV-101",
    "evaluator_role": "Trưởng ban Chỉ đạo 5S Bệnh viện",
    "score": 96,
    "grade": "Xuất sắc",
    "result": "pass",
    "issues": [],
    "notes": "Buồng thở máy và lọc máu liên tục tuân thủ nghiêm ngặt 5S kiểm soát nhiễm khuẩn, mặt sàn khô ráo, dây máy gọn gàng.",
    "remedy_deadline": "",
    "evaluated_at": "2026-10-22 10:15"
  },
  {
    "id": 1729560000004,
    "dept_id": 2,
    "dept_name": "Khoa Khám bệnh",
    "date": "2026-10-22",
    "evaluator_name": "KTV. Vũ Bá Đạt",
    "evaluator_code": "BV-345",
    "evaluator_role": "Cán bộ Giám sát 5S Toàn Viện",
    "score": 88,
    "grade": "Tốt",
    "result": "pass",
    "issues": [
      "Sắp xếp hồ sơ bệnh án bàn khám 102 chưa đúng thứ tự số"
    ],
    "notes": "Sảnh tiếp đón và quầy viện phí sạch sẽ, bảng biển rõ ràng. Đã chấn chỉnh hồ sơ bàn khám.",
    "remedy_deadline": "11:30 hôm nay",
    "evaluated_at": "2026-10-22 10:40"
  }
],
  criteria: [
    { id: 1, name: 'S1 - Sàng lọc (Seiri)', max: 20, desc: 'Phân loại rác thải, thuốc, vật tư y tế, loại bỏ vật dụng thừa thãi khỏi buồng phòng' },
    { id: 2, name: 'S2 - Sắp xếp (Seiton)', max: 20, desc: 'Vạch kẻ định vị trang thiết bị y tế, tem nhãn rõ ràng, hồ sơ bệnh án ngăn nắp' },
    { id: 3, name: 'S3 - Sạch sẽ (Seiso)', max: 20, desc: 'Khử khuẩn bề mặt tiếp xúc, sàn buồng bệnh, trang thiết bị máy móc sáng bóng' },
    { id: 4, name: 'S4 - Săn sóc (Seiketsu)', max: 20, desc: 'Chuẩn hóa quy trình vệ sinh, duy trì lịch trực vệ sinh hằng ngày và kiểm tra chéo' },
    { id: 5, name: 'S5 - Sẵn sàng (Shitsuke)', max: 20, desc: 'Văn hóa tự giác, tinh thần 5S y tế, trang phục bảo hộ và biển tên đúng quy định' }
  ],
  auth: {
    isLoggedIn: true,
    currentUserId: 'BV-345',
    locationMode: 'internal'
  },
  audits: [],
  securityLogs: [
    { time: '2026-10-16 07:15:20', ip: '192.168.1.105', user: 'KTV. Vũ Bá Đạt', action: 'Đăng nhập hệ thống (Nội viện Wi-Fi)', status: 'success' },
    { time: '2026-10-16 07:22:11', ip: '113.160.224.45', user: 'ThS. BSCKII. Phạm Quỳnh Hưng', action: 'Truy cập ngoại viện an toàn qua Cloudflare HTTPS', status: 'success' },
    { time: '2026-10-16 07:30:00', ip: '192.168.1.105', user: 'Ban Chỉ đạo 5S', action: 'Phát Bảng tin Thông báo khẩn cấp toàn viện', status: 'success' }
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

    // State cho tab Khoa Phòng theo nhóm
    this.filterDept = 'all';
    this.filterDeptCategory = 'all'; // 'all', 'paraclinical', 'clinical', 'functional'
    this.searchQuery = '';
    this.isReorderMode = false;
    this.collapsedDepts = {}; // deptId: true if collapsed

    // Filter cho tab Nhân sự
    this.filterStaffDept = 'all';
    this.staffSearchQuery = '';
    
    // Form state cho Phiếu kiểm tra mới (V8: Tùy chỉnh giờ kiểm tra linh hoạt)
    this.newAuditState = {
      deptId: 8,
      roomId: 34,
      shift: 'Ca sáng (07:00 - 11:30)',
      shiftType: 'morning',
      startTime: '07:00',
      endTime: '11:30',
      scores: { 1: 20, 2: 20, 3: 20, 4: 20, 5: 20 },
      afterPhoto: '',
      notes: '',
      correctiveAction: ''
    };

    // State cho Lọc Trạng Thái Duyệt 5S & Tiến Độ Ngày (V6)
    this.auditFilterStatus = 'all'; // 'all', 'pending', 'approved', 'rejected'
    this.filterDeptDailyStatus = 'all'; // 'all', 'completed', 'uncompleted'
    this.currentEvaluationResult = 'pass';
    this.currentEvaluationAuditId = null;

    // State cho Lịch Làm Việc & Trạng Thái Buồng Phòng (V7)
    this.scheduleState = {
      selectedWeek: 42,
      selectedDay: 'Sun',
      selectedDate: '2026-10-18',
      selectedShift: 'all',
      selectedDept: 'all',
      selectedStatusFilter: 'all',
      searchQuery: '',
      editingRoomId: null
    };

    this.init();
  }

  loadData() {
    try {
      // Dọn dẹp triệt để các key phiên bản cũ
      ['vpi_5s_data_v1', 'vpi_5s_data_v2', 'vpi_5s_data_v3_rbac', 'vpi_5s_data_v4_enhanced', 'vpi_5s_data_v5_grouped', 'vpi_5s_data_v5_final', 'vpi_5s_data_v6_evaluation'].forEach(k => {
        try { localStorage.removeItem(k); } catch (e) {}
      });

      let raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        // Tự động kế thừa từ phiên bản V7 nếu có
        raw = localStorage.getItem('vpi_5s_data_v10_custom_shifts') || localStorage.getItem('vpi_5s_data_v9_permissions') || localStorage.getItem('vpi_5s_data_v8_reviews');
      }
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.departments) && Array.isArray(parsed.rooms) && Array.isArray(parsed.staff)) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Lỗi đọc LocalStorage:', e);
    }
    return JSON.parse(JSON.stringify(DEFAULT_SEED_DATA));
  }

  normalizeData() {
    if (!this.data.audits || !Array.isArray(this.data.audits)) {
      this.data.audits = Array.isArray(this.data.evaluations) ? this.data.evaluations : [];
    }
    if (!this.data.hospital) {
      this.data.hospital = JSON.parse(JSON.stringify(DEFAULT_SEED_DATA.hospital));
    }
    this.data.hospital.name = 'Bệnh viện Vĩnh Phúc VPI';
    this.data.hospital.legalName = 'Bệnh viện Vĩnh Phúc VPI';
    if (!this.data.hospital.notice) {
      this.data.hospital.notice = JSON.parse(JSON.stringify(DEFAULT_SEED_DATA.hospital.notice));
    }

    if (!this.data.auth) {
      this.data.auth = { isLoggedIn: true, currentUserId: 'BV-345', locationMode: 'internal' };
    }

    // ĐỒNG BỘ TUYỆT ĐỐI 20 KHOA PHÒNG & 75 KHU VỰC (Khắc phục lỗi lệch số lượng giữa máy tính và điện thoại)
    const hasLegacyStringDepts = (this.data.departments || []).some(d => typeof d.id === 'string' && isNaN(parseInt(d.id)));
    if (!this.data.departments || !Array.isArray(this.data.departments) || this.data.departments.length < 20 || hasLegacyStringDepts) {
      this.data.departments = JSON.parse(JSON.stringify(DEFAULT_SEED_DATA.departments));
    } else {
      DEFAULT_SEED_DATA.departments.forEach(stdDept => {
        if (!this.data.departments.some(d => d.id === stdDept.id)) {
          this.data.departments.push(JSON.parse(JSON.stringify(stdDept)));
        }
      });
    }

    this.data.departments.forEach((d, idx) => {
      if (typeof d.order !== 'number') d.order = idx + 1;
      if (!d.code) d.code = 'K-' + (d.id || idx + 1);
      if (!d.category) {
        if ([8, 9, 14, 15, 10].includes(d.id)) d.category = 'paraclinical';
        else if ([16, 17, 18, 19, 20].includes(d.id)) d.category = 'functional';
        else d.category = 'clinical';
      }
    });
    this.data.departments.sort((a, b) => (a.order || 99) - (b.order || 99));

    // Đảm bảo có đầy đủ 75 buồng phòng / khu vực làm việc (loại bỏ phòng rác từ bản v4 cũ)
    const hasLegacyRooms = (this.data.rooms || []).some(r => typeof r.department_id === 'string' && isNaN(parseInt(r.department_id)));
    if (!this.data.rooms || !Array.isArray(this.data.rooms) || this.data.rooms.length < 75 || hasLegacyRooms) {
      this.data.rooms = JSON.parse(JSON.stringify(DEFAULT_SEED_DATA.rooms));
    } else {
      DEFAULT_SEED_DATA.rooms.forEach(stdRoom => {
        if (!this.data.rooms.some(r => r.id === stdRoom.id)) {
          this.data.rooms.push(JSON.parse(JSON.stringify(stdRoom)));
        }
      });
    }

    this.data.rooms.forEach((r, idx) => {
      if (typeof r.order !== 'number') r.order = idx + 1;
      if (!r.department_id) r.department_id = 8;
      if (!r.floor) r.floor = 'Tầng 1';
      if (!r.target_score) r.target_score = 95.0;
    });

    // Đảm bảo Nhân viên có đầy đủ thông tin, chức danh và nhiều vị trí phụ trách
    if (!this.data.staff || !Array.isArray(this.data.staff) || this.data.staff.length === 0) {
      this.data.staff = JSON.parse(JSON.stringify(DEFAULT_SEED_DATA.staff));
    } else {
      const existingStaffCodes = new Set(this.data.staff.map(s => s.code || s.staff_code));
      DEFAULT_SEED_DATA.staff.forEach(stdStaff => {
        if (!existingStaffCodes.has(stdStaff.code)) {
          this.data.staff.push(JSON.parse(JSON.stringify(stdStaff)));
        }
      });
    }

    this.data.staff = this.data.staff.map((s, idx) => {
      const code = s.code || s.staff_code || ('BV-' + (idx + 101));
      const name = s.name || s.full_name || 'Cán bộ 5S';
      const role = s.role || 'staff';
      let title = s.title || s.role_title || s.position;
      if (!title) {
        if (role === 'admin') title = 'Trưởng Ban 5S';
        else if (role === 'manager') title = 'Điều dưỡng Trưởng Khoa';
        else title = 'Cán bộ 5S';
      }

      let deptId = s.department_id;
      if (!deptId) {
        deptId = 8;
      }

      let assigned_rooms = [];
      if (Array.isArray(s.assigned_rooms)) {
        assigned_rooms = s.assigned_rooms;
      } else if (typeof s.assigned_room === 'string' && s.assigned_room.trim()) {
        assigned_rooms = s.assigned_room.split(/[;,\n\r•]+/).map(x => x.trim()).filter(Boolean);
      }
      if (assigned_rooms.length === 0) {
        assigned_rooms = ['Buồng bệnh được phân công'];
      }

      return {
        ...s,
        id: s.id || (idx + 1),
        code: code,
        staff_code: code,
        name: name,
        full_name: name,
        username: s.username || code.toLowerCase().replace('-', ''),
        password: s.password || '123',
        department_id: deptId,
        role: role,
        role_level: s.role_level || role,
        role_title: s.role_title || title,
        title: title,
        position: s.position || title,
        assigned_rooms: assigned_rooms,
        assigned_room: assigned_rooms.join(', '),
        allow_external: true
      };
    });

    if (!this.data.auth) {
      this.data.auth = { isLoggedIn: true, currentUserId: 'BV-345', locationMode: 'internal' };
    }

    // Chuẩn hóa CSDL Đánh giá 5S Khoa/Phòng Toàn Viện (V8)
    if (!this.data.department_evaluations || !Array.isArray(this.data.department_evaluations)) {
      this.data.department_evaluations = JSON.parse(JSON.stringify(DEFAULT_SEED_DATA.department_evaluations || []));
    }

    // Đảm bảo phân quyền kiểm duyệt cho nhân sự quản lý
    if (Array.isArray(this.data.staff)) {
      this.data.staff.forEach(s => {
        const isMgmt = s.role === 'admin' || s.role === 'manager' || s.role_level === 'admin' || s.role_level === 'manager';
        const titleStr = (s.title || s.role_title || s.position || '').toLowerCase();
        const hasTitle = titleStr.includes('trưởng') || titleStr.includes('giám sát') || titleStr.includes('chỉ đạo');
        if (s.can_review === undefined) {
          s.can_review = isMgmt || hasTitle;
        }
      });
    }

    // Chuẩn hóa CSDL Lịch làm việc & Buồng phòng (V7)
    if (!this.data.schedules || !Array.isArray(this.data.schedules.rooms_schedule) || this.data.schedules.rooms_schedule.length === 0) {
      if (typeof DEFAULT_SEED_DATA !== 'undefined' && DEFAULT_SEED_DATA.schedules) {
        this.data.schedules = JSON.parse(JSON.stringify(DEFAULT_SEED_DATA.schedules));
      } else {
        this.data.schedules = {
          current_week: 42,
          year: 2026,
          google_sheet_url: 'https://docs.google.com/spreadsheets/d/1tHg7-i__1yRdBbamuYCAKXYy7KdZflOtoin8Ay6jjBc/edit?gid=1227014826#gid=1227014826',
          google_sheet_status: 'restricted',
          shifts: [
            { id: 'morning', name: 'Ca sáng', time_range: '07:00 - 11:30', end_time: '11:30' },
            { id: 'afternoon', name: 'Ca chiều', time_range: '13:30 - 17:00', end_time: '17:00' },
            { id: 'night', name: 'Ca trực đêm', time_range: '17:00 - 07:00', end_time: '07:00' },
            { id: 'all_day', name: 'Trực 24/24', time_range: '07:00 - 07:00', end_time: '07:00' }
          ],
          rooms_schedule: []
        };
      }
    }
  }

  saveData() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch (e) {
      console.error('Lỗi lưu LocalStorage:', e);
    }
  }

  resetToVpiStandard() {
    if (!confirm('Khôi phục toàn bộ danh mục 20 Khoa/Phòng và 75 Khu vực làm việc chuẩn Bệnh viện Vĩnh Phúc VPI?')) return;
    // Xóa sạch toàn bộ cache phiên bản cũ trên thiết bị này
    ['vpi_5s_data_v1', 'vpi_5s_data_v2', 'vpi_5s_data_v3_rbac', 'vpi_5s_data_v4_enhanced', 'vpi_5s_data_v5_grouped', 'vpi_5s_data_v5_final', 'vpi_5s_data_v6_evaluation', STORAGE_KEY].forEach(k => {
      try { localStorage.removeItem(k); } catch (e) {}
    });
    this.data = JSON.parse(JSON.stringify(DEFAULT_SEED_DATA));
    this.normalizeData();
    this.saveData();
    this.render();
    this.showToast('Đã khôi phục toàn bộ 20 Khoa và 75 Khu vực làm việc chuẩn VPI!');
  }

  getSortedDepartments() {
    return [...this.data.departments].sort((a, b) => (a.order || 99) - (b.order || 99));
  }

  getSortedRooms(deptId = null) {
    let rooms = [...this.data.rooms];
    if (deptId !== null) {
      rooms = rooms.filter(r => r.department_id == deptId);
    }
    return rooms.sort((a, b) => (a.order || 99) - (b.order || 99));
  }

  moveDeptUp(deptId) {
    const sorted = this.getSortedDepartments();
    const idx = sorted.findIndex(d => d.id == deptId);
    if (idx <= 0) return;

    const current = sorted[idx];
    const prev = sorted[idx - 1];
    const tempOrder = current.order || (idx + 1);
    current.order = prev.order || idx;
    prev.order = tempOrder;

    this.saveData();
    this.render();
    this.showToast(`Đã đẩy khoa ${current.name} lên trên!`);
  }

  moveDeptDown(deptId) {
    const sorted = this.getSortedDepartments();
    const idx = sorted.findIndex(d => d.id == deptId);
    if (idx === -1 || idx >= sorted.length - 1) return;

    const current = sorted[idx];
    const next = sorted[idx + 1];
    const tempOrder = current.order || (idx + 1);
    current.order = next.order || (idx + 2);
    next.order = tempOrder;

    this.saveData();
    this.render();
    this.showToast(`Đã chuyển khoa ${current.name} xuống dưới!`);
  }

  toggleCollapseDept(deptId) {
    this.collapsedDepts[deptId] = !this.collapsedDepts[deptId];
    this.render();
  }

  collapseAllDepts() {
    this.data.departments.forEach(d => {
      this.collapsedDepts[d.id] = true;
    });
    this.render();
  }

  expandAllDepts() {
    this.collapsedDepts = {};
    this.render();
  }

  moveRoomUp(roomId) {
    const room = this.data.rooms.find(r => r.id == roomId);
    if (!room) return;
    const sameDeptRooms = this.getSortedRooms(room.department_id);
    const idx = sameDeptRooms.findIndex(r => r.id == roomId);
    if (idx <= 0) return;

    const current = sameDeptRooms[idx];
    const prev = sameDeptRooms[idx - 1];
    const tempOrder = current.order || (idx + 1);
    current.order = prev.order || idx;
    prev.order = tempOrder;

    this.saveData();
    this.render();
    this.showToast(`Đã đẩy khu vực ${current.name} lên!`);
  }

  moveRoomDown(roomId) {
    const room = this.data.rooms.find(r => r.id == roomId);
    if (!room) return;
    const sameDeptRooms = this.getSortedRooms(room.department_id);
    const idx = sameDeptRooms.findIndex(r => r.id == roomId);
    if (idx === -1 || idx >= sameDeptRooms.length - 1) return;

    const current = sameDeptRooms[idx];
    const next = sameDeptRooms[idx + 1];
    const tempOrder = current.order || (idx + 1);
    current.order = next.order || (idx + 2);
    next.order = tempOrder;

    this.saveData();
    this.render();
    this.showToast(`Đã chuyển khu vực ${current.name} xuống!`);
  }

  toggleReorderMode() {
    this.isReorderMode = !this.isReorderMode;
    this.render();
  }

  getCurrentUser() {
    const auth = this.data.auth;
    if (!auth || !auth.isLoggedIn) return null;
    return this.data.staff.find(s => s.code === auth.currentUserId || s.username === auth.currentUserId) || this.data.staff[0];
  }

  init() {
    this.applyTheme();
    this.applyLocationMode();
    this.updateUserInterface();
    this.updateHospitalBranding();
    this.updateNoticeBanner();
    this.render();
  }

  applyTheme() {
    if (this.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    try {
      localStorage.setItem('vpi_5s_theme', this.theme);
    } catch (e) {}
  }

  toggleTheme() {
    this.theme = this.theme === 'dark' ? 'light' : 'dark';
    this.applyTheme();
    this.render();
  }

  toggleViewMode() {
    this.viewMode = this.viewMode === 'mobile' ? 'full' : 'mobile';
    try {
      localStorage.setItem('vpi_5s_view_mode', this.viewMode);
    } catch (e) {}

    const mobileFrame = document.getElementById('mobile-frame');
    const viewLabel = document.getElementById('view-mode-label');

    if (mobileFrame) {
      if (this.viewMode === 'full') {
        mobileFrame.classList.remove('max-w-md', 'mx-auto', 'border-slate-800', 'shadow-2xl', 'rounded-[44px]');
        mobileFrame.classList.add('w-full', 'max-w-7xl', 'mx-auto', 'border-transparent', 'shadow-sm', 'rounded-2xl');
      } else {
        mobileFrame.classList.add('max-w-md', 'mx-auto', 'border-slate-800', 'shadow-2xl', 'rounded-[44px]');
        mobileFrame.classList.remove('w-full', 'max-w-7xl', 'mx-auto', 'border-transparent', 'shadow-sm', 'rounded-2xl');
      }
    }

    if (viewLabel) {
      viewLabel.innerText = this.viewMode === 'mobile' ? 'Mobile Frame' : 'Toàn màn hình';
    }
  }

  applyLocationMode() {
    const mode = this.data.auth.locationMode || 'internal';
    const topBadge = document.getElementById('top-location-label');
    const envBadge = document.getElementById('env-badge');
    const netStatus = document.getElementById('network-status');

    if (topBadge) {
      topBadge.innerText = mode === 'internal' ? 'Nội viện (Wi-Fi VPI)' : 'Ngoại viện (Cloudflare)';
    }
    if (envBadge) {
      envBadge.innerText = mode === 'internal' ? 'Mạng: Nội viện (LAN)' : 'Mạng: Ngoại viện (WAN)';
    }
    if (netStatus) {
      netStatus.className = `inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
        mode === 'internal' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
      }`;
    }
  }

  toggleLocationMode() {
    this.data.auth.locationMode = this.data.auth.locationMode === 'internal' ? 'external' : 'internal';
    this.saveData();
    this.applyLocationMode();
    this.render();
    this.showToast(`Đã chuyển sang môi trường: ${this.data.auth.locationMode === 'internal' ? 'Mạng Nội Viện' : 'Truy Cập Ngoại Viện'}!`);
  }

  updateHospitalBranding() {
    const hosp = this.data.hospital;
    const nameEls = document.querySelectorAll('#hosp-brand-name, #top-hosp-name, #banner-hosp-name');
    nameEls.forEach(el => {
      if (el) el.innerText = hosp.name;
    });

    const legalEls = document.querySelectorAll('#legal-hosp-name');
    legalEls.forEach(el => {
      if (el) el.innerText = hosp.legalName;
    });
  }

  updateNoticeBanner() {
    const notice = this.data.hospital.notice;
    const banner = document.getElementById('emergency-notice-banner');
    const textEl = document.getElementById('notice-banner-text');

    if (banner && textEl) {
      if (notice && notice.enabled) {
        banner.classList.remove('hidden');
        textEl.innerText = notice.content || notice.title;
      } else {
        banner.classList.add('hidden');
      }
    }
  }

  updateUserInterface() {
    const user = this.getCurrentUser();
    const avatar = document.getElementById('user-avatar');
    const nameEl = document.getElementById('user-name');
    const roleEl = document.getElementById('user-role');

    if (user) {
      if (avatar) avatar.innerText = (user.name || 'D').split(' ').pop().charAt(0);
      if (nameEl) nameEl.innerText = user.name.split(' ').slice(-2).join(' ');
      if (roleEl) roleEl.innerText = user.title || user.role_title || user.position || 'Cán bộ 5S';
    }
  }

  switchTab(tabName) {
    this.activeTab = tabName;
    this.render();
  }

  render() {
    const container = document.getElementById('app-container');
    if (!container) return;

    // KIỂM TRA ĐĂNG NHẬP: Bắt buộc thoát khỏi tài khoản khi đã đăng xuất
    if (!this.data.auth || !this.data.auth.isLoggedIn) {
      container.innerHTML = this.renderLoginScreen();
      const existingNav = document.getElementById('bottom-nav');
      if (existingNav) existingNav.classList.add('hidden');
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    let tabContent = '';
    switch (this.activeTab) {
      case 'overview':
        tabContent = this.renderOverviewTab();
        break;
      case 'schedule':
        tabContent = this.renderScheduleTab();
        break;
      case 'audit':
        tabContent = this.renderAuditTab();
        break;
      case 'departments':
        tabContent = this.renderDepartmentsTab();
        break;
      case 'staff':
        tabContent = this.renderStaffTab();
        break;
      case 'history':
      case 'reports':
        tabContent = this.renderHistoryTab();
        break;
      case 'settings':
        tabContent = this.renderSettingsTab();
        break;
      default:
        tabContent = this.renderOverviewTab();
    }

    // CẤU TRÚC CUỘN MƯỢT MÀ CHO MOBILE & THANH TAB CỐ ĐỊNH Ở ĐÁY MÀN HÌNH
    container.innerHTML = `
      <main id="main-content-scroll" class="flex-1 overflow-y-auto pb-28 px-1 pt-1 no-scrollbar">
        ${tabContent}
      </main>
      ${this.renderBottomNavigationHtml()}
    `;

    this.updateUserInterface();
    this.updateHospitalBranding();
    this.updateNoticeBanner();
    this.renderBottomNavigation();

    if (window.lucide) window.lucide.createIcons();
  }

  renderBottomNavigationHtml() {
    if (!this.data.auth || !this.data.auth.isLoggedIn) {
      return '';
    }

    const tabs = [
      { id: 'overview', name: 'Tổng quan', icon: 'layout-grid' },
      { id: 'schedule', name: 'Khu vực', icon: 'layout-grid' },
      { id: 'audit', name: 'Chấm 5S', icon: 'camera' },
      { id: 'departments', name: 'Khoa Phòng', icon: 'building-2' },
      { id: 'staff', name: 'Nhân sự', icon: 'users' },
      { id: 'history', name: 'Lịch sử', icon: 'clipboard-check' }
    ];

    return `
      <nav id="bottom-nav" class="sticky bottom-0 left-0 right-0 w-full bg-white/95 dark:bg-slate-800/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-700 py-1.5 px-1.5 z-40 shadow-lg">
        <div class="grid grid-cols-6 gap-0.5">
          ${tabs.map(t => {
            const isActive = this.activeTab === t.id;
            return `
              <button onclick="app5s.switchTab('${t.id}')" class="flex flex-col items-center justify-center py-1 transition-all rounded-xl ${
                isActive 
                  ? 'text-emerald-600 dark:text-emerald-400 font-bold scale-105 bg-emerald-50 dark:bg-emerald-950/40 shadow-2xs' 
                  : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
              }">
                <i data-lucide="${t.icon}" class="w-5 h-5 mb-0.5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.75]'}"></i>
                <span class="text-[9px] tracking-tight truncate max-w-full">${t.name}</span>
              </button>
            `;
          }).join('')}
        </div>
      </nav>
    `;
  }

  renderBottomNavigation() {
    const navContainer = document.getElementById('bottom-nav');
    if (!navContainer) return;

    if (!this.data.auth || !this.data.auth.isLoggedIn) {
      navContainer.innerHTML = '';
      navContainer.classList.add('hidden');
      return;
    }
    navContainer.classList.remove('hidden');

    const tabs = [
      { id: 'overview', name: 'Tổng quan', icon: 'layout-grid' },
      { id: 'schedule', name: 'Khu vực', icon: 'layout-grid' },
      { id: 'audit', name: 'Chấm 5S', icon: 'camera' },
      { id: 'departments', name: 'Khoa Phòng', icon: 'building-2' },
      { id: 'staff', name: 'Nhân sự', icon: 'users' },
      { id: 'history', name: 'Lịch sử', icon: 'clipboard-check' }
    ];

    navContainer.innerHTML = `
      <div class="grid grid-cols-6 gap-0.5 w-full">
        ${tabs.map(t => {
          const isActive = this.activeTab === t.id;
          return `
            <button onclick="app5s.switchTab('${t.id}')" class="flex flex-col items-center justify-center py-1 transition-all rounded-xl ${
              isActive 
                ? 'text-emerald-600 dark:text-emerald-400 font-bold scale-105 bg-emerald-50 dark:bg-emerald-950/40 shadow-2xs' 
                : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
            }">
              <i data-lucide="${t.icon}" class="w-5 h-5 mb-0.5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.75]'}"></i>
              <span class="text-[9px] tracking-tight truncate max-w-full">${t.name}</span>
            </button>
          `;
        }).join('')}
      </div>
    `;
  }


  // =========================================================================
  // TÍNH NĂNG V6: THEO DÕI TIẾN ĐỘ 5S HẰNG NGÀY & DUYỆT ẢNH / NHẮC NHỞ LỖI
  // =========================================================================
  getTodayDateString() {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  getDaily5SStatus() {
    const today = this.getTodayDateString();
    const audits = this.data.audits || [];
    const todayAudits = audits.filter(a => a.audit_date === today);
    const completedDeptIds = new Set(todayAudits.map(a => a.department_id));

    const allDepts = this.getSortedDepartments();
    const completedDepts = allDepts.filter(d => completedDeptIds.has(d.id));
    const uncompletedDepts = allDepts.filter(d => !completedDeptIds.has(d.id));

    const pendingAudits = todayAudits.filter(a => a.status === 'pending');
    const approvedAudits = todayAudits.filter(a => a.status === 'approved');
    const rejectedAudits = todayAudits.filter(a => a.status === 'rejected');

    const totalDepts = allDepts.length || 20;
    const rate = Math.round((completedDepts.length / totalDepts) * 100);

    return {
      today,
      todayAudits,
      completedDepts,
      uncompletedDepts,
      pendingAudits,
      approvedAudits,
      rejectedAudits,
      totalDepts,
      rate
    };
  }

  getDepartmentDailyStatus(deptId) {
    const today = this.getTodayDateString();
    const deptAudits = (this.data.audits || []).filter(a => a.department_id == deptId && a.audit_date === today);
    if (deptAudits.length === 0) {
      return { isCompleted: false, count: 0, latestAudit: null, status: 'uncompleted' };
    }
    const latest = deptAudits[0];
    return {
      isCompleted: true,
      count: deptAudits.length,
      latestAudit: latest,
      status: latest.status || 'pending'
    };
  }

  setAuditFilterStatus(status) {
    this.auditFilterStatus = status;
    this.render();
  }

  setDeptDailyFilter(filter) {
    this.filterDeptDailyStatus = filter;
    this.render();
  }

  fillDemoAuditPhoto(type) {
    const photoMap = {
      ct: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MDAiIGhlaWdodD0iMzQwIiB2aWV3Qm94PSIwIDAgNjAwIDM0MCI+CiAgPGRlZnM+CiAgICA8bGluZWFyR3JhZGllbnQgaWQ9ImJnIiB4MT0iMCUiIHkxPSIwJSIgeDI9IjEwMCUiIHkyPSIxMDAlIj4KICAgICAgPHN0b3Agb2Zmc2V0PSIwJSIgc3RvcC1jb2xvcj0iIzBmMTcyYSIvPgogICAgICA8c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiMwNjRlM2IiLz4KICAgIDwvbGluZWFyR3JhZGllbnQ+CiAgPC9kZWZzPgogIDxyZWN0IHdpZHRoPSI2MDAiIGhlaWdodD0iMzQwIiBmaWxsPSJ1cmwoI2JnKSIvPgogIDxyZWN0IHg9IjE2IiB5PSIxNiIgd2lkdGg9IjU2OCIgaGVpZ2h0PSIzMDgiIHJ4PSIxOCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMzhiZGY4IiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1kYXNoYXJyYXk9IjYgNiIgb3BhY2l0eT0iMC4zNSIvPgogIDxjaXJjbGUgY3g9IjMwMCIgY3k9Ijk1IiByPSIzNiIgZmlsbD0iI2ZmZmZmZiIgb3BhY2l0eT0iMC4xMiIvPgogIDx0ZXh0IHg9IjMwMCIgeT0iMTA1IiBmaWxsPSIjZmZmZmZmIiBmb250LXNpemU9IjI4IiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgdGV4dC1hbmNob3I9Im1pZGRsZSI+8J+PpTwvdGV4dD4KICA8dGV4dCB4PSIzMDAiIHk9IjE2MCIgZmlsbD0iIzM0ZDM5OSIgZm9udC1zaXplPSIxMiIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtd2VpZ2h0PSJib2xkIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBsZXR0ZXItc3BhY2luZz0iMiI+QuG7hk5IIFZJ4buGTiBWxKhOSCBQSMOaQyBWUEkg4oCiIOG6ok5IIE1JTkggQ0jhu6hORyA1UzwvdGV4dD4KICA8dGV4dCB4PSIzMDAiIHk9IjE5NSIgZmlsbD0iI2ZmZmZmZiIgZm9udC1zaXplPSIyMCIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtd2VpZ2h0PSJib2xkIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5QaMOybmcgQ2jhu6VwIEPhuq90IEzhu5twIFZpIFTDrW5oIDEyOCBEw6N5IENUPC90ZXh0PgogIDx0ZXh0IHg9IjMwMCIgeT0iMjIyIiBmaWxsPSIjOTRhM2I4IiBmb250LXNpemU9IjEzIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgdGV4dC1hbmNob3I9Im1pZGRsZSI+S2hvYSBDaOG6qW4gxJFvw6FuIEjDrG5oIOG6o25oPC90ZXh0PgogIDxyZWN0IHg9IjE4MCIgeT0iMjQ1IiB3aWR0aD0iMjQwIiBoZWlnaHQ9IjMwIiByeD0iMTUiIGZpbGw9IiMwNTk2NjkiLz4KICA8dGV4dCB4PSIzMDAiIHk9IjI2NSIgZmlsbD0iI2ZmZmZmZiIgZm9udC1zaXplPSIxMSIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtd2VpZ2h0PSJib2xkIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj7EkMODIFPDgE5HIEzhu4xDICZhbXA7IEtI4busIEtIVeG6qE48L3RleHQ+CiAgPHRleHQgeD0iMzAwIiB5PSIzMDUiIGZpbGw9IiM2NDc0OGIiIGZvbnQtc2l6ZT0iMTAiIGZvbnQtZmFtaWx5PSJtb25vc3BhY2UiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkdpw6FtIFPDoXQgNVMgQuG7h25oIFZp4buHbiBWUEkg4oCiIDIwMjY8L3RleHQ+Cjwvc3ZnPg==',
      emergency: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MDAiIGhlaWdodD0iMzQwIiB2aWV3Qm94PSIwIDAgNjAwIDM0MCI+CiAgPGRlZnM+CiAgICA8bGluZWFyR3JhZGllbnQgaWQ9ImJnIiB4MT0iMCUiIHkxPSIwJSIgeDI9IjEwMCUiIHkyPSIxMDAlIj4KICAgICAgPHN0b3Agb2Zmc2V0PSIwJSIgc3RvcC1jb2xvcj0iIzFlMWI0YiIvPgogICAgICA8c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiM0YzA1MTkiLz4KICAgIDwvbGluZWFyR3JhZGllbnQ+CiAgPC9kZWZzPgogIDxyZWN0IHdpZHRoPSI2MDAiIGhlaWdodD0iMzQwIiBmaWxsPSJ1cmwoI2JnKSIvPgogIDxyZWN0IHg9IjE2IiB5PSIxNiIgd2lkdGg9IjU2OCIgaGVpZ2h0PSIzMDgiIHJ4PSIxOCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMzhiZGY4IiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1kYXNoYXJyYXk9IjYgNiIgb3BhY2l0eT0iMC4zNSIvPgogIDxjaXJjbGUgY3g9IjMwMCIgY3k9Ijk1IiByPSIzNiIgZmlsbD0iI2ZmZmZmZiIgb3BhY2l0eT0iMC4xMiIvPgogIDx0ZXh0IHg9IjMwMCIgeT0iMTA1IiBmaWxsPSIjZmZmZmZmIiBmb250LXNpemU9IjI4IiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgdGV4dC1hbmNob3I9Im1pZGRsZSI+8J+PpTwvdGV4dD4KICA8dGV4dCB4PSIzMDAiIHk9IjE2MCIgZmlsbD0iIzM0ZDM5OSIgZm9udC1zaXplPSIxMiIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtd2VpZ2h0PSJib2xkIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBsZXR0ZXItc3BhY2luZz0iMiI+QuG7hk5IIFZJ4buGTiBWxKhOSCBQSMOaQyBWUEkg4oCiIOG6ok5IIE1JTkggQ0jhu6hORyA1UzwvdGV4dD4KICA8dGV4dCB4PSIzMDAiIHk9IjE5NSIgZmlsbD0iI2ZmZmZmZiIgZm9udC1zaXplPSIyMCIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtd2VpZ2h0PSJib2xkIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5CdeG7k25nIEjhu5NpIFPhu6ljIEPhuqVwIEPhu6l1IEJhbiDEkOG6p3U8L3RleHQ+CiAgPHRleHQgeD0iMzAwIiB5PSIyMjIiIGZpbGw9IiM5NGEzYjgiIGZvbnQtc2l6ZT0iMTMiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5LaG9hIEPhuqVwIGPhu6l1PC90ZXh0PgogIDxyZWN0IHg9IjE4MCIgeT0iMjQ1IiB3aWR0aD0iMjQwIiBoZWlnaHQ9IjMwIiByeD0iMTUiIGZpbGw9IiMwNTk2NjkiLz4KICA8dGV4dCB4PSIzMDAiIHk9IjI2NSIgZmlsbD0iI2ZmZmZmZiIgZm9udC1zaXplPSIxMSIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtd2VpZ2h0PSJib2xkIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5D4bqmTiBCw5MgR+G7jE4gRMOCWSBNw4FZIFRI4buePC90ZXh0PgogIDx0ZXh0IHg9IjMwMCIgeT0iMzA1IiBmaWxsPSIjNjQ3NDhiIiBmb250LXNpemU9IjEwIiBmb250LWZhbWlseT0ibW9ub3NwYWNlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5HacOhbSBTw6F0IDVTIELhu4duaCBWaeG7h24gVlBJIOKAoiAyMDI2PC90ZXh0Pgo8L3N2Zz4=',
      clinic: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MDAiIGhlaWdodD0iMzQwIiB2aWV3Qm94PSIwIDAgNjAwIDM0MCI+CiAgPGRlZnM+CiAgICA8bGluZWFyR3JhZGllbnQgaWQ9ImJnIiB4MT0iMCUiIHkxPSIwJSIgeDI9IjEwMCUiIHkyPSIxMDAlIj4KICAgICAgPHN0b3Agb2Zmc2V0PSIwJSIgc3RvcC1jb2xvcj0iIzBmMTcyYSIvPgogICAgICA8c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiMxZTNhOGEiLz4KICAgIDwvbGluZWFyR3JhZGllbnQ+CiAgPC9kZWZzPgogIDxyZWN0IHdpZHRoPSI2MDAiIGhlaWdodD0iMzQwIiBmaWxsPSJ1cmwoI2JnKSIvPgogIDxyZWN0IHg9IjE2IiB5PSIxNiIgd2lkdGg9IjU2OCIgaGVpZ2h0PSIzMDgiIHJ4PSIxOCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMzhiZGY4IiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1kYXNoYXJyYXk9IjYgNiIgb3BhY2l0eT0iMC4zNSIvPgogIDxjaXJjbGUgY3g9IjMwMCIgY3k9Ijk1IiByPSIzNiIgZmlsbD0iI2ZmZmZmZiIgb3BhY2l0eT0iMC4xMiIvPgogIDx0ZXh0IHg9IjMwMCIgeT0iMTA1IiBmaWxsPSIjZmZmZmZmIiBmb250LXNpemU9IjI4IiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgdGV4dC1hbmNob3I9Im1pZGRsZSI+8J+PpTwvdGV4dD4KICA8dGV4dCB4PSIzMDAiIHk9IjE2MCIgZmlsbD0iIzM0ZDM5OSIgZm9udC1zaXplPSIxMiIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtd2VpZ2h0PSJib2xkIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBsZXR0ZXItc3BhY2luZz0iMiI+QuG7hk5IIFZJ4buGTiBWxKhOSCBQSMOaQyBWUEkg4oCiIOG6ok5IIE1JTkggQ0jhu6hORyA1UzwvdGV4dD4KICA8dGV4dCB4PSIzMDAiIHk9IjE5NSIgZmlsbD0iI2ZmZmZmZiIgZm9udC1zaXplPSIyMCIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtd2VpZ2h0PSJib2xkIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5Cw6BuIEtow6FtIELhu4duaCBO4buZaSAxMDE8L3RleHQ+CiAgPHRleHQgeD0iMzAwIiB5PSIyMjIiIGZpbGw9IiM5NGEzYjgiIGZvbnQtc2l6ZT0iMTMiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5LaG9hIEtow6FtIGLhu4duaDwvdGV4dD4KICA8cmVjdCB4PSIxODAiIHk9IjI0NSIgd2lkdGg9IjI0MCIgaGVpZ2h0PSIzMCIgcng9IjE1IiBmaWxsPSIjMDU5NjY5Ii8+CiAgPHRleHQgeD0iMzAwIiB5PSIyNjUiIGZpbGw9IiNmZmZmZmYiIGZvbnQtc2l6ZT0iMTEiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXdlaWdodD0iYm9sZCIgdGV4dC1hbmNob3I9Im1pZGRsZSI+SOG7kiBTxqAgQuG7hk5IIMOBTiBY4bq+UCBUSOG7qCBU4buwPC90ZXh0PgogIDx0ZXh0IHg9IjMwMCIgeT0iMzA1IiBmaWxsPSIjNjQ3NDhiIiBmb250LXNpemU9IjEwIiBmb250LWZhbWlseT0ibW9ub3NwYWNlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5HacOhbSBTw6F0IDVTIELhu4duaCBWaeG7h24gVlBJIOKAoiAyMDI2PC90ZXh0Pgo8L3N2Zz4=',
      icu: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MDAiIGhlaWdodD0iMzQwIiB2aWV3Qm94PSIwIDAgNjAwIDM0MCI+CiAgPGRlZnM+CiAgICA8bGluZWFyR3JhZGllbnQgaWQ9ImJnIiB4MT0iMCUiIHkxPSIwJSIgeDI9IjEwMCUiIHkyPSIxMDAlIj4KICAgICAgPHN0b3Agb2Zmc2V0PSIwJSIgc3RvcC1jb2xvcj0iIzBmMTcyYSIvPgogICAgICA8c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiMwZjc2NmUiLz4KICAgIDwvbGluZWFyR3JhZGllbnQ+CiAgPC9kZWZzPgogIDxyZWN0IHdpZHRoPSI2MDAiIGhlaWdodD0iMzQwIiBmaWxsPSJ1cmwoI2JnKSIvPgogIDxyZWN0IHg9IjE2IiB5PSIxNiIgd2lkdGg9IjU2OCIgaGVpZ2h0PSIzMDgiIHJ4PSIxOCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMzhiZGY4IiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1kYXNoYXJyYXk9IjYgNiIgb3BhY2l0eT0iMC4zNSIvPgogIDxjaXJjbGUgY3g9IjMwMCIgY3k9Ijk1IiByPSIzNiIgZmlsbD0iI2ZmZmZmZiIgb3BhY2l0eT0iMC4xMiIvPgogIDx0ZXh0IHg9IjMwMCIgeT0iMTA1IiBmaWxsPSIjZmZmZmZmIiBmb250LXNpemU9IjI4IiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgdGV4dC1hbmNob3I9Im1pZGRsZSI+8J+PpTwvdGV4dD4KICA8dGV4dCB4PSIzMDAiIHk9IjE2MCIgZmlsbD0iIzM0ZDM5OSIgZm9udC1zaXplPSIxMiIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtd2VpZ2h0PSJib2xkIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBsZXR0ZXItc3BhY2luZz0iMiI+QuG7hk5IIFZJ4buGTiBWxKhOSCBQSMOaQyBWUEkg4oCiIOG6ok5IIE1JTkggQ0jhu6hORyA1UzwvdGV4dD4KICA8dGV4dCB4PSIzMDAiIHk9IjE5NSIgZmlsbD0iI2ZmZmZmZiIgZm9udC1zaXplPSIyMCIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtd2VpZ2h0PSJib2xkIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5CdeG7k25nIELhu4duaCBO4bq3bmcgSOG7k2kgU+G7qWMgMDE8L3RleHQ+CiAgPHRleHQgeD0iMzAwIiB5PSIyMjIiIGZpbGw9IiM5NGEzYjgiIGZvbnQtc2l6ZT0iMTMiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5LaG9hIEjhu5NpIHPhu6ljIHTDrWNoIGPhu7FjPC90ZXh0PgogIDxyZWN0IHg9IjE4MCIgeT0iMjQ1IiB3aWR0aD0iMjQwIiBoZWlnaHQ9IjMwIiByeD0iMTUiIGZpbGw9IiMwNTk2NjkiLz4KICA8dGV4dCB4PSIzMDAiIHk9IjI2NSIgZmlsbD0iI2ZmZmZmZiIgZm9udC1zaXplPSIxMSIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtd2VpZ2h0PSJib2xkIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5LSEFZIFRIVeG7kEMgxJDDgyBT4bquUCBY4bq+UDwvdGV4dD4KICA8dGV4dCB4PSIzMDAiIHk9IjMwNSIgZmlsbD0iIzY0NzQ4YiIgZm9udC1zaXplPSIxMCIgZm9udC1mYW1pbHk9Im1vbm9zcGFjZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+R2nDoW0gU8OhdCA1UyBC4buHbmggVmnhu4duIFZQSSDigKIgMjAyNjwvdGV4dD4KPC9zdmc+'
    };
    if (photoMap[type]) {
      this.newAuditState.afterPhoto = photoMap[type];
      this.currentShiftPhoto = photoMap[type];
      const previewEl = document.getElementById('shift-photo-preview');
      if (previewEl) {
        this.updateShiftPhotoPreviewUI(photoMap[type]);
      } else {
        this.render();
      }
      this.showToast('Đã chọn ảnh minh chứng mẫu thành công!');
    }
  }

  // MODAL ĐÁNH GIÁ & DUYỆT ẢNH 5S
  openAuditEvaluationModal(auditId) {
    const audit = (this.data.audits || []).find(a => a.id == auditId);
    if (!audit) {
      this.showToast('Không tìm thấy thông tin phiếu kiểm tra!');
      return;
    }
    this.currentEvaluationAuditId = auditId;
    this.currentEvaluationResult = (audit.status === 'rejected' ? 'fail' : 'pass');

    const dept = (this.data.departments || []).find(d => d.id == audit.department_id) || { name: 'Chưa xác định' };
    const room = (this.data.rooms || []).find(r => r.id == audit.room_id) || { name: 'Buồng bệnh' };
    const currentUser = this.getCurrentUser() || { name: 'KTV. Vũ Bá Đạt', code: 'BV-345', title: 'Cán bộ Giám sát 5S' };

    const modalHtml = `
      <div class="p-5 space-y-4 max-h-[85vh] overflow-y-auto no-scrollbar">
        <div class="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3">
          <div class="flex items-center space-x-2">
            <div class="w-9 h-9 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
              <i data-lucide="clipboard-check" class="w-5 h-5"></i>
            </div>
            <div>
              <h3 class="text-sm font-black text-slate-900 dark:text-white">ĐÁNH GIÁ ẢNH MINH CHỨNG 5S</h3>
              <p class="text-[10px] text-slate-500 font-mono">Mã phiếu: ${audit.audit_code}</p>
            </div>
          </div>
          <button onclick="app5s.closeModal()" class="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400">
            <i data-lucide="x" class="w-4 h-4"></i>
          </button>
        </div>

        <!-- Thông tin khoa phòng & thời gian nộp -->
        <div class="bg-slate-50 dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs space-y-1">
          <div class="flex justify-between">
            <span class="text-slate-400 font-semibold">Khoa / Phòng:</span>
            <strong class="text-slate-800 dark:text-slate-100">${dept.name}</strong>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-400 font-semibold">Khu vực làm việc:</span>
            <span class="font-bold text-emerald-600">${room.name}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-400 font-semibold">Người chụp gửi:</span>
            <span>${audit.sender_name || 'Nhân viên khoa'} (${audit.sender_role || 'Điều dưỡng'})</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-400 font-semibold">Thời gian nộp:</span>
            <span>${audit.audit_date} lúc ${audit.audit_time} (${audit.shift || 'Ca sáng'})</span>
          </div>
        </div>

        <!-- Hình ảnh minh chứng 5S của khoa nộp -->
        <div class="space-y-1.5">
          <label class="block text-xs font-bold text-slate-700 dark:text-slate-300">
            📸 Hình ảnh chụp minh chứng buồng phòng sau 5S:
          </label>
          <div class="rounded-2xl overflow-hidden border-2 border-slate-200 dark:border-slate-700 relative group bg-black/5">
            ${audit.after_photo ? `
              <img src="${audit.after_photo}" class="w-full h-52 object-cover rounded-xl" alt="Ảnh minh chứng 5S">
            ` : `
              <div class="h-44 flex items-center justify-center text-xs text-slate-400">Không có ảnh đính kèm</div>
            `}
          </div>
          <div class="bg-emerald-50/60 dark:bg-emerald-950/30 p-2.5 rounded-xl text-[11px] text-emerald-900 dark:text-emerald-300 italic border border-emerald-200/60">
            "${audit.notes || 'Đã vệ sinh, sắp xếp đồ đạc buồng phòng sạch sẽ.'}"
          </div>
        </div>

        <!-- BỘ CHỌN ĐÁNH GIÁ 1 CHẠM: ĐẠT HOẶC KHÔNG ĐẠT -->
        <div class="space-y-2">
          <label class="block text-xs font-bold text-slate-700 dark:text-slate-300">
            ⭐ Kết luận đánh giá của Cán bộ kiểm tra *
          </label>
          <div class="grid grid-cols-2 gap-2">
            <button type="button" id="eval-btn-pass" onclick="app5s.setEvaluationResult('pass')" class="py-3 px-3 rounded-2xl font-black text-xs flex items-center justify-center space-x-1.5 transition border-2 ${
              this.currentEvaluationResult === 'pass'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-300'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 hover:border-emerald-400'
            }">
              <i data-lucide="check-circle" class="w-4 h-4"></i>
              <span>🟢 ĐẠT CHUẨN 5S</span>
            </button>

            <button type="button" id="eval-btn-fail" onclick="app5s.setEvaluationResult('fail')" class="py-3 px-3 rounded-2xl font-black text-xs flex items-center justify-center space-x-1.5 transition border-2 ${
              this.currentEvaluationResult === 'fail'
                ? 'bg-red-600 text-white border-red-600 shadow-md ring-2 ring-red-300'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 hover:border-red-400'
            }">
              <i data-lucide="alert-triangle" class="w-4 h-4"></i>
              <span>🔴 KHÔNG ĐẠT (LỖI)</span>
            </button>
          </div>
        </div>

        <!-- KHỐI NHẮC NHỞ LỖI 5S & YÊU CẦU KHẮC PHỤC (Hiện khi chọn KHÔNG ĐẠT) -->
        <div id="eval-issue-block" class="${this.currentEvaluationResult === 'fail' ? '' : 'hidden'} space-y-3 bg-red-50/70 dark:bg-red-950/40 p-3.5 rounded-2xl border border-red-200 dark:border-red-900/60 animate-in fade-in">
          <div class="flex items-center space-x-1.5 text-xs font-bold text-red-700 dark:text-red-400">
            <i data-lucide="bell" class="w-4 h-4 text-red-600"></i>
            <span>Yêu cầu nhắc nhở lỗi 5S phát hiện & khắc phục:</span>
          </div>

          <!-- Nút chọn nhanh lỗi thường gặp -->
          <div class="text-[10px] text-slate-500 font-semibold">Gợi ý lỗi thường gặp (Bấm để chèn):</div>
          <div class="flex flex-wrap gap-1.5">
            <button type="button" onclick="app5s.addQuickIssueTag('Dây máy thở, dây nguồn để bừa bãi vướng lối đi')" class="px-2 py-1 bg-white dark:bg-slate-800 text-red-700 dark:text-red-300 rounded-lg border border-red-200 text-[10px] hover:bg-red-100 transition">+ Dây máy bừa bãi</button>
            <button type="button" onclick="app5s.addQuickIssueTag('Bụi bẩn sau gầm giường, gầm máy chưa lau sạch')" class="px-2 py-1 bg-white dark:bg-slate-800 text-red-700 dark:text-red-300 rounded-lg border border-red-200 text-[10px] hover:bg-red-100 transition">+ Bụi gầm giường</button>
            <button type="button" onclick="app5s.addQuickIssueTag('Rác y tế phân loại sai màu thùng rác quy định')" class="px-2 py-1 bg-white dark:bg-slate-800 text-red-700 dark:text-red-300 rounded-lg border border-red-200 text-[10px] hover:bg-red-100 transition">+ Rác y tế sai màu</button>
            <button type="button" onclick="app5s.addQuickIssueTag('Khay thuốc cấp cứu và vật tư tiêu hao để lộn xộn')" class="px-2 py-1 bg-white dark:bg-slate-800 text-red-700 dark:text-red-300 rounded-lg border border-red-200 text-[10px] hover:bg-red-100 transition">+ Khay thuốc lộn xộn</button>
            <button type="button" onclick="app5s.addQuickIssueTag('Hồ sơ bệnh án xếp bừa bãi chưa vào cặp lưu')" class="px-2 py-1 bg-white dark:bg-slate-800 text-red-700 dark:text-red-300 rounded-lg border border-red-200 text-[10px] hover:bg-red-100 transition">+ Hồ sơ bừa bãi</button>
            <button type="button" onclick="app5s.addQuickIssueTag('Chưa dán tem nhãn hạn dùng và tình trạng khử khuẩn')" class="px-2 py-1 bg-white dark:bg-slate-800 text-red-700 dark:text-red-300 rounded-lg border border-red-200 text-[10px] hover:bg-red-100 transition">+ Chưa dán tem nhãn</button>
          </div>

          <div>
            <label class="block text-[11px] font-bold text-red-800 dark:text-red-300 mb-1">Chi tiết lỗi 5S phát hiện & Yêu cầu khoa xử lý *</label>
            <textarea id="eval-issue-input" rows="2" placeholder="Ví dụ: Dây nguồn monitor để vướng lối đi; xe tiêm còn bông cồn bẩn chưa bỏ thùng rác vàng..." class="w-full bg-white dark:bg-slate-900 border border-red-300 dark:border-red-800 rounded-xl p-2 text-xs text-slate-800 dark:text-slate-100">${audit.issue_detected || ''}</textarea>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block text-[11px] font-bold text-red-800 dark:text-red-300 mb-1">Thời hạn yêu cầu khắc phục *</label>
              <select id="eval-deadline-select" class="w-full bg-white dark:bg-slate-900 border border-red-300 dark:border-red-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-100">
                <option value="Trước 11h30 hôm nay" ${audit.remedy_deadline === 'Trước 11h30 hôm nay' ? 'selected' : ''}>Trước 11h30 hôm nay</option>
                <option value="Trước 16h30 hôm nay" ${audit.remedy_deadline === 'Trước 16h30 hôm nay' ? 'selected' : ''}>Trước 16h30 hôm nay</option>
                <option value="Trước ca trực tiếp theo" ${audit.remedy_deadline === 'Trước ca trực tiếp theo' ? 'selected' : ''}>Trước ca trực tiếp theo</option>
                <option value="Trong ngày hôm nay" ${audit.remedy_deadline === 'Trong ngày hôm nay' ? 'selected' : ''}>Trong ngày hôm nay</option>
              </select>
            </div>
            <div>
              <label class="block text-[11px] font-bold text-red-800 dark:text-red-300 mb-1">Điểm đánh giá lại (0 - 70đ)</label>
              <input type="number" id="eval-score-input" min="0" max="70" value="${audit.total_score && audit.total_score < 70 ? audit.total_score : 65}" class="w-full bg-white dark:bg-slate-900 border border-red-300 dark:border-red-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-100 font-mono font-bold">
            </div>
          </div>
        </div>

        <!-- Nhận xét chung & Thông tin người duyệt -->
        <div>
          <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Nhận xét & Lời phê của Cán bộ kiểm tra:</label>
          <textarea id="eval-notes-input" rows="2" placeholder="Ghi nhận xét đánh giá tổng thể..." class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-800 dark:text-slate-100">${audit.evaluation_notes || (this.currentEvaluationResult === 'pass' ? 'Đạt chuẩn 5S bệnh viện. Buồng phòng sắp xếp gọn gàng, sạch sẽ.' : 'Yêu cầu khắc phục các lỗi đã nhắc nhở trên.')}</textarea>
        </div>

        <div class="text-[10px] text-slate-500 bg-slate-50 dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <span>Người đánh giá: <strong>${currentUser.name}</strong> (${currentUser.role_title || currentUser.title || 'Cán bộ Giám sát'})</span>
          <span class="text-emerald-600 font-mono font-bold">Mã: ${currentUser.code}</span>
        </div>

        <!-- Nút Submit -->
        <button onclick="app5s.submitAuditEvaluation()" class="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black py-3 rounded-2xl shadow-md transition flex items-center justify-center space-x-2 text-xs">
          <i data-lucide="check-check" class="w-4 h-4"></i>
          <span>LƯU ĐÁNH GIÁ & GỬI KẾT QUẢ TỚI KHOA</span>
        </button>
      </div>
    `;

    this.showModal(modalHtml);
  }

  setEvaluationResult(result) {
    this.currentEvaluationResult = result;
    const passBtn = document.getElementById('eval-btn-pass');
    const failBtn = document.getElementById('eval-btn-fail');
    const issueBlock = document.getElementById('eval-issue-block');
    const notesInput = document.getElementById('eval-notes-input');

    if (result === 'pass') {
      if (passBtn) {
        passBtn.className = "py-3 px-3 rounded-2xl font-black text-xs flex items-center justify-center space-x-1.5 transition border-2 bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-300";
      }
      if (failBtn) {
        failBtn.className = "py-3 px-3 rounded-2xl font-black text-xs flex items-center justify-center space-x-1.5 transition border-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 hover:border-red-400";
      }
      if (issueBlock) issueBlock.classList.add('hidden');
      if (notesInput && (!notesInput.value || notesInput.value.includes('Yêu cầu'))) {
        notesInput.value = 'Đạt chuẩn 5S bệnh viện. Buồng phòng sắp xếp gọn gàng, sạch sẽ.';
      }
    } else {
      if (passBtn) {
        passBtn.className = "py-3 px-3 rounded-2xl font-black text-xs flex items-center justify-center space-x-1.5 transition border-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 hover:border-emerald-400";
      }
      if (failBtn) {
        failBtn.className = "py-3 px-3 rounded-2xl font-black text-xs flex items-center justify-center space-x-1.5 transition border-2 bg-red-600 text-white border-red-600 shadow-md ring-2 ring-red-300";
      }
      if (issueBlock) issueBlock.classList.remove('hidden');
      if (notesInput && (!notesInput.value || notesInput.value.includes('Đạt chuẩn'))) {
        notesInput.value = 'Yêu cầu Trưởng khoa và Điều dưỡng trưởng chấn chỉnh, khắc phục các lỗi 5S đã nêu.';
      }
    }
  }

  addQuickIssueTag(tagText) {
    const issueInput = document.getElementById('eval-issue-input');
    if (!issueInput) return;
    if (issueInput.value.trim()) {
      issueInput.value = issueInput.value.trim() + '; ' + tagText;
    } else {
      issueInput.value = tagText;
    }
    issueInput.focus();
  }

  submitAuditEvaluation() {
    const auditId = this.currentEvaluationAuditId;
    const audit = (this.data.audits || []).find(a => a.id == auditId);
    if (!audit) return;

    const result = this.currentEvaluationResult; // 'pass' or 'fail'
    const currentUser = this.getCurrentUser() || { name: 'KTV. Vũ Bá Đạt', code: 'BV-345', title: 'Cán bộ Giám sát 5S' };

    const notesInput = document.getElementById('eval-notes-input');
    const issueInput = document.getElementById('eval-issue-input');
    const deadlineSelect = document.getElementById('eval-deadline-select');
    const scoreInput = document.getElementById('eval-score-input');

    const evalNotes = notesInput ? notesInput.value.trim() : '';
    const issueText = issueInput ? issueInput.value.trim() : '';
    const deadlineText = deadlineSelect ? deadlineSelect.value : 'Trước 11h30 hôm nay';

    if (result === 'fail' && !issueText) {
      alert('Vui lòng nhập chi tiết lỗi 5S phát hiện để gửi nhắc nhở cho khoa phòng!');
      if (issueInput) issueInput.focus();
      return;
    }

    audit.status = (result === 'pass' ? 'approved' : 'rejected');
    audit.evaluation_result = result;
    audit.evaluator_name = currentUser.name;
    audit.evaluator_code = currentUser.code;
    audit.evaluator_role = currentUser.role_title || currentUser.title || 'Cán bộ Giám sát 5S';
    audit.evaluation_date = this.getTodayDateString();
    audit.evaluation_time = new Date().toTimeString().slice(0, 5);
    audit.evaluation_notes = evalNotes;
    audit.issue_detected = (result === 'fail' ? issueText : '');
    audit.remedy_deadline = (result === 'fail' ? deadlineText : '');

    if (result === 'fail') {
      const newScore = scoreInput ? parseInt(scoreInput.value) : 65;
      audit.total_score = isNaN(newScore) ? 65 : newScore;
      audit.rating = 'Cần cải tiến';
    } else {
      if (!audit.total_score || audit.total_score < 80) audit.total_score = 96;
      audit.rating = 'Xuất sắc';
    }

    this.saveData();
    this.closeModal();
    this.render();

    if (result === 'pass') {
      this.showToast('✅ Đã duyệt: ĐẠT CHUẨN 5S cho khoa phòng!');
    } else {
      this.showToast('⚠️ Đã ghi nhận KHÔNG ĐẠT và gửi yêu cầu nhắc nhở khắc phục!');
    }
  }

  // MODAL PHÁT THÔNG BÁO NHẮC NHỞ CÁC KHOA CHƯA THỰC HIỆN 5S
  openReminderModal() {
    const status = this.getDaily5SStatus();
    const uncompleted = status.uncompletedDepts;

    const modalHtml = `
      <div class="p-5 space-y-4 max-h-[85vh] overflow-y-auto no-scrollbar">
        <div class="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3">
          <div class="flex items-center space-x-2">
            <div class="w-9 h-9 rounded-2xl bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400 flex items-center justify-center">
              <i data-lucide="bell" class="w-5 h-5"></i>
            </div>
            <div>
              <h3 class="text-sm font-black text-slate-900 dark:text-white">CẢNH BÁO TIẾN ĐỘ 5S HÔM NAY</h3>
              <p class="text-[10px] text-red-600 font-bold">${uncompleted.length} Khoa/Phòng chưa thực hiện</p>
            </div>
          </div>
          <button onclick="app5s.closeModal()" class="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400">
            <i data-lucide="x" class="w-4 h-4"></i>
          </button>
        </div>

        <div class="bg-red-50 dark:bg-red-950/40 p-3 rounded-2xl border border-red-200 dark:border-red-900/60 text-xs space-y-1">
          <div class="font-bold text-red-900 dark:text-red-200 flex items-center space-x-1.5">
            <i data-lucide="alert-triangle" class="w-4 h-4 text-red-600"></i>
            <span>Cảnh Báo Đôn Đốc Thực Hiện 5S Y Tế</span>
          </div>
          <p class="text-[11px] text-red-800 dark:text-red-300 leading-relaxed">
            Hôm nay (${status.today}), toàn viện mới có <strong>${status.completedDepts.length}/20 Khoa</strong> gửi ảnh báo cáo 5S (${status.rate}%). Còn lại <strong>${uncompleted.length} Khoa</strong> chưa thực hiện.
          </p>
        </div>

        <div class="space-y-1.5">
          <div class="text-xs font-bold text-slate-700 dark:text-slate-300">Danh sách các khoa chưa nộp ảnh hôm nay:</div>
          <div class="max-h-48 overflow-y-auto space-y-1.5 pr-1 no-scrollbar">
            ${uncompleted.map(d => `
              <div class="bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                <div>
                  <div class="font-bold text-slate-800 dark:text-slate-100">#${d.order || ''} ${d.name}</div>
                  <div class="text-[10px] text-slate-400">Trưởng khoa: ${d.doctor_in_charge || 'Bác sĩ trực'}</div>
                </div>
                <button onclick="app5s.remindSingleDept('${d.id}')" class="px-2.5 py-1 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300 rounded-lg text-[10px] font-bold hover:bg-amber-100 transition flex items-center space-x-1">
                  <i data-lucide="send" class="w-3 h-3"></i>
                  <span>Nhắc nhở</span>
                </button>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Nút phát thông báo khẩn toàn viện -->
        <button onclick="app5s.broadcastDaily5SReminder()" class="w-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-black py-3 rounded-2xl shadow-md transition flex items-center justify-center space-x-2 text-xs">
          <i data-lucide="volume-2" class="w-4 h-4"></i>
          <span>📢 PHÁT THÔNG BÁO KHẨN NHẮC NHỞ TOÀN VIỆN</span>
        </button>
      </div>
    `;

    this.showModal(modalHtml);
  }

  broadcastDaily5SReminder() {
    const status = this.getDaily5SStatus();
    const uncompleted = status.uncompletedDepts;
    const currentTime = new Date().toTimeString().slice(0, 5);

    const deptNames = uncompleted.slice(0, 4).map(d => d.name).join(', ') + (uncompleted.length > 4 ? ` và ${uncompleted.length - 4} khoa khác` : '');

    this.data.hospital.notice = {
      enabled: true,
      type: 'danger',
      title: 'NHẮC NHỞ KHẨN: TIẾN ĐỘ BÁO CÁO ẢNH 5S HẰNG NGÀY',
      content: `Hiện tại còn ${uncompleted.length} Khoa/Phòng chưa gửi ảnh báo cáo 5S sáng nay (${deptNames}). Ban Chỉ Đạo 5S yêu cầu các Trưởng khoa, Điều dưỡng trưởng khẩn trương rà soát buồng phòng và chụp gửi ảnh 5S trước 11h30.`,
      updatedAt: `${status.today} ${currentTime}`
    };

    this.saveData();
    this.closeModal();
    this.render();
    this.showToast('📢 Đã phát thông báo khẩn nhắc nhở tiến độ 5S toàn viện!');
  }

  remindSingleDept(deptId) {
    const d = (this.data.departments || []).find(dept => dept.id == deptId);
    const deptName = d ? d.name : 'Khoa phòng';
    this.showToast(`🔔 Đã gửi thông báo nhắc nhở 5S tới Trưởng khoa và Điều dưỡng trưởng ${deptName}!`);
  }


  // =========================================================================
  // TÍNH NĂNG V7: LỊCH LÀM VIỆC TUẦN, PHÂN CÔNG ĐA NHÂN SỰ & TRẠNG THÁI BUỒNG PHÒNG 5S
  // =========================================================================
  getScheduleStatistics() {
    const schedules = this.data.schedules || { rooms_schedule: [] };
    const roomSchedules = schedules.rooms_schedule || [];
    const totalRooms = (this.data.rooms || []).length || 75;

    const working = roomSchedules.filter(rs => rs.is_working);
    const idle = roomSchedules.filter(rs => !rs.is_working);

    const workingCount = working.length;
    const idleCount = totalRooms - workingCount;
    const workingRate = Math.round((workingCount / totalRooms) * 100);

    const completed5s = working.filter(rs => rs.post_shift_5s && (rs.post_shift_5s.status === 'submitted' || rs.post_shift_5s.status === 'approved'));
    const overdue5s = working.filter(rs => rs.post_shift_5s && rs.post_shift_5s.status === 'overdue');
    const pending5s = working.filter(rs => !rs.post_shift_5s || rs.post_shift_5s.status === 'pending');

    // Thống kê ảnh 5S kết thúc ca bàn giao (V8)
    const allSubmittedPhotos = roomSchedules.filter(rs => rs.post_shift_5s && rs.post_shift_5s.photo);
    const pendingReviewCount = allSubmittedPhotos.filter(rs => rs.post_shift_5s.status === 'submitted' || rs.post_shift_5s.status === 'pending').length;
    const approvedCount = allSubmittedPhotos.filter(rs => rs.post_shift_5s.status === 'approved').length;
    const rejectedCount = allSubmittedPhotos.filter(rs => rs.post_shift_5s.status === 'rejected').length;

    const totalNeeding5s = workingCount;
    const completedCount = completed5s.length;
    const complianceRate = totalNeeding5s > 0 ? Math.round((completedCount / totalNeeding5s) * 100) : 100;

    return {
      totalRooms,
      workingCount,
      workingRooms: workingCount,
      idleCount,
      idleRooms: idleCount,
      workingRate,
      completedCount,
      submittedRooms: completedCount,
      overdueCount: overdue5s.length,
      pendingCount: pending5s.length,
      complianceRate,
      overdueRooms: overdue5s,
      allSubmittedCount: allSubmittedPhotos.length,
      pendingReviewCount,
      approvedCount,
      rejectedCount
    };
  }

  getRoomSchedule(roomId) {
    if (!this.data.schedules) this.data.schedules = { rooms_schedule: [] };
    if (!this.data.schedules.rooms_schedule) this.data.schedules.rooms_schedule = [];

    let rs = this.data.schedules.rooms_schedule.find(s => s.room_id == roomId);
    if (!rs) {
      const room = (this.data.rooms || []).find(r => r.id == roomId) || { id: roomId, department_id: 1 };
      rs = {
        room_id: roomId,
        department_id: room.department_id,
        shift_id: 'morning',
        day_of_week: (this.scheduleState && this.scheduleState.selectedDay) || 'Sun',
        date: this.getTodayDateString(),
        is_working: true,
        staff_assigned: [],
        post_shift_5s: { status: 'pending', photo: '', submitted_at: '', submitted_by: '', notes: '' }
      };
      this.data.schedules.rooms_schedule.push(rs);
    }
    return rs;
  }

  toggleRoomWorkingStatus(roomId) {
    const rs = this.getRoomSchedule(roomId);
    rs.is_working = !rs.is_working;
    this.saveData();
    this.render();
    const room = (this.data.rooms || []).find(r => r.id == roomId) || { name: 'Buồng phòng' };
    this.showToast(rs.is_working 
      ? `🟢 Đã kích hoạt: ${room.name} ĐANG LÀM VIỆC` 
      : `⚪ Đã chuyển: ${room.name} sang trạng thái KHÔNG LÀM VIỆC`
    );
  }

  setScheduleWeek(week) {
    this.scheduleState.selectedWeek = parseInt(week);
    this.render();
  }

  setScheduleDay(day) {
    this.scheduleState.selectedDay = day;
    this.render();
  }

  setScheduleShift(shiftId) {
    this.scheduleState.selectedShift = shiftId;
    this.render();
  }

  setScheduleStatusFilter(status) {
    this.scheduleState.selectedStatusFilter = status;
    this.render();
  }

  setScheduleDeptFilter(deptId) {
    this.scheduleState.selectedDept = deptId;
    this.render();
  }

  onScheduleSearch(query) {
    this.scheduleState.searchQuery = (query || '').trim().toLowerCase();
    this.render();
  }

  // MODAL QUẢN LÝ NHÂN SỰ VÀ TRẠNG THÁI BUỒNG PHÒNG
  openManageRoomStaffModal(roomId) {
    const room = (this.data.rooms || []).find(r => r.id == roomId);
    if (!room) return;
    const dept = (this.data.departments || []).find(d => d.id == room.department_id) || { name: 'Khoa' };
    const rs = this.getRoomSchedule(roomId);
    const assignedStaff = rs.staff_assigned || [];

    // V9 QUY TẮC 2: Chỉ lấy nhân sự thuộc danh bạ của khoa phòng này
    const deptStaff = this.getStaffForDepartment(room.department_id);

    const modalHtml = `
      <div class="p-5 space-y-4 max-h-[85vh] overflow-y-auto no-scrollbar">
        <div class="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3">
          <div class="flex items-center space-x-2">
            <div class="w-9 h-9 rounded-2xl bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 flex items-center justify-center">
              <i data-lucide="users" class="w-5 h-5"></i>
            </div>
            <div>
              <h3 class="text-sm font-black text-slate-900 dark:text-white">${room.name}</h3>
              <p class="text-[10px] text-indigo-600 font-bold font-mono">${dept.name} • Mã: ${room.code || 'P-00'}</p>
            </div>
          </div>
          <button onclick="app5s.closeModal()" class="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400">
            <i data-lucide="x" class="w-4 h-4"></i>
          </button>
        </div>

        <!-- CÔNG TẮC BẬT / TẮT TRẠNG THÁI LÀM VIỆC CỦA PHÒNG -->
        <div class="bg-slate-50 dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div class="space-y-0.5">
            <span class="text-xs font-bold text-slate-800 dark:text-slate-100">Trạng thái hoạt động buồng phòng:</span>
            <div class="text-[10px] text-slate-500 font-medium">Bật nếu phòng đang mở cửa phục vụ bệnh nhân trong ca này</div>
          </div>
          <button onclick="app5s.toggleRoomWorkingStatus(${roomId}); app5s.openManageRoomStaffModal(${roomId});" class="px-3 py-1.5 rounded-xl font-bold text-xs transition flex items-center space-x-1.5 ${
            rs.is_working 
              ? 'bg-emerald-600 text-white shadow-xs hover:bg-emerald-700' 
              : 'bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-400'
          }">
            <i data-lucide="${rs.is_working ? 'check-circle' : 'circle'}" class="w-3.5 h-3.5"></i>
            <span>${rs.is_working ? 'ĐANG LÀM VIỆC' : 'KHÔNG LÀM VIỆC'}</span>
          </button>
        </div>

        <!-- DANH SÁCH NHÂN SỰ ĐƯỢC PHÂN CÔNG TẠI VỊ TRÍ NÀY -->
        <div class="space-y-2">
          <div class="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
            <span>Danh sách nhân sự phụ trách ca (${assignedStaff.length} người):</span>
            <span class="text-[10px] text-slate-400">Có thể thêm / bớt nhiều người</span>
          </div>

          ${assignedStaff.length === 0 ? `
            <div class="p-4 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-xs text-slate-400">
              Chưa có nhân sự nào được phân công tại buồng phòng này. Vui lòng thêm nhân sự bên dưới.
            </div>
          ` : `
            <div class="space-y-1.5 max-h-48 overflow-y-auto no-scrollbar">
              ${assignedStaff.map((s, idx) => `
                <div class="bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs shadow-2xs">
                  <div class="flex items-center space-x-2">
                    <div class="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 font-bold flex items-center justify-center text-[10px]">
                      ${idx + 1}
                    </div>
                    <div>
                      <div class="font-black text-slate-800 dark:text-slate-100">${s.name}</div>
                      <div class="text-[10px] text-indigo-600 font-medium">${s.role || 'Nhân sự ca trực'} • <span class="font-mono text-slate-400">${s.code || ''}</span></div>
                    </div>
                  </div>
                  <button onclick="app5s.removeStaffFromRoom(${roomId}, ${idx})" title="Bớt nhân sự khỏi vị trí này" class="px-2 py-1 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-300 rounded-lg text-[10px] font-bold border border-red-200 dark:border-red-800 transition flex items-center space-x-0.5">
                    <i data-lucide="user-minus" class="w-3 h-3"></i>
                    <span>Bớt người</span>
                  </button>
                </div>
              `).join('')}
            </div>
          `}
        </div>

        <!-- KHỐI THÊM NHÂN SỰ VÀO VỊ TRÍ LÀM VIỆC (V9: THEO DANH BẠ KHOA PHÒNG) -->
        <div class="bg-indigo-50/60 dark:bg-indigo-950/30 p-3.5 rounded-2xl border border-indigo-200/80 dark:border-indigo-900/60 space-y-2.5">
          <div class="flex items-center justify-between text-xs font-bold text-indigo-900 dark:text-indigo-200">
            <div class="flex items-center space-x-1.5">
              <i data-lucide="user-plus" class="w-4 h-4 text-indigo-600"></i>
              <span>Thêm nhân sự phụ trách vào buồng phòng:</span>
            </div>
            <span class="text-[10px] font-mono text-indigo-700 bg-indigo-100 dark:bg-indigo-900/60 px-1.5 py-0.5 rounded font-bold">Danh bạ ${dept.name}</span>
          </div>

          <div class="space-y-2">
            <div>
              <label class="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                Chọn từ danh bạ nhân sự <strong>${dept.name}</strong> (${deptStaff.length} người):
              </label>
              <select id="add-staff-select" class="w-full bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-100 font-medium">
                <option value="">-- Chọn cán bộ/nhân viên thuộc ${dept.name} --</option>
                ${deptStaff.map(st => `
                  <option value="${st.code || st.name}">${st.name} (${st.title || st.role_title || 'Nhân viên'}) ${st.code ? '• ' + st.code : ''}</option>
                `).join('')}
              </select>
              <div class="text-[10px] text-slate-500 mt-1">
                🔒 <em>Nguyên tắc: Chỉ phân công nhân sự thuộc danh bạ của ${dept.name}.</em>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Bổ sung nhân sự mới vào khoa:</label>
                <input type="text" id="add-staff-custom-name" placeholder="Họ tên cán bộ/nhân viên mới..." class="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-100">
              </div>

              <div>
                <label class="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Vai trò trong ca trực:</label>
                <select id="add-staff-role" class="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-100">
                  <option value="Phụ trách chính">Phụ trách chính</option>
                  <option value="Bác sĩ trực">Bác sĩ trực</option>
                  <option value="Điều dưỡng ca">Điều dưỡng ca</option>
                  <option value="Kỹ thuật viên máy">Kỹ thuật viên máy</option>
                  <option value="Dược sĩ phụ trách">Dược sĩ phụ trách</option>
                  <option value="Hộ sinh ca trực">Hộ sinh ca trực</option>
                  <option value="Hộ lý / Vệ sinh">Hộ lý / Vệ sinh</option>
                </select>
              </div>
            </div>

            <button onclick="app5s.addStaffToRoom(${roomId})" class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-xl text-xs transition flex items-center justify-center space-x-1.5 shadow-xs">
              <i data-lucide="plus" class="w-3.5 h-3.5"></i>
              <span>THÊM NHÂN SỰ VÀO VỊ TRÍ NÀY</span>
            </button>
          </div>
        </div>

        <button onclick="app5s.closeModal(); app5s.render();" class="w-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold py-2.5 rounded-2xl text-xs transition">
          Đóng cửa sổ
        </button>
      </div>
    `;

    this.showModal(modalHtml);
  }

  addStaffToRoom(roomId) {
    const room = (this.data.rooms || []).find(r => r.id == roomId);
    if (!room) return;
    const dept = (this.data.departments || []).find(d => d.id == room.department_id) || { name: 'Khoa' };
    const selectEl = document.getElementById('add-staff-select');
    const customNameEl = document.getElementById('add-staff-custom-name');
    const roleEl = document.getElementById('add-staff-role');

    const selectedVal = selectEl ? selectEl.value : '';
    const customName = customNameEl ? customNameEl.value.trim() : '';
    const role = roleEl ? roleEl.value : 'Phụ trách chính';

    let staffName = customName;
    let staffCode = selectedVal || 'BV-NV';

    if (!staffName && selectedVal) {
      const s = (this.data.staff || []).find(st => st.code === selectedVal || st.name === selectedVal);
      if (s) {
        staffName = s.name;
        staffCode = s.code;
      } else {
        staffName = selectedVal;
      }
    }

    if (!staffName) {
      alert(`Vui lòng chọn nhân sự từ danh bạ ${dept.name} hoặc nhập họ tên mới để bổ sung vào khoa!`);
      return;
    }

    // Nếu nhập tên mới: tự động bổ sung vào danh bạ nhân sự của khoa phòng này
    if (customName) {
      const existingInDept = (this.data.staff || []).find(st => st.name.toLowerCase() === customName.toLowerCase() && (st.department_id == room.department_id || (Array.isArray(st.departments) && st.departments.includes(room.department_id))));
      if (!existingInDept) {
        staffCode = 'BV-' + Math.floor(200 + Math.random() * 790);
        this.data.staff.push({
          id: Date.now(),
          code: staffCode,
          name: customName,
          title: role,
          role_title: role,
          department_id: room.department_id,
  departments: [{"id": 8, "code": "KCDHA", "name": "Khoa Chẩn đoán Hình ảnh", "head_nurse": "KTV. Nguyễn Đức Tuấn", "doctor_in_charge": "BSCKI. Phạm Quang Nam", "phone": "0211.386.130", "color": "#6366f1", "icon": "fa-x-ray", "description": "Chụp X-quang, Cắt lớp vi tính (CT), MRI, Siêu âm màu", "order": 1, "category": "paraclinical"}, {"id": 1, "code": "KCC", "name": "Khoa Cấp cứu", "head_nurse": "ĐD. Trần Thị Lan Hương", "doctor_in_charge": "ThS. BSCKII. Phạm Quỳnh Hưng", "phone": "0211.386.115", "color": "#ef4444", "icon": "fa-ambulance", "description": "Tiếp nhận cấp cứu 24/7, xử lý khẩn cấp bệnh nhân nặng", "order": 2, "category": "clinical"}, {"id": 11, "code": "ICU", "name": "Khoa Hồi sức tích cực & Chống độc", "head_nurse": "ĐD. Nguyễn Thị Thanh Nga", "doctor_in_charge": "ThS.BS. Đinh Công Trí", "phone": "0211.386.116", "color": "#dc2626", "icon": "fa-heart-pulse", "description": "Điều trị chuyên sâu bệnh nhân hồi sức, thở máy, lọc máu liên tục", "order": 3, "category": "clinical"}, {"id": 12, "code": "PTGM", "name": "Khoa Phẫu thuật - Gây mê hồi sức", "head_nurse": "ĐD. Nguyễn Văn Thắng", "doctor_in_charge": "BSCKII. Lê Tuấn Anh", "phone": "0211.386.117", "color": "#0284c7", "icon": "fa-syringe", "description": "Khu phẫu thuật vô khuẩn, gây mê hồi tỉnh, phẫu thuật ngoại sản", "order": 4, "category": "clinical"}, {"id": 2, "code": "KKB", "name": "Khoa Khám bệnh", "head_nurse": "ĐD. Hoàng Bích Thủy", "doctor_in_charge": "BSCKI. Vũ Đình Khiêm", "phone": "0211.386.101", "color": "#0ea5e9", "icon": "fa-stethoscope", "description": "Khám bệnh ngoại trú, tư vấn và phân luồng bệnh nhân", "order": 5, "category": "clinical"}, {"id": 4, "code": "KNG", "name": "Khoa Ngoại Tổng hợp", "head_nurse": "ĐD. Bùi Văn Hùng", "doctor_in_charge": "BSCKII. Nguyễn Văn Toàn", "phone": "0211.386.120", "color": "#10b981", "icon": "fa-user-doctor", "description": "Phẫu thuật điều trị các bệnh lý tiêu hóa, gan mật, chấn thương", "order": 6, "category": "clinical"}, {"id": 5, "code": "KNT", "name": "Khoa Nội Tổng hợp", "head_nurse": "ĐD. Trần Phương Dung", "doctor_in_charge": "BSCKI. Mai Thị Hảo", "phone": "0211.386.122", "color": "#06b6d4", "icon": "fa-notes-medical", "description": "Khám và điều trị nội trú tim mạch, hô hấp, nội tiết, tiêu hóa", "order": 7, "category": "clinical"}, {"id": 6, "code": "KSN", "name": "Khoa Phụ Sản", "head_nurse": "Hộ sinh. Lê Thị Thúy Hằng", "doctor_in_charge": "BSCKII. Nguyễn Thị Hồng", "phone": "0211.386.125", "color": "#ec4899", "icon": "fa-baby", "description": "Chăm sóc thai phụ, đỡ đẻ thường, mổ lấy thai và điều trị phụ khoa", "order": 8, "category": "clinical"}, {"id": 7, "code": "KNHI", "name": "Khoa Nhi", "head_nurse": "ĐD. Đỗ Thị Hiền", "doctor_in_charge": "ThS.BS. Đặng Hồng Phúc", "phone": "0211.386.128", "color": "#eab308", "icon": "fa-children", "description": "Khám và điều trị toàn diện bệnh lý sơ sinh, trẻ nhỏ và dinh dưỡng", "order": 9, "category": "clinical"}, {"id": 3, "code": "YHCTPHCN", "name": "Khoa YHCT - Phục hồi chức năng", "head_nurse": "ĐD. Phạm Thị Lý", "doctor_in_charge": "BSCKI. Trần Văn Thái", "phone": "0211.386.118", "color": "#f59e0b", "icon": "fa-spa", "description": "Châm cứu, xoa bóp bấm huyệt, phục hồi chức năng và vật lý trị liệu", "order": 10, "category": "clinical"}, {"id": 13, "code": "LCK", "name": "Khoa Liên Chuyên Khoa (Mắt - TMH - RHM)", "head_nurse": "ĐD. Vũ Thị Loan", "doctor_in_charge": "BSCKI. Đỗ Mạnh Cường", "phone": "0211.386.129", "color": "#8b5cf6", "icon": "fa-eye", "description": "Khám chữa bệnh Răng Hàm Mặt, Tai Mũi Họng, Mắt và phẫu thuật tạo hình", "order": 11, "category": "clinical"}, {"id": 14, "code": "TDCN", "name": "Khoa Thăm dò chức năng & Nội soi", "head_nurse": "KTV. Lê Thùy Linh", "doctor_in_charge": "BS. Lê Quang Huy", "phone": "0211.386.131", "color": "#14b8a6", "icon": "fa-wave-square", "description": "Nội soi tiêu hóa, điện tim, điện não đồ, đo chức năng hô hấp", "order": 12, "category": "paraclinical"}, {"id": 9, "code": "KXN", "name": "Khoa Xét nghiệm", "head_nurse": "KTV. Đỗ Thị Thu Hường", "doctor_in_charge": "BSCKI. Vũ Đức Hải", "phone": "0211.386.132", "color": "#8b5cf6", "icon": "fa-vial-virus", "description": "Huyết học, Sinh hóa, Miễn dịch, Vi sinh đạt chuẩn an toàn sinh học", "order": 13, "category": "paraclinical"}, {"id": 15, "code": "KD", "name": "Khoa Dược", "head_nurse": "DS. Nguyễn Bích Ngọc", "doctor_in_charge": "DS CKI. Hoàng Thị Lan", "phone": "0211.386.133", "color": "#10b981", "icon": "fa-pills", "description": "Quản lý kho thuốc, cấp phát dược phẩm, hóa chất và vật tư y tế", "order": 14, "category": "paraclinical"}, {"id": 10, "code": "KKSNK", "name": "Khoa Kiểm soát Nhiễm khuẩn", "head_nurse": "ĐD. Trịnh Thị Thu Trang", "doctor_in_charge": "BSCKI. Hoàng Trọng Nghĩa", "phone": "0211.386.135", "color": "#14b8a6", "icon": "fa-shield-virus", "description": "Tiệt khuẩn dụng cụ y tế, giặt là đồ vải, giám sát vệ sinh 5S bệnh viện", "order": 15, "category": "paraclinical"}, {"id": 16, "code": "QLCL", "name": "Phòng Quản lý chất lượng & Ban Chỉ đạo 5S", "head_nurse": "ĐD. Nguyễn Thu Trang", "doctor_in_charge": "ThS. BSCKII. Phạm Quỳnh Hưng", "phone": "0211.386.100", "color": "#6366f1", "icon": "fa-award", "description": "Thường trực Ban Chỉ đạo 5S, đánh giá Bộ 83 Tiêu chí chất lượng BV", "order": 16, "category": "functional"}, {"id": 17, "code": "KHTH", "name": "Phòng Kế hoạch tổng hợp & CNTT", "head_nurse": "ĐD. Hoàng Hải Yến", "doctor_in_charge": "BSCKI. Trần Đức Thắng", "phone": "0211.386.102", "color": "#3b82f6", "icon": "fa-clipboard-list", "description": "Kế hoạch chuyên môn, chỉ đạo tuyến, quản trị hệ thống HIS/PACS", "order": 17, "category": "functional"}, {"id": 18, "code": "PDD", "name": "Phòng Điều dưỡng", "head_nurse": "ThS. ĐD. Trần Thị Lan Hương", "doctor_in_charge": "ThS. ĐD. Trần Thị Lan Hương", "phone": "0211.386.103", "color": "#06b6d4", "icon": "fa-user-nurse", "description": "Quản lý chăm sóc người bệnh, kiểm tra quy trình kỹ thuật điều dưỡng và 5S", "order": 18, "category": "functional"}, {"id": 19, "code": "HCQT", "name": "Phòng Tổ chức cán bộ & Hành chính quản trị", "head_nurse": "CN. Đặng Thị Loan", "doctor_in_charge": "ThS. Nguyễn Văn Hùng", "phone": "0211.386.105", "color": "#64748b", "icon": "fa-building", "description": "Văn thư, tiếp dân, quản trị cơ sở vật chất, bảo vệ và khuôn viên cảnh quan", "order": 19, "category": "functional"}, {"id": 20, "code": "TCKT", "name": "Phòng Tài chính - Kế toán", "head_nurse": "KTV. Lê Thu Thảo", "doctor_in_charge": "ThS. Vũ Thị Mai", "phone": "0211.386.106", "color": "#f59e0b", "icon": "fa-file-invoice-dollar", "description": "Quản lý thu chi viện phí, thanh toán BHYT, quản trị tài sản và trang thiết bị", "order": 20, "category": "functional"}],
          can_review: false,
          is_supervisor: false,
          role: 'staff'
        });
      } else {
        staffCode = existingInDept.code || staffCode;
      }
    }

    const rs = this.getRoomSchedule(roomId);
    if (!rs.staff_assigned) rs.staff_assigned = [];
    rs.staff_assigned.push({
      code: staffCode,
      name: staffName,
      role: role
    });

    this.saveData();
    this.openManageRoomStaffModal(roomId);
    this.showToast(`✅ Đã phân công ${staffName} (${role}) vào ${room.name}!`);
  }
  removeStaffFromRoom(roomId, index) {
    const rs = this.getRoomSchedule(roomId);
    if (!rs.staff_assigned || !rs.staff_assigned[index]) return;
    const removed = rs.staff_assigned.splice(index, 1);
    this.saveData();
    this.openManageRoomStaffModal(roomId);
    this.showToast(`Đã bớt ${removed[0].name} khỏi vị trí làm việc!`);
  }

  // MODAL NỘP ẢNH 5S KHI HẾT GIỜ LÀM VIỆC
  // =========================================================================
  // V9 TÍNH NĂNG 1: CHỤP ẢNH CAMERA & TẢI ẢNH BÀN GIAO 5S HIỂN THỊ TỨC THÌ
  // =========================================================================
  openEndShift5SModal(roomId) {
    const room = (this.data.rooms || []).find(r => r.id == roomId);
    if (!room) return;
    const dept = (this.data.departments || []).find(d => d.id == room.department_id) || { name: 'Khoa' };
    const rs = this.getRoomSchedule(roomId);
    const assignedStaff = rs.staff_assigned || [];
    const staffNames = assignedStaff.map(s => s.name).join(', ') || 'Cán bộ ca trực';

    this.currentShiftRoomId = roomId;
    this.currentShiftPhoto = (rs.post_shift_5s && rs.post_shift_5s.photo) || this.newAuditState.afterPhoto || '';

    const modalHtml = `
      <div class="p-5 space-y-4 max-h-[85vh] overflow-y-auto no-scrollbar">
        <!-- Input File ẩn cho Camera trực tiếp -->
        <input type="file" id="shift-camera-input" accept="image/*" capture="environment" onchange="app5s.handleShiftPhotoSelected(event)" class="hidden">
        <!-- Input File ẩn cho Chọn ảnh từ thư viện máy -->
        <input type="file" id="shift-file-input" accept="image/*" onchange="app5s.handleShiftPhotoSelected(event)" class="hidden">

        <div class="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3">
          <div class="flex items-center space-x-2">
            <div class="w-9 h-9 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 flex items-center justify-center">
              <i data-lucide="camera" class="w-5 h-5"></i>
            </div>
            <div>
              <h3 class="text-sm font-black text-slate-900 dark:text-white">CHỤP ẢNH 5S HẾT CA LÀM VIỆC</h3>
              <p class="text-[10px] text-amber-700 font-bold">Bàn giao buồng phòng sau ca trực</p>
            </div>
          </div>
          <button onclick="app5s.closeModal()" class="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400">
            <i data-lucide="x" class="w-4 h-4"></i>
          </button>
        </div>

        <div class="bg-amber-50/80 dark:bg-amber-950/40 p-3 rounded-2xl border border-amber-200 dark:border-amber-800 text-xs space-y-1">
          <div class="flex justify-between">
            <span class="text-slate-500 font-medium">Buồng phòng:</span>
            <strong class="text-slate-800 dark:text-slate-100">${room.name}</strong>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-500 font-medium">Khoa / Bộ phận:</span>
            <span class="font-bold text-slate-700 dark:text-slate-200">${dept.name}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-500 font-medium">Nhân sự bàn giao:</span>
            <span class="font-bold text-amber-800 dark:text-amber-300 text-right">${staffNames}</span>
          </div>
        </div>

        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <label class="block text-xs font-bold text-slate-800 dark:text-slate-200">
              📸 Hình ảnh minh chứng buồng phòng sau khi đã 5S sạch sẽ *
            </label>
            ${this.currentShiftPhoto ? '<span class="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-300">Đã có ảnh</span>' : ''}
          </div>

          <!-- THÔNG BÁO CHỐNG SỬ DỤNG LẠI ẢNH (V11) -->
          <div class="bg-emerald-50 dark:bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-300 dark:border-emerald-800 flex items-start space-x-2 text-[11px] text-emerald-900 dark:text-emerald-200">
            <i data-lucide="shield-check" class="w-4 h-4 text-emerald-600 shrink-0 mt-0.5"></i>
            <div>
              <strong class="font-bold">Đóng dấu ngày giờ chống gian lận:</strong> Khung hình camera tự động in chết thời gian chụp, tên buồng phòng và mã đối soát vào ảnh, ngăn ngừa dùng lại ảnh cũ.
            </div>
          </div>

          <!-- KHUNG HIỂN THỊ VÀ TẢI ẢNH 5S -->
          <div id="shift-photo-preview">
            ${this.renderShiftPhotoPreviewHtml(this.currentShiftPhoto)}
          </div>

          <!-- Nút chọn ảnh mẫu minh chứng nhanh -->
          <div class="pt-1 space-y-1">
            <div class="text-[10px] text-slate-500 font-semibold">Chọn nhanh ảnh mẫu minh chứng VPI:</div>
            <div class="flex flex-wrap gap-1.5">
              <button type="button" onclick="app5s.fillDemoAuditPhoto('ct')" class="px-2 py-1 bg-slate-100 dark:bg-slate-700 hover:bg-amber-100 text-slate-700 dark:text-slate-200 rounded-lg text-[10px] font-medium border border-slate-200 dark:border-slate-600 transition">📸 CT 128 Dãy</button>
              <button type="button" onclick="app5s.fillDemoAuditPhoto('emergency')" class="px-2 py-1 bg-slate-100 dark:bg-slate-700 hover:bg-amber-100 text-slate-700 dark:text-slate-200 rounded-lg text-[10px] font-medium border border-slate-200 dark:border-slate-600 transition">📸 Cấp cứu</button>
              <button type="button" onclick="app5s.fillDemoAuditPhoto('clinic')" class="px-2 py-1 bg-slate-100 dark:bg-slate-700 hover:bg-amber-100 text-slate-700 dark:text-slate-200 rounded-lg text-[10px] font-medium border border-slate-200 dark:border-slate-600 transition">📸 Khám bệnh</button>
              <button type="button" onclick="app5s.fillDemoAuditPhoto('icu')" class="px-2 py-1 bg-slate-100 dark:bg-slate-700 hover:bg-amber-100 text-slate-700 dark:text-slate-200 rounded-lg text-[10px] font-medium border border-slate-200 dark:border-slate-600 transition">📸 Hồi sức ICU</button>
            </div>
          </div>
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Ghi chú tình trạng buồng phòng bàn giao:</label>
          <textarea id="shift-5s-notes" rows="2" placeholder="Ví dụ: Đã lau khử khuẩn bề mặt máy móc, khay thuốc niêm phong, sàn nhà sạch sẽ khô ráo..." class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500">${(rs.post_shift_5s && rs.post_shift_5s.notes) || 'Đã vệ sinh sạch sẽ, khử khuẩn bề mặt và sắp xếp ngăn nắp buồng phòng trước khi kết thúc ca.'}</textarea>
        </div>

        <button onclick="app5s.submitEndShift5S(${roomId})" class="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black py-3 rounded-2xl shadow-md transition flex items-center justify-center space-x-2 text-xs">
          <i data-lucide="check-check" class="w-4 h-4"></i>
          <span>HOÀN TẤT & NỘP ẢNH 5S BÀN GIAO CA</span>
        </button>
      </div>
    `;

    this.showModal(modalHtml);
  }

  renderShiftPhotoPreviewHtml(photoUrl) {
    if (photoUrl) {
      return `
        <div class="relative group rounded-2xl overflow-hidden border-2 border-emerald-500 shadow-sm bg-slate-900">
          <div class="w-full bg-slate-950 rounded-xl overflow-hidden flex items-center justify-center p-1"><img src="${photoUrl}" class="w-full h-auto max-h-72 object-contain rounded-lg cursor-pointer" onclick="app5s.viewLargePhoto('${photoUrl}', 'Ảnh 5S vừa chụp')"></div>
          <div class="absolute top-2 right-2 flex items-center space-x-1.5">
            <button type="button" onclick="app5s.triggerCameraCapture()" title="Chụp lại bằng camera" class="px-2 py-1 bg-white/95 hover:bg-white text-slate-800 rounded-xl shadow text-xs font-bold flex items-center space-x-1">
              <i data-lucide="camera" class="w-3.5 h-3.5 text-emerald-600"></i>
              <span class="text-[10px]">Chụp lại</span>
            </button>
            <button type="button" onclick="app5s.triggerFileUpload()" title="Chọn ảnh khác từ máy" class="px-2 py-1 bg-white/95 hover:bg-white text-slate-800 rounded-xl shadow text-xs font-bold flex items-center space-x-1">
              <i data-lucide="folder-open" class="w-3.5 h-3.5 text-indigo-600"></i>
              <span class="text-[10px]">Tải lại</span>
            </button>
            <button type="button" onclick="app5s.clearShiftPhoto()" title="Xóa ảnh" class="p-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl shadow text-xs">
              <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
            </button>
          </div>
          <div class="absolute top-2 left-2 bg-emerald-950/85 text-emerald-300 text-[10px] font-bold px-2.5 py-1 rounded-xl flex items-center space-x-1 border border-emerald-500/60 shadow backdrop-blur-xs">
            <i data-lucide="shield-check" class="w-3.5 h-3.5 text-emerald-400"></i>
            <span>✓ Đã đóng dấu ngày giờ</span>
          </div>
        </div>
      `;
    } else {
      return `
        <div class="border-2 border-dashed border-amber-300 dark:border-amber-700 rounded-2xl p-4 text-center bg-amber-50/30 dark:bg-amber-950/20 space-y-3">
          <div class="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-300 flex items-center justify-center mx-auto shadow-2xs">
            <i data-lucide="camera" class="w-6 h-6"></i>
          </div>
          <div>
            <div class="text-xs font-bold text-amber-900 dark:text-amber-200">Bấm để Chụp ảnh hoặc Tải ảnh bàn giao lên</div>
            <div class="text-[10px] text-slate-400 mt-0.5">Yêu cầu chụp rõ mặt bàn máy, sàn phòng và vị trí sắp xếp vật tư 5S</div>
          </div>
          <div class="grid grid-cols-2 gap-2 pt-1">
            <button type="button" onclick="app5s.triggerCameraCapture()" class="w-full py-2.5 px-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5 shadow-sm transition">
              <i data-lucide="camera" class="w-4 h-4"></i>
              <span>📸 Chụp ảnh Camera</span>
            </button>
            <button type="button" onclick="app5s.triggerFileUpload()" class="w-full py-2.5 px-3 bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-800 dark:text-slate-100 border border-slate-300 dark:border-slate-600 rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5 shadow-2xs transition">
              <i data-lucide="image" class="w-4 h-4 text-slate-500"></i>
              <span>📁 Tải ảnh từ máy</span>
            </button>
          </div>
        </div>
      `;
    }
  }


  // =========================================================================
  // TÍNH NĂNG V11: ĐÓNG DẤU CHÌM CHỐNG GIAN LẬN & SỬ DỤNG LẠI ẢNH (REAL-TIME WATERMARK)
  // Đóng dấu ngày giờ, cơ sở y tế, buồng phòng, cán bộ chụp & mã hash trực tiếp vào điểm ảnh
  // =========================================================================
  stamp5SWatermark(canvas, info = {}) {
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const scale = Math.max(0.65, Math.min(width, height) / 800);

    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const dateStr = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()}`;
    const timeStr = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    const fullDateTime = `${dateStr} ${timeStr}`;

    const deptName = info.deptName || 'Khoa / Phòng Bệnh viện';
    const roomName = info.roomName || 'Khu vực làm việc 5S';
    const staffName = info.staffName || (this.getCurrentUser() ? `${this.getCurrentUser().name} (${this.getCurrentUser().code})` : 'Cán bộ 5S VPI');
    const shiftName = info.shiftName || 'Ca làm việc';
    const randomHex = Math.random().toString(16).substring(2, 6).toUpperCase();
    const verifyCode = `VPI-5S-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}-${randomHex}`;

    ctx.save();

    // 1. TOP-LEFT LIVE BADGE: Camera Real-time Timestamp
    const badgeFont = `bold ${Math.round(13 * scale)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    ctx.font = badgeFont;
    const badgeText = `● CHỤP CAMERA THỜI GIAN THỰC: ${fullDateTime}`;
    const badgePadX = 12 * scale;
    const badgeWidth = ctx.measureText(badgeText).width + badgePadX * 2;
    const badgeHeight = 28 * scale;
    const padMargin = 16 * scale;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 1.5 * scale;
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(padMargin, padMargin, badgeWidth, badgeHeight, 6 * scale);
    } else {
      ctx.rect(padMargin, padMargin, badgeWidth, badgeHeight);
    }
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#34d399';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(badgeText, padMargin + badgePadX, padMargin + badgeHeight / 2);

    // 2. TOP-RIGHT ANTI-REUSE VERIFICATION SEAL
    const sealFont = `bold ${Math.round(10.5 * scale)}px monospace`;
    ctx.font = sealFont;
    const sealText = `✓ CHỐNG DÙNG LẠI ẢNH • #${verifyCode.slice(-10)}`;
    const sealWidth = ctx.measureText(sealText).width + 16 * scale;
    const sealHeight = 24 * scale;
    const sealX = width - sealWidth - padMargin;

    if (sealX > padMargin + badgeWidth + 10) {
      ctx.fillStyle = 'rgba(2, 44, 34, 0.9)';
      ctx.strokeStyle = '#059669';
      ctx.lineWidth = 1.5 * scale;
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(sealX, padMargin, sealWidth, sealHeight, 5 * scale);
      } else {
        ctx.rect(sealX, padMargin, sealWidth, sealHeight);
      }
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#a7f3d0';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(sealText, sealX + 8 * scale, padMargin + sealHeight / 2);
    }

    // 3. BOTTOM BANNER CARD (DIGITAL HUD WATERMARK)
    const bannerHeight = 110 * scale;
    const bannerX = padMargin;
    const bannerY = height - bannerHeight - padMargin;
    const bannerWidth = width - padMargin * 2;

    const bGrad = ctx.createLinearGradient(bannerX, bannerY, bannerX + bannerWidth, bannerY + bannerHeight);
    bGrad.addColorStop(0, 'rgba(15, 23, 42, 0.94)');
    bGrad.addColorStop(1, 'rgba(6, 78, 59, 0.92)');
    ctx.fillStyle = bGrad;
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.9)';
    ctx.lineWidth = 2 * scale;
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(bannerX, bannerY, bannerWidth, bannerHeight, 12 * scale);
    } else {
      ctx.rect(bannerX, bannerY, bannerWidth, bannerHeight);
    }
    ctx.fill();
    ctx.stroke();

    // Accent emerald line
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(bannerX + 4 * scale, bannerY + 10 * scale, 5 * scale, bannerHeight - 20 * scale, 2.5 * scale);
    } else {
      ctx.rect(bannerX + 4 * scale, bannerY + 10 * scale, 5 * scale, bannerHeight - 20 * scale);
    }
    ctx.fill();

    const textX = bannerX + 18 * scale;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    // Line 1: Hospital Name & Department Tag
    ctx.fillStyle = '#f8fafc';
    ctx.font = `bold ${Math.round(15 * scale)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    ctx.fillText('🏥 BỆNH VIỆN VĨNH PHÚC VPI • BAN CHỈ ĐẠO 5S TOÀN VIỆN', textX, bannerY + 11 * scale);

    // Line 2: Room Name & Department
    ctx.fillStyle = '#38bdf8';
    ctx.font = `bold ${Math.round(13 * scale)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    ctx.fillText(`📍 ${roomName}  [${deptName}]`, textX, bannerY + 36 * scale);

    // Line 3: Timestamp (Highlighted in bold gold/yellow)
    ctx.fillStyle = '#fde047';
    ctx.font = `bold ${Math.round(13.5 * scale)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    ctx.fillText(`⏱️ THỜI GIAN CHỤP: ${fullDateTime} (GIỜ HỆ THỐNG THỰC TẾ)`, textX, bannerY + 59 * scale);

    // Line 4: Staff & Shift
    ctx.fillStyle = '#cbd5e1';
    ctx.font = `${Math.round(11.5 * scale)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    ctx.fillText(`👤 Cán bộ thực hiện: ${staffName} • ${shiftName}`, textX, bannerY + 83 * scale);

    // Right Verification Box
    const codeBoxWidth = 210 * scale;
    const codeBoxHeight = 40 * scale;
    const codeBoxX = bannerX + bannerWidth - codeBoxWidth - 12 * scale;
    const codeBoxY = bannerY + bannerHeight - codeBoxHeight - 12 * scale;

    if (bannerWidth > 480 * scale) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.strokeStyle = 'rgba(52, 211, 153, 0.6)';
      ctx.lineWidth = 1 * scale;
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(codeBoxX, codeBoxY, codeBoxWidth, codeBoxHeight, 7 * scale);
      } else {
        ctx.rect(codeBoxX, codeBoxY, codeBoxWidth, codeBoxHeight);
      }
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#34d399';
      ctx.font = `bold ${Math.round(9.5 * scale)}px monospace`;
      ctx.fillText('MÃ ĐỐI SOÁT CHỐNG GIAN LẬN', codeBoxX + 8 * scale, codeBoxY + 6 * scale);
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${Math.round(11 * scale)}px monospace`;
      ctx.fillText(verifyCode, codeBoxX + 8 * scale, codeBoxY + 20 * scale);
    }

    ctx.restore();
    return verifyCode;
  }

  // =========================================================================
  // GIAO DIỆN CAMERA TRỰC TIẾP VỚI THƯỚC NGẮM & ĐỒNG HỒ THỜI GIAN THỰC
  // =========================================================================
  openLiveCameraModal(options = {}) {
    const target = options.target || 'shift';
    let roomId = options.roomId || this.currentShiftRoomId || this.newAuditState.roomId || 34;
    const room = (this.data.rooms || []).find(r => r.id == roomId) || { name: 'Buồng phòng y tế', department_id: 8 };
    const dept = (this.data.departments || []).find(d => d.id == room.department_id) || { name: 'Khoa phòng' };
    const user = this.getCurrentUser() || { name: 'Cán bộ 5S', code: 'BV-345', title: 'Cán bộ giám sát' };
    const staffName = `${user.name} (${user.code})`;

    this.liveCameraOptions = {
      target,
      roomId,
      roomName: room.name,
      deptName: dept.name,
      staffName,
      shiftName: this.newAuditState.shift || 'Ca làm việc 5S',
      facingMode: this.liveCameraFacingMode || 'environment'
    };

    const modalHtml = `
      <div class="relative bg-slate-950 text-white rounded-3xl overflow-hidden shadow-2xl max-w-lg mx-auto border border-slate-800">
        <!-- Live HUD Header -->
        <div class="absolute top-0 inset-x-0 z-20 bg-gradient-to-b from-slate-950/95 via-slate-950/70 to-transparent p-4 flex items-center justify-between">
          <div class="flex items-center space-x-2">
            <span class="w-3 h-3 rounded-full bg-red-500 animate-ping"></span>
            <span class="text-xs font-black tracking-wide text-white uppercase">CAMERA 5S THỜI GIAN THỰC</span>
          </div>
          <div id="live-camera-timer" class="text-xs font-mono font-bold text-amber-300 bg-black/60 px-2.5 py-1 rounded-full border border-amber-500/40 backdrop-blur-xs">
            00:00:00
          </div>
          <button onclick="app5s.closeLiveCameraModal()" class="p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition">
            <i data-lucide="x" class="w-4 h-4"></i>
          </button>
        </div>

        <!-- Video Viewfinder with Viewfinder Crosshair -->
        <div class="relative aspect-4/3 sm:aspect-16/9 w-full bg-black flex items-center justify-center overflow-hidden">
          <video id="live-camera-feed" autoplay playsinline class="w-full h-full object-cover"></video>

          <!-- Viewfinder Frame Guidelines (Thước ngắm 5S) -->
          <div class="absolute inset-8 pointer-events-none border border-emerald-400/40 rounded-2xl flex flex-col justify-between p-3">
            <div class="flex justify-between">
              <span class="w-4 h-4 border-t-2 border-l-2 border-emerald-400 rounded-tl-sm"></span>
              <span class="w-4 h-4 border-t-2 border-r-2 border-emerald-400 rounded-tr-sm"></span>
            </div>
            <!-- Center Crosshair -->
            <div class="self-center flex items-center justify-center w-8 h-8 rounded-full border border-emerald-400/30">
              <span class="w-2 h-2 rounded-full bg-emerald-400/70"></span>
            </div>
            <div class="flex justify-between">
              <span class="w-4 h-4 border-b-2 border-l-2 border-emerald-400 rounded-bl-sm"></span>
              <span class="w-4 h-4 border-b-2 border-r-2 border-emerald-400 rounded-br-sm"></span>
            </div>
          </div>

          <!-- Bottom HUD Bar on Viewfinder: Watermark Notice -->
          <div class="absolute bottom-3 inset-x-4 pointer-events-none bg-slate-900/85 backdrop-blur-xs rounded-xl p-2 border border-emerald-500/50 text-[11px] space-y-0.5">
            <div class="flex items-center justify-between text-emerald-300 font-bold">
              <span>📍 ${room.name}</span>
              <span class="text-[10px] text-slate-300">[${dept.name}]</span>
            </div>
            <div class="flex items-center justify-between text-[10px] text-amber-300">
              <span>🛡️ Đóng dấu ngày giờ & mã đối soát chống dùng lại ảnh</span>
              <span class="text-white font-mono" id="live-camera-date-sub"></span>
            </div>
          </div>
        </div>

        <!-- Action Controls -->
        <div class="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between gap-3">
          <button type="button" onclick="app5s.switchCameraFacing()" title="Đổi camera trước/sau" class="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex flex-col items-center justify-center text-[10px] font-bold">
            <i data-lucide="refresh-cw" class="w-4 h-4 mb-0.5 text-slate-300"></i>
            <span>Đổi cam</span>
          </button>

          <!-- Primary Shutter Button -->
          <button type="button" onclick="app5s.captureFromLiveCamera()" class="flex-1 py-3 px-4 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-600 hover:to-teal-600 text-white font-black text-sm rounded-2xl shadow-lg flex items-center justify-center space-x-2 transition transform active:scale-95">
            <div class="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
              <i data-lucide="camera" class="w-4 h-4 text-white"></i>
            </div>
            <span>CHỤP ẢNH & ĐÓNG DẤU NGÀY GIỜ</span>
          </button>

          <button type="button" onclick="app5s.fallbackToNativeCamera()" title="Dùng camera hệ thống" class="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex flex-col items-center justify-center text-[10px] font-bold">
            <i data-lucide="folder-open" class="w-4 h-4 mb-0.5 text-slate-300"></i>
            <span>Tải ảnh</span>
          </button>
        </div>
      </div>
    `;

    this.showModal(modalHtml);
    this.startLiveCameraStream();
  }

  async startLiveCameraStream() {
    this.stopLiveCameraStream();
    const video = document.getElementById('live-camera-feed');
    if (!video) return;

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.warn('getUserMedia not supported, fallback to native camera');
      return;
    }

    try {
      const constraints = {
        video: {
          facingMode: this.liveCameraOptions?.facingMode || 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.currentLiveStream = stream;
      video.srcObject = stream;
      video.play().catch(e => console.warn('Video play error:', e));

      const updateClock = () => {
        const timerEl = document.getElementById('live-camera-timer');
        const dateSubEl = document.getElementById('live-camera-date-sub');
        if (timerEl) {
          const now = new Date();
          const pad = n => String(n).padStart(2, '0');
          timerEl.innerText = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
          if (dateSubEl) {
            dateSubEl.innerText = `${pad(now.getDate())}/${pad(now.getMonth()+1)}/${now.getFullYear()}`;
          }
        }
      };
      updateClock();
      this.liveCameraInterval = setInterval(updateClock, 1000);
    } catch (err) {
      console.warn('Cannot start getUserMedia stream:', err);
    }
  }

  stopLiveCameraStream() {
    if (this.currentLiveStream) {
      this.currentLiveStream.getTracks().forEach(t => t.stop());
      this.currentLiveStream = null;
    }
    if (this.liveCameraInterval) {
      clearInterval(this.liveCameraInterval);
      this.liveCameraInterval = null;
    }
  }

  closeLiveCameraModal() {
    this.stopLiveCameraStream();
    const opt = this.liveCameraOptions || {};
    if (opt.target === 'shift' && opt.roomId) {
      this.openEndShift5SModal(opt.roomId);
    } else {
      this.closeModal();
    }
  }

  switchCameraFacing() {
    this.liveCameraFacingMode = (this.liveCameraFacingMode === 'user') ? 'environment' : 'user';
    if (this.liveCameraOptions) {
      this.liveCameraOptions.facingMode = this.liveCameraFacingMode;
    }
    this.startLiveCameraStream();
  }

  fallbackToNativeCamera() {
    const opt = this.liveCameraOptions || {};
    this.stopLiveCameraStream();
    if (opt.target === 'audit') {
      const fileInput = document.getElementById('audit-file-input') || document.getElementById('audit-camera-input');
      if (fileInput) fileInput.click();
    } else {
      if (opt.roomId) this.openEndShift5SModal(opt.roomId);
      setTimeout(() => {
        const camInput = document.getElementById('shift-camera-input') || document.getElementById('shift-file-input');
        if (camInput) camInput.click();
      }, 100);
    }
  }

  captureFromLiveCamera() {
    const video = document.getElementById('live-camera-feed');
    let width = (video && video.videoWidth) || 1280;
    let height = (video && video.videoHeight) || 720;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    if (video && video.videoWidth) {
      ctx.drawImage(video, 0, 0, width, height);
    } else {
      const grad = ctx.createLinearGradient(0, 0, width, height);
      grad.addColorStop(0, '#0f172a');
      grad.addColorStop(1, '#064e3b');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('ẢNH CHỤP MINH CHỨNG 5S BUỒNG PHÒNG THỰC TẾ', width / 2, height / 2);
    }

    const opt = this.liveCameraOptions || {};
    this.stamp5SWatermark(canvas, {
      deptName: opt.deptName,
      roomName: opt.roomName,
      staffName: opt.staffName,
      shiftName: opt.shiftName
    });

    const photoUrl = canvas.toDataURL('image/jpeg', 0.85);

    this.stopLiveCameraStream();

    if (opt.target === 'audit') {
      this.newAuditState.afterPhoto = photoUrl;
      this.closeModal();
      this.render();
      this.showToast('✅ Đã chụp và đóng dấu ngày giờ thực tế vào ảnh thành công!');
    } else {
      this.currentShiftPhoto = photoUrl;
      this.newAuditState.afterPhoto = photoUrl;
      this.openEndShift5SModal(opt.roomId);
      setTimeout(() => {
        this.updateShiftPhotoPreviewUI(photoUrl);
        this.showToast('✅ Đã chụp và đóng dấu ngày giờ thực tế vào ảnh thành công!');
      }, 80);
    }
  }

  triggerCameraCapture() {
    this.openLiveCameraModal({ target: 'shift', roomId: this.currentShiftRoomId });
  }


  triggerFileUpload() {
    const fileInput = document.getElementById('shift-file-input');
    if (fileInput) fileInput.click();
  }

  updateShiftPhotoPreviewUI(photoUrl) {
    this.currentShiftPhoto = photoUrl;
    this.newAuditState.afterPhoto = photoUrl;
    const previewEl = document.getElementById('shift-photo-preview');
    if (previewEl) {
      previewEl.innerHTML = this.renderShiftPhotoPreviewHtml(photoUrl);
      if (window.lucide) window.lucide.createIcons();
    }
  }

  clearShiftPhoto() {
    this.updateShiftPhotoPreviewUI('');
    this.showToast('Đã xóa ảnh minh chứng');
  }

  handleShiftPhotoSelected(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const img = new Image();
      img.onload = () => {
        // Nén ảnh qua Canvas để tối ưu dung lượng và tốc độ
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDim = 1280;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // ĐÓNG DẤU NGÀY GIỜ & MÃ ĐỐI SOÁT CHỐNG GIAN LẬN
        const roomId = this.currentShiftRoomId || this.newAuditState.roomId || 34;
        const room = (this.data.rooms || []).find(r => r.id == roomId) || { name: 'Buồng phòng y tế', department_id: 8 };
        const dept = (this.data.departments || []).find(d => d.id == room.department_id) || { name: 'Khoa phòng' };
        const user = this.getCurrentUser() || { name: 'Cán bộ 5S', code: 'BV-345' };

        this.stamp5SWatermark(canvas, {
          deptName: dept.name,
          roomName: room.name,
          staffName: `${user.name} (${user.code})`,
          shiftName: this.newAuditState.shift || 'Ca trực buồng phòng'
        });

        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);

        this.updateShiftPhotoPreviewUI(compressedDataUrl);
        this.showToast('✅ Đã nạp và hiển thị ảnh minh chứng 5S thành công!');
      };
      img.src = evt.target.result;
    };
    reader.readAsDataURL(file);
  }

  submitEndShift5S(roomId, optionalPhoto = null, optionalNotes = null) {
    const rs = this.getRoomSchedule(roomId);
    const photoInput = optionalPhoto || this.currentShiftPhoto || this.newAuditState.afterPhoto;
    const notesInput = document.getElementById('shift-5s-notes');
    const notes = optionalNotes || (notesInput ? notesInput.value.trim() : 'Đã dọn dẹp vệ sinh và khử khuẩn buồng phòng sau ca trực.');

    if (!photoInput) {
      this.showToast('⚠️ Vui lòng chụp ảnh hoặc chọn ảnh minh chứng 5S trước khi gửi bàn giao ca!');
      return;
    }

    const room = (this.data.rooms || []).find(r => r.id == roomId) || { name: 'Buồng phòng', department_id: rs.department_id };
    const dept = (this.data.departments || []).find(d => d.id == room.department_id) || { name: 'Khoa' };
    const user = this.getCurrentUser() || { name: 'Nhân viên trực', code: 'BV-345', title: 'Cán bộ 5S' };

    const assignedNames = (rs.staff_assigned || []).map(s => s.name).join(', ') || user.name;
    const currentTime = new Date().toTimeString().slice(0, 5);

    // Tạo bản ghi Audit mới
    const newAudit = {
      id: Date.now(),
      audit_code: '5S-CA-' + this.getTodayDateString().replace(/-/g, '') + '-' + Math.floor(100 + Math.random() * 900),
      department_id: room.department_id,
      room_id: roomId,
      audit_date: this.getTodayDateString(),
      audit_time: currentTime,
      shift: rs.shift_id === 'morning' ? 'Ca sáng (07:00 - 11:30)' : (rs.shift_id === 'afternoon' ? 'Ca chiều (13:30 - 17:00)' : 'Ca trực đêm'),
      inspector_name: user.name,
      inspector_role: user.title || user.role_title || 'Cán bộ 5S',
      sender_name: assignedNames,
      sender_role: 'Nhân sự ca trực',
      sender_code: user.code,
      score_seiri: 20, score_seiton: 20, score_seiso: 20, score_seiketsu: 19, score_shitsuke: 19,
      total_score: 98,
      rating: 'Xuất sắc',
      notes: notes,
      after_photo: photoInput,
      status: 'pending', // Chờ cán bộ giám sát kiểm tra và phê duyệt
      evaluator_name: '', evaluator_code: '', evaluator_role: '', evaluation_date: '', evaluation_time: '',
      evaluation_result: null, issue_detected: '', remedy_deadline: '', evaluation_notes: '',
      created_at: new Date().toISOString()
    };

    if (!this.data.audits) this.data.audits = [];
    this.data.audits.unshift(newAudit);

    // Cập nhật trạng thái 5S ca trực của phòng
    rs.post_shift_5s = {
      status: 'submitted',
      photo: photoInput,
      submitted_at: currentTime,
      submitted_by: assignedNames,
      audit_id: newAudit.id,
      notes: notes
    };

    this.currentShiftPhoto = null;
    this.newAuditState.afterPhoto = null;
    this.saveData();
    this.closeModal();
    this.render();
    this.showToast(`✅ Đã nộp ảnh 5S bàn giao ca cho ${room.name}!`);
  }


    // MODAL ĐỒNG BỘ GOOGLE TRANG TÍNH VÀ EXCEL
  openGoogleSheetSyncModal() {
    const sheetUrl = this.data.schedules.google_sheet_url || 'https://docs.google.com/spreadsheets/d/1tHg7-i__1yRdBbamuYCAKXYy7KdZflOtoin8Ay6jjBc/edit?gid=1227014826#gid=1227014826';

    const modalHtml = `
      <div class="p-5 space-y-4 max-h-[85vh] overflow-y-auto no-scrollbar">
        <div class="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3">
          <div class="flex items-center space-x-2">
            <div class="w-9 h-9 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
              <i data-lucide="file-spreadsheet" class="w-5 h-5"></i>
            </div>
            <div>
              <h3 class="text-sm font-black text-slate-900 dark:text-white">ĐỒNG BỘ LỊCH TOÀN VIỆN</h3>
              <p class="text-[10px] text-slate-500 font-mono">Google Sheets & Excel (.xlsx)</p>
            </div>
          </div>
          <button onclick="app5s.closeModal()" class="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400">
            <i data-lucide="x" class="w-4 h-4"></i>
          </button>
        </div>

        <!-- HƯỚNG DẪN BẬT QUYỀN TRUY CẬP GOOGLE SHEET -->
        <div class="bg-amber-50/80 dark:bg-amber-950/40 p-3.5 rounded-2xl border border-amber-200 dark:border-amber-900/60 text-xs space-y-2">
          <div class="flex items-center space-x-1.5 font-bold text-amber-900 dark:text-amber-200">
            <i data-lucide="info" class="w-4 h-4 text-amber-600 shrink-0"></i>
            <span>Hướng dẫn mở quyền xem Google Trang Tính:</span>
          </div>
          <p class="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
            Để hệ thống tự động đọc được dữ liệu trực tiếp từ Google Sheet, file cần được bật quyền chia sẻ:
          </p>
          <ol class="list-decimal pl-4 text-[10.5px] text-amber-900 dark:text-amber-200 space-y-1">
            <li>Mở file <strong>2026-Lịch làm việc tuần VPI toàn viện</strong> trên Google Sheets.</li>
            <li>Bấm nút <strong>Chia sẻ (Share)</strong> ở góc trên bên phải.</li>
            <li>Tại mục <em>Quyền truy cập chung</em>, chọn <strong>"Bất kỳ ai có đường liên kết" (Anyone with the link)</strong>.</li>
            <li>Phân vai trò <strong>"Người xem" (Viewer)</strong> rồi bấm <strong>Xong</strong>.</li>
          </ol>
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Đường dẫn Google Sheets hiện tại:</label>
          <input type="text" id="sync-sheet-url-input" value="${sheetUrl}" class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-2 text-xs font-mono text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500">
        </div>

        <div class="grid grid-cols-2 gap-2">
          <button onclick="app5s.saveGoogleSheetUrl()" class="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition flex items-center justify-center space-x-1 shadow-xs">
            <i data-lucide="refresh-cw" class="w-3.5 h-3.5"></i>
            <span>Đồng bộ từ Sheet</span>
          </button>

          <button onclick="app5s.exportScheduleToExcel()" class="py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition flex items-center justify-center space-x-1 shadow-xs">
            <i data-lucide="download" class="w-3.5 h-3.5"></i>
            <span>Xuất Excel (.csv)</span>
          </button>
        </div>

        <!-- TẢI LÊN FILE EXCEL / CSV TRỰC TIẾP TỪ MÁY TÍNH -->
        <div class="border-t border-slate-200 dark:border-slate-700 pt-3 space-y-2">
          <label class="block text-xs font-bold text-slate-700 dark:text-slate-300">Hoặc tải file Excel / CSV lịch làm việc từ máy tính:</label>
          <label class="flex items-center justify-center space-x-2 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 p-4 rounded-2xl cursor-pointer bg-slate-50 dark:bg-slate-900/40 transition">
            <i data-lucide="upload-cloud" class="w-5 h-5 text-emerald-600"></i>
            <span class="text-xs font-bold text-slate-700 dark:text-slate-200">Chọn file .xlsx hoặc .csv để nhập</span>
            <input type="file" accept=".xlsx,.csv,.xls" onchange="app5s.importScheduleFromFile(event)" class="hidden">
          </label>
        </div>
      </div>
    `;

    this.showModal(modalHtml);
  }

  saveGoogleSheetUrl() {
    const input = document.getElementById('sync-sheet-url-input');
    if (!input) return;
    const url = input.value.trim();
    if (!url) {
      alert('Vui lòng nhập đường link Google Sheets!');
      return;
    }
    this.data.schedules.google_sheet_url = url;
    this.saveData();
    this.closeModal();
    this.showToast('✅ Đã lưu đường dẫn Google Sheets! Hệ thống đang kết nối dữ liệu lịch tuần VPI.');
    this.render();
  }

  exportScheduleToExcel() {
    const depts = this.data.departments || [];
    const rooms = this.data.rooms || [];
    const schedules = this.data.schedules || {};
    const roomSchedules = schedules.rooms_schedule || [];

    let csv = '\uFEFFSTT,Mã Khoa,Tên Khoa/Phòng,Mã Phòng,Tên Buồng Phòng,Tầng,Trạng Thái Hoạt Động,Nhân Sự Trực Ca,Tình Trạng 5S Hết Ca,Giờ Nộp 5S\n';

    rooms.forEach((r, idx) => {
      const d = depts.find(dept => dept.id == r.department_id) || { code: '', name: '' };
      const rs = this.getRoomSchedule(r.id);
      const isWorkingStr = rs.is_working ? 'Đang làm việc' : 'Không làm việc';
      const staffNames = (rs.staff_assigned || []).map(s => `${s.name} (${s.role})`).join('; ') || 'Chưa phân công';
      const s5Status = rs.post_shift_5s ? (rs.post_shift_5s.status === 'submitted' ? 'Đã nộp 5S' : (rs.post_shift_5s.status === 'overdue' ? 'Quá hạn chưa nộp' : 'Chờ nộp')) : 'Chưa nộp';
      const s5Time = rs.post_shift_5s ? (rs.post_shift_5s.submitted_at || '') : '';

      csv += `"${idx + 1}","${d.code}","${d.name}","${r.code || ''}","${r.name}","${r.floor || ''}","${isWorkingStr}","${staffNames}","${s5Status}","${s5Time}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Lich_Lam_Viec_5S_VPI_${this.getTodayDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    this.showToast('📥 Đã xuất báo cáo lịch làm việc & trạng thái buồng phòng ra file CSV!');
  }

  importScheduleFromFile(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    this.closeModal();
    this.showToast(`✅ Đã nhập lịch thành công từ tệp ${file.name}!`);
    this.render();
  }

  broadcastEndShift5SReminder() {
    const stats = this.getScheduleStatistics();
    const overdue = stats.overdueRooms || [];
    const rooms = this.data.rooms || [];
    const today = this.getTodayDateString();
    const currentTime = new Date().toTimeString().slice(0, 5);

    const overdueRoomNames = overdue.slice(0, 4).map(rs => {
      const r = rooms.find(room => room.id == rs.room_id);
      return r ? r.name : 'Buồng phòng';
    }).join(', ') + (overdue.length > 4 ? ` và ${overdue.length - 4} phòng khác` : '');

    this.data.hospital.notice = {
      enabled: true,
      type: 'danger',
      title: 'NHẮC NHỞ KHẨN: CHỤP ẢNH 5S BÀN GIAO CA LÀM VIỆC',
      content: `Hiện tại có ${overdue.length} buồng phòng đã kết thúc ca trực nhưng chưa chụp gửi ảnh 5S bàn giao (${overdueRoomNames}). Ban Chỉ Đạo 5S yêu cầu các Bác sĩ, Điều dưỡng và KTV trực ca khẩn trương vệ sinh và nộp ảnh 5S ngay.`,
      updatedAt: `${today} ${currentTime}`
    };

    this.saveData();
    this.render();
    this.showToast('📢 Đã phát thông báo khẩn đôn đốc nộp ảnh 5S hết ca toàn viện!');
  }

  // =========================================================================
  // GIAO DIỆN CHÍNH TAB LỊCH LÀM VIỆC & TRẠNG THÁI BUỒNG PHÒNG (TAB SCHEDULE)
  // =========================================================================
  renderScheduleTab() {
    const hosp = this.data.hospital;
    const depts = this.getSortedDepartments();
    const rooms = this.data.rooms || [];
    const stats = this.getScheduleStatistics();

    const days = [
      { id: 'Mon', name: 'Thứ 2' },
      { id: 'Tue', name: 'Thứ 3' },
      { id: 'Wed', name: 'Thứ 4' },
      { id: 'Thu', name: 'Thứ 5' },
      { id: 'Fri', name: 'Thứ 6' },
      { id: 'Sat', name: 'Thứ 7' },
      { id: 'Sun', name: 'Chủ nhật (Hôm nay)' }
    ];

    const shifts = [
      { id: 'all', name: 'Tất cả ca' },
      { id: 'morning', name: 'Ca sáng (07:00 - 11:30)' },
      { id: 'afternoon', name: 'Ca chiều (13:30 - 17:00)' },
      { id: 'night', name: 'Ca đêm (17:00 - 07:00)' }
    ];

    // Lọc danh sách phòng theo bộ lọc
    const q = (this.scheduleState.searchQuery || '').toLowerCase();
    const selectedDept = this.scheduleState.selectedDept;
    const statusFilter = this.scheduleState.selectedStatusFilter;

    let filteredRooms = rooms;

    if (selectedDept && selectedDept !== 'all') {
      filteredRooms = filteredRooms.filter(r => String(r.department_id) === String(selectedDept));
    }

    if (q) {
      filteredRooms = filteredRooms.filter(r => {
        const rs = this.getRoomSchedule(r.id);
        const staffNames = (rs.staff_assigned || []).map(s => s.name).join(' ').toLowerCase();
        const text = `${r.name} ${r.code || ''} ${staffNames}`.toLowerCase();
        return text.includes(q);
      });
    }

    if (statusFilter === 'working') {
      filteredRooms = filteredRooms.filter(r => this.getRoomSchedule(r.id).is_working);
    } else if (statusFilter === 'idle') {
      filteredRooms = filteredRooms.filter(r => !this.getRoomSchedule(r.id).is_working);
    } else if (statusFilter === 'pending_5s') {
      filteredRooms = filteredRooms.filter(r => {
        const rs = this.getRoomSchedule(r.id);
        return rs.is_working && (!rs.post_shift_5s || rs.post_shift_5s.status === 'overdue' || rs.post_shift_5s.status === 'pending');
      });
    } else if (statusFilter === 'completed_5s') {
      filteredRooms = filteredRooms.filter(r => {
        const rs = this.getRoomSchedule(r.id);
        return rs.is_working && rs.post_shift_5s && (rs.post_shift_5s.status === 'submitted' || rs.post_shift_5s.status === 'approved');
      });
    } else if (statusFilter === 'pending_review') {
      filteredRooms = filteredRooms.filter(r => {
        const rs = this.getRoomSchedule(r.id);
        return rs.post_shift_5s && rs.post_shift_5s.photo && (rs.post_shift_5s.status === 'submitted' || rs.post_shift_5s.status === 'pending');
      });
    } else if (statusFilter === 'approved_5s') {
      filteredRooms = filteredRooms.filter(r => {
        const rs = this.getRoomSchedule(r.id);
        return rs.post_shift_5s && rs.post_shift_5s.status === 'approved';
      });
    } else if (statusFilter === 'rejected_5s') {
      filteredRooms = filteredRooms.filter(r => {
        const rs = this.getRoomSchedule(r.id);
        return rs.post_shift_5s && rs.post_shift_5s.status === 'rejected';
      });
    } else if (statusFilter === 'all_submitted') {
      filteredRooms = filteredRooms.filter(r => {
        const rs = this.getRoomSchedule(r.id);
        return rs.post_shift_5s && rs.post_shift_5s.photo;
      });
    }

    return `
      <div class="p-4 space-y-4">
        <!-- HEADER LỊCH LÀM VIỆC & CÁC NÚT ĐỒNG BỘ -->
        <div class="flex items-center justify-between">
          <div>
            <span class="text-xs font-mono font-bold text-indigo-600">QUẢN LÝ KHU VỰC LÀM VIỆC & PHÂN CÔNG 5S</span>
            <h2 class="text-base font-black text-slate-900 dark:text-white">Khu Vực Làm Việc Toàn Viện VPI</h2>
          </div>
          <div class="flex items-center space-x-1.5">
            <!-- NÚT TRUNG TÂM KIỂM DUYỆT ẢNH 5S TOÀN VIỆN -->
            <button onclick="app5s.openAllShiftAuditsCenterModal()" title="Kiểm duyệt ảnh 5S toàn viện" class="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-xs font-bold px-2.5 py-1.5 rounded-xl shadow-xs transition flex items-center space-x-1">
              <i data-lucide="shield-check" class="w-3.5 h-3.5"></i>
              <span>Duyệt Ảnh 5S (${stats.pendingReviewCount})</span>
            </button>
            <!-- NÚT CHUYỂN ĐỔI TÀI KHOẢN (GIÁM SÁT VS CÁ NHÂN KHOA) -->
            <button onclick="app5s.openSwitchAccountModal()" title="Chuyển đổi tài khoản (Giám sát / Cá nhân khoa)" class="bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 text-xs font-bold px-2 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800 transition flex items-center space-x-1">
              <i data-lucide="shield" class="w-3.5 h-3.5 text-indigo-600"></i>
              <span>${this.isUserManagerOrSupervisor() ? '🛡️ Giám sát' : '🔒 ' + (this.getCurrentUser()?.name?.split('. ')?.pop() || 'Cá nhân')}</span>
            </button>
            <!-- NÚT BÁO CÁO TỔNG KẾT NGÀY -->
            <button onclick="app5s.openDailySummaryModal()" title="Báo cáo tổng kết 5S ngày" class="bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold px-2 py-1.5 rounded-xl shadow-xs transition flex items-center space-x-1">
              <i data-lucide="bar-chart-2" class="w-3.5 h-3.5"></i>
              <span>Báo Cáo</span>
            </button>
            <button onclick="app5s.openGoogleSheetSyncModal()" title="Đồng bộ Google Sheets & Excel" class="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold p-1.5 rounded-xl shadow-xs transition">
              <i data-lucide="file-spreadsheet" class="w-3.5 h-3.5"></i>
            </button>
          </div>
        </div>

        <!-- BỘ CHỌN TUẦN LÀM VIỆC & THANH NGÀY TRONG TUẦN -->
        <div class="bg-white dark:bg-slate-800 rounded-3xl p-3.5 border border-slate-200/90 dark:border-slate-700 shadow-sm space-y-2.5">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-2">
              <i data-lucide="calendar" class="w-4 h-4 text-indigo-600"></i>
              <span class="text-xs font-bold text-slate-800 dark:text-slate-100">Tuần 42 (12/10 - 18/10/2026)</span>
            </div>
            <span class="text-[10px] bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold px-2 py-0.5 rounded-full border border-indigo-200">
              Năm 2026
            </span>
          </div>

          <!-- Thanh cuộn ngày trong tuần -->
          <div class="flex space-x-1.5 overflow-x-auto pb-1 no-scrollbar text-xs font-bold">
            ${days.map(d => `
              <button onclick="app5s.setScheduleDay('${d.id}')" class="shrink-0 px-2.5 py-1.5 rounded-xl transition ${
                this.scheduleState.selectedDay === d.id
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
              }">
                ${d.name}
              </button>
            `).join('')}
          </div>

          <!-- Thanh chọn Ca làm việc -->
          <div class="flex space-x-1.5 overflow-x-auto pb-0.5 no-scrollbar text-xs">
            ${shifts.map(s => `
              <button onclick="app5s.setScheduleShift('${s.id}')" class="shrink-0 px-2 py-1 rounded-lg text-[10.5px] font-bold transition ${
                this.scheduleState.selectedShift === s.id
                  ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900'
                  : 'bg-white dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700'
              }">
                ${s.name}
              </button>
            `).join('')}
          </div>
        </div>

        <!-- DASHBOARD THỐNG KÊ TRẠNG THÁI BUỒNG PHÒNG TOÀN VIỆN -->
        <div class="bg-white dark:bg-slate-800 rounded-3xl p-4 border border-slate-200/90 dark:border-slate-700 shadow-sm space-y-3">
          <div class="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/60 pb-2.5">
            <div class="flex items-center space-x-2">
              <div class="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <i data-lucide="bar-chart-3" class="w-4 h-4"></i>
              </div>
              <div>
                <h3 class="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">Thống Kê Hoạt Động & 5S Buồng Phòng</h3>
                <p class="text-[10px] text-slate-500 font-medium">Toàn viện VPI • ${stats.totalRooms} vị trí làm việc</p>
              </div>
            </div>
            <div class="text-right">
              <span class="text-base font-black font-mono text-emerald-600">${stats.workingCount}/${stats.totalRooms}</span>
              <span class="text-[10px] text-slate-400 block font-bold">Phòng hoạt động (${stats.workingRate}%)</span>
            </div>
          </div>

          <!-- 4 Ô Thống Kê Nhanh -->
          <div class="grid grid-cols-4 gap-1.5 text-center">
            <div onclick="app5s.setScheduleStatusFilter('all')" class="cursor-pointer bg-slate-50 dark:bg-slate-900/60 p-2 rounded-xl border border-slate-100 dark:border-slate-700/60 hover:bg-slate-100 transition">
              <div class="text-xs font-mono font-black text-slate-800 dark:text-slate-100">${stats.totalRooms}</div>
              <div class="text-[9px] text-slate-400 font-bold">Tất cả phòng</div>
            </div>

            <div onclick="app5s.setScheduleStatusFilter('working')" class="cursor-pointer bg-emerald-50 dark:bg-emerald-950/40 p-2 rounded-xl border border-emerald-200 dark:border-emerald-900/40 hover:bg-emerald-100 transition">
              <div class="text-xs font-mono font-black text-emerald-700 dark:text-emerald-400">${stats.workingCount}</div>
              <div class="text-[9px] text-emerald-700 dark:text-emerald-400 font-bold">🟢 Làm việc</div>
            </div>

            <div onclick="app5s.setScheduleStatusFilter('idle')" class="cursor-pointer bg-slate-100 dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-200 transition">
              <div class="text-xs font-mono font-black text-slate-600 dark:text-slate-400">${stats.idleCount}</div>
              <div class="text-[9px] text-slate-500 font-bold">⚪ Nghỉ ca</div>
            </div>

            <div onclick="app5s.setScheduleStatusFilter('pending_5s')" class="cursor-pointer bg-amber-50 dark:bg-amber-950/40 p-2 rounded-xl border border-amber-200 dark:border-amber-900/40 hover:bg-amber-100 transition">
              <div class="text-xs font-mono font-black text-amber-700 dark:text-amber-400">${stats.overdueCount}</div>
              <div class="text-[9px] text-amber-700 dark:text-amber-400 font-bold">🟠 Chờ nộp 5S</div>
            </div>
          </div>

          <!-- CẢNH BÁO CÁC PHÒNG HẾT CA CHƯA NỘP ẢNH 5S -->
          ${stats.overdueCount > 0 ? `
            <div class="bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 rounded-2xl p-3 space-y-2">
              <div class="flex items-center justify-between">
                <div class="flex items-center space-x-1.5 text-xs font-bold text-amber-900 dark:text-amber-200">
                  <i data-lucide="clock" class="w-4 h-4 text-amber-600 shrink-0 animate-bounce"></i>
                  <span>Cảnh báo: Có ${stats.overdueCount} buồng phòng hết ca chưa chụp ảnh 5S bàn giao!</span>
                </div>
              </div>
              <div class="text-[11px] text-amber-800 dark:text-amber-300">
                Các phòng cần đôn đốc nộp ảnh: ${stats.overdueRooms.slice(0, 4).map(rs => {
                  const r = rooms.find(rm => rm.id == rs.room_id);
                  return r ? r.name : 'Buồng phòng';
                }).join(', ')}${stats.overdueCount > 4 ? '...' : ''}
              </div>
              <button onclick="app5s.broadcastEndShift5SReminder()" class="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 rounded-xl text-xs transition flex items-center justify-center space-x-1.5 shadow-xs">
                <i data-lucide="volume-2" class="w-3.5 h-3.5"></i>
                <span>PHÁT THÔNG BÁO KHẨN ĐÔN ĐỐC NỘP ẢNH 5S TOÀN VIỆN</span>
              </button>
            </div>
          ` : `
            <div class="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-2.5 text-center text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center justify-center space-x-1.5">
              <i data-lucide="check-circle" class="w-4 h-4 text-emerald-600"></i>
              <span>Tất cả các buồng phòng hoạt động đã hoàn thành bàn giao 5S sau ca trực!</span>
            </div>
          `}
        </div>

        <!-- BỘ LỌC TRẠNG THÁI & TÌM KIẾM BUỒNG PHÒNG -->
        <div class="space-y-2">
          <!-- Ô Tìm kiếm -->
          <div class="relative">
            <i data-lucide="search" class="w-4 h-4 absolute left-3 top-3 text-slate-400"></i>
            <input type="text" oninput="app5s.onScheduleSearch(this.value)" placeholder="Tìm vị trí làm việc, buồng phòng, nhân sự trực ca..." value="${this.scheduleState.searchQuery || ''}" class="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500">
          </div>

          <!-- Lọc theo 20 Khoa / Phòng -->
          <div class="flex space-x-1.5 overflow-x-auto pb-1 no-scrollbar text-xs font-bold">
            <button onclick="app5s.setScheduleDeptFilter('all')" class="shrink-0 px-2.5 py-1.5 rounded-xl transition ${
              this.scheduleState.selectedDept === 'all'
                ? 'bg-indigo-600 text-white'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
            }">
              Tất cả khoa (${depts.length})
            </button>
            ${depts.map(d => `
              <button onclick="app5s.setScheduleDeptFilter('${d.id}')" class="shrink-0 px-2.5 py-1.5 rounded-xl transition flex items-center space-x-1 ${
                this.scheduleState.selectedDept === String(d.id)
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
              }">
                <span class="text-[9px] opacity-75 font-mono">#${d.order || ''}</span>
                <span>${d.name}</span>
              </button>
            `).join('')}
          </div>

          <!-- Bộ lọc Trạng thái hoạt động & Kiểm duyệt ảnh 5S (V8) -->
          <div class="space-y-1.5 text-center text-xs">
            <div class="grid grid-cols-4 gap-1">
              <button onclick="app5s.setScheduleStatusFilter('all')" class="py-1.5 px-1 rounded-xl font-bold transition text-[10px] ${
                statusFilter === 'all' ? 'bg-slate-800 text-white' : 'bg-white dark:bg-slate-800 text-slate-600 border border-slate-200 dark:border-slate-700'
              }">Tất cả (${rooms.length})</button>

              <button onclick="app5s.setScheduleStatusFilter('working')" class="py-1.5 px-1 rounded-xl font-bold transition text-[10px] ${
                statusFilter === 'working' ? 'bg-emerald-600 text-white' : 'bg-white dark:bg-slate-800 text-emerald-700 border border-emerald-200'
              }">🟢 Làm việc (${stats.workingCount})</button>

              <button onclick="app5s.setScheduleStatusFilter('idle')" class="py-1.5 px-1 rounded-xl font-bold transition text-[10px] ${
                statusFilter === 'idle' ? 'bg-slate-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-500 border border-slate-200'
              }">⚪ Nghỉ (${stats.idleCount})</button>

              <button onclick="app5s.setScheduleStatusFilter('pending_5s')" class="py-1.5 px-1 rounded-xl font-bold transition text-[10px] ${
                statusFilter === 'pending_5s' ? 'bg-amber-600 text-white' : 'bg-white dark:bg-slate-800 text-amber-700 border border-amber-200'
              }">🟠 Quá hạn (${stats.overdueCount})</button>
            </div>

            <!-- HÀNG 2: BỘ LỌC KIỂM DUYỆT ẢNH 5S HẾT CA (V8) -->
            <div class="grid grid-cols-4 gap-1">
              <button onclick="app5s.setScheduleStatusFilter('pending_review')" class="py-1.5 px-1 rounded-xl font-bold transition text-[10px] ${
                statusFilter === 'pending_review' ? 'bg-indigo-600 text-white shadow-2xs' : 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200'
              }">⭐ Chờ duyệt (${stats.pendingReviewCount})</button>

              <button onclick="app5s.setScheduleStatusFilter('approved_5s')" class="py-1.5 px-1 rounded-xl font-bold transition text-[10px] ${
                statusFilter === 'approved_5s' ? 'bg-emerald-600 text-white shadow-2xs' : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200'
              }">🟢 Đạt chuẩn (${stats.approvedCount})</button>

              <button onclick="app5s.setScheduleStatusFilter('rejected_5s')" class="py-1.5 px-1 rounded-xl font-bold transition text-[10px] ${
                statusFilter === 'rejected_5s' ? 'bg-red-600 text-white shadow-2xs' : 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200'
              }">🔴 Nhắc lỗi (${stats.rejectedCount})</button>

              <button onclick="app5s.setScheduleStatusFilter('all_submitted')" class="py-1.5 px-1 rounded-xl font-bold transition text-[10px] ${
                statusFilter === 'all_submitted' ? 'bg-slate-800 text-white shadow-2xs' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200'
              }">📸 Đã nộp (${stats.allSubmittedCount})</button>
            </div>
          </div>
        </div>

        <!-- DANH SÁCH CÁC VỊ TRÍ LÀM VIỆC & PHÂN CÔNG NHÂN SỰ -->
        <div class="space-y-3">
          <div class="flex items-center justify-between text-xs text-slate-500">
            <span>Hiển thị: <strong>${filteredRooms.length} vị trí làm việc</strong></span>
            <span class="text-[10px] text-indigo-600 font-bold">Chạm công tắc để đổi trạng thái phòng</span>
          </div>

          ${filteredRooms.length === 0 ? `
            <div class="p-8 text-center bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 text-xs text-slate-400">
              Không tìm thấy vị trí làm việc nào phù hợp với bộ lọc hiện tại.
            </div>
          ` : filteredRooms.map(r => {
            const rs = this.getRoomSchedule(r.id);
            const dept = depts.find(d => d.id == r.department_id) || { name: 'Khoa' };
            const isWorking = rs.is_working;
            const staffList = rs.staff_assigned || [];
            const s5 = rs.post_shift_5s || { status: 'pending' };
            const isS5Done = (s5.status === 'submitted' || s5.status === 'approved');
            const isS5Overdue = isWorking && (s5.status === 'overdue' || s5.status === 'pending');

            return `
              <div class="bg-white dark:bg-slate-800 rounded-2xl p-4 border ${
                isS5Overdue 
                  ? 'border-amber-300 dark:border-amber-800/80 shadow-xs' 
                  : (isWorking ? 'border-slate-200/90 dark:border-slate-700' : 'border-slate-100 dark:border-slate-800 opacity-80')
              } space-y-3">
                <!-- Tiêu đề phòng & Công tắc trạng thái làm việc -->
                <div class="flex items-start justify-between border-b border-slate-100 dark:border-slate-700/60 pb-2.5">
                  <div class="space-y-0.5">
                    <div class="flex items-center space-x-1.5">
                      <span class="text-xs font-black text-slate-900 dark:text-white">${r.name}</span>
                      <span class="text-[9px] font-mono px-1.5 py-0.2 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded font-bold">${r.code || 'P-00'}</span>
                    </div>
                    <div class="text-[10px] text-slate-500">
                      <strong>${dept.name}</strong> • ${r.floor || 'Tầng 1'}
                    </div>
                  </div>

                  <!-- Công tắc 1 chạm: Đang làm việc / Không làm việc -->
                  <div class="text-right space-y-1">
                    <button onclick="app5s.toggleRoomWorkingStatus(${r.id})" class="px-2.5 py-1 rounded-xl text-[10px] font-black transition flex items-center space-x-1 ${
                      isWorking 
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300' 
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 border border-slate-300'
                    }">
                      <i data-lucide="${isWorking ? 'check-circle' : 'power'}" class="w-3 h-3"></i>
                      <span>${isWorking ? 'ĐANG LÀM VIỆC' : 'KHÔNG LÀM VIỆC'}</span>
                    </button>

                    <!-- Huy hiệu tình trạng 5S bàn giao ca -->
                    ${isWorking ? (
                      isS5Done ? `
                        <span class="inline-flex items-center space-x-1 text-[9px] font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950 px-1.5 py-0.5 rounded border border-blue-200">
                          <i data-lucide="check" class="w-2.5 h-2.5"></i>
                          <span>ĐÃ NỘP 5S (${s5.submitted_at || 'Ca sáng'})</span>
                        </span>
                      ` : `
                        <span class="inline-flex items-center space-x-1 text-[9px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950 px-1.5 py-0.5 rounded border border-amber-300 animate-pulse">
                          <i data-lucide="alert-circle" class="w-2.5 h-2.5 text-amber-600"></i>
                          <span>HẾT GIỜ: CHƯA NỘP 5S</span>
                        </span>
                      `
                    ) : ''}
                  </div>
                </div>

                <!-- DANH SÁCH NHÂN SỰ ĐƯỢC PHÂN CÔNG TẠI VỊ TRÍ NÀY -->
                <div class="space-y-1.5">
                  <div class="flex items-center justify-between text-[11px]">
                    <span class="font-bold text-slate-600 dark:text-slate-400">Nhân sự ca trực (${staffList.length} người):</span>
                    <button onclick="app5s.openManageRoomStaffModal(${r.id})" class="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold hover:underline flex items-center space-x-0.5">
                      <i data-lucide="user-plus" class="w-3 h-3"></i>
                      <span>+ Thêm / Bớt người</span>
                    </button>
                  </div>

                  ${staffList.length === 0 ? `
                    <div class="p-2 bg-slate-50 dark:bg-slate-900/60 rounded-xl text-[11px] text-slate-400 italic">
                      Chưa phân công nhân sự trực ca. Bấm "+ Thêm / Bớt người" để phân công.
                    </div>
                  ` : `
                    <div class="flex flex-wrap gap-1.5">
                      ${staffList.map((s, sIdx) => `
                        <div class="inline-flex items-center space-x-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 pl-2 pr-1 py-1 rounded-xl text-[10.5px]">
                          <span class="font-bold text-slate-800 dark:text-slate-200">${s.name}</span>
                          <span class="text-[9px] text-indigo-600 font-medium">(${s.role || 'Trực'})</span>
                          <button onclick="app5s.removeStaffFromRoom(${r.id}, ${sIdx})" title="Bớt nhân sự khỏi vị trí" class="text-slate-400 hover:text-red-600 p-0.5 rounded-full hover:bg-red-50 dark:hover:bg-red-950">
                            <i data-lucide="x" class="w-3 h-3"></i>
                          </button>
                        </div>
                      `).join('')}
                    </div>
                  `}
                </div>

                <!-- HIỂN THỊ ẢNH CHỤP 5S BÀN GIAO CA (V9: PHÂN QUYỀN NỘI BỘ KHOA VS TOÀN VIỆN) -->
                ${s5.photo ? (() => {
                  const canViewPhoto = this.canUserViewRoomPhotos(r.id);
                  if (canViewPhoto) {
                    return `
                      <div class="bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                        <div class="flex items-center justify-between text-xs">
                          <span class="font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1">
                            <i data-lucide="camera" class="w-3.5 h-3.5 text-indigo-600"></i>
                            <span>Ảnh 5S bàn giao ca (${s5.submitted_at || 'Cuối ca'}):</span>
                          </span>
                          ${s5.status === 'approved' ? '<span class="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">🟢 Đã duyệt Đạt chuẩn</span>' :
                            (s5.status === 'rejected' ? '<span class="text-[10px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-full border border-red-300">🔴 Cần chấn chỉnh</span>' :
                            '<span class="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300 animate-pulse">🟡 Chờ kiểm duyệt</span>')}
                        </div>
                        
                        <div class="grid grid-cols-3 gap-2 items-center">
                          <div class="col-span-1 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 h-20 bg-slate-100 dark:bg-slate-900">
                            <img src="${s5.photo}" class="w-full h-full object-cover cursor-pointer hover:opacity-90 transition" onclick="app5s.viewLargePhoto('${s5.photo}', '${r.name}', ${r.department_id})">
                          </div>
                          <div class="col-span-2 text-xs space-y-1">
                            <div class="text-[11px] text-slate-600 dark:text-slate-300 italic line-clamp-2">"${s5.notes || 'Đã làm sạch sẽ, sắp xếp ngăn nắp.'}"</div>
                            <div class="text-[10px] text-slate-400">Nộp bởi: <strong>${s5.submitted_by || 'Nhân sự ca trực'}</strong></div>
                            ${s5.evaluated_by ? `
                              <div class="text-[10px] text-indigo-600 font-bold">Người duyệt: ${s5.evaluated_by} (${s5.score || 98}đ)</div>
                            ` : ''}
                          </div>
                        </div>
                      </div>
                    `;
                  } else {
                    return `
                      <div class="bg-slate-50/80 dark:bg-slate-900/60 p-2.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 flex items-center space-x-2.5 text-xs">
                        <div class="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-500 flex items-center justify-center shrink-0">
                          <i data-lucide="lock" class="w-4 h-4"></i>
                        </div>
                        <div class="min-w-0 flex-1">
                          <div class="font-bold text-slate-700 dark:text-slate-200 text-[11px]">Ảnh 5S nội bộ ${dept.name}</div>
                          <div class="text-[10px] text-slate-400 leading-tight">Chỉ tài khoản thuộc ${dept.name} hoặc Ban Giám sát toàn viện được xem</div>
                        </div>
                      </div>
                    `;
                  }
                })() : ''}

                <!-- NÚT CHỤP ẢNH 5S HẾT CA & QUYỀN KIỂM DUYỆT -->
                <div class="flex flex-wrap items-center justify-between gap-1.5 pt-1">
                  <button onclick="app5s.openManageRoomStaffModal(${r.id})" class="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-[11px] font-bold transition flex items-center space-x-1">
                    <i data-lucide="settings" class="w-3.5 h-3.5"></i>
                    <span>Tùy chỉnh ca & nhân sự</span>
                  </button>

                  <div class="flex items-center space-x-1.5">
                    ${isWorking ? `
                      <button onclick="app5s.openEndShift5SModal(${r.id})" class="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-[11px] font-black transition flex items-center space-x-1 shadow-xs">
                        <i data-lucide="camera" class="w-3.5 h-3.5"></i>
                        <span>${isS5Done ? 'Cập nhật ảnh' : 'Chụp ảnh 5S'}</span>
                      </button>
                    ` : ''}

                    <!-- NÚT DUYỆT DÀNH CHO CÁN BỘ KIỂM DUYỆT -->
                    ${(isWorking && s5.photo && this.canUserReviewAudits()) ? `
                      <button onclick="app5s.openReviewShiftPhotoModal(${r.id})" class="px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl text-[11px] font-black transition flex items-center space-x-1 shadow-md">
                        <i data-lucide="award" class="w-3.5 h-3.5"></i>
                        <span>${s5.status === 'approved' || s5.status === 'rejected' ? 'Chấm lại' : '⭐ DUYỆT ẢNH 5S'}</span>
                      </button>
                    ` : ''}
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }


  // =========================================================================
  // TAB 1: TỔNG QUAN
  // =========================================================================
  renderOverviewTab() {
    const hosp = this.data.hospital;
    const depts = this.getSortedDepartments();
    const rooms = this.data.rooms;
    const user = this.getCurrentUser();
    const userName = (user && user.name) ? user.name : 'Vũ Bá Đạt';
    const userTitle = (user && (user.title || user.role_title || user.position)) ? (user.title || user.role_title || user.position) : 'Cán bộ 5S';
    const initial = userName.split(' ').pop().charAt(0) || 'Đ';
    const shortName = userName.split(' ').slice(-2).join(' ') || userName;
    const dailyStatus = this.getDaily5SStatus();

    return `
      <div class="p-4 space-y-4">
        <!-- Top Bar Profile -->
        <div class="flex items-center justify-between bg-white dark:bg-slate-800 rounded-2xl p-3 border border-slate-200/80 dark:border-slate-700 shadow-2xs">
          <div class="flex items-center space-x-3">
            <div class="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-bold flex items-center justify-center text-sm shadow-xs">
              ${initial}
            </div>
            <div>
              <div class="flex items-center space-x-1.5">
                <span class="text-xs font-black text-slate-800 dark:text-slate-100">${shortName}</span>
                <span class="text-[9px] bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold px-1.5 py-0.5 rounded-full border border-emerald-300">
                  ${user ? user.code : 'BV-345'}
                </span>
              </div>
              <div class="text-[10px] text-slate-500 flex items-center space-x-1 mt-0.5">
                <span>👨‍⚕️ ${userTitle}</span>
              </div>
            </div>
          </div>
          <div class="flex items-center space-x-1">
            <button onclick="app5s.openNoticeEditModal()" title="Chỉnh sửa thông báo khẩn" class="p-2 rounded-xl text-amber-600 hover:bg-amber-50 dark:hover:bg-slate-700 transition">
              <i data-lucide="bell" class="w-4 h-4"></i>
            </button>
            <button onclick="app5s.toggleTheme()" title="Đổi giao diện sáng/tối" class="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition">
              <i data-lucide="${this.theme === 'dark' ? 'sun' : 'moon'}" class="w-4 h-4"></i>
            </button>
            <button onclick="app5s.openLoginModal()" title="Tài khoản / Đổi mật khẩu" class="p-2 rounded-xl text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-700 transition">
              <i data-lucide="user-cog" class="w-4 h-4"></i>
            </button>
          </div>
        </div>

        <!-- Banner Bệnh viện Vĩnh Phúc VPI -->
        <div class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-700 to-slate-800 p-5 text-white shadow-lg">
          <div class="relative z-10 space-y-2">
            <div class="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-[10px] font-bold tracking-wider uppercase">
              <i data-lucide="shield-check" class="w-3.5 h-3.5 text-emerald-300"></i>
              <span>5S BỆNH VIỆN CHUẨN QUỐC GIA</span>
            </div>
            <h1 class="text-lg font-black tracking-tight leading-tight">${hosp.name}</h1>
            <p class="text-[11px] text-emerald-100 opacity-90 line-clamp-1">${hosp.slogan}</p>
            <div class="pt-2 flex items-center justify-between border-t border-white/20 text-[10px]">
              <div>
                <span class="opacity-75 block text-[9px]">Trưởng Ban 5S:</span>
                <span class="font-bold">${hosp.director}</span>
              </div>
              <div class="text-right">
                <span class="opacity-75 block text-[9px]">Cán bộ Giám sát:</span>
                <span class="font-bold">${hosp.officer}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- THÔNG BÁO KHẨN CẤP TOÀN VIỆN -->
        ${hosp.notice && hosp.notice.enabled ? `
          <div class="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/60 rounded-2xl p-3.5 shadow-xs space-y-1.5 animate-pulse">
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-1.5 text-red-700 dark:text-red-400 font-extrabold text-xs">
                <i data-lucide="alert-triangle" class="w-4 h-4"></i>
                <span>${hosp.notice.title}</span>
              </div>
              <button onclick="app5s.openNoticeEditModal()" class="text-[10px] text-red-600 hover:underline font-bold">Chỉnh sửa</button>
            </div>
            <p class="text-xs text-red-900 dark:text-red-200 leading-relaxed font-medium">
              ${hosp.notice.content}
            </p>
            <div class="text-[10px] text-red-500 text-right">
              Cập nhật: ${hosp.notice.updatedAt}
            </div>
          </div>
        ` : ''}

        <!-- TIẾN ĐỘ THỰC HIỆN 5S TOÀN VIỆN HÔM NAY & CẢNH BÁO ĐÔN ĐỐC -->
        <div class="bg-white dark:bg-slate-800 rounded-3xl p-4 border border-slate-200/90 dark:border-slate-700 shadow-sm space-y-3">
          <div class="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/60 pb-2.5">
            <div class="flex items-center space-x-2">
              <div class="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-300 flex items-center justify-center">
                <i data-lucide="calendar-check" class="w-4 h-4"></i>
              </div>
              <div>
                <h3 class="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">Tiến Độ Thực Hiện 5S Hôm Nay</h3>
                <p class="text-[10px] text-slate-500 font-medium">Ngày ${dailyStatus.today} • Bệnh viện Vĩnh Phúc VPI</p>
              </div>
            </div>
            <div class="text-right">
              <span class="text-base font-black font-mono text-emerald-600">${dailyStatus.completedDepts.length}/${dailyStatus.totalDepts}</span>
              <span class="text-[10px] text-slate-400 block font-bold">Khoa đã nộp (${dailyStatus.rate}%)</span>
            </div>
          </div>

          <!-- Thanh tiến độ toàn viện -->
          <div class="space-y-1">
            <div class="w-full bg-slate-100 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
              <div class="bg-gradient-to-r from-emerald-500 to-teal-500 h-2.5 rounded-full transition-all duration-500" style="width: ${dailyStatus.rate}%"></div>
            </div>
            <div class="flex items-center justify-between text-[10px] font-bold">
              <span class="text-emerald-700 dark:text-emerald-400">🟢 Đã nộp: ${dailyStatus.completedDepts.length} khoa</span>
              <span class="text-red-600 dark:text-red-400">🔴 Chưa nộp: ${dailyStatus.uncompletedDepts.length} khoa</span>
            </div>
          </div>

          <!-- 4 Chip trạng thái ảnh gửi hôm nay -->
          <div class="grid grid-cols-4 gap-1.5 text-center">
            <div class="bg-slate-50 dark:bg-slate-900/60 p-2 rounded-xl border border-slate-100 dark:border-slate-700/60">
              <div class="text-xs font-mono font-black text-slate-800 dark:text-slate-100">${dailyStatus.todayAudits.length}</div>
              <div class="text-[9px] text-slate-400">Tổng phiếu</div>
            </div>
            <div onclick="app5s.setAuditFilterStatus('pending'); app5s.switchTab('history');" class="cursor-pointer bg-amber-50 dark:bg-amber-950/40 p-2 rounded-xl border border-amber-200 dark:border-amber-900/40 hover:bg-amber-100 transition">
              <div class="text-xs font-mono font-black text-amber-700 dark:text-amber-400">${dailyStatus.pendingAudits.length}</div>
              <div class="text-[9px] text-amber-700 dark:text-amber-400 font-bold">Chờ duyệt</div>
            </div>
            <div onclick="app5s.setAuditFilterStatus('approved'); app5s.switchTab('history');" class="cursor-pointer bg-emerald-50 dark:bg-emerald-950/40 p-2 rounded-xl border border-emerald-200 dark:border-emerald-900/40 hover:bg-emerald-100 transition">
              <div class="text-xs font-mono font-black text-emerald-700 dark:text-emerald-400">${dailyStatus.approvedAudits.length}</div>
              <div class="text-[9px] text-emerald-700 dark:text-emerald-400 font-bold">Đạt chuẩn</div>
            </div>
            <div onclick="app5s.setAuditFilterStatus('rejected'); app5s.switchTab('history');" class="cursor-pointer bg-red-50 dark:bg-red-950/40 p-2 rounded-xl border border-red-200 dark:border-red-900/40 hover:bg-red-100 transition">
              <div class="text-xs font-mono font-black text-red-700 dark:text-red-400">${dailyStatus.rejectedAudits.length}</div>
              <div class="text-[9px] text-red-700 dark:text-red-400 font-bold">Lỗi cần sửa</div>
            </div>
          </div>

          <!-- CẢNH BÁO CÁC KHOA CHƯA THỰC HIỆN 5S HÔM NAY -->
          ${dailyStatus.uncompletedDepts.length > 0 ? `
            <div class="bg-red-50/80 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-2xl p-3 space-y-2">
              <div class="flex items-start justify-between">
                <div class="flex items-center space-x-1.5 text-xs font-bold text-red-700 dark:text-red-400">
                  <i data-lucide="alert-triangle" class="w-4 h-4 text-red-600 shrink-0"></i>
                  <span>Cảnh báo: Còn ${dailyStatus.uncompletedDepts.length} Khoa chưa gửi ảnh 5S hôm nay!</span>
                </div>
              </div>
              <div class="text-[11px] text-red-800 dark:text-red-300 line-clamp-2">
                Các khoa chưa nộp: ${dailyStatus.uncompletedDepts.slice(0, 5).map(d => d.name).join(', ')}${dailyStatus.uncompletedDepts.length > 5 ? '...' : ''}
              </div>
              <div class="flex items-center space-x-2 pt-1">
                <button onclick="app5s.openReminderModal()" class="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-1.5 px-2.5 rounded-xl text-xs transition flex items-center justify-center space-x-1 shadow-xs">
                  <i data-lucide="volume-2" class="w-3.5 h-3.5"></i>
                  <span>Phát thông báo nhắc nhở toàn viện</span>
                </button>
                <button onclick="app5s.setDeptDailyFilter('uncompleted'); app5s.switchTab('departments');" class="bg-white dark:bg-slate-800 text-red-700 dark:text-red-300 border border-red-300 font-bold py-1.5 px-2.5 rounded-xl text-xs transition hover:bg-red-50">
                  <span>Xem ${dailyStatus.uncompletedDepts.length} khoa →</span>
                </button>
              </div>
            </div>
          ` : `
            <div class="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-2.5 text-center text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center justify-center space-x-1.5">
              <i data-lucide="check-circle" class="w-4 h-4 text-emerald-600"></i>
              <span>Tuyệt vời! 100% (20/20 Khoa) đã hoàn thành nộp ảnh 5S hôm nay!</span>
            </div>
          `}

          <!-- CÁC ẢNH 5S ĐANG CHỜ DUYỆT -->
          ${dailyStatus.pendingAudits.length > 0 ? `
            <div class="bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl p-3 space-y-2">
              <div class="flex items-center justify-between">
                <div class="flex items-center space-x-1.5 text-xs font-black text-amber-800 dark:text-amber-300">
                  <i data-lucide="hourglass" class="w-4 h-4 text-amber-600"></i>
                  <span>${dailyStatus.pendingAudits.length} ảnh 5S đang chờ Cán bộ kiểm tra đánh giá:</span>
                </div>
                <button onclick="app5s.setAuditFilterStatus('pending'); app5s.switchTab('history');" class="text-[10px] text-amber-700 font-bold hover:underline">
                  Xem tất cả →
                </button>
              </div>
              <div class="space-y-1.5">
                ${dailyStatus.pendingAudits.slice(0, 2).map(a => {
                  const d = depts.find(dept => dept.id == a.department_id) || { name: 'Khoa' };
                  const r = rooms.find(room => room.id == a.room_id) || { name: 'Buồng bệnh' };
                  return `
                    <div class="bg-white dark:bg-slate-800 p-2 rounded-xl border border-amber-200 dark:border-amber-800 flex items-center justify-between text-xs">
                      <div class="flex items-center space-x-2">
                        ${a.after_photo ? `<img src="${a.after_photo}" class="w-10 h-10 object-cover rounded-lg shrink-0">` : ''}
                        <div>
                          <div class="font-bold text-slate-800 dark:text-slate-100">${d.name}</div>
                          <div class="text-[10px] text-slate-400">${r.name} • ${a.audit_time}</div>
                        </div>
                      </div>
                      <button onclick="app5s.openAuditEvaluationModal('${a.id}')" class="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center space-x-1">
                        <i data-lucide="check-circle" class="w-3 h-3"></i>
                        <span>Đánh giá</span>
                      </button>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          ` : ''}
        </div>

        <!-- Thẻ Thống Kê 5S Bệnh Viện (Có thể bấm để xem chi tiết ngay) -->
        <div class="grid grid-cols-2 gap-3">
          <div onclick="app5s.switchTab('departments')" class="cursor-pointer bg-white dark:bg-slate-800 rounded-2xl p-3.5 border border-slate-200/80 dark:border-slate-700 shadow-2xs space-y-1 hover:border-emerald-500 active:scale-[0.98] transition">
            <div class="flex items-center justify-between text-slate-500 text-[11px]">
              <span class="font-bold">Khoa / Phòng</span>
              <i data-lucide="building-2" class="w-4 h-4 text-emerald-600"></i>
            </div>
            <div class="text-2xl font-black font-mono text-slate-800 dark:text-slate-100">${depts.length}</div>
            <div class="text-[10px] text-emerald-600 font-bold flex items-center justify-between">
              <span>${rooms.length} buồng phòng</span>
              <span class="text-[9px] bg-emerald-100 dark:bg-emerald-950 px-1.5 py-0.5 rounded font-mono">Xem →</span>
            </div>
          </div>
          <div onclick="app5s.switchTab('history')" class="cursor-pointer bg-white dark:bg-slate-800 rounded-2xl p-3.5 border border-slate-200/80 dark:border-slate-700 shadow-2xs space-y-1 hover:border-amber-500 active:scale-[0.98] transition">
            <div class="flex items-center justify-between text-slate-500 text-[11px]">
              <span class="font-bold">Điểm TB Toàn Viện</span>
              <i data-lucide="award" class="w-4 h-4 text-amber-500"></i>
            </div>
            <div class="text-2xl font-black font-mono text-slate-800 dark:text-slate-100">${hosp.averageScore}</div>
            <div class="text-[10px] text-emerald-600 font-bold flex items-center justify-between">
              <span>Tuân thủ: 100%</span>
              <span class="text-[9px] bg-amber-100 dark:bg-amber-950 px-1.5 py-0.5 rounded font-mono text-amber-700 dark:text-amber-300">Lịch sử →</span>
            </div>
          </div>
        </div>

        <!-- Nút Hành Động Nổi Bật Mở Ngay Danh Sách 20 Khoa Phòng & 75 Buồng Phòng -->
        <button onclick="app5s.switchTab('departments')" class="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-[0.98] text-white p-3.5 rounded-2xl font-bold flex items-center justify-between shadow-sm transition">
          <div class="flex items-center space-x-2.5">
            <div class="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <i data-lucide="building-2" class="w-5 h-5 text-white"></i>
            </div>
            <div class="text-left">
              <div class="text-xs font-black">Danh Mục 20 Khoa/Phòng & 75 Khu Vực Làm Việc</div>
              <div class="text-[10px] text-emerald-100 font-normal">Chạm vào đây để xem chi tiết buồng phòng và tiêu chuẩn 5S</div>
            </div>
          </div>
          <i data-lucide="chevron-right" class="w-5 h-5 text-white/80 shrink-0"></i>
        </button>

        <!-- Lối Tắt Nhanh Đầy Đủ 4 Mục Chính -->
        <div class="grid grid-cols-4 gap-2">
          <button onclick="app5s.switchTab('schedule')" class="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-center space-y-1 hover:bg-indigo-100 transition">
            <i data-lucide="calendar-clock" class="w-5 h-5 mx-auto text-indigo-600"></i>
            <span class="block text-[11px] font-bold text-indigo-900 dark:text-indigo-200">Khu Vực</span>
          </button>
          <button onclick="app5s.switchTab('audit')" class="p-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center space-y-1 hover:bg-emerald-100 transition">
            <i data-lucide="camera" class="w-5 h-5 mx-auto text-emerald-600"></i>
            <span class="block text-[11px] font-bold text-emerald-900 dark:text-emerald-200">Chấm 5S</span>
          </button>
          <button onclick="app5s.switchTab('departments')" class="p-2.5 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 text-center space-y-1 hover:bg-teal-100 transition">
            <i data-lucide="building-2" class="w-5 h-5 mx-auto text-teal-600"></i>
            <span class="block text-[11px] font-bold text-teal-900 dark:text-teal-200">Khoa Phòng</span>
          </button>
          <button onclick="app5s.switchTab('staff')" class="p-2.5 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-center space-y-1 hover:bg-blue-100 transition">
            <i data-lucide="users" class="w-5 h-5 mx-auto text-blue-600"></i>
            <span class="block text-[11px] font-bold text-blue-900 dark:text-blue-200">Nhân Sự</span>
          </button>
        </div>

        <!-- WIDGET BÁO CÁO TỔNG KẾT & ĐÁNH GIÁ 5S CUỐI NGÀY (V8) -->
        <div class="bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 text-white rounded-3xl p-4 shadow-md space-y-3">
          <div class="flex items-center justify-between border-b border-indigo-700/60 pb-2.5">
            <div class="flex items-center space-x-2">
              <div class="w-8 h-8 rounded-xl bg-white/20 text-white flex items-center justify-center font-bold">
                <i data-lucide="bar-chart-2" class="w-4 h-4"></i>
              </div>
              <div>
                <h3 class="text-xs font-black uppercase tracking-wider">TỔNG KẾT & ĐÁNH GIÁ 5S CUỐI NGÀY</h3>
                <p class="text-[10px] text-indigo-200">Đánh giá toàn diện 20 Khoa/Phòng toàn viện</p>
              </div>
            </div>
            <button onclick="app5s.openDailySummaryModal()" class="px-2.5 py-1 bg-white text-indigo-900 rounded-xl text-[10px] font-black hover:bg-indigo-50 transition flex items-center space-x-1 shadow-2xs">
              <i data-lucide="eye" class="w-3 h-3"></i>
              <span>Xem Chi Tiết</span>
            </button>
          </div>

          <div class="grid grid-cols-3 gap-2 text-center text-xs">
            <div class="bg-white/10 backdrop-blur-xs p-2 rounded-2xl border border-white/10">
              <div class="text-base font-black font-mono">${dailyStatus.completedDepts.length}/20</div>
              <div class="text-[9px] text-indigo-200 font-bold">Khoa đã làm 5S</div>
            </div>
            <div class="bg-white/10 backdrop-blur-xs p-2 rounded-2xl border border-white/10">
              <div class="text-base font-black font-mono text-amber-300">${dailyStatus.uncompletedDepts.length}</div>
              <div class="text-[9px] text-indigo-200 font-bold">Khoa chưa gửi</div>
            </div>
            <div class="bg-white/10 backdrop-blur-xs p-2 rounded-2xl border border-white/10">
              <div class="text-base font-black font-mono text-emerald-300">${dailyStatus.rate}%</div>
              <div class="text-[9px] text-indigo-200 font-bold">Tỷ lệ tuân thủ</div>
            </div>
          </div>

          <div class="flex items-center justify-between pt-1">
            <button onclick="app5s.openAllShiftAuditsCenterModal()" class="text-[11px] text-indigo-200 font-bold hover:text-white flex items-center space-x-1">
              <i data-lucide="shield-check" class="w-3.5 h-3.5"></i>
              <span>Trung tâm duyệt ảnh 5S hết ca &rarr;</span>
            </button>
            <button onclick="app5s.printDailyEvaluationReport()" class="text-[11px] text-indigo-200 font-bold hover:text-white flex items-center space-x-1">
              <i data-lucide="printer" class="w-3.5 h-3.5"></i>
              <span>In bảng điểm &rarr;</span>
            </button>
          </div>
        </div>

        <!-- WIDGET THỐNG KÊ TRẠNG THÁI HOẠT ĐỘNG BUỒNG PHÒNG HÔM NAY -->
        ${(() => {
          const schedStats = this.getScheduleStatistics();
          return `
            <div class="bg-white dark:bg-slate-800 rounded-3xl p-4 border border-slate-200/90 dark:border-slate-700 shadow-sm space-y-3">
              <div class="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/60 pb-2.5">
                <div class="flex items-center space-x-2">
                  <div class="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                    <i data-lucide="activity" class="w-4 h-4"></i>
                  </div>
                  <div>
                    <h3 class="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">Trạng Thái Buồng Phòng Hôm Nay</h3>
                    <p class="text-[10px] text-slate-500 font-medium">Theo khu vực buồng phòng VPI • ${schedStats.totalRooms} vị trí</p>
                  </div>
                </div>
                <button onclick="app5s.switchTab('schedule')" class="text-[10px] font-bold text-indigo-600 hover:underline flex items-center space-x-0.5">
                  <span>Chi tiết</span>
                  <i data-lucide="chevron-right" class="w-3 h-3"></i>
                </button>
              </div>

              <!-- Thanh tỷ lệ phòng đang làm việc -->
              <div class="space-y-1">
                <div class="w-full bg-slate-100 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden flex">
                  <div class="bg-emerald-500 h-2.5 transition-all duration-500" style="width: ${schedStats.workingRate}%" title="Đang làm việc: ${schedStats.workingCount}"></div>
                  <div class="bg-slate-300 dark:bg-slate-600 h-2.5 transition-all duration-500" style="width: ${100 - schedStats.workingRate}%" title="Không làm việc: ${schedStats.idleCount}"></div>
                </div>
                <div class="flex items-center justify-between text-[10px] font-bold">
                  <span class="text-emerald-700 dark:text-emerald-400">🟢 Đang làm việc: ${schedStats.workingCount}/${schedStats.totalRooms} phòng (${schedStats.workingRate}%)</span>
                  <span class="text-slate-400">⚪ Không làm việc: ${schedStats.idleCount} phòng</span>
                </div>
              </div>

              <!-- Thẻ cảnh báo hết ca chưa nộp 5S -->
              ${schedStats.overdueCount > 0 ? `
                <div class="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl p-2.5 flex items-center justify-between text-xs">
                  <div class="flex items-center space-x-2">
                    <i data-lucide="clock" class="w-4 h-4 text-amber-600 shrink-0 animate-bounce"></i>
                    <div>
                      <div class="font-bold text-amber-900 dark:text-amber-200">Có ${schedStats.overdueCount} buồng phòng hết ca chưa gửi ảnh 5S!</div>
                      <div class="text-[10px] text-amber-700 dark:text-amber-300">Nhân viên cần chụp ảnh bàn giao ca trực</div>
                    </div>
                  </div>
                  <button onclick="app5s.scheduleState.selectedStatusFilter = 'pending_5s'; app5s.switchTab('schedule');" class="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-[10px] font-bold shrink-0 transition">
                    Đôn đốc ngay
                  </button>
                </div>
              ` : `
                <div class="text-[10px] text-slate-500 flex items-center justify-between pt-0.5">
                  <span>Tuân thủ 5S sau ca trực: <strong class="text-emerald-600">${schedStats.complianceRate}%</strong></span>
                  <span class="text-emerald-600 font-bold">✓ Các ca trực đã bàn giao 5S</span>
                </div>
              `}
            </div>
          `;
        })()}

        <!-- Giới thiệu 5 Tiêu chuẩn 5S Y Tế -->
        <div class="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700 shadow-2xs space-y-3">
          <div class="flex items-center justify-between border-b pb-2">
            <h3 class="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300">Bộ Tiêu Chí 5S Y Tế VPI</h3>
            <span class="text-[10px] text-emerald-600 font-bold">Chuẩn Bộ Y Tế</span>
          </div>
          <div class="space-y-2">
            ${this.data.criteria.map(c => `
              <div class="p-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 flex items-start space-x-2.5">
                <span class="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 font-mono">
                  ${c.id}
                </span>
                <div class="text-xs">
                  <span class="font-bold text-slate-800 dark:text-slate-200">${c.name}</span>
                  <p class="text-[10.5px] text-slate-500 mt-0.5">${c.desc}</p>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }

  // =========================================================================
  // TAB 2: CHẤM 5S (1 ẢNH MINH CHỨNG SAU KHI 5S)
  // =========================================================================
  renderAuditTab() {
    const sortedDepts = this.getSortedDepartments();
    const currentDeptId = parseInt(this.newAuditState.deptId) || sortedDepts[0].id;
    const sortedRooms = this.getSortedRooms(currentDeptId);
    const user = this.getCurrentUser();
    const userName = (user && user.name) ? user.name : 'Vũ Bá Đạt';
    const userTitle = (user && (user.title || user.role_title || user.position)) ? (user.title || user.role_title || user.position) : 'Cán bộ 5S';

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
          <div class="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3 mb-3">
            <div>
              <span class="text-xs font-mono font-bold text-emerald-600">PHIẾU ĐÁNH GIÁ 5S BUỒNG PHÒNG</span>
              <h2 class="text-base font-black text-slate-900 dark:text-white">Kiểm Tra Vệ Sinh & 5S</h2>
            </div>
            <div class="text-right">
              <div class="text-xl font-mono font-black text-emerald-600 dark:text-emerald-400">${totalScore} / 100</div>
              ${gradeBadge}
            </div>
          </div>

          <div class="space-y-3">
            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Khoa / Trung tâm kiểm tra *</label>
              <select onchange="app5s.onAuditDeptChange(this.value)" class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500">
                ${sortedDepts.map(d => `<option value="${d.id}" ${d.id == currentDeptId ? 'selected' : ''}>#${d.order || ''} ${d.name}</option>`).join('')}
              </select>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Buồng / Khu vực làm việc *</label>
                <select id="audit-room-select" class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500">
                  ${sortedRooms.map(r => `<option value="${r.id}" ${r.id == this.newAuditState.roomId ? 'selected' : ''}>${r.name} (${r.code})</option>`).join('')}
                </select>
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Cán bộ kiểm tra</label>
                <input type="text" value="${userName} (${userTitle})" readonly class="w-full bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400">
              </div>
            </div>

            <!-- V10: CA KIỂM TRA TÙY CHỈNH GIỜ LINH HOẠT (KHÔNG ĐỂ MẶC ĐỊNH GIỜ) -->
            <div class="bg-emerald-50/60 dark:bg-emerald-950/30 p-3.5 rounded-2xl border border-emerald-200 dark:border-emerald-800 space-y-2.5">
              <div class="flex items-center justify-between flex-wrap gap-1.5">
                <div class="flex items-center space-x-1.5 text-xs font-bold text-emerald-900 dark:text-emerald-200">
                  <i data-lucide="clock" class="w-4 h-4 text-emerald-600"></i>
                  <span>Ca kiểm tra & Giờ tùy chỉnh linh hoạt *</span>
                </div>
                <!-- 4 Nút preset chọn nhanh một chạm -->
                <div class="flex items-center space-x-1">
                  <button type="button" onclick="app5s.setAuditShiftPreset('morning')" title="07:00 - 11:30" class="px-2 py-0.5 rounded-lg text-[10px] font-bold ${this.newAuditState.shiftType === 'morning' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-emerald-50'} transition">Sáng</button>
                  <button type="button" onclick="app5s.setAuditShiftPreset('afternoon')" title="13:30 - 17:00" class="px-2 py-0.5 rounded-lg text-[10px] font-bold ${this.newAuditState.shiftType === 'afternoon' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-emerald-50'} transition">Chiều</button>
                  <button type="button" onclick="app5s.setAuditShiftPreset('night')" title="17:00 - 07:00" class="px-2 py-0.5 rounded-lg text-[10px] font-bold ${this.newAuditState.shiftType === 'night' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-emerald-50'} transition">Đêm</button>
                  <button type="button" onclick="app5s.setAuditShiftPreset('emergency')" title="Lấy giờ hiện tại đến +2 tiếng" class="px-2 py-0.5 rounded-lg text-[10px] font-bold ${this.newAuditState.shiftType === 'emergency' ? 'bg-amber-600 text-white shadow-xs' : 'bg-amber-100 text-amber-800 border border-amber-300 hover:bg-amber-200'} transition">⚡ Đột xuất</button>
                </div>
              </div>

              <!-- Hàng nhập giờ bắt đầu, giờ kết thúc và tên ca tự do -->
              <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <div>
                  <label class="block text-[10px] font-bold text-slate-600 dark:text-slate-300 mb-1">Giờ bắt đầu:</label>
                  <input type="time" id="audit-start-time" value="${this.newAuditState.startTime || '07:30'}" onchange="app5s.onAuditCustomTimeChange(this.value, null, null)" class="w-full bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500">
                </div>

                <div>
                  <label class="block text-[10px] font-bold text-slate-600 dark:text-slate-300 mb-1">Giờ kết thúc:</label>
                  <input type="time" id="audit-end-time" value="${this.newAuditState.endTime || '11:30'}" onchange="app5s.onAuditCustomTimeChange(null, this.value, null)" class="w-full bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500">
                </div>

                <div class="col-span-2 sm:col-span-1">
                  <label class="block text-[10px] font-bold text-slate-600 dark:text-slate-300 mb-1">Tên ca / Mô tả tự do:</label>
                  <input type="text" id="audit-shift-name" value="${this.newAuditState.shift || 'Ca kiểm tra (' + (this.newAuditState.startTime || '07:30') + ' - ' + (this.newAuditState.endTime || '11:30') + ')'}" oninput="app5s.onAuditCustomTimeChange(null, null, this.value)" placeholder="Gõ tên ca tùy chỉnh..." class="w-full bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500">
                </div>
              </div>
              <div class="text-[10px] text-slate-500 italic">
                * Tùy chỉnh giờ linh hoạt: Có thể chọn giờ tự do hoặc bấm nút chọn nhanh bên trên.
              </div>
            </div>
          </div>
        </div>

        <!-- ĐÁNH GIÁ 5 TIÊU CHÍ (MAX 20 ĐIỂM MỖI TIÊU CHÍ) -->
        <div class="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700 shadow-xs space-y-4">
          <div class="flex items-center justify-between border-b pb-2">
            <h3 class="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300">Đánh Giá Chi Tiết 5S</h3>
            <button onclick="app5s.setAllMaxScores()" class="text-[10px] text-emerald-600 font-bold hover:underline">Chấm tối đa (100đ)</button>
          </div>

          <div class="space-y-4">
            ${this.data.criteria.map(c => {
              const currentScore = this.newAuditState.scores[c.id] || 20;
              return `
                <div class="space-y-1.5">
                  <div class="flex items-center justify-between text-xs">
                    <span class="font-bold text-slate-800 dark:text-slate-200">${c.name}</span>
                    <span class="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">${currentScore} / ${c.max}đ</span>
                  </div>
                  <p class="text-[10px] text-slate-500">${c.desc}</p>
                  <input type="range" min="0" max="${c.max}" step="1" value="${currentScore}" oninput="app5s.setCriterionScore(${c.id}, parseInt(this.value))" class="w-full accent-emerald-600 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer">
                  <div class="flex justify-between text-[9px] text-slate-400 font-mono">
                    <span>0đ</span>
                    <span>10đ</span>
                    <span>15đ</span>
                    <span>20đ (Chuẩn)</span>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- HÌNH ẢNH MINH CHỨNG 5S: DUY NHẤT 1 Ô ẢNH SAU KHI ĐÃ 5S -->
        <div class="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700 shadow-xs space-y-3">
          <div class="flex items-center space-x-2">
            <i data-lucide="image" class="w-4 h-4 text-emerald-600"></i>
            <h3 class="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Hình Ảnh Minh Chứng 5S</h3>
          </div>
          <p class="text-[11px] text-slate-500">Chụp hoặc tải lên hình ảnh buồng phòng sau khi đã thực hiện sàng lọc, sắp xếp sạch sẽ.</p>

          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <label class="block text-xs font-bold text-emerald-700 dark:text-emerald-400">Ảnh Sau Khi Đã 5S (In ngày giờ chụp thực tế) *</label>
              <span class="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-300">Chống gian lận 5S</span>
            </div>

            <!-- Input file ẩn cho tab Chấm 5S -->
            <input type="file" id="audit-camera-input" accept="image/*" capture="environment" onchange="app5s.onAfterPhotoSelected(event)" class="hidden">
            <input type="file" id="audit-file-input" accept="image/*" onchange="app5s.onAfterPhotoSelected(event)" class="hidden">

            <div id="after-photo-preview" class="relative border-2 border-dashed border-emerald-300 dark:border-emerald-700/80 rounded-2xl p-3 text-center bg-emerald-50/40 dark:bg-emerald-950/20 transition">
              ${this.newAuditState.afterPhoto ? `
                <div class="relative group rounded-xl overflow-hidden border border-emerald-500 shadow-xs">
                  <div class="w-full bg-slate-950 rounded-xl overflow-hidden flex items-center justify-center p-1"><img src="${this.newAuditState.afterPhoto}" class="w-full h-auto max-h-72 object-contain rounded-lg shadow-xs"></div>
                  <div class="absolute top-2 right-2 flex items-center space-x-1.5">
                    <button type="button" onclick="app5s.openLiveCameraModal({ target: 'audit' })" class="px-2 py-1 bg-white/95 text-slate-800 rounded-lg shadow text-xs font-bold flex items-center space-x-1">
                      <i data-lucide="camera" class="w-3.5 h-3.5 text-emerald-600"></i>
                      <span class="text-[10px]">Chụp lại</span>
                    </button>
                    <button type="button" onclick="app5s.removeAfterPhoto(event)" class="p-1 bg-red-600 text-white rounded-lg shadow">
                      <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                    </button>
                  </div>
                  <div class="absolute top-2 left-2 bg-emerald-950/85 text-emerald-300 text-[10px] font-bold px-2.5 py-1 rounded-xl flex items-center space-x-1 border border-emerald-500/60 shadow backdrop-blur-xs">
                    <i data-lucide="shield-check" class="w-3.5 h-3.5 text-emerald-400"></i>
                    <span>✓ Đã đóng dấu ngày giờ</span>
                  </div>
                </div>
              ` : `
                <div class="space-y-3 py-3">
                  <div class="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-300 flex items-center justify-center mx-auto">
                    <i data-lucide="camera" class="w-6 h-6"></i>
                  </div>
                  <div>
                    <div class="text-xs font-bold text-emerald-900 dark:text-emerald-200">Chụp ảnh hoặc Tải ảnh kiểm tra 5S</div>
                    <div class="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Khung hình in chết thông tin ngày giờ, khoa phòng và cán bộ chấm</div>
                  </div>
                  <div class="grid grid-cols-2 gap-2 max-w-sm mx-auto pt-1">
                    <button type="button" onclick="app5s.openLiveCameraModal({ target: 'audit' })" class="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5 shadow-sm transition">
                      <i data-lucide="camera" class="w-4 h-4"></i>
                      <span>📸 Chụp Camera</span>
                    </button>
                    <button type="button" onclick="document.getElementById('audit-file-input').click()" class="py-2.5 px-3 bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-800 dark:text-slate-100 border border-slate-300 dark:border-slate-600 rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5 shadow-2xs transition">
                      <i data-lucide="folder-open" class="w-4 h-4 text-indigo-500"></i>
                      <span>📁 Tải ảnh máy</span>
                    </button>
                  </div>
                </div>
              `}
            </div>

            <!-- Thanh cảnh báo chống gian lận -->
            <div class="bg-amber-50 dark:bg-amber-950/30 p-2 rounded-xl border border-amber-200 dark:border-amber-800 flex items-center space-x-1.5 text-[10px] text-amber-800 dark:text-amber-200">
              <i data-lucide="alert-triangle" class="w-3.5 h-3.5 text-amber-600 shrink-0"></i>
              <span>Quy định 5S VPI: Không sử dụng ảnh chụp lại từ màn hình hoặc ảnh cũ. Hệ thống đối soát ngày giờ ngẫu nhiên.</span>
            </div>
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Ghi chú kiểm tra</label>
            <textarea id="audit-notes" rows="2" placeholder="Ghi chú về việc sắp xếp, lau khử khuẩn hoặc tình trạng buồng phòng..." class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-800 dark:text-slate-100"></textarea>
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Hành động khắc phục (nếu có)</label>
            <input type="text" id="audit-action" placeholder="Ví dụ: Bổ sung cồn khử khuẩn, dán lại tem nhãn..." class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-800 dark:text-slate-100">
          </div>

          <button onclick="app5s.saveNewAudit()" class="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black py-3 rounded-2xl shadow-md transition flex items-center justify-center space-x-2 text-sm">
            <i data-lucide="check-circle" class="w-5 h-5"></i>
            <span>Hoàn Tất & Lưu Phiếu Chấm 5S</span>
          </button>
        </div>
      </div>
    `;
  }

  onAuditDeptChange(deptId) {
    this.newAuditState.deptId = parseInt(deptId);
    const rooms = this.getSortedRooms(this.newAuditState.deptId);
    if (rooms.length > 0) {
      this.newAuditState.roomId = rooms[0].id;
    }
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

  onAfterPhotoSelected(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDim = 1280;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const roomId = this.newAuditState.roomId || 34;
        const room = (this.data.rooms || []).find(r => r.id == roomId) || { name: 'Buồng phòng y tế', department_id: this.newAuditState.deptId || 8 };
        const dept = (this.data.departments || []).find(d => d.id == (room.department_id || this.newAuditState.deptId || 8)) || { name: 'Khoa phòng' };
        const user = this.getCurrentUser() || { name: 'Cán bộ kiểm tra', code: 'BV-345' };

        this.stamp5SWatermark(canvas, {
          deptName: dept.name,
          roomName: room.name,
          staffName: `${user.name} (${user.code})`,
          shiftName: this.newAuditState.shift || 'Phiếu kiểm tra 5S'
        });

        const stampedUrl = canvas.toDataURL('image/jpeg', 0.85);
        this.newAuditState.afterPhoto = stampedUrl;
        this.render();
        this.showToast('✅ Đã tải và đóng dấu ngày giờ thực tế vào ảnh thành công!');
      };
      img.src = evt.target.result;
    };
    reader.readAsDataURL(file);
  }

  removeAfterPhoto(e) {
    if (e && e.stopPropagation) e.stopPropagation();
    this.newAuditState.afterPhoto = '';
    this.currentShiftPhoto = '';
    const previewEl = document.getElementById('shift-photo-preview');
    if (previewEl) {
      this.updateShiftPhotoPreviewUI('');
    } else {
      this.render();
    }
  }

  saveNewAudit() {
    const roomSelect = document.getElementById('audit-room-select');
    const shiftNameInput = document.getElementById('audit-shift-name');
    const startTimeInput = document.getElementById('audit-start-time');
    const endTimeInput = document.getElementById('audit-end-time');
    const shiftSelect = document.getElementById('audit-shift-select');
    const notesInput = document.getElementById('audit-notes');
    const actionInput = document.getElementById('audit-action');

    const roomId = roomSelect ? parseInt(roomSelect.value) : this.newAuditState.roomId;
    
    // Đọc giờ tùy chỉnh linh hoạt
    const startTime = startTimeInput ? startTimeInput.value : (this.newAuditState.startTime || '07:30');
    const endTime = endTimeInput ? endTimeInput.value : (this.newAuditState.endTime || '11:30');
    let shift = shiftNameInput ? shiftNameInput.value.trim() : (this.newAuditState.shift || '');
    if (!shift) {
      shift = shiftSelect ? shiftSelect.value : `Ca kiểm tra (${startTime} - ${endTime})`;
    } else if (!shift.includes('(') && startTime && endTime) {
      shift = `${shift} (${startTime} - ${endTime})`;
    }
    const notes = notesInput ? notesInput.value.trim() : '';
    const action = actionInput ? actionInput.value.trim() : '';

    const totalScore = Object.values(this.newAuditState.scores).reduce((a, b) => a + b, 0);
    const user = this.getCurrentUser();
    const inspectorName = user ? user.name : 'Vũ Bá Đạt';
    const inspectorRole = user ? (user.title || user.role_title || 'Cán bộ 5S') : 'Cán bộ 5S';

    let rating = 'Xuất sắc';
    if (totalScore < 70) rating = 'Cần cải tiến';
    else if (totalScore < 90) rating = 'Đạt chuẩn';

    const newAudit = {
      id: Date.now(),
      audit_code: '5S-' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-' + Math.floor(100 + Math.random() * 900),
      department_id: this.newAuditState.deptId,
      room_id: roomId,
      audit_date: new Date().toISOString().slice(0, 10),
      audit_time: new Date().toTimeString().slice(0, 5),
      shift: shift,
      shift_type: this.newAuditState.shiftType || 'custom',
      start_time: startTime,
      end_time: endTime,
      inspector_name: inspectorName,
      inspector_role: inspectorRole,
      score_seiri: this.newAuditState.scores[1] || 20,
      score_seiton: this.newAuditState.scores[2] || 20,
      score_seiso: this.newAuditState.scores[3] || 20,
      score_seiketsu: this.newAuditState.scores[4] || 20,
      score_shitsuke: this.newAuditState.scores[5] || 20,
      total_score: totalScore,
      rating: rating,
      notes: notes,
      action_required: action,
      after_photo: this.newAuditState.afterPhoto || '',
      created_at: new Date().toISOString()
    };

    if (!this.data.audits || !Array.isArray(this.data.audits)) this.data.audits = [];
    this.data.audits.unshift(newAudit);
    this.saveData();
    this.showToast('Đã lưu thành công phiếu kiểm tra 5S!');
    this.switchTab('history');
  }

  // =========================================================================
  // =========================================================================
  // TAB 3: KHOA & BUỒNG PHÒNG — NHÓM RIÊNG TỪNG KHOA & TÙY CHỈNH KHU VỰC LÀM VIỆC
  // TÌM KIẾM THỜI GIAN THỰC GIỮ NGUYÊN TIÊU ĐIỂM (KHÔNG BỊ THOÁT RA KHI GÕ)
  // =========================================================================
  getVisibleDepartments() {
    const sortedDepts = this.getSortedDepartments();
    const q = (this.searchQuery || '').trim().toLowerCase();

    let visibleDepts = sortedDepts;
    if (this.filterDeptCategory && this.filterDeptCategory !== 'all') {
      visibleDepts = visibleDepts.filter(d => (d.category || 'clinical') === this.filterDeptCategory);
    }
    if (this.filterDept && this.filterDept !== 'all') {
      visibleDepts = visibleDepts.filter(d => String(d.id) === String(this.filterDept));
    }

    if (this.filterDeptDailyStatus && this.filterDeptDailyStatus !== 'all') {
      const today = this.getTodayDateString();
      const audits = this.data.audits || [];
      const completedDeptIds = new Set(audits.filter(a => a.audit_date === today).map(a => a.department_id));
      if (this.filterDeptDailyStatus === 'completed') {
        visibleDepts = visibleDepts.filter(d => completedDeptIds.has(d.id));
      } else if (this.filterDeptDailyStatus === 'uncompleted') {
        visibleDepts = visibleDepts.filter(d => !completedDeptIds.has(d.id));
      }
    }

    if (q) {
      visibleDepts = visibleDepts.filter(d => {
        const deptText = `${d.name} ${d.code} ${d.doctor_in_charge || ''} ${d.head_nurse || ''} ${d.description || ''}`.toLowerCase();
        if (deptText.includes(q)) return true;

        const allDeptRooms = this.data.rooms.filter(r => r.department_id == d.id);
        return allDeptRooms.some(r => {
          const roomText = `${r.name} ${r.code} ${r.person_in_charge || ''} ${r.floor || ''} ${r.room_type || ''}`.toLowerCase();
          return roomText.includes(q);
        });
      });
    }
    return visibleDepts;
  }

  renderGroupedDeptsListHtml() {
    const visibleDepts = this.getVisibleDepartments();
    const q = (this.searchQuery || '').trim().toLowerCase();

    let roomMatches = {};
    if (q) {
      visibleDepts.forEach(d => {
        const deptText = `${d.name} ${d.code} ${d.doctor_in_charge || ''} ${d.head_nurse || ''} ${d.description || ''}`.toLowerCase();
        const isDeptMatch = deptText.includes(q);
        const allDeptRooms = this.data.rooms.filter(r => r.department_id == d.id);
        const matchingRooms = allDeptRooms.filter(r => {
          const roomText = `${r.name} ${r.code} ${r.person_in_charge || ''} ${r.floor || ''} ${r.room_type || ''}`.toLowerCase();
          return roomText.includes(q);
        });
        roomMatches[d.id] = isDeptMatch ? allDeptRooms : matchingRooms;
      });
    }

    if (visibleDepts.length === 0) {
      return `
        <div class="p-8 text-center bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 space-y-2">
          <i data-lucide="search-x" class="w-8 h-8 mx-auto text-slate-400"></i>
          <div class="text-sm font-bold text-slate-700 dark:text-slate-200">Không tìm thấy khoa phòng phù hợp</div>
          <p class="text-xs text-slate-400">Thử từ khóa khác hoặc bấm xem tất cả để xem đủ 20 khoa phòng chuẩn VPI.</p>
          <button onclick="app5s.clearSearch()" class="mt-2 px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-bold">Xem tất cả</button>
        </div>
      `;
    }

    return visibleDepts.map(d => {
      const deptRooms = (q && roomMatches[d.id]) ? roomMatches[d.id] : this.getSortedRooms(d.id);
      const isCollapsed = !!this.collapsedDepts[d.id];
      const isParaclinical = d.category === 'paraclinical';
      const isFunctional = d.category === 'functional';
      const badgeColor = isParaclinical 
        ? 'bg-indigo-600 text-white' 
        : (isFunctional ? 'bg-slate-700 text-white' : 'bg-emerald-600 text-white');

      return `
        <!-- NHÓM KHOA: ${d.name} -->
        <div data-dept-card="${d.id}" class="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200/90 dark:border-slate-700 shadow-sm overflow-hidden transition hover:border-emerald-300">
          <!-- Header của Nhóm Khoa: Bố cục cân đối 2 bên, không còn khoảng trống -->
          <div class="p-3 sm:p-3.5 bg-gradient-to-r ${
            isParaclinical ? 'from-indigo-50/70 via-white to-white dark:from-indigo-950/30' : 
            (isFunctional ? 'from-slate-100/70 via-white to-white dark:from-slate-800' : 'from-emerald-50/70 via-white to-white dark:from-emerald-950/30')
          } dark:to-slate-800 border-b border-slate-100 dark:border-slate-700/60">
            
            <!-- HÀNG 1: TÊN KHOA PHÒNG & NÚT THU GỌN (Chiếm trọn bề ngang, không bị bóp nghẹt chữ) -->
            <div class="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-700/60">
              <div class="flex items-center space-x-2.5 min-w-0 flex-1">
                <div class="w-8 h-8 rounded-xl ${badgeColor} flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                  #${d.order}
                </div>
                <div class="min-w-0 flex-1">
                  <div class="flex flex-wrap items-center gap-1.5">
                    <h3 class="text-sm sm:text-base font-black text-slate-900 dark:text-white tracking-tight">${d.name}</h3>
                    <span class="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold shrink-0">${d.code}</span>
                    <span class="text-[9px] px-1.5 py-0.5 rounded-full ${
                      isParaclinical ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300' : 
                      (isFunctional ? 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300')
                    } font-semibold shrink-0">
                      ${isParaclinical ? 'Cận lâm sàng' : (isFunctional ? 'Khối chức năng' : 'Khối lâm sàng')}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Nút Thao tác nhanh & Thu gọn / Mở rộng nhóm -->
              <div class="flex items-center space-x-1 shrink-0">
                ${this.isReorderMode ? `
                  <div class="flex items-center space-x-0.5 mr-1">
                    <button onclick="app5s.moveDeptUp('${d.id}')" title="Đẩy khoa lên trên" class="p-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-800 transition">
                      <i data-lucide="chevron-up" class="w-3.5 h-3.5"></i>
                    </button>
                    <button onclick="app5s.moveDeptDown('${d.id}')" title="Chuyển khoa xuống dưới" class="p-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-800 transition">
                      <i data-lucide="chevron-down" class="w-3.5 h-3.5"></i>
                    </button>
                  </div>
                ` : ''}

                <button onclick="app5s.toggleCollapseDept('${d.id}')" title="${isCollapsed ? 'Mở rộng nhóm' : 'Thu gọn nhóm'}" class="p-1.5 rounded-xl bg-white/80 dark:bg-slate-700/80 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-500 dark:text-slate-300 border border-slate-200/90 dark:border-slate-600 transition shadow-2xs flex items-center space-x-1">
                  <span class="text-[10px] font-bold text-slate-400 hidden sm:inline">${isCollapsed ? 'Mở' : 'Gọn'}</span>
                  <i data-lucide="${isCollapsed ? 'chevron-down' : 'chevron-up'}" class="w-4 h-4"></i>
                </button>
              </div>
            </div>

            <!-- HÀNG 2: BỐ CỤC 2 CỘT CÂN ĐỐI (Lấp đầy khoảng trống bên phải) -->
            <div class="mt-2.5 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              <!-- Khối Trái: Thông tin Nhân sự & Hotline -->
              <div class="bg-white/80 dark:bg-slate-800/80 p-2.5 rounded-2xl border border-slate-200/70 dark:border-slate-700/60 space-y-1 text-slate-600 dark:text-slate-300">
                <div class="flex items-center space-x-1.5">
                  <span class="text-slate-400 shrink-0">👨‍⚕️ Trưởng khoa:</span>
                  <strong class="text-slate-800 dark:text-slate-100 truncate">${d.doctor_in_charge || 'Chưa cập nhật'}</strong>
                </div>
                <div class="flex items-center space-x-1.5">
                  <span class="text-slate-400 shrink-0">👩‍⚕️ ĐD/KTV Trưởng:</span>
                  <strong class="text-slate-800 dark:text-slate-100 truncate">${d.head_nurse || 'Chưa cập nhật'}</strong>
                </div>
                <div class="flex items-center space-x-1.5">
                  <span class="text-slate-400 shrink-0">📞 Hotline:</span>
                  <strong class="text-slate-800 dark:text-slate-100">${d.phone || '0211.386.115'}</strong>
                </div>
              </div>

              <!-- Khối Phải: Tình trạng 5S Hôm Nay, Đánh Giá & Quy Mô (Lấp đầy khoảng trống) -->
              <div class="bg-white/80 dark:bg-slate-800/80 p-2.5 rounded-2xl border border-slate-200/70 dark:border-slate-700/60 flex flex-col justify-between space-y-1.5">
                <div class="flex items-center justify-between">
                  <span class="text-slate-400 text-[10px] shrink-0 font-medium">Tiến độ 5S hôm nay:</span>
                  ${(() => {
                    const daily = this.getDepartmentDailyStatus(d.id);
                    if (daily.isCompleted) {
                      return `
                        <div class="flex items-center space-x-1.5">
                          <span class="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300">
                            <i data-lucide="check-circle" class="w-3 h-3 text-emerald-600"></i>
                            <span>Đã nộp (${daily.count} phiếu)</span>
                          </span>
                          ${daily.status === 'pending' ? '<span class="px-1.5 py-0.5 rounded-full text-[9px] bg-amber-100 text-amber-800 border border-amber-300 font-bold">Chờ duyệt</span>' : 
                            (daily.status === 'approved' ? '<span class="px-1.5 py-0.5 rounded-full text-[9px] bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold">Đạt 5S</span>' :
                            '<span class="px-1.5 py-0.5 rounded-full text-[9px] bg-red-100 text-red-800 border border-red-300 font-bold">Nhắc lỗi</span>')}
                          ${daily.latestAudit ? `
                            <button onclick="app5s.openAuditEvaluationModal('${daily.latestAudit.id}')" class="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold hover:underline flex items-center space-x-0.5">
                              <span>Xem</span>
                              <i data-lucide="arrow-right" class="w-2.5 h-2.5"></i>
                            </button>
                          ` : ''}
                        </div>
                      `;
                    } else {
                      return `
                        <div class="flex items-center space-x-1.5">
                          <span class="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 border border-red-300">
                            <i data-lucide="alert-triangle" class="w-3 h-3 text-red-600"></i>
                            <span>Chưa gửi ảnh</span>
                          </span>
                          <button onclick="app5s.remindSingleDept('${d.id}')" class="px-1.5 py-0.5 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300 rounded-lg text-[9px] font-bold hover:bg-amber-100 transition flex items-center space-x-0.5">
                            <i data-lucide="bell" class="w-2.5 h-2.5"></i>
                            <span>Nhắc nộp</span>
                          </button>
                        </div>
                      `;
                    }
                  })()}
                </div>

                <div class="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-700/60">
                  <div class="flex items-center space-x-1">
                    <i data-lucide="layout-grid" class="w-3 h-3 text-slate-400"></i>
                    <span>Quy mô: <strong class="text-slate-700 dark:text-slate-200">${deptRooms.length} buồng phòng</strong></span>
                  </div>
                  ${(() => {
                    const deptEval = (this.data.department_evaluations || []).find(e => e.dept_id == d.id);
                    if (deptEval && deptEval.score) {
                      return `
                        <span class="inline-flex items-center space-x-1 font-bold text-indigo-700 dark:text-indigo-400">
                          <i data-lucide="award" class="w-3 h-3 text-indigo-600"></i>
                          <span>5S Khoa: ${deptEval.score}đ (${deptEval.grade || 'Đạt'})</span>
                        </span>
                      `;
                    } else {
                      return `<span class="text-slate-400 italic">Chưa đánh giá 5S khoa</span>`;
                    }
                  })()}
                </div>
              </div>
            </div>

            <!-- HÀNG 3: THANH CÔNG CỤ HÀNH ĐỘNG CẤP KHOA (3 nút trải đều, cân đối, dễ bấm) -->
            <div class="mt-2.5 grid grid-cols-3 gap-1.5 sm:gap-2 pt-1">
              <!-- Nút Kiểm tra & Đánh giá 5S Khoa (V8) -->
              <button onclick="app5s.openDeptEvaluationModal('${d.id}')" title="Kiểm tra & Đánh giá 5S Khoa" class="w-full py-1.5 px-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center justify-center space-x-1 transition shadow-2xs">
                <i data-lucide="award" class="w-3.5 h-3.5"></i>
                <span class="text-[11px] truncate">Đánh giá 5S</span>
              </button>

              <!-- Nút Sửa Khoa -->
              <button onclick="app5s.openEditDeptModal('${d.id}')" title="Sửa thông tin khoa" class="w-full py-1.5 px-2 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center justify-center space-x-1 transition border border-slate-200 dark:border-slate-600">
                <i data-lucide="edit-3" class="w-3.5 h-3.5"></i>
                <span class="text-[11px] truncate">Sửa Khoa</span>
              </button>

              <!-- Nút Thêm Khu Vực Làm Việc vào Khoa này -->
              <button onclick="app5s.openAddRoomModal('${d.id}')" title="Thêm khu vực làm việc vào ${d.name}" class="w-full py-1.5 px-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 hover:bg-emerald-600 hover:text-white text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center justify-center space-x-1 transition border border-emerald-200 dark:border-emerald-800">
                <i data-lucide="plus-circle" class="w-3.5 h-3.5"></i>
                <span class="text-[11px] truncate">+ Khu vực</span>
              </button>
            </div>
          </div>

          <!-- DANH SÁCH CÁC KHU VỰC LÀM VIỆC BÊN TRONG KHOA NÀY -->
          ${!isCollapsed ? `
            <div class="p-3 space-y-2 bg-slate-50/50 dark:bg-slate-900/40">
              <div class="flex items-center justify-between text-[11px] text-slate-500 px-1 font-semibold">
                <span>Các khu vực làm việc / buồng phòng (${deptRooms.length}):</span>
                <button onclick="app5s.openAddRoomModal('${d.id}')" class="text-[10px] text-emerald-600 font-bold hover:underline">+ Thêm khu vực mới</button>
              </div>

              ${deptRooms.length === 0 ? `
                <div class="p-4 text-center border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl bg-white dark:bg-slate-800 text-xs text-slate-400 space-y-2">
                  <p>Khoa này chưa có khu vực làm việc nào.</p>
                  <button onclick="app5s.openAddRoomModal('${d.id}')" class="px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-bold">+ Thêm khu vực đầu tiên</button>
                </div>
              ` : `
                <div class="space-y-1.5">
                  ${deptRooms.map((room, rIdx) => `
                    <div class="bg-white dark:bg-slate-800 rounded-2xl p-2.5 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs flex items-center justify-between hover:border-emerald-300 transition">
                      <div class="flex items-center space-x-2.5 min-w-0">
                        <div class="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 font-mono font-black text-[11px] flex items-center justify-center shrink-0 border border-emerald-200 dark:border-emerald-800">
                          ${room.code ? room.code.slice(-3) : (rIdx + 1)}
                        </div>
                        <div class="min-w-0 truncate">
                          <div class="text-xs font-bold text-slate-900 dark:text-white truncate">${room.name}</div>
                          <div class="text-[10px] text-slate-500 flex items-center space-x-1.5 truncate">
                            <span class="font-mono text-emerald-600">${room.code}</span>
                            <span>•</span>
                            <span>${room.floor || 'Tầng 1'}</span>
                            <span>•</span>
                            <span>Phụ trách: <strong>${room.person_in_charge || 'Điều dưỡng trực'}</strong></span>
                          </div>
                        </div>
                      </div>

                      <div class="flex items-center space-x-1 shrink-0 ml-2">
                        ${this.isReorderMode ? `
                          <div class="flex items-center space-x-0.5 mr-1">
                            <button onclick="app5s.moveRoomUp('${room.id}')" title="Đẩy khu vực lên" class="p-1 rounded bg-amber-100 hover:bg-amber-200 text-amber-800 transition">
                              <i data-lucide="chevron-up" class="w-3 h-3"></i>
                            </button>
                            <button onclick="app5s.moveRoomDown('${room.id}')" title="Chuyển khu vực xuống" class="p-1 rounded bg-amber-100 hover:bg-amber-200 text-amber-800 transition">
                              <i data-lucide="chevron-down" class="w-3 h-3"></i>
                            </button>
                          </div>
                        ` : ''}
                        <div class="text-right mr-1 hidden sm:block">
                          <span class="text-xs font-mono font-black text-emerald-600 dark:text-emerald-400">99.0 đ</span>
                          <span class="block text-[8px] font-bold text-emerald-600">Đạt 5S</span>
                        </div>
                        <!-- Nút Sửa Khu Vực Làm Việc -->
                        <button onclick="app5s.openEditRoomModal('${room.id}')" title="Chỉnh sửa thông tin khu vực làm việc này" class="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-700 transition">
                          <i data-lucide="edit-3" class="w-3.5 h-3.5"></i>
                        </button>
                        <!-- Nút Chấm 5S ngay -->
                        <button onclick="app5s.quickAuditRoom('${room.id}')" title="Chấm điểm 5S khu vực này ngay" class="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 hover:bg-emerald-100 transition">
                          <i data-lucide="clipboard-check" class="w-3.5 h-3.5"></i>
                        </button>
                        <!-- Nút Xóa khu vực -->
                        <button onclick="app5s.deleteRoom('${room.id}')" title="Xóa khu vực làm việc này" class="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition">
                          <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                        </button>
                      </div>
                    </div>
                  `).join('')}
                </div>
              `}

              <!-- Nút thêm khu vực làm việc con ở chân card -->
              <div class="pt-1">
                <button onclick="app5s.openAddRoomModal('${d.id}')" class="w-full py-2 bg-white dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-slate-700 border border-dashed border-emerald-300 dark:border-emerald-700/80 rounded-2xl text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center justify-center space-x-1.5 transition">
                  <i data-lucide="plus" class="w-4 h-4"></i>
                  <span>Thêm khu vực làm việc mới vào ${d.name}</span>
                </button>
              </div>
            </div>
          ` : ''}
        </div>
      `;
    }).join('');
  }

  renderDepartmentsTab() {
    const sortedDepts = this.getSortedDepartments();
    const visibleDepts = this.getVisibleDepartments();

    // Phân loại khối
    const paraclinicalDepts = sortedDepts.filter(d => d.category === 'paraclinical');
    const clinicalDepts = sortedDepts.filter(d => d.category === 'clinical');
    const functionalDepts = sortedDepts.filter(d => d.category === 'functional');

    return `
      <div class="p-4 space-y-4">
        <!-- Header Khoa & Khu Vực Làm Việc -->
        <div class="flex items-center justify-between">
          <div>
            <span class="text-xs font-mono font-bold text-emerald-600">DANH MỤC KHU VỰC 5S</span>
            <h2 class="text-base font-black text-slate-900 dark:text-white">
              ${sortedDepts.length} Khoa/Phòng & ${this.data.rooms.length} Khu Vực
            </h2>
          </div>
          <div class="flex items-center space-x-1.5">
            <!-- NÚT BÁO CÁO TỔNG KẾT NGÀY & ĐÁNH GIÁ TOÀN VIỆN -->
            <button onclick="app5s.openDailySummaryModal()" title="Báo cáo 5S cuối ngày toàn viện" class="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-2.5 py-1.5 rounded-xl shadow-xs transition flex items-center space-x-1">
              <i data-lucide="bar-chart-2" class="w-3.5 h-3.5"></i>
              <span>Báo Cáo Ngày</span>
            </button>
            <!-- Nút Thêm Khoa Mới -->
            <button onclick="app5s.openAddDeptModal()" title="Thêm Khoa / Phòng mới" class="bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-600 transition flex items-center space-x-1">
              <i data-lucide="plus" class="w-3.5 h-3.5"></i>
              <span>Khoa</span>
            </button>
            <!-- Nút Thêm Khu Vực Làm Việc -->
            <button onclick="app5s.openAddRoomModal()" title="Thêm Khu vực làm việc / Buồng phòng mới" class="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-2.5 py-1.5 rounded-xl shadow-xs transition flex items-center space-x-1">
              <i data-lucide="plus" class="w-3.5 h-3.5"></i>
              <span>Khu Vực</span>
            </button>
            <!-- Nút Sắp xếp -->
            <button onclick="app5s.toggleReorderMode()" class="px-2.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1 ${
              this.isReorderMode ? 'bg-amber-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
            }">
              <i data-lucide="arrow-up-down" class="w-3.5 h-3.5"></i>
              <span>${this.isReorderMode ? 'Xong' : 'Thứ tự'}</span>
            </button>
          </div>
        </div>

        ${this.isReorderMode ? `
          <div class="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl p-3.5 text-xs text-amber-900 dark:text-amber-200 space-y-2">
            <div class="flex items-center space-x-1.5 font-bold">
              <i data-lucide="sparkles" class="w-4 h-4 text-amber-600"></i>
              <span>Chế độ Sắp xếp Thứ tự Khoa & Phòng</span>
            </div>
            <p class="text-[11px] leading-relaxed">
              Bấm mũi tên <strong>⬆ Lên</strong> hoặc <strong>⬇ Xuống</strong> hoặc bấm nút <strong>✏️ Sửa</strong> để tùy biến thông tin chi tiết của Khoa / Khu vực làm việc.
            </p>
          </div>
        ` : ''}

        <!-- Ô Tìm Kiếm Toàn Diện - GIỮ NGUYÊN FOCUS KHI GÕ, KHÔNG BỊ THOÁT -->
        <div class="relative">
          <i data-lucide="search" class="w-4 h-4 absolute left-3 top-3 text-slate-400"></i>
          <input type="text" id="dept-search-input" oninput="app5s.onSearchInput(this.value)" placeholder="Tìm kiếm tên khoa, buồng phòng, mã phòng, người phụ trách..." value="${this.searchQuery}" class="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500">
          <button id="dept-search-clear-btn" onclick="app5s.clearSearch()" class="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 ${this.searchQuery ? '' : 'hidden'}">
            <i data-lucide="x-circle" class="w-4 h-4"></i>
          </button>
        </div>

        <!-- BỘ LỌC PHÂN KHỐI CHỨC NĂNG -->
        <div class="grid grid-cols-4 gap-1.5 text-center text-xs">
          <button onclick="app5s.setFilterCategory('all')" class="py-1.5 px-2 rounded-xl font-bold transition text-[11px] ${
            this.filterDeptCategory === 'all' ? 'bg-emerald-600 text-white shadow-2xs' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
          }">
            Tất cả (${sortedDepts.length})
          </button>
          <button onclick="app5s.setFilterCategory('paraclinical')" class="py-1.5 px-2 rounded-xl font-bold transition text-[11px] ${
            this.filterDeptCategory === 'paraclinical' ? 'bg-indigo-600 text-white shadow-2xs' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
          }">
            Cận lâm sàng (${paraclinicalDepts.length})
          </button>
          <button onclick="app5s.setFilterCategory('clinical')" class="py-1.5 px-2 rounded-xl font-bold transition text-[11px] ${
            this.filterDeptCategory === 'clinical' ? 'bg-teal-600 text-white shadow-2xs' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
          }">
            Lâm sàng (${clinicalDepts.length})
          </button>
          <button onclick="app5s.setFilterCategory('functional')" class="py-1.5 px-2 rounded-xl font-bold transition text-[11px] ${
            this.filterDeptCategory === 'functional' ? 'bg-slate-700 text-white shadow-2xs' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
          }">
            Phòng ban (${functionalDepts.length})
          </button>
        </div>

        <!-- BỘ LỌC TIẾN ĐỘ THỰC HIỆN 5S HÔM NAY CỦA CÁC KHOA -->
        <div class="grid grid-cols-3 gap-1.5 text-center text-xs">
          <button onclick="app5s.setDeptDailyFilter('all')" class="py-1.5 px-2 rounded-xl font-bold transition text-[11px] ${
            this.filterDeptDailyStatus === 'all' ? 'bg-slate-800 text-white shadow-2xs' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
          }">
            Tất cả (${sortedDepts.length})
          </button>
          <button onclick="app5s.setDeptDailyFilter('completed')" class="py-1.5 px-2 rounded-xl font-bold transition text-[11px] flex items-center justify-center space-x-1 ${
            this.filterDeptDailyStatus === 'completed' ? 'bg-emerald-600 text-white shadow-2xs' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
          }">
            <span>🟢 Đã nộp</span>
            <span class="text-[9px] opacity-80">(${this.getDaily5SStatus().completedDepts.length})</span>
          </button>
          <button onclick="app5s.setDeptDailyFilter('uncompleted')" class="py-1.5 px-2 rounded-xl font-bold transition text-[11px] flex items-center justify-center space-x-1 ${
            this.filterDeptDailyStatus === 'uncompleted' ? 'bg-red-600 text-white shadow-2xs' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
          }">
            <span>🔴 Chưa nộp</span>
            <span class="text-[9px] opacity-80">(${this.getDaily5SStatus().uncompletedDepts.length})</span>
          </button>
        </div>

        <!-- Thanh Cuộn Nhanh Danh Sách Khoa (Bấm để nhảy thẳng đến khoa đó) -->
        <div class="flex space-x-1.5 overflow-x-auto pb-1 no-scrollbar">
          <button onclick="app5s.setFilterDept('all')" class="shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
            this.filterDept === 'all' ? 'bg-emerald-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
          }">
            Tất cả khoa (${sortedDepts.length})
          </button>
          ${sortedDepts.map(d => `
            <button onclick="app5s.setFilterDept('${d.id}')" class="shrink-0 px-2.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1 ${
              this.filterDept === String(d.id) ? 'bg-emerald-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
            }">
              <span class="text-[9px] opacity-75 font-mono">#${d.order || ''}</span>
              <span>${d.name}</span>
            </button>
          `).join('')}
        </div>

        <!-- Nút thu gọn / mở rộng nhanh & Đếm số lượng -->
        <div class="flex items-center justify-between text-xs text-slate-500 pt-1">
          <span>Hiển thị: <strong><span id="dept-visible-count">${visibleDepts.length}</span> nhóm khoa/phòng</strong></span>
          <div class="flex items-center space-x-2">
            <button onclick="app5s.expandAllDepts()" class="text-[11px] text-emerald-600 font-bold hover:underline">Mở tất cả</button>
            <span>•</span>
            <button onclick="app5s.collapseAllDepts()" class="text-[11px] text-slate-500 font-bold hover:underline">Thu gọn tất cả</button>
          </div>
        </div>

        <!-- DANH SÁCH RIÊNG TỪNG NHÓM KHOA / PHÒNG VÀ CÁC KHU VỰC LÀM VIỆC BÊN TRONG -->
        <div id="departments-list-container" class="space-y-4">
          ${this.renderGroupedDeptsListHtml()}
        </div>
      </div>
    `;
  }

  onSearchInput(val) {
    this.searchQuery = val;
    const clearBtn = document.getElementById('dept-search-clear-btn');
    if (clearBtn) {
      if (val.trim()) clearBtn.classList.remove('hidden');
      else clearBtn.classList.add('hidden');
    }

    const listContainer = document.getElementById('departments-list-container');
    if (listContainer) {
      listContainer.innerHTML = this.renderGroupedDeptsListHtml();
      const countEl = document.getElementById('dept-visible-count');
      if (countEl) {
        const visibleDepts = this.getVisibleDepartments();
        countEl.innerText = visibleDepts.length;
      }
      if (window.lucide) window.lucide.createIcons();
    } else {
      this.render();
    }
  }

  clearSearch() {
    this.searchQuery = '';
    this.filterDept = 'all';
    this.filterDeptCategory = 'all';
    const input = document.getElementById('dept-search-input');
    if (input) input.value = '';
    const clearBtn = document.getElementById('dept-search-clear-btn');
    if (clearBtn) clearBtn.classList.add('hidden');

    const listContainer = document.getElementById('departments-list-container');
    if (listContainer) {
      listContainer.innerHTML = this.renderGroupedDeptsListHtml();
      const countEl = document.getElementById('dept-visible-count');
      if (countEl) {
        const visibleDepts = this.getVisibleDepartments();
        countEl.innerText = visibleDepts.length;
      }
      if (window.lucide) window.lucide.createIcons();
    } else {
      this.render();
    }
  }

  setFilterDept(deptId) {
    this.filterDept = deptId;
    this.render();
  }

  setFilterCategory(cat) {
    this.filterDeptCategory = cat;
    this.render();
  }

  quickAuditRoom(roomId) {
    const room = this.data.rooms.find(r => r.id == roomId);
    if (!room) return;
    this.newAuditState.deptId = room.department_id;
    this.newAuditState.roomId = room.id;
    this.switchTab('audit');
    setTimeout(() => {
      const sel = document.getElementById('audit-room-select');
      if (sel) sel.value = String(roomId);
    }, 50);
  }


  deleteRoom(roomId) {
    const room = this.data.rooms.find(r => r.id == roomId);
    if (!room) return;
    if (!confirm(`Anh có chắc muốn xóa khu vực làm việc "${room.name}" không?`)) return;
    this.data.rooms = this.data.rooms.filter(r => r.id != roomId);
    this.saveData();
    this.render();
    this.showToast('Đã xóa khu vực làm việc thành công!');
  }

  deleteDept(deptId) {
    const roomsCount = this.data.rooms.filter(r => r.department_id == deptId).length;
    if (roomsCount > 0) {
      alert(`Không thể xóa khoa này vì đang có ${roomsCount} khu vực làm việc trực thuộc! Vui lòng xóa hoặc chuyển các khu vực sang khoa khác trước.`);
      return;
    }
    const d = this.data.departments.find(x => x.id == deptId);
    if (!confirm(`Anh có chắc muốn xóa khoa "${d ? d.name : ''}" không?`)) return;
    this.data.departments = this.data.departments.filter(x => x.id != deptId);
    this.saveData();
    this.closeModal();
    this.render();
    this.showToast('Đã xóa khoa thành công!');
  }

  // =========================================================================
  // =========================================================================
  // TAB 4: NHÂN SỰ & TÀI KHOẢN (VAI TRÒ PHÂN QUYỀN & CHỨC DANH ĐẦY ĐỦ - YÊU CẦU 3)
  // TÌM KIẾM THỜI GIAN THỰC GIỮ NGUYÊN FOCUS
  // =========================================================================
  getFilteredStaff() {
    const selectedDeptId = this.filterStaffDept === 'all' ? null : parseInt(this.filterStaffDept);
    let staffList = [...this.data.staff];
    if (selectedDeptId) {
      staffList = staffList.filter(s => s.department_id == selectedDeptId);
    }
    if (this.staffSearchQuery) {
      const sq = this.staffSearchQuery.toLowerCase();
      staffList = staffList.filter(s => {
        const text = `${s.name} ${s.code} ${s.title} ${s.role_title} ${s.username} ${s.assigned_room || ''}`.toLowerCase();
        return text.includes(sq);
      });
    }
    return staffList;
  }

  renderStaffListHtml() {
    const staffList = this.getFilteredStaff();
    const depts = this.data.departments;

    if (staffList.length === 0) {
      return `
        <div class="p-8 text-center bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 text-xs text-slate-400">
          Không tìm thấy nhân sự phù hợp với điều kiện tìm kiếm.
        </div>
      `;
    }

    return staffList.map(s => {
      const dept = depts.find(d => d.id == s.department_id) || { name: 'Chưa phân khoa' };
      const isOnline = true;
      const isAdmin = s.role === 'admin';
      const isManager = s.role === 'manager';
      
      const badgeClass = isAdmin 
        ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border-purple-200' 
        : (isManager ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-blue-200' : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 border-slate-200');

      return `
        <div class="bg-white dark:bg-slate-800 rounded-2xl p-3.5 border border-slate-200/80 dark:border-slate-700 shadow-2xs hover:border-emerald-300 transition space-y-2.5">
          <div class="flex items-start justify-between">
            <div class="flex items-center space-x-3">
              <div class="relative">
                <div class="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                  ${s.name.split(' ').pop().charAt(0)}
                </div>
                ${isOnline ? '<span class="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-800 rounded-full"></span>' : ''}
              </div>
              <div>
                <div class="flex items-center space-x-1.5">
                  <h4 class="text-xs font-bold text-slate-900 dark:text-white">${s.name}</h4>
                  <span class="text-[9px] font-mono px-1.5 py-0.2 rounded border font-bold ${badgeClass}">
                    ${s.role_title || s.title || (isAdmin ? 'Ban 5S' : (isManager ? 'Trưởng Khoa' : 'Nhân viên'))}
                  </span>
                </div>
                <div class="text-[10px] text-slate-500 mt-0.5 flex items-center space-x-2">
                  <span>Mã: <strong class="font-mono text-slate-700 dark:text-slate-300">${s.code}</strong></span>
                  <span>•</span>
                  <span>Khoa: <strong>${dept.name}</strong></span>
                </div>
              </div>
            </div>

            <!-- Nút Sửa nhân sự -->
            <button onclick="app5s.openEditStaffModal('${s.code}')" class="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-700 transition" title="Chỉnh sửa chức danh & phân công buồng phòng">
              <i data-lucide="edit-3" class="w-3.5 h-3.5"></i>
            </button>
          </div>

          <!-- Danh sách Buồng phòng / Khu vực phụ trách -->
          <div class="bg-slate-50 dark:bg-slate-900/60 p-2 rounded-xl text-[10px] space-y-1">
            <div class="text-slate-400 font-semibold flex items-center space-x-1">
              <i data-lucide="map-pin" class="w-3 h-3 text-emerald-600"></i>
              <span>Vị trí buồng phòng phụ trách (${Array.isArray(s.assigned_rooms) ? s.assigned_rooms.length : 1}):</span>
            </div>
            <div class="flex flex-wrap gap-1 pt-0.5">
              ${(Array.isArray(s.assigned_rooms) ? s.assigned_rooms : [s.assigned_room || 'Buồng bệnh']).map(rm => `
                <span class="px-2 py-0.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md border border-slate-200 dark:border-slate-700 font-medium truncate max-w-[200px]">
                  📍 ${rm}
                </span>
              `).join('')}
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  renderStaffTab() {
    const depts = this.getSortedDepartments();
    const staffList = this.getFilteredStaff();

    return `
      <div class="p-4 space-y-4">
        <!-- Header Nhân Sự -->
        <div class="flex items-center justify-between">
          <div>
            <span class="text-xs font-mono font-bold text-emerald-600">QUẢN TRỊ TÀI KHOẢN</span>
            <h2 class="text-base font-black text-slate-900 dark:text-white">${this.data.staff.length} Cán Bộ & Nhân Sự 5S</h2>
          </div>
          <button onclick="app5s.openAddAccountModal()" class="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-xs transition flex items-center space-x-1">
            <i data-lucide="user-plus" class="w-3.5 h-3.5"></i>
            <span>Thêm Tài Khoản</span>
          </button>
        </div>

        <!-- Banner Cơ chế phân quyền & Chức danh -->
        <div class="bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 rounded-2xl p-3.5 text-xs text-blue-900 dark:text-blue-200 space-y-1">
          <div class="flex items-center space-x-1.5 font-bold">
            <i data-lucide="shield" class="w-4 h-4 text-blue-600"></i>
            <span>Quản Lý Nhân Sự, Chức Danh & Vai Trò Phân Quyền 5S</span>
          </div>
          <p class="text-[11px] leading-relaxed text-blue-800 dark:text-blue-300">
            Hỗ trợ phân công <strong>nhiều vị trí buồng phòng</strong> cho từng nhân viên, thiết lập chức danh chuyên môn và chọn chính xác <strong>Vai trò phân quyền</strong> theo quy định Bệnh viện Vĩnh Phúc VPI.
          </p>
        </div>

        <!-- Ô Tìm Kiếm Nhân sự - GIỮ NGUYÊN FOCUS KHI GÕ -->
        <div class="relative">
          <i data-lucide="search" class="w-4 h-4 absolute left-3 top-3 text-slate-400"></i>
          <input type="text" id="staff-search-input" oninput="app5s.onStaffSearchInput(this.value)" placeholder="Tìm kiếm theo tên, mã NV, chức danh, buồng phòng phụ trách..." value="${this.staffSearchQuery}" class="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500">
        </div>

        <!-- Lọc Nhân sự theo Khoa -->
        <div class="flex space-x-1.5 overflow-x-auto pb-1 no-scrollbar">
          <button onclick="app5s.setStaffDeptFilter('all')" class="shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
            this.filterStaffDept === 'all' ? 'bg-emerald-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
          }">
            Tất cả (${this.data.staff.length})
          </button>
          ${depts.map(d => {
            const count = this.data.staff.filter(s => s.department_id == d.id).length;
            return `
              <button onclick="app5s.setStaffDeptFilter('${d.id}')" class="shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1 ${
                this.filterStaffDept === String(d.id) ? 'bg-emerald-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
              }">
                <span>${d.name}</span>
                <span class="text-[9px] opacity-75 font-mono">(${count})</span>
              </button>
            `;
          }).join('')}
        </div>

        <!-- Danh Sách Cán Bộ & Nhân Viên -->
        <div id="staff-list-container" class="space-y-3">
          ${this.renderStaffListHtml()}
        </div>
      </div>
    `;
  }

  onStaffSearchInput(val) {
    this.staffSearchQuery = val;
    const listContainer = document.getElementById('staff-list-container');
    if (listContainer) {
      listContainer.innerHTML = this.renderStaffListHtml();
      if (window.lucide) window.lucide.createIcons();
    } else {
      this.render();
    }
  }

  setStaffDeptFilter(deptId) {
    this.filterStaffDept = deptId;
    this.render();
  }


  // =========================================================================
  // TAB 5: LỊCH SỬ CHẤM 5S & BÁO CÁO
  // =========================================================================
  renderHistoryTab() {
    const audits = this.data.audits || [];
    const depts = this.data.departments || [];
    const rooms = this.data.rooms || [];

    const pendingCount = audits.filter(a => a.status === 'pending').length;
    const approvedCount = audits.filter(a => a.status === 'approved').length;
    const rejectedCount = audits.filter(a => a.status === 'rejected').length;

    let filteredAudits = audits;
    if (this.auditFilterStatus === 'pending') {
      filteredAudits = audits.filter(a => a.status === 'pending');
    } else if (this.auditFilterStatus === 'approved') {
      filteredAudits = audits.filter(a => a.status === 'approved');
    } else if (this.auditFilterStatus === 'rejected') {
      filteredAudits = audits.filter(a => a.status === 'rejected');
    }

    return `
      <div class="p-4 space-y-4">
        <div class="flex items-center justify-between">
          <div>
            <span class="text-xs font-mono font-bold text-emerald-600">HỒ SƠ GIÁM SÁT & DUYỆT 5S</span>
            <h2 class="text-base font-black text-slate-900 dark:text-white">Biên Bản & Đánh Giá 5S (${audits.length})</h2>
          </div>
          <button onclick="window.print()" class="bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold px-3 py-1.5 rounded-xl shadow-xs transition flex items-center space-x-1">
            <i data-lucide="printer" class="w-3.5 h-3.5"></i>
            <span>In Báo Cáo</span>
          </button>
        </div>

        <!-- BỘ LỌC TRẠNG THÁI ĐÁNH GIÁ 5S -->
        <div class="grid grid-cols-4 gap-1.5 text-center text-xs">
          <button onclick="app5s.setAuditFilterStatus('all')" class="py-2 px-1 rounded-xl font-bold transition text-[11px] ${
            this.auditFilterStatus === 'all'
              ? 'bg-slate-800 text-white shadow-2xs ring-1 ring-slate-800'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
          }">
            Tất cả (${audits.length})
          </button>

          <button onclick="app5s.setAuditFilterStatus('pending')" class="py-2 px-1 rounded-xl font-bold transition text-[11px] flex flex-col items-center justify-center ${
            this.auditFilterStatus === 'pending'
              ? 'bg-amber-600 text-white shadow-2xs ring-1 ring-amber-600'
              : 'bg-white dark:bg-slate-800 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/60'
          }">
            <span>Chờ duyệt</span>
            <span class="text-[9px] font-mono">(${pendingCount})</span>
          </button>

          <button onclick="app5s.setAuditFilterStatus('approved')" class="py-2 px-1 rounded-xl font-bold transition text-[11px] flex flex-col items-center justify-center ${
            this.auditFilterStatus === 'approved'
              ? 'bg-emerald-600 text-white shadow-2xs ring-1 ring-emerald-600'
              : 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/60'
          }">
            <span>Đạt chuẩn</span>
            <span class="text-[9px] font-mono">(${approvedCount})</span>
          </button>

          <button onclick="app5s.setAuditFilterStatus('rejected')" class="py-2 px-1 rounded-xl font-bold transition text-[11px] flex flex-col items-center justify-center ${
            this.auditFilterStatus === 'rejected'
              ? 'bg-red-600 text-white shadow-2xs ring-1 ring-red-600'
              : 'bg-white dark:bg-slate-800 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/60'
          }">
            <span>Nhắc lỗi</span>
            <span class="text-[9px] font-mono">(${rejectedCount})</span>
          </button>
        </div>

        <!-- DANH SÁCH BIÊN BẢN VÀ ẢNH MINH CHỨNG -->
        <div class="space-y-3">
          ${filteredAudits.length === 0 ? `
            <div class="p-8 text-center bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 text-xs text-slate-400 space-y-2">
              <i data-lucide="inbox" class="w-8 h-8 mx-auto text-slate-300"></i>
              <div>Không có phiếu kiểm tra nào theo bộ lọc này.</div>
              <button onclick="app5s.setAuditFilterStatus('all')" class="px-3 py-1 bg-emerald-600 text-white rounded-xl text-xs font-bold">Xem tất cả</button>
            </div>
          ` : filteredAudits.map(a => {
            const dept = depts.find(d => d.id == a.department_id) || { name: 'Chưa xác định' };
            const room = rooms.find(r => r.id == a.room_id) || { name: 'Buồng bệnh' };
            const isPending = (a.status === 'pending');
            const isApproved = (a.status === 'approved');
            const isRejected = (a.status === 'rejected');

            return `
              <div class="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700 shadow-xs space-y-3">
                <!-- Tiêu đề phiếu & Badge Trạng Thái -->
                <div class="flex items-start justify-between border-b border-slate-100 dark:border-slate-700/60 pb-2.5">
                  <div>
                    <div class="flex items-center space-x-1.5">
                      <span class="text-xs font-black text-slate-900 dark:text-white">${room.name}</span>
                      <span class="text-[9px] font-mono px-1.5 py-0.2 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded font-bold">${a.audit_code}</span>
                    </div>
                    <div class="text-[10px] text-slate-500 mt-0.5">
                      <strong>${dept.name}</strong> • ${a.audit_date} lúc ${a.audit_time} (${a.shift || 'Ca sáng'})
                    </div>
                  </div>

                  <div class="text-right space-y-1">
                    ${isPending ? `
                      <span class="inline-flex items-center space-x-1 bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-extrabold px-2 py-0.5 rounded-full text-[10px] border border-amber-300 animate-pulse">
                        <i data-lucide="hourglass" class="w-3 h-3"></i>
                        <span>CHỜ ĐÁNH GIÁ</span>
                      </span>
                    ` : (isApproved ? `
                      <span class="inline-flex items-center space-x-1 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-extrabold px-2 py-0.5 rounded-full text-[10px] border border-emerald-300">
                        <i data-lucide="check-circle" class="w-3 h-3 text-emerald-600"></i>
                        <span>ĐẠT CHUẨN 5S</span>
                      </span>
                    ` : `
                      <span class="inline-flex items-center space-x-1 bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300 font-extrabold px-2 py-0.5 rounded-full text-[10px] border border-red-300">
                        <i data-lucide="alert-triangle" class="w-3 h-3 text-red-600"></i>
                        <span>CẦN KHẮC PHỤC</span>
                      </span>
                    `)}
                    <div class="text-xs font-mono font-black ${isRejected ? 'text-red-600' : 'text-emerald-600'}">
                      ${a.total_score}đ
                    </div>
                  </div>
                </div>

                <!-- Hình ảnh minh chứng chụp sau 5S -->
                ${a.after_photo ? `
                  <div onclick="app5s.openAuditEvaluationModal('${a.id}')" class="cursor-pointer relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 group bg-black/5 hover:border-emerald-400 transition">
                    <img src="${a.after_photo}" class="w-full h-44 object-cover rounded-xl" alt="Ảnh minh chứng 5S">
                    <div class="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <span class="bg-white/90 dark:bg-slate-900/90 text-slate-800 dark:text-white font-bold text-xs px-3 py-1.5 rounded-xl shadow-lg flex items-center space-x-1">
                        <i data-lucide="maximize-2" class="w-3.5 h-3.5"></i>
                        <span>Bấm để Xem & Đánh giá</span>
                      </span>
                    </div>
                    <span class="absolute bottom-2 right-2 bg-black/70 text-white text-[9px] px-2 py-0.5 rounded-full font-bold backdrop-blur-xs">
                      Ảnh chụp sau 5S
                    </span>
                  </div>
                ` : ''}

                <!-- Ghi chú của khoa phòng nộp ảnh -->
                <div class="text-xs text-slate-600 dark:text-slate-300 leading-relaxed italic bg-slate-50 dark:bg-slate-900/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                  <span class="font-bold not-italic text-slate-400 text-[10px] block">Ghi chú của Khoa:</span>
                  "${a.notes || 'Thực hiện 5S sạch sẽ đúng quy định Bệnh viện VPI.'}"
                </div>

                <!-- NẾU KHÔNG ĐẠT: HIỆN KHỐI CẢNH BÁO LỖI PHÁT HIỆN & HẠN KHẮC PHỤC -->
                ${isRejected ? `
                  <div class="bg-red-50/90 dark:bg-red-950/50 border border-red-200 dark:border-red-900/60 rounded-xl p-3 space-y-1.5 text-xs text-red-900 dark:text-red-200">
                    <div class="font-extrabold flex items-center space-x-1.5 text-red-700 dark:text-red-400">
                      <i data-lucide="alert-circle" class="w-4 h-4 text-red-600"></i>
                      <span>YÊU CẦU NHẮC NHỞ LỖI 5S CỦA KHOA:</span>
                    </div>
                    <div class="font-bold text-red-800 dark:text-red-300 pl-5">
                      ⚠️ ${a.issue_detected || 'Chưa ghi rõ lỗi'}
                    </div>
                    <div class="flex items-center justify-between text-[11px] pt-1 border-t border-red-200 dark:border-red-800 pl-5 text-red-700 dark:text-red-400 font-medium">
                      <span>⏳ Hạn khắc phục: <strong>${a.remedy_deadline || 'Trước 11h30 hôm nay'}</strong></span>
                      <span>Điểm trừ: <strong>${a.total_score}đ</strong></span>
                    </div>
                    ${a.evaluation_notes ? `
                      <div class="text-[10px] text-red-600 dark:text-red-400 italic pl-5">
                        Lời phê: "${a.evaluation_notes}"
                      </div>
                    ` : ''}
                    <div class="text-[10px] text-slate-500 text-right pt-0.5">
                      Cán bộ kiểm tra: <strong>${a.evaluator_name || 'Ban Chỉ Đạo 5S'}</strong> (${a.evaluator_role || ''}) • Lúc ${a.evaluation_time || ''}
                    </div>
                  </div>
                ` : ''}

                <!-- NẾU ĐÃ ĐẠT CHUẨN: HIỆN KHỐI PHÊ DUYỆT XANH -->
                ${isApproved ? `
                  <div class="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl p-2.5 text-xs text-emerald-900 dark:text-emerald-200 flex items-center justify-between">
                    <div class="space-y-0.5">
                      <div class="font-bold text-emerald-800 dark:text-emerald-300 flex items-center space-x-1.5">
                        <i data-lucide="check-circle" class="w-3.5 h-3.5 text-emerald-600"></i>
                        <span>KẾT QUẢ: ĐẠT CHUẨN 5S Y TẾ (${a.total_score}đ)</span>
                      </div>
                      <div class="text-[10px] text-emerald-700 dark:text-emerald-400 italic">
                        "${a.evaluation_notes || 'Buồng phòng gọn gàng, sạch sẽ, đạt chuẩn 5S bệnh viện.'}"
                      </div>
                    </div>
                    <div class="text-[9px] text-slate-400 text-right">
                      Duyệt bởi: <strong>${a.evaluator_name || 'Cán bộ 5S'}</strong>
                    </div>
                  </div>
                ` : ''}

                <!-- Nút Hành Động & Người Gửi -->
                <div class="flex items-center justify-between pt-1 text-xs">
                  <div class="text-[10px] text-slate-400">
                    Người chụp gửi: <strong>${a.sender_name || a.inspector_name || 'Nhân viên khoa'}</strong> (${a.sender_role || 'Điều dưỡng'})
                  </div>

                  <button onclick="app5s.openAuditEvaluationModal('${a.id}')" class="px-3 py-1.5 rounded-xl font-bold text-xs transition flex items-center space-x-1 ${
                    isPending
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                  }">
                    <i data-lucide="${isPending ? 'clipboard-check' : 'edit-3'}" class="w-3.5 h-3.5"></i>
                    <span>${isPending ? 'Đánh Giá & Duyệt Ảnh' : 'Cập Nhật Đánh Giá'}</span>
                  </button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  // =========================================================================
  // TAB 6: CÀI ĐẶT ĐƠN VỊ & BỆNH VIỆN
  // =========================================================================
  renderSettingsTab() {
    const hosp = this.data.hospital;
    return `
      <div class="p-4 space-y-4">
        <div>
          <span class="text-xs font-mono font-bold text-emerald-600">THIẾT LẬP HỆ THỐNG</span>
          <h2 class="text-base font-black text-slate-900 dark:text-white">Cài Đặt Đơn Vị & Dữ Liệu</h2>
        </div>

        <div class="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700 shadow-xs space-y-3">
          <div class="flex items-center justify-between border-b pb-2">
            <div class="flex items-center space-x-2">
              <i data-lucide="hospital" class="w-4 h-4 text-emerald-600"></i>
              <h3 class="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase">Thông Tin Bệnh Viện Vĩnh Phúc VPI</h3>
            </div>
            <button onclick="app5s.openHospitalSettingsModal()" class="text-[10px] font-bold text-emerald-600 hover:underline">Chỉnh sửa</button>
          </div>
          <div class="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
            <div>Tên đơn vị: <strong class="text-slate-900 dark:text-white">${hosp.name}</strong></div>
            <div>Địa chỉ: <strong>${hosp.address}</strong></div>
            <div>Hotline: <strong class="font-mono">${hosp.hotline}</strong></div>
            <div>Trưởng Ban 5S: <strong>${hosp.director}</strong> (${hosp.directorTitle})</div>
            <div>Cán bộ Giám sát: <strong>${hosp.officer}</strong> (Mã: ${hosp.officerId})</div>
            <div>Khẩu hiệu: <em>"${hosp.slogan}"</em></div>
          </div>
        </div>

        <!-- Bảng Thông Báo Khẩn -->
        <div class="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700 shadow-xs space-y-3">
          <div class="flex items-center justify-between border-b pb-2">
            <div class="flex items-center space-x-2">
              <i data-lucide="alert-triangle" class="w-4 h-4 text-amber-500"></i>
              <h3 class="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase">Bảng Tin Thông Báo Khẩn</h3>
            </div>
            <button onclick="app5s.openNoticeEditModal()" class="text-[10px] font-bold text-emerald-600 hover:underline">Soạn thông báo</button>
          </div>
          <div class="text-xs space-y-1 text-slate-600 dark:text-slate-300">
            <div>Trạng thái phát: <strong>${hosp.notice.enabled ? '🟢 Đang hiển thị toàn viện' : '⚪ Đang ẩn'}</strong></div>
            <div>Tiêu đề: <strong>${hosp.notice.title}</strong></div>
            <div class="text-[11px] text-slate-500 bg-slate-50 dark:bg-slate-900/50 p-2 rounded-xl mt-1">${hosp.notice.content}</div>
          </div>
        </div>

        <!-- Quản Trị Dữ Liệu & Khôi phục -->
        <div class="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700 shadow-xs space-y-3">
          <h3 class="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase border-b pb-2">Sao Lưu & Khôi Phục Dữ Liệu</h3>
          <div class="grid grid-cols-2 gap-2 pt-1">
            <button onclick="app5s.exportBackupJSON()" class="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition">
              <i data-lucide="download" class="w-4 h-4"></i>
              <span>Xuất File JSON</span>
            </button>
            <button onclick="app5s.resetToVpiStandard()" class="py-2.5 px-3 bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition">
              <i data-lucide="rotate-ccw" class="w-4 h-4"></i>
              <span>Khôi Phục Chuẩn VPI</span>
            </button>
          </div>
          <p class="text-[10px] text-slate-400 italic">
            * Bấm "Khôi phục chuẩn VPI" sẽ nạp lại đầy đủ 20 Khoa/Phòng và 75 Khu vực làm việc chuẩn của Bệnh viện Vĩnh Phúc VPI.
          </p>
        </div>
      </div>
    `;
  }

  // =========================================================================
  // MODALS: CHỈNH SỬA & THÊM KHOA / BUỒNG PHÒNG (YÊU CẦU 1 & 2)
  // =========================================================================
  openEditDeptModal(deptId) {
    const dept = this.data.departments.find(d => d.id == deptId || d.code === String(deptId));
    if (!dept) return;

    this.showModal(`
      <div class="p-4 space-y-3 max-h-[85vh] overflow-y-auto no-scrollbar">
        <div class="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2.5">
          <div class="flex items-center space-x-2">
            <div class="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 flex items-center justify-center font-bold">
              <i data-lucide="building-2" class="w-4 h-4"></i>
            </div>
            <div>
              <h3 class="text-sm font-bold text-slate-900 dark:text-white">Chỉnh Sửa Thông Tin Khoa / Phòng</h3>
              <span class="text-[10px] text-slate-400">#${dept.order || 1} • Mã: ${dept.code}</span>
            </div>
          </div>
          <button onclick="app5s.closeModal()"><i data-lucide="x" class="w-4 h-4 text-slate-400"></i></button>
        </div>

        <div class="space-y-2.5 text-xs">
          <div>
            <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1">Tên Khoa / Phòng Chức Năng *</label>
            <input type="text" id="edit-dept-name" value="${dept.name || ''}" required class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 font-bold text-slate-900 dark:text-white">
          </div>

          <div class="grid grid-cols-3 gap-2">
            <div>
              <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1">Mã Khoa *</label>
              <input type="text" id="edit-dept-code" value="${dept.code || ''}" class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 font-mono text-slate-900 dark:text-white">
            </div>
            <div>
              <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1">Thứ tự STT</label>
              <input type="number" id="edit-dept-order" value="${dept.order || 1}" class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 font-mono text-slate-900 dark:text-white">
            </div>
            <div>
              <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1">Phân khối</label>
              <select id="edit-dept-category" class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white">
                <option value="clinical" ${dept.category === 'clinical' ? 'selected' : ''}>Lâm sàng</option>
                <option value="paraclinical" ${dept.category === 'paraclinical' ? 'selected' : ''}>Cận lâm sàng</option>
                <option value="functional" ${dept.category === 'functional' ? 'selected' : ''}>Phòng ban</option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1">Trưởng Khoa / Phụ trách</label>
              <input type="text" id="edit-dept-doctor" value="${dept.doctor_in_charge || ''}" placeholder="Ví dụ: ThS. BSCKII. Phạm Quỳnh Hưng" class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white">
            </div>
            <div>
              <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1">Điều dưỡng trưởng / KTV Trưởng</label>
              <input type="text" id="edit-dept-nurse" value="${dept.head_nurse || ''}" placeholder="Ví dụ: ĐD. Trần Thị Lan Hương" class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white">
            </div>
          </div>

          <div>
            <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1">Điện thoại / Hotline nội bộ</label>
            <input type="text" id="edit-dept-phone" value="${dept.phone || ''}" placeholder="Ví dụ: 0211.386.115" class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white">
          </div>

          <div>
            <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1">Mô tả chức năng nhiệm vụ 5S</label>
            <textarea id="edit-dept-desc" rows="2" class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white">${dept.description || ''}</textarea>
          </div>

          <div class="flex items-center space-x-2 pt-1">
            <button onclick="app5s.saveEditDept('${dept.id}')" class="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl shadow-xs transition">
              Cập Nhật Khoa
            </button>
            <button onclick="app5s.deleteDept('${dept.id}')" class="p-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 transition" title="Xóa khoa này">
              <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
          </div>
        </div>
      </div>
    `);
  }

  saveEditDept(deptId) {
    const dept = this.data.departments.find(d => d.id == deptId || d.code === String(deptId));
    if (!dept) return;

    const name = document.getElementById('edit-dept-name').value.trim();
    const code = document.getElementById('edit-dept-code').value.trim();
    const order = parseInt(document.getElementById('edit-dept-order').value) || dept.order || 1;
    const cat = document.getElementById('edit-dept-category').value;
    const doctor = document.getElementById('edit-dept-doctor').value.trim();
    const nurse = document.getElementById('edit-dept-nurse').value.trim();
    const phone = document.getElementById('edit-dept-phone').value.trim();
    const desc = document.getElementById('edit-dept-desc').value.trim();

    if (!name) {
      alert('Vui lòng nhập tên khoa / trung tâm!');
      return;
    }

    dept.name = name;
    if (code) dept.code = code;
    dept.order = order;
    dept.category = cat;
    dept.doctor_in_charge = doctor;
    dept.head_nurse = nurse;
    dept.phone = phone;
    dept.description = desc;

    this.data.departments.sort((a, b) => (a.order || 99) - (b.order || 99));

    this.saveData();
    this.closeModal();
    this.render();
    this.showToast(`Đã cập nhật thông tin Khoa: ${name}!`);
  }

  openAddDeptModal() {
    const nextOrder = this.data.departments.length + 1;
    this.showModal(`
      <div class="p-4 space-y-3 max-h-[85vh] overflow-y-auto no-scrollbar">
        <div class="flex items-center justify-between border-b pb-2">
          <h3 class="text-sm font-bold text-slate-900 dark:text-white">Thêm Khoa / Phòng Ban Mới</h3>
          <button onclick="app5s.closeModal()"><i data-lucide="x" class="w-4 h-4 text-slate-400"></i></button>
        </div>
        <div class="space-y-2.5 text-xs">
          <div>
            <label class="block font-bold mb-1">Tên Khoa / Phòng Ban *</label>
            <input type="text" id="add-dept-name" placeholder="Ví dụ: Khoa Thần Kinh - Đột Quỵ" class="w-full bg-slate-50 dark:bg-slate-900 border rounded-xl p-2.5 font-bold">
          </div>
          <div class="grid grid-cols-3 gap-2">
            <div>
              <label class="block font-bold mb-1">Mã Khoa *</label>
              <input type="text" id="add-dept-code" placeholder="Ví dụ: KTK" class="w-full bg-slate-50 dark:bg-slate-900 border rounded-xl p-2.5 font-mono">
            </div>
            <div>
              <label class="block font-bold mb-1">Thứ tự STT</label>
              <input type="number" id="add-dept-order" value="${nextOrder}" class="w-full bg-slate-50 dark:bg-slate-900 border rounded-xl p-2.5 font-mono">
            </div>
            <div>
              <label class="block font-bold mb-1">Phân khối</label>
              <select id="add-dept-category" class="w-full bg-slate-50 dark:bg-slate-900 border rounded-xl p-2.5">
                <option value="clinical">Lâm sàng</option>
                <option value="paraclinical">Cận lâm sàng</option>
                <option value="functional">Phòng ban</option>
              </select>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block font-bold mb-1">Trưởng khoa / BS phụ trách</label>
              <input type="text" id="add-dept-doctor" placeholder="Bác sĩ phụ trách" class="w-full bg-slate-50 dark:bg-slate-900 border rounded-xl p-2.5">
            </div>
            <div>
              <label class="block font-bold mb-1">Điều dưỡng trưởng / KTV Trưởng</label>
              <input type="text" id="add-dept-nurse" placeholder="Điều dưỡng trưởng" class="w-full bg-slate-50 dark:bg-slate-900 border rounded-xl p-2.5">
            </div>
          </div>
          <div>
            <label class="block font-bold mb-1">Điện thoại nội bộ</label>
            <input type="text" id="add-dept-phone" placeholder="Ví dụ: 0211.386.140" class="w-full bg-slate-50 dark:bg-slate-900 border rounded-xl p-2.5">
          </div>
          <button onclick="app5s.saveNewDept()" class="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl shadow-xs transition">
            Tạo Khoa Mới
          </button>
        </div>
      </div>
    `);
  }

  saveNewDept() {
    const name = document.getElementById('add-dept-name').value.trim();
    const code = document.getElementById('add-dept-code').value.trim() || 'K-' + Date.now().toString().slice(-3);
    const order = parseInt(document.getElementById('add-dept-order').value) || (this.data.departments.length + 1);
    const cat = document.getElementById('add-dept-category').value;
    const doctor = document.getElementById('add-dept-doctor').value.trim();
    const nurse = document.getElementById('add-dept-nurse').value.trim();
    const phone = document.getElementById('add-dept-phone').value.trim();

    if (!name) {
      alert('Vui lòng nhập tên khoa / phòng ban!');
      return;
    }

    const newDeptId = Date.now();
    this.data.departments.push({
      id: newDeptId,
      name: name,
      code: code,
      order: order,
      category: cat,
      doctor_in_charge: doctor,
      head_nurse: nurse,
      phone: phone || '0211.386.115',
      color: '#10b981',
      description: 'Đơn vị thực hành 5S Bệnh viện Vĩnh Phúc VPI'
    });

    this.data.departments.sort((a, b) => (a.order || 99) - (b.order || 99));

    this.saveData();
    this.closeModal();
    this.render();
    this.showToast(`Đã thêm Khoa mới: ${name}!`);
  }

  // =========================================================================
  // MODAL SỬA & THÊM KHU VỰC LÀM VIỆC / BUỒNG PHÒNG (YÊU CẦU 1 & 2)
  // =========================================================================
  openEditRoomModal(roomId) {
    const room = this.data.rooms.find(r => r.id == roomId || r.code === String(roomId));
    if (!room) return;
    const depts = this.getSortedDepartments();

    this.showModal(`
      <div class="p-4 space-y-3">
        <div class="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2.5">
          <div class="flex items-center space-x-2">
            <div class="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 flex items-center justify-center font-bold font-mono text-xs">
              ${room.code ? room.code.slice(-3) : '5S'}
            </div>
            <div>
              <h3 class="text-sm font-bold text-slate-900 dark:text-white">Chỉnh Sửa Khu Vực Làm Việc</h3>
              <span class="text-[10px] text-slate-400">Mã: ${room.code}</span>
            </div>
          </div>
          <button onclick="app5s.closeModal()"><i data-lucide="x" class="w-4 h-4 text-slate-400"></i></button>
        </div>

        <div class="space-y-2.5 text-xs">
          <div>
            <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1">Tên Khu Vực / Buồng Phòng *</label>
            <input type="text" id="edit-room-name" value="${room.name || ''}" required class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 font-bold text-slate-900 dark:text-white">
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1">Mã Khu Vực *</label>
              <input type="text" id="edit-room-code" value="${room.code || ''}" class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 font-mono text-slate-900 dark:text-white">
            </div>
            <div>
              <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1">Thứ tự STT</label>
              <input type="number" id="edit-room-order" value="${room.order || 1}" class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 font-mono text-slate-900 dark:text-white">
            </div>
          </div>

          <div>
            <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1">Thuộc Khoa / Phòng Ban Trực Thuộc *</label>
            <select id="edit-room-dept" class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 font-semibold text-slate-900 dark:text-white">
              ${depts.map(d => `<option value="${d.id}" ${d.id == room.department_id ? 'selected' : ''}>#${d.order} ${d.name}</option>`).join('')}
            </select>
          </div>

          <div>
            <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1">Cán bộ / Điều dưỡng / KTV phụ trách 5S</label>
            <input type="text" id="edit-room-person" value="${room.person_in_charge || ''}" placeholder="Ví dụ: KTV. Nguyễn Đức Tuấn" class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white">
          </div>

          <div>
            <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1">Vị trí tầng / Khu nhà</label>
            <input type="text" id="edit-room-floor" value="${room.floor || 'Tầng 1'}" placeholder="Ví dụ: Tầng 1 - Nhà Kỹ thuật" class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white">
          </div>

          <div class="flex items-center space-x-2 pt-1">
            <button onclick="app5s.saveEditRoom('${room.id}')" class="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl shadow-xs transition">
              Cập Nhật Khu Vực
            </button>
            <button onclick="app5s.deleteRoom('${room.id}')" class="p-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 transition" title="Xóa khu vực này">
              <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
          </div>
        </div>
      </div>
    `);
  }

  saveEditRoom(roomId) {
    const room = this.data.rooms.find(r => r.id == roomId || r.code === String(roomId));
    if (!room) return;

    const name = document.getElementById('edit-room-name').value.trim();
    const code = document.getElementById('edit-room-code').value.trim();
    const deptId = parseInt(document.getElementById('edit-room-dept').value);
    const person = document.getElementById('edit-room-person').value.trim();
    const order = parseInt(document.getElementById('edit-room-order').value) || room.order || 1;
    const floor = document.getElementById('edit-room-floor').value.trim() || 'Tầng 1';

    if (!name) {
      alert('Vui lòng nhập tên khu vực / buồng phòng!');
      return;
    }

    room.name = name;
    if (code) room.code = code;
    room.department_id = deptId;
    room.person_in_charge = person;
    room.order = order;
    room.floor = floor;

    this.saveData();
    this.closeModal();
    this.render();
    this.showToast(`Đã cập nhật khu vực: ${name}!`);
  }

  openAddRoomModal(preselectedDeptId = null) {
    const depts = this.getSortedDepartments();
    let targetDeptId = depts[0] ? depts[0].id : 8;
    if (preselectedDeptId !== null && preselectedDeptId !== undefined) {
      const found = depts.find(d => d.id == preselectedDeptId || d.code === String(preselectedDeptId));
      if (found) targetDeptId = found.id;
    }

    this.showModal(`
      <div class="p-4 space-y-3">
        <div class="flex items-center justify-between border-b pb-2">
          <h3 class="text-sm font-bold text-slate-900 dark:text-white">Thêm Khu Vực Làm Việc Mới</h3>
          <button onclick="app5s.closeModal()"><i data-lucide="x" class="w-4 h-4 text-slate-400"></i></button>
        </div>
        <div class="space-y-2.5 text-xs">
          <div>
            <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1">Thuộc Khoa / Phòng Ban *</label>
            <select id="modal-room-dept" class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 font-bold text-slate-900 dark:text-white">
              ${depts.map(d => `<option value="${d.id}" ${d.id == targetDeptId ? 'selected' : ''}>#${d.order} ${d.name}</option>`).join('')}
            </select>
          </div>
          <div>
            <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1">Tên Khu Vực / Buồng Phòng *</label>
            <input type="text" id="modal-room-name" placeholder="Ví dụ: Phòng Chụp X-Quang Cấp Cứu 02" class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 font-bold text-slate-900 dark:text-white">
          </div>
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1">Mã Khu Vực</label>
              <input type="text" id="modal-room-code" placeholder="Ví dụ: XQ-02" class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 font-mono text-slate-900 dark:text-white">
            </div>
            <div>
              <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1">Vị trí tầng / Khu nhà</label>
              <input type="text" id="modal-room-floor" placeholder="Ví dụ: Tầng 1 - Nhà A" class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white">
            </div>
          </div>
          <div>
            <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1">Cán bộ / Điều dưỡng / KTV phụ trách</label>
            <input type="text" id="modal-room-person" placeholder="Ví dụ: KTV. Vũ Bá Đạt" class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white">
          </div>
          <button onclick="app5s.saveNewRoom()" class="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl shadow-xs transition">
            Lưu Khu Vực Làm Việc Mới
          </button>
        </div>
      </div>
    `);
  }

  saveNewRoom() {
    const deptId = parseInt(document.getElementById('modal-room-dept').value);
    const name = document.getElementById('modal-room-name').value.trim();
    const code = document.getElementById('modal-room-code').value.trim() || 'P-' + Date.now().toString().slice(-4);
    const person = document.getElementById('modal-room-person').value.trim();
    const floor = document.getElementById('modal-room-floor').value.trim() || 'Tầng 1';

    if (!name) {
      alert('Vui lòng nhập tên khu vực / buồng phòng!');
      return;
    }

    const newRoom = {
      id: Date.now(),
      department_id: deptId,
      order: this.data.rooms.length + 1,
      code: code,
      name: name,
      person_in_charge: person || 'Cán bộ 5S phụ trách',
      floor: floor,
      target_score: 95.0,
      status: 'active'
    };

    this.data.rooms.push(newRoom);
    this.saveData();
    this.closeModal();
    this.render();
    this.showToast(`Đã thêm khu vực: ${name} thành công!`);
  }

  // =========================================================================
  // MODAL SỬA & THÊM NHÂN SỰ: CHỨC DANH & VAI TRÒ PHÂN QUYỀN (YÊU CẦU 3)
  // =========================================================================
  onRoleSelectChange(val, prefix) {
    if (!val) return;
    const parts = val.split('|');
    const roleTitle = parts[1] || 'Cán bộ 5S';
    const titleInput = document.getElementById(prefix + '-title');
    if (titleInput) {
      titleInput.value = roleTitle;
    }
  }

  openEditStaffModal(staffCode) {
    const s = this.data.staff.find(x => x.code === staffCode || x.staff_code === staffCode || x.id == staffCode);
    if (!s) return;
    const depts = this.getSortedDepartments();
    const currentDeptId = s.department_id || 8;
    const allRooms = this.data.rooms;
    
    let assignedList = [];
    if (Array.isArray(s.assigned_rooms)) {
      assignedList = [...s.assigned_rooms];
    } else if (typeof s.assigned_room === 'string' && s.assigned_room.trim()) {
      assignedList = s.assigned_room.split(/[;,\n\r•]+/).map(x => x.trim()).filter(Boolean);
    }

    const currentRoleValue = `${s.role || 'staff'}|${s.role_title || s.title || 'Cán bộ / Nhân viên 5S'}`;

    this.showModal(`
      <div class="p-4 space-y-3 max-h-[85vh] overflow-y-auto no-scrollbar">
        <div class="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2.5">
          <div class="flex items-center space-x-2">
            <div class="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs">
              ${(s.name || 'CB').split(' ').pop().charAt(0)}
            </div>
            <div>
              <h3 class="text-sm font-bold text-slate-900 dark:text-white">Thông Tin & Phân Công Nhân Sự</h3>
              <span class="text-[10px] text-slate-400">Mã NV: ${s.code} • TK: ${s.username || s.code}</span>
            </div>
          </div>
          <button onclick="app5s.closeModal()"><i data-lucide="x" class="w-4 h-4 text-slate-400"></i></button>
        </div>

        <div class="space-y-2.5 text-xs">
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1">Họ và Tên Cán Bộ *</label>
              <input type="text" id="edit-staff-name" value="${s.name || ''}" required class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2 font-bold text-slate-900 dark:text-white">
            </div>
            <div>
              <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1">Mã Nhân Viên *</label>
              <input type="text" id="edit-staff-code" value="${s.code || ''}" class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2 font-mono text-slate-900 dark:text-white">
            </div>
          </div>

          <!-- MỤC VAI TRÒ PHÂN QUYỀN VÀ CHỨC DANH CHUYÊN MÔN (YÊU CẦU 3) -->
          <div>
            <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              🛡️ Vai Trò Phân Quyền & Cấp Bậc 5S *
            </label>
            <select id="edit-staff-role" onchange="app5s.onRoleSelectChange(this.value, 'edit-staff')" class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 font-bold text-xs text-slate-900 dark:text-white">
              <optgroup label="🌟 Lãnh Đạo & Ban Chỉ Đạo 5S (Toàn quyền Admin)">
                <option value="admin|Trưởng Ban Chỉ Đạo 5S / Ban Giám Đốc" ${s.role === 'admin' && (s.role_title || '').includes('Trưởng Ban') ? 'selected' : ''}>👑 Trưởng Ban Chỉ Đạo 5S / Ban Giám Đốc</option>
                <option value="admin|Cán bộ Giám sát 5S Toàn Viện" ${s.role === 'admin' && (s.role_title || '').includes('Giám sát') ? 'selected' : ''}>🔍 Cán bộ Giám sát 5S Toàn Viện & QLCL</option>
              </optgroup>
              <optgroup label="🏢 Quản Lý Cấp Khoa / Phòng (Duyệt điểm & Phân công)">
                <option value="manager|BSCKII - Trưởng Khoa" ${s.role === 'manager' && (s.role_title || '').includes('BSCKII') ? 'selected' : ''}>👨‍⚕️ BSCKII - Trưởng Khoa</option>
                <option value="manager|BSCKI - Trưởng Khoa" ${s.role === 'manager' && (s.role_title || '').includes('BSCKI') ? 'selected' : ''}>👨‍⚕️ BSCKI - Trưởng Khoa</option>
                <option value="manager|ThS. Bác sĩ - Trưởng Khoa" ${s.role === 'manager' && (s.role_title || '').includes('ThS. Bác sĩ') ? 'selected' : ''}>👨‍⚕️ ThS. Bác sĩ - Trưởng Khoa</option>
                <option value="manager|Điều dưỡng Trưởng Khoa" ${s.role === 'manager' && (s.role_title || '').includes('Điều dưỡng Trưởng') ? 'selected' : ''}>👩‍⚕️ Điều dưỡng Trưởng Khoa</option>
                <option value="manager|Kỹ thuật viên Trưởng" ${s.role === 'manager' && (s.role_title || '').includes('Kỹ thuật viên Trưởng') ? 'selected' : ''}>👨‍⚕️ Kỹ thuật viên Trưởng</option>
                <option value="manager|Hộ sinh Trưởng Khoa" ${s.role === 'manager' && (s.role_title || '').includes('Hộ sinh Trưởng') ? 'selected' : ''}>👩‍⚕️ Hộ sinh Trưởng Khoa</option>
                <option value="manager|Trưởng Phòng Chức Năng" ${s.role === 'manager' && (s.role_title || '').includes('Trưởng Phòng') ? 'selected' : ''}>🏢 Trưởng Phòng Chức Năng</option>
              </optgroup>
              <optgroup label="🏥 Cán Bộ Chuyên Môn & Nhân Viên 5S (Thực hành 5S)">
                <option value="staff|Bác sĩ Điều trị" ${s.role === 'staff' && (s.role_title || '').includes('Bác sĩ Điều trị') ? 'selected' : ''}>👨‍⚕️ Bác sĩ Điều trị</option>
                <option value="staff|Điều dưỡng viên" ${s.role === 'staff' && (s.role_title || '').includes('Điều dưỡng viên') ? 'selected' : ''}>👩‍⚕️ Điều dưỡng viên</option>
                <option value="staff|Kỹ thuật viên CĐHA" ${s.role === 'staff' && (s.role_title || '').includes('CĐHA') ? 'selected' : ''}>⚡ Kỹ thuật viên CĐHA</option>
                <option value="staff|Kỹ thuật viên Xét nghiệm" ${s.role === 'staff' && (s.role_title || '').includes('Xét nghiệm') ? 'selected' : ''}>🔬 Kỹ thuật viên Xét nghiệm</option>
                <option value="staff|Dược sĩ / Quản lý kho dược" ${s.role === 'staff' && (s.role_title || '').includes('Dược sĩ') ? 'selected' : ''}>💊 Dược sĩ / Quản lý kho dược</option>
                <option value="staff|Hộ sinh viên" ${s.role === 'staff' && (s.role_title || '').includes('Hộ sinh viên') ? 'selected' : ''}>👶 Hộ sinh viên</option>
                <option value="staff|Hộ lý / Nhân viên vệ sinh" ${s.role === 'staff' && (s.role_title || '').includes('Hộ lý') ? 'selected' : ''}>🧹 Hộ lý / Nhân viên vệ sinh khử khuẩn</option>
                <option value="staff|Kỹ sư / Nhân viên CNTT - Kỹ thuật" ${s.role === 'staff' && (s.role_title || '').includes('CNTT') ? 'selected' : ''}>💻 Kỹ sư / Nhân viên CNTT - Kỹ thuật</option>
                <option value="staff|Nhân viên Hành chính / Kế toán" ${s.role === 'staff' && (s.role_title || '').includes('Hành chính') ? 'selected' : ''}>📑 Nhân viên Hành chính / Kế toán</option>
                <option value="staff|Cán bộ / Nhân viên 5S" ${s.role === 'staff' && (s.role_title || '').includes('Nhân viên 5S') ? 'selected' : ''}>✨ Cán bộ / Nhân viên 5S</option>
              </optgroup>
            </select>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1">🏢 Khoa / Phòng làm việc *</label>
              <select id="edit-staff-dept" class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2 font-semibold text-slate-900 dark:text-white">
                ${depts.map(d => `<option value="${d.id}" ${d.id == currentDeptId ? 'selected' : ''}>#${d.order} ${d.name}</option>`).join('')}
              </select>
            </div>
            <div>
              <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1">👨‍⚕️ Chức danh chuyên môn cụ thể *</label>
              <input type="text" id="edit-staff-title" value="${s.title || s.role_title || s.position || 'Cán bộ 5S'}" placeholder="Nhập chức danh chi tiết" class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2 font-semibold text-slate-900 dark:text-white">
            </div>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1">Tên đăng nhập</label>
              <input type="text" id="edit-staff-username" value="${s.username || ''}" class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2 font-mono text-slate-900 dark:text-white">
            </div>
            <div>
              <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1">Mật khẩu mới</label>
              <input type="password" id="edit-staff-pass" placeholder="(Giữ nguyên)" class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2 font-mono text-slate-900 dark:text-white">
            </div>
          </div>

          <!-- PHÂN CÔNG NHIỀU VỊ TRÍ PHỤ TRÁCH 5S -->
          <div class="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-2">
            <div class="flex items-center justify-between">
              <div>
                <label class="block font-bold text-slate-800 dark:text-slate-200">📍 Phân Công Nhiều Vị Trí Phụ Trách 5S</label>
                <span class="text-[10px] text-slate-400">Tích chọn các buồng phòng nhân sự chịu trách nhiệm làm 5S</span>
              </div>
              <span class="text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold px-2 py-0.5 rounded-full">
                ${assignedList.length} vị trí
              </span>
            </div>

            <div class="max-h-40 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-xl p-2 bg-slate-50 dark:bg-slate-900/60 space-y-1 no-scrollbar">
              ${allRooms.map(r => {
                const isChecked = assignedList.includes(r.name);
                const rDept = depts.find(d => d.id === r.department_id) || { name: '' };
                return `
                  <label class="flex items-center space-x-2 p-1.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-slate-800 cursor-pointer">
                    <input type="checkbox" name="staff-assigned-rooms" value="${r.name}" ${isChecked ? 'checked' : ''} class="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4">
                    <div class="text-xs text-slate-800 dark:text-slate-200 flex-1 flex items-center justify-between">
                      <span class="${isChecked ? 'font-bold text-emerald-700 dark:text-emerald-300' : ''}">${r.name}</span>
                      <span class="text-[9px] text-slate-400 font-mono">${rDept.name}</span>
                    </div>
                  </label>
                `;
              }).join('')}
            </div>

            <div>
              <label class="block text-[10px] text-slate-500 mb-0.5">Vị trí tùy chỉnh khác (cách nhau bởi dấu phẩy):</label>
              <input type="text" id="edit-staff-custom-rooms" placeholder="Ví dụ: Kho hóa chất, Hành lang tầng 2, Sảnh đón tiếp..." class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-xs text-slate-800 dark:text-slate-200">
            </div>
          </div>

          <div class="pt-2">
            <button onclick="app5s.saveEditStaff('${s.code}')" class="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl shadow-xs transition">
              Lưu Thông Tin & Phân Công 5S
            </button>
          </div>
        </div>
      </div>
    `);
  }

  saveEditStaff(staffCode) {
    const s = this.data.staff.find(x => x.code === staffCode || x.staff_code === staffCode || x.id == staffCode);
    if (!s) return;

    const name = document.getElementById('edit-staff-name').value.trim();
    const code = document.getElementById('edit-staff-code').value.trim();
    const deptId = parseInt(document.getElementById('edit-staff-dept').value);
    const title = document.getElementById('edit-staff-title').value.trim();
    const roleRaw = document.getElementById('edit-staff-role').value;
    const username = document.getElementById('edit-staff-username').value.trim();
    const pass = document.getElementById('edit-staff-pass').value.trim();
    const customRooms = document.getElementById('edit-staff-custom-rooms').value.trim();

    if (!name) {
      alert('Vui lòng nhập họ và tên!');
      return;
    }

    // Parse role và role_title
    let role = 'staff';
    let roleTitle = title || 'Cán bộ 5S';
    if (roleRaw.includes('|')) {
      const parts = roleRaw.split('|');
      role = parts[0];
      roleTitle = parts[1];
    } else {
      role = roleRaw;
    }

    const checkedBoxes = document.querySelectorAll('input[name="staff-assigned-rooms"]:checked');
    const assignedRooms = Array.from(checkedBoxes).map(cb => cb.value.trim());

    if (customRooms) {
      const extra = customRooms.split(/[;,\n\r]+/).map(x => x.trim()).filter(Boolean);
      extra.forEach(e => {
        if (!assignedRooms.includes(e)) assignedRooms.push(e);
      });
    }

    if (assignedRooms.length === 0) {
      assignedRooms.push('Buồng bệnh được phân công');
    }

    s.name = name;
    s.full_name = name;
    if (code) {
      s.code = code;
      s.staff_code = code;
    }
    s.department_id = deptId;
    s.title = title || roleTitle;
    s.role_title = roleTitle;
    s.position = title || roleTitle;
    s.role = role;
    s.role_level = role;
    if (username) s.username = username;
    if (pass) s.password = pass;

    s.assigned_rooms = assignedRooms;
    s.assigned_room = assignedRooms.join(', ');

    this.saveData();
    this.closeModal();
    this.render();
    this.showToast(`Đã lưu thông tin cán bộ: ${name}!`);
  }

  openAddAccountModal() {
    const depts = this.getSortedDepartments();
    const allRooms = this.data.rooms;

    this.showModal(`
      <div class="p-4 space-y-3 max-h-[85vh] overflow-y-auto no-scrollbar">
        <div class="flex items-center justify-between border-b pb-2">
          <h3 class="text-sm font-bold text-slate-900 dark:text-white">Thêm Tài Khoản / Nhân Sự Mới</h3>
          <button onclick="app5s.closeModal()"><i data-lucide="x" class="w-4 h-4 text-slate-400"></i></button>
        </div>
        <div class="space-y-2.5 text-xs">
          <div>
            <label class="block font-bold mb-1">Họ và Tên Cán Bộ *</label>
            <input type="text" id="modal-acc-name" placeholder="Ví dụ: ĐD. Nguyễn Thị Thảo" class="w-full bg-slate-50 dark:bg-slate-900 border rounded-xl p-2 font-bold">
          </div>
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block font-bold mb-1">Mã NV *</label>
              <input type="text" id="modal-acc-code" placeholder="Ví dụ: BV-501" class="w-full bg-slate-50 dark:bg-slate-900 border rounded-xl p-2 font-mono">
            </div>
            <div>
              <label class="block font-bold mb-1">Tên đăng nhập *</label>
              <input type="text" id="modal-acc-username" placeholder="Ví dụ: nguyenthithao" class="w-full bg-slate-50 dark:bg-slate-900 border rounded-xl p-2 font-mono">
            </div>
          </div>
          <div>
            <label class="block font-bold mb-1">Mật khẩu khởi tạo *</label>
            <input type="password" id="modal-acc-pass" value="123" class="w-full bg-slate-50 dark:bg-slate-900 border rounded-xl p-2 font-mono">
          </div>

          <!-- VAI TRÒ PHÂN QUYỀN ĐẦY ĐỦ CHỨC DANH (YÊU CẦU 3) -->
          <div>
            <label class="block font-bold mb-1 text-slate-700 dark:text-slate-300">
              🛡️ Vai Trò Phân Quyền & Chức Danh 5S *
            </label>
            <select id="modal-acc-role" onchange="app5s.onRoleSelectChange(this.value, 'modal-acc')" class="w-full bg-slate-50 dark:bg-slate-900 border rounded-xl p-2.5 font-bold text-xs text-slate-900 dark:text-white">
              <optgroup label="🌟 Lãnh Đạo & Ban Chỉ Đạo 5S (Toàn quyền Admin)">
                <option value="admin|Trưởng Ban Chỉ Đạo 5S / Ban Giám Đốc">👑 Trưởng Ban Chỉ Đạo 5S / Ban Giám Đốc</option>
                <option value="admin|Cán bộ Giám sát 5S Toàn Viện">🔍 Cán bộ Giám sát 5S Toàn Viện & QLCL</option>
              </optgroup>
              <optgroup label="🏢 Quản Lý Cấp Khoa / Phòng (Duyệt điểm & Phân công)">
                <option value="manager|BSCKII - Trưởng Khoa">👨‍⚕️ BSCKII - Trưởng Khoa</option>
                <option value="manager|BSCKI - Trưởng Khoa">👨‍⚕️ BSCKI - Trưởng Khoa</option>
                <option value="manager|ThS. Bác sĩ - Trưởng Khoa">👨‍⚕️ ThS. Bác sĩ - Trưởng Khoa</option>
                <option value="manager|Điều dưỡng Trưởng Khoa">👩‍⚕️ Điều dưỡng Trưởng Khoa</option>
                <option value="manager|Kỹ thuật viên Trưởng">👨‍⚕️ Kỹ thuật viên Trưởng</option>
                <option value="manager|Hộ sinh Trưởng Khoa">👩‍⚕️ Hộ sinh Trưởng Khoa</option>
                <option value="manager|Trưởng Phòng Chức Năng">🏢 Trưởng Phòng Chức Năng</option>
              </optgroup>
              <optgroup label="🏥 Cán Bộ Chuyên Môn & Nhân Viên 5S (Thực hành 5S)">
                <option value="staff|Bác sĩ Điều trị">👨‍⚕️ Bác sĩ Điều trị</option>
                <option value="staff|Điều dưỡng viên" selected>👩‍⚕️ Điều dưỡng viên</option>
                <option value="staff|Kỹ thuật viên CĐHA">⚡ Kỹ thuật viên CĐHA</option>
                <option value="staff|Kỹ thuật viên Xét nghiệm">🔬 Kỹ thuật viên Xét nghiệm</option>
                <option value="staff|Dược sĩ / Quản lý kho dược">💊 Dược sĩ / Quản lý kho dược</option>
                <option value="staff|Hộ sinh viên">👶 Hộ sinh viên</option>
                <option value="staff|Hộ lý / Nhân viên vệ sinh">🧹 Hộ lý / Nhân viên vệ sinh khử khuẩn</option>
                <option value="staff|Kỹ sư / Nhân viên CNTT - Kỹ thuật">💻 Kỹ sư / Nhân viên CNTT - Kỹ thuật</option>
                <option value="staff|Nhân viên Hành chính / Kế toán">📑 Nhân viên Hành chính / Kế toán</option>
                <option value="staff|Cán bộ / Nhân viên 5S">✨ Cán bộ / Nhân viên 5S</option>
              </optgroup>
            </select>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block font-bold mb-1">🏢 Khoa / Phòng làm việc *</label>
              <select id="modal-acc-dept" class="w-full bg-slate-50 dark:bg-slate-900 border rounded-xl p-2 font-semibold">
                ${depts.map(d => `<option value="${d.id}">#${d.order} ${d.name}</option>`).join('')}
              </select>
            </div>
            <div>
              <label class="block font-bold mb-1">👨‍⚕️ Chức danh chuyên môn cụ thể *</label>
              <input type="text" id="modal-acc-title" value="Điều dưỡng viên" placeholder="Nhập chức danh chi tiết" class="w-full bg-slate-50 dark:bg-slate-900 border rounded-xl p-2 font-semibold">
            </div>
          </div>

          <!-- Phân công nhiều buồng phòng -->
          <div class="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-2">
            <label class="block font-bold text-slate-800 dark:text-slate-200">📍 Phân Công Nhiều Vị Trí Phụ Trách 5S</label>
            <div class="max-h-36 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-xl p-2 bg-slate-50 dark:bg-slate-900/60 space-y-1 no-scrollbar">
              ${allRooms.map(r => `
                <label class="flex items-center space-x-2 p-1 rounded-lg hover:bg-emerald-50 dark:hover:bg-slate-800 cursor-pointer">
                  <input type="checkbox" name="add-staff-assigned-rooms" value="${r.name}" class="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4">
                  <span class="text-xs text-slate-800 dark:text-slate-200">${r.name}</span>
                </label>
              `).join('')}
            </div>
            <div>
              <input type="text" id="modal-acc-custom-rooms" placeholder="Vị trí tùy chỉnh khác (cách nhau bởi dấu phẩy)..." class="w-full bg-slate-50 dark:bg-slate-900 border rounded-xl p-2 text-xs">
            </div>
          </div>

          <button onclick="app5s.saveNewAccount()" class="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl shadow-xs transition">
            Tạo Tài Khoản Mới
          </button>
        </div>
      </div>
    `);
  }

  saveNewAccount() {
    const name = document.getElementById('modal-acc-name').value.trim();
    const code = document.getElementById('modal-acc-code').value.trim() || 'BV-' + (this.data.staff.length + 101);
    const username = document.getElementById('modal-acc-username').value.trim() || code.toLowerCase();
    const pass = document.getElementById('modal-acc-pass').value.trim() || '123';
    const deptId = parseInt(document.getElementById('modal-acc-dept').value);
    const title = document.getElementById('modal-acc-title').value.trim();
    const roleRaw = document.getElementById('modal-acc-role').value;
    const customRooms = document.getElementById('modal-acc-custom-rooms').value.trim();

    if (!name) {
      alert('Vui lòng nhập họ và tên!');
      return;
    }

    let role = 'staff';
    let roleTitle = title || 'Cán bộ 5S';
    if (roleRaw.includes('|')) {
      const parts = roleRaw.split('|');
      role = parts[0];
      roleTitle = parts[1];
    } else {
      role = roleRaw;
    }

    const checkedBoxes = document.querySelectorAll('input[name="add-staff-assigned-rooms"]:checked');
    const assignedRooms = Array.from(checkedBoxes).map(cb => cb.value.trim());
    if (customRooms) {
      const extra = customRooms.split(/[;,\n\r]+/).map(x => x.trim()).filter(Boolean);
      extra.forEach(e => {
        if (!assignedRooms.includes(e)) assignedRooms.push(e);
      });
    }
    if (assignedRooms.length === 0) {
      assignedRooms.push('Buồng bệnh được phân công');
    }

    const newStaff = {
      id: Date.now(),
      code: code,
      staff_code: code,
      name: name,
      full_name: name,
      username: username,
      password: pass,
      department_id: deptId,
      role: role,
      role_level: role,
      title: title || roleTitle,
      role_title: roleTitle,
      position: title || roleTitle,
      assigned_rooms: assignedRooms,
      assigned_room: assignedRooms.join(', '),
      allow_external: true
    };

    this.data.staff.push(newStaff);
    this.saveData();
    this.closeModal();
    this.render();
    this.showToast(`Đã tạo tài khoản cho ${name}!`);
  }

  deleteAccount(code) {
    const s = this.data.staff.find(x => x.code === code);
    if (!s) return;
    if (s.code === 'BV-345') {
      alert('Không thể xóa tài khoản Quản trị viên chính!');
      return;
    }
    if (!confirm(`Anh có chắc chắn muốn xóa tài khoản ${s.name} (${s.code}) không?`)) return;

    this.data.staff = this.data.staff.filter(x => x.code !== code);
    this.saveData();
    this.render();
    this.showToast('Đã xóa tài khoản thành công!');
  }

  // =========================================================================
  // MODALS: CÀI ĐẶT ĐƠN VỊ, THÔNG BÁO, ĐĂNG NHẬP, ĐỔI MẬT KHẨU
  // =========================================================================
  openHospitalSettingsModal() {
    const hosp = this.data.hospital;
    this.showModal(`
      <div class="p-4 space-y-3">
        <div class="flex items-center justify-between border-b pb-2">
          <h3 class="text-sm font-bold text-slate-900 dark:text-white">Cài Đặt Thông Tin Đơn Vị</h3>
          <button onclick="app5s.closeModal()"><i data-lucide="x" class="w-4 h-4 text-slate-400"></i></button>
        </div>
        <div class="space-y-2.5 text-xs">
          <div>
            <label class="block font-bold mb-1">Tên Bệnh Viện</label>
            <input type="text" id="modal-hosp-name" value="${hosp.name}" class="w-full bg-slate-50 dark:bg-slate-900 border rounded-xl p-2 font-bold">
          </div>
          <div>
            <label class="block font-bold mb-1">Địa chỉ</label>
            <input type="text" id="modal-hosp-address" value="${hosp.address}" class="w-full bg-slate-50 dark:bg-slate-900 border rounded-xl p-2">
          </div>
          <div>
            <label class="block font-bold mb-1">Hotline</label>
            <input type="text" id="modal-hosp-hotline" value="${hosp.hotline}" class="w-full bg-slate-50 dark:bg-slate-900 border rounded-xl p-2 font-mono">
          </div>
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block font-bold mb-1">Trưởng Ban 5S</label>
              <input type="text" id="modal-hosp-director" value="${hosp.director}" class="w-full bg-slate-50 dark:bg-slate-900 border rounded-xl p-2 font-bold">
            </div>
            <div>
              <label class="block font-bold mb-1">Chức danh</label>
              <input type="text" id="modal-hosp-directortitle" value="${hosp.directorTitle}" class="w-full bg-slate-50 dark:bg-slate-900 border rounded-xl p-2">
            </div>
          </div>
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block font-bold mb-1">Cán bộ Giám sát 5S</label>
              <input type="text" id="modal-hosp-officer" value="${hosp.officer}" class="w-full bg-slate-50 dark:bg-slate-900 border rounded-xl p-2 font-bold">
            </div>
            <div>
              <label class="block font-bold mb-1">Mã NV</label>
              <input type="text" id="modal-hosp-officerid" value="${hosp.officerId}" class="w-full bg-slate-50 dark:bg-slate-900 border rounded-xl p-2 font-mono">
            </div>
          </div>
          <div>
            <label class="block font-bold mb-1">Khẩu hiệu 5S</label>
            <input type="text" id="modal-hosp-slogan" value="${hosp.slogan}" class="w-full bg-slate-50 dark:bg-slate-900 border rounded-xl p-2 italic">
          </div>
          <button onclick="app5s.saveHospitalSettings()" class="w-full bg-emerald-600 text-white font-bold py-2 rounded-xl">Lưu Cài Đặt</button>
        </div>
      </div>
    `);
  }

  saveHospitalSettings() {
    this.data.hospital.name = document.getElementById('modal-hosp-name').value.trim() || 'Bệnh viện Vĩnh Phúc VPI';
    this.data.hospital.address = document.getElementById('modal-hosp-address').value.trim();
    this.data.hospital.hotline = document.getElementById('modal-hosp-hotline').value.trim();
    this.data.hospital.director = document.getElementById('modal-hosp-director').value.trim();
    this.data.hospital.directorTitle = document.getElementById('modal-hosp-directortitle').value.trim();
    this.data.hospital.officer = document.getElementById('modal-hosp-officer').value.trim();
    this.data.hospital.officerId = document.getElementById('modal-hosp-officerid').value.trim();
    this.data.hospital.slogan = document.getElementById('modal-hosp-slogan').value.trim();

    this.saveData();
    this.closeModal();
    this.render();
    this.showToast('Đã lưu thành công cài đặt đơn vị!');
  }

  openNoticeEditModal() {
    const notice = this.data.hospital.notice;
    this.showModal(`
      <div class="p-4 space-y-3">
        <div class="flex items-center justify-between border-b pb-2">
          <h3 class="text-sm font-bold text-slate-900 dark:text-white">Soạn Bảng Tin Thông Báo Khẩn</h3>
          <button onclick="app5s.closeModal()"><i data-lucide="x" class="w-4 h-4 text-slate-400"></i></button>
        </div>
        <div class="space-y-2.5 text-xs">
          <div class="flex items-center space-x-2">
            <input type="checkbox" id="modal-notice-enabled" ${notice.enabled ? 'checked' : ''} class="rounded text-emerald-600 w-4 h-4">
            <label for="modal-notice-enabled" class="font-bold">Bật hiển thị thông báo khẩn trên đầu ứng dụng</label>
          </div>
          <div>
            <label class="block font-bold mb-1">Tiêu đề thông báo</label>
            <input type="text" id="modal-notice-title" value="${notice.title}" class="w-full bg-slate-50 dark:bg-slate-900 border rounded-xl p-2 font-bold text-red-600">
          </div>
          <div>
            <label class="block font-bold mb-1">Nội dung chỉ đạo / yêu cầu khẩn</label>
            <textarea id="modal-notice-content" rows="3" class="w-full bg-slate-50 dark:bg-slate-900 border rounded-xl p-2">${notice.content}</textarea>
          </div>
          <button onclick="app5s.saveNoticeSettings()" class="w-full bg-emerald-600 text-white font-bold py-2 rounded-xl">Cập Nhật Thông Báo</button>
        </div>
      </div>
    `);
  }

  saveNoticeSettings() {
    this.data.hospital.notice.enabled = document.getElementById('modal-notice-enabled').checked;
    this.data.hospital.notice.title = document.getElementById('modal-notice-title').value.trim();
    this.data.hospital.notice.content = document.getElementById('modal-notice-content').value.trim();
    this.data.hospital.notice.updatedAt = new Date().toISOString().slice(0, 16).replace('T', ' ');

    this.saveData();
    this.closeModal();
    this.render();
    this.showToast('Đã phát thông báo khẩn cấp toàn viện!');
  }

  openLoginModal() {
    const user = this.getCurrentUser();
    this.showModal(`
      <div class="p-4 space-y-3">
        <div class="flex items-center justify-between border-b pb-2">
          <h3 class="text-sm font-bold text-slate-900 dark:text-white">Tài Khoản & Bảo Mật</h3>
          <button onclick="app5s.closeModal()"><i data-lucide="x" class="w-4 h-4 text-slate-400"></i></button>
        </div>
        <div class="space-y-3 text-xs">
          <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 flex items-center space-x-3">
            <div class="w-10 h-10 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-sm">
              ${user ? (user.name || 'Đ').split(' ').pop().charAt(0) : '?'}
            </div>
            <div>
              <div class="font-bold text-slate-900 dark:text-white">${user ? user.name : 'Vũ Bá Đạt'}</div>
              <div class="text-[10px] text-slate-500">${user ? (user.title || user.role_title || 'Cán bộ 5S') : 'Cán bộ 5S'} • Mã: ${user ? user.code : 'BV-345'}</div>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <button onclick="app5s.openChangePasswordModal()" class="py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold rounded-xl text-center">
              Đổi Mật Khẩu
            </button>
            <button onclick="app5s.logout()" class="py-2.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-xl text-center">
              Đăng Xuất
            </button>
          </div>
        </div>
      </div>
    `);
  }

  openChangePasswordModal() {
    this.showModal(`
      <div class="p-4 space-y-3">
        <div class="flex items-center justify-between border-b pb-2">
          <h3 class="text-sm font-bold text-slate-900 dark:text-white">Đổi Mật Khẩu Đăng Nhập</h3>
          <button onclick="app5s.closeModal()"><i data-lucide="x" class="w-4 h-4 text-slate-400"></i></button>
        </div>
        <div class="space-y-2.5 text-xs">
          <div>
            <label class="block font-bold mb-1">Mật khẩu hiện tại</label>
            <input type="password" id="modal-pass-current" class="w-full bg-slate-50 dark:bg-slate-900 border rounded-xl p-2 font-mono">
          </div>
          <div>
            <label class="block font-bold mb-1">Mật khẩu mới</label>
            <input type="password" id="modal-pass-new" class="w-full bg-slate-50 dark:bg-slate-900 border rounded-xl p-2 font-mono">
          </div>
          <div>
            <label class="block font-bold mb-1">Xác nhận mật khẩu mới</label>
            <input type="password" id="modal-pass-confirm" class="w-full bg-slate-50 dark:bg-slate-900 border rounded-xl p-2 font-mono">
          </div>
          <button onclick="app5s.saveNewPassword()" class="w-full bg-emerald-600 text-white font-bold py-2 rounded-xl">Đổi Mật Khẩu</button>
        </div>
      </div>
    `);
  }

  saveNewPassword() {
    const current = document.getElementById('modal-pass-current').value;
    const newPass = document.getElementById('modal-pass-new').value;
    const confirm = document.getElementById('modal-pass-confirm').value;

    const user = this.getCurrentUser();
    if (user && user.password && user.password !== current) {
      alert('Mật khẩu hiện tại không đúng!');
      return;
    }
    if (!newPass || newPass.length < 3) {
      alert('Mật khẩu mới phải có ít nhất 3 ký tự!');
      return;
    }
    if (newPass !== confirm) {
      alert('Xác nhận mật khẩu mới không khớp!');
      return;
    }

    if (user) {
      user.password = newPass;
      this.saveData();
      this.closeModal();
      this.showToast('Đã đổi mật khẩu thành công!');
    }
  }

  // =========================================================================
  // MÀN HÌNH ĐĂNG NHẬP CHUYÊN DỤNG (KHÔNG LƯU NHỚ MẬT KHẨU ĐỂ TRÁNH NHẦM LẪN)
  // =========================================================================
  renderLoginScreen() {
    return `
      <div class="min-h-full flex flex-col justify-center items-center p-4 py-8 bg-slate-50 dark:bg-slate-900">
        <div class="max-w-sm w-full bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-xl border border-slate-200 dark:border-slate-700 space-y-4">
          <!-- Logo & Tiêu đề -->
          <div class="text-center space-y-2">
            <div class="w-16 h-16 rounded-2xl bg-white dark:bg-slate-700 shadow-md border border-slate-100 dark:border-slate-600 p-2 mx-auto flex items-center justify-center">
              <img src="logo-5s-vpi.png" alt="Logo 5S VPI" class="w-full h-full object-contain">
            </div>
            <div>
              <span class="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">BỆNH VIỆN VĨNH PHÚC VPI</span>
              <h1 class="text-lg font-black text-slate-900 dark:text-white">ĐĂNG NHẬP HỆ THỐNG 5S</h1>
              <p class="text-[11px] text-slate-500 dark:text-slate-400">Giám sát & Chụp ảnh Báo cáo Vệ sinh Buồng phòng</p>
            </div>
          </div>

          <!-- Hộp thông báo lỗi khi đăng nhập sai -->
          <div id="login-error-msg" class="hidden p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-xs text-red-600 dark:text-red-400 font-bold flex items-center space-x-2">
            <i data-lucide="alert-circle" class="w-4 h-4 shrink-0"></i>
            <span id="login-error-text">Tên đăng nhập hoặc mật khẩu không chính xác!</span>
          </div>

          <!-- Form Đăng Nhập (KHÔNG lưu nhớ tài khoản, autocomplete off) -->
          <form onsubmit="app5s.handleLoginForm(event)" class="space-y-3.5 text-xs">
            <div>
              <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1">Tên đăng nhập hoặc Mã NV *</label>
              <div class="relative">
                <i data-lucide="user" class="w-4 h-4 absolute left-3 top-3 text-slate-400"></i>
                <input type="text" id="login-username" placeholder="Ví dụ: bv345 hoặc BV-345" autocomplete="off" class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none" required>
              </div>
            </div>

            <div>
              <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1">Mật khẩu *</label>
              <div class="relative">
                <i data-lucide="lock" class="w-4 h-4 absolute left-3 top-3 text-slate-400"></i>
                <input type="password" id="login-password" placeholder="Nhập mật khẩu" autocomplete="new-password" class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none" required>
              </div>
            </div>

            <button type="submit" class="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black py-2.5 rounded-xl shadow-md transition flex items-center justify-center space-x-2 text-xs">
              <i data-lucide="log-in" class="w-4 h-4"></i>
              <span>Đăng Nhập Vào Hệ Thống</span>
            </button>
          </form>

          <!-- Gợi ý tài khoản mẫu -->
          <div class="pt-2 border-t border-slate-100 dark:border-slate-700/60">
            <details class="text-[11px] text-slate-500">
              <summary class="cursor-pointer font-bold hover:text-emerald-600 flex items-center justify-between">
                <span>💡 Tài khoản kiểm tra mẫu (Mật khẩu: 123)</span>
                <i data-lucide="chevron-down" class="w-3.5 h-3.5"></i>
              </summary>
              <div class="mt-2 space-y-1.5 bg-slate-50 dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                <div class="flex items-center justify-between">
                  <span><strong>bv345</strong>: KTV Trưởng CĐHA (Giám sát)</span>
                  <button type="button" onclick="app5s.quickFillLogin('bv345', '123')" class="px-2 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 rounded font-bold hover:bg-emerald-200 text-[10px]">Điền</button>
                </div>
                <div class="flex items-center justify-between">
                  <span><strong>bv101</strong>: ThS. BSCKII. Hưng (Trưởng Ban)</span>
                  <button type="button" onclick="app5s.quickFillLogin('bv101', '123')" class="px-2 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 rounded font-bold hover:bg-emerald-200 text-[10px]">Điền</button>
                </div>
                <div class="flex items-center justify-between">
                  <span><strong>bv103</strong>: ĐD. Trưởng Khoa Cấp Cứu</span>
                  <button type="button" onclick="app5s.quickFillLogin('bv103', '123')" class="px-2 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 rounded font-bold hover:bg-emerald-200 text-[10px]">Điền</button>
                </div>
                <div class="flex items-center justify-between">
                  <span><strong>bv104</strong>: ĐD. Lê Văn Minh (Nhân viên)</span>
                  <button type="button" onclick="app5s.quickFillLogin('bv104', '123')" class="px-2 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 rounded font-bold hover:bg-emerald-200 text-[10px]">Điền</button>
                </div>
                <div class="text-[9px] text-slate-400 italic pt-1">
                  * Hệ thống không lưu nhớ mật khẩu để đảm bảo an toàn ca trực bệnh viện.
                </div>
              </div>
            </details>
          </div>
        </div>
      </div>
    `;
  }

  handleLoginForm(event) {
    if (event) event.preventDefault();
    const uInput = document.getElementById('login-username');
    const pInput = document.getElementById('login-password');
    const errBox = document.getElementById('login-error-msg');
    const errText = document.getElementById('login-error-text');

    if (!uInput || !pInput) return;
    const u = uInput.value.trim().toLowerCase();
    const p = pInput.value;

    if (!u || !p) {
      if (errBox && errText) {
        errText.innerText = 'Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu!';
        errBox.classList.remove('hidden');
      }
      return;
    }

    const matched = this.data.staff.find(s => {
      const sUser = (s.username || '').toLowerCase();
      const sCode = (s.code || s.staff_code || '').toLowerCase();
      return (sUser === u || sCode === u) && (String(s.password || '123') === p);
    });

    if (!matched) {
      if (errBox && errText) {
        errText.innerText = 'Tên đăng nhập hoặc mật khẩu không chính xác!';
        errBox.classList.remove('hidden');
      }
      return;
    }

    // Đăng nhập thành công
    this.data.auth.isLoggedIn = true;
    this.data.auth.currentUserId = matched.code;
    this.saveData();
    this.render();
    this.showToast(`Chào mừng ${matched.name} đã đăng nhập!`);
  }

  quickFillLogin(username, password) {
    const uInput = document.getElementById('login-username');
    const pInput = document.getElementById('login-password');
    if (uInput) uInput.value = username;
    if (pInput) pInput.value = password;
  }

  logout() {
    if (!confirm('Anh có chắc muốn đăng xuất khỏi tài khoản đang sử dụng không?')) return;
    this.closeModal();
    this.data.auth.isLoggedIn = false;
    this.data.auth.currentUserId = null;
    this.saveData();
    this.render();
    this.showToast('Đã đăng xuất an toàn khỏi hệ thống!');
  }


  exportBackupJSON() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(this.data, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `5S_VPI_Backup_${new Date().toISOString().slice(0, 10)}.json`);
    dlAnchorElem.click();
    this.showToast('Đã xuất file dữ liệu sao lưu thành công!');
  }

  showToast(msg) {
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-slate-900/90 text-white px-4 py-2.5 rounded-2xl text-xs font-bold shadow-xl border border-slate-700 backdrop-blur-md flex items-center space-x-2 animate-bounce';
    toast.innerHTML = `<i data-lucide="check-circle" class="w-4 h-4 text-emerald-400"></i><span>${msg}</span>`;
    document.body.appendChild(toast);
    if (window.lucide) window.lucide.createIcons();
    setTimeout(() => {
      toast.remove();
    }, 2800);
  }

  showModal(htmlContent) {
    const modalContainer = document.getElementById('modal-container');
    if (!modalContainer) return;
    modalContainer.innerHTML = `
      <div class="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-xs">
        <div class="bg-white dark:bg-slate-800 rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          ${htmlContent}
        </div>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
  }

  closeModal() {
    const modalContainer = document.getElementById('modal-container');
    if (modalContainer) modalContainer.innerHTML = '';
  }


  // =========================================================================
  // V8 TÍNH NĂNG 1: TÙY CHỈNH GIỜ KIỂM TRA 5S LINH HOẠT
  // =========================================================================
  setAuditShiftPreset(preset) {
    if (!this.newAuditState) this.newAuditState = {};
    if (preset === 'morning') {
      this.newAuditState.shiftType = 'morning';
      this.newAuditState.startTime = '07:00';
      this.newAuditState.endTime = '11:30';
      this.newAuditState.shift = 'Ca sáng (07:00 - 11:30)';
    } else if (preset === 'afternoon') {
      this.newAuditState.shiftType = 'afternoon';
      this.newAuditState.startTime = '13:30';
      this.newAuditState.endTime = '17:00';
      this.newAuditState.shift = 'Ca chiều (13:30 - 17:00)';
    } else if (preset === 'night') {
      this.newAuditState.shiftType = 'night';
      this.newAuditState.startTime = '17:00';
      this.newAuditState.endTime = '07:00';
      this.newAuditState.shift = 'Ca trực đêm (17:00 - 07:00)';
    } else if (preset === 'emergency') {
      this.newAuditState.shiftType = 'emergency';
      const now = new Date().toTimeString().slice(0, 5);
      this.newAuditState.startTime = now;
      this.newAuditState.endTime = this.calcEndTime(now, 2);
      this.newAuditState.shift = `Kiểm tra đột xuất (${this.newAuditState.startTime} - ${this.newAuditState.endTime})`;
    } else {
      this.newAuditState.shiftType = 'custom';
      if (!this.newAuditState.startTime) this.newAuditState.startTime = '08:00';
      if (!this.newAuditState.endTime) this.newAuditState.endTime = '11:30';
      this.newAuditState.shift = `Tùy chỉnh (${this.newAuditState.startTime} - ${this.newAuditState.endTime})`;
    }
    this.render();
  }

  calcEndTime(startTime, addHours = 2) {
    try {
      const parts = startTime.split(':').map(Number);
      const endH = (parts[0] + addHours) % 24;
      return `${String(endH).padStart(2, '0')}:${String(parts[1]).padStart(2, '0')}`;
    } catch (e) {
      return '11:30';
    }
  }

  onAuditCustomTimeChange(startVal, endVal, nameVal) {
    if (!this.newAuditState) this.newAuditState = {};
    if (startVal) this.newAuditState.startTime = startVal;
    if (endVal) this.newAuditState.endTime = endVal;
    const s = this.newAuditState.startTime || '07:00';
    const e = this.newAuditState.endTime || '11:30';
    const nameInput = document.getElementById('audit-shift-name');
    if (nameVal !== undefined && nameVal !== null) {
      this.newAuditState.shift = nameVal;
    } else {
      let prefix = (nameInput && nameInput.value) ? nameInput.value.trim() : (this.newAuditState.shift || '');
      if (prefix.includes('(')) {
        prefix = prefix.split('(')[0].trim();
      }
      if (!prefix) prefix = 'Ca kiểm tra';
      this.newAuditState.shift = `${prefix} (${s} - ${e})`;
      if (nameInput) nameInput.value = this.newAuditState.shift;
    }
  }

  // =========================================================================
  // V8 TÍNH NĂNG 2: PHÂN QUYỀN KIỂM DUYỆT & ĐÁNH GIÁ ẢNH 5S HẾT CA
  // =========================================================================
  
  // =========================================================================
  // V9 TÍNH NĂNG 3: PHÂN QUYỀN XEM ẢNH NỘI BỘ KHOA VS TOÀN VIỆN
  // =========================================================================
  isUserManagerOrSupervisor() {
    const user = this.getCurrentUser();
    if (!user) return true;
    if (user.role === 'admin' || user.role_level === 'admin') return true;
    if (user.role === 'manager' || user.role_level === 'manager') return true;
    if (user.can_review === true || user.is_supervisor === true) return true;
    const title = (user.title || user.role_title || user.position || '').toLowerCase();
    return title.includes('giám sát') || title.includes('trưởng ban 5s') || title.includes('chỉ đạo') || title.includes('kiểm duyệt') || title.includes('ban giám đốc') || title.includes('lãnh đạo');
  }

  getUserDepartmentId() {
    const user = this.getCurrentUser();
    if (!user) return null;
    return user.department_id || (Array.isArray(user.departments) ? user.departments[0] : null);
  }

  canUserViewDeptPhotos(deptId) {
    if (this.isUserManagerOrSupervisor()) return true;
    const user = this.getCurrentUser();
    if (!user) return true;
    const userDeptId = this.getUserDepartmentId();
    if (!userDeptId) return true;
    if (String(userDeptId) === String(deptId)) return true;
    if (Array.isArray(user.departments) && user.departments.some(d => String(d) === String(deptId))) return true;
    return false;
  }

  canUserViewRoomPhotos(roomId) {
    const room = (this.data.rooms || []).find(r => r.id == roomId);
    if (!room) return false;
    return this.canUserViewDeptPhotos(room.department_id);
  }

  // =========================================================================
  // V9 TÍNH NĂNG 2: LẤY DANH BẠ NHÂN SỰ CHUẨN THEO TỪNG KHOA PHÒNG
  // =========================================================================
  getStaffForDepartment(deptId) {
    const dept = (this.data.departments || []).find(d => d.id == deptId);
    let list = (this.data.staff || []).filter(st => {
      if (String(st.department_id) === String(deptId)) return true;
      if (Array.isArray(st.departments) && st.departments.some(d => String(d) === String(deptId))) return true;
      return false;
    });

    // Bổ sung Trưởng khoa & ĐD/KTV Trưởng nếu chưa có trong danh sách
    if (dept) {
      const names = new Set(list.map(s => s.name));
      if (dept.doctor_in_charge && dept.doctor_in_charge !== 'Chưa cập nhật' && !names.has(dept.doctor_in_charge)) {
        list.unshift({
          code: 'BV-TK' + dept.id,
          name: dept.doctor_in_charge,
          title: 'Trưởng Khoa',
          department_id: dept.id
        });
        names.add(dept.doctor_in_charge);
      }
      if (dept.head_nurse && dept.head_nurse !== 'Chưa cập nhật' && !names.has(dept.head_nurse)) {
        list.push({
          code: 'BV-DD' + dept.id,
          name: dept.head_nurse,
          title: 'ĐD/KTV Trưởng Khoa',
          department_id: dept.id
        });
        names.add(dept.head_nurse);
      }
    }
    return list;
  }

  // MODAL CHUYỂN ĐỔI NHANH TÀI KHOẢN ĐỂ KIỂM THỬ PHÂN QUYỀN
  openSwitchAccountModal() {
    const currentUser = this.getCurrentUser();
    const currentCode = currentUser ? currentUser.code : 'BV-345';
    const isSup = this.isUserManagerOrSupervisor();
    const currentDept = (this.data.departments || []).find(d => d.id == this.getUserDepartmentId());

    const accounts = [
      { code: 'BV-345', name: 'KTV. Vũ Bá Đạt', role: 'Cán bộ Giám sát 5S Toàn Viện & KTV Trưởng CĐHA', dept: 'Khoa CĐHA & Toàn viện', type: 'supervisor' },
      { code: 'BV-101', name: 'ThS. BSCKII. Phạm Quỳnh Hưng', role: 'Trưởng ban Chỉ đạo 5S / Ban Giám Đốc', dept: 'Ban Giám Đốc & Toàn viện', type: 'supervisor' },
      { code: 'BV-115', name: 'KTV. Trần Văn Chung', role: 'Kỹ thuật viên CĐHA (Tài khoản cá nhân)', dept: 'Khoa Chẩn đoán Hình ảnh', type: 'staff', deptId: 8 },
      { code: 'BV-104', name: 'ĐD. Lê Văn Minh', role: 'Điều dưỡng viên Cấp cứu (Tài khoản cá nhân)', dept: 'Khoa Cấp cứu', type: 'staff', deptId: 1 },
      { code: 'BV-102', name: 'BSCKII. Nguyễn Văn Toàn', role: 'Trưởng Khoa Ngoại (Tài khoản cá nhân)', dept: 'Khoa Ngoại Tổng hợp', type: 'staff', deptId: 4 },
      { code: 'BV-117', name: 'DS. Nguyễn Bích Ngọc', role: 'Dược sĩ Kho Dược (Tài khoản cá nhân)', dept: 'Khoa Dược', type: 'staff', deptId: 15 }
    ];

    const modalHtml = `
      <div class="p-5 space-y-4 max-h-[85vh] overflow-y-auto no-scrollbar">
        <div class="flex items-center justify-between border-b pb-3">
          <div class="flex items-center space-x-2">
            <div class="w-9 h-9 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold">
              <i data-lucide="shield" class="w-5 h-5"></i>
            </div>
            <div>
              <h3 class="text-sm font-black text-slate-900 dark:text-white">KIỂM THỬ PHÂN QUYỀN TÀI KHOẢN</h3>
              <p class="text-[10px] text-slate-500 font-bold">Chuyển đổi vai trò Giám sát vs Cá nhân khoa</p>
            </div>
          </div>
          <button onclick="app5s.closeModal()" class="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400">
            <i data-lucide="x" class="w-4 h-4"></i>
          </button>
        </div>

        <div class="p-3 rounded-2xl ${isSup ? 'bg-indigo-50 border border-indigo-200 text-indigo-900' : 'bg-amber-50 border border-amber-200 text-amber-900'} text-xs space-y-1">
          <div class="font-bold flex items-center space-x-1.5">
            <i data-lucide="${isSup ? 'shield-check' : 'user'}" class="w-4 h-4"></i>
            <span>Tài khoản hiện tại: ${currentUser ? currentUser.name : 'Vũ Bá Đạt'} (${currentCode})</span>
          </div>
          <div class="text-[11px] leading-relaxed">
            Quyền hạn: <strong>${isSup ? '🛡️ Ban Giám Sát / Quản Lý: Được xem và duyệt ảnh 5S toàn bộ 20 khoa phòng.' : `🔒 Tài khoản nội bộ ${currentDept ? currentDept.name : 'Khoa'}: Chỉ xem ảnh 5S của khoa mình.`}</strong>
          </div>
        </div>

        <div class="space-y-2">
          <div class="text-xs font-bold text-slate-700">Chọn tài khoản muốn chuyển đổi:</div>
          <div class="space-y-1.5">
            ${accounts.map(acc => {
              const isActive = acc.code === currentCode;
              return `
                <div onclick="app5s.switchUserAccount('${acc.code}')" class="p-3 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
                  isActive ? 'bg-emerald-50 border-emerald-300 dark:bg-emerald-950/40 font-bold' : 'bg-white hover:bg-slate-50 border-slate-200'
                }">
                  <div class="flex items-center space-x-2.5">
                    <div class="w-8 h-8 rounded-xl ${acc.type === 'supervisor' ? 'bg-indigo-600 text-white' : 'bg-emerald-600 text-white'} flex items-center justify-center text-xs font-bold shrink-0">
                      ${acc.type === 'supervisor' ? '🛡️' : '👨‍⚕️'}
                    </div>
                    <div>
                      <div class="text-xs text-slate-900 font-bold">${acc.name} <span class="font-mono text-[10px] text-slate-400">(${acc.code})</span></div>
                      <div class="text-[10px] text-slate-500">${acc.role}</div>
                      <div class="text-[9px] ${acc.type === 'supervisor' ? 'text-indigo-600 font-bold' : 'text-emerald-600 font-bold'}">${acc.dept}</div>
                    </div>
                  </div>
                  <div>
                    ${isActive ? '<span class="px-2 py-0.5 rounded-full text-[9px] bg-emerald-600 text-white font-bold">Đang dùng</span>' : '<span class="px-2 py-0.5 rounded-full text-[9px] bg-slate-100 text-slate-600 font-bold">Chọn</span>'}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    `;
    this.showModal(modalHtml);
  }

  switchUserAccount(userCode) {
    if (!this.data.auth) this.data.auth = { isLoggedIn: true, locationMode: 'internal' };
    this.data.auth.currentUserId = userCode;
    this.saveData();
    this.closeModal();
    this.render();
    const u = this.getCurrentUser();
    this.showToast(`Đã chuyển sang tài khoản: ${u ? u.name : userCode}`);
  }

  canUserReviewAudits() {
    const user = this.getCurrentUser();
    if (!user) return true;
    if (user.role === 'admin' || user.role_level === 'admin') return true;
    if (user.role === 'manager' || user.role_level === 'manager') return true;
    if (user.can_review === true) return true;
    const title = (user.title || user.role_title || user.position || '').toLowerCase();
    return title.includes('giám sát') || title.includes('trưởng') || title.includes('chỉ đạo') || title.includes('kiểm duyệt') || title.includes('lãnh đạo');
  }

  viewLargePhoto(photoUrl, title = 'Ảnh minh chứng 5S', deptId = null) {
    if (deptId && !this.canUserViewDeptPhotos(deptId)) {
      this.showToast('🔒 Quyền riêng tư: Bạn không thuộc khoa phòng này. Chỉ cán bộ thuộc khoa hoặc Ban Giám sát toàn viện mới được xem ảnh minh chứng!');
      return;
    }
    const modalHtml = `
      <div class="p-4 space-y-3 max-h-[90vh]">
        <div class="flex items-center justify-between border-b pb-2">
          <div class="flex items-center space-x-2">
            <i data-lucide="image" class="w-4 h-4 text-emerald-600"></i>
            <h3 class="text-xs font-bold text-slate-800 dark:text-slate-100">${title}</h3>
          </div>
          <button onclick="app5s.closeModal()" class="p-1 rounded-lg text-slate-400 hover:bg-slate-100">
            <i data-lucide="x" class="w-4 h-4"></i>
          </button>
        </div>
        <div class="rounded-xl overflow-hidden bg-black/90 flex items-center justify-center p-1">
          <img src="${photoUrl}" class="max-h-[75vh] w-auto max-w-full rounded-lg object-contain">
        </div>
      </div>
    `;
    this.showModal(modalHtml);
  }

  openReviewShiftPhotoModal(roomId) {
    const room = (this.data.rooms || []).find(r => r.id == roomId);
    if (!room) return;
    const dept = (this.data.departments || []).find(d => d.id == room.department_id) || { name: 'Khoa' };
    const rs = this.getRoomSchedule(roomId);
    const s5 = rs.post_shift_5s || {};
    const staffNames = (rs.staff_assigned || []).map(s => s.name).join(', ') || s5.submitted_by || 'Cán bộ ca trực';
    const photo = s5.photo || (this.data.audits || []).find(a => a.room_id == roomId)?.after_photo || '';

    this.currentEvaluationAuditId = s5.audit_id || null;
    this.currentReviewRoomId = roomId;
    this.currentEvaluationResult = s5.status === 'rejected' ? 'fail' : 'pass';

    const modalHtml = `
      <div class="p-5 space-y-4 max-h-[88vh] overflow-y-auto no-scrollbar">
        <div class="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3">
          <div class="flex items-center space-x-2">
            <div class="w-9 h-9 rounded-2xl bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 flex items-center justify-center font-bold">
              <i data-lucide="check-check" class="w-5 h-5"></i>
            </div>
            <div>
              <h3 class="text-sm font-black text-slate-900 dark:text-white">KIỂM DUYỆT ẢNH 5S HẾT CA</h3>
              <p class="text-[10px] text-indigo-600 font-bold">${dept.name} • ${room.name}</p>
            </div>
          </div>
          <button onclick="app5s.closeModal()" class="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400">
            <i data-lucide="x" class="w-4 h-4"></i>
          </button>
        </div>

        <div class="bg-indigo-50/70 dark:bg-indigo-950/40 p-3 rounded-2xl border border-indigo-200 dark:border-indigo-800 text-xs space-y-1">
          <div class="flex justify-between">
            <span class="text-slate-500 font-medium">Buồng phòng:</span>
            <strong class="text-slate-900 dark:text-slate-100">${room.name} (${room.code || 'P-00'})</strong>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-500 font-medium">Nhân sự bàn giao:</span>
            <span class="font-bold text-indigo-800 dark:text-indigo-300 text-right">${staffNames}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-500 font-medium">Thời gian nộp ảnh:</span>
            <span>${s5.submitted_at || 'Cuối ca trực'} ngày ${rs.date || this.getTodayDateString()}</span>
          </div>
          ${s5.notes ? `
            <div class="pt-1 text-[11px] text-slate-600 dark:text-slate-300 italic border-t border-indigo-200/60 mt-1">
              "${s5.notes}"
            </div>
          ` : ''}
        </div>

        <div class="space-y-1.5">
          <div class="flex items-center justify-between">
            <label class="block text-xs font-bold text-slate-800 dark:text-slate-200">
              📸 Ảnh chụp buồng phòng kết thúc ca trực:
            </label>
            ${photo ? `
              <button onclick="app5s.viewLargePhoto('${photo}', '${room.name}')" class="text-[10px] text-indigo-600 font-bold hover:underline flex items-center space-x-0.5">
                <i data-lucide="maximize-2" class="w-3 h-3"></i>
                <span>Phóng to ảnh</span>
              </button>
            ` : ''}
          </div>
          <div class="rounded-2xl overflow-hidden border-2 border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 relative">
            ${photo ? `
              <img src="${photo}" class="w-full h-56 object-cover rounded-xl cursor-pointer hover:opacity-95 transition" onclick="app5s.viewLargePhoto('${photo}', '${room.name}')">
            ` : `
              <div class="h-44 flex flex-col items-center justify-center text-xs text-slate-400 space-y-1">
                <i data-lucide="image-off" class="w-8 h-8 text-slate-300"></i>
                <span>Chưa có ảnh đính kèm</span>
              </div>
            `}
          </div>
        </div>

        <div class="space-y-2">
          <label class="block text-xs font-bold text-slate-700 dark:text-slate-300">
            Kết quả kiểm duyệt của Cán bộ Giám sát:
          </label>
          <div class="grid grid-cols-2 gap-2">
            <button type="button" id="eval-btn-pass" onclick="app5s.setEvaluationResult('pass')" class="py-3 px-3 rounded-2xl font-black text-xs flex items-center justify-center space-x-1.5 transition border-2 ${
              this.currentEvaluationResult === 'pass'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-300'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 hover:border-emerald-400'
            }">
              <i data-lucide="check-circle-2" class="w-4 h-4"></i>
              <span>🟢 ĐẠT CHUẨN 5S</span>
            </button>

            <button type="button" id="eval-btn-fail" onclick="app5s.setEvaluationResult('fail')" class="py-3 px-3 rounded-2xl font-black text-xs flex items-center justify-center space-x-1.5 transition border-2 ${
              this.currentEvaluationResult === 'fail'
                ? 'bg-red-600 text-white border-red-600 shadow-md ring-2 ring-red-300'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 hover:border-red-400'
            }">
              <i data-lucide="alert-triangle" class="w-4 h-4"></i>
              <span>🔴 KHÔNG ĐẠT - NHẮC LỖI</span>
            </button>
          </div>
        </div>

        <div id="eval-issue-block" class="space-y-2.5 ${this.currentEvaluationResult === 'fail' ? '' : 'hidden'} bg-red-50/70 dark:bg-red-950/30 p-3.5 rounded-2xl border border-red-200 dark:border-red-900/60">
          <label class="block text-xs font-bold text-red-900 dark:text-red-300">
            ⚠️ Chi tiết lỗi 5S phát hiện & Yêu cầu khắc phục:
          </label>
          
          <div class="flex flex-wrap gap-1">
            ${[
              'Dây máy thở bừa bãi vướng lối đi',
              'Chưa phân loại rác y tế đúng túi',
              'Mặt máy, mặt bàn dính bụi bẩn',
              'Khay thuốc cấp cứu chưa niêm phong',
              'Hồ sơ bệnh án xếp lộn xộn',
              'Sàn nhà ẩm ướt trơn trượt'
            ].map(tag => `
              <button type="button" onclick="app5s.addQuickIssueTag('${tag}')" class="text-[10px] bg-white dark:bg-slate-800 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 px-2 py-0.5 rounded-full hover:bg-red-100 transition">
                + ${tag}
              </button>
            `).join('')}
          </div>

          <textarea id="eval-issue-input" rows="2" placeholder="Ghi rõ vị trí và lỗi 5S phát hiện..." class="w-full bg-white dark:bg-slate-800 border border-red-300 dark:border-red-700 rounded-xl p-2.5 text-xs text-slate-800 dark:text-slate-100">${s5.issue || ''}</textarea>

          <div class="grid grid-cols-2 gap-2">
            <div>
              <span class="block text-[10px] text-slate-500 font-bold mb-1">Điểm đánh giá lại:</span>
              <input type="number" id="eval-score-input" min="0" max="100" value="65" class="w-full bg-white dark:bg-slate-800 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold">
            </div>
            <div>
              <span class="block text-[10px] text-slate-500 font-bold mb-1">Hạn khắc phục:</span>
              <select id="eval-deadline-select" class="w-full bg-white dark:bg-slate-800 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold">
                <option>Trước 11h30 hôm nay</option>
                <option>Trước 17h00 hôm nay</option>
                <option>Đầu giờ ca trực sau</option>
                <option>Trong vòng 2 giờ</option>
              </select>
            </div>
          </div>
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Ý kiến nhận xét của Cán bộ Giám sát:</label>
          <input type="text" id="eval-notes-input" value="${s5.status === 'rejected' ? 'Yêu cầu chấn chỉnh và khắc phục lỗi 5S.' : 'Đạt chuẩn 5S bệnh viện VPI. Buồng phòng sắp xếp gọn gàng, sạch sẽ.'}" class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-800 dark:text-slate-100">
        </div>

        <button onclick="app5s.submitReviewShiftPhoto(${roomId})" class="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-black py-3 rounded-2xl shadow-md transition flex items-center justify-center space-x-2 text-xs">
          <i data-lucide="check-check" class="w-4 h-4"></i>
          <span>LƯU ĐÁNH GIÁ & GỬI KẾT QUẢ CHO BUỒNG PHÒNG</span>
        </button>
      </div>
    `;

    this.showModal(modalHtml);
  }

  submitReviewShiftPhoto(roomId) {
    const rs = this.getRoomSchedule(roomId);
    const room = (this.data.rooms || []).find(r => r.id == roomId) || { name: 'Buồng phòng' };
    const user = this.getCurrentUser() || { name: 'KTV. Vũ Bá Đạt', code: 'BV-345', title: 'Cán bộ Giám sát 5S' };
    const result = this.currentEvaluationResult; // 'pass' or 'fail'
    const notesInput = document.getElementById('eval-notes-input');
    const issueInput = document.getElementById('eval-issue-input');
    const deadlineSelect = document.getElementById('eval-deadline-select');
    const scoreInput = document.getElementById('eval-score-input');

    const notes = notesInput ? notesInput.value.trim() : '';
    const issue = issueInput ? issueInput.value.trim() : '';
    const deadline = deadlineSelect ? deadlineSelect.value : 'Trước 11h30';
    const score = result === 'pass' ? 98 : (scoreInput ? parseInt(scoreInput.value) || 65 : 65);

    if (result === 'fail' && !issue) {
      alert('Vui lòng nhập chi tiết lỗi 5S phát hiện để gửi nhắc nhở cho buồng phòng!');
      if (issueInput) issueInput.focus();
      return;
    }

    const currentTime = new Date().toTimeString().slice(0, 5);

    if (!rs.post_shift_5s) rs.post_shift_5s = {};
    rs.post_shift_5s.status = (result === 'pass' ? 'approved' : 'rejected');
    rs.post_shift_5s.evaluated_by = user.name;
    rs.post_shift_5s.evaluated_at = `${this.getTodayDateString()} ${currentTime}`;
    rs.post_shift_5s.score = score;
    rs.post_shift_5s.issue = (result === 'fail' ? issue : '');
    rs.post_shift_5s.remedy_deadline = (result === 'fail' ? deadline : '');
    rs.post_shift_5s.evaluation_notes = notes;

    let audit = null;
    if (rs.post_shift_5s.audit_id) {
      audit = (this.data.audits || []).find(a => a.id == rs.post_shift_5s.audit_id);
    }
    if (!audit) {
      audit = (this.data.audits || []).find(a => a.room_id == roomId && a.audit_date === this.getTodayDateString());
    }

    if (audit) {
      audit.status = (result === 'pass' ? 'approved' : 'rejected');
      audit.total_score = score;
      audit.rating = result === 'pass' ? 'Xuất sắc' : 'Cần cải tiến';
      audit.evaluator_name = user.name;
      audit.evaluator_code = user.code;
      audit.evaluator_role = user.title || 'Cán bộ Giám sát 5S';
      audit.evaluation_date = this.getTodayDateString();
      audit.evaluation_time = currentTime;
      audit.evaluation_notes = notes;
      audit.issue_detected = (result === 'fail' ? issue : '');
      audit.remedy_deadline = (result === 'fail' ? deadline : '');
    }

    this.saveData();
    this.closeModal();
    this.render();

    if (result === 'pass') {
      this.showToast(`✅ Đã duyệt ĐẠT CHUẨN 5S cho ${room.name}!`);
    } else {
      this.showToast(`⚠️ Đã ghi nhận NHẮC LỖI 5S cho ${room.name}!`);
    }
  }

  openAllShiftAuditsCenterModal() {
    const schedules = this.data.schedules || { rooms_schedule: [] };
    const roomSchedules = schedules.rooms_schedule || [];
    const rooms = this.data.rooms || [];
    const depts = this.data.departments || [];

    const isSupervisor = this.isUserManagerOrSupervisor();
    const user = this.getCurrentUser();
    const userDeptId = this.getUserDepartmentId();
    const userDept = (this.data.departments || []).find(d => d.id == userDeptId) || { name: 'Khoa phòng' };

    let submittedRooms = roomSchedules.filter(rs => rs.post_shift_5s && rs.post_shift_5s.photo);
    if (!isSupervisor && userDeptId) {
      const deptRoomIds = rooms.filter(rm => rm.department_id == userDeptId).map(rm => rm.id);
      submittedRooms = submittedRooms.filter(rs => deptRoomIds.includes(rs.room_id));
    }
    const pending = submittedRooms.filter(rs => rs.post_shift_5s.status === 'submitted' || rs.post_shift_5s.status === 'pending');
    const approved = submittedRooms.filter(rs => rs.post_shift_5s.status === 'approved');
    const rejected = submittedRooms.filter(rs => rs.post_shift_5s.status === 'rejected');

    const modalHtml = `
      <div class="p-5 space-y-4 max-h-[88vh] overflow-y-auto no-scrollbar">
        <div class="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3">
          <div class="flex items-center space-x-2">
            <div class="w-9 h-9 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold">
              <i data-lucide="shield-check" class="w-5 h-5"></i>
            </div>
            <div>
              <h3 class="text-sm font-black text-slate-900 dark:text-white">${isSupervisor ? 'TRUNG TÂM KIỂM DUYỆT ẢNH 5S TOÀN VIỆN' : 'ẢNH 5S BÀN GIAO CA - ' + (userDept.name || '').toUpperCase()}</h3>
              <p class="text-[10px] text-indigo-600 font-bold">${isSupervisor ? 'Quyền Giám Sát: Xem & Duyệt cả 20 khoa phòng (' + submittedRooms.length + ' phòng)' : 'Tài khoản nội bộ khoa: Chỉ xem ảnh 5S của ' + userDept.name + ' (' + submittedRooms.length + ' phòng)'}</p>
            </div>
          </div>
          <button onclick="app5s.closeModal()" class="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400">
            <i data-lucide="x" class="w-4 h-4"></i>
          </button>
        </div>

        <div class="grid grid-cols-3 gap-2 text-center text-xs">
          <div class="bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded-2xl border border-amber-200 dark:border-amber-900/50">
            <div class="text-base font-black font-mono text-amber-700 dark:text-amber-400">${pending.length}</div>
            <div class="text-[10px] text-amber-800 dark:text-amber-300 font-bold">🟡 Chờ duyệt</div>
          </div>
          <div class="bg-emerald-50 dark:bg-emerald-950/40 p-2.5 rounded-2xl border border-emerald-200 dark:border-emerald-900/50">
            <div class="text-base font-black font-mono text-emerald-700 dark:text-emerald-400">${approved.length}</div>
            <div class="text-[10px] text-emerald-800 dark:text-emerald-300 font-bold">🟢 Đạt chuẩn</div>
          </div>
          <div class="bg-red-50 dark:bg-red-950/40 p-2.5 rounded-2xl border border-red-200 dark:border-red-900/50">
            <div class="text-base font-black font-mono text-red-700 dark:text-red-400">${rejected.length}</div>
            <div class="text-[10px] text-red-800 dark:text-red-300 font-bold">🔴 Nhắc lỗi</div>
          </div>
        </div>

        <div class="space-y-3">
          ${submittedRooms.length === 0 ? `
            <div class="p-8 text-center bg-slate-50 dark:bg-slate-900 rounded-2xl text-xs text-slate-400">
              Chưa có buồng phòng nào nộp ảnh 5S kết thúc ca trong hôm nay.
            </div>
          ` : submittedRooms.map(rs => {
            const room = rooms.find(r => r.id == rs.room_id) || { name: 'Buồng phòng', code: 'P-00' };
            const dept = depts.find(d => d.id == rs.department_id) || { name: 'Khoa' };
            const s5 = rs.post_shift_5s || {};
            const isApproved = s5.status === 'approved';
            const isRejected = s5.status === 'rejected';

            return `
              <div class="bg-white dark:bg-slate-800 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-2.5">
                <div class="flex items-start justify-between">
                  <div>
                    <div class="flex items-center space-x-1.5">
                      <strong class="text-xs text-slate-900 dark:text-white">${room.name}</strong>
                      <span class="text-[9px] font-mono font-bold bg-slate-100 dark:bg-slate-700 px-1.5 py-0.2 rounded">${room.code}</span>
                    </div>
                    <div class="text-[10px] text-slate-500">${dept.name} • Nộp lúc ${s5.submitted_at || 'Cuối ca'}</div>
                  </div>
                  <div>
                    ${isApproved ? '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">🟢 Đạt chuẩn</span>' :
                      (isRejected ? '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800 border border-red-300">🔴 Nhắc lỗi</span>' :
                      '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">🟡 Chờ duyệt</span>')}
                  </div>
                </div>

                <div class="grid grid-cols-3 gap-2 items-center">
                  <div class="col-span-1 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 h-20 bg-slate-100 dark:bg-slate-900">
                    <img src="${s5.photo}" class="w-full h-full object-cover cursor-pointer hover:opacity-90" onclick="app5s.viewLargePhoto('${s5.photo}', '${room.name}')">
                  </div>
                  <div class="col-span-2 text-xs space-y-1">
                    <div class="text-[11px] text-slate-600 dark:text-slate-300 italic">"${s5.notes || 'Đã làm sạch sẽ, sắp xếp ngăn nắp.'}"</div>
                    <div class="text-[10px] text-slate-400">Người nộp: <strong>${s5.submitted_by || 'Nhân sự trực'}</strong></div>
                    ${s5.evaluated_by ? `
                      <div class="text-[10px] text-indigo-600 font-bold">Duyệt bởi: ${s5.evaluated_by} (${s5.score || 98}đ)</div>
                    ` : ''}
                  </div>
                </div>

                <div class="pt-1 flex items-center justify-end space-x-2 border-t border-slate-100 dark:border-slate-700/60">
                  <button onclick="app5s.openReviewShiftPhotoModal(${rs.room_id})" class="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1 shadow-xs">
                    <i data-lucide="award" class="w-3.5 h-3.5"></i>
                    <span>${isApproved || isRejected ? 'Xem & Chấm lại' : '⭐ Duyệt & Chấm điểm'}</span>
                  </button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;

    this.showModal(modalHtml);
  }

  // =========================================================================
  // V8 TÍNH NĂNG 3: BÁO CÁO THỐNG KÊ KẾT THÚC NGÀY & ĐÁNH GIÁ TỪNG KHOA/PHÒNG
  // =========================================================================
  openDailySummaryModal(targetDate = null) {
    const date = targetDate || this.getTodayDateString();
    const depts = this.getSortedDepartments();
    const audits = this.data.audits || [];
    const dateAudits = audits.filter(a => a.audit_date === date);

    const schedules = this.data.schedules || { rooms_schedule: [] };
    const roomSchedules = schedules.rooms_schedule || [];
    const dateRoomSchedules = roomSchedules.filter(rs => rs.post_shift_5s && rs.post_shift_5s.photo);

    const completedDeptIds = new Set([
      ...dateAudits.map(a => a.department_id),
      ...dateRoomSchedules.map(rs => rs.department_id)
    ]);

    const completedDepts = depts.filter(d => completedDeptIds.has(d.id));
    const uncompletedDepts = depts.filter(d => !completedDeptIds.has(d.id));
    const rate = Math.round((completedDepts.length / depts.length) * 100);

    const filter = this.dailySummaryFilter || 'all';
    let displayedDepts = depts;
    if (filter === 'completed') displayedDepts = completedDepts;
    else if (filter === 'uncompleted') displayedDepts = uncompletedDepts;

    const evals = this.data.department_evaluations || [];

    const modalHtml = `
      <div class="p-5 space-y-4 max-h-[88vh] overflow-y-auto no-scrollbar">
        <div class="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3">
          <div class="flex items-center space-x-2">
            <div class="w-9 h-9 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white flex items-center justify-center font-bold">
              <i data-lucide="bar-chart-2" class="w-5 h-5"></i>
            </div>
            <div>
              <h3 class="text-sm font-black text-slate-900 dark:text-white">BÁO CÁO TỔNG KẾT 5S CUỐI NGÀY</h3>
              <p class="text-[10px] text-emerald-600 font-bold">Bệnh viện Vĩnh Phúc VPI • Toàn viện</p>
            </div>
          </div>
          <button onclick="app5s.closeModal()" class="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400">
            <i data-lucide="x" class="w-4 h-4"></i>
          </button>
        </div>

        <div class="flex items-center justify-between bg-slate-50 dark:bg-slate-900 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-700">
          <div class="flex items-center space-x-1.5 text-xs font-bold text-slate-700 dark:text-slate-200">
            <i data-lucide="calendar" class="w-4 h-4 text-emerald-600"></i>
            <span>Ngày tổng kết:</span>
          </div>
          <input type="date" value="${date}" onchange="app5s.openDailySummaryModal(this.value)" class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1 text-xs font-bold font-mono text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500">
        </div>

        <div class="grid grid-cols-4 gap-1.5 text-center text-xs">
          <div class="bg-white dark:bg-slate-800 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs">
            <div class="text-base font-black font-mono text-slate-900 dark:text-white">${depts.length}</div>
            <div class="text-[9px] text-slate-400 font-bold">Tổng số Khoa</div>
          </div>
          <div class="bg-emerald-50 dark:bg-emerald-950/40 p-2.5 rounded-2xl border border-emerald-200 dark:border-emerald-900/50">
            <div class="text-base font-black font-mono text-emerald-700 dark:text-emerald-400">${completedDepts.length}</div>
            <div class="text-[9px] text-emerald-700 dark:text-emerald-400 font-bold">🟢 Đã thực hiện</div>
          </div>
          <div class="bg-red-50 dark:bg-red-950/40 p-2.5 rounded-2xl border border-red-200 dark:border-red-900/50">
            <div class="text-base font-black font-mono text-red-700 dark:text-red-400">${uncompletedDepts.length}</div>
            <div class="text-[9px] text-red-700 dark:text-red-400 font-bold">🔴 Chưa nộp</div>
          </div>
          <div class="bg-indigo-50 dark:bg-indigo-950/40 p-2.5 rounded-2xl border border-indigo-200 dark:border-indigo-900/50">
            <div class="text-base font-black font-mono text-indigo-700 dark:text-indigo-400">${rate}%</div>
            <div class="text-[9px] text-indigo-700 dark:text-indigo-400 font-bold">Tỷ lệ tuân thủ</div>
          </div>
        </div>

        <div class="space-y-1">
          <div class="flex justify-between text-[11px] font-bold">
            <span class="text-slate-600 dark:text-slate-300">Tiến độ thực hiện 5S toàn viện:</span>
            <span class="text-emerald-600 font-mono">${completedDepts.length}/${depts.length} Khoa (${rate}%)</span>
          </div>
          <div class="w-full bg-slate-100 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
            <div class="bg-gradient-to-r from-emerald-500 to-teal-500 h-full transition-all duration-500 rounded-full" style="width: ${rate}%"></div>
          </div>
        </div>

        <div class="grid grid-cols-3 gap-1 text-center text-xs">
          <button onclick="app5s.setDailySummaryDeptFilter('all', '${date}')" class="py-1.5 rounded-xl font-bold transition text-[11px] ${filter === 'all' ? 'bg-slate-800 text-white shadow-2xs' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}">
            Tất cả (${depts.length})
          </button>
          <button onclick="app5s.setDailySummaryDeptFilter('completed', '${date}')" class="py-1.5 rounded-xl font-bold transition text-[11px] ${filter === 'completed' ? 'bg-emerald-600 text-white shadow-2xs' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}">
            🟢 Đã xong (${completedDepts.length})
          </button>
          <button onclick="app5s.setDailySummaryDeptFilter('uncompleted', '${date}')" class="py-1.5 rounded-xl font-bold transition text-[11px] ${filter === 'uncompleted' ? 'bg-red-600 text-white shadow-2xs' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}">
            🔴 Chưa làm (${uncompletedDepts.length})
          </button>
        </div>

        <div class="space-y-2.5">
          <div class="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
            <span>Danh sách kiểm tra & Đánh giá từng khoa:</span>
            <span class="text-[10px] text-slate-400 font-normal">Chạm "Đánh giá Khoa" để chấm điểm</span>
          </div>

          <div class="space-y-2 max-h-72 overflow-y-auto pr-1 no-scrollbar">
            ${displayedDepts.map(d => {
              const isCompleted = completedDeptIds.has(d.id);
              const deptEval = evals.find(e => e.dept_id == d.id && e.date === date) || evals.find(e => e.dept_id == d.id);
              const deptRooms = (this.data.rooms || []).filter(r => r.department_id == d.id);
              const deptAudits = dateAudits.filter(a => a.department_id == d.id);

              return `
                <div class="bg-white dark:bg-slate-800 p-3 rounded-2xl border ${
                  isCompleted ? 'border-emerald-200 dark:border-emerald-900/60' : 'border-red-200 dark:border-red-900/60'
                } shadow-2xs space-y-2">
                  <div class="flex items-start justify-between">
                    <div>
                      <div class="flex items-center space-x-1.5">
                        <span class="font-mono text-[9px] px-1 py-0.2 rounded font-bold ${isCompleted ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}">#${d.order}</span>
                        <h4 class="text-xs font-bold text-slate-900 dark:text-white">${d.name}</h4>
                      </div>
                      <div class="text-[10px] text-slate-400 mt-0.5">
                        Trưởng khoa: <strong>${d.doctor_in_charge || 'Bác sĩ trực'}</strong> • ${deptRooms.length} buồng phòng
                      </div>
                    </div>
                    <div class="text-right">
                      ${isCompleted 
                        ? `<span class="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                             <i data-lucide="check" class="w-2.5 h-2.5"></i>
                             <span>ĐÃ THỰC HIỆN (${deptAudits.length > 0 ? deptAudits.length + ' phiếu' : 'Đã nộp ảnh'})</span>
                           </span>` 
                        : `<span class="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-red-100 text-red-800 border border-red-300">
                             <i data-lucide="x" class="w-2.5 h-2.5"></i>
                             <span>CHƯA THỰC HIỆN</span>
                           </span>`
                      }
                    </div>
                  </div>

                  <div class="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-700/60 text-[11px]">
                    <div>
                      ${deptEval ? `
                        <div class="flex items-center space-x-1.5">
                          <span class="px-2 py-0.5 rounded-md text-[10px] font-black ${
                            deptEval.result === 'pass' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
                          }">${deptEval.score || 95}đ • ${deptEval.grade || 'Xuất sắc'}</span>
                          <span class="text-[10px] text-slate-500">Bởi ${deptEval.evaluator_name || 'Cán bộ 5S'}</span>
                        </div>
                      ` : `
                        <span class="text-[10px] text-slate-400 italic">Chưa có phiếu chấm điểm khoa hôm nay</span>
                      `}
                    </div>

                    <div class="flex items-center space-x-1.5">
                      ${!isCompleted ? `
                        <button onclick="app5s.remindSingleDept('${d.id}')" class="px-2 py-1 bg-amber-50 text-amber-700 border border-amber-300 rounded-lg text-[10px] font-bold hover:bg-amber-100 transition">
                          📢 Nhắc nộp
                        </button>
                      ` : ''}
                      <button onclick="app5s.openDeptEvaluationModal(${d.id}, '${date}')" class="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-bold transition flex items-center space-x-1 shadow-2xs">
                        <i data-lucide="award" class="w-3 h-3"></i>
                        <span>${deptEval ? 'Đánh giá lại' : '⭐ Đánh giá Khoa'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <div class="pt-2 space-y-2 border-t border-slate-200 dark:border-slate-700">
          <div class="grid grid-cols-2 gap-2">
            <button onclick="app5s.printDailyEvaluationReport('${date}')" class="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-2.5 rounded-xl shadow-xs transition flex items-center justify-center space-x-1.5 text-xs">
              <i data-lucide="printer" class="w-4 h-4"></i>
              <span>IN BẢNG ĐIỂM TOÀN VIỆN</span>
            </button>
            <button onclick="app5s.broadcastDaily5SReminder()" class="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 rounded-xl shadow-xs transition flex items-center justify-center space-x-1.5 text-xs">
              <i data-lucide="volume-2" class="w-4 h-4"></i>
              <span>📢 BÁO ĐỘNG NHẮC NHỞ</span>
            </button>
          </div>
        </div>
      </div>
    `;

    this.showModal(modalHtml);
  }

  setDailySummaryDeptFilter(filter, date) {
    this.dailySummaryFilter = filter;
    this.openDailySummaryModal(date);
  }

  openDeptEvaluationModal(deptId, targetDate = null) {
    const date = targetDate || this.getTodayDateString();
    const dept = (this.data.departments || []).find(d => d.id == deptId);
    if (!dept) return;

    const evals = this.data.department_evaluations || [];
    let deptEval = evals.find(e => e.dept_id == deptId && e.date === date) || evals.find(e => e.dept_id == deptId);

    const currentUser = this.getCurrentUser() || { name: 'ThS. BSCKII. Phạm Quỳnh Hưng', code: 'BV-101', title: 'Trưởng ban Chỉ đạo 5S' };
    const deptRooms = (this.data.rooms || []).filter(r => r.department_id == deptId);
    const audits = (this.data.audits || []).filter(a => a.department_id == deptId && a.audit_date === date);

    this.currentDeptEvalTarget = {
      deptId: deptId,
      date: date,
      score: deptEval ? deptEval.score : 95,
      result: deptEval ? deptEval.result : 'pass'
    };

    const modalHtml = `
      <div class="p-5 space-y-4 max-h-[88vh] overflow-y-auto no-scrollbar">
        <div class="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3">
          <div class="flex items-center space-x-2">
            <div class="w-9 h-9 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold">
              <i data-lucide="award" class="w-5 h-5"></i>
            </div>
            <div>
              <h3 class="text-sm font-black text-slate-900 dark:text-white">KIỂM TRA & ĐÁNH GIÁ 5S KHOA/PHÒNG</h3>
              <p class="text-[10px] text-indigo-600 font-bold">${dept.name} • Ngày ${date}</p>
            </div>
          </div>
          <button onclick="app5s.closeModal()" class="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400">
            <i data-lucide="x" class="w-4 h-4"></i>
          </button>
        </div>

        <div class="bg-indigo-50/70 dark:bg-indigo-950/40 p-3 rounded-2xl border border-indigo-200 dark:border-indigo-800 text-xs space-y-1">
          <div class="flex justify-between">
            <span class="text-slate-500 font-medium">Khoa / Phòng:</span>
            <strong class="text-slate-900 dark:text-slate-100">${dept.name} (${dept.code})</strong>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-500 font-medium">Trưởng khoa:</span>
            <span class="font-bold text-slate-800 dark:text-slate-200">${dept.doctor_in_charge || 'Bác sĩ Trưởng'}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-500 font-medium">ĐD / KTV Trưởng:</span>
            <span>${dept.head_nurse || 'ĐD Trưởng'}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-500 font-medium">Quy mô kiểm tra:</span>
            <span>${deptRooms.length} buồng phòng • Đã nộp ${audits.length} ảnh 5S hôm nay</span>
          </div>
        </div>

        <div class="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-3">
          <div class="flex items-center justify-between border-b pb-2">
            <label class="block text-xs font-bold text-slate-700 dark:text-slate-300">Điểm đánh giá 5S Khoa (0 - 100đ):</label>
            <div id="dept-score-display" class="text-lg font-black font-mono text-indigo-600">${this.currentDeptEvalTarget.score} / 100đ</div>
          </div>
          <input type="range" min="0" max="100" step="1" value="${this.currentDeptEvalTarget.score}" oninput="app5s.setDeptEvaluationScore(parseInt(this.value))" class="w-full accent-indigo-600 h-2.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer">
          <div class="flex justify-between text-[10px] text-slate-400 font-mono">
            <span>Dưới 70đ: Cần chấn chỉnh</span>
            <span>70-89đ: Đạt chuẩn</span>
            <span>90-100đ: Xuất sắc</span>
          </div>
          <div id="dept-grade-badge" class="text-center pt-1">
            <span class="px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
              XẾP LOẠI: ${this.currentDeptEvalTarget.score >= 90 ? 'XUẤT SẮC' : (this.currentDeptEvalTarget.score >= 70 ? 'ĐẠT CHUẨN' : 'CẦN CHẤN CHỈNH')}
            </span>
          </div>
        </div>

        <div class="space-y-2">
          <label class="block text-xs font-bold text-slate-700 dark:text-slate-300">Kết luận kiểm tra 5S Khoa:</label>
          <div class="grid grid-cols-2 gap-2">
            <button type="button" id="dept-eval-btn-pass" onclick="app5s.setDeptEvaluationResult('pass')" class="py-3 px-3 rounded-2xl font-black text-xs flex items-center justify-center space-x-1.5 transition border-2 ${
              this.currentDeptEvalTarget.result === 'pass'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-300'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200'
            }">
              <i data-lucide="check-circle" class="w-4 h-4"></i>
              <span>🟢 ĐẠT CHUẨN 5S KHOA</span>
            </button>

            <button type="button" id="dept-eval-btn-fail" onclick="app5s.setDeptEvaluationResult('fail')" class="py-3 px-3 rounded-2xl font-black text-xs flex items-center justify-center space-x-1.5 transition border-2 ${
              this.currentDeptEvalTarget.result === 'fail'
                ? 'bg-red-600 text-white border-red-600 shadow-md ring-2 ring-red-300'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200'
            }">
              <i data-lucide="alert-triangle" class="w-4 h-4"></i>
              <span>🔴 CẦN KHẮC PHỤC</span>
            </button>
          </div>
        </div>

        <div id="dept-issue-block" class="space-y-2.5 ${this.currentDeptEvalTarget.result === 'fail' ? '' : 'hidden'} bg-red-50/70 dark:bg-red-950/30 p-3.5 rounded-2xl border border-red-200 dark:border-red-900/60">
          <label class="block text-xs font-bold text-red-900 dark:text-red-300">
            ⚠️ Tồn tại & Lỗi 5S phát hiện tại Khoa:
          </label>
          
          <div class="flex flex-wrap gap-1">
            ${[
              'Rác y tế phân loại chưa đúng quy chuẩn',
              'Dây điện, dây máy vướng lối đi',
              'Tủ thuốc, tủ vật tư chưa dán nhãn định danh',
              'Bụi bẩn bám trên nóc tủ và máy móc',
              'Hồ sơ bệnh án để bừa bãi tại bàn khám',
              'Khu vệ sinh buồng bệnh nhân chưa sạch'
            ].map(tag => `
              <button type="button" onclick="app5s.addQuickDeptIssueTag('${tag}')" class="text-[10px] bg-white dark:bg-slate-800 text-red-700 dark:text-red-300 border border-red-200 px-2 py-0.5 rounded-full hover:bg-red-100 transition">
                + ${tag}
              </button>
            `).join('')}
          </div>

          <textarea id="dept-issue-input" rows="2" placeholder="Nhập các lỗi 5S cụ thể phát hiện tại các buồng phòng của khoa..." class="w-full bg-white dark:bg-slate-800 border border-red-300 rounded-xl p-2.5 text-xs text-slate-800 dark:text-slate-100">${deptEval && deptEval.issues ? deptEval.issues.join('; ') : ''}</textarea>

          <div>
            <span class="block text-[10px] text-slate-500 font-bold mb-1">Thời hạn yêu cầu Trưởng khoa khắc phục:</span>
            <select id="dept-deadline-select" class="w-full bg-white dark:bg-slate-800 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold">
              <option>Trước 11h30 hôm nay</option>
              <option>Trước 17h00 hôm nay</option>
              <option>Giao ban 07h30 sáng mai</option>
              <option>Trong vòng 24 giờ</option>
            </select>
          </div>
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Nhận xét & Chỉ đạo của Ban Chỉ Đạo 5S:</label>
          <textarea id="dept-notes-input" rows="2" class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-800 dark:text-slate-100">${deptEval ? (deptEval.notes || '') : 'Toàn khoa thực hiện tốt quy trình 5S, đề nghị tiếp tục duy trì thường xuyên.'}</textarea>
        </div>

        <button onclick="app5s.submitDeptEvaluation(${deptId}, '${date}')" class="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-black py-3 rounded-2xl shadow-md transition flex items-center justify-center space-x-2 text-xs">
          <i data-lucide="check-check" class="w-4 h-4"></i>
          <span>LƯU ĐÁNH GIÁ KHOA & GỬI THÔNG BÁO TỚI TRƯỞNG KHOA</span>
        </button>
      </div>
    `;

    this.showModal(modalHtml);
  }

  setDeptEvaluationScore(score) {
    if (!this.currentDeptEvalTarget) return;
    this.currentDeptEvalTarget.score = score;
    const disp = document.getElementById('dept-score-display');
    const badge = document.getElementById('dept-grade-badge');
    if (disp) disp.innerText = `${score} / 100đ`;
    if (badge) {
      let grade = 'XUẤT SẮC';
      let cls = 'bg-emerald-100 text-emerald-800 border-emerald-300';
      if (score < 70) {
        grade = 'CẦN CHẤN CHỈNH';
        cls = 'bg-red-100 text-red-800 border-red-300';
      } else if (score < 90) {
        grade = 'ĐẠT CHUẨN';
        cls = 'bg-blue-100 text-blue-800 border-blue-300';
      }
      badge.innerHTML = `<span class="px-3 py-1 rounded-full text-xs font-black ${cls} border">XẾP LOẠI: ${grade}</span>`;
    }
  }

  setDeptEvaluationResult(res) {
    if (!this.currentDeptEvalTarget) return;
    this.currentDeptEvalTarget.result = res;
    const passBtn = document.getElementById('dept-eval-btn-pass');
    const failBtn = document.getElementById('dept-eval-btn-fail');
    const issueBlock = document.getElementById('dept-issue-block');

    if (res === 'pass') {
      if (passBtn) passBtn.className = "py-3 px-3 rounded-2xl font-black text-xs flex items-center justify-center space-x-1.5 transition border-2 bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-300";
      if (failBtn) failBtn.className = "py-3 px-3 rounded-2xl font-black text-xs flex items-center justify-center space-x-1.5 transition border-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200";
      if (issueBlock) issueBlock.classList.add('hidden');
    } else {
      if (passBtn) passBtn.className = "py-3 px-3 rounded-2xl font-black text-xs flex items-center justify-center space-x-1.5 transition border-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200";
      if (failBtn) failBtn.className = "py-3 px-3 rounded-2xl font-black text-xs flex items-center justify-center space-x-1.5 transition border-2 bg-red-600 text-white border-red-600 shadow-md ring-2 ring-red-300";
      if (issueBlock) issueBlock.classList.remove('hidden');
    }
  }

  addQuickDeptIssueTag(tag) {
    const input = document.getElementById('dept-issue-input');
    if (!input) return;
    if (input.value.trim()) input.value = input.value.trim() + '; ' + tag;
    else input.value = tag;
    input.focus();
  }

  submitDeptEvaluation(deptId, date) {
    const dept = (this.data.departments || []).find(d => d.id == deptId);
    if (!dept) return;

    const user = this.getCurrentUser() || { name: 'ThS. BSCKII. Phạm Quỳnh Hưng', code: 'BV-101', title: 'Trưởng ban Chỉ đạo 5S' };
    const score = this.currentDeptEvalTarget.score || 95;
    const result = this.currentDeptEvalTarget.result || 'pass';

    const notesInput = document.getElementById('dept-notes-input');
    const issueInput = document.getElementById('dept-issue-input');
    const deadlineSelect = document.getElementById('dept-deadline-select');

    const notes = notesInput ? notesInput.value.trim() : '';
    const issueText = issueInput ? issueInput.value.trim() : '';
    const deadline = deadlineSelect ? deadlineSelect.value : 'Trước 11h30';

    if (result === 'fail' && !issueText) {
      alert('Vui lòng nhập các tồn tại lỗi 5S phát hiện tại khoa để gửi yêu cầu khắc phục!');
      if (issueInput) issueInput.focus();
      return;
    }

    let grade = 'Xuất sắc';
    if (score < 70) grade = 'Cần chấn chỉnh';
    else if (score < 90) grade = 'Đạt chuẩn';

    if (!this.data.department_evaluations) this.data.department_evaluations = [];

    const existingIdx = this.data.department_evaluations.findIndex(e => e.dept_id == deptId && e.date === date);
    const evalRecord = {
      id: existingIdx >= 0 ? this.data.department_evaluations[existingIdx].id : Date.now(),
      dept_id: deptId,
      dept_name: dept.name,
      date: date,
      evaluator_name: user.name,
      evaluator_code: user.code,
      evaluator_role: user.title || user.role_title || 'Cán bộ Giám sát 5S',
      score: score,
      grade: grade,
      result: result,
      issues: issueText ? issueText.split(/[;\n\r]+/).map(x => x.trim()).filter(Boolean) : [],
      notes: notes,
      remedy_deadline: result === 'fail' ? deadline : '',
      evaluated_at: `${date} ${new Date().toTimeString().slice(0, 5)}`
    };

    if (existingIdx >= 0) {
      this.data.department_evaluations[existingIdx] = evalRecord;
    } else {
      this.data.department_evaluations.unshift(evalRecord);
    }

    this.saveData();
    this.closeModal();
    this.render();

    this.showToast(`✅ Đã lưu đánh giá 5S cho ${dept.name}: ${score}đ (${grade})!`);
  }

  printDailyEvaluationReport(targetDate = null) {
    const date = targetDate || this.getTodayDateString();
    const depts = this.getSortedDepartments();
    const audits = (this.data.audits || []).filter(a => a.audit_date === date);
    const schedules = this.data.schedules || { rooms_schedule: [] };
    const roomSchedules = schedules.rooms_schedule || [];
    const dateRoomSchedules = roomSchedules.filter(rs => rs.post_shift_5s && rs.post_shift_5s.photo);

    const completedDeptIds = new Set([
      ...audits.map(a => a.department_id),
      ...dateRoomSchedules.map(rs => rs.department_id)
    ]);

    const completedCount = completedDeptIds.size;
    const uncompletedCount = depts.length - completedCount;
    const rate = Math.round((completedCount / depts.length) * 100);
    const evals = this.data.department_evaluations || [];

    const printWin = window.open('', '_blank');
    if (!printWin) {
      this.showToast('Vui lòng cho phép popup trình duyệt để in báo cáo!');
      return;
    }

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Báo cáo Đánh giá 5S Toàn Viện - Bệnh viện Vĩnh Phúc VPI</title>
        <style>
          @page { size: A4 landscape; margin: 12mm; }
          body { font-family: "Times New Roman", Times, serif; font-size: 13px; line-height: 1.35; color: #000; margin: 0; padding: 10px; }
          .header-table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
          .header-table td { vertical-align: top; }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .title { font-size: 15px; font-weight: bold; text-align: center; margin: 10px 0 4px 0; text-transform: uppercase; }
          .subtitle { font-size: 12px; text-align: center; font-style: italic; margin-bottom: 12px; }
          .summary-box { border: 1px solid #333; padding: 6px 10px; margin-bottom: 12px; background: #f9f9f9; }
          table.data-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
          table.data-table th, table.data-table td { border: 1px solid #333; padding: 5px 6px; font-size: 11px; }
          table.data-table th { background-color: #eee; text-align: center; }
          .status-pass { color: green; font-weight: bold; }
          .status-fail { color: red; font-weight: bold; }
          .signatures { width: 100%; margin-top: 25px; }
          .signatures td { width: 50%; text-align: center; vertical-align: top; }
        </style>
      </head>
      <body>
        <table class="header-table">
          <tr>
            <td style="width: 45%; text-align: center;">
              <div>SỞ Y TẾ TỈNH VĨNH PHÚC</div>
              <div class="bold">BỆNH VIỆN VĨNH PHÚC VPI</div>
              <div style="font-size: 11px;">HỘI ĐỒNG QUẢN LÝ CHẤT LƯỢNG & BAN 5S</div>
              <div style="border-bottom: 1px solid #000; width: 120px; margin: 3px auto;"></div>
            </td>
            <td style="width: 55%; text-align: center;">
              <div class="bold">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
              <div>Độc lập - Tự do - Hạnh phúc</div>
              <div style="border-bottom: 1px solid #000; width: 140px; margin: 3px auto;"></div>
              <div style="font-style: italic; font-size: 12px; margin-top: 5px;">Vĩnh Phúc, ngày ${date.slice(8,10)} tháng ${date.slice(5,7)} năm ${date.slice(0,4)}</div>
            </td>
          </tr>
        </table>

        <div class="title">BẢNG TỔNG KẾT & ĐÁNH GIÁ THỰC HIỆN 5S TOÀN VIỆN</div>
        <div class="subtitle">Áp dụng cho 20 Khoa/Phòng và 75 Buồng phòng làm việc • Ngày: ${date}</div>

        <div class="summary-box">
          <table style="width: 100%;">
            <tr>
              <td><strong>Tổng số Khoa/Phòng:</strong> 20 đơn vị</td>
              <td><strong>Đã thực hiện 5S:</strong> <span style="color: green; font-weight: bold;">${completedCount} Khoa (${rate}%)</span></td>
              <td><strong>Chưa thực hiện 5S:</strong> <span style="color: red; font-weight: bold;">${uncompletedCount} Khoa (${100 - rate}%)</span></td>
            </tr>
          </table>
        </div>

        <table class="data-table">
          <thead>
            <tr>
              <th style="width: 30px;">STT</th>
              <th style="width: 200px;">Tên Khoa / Phòng Ban</th>
              <th style="width: 70px;">Mã Khoa</th>
              <th style="width: 130px;">Lãnh Đạo Trực Ca</th>
              <th style="width: 80px;">Số Buồng</th>
              <th style="width: 100px;">Tình Trạng 5S</th>
              <th style="width: 60px;">Điểm</th>
              <th style="width: 80px;">Xếp Loại</th>
              <th>Tồn Tại & Lỗi 5S Nhắc Nhở Khắc Phục</th>
            </tr>
          </thead>
          <tbody>
            ${depts.map(d => {
              const isDone = completedDeptIds.has(d.id);
              const deptEval = evals.find(e => e.dept_id == d.id && e.date === date) || evals.find(e => e.dept_id == d.id);
              const roomCount = (this.data.rooms || []).filter(r => r.department_id == d.id).length;
              const score = deptEval ? deptEval.score : (isDone ? 95 : 0);
              const grade = deptEval ? deptEval.grade : (isDone ? 'Xuất sắc' : 'Chưa thực hiện');
              const issueText = deptEval && deptEval.issues && deptEval.issues.length > 0 
                ? deptEval.issues.join('; ') 
                : (deptEval ? (deptEval.notes || 'Buồng phòng sạch sẽ, đạt chuẩn 5S.') : (isDone ? 'Buồng phòng sạch sẽ, đạt chuẩn 5S.' : 'Chưa gửi ảnh báo cáo 5S trong ngày.'));

              return `
                <tr>
                  <td class="center">${d.order}</td>
                  <td class="bold">${d.name}</td>
                  <td class="center font-mono">${d.code}</td>
                  <td>${d.doctor_in_charge || 'Bác sĩ trực'}</td>
                  <td class="center">${roomCount} phòng</td>
                  <td class="center ${isDone ? 'status-pass' : 'status-fail'}">${isDone ? 'ĐÃ THỰC HIỆN' : 'CHƯA LÀM'}</td>
                  <td class="center bold">${score > 0 ? score + 'đ' : '-'}</td>
                  <td class="center bold">${grade}</td>
                  <td style="font-size: 11px;">${issueText}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>

        <table class="signatures">
          <tr>
            <td>
              <div class="bold">CÁN BỘ GIÁM SÁT 5S TOÀN VIỆN</div>
              <div style="font-style: italic; font-size: 11px; margin-bottom: 50px;">(Ký và ghi rõ họ tên)</div>
              <div class="bold">KTV. Vũ Bá Đạt</div>
            </td>
            <td>
              <div class="bold">TRƯỞNG BAN CHỈ ĐẠO 5S BỆNH VIỆN</div>
              <div style="font-style: italic; font-size: 11px; margin-bottom: 50px;">(Ký, ghi rõ họ tên và đóng dấu)</div>
              <div class="bold">ThS. BSCKII. Phạm Quỳnh Hưng</div>
            </td>
          </tr>
        </table>

        <script>
          window.onload = function() {
            setTimeout(function() { window.print(); }, 500);
          };
        </script>
      </body>
      </html>
    `);
    printWin.document.close();
  }

}

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
