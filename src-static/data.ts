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
    name: "王鹏",
    role: "AI 产品助理 / 数据分析助理 / 信息系统运维",
    location: "福州 · 应届生",
    tagline: "把岗位 JD、个人简历和 AI 分析链路合成一个可执行的求职 Agent。",
  },
  metrics: [
    { label: "岗位样本", value: "128", delta: "+36 本周", tone: "cyan" },
    { label: "高优先级", value: "24", delta: "建议先投", tone: "emerald" },
    { label: "平均匹配", value: "76%", delta: "+11% 优化后", tone: "violet" },
    { label: "待补技能", value: "6", delta: "SQL / RAG 优先", tone: "amber" },
  ],
  pipeline: [
    { step: "导入岗位", desc: "CSV / JSON 批量导入 JD", progress: 100 },
    { step: "AI 解析", desc: "提取技能、难度、应届适配", progress: 86 },
    { step: "简历匹配", desc: "匹配分、缺失技能、推荐理由", progress: 78 },
    { step: "投递策略", desc: "优先级、话术、面试题", progress: 64 },
  ],
  jobs: [
    {
      title: "AI 产品助理",
      company: "星河智能科技",
      city: "福州",
      salary: "6-9K",
      score: 92,
      priority: "高",
      type: "AI产品/运营",
      skills: ["Prompt", "LLM API", "需求分析"],
    },
    {
      title: "数据分析助理",
      company: "闽数云",
      city: "厦门",
      salary: "5-8K",
      score: 81,
      priority: "高",
      type: "数据分析",
      skills: ["Python", "Pandas", "可视化"],
    },
    {
      title: "平台实施运维",
      company: "政务数链",
      city: "福州",
      salary: "5-7K",
      score: 74,
      priority: "中",
      type: "信息系统/运维",
      skills: ["工单", "巡检", "文档"],
    },
  ],
  skillGaps: [
    { name: "SQL", count: 18 },
    { name: "RAG", count: 12 },
    { name: "Linux", count: 10 },
    { name: "Excel 高级函数", count: 9 },
    { name: "Pandas", count: 7 },
  ],
  features: [
    "岗位 JD 结构化解析",
    "简历匹配评分",
    "缺失技能统计",
    "岗位优先级排序",
    "一键生成定制简历",
    "面试题与 STAR 回答",
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
