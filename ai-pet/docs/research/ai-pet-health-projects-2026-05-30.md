---
title: AI+宠物健康项目调研
description: 2026-05-30 对公开可验证 AI+宠物健康产品、硬件、兽医诊断和工作流项目的分项目调研。
status: 起草中
created: 2026-05-30
updated: 2026-05-30
update_reason: 用户要求调研宠物健康方向并按项目写入知识库
related:
  - ai-pet/docs/research/health-monitoring.md
  - ai-pet/docs/architecture/mvp-architecture.md
---

# AI+宠物健康项目调研

日期：2026-05-30  
口径：优先收录有公开官网、官方帮助页、App Store/Google Play、公司新闻稿、权威媒体或论文可验证的项目。宠物主端长尾 AI 分诊站点很多，本次只纳入可被搜索验证且与本项目产品形态有参考价值的样本；低证据项目单独标注，不能当作临床验证事实。

## 总体判断

AI+宠物健康已经形成五类项目：

1. 宠物主端 AI 分诊/健康助手：用 LLM、结构化问诊、照片或短视频给出红黄绿分级、下一步建议和可分享给兽医的摘要。
2. 连续监测硬件：项圈、猫砂盆、摄像头、体重/排泄传感器建立个体 baseline，用异常变化触发提醒。
3. 兽医诊断 AI：影像、细胞学、粪检、尿沉渣、皮肤/耳道等诊断工作流，主要卖给诊所。
4. 兽医工作流 AI：SOAP 记录、电话摘要、出院说明、PIMS 集成，解决医生时间和记录负担。
5. 保险/研究/预测健康：用理赔、电子病历、可穿戴和纵向队列数据做个体风险预测或疾病早筛。

对当前 AI Pet MVP 的关键启发：

- 第一阶段不应把产品成功押在某个设备 API 上。先做统一健康事件和指标模型，支持手动、CSV、mock 和未来 Vendor Adapter。
- 健康智能的正确产品表达不是“诊断”，而是“异常趋势证据包 + 就医/观察分级 + 给兽医看的摘要”。
- 竞争空白在于把“真实宠物数据、长期记忆、任务提醒、桌宠表达、兽医可读证据”合在一起。多数竞品只做一次性问诊、单设备 dashboard 或诊所工作流。
- 需要把医疗安全边界写进产品：不替代兽医、不处方、不远程诊断，紧急症状直接建议线下急诊。

## 证据等级

| 等级 | 含义 |
|---|---|
| A | 官方产品页、官方帮助页、官方新闻稿或 App Store/Google Play 页面直接可验证 |
| B | 权威媒体、行业媒体、学术论文、公司白皮书可验证 |
| C | 第三方目录、论坛、早期 landing page，可作为趋势线索，不能作为能力实证 |
| D | 仅见自述或低可验证页面，谨慎观察 |

## 项目矩阵

