/* Trang Bảng Xếp Hạng: render từ /api/leaderboard vào #leaderboard-root.
 * Mọi điểm neo trong HTML đều dùng ID/data-* cố định (stat-*, my-rank-*,
 * data-leaderboard-time/scope, #leaderboard-category, data-badge) nên script
 * không tìm phần tử theo nội dung chữ và không ẩn nhầm <main> như bản cũ. */
document.addEventListener('mathapp:user-ready', async () => {
  const root = document.getElementById('leaderboard-root');
  if (!root) return;
  root.innerHTML = '<p class="text-center font-body-md text-body-md text-on-surface-variant py-8">Đang tải bảng xếp hạng...</p>';

  const state = { time: 'week', scope: 'school', category: 'stars' };
  let rowsData = [];
  let myRow = null;

  const fmt = (value) => Number(value || 0).toLocaleString('vi-VN');
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));

  function visibleRows() {
    let rows = [...rowsData];
    if (state.scope === 'class-3a2') rows = rows.filter((row) => row.class_name === '3A2' || row.class_name === '3A');
    if (state.category === 'exam') {
      rows.sort((a, b) => (b.avg_score ?? -1) - (a.avg_score ?? -1) || b.total_stars - a.total_stars);
    } else if (state.category === 'games') {
      rows.sort((a, b) => Number(b.game_plays || 0) - Number(a.game_plays || 0) || b.total_stars - a.total_stars);
    } else {
      rows.sort((a, b) => b.total_stars - a.total_stars || String(a.full_name).localeCompare(String(b.full_name), 'vi'));
    }
    return rows.map((row, index) => ({ ...row, displayRank: index + 1 }));
  }

  function categoryLabel() {
    if (state.category === 'exam') return 'Xếp hạng theo điểm trung bình bài tập/kiểm tra';
    if (state.category === 'games') return 'Xếp hạng theo số lượt chơi mini-game';
    return 'Xếp hạng theo tổng Sao tích lũy';
  }

  function renderTable() {
    const rows = visibleRows();
    const medal = ['🥇', '🥈', '🥉'];
    const body = rows.map((row) => `
      <tr data-class-name="${esc(row.class_name || '')}" class="${row.isMe ? 'bg-secondary-fixed/50 font-bold' : 'hover:bg-surface-container-low/60'} transition-colors">
        <td class="py-3.5 px-4 font-headline-sm text-center text-label-md">${medal[row.displayRank - 1] || row.displayRank}</td>
        <td class="py-3.5 px-4">
          <span class="font-headline-sm text-label-md text-on-surface">${esc(row.full_name)}</span>
          <span class="block text-[12px] text-on-surface-variant font-label-sm">Lớp ${esc(row.class_name || '3A2')}${row.isMe ? ' • Em' : ''}</span>
        </td>
        <td class="py-3.5 px-3 text-center font-body-sm">${fmt(row.attempts_count)} lượt</td>
        <td class="py-3.5 px-3 text-center font-headline-sm text-primary">${row.avg_score == null ? '—' : `${row.avg_score}%`}</td>
        <td class="py-3.5 px-4 text-right font-headline-sm text-tertiary">${fmt(row.total_stars)} ★</td>
      </tr>`).join('');

    root.innerHTML = `
      <div class="rounded-3xl bg-surface-container-lowest shadow-[0_10px_30px_rgba(0,97,39,0.08)] overflow-hidden">
        <div class="bg-primary/10 px-6 py-4 flex flex-wrap items-center justify-between gap-2 border-b border-outline-variant/20">
          <div>
            <h2 class="font-headline-md text-headline-sm text-primary flex items-center gap-2">
              <span class="material-symbols-outlined">leaderboard</span> Bảng Xếp Hạng Đầy Đủ — Cập Nhật Từ Hệ Thống
            </h2>
            <p class="font-label-sm text-label-sm text-on-surface-variant mt-1">${categoryLabel()}</p>
          </div>
          ${myRow ? `<span class="px-3.5 py-1.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-headline-sm text-label-sm shadow-sm flex items-center gap-1">
            <span class="material-symbols-outlined text-[16px]">stars</span>
            Vị trí của em: Hạng ${myRow.rank} • ${fmt(myRow.total_stars)} ★</span>` : ''}
        </div>
        <div class="overflow-x-auto">
          <table class="w-full min-w-[640px] font-body-sm text-body-sm">
            <thead>
              <tr class="bg-surface-container-low text-left text-on-surface-variant font-label-md text-label-sm uppercase tracking-wider">
                <th class="py-3.5 px-4 text-center w-16">Hạng</th>
                <th class="py-3.5 px-4">Học Sinh</th>
                <th class="py-3.5 px-3 text-center w-28">Lượt Làm Bài</th>
                <th class="py-3.5 px-3 text-center w-24">Điểm TB</th>
                <th class="py-3.5 px-4 text-right w-32">Tổng Sao</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-surface-container-low">
              ${body || '<tr><td colspan="5" class="py-8 text-center text-on-surface-variant">Chưa có dữ liệu bảng xếp hạng.</td></tr>'}
            </tbody>
          </table>
        </div>
        <div class="p-4 bg-surface-container-low/50 border-t border-outline-variant/20">
          <p class="font-label-sm text-[12px] text-on-surface-variant">Mỗi học sinh bắt đầu với 10 Sao vốn. Sao làm bài luyện tập, kiểm tra và mini-game được cộng thêm vào thành tích thi đua toàn trường.</p>
        </div>
      </div>`;
  }

  function updateMyCard() {
    const myCard = document.getElementById('my-rank-card');
    if (!myCard) return;
    if (!myRow) { myCard.style.display = 'none'; return; }
    myCard.style.display = '';
    const badge = document.getElementById('my-rank-badge');
    if (badge) badge.textContent = `#${myRow.rank}`;
    const rankText = document.getElementById('my-rank-text');
    if (rankText) rankText.textContent = `Vị trí hiện tại: Hạng ${myRow.rank}${myRow.class_name ? ` (Lớp ${myRow.class_name})` : ''}`;
    const starsBadge = document.getElementById('my-stars-badge');
    if (starsBadge) starsBadge.textContent = `${fmt(myRow.total_stars)} ★`;
    const message = document.getElementById('my-rank-message');
    if (message) {
      if (myRow.rank <= 1) {
        message.textContent = 'Em đang dẫn đầu bảng xếp hạng! Hãy tiếp tục luyện tập để giữ vững ngôi vị nhé!';
      } else {
        const above = rowsData[myRow.rank - 2];
        const gap = Math.max(0, Number(above?.total_stars || 0) - Number(myRow.total_stars || 0));
        message.innerHTML = `Cách Hạng ${myRow.rank - 1} chỉ <strong class="text-tertiary font-bold">${fmt(gap)} Sao</strong>! Làm thêm bài tập hoặc thắng mini-game để vươn lên nhé!`;
      }
    }
  }

  function updateBadges() {
    const progress = document.getElementById('badge-progress');
    const attempts = Number(myRow?.attempts_count || 0);
    const gamePlays = Number(myRow?.game_plays || 0);
    const avg = myRow?.avg_score == null ? null : Number(myRow.avg_score);
    const definitions = [
      { id: 'ong-cham-chi', achieved: !!myRow && attempts >= 1, locked: 'Chưa có lượt làm bài' },
      { id: 'hiep-si-phep-chia', achieved: !!myRow && avg != null && avg >= 50, locked: avg == null ? 'Chưa có điểm TB' : `Điểm TB: ${avg}%` },
      { id: 'giai-nhanh-than-toc', achieved: !!myRow && gamePlays >= 1, locked: 'Chưa chơi mini-game' },
      { id: 'sieu-cuu-chuong', achieved: !!myRow && attempts >= 10, locked: `Còn ${Math.max(0, 10 - attempts)} lượt nữa` },
      { id: 'dai-su-hinh-hoc', achieved: false, locked: 'Chưa mở' },
      { id: 'cup-vang-vuon-toan', achieved: !!myRow && myRow.rank === 1, locked: 'Cần đạt Hạng 1' },
    ];
    let earned = 0;
    definitions.forEach((def) => {
      const card = document.querySelector(`[data-badge="${def.id}"]`);
      const status = document.getElementById(`badge-status-${def.id}`);
      if (def.achieved) earned += 1;
      if (card) card.classList.toggle('opacity-60', !def.achieved);
      if (status) {
        status.textContent = def.achieved ? 'Đã đạt ✓' : def.locked;
        status.classList.toggle('text-primary', def.achieved);
        status.classList.toggle('font-bold', def.achieved);
        status.classList.toggle('text-on-surface-variant', !def.achieved);
      }
    });
    if (progress) progress.textContent = myRow ? `Đã thu thập: ${earned} / 6 huy hiệu` : 'Đã thu thập: — / 6 huy hiệu';
  }

  function setActive(groupSelector, button) {
    document.querySelectorAll(groupSelector).forEach((item) => {
      item.classList.remove('bg-primary', 'text-on-primary', 'font-headline-sm', 'shadow-[0_3px_0_0_#005320]');
      item.classList.add('text-on-surface-variant', 'font-label-md');
    });
    button.classList.add('bg-primary', 'text-on-primary', 'font-headline-sm', 'shadow-[0_3px_0_0_#005320]');
    button.classList.remove('text-on-surface-variant', 'font-label-md');
  }

  function bindFilters() {
    document.querySelectorAll('[data-leaderboard-time]').forEach((button) => {
      button.addEventListener('click', () => {
        state.time = button.dataset.leaderboardTime || 'week';
        setActive('[data-leaderboard-time]', button);
      });
    });
    document.querySelectorAll('[data-leaderboard-scope]').forEach((button) => {
      button.addEventListener('click', () => {
        state.scope = button.dataset.leaderboardScope || 'school';
        setActive('[data-leaderboard-scope]', button);
        renderTable();
      });
    });
    const category = document.getElementById('leaderboard-category');
    if (category) category.addEventListener('change', () => { state.category = category.value; renderTable(); });
    const practice = document.getElementById('my-rank-practice-btn');
    if (practice) practice.addEventListener('click', () => { location.href = 'exercise.html'; });
  }

  try {
    const { leaderboard } = await window.MathAPI.get('/api/leaderboard');
    rowsData = Array.isArray(leaderboard) ? leaderboard : [];
    myRow = rowsData.find((row) => row.isMe) || null;

    const statStars = document.getElementById('stat-total-stars');
    if (statStars) statStars.textContent = `${fmt(rowsData.reduce((sum, row) => sum + Number(row.total_stars || 0), 0))} ★`;
    const statStudents = document.getElementById('stat-total-students');
    if (statStudents) statStudents.textContent = `${rowsData.length} Bạn`;

    renderTable();
    updateMyCard();
    updateBadges();
    bindFilters();
  } catch (err) {
    console.warn('Không tải được bảng xếp hạng:', err.message);
    root.innerHTML = '<p class="text-center font-body-md text-body-md text-error py-8">Chưa tải được bảng xếp hạng. Em thử tải lại trang nhé!</p>';
    const myCard = document.getElementById('my-rank-card');
    if (myCard) myCard.style.display = 'none';
    updateBadges();
  }
});
