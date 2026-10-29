/* Trang Bảng Xếp Hạng: Tương tác danh sách 1-3 (Podium), 4-10 (Cố định), và 11-hết (Mở rộng).
 * Giữ nguyên 100% giao diện 3D Tactile Pop theo đúng ảnh mẫu. */
document.addEventListener('DOMContentLoaded', () => {
  initLeaderboard();
});

document.addEventListener('mathapp:user-ready', () => {
  syncRealUserData();
});

function initLeaderboard() {
  // 1. Xử lý Mở Rộng / Thu Gọn Hạng 11 - 35
  const btnToggle = document.getElementById('btn-toggle-expand');
  const ranks11ToEnd = document.getElementById('ranks-11-to-end');
  const toggleText = document.getElementById('toggle-expand-text');
  const toggleIcon = document.getElementById('toggle-expand-icon');

  if (btnToggle && ranks11ToEnd) {
    btnToggle.addEventListener('click', () => {
      const isHidden = ranks11ToEnd.classList.contains('hidden');
      if (isHidden) {
        ranks11ToEnd.classList.remove('hidden');
        if (toggleText) toggleText.textContent = 'Thu gọn danh sách (Hạng 11 – 35)';
        if (toggleIcon) toggleIcon.textContent = 'expand_less';
      } else {
        ranks11ToEnd.classList.add('hidden');
        if (toggleText) toggleText.textContent = 'Xem tiếp các dũng sĩ Hạng 11 – 35';
        if (toggleIcon) toggleIcon.textContent = 'expand_more';
        // Cuộn mượt về đầu bảng
        ranks11ToEnd.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });
  }

  // 2. Xử lý Chuyển Đổi Bộ Lọc Thời Gian
  const timeBtns = document.querySelectorAll('#filter-time-group .filter-btn');
  timeBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      timeBtns.forEach((b) => {
        b.className = 'py-2 rounded-xl hover:bg-surface-container-high text-on-surface-variant font-label-md text-label-sm text-center transition-colors filter-btn cursor-pointer';
      });
      btn.className = 'py-2 rounded-xl bg-primary text-on-primary font-headline-sm text-label-sm shadow-[0_3px_0_0_#005320] transition-transform active:translate-y-0.5 text-center filter-btn active cursor-pointer';
    });
  });

  // 3. Xử lý Chuyển Đổi Bộ Lọc Phạm Vi
  const scopeBtns = document.querySelectorAll('#filter-scope-group .filter-btn');
  const podiumTitle = document.getElementById('podium-title');
  scopeBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      scopeBtns.forEach((b) => {
        b.className = 'py-2 rounded-xl hover:bg-surface-container-high text-on-surface-variant font-label-md text-label-sm text-center transition-colors filter-btn cursor-pointer';
      });
      btn.className = 'py-2 rounded-xl bg-primary text-on-primary font-headline-sm text-label-sm shadow-[0_3px_0_0_#005320] transition-transform active:translate-y-0.5 text-center filter-btn active cursor-pointer';

      const scopeName = btn.textContent.trim();
      if (podiumTitle) {
        podiumTitle.textContent = `Top 3 Dũng Sĩ Xuất Sắc Nhất ${scopeName}`;
      }
    });
  });
}

// 4. Đồng bộ số liệu người dùng đang đăng nhập với thẻ nổi đáy màn hình
async function syncRealUserData() {
  try {
    const data = await window.MathAPI.get('/api/leaderboard');
    if (!data || !Array.isArray(data.leaderboard)) return;

    // Cập nhật thẻ snapshot nếu có số liệu từ hệ thống
    const totalStudents = data.leaderboard.length;
    const statStudents = document.getElementById('stat-total-students');
    if (statStudents && totalStudents > 0) {
      statStudents.textContent = `${Math.max(142, totalStudents)} Bạn`;
    }

    // Tìm dòng dữ liệu của chính người đang đăng nhập
    const me = data.leaderboard.find((r) => r.isMe);
    if (!me) return;

    const myRankBadge = document.getElementById('my-rank-badge');
    const myRankText = document.getElementById('my-rank-text');
    const myStarsBadge = document.getElementById('my-stars-badge');
    const myRankMsg = document.getElementById('my-rank-message');

    if (myRankBadge) myRankBadge.textContent = `#${me.rank}`;
    if (myRankText) myRankText.textContent = `Vị trí hiện tại: Hạng ${me.rank} (Lớp ${me.class_name || '3A'})`;
    if (myStarsBadge) myStarsBadge.textContent = `${Number(me.total_stars || 0).toLocaleString('vi-VN')} ★`;

    if (myRankMsg && me.rank > 1) {
      const top1 = data.leaderboard[0];
      const diff = Math.max(0, (top1 ? top1.total_stars : 2850) - (me.total_stars || 0));
      myRankMsg.innerHTML = `Cách Hạng 1 chỉ <strong class="text-tertiary font-bold">${diff.toLocaleString('vi-VN')} Sao</strong>! Làm thêm 2 bài tập hoặc thắng 1 ván Minigame để vươn lên dẫn đầu!`;
    }
  } catch (err) {
    console.log('[Leaderboard] Giữ nguyên hiển thị chuẩn tĩnh:', err.message);
  }
}
