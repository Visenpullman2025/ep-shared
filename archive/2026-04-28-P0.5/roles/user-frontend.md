# User Frontend Role

最后更新：2026-04-28（P0.5 合同与页面迁移设计）

> 角色：**expath-frontend** 用户端（Web）。  
> 共享词表与七词：见 `docs/glossary.md`；平台 API 边界：见 `docs/boundaries.md`。  
> 用户端 API 合同：见 `../api/user-api.md`；**唯一需求池**：`../api/requests.md`；现网接口清单：见 `docs/api-user-list.md`。

## 职责边界

用户端（User Frontend）**只**负责下列能力与展示，不承载商家运营后台、不实现匹配引擎、不自行定义业务主态：

- 展示 **StandardService**（以 **`standardServiceCode`** 为入口，不以 **`serviceId`** 为新主入口）。
- 拉取并渲染 **RequirementTemplate**，收集并提交 **RequirementPayload**。
- 调用粗报价接口并展示 **QuotePreview**（与 **MerchantQuoteConfirmation** 的终局价区分）。
- 创建订单（新主流程字段：`standardServiceCode`、`requirementPayload`、`quotePreviewId`、`appointmentPreference`、`serviceAddress`）。
- 在订单维度**等待并展示**与 **MerchantCandidate** / **MerchantQuoteConfirmation** 相关的状态与信息（**不**由用户选择商家/师傅；指派与匹配在平台与商家端）。
- 在 **MerchantQuoteConfirmation** 就绪后，引导用户**确认最终报价和服务时间**（`confirm-merchant-quote`）。
- **支付**与**预授权**（`payments/intent`，见 `api/user-api.md` §6 与 `api/requests.md` 支付相关条）。
- **订单中心**、**售后**、**评价** 等用户侧闭环页。

## P0.5 只读审查：expath 迁移影响面

基于对 **`/home/visen/projects/expath`** 的只读扫描（**未**改业务代码），影响面如下。

| 域 | 现状与迁移影响 |
|----|------------------|
| **首页 / 分类 / 服务列表** | `src/app/[locale]/page.tsx` 使用 `GET /api/services?…` 拉取列表；`src/app/[locale]/categories/[slug]/page.tsx` 用 ` /api/services?category= `；链接为 ` /[locale]/services/{id} `。→ **改为**以 **StandardService** 与 **`standardServiceCode`** 为入口、对接 **`GET /api/v1/standard-services`**（经未来 BFF，见 **R-20260428-018**）。 |
| **服务「详情」页** | `src/app/[locale]/services/[id]/page.tsx` 以 **`id`=旧 serviceId** 调 ` /api/services/{id}`、`/summary`；去下单为 `?serviceId=`。→ 迁移为 **StandardService 详情**（`standardServiceCode` 路由/参数），**不再**以单商家行 id 为主键心智。 |
| **RequirementTemplate 与表单** | 现嵌在 `orders/new`：与 `create-data` 同机获取。→ P1 拆/合为**独立页面或步骤**，与 **`requirement-template`** 合同一致。 |
| **QuotePreview（粗报价）** | `src/app/[locale]/orders/new/page.tsx` 调 BFF `POST /api/services/{serviceId}/price-preview`，body 为 `processData` 等。→ 迁到 **`POST …/standard-services/{code}/quote-preview`** 与 **`quotePreviewId`**。 |
| **bookable-days** | `src/components/ServiceBookableCalendar.tsx` 调 `GET /api/services/{id}/bookable-days`。→ 与 **MerchantCapability** / 候选/确认阶段能力对齐，**不**在 P1a 强依赖同路径；以 **api/requests**、**R-20260428-016/017** 为据。 |
| **创建订单** | 同上页 `POST /api/orders`，带 **`serviceId`**、`processData`、`quotedAmount` 等。→ **P1b** 改 **`standardServiceCode`、requirementPayload、quotePreviewId、…**；与 **R-20260428-008/009** 一致。 |
| **订单列表** | `src/app/[locale]/orders/page.tsx` 使用 **`GET /api/orders`**；`OrderCenterCard`、`useOrderCenterActions` 等。UI **可复用**；需展示 **`matchingStatus` / `nextAction` / MQC 引用** 时依赖 **R-20260428-012/010/017** 落地字段。 |
| **订单「详情」** | **无** 独立 ` /orders/[orderNo]/page.tsx`；详情能力分散在**列表卡片**与 **`OrderPaySheet`** 拉 `GET /api/orders/{orderNo}`。→ P1c 可评估**独立详情页**是否承载 **匹配中 / 待确认**（见下方清单）。 |
| **支付弹层** | `src/components/OrderPaySheet.tsx` 拉单条订单 + `POST /api/payments/intent`。**可复用**；预授权参数待 **R-003** 与 **`api/user-api` §6** 联调扩展。 |
| **评价** | `src/app/[locale]/orders/[orderNo]/review/page.tsx` + `src/lib/reviews/*`、`POST /api/reviews`、`GET …/my-review`。**可复用**为主，与新 workflow 无冲突。 |
| **售后** | 代码中**未发现** `after-sales` 调用或用户入口页面。→ P1d 新入口依赖 **`POST /api/v1/orders/{orderNo}/after-sales`**（**R-20260428-011**）。 |
| **BFF 层** | `src/app/api/services/**`、`src/app/api/orders/route.ts` 等；**无** `standard-services` 路由。→ **R-20260428-018** |

