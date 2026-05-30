---
title: 现有宠物健康产品调研
description: 2026-05-30 对已经可购买、可下载或可由诊所采购的宠物健康/AI 健康产品做产品维度调研。
status: 完成
created: 2026-05-30
updated: 2026-05-30
update_reason: 用户补充要求调研已经存在的产品；本页作为健康产品专项，与情感陪伴现有产品专项互相引用
related:
  - ai-pet/docs/research/ai-pet-health-projects-2026-05-30.md
  - ai-pet/docs/research/health-monitoring.md
  - ai-pet/docs/research/pet-emotional-ai/existing-products.md
  - ai-pet/docs/architecture/mvp-architecture.md
---

# 现有宠物健康产品调研

日期：2026-05-30  
口径：本页只看“已经存在”的产品，即官网、应用商店、官方帮助页显示可购买、可下载、可订阅、可登录使用，或诊所可采购/预约 demo 的产品。价格和地区按公开页面在 2026-05-30 的可见信息记录，促销价、订阅和地区可随时变化。

## 总体结论

现有产品已经覆盖“问、看、戴、称、拍、检、记”七类入口：

- 问：Joii、Petriage、Buddydoc、Vetster、Pawp、Chewy 等把症状问题转成分诊或远程兽医。
- 看：TTcare、CatsMe、Sylvester、SafePet、PetAI 等用照片做皮肤、眼耳、牙齿、猫痛感或整体健康扫描。
- 戴：Tractive、FitBark、PetPace、Maven、Fi、Catlog、Moggie、SATELLAI 等项圈/挂件做活动、睡眠、生命体征、行为和位置监测。
- 称：Petivity、Whisker、PETKIT、CATLINK、Toletta 等用体重和猫砂盆行为建立猫健康时间线。
- 拍：PETKIT、Whisker 5 Pro、SiiPet、Furbo 用摄像头检测行为、粪便、猫脸或家庭异常。
- 检：Zoetis、IDEXX、SignalPET、Antech、PicoxIA、Radimal 等诊所端产品把 AI 放入影像、细胞学、粪检和尿检流程。
- 记：Scribenote、Talkatoo、CoVet、Digitail 把诊疗语音、电话和 PIMS 记录转成可用病历。

对 AI Pet MVP 的产品判断：

1. 已有产品多为单入口工具；还没有看到一个成熟产品把真实健康数据、长期档案、桌宠表达、任务提醒、给兽医报告完整合在一起。
2. 最有价值的数据源不是一次性 AI 聊天，而是连续监测与低摩擦记录：活动、睡眠、体重、排泄、饮食、饮水、照片和症状时间线。
3. 大多数硬件生态封闭，公开 API 少。MVP 应优先支持手动、CSV/JSON、图片/视频记录和 mock adapter，再做单个厂商合作。
4. AI 健康产品的可信表达普遍避开“诊断”，采用“风险提示、异常趋势、分诊等级、联系兽医、健康报告”。

## 现有产品矩阵

