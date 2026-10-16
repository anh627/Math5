/**
 * VƯỜN TOÁN LỚP 3 - CHÂN TRANG CHUNG (FOOTER COMPONENT)
 * Bảo tồn 100% bản quyền và thông tin trường Tiểu học Hoàng Mai
 */
window.MathApp = window.MathApp || {};
window.MathApp.components = window.MathApp.components || {};

window.MathApp.components.Footer = (function () {
  let container = null;

  const template = `
    <div class="w-full px-gutter-mobile lg:px-margin max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-space-md">
      <div class="flex items-center gap-space-sm">
        <div class="w-10 h-10 rounded-2xl bg-secondary-container text-on-secondary-container flex items-center justify-center font-headline-md">
          <span class="material-symbols-outlined">school</span>
        </div>
        <div>
          <p class="font-headline-sm text-label-lg text-primary leading-tight">Trường Tiểu học Hoàng Mai - Hà Nội</p>
          <p class="font-body-sm text-body-sm text-on-surface-variant">Cổng học tập Toán thông minh dành cho học sinh Lớp 3</p>
        </div>
      </div>
      <div class="flex flex-wrap items-center justify-center gap-space-md text-on-surface-variant font-label-md text-label-md">
        <span class="flex items-center gap-1">
          <span class="material-symbols-outlined text-primary text-[20px]">support_agent</span> 
          Phòng Tin học &amp; Thiết bị số
        </span>
        <span class="flex items-center gap-1">
          <span class="material-symbols-outlined text-primary text-[20px]">call</span> 
          Hotline: (024) 3861 2xxx
        </span>
      </div>
      <p class="font-body-sm text-body-sm text-on-surface-variant text-center">
        © 2025 Trường Tiểu học Hoàng Mai. Giữ toàn quyền phát triển nội dung.
      </p>
    </div>
  `;

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
      container.className = "w-full bg-surface-container-lowest shadow-[0_-4px_20px_rgba(0,0,0,0.03)] py-space-lg md:pl-20 mb-16 md:mb-0 transition-all duration-300";
      container.innerHTML = template;
    },

    update(state) {
      if (!container) return;
      const route = state.currentRoute;
      // Ẩn footer khi đang ở màn hình Đăng nhập hoặc Phòng thi
      if (route === '#/login' || route === '#/exam') {
        container.style.display = 'none';
      } else {
        container.style.display = 'block';
      }
    }
  };
})();
