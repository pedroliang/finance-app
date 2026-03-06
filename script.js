// Configuração do Supabase (Substitua pelos seus dados do projeto)
const SUPABASE_URL = 'https://omwwelphmiaandhkqoih.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_9qRWX_PtXnv3eikUKL_tog_YwlzP9FzDndD'; // Chave anon pública
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Gerenciamento de Tema (Dark Mode) - REUTILIZADO
const htmlElement = document.documentElement;

function updateThemeUI(theme) {
    const themeToggleBtn = document.getElementById('theme-toggle');
    const themeIcon = document.getElementById('theme-icon');
    if (!themeToggleBtn || !themeIcon) return;

    const themeText = themeToggleBtn.querySelector('span');

    if (theme === 'dark') {
        themeIcon.setAttribute('data-lucide', 'sun');
        if (themeText) themeText.textContent = 'Modo Claro';
    } else {
        themeIcon.setAttribute('data-lucide', 'moon');
        if (themeText) themeText.textContent = 'Modo Escuro';
    }

    if (window.lucide) {
        lucide.createIcons();
    }
}

function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    htmlElement.setAttribute('data-theme', savedTheme);
}

// Estado da Aplicação
let users = JSON.parse(localStorage.getItem('users')) || [];
let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
let transactions = []; // Carregadas após login
let evolutionChart = null;
let categoryChart = null;

// Elementos DOM
const elements = {
    authOverlay: document.getElementById('auth-overlay'),
    mainApp: document.getElementById('main-app'),
    authForm: document.getElementById('auth-form'),
    authTitle: document.getElementById('auth-title'),
    authSubtitle: document.getElementById('auth-subtitle'),
    authEmail: document.getElementById('auth-email'),
    authPass: document.getElementById('auth-password'),
    btnAuthSubmit: document.getElementById('btn-auth-submit'),
    linkSwitchAuth: document.getElementById('link-switch-auth'),
    authSwitchText: document.getElementById('auth-switch-text'),
    displayUserName: document.getElementById('display-user-name'),
    btnLogout: document.getElementById('btn-logout'),

    balance: document.getElementById('total-balance'),
    // ... restante dos elementos
};

// Adicionando os outros elementos que já existiam
function initElements() {
    elements.income = document.getElementById('total-income');
    elements.expense = document.getElementById('total-expense');
    elements.result = document.getElementById('net-result');
    elements.tableBody = document.getElementById('transactions-body');
    elements.form = document.getElementById('transaction-form');
    elements.modal = document.getElementById('modal-transaction');
    elements.btnsNew = document.querySelectorAll('.btn-new-transaction');
    elements.btnClose = document.querySelector('.close-modal');
    elements.filterBtns = document.querySelectorAll('.filter-btn');
    elements.dateStart = document.getElementById('date-start');
    elements.dateEnd = document.getElementById('date-end');
    elements.search = document.getElementById('search-desc');
    elements.currentDate = document.getElementById('current-date');
    elements.navDashboard = document.getElementById('btn-dashboard');
    elements.navTransactions = document.getElementById('btn-transactions');
    elements.viewDashboard = document.getElementById('view-dashboard');
    elements.viewTransactions = document.getElementById('view-transactions');
    elements.viewTitle = document.getElementById('view-title');
    elements.viewSubtitle = document.getElementById('view-subtitle');
    elements.filterCategory = document.getElementById('filter-category');
}

let isLoginMode = true;

// Lógica de Autenticação com Supabase
function setupAuth() {
    elements.linkSwitchAuth.addEventListener('click', (e) => {
        e.preventDefault();
        isLoginMode = !isLoginMode;

        elements.authTitle.textContent = isLoginMode ? 'Bem-vindo ao FinanSmart' : 'Crie sua conta';
        elements.authSubtitle.textContent = isLoginMode ? 'Entre na sua conta para continuar' : 'Comece a organizar suas finanças hoje';
        elements.btnAuthSubmit.textContent = isLoginMode ? 'Entrar' : 'Cadastrar';
        elements.authSwitchText.innerHTML = isLoginMode ?
            'Não tem uma conta? <a href="#" id="link-switch-auth">Cadastre-se</a>' :
            'Já tem uma conta? <a href="#" id="link-switch-auth">Entrar</a>';

        document.getElementById('link-switch-auth').addEventListener('click', (e) => {
            e.preventDefault();
            elements.linkSwitchAuth.click();
        });
    });

    elements.authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = elements.authEmail.value;
        const password = elements.authPass.value;

        if (isLoginMode) {
            const { data, error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) alert('Erro no login: ' + error.message);
            else login(data.user);
        } else {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: { data: { full_name: email.split('@')[0] } }
            });
            if (error) alert('Erro no cadastro: ' + error.message);
            else alert('Verifique seu e-mail para confirmar o cadastro!');
        }
    });

    elements.btnLogout.addEventListener('click', logout);
}

