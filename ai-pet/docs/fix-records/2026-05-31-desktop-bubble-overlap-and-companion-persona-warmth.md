---
title: 桌宠气泡遮挡宠物与陪伴语气不足问题记录
description: 记录桌面端宠物气泡覆盖宠物本体，以及同源宠物消息缺少足够陪伴感、拟声词和角色卡示例约束的问题。
status: 已修复
created: 2026-05-31
updated: 2026-05-31
doc_type: fix-record
domain_taxa:
  - desktop-runtime
  - dog-persona
  - prompt-library
  - speech-bubble
related:
  - ../architecture/agent-runtime-dog-persona-and-bubble-lifecycle-2026-05-31.md
  - ../architecture/desktop-pet-app-window-linkage-protocol-2026-05-30.md
  - ../modules/agent-chat-2026-05-30.md
---

# 桌宠气泡遮挡宠物与陪伴语气不足问题记录

## 事实时间线

- 2026-05-31 用户截图显示：桌面端宠物的文字气泡位于同一个透明桌宠窗口内部，长文本覆盖到宠物头部和身体，降低桌宠存在感。
- 用户进一步指出：应用聊天和桌面宠物气泡是同一条消息来源，不允许为了桌宠单独生成一版更短文案。
- 用户要求回复语气更有 warm 陪伴感，可以借鉴网络上 Neko/猫娘角色 prompt 的写法，但转译成当前狗狗陪伴角色，不能照搬猫娘设定。

## 证据引用

- 代码证据：`desktop/photo-pet/renderer.html` 中 `.speech` 与 `.pet-wrap` 同在桌宠窗口内部。
- 样式证据：`desktop/photo-pet/styles.css` 中 `.speech` 使用绝对定位 `left: 35px; top: 42px; max-width: 220px;`，桌宠窗口仅约 `320x320`，长文本无法避开宠物本体。
- 架构证据：`architecture/agent-runtime-dog-persona-and-bubble-lifecycle-2026-05-31.md` 明确 `ThreadMessage` 是用户可见消息唯一文本事实源，对话页和桌宠气泡必须渲染同一条 `ThreadMessage.text`。

## 根因

1. 桌宠气泡被实现为桌宠窗口内部的 DOM 节点，受 `320x320` 透明窗口边界限制；气泡一长就只能覆盖宠物，无法放到宠物窗口外侧。
2. 角色 prompt 仍偏向“规则说明 + 少量示例”，虽然已有狗狗语气约束，但陪伴关系、生活场景、拟声词频率和动作旁白缺少足够多的正向示例来稳定输出。
3. 本地 fallback、主动提醒和 OpenCode prompt 虽然都接入 Dog Persona，但示例密度和措辞没有完全按成熟角色卡的方式统一。

## 外部参考

- SillyTavern Character Card / Prompts 文档：角色输出由角色描述、世界/场景、历史消息、示例消息和后置指令共同影响；示例消息比抽象规则更能稳定语气。
- Character.AI Character Book：Dialog Definitions 用角色名和用户名的多轮示例建模角色说话方式；Negative Guidance 用情境方式要求角色保持人设。
- Neko/猫娘 prompt 示例的可借鉴点：明确主人关系、依赖和关心；固定但可控的口癖；动作与语气结合；用专属物品和场景强化角色一致性。

## 修复计划

1. 保持同源消息：桌宠气泡继续展示同一条 `ThreadMessage.text`，不为桌宠生成第二版文案。
2. 桌宠 UI 修复：将气泡从桌宠窗口内部 DOM presentation 升级为独立透明气泡窗口，跟随桌宠位置，优先显示在宠物上方或侧上方，避免覆盖宠物本体。
3. Prompt 修复：把 Neko/角色卡写法转译成狗狗陪伴角色，补强 visible identity、relationship、living scene、affection loop、speech habits、example dialogues 和 hard boundaries。
4. 兜底一致性：同步更新本地 persona fallback、主动提醒 prompt 和硬编码主动提醒文本，避免模型失败时退回偏系统化或偏冷的表达。
5. 验证：运行 typecheck/build；启动完整 `desktop/photo-pet` 链路，检查气泡不遮挡宠物、应用聊天和桌宠气泡仍读取同一条消息。

## 实际修复

- `desktop/photo-pet/main.cjs` 新增独立透明 speech bubble window，按桌宠窗口位置计算上方/侧上方展示位置；应用窗口打开时隐藏气泡，关闭后恢复桌宠轮询。
- `desktop/photo-pet/preload.cjs` 与 `runtime.js` 新增 `showSpeechBubble` / `hideSpeechBubble` IPC，原有 `ThreadMessage` 去重和 8 秒生命周期保持不变。
- 新增 `desktop/photo-pet/bubble.html`、`bubble-preload.cjs` 承载独立气泡 presentation。
- `.opencode/prompts/ai-pet-companion.md`、`src/domain/agent.ts`、`server/agent.ts`、`server/petEventRuntime.ts`、`server/opencodeAgent.ts` 已补充角色卡式陪伴表达、拟声词频率、动作旁白、正向示例和同源消息约束。

## 验证结果

- `git diff --check` 通过。
- `node --check desktop/photo-pet/main.cjs`、`preload.cjs`、`bubble-preload.cjs` 通过。
- `npm run typecheck` 通过。
- `npm run build` 通过。
- `npx tsx` 本地 fallback 样例验证通过：“我有点累，先不想看数据”“你怎么突然冒出来了？”“晚点再帮你看肚皮”“请转个圈”均返回更有陪伴感的狗狗表达。
- 完整 `npm run dev` Electron 链路验证通过：注入 `/api/desktop-pet/say` 后，桌宠气泡以独立窗口展示在宠物外侧，没有覆盖狗头或身体；点击桌宠打开应用窗口时气泡隐藏，关闭应用窗口后桌宠恢复。
