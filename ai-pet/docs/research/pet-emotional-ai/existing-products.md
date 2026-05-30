---
title: 现有宠物情感陪伴与 AI 产品专项调研
description: 2026-05-30 对已经可购买、可下载、可订阅、可由诊所采购或明确可预约的宠物情感陪伴与 AI 产品做产品化调研。
status: 完成
created: 2026-05-30
updated: 2026-05-30
update_reason: 用户补充要求调研已经存在的产品
related:
  - ai-pet/docs/research/pet-emotional-ai/INDEX.md
  - ai-pet/docs/research/pet-emotional-ai/project-cards.md
  - ai-pet/docs/research/existing-pet-health-products-2026-05-30.md
---

# 现有宠物情感陪伴与 AI 产品专项调研

日期：2026-05-30  
口径：本页只收录“已经存在”的产品，定义为官网、官方帮助页、应用商店、官方店铺、零售渠道或 B2B 采购页显示可购买、可下载、可订阅、可预约 demo、可加入 waitlist 的产品。价格、地区、订阅和供货状态以 2026-05-30 公开页面可见信息为准，后续可能变化。

## 总体结论

已经存在的产品可以分成六类：

1. **远程陪伴摄像头**：Furbo、Petcube、PETLIBRO Scout、eufy D605、PetChatz、Dogness 等已经把“看、听、说、投食、录像、事件提醒”做成成熟产品。它们是最接近“真实宠物离家陪伴”的已上市形态。
2. **移动家庭陪伴机器人**：Enabot EBO/ROLA、VARRAM 等可以移动巡航、陪玩和投食；这类产品存在，但 AI 情绪理解一般弱于营销表达。
3. **人类情感机器人宠物**：Moflin、aibo、Loona、EMO、LOVOT、Joy for All、PARO 已经证明“被照顾、被回应、人格成长、触摸反馈”能形成情感连接，但它们主要陪人，不直接照护真实宠物。
4. **宠物叫声/痛感/健康 App**：MeowTalk、CatsMe、Tably、TTcare、Pawzy、SafePet AI、LunaDogAI、Joii、Buddydoc 等已可下载或订阅。它们证明宠物主愿意为“理解宠物”和“下一步建议”付费。
5. **连续健康/行为设备**：Tractive、FitBark、PetPace、Invoxia、Maven、Catlog、Moggie、Fi 等已经存在，并且比单次聊天更适合作为 AI Pet 的长期状态输入。
6. **猫砂盆/喂食/饮水产品**：Petivity、Litter-Robot 5 Pro、PETKIT Purobot、SiiPet LitterLens、CATLINK、Petlibro RFID、SureFeed 等已经把排泄、体重、饮食和饮水变成低摩擦数据源。

对 AI Pet 的关键判断：

- 已有产品多数是**单入口工具**，没有把真实宠物数据、情绪解释、桌宠表达、任务提醒和兽医摘要合成一个连续体验。
- “可购买的真实宠物陪伴产品”目前主要是摄像头和移动摄像头，不是完全自主 AI 机器人保姆。
- 最值得第一阶段借鉴的是 Furbo/Petcube 的事件日记、Pawzy 的档案和报告、FitBark/Tractive 的长期指标、Petivity/PETKIT/SiiPet 的猫排泄事件、Moflin/aibo 的人格成长表达。
- 需要把“已经上市”和“预售/待发货/waitlist”分开管理。Tombot、部分 AI robot 和部分 pet companion robot 即使官网存在，也不能当成熟可用能力。

## 现有产品矩阵

