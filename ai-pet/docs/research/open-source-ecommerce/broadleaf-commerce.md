---
title: Broadleaf Commerce CE 调研记录
status: 起草中
created: 2026-05-30
updated: 2026-05-30
evidence_level: C
---

# Broadleaf Commerce CE

## 基本信息

- 仓库：https://github.com/BroadleafCommerce/BroadleafCommerce
- 开发文档：https://developer.broadleafcommerce.com/
- 技术栈：Java、Spring。
- 许可证/边界：Community Edition README 明确为 source-available under a Fair Use license，且说明不是 Apache 2 open source product；收入超过限制或违反 fair-use 需要商业许可。
- GitHub 快照：1,896 stars、1,307 forks；latest release `broadleaf-5.0.21-GA` 发布于 2021-12-17；2026-05-29 仍有 push 到开发分支。
- 官方定位：enterprise-class commerce-driven sites 的 Java/Spring framework；商业版/微服务版覆盖更多企业场景。

## 能力拆解

- 架构：传统 unified codebase，site/admin 共享 core dependency；另有商业 microservices edition。
- 关键能力：丰富 domain model、services、admin tooling、Solr search、workflow、modules、Spring Security、JPA/Hibernate。
- 企业能力：B2C、B2B、multi-tenant、marketplace 多见于 Enterprise/Microservices commercial editions。

## 对 AI Pet 的参考价值

- 可参考 enterprise commerce 的 domain model、workflow、module、search 和 admin 思路。
- 如果目标客户是 Java/Spring 企业系统，可作为集成或竞品参考。

## 风险与不足

- 不是普通意义上的宽松开源项目，许可证/收入限制明显。
- 最新 release 很旧，虽然开发分支仍有 push，但产品路线偏企业商业版。
- 对 AI Pet MVP 过重，且商业授权边界不适合早期快速试错。

## 初步结论

不作为开源候选底座。保留为 Java 企业 commerce 架构参考，并在选型时明确标注 source-available 风险。

## 来源

- https://github.com/BroadleafCommerce/BroadleafCommerce
- https://developer.broadleafcommerce.com/