## 当前进度

- **P0**：已冻 **user-api** 与角色边界。  
- **P0.5**（本批次）：**不改 Next.js 业务码**，完成只读影响面、**P1 页面清单**、复用/重写、**P1a–P1d** 顺序、需求池 **R-018/R-019**；仍依赖后端与 **api/requests.md** 的 accepted 项实际上线后再联调。

## 已完成事项

可在新主流程中**复用**的现有能力（实现位于 **expath**，不穷举行号）：

- 用户认证（注册/登录/me）与 me 域（资料、地址、地图、上传）。
- **订单中心** 列表/卡片、`OrderCenterCard`、隐藏/取消/确认完成 等 **hooks**。
- **OrderPaySheet** 支付意图与金额以后端单为准。
- 评价提交流程、`my-review` 映射、评价页大表单。
- 多语言、**Thai × Apple Glass** 组件与 `globals` 体系统一。

## P1 页面迁移清单（按页面分组）

| 分组 | P1 目标 | 与现网关系 |
|------|----------|------------|
| **首页 / 分类入口** | 展示 **StandardService** 目录；链接指向标准服务**码**与后续步骤。 | 换数据源与 `href`；**R-20260428-019** |
| **StandardService 详情页** | 以 **`standardServiceCode`** 为动态段；只读展示标准说明与进入需求的 CTA。 | 由 `services/[id]` 迁移/重定向 |
| **RequirementTemplate 表单页** | 从 **`requirement-template`** 渲染；产出 **RequirementPayload**。 | 可自 `orders/new` 内联逻辑抽出 |
| **QuotePreview 展示页** | 展示粗报 **`estimatedAmount` / `pricingBreakdown` / `warnings` / `expiresAt`**。 | 替代旧 price-preview 结果区 |
| **创建订单页** | `POST` 体含 **`quotePreviewId`、`appointmentPreference`、`serviceAddress`** 等。 | 深度改 `orders/new` |
| **匹配中 / 等待商家确认页** | 展示 **MerchantCandidate** 进度、**`matchingStatus`**、等商家 **MQC**（**只读**、无选人）。 | 新或订单详情区块；**R-007/010/012** |
| **用户确认 MerchantQuoteConfirmation 页** | 调用 **`confirm-merchant-quote`**，传 **`merchantQuoteConfirmationId`**。 | 新 |
| **支付 / 预授权** | 沿用 **`OrderPaySheet` + `payments/intent`**，扩展 pre-auth。 | 换请求体与 gating 即可 |
| **订单中心** | 列表/卡片对齐 **`workflowStatus`**、**`nextAction`**、是否待支付/待确认。 | 以 **R-010/012** 为准增强展示 |
| **售后 / 评价** | 评价维持；**新增**售后入口与表单 → **`after-sales`**。 | 评价可复用；售后新建 |

## 复用与重写（判定）

| 策略 | 范围 |
|------|------|
| **优先复用** | **UI 壳**、布局、**Thai × Apple Glass** 类名、**地址**与地图、**ServiceBookableCalendar 的纯 UI/动画**（数据源换）、**OrderCenterCard/OrderPaySheet**、**评价页** 主结构、**next-intl**。 |
| **须重写/替换数据与主路径** | 所有以 **`serviceId`** 为**新主下单入口**的**逻辑**（`orders/new` 的 query、fetch 链、POST body 核心字段、首页/类目的链接与列表类型 `Service` 若与标准服务分裂）。 |
| **须新建** | **标准服务** BFF 与页面路由（若与旧**并存**则按 **R-018/019**）、**用户确认 MQC** 的专用一步、**匹配中/等商家** 的展示步（不新增**选人** UI）。 |
| **不得新增/强化** | 用户**选择商家**、用户**选择师傅** 的主流程能力。 |

## P1 实施顺序

