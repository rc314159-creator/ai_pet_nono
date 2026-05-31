---
title: 参考视频音轨与画面清晰度优化记录
description: 记录 docs/参考/8c04dccf9eb5c6a578b08283a9f1abad.mp4 的音轨清晰度、4K 清晰化与生成式视频修正边界。
status: 已处理
created: 2026-05-31
updated: 2026-05-31
doc_type: fix-record
domain_taxa:
  - reference-material
  - video-production
  - audio
  - verification
related:
  - ../INDEX.md
---

# 参考视频音轨与画面清晰度优化记录

## 事实时间线

- 2026-05-31，用户指出根级参考素材 `docs/参考/8c04dccf9eb5c6a578b08283a9f1abad.mp4` 需要逐帧优化：音轨中有说话不清楚的地方，视频需要更清晰、更高分辨率，并希望修正画面里不合理逻辑或类似门开得不自然的生成痕迹。
- 原始视频经 `ffprobe` 检查为 3 分 20 秒，960×544，26fps，H.264，视频码率约 1.11Mbps；音频为 AAC stereo，44.1kHz，约 72kbps。
- 2026-05-31，抽取 5 秒时间轴缩略图和 30-42 秒细分缩略图。30-38 秒出现左右分屏：左侧主人在外等待/行走，右侧狗在室内等待。这是叙事对照，不是门或物理动作错误。
- 2026-05-31，使用转录模型转录原始音轨，关键名词被识别为“羊虫”“桌虫”，应为“养宠”“桌宠”，证明原音轨在高频清晰度和关键名词辨识上不足。

## 证据引用

- 原始素材：`docs/参考/8c04dccf9eb5c6a578b08283a9f1abad.mp4`。
- 时间轴缩略图：`reports/video-optimization-2026-05-31/contact-sheet-5s-timestamp.jpg`。
- 30-42 秒细分缩略图：`reports/video-optimization-2026-05-31/contact-sheet-0030-0042.jpg`。
- 转录结果：`reports/video-optimization-2026-05-31/transcription-whisper.json`。
- 修正旁白稿：`reports/video-optimization-2026-05-31/corrected-narration.md`。
- 最终增强视频：`docs/参考/8c04dccf9eb5c6a578b08283a9f1abad.optimized-4k.mp4`。
- 备选 Qwen TTS 重配音版本：`docs/参考/8c04dccf9eb5c6a578b08283a9f1abad.optimized-4k-qwen-tts.mp4`。

## 根因

- 原始视频分辨率和码率偏低，960×544 与约 1.11Mbps 对产品演示细节、桌面 UI、手机界面和狗狗毛发都不够。
- 原始音频码率低，且混合了旁白和背景声，导致转录模型对“养宠”“桌宠”等项目关键词识别错误。
- 当前云雾可用的 Veo 3.1 4K / Pro 4K 视频模型是 8 秒级异步生成模型，适合文生视频、首帧/首尾帧生成，不适合作为 200 秒源视频的直接逐帧 video-to-video 修复工具。
- 参考视频中 00:33-00:38 的左右分屏并非画面逻辑错误，而是“主人在外 / 宠物在家等待”的并置表达；不应强行替换成单一镜头。

## 修复计划与处理

- 音轨处理：保留原片时间同步，抽取音频后执行 FFT 去噪、高通/低通、压缩、限幅和响度标准化；输出用于最终同步版本的增强音轨。
- 旁白处理：用转录结果修正完整旁白稿；通过阿里百炼 Qwen Voice Design 创建清晰普通话女性旁白音色，并用 Qwen TTS 生成干净旁白，产出备选重配音版本。
- 视频处理：对原视频逐帧执行轻量时域降噪、Lanczos 放大、裁剪到 3840×2160、锐化和高码率 HEVC 编码，避免只做低码率拉伸。
- 逻辑修正：对抽帧结果做视觉检查；未发现需要强行替换的门、手部、开合动作等物理错误。保留原有分屏叙事结构。
- 输出策略：主版本使用同步增强原声；备选版本使用 Qwen TTS 清晰旁白，供后续人工听感筛选。

## 验证结果

- 主增强视频输出为 3840×2160、26fps、约 200.04 秒、HEVC Main、视频码率约 14.07Mbps，音频为 AAC 48kHz mono，约 170kbps。
- 最终视频抽样缩略图见 `reports/video-optimization-2026-05-31/final-contact-sheet-20s.jpg`，画面整体清晰度和 UI 可读性高于原始素材。
- 最终音频 `volumedetect` 峰值约 -1.5dB，避免原始音轨接近 0dB 的限幅风险。
