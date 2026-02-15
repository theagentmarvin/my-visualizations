/**
 * Reading Progress Indicator
 */

class ReadingProgress {
  constructor() {
    this.progressBar = document.querySelector('.progress-bar');
    this.init();
  }

  init() {
    window.addEventListener('scroll', this.throttle(() => {
      this.update();
    }, 50));
  }

  update() {
    if (!this.progressBar) return;
    
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    
    this.progressBar.style.width = `${progress}%`;
  }

  throttle(func, limit) {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }
}

export default ReadingProgress;