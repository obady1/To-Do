/* ============================================
           التطبيق الرئيسي — إدارة المهام
============================================ */

// === عناصر DOM الرئيسية ===
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

const taskInput = $("#taskInput");
const addBtn = $("#addBtn");
const errorMsg = $("#errorMsg");
const errorText = $("#errorText");
const searchInput = $("#searchInput");
const tasksList = $("#tasksList");
const pendingCount = $("#pendingCount");
const footerBar = $("#footerBar");
const footerPending = $("#footerPending");
const footerCompleted = $("#footerCompleted");
const clearAllBtn = $("#clearAllBtn");
const themeToggle = $("#themeToggle");
const toastContainer = $("#toastContainer");
const progressWrapper = $("#progressWrapper");
const progressFill = $("#progressFill");
const progressPercent = $("#progressPercent");
const filterTabs = $$(".filter-tab");

// === حالة التطبيق ===
let tasks = []; // مصفوفة المهام
let currentFilter = "all"; // الفلتر الحالي
let searchQuery = ""; // نص البحث
let draggedItem = null; // العنصر المسحوب
let draggedTaskId = null; // معرف المهمة المسحوبة

// === مفتاح التخزين المحلي ===
const STORAGE_KEY = "mahamy_tasks";
const THEME_KEY = "mahamy_theme";

/* ============================================
           الدوال المساعدة
============================================ */

/**
 * توليد معرف فريد لكل مهمة
 * يستخدم الوقت الحالي + رقم عشوائي
 */
