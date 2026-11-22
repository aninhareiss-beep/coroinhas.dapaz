
import { initializeApp } from 'https://www.gstatic.com/firebasejs/13.4.0/firebase-app.js';

import {
    getAuth,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/13.4.0/firebase-auth.js';

import {
    getFirestore,
    collection,
    doc,
    getDocs,
    setDoc,
    updateDoc,
    deleteDoc,
    writeBatch
} from 'https://www.gstatic.com/firebasejs/13.4.0/firebase-firestore.js';


// =====================================
// CONFIGURAÇÃO DO FIREBASE
// =====================================

const ADMIN_EMAIL = 'aninhareiss@yahoo.com';

const firebaseConfig = {
    apiKey: 'AIzaSyA-0ySzJ-edLBIskqZOo6loE3x47MD2Y78',
    authDomain: 'coroinhas-paroquia.firebaseapp.com',
    projectId: 'coroinhas-paroquia',
    storageBucket: 'coroinhas-paroquia.firebasestorage.app',
    messagingSenderId: '1063327604279',
    appId: '1:1063327604279:web:b7d45d6e973d89f0bee9b2'
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const $ = id => document.getElementById(id);


// =====================================
// DADOS DO SISTEMA
// =====================================

let children = [];
let publicChildren = [];
let celebrations = [];
let availabilities = [];
let schedules = [];
let selectedDates = [];

let calendarDate = new Date();
calendarDate.setDate(1);

const months = [
    'janeiro', 'fevereiro', 'março',
    'abril', 'maio', 'junho',
    'julho', 'agosto', 'setembro',
    'outubro', 'novembro', 'dezembro'
];

const weekdays = [
    'DOM', 'SEG', 'TER', 'QUA',
    'QUI', 'SEX', 'SÁB'
];


// =====================================
// AVISOS
// =====================================

function showToast(message) {

    const toast = $('toast');

    if (!toast) return;

    toast.textContent = message;
    toast.classList.add('show');

    clearTimeout(window.toastTimeout);

    window.toastTimeout = setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}


// =====================================
// NAVEGAÇÃO
// =====================================

function showPage(id) {

    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });

    $(id)?.classList.add('active');

    $('navigation')?.classList.remove('open');

    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });

    if (id === 'parents') {
        renderCalendar();
        loadPublicChildren();
    }
}

function toggleMenu() {
    $('navigation')?.classList.toggle('open');
}

function showAdminTab(id, button) {

    document.querySelectorAll('.admin-content').forEach(tab => {
        tab.classList.remove('active');
    });

    document.querySelectorAll('.admin-tab').forEach(tab => {
        tab.classList.remove('active');
    });

    $(id)?.classList.add('active');

    button?.classList.add('active');
}


// =====================================
// CALENDÁRIO
// =====================================