- **P1a**：只接**新只读** **StandardService** 列表/详情、**RequirementTemplate**、**QuotePreview** 生成与展示；**不**改 `POST /orders` 主路径、不改订单状态机消费（可仅预览环境或 feature flag）。  
- **P1b**：**订单创建** 改为 **`standardServiceCode` + `requirementPayload` + `quotePreviewId` + `appointmentPreference` + `serviceAddress`**；下线路径仅保留 **compatibility**；与 **R-20260428-008/009** 联调。  
- **P1c**：**订单状态** 与 **MerchantQuoteConfirmation** 的只读/确认 UI；**`confirm-merchant-quote`**；列表/详情（或新详情区）消费 **`matchingStatus` / `nextAction`**。  
- **P1d**：**支付/预授权** 闭环、**售后** 入口与 **`after-sales`**、**评价** 与完结路径收尾；字段以 **R-003/R-011** 与 **user-api** 为准。

## 待处理事项

上表 **P1 页面迁移清单** + **P1a–P1d** 为执行细化；**依赖** 见 **`api/requests.md`** 已登记 **R-005 至 R-019** 与实现状态。旧 **`docs/api-user-request.md`** 仅作备查。

## 禁止事项

- **不得**以 **`serviceId`（或等价的旧商家服务行 id）作为新主流程的下单/进入入口**；兼容期仅可调用旧 API，**不**在 CTA/文档中作为长期主叙事。  
- **不得**在界面或路由上**让用户选择商家**为必经步骤。  
- **不得**在界面或路由上**让用户选择师傅/技师**为必经步骤。  
- **不得**在客户端**自定义或分叉订单主状态机**；展示与可点动作**必须**以 **`api/user-api.md`** 与 **`api/requests.md`（R-20260428-010 等）** 及后端**当前**返回为准。  
- **不得**绕过 **`api/requests.md`** 与已发布合同，**在前后端**私自发明**业务字段、状态字符串或新 HTTP 资源**。  
- **不得**在业务表述中使用禁用词指代服务与订单标的（见 `docs/glossary.md`）。  
- **不得**在本文档或实现中，用 `product` / `goods` / `item`（货品义）/ `listing` / `shop_service` / `service product` 描述主业务对象。

## 依赖后端事项

以 **`api/user-api.md`** 与 **`api/requests.md`**（含 **R-005–R-012、R-016、R-017** 等）为单一真源；实现未 **`implemented` 前不当作联调完成**。重点：`standard-services*`、quote-preview、新 `POST` orders 体、`confirm-merchant-quote`、orders `GET` 扩展块、`after-sales`、`payments/intent` 的预授权扩展。

## 依赖商家端事项

需商家端完成 **MerchantQuoteConfirmation** 的提交/推进后，用户端才能做「**确认** → 支付/预授权」；具体 **gating** 与 **workflow** 以订单详情字段与 **R-20260428-014/015** 类条目为准。用户端**不**要求用户先选商家。

## 最近一次同步结论

- **P0.5 期间**：在 **expath** **未**改页面/BFF/组件/hook 实现；仅 **expatth-shared** 更新 **user-api / user-frontend / requests**。  
- 实施改码以 **P1a→P1d** 为序；**本地开发 rules**（`.cursorrules` 等）应引用 **`api/requests.md` 为唯一需求池** 与 **user-api 为合同**，避免与 **Backend/ Merchant** 并行的口头字段。

**只读已核对（代表路径，非行级 exhaustive）**：

- `src/app/[locale]/page.tsx`、`src/app/[locale]/categories/[slug]/page.tsx`  
- `src/app/[locale]/services/[id]/page.tsx`  
- `src/app/[locale]/orders/new/page.tsx`  
- `src/app/[locale]/orders/page.tsx`  
- `src/app/[locale]/orders/[orderNo]/review/page.tsx`（及 `me/…/redirect` 兼容页）  
- `src/components/OrderCenterCard.tsx`、`OrderPaySheet.tsx`、`ServiceBookableCalendar.tsx`  
- `src/hooks/useOrderCenterActions.ts`  
- `src/lib/orders*.ts`、`src/lib/reviews/*`  
- `src/app/api/services/**`、`src/app/api/orders/**`、`src/app/api/payments/intent/**`、`src/app/api/reviews/**`  
- `src/data/services.ts`  

**本批次已改 shared 文件**：

- `api/user-api.md`：与 **`api/requests.md`** 交叉引用、**`appointmentPreference` / `matchingStatus` / `nextAction` / `pre_authorization` / after-sales 请求体** 的「不冻结未确认细纲」说明。  
- `roles/user-frontend.md`：P0.5 影响面、P1 页面清单、复用/重写、**P1a–P1d**、更新禁止项、**只读文件列表**与结论。  
- `api/requests.md`：新增 **R-20260428-018**（expath BFF 对齐）、**R-20260428-019**（路由与 query 迁移）、维护节下一编号自 **020** 起；**P0.5 表** 更新至 019 行。  

**新增需求条目**：

- **R-20260428-018** 用户端（expath）BFF 与 user-api 新路径对齐。  
- **R-20260428-019** 用户端路由与 query 从 `serviceId` 迁移为 `standardServiceCode`。  

**未**删除或覆盖 **requests** 中既有 **Backend** 条目。
