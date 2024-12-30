/*
 * LC Waikiki Product Carousel
 * Built by Rüzgar İmren
 */
(function() {
    const validDomains = ['lcw.com', 'lcwaikiki.com'];
    const isValidDomain = validDomains.some(domain => window.location.hostname.includes(domain));
    
    if (!isValidDomain) return;

    const isProductPage = window.location.pathname.includes('kaban') || 
                         window.location.pathname.includes('urun') ||
                         window.location.pathname.includes('erkek') ||
                         window.location.pathname.match(/[a-z]+-[a-z]+-[0-9]+$/) ||
                         $('.product-detail, .product-info').length > 0;
                         
    if (!isProductPage) return;

    const addInitialStyles = () => {
        const style = document.createElement('style');
        style.textContent = `
            .carousel-button {
                background: rgba(0, 0, 0, 0.5);
                color: white;
                border: none;
                padding: 10px 15px;
                cursor: pointer;
                z-index: 1;
            }
        `;
        document.head.appendChild(style);
    };
    addInitialStyles();

    function loadJQuery() {
        return new Promise((resolve, reject) => {
            if (typeof jQuery !== 'undefined') {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://code.jquery.com/jquery-3.6.0.min.js';
            script.onload = resolve;
            script.onerror = () => reject(new Error('Failed to load jQuery'));
            document.head.appendChild(script);
        });
    }

    loadJQuery()
        .then(() => {
            initCarousel();
        })
        .catch(error => {
            console.error('Failed to initialize carousel:', error);
        });

    function initCarousel() {
        $(document).ready(() => {
            const state = {
                products: [],
                currentIndex: 0,
                favorites: new Set()
            };

            const init = async () => {
                try {
                    const isLocalStorageAvailable = (() => {
                        try {
                            localStorage.setItem('test', 'test');
                            localStorage.removeItem('test');
                            return true;
                        } catch (e) {
                            return false;
                        }
                    })();

                    if (!isLocalStorageAvailable) {
                        console.warn('localStorage not available, favorites will not persist');
                    }

                    const cachedProducts = localStorage.getItem('carouselProducts');
                    const cachedFavorites = localStorage.getItem('favoriteProducts');
                    
                    if (cachedProducts) {
                        state.products = JSON.parse(cachedProducts);
                        if (cachedFavorites) {
                            state.favorites = new Set(JSON.parse(cachedFavorites));
                        }
                    } else {
                        const url = 'https://gist.githubusercontent.com/sevindi/5765c5812bbc8238a38b3cf52f233651/raw/56261d81af8561bf0a7cf692fe572f9e1e91f372/products.json';
                        const response = await fetch(url);
                        
                        if (!response.ok) {
                            throw new Error(`HTTP error! status: ${response.status}`);
                        }
                        
                        state.products = await response.json();
                        localStorage.setItem('carouselProducts', JSON.stringify(state.products));
                    }

                    if (!state.products || !state.products.length) {
                        console.error('No products available');
                        return;
                    }

                    buildHTML();
                    buildCSS();
                    setEvents();
                } catch (error) {
                    console.error('Error initializing carousel:', error);
                    try {
                        await fetchProducts();
                        buildHTML();
                        buildCSS();
                        setEvents();
                    } catch (e) {
                        console.error('Fatal error, carousel could not be initialized:', e);
                    }
                }
            };

            const buildHTML = () => {
                const productDetail = $('.product-detail');
                if (productDetail.length) {
                    const html = `
                        <div class="carousel-container">
                            <h2>You Might Also Like</h2>
                            <div class="carousel-wrapper">
                                <button class="carousel-button prev">❮</button>
                                <div class="carousel-content"></div>
                                <button class="carousel-button next">❯</button>
                            </div>
                        </div>
                    `;
                    productDetail.after(html);
                    updateCarousel();
                    return;
                }
            };

            const buildCSS = () => {
                const css = `
                    .carousel-container {
                        max-width: 1200px;
                        margin: 20px auto;
                        padding: 0 20px;
                    }
                    .carousel-wrapper {
                        position: relative;
                        display: flex;
                        align-items: center;
                        gap: 10px;
                    }
                    .carousel-content {
                        display: flex;
                        overflow: hidden;
                        scroll-behavior: smooth;
                        gap: 20px;
                        -ms-overflow-style: none;
                        scrollbar-width: none;
                    }
                    .carousel-content::-webkit-scrollbar {
                        display: none;
                    }
                    .product-card {
                        flex: 0 0 calc((100% - (6 * 20px)) / 6.5);
                        min-width: calc((100% - (6 * 20px)) / 6.5);
                        position: relative;
                        transition: transform 0.3s;
                    }
                    .product-card img {
                        width: 100%;
                        height: auto;
                    }
                    .product-card .heart-icon {
                        position: absolute;
                        top: 10px;
                        right: 10px;
                        cursor: pointer;
                        font-size: 24px;
                        color: #ccc;
                        background: rgba(255, 255, 255, 0.8);
                        border-radius: 50%;
                        padding: 5px;
                        width: 35px;
                        height: 35px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        transition: all 0.3s ease;
                        z-index: 2;
                    }
                    .product-card .heart-icon:hover {
                        transform: scale(1.1);
                    }
                    .product-card .heart-icon.active {
                        color: #0066cc;
                        background: rgba(255, 255, 255, 0.95);
                    }
                    .product-card a {
                        text-decoration: none;
                        color: inherit;
                        display: block;
                    }
                    .product-card:hover {
                        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                    }
                    .product-info {
                        padding: 10px;
                    }
                    .product-price {
                        font-weight: bold;
                        color: #333;
                    }
                    @media (max-width: 1024px) {
                        .product-card {
                            flex: 0 0 calc(100% / 4.5);
                        }
                    }
                    @media (max-width: 768px) {
                        .product-card {
                            flex: 0 0 calc(100% / 3.5);
                        }
                    }
                    @media (max-width: 480px) {
                        .product-card {
                            flex: 0 0 calc(100% / 2.5);
                        }
                    }
                    @keyframes heartClick {
                        0% { transform: scale(1); }
                        50% { transform: scale(1.2); }
                        100% { transform: scale(1); }
                    }
                    .product-card .heart-icon.clicking {
                        animation: heartClick 0.2s ease;
                    }
                `;

                $('<style>').addClass('carousel-style').html(css).appendTo('head');
            };

            const updateCarousel = () => {
                const fragment = document.createDocumentFragment();
                state.products.forEach(product => {
                    const productElement = $(productCard).appendTo(fragment);
                });
                $('.carousel-content').empty().append(fragment);
            };

            const setEvents = () => {
                $('.carousel-button.prev').on('click', () => {
                    const container = $('.carousel-content');
                    const cardWidth = container.find('.product-card').first().outerWidth(true);
                    container.stop(true).animate({
                        scrollLeft: container.scrollLeft() - cardWidth
                    }, 300, 'easeOutQuad');
                });

                $('.carousel-button.next').on('click', () => {
                    const container = $('.carousel-content');
                    const cardWidth = container.find('.product-card').first().outerWidth(true);
                    container.stop(true).animate({
                        scrollLeft: container.scrollLeft() + cardWidth
                    }, 300, 'easeOutQuad');
                });

                $(document).on('click', '.heart-icon', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    const $heart = $(this);
                    const productId = $heart.data('id');
                    
                    $heart.addClass('clicking');
                    setTimeout(() => $heart.removeClass('clicking'), 200);
                    
                    if (state.favorites.has(productId)) {
                        state.favorites.delete(productId);
                        $heart.removeClass('active');
                    } else {
                        state.favorites.add(productId);
                        $heart.addClass('active');
                    }
                    
                    try {
                        localStorage.setItem('favoriteProducts', JSON.stringify([...state.favorites]));
                    } catch (error) {
                        console.error('Error saving favorites:', error);
                    }
                });

                $(document).on('click', '.product-card a', function(e) {
                    if (!e.ctrlKey && !e.shiftKey && !e.metaKey) {
                        e.preventDefault();
                        window.open(this.href, '_blank', 'noopener');
                    }
                });
            };

            const cleanup = () => {
                $('.carousel-button.prev, .carousel-button.next').off('click');
                $(document).off('click', '.heart-icon');
                $(document).off('click', '.product-card a');
            };

            $(window).on('unload', cleanup);

            init();
        });
    }
})();