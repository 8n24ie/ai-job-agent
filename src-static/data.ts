/* ── Auth helpers ────────────────────────────────────────────────────────── */

const TOKEN_KEY = "ai_job_agent_token";
const USER_KEY = "ai_job_agent_user";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function getUser(): { id: number; username: string } | null {
  const raw = localStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function setUser(user: { id: number; username: string }) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function apiRegister(username: string, password: string) {
  const res = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `注册失败: ${res.status}`);
  }
  return res.json();
}

export async function apiLogin(username: string, password: string) {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `登录失败: ${res.status}`);
  }
  return res.json();
}

export async function apiSaveResume(resumeText: string) {
  const res = await fetch("/api/resume/save", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ resume_text: resumeText }),
  });
  if (!res.ok) throw new Error("保存简历失败");
  return res.json();
}

export async function apiLoadResume() {
  const res = await fetch("/api/resume/load", { headers: authHeaders() });
  if (!res.ok) return { resume_text: "" };
  return res.json();
}

export async function apiUploadResume(file: File) {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch("/api/upload/resume", { method: "POST", body: form });
  if (!res.ok) throw new Error("上传失败");
  return res.json();
}

export async function apiGetHistory() {
  const res = await fetch("/api/history", { headers: authHeaders() });
  if (!res.ok) return [];
  return res.json();
}

/* ── Dashboard static data ──────────────────────────────────────────────── */

export const dashboardData = {
  profile: {
    name: "智聘 AI",
    role: "AI 简历优化 · 岗位匹配 · 求职管理平台",
    location: "面向所有求职者",
    tagline: "上传简历，AI 帮你优化、匹配岗位、准备面试。从简历到 offer 的完整智能链路。",
  },
  metrics: [
    { label: "简历优化", value: "98%", delta: "平均提升匹配度", tone: "cyan" },
    { label: "岗位分析", value: "10K+", delta: "已分析岗位数", tone: "emerald" },
    { label: "面试准备", value: "500+", delta: "生成面试题", tone: "violet" },
    { label: "求职者", value: "2K+", delta: "正在使用", tone: "amber" },
  ],
  pipeline: [
    { step: "上传简历", desc: "PDF / Word / 文本，一键上传解析", progress: 100 },
    { step: "AI 诊断", desc: "简历评分、问题指出、优化建议", progress: 92 },
    { step: "岗位匹配", desc: "粘贴 JD，智能匹配度分析", progress: 85 },
    { step: "面试准备", desc: "针对性面试题、STAR 回答、投递策略", progress: 78 },
  ],
  jobs: [
    {
      title: "前端开发工程师",
      company: "字节跳动",
      city: "北京",
      salary: "25-40K",
      score: 95,
      priority: "高",
      type: "技术岗",
      skills: ["React", "TypeScript", "Node.js"],
    },
    {
      title: "产品经理",
      company: "腾讯",
      city: "深圳",
      salary: "20-35K",
      score: 88,
      priority: "高",
      type: "产品岗",
      skills: ["需求分析", "数据驱动", "用户研究"],
    },
    {
      title: "数据分析师",
      company: "阿里巴巴",
      city: "杭州",
      salary: "18-30K",
      score: 82,
      priority: "中",
      type: "数据岗",
      skills: ["SQL", "Python", "可视化"],
    },
  ],
  skillGaps: [
    { name: "系统设计", count: 24 },
    { name: "算法", count: 18 },
    { name: "SQL", count: 15 },
    { name: "英语口语", count: 12 },
    { name: "项目管理", count: 8 },
  ],
  features: [
    "AI 简历评分",
    "智能优化建议",
    "岗位匹配分析",
    "缺失技能诊断",
    "面试题生成",
    "投递策略推荐",
  ],
};

/* ── API fetch wrappers (with auth) ─────────────────────────────────────── */

