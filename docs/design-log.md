# 设计 / 交互变更日志（front-end）

> 单源：用户端 `ep/` + 商家端 `epmerchant/` 的设计风格 + 交互链路在此追踪。CHARTER 是 supreme law，本文件只记录派生决策与已落地的视觉/交互节点，便于回归。

## 2026-05-15 第十一轮：前后端链路审计 + App Review 1.2 UGC 合规

### 前端 fetch ↔ 后端 routes 审计

**死调用修复**：
- 商户端缺 `/api/posts` route → 广场 SquareFeed 加载失败 → **新建 `epmerchant/src/app/api/posts/route.ts`** 代理到 Laravel `/api/v1/posts`（GET + POST），引用现有 `lib/api/backend.ts:buildBackendUrl`，与商户端 env 约定一致（`BACKEND_API_BASE_URL` 而非 `BACKEND_API_BASE`）
- 客户端 `/api/auth/refresh` 仍未实现 → client 401 容错已在前几轮加好

**链路核对结果**：客户端 12 个 fetch URL 全部有对应 Next route；商户端补 posts 后也对齐。

### App Review Guidelines 1.2 UGC 合规

苹果上架要求任何 UGC（用户生成内容）必须具备：① 举报机制 ② 屏蔽用户 ③ 24h SLA ④ 联系开发者入口。

**新增组件 `components/safety/ReportSheet.tsx`**（双端复用）：
- 8 类举报原因：垃圾营销 / 色情 / 暴力 / 虚假信息 / 隐私 / 侵权 / 违法 / 其它
- 500 字以内备注框
- 可选 checkbox "同时屏蔽该用户"（提供 `authorUserId` 时显示）
- 提交反馈："举报已提交，平台将在 24 小时内处理" / "举报已提交，对方已加入屏蔽名单"
- 后端 404/405/501 时仍给用户合规反馈，不阻塞

**新增 API 代理**（双端镜像）：
- `POST /api/reports` → Laravel `/api/v1/reports`
- `POST /api/users/[userId]/block` / `DELETE` → Laravel `/api/v1/users/{id}/block`
- 后端未实现时返回 200 + `queued_pending_backend`，让前端 UI 完成合规闭环

**集成点**：
- 客户端 `PostDetailClient` 作者条加 ⋯ 按钮触发 ReportSheet，传 `authorUserId={authorId}`
- 商户端 `PostDetailClient` 同款集成
- `me/settings` 已有"联系客服 @localnow"入口（LINE 链接，符合 1.2 contact requirement）

**留 v2**：
- 单条评论的举报按钮（目前只覆盖 post 详情整体）
- 屏蔽名单管理页面（`/me/blocked`）— 让用户取消屏蔽
- 后端 Laravel `/api/v1/reports` + `users/{id}/block` 实现 + 管理员审核工作台

---

## 2026-05-15 第十轮：字号 Apple HIG 标准化

**问题**：审计发现 ep 25+ 种 / epmerchant 30+ 种 font-size，含大量非标准值（8.5/9.5/10.5/11.5/12.5/13.5）→ 视觉杂乱、不专业。

**Apple HIG 风 5 档（3 主 + 2 展示）**：
```
--ts-caption: 11px   /* metadata / 标签 / 微小辅助 */
--ts-body:    14px   /* 正文 / 列表 / 按钮 label / 默认（页面 90% 文字）*/
--ts-section: 17px   /* page title / section heading / 强调副标题 */
--ts-stat:    22px   /* 统计数字（展示性，仅 stat cell） */
--ts-display: 28px   /* hero 大标题（展示性，仅 hero） */
```

Utility class 双端共享：`.ts-caption / .ts-body / .ts-section / .ts-stat / .ts-display`

**Codemod 自动迁移规则**（`/tmp/font-codemod.mjs`）：
- 8 ~ 11.5 → 11
- 12 ~ 15.5 → 14
- 16 ~ 21.5 → 17
- 22 ~ 23.5 → 22
- 24+ → 28

支持三种形态：`fontSize: 13.5` / `fontSize: '13.5px'` / `font-size: 13px`。

**结果**：
- ep：25+ 种 → **5 种**（11/14/17/22/28）；改动 32 文件
- epmerchant：30+ 种 → **5 种**；改动 16 文件
- TS 全过 + 主页面真机截图验证视觉明显更专业

