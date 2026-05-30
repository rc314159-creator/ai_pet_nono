---
title: VPet 开源项目调研
description: VPet 的本地构建体验、平台限制和玩法参考价值。
status: 起草中
created: 2026-05-30
updated: 2026-05-30
doc_type: research-evidence
domain_taxa:
  - open-source
  - virtual-pet-gameplay
source:
  - https://github.com/LorisYounger/VPet
  - ../../../../../../reports/pet-sandbox-overnight/run-results.json
---

# VPet

## 基本信息

- 仓库：<https://github.com/LorisYounger/VPet>
- GitHub 元数据：6237 stars，614 forks，Apache-2.0，默认分支 `main`，最近 pushed_at `2026-05-27T13:00:00Z`。
- 技术栈：Windows / WPF / Steamworks 生态。
- 本机体验状态：fail，macOS 源码构建未通过。

## 实际使用体验

本地尝试：

```bash
dotnet build VPet-Simulator.Windows/VPet-Simulator.Windows.csproj -p:EnableWindowsTargeting=true
```

结果：

- .NET 10 SDK 可用。
- Core 和 Windows.Interface 部分构建成功。
- Windows 桌面 app 在 macOS 构建失败，缺 Steamworks/Friend/Lobby/SteamId 等类型。

## 与 AI Pet 框架的关系

VPet 工程复用价值受平台限制，但玩法参考价值高：

- 食物、玩具、商品和宠物状态绑定。
- 桌面宠物长期常驻。
- 用户通过购买/使用物品影响宠物状态。
- 强二次元人格和桌面陪伴感。

## 复用建议

不作为主工程依赖。适合在二阶段研究“商品如何进入状态机”和“装扮/道具如何形成付费点”。第一版仍应坚持 OpenPets + 自有 Domain Service。

