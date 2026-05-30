# 健康监测与设备数据调研

日期：2026-05-29

## 目标

虚拟宠物可以绑定真实宠物实时数据，也可以不绑定。绑定时，真实宠物设备数据驱动虚拟宠物状态；未绑定时，使用手动记录、周期任务和 AI 问答补齐。

## 第一版数据策略

MVP 不应把成功依赖在某个项圈/手环厂商 API 上。原因：

- 宠物设备厂商公开 API 覆盖不稳定。
- 很多设备只提供 App，不提供公开开发者 API。
- 健康数据解释需要安全边界，不能直接把设备指标转成医疗诊断。

第一版应该做统一 adapter 层：

- `ManualInputAdapter`：用户手动记录喂食、饮水、排便、洗澡、伤口、情绪。
- `MockWearableAdapter`：模拟活动量、睡眠、心率、位置、异常事件，用于产品验证。
- `CsvImportAdapter`：导入设备导出的 CSV/JSON。
- `VendorAdapter`：后续接 FitBark、PetPace、Tractive 等厂商。

## 可调研厂商方向

### FitBark

- 官方开发者入口：[FitBark Developer API](https://www.fitbark.com/dev/)
- 可关注数据：
  - activity/health index
  - sleep/rest
  - goals
  - user/dog profile
- 价值：
  - 更适合 MVP 做真实 API 验证，因为官方有 developer API 页面。
- 风险：
  - 需要申请 key 和确认 API 可用范围。

### PetPace

- 官网：[PetPace](https://petpace.com/)
- 设备定位：
  - 宠物健康监测项圈，关注生命体征和异常提醒。
- 可关注数据：
  - temperature
  - pulse/heart related metrics
  - respiration
  - activity/posture
- 价值：
  - 医疗/健康监测场景强。
- 风险：
  - 公开开发者 API 不明确，可能更偏 B2B/企业合作。

### Tractive / Whistle 等 GPS 追踪器

- 主要价值：
  - GPS、位置、安全围栏、活动量。
- 风险：
  - 公开 API 不稳定或需要非官方方式。
  - 第一版不要依赖非官方逆向 API。

## 健康数据到虚拟宠物状态映射

| 真实数据 | 虚拟状态影响 | 任务建议 |
|---|---|---|
| 今日活动低 | Energy 不一定低，但 mood/fitness trend 降低 | 遛狗、玩耍、室内互动 |
| 睡眠不足 | Energy 降低，宠物表现疲惫 | 减少激烈运动，观察压力源 |
| 饮水少 | Hydration 风险升高 | 换水、提醒饮水、观察尿量 |
| 食量异常 | Fullness 和 health flags 更新 | 记录食欲，连续异常建议就医 |
| 体重上升 | fitness trend 下降 | 调整喂食量，增加活动 |
| 伤口/皮肤异常 | health alert | 清洁观察，严重时建议就医 |
| 洗澡间隔过长 | cleanliness 下降 | 洗澡/梳毛/清洁任务 |
| 库存不足 | inventory alert | 推荐主粮、清洁用品、猫砂等 |

## 医疗安全边界

- AI 可以解释“为什么需要观察”和“什么情况需要就医”。
- AI 不直接诊断疾病，不给处方，不替代兽医。
- 用药提醒只能来自用户或兽医已录入计划。
- 商品推荐必须避开过敏、疾病、年龄和体重禁忌。

## 第一版接口

- `ingest_metric(source, metric_type, value, timestamp, confidence)`
- `record_observation(category, note, severity, photos)`
- `get_health_summary(pet_id, window)`
- `detect_care_flags(pet_id)`
- `plan_daily_tasks(pet_id)`
- `recommend_products(pet_id, task_id, inventory_state)`

## 健康监测裁决

第一版做 adapter 和 mock，不强依赖真实硬件。优先把数据模型和任务/推荐闭环跑通；第二阶段接 FitBark 这类有开发者 API 的设备；医疗级设备如 PetPace 走合作验证。