旧 `--fs-*` token 保留为别名指向新 `--ts-*`，兼容渐进迁移。

---

## 2026-05-15 第八+九轮：商家端落地（暗金 + 5 tab + 广场跨端复用）

### 第八轮（基础架构）
- **globals.css 暗金 token 全替换**：`--brand-primary #8a6a25` / `--brand-primary-deep #5e4715` / `--brand-accent #c9a96e`（与客户端 brass 同款，跨端品牌延续）+ `--ink-900 #2a1f0a` + `--gray-50 #faf6e9` 米黄暖底
- **5 tab 底栏**（广场居中凸起）：`首页 / 运营 / 广场(中凸金块) / 服务 / 我`；i18n 三语
- **layout 主题注入** `lib/brand-theme.ts` + `[locale]/loading.tsx` 路由 boundary + `components/PageLoading.tsx`（暗金 Spinner / EmptyState / ComingSoon）
- **5 主页面重构**：dashboard / 运营 (order-requests) / 广场 / 服务 (capabilities) / 我 (profile)，全部按 replica 视觉

### 第九轮（功能扩展）
- **客户端广场 100% 搬到商家端**：复制 8 个组件（`PostCardUser/Merchant/QA/Featured` + `SquareFeed/SquareFab/TopicStrip/PostDetailClient`）+ 2 个 lib (`typed-routes.ts` + `service-name-map.ts`)。装 `@formkit/auto-animate`。
  - 新建路由：`/zh/merchant/square/[postId]`（帖子详情）+ `/zh/merchant/square/new`（发帖）
  - `togglePostLike` / `togglePostFavorite` / `FeaturePendingError` 接入 `lib/square/client.ts`
- **派单详情升级**：竞价状态条 + 平台仲裁说明（保留 `MerchantOrderRequestDetail` 主体）
- **i18n AI 同步**：`scripts/i18n-sync.mjs` 复制；533 leaf strings，en/th 已齐
- **typedRoutes 启用**：8 处动态路径用 `as \`/${string}\`` cast
- **@playwright/test 接入**：登录 spec 2/2 通过
- **后台主题色管理**（DB seed）：
  - DB 加 `ui.brand.color_primary_merchant=#8a6a25` + `ui.brand.color_accent_merchant=#c9a96e`
  - 后端 `PublicSettingsController` whitelist + response 加这两个字段
  - `brand-theme.ts` 优先读 `_merchant` suffix，不 fallback 到客户端色（避免污染）
  - 现有 Dcat `/admin/setting/system` 通用 CRUD 已能编辑这些 key

### 商家端 npm scripts
```
npm run dev / build / start / lint / typecheck
npm run i18n / i18n:force      # AI 翻译 zh→en/th
npm run test:e2e / test:e2e:ui # Playwright
```

### 留下一轮
- 专用 Dcat brand 管理面板（独立菜单 + 4 字段表单 + 颜色预览）
- 派单"中标/落选"通知 push（前端 UI + 后端 webhook）
- 服务模板库（从平台 13 项标准服务复制能力）
- 我的发帖运营数据（曝光/转化）
- typed-routes cast 用 localeHref helper 净化

---

## 2026-05-15 第二轮：交互修复 + 广场详情重做

### 链路修复（5 主页 + 23 二级页）
- **首页右上消息按钮**：硬编码 `>3<` 角标移除；未对接 unread count API 时一律不显示。Why：避免数据不对称。
- **登录回跳**：`sendToAuthGate` 用 `location.replace`（不再 push）；login 提交用 `router.replace(nextPath)`；新增 1.5s 防抖，并发 useEffect 不重复触发 login。
- **广场链路**：
  - 新建 `/square/[postId]` 帖子详情（小红书式：hero 大图 + 作者条 + 正文 + 关联服务卡 + 评论区 + 底部固定互动栏）
  - 新建 `/square/new` 发帖页（1000 字 + 6 标签 + auth gate）
  - `SquareFab` 用 `href` prop，FAB 点击跳 `/square/new`
  - `SquareTeaser` 链接 `?#post-${id}` → `/square/${id}`
  - `SquareFeed` 每张卡片 wrap `<Link>`，PostCardUser/Merchant 内层 Link 改为 `onClick + stopPropagation` 避免 nested `<a>`
