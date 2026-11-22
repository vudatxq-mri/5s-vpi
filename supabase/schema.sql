-- =========================================================================
-- 5S VPI - CƠ SỞ DỮ LIỆU SUPABASE
-- Cách chạy: Supabase > SQL Editor > New query > dán toàn bộ file này > Run
-- Chạy lại nhiều lần vẫn an toàn (không xóa dữ liệu đã có).
-- =========================================================================

-- 1) Bảng dữ liệu chung: mỗi dòng là 1 bản ghi (khoa, phòng, nhân sự, phiếu 5S, lịch buồng phòng...)
create sequence if not exists public.rec_version_seq;

create table if not exists public.records (
  collection  text        not null,               -- departments | rooms | staff | audits | rooms_schedule | ...
  key         text        not null,               -- khóa bản ghi trong collection
  data        jsonb,                              -- nội dung bản ghi (KHÔNG chứa mật khẩu)
  deleted     boolean     not null default false, -- đánh dấu đã xóa (để máy khác đồng bộ việc xóa)
  rec_date    date,                               -- ngày nghiệp vụ (để lọc dữ liệu cũ)
  version     bigint      not null default nextval('public.rec_version_seq'),
  updated_by  text,
  updated_at  timestamptz not null default now(),
  primary key (collection, key)
);

create index if not exists records_version_idx   on public.records (version);
create index if not exists records_coll_date_idx on public.records (collection, rec_date);

-- Mỗi lần thêm / sửa bản ghi => tăng số phiên bản (để điện thoại chỉ tải phần thay đổi)
create or replace function public.records_bump_version() returns trigger
language plpgsql as $$
begin
  new.version := nextval('public.rec_version_seq');
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists records_bump on public.records;
create trigger records_bump before insert or update on public.records
for each row execute function public.records_bump_version();

-- 2) Bảng mật khẩu (chỉ lưu mã băm PBKDF2, không lưu mật khẩu gốc)
create table if not exists public.staff_auth (
  code          text        primary key,          -- Mã NV, viết hoa (VD: BV-345)
  password_hash text,
  must_change   boolean     not null default true, -- bắt đổi mật khẩu ở lần đăng nhập tới
  pw_version    integer     not null default 1,    -- tăng khi đổi mật khẩu => đăng xuất mọi máy cũ
  failed_count  integer     not null default 0,
  locked_until  timestamptz,
  updated_at    timestamptz not null default now()
);

-- 3) Bảo mật: bật RLS và KHÔNG tạo policy nào
--    => khóa công khai (publishable) không đọc/ghi được gì; chỉ máy chủ Vercel dùng khóa bí mật mới truy cập được.
alter table public.records    enable row level security;
alter table public.staff_auth enable row level security;
revoke all on public.records, public.staff_auth from anon, authenticated;
-- Chỉ máy chủ (Secret key = service_role) được đọc/ghi
grant usage on schema public to service_role;
grant select, insert, update, delete on public.records, public.staff_auth to service_role;
grant usage, select on sequence public.rec_version_seq to service_role;

-- 4) Kho ảnh 5S (tối đa 3 MB/ảnh, chỉ nhận ảnh JPEG/PNG/WEBP)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('photos', 'photos', true, 3145728, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- Kiểm tra: phải hiện ra 2 bảng và 1 kho ảnh
select 'OK - bảng records' as ket_qua where exists (select 1 from information_schema.tables where table_schema='public' and table_name='records')
union all
select 'OK - bảng staff_auth' where exists (select 1 from information_schema.tables where table_schema='public' and table_name='staff_auth')
union all
select 'OK - kho ảnh photos' where exists (select 1 from storage.buckets where id='photos');
