/* Trang Bảng Xếp Hạng (Đợt 2): render 100% từ /api/leaderboard (dữ liệu thật trong DB).
 * Khối xếp hạng tĩnh cũ được ẩn đi và thay bằng dữ liệu thật ngay khi tải xong. */
document.addEventListener('mathapp:user-ready', async (e) => {
  const me = e.detail;
  try {
    const { leaderboard } = await window.MathAPI.get('/api/leaderboard');
    const totalStars = leaderboard.reduce((s, r) => s + r.total_stars, 0);

    // Cập nhật 2 thẻ thống kê đầu trang
    document.querySelectorAll('p, div, span').forEach((el) => {
      if (/^Tổng Ngôi Sao$/.test(el.textContent.trim())) {
        const val = el.parentElement && el.parentElement.querySelector('.font-headline-md, .font-headline-lg');
        if (val) val.innerHTML = `${totalStars.toLocaleString('vi-VN')} <span class="text-tertiary">★</span>`;
      }
      if (/^Dũng Sĩ Tranh Tài$/.test(el.textContent.trim())) {
        const val = el.parentElement && el.parentElement.querySelector('.font-headline-md, .font-headline-lg');
        if (val) val.textContent = `${leaderboard.length} Bạn`;
      }
    });

    const medal = ['🥇', '🥈', '🥉'];
    const myRow = leaderboard.find(r => r.isMe);
    const rows = leaderboard.map(r => `
      <tr class="${r.isMe ? 'bg-secondary-fixed/50 font-bold' : 'hover:bg-surface-container-low/60'} transition-colors">
        <td class="py-3 px-4 font-headline-sm">${medal[r.rank - 1] || r.rank}</td>
        <td class="py-3 px-4"><span class="font-headline-sm text-label-md">${r.full_name}</span>
          <span class="block text-[12px] text-on-surface-variant font-label-sm">Lớp ${r.class_name || ''}${r.isMe ? ' • Em' : ''}</span></td>
        <td class="py-3 px-3 text-center">${r.attempts_count} lượt</td>
        <td class="py-3 px-3 text-center">${r.avg_score == null ? '—' : r.avg_score + '%'}</td>
        <td class="py-3 px-4 text-right font-headline-sm text-tertiary">${r.total_stars.toLocaleString('vi-VN')} ★</td>
      </tr>`).join('');

    const section = document.createElement('section');
    section.className = 'w-full px-gutter-mobile lg:px-margin max-w-7xl mx-auto py-space-lg';
    section.innerHTML = `
      <div class="rounded-3xl bg-surface-container-lowest shadow-[0_10px_30px_rgba(0,97,39,0.08)] overflow-hidden">
        <div class="bg-primary/10 px-6 py-4 flex flex-wrap items-center justify-between gap-2">
          <h2 class="font-headline-md text-headline-md text-primary flex items-center gap-2">
            <span class="material-symbols-outlined">leaderboard</span> Bảng Xếp Hạng Thật — Cập Nhật Từ Hệ Thống
          </h2>
          ${myRow ? `<span class="px-3 py-1.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-headline-sm text-label-sm shadow-sm">
            Vị trí của em: Hạng ${myRow.rank} • ${myRow.total_stars.toLocaleString('vi-VN')} ★</span>` : ''}
        </div>
        <div class="overflow-x-auto">
          <table class="w-full min-w-[640px] font-body-sm text-body-sm">
            <thead><tr class="bg-surface-container-low text-left text-on-surface-variant font-label-md text-label-sm uppercase tracking-wider">
              <th class="py-3.5 px-4">Hạng</th><th class="py-3.5 px-4">Học Sinh</th>
              <th class="py-3.5 px-3 text-center">Lượt Làm Bài</th><th class="py-3.5 px-3 text-center">Điểm TB</th>
              <th class="py-3.5 px-4 text-right">Tổng Sao</th></tr></thead>
            <tbody class="divide-y divide-surface-container-low">${rows || '<tr><td colspan="5" class="py-6 text-center">Chưa có dữ liệu.</td></tr>'}</tbody>
          </table>
        </div>
        <p class="px-6 py-3 font-label-sm text-label-sm text-on-surface-variant">Sao được cộng khi làm bài luyện tập, kiểm tra và chơi mini-game (chỉ tính phần vượt kỷ lục cũ của em).</p>
      </div>`;

    // Ẩn 2 khối tĩnh cũ (Top 3 + danh sách hạng 4-15) và chèn bảng thật vào đúng vị trí
    const anchor = [...document.querySelectorAll('h2, h3, div, span')].find(el => /BẢNG VÀNG TUẦN/.test(el.textContent) && el.children.length <= 3);
    const oldSection = anchor && (anchor.closest('section') || anchor.closest('div[class*="max-w-7xl"]'));
    if (oldSection) { oldSection.replaceWith(section); } else { (document.querySelector('main') || document.body).appendChild(section); }
    const oldList = [...document.querySelectorAll('h2, h3, div, span')].find(el => /Danh Sách Dũng Sĩ Tiếp Theo/.test(el.textContent) && el.children.length <= 3);
    const oldListSection = oldList && (oldList.closest('section') || oldList.parentElement);
    if (oldListSection && oldListSection !== section) oldListSection.style.display = 'none';
  } catch (err) { console.warn('Không tải được bảng xếp hạng:', err.message); }
});
