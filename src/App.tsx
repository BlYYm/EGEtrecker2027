import { useState, useEffect, type ChangeEvent, type DragEvent } from 'react';

interface Subject {
  id: string;
  name: string;
  short: string;
  color: string;
}

interface CalendarTask {
  id: string;
  date: string;
  time?: string;
  subjectId: string;
  title: string;
  priority: 'high' | 'medium' | 'normal';
  note: string;
  completed: boolean;
}

interface DailyTask {
  id: string;
  title: string;
  completed: boolean;
}

interface TutorSession {
  id: string;
  subjectId: string;
  tutorName: string;
  date: string;
  time: string;
  homework: string;
  homeworkDone: boolean;
}

interface ChatMessage {
  sender: 'ai' | 'user';
  text: string;
}

const SUBJECTS: Subject[] = [
  { id: '2', name: 'Обществознание', short: 'Общ', color: 'bg-amber-600 text-white' },
  { id: '3', name: 'История', short: 'Ист', color: 'bg-rose-600 text-white' },
  { id: '5', name: 'Русский язык', short: 'Рус', color: 'bg-emerald-600 text-white' },
  { id: '4', name: 'Математика', short: 'Мат', color: 'bg-blue-600 text-white' },
  { id: '1', name: 'Информатика', short: 'Инф', color: 'bg-indigo-600 text-white' },
  { id: '6', name: 'Английский язык', short: 'Англ', color: 'bg-purple-600 text-white' },
  { id: '7', name: 'Литература', short: 'Лит', color: 'bg-pink-600 text-white' },
  { id: '8', name: 'Биология', short: 'Био', color: 'bg-teal-600 text-white' },
  { id: '9', name: 'Химия', short: 'Хим', color: 'bg-cyan-600 text-white' },
  { id: '10', name: 'Физика', short: 'Физ', color: 'bg-sky-600 text-white' },
];

const MONTH_NAMES = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
];

const WEEKDAYS_SHORT = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];

function safeLoad<T>(key: string, fallback: T): T {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
}

function formatDateKey(year: number, monthIndex: number, day: number): string {
  const m = String(monthIndex + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
}

function normalizeDate(raw: string, fallbackYear: number, fallbackMonthIndex: number): string {
  const clean = String(raw || '').trim();
  const isoMatch = clean.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (isoMatch) {
    const y = parseInt(isoMatch[1], 10);
    const m = parseInt(isoMatch[2], 10);
    const d = parseInt(isoMatch[3], 10);
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }
  }
  const ruMatch = clean.match(/^(\d{1,2})[-/.](\d{1,2})(?:[-/.](\d{2,4}))?$/);
  if (ruMatch) {
    const d = parseInt(ruMatch[1], 10);
    const m = parseInt(ruMatch[2], 10);
    let y = ruMatch[3] ? parseInt(ruMatch[3], 10) : fallbackYear;
    if (y < 100) y += 2000;
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }
  }
  const dayOnly = parseInt(clean, 10);
  if (!isNaN(dayOnly) && dayOnly >= 1 && dayOnly <= 31) {
    return formatDateKey(fallbackYear, fallbackMonthIndex, dayOnly);
  }
  return formatDateKey(fallbackYear, fallbackMonthIndex, 1);
}

function detectSubjectByKeywords(rawSubjectId: string, title: string): string {
  const t = title.toLowerCase();
  if (/(рюрик|романов|смут|петр i|иван грозн|ордын|княз|древн.*рус|вов|великая отечеств|декабрист|ссср|истори|карт.*егэ)/i.test(t)) {
    return '3';
  }
  if (/(инфляц|экономик|политик|конституц|право|социальн|стратификац|гражданск|налог|рынок|издержк|безработиц|общество)/i.test(t)) {
    return '2';
  }
  if (/(орфоэп|ударен|пароним|пунктуац|причаст|деепричаст|сочинен|корн|приставк|суффикс|спп|ссп|текст.*егэ)/i.test(t)) {
    return '5';
  }
  if (/(тригонометр|логарифм|производн|планиметр|стереометр|неравенств|параметр|вероятност)/i.test(t)) {
    return '4';
  }
  if (/(python|пайтон|кодирован|алгебр.*логик|граф|рекурс|массив|информатик)/i.test(t)) {
    return '1';
  }
  const exists = SUBJECTS.some(s => s.id === String(rawSubjectId));
  return exists ? String(rawSubjectId) : '2';
}

function compressImageToDataUrl(file: File, maxDim = 1400): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const img = new Image();
      img.src = reader.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(reader.result as string);
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = () => reject(new Error('Не удалось прочитать картинку'));
    };
    reader.onerror = () => reject(new Error('Ошибка чтения файла'));
  });
}