| 产品 | 类型 | 已存在形态 | 公开价格/订阅 | 健康数据 | AI/算法角色 | MVP 参考 |
|---|---|---|---|---|---|---|
| Joii Pet Care | 远程兽医 + 分诊 App | UK App/Web，420k+ pet parents 宣传 | 症状检查免费；兽医视频 £28；保险合作可免费 | 症状、图片、视频咨询、治疗计划 | AI symptom checker，咨询数据训练 AI | 高：分诊 + 真人兽医升级闭环 |
| Vetster Plus | 远程兽医订阅 | App/Web | Plus 页面显示 $10/月；单次 appointment 起价 $102 | 预约、病历、体重、照片、处方 | 非核心 AI，重点是在线兽医和健康记录 | 中：健康记录 + 兽医会诊 |
| Pawp | 数字宠物诊所 | App/Web 会员 | 页面显示 $24/月，也有渠道价 $19/月 | 宠物健康 profile、wellness tracking | 非核心 AI，真人 vet 主导 | 中：持续照护会员模型 |
| Chewy Connect with a Vet | 电商内远程兽医 | Chewy 在线服务，部分州 video visit | 官方页按地区开放，价格依服务变化 | 问题、视频、action plan、商品推荐 | Tele-triage 平台，不强调 AI | 中：电商推荐与健康建议耦合 |
| Petriage | B2B teletriage | 诊所端平台 | 未公开固定价格 | 症状问答、远程护理请求 | AI-driven teletriage | 高：诊所合作分级路径 |
| Buddydoc | 症状检查 App | App/Web | 症状检查免费；Ask-a-vet 入口 | 宠物档案、症状、问卷 | 兽医审核问卷/算法 | 中：结构化问诊 |
| TTcare | AI 健康检查 App | iOS/Android | Pricing 页显示 AI health reports，具体价格需进 App/销售页确认 | 眼睛、皮肤、关节、牙齿照片 | 图像识别健康检查 | 高：照片观察模块 |
| Sylvester.ai | 猫痛感 App/API | App/Web；官网称 12,000+ caregivers | 1 次免费 comfort check；订阅无限检查 | 猫脸照片、comfort history | 猫脸 CV + Feline Grimace Scale | 高：窄任务可信 AI |
| CatsMe | 猫痛感 App | App Store 可下载 | 价格按 App Store 地区显示 | 猫脸照片、痛感历史 | 猫脸痛感模型 | 高：猫痛感入口 |
| Pawzy / Woofy | 健康记录 + AI 助手 | Web/App | Free；Pro $4.99/月或 $39.99/年 | 疫苗、药物、体重、天气、症状、照片 | AI health assistant 读取宠物历史 | 高：健康时间线 + PDF |
| SafePet AI | 多工具 AI 健康 App | 官网显示可下载；Android coming soon | 2 次免费扫描；Premium $4.99/月 | 照片、食品标签、药品、PetLog | PetScan、NutriScan、MediScan、AI Chat | 中：多工具扫描包装 |
| PetAI | AI 健康/营养 App | App Store | Free + in-app purchases | 照片、食品标签、健康钱包 | AI triage、营养/化学安全扫描 | 中：红黄绿分级 + PDF |
| Pet Genius | AI 宠物健康助手 | App Store | Free + IAP；$4.99/$6.99 月订阅等 | 宠物档案、对话、饮食/健康问题 | LLM 健康助手 | 中：档案驱动聊天 |
| Tractive DOG/CAT 6 | GPS + 健康 tracker | 可购买 tracker + App | 需 active subscription；设备价和订阅随地区/促销变化 | GPS、活动、睡眠、静息心率、静息呼吸、吠叫、抓挠等 | 健康趋势、AI 周报/健康洞察 | 高：通用指标 schema |
| FitBark GPS / FitBark 2 | 狗健康 tracker | 官方店铺 | GPS $34.95-$69.95 + 订阅；FitBark 2 $39.95-$69.95 | 活动、睡眠、健康指数、卡路里、距离 | 研究级指标分析；公开 API | 高：最适合先做真实 adapter |
| PetPace 3.0 | AI 生命体征项圈 | 官网可购买 | 页面显示 collar $249-$399；订阅约 $25/月或年付 | 体温、脉搏、呼吸、活动、睡眠、GPS | AI insights、疼痛/慢病告警 | 高：vital signs 模型 |
| Maven Pet | AI health tracker | 官网可购买/订阅 | 订阅制，选 plan 时显示价格 | 活动、休息、行为趋势、健康事件 | AI trend detection、baseline | 高：baseline/delta 设计 |
| Fi Series 3+ | AI GPS 狗项圈 | App Store/零售/官网支持页 | 会员制，具体价格随 plan | GPS、活动、睡眠、吠叫、舔、抓挠、吃喝 | AI behavior tracking，官方称 80% 准确率 | 中：行为维度参考 |
| Whistle Health / GPS | 狗健康 tracker | 官网产品页 | 价格需官网/零售确认 | 活动、行为、GPS、粪便照片 | AI stool health、Mars/Banfield 数据背景 | 中：粪便 AI 入口 |
| Catlog | 猫行为 tracker | 官方店铺；Catlog Pendant US$79.99 | 订阅/套装按店铺 plan | 猫项圈行为、Board 排泄/体重 | ML 行为分类、Stress Score、AI 咨询 | 高：猫健康指纹 |
| Moggie | 猫健康 tracker | 官网可购买/订阅 | Tracker+Hub 无需订阅；无硬件可买 Companion AI 订阅 | 活动、休息、行为模式 | AI companion、健康 tips | 中：猫行为 baseline |
| SATELLAI Collar | AI GPS 狗项圈 | 官网可购买 | $499.99 | GPS、活动、健康监测、虚拟围栏 | PetSense AI 健康/不适提醒 | 中：AI coaching |
| PitPat GPS / Activity | 狗 GPS/活动 | 官网可购买 | GPS $229 无必需订阅；Activity $59 | GPS、活动、距离、卡路里、体重目标 | 活动算法，不强调 AI | 中：无订阅定位差异 |
| Kippy EVO | 狗猫 GPS/活动 | 官网可购买 | 价格按地区/促销显示 | GPS、活动、健康/活动目标 | 同龄同品类比较、个性化活动建议 | 中：犬猫通用定位/活动 |
| Sure Petcare Animo | 狗活动/行为 monitor | 官网/零售可买 | 零售价随零售商 | 活动、睡眠、卡路里、吠叫、抓挠、摇头 | 自适应算法，机器学习背景 | 中：长期行为异常提醒 |
| Petivity Smart Litterbox Monitor | 猫砂盆监测 | 官网/零售可买 | 零售价按渠道，常见约 $100 级 | 体重、尿尿、排便、频率、时长 | AI 事件识别和异常趋势 | 高：排泄事件模型 |
| Litter-Robot 5 Pro | AI 自动猫砂盆 | Whisker 官网可买 | As low as $899；Whisker+ 解锁更深摄像头能力 | 体重、访问、WasteID、双摄像头、视频历史 | AI 摄像头、facial recognition | 高：多猫识别与 waste type |
| Litter-Robot 4 | 智能猫砂盆 | Whisker/零售可买 | 价格随套餐；非 AI 摄像头 | 体重、访问、周期、猫砂/废物状态 | SmartScale 算法 | 中：成熟硬件健康 dashboard |
| PETKIT Purobot Ultra / Max Pro 2 | AI 自动猫砂盆 | 官网/零售可买 | Ultra $799.99 促销，Max Pro 2 页面约 $499.99 | 摄像头、猫脸、粪便/尿团、尿液颜色/pH、体重 | AI facial recognition、stool/urine pre-screening | 高：低摩擦粪尿视觉 |
| CATLINK Scooper Pro Ultra | AI 自动猫砂盆 | 零售/官网内容可见 | 价格按渠道 | 体重、猫识别、入厕活动、AI camera | AI health tracking、weight-based recognition | 中：多猫猫砂盆竞品 |
| SiiPet LitterLens | 猫砂盆摄像头 | 官网可买 | 官网显示 $79.99-$129 区间促销 | 频率、时长、粪便质量、异常姿势、12 个月时间线 | AI fingerprint 识别猫，粪便/尿路行为模型 | 高：可外挂到普通猫砂盆 |
| Toletta | 猫厕所健康 App/设备 | App Store 可用 | 价格固定不随猫数，具体见地区 | 体重、如厕频率、时长 | 自动记录/识别 | 中：猫砂盆健康三指标 |
| PrettyLitter | 健康监测猫砂 | 官网/零售可买 | 非结团 $24/袋；结团 $29.99/袋 | 尿液 pH、血尿颜色提示 | 化学颜色变化，不是 AI | 中：低技术但强健康入口 |
| Petlibro Dockstream RFID | 饮水监测 | 官网/零售可买 | 价格按渠道 | RFID 个体饮水、补水/滤芯提醒 | 应用报表，不强调 AI | 中：饮水一等事件 |
| Petlibro One RFID Feeder | 喂食监测 | 官网/零售可买 | 价格按渠道 | RFID 个体喂食、餐次、份量计划 | 应用控制，不强调 AI | 中：饮食一等事件 |
| SureFeed Microchip Feeder Connect | 喂食监测 | 官网/零售可买 | 价格按渠道，需 Hub | 微芯片识别、进食时间、食物重量 | 规则/报表，不强调 AI | 中：医疗饮食/控食 |
| Furbo Smart Alerts | 宠物摄像头 | Furbo 产品/App | 需 Furbo Nanny/订阅能力 | 活动、吠叫、呕吐、烟雾、过度如厕等 alert | Smart Alerts/视觉事件识别 | 低-中：异常行为摄像头 |
| SignalPET 360 | 兽医影像 AI | 诊所 SaaS/PACS/demo | B2B 报价 | X 光影像 | 视觉 AI、PACS、LLM、放射科医生报告 | 高：AI+专家兜底 |
| Antech RapidRead | 兽医影像 AI | 诊所服务 | B2B/按报告 | X 光影像 | AI 初读 + 放射科专家升级 | 高：AI 初筛和专家升级定价 |
| Zoetis VETSCAN Imagyst | 诊所实验室 AI | 诊所设备/平台 | B2B | 粪检、尿沉渣、皮肤、血涂片、肿块等 | 多测试图像 AI + 专家网络 | 高：多 capability 诊断平台 |
| IDEXX inVue Dx | 诊所细胞/血液 AI | 诊所设备 | B2B | 耳道/血样细胞 | deep-learning cellular analysis | 高：采样一致性 |
| IDEXX SediVue Dx | 尿沉渣分析 | 诊所设备 | B2B | 尿沉渣图像 | 神经网络图像识别 | 中：老牌图像识别 |
| Scribenote | 兽医 AI scribe | Web/App | Free/Pro/团队计划 | 诊疗对话、电话、口述 | 语音到 SOAP、客户摘要 | 高：兽医摘要方向 |
| Talkatoo | 兽医 dictation/AI | 桌面/移动 | B2B/订阅 | 口述、电话、文本 | dictation、Auto-Records、AI assistant | 中：语音记录 |
| CoVet | 兽医 AI scribe | App/Web | B2B | 诊疗对话 | AI scribe + admin automation | 中：病历自动化 |
| Digitail | AI-native PIMS | SaaS | B2B | 医疗记录、预约、客户沟通 | AI SOAP、摘要、出院说明、flowboard | 高：宠物档案和诊所连接 |
| Fetch Health Forecast | 预测健康报告 | Fetch 用户/一次性报告 | 一次性付费，FAQ 未列价格 | 犬信息、临床/理赔背景数据 | 预测 AI，称 85% confidence | 中：长期风险提示 |
| Basepaws | 猫 DNA 健康测试 | 官网可买 | Breed+Health 猫 DNA 促销 $103.99，原价 $159 | DNA、遗传/牙科/性状 | 基因数据科学，不是实时 AI | 中：档案深数据源 |
| Wisdom Panel | 狗 DNA 健康测试 | 官网可买 | Premium $159.99，促销页 $127.99；Essential $119.99/$95.99 | 品种、遗传健康、行为、性状 | 基因风险筛查 | 中：品种/遗传背景 |

