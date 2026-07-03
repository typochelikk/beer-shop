document.addEventListener('DOMContentLoaded', function () {

    // ==========================================
    // ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ХРАНИЛИЩА (LOCALSTORAGE)
    // ==========================================
    function getCart() { return JSON.parse(localStorage.getItem('beer_cart')) || []; }
    function saveCart(cart) { localStorage.setItem('beer_cart', JSON.stringify(cart)); renderCartReceipt(); }

    function getFilters() {
        return JSON.parse(localStorage.getItem('beer_filters')) || { search: "", styles: [], abv: "abv-all" };
    }
    function saveFilters(filters) { localStorage.setItem('beer_filters', JSON.stringify(filters)); }

    // Определяем, на какой мы странице каталога прямо сейчас
    const isPage1 = window.location.pathname.includes('catalog.html') || window.location.pathname.endsWith('/');
    const isPage2 = window.location.pathname.includes('catalog-2.html');
    const isCatalog = isPage1 || isPage2;

    // Справочник всех 9 товаров проекта, чтобы поиск «знал» их на любой странице
    const allBeerItems = [
        { name: "Atomic IPA", style: "ipa", abv: 6.5, page: "catalog.html" },
        { name: "Dark Stout", style: "stout", abv: 5.8, page: "catalog.html" },
        { name: "Mango Sour", style: "sour", abv: 4.5, page: "catalog.html" },
        { name: "Dark Beer", style: "lager", abv: 5.0, page: "catalog.html" },
        { name: "Hoopy Blanche", style: "blanche", abv: 4.8, page: "catalog.html" },
        { name: "Double Horizon", style: "ipa", abv: 8.2, page: "catalog.html" },
        { name: "Pacific APA", style: "ipa", abv: 5.2, page: "catalog-2.html" },
        { name: "Ruby Quad", style: "quad", abv: 10.5, page: "catalog-2.html" },
        { name: "Berry Gose", style: "sour", abv: 4.2, page: "catalog-2.html" }
    ];

    // ==========================================
    // ИСПРАВЛЕННЫЙ СКВОЗНОЙ ПОИСК И ФИЛЬТРЫ
    // ==========================================
    const searchInput = document.getElementById('beer-search');
    const searchForm = document.querySelector('.search-form');
    const checkboxes = document.querySelectorAll('.filter-checkbox input');
    const radios = document.querySelectorAll('input[name="abv-group"]');
    const beerCards = document.querySelectorAll('.beer-card');

    // Функция синхронизации элементов интерфейса с сохраненным состоянием памяти
    function restoreUIState() {
        const state = getFilters();
        
        if (searchInput && state.search) searchInput.value = state.search;
        
        checkboxes.forEach(box => {
            if (state.styles.includes(box.id)) box.checked = true;
        });

        radios.forEach(radio => {
            if (radio.id === state.abv) radio.checked = true;
        });
    }

    // Главная функция глобальной фильтрации
    function applyGlobalFilters() {
        if (!isCatalog) return;

        // 1. Считываем данные с инпутов
        const currentSearch = searchInput ? searchInput.value.toLowerCase().trim() : "";
        
        let currentStyles = [];
        checkboxes.forEach(box => { if (box.checked) currentStyles.push(box.id); });
        
        let currentAbv = "abv-all";
        radios.forEach(radio => { if (radio.checked) currentAbv = radio.id; });

        // 2. Запоминаем этот выбор в память браузера, чтобы он не пропал при переходе страниц
        const newState = { search: currentSearch, styles: currentStyles, abv: currentAbv };
        saveFilters(newState);

        // 3. Умное перелистывание пагинации (если ищем товар с другой страницы)
        if (currentSearch.length > 0) {
            // Ищем, на каких страницах вообще есть совпадения по тексту
            const matchedItems = allBeerItems.filter(item => item.name.toLowerCase().includes(currentSearch));
            if (matchedItems.length > 0) {
                const targetPage = matchedItems[0].page;
                // Если мы сейчас на странице 1, а товар на странице 2 — автоматически переходим туда
                if (isPage1 && targetPage === "catalog-2.html") {
                    window.location.href = "catalog-2.html";
                    return;
                }
                // Если мы на странице 2, а искомый товар на первой — возвращаемся
                if (isPage2 && targetPage === "catalog.html") {
                    window.location.href = "catalog.html";
                    return;
                }
            }
        }

        // 4. Локальное скрытие/отображение карточек на текущей активной странице
        beerCards.forEach(card => {
            const beerTitle = card.querySelector('.card-title').textContent.toLowerCase();
            const cardText = card.querySelector('.card-text').textContent;

            // Проверка по поисковой строке
            const matchesSearch = currentSearch === "" || beerTitle.includes(currentSearch);

            // Проверка по чекбоксам стилей
            let matchesStyle = currentStyles.length === 0;
            currentStyles.forEach(style => {
                if (beerTitle.includes(style) || cardText.toLowerCase().includes(style)) {
                    matchesStyle = true;
                }
            });

            // Проверка по круглым кнопкам крепости (ABV)
            let matchesAbv = true;
            const abvMatch = cardText.match(/ABV:\s*([0-9.]+)/);
            if (abvMatch && currentAbv !== "abv-all") {
                const abvValue = parseFloat(abvMatch[1]);
                if (currentAbv === "abv-light" && abvValue > 5.0) matchesAbv = false;
                if (currentAbv === "abv-strong" && abvValue <= 5.0) matchesAbv = false;
            }

            // Итоговый вывод
            if (matchesSearch && matchesStyle && matchesAbv) {
                card.parentElement.style.display = "block";
            } else {
                card.parentElement.style.display = "none";
            }
        });
    }

    // Инициализация фильтров при загрузке страниц
    if (isCatalog) {
        restoreUIState(); // Сначала восстанавливаем галочки и текст из памяти
        applyGlobalFilters(); // Сразу применяем фильтр

        // Навешиваем живых слушателей на события изменений
        if (searchInput) searchInput.addEventListener('input', applyGlobalFilters);
        if (searchForm) searchForm.addEventListener('submit', function (e) { e.preventDefault(); applyGlobalFilters(); });
        checkboxes.forEach(box => box.addEventListener('change', applyGlobalFilters));
        radios.forEach(radio => radio.addEventListener('change', applyGlobalFilters));
    }


    // ==========================================
    // КОРЗИНА И УПРАВЛЕНИЕ ЧЕКОМ ЗАКАЗА
    // ==========================================
    const buyButtons = document.querySelectorAll('.btn-buy');
    buyButtons.forEach(btn => {
        if (btn.hasAttribute('data-name') && !btn.classList.contains('btn-submit-order-large')) {
            btn.addEventListener('click', function (e) {
                e.preventDefault();
                const beerName = this.getAttribute('data-name');
                const beerPrice = parseInt(this.getAttribute('data-price'));

                let cart = getCart();
                const existingItem = cart.find(item => item.name === beerName);

                if (existingItem) {
                    existingItem.quantity += 1;
                } else {
                    cart.push({ name: beerName, price: beerPrice, quantity: 1 });
                }

                saveCart(cart);

                const originalText = this.textContent;
                this.textContent = "✔ Добавлено!";
                this.style.backgroundColor = "#2b1f1d";
                setTimeout(() => {
                    this.textContent = originalText;
                    this.style.backgroundColor = "#4a2f25";
                }, 800);
            });
        }
    });

    function renderCartReceipt() {
        const cartListElement = document.getElementById('cart-items-list');
        if (!cartListElement) return;

        const cart = getCart();
        const deliveryElement = document.getElementById('receipt-delivery');
        const totalElement = document.getElementById('receipt-total');

        if (cart.length === 0) {
            cartListElement.innerHTML = "<li class='text-muted py-2'>Ваша корзина пуста. Скорее добавьте пиво в каталоге!</li>";
            if (deliveryElement) deliveryElement.textContent = "Доставка: 0 руб.";
            if (totalElement) totalElement.textContent = "Итого: 0 руб.";
            return;
        }

        cartListElement.innerHTML = "";
        let goodsSum = 0;

        cart.forEach((item, index) => {
            goodsSum += item.price * item.quantity;

            const li = document.createElement('li');
            li.className = "d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom-dashed";
            li.innerHTML = `
                <div class="cart-item-info">
                    <span class="font-weight-bold" style="color: #4a2f25;">${item.name}</span> 
                    <span class="text-muted" style="font-size: 0.9rem;">(${item.price} руб./шт.)</span>
                </div>
                <div class="cart-item-controls d-flex align-items-center">
                    <button type="button" class="btn-qty-minus btn btn-sm btn-outline-secondary px-2 py-0 font-weight-bold" data-index="${index}">-</button>
                    <span class="mx-3 font-weight-bold" style="font-size: 1.1rem; color: #331f18;">${item.quantity} шт.</span>
                    <button type="button" class="btn-qty-plus btn btn-sm btn-outline-secondary px-2 py-0 font-weight-bold" data-index="${index}">+</button>
                    <button type="button" class="btn-qty-del btn btn-sm btn-danger ml-3 px-2 py-0" data-index="${index}" style="font-size: 0.8rem;">&times; Удалить</button>
                </div>
            `;
            cartListElement.appendChild(li);
        });
        const pickupRadio = document.getElementById('toggle-pickup');
        let deliveryPrice = (pickupRadio && pickupRadio.checked) ? 0 : 300;

        if (deliveryElement) deliveryElement.textContent = `Доставка: ${deliveryPrice} руб.`;
        if (totalElement) totalElement.textContent = `Итого: ${goodsSum + deliveryPrice} руб.`;
    }

    let cartListElement = document.getElementById('cart-items-list');
    if (cartListElement) {
        cartListElement.addEventListener('click', function (e) {
            let cart = getCart();
            const index = parseInt(e.target.getAttribute('data-index'));

            if (isNaN(index)) return;

            if (e.target.classList.contains('btn-qty-plus')) {
                cart[index].quantity += 1;
                saveCart(cart);
            } 
            else if (e.target.classList.contains('btn-qty-minus')) {
                if (cart[index].quantity > 1) {
                    cart[index].quantity -= 1;
                } else {
                    cart.splice(index, 1);
                }
                saveCart(cart);
            } 
            else if (e.target.classList.contains('btn-qty-del')) {
                cart.splice(index, 1);
                saveCart(cart);
            }
        });

        const deliveryRadios = document.querySelectorAll('input[name="delivery-type"]');
        deliveryRadios.forEach(radio => {
            radio.addEventListener('change', renderCartReceipt);
        });
    }

    renderCartReceipt();

    // ==========================================
    // ВАЛИДАЦИЯ И ОТПРАВКА ФОРМЫ ЗАКАЗА
    // ==========================================
    const orderForm = document.getElementById('order-form');
    if (orderForm) {
        orderForm.addEventListener('submit', function (event) {
            event.preventDefault();

            const fioInput = document.getElementById('user-fio');
            const phoneInput = document.getElementById('user-phone');
            const addressInput = document.getElementById('user-address');
            const cart = getCart();

            const modalBody = document.getElementById('modalBody');
            const modalTitle = document.getElementById('modalTitle');

            if (cart.length === 0) {
                modalTitle.textContent = "Ваша корзина пуста";
                modalBody.innerHTML = "⚠️ Невозможно оформить заказ. Пожалуйста, вернитесь в каталог и выберите товары.";
                const statusModal = document.getElementById('statusModal');
                if (statusModal) statusModal.classList.add('show');
                return;
            }

            const phoneRegex = /^(?:\+7|8)?[\s\-]?\(?\d{3}\)?[\s\-]?\d{3}[\s\-]?\d{2}[\s\-]?\d{2}$/;
            let isValid = true;
            let errorMessage = "";

            if (!fioInput.value.trim()) {
                isValid = false;
                errorMessage += "Поле 'ФИО' обязательно для заполнения.<br>";
            }
            if (!addressInput.value.trim()) {
                isValid = false;
                errorMessage += "Поле 'Адрес' обязательно для заполнения.<br>";
            }
            if (!phoneRegex.test(phoneInput.value.trim())) {
                isValid = false;
                errorMessage += "Введите корректный номер мобильного телефона.<br>";
            }

            if (isValid) {
                modalTitle.textContent = "Заказ успешно оформлен!";
                modalBody.innerHTML = "🎉 Спасибо за заказ! Данные успешно обработаны и отправлены.";
                localStorage.removeItem('beer_cart');
                localStorage.removeItem('beer_filters'); // Очищаем фильтры после покупки
                orderForm.reset();
                renderCartReceipt(); 
            } else {
                modalTitle.textContent = "Ошибка заполнения формы";
                modalBody.innerHTML = `⚠️ Найдена ошибка:<br><br>${errorMessage}`;
            }

            const statusModal = document.getElementById('statusModal');
            if (statusModal) {
                statusModal.classList.add('show');
            }
        });
    }

    const statusModalInstance = document.getElementById('statusModal');
    if (statusModalInstance) {
        statusModalInstance.addEventListener('click', function (e) {
            if (e.target.classList.contains('btn-modal-close') || e.target.classList.contains('close') || e.target === statusModalInstance) {
                statusModalInstance.classList.remove('show');
            }
        });
    }
});