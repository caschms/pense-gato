// Funcionalidades essenciais do tema
class PenseGatoCore {
  constructor() {
    this.init();
  }
  
  init() {
    console.log('🐱 Pense Gato - Tema carregado');
    this.initMobileMenu();
    this.initBasicInteractions();
  }
  
  initMobileMenu() {
    // Funcionalidade básica do menu mobile
    const menuToggle = document.querySelector('.mobile-menu-toggle');
    const mobileMenu = document.querySelector('.mobile-menu');
    
    if (menuToggle && mobileMenu) {
      menuToggle.addEventListener('click', () => {
        mobileMenu.classList.toggle('active');
      });
    }
  }
  
  initBasicInteractions() {
    // Interações básicas como hover effects
    document.addEventListener('DOMContentLoaded', () => {
      // Adicionar classes para animações CSS
      document.body.classList.add('theme-loaded');
    });
  }
}

// Inicializar quando DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new PenseGatoCore());
} else {
  new PenseGatoCore();
}