- **MeSettingsTab 死链**：`/me/addresses` → `/me/address`、`/me/reviews` → `/me/rating`、`/me/notifications` → `/me/messages`
- **/me tab 持久化**：tab state 用 URL `?tab=settings` 同步，避免从子页面返回时 tab 重置到 'posts'

### Loading / 空状态
- 新增 `src/app/[locale]/loading.tsx` 作为 Next 路由切换 boundary，消除"父子组件 InlineLoading 在路由瞬态叠加"产生的双车视觉
- `EmptyState` 与 `ComingSoon`：已有 drain.png 与 repair.png 占位图
- `standard-services` 列表合并 EmptyState 双重 guard

### 订单详情
- 删除 `OrderCenterExpandedContent` 底部 `t('orderPay.tapHint')` 整条文字按钮（"轻点状态可前往付款"重复 onRequestPay）

### 头像上传
- 修复：`uploadToOss` 不再走未实现的 `/api/uploads/url`，改回 `/api/oss/upload`（form-data + 后端 OSS policy 代理）

### 广场瀑布流
- `SquareFeed` 列表从单列改为 CSS `column-count: 2` 瀑布流，卡片 `break-inside: avoid` 防切割

## 2026-05-14 第一轮：首页交互接通
- 城市 pill 接入 `LocationSheet`（HomeShell 客户端壳）
- Hero 搜索栏滚出视口后吸顶 sticky 搜索栏（IntersectionObserver）
- 分类 chips 跳 `/standard-services?bucket=xxx`
- 排序按钮跳 `/standard-services?sort=hot/recent/rating/price`，列表页 SortSheet 底部弹出
- 商家"查看更多"链路从死链 `/standard-services` 改到 `/nearby`

## 设计 token 锚点
（详见 `ep/src/app/globals.css` 顶部）
- 品牌：`--brand-primary #0f523c` / `--brand-primary-deep #0a3a2a` / `--brand-accent #c9a96e` / `--brand-accent-deep #a07a32`
- 字体：Sora（display）+ Inter（body）+ Noto Sans Thai（฿ 字符 fallback）
- 全局工具类（globals.css）：`.app-page-bg`、`.app-glass-card`、`.app-input`、`.apple-btn-primary`、`.app-reveal`、`.order-center-card__inset`

## 路由清单（截至 2026-05-15）
```
/                                # 首页
/nearby                          # 附近商家
/square                          # 广场列表
/square/[postId]                 # 帖子详情（新）
/square/new                      # 发帖（新）
/square/author/[authorId]        # 作者主页
/orders                          # 订单列表
/orders/[orderNo]                # 订单详情
/orders/[orderNo]/review         # 订单评价
/orders/new                      # 新建订单
/me                              # 个人主页（?tab=posts|orders|settings）
/me/profile / address / messages / order-center / real-name / wallet-flow / recharge / withdraw / settings
/me/[feature]                    # fallback：real-name | profile | level | rating | address | messages | customer-service | feedback | recharge | withdraw
/standard-services               # 服务列表（?bucket=&sort=&query=）
/standard-services/[code]        # 服务详情
/categories / [slug]             # 分类
/ads                             # 推广
/auth/login / register
/services/[id]                   # 旧服务详情（legacy）
```

## 2026-05-15 第七轮：商家端暗金主题 + 功能 gap matrix（设计阶段）

### 设计稿（不动代码）
所有产物落地在 `design-server 54841` 根目录 + `docs/superpowers/specs/`：

**索引页**：http://127.0.0.1:54841/replica-merchant-index.html （所有商家端 wireframe + spec 入口）

**Wireframe HTML（4 个）**：
| 页 | 文件 | 重点 |
|---|---|---|
| 🏠 首页 | `replica-merchant-home.html` | 暗金 hero + 三宫格运营数字（不 push 收益）+ 快捷管理 5 入口 + 待办 + 同行动态横滑 + 隐入式对账 |
| 📋 运营 (tab 名改) | `replica-merchant-operations.html` | 本月收益头 + SubTabs（派单候选/进行中/今日完成/历史）+ 派单卡左金 border + 候选池脱敏 |
| 🔔 派单详情 | `replica-merchant-bid-detail.html` | 竞价状态条 + 客户需求 + 候选池实况 + 报价表单（带客户预算&对手区间提示）+ 平台仲裁说明 |
| 🛠 服务能力 | `replica-merchant-services.html` | 总览 + bucket chips + 服务卡（thumbnail/价格/销量/评分/tag/上下架切换）+ 服务模板库入口 |

