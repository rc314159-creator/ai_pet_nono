---
title: 2026-05-30 装扮页真实同步范围应收敛到桌宠配饰问题记录
description: 记录“我的装扮”页不能把服装、毛发、妆容描述成真实桌宠换装，应只把三个配饰选项真实同步到照片级桌宠动作帧。
status: 已批准
created: 2026-05-30
updated: 2026-05-30
update_reason: 根据用户对装扮页与桌宠真实形态统一的纠偏新增。
doc_type: fix-record
domain_taxa:
  - app-window
  - desktop-runtime
  - outfit
  - data-contract
related:
  - ../product/product-spec-2026-05-30.md
  - ../architecture/technical-architecture-2026-05-30.md
  - ../modules/INDEX.md
  - ../plan/implementation-log-2026-05-30.md
---

# 2026-05-30 装扮页真实同步范围应收敛到桌宠配饰问题记录

## 事实时间线

- 2026-05-30，当前应用窗口“我的装扮”页包含 `服装`、`毛发`、`妆容`、`配饰` 四类，并且底部文案表达为装扮会同步到对话背景板和桌宠外观。
- 2026-05-30，用户提供两张“我的装扮”页截图和一张照片级桌宠截图，明确说明页面不是 HTML 展示页，而是 Electron 应用窗口。
- 2026-05-30，用户进一步明确：页面和桌宠的形式必须统一，以桌宠为标准；这里的“换装”指第三张照片级桌宠形象，不是卡通页面小狗。
- 2026-05-30，用户建议当前只真实更换三个配饰选项；每张桌宠图片都需要生成对应配置的配饰图片，例如项圈、铃铛等；服饰、毛发、妆容不真正换装。
- 2026-05-30，第一轮程序化配饰叠加失败：配饰按粗略透明 bbox 估算落点，部分帧落到肩背或胸前，用户明确指出没有认真逐图生成，也没有戴到宠物头部/头颈位置。
- 2026-05-30，用户进一步明确：不是运行时在原图上叠加一张透明配饰图，而是每个配置都要直接生成一张新的完整宠物图片。
- 2026-05-30，第二轮“完整帧”仍然错误：虽然输出成了完整 PNG，但本质仍是程序把配饰图层合成到狗图上，不是图像模型重新生成“狗本身戴着配饰”的新图片；用户再次明确这不符合要求。
- 2026-05-30，用户指出当前“我的装扮”页还有 4 个页面问题：顶栏返回/剪辑按钮没有作用却一直显示；选项卡片只显示颜色方块，不显示物料真实样子；需要按图像编辑生成逻辑做真实配饰换装并保证质量；当前只能穿不能脱，缺少“无/脱下”选项。

## 证据引用

- `src/App.tsx`：`outfitTabs` 当前包含 `服装`、`毛发`、`妆容`、`配饰`，并且 `OutfitView` 对四类都允许选择与保存。
- `src/App.tsx`：`sync-note` 当前表达为装扮会同步到对话背景板和桌宠外观，容易把 mock 选择误描述为真实后台/桌宠外观同步。
- `src/App.tsx`：`MobileTopNav` 在每页渲染左侧关闭/返回按钮和右侧图标按钮，但当前对用户看到的“返回”“剪辑”等按钮没有实际页面价值。
- `src/App.tsx` / `src/styles.css`：`costume-grid` 卡片使用 `--swatch` 色块作为视觉，不能表达服装或配饰真实长相。
- `src/App.tsx`：服装和配饰选项没有显式“无/脱下”，造成只能选择某件装扮，不能清空。
- `desktop-photo-pet/runtime.js`：桌宠运行时当前只播放照片级 Mochi 动作帧，没有外观配饰状态，也没有逐帧配饰叠加逻辑。
- `public/assets/pets/mochi/motions/manifest.json`：当前照片级桌宠通过多帧 PNG 序列运行，真实换装必须作用到这套帧，而不是旧的卡通 CSS 宠物。
- `public/assets/pets/mochi/accessories/acc-*/motions/*/*.png`：第一轮生成的透明叠加图存在落点不准问题，且资产形态不符合用户要求，应停止使用。
- `public/assets/pets/mochi/outfit-motions/acc-*/motions/*/*.png`：第二轮生成的是程序合成后的完整 PNG，不是图像模型重新生成的新图片，同样不可作为最终真实换装资产。

## 根因

