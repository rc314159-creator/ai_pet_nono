---
title: 社区项目逐项调研
description: 宠物社区、宠物社交、宠物友好地图和丢宠协作项目调研。
status: 起草中
created: 2026-05-30
updated: 2026-05-30
update_reason: 新增宠物社区项目调研
related:
  - ai-pet/docs/research/pet-community-ai-ecosystem/market-and-community-patterns.md
---

# 社区项目逐项调研

## 读法

- 适配度 A：可直接影响 AI Pet MVP 设计。
- 适配度 B：可作为功能/交互参考。
- 适配度 C：观察项目，不建议第一版投入。
- 证据强度：官方强、商店强、GitHub 强、新闻/报告中、社区弱。

## PetMeet

- 来源：[petmeet.com](https://www.petmeet.com/)
- 类型：宠物视频 feed、Breed/问题社区、AI 问答、线下活动。
- 核心机制：Home 视频、PawPost 社区、PawPal AI、Events、Profile/streak。
- AI 结合：PawPal 回答品种行为、食物替换、旅行规则和深夜照护问题，并声明不替代兽医。
- 对 MVP 启发：最接近“宠物社区 + AI 问答 + 活动”的完整消费级组合，可借鉴成 AI Pet 的二阶段社区模块。
- 风险：新产品，公开活跃数据有限；AI 回答质量和医疗边界需要验证。
- 适配度：A。
- 证据强度：官方强。

## PawSpace

- 来源：[pawspace.app](https://pawspace.app/)
- 类型：多物种宠物社交 + AI 健康检查 + Marketplace + Lost & Found。
- 核心机制：宠物资料、发图/视频、附近宠友、品种群组、商品、领养/配对、丢宠找回。
- AI 结合：AI Health Checker 面向狗、猫、鸟、爬宠等多物种。
- 对 MVP 启发：证明“社区、健康、商品、丢宠”可以被包装成一站式宠物 app；AI Pet 可采用更窄但更可信的版本。
- 风险：官方声称的用户/找回数据需要独立验证；多物种 AI 医疗建议风险更高。
- 适配度：A。
- 证据强度：官方中。

## Pawkadot

- 来源：[pawkadot.com](https://pawkadot.com/)
- 类型：狗主人 super app。
- 核心机制：健康记录、丢狗警报、本地 walks、领养匹配、社区搜索网络。
- AI 结合：丢狗系统中的 AI-powered visual matching，以及健康记录里的 AI condition analysis。
- 对 MVP 启发：丢宠不是单点功能，而是“宠物公开身份 + 地理广播 + 相似图像匹配 + 社区搜索”的流程。
- 风险：实际覆盖城市、视觉匹配准确率和找回案例需验证。
- 适配度：A。
- 证据强度：官方中。

## Petzbe

- 来源：[App Store](https://apps.apple.com/us/app/petzbe-no-humans-allowed/id1314000163)、[Petzbe press](https://petzbe.com/featured-artciles/2018/4/23/petzbe-launches-no-humans-allowed-social-community-app-for-pets)
- 类型：宠物视角社交网络。
- 核心机制：宠物发帖、照片/视频、心情标签、贴纸、社区问答、救助捐赠活动。
- AI 结合：App Store 文案明确称不使用操纵注意力的 AI 算法，采用 chronological/community-driven 逻辑。
- 对 MVP 启发：可以把宠物拟人视角作为社区内容格式；AI Pet 的桌宠气泡和分享卡片可以由宠物“自己说话”。
- 风险：不主打 AI；更多是社区氛围和内容治理参考。
- 适配度：B。
- 证据强度：商店强。

## BarkHappy

- 来源：[BarkHappy press](https://barkhappy.com/barkhappy-new-mobile-app-for-dog-owners-launches-nationwide/)
- 类型：狗主人本地社交、宠物友好地图、活动、丢狗警报。
- 核心机制：狗狗 profile、附近 dog discovery、wags/message、playdate、20,000+ dog-friendly places、events、lost dog alerts。
- AI 结合：未见官方 AI 主线。
- 对 MVP 启发：线下活动和丢宠警报比普通 feed 更强交易/行动动机；适合做社区挑战和本地提醒。
- 风险：早期项目，当前活跃度需要重新验证。
- 适配度：B。
- 证据强度：官方强。

## BringFido

- 来源：[bringfido.com](https://www.bringfido.com/)、[about](https://www.bringfido.com/about/?bot=on&currency=CAD)
- 类型：宠物友好旅行和本地生活目录。
- 核心机制：酒店、餐厅、活动、狗公园、海滩、徒步、服务商、用户评论、宠物友好保证。
- AI 结合：未见官方 AI 主线。
- 对 MVP 启发：宠物社区不一定从社交 feed 起步，强工具型目录和评论也能形成社区；商品/服务推荐应嵌入任务场景。
- 风险：更偏旅行/目录，不适合直接做 MVP 核心。
- 适配度：B。
- 证据强度：官方强。

## Meetup Dogs

- 来源：[Meetup Dogs topic](https://www.meetup.com/topics/dogs/us/)
- 类型：线下狗主人活动组织。
- 核心机制：狗公园、playgroup、训练、徒步、品种聚会、地方组织者。
- AI 结合：未见官方 AI 主线。
- 对 MVP 启发：社区的真实价值常发生在线下；MVP 可用“本周运动挑战/护理挑战”模拟可组织的活动单元。
- 风险：不是宠物专用产品，质量取决于本地组织者。
- 适配度：B。
- 证据强度：官方强。

## TheCatSite

- 来源：[thecatsite.com](https://thecatsite.com/)
- 类型：猫主题论坛和知识社区。
- 核心机制：猫健康、营养、行为、孕猫/幼猫、社交 lounge、专家论坛归档；页面显示超过 417k threads 和 6.15M messages。
- AI 结合：未见官方 AI 主线。
- 对 MVP 启发：猫主人问答强需求集中在健康/营养/行为；AI 问答应输出结构化“记录、观察、何时就医”而不是泛百科。
- 风险：论坛信息质量不均，必须与兽医边界结合。
- 适配度：B。
- 证据强度：官方强。

## 萌宠圈

- 来源：[petscircle.cn](https://www.petscircle.cn/)
- 类型：中国宠物社区 + 宠物管家。
- 核心机制：附近/关注/热榜、宠物明星榜、宠物档案、疫苗/驱虫提醒、健康指标趋势、点赞收藏私信。
- AI 结合：未见官方 AI 主线。
- 对 MVP 启发：中国用户对“宠物档案 + 社交热榜 + 健康提醒”的组合有明确产品表达；AI Pet 可把这些放进桌宠触达。
- 风险：产品规模和活跃度未验证。
- 适配度：B。
- 证据强度：官方中。

## 波奇宠物

- 来源：[boqii.com/about](https://www.boqii.com/about.php)
- 类型：中国老牌宠物社区、电商、服务、百科。
- 核心机制：论坛、商城、服务 O2O、宠物百科；官网称 300 万以上爱宠用户分享养宠生活。
- AI 结合：未见官方 AI 主线。
- 对 MVP 启发：社区与电商/服务闭环是成熟路径，但 AI Pet 应避免变成泛电商，把推荐锚定在宠物档案与任务。
- 风险：公开页面偏旧，当前活跃状态需验证。
- 适配度：B。
- 证据强度：官方中。

## 宠吧

- 来源：[chong.pbottle.cn](https://chong.pbottle.cn/)
- 类型：中国宠物话题社区、附近聊天交友、工具箱。
- 核心机制：宠友动态、领养/转让、爬宠交流、公告、隐私/协议。
- AI 结合：未见官方 AI 主线。
- 对 MVP 启发：多物种社区会引入交易、送养和安全审核问题；MVP 不应过早开放自由交易 UGC。
- 风险：动态样本较旧，社区治理成本高。
- 适配度：C。
- 证据强度：官方中。

## PawBoost

- 来源：[pawboost.com](https://www.pawboost.com/)
- 类型：丢宠/拾宠广播网络。
- 核心机制：丢宠报告、附近 alert、社交平台扩散、找回故事。
- AI 结合：未见官方 AI 主线。
- 对 MVP 启发：丢宠协作是可强触发桌宠和社区的事件类型；可与 Petnow/Pawkadot 视觉识别方向组合。
- 风险：区域覆盖、转化和付费结构需要具体验证。
- 适配度：B。
- 证据强度：官方中。

## Schnoz

- 来源：[schnoz.ai](https://schnoz.ai/)
- 类型：AI 丢宠恢复基础设施。
- 核心机制：AI photo matching、community alerts、local sightings、视觉签名对比 found pet reports。
- AI 结合：以图像匹配和找回流程为核心。
- 对 MVP 启发：二阶段可做“丢宠模式”：公开宠物身份卡、附近广播、照片匹配、进展时间线。
- 风险：公开案例和准确率需要验证。
- 适配度：A。
- 证据强度：官方中。

