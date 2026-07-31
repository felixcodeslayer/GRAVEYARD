const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// ===== SUPABASE =====
const SUPABASE_URL = 'https://tlskuayflsgfmisigitx.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_w69hucmH7KbE3h8f8ajKcw_D_PTbbfh';

app.use(cors());
app.use(express.json());

// ============================================================
// 1. RATE LIMITING В ПАМЯТИ (без БД)
// ============================================================
const rateLimitStore = {};

// Очистка старых записей раз в час
setInterval(() => {
    const now = Date.now();
    for (const ip in rateLimitStore) {
        if (now - rateLimitStore[ip].firstRequest > 24 * 60 * 60 * 1000) {
            delete rateLimitStore[ip];
        }
    }
}, 60 * 60 * 1000);

function checkRateLimit(ip) {
    const now = Date.now();
    const limit = 5;        // максимум запросов
    const windowMs = 60000; // за 1 минуту

    if (!rateLimitStore[ip]) {
        rateLimitStore[ip] = { count: 1, firstRequest: now };
        return { allowed: true };
    }

    const record = rateLimitStore[ip];
    if (now - record.firstRequest > windowMs) {
        record.count = 1;
        record.firstRequest = now;
        return { allowed: true };
    }

    if (record.count >= limit) {
        return { allowed: false, reason: `Слишком много запросов (макс. ${limit} в минуту). Подождите.` };
    }

    record.count++;
    return { allowed: true };
}

// ============================================================
// 2. ФИЛЬТР МАТА И ССЫЛОК (из badwords.js)
// ============================================================

