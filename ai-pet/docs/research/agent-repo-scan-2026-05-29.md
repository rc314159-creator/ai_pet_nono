# Agent 仓库快速校验记录

日期：2026-05-29

目的：确认 MVP agent 候选仓库的当前 canonical GitHub 地址，避免使用旧链接或重定向仓库。

## GitHub CLI 校验结果

| 项目 | 当前仓库 | 描述 | License | 备注 |
|---|---|---|---|---|
| opencode | [anomalyco/opencode](https://github.com/anomalyco/opencode) | The open source coding agent. | MIT | 第一候选，走 MCP tools 接入 AI Pet |
| OpenHands | [OpenHands/OpenHands](https://github.com/OpenHands/OpenHands) | AI-Driven Development | Other | 能力强但重，作为备选 |
| Goose | [aaif-goose/goose](https://github.com/aaif-goose/goose) | open source, extensible AI agent | Apache-2.0 | 本地 agent 备选 |
| aider | [Aider-AI/aider](https://github.com/Aider-AI/aider) | AI pair programming in your terminal | Apache-2.0 | 更偏代码编辑，不作为主线 |

## 裁决

先验证 opencode 的 MCP 接入，把 AI Pet 暴露为受控工具。OpenHands/Goose/aider 保留为后续替代方案，不进入第一轮实现。