**广场和"我"** 不画独立 wireframe — 直复用客户端 `SquareFeed`/`PostCard*`/`MeHero`/`MeSettingsTab`，token 一换自动暗金。

**Spec 文档（2 份）**：
- `docs/superpowers/specs/2026-05-15-merchant-darkgold-theme-design.md` — 暗金主题 + 复用方案
- `docs/superpowers/specs/2026-05-15-merchant-feature-gap-matrix.md` — 完整功能映射 + 5 个 decisions

### Token 决策
```
--brand-primary: #8a6a25       (深金，镜像客户端暗绿 #0f523c)
--brand-primary-deep: #5e4715  (古铜深)
--brand-accent: #c9a96e        (brass，与客户端同 — 品牌延续)
--brand-accent-deep: #a07a32
--ink-900: #2a1f0a             (深棕墨)
--gray-50: #faf6e9             (米黄暖底)
```

### 5 tab 决策（广场居中凸起）
```
🏠 首页 │ 📋 运营 │ ✨ 广场(中凸金块) │ 🛠 服务 │ 👤 我
```
"订单"tab 文字改成"运营"，覆盖派单候选 + 进行中 + 数据视角。

### 5 个 Open Questions 已敲定（Decisions Confirmed）
1. **订单状态机 5 段**：接单 → 出发 → 抵达 → 服务中 → 完成 → 待客户确认
2. **发帖单一模式**：日常/招聘/新品/作品都靠 tag 区分，FAB 永远跳同一个 `/square/new`
3. **运营数据合并到订单 tab + 文字改运营**：顶部数据头 + 中部分组列表
4. **服务范围本期行政区多选**（圆心+半径留 V2）
5. **派单 = 竞价 + 仲裁模型**：N 家报价 → 平台/AI 综合 5 维度（价/距/评/信/历史完成率）选 1 家 → 中标进 5 段状态机，其他候选关闭。**不做先到先得，不做倒计时**。

### 后台主题色管理（本轮 spec，下轮落地）
后端 `/api/settings/public` 已预留 `ui.brand.color_primary / color_accent`（默认客户端值）。第八轮 Dcat admin 加表单 UI + 商户端 layout 注入 `:root` CSS var。

### 不 Push 收益的产品判断（新存的 feedback memory）
`memory/feedback_no_zero_revenue_push.md` — MVP 早期商家无订单时不在 UI 突出 ¥0；用订单数/待办/认证等不易为 0 的成就感指标替代。

---

## 2026-05-15 第六轮：广场互动 API + 商家详情 + e2e + 死代码再清理

### 广场互动 API 全对接
- 新增 `togglePostLike` / `togglePostFavorite` 在 `src/lib/square/client.ts`，配合 `FeaturePendingError`：后端 404/405/501 时翻译成"敬请期待"toast，不报错
- `PostDetailClient` 升级互动栏：
  - 关注按钮：调 `toggleFollowAuthor`（已有 API），成功 toast 切换"已关注/关注"
  - 点赞 / 收藏：**乐观更新**（UI 先变，失败回滚），未实现时显示"功能即将上线"
- 后端已有 endpoint：`POST/DELETE /api/v1/square/authors/{authorId}/follow` + `POST /api/v1/square/posts/{postId}/comments`
- 后端待补 endpoint：`POST/DELETE /api/v1/square/posts/{postId}/likes` + `.../favorites`

### 商家详情页升级（替换 ComingSoon 占位）
- `/merchants/[merchantId]` 用 `/api/merchants/nearby` list+find 兜底获取数据（后端无单商家 GET API）
- 渲染：HERO 卡（头像 + 名称 + 认证/新入驻徽章 + 评分 + 完成单数 + 距离） + 首单立减提示 + 提供服务 chip 列表（点击跳标准服务详情） + 最新动态（点击跳帖子详情） + 信号三宫格（发帖/作品/评价）+ "浏览全部标准服务"CTA
- 未找到时显示 EmptyState；不再卡在 ComingSoon