// --- Список нецензурных слов (из твоего файла) ---
const BAD_WORDS = [
    // Русские матерные слова (оригинал из твоего файла, но с нормальной кодировкой)
    'хуй', 'пизда', 'бля', 'сука', 'ебать', 'ебаный', 'ебло',
    'гандо', 'пидор', 'лох', 'мудак', 'шлюха', 'блядь', 'пиздец',
    'хуесос', 'хуйло', 'залупа', 'манда', 'пердеж', 'срать', 'жопа',
    'очко', 'петух', 'гомик', 'трах', 'выкидыш', 'дебил', 'идиот',
    'кретин', 'даун', 'урод', 'выродок', 'педераст', 'голубой',
    'пидорас', 'педик', 'извращенец', 'педофил', 'садист', 'мазохист',
    'негодяй', 'подлец', 'мерзавец', 'сволочь', 'гад', 'тварь',
    'скотина', 'собака', 'свинья', 'осёл', 'баран', 'козёл', 'олень',
    'засранец', 'гнида', 'блоха', 'насекомое', 'червь', 'падаль',
    'тупица', 'болван', 'идиотизм', 'кретинизм', 'маразм', 'шибко',
    'псих', 'психичка', 'шиз', 'шизик', 'чепушило', 'чмо', 'чмобиль',
    'чушок', 'уебище', 'уебок', 'уебан', 'уебищный', 'зажрался',
    'залупень', 'залупистый', 'залупный', 'залупнуть', 'залупляться',
    'мандавошка', 'мандавошица', 'мандавоший', 'мандавошный',
    'пиздюк', 'пиздёнок', 'пиздун', 'пиздуха', 'пиздушка', 'пиздюля',
    'пиздюшка', 'пиздоголовый', 'хуек', 'хуёк', 'хуёчек', 'хуище',
    'хуишко', 'хуеватенъкий', 'хуеватый', 'хуёвина', 'хуёво',
    'хуёвость', 'хуёж', 'хуеплет', 'хуеплёт', 'хуесло', 'хуила',
    'хуило', 'хуиный', 'хуисто', 'хуистый', 'хуйнуть', 'хуйня',
    'хуйный', 'хуйский', 'хуйце', 'хуйцо', 'ебало', 'ебаный',
    'ебать-колотить', 'ебатория', 'ебачи', 'ебец', 'ебическое',
    'ебля', 'еблящий', 'ебошить', 'ебтвоюмать', 'ебун', 'ебучий',
    'ебущий', 'ебцы', 'ёба', 'ёбаный', 'ёбарь', 'ёбать', 'ёбаться',
    'ёбеня', 'ёбка', 'ёбнутый', 'ёбнуться', 'ёбский', 'ёбщик',
    'ёбырь', 'ёбыш', 'ёжа', 'ёжень', 'ёжливый', 'ёжь',
    'жопа', 'жопица', 'жопище', 'жопка', 'жопный', 'жопничать',
    'жополиз', 'жопомойка', 'жопоногий', 'жопорванец', 'жопотряс',
    'жопочка', 'жопочник', 'жопство', 'жопу', 'жопушка', 'жопь',
    'блядеец', 'блядёныш', 'блядистый', 'блядовать', 'блядовозка',
    'блядовство', 'блядский', 'блядство', 'блядун', 'блядунья',
    'блядь', 'блядья', 'блядюга', 'блядюшка', 'блядящий', 'бляж',
    'бляха', 'бляха-муха', 'гандо', 'гандончик', 'гандонь',
    'гандонный', 'гандоновый', 'гандонщик', 'гандонщина', 'гандюк',
    'гандючка', 'мудак', 'мудачка', 'мудачьё', 'мудень', 'мудила',
    'мудило', 'мудист', 'мудистый', 'мудозвон', 'мудозвонство',
    'мудон', 'мудотень', 'мудохать', 'мудохват', 'мудохвост',
    'мудошлёп', 'мудрость', 'мудрый', 'пидораст', 'пидорасина',
    'пидораство', 'пидорасня', 'пидорашка', 'пидорашник', 'пидорга',
    'пидорий', 'пидоризм', 'пидорина', 'пидористо', 'пидористый',
    'пидорить', 'пидорка', 'пидорма', 'пидормотина', 'пидормовка',
    'пидорный', 'пидороватый', 'пидоровище', 'пидорожа', 'пидороз',
    'пидорозка', 'пидорозный', 'пидорок', 'пидорство', 'пидорствовать',
    'пидорьё', 'лох', 'лохануться', 'лохарь', 'лохизм', 'лохиня',
    'лохический', 'лохнуть', 'лоховский', 'лоховство', 'лоховушка',
    'лохотрон', 'лохудра', 'лохушка', 'лошарня', 'лошачить', 'лошачье',
    'сучка', 'сучонок', 'сучка-сучка', 'сучить', 'сучиться', 'сучка',
    'сучонка', 'сучонок', 'сучье', 'суки', 'сукин', 'сукины', 'суку',
    'суко', 'сука-блядь', 'шлюха', 'шлюха-блядь', 'шлюхавый',
    'шлюховатый', 'шлюховоз', 'шлюхогон', 'шлюхогонная', 'шлюходром',
    'шлюхой', 'шлюшки', 'шлюшка', 'шлюхи',

    // Английские ругательства
    'fuck', 'fucking', 'fucked', 'fucker', 'fuckhead', 'fuckwit', 'fucktard',
    'shit', 'shitting', 'shitter', 'shithead', 'shitface', 'shitty', 'shite',
    'ass', 'asshole', 'assface', 'asswipe', 'asshat', 'assclown', 'assmaster',
    'bitch', 'bitcher', 'bitchy', 'bitchass', 'bitchface', 'bitchslap',
    'bastard', 'bastardy', 'bastardly', 'bastardize', 'bastardry',
    'cunt', 'cuntface', 'cuntish', 'cuntlicker', 'cuntwaffle',
    'dick', 'dickhead', 'dickwad', 'dickface', 'dicksucker', 'dickish',
    'pussy', 'pussycat', 'pussyfoot', 'pussyhole', 'pussywhipped',
    'motherfucker', 'motherfucking', 'motherfuckerly', 'motherfuckery',
    'whore', 'whorebag', 'whoreface', 'whorehouse', 'whoremonger',
    'slut', 'slutty', 'slutbag', 'slutface', 'slutwhore',
    'turd', 'turdball', 'turdface', 'turds', 'turdy',
    'cock', 'cockface', 'cockmaster', 'cocksucker', 'cockwomble',
    'douchebag', 'douchecanoe', 'douchewaffle', 'douchebaggery',
    'jerk', 'jerkoff', 'jerkface', 'jerkwad', 'jerkstore',
    'knob', 'knobhead', 'knobend', 'knobjockey', 'knobcheese',
    'prick', 'prickface', 'prickhead', 'prickteaser',
    'twat', 'twatface', 'twatwaffle', 'twatling', 'twatty',
    'wank', 'wanker', 'wankjob', 'wankstain', 'wankfest',
    'bugger', 'buggery', 'buggerlugs', 'buggeration',
    'bollocks', 'bollocky', 'bollockchops', 'bollockbrain',
    'tosser', 'tossbag', 'tossface', 'tossmonkey',
    'git', 'gitface', 'gittish', 'gitwad',
    'muppet', 'muppetbrain', 'muppetry', 'muppetcock',
    'pillock', 'pillocky', 'pillockbrain', 'pillockface'
];

