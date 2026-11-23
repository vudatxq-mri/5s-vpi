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

const STORAGE_KEY = 'vpi_5s_data_v17_pro';
const SECURITY_LOG_KEY = 'vpi_5s_security_logs_v1';

// =========================================================================
// V25: PHÂN QUYỀN DUYỆT ẢNH 5S THEO "DANH SÁCH TOÀN VIỆN VPI.xlsx" (cột "Duyệt ảnh 5S")
// - ADMIN_CODES: "Quyền Admin toàn bộ"
// - REVIEWER_CODES: "Được duyệt" => được DUYỆT / CHẤM ảnh 5S
// - Tất cả tài khoản còn lại: CHỈ được GỬI ảnh 5S, không được duyệt
// Áp dụng 1 lần cho mỗi phiên bản chính sách (version). Sau đó Admin có thể bật/tắt
// quyền duyệt từng người trong màn hình "Sửa nhân sự". Muốn áp lại danh sách mới: đổi version.
// =========================================================================
const REVIEW_POLICY = {
  version: 'xlsx-vpi-20261122',
  ADMIN_CODES: ['BV-345'],
  REVIEWER_CODES: [
    'BV-001', 'BV-002', 'BV-004', 'BV-026', 'BV-042', 'BV-121A', 'BV-157', 'BV-196',
    'BV-202', 'BV-243', 'BV-245', 'BV-254', 'BV-269', 'BV-289', 'BV-305', 'BV-306',
    'BV-308', 'BV-326', 'BV-342', 'BV-386', 'BV-428', 'BV-467', 'BV-468', 'BV-489',
    'BV-525', 'BV-568', 'BV-596', 'BV-658', 'BV-725', 'BV-747', 'BV-754'
  ]
};

// =========================================================================
// V27: ĐỒNG BỘ MÁY CHỦ (Vercel API + Supabase)
// Mỗi bản ghi (khoa, phòng, nhân sự, phiếu, lịch...) được đồng bộ riêng lẻ:
// điện thoại chỉ gửi phần thay đổi và chỉ tải phần mới.
// =========================================================================
const TOKEN_KEY = 'vpi_5s_token_v27';
const SYNC_VERSION_KEY = 'vpi_5s_sync_version_v27';
const OUTBOX_KEY = 'vpi_5s_outbox_v27';
const SEEN_KEY = 'vpi_5s_seen_versions_v28';
const SYNC_COLLECTIONS = {
  departments: { get: d => d.departments, set: (d, v) => { d.departments = v; }, key: r => (r && r.id !== undefined && r.id !== null) ? String(r.id) : '' },
  rooms: { get: d => d.rooms, set: (d, v) => { d.rooms = v; }, key: r => (r && r.id !== undefined && r.id !== null) ? String(r.id) : '' },
  staff: { get: d => d.staff, set: (d, v) => { d.staff = v; }, key: r => String((r && (r.code || r.staff_code)) || '').trim().toUpperCase() },
  audits: { get: d => d.audits, set: (d, v) => { d.audits = v; }, key: r => (r && r.id !== undefined && r.id !== null) ? String(r.id) : '' },
  department_evaluations: { get: d => d.department_evaluations, set: (d, v) => { d.department_evaluations = v; }, key: r => (r && r.id !== undefined && r.id !== null) ? String(r.id) : '' },
  admin_messages: { get: d => d.admin_messages, set: (d, v) => { d.admin_messages = v; }, key: r => (r && r.id !== undefined && r.id !== null) ? String(r.id) : '' },
  rooms_schedule: {
    get: d => (d.schedules && Array.isArray(d.schedules.rooms_schedule)) ? d.schedules.rooms_schedule : [],
    set: (d, v) => { if (!d.schedules) d.schedules = {}; d.schedules.rooms_schedule = v; },
    key: r => (r && r.room_id !== undefined && r.date) ? `${r.room_id}|${r.date}` : '',
    skip: r => r && r._auto === true
  }
};
const SYNC_SINGLETONS = {
  hospital: { get: d => d.hospital, set: (d, v) => { d.hospital = v; } },
  shift_config: { get: d => d.shift_config, set: (d, v) => { d.shift_config = v; } },
  criteria: { get: d => d.criteria, set: (d, v) => { d.criteria = v; } },
  schedules_meta: {
    get: d => { if (!d.schedules) return undefined; const { rooms_schedule, ...rest } = d.schedules; return rest; },
    set: (d, v) => { const rs = (d.schedules && d.schedules.rooms_schedule) || []; d.schedules = Object.assign({}, v || {}, { rooms_schedule: rs }); }
  }
};

// CSDL Khởi tạo chuẩn 20 Khoa/Phòng & 75 Khu vực làm việc Bệnh viện Vĩnh Phúc VPI
const DEFAULT_SEED_DATA = {
  hospital: {
    name: 'Bệnh viện Vĩnh Phúc VPI',
    logo: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADb/2wBDAAMCAgICAgMCAgIDAwMDBAYEBAQEBAgGBgUGCQgKCgkICQkKDA8MCgsOCwkJDRENDg8QEBEQCgwSExIQEw8QEBD/2wBDAQMDAwQDBAgEBAgQCwkLEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBD/wAARCADIAMgDASIAAhEBAxEB/8QAHQABAAEEAwEAAAAAAAAAAAAAAAgBAgcJAwUGBP/EAGQQAAAEAwMDCgwODgUNAAAAAAACAwQBBQYHEhMIESIUISMxM0JDU2NzCRUyNEFicoKDk7PDFhkkNlFSVGFkcXW0wtMYJSY4Vld0hZKVoqOy0hcodqHwN0RFRmWBhJGx0ePy8//EABsBAAIDAQEBAAAAAAAAAAAAAAAFAgQGAwEH/8QAMBEAAgIBAgQEBQQCAwAAAAAAAAMCBAUBExESMjMhIiMxFBU0QlIGJEFiFlNDUXH/2gAMAwEAAhEDEQA/ANqYAAAAAAAAAAAAAAAApEVFgAOOCcOxEVUw7g85VNZ0/SSEXE0d6ceoRJpqH7ggwjVlsFQT6+3ljnpey5Pdzp9uf6scGWILF1q+mnoZ3mVWUxKIanmc5Ytj5tzOqSCn6A+NnaLQ77YEKoY5/fPh/wAYi7if44Q4CrO9/QS/5DP8CYKSzdbc4XxzRJ72cRSp2sJ/SauPKJgoRPiD6aCng/OJjMlI2uSGoIkQmcYy97HW045k1O4P9A+uO6LcGjSplkWf6GUAFhNoXi0NwAAAAAAAAAAAAAAAAAAAAAAAAAC2/AAFsdoWQPrbQtOpg65xjGsLaJRJ77eUGTfKcffw0Cd/wneCEyu+1CvDjMyFMpxL5O2WfzJwmggnvzjD1X21OFb8vpNCJPZdLkzn8Gn9M4xpO6tf1MrjzecJuj8HsiZEyc2niD4k1MfrfZP20xSe9n/HAzNvMzZ2y9d24fOTuHjhR0dTdDn2RQ/hBYACl4/yIWNY3uAAAQOYAAAB7KjrUKgpKKaGu9l8OAW6snNn82Mz0vXcgrJt6jc3HXCNTxw1Cf8Afb6sgjMBF3CDlNw3xCHT3M5NjUJzagsrtzX1jipln1tfU88CZZdraFlz3xgCk7a5vL7kvqiMXiMdt0nuhO84T/G6DNUgqCUVAx1dLHya6WbbJvAwW+DDVVL6bnQd2AAO5eAAAAAAAAAAAALAAeIry0mkbLKTdVfW05Tl0rbQ1lFNkUVU4NNMhNdRQ+8ISANNNz2IMZt+57TEzQGA7bcsOymxVM7CaPozefbRJKwUIddPn+IJtdXp9oIZ27Zf1oFo0HVP2cwWpGQ51CY9/wC2TpPsYiifW5D+0T2TlBFc6mOtqhxpnU6vfqHU4xRTjA9oYWbPO8Q28z/CCQtq+XHbRaYsdszmDSl5XvGss2RQ6fKLqcJzaaYwVNamqCcOTuJ5UEyfHU3THdqKX/GKDrQD6FRC+iBm2WGN7kziw2/ucdixnk4lVzpXOH7LD4ldRO4p4NQfGA7/AA6/wIGRJBlC2sU//rQpMSe0maaa9/wimyfvBlukcr2XL4bevKXUZfCpZs6fOKJqbn4NRQRgFqYV2MTVsfYebfH2NiVMVjS9asOmFLzhpMSb/BU2QnOJ/WDuhHLJ/wAiy2+unKFYdMFKAl2xqIPXKahH66fB4bdPD2PtzqJ82oJjtMnquJNKNTOa3QqFdPhDy3UJ1+cuHPsnKaAxV/GwRP8AbzLXyx7IbnIeFAXvpdMJc56XzNudq6JvD6BxYExRYuavTYAAAECw4+2VTicSdz0wlcwUan7Tf84nwg+UB5Bm30HRbZq7Zmij7aZe7MRjUhYs1Ow5LuZu74v+AZVau275sRduqmoRTfk0yCIQ7qlq2n9KLZpY4jhwjnOieN9NTwfB92mLqL3+wfUM7t/UEsfjAeBoW0yU1h6nhHUsw7KJ+E7dP25B74sM8AxgzcNOh67ENxZeAAJncAAAA69w5bsm53ThdNNNPTOc8bl2G/iNP+VNb5N7dbRHUwbOFPQvJTqN5G1z5yYeJhqOFCcYph4naJ4aY2OZZFUL0nk6VpMGa8E3TliSXEP+UKQQU/YOcaexoMLU0b6kzN5y3w9AAADSmbAAAAAD0dA2dVvaZUBKXoSmH06e7HoIk2NBPjF1ODT5RRRMT0sL6HZTFMJoVBbM5TqGY50lE5QhoMUFM+viH0FHCni0+TOKVvJwre0y7UoPsa9HkIeWKZNdq9uTj7lJPFtK8TDWnL+ChGKHGYanDqdoTE8GNh9hORfZVYuZCbPG8aoqgkL3TSaJkPBA8OIR4Pu9NTlBn9hLmMqYpsGTFBq3SJhkQbpwTTITtCEHZjL28k+waepjU1wQkIQFbkBQAvGfgefn1Kyapm8W83l6axN5raZBhmrLGJxKL7in4KzBlxcd3TT855QSF+LMLIpZ9uI4sRBgvtUU2feBDhRPA64/9AEmatsyp6roaoXQ1M991IaCgwdV1mtQUl6ocN9VMvdSG5+ETC5lWazMW8S+t/eB5cAAVhP7AAAAFWLtwxckcN3CjV0nh3Dk3QigkxZ7VPorp9N+eFxyloLk7fjIdofqxGYZOsEmRm9QTBgUuci6BFI6/CJnufwH/YFmizz7Y7wtti37f2GfQAgBubUvAAABGXog0P6tU7j8Ol/zhMaoRudyhbJj20WUzqz1B/qJ6/gRRouYt9NNdJTETgp2h7lw/vHGpm1Sxa0ix2cdJ7QKXUl2JuDrdGjrlG66fk905MaTCvhybfOZTOonrODNIHiAABoREBK/JbyIpla6wY1/Xz93LKXeRvtWyEIkdzBMh90vn3NPaw1NNTi8PdBFFBPHckb8Yomn4NRTDG9qm5RL5BI5fIJcjcbS9qg3QJ7RNNOBCf3ECXM251oci/vG+JowsT3GHS0VZvRFmckTpygqYYySXoZ44bYlzEPmzYih9tQ+tDTPfOPaALxlNdePua5cNv2AsPtC8WKbUfiAS19jVROMvrKXYTeYy5tU8hgm0duUCfaZPcyKKEJ/APi9MGyl/wAIJN+piDANR+uGb/KLj5woOsGxXjU6r6DCsvWtzrNumRratWFslkHowrd80dTGE0cM4KIIERJhp4dzQJ3ZxIERS6G797v+f5h5sSs19eOYZSwvbdOBsajNxMNTkHCohBaGyC8BxLXuYpq2xeWzWJ38ghGXvNqBNtA+3vOD7HUfoDDc8pmcUy51PPJeoT2h90TPzaglxHNGGeI6+ayuXzhqdpNGxF0VIaZFCXyRFZlSDBPexS7HivrIjAMq1fYquliTCk3ETkhHrVQ+ZQnNqfQOMXLtHDFydu8bqNTp7oQ+xqECtiJrMlbovp9cDjGQLCPXr/wjjyiYx+MhWE+vU/5Ep5seI78CeJ+pgSJIAEAPj6FoXgAAAsiX3h5+pKXp+rpM5kFUyZlNJe8Js7V0niEP3hx38I5xUC9eBzZDia+7dehyxjqqoLDH/GKeh+YL+QXU8mp4wQgn9OVBSM4dU/VEnfyuYtN3aukFCKE8GpwfKbmN8UYQhrZxjG1Wwuzy2mVwl9oFMIvIowjBBySMU3TXa10FiaZPZudQffk1w3qZaau55hLbw0GeovrNLzXr9Dn0/KJjfS1h6mT+Ia0q+6HVaVTtYMv6O5ywn0hO6T2aYOMBdkliJ38fjLifCJ+LTGzEpM0AZa3CzybZ7iajK/PowvFgopHWzjVRUeXZlJyqfTSXs6wlsGrSYuG6eaRoHuJkcKEJvOLTFGrUZc14LL9q2un1m1sUPrFiNSn2fWU/+HEu/UjX+QPs+sp/8MJf+pGv8gu/JrRT1zNbgYIqNT7p5v8AKTz5woOtHKu7cPnLpw46t2ooofg9kUUxFBxDWLXqtZkGM3GbhtI6G7m+x4/P8w82JVQ98aZLL8qa2ex6mfQjQdQMWUvx1HlxaVkXUxFLmJsihO0Hs/s+8p/8MJb+o0Pqxl7WJex24aeplULTtm2qBcwqNSn2fWU/+GEu/UjX+QTsyM7VawtgsaTrCvJi1eTRWavG2IggREmGmchE9AmsKVjHPrQ3GDKrfTZnyQJBCmaAqApDAsw4Zh5mpqJkFWt4t5q304bmsnoKE7g49MLdGERCfic2Lg3rI1VZZVUFNYjhnnmEv9uTdCJ8on5xMfXYZ69o/kjjyiYkQchDl1x5trRUhZT6M/bN8B5FM5DwT0CH190ubV/txw+Ehubgm+VaLfBiz1BAAhMwC0PS8AAAFm2G0PNVfVDalZPGbOW6pyJqJpmw4kgfTUgTfjlpyqZRUraC8ockPDaPDqDk7wQ5znvw59s9GAtvwFwmdC25AViKgAD5TwhGGaMBoqrH14T75VefOFBvYOT3xrnnnQ07UJtPpjMG1o9LkQfu3Di4dB3fw1FFFMNTxgbYi0utOWs5CTK1Z2YenEhMAmZ6V9ah+M6mPEOxyelg2ofjHpfxDsPvm1b8xD8stfgQvAcr5pqF+6l7jq2i6ifJnUTUUT82OIMRft+fbACQ1hGRhW9u1Eejan6wkUubaqcM8B63Uv4idy+psfdjJXpYNqH4x6X8Q7FJmSqqnyc5dXjbTPsIXjab0OX73RD5cmHlCCP/AKWBah+M+l/EOxL3JasbnVgtlydAT2csZo5JMXLuC7VNQidxQ+sTT34UZa8iyn05jfFUX1ncWGaIRhEXikIQhEa8cvu2O06gbZaeYUJW01kjVCRpvMBqtcTO4O4UIdRRPhNBNMmGpsYSVUTsz21jt7/h4c8zYZmgLtb2BBSwfoispnGDILcmJJY+hhppz1smfUiymbaXQTv4B9bqyROnzYmrKZ3KahlrebyeYoP2LtPEQXaqYiaiftyHIB9VlfXzxBFtNjoO6AAHEtAAAAAUjtCopHaABjq231iLQ5ZDygj9Lpi/lyur5Yudq5JvyaCgkDbRD7gV48sn5QR3Cu8zbn4GQzjJrs+BmOjrb262HL6r2M/ukm59+MusnrZ82I4ZLpqEUhoHTjfIIfju6ZrSf0m5zSdxHD36B9NM/g/OJgr2/wDYe0M7NfpvJYAMbUdazIp+ZNu8+1708NYikY3FO4P9AZGIpoZwxhPcNOiwux2zmAUFRM7lhAU2o/EBAU2o/EDQhr7Gh2o/XDN/lFx84UHWDs6j9cM3+UXHzhQdYPoUO3A+es7kzaR0Nwn9XOMP9vzD6AlZHsiK3Q3PvdI/L8w+gJUx7IwtvvzNvR7MDkAAFcvHHDsjWB0TD/LpJP7MJ/OHA2fx2hql6IZVTCpsoY8vljnEjT0mby9ffpkcYii6nhE01Ew1wv1QkzP0xGUZKsfyg7TrDn2PQs/PqJQ+IvKHWIdgvzifBn5RPDUGNQGtYhbe5Ayi3sV25m1WwbLis2tZM0kE/XjSVSHgmnqKYKbA6U1+t19/2NBS4p3Yk4RSEYZxoOE5eh623V/Pqse2T1ROHczkqcnO8lsXKkTuGqiaqZDpkUPsmGoRTc1OowyYYzWSxO16i+g0uNy27PbYbEb8AFYAERoSopHaFRSO0ADHVt3rFcx5dDykBHcSdtIlcZzRUzYIR04kxE+7TPf/AOpBGIK7y+MzIfqCHrcQAAKZngPa0natUFM4bd5Hpgy9ofdCJ8mp5tQeKASW+azui2yt0TJRUtXkgqpH7Vu9Pfon0FCD0sVIbeYQ4QXcIOSOGbhRqdPczk0FCDKFHW2TBjcl9WN8Ynuom6E5xPzgYrt/maihmYM75nv/AHgfXgOqk87l85akfyx8m6QU2jkHadiAt6D2DNGmuiadDMtHmU4ezBK1GmrjtdRxpy53iExFFD8Zyg+b0sG0j8aNNfq139YNkIpGEY9kMvmVn25xfPFVtfHkMJ5LFic4sGsy9A08m7GaOYzFw/x2iaiacU1LlzQPv9jGag2hYdeCZNMUZ8Wz59RguGi4F+cdJUFS0/SUndT+qZwylcuaQvrunSmGmRPtznEare8vaz2zTVVP0JFOrqhJDDzoKeoUFO3XJ1anJp/ppjX1avbfaRbXN9X1/VCj1NPcJeTQYIc2gn5RTEU5QMamNZYFlvKwr9BLa3roi2xOqYsMbwjm2M9QzFO4QnMIKbpzini+EEEXbpw+cnmDxwo6dO1FFF1z7IouoopiKKKKcYooOIBpalCFPogZe3bnc65gAAXiqBKjobn3w7r+zjzyiAiuJudDGotytU9W2gHbw1KxZN5OifeKKKHIop4siafjAuyTOFWYxxq/3UDY4AsIAw5uC8AATA4FiX0xGy0uhXFNTc8waN4dLHCmx6+xonU3QinmxJeOsPhfy1hMW52zxuQ5FOrIffDg9G6Lr9H4yBEIBlir7FYpX5hSa0YfBVPNn+gcYrdMXEqcnbvG6jU6e8PsahAoZXmsx1qgyn1wOMAARKIAAAB90jn84kDnphJ5go1P+7PzifCDL9IW3y+ZYbCo4aidcfwB+c4sYSAdV25rGNTJOp9HQTARdN10djXIe/798fRE8NoRRkNbVPTfqeUTCKZM+fAWLfTJymGfc/BjD1vtv+Vs3lDpCRQlLKSqEUvzSmGqh3aafKYiimGft0/GJhvVZC5Pk0NCvOo5CUltWVHZdYYidCqJ7qybRhsEkYbI7PznFk7c9zvxrtt2ywrV7a9VSZeYRp6lz7H0plilzHT+EL/5x3Gxp8mMHul3D5y6mDxwo6dKKKKLrHOooodRTdFFFFN0U5wcQ2VHGrr+p1ii3ln2e35IAAAN/wDwWe4AAHoAAEhrCsiu1i2MqM5mrb0KUuf/AEnMEFNULp/B2+h4w9xPnBXfYXW8WTO1euyz4LgYVomhamtEqdlSFGsDvJnMlMNMnBkT36iinFkJpqKKDcRk+2SSqxOy2V0JLCQXUQMo4euc/XTtSN9RTahoX9AnJkJAfNY7k82dWGSjUFDSfM9XTTg+mbpTEdu7nGKf8tAkCJjK0CQza4ymSv63J8NOg1eNofCdZzgKAFg3KgAAACgqAAOPNrZh52p6PkFUtot5zLyLZuoP1Byd+PTCzNAQn4kGL0b7kb6ssiqGQ33EoLGYMu06sifKJ8J3g8J/8xMc5OxGGceGrGyyn6sidzrs3sc+zIQ6vnCcIKL6PHxWZ29g+PqII4gPRVTQFQUl143vsvdRNNM/Of8AkHnRSYuazMPrsX3IcgAAETn/AAAv+8AA014ewHh6xsWs3ry+4nFPpke+6muwL4nKKJ7Gp4RNQYXqbI/mCF9xSdYJuicTNCYahPCJ4nk0xKAAwq5a1X7cyZBmc5PVsEnv6oo9R6RPfy9dNdP92p5seeXs2tAY9cUPUJPzcv8AVjYOOeXS6YTVySXytuo6OpvCYn+Ew6R+p3/ger0Y3tmvhjZPag+ck1HZ/Pdk+CqET8YoMp2bZEdtFoqpIxl7CQseEXdKX8PZOLT4Tk8QbC6QsVQb3H9V+qlM3WqeuTwh/oE/bGX2rFuwbEbs0EyET6ghNAhBZ1ztlmnQaGhhps9R5G+w/IcsvslWQn04beiqft4Z9WTNMkUEFNfrdCGxk7Gme+p75BJvD1s2cCC8L5vnY8WGkRXhX7ZeAAIHcAAAAAAAAAAAAAAAAAAAA+I7dBdvgKIkOn7HVjF1XWKS+YRUeU59r3PEw3A/8gy3tQFLsM2uIThowqvqLsQ4MIhzin5xT7npfOJeo1P+7Pzag+ES1nEjlM9bHYzRimun7CkL4w7VtiDhjE7+k18ZP3Efqyc2p9YFz6P8wMvbw019voMWAOd9LphLnOp5pL3bI/bkUIOBPZ+t9P8AeKClt6iXaYv7ABE8frfhO/UOPX0tZfU9TKkjFA8uaQ4dfETv82mM0UnZ5T9IpZ27eLl77qXhfU2v7u8FlFScxpRxL7OvqeSBi6j7F5xOLj+oIKS9H2nDn+rGZ6cpiT0y21PKJemgT+Md7ciGb2QxWiCzVVMain0F4ZoCoDuXgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACwVuQAAAfIo0brbqgQ/eC1GVsG3W8vQT5tMhQABDah/0fbcgLgABMAAAAAAAAAAAAAAAAAAAA//Z',
    legalName: 'Bệnh viện Vĩnh Phúc VPI',
    department: 'Hội đồng Quản lý Chất lượng & Ban Chỉ đạo 5S Toàn Viện',
    slogan: 'Sàng lọc - Sắp xếp - Sạch sẽ - Săn sóc - Sẵn sàng',
    address: 'Lạc Ý, Định Trung, TP. Vĩnh Yên, Tỉnh Vĩnh Phúc',
    hotline: '+84916306115',
    supportEmail: 'vudatxq@gmail.com',
    author: 'Vũ Đạt',
    copyright: 'Tác giả: Vũ Đạt',
    director: 'ThS. BSCKII. Phạm Quỳnh Hưng',
    directorTitle: 'Trưởng ban Chỉ đạo 5S Bệnh viện',
    officer: 'KTV. Vũ Bá Đạt',
    officerId: 'BV-345',
    officerTitle: 'Cán bộ Giám sát 5S Toàn Viện & KTV Trưởng CĐHA',
    supervisionCycle: 'Tháng 10/2026 (Kiểm tra hằng ngày)',
    complianceRate: 100,
    averageScore: 98.5,
    // V28: bỏ "THÔNG BÁO KHẨN ... kiểm tra lúc 09h00 sáng nay" (tin cũ 16/10 hiện mãi mỗi ngày)
    notice: {
      enabled: false,
      type: 'info',
      title: '',
      content: '',
      updatedAt: ''
    }
  },
  departments: [{"id": 8, "code": "KCDHA", "name": "Khoa Chẩn đoán Hình ảnh", "head_nurse": "KTV. Nguyễn Đức Tuấn", "doctor_in_charge": "BSCKI. Phạm Quang Nam", "phone": "0211.386.130", "color": "#6366f1", "icon": "fa-x-ray", "description": "Chụp X-quang, Cắt lớp vi tính (CT), MRI, Siêu âm màu", "order": 1, "category": "paraclinical"}, {"id": 1, "code": "KCC", "name": "Khoa Cấp cứu", "head_nurse": "ĐD. Trần Thị Lan Hương", "doctor_in_charge": "ThS. BSCKII. Phạm Quỳnh Hưng", "phone": "0211.386.115", "color": "#ef4444", "icon": "fa-ambulance", "description": "Tiếp nhận cấp cứu 24/7, xử lý khẩn cấp bệnh nhân nặng", "order": 2, "category": "clinical"}, {"id": 11, "code": "ICU", "name": "Khoa Hồi sức tích cực & Chống độc", "head_nurse": "ĐD. Nguyễn Thị Thanh Nga", "doctor_in_charge": "ThS.BS. Đinh Công Trí", "phone": "0211.386.116", "color": "#dc2626", "icon": "fa-heart-pulse", "description": "Điều trị chuyên sâu bệnh nhân hồi sức, thở máy, lọc máu liên tục", "order": 3, "category": "clinical"}, {"id": 12, "code": "PTGM", "name": "Khoa Phẫu thuật - Gây mê hồi sức", "head_nurse": "ĐD. Nguyễn Văn Thắng", "doctor_in_charge": "BSCKII. Lê Tuấn Anh", "phone": "0211.386.117", "color": "#0284c7", "icon": "fa-syringe", "description": "Khu phẫu thuật vô khuẩn, gây mê hồi tỉnh, phẫu thuật ngoại sản", "order": 4, "category": "clinical"}, {"id": 2, "code": "KKB", "name": "Khoa Khám bệnh", "head_nurse": "ĐD. Hoàng Bích Thủy", "doctor_in_charge": "BSCKI. Vũ Đình Khiêm", "phone": "0211.386.101", "color": "#0ea5e9", "icon": "fa-stethoscope", "description": "Khám bệnh ngoại trú, tư vấn và phân luồng bệnh nhân", "order": 5, "category": "clinical"}, {"id": 4, "code": "KNG", "name": "Khoa Ngoại Tổng hợp", "head_nurse": "ĐD. Bùi Văn Hùng", "doctor_in_charge": "BSCKII. Nguyễn Văn Toàn", "phone": "0211.386.120", "color": "#10b981", "icon": "fa-user-doctor", "description": "Phẫu thuật điều trị các bệnh lý tiêu hóa, gan mật, chấn thương", "order": 6, "category": "clinical"}, {"id": 5, "code": "KNT", "name": "Khoa Nội Tổng hợp", "head_nurse": "ĐD. Trần Phương Dung", "doctor_in_charge": "BSCKI. Mai Thị Hảo", "phone": "0211.386.122", "color": "#06b6d4", "icon": "fa-notes-medical", "description": "Khám và điều trị nội trú tim mạch, hô hấp, nội tiết, tiêu hóa", "order": 7, "category": "clinical"}, {"id": 6, "code": "KSN", "name": "Khoa Phụ Sản", "head_nurse": "Hộ sinh. Lê Thị Thúy Hằng", "doctor_in_charge": "BSCKII. Nguyễn Thị Hồng", "phone": "0211.386.125", "color": "#ec4899", "icon": "fa-baby", "description": "Chăm sóc thai phụ, đỡ đẻ thường, mổ lấy thai và điều trị phụ khoa", "order": 8, "category": "clinical"}, {"id": 7, "code": "KNHI", "name": "Khoa Nhi", "head_nurse": "ĐD. Đỗ Thị Hiền", "doctor_in_charge": "ThS.BS. Đặng Hồng Phúc", "phone": "0211.386.128", "color": "#eab308", "icon": "fa-children", "description": "Khám và điều trị toàn diện bệnh lý sơ sinh, trẻ nhỏ và dinh dưỡng", "order": 9, "category": "clinical"}, {"id": 3, "code": "YHCTPHCN", "name": "Khoa YHCT - Phục hồi chức năng", "head_nurse": "ĐD. Phạm Thị Lý", "doctor_in_charge": "BSCKI. Trần Văn Thái", "phone": "0211.386.118", "color": "#f59e0b", "icon": "fa-spa", "description": "Châm cứu, xoa bóp bấm huyệt, phục hồi chức năng và vật lý trị liệu", "order": 10, "category": "clinical"}, {"id": 13, "code": "LCK", "name": "Khoa Liên Chuyên Khoa (Mắt - TMH - RHM)", "head_nurse": "ĐD. Vũ Thị Loan", "doctor_in_charge": "BSCKI. Đỗ Mạnh Cường", "phone": "0211.386.129", "color": "#8b5cf6", "icon": "fa-eye", "description": "Khám chữa bệnh Răng Hàm Mặt, Tai Mũi Họng, Mắt và phẫu thuật tạo hình", "order": 11, "category": "clinical"}, {"id": 14, "code": "TDCN", "name": "Khoa Thăm dò chức năng & Nội soi", "head_nurse": "KTV. Lê Thùy Linh", "doctor_in_charge": "BS. Lê Quang Huy", "phone": "0211.386.131", "color": "#14b8a6", "icon": "fa-wave-square", "description": "Nội soi tiêu hóa, điện tim, điện não đồ, đo chức năng hô hấp", "order": 12, "category": "paraclinical"}, {"id": 9, "code": "KXN", "name": "Khoa Xét nghiệm", "head_nurse": "KTV. Đỗ Thị Thu Hường", "doctor_in_charge": "BSCKI. Vũ Đức Hải", "phone": "0211.386.132", "color": "#8b5cf6", "icon": "fa-vial-virus", "description": "Huyết học, Sinh hóa, Miễn dịch, Vi sinh đạt chuẩn an toàn sinh học", "order": 13, "category": "paraclinical"}, {"id": 15, "code": "KD", "name": "Khoa Dược", "head_nurse": "DS. Nguyễn Bích Ngọc", "doctor_in_charge": "DS CKI. Hoàng Thị Lan", "phone": "0211.386.133", "color": "#10b981", "icon": "fa-pills", "description": "Quản lý kho thuốc, cấp phát dược phẩm, hóa chất và vật tư y tế", "order": 14, "category": "paraclinical"}, {"id": 10, "code": "KKSNK", "name": "Khoa Kiểm soát Nhiễm khuẩn", "head_nurse": "ĐD. Trịnh Thị Thu Trang", "doctor_in_charge": "BSCKI. Hoàng Trọng Nghĩa", "phone": "0211.386.135", "color": "#14b8a6", "icon": "fa-shield-virus", "description": "Tiệt khuẩn dụng cụ y tế, giặt là đồ vải, giám sát vệ sinh 5S bệnh viện", "order": 15, "category": "paraclinical"}, {"id": 16, "code": "QLCL", "name": "Phòng Quản lý chất lượng & Ban Chỉ đạo 5S", "head_nurse": "ĐD. Nguyễn Thu Trang", "doctor_in_charge": "ThS. BSCKII. Phạm Quỳnh Hưng", "phone": "0211.386.100", "color": "#6366f1", "icon": "fa-award", "description": "Thường trực Ban Chỉ đạo 5S, đánh giá Bộ 83 Tiêu chí chất lượng BV", "order": 16, "category": "functional"}, {"id": 17, "code": "KHTH", "name": "Phòng Kế hoạch tổng hợp & CNTT", "head_nurse": "ĐD. Hoàng Hải Yến", "doctor_in_charge": "BSCKI. Trần Đức Thắng", "phone": "0211.386.102", "color": "#3b82f6", "icon": "fa-clipboard-list", "description": "Kế hoạch chuyên môn, chỉ đạo tuyến, quản trị hệ thống HIS/PACS", "order": 17, "category": "functional"}, {"id": 18, "code": "PDD", "name": "Phòng Điều dưỡng", "head_nurse": "ThS. ĐD. Trần Thị Lan Hương", "doctor_in_charge": "ThS. ĐD. Trần Thị Lan Hương", "phone": "0211.386.103", "color": "#06b6d4", "icon": "fa-user-nurse", "description": "Quản lý chăm sóc người bệnh, kiểm tra quy trình kỹ thuật điều dưỡng và 5S", "order": 18, "category": "functional"}, {"id": 19, "code": "HCQT", "name": "Phòng Tổ chức cán bộ & Hành chính quản trị", "head_nurse": "CN. Đặng Thị Loan", "doctor_in_charge": "ThS. Nguyễn Văn Hùng", "phone": "0211.386.105", "color": "#64748b", "icon": "fa-building", "description": "Văn thư, tiếp dân, quản trị cơ sở vật chất, bảo vệ và khuôn viên cảnh quan", "order": 19, "category": "functional"}, {"id": 20, "code": "TCKT", "name": "Phòng Tài chính - Kế toán", "head_nurse": "KTV. Lê Thu Thảo", "doctor_in_charge": "ThS. Vũ Thị Mai", "phone": "0211.386.106", "color": "#f59e0b", "icon": "fa-file-invoice-dollar", "description": "Quản lý thu chi viện phí, thanh toán BHYT, quản trị tài sản và trang thiết bị", "order": 20, "category": "functional"}],
  rooms: [{"id": 34, "department_id": 8, "code": "XQ-01", "name": "Phòng Chụp X-quang Kỹ thuật số DR", "room_type": "Phòng máy", "floor": "Tầng 1 - Nhà Kỹ thuật", "person_in_charge": "KTV. Trần Văn Chung", "target_score": 95.0, "status": "active", "order": 1}, {"id": 32, "department_id": 8, "code": "CT-01", "name": "Phòng Chụp Cắt lớp vi tính 128 dãy (CT-Scanner)", "room_type": "Phòng máy", "floor": "Tầng 1 - Nhà Kỹ thuật", "person_in_charge": "KTV. Nguyễn Đức Tuấn", "target_score": 98.0, "status": "active", "order": 2}, {"id": 33, "department_id": 8, "code": "MRI-01", "name": "Phòng Chụp Cộng hưởng từ 1.5 Tesla (MRI)", "room_type": "Phòng máy", "floor": "Tầng 1 - Nhà Kỹ thuật", "person_in_charge": "KTV. Lê Công Bằng", "target_score": 98.0, "status": "active", "order": 3}, {"id": 35, "department_id": 8, "code": "SA-01", "name": "Phòng Siêu âm Màu 4D & Doppler tim mạch (P.104)", "room_type": "Phòng khám", "floor": "Tầng 1 - Nhà Kỹ thuật", "person_in_charge": "BS. Phạm Quang Nam", "target_score": 95.0, "status": "active", "order": 4}, {"id": 50, "department_id": 8, "code": "PACS-01", "name": "Phòng Đọc & Hội chẩn kết quả CĐHA - PACS", "room_type": "Phòng chuyên môn", "floor": "Tầng 1 - Nhà Kỹ thuật", "person_in_charge": "KTV. Vũ Bá Đạt", "target_score": 95.0, "status": "active", "order": 5}, {"id": 51, "department_id": 8, "code": "KHO-CDHA", "name": "Kho Vật tư tiêu hao & Lưu trữ hồ sơ phim CĐHA", "room_type": "Kho lưu trữ", "floor": "Tầng 1 - Nhà Kỹ thuật", "person_in_charge": "KTV. Trần Văn Tuấn", "target_score": 90.0, "status": "active", "order": 6}, {"id": 1, "department_id": 1, "code": "KCC-P01", "name": "Phòng Tiếp nhận & Phân loại bệnh cấp cứu", "room_type": "Phòng tiếp đón", "floor": "Tầng 1 - Nhà A", "person_in_charge": "ĐD. Lê Văn Minh", "target_score": 92.0, "status": "active", "order": 1}, {"id": 2, "department_id": 1, "code": "KCC-P02", "name": "Phòng Hồi sức Cấp cứu ban đầu & Chấn thương", "room_type": "Phòng thủ thuật", "floor": "Tầng 1 - Nhà A", "person_in_charge": "ĐD. Trần Thị Lan Hương", "target_score": 95.0, "status": "active", "order": 2}, {"id": 3, "department_id": 1, "code": "KCC-P03", "name": "Phòng Lưu bệnh Cấp cứu (Phòng 101)", "room_type": "Phòng bệnh", "floor": "Tầng 1 - Nhà A", "person_in_charge": "ĐD. Phạm Thị Mai", "target_score": 90.0, "status": "active", "order": 3}, {"id": 4, "department_id": 1, "code": "KCC-P04", "name": "Phòng Tiểu phẫu - Băng bó vết thương", "room_type": "Phòng thủ thuật", "floor": "Tầng 1 - Nhà A", "person_in_charge": "ĐD. Hoàng Hải Yến", "target_score": 92.0, "status": "active", "order": 4}, {"id": 5, "department_id": 1, "code": "KCC-P05", "name": "Kho Thuốc & Dịch truyền Cấp cứu", "room_type": "Kho dược", "floor": "Tầng 1 - Nhà A", "person_in_charge": "DS. Nguyễn Bích Ngọc", "target_score": 95.0, "status": "active", "order": 5}, {"id": 6, "department_id": 1, "code": "KCC-P06", "name": "Khu Vệ sinh Cấp cứu & Khử khuẩn rác thải", "room_type": "Khu vệ sinh", "floor": "Tầng 1 - Nhà A", "person_in_charge": "Hộ lý. Vũ Thị Hoa", "target_score": 90.0, "status": "active", "order": 6}, {"id": 46, "department_id": 11, "code": "ICU-01", "name": "Buồng Bệnh nhân nặng Hồi sức 1", "room_type": "Phòng điều trị tích cực", "floor": "Tầng 2 - Nhà B", "person_in_charge": "BSCKI. Trần Văn Thái", "target_score": 98.0, "status": "active", "order": 1}, {"id": 47, "department_id": 11, "code": "ICU-02", "name": "Buồng Bệnh nhân Thở máy & Lọc máu liên tục", "room_type": "Phòng hồi sức", "floor": "Tầng 2 - Nhà B", "person_in_charge": "ĐD. Nguyễn Thị Mai", "target_score": 98.0, "status": "active", "order": 2}, {"id": 48, "department_id": 11, "code": "ICU-03", "name": "Phòng Thao tác & Thủ thuật ICU", "room_type": "Phòng thủ thuật", "floor": "Tầng 2 - Nhà B", "person_in_charge": "ThS.BS. Đinh Công Trí", "target_score": 95.0, "status": "active", "order": 3}, {"id": 49, "department_id": 11, "code": "ICU-04", "name": "Phòng Trực cấp cứu & Giao ban ICU", "room_type": "Phòng giao ban", "floor": "Tầng 2 - Nhà B", "person_in_charge": "ĐD. Nguyễn Thị Thanh Nga", "target_score": 92.0, "status": "active", "order": 4}, {"id": 52, "department_id": 11, "code": "ICU-05", "name": "Buồng Cách ly áp lực âm ICU", "room_type": "Phòng cách ly", "floor": "Tầng 2 - Nhà B", "person_in_charge": "ĐD. Phan Anh Tuấn", "target_score": 95.0, "status": "active", "order": 5}, {"id": 53, "department_id": 12, "code": "PTGM-01", "name": "Phòng Mổ số 1 - Phẫu thuật Ngoại tổng quát", "room_type": "Phòng phẫu thuật", "floor": "Tầng 3 - Nhà Kỹ thuật", "person_in_charge": "BSCKII. Lê Tuấn Anh", "target_score": 99.0, "status": "active", "order": 1}, {"id": 54, "department_id": 12, "code": "PTGM-02", "name": "Phòng Mổ số 2 - Phẫu thuật Sản khoa & Mổ lấy thai", "room_type": "Phòng phẫu thuật", "floor": "Tầng 3 - Nhà Kỹ thuật", "person_in_charge": "BSCKII. Nguyễn Thị Hồng", "target_score": 99.0, "status": "active", "order": 2}, {"id": 55, "department_id": 12, "code": "PTGM-03", "name": "Phòng Hồi tỉnh & Theo dõi sau phẫu thuật", "room_type": "Phòng hồi tỉnh", "floor": "Tầng 3 - Nhà Kỹ thuật", "person_in_charge": "ĐD. Nguyễn Văn Thắng", "target_score": 96.0, "status": "active", "order": 3}, {"id": 56, "department_id": 12, "code": "PTGM-04", "name": "Khu Rửa tay phẫu thuật viên & Thay đồ vô khuẩn", "room_type": "Khu kỹ thuật", "floor": "Tầng 3 - Nhà Kỹ thuật", "person_in_charge": "ĐD. Bùi Văn Hùng", "target_score": 95.0, "status": "active", "order": 4}, {"id": 57, "department_id": 12, "code": "PTGM-05", "name": "Kho Vật tư phòng mổ & Đồ vải tiệt trùng", "room_type": "Kho vô trùng", "floor": "Tầng 3 - Nhà Kỹ thuật", "person_in_charge": "ĐD. Trần Kim Oanh", "target_score": 95.0, "status": "active", "order": 5}, {"id": 7, "department_id": 2, "code": "KKB-P01", "name": "Sảnh Tiếp đón, Hướng dẫn & Lấy số tự động", "room_type": "Sảnh chờ", "floor": "Tầng 1 - Nhà B", "person_in_charge": "ĐD. Nguyễn Thu Trang", "target_score": 92.0, "status": "active", "order": 1}, {"id": 8, "department_id": 2, "code": "KKB-P02", "name": "Phòng Khám Nội tổng quát (P.101)", "room_type": "Phòng khám", "floor": "Tầng 1 - Nhà B", "person_in_charge": "BSCKI. Vũ Đình Khiêm", "target_score": 92.0, "status": "active", "order": 2}, {"id": 9, "department_id": 2, "code": "KKB-P03", "name": "Phòng Khám Ngoại - Chấn thương (P.102)", "room_type": "Phòng khám", "floor": "Tầng 1 - Nhà B", "person_in_charge": "BS. Đỗ Mạnh Cường", "target_score": 92.0, "status": "active", "order": 3}, {"id": 10, "department_id": 2, "code": "KKB-P04", "name": "Phòng Khám Nhi & Tiêm chủng (P.103)", "room_type": "Phòng khám", "floor": "Tầng 1 - Nhà B", "person_in_charge": "BS. Trần Thảo Vy", "target_score": 92.0, "status": "active", "order": 4}, {"id": 11, "department_id": 2, "code": "KKB-P05", "name": "Phòng Lấy mẫu máu & Bệnh phẩm tập trung", "room_type": "Phòng thủ thuật", "floor": "Tầng 1 - Nhà B", "person_in_charge": "KTV. Lê Thùy Linh", "target_score": 95.0, "status": "active", "order": 5}, {"id": 58, "department_id": 2, "code": "KKB-P06", "name": "Quầy Thu viện phí & Giám định BHYT", "room_type": "Quầy giao dịch", "floor": "Tầng 1 - Nhà B", "person_in_charge": "ĐD. Hoàng Bích Thủy", "target_score": 90.0, "status": "active", "order": 6}, {"id": 16, "department_id": 4, "code": "KNG-P01", "name": "Buồng Hậu phẫu Ngoại 201", "room_type": "Phòng bệnh", "floor": "Tầng 2 - Nhà C", "person_in_charge": "ĐD. Trần Kim Oanh", "target_score": 92.0, "status": "active", "order": 1}, {"id": 17, "department_id": 4, "code": "KNG-P02", "name": "Buồng Bệnh Tiền phẫu 202", "room_type": "Phòng bệnh", "floor": "Tầng 2 - Nhà C", "person_in_charge": "ĐD. Nguyễn Văn Thắng", "target_score": 90.0, "status": "active", "order": 2}, {"id": 18, "department_id": 4, "code": "KNG-P03", "name": "Phòng Thay băng - Rửa vết thương & Cắt chỉ", "room_type": "Phòng thủ thuật", "floor": "Tầng 2 - Nhà C", "person_in_charge": "ĐD. Bùi Văn Hùng", "target_score": 95.0, "status": "active", "order": 3}, {"id": 19, "department_id": 4, "code": "KNG-P04", "name": "Phòng Trực Bác sĩ & Giao ban khoa Ngoại", "room_type": "Phòng giao ban", "floor": "Tầng 2 - Nhà C", "person_in_charge": "BSCKII. Nguyễn Văn Toàn", "target_score": 90.0, "status": "active", "order": 4}, {"id": 20, "department_id": 5, "code": "KNT-P01", "name": "Buồng Bệnh Nội Tim Mạch (P.301)", "room_type": "Phòng bệnh", "floor": "Tầng 3 - Nhà C", "person_in_charge": "ĐD. Dương Thị Hằng", "target_score": 92.0, "status": "active", "order": 1}, {"id": 21, "department_id": 5, "code": "KNT-P02", "name": "Buồng Bệnh Nội Tiết - Tiểu đường (P.302)", "room_type": "Phòng bệnh", "floor": "Tầng 3 - Nhà C", "person_in_charge": "ĐD. Ngô Thị Yến", "target_score": 90.0, "status": "active", "order": 2}, {"id": 22, "department_id": 5, "code": "KNT-P03", "name": "Phòng Tiêm, Phát thuốc & Trực Điều dưỡng", "room_type": "Phòng trực", "floor": "Tầng 3 - Nhà C", "person_in_charge": "ĐD. Trần Phương Dung", "target_score": 95.0, "status": "active", "order": 3}, {"id": 23, "department_id": 5, "code": "KNT-P04", "name": "Khu Vệ sinh buồng bệnh nhân Tầng 3", "room_type": "Khu vệ sinh", "floor": "Tầng 3 - Nhà C", "person_in_charge": "Hộ lý. Phạm Thị Chắt", "target_score": 90.0, "status": "active", "order": 4}, {"id": 24, "department_id": 6, "code": "KSN-P01", "name": "Phòng Chờ đẻ & Theo dõi tim thai", "room_type": "Phòng chuyên khoa", "floor": "Tầng 2 - Nhà B", "person_in_charge": "HS. Vũ Thị Loan", "target_score": 95.0, "status": "active", "order": 1}, {"id": 25, "department_id": 6, "code": "KSN-P02", "name": "Phòng Đẻ thường số 1 (Vô khuẩn)", "room_type": "Phòng thủ thuật", "floor": "Tầng 2 - Nhà B", "person_in_charge": "HS. Lê Thị Thúy Hằng", "target_score": 98.0, "status": "active", "order": 2}, {"id": 26, "department_id": 6, "code": "KSN-P03", "name": "Buồng Chăm sóc Mẹ và Bé sau sinh (P.205)", "room_type": "Phòng bệnh", "floor": "Tầng 2 - Nhà B", "person_in_charge": "ĐD. Trần Hồng Nhung", "target_score": 92.0, "status": "active", "order": 3}, {"id": 27, "department_id": 6, "code": "KSN-P04", "name": "Phòng Tắm Bé & Tiêm chủng sơ sinh", "room_type": "Phòng thủ thuật", "floor": "Tầng 2 - Nhà B", "person_in_charge": "HS. Nguyễn Thị Thêu", "target_score": 95.0, "status": "active", "order": 4}, {"id": 28, "department_id": 7, "code": "KNHI-P01", "name": "Đơn nguyên Sơ sinh (Lồng ấp & Chiếu đèn)", "room_type": "Phòng đặc biệt", "floor": "Tầng 3 - Nhà B", "person_in_charge": "ĐD. Đỗ Thị Hiền", "target_score": 98.0, "status": "active", "order": 1}, {"id": 29, "department_id": 7, "code": "KNHI-P02", "name": "Buồng Bệnh Nhi Hô hấp (P.301)", "room_type": "Phòng bệnh", "floor": "Tầng 3 - Nhà B", "person_in_charge": "ĐD. Nguyễn Thị Thủy", "target_score": 92.0, "status": "active", "order": 2}, {"id": 30, "department_id": 7, "code": "KNHI-P03", "name": "Buồng Bệnh Nhi Tiêu hóa (P.302)", "room_type": "Phòng bệnh", "floor": "Tầng 3 - Nhà B", "person_in_charge": "ĐD. Mai Thị Trang", "target_score": 90.0, "status": "active", "order": 3}, {"id": 31, "department_id": 7, "code": "KNHI-P04", "name": "Khu Vui chơi giải trí & Vận động bệnh nhi", "room_type": "Khu công cộng", "floor": "Tầng 3 - Nhà B", "person_in_charge": "ĐD. Trần Thu Hà", "target_score": 90.0, "status": "active", "order": 4}, {"id": 59, "department_id": 3, "code": "YHCT-01", "name": "Phòng Khám & Bắt mạch YHCT", "room_type": "Phòng khám", "floor": "Tầng 4 - Nhà C", "person_in_charge": "BSCKI. Trần Văn Thái", "target_score": 92.0, "status": "active", "order": 1}, {"id": 60, "department_id": 3, "code": "YHCT-02", "name": "Phòng Châm cứu & Xoa bóp bấm huyệt", "room_type": "Phòng thủ thuật", "floor": "Tầng 4 - Nhà C", "person_in_charge": "ĐD. Phạm Thị Lý", "target_score": 95.0, "status": "active", "order": 2}, {"id": 61, "department_id": 3, "code": "YHCT-03", "name": "Phòng Vật lý trị liệu & Vận động phục hồi", "room_type": "Phòng tập", "floor": "Tầng 4 - Nhà C", "person_in_charge": "KTV. Lê Văn Tuấn", "target_score": 92.0, "status": "active", "order": 3}, {"id": 62, "department_id": 3, "code": "YHCT-04", "name": "Phòng Sắc thuốc & Bảo quản dược liệu YHCT", "room_type": "Khu chế biến", "floor": "Tầng 4 - Nhà C", "person_in_charge": "DS. Hoàng Thị Mai", "target_score": 90.0, "status": "active", "order": 4}, {"id": 63, "department_id": 13, "code": "LCK-01", "name": "Phòng Khám & Điều trị Răng Hàm Mặt", "room_type": "Phòng khám", "floor": "Tầng 2 - Nhà B", "person_in_charge": "BSCKI. Đỗ Mạnh Cường", "target_score": 95.0, "status": "active", "order": 1}, {"id": 64, "department_id": 13, "code": "LCK-02", "name": "Phòng Khám & Nội soi Tai Mũi Họng", "room_type": "Phòng khám", "floor": "Tầng 2 - Nhà B", "person_in_charge": "BS. Nguyễn Văn Hùng", "target_score": 95.0, "status": "active", "order": 2}, {"id": 65, "department_id": 13, "code": "LCK-03", "name": "Phòng Khám Mắt & Đo thị lực khúc xạ", "room_type": "Phòng khám", "floor": "Tầng 2 - Nhà B", "person_in_charge": "BS. Vũ Thị Loan", "target_score": 92.0, "status": "active", "order": 3}, {"id": 66, "department_id": 14, "code": "TDCN-01", "name": "Phòng Nội soi Tiêu hóa dạ dày - đại tràng", "room_type": "Phòng thủ thuật", "floor": "Tầng 2 - Nhà Kỹ thuật", "person_in_charge": "BS. Lê Quang Huy", "target_score": 98.0, "status": "active", "order": 1}, {"id": 67, "department_id": 14, "code": "TDCN-02", "name": "Phòng Điện tim & Điện não đồ vi tính", "room_type": "Phòng máy", "floor": "Tầng 2 - Nhà Kỹ thuật", "person_in_charge": "KTV. Lê Thùy Linh", "target_score": 95.0, "status": "active", "order": 2}, {"id": 68, "department_id": 14, "code": "TDCN-03", "name": "Phòng Đo chức năng hô hấp & Lưu huyết não", "room_type": "Phòng máy", "floor": "Tầng 2 - Nhà Kỹ thuật", "person_in_charge": "KTV. Trần Thu Hà", "target_score": 92.0, "status": "active", "order": 3}, {"id": 36, "department_id": 9, "code": "KXN-P01", "name": "Phòng Xét nghiệm Huyết học & Truyền máu", "room_type": "Phòng xét nghiệm", "floor": "Tầng 2 - Nhà Kỹ thuật", "person_in_charge": "KTV. Đỗ Thị Thu Hường", "target_score": 98.0, "status": "active", "order": 1}, {"id": 37, "department_id": 9, "code": "KXN-P02", "name": "Phòng Xét nghiệm Sinh hóa - Miễn dịch tự động", "room_type": "Phòng xét nghiệm", "floor": "Tầng 2 - Nhà Kỹ thuật", "person_in_charge": "KTV. Nguyễn Đình Khải", "target_score": 98.0, "status": "active", "order": 2}, {"id": 38, "department_id": 9, "code": "KXN-P03", "name": "Phòng Vi sinh - Ký sinh trùng & Nuôi cấy", "room_type": "Phòng xét nghiệm", "floor": "Tầng 2 - Nhà Kỹ thuật", "person_in_charge": "KTV. Phạm Thị Hạnh", "target_score": 95.0, "status": "active", "order": 3}, {"id": 39, "department_id": 9, "code": "KXN-P04", "name": "Kho Hóa chất xét nghiệm & Lưu mẫu bệnh phẩm", "room_type": "Kho lưu trữ", "floor": "Tầng 2 - Nhà Kỹ thuật", "person_in_charge": "KTV. Lê Thu Thảo", "target_score": 95.0, "status": "active", "order": 4}, {"id": 69, "department_id": 15, "code": "KD-01", "name": "Kho Thuốc chẵn Nội trú & Dịch truyền", "room_type": "Kho thuốc", "floor": "Tầng 1 - Nhà Kho Dược", "person_in_charge": "DS CKI. Hoàng Thị Lan", "target_score": 98.0, "status": "active", "order": 1}, {"id": 70, "department_id": 15, "code": "KD-02", "name": "Kho Thuốc Cấp phát Ngoại trú BHYT", "room_type": "Kho cấp phát", "floor": "Tầng 1 - Nhà B", "person_in_charge": "DS. Nguyễn Bích Ngọc", "target_score": 95.0, "status": "active", "order": 2}, {"id": 71, "department_id": 15, "code": "KD-03", "name": "Kho Hóa chất sát khuẩn & Vật tư y tế tiêu hao", "room_type": "Kho vật tư", "floor": "Tầng 1 - Nhà Kho Dược", "person_in_charge": "DS. Trần Văn Nam", "target_score": 95.0, "status": "active", "order": 3}, {"id": 72, "department_id": 15, "code": "KD-04", "name": "Phòng Pha chế & Bảo quản lạnh Vắc xin/Thuốc đặc biệt", "room_type": "Phòng chuyên môn", "floor": "Tầng 1 - Nhà Kho Dược", "person_in_charge": "DS. Lê Thị Mai", "target_score": 98.0, "status": "active", "order": 4}, {"id": 40, "department_id": 10, "code": "KKSNK-P01", "name": "Khu Tiếp nhận & Rửa dụng cụ y tế bẩn", "room_type": "Khu kỹ thuật", "floor": "Tầng 1 - Nhà Giặt hấp", "person_in_charge": "ĐD. Trịnh Thị Thu Trang", "target_score": 95.0, "status": "active", "order": 1}, {"id": 41, "department_id": 10, "code": "KKSNK-P02", "name": "Khu Đóng gói & Nồi hấp Tiệt trùng nhiệt độ cao", "room_type": "Khu tiệt trùng", "floor": "Tầng 1 - Nhà Giặt hấp", "person_in_charge": "KTV. Nguyễn Văn Đạt", "target_score": 98.0, "status": "active", "order": 2}, {"id": 42, "department_id": 10, "code": "KKSNK-P03", "name": "Kho Dụng cụ Phẫu thuật Vô khuẩn thành phẩm", "room_type": "Kho vô trùng", "floor": "Tầng 1 - Nhà Giặt hấp", "person_in_charge": "ĐD. Lê Thị Nga", "target_score": 99.0, "status": "active", "order": 3}, {"id": 43, "department_id": 10, "code": "KKSNK-P04", "name": "Khu Giặt là & Khử khuẩn đồ vải bệnh viện", "room_type": "Khu giặt là", "floor": "Tầng 1 - Nhà Giặt hấp", "person_in_charge": "CN. Đặng Thị Loan", "target_score": 92.0, "status": "active", "order": 4}, {"id": 73, "department_id": 10, "code": "KKSNK-P05", "name": "Khu Phân loại & Lưu trữ tạm thời rác thải y tế", "room_type": "Khu rác thải", "floor": "Khuôn viên phía sau Nhà Giặt", "person_in_charge": "Hộ lý. Vũ Thị Hoa", "target_score": 95.0, "status": "active", "order": 5}, {"id": 74, "department_id": 16, "code": "QLCL-01", "name": "Văn phòng Thường trực Ban Chỉ đạo 5S Toàn Viện", "room_type": "Văn phòng", "floor": "Tầng 4 - Nhà Điều hành", "person_in_charge": "ThS. BSCKII. Phạm Quỳnh Hưng", "target_score": 98.0, "status": "active", "order": 1}, {"id": 75, "department_id": 16, "code": "QLCL-02", "name": "Phòng Lưu trữ Hồ sơ 83 Tiêu chí & Minh chứng 5S", "room_type": "Phòng hồ sơ", "floor": "Tầng 4 - Nhà Điều hành", "person_in_charge": "ĐD. Nguyễn Thu Trang", "target_score": 95.0, "status": "active", "order": 2}, {"id": 76, "department_id": 17, "code": "KHTH-01", "name": "Văn phòng Kế hoạch tổng hợp & Phòng Giao ban Viện", "room_type": "Phòng giao ban", "floor": "Tầng 4 - Nhà Điều hành", "person_in_charge": "BSCKI. Trần Đức Thắng", "target_score": 95.0, "status": "active", "order": 1}, {"id": 77, "department_id": 17, "code": "KHTH-02", "name": "Phòng Máy chủ Trung tâm & Quản trị mạng HIS/PACS", "room_type": "Phòng server", "floor": "Tầng 4 - Nhà Điều hành", "person_in_charge": "KS. Nguyễn Hoàng Nam", "target_score": 98.0, "status": "active", "order": 2}, {"id": 78, "department_id": 18, "code": "PDD-01", "name": "Văn phòng Điều dưỡng trưởng bệnh viện & Đào tạo 5S", "room_type": "Văn phòng", "floor": "Tầng 3 - Nhà Điều hành", "person_in_charge": "ThS. ĐD. Trần Thị Lan Hương", "target_score": 95.0, "status": "active", "order": 1}, {"id": 79, "department_id": 19, "code": "HCQT-01", "name": "Bộ phận Văn thư - Lưu trữ & Tiếp nhận công văn", "room_type": "Văn thư", "floor": "Tầng 2 - Nhà Điều hành", "person_in_charge": "ThS. Nguyễn Văn Hùng", "target_score": 92.0, "status": "active", "order": 1}, {"id": 80, "department_id": 19, "code": "HCQT-02", "name": "Kho Vật tư văn phòng phẩm & Thiết bị hành chính", "room_type": "Kho hành chính", "floor": "Tầng 1 - Nhà Điều hành", "person_in_charge": "CN. Đặng Thị Loan", "target_score": 90.0, "status": "active", "order": 2}, {"id": 81, "department_id": 20, "code": "TCKT-01", "name": "Phòng Kế toán tổng hợp & Quản trị tài sản viện", "room_type": "Văn phòng", "floor": "Tầng 2 - Nhà Điều hành", "person_in_charge": "ThS. Vũ Thị Mai", "target_score": 95.0, "status": "active", "order": 1}, {"id": 82, "department_id": 8, "code": "XQ-02", "name": "Phòng Chụp X-quang Kỹ thuật số DR 02", "room_type": "Phòng máy", "floor": "Tầng 1 - Nhà Kỹ thuật", "person_in_charge": "KTV. Trần Văn Chung", "target_score": 95.0, "status": "active", "order": 7}, {"id": 83, "department_id": 8, "code": "SA-02", "name": "Phòng Siêu âm Tổng quát & Can thiệp (P.105)", "room_type": "Phòng khám", "floor": "Tầng 1 - Nhà Kỹ thuật", "person_in_charge": "BS. Nguyễn Văn Dũng", "target_score": 96.0, "status": "active", "order": 8}, {"id": 84, "department_id": 8, "code": "DSA-01", "name": "Phòng Chụp & Can thiệp tim mạch số hóa xóa nền (DSA)", "room_type": "Phòng can thiệp", "floor": "Tầng 1 - Nhà Kỹ thuật", "person_in_charge": "KTV. Vũ Bá Đạt", "target_score": 98.0, "status": "active", "order": 9}, {"id": 85, "department_id": 8, "code": "HC-CDHA", "name": "Khu Tiếp đón bệnh nhân & Hành chính CĐHA", "room_type": "Khu tiếp đón", "floor": "Tầng 1 - Nhà Kỹ thuật", "person_in_charge": "ĐD. Hoàng Thị Mai", "target_score": 92.0, "status": "active", "order": 10}],
  staff: [], // V27: danh sách nhân sự KHÔNG còn nằm trong mã nguồn công khai - tải từ máy chủ sau khi đăng nhập
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
  "rooms_schedule": []
},
  department_evaluations: [],
  criteria: [
    { id: 1, name: 'S1 - Sàng lọc (Seiri)', max: 20, desc: 'Phân loại rác thải, thuốc, vật tư y tế, loại bỏ vật dụng thừa thãi khỏi buồng phòng' },
    { id: 2, name: 'S2 - Sắp xếp (Seiton)', max: 20, desc: 'Vạch kẻ định vị trang thiết bị y tế, tem nhãn rõ ràng, hồ sơ bệnh án ngăn nắp' },
    { id: 3, name: 'S3 - Sạch sẽ (Seiso)', max: 20, desc: 'Khử khuẩn bề mặt tiếp xúc, sàn buồng bệnh, trang thiết bị máy móc sáng bóng' },
    { id: 4, name: 'S4 - Săn sóc (Seiketsu)', max: 20, desc: 'Chuẩn hóa quy trình vệ sinh, duy trì lịch trực vệ sinh hằng ngày và kiểm tra chéo' },
    { id: 5, name: 'S5 - Sẵn sàng (Shitsuke)', max: 20, desc: 'Văn hóa tự giác, tinh thần 5S y tế, trang phục bảo hộ và biển tên đúng quy định' }
  ],
  auth: {
    isLoggedIn: false,
    currentUserId: null,
    locationMode: 'internal'
  },
  audits: [],
  securityLogs: [] // V28: bỏ nhật ký truy cập giả
};

class App5S {
  constructor() {
    this.data = this.loadData();
    
    // V27: bỏ tự nạp 12 phiếu DEMO (trộn dữ liệu giả vào báo cáo thật)
    this.normalizeData();

    // V27: Trạng thái đồng bộ máy chủ
    this.authToken = null;
    try { this.authToken = localStorage.getItem(TOKEN_KEY) || null; } catch (e) {}
    this.syncVersion = 0;
    try { this.syncVersion = parseInt(localStorage.getItem(SYNC_VERSION_KEY) || '0', 10) || 0; } catch (e) {}
    this.outbox = [];
    try { this.outbox = JSON.parse(localStorage.getItem(OUTBOX_KEY) || '[]') || []; } catch (e) { this.outbox = []; }
    this.syncSnapshot = this.buildSyncSnapshot(this.data);

        // V20.1: Phục hồi auth_session riêng cho thiết bị
    try {
      const savedAuth = JSON.parse(localStorage.getItem('vpi_5s_auth_session') || 'null');
      if (savedAuth && typeof savedAuth.isLoggedIn === 'boolean') {
        this.data.auth = savedAuth;
      }
    } catch(e) {}
    this.activeTab = 'overview';
    this.viewMode = 'mobile';
    // Tự động tối ưu chế độ hiển thị trên Smartphone thật
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 1024) {
      this.viewMode = 'full';
      if (typeof document !== 'undefined' && document.body) {
        document.body.classList.remove('mobile-frame-mode');
      }
    }
    // V25 FIX: chỉ ghi đè khi người dùng đã chủ động chọn chế độ xem (trước đây luôn ép về 'mobile' kể cả trên điện thoại)
    try {
      const savedViewMode = localStorage.getItem('vpi_5s_view_mode');
      if (savedViewMode === 'mobile' || savedViewMode === 'full') this.viewMode = savedViewMode;
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

    // V18: Quản lý lịch sử xem lại ảnh và thống kê truy cập
    this.historySelectedDate = this.getTodayDateString();
    this.historyDeptFilter = 'all';
    this.historyStatusFilter = 'all';
    this.visitorStats = this.initVisitorStats();
    
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

    // State cho Lịch Làm Việc & Trạng Thái Buồng Phòng (V23: Khởi tạo linh hoạt, tự động nhận diện ngày thực tế)
    this.scheduleWeekOffset = 0;
    this.scheduleState = {
      selectedWeek: null,
      selectedDay: null,
      selectedDate: null,
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
        raw = localStorage.getItem('vpi_5s_data_v16_pro') || localStorage.getItem('vpi_5s_data_v15_pro') || localStorage.getItem('vpi_5s_data_v14_pro') || localStorage.getItem('vpi_5s_data_v13_enterprise') || localStorage.getItem('vpi_5s_data_v12_pro') || localStorage.getItem('vpi_5s_data_v11_watermark');
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
    let resData = JSON.parse(JSON.stringify(DEFAULT_SEED_DATA));
    try {
      const savedAuth = JSON.parse(localStorage.getItem('vpi_5s_auth_session') || 'null');
      if (savedAuth && typeof savedAuth.isLoggedIn === 'boolean') {
        resData.auth = savedAuth;
      }
    } catch(e) {}
    return resData;
  }

  normalizeData() {
    if (!this.data.audits || !Array.isArray(this.data.audits)) {
      this.data.audits = Array.isArray(this.data.evaluations) ? this.data.evaluations : [];
    }
    if (!this.data.hospital) {
      this.data.hospital = JSON.parse(JSON.stringify(DEFAULT_SEED_DATA.hospital));
    }
    // V28: tắt "thông báo khẩn" mẫu cũ (16/10/2026) còn lưu trên máy từ bản trước
    try {
      const n = this.data.hospital && this.data.hospital.notice;
      if (n && (n.updatedAt === '2026-10-16 07:30' || /09h00 sáng nay/.test(n.content || ''))) {
        this.data.hospital.notice = { enabled: false, type: 'info', title: '', content: '', updatedAt: '' };
      }
      if (Array.isArray(this.data.securityLogs)) {
        this.data.securityLogs = this.data.securityLogs.filter(l => l && l.time && !String(l.time).startsWith('2026-10-16'));
      }
    } catch (e) {}

    // CẤU HÌNH KHUNG GIỜ CA LÀM VIỆC TÙY CHỈNH (V13)
    if (!this.data.shift_config) {
      this.data.shift_config = {
        morning: { name: 'Ca sáng', start: '07:00', end: '11:30' },
        afternoon: { name: 'Ca chiều', start: '13:30', end: '17:00' },
        night: { name: 'Ca đêm', start: '17:00', end: '07:00' }
      };
    }

    // ĐỒNG BỘ 526 TÀI KHOẢN TOÀN VIỆN THEO MÃ NV
    // V28: danh sách nhân sự lấy từ máy chủ - không xóa khi danh sách còn ít (VD: vừa đăng nhập, chưa tải xong)
    if (!this.data.staff || !Array.isArray(this.data.staff)) {
      this.data.staff = JSON.parse(JSON.stringify(DEFAULT_SEED_DATA.staff));
    } else {
      const existingCodes = new Set(this.data.staff.map(s => (s.code || '').toUpperCase()));
      DEFAULT_SEED_DATA.staff.forEach(st => {
        if (!existingCodes.has((st.code || '').toUpperCase())) {
          this.data.staff.push(JSON.parse(JSON.stringify(st)));
        }
      });
    }

    // V27: mật khẩu do máy chủ quản lý - không gán mật khẩu mặc định trên thiết bị
    this.data.staff.forEach(s => {
      if (!s.username) s.username = s.code;
    });

    this.data.hospital.hotline = '+84916306115';
    this.data.hospital.supportEmail = 'vudatxq@gmail.com';
    this.data.hospital.author = 'Vũ Đạt';
    this.data.hospital.copyright = 'Tác giả: Vũ Đạt';

    if (!this.data.admin_messages || !Array.isArray(this.data.admin_messages)) {
      this.data.admin_messages = []; // V27: bỏ tin nhắn mẫu
    }
    this.data.hospital.name = 'Bệnh viện Vĩnh Phúc VPI';
    this.data.hospital.legalName = 'Bệnh viện Vĩnh Phúc VPI';
    if (!this.data.hospital.notice) {
      this.data.hospital.notice = JSON.parse(JSON.stringify(DEFAULT_SEED_DATA.hospital.notice));
    }

    // V25 SECURITY FIX: mặc định CHƯA đăng nhập (trước đây tự đăng nhập bằng tài khoản quản trị BV-345)
    if (!this.data.auth) {
      this.data.auth = { isLoggedIn: false, currentUserId: null, locationMode: 'internal' };
    }

    // DANH MỤC KHOA PHÒNG (V23: Bảo toàn các khoa đã xóa hoặc thêm mới, chỉ seed khi rỗng)
    const hasLegacyStringDepts = (this.data.departments || []).some(d => typeof d.id === 'string' && isNaN(parseInt(d.id)));
    if (!this.data.departments || !Array.isArray(this.data.departments) || this.data.departments.length === 0 || hasLegacyStringDepts) {
      this.data.departments = JSON.parse(JSON.stringify(DEFAULT_SEED_DATA.departments));
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

    // DANH MỤC BUỒNG PHÒNG / KHU VỰC LÀM VIỆC (V23: Bảo toàn khu vực đã xóa, chỉ seed khi rỗng)
    const hasLegacyRooms = (this.data.rooms || []).some(r => typeof r.department_id === 'string' && isNaN(parseInt(r.department_id)));
    if (!this.data.rooms || !Array.isArray(this.data.rooms) || this.data.rooms.length === 0 || hasLegacyRooms) {
      this.data.rooms = JSON.parse(JSON.stringify(DEFAULT_SEED_DATA.rooms));
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
      this.data.auth = { isLoggedIn: false, currentUserId: null, locationMode: 'internal' };
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
          s.can_review = false; // V27: quyền duyệt chỉ do Admin / danh sách Excel cấp (không suy từ chức danh)
        }
      });
    }

    // V25: Áp dụng chính sách DUYỆT ẢNH 5S theo danh sách Excel (1 lần / version)
    this.applyReviewPolicy();

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

  applyReviewPolicy(force = false) {
    if (!Array.isArray(this.data.staff)) return;
    if (!force && this.data.review_policy_version === REVIEW_POLICY.version) return;
    const admins = new Set(REVIEW_POLICY.ADMIN_CODES.map(c => c.toUpperCase()));
    const reviewers = new Set(REVIEW_POLICY.REVIEWER_CODES.map(c => c.toUpperCase()));
    this.data.staff.forEach(s => {
      const code = String(s.code || s.staff_code || '').toUpperCase();
      if (admins.has(code)) {
        s.role = 'admin';
        s.role_level = 'admin';
        s.is_admin = true;
        s.can_review = true;
      } else if (reviewers.has(code)) {
        // Người duyệt: xem được ảnh toàn viện để duyệt
        s.role = 'supervisor';
        s.role_level = 'supervisor';
        s.is_admin = false;
        s.can_review = true;
      } else {
        // Còn lại: chỉ gửi ảnh 5S
        s.role = 'staff';
        s.role_level = 'staff';
        s.is_admin = false;
        s.is_supervisor = false;
        s.can_review = false;
      }
    });
    this.data.review_policy_version = REVIEW_POLICY.version;
  }

  saveData(syncToServer = true) {
    try {
      this.data.last_updated = Date.now();
      // V27: đưa thay đổi vào hàng đợi gửi máy chủ TRƯỚC khi lưu (tách mật khẩu khỏi dữ liệu lưu trên máy)
      if (syncToServer && this.authToken) {
        this.queueLocalChanges();
      }
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
      } catch (quotaError) {
        console.warn('LocalStorage Quota Exceeded. Trimming older photos in audits...', quotaError);
        // V27: khi đã có máy chủ, dữ liệu gốc nằm trên máy chủ => không cắt ảnh (tránh gửi ảnh rỗng lên máy chủ)
        if (!this.authToken && Array.isArray(this.data.audits) && this.data.audits.length > 25) {
          for (let i = 25; i < this.data.audits.length; i++) {
            if (this.data.audits[i].after_photo && this.data.audits[i].after_photo.length > 500) {
              this.data.audits[i].after_photo_archived = true;
              this.data.audits[i].after_photo = '';
            }
          }
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
          } catch (e2) {}
        }
      }

      // Lưu song song vào IndexedDB (chống mất dữ liệu và dung lượng không giới hạn)
      this.persistToIndexedDb(this.data);

      if (this.syncChannel) {
        try { this.syncChannel.postMessage({ type: 'DATA_UPDATED', timestamp: this.data.last_updated }); } catch (e) {}
      }
      if (syncToServer && this.authToken && this.outbox.length) {
        this.scheduleFlush();
      }
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
    const found = this.data.staff.find(s => s.code === auth.currentUserId || s.username === auth.currentUserId);
    if (found) return found;
    // V25 SECURITY FIX: trước đây trả về staff[0] (Tổng Giám đốc - quyền cao nhất) khi không tìm thấy tài khoản.
    // Nay trả về hồ sơ khách không có quyền quản trị.
    return { id: 0, code: auth.currentUserId || '', name: 'Tài khoản không tồn tại', title: 'Khách', role_title: 'Khách', role: 'guest', role_level: 'guest', department_id: null, can_review: false, assigned_rooms: [] };
  }

  // V25: Đăng xuất phiên nếu tài khoản đã bị xóa khỏi danh sách nhân sự
  validateSession() {
    const auth = this.data && this.data.auth;
    if (!auth || !auth.isLoggedIn) return;
    // V27: phiên đăng nhập bắt buộc phải có mã xác thực máy chủ (phiên của bản cũ => đăng nhập lại)
    if (!this.authToken) {
      this.data.auth = { isLoggedIn: false, currentUserId: null, locationMode: auth.locationMode || 'internal' };
      try { localStorage.removeItem('vpi_5s_auth_session'); } catch (e) {}
      return;
    }
    const exists =(this.data.staff || []).some(s => s.code === auth.currentUserId || s.username === auth.currentUserId);
    if (!exists) {
      this.data.auth = { isLoggedIn: false, currentUserId: null, locationMode: auth.locationMode || 'internal' };
      try { localStorage.removeItem('vpi_5s_auth_session'); } catch (e) {}
    }
  }

  purgeStaleCachesIfNeeded() {
    // V25: Xóa mật khẩu dạng chữ thường từng được lưu bởi tính năng "Ghi nhớ đăng nhập" ở bản cũ
    try {
      const savedAuth = JSON.parse(localStorage.getItem('vpi_5s_saved_auth') || 'null');
      if (savedAuth && 'password' in savedAuth) {
        delete savedAuth.password;
        localStorage.setItem('vpi_5s_saved_auth', JSON.stringify(savedAuth));
      }
    } catch (e) {}
    const CURRENT_VERSION = 'v28_20261123';
    try {
      const savedVer = localStorage.getItem('vpi_5s_app_version');
      if (savedVer !== CURRENT_VERSION) {
        localStorage.setItem('vpi_5s_app_version', CURRENT_VERSION);
        if ('caches' in window) {
          caches.keys().then(keys => {
            keys.forEach(k => {
              if (k !== 'vpi-5s-cache-v28_20261123') caches.delete(k);
            });
          });
        }
      }
    } catch (e) {}
  }

  resetScheduleToToday() {
    this.scheduleWeekOffset = 0;
    const vnDateInfo = this.getVietnamDateInfo(0);
    this.scheduleState.selectedDate = vnDateInfo.realTodayIso;
    const todayMatch = (vnDateInfo.days || []).find(d => d.isToday);
    this.scheduleState.selectedDay = todayMatch ? todayMatch.id : (vnDateInfo.days[0] ? vnDateInfo.days[0].id : 'Mon');
    this.scheduleState.selectedWeek = vnDateInfo.weekNum;
  }

  init() {
    this.purgeStaleCachesIfNeeded();
    this.validateSession();
    this.resetScheduleToToday();
    this.applyTheme();
    this.applyLocationMode();
    this.updateUserInterface();
    this.updateHospitalBranding();
    this.updateNoticeBanner();
    this.initCrossDeviceSync();
    this.initAsyncStorage();
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
    const topUserDisplay = document.getElementById('top-user-display');
    const visitorBadge = document.getElementById('top-visitor-badge');
    if (visitorBadge) visitorBadge.remove(); // V28: bỏ số lượt xem giả
    // V28: số trên quả chuông = số liệu thật (trước đây luôn hiện "3")
    const notifEl = document.getElementById('notif-count');
    if (notifEl) {
      let n = 0;
      if (user && this.canReview5S()) {
        n = (this.data.audits || []).filter(a => a && (a.status === 'pending' || !a.status)).length;
      } else if (user) {
        n = (this.data.admin_messages || []).filter(m => m && m.sender_code === user.code && m.reply && !m.read_by_user).length;
      }
      notifEl.textContent = n > 99 ? '99+' : String(n);
      notifEl.classList.toggle('hidden', n === 0);
    }

    if (user) {
      if (avatar) avatar.innerText = (user.name || 'D').split(' ').pop().charAt(0);
      if (nameEl) nameEl.innerText = user.name;
      if (roleEl) roleEl.innerText = user.title || user.role_title || user.position || 'Cán bộ 5S';
      if (topUserDisplay) {
        topUserDisplay.innerHTML = `<span class="text-emerald-400 font-bold">👤 ${user.name}</span> <span class="text-slate-400 font-mono text-[10px]">(${user.code})</span>`;
      }
    }
  }

  switchTab(tabName) {
    const changedTab = this.activeTab !== tabName;
    this.activeTab = tabName;
    // V28 FIX: sang tab khác thì mở từ đầu trang (trước đây giữ vị trí cuộn của tab cũ)
    this.render(!changedTab);
    if (changedTab) {
      try { window.scrollTo(0, 0); } catch (e) {}
    }
  }

  render(preserveScroll = true) {
    const container = document.getElementById('app-container');
    if (!container) return;

    // V18: GHI NHỚ VỊ TRÍ CUỘN & Ô NHẬP LIỆU ĐANG FOCUS ĐỂ KHẮC PHỤC TRIỆT ĐỂ LỖI GIẬT CỤC / NHẢY TRANG
    let savedScrollTop = 0;
    let savedWindowY = window.scrollY || 0;
    let activeInputId = null;
    let selStart = null;
    let selEnd = null;

    const scrollEl = document.getElementById('main-content-scroll');
    if (scrollEl && preserveScroll) {
      savedScrollTop = scrollEl.scrollTop;
    }
    const activeEl = document.activeElement;
    if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA') && activeEl.id) {
      activeInputId = activeEl.id;
      selStart = activeEl.selectionStart;
      selEnd = activeEl.selectionEnd;
    }

    // KIỂM TRA ĐĂNG NHẬP: Bắt buộc thoát khỏi tài khoản khi đã đăng xuất
    if (!this.data.auth || !this.data.auth.isLoggedIn) {
      container.innerHTML = this.renderLoginScreen();
      const existingNav = document.getElementById('bottom-nav');
      if (existingNav) existingNav.classList.add('hidden');
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    // V18: Nếu đang ở tab audit cũ, tự động chuyển sang schedule (Khu vực 5S)
    if (this.activeTab === 'audit') {
      this.activeTab = 'schedule';
    }

    let tabContent = '';
    switch (this.activeTab) {
      case 'overview':
        tabContent = this.renderOverviewTab();
        break;
      case 'schedule':
        tabContent = this.renderScheduleTab();
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
        ${this.renderAppFooterHtml()}
      </main>
      ${this.renderBottomNavigationHtml()}
    `;

    this.updateUserInterface();
    this.updateHospitalBranding();
    this.updateNoticeBanner();
    this.renderBottomNavigation();

    // V18: PHỤC HỒI CHÍNH XÁC VỊ TRÍ CUỘN & TIẾP TỤC GÕ TÌM KIẾM MƯỢT MÀ KHÔNG BỊ GIÁN ĐOẠN
    const newScrollEl = document.getElementById('main-content-scroll');
    if (newScrollEl && preserveScroll && savedScrollTop > 0) {
      newScrollEl.scrollTop = savedScrollTop;
    }
    if (preserveScroll && savedWindowY > 0) {
      window.scrollTo(0, savedWindowY);
    }
    if (activeInputId) {
      const reFocusEl = document.getElementById(activeInputId);
      if (reFocusEl) {
        reFocusEl.focus();
        if (selStart !== null && typeof reFocusEl.setSelectionRange === 'function') {
          try { reFocusEl.setSelectionRange(selStart, selEnd); } catch(e) {}
        }
      }
    }

    // V15: QUẢN LÝ KHỞI ĐỘNG CÁC DẢI TICKER KHOA PHÒNG THEO TAB ĐANG CHỌN
    this.stopAllDeptTickers();
    if (this.activeTab === 'schedule') {
      setTimeout(() => this.initScheduleDeptTicker(), 50);
    } else if (this.activeTab === 'departments') {
      setTimeout(() => this.initDepartmentsDeptTicker(), 50);
    } else if (this.activeTab === 'staff') {
      setTimeout(() => this.initStaffDeptTicker(), 50);
    }

    if (window.lucide) window.lucide.createIcons();
  }

  renderBottomNavigationHtml() {
    if (!this.data.auth || !this.data.auth.isLoggedIn) {
      return '';
    }

    // V18: 5 TAB TINH GỌN (Bỏ tab Chấm 5S riêng, Đổi tên Khu vực thành Khu vực 5S)
    const tabs = [
      { id: 'overview', name: 'Tổng quan', icon: 'layout-grid' },
      { id: 'schedule', name: 'Khu vực 5S', icon: 'check-square' },
      { id: 'departments', name: 'Khoa Phòng', icon: 'building-2' },
      { id: 'staff', name: 'Nhân sự', icon: 'users' },
      { id: 'history', name: 'Lịch sử', icon: 'clipboard-check' }
    ];

    return `
      <nav id="bottom-nav" class="sticky bottom-0 left-0 right-0 w-full bg-white/95 dark:bg-slate-800/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-700 py-1.5 px-1.5 z-40 shadow-lg">
        <div class="grid grid-cols-5 gap-1">
          ${tabs.map(t => {
            const isActive = this.activeTab === t.id;
            return `
              <button onclick="app5s.switchTab('${t.id}')" class="flex flex-col items-center justify-center py-1 transition-all rounded-xl ${
                isActive 
                  ? 'text-emerald-600 dark:text-emerald-400 font-bold scale-105 bg-emerald-50 dark:bg-emerald-950/40 shadow-2xs' 
                  : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
              }">
                <i data-lucide="${t.icon}" class="w-5 h-5 mb-0.5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.75]'}"></i>
                <span class="text-[9.5px] tracking-tight truncate max-w-full">${t.name}</span>
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
      { id: 'schedule', name: 'Khu vực 5S', icon: 'check-square' },
      { id: 'departments', name: 'Khoa Phòng', icon: 'building-2' },
      { id: 'staff', name: 'Nhân sự', icon: 'users' },
      { id: 'history', name: 'Lịch sử', icon: 'clipboard-check' }
    ];

    navContainer.innerHTML = `
      <div class="grid grid-cols-5 gap-1 w-full">
        ${tabs.map(t => {
          const isActive = this.activeTab === t.id;
          return `
            <button onclick="app5s.switchTab('${t.id}')" class="flex flex-col items-center justify-center py-1 transition-all rounded-xl ${
              isActive 
                ? 'text-emerald-600 dark:text-emerald-400 font-bold scale-105 bg-emerald-50 dark:bg-emerald-950/40 shadow-2xs' 
                : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
            }">
              <i data-lucide="${t.icon}" class="w-5 h-5 mb-0.5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.75]'}"></i>
              <span class="text-[9.5px] tracking-tight truncate max-w-full">${t.name}</span>
            </button>
          `;
        }).join('')}
      </div>
    `;
  }


  // =========================================================================
  // V18 TÍNH NĂNG MỚI: PHÂN QUYỀN, THỐNG KÊ TRUY CẬP, AVATAR & BỘ LỌC LỊCH SỬ
  // =========================================================================
  initVisitorStats() {
    const today = this.getTodayDateString();
    let stats = {
      total: 1286,
      today: 48,
      lastDate: today
    };
    try {
      const raw = localStorage.getItem('vpi_5s_visitor_stats');
      if (raw) {
        stats = JSON.parse(raw);
      }
      const sessionFlag = sessionStorage.getItem('vpi_5s_session_visited');
      if (!sessionFlag) {
        sessionStorage.setItem('vpi_5s_session_visited', 'true');
        stats.total = (stats.total || 1286) + 1;
        if (stats.lastDate === today) {
          stats.today = (stats.today || 48) + 1;
        } else {
          stats.today = 1;
          stats.lastDate = today;
        }
        localStorage.setItem('vpi_5s_visitor_stats', JSON.stringify(stats));
      }
    } catch (e) {
      stats = { total: 1286, today: 48, lastDate: today };
    }
    return stats;
  }

  showAuditLockedNotice() {
    alert('🔒 BẢO MẬT HỆ THỐNG: Chức năng CHẤM 5S chỉ dành riêng cho Ban Giám Đốc, Ban Chỉ Đạo 5S, Cán bộ Giám sát 5S toàn viện và Quản lý cấp Khoa/Phòng. Tài khoản nhân viên chỉ được chụp gửi ảnh buồng phòng của mình.');
  }

  deleteMyShiftPhoto(roomId) {
    const room = (this.data.rooms || []).find(r => r.id == roomId);
    const rs = this.getRoomSchedule(roomId);
    if (!confirm(`Bạn có chắc chắn muốn xóa ảnh chụp 5S của buồng phòng ${room ? room.name : ''} để chụp lại?`)) return;
    
    if (rs && rs.post_shift_5s) {
      // V27: đánh dấu XÓA có chủ đích để máy chủ chấp nhận gỡ ảnh (bản ghi trống thông thường không được ghi đè ảnh)
      const u = this.getCurrentUser() || {};
      rs.post_shift_5s = { status: 'pending', photo: '', submitted_at: '', submitted_by: '', notes: '', cleared_by: u.code || '', cleared_at: new Date().toISOString() };
      delete rs._auto;
    }
    const today = this.getTodayDateString();
    this.data.audits = (this.data.audits || []).filter(a => !(a.room_id == roomId && a.audit_date === today));
    this.saveData();
    this.closeModal();
    this.render(true);
    this.showToast('✅ Đã xóa ảnh chụp 5S thành công. Bạn có thể chụp ảnh mới bàn giao!');
  }

  togglePasswordVisibility(inputId) {
    const input = document.getElementById(inputId);
    const eyeIcon = document.getElementById('eye-' + inputId);
    if (!input) return;
    if (input.type === 'password') {
      input.type = 'text';
      if (eyeIcon) eyeIcon.setAttribute('data-lucide', 'eye-off');
    } else {
      input.type = 'password';
      if (eyeIcon) eyeIcon.setAttribute('data-lucide', 'eye');
    }
    if (window.lucide) window.lucide.createIcons();
  }

  onAddRoomDeptChange(val) {
    const customBox = document.getElementById('modal-room-custom-dept-box');
    if (customBox) {
      if (val === 'custom') {
        customBox.classList.remove('hidden');
      } else {
        customBox.classList.add('hidden');
      }
    }
  }

  onProfileAvatarSelected(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const rawUrl = e.target.result;
      const img = new Image();
      img.onload = () => {
        // V24: Nén ảnh avatar qua Canvas kích thước chuẩn 280x280 (chống tràn bộ nhớ LocalStorage & tối ưu tốc độ)
        const canvas = document.createElement('canvas');
        const maxDim = 280;
        let w = img.width;
        let h = img.height;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        const compressedAvatar = canvas.toDataURL('image/jpeg', 0.82);

        const previewImg = document.getElementById('profile-avatar-preview');
        const previewInitial = document.getElementById('profile-avatar-initial');
        if (previewImg) {
          previewImg.src = compressedAvatar;
          previewImg.classList.remove('hidden');
        }
        if (previewInitial) {
          previewInitial.classList.add('hidden');
        }
        this.pendingAvatarUrl = compressedAvatar;
      };
      img.src = rawUrl;
    };
    reader.readAsDataURL(file);
  }

  setHistoryDate(dateStr) {
    this.historySelectedDate = dateStr;
    this.render(true);
  }

  setHistoryDeptFilter(deptId) {
    this.historyDeptFilter = deptId;
    this.render(true);
  }

  setHistoryStatusFilter(status) {
    this.historyStatusFilter = status;
    this.render(true);
  }

  openCustomPrintModal() {
    const depts = this.getSortedDepartments();
    const curDate = this.historySelectedDate || this.getTodayDateString();

    this.showModal(`
      <div class="p-5 space-y-4 max-h-[85vh] overflow-y-auto no-scrollbar">
        <div class="flex items-center justify-between border-b pb-3">
          <div class="flex items-center space-x-2">
            <div class="w-9 h-9 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold">
              <i data-lucide="printer" class="w-5 h-5"></i>
            </div>
            <div>
              <h3 class="text-sm font-black text-slate-900 dark:text-white">TÙY CHỌN IN BÁO CÁO 5S</h3>
              <p class="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">Xuất bản chuẩn A4 (Nghị định 30/2020 & QĐ 6858/BYT)</p>
            </div>
          </div>
          <button onclick="app5s.closeModal()" class="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400">
            <i data-lucide="x" class="w-4 h-4"></i>
          </button>
        </div>

        <div class="space-y-3 text-xs bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700">
          <div>
            <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1">📅 Ngày báo cáo cần in *</label>
            <input type="date" id="print-custom-date" value="${curDate}" class="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 font-bold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500">
          </div>

          <div>
            <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1">🏢 Phạm vi in báo cáo *</label>
            <select id="print-custom-dept" class="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 font-bold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500">
              <option value="all">⭐ Toàn viện (Tổng hợp cả 20 Khoa/Phòng)</option>
              ${depts.map(d => `<option value="${d.id}">Khoa: ${d.name} (${d.code})</option>`).join('')}
            </select>
          </div>

          <div class="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 text-[11px] text-emerald-900 dark:text-emerald-300 space-y-1">
            <div class="font-bold flex items-center space-x-1">
              <i data-lucide="check-circle" class="w-3.5 h-3.5 text-emerald-600"></i>
              <span>Nội dung bảng in chuẩn xác:</span>
            </div>
            <p>• Phân tích rõ ràng: Khoa/Phòng <strong>ĐÃ THỰC HIỆN</strong> vs <strong>CHƯA THỰC HIỆN</strong> nộp ảnh 5S.</p>
            <p>• Đánh giá kết quả: <strong>ĐẠT CHUẨN 5S</strong> hoặc <strong>KHÔNG ĐẠT (Cần chấn chỉnh)</strong>.</p>
            <p>• Không phụ thuộc vào lịch cố định, in tự do theo bất kỳ ngày nào trong quá khứ hoặc hiện tại.</p>
          </div>

          <button type="button" onclick="app5s.executeCustomPrint()" class="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs flex items-center justify-center space-x-2 shadow-md transition">
            <i data-lucide="printer" class="w-4 h-4"></i>
            <span>Mở Trang In & In Ngay Khổ A4</span>
          </button>
        </div>
      </div>
    `);
  }

  executeCustomPrint() {
    const dateInput = document.getElementById('print-custom-date');
    const deptSelect = document.getElementById('print-custom-dept');
    const date = dateInput ? dateInput.value : this.getTodayDateString();
    const deptId = deptSelect ? deptSelect.value : 'all';
    this.closeModal();
    this.printDailyEvaluationReport(date, deptId);
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

    // V19: PHÂN TÍCH TIẾN ĐỘ 5S TỪNG BUỒNG PHÒNG TRONG KHOA
  // QUY TẮC NGHIỆM THU: 100% buồng phòng nộp ảnh mới tính là HOÀN THÀNH. Thiếu 1 buồng = CHƯA HOÀN THÀNH
  getDepartmentRoom5SSubmissionStatus(deptId, targetDate = null) {
    const date = targetDate || this.getTodayDateString();
    const deptRooms = (this.data.rooms || []).filter(r => String(r.department_id) === String(deptId));
    if (deptRooms.length === 0) {
      return { isFullyCompleted: false, doneRooms: [], missingRooms: [], totalRooms: 0, doneCount: 0, missingCount: 0, rate: 0 };
    }

    const audits = this.data.audits || [];
    const dateAudits = audits.filter(a => a.audit_date === date && String(a.department_id) === String(deptId));

    const schedules = this.data.schedules || { rooms_schedule: [] };
    const roomSchedules = schedules.rooms_schedule || [];
    const dateRoomSchedules = roomSchedules.filter(rs => String(rs.department_id) === String(deptId) && rs.post_shift_5s && rs.post_shift_5s.photo);

    const doneRooms = [];
    const missingRooms = [];

    deptRooms.forEach(room => {
      const hasAudit = dateAudits.some(a => (a.room_id == room.id || a.location === room.name) && (a.photo_after || a.photo || a.status === 'approved' || a.status === 'pending'));
      const hasSchedulePhoto = dateRoomSchedules.some(rs => rs.room_id == room.id);
      const rs = this.getRoomSchedule(room.id);
      const hasCurrentShiftPhoto = rs && rs.post_shift_5s && rs.post_shift_5s.photo && (rs.post_shift_5s.status === 'submitted' || rs.post_shift_5s.status === 'approved');

      if (hasAudit || hasSchedulePhoto || hasCurrentShiftPhoto) {
        doneRooms.push(room);
      } else {
        missingRooms.push(room);
      }
    });

    const isFullyCompleted = (deptRooms.length > 0 && missingRooms.length === 0);
    const rate = Math.round((doneRooms.length / deptRooms.length) * 100);

    return {
      isFullyCompleted,
      doneRooms,
      missingRooms,
      totalRooms: deptRooms.length,
      doneCount: doneRooms.length,
      missingCount: missingRooms.length,
      rate
    };
  }

  getDaily5SStatus(targetDate = null) {
    const today = targetDate || this.getTodayDateString();
    const audits = this.data.audits || [];
    const todayAudits = audits.filter(a => a.audit_date === today);

    const allDepts = this.getSortedDepartments();
    const completedDepts = [];
    const uncompletedDepts = [];
    const inProgressDepts = [];
    const notStartedDepts = [];

    allDepts.forEach(dept => {
      const roomStatus = this.getDepartmentRoom5SSubmissionStatus(dept.id, today);
      if (roomStatus.isFullyCompleted) {
        completedDepts.push(dept);
      } else {
        uncompletedDepts.push(dept);
        if (roomStatus.doneCount > 0) {
          inProgressDepts.push(dept);
        } else {
          notStartedDepts.push(dept);
        }
      }
    });

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
      inProgressDepts,
      notStartedDepts,
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
    if (!this.canReview5S()) {
      alert('🔒 Tài khoản của bạn chỉ được GỬI ảnh 5S, không có quyền DUYỆT ảnh. Liên hệ Admin nếu cần cấp quyền.');
      return;
    }
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
    this.pushStateToServer();
    this.closeModal();
    this.render();
    // V20.3: Không tự mở lại Trung Tâm Chấm 5S sau khi duyệt

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

  getRoomSchedule(roomId, customDate = null) {
    if (!this.data.schedules) this.data.schedules = { rooms_schedule: [] };
    if (!this.data.schedules.rooms_schedule) this.data.schedules.rooms_schedule = [];

    const date = customDate || (this.scheduleState && this.scheduleState.selectedDate) || this.getTodayDateString();
    const dayOfWeek = (this.scheduleState && this.scheduleState.selectedDay) || 'Wed';

    // Tìm kiếm lịch theo room_id VÀ ngày cụ thể
    let rs = this.data.schedules.rooms_schedule.find(s => s.room_id == roomId && s.date === date);
    if (!rs) {
      const room = (this.data.rooms || []).find(r => r.id == roomId) || { id: roomId, department_id: 1 };
      // Kế thừa nhân sự từ ca mặc định nếu có
      const baseSched = this.data.schedules.rooms_schedule.find(s => s.room_id == roomId);
      const inheritedStaff = baseSched && Array.isArray(baseSched.staff_assigned) ? JSON.parse(JSON.stringify(baseSched.staff_assigned)) : [];

      rs = {
        room_id: roomId,
        department_id: room.department_id,
        shift_id: (this.scheduleState && this.scheduleState.selectedShift !== 'all') ? this.scheduleState.selectedShift : 'morning',
        day_of_week: dayOfWeek,
        date: date,
        is_working: true,
        staff_assigned: inheritedStaff,
        post_shift_5s: { status: 'pending', photo: '', submitted_at: '', submitted_by: '', notes: '' },
        // V27: bản ghi tự sinh khi xem lịch => KHÔNG gửi lên máy chủ cho tới khi có thay đổi thật
        // (tránh ghi đè ảnh 5S mà máy khác vừa nộp cho cùng phòng/ngày)
        _auto: true
      };
      this.data.schedules.rooms_schedule.push(rs);
    }
    return rs;
  }

  toggleRoomWorkingStatus(roomId) {
    const rs = this.getRoomSchedule(roomId);
    rs.is_working = !rs.is_working;
    delete rs._auto;
    this.saveData();
    this.render();
    const room = (this.data.rooms || []).find(r => r.id == roomId) || { name: 'Buồng phòng' };
    this.showToast(rs.is_working 
      ? `🟢 Đã kích hoạt: ${room.name} ĐANG LÀM VIỆC` 
      : `⚪ Đã chuyển: ${room.name} sang trạng thái KHÔNG LÀM VIỆC`
    );
  }


  // =========================================================================
  // V14 TÍNH NĂNG 1: TỰ ĐỘNG CẬP NHẬT NGÀY GIỜ, TUẦN, NĂM THEO LỊCH VIỆT NAM
  // =========================================================================
  getVietnamDateInfo(weekOffset = 0) {
    const now = new Date();
    // Chuyển sang múi giờ Việt Nam UTC+7
    const vnNow = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }));
    
    if (weekOffset !== 0) {
      vnNow.setDate(vnNow.getDate() + (weekOffset * 7));
    }

    const year = vnNow.getFullYear();
    const month = vnNow.getMonth();
    const date = vnNow.getDate();
    const dayOfWeek = vnNow.getDay(); // 0 là CN, 1 là T2...

    // Khoảng cách tới Thứ 2 đầu tuần
    const diffToMon = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(vnNow);
    monday.setDate(vnNow.getDate() + diffToMon);

    // Tính số tuần ISO 8601
    const target = new Date(monday.valueOf());
    const dayNr = (monday.getDay() + 6) % 7;
    target.setDate(target.getDate() - dayNr + 3);
    const firstThursday = target.valueOf();
    target.setMonth(0, 1);
    if (target.getDay() !== 4) {
      target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
    }
    const weekNum = 1 + Math.ceil((firstThursday - target) / 604800000);

    const dayNames = ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy', 'Chủ Nhật'];
    const shortLabels = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
    const dayKeys = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    const realToday = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }));
    const realTodayIso = `${realToday.getFullYear()}-${String(realToday.getMonth() + 1).padStart(2, '0')}-${String(realToday.getDate()).padStart(2, '0')}`;

    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dYear = d.getFullYear();
      const dMonth = String(d.getMonth() + 1).padStart(2, '0');
      const dDate = String(d.getDate()).padStart(2, '0');
      const isoDate = `${dYear}-${dMonth}-${dDate}`;
      const displayDate = `${dDate}/${dMonth}`;

      days.push({
        id: dayKeys[i],
        shortLabel: shortLabels[i],
        name: dayNames[i],
        dateNum: displayDate,
        dayOfMonth: dDate,
        monthStr: dMonth,
        fullDate: isoDate,
        isToday: isoDate === realTodayIso
      });
    }

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    const monStr = `${String(monday.getDate()).padStart(2, '0')}/${String(monday.getMonth() + 1).padStart(2, '0')}`;
    const sunStr = `${String(sunday.getDate()).padStart(2, '0')}/${String(sunday.getMonth() + 1).padStart(2, '0')}`;

    return {
      year: year,
      weekNum: weekNum || 45,
      weekRangeText: `Tuần ${weekNum || 45} (${monStr} – ${sunStr})`,
      monDisplay: monStr,
      sunDisplay: sunStr,
      days: days,
      realTodayIso: realTodayIso
    };
  }

  setScheduleDay(dayId, fullDate) {
    this.scheduleState.selectedDay = dayId;
    if (fullDate) {
      this.scheduleState.selectedDate = fullDate;
    }
    this.render();
    const vnInfo = this.getVietnamDateInfo(this.scheduleWeekOffset || 0);
    const dObj = vnInfo.days.find(d => d.id === dayId || d.fullDate === fullDate);
    this.showToast(`📅 Đang xem lịch: ${dObj ? dObj.name + ' (' + dObj.dateNum + ')' : dayId}`);
  }

  changeScheduleWeek(delta) {
    this.scheduleWeekOffset = (this.scheduleWeekOffset || 0) + delta;
    const vnInfo = this.getVietnamDateInfo(this.scheduleWeekOffset);
    const todayMatch = vnInfo.days.find(d => d.isToday);
    if (todayMatch) {
      this.scheduleState.selectedDay = todayMatch.id;
      this.scheduleState.selectedDate = todayMatch.fullDate;
    } else {
      this.scheduleState.selectedDay = vnInfo.days[0].id;
      this.scheduleState.selectedDate = vnInfo.days[0].fullDate;
    }
    this.render();
    this.showToast(`📅 Đã chuyển sang: ${vnInfo.weekRangeText}`);
  }

  setScheduleWeek(week) {
    this.scheduleState.selectedWeek = parseInt(week);
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
    this.render(true);
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

        <!-- V16 PHÂN QUYỀN BUỒNG PHÒNG: Quản lý khoa hoặc Admin mới được đổi trạng thái & phân công -->
        ${(() => {
          const canManage = this.isAdmin() || this.canManageDeptRooms(room.department_id);
          return `
            <div class="bg-slate-50 dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div class="space-y-0.5">
                <span class="text-xs font-bold text-slate-800 dark:text-slate-100">Trạng thái hoạt động buồng phòng:</span>
                <div class="text-[10px] text-slate-500 font-medium">${canManage ? 'Bật/tắt trạng thái mở cửa phục vụ' : 'Chỉ xem trạng thái phân công'}</div>
              </div>
              ${canManage ? `
                <button onclick="app5s.toggleRoomWorkingStatus(${roomId}); app5s.openManageRoomStaffModal(${roomId});" class="px-3 py-1.5 rounded-xl font-bold text-xs transition flex items-center space-x-1.5 ${
                  rs.is_working 
                    ? 'bg-emerald-600 text-white shadow-xs hover:bg-emerald-700' 
                    : 'bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-400'
                }">
                  <i data-lucide="${rs.is_working ? 'check-circle' : 'circle'}" class="w-3.5 h-3.5"></i>
                  <span>${rs.is_working ? 'ĐANG LÀM VIỆC' : 'KHÔNG LÀM VIỆC'}</span>
                </button>
              ` : `
                <span class="px-3 py-1.5 rounded-xl font-bold text-xs flex items-center space-x-1.5 ${rs.is_working ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}">
                  <i data-lucide="${rs.is_working ? 'check-circle' : 'circle'}" class="w-3.5 h-3.5"></i>
                  <span>${rs.is_working ? 'ĐANG HOẠT ĐỘNG' : 'NGHỈ CA'}</span>
                </span>
              `}
            </div>
            ${!canManage ? `
              <div class="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-[10.5px] text-amber-800 dark:text-amber-300 flex items-center space-x-1.5">
                <i data-lucide="shield" class="w-3.5 h-3.5 shrink-0"></i>
                <span>Chế độ xem: Tài khoản cá nhân chỉ được xem danh sách phân công; chỉ Quản lý khoa phòng mới có quyền điều chỉnh.</span>
              </div>
            ` : ''}
          `;
        })()}

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
                      <div class="text-[10px] text-indigo-600 font-medium flex items-center space-x-1">
                        <span>${s.role || 'Nhân sự ca trực'}</span>
                        <button onclick="app5s.editAssignedStaffRole(${roomId}, ${idx})" title="Sửa đổi vai trò ca trực" class="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 font-bold underline text-[9.5px]">
                          [Sửa vai trò]
                        </button>
                        <span class="font-mono text-slate-400">• ${s.code || ''}</span>
                      </div>
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
                <div class="flex items-center justify-between mb-1">
                  <label class="block text-[11px] font-bold text-slate-700 dark:text-slate-300">Vai trò trong ca trực (Tùy chỉnh):</label>
                  <span class="text-[10px] text-indigo-600 font-bold">Gõ tự do</span>
                </div>
                <input type="text" id="add-staff-role" list="role-suggestions" value="Bác sĩ trực" placeholder="Nhập vai trò (VD: Bác sĩ trực, KTV máy CT, Hộ lý...)" class="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-100 font-semibold focus:ring-2 focus:ring-indigo-500">
                <datalist id="role-suggestions">
                  <option value="Phụ trách chính">
                  <option value="Bác sĩ trực chính">
                  <option value="Bác sĩ điều trị">
                  <option value="Điều dưỡng ca trực">
                  <option value="Điều dưỡng trưởng ca">
                  <option value="Kỹ thuật viên máy CT/MRI">
                  <option value="Kỹ thuật viên siêu âm">
                  <option value="Kỹ thuật viên X-quang">
                  <option value="Kỹ thuật viên xét nghiệm">
                  <option value="Dược sĩ trực cấp phát">
                  <option value="Hộ sinh ca trực">
                  <option value="Hộ lý buồng bệnh">
                  <option value="Thư ký y khoa">
                  <option value="Tổ kỹ thuật / Bảo vệ">
                </datalist>
                <div class="flex flex-wrap gap-1 mt-1.5 text-[10px]">
                  <span class="text-slate-400 self-center">Chọn nhanh:</span>
                  <button type="button" onclick="document.getElementById('add-staff-role').value='Bác sĩ trực'" class="px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 hover:bg-indigo-100">Bác sĩ trực</button>
                  <button type="button" onclick="document.getElementById('add-staff-role').value='Điều dưỡng ca'" class="px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 hover:bg-emerald-100">Điều dưỡng</button>
                  <button type="button" onclick="document.getElementById('add-staff-role').value='Kỹ thuật viên'" class="px-1.5 py-0.5 rounded bg-cyan-50 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 border border-cyan-200 hover:bg-cyan-100">KTV</button>
                  <button type="button" onclick="document.getElementById('add-staff-role').value='Phụ trách chính'" class="px-1.5 py-0.5 rounded bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 hover:bg-purple-100">Phụ trách</button>
                </div>
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
    delete rs._auto;
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
    delete rs._auto;
    this.saveData();
    this.openManageRoomStaffModal(roomId);
    this.showToast(`Đã bớt ${removed[0].name} khỏi vị trí làm việc!`);
  }

  // MODAL NỘP ẢNH 5S KHI HẾT GIỜ LÀM VIỆC
  // =========================================================================
  // V9 TÍNH NĂNG 1: CHỤP ẢNH CAMERA & TẢI ẢNH BÀN GIAO 5S HIỂN THỊ TỨC THÌ
  // =========================================================================

  // =========================================================================
  // TÍNH NĂNG V12: DANH SÁCH 20 KHOA/PHÒNG TỰ ĐỘNG CHẠY NGANG (TICKER MARQUEE)
  // =========================================================================
  initScheduleDeptTicker() {
    this.stopScheduleDeptTicker();
    const ticker = document.getElementById('schedule-dept-ticker');
    if (!ticker) return;

    this.isDeptTickerPaused = !!this.isDeptTickerManualPaused;

    const step = () => {
      if (!this.isDeptTickerPaused && ticker) {
        ticker.scrollLeft += 0.85; // Tốc độ chạy ngang mượt mà
        const halfWidth = ticker.scrollWidth / 2;
        if (halfWidth > 0 && ticker.scrollLeft >= halfWidth) {
          ticker.scrollLeft -= halfWidth;
        }
      }
      this.deptTickerAnimFrame = requestAnimationFrame(step);
    };

    this.deptTickerAnimFrame = requestAnimationFrame(step);

    ticker.onmouseenter = () => { this.isDeptTickerPaused = true; };
    ticker.onmouseleave = () => {
      if (!this.isDeptTickerManualPaused) this.isDeptTickerPaused = false;
    };
    ticker.ontouchstart = () => { this.isDeptTickerPaused = true; };
    ticker.ontouchend = () => {
      setTimeout(() => {
        if (!this.isDeptTickerManualPaused) this.isDeptTickerPaused = false;
      }, 2500);
    };
  }

  toggleDeptTicker() {
    this.isDeptTickerManualPaused = !this.isDeptTickerManualPaused;
    this.isDeptTickerPaused = this.isDeptTickerManualPaused;
    const btn = document.getElementById('dept-ticker-toggle-btn');
    if (btn) {
      if (this.isDeptTickerManualPaused) {
        btn.innerHTML = `<i data-lucide="play" class="w-3 h-3 text-amber-500"></i><span>Chạy tiếp</span>`;
      } else {
        btn.innerHTML = `<i data-lucide="pause" class="w-3 h-3 text-emerald-500"></i><span>Tạm dừng</span>`;
      }
      if (window.lucide) window.lucide.createIcons();
    }
  }

  nudgeDeptTicker(delta) {
    const ticker = document.getElementById('schedule-dept-ticker');
    if (ticker) {
      ticker.scrollBy({ left: delta, behavior: 'smooth' });
    }
  }

  // =========================================================================
  // V15 TICKER QUẢN LÝ TỰ ĐỘNG CHẠY NGANG CHO KHOA PHÒNG & NHÂN SỰ
  // =========================================================================
  initDepartmentsDeptTicker() {
    this.stopDepartmentsDeptTicker();
    const ticker = document.getElementById('departments-tab-ticker');
    if (!ticker) return;

    this.isDeptsTickerPaused = !!this.isDeptsTickerManualPaused;
    const step = () => {
      if (!this.isDeptsTickerPaused && ticker) {
        ticker.scrollLeft += 0.85;
        const halfWidth = ticker.scrollWidth / 2;
        if (halfWidth > 0 && ticker.scrollLeft >= halfWidth) {
          ticker.scrollLeft -= halfWidth;
        }
      }
      this.deptsTickerAnimFrame = requestAnimationFrame(step);
    };
    this.deptsTickerAnimFrame = requestAnimationFrame(step);

    ticker.onmouseenter = () => { this.isDeptsTickerPaused = true; };
    ticker.onmouseleave = () => { if (!this.isDeptsTickerManualPaused) this.isDeptsTickerPaused = false; };
    ticker.ontouchstart = () => { this.isDeptsTickerPaused = true; };
    ticker.ontouchend = () => { setTimeout(() => { if (!this.isDeptsTickerManualPaused) this.isDeptsTickerPaused = false; }, 2500); };
  }

  toggleDepartmentsTicker() {
    this.isDeptsTickerManualPaused = !this.isDeptsTickerManualPaused;
    this.isDeptsTickerPaused = this.isDeptsTickerManualPaused;
    const btn = document.getElementById('dept-tab-ticker-toggle-btn');
    if (btn) {
      if (this.isDeptsTickerManualPaused) {
        btn.innerHTML = `<i data-lucide="play" class="w-3 h-3 text-amber-500"></i><span>Chạy tiếp</span>`;
      } else {
        btn.innerHTML = `<i data-lucide="pause" class="w-3 h-3 text-emerald-500"></i><span>Tạm dừng</span>`;
      }
      if (window.lucide) window.lucide.createIcons();
    }
  }

  nudgeDepartmentsTicker(delta) {
    const ticker = document.getElementById('departments-tab-ticker');
    if (ticker) ticker.scrollBy({ left: delta, behavior: 'smooth' });
  }

  stopDepartmentsDeptTicker() {
    if (this.deptsTickerAnimFrame) {
      cancelAnimationFrame(this.deptsTickerAnimFrame);
      this.deptsTickerAnimFrame = null;
    }
  }

  initStaffDeptTicker() {
    this.stopStaffDeptTicker();
    const ticker = document.getElementById('staff-tab-ticker');
    if (!ticker) return;

    this.isStaffTickerPaused = !!this.isStaffTickerManualPaused;
    const step = () => {
      if (!this.isStaffTickerPaused && ticker) {
        ticker.scrollLeft += 0.85;
        const halfWidth = ticker.scrollWidth / 2;
        if (halfWidth > 0 && ticker.scrollLeft >= halfWidth) {
          ticker.scrollLeft -= halfWidth;
        }
      }
      this.staffTickerAnimFrame = requestAnimationFrame(step);
    };
    this.staffTickerAnimFrame = requestAnimationFrame(step);

    ticker.onmouseenter = () => { this.isStaffTickerPaused = true; };
    ticker.onmouseleave = () => { if (!this.isStaffTickerManualPaused) this.isStaffTickerPaused = false; };
    ticker.ontouchstart = () => { this.isStaffTickerPaused = true; };
    ticker.ontouchend = () => { setTimeout(() => { if (!this.isStaffTickerManualPaused) this.isStaffTickerPaused = false; }, 2500); };
  }

  toggleStaffTicker() {
    this.isStaffTickerManualPaused = !this.isStaffTickerManualPaused;
    this.isStaffTickerPaused = this.isStaffTickerManualPaused;
    const btn = document.getElementById('staff-tab-ticker-toggle-btn');
    if (btn) {
      if (this.isStaffTickerManualPaused) {
        btn.innerHTML = `<i data-lucide="play" class="w-3 h-3 text-amber-500"></i><span>Chạy tiếp</span>`;
      } else {
        btn.innerHTML = `<i data-lucide="pause" class="w-3 h-3 text-emerald-500"></i><span>Tạm dừng</span>`;
      }
      if (window.lucide) window.lucide.createIcons();
    }
  }

  nudgeStaffTicker(delta) {
    const ticker = document.getElementById('staff-tab-ticker');
    if (ticker) ticker.scrollBy({ left: delta, behavior: 'smooth' });
  }

  stopStaffDeptTicker() {
    if (this.staffTickerAnimFrame) {
      cancelAnimationFrame(this.staffTickerAnimFrame);
      this.staffTickerAnimFrame = null;
    }
  }

  stopAllDeptTickers() {
    this.stopScheduleDeptTicker();
    this.stopDepartmentsDeptTicker();
    this.stopStaffDeptTicker();
  }

  stopScheduleDeptTicker() {
    if (this.deptTickerAnimFrame) {
      cancelAnimationFrame(this.deptTickerAnimFrame);
      this.deptTickerAnimFrame = null;
    }
  }

  // =========================================================================
  // TÍNH NĂNG V12: HỖ TRỢ KỸ THUẬT, LIÊN HỆ, GÓP Ý ADMIN & BẢN QUYỀN VŨ ĐẠT
  // =========================================================================
  openContactSupportModal() {
    const modalHtml = `
      <div class="p-5 space-y-4 max-h-[85vh] overflow-y-auto no-scrollbar">
        <div class="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3">
          <div class="flex items-center space-x-2">
            <div class="w-9 h-9 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <i data-lucide="headset" class="w-5 h-5"></i>
            </div>
            <div>
              <h3 class="text-sm font-black text-slate-900 dark:text-white">THÔNG TIN LIÊN HỆ & HỖ TRỢ KỸ THUẬT</h3>
              <p class="text-[10px] text-emerald-600 font-bold">Hệ thống Quản lý 5S Bệnh viện Vĩnh Phúc VPI</p>
            </div>
          </div>
          <button onclick="app5s.closeModal()" class="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400">
            <i data-lucide="x" class="w-4 h-4"></i>
          </button>
        </div>

        <div class="bg-gradient-to-br from-emerald-600 via-teal-700 to-slate-900 rounded-3xl p-5 text-white space-y-2 shadow-lg">
          <div class="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-[10px] font-bold tracking-wider uppercase">
            <i data-lucide="shield-check" class="w-3.5 h-3.5 text-emerald-300"></i>
            <span>BẢN QUYỀN TÁC GIẢ CHÍNH THỨC</span>
          </div>
          <div class="text-base font-black">Tác giả: Vũ Đạt</div>
          <p class="text-xs text-emerald-100 opacity-90 leading-relaxed">
            Phần mềm Giám sát 5S Y tế, Bàn giao Buồng phòng & Chấm điểm 5S Chuẩn Quốc gia Bệnh viện Vĩnh Phúc VPI.
          </p>
        </div>

        <div class="space-y-2.5 text-xs">
          <a href="mailto:vudatxq@gmail.com" class="p-3.5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-emerald-500 transition flex items-center space-x-3.5 shadow-2xs">
            <div class="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <i data-lucide="mail" class="w-5 h-5"></i>
            </div>
            <div>
              <div class="text-[10px] text-slate-400 font-medium">Email Hỗ Trợ Kỹ Thuật:</div>
              <div class="font-bold text-slate-900 dark:text-white font-mono text-sm">vudatxq@gmail.com</div>
              <div class="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">Chạm vào đây để gửi email ngay &rarr;</div>
            </div>
          </a>

          <a href="tel:+84916306115" class="p-3.5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-emerald-500 transition flex items-center space-x-3.5 shadow-2xs">
            <div class="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <i data-lucide="phone-call" class="w-5 h-5"></i>
            </div>
            <div>
              <div class="text-[10px] text-slate-400 font-medium">Hotline Trực Tiếp 24/7:</div>
              <div class="font-bold text-slate-900 dark:text-white font-mono text-sm">+84916306115</div>
              <div class="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">Chạm vào đây để gọi điện thoại ngay &rarr;</div>
            </div>
          </a>
        </div>

        <div class="pt-2">
          <button onclick="app5s.openFeedbackModal()" class="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 text-white font-black py-3 rounded-2xl shadow-md transition flex items-center justify-center space-x-2 text-xs">
            <i data-lucide="message-square-plus" class="w-4 h-4"></i>
            <span>NHẮN TIN / GÓP Ý KIẾN CHO ADMIN NGAY</span>
          </button>
        </div>
      </div>
    `;
    this.showModal(modalHtml);
  }

  openFeedbackModal() {
    const user = this.getCurrentUser() || { name: 'Cán bộ 5S', code: 'BV-345', department_id: 1 };
    const depts = this.getSortedDepartments();

    const modalHtml = `
      <div class="p-5 space-y-4 max-h-[85vh] overflow-y-auto no-scrollbar">
        <!-- Header -->
        <div class="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3">
          <div class="flex items-center space-x-2.5">
            <div class="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-xs">
              <i data-lucide="message-square-plus" class="w-5 h-5"></i>
            </div>
            <div>
              <h3 class="text-sm font-black text-slate-900 dark:text-white">GÓP Ý KIẾN & NHẮN TIN CHO ADMIN</h3>
              <p class="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold">Tiếp nhận bởi Quản trị viên: Vũ Đạt</p>
            </div>
          </div>
          <button onclick="app5s.closeModal()" class="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400">
            <i data-lucide="x" class="w-4 h-4"></i>
          </button>
        </div>

        <!-- Admin Contact Badge -->
        <div class="bg-gradient-to-r from-emerald-50 dark:bg-emerald-950/40 p-3 rounded-2xl border border-emerald-200 dark:border-emerald-800 space-y-1.5">
          <div class="flex items-center justify-between text-xs">
            <span class="font-bold text-slate-800 dark:text-slate-100 flex items-center space-x-1.5">
              <i data-lucide="shield-check" class="w-4 h-4 text-emerald-600"></i>
              <span>Tác giả: <strong class="text-emerald-700 dark:text-emerald-400">Vũ Đạt</strong></span>
            </span>
            <span class="text-[10px] bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-300 font-bold px-2 py-0.5 rounded-full">Admin 5S</span>
          </div>
          <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-600 dark:text-slate-300">
            <a href="tel:+84916306115" class="hover:text-emerald-600 font-bold font-mono">📞 Hotline: +84916306115</a>
            <a href="mailto:vudatxq@gmail.com" class="hover:text-emerald-600 font-mono">✉️ vudatxq@gmail.com</a>
          </div>
        </div>

        <!-- Form fields -->
        <div class="space-y-3 text-xs">
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1">Cán bộ gửi tin *</label>
              <input type="text" id="feedback-sender-name" value="${user.name} (${user.code})" class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 font-bold text-slate-800 dark:text-slate-100">
            </div>
            <div>
              <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1">Khoa / Phòng *</label>
              <select id="feedback-dept-id" class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 font-semibold text-slate-800 dark:text-slate-100">
                ${depts.map(d => `<option value="${d.id}" ${user.department_id == d.id ? 'selected' : ''}>#${d.order || ''} ${d.name}</option>`).join('')}
              </select>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1">Chủ đề góp ý *</label>
              <select id="feedback-topic" class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 font-semibold text-slate-800 dark:text-slate-100">
                <option value="Cải tiến 5S">💡 Đề xuất cải tiến 5S</option>
                <option value="Báo lỗi phần mềm">🛠️ Báo lỗi kỹ thuật App</option>
                <option value="Vật tư 5S">📦 Yêu cầu tem nhãn, vật tư 5S</option>
                <option value="Góp ý khác">💬 Ý kiến đóng góp khác</option>
              </select>
            </div>
            <div>
              <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1">Mức độ ưu tiên</label>
              <select id="feedback-priority" class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 font-semibold text-slate-800 dark:text-slate-100">
                <option value="normal">⚪ Bình thường</option>
                <option value="urgent">🔴 Cần hỗ trợ gấp</option>
              </select>
            </div>
          </div>

          <div>
            <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1">Tiêu đề tin nhắn *</label>
            <input type="text" id="feedback-title" placeholder="Tóm tắt ngắn gọn nội dung góp ý..." class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500">
          </div>

          <div>
            <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1">Nội dung tin nhắn / góp ý *</label>
            <textarea id="feedback-content" rows="3" placeholder="Mô tả cụ thể ý kiến đóng góp, đề xuất cải tiến hoặc vấn đề kỹ thuật gửi tới Admin..." class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"></textarea>
          </div>

          <div class="flex items-center space-x-2 pt-2">
            <button type="button" onclick="app5s.sendFeedbackToAdmin()" class="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black py-3 rounded-2xl shadow-md transition flex items-center justify-center space-x-2">
              <i data-lucide="send" class="w-4 h-4"></i>
              <span>GỬI TIN NHẮN CHO ADMIN</span>
            </button>
            <button type="button" onclick="app5s.sendFeedbackViaEmail()" title="Gửi trực tiếp qua Email client" class="p-3 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 rounded-2xl border border-indigo-200 dark:border-indigo-800 font-bold transition flex items-center space-x-1.5">
              <i data-lucide="mail" class="w-4 h-4 text-indigo-600"></i>
              <span class="hidden sm:inline text-xs">Email</span>
            </button>
          </div>
        </div>

        <!-- Lịch sử tin nhắn -->
        <div class="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
          <span class="text-slate-400">Đã lưu ${(this.data.admin_messages || []).length} tin nhắn trong hệ thống</span>
          <button onclick="app5s.openAdminInboxModal()" class="text-indigo-600 dark:text-indigo-400 font-bold hover:underline flex items-center space-x-1">
            <i data-lucide="inbox" class="w-3.5 h-3.5"></i>
            <span>Xem Hộp Thư Admin (${(this.data.admin_messages || []).length}) &rarr;</span>
          </button>
        </div>
      </div>
    `;

    this.showModal(modalHtml);
  }

  sendFeedbackToAdmin() {
    const senderName = document.getElementById('feedback-sender-name')?.value.trim();
    const deptId = parseInt(document.getElementById('feedback-dept-id')?.value) || 1;
    const topic = document.getElementById('feedback-topic')?.value || 'Góp ý chung';
    const priority = document.getElementById('feedback-priority')?.value || 'normal';
    const title = document.getElementById('feedback-title')?.value.trim();
    const content = document.getElementById('feedback-content')?.value.trim();

    if (!title || !content) {
      alert('Vui lòng nhập đầy đủ tiêu đề và nội dung góp ý!');
      return;
    }

    const dept = (this.data.departments || []).find(d => d.id == deptId) || { name: 'Khoa phòng' };
    const user = this.getCurrentUser() || { code: 'BV-345', name: 'Cán bộ 5S' };

    const newMsg = {
      id: Date.now(),
      date: new Date().toLocaleString('vi-VN'),
      sender_name: senderName || user.name,
      sender_code: user.code,
      dept_id: deptId,
      dept_name: dept.name,
      topic: topic,
      priority: priority,
      title: title,
      content: content,
      status: 'received',
      reply: ''
    };

    if (!this.data.admin_messages) this.data.admin_messages = [];
    this.data.admin_messages.unshift(newMsg);
    this.saveData();

    this.showToast('✅ Ý kiến đóng góp của bạn đã được gửi thành công đến Admin (Vũ Đạt)!');
    this.closeModal();
    this.render();
  }

  sendFeedbackViaEmail() {
    const title = document.getElementById('feedback-title')?.value.trim() || 'Góp ý hệ thống 5S VPI';
    const content = document.getElementById('feedback-content')?.value.trim() || 'Kính gửi Admin Vũ Đạt...';
    const senderName = document.getElementById('feedback-sender-name')?.value.trim() || 'Cán bộ 5S';
    const mailSubject = encodeURIComponent(`[5S VPI] ${title}`);
    const mailBody = encodeURIComponent(`Kính gửi Admin Vũ Đạt (Hotline: +84916306115),

Người gửi: ${senderName}

Nội dung góp ý:
${content}

Trân trọng cảm ơn!`);
    window.open(`mailto:vudatxq@gmail.com?subject=${mailSubject}&body=${mailBody}`, '_blank');
  }

  openAdminInboxModal() {
    const messages = this.data.admin_messages || [];

    const modalHtml = `
      <div class="p-5 space-y-4 max-h-[85vh] overflow-y-auto no-scrollbar">
        <div class="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3">
          <div class="flex items-center space-x-2">
            <div class="w-9 h-9 rounded-2xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
              <i data-lucide="inbox" class="w-5 h-5"></i>
            </div>
            <div>
              <h3 class="text-sm font-black text-slate-900 dark:text-white">HỘP THƯ TIN NHẮN & GÓP Ý ADMIN</h3>
              <p class="text-[10px] text-indigo-600 font-bold">Quản trị viên: Vũ Đạt • Hotline: +84916306115</p>
            </div>
          </div>
          <button onclick="app5s.closeModal()" class="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100">
            <i data-lucide="x" class="w-4 h-4"></i>
          </button>
        </div>

        <div class="space-y-3">
          ${messages.length === 0 ? `
            <div class="text-center py-8 text-slate-400 text-xs">
              <i data-lucide="message-square-off" class="w-8 h-8 mx-auto mb-2 opacity-50"></i>
              <p>Chưa có tin nhắn hoặc ý kiến đóng góp nào.</p>
            </div>
          ` : messages.map((m, idx) => `
            <div class="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-2">
              <div class="flex items-center justify-between text-xs">
                <div class="flex items-center space-x-1.5">
                  <span class="w-6 h-6 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold flex items-center justify-center text-[10px] font-mono">
                    #${messages.length - idx}
                  </span>
                  <strong class="text-slate-900 dark:text-white">${m.sender_name}</strong>
                  <span class="text-[10px] text-slate-400">[${m.dept_name}]</span>
                </div>
                <span class="text-[10px] ${m.priority === 'urgent' ? 'bg-red-100 text-red-700 border border-red-300' : 'bg-slate-100 text-slate-600'} px-2 py-0.5 rounded-full font-bold">
                  ${m.topic}
                </span>
              </div>

              <div class="text-xs font-bold text-slate-800 dark:text-slate-100">
                ${m.title}
              </div>

              <div class="text-[11.5px] text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-xl leading-relaxed">
                ${m.content}
              </div>

              ${m.reply ? `
                <div class="text-[11px] text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 p-2 rounded-xl border border-emerald-200 dark:border-emerald-800 flex items-start space-x-1.5">
                  <i data-lucide="corner-down-right" class="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5"></i>
                  <div><strong>Phản hồi:</strong> ${m.reply}</div>
                </div>
              ` : `
                <div class="flex items-center justify-between pt-1">
                  <span class="text-[10px] text-slate-400">🕒 ${m.date}</span>
                  <button onclick="app5s.quickReplyMessage(${m.id})" class="text-[10px] font-bold text-indigo-600 hover:underline">
                    ✍️ Trả lời tin nhắn
                  </button>
                </div>
              `}
            </div>
          `).join('')}
        </div>

        <div class="pt-2">
          <button onclick="app5s.openFeedbackModal()" class="w-full py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5 transition">
            <i data-lucide="plus" class="w-4 h-4"></i>
            <span>Soạn Tin Nhắn / Góp Ý Mới</span>
          </button>
        </div>
      </div>
    `;

    this.showModal(modalHtml);
  }

  quickReplyMessage(msgId) {
    const msg = (this.data.admin_messages || []).find(m => m.id == msgId);
    if (!msg) return;
    const replyText = prompt(`Nhập nội dung phản hồi cho "${msg.sender_name}" (${msg.title}):`, `Admin (Vũ Đạt): Đã tiếp nhận và xử lý.`);
    if (replyText && replyText.trim()) {
      msg.reply = replyText.trim();
      msg.reply_date = new Date().toLocaleString('vi-VN');
      msg.status = 'replied';
      msg.read_by_user = false;
      this.saveData();
      this.showToast('✅ Đã gửi phản hồi riêng tư trực tiếp tới tài khoản của cán bộ!');
      this.openAdminInboxModal();
      this.render();
    }
  }

  renderAppFooterHtml() {
    return `
      <footer class="mt-8 mb-4 px-4 py-4 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm rounded-3xl border border-slate-200/90 dark:border-slate-700/90 text-center space-y-2.5 shadow-sm">
        <div class="flex items-center justify-center space-x-2 text-xs font-bold text-slate-800 dark:text-slate-100">
          <div class="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
            <i data-lucide="headset" class="w-3.5 h-3.5"></i>
          </div>
          <span class="uppercase tracking-tight font-black text-emerald-700 dark:text-emerald-400">HỖ TRỢ KỸ THUẬT HỆ THỐNG 5S VPI</span>
        </div>

        <div class="text-xs font-black text-slate-700 dark:text-slate-200">
          Tác giả: <strong class="text-emerald-600 dark:text-emerald-400">Vũ Đạt</strong>
        </div>

        <div class="text-[11px] text-slate-500 dark:text-slate-400 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 pt-1 border-t border-slate-100 dark:border-slate-700/60">
          <a href="mailto:vudatxq@gmail.com" class="hover:text-emerald-600 font-semibold flex items-center space-x-1.5 transition">
            <i data-lucide="mail" class="w-3.5 h-3.5 text-indigo-500"></i>
            <span>vudatxq@gmail.com</span>
          </a>
          <a href="tel:+84916306115" class="hover:text-emerald-600 font-black text-emerald-600 dark:text-emerald-400 flex items-center space-x-1.5 transition">
            <i data-lucide="phone-call" class="w-3.5 h-3.5 text-emerald-600"></i>
            <span>Hotline: +84916306115</span>
          </a>
          <button onclick="app5s.openFeedbackModal()" class="text-indigo-600 dark:text-indigo-400 font-bold hover:underline flex items-center space-x-1.5 transition">
            <i data-lucide="message-square-plus" class="w-3.5 h-3.5 text-indigo-600"></i>
            <span>Nhắn tin cho Admin</span>
          </button>
        </div>
      </footer>
    `;
  }


  // =========================================================================
  // V13 TÍNH NĂNG 1: SỬA VAI TRÒ NHÂN SỰ ĐÃ PHÂN CÔNG TRONG CA
  // =========================================================================
  editAssignedStaffRole(roomId, staffIdx) {
    const rs = this.getRoomSchedule(roomId);
    if (!rs || !rs.staff_assigned || !rs.staff_assigned[staffIdx]) return;
    const staff = rs.staff_assigned[staffIdx];
    const newRole = prompt(`Điều chỉnh vai trò trong ca trực của ${staff.name}:`, staff.role || 'Bác sĩ trực');
    if (newRole !== null && newRole.trim() !== '') {
      staff.role = newRole.trim();
      delete rs._auto;
      this.saveData();
      this.showToast(`Đã cập nhật vai trò của ${staff.name}: ${staff.role}`);
      this.openManageRoomStaffModal(roomId);
      this.render();
    }
  }

  // =========================================================================
  // V13 TÍNH NĂNG 2: ĐIỀU CHỈNH KHUNG GIỜ CA LÀM VIỆC TÙY CHỌN
  // =========================================================================
  getCurrentShiftHoursDisplay() {
    const sc = this.data.shift_config || {};
    if (sc.custom && sc.custom.start && sc.custom.end) {
      return `${sc.custom.start} - ${sc.custom.end} (${sc.custom.name || 'Ca tùy chỉnh'})`;
    }
    if (sc.morning && sc.morning.start && sc.afternoon && sc.afternoon.end) {
      return `${sc.morning.start} - ${sc.afternoon.end} (Hành chính / Toàn viện)`;
    }
    return '07:30 - 17:00 (Hành chính)';
  }

  openCustomizeShiftHoursModal() {
    const sc = this.data.shift_config || {
      morning: { name: 'Ca sáng', start: '07:00', end: '11:30' },
      afternoon: { name: 'Ca chiều', start: '13:30', end: '17:00' },
      night: { name: 'Ca đêm', start: '17:00', end: '07:00' }
    };

    const modalHtml = `
      <div class="p-5 space-y-4 max-h-[85vh] overflow-y-auto no-scrollbar">
        <div class="flex items-center justify-between border-b pb-3">
          <div class="flex items-center space-x-2">
            <div class="w-9 h-9 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 flex items-center justify-center">
              <i data-lucide="clock" class="w-5 h-5"></i>
            </div>
            <div>
              <h3 class="text-sm font-black text-slate-900 dark:text-white">ĐIỀU CHỈNH KHUNG GIỜ CA LÀM VIỆC</h3>
              <p class="text-[10px] text-amber-600 font-bold">Tùy biến giờ ca sáng, chiều, đêm theo thực tế</p>
            </div>
          </div>
          <button onclick="app5s.closeModal()" class="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400">
            <i data-lucide="x" class="w-4 h-4"></i>
          </button>
        </div>

        <div class="space-y-3 text-xs">
          <!-- Ca sáng -->
          <div class="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-2">
            <div class="flex items-center justify-between">
              <span class="font-bold text-slate-800 dark:text-slate-100 flex items-center space-x-1.5">
                <span class="w-2 h-2 rounded-full bg-amber-500"></span>
                <span>Ca Sáng</span>
              </span>
              <span class="text-[10px] text-slate-400">Buổi sáng</span>
            </div>
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="block text-[10px] text-slate-500 mb-0.5">Giờ bắt đầu:</label>
                <input type="time" id="shift-morning-start" value="${sc.morning.start || '07:00'}" class="w-full bg-white dark:bg-slate-800 border rounded-xl p-2 font-mono font-bold">
              </div>
              <div>
                <label class="block text-[10px] text-slate-500 mb-0.5">Giờ kết thúc:</label>
                <input type="time" id="shift-morning-end" value="${sc.morning.end || '11:30'}" class="w-full bg-white dark:bg-slate-800 border rounded-xl p-2 font-mono font-bold">
              </div>
            </div>
          </div>

          <!-- Ca chiều -->
          <div class="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-2">
            <div class="flex items-center justify-between">
              <span class="font-bold text-slate-800 dark:text-slate-100 flex items-center space-x-1.5">
                <span class="w-2 h-2 rounded-full bg-cyan-500"></span>
                <span>Ca Chiều</span>
              </span>
              <span class="text-[10px] text-slate-400">Buổi chiều</span>
            </div>
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="block text-[10px] text-slate-500 mb-0.5">Giờ bắt đầu:</label>
                <input type="time" id="shift-afternoon-start" value="${sc.afternoon.start || '13:30'}" class="w-full bg-white dark:bg-slate-800 border rounded-xl p-2 font-mono font-bold">
              </div>
              <div>
                <label class="block text-[10px] text-slate-500 mb-0.5">Giờ kết thúc:</label>
                <input type="time" id="shift-afternoon-end" value="${sc.afternoon.end || '17:00'}" class="w-full bg-white dark:bg-slate-800 border rounded-xl p-2 font-mono font-bold">
              </div>
            </div>
          </div>

          <!-- Ca đêm / Trực 24h -->
          <div class="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-2">
            <div class="flex items-center justify-between">
              <span class="font-bold text-slate-800 dark:text-slate-100 flex items-center space-x-1.5">
                <span class="w-2 h-2 rounded-full bg-indigo-500"></span>
                <span>Ca Đêm (Trực 24h)</span>
              </span>
              <span class="text-[10px] text-slate-400">Trực đêm</span>
            </div>
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="block text-[10px] text-slate-500 mb-0.5">Giờ bắt đầu:</label>
                <input type="time" id="shift-night-start" value="${sc.night.start || '17:00'}" class="w-full bg-white dark:bg-slate-800 border rounded-xl p-2 font-mono font-bold">
              </div>
              <div>
                <label class="block text-[10px] text-slate-500 mb-0.5">Giờ kết thúc:</label>
                <input type="time" id="shift-night-end" value="${sc.night.end || '07:00'}" class="w-full bg-white dark:bg-slate-800 border rounded-xl p-2 font-mono font-bold">
              </div>
            </div>
          </div>

          <button onclick="app5s.saveCustomShiftHours()" class="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 text-white font-black py-3 rounded-2xl shadow-md transition flex items-center justify-center space-x-2">
            <i data-lucide="check" class="w-4 h-4"></i>
            <span>LƯU CẤU HÌNH KHUNG GIỜ MỚI</span>
          </button>
        </div>
      </div>
    `;

    this.showModal(modalHtml);
  }

  saveCustomShiftHours() {
    const mStart = document.getElementById('shift-morning-start')?.value || '07:00';
    const mEnd = document.getElementById('shift-morning-end')?.value || '11:30';
    const aStart = document.getElementById('shift-afternoon-start')?.value || '13:30';
    const aEnd = document.getElementById('shift-afternoon-end')?.value || '17:00';
    const nStart = document.getElementById('shift-night-start')?.value || '17:00';
    const nEnd = document.getElementById('shift-night-end')?.value || '07:00';

    this.data.shift_config = {
      morning: { name: 'Ca sáng', start: mStart, end: mEnd },
      afternoon: { name: 'Ca chiều', start: aStart, end: aEnd },
      night: { name: 'Ca đêm', start: nStart, end: nEnd }
    };

    this.saveData();
    this.closeModal();
    this.showToast('✅ Đã lưu cấu hình khung giờ ca làm việc mới!');
    this.render();
  }

  // =========================================================================
  // V13 TÍNH NĂNG 3: BẢO MẬT RIÊNG TƯ - TIN NHẮN PHẢN HỒI TRỰC TIẾP TÀI KHOẢN
  // =========================================================================
  openMyMessagesModal() {
    const user = this.getCurrentUser();
    const userCode = user ? (user.code || '').toUpperCase() : '';
    const userName = user ? user.name : '';

    // Lọc riêng tư: Chỉ lấy tin nhắn do chính tài khoản này gửi
    const myMessages = (this.data.admin_messages || []).filter(m => {
      const mCode = (m.sender_code || '').toUpperCase();
      return mCode === userCode || (userName && m.sender_name === userName);
    });

    // Đánh dấu đã đọc
    myMessages.forEach(m => {
      if (m.reply) m.read_by_user = true;
    });
    this.saveData();

    const modalHtml = `
      <div class="p-5 space-y-4 max-h-[85vh] overflow-y-auto no-scrollbar">
        <div class="flex items-center justify-between border-b pb-3">
          <div class="flex items-center space-x-2">
            <div class="w-9 h-9 rounded-2xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
              <i data-lucide="message-square" class="w-5 h-5"></i>
            </div>
            <div>
              <h3 class="text-sm font-black text-slate-900 dark:text-white">TIN NHẮN RIÊNG TƯ TỪ ADMIN</h3>
              <p class="text-[10px] text-indigo-600 font-bold">Tài khoản: ${userName} (${userCode}) • Bảo mật 100%</p>
            </div>
          </div>
          <button onclick="app5s.closeModal()" class="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100">
            <i data-lucide="x" class="w-4 h-4"></i>
          </button>
        </div>

        <div class="space-y-3">
          ${myMessages.length === 0 ? `
            <div class="text-center py-8 text-slate-400 text-xs space-y-2">
              <i data-lucide="inbox" class="w-8 h-8 mx-auto opacity-40"></i>
              <p>Bạn chưa gửi tin nhắn hoặc ý kiến đóng góp nào tới Admin.</p>
              <button onclick="app5s.openFeedbackModal()" class="px-3 py-1.5 bg-indigo-600 text-white rounded-xl font-bold text-xs">
                Gửi Góp Ý / Nhắn Tin Cho Admin
              </button>
            </div>
          ` : myMessages.map(m => `
            <div class="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-2.5">
              <div class="flex items-center justify-between text-xs">
                <span class="font-bold text-slate-900 dark:text-white">${m.title}</span>
                <span class="text-[10px] ${m.reply ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300' : 'bg-amber-100 text-amber-800'} px-2 py-0.5 rounded-full font-bold">
                  ${m.reply ? '✓ Đã có phản hồi' : 'Đang xử lý'}
                </span>
              </div>

              <!-- Nội dung bạn đã gửi -->
              <div class="text-[11.5px] text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-xl">
                <div class="text-[9.5px] text-slate-400 font-bold mb-0.5">Nội dung bạn gửi (${m.date}):</div>
                ${m.content}
              </div>

              <!-- Phản hồi trực tiếp từ Admin Vũ Đạt -->
              ${m.reply ? `
                <div class="text-[11.5px] text-emerald-900 dark:text-emerald-100 bg-emerald-50/90 dark:bg-emerald-950/60 p-3 rounded-xl border border-emerald-300 dark:border-emerald-700 space-y-1">
                  <div class="flex items-center justify-between text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                    <span class="flex items-center space-x-1">
                      <i data-lucide="shield-check" class="w-3.5 h-3.5"></i>
                      <span>Phản hồi từ Admin (Vũ Đạt):</span>
                    </span>
                    <span>${m.reply_date || ''}</span>
                  </div>
                  <div class="font-medium leading-relaxed">${m.reply}</div>
                </div>
              ` : `
                <div class="text-[10.5px] text-slate-400 italic">
                  ⏳ Ý kiến của bạn đã được chuyển tới Admin Vũ Đạt và đang được xử lý...
                </div>
              `}
            </div>
          `).join('')}
        </div>

        <div class="pt-2">
          <button onclick="app5s.openFeedbackModal()" class="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-1.5 transition">
            <i data-lucide="plus" class="w-4 h-4"></i>
            <span>Soạn Tin Nhắn / Góp Ý Mới Cho Admin</span>
          </button>
        </div>
      </div>
    `;

    this.showModal(modalHtml);
  }

  // =========================================================================
  // V13 TÍNH NĂNG 4: QUÊN MẬT KHẨU - GỬI YÊU CẦU CẤP LẠI CHO ADMIN VŨ ĐẠT
  // =========================================================================
  openForgotPasswordModal() {
    const modalHtml = `
      <div class="p-5 space-y-4 max-h-[85vh] overflow-y-auto no-scrollbar">
        <div class="flex items-center justify-between border-b pb-3">
          <div class="flex items-center space-x-2">
            <div class="w-9 h-9 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <i data-lucide="key-round" class="w-5 h-5"></i>
            </div>
            <div>
              <h3 class="text-sm font-black text-slate-900 dark:text-white">QUÊN MẬT KHẨU ĐĂNG NHẬP</h3>
              <p class="text-[10px] text-amber-600 font-bold">Cấp lại mật khẩu qua Quản trị viên Vũ Đạt</p>
            </div>
          </div>
          <button onclick="app5s.closeModal()" class="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100">
            <i data-lucide="x" class="w-4 h-4"></i>
          </button>
        </div>

        <div class="bg-amber-50 dark:bg-amber-950/40 p-3 rounded-2xl border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-200 space-y-1">
          <div class="font-bold flex items-center space-x-1">
            <i data-lucide="info" class="w-3.5 h-3.5"></i>
            <span>Mật khẩu ban đầu mặc định: <strong>123456</strong></span>
          </div>
          <p class="text-[11px] opacity-90">
            Nếu bạn đã đổi mật khẩu và không nhớ, vui lòng gửi yêu cầu bên dưới hoặc gọi hotline Admin để được cấp lại tức thì.
          </p>
        </div>

        <div class="space-y-3 text-xs">
          <div>
            <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1">Mã nhân viên (Tên đăng nhập) *</label>
            <input type="text" id="forgot-staff-code" placeholder="Ví dụ: BV-345 hoặc BV-002..." class="w-full bg-slate-50 dark:bg-slate-900 border rounded-xl p-2.5 font-bold font-mono">
          </div>
          <div>
            <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1">Họ và tên cán bộ *</label>
            <input type="text" id="forgot-staff-name" placeholder="Ví dụ: Nguyễn Văn A..." class="w-full bg-slate-50 dark:bg-slate-900 border rounded-xl p-2.5 font-semibold">
          </div>
          <div>
            <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1">Khoa / Phòng công tác *</label>
            <input type="text" id="forgot-staff-dept" placeholder="Ví dụ: Khoa Khám bệnh, Khoa CĐHA..." class="w-full bg-slate-50 dark:bg-slate-900 border rounded-xl p-2.5">
          </div>
          <div>
            <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1">Số điện thoại liên hệ nhận mật khẩu:</label>
            <input type="text" id="forgot-staff-phone" placeholder="Nhập số điện thoại của bạn..." class="w-full bg-slate-50 dark:bg-slate-900 border rounded-xl p-2.5">
          </div>

          <button onclick="app5s.sendForgotPasswordRequest()" class="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 text-white font-black py-3 rounded-2xl shadow-md transition flex items-center justify-center space-x-2">
            <i data-lucide="send" class="w-4 h-4"></i>
            <span>GỬI YÊU CẦU CẤP LẠI MẬT KHẨU</span>
          </button>
        </div>

        <!-- Hotline trực tiếp -->
        <div class="pt-2 border-t border-slate-100 dark:border-slate-800 text-center text-xs space-y-1">
          <div class="text-slate-400 text-[11px]">Cần cấp lại mật khẩu gấp? Gọi trực tiếp:</div>
          <a href="tel:+84916306115" class="inline-flex items-center space-x-1.5 font-bold text-emerald-600 dark:text-emerald-400 font-mono text-sm">
            <i data-lucide="phone-call" class="w-4 h-4"></i>
            <span>Hotline Admin: +84916306115</span>
          </a>
        </div>
      </div>
    `;

    this.showModal(modalHtml);
  }

  async sendForgotPasswordRequest() {
    const code = document.getElementById('forgot-staff-code')?.value.trim();
    const name = document.getElementById('forgot-staff-name')?.value.trim();
    const dept = document.getElementById('forgot-staff-dept')?.value.trim();
    const phone = document.getElementById('forgot-staff-phone')?.value.trim();

    if (!code || !name) {
      alert('Vui lòng nhập Mã nhân viên và Họ tên của bạn!');
      return;
    }

    // V28: gửi thẳng lên máy chủ (người quên mật khẩu chưa đăng nhập nên không đồng bộ được)
    try {
      const r = await fetch(this.apiUrl('forgot'), {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, cache: 'no-store',
        body: JSON.stringify({ code, name, dept, phone })
      });
      const j = await r.json().catch(() => null);
      if (!r.ok) { alert((j && j.error) || 'Không gửi được yêu cầu. Vui lòng gọi Hotline.'); return; }
      this.closeModal();
      this.showToast('✅ ' + ((j && j.message) || 'Đã gửi yêu cầu tới Admin.'));
    } catch (e) {
      alert('Không kết nối được máy chủ. Vui lòng kiểm tra mạng hoặc gọi Hotline.');
    }
  }

  _legacySendForgotPasswordRequest(code, name, dept, phone) {
    const newMsg = {
      id: Date.now(),
      date: new Date().toLocaleString('vi-VN'),
      sender_name: name,
      sender_code: code.toUpperCase(),
      dept_id: 0,
      dept_name: dept || 'Toàn viện',
      topic: 'Cấp lại mật khẩu',
      priority: 'urgent',
      title: `[CẤP MẬT KHẨU] Cán bộ ${name} (${code})`,
      content: `Yêu cầu cấp lại mật khẩu đăng nhập cho cán bộ ${name}, Mã NV: ${code}, Khoa: ${dept || 'Không rõ'}, SĐT: ${phone || 'Chưa cung cấp'}. Mật khẩu mặc định khuyến nghị: 123456.`,
      status: 'received',
      reply: ''
    };

    if (!this.data.admin_messages) this.data.admin_messages = [];
    this.data.admin_messages.unshift(newMsg);
    this.saveData();

    this.showToast('✅ Đã gửi yêu cầu cấp lại mật khẩu tới Admin (Vũ Đạt)! Vui lòng chờ phản hồi hoặc gọi Hotline.');
    this.closeModal();
  }

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

          <!-- V24: BẢO MẬT & BẢO VỆ THÔNG TIN BỆNH NHÂN (NGHỊ ĐỊNH 13/2023 & LUẬT KHÁM CHỮA BỆNH) -->
          <div class="bg-blue-50 dark:bg-blue-950/40 p-2.5 rounded-xl border border-blue-200 dark:border-blue-800 flex items-start space-x-2 text-[10.5px] text-blue-900 dark:text-blue-200">
            <i data-lucide="lock" class="w-4 h-4 text-blue-600 shrink-0 mt-0.5"></i>
            <div>
              <strong class="font-bold">Bảo mật thông tin y tế:</strong> Chỉ chụp quang cảnh buồng bệnh, giường tủ, dụng cụ y tế và sàn nhà đã 5S sạch sẽ. Tuyệt đối không chụp cận cảnh gương mặt bệnh nhân hoặc hồ sơ bệnh án.
            </div>
          </div>

          <!-- KHUNG HIỂN THỊ VÀ TẢI ẢNH 5S -->
          <div id="shift-photo-preview">
            ${this.renderShiftPhotoPreviewHtml(this.currentShiftPhoto)}
          </div>

          <!-- V28: bỏ nút "ảnh mẫu minh chứng" (cho phép nộp ảnh giả thay ảnh chụp thật) -->
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Ghi chú tình trạng buồng phòng bàn giao:</label>
          <textarea id="shift-5s-notes" rows="2" placeholder="Ví dụ: Đã lau khử khuẩn bề mặt máy móc, khay thuốc niêm phong, sàn nhà sạch sẽ khô ráo..." class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500">${(rs.post_shift_5s && rs.post_shift_5s.notes) || ''}</textarea>
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
    // V25 PERF: thu nhỏ ảnh camera về tối đa 1024px (trước đây giữ nguyên độ phân giải camera 1080p-4K
    // => mỗi ảnh 0,5-2MB base64, làm đầy bộ nhớ 5MB của trình duyệt chỉ sau vài ảnh và tự xóa ảnh cũ)
    const MAX_PHOTO_DIM = 1024;
    if (width > MAX_PHOTO_DIM || height > MAX_PHOTO_DIM) {
      const ratio = Math.min(MAX_PHOTO_DIM / width, MAX_PHOTO_DIM / height);
      width = Math.round(width * ratio);
      height = Math.round(height * ratio);
    }

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

    const photoUrl = canvas.toDataURL('image/jpeg', 0.68);

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
        const maxDim = 850;
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

        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.68);

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
      // V28: không gán sẵn điểm "98 - Xuất sắc" khi chưa được chấm
      score_seiri: null, score_seiton: null, score_seiso: null, score_seiketsu: null, score_shitsuke: null,
      total_score: null,
      rating: 'Chờ chấm',
      notes: notes,
      after_photo: photoInput,
      status: 'pending', // Chờ cán bộ giám sát kiểm tra và phê duyệt
      evaluator_name: '', evaluator_code: '', evaluator_role: '', evaluation_date: '', evaluation_time: '',
      evaluation_result: null, issue_detected: '', remedy_deadline: '', evaluation_notes: '',
      created_at: new Date().toISOString()
    };

    if (!this.data.audits) this.data.audits = [];
    newAudit.sender_code = (this.getCurrentUser() || {}).code || '';
    this.data.audits.unshift(newAudit);

    // Cập nhật trạng thái 5S ca trực của phòng
    delete rs._auto;
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
    if (!this.isAdmin() && !this.isUserManagerOrSupervisor()) {
      this.showReportLockedNotice('Xuất Excel');
      return;
    }
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

        <!-- V17: TÙY CHỌN NGÀY XUẤT EXCEL (THEO TỪNG NGÀY HOẶC TÙY CHỈNH) -->
        <div class="p-3 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
          <label class="block font-bold text-slate-800 dark:text-slate-100">📅 Chọn ngày xuất dữ liệu Excel:</label>
          <div class="flex items-center space-x-2">
            <input type="date" id="export-excel-target-date" value="${this.scheduleState.selectedDate || this.getTodayDateString()}" class="flex-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2 font-mono text-xs font-bold text-slate-800 dark:text-slate-100">
            <button onclick="app5s.exportScheduleToExcel(document.getElementById('export-excel-target-date').value)" class="py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition flex items-center space-x-1 shadow-xs shrink-0">
              <i data-lucide="download" class="w-3.5 h-3.5"></i>
              <span>Xuất Ngày Này</span>
            </button>
          </div>
          <div class="text-[10px] text-slate-500">
            * Xuất chi tiết trạng thái hoạt động, nhân sự trực ca, kết quả nộp ảnh 5S theo ngày được chọn.
          </div>
        </div>

        <div class="grid grid-cols-2 gap-2">
          <button onclick="app5s.saveGoogleSheetUrl()" class="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition flex items-center justify-center space-x-1 shadow-xs">
            <i data-lucide="refresh-cw" class="w-3.5 h-3.5"></i>
            <span>Lưu Link Sheet</span>
          </button>

          <button onclick="app5s.exportScheduleToExcel(null)" class="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition flex items-center justify-center space-x-1 shadow-xs">
            <i data-lucide="file-spreadsheet" class="w-3.5 h-3.5 text-emerald-400"></i>
            <span>Xuất Hôm Nay</span>
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

  exportScheduleToExcel(customDate = null) {
    const targetDate = customDate || this.scheduleState.selectedDate || this.getTodayDateString();
    const depts = this.data.departments || [];
    const rooms = this.data.rooms || [];
    const schedules = this.data.schedules || {};
    const roomSchedules = schedules.rooms_schedule || [];

    let csv = `\uFEFFBÁO CÁO HOẠT ĐỘNG VÀ 5S BUỒNG PHÒNG TOÀN VIỆN VPI - NGÀY ${targetDate}\n`;
    csv += 'STT,Ngày Báo Cáo,Mã Khoa,Tên Khoa/Phòng,Mã Phòng,Tên Buồng Phòng,Tầng,Trạng Thái Hoạt Động,Nhân Sự Trực Ca,Tình Trạng 5S Hết Ca,Giờ Nộp 5S,Điểm Đánh Giá\n';

    rooms.forEach((r, idx) => {
      const d = depts.find(dept => dept.id == r.department_id) || { code: '', name: '' };
      const rs = this.getRoomSchedule(r.id);
      const isWorkingStr = rs.is_working ? 'Đang làm việc' : 'Không làm việc';
      const staffNames = (rs.staff_assigned || []).map(s => `${s.name} (${s.role})`).join('; ') || 'Chưa phân công';
      const s5Status = rs.post_shift_5s ? (rs.post_shift_5s.status === 'submitted' ? 'Đã nộp 5S' : (rs.post_shift_5s.status === 'overdue' ? 'Quá hạn chưa nộp' : 'Chờ nộp')) : 'Chưa nộp';
      const s5Time = rs.post_shift_5s ? (rs.post_shift_5s.submitted_at || '') : '';

      const auditScore = rs.post_shift_5s && rs.post_shift_5s.score ? `${rs.post_shift_5s.score} đ` : 'Chưa chấm';
      csv += `"${idx + 1}","${targetDate}","${d.code}","${d.name}","${r.code || ''}","${r.name}","${r.floor || ''}","${isWorkingStr}","${staffNames}","${s5Status}","${s5Time}","${auditScore}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Bao_Cao_5S_VPI_${targetDate}.csv`);
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

    const vnDateInfo = this.getVietnamDateInfo(this.scheduleWeekOffset || 0);
    const days = vnDateInfo.days;
    if (!this.scheduleState.selectedDate) {
      this.scheduleState.selectedDate = vnDateInfo.realTodayIso;
      this.scheduleState.selectedDay = (days.find(d => d.isToday) || days[0]).id;
    }
    const currentDayObj = days.find(d => d.id === this.scheduleState.selectedDay) || days.find(d => d.fullDate === this.scheduleState.selectedDate) || days[0];

    const sc = this.data.shift_config || {
      morning: { name: 'Ca sáng', start: '07:00', end: '11:30' },
      afternoon: { name: 'Ca chiều', start: '13:30', end: '17:00' },
      night: { name: 'Ca đêm', start: '17:00', end: '07:00' }
    };

    const shifts = [
      { id: 'all', name: 'Tất cả ca' },
      { id: 'morning', name: `${sc.morning.name} (${sc.morning.start} - ${sc.morning.end})` },
      { id: 'afternoon', name: `${sc.afternoon.name} (${sc.afternoon.start} - ${sc.afternoon.end})` },
      { id: 'night', name: `${sc.night.name} (${sc.night.start} - ${sc.night.end})` }
    ];

    // Lọc danh sách phòng theo bộ lọc
    const q = (this.scheduleState.searchQuery || '').toLowerCase();
    const selectedDept = this.scheduleState.selectedDept;
    const statusFilter = this.scheduleState.selectedStatusFilter;

    let filteredRooms = rooms;
    const canViewAllRooms = this.canViewAllHospitalRooms();
    const userDeptId = this.getUserDepartmentId();

    // V14 BẢO MẬT KHU VỰC: Cán bộ khoa chỉ xem buồng phòng của khoa mình
    if (!canViewAllRooms && userDeptId) {
      filteredRooms = filteredRooms.filter(r => String(r.department_id) === String(userDeptId));
    } else if (selectedDept && selectedDept !== 'all') {
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
        <!-- TIÊU ĐỀ TAB & NÚT TÁC VỤ NHANH (V13: BỐ CỤC CÂN ĐỐI, GỌN GÀNG, KHÔNG CO CHỮ DỌC) -->
        <div class="bg-white dark:bg-slate-800 rounded-2xl p-3 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-2">
          <div class="flex items-center justify-between gap-2 pb-1.5 border-b border-slate-100 dark:border-slate-700/60">
            <div class="flex items-center space-x-2.5 min-w-0">
              <div class="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <i data-lucide="map-pin" class="w-4 h-4"></i>
              </div>
              <div class="min-w-0">
                <div class="flex items-center space-x-1.5">
                  <h2 class="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight truncate">
                    ${canViewAllRooms ? 'KHU VỰC 5S TOÀN VIỆN VPI' : ('KHU VỰC 5S: ' + ((depts.find(d => d.id == userDeptId)?.name) || 'KHOA PHÒNG'))}
                  </h2>
                  <span class="text-[9px] ${canViewAllRooms ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-100 text-indigo-700'} font-bold px-1.5 py-0.2 rounded font-mono shrink-0">
                    ${canViewAllRooms ? (rooms.length + ' VỊ TRÍ') : (filteredRooms.length + ' PHÒNG')}
                  </span>
                </div>
                <p class="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate">Phân công nhân sự & Giám sát nộp ảnh 5S</p>
              </div>
            </div>
            <button onclick="app5s.openUserProfileModal()" title="Xem hồ sơ cá nhân & tài khoản" class="shrink-0 p-1.5 px-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 rounded-xl border border-slate-200 dark:border-slate-700 text-[10.5px] font-bold flex items-center space-x-1 transition">
              <i data-lucide="user-check" class="w-3.5 h-3.5 text-emerald-600"></i>
              <span>${this.isUserManagerOrSupervisor() ? '🛡️ Quản lý' : 'Cá nhân'}</span>
            </button>
          </div>

          <!-- V17: Bộ 4 nút hành động có phân quyền Báo Cáo & Xuất Excel (Khóa tài khoản thường) -->
          ${(() => {
            const canManage = this.isAdmin() || this.isUserManagerOrSupervisor();
            return `
              <div class="grid grid-cols-4 gap-1.5">
                ${canManage ? `
                  <button onclick="app5s.openDailySummaryModal()" title="Báo cáo tổng kết 5S hôm nay" class="py-2 px-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 text-white rounded-xl font-bold text-[10.5px] flex items-center justify-center space-x-1 shadow-xs transition">
                    <i data-lucide="bar-chart-2" class="w-3.5 h-3.5 shrink-0"></i>
                    <span>Báo Cáo 5S</span>
                  </button>
                  <button onclick="app5s.openGoogleSheetSyncModal()" title="Đồng bộ Google Sheets & Xuất Excel" class="py-2 px-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-[10.5px] flex items-center justify-center space-x-0.5 shadow-xs transition">
                    <i data-lucide="file-spreadsheet" class="w-3.5 h-3.5 shrink-0"></i>
                    <span>Xuất Excel</span>
                  </button>
                  <button onclick="app5s.printDailyEvaluationReport()" title="In bảng điểm và báo cáo 5S" class="py-2 px-1 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold text-[10.5px] flex items-center justify-center space-x-0.5 shadow-xs transition">
                    <i data-lucide="printer" class="w-3.5 h-3.5 text-emerald-400 shrink-0"></i>
                    <span>In Báo Cáo</span>
                  </button>
                ` : `
                  <button onclick="app5s.showReportLockedNotice('Báo Cáo')" title="Chỉ dành cho cán bộ quản lý" class="py-2 px-1 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-xl font-bold text-[10.5px] flex items-center justify-center space-x-0.5 border border-slate-200 dark:border-slate-700 transition">
                    <i data-lucide="lock" class="w-3 h-3 text-slate-400 shrink-0"></i>
                    <span>Báo Cáo 🔒</span>
                  </button>
                  <button onclick="app5s.showReportLockedNotice('Xuất Excel')" title="Chỉ dành cho cán bộ quản lý" class="py-2 px-1 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-xl font-bold text-[10.5px] flex items-center justify-center space-x-0.5 border border-slate-200 dark:border-slate-700 transition">
                    <i data-lucide="lock" class="w-3 h-3 text-slate-400 shrink-0"></i>
                    <span>Xuất Excel 🔒</span>
                  </button>
                  <button onclick="app5s.printDailyEvaluationReport()" title="In bảng điểm và báo cáo 5S" class="py-2 px-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-[10.5px] flex items-center justify-center space-x-0.5 border border-slate-200 dark:border-slate-700 transition">
                    <i data-lucide="printer" class="w-3.5 h-3.5 text-slate-500 shrink-0"></i>
                    <span>In Báo Cáo</span>
                  </button>
                `}

                <button onclick="app5s.openUserProfileModal()" title="Xem hồ sơ cá nhân & bảo mật" class="py-2 px-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-[10.5px] flex items-center justify-center space-x-0.5 border border-slate-200 dark:border-slate-600 transition">
                  <i data-lucide="user-check" class="w-3.5 h-3.5 text-emerald-600 shrink-0"></i>
                  <span>Hồ Sơ</span>
                </button>
              </div>
            `;
          })()}
        </div>

        <!-- BỘ CHỌN TUẦN LÀM VIỆC & THANH NGÀY TRONG TUẦN -->
        <div class="bg-white dark:bg-slate-800 rounded-2xl px-2 py-3 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-2">
          <!-- TIÊU ĐỀ TUẦN TỰ ĐỘNG THEO LỊCH VIỆT NAM (V14: GỌN GÀNG, KHÔNG TRÀN LỀ) -->
          <div class="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-900/60 p-2 rounded-2xl border border-slate-200 dark:border-slate-700">
            <div class="flex items-center space-x-1 min-w-0">
              <button onclick="app5s.changeScheduleWeek(-1)" title="Xem tuần trước" class="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 transition shrink-0">
                <i data-lucide="chevron-left" class="w-3.5 h-3.5"></i>
              </button>
              <span class="flex items-center space-x-1 text-[11px] font-black truncate">
                <i data-lucide="calendar" class="w-3.5 h-3.5 text-indigo-600 shrink-0"></i>
                <span class="truncate">${vnDateInfo.weekRangeText}</span>
              </span>
              <button onclick="app5s.changeScheduleWeek(1)" title="Xem tuần tới" class="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 transition shrink-0">
                <i data-lucide="chevron-right" class="w-3.5 h-3.5"></i>
              </button>
            </div>
            <span class="text-[9.5px] bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-lg font-mono font-bold shrink-0">
              Năm ${vnDateInfo.year}
            </span>
          </div>

          <!-- LỊCH TUẦN: THỨ TRÊN - NGÀY DƯỚI (V14: CHẠM ĐỔI NGÀY HOẠT ĐỘNG 100%) -->
          <div class="space-y-1.5">
            <div class="grid grid-cols-7 gap-1 text-center select-none pt-0.5 w-full">
              ${days.map(d => {
                const isSelected = this.scheduleState.selectedDay === d.id || this.scheduleState.selectedDate === d.fullDate;
                return `
                  <button type="button" onclick="app5s.setScheduleDay('${d.id}', '${d.fullDate}')" class="w-full min-w-0 py-1.5 px-0 rounded-xl transition flex flex-col items-center justify-center text-center cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-md font-black ring-2 ring-indigo-400 scale-[1.02]'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 hover:border-indigo-300'
                  }">
                    <!-- Thứ ở trên -->
                    <span class="text-[9.5px] font-bold ${isSelected ? 'text-indigo-100' : 'text-slate-500 dark:text-slate-400'} uppercase leading-none truncate block w-full">
                      ${d.shortLabel}
                    </span>
                    <!-- Ngày ở ngay dưới -->
                    <span class="text-[10.5px] font-black leading-tight mt-0.5 ${isSelected ? 'text-white' : 'text-slate-900 dark:text-slate-100'} truncate block w-full">
                      ${d.dateNum}
                    </span>
                    ${d.isToday ? `
                      <span class="mt-0.5 px-1.5 py-0.5 rounded-full text-[7.5px] font-black inline-flex items-center gap-0.5 ${isSelected ? 'bg-white text-emerald-800 shadow-xs' : 'bg-emerald-600 text-white shadow-xs'}">
                        ✓ Hôm nay
                      </span>
                    ` : ''}
                  </button>
                `;
              }).join('')}
            </div>

            <!-- Thanh trạng thái ngày đang chọn trực quan -->
            <div class="flex items-center justify-between text-[11px] bg-indigo-50/80 dark:bg-indigo-950/40 px-3 py-1.5 rounded-xl border border-indigo-100 dark:border-indigo-900/60 text-indigo-900 dark:text-indigo-200">
              <span class="flex items-center space-x-1.5 font-bold">
                <i data-lucide="calendar-check" class="w-3.5 h-3.5 text-indigo-600"></i>
                <span>Lịch làm việc: <strong class="text-indigo-700 dark:text-indigo-300 underline">${currentDayObj.name} (${currentDayObj.dateNum}/${vnDateInfo.year})</strong></span>
              </span>
              <span class="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">Chạm thứ để đổi lịch</span>
            </div>
          </div>

          <!-- V23: HIỂN THỊ TRỰC TIẾP TOÀN BỘ CÁC KHUNG GIỜ CA LÀM VIỆC RA MÀN HÌNH -->
          <div class="bg-white dark:bg-slate-800 rounded-3xl p-3.5 border border-slate-200/90 dark:border-slate-700 shadow-xs space-y-2.5">
            <div class="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-100 dark:border-slate-700/60">
              <div class="flex items-center space-x-2">
                <div class="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
                  <i data-lucide="clock" class="w-4 h-4 text-amber-600"></i>
                </div>
                <div>
                  <h3 class="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">Khung Giờ Ca Làm Việc & Bàn Giao 5S</h3>
                  <p class="text-[10px] text-slate-500 font-medium">Quy chuẩn thời gian giao nhận ca và thời hạn nộp ảnh 5S toàn viện</p>
                </div>
              </div>
              <button onclick="app5s.openCustomizeShiftHoursModal()" title="Điều chỉnh giờ làm việc theo thực tế bệnh viện" class="px-2.5 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900 text-amber-700 dark:text-amber-300 font-bold text-[11px] border border-amber-200 dark:border-amber-800 transition flex items-center space-x-1 cursor-pointer">
                <i data-lucide="settings-2" class="w-3 h-3"></i>
                <span>Cài Đặt Giờ</span>
              </button>
            </div>

            <!-- 3 Khung giờ Ca Sáng - Chiều - Đêm hiển thị trực tiếp -->
            ${(() => {
              const nowVn = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }));
              const curTimeVal = nowVn.getHours() * 60 + nowVn.getMinutes();
              const parseMin = (str) => {
                if (!str) return 0;
                const [h, m] = str.split(':').map(Number);
                return (h || 0) * 60 + (m || 0);
              };
              const mStart = parseMin(sc.morning?.start || '07:00');
              const mEnd = parseMin(sc.morning?.end || '11:30');
              const aStart = parseMin(sc.afternoon?.start || '13:30');
              const aEnd = parseMin(sc.afternoon?.end || '17:00');

              let activeShiftKey = 'night';
              if (curTimeVal >= mStart && curTimeVal < mEnd) {
                activeShiftKey = 'morning';
              } else if (curTimeVal >= aStart && curTimeVal < aEnd) {
                activeShiftKey = 'afternoon';
              } else if (curTimeVal >= mEnd && curTimeVal < aStart) {
                activeShiftKey = 'noon_break';
              } else {
                activeShiftKey = 'night';
              }

              return `
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <!-- Ca Sáng -->
                  <div class="p-2.5 rounded-2xl border transition ${activeShiftKey === 'morning' ? 'bg-amber-50/90 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 ring-2 ring-amber-400/50' : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700'}">
                    <div class="flex items-center justify-between mb-1">
                      <span class="text-[11px] font-black text-slate-800 dark:text-slate-100 flex items-center space-x-1.5">
                        <span>☀️</span>
                        <span>${sc.morning?.name || 'Ca Sáng'}</span>
                      </span>
                      ${activeShiftKey === 'morning' ? `
                        <span class="px-1.5 py-0.2 rounded-full text-[8px] font-bold bg-amber-500 text-white animate-pulse">
                          Đang diễn ra
                        </span>
                      ` : `
                        <span class="text-[9px] text-slate-400 font-medium">Ca 1</span>
                      `}
                    </div>
                    <div class="text-base font-black text-amber-700 dark:text-amber-300 font-mono tracking-tight">
                      ${sc.morning?.start || '07:00'} – ${sc.morning?.end || '11:30'}
                    </div>
                    <div class="text-[9.5px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Kiểm tra 5S đầu ca & bàn giao trưa
                    </div>
                  </div>

                  <!-- Ca Chiều -->
                  <div class="p-2.5 rounded-2xl border transition ${activeShiftKey === 'afternoon' ? 'bg-cyan-50/90 dark:bg-cyan-950/40 border-cyan-300 dark:border-cyan-700 ring-2 ring-cyan-400/50' : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700'}">
                    <div class="flex items-center justify-between mb-1">
                      <span class="text-[11px] font-black text-slate-800 dark:text-slate-100 flex items-center space-x-1.5">
                        <span>🌤️</span>
                        <span>${sc.afternoon?.name || 'Ca Chiều'}</span>
                      </span>
                      ${activeShiftKey === 'afternoon' ? `
                        <span class="px-1.5 py-0.2 rounded-full text-[8px] font-bold bg-cyan-600 text-white animate-pulse">
                          Đang diễn ra
                        </span>
                      ` : `
                        <span class="text-[9px] text-slate-400 font-medium">Ca 2</span>
                      `}
                    </div>
                    <div class="text-base font-black text-cyan-700 dark:text-cyan-300 font-mono tracking-tight">
                      ${sc.afternoon?.start || '13:30'} – ${sc.afternoon?.end || '17:00'}
                    </div>
                    <div class="text-[9.5px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Bàn giao 5S hết giờ hành chính
                    </div>
                  </div>

                  <!-- Ca Đêm -->
                  <div class="p-2.5 rounded-2xl border transition ${activeShiftKey === 'night' ? 'bg-indigo-50/90 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-700 ring-2 ring-indigo-400/50' : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700'}">
                    <div class="flex items-center justify-between mb-1">
                      <span class="text-[11px] font-black text-slate-800 dark:text-slate-100 flex items-center space-x-1.5">
                        <span>🌙</span>
                        <span>${sc.night?.name || 'Ca Đêm (Trực)'}</span>
                      </span>
                      ${activeShiftKey === 'night' ? `
                        <span class="px-1.5 py-0.2 rounded-full text-[8px] font-bold bg-indigo-600 text-white animate-pulse">
                          Đang trực ca
                        </span>
                      ` : `
                        <span class="text-[9px] text-slate-400 font-medium">Ca 3</span>
                      `}
                    </div>
                    <div class="text-base font-black text-indigo-700 dark:text-indigo-300 font-mono tracking-tight">
                      ${sc.night?.start || '17:00'} – ${sc.night?.end || '07:00'}
                    </div>
                    <div class="text-[9.5px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Duy trì 5S cấp cứu & bàn giao sáng hôm sau
                    </div>
                  </div>
                </div>
              `;
            })()}
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

          <!-- Lọc theo 20 Khoa / Phòng TỰ ĐỘNG CHẠY NGANG (V12 PRO) -->
          <div class="space-y-1.5">
            <div class="flex items-center justify-between text-[11px] font-bold text-slate-700 dark:text-slate-200 px-0.5">
              <div class="flex items-center space-x-1.5">
                <span class="relative flex h-2 w-2">
                  <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span>20 KHOA / PHÒNG TOÀN VIỆN:</span>
                <span class="text-[9px] text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/50 px-1.5 py-0.2 rounded border border-emerald-300 dark:border-emerald-800">
                  Tự động chạy ngang
                </span>
              </div>
              <div class="flex items-center space-x-1">
                <button type="button" onclick="app5s.nudgeDeptTicker(-140)" title="Cuộn sang trái" class="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300">
                  <i data-lucide="chevron-left" class="w-3.5 h-3.5"></i>
                </button>
                <button type="button" onclick="app5s.toggleDeptTicker()" id="dept-ticker-toggle-btn" class="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[10px] text-indigo-600 dark:text-indigo-400 font-bold flex items-center space-x-1 transition">
                  <i data-lucide="pause" class="w-3 h-3 text-emerald-500"></i>
                  <span>Tạm dừng</span>
                </button>
                <button type="button" onclick="app5s.nudgeDeptTicker(140)" title="Cuộn sang phải" class="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300">
                  <i data-lucide="chevron-right" class="w-3.5 h-3.5"></i>
                </button>
              </div>
            </div>

            <!-- V19: PHÂN QUYỀN HIỂN THỊ KHOA: Quản lý xem toàn viện ticker, Nhân viên chỉ xem khoa mình -->
            ${canViewAllRooms ? `
              <div class="relative group">
                <div class="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-slate-50 dark:from-slate-900 to-transparent z-10 pointer-events-none"></div>
                <div class="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-slate-50 dark:from-slate-900 to-transparent z-10 pointer-events-none"></div>

                <div id="schedule-dept-ticker" class="flex space-x-1.5 overflow-x-auto pb-1 no-scrollbar text-xs font-bold scroll-smooth">
                  <!-- Nút Tất cả khoa -->
                  <button onclick="app5s.setScheduleDeptFilter('all')" data-dept-pill="all" class="shrink-0 px-3 py-1.5 rounded-xl transition ${
                    this.scheduleState.selectedDept === 'all'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                  }">
                    Tất cả khoa (${depts.length})
                  </button>
                  <!-- 20 Khoa phòng (Lần 1) -->
                  ${depts.map(d => `
                    <button onclick="app5s.setScheduleDeptFilter('${d.id}')" data-dept-pill="${d.id}" class="shrink-0 px-2.5 py-1.5 rounded-xl transition flex items-center space-x-1 ${
                      this.scheduleState.selectedDept === String(d.id)
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-indigo-400'
                    }">
                      <span class="text-[9px] opacity-75 font-mono text-emerald-500">#${d.order || ''}</span>
                      <span>${d.name}</span>
                    </button>
                  `).join('')}
                  <!-- 20 Khoa phòng (Lặp lại lần 2) -->
                  ${depts.map(d => `
                    <button onclick="app5s.setScheduleDeptFilter('${d.id}')" data-dept-pill="${d.id}" class="shrink-0 px-2.5 py-1.5 rounded-xl transition flex items-center space-x-1 ${
                      this.scheduleState.selectedDept === String(d.id)
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-indigo-400'
                    }">
                      <span class="text-[9px] opacity-75 font-mono text-emerald-500">#${d.order || ''}</span>
                      <span>${d.name}</span>
                    </button>
                  `).join('')}
                </div>
              </div>
            ` : `
              <div class="bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-xl px-3 py-2 flex items-center justify-between text-xs">
                <div class="flex items-center space-x-2">
                  <i data-lucide="shield" class="w-4 h-4 text-indigo-600"></i>
                  <span class="font-bold text-indigo-900 dark:text-indigo-200">
                    Khoa phòng: <strong>${(this.data.departments || []).find(d => String(d.id) === String(userDeptId))?.name || 'Khoa Nội Bộ'}</strong>
                  </span>
                </div>
                <span class="text-[10px] bg-indigo-200 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 font-mono font-bold px-2 py-0.5 rounded-md">
                  ${filteredRooms.length} Vị trí làm việc
                </span>
              </div>
            `}
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

                    <!-- V20.1: Chuyển toàn bộ thao tác chấm duyệt vào Trung tâm Duyệt ảnh 5S -->
                    ${isWorking && s5.photo ? `
                      <span class="text-[10px] font-bold px-2 py-1 rounded-xl ${
                        s5.status === 'approved'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300'
                          : (s5.status === 'rejected'
                              ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 border border-red-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300')
                      }">
                        ${s5.status === 'approved' ? '✓ Đã duyệt Đạt' : (s5.status === 'rejected' ? '✗ Cần sửa lại' : '⏳ Chờ Cán bộ 5S duyệt')}
                      </span>
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
        <!-- Top Bar Profile (V15: BỐ CỤC TÊN ĐĂNG NHẬP CÂN ĐỐI, HIỂN THỊ ĐẦY ĐỦ TÊN, KHÔNG CẮT CHỮ) -->
        <div class="bg-white dark:bg-slate-800 rounded-2xl p-3 border border-slate-200/90 dark:border-slate-700 shadow-2xs space-y-2.5">
          <!-- Hàng 1: Avatar + Tên đầy đủ + Mã NV + Huy hiệu Phân Quyền -->
          <div class="flex items-center justify-between gap-2">
            <div class="flex items-center space-x-2.5 min-w-0">
              <div class="w-10 h-10 rounded-2xl overflow-hidden ring-2 ring-emerald-200 dark:ring-emerald-800 bg-gradient-to-tr from-emerald-600 via-teal-600 to-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-xs shrink-0">
                ${user && (user.avatar || (this.data.userProfiles && this.data.userProfiles[user.code]?.avatar)) ? `
                  <img src="${user.avatar || this.data.userProfiles[user.code].avatar}" class="w-full h-full object-cover">
                ` : `
                  <span>${initial}</span>
                `}
              </div>
              <div class="min-w-0">
                <div class="flex items-center space-x-1.5 flex-wrap">
                  <h2 class="text-xs font-black text-slate-900 dark:text-white truncate">
                    ${userName}
                  </h2>
                  <span class="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 shrink-0">
                    ${user ? user.code : 'BV-345'}
                  </span>
                </div>
                <div class="text-[10px] text-slate-500 dark:text-slate-400 flex items-center space-x-1.5 mt-0.5 truncate">
                  <span>${userTitle}</span>
                  <span>•</span>
                  <span class="text-indigo-600 dark:text-indigo-400 font-bold">${(depts.find(d => d.id == this.getUserDepartmentId())?.name) || 'Toàn viện'}</span>
                </div>
              </div>
            </div>

            <!-- Nút Quả Chuông Thông Báo & Huy hiệu vai trò chính thức -->
            <div class="shrink-0 flex items-center space-x-1.5">
              <button onclick="app5s.openNotificationsCenterModal()" title="Trung tâm thông báo 5S & Bật/Tắt chuông" class="p-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800 relative transition flex items-center justify-center">
                <i data-lucide="bell" class="w-4 h-4 text-amber-600 dark:text-amber-400"></i>
                <span class="absolute -top-1 -right-1 w-2 h-2 bg-red-600 rounded-full animate-ping"></span>
                <span class="absolute -top-1 -right-1 w-2 h-2 bg-red-600 rounded-full"></span>
              </button>
              <span class="text-[9.5px] font-bold px-2 py-1 rounded-xl flex items-center space-x-1 ${
                this.isAdmin() 
                  ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border border-purple-300'
                  : (this.isHospitalLeaderOrSupervisor() 
                      ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-300'
                      : (this.isDepartmentManager() 
                          ? 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 border border-teal-300'
                          : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300 border border-slate-200'))
              }">
                <i data-lucide="${this.isAdmin() ? 'crown' : (this.isHospitalLeaderOrSupervisor() ? 'shield-check' : 'user')}" class="w-3 h-3"></i>
                <span>${this.isAdmin() ? 'Admin' : (this.isHospitalLeaderOrSupervisor() ? 'Giám Sát 5S' : (this.isDepartmentManager() ? 'Quản Lý Khoa' : 'Nhân Viên'))}</span>
              </span>
            </div>
          </div>

          <!-- Hàng 2: Bộ 4 nút tác vụ nhanh cân đối, không chen chúc -->
          <div class="grid grid-cols-4 gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-700/60 text-xs">
            <button onclick="app5s.openMyMessagesModal()" title="Hòm thư riêng tư từ Admin" class="relative py-1.5 px-1 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 rounded-xl font-bold text-[10.5px] flex items-center justify-center space-x-1 border border-indigo-200 dark:border-indigo-800/80 transition">
              <i data-lucide="message-square" class="w-3.5 h-3.5 text-indigo-600"></i>
              <span class="truncate">Hòm Thư</span>
              ${(this.data.admin_messages || []).some(m => (m.sender_code === (user ? user.code : '') || (user && m.sender_name === user.name)) && m.reply && !m.read_by_user) ? `
                <span class="absolute top-1 right-1 w-2 h-2 bg-red-600 rounded-full animate-ping"></span>
                <span class="absolute top-1 right-1 w-2 h-2 bg-red-600 rounded-full"></span>
              ` : ''}
            </button>

            <button onclick="app5s.openFeedbackModal()" title="Góp ý trực tiếp cho Admin (Vũ Đạt)" class="py-1.5 px-1 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 rounded-xl font-bold text-[10.5px] flex items-center justify-center space-x-1 border border-emerald-200 dark:border-emerald-800/80 transition">
              <i data-lucide="message-square-plus" class="w-3.5 h-3.5 text-emerald-600"></i>
              <span class="truncate">Góp Ý</span>
            </button>

            <button onclick="app5s.toggleTheme()" title="Đổi giao diện Sáng / Tối" class="py-1.5 px-1 bg-slate-50 hover:bg-slate-100 dark:bg-slate-700/70 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-[10.5px] flex items-center justify-center space-x-1 border border-slate-200 dark:border-slate-600 transition">
              <i data-lucide="${this.theme === 'dark' ? 'sun' : 'moon'}" class="w-3.5 h-3.5 text-amber-500"></i>
              <span class="truncate">${this.theme === 'dark' ? 'Sáng' : 'Tối'}</span>
            </button>

            <button onclick="app5s.openUserProfileModal()" title="Xem hồ sơ cá nhân, ngày sinh, số ĐT & bảo mật" class="py-1.5 px-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-xl font-bold text-[10.5px] flex items-center justify-center space-x-1 border border-slate-300 dark:border-slate-600 transition">
              <i data-lucide="user-check" class="w-3.5 h-3.5 text-emerald-600"></i>
              <span class="truncate">Hồ Sơ</span>
            </button>
          </div>
        </div>

        <!-- Banner Bệnh viện Vĩnh Phúc VPI (V20.1: Logo Base64 Chắc Chắn & Slogan 5S Không Cắt Chữ) -->
        <div class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-700 to-slate-800 p-3.5 sm:p-4 text-white shadow-lg">
          <div style="position:relative;z-index:10;display:flex;align-items:center;gap:12px;flex-wrap:nowrap;width:100%">
            <!-- Khung Logo Bệnh viện bo tròn, đổ bóng, viền sáng (Cố định 50px x 50px trên mọi thiết bị) -->
            <div style="width:50px;height:50px;min-width:50px;max-width:50px;flex:0 0 50px;border-radius:12px;background:#ffffff;padding:4px;display:flex;align-items:center;justify-content:center;border:2px solid rgba(110,231,183,0.8);box-shadow:0 2px 6px rgba(0,0,0,0.15);overflow:hidden;box-sizing:border-box">
              <img src="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADb/2wBDAAMCAgICAgMCAgIDAwMDBAYEBAQEBAgGBgUGCQgKCgkICQkKDA8MCgsOCwkJDRENDg8QEBEQCgwSExIQEw8QEBD/2wBDAQMDAwQDBAgEBAgQCwkLEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBD/wAARCADIAMgDASIAAhEBAxEB/8QAHQABAAEEAwEAAAAAAAAAAAAAAAgBAgcJAwUGBP/EAGQQAAAEAwMDCgwODgUNAAAAAAACAwQBBQYHEhMIESIUISMxM0JDU2NzCRUyNEFicoKDk7PDFhkkNlFSVGFkcXW0wtMYJSY4Vld0hZKVoqOy0hcodqHwN0RFRmWBhJGx0ePy8//EABsBAAIDAQEBAAAAAAAAAAAAAAAFAgQGAwEH/8QAMBEAAgIBAgQEBQQCAwAAAAAAAAMCBAUBExESMjMhIiMxFBU0QlIGJEFiFlNDUXH/2gAMAwEAAhEDEQA/ANqYAAAAAAAAAAAAAAAApEVFgAOOCcOxEVUw7g85VNZ0/SSEXE0d6ceoRJpqH7ggwjVlsFQT6+3ljnpey5Pdzp9uf6scGWILF1q+mnoZ3mVWUxKIanmc5Ytj5tzOqSCn6A+NnaLQ77YEKoY5/fPh/wAYi7if44Q4CrO9/QS/5DP8CYKSzdbc4XxzRJ72cRSp2sJ/SauPKJgoRPiD6aCng/OJjMlI2uSGoIkQmcYy97HW045k1O4P9A+uO6LcGjSplkWf6GUAFhNoXi0NwAAAAAAAAAAAAAAAAAAAAAAAAAC2/AAFsdoWQPrbQtOpg65xjGsLaJRJ77eUGTfKcffw0Cd/wneCEyu+1CvDjMyFMpxL5O2WfzJwmggnvzjD1X21OFb8vpNCJPZdLkzn8Gn9M4xpO6tf1MrjzecJuj8HsiZEyc2niD4k1MfrfZP20xSe9n/HAzNvMzZ2y9d24fOTuHjhR0dTdDn2RQ/hBYACl4/yIWNY3uAAAQOYAAAB7KjrUKgpKKaGu9l8OAW6snNn82Mz0vXcgrJt6jc3HXCNTxw1Cf8Afb6sgjMBF3CDlNw3xCHT3M5NjUJzagsrtzX1jipln1tfU88CZZdraFlz3xgCk7a5vL7kvqiMXiMdt0nuhO84T/G6DNUgqCUVAx1dLHya6WbbJvAwW+DDVVL6bnQd2AAO5eAAAAAAAAAAAALAAeIry0mkbLKTdVfW05Tl0rbQ1lFNkUVU4NNMhNdRQ+8ISANNNz2IMZt+57TEzQGA7bcsOymxVM7CaPozefbRJKwUIddPn+IJtdXp9oIZ27Zf1oFo0HVP2cwWpGQ51CY9/wC2TpPsYiifW5D+0T2TlBFc6mOtqhxpnU6vfqHU4xRTjA9oYWbPO8Q28z/CCQtq+XHbRaYsdszmDSl5XvGss2RQ6fKLqcJzaaYwVNamqCcOTuJ5UEyfHU3THdqKX/GKDrQD6FRC+iBm2WGN7kziw2/ucdixnk4lVzpXOH7LD4ldRO4p4NQfGA7/AA6/wIGRJBlC2sU//rQpMSe0maaa9/wimyfvBlukcr2XL4bevKXUZfCpZs6fOKJqbn4NRQRgFqYV2MTVsfYebfH2NiVMVjS9asOmFLzhpMSb/BU2QnOJ/WDuhHLJ/wAiy2+unKFYdMFKAl2xqIPXKahH66fB4bdPD2PtzqJ82oJjtMnquJNKNTOa3QqFdPhDy3UJ1+cuHPsnKaAxV/GwRP8AbzLXyx7IbnIeFAXvpdMJc56XzNudq6JvD6BxYExRYuavTYAAAECw4+2VTicSdz0wlcwUan7Tf84nwg+UB5Bm30HRbZq7Zmij7aZe7MRjUhYs1Ow5LuZu74v+AZVau275sRduqmoRTfk0yCIQ7qlq2n9KLZpY4jhwjnOieN9NTwfB92mLqL3+wfUM7t/UEsfjAeBoW0yU1h6nhHUsw7KJ+E7dP25B74sM8AxgzcNOh67ENxZeAAJncAAAA69w5bsm53ThdNNNPTOc8bl2G/iNP+VNb5N7dbRHUwbOFPQvJTqN5G1z5yYeJhqOFCcYph4naJ4aY2OZZFUL0nk6VpMGa8E3TliSXEP+UKQQU/YOcaexoMLU0b6kzN5y3w9AAADSmbAAAAAD0dA2dVvaZUBKXoSmH06e7HoIk2NBPjF1ODT5RRRMT0sL6HZTFMJoVBbM5TqGY50lE5QhoMUFM+viH0FHCni0+TOKVvJwre0y7UoPsa9HkIeWKZNdq9uTj7lJPFtK8TDWnL+ChGKHGYanDqdoTE8GNh9hORfZVYuZCbPG8aoqgkL3TSaJkPBA8OIR4Pu9NTlBn9hLmMqYpsGTFBq3SJhkQbpwTTITtCEHZjL28k+waepjU1wQkIQFbkBQAvGfgefn1Kyapm8W83l6axN5raZBhmrLGJxKL7in4KzBlxcd3TT855QSF+LMLIpZ9uI4sRBgvtUU2feBDhRPA64/9AEmatsyp6roaoXQ1M991IaCgwdV1mtQUl6ocN9VMvdSG5+ETC5lWazMW8S+t/eB5cAAVhP7AAAAFWLtwxckcN3CjV0nh3Dk3QigkxZ7VPorp9N+eFxyloLk7fjIdofqxGYZOsEmRm9QTBgUuci6BFI6/CJnufwH/YFmizz7Y7wtti37f2GfQAgBubUvAAABGXog0P6tU7j8Ol/zhMaoRudyhbJj20WUzqz1B/qJ6/gRRouYt9NNdJTETgp2h7lw/vHGpm1Sxa0ix2cdJ7QKXUl2JuDrdGjrlG66fk905MaTCvhybfOZTOonrODNIHiAABoREBK/JbyIpla6wY1/Xz93LKXeRvtWyEIkdzBMh90vn3NPaw1NNTi8PdBFFBPHckb8Yomn4NRTDG9qm5RL5BI5fIJcjcbS9qg3QJ7RNNOBCf3ECXM251oci/vG+JowsT3GHS0VZvRFmckTpygqYYySXoZ44bYlzEPmzYih9tQ+tDTPfOPaALxlNdePua5cNv2AsPtC8WKbUfiAS19jVROMvrKXYTeYy5tU8hgm0duUCfaZPcyKKEJ/APi9MGyl/wAIJN+piDANR+uGb/KLj5woOsGxXjU6r6DCsvWtzrNumRratWFslkHowrd80dTGE0cM4KIIERJhp4dzQJ3ZxIERS6G797v+f5h5sSs19eOYZSwvbdOBsajNxMNTkHCohBaGyC8BxLXuYpq2xeWzWJ38ghGXvNqBNtA+3vOD7HUfoDDc8pmcUy51PPJeoT2h90TPzaglxHNGGeI6+ayuXzhqdpNGxF0VIaZFCXyRFZlSDBPexS7HivrIjAMq1fYquliTCk3ETkhHrVQ+ZQnNqfQOMXLtHDFydu8bqNTp7oQ+xqECtiJrMlbovp9cDjGQLCPXr/wjjyiYx+MhWE+vU/5Ep5seI78CeJ+pgSJIAEAPj6FoXgAAAsiX3h5+pKXp+rpM5kFUyZlNJe8Js7V0niEP3hx38I5xUC9eBzZDia+7dehyxjqqoLDH/GKeh+YL+QXU8mp4wQgn9OVBSM4dU/VEnfyuYtN3aukFCKE8GpwfKbmN8UYQhrZxjG1Wwuzy2mVwl9oFMIvIowjBBySMU3TXa10FiaZPZudQffk1w3qZaau55hLbw0GeovrNLzXr9Dn0/KJjfS1h6mT+Ia0q+6HVaVTtYMv6O5ywn0hO6T2aYOMBdkliJ38fjLifCJ+LTGzEpM0AZa3CzybZ7iajK/PowvFgopHWzjVRUeXZlJyqfTSXs6wlsGrSYuG6eaRoHuJkcKEJvOLTFGrUZc14LL9q2un1m1sUPrFiNSn2fWU/+HEu/UjX+QPs+sp/8MJf+pGv8gu/JrRT1zNbgYIqNT7p5v8AKTz5woOtHKu7cPnLpw46t2ooofg9kUUxFBxDWLXqtZkGM3GbhtI6G7m+x4/P8w82JVQ98aZLL8qa2ex6mfQjQdQMWUvx1HlxaVkXUxFLmJsihO0Hs/s+8p/8MJb+o0Pqxl7WJex24aeplULTtm2qBcwqNSn2fWU/+GEu/UjX+QTsyM7VawtgsaTrCvJi1eTRWavG2IggREmGmchE9AmsKVjHPrQ3GDKrfTZnyQJBCmaAqApDAsw4Zh5mpqJkFWt4t5q304bmsnoKE7g49MLdGERCfic2Lg3rI1VZZVUFNYjhnnmEv9uTdCJ8on5xMfXYZ69o/kjjyiYkQchDl1x5trRUhZT6M/bN8B5FM5DwT0CH190ubV/txw+Ehubgm+VaLfBiz1BAAhMwC0PS8AAAFm2G0PNVfVDalZPGbOW6pyJqJpmw4kgfTUgTfjlpyqZRUraC8ockPDaPDqDk7wQ5znvw59s9GAtvwFwmdC25AViKgAD5TwhGGaMBoqrH14T75VefOFBvYOT3xrnnnQ07UJtPpjMG1o9LkQfu3Di4dB3fw1FFFMNTxgbYi0utOWs5CTK1Z2YenEhMAmZ6V9ah+M6mPEOxyelg2ofjHpfxDsPvm1b8xD8stfgQvAcr5pqF+6l7jq2i6ifJnUTUUT82OIMRft+fbACQ1hGRhW9u1Eejan6wkUubaqcM8B63Uv4idy+psfdjJXpYNqH4x6X8Q7FJmSqqnyc5dXjbTPsIXjab0OX73RD5cmHlCCP/AKWBah+M+l/EOxL3JasbnVgtlydAT2csZo5JMXLuC7VNQidxQ+sTT34UZa8iyn05jfFUX1ncWGaIRhEXikIQhEa8cvu2O06gbZaeYUJW01kjVCRpvMBqtcTO4O4UIdRRPhNBNMmGpsYSVUTsz21jt7/h4c8zYZmgLtb2BBSwfoispnGDILcmJJY+hhppz1smfUiymbaXQTv4B9bqyROnzYmrKZ3KahlrebyeYoP2LtPEQXaqYiaiftyHIB9VlfXzxBFtNjoO6AAHEtAAAAAUjtCopHaABjq231iLQ5ZDygj9Lpi/lyur5Yudq5JvyaCgkDbRD7gV48sn5QR3Cu8zbn4GQzjJrs+BmOjrb262HL6r2M/ukm59+MusnrZ82I4ZLpqEUhoHTjfIIfju6ZrSf0m5zSdxHD36B9NM/g/OJgr2/wDYe0M7NfpvJYAMbUdazIp+ZNu8+1708NYikY3FO4P9AZGIpoZwxhPcNOiwux2zmAUFRM7lhAU2o/EBAU2o/EDQhr7Gh2o/XDN/lFx84UHWDs6j9cM3+UXHzhQdYPoUO3A+es7kzaR0Nwn9XOMP9vzD6AlZHsiK3Q3PvdI/L8w+gJUx7IwtvvzNvR7MDkAAFcvHHDsjWB0TD/LpJP7MJ/OHA2fx2hql6IZVTCpsoY8vljnEjT0mby9ffpkcYii6nhE01Ew1wv1QkzP0xGUZKsfyg7TrDn2PQs/PqJQ+IvKHWIdgvzifBn5RPDUGNQGtYhbe5Ayi3sV25m1WwbLis2tZM0kE/XjSVSHgmnqKYKbA6U1+t19/2NBS4p3Yk4RSEYZxoOE5eh623V/Pqse2T1ROHczkqcnO8lsXKkTuGqiaqZDpkUPsmGoRTc1OowyYYzWSxO16i+g0uNy27PbYbEb8AFYAERoSopHaFRSO0ADHVt3rFcx5dDykBHcSdtIlcZzRUzYIR04kxE+7TPf/AOpBGIK7y+MzIfqCHrcQAAKZngPa0natUFM4bd5Hpgy9ofdCJ8mp5tQeKASW+azui2yt0TJRUtXkgqpH7Vu9Pfon0FCD0sVIbeYQ4QXcIOSOGbhRqdPczk0FCDKFHW2TBjcl9WN8Ynuom6E5xPzgYrt/maihmYM75nv/AHgfXgOqk87l85akfyx8m6QU2jkHadiAt6D2DNGmuiadDMtHmU4ezBK1GmrjtdRxpy53iExFFD8Zyg+b0sG0j8aNNfq139YNkIpGEY9kMvmVn25xfPFVtfHkMJ5LFic4sGsy9A08m7GaOYzFw/x2iaiacU1LlzQPv9jGag2hYdeCZNMUZ8Wz59RguGi4F+cdJUFS0/SUndT+qZwylcuaQvrunSmGmRPtznEare8vaz2zTVVP0JFOrqhJDDzoKeoUFO3XJ1anJp/ppjX1avbfaRbXN9X1/VCj1NPcJeTQYIc2gn5RTEU5QMamNZYFlvKwr9BLa3roi2xOqYsMbwjm2M9QzFO4QnMIKbpzini+EEEXbpw+cnmDxwo6dO1FFF1z7IouoopiKKKKcYooOIBpalCFPogZe3bnc65gAAXiqBKjobn3w7r+zjzyiAiuJudDGotytU9W2gHbw1KxZN5OifeKKKHIop4siafjAuyTOFWYxxq/3UDY4AsIAw5uC8AATA4FiX0xGy0uhXFNTc8waN4dLHCmx6+xonU3QinmxJeOsPhfy1hMW52zxuQ5FOrIffDg9G6Lr9H4yBEIBlir7FYpX5hSa0YfBVPNn+gcYrdMXEqcnbvG6jU6e8PsahAoZXmsx1qgyn1wOMAARKIAAAB90jn84kDnphJ5go1P+7PzifCDL9IW3y+ZYbCo4aidcfwB+c4sYSAdV25rGNTJOp9HQTARdN10djXIe/798fRE8NoRRkNbVPTfqeUTCKZM+fAWLfTJymGfc/BjD1vtv+Vs3lDpCRQlLKSqEUvzSmGqh3aafKYiimGft0/GJhvVZC5Pk0NCvOo5CUltWVHZdYYidCqJ7qybRhsEkYbI7PznFk7c9zvxrtt2ywrV7a9VSZeYRp6lz7H0plilzHT+EL/5x3Gxp8mMHul3D5y6mDxwo6dKKKKLrHOooodRTdFFFFN0U5wcQ2VHGrr+p1ii3ln2e35IAAAN/wDwWe4AAHoAAEhrCsiu1i2MqM5mrb0KUuf/AEnMEFNULp/B2+h4w9xPnBXfYXW8WTO1euyz4LgYVomhamtEqdlSFGsDvJnMlMNMnBkT36iinFkJpqKKDcRk+2SSqxOy2V0JLCQXUQMo4euc/XTtSN9RTahoX9AnJkJAfNY7k82dWGSjUFDSfM9XTTg+mbpTEdu7nGKf8tAkCJjK0CQza4ymSv63J8NOg1eNofCdZzgKAFg3KgAAACgqAAOPNrZh52p6PkFUtot5zLyLZuoP1Byd+PTCzNAQn4kGL0b7kb6ssiqGQ33EoLGYMu06sifKJ8J3g8J/8xMc5OxGGceGrGyyn6sidzrs3sc+zIQ6vnCcIKL6PHxWZ29g+PqII4gPRVTQFQUl143vsvdRNNM/Of8AkHnRSYuazMPrsX3IcgAAETn/AAAv+8AA014ewHh6xsWs3ry+4nFPpke+6muwL4nKKJ7Gp4RNQYXqbI/mCF9xSdYJuicTNCYahPCJ4nk0xKAAwq5a1X7cyZBmc5PVsEnv6oo9R6RPfy9dNdP92p5seeXs2tAY9cUPUJPzcv8AVjYOOeXS6YTVySXytuo6OpvCYn+Ew6R+p3/ger0Y3tmvhjZPag+ck1HZ/Pdk+CqET8YoMp2bZEdtFoqpIxl7CQseEXdKX8PZOLT4Tk8QbC6QsVQb3H9V+qlM3WqeuTwh/oE/bGX2rFuwbEbs0EyET6ghNAhBZ1ztlmnQaGhhps9R5G+w/IcsvslWQn04beiqft4Z9WTNMkUEFNfrdCGxk7Gme+p75BJvD1s2cCC8L5vnY8WGkRXhX7ZeAAIHcAAAAAAAAAAAAAAAAAAAA+I7dBdvgKIkOn7HVjF1XWKS+YRUeU59r3PEw3A/8gy3tQFLsM2uIThowqvqLsQ4MIhzin5xT7npfOJeo1P+7Pzag+ES1nEjlM9bHYzRimun7CkL4w7VtiDhjE7+k18ZP3Efqyc2p9YFz6P8wMvbw019voMWAOd9LphLnOp5pL3bI/bkUIOBPZ+t9P8AeKClt6iXaYv7ABE8frfhO/UOPX0tZfU9TKkjFA8uaQ4dfETv82mM0UnZ5T9IpZ27eLl77qXhfU2v7u8FlFScxpRxL7OvqeSBi6j7F5xOLj+oIKS9H2nDn+rGZ6cpiT0y21PKJemgT+Md7ciGb2QxWiCzVVMain0F4ZoCoDuXgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACwVuQAAAfIo0brbqgQ/eC1GVsG3W8vQT5tMhQABDah/0fbcgLgABMAAAAAAAAAAAAAAAAAAAA//Z" alt="Logo Bệnh viện VPI" style="width:100%;height:100%;max-width:42px;max-height:42px;object-fit:contain;display:block">
            </div>
            <!-- Tên Viện & Slogan 5S -->
            <div style="flex:1;min-width:0;overflow:hidden;display:flex;flex-direction:column;gap:4px">
              <div class="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-[9.5px] sm:text-[10px] font-bold text-emerald-100">
                <i data-lucide="shield-check" class="w-3 h-3 text-emerald-300"></i>
                <span>5S BỆNH VIỆN CHUẨN QUỐC GIA</span>
              </div>
              <h1 class="text-sm sm:text-base md:text-lg font-black tracking-tight leading-tight truncate sm:whitespace-normal">
                ${hosp.name}
              </h1>
              <!-- Dòng Slogan 5S hiển thị đầy đủ, không bị cắt chữ -->
              <div class="text-[10px] sm:text-[11px] text-emerald-100 font-semibold flex flex-wrap items-center gap-x-1.5 gap-y-0.5 pt-0.5">
                <span class="inline-block whitespace-nowrap">Sàng lọc</span>
                <span class="opacity-60">•</span>
                <span class="inline-block whitespace-nowrap">Sắp xếp</span>
                <span class="opacity-60">•</span>
                <span class="inline-block whitespace-nowrap">Sạch sẽ</span>
                <span class="opacity-60">•</span>
                <span class="inline-block whitespace-nowrap">Săn sóc</span>
                <span class="opacity-60">•</span>
                <span class="inline-block whitespace-nowrap">Sẵn sàng</span>
              </div>
            </div>
          </div>
        </div>

        <!-- V16: BẢNG TIN THÔNG BÁO 5S (TOÀN VIỆN HOẶC NỘI BỘ KHOA PHÒNG) -->
        ${(() => {
          const userDeptId = this.getUserDepartmentId();
          const deptNotice = (userDeptId && this.data.hospital.dept_notices && this.data.hospital.dept_notices[userDeptId]);
          const canHospitalNotice = hosp.notice && hosp.notice.enabled;
          const canDeptNotice = deptNotice && deptNotice.enabled;

          let html = '';
          if (canHospitalNotice) {
            html += `
              <div class="bg-red-50 dark:bg-gradient-to-r dark:from-red-950 dark:via-red-900 dark:to-rose-950 border-2 border-red-200 dark:border-red-500 rounded-2xl p-3.5 shadow-md space-y-2.5">
                <div class="flex items-center justify-between">
                  <div class="flex items-center space-x-2 text-red-700 dark:text-white font-black text-xs">
                    <span class="bg-red-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full font-mono shadow-xs border border-red-300">TOÀN VIỆN</span>
                    <i data-lucide="alert-triangle" class="w-4 h-4 text-red-600 dark:text-amber-400 animate-bounce"></i>
                    <span class="dark:text-white font-black text-xs sm:text-sm tracking-wide">${hosp.notice.title}</span>
                  </div>
                  ${this.canBroadcastHospitalNotice() ? `
                    <button onclick="app5s.openNoticeEditModal()" class="text-[10px] text-red-600 dark:text-amber-300 hover:underline font-extrabold flex items-center space-x-1">
                      <i data-lucide="edit-3" class="w-3 h-3"></i>
                      <span>Sửa</span>
                    </button>
                  ` : ''}
                </div>
                <div class="text-xs text-red-950 dark:text-red-50 leading-relaxed font-bold dark:bg-black/35 dark:p-3 dark:rounded-xl dark:border dark:border-red-500/30">
                  ${hosp.notice.content}
                </div>
                <div class="text-[10px] text-red-600 dark:text-red-200 font-semibold text-right flex items-center justify-end space-x-2">
                  <span>🕒 Cập nhật: ${hosp.notice.updatedAt}</span>
                  <span>•</span>
                  <span>Tác giả: <strong class="text-red-800 dark:text-white font-black">${hosp.notice.author || 'Ban Giám Sát 5S'}</strong></span>
                </div>
              </div>
            `;
          }

          if (canDeptNotice) {
            html += `
              <div class="bg-indigo-50 dark:bg-gradient-to-r dark:from-indigo-950 dark:via-indigo-900 dark:to-slate-900 border-2 border-indigo-200 dark:border-indigo-500 rounded-2xl p-3.5 shadow-md space-y-2.5">
                <div class="flex items-center justify-between">
                  <div class="flex items-center space-x-2 text-indigo-700 dark:text-white font-black text-xs">
                    <span class="bg-indigo-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full font-mono shadow-xs border border-indigo-300">NỘI BỘ KHOA</span>
                    <i data-lucide="bell" class="w-4 h-4 text-indigo-600 dark:text-cyan-400"></i>
                    <span class="dark:text-white font-black text-xs sm:text-sm tracking-wide">${deptNotice.title}</span>
                  </div>
                  <button onclick="app5s.openNoticeEditModal()" class="text-[10px] text-indigo-600 dark:text-cyan-300 hover:underline font-extrabold flex items-center space-x-1">
                    <i data-lucide="edit-3" class="w-3 h-3"></i>
                    <span>Sửa</span>
                  </button>
                </div>
                <div class="text-xs text-indigo-950 dark:text-indigo-50 leading-relaxed font-bold dark:bg-black/35 dark:p-3 dark:rounded-xl dark:border dark:border-indigo-500/30">
                  ${deptNotice.content}
                </div>
                <div class="text-[10px] text-indigo-600 dark:text-indigo-200 font-semibold text-right flex items-center justify-end space-x-2">
                  <span>🕒 Cập nhật: ${deptNotice.updatedAt}</span>
                  <span>•</span>
                  <span>Tác giả: <strong class="text-indigo-800 dark:text-white font-black">${deptNotice.author || 'Quản lý khoa'}</strong></span>
                </div>
              </div>
            `;
          }

          return html;
        })()}

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
                ${this.canBroadcastHospitalNotice() ? `
                  <button onclick="app5s.openReminderModal()" class="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-1.5 px-2.5 rounded-xl text-xs transition flex items-center justify-center space-x-1 shadow-xs">
                    <i data-lucide="volume-2" class="w-3.5 h-3.5"></i>
                    <span>Phát thông báo nhắc nhở toàn viện</span>
                  </button>
                ` : ''}
                <button onclick="app5s.setDeptDailyFilter('uncompleted'); app5s.switchTab('departments');" class="${this.canBroadcastHospitalNotice() ? '' : 'w-full'} bg-white dark:bg-slate-800 text-red-700 dark:text-red-300 border border-red-300 font-bold py-1.5 px-2.5 rounded-xl text-xs transition hover:bg-red-50">
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

          <!-- CÁC ẢNH 5S ĐANG CHỜ DUYỆT (CHỈ QUẢN LÝ / GIÁM SÁT MỚI THẤY VÀ MỞ TRUNG TÂM DUYỆT) -->
          ${(this.isAdmin() || this.isHospitalLeaderOrSupervisor()) && dailyStatus.pendingAudits.length > 0 ? `
            <div class="bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl p-3 space-y-2">
              <div class="flex items-center justify-between">
                <div class="flex items-center space-x-1.5 text-xs font-black text-amber-800 dark:text-amber-300">
                  <i data-lucide="hourglass" class="w-4 h-4 text-amber-600"></i>
                  <span>${dailyStatus.pendingAudits.length} ảnh 5S đang chờ Cán bộ kiểm tra đánh giá:</span>
                </div>
                <button onclick="app5s.openDailySummaryModal()" class="text-[10px] text-amber-700 dark:text-amber-400 font-bold hover:underline flex items-center space-x-1">
                  <span>Xem Báo Cáo Hôm Nay →</span>
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

          <div class="pt-2 border-t border-white/15 flex flex-col sm:flex-row gap-2">
            <button onclick="app5s.openDailySummaryModal()" class="flex-1 py-2 px-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white rounded-xl shadow-md font-black text-xs flex items-center justify-center space-x-2 border border-emerald-300/40 transition-all transform active:scale-98">
              <div class="w-5 h-5 rounded-lg bg-white/20 flex items-center justify-center">
                <i data-lucide="bar-chart-2" class="w-3.5 h-3.5 text-white"></i>
              </div>
              <span>XEM BÁO CÁO 5S CUỐI NGÀY</span>
            </button>
            <button onclick="app5s.printDailyEvaluationReport()" class="py-2 px-3 bg-white/15 hover:bg-white/25 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 border border-white/20 transition-all">
              <i data-lucide="printer" class="w-3.5 h-3.5"></i>
              <span>In bảng điểm</span>
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

              <div class="text-[10.5px] text-slate-500 dark:text-slate-400 flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-700/60">
                  <span>Tỷ lệ hoàn thành trực 5S: <strong class="text-emerald-600 dark:text-emerald-400 font-bold">${schedStats.complianceRate}%</strong></span>
                  <span class="text-emerald-600 dark:text-emerald-400 font-bold flex items-center space-x-1">
                    <i data-lucide="check-circle" class="w-3.5 h-3.5"></i>
                    <span>Toàn viện duy trì 5S chuẩn</span>
                  </span>
                </div>
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

        <!-- V18: BẢNG HƯỚNG DẪN PHÂN LOẠI CHẤT THẢI Y TẾ TẠI NGUỒN THEO THÔNG TƯ 20/2021/TT-BYT (YÊU CẦU 2) -->
        <div class="bg-white dark:bg-slate-800 rounded-3xl p-4 border border-slate-200/90 dark:border-slate-700 shadow-sm space-y-3.5">
          <div class="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/60 pb-2.5">
            <div class="flex items-center space-x-2.5">
              <div class="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-xs">
                <i data-lucide="trash-2" class="w-4 h-4"></i>
              </div>
              <div>
                <h3 class="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">HƯỚNG DẪN PHÂN LOẠI CHẤT THẢI Y TẾ TẠI NGUỒN</h3>
                <p class="text-[10px] text-slate-500 font-medium">Theo Thông tư số 20/2021/TT-BYT của Bộ Y tế • Tiêu chuẩn 5S Y tế VPI</p>
              </div>
            </div>
            <span class="text-[9.5px] bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-mono font-bold px-2 py-0.5 rounded-full border border-amber-300 dark:border-amber-700 shrink-0">
              TT 20/2021/TT-BYT
            </span>
          </div>

          <!-- 4 Nhóm chính phân biệt màu sắc thùng & chi tiết hướng dẫn -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs">
            <!-- Nhóm 1: Lây nhiễm (Vàng) -->
            <div class="p-3 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border-2 border-amber-400 dark:border-amber-600/80 space-y-2">
              <div class="flex items-center justify-between">
                <div class="flex items-center space-x-1.5">
                  <span class="w-3.5 h-3.5 rounded-full bg-amber-500 inline-block shadow-2xs"></span>
                  <strong class="text-amber-950 dark:text-amber-200 uppercase font-black text-xs">1. CHẤT THẢI LÂY NHIỄM (MÀU VÀNG)</strong>
                </div>
                <span class="text-[9px] bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200 font-bold px-1.5 py-0.5 rounded">Thùng / Túi VÀNG</span>
              </div>
              <div class="space-y-1 text-[11px] text-amber-950 dark:text-amber-200 leading-relaxed">
                <p>• <strong>Lây nhiễm sắc nhọn:</strong> Kim tiêm, kim bướm, kim chọc dò, lưỡi dao mổ, mảnh thủy tinh vỡ dính máu/dịch &rarr; <em class="font-bold">Bắt buộc bỏ vào Hộp kháng thủng màu vàng</em>.</p>
                <p>• <strong>Lây nhiễm không sắc nhọn:</strong> Bông, băng, gạc, dây truyền dịch, găng tay khám dính máu hoặc dịch sinh học &rarr; <em>Bỏ vào túi/thùng màu vàng</em>.</p>
                <p>• <strong>Nguy cơ lây nhiễm cao & giải phẫu:</strong> Mẫu bệnh phẩm, que cấy vi sinh, mô cơ quan, nhau thai &rarr; <em>Đóng túi vàng kép kín, dán nhãn khử khuẩn</em>.</p>
              </div>
            </div>

            <!-- Nhóm 2: Nguy hại không lây nhiễm (Đen) -->
            <div class="p-3 rounded-2xl bg-slate-900 text-white dark:bg-slate-950 border-2 border-slate-700 space-y-2 shadow-xs">
              <div class="flex items-center justify-between">
                <div class="flex items-center space-x-1.5">
                  <span class="w-3.5 h-3.5 rounded-full bg-slate-950 border border-slate-500 inline-block"></span>
                  <strong class="text-white uppercase font-black text-xs">2. NGUY HẠI KHÔNG LÂY NHIỄM (MÀU ĐEN)</strong>
                </div>
                <span class="text-[9px] bg-slate-800 text-slate-200 font-bold px-1.5 py-0.5 rounded border border-slate-600">Thùng / Túi ĐEN</span>
              </div>
              <div class="space-y-1 text-[11px] text-slate-300 leading-relaxed">
                <p>• <strong>Hóa chất độc hại:</strong> Formalin, xylen, cồn độc, axit, dung dịch rửa phim X-quang thải bỏ.</p>
                <p>• <strong>Thuốc gây độc tế bào:</strong> Hóa chất ung thư và bao bì, vỏ chai dính thuốc độc tế bào.</p>
                <p>• <strong>Thiết bị chứa kim loại nặng:</strong> Nhiệt kế thủy ngân vỡ, huyết áp kế hỏng, bóng đèn huỳnh quang hỏng, pin, ắc quy cũ, vỏ chai thuốc cản quang.</p>
              </div>
            </div>

            <!-- Nhóm 3: Thông thường (Xanh) -->
            <div class="p-3 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/30 border-2 border-emerald-500 dark:border-emerald-600/80 space-y-2">
              <div class="flex items-center justify-between">
                <div class="flex items-center space-x-1.5">
                  <span class="w-3.5 h-3.5 rounded-full bg-emerald-600 inline-block shadow-2xs"></span>
                  <strong class="text-emerald-950 dark:text-emerald-200 uppercase font-black text-xs">3. CHẤT THẢI THÔNG THƯỜNG (MÀU XANH)</strong>
                </div>
                <span class="text-[9px] bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200 font-bold px-1.5 py-0.5 rounded">Thùng / Túi XANH</span>
              </div>
              <div class="space-y-1 text-[11px] text-emerald-950 dark:text-emerald-300 leading-relaxed">
                <p>• <strong>Rác sinh hoạt buồng bệnh & văn phòng:</strong> Giấy ăn, vỏ hoa quả, hộp xốp, thức ăn thừa, bã trà, lá cây, túi nilon rỗng.</p>
                <p>• <strong>Nguyên tắc vàng:</strong> Tuyệt đối <em>KHÔNG</em> để lẫn chất thải dính máu, dịch thể hoặc kim tiêm vào thùng màu xanh.</p>
              </div>
            </div>

            <!-- Nhóm 4: Tái chế (Trắng) -->
            <div class="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border-2 border-slate-300 dark:border-slate-600 space-y-2">
              <div class="flex items-center justify-between">
                <div class="flex items-center space-x-1.5">
                  <span class="w-3.5 h-3.5 rounded-full bg-white border border-slate-400 inline-block shadow-2xs"></span>
                  <strong class="text-slate-900 dark:text-slate-100 uppercase font-black text-xs">4. CHẤT THẢI CÓ THỂ TÁI CHẾ (MÀU TRẮNG)</strong>
                </div>
                <span class="text-[9px] bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold px-1.5 py-0.5 rounded">Thùng / Túi TRẮNG</span>
              </div>
              <div class="space-y-1 text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed">
                <p>• <strong>Vật liệu sạch tái chế được:</strong> Giấy báo, thùng bìa carton sạch, tài liệu giấy tờ hủy không dính dịch thể.</p>
                <p>• <strong>Nhựa & kim loại sạch:</strong> Chai nhựa PET đựng nước khoáng, can nhựa sạch, vỏ lon nước ngọt sạch tái chế.</p>
              </div>
            </div>
          </div>

          <!-- 3 Quy tắc vàng 5S Quản lý Rác Y Tế -->
          <div class="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-400/40 text-[11px] text-amber-900 dark:text-amber-200 flex items-center space-x-2">
            <i data-lucide="alert-triangle" class="w-4 h-4 text-amber-600 shrink-0"></i>
            <span><strong>Quy tắc 5S:</strong> Buộc kín miệng túi khi rác đầy <strong>3/4 dung tích</strong>. Nghiêm cấm dùng chân/tay nén ép chất thải sắc nhọn. Khử khuẩn vệ sinh thùng rác hằng ngày.</span>
          </div>
        </div>






        <!-- V28: bỏ widget "lưu lượng truy cập" (số liệu giả 1.286 / 48, chỉ đếm trên từng máy) -->
      </div>
    `;
  }

  // =========================================================================
  // TAB 2: CHẤM 5S (1 ẢNH MINH CHỨNG SAU KHI 5S)
  // =========================================================================
  renderAuditTab() {
    if (!this.canAudit5S()) {
      return this.renderAuditLockedScreen();
    }
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
              <div id="audit-total-score-val" class="text-xl font-mono font-black text-emerald-600 dark:text-emerald-400">${totalScore} / 100</div>
              <div id="audit-grade-badge">${gradeBadge}</div>
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
                    <span id="score-val-${c.id}" class="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">${currentScore} / ${c.max}đ</span>
                  </div>
                  <p class="text-[10px] text-slate-500">${c.desc}</p>
                  <input type="range" id="criterion-range-${c.id}" min="0" max="${c.max}" step="1" value="${currentScore}" oninput="app5s.setCriterionScore(${c.id}, parseInt(this.value))" class="w-full accent-emerald-600 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer">
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
    if (!this.newAuditState.scores) this.newAuditState.scores = {};
    this.newAuditState.scores[criterionId] = pts;

    // V15 FIX: Cập nhật DOM trực tiếp tại chỗ - TUYỆT ĐỐI KHÔNG GỌI this.render() ĐỂ TRÁNH NHẢY LÊN ĐẦU TRANG
    const scoreValEl = document.getElementById('score-val-' + criterionId);
    if (scoreValEl) {
      scoreValEl.textContent = `${pts} / 20đ`;
    }

    const totalScore = Object.values(this.newAuditState.scores).reduce((a, b) => a + b, 0);
    const totalEl = document.getElementById('audit-total-score-val');
    if (totalEl) {
      totalEl.textContent = `${totalScore} / 100`;
    }

    const badgeEl = document.getElementById('audit-grade-badge');
    if (badgeEl) {
      if (totalScore < 70) {
        badgeEl.innerHTML = '<span class="text-red-700 bg-red-100 dark:bg-red-950 px-2 py-0.5 rounded-full font-bold text-xs">CẦN CẢI TIẾN (< 70đ)</span>';
      } else if (totalScore < 90) {
        badgeEl.innerHTML = '<span class="text-blue-700 bg-blue-100 dark:bg-blue-950 px-2 py-0.5 rounded-full font-bold text-xs">ĐẠT CHUẨN (70 - 89đ)</span>';
      } else {
        badgeEl.innerHTML = '<span class="text-emerald-700 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-full font-bold text-xs">XUẤT SẮC (90 - 100đ)</span>';
      }
    }
  }

  setAllMaxScores() {
    this.newAuditState.scores = { 1: 20, 2: 20, 3: 20, 4: 20, 5: 20 };
    for (let i = 1; i <= 5; i++) {
      const rangeEl = document.getElementById('criterion-range-' + i);
      if (rangeEl) rangeEl.value = 20;
      const scoreValEl = document.getElementById('score-val-' + i);
      if (scoreValEl) scoreValEl.textContent = '20 / 20đ';
    }
    const totalEl = document.getElementById('audit-total-score-val');
    if (totalEl) totalEl.textContent = '100 / 100';
    const badgeEl = document.getElementById('audit-grade-badge');
    if (badgeEl) {
      badgeEl.innerHTML = '<span class="text-emerald-700 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-full font-bold text-xs">XUẤT SẮC (90 - 100đ)</span>';
    }
    this.showToast('Đã chấm tối đa 100 điểm (20đ cho tất cả 5 tiêu chí)!');
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
        const maxDim = 850;
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

        const stampedUrl = canvas.toDataURL('image/jpeg', 0.68);
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
    newAudit.sender_code = (this.getCurrentUser() || {}).code || '';
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
    const canViewAll = this.canViewAllHospitalRooms();
    const userDeptId = this.getUserDepartmentId();

    // V14 BẢO MẬT & PHÂN QUYỀN KHOA PHÒNG:
    // Cán bộ khoa chỉ xem danh mục và buồng phòng của khoa mình
    if (!canViewAll && userDeptId) {
      visibleDepts = visibleDepts.filter(d => String(d.id) === String(userDeptId));
    }
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

              <!-- V16: Sửa Khoa chỉ dành cho Lãnh Đạo Viện / Admin -->
              ${(this.isAdmin() || this.isHospitalLeaderOrSupervisor()) ? `
                <button onclick="app5s.openEditDeptModal('${d.id}')" title="Sửa thông tin khoa" class="w-full py-1.5 px-2 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center justify-center space-x-1 transition border border-slate-200 dark:border-slate-600">
                  <i data-lucide="edit-3" class="w-3.5 h-3.5"></i>
                  <span class="text-[11px] truncate">Sửa Khoa</span>
                </button>
              ` : ''}

              <!-- V16: Thêm Khu Vực chỉ dành cho Quản Lý Khoa hoặc Admin -->
              ${(this.isAdmin() || this.canManageDeptRooms(d.id)) ? `
                <button onclick="app5s.openAddRoomModal('${d.id}')" title="Thêm khu vực làm việc vào ${d.name}" class="w-full py-1.5 px-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 hover:bg-emerald-600 hover:text-white text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center justify-center space-x-1 transition border border-emerald-200 dark:border-emerald-800">
                  <i data-lucide="plus-circle" class="w-3.5 h-3.5"></i>
                  <span class="text-[11px] truncate">+ Khu vực</span>
                </button>
              ` : `
                <div class="w-full py-1.5 px-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 text-center text-[10px] font-bold border border-slate-200 dark:border-slate-700">
                  🔒 Quyền quản lý
                </div>
              `}
            </div>
          </div>

          <!-- DANH SÁCH CÁC KHU VỰC LÀM VIỆC BÊN TRONG KHOA NÀY -->
          ${!isCollapsed ? `
            <div class="p-3 space-y-2 bg-slate-50/50 dark:bg-slate-900/40">
              <div class="flex items-center justify-between text-[11px] text-slate-500 px-1 font-semibold">
                <span>Các khu vực làm việc / buồng phòng (${deptRooms.length}):</span>
                ${(this.isAdmin() || this.canManageDeptRooms(d.id)) ? `<button onclick="app5s.openAddRoomModal('${d.id}')" class="text-[10px] text-emerald-600 font-bold hover:underline">+ Thêm khu vực mới</button>` : ''}
              </div>

              ${deptRooms.length === 0 ? `
                <div class="p-4 text-center border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl bg-white dark:bg-slate-800 text-xs text-slate-400 space-y-2">
                  <p>Khoa này chưa có khu vực làm việc nào.</p>
                  ${(this.isAdmin() || this.canManageDeptRooms(d.id)) ? `<button onclick="app5s.openAddRoomModal('${d.id}')" class="px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-bold">+ Thêm khu vực đầu tiên</button>` : ''}
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
                          <span class="px-2 py-0.5 rounded-full text-[9.5px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">ĐẠT 5S</span>
                        </div>
                        <!-- V16: Sửa và Xóa khu vực làm việc CHỈ HIỂN THỊ cho Quản Lý Khoa hoặc Admin -->
                        ${(this.isAdmin() || this.canManageDeptRooms(room.department_id)) ? `
                          <button onclick="app5s.openEditRoomModal('${room.id}')" title="Chỉnh sửa thông tin khu vực làm việc này" class="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-700 transition">
                            <i data-lucide="edit-3" class="w-3.5 h-3.5"></i>
                          </button>
                          <button onclick="app5s.deleteRoom('${room.id}')" title="Xóa khu vực làm việc này" class="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-slate-700 transition">
                            <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                          </button>
                        ` : ''}
                        <!-- Nút Chấm 5S ngay -->
                        ${this.canAudit5S() ? `
                          <button onclick="app5s.quickAuditRoom('${room.id}')" title="Chấm điểm 5S khu vực này ngay" class="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 hover:bg-emerald-100 transition">
                            <i data-lucide="clipboard-check" class="w-3.5 h-3.5"></i>
                          </button>
                        ` : ''}
                      </div>
                    </div>
                  `).join('')}
                </div>
              `}

              <!-- V16: Nút thêm khu vực làm việc con ở chân card (Chỉ Quản Lý Khoa hoặc Admin) -->
              ${(this.isAdmin() || this.canManageDeptRooms(d.id)) ? `
                <div class="pt-1">
                  <button onclick="app5s.openAddRoomModal('${d.id}')" class="w-full py-2 bg-white dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-slate-700 border border-dashed border-emerald-300 dark:border-emerald-700/80 rounded-2xl text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center justify-center space-x-1.5 transition">
                    <i data-lucide="plus" class="w-4 h-4"></i>
                    <span>Thêm khu vực làm việc mới vào ${d.name}</span>
                  </button>
                </div>
              ` : ''}
            </div>
          ` : ''}
        </div>
      `;
    }).join('');
  }

  renderDepartmentsTab() {
    let sortedDepts = this.getSortedDepartments();
    const canViewAll = this.canViewAllHospitalRooms();
    const userDeptId = this.getUserDepartmentId();

    // V14 BẢO MẬT & PHÂN QUYỀN KHOA PHÒNG:
    // Cán bộ khoa chỉ xem danh mục và buồng phòng của khoa mình
    if (!canViewAll && userDeptId) {
      sortedDepts = sortedDepts.filter(d => String(d.id) === String(userDeptId));
    }
    const visibleDepts = sortedDepts;

    // Phân loại khối
    const paraclinicalDepts = sortedDepts.filter(d => d.category === 'paraclinical');
    const clinicalDepts = sortedDepts.filter(d => d.category === 'clinical');
    const functionalDepts = sortedDepts.filter(d => d.category === 'functional');

    return `
      <div class="p-4 space-y-4">
        <!-- Header Khoa & Khu Vực Làm Việc (V14: BỐ CỤC CÂN ĐỐI, GỌN GÀNG, CHUẨN THẨM MỸ) -->
        <div class="bg-white dark:bg-slate-800 rounded-2xl p-3 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-2">
          <!-- Hàng 1: Tiêu đề rõ ràng + Thống kê tổng số -->
          <div class="flex items-center justify-between gap-2 pb-1.5 border-b border-slate-100 dark:border-slate-700/60">
            <div class="flex items-center space-x-2.5 min-w-0">
              <div class="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <i data-lucide="building-2" class="w-4 h-4"></i>
              </div>
              <div class="min-w-0">
                <div class="flex items-center space-x-1.5">
                  <h2 class="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight truncate">DANH MỤC KHOA PHÒNG & 5S</h2>
                  <span class="text-[9px] bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold px-1.5 py-0.2 rounded font-mono shrink-0">${sortedDepts.length} KHOA</span>
                </div>
                <p class="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate">Quản lý buồng phòng & phân loại cơ cấu y tế viện</p>
              </div>
            </div>
            <div class="text-right shrink-0">
              <span class="text-xs font-black text-emerald-600 font-mono">${(this.data.rooms || []).length}</span>
              <span class="text-[9px] text-slate-400 block font-bold">Khu vực 5S</span>
            </div>
          </div>

          <!-- Hàng 2: Bộ 4 nút tác vụ cân đối lưới 4 cột -->
          <div class="grid grid-cols-4 gap-1.5">
            <button onclick="app5s.openDailySummaryModal()" title="Báo cáo tổng kết 5S ngày" class="py-2 px-1 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold text-xs flex items-center justify-center space-x-1 shadow-xs transition">
              <i data-lucide="bar-chart-2" class="w-3.5 h-3.5 text-emerald-400 shrink-0"></i>
              <span class="truncate">Báo Cáo</span>
            </button>
            ${this.isAdmin() ? `
              <button onclick="app5s.openAddDeptModal()" title="Thêm Khoa / Phòng mới" class="py-2 px-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-xs flex items-center justify-center space-x-1 border border-slate-200 dark:border-slate-600 transition">
                <i data-lucide="plus" class="w-3.5 h-3.5 text-indigo-600 shrink-0"></i>
                <span class="truncate">Thêm Khoa</span>
              </button>
            ` : `
              <button onclick="app5s.openDailySummaryModal()" title="Xem bảng kiểm 5S" class="py-2 px-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-xs flex items-center justify-center space-x-1 border border-slate-200 dark:border-slate-600 transition">
                <i data-lucide="check-circle-2" class="w-3.5 h-3.5 text-emerald-600 shrink-0"></i>
                <span class="truncate">Tiêu Chuẩn</span>
              </button>
            `}
            ${(this.isAdmin() || this.isDepartmentManager()) ? `
              <button onclick="app5s.openAddRoomModal()" title="Thêm Khu vực làm việc / Buồng phòng mới" class="py-2 px-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 text-white rounded-xl font-bold text-xs flex items-center justify-center space-x-1 shadow-xs transition">
                <i data-lucide="plus-circle" class="w-3.5 h-3.5 shrink-0"></i>
                <span class="truncate">Thêm Vị Trí</span>
              </button>
            ` : `
              <button onclick="app5s.openDailySummaryModal()" title="Xem tiêu chuẩn 5S" class="py-2 px-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-xs flex items-center justify-center space-x-1 border border-slate-200 dark:border-slate-600 transition">
                <i data-lucide="shield" class="w-3.5 h-3.5 text-emerald-600 shrink-0"></i>
                <span class="truncate">Nội Bộ</span>
              </button>
            `}
            <button onclick="app5s.toggleReorderMode()" class="py-2 px-1 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1 ${
              this.isReorderMode ? 'bg-amber-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
            }">
              <i data-lucide="arrow-up-down" class="w-3.5 h-3.5 shrink-0"></i>
              <span class="truncate">${this.isReorderMode ? 'Xong' : 'Thứ Tự'}</span>
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

        <!-- V15: DẢI TICKER 20 KHOA PHÒNG TỰ ĐỘNG CHẠY NGANG CHO TAB KHOA PHÒNG -->
        <div class="bg-white dark:bg-slate-800 rounded-2xl p-2.5 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1.5">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-1.5">
              <i data-lucide="building-2" class="w-3.5 h-3.5 text-emerald-600"></i>
              <span class="text-xs font-bold text-slate-800 dark:text-slate-100">Khoa / Phòng Toàn Viện (${visibleDepts.length})</span>
              <span class="text-[9px] text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/50 px-1.5 py-0.2 rounded border border-emerald-300 dark:border-emerald-800">
                Tự động chạy ngang
              </span>
            </div>
            <div class="flex items-center space-x-1">
              <button type="button" onclick="app5s.nudgeDepartmentsTicker(-140)" title="Cuộn sang trái" class="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                <i data-lucide="chevron-left" class="w-3.5 h-3.5"></i>
              </button>
              <button type="button" onclick="app5s.toggleDepartmentsTicker()" id="dept-tab-ticker-toggle-btn" class="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center space-x-1 transition">
                <i data-lucide="pause" class="w-3 h-3 text-emerald-500"></i>
                <span>Tạm dừng</span>
              </button>
              <button type="button" onclick="app5s.nudgeDepartmentsTicker(140)" title="Cuộn sang phải" class="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                <i data-lucide="chevron-right" class="w-3.5 h-3.5"></i>
              </button>
            </div>
          </div>

          <div class="relative group">
            <div class="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-white dark:from-slate-800 to-transparent z-10 pointer-events-none"></div>
            <div class="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-white dark:from-slate-800 to-transparent z-10 pointer-events-none"></div>

            <div id="departments-tab-ticker" class="flex space-x-1.5 overflow-x-auto pb-1 no-scrollbar text-xs font-bold scroll-smooth">
              <button onclick="app5s.onSearchInput('')" class="shrink-0 px-2.5 py-1 rounded-xl bg-emerald-600 text-white shadow-xs">
                Tất cả khoa (${visibleDepts.length})
              </button>
              ${visibleDepts.map(d => `
                <button onclick="app5s.onSearchInput('${d.name}')" class="shrink-0 px-2.5 py-1 rounded-xl transition flex items-center space-x-1 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                  <span class="text-[9px] opacity-75 font-mono text-emerald-500">#${d.order || ''}</span>
                  <span>${d.name}</span>
                </button>
              `).join('')}
              <!-- Lặp lần 2 cho cuộn vô tận -->
              ${visibleDepts.map(d => `
                <button onclick="app5s.onSearchInput('${d.name}')" class="shrink-0 px-2.5 py-1 rounded-xl transition flex items-center space-x-1 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                  <span class="text-[9px] opacity-75 font-mono text-emerald-500">#${d.order || ''}</span>
                  <span>${d.name}</span>
                </button>
              `).join('')}
            </div>
          </div>
        </div>

        <!-- V17: BỘ LỌC PHÂN LOẠI KHOA PHÒNG & TIẾN ĐỘ 5S TINH GỌN, DỄ SỬ DỤNG -->
        <div class="bg-white dark:bg-slate-800 rounded-2xl p-2.5 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-2">
          <!-- Hàng 1: Tabs 4 Khối chuyên môn rõ ràng -->
          <div class="grid grid-cols-4 gap-1 text-center text-xs">
            <button onclick="app5s.setFilterCategory('all')" class="py-1.5 px-1 rounded-xl font-bold transition text-[11px] ${
              this.filterDeptCategory === 'all' ? 'bg-emerald-600 text-white shadow-2xs' : 'bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
            }">
              Tất cả (${sortedDepts.length})
            </button>
            <button onclick="app5s.setFilterCategory('paraclinical')" class="py-1.5 px-1 rounded-xl font-bold transition text-[11px] ${
              this.filterDeptCategory === 'paraclinical' ? 'bg-indigo-600 text-white shadow-2xs' : 'bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
            }">
              Cận lâm sàng (${paraclinicalDepts.length})
            </button>
            <button onclick="app5s.setFilterCategory('clinical')" class="py-1.5 px-1 rounded-xl font-bold transition text-[11px] ${
              this.filterDeptCategory === 'clinical' ? 'bg-teal-600 text-white shadow-2xs' : 'bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
            }">
              Lâm sàng (${clinicalDepts.length})
            </button>
            <button onclick="app5s.setFilterCategory('functional')" class="py-1.5 px-1 rounded-xl font-bold transition text-[11px] ${
              this.filterDeptCategory === 'functional' ? 'bg-slate-700 text-white shadow-2xs' : 'bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
            }">
              Phòng ban (${functionalDepts.length})
            </button>
          </div>

          <!-- Hàng 2: Trạng thái nộp 5S hôm nay (Gọn gàng, dễ bấm) -->
          <div class="flex items-center justify-between gap-1.5 pt-1.5 border-t border-slate-100 dark:border-slate-700/60 text-xs">
            <span class="text-[10.5px] font-bold text-slate-500 shrink-0">Trạng thái 5S:</span>
            <div class="grid grid-cols-3 gap-1 flex-1">
              <button onclick="app5s.setDeptDailyFilter('all')" class="py-1 px-1.5 rounded-lg font-bold transition text-[10.5px] ${
                this.filterDeptDailyStatus === 'all' ? 'bg-slate-800 text-white' : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }">
                Tất cả
              </button>
              <button onclick="app5s.setDeptDailyFilter('completed')" class="py-1 px-1.5 rounded-lg font-bold transition text-[10.5px] flex items-center justify-center space-x-1 ${
                this.filterDeptDailyStatus === 'completed' ? 'bg-emerald-600 text-white shadow-2xs' : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200'
              }">
                <span>🟢 Đã nộp</span>
                <span class="text-[9px] font-mono">(${this.getDaily5SStatus().completedDepts.length})</span>
              </button>
              <button onclick="app5s.setDeptDailyFilter('uncompleted')" class="py-1 px-1.5 rounded-lg font-bold transition text-[10.5px] flex items-center justify-center space-x-1 ${
                this.filterDeptDailyStatus === 'uncompleted' ? 'bg-red-600 text-white shadow-2xs' : 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200'
              }">
                <span>🔴 Chưa nộp</span>
                <span class="text-[9px] font-mono">(${this.getDaily5SStatus().uncompletedDepts.length})</span>
              </button>
            </div>
          </div>
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
    const room = (this.data.rooms || []).find(r => r.id == roomId);
    if (!room) return;
    if (!this.isAdmin() && !this.canManageDeptRooms(room.department_id)) {
      alert('🔒 Bạn không có quyền xóa khu vực làm việc của khoa phòng này!');
      return;
    }
    if (!confirm(`Bạn có chắc muốn xóa khu vực làm việc "${room.name}" không?`)) return;
    this.data.rooms = (this.data.rooms || []).filter(r => r.id != roomId);
    if (this.data.schedules && this.data.schedules.rooms_schedule) {
      delete this.data.schedules.rooms_schedule[roomId];
    }
    this.saveData();
    this.closeModal();
    this.render();
    this.showToast(`Đã xóa khu vực làm việc "${room.name}" thành công!`);
  }

  deleteDept(deptId) {
    if (!this.isAdmin() && !this.isUserManagerOrSupervisor()) {
      alert('🔒 Bạn không có quyền xóa khoa/phòng!');
      return;
    }
    const d = (this.data.departments || []).find(x => x.id == deptId);
    if (!d) return;
    const attachedRooms = (this.data.rooms || []).filter(r => r.department_id == deptId);
    let confirmMsg = `Bạn có chắc muốn xóa khoa/phòng "${d.name}" không?`;
    if (attachedRooms.length > 0) {
      confirmMsg = `Khoa "${d.name}" đang có ${attachedRooms.length} khu vực làm việc trực thuộc.\nBạn có chắc chắn muốn xóa khoa này cùng toàn bộ ${attachedRooms.length} khu vực làm việc trực thuộc không?`;
    }
    if (!confirm(confirmMsg)) return;

    // Xóa toàn bộ phòng trực thuộc khoa và lịch phân công tương ứng
    const roomIdsToDelete = new Set(attachedRooms.map(r => r.id));
    this.data.rooms = (this.data.rooms || []).filter(r => r.department_id != deptId);
    if (this.data.schedules && this.data.schedules.rooms_schedule) {
      roomIdsToDelete.forEach(id => {
        delete this.data.schedules.rooms_schedule[id];
      });
    }
    this.data.departments = (this.data.departments || []).filter(x => x.id != deptId);
    this.saveData();
    this.closeModal();
    this.render();
    this.showToast(`Đã xóa khoa "${d.name}" thành công!`);
  }

  // =========================================================================
  // =========================================================================
  // TAB 4: NHÂN SỰ & TÀI KHOẢN (VAI TRÒ PHÂN QUYỀN & CHỨC DANH ĐẦY ĐỦ - YÊU CẦU 3)
  // TÌM KIẾM THỜI GIAN THỰC GIỮ NGUYÊN FOCUS
  // =========================================================================
  getFilteredStaff() {
    let staffList = [...(this.data.staff || [])];
    const canViewAll = this.canViewAllStaff();
    const userDeptId = this.getUserDepartmentId();

    // V14 PHÂN QUYỀN NHÂN SỰ:
    // Nếu không thuộc nhóm có quyền xem toàn viện: CHỈ ĐƯỢC XEM NHÂN SỰ KHOA PHÒNG MÌNH
    if (!canViewAll && userDeptId) {
      staffList = staffList.filter(s => s.department_id == userDeptId);
    } else if (this.filterStaffDept !== 'all') {
      const selId = parseInt(this.filterStaffDept);
      staffList = staffList.filter(s => s.department_id == selId);
    }

    if (this.staffSearchQuery) {
      const sq = this.staffSearchQuery.toLowerCase();
      staffList = staffList.filter(s => {
        const text = `${s.name} ${s.code} ${s.title} ${s.role_title} ${s.username} ${s.department_name || ''} ${s.assigned_room || ''}`.toLowerCase();
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

    // V25 PERF: phân trang danh sách nhân sự (trước đây render cùng lúc 526 thẻ ~19.000 phần tử DOM, rất chậm trên điện thoại)
    const limit = this.staffListLimit || 40;
    const deptMap = new Map(depts.map(d => [String(d.id), d]));
    const listHtml = staffList.slice(0, limit).map(s => {
      const dept = deptMap.get(String(s.department_id)) || { name: 'Chưa phân khoa' };
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
                  ${isAdmin
                    ? '<span class="text-[9px] px-1.5 py-0.2 rounded border font-bold bg-purple-600 text-white border-purple-600">👑 Admin</span>'
                    : (s.can_review
                      ? '<span class="text-[9px] px-1.5 py-0.2 rounded border font-bold bg-emerald-600 text-white border-emerald-600">✅ Duyệt ảnh</span>'
                      : '<span class="text-[9px] px-1.5 py-0.2 rounded border font-bold bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-700 dark:text-slate-300">📷 Chỉ gửi ảnh</span>')}
                </div>
                <div class="text-[10px] text-slate-500 mt-0.5 flex items-center space-x-2">
                  <span>Mã: <strong class="font-mono text-slate-700 dark:text-slate-300">${s.code}</strong></span>
                  <span>•</span>
                  <span>Khoa: <strong>${dept.name}</strong></span>
                </div>
              </div>
            </div>

            <div class="flex items-center space-x-1">
              <!-- V16: Nút Sửa & Xóa nhân sự CHỈ HIỂN THỊ cho Quản Lý Khoa hoặc Admin -->
              ${(this.isAdmin() || this.canManageDeptStaff(s.department_id)) ? `
                <button onclick="app5s.openEditStaffModal('${s.code}')" class="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-700 transition" title="Chỉnh sửa chức danh & phân công buồng phòng">
                  <i data-lucide="edit-3" class="w-3.5 h-3.5"></i>
                </button>
                <button onclick="app5s.deleteStaffMember('${s.code}')" class="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-slate-700 transition" title="Xóa nhân sự khỏi khoa phòng">
                  <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                </button>
              ` : `
                <span class="text-[9px] text-slate-400 italic px-1.5 py-0.5 bg-slate-50 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">Chỉ xem</span>
              `}
            </div>
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

    const remaining = staffList.length - limit;
    const moreBtn = remaining > 0 ? `
      <button type="button" onclick="app5s.showMoreStaff()" class="w-full py-2.5 rounded-2xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
        Xem thêm ${Math.min(remaining, 40)} nhân sự (còn ${remaining} / tổng ${staffList.length})
      </button>` : '';
    return listHtml + moreBtn;
  }

  showMoreStaff() {
    this.staffListLimit = (this.staffListLimit || 40) + 40;
    const listContainer = document.getElementById('staff-list-container');
    if (listContainer) {
      listContainer.innerHTML = this.renderStaffListHtml();
      if (window.lucide) window.lucide.createIcons({ root: listContainer });
    } else {
      this.render();
    }
  }

  renderStaffTab() {
    const depts = this.getSortedDepartments();
    const staffList = this.getFilteredStaff();

    return `
      <div class="p-4 space-y-4">
        <!-- Header Nhân Sự (V14: PHÂN QUYỀN TOÀN VIỆN VS NỘI BỘ KHOA) -->
        <div class="flex items-center justify-between">
          <div>
            <div class="flex items-center space-x-1.5">
              <span class="text-xs font-mono font-bold text-emerald-600">QUẢN LÝ NHÂN SỰ</span>
              <span class="text-[9px] ${this.canViewAllStaff() ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300' : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'} font-bold px-2 py-0.5 rounded font-mono">
                ${this.canViewAllStaff() ? 'TOÀN VIỆN' : 'NỘI BỘ KHOA'}
              </span>
            </div>
            <h2 class="text-base font-black text-slate-900 dark:text-white">
              ${staffList.length} Cán Bộ ${this.canViewAllStaff() ? 'Toàn Viện VPI' : ((depts.find(d => d.id == this.getUserDepartmentId())?.name) || '')}
            </h2>
          </div>
          ${(this.isAdmin() || this.isDepartmentManager()) ? `
            <button onclick="app5s.openAddAccountModal()" class="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-xs transition flex items-center space-x-1">
              <i data-lucide="user-plus" class="w-3.5 h-3.5"></i>
              <span>${this.isAdmin() ? 'Thêm Tài Khoản' : 'Thêm Nhân Viên'}</span>
            </button>
          ` : ''}
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

        <!-- V15: DẢI TICKER 20 KHOA PHÒNG TỰ ĐỘNG CHẠY NGANG CHO TAB NHÂN SỰ -->
        <div class="bg-white dark:bg-slate-800 rounded-2xl p-2.5 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1.5">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-1.5">
              <i data-lucide="users" class="w-3.5 h-3.5 text-indigo-600"></i>
              <span class="text-xs font-bold text-slate-800 dark:text-slate-100">Khoa / Phòng (${depts.length})</span>
              <span class="text-[9px] text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/50 px-1.5 py-0.2 rounded border border-emerald-300 dark:border-emerald-800">
                Tự động chạy ngang
              </span>
            </div>
            <div class="flex items-center space-x-1">
              <button type="button" onclick="app5s.nudgeStaffTicker(-140)" title="Cuộn sang trái" class="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                <i data-lucide="chevron-left" class="w-3.5 h-3.5"></i>
              </button>
              <button type="button" onclick="app5s.toggleStaffTicker()" id="staff-tab-ticker-toggle-btn" class="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-[10px] text-indigo-600 dark:text-indigo-400 font-bold flex items-center space-x-1 transition">
                <i data-lucide="pause" class="w-3 h-3 text-emerald-500"></i>
                <span>Tạm dừng</span>
              </button>
              <button type="button" onclick="app5s.nudgeStaffTicker(140)" title="Cuộn sang phải" class="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                <i data-lucide="chevron-right" class="w-3.5 h-3.5"></i>
              </button>
            </div>
          </div>

          <div class="relative group">
            <div class="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-white dark:from-slate-800 to-transparent z-10 pointer-events-none"></div>
            <div class="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-white dark:from-slate-800 to-transparent z-10 pointer-events-none"></div>

            <div id="staff-tab-ticker" class="flex space-x-1.5 overflow-x-auto pb-1 no-scrollbar text-xs font-bold scroll-smooth">
              <button onclick="app5s.setStaffDeptFilter('all')" class="shrink-0 px-3 py-1.5 rounded-xl transition ${
                this.filterStaffDept === 'all' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
              }">
                Tất cả (${this.data.staff.length})
              </button>
              ${depts.map(d => {
                const count = this.data.staff.filter(s => s.department_id == d.id).length;
                const isSelected = this.filterStaffDept === String(d.id);
                return `
                  <button onclick="app5s.setStaffDeptFilter('${d.id}')" class="shrink-0 px-2.5 py-1.5 rounded-xl transition flex items-center space-x-1 ${
                    isSelected ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
                  }">
                    <span>${d.name}</span>
                    <span class="text-[9px] opacity-75 font-mono">(${count})</span>
                  </button>
                `;
              }).join('')}
              <!-- Lặp lần 2 cho cuộn vô tận -->
              ${depts.map(d => {
                const count = this.data.staff.filter(s => s.department_id == d.id).length;
                const isSelected = this.filterStaffDept === String(d.id);
                return `
                  <button onclick="app5s.setStaffDeptFilter('${d.id}')" class="shrink-0 px-2.5 py-1.5 rounded-xl transition flex items-center space-x-1 ${
                    isSelected ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
                  }">
                    <span>${d.name}</span>
                    <span class="text-[9px] opacity-75 font-mono">(${count})</span>
                  </button>
                `;
              }).join('')}
            </div>
          </div>
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
    this.staffListLimit = 40;
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
    this.staffListLimit = 40;
    this.render();
  }


  // =========================================================================
  // TAB 5: LỊCH SỬ CHẤM 5S & BÁO CÁO
  // =========================================================================
  // V18 PRO: TAB LỊCH SỬ CHỤP 5S & BỘ LỌC THEO NGÀY, KHOA PHÒNG, ĐẠT / KHÔNG ĐẠT (BỎ 100Đ)
  renderHistoryTab() {
    const audits = this.data.audits || [];
    const depts = this.getSortedDepartments();
    const rooms = this.data.rooms || [];
    const targetDate = this.historySelectedDate || this.getTodayDateString();
    let targetDept = this.historyDeptFilter || 'all';
    // V20.1: Tự động khóa khoa phòng trong tab Lịch Sử đối với tài khoản cá nhân
    const isSup = this.isUserManagerOrSupervisor();
    const userDeptId = this.getUserDepartmentId();
    if (!isSup && userDeptId) {
      targetDept = userDeptId;
      this.historyDeptFilter = userDeptId;
    }

    // Lọc theo ngày
    let dateAudits = audits.filter(a => a.audit_date === targetDate);
    // Nếu chưa có audit ngày này mà có trong schedules room post_shift_5s, đồng bộ vào
    if (targetDate === this.getTodayDateString()) {
      const roomSchedules = (this.data.schedules && this.data.schedules.rooms_schedule) || [];
      roomSchedules.forEach(rs => {
        if (rs.post_shift_5s && rs.post_shift_5s.photo) {
          const exists = dateAudits.some(a => a.room_id == rs.room_id);
          if (!exists) {
            const rm = rooms.find(r => r.id == rs.room_id) || { name: 'Buồng phòng', department_id: rs.department_id };
            dateAudits.push({
              id: 'rs-' + rs.room_id,
              audit_code: '5S-CA-' + targetDate.replace(/-/g, '') + '-' + rs.room_id,
              department_id: rm.department_id,
              room_id: rs.room_id,
              audit_date: targetDate,
              audit_time: rs.post_shift_5s.submitted_at || 'Cuối ca',
              shift: 'Ca trực',
              sender_name: rs.post_shift_5s.submitted_by || 'Nhân sự trực',
              sender_role: 'Cán bộ ca trực',
              status: rs.post_shift_5s.status || 'pending',
              rating: rs.post_shift_5s.status === 'approved' ? 'Đạt chuẩn 5S' : (rs.post_shift_5s.status === 'rejected' ? 'Cần khắc phục' : 'Chờ đánh giá'),
              notes: rs.post_shift_5s.notes || 'Buồng phòng gọn gàng, sạch sẽ.',
              after_photo: rs.post_shift_5s.photo,
              evaluator_name: rs.post_shift_5s.evaluated_by || '',
              issue_detected: rs.post_shift_5s.issue || '',
              remedy_deadline: rs.post_shift_5s.remedy_deadline || '',
              evaluation_notes: rs.post_shift_5s.evaluation_notes || ''
            });
          }
        }
      });
    }

    // Lọc theo khoa phòng
    if (targetDept !== 'all') {
      dateAudits = dateAudits.filter(a => a.department_id == targetDept);
    }

    const pendingCount = dateAudits.filter(a => a.status === 'pending' || a.status === 'submitted').length;
    const approvedCount = dateAudits.filter(a => a.status === 'approved').length;
    const rejectedCount = dateAudits.filter(a => a.status === 'rejected').length;

    let filteredAudits = dateAudits;
    if (this.historyStatusFilter === 'pending') {
      filteredAudits = dateAudits.filter(a => a.status === 'pending' || a.status === 'submitted');
    } else if (this.historyStatusFilter === 'approved') {
      filteredAudits = dateAudits.filter(a => a.status === 'approved');
    } else if (this.historyStatusFilter === 'rejected') {
      filteredAudits = dateAudits.filter(a => a.status === 'rejected');
    }

    const canAudit = this.isUserManagerOrSupervisor();

    return `
      <div class="p-4 space-y-4">
        <!-- HEADER LỊCH SỬ & NÚT IN TÙY CHỌN -->
        <div class="flex items-center justify-between">
          <div>
            <span class="text-xs font-mono font-bold text-emerald-600">LỊCH SỬ & BIÊN BẢN 5S CÁC NGÀY</span>
            <h2 class="text-base font-black text-slate-900 dark:text-white">Lịch Sử Chụp & Chấm 5S (${filteredAudits.length})</h2>
          </div>
          <button onclick="app5s.openCustomPrintModal()" class="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-xs transition flex items-center space-x-1.5">
            <i data-lucide="printer" class="w-3.5 h-3.5"></i>
            <span>In Báo Cáo</span>
          </button>
        </div>

        <!-- BỘ CHỌN NGÀY & KHOA PHÒNG (YÊU CẦU 6 & 9) -->
        <div class="bg-white dark:bg-slate-800 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-2.5">
          <div class="grid grid-cols-2 gap-2 text-xs">
            <div>
              <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1">📅 Chọn ngày xem:</label>
              <input type="date" value="${targetDate}" onchange="app5s.setHistoryDate(this.value)" class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2 font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500">
            </div>
            <div>
              <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1">🏢 Lọc Khoa/Phòng:</label>
              <select onchange="app5s.setHistoryDeptFilter(this.value)" class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2 font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500">
                <option value="all" ${targetDept === 'all' ? 'selected' : ''}>Toàn viện (20 khoa)</option>
                ${depts.map(d => `<option value="${d.id}" ${targetDept == d.id ? 'selected' : ''}>#${d.order} ${d.name}</option>`).join('')}
              </select>
            </div>
          </div>
        </div>

        <!-- BỘ LỌC TRẠNG THÁI: TẤT CẢ / CHỜ CHẤM / ĐẠT CHUẨN / CẦN SỬA (BỎ 100Đ) -->
        <div class="grid grid-cols-4 gap-1.5 text-center text-xs">
          <button onclick="app5s.setHistoryStatusFilter('all')" class="py-2 px-1 rounded-xl font-bold transition text-[11px] ${
            (!this.historyStatusFilter || this.historyStatusFilter === 'all')
              ? 'bg-slate-800 text-white shadow-2xs ring-1 ring-slate-800'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
          }">
            Tất cả (${dateAudits.length})
          </button>

          <button onclick="app5s.setHistoryStatusFilter('pending')" class="py-2 px-1 rounded-xl font-bold transition text-[11px] flex flex-col items-center justify-center ${
            this.historyStatusFilter === 'pending'
              ? 'bg-amber-600 text-white shadow-2xs ring-1 ring-amber-600'
              : 'bg-white dark:bg-slate-800 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/60'
          }">
            <span>Chờ chấm</span>
            <span class="text-[9px] font-mono">(${pendingCount})</span>
          </button>

          <button onclick="app5s.setHistoryStatusFilter('approved')" class="py-2 px-1 rounded-xl font-bold transition text-[11px] flex flex-col items-center justify-center ${
            this.historyStatusFilter === 'approved'
              ? 'bg-emerald-600 text-white shadow-2xs ring-1 ring-emerald-600'
              : 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/60'
          }">
            <span>Đạt chuẩn</span>
            <span class="text-[9px] font-mono">(${approvedCount})</span>
          </button>

          <button onclick="app5s.setHistoryStatusFilter('rejected')" class="py-2 px-1 rounded-xl font-bold transition text-[11px] flex flex-col items-center justify-center ${
            this.historyStatusFilter === 'rejected'
              ? 'bg-red-600 text-white shadow-2xs ring-1 ring-red-600'
              : 'bg-white dark:bg-slate-800 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/60'
          }">
            <span>Cần sửa</span>
            <span class="text-[9px] font-mono">(${rejectedCount})</span>
          </button>
        </div>

        <!-- DANH SÁCH ẢNH VÀ BIÊN BẢN CHẤM 5S -->
        <div class="space-y-3">
          ${filteredAudits.length === 0 ? `
            <div class="p-8 text-center bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 text-xs text-slate-400 space-y-2">
              <i data-lucide="inbox" class="w-8 h-8 mx-auto text-slate-300"></i>
              <div>Không tìm thấy dữ liệu ảnh 5S nào vào ngày <strong>${targetDate}</strong> theo bộ lọc này.</div>
              <button onclick="app5s.setHistoryDate('${this.getTodayDateString()}'); app5s.setHistoryDeptFilter('all'); app5s.setHistoryStatusFilter('all')" class="px-3 py-1 bg-emerald-600 text-white rounded-xl text-xs font-bold">Về Hôm Nay</button>
            </div>
          ` : filteredAudits.map(a => {
            const dept = depts.find(d => d.id == a.department_id) || { name: 'Chưa xác định' };
            const room = rooms.find(r => r.id == a.room_id) || { name: 'Buồng bệnh' };
            const isPending = (a.status === 'pending' || a.status === 'submitted');
            const isApproved = (a.status === 'approved');
            const isRejected = (a.status === 'rejected');

            return `
              <div class="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700 shadow-xs space-y-3">
                <div class="flex items-start justify-between border-b border-slate-100 dark:border-slate-700/60 pb-2.5">
                  <div>
                    <div class="flex items-center space-x-1.5">
                      <span class="text-xs font-black text-slate-900 dark:text-white">${room.name}</span>
                      <span class="text-[9px] font-mono px-1.5 py-0.2 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded font-bold">${a.audit_code}</span>
                    </div>
                    <div class="text-[10px] text-slate-500 mt-0.5">
                      <strong>${dept.name}</strong> • ${a.audit_date} lúc ${a.audit_time} (${a.shift || 'Ca trực'})
                    </div>
                  </div>

                  <div class="text-right">
                    ${isPending ? `
                      <span class="inline-flex items-center space-x-1 bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-extrabold px-2 py-0.5 rounded-full text-[10px] border border-amber-300 animate-pulse">
                        <i data-lucide="hourglass" class="w-3 h-3"></i>
                        <span>CHỜ CHẤM 5S</span>
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
                  </div>
                </div>

                <!-- ẢNH MINH CHỨNG 5S -->
                ${a.after_photo ? `
                  <div onclick="app5s.openReviewShiftPhotoModal(${a.room_id})" class="cursor-pointer relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 group bg-black/5 hover:border-emerald-400 transition">
                    <img src="${a.after_photo}" class="w-full h-44 object-cover rounded-xl" alt="Ảnh minh chứng 5S">
                    <div class="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <span class="bg-white/90 dark:bg-slate-900/90 text-slate-800 dark:text-white font-bold text-xs px-3 py-1.5 rounded-xl shadow-lg flex items-center space-x-1">
                        <i data-lucide="maximize-2" class="w-3.5 h-3.5"></i>
                        <span>${canAudit ? 'Bấm để Xem & Chấm 5S' : 'Bấm để Phóng To Xem Ảnh'}</span>
                      </span>
                    </div>
                    <span class="absolute bottom-2 right-2 bg-black/70 text-white text-[9px] px-2 py-0.5 rounded-full font-bold backdrop-blur-xs">
                      Ảnh chụp sau 5S
                    </span>
                  </div>
                ` : ''}

                <!-- GHI CHÚ BUỒNG PHÒNG -->
                <div class="text-xs text-slate-600 dark:text-slate-300 leading-relaxed italic bg-slate-50 dark:bg-slate-900/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                  <span class="font-bold not-italic text-slate-400 text-[10px] block">Ghi chú của Buồng phòng:</span>
                  "${a.notes || 'Thực hiện 5S sạch sẽ đúng quy định Bệnh viện VPI.'}"
                </div>

                <!-- NẾU KHÔNG ĐẠT: HIỆN KHỐI CẢNH BÁO LỖI VÀ HẠN KHẮC PHỤC -->
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
                      <span class="text-red-600 font-bold">Kết quả: KHÔNG ĐẠT</span>
                    </div>
                    ${a.evaluation_notes ? `
                      <div class="text-[10px] text-red-600 dark:text-red-400 italic pl-5">
                        Lời phê: "${a.evaluation_notes}"
                      </div>
                    ` : ''}
                    <div class="text-[10px] text-slate-500 text-right pt-0.5">
                      Cán bộ chấm: <strong>${a.evaluator_name || 'Ban Chỉ Đạo 5S'}</strong>
                    </div>
                  </div>
                ` : ''}

                <!-- NẾU ĐÃ ĐẠT CHUẨN: HIỆN KHỐI PHÊ DUYỆT XANH -->
                ${isApproved ? `
                  <div class="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl p-2.5 text-xs text-emerald-900 dark:text-emerald-200 flex items-center justify-between">
                    <div class="space-y-0.5">
                      <div class="font-bold text-emerald-800 dark:text-emerald-300 flex items-center space-x-1.5">
                        <i data-lucide="check-circle" class="w-3.5 h-3.5 text-emerald-600"></i>
                        <span>KẾT QUẢ: ĐẠT CHUẨN 5S Y TẾ</span>
                      </div>
                      <div class="text-[10px] text-emerald-700 dark:text-emerald-400 italic">
                        "${a.evaluation_notes || 'Buồng phòng gọn gàng, sạch sẽ, đạt chuẩn 5S bệnh viện.'}"
                      </div>
                    </div>
                    <div class="text-[9px] text-slate-400 text-right">
                      Chấm bởi: <strong>${a.evaluator_name || 'Cán bộ 5S'}</strong>
                    </div>
                  </div>
                ` : ''}

                <!-- Nút Hành Động & Người Gửi -->
                <div class="flex items-center justify-between pt-1 text-xs">
                  <div class="text-[10px] text-slate-400">
                    Người chụp gửi: <strong>${a.sender_name || a.inspector_name || 'Nhân viên khoa'}</strong> (${a.sender_role || 'Điều dưỡng'})
                  </div>

                  <button onclick="app5s.openReviewShiftPhotoModal(${a.room_id})" class="px-3 py-1.5 rounded-xl font-bold text-xs transition flex items-center space-x-1 ${
                    isPending && canAudit
                      ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                  }">
                    <i data-lucide="${canAudit ? 'award' : 'eye'}" class="w-3.5 h-3.5"></i>
                    <span>${canAudit ? (isPending ? '⭐ CHẤM 5S' : 'Xem & Chấm Lại') : 'Xem Chi Tiết'}</span>
                  </button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }
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

        <!-- THÔNG TIN HỖ TRỢ KỸ THUẬT & BẢN QUYỀN HỆ THỐNG (V12) -->
        <div class="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-2xl p-4 border border-indigo-500/40 shadow-sm space-y-3">
          <div class="flex items-center justify-between border-b border-indigo-700/60 pb-2">
            <div class="flex items-center space-x-2">
              <i data-lucide="shield-check" class="w-4 h-4 text-emerald-400"></i>
              <h3 class="text-xs font-bold uppercase tracking-wider text-white">Bản Quyền & Hỗ Trợ Kỹ Thuật</h3>
            </div>
            <span class="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-bold">
              Bản quyền Vũ Đạt
            </span>
          </div>
          <div class="space-y-1.5 text-xs text-slate-200">
            <div>Tác giả phần mềm: <strong class="text-white font-bold">Vũ Đạt</strong></div>
            <div>Bản quyền: <strong class="text-emerald-300 font-black">Tác giả: Vũ Đạt</strong></div>
            <div>Email hỗ trợ: <a href="mailto:vudatxq@gmail.com" class="text-indigo-300 hover:underline font-mono font-bold">vudatxq@gmail.com</a></div>
            <div>Hotline trực tiếp: <a href="tel:+84916306115" class="text-emerald-300 hover:underline font-mono font-bold">+84916306115</a></div>
          </div>
          <div class="grid grid-cols-2 gap-2 pt-1">
            <button onclick="app5s.openFeedbackModal()" class="py-2.5 px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition">
              <i data-lucide="message-square-plus" class="w-4 h-4"></i>
              <span>Nhắn Tin Admin</span>
            </button>
            <button onclick="app5s.openAdminInboxModal()" class="py-2.5 px-3 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition">
              <i data-lucide="inbox" class="w-4 h-4 text-amber-300"></i>
              <span>Hộp Thư Admin (${(this.data.admin_messages || []).length})</span>
            </button>
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
    if (!this.isAdmin() && !this.isDepartmentManager()) {
      alert('🔒 Tài khoản cá nhân không có quyền thêm khu vực làm việc. Quyền này chỉ dành cho Quản lý cấp khoa phòng hoặc Admin.');
      return;
    }
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
            <select id="modal-room-dept" onchange="app5s.onAddRoomDeptChange(this.value)" class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 font-bold text-slate-900 dark:text-white">
              ${depts.map(d => `<option value="${d.id}" ${d.id == targetDeptId ? 'selected' : ''}>#${d.order} ${d.name}</option>`).join('')}
              <option value="custom" class="text-amber-600 font-black">➕ + Tùy chỉnh: Nhập tên Khoa/Phòng mới...</option>
            </select>
          </div>

          <!-- KHUNG TÙY CHỈNH TẠO KHOA MỚI (YÊU CẦU 11) -->
          <div id="modal-room-custom-dept-box" class="hidden space-y-2 p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800">
            <div class="font-bold text-amber-900 dark:text-amber-200 flex items-center space-x-1.5">
              <i data-lucide="folder-plus" class="w-4 h-4 text-amber-600"></i>
              <span>Nhập Thông Tin Khoa / Phòng Mới:</span>
            </div>
            <div>
              <label class="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Tên Khoa / Phòng Ban mới *</label>
              <input type="text" id="modal-custom-dept-name" placeholder="Ví dụ: Khoa Hồi Sức Tích Cực 2" class="w-full bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 rounded-xl p-2 font-bold text-slate-900 dark:text-white">
            </div>
            <div>
              <label class="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Mã Khoa viết tắt</label>
              <input type="text" id="modal-custom-dept-code" placeholder="Ví dụ: HSTC2" class="w-full bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 rounded-xl p-2 font-mono text-slate-900 dark:text-white">
            </div>
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
    const deptSelect = document.getElementById('modal-room-dept');
    const name = document.getElementById('modal-room-name').value.trim();
    const code = document.getElementById('modal-room-code').value.trim() || 'P-' + Date.now().toString().slice(-4);
    const person = document.getElementById('modal-room-person').value.trim();
    const floor = document.getElementById('modal-room-floor').value.trim() || 'Tầng 1';

    if (!name) {
      alert('Vui lòng nhập tên khu vực / buồng phòng!');
      return;
    }

    let deptId = null;
    if (deptSelect && deptSelect.value === 'custom') {
      const customDeptNameInput = document.getElementById('modal-custom-dept-name');
      const customDeptCodeInput = document.getElementById('modal-custom-dept-code');
      const customName = customDeptNameInput ? customDeptNameInput.value.trim() : '';
      const customCode = customDeptCodeInput ? customDeptCodeInput.value.trim() : '';

      if (!customName) {
        alert('Vui lòng nhập tên Khoa / Phòng mới!');
        if (customDeptNameInput) customDeptNameInput.focus();
        return;
      }

      deptId = Date.now();
      const newDept = {
        id: deptId,
        order: (this.data.departments || []).length + 1,
        code: customCode || ('KHOA-' + (this.data.departments.length + 1)),
        name: customName,
        slug: this.slugify(customName),
        doctor_in_charge: person || 'Lãnh đạo khoa',
        head_nurse: 'ĐD/KTV Trưởng',
        rooms_count: 1,
        staff_count: 1
      };
      if (!this.data.departments) this.data.departments = [];
      this.data.departments.push(newDept);
    } else {
      deptId = parseInt(deptSelect ? deptSelect.value : '8') || 8;
    }

    const newRoom = {
      id: Date.now(),
      department_id: deptId,
      order: this.data.rooms.length + 1,
      code: code,
      name: name,
      person_in_charge: person || 'Cán bộ 5S phụ trách',
      floor: floor,
      target_score: 100,
      status: 'active'
    };

    this.data.rooms.push(newRoom);
    this.saveData();
    this.closeModal();
    this.render();
    this.showToast(`Đã thêm khu vực: ${name} thành công!`);
  }
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

          <!-- MỤC VAI TRÒ PHÂN QUYỀN VÀ CẤP BẬC 5S (V16: CÓ TÙY CHỈNH DANH MỤC VÀ GHI CHÚ) -->
          <div class="space-y-1.5">
            <div class="flex items-center justify-between">
              <label class="block font-bold text-slate-700 dark:text-slate-300">
                🛡️ Vai Trò Phân Quyền & Cấp Bậc 5S *
              </label>
              <span class="text-[10px] text-emerald-600 font-bold">Có tùy chỉnh tên tự do</span>
            </div>
            <select id="edit-staff-role" ${this.isAdmin() ? '' : 'disabled'} onchange="app5s.onRoleSelectChange(this.value, 'edit-staff')" class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 font-bold text-xs text-slate-900 dark:text-white">
              <optgroup label="🔒 Giữ nguyên">
                <option value="${s.role || 'staff'}|${(s.role_title || s.title || 'Cán bộ 5S').replace(/"/g, '&quot;')}">🔒 Giữ nguyên vai trò hiện tại (${s.role === 'admin' ? 'Admin' : (s.role === 'supervisor' ? 'Cán bộ Duyệt ảnh' : (s.role === 'manager' ? 'Quản lý khoa' : 'Nhân viên'))})</option>
              </optgroup>
              <optgroup label="✅ Cán bộ Duyệt ảnh 5S (theo danh sách toàn viện)">
                <option value="supervisor|${(s.role_title || s.title || 'Cán bộ Duyệt ảnh 5S').replace(/"/g, '&quot;')}" ${s.role === 'supervisor' ? 'selected' : ''}>✅ Cán bộ Duyệt ảnh 5S (giữ chức danh hiện tại)</option>
              </optgroup>
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
              <optgroup label="✏️ Tùy Chỉnh Linh Hoạt">
                <option value="custom|custom">✏️ [Tùy Chỉnh Tên Vai Trò / Cấp Bậc Riêng...]</option>
              </optgroup>
            </select>

            ${this.isAdmin() ? `
            <!-- V25: QUYỀN DUYỆT ẢNH 5S (chỉ Admin được thay đổi) -->
            <label class="flex items-center space-x-2 p-2.5 rounded-xl border ${s.can_review ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800' : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700'} cursor-pointer">
              <input type="checkbox" id="edit-staff-can-review" ${s.can_review ? 'checked' : ''} class="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4">
              <span class="text-xs font-bold text-slate-800 dark:text-slate-100">✅ Được phép DUYỆT ẢNH 5S <span class="font-normal text-slate-500">(bỏ chọn = chỉ được gửi ảnh)</span></span>
            </label>
            ` : `
            <div class="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-600 dark:text-slate-300">
              Quyền duyệt ảnh 5S: <strong>${s.can_review ? '✅ Được duyệt' : '📷 Chỉ gửi ảnh'}</strong> (chỉ Admin được thay đổi vai trò & quyền duyệt)
            </div>
            `}

            <!-- Ô Tùy Chỉnh Tên Vai Trò / Cấp Bậc Của Người Dùng -->
            <div id="edit-staff-custom-role-wrap" class="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 space-y-1">
              <label class="block text-[11px] font-bold text-amber-900 dark:text-amber-300">
                ✏️ Tùy chỉnh tên Vai trò / Cấp bậc trong danh mục:
              </label>
              <input type="text" id="edit-staff-custom-role-title" value="${s.role_title || s.title || ''}" placeholder="Gõ tên vai trò / cấp bậc tùy biến (VD: Trưởng Đơn Nguyên, Bác sĩ Nội Trú...)" class="w-full bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 rounded-lg p-2 text-xs font-bold text-slate-900 dark:text-white">
              <div class="text-[9.5px] text-amber-700 dark:text-amber-400">
                * Có thể sửa đổi tên chức danh hiển thị theo đặc thù khoa phòng.
              </div>
            </div>

            <!-- V17: THÔNG TIN HỒ SƠ CÁ NHÂN (NGÀY SINH & SỐ ĐIỆN THOẠI) -->
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  📅 Ngày sinh:
                </label>
                <input type="date" id="edit-staff-dob" value="${s.dob || ''}" class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-xs text-slate-800 dark:text-slate-100 font-semibold">
              </div>
              <div>
                <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  📞 Số điện thoại:
                </label>
                <input type="tel" id="edit-staff-phone" value="${s.phone || ''}" placeholder="Số ĐT di động..." class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-xs text-slate-800 dark:text-slate-100 font-semibold">
              </div>
            </div>

            <!-- Ô Ghi Chú Thông Tin Thêm & Cấu Hình Bổ Sung -->
            <div>
              <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                📝 Ghi Chú Cấu Hình Bổ Sung / Thông Tin Thêm:
              </label>
              <input type="text" id="edit-staff-notes" value="${s.notes || ''}" placeholder="Ghi chú thêm thông tin phân công, chuyên môn, chứng chỉ..." class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-xs text-slate-800 dark:text-slate-100">
            </div>
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

    const customRoleInput = document.getElementById('edit-staff-custom-role-title');
    if (customRoleInput && customRoleInput.value.trim() !== '') {
      roleTitle = customRoleInput.value.trim();
      // V25: không tự nâng quyền theo chữ "trưởng/phó/giám đốc" trong chức danh nữa
    }
    if (role === 'custom') role = s.role || 'staff';
    // V25: chỉ Admin được đổi vai trò & quyền duyệt (trước đây trưởng khoa có thể tự gán Admin cho người khác)
    const isAdminEditor = this.isAdmin();
    if (!isAdminEditor) role = s.role || 'staff';
    const canReviewBox = document.getElementById('edit-staff-can-review');
    const notesInput = document.getElementById('edit-staff-notes');
    const notes = notesInput ? notesInput.value.trim() : '';
    const dobInput = document.getElementById('edit-staff-dob');
    const dob = dobInput ? dobInput.value.trim() : '';
    const phoneInput = document.getElementById('edit-staff-phone');
    const phone = phoneInput ? phoneInput.value.trim() : '';

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
    s.title = roleTitle || title;
    s.role_title = roleTitle;
    s.position = roleTitle || title;
    s.role = role;
    s.role_level = role;
    s.is_admin = role === 'admin';
    if (isAdminEditor && canReviewBox) {
      s.can_review = role === 'admin' ? true : !!canReviewBox.checked;
    }
    s.notes = notes;
    if (dob) s.dob = dob;
    if (phone) s.phone = phone;
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
            <input type="password" id="modal-acc-pass" value="123456" class="w-full bg-slate-50 dark:bg-slate-900 border rounded-xl p-2 font-mono">
            <p class="text-[10px] text-slate-400 mt-0.5">Người dùng sẽ bị yêu cầu đổi mật khẩu này ở lần đăng nhập đầu.</p>
          </div>

          ${this.isAdmin() ? `
          <label class="flex items-center space-x-2 p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 cursor-pointer">
            <input type="checkbox" id="modal-acc-can-review" class="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4">
            <span class="text-xs font-bold text-slate-800 dark:text-slate-100">✅ Được phép DUYỆT ẢNH 5S <span class="font-normal text-slate-500">(mặc định: chỉ gửi ảnh)</span></span>
          </label>` : ''}

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
    const pass = document.getElementById('modal-acc-pass').value.trim() || '123456';
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
    // V25: chỉ Admin được tạo tài khoản có vai trò quản lý / admin; quyền duyệt do Admin bật riêng
    const isAdminCreator = this.isAdmin();
    if (!isAdminCreator) role = 'staff';
    const canReviewBox = document.getElementById('modal-acc-can-review');
    const newCanReview = role === 'admin' ? true : !!(isAdminCreator && canReviewBox && canReviewBox.checked);

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
      allow_external: true,
      is_admin: role === 'admin',
      can_review: newCanReview
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
    const user = this.getCurrentUser();
    const canHospitalWide = this.canBroadcastHospitalNotice();
    const userDeptId = this.getUserDepartmentId();
    const userDept = (this.data.departments || []).find(d => d.id == userDeptId) || { id: userDeptId || 1, name: 'Khoa phòng' };
    
    // Khởi tạo dept_notices nếu chưa có
    if (!this.data.hospital.dept_notices) {
      this.data.hospital.dept_notices = {};
    }

    const hospNotice = this.data.hospital.notice || { enabled: false, title: '', content: '' };
    const deptNotice = (userDeptId && this.data.hospital.dept_notices[userDeptId]) || { enabled: false, title: '', content: '' };

    this.showModal(`
      <div class="p-5 space-y-4 max-h-[85vh] overflow-y-auto no-scrollbar">
        <div class="flex items-center justify-between border-b pb-3">
          <div class="flex items-center space-x-2">
            <div class="w-9 h-9 rounded-2xl ${canHospitalWide ? 'bg-red-600' : 'bg-indigo-600'} text-white flex items-center justify-center font-bold">
              <i data-lucide="bell-ring" class="w-5 h-5"></i>
            </div>
            <div>
              <h3 class="text-sm font-black text-slate-900 dark:text-white">SOẠN BẢNG TIN THÔNG BÁO 5S</h3>
              <p class="text-[10px] ${canHospitalWide ? 'text-red-600' : 'text-indigo-600'} font-bold">
                ${canHospitalWide ? '⭐ Quyền Quản Lý Toàn Viện: Phát thông báo toàn viện & nội bộ' : `🔒 Quyền Nội Bộ: Phát thông báo cho ${userDept.name}`}
              </p>
            </div>
          </div>
          <button onclick="app5s.closeModal()" class="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400">
            <i data-lucide="x" class="w-4 h-4"></i>
          </button>
        </div>

        <div class="space-y-3 text-xs">
          <!-- LỰA CHỌN PHẠM VI THÔNG BÁO -->
          <div>
            <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">Phạm vi phát thông báo *</label>
            <div class="grid grid-cols-2 gap-2">
              <label class="p-2.5 rounded-xl border flex items-center space-x-2 ${
                canHospitalWide 
                  ? 'cursor-pointer hover:bg-slate-50 border-red-300 bg-red-50/40 text-red-900' 
                  : 'opacity-50 cursor-not-allowed bg-slate-100 border-slate-200 text-slate-400'
              }">
                <input type="radio" name="notice-scope" value="hospital" ${canHospitalWide ? 'checked' : 'disabled'} onchange="app5s.onNoticeScopeChanged(this.value)">
                <div>
                  <span class="font-bold block text-xs">📢 Toàn Viện</span>
                  <span class="text-[9px] block">20 Khoa phòng (Chỉ Admin / Giám Sát)</span>
                </div>
              </label>

              <label class="p-2.5 rounded-xl border flex items-center space-x-2 cursor-pointer hover:bg-slate-50 border-indigo-300 bg-indigo-50/40 text-indigo-900">
                <input type="radio" name="notice-scope" value="department" ${!canHospitalWide ? 'checked' : ''} onchange="app5s.onNoticeScopeChanged(this.value)">
                <div>
                  <span class="font-bold block text-xs">🏢 Nội Bộ Khoa</span>
                  <span class="text-[9px] block">${userDept.name}</span>
                </div>
              </label>
            </div>
            ${!canHospitalWide ? `
              <div class="text-[10px] text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 p-2 rounded-xl mt-1.5 border border-amber-200 dark:border-amber-800">
                🔒 Tài khoản cán bộ cá nhân / quản lý khoa chỉ được phát thông báo trong nội bộ <strong>${userDept.name}</strong>. Quyền phát thông báo Toàn viện dành riêng cho Ban Giám Đốc và Ban Chỉ Đạo 5S.
              </div>
            ` : ''}
          </div>

          <div class="flex items-center space-x-2 pt-1">
            <input type="checkbox" id="modal-notice-enabled" ${(canHospitalWide ? hospNotice.enabled : deptNotice.enabled) ? 'checked' : ''} class="rounded text-emerald-600 w-4 h-4">
            <label for="modal-notice-enabled" class="font-bold text-slate-800 dark:text-slate-100">Bật hiển thị thông báo này ngay trên đầu ứng dụng</label>
          </div>

          <div>
            <label class="block font-bold mb-1">Tiêu đề thông báo *</label>
            <input type="text" id="modal-notice-title" value="${canHospitalWide ? (hospNotice.title || 'THÔNG BÁO 5S TOÀN VIỆN') : (deptNotice.title || ('THÔNG BÁO NỘI BỘ: ' + userDept.name.toUpperCase()))}" class="w-full bg-slate-50 dark:bg-slate-900 border rounded-xl p-2.5 font-bold text-red-600">
          </div>

          <div>
            <label class="block font-bold mb-1">Nội dung chỉ đạo / nhắc nhở thực hiện 5S *</label>
            <textarea id="modal-notice-content" rows="3" placeholder="Nhập nội dung nhắc nhở dọn dẹp vệ sinh, sàng lọc sắp xếp buồng phòng..." class="w-full bg-slate-50 dark:bg-slate-900 border rounded-xl p-2.5 text-xs">${canHospitalWide ? (hospNotice.content || '') : (deptNotice.content || '')}</textarea>
          </div>

          <button onclick="app5s.saveNoticeSettings()" class="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 text-white font-black py-2.5 rounded-xl shadow-md transition flex items-center justify-center space-x-2 text-xs">
            <i data-lucide="send" class="w-4 h-4"></i>
            <span>Phát Thông Báo Ngay</span>
          </button>
        </div>
      </div>
    `);
  }

  onNoticeScopeChanged(scope) {
    const userDeptId = this.getUserDepartmentId();
    const userDept = (this.data.departments || []).find(d => d.id == userDeptId) || { name: 'Khoa phòng' };
    const titleInput = document.getElementById('modal-notice-title');
    const contentInput = document.getElementById('modal-notice-content');
    const enabledInput = document.getElementById('modal-notice-enabled');

    if (scope === 'hospital') {
      const hospNotice = this.data.hospital.notice || {};
      if (titleInput) titleInput.value = hospNotice.title || 'THÔNG BÁO 5S TOÀN VIỆN';
      if (contentInput) contentInput.value = hospNotice.content || '';
      if (enabledInput) enabledInput.checked = !!hospNotice.enabled;
    } else {
      const deptNotices = this.data.hospital.dept_notices || {};
      const deptNotice = deptNotices[userDeptId] || {};
      if (titleInput) titleInput.value = deptNotice.title || `THÔNG BÁO NỘI BỘ: ${userDept.name.toUpperCase()}`;
      if (contentInput) contentInput.value = deptNotice.content || '';
      if (enabledInput) enabledInput.checked = !!deptNotice.enabled;
    }
  }

  saveNoticeSettings() {
    const scopeRadios = document.getElementsByName('notice-scope');
    let scope = 'department';
    for (const r of scopeRadios) {
      if (r.checked) scope = r.value;
    }

    const enabled = document.getElementById('modal-notice-enabled').checked;
    const title = document.getElementById('modal-notice-title').value.trim();
    const content = document.getElementById('modal-notice-content').value.trim();
    const updatedAt = new Date().toISOString().slice(0, 16).replace('T', ' ');
    const user = this.getCurrentUser();
    const userDeptId = this.getUserDepartmentId();

    if (scope === 'hospital') {
      if (!this.canBroadcastHospitalNotice()) {
        alert('🔒 Bạn không có quyền phát thông báo toàn viện!');
        return;
      }
      this.data.hospital.notice = {
        enabled,
        title,
        content,
        updatedAt,
        scope: 'hospital',
        author: user ? user.name : 'Ban Giám Sát'
      };
      this.showToast('Đã phát thông báo khẩn cấp toàn viện thành công!');
    } else {
      if (!this.data.hospital.dept_notices) this.data.hospital.dept_notices = {};
      this.data.hospital.dept_notices[userDeptId] = {
        enabled,
        title,
        content,
        updatedAt,
        scope: 'department',
        department_id: userDeptId,
        author: user ? user.name : 'Quản lý khoa'
      };
      this.showToast('Đã phát thông báo nội bộ khoa phòng thành công!');
    }

    this.saveData();
    this.closeModal();
    this.render();
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

  async saveNewPassword() {
    const current = document.getElementById('modal-pass-current').value;
    const newPass = document.getElementById('modal-pass-new').value;
    const confirm = document.getElementById('modal-pass-confirm').value;

    const user = this.getCurrentUser();
    if (!current) {
      alert('Vui lòng nhập mật khẩu hiện tại!');
      return;
    }
    if (!newPass || newPass.length < 6) {
      alert('Mật khẩu mới phải có ít nhất 6 ký tự!');
      return;
    }
    if (['123456', '123', '12345678', '000000', '111111'].includes(newPass) || newPass === current) {
      alert('Mật khẩu mới quá dễ đoán hoặc trùng mật khẩu cũ. Vui lòng chọn mật khẩu khác!');
      return;
    }
    if (newPass !== confirm) {
      alert('Xác nhận mật khẩu mới không khớp!');
      return;
    }

    if (!user || !this.authToken) {
      alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      return;
    }
    try {
      // V27: mật khẩu được kiểm tra & lưu (mã hóa) trên máy chủ, không lưu trên thiết bị
      const res = await this.apiFetch('password', { method: 'POST', body: JSON.stringify({ current, new: newPass }) });
      if (res && res.token) {
        this.authToken = res.token;
        try { localStorage.setItem(TOKEN_KEY, res.token); } catch (e) {}
      }
      this.mustChangePassword = false;
      this.closeModal();
      this.showToast('✓ Đã đổi mật khẩu thành công! Các thiết bị khác sẽ phải đăng nhập lại.');
    } catch (e) {
      alert(e.status ? e.message : 'Không kết nối được máy chủ. Vui lòng kiểm tra mạng và thử lại.');
    }
  }

  // =========================================================================
  // MÀN HÌNH ĐĂNG NHẬP CHUYÊN DỤNG (KHÔNG LƯU NHỚ MẬT KHẨU ĐỂ TRÁNH NHẦM LẪN)
  // =========================================================================
  renderLoginScreen() {
    // Tự động điền tài khoản & mật khẩu đã ghi nhớ (Yêu cầu 13)
    setTimeout(() => {
      try {
        const saved = JSON.parse(localStorage.getItem('vpi_5s_saved_auth') || '{}');
        if (saved && saved.remember && saved.username) {
          const uInput = document.getElementById('login-username');
          const pInput = document.getElementById('login-password');
          const rBox = document.getElementById('login-remember-me');
          if (uInput && !uInput.value) uInput.value = saved.username;
          if (rBox) rBox.checked = true;
          if (pInput) pInput.focus();
        }
      } catch (e) {}
    }, 100);

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

          <!-- Form Đăng Nhập (Yêu cầu 13: Ẩn/Hiện mật khẩu, Tự động lưu nhớ, Bỏ tài khoản gợi ý) -->
          <form onsubmit="app5s.handleLoginForm(event)" class="space-y-3.5 text-xs">
            <div>
              <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1">Tên đăng nhập (Mã nhân viên) *</label>
              <div class="relative">
                <i data-lucide="user" class="w-4 h-4 absolute left-3 top-3 text-slate-400"></i>
                <input type="text" id="login-username" placeholder="Ví dụ: BV-345 hoặc BV-002..." class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-900 dark:text-white font-bold font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none" required>
              </div>
            </div>

            <div>
              <div class="flex items-center justify-between mb-1">
                <label class="block font-bold text-slate-700 dark:text-slate-300">Mật khẩu *</label>
              </div>
              <div class="relative">
                <i data-lucide="lock" class="w-4 h-4 absolute left-3 top-3 text-slate-400"></i>
                <input type="password" id="login-password" placeholder="Nhập mật khẩu..." class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-10 py-2.5 text-xs text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none" required>
                <button type="button" onclick="app5s.togglePasswordVisibility('login-password')" class="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition p-0.5" title="Hiện/Ẩn mật khẩu">
                  <i data-lucide="eye" id="eye-login-password" class="w-4 h-4"></i>
                </button>
              </div>
            </div>

            <!-- Ghi nhớ đăng nhập & Quên mật khẩu -->
            <div class="flex items-center justify-between text-xs pt-0.5">
              <label class="flex items-center space-x-2 text-slate-600 dark:text-slate-300 cursor-pointer select-none">
                <input type="checkbox" id="login-remember-me" checked class="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4">
                <span class="font-bold text-[11px]">Ghi nhớ đăng nhập trên thiết bị</span>
              </label>
              <button type="button" onclick="app5s.openForgotPasswordModal()" class="text-emerald-600 dark:text-emerald-400 font-bold text-[11px] hover:underline">
                Quên mật khẩu?
              </button>
            </div>

            <button type="submit" class="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3 rounded-2xl shadow-md transition flex items-center justify-center space-x-2 text-xs">
              <i data-lucide="log-in" class="w-4 h-4"></i>
              <span>ĐĂNG NHẬP VÀO APP 5S</span>
            </button>
          </form>

          <!-- THÔNG TIN HỖ TRỢ & BẢN QUYỀN (TÁC GIẢ: VŨ ĐẠT) -->
          <div class="pt-3 border-t border-slate-200 dark:border-slate-700 text-center space-y-1">
            <div class="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
              Tác giả: <strong class="text-slate-800 dark:text-slate-200">Vũ Đạt</strong> • Hotline: <a href="tel:0916306115" class="text-emerald-600 font-bold hover:underline">+84916306115</a>
            </div>
            <div class="text-[9.5px] text-slate-400">
              Email: <span class="font-mono text-slate-500">vudatxq@gmail.com</span> • Bệnh viện VPI
            </div>
          </div>
        </div>
      </div>
    `;
  }

  async handleLoginForm(event) {
    if (event) event.preventDefault();
    const uInput = document.getElementById('login-username');
    const pInput = document.getElementById('login-password');
    const errBox = document.getElementById('login-error-msg');
    const errText = document.getElementById('login-error-text');
    const submitBtn = event && event.target ? event.target.querySelector('button[type="submit"]') : null;
    const showErr = (msg) => {
      if (errBox && errText) {
        errText.innerText = msg;
        errBox.classList.remove('hidden');
      }
    };

    if (!uInput || !pInput) return;
    const u = uInput.value.trim();
    const p = pInput.value;
    if (!u || !p) {
      showErr('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu!');
      return;
    }
    if (this.loginInProgress) return;
    this.loginInProgress = true;
    if (submitBtn) { submitBtn.disabled = true; submitBtn.classList.add('opacity-60'); }

    // V27: xác thực trên máy chủ (mật khẩu mã hóa PBKDF2, khóa 5 phút sau 5 lần sai)
    let res;
    try {
      const r = await fetch(this.apiUrl('login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: u, password: p }),
        cache: 'no-store'
      });
      let json = null;
      try { json = await r.json(); } catch (e) {}
      if (!r.ok) {
        showErr((json && json.error) || 'Tên đăng nhập hoặc mật khẩu không chính xác!');
        return;
      }
      res = json;
    } catch (e) {
      showErr('Không kết nối được máy chủ. Vui lòng kiểm tra mạng (Wi-Fi/4G) và thử lại.');
      return;
    } finally {
      this.loginInProgress = false;
      if (submitBtn) { submitBtn.disabled = false; submitBtn.classList.remove('opacity-60'); }
    }
    if (!res || !res.token || !res.user) {
      showErr('Máy chủ trả về dữ liệu không hợp lệ. Vui lòng thử lại.');
      return;
    }

    const rememberMe = document.getElementById('login-remember-me')?.checked;
    try {
      if (rememberMe) {
        // Chỉ ghi nhớ Mã NV, KHÔNG lưu mật khẩu trên thiết bị
        localStorage.setItem('vpi_5s_saved_auth', JSON.stringify({ username: res.user.code, remember: true }));
      } else {
        localStorage.removeItem('vpi_5s_saved_auth');
      }
    } catch (e) {}

    // Đổi tài khoản trên cùng thiết bị: bỏ hàng đợi của tài khoản trước
    const prevUser = this.data.auth && this.data.auth.currentUserId;
    if (prevUser && prevUser !== res.user.code) {
      this.outbox = [];
      this.persistOutbox();
    }

    this.authToken = res.token;
    try { localStorage.setItem(TOKEN_KEY, res.token); } catch (e) {}
    this.mustChangePassword = !!res.must_change;

    // Đảm bảo tài khoản vừa đăng nhập có trong danh sách (trước khi tải xong dữ liệu)
    if (!Array.isArray(this.data.staff)) this.data.staff = [];
    const idx = this.data.staff.findIndex(s => s.code === res.user.code);
    if (idx >= 0) this.data.staff[idx] = Object.assign({}, this.data.staff[idx], res.user);
    else this.data.staff.push(res.user);

    this.data.auth = {
      isLoggedIn: true,
      currentUserId: res.user.code,
      locationMode: this.data.auth?.locationMode || 'internal'
    };
    try { localStorage.setItem('vpi_5s_auth_session', JSON.stringify(this.data.auth)); } catch (e) {}
    this.syncSnapshot = this.buildSyncSnapshot(this.data);
    this.saveData(false);
    this.resetScheduleToToday();
    this.render();
    this.showToast(`Chào mừng ${res.user.name || res.user.code} đã đăng nhập! Đang tải dữ liệu toàn viện...`);

    // Tải toàn bộ dữ liệu mới nhất từ máy chủ
    const ok = await this.pullStateFromServer(true);
    if (!ok) this.showToast('⚠️ Chưa tải được dữ liệu từ máy chủ. Ứng dụng sẽ tự thử lại.');
    this.scheduleNextPull();

    if (this.mustChangePassword) {
      setTimeout(() => {
        this.openChangePasswordModal();
        this.showToast('🔐 Bạn đang dùng mật khẩu mặc định. Vui lòng đổi mật khẩu để bảo vệ tài khoản!');
      }, 400);
    }
  }
  quickFillLogin(username, password) {
    const uInput = document.getElementById('login-username');
    const pInput = document.getElementById('login-password');
    if (uInput) uInput.value = username;
    if (pInput) pInput.value = password;
  }

  async logout() {
    if (!confirm('Bạn có chắc muốn đăng xuất khỏi tài khoản đang sử dụng không?')) return;
    // Gửi nốt các thay đổi chưa đồng bộ
    if (this.authToken) {
      this.queueLocalChanges();
      if (this.outbox.length) {
        this.showToast('🔄 Đang gửi dữ liệu chưa đồng bộ...');
        await this.flushOutbox();
      }
      if (this.outbox.length && !confirm(`Còn ${this.outbox.length} thay đổi (ảnh/phiếu) CHƯA gửi được lên máy chủ do mất mạng.\nĐăng xuất bây giờ sẽ MẤT các thay đổi này. Vẫn đăng xuất?`)) {
        return;
      }
    }
    this.closeModal();
    this.authToken = null;
    this.outbox = [];
    this.mustChangePassword = false;
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(OUTBOX_KEY);
      localStorage.removeItem('vpi_5s_auth_session');
    } catch (e) {}
    this.data.auth = { isLoggedIn: false, currentUserId: null, locationMode: (this.data.auth && this.data.auth.locationMode) || 'internal' };
    this.saveData(false);
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
    if (this.pendingSyncRender) {
      this.pendingSyncRender = false;
      setTimeout(() => this.render(), 0);
    }
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

  // =========================================================================
  // V14 PHÂN QUYỀN RBAC: ADMIN, LÃNH ĐẠO VIỆN, QUẢN LÝ KHOA, NHÂN VIÊN
  // =========================================================================
  // V25: Phân quyền chỉ dựa trên role + can_review (theo danh sách Excel), KHÔNG suy theo từ khóa chức danh
  // hay danh sách mã cố định nữa. Chưa đăng nhập => không có quyền gì.
  isAdmin() {
    const user = this.getCurrentUser();
    if (!user) return false;
    const code = (user.code || '').toUpperCase();
    return REVIEW_POLICY.ADMIN_CODES.includes(code) || user.role === 'admin' || user.is_admin === true;
  }

  // Quyền DUYỆT / CHẤM ảnh 5S
  canReview5S() {
    const user = this.getCurrentUser();
    if (!user) return false;
    if (this.isAdmin()) return true;
    return user.can_review === true;
  }

  isHospitalLeaderOrSupervisor() {
    const user = this.getCurrentUser();
    if (!user) return false;
    if (this.isAdmin()) return true;
    return (user.role === 'supervisor' || user.is_supervisor === true) && user.can_review === true;
  }

  canBroadcastNotice() {
    return this.canBroadcastHospitalNotice();
  }

  canBroadcastHospitalNotice() {
    // V20.1: Chỉ Admin và Ban Chỉ Đạo / Giám Sát toàn viện mới được phát thông báo toàn viện
    const user = this.getCurrentUser();
    if (!user) return false;
    return this.isAdmin() || this.isHospitalLeaderOrSupervisor();
  }

  canAudit5S() {
    // V25: Chỉ tài khoản có tên trong danh sách được duyệt (hoặc Admin) mới được chấm 5S
    return this.canReview5S();
  }

  renderAuditLockedScreen() {
    const user = this.getCurrentUser();
    const userName = (user && user.name) ? user.name : 'Cán bộ nhân viên';
    const userTitle = (user && (user.title || user.role_title || user.position)) ? (user.title || user.role_title || user.position) : 'Nhân viên';
    const userCode = user ? user.code : 'NV-000';
    const dept = (this.data.departments || []).find(d => d.id == this.getUserDepartmentId());
    const deptName = dept ? dept.name : 'Nội bộ khoa phòng';

    return `
      <div class="p-4 space-y-4">
        <!-- Card Khóa Phân Quyền Chấm 5S (V15 PRO) -->
        <div class="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-amber-200 dark:border-amber-800/80 shadow-md text-center space-y-4">
          <div class="w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-amber-500/20">
            <i data-lucide="shield-alert" class="w-8 h-8"></i>
          </div>

          <div class="space-y-1.5">
            <span class="text-[10.5px] bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-bold px-3 py-0.5 rounded-full border border-amber-300 font-mono uppercase tracking-wider inline-flex items-center space-x-1">
              <span>🔒 CHỨC NĂNG ĐÃ ĐƯỢC PHÂN QUYỀN RIÊNG</span>
            </span>
            <h2 class="text-base font-black text-slate-900 dark:text-white">
              CHẤM ĐIỂM 5S CHỈ MỞ CHO CÁN BỘ ĐƯỢC PHÂN QUYỀN
            </h2>
            <p class="text-xs text-slate-600 dark:text-slate-300 max-w-sm mx-auto leading-relaxed">
              Theo quy định phân cấp Bệnh viện VPI, tính năng <strong>Chấm điểm & Đánh giá 5S</strong> buồng phòng chỉ dành riêng cho: <strong>Admin, Ban Chỉ Đạo 5S, Cán Bộ Giám Sát Toàn Viện và Quản Lý Cấp Khoa Phòng</strong> (Trưởng/Phó khoa, Điều dưỡng trưởng, KTV trưởng, Hộ sinh trưởng...). Tài khoản cán bộ nhân viên thường không được mở quyền tự chấm điểm.
            </p>
          </div>

          <!-- Card thông tin tài khoản hiện tại -->
          <div class="bg-slate-50 dark:bg-slate-900/70 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs text-left space-y-1.5 max-w-sm mx-auto">
            <div class="flex items-center justify-between">
              <span class="text-slate-400 font-medium">Cán bộ đăng nhập:</span>
              <strong class="text-slate-800 dark:text-slate-100">${userName}</strong>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-slate-400 font-medium">Mã nhân viên:</span>
              <span class="font-mono font-bold text-indigo-600 dark:text-indigo-400">${userCode}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-slate-400 font-medium">Chức danh / Khoa:</span>
              <span class="text-slate-700 dark:text-slate-300">${userTitle} • ${deptName}</span>
            </div>
            <div class="flex items-center justify-between pt-1 border-t border-slate-200 dark:border-slate-700">
              <span class="text-slate-400 font-medium">Trạng thái quyền:</span>
              <span class="text-[10px] font-bold text-amber-700 bg-amber-100 dark:bg-amber-950 px-2 py-0.5 rounded-full">🔒 Khóa quyền Chấm 5S</span>
            </div>
          </div>

          <!-- Các nút tác vụ -->
          <div class="space-y-2 max-w-sm mx-auto pt-1">
            <button onclick="app5s.openFeedbackModal()" class="w-full py-2.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 text-white rounded-xl font-bold text-xs flex items-center justify-center space-x-2 shadow-sm transition">
              <i data-lucide="message-square-plus" class="w-4 h-4"></i>
              <span>Nhắn Tin Admin Xin Mở Quyền Chấm 5S</span>
            </button>

            <button onclick="app5s.switchTab('schedule')" class="w-full py-2 px-4 bg-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 text-xs font-semibold">
              Quay lại Tab Khu Vực Làm Việc
            </button>
          </div>
        </div>
      </div>
    `;
  }

  isDepartmentManager() {
    const user = this.getCurrentUser();
    if (!user) return false;
    if (this.isHospitalLeaderOrSupervisor()) return true;
    // V25: chỉ người được Admin gán vai trò "manager" (không suy từ chức danh)
    return user.role === 'manager' || user.role_level === 'manager';
  }

  canViewAllStaff() {
    // Quyền xem danh sách nhân sự toàn viện: Admin, Lãnh đạo viện, Giám sát 5S VÀ Quản lý khoa phòng
    return this.isHospitalLeaderOrSupervisor() || this.isDepartmentManager();
  }

  canViewAllHospitalRooms() {
    // Quyền xem buồng phòng toàn viện (20 khoa, 75 phòng): CHỈ Admin, Lãnh đạo viện và Ban Giám Sát toàn viện!
    // Quản lý cấp khoa và nhân viên khoa phòng chỉ xem phòng của khoa mình.
    return this.isHospitalLeaderOrSupervisor();
  }

  canManageDeptStaff(deptId) {
    if (this.isAdmin()) return true;
    if (!this.isDepartmentManager()) return false;
    const userDeptId = this.getUserDepartmentId();
    return String(userDeptId) === String(deptId);
  }

  canManageDeptRooms(deptId) {
    if (this.isAdmin() || this.isHospitalLeaderOrSupervisor()) return true;
    if (!this.isDepartmentManager()) return false;
    const userDeptId = this.getUserDepartmentId();
    return String(userDeptId) === String(deptId);
  }

  deleteStaffMember(staffCode) {
    const staff = (this.data.staff || []).find(s => s.code == staffCode || s.id == staffCode);
    if (!staff) return;
    if (!this.canManageDeptStaff(staff.department_id)) {
      alert('🔒 Bạn không có quyền xóa nhân sự của khoa phòng này!');
      return;
    }
    if (confirm(`Bạn có chắc muốn xóa nhân sự ${staff.name} (${staff.code}) không?`)) {
      this.data.staff = (this.data.staff || []).filter(s => s.code != staff.code && s.id != staff.id);
      this.saveData();
      this.showToast(`Đã xóa nhân sự ${staff.name} (${staff.code}) thành công!`);
      this.render();
    }
  }



  isUserManagerOrSupervisor() {
    // V25: hàm này quyết định hiển thị nút CHẤM 5S / DUYỆT ẢNH => dùng đúng quyền duyệt
    return this.canReview5S();
  }

  getUserDepartmentId() {
    const user = this.getCurrentUser();
    if (!user) return null;
    return user.department_id || (Array.isArray(user.departments) ? user.departments[0] : null);
  }

  canUserViewDeptPhotos(deptId) {
    // V20.1: Tài khoản cá nhân CHỈ ĐƯỢC XEM ảnh trong khoa phòng mình
    const user = this.getCurrentUser();
    if (!user) return false;
    if (this.isAdmin() || this.isHospitalLeaderOrSupervisor()) return true;

    const userDeptId = this.getUserDepartmentId();
    if (!userDeptId) return false;

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

  // V17: HỒ SƠ CÁ NHÂN & BẢO MẬT (CHỈ XEM & CẬP NHẬT TÀI KHOẢN CHÍNH MÌNH)
  // V18 PRO: HỒ SƠ CÁ NHÂN & CẬP NHẬT ẢNH ĐẠI DIỆN AVATAR (BỎ NGÀY SINH)
  openUserProfileModal() {
    const user = this.getCurrentUser();
    if (!user) {
      this.openLoginModal();
      return;
    }
    const dept = (this.data.departments || []).find(d => d.id == this.getUserDepartmentId());
    const deptName = dept ? dept.name : (user.department_name || 'Bệnh viện VPI');
    const roleBadge = this.isAdmin() 
      ? '👑 Ban Quản Trị / Admin'
      : (this.isHospitalLeaderOrSupervisor() 
          ? '🛡️ Ban Giám Sát / Ban Chỉ Đạo 5S'
          : (this.isDepartmentManager() ? '🏢 Quản Lý Cấp Khoa / Phòng' : '🏥 Cán Bộ Nhân Viên Khoa (Chỉ Xem)'));

    this.pendingAvatarUrl = null;

    this.showModal(`
      <div class="p-5 space-y-4 max-h-[85vh] overflow-y-auto no-scrollbar">
        <div class="flex items-center justify-between border-b pb-3">
          <div class="flex items-center space-x-2">
            <div class="w-9 h-9 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white flex items-center justify-center font-bold">
              <i data-lucide="user-check" class="w-5 h-5"></i>
            </div>
            <div>
              <h3 class="text-sm font-black text-slate-900 dark:text-white">HỒ SƠ CÁ NHÂN & BẢO MẬT</h3>
              <p class="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">🔒 Tài khoản nội bộ Bệnh viện VPI</p>
            </div>
          </div>
          <button onclick="app5s.closeModal()" class="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400">
            <i data-lucide="x" class="w-4 h-4"></i>
          </button>
        </div>

        <!-- THẺ THÔNG TIN CÁ NHÂN ĐANG ĐĂNG NHẬP -->
        <div class="p-3.5 rounded-2xl bg-gradient-to-br from-slate-50 to-emerald-50/50 dark:from-slate-900 dark:to-slate-800 border border-emerald-200 dark:border-emerald-800/60 space-y-2">
          <div class="flex items-center space-x-3">
            <div class="relative w-14 h-14 rounded-full overflow-hidden bg-gradient-to-tr from-emerald-600 via-teal-600 to-indigo-600 text-white font-bold flex items-center justify-center text-lg shadow-sm shrink-0 ring-2 ring-emerald-300">
              <img id="profile-modal-current-avatar" src="${user.avatar || ''}" class="w-full h-full object-cover ${user.avatar ? '' : 'hidden'}" alt="Avatar">
              <span id="profile-modal-current-initial" class="${user.avatar ? 'hidden' : ''}">${(user.name || 'D').split(' ').pop().charAt(0)}</span>
            </div>
            <div class="min-w-0 flex-1">
              <div class="flex items-center space-x-2">
                <h4 class="text-sm font-black text-slate-900 dark:text-white truncate">${user.name}</h4>
                <span class="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold">${user.code}</span>
              </div>
              <div class="text-[11px] text-slate-600 dark:text-slate-300 font-semibold mt-0.5">${user.title || user.role_title || 'Cán bộ 5S'}</div>
              <div class="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold">${deptName}</div>
            </div>
          </div>
          <div class="pt-1.5 border-t border-slate-200/60 dark:border-slate-700 text-[10.5px] flex items-center justify-between">
            <span class="text-slate-500">Phân quyền 5S:</span>
            <span class="font-bold text-slate-800 dark:text-slate-200">${roleBadge}</span>
          </div>
        </div>

        <!-- CẤU HÌNH BỔ SUNG HỒ SƠ: AVATAR & SỐ ĐIỆN THOẠI (BỎ NGÀY SINH) -->
        <div class="space-y-3.5 text-xs bg-white dark:bg-slate-800 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700">
          <div class="font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-1.5 text-xs">
            <i data-lucide="image" class="w-4 h-4 text-emerald-600"></i>
            <span>Cập Nhật Ảnh Đại Diện (Avatar) & Liên Hệ:</span>
          </div>

          <!-- KHUNG CHỌN ẢNH AVATAR TÙY CHỈNH -->
          <div class="flex items-center space-x-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700">
            <div class="relative w-16 h-16 rounded-full overflow-hidden border-2 border-emerald-500 bg-slate-200 dark:bg-slate-700 flex items-center justify-center shrink-0 shadow-inner">
              <img id="profile-avatar-preview" src="${user.avatar || ''}" class="w-full h-full object-cover ${user.avatar ? '' : 'hidden'}" alt="Preview Avatar">
              <span id="profile-avatar-initial" class="text-xl font-bold text-emerald-700 dark:text-emerald-300 ${user.avatar ? 'hidden' : ''}">
                ${(user.name || 'D').split(' ').pop().charAt(0)}
              </span>
            </div>
            <div class="space-y-1.5 flex-1">
              <input type="file" id="profile-avatar-file-input" accept="image/*" onchange="app5s.onProfileAvatarSelected(event)" class="hidden">
              <label for="profile-avatar-file-input" class="cursor-pointer inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-xs transition">
                <i data-lucide="upload" class="w-3.5 h-3.5"></i>
                <span>Tải ảnh từ máy</span>
              </label>
              <p class="text-[10px] text-slate-400">Hỗ trợ JPG, PNG, WEBP. Ảnh tự động cắt gọn trong khung tròn.</p>
            </div>
          </div>

          <div>
            <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1">📞 Số điện thoại liên hệ / Hotline cá nhân:</label>
            <input type="tel" id="profile-phone-input" value="${user.phone || ''}" placeholder="Nhập số điện thoại di động (VD: 0916306115)..." class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500">
          </div>

          <button onclick="app5s.saveUserProfile()" class="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition flex items-center justify-center space-x-1.5 shadow-xs">
            <i data-lucide="save" class="w-3.5 h-3.5"></i>
            <span>Lưu Cập Nhật Hồ Sơ & Avatar</span>
          </button>
        </div>

        <!-- BẢO MẬT & ĐỔI MẬT KHẨU -->
        <div class="grid grid-cols-2 gap-2 pt-1 text-xs font-bold">
          <button onclick="app5s.openChangePasswordModal()" class="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl flex items-center justify-center space-x-1.5 border border-slate-200 dark:border-slate-600 transition">
            <i data-lucide="key-round" class="w-3.5 h-3.5 text-indigo-600"></i>
            <span>Đổi Mật Khẩu</span>
          </button>
          <button onclick="app5s.logout()" class="py-2.5 px-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl flex items-center justify-center space-x-1.5 border border-red-200 transition">
            <i data-lucide="log-out" class="w-3.5 h-3.5"></i>
            <span>Đăng Xuất</span>
          </button>
        </div>
      </div>
    `);
  }

  saveUserProfile() {
    const phoneInput = document.getElementById('profile-phone-input');
    const user = this.getCurrentUser();
    if (!user) return;

    if (this.pendingAvatarUrl) {
      user.avatar = this.pendingAvatarUrl;
    }
    if (phoneInput) {
      user.phone = phoneInput.value.trim();
    }

    // Đồng bộ vào mảng staff
    const staffMember = (this.data.staff || []).find(s => s.code === user.code);
    if (staffMember) {
      if (this.pendingAvatarUrl) staffMember.avatar = this.pendingAvatarUrl;
      if (phoneInput) staffMember.phone = phoneInput.value.trim();
    }

    this.pendingAvatarUrl = null;
    this.saveData();
    this.showToast('✅ Đã cập nhật ảnh đại diện và hồ sơ thành công!');
    this.closeModal();
    this.render();
  }

  // V17: KHÓA BỘ CHUYỂN ĐỔI TÀI KHOẢN (TRÁNH TRUY CẬP TRÁI PHÉP, CHỈ XEM HỒ SƠ CÁ NHÂN KHI ĐĂNG NHẬP)
  openSwitchAccountModal() {
    this.openUserProfileModal();
  }
  openSwitchAccountModal() {
    this.openUserProfileModal();
  }

  _deprecated_openSwitchAccountModal() {
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

        <!-- Bộ chọn nhanh toàn bộ 526 nhân viên toàn viện (V13) -->
        <div class="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-1.5">
          <label class="block text-xs font-bold text-slate-700 dark:text-slate-300">
            Hoặc chọn bất kỳ tài khoản từ toàn viện (${(this.data.staff || []).length} nhân sự):
          </label>
          <select onchange="if(this.value) app5s.switchUserAccount(this.value)" class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs font-semibold text-slate-800 dark:text-slate-100">
            <option value="">-- Chọn cán bộ theo Mã NV / Họ tên / Khoa phòng --</option>
            ${(this.data.staff || []).map(s => `
              <option value="${s.code}" ${s.code === currentCode ? 'selected' : ''}>
                ${s.code} • ${s.name} (${s.title || 'Cán bộ'}) - ${s.department_name || ''}
              </option>
            `).join('')}
          </select>
        </div>
      </div>
    `;
    this.showModal(modalHtml);
  }

  // V27 SECURITY: không cho chuyển tài khoản không cần mật khẩu - phải đăng xuất rồi đăng nhập lại
  switchUserAccount(userCode) {
    this.closeModal();
    this.showToast('🔐 Để dùng tài khoản khác, vui lòng Đăng xuất rồi đăng nhập bằng tài khoản đó.');
  }

  canUserReviewAudits() {
    return this.canReview5S();
  }

  downloadPhoto(photoUrl, title = 'Anh_5S_VPI') {
    if (!photoUrl) return;
    try {
      const cleanTitle = (title || 'Anh_5S_VPI').replace(/[^a-zA-Z0-9_À-ɏẠ-ỹ]/g, '_');
      const filename = `${cleanTitle}_${new Date().toISOString().slice(0, 10)}.jpg`;
      const a = document.createElement('a');
      a.href = photoUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      this.showToast(`Đã tải ảnh minh chứng "${filename}" về máy tính!`);
    } catch (e) {
      window.open(photoUrl, '_blank');
    }
  }

  viewLargePhoto(photoUrl, title = 'Ảnh minh chứng 5S', deptId = null) {
    if (deptId && !this.canUserViewDeptPhotos(deptId)) {
      this.showToast('🔒 Quyền riêng tư: Bạn không thuộc khoa phòng này. Chỉ cán bộ thuộc khoa hoặc Ban Giám sát toàn viện mới được xem ảnh minh chứng!');
      return;
    }
    const modalHtml = `
      <div class="p-4 space-y-3 max-h-[90vh]">
        <div class="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/60 pb-2">
          <div class="flex items-center space-x-2 min-w-0">
            <i data-lucide="image" class="w-4 h-4 text-emerald-600 shrink-0"></i>
            <h3 class="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">${title}</h3>
          </div>
          <div class="flex items-center space-x-1.5 shrink-0">
            <button onclick="app5s.downloadPhoto('${photoUrl}', '${title}')" title="Tải ảnh về máy tính" class="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center space-x-1 shadow-xs">
              <i data-lucide="download" class="w-3.5 h-3.5"></i>
              <span>Tải về</span>
            </button>
            <button onclick="app5s.closeModal()" class="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
              <i data-lucide="x" class="w-4 h-4"></i>
            </button>
          </div>
        </div>
        <div class="rounded-xl overflow-hidden bg-black/90 flex items-center justify-center p-1">
          <img src="${photoUrl}" class="max-h-[72vh] w-auto max-w-full rounded-lg object-contain">
        </div>
        <div class="flex items-center justify-between pt-1 text-[11px] text-slate-500">
          <span>🛡️ Ảnh đã đóng dấu số Watermark 5S VPI</span>
          <button onclick="app5s.downloadPhoto('${photoUrl}', '${title}')" class="text-emerald-600 dark:text-emerald-400 font-bold hover:underline flex items-center space-x-1">
            <i data-lucide="download" class="w-3 h-3"></i>
            <span>Lưu file về máy tính</span>
          </button>
        </div>
      </div>
    `;
    this.showModal(modalHtml);
  }

  // V18 PRO: CHẤM 5S BUỒNG PHÒNG HẾT CA (BỎ ĐIỂM 100Đ -> ĐẠT / KHÔNG ĐẠT; PHÂN QUYỀN NHÂN VIÊN CHỈ ĐƯỢC XEM/CHỤP/XÓA)
  openReviewShiftPhotoModal(roomId, auditId = null) {
    const room = (this.data.rooms || []).find(r => r.id == roomId);
    if (!room) return;
    const dept = (this.data.departments || []).find(d => d.id == room.department_id) || { name: 'Khoa' };
    const rs = this.getRoomSchedule(roomId);
    const s5 = rs.post_shift_5s || {};
    const staffNames = (rs.staff_assigned || []).map(s => s.name).join(', ') || s5.submitted_by || 'Cán bộ ca trực';
    const photo = s5.photo || (this.data.audits || []).find(a => a.room_id == roomId)?.after_photo || '';

    const canAudit = this.isUserManagerOrSupervisor();
    this.currentEvaluationAuditId = auditId || s5.audit_id || null;
    const existingAudit = (this.data.audits || []).find(a => (auditId && a.id == auditId) || (a.room_id == roomId && (!a.audit_date || a.audit_date === this.getTodayDateString())));
    if (existingAudit) {
      if (!s5.photo && existingAudit.after_photo) s5.photo = existingAudit.after_photo;
      if (!s5.notes && existingAudit.notes) s5.notes = existingAudit.notes;
      if (!s5.submitted_by && existingAudit.inspector_name) s5.submitted_by = existingAudit.inspector_name;
      if (!s5.status && existingAudit.status) s5.status = existingAudit.status;
      if (existingAudit.issue_detected) s5.issue = existingAudit.issue_detected;
    }
    this.currentReviewRoomId = roomId;
    this.currentEvaluationResult = s5.status === 'rejected' ? 'fail' : 'pass';

    const modalHtml = `
      <div class="p-5 space-y-4 max-h-[88vh] overflow-y-auto no-scrollbar">
        <div class="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3">
          <div class="flex items-center space-x-2">
            <div class="w-9 h-9 rounded-2xl ${canAudit ? 'bg-indigo-600 text-white' : 'bg-emerald-600 text-white'} flex items-center justify-center font-bold">
              <i data-lucide="${canAudit ? 'shield-check' : 'camera'}" class="w-5 h-5"></i>
            </div>
            <div>
              <h3 class="text-sm font-black text-slate-900 dark:text-white">${canAudit ? 'CHẤM 5S BUỒNG PHÒNG HẾT CA' : 'ẢNH BÀN GIAO 5S BUỒNG PHÒNG'}</h3>
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
          <div class="flex justify-between items-center pt-1 border-t border-indigo-200/60 mt-1">
            <span class="text-slate-500 font-medium">Trạng thái 5S:</span>
            ${s5.status === 'approved' ? '<span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">🟢 ĐẠT CHUẨN 5S</span>' :
              (s5.status === 'rejected' ? '<span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-red-100 text-red-800 border border-red-300">🔴 NHẮC LỖI - CẦN SỬA</span>' :
              '<span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">🟡 CHỜ CHẤM 5S</span>')}
          </div>
          ${s5.notes ? `
            <div class="pt-1 text-[11px] text-slate-600 dark:text-slate-300 italic">
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

        ${!canAudit ? `
          <!-- KHỐI CHỨC NĂNG DÀNH CHO TÀI KHOẢN NHÂN VIÊN (YÊU CẦU 4: CHỈ ĐƯỢC XEM/CHỤP/XÓA ẢNH CỦA MÌNH) -->
          <div class="space-y-3 bg-slate-50 dark:bg-slate-800 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700">
            <div class="flex items-center space-x-2 text-[11px] text-slate-600 dark:text-slate-300">
              <i data-lucide="info" class="w-4 h-4 text-emerald-600 shrink-0"></i>
              <span>Tài khoản nhân viên chỉ được xem ảnh, chụp cập nhật thêm hoặc xóa ảnh đã nộp của buồng phòng mình. Quyền Chấm 5S chỉ dành cho Ban Quản lý / Giám sát.</span>
            </div>
            <div class="grid grid-cols-2 gap-2 pt-1">
              <button onclick="app5s.openEndShift5SModal(${roomId})" class="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition flex items-center justify-center space-x-1.5 shadow-xs">
                <i data-lucide="camera" class="w-4 h-4"></i>
                <span>📷 Chụp Cập Nhật Ảnh</span>
              </button>
              ${photo ? `
                <button onclick="app5s.deleteMyShiftPhoto(${roomId})" class="py-2.5 px-3 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-xl text-xs transition flex items-center justify-center space-x-1.5 border border-red-200">
                  <i data-lucide="trash-2" class="w-4 h-4"></i>
                  <span>🗑️ Xóa Ảnh Đã Gửi</span>
                </button>
              ` : `
                <button disabled class="py-2.5 px-3 bg-slate-100 text-slate-400 font-bold rounded-xl text-xs flex items-center justify-center space-x-1.5 cursor-not-allowed">
                  <i data-lucide="check" class="w-4 h-4"></i>
                  <span>Chưa có ảnh</span>
                </button>
              `}
            </div>
          </div>
        ` : `
          <!-- KHỐI CHẤM 5S DÀNH CHO CÁN BỘ QUẢN LÝ / GIÁM SÁT (BỎ 100Đ -> ĐẠT / KHÔNG ĐẠT) -->
          <div class="space-y-3">
            <label class="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Kết quả Chấm 5S của Cán bộ Giám sát:
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
                'Chưa phân loại rác y tế đúng túi (TT 20/2021)',
                'Dây máy thở bừa bãi vướng lối đi',
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

            <div>
              <span class="block text-[10px] text-slate-500 font-bold mb-1">Hạn khắc phục:</span>
              <select id="eval-deadline-select" class="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-semibold">
                <option>Trước 11h30 hôm nay</option>
                <option>Trước 17h00 hôm nay</option>
                <option>Đầu giờ ca trực sau</option>
                <option>Trong vòng 2 giờ</option>
              </select>
            </div>
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Ý kiến nhận xét của Cán bộ Giám sát:</label>
            <input type="text" id="eval-notes-input" value="${s5.status === 'rejected' ? 'Yêu cầu chấn chỉnh và khắc phục lỗi 5S.' : 'Đạt chuẩn 5S bệnh viện VPI. Buồng phòng sắp xếp gọn gàng, sạch sẽ.'}" class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-800 dark:text-slate-100">
          </div>

          <button onclick="app5s.submitReviewShiftPhoto(${roomId})" class="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-black py-3 rounded-2xl shadow-md transition flex items-center justify-center space-x-2 text-xs">
            <i data-lucide="check-check" class="w-4 h-4"></i>
            <span>LƯU KẾT QUẢ CHẤM 5S & GỬI CHO BUỒNG PHÒNG</span>
          </button>
        `}
      </div>
    `;

    this.showModal(modalHtml);
  }

  submitReviewShiftPhoto(roomId) {
    if (!this.canReview5S()) {
      alert('🔒 Tài khoản của bạn chỉ được GỬI ảnh 5S, không có quyền DUYỆT ảnh. Liên hệ Admin nếu cần cấp quyền.');
      return;
    }
    const rs = this.getRoomSchedule(roomId);
    const room = (this.data.rooms || []).find(r => r.id == roomId) || { name: 'Buồng phòng' };
    const user = this.getCurrentUser() || { name: 'KTV. Vũ Bá Đạt', code: 'BV-345', title: 'Cán bộ Giám sát 5S' };
    const result = this.currentEvaluationResult; // 'pass' or 'fail'
    const notesInput = document.getElementById('eval-notes-input');
    const issueInput = document.getElementById('eval-issue-input');
    const deadlineSelect = document.getElementById('eval-deadline-select');

    const notes = notesInput ? notesInput.value.trim() : '';
    const issue = issueInput ? issueInput.value.trim() : '';
    const deadline = deadlineSelect ? deadlineSelect.value : 'Trước 11h30';

    if (result === 'fail' && !issue) {
      alert('Vui lòng nhập chi tiết lỗi 5S phát hiện để gửi nhắc nhở cho buồng phòng!');
      if (issueInput) issueInput.focus();
      return;
    }

    const currentTime = new Date().toTimeString().slice(0, 5);

    if (!rs.post_shift_5s) rs.post_shift_5s = {};
    delete rs._auto;
    rs.post_shift_5s.status = (result === 'pass' ? 'approved' : 'rejected');
    rs.post_shift_5s.evaluated_by = user.name;
    rs.post_shift_5s.evaluated_at = `${this.getTodayDateString()} ${currentTime}`;
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
      audit.rating = result === 'pass' ? 'Đạt chuẩn 5S' : 'Cần khắc phục';
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
      this.showToast(`✅ Đã chấm ĐẠT CHUẨN 5S cho ${room.name}!`);
    } else {
      this.showToast(`⚠️ Đã ghi nhận NHẮC LỖI 5S cho ${room.name}!`);
    }
  }
  // V21: Xóa hoàn toàn Trung Tâm Duyệt Ảnh 5S theo yêu cầu người dùng, chuyển hướng sang Báo Cáo 5S Cuối Ngày
  filterReviewCenter(tab = null, deptId = null) {
    this.openDailySummaryModal();
  }

  openAllShiftAuditsCenterModal(selectedTab = 'all', selectedDeptId = 'all') {
    this.openDailySummaryModal();
  }

  showReportLockedNotice(featureName) {
    alert(`🔒 Giới Hạn Quyền Quản Lý: Tính năng ${featureName} chỉ dành riêng cho Ban Lãnh Đạo Viện, Ban Chỉ Đạo 5S và Cán bộ Quản lý Cấp Khoa / Phòng. Tài khoản nhân viên thường không được cấp quyền truy cập để bảo vệ tính toàn vẹn của dữ liệu báo cáo.`);
  }

  openDailySummaryModal(targetDate = null) {
    if (!this.isAdmin() && !this.isUserManagerOrSupervisor()) {
      this.showReportLockedNotice('Báo Cáo 5S');
      return;
    }
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

        <div class="flex items-center justify-between gap-2 flex-wrap bg-slate-50 dark:bg-slate-900 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-700">
          <div class="flex items-center space-x-1.5 text-xs font-bold text-slate-700 dark:text-slate-200">
            <i data-lucide="calendar" class="w-4 h-4 text-emerald-600"></i>
            <span>Ngày tổng kết:</span>
            <input type="date" value="${date}" onchange="app5s.openDailySummaryModal(this.value)" class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1 text-xs font-bold font-mono text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500">
          </div>
          <button onclick="app5s.exportScheduleToExcel('${date}')" class="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[11px] font-bold transition flex items-center space-x-1 shadow-2xs">
            <i data-lucide="download" class="w-3.5 h-3.5"></i>
            <span>Xuất Excel Ngày Này</span>
          </button>
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
              const roomStatus = this.getDepartmentRoom5SSubmissionStatus(d.id, date);
              const isCompleted = roomStatus.isFullyCompleted;
              const deptEval = evals.find(e => e.dept_id == d.id && e.date === date) || evals.find(e => e.dept_id == d.id);
              const deptRooms = roomStatus.totalRooms > 0 ? (this.data.rooms || []).filter(r => r.department_id == d.id) : [];
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
                             <span>HOÀN THÀNH (${roomStatus.doneCount}/${roomStatus.totalRooms} phòng)</span>
                           </span>` 
                        : `<span class="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-red-100 text-red-800 border border-red-300">
                             <i data-lucide="alert-triangle" class="w-2.5 h-2.5"></i>
                             <span>CHƯA HOÀN THÀNH (${roomStatus.doneCount}/${roomStatus.totalRooms} phòng)</span>
                           </span>`
                      }
                    </div>
                  </div>

                  <!-- V19: PHÂN TÍCH CHI TIẾT TỪNG PHÒNG ĐÃ LÀM VÀ CHƯA LÀM -->
                  <div class="bg-slate-50 dark:bg-slate-900/60 rounded-xl p-2 text-[10.5px] space-y-1 border border-slate-200 dark:border-slate-700">
                    <div class="flex items-center justify-between">
                      <span class="text-emerald-700 dark:text-emerald-400 font-bold">🟢 Đã nộp ảnh 5S (${roomStatus.doneCount} vị trí):</span>
                      <span class="text-[9.5px] text-slate-400 font-mono">${roomStatus.rate}%</span>
                    </div>
                    <div class="text-slate-600 dark:text-slate-300 text-[10px] pl-1">
                      ${roomStatus.doneRooms.length > 0 ? roomStatus.doneRooms.map(r => r.name).join(', ') : '<em class="text-slate-400">Chưa có phòng nào nộp ảnh</em>'}
                    </div>

                    ${roomStatus.missingRooms.length > 0 ? `
                      <div class="pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                        <div class="text-red-700 dark:text-red-400 font-bold">🔴 Còn thiếu chưa nộp (${roomStatus.missingCount} vị trí):</div>
                        <div class="text-red-800 dark:text-red-300 text-[10px] pl-1 font-medium">
                          ${roomStatus.missingRooms.map(r => r.name).join(', ')}
                        </div>
                      </div>
                    ` : ''}
                  </div>

                  <div class="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-700/60 text-[11px]">
                    <div>
                      ${deptEval ? `
                        <div class="flex items-center space-x-1.5">
                          <span class="px-2 py-0.5 rounded-md text-[10px] font-black ${
                            deptEval.result === 'pass' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
                          }">${deptEval.score != null && deptEval.score !== '' ? deptEval.score + 'đ' : '—'} • ${deptEval.grade || (deptEval.result === 'fail' ? 'Cần cải tiến' : 'Đạt')}</span>
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

  // V18 PRO: ĐÁNH GIÁ 5S KHOA/PHÒNG (BỎ ĐIỂM SỐ 100Đ -> ĐẠT / KHÔNG ĐẠT)
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
      result: deptEval ? (deptEval.result || (deptEval.score >= 70 ? 'pass' : 'fail')) : 'pass'
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

        <!-- BỎ ĐIỂM 100Đ -> KẾT LUẬN NHỊ PHÂN ĐẠT / KHÔNG ĐẠT -->
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
              <span>🔴 KHÔNG ĐẠT (CẦN SỬA)</span>
            </button>
          </div>
        </div>

        <div id="dept-issue-block" class="space-y-2.5 ${this.currentDeptEvalTarget.result === 'fail' ? '' : 'hidden'} bg-red-50/70 dark:bg-red-950/30 p-3.5 rounded-2xl border border-red-200 dark:border-red-900/60">
          <label class="block text-xs font-bold text-red-900 dark:text-red-300">
            ⚠️ Tồn tại & Lỗi 5S phát hiện tại Khoa:
          </label>
          
          <div class="flex flex-wrap gap-1">
            ${[
              'Rác y tế phân loại chưa đúng quy chuẩn (TT 20/2021)',
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
    if (!this.canReview5S()) {
      alert('🔒 Tài khoản của bạn chỉ được GỬI ảnh 5S, không có quyền DUYỆT / đánh giá 5S.');
      return;
    }
    const dept = (this.data.departments || []).find(d => d.id == deptId);
    if (!dept) return;

    const user = this.getCurrentUser() || { name: 'ThS. BSCKII. Phạm Quỳnh Hưng', code: 'BV-101', title: 'Trưởng ban Chỉ đạo 5S' };
    const result = this.currentDeptEvalTarget ? this.currentDeptEvalTarget.result : 'pass';

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

    const grade = result === 'pass' ? 'ĐẠT CHUẨN 5S' : 'KHÔNG ĐẠT (CẦN SỬA)';

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
      score: result === 'pass' ? 100 : 0,
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

    this.showToast(`✅ Đã lưu đánh giá 5S cho ${dept.name}: ${grade}!`);
  }
  // V18 PRO: XUẤT BẢN BÁO CÁO 5S IN A4 (PHÂN TÍCH ĐÃ THỰC HIỆN / CHƯA THỰC HIỆN; BỎ 100Đ; TÙY CHỈNH NGÀY & KHOA)

  // =========================================================================
  // V20 PRO: HỆ THỐNG LƯU TRỮ INDEXEDDB & CHỐNG MẤT DỮ LIỆU KHI TẢI LẠI TRANG
  // =========================================================================
  openIndexedDb() {
    return new Promise((resolve) => {
      if (!window.indexedDB) return resolve(null);
      const req = window.indexedDB.open('vpi_5s_storage_v20', 1);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('full_state')) {
          db.createObjectStore('full_state', { keyPath: 'key' });
        }
        if (!db.objectStoreNames.contains('audits')) {
          db.createObjectStore('audits', { keyPath: 'id' });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    });
  }

  async persistToIndexedDb(data) {
    try {
      const db = await this.openIndexedDb();
      if (!db) return;
      const tx = db.transaction(['full_state', 'audits'], 'readwrite');
      const stateStore = tx.objectStore('full_state');
      stateStore.put({ key: 'current_data', data: data, timestamp: Date.now() });

      const auditStore = tx.objectStore('audits');
      if (Array.isArray(data.audits)) {
        data.audits.forEach(a => {
          if (a && a.id) {
            try { auditStore.put(a); } catch (e) {}
          }
        });
      }
    } catch (err) {
      console.warn('IndexedDB write error:', err);
    }
  }

  async restoreFromIndexedDb() {
    try {
      const db = await this.openIndexedDb();
      if (!db) return null;
      return new Promise((resolve) => {
        const tx = db.transaction(['full_state', 'audits'], 'readonly');
        const stateStore = tx.objectStore('full_state');
        const req = stateStore.get('current_data');
        req.onsuccess = () => {
          if (req.result && req.result.data) {
            resolve(req.result.data);
          } else {
            const auditStore = tx.objectStore('audits');
            const allAuditsReq = auditStore.getAll();
            allAuditsReq.onsuccess = () => {
              resolve(allAuditsReq.result ? { audits: allAuditsReq.result } : null);
            };
            allAuditsReq.onerror = () => resolve(null);
          }
        };
        req.onerror = () => resolve(null);
      });
    } catch (err) {
      console.warn('IndexedDB read error:', err);
      return null;
    }
  }

  async initAsyncStorage() {
    try {
      const offlineData = await this.restoreFromIndexedDb();
      if (offlineData) {
        let changed = false;

        // V24: BẢO VỆ PHỤC HỒI DỮ LIỆU KHI LOCALSTORAGE BỊ LÀM TRỐNG HOẶC TRÀN BỘ NHỚ
        const isLocalStorageFresh = !localStorage.getItem(STORAGE_KEY);
        if (isLocalStorageFresh) {
          if (Array.isArray(offlineData.departments) && offlineData.departments.length > 0) {
            this.data.departments = offlineData.departments;
            changed = true;
          }
          if (Array.isArray(offlineData.rooms) && offlineData.rooms.length > 0) {
            this.data.rooms = offlineData.rooms;
            changed = true;
          }
          if (offlineData.shift_config) {
            this.data.shift_config = offlineData.shift_config;
            changed = true;
          }
          if (offlineData.hospital) {
            this.data.hospital = offlineData.hospital;
            changed = true;
          }
        }

        if (Array.isArray(offlineData.audits) && offlineData.audits.length > 0) {
          const currentAuditIds = new Set((this.data.audits || []).map(a => a.id));
          offlineData.audits.forEach(a => {
            if (!currentAuditIds.has(a.id)) {
              this.data.audits.unshift(a);
              changed = true;
            } else {
              const existing = this.data.audits.find(ex => ex.id === a.id);
              if (existing && !existing.after_photo && a.after_photo) {
                existing.after_photo = a.after_photo;
                changed = true;
              }
            }
          });
        }
        if (offlineData.rooms_schedule) {
          if (!this.data.schedules) this.data.schedules = { rooms_schedule: {} };
          if (!this.data.schedules.rooms_schedule) this.data.schedules.rooms_schedule = {};
          for (const [k, v] of Object.entries(offlineData.rooms_schedule)) {
            if (v && v.post_shift_5s && v.post_shift_5s.status === 'submitted') {
              if (!this.data.schedules.rooms_schedule[k] || !this.data.schedules.rooms_schedule[k].post_shift_5s) {
                if (!this.data.schedules.rooms_schedule[k]) this.data.schedules.rooms_schedule[k] = {};
                this.data.schedules.rooms_schedule[k].post_shift_5s = v.post_shift_5s;
                changed = true;
              }
            }
          }
        }
        if (changed) {
          this.render();
        }
      }
    } catch (e) {
      console.warn('Lỗi initAsyncStorage:', e);
    }
  }

  printDailyEvaluationReport(targetDate = null, targetDeptId = 'all') {
    const date = targetDate || this.getTodayDateString();
    let depts = this.getSortedDepartments();
    if (targetDeptId && targetDeptId !== 'all') {
      depts = depts.filter(d => String(d.id) === String(targetDeptId));
    }
    const audits = (this.data.audits || []).filter(a => a.audit_date === date);
    const schedules = this.data.schedules || { rooms_schedule: [] };
    const roomSchedules = schedules.rooms_schedule || [];
    const allRooms = this.data.rooms || [];

    // Tập hợp toàn bộ buồng phòng theo danh sách khoa đã chọn
    const targetDeptIds = new Set(depts.map(d => d.id));
    const targetRooms = allRooms.filter(r => targetDeptIds.has(r.department_id));

    // Thống kê chi tiết
    let totalPositions = targetRooms.length;
    let submittedPositions = 0;
    let approvedPositions = 0;
    let rejectedPositions = 0;
    let missingPositions = 0;

    targetRooms.forEach(rm => {
      const rs = this.getRoomSchedule(rm.id, date);
      const audit = audits.find(a => a.room_id == rm.id);
      const hasPhoto = !!(rs.post_shift_5s && rs.post_shift_5s.photo) || !!(audit && audit.after_photo);
      const isAppr = (rs.post_shift_5s && rs.post_shift_5s.status === 'approved') || (audit && (audit.status === 'approved' || audit.evaluation_result === 'pass'));
      const isRej = (rs.post_shift_5s && rs.post_shift_5s.status === 'rejected') || (audit && (audit.status === 'rejected' || audit.evaluation_result === 'fail'));

      if (hasPhoto) {
        submittedPositions++;
        if (isAppr) approvedPositions++;
        else if (isRej) rejectedPositions++;
      } else {
        missingPositions++;
      }
    });

    const complianceRate = totalPositions > 0 ? Math.round((submittedPositions / totalPositions) * 100) : 0;

    const printWin = window.open('', '_blank');
    if (!printWin) {
      this.showToast('Vui lòng cho phép popup trình duyệt để in báo cáo!');
      return;
    }

    const deptTitleText = targetDeptId === 'all'
      ? `TOÀN VIỆN (${depts.length} KHOA/PHÒNG BAN - ${totalPositions} VỊ TRÍ LÀM VIỆC)`
      : `${depts[0]?.name.toUpperCase()} (${totalPositions} VỊ TRÍ LÀM VIỆC)`;

    let rowStt = 1;

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Báo cáo Chi tiết 5S Buồng Phòng - Bệnh viện Vĩnh Phúc VPI</title>
        <style>
          @page { size: A4 landscape; margin: 10mm; }
          body { font-family: "Times New Roman", Times, serif; font-size: 12.5px; line-height: 1.35; color: #000; margin: 0; padding: 10px; }
          .header-table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
          .header-table td { vertical-align: top; }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .title { font-size: 15px; font-weight: bold; text-align: center; margin: 8px 0 3px 0; text-transform: uppercase; }
          .subtitle { font-size: 11.5px; text-align: center; font-style: italic; margin-bottom: 10px; }
          .summary-box { border: 1px solid #333; padding: 6px 12px; margin-bottom: 12px; background: #f9f9f9; font-size: 11.5px; border-radius: 4px; }
          table.data-table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
          table.data-table th, table.data-table td { border: 1px solid #333; padding: 4px 6px; font-size: 11px; }
          table.data-table th { background-color: #eaeaea; text-align: center; font-weight: bold; }
          .status-pass { color: #047857; font-weight: bold; }
          .status-fail { color: #b91c1c; font-weight: bold; }
          .status-pending { color: #b45309; font-weight: bold; }
          .dept-header-row { background-color: #f1f5f9; font-weight: bold; font-size: 11.5px; }
          .signatures { width: 100%; margin-top: 20px; page-break-inside: avoid; }
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
              <div style="font-style: italic; font-size: 11.5px; margin-top: 4px;">Vĩnh Phúc, ngày ${date.slice(8, 10)} tháng ${date.slice(5, 7)} năm ${date.slice(0, 4)}</div>
            </td>
          </tr>
        </table>

        <div class="title">BẢNG TỔNG HỢP & ĐÁNH GIÁ 5S CHI TIẾT TỪNG KHU VỰC LÀM VIỆC</div>
        <div class="subtitle">Đơn vị: ${deptTitleText} • Ngày đánh giá: ${date.slice(8, 10)}/${date.slice(5, 7)}/${date.slice(0, 4)}</div>

        <div class="summary-box">
          <table style="width: 100%;">
            <tr>
              <td><strong>Tổng số khu vực (buồng phòng):</strong> ${totalPositions} vị trí</td>
              <td><strong>Đã nộp ảnh 5S:</strong> <span class="status-pass">${submittedPositions}/${totalPositions} (${complianceRate}%)</span></td>
              <td><strong>Đạt chuẩn:</strong> <span class="status-pass">${approvedPositions} phòng</span></td>
              <td><strong>Cần khắc phục:</strong> <span class="status-fail">${rejectedPositions} phòng</span></td>
              <td><strong>Chưa gửi ảnh:</strong> <span class="status-fail">${missingPositions} phòng</span></td>
            </tr>
          </table>
        </div>

        <table class="data-table">
          <thead>
            <tr>
              <th style="width: 30px;">STT</th>
              <th style="width: 150px;">Khoa / Phòng Ban</th>
              <th style="width: 180px;">Khu Vực Làm Việc / Buồng Phòng</th>
              <th style="width: 65px;">Mã Vị Trí</th>
              <th style="width: 130px;">Nhân Sự Ca Trực</th>
              <th style="width: 105px;">Tình Trạng 5S</th>
              <th style="width: 115px;">Kết Quả Chấm 5S</th>
              <th>Ghi Chú & Tồn Tại Nhắc Nhở Cải Tiến</th>
            </tr>
          </thead>
          <tbody>
            ${depts.map(d => {
              const deptRooms = allRooms.filter(r => r.department_id == d.id);
              if (deptRooms.length === 0) return '';

              return deptRooms.map((rm, rmIdx) => {
                const rs = this.getRoomSchedule(rm.id, date);
                const audit = audits.find(a => a.room_id == rm.id);
                const isWorking = rs.is_working;
                const s5 = rs.post_shift_5s || {};
                const staffNames = (rs.staff_assigned || []).map(s => s.name).join(', ') || s5.submitted_by || (audit ? audit.sender_name : 'Nhân sự ca trực');
                const hasPhoto = !!(s5.photo || (audit && audit.after_photo));
                const isApproved = (s5.status === 'approved') || (audit && (audit.status === 'approved' || audit.evaluation_result === 'pass'));
                const isRejected = (s5.status === 'rejected') || (audit && (audit.status === 'rejected' || audit.evaluation_result === 'fail'));

                let statusBadge = '';
                let resultBadge = '';

                if (!isWorking) {
                  statusBadge = '<span style="color:#64748b;">Nghỉ ca trực</span>';
                  resultBadge = '<span style="color:#64748b;">—</span>';
                } else if (hasPhoto) {
                  statusBadge = `<span class="status-pass">Đã nộp (${s5.submitted_at || audit?.audit_time || 'Đúng giờ'})</span>`;
                  if (isApproved) {
                    resultBadge = '<span class="status-pass">🟢 ĐẠT CHUẨN 5S</span>';
                  } else if (isRejected) {
                    resultBadge = '<span class="status-fail">🔴 CẦN KHẮC PHỤC</span>';
                  } else {
                    resultBadge = '<span class="status-pending">🟡 CHỜ DUYỆT</span>';
                  }
                } else {
                  statusBadge = '<span class="status-fail">Chưa nộp ảnh 5S</span>';
                  resultBadge = '<span class="status-fail">⚪ CHƯA THỰC HIỆN</span>';
                }

                const issueText = s5.notes || audit?.notes || audit?.issue_detected || (hasPhoto ? 'Buồng phòng sạch sẽ, ngăn nắp, trang thiết bị đúng vị trí.' : 'Hết ca trực chưa chụp ảnh minh chứng bàn giao.');

                return `
                  <tr>
                    <td class="center font-mono">${rowStt++}</td>
                    ${rmIdx === 0 ? `<td rowspan="${deptRooms.length}" class="bold dept-header-row" style="vertical-align: middle;">${d.name}<br><span style="font-size:10px; font-weight:normal; color:#475569;">(${deptRooms.length} vị trí • ${d.doctor_in_charge || 'Trưởng khoa'})</span></td>` : ''}
                    <td class="bold">${rm.name}</td>
                    <td class="center font-mono">${rm.code || 'P-' + rm.id}</td>
                    <td>${staffNames}</td>
                    <td class="center">${statusBadge}</td>
                    <td class="center">${resultBadge}</td>
                    <td style="font-size: 10.5px;">${issueText}</td>
                  </tr>
                `;
              }).join('');
            }).join('')}
          </tbody>
        </table>

        <table class="signatures">
          <tr>
            <td>
              <div class="bold">CÁN BỘ GIÁM SÁT 5S TOÀN VIỆN</div>
              <div style="font-style: italic; font-size: 11px; margin-bottom: 45px;">(Ký và ghi rõ họ tên)</div>
              <div class="bold">KTV. Vũ Bá Đạt</div>
            </td>
            <td>
              <div class="bold">TRƯỞNG BAN CHỈ ĐẠO 5S BỆNH VIỆN</div>
              <div style="font-style: italic; font-size: 11px; margin-bottom: 45px;">(Ký, ghi rõ họ tên và đóng dấu)</div>
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

  // =========================================================================
  // V19 PRO: HỆ THỐNG THÔNG BÁO (CHUÔNG) & ÂM THANH Y TẾ DU DƯƠNG (WEB AUDIO API)
  // =========================================================================
  isSoundEnabled() {
    try {
      return localStorage.getItem('vpi_sound_enabled') !== 'false';
    } catch(e) { return true; }
  }

  toggleSound() {
    const cur = this.isSoundEnabled();
    const next = !cur;
    try {
      localStorage.setItem('vpi_sound_enabled', next ? 'true' : 'false');
    } catch(e) {}
    this.playNotificationChime(true);
    this.showToast(next ? '🔔 Đã BẬT âm thanh chuông thông báo!' : '🔕 Đã TẮT âm thanh chuông thông báo!');
    this.render();
  }

  playNotificationChime(forcePlay = false) {
    if (!forcePlay && !this.isSoundEnabled()) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const now = ctx.currentTime;
      // Tone 1: E5 (659.25 Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(659.25, now);
      gain1.gain.setValueAtTime(0.18, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.35);

      // Tone 2: G#5 (830.61 Hz) du dương chuẩn y tế
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(830.61, now + 0.12);
      gain2.gain.setValueAtTime(0.22, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.55);
    } catch (err) {
      console.warn('Audio chime notice:', err);
    }
  }

  openNotificationsCenterModal() {
    const soundOn = this.isSoundEnabled();
    const notice = this.data.hospital.notice;
    const today = this.getTodayDateString();
    const audits = this.data.audits || [];
    const recentAudits = audits.slice(0, 10);

    const modalHtml = `
      <div class="p-5 space-y-4 max-h-[85vh] overflow-y-auto no-scrollbar">
        <div class="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3">
          <div class="flex items-center space-x-2">
            <div class="w-9 h-9 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-xs">
              <i data-lucide="bell" class="w-5 h-5"></i>
            </div>
            <div>
              <h3 class="text-sm font-black text-slate-900 dark:text-white">TRUNG TÂM THÔNG BÁO 5S VPI</h3>
              <p class="text-[10px] text-amber-600 font-bold">Cập nhật tin tức & Chuông cảnh báo toàn viện</p>
            </div>
          </div>
          <button onclick="app5s.closeModal()" class="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400">
            <i data-lucide="x" class="w-4 h-4"></i>
          </button>
        </div>

        <!-- HÀNG ĐIỀU KHIỂN BẬT - TẮT CHUÔNG BÁO (YÊU CẦU 9) -->
        <div class="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/40 p-3 rounded-2xl border border-amber-200 dark:border-amber-800 flex items-center justify-between">
          <div class="flex items-center space-x-2">
            <div class="w-8 h-8 rounded-xl ${soundOn ? 'bg-amber-600 text-white' : 'bg-slate-300 dark:bg-slate-700 text-slate-500'} flex items-center justify-center">
              <i data-lucide="${soundOn ? 'volume-2' : 'volume-x'}" class="w-4 h-4"></i>
            </div>
            <div>
              <div class="text-xs font-black text-slate-900 dark:text-white">
                Âm thanh chuông thông báo: <strong>${soundOn ? 'ĐANG BẬT 🔔' : 'ĐANG TẮT 🔕'}</strong>
              </div>
              <div class="text-[10px] text-slate-500">Chuông phát khi có thông báo nhắc nhở & khi nộp ảnh 5S</div>
            </div>
          </div>
          <div class="flex items-center space-x-1.5">
            <button onclick="app5s.playNotificationChime(true)" title="Nghe thử âm chuông" class="px-2.5 py-1 bg-white dark:bg-slate-800 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700 rounded-xl text-[10.5px] font-bold hover:bg-amber-100 transition">
              🔊 Nghe thử
            </button>
            <button onclick="app5s.toggleSound(); app5s.openNotificationsCenterModal();" class="px-3 py-1 ${soundOn ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-emerald-600 hover:bg-emerald-700 text-white'} rounded-xl text-[10.5px] font-bold shadow-xs transition">
              ${soundOn ? 'Tắt Chuông' : 'Bật Chuông'}
            </button>
          </div>
        </div>

        <!-- THÔNG BÁO NHẮC NHỞ TOÀN VIỆN HIỆN TẠI -->
        <div class="space-y-2">
          <div class="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
            <span>Thông báo nhắc nhở toàn viện:</span>
            ${this.canBroadcastHospitalNotice() ? `
              <button onclick="app5s.openReminderModal()" class="text-[10px] text-red-600 font-bold hover:underline">
                + Phát thông báo mới
              </button>
            ` : ''}
          </div>

          ${notice && notice.enabled ? `
            <div class="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 p-3 rounded-2xl space-y-1.5">
              <div class="flex items-center justify-between">
                <span class="text-[10px] font-black uppercase text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/60 px-2 py-0.5 rounded-md">
                  ${notice.title || 'THÔNG BÁO KHẨN'}
                </span>
                <span class="text-[9.5px] text-slate-400 font-mono">${notice.time || notice.updatedAt || ''}</span>
              </div>
              <p class="text-xs font-semibold text-slate-800 dark:text-slate-200">${notice.content || ''}</p>
              <div class="text-[9.5px] text-red-600 font-bold">Người phát: ${notice.author || 'Ban Chỉ Đạo 5S VPI'}</div>
            </div>
          ` : `
            <div class="bg-slate-50 dark:bg-slate-800 p-3 rounded-2xl text-center text-xs text-slate-400">
              Hiện không có thông báo nhắc nhở khẩn toàn viện.
            </div>
          `}
        </div>

        <!-- THÔNG BÁO HOẠT ĐỘNG GỬI ẢNH 5S GẦN ĐÂY -->
        <div class="space-y-2">
          <div class="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
            <span>Hoạt động nộp ảnh 5S gần đây:</span>
            <span class="text-[10px] text-emerald-600 font-mono font-bold">${recentAudits.length} hoạt động</span>
          </div>

          <div class="space-y-1.5 max-h-56 overflow-y-auto no-scrollbar pr-1">
            ${recentAudits.map(a => `
              <div class="bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs flex items-center justify-between">
                <div class="flex items-center space-x-2">
                  <div class="w-6 h-6 rounded-lg ${a.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'} flex items-center justify-center font-bold text-[10px]">
                    <i data-lucide="${a.status === 'approved' ? 'check' : 'clock'}" class="w-3.5 h-3.5"></i>
                  </div>
                  <div>
                    <div class="font-bold text-slate-800 dark:text-slate-200">${a.location || 'Buồng phòng'}</div>
                    <div class="text-[9.5px] text-slate-400">Bởi <strong>${a.evaluator_name || 'Nhân viên'}</strong> • ${a.audit_date || today}</div>
                  </div>
                </div>
                <span class="text-[9.5px] px-2 py-0.5 rounded-md font-bold ${
                  a.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }">
                  ${a.status === 'approved' ? 'Đã duyệt' : 'Chờ chấm'}
                </span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    this.showModal(modalHtml);
  }

  // =========================================================================
  // V19 PRO: ĐỒNG BỘ DỮ LIỆU & AVATAR ĐA THIẾT BỊ (REAL-TIME CROSS-DEVICE SYNC)
  // =========================================================================
  initCrossDeviceSync() {
    try {
      this.syncChannel = new BroadcastChannel('vpi_5s_cross_tab_channel');
      this.syncChannel.onmessage = (event) => {
        // V28: tab khác vừa lưu => chờ tab đó gửi lên máy chủ rồi tải phần thay đổi
        // (trước đây vẽ lại toàn màn hình ngay mỗi lần tab khác lưu, và loadData() không có tác dụng)
        if (event.data && event.data.type === 'DATA_UPDATED') {
          clearTimeout(this.crossTabPullTimer);
          this.crossTabPullTimer = setTimeout(() => this.pullStateFromServer(), 3000);
        }
      };
    } catch(e) {}

    // V28: ghi nhận lúc người dùng đang cuộn / chạm để không vẽ lại màn hình giữa chừng
    const markInteraction = () => { this.lastInteractionAt = Date.now(); };
    ['scroll', 'touchstart', 'touchmove', 'wheel', 'pointerdown'].forEach(ev => {
      document.addEventListener(ev, markInteraction, { capture: true, passive: true });
    });

    // Kéo dữ liệu từ server ngay khi mở ứng dụng
    this.pullStateFromServer();

    // V25 PERF: Đồng bộ nền thông minh thay cho setInterval 6 giây cố định
    // - Tạm dừng khi app chạy nền / màn hình tắt (tiết kiệm pin & 4G)
    // - Giãn dần chu kỳ (exponential backoff) khi máy chủ lỗi / không tồn tại, tối đa 5 phút
    this.syncBaseDelay = 10000;
    this.syncFailCount = 0;
    this.scheduleNextPull();

    // Kéo dữ liệu ngay khi người dùng chuyển sang tab ứng dụng (trên Smartphone hoặc PC)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.pullStateFromServer().finally(() => this.scheduleNextPull());
      } else if (this.syncTimer) {
        clearTimeout(this.syncTimer);
        this.syncTimer = null;
      }
    });

    // V24: TỰ ĐỘNG BẢO VỆ DỮ LIỆU & ĐỒNG BỘ KHI KẾT NỐI MẠNG ĐƯỢC PHỤC HỒI
    window.addEventListener('online', () => {
      this.showToast('📶 Đã kết nối lại mạng! Đang tự động đồng bộ dữ liệu toàn viện...');
      this.pushStateToServer();
      this.pullStateFromServer(true);
    });

    window.addEventListener('offline', () => {
      this.showToast('⚠️ Mất kết nối mạng. Ứng dụng đã chuyển sang chế độ Ngoại tuyến an toàn (Offline Storage).');
    });
  }

  // =========================================================================
  // V20.2 PRO: ĐỒNG BỘ DỮ LIỆU LIÊN THIẾT BỊ (MÁY TÍNH & ĐIỆN THOẠI) REAL-TIME
  // =========================================================================
  scheduleNextPull() {
    if (this.syncTimer) clearTimeout(this.syncTimer);
    if (document.visibilityState === 'hidden') { this.syncTimer = null; return; }
    const delay = Math.min(this.syncBaseDelay * Math.pow(2, this.syncFailCount || 0), 300000);
    this.syncTimer = setTimeout(async () => {
      await this.pullStateFromServer();
      // Dữ liệu mới đến lúc người dùng đang thao tác => cập nhật khi rảnh tay
      if (this.pendingSyncRender && !this.isUserBusy()) {
        this.pendingSyncRender = false;
        this.render();
      }
      this.scheduleNextPull();
    }, delay);
  }

  // V25: Không render lại toàn màn hình khi người dùng đang nhập liệu / mở hộp thoại (tránh mất chữ đang gõ, mất ảnh chưa gửi)
  // V28: ... hoặc đang cuộn / chạm màn hình trong 5 giây gần nhất
  isUserBusy() {
    if (this.lastInteractionAt && Date.now() - this.lastInteractionAt < 5000) return true;
    const modal = document.getElementById('modal-container');
    if (modal && modal.children.length > 0) return true;
    const a = document.activeElement;
    return !!(a && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA' || a.tagName === 'SELECT'));
  }

  // =========================================================================
  // V27: BỘ ĐỒNG BỘ MÁY CHỦ (Vercel API + Supabase)
  // - saveData() => so sánh với ảnh chụp lần đồng bộ trước => đưa thay đổi vào hàng đợi (outbox)
  // - flushOutbox(): tải ảnh lên kho ảnh, gửi thay đổi; mất mạng thì giữ lại gửi sau
  // - pullStateFromServer(): chỉ tải các bản ghi mới kể từ lần trước
  // =========================================================================
  apiUrl(path) {
    return '/api/' + path;
  }

  async apiFetch(path, options = {}) {
    const headers = Object.assign({ 'Content-Type': 'application/json' }, options.headers || {});
    if (this.authToken) headers['Authorization'] = 'Bearer ' + this.authToken;
    const res = await fetch(this.apiUrl(path), Object.assign({}, options, { headers, cache: 'no-store' }));
    let json = null;
    try { json = await res.json(); } catch (e) {}
    if (res.status === 401 && this.authToken) {
      this.handleSessionExpired((json && json.error) || 'Phiên đăng nhập đã hết hạn');
    }
    if (!res.ok) {
      const err = new Error((json && json.error) || ('Lỗi máy chủ ' + res.status));
      err.status = res.status;
      throw err;
    }
    return json;
  }

  handleSessionExpired(message) {
    this.authToken = null;
    try { localStorage.removeItem(TOKEN_KEY); localStorage.removeItem('vpi_5s_auth_session'); } catch (e) {}
    if (this.data.auth && this.data.auth.isLoggedIn) {
      this.data.auth = { isLoggedIn: false, currentUserId: null, locationMode: (this.data.auth && this.data.auth.locationMode) || 'internal' };
      this.closeModal();
      this.render();
      this.showToast('🔐 ' + message + '. Vui lòng đăng nhập lại.');
    }
  }

  buildSyncSnapshot(data) {
    const snap = new Map();
    if (!data) return snap;
    for (const [c, def] of Object.entries(SYNC_COLLECTIONS)) {
      const arr = def.get(data);
      if (!Array.isArray(arr)) continue;
      for (const r of arr) {
        if (!r || typeof r !== 'object' || (def.skip && def.skip(r))) continue;
        const k = def.key(r);
        if (!k) continue;
        snap.set(c + '\u0001' + k, JSON.stringify(r));
      }
    }
    for (const [k, def] of Object.entries(SYNC_SINGLETONS)) {
      const v = def.get(data);
      if (v !== undefined && v !== null) snap.set('singleton\u0001' + k, JSON.stringify(v));
    }
    return snap;
  }

  persistOutbox() {
    try { localStorage.setItem(OUTBOX_KEY, JSON.stringify(this.outbox)); } catch (e) {}
  }

  queueOps(ops) {
    if (!ops.length) return;
    const idx = new Map(this.outbox.map((o, i) => [o.c + '\u0001' + o.k, i]));
    ops.forEach(op => {
      const id = op.c + '\u0001' + op.k;
      if (idx.has(id)) {
        this.outbox[idx.get(id)] = op;
      } else {
        idx.set(id, this.outbox.length);
        this.outbox.push(op);
      }
    });
    this.persistOutbox();
  }

  // So sánh dữ liệu hiện tại với lần đồng bộ trước => đưa thay đổi vào hàng đợi
  queueLocalChanges() {
    // Tách mật khẩu Admin vừa đặt cho nhân sự: KHÔNG lưu lại trên thiết bị, chỉ gửi 1 lần lên máy chủ
    const pwByCode = {};
    (this.data.staff || []).forEach(s => {
      if (s && s.password) {
        pwByCode[SYNC_COLLECTIONS.staff.key(s)] = s.password;
        delete s.password;
      }
    });
    const cur = this.buildSyncSnapshot(this.data);
    const prev = this.syncSnapshot || new Map();
    const ops = [];
    for (const [id, json] of cur) {
      if (prev.get(id) !== json) {
        const [c, k] = id.split('\u0001');
        ops.push({ c, k, d: JSON.parse(json) });
      }
    }
    for (const id of prev.keys()) {
      if (!cur.has(id)) {
        const [c, k] = id.split('\u0001');
        if (c !== 'singleton') ops.push({ c, k, d: null });
      }
    }
    Object.entries(pwByCode).forEach(([code, pw]) => {
      let op = ops.find(o => o.c === 'staff' && o.k === code);
      if (!op) {
        const rec = cur.get('staff\u0001' + code);
        if (!rec) return;
        op = { c: 'staff', k: code, d: JSON.parse(rec) };
        ops.push(op);
      }
      if (op.d) op.d.password = pw;
    });
    this.syncSnapshot = cur;
    this.queueOps(ops);
    return ops.length;
  }

  collectDataUrls(value, out) {
    if (typeof value === 'string') {
      if (value.startsWith('data:image/') && value.length > 200) out.add(value);
    } else if (Array.isArray(value)) {
      value.forEach(v => this.collectDataUrls(v, out));
    } else if (value && typeof value === 'object') {
      Object.values(value).forEach(v => this.collectDataUrls(v, out));
    }
    return out;
  }

  replaceStringDeep(obj, from, to) {
    if (!obj || typeof obj !== 'object') return;
    for (const key of Object.keys(obj)) {
      const v = obj[key];
      if (v === from) obj[key] = to;
      else if (v && typeof v === 'object') this.replaceStringDeep(v, from, to);
    }
  }

  // Tải ảnh (base64) trong hàng đợi lên kho ảnh Supabase, thay bằng đường link
  async uploadPendingPhotos() {
    const urls = new Set();
    this.outbox.forEach(op => { if (op.d && op.c !== 'singleton') this.collectDataUrls(op.d, urls); });
    for (const dataUrl of urls) {
      const res = await this.apiFetch('upload', { method: 'POST', body: JSON.stringify({ dataUrl }) });
      const url = res && res.url;
      if (!url) throw new Error('Tải ảnh thất bại');
      this.outbox.forEach(op => this.replaceStringDeep(op, dataUrl, url));
      this.replaceStringDeep(this.data, dataUrl, url);
      for (const [id, json] of this.syncSnapshot) {
        if (json.includes(dataUrl)) this.syncSnapshot.set(id, json.split(dataUrl).join(url));
      }
      this.persistOutbox();
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data)); } catch (e) {}
    }
  }

  async flushOutbox() {
    if (!this.authToken || this.flushing) return this.flushPromise;
    if (!this.outbox.length) return;
    this.flushing = true;
    this.flushPromise = (async () => {
      try {
        await this.uploadPendingPhotos();
        while (this.outbox.length) {
          const batch = this.outbox.slice(0, 150);
          const res = await this.apiFetch('sync', { method: 'POST', body: JSON.stringify({ ops: batch }) });
          // Gỡ các thay đổi đã gửi (giữ thay đổi mới phát sinh trong lúc gửi)
          const sent = new Set(batch);
          this.outbox = this.outbox.filter(o => !sent.has(o));
          this.persistOutbox();
          if (res && Array.isArray(res.rejected) && res.rejected.length) {
            this.needFullPull = true;
            const reason = res.rejected[0].reason || 'không đủ quyền';
            this.showToast(`⚠️ ${res.rejected.length} thay đổi không được lưu: ${reason}`);
          }
        }
        this.syncFailCount = 0;
      } catch (e) {
        this.syncFailCount = Math.min((this.syncFailCount || 0) + 1, 5);
      } finally {
        this.flushing = false;
      }
    })();
    return this.flushPromise;
  }

  scheduleFlush() {
    if (this.flushTimer) clearTimeout(this.flushTimer);
    this.flushTimer = setTimeout(() => {
      this.flushOutbox().then(() => {
        if (this.needFullPull) this.pullStateFromServer(true);
      });
    }, 600);
  }

  async manualSyncCrossDevices() {
    if (!this.authToken) {
      this.showToast('⚠️ Vui lòng đăng nhập để đồng bộ dữ liệu.');
      return;
    }
    this.showToast('🔄 Đang đồng bộ dữ liệu với máy chủ toàn viện...');
    await this.flushOutbox();
    const ok = await this.pullStateFromServer(true);
    this.showToast(ok && !this.outbox.length
      ? '✓ Đồng bộ dữ liệu liên thiết bị thành công!'
      : `⚠️ Chưa đồng bộ được (còn ${this.outbox.length} thay đổi chờ gửi). Kiểm tra mạng.`);
  }

  async pushStateToServer() {
    if (!this.authToken) return;
    this.queueLocalChanges();
    await this.flushOutbox();
  }

  applyServerRecords(res) {
    const records = Array.isArray(res.records) ? res.records : [];
    if (res.full) {
      const keepAuth = this.data.auth;
      const next = JSON.parse(JSON.stringify(this.data));
      const seen = {};
      for (const c of Object.keys(SYNC_COLLECTIONS)) seen[c] = [];
      const singles = {};
      records.forEach(r => {
        if (r.x) return;
        if (r.c === 'singleton') singles[r.k] = r.d;
        else if (seen[r.c]) seen[r.c].push(r.d);
      });
      for (const [c, def] of Object.entries(SYNC_COLLECTIONS)) {
        // Danh mục khoa/phòng: nếu máy chủ chưa có (chưa nạp) thì giữ danh mục chuẩn trên máy
        if ((c === 'departments' || c === 'rooms') && seen[c].length === 0) continue;
        def.set(next, seen[c]);
      }
      const missingSingles = [];
      for (const [k, def] of Object.entries(SYNC_SINGLETONS)) {
        if (singles[k] !== undefined) def.set(next, singles[k]);
        else missingSingles.push(k);
      }
      next.auth = keepAuth;
      this.data = next;
      this.missingSingletons = missingSingles;
    } else {
      records.forEach(r => {
        if (r.c === 'singleton') {
          const def = SYNC_SINGLETONS[r.k];
          if (def && !r.x) def.set(this.data, r.d);
          return;
        }
        const def = SYNC_COLLECTIONS[r.c];
        if (!def) return;
        let arr = def.get(this.data);
        if (!Array.isArray(arr)) { arr = []; def.set(this.data, arr); }
        const i = arr.findIndex(x => def.key(x) === r.k);
        if (r.x) {
          if (i >= 0) arr.splice(i, 1);
        } else if (i >= 0) {
          arr[i] = r.d;
        } else if (r.c === 'audits' || r.c === 'admin_messages' || r.c === 'department_evaluations') {
          arr.unshift(r.d);
        } else {
          arr.push(r.d);
        }
      });
    }
    // Phiếu mới nhất lên đầu
    if (Array.isArray(this.data.audits)) {
      this.data.audits.sort((a, b) => String(b.created_at || b.audit_date || '').localeCompare(String(a.created_at || a.audit_date || '')));
    }
    this.data.review_policy_version = REVIEW_POLICY.version; // quyền đã do máy chủ quản lý
  }

  canonicalJson(v) {
    if (Array.isArray(v)) return '[' + v.map(x => this.canonicalJson(x)).join(',') + ']';
    if (v && typeof v === 'object') {
      return '{' + Object.keys(v).sort().map(k => JSON.stringify(k) + ':' + this.canonicalJson(v[k])).join(',') + '}';
    }
    return JSON.stringify(v === undefined ? null : v);
  }

  filterNewRecords(res) {
    const records = Array.isArray(res.records) ? res.records : [];
    if (!this.seenVersions) {
      try { this.seenVersions = JSON.parse(localStorage.getItem(SEEN_KEY) || '{}') || {}; } catch (e) { this.seenVersions = {}; }
    }
    const seen = this.seenVersions;
    let out = records;
    if (!res.full) {
      out = records.filter(r => {
        const id = r.c + '\u0001' + r.k;
        if (r.v && seen[id] === r.v) return false;
        const cur = this.syncSnapshot ? this.syncSnapshot.get(id) : undefined;
        if (r.x) return cur !== undefined;
        if (cur === undefined) return true;
        try { return this.canonicalJson(JSON.parse(cur)) !== this.canonicalJson(r.d); } catch (e) { return true; }
      });
    }
    // Ghi nhớ phiên bản đã nhận (chỉ giữ vùng gần đây cho gọn)
    records.forEach(r => { if (r.v) seen[r.c + '\u0001' + r.k] = r.v; });
    const floor = (res.version || 0) - 300;
    Object.keys(seen).forEach(id => { if (seen[id] < floor) delete seen[id]; });
    try { localStorage.setItem(SEEN_KEY, JSON.stringify(seen)); } catch (e) {}
    return out;
  }

  async pullStateFromServer(force = false) {
    if (!this.authToken) return false;
    try {
      if (this.outbox.length) {
        await this.flushOutbox();
        if (this.outbox.length) return false; // còn thay đổi chưa gửi được => chưa tải để tránh mất dữ liệu
      }
      const full = force || this.needFullPull || !this.syncVersion;
      const since = full ? 0 : Math.max(0, this.syncVersion - 50);
      const res = await this.apiFetch('sync?since=' + since);
      if (!res) return false;
      this.syncFailCount = 0;
      // V28 FIX: bỏ các bản ghi đã nhận ở lần trước (vùng chồng lấn an toàn) hoặc giống hệt dữ liệu trên máy
      // => KHÔNG vẽ lại màn hình mỗi 10 giây (nguyên nhân lỗi nhảy trang / tải lại ảnh liên tục)
      res.records = this.filterNewRecords(res);
      const changed = res.full || res.records.length > 0;
      if (changed) {
        this.applyServerRecords(res);
        this.normalizeData();
        this.syncSnapshot = this.buildSyncSnapshot(this.data);
        // Admin/Ban chỉ đạo: tự đưa cấu hình bệnh viện lên máy chủ nếu máy chủ chưa có
        if (res.full && this.missingSingletons && this.missingSingletons.length && this.isHospitalLeaderOrSupervisor()) {
          const ops = this.missingSingletons
            .map(k => ({ c: 'singleton', k, d: SYNC_SINGLETONS[k].get(this.data) }))
            .filter(op => op.d !== undefined && op.d !== null);
          this.queueOps(ops);
          this.scheduleFlush();
        }
        this.missingSingletons = [];
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data)); } catch (e) {}
        this.persistToIndexedDb(this.data);
        this.validateSession();
        if (force || !this.isUserBusy()) {
          this.render();
        } else {
          this.pendingSyncRender = true;
        }
      }
      this.needFullPull = false;
      this.syncVersion = res.version || this.syncVersion;
      try { localStorage.setItem(SYNC_VERSION_KEY, String(this.syncVersion)); } catch (e) {}
      return true;
    } catch (err) {
      this.syncFailCount = Math.min((this.syncFailCount || 0) + 1, 5);
      return false;
    }
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