| 产品 | 存在形态 | 面向谁 | AI/智能能力 | 陪伴/情绪价值 | 对 AI Pet 的参考 |
|---|---|---|---|---|---|
| Furbo 360 Dog Camera / Cat Camera | 可购买硬件 + Furbo Nanny 订阅 | 真实狗/猫和宠物主 | Smart Alerts、活动/叫声/异常事件、AI advice/health insights | 双向语音、投食、宠物日记、离家安抚 | 高：摄像头事件、每日摘要和异常提醒 |
| Petcube Cam / Bites / Play + Care | 可购买硬件 + Care 订阅 | 真实狗/猫和宠物主 | AI Insights、宠物/人/吠叫/喵叫/动作事件 | 双向语音、激光/投食、云录像 | 高：CameraEvent/BarkEvent/MeowEvent schema |
| PETLIBRO Scout Smart Camera | 可购买/预售期硬件 + 云服务 | 真实狗/猫和宠物主 | AI pet detection、活动自动标注、视频自拍 | 看护、双向音频、投食生态 | 中高：轻量摄像头数据源 |
| eufy Pet Dog Camera D605 | 零售/区域可购买 | 狗和宠物主 | AI motion tracking、bark alerts、本地存储 | 双向音频、投食、跟踪狗移动 | 中：无云也能做基础陪伴 |
| PetChatz HDX | 可购买互动视频设备 | 真实宠物和宠物主 | 声音/动作触发录像，AI 弱 | 双向视频、投食、PawCall 宠物主动呼叫 | 中：宠物主动联系主人的交互形态 |
| Dogness Smart Cam Treater | 零售渠道可购买 | 真实宠物和宠物主 | AI 弱，App 远程控制 | 看、听、说、投食 | 低中：普通互动摄像头基线 |
| Enabot EBO / ROLA PetPal | 可购买移动机器人 | 家庭、宠物主、宠物 | 移动巡航、视觉/AI 识别、投食/互动 | 家庭成员远程陪玩、移动看护 | 中高：移动摄像头和巡航事件 |
| VARRAM Pet Fitness Robot | 可购买互动机器人 | 真实宠物 | 自动移动、游戏模式、投食 | 独处时运动和奖励 | 中：奖励频率和宠物福利限制 |
| ORo Dog Companion Robot | 商业产品/供货需确认 | 狗和宠物主 | AI 训练/陪伴/喂食 | 分离焦虑、训练、娱乐 | 中：训练任务和日程模型 |
| Moflin | Casio 官方可购买 | 人类用户 | emotional AI、触摸/声音识别、人格成长 | 抱持、抚摸、安抚、长期依恋 | 高：桌宠情绪成长和非语言表达 |
| Sony aibo | 官方产品 + AI Cloud Plan | 人类用户 | 云记忆、人格成长、识别环境和人 | 机器人狗陪伴 | 高：长期记忆、个性和订阅依赖 |
| Loona Petbot | 官方可购买 | 家庭/人类用户 | 视觉识别、语音/手势、GPT Voice Chat | 类狗表情、动作、游戏 | 中：动作和表情屏参考 |
| EMO | LivingAI 官方可购买 | 桌面用户 | 传感器、表情动作、桌面 AI pet | 桌面陪伴、存在感、小动作 | 中：桌面小宠反馈节奏 |
| LOVOT | 官方可购买/区域销售 | 家庭用户 | 多传感器、依恋互动 | 抱持、眼神、体温和被照顾感 | 中：反向陪伴，即用户照顾机器人 |
| Joy for All Companion Pets | 官方/零售可购买 | 老年人、照护机构、儿童 | AI 弱，传感交互 | 低成本情感陪伴猫狗 | 中：低技术高情感价值 |
| PARO therapeutic robot | 医疗/照护渠道销售 | 医院、养老、照护机构 | 传感和动物式反应，非 LLM | 治疗型安抚和互动 | 中：情感陪伴临床基线 |
| Tombot Jennie | waitlist/首批售罄 | 需要情感支持的人群 | 触摸、声音、动作、App 设置 | 高拟真机器人狗 | 中：waitlist，不能按成熟产品估计 |
| MeowTalk | iOS/Android App | 猫主人 | AI 猫叫解释，11 类意图，自称大规模叫声数据 | 帮宠物主理解猫叫，增强连接 | 中高：只能作为“可能意图” |
| CatsMe | App Store 可下载 | 猫主人 | 猫脸痛感识别 | 提醒猫不适和痛感风险 | 高：痛感/舒适度窄任务 |
| Sylvester.ai / Tably | App/API/合作渠道 | 猫主人、兽医/合作方 | 猫脸 CV + Feline Grimace Scale | 舒适度检查、是否看兽医 | 高：科学量表和边界表达 |
| TTcare | iOS/Android App | 狗/猫主人 | 眼睛、皮肤、关节、牙齿照片 AI 检查 | 日常健康观察 | 中高：PhotoObservation |
| Pawzy / Woofy | Web/App 可用 | 多宠家庭 | AI health assistant、档案、PDF 报告 | 宠物主安心、提醒、健康时间线 | 高：真实档案 + AI 对话 + 报告 |
| SafePet AI | App/网页产品 | 狗/猫主人 | PetScan、NutriScan、MediScan、AI Chat | 健康/营养/用药焦虑处理 | 中：多工具入口，医疗边界需收紧 |
| PetAI | App Store | 狗/猫主人 | 照片分诊、营养标签、健康钱包、PDF | 红黄绿风险和随访提醒 | 中：行动分级 |
| LunaDogAI | Web/App 产品 | 狗主人 | 视频分析、训练计划、AI 聊天教练 | 降低训练挫败，改善人宠关系 | 中：训练任务进入照护日程 |
| Vet-AI / Joii | UK App/Web | 宠物主 | AI symptom checker、皮肤/步态视频检查 | 分诊、远程兽医升级 | 高：AI 初筛 + 真人兽医兜底 |
| Petriage | 诊所采购平台 | 兽医诊所和宠物主 | AI teletriage | 诊所远程护理、分级路径 | 高：B2B 合规路径 |
| Buddydoc | App/Web | 宠物主 | 结构化症状检查、风险等级 | 给出下一步建议 | 中：问诊结构 |
| Vetster / Pawp / Chewy Connect with a Vet | 可订阅/可预约服务 | 宠物主 | AI 不是核心，真人兽医/telehealth | 降低宠物主焦虑，快速问诊 | 中：健康服务会员和电商结合 |
| Tractive DOG/CAT | 可购买 tracker + 订阅 | 狗/猫 | GPS、活动、睡眠、心率、呼吸、吠叫、抓挠、健康周报 | 安全围栏和健康提醒 | 高：通用 wearable schema |
| FitBark GPS / FitBark 2 | 可购买 tracker + API | 狗 | 活动、睡眠、健康指数、Developer API | 运动目标、异常趋势 | 高：第一批真实 adapter |
| Invoxia Minitailz | 可购买 tracker | 狗/猫 | AI daily insights、生命体征和行为 | 趋势提醒 | 高：vital signs 方向 |
| PetPace 3.0 | 可购买项圈 + 订阅 | 狗/猫，老年/慢病/术后 | AI smart collar、生命体征、疼痛/慢病告警 | 宠物主安心、兽医共享 | 高但后置：医疗级数据 |
| Maven Pet | 可购买 tracker + 订阅 | 狗/猫 | AI trend detection、baseline | 早期异常提醒 | 高：baseline/delta 表达 |
| Fi Series 3+ | 可购买 GPS 项圈 + 会员 | 狗 | GPS、活动、睡眠、吠叫/舔/抓挠/吃喝行为 | 安全和行为洞察 | 中：行为标签 |
| Catlog | 可购买猫项圈/Board + 订阅 | 猫 | ML 行为分类、Stress Score、AI 咨询 | 猫个体行为指纹 | 高：猫长期状态 |
| Moggie | 可购买猫 tracker / Companion AI | 猫 | 行为 baseline、AI companion tips | 猫健康解释和提醒 | 中：猫行为趋势 |
| SATELLAI Collar | 可购买 AI GPS 项圈 | 狗 | PetSense AI、GPS、活动、虚拟围栏 | 健康和训练建议 | 中：AI coaching |
| Petivity Smart Litter Box Monitor | 零售/官网可购买 | 猫 | AI 学习猫砂盆模式、体重、排泄 | 早期异常提醒 | 高：排泄一等事件 |
| Litter-Robot 5 Pro | 官网可购买 | 猫 | 双 AI 摄像头、WasteID、SmartScale、多猫 | 无感记录和健康 dashboard | 高：多猫识别和订阅能力 |
| PETKIT Purobot Ultra / Max Pro | 官网/零售可购买 | 猫 | AI 猫脸、粪便/尿液预筛、体重 | 猫砂盆健康时间线 | 高：视觉 + 排泄 |
| SiiPet LitterLens | 官网可购买 | 猫 | AI fingerprint、粪便质量、异常姿势、如厕时长 | 低成本外挂健康监控 | 高：普通猫砂盆可接入 |
| CATLINK Scooper Pro Ultra | 零售/官网 | 猫 | AI camera、体重识别、入厕活动 | 多猫健康追踪 | 中：猫砂盆竞品 |
| Petlibro RFID Feeder/Fountain | 官网/零售可购买 | 多宠家庭 | RFID 个体进食/饮水识别 | 饮食和饮水提醒 | 中：饮食/饮水事件 |
| SureFeed Microchip Feeder Connect | 官网/零售可购买 | 多宠家庭、医疗饮食 | 微芯片识别、进食时间、重量 | 控食和处方粮管理 | 中：低 AI 但高价值数据 |