function dateKey(date) {

    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function formatDate(key) {

    const [year, month, day] = key.split('-');

    return `${day}/${month}/${year}`;
}

function renderCalendar() {

    const calendar = $('calendar');

    if (!calendar) return;

    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();

    $('calendarMonth').textContent = months[month];
    $('calendarYear').textContent = year;

    calendar.innerHTML = '';

    weekdays.forEach(day => {

        const element = document.createElement('div');

        element.className = 'calendar-weekday';
        element.textContent = day;

        calendar.append(element);
    });

    const firstDay = new Date(year, month, 1).getDay();
    const lastDay = new Date(year, month + 1, 0).getDate();

    for (let i = 0; i < firstDay; i++) {

        const element = document.createElement('div');

        element.className = 'calendar-day empty';

        calendar.append(element);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let day = 1; day <= lastDay; day++) {

        const date = new Date(year, month, day);
        const key = dateKey(date);

        const button = document.createElement('button');

        button.type = 'button';
        button.className = 'calendar-day';
        button.textContent = day;

        if (date.getTime() === today.getTime()) {
            button.classList.add('today');
        }

        if (selectedDates.includes(key)) {
            button.classList.add('selected');
        }

        if (date < today) {
            button.disabled = true;
        }

        button.addEventListener('click', () => {
            toggleDate(key);
        });

        calendar.append(button);
    }

    updateSelectedDates();
}

function toggleDate(key) {

    if (selectedDates.includes(key)) {

        selectedDates = selectedDates.filter(date => date !== key);

    } else {

        selectedDates.push(key);

    }

    selectedDates.sort();

    renderCalendar();
}

function changeMonth(direction) {

    const newDate = new Date(
        calendarDate.getFullYear(),
        calendarDate.getMonth() + direction,
        1
    );

    const today = new Date();

    const currentMonth = new Date(
        today.getFullYear(),
        today.getMonth(),
        1
    );

    if (newDate < currentMonth) return;

    calendarDate = newDate;

    selectedDates = [];

    renderCalendar();
}

function updateSelectedDates() {

    const count = selectedDates.length;

    if (!$('selectedCount')) return;

    $('selectedCount').textContent =
        count === 1 ? '1 dia' : `${count} dias`;

    $('selectedDates').textContent =
        count
            ? selectedDates.map(formatDate).join(' • ')
            : 'Nenhuma data selecionada.';
}


// =====================================
// NOMES DOS COROINHAS
// =====================================

// Os pais consultam somente a coleção pública,
// que contém os nomes, sem os níveis de experiência.

async function loadPublicChildren() {

    try {

        const snapshot = await getDocs(
            collection(db, 'childrenPublic')
        );

        publicChildren = snapshot.docs.map(document => ({
            id: document.id,
            ...document.data()
        }));

    } catch (error) {

        console.error(error);

        showToast('Não foi possível carregar os nomes dos coroinhas.');
    }
}


// Padroniza o nome para comparar os cadastros.

function normalizeName(name) {

    return name
        .trim()
        .replace(/\s+/g, ' ')
        .toLocaleLowerCase('pt-BR');
}


// =====================================
// CLASSIFICAÇÃO
// =====================================

function levelClass(level) {

    if (level === 'Experiente') return 'experiente';

    if (level === 'Intermediário') return 'intermediario';

    return 'iniciante';
}


// =====================================
// CADASTRO DOS COROINHAS
// =====================================

function renderChildren() {

    const container = $('childrenList');

    if (!container) return;

    container.innerHTML = '';

    if (children.length === 0) {

        container.innerHTML = `
            <div class="empty-state">
                Nenhum coroinha cadastrado.
            </div>
        `;

        return;
    }

    children.forEach(child => {

        const item = document.createElement('div');

        item.className = 'list-item';

        const info = document.createElement('div');

        const name = document.createElement('strong');

        name.textContent = child.name;

        const badge = document.createElement('span');

        badge.className = 'level-badge ' + levelClass(child.level);

        badge.textContent = child.level;

        info.append(
            name,
            document.createElement('br'),
            badge
        );

        const actions = document.createElement('div');

        actions.className = 'list-actions';

        const editButton = document.createElement('button');

        editButton.className = 'small-button';
        editButton.textContent = 'Alterar nível';

        editButton.onclick = () => {
            changeChildLevel(child.id);
        };

        const deleteButton = document.createElement('button');

        deleteButton.className = 'small-button delete';
        deleteButton.textContent = 'Excluir';

        deleteButton.onclick = () => {
            deleteChild(child.id);
        };

        actions.append(editButton, deleteButton);

        item.append(info, actions);

        container.append(item);
    });
}


$('childForm')?.addEventListener('submit', async event => {

    event.preventDefault();

    const name = $('newChildName').value.trim();
    const level = $('newChildLevel').value;

    if (!name) {
        return showToast('Informe o nome do coroinha.');
    }

    const duplicated = children.some(child =>
        normalizeName(child.name) === normalizeName(name)
    );

    if (duplicated) {
        return showToast('Este coroinha já está cadastrado.');
    }

    const id = crypto.randomUUID();

    try {

        const batch = writeBatch(db);

        batch.set(doc(db, 'children', id), {
            name,
            level
        });

        batch.set(doc(db, 'childrenPublic', id), {
            name
        });

        await batch.commit();

        event.target.reset();

        await loadAdminData();

        showToast('Coroinha cadastrado!');

    } catch (error) {

        console.error(error);

        showToast('Não foi possível cadastrar o coroinha.');
    }
});


async function changeChildLevel(id) {

    const child = children.find(item => item.id === id);

    if (!child) return;

    const levels = [
        'Experiente',
        'Intermediário',
        'Iniciante'
    ];

    const nextLevel =
        levels[(levels.indexOf(child.level) + 1) % 3];

    try {

        await updateDoc(doc(db, 'children', id), {
            level: nextLevel
        });

        await loadAdminData();

        showToast('Classificação atualizada.');

    } catch (error) {

        console.error(error);

        showToast('Falha ao alterar classificação.');
    }
}


async function deleteChild(id) {

    const child = children.find(item => item.id === id);

    if (!child) return;

    if (!confirm(`Deseja excluir ${child.name}?`)) return;

    try {

        const batch = writeBatch(db);

        batch.delete(doc(db, 'children', id));
        batch.delete(doc(db, 'childrenPublic', id));

        await batch.commit();

        await loadAdminData();

        showToast('Coroinha excluído.');

    } catch (error) {

        console.error(error);

        showToast('Não foi possível excluir.');
    }
}


// =====================================
// ENVIO DE DISPONIBILIDADE
// =====================================

async function submitAvailability() {

    const typedName = $('childName').value.trim();

    if (!typedName) {
        return showToast('Digite o nome completo do coroinha.');
    }

    // Procura o nome entre os coroinhas cadastrados.

    const child = publicChildren.find(item =>
        normalizeName(item.name) === normalizeName(typedName)
    );

    if (!child) {
        return showToast(
            'Nome não encontrado. Confira o cadastro com a administração.'
        );
    }

    if (selectedDates.length === 0) {
        return showToast('Selecione pelo menos um dia.');
    }

    const childId = child.id;

    const month = calendarDate.getMonth();
    const year = calendarDate.getFullYear();

    const monthKey = `${year}_${month}`;

    const id = `${childId}_${monthKey}`;

    try {

        await setDoc(doc(db, 'availabilities', id), {

            childId,

            dates: [...selectedDates],

            month,

            year,

            monthKey,

            submittedAt: new Date().toISOString()

        });

        selectedDates = [];

        $('childName').value = '';

        renderCalendar();

        showToast('Disponibilidade enviada!');

    } catch (error) {

        console.error(error);

        showToast(
            'A disponibilidade já foi enviada ou não pôde ser registrada.'
        );
    }
}


// =====================================
// CADASTRO DE CELEBRAÇÕES
// =====================================

function renderCelebrations() {

    const container = $('celebrationsList');

    if (!container) return;

    container.innerHTML = '';

    if (celebrations.length === 0) {

        container.innerHTML = `
            <div class="empty-state">
                Nenhuma celebração cadastrada.
            </div>
        `;

        return;
    }

    [...celebrations]
        .sort((a, b) =>
            (a.date + a.time).localeCompare(b.date + b.time)
        )
        .forEach(celebration => {

            const item = document.createElement('div');

            item.className = 'list-item';

            const info = document.createElement('div');

            const title = document.createElement('strong');

            title.textContent = celebration.name;

            const detail = document.createElement('small');

            detail.textContent =
                `${formatDate(celebration.date)} às ${celebration.time} • ${celebration.total} coroinhas`;

            info.append(title, detail);

            const button = document.createElement('button');

            button.className = 'small-button delete';
            button.textContent = 'Excluir';

            button.onclick = () => {
                deleteCelebration(celebration.id);
            };

            item.append(info, button);

            container.append(item);
        });
}


$('celebrationForm')?.addEventListener('submit', async event => {

    event.preventDefault();

    const name = $('celebrationName').value.trim();
    const date = $('celebrationDate').value;
    const time = $('celebrationTime').value;

    const total = Number($('neededChildren').value);

    const custom = $('customDistribution').checked;

    let experienced = 1;
    let intermediate = 1;
    let beginners = 2;

    if (custom) {

        experienced = Number($('neededExperienced').value);
        intermediate = Number($('neededIntermediate').value);
        beginners = Number($('neededBeginners').value);

        if (
            [experienced, intermediate, beginners]
                .some(number => !Number.isInteger(number) || number < 0)
        ) {
            return showToast('Confira a distribuição.');
        }

        if (experienced + intermediate + beginners !== total) {
            return showToast(
                'A soma das categorias deve ser igual ao total.'
            );
        }

    } else if (total !== 4) {

        return showToast(
            'Para usar a distribuição padrão, o total deve ser 4. Ative a definição manual para outros totais.'
        );
    }

    if (celebrations.some(item =>
        item.date === date && item.time === time
    )) {
        return showToast('Já existe uma celebração neste horário.');
    }

    try {

        await setDoc(
            doc(db, 'celebrations', crypto.randomUUID()),
            {
                name,
                date,
                time,
                total,
                experienced,
                intermediate,
                beginners
            }
        );

        event.target.reset();

        $('neededChildren').value = 4;
        $('neededExperienced').value = 1;
        $('neededIntermediate').value = 1;
        $('neededBeginners').value = 2;

        await loadAdminData();

        showToast('Celebração cadastrada!');

    } catch (error) {

        console.error(error);

        showToast('Não foi possível cadastrar a celebração.');
    }
});


async function deleteCelebration(id) {

    if (!confirm('Deseja excluir esta celebração?')) return;

    try {

        await deleteDoc(doc(db, 'celebrations', id));

        await loadAdminData();

        showToast('Celebração excluída.');

    } catch (error) {

        console.error(error);

        showToast('Não foi possível excluir.');
    }
}


// =====================================
// DISPONIBILIDADES RECEBIDAS
// =====================================

function renderAvailabilities() {

    const container = $('availabilityList');

    if (!container) return;

    container.innerHTML = '';

    if (availabilities.length === 0) {

        container.innerHTML = `
            <div class="empty-state">
                Nenhuma disponibilidade recebida.
            </div>
        `;

        return;
    }

    availabilities.forEach(record => {

        const child = children.find(item =>
            item.id === record.childId
        );

        const item = document.createElement('div');

        item.className = 'list-item';

        const info = document.createElement('div');

        const name = document.createElement('strong');

        name.textContent = child?.name || 'Coroinha não encontrado';

        const detail = document.createElement('small');

        detail.textContent =
            (record.dates || []).map(formatDate).join(' • ');

        info.append(name, detail);

        item.append(info);

        container.append(item);
    });
}


// =====================================
// RESUMO ADMINISTRATIVO
// =====================================

function updateDashboard() {

    if ($('totalChildren')) {
        $('totalChildren').textContent = children.length;
    }

    if ($('totalCelebrations')) {
        $('totalCelebrations').textContent = celebrations.length;
    }

    if ($('totalAvailabilities')) {
        $('totalAvailabilities').textContent = availabilities.length;
    }

    renderAvailabilities();
}


// =====================================
// GERAÇÃO DAS ESCALAS
// =====================================

function renderSchedules() {

    const container = $('scheduleList');

    if (!container) return;

    container.innerHTML = '';

    if (schedules.length === 0) {

        container.innerHTML = `
            <div class="empty-state">
                Nenhuma escala gerada.
            </div>
        `;

        return;
    }

    schedules.forEach(schedule => {

        const card = document.createElement('div');

        card.className = 'content-card';

        const title = document.createElement('h3');

        title.textContent = schedule.celebration.name;

        const detail = document.createElement('p');

        detail.textContent =
            `${formatDate(schedule.celebration.date)} às ${schedule.celebration.time}`;

        const status = document.createElement('p');

        status.textContent = schedule.complete
            ? 'Escala completa'
            : `Escala incompleta: ${schedule.celebration.total - schedule.children.length} vaga(s) pendente(s)`;

        status.style.color = schedule.complete
            ? '#28764c'
            : '#c65353';

        card.append(title, detail, status);

        schedule.children.forEach(child => {

            const row = document.createElement('div');

            row.className = 'list-item';

            const name = document.createElement('strong');

            name.textContent = child.name;

            const badge = document.createElement('span');

            badge.className =
                'level-badge ' + levelClass(child.level);

            badge.textContent = child.level;

            row.append(name, badge);

            card.append(row);
        });

        const editButton = document.createElement('button');

        editButton.className = 'small-button';
        editButton.textContent = 'Editar escala';

        editButton.onclick = () => {
            editSchedule(schedule.id);
        };

        card.append(editButton);

        container.append(card);
    });
}
function generateMonthlySchedule() {

    const monthInput = document.getElementById('scheduleMonth');
    const output = document.getElementById('monthlyScheduleText');

    if (!monthInput.value) {
        showToast('Escolha o mês da escala.');
        return;
    }

    const [year, month] = monthInput.value.split('-');

    const monthlySchedules = schedules
        .filter(schedule => {
            const date = schedule.celebration.date;
            return date.startsWith(`${year}-${month}`);
        })
        .sort((a, b) => {
            const dateA = a.celebration.date + a.celebration.time;
            const dateB = b.celebration.date + b.celebration.time;
            return dateA.localeCompare(dateB);
        });

    if (monthlySchedules.length === 0) {
        output.value = '';
        showToast('Não existem escalas geradas para esse mês.');
        return;
    }

    const monthName = new Date(Number(year), Number(month) - 1)
        .toLocaleDateString('pt-BR', { month: 'long' });

    let text = `⛪ *ESCALA MENSAL DOS COROINHAS*\n`;
    text += `📅 *${monthName.toLocaleUpperCase('pt-BR')} DE ${year}*\n\n`;

    monthlySchedules.forEach(schedule => {

        const celebration = schedule.celebration;

        text += `━━━━━━━━━━━━━━\n`;
        text += `⛪ *${celebration.name}*\n`;
        text += `📅 ${formatDate(celebration.date)}\n`;
        text += `🕒 ${celebration.time}\n\n`;

        schedule.children.forEach(child => {
            text += `• ${child.name}\n`;
        });

        if (!schedule.complete) {
            const missing = celebration.total - schedule.children.length;
            text += `\n⚠️ ${missing} vaga(s) pendente(s)\n`;
        }

        text += '\n';
    });

    text += `━━━━━━━━━━━━━━\n`;
    text += `Servir com amor, dedicação e alegria! ✨`;

    output.value = text;

    showToast('Escala mensal montada!');
}


async function copyMonthlySchedule() {

    const output = document.getElementById('monthlyScheduleText');

    if (!output.value.trim()) {
        showToast('Monte a escala mensal primeiro.');
        return;
    }

    try {
        await navigator.clipboard.writeText(output.value);
        showToast('Escala copiada! Agora é só colar no grupo.');
    } catch (error) {
        console.error(error);
        output.select();
        document.execCommand('copy');
        showToast('Escala copiada!');
    }
}

async function generateSchedule() {

    if (!celebrations.length) {
        return showToast('Cadastre as celebrações primeiro.');
    }

    if (!children.length) {
        return showToast('Cadastre os coroinhas primeiro.');
    }

    if (!availabilities.length) {
        return showToast('Ainda não existem disponibilidades.');
    }

    const counts = Object.fromEntries(
        children.map(child => [child.id, 0])
    );

    const result = [];

    let incomplete = false;

    const sortedCelebrations = [...celebrations].sort((a, b) =>
        (a.date + a.time).localeCompare(b.date + b.time)
    );

    sortedCelebrations.forEach(celebration => {

        const selected = [];

        const targets = [
            { level: 'Experiente', quantity: celebration.experienced },
            { level: 'Intermediário', quantity: celebration.intermediate },
            { level: 'Iniciante', quantity: celebration.beginners }
        ];

        targets.forEach(target => {

            for (let i = 0; i < target.quantity; i++) {

                const candidates = children.filter(child => {

                    const available = availabilities.some(record =>
                        record.childId === child.id &&
                        record.dates.includes(celebration.date)
                    );

                    const alreadySelected = selected.some(item =>
                        item.id === child.id
                    );

                    return child.level === target.level &&
                        available &&
                        !alreadySelected;
                });

                candidates.sort((a, b) =>
                    counts[a.id] - counts[b.id] ||
                    a.name.localeCompare(b.name, 'pt-BR')
                );

                if (candidates.length === 0) {

                    incomplete = true;

                    continue;
                }

                const chosen = candidates[0];

                selected.push(chosen);

                counts[chosen.id]++;
            }
        });

        result.push({
            id: crypto.randomUUID(),
            celebration,
            children: selected,
            complete: selected.length === celebration.total
        });
    });

    try {

        const batch = writeBatch(db);

        result.forEach(schedule => {

            batch.set(
                doc(db, 'schedules', schedule.id),
                {
                    celebrationId: schedule.celebration.id,
                    celebration: schedule.celebration,
                    children: schedule.children,
                    complete: schedule.complete
                }
            );
        });

        await batch.commit();

        await loadAdminData();

        showToast(
            incomplete
                ? 'Algumas celebrações ficaram com vagas pendentes.'
                : 'Escalas geradas com sucesso!'
        );

    } catch (error) {

        console.error(error);

        showToast('Não foi possível salvar as escalas.');
    }
}


// =====================================
// EDIÇÃO MANUAL DAS ESCALAS
// =====================================

async function editSchedule(id) {

    const schedule = schedules.find(item => item.id === id);

    if (!schedule) return;

    const available = children.filter(child =>
        availabilities.some(record =>
            record.childId === child.id &&
            record.dates.includes(schedule.celebration.date)
        )
    );

    if (!available.length) {
        return showToast('Não existem coroinhas disponíveis nesta data.');
    }

    const options = available.map((child, index) =>
        `${index + 1} - ${child.name} (${child.level})`
    ).join('\n');

    const answer = prompt(
        'Escolha o coroinha para inserir ou substituir:\n\n' +
        options +
        '\n\nDigite o número:'
    );

    if (answer === null) return;

    const chosen = available[Number(answer) - 1];

    if (!chosen) {
        return showToast('Opção inválida.');
    }

    if (schedule.children.some(child => child.id === chosen.id)) {
        return showToast('Este coroinha já está nesta escala.');
    }

    const currentNames = schedule.children.map((child, index) =>
        `${index + 1} - ${child.name}`
    ).join('\n');

    const replacement = prompt(
        'Qual posição deseja substituir?\n\n' +
        currentNames +
        '\n\nDigite o número da posição:'
    );

    if (replacement === null) return;

    const position = Number(replacement) - 1;

    if (!Number.isInteger(position) || !schedule.children[position]) {
        return showToast('Posição inválida.');
    }

    const updated = [...schedule.children];

    updated[position] = chosen;

    try {

        await updateDoc(doc(db, 'schedules', id), {
            children: updated,
            complete: updated.length === schedule.celebration.total
        });

        await loadAdminData();

        showToast('Escala atualizada.');

    } catch (error) {

        console.error(error);

        showToast('Não foi possível atualizar a escala.');
    }
}


// =====================================
// CARREGAR DADOS DO ADMINISTRADOR
// =====================================

async function loadAdminData() {

    if (!auth.currentUser || auth.currentUser.email !== ADMIN_EMAIL) {
        return;
    }

    try {

        const [
            childrenSnapshot,
            celebrationsSnapshot,
            availabilitiesSnapshot,
            schedulesSnapshot
        ] = await Promise.all([

            getDocs(collection(db, 'children')),

            getDocs(collection(db, 'celebrations')),

            getDocs(collection(db, 'availabilities')),

            getDocs(collection(db, 'schedules'))

        ]);

        children = childrenSnapshot.docs.map(document => ({
            id: document.id,
            ...document.data()
        }));

        celebrations = celebrationsSnapshot.docs.map(document => ({
            id: document.id,
            ...document.data()
        }));

        availabilities = availabilitiesSnapshot.docs.map(document => ({
            id: document.id,
            ...document.data()
        }));

        schedules = schedulesSnapshot.docs.map(document => ({
            id: document.id,
            ...document.data(),
            celebration: document.data().celebration,
            children: document.data().children || []
        }));

        renderChildren();
        renderCelebrations();
        renderSchedules();
        updateDashboard();

    } catch (error) {

        console.error(error);

        showToast(
            'Erro ao carregar os dados. Verifique as regras do Firestore.'
        );
    }
}


// =====================================
// LOGIN E LOGOUT
// =====================================

$('loginForm')?.addEventListener('submit', async event => {

    event.preventDefault();

    if (ADMIN_EMAIL === 'SEU_EMAIL_ADMIN') {
        return showToast('Configure ADMIN_EMAIL no script.js.');
    }

    try {

        await signInWithEmailAndPassword(
            auth,
            ADMIN_EMAIL,
            $('adminPassword').value
        );

        $('adminPassword').value = '';

    } catch (error) {

        console.error(error);

        showToast('Não foi possível entrar. Confira a senha.');

        $('adminPassword').value = '';
    }
});


async function logout() {

    try {

        await signOut(auth);

        showPage('home');

        showToast('Sessão encerrada.');

    } catch (error) {

        console.error(error);

        showToast('Não foi possível sair.');
    }
}


// =====================================
// AUTENTICAÇÃO
// =====================================

onAuthStateChanged(auth, async user => {

    if (user && user.email === ADMIN_EMAIL) {

        showPage('adminPanel');

        await loadAdminData();

    } else if (user) {

        await signOut(auth);

        showPage('home');
    }
});


// =====================================
// INICIALIZAÇÃO
// =====================================

Object.assign(window, {
    showPage,
    toggleMenu,
    showAdminTab,
    changeMonth,
    submitAvailability,
    generateSchedule,
    logout
    generateMonthlySchedule,
    copyMonthlySchedule
});

renderCalendar();

loadPublicChildren();
