import React, { useState, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight, BrainCircuit, Download, FileJson, Gauge, Radar,
  ShieldCheck, Sparkles, Zap, Upload, FileSpreadsheet, FileText,
  Wifi, WifiOff, Loader2, AlertCircle, Newspaper,
  User, LogOut, Clock, X, Eye, EyeOff,
} from "lucide-react";
import { BackgroundBeams, FloatingNav, LampHeader, SparklesCore, Spotlight, TextGenerateEffect } from "./components";
import {
  dashboardData, fetchBatchAnalysis, fetchSingleAnalysis,
  downloadExportCSV, downloadExportExcel,
  getToken, setToken, getUser, setUser, logout,
  apiRegister, apiLogin, apiSaveResume, apiLoadResume, apiGetHistory,
} from "./data";
import "./styles.css";

const navItems = [
  { name: "首页", href: "#hero" },
  { name: "上传分析", href: "#upload" },
  { name: "能力", href: "#features" },
  { name: "岗位", href: "#jobs" },
  { name: "流程", href: "#pipeline" },
];

function MetricCard({ metric, index }: { metric: { label: string; value: string; delta: string; tone: string }; index: number }) {
  return (
    <Spotlight className="metric-card">
      <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.08 }}>
        <p>{metric.label}</p>
        <strong>{metric.value}</strong>
        <span className={`tone-${metric.tone}`}>{metric.delta}</span>
      </motion.div>
    </Spotlight>
  );
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/* ── Login / Register Modal ──────────────────────────────────────────────── */

function AuthModal({ onClose, onAuth }: { onClose: () => void; onAuth: (user: any) => void }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = isLogin ? await apiLogin(username, password) : await apiRegister(username, password);
      setToken(data.token);
      setUser(data.user);
      onAuth(data.user);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div className="modal-content" initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}><X size={18} /></button>
        <h2 style={{ margin: "0 0 8px", color: "#e2e8f0", fontSize: 22 }}>{isLogin ? "登录" : "注册"}</h2>
        <p style={{ margin: "0 0 24px", color: "#64748b", fontSize: 13 }}>
          {isLogin ? "登录后可保存简历和分析历史" : "创建账号，开始你的 AI 求职之旅"}
        </p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ fontSize: 13, color: "#94a3b8", marginBottom: 6, display: "block" }}>用户名</label>
            <input
              value={username} onChange={(e) => setUsername(e.target.value)}
              placeholder="输入用户名"
              required minLength={2}
              style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(0,0,0,0.3)", color: "#e2e8f0", fontSize: 14, outline: "none", boxSizing: "border-box" }}
            />
          </div>
          <div>
            <label style={{ fontSize: 13, color: "#94a3b8", marginBottom: 6, display: "block" }}>密码</label>
            <div style={{ position: "relative" }}>
              <input
                type={showPw ? "text" : "password"}
                value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="输入密码"
                required minLength={4}
                style={{ width: "100%", padding: "10px 40px 10px 14px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(0,0,0,0.3)", color: "#e2e8f0", fontSize: 14, outline: "none", boxSizing: "border-box" }}
              />
              <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#64748b", cursor: "pointer", padding: 4 }}>
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && <div style={{ color: "#f87171", fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}><AlertCircle size={14} /> {error}</div>}

          <button type="submit" disabled={loading} className="primary-btn" style={{ opacity: loading ? 0.6 : 1, marginTop: 8 }}>
            {loading ? <><Loader2 size={16} className="animate-spin" /> 处理中...</> : isLogin ? "登录" : "注册"}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: 16, fontSize: 13, color: "#64748b" }}>
          {isLogin ? "没有账号？" : "已有账号？"}
          <button onClick={() => { setIsLogin(!isLogin); setError(null); }} style={{ background: "none", border: "none", color: "#818cf8", cursor: "pointer", marginLeft: 4, fontSize: 13 }}>
            {isLogin ? "注册" : "登录"}
          </button>
        </p>
      </motion.div>
    </motion.div>
  );
}