// Дополнительно добавляем варианты с заменой букв (из твоего списка)
const EXTRA_BAD = [
    'xуй', 'пiздa', 'гaндoн', 'пiдop', 'лox', 'мyдaк', 'шлюxa', 'блyдь', 'cукa', 'eбaть',
    'xуeсос', 'xуилa', 'xуйлo', 'зaлyпa', 'мaндa', 'пepдeж', 'cpaть', 'жoпa', 'oчкo',
    'пeтyx', 'гoмик', 'тpax', 'выкидыш', 'дeбил', 'идиoт', 'кpeтин', 'дayн', 'ypoд',
    'выpoдoк', 'пeдepaст', 'гoлyбoй', 'пидopaс', 'пeдик', 'извpaщeнeц', 'пeдoфил',
    'сaдист', 'мaзoxист', 'нeгoдяй', 'пoдлeц', 'мepзaвeц', 'свoлoчь', 'гaд', 'твapь',
    'скoтинa', 'сoбaкa', 'свинья', 'oсёл', 'бapaн', 'кoзёл', 'oлeнь', 'зacpaнeц',
    'гнидa', 'блoxa', 'нaceкoмoe', 'чepвь', 'пaдaль', 'тyпицa', 'бoлвaн',
    'идиoтизм', 'кpeтинизм', 'мapaзм', 'шибкo', 'псих', 'психичкa', 'шиз', 'шизик',
    'чeпyшилo', 'чмo', 'чмoбиль', 'чyшoк', 'yeбищe', 'yeбoк', 'yeбaн', 'yeбищный',
    'зaжpaлся', 'зaлyпeнь', 'зaлyпистый', 'зaлyпный', 'зaлyпнуть', 'зaлyпляться',
    'мaндaвoшкa', 'мaндaвoшицa', 'мaндaвoший', 'мaндaвoшный',
    'пиздюк', 'пиздёнoк', 'пиздyн', 'пиздyxa', 'пиздyшкa', 'пиздюля',
    'пиздюшкa', 'пиздoгoлoвый', 'xyек', 'xyёк', 'xyёчeк', 'xyищe',
    'xyишкo', 'xyевaтeнький', 'xyевaтый', 'xyёвинa', 'xyёвo',
    'xyёвoсть', 'xyёж', 'xyеплeт', 'xyеплёт', 'xyеслo', 'xyилa',
    'xyилo', 'xyиный', 'xyистo', 'xyистый', 'xyйнуть', 'xyйня',
    'xyйный', 'xyйский', 'xyйцe', 'xyйцo', 'eбaлo', 'eбaный',
    'eбaть-кoлoтить', 'eбaтopия', 'eбaчи', 'eбeц', 'eбичeскoe',
    'eбля', 'eблящий', 'eбoшить', 'eбтвoюмaть', 'eбyн', 'eбyчий',
    'eбyщий', 'eбцы', 'ёбa', 'ёбaный', 'ёбapь', 'ёбaть', 'ёбaться',
    'ёбeня', 'ёбкa', 'ёбнyтый', 'ёбнyться', 'ёбский', 'ёбщик',
    'ёбыpь', 'ёбыш', 'ёжa', 'ёжeнь', 'ёжливый', 'ёжь',
    'жoпa', 'жoпицa', 'жoпищe', 'жoпкa', 'жoпный', 'жoпничaть',
    'жoпoлиз', 'жoпoмoйкa', 'жoпoнoгий', 'жoпopвaнeц', 'жoпoтpяс',
    'жoпoчкa', 'жoпoчник', 'жoпствo', 'жoпy', 'жoпyшкa', 'жoпь',
    'блядeeц', 'блядёныш', 'блядистый', 'блядoвaть', 'блядoвoзкa',
    'блядoвствo', 'блядский', 'блядствo', 'блядyн', 'блядyнья',
    'блядь', 'блядья', 'блядюгa', 'блядюшкa', 'блядящий', 'бляж',
    'бляxa', 'бляxa-мyxa', 'гaндo', 'гaндoнчик', 'гaндoнь',
    'гaндoнный', 'гaндoнoвый', 'гaндoнщик', 'гaндoнщинa', 'гaндюк',
    'гaндючкa', 'мyдaк', 'мyдaчкa', 'мyдaчьё', 'мyдeнь', 'мyдилa',
    'мyдилo', 'мyдист', 'мyдистый', 'мyдoзвoн', 'мyдoзвoнствo',
    'мyдoн', 'мyдoтeнь', 'мyдoхaть', 'мyдoхвaт', 'мyдoхвoст',
    'мyдoшлёп', 'мyдрoсть', 'мyдрый', 'пидoрaст', 'пидoрaсинa',
    'пидoрaствo', 'пидoрaсня', 'пидoрaшкa', 'пидoрaшник', 'пидopгa',
    'пидopий', 'пидopизм', 'пидopинa', 'пидopистo', 'пидopистый',
    'пидopить', 'пидopкa', 'пидopмa', 'пидopмoтинa', 'пидopмoвкa',
    'пидopный', 'пидopoвaтый', 'пидopoвищe', 'пидopoжa', 'пидopoз',
    'пидopoзкa', 'пидopoзный', 'пидopoк', 'пидopствo', 'пидopствoвaть',
    'пидopьё', 'лox', 'лoxaнyться', 'лoxapь', 'лoxизм', 'лoxиня',
    'лoxичeский', 'лoxнyть', 'лoxoвский', 'лoxoвствo', 'лoxoвyшкa',
    'лoxoтpoн', 'лoxyдpa', 'лoxyшкa', 'лoшapня', 'лoшaчить', 'лoшaчьe',
    'сyчкa', 'сyчoнoк', 'сyчкa-сyчкa', 'сyчить', 'сyчиться', 'сyчкa',
    'сyчoнкa', 'сyчoнoк', 'сyчьe', 'сyки', 'сyкин', 'сyкины', 'сyкy',
    'сyкo', 'сyкa-блядь', 'шлюxa', 'шлюxa-блядь', 'шлюxaвый',
    'шлюxoвaтый', 'шлюxoвoз', 'шлюxoгoн', 'шлюxoгoннaя', 'шлюxoдpoм',
    'шлюxoй', 'шлюшки', 'шлюшкa', 'шлюхи'
];

