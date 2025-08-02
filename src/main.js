/**
 * Функция для расчета выручки
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product) {
  const discount = 1 - purchase.discount / 100;
  return purchase.sale_price * purchase.quantity * discount;

  // @TODO: Расчет выручки от операции
}

/**
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param total общее число продавцов
 * @param seller карточка продавца
 * @returns {number}
 */
function calculateBonusByProfit(index, total, seller) {
  const { profit } = seller;
  if (index === 0) {
    return profit * 0.15;
  } else if (index === 1 || index === 2) {
    return profit * 0.1;
  } else if (index === total - 1) {
    return profit * 0;
  } else {
    // Для всех остальных
    return profit * 0.05;
  }
  // @TODO: Расчет бонуса от позиции в рейтинге
}

/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */
function analyzeSalesData(data, options) {
  if (!options || typeof options !== "object") {
    throw new Error("Опции не являются объектами");
  }

  const { calculateRevenue, calculateBonus } = options;
  // @TODO: Проверка входных данных
  if (
    !data ||
    !Array.isArray(data.sellers) ||
    !Array.isArray(data.products) ||
    !Array.isArray(data.purchase_records) ||
    data.sellers.length === 0 ||
    data.products.length === 0 ||
    data.purchase_records.length === 0
  ) {
    throw new Error("Некорректные входные данные");
  }

  if (!calculateRevenue || !calculateBonus) {
    throw new Error("Чего-то не хватает");
  }

  if (
    typeof calculateRevenue !== "function" ||
    typeof calculateBonus !== "function"
  ) {
    throw new Error("Переменные не являются функциями");
  }

  // @TODO: Проверка наличия опций

  // @TODO: Подготовка промежуточных данных для сбора статистики

  const sellerStats = data.sellers.map((seller) => ({
    id: seller.id,
    name: `${seller.first_name} ${seller.last_name}`,
    revenue: 0,
    profit: 0,
    sales_count: 0,
    products_sold: {},
  }));

  // Заполним начальными данными

  // @TODO: Индексация продавцов и товаров для быстрого доступа

  const sellerIndex = sellerStats.reduce(
    (result, seller) => ({
      ...result,
      [seller.id]: seller,
    }),
    {}
  ); // Ключом будет id, значением — запись из sellerStats


  const productIndex = data.products.reduce(
    (result, product) => ({
      ...result,
      [product.sku]: product,
    }),
    {}
  ); // Ключом будет sku, значением — запись из data.products

  // @TODO: Расчет выручки и прибыли для каждого продавца

  data.purchase_records.forEach((record) => {
    // Чек
    const seller = sellerIndex[record.seller_id]; // Продавец
    seller.sales_count += 1;
    // Увеличить количество продаж
    seller.revenue = seller.revenue + record.total_amount;
    // Увеличить общую сумму всех продаж

    // Расчёт прибыли для каждого товара
    record.items.forEach((item) => {
      const product = productIndex[item.sku]; // Товар

      // Посчитать себестоимость (cost) товара как product.purchase_price, умноженную на количество товаров из чека
      const cost = product.purchase_price * item.quantity;
      // Посчитать выручку (revenue) с учётом скидки через функцию calculateRevenue
      const revenue = calculateSimpleRevenue(item, product);
      // Посчитать прибыль: выручка минус себестоимость
      const profit = revenue - cost;
      seller.profit += profit;
      // Увеличить общую накопленную прибыль (profit) у продавца

      // Учёт количества проданных товаров
      if (!seller.products_sold[item.sku]) {
        seller.products_sold[item.sku] = 0;
      }
      seller.products_sold[item.sku] += item.quantity;
      // По артикулу товара увеличить его проданное количество у продавца
    });
  });
  // @TODO: Сортировка продавцов по прибыли

  sellerStats.sort((a, b) => {
    if (a.profit < b.profit) {
      return 1;
    }
    if (a.profit > b.profit) {
      return -1;
    }
    return 0;
  });
  // @TODO: Назначение премий на основе ранжирования

  sellerStats.forEach((seller, index) => {
    const total = sellerStats.length;
    seller.bonus = calculateBonusByProfit(index, total, seller);

    // Считаем бонус
    const topProductsArray = Object.entries(seller.products_sold); // Формируем топ-10 товаров
    const topProductsArrayObjects = topProductsArray.map(([sku, quantity]) => [
      { sku, quantity },
    ]);

    topProductsArrayObjects.sort((a, b) => {
      if (a.quantity > b.quantity) {
        return -1;
      }
      if (a.quantity < b.quantity) {
        return 1;
      }
      return 0;
    });

    seller.top_products = topProductsArrayObjects.slice(0, 10);
  });

  // @TODO: Подготовка итоговой коллекции с нужными полями

  return sellerStats.map((seller) => ({
    seller_id: seller.id, // Строка, идентификатор продавца
    name: seller.name, // Строка, имя продавца
    revenue: +seller.revenue.toFixed(2), // Число с двумя знаками после точки, выручка продавца
    profit: +seller.profit.toFixed(2), // Число с двумя знаками после точки, прибыль продавца
    sales_count: seller.sales_count, // Целое число, количество продаж продавца
    top_products: seller.top_products, // Массив объектов вида: { "sku": "SKU_008","quantity": 10}, топ-10 товаров продавца
    bonus: +seller.bonus.toFixed(2), // Число с двумя знаками после точки, бонус продавца
  }));
}
