# BÁO CÁO LOG LỖI & PHƯƠNG ÁN KHẮC PHỤC DỰ ÁN MATH5
**Tài liệu bàn giao kỹ thuật & hướng dẫn cho Codex / Developer**  
*Thời gian lập:* 29/10/2026  
*Dự án:* Math5 (Vườn Toán Lớp 3)  
*Môi trường:* Local (`C:\Antigravity\Math5`), Remote GitHub (`fossbk-spec/Math5`), Hosting (`math5-production.up.railway.app`)  
*Tham chiếu đối sánh:* [https://vuon-toan-3.onrender.com/index.html](https://vuon-toan-3.onrender.com/index.html)

---

## MỤC LỤC
1. [Tổng Quan Hiện Trạng & Danh Sách Lỗi](#1-tổng-quan-hiện-trạng--danh-sách-lỗi)
2. [Lỗi 1: Railway Không Tải Được Nhánh GitHub (Could not load branches)](#lỗi-1-railway-không-tải-được-nhánh-github-could-not-load-branches)
3. [Lỗi 2: Khối "Bài Được Giao" Bị Vỡ Bố Cục & Tràn Mép Màn Hình](#lỗi-2-khối-bài-được-giao-bị-vỡ-bố-cục--tràn-mép-màn-hình)
4. [Lỗi 3: Thiếu Thanh Sidebar Dọc (Navigation Rail) Giống Trang Gốc](#lỗi-3-thiếu-thanh-sidebar-dọc-navigation-rail-giống-trang-gốc)
5. [Lỗi 4: Không Đồng Bộ Logo Trường & Thông Tin Giáo Viên Từ vuon-toan-3](#lỗi-4-không-đồng-bộ-logo-trường--thông-tin-giáo-viên-từ-vuon-toan-3)
6. [Lỗi 5: Hiện Tượng "Giao Diện 1 Hiện Ra Rồi Biến Mất, Màn Hình Trắng Tinh"](#lỗi-5-hiện-tượng-giao-diện-1-hiện-ra-rồi-biến-mất-màn-hình-trắng-tinh)
7. [Bảng Tổng Hợp File Đã Chỉnh Sửa & Hướng Dẫn Kiểm Thử Cho Codex](#7-bảng-tổng-hợp-file-đã-chỉnh-sửa--hướng-dẫn-kiểm-thử-cho-codex)

---

## 1. TỔNG QUAN HIỆN TRẠNG & DANH SÁCH LỖI

Trong quá trình đưa dự án Math5 từ kho lưu trữ cục bộ lên triển khai trực tuyến trên Railway song song với dự án `hoang-mai-math`, và đối chiếu với bản mẫu chuẩn tại `https://vuon-toan-3.onrender.com/index.html`, hệ thống đã phát sinh 5 lỗi kỹ thuật từ mức độ hạ tầng triển khai (DevOps) đến bố cục giao diện (CSS) và logic phá hủy DOM (JavaScript).

| Mã Lỗi | Thành Phần Bị Ảnh Hưởng | Mức Độ | Trạng Thái | Mô Tả Tóm Tắt |
| :--- | :--- | :---: | :---: | :--- |
| **BUG-01** | Railway Dashboard / GitHub App | High | **Đã xử lý** | Báo đỏ `❌ Could not load branches.Retry` khi thêm service Math5. |
| **BUG-02** | `public/assets/js/pages/index.js` | Medium | **Đã xử lý** | Khối bài được giao bị dàn ngang tràn viền màn hình, phẳng dẹt, chèn sai vị trí. |
| **BUG-03** | `sidebar.js`, `app.css`, `index.html` | High | **Đã xử lý** | Không hiển thị thanh Sidebar dọc (Navigation Rail) chuẩn Vườn Toán 3. |
| **BUG-04** | `index.html`, `seed.json`, assets | Low | **Đã xử lý** | Nhầm lẫn tên cô giáo (*Cô Thu Hà 3A* thay vì *Cô Hoàng Hương 3A2*) và thiếu ảnh cục bộ. |
| **BUG-05** | `public/assets/js/pages/leaderboard.js` | **Critical** | **Đã xử lý** | Giao diện hiện ra 1 giây rồi bị xóa sạch, màn hình trắng tinh, Footer nhảy lên đỉnh. |

---

## LỖI 1: RAILWAY KHÔNG TẢI ĐƯỢC NHÁNH GITHUB (Could not load branches)

### 1. Triệu chứng (Symptoms)
- Trên giao diện Canvas của Railway (Project `stellar-balance`), khi tạo Service mới trỏ về GitHub repo `fossbk-spec/Math5`:
  - Khung `Source Repo` bị viền đỏ cảnh báo.
  - Mục `Branch connected to production` báo lỗi màu đỏ: `❌ Could not load branches.Retry`.
  - Nút `Deploy` bị kẹt ở thanh nháp `Apply 3 changes` và không thể pull mã nguồn để build Docker.

### 2. Nguyên nhân kỹ thuật (Root Cause)
- Railway tích hợp với GitHub thông qua **Railway GitHub App**.
- Khi cấp quyền trước đó cho dự án `hoang-mai-math`, tài khoản cá nhân `fossbk-spec` chỉ chọn cấp quyền ở chế độ **"Only select repositories"** và chỉ tích chọn `hoang-mai-math`.
- Khi Math5 được tạo mới trên GitHub, Railway App chưa có quyền đọc (Read access) repo `fossbk-spec/Math5`, dẫn đến GitHub API trả về mã lỗi `404 Not Found` hoặc `403 Forbidden` khi Railway truy vấn danh sách branches.

### 3. Phương án xử lý (Fixing Steps)
1. **Cấp quyền GitHub App:**
   - Truy cập [github.com/settings/installations](https://github.com/settings/installations) $\rightarrow$ Bấm nút **Configure** cạnh ứng dụng **Railway**.
   - Tại mục **Repository access**: Chọn **`All repositories`** (hoặc tích chọn thêm `Math5`) $\rightarrow$ Bấm **Save**.
2. **Khởi tạo lại Service trên Railway:**
   - Xóa bỏ service `Math5` đang ở trạng thái nháp kẹt (`Danger Zone` $\rightarrow$ `Delete Service`).
   - Bấm `+ New` $\rightarrow$ `GitHub Repo` $\rightarrow$ chọn `fossbk-spec/Math5` (hệ thống sẽ tự nhận diện nhánh `main` và `Dockerfile` ngay lập tức).

---

## LỖI 2: KHỐI "BÀI ĐƯỢC GIAO" BỊ VỠ BỐ CỤC & TRÀN MÉP MÀN HÌNH

### 1. Triệu chứng (Symptoms)
- Khi học sinh đăng nhập vào trang chủ (`index.html`), khối `📋 Bài được giao` hiển thị dạng thanh màu xám nhạt dẹt lép, kéo dài sát mép trái và mép phải màn hình (tràn viền 100% viewport width).
- Khối này bị chèn vào giữa tiêu đề *"Lộ Trình Bản Đồ Khám Phá Bài Học"* và lưới các thẻ bài học (Bài 9, 10, 11), làm đứt gãy luồng nhìn.
- Không có nút hành động (CTA), không có hiệu ứng viền nổi xúc giác 3D.

### 2. Nguyên nhân kỹ thuật (Root Cause)
- Trong file `public/assets/js/pages/index.js`, đoạn mã render thẻ bài được giao:
  ```javascript
  const card = document.createElement('section');
  card.className = 'rounded-3xl bg-surface-container-lowest shadow-sm p-5 mb-6';
  ...
  anchor.insertAdjacentElement('beforebegin', card);
  ```
- **Thiếu container layout:** Phần tử `<section>` này được chèn trực tiếp vào `<main>` mà không có các class giới hạn chiều rộng và căn lề như các section khác (`w-full px-gutter-mobile lg:px-margin max-w-7xl mx-auto`).
- **Chọn sai anchor:** `anchor` là section chứa grid bài học, nằm ngay sau section tiêu đề của lộ trình, khiến khối bài giao bị chèn xen vào giữa tiêu đề và nội dung của cùng một khối chức năng.

### 3. Phương án xử lý (Fixing Code)
- Tệp chỉnh sửa: [public/assets/js/pages/index.js](file:///c:/Antigravity/Math5/public/assets/js/pages/index.js)
- Thêm container bọc chuẩn, đổi vị trí chèn lên trước section Lộ Trình, bổ sung thiết kế 3D Tactile Pop:
```javascript
// Tìm vị trí chèn: Ưu tiên trước khối Lộ Trình Bản Đồ
const roadmapSec = [...document.querySelectorAll('section')].find(s => s.textContent.includes('Lộ Trình Bản Đồ'));
const anchor = roadmapSec || document.querySelector('[data-lesson-card]')?.closest('section');
if (!anchor) return;

const card = document.createElement('section');
card.className = 'w-full px-gutter-mobile lg:px-margin max-w-7xl mx-auto py-3';
card.innerHTML = `
  <div class="rounded-3xl bg-surface-container-lowest p-5 lg:p-6 shadow-[0_6px_0_0_#d5e5d7,0_16px_28px_-6px_rgba(0,97,39,0.1)] border-2 border-primary/20 flex flex-col gap-4">
    <!-- Header có icon, tiêu đề và badge số lượng nhiệm vụ -->
    ...
    <!-- Từng phiếu bài có tag hạn nộp, tag trạng thái và nút 3D: Vào làm bài -->
    <button type="button" data-assignment-set="${esc(a.setId)}" class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-on-primary shadow-[0_3px_0_0_#00471c] active:translate-y-0.5 active:shadow-none font-headline-sm text-label-sm">
      <span class="material-symbols-outlined text-[18px]">play_arrow</span>
      <span>${isDone ? 'Làm lại bài' : 'Vào làm bài'}</span>
    </button>
  </div>
`;
anchor.insertAdjacentElement('beforebegin', card);
```

---

## LỖI 3: THIẾU THANH SIDEBAR DỌC (NAVIGATION RAIL) GIỐNG TRANG GỐC

### 1. Triệu chứng (Symptoms)
- Math5 ban đầu sử dụng thanh `<header>` ngang dày cố định trên cùng màn hình.
- Trong khi đó, bản mẫu chuẩn [vuon-toan-3.onrender.com](https://vuon-toan-3.onrender.com/index.html) sử dụng thanh **Sidebar dọc bên trái (Navigation Rail)** dạng Icon-only với logo trường, các icon chức năng, huy hiệu sao, avatar và nút đăng xuất ở đáy.
- Trên trang Math5 không hề có thanh Sidebar dọc này.

### 2. Nguyên nhân kỹ thuật (Root Cause)
- File `public/assets/js/components/sidebar.js` ban đầu chỉ định nghĩa bản đồ định tuyến (`window.MathApp.routes`) mà không có logic render UI.
- Thư viện Tailwind CSS trên Math5 được nạp qua CDN (`<script src="https://cdn.tailwindcss.com"></script>`). Tailwind CDN chỉ quét các class tĩnh có sẵn trong HTML ban đầu. Khi Sidebar được tạo động bằng JS với các class như `hidden md:flex w-16 fixed ...`, Tailwind không sinh kịp CSS tương ứng, khiến phần tử bị rơi vào trạng thái ẩn (`display: none`).

### 3. Phương án xử lý (Fixing Steps)
1. **Viết component hoàn chỉnh cho Sidebar:** [public/assets/js/components/sidebar.js](file:///c:/Antigravity/Math5/public/assets/js/components/sidebar.js)
   - Khởi tạo `window.MathApp.components.Sidebar = { init(user), render(user), renderMobileNav() }`.
   - Cung cấp đủ 6 trạm điều hướng: *Trang Chủ, Mục Lục SGK, Luyện Tập, Đấu Trường Trò Chơi, Bảng Xếp Hạng, Góc Thầy Cô*.
   - Khối tiện ích đáy: Huy hiệu sao tích lũy `⭐`, Avatar học sinh có tooltip tên/lớp, Nút Đăng xuất (`logout`).
2. **Định nghĩa CSS thuần độc lập (Standalone CSS):** [public/assets/css/app.css](file:///c:/Antigravity/Math5/public/assets/css/app.css)
   ```css
   #app-sidebar {
     position: fixed !important;
     left: 0 !important; top: 0 !important; bottom: 0 !important;
     z-index: 50 !important; width: 72px !important;
     background-color: #ffffff !important;
     border-right: 1px solid #e1e3e1 !important;
     box-shadow: 2px 0 16px rgba(0, 97, 39, 0.06) !important;
     display: flex !important; flex-direction: column !important;
     align-items: center !important; justify-content: space-between !important;
     padding: 16px 8px !important; box-sizing: border-box !important;
   }
   @media (min-width: 768px) {
     body.has-sidebar main, body.has-sidebar footer { padding-left: 72px !important; }
     body.has-sidebar > header { display: none !important; }
   }
   @media (max-width: 767px) {
     #app-sidebar { display: none !important; }
     #app-mobile-nav { display: flex !important; }
     body.has-sidebar main { padding-bottom: 68px !important; }
   }
   ```
3. **Thêm thẻ tĩnh trực tiếp vào HTML:**
   - Bổ sung `<aside id="app-sidebar"></aside>` ngay sau thẻ `<body>` trong [index.html](file:///c:/Antigravity/Math5/public/index.html) và [leaderboard.html](file:///c:/Antigravity/Math5/public/leaderboard.html).

---

## LỖI 4: KHÔNG ĐỒNG BỘ LOGO TRƯỜNG & THÔNG TIN GIÁO VIÊN TỪ VUON-TOAN-3

### 1. Triệu chứng (Symptoms)
- Trang Math5 hiển thị tên giáo viên cũ là: *"Cô Thu Hà (GV Chủ nhiệm 3A)"*.
- Trong khi bản gốc `vuon-toan-3.onrender.com` hiển thị chuẩn: **"Cô Hoàng Hương (GV Chủ nhiệm 3A2)"**.
- Logo trường trên Sidebar bị thiếu hoặc dùng link ảnh ngoài dễ bị chặn CORS/404.

### 2. Phương án xử lý (Fixing Steps)
1. **Tải tài nguyên trực tiếp từ `vuon-toan-3.onrender.com` về lưu trữ cục bộ:**
   - Logo trường: [public/assets/img/logo-hoang-mai.png](file:///c:/Antigravity/Math5/public/assets/img/logo-hoang-mai.png) (43.7 KB).
   - Ảnh chân dung cô giáo: [public/assets/img/teacher-hoang-huong.jpg](file:///c:/Antigravity/Math5/public/assets/img/teacher-hoang-huong.jpg) (210 KB).
   - Avatar học sinh: [public/assets/img/student-avatar.jpg](file:///c:/Antigravity/Math5/public/assets/img/student-avatar.jpg) (41.1 KB).
2. **Cập nhật giao diện:**
   - [public/index.html](file:///c:/Antigravity/Math5/public/index.html): Đổi thẻ lời dặn thành *"Lời dặn của Cô Hoàng Hương (GV Chủ nhiệm 3A2)"*, gán ảnh `teacher-hoang-huong.jpg`.
   - [public/assets/js/components/sidebar.js](file:///c:/Antigravity/Math5/public/assets/js/components/sidebar.js): Trỏ logo và avatar về thư mục cục bộ `assets/img/`.
3. **Đồng bộ cơ sở dữ liệu mẫu:**
   - [data/seed.json](file:///c:/Antigravity/Math5/data/seed.json): Cập nhật tài khoản `giaovien01` có `fullName`: `"Cô Hoàng Hương"`, `className`: `"3A2"`.

---

## LỖI 5: HIỆN TƯỢNG "GIAO DIỆN 1 HIỆN RA RỒI BIẾN MẤT, MÀN HÌNH TRẮNG TINH"

### 1. Triệu chứng (Symptoms)
- Khi truy cập trang [https://math5-production.up.railway.app/leaderboard.html](https://math5-production.up.railway.app/leaderboard.html):
  - **Giây đầu tiên (Giao diện 1):** Toàn bộ giao diện Bảng Xếp Hạng & Vinh Danh Dũng Sĩ Toán Học (Bục 3D Top 3: Trần Bảo Trâm, Nguyễn Bảo Nam, Lê Gia Huy và danh sách thi đua) hiện ra đầy đủ cùng Sidebar bên trái.
  - **Sau 1 giây (Giao diện 2):** Toàn bộ nội dung chính biến mất hoàn toàn, để lại một màn hình trắng tinh, thanh Footer bị kéo giật ngược lên tận đỉnh trang (như ảnh người dùng phản hồi).

### 2. Nguyên nhân kỹ thuật (Root Cause)
- Đây là lỗi logic thao tác DOM mang tính phá hủy (Destructive DOM manipulation) trong file [public/assets/js/pages/leaderboard.js](file:///c:/Antigravity/Math5/public/assets/js/pages/leaderboard.js).
- Đoạn mã ban đầu:
  ```javascript
  document.addEventListener('mathapp:user-ready', async (e) => {
    const { leaderboard } = await window.MathAPI.get('/api/leaderboard');
    ...
    // TÌM PHẦN TỬ ĐỂ THAY THẾ:
    const anchor = [...document.querySelectorAll('h2, h3, div, span')].find(el => /BẢNG VÀNG TUẦN/.test(el.textContent) && el.children.length <= 3);
    const oldSection = anchor && (anchor.closest('section') || anchor.closest('div[class*="max-w-7xl"]'));
    if (oldSection) { 
      oldSection.replaceWith(section); // <-- NGUYÊN NHÂN CHÍNH
    }
    const oldList = [...document.querySelectorAll('h2, h3, div, span')].find(el => /Danh Sách Dũng Sĩ Tiếp Theo/.test(el.textContent) && el.children.length <= 3);
    const oldListSection = oldList && (oldList.closest('section') || oldList.parentElement);
    if (oldListSection && oldListSection !== section) {
      oldListSection.style.display = 'none'; // <-- NGUYÊN NHÂN PHỤ
    }
  });
  ```
- **Cơ chế gây lỗi:**
  1. Thẻ chứa chữ *"BẢNG VÀNG TUẦN 7"* trong HTML gốc không nằm trong thẻ `<section>` nào cả (dùng thẻ `<div>`). Do đó `anchor.closest('section')` trả về `null`.
  2. Biểu thức tiếp theo `anchor.closest('div[class*="max-w-7xl"]')` đã tìm ngược lên và chọn trúng **thẻ `div` container bao bọc TOÀN BỘ trang** (chứa cả Tiêu đề, Bộ lọc, Top 3 Podium và Danh sách).
  3. Lệnh `oldSection.replaceWith(section)` đã **XÓA SỔ TOÀN BỘ NỘI DUNG TRANG** để thay bằng 1 thẻ `section` duy nhất.
  4. Ngay sau đó, dòng lệnh `oldListSection.style.display = 'none'` tiếp tục tìm và ẩn nốt phần tử cha còn lại.
  5. Kết quả: Toàn bộ nội dung bên trong `<main>` bị biến mất hoặc co về chiều cao 0px, khiến màn hình trắng tinh và kéo Footer lên tận đỉnh!

### 3. Phương án xử lý (Fixing Code)
- Tệp chỉnh sửa: [public/assets/js/pages/leaderboard.js](file:///c:/Antigravity/Math5/public/assets/js/pages/leaderboard.js)
- **Quy tắc sửa:** Tuyệt đối KHÔNG xóa phần tử gốc bằng `replaceWith` hoặc `style.display = 'none'`. Chỉ cập nhật giá trị số liệu vào DOM có sẵn:
```javascript
/* Trang Bảng Xếp Hạng: Cập nhật dữ liệu thật mượt mà, an toàn, giữ nguyên 100% giao diện 3D xúc giác */
document.addEventListener('mathapp:user-ready', async (e) => {
  try {
    const res = await window.MathAPI.get('/api/leaderboard');
    const leaderboard = res && res.leaderboard ? res.leaderboard : [];
    if (!leaderboard.length) return;

    const totalStars = leaderboard.reduce((s, r) => s + (r.total_stars || 0), 0);

    // Cập nhật 2 thẻ thống kê tổng sao & số bạn tranh tài
    document.querySelectorAll('p, div, span').forEach((el) => {
      const text = el.textContent.trim();
      if (text === 'Tổng Ngôi Sao') {
        const val = el.parentElement && el.parentElement.querySelector('.font-headline-sm, .font-headline-md, .font-headline-lg');
        if (val) val.innerHTML = `${totalStars.toLocaleString('vi-VN')} ★`;
      }
      if (text === 'Dũng Sĩ Tranh Tài') {
        const val = el.parentElement && el.parentElement.querySelector('.font-headline-sm, .font-headline-md, .font-headline-lg');
        if (val) val.textContent = `${leaderboard.length} Bạn`;
      }
    });

    // Cập nhật thông tin vị trí của học sinh ở thanh ghim góc dưới màn hình
    const myRow = leaderboard.find(r => r.isMe);
    if (myRow) {
      document.querySelectorAll('span, p, div').forEach(el => {
        if (/Vị trí hiện tại:/.test(el.textContent)) {
          el.innerHTML = `Vị trí hiện tại: <strong>Hạng ${myRow.rank} (Lớp ${myRow.class_name || '3A2'})</strong> <span class="px-2 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed text-xs font-bold">${myRow.total_stars.toLocaleString('vi-VN')} ★</span>`;
        }
      });
    }
  } catch (err) {
    console.warn('Giữ nguyên giao diện bảng xếp hạng mẫu:', err.message);
  }
});
```

---

## 7. BẢNG TỔNG HỢP FILE ĐÃ CHỈNH SỬA & HƯỚNG DẪN KIỂM THỬ CHO CODEX

### 1. Danh sách tệp tin đã cập nhật trong kho Git
| Đường dẫn tệp | Mô tả thay đổi | Commit liên quan |
| :--- | :--- | :---: |
| `public/assets/css/app.css` | Thêm quy tắc CSS độc lập 100% cho `#app-sidebar` & `#app-mobile-nav`, căn lề responsive cho `main`/`footer`. | `2aaa1ff` |
| `public/assets/js/components/sidebar.js` | Viết component Sidebar điều hướng dọc, trỏ logo và avatar về ảnh cục bộ, tooltip nổi bên phải. | `3352ec3`, `6d75be9` |
| `public/assets/js/core/app.js` | Gọi `Sidebar.init()` và `Sidebar.updateUser(user)` khi khởi tạo trang. | `3352ec3` |
| `public/assets/js/pages/index.js` | Chuẩn hóa max-width và phong cách 3D tactile pop cho khối *Bài được giao*. | `b10296b` |
| `public/assets/js/pages/leaderboard.js` | **Xóa bỏ triệt để lệnh replaceWith và display='none'**, sửa dứt điểm lỗi màn hình trắng. | `3de0f5d` |
| `public/index.html` | Thêm `<aside id="app-sidebar"></aside>`, cập nhật ảnh & tên Cô Hoàng Hương (3A2), gắn cache-busting `?v=3`. | `6d75be9`, `2aaa1ff` |
| `public/leaderboard.html` | Thêm `<aside id="app-sidebar"></aside>`, gắn cache-busting `?v=3`. | `2aaa1ff` |
| `data/seed.json` | Cập nhật tên giáo viên `fullName: "Cô Hoàng Hương"`, `className: "3A2"`. | `6d75be9` |
| `public/assets/img/*` | Bổ sung 3 file ảnh gốc: `logo-hoang-mai.png`, `teacher-hoang-huong.jpg`, `student-avatar.jpg`. | `6d75be9` |

### 2. Hướng dẫn kiểm thử cho Codex / QA
1. **Kiểm tra Trang Chủ (`index.html`):**
   - Truy cập: `https://math5-production.up.railway.app/index.html`
   - Xác nhận:
     - Bên trái có Sidebar dọc màu trắng, trên cùng có logo tròn Hoàng Mai, dưới cùng có sao và avatar.
     - Dòng lời dặn giáo viên ghi rõ: **"Lời dặn của Cô Hoàng Hương (GV Chủ nhiệm 3A2)"** kèm ảnh cô giáo.
     - Khối *"Bài được giao"* (nếu có bài) được căn giữa trong khung `max-w-7xl`, viền nổi 3D, có nút *"Vào làm bài"*, không bị tràn viền màn hình.
2. **Kiểm tra Trang Bảng Xếp Hạng (`leaderboard.html`):**
   - Truy cập: `https://math5-production.up.railway.app/leaderboard.html`
   - Nhấn `Ctrl + F5` (xóa cache).
   - Xác nhận:
     - Giao diện bục vinh danh Top 3 (Trần Bảo Trâm, Nguyễn Bảo Nam, Lê Gia Huy) **hiển thị cố định và ổn định, KHÔNG bị biến mất sau 1 giây**.
     - Sidebar dọc bên trái hiển thị bình thường.
     - Không có màn hình trắng, không bị đẩy Footer lên đỉnh.