### @playwright/test 拟人 e2e 测试
- `npm i -D @playwright/test`，新增 `playwright.config.ts` + `tests/e2e/` 5 个 spec 文件
- 移动 viewport 390×844，Pixel 7 设备（不下载 webkit）
- **10/10 测试通过**（4s 跑完）：
  - 首页：hero/底栏/吸顶搜索/未登录跳消息→login
  - 广场：列表+点详情/FAB→新发帖→login
  - /me：未登录跳 login + tab 参数随 next 保留
  - 标准服务：bucket chip + 排序 sheet + 服务卡跳详情
  - 附近：商家卡片跳 /merchants/[id]
- `npm run test:e2e` 跑全套，`npm run test:e2e:ui` UI 模式

### unused exports 再清理（42 → 25）
- 真死代码删除：`humanizeWorkflowRaw` / `normalizeServiceImageUrl` / `refreshPublicSettings` / `readPendingQuoteDrafts` / `readServiceAddressForRequirement` / `pickLinkedMerchantId`
- export → file-internal（仅自己用）：`pickShares` / `pickTripleGradients` / `DEFAULT_TOPICS` / `QUOTE_DRAFT_STORAGE_PREFIX` / `SQUARE_LIMIT_MAX` / `DEFAULT_LIMIT` / `REVIEW_SQUARE_SNIPPET_MAX` / `REVIEW_HEADLINE_MAX` / `STD_SERVICE_NAMES_ZH` / `readAddressResponse` / `normalizeAmount`
- 剩 25 个 unused exports 都是 `orders-*` 系列 picker + `auth/*` 内部 helper，是 data layer / auth module 的"未来 public API"，保留风险更小

## 2026-05-15 第五轮：帮助文档 + typedRoutes 全启用 + 继续清理

### 帮助文档（开发者手册）
重写 `EXPATTH_HELP.md` 为完整 12 段开发者手册：启动 / 端口 / npm scripts / i18n 工作流 / MySQL / 测试账号 / dashboard / 路由清单 / 自定义 Claude Code 命令 / 设计 token / 已接入工具 / FAQ。新增 npm script 都同步这里。`help.md` 的 `/expatth-help` 提示改成"完整开发者手册"。

### Next typedRoutes 全启用
- `next.config.ts` 开 `typedRoutes: true`
- 新增 `src/lib/typed-routes.ts` 暴露 `localeHref()` helper，把 28 处动态 `${locale}` 拼接路径的 cast 集中：
  ```ts
  import { localeHref } from '@/lib/typed-routes';
  <Link href={localeHref(`/${locale}/me/settings`)}>
  ```
- 改动文件：`auth/login` `auth/register` `categories/[slug]` `me/[feature]` `me/page` `me/profile` `me/settings` `square/author/[authorId]` `standard-services/page` + `BottomTabBar` `TopBar` `MeSettingsTab` `OrderCenterBadges` `OrderCenterExpandedContent` `OrderCardV2` `OrderPriorityGroups` `OrderPaySheet` `OrderReviewPageClient` `SecondaryTopBar` `SquareFab` `StandardServiceInlineQuote` `CategoryChips`
- 效果：今后写 `<Link href="/zh/foo">` 但 `/foo` 路由不存在 → TS 编译期报错（typedRoutes 维护的 `.next/types/routes.d.ts` 类型守卫）

### 继续清理 unused exports（52 → 42）
- `home-data.ts` 删 7 个旧首页 const（`CONCEPTS / SERVICE_GROUPS / FALLBACK_IMAGES / ORDER_STEPS / CATEGORY_IMAGE_BY_ID / TRUST_VISUALS / imageForCategory`），文件从 124 行瘦到 21 行
- `oss/client.ts` 删 3 个 storage 函数 + OssPolicy/StorageUploadUrl 接口（上轮回退到 `/api/oss/upload` 后这些就废了）；保留 `uploadToOss` 单一入口
- 剩 42 个 unused exports 都是 `orders-*` `requirement-form` 等 utility 库的 public API，删除风险较高，留下一轮按需评估

## 2026-05-15 第四轮：i18n AI + 服务进度 + 死代码二次清理

