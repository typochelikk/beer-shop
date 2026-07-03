document.addEventListener('DOMContentLoaded', function () {

    // === 1. ВНУТРЕННЯЯ ПАМЯТЬ КОРЗИНЫ ===
    function getCart() {
        return JSON.parse(localStorage.getItem('beer_cart')) || [];
    }

    function saveCart(cart) {
        localStorage.setItem('beer_cart', JSON.stringify(cart));
        renderCartReceipt(); 
    }

    // === 2. КНОПКИ КУПИТЬ В КАТАЛОГЕ ===
    const buyButtons = document.querySelectorAll('.btn-buy');
    buyButtons.forEach(btn => {
        if (btn.hasAttribute('data-name')) {
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

    // === 3. ОТРИСОВКА ЧЕКА В КОРЗИНЕ ===
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

    // Слушатель кликов по кнопкам количества внутри чека
    const cartListElement = document.getElementById('cart-items-list');
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

    // === 4. НАЖАТИЕ НА КНОПКУ ЗАКАЗАТЬ ===
    const orderForm = document.getElementById('order-form');
    
    if (orderForm) {
        orderForm.addEventListener('submit', function (event) {
            event.preventDefault(); // Запрещаем перезагрузку страницы!

            const fioInput = document.getElementById('user-fio');
            const phoneInput = document.getElementById('user-phone');
            const addressInput = document.getElementById('user-address');
            const cart = getCart();

            const modalBody = document.getElementById('modalBody');
            const modalTitle = document.getElementById('modalTitle');

            // Если корзина пустая
            if (cart.length === 0) {
                modalTitle.textContent = "Ваша корзина пуста";
                modalBody.innerHTML = "⚠️ Невозможно оформить заказ. Пожалуйста, вернитесь в каталог и выберите товары.";
                const statusModal = document.getElementById('statusModal');
                if (statusModal) statusModal.classList.add('show');
                return;
            }

            // Валидация полей
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
            if (!phoneInput.value.trim()) {
                isValid = false;
                errorMessage += "Введите ваш номер мобильного телефона.<br>";
            }

            // Настройка вывода окна
            if (isValid) {
                modalTitle.textContent = "Заказ успешно оформлен!";
                modalBody.innerHTML = "🎉 Спасибо за заказ! Данные успешно обработаны и отправлены.";
                localStorage.removeItem('beer_cart'); 
                orderForm.reset();
                renderCartReceipt(); 
            } else {
                modalTitle.textContent = "Ошибка заполнения формы";
                modalBody.innerHTML = `⚠️ Найдена ошибка:<br><br>${errorMessage}`;
            }

            // Показываем окно
            const statusModal = document.getElementById('statusModal');
            if (statusModal) {
                statusModal.classList.add('show');
            }
        });
    }

    // ЛОГИКА ЗАКРЫТИЯ ОКНА
    const statusModalInstance = document.getElementById('statusModal');
    if (statusModalInstance) {
        statusModalInstance.addEventListener('click', function (e) {
            if (e.target.classList.contains('btn-modal-close') || e.target.classList.contains('close') || e.target === statusModalInstance) {
                statusModalInstance.classList.remove('show');
            }
        });
    }
});


