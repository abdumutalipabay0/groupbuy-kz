import { useGroupBuyStore } from "@/lib/store";

export type UiLang = "ru" | "kz";

const STRINGS = {
  nav_home: { ru: "Главная", kz: "Басты бет" },
  nav_ai: { ru: "AI-байер", kz: "AI-байер" },
  nav_catalog: { ru: "Каталог", kz: "Каталог" },
  nav_profile: { ru: "Профиль", kz: "Профиль" },

  feed_hero_title_1: { ru: "Собери команду,", kz: "Команда жина," },
  feed_hero_title_2: { ru: "сбей цену", kz: "бағаны түсір" },
  feed_hero_sub: {
    ru: "Реальный каталог + групповые цены. Зови друзей, пока таймер не сгорел.",
    kz: "Нақты каталог + топтық бағалар. Таймер біткенше достарыңды шақыр.",
  },
  feed_search: { ru: "Поиск товаров и скидок", kz: "Тауарлар мен жеңілдіктерді іздеу" },
  feed_hot: { ru: "Горящие команды", kz: "Жанып тұрған топтар" },
  feed_popular: { ru: "Популярное сегодня", kz: "Бүгінгі танымал" },
  feed_category: { ru: "Подборка категории", kz: "Санат таңдауы" },
  feed_products: { ru: "товаров", kz: "тауар" },
  feed_discount: { ru: "скидка", kz: "жеңілдік" },
  feed_ai_hint: {
    ru: "«робот-пылесос до 80 000 ₸» — найдёт товар и группу",
    kz: "«80 000 ₸ дейін робот-шаңсорғыш» — тауар мен топты табады",
  },
  feed_ai_ask: { ru: "спросить", kz: "сұрау" },

  product_join: { ru: "Войти в команду", kz: "Командаға кіру" },
  product_joined: { ru: "Ты в команде · скидка", kz: "Сен командадасың · жеңілдік" },
  product_completed: { ru: "Цена уже открыта", kz: "Баға ашылды" },
  product_expired: { ru: "Срок команды истёк", kz: "Топ мерзімі бітті" },
  product_no_group: { ru: "Нет активной команды", kz: "Белсенді топ жоқ" },
  product_alone: { ru: "Одному", kz: "Жалғыз" },
  product_together: { ru: "Командой", kz: "Топпен" },
  product_your_savings: { ru: "Твоя экономия", kz: "Сенің үнемің" },
} as const;

export type I18nKey = keyof typeof STRINGS;

export function t(lang: UiLang, key: I18nKey): string {
  return STRINGS[key][lang];
}

/** Reactive translator bound to the store's UI language. */
export function useT(): (key: I18nKey) => string {
  const lang = useGroupBuyStore((s) => s.lang);
  return (key) => t(lang, key);
}
