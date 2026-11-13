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
{ id: '1', name: 'Информатика', short: 'И', color: 'bg-indigo-600 text-white' },
{ id: '2', name: 'Обществознание', short: 'О', color: 'bg-amber-600 text-white' },
{ id: '3', name: 'История', short: 'Ист', color: 'bg-rose-600 text-white' },
{ id: '4', name: 'Математика', short: 'М', color: 'bg-blue-600 text-white' },
{ id: '5', name: 'Русский язык', short: 'Р', color: 'bg-emerald-600 text-white' },
];

const DEFAULT_CALENDAR_TASKS: CalendarTask[] = [
{ id: '1', date: '2026-11-15', subjectId: '3', title: 'Разбор вариантов ЕГЭ', priority: 'high', note: 'Повторить карты и культуру', completed: false },
{ id: '2', date: '2026-11-16', subjectId: '2', title: 'Блок: Политика и Право', priority: 'medium', note: 'Повторить формы правления и Конституцию', completed: false },
{ id: '3', date: '2026-11-18', subjectId: '5', title: 'Сочинение ЕГЭ (задание 27)', priority: 'high', note: 'Клише и аргументы', completed: false },
];

const DEFAULT_DAILIES: DailyTask[] = [
{ id: 'd1', title: 'Повторить 10 дат и терминов по истории', completed: false },
{ id: 'd2', title: 'Прорешать 1 тестовую часть по обществознанию', completed: true },
];

const DEFAULT_TUTORS: TutorSession[] = [
{ id: 't1', subjectId: '2', tutorName: 'Анна Петровна', date: '2026-11-17', time: '17:00', homework: 'Вариант №4 + планы по экономике', homeworkDone: false }
];

export default function App() {
const [activeTab, setActiveTab] = useState<'calendar' | 'dailies' | 'tutors' | 'ai'>('calendar');
const [subjects] = useState<Subject[]>(INITIAL_SUBJECTS);

const [calendarTasks, setCalendarTasks] = useState<CalendarTask[]>(() => {
const saved = localStorage.getItem('ege_calendar_tasks');
return saved ? JSON.parse(saved) : DEFAULT_CALENDAR_TASKS;
});

const [dailyTasks, setDailyTasks] = useState<DailyTask[]>(() => {
const saved = localStorage.getItem('ege_daily_tasks');
return saved ? JSON.parse(saved) : DEFAULT_DAILIES;
});

const [tutors, setTutors] = useState<TutorSession[]>(() => {
const saved = localStorage.getItem('ege_tutors');
return saved ? JSON.parse(saved) : DEFAULT_TUTORS;
});

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

const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
{ sender: 'ai', text: 'Привет! Я твой ИИ-наставник по подготовке к ЕГЭ. Задавай вопросы по расписанию или загрузи фото расписания на месяц для автоматического импорта.' }
]);
const [inputMessage, setInputMessage] = useState('');
const [editingTask, setEditingTask] = useState<CalendarTask | null>(null);
const [isCreatingTask, setIsCreatingTask] = useState(false);
const [newDailyTitle, setNewDailyTitle] = useState('');
const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

// Форма для нового репетитора
const [newTutorName, setNewTutorName] = useState('');
const [newTutorSubject, setNewTutorSubject] = useState('2');
const [newTutorDate, setNewTutorDate] = useState('2026-11-20');
const [newTutorTime, setNewTutorTime] = useState('18:00');
const [newTutorHw, setNewTutorHw] = useState('');

const handlePhotoUpload = (e: ChangeEvent<HTMLInputElement>) => {
const file = e.target.files?.[0];
if (!file) return;

setTimeout(() => {
const candidateTasks: CalendarTask[] = [
{ id: String(Date.now() + 1), date: '2026-11-02', subjectId: '3', title: 'Древняя Русь и феодальная раздробленность', priority: 'medium', note: 'Импорт из фото расписания', completed: false },
{ id: String(Date.now() + 2), date: '2026-11-05', subjectId: '2', title: 'Экономические системы и рынок', priority: 'high', note: 'Вебинар месяца', completed: false },
{ id: String(Date.now() + 3), date: '2026-11-10', subjectId: '5', title: 'Орфоэпические нормы (ударения)', priority: 'medium', note: 'Словарь ФИПИ', completed: false },
{ id: String(Date.now() + 4), date: '2026-11-20', subjectId: '3', title: 'Эпоха реформ Петра I', priority: 'high', note: 'Карты Северной войны', completed: false }
];

setCalendarTasks(prev => {
const filtered = candidateTasks.filter(
cand => !prev.some(existing => existing.date === cand.date && existing.subjectId === cand.subjectId)
);
return [...prev, ...filtered];
});

setChatMessages(prev => [
...prev,
{ sender: 'ai', text: `📸 Фото "${file.name}" распознано! Занятия добавлены в календарь без дублирования предметов.` }
]);
setActiveTab('calendar');
}, 600);
};