const generateId = () =>
  `_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

/**
 * تنسيق التاريخ والوقت بالعربية
 * يحول كائن Date إلى نص مقروء
 */
const formatDateTime = (date) => {
  const d = new Date(date);
  const options = {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  };
  return d.toLocaleDateString("ar-SA", options);
};

/**
 * تنظيف النص من المسافات الزائدة والأحرف الخطرة
 */
const sanitizeText = (text) =>
  text.trim().replace(/</g, "&lt;").replace(/>/g, "&gt;");

/**
 * حساب مدة الزمن منذ إنشاء المهمة (نسبي)
 */
const getTimeAgo = (date) => {
  const now = Date.now();
  const diff = now - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "الآن";
  if (minutes < 60) return `منذ ${minutes} دقيقة`;
  if (hours < 24) return `منذ ${hours} ساعة`;
  if (days < 7) return `منذ ${days} يوم`;
  return formatDateTime(date);
};

/* ============================================
           إدارة التخزين المحلي (localStorage)
           ============================================ */

/**
 * حفظ المهام في التخزين المحلي
 * يُستدعى بعد كل تعديل على المصفوفة
 */
const saveTasks = () => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch (error) {
    console.error("خطأ في حفظ البيانات:", error);
    showToast("تعذر حفظ البيانات محلياً");
  }
};

/**
 * تحميل المهام من التخزين المحلي
 * يُستدعى عند بدء التطبيق
 */
const loadTasks = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    tasks = data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("خطأ في تحميل البيانات:", error);
    tasks = [];
  }
};

/* ============================================
           إدارة الوضع الليلي
           ============================================ */

/**
 * تحميل الوضع المحفوظ أو اكتشاف تفضيل النظام
 */
const initTheme = () => {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved) {
      document.documentElement.setAttribute("data-theme", saved);
    } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      document.documentElement.setAttribute("data-theme", "dark");
    }
  } catch (e) {
    // تجاهل أخطاء التخزين
  }
};

/**
 * تبديل بين الوضع الفاتح والليلي
 */
const toggleTheme = () => {
  const current = document.documentElement.getAttribute("data-theme");
  const next = current === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", next);
  try {
    localStorage.setItem(THEME_KEY, next);
  } catch (e) {
    // تجاهل
  }
};

/* ============================================
           عرض رسائل الخطأ
           ============================================ */

/**
 * إظهار رسالة خطأ أسفل حقل الإدخال
 * @param {string} message - نص الرسالة
 */
const showError = (message) => {
  errorText.textContent = message;
  errorMsg.classList.add("visible");
  // إخفاء بعد 3 ثوانٍ
  setTimeout(() => {
    errorMsg.classList.remove("visible");
  }, 3000);
};

/** إخفاء رسالة الخطأ */
const hideError = () => errorMsg.classList.remove("visible");

/* ============================================
           رسائل التوست (Toast Notifications)
           ============================================ */

/**
 * عرض رسالة توست مؤقتة
 * @param {string} message - نص الرسالة
 * @param {number} duration - مدة العرض بالمللي ثانية
 */
const showToast = (message, duration = 2500) => {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  toastContainer.appendChild(toast);

  // إزالة بعد المدة المحددة مع أنيميشن خروج
  setTimeout(() => {
    toast.classList.add("leaving");
    toast.addEventListener("animationend", () => toast.remove());
  }, duration);
};

/* ============================================
           عمليات المهام (CRUD)
           ============================================ */

/**
 * إضافة مهمة جديدة
 * تتحقق من صحة الإدخال ثم تضيف للمصفوفة
 */
const addTask = () => {
  const text = taskInput.value.trim();

  // التحقق من الإدخال الفارغ
  if (!text) {
    showError("يرجى كتابة نص المهمة قبل الإضافة");
    taskInput.focus();
    return;
  }

  // التحقق من الحد الأدنى للطول
  if (text.length < 2) {
    showError("المهمة قصيرة جداً، يرجى كتابة وصف أكمل");
    taskInput.focus();
    return;
  }

  // التحقق من التكرار
  const isDuplicate = tasks.some(
    (t) => t.text.toLowerCase() === text.toLowerCase(),
  );
  if (isDuplicate) {
    showError("هذه المهمة موجودة مسبقاً");
    taskInput.focus();
    return;
  }

  // إنشاء كائن المهمة
  const newTask = {
    id: generateId(),
    text: sanitizeText(text),
    completed: false,
    createdAt: new Date().toISOString(),
  };

  // إضافة في بداية المصفوفة (الأحدث أولاً)
  tasks.unshift(newTask);

  // حفظ وعرض
  saveTasks();
  renderTasks();
  updateStats();

  // تنظيف حقل الإدخال
  taskInput.value = "";
  hideError();
  taskInput.focus();

  showToast("تمت إضافة المهمة بنجاح");
};

/**
 * حذف مهمة بواسطة المعرف
 * مع أنيميشن خروج
 * @param {string} id - معرف المهمة
 */
const deleteTask = (id) => {
  const taskEl = document.querySelector(`[data-id="${id}"]`);
  if (taskEl) {
    // تطبيق أنيميشن الحذف
    taskEl.classList.add("removing");
    taskEl.addEventListener("animationend", () => {
      tasks = tasks.filter((t) => t.id !== id);
      saveTasks();
      renderTasks();
      updateStats();
      showToast("تم حذف المهمة");
    });
  }
};

/**
 * تبديل حالة إكمال المهمة
 * @param {string} id - معرف المهمة
 */
const toggleTask = (id) => {
  const task = tasks.find((t) => t.id === id);
  if (task) {
    task.completed = !task.completed;
    saveTasks();
    renderTasks();
    updateStats();

    showToast(task.completed ? "تم إكمال المهمة" : "تم إلغاء إكمال المهمة");
  }
};

/**
 * تفعيل وضع التعديل لمهمة
 * يستبدل النص بحقل إدخال قابل للتعديل
 * @param {string} id - معرف المهمة
 */
const startEdit = (id) => {
  const task = tasks.find((t) => t.id === id);
  if (!task) return;

  const taskEl = document.querySelector(`[data-id="${id}"]`);
  const contentEl = taskEl.querySelector(".task-content");
  const actionsEl = taskEl.querySelector(".task-actions");

  // حفظ النص الأصلي
  const originalText = task.text;

  // استبدال المحتوى بحقل تعديل
  contentEl.innerHTML = `
                <input
                    type="text"
                    class="edit-input"
                    value="${originalText}"
                    maxlength="200"
                    aria-label="تعديل المهمة"
                >
            `;

  // استبدال أزرار الإجراءات بأزرار الحفظ والإلغاء
  actionsEl.innerHTML = `
                <button class="action-btn save-btn" aria-label="حفظ التعديل" title="حفظ">
                    <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                </button>
                <button class="action-btn cancel-btn" aria-label="إلغاء التعديل" title="إلغاء">
                    <svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
            `;

  const editInput = contentEl.querySelector(".edit-input");
  editInput.focus();
  editInput.setSelectionRange(editInput.value.length, editInput.value.length);

  // منع السحب أثناء التعديل
  taskEl.setAttribute("draggable", "false");

  // حفظ عند الضغط على زر الحفظ
  actionsEl.querySelector(".save-btn").addEventListener("click", () => {
    saveEdit(id, editInput.value, originalText, taskEl);
  });

  // إلغاء عند الضغط على زر الإلغاء
  actionsEl.querySelector(".cancel-btn").addEventListener("click", () => {
    renderTasks(); // إعادة عرض بدون تغيير
  });

  // حفظ عند الضغط على Enter
  editInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      saveEdit(id, editInput.value, originalText, taskEl);
    }
    if (e.key === "Escape") {
      renderTasks();
    }
  });
};

/**
 * حفظ التعديل على المهمة
 * @param {string} id - المعرف
 * @param {string} newText - النص الجديد
 * @param {string} originalText - النص الأصلي
 * @param {HTMLElement} taskEl - عنصر المهمة في DOM
 */
const saveEdit = (id, newText, originalText, taskEl) => {
  const trimmed = newText.trim();

  if (!trimmed) {
    showError("لا يمكن ترك المهمة فارغة");
    return;
  }

  if (trimmed.length < 2) {
    showError("المهمة قصيرة جداً");
    return;
  }

  // التحقق من التكرار (استبعاد المهمة الحالية)
  const isDuplicate = tasks.some(
    (t) => t.id !== id && t.text.toLowerCase() === trimmed.toLowerCase(),
  );
  if (isDuplicate) {
    showError("هذه المهمة موجودة مسبقاً");
    return;
  }

  const task = tasks.find((t) => t.id === id);
  if (task) {
    task.text = sanitizeText(trimmed);
    saveTasks();
    renderTasks();
    updateStats();
    showToast("تم تعديل المهمة");
  }
};

/**
 * حذف جميع المهام مع تأكيد بسيط
 */
const clearAllTasks = () => {
  if (tasks.length === 0) return;

  // تأثير بصري: إزالة كل المهام واحدة تلو الأخرى
  const allItems = tasksList.querySelectorAll(".task-item");
  allItems.forEach((item, i) => {
    setTimeout(() => {
      item.classList.add("removing");
    }, i * 50);
  });

  // بعد انتهاء الأنيميشن، امسح المصفوفة
  setTimeout(
    () => {
      tasks = [];
      saveTasks();
      renderTasks();
      updateStats();
      showToast("تم حذف جميع المهام");
    },
    allItems.length * 50 + 350,
  );
};

/* ============================================
           الفلترة والبحث
           ============================================ */

/**
 * تصفية المهام حسب الفلتر الحالي ونص البحث
 * @returns {Array} المصفوفة المفلترة
 */
const getFilteredTasks = () => {
  let filtered = [...tasks];

  // تطبيق الفلتر
  switch (currentFilter) {
    case "pending":
      filtered = filtered.filter((t) => !t.completed);
      break;
    case "completed":
      filtered = filtered.filter((t) => t.completed);
      break;
    // 'all' لا يحتاج تصفية
  }

  // تطبيق البحث
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filtered = filtered.filter((t) => t.text.toLowerCase().includes(query));
  }

  return filtered;
};

/* ============================================
           عرض المهام (Rendering)
           ============================================ */

/**
 * بناء وتحديث قائمة المهام في DOM
 * يتم استدعاؤها بعد كل تغيير
 */
const renderTasks = () => {
  const filtered = getFilteredTasks();

  // حالة القائمة الفارغة
  if (filtered.length === 0) {
    let message = "لا توجد مهام بعد";
    let subMessage = "ابدأ بإضافة مهمتك الأولى";

    if (tasks.length === 0 && searchQuery) {
      message = "لا توجد مهام بعد";
      subMessage = "ابدأ بإضافة مهمتك الأولى";
    } else if (searchQuery && filtered.length === 0) {
      message = "لا توجد نتائج";
      subMessage = `لم يتم العثور على "${searchQuery}"`;
    } else if (currentFilter === "completed" && tasks.length > 0) {
      message = "لا توجد مهام مكتملة";
      subMessage = "أكمل بعض المهام لتظهر هنا";
    } else if (currentFilter === "pending" && tasks.length > 0) {
      message = "لا توجد مهام قيد التنفيذ";
      subMessage = "رائع! لقد أكملت كل مهامك";
    }

    tasksList.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-icon">
                            <svg viewBox="0 0 24 24">
                                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                                <polyline points="14 2 14 8 20 8"/>
                                <line x1="16" y1="13" x2="8" y2="13"/>
                                <line x1="16" y1="17" x2="8" y2="17"/>
                                <polyline points="10 9 9 9 8 9"/>
                            </svg>
                        </div>
                        <h3>${message}</h3>
                        <p>${subMessage}</p>
                    </div>
                `;
    return;
  }

  // بناء عناصر المهام
  tasksList.innerHTML = filtered
    .map((task) => {
      const { id, text, completed, createdAt } = task;
      const completedClass = completed ? "completed" : "";
      const timeAgo = getTimeAgo(createdAt);

      return `
                        <div
                            class="task-item ${completedClass}"
                            data-id="${id}"
                            draggable="true"
                            role="listitem"
                            aria-label="${completed ? "مهمة مكتملة" : "مهمة قيد التنفيذ"}: ${text}"
                        >
                            <button
                                class="check-btn"
                                onclick="toggleTask('${id}')"
                                aria-label="${completed ? "إلغاء الإكمال" : "تحديد كمكتملة"}"
                                title="${completed ? "إلغاء الإكمال" : "إكمال المهمة"}"
                            >
                                <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                            </button>
                            <div class="task-content">
                                <div class="task-text">${text}</div>
                                <div class="task-time">
                                    <svg viewBox="0 0 24 24">
                                        <circle cx="12" cy="12" r="10"/>
                                        <polyline points="12 6 12 12 16 14"/>
                                    </svg>
                                    ${timeAgo}
                                </div>
                            </div>
                            <div class="task-actions">
                                <button
                                    class="action-btn edit-btn"
                                    onclick="startEdit('${id}')"
                                    aria-label="تعديل المهمة"
                                    title="تعديل"
                                >
                                    <svg viewBox="0 0 24 24">
                                        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                                        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                    </svg>
                                </button>
                                <button
                                    class="action-btn delete-btn"
                                    onclick="deleteTask('${id}')"
                                    aria-label="حذف المهمة"
                                    title="حذف"
                                >
                                    <svg viewBox="0 0 24 24">
                                        <polyline points="3 6 5 6 21 6"/>
                                        <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                                        <line x1="10" y1="11" x2="10" y2="17"/>
                                        <line x1="14" y1="11" x2="14" y2="17"/>
                                    </svg>
                                </button>
                            </div>
                        </div>
                    `;
    })
    .join("");

  // تفعيل أحداث السحب والإفلات
  initDragAndDrop();
};