export default function App() {
  const now = new Date();
  const todayStr = formatDateKey(now.getFullYear(), now.getMonth(), now.getDate());

  const [activeTab, setActiveTab] = useState<'calendar' | 'dailies' | 'tutors' | 'tree' | 'ai'>('calendar');
  const [viewYear, setViewYear] = useState<number>(now.getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(now.getMonth());

  const [calendarTasks, setCalendarTasks] = useState<CalendarTask[]>(() =>
    safeLoad('ege_v5_calendar_tasks', [])
  );
  const [dailyTasks, setDailyTasks] = useState<DailyTask[]>(() =>
    safeLoad('ege_v5_daily_tasks', [
      { id: 'd1', title: 'Повторить 10 дат или терминов', completed: false },
      { id: 'd2', title: 'Прорешать 1 тестовый вариант', completed: false },
    ])
  );
  const [tutors, setTutors] = useState<TutorSession[]>(() =>
    safeLoad('ege_v5_tutors', [])
  );
  const [bonusXp, setBonusXp] = useState<number>(() =>
    safeLoad('ege_v5_bonus_xp', 0)
  );
  const [lastWateredDate, setLastWateredDate] = useState<string>(() =>
    localStorage.getItem('ege_v5_last_watered') || ''
  );
  const [geminiKey, setGeminiKey] = useState<string>(() =>
    localStorage.getItem('ege_gemini_api_key') || ''
  );
  const [showKeyModal, setShowKeyModal] = useState(false);

  const [cloudId] = useState(() => {
    const saved = localStorage.getItem('ege_cloud_id');
    if (saved) return saved;
    const newId = 'user_' + Math.random().toString(36).substring(2, 9);
    localStorage.setItem('ege_cloud_id', newId);
    return newId;
  });

  useEffect(() => {
    localStorage.setItem('ege_v5_calendar_tasks', JSON.stringify(calendarTasks));
    localStorage.setItem('ege_v5_daily_tasks', JSON.stringify(dailyTasks));
    localStorage.setItem('ege_v5_tutors', JSON.stringify(tutors));
    localStorage.setItem('ege_v5_bonus_xp', JSON.stringify(bonusXp));
  }, [calendarTasks, dailyTasks, tutors, bonusXp]);

  const completedNormalCount = calendarTasks.filter(t => t.completed && t.priority !== 'high').length;
  const completedHighCount = calendarTasks.filter(t => t.completed && t.priority === 'high').length;
  const completedCalendarCount = completedNormalCount + completedHighCount;
  const completedDailiesCount = dailyTasks.filter(d => d.completed).length;
  const completedTutorsCount = tutors.filter(t => t.homeworkDone).length;

  const totalXp = Math.max(
    0,
    completedNormalCount * 3 +
      completedHighCount * 5 +
      completedDailiesCount * 2 +
      completedTutorsCount * 5 +
      bonusXp
  );

  const getTreeStage = (xp: number) => {
    if (xp < 25) return { level: 1, name: 'Пробуждение семечка', min: 0, max: 25, desc: 'Закрывай вебинары (+3 XP) и ежедневки (+2 XP), чтобы росток окреп!' };
    if (xp < 75) return { level: 2, name: 'Молодой побег', min: 25, max: 75, desc: 'Появились первые крепкие листья. Отличный темп подготовки!' };
    if (xp < 150) return { level: 3, name: 'Окрепшее деревце', min: 75, max: 150, desc: 'Густая крона знаний! Ты уже закрыл солидную базу тем.' };
    if (xp < 300) return { level: 4, name: 'Цветущая сакура ЕГЭ', min: 150, max: 300, desc: 'Дерево расцвело! Твоя дисциплина работает на максимум.' };
    return { level: 5, name: 'Золотое древо стобалльника', min: 300, max: 600, desc: 'Легендарный уровень! Дерево приносит золотые плоды.' };
  };

  const treeStage = getTreeStage(totalXp);
  const stageProgress = Math.min(
    100,
    Math.round(((totalXp - treeStage.min) / (treeStage.max - treeStage.min)) * 100)
  );

  const canWaterToday = lastWateredDate !== todayStr;

  const handleWaterTree = () => {
    if (!canWaterToday) return;
    setBonusXp(prev => prev + 1);
    setLastWateredDate(todayStr);
    localStorage.setItem('ege_v5_last_watered', todayStr);
  };

  const handleResetTreeXp = () => {
    if (!confirm('Сбросить весь опыт дерева и отметки выполнения задач до 0 XP?')) return;
    setCalendarTasks(prev => prev.map(t => ({ ...t, completed: false })));
    setDailyTasks(prev => prev.map(d => ({ ...d, completed: false })));
    setTutors(prev => prev.map(t => ({ ...t, homeworkDone: false })));
    setBonusXp(0);
    setLastWateredDate('');
    localStorage.removeItem('ege_v5_last_watered');
  };

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { sender: 'ai', text: 'Привет! Нажми «📷 Загрузить расписание» и выбери скриншот расписания Умскул — я прочитаю реальные даты, время, предмет и точные темы с картинки и перенесу их в календарь.' }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [editingTask, setEditingTask] = useState<CalendarTask | null>(null);
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [newDailyTitle, setNewDailyTitle] = useState('');
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [isAnalyzingPhoto, setIsAnalyzingPhoto] = useState(false);
  const [analyzeStatus, setAnalyzeStatus] = useState('');

  const [newTutorName, setNewTutorName] = useState('');
  const [newTutorSubject, setNewTutorSubject] = useState('2');
  const [newTutorDate, setNewTutorDate] = useState(todayStr);
  const [newTutorTime, setNewTutorTime] = useState('18:00');
  const [newTutorHw, setNewTutorHw] = useState('');

  // Обновленная функция: если сервер перегружен, делает до 3 попыток сама
  const callGeminiVisionWithAutoModel = async (base64Data: string, promptText: string, apiKey: string): Promise<string> => {
    const candidateModels = [
      'gemini-1.5-flash-latest',
      'gemini-flash-latest',
      'gemini-1.5-pro-latest',
    ];

    let lastErrorMsg = 'Не удалось подобрать модель Gemini';

    for (const modelName of candidateModels) {
      // Пытаемся пробиться на сервер до 3 раз для каждой модели
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [
                  {
                    parts: [
                      { text: promptText },
                      { inline_data: { mime_type: 'image/jpeg', data: base64Data } }
                    ]
                  }
                ],
                generationConfig: { temperature: 0.1 }
              })
            }
          );

          const data = await res.json();
          if (!data.error) {
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
            if (text) return text;
          } else {
            lastErrorMsg = data.error.message || lastErrorMsg;
            
            // Если ошибка 503 (High demand) - ждем 3 секунды и повторяем незаметно для пользователя
            if (res.status === 503 || /high demand/i.test(lastErrorMsg)) {
              if (attempt < 3) {
                setAnalyzeStatus(`Сервер Google загружен. Жду 3 сек и пробую снова (попытка ${attempt + 1}/3)...`);
                await new Promise(r => setTimeout(r, 3000));
                continue; // Повторяем попытку
              }
            }
            
            // Если модель просто не поддерживается для этого аккаунта - переходим к следующей модели
            if (res.status === 404 || res.status === 400 || /not found|not supported/i.test(lastErrorMsg)) {
              break; 
            }
            
            throw new Error(`Google API (${modelName}): ${lastErrorMsg}`);
          }
        } catch (e: any) {
          lastErrorMsg = e.message || lastErrorMsg;
        }
      }
    }

    throw new Error(`Google API недоступен: ${lastErrorMsg}`);
  };

  const recognizeScheduleFromImage = async (dataUrl: string): Promise<any[]> => {
    const ocrPrompt = `Ты точный OCR-сканер расписаний онлайн-школы Умскул для подготовки к ЕГЭ.
Внимательно прочитай КАЖДУЮ ячейку календаря на изображении.
КАТЕГОРИЧЕСКИ ЗАПРЕЩЕНО придумывать свои темы! Переписывай темы слово в слово как на картинке.

1. Определи предмет по заголовку или темам на картинке:
   "2" = Обществознание, "3" = История, "5" = Русский язык, "4" = Математика, "1" = Информатика
2. Определи месяц и год расписания (Ноябрь = 11, Октябрь = 10 и т.д. Если месяц не подписан, используй ${viewYear}-${String(viewMonth + 1).padStart(2, '0')}).
3. Для каждого дня месяца с занятием создай объект. Если есть время (например 16:00), запиши его в "time".
4. Верни ТОЛЬКО чистый JSON-массив:
[
  {"date": "2026-11-05", "time": "16:00", "subjectId": "3", "title": "Тема с картинки", "priority": "high"}
]`;

    let rawText = '';
    const activeKey = geminiKey.trim();

    if (activeKey) {
      const base64Data = dataUrl.split(',')[1];
      rawText = await callGeminiVisionWithAutoModel(base64Data, ocrPrompt, activeKey);
    } else {
      throw new Error('Вставь свой ключ Gemini (AQ.Ab...), чтобы сканировать фото расписаний!');
    }

    rawText = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
    const startIdx = rawText.indexOf('[');
    const endIdx = rawText.lastIndexOf(']');
    if (startIdx === -1 || endIdx === -1) {
      throw new Error('ИИ не смог найти таблицу с датами на этом изображении.');
    }

    return JSON.parse(rawText.slice(startIdx, endIdx + 1));
  };

  const handlePhotoUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const fileList = Array.from(files);
    e.target.value = '';

    setIsAnalyzingPhoto(true);

    try {
      let totalAdded = 0;
      let detectedMonth: number | null = null;
      let detectedYear: number | null = null;

      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        setAnalyzeStatus(`Сканирую расписание ${i + 1} из ${fileList.length} (${file.name})...`);

        const dataUrl = await compressImageToDataUrl(file, 1400);
        const parsed = await recognizeScheduleFromImage(dataUrl);

        if (Array.isArray(parsed) && parsed.length > 0) {
          const validTasks: CalendarTask[] = parsed
            .filter(item => item && item.title)
            .map((item, idx) => {
              const normalizedDate = normalizeDate(item.date, viewYear, viewMonth);
              const [yStr, mStr] = normalizedDate.split('-');
              const yNum = parseInt(yStr, 10);
              const mNum = parseInt(mStr, 10) - 1;
              if (!isNaN(yNum) && !isNaN(mNum) && mNum >= 0 && mNum <= 11) {
                detectedYear = yNum;
                detectedMonth = mNum;
              }

              const cleanTitle = String(item.title).trim();
              const cleanTime = item.time ? String(item.time).trim() : '';
              const smartSubjectId = detectSubjectByKeywords(String(item.subjectId || '2'), cleanTitle);

              return {
                id: `${Date.now()}_${i}_${idx}`,
                date: normalizedDate,
                time: cleanTime,
                subjectId: smartSubjectId,
                title: cleanTitle,
                priority: item.priority === 'high' ? 'high' : 'medium',
                note: `Умскул (${file.name})`,
                completed: false,
              };
            });

          totalAdded += validTasks.length;

          setCalendarTasks(prev => {
            const nonDuplicates = validTasks.filter(
              cand => !prev.some(ex => ex.date === cand.date && ex.title === cand.title && ex.subjectId === cand.subjectId)
            );
            return [...prev, ...nonDuplicates];
          });
        }
      }

      if (detectedYear !== null && detectedMonth !== null) {
        setViewYear(detectedYear);
        setViewMonth(detectedMonth);
      }

      setChatMessages(prev => [
        ...prev,
        {
          sender: 'ai',
          text: `✅ Готово! Я просканировал фото расписания и добавил в календарь ${totalAdded} зан. точно по числам месяца.`
        }
      ]);
      setActiveTab('calendar');
    } catch (err: any) {
      alert(`Ошибка распознавания: ${err.message}`);
    } finally {
      setIsAnalyzingPhoto(false);
      setAnalyzeStatus('');
    }
  };

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(y => y - 1);
    } else {
      setViewMonth(m => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(y => y + 1);
    } else {
      setViewMonth(m => m + 1);
    }
  };

  const handleGoToToday = () => {
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());
  };

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOffset = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7;

  const openNewTaskModal = (dateStr: string) => {
    setIsCreatingTask(true);
    setEditingTask({
      id: String(Date.now()),
      date: dateStr,
      time: '',
      subjectId: '2',
      title: '',
      priority: 'medium',
      note: '',
      completed: false,
    });
  };

  const handleDragStart = (e: DragEvent<HTMLDivElement>, taskId: string) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.setData('text/plain', taskId);
  };

  const handleDropOnDay = (e: DragEvent<HTMLDivElement>, targetDate: string) => {
    e.preventDefault();
    if (!draggedTaskId) return;
    setCalendarTasks(prev =>
      prev.map(t => (t.id === draggedTaskId ? { ...t, date: targetDate } : t))
    );
    setDraggedTaskId(null);
  };

  const handleSendAiMessage = () => {
    if (!inputMessage.trim()) return;
    const userText = inputMessage;
    const highPriorityCount = calendarTasks.filter(t => t.priority === 'high' && !t.completed).length;
    const uncompletedDailies = dailyTasks.filter(d => !d.completed).length;

    setChatMessages(prev => [
      ...prev,
      { sender: 'user', text: userText },
      {
        sender: 'ai',
        text: `Сейчас у тебя в календаре невыполненных важных занятий (🔥): ${highPriorityCount}, открытых ежедневок: ${uncompletedDailies}. Опыт Дерева знаний: ${totalXp} XP (Уровень ${treeStage.level}).`
      }
    ]);
    setInputMessage('');
  };

  const navItems = [
    { id: 'calendar', label: 'Календарь', icon: '📅' },
    { id: 'dailies', label: 'Ежедневки', icon: '🎯' },
    { id: 'tutors', label: 'Репетиторы', icon: '👨‍🏫' },
    { id: 'tree', label: 'Дерево', icon: '🌳' },
    { id: 'ai', label: 'Наставник', icon: '🤖' },
  ] as const;

  return (
    <div className="flex flex-col md:flex-row h-screen bg-[#0f1117] text-slate-100 font-sans overflow-hidden">
      {isAnalyzingPhoto && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#161b22] border border-indigo-500/40 rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-2xl mx-auto animate-pulse">
              🔍
            </div>
            <h3 className="text-base font-bold">ИИ сканирует расписание...</h3>
            <p className="text-xs text-slate-400">{analyzeStatus || 'Распознаю предмет, даты и темы уроков с фото'}</p>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-500 animate-pulse w-3/4 rounded-full" />
            </div>
          </div>
        </div>
      )}

      <aside className="hidden md:flex w-64 bg-[#161b22] border-r border-slate-800 flex-col justify-between shrink-0">
        <div>
          <div className="p-6 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-lg shadow-lg shadow-indigo-500/30">
              ⚡
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-wide leading-none">EGE Tracker</h1>
              <span className="text-[11px] text-emerald-400 font-medium">🌳 Ур. {treeStage.level} • {totalXp} XP</span>
            </div>
          </div>

          <nav className="px-3 space-y-1">
            {navItems.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 translate-x-1'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{tab.icon}</span>
                  <span>{tab.label}</span>
                </div>
                {tab.id === 'tree' && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">
                    {totalXp} XP
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-4 border-t border-slate-800 space-y-2.5">
          <label className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl cursor-pointer text-sm font-medium transition active:scale-95 shadow-lg shadow-indigo-600/20">
            <span>📷 Загрузить расписание</span>
            <input type="file" accept="image/*" multiple onChange={handlePhotoUpload} className="hidden" />
          </label>
          <button
            onClick={() => setShowKeyModal(true)}
            className="w-full py-1.5 px-3 bg-slate-800/70 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg text-xs transition flex items-center justify-center gap-1.5"
          >
            <span>🔑 {geminiKey ? 'Ключ Gemini подключен' : 'Настроить ключ ИИ'}</span>
          </button>
          <div className="text-[11px] text-slate-500 text-center">
            ID: <span className="text-slate-400 font-mono">{cloudId}</span>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden pb-16 md:pb-0">
        <header className="h-14 md:h-16 border-b border-slate-800 bg-[#161b22]/80 backdrop-blur flex items-center justify-between px-4 md:px-8 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="md:hidden w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-sm">⚡</span>
            <h2 className="text-base md:text-lg font-semibold truncate">
              {activeTab === 'calendar' && 'Календарь подготовки'}
              {activeTab === 'dailies' && 'Ежедневные задачи'}
              {activeTab === 'tutors' && 'Репетиторы и ДЗ'}
              {activeTab === 'tree' && 'Дерево знаний и прогресс'}
              {activeTab === 'ai' && 'ИИ-наставник'}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('tree')}
              className="flex items-center gap-1.5 py-1.5 px-3 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 rounded-lg text-xs font-semibold transition"
            >
              <span>🌳 Ур. {treeStage.level}</span>
              <span className="text-emerald-400/80">({totalXp} XP)</span>
            </button>

            <button
              onClick={() => setShowKeyModal(true)}
              className="md:hidden py-1.5 px-2.5 bg-slate-800 text-slate-300 rounded-lg text-xs"
              title="Ключ ИИ"
            >
              🔑
            </button>

            <label className="md:hidden flex items-center gap-1 py-1.5 px-3 bg-indigo-600 text-white rounded-lg cursor-pointer text-xs font-medium">
              <span>📷 Фото</span>
              <input type="file" accept="image/*" multiple onChange={handlePhotoUpload} className="hidden" />
            </label>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          {activeTab === 'calendar' && (
            <div className="space-y-4 md:space-y-6">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrevMonth}
                    className="w-9 h-9 rounded-xl bg-[#161b22] border border-slate-800 hover:border-slate-700 flex items-center justify-center text-sm"
                    title="Предыдущий месяц"
                  >
                    ◀
                  </button>
                  <div className="min-w-[155px] text-center">
                    <h3 className="text-lg md:text-xl font-bold">
                      {MONTH_NAMES[viewMonth]} {viewYear}
                    </h3>
                  </div>
                  <button
                    onClick={handleNextMonth}
                    className="w-9 h-9 rounded-xl bg-[#161b22] border border-slate-800 hover:border-slate-700 flex items-center justify-center text-sm"
                    title="Следующий месяц"
                  >
                    ▶
                  </button>
                  <button
                    onClick={handleGoToToday}
                    className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-xs text-slate-300 font-medium transition"
                  >
                    Сегодня
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  <label className="bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-200 px-3.5 py-2 rounded-xl text-xs md:text-sm font-medium transition cursor-pointer flex items-center gap-1.5">
                    <span>📷 Скан расписания Умскул</span>
                    <input type="file" accept="image/*" multiple onChange={handlePhotoUpload} className="hidden" />
                  </label>
                  <button
                    onClick={() => openNewTaskModal(todayStr)}
                    className="bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-xl text-xs md:text-sm font-medium transition shadow-lg shadow-indigo-600/20"
                  >
                    + Занятие
                  </button>
                  {calendarTasks.length > 0 && (
                    <button
                      onClick={() => {
                        if (confirm('Очистить все занятия из календаря?')) {
                          setCalendarTasks([]);
                        }
                      }}
                      className="bg-slate-800 hover:bg-rose-950/60 hover:text-rose-300 px-3 py-2 rounded-xl text-xs font-medium text-slate-400 transition"
                    >
                      Очистить
                    </button>
                  )}
                </div>
              </div>

              <div className="hidden md:grid grid-cols-7 gap-2 text-center font-bold text-xs text-slate-500">
                {WEEKDAYS_SHORT.map(day => (
                  <div key={day} className="py-1">{day}</div>
                ))}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5 md:gap-3">
                {Array.from({ length: firstDayOffset }).map((_, emptyIdx) => (
                  <div
                    key={`empty_${emptyIdx}`}
                    className="hidden md:block min-h-[125px] bg-[#161b22]/30 border border-slate-800/30 rounded-2xl"
                  />
                ))}

                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const dayNum = i + 1;
                  const dateStr = formatDateKey(viewYear, viewMonth, dayNum);
                  const dayOfWeekIndex = (firstDayOffset + i) % 7;
                  const weekdayLabel = WEEKDAYS_SHORT[dayOfWeekIndex];
                  const isToday = dateStr === todayStr;
                  const dayTasks = calendarTasks.filter(t => t.date === dateStr);

                  return (
                    <div
                      key={dateStr}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => handleDropOnDay(e, dateStr)}
                      className={`min-h-[115px] md:min-h-[130px] bg-[#161b22] rounded-2xl p-2.5 flex flex-col gap-1.5 transition group ${
                        isToday
                          ? 'border-2 border-indigo-500 shadow-lg shadow-indigo-500/10'
                          : 'border border-slate-800/90 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-xs font-bold ${isToday ? 'text-indigo-400' : 'text-slate-300'}`}>
                            {dayNum}
                          </span>
                          <span className="text-[10px] font-semibold text-slate-500">
                            {weekdayLabel}
                          </span>
                          {isToday && (
                            <span className="text-[9px] bg-indigo-600/30 text-indigo-300 px-1.5 py-0.5 rounded font-semibold">
                              Сегодня
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => openNewTaskModal(dateStr)}
                          className="opacity-70 md:opacity-0 group-hover:opacity-100 text-slate-400 hover:text-white text-xs px-1.5 py-0.5 rounded bg-slate-800/80 transition"
                          title="Добавить задачу"
                        >
                          +
                        </button>
                      </div>

                      <div className="flex flex-col gap-1.5 overflow-y-auto max-h-[95px]">
                        {dayTasks.map(task => {
                          const subj = SUBJECTS.find(s => s.id === task.subjectId);
                          const priorityEmoji = task.priority === 'high' ? '🔥' : task.priority === 'medium' ? '⚡' : '🌱';

                          return (
                            <div
                              key={task.id}
                              draggable
                              onDragStart={(e) => handleDragStart(e, task.id)}
                              onClick={() => {
                                setIsCreatingTask(false);
                                setEditingTask(task);
                              }}
                              className={`text-xs px-2 py-1.5 rounded-lg cursor-pointer flex items-center justify-between shadow-sm transition hover:scale-[1.02] ${
                                task.completed ? 'opacity-50 line-through ring-1 ring-emerald-400/50' : ''
                              } ${subj?.color || 'bg-slate-700 text-white'}`}
                            >
                              <div className="flex items-center gap-1.5 truncate">
                                <input
                                  type="checkbox"
                                  checked={task.completed}
                                  onClick={(e) => e.stopPropagation()}
                                  onChange={() =>
                                    setCalendarTasks(
                                      calendarTasks.map(t =>
                                        t.id === task.id ? { ...t, completed: !t.completed } : t
                                      )
                                    )
                                  }
                                  className="w-3.5 h-3.5 accent-emerald-500 rounded cursor-pointer shrink-0"
                                />
                                <span className="font-extrabold bg-black/25 px-1 rounded text-[10px] shrink-0">
                                  {subj?.short || 'ЕГЭ'}
                                </span>
                                {task.time && (
                                  <span className="text-[10px] font-mono opacity-90 shrink-0">
                                    {task.time}
                                  </span>
                                )}
                                <span className="truncate">{task.title}</span>
                              </div>
                              <span className="shrink-0 ml-1 text-[10px]">{priorityEmoji}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'dailies' && (
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="bg-emerald-950/30 border border-emerald-800/40 rounded-2xl p-4 flex items-center justify-between">
                <div className="text-xs md:text-sm text-emerald-200">
                  🌱 Каждая выполненная ежедневка приносит <strong>+2 XP</strong> твоему Дереву знаний!
                </div>
                <span className="text-xs font-bold text-emerald-400 shrink-0 ml-2">
                  Выполнено: {completedDailiesCount}/{dailyTasks.length}
                </span>
              </div>

              <div className="flex gap-2.5">
                <input
                  type="text"
                  placeholder="Новая ежедневная привычка..."
                  value={newDailyTitle}
                  onChange={(e) => setNewDailyTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newDailyTitle.trim()) {
                      setDailyTasks([...dailyTasks, { id: String(Date.now()), title: newDailyTitle.trim(), completed: false }]);
                      setNewDailyTitle('');
                    }
                  }}
                  className="flex-1 bg-[#161b22] border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-600"
                />
                <button
                  onClick={() => {
                    if (!newDailyTitle.trim()) return;
                    setDailyTasks([...dailyTasks, { id: String(Date.now()), title: newDailyTitle.trim(), completed: false }]);
                    setNewDailyTitle('');
                  }}
                  className="bg-indigo-600 hover:bg-indigo-500 px-5 py-3 rounded-xl font-medium text-sm transition shadow-lg shadow-indigo-600/20 shrink-0"
                >
                  Добавить
                </button>
              </div>

              <div className="space-y-3">
                {dailyTasks.map(task => (
                  <div key={task.id} className="bg-[#161b22] border border-slate-800 p-4 rounded-2xl flex items-center justify-between gap-3 transition hover:border-slate-700">
                    <label className="flex items-center gap-3 cursor-pointer select-none flex-1">
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => setDailyTasks(dailyTasks.map(t => t.id === task.id ? { ...t, completed: !t.completed } : t))}
                        className="w-5 h-5 accent-indigo-600 rounded shrink-0"
                      />
                      <span className={`text-sm ${task.completed ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                        {task.title}
                      </span>
                    </label>
                    <span className="text-[11px] text-emerald-400 font-semibold">+2 XP</span>
                    <button
                      onClick={() => setDailyTasks(dailyTasks.filter(t => t.id !== task.id))}
                      className="text-slate-500 hover:text-rose-400 text-sm px-2 py-1"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'tutors' && (
            <div className="max-w-3xl mx-auto space-y-6">
              <div className="bg-[#161b22] border border-slate-800 p-4 md:p-5 rounded-2xl space-y-4">
                <h3 className="text-sm font-bold text-slate-300">Добавить занятие с репетитором (ДЗ дает +5 XP 🌳)</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <select
                    value={newTutorSubject}
                    onChange={(e) => setNewTutorSubject(e.target.value)}
                    className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-sm"
                  >
                    {SUBJECTS.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="Имя репетитора"
                    value={newTutorName}
                    onChange={(e) => setNewTutorName(e.target.value)}
                    className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-sm"
                  />
                  <input
                    type="date"
                    value={newTutorDate}
                    onChange={(e) => setNewTutorDate(e.target.value)}
                    className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-sm"
                  />
                  <input
                    type="time"
                    value={newTutorTime}
                    onChange={(e) => setNewTutorTime(e.target.value)}
                    className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-sm"
                  />
                </div>
                <div className="flex gap-3">
                  <input
                    type="text"
                    placeholder="Домашнее задание..."
                    value={newTutorHw}
                    onChange={(e) => setNewTutorHw(e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-sm"
                  />
                  <button
                    onClick={() => {
                      if (!newTutorName.trim()) return;
                      setTutors([
                        ...tutors,
                        {
                          id: String(Date.now()),
                          subjectId: newTutorSubject,
                          tutorName: newTutorName.trim(),
                          date: newTutorDate,
                          time: newTutorTime,
                          homework: newTutorHw.trim() || 'Без ДЗ',
                          homeworkDone: false,
                        }
                      ]);
                      setNewTutorName('');
                      setNewTutorHw('');
                    }}
                    className="bg-indigo-600 hover:bg-indigo-500 px-5 py-2.5 rounded-xl text-sm font-medium transition shrink-0"
                  >
                    Добавить
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {tutors.map(tutor => {
                  const subj = SUBJECTS.find(s => s.id === tutor.subjectId);
                  return (
                    <div key={tutor.id} className="bg-[#161b22] border border-slate-800 p-5 rounded-2xl space-y-4">
                      <div className="flex flex-wrap justify-between items-center gap-2">
                        <div className="flex items-center gap-3">
                          <span className={`px-3 py-1 rounded-lg text-xs font-bold ${subj?.color}`}>{subj?.name}</span>
                          <span className="font-semibold text-base md:text-lg">{tutor.tutorName}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs md:text-sm text-slate-400">{tutor.date} в {tutor.time}</span>
                          <button
                            onClick={() => setTutors(tutors.filter(item => item.id !== tutor.id))}
                            className="text-slate-500 hover:text-rose-400 text-sm"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                      <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-3">
                        <span className={`text-sm ${tutor.homeworkDone ? 'line-through text-slate-500' : 'text-slate-300'}`}>
                          ДЗ: {tutor.homework}
                        </span>
                        <label className="flex items-center gap-2 cursor-pointer text-xs font-medium select-none text-emerald-400">
                          <input
                            type="checkbox"
                            checked={tutor.homeworkDone}
                            onChange={() => setTutors(tutors.map(item => item.id === tutor.id ? { ...item, homeworkDone: !item.homeworkDone } : item))}
                            className="w-4 h-4 accent-indigo-600 rounded"
                          />
                          Выполнено (+5 XP)
                        </label>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'tree' && (
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center bg-[#161b22] border border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl">
                <div className="relative flex flex-col items-center justify-center bg-gradient-to-b from-indigo-950/40 via-slate-900/60 to-emerald-950/30 border border-slate-800/80 rounded-2xl p-6 min-h-[320px]">
                  <div className="absolute top-3 left-4 text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Стадия {treeStage.level} из 5
                  </div>

                  <svg viewBox="0 0 200 220" className="w-56 h-56 drop-shadow-lg transition-all duration-500">
                    <ellipse cx="100" cy="195" rx="55" ry="12" fill="#1e293b" />
                    <path d="M65 165 L135 165 L125 200 L75 200 Z" fill="#b45309" />
                    <path d="M60 158 L140 158 L138 168 L62 168 Z" fill="#d97706" />
                    <ellipse cx="100" cy="165" rx="34" ry="6" fill="#451a03" />

                    {treeStage.level === 1 && (
                      <g>
                        <path d="M100 165 Q100 140 100 130" stroke="#22c55e" strokeWidth="5" strokeLinecap="round" fill="none" />
                        <path d="M100 140 Q80 125 75 135 Q85 150 100 142" fill="#4ade80" />
                        <path d="M100 135 Q120 120 125 130 Q115 145 100 137" fill="#22c55e" />
                      </g>
                    )}

                    {treeStage.level === 2 && (
                      <g>
                        <path d="M100 165 Q98 125 100 95" stroke="#854d0e" strokeWidth="7" strokeLinecap="round" fill="none" />
                        <path d="M100 130 L80 110" stroke="#854d0e" strokeWidth="4" strokeLinecap="round" />
                        <path d="M100 120 L122 102" stroke="#854d0e" strokeWidth="4" strokeLinecap="round" />
                        <circle cx="78" cy="105" r="18" fill="#16a34a" />
                        <circle cx="124" cy="98" r="18" fill="#22c55e" />
                        <circle cx="100" cy="85" r="24" fill="#4ade80" />
                      </g>
                    )}

                    {treeStage.level === 3 && (
                      <g>
                        <path d="M100 165 L100 85" stroke="#78350f" strokeWidth="12" strokeLinecap="round" />
                        <path d="M100 125 L70 95" stroke="#78350f" strokeWidth="6" strokeLinecap="round" />
                        <path d="M100 115 L132 88" stroke="#78350f" strokeWidth="6" strokeLinecap="round" />
                        <circle cx="68" cy="90" r="26" fill="#15803d" />
                        <circle cx="132" cy="85" r="26" fill="#16a34a" />
                        <circle cx="100" cy="65" r="34" fill="#22c55e" />
                        <circle cx="85" cy="75" r="22" fill="#4ade80" opacity="0.8" />
                      </g>
                    )}

                    {treeStage.level === 4 && (
                      <g>
                        <path d="M100 165 L100 80" stroke="#78350f" strokeWidth="14" strokeLinecap="round" />
                        <path d="M100 125 L65 90" stroke="#78350f" strokeWidth="7" strokeLinecap="round" />
                        <path d="M100 115 L135 85" stroke="#78350f" strokeWidth="7" strokeLinecap="round" />
                        <circle cx="62" cy="85" r="28" fill="#15803d" />
                        <circle cx="138" cy="82" r="28" fill="#16a34a" />
                        <circle cx="100" cy="60" r="38" fill="#22c55e" />
                        <circle cx="75" cy="65" r="5" fill="#f472b6" />
                        <circle cx="118" cy="52" r="6" fill="#fb7185" />
                        <circle cx="55" cy="88" r="5" fill="#f472b6" />
                        <circle cx="138" cy="78" r="5" fill="#fb7185" />
                        <circle cx="98" cy="40" r="6" fill="#f472b6" />
                        <circle cx="105" cy="78" r="5" fill="#f9a8d4" />
                      </g>
                    )}

                    {treeStage.level >= 5 && (
                      <g>
                        <path d="M100 165 L100 75" stroke="#78350f" strokeWidth="16" strokeLinecap="round" />
                        <path d="M100 125 L60 85" stroke="#78350f" strokeWidth="8" strokeLinecap="round" />
                        <path d="M100 115 L140 80" stroke="#78350f" strokeWidth="8" strokeLinecap="round" />
                        <circle cx="58" cy="82" r="32" fill="#15803d" />
                        <circle cx="142" cy="78" r="32" fill="#15803d" />
                        <circle cx="100" cy="55" r="42" fill="#16a34a" />
                        <circle cx="100" cy="52" r="30" fill="#22c55e" />
                        <circle cx="70" cy="65" r="7" fill="#fbbf24" />
                        <circle cx="125" cy="55" r="7" fill="#f59e0b" />
                        <circle cx="52" cy="88" r="6" fill="#fbbf24" />
                        <circle cx="142" cy="82" r="7" fill="#f59e0b" />
                        <circle cx="100" cy="35" r="8" fill="#fde047" />
                        <circle cx="102" cy="78" r="7" fill="#fbbf24" />
                      </g>
                    )}
                  </svg>

                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={handleWaterTree}
                      disabled={!canWaterToday}
                      className={`px-4 py-2 rounded-xl font-semibold text-xs transition flex items-center gap-1.5 ${
                        canWaterToday
                          ? 'bg-sky-600 hover:bg-sky-500 text-white shadow-lg shadow-sky-600/30 cursor-pointer'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      <span>💧 {canWaterToday ? 'Полить (+1 XP)' : 'Полито сегодня'}</span>
                    </button>
                    <button
                      onClick={handleResetTreeXp}
                      className="px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-rose-950/60 hover:text-rose-300 text-slate-400 text-xs transition"
                      title="Сбросить опыт до 0"
                    >
                      🔄 Сброс XP
                    </button>
                  </div>
                </div>

                <div className="space-y-5">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                      Уровень {treeStage.level}
                    </span>
                    <h3 className="text-2xl font-extrabold mt-1">{treeStage.name}</h3>
                    <p className="text-sm text-slate-400 mt-1">{treeStage.desc}</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-emerald-300">Опыт: {totalXp} XP</span>
                      <span className="text-slate-400">Цель стадии: {treeStage.max} XP</span>
                    </div>
                    <div className="w-full h-3.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                        style={{ width: `${stageProgress}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 pt-2">
                    <div className="bg-slate-900/70 border border-slate-800 p-3 rounded-2xl text-center">
                      <div className="text-lg font-bold text-indigo-400">{completedCalendarCount}</div>
                      <div className="text-[11px] text-slate-400">Уроков (+3..5 XP)</div>
                    </div>
                    <div className="bg-slate-900/70 border border-slate-800 p-3 rounded-2xl text-center">
                      <div className="text-lg font-bold text-emerald-400">{completedDailiesCount}</div>
                      <div className="text-[11px] text-slate-400">Ежедневок (+2 XP)</div>
                    </div>
                    <div className="bg-slate-900/70 border border-slate-800 p-3 rounded-2xl text-center">
                      <div className="text-lg font-bold text-amber-400">{completedTutorsCount}</div>
                      <div className="text-[11px] text-slate-400">ДЗ (+5 XP)</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'ai' && (
            <div className="max-w-3xl mx-auto h-[calc(100vh-11rem)] flex flex-col bg-[#161b22] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="flex-1 p-4 md:p-6 overflow-y-auto space-y-4">
                {chatMessages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] md:max-w-[75%] px-4 py-3 rounded-2xl text-sm ${
                      msg.sender === 'user'
                        ? 'bg-indigo-600 text-white rounded-br-sm'
                        : 'bg-slate-800 text-slate-200 rounded-bl-sm border border-slate-700'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-3 md:p-4 border-t border-slate-800 bg-[#161b22] flex gap-2.5">
                <input
                  type="text"
                  placeholder="Спроси ИИ о распределении нагрузки..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSendAiMessage();
                  }}
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-600"
                />
                <button
                  onClick={handleSendAiMessage}
                  className="bg-indigo-600 hover:bg-indigo-500 px-5 py-3 rounded-xl font-medium text-sm transition shadow-lg shadow-indigo-600/20 shrink-0"
                >
                  Отправить
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#161b22] border-t border-slate-800 flex items-center justify-around px-1 z-40">
        {navItems.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl text-xs font-medium transition ${
              activeTab === tab.id ? 'text-indigo-400' : 'text-slate-400'
            }`}
          >
            <span className="text-base">{tab.icon}</span>
            <span className="text-[10px] mt-0.5">{tab.label}</span>
          </button>
        ))}
      </nav>

      {showKeyModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#161b22] border border-slate-800 w-full max-w-md p-6 rounded-3xl space-y-4 shadow-2xl">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold">🔑 Настройка ключа Vision ИИ</h3>
              <button onClick={() => setShowKeyModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Вставь свой API-ключ из <em>aistudio.google.com</em> (начинается на <strong>AQ.Ab...</strong> или <strong>AIza...</strong>). Сайт сам автоматически подберет доступную модель Gemini Vision:
            </p>
            <input
              type="password"
              placeholder="AQ.Ab8RN6..."
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-600"
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  localStorage.setItem('ege_gemini_api_key', geminiKey.trim());
                  setShowKeyModal(false);
                }}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 py-2.5 rounded-xl font-medium text-sm transition"
              >
                Сохранить
              </button>
              <button
                onClick={() => setShowKeyModal(false)}
                className="px-4 bg-slate-800 hover:bg-slate-700 py-2.5 rounded-xl font-medium text-sm transition"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}

      {editingTask && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#161b22] border border-slate-800 w-full max-w-md p-6 rounded-3xl space-y-4 shadow-2xl">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold">
                {isCreatingTask ? 'Новое занятие' : 'Редактировать занятие'}
              </h3>
              {!isCreatingTask && (
                <button
                  onClick={() => {
                    setCalendarTasks(calendarTasks.filter(t => t.id !== editingTask.id));
                    setEditingTask(null);
                  }}
                  className="text-xs text-rose-400 hover:text-rose-300 font-medium"
                >
                  Удалить
                </button>
              )}
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Предмет</label>
                <select
                  value={editingTask.subjectId}
                  onChange={(e) => setEditingTask({ ...editingTask, subjectId: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm"
                >
                  {SUBJECTS.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Название темы</label>
                <input
                  type="text"
                  placeholder="Например: Разбор 27 задания..."
                  value={editingTask.title}
                  onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Дата</label>
                  <input
                    type="date"
                    value={editingTask.date}
                    onChange={(e) => setEditingTask({ ...editingTask, date: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-2.5 text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Время</label>
                  <input
                    type="time"
                    value={editingTask.time || ''}
                    onChange={(e) => setEditingTask({ ...editingTask, time: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-2.5 text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Важность</label>
                  <select
                    value={editingTask.priority}
                    onChange={(e) => setEditingTask({ ...editingTask, priority: e.target.value as CalendarTask['priority'] })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2 py-2.5 text-xs"
                  >
                    <option value="high">🔥 +5 XP</option>
                    <option value="medium">⚡ +3 XP</option>
                    <option value="normal">🌱 +3 XP</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Личная заметка</label>
                <textarea
                  value={editingTask.note}
                  onChange={(e) => setEditingTask({ ...editingTask, note: e.target.value })}
                  placeholder="Ссылки на вебинар, страницы учебника, заметки..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-sm focus:outline-none focus:border-indigo-600 h-20 resize-none"
                />
              </div>

              <label className="flex items-center gap-2.5 cursor-pointer text-sm text-emerald-400 font-medium pt-1">
                <input
                  type="checkbox"
                  checked={editingTask.completed}
                  onChange={(e) => setEditingTask({ ...editingTask, completed: e.target.checked })}
                  className="w-4 h-4 accent-emerald-500 rounded"
                />
                Отметить как выполненное
              </label>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => {
                  if (!editingTask.title.trim()) return;
                  if (isCreatingTask) {
                    setCalendarTasks([...calendarTasks, editingTask]);
                  } else {
                    setCalendarTasks(calendarTasks.map(t => t.id === editingTask.id ? editingTask : t));
                  }
                  setEditingTask(null);
                }}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 py-3 rounded-xl font-medium text-sm transition shadow-lg shadow-indigo-600/20"
              >
                Сохранить
              </button>
              <button
                onClick={() => setEditingTask(null)}
                className="px-5 bg-slate-800 hover:bg-slate-700 py-3 rounded-xl font-medium text-sm transition"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}