原实现把装扮页当成应用窗口 mock 交互来做，四个分类都给了可保存反馈，但没有区分“页面预览”和“真实同步到桌宠”的能力边界。与此同时，桌宠已经切换为照片级多帧动作包，服装、毛发、妆容如果要真实换装，需要对每个动作帧重做完整图像生成，当前 Demo 不应承诺。配饰可以作为最小真实闭环：为每个配饰配置生成一整套完整桌宠帧图，桌宠运行时按当前配饰选择直接切换完整帧路径。

第一轮配饰生成的直接根因是：脚本只根据整只宠物透明区域 bbox 推断头颈位置，没有识别具体帧中的耳朵、脸部和头部中心；当宠物转身、走路或身体占比变化时，项圈和铃铛会漂移到肩背或胸前。

第二轮修正仍然不满足用户意图，因为它只是把配饰图层提前烘焙进完整 PNG。用户要的是用原始桌宠帧作为参考，由图像模型生成一张新的完整宠物图片，让配饰成为宠物图像的一部分，而不是贴图、叠加、透明层或程序合成。

## 修复计划

1. 知识库口径更新为：当前 Demo 的真实桌宠换装只支持三个配饰项；服装、毛发、妆容保留为应用窗口预览或后续方案，不写入桌宠外观。
2. 新增桌宠外观状态接口，保存配饰后应用窗口写入当前配饰配置。
3. 桌宠 Electron 运行时轮询外观状态，并按当前配饰直接选择由图像模型生成的新完整帧图路径，不做运行时透明叠加或程序贴图合成。
4. 为现有 Mochi 动作包的每张帧图重新生成三个完整配饰帧图，路径按配饰和原帧路径稳定映射；生成方式必须是图像生成/图像编辑模型基于原帧生成新图，不是 PIL/canvas 贴图。
5. 装扮页 UI 改为只有 `配饰` 能执行真实保存同步；其他分类不再显示成已真实同步。
6. 删除顶栏无效按钮；所有装扮卡片使用实际图片缩略图，不再使用纯色方块。
7. 服装、毛发、妆容和配饰都增加“无/不调整/脱下”选项；配饰的“无配饰”可以保存并同步到桌宠外观状态。

## 验证标准

- 选择并保存任意一个配饰后，API 返回当前配饰状态。
- 桌宠运行时能读取该状态并直接加载对应配饰的完整桌宠帧图；这些帧图必须是图像模型生成的新图，不是程序合成图。
- “服装”“毛发”“妆容”不会提交真实桌宠外观状态。
- 页面顶栏不再出现无功能返回/剪辑按钮。
- 装扮选项卡片不再出现纯色方块，必须显示物料或预览图片。
- 用户可以选择“无配饰”并保存，桌宠外观状态变为 `none`。
- 抽样检查 `idle`、`walk`、`turn`、`sit`、`alert` 等动作帧，配饰位于宠物头部下沿/头颈位置，不能漂到肩背、腹部或空白区域。
- `npm run typecheck` 和 `npm run build` 通过。

## 2026-05-30 追加执行记录

- 已停止错误的透明配饰叠加资产和程序合成完整帧路线，新增 `scripts/generate_accessory_image_edits.mjs`，用原始桌宠帧作为 image edit 输入，为 `acc-gps`、`acc-bell`、`acc-medal` 生成新的完整宠物图片。
- 批量生成按三个配饰分队列并行执行，每个配饰 284 张，输出到 `reports/outfit-generation-batch/full-run-2026-05-30/`；队列状态分别写入 `status-acc-gps.jsonl`、`status-acc-bell.jsonl`、`status-acc-medal.jsonl`。
- 新增 `scripts/normalize_accessory_image_edit_frames.py`，只做透明背景规范化和尺寸统一，不添加、不移动、不合成配饰；归一化后的完整帧包进入 `public/assets/pets/mochi/image-edited-outfits/<accessory>/`。
- `server/appearance.ts` 只在对应配饰完整帧包 manifest 标记 `complete: true` 后返回 `assetMode: image_edit_generated_full_frame`；否则仍返回 `image_edit_required`，避免未验收资产直接上桌宠。
- `desktop-photo-pet/runtime.js` 已改为按 `assetMode` 和 `accessoryId` 加载整张配饰帧，找不到或未验收时回退原始帧；该路径不包含运行时贴图叠加。
- 装扮页已删除顶部圆形按钮，卡片从纯色方块改成真实图片缩略图；配饰卡片使用头颈近景缩略图，主预览仍使用完整宠物图。
- 装扮页和接口均验证了 `无配饰` 可保存，接口返回 `accessoryId: none` 和 `note: 已移除桌宠配饰。`。
- 本轮真实 image-edit 生图因中转余额/配额耗尽停止在部分完成状态：`acc-gps` 264/284、`acc-bell` 172/284、`acc-medal` 180/284。已生成帧已规范化到 `public/assets/pets/mochi/image-edited-outfits/`，但三个 manifest 均为 `complete: false`，因此不会启用到桌宠。
- 已探测 llmmelon、AI Hub Mix、云雾三个通道，均返回余额/配额不足。后续要补齐剩余帧，必须更换有余额的图像编辑通道或充值后续跑脚本。

