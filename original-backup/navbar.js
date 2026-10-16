/**
 * VƯỜN TOÁN LỚP 3 - THANH TIÊU ĐỀ NGANG TRÊN CÙNG (TOP HEADER)
 * Thoáng đãng, gọn gàng, không bị dồn chữ gây rối mắt
 */
window.MathApp = window.MathApp || {};
window.MathApp.components = window.MathApp.components || {};

window.MathApp.components.Navbar = (function () {
  let container = null;

  const routeTitles = {
    '#/home': { title: 'Trang Chủ Học Tập', icon: 'home' },
    '#/curriculum': { title: 'Mục Lục SGK Toán 3', icon: 'menu_book' },
    '#/exercise': { title: 'Phòng Luyện Tập', icon: 'edit_note' },
    '#/exam': { title: 'Phòng Thi Định Kỳ', icon: 'timer' },
    '#/leaderboard': { title: 'Bảng Xếp Hạng Dũng Sĩ', icon: 'emoji_events' },
    '#/games': { title: 'Đấu Trường Trò Chơi', icon: 'sports_esports' },
    '#/games/racing': { title: 'Đua Xe Siêu Tốc', icon: 'sports_esports' },
    '#/games/matching': { title: 'Thử Thách Nối Cặp', icon: 'sports_esports' },
    '#/games/fishing': { title: 'Câu Cá Đại Dương', icon: 'sports_esports' },
    '#/teacher': { title: 'Góc Quản Lý Thầy Cô', icon: 'school' },
    '#/login': { title: 'Cổng Đăng Nhập', icon: 'lock' }
  };

  function getTemplate(state) {
    const user = state.user || {};
    const isSoundOn = state.soundEnabled;
    const currentRoute = state.currentRoute || '#/home';
    const currentMeta = routeTitles[currentRoute] || routeTitles['#/home'];

    return `
      <div class="h-20 w-full px-gutter-mobile lg:px-margin max-w-7xl mx-auto flex items-center justify-between gap-space-sm">
        
        <!-- Cột Trái: Logo & Tên Trường -->
        <a href="#/home" class="flex items-center gap-space-sm group cursor-pointer">
          <img alt="Logo Trường Tiểu học Hoàng Mai" 
               class="h-9 w-auto object-contain transition-transform group-hover:scale-105" 
               src="https://lh3.googleusercontent.com/aida-public/AB6AXuB5cjuWWAWsjimfXPTn37XDLU9xQesLsZAhpXmz3qKg6zVBRXPYMUjkoy-u3U2wiL_yrqsnHsIgOzm9-nS0UWwpaKbbVQOwW8mW8SyGA8Nloqjgx9JlcGE9Vtnrjx7AJa39zCrfwQPTfHf1aB9jkJUzew1Qkj12tiD4YtF0Dd8cNQsRpPZYsW-AIubPqVcPo2OFVI3aKps_DVjfVlf5uBkjBNCeKiJ6P-_eCLFvTEl5uEWKgZzltQgwNg"/>
          <div class="flex flex-col">
            <span class="font-headline-sm text-headline-sm text-primary tracking-tight leading-none">VƯỜN TOÁN LỚP 3</span>
            <span class="font-label-sm text-label-sm text-on-surface-variant font-semibold">Trường Tiểu học Hoàng Mai</span>
          </div>
        </a>

        <!-- Cột Giữa: Huy hiệu vị trí hiện tại (Nhẹ nhàng, tinh tế, không dồn chữ rối mắt) -->
        <div class="hidden lg:flex items-center gap-2 px-4 py-2 rounded-full bg-surface-container-low text-on-surface-variant font-headline-sm text-label-md border border-surface-container-high/60 shadow-sm" id="headerLocationBadge">
          <span class="material-symbols-outlined text-[20px] text-primary" id="headerLocationIcon">${currentMeta.icon}</span>
          <span class="font-bold text-on-surface" id="headerLocationTitle">${currentMeta.title}</span>
        </div>

        <!-- Cột Phải: Huy hiệu sao & Hồ sơ học sinh -->
        <div class="flex items-center gap-space-sm">
          <!-- Badges điểm sao & danh hiệu học tập -->
          <div class="hidden sm:flex items-center gap-space-xs bg-surface-container-lowest px-3 py-1.5 rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-surface-container-high/40">
            <div class="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-headline-sm text-label-sm">
              <span class="material-symbols-outlined text-[18px] text-tertiary" style="font-variation-settings: 'FILL' 1;">star</span>
              <span id="nav-user-stars">${user.stars ? user.stars.toLocaleString('vi-VN') : '1.250'}</span>
            </div>
            <div class="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-headline-sm text-label-sm">
              <span class="material-symbols-outlined text-[18px] text-secondary">emoji_events</span>
              <span>${user.rank || 'Hạng 2'}</span>
            </div>
            <div class="hidden xl:flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed font-label-sm text-label-sm">
              <span class="material-symbols-outlined text-[18px] text-primary">military_tech</span>
              <span>${user.badge || 'Siêu nhí Bảng Nhân'}</span>
            </div>
          </div>

          <!-- Nút bật tắt âm thanh toàn cục -->
          <button id="globalSoundToggle" 
                  title="Bật/Tắt âm thanh vui nhộn" 
                  class="w-10 h-10 rounded-2xl bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-on-surface shadow-[0_3px_0_0_#bfcabb] active:translate-y-0.5 active:shadow-none transition-all">
            <span class="material-symbols-outlined text-[20px] text-primary" id="globalSoundIcon">
              ${isSoundOn ? 'volume_up' : 'volume_off'}
            </span>
          </button>

          <!-- Avatar & Tài khoản -->
          <a href="#/login" 
             title="Chuyển tài khoản hoặc Đăng xuất"
             class="flex items-center gap-2.5 pl-space-xs py-1 pr-3 bg-surface-container-low hover:bg-surface-container rounded-full transition-all group">
            <img alt="Profile" 
                 class="w-8 h-8 rounded-full object-cover ring-2 ring-transparent group-hover:ring-primary transition-all" 
                 src="${user.avatar || 'https://lh3.googleusercontent.com/aida-public/AB6AXuDKwA6FT33BYSGdO7z6NLWGOVMAz6PyDh1E0kzf5-4Jvs9IlUa9osjTxIXPXV-SiFr0-mXjeZ74Qb_GUTnRX2F5TYyF9mPoUne33RlMuy7UGiGYAjE_Ohrnd1KFtfLB3IciZMNb82xMZ_ElTdn4e4fIhabnLLL2wAwILSbWyGw7vjQJ69Pf-_Km0CwIhQ90vjGunVdgmOyT2a9i2YxWiHYyM80L0aXMA0ZpmFcwDyP86T0St2quGf_YAw'}"/>
            <div class="flex flex-col text-left">
              <span class="font-headline-sm text-label-sm text-on-surface leading-tight">${user.name || 'Bảo Nam'}</span>
              <span class="font-label-sm text-[11px] text-primary font-bold leading-none">${user.class || 'Lớp 3A'}</span>
            </div>
          </a>
        </div>
      </div>
    `;
  }

  return {
    init(elem) {
      container = elem;
      this.render();

      window.MathApp.store.subscribe((state) => {
        this.update(state);
      });
    },

    render() {
      if (!container) return;
      const state = window.MathApp.store.getState();
      container.innerHTML = getTemplate(state);
      this.attachEvents();
    },

    update(state) {
      if (!container) return;
      const route = state.currentRoute;
      
      // Ẩn Header trong trang Đăng nhập và Phòng thi để tối ưu không gian
      if (route === '#/login' || route === '#/exam') {
        container.style.display = 'none';
        return;
      } else {
        container.style.display = 'block';
      }

      // Cập nhật vị trí trang hiện tại
      const currentMeta = routeTitles[route] || routeTitles['#/home'];
      const iconEl = container.querySelector('#headerLocationIcon');
      const titleEl = container.querySelector('#headerLocationTitle');
      if (iconEl && titleEl) {
        iconEl.textContent = currentMeta.icon;
        titleEl.textContent = currentMeta.title;
      }

      // Cập nhật icon sound
      const soundIcon = container.querySelector('#globalSoundIcon');
      if (soundIcon) {
        soundIcon.textContent = state.soundEnabled ? 'volume_up' : 'volume_off';
      }

      // Cập nhật sao
      const starCount = container.querySelector('#nav-user-stars');
      if (starCount && state.user && state.user.stars) {
        starCount.textContent = state.user.stars.toLocaleString('vi-VN');
      }
    },

    attachEvents() {
      if (!container) return;

      const soundBtn = container.querySelector('#globalSoundToggle');
      if (soundBtn) {
        soundBtn.addEventListener('click', () => {
          const isNowOn = window.MathApp.store.toggleSound();
          if (isNowOn && window.MathApp.sound) {
            window.MathApp.sound.playClick();
          }
        });
      }
    }
  };
})();
