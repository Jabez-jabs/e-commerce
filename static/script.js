// static/script.js

// Helper: render star rating
function renderStars(rating) {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    let starsHtml = '';
    for (let i = 0; i < fullStars; i++) starsHtml += '★';
    if (halfStar) starsHtml += '½';
    for (let i = starsHtml.length; i < 5; i++) starsHtml += '☆';
    return starsHtml;
}

// Stock badge class
function getStockClass(stock) {
    if (stock <= 0) return 'out-stock';
    if (stock < 10) return 'low-stock';
    return 'in-stock';
}
function getStockText(stock) {
    if (stock <= 0) return 'Out of Stock';
    if (stock < 10) return `Only ${stock} left`;
    return 'In Stock';
}

// Render product card (used in home & recommendations)
function renderProductCard(product, clickable = true) {
    const card = document.createElement('div');
    card.className = 'product-card';
    if (clickable) {
        card.addEventListener('click', () => {
            window.location.href = `/product/${product.id}`;
        });
    }
    const stockClass = getStockClass(product.stock);
    const stockText = getStockText(product.stock);
    card.innerHTML = `
        <img src="${product.image_url}" alt="${product.name}">
        <div class="product-info">
            <h3>${product.name}</h3>
            <div class="brand">${product.brand}</div>
            <div class="rating">
                <span class="stars">${renderStars(product.rating)}</span>
                <span class="review-count">(${product.reviews_count})</span>
            </div>
            <div class="price-block">
                <span class="final-price">₹${product.final_price}</span>
                <span class="dynamic-original">₹${product.dynamic_price}</span>
                <span class="discount-badge">${product.discount_percent}% off</span>
            </div>
            <div class="stock-badge ${stockClass}">${stockText}</div>
            <div class="delivery">🚚 Delivery in ${product.delivery_days} days</div>
        </div>
    `;
    return card;
}

// Global product list for sorting/filtering
let allProducts = [];

// Homepage logic
if (window.location.pathname === '/') {
    const container = document.getElementById('productsContainer');
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const categoryFilter = document.getElementById('categoryFilter');
    const sortBy = document.getElementById('sortBy');
    const resetBtn = document.getElementById('resetBtn');

    let currentQuery = '';

    async function fetchProducts(query = '') {
        let url = query ? `/api/search?q=${encodeURIComponent(query)}` : '/api/products';
        const res = await fetch(url);
        const products = await res.json();
        allProducts = products;
        applyFiltersAndSort();
    }

    function applyFiltersAndSort() {
        let filtered = [...allProducts];
        // Category filter
        const cat = categoryFilter.value;
        if (cat !== 'all') {
            filtered = filtered.filter(p => p.category === cat);
        }
        // Sorting
        const sortType = sortBy.value;
        if (sortType === 'price_asc') filtered.sort((a,b) => a.final_price - b.final_price);
        else if (sortType === 'price_desc') filtered.sort((a,b) => b.final_price - a.final_price);
        else if (sortType === 'rating_desc') filtered.sort((a,b) => b.rating - a.rating);
        else if (sortType === 'popularity') filtered.sort((a,b) => b.views - a.views);
        // default: keep as is (API order)
        renderProducts(filtered);
    }

    function renderProducts(products) {
        if (!products.length) {
            container.innerHTML = '<div style="text-align:center;padding:3rem;">✨ No products match ✨</div>';
            return;
        }
        container.innerHTML = '';
        products.forEach(prod => {
            container.appendChild(renderProductCard(prod, true));
        });
    }

    function handleSearch() {
        currentQuery = searchInput.value.trim();
        fetchProducts(currentQuery);
    }

    searchBtn.addEventListener('click', handleSearch);
    searchInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleSearch(); });
    categoryFilter.addEventListener('change', applyFiltersAndSort);
    sortBy.addEventListener('change', applyFiltersAndSort);
    resetBtn.addEventListener('click', () => {
        searchInput.value = '';
        categoryFilter.value = 'all';
        sortBy.value = 'default';
        currentQuery = '';
        fetchProducts('');
    });

    fetchProducts('');
}

// Product detail page logic
if (window.location.pathname.startsWith('/product/')) {
    const productId = window.location.pathname.split('/')[2];
    const detailDiv = document.getElementById('productDetail');
    const recContainer = document.getElementById('recommendations');

    async function loadProductDetail() {
        const res = await fetch(`/api/product/${productId}`);
        const product = await res.json();
        if (product.error) {
            detailDiv.innerHTML = `<p>${product.error}</p>`;
            return;
        }
        const stockClass = getStockClass(product.stock);
        const stockText = getStockText(product.stock);
        detailDiv.innerHTML = `
            <div class="detail-img">
                <img src="${product.image_url}" alt="${product.name}">
            </div>
            <div class="detail-info">
                <h2>${product.name}</h2>
                <div class="brand">${product.brand}</div>
                <div class="rating">
                    <span class="stars">${renderStars(product.rating)}</span>
                    <span class="review-count">${product.reviews_count} reviews</span>
                </div>
                <p>${product.description}</p>
                <div class="detail-price">
                    <div class="price-block" style="margin:0 0 0.5rem 0">
                        <span class="final-price" style="font-size:2rem;">₹${product.final_price}</span>
                        <span class="dynamic-original">₹${product.dynamic_price}</span>
                        <span class="discount-badge">${product.discount_percent}% off</span>
                    </div>
                    <div class="stock-badge ${stockClass}" style="margin-right:0.8rem;">${stockText}</div>
                    <div class="views-badge">🔥 Viewed ${product.views} times</div>
                    <div class="delivery" style="margin-top:0.8rem;">🚚 Delivery in ${product.delivery_days} days</div>
                </div>
            </div>
        `;
        // Render recommendations
        recContainer.innerHTML = '';
        if (product.recommendations.length === 0) {
            recContainer.innerHTML = '<p>No recommendations available.</p>';
            return;
        }
        product.recommendations.forEach(rec => {
            // rec already has final_price, rating, etc.
            recContainer.appendChild(renderProductCard(rec, true));
        });
    }
    loadProductDetail();
}