// Объединяем все списки (убираем дубли)
const ALL_BAD_WORDS = [...new Set([...BAD_WORDS, ...EXTRA_BAD])];

// --- Проверка на мат ---
function containsBadWords(text) {
    if (!text || typeof text !== 'string') return false;
    const lower = text.toLowerCase();
    return ALL_BAD_WORDS.some(word => lower.includes(word));
}

// --- Проверка на ссылки ---
function containsUrl(text) {
    if (!text || typeof text !== 'string') return false;
    const urlPattern = /https?:\/\/[^\s]+|www\.[^\s]+|[a-z0-9.-]+\.[a-z]{2,}/i;
    return urlPattern.test(text);
}

// --- Основная функция валидации ---
function validateText(fieldName, text) {
    if (!text || typeof text !== 'string') return { valid: true };
    if (containsBadWords(text)) {
        return { valid: false, reason: `${fieldName} содержит нецензурную лексику` };
    }
    if (containsUrl(text)) {
        return { valid: false, reason: `${fieldName} содержит ссылки (запрещено)` };
    }
    return { valid: true };
}

// ============================================================
// 3. API РОУТЫ С ЗАЩИТОЙ
// ============================================================

// ===== ПОЛУЧИТЬ ВСЕ МОГИЛЫ =====
app.get('/api/graves', async (req, res) => {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/graves?select=*`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });
        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ===== СОЗДАТЬ МОГИЛУ (с защитой) =====
app.post('/api/graves', async (req, res) => {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';

    // 1. Rate Limiting
    const rateCheck = checkRateLimit(ip);
    if (!rateCheck.allowed) {
        return res.status(429).json({ error: rateCheck.reason });
    }

    // 2. Проверка обязательных полей
    const { x, y, name, text, texture, rotation } = req.body;
    if (x == null || y == null) {
        return res.status(400).json({ error: 'Координаты обязательны' });
    }

    // 3. Фильтрация имени и эпитафии
    const nameValidation = validateText('Имя', name);
    if (!nameValidation.valid) {
        return res.status(400).json({ error: nameValidation.reason });
    }
    const textValidation = validateText('Эпитафия', text);
    if (!textValidation.valid) {
        return res.status(400).json({ error: textValidation.reason });
    }

    // ===== ИЗМЕНЕНИЕ: ЛИМИТ 100 000 МОГИЛ =====
    try {
        const countRes = await fetch(`${SUPABASE_URL}/rest/v1/graves?select=id`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });
        const countData = await countRes.json();
        if (countData && countData.length >= 100000) {
            return res.status(503).json({ error: 'Кладбище переполнено. Максимум 100 000 могил.' });
        }
    } catch (e) {
        console.warn('Не удалось проверить лимит могил:', e);
    }

    // 5. Сохраняем могилу
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/graves`, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify({
                x,
                y,
                name: name || 'Безымянная',
                text: text || '',
                texture: texture || 0,
                rotation: rotation || 0
            })
        });
        const data = await response.json();
        res.json(data[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ===== ПОЛУЧИТЬ КОММЕНТАРИИ =====
app.get('/api/comments/:graveId', async (req, res) => {
    try {
        const { graveId } = req.params;
        const response = await fetch(
            `${SUPABASE_URL}/rest/v1/comments?grave_id=eq.${graveId}&order=created_at.asc`,
            {
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
                }
            }
        );
        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ===== ДОБАВИТЬ КОММЕНТАРИЙ (с защитой) =====
app.post('/api/comments', async (req, res) => {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';

    // Rate Limiting
    const rateCheck = checkRateLimit(ip);
    if (!rateCheck.allowed) {
        return res.status(429).json({ error: rateCheck.reason });
    }

    const { grave_id, author, text } = req.body;
    if (!grave_id || !text) {
        return res.status(400).json({ error: 'grave_id и text обязательны' });
    }

    // Фильтруем автора и текст комментария
    const authorValidation = validateText('Автор', author);
    if (!authorValidation.valid) {
        return res.status(400).json({ error: authorValidation.reason });
    }
    const textValidation = validateText('Комментарий', text);
    if (!textValidation.valid) {
        return res.status(400).json({ error: textValidation.reason });
    }

    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/comments`, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify({
                grave_id,
                author: author || 'Аноним',
                text
            })
        });
        const data = await response.json();
        res.json(data[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================================
// НОВЫЙ ЭНДПОИНТ: ПОЛУЧИТЬ МОГИЛЫ В ОБЛАСТИ (ДЛЯ ЧАНКОВОЙ ЗАГРУЗКИ)
// ============================================================
app.get('/api/graves/area', async (req, res) => {
    try {
        const { minX, maxX, minY, maxY } = req.query;
        if (minX === undefined || maxX === undefined || minY === undefined || maxY === undefined) {
            return res.status(400).json({ error: 'Параметры minX, maxX, minY, maxY обязательны' });
        }

        const minXNum = parseFloat(minX);
        const maxXNum = parseFloat(maxX);
        const minYNum = parseFloat(minY);
        const maxYNum = parseFloat(maxY);
        if (isNaN(minXNum) || isNaN(maxXNum) || isNaN(minYNum) || isNaN(maxYNum)) {
            return res.status(400).json({ error: 'Параметры должны быть числами' });
        }

        // Ограничиваем область, чтобы не запрашивать слишком большой кусок
        const maxRange = 5000;
        if (maxXNum - minXNum > maxRange || maxYNum - minYNum > maxRange) {
            return res.status(400).json({ error: 'Слишком большая область, максимум 5000x5000' });
        }

        const response = await fetch(
            `${SUPABASE_URL}/rest/v1/graves?select=*` +
            `&x=gte.${minXNum}&x=lte.${maxXNum}&y=gte.${minYNum}&y=lte.${maxYNum}` +
            `&limit=1000`,
            {
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
                }
            }
        );
        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ===== ЗАПУСК СЕРВЕРА =====
app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
    console.log(`http://localhost:${PORT}`);
});