## 2026-05-31 追加问题

- 用户指出配饰卡片只需要展示配饰本体，不应该在 `定位徽章`、`提醒铃铛`、`巡逻奖章` 卡片里继续放带小狗的图。
- 用户指出装扮页下方预览区的小狗不应该是静态图片，应使用已有会动的小狗动作帧。
- 用户指出配饰应实际可运用；当前保存配饰后会动的小狗身上没有对应配饰。直接原因是服务端把 `complete: false` 的部分 image-edit 帧包全部挡掉，导致即便已有 `idle`、`turn`、`sleep_laze` 等大量真实生图帧，桌宠仍完全回退到原始无配饰帧。

### 2026-05-31 修复计划

1. 配饰选项卡片改为配饰本体图片：GPS 定位徽章、提醒铃铛、巡逻奖章，不再用带狗缩略图。
2. 装扮页预览区改用 `MochiMotionAvatar` 动画组件，而不是静态 `img`。
3. `MochiMotionAvatar` 支持读取 `image-edited-outfits/<accessory>/manifest.json`，有对应帧时直接播放完整生图帧，缺失帧才回退原始动作帧。
4. 桌宠运行时和外观接口改为只要某配饰存在已生成帧就允许切换到 `image_edit_generated_full_frame`，同时文案说明“缺失动作会回退原始帧”，避免半套资产完全不可见。

### 2026-05-31 执行记录

- 新增 `public/assets/outfit/acc-none-item.png`、`public/assets/outfit/acc-gps-item.png`、`public/assets/outfit/acc-bell-item.png`、`public/assets/outfit/acc-medal-item.png`，配饰卡片只展示脱下状态图标、徽章、铃铛、奖章本体，不再放带狗缩略图。
- `src/App.tsx` 的装扮预览区已从静态图片切换为 `MochiMotionAvatar`，选择配饰时传入当前草稿配饰，页面预览会优先播放对应配饰的完整生图帧。
- `src/components/MochiMotionAvatar.tsx` 已支持读取 `image-edited-outfits/<accessory>/manifest.json`；manifest 中存在的帧使用配饰完整帧，不存在的帧回退原始动作帧。
- `server/appearance.ts` 已从“必须 complete=true 才启用”改为“存在已生成帧即可启用”，API 返回 `assetMode: image_edit_generated_full_frame`；未补齐动作会在文案中明确“缺失动作会回退原始帧”。
- 已通过浏览器验证：配饰页卡片 src 分别为 `acc-none-item.png`、`acc-gps-item.png`、`acc-bell-item.png`、`acc-medal-item.png`；预览区存在 canvas 动态组件且不存在旧的 `.outfit-preview-image` 静态图；保存定位徽章后 API 返回 `image_edit_generated_full_frame`。
- 已通过 `npm run typecheck`、`npm run build`、`node --check desktop-photo-pet/runtime.js`、`node --check desktop-photo-pet/main.cjs`。

## 2026-05-31 追加问题：装扮页预览动作不完整且暴露实现文案

### 事实时间线

- 2026-05-31，用户指出“我的装扮”页底部状态文案出现“优先使用已生成的完整生图帧，缺失动作会回退原始帧”这类实现说明，属于把开发思路暴露到 App UI。
- 2026-05-31，用户指出装扮页预览里的小狗没有完整运动，只是在原地站着。

### 证据引用

- `src/App.tsx`：装扮页预览组件固定传入 `motion="idle"`，导致预览只播放待机动作。
- `src/App.tsx`：`sync-note` 直接渲染“完整生图帧”“缺失动作会回退原始帧”“当前真实同步项”等工程实现口径。
- `server/appearance.ts`：接口返回的 `note` 同样包含“完整生图帧”“缺失动作会回退原始帧”，该字段会被桌宠气泡读取。

