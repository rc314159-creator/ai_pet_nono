---
title: MVP 机会与产品启发
description: 从宠物社区与 AI 宠物项目调研提炼 AI Pet MVP 的功能机会、优先级和安全边界。
status: 起草中
created: 2026-05-30
updated: 2026-05-30
update_reason: 新增 MVP 启发与落地建议
related:
  - ai-pet/docs/plan/mvp-scope.md
  - ai-pet/docs/plan/feature-lock.md
  - ai-pet/docs/research/pet-community-ai-ecosystem/community-projects.md
  - ai-pet/docs/research/ai-pet-health-projects-2026-05-30.md
---

# MVP 机会与产品启发

## 一句话裁决

AI Pet 第一版不做“大社区”，但必须做出社区感：真实宠物档案驱动的桌宠、每日照护任务、AI 问答、库存推荐、健康趋势和轻量挑战/排行榜。社区功能应先作为“任务结果和宠物状态的展示层”，不是作为开放 UGC 平台。

## 第一版应吸收的能力

### 1. 宠物档案变成所有模块的统一身份

来源启发：PetMeet、Petzbe、Petnow、萌宠圈。

落地方式：

- `PetProfile` 包含真实信息、外观描述、照片引用、健康禁忌、行为偏好、社交展示名。
- 虚拟宠物形象、桌宠气泡、AI 回答、推荐约束和社区挑战全部引用同一档案。
- 预留 `identity_signals`：nose print、face embedding、microchip、QR profile，不进第一版真实识别。

### 2. 健康数据从“指标”升级为“个体基线”

来源启发：PetPace、Maven、Moggie、Tractive、Petivity、Whisker。

落地方式：

- mock 数据必须包含：activity、sleep、heart_rate、respiration、temperature、scratch、bark/meow、hydration、feeding、litterbox、weight、gps/geofence。
- 每个指标输出：当前值、7 天趋势、个体基线、异常程度、任务建议。
- 桌宠气泡不要说“诊断为 X”，只能说“这个变化值得观察/需要联系兽医”。

### 3. AI 问答必须绑定单只宠物和最近事件

来源启发：PetMeet PawPal、PawSpace、Joii/Vet-AI、Everfur。

落地方式：

- 问答 prompt 上下文固定注入：宠物档案、最近 7 天健康摘要、今日任务、库存、禁忌、安全边界。
- 回答结构：直接结论、依据、今天怎么做、什么时候看兽医、是否需要记录。
- 每次健康问答自动沉淀为 `care_note`，便于生成给兽医看的时间线。

### 4. 商品推荐由任务和库存触发

来源启发：波奇、BringFido、PawSpace、Chewy/Joii。

落地方式：

- 推荐只能由库存不足、任务需要、年龄阶段、过敏/疾病约束触发。
- 每个推荐卡必须解释：为什么现在推荐、和这只宠物什么数据相关、哪些约束已避开。
- 不做自动购买，不做泛 feed。

### 5. 轻量社区先做挑战和故事卡

来源启发：PetMeet Events/Profile、BarkHappy events、Meetup Dogs、萌宠圈热榜。

第一版展示：

- 今日挑战：遛狗 30 分钟、猫咪梳毛、饮水观察、训练 10 分钟。
- 排行榜：社区挑战展示 mock 数据，不需要真实 UGC。
- 分享卡：由桌宠生成“今天 Mochi 完成了 X，因为 Y 数据改善”。

第二阶段再考虑：

- 真实用户动态。
- 本地活动。
- 丢宠广播。
- 关注/私信。
- 内容审核。

## 不应第一版做的事

- 不做完整开放社区，因为 UGC 审核、交易、送养、医疗建议和未成年人内容风险很高。
- 不接摄像头实时识别作为第一版主线，Furbo/Petcube 的场景先用 mock `camera_event` 模拟。
- 不承诺 AI 诊断、处方、痛感判断、癫痫检测或失踪宠物找回。
- 不把 Live2D/3D/机器人作为核心阻塞项，第一版保持 OpenPets 桌宠 + 点击后应用窗口 + mock 数据。

## 数据模型新增建议

```ts
type CommunityPreview = {
  challengeId: string;
  title: string;
  petId: string;
  metricTarget: string;
  progress: number;
  explanation: string;
};

type HealthBaselineSignal = {
  petId: string;
  metric: string;
  value: number;
  baseline: number;
  trend7d: "up" | "down" | "stable";
  anomalyLevel: "none" | "watch" | "vetSoon" | "emergency";
  evidence: string[];
};

type CareEvent = {
  petId: string;
  source: "manual" | "mockWearable" | "mockCamera" | "mockLitterbox" | "aiChat";
  category: "feeding" | "hydration" | "activity" | "sleep" | "skin" | "wound" | "litterbox" | "behavior" | "inventory";
  summary: string;
  createdAt: string;
  linkedTaskId?: string;
};
```

## 推荐实现顺序

1. 先把 mock 设备数据扩展成“基线 + 趋势 + 异常事件”。
2. 把 AI 问答改成固定引用宠物档案、健康摘要、库存和任务。
3. 在桌宠弹出的应用窗口中增加“社区挑战预览”和“分享卡”区域。
4. 让 OpenPets 桌宠接收三类气泡：照护提醒、健康观察、挑战进度。
5. 最后再考虑丢宠/身份识别和真实硬件 API。
