---
title: AI Pet Mac Demo 安装交付方案
description: 记录如何把当前 Electron 桌宠 Demo 打包成 Mac 安装包、运行时依赖、env 打包边界和试用者安装方式。
status: 已批准
created: 2026-05-31
updated: 2026-05-31
update_reason: 用户要求把项目发送给 Mac 试用者，安装后可以直接运行。
doc_type: plan
domain_taxa:
  - desktop-runtime
  - ui-channel
  - agent-runtime
  - distribution
related:
  - ../architecture/current-system-architecture-2026-05-30.md
  - ../architecture/technical-architecture-2026-05-30.md
  - ../modules/live-knowledge-base-2026-05-31.md
---

# AI Pet Mac Demo 安装交付方案

## 结论

可以做到给 Mac 试用者一个可安装 Demo。交付对象应是 Electron 打包产物，不是源码压缩包，也不是浏览器网页。

当前最小可交付形态：

- `AI Pet Demo-0.1.0-mac-arm64.zip`：发给对方的压缩包。对方解压后点击 `AI Pet Demo.app` 图标即可启动。

该 zip 的 Electron 主入口是 `desktop-photo-pet/main.cjs`，启动后应显示照片级小狗桌宠。橙色 OpenPets built-in pet 是旧调试入口，不属于当前可交付安装包。

DMG 可作为后续安装体验增强项；当前按用户要求，交付重点收敛为 zip。

安装后 App 自己启动：

- 照片级桌宠窗口。
- 点击桌宠弹出的应用窗口。
- 本地 Express API。
- Agent fallback 和语音能力。
- 本地 thread store 与实时知识库 store。

## 关键限制

当前没有 Apple Developer ID 证书和 notarization 流程，因此生成的是未签名或临时签名 Demo。试用者第一次打开时，macOS 可能要求在“隐私与安全性”中允许，或右键选择“打开”。

如果要做到陌生 Mac 用户双击无警告安装，需要补充：

1. Apple Developer 账号。
2. Developer ID Application 证书。
3. `electron-builder` 签名配置。
4. Apple notarization。

这不影响当前同伴试用 Demo，但会影响正式对外分发体验。

## Env 和 API Key 打包

当前用户要求试用包内包含现有 API key，让对方安装后可直接使用。

实现方式：

- `npm run dist:mac`：默认不打包本地 `.env.local`，适合不带密钥的普通 zip 构建。
- `npm run dist:mac:demo`：把当前机器的 `.env.local` 复制到 `release-config/.env`，再作为 Electron `extraResources` 放入 zip 内的 App 资源目录。
- 打包运行时，Electron 主进程会把资源目录里的 `.env` 作为 `AI_PET_ENV_FILE` 交给 API 层读取。

这个 Demo 方案满足“安装后直接可用”，但密钥会随安装包分发，任何拿到安装包的人都可以提取资源文件。只应发给可信试用对象。

## 运行时数据位置

开发态：

- `.ai-pet-data/thread-store.json`
- `.ai-pet-data/knowledge-base.json`

打包态：

- `~/Library/Application Support/AI Pet Demo/data/thread-store.json`
- `~/Library/Application Support/AI Pet Demo/data/knowledge-base.json`

打包态不写入安装目录，避免只读 App bundle 导致运行失败。

## 验收标准

构建完成后至少验证：

1. `npm run typecheck` 通过。
2. `npm run build` 通过。
3. `npm run dist:mac` 或 `npm run dist:mac:demo` 产出 `release/*-mac-arm64.zip`。
4. 启动 `.app` 后先出现桌宠。
5. 点击桌宠打开应用窗口，桌宠隐藏。
6. 应用窗口“我的 -> 宠物知识库”可打开。
7. 发送聊天、保存配饰或完成任务后，知识库更新时间和对应条目实时变化。
8. 关闭应用窗口后桌宠恢复。
9. `GET /api/health` 的 `desktopPet` 字段为 `desktop-photo-pet`，不能把旧 OpenPets discovery 当成当前桌宠运行时。
