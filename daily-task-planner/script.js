// ==========================================
// Daily Task Planner - JavaScript
// ==========================================

const STORAGE_KEY = "dailyTaskPlannerTasks";
const THEME_KEY = "dailyTaskPlannerTheme";

let tasks = loadTasks();
let currentFilter = "all";
let editingTaskId = null;

// ---------- DOM Elements ----------

const taskForm = document.getElementById("taskForm");
const taskTitle = document.getElementById("taskTitle");
const taskCategory = document.getElementById("taskCategory");
const taskPriority = document.getElementById("taskPriority");
const taskDate = document.getElementById("taskDate");
const taskTime = document.getElementById("taskTime");

const submitButton = document.getElementById("submitButton");
const cancelEditButton = document.getElementById("cancelEditButton");
const formTitle = document.getElementById("formTitle");

const taskList = document.getElementById("taskList");
const emptyState = document.getElementById("emptyState");

const searchInput = document.getElementById("searchInput");
const sortTasks = document.getElementById("sortTasks");
const clearCompletedButton = document.getElementById("clearCompletedButton");

const totalCount = document.getElementById("totalCount");
const pendingCount = document.getElementById("pendingCount");
const completedCount = document.getElementById("completedCount");
const overdueCount = document.getElementById("overdueCount");

const progressBar = document.getElementById("progressBar");
const progressText = document.getElementById("progressText");
const visibleCount = document.getElementById("visibleCount");

const currentDate = document.getElementById("currentDate");

const themeButton = document.getElementById("themeButton");
const themeText = document.getElementById("themeText");

// ---------- Initial Setup ----------

showCurrentDate();
loadTheme();
renderTasks();

// ---------- Form Submit ----------

taskForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const title = taskTitle.value.trim();

    if (!title) {
        taskTitle.focus();
        return;
    }

    if (editingTaskId !== null) {
        updateTask(editingTaskId);
    } else {
        addTask();
    }
});

// ---------- Enter Key ----------

taskTitle.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
        event.preventDefault();
        taskForm.requestSubmit();
    }
});

// ---------- Search ----------

searchInput.addEventListener("input", renderTasks);

// ---------- Sort ----------

sortTasks.addEventListener("change", renderTasks);

// ---------- Filters ----------

document.querySelectorAll(".filter-btn").forEach(button => {
    button.addEventListener("click", function () {
        document.querySelectorAll(".filter-btn").forEach(btn => {
            btn.classList.remove("active");
        });

        this.classList.add("active");
        currentFilter = this.dataset.filter;

        renderTasks();
    });
});

// ---------- Clear Completed ----------

clearCompletedButton.addEventListener("click", function () {
    const completedTasks = tasks.filter(task => task.completed);

    if (completedTasks.length === 0) {
        alert("There are no completed tasks to clear.");
        return;
    }

    const confirmed = confirm("Delete all completed tasks?");

    if (confirmed) {
        tasks = tasks.filter(task => !task.completed);
        saveTasks();
        renderTasks();
    }
});

// ---------- Cancel Edit ----------

cancelEditButton.addEventListener("click", resetForm);

// ---------- Theme ----------

themeButton.addEventListener("click", toggleTheme);

// ==========================================
// TASK FUNCTIONS
// ==========================================

function addTask() {
    const newTask = {
        id: Date.now(),
        title: taskTitle.value.trim(),
        category: taskCategory.value,
        priority: taskPriority.value,
        date: taskDate.value,
        time: taskTime.value,
        completed: false,
        createdAt: new Date().toISOString()
    };

    tasks.unshift(newTask);

    saveTasks();
    resetForm();
    renderTasks();
}

function updateTask(id) {
    const task = tasks.find(task => task.id === id);

    if (!task) return;

    task.title = taskTitle.value.trim();
    task.category = taskCategory.value;
    task.priority = taskPriority.value;
    task.date = taskDate.value;
    task.time = taskTime.value;

    saveTasks();
    resetForm();
    renderTasks();
}

function editTask(id) {
    const task = tasks.find(task => task.id === id);

    if (!task) return;

    editingTaskId = id;

    taskTitle.value = task.title;
    taskCategory.value = task.category;
    taskPriority.value = task.priority;
    taskDate.value = task.date || "";
    taskTime.value = task.time || "";

    formTitle.textContent = "Edit Task";

    submitButton.innerHTML = '<i class="bi bi-check-lg me-1"></i>Save Changes';
    cancelEditButton.classList.remove("d-none");

    document.getElementById("taskFormSection").scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

    taskTitle.focus();
}

function toggleTask(id) {
    const task = tasks.find(task => task.id === id);

    if (!task) return;

    task.completed = !task.completed;

    saveTasks();
    renderTasks();
}

