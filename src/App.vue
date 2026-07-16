<template>
  <router-view />
</template>

<style>
/* ===================================================================
   Design System — "Precision Console"
   一个面向工程团队后台管理的设计系统
   配色避开 AI 三大模板化风格:
   ✗ 暖奶油 + 衬线 + 陶土色
   ✗ 纯黑 + 酸绿/朱红
   ✗ 报纸风细线 + 零圆角
   =================================================================== */

/* ---- CSS Custom Properties ---- */
:root {
  /* Backgrounds */
  --app-bg: #f0f2f5;
  --app-bg-dark: #0f172a;
  --app-bg-surface: #ffffff;
  --app-bg-elevated: #f8fafc;
  --app-bg-sidebar: #1e293b;

  /* Text */
  --app-text: #1e293b;
  --app-text-secondary: #475569;
  --app-text-muted: #94a3b8;
  --app-text-inverse: #e2e8f0;

  /* Accent — 钢靛蓝，不是 Element 默认的 #409eff */
  --app-accent: #3b5998;
  --app-accent-hover: #4c6fae;
  --app-accent-light: #eff3fb;

  /* Semantic */
  --app-border: #e2e8f0;
  --app-success: #16a34a;
  --app-warning: #d97706;
  --app-danger: #dc2626;

  /* Typography */
  --font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans SC', sans-serif;
  --font-mono: 'JetBrains Mono', 'SF Mono', 'Fira Code', 'Cascadia Code', Consolas, monospace;

  /* Radii */
  --radius-sm: 6px;
  --radius: 8px;
  --radius-lg: 12px;

  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.04);
  --shadow: 0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.05), 0 2px 4px rgba(0, 0, 0, 0.04);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.06), 0 4px 6px rgba(0, 0, 0, 0.04);

  /* Transitions */
  --transition-fast: 150ms ease;
  --transition: 200ms ease;

  /* ---- Element Plus 全局覆盖 ---- */
  --el-color-primary: #3b5998;
  --el-color-primary-light-3: #4c6fae;
  --el-color-primary-light-5: #6b8cc4;
  --el-color-primary-light-7: #99b0d8;
  --el-color-primary-light-8: #c2cfe8;
  --el-color-primary-light-9: #e0e7f3;
  --el-color-primary-dark-2: #334d82;
  --el-color-success: #16a34a;
  --el-color-warning: #d97706;
  --el-color-danger: #dc2626;
  --el-border-radius-base: var(--radius);
  --el-border-radius-small: var(--radius-sm);
  --el-border-radius-round: 20px;
  --el-font-family: var(--font-sans);
  --el-text-color-primary: var(--app-text);
  --el-text-color-regular: var(--app-text-secondary);
  --el-bg-color: var(--app-bg-surface);
  --el-bg-color-page: var(--app-bg);
  --el-border-color: var(--app-border);
  --el-border-color-light: #e2e8f0;
}

/* ---- Reset ---- */
*,
*::before,
*::after {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: var(--font-sans);
  font-size: 14px;
  line-height: 1.6;
  color: var(--app-text);
  background-color: var(--app-bg);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

#app {
  min-height: 100vh;
}

/* ---- Typography defaults ---- */
h1, h2, h3, h4, h5, h6 {
  color: var(--app-text);
  font-weight: 600;
  line-height: 1.3;
}

/* ---- Scrollbar ---- */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}
::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

/* ---- Selection ---- */
::selection {
  background: rgba(59, 89, 152, 0.15);
  color: var(--app-text);
}

/* ---- Link ---- */
a {
  color: var(--app-accent);
  text-decoration: none;
}
a:hover {
  color: var(--app-accent-hover);
}
</style>
