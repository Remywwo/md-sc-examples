# md-sc

> Markdown WYSIWYG editor engine — Rust 核心编译为 WebAssembly，TypeScript SDK 封装，React / Vue 3 适配器开箱即用。

## 项目结构

```
md-sc/                  ← 引擎主仓库（Rust crates + npm 包）
├── crates/
│   ├── md-sc-core/        解析器内核（block + inline tokenizer）
│   ├── md-sc-render-html/ HTML 渲染层
│   ├── md-sc-wasm/        wasm-bindgen 入口
│   └── ...
├── bindings/
│   ├── md-sc-sdk/         @md-sc/sdk（vanilla TS 核心，private）
│   ├── md-sc-react/       @md-sc/react（React 18 hooks + 组件）
│   └── md-sc-vue/         @md-sc/vue（Vue 3 composition + 组件）
│
md-sc-examples/          ← 本仓库（示例 & 官网）
└── examples/
    ├── web-demo/           React 编辑器 demo
    ├── vue-demo/           Vue 3 编辑器 demo
    └── website/            官方 Landing Page
```

## 特性

- **WYSIWYG 编辑器** — contentEditable 实现，支持 Markdown 快捷键和输入规则
- **Rust + WASM** — 解析引擎用 Rust 编写，编译为 WebAssembly，< 80 KB gzip
- **框架适配器** — React（hooks + 组件）和 Vue 3（composition API）一等支持
- **GFM 扩展** — 表格、删除线、任务列表、自动链接
- **主题系统** — CSS 自定义属性，亮色 / 暗色切换，插件化样式覆盖
- **零配置嵌入** — SDK 为自包含 JS 文件（wasm 内联），放入任何 Vite / Next.js / Nuxt 项目即可使用

## 快速开始

### 前置条件

- Node.js ≥ 18
- pnpm ≥ 9

### 1. 克隆并启动主仓库

```bash
git clone https://github.com/Remywwo/md-sc.git
cd md-sc
pnpm install
pnpm build          # 构建 @md-sc/sdk、@md-sc/react、@md-sc/vue
```

### 2. 克隆并启动示例

```bash
git clone https://github.com/Remywwo/md-sc-examples.git
cd md-sc-examples
pnpm install
```

### 3. 运行 demo

```bash
# React demo（WYSIWYG + Source + Split 三视图）
pnpm dev:web        # http://localhost:5173

# Vue 3 demo（完整复刻 React 版功能）
pnpm dev:vue        # http://localhost:5174

# 官网（Hero + 特性展示 + 实时 demo）
pnpm dev:website    # http://localhost:5175
```

## 使用教程

### 在 React 项目中使用

```bash
pnpm add @md-sc/react react react-dom
```

```tsx
import { useEngine, useEditor, EditorView, injectDefaultTheme } from '@md-sc/react';

function App() {
  // 1. 加载 WASM 引擎（异步，缓存单例）
  const engine = useEngine();

  // 2. 挂载编辑器
  const editor = useEditor({
    engine,
    initial: '# Hello, **md-sc**!',
    onChange: (markdown) => console.log('内容更新:', markdown),
  });

  // 3. 注入内置主题
  useEffect(() => {
    if (engine) injectDefaultTheme();
  }, [engine]);

  if (!editor) return <p>加载中…</p>;
  return <EditorView editor={editor} />;
}
```

### 在 Vue 3 项目中使用

```bash
pnpm add @md-sc/vue vue
```

```vue
<script setup lang="ts">
import { useEngine, useEditor, EditorView, injectDefaultTheme } from '@md-sc/vue';
import { watch } from 'vue';

const engine = useEngine();
const editor = useEditor({
  engine,
  initial: '# Hello, **md-sc**!',
  onChange: (md) => console.log('内容更新:', md),
});

watch(engine, (e) => {
  if (e) injectDefaultTheme();
});
</script>

<template>
  <p v-if="!engine">加载中…</p>
  <EditorView v-else :editor="editor" />
</template>
```

### API 参考

#### Engine 实例

```ts
const engine = await loadEngine();

// 解析 Markdown 为 AST
const ast = engine.parseAst('# Hello');

// 解析为事件流（调试用）
const events = engine.parseEvents('# Hello');

// 渲染为 HTML
const html = engine.renderHtml('# Hello');

// 统计信息
engine.lineCount(source);   // 总行数
engine.byteCount(source);   // 字节数
```

#### Editor 实例

```ts
const editor = createEditor(container, initial, { engine, onChange });

editor.getMarkdown();          // 获取当前 Markdown 源码
editor.setMarkdown('# New');   // 替换全部内容
editor.setOnChange((md) => {});// 更新回调
editor.destroy();              // 销毁编辑器
```

#### 主题

```ts
// 注入引擎内置主题
injectDefaultTheme();

// 注册样式插件（覆盖内置变量）
const cleanup = registerThemePlugin('my-theme', `
  :root { --md-code-bg: #f5f5f5; }
  :root[data-theme="dark"] { --md-code-bg: #1a1a2e; }
`);

// 卸载
cleanup();
```

### 输入规则（自动格式化）

在编辑器中直接输入 Markdown 语法，自动转换为富文本：

| 输入 | 效果 |
|------|------|
| `**文本**` | **粗体** |
| `*文本*` | *斜体* |
| `` `代码` `` | `行内代码` |
| `~~文本~~` | ~~删除线~~ |
| `# 标题` | H1 标题 |
| `> 引用` | 引用块 |
| `- 列表` | 无序列表 |
| `1. 列表` | 有序列表 |

### 快捷键

| 按键 | 操作 |
|------|------|
| `Backspace`（空标题开头） | 降级为段落 |
| `Backspace`（空段落开头） | 删除段落 |
| `Backspace`（格式边界） | 还原为 Markdown 语法 |
| `Delete`（格式边界） | 还原为 Markdown 语法 |
| `Tab` | 插入 2 空格缩进 |

## 架构

```
┌─ Rust（WebAssembly）──────────────────────────┐
│  md-sc-core                                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────────┐ │
│  │ Tokenizer │→│ Resolver │→│ AST Builder   │ │
│  │ (块+内联) │  │ (强调平衡)│  │ (JSON 输出)  │ │
│  └──────────┘  └──────────┘  └──────────────┘ │
│                     ↓                          │
│  md-sc-render-html → renderHtml()              │
└────────────────────────────────────────────────┘
         │ wasm-bindgen
         ▼
┌─ @md-sc/sdk（TypeScript 核心）────────────────┐
│  loadEngine() → Engine 句柄（同步 API）        │
│  createEditor() → contentEditable WYSIWYG      │
│  injectDefaultTheme() / registerThemePlugin()  │
└────────────────────────────────────────────────┘
         │
    ┌────┴────┐
    ▼         ▼
@md-sc/react  @md-sc/vue
(React hooks  (Vue composition
 + 组件)       + 组件)
```

## 参与贡献

- 主仓库：[md-sc](https://github.com/Remywwo/md-sc)
- Issue / PR 欢迎提交
- 许可：MIT OR Apache-2.0
