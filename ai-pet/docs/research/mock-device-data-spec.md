# Mock 设备数据规格

日期：2026-05-29

## 依据

MVP 需要自己仿造一批项圈/手环设备数据，先不依赖真实硬件。字段参考公开设备能力：

- FitBark 官方开发者页说明其 API 让第三方应用集成 FitBark 数据集；FitBark 帮助中心列出 Developer API 文章，包括 GPS/location、Rest/Active/Play minutes、Sleep Score、Health Index、Calorie Expenditure。
- FitBark 设备公开说明包含 BarkPoints、rest/active/play time、nocturnal sleep score、overall health index、activity index、calorie burn、distance traveled。
- Tractive 帮助中心说明健康监测覆盖 activity、sleep、resting heart rate、resting respiratory rate；狗还包括 barking、separation anxiety、scratch monitoring。Tractive 也明确不是医疗设备，不能用于诊断。
- Tractive 睡眠页说明 sleep summary 包含 night sleep、day sleep、calm、night sleep quality、interruptions、sleep phases，超过 20 分钟 rest 才算 sleep。
- 2026-05-30 14:36 MVP 功能设计讨论明确：数据不是给用户看流水账，而是用于驱动桌宠状态、异常提醒、异常报告和周期健康总结；摄食、运动、睡眠、定位、动物特殊行为和人工护理记录是当前必须覆盖的展示域。

## Mock 数据分层

### 1. PetProfile

真实宠物档案：

- species、breed、ageMonths、sex、neutered
- weightKg、bodyConditionScore、targetWeightKg
- allergies、conditions、medications
- diet：currentFood、dailyGrams、feedingWindows、treatLimitKcal
- appearance：coatColor、pattern、earShape、tail、eyeColor、distinctiveMarks
- personality：energyStyle、sociability、toyPreference、anxietyTriggers

### 2. DeviceBinding

设备绑定：

- provider：`fitbark_mock`、`tractive_mock`、`petpace_mock`
- deviceId
- batteryPct
- signal
- syncMode：bluetooth、lte、wifi、manual
- lastSyncAt
- confidence

### 3. DailySummary

日级数据，至少 14 天：

- date
- barkPoints
- activityIndex
- healthIndex
- sleepScore
- restMinutes
- activeMinutes
- playMinutes
- caloriesKcal
- distanceMeters
- stepsEstimate
- restingHeartRateBpm
- restingRespirationRpm
- skinTempC
- scratchMinutes
- barkEvents
- waterMl
- foodGrams
- stoolQuality
- notes

### 4. StreamPacket

实时/近实时数据包，至少 24 小时按 30-60 分钟粒度：

- timestamp
- source
- activityState：rest、active、play、walk、sleep、unknown
- eatingState：idle、approaching_bowl、eating、drinking、unknown
- eatingRate：slow、normal、fast、unknown
- accelerometer：x/y/z summary
- location：lat/lon/accuracyM/geofence
- heartRateBpm
- respirationRpm
- skinTempC
- posture：standing、lying_left、lying_right、sitting
- scratchingSeconds
- barkingCount
- lickingSeconds
- groomingSeconds
- stressSignal：normal、elevated、high
- batteryPct
- signal
- confidence

### 5. ManualObservation

人工观察：

- category：wound、bath、appetite、feeding、drinking、stool、mood、medication、grooming、litter_cleaning
- severity
- note
- photoRefs
- createdAt

### 6. FeedingEvent

摄食事件可来自设备假设、喂食器或人工输入：

- startedAt
- endedAt
- foodType：dry_food、wet_food、treat、water、unknown
- amountGrams
- rateGramsPerMinute
- frequencyInWindow
- source：collar、feeder、manual、mock
- anomaly：none、too_fast、too_slow、too_much、too_little、skipped
- confidence

### 7. Inventory

库存：

- category：food、treat、cleaning、litter、medicine、toy
- quantity
- unit
- daysRemaining
- petConstraints
- reorderThreshold

## 任务生成规则

- 活动低于 7 日均值 25%：生成遛狗/玩耍任务。
- 进食量相对 7 日均值增加或减少 20%：生成异常观察和饮食检查任务。
- 长时间未进食：生成异常提醒，进入异常报告。
- 睡眠评分低或中断多：生成低强度活动和观察任务。
- 抓挠时间高于基线：生成皮肤检查/梳毛/必要时就医提醒。
- 吠叫异常且独自在家：生成分离焦虑观察任务。
- 饮水低：生成换水/提醒饮水任务。
- 洗澡间隔过长但皮肤无异常：生成洗澡/干洗任务。
- 有伤口观察记录：生成清洁观察任务；严重或连续异常时建议就医。
- 主粮/清洁用品/猫砂低于阈值：生成补货和商品推荐。

## LLM 使用约束

- LLM 只通过 llmmelon 中转站调用。
- 环境变量：`LLMMELON_API_KEY`。
- Base URL：`https://llmmelon.cloud/v1`。
- OpenAI 兼容 endpoint：`/chat/completions`。
- 无 key 时必须使用本地规则答案，保证 demo 可运行。