function deleteTask(id) {
    const task = tasks.find(task => task.id === id);

    if (!task) return;

    const confirmed = confirm(`Delete "${task.title}"?`);

    if (!confirmed) return;

    tasks = tasks.filter(task => task.id !== id);

    if (editingTaskId === id) {
        resetForm();
    }

    saveTasks();
    renderTasks();
}

// ==========================================
// RENDER
// ==========================================

function renderTasks() {
    updateStatistics();

    let filteredTasks = getFilteredTasks();

    filteredTasks = applySearch(filteredTasks);
    filteredTasks = applySort(filteredTasks);

    taskList.innerHTML = "";

    visibleCount.textContent =
        `${filteredTasks.length} ${filteredTasks.length === 1 ? "task" : "tasks"}`;

    if (filteredTasks.length === 0) {
        emptyState.classList.remove("d-none");
    } else {
        emptyState.classList.add("d-none");

        filteredTasks.forEach(task => {
            taskList.appendChild(createTaskElement(task));
        });
    }
}

function createTaskElement(task) {
    const wrapper = document.createElement("div");

    wrapper.className = `task-card ${task.completed ? "completed" : ""}`;

    const overdue = isOverdue(task);

    const priorityClass = `priority-${task.priority.toLowerCase()}`;

    let dueHTML = "";

    if (task.date || task.time) {
        const dueText = formatDueDate(task.date, task.time);

        dueHTML = `
            <span class="due-badge ${overdue ? "due-overdue" : ""}">
                <i class="bi bi-calendar-event me-1"></i>
                ${escapeHTML(dueText)}
            </span>
        `;
    }

    const overdueHTML = overdue
        ? `<span class="badge text-bg-danger"><i class="bi bi-exclamation-triangle me-1"></i>Overdue</span>`
        : "";

    wrapper.innerHTML = `
        <div class="row align-items-center g-3">
            <div class="col-lg-8">
                <div class="d-flex align-items-start gap-3">
                    <div class="form-check mt-1">
                        <input
                            class="form-check-input task-check"
                            type="checkbox"
                            ${task.completed ? "checked" : ""}
                            aria-label="Mark task complete"
                        >
                    </div>

                    <div class="flex-grow-1">
                        <div class="task-title">${escapeHTML(task.title)}</div>

                        <div class="task-meta">
                            <span class="priority-badge ${priorityClass}">
                                ${priorityIcon(task.priority)} ${escapeHTML(task.priority)}
                            </span>

                            <span class="category-badge">
                                ${categoryIcon(task.category)} ${escapeHTML(task.category)}
                            </span>

                            ${dueHTML}
                            ${overdueHTML}
                        </div>
                    </div>
                </div>
            </div>

            <div class="col-lg-4">
                <div class="task-actions justify-content-lg-end">
                    <button class="btn btn-sm btn-outline-success complete-btn">
                        <i class="bi ${task.completed ? "bi-arrow-counterclockwise" : "bi-check-lg"} me-1"></i>
                        ${task.completed ? "Pending" : "Complete"}
                    </button>

                    <button class="btn btn-sm btn-outline-primary edit-btn">
                        <i class="bi bi-pencil me-1"></i>Edit
                    </button>

                    <button class="btn btn-sm btn-outline-danger delete-btn">
                        <i class="bi bi-trash3 me-1"></i>Delete
                    </button>
                </div>
            </div>
        </div>
    `;

    wrapper.querySelector(".task-check").addEventListener("change", () => {
        toggleTask(task.id);
    });

    wrapper.querySelector(".complete-btn").addEventListener("click", () => {
        toggleTask(task.id);
    });

    wrapper.querySelector(".edit-btn").addEventListener("click", () => {
        editTask(task.id);
    });

    wrapper.querySelector(".delete-btn").addEventListener("click", () => {
        deleteTask(task.id);
    });

    return wrapper;
}

// ==========================================
// FILTER / SEARCH / SORT
// ==========================================

function getFilteredTasks() {
    switch (currentFilter) {
        case "pending":
            return tasks.filter(task => !task.completed);

        case "completed":
            return tasks.filter(task => task.completed);

        case "overdue":
            return tasks.filter(task => isOverdue(task));

        default:
            return [...tasks];
    }
}

function applySearch(taskArray) {
    const searchText = searchInput.value.trim().toLowerCase();

    if (!searchText) {
        return taskArray;
    }

    return taskArray.filter(task => {
        return (
            task.title.toLowerCase().includes(searchText) ||
            task.category.toLowerCase().includes(searchText) ||
            task.priority.toLowerCase().includes(searchText)
        );
    });
}