async function login(user) {
    currentUser = user;
    elements.authOverlay.style.display = 'none';
    elements.mainApp.style.display = 'flex';
    elements.displayUserName.textContent = user.user_metadata?.full_name || user.email;

    await loadUserTransactions();
    updateUI();
    lucide.createIcons();
}

async function logout() {
    await supabase.auth.signOut();
    currentUser = null;
    window.location.reload();
}

async function loadUserTransactions() {
    const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: false });

    if (error) console.error('Erro ao carregar transações:', error.message);
    else transactions = data;
}

// Inicialização
initTheme();
document.addEventListener('DOMContentLoaded', async () => {
    initElements();
    setupAuth();
    updateThemeUI(htmlElement.getAttribute('data-theme'));

    const themeToggleBtn = document.getElementById('theme-toggle');
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            const currentTheme = htmlElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';

            htmlElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            updateThemeUI(newTheme);
            updateChartsTheme();
        });
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        login(user);
    } else {
        elements.authOverlay.style.display = 'flex';
        elements.mainApp.style.display = 'none';
    }

    setCurrentDate();
    setupNavigation();
});

function setupNavigation() {
    elements.navDashboard.addEventListener('click', () => switchView('dashboard'));
    elements.navTransactions.addEventListener('click', () => switchView('transactions'));
}

function switchView(view) {
    if (view === 'dashboard') {
        elements.viewDashboard.style.display = 'block';
        elements.viewTransactions.style.display = 'none';
        elements.navDashboard.classList.add('active');
        elements.navTransactions.classList.remove('active');
        elements.viewTitle.innerText = 'Dashboard';
        elements.viewSubtitle.innerText = 'Aqui está o resumo das suas finanças.';
    } else {
        elements.viewDashboard.style.display = 'none';
        elements.viewTransactions.style.display = 'block';
        elements.navDashboard.classList.remove('active');
        elements.navTransactions.classList.add('active');
        elements.viewTitle.innerText = 'Extrato';
        elements.viewSubtitle.innerText = 'Veja detalhadamente todas as suas movimentações.';
    }
}

// Funções de Interface
function setCurrentDate() {
    const now = new Date();
    elements.currentDate.innerText = now.toLocaleDateString('pt-BR', {
        weekday: 'long', day: 'numeric', month: 'long'
    });
}

function updateUI(filteredTransactions = transactions) {
    renderTable(filteredTransactions);
    updateSummary(filteredTransactions);
    renderCharts(filteredTransactions);
}

function updateSummary(data) {
    const totals = data.reduce((acc, current) => {
        if (current.type === 'income') acc.income += current.value;
        else acc.expense += current.value;
        return acc;
    }, { income: 0, expense: 0 });

    const balance = totals.income - totals.expense;

    elements.income.innerText = formatCurrency(totals.income);
    elements.expense.innerText = formatCurrency(totals.expense);
    elements.balance.innerText = formatCurrency(balance);
    elements.result.innerText = formatCurrency(balance);

    // Cor do resultado
    elements.result.style.color = balance >= 0 ? 'var(--success)' : 'var(--danger)';
}

