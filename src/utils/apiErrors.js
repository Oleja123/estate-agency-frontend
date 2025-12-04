// Helper utilities to parse API error responses into a consistent shape
export function formatApiErrorResponse(resp, opts = { context: 'request' }) {
  try { console.error('[apiErrors] API error', opts.context, resp?.status, resp?.data) } catch (e) {}

  if (!resp) return { message: 'Сетевой или транспортный сбой. Проверьте подключение.', fields: null }

  // Field name translations (backend keys -> human-friendly Russian labels)
  const fieldTranslations = {
    email: 'Электронная почта',
    login: 'Логин',
    password: 'Пароль',
    current_password: 'Текущий пароль',
    new_password: 'Новый пароль',
    first_name: 'Имя',
    last_name: 'Фамилия',
    phone_number: 'Телефон',
    role: 'Роль',
    city: 'Город',
    property_address: 'Адрес',
    price: 'Цена',
    area: 'Площадь',
    images: 'Изображения',
    image: 'Изображение',
    type_id: 'Тип недвижимости',
    property_status: 'Статус',
    min_price: 'Минимальная цена',
    max_price: 'Максимальная цена'
  }

  function translateFieldName(key) {
    if (!key || typeof key !== 'string') return key
    if (fieldTranslations[key]) return fieldTranslations[key]
  // запасной вариант: преобразовать snake_case/camelCase в читаемый вид (заменить _ на пробел, капитализировать)
    const human = key.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim()
    return human.charAt(0).toUpperCase() + human.slice(1)
  }

  // Extract structured field errors if present under common keys
  const details = resp.data?.details || resp.data?.fieldErrors || resp.data?.errors || null
  const fields = {}
  if (details && typeof details === 'object') {
    for (const [k, v] of Object.entries(details)) {
      const label = translateFieldName(k)
      // Normalize field messages as well (remove ids, translate entity words, capitalize)
      const rawText = Array.isArray(v) ? v.join(', ') : v
      fields[label] = translateMessageText(rawText)
    }
  }

  const status = resp.status
  let message = resp.data?.message || resp.data?.error || null

  // Translate common English entity words in server-provided messages into Russian
  function translateMessageText(text) {
    if (!text || typeof text !== 'string') return text
    // English -> Russian replacements for common entity words
    const replacements = [
      [/\bUser(s)?\b/gi, 'пользователь$1'],
      [/\bProperty\b/gi, 'объект недвижимости'],
      [/\bProperties\b/gi, 'объекты недвижимости'],
      [/\bProperty type(s)?\b/gi, 'тип недвижимости$1'],
      [/\bImage(s)?\b/gi, 'изображение$1'],
      [/\bEmail\b/gi, 'электронная почта'],
      [/\bLogin\b/gi, 'логин'],
      [/\bPassword\b/gi, 'пароль'],
      [/\bFavorites\b/gi, 'избранное'],
      [/\bNot found\b/gi, 'не найден'],
      [/\balready exists\b/gi, 'уже существует']
    ]
    let out = text

    // Если сервер вернул сообщение вида "Property with id 123 not found" или похожее,
    // преобразуем его в "Объект недвижимости не найден" (без id) — по требованию.
    try {
      const entityMap = {
        // users
        'user': 'пользователь',
        'users': 'пользователь',
        // properties
        'property': 'объект недвижимости',
        'properties': 'объект недвижимости',
        'property-type': 'тип недвижимости',
        'property type': 'тип недвижимости',
        'property_types': 'тип недвижимости',
        'property_type': 'тип недвижимости',
        'propertytypes': 'тип недвижимости',
        'propertytype': 'тип недвижимости',
        'property types': 'тип недвижимости',
        'propertytypes': 'тип недвижимости',
        'propertyTypes': 'тип недвижимости',
        'PropertyTypes': 'тип недвижимости',
        'Property_types': 'тип недвижимости',
        'Property_Type': 'тип недвижимости',
        'property-types': 'тип недвижимости',
        // images and misc
        'image': 'изображение',
        'images': 'изображение',
        'email': 'электронная почта',
        'login': 'логин',
        'password': 'пароль',
        'favorites': 'избранное'
      }
      // Построить паттерн: (entity) ... (with id|id|id=|#) <number>
      const entitiesPattern = Object.keys(entityMap)
        .map(e => e.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&'))
        .join('|')
      const idPattern = new RegExp(`\\b(${entitiesPattern})\\b[\\s\\S]{0,120}?(?:\\bwith\\s+id\\b|\\bid\\b|\\bid=\\b|\\bID\\b|#)[:\\s=#-]*\\d+`, 'i')
      const m = text.match(idPattern)
      if (m && m[1]) {
        const en = m[1].toLowerCase()
        const ru = entityMap[en] || en
        // вернуть короткое сообщение без id
        return (ru + ' не найден')
      }
    } catch (e) {
      // on any error fall back to generic replacements below
    }

    for (const [rx, repl] of replacements) out = out.replace(rx, repl)
    return out
  }

  switch (status) {
    case 400:
      message = translateMessageText(message || 'Некорректный запрос. Проверьте введённые данные.')
      break
    case 401:
      message = translateMessageText(message || 'Требуется авторизация. Пожалуйста, войдите в систему.')
      break
    case 403:
      message = translateMessageText(message || 'Недостаточно прав для выполнения операции.')
      break
    case 404:
      message = translateMessageText(message || 'Запрошенный ресурс не найден.')
      break
    case 409:
      message = translateMessageText(message || 'Конфликт данных. Возможно, запись уже существует.')
      break
    case 422:
      message = translateMessageText(message || 'Невозможно обработать запрос. Проверьте входные данные.')
      break
    case 502:
      message = translateMessageText(message || 'Внешний сервис временно недоступен. Повторите попытку позже.')
      break
    case 500:
    default:
      message = translateMessageText(message || 'Внутренняя ошибка сервера. Попробуйте позже.')
      break
  }

  // Capitalize first letter of returned message to ensure user-facing strings start with an uppercase
  function capitalizeFirst(str) {
    if (!str || typeof str !== 'string') return str
    return str.charAt(0).toUpperCase() + str.slice(1)
  }

  message = capitalizeFirst(message)

  return { message, fields: Object.keys(fields).length ? fields : null }
}

export default formatApiErrorResponse