/* ── History Panel ───────────────────────────────────────────────────────── */

function HistoryPanel({ onClose }: { onClose: () => void }) {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGetHistory().then((h) => { setHistory(h); setLoading(false); });
  }, []);

  return (
    <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div className="modal-content" style={{ maxWidth: 600, maxHeight: "80vh", overflowY: "auto" }} initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}><X size={18} /></button>
        <h2 style={{ margin: "0 0 16px", color: "#e2e8f0", fontSize: 20 }}><Clock size={18} style={{ verticalAlign: -3, marginRight: 8 }} />分析历史</h2>

        {loading ? (
          <div style={{ textAlign: "center", padding: 40, color: "#64748b" }}><Loader2 size={24} className="animate-spin" /></div>
        ) : history.length === 0 ? (
          <p style={{ color: "#64748b", textAlign: "center", padding: 40 }}>暂无分析记录</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {history.map((h: any) => (
              <div key={h.id} style={{ padding: 16, borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontSize: 13, color: "#818cf8", fontWeight: 600 }}>{h.mode === "batch" ? "批量分析" : "单条分析"}</span>
                  <span style={{ fontSize: 12, color: "#475569" }}>{h.created_at}</span>
                </div>
                {h.mode === "batch" && h.result_data?.stats && (
                  <div style={{ fontSize: 13, color: "#94a3b8" }}>
                    共 {h.result_data.stats.total} 条 · 高优 {h.result_data.stats.high} · 中优 {h.result_data.stats.mid} · 低优 {h.result_data.stats.low}
                  </div>
                )}
                {h.mode === "single" && h.result_data?.match && (
                  <div style={{ fontSize: 13, color: "#94a3b8" }}>
                    匹配度 {h.result_data.match.match_score ?? 0}% · {h.result_data.jd_analysis?.job_title ?? "未知岗位"}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

/* ── Main App ────────────────────────────────────────────────────────────── */

function App() {
  const [apiOnline, setApiOnline] = useState(false);
  const [llmInfo, setLlmInfo] = useState<{ available: boolean; model: string | null }>({ available: false, model: null });
  const [apiData, setApiData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resumeText, setResumeText] = useState("");
  const [jdText, setJdText] = useState("");
  const [mode, setMode] = useState<"batch" | "single">("batch");
  const fileRef = useRef<HTMLInputElement>(null);

  // Auth state
  const [currentUser, setCurrentUser] = useState<any>(getUser());
  const [showAuth, setShowAuth] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    fetch("/api/health")
      .then((r) => r.ok && r.json())
      .then((data) => {
        if (data) {
          setApiOnline(true);
          setLlmInfo({ available: data.llm_available, model: data.model });
        }
      })
      .catch(() => {});
  }, []);

  // Load saved resume when user logs in
  useEffect(() => {
    if (currentUser) {
      apiLoadResume().then((data) => {
        if (data.resume_text) setResumeText(data.resume_text);
      });
    }
  }, [currentUser]);

  // Close user menu on outside click
  useEffect(() => {
    if (!showUserMenu) return;
    const handler = () => setShowUserMenu(false);
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [showUserMenu]);

  function handleLogout() {
    logout();
    setCurrentUser(null);
    setShowUserMenu(false);
  }

  async function handleSaveResume() {
    if (!resumeText.trim()) return;
    try {
      await apiSaveResume(resumeText);
    } catch {}
  }

  async function handleBatchSubmit() {
    const file = fileRef.current?.files?.[0];
    if (!file) { setError("请选择 CSV 文件"); return; }
    if (!resumeText.trim()) { setError("请输入简历内容"); return; }
    setError(null); setLoading(true);
    try {
      const result = await fetchBatchAnalysis(file, resumeText);
      if (result.error) { setError(result.error); return; }
      const rows = result.rows ?? [];
      const stats = result.stats ?? {};
      setApiData({
        jobs: rows.map((r: any) => ({
          title: r.job_title ?? "未知岗位",
          company: r.company ?? "",
          city: r.city ?? "",
          salary: r.salary ?? "",
          score: r.match_score ?? 0,
          priority: r.priority ?? "低",
          type: r.job_type ?? "",
          skills: [...(r.matched_skills ?? []), ...(r.missing_skills ?? [])].slice(0, 5),
        })),
        skillGaps: (result.missing_skills ?? []).map((s: any) => ({
          name: s.skill ?? s.name ?? "",
          count: s.count ?? 0,
        })),
        metrics: [
          { label: "岗位样本", value: String(stats.total ?? rows.length), delta: `共 ${stats.total ?? rows.length} 条`, tone: "cyan" },
          { label: "高优先级", value: String(stats.high ?? 0), delta: "建议先投", tone: "emerald" },
          { label: "中优先级", value: String(stats.mid ?? 0), delta: "可选投递", tone: "violet" },
          { label: "低优先级", value: String(stats.low ?? 0), delta: "暂不优先", tone: "amber" },
        ],
        report: result.report ?? null,
        _rawRows: rows,
        _rawMissing: result.missing_skills ?? [],
      });
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }

  async function handleSingleSubmit() {
    if (!resumeText.trim() || !jdText.trim()) { setError("请输入简历和 JD 内容"); return; }
    setError(null); setLoading(true);
    try {
      const result = await fetchSingleAnalysis(resumeText, jdText);
      const jd = result.jd_analysis ?? {};
      const match = result.match ?? {};
      setApiData({
        jobs: [{
          title: jd.job_title ?? "待分析岗位",
          company: "", city: "", salary: "",
          score: match.match_score ?? 0,
          priority: (match.match_score ?? 0) >= 70 ? "高" : ((match.match_score ?? 0) >= 50 ? "中" : "低"),
          type: "",
          skills: [...(jd.required_skills ?? []), ...(match.missing_skills ?? [])].slice(0, 5),
        }],
        skillGaps: (match.missing_skills ?? []).map((s: string) => ({ name: s, count: 1 })),
        metrics: [
          { label: "匹配度", value: `${match.match_score ?? 0}%`, delta: match.recommendation ?? "", tone: "cyan" },
          { label: "已匹配", value: String((match.matched_skills ?? []).length), delta: "技能", tone: "emerald" },
          { label: "缺失", value: String((match.missing_skills ?? []).length), delta: "需补充", tone: "amber" },
          { label: "难度", value: `${jd.difficulty ?? 0}`, delta: jd.suitable_for_fresh_graduate ? "适合应届" : "需经验", tone: "violet" },
        ],
        report: result.questions ?? null,
        _rawRows: [], _rawMissing: [],
      });
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }

  async function handleExportCSV() {
    const rows = apiData?._rawRows ?? apiData?.jobs ?? dashboardData.jobs;
    try { const blob = await downloadExportCSV(rows); downloadBlob(blob, "job_rankings.csv"); } catch (e: any) { setError(e.message); }
  }

  async function handleExportExcel() {
    const rows = apiData?._rawRows ?? apiData?.jobs ?? dashboardData.jobs;
    const gaps = apiData?._rawMissing ?? apiData?.skillGaps ?? dashboardData.skillGaps;
    try { const blob = await downloadExportExcel(rows, gaps); downloadBlob(blob, "job_rankings.xlsx"); } catch (e: any) { setError(e.message); }
  }

  const data = apiData ?? dashboardData;
  const displayMetrics = apiData?.metrics ?? dashboardData.metrics;
  const displayJobs = apiData?.jobs ?? dashboardData.jobs;
  const displaySkillGaps = apiData?.skillGaps ?? dashboardData.skillGaps;
  const displayFeatures = dashboardData.features;
  const displayPipeline = dashboardData.pipeline;

  return (
    <main>
      <BackgroundBeams />
      <SparklesCore />
      <FloatingNav items={navItems} />

      {/* ── Top-right status bar ── */}
      <div style={{ position: "fixed", top: 16, right: 16, zIndex: 9999, display: "flex", alignItems: "center", gap: 8 }}>
        {/* API + LLM status */}
        <div className="status-badge" style={{ position: "static" }}>
          {apiOnline ? <Wifi size={13} /> : <WifiOff size={13} />}
          <span style={{ color: apiOnline ? (llmInfo.available ? "var(--accent)" : "var(--amber)") : "var(--rose)" }}>
            {apiOnline ? (llmInfo.available ? `LLM: ${llmInfo.model}` : "规则模式") : "离线"}
          </span>
        </div>

        {/* User menu */}
        {currentUser ? (
          <div style={{ position: "relative" }}>
            <button className="user-menu-btn" onClick={(e) => { e.stopPropagation(); setShowUserMenu(!showUserMenu); }}>
              <User size={14} /> {currentUser.username} <ChevronDown size={14} />
            </button>
            {showUserMenu && (
              <div className="user-dropdown" onClick={(e) => e.stopPropagation()}>
                <button onClick={() => { setShowHistory(true); setShowUserMenu(false); }}>
                  <Clock size={14} /> 分析历史
                </button>
                <button onClick={handleLogout}>
                  <LogOut size={14} /> 退出登录
                </button>
              </div>
            )}
          </div>
        ) : (
          <button className="user-menu-btn" onClick={() => setShowAuth(true)}>
            <User size={14} /> 登录
          </button>
        )}
      </div>

      {/* ── Auth Modal ── */}
      <AnimatePresence>
        {showAuth && <AuthModal onClose={() => setShowAuth(false)} onAuth={setCurrentUser} />}
        {showHistory && <HistoryPanel onClose={() => setShowHistory(false)} />}
      </AnimatePresence>

      {/* Hero */}
      <section id="hero" className="hero section-shell">
        <div className="hero-copy">
          <motion.div className="badge" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <Sparkles size={16} /> {apiOnline ? (llmInfo.available ? `已接入 LLM (${llmInfo.model})` : "已接入后端 · 规则模式") : "本地演示模式"}
          </motion.div>
          <h1>
            <TextGenerateEffect words="AI 求职助手" />
          </h1>
          <p className="hero-subtitle">{data.profile.tagline}</p>
          <div className="hero-actions">
            <a className="primary-btn" href="#jobs">查看岗位排名 <ArrowRight size={18} /></a>
            <a className="ghost-btn" href="#upload"><Upload size={18} /> 上传分析</a>
          </div>
        </div>

        <motion.div className="hero-panel" initial={{ opacity: 0, scale: 0.92, rotateX: 8 }} animate={{ opacity: 1, scale: 1, rotateX: 0 }} transition={{ duration: 0.8 }}>
          <div className="panel-top"><span /> Live Match Engine <em>v4 LLM</em></div>
          <div className="radar-wrap"><Radar className="radar-icon" size={180} /><div className="scan-line" /></div>
          <div className="profile-line"><BrainCircuit /> {data.profile.name} · {data.profile.role}</div>
        </motion.div>
      </section>

      {/* Upload Section */}
      <section id="upload" className="section-shell" style={{ maxWidth: 900, margin: "0 auto" }}>
        <LampHeader eyebrow="ANALYSIS ENGINE" title="上传 JD 数据 + 简历进行 AI 分析" />

        <Spotlight className="feature-card" style={{ padding: 32, marginBottom: 24 }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
            <button
              onClick={() => setMode("batch")}
              style={{ padding: "8px 20px", borderRadius: 8, border: mode === "batch" ? "1px solid #818cf8" : "1px solid rgba(255,255,255,0.1)", background: mode === "batch" ? "rgba(129,140,248,0.15)" : "transparent", color: "#e2e8f0", cursor: "pointer", fontSize: 14 }}
            >
              <Upload size={14} style={{ verticalAlign: -2, marginRight: 4 }} /> 批量 CSV 分析
            </button>
            <button
              onClick={() => setMode("single")}
              style={{ padding: "8px 20px", borderRadius: 8, border: mode === "single" ? "1px solid #818cf8" : "1px solid rgba(255,255,255,0.1)", background: mode === "single" ? "rgba(129,140,248,0.15)" : "transparent", color: "#e2e8f0", cursor: "pointer", fontSize: 14 }}
            >
              <FileText size={14} style={{ verticalAlign: -2, marginRight: 4 }} /> 单条 JD 分析
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <label style={{ fontSize: 13, color: "#94a3b8" }}>简历内容 *</label>
                {currentUser && (
                  <button onClick={handleSaveResume} style={{ fontSize: 12, color: "#818cf8", background: "none", border: "none", cursor: "pointer" }}>
                    保存到云端
                  </button>
                )}
              </div>
              <textarea
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                placeholder="粘贴你的简历文本..."
                rows={4}
                style={{ width: "100%", padding: 12, borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(0,0,0,0.3)", color: "#e2e8f0", fontSize: 14, resize: "vertical", fontFamily: "inherit", boxSizing: "border-box" }}
              />
            </div>

            {mode === "batch" ? (
              <div>
                <label style={{ fontSize: 13, color: "#94a3b8", marginBottom: 6, display: "block" }}>JD CSV 文件 *</label>
                <input ref={fileRef} type="file" accept=".csv" style={{ fontSize: 14, color: "#94a3b8" }} />
              </div>
            ) : (
              <div>
                <label style={{ fontSize: 13, color: "#94a3b8", marginBottom: 6, display: "block" }}>岗位描述 (JD) *</label>
                <textarea
                  value={jdText}
                  onChange={(e) => setJdText(e.target.value)}
                  placeholder="粘贴 JD 文本..."
                  rows={4}
                  style={{ width: "100%", padding: 12, borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(0,0,0,0.3)", color: "#e2e8f0", fontSize: 14, resize: "vertical", fontFamily: "inherit", boxSizing: "border-box" }}
                />
              </div>
            )}

            {error && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#f87171", fontSize: 13 }}>
                <AlertCircle size={16} /> {error}
              </div>
            )}

            <button
              className="primary-btn"
              onClick={mode === "batch" ? handleBatchSubmit : handleSingleSubmit}
              disabled={loading || !apiOnline}
              style={{ opacity: loading || !apiOnline ? 0.5 : 1, cursor: loading || !apiOnline ? "not-allowed" : "pointer", display: "inline-flex", alignItems: "center", gap: 8 }}
            >
              {loading ? <><Loader2 size={18} className="animate-spin" /> 分析中...</> : <><Zap size={18} /> 开始 AI 分析</>}
            </button>
            {!apiOnline && <span style={{ fontSize: 12, color: "#64748b" }}>需要后端 API 在线才能使用分析功能</span>}
          </div>
        </Spotlight>

        {/* Export buttons */}
        <div style={{ display: "flex", gap: 12, justifyContent: "center", marginBottom: 32 }}>
          <button className="ghost-btn" onClick={handleExportCSV} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <FileText size={16} /> 导出 CSV
          </button>
          <button className="ghost-btn" onClick={handleExportExcel} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <FileSpreadsheet size={16} /> 导出 Excel
          </button>
        </div>
      </section>

      {/* Metrics */}
      <section className="metrics section-shell">
        {displayMetrics.map((metric: any, i: number) => <MetricCard key={metric.label} metric={metric} index={i} />)}
      </section>

      {/* Daily Report */}
      {apiData?.report && (
        <section className="section-shell" style={{ maxWidth: 900, margin: "0 auto" }}>
          <LampHeader eyebrow="DAILY REPORT" title="AI 每日分析报告" />
          <Spotlight className="feature-card" style={{ padding: 32 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <Newspaper size={22} style={{ color: "#818cf8" }} />
              <h3 style={{ margin: 0, fontSize: 18, color: "#e2e8f0" }}>分析报告摘要</h3>
            </div>
            <div style={{ color: "#cbd5e1", fontSize: 14, lineHeight: 1.8, whiteSpace: "pre-wrap" }}>
              {typeof apiData.report === "string" ? apiData.report : JSON.stringify(apiData.report, null, 2)}
            </div>
          </Spotlight>
        </section>
      )}

      {/* Features */}
      <section id="features" className="section-shell">
        <LampHeader eyebrow="CAPABILITIES" title="从简历到投递策略的完整链路" />
        <div className="feature-grid">
          {displayFeatures.map((feature: string, i: number) => (
            <Spotlight key={feature} className="feature-card">
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}>
                <Zap size={22} />
                <h3>{feature}</h3>
                <p>{llmInfo.available ? "LLM 增强模式，分析更精准。" : apiOnline ? "已接入后端 API，规则模式运行。" : "基于模拟 JSON 数据展示。"}</p>
              </motion.div>
            </Spotlight>
          ))}
        </div>
      </section>

      {/* Jobs */}
      <section id="jobs" className="section-shell split-section">
        <div>
          <LampHeader eyebrow="JOB INTELLIGENCE" title="岗位优先级排名" />
          <div className="job-list">
            {displayJobs.map((job: any, i: number) => (
              <motion.article className="job-card" key={job.title + i} initial={{ opacity: 0, x: -24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
                <div className="score-ring"><span>{job.score}</span></div>
                <div className="job-main">
                  <div className="job-title-row"><h3>{job.title}</h3><b className={job.priority === "高" ? "high" : "mid"}>{job.priority}</b></div>
                  <p>{job.company} · {job.city} · {job.salary}</p>
                  <div className="tags"><span>{job.type}</span>{(job.skills ?? []).map((s: string) => <span key={s}>{s}</span>)}</div>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
        <Spotlight className="gap-panel">
          <h3><Gauge /> 缺失技能雷达</h3>
          {displaySkillGaps.map((skill: any) => (
            <div className="gap-row" key={skill.name}>
              <span>{skill.name}</span>
              <div><motion.i initial={{ width: 0 }} whileInView={{ width: `${Math.min(skill.count * 5, 100)}%` }} viewport={{ once: true }} /></div>
              <em>{skill.count}</em>
            </div>
          ))}
        </Spotlight>
      </section>

      {/* Pipeline */}
      <section id="pipeline" className="section-shell">
        <LampHeader eyebrow="WORKFLOW" title="从简历到投递的完整工作流" />
        <div className="pipeline-grid">
          {displayPipeline.map((item: any, i: number) => (
            <motion.div className="pipeline-card" key={item.step} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
              <span className="step-index">0{i + 1}</span>
              <h3>{item.step}</h3>
              <p>{item.desc}</p>
              <div className="progress"><motion.span initial={{ width: 0 }} whileInView={{ width: `${item.progress}%` }} viewport={{ once: true }} /></div>
            </motion.div>
          ))}
        </div>
      </section>

      <footer className="footer section-shell">
        <ShieldCheck />
        <p>{apiOnline ? (llmInfo.available ? `LLM: ${llmInfo.model} · ` : "后端已连接 · ") : ""}React + Vite + Framer Motion</p>
        <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
          <a className="ghost-btn" href="#" onClick={(e) => { e.preventDefault(); handleExportCSV(); }}><Download size={16} /> 导出 CSV</a>
          <a className="ghost-btn" href="#" onClick={(e) => { e.preventDefault(); handleExportExcel(); }}><Download size={16} /> 导出 Excel</a>
        </div>
      </footer>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
