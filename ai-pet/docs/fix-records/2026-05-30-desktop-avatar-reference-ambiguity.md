# 桌宠形象 Demo 开源参考边界不清问题记录

日期：2026-05-30

## 事实时间线

- 用户询问“桌面端真实的宠物怎么展示，足够真实怎么做，可以参考什么，做一个给我看看，只需要展示桌面形象”。
- 本次生成了 `reports/desktop-pet-avatar-demo/index.html`、`reports/desktop-pet-avatar-demo/mochi-corgi-cutout.png`、`ai-pet/public/assets/pets/mochi/mochi-corgi-realistic-v1.png`。
- 回复中提到参考 OpenPets、Live2D/Rive、EMO/Moflin/aibo，但没有明确说明哪些是开源项目、哪些只是表达路线参考、哪些代码实际被复用。
- 用户追问：“你是参考了哪个项目，还是自己从头做的？你到底参考了哪个开源项目啊？”

## 证据引用

- `ai-pet/docs/research/desktop-pet-foundations.md`：MVP 底座裁决是 OpenPets；BongoCat / AI-Desktop-Pet 只是 Live2D 方向参考。
- `ai-pet/docs/research/framework-comparative-research-2026-05-30/open-source-projects/openpets/README.md`：OpenPets 适合做桌宠表达外壳，不承接真实宠物业务逻辑。
- `reports/desktop-pet-avatar-demo/index.html`：本次视觉原型为新写 HTML/CSS。
- `reports/desktop-pet-avatar-demo/mochi-corgi-cutout.png`：本次生成的透明宠物形象资产。

## 根因

“参考项目”和“实际复用代码”没有拆开说明。实际情况是：本次 Demo 是项目内新做的视觉原型，不是从某个开源桌宠项目 fork 后改出来的；开源锚点是 OpenPets 的运行时和 pet pack 机制。

## 修复计划

1. 更新 `ai-pet/docs/research/desktop-real-pet-avatar-2026-05-30.md`，新增“本次 Demo 的复用边界”。
2. 在对外回复中明确：本次展示是新做原型；真正要接入的开源项目是 OpenPets；BongoCat/AI-Desktop-Pet/Live2D 只作为后续高级形象参考。
3. 后续如果说“参考/复用”，必须同时说明是否复制代码、是否运行该项目、是否只是研究设计机制。
