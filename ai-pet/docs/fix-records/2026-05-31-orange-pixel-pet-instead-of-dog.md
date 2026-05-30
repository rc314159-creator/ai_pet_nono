---
title: 桌宠显示橙色像素宠物而不是小狗问题记录
description: 记录桌宠入口被旧像素宠物/错误运行入口替代的事实、证据、根因排查计划和修复验证。
status: 执行中
created: 2026-05-31
updated: 2026-05-31
update_reason: 用户反馈当前桌面显示橙色像素宠物，不符合项目小狗桌宠方向。
related:
  - ../architecture/current-system-architecture-2026-05-30.md
  - ../modules/pet-appearance-2026-05-31.md
  - ../plan/mac-demo-distribution-2026-05-31.md
---

# 桌宠显示橙色像素宠物而不是小狗问题记录

## 事实时间线

- 2026-05-31，用户在打包/安装流程讨论后上传截图，截图中桌面显示黑色背景、左侧多处“点击”文字、中央是橙色像素宠物。
- 项目当前产品与架构结论要求默认桌宠是 `desktop-photo-pet` 照片级小狗形象，OpenPets/像素宠物只能作为旧调试或备选入口。
- 当前需要确认用户看到的是旧进程、错误启动脚本、打包入口错误，还是打包产物实际引用了旧像素宠物资源。

## 证据引用

- `ai-pet/docs/INDEX.md` 当前结论写明：默认使用 `desktop-photo-pet` 的照片级 Electron 桌宠集成入口，OpenPets 降为旧调试/备选入口。
- `desktop-photo-pet/renderer.html` 当前入口是 canvas 照片级桌宠渲染器，不包含截图中的橙色像素宠物或“点击”文字。
- `package.json` 的 Electron `main` 指向 `desktop-photo-pet/main.cjs`，打包入口理论上应进入照片级小狗桌宠。

## 初步根因假设

- 高概率是旧 OpenPets/像素宠物 Electron 进程仍在运行，或用户/本机启动了旧调试脚本，导致看到的不是当前 `AI Pet Demo.app` 打包入口。
- 次级可能是某个旧入口仍暴露在脚本或文档中，导致“发给别人安装使用”的流程不够唯一，用户误打开了错误入口。
- 需要通过进程列表、端口占用、当前打包 app 内容和实际启动截图确认最终根因。

## 修复计划

1. 检查本机正在运行的 Electron、OpenPets、`AI Pet Demo`、Node server 进程，确认截图来源。
2. 检查打包产物和入口脚本，确保 `AI Pet Demo.app` 只加载 `desktop-photo-pet/main.cjs` 与 Mochi 小狗资源。
3. 如发现旧进程或旧默认脚本，停止旧进程，并把默认启动/验证说明收敛到当前小狗入口。
4. 如发现健康检查、文档或脚本仍把 OpenPets 作为默认桌宠口径，改为明确的照片级小狗入口，OpenPets 仅保留为 legacy/debug。
5. 重新启动当前 app 做视觉验证，确认桌面出现小狗而非橙色像素宠物。

## 排查结果

- 本机进程检查未发现正在运行的 `AI Pet Demo.app` 或 `desktop-photo-pet` Electron 进程；当前只发现开发态 Vite/API 服务。
- `release/mac-arm64/AI Pet Demo.app/Contents/Resources/app.asar` 中包含 `desktop-photo-pet/main.cjs`、`renderer.html`、`runtime.js` 和 `styles.css`，未发现 OpenPets 入口。
- `package.json` 主入口为 `desktop-photo-pet/main.cjs`，打包 zip 理论上会进入照片级小狗桌宠。
- 代码中仍存在误导性脚本：`npm run dev:desktop` 实际启动 `scripts/run-openpets-dev.mjs`，会打开旧 OpenPets built-in pet。该 built-in pet 与用户截图中的橙色像素宠物一致。
- `/api/health` 之前把旧 OpenPets discovery 报告为 `desktopPet: "openpets-discovered"`，会让验证记录继续把旧入口误认为当前桌宠。

## 最终根因

当前 zip/app 打包入口没有变成橙色像素宠物；问题根因是项目里仍保留了旧 OpenPets 调试路径，并且 `dev:desktop` 这个通用命名指向了旧 OpenPets。用户或开发验证如果按“desktop”含义启动旧入口，就会看到 OpenPets built-in 橙色像素宠物，而不是当前 Demo 的小狗。

## 已执行修复

- `package.json` 已把 `npm run dev:desktop` 改为当前 `desktop-photo-pet` 小狗桌宠入口。
- 旧 OpenPets 启动命令改为显式 `npm run dev:openpets-desktop`，`npm run dev:openpets-app` 也改为使用这个显式旧入口。
- `/api/health` 的 `desktopPet` 字段改为 `desktop-photo-pet`，并把旧 OpenPets discovery 放到 `legacyOpenPets` 字段。
- `/api/desktop-pet/status` 改为返回当前小狗桌宠运行时和 `旺财` 身份。
- `/api/desktop-pet/say` 改为写入当前小狗桌宠读取的主线程气泡，而不是再发给 OpenPets。
- OpenPets 原 status/say 能力保留在 `/api/legacy/openpets/status` 和 `/api/legacy/openpets/say`，仅用于旧兼容验证。

## 当前状态

- 待重新构建、启动和视觉验证，确认桌面显示小狗而不是橙色像素宠物。
