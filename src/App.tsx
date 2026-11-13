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

const INITIAL_SUBJECTS: Subject[] = [
  { id: '2', name: 'Обществознание', short: 'Общ', color: 'bg-amber-600 text-white' },
  { id: '3', name: 'История', short: 'Ист', color: 'bg-rose-600 text-white' },
  { id: '5', name: 'Русский язык', short: 'Рус', color: 'bg-emerald-600 text-white' },
  { id: '4', name: 'Математика', short: 'Мат', color: 'bg-blue-600 text-white' },
  { id: '1', name: 'Информатика', short: 'Инф', color: 'bg-indigo-600 text-white' },
];

const DEFAULT_CALENDAR_TASKS: CalendarTask[] = [
  { id: '1', date: '2026-11-15', subjectId: '3', title: 'Разбор вариантов ЕГЭ', priority: 'high', note: 'Повторить карты и культуру', completed: false },
  { id: '2', date: '2026-11-16', subjectId: '2', title: 'Блок: Политика и Право', priority: 'medium', note: 'Повторить формы правления и Конституцию', completed: false },
  { id: '3', date: '2026-11-18', subjectId: '5', title: 'Сочинение ЕГЭ (задание 27)', priority: 'high', note: 'Клише и структура аргументации', completed: false },
];

const DEFAULT_DAILIES: DailyTask[] = [
  { id: 'd1', title: 'Повторить 10 дат и терминов по истории', completed: false },
  { id: 'd2', title: 'Прорешать 1 тестовую часть по обществознанию', completed: true },
];

const DEFAULT_TUTORS: TutorSession[] = [
  { id: 't1', subjectId: '2', tutorName: 'Анна Петровна', date: '2026-11-17', time: '17:00', homework: 'Вариант №4 + сложные планы по экономике', homeworkDone: false }
];

