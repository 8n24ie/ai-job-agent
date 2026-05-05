import React, { useState, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight, BrainCircuit, Download, FileJson, Gauge, Radar,
  ShieldCheck, Sparkles, Zap, Upload, FileSpreadsheet, FileText,
  Wifi, WifiOff, Loader2, AlertCircle, Newspaper,
  User, LogOut, Clock, X, Eye, EyeOff,
  Bookmark, BookmarkCheck, MessageSquare, Send, Trash2, Star, GitCompare,
  ChevronDown, Plus, History, Layers, Edit2, Check,
} from "lucide-react";
import { BackgroundBeams, FloatingNav, LampHeader, SparklesCore, Spotlight, TextGenerateEffect } from "./components";
import {
  dashboardData, fetchBatchAnalysis, fetchSingleAnalysis,
  downloadExportCSV, downloadExportExcel,
  getToken, setToken, getUser, setUser, logout,
  apiRegister, apiLogin, apiSaveResume, apiLoadResume, apiUploadResume, apiGetHistory, apiDeleteHistory, apiGetHistoryDetail,
  apiListResumes, apiCreateResume, apiDeleteResume, apiSetDefaultResume, apiUpdateResume,
  apiListFavorites, apiAddFavorite, apiRemoveFavorite,
  apiSendChat, apiGetChatHistory, apiCompareJobs,
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

function HistoryPanel({ onClose, onLoadResult }: { onClose: () => void; onLoadResult?: (data: any) => void }) {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    apiGetHistory().then((h) => { setHistory(h); setLoading(false); });
  }, []);

  async function handleDelete(id: number) {
    try {
      await apiDeleteHistory(id);
      setHistory((prev) => prev.filter((h) => h.id !== id));
    } catch {}
  }

  function handleLoad(h: any) {
    if (!h.result_data || !onLoadResult) return;
    const r = h.result_data;
    if (h.mode === "batch" && r.rows) {
      onLoadResult({
        jobs: r.rows.map((row: any) => ({
          title: row.job_title ?? "未知", company: row.company ?? "",
          city: row.city ?? "", salary: row.salary ?? "",
          score: row.match_score ?? 0, priority: row.priority ?? "低",
          type: row.job_type ?? "",
          skills: [...(row.matched_skills ?? []), ...(row.missing_skills ?? [])].slice(0, 5),
        })),
        skillGaps: (r.missing_skills ?? []).map((s: any) => ({ name: s.skill ?? s.name ?? "", count: s.count ?? 0 })),
        metrics: [
          { label: "岗位样本", value: String(r.stats?.total ?? 0), delta: `共 ${r.stats?.total ?? 0} 条`, tone: "cyan" },
          { label: "高优先级", value: String(r.stats?.high ?? 0), delta: "建议先投", tone: "emerald" },
          { label: "中优先级", value: String(r.stats?.mid ?? 0), delta: "可选投递", tone: "violet" },
          { label: "低优先级", value: String(r.stats?.low ?? 0), delta: "暂不优先", tone: "amber" },
        ],
        report: r.report ?? null,
        _rawRows: r.rows ?? [], _rawMissing: r.missing_skills ?? [],
      });
    } else if (h.mode === "single" && r.match) {
      const jd = r.jd_analysis ?? {};
      const match = r.match;
      onLoadResult({
        jobs: [{
          title: jd.job_title ?? "待分析", company: "", city: "", salary: "",
          score: match.match_score ?? 0,
          priority: (match.match_score ?? 0) >= 70 ? "高" : ((match.match_score ?? 0) >= 50 ? "中" : "低"),
          type: "", skills: [...(jd.required_skills ?? []), ...(match.missing_skills ?? [])].slice(0, 5),
        }],
        skillGaps: (match.missing_skills ?? []).map((s: string) => ({ name: s, count: 1 })),
        metrics: [
          { label: "匹配度", value: `${match.match_score ?? 0}%`, delta: match.recommendation ?? "", tone: "cyan" },
          { label: "已匹配", value: String((match.matched_skills ?? []).length), delta: "技能", tone: "emerald" },
          { label: "缺失", value: String((match.missing_skills ?? []).length), delta: "需补充", tone: "amber" },
          { label: "难度", value: `${jd.difficulty ?? 0}`, delta: jd.suitable_for_fresh_graduate ? "适合应届" : "需经验", tone: "violet" },
        ],
        report: r.questions ?? null, _rawRows: [], _rawMissing: [],
      });
    }
    onClose();
  }

  return (
    <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div className="modal-content" style={{ maxWidth: 640, maxHeight: "80vh", overflowY: "auto" }} initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}><X size={18} /></button>
        <h2 style={{ margin: "0 0 16px", color: "#e2e8f0", fontSize: 20 }}><Clock size={18} style={{ verticalAlign: -3, marginRight: 8 }} />分析历史</h2>

        {loading ? (
          <div style={{ textAlign: "center", padding: 40, color: "#64748b" }}><Loader2 size={24} className="animate-spin" /></div>
        ) : history.length === 0 ? (
          <p style={{ color: "#64748b", textAlign: "center", padding: 40 }}>暂无分析记录</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {history.map((h: any) => (
              <div key={h.id} style={{ padding: 14, borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)", background: expandedId === h.id ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.02)", transition: "background 0.2s" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }} onClick={() => setExpandedId(expandedId === h.id ? null : h.id)}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 13, padding: "3px 10px", borderRadius: 6, background: h.mode === "batch" ? "rgba(129,140,248,0.15)" : "rgba(16,185,129,0.15)", color: h.mode === "batch" ? "#818cf8" : "#10b981", fontWeight: 600 }}>
                      {h.mode === "batch" ? "批量" : "单条"}
                    </span>
                    <span style={{ fontSize: 13, color: "#94a3b8" }}>{h.created_at}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {h.mode === "batch" && h.result_data?.stats && (
                      <span style={{ fontSize: 12, color: "#64748b" }}>{h.result_data.stats.total} 条</span>
                    )}
                    {h.mode === "single" && h.result_data?.match && (
                      <span style={{ fontSize: 12, color: "#64748b" }}>{h.result_data.match.match_score ?? 0}%</span>
                    )}
                    <ChevronDown size={14} style={{ color: "#64748b", transform: expandedId === h.id ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
                  </div>
                </div>

                {expandedId === h.id && (
                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                    {h.mode === "batch" && h.result_data?.rows && (
                      <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: 10 }}>
                        <div style={{ marginBottom: 8 }}>高优 {h.result_data.stats?.high} · 中优 {h.result_data.stats?.mid} · 低优 {h.result_data.stats?.low}</div>
                        {h.result_data.rows.slice(0, 3).map((r: any, i: number) => (
                          <div key={i} style={{ padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                            {r.job_title} — {r.match_score}分 — {r.priority}
                          </div>
                        ))}
                        {h.result_data.rows.length > 3 && <div style={{ color: "#475569", marginTop: 4 }}>+{h.result_data.rows.length - 3} 更多</div>}
                      </div>
                    )}
                    {h.mode === "single" && h.result_data?.match && (
                      <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: 10 }}>
                        <div>岗位: {h.result_data.jd_analysis?.job_title ?? "未知"}</div>
                        <div>匹配度: {h.result_data.match.match_score ?? 0}%</div>
                        <div>已匹配: {(h.result_data.match.matched_skills ?? []).join(", ")}</div>
                        <div>缺失: {(h.result_data.match.missing_skills ?? []).join(", ")}</div>
                      </div>
                    )}
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => handleLoad(h)} style={{ fontSize: 12, padding: "6px 14px", borderRadius: 6, background: "rgba(16,185,129,0.15)", color: "#10b981", border: "none", cursor: "pointer" }}>
                        重新加载
                      </button>
                      <button onClick={() => handleDelete(h.id)} style={{ fontSize: 12, padding: "6px 14px", borderRadius: 6, background: "rgba(248,113,113,0.1)", color: "#f87171", border: "none", cursor: "pointer" }}>
                        删除
                      </button>
                    </div>
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
  const resumeFileRef = useRef<HTMLInputElement>(null);

  // Auth state
  const [currentUser, setCurrentUser] = useState<any>(getUser());
  const [showAuth, setShowAuth] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showResumes, setShowResumes] = useState(false);
  const [resumes, setResumes] = useState<any[]>([]);
  const [expandedResumeId, setExpandedResumeId] = useState<number | null>(null);
  const [renamingId, setRenamingId] = useState<number | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [showFavorites, setShowFavorites] = useState(false);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [expandedFavId, setExpandedFavId] = useState<number | null>(null);
  const [favDeleteConfirmId, setFavDeleteConfirmId] = useState<number | null>(null);
  const [favSearch, setFavSearch] = useState('');
  const [favSort, setFavSort] = useState<'score' | 'priority'>('score');
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [compareA, setCompareA] = useState<any>(null);
  const [compareB, setCompareB] = useState<any>(null);
  const [compareResult, setCompareResult] = useState<any>(null);
  const [showCompare, setShowCompare] = useState(false);
  const [compareLoading, setCompareLoading] = useState(false);

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

  useEffect(() => {
    if (currentUser) {
      loadResumes();
      loadFavorites();
      loadChatHistory();
    }
  }, [currentUser]);

  function handleLogout() {
    logout();
    setCurrentUser(null);
    setShowUserMenu(false);
  }

  async function handleResumeFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setLoading(true);
    try {
      const result = await apiUploadResume(file);
      if (result.error) { setError(result.error); return; }
      setResumeText(result.resume_text);
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); if (resumeFileRef.current) resumeFileRef.current.value = ""; }
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

  async function loadResumes() {
    try { const r = await apiListResumes(); setResumes(r); } catch {}
  }
  async function loadFavorites() {
    try { const r = await apiListFavorites(); setFavorites(r); } catch {}
  }
  async function handleSaveResumeVersion() {
    if (!resumeText.trim()) return;
    const name = prompt('输入简历版本名称：', '默认简历');
    if (!name) return;
    try {
      await apiCreateResume(name, resumeText, true);
      loadResumes();
    } catch (e: any) { setError(e.message); }
  }
  async function handleRenameResume(id: number) {
    if (!renameValue.trim()) return;
    try {
      const r = resumes.find((x) => x.id === id);
      await apiUpdateResume(id, renameValue.trim(), r?.resume_text ?? '');
      setRenamingId(null);
      loadResumes();
    } catch (e: any) { setError(e.message); }
  }
  async function handleDeleteResume(id: number) {
    try {
      await apiDeleteResume(id);
      setDeleteConfirmId(null);
      loadResumes();
    } catch (e: any) { setError(e.message); }
  }
  async function handleAddFavorite(job: any) {
    if (!currentUser) { setShowAuth(true); return; }
    try {
      await apiAddFavorite({
        job_title: job.title, company: job.company, city: job.city,
        salary: job.salary, match_score: String(job.score),
        priority: job.priority, job_type: job.type,
      });
      loadFavorites();
    } catch (e: any) { setError(e.message); }
  }
  async function handleRemoveFavorite(id: number) {
    try { await apiRemoveFavorite(id); setFavDeleteConfirmId(null); loadFavorites(); } catch (e: any) { setError(e.message); }
  }
  async function handleCompare() {
    if (!compareA || !compareB) return;
    setCompareLoading(true);
    setCompareResult(null);
    try {
      const result = await apiCompareJobs(resumeText, {
        job_title: compareA.job_title, company: compareA.company, jd_text: compareA.jd_text || '',
      }, {
        job_title: compareB.job_title, company: compareB.company, jd_text: compareB.jd_text || '',
      });
      setCompareResult(result);
    } catch (e: any) { setError(e.message); }
    setCompareLoading(false);
  }
  async function handleSendChat() {
    if (!chatInput.trim() || !currentUser) return;
    const msg = chatInput;
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', content: msg }]);
    setChatLoading(true);
    try {
      const res = await apiSendChat(msg);
      setChatMessages(prev => [...prev, { role: 'assistant', content: res.response }]);
    } catch (e: any) {
      setChatMessages(prev => [...prev, { role: 'assistant', content: '发送失败：' + e.message }]);
    } finally { setChatLoading(false); }
  }
  async function loadChatHistory() {
    try { const h = await apiGetChatHistory(); setChatMessages(h); } catch {}
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
                <button onClick={() => { setShowResumes(true); setShowUserMenu(false); }}>
                  <Layers size={14} /> 简历管理
                </button>
                <button onClick={() => { setShowFavorites(true); setShowUserMenu(false); }}>
                  <Bookmark size={14} /> 岗位收藏
                </button>
                <button onClick={() => { setShowCompare(true); loadFavorites(); setShowUserMenu(false); }}>
                  <GitCompare size={14} /> 岗位对比
                </button>
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
        {showHistory && <HistoryPanel onClose={() => setShowHistory(false)} onLoadResult={(data) => setApiData(data)} />}
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
                <div style={{ display: "flex", gap: 8 }}>
                  <input ref={resumeFileRef} type="file" accept=".pdf,.docx,.doc,.txt" style={{ display: "none" }} onChange={handleResumeFileUpload} />
                  <button onClick={() => resumeFileRef.current?.click()} style={{ fontSize: 12, color: "#10b981", background: "none", border: "none", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4 }}>
                    <Upload size={12} /> 上传简历文件
                  </button>
                  {currentUser && (
                    <button onClick={handleSaveResume} style={{ fontSize: 12, color: "#818cf8", background: "none", border: "none", cursor: "pointer" }}>
                      保存到云端
                    </button>
                  )}
                </div>
              </div>
              <div style={{ fontSize: 11, color: "#475569", marginBottom: 6 }}>支持 PDF、DOCX、TXT 格式</div>
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
                <button
                  onClick={(e) => { e.stopPropagation(); handleAddFavorite(job); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--amber)', padding: 4 }}
                  title="收藏"
                >
                  <Bookmark size={16} />
                </button>
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

      {/* Chat FAB */}
      {currentUser && (
        <button
          onClick={() => setShowChat(!showChat)}
          style={{
            position: 'fixed', bottom: 24, right: 24, zIndex: 9998,
            width: 56, height: 56, borderRadius: '50%',
            background: 'var(--accent)', color: '#0a0a0f',
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 24px rgba(16,185,129,0.4)',
            transition: 'transform 0.2s cubic-bezier(0.34,1.56,0.64,1)',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.1)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >
          <MessageSquare size={24} />
        </button>
      )}

      {/* Chat Panel */}
      {showChat && currentUser && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          style={{
            position: 'fixed', bottom: 92, right: 24, zIndex: 9998,
            width: 380, maxHeight: '70vh',
            background: 'var(--panel-strong)', border: '1px solid var(--line)',
            borderRadius: 20, display: 'flex', flexDirection: 'column',
            overflow: 'hidden', boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
          }}
        >
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: 16, color: 'var(--heading)' }}><MessageSquare size={16} style={{ verticalAlign: -2, marginRight: 8 }} />AI 求职助手</h3>
            <button onClick={() => setShowChat(false)} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer' }}><X size={18} /></button>
          </div>
          <div style={{ flex: 1, overflow: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {chatMessages.length === 0 && (
              <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '40px 20px', fontSize: 14 }}>
                问我任何求职相关的问题
              </div>
            )}
            {chatMessages.map((msg, i) => (
              <div key={i} style={{
                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '80%', padding: '10px 14px', borderRadius: 14,
                background: msg.role === 'user' ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.05)',
                color: 'var(--text)', fontSize: 14, lineHeight: 1.6,
              }}>
                {msg.content}
              </div>
            ))}
            {chatLoading && (
              <div style={{ alignSelf: 'flex-start', padding: '10px 14px', borderRadius: 14, background: 'rgba(255,255,255,0.05)', color: 'var(--muted)', fontSize: 14 }}>思考中...</div>
            )}
          </div>
          <div style={{ padding: 12, borderTop: '1px solid var(--line)', display: 'flex', gap: 8 }}>
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
              placeholder="问点什么..."
              style={{
                flex: 1, padding: '10px 14px', borderRadius: 12,
                border: '1px solid var(--line)', background: 'var(--panel)',
                color: 'var(--text)', fontSize: 14, outline: 'none',
              }}
            />
            <button
              onClick={handleSendChat}
              disabled={chatLoading}
              style={{
                width: 40, height: 40, borderRadius: 12,
                background: 'var(--accent)', color: '#0a0a0f',
                border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Send size={16} />
            </button>
          </div>
        </motion.div>
      )}

      {/* Resume Manager Modal */}
      <AnimatePresence>
        {showResumes && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { setShowResumes(false); setExpandedResumeId(null); setRenamingId(null); setDeleteConfirmId(null); }}>
            <motion.div className="modal-content" style={{ maxWidth: 640, maxHeight: '80vh', overflowY: 'auto' }} initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} onClick={(e) => e.stopPropagation()}>
              <button className="modal-close" onClick={() => { setShowResumes(false); setExpandedResumeId(null); setRenamingId(null); setDeleteConfirmId(null); }}><X size={18} /></button>
              <h2 style={{ margin: '0 0 16px', color: '#e2e8f0', fontSize: 20 }}><Layers size={18} style={{ verticalAlign: -3, marginRight: 8 }} />简历版本管理</h2>
              <button onClick={handleSaveResumeVersion} className="primary-btn" style={{ marginBottom: 16, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Plus size={14} /> 保存当前简历为新版本
              </button>
              {resumes.length === 0 ? (
                <p style={{ color: '#64748b', textAlign: 'center', padding: 40 }}>暂无保存的简历版本</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {resumes.map((r: any) => (
                    <div key={r.id} style={{ padding: 14, borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)', background: expandedResumeId === r.id ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.02)', transition: 'background 0.2s' }}>
                      {/* Header row */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={() => setExpandedResumeId(expandedResumeId === r.id ? null : r.id)}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
                          {renamingId === r.id ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }} onClick={(e) => e.stopPropagation()}>
                              <input value={renameValue} onChange={(e) => setRenameValue(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleRenameResume(r.id); if (e.key === 'Escape') setRenamingId(null); }} style={{ fontSize: 13, padding: '4px 8px', borderRadius: 6, border: '1px solid rgba(16,185,129,0.4)', background: 'rgba(0,0,0,0.3)', color: '#e2e8f0', outline: 'none', width: 160 }} autoFocus />
                              <button onClick={() => handleRenameResume(r.id)} style={{ background: 'none', border: 'none', color: '#10b981', cursor: 'pointer', padding: 4 }}><Check size={14} /></button>
                              <button onClick={() => setRenamingId(null)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 4 }}><X size={14} /></button>
                            </div>
                          ) : (
                            <>
                              <span style={{ fontSize: 14, color: '#e2e8f0', fontWeight: 600 }}>{r.name}</span>
                              {r.is_default && <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: 'rgba(16,185,129,0.2)', color: '#10b981' }}>默认</span>}
                            </>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 11, color: '#475569' }}>{(r.resume_text ?? '').length} 字</span>
                          <ChevronDown size={14} style={{ color: '#64748b', transform: expandedResumeId === r.id ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                        </div>
                      </div>

                      {/* Expanded details */}
                      {expandedResumeId === r.id && (
                        <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                          {/* Content preview */}
                          <div style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.7, marginBottom: 12, maxHeight: 200, overflowY: 'auto', padding: '10px 12px', borderRadius: 8, background: 'rgba(0,0,0,0.2)', whiteSpace: 'pre-wrap' }}>
                            {(r.resume_text ?? '').slice(0, 500)}{(r.resume_text ?? '').length > 500 ? '...' : ''}
                          </div>
                          <div style={{ fontSize: 12, color: '#475569', marginBottom: 10 }}>创建于 {r.created_at}</div>

                          {/* Action buttons */}
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            <button onClick={() => { setResumeText(r.resume_text); setShowResumes(false); }} style={{ fontSize: 12, padding: '6px 14px', borderRadius: 6, background: 'rgba(16,185,129,0.15)', color: '#10b981', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                              <Eye size={13} /> 加载到编辑器
                            </button>
                            {!r.is_default && (
                              <button onClick={() => { apiSetDefaultResume(r.id).then(loadResumes); }} style={{ fontSize: 12, padding: '6px 14px', borderRadius: 6, background: 'rgba(129,140,248,0.1)', color: '#818cf8', border: 'none', cursor: 'pointer' }}>
                                设为默认
                              </button>
                            )}
                            <button onClick={() => { setRenamingId(r.id); setRenameValue(r.name); }} style={{ fontSize: 12, padding: '6px 14px', borderRadius: 6, background: 'rgba(255,255,255,0.05)', color: '#94a3b8', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                              <Edit2 size={13} /> 重命名
                            </button>
                            {deleteConfirmId === r.id ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span style={{ fontSize: 12, color: '#f87171' }}>确认删除？</span>
                                <button onClick={() => handleDeleteResume(r.id)} style={{ fontSize: 12, padding: '6px 12px', borderRadius: 6, background: 'rgba(248,113,113,0.15)', color: '#f87171', border: 'none', cursor: 'pointer' }}>删除</button>
                                <button onClick={() => setDeleteConfirmId(null)} style={{ fontSize: 12, padding: '6px 12px', borderRadius: 6, background: 'rgba(255,255,255,0.05)', color: '#94a3b8', border: 'none', cursor: 'pointer' }}>取消</button>
                              </div>
                            ) : (
                              <button onClick={() => setDeleteConfirmId(r.id)} style={{ fontSize: 12, padding: '6px 14px', borderRadius: 6, background: 'rgba(248,113,113,0.1)', color: '#f87171', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                <Trash2 size={13} /> 删除
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Favorites Modal */}
      <AnimatePresence>
        {showFavorites && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { setShowFavorites(false); setExpandedFavId(null); setFavDeleteConfirmId(null); setFavSearch(''); }}>
            <motion.div className="modal-content" style={{ maxWidth: 640, maxHeight: '80vh', overflowY: 'auto' }} initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} onClick={(e) => e.stopPropagation()}>
              <button className="modal-close" onClick={() => { setShowFavorites(false); setExpandedFavId(null); setFavDeleteConfirmId(null); setFavSearch(''); }}><X size={18} /></button>
              <h2 style={{ margin: '0 0 16px', color: '#e2e8f0', fontSize: 20 }}><Bookmark size={18} style={{ verticalAlign: -3, marginRight: 8 }} />岗位收藏</h2>

              {/* Search + Sort */}
              {favorites.length > 0 && (
                <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                  <input value={favSearch} onChange={(e) => setFavSearch(e.target.value)} placeholder="搜索岗位/公司..." style={{ flex: 1, fontSize: 13, padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.2)', color: '#e2e8f0', outline: 'none' }} />
                  <button onClick={() => setFavSort(favSort === 'score' ? 'priority' : 'score')} style={{ fontSize: 12, padding: '8px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', color: '#94a3b8', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                    {favSort === 'score' ? '按匹配度' : '按优先级'}
                  </button>
                </div>
              )}

              {favorites.length === 0 ? (
                <p style={{ color: '#64748b', textAlign: 'center', padding: 40 }}>暂无收藏的岗位<br /><span style={{ fontSize: 12, marginTop: 8, display: 'block' }}>分析结果中点击 ♡ 即可收藏</span></p>
              ) : (() => {
                const filtered = favorites
                  .filter((f: any) => !favSearch || f.job_title?.toLowerCase().includes(favSearch.toLowerCase()) || f.company?.toLowerCase().includes(favSearch.toLowerCase()))
                  .sort((a: any, b: any) => {
                    if (favSort === 'score') return (parseFloat(b.match_score) || 0) - (parseFloat(a.match_score) || 0);
                    const pOrder: Record<string, number> = { '高': 0, '中': 1, '低': 2 };
                    return (pOrder[a.priority] ?? 1) - (pOrder[b.priority] ?? 1);
                  });
                if (filtered.length === 0) return <p style={{ color: '#64748b', textAlign: 'center', padding: 40 }}>未找到匹配的收藏</p>;
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {filtered.map((f: any) => (
                      <div key={f.id} style={{ padding: 14, borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)', background: expandedFavId === f.id ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.02)', transition: 'background 0.2s' }}>
                        {/* Header row */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={() => setExpandedFavId(expandedFavId === f.id ? null : f.id)}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
                            <span style={{ fontSize: 14, color: '#e2e8f0', fontWeight: 600 }}>{f.job_title}</span>
                            <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: f.priority === '高' ? 'rgba(16,185,129,0.2)' : f.priority === '中' ? 'rgba(129,140,248,0.15)' : 'rgba(248,113,113,0.1)', color: f.priority === '高' ? '#10b981' : f.priority === '中' ? '#818cf8' : '#f87171' }}>{f.priority ?? '中'}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 13, color: '#10b981', fontWeight: 600 }}>{f.match_score ?? 0}%</span>
                            <ChevronDown size={14} style={{ color: '#64748b', transform: expandedFavId === f.id ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                          </div>
                        </div>

                        {/* Subtitle */}
                        <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>{f.company}{f.city ? ` · ${f.city}` : ''}{f.salary ? ` · ${f.salary}` : ''}</div>

                        {/* Expanded details */}
                        {expandedFavId === f.id && (
                          <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                              <div style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(0,0,0,0.2)' }}>
                                <div style={{ fontSize: 11, color: '#475569', marginBottom: 2 }}>匹配度</div>
                                <div style={{ fontSize: 16, color: '#10b981', fontWeight: 700 }}>{f.match_score ?? 0}%</div>
                              </div>
                              <div style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(0,0,0,0.2)' }}>
                                <div style={{ fontSize: 11, color: '#475569', marginBottom: 2 }}>优先级</div>
                                <div style={{ fontSize: 16, color: f.priority === '高' ? '#10b981' : '#818cf8', fontWeight: 700 }}>{f.priority ?? '中'}</div>
                              </div>
                              {f.job_type && (
                                <div style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(0,0,0,0.2)' }}>
                                  <div style={{ fontSize: 11, color: '#475569', marginBottom: 2 }}>类型</div>
                                  <div style={{ fontSize: 13, color: '#94a3b8' }}>{f.job_type}</div>
                                </div>
                              )}
                              {f.created_at && (
                                <div style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(0,0,0,0.2)' }}>
                                  <div style={{ fontSize: 11, color: '#475569', marginBottom: 2 }}>收藏时间</div>
                                  <div style={{ fontSize: 13, color: '#94a3b8' }}>{f.created_at}</div>
                                </div>
                              )}
                            </div>

                            {/* Action buttons */}
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                              <span style={{ fontSize: 12, color: '#64748b', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                <GitCompare size={13} /> 对比选择:
                              </span>
                              <input
                                type="checkbox"
                                checked={compareA?.id === f.id || compareB?.id === f.id}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    if (!compareA) setCompareA(f);
                                    else if (!compareB) setCompareB(f);
                                  } else {
                                    if (compareA?.id === f.id) setCompareA(null);
                                    if (compareB?.id === f.id) setCompareB(null);
                                  }
                                }}
                                style={{ cursor: 'pointer' }}
                              />
                              {compareA?.id === f.id && <span style={{ fontSize: 11, color: '#10b981' }}>A</span>}
                              {compareB?.id === f.id && <span style={{ fontSize: 11, color: '#818cf8' }}>B</span>}

                              <div style={{ flex: 1 }} />

                              {favDeleteConfirmId === f.id ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <span style={{ fontSize: 12, color: '#f87171' }}>确认取消收藏？</span>
                                  <button onClick={() => handleRemoveFavorite(f.id)} style={{ fontSize: 12, padding: '6px 12px', borderRadius: 6, background: 'rgba(248,113,113,0.15)', color: '#f87171', border: 'none', cursor: 'pointer' }}>确认</button>
                                  <button onClick={() => setFavDeleteConfirmId(null)} style={{ fontSize: 12, padding: '6px 12px', borderRadius: 6, background: 'rgba(255,255,255,0.05)', color: '#94a3b8', border: 'none', cursor: 'pointer' }}>取消</button>
                                </div>
                              ) : (
                                <button onClick={() => setFavDeleteConfirmId(f.id)} style={{ fontSize: 12, padding: '6px 14px', borderRadius: 6, background: 'rgba(248,113,113,0.1)', color: '#f87171', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                  <Trash2 size={13} /> 取消收藏
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                    <div style={{ fontSize: 12, color: '#475569', textAlign: 'center', padding: '8px 0' }}>
                      共 {filtered.length} 个收藏{favSearch ? ` · 搜索: "${favSearch}"` : ''}
                    </div>
                  </div>
                );
              })()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Compare Modal */}
      <AnimatePresence>
        {showCompare && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { setShowCompare(false); setCompareResult(null); }}>
            <motion.div className="modal-content" style={{ maxWidth: 720, maxHeight: '85vh', overflowY: 'auto' }} initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} onClick={(e) => e.stopPropagation()}>
              <button className="modal-close" onClick={() => { setShowCompare(false); setCompareResult(null); }}><X size={18} /></button>
              <h2 style={{ margin: '0 0 16px', color: '#e2e8f0', fontSize: 20 }}><GitCompare size={18} style={{ verticalAlign: -3, marginRight: 8 }} />岗位对比</h2>

              {/* Selection area */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 12, alignItems: 'start', marginBottom: 20 }}>
                {/* Job A */}
                <div style={{ padding: 14, borderRadius: 10, border: '1px solid rgba(16,185,129,0.3)', background: 'rgba(16,185,129,0.05)' }}>
                  <div style={{ fontSize: 12, color: '#10b981', fontWeight: 600, marginBottom: 8 }}>岗位 A</div>
                  {compareA ? (
                    <div>
                      <div style={{ fontSize: 14, color: '#e2e8f0', fontWeight: 600 }}>{compareA.job_title}</div>
                      <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{compareA.company}{compareA.city ? ` · ${compareA.city}` : ''}</div>
                      <button onClick={() => setCompareA(null)} style={{ marginTop: 8, fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'rgba(248,113,113,0.1)', color: '#f87171', border: 'none', cursor: 'pointer' }}>清除</button>
                    </div>
                  ) : (
                    <div style={{ fontSize: 13, color: '#475569' }}>
                      {favorites.length > 0 ? (
                        <select onChange={(e) => { const f = favorites.find((x: any) => x.id === Number(e.target.value)); if (f) setCompareA(f); }} style={{ width: '100%', fontSize: 13, padding: '8px', borderRadius: 8, background: 'rgba(0,0,0,0.3)', color: '#e2e8f0', border: '1px solid rgba(255,255,255,0.1)', outline: 'none' }}>
                          <option value="">从收藏中选择...</option>
                          {favorites.map((f: any) => <option key={f.id} value={f.id}>{f.job_title} — {f.company}</option>)}
                        </select>
                      ) : <span>请先收藏岗位</span>}
                    </div>
                  )}
                </div>

                {/* VS divider */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: 40 }}>
                  <span style={{ fontSize: 16, fontWeight: 800, color: '#475569' }}>VS</span>
                </div>

                {/* Job B */}
                <div style={{ padding: 14, borderRadius: 10, border: '1px solid rgba(129,140,248,0.3)', background: 'rgba(129,140,248,0.05)' }}>
                  <div style={{ fontSize: 12, color: '#818cf8', fontWeight: 600, marginBottom: 8 }}>岗位 B</div>
                  {compareB ? (
                    <div>
                      <div style={{ fontSize: 14, color: '#e2e8f0', fontWeight: 600 }}>{compareB.job_title}</div>
                      <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{compareB.company}{compareB.city ? ` · ${compareB.city}` : ''}</div>
                      <button onClick={() => setCompareB(null)} style={{ marginTop: 8, fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'rgba(248,113,113,0.1)', color: '#f87171', border: 'none', cursor: 'pointer' }}>清除</button>
                    </div>
                  ) : (
                    <div style={{ fontSize: 13, color: '#475569' }}>
                      {favorites.length > 0 ? (
                        <select onChange={(e) => { const f = favorites.find((x: any) => x.id === Number(e.target.value)); if (f) setCompareB(f); }} style={{ width: '100%', fontSize: 13, padding: '8px', borderRadius: 8, background: 'rgba(0,0,0,0.3)', color: '#e2e8f0', border: '1px solid rgba(255,255,255,0.1)', outline: 'none' }}>
                          <option value="">从收藏中选择...</option>
                          {favorites.map((f: any) => <option key={f.id} value={f.id}>{f.job_title} — {f.company}</option>)}
                        </select>
                      ) : <span>请先收藏岗位</span>}
                    </div>
                  )}
                </div>
              </div>

              {/* Compare button */}
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <button onClick={handleCompare} disabled={!compareA || !compareB || compareLoading} className="primary-btn" style={{ opacity: (!compareA || !compareB) ? 0.4 : 1, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  {compareLoading ? <><Loader2 size={14} className="animate-spin" /> 对比中...</> : <><GitCompare size={14} /> 开始对比</>}
                </button>
              </div>

              {/* Compare results */}
              {compareResult && (
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 20 }}>
                  <h3 style={{ margin: '0 0 16px', color: '#e2e8f0', fontSize: 16 }}>对比结果</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    {/* Job A result */}
                    <div style={{ padding: 16, borderRadius: 10, border: '1px solid rgba(16,185,129,0.2)', background: 'rgba(16,185,129,0.03)' }}>
                      <div style={{ fontSize: 15, color: '#e2e8f0', fontWeight: 600, marginBottom: 4 }}>{compareResult.job_a?.title || compareA?.job_title}</div>
                      <div style={{ fontSize: 12, color: '#64748b', marginBottom: 12 }}>{compareResult.job_a?.company || compareA?.company}</div>
                      <div style={{ textAlign: 'center', marginBottom: 12 }}>
                        <div style={{ fontSize: 36, fontWeight: 800, color: '#10b981' }}>{compareResult.job_a?.match_result?.match_score ?? 0}%</div>
                        <div style={{ fontSize: 12, color: '#475569' }}>匹配度</div>
                      </div>
                      <div style={{ marginBottom: 8 }}>
                        <div style={{ fontSize: 12, color: '#10b981', fontWeight: 600, marginBottom: 4 }}>已匹配技能</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {(compareResult.job_a?.match_result?.matched_skills ?? []).map((s: string, i: number) => (
                            <span key={i} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>{s}</span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: 12, color: '#f87171', fontWeight: 600, marginBottom: 4 }}>缺失技能</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {(compareResult.job_a?.match_result?.missing_skills ?? []).map((s: string, i: number) => (
                            <span key={i} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: 'rgba(248,113,113,0.1)', color: '#f87171' }}>{s}</span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Job B result */}
                    <div style={{ padding: 16, borderRadius: 10, border: '1px solid rgba(129,140,248,0.2)', background: 'rgba(129,140,248,0.03)' }}>
                      <div style={{ fontSize: 15, color: '#e2e8f0', fontWeight: 600, marginBottom: 4 }}>{compareResult.job_b?.title || compareB?.job_title}</div>
                      <div style={{ fontSize: 12, color: '#64748b', marginBottom: 12 }}>{compareResult.job_b?.company || compareB?.company}</div>
                      <div style={{ textAlign: 'center', marginBottom: 12 }}>
                        <div style={{ fontSize: 36, fontWeight: 800, color: '#818cf8' }}>{compareResult.job_b?.match_result?.match_score ?? 0}%</div>
                        <div style={{ fontSize: 12, color: '#475569' }}>匹配度</div>
                      </div>
                      <div style={{ marginBottom: 8 }}>
                        <div style={{ fontSize: 12, color: '#10b981', fontWeight: 600, marginBottom: 4 }}>已匹配技能</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {(compareResult.job_b?.match_result?.matched_skills ?? []).map((s: string, i: number) => (
                            <span key={i} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>{s}</span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: 12, color: '#f87171', fontWeight: 600, marginBottom: 4 }}>缺失技能</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {(compareResult.job_b?.match_result?.missing_skills ?? []).map((s: string, i: number) => (
                            <span key={i} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: 'rgba(248,113,113,0.1)', color: '#f87171' }}>{s}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Recommendation */}
                  <div style={{ marginTop: 16, padding: 14, borderRadius: 10, background: 'rgba(0,0,0,0.2)', textAlign: 'center' }}>
                    <div style={{ fontSize: 13, color: '#94a3b8' }}>
                      {(compareResult.job_a?.match_result?.match_score ?? 0) > (compareResult.job_b?.match_result?.match_score ?? 0)
                        ? <>🟢 <strong style={{ color: '#10b981' }}>{compareResult.job_a?.title}</strong> 匹配度更高，建议优先投递</>
                        : (compareResult.job_b?.match_result?.match_score ?? 0) > (compareResult.job_a?.match_result?.match_score ?? 0)
                        ? <>🟢 <strong style={{ color: '#818cf8' }}>{compareResult.job_b?.title}</strong> 匹配度更高，建议优先投递</>
                        : <>两个岗位匹配度相同，可根据其他因素选择</>
                      }
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