/* ============================================
           تحديث الإحصائيات وشريط التقدم
           ============================================ */

/**
 * تحديث جميع العدادات وشريط التقدم
 * يُستدعى بعد كل تغيير في المهام
 */
const updateStats = () => {
  const total = tasks.length;
  const completed = tasks.filter((t) => t.completed).length;
  const pending = total - completed;
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

  // تحديث العدادات
  pendingCount.textContent = pending;
  footerPending.textContent = pending;
  footerCompleted.textContent = completed;

  // إظهار/إخفاء شريط التذييل
  footerBar.style.display = total > 0 ? "flex" : "none";

  // تفعيل/تعطيل زر حذف الكل
  clearAllBtn.disabled = total === 0;

  // تحديث شريط التقدم
  if (total > 0) {
    progressWrapper.classList.add("visible");
    progressFill.style.width = `${percent}%`;
    progressPercent.textContent = `${percent}%`;
  } else {
    progressWrapper.classList.remove("visible");
  }
};

/* ============================================
           السحب والإفلات (Drag & Drop)
           ============================================ */

/**
 * تفعيل أحداث السحب والإفلات على عناصر المهام
 * يسمح بإعادة ترتيب المهام بالسحب
 */
const initDragAndDrop = () => {
  const items = tasksList.querySelectorAll(".task-item");

  items.forEach((item) => {
    // بداية السحب
    item.addEventListener("dragstart", (e) => {
      draggedItem = item;
      draggedTaskId = item.dataset.id;
      item.classList.add("dragging");
      e.dataTransfer.effectAllowed = "move";
      // تأخير إضافة الكلاس لضمان عمل الأنيميشن
      requestAnimationFrame(() => {
        item.classList.add("dragging");
      });
    });

    // نهاية السحب
    item.addEventListener("dragend", () => {
      item.classList.remove("dragging");
      // إزالة كلاس drag-over من جميع العناصر
      tasksList.querySelectorAll(".drag-over").forEach((el) => {
        el.classList.remove("drag-over");
      });
      draggedItem = null;
      draggedTaskId = null;
    });

    // عندما يمر العنصر المسحوب فوق عنصر آخر
    item.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      if (item !== draggedItem) {
        item.classList.add("drag-over");
      }
    });

    // عندما يغادر العنصر المسحوب
    item.addEventListener("dragleave", () => {
      item.classList.remove("drag-over");
    });

    // إفلات العنصر
    item.addEventListener("drop", (e) => {
      e.preventDefault();
      item.classList.remove("drag-over");

      if (item === draggedItem || !draggedTaskId) return;

      const targetId = item.dataset.id;
      const fromIndex = tasks.findIndex((t) => t.id === draggedTaskId);
      const toIndex = tasks.findIndex((t) => t.id === targetId);

      if (fromIndex === -1 || toIndex === -1) return;

      // إعادة ترتيب المصفوفة
      const [movedTask] = tasks.splice(fromIndex, 1);
      tasks.splice(toIndex, 0, movedTask);

      saveTasks();
      renderTasks();
    });
  });
};