| 项目 | 类别 | 主要 AI 形态 | 数据输入 | 健康输出 | 证据 | MVP 参考价值 |
|---|---|---|---|---|---|---|
| TTcare | 宠物主端视觉健康检查 | 图像识别 | 眼睛、皮肤、关节、牙齿照片 | 异常提示、健康检查报告 | A | 高：拍照健康检查和非诊断边界 |
| TTcare Vet | 兽医端临床辅助 | 图像识别 + DDx 建议 | App 拍摄图像 | 异常征象、鉴别诊断建议 | A | 中：可参考兽医端解释格式 |
| CatsMe | 猫痛感识别 | 猫脸图像模型 | 猫脸照片 | 疼痛风险、健康跟踪 | A | 高：单一高价值症状模型 |
| Sylvester.ai / Tably | 猫舒适度/痛感识别 | 计算机视觉 + Feline Grimace Scale | 猫脸照片 | 客观舒适度/是否看兽医 | A | 高：科学量表 + 手机拍照 |
| Vet-AI / Joii | AI 分诊 + 远程兽医 | LLM、结构化问诊、图像/视频模型 | 症状、图片、视频、咨询历史 | 分诊、皮肤/步态健康检查、视频问诊 | A | 高：宠物主端闭环最佳样本 |
| Petriage | B2B 兽医远程分诊 | AI teletriage | 症状问答 | 紧急程度、远程护理路径 | A | 高：诊所合作和分级问诊 |
| Buddydoc | 宠物主端症状检查 | 兽医审核问卷/规则/算法 | 症状、宠物档案 | 风险等级、可能诊断、建议检查 | A | 中：结构化问卷可复用 |
| Pet Genius | AI 宠物健康助手 | LLM 对话 | 宠物档案、健康问题 | 个性化建议、对话保存分享 | A | 中：档案驱动回答 |
| Pawly AI | AI care companion | LLM 分诊/提醒 | 症状、档案、提醒 | 分诊对话、护理建议 | A | 中：面向焦虑场景的 UX |
| Pawzy / Woofy | 健康记录 + AI 助手 | LLM + 档案记忆 | 疫苗、药物、体重、天气、历史 | AI 健康建议、报告 | A | 高：健康时间线和 PDF 给兽医 |
| SafePet AI | 多工具 AI 健康 App | 照片分析、食品/药品扫描、AI chat | 宠物照片、食品标签、药品、健康记录 | 健康分数、食品安全、用药风险、PetLog | A | 中：多工具打包和扫描入口 |
| PetAI | AI 健康/营养/记录 App | 照片分诊、食品标签分析、记录抽取 | 照片、食品标签、健康记录 | 红黄绿评估、PDF、随访提醒 | A | 中：危急分级和报告导出 |
| Petri | AI-powered health companion | LLM 健康助手 | 档案、症状 | 健康建议 | C | 低：关注定位，不作为实证 |
| PetSense | AI pet health checks | AI 检查、提醒、记录 | 症状/记录 | 健康检查、提醒 | C | 低：长尾竞品参考 |
| ScanMyPet | 照片健康分析 | 多专家式视觉分析 | 宠物照片 | 皮肤、耳朵、眼睛、被毛风险 | C | 中：多专家拟人化交互可参考 |
| Vetly / VetlyHealth | AI pet health assistant | LLM + breed database | 档案、症状 | 品种相关健康建议 | C | 低：长尾竞品参考 |
| YAPPI / Pawlie AI | 训练/营养/健康助手 | LLM + 视频分析 | 问题、短视频、档案 | 行为分析、健康/营养建议 | A | 中：行为数据与健康联动 |
| PawDoc | AI 分诊 + 健康记录 | LLM 分诊 | 症状、档案 | 分诊、记录、营养、提醒 | C | 低：长尾分诊站点 |
| AIvet | AI symptom checker | LLM 问答 | 症状文本 | 可分享给兽医的摘要 | C | 低：轻量 triage 模式 |
| KinlyPets | AI symptom check | LLM/问诊 | 症状、品种、年龄 | ER/兽医/观察建议 | C | 低：红黄绿分级样本 |
| PetVetAI.ai | 摄像头/照片健康扫描 | 视觉分析 + AI chat | Ring/手机照片视频、粪便图像 | 行为/消化/症状扫描、风险分级 | C | 中：家庭摄像头接入方向 |
| PawScan AI | 照片 + 症状分诊 | 视觉 + 文本总结 | 照片、症状 | Monitor/Needs Attention 状态 | C | 低：安全话术参考 |
| PetAiVet | AI triage | LLM 分诊 | 症状、历史 | 风险等级、PDF、Pet Radar | C | 低：长尾站点 |
| PetOS / FurSight | AI 分诊站点 | LLM 分诊 | 症状、档案 | 紧急指导、照护步骤 | C | 低：长尾站点 |
| PetPace | AI 健康项圈 | 生命体征监测 + ML/AI 异常与疼痛评分 | 体温、脉搏、呼吸、活动、睡眠、GPS | 实时警报、疼痛/慢病监测、兽医共享 | A | 高：医疗级连续监测 |
| Maven Pet | AI 趋势检测项圈 | wearable + AI trend detection | 活动、休息、行为、可能的呼吸/心脏相关趋势 | 早期健康提醒、Vet-ready insights | A | 高：baseline/delta 设计 |
| Tractive | GPS + 健康监测 | 行为/生命体征趋势、AI 周报 | 活动、睡眠、静息心率、静息呼吸、吠叫、抓挠 | 健康警报、周报、趋势 | A | 高：通用消费级 adapter 样本 |
| Whistle | 狗健康/GPS tracker | 行为数据 + AI insight | 活动、行为、粪便照片、健康数据 | 日常洞察、粪便健康分析 | A | 中：历史数据和粪便 AI |
| FitBark | 狗活动/睡眠监测 | 研究级活动数据分析 | 活动、休息、睡眠、健康指数 | 活动/睡眠/健康指数、兽医共享 | A | 高：API 和研究级数据基线 |
| SATELLAI | AI GPS 狗项圈 | GPS/活动 + AI coaching | 位置、活动、休息、训练边界 | 行为、能量、健康/训练建议 | A | 中：AI coaching 与保险渠道 |
| Felcana | 数字兽医诊所 + wearable | 活动监测 + symptom checker | 活动、睡眠、卡路里、恢复、症状 | 健康洞察、术后恢复、线上兽医 | A | 中：远程监测与临床路径 |
| Moggie | 猫行为健康 tracker | 行为识别 + AI companion | 运动、休息、行为模式 | 猫健康洞察、AI 猫护理问答 | A | 中：猫专属行为 baseline |
| Catlog / RABO | 猫行为 AI collar | bio-logging + ML 行为分类 + AI 咨询 | 颈圈行为数据、排泄/生活日志 | 行为识别、压力分数、健康变化提醒 | A | 高：猫长期行为数字指纹 |
| Ayro | 早期猫健康传感器 | on-device AI | 活动、休息、梳理、运动 | 个人 baseline 异常、早期提醒 | A | 中：端侧 AI 与隐私方向 |
| Petivity / Purina | 智能猫砂盆监测 | AI 识别猫砂盆事件 | 体重、尿尿、排便、猫砂盆频率 | 异常变化、健康报告 | A | 高：排泄/体重是猫健康强信号 |
| Whisker / Litter-Robot 5 Pro | AI 猫砂盆/猫识别 | 摄像头识别、SmartScale | 体重、入厕、摄像头、粪便/血迹线索 | 多猫识别、健康 dashboard | A/B | 高：多猫识别和输入/输出健康闭环 |
| PETKIT Purobot | AI 猫砂盆 | 摄像头识别、体重、尿液颜色 | 猫砂盆使用、体重、尿液 pH/颜色 | 多猫健康追踪、尿路风险提醒 | A | 高：粪尿视觉 + 猫识别 |
| SiiPet LitterLens | 猫砂盆摄像头 | 猫识别 + visit logging | 猫砂盆视频/图像 | 入厕记录、单猫归因 | A | 中：低成本摄像头方案 |
| MyCatsHome | 猫健康生态 | 行为/设备数据 AI 分析 | 猫门、项圈、传感器 | 风险识别、建议 | C | 低：生态叙事参考 |
| SignalPET | 兽医影像 AI | X-ray 视觉 AI + LLM/PACS/放射科医生 | 兽医 X 光 | 实时影像洞察、放射报告 | A | 高：影像 AI 与人审结合 |
| Vetology | 兽医 AI 放射 | AI radiology + teleradiology | X 光 | AI 报告、放射科医生报告 | A | 中：诊所工作流参考 |
| Antech RapidRead | 兽医影像 AI | AI + 放射科专家 | X 光 | 诊断支持、可升级放射科医生 review | A | 高：AI 初筛 + 专家兜底 |
| PicoxIA | 兽医 X 光 AI | X-ray detection/report | 胸腹盆腔 X 光 | 自动读片、报告、置信度 | A | 中：置信度和自动报告 |
| Radimal | AI + DACVR 报告 | 影像 AI + specialist consult | 犬猫 X 光 | 急症 flag、专科报告 | A | 中：优先级分诊 |
| Zoetis VETSCAN Imagyst | 实验室图像 AI | 粪检、尿沉渣、皮肤/血涂片等图像 AI | 显微图像/扫描 | 寄生虫、尿沉渣、皮肤、血涂片分析 | A | 高：多测试 capability 平台 |
| IDEXX inVue Dx | 细胞学/血液形态 AI | deep-learning cellular analysis | 耳道/血样细胞 | 细胞学和血液形态结果、下一步建议 | A | 高：AI 辅助诊断边界 |
| IDEXX SediVue Dx | 尿沉渣 AI | 神经网络图像识别 | 尿沉渣图像 | 颗粒/细胞识别、尿检报告 | A | 中：老牌图像分析 |
| Scribenote | 兽医 AI scribe | 语音转 SOAP/文档 | 诊疗对话、电话 | SOAP、回访、客户摘要、PIMS 导出 | A | 高：后续“给兽医报告”可借鉴 |
| Talkatoo | 兽医 dictation/AI scribe | 语音识别 + AI assistant | 对话、电话、文本 | SOAP、电话摘要、邮件/模板 | A | 中：语音记录和摘要 |
| CoVet | 兽医 AI scribe/copilot | 语音 + 文档生成 | 诊疗对话 | 病历、行政自动化 | A | 中：记录自动化 |
| Digitail | AI-native PIMS | AI SOAP、记录摘要、出院说明 | PIMS、客户沟通、诊疗记录 | 医疗记录、流程板、客户 app | A | 高：宠物档案和诊所连接 |
| VetAgent | 诊所管理 AI | triage、lab、treatment requests | 预约、沟通、诊疗任务 | 诊所工作流自动化 | C | 低：B2B 方向观察 |
| Fetch Health Forecast | 保险预测健康 | 理赔/临床数据预测 AI | 犬种、年龄、理赔/健康数据 | 个性化疾病风险和费用预测 | A | 中：长期风险提示 |
| Mars Pet Insight Project | 大规模健康研究 | ML + 可穿戴 + EHR | Whistle 数据、Banfield 病历 | 行为变化与疾病关联、早期预警研究 | A | 高：纵向数据价值论证 |
| Pointer Health | 预测疾病平台 | 兽医 AI 风险预测 | 访问、治疗、健康记录 | 疾病预测、长期 record | C | 中：预测健康定位 |
| Everfur | 兽医临床智能 | 文献 RAG/规则剂量/AI SOAP | 症状、药物、文献、语音/文本 | 引用式鉴别诊断、剂量、SOAP | A/C | 中：证据引用和 deterministic dosing 思路 |
| Basepaws | 宠物基因/微生物组健康数据 | 数据科学/风险筛查，AI 表述不明确 | DNA、口腔/微生物组样本 | 遗传风险、早筛工具 | A | 中：未来档案数据源 |
| Purrfessor | 研究原型 | 多模态 LLaVA 饮食健康聊天 | 宠物/食物相关输入 | 饮食健康建议 | B | 低：学术原型参考 |
| OncoPetNet | 研究/病理 AI | 深度学习病理计数 | H&E 全玻片图像 | 兽医肿瘤有丝分裂计数 | B | 低：远期诊断 AI 参考 |

