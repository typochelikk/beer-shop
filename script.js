document.addEventListener('DOMContentLoaded', function () {

    // ==========================================
    // 1. ЖИВОЙ ПОИСК И КНОПКА «НАЙТИ»
    // ==========================================
    const searchInput = document.getElementById('beer-search');
    const searchForm = document.querySelector('.search-form');
    const beerCards = document.querySelectorAll('.beer-card');

    function executeSearch() {
        if (!searchInput) return;
        const query = searchInput.value.toLowerCase().trim();
        beerCards.forEach(card => {
            const beerName = card.querySelector('.card-title').textContent.toLowerCase();
            if (beerName.includes(query)) {
                card.parentElement.style.display = "block";
            } else {
                card.parentElement.style.display = "none";
            }
        });
    }

    if (searchInput) searchInput.addEventListener('input', executeSearch);
    if (searchForm) {
        searchForm.addEventListener('submit', function (e) {
            e.preventDefault();
            executeSearch();
        });
    }

    // ==========================================
    // 2. ФИЛЬТРЫ СТИЛЯ И КРЕПОСТИ
    // ==========================================
    const checkboxes = document.querySelectorAll('.filter-checkbox input');
    const radios = document.querySelectorAll('input[name="abv-group"]');

    function applyFilters() {
        if (checkboxes.length === 0 && radios.length === 0) return;

        let activeStyles = [];
        checkboxes.forEach(box => { if (box.checked) activeStyles.push(box.id); });

        let selectedAbv = "all";
        radios.forEach(radio => { if (radio.checked) selectedAbv = radio.id; });

        beerCards.forEach(card => {
            const cardText = card.querySelector('.card-text').textContent;
            const beerTitle = card.querySelector('.card-title').textContent.toLowerCase();
            
            let matchesStyle = activeStyles.length === 0;
            activeStyles.forEach(style => {
                if (beerTitle.includes(style) || cardText.toLowerCase().includes(style)) {
                    matchesStyle = true;
                }
            });

            let matchesAbv = true;
            const abvMatch = cardText.match(/ABV:\s*([0-9.]+)/);
            if (abvMatch && selectedAbv !== "abv-all") {
                const abvValue = parseFloat(abvMatch[1]);
                if (selectedAbv === "abv-light" && abvValue > 5.0) matchesAbv = false;
                if (selectedAbv === "abv-strong" && abvValue <= 5.0) matchesAbv = false;
            }

            card.parentElement.style.display = (matchesStyle && matchesAbv) ? "block" : "none";
        });
    }

    checkboxes.forEach(box => box.addEventListener('change', applyFilters));
    radios.forEach(radio => radio.addEventListener('change', applyFilters));

    // ==========================================
    // 3. СВЕРХИНТЕРАКТИВНАЯ КОРЗИНА И УПРАВЛЕНИЕ ТОВАРАМИ
    // ==========================================
    
    function getCart() {
        return JSON.parse(localStorage.getItem('beer_cart')) || [];
    }

    function saveCart(cart) {
        localStorage.setItem('beer_cart', JSON.stringify(cart));
        renderCartReceipt(); // Перерисовываем чек при любых изменениях
    }

    // Добавление товара из каталога
    const buyButtons = document.querySelectorAll('.btn-buy');
    buyButtons.forEach(btn => {
        // Защита: проверяем, что кнопка имеет атрибут данных товара и это не кнопка заказа
        if (btn.hasAttribute('data-name') && !btn.classList.contains('btn-submit-order-large')) {
            btn.addEventListener('click', function (e) {
                e.preventDefault();
                const beerName = this.getAttribute('data-name');
                const beerPrice = parseInt(this.getAttribute('data-price'));

                let cart = getCart();
                // Ищем, есть ли уже такое пиво в корзине
                const existingItem = cart.find(item => item.name === beerName);

                if (existingItem) {
                    existingItem.quantity += 1; // Увеличиваем счетчик количества
                } else {
                    cart.push({ name: beerName, price: beerPrice, quantity: 1 }); // Добавляем новый сорт
                }

                saveCart(cart);

                // Визуальный отклик на кнопке
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

    // Функция отрисовки и интерактивного управления внутри чека заказа
    function renderCartReceipt() {
        const cartListElement = document.getElementById('cart-items-list');
        if (!cartListElement) return; // Если мы не на странице заказа, выходим

        const cart = getCart();
        const deliveryElement = document.getElementById('receipt-delivery');
        const totalElement = document.getElementById('receipt-total');

        if (cart.length === 0) {
            cartListElement.innerHTML = "<li class='text-muted py-2'>Ваша корзина пуста. Скорее добавьте пиво в каталоге!</li>";
            if (deliveryElement) deliveryElement.textContent = "Доставка: 0 руб.";
            if (totalElement) totalElement.textContent = "Итого: 0 руб.";
            return;
        }

        cartListElement.innerHTML = ""; // Очищаем старый список
        let goodsSum = 0;

        cart.forEach((item, index) => {
            goodsSum += item.price * item.quantity;

            // Создаем красивую интерактивную строчку для каждого товара
            const li = document.createElement('li');
            li.className = "d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom-dashed";
            li.innerHTML = `
                <div class="cart-item-info">
                    <span class="font-weight-bold" style="color: #4a2f25;">${item.name}</span> 
                    <span class="text-muted" style="font-size: 0.9rem;">(${item.price} руб./шт.)</span>
                </div>
                <div class="cart-item-controls d-flex align-items-center">
                    <!-- Кнопка минус -->
                    <button class="btn-qty-minus btn btn-sm btn-outline-secondary px-2 py-0 font-weight-bold" data-index="${index}">-</button>
                    <!-- Количество -->
                    <span class="mx-3 font-weight-bold" style="font-size: 1.1rem; color: #331f18;">${item.quantity} шт.</span>
                    <!-- Кнопка плюс -->
                    <button class="btn-qty-plus btn btn-sm btn-outline-secondary px-2 py-0 font-weight-bold" data-index="${index}">+</button>
                    <!-- Кнопка полного удаления -->
                    <button class="btn-qty-del btn btn-sm btn-danger ml-3 px-2 py-0" data-index="${index}" style="font-size: 0.8rem;">&times; Удалить</button>
                </div>
            `;
            cartListElement.appendChild(li);
        });

        // Расчет стоимости доставки на основе выбранной радиокнопки
        const pickupRadio = document.getElementById('toggle-pickup');
        let deliveryPrice = (pickupRadio && pickupRadio.checked) ? 0 : 300;

        if (deliveryElement) deliveryElement.textContent = `Доставка: ${deliveryPrice} руб.`;
        if (totalElement) totalElement.textContent = `Итого: ${goodsSum + deliveryPrice} руб.`;
    }

    // Слушаем клики внутри чека по кнопкам изменения количества (+ / - / удалить)
    cartListElement = document.getElementById('cart-items-list');
    if (cartListElement) {
        cartListElement.addEventListener('click', function (e) {
            let cart = getCart();
            const index = parseInt(e.target.getAttribute('data-index'));

            if (isNaN(index)) return;

            if (e.target.classList.contains('btn-qty-plus')) {
                cart[index].quantity += 1; // Кликнули на плюс
                saveCart(cart);
            } 
            else if (e.target.classList.contains('btn-qty-minus')) {
                if (cart[index].quantity > 1) {
                    cart[index].quantity -= 1; // Кликнули на минус (уменьшаем, если больше 1)
                } else {
                    cart.splice(index, 1); // Если был 1 шт, то при нажатии на минус — полностью удаляем
                }
                saveCart(cart);
            } 
            else if (e.target.classList.contains('btn-qty-del')) {
                cart.splice(index, 1); // Кликнули на кнопку "Удалить"
                saveCart(cart);
            }
        });

        // Слушаем переключение радиокнопок доставки для мгновенного обновления суммы чека
        const deliveryRadios = document.querySelectorAll('input[name="delivery-type"]');
        deliveryRadios.forEach(radio => {
            radio.addEventListener('change', renderCartReceipt);
        });
    }

    // Вызываем отрисовку корзины при первичной загрузке страницы заказа
    renderCartReceipt();

    // ==========================================
    // 4. ВАЛИДАЦИЯ И ОТПРАВКА ЗАКАЗА
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

            console.log("--- Валидация оформления заказа ---");
            console.log("ФИО:", fioInput.value.trim());
            console.log("Телефон:", phoneInput.value.trim());
            console.log("Адрес:", addressInput.value.trim());
            console.log("Товары в заказе:", cart);
            console.log("Статус валидации:", isValid ? "Успешно" : "Ошибка");

            if (isValid) {
                modalTitle.textContent = "Заказ успешно оформлен!";
                modalBody.innerHTML = "🎉 Спасибо за заказ! Данные успешно обработаны. Логи отправлены в консоль (F12).";
                localStorage.removeItem('beer_cart'); 
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

    // ЛОГИКА ЗАКРЫТИЯ ОКНА ПРИ КЛИКЕ
    const statusModalInstance = document.getElementById('statusModal');
    if (statusModalInstance) {
        statusModalInstance.addEventListener('click', function (e) {
            if (e.target.classList.contains('btn-modal-close') || e.target.classList.contains('close') || e.target === statusModalInstance) {
                statusModalInstance.classList.remove('show');
            }
        });
    }
});