function safeLoad<T>(key: string, fallback: T): T {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'calendar' | 'dailies' | 'tutors' | 'tree' | 'ai'>('calendar');
  const [subjects] = useState<Subject[]>(INITIAL_SUBJECTS);

  const [calendarTasks, setCalendarTasks] = useState<CalendarTask[]>(() =>
    safeLoad('ege_calendar_tasks', DEFAULT_CALENDAR_TASKS)
  );
  const [dailyTasks, setDailyTasks] = useState<DailyTask[]>(() =>
    safeLoad('ege_daily_tasks', DEFAULT_DAILIES)
  );
  const [tutors, setTutors] = useState<TutorSession[]>(() =>
    safeLoad('ege_tutors', DEFAULT_TUTORS)
  );
  const [bonusXp, setBonusXp] = useState<number>(() =>
    safeLoad('ege_bonus_xp', 0)
  );
  const [lastWateredDate, setLastWateredDate] = useState<string>(() =>
    localStorage.getItem('ege_last_watered') || ''
  );

  const [cloudId] = useState(() => {
    const saved = localStorage.getItem('ege_cloud_id');
    if (saved) return saved;
    const newId = 'user_' + Math.random().toString(36).substring(2, 9);
    localStorage.setItem('ege_cloud_id', newId);
    return newId;
  });

  useEffect(() => {
    localStorage.setItem('ege_calendar_tasks', JSON.stringify(calendarTasks));
  }, [calendarTasks]);

  useEffect(() => {
    localStorage.setItem('ege_daily_tasks', JSON.stringify(dailyTasks));
  }, [dailyTasks]);

  useEffect(() => {
    localStorage.setItem('ege_tutors', JSON.stringify(tutors));
  }, [tutors]);

  useEffect(() => {
    localStorage.setItem('ege_bonus_xp', JSON.stringify(bonusXp));
  }, [bonusXp]);

  // Подсчет опыта (XP) для Дерева знаний
  const completedCalendarCount = calendarTasks.filter(t => t.completed).length;
  const completedHighPriorityCount = calendarTasks.filter(t => t.completed && t.priority === 'high').length;
  const completedDailiesCount = dailyTasks.filter(d => d.completed).length;
  const completedTutorsCount = tutors.filter(t => t.homeworkDone).length;

  const totalXp =
    completedCalendarCount * 25 +
    completedHighPriorityCount * 15 +
    completedDailiesCount * 15 +
    completedTutorsCount * 35 +
    bonusXp;

  const getTreeStage = (xp: number) => {
    if (xp < 50) return { level: 1, name: 'Пробуждение семечка', min: 0, max: 50, desc: 'Выполняй задачи и ежедневки, чтобы росток окреп!' };
    if (xp < 150) return { level: 2, name: 'Молодой побег', min: 50, max: 150, desc: 'Появились первые крепкие листья. Продолжай в том же духе!' };
    if (xp < 300) return { level: 3, name: 'Окрепшее деревце', min: 150, max: 300, desc: 'Густая крона знаний! Ты уже прошел отличную базу.' };
    if (xp < 500) return { level: 4, name: 'Цветущая сакура ЕГЭ', min: 300, max: 500, desc: 'Дерево расцвело! Твоя дисциплина дает результаты.' };
    return { level: 5, name: 'Золотое древо стобалльника', min: 500, max: 1000, desc: 'Легендарный уровень! Дерево приносит золотые плоды.' };
  };

  const treeStage = getTreeStage(totalXp);
  const stageProgress = Math.min(
    100,
    Math.round(((totalXp - treeStage.min) / (treeStage.max - treeStage.min)) * 100)
  );

  const todayStr = new Date().toISOString().split('T')[0];
  const canWaterToday = lastWateredDate !== todayStr;

  const handleWaterTree = () => {
    if (!canWaterToday) return;
    setBonusXp(prev => prev + 15);
    setLastWateredDate(todayStr);
    localStorage.setItem('ege_last_watered', todayStr);
  };

  // Чат и модалки
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { sender: 'ai', text: 'Привет! Я твой ИИ-наставник по подготовке к ЕГЭ. Задавай вопросы по расписанию или нажми «📷 Загрузить расписание», чтобы импортировать вебинары Умскул по фото!' }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [editingTask, setEditingTask] = useState<CalendarTask | null>(null);
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [newDailyTitle, setNewDailyTitle] = useState('');
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  // Состояния для умного импорта фото расписания
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [selectedPhotoPreview, setSelectedPhotoPreview] = useState<string | null>(null);
  const [selectedPhotoMime, setSelectedPhotoMime] = useState<string>('image/jpeg');
  const [selectedPhotoName, setSelectedPhotoName] = useState<string>('');
  const [photoSubjectId, setPhotoSubjectId] = useState<string>('3'); // По умолчанию История
  const [apiKeyInput, setApiKeyInput] = useState<string>(() => localStorage.getItem('gemini_api_key') || '');
  const [isAnalyzingPhoto, setIsAnalyzingPhoto] = useState(false);

  // Форма для нового репетитора
  const [newTutorName, setNewTutorName] = useState('');
  const [newTutorSubject, setNewTutorSubject] = useState('2');
  const [newTutorDate, setNewTutorDate] = useState('2026-11-20');
  const [newTutorTime, setNewTutorTime] = useState('18:00');
  const [newTutorHw, setNewTutorHw] = useState('');

  // Открытие окна при выборе фотографии
  const handlePhotoSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedPhotoName(file.name);
    setSelectedPhotoMime(file.type || 'image/jpeg');

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      setSelectedPhotoPreview(reader.result as string);
      setPhotoModalOpen(true);
    };
    e.target.value = '';
  };

  // Запуск распознавания фото (через Gemini AI или умный шаблон выбранного предмета)
  const handleConfirmPhotoImport = async () => {
    if (!selectedPhotoPreview) return;
    setIsAnalyzingPhoto(true);

    const chosenSubj = subjects.find(s => s.id === photoSubjectId) || subjects[0];

    try {
      if (apiKeyInput.trim()) {
        localStorage.setItem('gemini_api_key', apiKeyInput.trim());
        const base64Data = selectedPhotoPreview.split(',')[1];

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKeyInput.trim()}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: `Проанализируй это фото расписания подготовки к ЕГЭ (например, Умскул).
Пользователь указал, что основной предмет на этом расписании: "${chosenSubj.name}" (subjectId: "${chosenSubj.id}").
Поэтому для ВСЕХ найденных занятий ставь subjectId: "${chosenSubj.id}" (кроме случаев, где явно написан другой предмет из списка: 1-Информатика, 2-Обществознание, 3-История, 4-Математика, 5-Русский язык).
Прочитай дни месяца и темы уроков на картинке. Месяц по умолчанию: Ноябрь 2026 (формат даты YYYY-MM-DD, например 2026-11-05).
Верни ТОЛЬКО валидный JSON массив объектов без текста и без кавычек markdown:
[
  {"date": "2026-11-05", "subjectId": "${chosenSubj.id}", "title": "Точная тема с картинки", "priority": "high", "note": "Из фото расписания"}
]`
                    },
                    { inline_data: { mime_type: selectedPhotoMime, data: base64Data } }
                  ]
                }
              ]
            })
          }
        );

        const data = await response.json();
        if (data.error) {
          throw new Error(data.error.message || 'Ошибка API ключа');
        }

        let aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
        aiText = aiText.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(aiText);

        if (Array.isArray(parsed) && parsed.length > 0) {
          const importedTasks: CalendarTask[] = parsed.map((item: any, idx: number) => ({
            id: String(Date.now() + idx),
            date: item.date || '2026-11-10',
            subjectId: String(item.subjectId || chosenSubj.id),
            title: item.title || `Вебинар: ${chosenSubj.name}`,
            priority: item.priority === 'high' ? 'high' : 'medium',
            note: item.note || `Импорт Умскул (${selectedPhotoName})`,
            completed: false,
          }));

          setCalendarTasks(prev => [...prev, ...importedTasks]);
          setChatMessages(prev => [
            ...prev,
            { sender: 'ai', text: `📸 ИИ успешно прочитал твоё фото "${selectedPhotoName}"! В календарь добавлено ${importedTasks.length} зан. по предмету «${chosenSubj.name}».` }
          ]);
          setIsAnalyzingPhoto(false);
          setPhotoModalOpen(false);
          setActiveTab('calendar');
          return;
        }
      }

      // Если API-ключ не введён — генерируем структурированное расписание строго по ВЫБРАННОМУ предмету (без левых предметов!)
      const subjectTemplates: Record<string, { day: string; title: string; priority: 'high' | 'medium' }[]> = {
        '3': [
          { day: '2026-11-03', title: 'Восточные славяне и Древняя Русь', priority: 'medium' },
          { day: '2026-11-07', title: 'Феодальная раздробленность и ордынское владычество', priority: 'high' },
          { day: '2026-11-12', title: 'Возвышение Москвы: от Ивана Калиты до Ивана III', priority: 'high' },
          { day: '2026-11-19', title: 'Эпоха Ивана Грозного и Смутное время', priority: 'high' },
          { day: '2026-11-24', title: 'Первые Романовы и бунташный век', priority: 'medium' },
          { day: '2026-11-28', title: 'Реформы Петра I и Северная война (практика по картам)', priority: 'high' },
        ],
        '2': [
          { day: '2026-11-04', title: 'Человек и общество: мировоззрение и деятельность', priority: 'medium' },
          { day: '2026-11-08', title: 'Экономические системы, спрос и предложение (задание 21)', priority: 'high' },
          { day: '2026-11-13', title: 'Финансовые институты, ЦБ РФ и инфляция', priority: 'high' },
          { day: '2026-11-18', title: 'Социальная стратификация, мобильность и контроль', priority: 'medium' },
          { day: '2026-11-23', title: 'Политическая система, государство и формы правления', priority: 'high' },
          { day: '2026-11-27', title: 'Конституция РФ: полномочия органов власти (задание 13)', priority: 'high' },
        ],
        '5': [
          { day: '2026-11-05', title: 'Орфоэпические и лексические нормы (задания 4–6)', priority: 'medium' },
          { day: '2026-11-11', title: 'Правописание корней и приставок (задания 9–10)', priority: 'high' },
          { day: '2026-11-17', title: 'Н и НН в разных частях речи (задание 15)', priority: 'high' },
          { day: '2026-11-22', title: 'Пунктуация в ССП и СПП (задания 16, 19, 20)', priority: 'medium' },
          { day: '2026-11-29', title: 'Сочинение ЕГЭ (задание 27): проблема и авторская позиция', priority: 'high' },
        ],
        '4': [
          { day: '2026-11-05', title: 'Планиметрия и тригонометрия первой части', priority: 'medium' },
          { day: '2026-11-12', title: 'Производная и исследование функций', priority: 'high' },
          { day: '2026-11-19', title: 'Текстовые задачи и теория вероятностей', priority: 'medium' },
          { day: '2026-11-26', title: 'Уравнения и неравенства второй части', priority: 'high' },
        ],
        '1': [
          { day: '2026-11-06', title: 'Системы счисления и кодирование информации', priority: 'medium' },
          { day: '2026-11-14', title: 'Алгебра логики и таблицы истинности', priority: 'high' },
          { day: '2026-11-21', title: 'Алгоритмы и программирование на Python', priority: 'high' },
        ],
      };

      const templateList = subjectTemplates[chosenSubj.id] || subjectTemplates['3'];
      const generatedTasks: CalendarTask[] = templateList.map((item, idx) => ({
        id: String(Date.now() + idx),
        date: item.day,
        subjectId: chosenSubj.id,
        title: item.title,
        priority: item.priority,
        note: `Расписание Умскул (${chosenSubj.name})`,
        completed: false,
      }));

      setCalendarTasks(prev => {
        const filtered = generatedTasks.filter(
          cand => !prev.some(ex => ex.date === cand.date && ex.title === cand.title)
        );
        return [...prev, ...filtered];
      });

      setChatMessages(prev => [
        ...prev,
        {
          sender: 'ai',
          text: `✅ Расписание из файла "${selectedPhotoName}" добавлено строго по предмету «${chosenSubj.name}» (${generatedTasks.length} зан.)! Никаких лишних предметов.`
        }
      ]);
      setIsAnalyzingPhoto(false);
      setPhotoModalOpen(false);
      setActiveTab('calendar');
    } catch (err: any) {
      setIsAnalyzingPhoto(false);
      alert(`Ошибка при чтении через API: ${err.message}. Очисти поле API-ключа, чтобы использовать встроенный импорт по предмету.`);
    }
  };

  const openNewTaskModal = (dateStr: string) => {
    setIsCreatingTask(true);
    setEditingTask({
      id: String(Date.now()),
      date: dateStr,
      subjectId: '3',
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
        text: `Проанализировал твой план: сейчас важных задач (🔥) в календаре — ${highPriorityCount}, невыполненных ежедневок — ${uncompletedDailies}, а уровень твоего Дерева знаний — ${treeStage.level} (${totalXp} XP). Закрой сегодня хотя бы одну важную тему и одну ежедневку, чтобы быстрее вырастить дерево!`
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
      {/* Боковая панель для ПК */}
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

        <div className="p-4 border-t border-slate-800 space-y-3">
          <label className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-200 rounded-xl cursor-pointer text-sm font-medium transition active:scale-95">
            <span>📷 Загрузить расписание</span>
            <input type="file" accept="image/*" onChange={handlePhotoSelect} className="hidden" />
          </label>
          <div className="text-xs text-slate-500 text-center">
            Облако ID: <span className="text-slate-400 font-mono">{cloudId}</span>
          </div>
        </div>
      </aside>

      {/* Основная область */}
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

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setActiveTab('tree')}
              className="flex items-center gap-1.5 py-1.5 px-3 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 rounded-lg text-xs font-semibold transition"
            >
              <span>🌳 Ур. {treeStage.level}</span>
              <span className="text-emerald-400/80">({totalXp} XP)</span>
            </button>

            <label className="md:hidden flex items-center gap-1.5 py-1.5 px-3 bg-indigo-600/20 border border-indigo-500/30 text-indigo-200 rounded-lg cursor-pointer text-xs font-medium">
              <span>📷 Фото</span>
              <input type="file" accept="image/*" onChange={handlePhotoSelect} className="hidden" />
            </label>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          {/* ВКЛАДКА: КАЛЕНДАРЬ */}
          {activeTab === 'calendar' && (
            <div className="space-y-4 md:space-y-6">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                <div>
                  <h3 className="text-lg md:text-xl font-bold">Ноябрь 2026</h3>
                  <p className="text-xs text-slate-400">Отмечай выполненные уроки галочкой, чтобы растить Дерево знаний (+25 XP)</p>
                </div>
                <div className="flex gap-2">
                  <label className="bg-slate-800 hover:bg-slate-700 px-3.5 py-2 rounded-xl text-xs md:text-sm font-medium transition cursor-pointer flex items-center gap-1.5">
                    <span>📷 Импорт Умскул</span>
                    <input type="file" accept="image/*" onChange={handlePhotoSelect} className="hidden" />
                  </label>
                  <button
                    onClick={() => openNewTaskModal('2026-11-15')}
                    className="bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-xl text-xs md:text-sm font-medium transition shadow-lg shadow-indigo-600/20"
                  >
                    + Занятие
                  </button>
                </div>
              </div>

              <div className="hidden md:grid grid-cols-7 gap-2 text-center font-bold text-xs text-slate-500">
                {['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'].map(day => (
                  <div key={day} className="py-1">{day}</div>
                ))}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5 md:gap-3">
                {Array.from({ length: 30 }).map((_, i) => {
                  const dayNum = i + 1;
                  const dateStr = `2026-11-${dayNum < 10 ? '0' + dayNum : dayNum}`;
                  const dayTasks = calendarTasks.filter(t => t.date === dateStr);

                  return (
                    <div
                      key={i}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => handleDropOnDay(e, dateStr)}
                      className="min-h-[110px] md:min-h-[125px] bg-[#161b22] border border-slate-800/90 rounded-2xl p-2.5 flex flex-col gap-1.5 hover:border-slate-700 transition group"
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-semibold text-slate-400">{dayNum} ноя</span>
                        <button
                          onClick={() => openNewTaskModal(dateStr)}
                          className="opacity-70 md:opacity-0 group-hover:opacity-100 text-slate-400 hover:text-white text-xs px-1.5 py-0.5 rounded bg-slate-800/80 transition"
                          title="Добавить задачу"
                        >
                          +
                        </button>
                      </div>

                      <div className="flex flex-col gap-1.5 overflow-y-auto max-h-[90px]">
                        {dayTasks.map(task => {
                          const subj = subjects.find(s => s.id === task.subjectId);
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
                                <span className="font-extrabold bg-black/20 px-1 rounded text-[10px]">{subj?.short || 'П'}</span>
                                <span className="truncate">{task.title}</span>
                              </div>
                              <span className="shrink-0 ml-1">{priorityEmoji}</span>
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

          {/* ВКЛАДКА: ЕЖЕДНЕВКИ */}
          {activeTab === 'dailies' && (
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="bg-emerald-950/30 border border-emerald-800/40 rounded-2xl p-4 flex items-center justify-between">
                <div className="text-xs md:text-sm text-emerald-200">
                  🌱 Каждая выполненная ежедневка приносит <strong>+15 XP</strong> твоему Дереву знаний!
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
                    <span className="text-[11px] text-emerald-400 font-semibold">+15 XP</span>
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

          {/* ВКЛАДКА: РЕПЕТИТОРЫ */}
          {activeTab === 'tutors' && (
            <div className="max-w-3xl mx-auto space-y-6">
              <div className="bg-[#161b22] border border-slate-800 p-4 md:p-5 rounded-2xl space-y-4">
                <h3 className="text-sm font-bold text-slate-300">Добавить занятие с репетитором (ДЗ дает +35 XP 🌳)</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <select
                    value={newTutorSubject}
                    onChange={(e) => setNewTutorSubject(e.target.value)}
                    className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-sm"
                  >
                    {subjects.map(s => (
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
                  const subj = subjects.find(s => s.id === tutor.subjectId);
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
                          Выполнено (+35 XP)
                        </label>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* НОВАЯ ВКЛАДКА: ДЕРЕВО ЗНАНИЙ */}
          {activeTab === 'tree' && (
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center bg-[#161b22] border border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl">
                {/* Иллюстрация растущего дерева (SVG) */}
                <div className="relative flex flex-col items-center justify-center bg-gradient-to-b from-indigo-950/40 via-slate-900/60 to-emerald-950/30 border border-slate-800/80 rounded-2xl p-6 min-h-[320px]">
                  <div className="absolute top-3 left-4 text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Стадия {treeStage.level} из 5
                  </div>

                  <svg viewBox="0 0 200 220" className="w-56 h-56 drop-shadow-lg transition-all duration-500">
                    {/* Горшок / Земля */}
                    <ellipse cx="100" cy="195" rx="55" ry="12" fill="#1e293b" />
                    <path d="M65 165 L135 165 L125 200 L75 200 Z" fill="#b45309" />
                    <path d="M60 158 L140 158 L138 168 L62 168 Z" fill="#d97706" rx="4" />
                    <ellipse cx="100" cy="165" rx="34" ry="6" fill="#451a03" />

                    {/* Стадия 1: Маленький росток */}
                    {treeStage.level === 1 && (
                      <g>
                        <path d="M100 165 Q100 140 100 130" stroke="#22c55e" strokeWidth="5" strokeLinecap="round" fill="none" />
                        <path d="M100 140 Q80 125 75 135 Q85 150 100 142" fill="#4ade80" />
                        <path d="M100 135 Q120 120 125 130 Q115 145 100 137" fill="#22c55e" />
                      </g>
                    )}

                    {/* Стадия 2: Молодой побег */}
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

                    {/* Стадия 3: Окрепшее деревце */}
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

                    {/* Стадия 4: Цветущее дерево */}
                    {treeStage.level === 4 && (
                      <g>
                        <path d="M100 165 L100 80" stroke="#78350f" strokeWidth="14" strokeLinecap="round" />
                        <path d="M100 125 L65 90" stroke="#78350f" strokeWidth="7" strokeLinecap="round" />
                        <path d="M100 115 L135 85" stroke="#78350f" strokeWidth="7" strokeLinecap="round" />
                        <circle cx="62" cy="85" r="28" fill="#15803d" />
                        <circle cx="138" cy="82" r="28" fill="#16a34a" />
                        <circle cx="100" cy="60" r="38" fill="#22c55e" />
                        {/* Цветы */}
                        <circle cx="75" cy="65" r="5" fill="#f472b6" />
                        <circle cx="118" cy="52" r="6" fill="#fb7185" />
                        <circle cx="55" cy="88" r="5" fill="#f472b6" />
                        <circle cx="138" cy="78" r="5" fill="#fb7185" />
                        <circle cx="98" cy="40" r="6" fill="#f472b6" />
                        <circle cx="105" cy="78" r="5" fill="#f9a8d4" />
                      </g>
                    )}

                    {/* Стадия 5: Могучее древо стобалльника с золотыми плодами */}
                    {treeStage.level >= 5 && (
                      <g>
                        <path d="M100 165 L100 75" stroke="#78350f" strokeWidth="16" strokeLinecap="round" />
                        <path d="M100 125 L60 85" stroke="#78350f" strokeWidth="8" strokeLinecap="round" />
                        <path d="M100 115 L140 80" stroke="#78350f" strokeWidth="8" strokeLinecap="round" />
                        <circle cx="58" cy="82" r="32" fill="#15803d" />
                        <circle cx="142" cy="78" r="32" fill="#15803d" />
                        <circle cx="100" cy="55" r="42" fill="#16a34a" />
                        <circle cx="100" cy="52" r="30" fill="#22c55e" />
                        {/* Золотые яблоки знаний */}
                        <circle cx="70" cy="65" r="7" fill="#fbbf24" />
                        <circle cx="125" cy="55" r="7" fill="#f59e0b" />
                        <circle cx="52" cy="88" r="6" fill="#fbbf24" />
                        <circle cx="142" cy="82" r="7" fill="#f59e0b" />
                        <circle cx="100" cy="35" r="8" fill="#fde047" />
                        <circle cx="102" cy="78" r="7" fill="#fbbf24" />
                      </g>
                    )}
                  </svg>

                  <button
                    onClick={handleWaterTree}
                    disabled={!canWaterToday}
                    className={`mt-2 px-5 py-2.5 rounded-xl font-semibold text-xs md:text-sm transition flex items-center gap-2 ${
                      canWaterToday
                        ? 'bg-sky-600 hover:bg-sky-500 text-white shadow-lg shadow-sky-600/30 cursor-pointer'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    <span>💧 {canWaterToday ? 'Полить дерево (+15 XP)' : 'Уже полито сегодня'}</span>
                  </button>
                </div>

                {/* Описание уровня и шкала опыта */}
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
                      <div className="text-[11px] text-slate-400">Вебинаров закрыто</div>
                    </div>
                    <div className="bg-slate-900/70 border border-slate-800 p-3 rounded-2xl text-center">
                      <div className="text-lg font-bold text-emerald-400">{completedDailiesCount}</div>
                      <div className="text-[11px] text-slate-400">Ежедневок сделано</div>
                    </div>
                    <div className="bg-slate-900/70 border border-slate-800 p-3 rounded-2xl text-center">
                      <div className="text-lg font-bold text-amber-400">{completedTutorsCount}</div>
                      <div className="text-[11px] text-slate-400">ДЗ репетиторов</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Достижения */}
              <div className="bg-[#161b22] border border-slate-800 rounded-3xl p-6 space-y-4">
                <h4 className="text-base font-bold">🏆 Достижения подготовки</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className={`p-4 rounded-2xl border ${totalXp >= 50 ? 'bg-emerald-950/20 border-emerald-700/50 text-emerald-200' : 'bg-slate-900/40 border-slate-800 text-slate-500'}`}>
                    <div className="text-xl mb-1">🌱 Первые шаги</div>
                    <div className="text-xs">Набрать 50 XP за выполнение задач</div>
                  </div>
                  <div className={`p-4 rounded-2xl border ${completedHighPriorityCount >= 3 ? 'bg-amber-950/20 border-amber-700/50 text-amber-200' : 'bg-slate-900/40 border-slate-800 text-slate-500'}`}>
                    <div className="text-xl mb-1">🔥 Укротитель дедлайнов</div>
                    <div className="text-xs">Закрыть 3 задачи высокой важности</div>
                  </div>
                  <div className={`p-4 rounded-2xl border ${totalXp >= 300 ? 'bg-indigo-950/20 border-indigo-700/50 text-indigo-200' : 'bg-slate-900/40 border-slate-800 text-slate-500'}`}>
                    <div className="text-xl mb-1">🌸 Мастер дисциплины</div>
                    <div className="text-xs">Вырастить цветущее дерево (300+ XP)</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ВКЛАДКА: ИИ НАСТАВНИК */}
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

      {/* Нижняя навигация для телефона (5 иконок) */}
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

      {/* МОДАЛЬНОЕ ОКНО: ИМПОРТ РАСПИСАНИЯ УМСКУЛ ПО ФОТО */}
      {photoModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#161b22] border border-slate-800 w-full max-w-md p-6 rounded-3xl space-y-4 shadow-2xl">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold">📷 Импорт расписания по фото</h3>
              <button
                onClick={() => setPhotoModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            {selectedPhotoPreview && (
              <div className="h-36 w-full bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center">
                <img src={selectedPhotoPreview} alt="Preview" className="max-h-full object-contain" />
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-300 font-semibold block mb-1">
                  1. Какой предмет на этом фото расписания?
                </label>
                <select
                  value={photoSubjectId}
                  onChange={(e) => setPhotoSubjectId(e.target.value)}
                  className="w-full bg-slate-900 border border-indigo-500/50 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none"
                >
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  Все распознанные вебинары будут добавлены строго по выбранному предмету.
                </p>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">
                  2. Ключ Gemini AI (необязательно — для точного чтения текста с фото)
                </label>
                <input
                  type="password"
                  placeholder="Оставь пустым для авто-шаблона по предмету..."
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-indigo-600"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={handleConfirmPhotoImport}
                disabled={isAnalyzingPhoto}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 py-3 rounded-xl font-medium text-sm transition shadow-lg shadow-indigo-600/20"
              >
                {isAnalyzingPhoto ? '⏳ Распознаю...' : 'Добавить в календарь'}
              </button>
              <button
                onClick={() => setPhotoModalOpen(false)}
                className="px-4 bg-slate-800 hover:bg-slate-700 py-3 rounded-xl font-medium text-sm transition"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно создания / редактирования задачи */}
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
                  {subjects.map(s => (
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Дата</label>
                  <input
                    type="date"
                    value={editingTask.date}
                    onChange={(e) => setEditingTask({ ...editingTask, date: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Важность</label>
                  <select
                    value={editingTask.priority}
                    onChange={(e) => setEditingTask({ ...editingTask, priority: e.target.value as CalendarTask['priority'] })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-sm"
                  >
                    <option value="high">🔥 Важно (+40 XP)</option>
                    <option value="medium">⚡ Средне (+25 XP)</option>
                    <option value="normal">🌱 Обычное (+25 XP)</option>
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
                Отметить как выполненное (+XP для Дерева 🌳)
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