## 产品侧机会判断

### 高优先级可借鉴

- `FitBark`：公开 developer API，活动/睡眠/健康指数适合做第一批真实 adapter。
- `Tractive`：健康指标覆盖广，能定义犬猫 wearable 数据模型，但公开 API 不稳定。
- `Petivity`、`SiiPet LitterLens`、`PETKIT Purobot`：猫健康最强低摩擦入口是体重和排泄事件。
- `PetPace`、`Maven`：生命体征和 baseline/delta 的产品表达值得借鉴，但不适合作为 MVP 依赖。
- `Pawzy`、`Joii`、`Petriage`：分诊和给兽医材料的产品闭环值得借鉴。
- `Scribenote`、`Digitail`：说明“兽医可读摘要”本身就是高价值 AI 场景。

### 不应照抄

- 单纯 AI 问诊框：竞争多、可信度弱、容易踩医疗安全线。
- 单一昂贵硬件闭环：采购门槛高，用户群窄，厂商 API 不可控。
- 诊断式营销：宠物主容易误解，兽医侧也难以接受。
- 只展示原始数据：用户真正需要的是异常证据、行动建议和可复查时间点。

## 对 MVP 的字段补充

产品调研后，建议在健康数据模型补这些字段：

- `source_product`：FitBark、Tractive、Petivity、Manual、Photo、VetRecord 等。
- `availability_status`：manual、mock、csv_import、api_connected、device_pending。
- `metric_context`：休息状态、活动后、猫砂盆访问时、夜间、用药后等。
- `baseline_window_days`：用于判断异常的个体基线窗口。
- `action_level`：observe、home_care、book_vet、urgent_vet。
- `shareable_evidence`：是否进入给兽医摘要。
- `product_lock_in_risk`：low、medium、high。