### i18n AI 翻译（中英泰，zh.json 作 source of truth）
- 新增 `scripts/i18n-sync.mjs` + `npm run i18n` —— 读 zh.json 叶子字符串，遍历 en.json/th.json 缺失的 key，按 50 条一批用 Claude Haiku API 翻译，写回
- 工作流：**开发者只编辑 `zh.json` 加新文案**，跑 `npm run i18n` AI 自动补 en/th，三个文件随提交。增量翻译（已翻的不重翻；`--force` 强制重翻）
- 当前态：677 leaf strings，en/th 已同步 ✓
- 依赖：环境变量 `ANTHROPIC_API_KEY`（开发机本地 `.env.local` 或 export）。模型：`claude-haiku-4-5-20251001`
- GitHub 同类工具调研：
  - **midday-ai/languine** — CLI 工具，同样思路，更成熟但需要装；本项目用 50 行脚本就够，先不引入
  - **lingo.dev (replexica)** — 商业 SaaS，build-time 翻译；超出本项目规模需求

### 订单详情"服务进度"重做（`P2P3OrderAssuranceBlock`）
- 旧：`<事件名> · <时间> · <备注>` 一行渲染；事件名 fallback 是字面"事件"，看起来 raw
- 新：竖向时间线（左边圆点 + 垂直引导线）
  - 事件名映射顺序：`event.label/title` → i18n `fulfillmentEventType[key]` → `humanizeEventKey(key, locale)` 拆 verb（`merchant_started` → `商家开始`）→ `t('fulfillmentEvent')`
  - 时间改相对：`5 分钟前 / 2 小时前 / 3 天前`（zh/en/th 三语），超过 7 天回退到绝对时间
  - 圆点颜色按事件分类：绿（完成/付款）/ 红（取消/迟到/争议）/ 金（开始/接单）/ 灰（默认）
  - 上限从 5 个事件提到 8 个

### 死代码二次清理（knip 验证）
删除剩余 25 个未用文件（先 grep 跟踪 trampoline 引用链确认无遗漏）：
- root：`BottomTabBar` / `CategoryGlyph` / `LocaleFlagSvg` / `LocaleSwitcher` / `ServiceBookableCalendar` / `ServiceCard` / `TrustGlyph`
- brand：`AmpersandMark`
- icons：`IconfontIcon`
- me：`MeAccountCard` / `MeFeatureGlyph` / `MeFeatureSection` / `MePageClient`
- ui：`avatar` / `badge` / `card` / `separator` / `tabs`（shadcn 拷贝过来但未实际用）
- data：`services.ts`
- hooks：`useOrderPayFeedback`
- lib：`category-icon-map` / `order-center-list` / `order-create-feedback` / `supabase/realtime` / `system-map-link`

累计第三+四轮删除 **35 个文件**。

## 2026-05-15 第三轮：工具接入 + 附近修复

### 接入
- **@formkit/auto-animate**：广场瀑布流 (`SquareFeed`) + 帖子详情评论列表 (`PostDetailClient`) 进入/退出自动动画
- **knip**：新增 `knip.json` + `npm run lint:dead`；首扫 35 个未用文件 / 2 个未用依赖 / 52 个未用导出
- **typedRoutes**：尝试启用 → 发现 19 处 `/${locale}/...` 动态拼接需要 `as Route` cast → 暂时关闭，作为独立任务（避免本轮"改乱"）

### 死代码清理（knip 验证）
删除以下 10 个旧首页废弃组件（替代者是 HomeShell + HomeHero + ServiceCardV2 体系）：
- `AppHome.tsx` / `BannerSlide.tsx` / `HeroBannerCarousel.tsx` / `HomePageClient.tsx` / `HomeQSections.tsx` / `HomeSearch.tsx` / `HomeSections.tsx` / `HomeUiIcons.tsx` / `StaggeredGrid.tsx` / `ImageWithFallback.tsx`

### Bug 修复
- **附近商家卡片点击无反应**：MerchantNearbyCard 接收 onClick 但 NearbyFeed 未传入；新建 `/merchants/[merchantId]` 占位详情页 + NearbyFeed 传 onClick router.push
- **评论发送看不到反馈**：catch isAuthGateRedirectError；error 改成 toast 浮在底栏上方 2.4s
- **发帖不支持图片**：1-9 张图选择 + 本地 object URL 预览 + 并发 uploadToOss + 上传/错误状态遮罩 + 删除
- **i18n MISSING_MESSAGE Square**：page.tsx 不再调 `getTranslations('Square')`，改本地 I18N 表
- **/api/auth/refresh 死调用导致重复登录**：refreshSession 容错 404/405/501 不清 session