function applySort(taskArray) {
    const sorted = [...taskArray];

    switch (sortTasks.value) {
        case "priority": {
            const order = {
                High: 1,
                Medium: 2,
                Low: 3
            };

            sorted.sort((a, b) =>
                order[a.priority] - order[b.priority]
            );
            break;
        }

        case "date":
            sorted.sort((a, b) => {
                const dateA = getTaskDate(a);
                const dateB = getTaskDate(b);

                return dateA - dateB;
            });
            break;

        case "status":
            sorted.sort((a, b) =>
                Number(a.completed) - Number(b.completed)
            );
            break;

        case "title":
            sorted.sort((a, b) =>
                a.title.localeCompare(b.title)
            );
            break;

        default:
            break;
    }

    return sorted;
}

// ==========================================
// STATISTICS
// ==========================================

function updateStatistics() {
    const total = tasks.length;
    const completed = tasks.filter(task => task.completed).length;
    const pending = total - completed;
    const overdue = tasks.filter(task => isOverdue(task)).length;

    totalCount.textContent = total;
    pendingCount.textContent = pending;
    completedCount.textContent = completed;
    overdueCount.textContent = overdue;

    const percentage = total === 0
        ? 0
        : Math.round((completed / total) * 100);

    progressBar.style.width = `${percentage}%`;
    progressText.textContent = `${percentage}%`;
}

// ==========================================
// DATE / OVERDUE
// ==========================================

function isOverdue(task) {
    if (!task.date || !task.time || task.completed) {
        return false;
    }

    const deadline = new Date(`${task.date}T${task.time}`);

    if (Number.isNaN(deadline.getTime())) {
        return false;
    }

    return deadline < new Date();
}

function getTaskDate(task) {
    if (!task.date) {
        return new Date(8640000000000000);
    }

    const value = task.time
        ? `${task.date}T${task.time}`
        : `${task.date}T23:59`;

    return new Date(value);
}

function formatDueDate(date, time) {
    if (!date) return "No date";

    const dateObject = new Date(
        `${date}T${time || "23:59"}`
    );

    if (Number.isNaN(dateObject.getTime())) {
        return date;
    }

    const formattedDate = dateObject.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });

    if (!time) {
        return formattedDate;
    }

    const formattedTime = dateObject.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit"
    });

    return `${formattedDate}, ${formattedTime}`;
}

function showCurrentDate() {
    const today = new Date();

    currentDate.textContent = today.toLocaleDateString("en-IN", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"
    });
}

// ==========================================
// THEME
// ==========================================

function toggleTheme() {
    document.body.classList.toggle("dark-mode");

    const darkMode = document.body.classList.contains("dark-mode");

    localStorage.setItem(
        THEME_KEY,
        darkMode ? "dark" : "light"
    );

    updateThemeButton(darkMode);
}

function loadTheme() {
    const savedTheme = localStorage.getItem(THEME_KEY);

    if (savedTheme === "dark") {
        document.body.classList.add("dark-mode");
        updateThemeButton(true);
    } else {
        updateThemeButton(false);
    }
}

function updateThemeButton(isDark) {
    if (isDark) {
        themeButton.innerHTML =
            '<i class="bi bi-sun-fill me-1"></i><span id="themeText">Light Mode</span>';
    } else {
        themeButton.innerHTML =
            '<i class="bi bi-moon-stars-fill me-1"></i><span id="themeText">Dark Mode</span>';
    }
}

// ==========================================
// FORM RESET
// ==========================================

function resetForm() {
    editingTaskId = null;

    taskForm.reset();

    taskCategory.value = "College";
    taskPriority.value = "Medium";

    formTitle.textContent = "Add New Task";

    submitButton.innerHTML =
        '<i class="bi bi-plus-lg me-1"></i>Add Task';

    cancelEditButton.classList.add("d-none");
}

// ==========================================
// LOCAL STORAGE
// ==========================================

function saveTasks() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function loadTasks() {
    try {
        const savedTasks = localStorage.getItem(STORAGE_KEY);

        if (!savedTasks) {
            return [];
        }

        const parsed = JSON.parse(savedTasks);

        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        console.error("Could not load tasks:", error);
        return [];
    }
}

// ==========================================
// HELPERS
// ==========================================

function priorityIcon(priority) {
    if (priority === "High") return "🔴";
    if (priority === "Medium") return "🟡";
    return "🟢";
}

function categoryIcon(category) {
    const icons = {
        College: "🎓",
        Work: "💼",
        Personal: "🏠",
        Shopping: "🛒",
        Other: "📌"
    };

    return icons[category] || "📌";
}

function escapeHTML(value) {
    const div = document.createElement("div");
    div.textContent = value;
    return div.innerHTML;
}