## 对本项目的产品机会

### 已有产品没有覆盖好的空白

- **跨产品状态合成**：Furbo 知道狗叫了，FitBark 知道睡少了，Pawzy 知道最近换粮了，但用户仍需要一个统一解释层。
- **桌宠表达**：现有产品多在 App notification 和 dashboard 中展示状态，没有把真实宠物状态变成桌面上的持续陪伴形象。
- **证据到行动**：多数产品提醒“异常”，但缺少“为什么这么判断、下一步做什么、何时复查、给兽医看什么”的连续流程。
- **宠物主情绪照护**：Pawp/Joii/Vetster 解决问诊，Moflin/LOVOT 解决人类陪伴，但缺一个“宠物主焦虑时的证据化安抚”产品。

### 第一阶段应该吸收的既有产品能力

- Furbo / Petcube：摄像头事件、叫声事件、每日 video diary 思路。
- Pawzy / Woofy：宠物档案、提醒、照片时间线、PDF 报告。
- FitBark / Tractive：活动、睡眠、目标、健康趋势 schema。
- Petivity / PETKIT / SiiPet：体重、排泄、如厕时长、粪便/尿液视觉观察。
- Moflin / aibo / EMO：非语言情绪、人格成长、被照顾感、桌面存在感。
- Joii / Petriage / Buddydoc：结构化分诊和真人兽医升级边界。