### 新增 npm scripts
```
npm run lint:dead   # knip 扫死代码
npm run typecheck   # tsc --noEmit
```

## 待办（下一轮）
- **启用 typedRoutes**：批量给 `/${locale}/...` 动态 href 加 `as Route` cast；19 处分布在 auth/login auth/register categories/[slug] me/[feature] me/page me/profile me/settings square/author/[authorId] standard-services BottomTabBar TopBar CategoryChips LocaleSwitcher MeFeatureSection
- **清理剩余 25 个 knip 未用文件**：跑 `npm run lint:dead` 看清单，每删一个先 grep 确认外部引用为空
- **清理 2 个未用依赖**：`shadcn` `tw-animate-css`（package.json 移除后 npm i 重生 lock）
- 全前端 i18n 化：Square 详情 / SortSheet / 发帖页 / SettingsRow 文案仍为 zh 硬编码，需要 messages/{zh,en,th}.json 同步补
- 头像上传 e2e 验证（需 OSS 后端 policy 接口可用）
- 评论 / 点赞 / 收藏 / 关注 后端 API 对接（PostDetailClient 已留 UI 入口）
- 帖子详情 GET 接口（目前用 list+find 兜底，500 帖以后会慢）
- `/api/auth/refresh` 路由：目前 client 已经做了 404 容错（不踢用户），但应该真正实现这个 endpoint 代理到后端

## 推荐引入工具（GitHub 调研，未接入，待用户决定）

按价值 / 接入成本排序，每个都是开源稳定项目：

### 1. `@formkit/auto-animate` — 列表动画零代码（推荐 ★★★★★）
- **github**: formkit/auto-animate (Vue/React/Svelte, ~3kB)
- **场景**：广场瀑布流 / 评论列表 / 订单列表 进入-退出 自动平滑动画
- **接入成本**：1 行 `useAutoAnimate()` hook 包到容器 ref，不改任何子节点代码
- **价值**：用户体验质感大幅提升，且改不乱

### 2. `Next.js typed routes` — 路由编译期检查（推荐 ★★★★★）
- **github**: vercel/next.js (内置 `experimental.typedRoutes`)
- **场景**：之前 `/me/addresses` `/me/reviews` 死链 = 没编译期检查；启用后 Link/router.push 不存在路由就编译失败
- **接入成本**：`next.config.js` 加 `experimental: { typedRoutes: true }`；可能需要修几处 `as Route` 标注
- **价值**：杜绝"改链路改乱"

### 3. `knip` — 找死代码 / 未用依赖（推荐 ★★★★）
- **github**: webpro-nl/knip
- **场景**：阻止 "改来改去越改越乱" — 每次 PR 跑 knip 看是否多了 unused export / dependency
- **接入成本**：`npm i -D knip` + 一份 knip.json 配置；CI 跑 `npx knip`
- **价值**：codebase 卫生 + 找出可删的旧代码

### 4. `@playwright/test` — 拟人测试（推荐 ★★★★）
- **github**: microsoft/playwright (已经在用 playwright-core 截图，升级到 @playwright/test)
- **场景**：写 5-10 个 happy-path 场景 — 首页→点消息→登录→跳回 / 广场点帖子→详情→评论 / 发帖→选图→提交
- **接入成本**：`npm i -D @playwright/test`，写 tests/e2e/*.spec.ts；CI 跑 `npx playwright test`
- **价值**：用户报的 bug（"点消息没登录跳错"、"评论发送没反应"）一类问题，写 1 个测试就永久回归保护

### 5. `biome` — Lint + Format 速度 25x（推荐 ★★★）
- **github**: biomejs/biome (Rust 写的 ESLint+Prettier 替代)
- **场景**：本项目用 eslint，每次 `npm run lint` 慢；biome 0.5s 完成全项目
- **接入成本**：可以渐进替换（先并存）；`biome.json` 配置文件 + 改 package.json scripts
- **价值**：速度 + 内置规则更严格（类似 typescript-eslint 默认开）

### 不建议引入
- **Storybook**：移动端项目组件粒度不大，单独维护 stories 成本高于收益
- **Tanstack Query / SWR**：本项目用 useEffect+fetch 模式简单，引入会大改数据层
- **Zustand 全局 store**：已经有 useCityStore / useAuthToken，扩展即可，不需要新框架
