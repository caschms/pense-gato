// ===== Dados dos produtos =====
// Troque os links "#" pelos seus links de afiliado reais.
const produtos = [
  {
    id: "fonte-agua",
    nome: "Fonte de água para gatos",
    descricao:
      "Mantém a água em movimento, incentiva seu gato a beber mais e ajuda a prevenir problemas renais.",
    imagem: "./assets/img/fonte-agua.jpg",
    loja: "Amazon",
    categoria: "Hidratação",
    link: "#"
  },
  {
    id: "arranhador-vertical",
    nome: "Arranhador vertical compacto",
    descricao:
      "Perfeito para apartamentos: oferece um ponto fixo para o gato afiar as unhas e poupa seu sofá.",
    imagem: "./assets/img/arranhador.jpg",
    loja: "Shopee",
    categoria: "Arranhadores",
    link: "#"
  },
  {
    id: "caminha-ninho",
    nome: "Caminha tipo ninho",
    descricao:
      "Formato aconchegante, bordas altas e tecido macio para cochilos prolongados com cara de rei felino.",
    imagem: "./assets/img/caminha.jpg",
    loja: "Mercado Livre",
    categoria: "Conforto",
    link: "#"
  },
  {
    id: "brinquedo-interativo",
    nome: "Brinquedo interativo para gatos",
    descricao:
      "Estimula o instinto de caça, ajuda a gastar energia e diminui tédio e miados excessivos.",
    imagem: "./assets/img/brinquedo-interativo.jpg",
    loja: "Amazon",
    categoria: "Brinquedos",
    link: "#"
  }
];

// Estado da categoria ativa
let categoriaAtiva = "Todos";

// ===== Função para criar o HTML de cada card =====
function criarCardProduto(produto) {
  const lojaTexto = produto.loja ? `Ver na ${produto.loja}` : "Ver produto";

  return `
    <article class="card">
      <img
        src="${produto.imagem}"
        alt="${produto.nome}"
        onerror="this.src='https://via.placeholder.com/400x300?text=Produto+Pense+Gato';"
      />
      <div class="info">
        <span class="badge-loja">${produto.loja || "Loja"}</span>
        <h4>${produto.nome}</h4>
        <p>${produto.descricao}</p>
        <a
          href="${produto.link}"
          target="_blank"
          rel="noopener noreferrer"
          class="btn"
        >
          ${lojaTexto}
        </a>
      </div>
    </article>
  `;
}

// ===== Renderizar produtos na página (respeitando filtro) =====
function renderizarProdutos() {
  const container = document.getElementById("lista-produtos");
  if (!container) return;

  let listaFiltrada = produtos;

  if (categoriaAtiva && categoriaAtiva !== "Todos") {
    listaFiltrada = produtos.filter(
      p => p.categoria && p.categoria === categoriaAtiva
    );
  }

  if (!listaFiltrada.length) {
    container.innerHTML =
      "<p style='color:#555;'>Ainda não temos produtos nesta categoria. 😺</p>";
    return;
  }

  const html = listaFiltrada.map(criarCardProduto).join("");
  container.innerHTML = html;
}

// ===== Renderizar filtros de categoria =====
function renderizarFiltrosCategorias() {
  const container = document.getElementById("filtros-categorias");
  if (!container) return;

  // Pega categorias únicas dos produtos
  const categoriasUnicas = Array.from(
    new Set(produtos.map(p => p.categoria).filter(Boolean))
  ).sort();

  // "Todos" sempre vem primeiro
  const categoriasComTodos = ["Todos", ...categoriasUnicas];

  const html = categoriasComTodos
    .map(cat => {
      const ativo = cat === categoriaAtiva ? "ativo" : "";
      return `
        <button
          class="filtro-btn ${ativo}"
          data-categoria="${cat}"
          type="button"
        >
          ${cat}
        </button>
      `;
    })
    .join("");

  container.innerHTML = html;

  // Listeners de clique nos filtros
  container.querySelectorAll(".filtro-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const categoria = btn.getAttribute("data-categoria");
      categoriaAtiva = categoria;

      // Atualiza estado visual dos botões
      container.querySelectorAll(".filtro-btn").forEach(b =>
        b.classList.remove("ativo")
      );
      btn.classList.add("ativo");

      // Re-renderiza produtos
      renderizarProdutos();
    });
  });
}

// ===== Scroll suave para âncoras do menu =====
function ativarScrollSuave() {
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener("click", function (e) {
      const href = this.getAttribute("href");
      // Ignora anchors vazios
      if (!href || href === "#") return;

      const alvo = document.querySelector(href);
      if (alvo) {
        e.preventDefault();
        alvo.scrollIntoView({ behavior: "smooth" });
      }
    });
  });
}

// ===== Inicialização =====
document.addEventListener("DOMContentLoaded", () => {
  renderizarFiltrosCategorias();
  renderizarProdutos();
  ativarScrollSuave();
  console.log("Pense Gato carregado com filtros de categoria 😼");
});
