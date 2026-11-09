/**
 * Quadrant todos: a four-quadrant (Eisenhower) task board with its own sidebar
 * entry.
 *
 * This is a Client-only contribution. It registers two cells that the shell
 * joins by id:
 *
 *   - `sidebar.panellist` id `quadrant-todos` — the left-column row and icon;
 *     the sidebar owns the button and selects the matching `main` panel.
 *   - `main` key `quadrant-todos` — the full-width board page.
 *
 * Task records live in this window's localStorage under one versioned key, so
 * they survive reloads and app restarts of the `dsh-app://` origin. The store
 * helpers are deliberately small and synchronous: a later Host-backed store can
 * replace them without changing the view.
 */
window.__ModuleLoader__.load({
  id: "dsh-quadrant-todos",
  factory(require) {
    const React = require("react");
    const h = React.createElement;

    /** Locale namespace owned by this plugin. */
    const NS = "quadrant.todos";
    /** Sidebar list id and `main` panel key; the shell joins them by id. */
    const PANEL_ID = "quadrant-todos";
    /** Versioned browser-local store key. */
    const STORE_KEY = "dsh.quadrant-todos.v1";

    /** The four cells, in reading order. */
    const QUADRANTS = [
      { id: "do", labelKey: "q.do", hintKey: "q.do.hint" },
      { id: "plan", labelKey: "q.plan", hintKey: "q.plan.hint" },
      { id: "delegate", labelKey: "q.delegate", hintKey: "q.delegate.hint" },
      { id: "drop", labelKey: "q.drop", hintKey: "q.drop.hint" },
    ];
    const QUADRANT_IDS = QUADRANTS.map((quadrant) => quadrant.id);
    const isQuadrantId = (value) => QUADRANT_IDS.includes(value);

    /** Simplified Chinese dictionary — the key-set source of truth. */
    const zh = {
      panel: "待办清单",
      title: "四象限待办",
      hint: "按「重要 / 紧急」把待办放进四个象限。拖动行可以换象限，勾选即完成，点击标题可以改名。",
      "q.do": "重要且紧急",
      "q.do.hint": "立即做",
      "q.plan": "重要不紧急",
      "q.plan.hint": "计划做",
      "q.delegate": "紧急不重要",
      "q.delegate.hint": "尽快处理或委托",
      "q.drop": "不重要不紧急",
      "q.drop.hint": "删掉或稍后",
      add: "添加任务",
      "add.placeholder": "输入任务，回车添加",
      "add.submit": "添加",
      "add.cancel": "取消",
      empty: "把任务拖到这里，或点 + 添加",
      "drop.hint": "松开以移入此象限",
      "done.toggle": "已完成",
      "task.toggle": "标记完成",
      "task.edit": "点击编辑任务",
      "task.delete": "删除任务",
      "edit.placeholder": "任务标题",
      "edit.save": "保存",
      "edit.cancel": "取消",
      "move.to": "移动到",
      "undo.done": "已删除任务：",
      "undo.action": "撤销",
      "metrics.open": "待办",
      "storage.readFailed": "读取本地任务失败，当前显示为空清单。",
      "storage.writeFailed": "本地保存失败，这次改动可能不会保留。",
      "notice.dismiss": "关闭提示",
    };

    /** English dictionary, key-identical to the Chinese source of truth. */
    const en = {
      panel: "Todo list",
      title: "Quadrant todos",
      hint: "Sort tasks into four quadrants by importance and urgency. Drag a row to move it, tick it to finish, and click a title to rename it.",
      "q.do": "Important and urgent",
      "q.do.hint": "Do now",
      "q.plan": "Important, not urgent",
      "q.plan.hint": "Schedule it",
      "q.delegate": "Urgent, not important",
      "q.delegate.hint": "Do fast or delegate",
      "q.drop": "Not important, not urgent",
      "q.drop.hint": "Drop or later",
      add: "Add task",
      "add.placeholder": "Type a task and press Enter",
      "add.submit": "Add",
      "add.cancel": "Cancel",
      empty: "Drop a task here, or press + to add one",
      "drop.hint": "Release to move here",
      "done.toggle": "Completed",
      "task.toggle": "Mark done",
      "task.edit": "Click to edit this task",
      "task.delete": "Delete task",
      "edit.placeholder": "Task title",
      "edit.save": "Save",
      "edit.cancel": "Cancel",
      "move.to": "Move to",
      "undo.done": "Deleted task: ",
      "undo.action": "Undo",
      "metrics.open": "Open",
      "storage.readFailed": "Could not read local tasks; the list starts empty.",
      "storage.writeFailed": "Could not save locally; this change may not persist.",
      "notice.dismiss": "Dismiss notice",
    };

    let idCounter = 0;
    function newId() {
      idCounter += 1;
      return "t" + Date.now().toString(36) + idCounter.toString(36) + Math.random().toString(36).slice(2, 6);
    }

    function normalizeTask(raw) {
      if (raw === null || typeof raw !== "object") return null;
      const title = typeof raw.title === "string" ? raw.title.trim() : "";
      if (title === "") return null;
      const now = Date.now();
      return {
        id: typeof raw.id === "string" && raw.id !== "" ? raw.id : newId(),
        title,
        quadrant: isQuadrantId(raw.quadrant) ? raw.quadrant : "do",
        done: raw.done === true,
        createdAt: typeof raw.createdAt === "number" ? raw.createdAt : now,
        updatedAt: typeof raw.updatedAt === "number" ? raw.updatedAt : now,
      };
    }

    function readStore() {
      try {
        if (typeof localStorage === "undefined") return { tasks: [], failed: false };
        const raw = localStorage.getItem(STORE_KEY);
        if (raw === null) return { tasks: [], failed: false };
        const parsed = JSON.parse(raw);
        if (parsed === null || typeof parsed !== "object" || !Array.isArray(parsed.tasks)) {
          return { tasks: [], failed: false };
        }
        const tasks = parsed.tasks.map(normalizeTask).filter((task) => task !== null);
        return { tasks, failed: false };
      } catch (error) {
        console.error("quadrant todos: could not read local tasks", error);
        return { tasks: [], failed: true };
      }
    }

    function writeStore(tasks) {
      try {
        if (typeof localStorage === "undefined") return false;
        localStorage.setItem(STORE_KEY, JSON.stringify({ version: 1, tasks }));
        return true;
      } catch (error) {
        console.error("quadrant todos: could not save local tasks", error);
        return false;
      }
    }

    function translateOf(props) {
      if (typeof props.t === "function") return props.t;
      return (key) => (zh[key] === undefined ? key : zh[key]);
    }

    function plusIcon() {
      return h(
        "svg",
        {
          viewBox: "0 0 16 16",
          width: 14,
          height: 14,
          "aria-hidden": true,
          fill: "none",
          stroke: "currentColor",
          strokeWidth: 1.6,
          strokeLinecap: "round",
          style: { display: "block" },
        },
        h("path", { d: "M8 3.5v9M3.5 8h9" }),
      );
    }

    function closeIcon() {
      return h(
        "svg",
        {
          viewBox: "0 0 16 16",
          width: 14,
          height: 14,
          "aria-hidden": true,
          fill: "none",
          stroke: "currentColor",
          strokeWidth: 1.6,
          strokeLinecap: "round",
          style: { display: "block" },
        },
        h("path", { d: "M4 4l8 8M12 4l-8 8" }),
      );
    }

    function QuadrantIcon(props) {
      const size = typeof props.size === "number" ? props.size : 20;
      const strong = props.active === true;
      return h(
        "svg",
        {
          width: size,
          height: size,
          viewBox: "0 0 20 20",
          "aria-hidden": true,
          focusable: "false",
          style: { display: "block" },
        },
        h("rect", { x: 1.5, y: 1.5, width: 7.6, height: 7.6, rx: 2.2, fill: "currentColor", opacity: strong ? 1 : 0.9 }),
        h("rect", { x: 10.9, y: 1.5, width: 7.6, height: 7.6, rx: 2.2, fill: "currentColor", opacity: strong ? 0.72 : 0.55 }),
        h("rect", { x: 1.5, y: 10.9, width: 7.6, height: 7.6, rx: 2.2, fill: "currentColor", opacity: strong ? 0.55 : 0.4 }),
        h("rect", { x: 10.9, y: 10.9, width: 7.6, height: 7.6, rx: 2.2, fill: "currentColor", opacity: 0.3 }),
      );
    }

    const STYLES = [
      ".qtd-page{height:100%;overflow-y:auto;box-sizing:border-box;color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-base);}",
      ".qtd-page *{box-sizing:border-box;}",
      ".qtd-content{max-width:1120px;margin:0 auto;padding:28px 32px 72px;display:flex;flex-direction:column;gap:16px;}",
      ".qtd-heading{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap;}",
      ".qtd-title{margin:0;font-size:20px;font-weight:600;line-height:1.35;letter-spacing:-.01em;}",
      ".qtd-hint{margin:6px 0 0;max-width:64ch;font-size:13px;line-height:1.55;color:var(--dsw-alias-label-secondary);}",
      ".qtd-metrics{display:inline-flex;align-items:center;gap:6px;padding:4px 10px;border:1px solid var(--dsw-alias-border-l1);border-radius:999px;font-size:12px;line-height:1.4;color:var(--dsw-alias-label-secondary);white-space:nowrap;}",
      ".qtd-notice{display:flex;align-items:center;gap:10px;padding:8px 12px;border:1px solid var(--dsw-alias-border-l1);border-radius:10px;background:var(--dsw-alias-bg-layer-1);font-size:13px;line-height:1.45;color:var(--dsw-alias-label-secondary);}",
      ".qtd-notice-error{border-color:var(--dsw-alias-state-warn-primary);color:var(--dsw-alias-label-primary);}",
      ".qtd-notice-text{flex:1;min-width:0;overflow-wrap:anywhere;}",
      ".qtd-board{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;align-items:start;}",
      "@media (max-width:820px){.qtd-board{grid-template-columns:minmax(0,1fr);}}",
      ".qtd-card{--qtd-accent:var(--dsw-alias-brand-primary);display:flex;flex-direction:column;gap:8px;min-height:188px;padding:12px;border:1px solid var(--dsw-alias-border-l1);border-radius:14px;background:var(--dsw-alias-bg-layer-1);transition:border-color .12s ease,background .12s ease;}",
      '.qtd-card[data-quadrant="do"]{--qtd-accent:var(--dsw-alias-state-error-primary);}',
      '.qtd-card[data-quadrant="plan"]{--qtd-accent:var(--dsw-alias-brand-primary);}',
      '.qtd-card[data-quadrant="delegate"]{--qtd-accent:var(--dsw-alias-state-warn-primary);}',
      '.qtd-card[data-quadrant="drop"]{--qtd-accent:var(--dsw-alias-state-idle-primary);}',
      ".qtd-card-drop{border-color:var(--qtd-accent);background:var(--dsw-alias-bg-layer-2);}",
      ".qtd-card-head{display:flex;align-items:center;gap:8px;min-height:28px;}",
      ".qtd-dot{flex:none;width:8px;height:8px;border-radius:3px;background:var(--qtd-accent);}",
      ".qtd-card-title{flex:1;min-width:0;margin:0;display:flex;align-items:baseline;gap:6px;font-size:13.5px;font-weight:600;line-height:1.3;}",
      ".qtd-card-hint{font-size:12px;font-weight:400;color:var(--dsw-alias-label-secondary);}",
      ".qtd-count{flex:none;min-width:20px;padding:1px 6px;border-radius:999px;background:var(--dsw-alias-bg-layer-2);font-size:11.5px;font-variant-numeric:tabular-nums;text-align:center;color:var(--dsw-alias-label-secondary);}",
      ".qtd-rows{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:2px;}",
      ".qtd-row{display:flex;align-items:flex-start;gap:8px;padding:6px 6px 6px 4px;border-radius:8px;}",
      ".qtd-row:hover{background:var(--dsw-alias-bg-layer-2);}",
      ".qtd-row-dragging{opacity:.45;}",
      ".qtd-check{flex:none;width:15px;height:15px;margin:3px 0 0;accent-color:var(--qtd-accent);cursor:pointer;}",
      ".qtd-task-title{flex:1;min-width:0;margin:0;padding:0;border:0;border-radius:6px;background:none;font:inherit;font-size:13.5px;line-height:1.5;text-align:left;color:inherit;cursor:text;overflow-wrap:anywhere;}",
      ".qtd-task-title:hover{text-decoration:underline;text-decoration-color:var(--dsw-alias-border-l2);text-underline-offset:3px;}",
      ".qtd-task-title:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px;}",
      ".qtd-row-done .qtd-task-title{color:var(--dsw-alias-label-secondary);text-decoration:line-through;text-decoration-thickness:1px;}",
      ".qtd-row-actions{display:flex;gap:2px;opacity:0;transition:opacity .12s ease;}",
      ".qtd-row:hover .qtd-row-actions,.qtd-row:focus-within .qtd-row-actions{opacity:1;}",
      ".qtd-icon-btn{display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;padding:0;border:0;border-radius:6px;background:none;color:var(--dsw-alias-label-secondary);cursor:pointer;}",
      ".qtd-icon-btn:hover{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);}",
      ".qtd-icon-btn:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px;}",
      ".qtd-edit-body{flex:1;min-width:0;display:flex;flex-direction:column;gap:6px;}",
      ".qtd-input{width:100%;height:30px;padding:0 8px;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;background:var(--dsw-alias-bg-base);color:inherit;font:inherit;font-size:13.5px;}",
      ".qtd-input::placeholder{color:var(--dsw-alias-label-secondary);}",
      ".qtd-input:focus{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:-1px;}",
      ".qtd-edit-actions{display:flex;align-items:center;gap:6px;flex-wrap:wrap;}",
      ".qtd-move-dots{display:flex;gap:4px;margin-right:auto;}",
      ".qtd-move-dot{width:14px;height:14px;padding:0;border:1px solid var(--dsw-alias-border-l2);border-radius:4px;background:var(--dsw-alias-bg-layer-2);cursor:pointer;}",
      '.qtd-move-dot[data-quadrant="do"]{background:var(--dsw-alias-state-error-primary);}',
      '.qtd-move-dot[data-quadrant="plan"]{background:var(--dsw-alias-brand-primary);}',
      '.qtd-move-dot[data-quadrant="delegate"]{background:var(--dsw-alias-state-warn-primary);}',
      '.qtd-move-dot[data-quadrant="drop"]{background:var(--dsw-alias-state-idle-primary);}',
      '.qtd-move-dot[aria-pressed="true"]{outline:2px solid var(--dsw-alias-label-primary);outline-offset:1px;}',
      ".qtd-btn{height:26px;padding:0 10px;border:1px solid var(--dsw-alias-border-l1);border-radius:7px;background:var(--dsw-alias-bg-layer-2);color:inherit;font:inherit;font-size:12.5px;line-height:1.4;cursor:pointer;}",
      ".qtd-btn:hover{border-color:var(--dsw-alias-border-l2);}",
      ".qtd-btn:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px;}",
      ".qtd-btn-primary{border-color:var(--dsw-alias-brand-primary);background:var(--dsw-alias-brand-primary);color:var(--dsw-alias-bg-base);}",
      ".qtd-add-row{display:flex;align-items:center;gap:6px;}",
      ".qtd-empty{margin:2px 0 0;padding:16px 10px;border:1px dashed var(--dsw-alias-border-l1);border-radius:10px;font-size:12.5px;line-height:1.5;text-align:center;color:var(--dsw-alias-label-secondary);}",
      ".qtd-done-toggle{display:inline-flex;align-items:center;gap:6px;align-self:flex-start;margin-top:2px;padding:4px 6px;border:0;border-radius:6px;background:none;font:inherit;font-size:12px;line-height:1.4;color:var(--dsw-alias-label-secondary);cursor:pointer;}",
      ".qtd-done-toggle:hover{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);}",
      ".qtd-caret{font-size:10px;line-height:1;}",
    ].join("");

    function QuadrantTodosPage(props) {
      const t = translateOf(props);
      const [initial] = React.useState(readStore);
      const [tasks, setTasks] = React.useState(initial.tasks);
      const [notice, setNotice] = React.useState(initial.failed ? "storage.readFailed" : null);
      const [addingQuadrant, setAddingQuadrant] = React.useState(null);
      const [draft, setDraft] = React.useState("");
      const [editingId, setEditingId] = React.useState(null);
      const [editingTitle, setEditingTitle] = React.useState("");
      const [editingQuadrant, setEditingQuadrant] = React.useState(null);
      const [doneOpen, setDoneOpen] = React.useState({});
      const [draggingId, setDraggingId] = React.useState(null);
      const [dropTarget, setDropTarget] = React.useState(null);
      const [undo, setUndo] = React.useState(null);
      const headingRef = React.useRef(null);

      const commit = React.useCallback((next) => {
        setTasks(next);
        if (writeStore(next)) {
          setNotice((current) => (current === "storage.writeFailed" ? null : current));
        } else {
          setNotice("storage.writeFailed");
        }
      }, []);

      React.useEffect(() => {
        if (undo === null) return undefined;
        const timer = window.setTimeout(() => setUndo(null), 8000);
        return () => window.clearTimeout(timer);
      }, [undo]);

      React.useEffect(() => {
        const onStorage = (event) => {
          if (event.key !== STORE_KEY) return;
          setTasks(readStore().tasks);
        };
        window.addEventListener("storage", onStorage);
        return () => window.removeEventListener("storage", onStorage);
      }, []);

      const closeComposer = () => {
        setAddingQuadrant(null);
        setDraft("");
      };

      const addTask = (quadrantId, rawTitle) => {
        const title = rawTitle.trim();
        if (title === "") return false;
        const now = Date.now();
        commit([...tasks, { id: newId(), title, quadrant: quadrantId, done: false, createdAt: now, updatedAt: now }]);
        return true;
      };

      const toggleDone = (task) => {
        const now = Date.now();
        commit(tasks.map((item) => (item.id === task.id ? { ...item, done: !item.done, updatedAt: now } : item)));
      };

      const moveTask = (id, quadrantId) => {
        if (!isQuadrantId(quadrantId)) return;
        const now = Date.now();
        commit(
          tasks.map((item) =>
            item.id === id && item.quadrant !== quadrantId ? { ...item, quadrant: quadrantId, updatedAt: now } : item,
          ),
        );
      };

      const removeTask = (task) => {
        commit(tasks.filter((item) => item.id !== task.id));
        setUndo({ task });
      };

      const restoreTask = () => {
        if (undo === null) return;
        const alreadyThere = tasks.some((item) => item.id === undo.task.id);
        commit(alreadyThere ? tasks : [...tasks, undo.task]);
        setUndo(null);
      };

      const startEdit = (task) => {
        setEditingId(task.id);
        setEditingTitle(task.title);
        setEditingQuadrant(task.quadrant);
      };

      const cancelEdit = () => {
        setEditingId(null);
        setEditingQuadrant(null);
      };

      const saveEdit = (task) => {
        const title = editingTitle.trim();
        if (title === "") {
          cancelEdit();
          return;
        }
        const now = Date.now();
        commit(
          tasks.map((item) =>
            item.id === task.id
              ? { ...item, title, quadrant: isQuadrantId(editingQuadrant) ? editingQuadrant : item.quadrant, updatedAt: now }
              : item,
          ),
        );
        cancelEdit();
      };

      const renderRow = (task) => {
        if (editingId === task.id) {
          return h(
            "li",
            { key: task.id, className: "qtd-row qtd-row-editing" },
            h("input", {
              type: "checkbox",
              className: "qtd-check",
              checked: task.done,
              onChange: () => toggleDone(task),
              "aria-label": t("task.toggle"),
            }),
            h(
              "div",
              { className: "qtd-edit-body" },
              h("input", {
                className: "qtd-input",
                autoFocus: true,
                value: editingTitle,
                placeholder: t("edit.placeholder"),
                "aria-label": t("edit.placeholder"),
                onChange: (event) => setEditingTitle(event.target.value),
                onKeyDown: (event) => {
                  if (event.nativeEvent.isComposing) return;
                  if (event.key === "Enter") {
                    event.preventDefault();
                    saveEdit(task);
                  } else if (event.key === "Escape") {
                    event.preventDefault();
                    cancelEdit();
                  }
                },
              }),
              h(
                "div",
                { className: "qtd-edit-actions" },
                h(
                  "div",
                  { className: "qtd-move-dots", role: "group", "aria-label": t("move.to") },
                  QUADRANTS.map((quadrant) =>
                    h("button", {
                      key: quadrant.id,
                      type: "button",
                      className: "qtd-move-dot",
                      "data-quadrant": quadrant.id,
                      "aria-label": t("move.to") + " " + t(quadrant.labelKey),
                      "aria-pressed": editingQuadrant === quadrant.id,
                      title: t(quadrant.labelKey),
                      onClick: () => setEditingQuadrant(quadrant.id),
                    }),
                  ),
                ),
                h("button", { type: "button", className: "qtd-btn qtd-btn-primary", onClick: () => saveEdit(task) }, t("edit.save")),
                h("button", { type: "button", className: "qtd-btn", onClick: cancelEdit }, t("edit.cancel")),
              ),
            ),
          );
        }
        return h(
          "li",
          {
            key: task.id,
            className: "qtd-row" + (task.done ? " qtd-row-done" : "") + (draggingId === task.id ? " qtd-row-dragging" : ""),
            draggable: true,
            onDragStart: (event) => {
              event.dataTransfer.effectAllowed = "move";
              event.dataTransfer.setData("text/plain", task.id);
              setDraggingId(task.id);
            },
            onDragEnd: () => {
              setDraggingId(null);
              setDropTarget(null);
            },
          },
          h("input", {
            type: "checkbox",
            className: "qtd-check",
            checked: task.done,
            onChange: () => toggleDone(task),
            "aria-label": t("task.toggle"),
          }),
          h(
            "button",
            {
              type: "button",
              className: "qtd-task-title",
              title: t("task.edit"),
              onClick: () => startEdit(task),
            },
            task.title,
          ),
          h(
            "div",
            { className: "qtd-row-actions" },
            h(
              "button",
              {
                type: "button",
                className: "qtd-icon-btn",
                "aria-label": t("task.delete") + "：" + task.title,
                title: t("task.delete"),
                onClick: () => removeTask(task),
              },
              closeIcon(),
            ),
          ),
        );
      };

      const renderQuadrant = (quadrant) => {
        const list = tasks.filter((task) => task.quadrant === quadrant.id);
        const openTasks = list.filter((task) => !task.done);
        const doneTasks = list.filter((task) => task.done);
        const isAdding = addingQuadrant === quadrant.id;
        const isDropTarget = draggingId !== null && dropTarget === quadrant.id;
        const doneExpanded = doneOpen[quadrant.id] !== false;

        const composer = isAdding
          ? h(
              "div",
              { className: "qtd-add-row" },
              h("input", {
                className: "qtd-input",
                autoFocus: true,
                value: draft,
                placeholder: t("add.placeholder"),
                "aria-label": t("add.placeholder"),
                onChange: (event) => setDraft(event.target.value),
                onKeyDown: (event) => {
                  if (event.nativeEvent.isComposing) return;
                  if (event.key === "Enter") {
                    event.preventDefault();
                    if (addTask(quadrant.id, draft)) setDraft("");
                  } else if (event.key === "Escape") {
                    event.preventDefault();
                    closeComposer();
                  }
                },
              }),
              h(
                "button",
                {
                  type: "button",
                  className: "qtd-btn qtd-btn-primary",
                  onClick: () => {
                    if (addTask(quadrant.id, draft)) setDraft("");
                  },
                },
                t("add.submit"),
              ),
              h("button", { type: "button", className: "qtd-btn", onClick: closeComposer }, t("add.cancel")),
            )
          : null;

        const body = [];
        if (!isAdding && list.length === 0) {
          body.push(h("div", { key: "empty", className: "qtd-empty" }, t("empty")));
        }
        if (openTasks.length > 0) {
          body.push(h("ul", { key: "open", className: "qtd-rows" }, openTasks.map(renderRow)));
        }
        if (doneTasks.length > 0) {
          body.push(
            h(
              "div",
              { key: "done", className: "qtd-done" },
              h(
                "button",
                {
                  type: "button",
                  className: "qtd-done-toggle",
                  "aria-expanded": doneExpanded,
                  onClick: () => setDoneOpen((current) => ({ ...current, [quadrant.id]: !doneExpanded })),
                },
                h("span", { className: "qtd-caret", "aria-hidden": true }, doneExpanded ? "▾" : "▸"),
                t("done.toggle") + " (" + doneTasks.length + ")",
              ),
              doneExpanded ? h("ul", { className: "qtd-rows" }, doneTasks.map(renderRow)) : null,
            ),
          );
        }

        return h(
          "section",
          {
            key: quadrant.id,
            className: "qtd-card" + (isDropTarget ? " qtd-card-drop" : ""),
            "data-quadrant": quadrant.id,
            "aria-label": t(quadrant.labelKey),
            onDragOver: (event) => {
              if (draggingId === null) return;
              event.preventDefault();
              event.dataTransfer.dropEffect = "move";
              if (dropTarget !== quadrant.id) setDropTarget(quadrant.id);
            },
            onDragLeave: (event) => {
              if (event.currentTarget.contains(event.relatedTarget)) return;
              setDropTarget((current) => (current === quadrant.id ? null : current));
            },
            onDrop: (event) => {
              event.preventDefault();
              const id = draggingId !== null ? draggingId : event.dataTransfer.getData("text/plain");
              if (id !== "") moveTask(id, quadrant.id);
              setDraggingId(null);
              setDropTarget(null);
            },
          },
          h(
            "header",
            { className: "qtd-card-head" },
            h("span", { className: "qtd-dot", "aria-hidden": true }),
            h("h2", { className: "qtd-card-title" }, h("span", null, t(quadrant.labelKey)), h("span", { className: "qtd-card-hint" }, t(quadrant.hintKey))),
            h("span", { className: "qtd-count", title: t("metrics.open") }, String(openTasks.length)),
            h(
              "button",
              {
                type: "button",
                className: "qtd-icon-btn",
                "aria-label": t("add") + " · " + t(quadrant.labelKey),
                title: t("add"),
                onClick: () => {
                  setAddingQuadrant(quadrant.id);
                  setDraft("");
                },
              },
              plusIcon(),
            ),
          ),
          composer,
          body,
        );
      };

      const openTotal = tasks.filter((task) => !task.done).length;

      return h(
        "section",
        { className: "qtd-page", "aria-label": t("title") },
        h("style", null, STYLES),
        h(
          "div",
          { className: "qtd-content" },
          h(
            "div",
            { className: "qtd-heading" },
            h(
              "div",
              null,
              h("h1", { ref: headingRef, tabIndex: -1, className: "qtd-title" }, t("title")),
              h("p", { className: "qtd-hint" }, t("hint")),
            ),
            h("span", { className: "qtd-metrics" }, t("metrics.open") + " " + String(openTotal)),
          ),
          notice !== null
            ? h(
                "div",
                { className: "qtd-notice qtd-notice-error", role: "status" },
                h("span", { className: "qtd-notice-text" }, t(notice)),
                h("button", { type: "button", className: "qtd-btn", onClick: () => setNotice(null) }, t("notice.dismiss")),
              )
            : null,
          undo !== null
            ? h(
                "div",
                { className: "qtd-notice", role: "status" },
                h("span", { className: "qtd-notice-text" }, t("undo.done") + undo.task.title),
                h("button", { type: "button", className: "qtd-btn qtd-btn-primary", onClick: restoreTask }, t("undo.action")),
                h(
                  "button",
                  { type: "button", className: "qtd-icon-btn", "aria-label": t("notice.dismiss"), onClick: () => setUndo(null) },
                  closeIcon(),
                ),
              )
            : null,
          h("div", { className: "qtd-board" }, QUADRANTS.map(renderQuadrant)),
        ),
      );
    }

    /** Required services: the slot registry and the locale registry. */
    const inject = ["slots", "locale"];

    function apply(ctx) {
      ctx.effect(() => ctx.locale.register(NS, { zh, en }), "quadrant-todos: dictionaries");
      const t = ctx.locale.bind(NS);

      ctx.slots.inject("main", () =>
        ctx.slots.register({ name: "main", key: PANEL_ID, locale: NS }, QuadrantTodosPage),
      );

      ctx.slots.inject("sidebar.panellist", () =>
        ctx.slots.register(
          { name: "sidebar.panellist", id: PANEL_ID, order: 20, locale: NS, label: () => t("panel") },
          QuadrantIcon,
        ),
      );
    }

    return { inject, apply };
  },
});
