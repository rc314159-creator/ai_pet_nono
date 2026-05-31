# AI Pet 产品侧素材交付清单

生成时间：2026-05-31

## 需求原文整理

产品侧需要用于对接/发送的素材：

1. 产品对话界面连续录屏：数字小狗主动分享今天的日常，对话内容逐步出现；用户提问时展示底部动态生成的照护建言/思考态。
   - 小狗：“今天阳光很好，我在窗边睡了一下午呢~”
   - 小狗：“下午有只小鸟停在阳台上，我盯着它看了好久！”
   - 小狗：“不过它飞走了，我又睡了一觉~”
   - 用户：“你今天吃得多吗？”
   - 小狗：“吃了很多！不过最近好像长胖了一点……”
   - 用户：“你最近睡得怎么样？”
   - 小狗：“我最近睡得还行，平均每晚14小时呢！不过昨晚只睡了11小时，可能是因为下午太兴奋了……”
2. 状态页面素材：
   - 状态页面原始页面
   - 点击睡眠展开后的页面
   - 再点击活动展开后的页面
   - 再点击休息/休闲展开后的页面
   - 休息中变为异常后的页面：显示“存在异常”、睡眠卡片上方异常提醒、异常历史入口红点
   - 点击异常事件展开后的页面
   - 再点击展开详情后的页面
3. 换装页面：只展示换装按钮和下面的小狗舞台，底部截图到菜单栏。
4. 任务、电商、社区页面各一张。

## 发送标题和文件

| 序号 | 建议发送标题 | 文件 |
|---|---|---|
| 1 | 产品对话界面：数字小狗主动分享今天日常（连续录屏，含动态建言） | `video/01-chat-dialogue-continuous-recording.mp4` |
| 2 | 产品对话界面：日常分享对话最终画面 | `screenshots/01-chat-dialogue-final.png` |
| 3 | 状态页面：原始页面 | `screenshots/02-status-original.png` |
| 4 | 状态页面：点击睡眠展开后的页面 | `screenshots/03-status-sleep-expanded.png` |
| 5 | 状态页面：再点击活动展开后的页面 | `screenshots/04-status-activity-expanded.png` |
| 6 | 状态页面：再点击休息/休闲展开后的页面 | `screenshots/05-status-rest-expanded.png` |
| 7 | 状态页面：休息中变为异常后的页面 | `screenshots/06-status-rest-abnormal.png` |
| 8 | 状态页面：点击异常事件展开后的页面 | `screenshots/07-status-abnormal-event-open.png` |
| 9 | 状态页面：再点击展开详情后的页面 | `screenshots/08-status-abnormal-detail-expanded.png` |
| 10 | 换装页面：换装按钮和小狗舞台 | `screenshots/09-outfit-stage.png` |
| 11 | 任务页面：每日任务 | `screenshots/10-tasks-daily.png` |
| 12 | 电商页面：宠物市集 | `screenshots/11-market.png` |
| 13 | 社区页面：宠物社区 | `screenshots/12-community.png` |

## 补充文件

- `qa/screenshots-contact-sheet.jpg`：所有截图的质量检查联系表。
- `qa/dialogue-recording-contact-sheet.jpg`：连续录屏抽帧质量检查联系表。
- `qa/dialogue-recording-frames/`：连续录屏关键时间点抽帧，仅用于质检。

## 质量检查记录

- 所有 PNG 成图尺寸：860 x 1864。
- 对话录屏：860 x 1864，30fps，约 19.17 秒，H.264 MP4，连续录屏生成，不是静态帧停留合成。
- 截图检查项：未发现空白页、浏览器边框、微信边框、明显截断、底部菜单缺失或页面错位。
- Runtime 检查：Playwright console warning/error 为 0；截图过程关键 API 请求为 200。
- 异常态说明：当前运行数据没有自然露出“异常提醒 + 红点 + 存在异常”的完整组合，因此该张异常态截图是在截图会话内按产品需求临时标注生成，不改源码。
