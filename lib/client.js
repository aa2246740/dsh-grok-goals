window.__ModuleLoader__.load({
	id: "dsh-grok-goals",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react = require("react");
		let _deepseek_ai_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");
		let react_jsx_runtime = require("react/jsx-runtime");
		//#region src/settings-contract.ts
		/** Shared client and Host settings namespace. */
		const GROK_GOAL_SETTINGS_NAMESPACE = "dsh-grok-goals";
		//#endregion
		//#region src/wire.ts
		const GROK_GOAL_RPC_CHANNEL = "/grok-goals";
		const GROK_GOAL_STATE_ENDPOINT = "state";
		function isRecord(value) {
			return typeof value === "object" && value !== null && !Array.isArray(value);
		}
		function parseGrokGoalStateResponse(value) {
			if (!isRecord(value) || !Object.hasOwn(value, "goal")) throw new Error("Invalid Grok goal state response.");
			const goal = value["goal"];
			if (goal !== null && (!isRecord(goal) || typeof goal["goalId"] !== "string" || typeof goal["objective"] !== "string" || typeof goal["status"] !== "string" || typeof goal["revision"] !== "number")) throw new Error("Invalid Grok goal snapshot response.");
			return { goal };
		}
		//#endregion
		//#region \0dshx-css-module:GrokGoalDock.module.css.mjs
		const css$1 = ".pDw6MW_dock{box-sizing:border-box;width:calc(100% - var(--dsh-composer-side-clearance) - var(--dsh-composer-side-clearance) - var(--dsh-composer-dock-inset) - var(--dsh-composer-dock-inset) - var(--dsh-composer-dock-inset) - var(--dsh-composer-dock-inset));margin:0 auto}.pDw6MW_bar{box-sizing:border-box;width:100%;max-width:calc(var(--dsh-composer-card-max-width) - 4 * var(--dsh-composer-dock-inset));border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-specific-tip);border-radius:12px;align-items:center;gap:4px;height:36px;margin:0 auto;padding:3px 5px 4px 6px;display:flex;position:relative;overflow:hidden}.pDw6MW_bar:focus-within{border-color:var(--dsw-alias-state-business-primary);box-shadow:0 0 0 2px color-mix(in srgb, var(--dsw-alias-state-business-primary) 16%, transparent)}.pDw6MW_summaryButton{min-width:0;height:28px;color:inherit;text-align:left;cursor:pointer;background:0 0;border:0;border-radius:8px;flex:1;align-items:center;gap:9px;padding:0 3px 0 6px;display:flex;overflow:hidden}.pDw6MW_summaryButton:hover{background:var(--dsw-alias-interactive-bg-hover)}.pDw6MW_summaryButton:focus-visible,.pDw6MW_iconButton:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:-1px}.pDw6MW_goalGlyph{color:var(--dsw-alias-label-tertiary);flex:none;display:inline-flex}.pDw6MW_label{color:var(--dsw-alias-label-primary);white-space:nowrap;flex:none;font-size:13px;font-weight:500;line-height:20px}.pDw6MW_objective{min-width:0;color:var(--dsw-alias-label-primary-dimmed);text-overflow:ellipsis;white-space:nowrap;flex:1;font-size:13px;line-height:20px;overflow:hidden}.pDw6MW_tokenLabel,.pDw6MW_verifierCompact{color:var(--dsw-alias-label-tertiary);font-variant-numeric:tabular-nums;white-space:nowrap;flex:none;font-size:11px;line-height:18px}.pDw6MW_verifierCompact{border-left:1px solid var(--dsw-alias-border-l1);padding-left:8px}.pDw6MW_chevron{color:var(--dsw-alias-label-caption);flex:none;display:inline-flex}.pDw6MW_iconButton{width:28px;height:28px;color:var(--dsw-alias-label-tertiary);cursor:pointer;background:0 0;border:0;border-radius:999px;flex:none;justify-content:center;align-items:center;padding:0;display:inline-flex}.pDw6MW_iconButton:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-secondary)}.pDw6MW_iconButton:disabled{opacity:.45;cursor:default}.pDw6MW_inlineError{max-width:160px;color:var(--dsw-alias-state-error-primary);text-overflow:ellipsis;white-space:nowrap;font-size:11px;line-height:18px;overflow:hidden}.pDw6MW_dockBudget{background:var(--dsw-alias-border-l1);pointer-events:none;border-radius:999px;height:2px;position:absolute;bottom:0;left:8px;right:8px;overflow:hidden}.pDw6MW_dockBudget>span{border-radius:inherit;background:var(--dsw-alias-state-success-primary);height:100%;display:block}.pDw6MW_bar[data-status=budget_limited] .pDw6MW_dockBudget>span,.pDw6MW_bar[data-status=blocked] .pDw6MW_dockBudget>span,.pDw6MW_bar[data-status=infra_paused] .pDw6MW_dockBudget>span,.pDw6MW_bar[data-status=no_progress_paused] .pDw6MW_dockBudget>span,.pDw6MW_bar[data-status=back_off_paused] .pDw6MW_dockBudget>span{background:var(--dsw-alias-state-warn-primary)}.pDw6MW_dialog{width:min(720px,100vw - 32px);max-height:calc(100vh - 32px)}.pDw6MW_dialogContent{min-height:0;overflow:auto}.pDw6MW_detailRoot{flex-direction:column;gap:18px;min-width:0;display:flex}.pDw6MW_detailRoot:focus{outline:none}.pDw6MW_errorBanner,.pDw6MW_confirmBanner,.pDw6MW_pausePanel{border-radius:10px;flex-direction:column;gap:4px;padding:12px 14px;font-size:12px;line-height:18px;display:flex}.pDw6MW_errorBanner{color:var(--dsw-alias-state-error-primary);background:color-mix(in srgb, var(--dsw-alias-state-error-primary) 8%, transparent)}.pDw6MW_confirmBanner,.pDw6MW_pausePanel{color:var(--dsw-alias-state-warn-label);background:var(--dsw-alias-state-warn-tertiary)}.pDw6MW_confirmBanner span,.pDw6MW_pausePanel p,.pDw6MW_pausePanel span{color:var(--dsw-alias-label-primary-dimmed);margin:0}.pDw6MW_hero{flex-direction:column;gap:8px;display:flex}.pDw6MW_heroMeta{align-items:center;gap:10px;min-width:0;display:flex}.pDw6MW_hero h3{overflow-wrap:anywhere;color:var(--dsw-alias-label-primary);margin:0;font-size:16px;font-weight:500;line-height:24px}.pDw6MW_hero p{color:var(--dsw-alias-label-tertiary);margin:0;font-size:12px;line-height:18px}.pDw6MW_statusChip{min-width:0;color:var(--dsw-alias-label-secondary);background:var(--dsw-alias-bg-base);border-radius:999px;align-items:center;gap:6px;padding:3px 8px;font-size:12px;font-weight:500;line-height:18px;display:inline-flex}.pDw6MW_statusDot{background:var(--dsw-alias-label-caption);border-radius:999px;width:7px;height:7px}.pDw6MW_statusChip[data-status=active] .pDw6MW_statusDot{background:var(--dsw-alias-state-business-primary)}.pDw6MW_statusChip[data-status=complete] .pDw6MW_statusDot{background:var(--dsw-alias-state-success-primary)}.pDw6MW_statusChip[data-status=blocked] .pDw6MW_statusDot,.pDw6MW_statusChip[data-status=budget_limited] .pDw6MW_statusDot,.pDw6MW_statusChip[data-status=infra_paused] .pDw6MW_statusDot,.pDw6MW_statusChip[data-status=no_progress_paused] .pDw6MW_statusDot,.pDw6MW_statusChip[data-status=back_off_paused] .pDw6MW_statusDot{background:var(--dsw-alias-state-warn-primary)}.pDw6MW_activityLabel{color:var(--dsw-alias-label-tertiary);text-overflow:ellipsis;white-space:nowrap;font-size:12px;line-height:18px;overflow:hidden}.pDw6MW_metrics{border-top:1px solid var(--dsw-alias-border-l1);border-bottom:1px solid var(--dsw-alias-border-l1);grid-template-columns:repeat(4,minmax(0,1fr));margin:0;display:grid}.pDw6MW_metrics>div{min-width:0;padding:12px 10px}.pDw6MW_metrics>div+div{border-left:1px solid var(--dsw-alias-border-l1)}.pDw6MW_metrics dt{color:var(--dsw-alias-label-caption);margin-bottom:4px;font-size:11px;font-weight:500;line-height:16px}.pDw6MW_metrics dd{color:var(--dsw-alias-label-primary);font-variant-numeric:tabular-nums;text-overflow:ellipsis;white-space:nowrap;margin:0;font-size:12px;line-height:18px;overflow:hidden}.pDw6MW_budgetBlock{margin-top:-10px}.pDw6MW_budgetTrack{background:var(--dsw-alias-border-l1);border-radius:999px;height:4px;overflow:hidden}.pDw6MW_budgetTrack>span{border-radius:inherit;background:var(--dsw-alias-state-business-primary);height:100%;display:block}.pDw6MW_section{border-top:1px solid var(--dsw-alias-border-l1);flex-direction:column;gap:10px;padding-top:18px;display:flex}.pDw6MW_section h4,.pDw6MW_section h5{color:var(--dsw-alias-label-primary);margin:0;font-weight:500}.pDw6MW_section h4{font-size:13px;line-height:20px}.pDw6MW_section h5{margin-bottom:8px;font-size:12px;line-height:18px}.pDw6MW_nextStep,.pDw6MW_summary,.pDw6MW_empty{overflow-wrap:anywhere;margin:0;font-size:13px;line-height:20px}.pDw6MW_nextStep,.pDw6MW_summary{color:var(--dsw-alias-label-primary)}.pDw6MW_empty{color:var(--dsw-alias-label-tertiary)}.pDw6MW_planGrid{grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:18px 24px;display:grid}.pDw6MW_planGrid ol,.pDw6MW_planGrid ul,.pDw6MW_gapList{margin:0;padding-left:20px}.pDw6MW_planGrid li,.pDw6MW_gapList li{overflow-wrap:anywhere;color:var(--dsw-alias-label-primary-dimmed);margin:5px 0;font-size:12px;line-height:18px}.pDw6MW_fullWidth{grid-column:1/-1}.pDw6MW_verificationList{flex-direction:column;gap:8px;list-style:none;display:flex;padding:0!important}.pDw6MW_verificationList li{grid-template-columns:auto minmax(0,1fr);align-items:start;gap:8px;margin:0;display:grid}.pDw6MW_verificationList span{color:var(--dsw-alias-label-secondary);background:var(--dsw-alias-bg-base);border-radius:999px;padding:1px 6px;font-size:10px;font-weight:500;line-height:16px}.pDw6MW_verificationList span[data-kind=gating]{color:var(--dsw-alias-state-business-primary);background:var(--dsw-alias-state-business-tertiary)}.pDw6MW_verificationList p{margin:0}.pDw6MW_taskList{flex-direction:column;gap:7px;margin:0;padding:0;list-style:none;display:flex}.pDw6MW_taskList li{grid-template-columns:14px minmax(0,1fr) auto;align-items:start;gap:8px;margin:0;display:grid}.pDw6MW_taskList li>span:nth-child(2){overflow-wrap:anywhere;color:var(--dsw-alias-label-primary-dimmed);font-size:12px;line-height:18px}.pDw6MW_taskList small{color:var(--dsw-alias-label-caption);white-space:nowrap;font-size:10px;line-height:18px}.pDw6MW_taskGlyph{border:1px dashed var(--dsw-alias-label-caption);border-radius:999px;width:10px;height:10px;margin-top:4px}.pDw6MW_taskList li[data-status=in_progress] .pDw6MW_taskGlyph{border-style:solid;border-color:var(--dsw-alias-state-business-primary)}.pDw6MW_taskList li[data-status=completed] .pDw6MW_taskGlyph{border-style:solid;border-color:var(--dsw-alias-state-success-primary);background:var(--dsw-alias-state-success-primary)}.pDw6MW_strategy{color:var(--dsw-alias-label-primary-dimmed);white-space:pre-wrap;margin:0;font-family:inherit;font-size:12px;line-height:19px;overflow:auto}.pDw6MW_history{flex-direction:column;gap:8px;margin:0;padding:0;list-style:none;display:flex}.pDw6MW_history li{grid-template-columns:54px minmax(0,1fr);gap:2px 10px;min-width:0;display:grid}.pDw6MW_history time{color:var(--dsw-alias-label-caption);font-variant-numeric:tabular-nums;font-size:10px;line-height:18px}.pDw6MW_history>li>span{color:var(--dsw-alias-label-secondary);font-size:12px;font-weight:500;line-height:18px}.pDw6MW_history p{overflow-wrap:anywhere;color:var(--dsw-alias-label-tertiary);grid-column:2;margin:0;font-size:11px;line-height:17px}@media (width<=680px){.pDw6MW_tokenLabel,.pDw6MW_verifierCompact,.pDw6MW_chevron{display:none}.pDw6MW_dialog{width:min(100%,100vw - 16px);max-height:calc(100vh - 16px)}.pDw6MW_metrics{grid-template-columns:repeat(2,minmax(0,1fr))}.pDw6MW_metrics>div:nth-child(3){border-left:0;border-top:1px solid var(--dsw-alias-border-l1)}.pDw6MW_metrics>div:nth-child(4){border-top:1px solid var(--dsw-alias-border-l1)}.pDw6MW_planGrid{grid-template-columns:minmax(0,1fr)}.pDw6MW_fullWidth{grid-column:auto}}@media (prefers-reduced-motion:reduce){.pDw6MW_dockBudget>span,.pDw6MW_budgetTrack>span{transition:none}}";
		const tagId$1 = "dsh-grok-goals/GrokGoalDock.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$1) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "dsh-grok-goals";
			tag.dataset.pluginCss = tagId$1;
			tag.textContent = css$1;
			document.head.appendChild(tag);
		}
		var GrokGoalDock_module_css_default = {
			"activityLabel": "pDw6MW_activityLabel",
			"bar": "pDw6MW_bar",
			"budgetBlock": "pDw6MW_budgetBlock",
			"budgetTrack": "pDw6MW_budgetTrack",
			"chevron": "pDw6MW_chevron",
			"confirmBanner": "pDw6MW_confirmBanner",
			"detailRoot": "pDw6MW_detailRoot",
			"dialog": "pDw6MW_dialog",
			"dialogContent": "pDw6MW_dialogContent",
			"dock": "pDw6MW_dock",
			"dockBudget": "pDw6MW_dockBudget",
			"empty": "pDw6MW_empty",
			"errorBanner": "pDw6MW_errorBanner",
			"fullWidth": "pDw6MW_fullWidth",
			"gapList": "pDw6MW_gapList",
			"goalGlyph": "pDw6MW_goalGlyph",
			"hero": "pDw6MW_hero",
			"heroMeta": "pDw6MW_heroMeta",
			"history": "pDw6MW_history",
			"iconButton": "pDw6MW_iconButton",
			"inlineError": "pDw6MW_inlineError",
			"label": "pDw6MW_label",
			"metrics": "pDw6MW_metrics",
			"nextStep": "pDw6MW_nextStep",
			"objective": "pDw6MW_objective",
			"pausePanel": "pDw6MW_pausePanel",
			"planGrid": "pDw6MW_planGrid",
			"section": "pDw6MW_section",
			"statusChip": "pDw6MW_statusChip",
			"statusDot": "pDw6MW_statusDot",
			"strategy": "pDw6MW_strategy",
			"summary": "pDw6MW_summary",
			"summaryButton": "pDw6MW_summaryButton",
			"taskGlyph": "pDw6MW_taskGlyph",
			"taskList": "pDw6MW_taskList",
			"tokenLabel": "pDw6MW_tokenLabel",
			"verificationList": "pDw6MW_verificationList",
			"verifierCompact": "pDw6MW_verifierCompact"
		};
		//#endregion
		//#region src/client/GrokGoalDock.tsx
		const STATUS_LABELS = {
			active: "status.active",
			user_paused: "status.user_paused",
			back_off_paused: "status.back_off_paused",
			no_progress_paused: "status.no_progress_paused",
			infra_paused: "status.infra_paused",
			blocked: "status.blocked",
			budget_limited: "status.budget_limited",
			complete: "status.complete"
		};
		const ACTIVITY_LABELS = {
			idle: "activity.idle",
			planning: "activity.planning",
			working: "activity.working",
			evaluating: "activity.evaluating",
			verifying: "activity.verifying",
			strategizing: "activity.strategizing",
			summarizing: "activity.summarizing"
		};
		const TODO_LABELS = {
			pending: "todo.pending",
			in_progress: "todo.in_progress",
			completed: "todo.completed"
		};
		const HISTORY_LABELS = {
			created: "history.created",
			planning_started: "history.planning_started",
			planning_completed: "history.planning_completed",
			planning_failed: "history.planning_failed",
			worker_round_completed: "history.worker_round_completed",
			evaluation_started: "history.evaluation_started",
			evaluation_continued: "history.evaluation_continued",
			evaluation_blocked: "history.evaluation_blocked",
			verification_started: "history.verification_started",
			verification_refuted: "history.verification_refuted",
			strategist_completed: "history.strategist_completed",
			paused: "history.paused",
			resumed: "history.resumed",
			completed: "history.completed",
			budget_exceeded: "history.budget_exceeded",
			summary_completed: "history.summary_completed",
			cleared: "history.cleared"
		};
		function isPaused(status) {
			return status === "user_paused" || status === "back_off_paused" || status === "no_progress_paused" || status === "infra_paused" || status === "blocked";
		}
		function formatTokens(tokens, locale) {
			return new Intl.NumberFormat(locale, {
				notation: tokens >= 1e3 ? "compact" : "standard",
				maximumFractionDigits: tokens >= 1e4 ? 0 : 1
			}).format(tokens);
		}
		function formatElapsed(ms) {
			const seconds = Math.max(0, Math.floor(ms / 1e3));
			if (seconds < 60) return `${seconds}s`;
			const minutes = Math.floor(seconds / 60);
			if (minutes < 60) return `${minutes}m ${seconds % 60}s`;
			return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
		}
		function useCurrentTime(active) {
			const [now, setNow] = (0, react.useState)(() => Date.now());
			(0, react.useEffect)(() => {
				if (!active) return void 0;
				const timer = window.setInterval(() => {
					setNow(Date.now());
				}, 1e3);
				return () => {
					window.clearInterval(timer);
				};
			}, [active]);
			return now;
		}
		function useGrokGoal(sessionId, loadGoal) {
			const [goal, setGoal] = (0, react.useState)(null);
			const loadGoalRef = (0, react.useRef)(loadGoal);
			(0, react.useEffect)(() => {
				loadGoalRef.current = loadGoal;
			}, [loadGoal]);
			const refresh = (0, react.useCallback)(async () => {
				const next = await loadGoalRef.current();
				setGoal(next);
				return next;
			}, []);
			(0, react.useEffect)(() => {
				let disposed = false;
				let running = false;
				setGoal(null);
				const tick = async () => {
					if (disposed || running) return;
					running = true;
					try {
						const next = await loadGoalRef.current();
						if (!disposed) setGoal(next);
					} catch {} finally {
						running = false;
					}
				};
				tick();
				const timer = window.setInterval(() => {
					tick();
				}, 500);
				return () => {
					disposed = true;
					window.clearInterval(timer);
				};
			}, [sessionId]);
			return {
				goal,
				refresh
			};
		}
		function effectiveElapsed(goal, now) {
			return goal.elapsedMs + (goal.activeSince === null ? 0 : Math.max(0, now - goal.activeSince));
		}
		function verifierLabel(goal, t) {
			if (goal.lastVerifierVerdict === null) return t("verifier.none");
			return t(goal.lastVerifierVerdict === "achieved" ? "verifier.achieved" : "verifier.not_achieved");
		}
		function displayedStatusKey(goal) {
			if (goal.status === "active") return ACTIVITY_LABELS[goal.activity];
			return STATUS_LABELS[goal.status];
		}
		function taskStatus(task, todos) {
			return todos.find((todo) => todo.content.trim() === task.trim())?.status ?? "pending";
		}
		function GoalDetail({ goal, todos, open, pending, actionError, confirmClear, onClose, onPauseResume, onStartClear, onCancelClear, onConfirmClear, locale, t }) {
			const detailRef = (0, react.useRef)(null);
			const elapsed = effectiveElapsed(goal, useCurrentTime(open && goal.status === "active"));
			(0, react.useEffect)(() => {
				if (!open) return;
				const detail = detailRef.current;
				if (detail === null) return;
				if (detail.parentElement !== null) detail.parentElement.scrollTop = 0;
				detail.focus({ preventScroll: true });
			}, [open]);
			const verifierCap = goal.classifierMaxRuns + goal.strategistCapBonus;
			const budgetPercent = goal.tokenBudget === null ? null : Math.min(100, Math.max(0, goal.tokensUsedHighWater / goal.tokenBudget * 100));
			const canPauseResume = goal.status === "active" || isPaused(goal.status);
			const recentHistory = (0, react.useMemo)(() => [...goal.history].slice(-8).reverse(), [goal.history]);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Modal, {
				open,
				onClose,
				title: t("title"),
				closeLabel: t("action.close"),
				className: GrokGoalDock_module_css_default.dialog,
				contentClassName: GrokGoalDock_module_css_default.dialogContent,
				footer: confirmClear ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
					variant: "outline",
					disabled: pending,
					onClick: onCancelClear,
					children: t("action.cancel")
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
					variant: "primary",
					disabled: pending,
					icon: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconTrashOutline16, { size: 14 }),
					onClick: onConfirmClear,
					children: t("action.confirmClear")
				})] }) : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
					variant: "outline",
					disabled: pending,
					icon: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconTrashOutline16, { size: 14 }),
					onClick: onStartClear,
					children: t("action.clear")
				}), canPauseResume && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
					variant: "primary",
					disabled: pending,
					icon: goal.status === "active" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconPauseOutline16, { size: 14 }) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconPlayOutline16, { size: 14 }),
					onClick: onPauseResume,
					children: t(goal.status === "active" ? "action.pause" : "action.resume")
				})] }),
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					ref: detailRef,
					className: GrokGoalDock_module_css_default.detailRoot,
					tabIndex: -1,
					"aria-busy": pending,
					children: [
						actionError !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: GrokGoalDock_module_css_default.errorBanner,
							role: "alert",
							children: actionError
						}),
						confirmClear && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: GrokGoalDock_module_css_default.confirmBanner,
							role: "group",
							"aria-label": t("clear.title"),
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: t("clear.title") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("clear.description") })]
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
							className: GrokGoalDock_module_css_default.hero,
							"data-ud-check": "goal-objective",
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: GrokGoalDock_module_css_default.heroMeta,
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
										className: GrokGoalDock_module_css_default.statusChip,
										"data-status": goal.status,
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
											className: GrokGoalDock_module_css_default.statusDot,
											"aria-hidden": true
										}), t(STATUS_LABELS[goal.status])]
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: GrokGoalDock_module_css_default.activityLabel,
										children: t(ACTIVITY_LABELS[goal.activity])
									})]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h3", { children: goal.objective }),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", { children: t("engine.note") })
							]
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("dl", {
							className: GrokGoalDock_module_css_default.metrics,
							"data-ud-check": "goal-metrics",
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("dt", { children: t("metric.tokens") }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("dd", { children: [formatTokens(goal.tokensUsedHighWater, locale), goal.tokenBudget === null ? "" : ` / ${formatTokens(goal.tokenBudget, locale)}`] })] }),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("dt", { children: t("metric.elapsed") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("dd", { children: formatElapsed(elapsed) })] }),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("dt", { children: t("metric.workerRounds") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("dd", { children: goal.totalWorkerRounds })] }),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("dt", { children: t("metric.verifier") }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("dd", { children: [
									verifierLabel(goal, t),
									" · ",
									goal.classifierRunsAttempted,
									"/",
									verifierCap
								] })] })
							]
						}),
						budgetPercent !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: GrokGoalDock_module_css_default.budgetBlock,
							"aria-label": `${t("metric.tokens")}: ${Math.round(budgetPercent)}%`,
							children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: GrokGoalDock_module_css_default.budgetTrack,
								children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { style: { width: `${budgetPercent}%` } })
							})
						}),
						goal.pauseMessage !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
							className: GrokGoalDock_module_css_default.pausePanel,
							"data-ud-check": "goal-pause-reason",
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: t(STATUS_LABELS[goal.status]) }),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", { children: goal.pauseMessage }),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("pause.hint") })
							]
						}),
						goal.nextStep !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
							className: GrokGoalDock_module_css_default.section,
							"data-ud-check": "goal-next-step",
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h4", { children: t("section.nextStep") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
								className: GrokGoalDock_module_css_default.nextStep,
								children: goal.nextStep
							})]
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
							className: GrokGoalDock_module_css_default.section,
							"data-ud-check": "goal-plan",
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h4", { children: t("section.plan") }), goal.plan === null ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
								className: GrokGoalDock_module_css_default.empty,
								children: t("empty.plan")
							}) : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: GrokGoalDock_module_css_default.planGrid,
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h5", { children: t("section.criteria") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("ol", { children: goal.plan.acceptanceCriteria.map((item) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("li", { children: item }, item)) })] }),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h5", { children: t("section.verification") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("ul", {
										className: GrokGoalDock_module_css_default.verificationList,
										children: goal.plan.verificationPlan.map((item) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
											"data-kind": item.classification,
											children: t(item.classification === "gating" ? "verification.gating" : "verification.evidence")
										}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", { children: item.step })] }, `${item.classification}:${item.step}`))
									})] }),
									goal.plan.approach.length > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h5", { children: t("section.approach") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("ol", { children: goal.plan.approach.map((item) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("li", { children: item }, item)) })] }),
									goal.plan.assumedScope.length > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h5", { children: t("section.assumptions") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("ul", { children: goal.plan.assumedScope.map((item) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("li", { children: item }, item)) })] }),
									goal.plan.nonGoals.length > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h5", { children: t("section.nonGoals") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("ul", { children: goal.plan.nonGoals.map((item) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("li", { children: item }, item)) })] }),
									goal.plan.risks.length > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h5", { children: t("section.risks") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("ul", { children: goal.plan.risks.map((item) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("li", { children: item }, item)) })] }),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: GrokGoalDock_module_css_default.fullWidth,
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h5", { children: t("section.tasks") }), goal.plan.tasks.length === 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
											className: GrokGoalDock_module_css_default.empty,
											children: t("empty.tasks")
										}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("ul", {
											className: GrokGoalDock_module_css_default.taskList,
											children: goal.plan.tasks.map((task) => {
												const status = taskStatus(task, todos);
												return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("li", {
													"data-status": status,
													children: [
														/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
															className: GrokGoalDock_module_css_default.taskGlyph,
															"aria-hidden": true
														}),
														/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: task }),
														/* @__PURE__ */ (0, react_jsx_runtime.jsx)("small", { children: t(TODO_LABELS[status]) })
													]
												}, task);
											})
										})]
									})
								]
							})]
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
							className: GrokGoalDock_module_css_default.section,
							"data-ud-check": "goal-verifier-gaps",
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h4", { children: t("section.gaps") }), goal.lastVerifierGaps.length === 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
								className: GrokGoalDock_module_css_default.empty,
								children: t("empty.gaps")
							}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("ul", {
								className: GrokGoalDock_module_css_default.gapList,
								children: goal.lastVerifierGaps.map((gap) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("li", { children: gap }, gap))
							})]
						}),
						goal.strategy !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
							className: GrokGoalDock_module_css_default.section,
							"data-ud-check": "goal-strategy",
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h4", { children: t("section.strategy") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("pre", {
								className: GrokGoalDock_module_css_default.strategy,
								children: goal.strategy
							})]
						}),
						goal.completionSummary !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
							className: GrokGoalDock_module_css_default.section,
							"data-ud-check": "goal-summary",
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h4", { children: t("section.summary") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
								className: GrokGoalDock_module_css_default.summary,
								children: goal.completionSummary
							})]
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
							className: GrokGoalDock_module_css_default.section,
							"data-ud-check": "goal-history",
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h4", { children: t("section.history") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("ol", {
								className: GrokGoalDock_module_css_default.history,
								children: recentHistory.map((entry, index) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("li", { children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("time", { children: new Date(entry.at).toLocaleTimeString(locale, {
										hour: "2-digit",
										minute: "2-digit"
									}) }),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t(HISTORY_LABELS[entry.type]) }),
									entry.detail !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", { children: entry.detail })
								] }, `${entry.at}:${entry.type}:${index}`))
							})]
						})
					]
				})
			});
		}
		function GrokGoalDock({ useProjection, locale, sessionId, loadGoal, runGoalCommand, t }) {
			const { goal, refresh: refreshGoal } = useGrokGoal(sessionId, loadGoal);
			const todos = useProjection("todos") ?? [];
			const [open, setOpen] = (0, react.useState)(false);
			const [pending, setPending] = (0, react.useState)(false);
			const [actionError, setActionError] = (0, react.useState)(null);
			const [confirmClear, setConfirmClear] = (0, react.useState)(false);
			const pendingRef = (0, react.useRef)(false);
			const summaryButtonRef = (0, react.useRef)(null);
			(0, react.useEffect)(() => {
				setActionError(null);
				setConfirmClear(false);
			}, [goal?.goalId]);
			if (goal === null) return null;
			const budgetPercent = goal.tokenBudget === null ? null : Math.min(100, Math.max(0, goal.tokensUsedHighWater / goal.tokenBudget * 100));
			const paused = isPaused(goal.status);
			const verifierCap = goal.classifierMaxRuns + goal.strategistCapBonus;
			const runAction = async (line, after) => {
				if (pendingRef.current) return;
				pendingRef.current = true;
				setPending(true);
				setActionError(null);
				try {
					const error = await runGoalCommand(line);
					if (error === null) {
						await refreshGoal();
						after?.();
					} else setActionError(error);
				} catch (error) {
					setActionError(error instanceof Error ? error.message : String(error));
				} finally {
					pendingRef.current = false;
					setPending(false);
				}
			};
			const pauseResume = () => {
				runAction(goal.status === "active" ? "/goal pause" : "/goal resume");
			};
			const confirmAndClear = () => {
				runAction("/goal clear", () => {
					setConfirmClear(false);
					setOpen(false);
				});
			};
			const closeDialog = () => {
				setOpen(false);
				setConfirmClear(false);
				window.requestAnimationFrame(() => {
					summaryButtonRef.current?.focus();
				});
			};
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: GrokGoalDock_module_css_default.dock,
				"data-goal-bar": true,
				"data-grok-goal": true,
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: GrokGoalDock_module_css_default.bar,
					"data-status": goal.status,
					children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
							ref: summaryButtonRef,
							type: "button",
							className: GrokGoalDock_module_css_default.summaryButton,
							onClick: () => {
								setOpen(true);
							},
							"aria-label": `${t("action.details")}: ${t(displayedStatusKey(goal))}. ${goal.objective}. ${t("metric.verifier")} ${goal.classifierRunsAttempted} / ${verifierCap}`,
							"aria-haspopup": "dialog",
							"aria-expanded": open,
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: GrokGoalDock_module_css_default.goalGlyph,
									"aria-hidden": true,
									children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconGoalOutline16, { size: 14 })
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: GrokGoalDock_module_css_default.label,
									"aria-live": "polite",
									children: t(displayedStatusKey(goal))
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: GrokGoalDock_module_css_default.objective,
									children: goal.objective
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
									className: GrokGoalDock_module_css_default.tokenLabel,
									children: [formatTokens(goal.tokensUsedHighWater, locale), goal.tokenBudget === null ? "" : ` / ${formatTokens(goal.tokenBudget, locale)}`]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
									className: GrokGoalDock_module_css_default.verifierCompact,
									"aria-hidden": true,
									children: [
										t("metric.verifierShort"),
										" ",
										goal.classifierRunsAttempted,
										"/",
										verifierCap
									]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: GrokGoalDock_module_css_default.chevron,
									"aria-hidden": true,
									children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconChevronDownOutline14, {})
								})
							]
						}),
						(goal.status === "active" || paused) && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Tooltip, {
							label: t(goal.status === "active" ? "action.pause" : "action.resume"),
							side: "bottom",
							delayMs: 500,
							children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: GrokGoalDock_module_css_default.iconButton,
								disabled: pending,
								onClick: pauseResume,
								"aria-label": t(goal.status === "active" ? "action.pause" : "action.resume"),
								children: goal.status === "active" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconPauseOutline16, { size: 14 }) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconPlayOutline16, { size: 14 })
							})
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Tooltip, {
							label: t("action.clear"),
							side: "bottom",
							delayMs: 500,
							children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: GrokGoalDock_module_css_default.iconButton,
								disabled: pending,
								onClick: () => {
									setOpen(true);
									setConfirmClear(true);
								},
								"aria-label": t("action.clear"),
								children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconTrashOutline16, { size: 14 })
							})
						}),
						actionError !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: GrokGoalDock_module_css_default.inlineError,
							role: "alert",
							children: actionError
						}),
						budgetPercent !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: GrokGoalDock_module_css_default.dockBudget,
							"aria-hidden": true,
							children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { style: { width: `${budgetPercent}%` } })
						})
					]
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(GoalDetail, {
					goal,
					todos,
					open,
					pending,
					actionError,
					confirmClear,
					onClose: () => {
						if (confirmClear) setConfirmClear(false);
						else closeDialog();
					},
					onPauseResume: pauseResume,
					onStartClear: () => {
						setConfirmClear(true);
					},
					onCancelClear: () => {
						setConfirmClear(false);
					},
					onConfirmClear: confirmAndClear,
					locale,
					t
				})]
			});
		}
		//#endregion
		//#region \0dshx-css-module:GrokGoalSettings.module.css.mjs
		const css = ".Uur_Ya_card{border:.5px solid var(--dsw-alias-border-l4);background:var(--dsw-alias-bg-layer-3);border-radius:16px;list-style:none;transition:border-color .16s,background .16s}.Uur_Ya_card:hover{border-color:var(--dsw-alias-label-dimmed)}.Uur_Ya_cardOpen{background:var(--dsw-alias-bg-layer-2);border-color:var(--dsw-alias-label-dimmed)}.Uur_Ya_header{appearance:none;width:100%;font:inherit;color:inherit;text-align:left;cursor:pointer;background:0 0;border:0;border-radius:12px;align-items:center;gap:12px;padding:14px 16px;display:flex}.Uur_Ya_header:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:-2px}.Uur_Ya_headText{flex-direction:column;flex:1;gap:4px;min-width:0;display:flex}.Uur_Ya_name{color:var(--dsw-alias-label-primary);font-size:15px;font-weight:600;line-height:1.4}.Uur_Ya_description{color:var(--dsw-alias-label-tertiary);font-size:13px;line-height:1.5}.Uur_Ya_chevron{color:var(--dsw-alias-label-tertiary);flex:none;transition:transform .16s}.Uur_Ya_chevronOpen{transform:rotate(180deg)}.Uur_Ya_body{border-top:.5px solid var(--dsw-alias-border-l2);margin:0 16px;padding-bottom:8px}.Uur_Ya_readOnly{color:var(--dsw-alias-label-tertiary);margin:12px 0 0;font-size:12px;line-height:1.5}.Uur_Ya_pending{white-space:nowrap;background:var(--dsw-alias-bg-module-platform);color:var(--dsw-alias-label-secondary);border-radius:999px;flex:none;padding:1px 8px;font-size:11px;font-weight:500;line-height:17px}.Uur_Ya_footer{border-top:.5px solid var(--dsw-alias-border-l2);justify-content:flex-end;align-items:center;gap:8px;padding:12px 0 4px;display:flex}.Uur_Ya_failed{min-width:0;color:var(--dsw-alias-label-error);flex:1;margin:0;font-size:12px;line-height:1.5}.Uur_Ya_discard,.Uur_Ya_save{appearance:none;font:inherit;cursor:pointer;border:1px solid #0000;border-radius:8px;padding:5px 14px;font-size:13px;line-height:1.5}.Uur_Ya_discard{border-color:var(--dsw-alias-border-l2);color:var(--dsw-alias-label-secondary);background:0 0}.Uur_Ya_discard:hover:not(:disabled){color:var(--dsw-alias-label-primary);border-color:var(--dsw-alias-label-dimmed)}.Uur_Ya_save{background:var(--dsw-alias-label-primary);color:var(--dsw-alias-bg-layer-3)}.Uur_Ya_discard:disabled,.Uur_Ya_save:disabled{opacity:.4;cursor:default}.Uur_Ya_field{flex-direction:column;gap:6px;padding:12px 0;display:flex}.Uur_Ya_field+.Uur_Ya_field{border-top:.5px solid var(--dsw-alias-border-l2)}.Uur_Ya_head{align-items:center;gap:8px;display:flex}.Uur_Ya_label{min-width:0;color:var(--dsw-alias-label-primary);flex:1;font-size:13px;font-weight:500;line-height:1.5}.Uur_Ya_input{border:.5px solid var(--dsw-alias-border-l4);background:var(--dsw-alias-bg-layer-3);height:34px;font:inherit;color:var(--dsw-alias-label-primary);border-radius:8px;padding:0 12px;font-size:13px;line-height:1.5}.Uur_Ya_input:focus-visible{border-color:var(--dsw-alias-brand-primary);outline:none}.Uur_Ya_input:disabled{color:var(--dsw-alias-label-tertiary);cursor:default}.Uur_Ya_inputInvalid{border:.5px solid var(--dsw-alias-label-error);background:var(--dsw-alias-bg-layer-3);height:34px;font:inherit;color:var(--dsw-alias-label-primary);border-radius:8px;padding:0 12px;font-size:13px;line-height:1.5}.Uur_Ya_hint{color:var(--dsw-alias-label-tertiary);margin:0;font-size:12px;line-height:1.5}.Uur_Ya_invalid{color:var(--dsw-alias-label-error);margin:0;font-size:12px;line-height:1.5}.Uur_Ya_toggle{width:17px;height:17px;accent-color:var(--dsw-alias-brand-primary)}";
		const tagId = "dsh-grok-goals/GrokGoalSettings.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "dsh-grok-goals";
			tag.dataset.pluginCss = tagId;
			tag.textContent = css;
			document.head.appendChild(tag);
		}
		var GrokGoalSettings_module_css_default = {
			"body": "Uur_Ya_body",
			"card": "Uur_Ya_card",
			"cardOpen": "Uur_Ya_cardOpen",
			"chevron": "Uur_Ya_chevron",
			"chevronOpen": "Uur_Ya_chevronOpen",
			"description": "Uur_Ya_description",
			"discard": "Uur_Ya_discard",
			"failed": "Uur_Ya_failed",
			"field": "Uur_Ya_field",
			"footer": "Uur_Ya_footer",
			"head": "Uur_Ya_head",
			"header": "Uur_Ya_header",
			"headText": "Uur_Ya_headText",
			"hint": "Uur_Ya_hint",
			"input": "Uur_Ya_input",
			"inputInvalid": "Uur_Ya_inputInvalid",
			"invalid": "Uur_Ya_invalid",
			"label": "Uur_Ya_label",
			"name": "Uur_Ya_name",
			"pending": "Uur_Ya_pending",
			"readOnly": "Uur_Ya_readOnly",
			"save": "Uur_Ya_save",
			"toggle": "Uur_Ya_toggle"
		};
		//#endregion
		//#region src/client/GrokGoalSettings.tsx
		function copy(locale) {
			return locale.startsWith("zh") ? {
				title: "Grok Goals",
				description: "新建 Goal 的默认 token 预算。",
				expand: "展开",
				collapse: "收起",
				unsaved: "未保存",
				readOnly: "当前连接不能改这些设置。",
				unlimited: "默认不限制 token",
				unlimitedHint: "关掉后，新建 Goal 才用下面的上限。",
				defaultBudget: "默认 token 上限",
				defaultBudgetHint: "/goal --budget 仍只覆盖这一次。",
				classifierMaxRuns: "验证尝试上限",
				classifierHint: "完成前最多跑几轮对抗验证。",
				verifierCount: "对抗验证器数量",
				verifierHint: "1 到 5。",
				strategistEvery: "strategist 间隔",
				strategistHint: "连续未通过这么多次后再请 strategist。",
				invalidBudget: "请输入大于 0 的整数。",
				discard: "放弃",
				save: "保存",
				saving: "保存中",
				saveFailed: "保存失败，请再试一次。"
			} : {
				title: "Grok Goals",
				description: "Default token budget for new goals.",
				expand: "Expand",
				collapse: "Collapse",
				unsaved: "Unsaved",
				readOnly: "This connection cannot change these settings.",
				unlimited: "Unlimited tokens by default",
				unlimitedHint: "The cap below applies only after this is turned off.",
				defaultBudget: "Default token cap",
				defaultBudgetHint: "/goal --budget still overrides one goal.",
				classifierMaxRuns: "Verifier attempt cap",
				classifierHint: "How many adversarial verifier rounds may run before completion.",
				verifierCount: "Adversarial verifier count",
				verifierHint: "From 1 through 5.",
				strategistEvery: "Strategist interval",
				strategistHint: "Ask the strategist after this many consecutive misses.",
				invalidBudget: "Enter an integer greater than 0.",
				discard: "Discard",
				save: "Save",
				saving: "Saving",
				saveFailed: "Save failed. Try again."
			};
		}
		function parsePositiveInt(raw) {
			const trimmed = raw.trim();
			if (!/^\d+$/.test(trimmed)) return null;
			const value = Number(trimmed);
			return Number.isSafeInteger(value) && value > 0 ? value : null;
		}
		function draftFrom(settings) {
			return {
				unlimited: settings.unlimitedTokenBudget !== false,
				defaultTokenBudget: String(settings.defaultTokenBudget ?? 2e5),
				classifierMaxRuns: String(settings.classifierMaxRuns ?? 10),
				verifierCount: String(settings.verifierCount ?? 3),
				strategistEvery: String(settings.strategistEvery ?? 5)
			};
		}
		function GrokGoalSettingsCard(props) {
			const scope = props.scope;
			const locale = props.locale ?? "en";
			if (scope === void 0) return null;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(LoadedCard, {
				scope,
				locale
			});
		}
		function LoadedCard({ scope, locale }) {
			const text = copy(locale);
			const snapshot = (0, react.useSyncExternalStore)((listener) => scope.subscribe(listener), () => scope.getSnapshot());
			const settings = snapshot.value;
			const [open, setOpen] = (0, react.useState)(false);
			const [draft, setDraft] = (0, react.useState)(null);
			const [saving, setSaving] = (0, react.useState)(false);
			const [failed, setFailed] = (0, react.useState)(false);
			(0, react.useEffect)(() => {
				if (settings === void 0) return;
				setDraft(draftFrom(settings));
				setFailed(false);
			}, [settings]);
			if (snapshot.status !== "ready" || settings === void 0 || draft === null) return null;
			const current = draftFrom(settings);
			const dirty = draft.unlimited !== current.unlimited || draft.defaultTokenBudget !== current.defaultTokenBudget || draft.classifierMaxRuns !== current.classifierMaxRuns || draft.verifierCount !== current.verifierCount || draft.strategistEvery !== current.strategistEvery;
			const budget = parsePositiveInt(draft.defaultTokenBudget);
			const classifier = parsePositiveInt(draft.classifierMaxRuns);
			const verifier = parsePositiveInt(draft.verifierCount);
			const strategist = parsePositiveInt(draft.strategistEvery);
			const verifierOk = verifier !== null && verifier <= 5;
			const invalid = !draft.unlimited && budget === null || classifier === null || !verifierOk || strategist === null;
			const disabled = !snapshot.writable || saving;
			const save = async () => {
				if (invalid || !dirty) return;
				setSaving(true);
				setFailed(false);
				try {
					if (draft.unlimited !== current.unlimited) await scope.set("unlimitedTokenBudget", draft.unlimited);
					if (budget !== Number(current.defaultTokenBudget)) await scope.set("defaultTokenBudget", budget);
					if (classifier !== Number(current.classifierMaxRuns)) await scope.set("classifierMaxRuns", classifier);
					if (verifier !== Number(current.verifierCount)) await scope.set("verifierCount", verifier);
					if (strategist !== Number(current.strategistEvery)) await scope.set("strategistEvery", strategist);
				} catch {
					setFailed(true);
				} finally {
					setSaving(false);
				}
			};
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("li", {
				className: open ? `${GrokGoalSettings_module_css_default.card} ${GrokGoalSettings_module_css_default.cardOpen}` : GrokGoalSettings_module_css_default.card,
				"data-ud-check": "grok-goal-settings",
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
					type: "button",
					className: GrokGoalSettings_module_css_default.header,
					"aria-expanded": open,
					"aria-label": `${open ? text.collapse : text.expand}: ${text.title}`,
					onClick: () => {
						setOpen(!open);
					},
					children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
							className: GrokGoalSettings_module_css_default.headText,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: GrokGoalSettings_module_css_default.name,
								children: text.title
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: GrokGoalSettings_module_css_default.description,
								children: text.description
							})]
						}),
						dirty ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: GrokGoalSettings_module_css_default.pending,
							children: text.unsaved
						}) : null,
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconChevronDownOutline14, { className: open ? `${GrokGoalSettings_module_css_default.chevron} ${GrokGoalSettings_module_css_default.chevronOpen}` : GrokGoalSettings_module_css_default.chevron })
					]
				}), open ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: GrokGoalSettings_module_css_default.body,
					children: [
						!snapshot.writable ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
							className: GrokGoalSettings_module_css_default.readOnly,
							role: "status",
							children: text.readOnly
						}) : null,
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: GrokGoalSettings_module_css_default.field,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
								className: GrokGoalSettings_module_css_default.head,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: GrokGoalSettings_module_css_default.label,
									children: text.unlimited
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
									className: GrokGoalSettings_module_css_default.toggle,
									type: "checkbox",
									"data-ud-check": "grok-goal-settings-unlimited",
									checked: draft.unlimited,
									disabled,
									onChange: (event) => {
										setDraft({
											...draft,
											unlimited: event.target.checked
										});
									}
								})]
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
								className: GrokGoalSettings_module_css_default.hint,
								children: text.unlimitedHint
							})]
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)(NumberField, {
							id: "grok-goal-settings-budget",
							label: text.defaultBudget,
							hint: text.defaultBudgetHint,
							invalidLabel: text.invalidBudget,
							value: draft.defaultTokenBudget,
							invalid: budget === null,
							disabled: disabled || draft.unlimited,
							onEdit: (value) => {
								setDraft({
									...draft,
									defaultTokenBudget: value
								});
							}
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)(NumberField, {
							id: "grok-goal-settings-classifier",
							label: text.classifierMaxRuns,
							hint: text.classifierHint,
							invalidLabel: text.invalidBudget,
							value: draft.classifierMaxRuns,
							invalid: classifier === null,
							disabled,
							onEdit: (value) => {
								setDraft({
									...draft,
									classifierMaxRuns: value
								});
							}
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)(NumberField, {
							id: "grok-goal-settings-verifier",
							label: text.verifierCount,
							hint: text.verifierHint,
							invalidLabel: text.invalidBudget,
							value: draft.verifierCount,
							invalid: !verifierOk,
							disabled,
							onEdit: (value) => {
								setDraft({
									...draft,
									verifierCount: value
								});
							}
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)(NumberField, {
							id: "grok-goal-settings-strategist",
							label: text.strategistEvery,
							hint: text.strategistHint,
							invalidLabel: text.invalidBudget,
							value: draft.strategistEvery,
							invalid: strategist === null,
							disabled,
							onEdit: (value) => {
								setDraft({
									...draft,
									strategistEvery: value
								});
							}
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: GrokGoalSettings_module_css_default.footer,
							children: [
								failed ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
									className: GrokGoalSettings_module_css_default.failed,
									role: "status",
									children: text.saveFailed
								}) : null,
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: GrokGoalSettings_module_css_default.discard,
									disabled: !dirty || saving,
									onClick: () => {
										setDraft(current);
										setFailed(false);
									},
									children: text.discard
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: GrokGoalSettings_module_css_default.save,
									disabled: !dirty || invalid || saving || !snapshot.writable,
									onClick: () => {
										save();
									},
									children: saving ? text.saving : text.save
								})
							]
						})
					]
				}) : null]
			});
		}
		function NumberField(props) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: GrokGoalSettings_module_css_default.field,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("label", {
						className: GrokGoalSettings_module_css_default.label,
						htmlFor: props.id,
						children: props.label
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
						id: props.id,
						className: props.invalid ? GrokGoalSettings_module_css_default.inputInvalid : GrokGoalSettings_module_css_default.input,
						type: "text",
						inputMode: "numeric",
						value: props.value,
						disabled: props.disabled,
						"aria-invalid": props.invalid,
						onChange: (event) => {
							props.onEdit(event.target.value);
						}
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: props.invalid ? GrokGoalSettings_module_css_default.invalid : GrokGoalSettings_module_css_default.hint,
						children: props.invalid ? props.invalidLabel : props.hint
					})
				]
			});
		}
		//#endregion
		//#region src/client/locales.ts
		const en = {
			"title": "Goal details",
			"label.goal": "Goal",
			"action.details": "Open goal details",
			"action.pause": "Pause goal",
			"action.resume": "Resume goal",
			"action.clear": "Clear goal",
			"action.cancel": "Cancel",
			"action.confirmClear": "Confirm clear",
			"action.close": "Close",
			"status.active": "Active",
			"status.user_paused": "Paused",
			"status.back_off_paused": "Back-off paused",
			"status.no_progress_paused": "No-progress paused",
			"status.infra_paused": "Infrastructure paused",
			"status.blocked": "Blocked",
			"status.budget_limited": "Budget limited",
			"status.complete": "Complete",
			"activity.idle": "Idle",
			"activity.planning": "Planning…",
			"activity.working": "Executing",
			"activity.evaluating": "Evaluating…",
			"activity.verifying": "Verifying…",
			"activity.strategizing": "Strategizing…",
			"activity.summarizing": "Summarizing…",
			"metric.tokens": "Tokens",
			"metric.elapsed": "Elapsed",
			"metric.workerRounds": "Worker rounds",
			"metric.verifier": "Verifier",
			"metric.verifierShort": "V",
			"section.nextStep": "Next step",
			"section.plan": "Frozen plan",
			"section.criteria": "Acceptance criteria",
			"section.verification": "Verification plan",
			"section.tasks": "Task checklist",
			"section.approach": "Implementation approach",
			"section.assumptions": "Assumed scope",
			"section.nonGoals": "Non-goals",
			"section.risks": "Risks and contradictions",
			"section.gaps": "Verifier gaps",
			"section.strategy": "Strategist note",
			"section.history": "Recent history",
			"section.summary": "Completion summary",
			"empty.plan": "The planner has not produced a contract yet.",
			"empty.gaps": "No outstanding verifier gaps.",
			"empty.tasks": "No implementation checklist for this goal kind.",
			"pause.hint": "Use Resume after the blocking condition or implementation strategy changes.",
			"clear.title": "Clear this goal?",
			"clear.description": "This removes the current Grok goal state and stops automatic continuation. The conversation and workspace files are not deleted.",
			"verifier.none": "Not run",
			"verifier.achieved": "Accepted",
			"verifier.not_achieved": "Refuted",
			"verification.gating": "Gating",
			"verification.evidence": "Evidence",
			"todo.pending": "Pending",
			"todo.in_progress": "In progress",
			"todo.completed": "Completed",
			"history.created": "Created",
			"history.planning_started": "Planning started",
			"history.planning_completed": "Planning completed",
			"history.planning_failed": "Planning failed",
			"history.worker_round_completed": "Worker round completed",
			"history.evaluation_started": "Evaluation started",
			"history.evaluation_continued": "Work continued",
			"history.evaluation_blocked": "Blocker observed",
			"history.verification_started": "Verification started",
			"history.verification_refuted": "Verification refuted",
			"history.strategist_completed": "Strategy updated",
			"history.paused": "Paused",
			"history.resumed": "Resumed",
			"history.completed": "Completed",
			"history.budget_exceeded": "Budget reached",
			"history.summary_completed": "Summary written",
			"history.cleared": "Cleared",
			"engine.note": "The worker cannot self-complete this goal. The host evaluator and adversarial verifier decide."
		};
		const zh = {
			"title": "目标详情",
			"label.goal": "目标",
			"action.details": "打开目标详情",
			"action.pause": "暂停目标",
			"action.resume": "继续目标",
			"action.clear": "清除目标",
			"action.cancel": "取消",
			"action.confirmClear": "确认清除",
			"action.close": "关闭",
			"status.active": "进行中",
			"status.user_paused": "已暂停",
			"status.back_off_paused": "退避暂停",
			"status.no_progress_paused": "无进展暂停",
			"status.infra_paused": "基础设施暂停",
			"status.blocked": "受阻",
			"status.budget_limited": "预算已用尽",
			"status.complete": "已完成",
			"activity.idle": "空闲",
			"activity.planning": "规划中…",
			"activity.working": "执行中",
			"activity.evaluating": "评估中…",
			"activity.verifying": "验证中…",
			"activity.strategizing": "调整策略中…",
			"activity.summarizing": "总结中…",
			"metric.tokens": "令牌",
			"metric.elapsed": "耗时",
			"metric.workerRounds": "执行轮次",
			"metric.verifier": "验证器",
			"metric.verifierShort": "验",
			"section.nextStep": "下一步",
			"section.plan": "冻结计划",
			"section.criteria": "验收标准",
			"section.verification": "验证计划",
			"section.tasks": "任务清单",
			"section.approach": "实现路径",
			"section.assumptions": "范围假设",
			"section.nonGoals": "非目标",
			"section.risks": "风险与矛盾",
			"section.gaps": "验证缺口",
			"section.strategy": "策略建议",
			"section.history": "最近记录",
			"section.summary": "完成摘要",
			"empty.plan": "规划器尚未生成契约。",
			"empty.gaps": "当前没有待解决的验证缺口。",
			"empty.tasks": "这种目标类型没有实现清单。",
			"pause.hint": "解决阻塞条件或调整实现策略后再继续。",
			"clear.title": "清除这个目标？",
			"clear.description": "这会移除当前 Grok 目标状态并停止自动续跑。不会删除对话或工作区文件。",
			"verifier.none": "尚未运行",
			"verifier.achieved": "已通过",
			"verifier.not_achieved": "已驳回",
			"verification.gating": "硬门槛",
			"verification.evidence": "证据",
			"todo.pending": "待处理",
			"todo.in_progress": "进行中",
			"todo.completed": "已完成",
			"history.created": "已创建",
			"history.planning_started": "开始规划",
			"history.planning_completed": "规划完成",
			"history.planning_failed": "规划失败",
			"history.worker_round_completed": "执行轮次完成",
			"history.evaluation_started": "开始评估",
			"history.evaluation_continued": "继续执行",
			"history.evaluation_blocked": "检测到阻塞",
			"history.verification_started": "开始验证",
			"history.verification_refuted": "验证驳回",
			"history.strategist_completed": "策略已更新",
			"history.paused": "已暂停",
			"history.resumed": "已继续",
			"history.completed": "已完成",
			"history.budget_exceeded": "预算已用尽",
			"history.summary_completed": "总结已生成",
			"history.cleared": "已清除",
			"engine.note": "工作模型不能自行宣布完成；由宿主评估器和对抗验证器决定。"
		};
		//#endregion
		//#region src/client/index.tsx
		const NS = "grokGoal";
		const inject = [
			"connection",
			"slots",
			"remote",
			"remote.commands",
			"locale",
			"settingsScope"
		];
		function apply(ctx) {
			ctx.effect(() => ctx.locale.register(NS, {
				zh,
				en
			}), "dsh-grok-goals: dictionaries");
			const goalSettings = ctx.settingsScope.bind({ namespace: GROK_GOAL_SETTINGS_NAMESPACE });
			ctx.slots.inject("settings.plugin.item", () => ctx.slots.register({
				name: "settings.plugin.item",
				key: GROK_GOAL_SETTINGS_NAMESPACE,
				inject: () => ({
					scope: goalSettings,
					locale: ctx.locale.getLocale().active
				})
			}, GrokGoalSettingsCard));
			ctx.slots.inject("conversation.input.dock", () => ctx.slots.register({
				name: "conversation.input.dock",
				id: "goal",
				order: 10,
				priority: -100,
				locale: NS,
				inject: (sessionId) => ({
					locale: ctx.locale.getLocale().active,
					sessionId,
					loadGoal: async () => {
						const connection = ctx.get("connection");
						if (connection === void 0) throw new Error("Grok goal state connection is unavailable.");
						const result = await connection.rpc.call(GROK_GOAL_RPC_CHANNEL, GROK_GOAL_STATE_ENDPOINT, { sessionId });
						if (!result.ok) throw new Error(`${result.error.message} (${result.error.code})`);
						return parseGrokGoalStateResponse(result.value).goal;
					},
					runGoalCommand: async (line) => {
						try {
							const result = await ctx.remote.commands.execute(sessionId, line, []);
							if (!result.ok) return `${result.error.message} (${result.error.code})`;
							if (result.value === void 0) return `Unknown goal command: ${line}`;
							if (result.value.result.kind === "error") return result.value.result.text;
							return null;
						} catch (error) {
							return error instanceof Error ? error.message : String(error);
						}
					}
				})
			}, GrokGoalDock));
		}
		//#endregion
		exports.GrokGoalDock = GrokGoalDock;
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map