export async function fetchBatchAnalysis(file: File, resumeText: string) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("resume_text", resumeText);
  const res = await fetch("/api/analyze/batch", {
    method: "POST",
    headers: authHeaders(),
    body: formData,
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function fetchSingleAnalysis(resumeText: string, jdText: string) {
  const res = await fetch("/api/analyze/single", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ resume_text: resumeText, jd_text: jdText }),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function downloadExportCSV(rows: any[]) {
  const res = await fetch("/api/export/csv", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rows }),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.blob();
}

export async function downloadExportExcel(rows: any[], missingSkills: any[]) {
  const res = await fetch("/api/export/excel", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rows, missing_skills: missingSkills }),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.blob();
}

/* ── Resume Version Management ─────────────────────────────────────────── */

export async function apiListResumes() {
  const res = await fetch('/api/resumes', { headers: authHeaders() });
  if (!res.ok) return [];
  return res.json();
}

export async function apiCreateResume(name: string, content: string, is_default = false) {
  const res = await fetch('/api/resumes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ name, content, is_default }),
  });
  if (!res.ok) throw new Error('创建简历版本失败');
  return res.json();
}

export async function apiDeleteResume(id: number) {
  const res = await fetch(`/api/resumes/${id}`, { method: 'DELETE', headers: authHeaders() });
  if (!res.ok) throw new Error('删除失败');
  return res.json();
}

export async function apiSetDefaultResume(id: number) {
  const res = await fetch(`/api/resumes/${id}/default`, { method: 'POST', headers: authHeaders() });
  if (!res.ok) throw new Error('设置默认失败');
  return res.json();
}

export async function apiUpdateResume(id: number, name: string, content: string) {
  const res = await fetch(`/api/resumes/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ name, content, is_default: false }),
  });
  if (!res.ok) throw new Error('更新简历版本失败');
  return res.json();
}

/* ── Favorites ─────────────────────────────────────────────────────────── */

export async function apiListFavorites() {
  const res = await fetch('/api/favorites', { headers: authHeaders() });
  if (!res.ok) return [];
  return res.json();
}

export async function apiAddFavorite(job: any) {
  const res = await fetch('/api/favorites', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(job),
  });
  if (!res.ok) throw new Error('收藏失败');
  return res.json();
}

export async function apiRemoveFavorite(id: number) {
  const res = await fetch(`/api/favorites/${id}`, { method: 'DELETE', headers: authHeaders() });
  if (!res.ok) throw new Error('取消收藏失败');
  return res.json();
}

/* ── Compare ───────────────────────────────────────────────────────────── */

export async function apiCompareJobs(resumeText: string, jobA: any, jobB: any) {
  const res = await fetch('/api/compare', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ resume_text: resumeText, job_a: jobA, job_b: jobB }),
  });
  if (!res.ok) throw new Error('对比失败');
  return res.json();
}

/* ── Chat ──────────────────────────────────────────────────────────────── */

export async function apiSendChat(message: string) {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ message }),
  });
  if (!res.ok) throw new Error('发送失败');
  return res.json();
}

export async function apiGetChatHistory() {
  const res = await fetch('/api/chat/history', { headers: authHeaders() });
  if (!res.ok) return [];
  return res.json();
}

export async function apiClearChatHistory() {
  const res = await fetch('/api/chat/history', { method: 'DELETE', headers: authHeaders() });
  if (!res.ok) throw new Error('清空失败');
  return res.json();
}

/* ── Enhanced History ──────────────────────────────────────────────────── */

export async function apiDeleteHistory(id: number) {
  const res = await fetch(`/api/history/${id}`, { method: 'DELETE', headers: authHeaders() });
  if (!res.ok) throw new Error('删除失败');
  return res.json();
}

export async function apiGetHistoryDetail(id: number) {
  const res = await fetch(`/api/history/${id}`, { headers: authHeaders() });
  if (!res.ok) throw new Error('获取详情失败');
  return res.json();
}