/* ============================================
           ربط الأحداث (Event Listeners)
           ============================================ */

/**
 * ربط جميع الأحداث بعناصر DOM
 */
const bindEvents = () => {
  // إضافة مهمة بالنقر على الزر
  addBtn.addEventListener("click", addTask);

  // إضافة مهمة بالضغط على Enter
  taskInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTask();
    }
  });

  // إخفاء الخطأ عند الكتابة
  taskInput.addEventListener("input", hideError);

  // البحث في المهام مع تأخير بسيط (debounce)
  let searchTimeout;
  searchInput.addEventListener("input", (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      searchQuery = e.target.value.trim();
      renderTasks();
    }, 200);
  });

  // أزرار الفلترة
  filterTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      // تحديث الحالة النشطة
      filterTabs.forEach((t) => {
        t.classList.remove("active");
        t.setAttribute("aria-selected", "false");
      });
      tab.classList.add("active");
      tab.setAttribute("aria-selected", "true");

      // تحديث الفلتر وإعادة العرض
      currentFilter = tab.dataset.filter;
      renderTasks();
    });
  });

  // زر حذف الكل
  clearAllBtn.addEventListener("click", clearAllTasks);

  // زر تبديل الوضع الليلي
  themeToggle.addEventListener("click", toggleTheme);

  // تحديث الأوقات النسبية كل دقيقة
  setInterval(() => {
    const timeElements = tasksList.querySelectorAll(".task-time");
    const filtered = getFilteredTasks();
    timeElements.forEach((el, i) => {
      if (filtered[i]) {
        const timeAgo = getTimeAgo(filtered[i].createdAt);
        el.innerHTML = `
                            <svg viewBox="0 0 24 24">
                                <circle cx="12" cy="12" r="10"/>
                                <polyline points="12 6 12 12 16 14"/>
                            </svg>
                            ${timeAgo}
                        `;
      }
    });
  }, 60000);
};

/* ============================================
           تهيئة التطبيق
           ============================================ */

/**
 * نقطة الدخول الرئيسية
 * يُحمّل البيانات ويهيئ الواجهة
 */
const init = () => {
  try {
    initTheme(); // تحميل الوضع الليلي
    loadTasks(); // تحميل المهام المحفوظة
    bindEvents(); // ربط الأحداث
    renderTasks(); // عرض المهام
    updateStats(); // تحديث الإحصائيات
  } catch (error) {
    console.error("خطأ في تهيئة التطبيق:", error);
    tasksList.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-icon">
                            <svg viewBox="0 0 24 24">
                                <circle cx="12" cy="12" r="10"/>
                                <line x1="15" y1="9" x2="9" y2="15"/>
                                <line x1="9" y1="9" x2="15" y2="15"/>
                            </svg>
                        </div>
                        <h3>حدث خطأ غير متوقع</h3>
                        <p>يرجى تحديث الصفحة والمحاولة مرة أخرى</p>
                    </div>
                `;
  }
};

// بدء التطبيق عند تحميل الصفحة
document.addEventListener("DOMContentLoaded", init);