### 根因

上一次修复把“资产启用策略”和“用户可见状态”混在一起了。工程上确实需要知道 partial pack 如何回退，但 App 和桌宠气泡不应该展示这类实现细节。预览区虽然换成了动态组件，但调用方仍固定为 `idle`，没有使用已有动作包做轮播。

### 修复计划

1. 装扮页预览不再固定 `idle`，改为按已有动作包轮播 `idle`、`walk`、`jump`、`tail_wag`、`look_back`、`turn`、`sleep_laze`、`remind`、`alert`、`sit`、`wake_stretch`、`sniff_explore`。
2. App 内状态卡片只展示用户可理解的结果，例如“桌宠配饰：巡逻奖章”“已保存：提醒铃铛”，不展示完整生图、回退、真实同步项等实现文字。
3. 外观接口 `note` 改为用户可见的短句，避免桌宠气泡暴露运行时策略。

### 执行记录

- `src/App.tsx` 新增装扮预览动作轮播序列，预览区每 3.2 秒切换一个动作，不再固定 `idle`。
- `src/App.tsx` 的状态卡片改为 `桌宠配饰：<配饰名>` 或 `已保存：<配饰名>`，不再展示“完整生图帧”“回退原始帧”“当前真实同步项”等工程说明。
- `server/appearance.ts` 的桌宠气泡文案改为“已换上<配饰>。”或“已脱下配饰。”，保留内部 `assetMode` 供运行时使用但不暴露给用户。
- 浏览器验证时，装扮预览 class 依次出现 `mochi-motion-sleep_laze`、`mochi-motion-remind`、`mochi-motion-alert`、`mochi-motion-sit`、`mochi-motion-wake_stretch`、`mochi-motion-sniff_explore`，页面文本检查未命中实现说明。
- 已通过 `npm run typecheck` 和 `npm run build`。

## 2026-05-31 追加问题：我的页、对话页和桌宠未使用同一外观来源

### 事实时间线

- 2026-05-31，用户在 Electron App 的“我的/装扮”页保存并同步了装扮状态，页面显示“桌宠配饰：定位徽章”，预览区小狗身上能看到蓝色项圈/定位徽章。
- 用户指出切回对话页后，对话页顶部宠物形象没有对应妆造；退出应用窗口后，桌面桌宠也没有稳定显示同一妆造。
- 用户明确要求“我的页”“对话页”“退出后的桌宠页”应是同一个来源、同一个动画，因此妆造应该一致。

### 证据引用

- `src/App.tsx`：应用根状态里存在 `accessory`，并把它传给 `WelcomeView`、`ChatHome`、`StatusDataView`、`OutfitView`。
- `src/App.tsx`：`OutfitView` 在装扮预览区直接渲染 `<MochiMotionAvatar accessoryId={previewAccessory} ... />`，因此“我的页”预览能显示配饰帧。
- `src/App.tsx`：`ChatHome` 顶部宠物形象渲染 `<PetFigure state={state} accessory={accessory} outfit={outfit} ... />`，但 `PetFigure` 实现只解构 `state`、`motionAction`、`large`，返回 `<MochiMotionAvatar state={state} motionAction={motionAction} large={large} ... />`，没有把 `accessory` 继续传成 `accessoryId`。
- `server/appearance.ts`：当前桌宠外观状态是进程内变量 `currentAppearance`，不是持久化 store；API 重启后会回到 `accessoryId: "none"`。
- `desktop-photo-pet/runtime.js`：桌宠通过轮询 `/api/desktop-pet/appearance` 读取 `accessoryId` 和 `assetMode`，并按 `image-edited-outfits/<accessory>/<framePath>` 加载完整帧；应用窗口关闭事件当前只强制拉取对话气泡，没有强制刷新外观状态。

### 根因判断

当前实现并没有真正建立一个“宠物外观单一真相源”。实际是三套路径拼在一起：

1. “我的/装扮”页预览直接用 `draftAccessory` 渲染 `MochiMotionAvatar`，所以页面内预览正确。
2. 对话页通过 `PetFigure` 中转，但 `PetFigure` 丢掉了 `accessory`，所以对话页必然回到无配饰原始动作帧。
3. 桌宠通过 API 轮询进程内 `currentAppearance`，但该状态不持久，且关闭应用窗口时没有强制刷新外观；如果 API 重启、窗口隐藏期间轮询被延迟，或帧未及时加载，桌宠会表现得像没有同步。