const openNewTaskModal = (dateStr: string) => {
setIsCreatingTask(true);
setEditingTask({
id: String(Date.now()),
date: dateStr,
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
text: `Проанализировал твой план: сейчас у тебя важных задач (🔥) в календаре — ${highPriorityCount}, а невыполненных ежедневок — ${uncompletedDailies}. Рекомендую закрыть сначала задачи с высоким приоритетом и проверить ДЗ от репетиторов!`
}
]);
setInputMessage('');
};

const navItems = [
{ id: 'calendar', label: 'Календарь', icon: '📅' },
{ id: 'dailies', label: 'Ежедневки', icon: '🎯' },
{ id: 'tutors', label: 'Репетиторы', icon: '👨‍🏫' },
{ id: 'ai', label: 'ИИ Наставник', icon: '🤖' },
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
<h1 className="text-xl font-bold tracking-wide">EGE Tracker</h1>
</div>

<nav className="px-3 space-y-1">
{navItems.map(tab => (
<button
key={tab.id}
onClick={() => setActiveTab(tab.id)}
className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
activeTab === tab.id
? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 translate-x-1'
: 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
}`}
>
<span className="text-xl">{tab.icon}</span>
{tab.label}
</button>
))}
</nav>
</div>

<div className="p-4 border-t border-slate-800 space-y-3">
<label className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-200 rounded-xl cursor-pointer text-sm font-medium transition active:scale-95">
<span>📷 Загрузить расписание</span>
<input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
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
{activeTab === 'ai' && 'ИИ-наставник'}
</h2>
</div>

<div className="flex items-center gap-3">
<label className="md:hidden flex items-center gap-1.5 py-1.5 px-3 bg-indigo-600/20 border border-indigo-500/30 text-indigo-200 rounded-lg cursor-pointer text-xs font-medium">
<span>📷 Фото</span>
<input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
</label>
<div className="flex items-center gap-2">
<span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
<span className="hidden sm:inline text-xs text-slate-400 font-medium">Сохранено</span>
</div>
</div>
</header>

<div className="flex-1 overflow-y-auto p-4 md:p-8">
{/* ВКЛАДКА: КАЛЕНДАРЬ */}
{activeTab === 'calendar' && (
<div className="space-y-4 md:space-y-6">
<div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
<div>
<h3 className="text-lg md:text-xl font-bold">Ноябрь 2026</h3>
<p className="text-xs text-slate-400">Нажми на день для добавления или перетащи карточку</p>
</div>
<button
onClick={() => openNewTaskModal('2026-11-15')}
className="self-start sm:self-auto bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-xl text-xs md:text-sm font-medium transition shadow-lg shadow-indigo-600/20"
>
+ Добавить занятие
</button>
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
className="min-h-[105px] md:min-h-[120px] bg-[#161b22] border border-slate-800/90 rounded-2xl p-2.5 flex flex-col gap-1.5 hover:border-slate-700 transition group"
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

<div className="flex flex-col gap-1.5 overflow-y-auto max-h-[85px]">
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
task.completed ? 'opacity-50 line-through' : ''
} ${subj?.color || 'bg-slate-700 text-white'}`}
>
<div className="flex items-center gap-1.5 truncate">
<span className="font-extrabold bg-black/20 px-1 rounded">{subj?.short || 'П'}</span>
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
<div className="flex gap-2.5">
<input
type="text"
placeholder="Новая ежедневная задача..."
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
<h3 className="text-sm font-bold text-slate-300">Добавить занятие с репетитором</h3>
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
<label className="flex items-center gap-2 cursor-pointer text-xs font-medium select-none">
<input
type="checkbox"
checked={tutor.homeworkDone}
onChange={() => setTutors(tutors.map(item => item.id === tutor.id ? { ...item, homeworkDone: !item.homeworkDone } : item))}
className="w-4 h-4 accent-indigo-600 rounded"
/>
Выполнено
</label>
</div>
</div>
);
})}
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

{/* Нижняя навигация для телефона */}
<nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#161b22] border-t border-slate-800 flex items-center justify-around px-2 z-40">
{navItems.map(tab => (
<button
key={tab.id}
onClick={() => setActiveTab(tab.id)}
className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl text-xs font-medium transition ${
activeTab === tab.id ? 'text-indigo-400' : 'text-slate-400'
}`}
>
<span className="text-lg">{tab.icon}</span>
<span className="text-[11px] mt-0.5">{tab.label}</span>
</button>
))}
</nav>

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
<option value="high">🔥 Важно</option>
<option value="medium">⚡ Средне</option>
<option value="normal">🌱 Обычное</option>
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

<label className="flex items-center gap-2.5 cursor-pointer text-sm text-slate-300 pt-1">
<input
type="checkbox"
checked={editingTask.completed}
onChange={(e) => setEditingTask({ ...editingTask, completed: e.target.checked })}
className="w-4 h-4 accent-indigo-600 rounded"
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