## 来源索引

- Joii Pet Care: https://www.joiipetcare.com/app/
- Vet-AI automated triage: https://www.vet-ai.com/automated-triage
- Vetster Plus: https://vetster.com/en-us/plus
- Pawp: https://pawp.com/
- Chewy Connect with a Vet: https://www.chewy.com/b/connect-vet-16616
- Petriage: https://petriage.com/
- Buddydoc: https://www.buddydoc.io/symptom_checker
- TTcare: https://www.ttcareforpet.com/
- Sylvester.ai: https://www.sylvester.ai/cat-owner
- CatsMe: https://carelogy-japan.com/en
- Pawzy: https://pawzy.io/
- SafePet AI: https://safepet.ai/
- PetAI: https://apps.apple.com/us/app/petai-care-connect-create/id6742016840
- Pet Genius: https://apps.apple.com/us/app/pet-genius/id6450996119
- Tractive health monitoring: https://tractive.com/en/fp/health-monitoring-for-dogs-and-cats
- FitBark store/API: https://www.fitbark.com/store/ and https://www.fitbark.com/dev/
- PetPace: https://petpace.com/product/the-new-petpace-health-2-0/
- Maven Pet: https://maven.pet/
- Fi behavior tracking: https://blog.tryfi.com/introducing-ai-behavior-tracking/
- Whistle: https://www.whistle.com/pages/about-us
- Catlog store/technology: https://rabo.cat/en-us/ and https://rabo.cat/en-global/technology/
- Moggie: https://www.moggie.me/
- SATELLAI: https://satellai.com/
- PitPat: https://www.pitpat.com/
- Kippy: https://www.kippy.eu/
- Sure Petcare Animo: https://www.surepetcare.com/en-us/pet-care/animo
- Petivity: https://www.purina.com/petivity-smart-litter-box-monitor
- Whisker Litter-Robot: https://www.whisker.com/clean-living
- PETKIT Purobot: https://petkit.com/products/purobot-max-pro
- CATLINK: https://www.catlinkus.com/
- SiiPet LitterLens: https://siipet.com/products/litterlens
- Toletta: https://apps.apple.com/us/app/toletta-cats-health-toilet/id1459262354
- PrettyLitter: https://www.prettylitter.com/
- Petlibro Dockstream RFID: https://petlibro.com/products/dockstream-rfid-smart-fountain
- Petlibro One RFID: https://petlibro.com/products/one-rfid-pet-feeder
- SureFeed Microchip Feeder Connect: https://www.surepetcare.com/en-us/pet-feeder/microchip-pet-feeder-connect
- Furbo Smart Alerts: https://furbo.com/us
- SignalPET: https://www.signalpet.com/
- Antech RapidRead: https://www.antechdiagnostics.com/imaging-services/rapidread/
- Zoetis VETSCAN Imagyst: https://www.zoetisus.com/products/diagnostics/instruments/vetscan-imagyst/
- IDEXX inVue Dx: https://www.idexx.com/en/veterinary/analyzers/invue-dx-analyzer/
- IDEXX SediVue Dx: https://www.idexx.com/en/about-idexx/news/newsroom-archive/idexx-advances-power-sedivue-dx-latest-software-update/
- Scribenote: https://www.scribenote.com/
- Talkatoo: https://talkatoo.com/
- CoVet: https://www.co.vet/home-1
- Digitail: https://digitail.com/
- Fetch Health Forecast: https://www.fetchpet.com/faqs/fetch-health-forecast
- Basepaws: https://basepaws.com/
- Wisdom Panel: https://www.wisdompanel.com/
