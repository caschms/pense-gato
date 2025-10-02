/**
 * Pense Gato - Shopify Theme
 * JavaScript Principal
 */

class PenseGatoTheme {
  constructor() {
    this.init();
  }

  init() {
    // Aguardar DOM estar pronto
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.initializeComponents());
    } else {
      this.initializeComponents();
    }
  }

  initializeComponents() {
    console.log('🐱 Pense Gato Theme inicializado!');
    
    // Inicializar componentes
    this.initCart();
    this.initFavorites();
    this.initSearch();
    this.initMobileMenu();
    this.initModals();
    this.initTooltips();
    this.initLazyLoading();
    this.initScrollEffects();
    this.initProductCards();
    this.initNewsletter();
    this.initPreloader();
    
    // Event listeners globais
    this.bindGlobalEvents();
  }

  /**
   * Gerenciamento do Carrinho
   */
  initCart() {
    this.cart = {
      count: 0,
      items: [],
      total: 0
    };

    this.updateCartDisplay();
    this.bindCartEvents();
  }

  async updateCartDisplay() {
    try {
      const response = await fetch('/cart.js');
      const cart = await response.json();
      
      this.cart = cart;
      
      // Atualizar contador no header
      const cartCountElements = document.querySelectorAll('#cart-count, .cart-count');
      cartCountElements.forEach(element => {
        element.textContent = cart.item_count;
        element.classList.toggle('has-items', cart.item_count > 0);
      });

      // Disparar evento personalizado
      document.dispatchEvent(new CustomEvent('cart:updated', { 
        detail: cart 
      }));

    } catch (error) {
      console.error('Erro ao atualizar carrinho:', error);
    }
  }

  async addToCart(variantId, quantity = 1, properties = {}) {
    try {
      const response = await fetch('/cart/add.js', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: variantId,
          quantity: quantity,
          properties: properties
        })
      });

      if (!response.ok) {
        throw new Error('Erro ao adicionar produto ao carrinho');
      }

      const item = await response.json();
      
      // Atualizar display
      await this.updateCartDisplay();
      
      // Mostrar notificação
      this.showNotification('Produto adicionado ao carrinho! 🛒', 'success');
      
      return item;

    } catch (error) {
      console.error('Erro ao adicionar ao carrinho:', error);
      this.showNotification('Erro ao adicionar produto. Tente novamente.', 'error');
      throw error;
    }
  }

  bindCartEvents() {
    // Botões de adicionar ao carrinho
    document.addEventListener('click', async (e) => {
      if (e.target.matches('.add-to-cart-btn, .add-to-cart-btn *')) {
        e.preventDefault();
        
        const button = e.target.closest('.add-to-cart-btn');
        const variantId = button.dataset.variantId;
        const quantity = parseInt(button.dataset.quantity) || 1;
        
        if (!variantId) return;

        // Estado de loading
        const originalText = button.innerHTML;
        button.innerHTML = 'Adicionando...';
        button.disabled = true;

        try {
          await this.addToCart(variantId, quantity);
          
          // Feedback visual
          button.innerHTML = 'Adicionado! ✓';
          button.classList.add('success');
          
          setTimeout(() => {
            button.innerHTML = originalText;
            button.disabled = false;
            button.classList.remove('success');
          }, 2000);

        } catch (error) {
          button.innerHTML = 'Erro - Tente novamente';
          button.classList.add('error');
          
          setTimeout(() => {
            button.innerHTML = originalText;
            button.disabled = false;
            button.classList.remove('error');
          }, 3000);
        }
      }
    });
  }

  /**
   * Sistema de Favoritos
   */
  initFavorites() {
    this.favorites = JSON.parse(localStorage.getItem('pense-gato-favorites') || '[]');
    this.updateFavoritesDisplay();
    this.bindFavoritesEvents();
  }

  updateFavoritesDisplay() {
    // Atualizar contador
    const favoritesCountElements = document.querySelectorAll('#favorites-count, .favorites-count');
    favoritesCountElements.forEach(element => {
      element.textContent = this.favorites.length;
      element.classList.toggle('has-items', this.favorites.length > 0);
    });

    // Atualizar botões de favorito
    document.querySelectorAll('.favorite-btn').forEach(btn => {
      const productId = btn.dataset.productId;
      btn.classList.toggle('active', this.favorites.includes(productId));
    });

    // Disparar evento
    document.dispatchEvent(new CustomEvent('favorites:updated', {
      detail: this.favorites
    }));
  }

  toggleFavorite(productId) {
    const index = this.favorites.indexOf(productId);
    
    if (index > -1) {
      this.favorites.splice(index, 1);
      this.showNotification('Produto removido dos favoritos', 'info');
    } else {
      this.favorites.push(productId);
      this.showNotification('Produto adicionado aos favoritos! ❤️', 'success');
    }

    localStorage.setItem('pense-gato-favorites', JSON.stringify(this.favorites));
    this.updateFavoritesDisplay();
  }

  bindFavoritesEvents() {
    document.addEventListener('click', (e) => {
      if (e.target.matches('.favorite-btn, .favorite-btn *')) {
        e.preventDefault();
        
        const button = e.target.closest('.favorite-btn');
        const productId = button.dataset.productId;
        
        if (productId) {
          this.toggleFavorite(productId);
        }
      }
    });
  }

  /**
   * Sistema de Busca
   */
  initSearch() {
    const searchForms = document.querySelectorAll('.search-form');
    const searchInputs = document.querySelectorAll('.search-input');

    // Busca preditiva
    searchInputs.forEach(input => {
      let searchTimeout;
      
      input.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        const query = e.target.value.trim();
        
        if (query.length >= 2) {
          searchTimeout = setTimeout(() => {
            this.performPredictiveSearch(query, input);
          }, 300);
        } else {
          this.hidePredictiveSearch(input);
        }
      });

      // Fechar resultados ao perder foco
      input.addEventListener('blur', () => {
        setTimeout(() => this.hidePredictiveSearch(input), 200);
      });
    });
  }

  async performPredictiveSearch(query, inputElement) {
    try {
      const response = await fetch(`${window.routes.predictive_search_url}?q=${encodeURIComponent(query)}&resources[type]=product&resources[limit]=5`);
      const data = await response.json();
      
      this.showPredictiveResults(data.resources.results.products, inputElement);
      
    } catch (error) {
      console.error('Erro na busca preditiva:', error);
    }
  }

  showPredictiveResults(products, inputElement) {
    let resultsContainer = inputElement.parentNode.querySelector('.search-results');
    
    if (!resultsContainer) {
      resultsContainer = document.createElement('div');
      resultsContainer.className = 'search-results';
      inputElement.parentNode.appendChild(resultsContainer);
    }

    if (products.length === 0) {
      resultsContainer.innerHTML = '<div class="search-no-results">Nenhum produto encontrado</div>';
    } else {
      resultsContainer.innerHTML = products.map(product => `
        <a href="${product.url}" class="search-result-item">
          <img src="${product.featured_image?.url}?width=50" alt="${product.title}">
          <div class="search-result-info">
            <div class="search-result-title">${product.title}</div>
            <div class="search-result-price">${this.formatMoney(product.price)}</div>
          </div>
        </a>
      `).join('');
    }

    resultsContainer.classList.add('active');
  }

  hidePredictiveSearch(inputElement) {
    const resultsContainer = inputElement.parentNode.querySelector('.search-results');
    if (resultsContainer) {
      resultsContainer.classList.remove('active');
    }
  }

  /**
   * Menu Mobile
   */
  initMobileMenu() {
    const mobileToggle = document.querySelector('.mobile-menu-toggle');
    const mobileMenu = document.querySelector('.mobile-menu');
    const mobileClose = document.querySelector('.mobile-menu-close');
    const mobileDropdowns = document.querySelectorAll('.mobile-dropdown-toggle');

    if (mobileToggle && mobileMenu) {
      mobileToggle.addEventListener('click', () => {
        mobileMenu.classList.add('active');
        document.body.style.overflow = 'hidden';
      });
    }

    if (mobileClose && mobileMenu) {
      mobileClose.addEventListener('click', () => {
        this.closeMobileMenu();
      });
    }

    // Fechar ao clicar fora
    if (mobileMenu) {
      mobileMenu.addEventListener('click', (e) => {
        if (e.target === mobileMenu) {
          this.closeMobileMenu();
        }
      });
    }

    // Dropdowns mobile
    mobileDropdowns.forEach(toggle => {
      toggle.addEventListener('click', () => {
        const dropdown = toggle.parentElement;
        dropdown.classList.toggle('active');
      });
    });

    // Fechar menu ao redimensionar
    window.addEventListener('resize', () => {
      if (window.innerWidth > 768) {
        this.closeMobileMenu();
      }
    });
  }

  closeMobileMenu() {
    const mobileMenu = document.querySelector('.mobile-menu');
    if (mobileMenu) {
      mobileMenu.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  /**
   * Sistema de Modais
   */
  initModals() {
    // Abrir modais
    document.addEventListener('click', (e) => {
      if (e.target.matches('[data-modal-open]')) {
        e.preventDefault();
        const modalId = e.target.dataset.modalOpen;
        this.openModal(modalId);
      }
    });

    // Fechar modais
    document.addEventListener('click', (e) => {
      if (e.target.matches('.modal-close, .modal-overlay')) {
        this.closeModal();
      }
    });

    // Fechar com ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeModal();
      }
    });
  }

  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  }

  closeModal() {
    const activeModal = document.querySelector('.modal-overlay.active');
    if (activeModal) {
      activeModal.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  /**
   * Tooltips
   */
  initTooltips() {
    // Tooltips são implementados via CSS
    // Aqui podemos adicionar funcionalidades extras se necessário
  }

  /**
   * Lazy Loading de Imagens
   */
  initLazyLoading() {
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.src;
            img.classList.remove('lazy');
            observer.unobserve(img);
          }
        });
      });

      document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
      });
    }
  }

  /**
   * Efeitos de Scroll
   */
  initScrollEffects() {
    // Animações ao scroll
    if ('IntersectionObserver' in window) {
      const animationObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-fadeInUp');
          }
        });
      }, {
        threshold: 0.1
      });

      document.querySelectorAll('.animate-on-scroll').forEach(el => {
        animationObserver.observe(el);
      });
    }

    // Header transparente/fixo
    let lastScrollTop = 0;
    const header = document.querySelector('.header');
    
    window.addEventListener('scroll', () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      
      if (header) {
        if (scrollTop > 100) {
          header.classList.add('scrolled');
        } else {
          header.classList.remove('scrolled');
        }

        // Auto-hide header
        if (scrollTop > lastScrollTop && scrollTop > 200) {
          header.classList.add('hidden');
        } else {
          header.classList.remove('hidden');
        }
      }
      
      lastScrollTop = scrollTop;
    });
  }

  /**
   * Cards de Produto
   */
  initProductCards() {
    // Hover effects nos cards
    document.querySelectorAll('.product-card').forEach(card => {
      card.addEventListener('mouseenter', () => {
        card.classList.add('hovered');
      });

      card.addEventListener('mouseleave', () => {
        card.classList.remove('hovered');
      });
    });

    // Quick view (se implementado)
    document.addEventListener('click', (e) => {
      if (e.target.matches('.quick-view-btn')) {
        e.preventDefault();
        const productHandle = e.target.dataset.productHandle;
        this.openQuickView(productHandle);
      }
    });
  }

  /**
   * Newsletter
   */
  initNewsletter() {
    const newsletterForms = document.querySelectorAll('.newsletter-form');
    
    newsletterForms.forEach(form => {
      form.addEventListener('submit', (e) => {
        const submitBtn = form.querySelector('.newsletter-btn');
        const originalText = submitBtn.textContent;
        
        submitBtn.textContent = 'Inscrevendo...';
        submitBtn.disabled = true;
        
        // O Shopify processará o formulário
        // Restaurar botão após um tempo
        setTimeout(() => {
          submitBtn.textContent = 'Inscrito! ✓';
          setTimeout(() => {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
            form.reset();
          }, 2000);
        }, 1000);
      });
    });
  }

  /**
   * Preloader
   */
  initPreloader() {
    const preloader = document.querySelector('.preloader');
    
    if (preloader) {
      window.addEventListener('load', () => {
        setTimeout(() => {
          preloader.classList.add('hidden');
          setTimeout(() => {
            preloader.remove();
          }, 500);
        }, 500);
      });
    }
  }

  /**
   * Eventos Globais
   */
  bindGlobalEvents() {
    // Smooth scroll para links internos
    document.addEventListener('click', (e) => {
      if (e.target.matches('a[href^="#"]')) {
        e.preventDefault();
        const targetId = e.target.getAttribute('href').substring(1);
        const targetElement = document.getElementById(targetId);
        
        if (targetElement) {
          targetElement.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      }
    });

    // Copiar para clipboard
    document.addEventListener('click', (e) => {
      if (e.target.matches('.copy-to-clipboard')) {
        const text = e.target.dataset.text || e.target.textContent;
        navigator.clipboard.writeText(text).then(() => {
          this.showNotification('Copiado para a área de transferência!', 'success');
        });
      }
    });
  }

  /**
   * Utilitários
   */
  formatMoney(cents) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(cents / 100);
  }

  showNotification(message, type = 'info') {
    // Criar elemento de notificação
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
      <div class="notification-content">
        <span class="notification-message">${message}</span>
        <button class="notification-close">&times;</button>
      </div>
    `;

    // Adicionar ao DOM
    document.body.appendChild(notification);

    // Mostrar com animação
    setTimeout(() => notification.classList.add('show'), 100);

    // Auto-remover
    const autoRemove = setTimeout(() => {
      this.hideNotification(notification);
    }, 5000);

    // Botão de fechar
    notification.querySelector('.notification-close').addEventListener('click', () => {
      clearTimeout(autoRemove);
      this.hideNotification(notification);
    });
  }

  hideNotification(notification) {
    notification.classList.remove('show');
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }

  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  throttle(func, limit) {
    let inThrottle;
    return function() {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }
}

// Inicializar tema
const penseGatoTheme = new PenseGatoTheme();

// Expor globalmente para uso em outros scripts
window.PenseGatoTheme = penseGatoTheme;

// CSS para notificações (injetado via JS)
const notificationStyles = `
  .notification {
    position: fixed;
    top: 20px;
    right: 20px;
    background: var(--white);
    border-radius: var(--border-radius);
    box-shadow: var(--shadow-hover);
    padding: 16px 20px;
    max-width: 400px;
    z-index: 10000;
    transform: translateX(100%);
    opacity: 0;
    transition: all 0.3s ease;
    border-left: 4px solid var(--primary-color);
  }

  .notification.show {
    transform: translateX(0);
    opacity: 1;
  }

  .notification-success {
    border-left-color: #10B981;
  }

  .notification-error {
    border-left-color: #EF4444;
  }

  .notification-warning {
    border-left-color: #F59E0B;
  }

  .notification-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .notification-message {
    font-weight: 600;
    color: var(--secondary-color);
  }

  .notification-close {
    background: none;
    border: none;
    font-size: 18px;
    cursor: pointer;
    color: var(--secondary-color);
    opacity: 0.7;
    transition: opacity 0.2s ease;
  }

  .notification-close:hover {
    opacity: 1;
  }

  .search-results {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: var(--white);
    border: 1px solid var(--border-color);
    border-top: none;
    border-radius: 0 0 var(--border-radius) var(--border-radius);
    box-shadow: var(--shadow-hover);
    max-height: 300px;
    overflow-y: auto;
    z-index: 1000;
    opacity: 0;
    visibility: hidden;
    transform: translateY(-10px);
    transition: var(--transition);
  }

  .search-results.active {
    opacity: 1;
    visibility: visible;
    transform: translateY(0);
  }

  .search-result-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    text-decoration: none;
    color: var(--secondary-color);
    border-bottom: 1px solid var(--border-color);
    transition: var(--transition);
  }

  .search-result-item:hover {
    background: var(--light-gray);
  }

  .search-result-item:last-child {
    border-bottom: none;
  }

  .search-result-item img {
    width: 40px;
    height: 40px;
    object-fit: cover;
    border-radius: 4px;
  }

  .search-result-title {
    font-weight: 600;
    font-size: 14px;
  }

  .search-result-price {
    font-size: 12px;
    color: var(--primary-color);
    font-weight: 700;
  }

  .search-no-results {
    padding: 20px;
    text-align: center;
    color: var(--secondary-color);
    font-style: italic;
  }

  @media (max-width: 768px) {
    .notification {
      right: 10px;
      left: 10px;
      max-width: none;
    }
  }
`;

// Injetar estilos
const styleSheet = document.createElement('style');
styleSheet.textContent = notificationStyles;
document.head.appendChild(styleSheet);

// Dropdown de Categorias
document.addEventListener('DOMContentLoaded', function() {
  const dropdown = document.querySelector('.dropdown');
  const dropdownToggle = document.querySelector('.dropdown-toggle');
  const dropdownMenu = document.querySelector('.dropdown-menu');
  
  if (dropdownToggle && dropdownMenu) {
    dropdownToggle.addEventListener('click', function(e) {
      e.preventDefault();
      dropdown.classList.toggle('active');
    });
    
    // Fechar dropdown ao clicar fora
    document.addEventListener('click', function(e) {
      if (!dropdown.contains(e.target)) {
        dropdown.classList.remove('active');
      }
    });
  }
});