/**
 * VƯỜN TOÁN LỚP 3 - THANH ĐIỀU HƯỚNG DỌC (VERTICAL NAVIGATION RAIL)
 * Tối giản, thanh lịch, dạng Icon-only theo chuẩn Image 2, không làm rối thanh ngang
 */
window.MathApp = window.MathApp || {};
window.MathApp.components = window.MathApp.components || {};

window.MathApp.components.Sidebar = (function () {
  let container = null;

  const navLinks = [
    { label: 'Trang Chủ', route: '#/home', icon: 'home' },
    { label: 'Mục Lục SGK', route: '#/curriculum', icon: 'menu_book' },
    { label: 'Luyện Tập', route: '#/exercise', icon: 'edit_note' },
    { label: 'Đấu Trường Trò Chơi', route: '#/games', icon: 'sports_esports' },
    { label: 'Bảng Xếp Hạng', route: '#/leaderboard', icon: 'emoji_events' },
    { label: 'Góc Thầy Cô', route: '#/teacher', icon: 'school' }
  ];

  function getTemplate(state) {
    const currentRoute = state.currentRoute || '#/home';
    const isSoundOn = state.soundEnabled;

    const linksHtml = navLinks.map(link => {
      const isActive = currentRoute === link.route || 
        (link.route === '#/games' && currentRoute.startsWith('#/games'));

      // Style active chuẩn theo Image 2: Thẻ bo tròn trắng nổi bật + bóng đổ êm ái
      const activeClass = isActive
        ? "bg-surface-container-lowest text-primary shadow-[0_6px_16px_rgba(0,97,39,0.14)] ring-2 ring-primary/20 scale-105 font-bold"
        : "text-on-surface-variant hover:text-primary hover:bg-surface-container-high/60";

      return `
        <a href="${link.route}" 
           data-route="${link.route}"
           title="${link.label}"
           class="sidebar-item w-12 h-12 md:w-13 md:h-13 rounded-2xl flex items-center justify-center relative group transition-all duration-200 cursor-pointer ${activeClass}">
          <span class="material-symbols-outlined text-[24px] md:text-[26px]">${link.icon}</span>
          
          <!-- Tooltip thông minh hiện sang phải khi hover (Desktop) -->
          <span class="hidden md:block absolute left-full ml-3 px-3 py-1.5 rounded-xl bg-inverse-surface text-inverse-on-surface font-label-md text-label-sm font-bold shadow-xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-hover:translate-x-1 transition-all z-50">
            ${link.label}
          </span>
        </a>
      `;
    }).join('');

    return `
      <!-- 1. Logo / Linh vật Voi Bo Bo ở đầu thanh dọc (Desktop) -->
      <div class="hidden md:flex flex-col items-center mb-2">
        <a href="#/home" 
           title="Trang Chủ Vườn Toán Lớp 3" 
           class="w-12 h-12 rounded-2xl bg-primary text-on-primary flex items-center justify-center shadow-[0_4px_0_0_#005320] transition-transform active:scale-95 group">
          <span class="material-symbols-outlined text-[28px] text-tertiary-fixed">smart_toy</span>
        </a>
      </div>

      <!-- 2. Danh sách Icon Điều Hướng Dọc -->
      <nav class="flex flex-row md:flex-col items-center justify-around md:justify-center gap-2 md:gap-3.5 w-full">
        ${linksHtml}
      </nav>

      <!-- 3. Tiện ích âm thanh & Đăng xuất ở cuối thanh dọc (Desktop) -->
      <div class="hidden md:flex flex-col items-center gap-2.5 mt-auto pt-3 border-t border-surface-container-high/60 w-full">
        <!-- Nút Sound Toggle -->
        <button id="sidebarSoundToggle" 
                title="Bật/Tắt âm thanh vui nhộn" 
                class="w-11 h-11 rounded-2xl text-on-surface-variant hover:text-primary hover:bg-surface-container-high/60 flex items-center justify-center relative group transition-all">
          <span class="material-symbols-outlined text-[22px]" id="sidebarSoundIcon">
            ${isSoundOn ? 'volume_up' : 'volume_off'}
          </span>
          <span class="absolute left-full ml-3 px-3 py-1.5 rounded-xl bg-inverse-surface text-inverse-on-surface font-label-md text-label-sm font-bold shadow-xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-hover:translate-x-1 transition-all z-50">
            Âm thanh: ${isSoundOn ? 'Bật' : 'Tắt'}
          </span>
        </button>

        <!-- Nút Đổi tài khoản / Đăng nhập -->
        <a href="#/login" 
           title="Đổi tài khoản / Đăng xuất" 
           class="w-11 h-11 rounded-2xl text-on-surface-variant hover:text-primary hover:bg-surface-container-high/60 flex items-center justify-center relative group transition-all">
          <span class="material-symbols-outlined text-[22px]">account_circle</span>
          <span class="absolute left-full ml-3 px-3 py-1.5 rounded-xl bg-inverse-surface text-inverse-on-surface font-label-md text-label-sm font-bold shadow-xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-hover:translate-x-1 transition-all z-50">
            Tài khoản
          </span>
        </a>
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

      // Ẩn thanh điều hướng trong trang Đăng nhập và Phòng thi
      if (route === '#/login' || route === '#/exam') {
        container.style.display = 'none';
        return;
      } else {
        container.style.display = 'flex';
      }

      // Cập nhật class active cho từng icon
      const items = container.querySelectorAll('.sidebar-item');
      items.forEach(a => {
        const linkRoute = a.getAttribute('data-route');
        const isActive = route === linkRoute || (linkRoute === '#/games' && route.startsWith('#/games'));
        if (isActive) {
          a.className = "sidebar-item w-12 h-12 md:w-13 md:h-13 rounded-2xl flex items-center justify-center relative group transition-all duration-200 cursor-pointer bg-surface-container-lowest text-primary shadow-[0_6px_16px_rgba(0,97,39,0.14)] ring-2 ring-primary/20 scale-105 font-bold";
        } else {
          a.className = "sidebar-item w-12 h-12 md:w-13 md:h-13 rounded-2xl flex items-center justify-center relative group transition-all duration-200 cursor-pointer text-on-surface-variant hover:text-primary hover:bg-surface-container-high/60";
        }
      });

      // Cập nhật icon âm thanh
      const soundIcon = container.querySelector('#sidebarSoundIcon');
      if (soundIcon) {
        soundIcon.textContent = state.soundEnabled ? 'volume_up' : 'volume_off';
      }
    },

    attachEvents() {
      if (!container) return;

      const soundBtn = container.querySelector('#sidebarSoundToggle');
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
