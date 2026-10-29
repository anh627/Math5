/* Logic riêng của trang index.html (tách từ HTML gốc, giữ nguyên hành vi) */
document.addEventListener('DOMContentLoaded', function () {
      const soundBtn = document.getElementById('soundToggle');
      let soundEnabled = true;

      if (soundBtn) {
        soundBtn.addEventListener('click', function () {
          soundEnabled = !soundEnabled;
          const icon = soundBtn.querySelector('.material-symbols-outlined');
          if (icon) {
            icon.textContent = soundEnabled ? 'volume_up' : 'volume_off';
          }
        });
      }

      // Add tactile audio/visual click response to chunky 3D buttons
      const buttons = document.querySelectorAll('button:not([disabled]), a[class*="shadow-"]');
      buttons.forEach(btn => {
        btn.addEventListener('click', function () {
          if (soundEnabled && window.AudioContext) {
            try {
              const ctx = new (window.AudioContext || window.webkitAudioContext)();
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.type = 'triangle';
              osc.frequency.setValueAtTime(520, ctx.currentTime);
              osc.frequency.exponentialRampToValueAtTime(780, ctx.currentTime + 0.08);
              gain.gain.setValueAtTime(0.12, ctx.currentTime);
              gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
              osc.connect(gain);
              gain.connect(ctx.destination);
              osc.start();
              osc.stop(ctx.currentTime + 0.08);
            } catch (e) {
              // Graceful fallback if audio context is blocked
            }
          }
        });
      });
    });

/* --- NÂNG CẤP ĐỢT 1: Thẻ bài học render từ API (/api/lessons) ---
 * Dữ liệu bài (tiêu đề, mô tả, điểm cao nhất, khóa/mở) lấy từ server + DB.
 * Thêm bài mới trong DB là trang chủ tự hiện, không cần sửa HTML này. */
document.addEventListener('mathapp:user-ready', async () => {
  try {
    const { lessons } = await window.MathAPI.get('/api/lessons');
    lessons.forEach((lesson) => {
      const card = document.querySelector(`[data-lesson-card="${lesson.id}"]`);
      if (!card) return;
      const title = card.querySelector('[data-lesson-title]');
      const desc = card.querySelector('[data-lesson-desc]');
      if (title) title.textContent = `Bài ${lesson.number}: ${lesson.title}`;
      if (desc) desc.textContent = lesson.description;
      // Cập nhật dòng điểm trong thẻ (nếu có)
      card.querySelectorAll('span, p').forEach((el) => {
        if (/^(Điểm|Điểm hiện tại):/.test(el.textContent.trim())) {
          el.innerHTML = el.innerHTML.replace(/Điểm( hiện tại)?:\s*[^<]*/, `Điểm${el.textContent.includes('hiện') ? ' hiện tại' : ''}: ${lesson.bestScore}/100`);
        }
      });
      const btn = [...card.querySelectorAll('button, a')].find((b) => /Bắt đầu học|Tiếp tục|Ôn lại|Chưa thể vào/.test(b.textContent));
      if (!btn) return;
      const set = (lesson.questionSets || [])[0];
      const go = () => {
        if (lesson.number === 15) location.href = 'exam.html';
        else if (set && set.id === 'phieu-bai-9-10') location.href = 'exercise.html';
        else if (set) location.href = `lesson.html?lesson=${lesson.id}&set=${set.id}`;
        else location.href = 'exercise.html';
      };
      if (lesson.locked) {
        btn.setAttribute('disabled', '');
        btn.classList.add('cursor-not-allowed');
      } else {
        btn.removeAttribute('disabled');
        btn.classList.remove('cursor-not-allowed', 'opacity-80');
        const label = btn.querySelector('span:last-child') || btn;
        if (/Chưa thể vào/.test(label.textContent)) label.textContent = 'Bắt đầu học';
        btn.addEventListener('click', go);
      }
    });
    // Tiến độ chủ đề trên banner
    const done = lessons.filter((l) => l.completed).length;
    document.querySelectorAll('span, p, div').forEach((el) => {
      if (/^\d+\/7 bài học$/.test(el.textContent.trim())) el.textContent = `${done}/7 bài học`;
    });
  } catch (err) { console.warn('Không tải được danh sách bài học:', err.message); }
});

/* --- ĐỢT 4: BÀI TẬP GIÁO VIÊN GIAO CHO LỚP --- */
document.addEventListener('mathapp:user-ready', async () => {
  try {
    const { assignments } = await window.MathAPI.get('/api/me/assignments');
    if (!assignments.length) return;
    const anchor = document.querySelector('[data-lesson-card]')?.closest('section');
    if (!anchor) return;
    const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const card = document.createElement('section');
    card.className = 'rounded-3xl bg-surface-container-lowest shadow-sm p-5 mb-6';
    card.innerHTML = `
      <h2 class="font-headline-md text-headline-md text-primary mb-3">📋 Bài được giao</h2>
      <div class="space-y-2">${assignments.map(a => {
        const due = a.dueDate ? a.dueDate.split('-').reverse().join('/') : '';
        const status = a.done ? `Đã làm — ${a.bestScore}%` : 'Chưa làm';
        return `<button type="button" data-assignment-set="${esc(a.setId)}" data-assignment-lesson="${esc(a.lessonId)}" class="w-full text-left p-3 rounded-2xl bg-surface-container-low flex flex-wrap items-center gap-2">
          <span class="font-headline-sm text-primary flex-1 min-w-[180px]">${esc(a.setTitle)}</span>
          ${due ? `<span class="px-2.5 py-1 rounded-xl bg-surface-container font-label-sm">Hạn ${due}</span>` : ''}
          <span class="font-label-md ${a.done ? 'text-primary' : 'text-on-surface-variant'}">${status}</span>
        </button>`;
      }).join('')}</div>`;
    card.addEventListener('click', (e) => {
      const row = e.target.closest('[data-assignment-set]');
      if (row) location.href = 'lesson.html?' + (row.dataset.assignmentLesson ? 'lesson=' + row.dataset.assignmentLesson + '&' : '') + 'set=' + row.dataset.assignmentSet;
    });
    anchor.insertAdjacentElement('beforebegin', card);
  } catch (err) { console.warn('Không tải được bài tập đã giao:', err.message); }
});