function renderTable(data) {
    elements.tableBody.innerHTML = '';

    if (data.length === 0) {
        elements.tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 3rem; color: var(--text-muted)">Nenhuma movimentação encontrada.</td></tr>`;
        return;
    }

    data.sort((a, b) => new Date(b.date) - new Date(a.date)).forEach(t => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${formatDate(t.date)}</td>
            <td><span class="badge ${t.type}">${t.type === 'income' ? 'Entrada' : 'Saída'}</span></td>
            <td>
                ${t.category}
                ${t.recurrence && t.recurrence !== 'none' ? `<span class="recurrence-tag" title="Recorrente: ${t.recurrence}"><i data-lucide="refresh-cw" style="width:10px; height:10px"></i></span>` : ''}
            </td>
            <td>${t.description}</td>
            <td style="font-weight: 600; color: ${t.type === 'income' ? 'var(--success)' : 'var(--danger)'}">
                ${t.type === 'income' ? '+' : '-'} ${formatCurrency(t.value)}
            </td>
            <td>
                <div class="actions-btns">
                    <button class="btn-icon" onclick="editTransaction('${t.id}')">
                        <i data-lucide="edit-3" style="width:16px"></i>
                    </button>
                    <button class="btn-icon delete" onclick="deleteTransaction('${t.id}')">
                        <i data-lucide="trash-2" style="width:16px"></i>
                    </button>
                </div>
            </td>
        `;
        elements.tableBody.appendChild(row);
    });
    lucide.createIcons();
}

// Gráficos (Chart.js)
function renderCharts(data) {
    const evolutionContainer = document.getElementById('evolutionChart');
    const categoryContainer = document.getElementById('categoryChart');

    if (!evolutionContainer || !categoryContainer || elements.viewDashboard.style.display === 'none') return;

    renderEvolutionChart(data);
    renderCategoryChart(data);
}

function renderEvolutionChart(data) {
    const ctx = document.getElementById('evolutionChart').getContext('2d');

    // Agrupar por data (últimos 7 dias ou conforme dados)
    const sortedData = [...data].sort((a, b) => new Date(a.date) - new Date(b.date));
    const labels = [...new Set(sortedData.map(d => formatDate(d.date)))].slice(-7);

    const incomes = labels.map(label => {
        return sortedData.filter(d => formatDate(d.date) === label && d.type === 'income')
            .reduce((sum, d) => sum + d.value, 0);
    });

    const expenses = labels.map(label => {
        return sortedData.filter(d => formatDate(d.date) === label && d.type === 'expense')
            .reduce((sum, d) => sum + d.value, 0);
    });

    if (evolutionChart) evolutionChart.destroy();

    evolutionChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [
                {
                    label: 'Entradas',
                    data: incomes,
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    fill: true,
                    tension: 0.4
                },
                {
                    label: 'Saídas',
                    data: expenses,
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    fill: true,
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: getComputedStyle(document.documentElement).getPropertyValue('--text-muted').trim() }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: getComputedStyle(document.documentElement).getPropertyValue('--border').trim() + '80' },
                    ticks: { color: getComputedStyle(document.documentElement).getPropertyValue('--text-muted').trim() }
                },
                x: {
                    grid: { color: getComputedStyle(document.documentElement).getPropertyValue('--border').trim() + '80' },
                    ticks: { color: getComputedStyle(document.documentElement).getPropertyValue('--text-muted').trim() }
                }
            }
        }
    });
}

function renderCategoryChart(data) {
    const ctx = document.getElementById('categoryChart').getContext('2d');

    const categories = Array.from(new Set(data.map(d => d.category)));
    const categoryTotals = categories.map(cat => {
        return data.filter(d => d.category === cat && d.type === 'expense')
            .reduce((sum, d) => sum + d.value, 0);
    }).filter(val => val > 0);

    const filteredCategories = categories.filter((cat, i) => {
        const val = data.filter(d => d.category === cat && d.type === 'expense')
            .reduce((sum, d) => sum + d.value, 0);
        return val > 0;
    });

    if (categoryChart) categoryChart.destroy();

    categoryChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: filteredCategories,
            datasets: [{
                data: categoryTotals,
                backgroundColor: [
                    '#6366f1', '#10b981', '#ef4444', '#f59e0b', '#3b82f6', '#ec4899', '#8b5cf6'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: getComputedStyle(document.documentElement).getPropertyValue('--text-muted').trim() }
                }
            }
        }
    });
}

// Eventos e Modal
elements.btnsNew.forEach(btn => {
    btn.addEventListener('click', () => {
        elements.form.reset();
        document.getElementById('modal-title').innerText = 'Nova Movimentação';
        elements.modal.style.display = 'block';
        document.getElementById('date').valueAsDate = new Date();
    });
});

elements.btnClose.addEventListener('click', () => elements.modal.style.display = 'none');

elements.form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const id = elements.form.dataset.editId;
    const transactionData = {
        user_id: currentUser.id,
        type: elements.form.querySelector('input[name="type"]:checked').value,
        value: parseFloat(document.getElementById('val').value),
        category: document.getElementById('category').value,
        description: document.getElementById('description').value,
        date: document.getElementById('date').value,
        recurrence: document.getElementById('recurrence').value
    };

    if (id) {
        const { error } = await supabase.from('transactions').update(transactionData).eq('id', id);
        if (error) alert('Erro ao atualizar: ' + error.message);
        delete elements.form.dataset.editId;
    } else {
        const { error } = await supabase.from('transactions').insert([transactionData]);
        if (error) alert('Erro ao salvar: ' + error.message);
    }

    await loadUserTransactions();
    updateUI();
    elements.modal.style.display = 'none';
});

// Filtros
elements.filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        elements.filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        applyFilters();
    });
});

elements.search.addEventListener('input', applyFilters);
[elements.dateStart, elements.dateEnd, elements.filterCategory].forEach(input => {
    if (input) input.addEventListener('change', applyFilters);
});

function applyFilters() {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const activePeriodBtn = document.querySelector('#view-dashboard .filter-btn.active');
    const period = activePeriodBtn ? activePeriodBtn.dataset.period : 'all';
    const searchTerm = elements.search.value.toLowerCase();
    const start = elements.dateStart.value;
    const end = elements.dateEnd.value;
    const categoryFilter = elements.filterCategory ? elements.filterCategory.value : 'all';

    // Cálculo de expansão para transações recorrentes
    const expandStart = start || (period === 'all' ? '1970-01-01' : new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]);
    const expandEnd = end || (period === 'all' ? '2100-01-01' : today);

    // No Dashboard ou dependendo do filtro, mostramos apenas o período atual
    // Vamos usar a função de expansão aqui
    let dataToProcess = getExpandedTransactions(transactions, expandStart, expandEnd);

    let filtered = dataToProcess.filter(t => t.description.toLowerCase().includes(searchTerm));

    if (categoryFilter !== 'all') {
        filtered = filtered.filter(t => t.category === categoryFilter);
    }

    // O filtro de período fixo agora é redundante se usamos expandStart/End na projeção,
    // mas vamos manter para casos específicos se necessário.
    // Como getExpandedTransactions já filtra pelo período, 'filtered' já está correto.

    updateUI(filtered);
}

// Ações
window.deleteTransaction = async (id) => {
    if (confirm('Deseja realmente excluir esta movimentação?')) {
        const { error } = await supabase.from('transactions').delete().eq('id', id);
        if (error) alert('Erro ao excluir: ' + error.message);
        else {
            await loadUserTransactions();
            updateUI();
        }
    }
};

window.editTransaction = (id) => {
    const t = transactions.find(t => t.id === id);
    if (!t) return;

    elements.form.dataset.editId = t.id;
    document.getElementById('modal-title').innerText = 'Editar Movimentação';

    elements.form.querySelector(`input[name="type"][value="${t.type}"]`).checked = true;
    document.getElementById('val').value = t.value;
    document.getElementById('category').value = t.category;
    document.getElementById('description').value = t.description;
    document.getElementById('date').value = t.date;
    document.getElementById('recurrence').value = t.recurrence || 'none';

    elements.modal.style.display = 'block';
};

// Utils
function saveAndRefresh() {
    const allTransactions = JSON.parse(localStorage.getItem('transactions')) || [];
    const otherUsersTransactions = allTransactions.filter(t => t.userId !== currentUser.id);

    // Unir transações do usuário atual (que estão no estado local) com as dos outros
    const updatedAll = [...otherUsersTransactions, ...transactions];
    localStorage.setItem('transactions', JSON.stringify(updatedAll));
    updateUI();
}

function formatCurrency(value) {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDate(dateStr) {
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
}

// Funções de Recorrência
function getExpandedTransactions(baseList, startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    let expanded = [];

    baseList.forEach(t => {
        const tDate = new Date(t.date);

        // Se não tem recorrência, apenas adiciona se estiver no intervalo
        if (!t.recurrence || t.recurrence === 'none') {
            if (tDate >= start && tDate <= end) {
                expanded.push({ ...t });
            }
            return;
        }

        // Para transações recorrentes, geramos instâncias
        let currentInstance = new Date(t.date);

        // Limite de instâncias para evitar loop infinito (ex: 2 anos para frente)
        const limitDate = new Date();
        limitDate.setFullYear(limitDate.getFullYear() + 2);
        const actualEnd = end > limitDate ? limitDate : end;

        while (currentInstance <= actualEnd) {
            if (currentInstance >= start) {
                expanded.push({
                    ...t,
                    date: currentInstance.toISOString().split('T')[0],
                    isRecurrenceInstance: currentInstance.getTime() !== tDate.getTime()
                });
            }

            if (t.recurrence === 'weekly') {
                currentInstance.setDate(currentInstance.getDate() + 7);
            } else if (t.recurrence === 'monthly') {
                currentInstance.setMonth(currentInstance.getMonth() + 1);
            } else {
                break;
            }

            // Se o intervalo de busca for muito grande, não queremos travar tudo
            if (expanded.length > 1000) break;
        }
    });

    return expanded;
}

function updateChartsTheme() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const textColor = isDark ? '#94a3b8' : '#64748b';
    const gridColor = isDark ? 'rgba(51, 65, 85, 0.5)' : 'rgba(226, 232, 240, 0.3)';

    if (evolutionChart) {
        evolutionChart.options.scales.x.ticks.color = textColor;
        evolutionChart.options.scales.y.ticks.color = textColor;
        evolutionChart.options.scales.x.grid.color = gridColor;
        evolutionChart.options.scales.y.grid.color = gridColor;
        evolutionChart.options.plugins.legend.labels.color = textColor;
        evolutionChart.update();
    }

    if (categoryChart) {
        categoryChart.options.plugins.legend.labels.color = textColor;
        categoryChart.update();
    }
}