### 不要直接照抄的产品策略

- 以订阅锁住基础看护能力：会降低用户信任，MVP 应把本地记录和基础提醒做成默认能力。
- 把“AI 翻译”当事实：MeowTalk/PettiChat 方向只能表达为可能意图。
- 只做硬件控制：真实宠物福利和安全责任重，第一阶段用虚拟任务和人工确认。
- 只做问诊聊天：竞争强、风险高、无法形成桌宠差异。

## 来源索引

- Furbo 360 Dog Camera: https://hotfix.furbo.com/us/products/furbo-360-dog-camera
- Furbo 360 Cat Camera: https://www.furbo.com/us/products/furbo-360-cat-camera
- Petcube Care / cameras: https://petcube.com/care-bundle/
- PETLIBRO Scout: https://petlibro.com/products/scout-smart-camera
- eufy Pet Dog Camera D605: https://service.eufy.com/article-description/Introducing-eufy-Pet-Dog-Camera-D605
- PetChatz: https://petchatz.com/
- Dogness Smart Cam Treater: https://www.dogness.com/
- Enabot: https://www.enabot.com/
- VARRAM: https://varram.com/
- Moflin: https://www.casio.com/us/moflin
- aibo AI Cloud Plan: https://us.aibo.com/feature/ai.html
- Loona: https://www.keyirobot.com/
- EMO: https://living.ai/emo/
- LOVOT: https://lovot.life/en/
- Joy for All Companion Pets: https://joyforall.com/
- Tombot: https://tombot.com/
- PARO: http://www.parorobots.com/
- MeowTalk: https://www.meowtalk.app/
- CatsMe: https://catsme.app/
- Sylvester.ai / Tably: https://www.sylvester.ai/tably
- TTcare: https://www.ttcareforpet.com/
- Pawzy: https://pawzy.io/
- SafePet AI: https://safepet.ai/
- LunaDogAI: https://www.lunadogai.com/
- Vet-AI / Joii: https://www.joiipetcare.com/app/
- Petriage: https://petriage.com/
- Buddydoc: https://www.buddydoc.io/symptom_checker
- Tractive: https://tractive.com/en/fp/health-monitoring-for-dogs-and-cats
- FitBark: https://www.fitbark.com/dev/
- Invoxia Minitailz: https://www.invoxia.com/en-US/petcare/minitailz-dog-tracker
- PetPace: https://petpace.com/
- Maven Pet: https://maven.pet/
- Catlog: https://rabo.cat/en-global/technology/
- Moggie: https://www.moggie.me/
- SATELLAI: https://satellai.com/
- Petivity: https://www.petivity.com/products/smart-litterbox-monitor
- Litter-Robot 5 Pro: https://www.litter-robot.com/litter-robot-5-pro.html
- PETKIT Purobot: https://petkit.com/products/purobot-max-pro
- SiiPet LitterLens: https://siipet.com/pages/litterlens-lp
- CATLINK: https://www.catlinkus.com/
- Petlibro RFID products: https://petlibro.com/
- Sure Petcare feeders: https://www.surepetcare.com/
