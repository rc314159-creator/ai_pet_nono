# iPET / REDnote Pet Behavior Understanding Challenge

- 类型：论文/数据集/挑战。
- 来源：[ACL Anthology 2025 论文页](https://aclanthology.org/2025.acl-long.671/)
- 当前状态：2025 年 ACL 论文项目。
- AI 结合：真实宠物视频/行为理解，关注宠物行为、状态和语言描述。

## 能力方向

项目关注真实宠物行为理解，而不是虚拟宠物养成。它对“真实宠物数字分身”的数据解释层很关键。

## 可复用点

- 给真实宠物视频建立行为标签和语义解释。
- 可把行为理解结果映射到任务：抓挠、吠叫、活动低、异常姿态等。
- 为 AI 问答提供视觉证据，而不是只靠用户手填。

## 风险与限制

- 数据集能力不等于可直接上线。
- 视觉误判必须有置信度和用户复核。

## 对 AI Pet 的启发

MVP 的 mock device packet 应预留 `confidence`、`evidence`、`behavior_label` 字段，方便未来接真实视觉模型。
