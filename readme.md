# Vue 3.4 源码实现

## 技术栈

- pnpm workspace
- monorepo
- typescript
- esbuild
- node 18

## 环境搭建

- 初始化项目

```bash
pnpm init -y
```

- 安装依赖

```bash
pnpm add esbuild http-server minimist typescript -w -D
pnpm add vue -S
```

- 安装工作区依赖

```bash
pnpm add @g-vue-next/shared@workspace --filter @g-vue-next/reactivity
```

- 配置脚本

```json
{
  "scripts": {
    "dev": "node scripts/dev.js",
    "dev-reactivity": "node scripts/dev.js reactivity -f all",
    "dev-runtime-core": "node scripts/dev.js runtime-core -f all",
    "dev-shared": "node scripts/dev.js shared -f all",
    "dev-vue": "node scripts/dev.js vue -f all",
    "preview": "http-server -d -p 9090 -o /examples/"
  },
}
```

## 目录结构

```tree
├── examples
│   └── reactivity
│       └── reactivity.html
├── LICENSE
├── node_modules
├── package.json
├── packages
│   ├── reactivity
│   │   ├── package.json
│   │   └── src
│   │       └── index.ts
│   ├── shared
│   │   ├── package.json
│   │   └── src
│   │       ├── general.ts
│   │       └── index.ts
│   └── vue
│       ├── package.json
│       └── src
│           └── index.ts
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
├── readme.md
├── scripts
│   └── dev.js
└── tsconfig.json
```

## 项目打包

```bash
pnpm dev # 打包所有子包
pnpm dev-xxx # 打包指定的子包
# 手动打包指定的子包
# xxx 为子包的目录名
# yyy 为打包的格式，有 global、esm、cjs
node scripts/dev.js xxx -f yyy
```

## 项目测试

```bash
pnpm preview
```
