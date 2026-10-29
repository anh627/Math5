/* Trang Bảng Xếp Hạng: Cập nhật dữ liệu thật mượt mà, an toàn, giữ nguyên 100% giao diện 3D xúc giác */
document.addEventListener('mathapp:user-ready', async (e) => {
  const me = e.detail;
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

    // Cập nhật thanh dũng sĩ của em ở bottom pill banner
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