此外，当前已批准口径仍是“真实同步只支持配饰”。服装、毛发、妆容在没有完整动作帧资产前只能作为应用窗口预览或后续方案，不能和配饰一样写成已同步到桌宠。

### 对齐后的修复计划

1. 立即修正 `PetFigure`：把 `accessory` 传给 `MochiMotionAvatar` 的 `accessoryId`，保证欢迎页、对话页、状态页等 App 内宠物形象使用同一配饰动作帧。
2. 抽出应用窗口共用的 `PetAppearanceState` 读取/更新逻辑：启动时从 `/api/desktop-pet/appearance` 水合；保存配饰后更新本地状态和服务端状态；所有宠物形象只读这个状态，不再各自维护预览来源。
3. `server/appearance.ts` 改为持久化 store，至少写入 `.ai-pet-data/appearance.json`，避免 API 重启后丢失当前配饰。
4. `desktop-photo-pet/runtime.js` 在应用窗口关闭通知后强制执行一次 `pollAppearance({ force: true })`，并在当前动作帧可用时立即重绘。
5. UI 文案继续保持边界：配饰可以“保存并同步”；服装、毛发、妆容若没有完整动作帧资产，只能说“保留预览”，不能暗示桌宠和对话页已经同步。
6. E2E 验证必须覆盖：保存定位徽章 -> 我的页预览有徽章 -> 切对话页顶部宠物有徽章 -> 关闭应用窗口后桌宠有徽章 -> API 重启后仍能恢复徽章状态。

### 执行记录

- 新增模块契约 `docs/modules/pet-appearance-2026-05-31.md`，明确 `PetAppearanceState` 是“我的/装扮页、对话页、状态页、桌面桌宠”的单一外观真相源；当前真实同步只支持配饰，服装、毛发、妆容在完整动作帧资产补齐前只能作为预览。
- `src/App.tsx` 的 `PetFigure` 已把全局 `accessory` 继续传给 `MochiMotionAvatar.accessoryId`，对话页、欢迎页和状态页不再丢掉已保存配饰。
- `src/App.tsx` 的状态页宠物预览不再优先使用静态 `profileImageUrl`，改为同样使用 `PetFigure`，避免状态页绕过全局外观状态。
- `server/appearance.ts` 已把外观状态从进程内变量升级为持久化 store，默认写入 `.ai-pet-data/appearance.json`，并支持 `AI_PET_DATA_DIR` / `AI_PET_APPEARANCE_FILE` 覆盖；API 重启后会读取上一次保存的配饰状态。
- `desktop-photo-pet/runtime.js` 在应用窗口关闭事件和可见性恢复时都会执行 `pollAppearance({ force: true })`，即使 `updatedAt` 未变化也会重新套用当前外观并重绘当前帧。

### 验证记录

- `npm run typecheck` 通过。
- `node --check desktop-photo-pet/runtime.js && node --check desktop-photo-pet/main.cjs && node --check desktop-photo-pet/preload.cjs` 通过。
- 临时数据目录持久化验证通过：保存 `acc-gps` 后，另一个进程重新 import `server/appearance.ts` 读取仍为 `accessoryId: "acc-gps"`，`assetMode: "image_edit_generated_full_frame"`。
- `npm run build` 通过，包含 Vite 构建、dist 资产裁剪和 server bundle。
- 浏览器自动化验证通过：先 POST 重置为 `none`，再在“我的/配饰”页点击“定位徽章”和“保存配饰”；`GET /api/desktop-pet/appearance` 返回 `accessoryId: "acc-gps"`；截图确认“我的”页预览、对话页顶部宠物、状态页宠物预览均显示蓝色项圈/定位徽章。证据截图：
  - `reports/application-window-ui-2026-05-30/e2e-appearance-my-saved-2026-05-31.png`
  - `reports/application-window-ui-2026-05-30/e2e-appearance-chat-acc-gps-2026-05-31.png`
  - `reports/application-window-ui-2026-05-30/e2e-appearance-status-acc-gps-2026-05-31.png`
- Electron 桌宠验证通过：启动 `npm run dev:photo-pet` 后关闭应用窗口，恢复的 `AI Pet Photo Desktop Pet` 窗口显示同一蓝色项圈/定位徽章，说明桌宠 runtime 读取并套用了同一个 `PetAppearanceState`。