## 分项目记录

### TTcare

- 定位：AI FOR PET 的宠物健康 App，面向狗和猫。
- AI 结合：用手机照片检查眼睛、皮肤、关节和牙齿等可见异常；官网和应用商店均强调 AI 健康检查。
- 价值：适合做“日常拍照检查 + 趋势记录 + 非诊断提醒”的参考。
- 风险：照片质量、品种差异、毛发遮挡会显著影响结果；必须明确“不替代兽医”。
- 对本项目启发：可在 AI Pet MVP 做 `PhotoObservation` 数据类型，但第一版只生成“观察记录 + 是否建议咨询兽医”，不做疾病名称结论。
- 来源：[TTcare 官网](https://www.ttcareforpet.com/)、[TTcare Vet](https://ttcarevet.com/en)

### CatsMe

- 定位：Carelogy 的猫健康检查 AI，主打猫痛感检测。
- AI 结合：通过猫脸照片检测痛感，官网说明和 App Store 页面都提到与日本大学兽医学院等合作训练标注图片。
- 价值：猫会隐藏痛感，单一痛感模型比泛化“AI vet”更容易形成可信场景。
- 风险：只能作为痛感风险提示，不能直接判断病因。
- 对本项目启发：把“痛感/舒适度”作为虚拟宠物表情和任务提醒的重要维度，来源可以是用户拍照、行为下降、排泄异常等多信号合成。
- 来源：[Carelogy 英文页](https://carelogy-japan.com/en)、[CatsMe App Store](https://apps.apple.com/au/app/catsme-cat-pain-detector/id6478842291)

### Sylvester.ai / Tably

- 定位：猫舒适度监测应用/API，基于计算机视觉和 Feline Grimace Scale。
- AI 结合：用猫脸图像做 feline facial analysis，官方强调模型是面向猫脸分析的专用模型，不是通用 LLM。
- 价值：把科学量表产品化，输出“是否需要看兽医”的行动建议。
- 风险：需要清晰照片和场景解释；不能扩大到所有猫病。
- 对本项目启发：高可信 AI 功能应优先选择窄任务、可解释量表和明确边界。
- 来源：[Sylvester.ai for cat caregivers](https://www.sylvester.ai/cat-owner)、[How it works](https://www.sylvester.ai/how-sylvesterai-works)

### Vet-AI / Joii

- 定位：英国 Vet-AI 的宠物主端远程兽医和 AI 分诊平台，Joii 是其面向用户 App。
- AI 结合：自动分诊、症状检查、皮肤图像模型、步态视频模型；官方称模型利用大规模视频咨询和兽医标注数据训练。
- 数据输入：症状问答、图片、7 秒视频、宠物档案、咨询历史。
- 健康输出：即时临床建议、是否需要兽医、皮肤/步态问题早筛、远程视频咨询。
- 对本项目启发：AI Pet 的健康功能应该从“记录和分流”走向“远程兽医前的证据整理”，并把图片/视频纳入同一健康事件流。
- 来源：[Vet-AI automated triage](https://www.vet-ai.com/automated-triage)、[AI health checks](https://www.vet-ai.com/ai-healthchecks)、[Joii App](https://www.joiipetcare.com/app/)

### Petriage

- 定位：面向兽医诊所的 telehealth/teletriage 工具。
- AI 结合：官网称为 AI-driven teletriage tool，用于帮助宠物主判断问题紧急程度，并为诊所远程护理提供入口。
- 价值：B2B 诊所端分诊比纯 C 端 AI 答疑更有合规路径。
- 风险：公开页面对模型细节有限，不能把第三方目录的准确率宣传当成已验证事实。
- 对本项目启发：后续如果接诊所合作，报告输出应是“分级 + 证据摘要 + 建议联系本地兽医”，不是自诊断。
- 来源：[Petriage](https://petriage.com/)、[Petriage about](https://petriage.com/about/)

### Buddydoc

- 定位：狗猫症状检查和线上兽医入口。
- AI 结合：宠物资料、症状、兽医审核问卷，输出风险等级、建议、可能诊断和推荐检查。
- 价值：结构化问卷比自由聊天更容易控风险。
- 风险：可能诊断展示需要强免责声明，避免用户延迟就医。
- 对本项目启发：MVP 的 Advisor Chat 应该先收集关键问题，再输出分级和下一步，而不是直接回答结论。
- 来源：[Buddydoc symptom checker](https://www.buddydoc.io/symptom_checker)、[Google Play](https://play.google.com/store/apps/details?hl=en_NZ&id=io.buddylabs.buddydoc)

### Pawzy / Woofy

- 定位：宠物健康记录 App，覆盖疫苗、药物、体重、天气、急诊联系人、PDF 报告和 AI 助手 Woofy。
- AI 结合：AI 助手读取宠物过敏、饮食、历史和本地天气给出建议。
- 价值：真正接近本项目“长期档案 + AI 对话 + 给兽医报告”的方向。
- 风险：AI 需要证据来源和紧急边界，否则容易变成泛化聊天。
- 对本项目启发：优先做 health timeline、任务提醒、PDF/分享报告，AI 回答必须引用档案字段。
- 来源：[Pawzy](https://pawzy.io/)

### SafePet AI

- 定位：All-in-one AI pet health app，包含 PetScan、NutriScan、MediScan、AI Chat、PetLog。
- AI 结合：照片健康扫描、食品标签/条码分析、药品安全扫描、健康记录和 AI vet chat。
- 价值：把健康、营养、用药、记录合成一套工具链。
- 风险：药品剂量和安全属于高风险，必须限制为教育/提醒，不能替代兽医处方。
- 对本项目启发：库存/商品推荐可以接 NutriScan 思路，但必须结合过敏、年龄、体重、疾病禁忌。
- 来源：[SafePet AI](https://safepet.ai/)

### PetAI

- 定位：iOS 宠物健康、营养、记录和创作 App。
- AI 结合：照片健康分诊、营养标签分析、健康钱包、PDF 导出、随访提醒。
- 价值：红黄绿交通灯分级和 PDF 报告适合宠物主理解。
- 风险：App Store 自述不等于临床验证。
- 对本项目启发：本项目可以把健康事件映射成 `green/yellow/red` 的行动层，而不是疾病层。
- 来源：[PetAI App Store](https://apps.apple.com/us/app/petai-care-connect-create/id6742016840)

### Pawly AI

- 定位：24/7 AI care companion，主打健康焦虑时的即时回答。
- AI 结合：聊天式分诊、应急、提醒和个性化照护建议。
- 价值：情绪安抚和连续追问做得明显。
- 风险：需要防止用户把“AI 安抚”理解为不用就医。
- 对本项目启发：桌宠表达可以安抚，但健康场景必须更保守，先问关键危险信号。
- 来源：[Pawly AI](https://www.pawlyai.com/)

### PetPace

- 定位：宠物健康监测项圈，主打接近医疗级的生命体征和 AI 警报。
- AI 结合：体温、脉搏、呼吸、活动、睡眠、疼痛和慢病监测，结合机器学习产生告警；官方和新闻稿强调 AI pain detection。
- 价值：连续生命体征是最高价值数据源之一，尤其适合术后、慢病和老年宠物。
- 风险：硬件成本高、订阅重、API/合作不确定。
- 对本项目启发：MVP 设备模型要包含 vital signs，但第一版用 mock/CSV，不依赖真实硬件。
- 来源：[PetPace 3.0](https://petpace.com/product/the-new-petpace-health-2-0/)、[BusinessWire 2025 launch](https://www.businesswire.com/news/home/20250916765592/en/PetPace-Launches-Worlds-First-AI-Smart-Collar-that-Includes-247-Global-Telehealth-and-TelemedicineRevolutionizing-Real-Time-Health-Monitoring-for-Dogs-and-Cats)

### Maven Pet

- 定位：狗猫健康 tracker，面向宠物主和兽医诊所。
- AI 结合：小型 wearable 监测日常模式，AI 持续分析变化并给出早期问题提醒；Vet 版强调 24/7 监测和治疗进展跟踪。
- 价值：产品叙事与本项目“先发现变化，再准备兽医对话”高度一致。
- 风险：公开指标和准确率有限，合作/API 待确认。
- 对本项目启发：所有健康指标都应有 baseline、delta、置信度和“可给兽医看的证据”。
- 来源：[Maven Pet](https://maven.pet/)、[Maven Vet](https://maven.pet/vet/)、[About Maven](https://maven.pet/about/)

### Tractive

- 定位：GPS + 健康监测 tracker，覆盖狗和猫。
- AI 结合：官方健康页提到基于活动和睡眠数据的 AI-powered weekly summary；帮助中心列出活动、睡眠、静息心率、静息呼吸、吠叫、分离焦虑、抓挠等监测。
- 价值：消费级健康数据覆盖广，适合做 adapter schema 的重要参考。
- 风险：官方明确不是医疗设备，不诊断疾病。
- 对本项目启发：把“不是医疗设备”的边界保留在 UI 和 AI 输出中；健康提示以趋势异常为主。
- 来源：[Tractive health monitoring](https://tractive.com/en/fp/health-monitoring-for-dogs-and-cats)、[Tractive help center](https://help.tractive.com/hc/en-us/articles/360011024119-Health-Monitoring-How-To-Guide)

### Whistle

- 定位：狗 GPS/健康 tracker。
- AI 结合：官方 about 页面称 Mars 团队用大量狗健康数据和 Banfield 医疗记录训练 AI；产品页还提到 AI 粪便健康分析。
- 价值：结合宠物医院病历和可穿戴数据，是纵向健康模型的经典案例。
- 风险：品牌和产品线状态需持续跟踪，公开 API 不明确。
- 对本项目启发：粪便照片、行为数据、兽医记录可以合成更强健康上下文。
- 来源：[Whistle about](https://www.whistle.com/pages/about-us)、[Whistle Health](https://www.whistle.com/products/whistle-health-smart-device)

### FitBark

- 定位：研究级狗活动和睡眠 monitor。
- AI 结合：公开页不强调生成式 AI，但有健康指数、睡眠、活动、卡路里等长期行为数据，适合作为 AI 分析的输入。
- 价值：官方有 Developer API 入口，是 MVP 后续真实数据 adapter 的优先候选。
- 风险：主要是活动/睡眠，不是医疗诊断。
- 对本项目启发：FitBark 可作为第二阶段真实设备 API 验证对象；第一阶段先按其指标设计数据字段。
- 来源：[FitBark metrics](https://help.fitbark.com/en/articles/5251869-what-do-fitbark-devices-measure)、[FitBark Developer API](https://www.fitbark.com/dev/)

### Catlog / RABO

- 定位：猫行为健康 tracker，覆盖美国、澳大利亚和日本市场。
- AI 结合：基于 bio-logging 和机器学习分类猫行为，官方称持续改进 AI engine；还发布过使用 Catlog 数据咨询兽医监修 AI 的功能。
- 价值：猫行为日常变化比一次性问诊更适合早期发现问题。
- 风险：行为识别对佩戴、个体差异、家庭环境敏感。
- 对本项目启发：猫模型要以“个体健康指纹”为核心，而不是套用统一阈值。
- 来源：[Catlog technology](https://rabo.cat/en-global/technology/)、[RABO](https://rabo.cat/en-us/)、[PR Times AI consultation release](https://prtimes.jp/main/html/rd/p/000000082.000037478.html)

### Petivity / Purina

- 定位：智能猫砂盆监测系统，放在普通猫砂盆下方。
- AI 结合：AI 识别猫砂盆事件、体重、排尿、排便，并识别可能提示健康问题的细微行为变化。
- 价值：猫健康强信号在体重和排泄，输入稳定、用户负担低。
- 风险：多猫识别、猫砂盆位置、异常样本可能影响准确性。
- 对本项目启发：需要把排泄建成一等健康事件：`urination`、`defecation`、`visit_without_output`、`weight_at_visit`。
- 来源：[Purina Petivity](https://www.purina.com/petivity-smart-litter-box-monitor)、[Petivity product](https://www.petivity.com/products/smart-litter-box-monitor)

### Whisker / Litter-Robot

- 定位：自动猫砂盆和猫健康生态。
- AI 结合：官方页面展示 SmartScale、App 健康 dashboard、AI-powered dual camera system；媒体报道提到多猫脸部识别、血迹/腹泻等线索。
- 价值：猫砂盆从“清洁工具”升级为“健康输入/输出监测节点”。
- 风险：自动猫砂盆安全和机械风险必须谨慎；摄像头涉及隐私。
- 对本项目启发：如果接入硬件，不应只展示原始数据，要解释为“输入/输出健康故事”。
- 来源：[Whisker clean living](https://www.whisker.com/clean-living)、[Axios 2025 AI litter box](https://www.axios.com/local/detroit/2025/10/29/whisker-launches-ai-litter-box)

### PETKIT Purobot

- 定位：AI 自动猫砂盆系列。
- AI 结合：AI 摄像头、多猫脸部识别、体重传感器、尿液颜色/pH 监测，官方页面称 AI Health ecosystem。
- 价值：硬件把“谁上厕所、上了多久、尿液异常、体重变化”结合起来。
- 风险：专有生态，不确定是否有开放数据导出。
- 对本项目启发：可作为 UI 数据模型参考，不应作为第一版依赖。
- 来源：[PETKIT Purobot Max Pro 2](https://petkit.com/products/purobot-max-pro)、[PETKIT Purobot Ultra](https://www.petkit.com/products/purobot-ultra)

### SignalPET

- 定位：兽医影像 AI 平台。
- AI 结合：X 光 AI 解读、PACS、上下文语言模型、放射科医生签名报告；官方称覆盖大量诊所和临床人员。
- 价值：AI 不是替代医生，而是“第二双眼睛 + 专家报告”。
- 风险：兽医放射 AI 在专业社区仍有争议，必须有人审和责任归属。
- 对本项目启发：健康报告可学习“AI 初步发现 + 专家确认/升级”的双层结构。
- 来源：[SignalPET](https://www.signalpet.com/)、[SignalPET docs](https://docs.signalpet.com/how-does-signalpet-work)

### Vetology

- 定位：兽医 AI 放射和远程放射服务。
- AI 结合：AI radiology workflow，给诊所提供读片支持、指标解释和工作流方案。
- 价值：强调实际诊所工作流，而不是单点算法。
- 风险：公开准确率和验证细节需要进一步拿资料。
- 对本项目启发：B2B 健康功能要考虑诊所已有系统，不只是宠物主 App。
- 来源：[Vetology](https://vetology.net/)、[Vetology AI](https://vetology.net/ai/)

### Antech RapidRead

- 定位：Antech 的 AI veterinary radiology interpretation service。
- AI 结合：AI 快速初读 + 放射科专家团队；若请求专家 review，RapidRead 费用可抵扣标准影像咨询费。
- 价值：非常清晰的“AI 初筛、专家兜底、费用设计”路径。
- 风险：只适用于诊所影像工作流。
- 对本项目启发：宠物主端健康报告也可以做“自动整理免费/低成本，升级到兽医咨询”的阶梯。
- 来源：[Antech RapidRead](https://www.antechdiagnostics.com/imaging-services/rapidread/)

### Zoetis VETSCAN Imagyst

- 定位：诊所内图像诊断平台。
- AI 结合：AI fecal、AI urine sediment、AI dermatology、AI blood smear、AI masses、AI equine fecal 等多能力，结合 Zoetis 专家网络。
- 价值：单平台多测试，说明兽医 AI 价值在工作流集成和专家支持。
- 风险：硬件/耗材/诊所渠道重，不适合 MVP 自研。
- 对本项目启发：本项目可以把家庭观察按“测试能力”组织，而不是按泛化病名组织。
- 来源：[Zoetis VETSCAN Imagyst](https://www.zoetisus.com/products/diagnostics/instruments/vetscan-imagyst/)、[Imagyst AI Fecal](https://www.zoetisdiagnostics.com/us/point-of-care/vetscan-imagyst/imagyst-ai-fecal/)

### IDEXX inVue Dx / SediVue Dx

- 定位：IDEXX 的诊所内细胞分析和尿沉渣分析。
- AI 结合：inVue Dx 用 deep learning AI 做细胞学和血液形态分析；SediVue Dx 使用卷积神经网络识别尿沉渣图像。
- 价值：诊断 AI 的可信商业路径是“硬件采样一致性 + AI 模型 + 实验室/专家生态”。
- 风险：不适合家庭端直接模仿。
- 对本项目启发：家庭端图像要低风险；真正诊断应由诊所设备或兽医完成。
- 来源：[IDEXX inVue Dx](https://www.idexx.com/en/veterinary/analyzers/invue-dx-analyzer/)、[IDEXX SediVue Dx news](https://www.idexx.com/en/about-idexx/news/newsroom-archive/idexx-advances-power-sedivue-dx-latest-software-update/)

### Scribenote / Talkatoo / CoVet

- 定位：兽医 AI scribe 和记录自动化工具。
- AI 结合：把诊疗对话、电话、自由口述转为 SOAP、客户摘要、邮件、模板和 PIMS 可用记录。
- 价值：宠物健康 AI 的刚需不只是诊断，还包括节省兽医时间、提高记录质量。
- 风险：录音隐私、识别错误、病历责任归属需要流程控制。
- 对本项目启发：AI Pet 后续应输出“兽医可读摘要”和“就诊前问题清单”，降低医生沟通成本。
- 来源：[Scribenote](https://www.scribenote.com/)、[Talkatoo](https://talkatoo.com/)、[CoVet](https://www.co.vet/home-1)

### Digitail

- 定位：AI-native veterinary PIMS，含客户 App。
- AI 结合：AI SOAP dictation、自动医疗记录摘要、个性化出院说明、实时 flowboard 等 20+ AI workflow。
- 价值：展示诊所端生态如何把 AI 嵌入日常流程。
- 风险：如果本项目未来做 B2B，需要考虑 PIMS 数据边界和集成成本。
- 对本项目启发：Domain Service 的宠物档案、任务、健康报告要从一开始可映射到 PIMS/就诊摘要。
- 来源：[Digitail](https://digitail.com/)、[Digitail about](https://digitail.com/about-us/)

### Fetch Health Forecast

- 定位：Fetch Pet Insurance 的犬健康预测工具。
- AI 结合：官方 FAQ 称其为个性化预测 AI 工具，用于提示未来健康状况和费用风险。
- 价值：保险数据可以做“长期疾病风险 + 预算准备”。
- 风险：保险场景有利益冲突和用户信任问题；预测不等于诊断。
- 对本项目启发：可以做“风险趋势/准备事项”，不能影响医疗判断或制造焦虑。
- 来源：[Fetch Health Forecast FAQ](https://www.fetchpet.com/faqs/fetch-health-forecast)

### Mars Pet Insight Project

- 定位：Mars Petcare、Whistle、Banfield 的大型狗健康纵向研究。
- AI 结合：把可穿戴行为数据和 Banfield 电子病历关联，用机器学习研究行为变化与疾病之间的关系。
- 价值：证明宠物健康 AI 的长期护城河在纵向数据，不在一次性聊天。
- 风险：大规模数据和医院网络是巨头优势，MVP 只能从小规模结构化数据做起。
- 对本项目启发：从第一天记录结构化健康事件，为未来个体 baseline 和群体模型留数据。
- 来源：[Mars Pet Insight Project](https://www.mars.com/news-and-stories/press-releases/mars-pet-insight-project)

### Everfur

- 定位：兽医临床智能工具，公开官网偏向兽医端 evidence-backed decision support；社区帖同时提到面向宠物主的免费 AI pet health app。
- AI 结合：50,000+ 文献、引用式鉴别诊断、确定性剂量、AI-enhanced SOAP。
- 价值：强调“引用和确定性剂量”优于纯 LLM 生成。
- 风险：宠物主端能力主要来自社区自述，需后续验证。
- 对本项目启发：AI 回答健康问题时应优先引用来源和档案字段；剂量/用药必须保持只读或兽医确认。
- 来源：[Everfur](https://everfur.com/)、[Reddit launch thread](https://www.reddit.com/r/sideprojects/comments/1tinfs6/built_a_free_ai_pet_health_app_trained_on_50000/)

## 对 AI Pet MVP 的落地建议

### 1. 数据模型优先级

第一阶段先补齐这些实体，不依赖真实硬件：

- `PetProfile`：品种、年龄、体重、绝育、过敏、疾病、饮食、药物。
- `HealthEvent`：症状、排泄、进食、饮水、活动、睡眠、抓挠、咳嗽、呕吐、伤口、照片、视频。
- `MetricReading`：活动量、睡眠、体重、心率、呼吸、温度、猫砂盆事件。
- `ObservationEvidence`：来源、时间、置信度、照片质量、用户备注。
- `TriageAssessment`：green/yellow/red、危险信号、建议行动、何时复查、是否就医。
- `VetSummary`：给兽医看的时间线、异常趋势、用户已做行动、问题清单。

### 2. AI 输出边界

- 允许：观察解释、分级、护理提醒、复查提醒、就医建议、兽医摘要、食物/药物安全提醒。
- 禁止：确定诊断、处方、剂量改变、延迟急诊、替代 VCPR。
- 必须：出现呼吸困难、抽搐、持续呕吐/腹泻、无法排尿、严重外伤、虚脱、中毒疑似等危险信号时，直接建议急诊。

### 3. 产品机会

本项目最有价值的差异化不是“又一个 AI vet chat”，而是：

1. 数字分身把真实健康数据变成持续可感知状态。
2. 桌宠用情绪和行为提醒主人，但健康建议由结构化引擎和安全规则控制。
3. 每次提醒都能展示“为什么”：哪条数据、相对 baseline 变化多少、持续多久。
4. 一键生成兽医摘要，把家庭观察变成临床沟通材料。

### 4. 设备接入优先级

| 阶段 | 接入方式 | 理由 |
|---|---|---|
| MVP | ManualInput、MockWearable、CSV/JSON import | 不被厂商 API 卡住 |
| 第二阶段 | FitBark、Tractive、Petivity 导出/合作 | 指标覆盖高，健康趋势价值清晰 |
| 第三阶段 | PetPace、Maven、Catlog、Whisker/PETKIT | 需要合作或专有生态，但健康信号更强 |
| 远期 | 诊所/PIMS、保险、基因/微生物组 | 需要合规、授权和生态合作 |

### 5. 验证计划

- 用 30-50 个狗猫常见症状 vignette 做分诊回归测试。
- 每个回答必须输出：风险等级、危险信号、观察窗口、何时就医、证据来源。
- 对健康报告做人工 checklist：是否误诊、是否过度承诺、是否遗漏急症、是否能被兽医快速阅读。
- 对图像/视频输入先只做“记录和质量评估”，再接专用模型。

## 来源索引

- TTcare: https://www.ttcareforpet.com/
- TTcare Vet: https://ttcarevet.com/en
- CatsMe/Carelogy: https://carelogy-japan.com/en
- Sylvester.ai: https://www.sylvester.ai/cat-owner
- Vet-AI automated triage: https://www.vet-ai.com/automated-triage
- Vet-AI AI health checks: https://www.vet-ai.com/ai-healthchecks
- Joii Pet Care: https://www.joiipetcare.com/app/
- Petriage: https://petriage.com/
- Buddydoc: https://www.buddydoc.io/symptom_checker
- Pawzy: https://pawzy.io/
- SafePet AI: https://safepet.ai/
- PetAI App Store: https://apps.apple.com/us/app/petai-care-connect-create/id6742016840
- Pawly AI: https://www.pawlyai.com/
- PetPace: https://petpace.com/product/the-new-petpace-health-2-0/
- Maven Pet: https://maven.pet/
- Tractive health monitoring: https://tractive.com/en/fp/health-monitoring-for-dogs-and-cats
- Whistle: https://www.whistle.com/pages/about-us
- FitBark metrics: https://help.fitbark.com/en/articles/5251869-what-do-fitbark-devices-measure
- Catlog technology: https://rabo.cat/en-global/technology/
- Petivity/Purina: https://www.purina.com/petivity-smart-litter-box-monitor
- Whisker: https://www.whisker.com/clean-living
- PETKIT Purobot: https://petkit.com/products/purobot-max-pro
- SignalPET: https://www.signalpet.com/
- Vetology: https://vetology.net/ai/
- Antech RapidRead: https://www.antechdiagnostics.com/imaging-services/rapidread/
- Zoetis VETSCAN Imagyst: https://www.zoetisus.com/products/diagnostics/instruments/vetscan-imagyst/
- IDEXX inVue Dx: https://www.idexx.com/en/veterinary/analyzers/invue-dx-analyzer/
- Scribenote: https://www.scribenote.com/
- Talkatoo: https://talkatoo.com/
- CoVet: https://www.co.vet/home-1
- Digitail: https://digitail.com/
- Fetch Health Forecast: https://www.fetchpet.com/faqs/fetch-health-forecast
- Mars Pet Insight Project: https://www.mars.com/news-and-stories/press-releases/mars-pet-insight-project
- Everfur: https://everfur.com/
- AVMA telehealth/VCPR guidance context: https://www.avma.org/javma-news/2018-09-15/veterinarians-encouraged-take-telehealth-spin
- AAHA AI in veterinary practice: https://www.aaha.org/trends-magazine/trends-may-2024/applications-of-ai-in-veterinary-practice/
