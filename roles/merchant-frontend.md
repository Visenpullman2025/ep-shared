# Merchant Frontend Role

## 职责边界

商家端（`expath-merchant` / Merchant Frontend）**只**负责下列能力，与平台主链路一致（`docs/boundaries.md`、`docs/glossary.md`）：

- **商家认证和资料**（注册、登录、资料、认证材料）
- **MerchantCapability** 的配置与维护（平台标准服务维度的可承接能力；**不**以「服务商品」为长期核心叙事）
- **接收** 系统派发的 **MerchantCandidate**（待确认请求池）
- **提交 MerchantQuoteConfirmation**（终局报价与服务时间等）
- **履约状态推进**（在已进入履约的订单上：开始服务、完成、取消等，**遵循**平台状态机，不自造状态）
- **钱包**与**提现**
- **查看** 信用与售后相关状态（在合同提供接口的前提下）

**核心主流程**（概念固定名）：`StandardService` → `RequirementPayload` / `QuotePreview` → `MerchantCandidate` → `MerchantQuoteConfirmation` → 用户确认 → 支付/预授权 → 履约 → 售后/评价/信用。

**现网「服务中心」** 对应**旧**商家**服务配置**（`GET/POST /api/merchant/services*` 等，**compatibility**）；**新** UI 名称应为 **「能力配置中心」**（`MerchantCapability` 对象，非**上架商品**线）。

---

## P0.5 只读审查：epmerchant 迁移影响面（事实参照，不改码）

在**不修改** `epmerchant` 业务代码的前提下，对当前仓库只读检查结论如下。路径均为相对 `src/` 的要点。

| 域 | 涉及文件 / 入口 | 当前行为与迁移影响 |
|----|-----------------|-------------------|
| **Root / 布局** | `app/[locale]/merchant/page.tsx` | 重定向到 `.../dashboard`。 |
| **商家 dashboard** | `app/[locale]/merchant/dashboard/page.tsx` | SSR 拉 `GET /api/v1/merchant/orders`（经 BFF `buildBackendUrl`）算 KPI；**嵌入** `MerchantAvailabilityCalendar`；**无** `order-requests` / `capabilities` / `credit-profile`。P1e 需拆 KPI：候选待办 vs 履约。 |
| **底栏导航** | `components/merchant/MerchantBottomNav.tsx` | `dashboard`、`orders`、`services`（即旧服务中心入口）、`square`、`profile`。**无** 独立「待确认池」「能力配置」；P1 或改为「能力/候选」等 IA。 |
| **旧服务中心** | `app/[locale]/merchant/services/page.tsx` | `GET` profile + `GET` `/api/merchant/services` 列表。→ **P1b** 并存 **MerchantCapability** 页；`services` **仅 compatibility**。 |
| **服务编辑/新建** | `app/[locale]/merchant/services/[serviceId]/page.tsx` + `services-store.ts` / `payload.ts` / `normalize.ts` / `draft.ts` | `GET` categories、process-templates、`GET/PUT/POST` `services*`，依赖 **`serviceId`** 与**上架/类目/模板**叙事。→ **必须重写**主数据流；**可复用**子块见下文「旧服务中心迁移策略」。 |
| **服务类型** | `components/merchant/MerchantServiceTypesPicker.tsx` | 与 `profile` `serviceTypes`、类目类绑定。→ 向 **StandardService** / 能力侧迁移时**替换数据来源**，禁止强化「选商品式类目」。 |
| **开放日** | `components/merchant/MerchantAvailabilityCalendar.tsx` | `GET/PUT` `/api/merchant/availability`；`openDates`、可选 `fullyBookedDates` / `slot` 回退。→ P1 需与 **R-016** 容量/时段 对齐。 |
| **资料 / 服务类型** | `app/.../profile/info/page.tsx` | `GET` profile、categories + `POST` profile。→ 保留在 **P1a**；`categories` 长期 **compatibility** 直至能力侧全量接走。 |
| **资料 / 认证** | `profile/verification/page.tsx`、`merchant-profile-normalizer.ts`、`verification-status.ts` | `GET` profile + `POST` **verification**；Oss 上传。→ P1a **可保留**路径与交互。 |
| **资料 / 总览/设置/状态** | `profile/page.tsx`、`settings/page.tsx`、`status/page.tsx` | 钱包摘要、locale、登出。→ 与 P1a 兼容。 |
| **订单（合并列表页）** | `app/.../merchant/orders/page.tsx` | `GET` orders 多 tab + `POST` `.../confirm`（确认时间/备注）、`start-service`、`finish-service`、`cancel`；**无** 独立 `order-requests` 或 `quote-confirmation`。**P1d/P1e** 必须拆**确认报价/候选**与**履约**两条线。 |
| **钱包** | `app/.../wallet/page.tsx` | `GET` wallet、records + `POST` withdraw。→ P1a 保留。 |
| **BFF 代理** | `app/api/merchant/[[...path]]/route.ts`、`lib/api/merchant-path-proxy.ts` | `/api/merchant/...` → `/api/v1/merchant/...`；`services/:id/create-data` 特判走公共 `services`。**P1** 为 `capabilities`、`order-requests` 等加路由**不改变**对后端**合同**的单一事实源（`api/merchant-api.md`）。P0.5 **禁止**改。 |
| **显式 BFF 路由** | `api/merchant/auth/*`、`profile`、`uploads/oss`、`review/notify`、`preferences/locale` | 非 catch-all 包装。P0.5 不改。 |
| **类型与契约** | `lib/api/merchant-api.ts` | 聚合现网联调类型；**无** `MerchantCapability` / `order-requests` 类型。→ P1b+ 在实现后**对齐** shared 与 registry，**禁止**先拍脑袋加字段。 |
| **社区 square** | `app/.../square/**` | 与商家主业务迁移**弱相关**；联调不列入本 P1 主路径。 |

---

## 旧「服务中心」迁移策略（P1 起）

- **不是长期主线**：以 **StandardService** + **MerchantCapability** + **MerchantCandidate** + **MerchantQuoteConfirmation** 为主；旧「服务中心」仅覆盖 **旧商家服务配置**（`yipai_services` 语义、**非** 用户侧标准品）。
- **接口**：`GET/POST/PUT` `/api/v1/merchant/services*` 及依赖的 **`/api/v1/merchant/categories`**、**`/api/v1/merchant/process-templates/{code}`** 状态均为 **compatibility**；不删除即「兼容窗口」；**新 UI** 入口命名固定为 **「能力配置中心」**（不强调上架、商品、货架）。
- **可复用（UI/体验层）**：
  - 表单与动态字段经验（`services-store` / 模板价注入等）可迁移为 **能力编辑** 的子模块；
  - 价格/计价规则**展示**与**分段编辑**的交互（`priceItems`、`pricingSchema` 等）在对接 **`basePricingRule` / 后端规则 JSON** 时**复用思路**，字段名**以后端+requests** 为准；
  - **MerchantAvailabilityCalendar** 的日历交互与**曼谷时区**习惯；
  - 错误提示、审核态 badge（如 `reviewState`）的**信息架构**可映射到 `MerchantCapability.reviewState`。
- **必须重写（业务主线）**：
  - 以 **`serviceId`** 为主键的 CRUD 与 **「创建上架服务」** 心流 → 改为 **`capabilityId`** + **`standardServiceCode`** 绑定、能力启用与规则；
  - 依赖 **类目+模板+商家服务** 的 **商品化** 上架路径 → 改为**平台标准服务** + **能力行** 的配置路径；
  - 与**用户**侧 **选商家某一行服务再下单** 的叙事耦合 → 断开；仅保留**兼容**入口直至下线条件满足（`docs/fulfillment-flow.md`、R-005/009）。

---

## P1 页面迁移清单（按页分组）

以下为 **P1** 目标态（与 `api/merchant-api.md` 合同分组一一对应）；**实现顺序**见下节 **P1a–P1f**。

| 页面域 | 目标与主要 API 合同 |
|--------|---------------------|
| **商家资料 / 认证** | 保留并收敛：`/auth/*`、`/profile`、`/verification`、OSS 上传；`categories` 在资料里仅 **compatibility** 使用直至能力全量。 |
| **能力配置中心 MerchantCapability** | 新列表/创建/编辑：`/merchant/capabilities*`，字段以合同第 2 组 + **R-013** 为准。 |
| **开放日 / 容量 / timeSlots** | 沿用 `availability` 编辑；演进 **R-016** 后再扩展 UI（`openDates` 当前与日历组件对齐）。 |
| **待确认请求池 MerchantCandidate** | 新页：`GET /order-requests`（+ 可选 `GET` 单条 **R-020**）列表与进入详情/报价。 |
| **提交 MerchantQuoteConfirmation** | 新流：`POST` `.../order-requests/{candidateId}/quote-confirmation`（**R-014**）。 |
| **履约订单列表** | `GET /orders` 聚焦**已支付/可开始服务/服务中/完结/取消**；**不再** 与「待回价」混一列表（**P1e**）。 |
| **订单详情 / 开始服务 / 完成 / 取消** | 在合并列表的延续或独立 details：`start-service` / `finish-service` / `cancel`；**旧** `POST .../confirm` 的并存与下线必须由后端补 R- 条目后再改。 |
| **钱包** | 保留 `wallet` / `records` / `withdraw`（P1a）。 |
| **信用档案** | 新只读页：`GET /credit-profile`（**R-015**）。 |

**说明**：`square` 底部入口与社区；**不** 作为**匹配/报价**主路径的一部分。

---

## 商家端 P1 实施顺序

| 阶段 | 内容 | 目的 |
|------|------|------|
| **P1a** | 保留并回归验证 **profile / verification / wallet** 与**旧** `GET /merchant/orders` 只读能力；不删**旧** `services*` 功能 | 先不破坏现网、可灰度。 |
| **P1b** | 新增 **MerchantCapability** 能力配置中心页面与 BFF/类型；**旧** `merchant/services*` 仍**兼容**并存 | 主线入口切换为能力，不一夜切断。 |
| **P1c** | 新增 **MerchantCandidate** 待确认请求池（列表 + 可选单条 R-020） | 与履约订单**分离展示**。 |
| **P1d** | 新增 **MerchantQuoteConfirmation** 提交流程（自候选进入） | 终局价与时间**合同化**。 |
| **P1e** | **订单列表** 从「确认报价/时间」与「履约中/已完成」**两条线**拆清；必要时迁移 `confirm` 的调用点至新流，先补充对应 R- 条目 | 与 `state-machine`、用户端确认对齐。 |
| **P1f** | **信用档案** 与**售后/评价**等**只读**态（在 **R-015、R-011、R-004** 可落地的前提下） | 不自制信用字段。 |

---

## 当前进度

基于**当前** `epmerchant` 代码（P0.5 文档，**不**在 shared 外改码）：

- **商家登录/注册**已有；BFF 到 `/api/v1/merchant/auth/*`。
- **商家资料/认证**已有。
- **商家订单页**已有 `confirm` / `start-service` / `finish-service` / `cancel`；**未** 切 `order-requests` / `quote-confirmation`。
- **旧服务中心**仍为 **services/categories/process-templates** 主路径；**无** 能力中心。
- **开放日** 仅有 `openDates` 级；**无** 完整 **capacity / time slots** 模型（**R-016**）。
- **无** 信用 / `credit-profile` 页。

---

## 已完成事项

**可复用**（实现与 UI 能力，非新「商品化」方向背书）：

- 商家认证、资料、认证上传、Oss
- 订单页 UI 与**旧**多动作联调
- 开放日组件 + `availability`
- 钱包三接口
- **旧** 服务编辑中的表单与模板价等**局部**可迁移到**能力**编辑

---

## 待处理事项

- 见上 **P1 页面迁移清单** 与 **P1a–P1f**；旧服务入口下线条件需与 **Backend、用户端** 同步（R-005、R-009 等）。

---

## 禁止事项

**必须遵守**（P0.5+）：

- **不得** 继续强化 **「服务商品」「上架商品」**、货架式「服务中心」为**长期**主叙事；用户心智以 **StandardService** + 匹配/确认为准。
- **不得** 把 **`/api/v1/merchant/services*`** 当作**长期**主线；仅 **compatibility**；新表單/入口以 **能力配置中心** 为准（见上「旧服务中心迁移策略」）。
- **不得** 允许**用户**在商家端选择**商家内部师傅/人员**；派单/指派不在商家端**自定义**。
- **不得** **自定义** 订单、**MerchantCandidate**、**MerchantQuoteConfirmation** 的**业务**状态机枚举；以 `docs/state-machine.md` 与后端/ **R-010、R-014** 为准。
- **不得** 在业务文案中使用禁用词作**货品义**：`product`、`goods`、`item`、`listing`、`shop_service`、`service product`（`docs/glossary.md`）。
- **不得** 绕过 **`api/requests.md`** 在**前端/局部文档** 发明**对外** API 字段或**并行**新接口；有缺口**先追加 R- 条目** 再联调（见 `api/README.md`）。

---

## 依赖后端事项

- 与 **`api/merchant-api.md` + `api/requests.md`** 中 R-013、R-014、R-015、R-016、R-020 等一致；**以 registry 实装为准**。

---

## 依赖用户端事项

- 用户端对 **MerchantQuoteConfirmation** 的确认与支付/预授权，决定商家**履约**列表是否**应** 出现可开始单；**不得** 在商家端**代替**该确认。

---

## 最近一次同步结论

**P0.5**（本文档更新于 2026-04-28）：**不修改** `epmerchant` 业务代码。完成 **商家端只读** 迁移影响面结论、**P1 页面迁移清单**、**旧服务中心**迁移策略、**P1a–P1f** 顺序、合同与 **requests** 交叉；当前已修正编号：用户端占用 **R-018/R-019**，商家端单条候选详情使用 **R-020**，信用档案沿用 **R-015**。合同仍以 **`api/merchant-api.md`** 为基，**未确认字段** 留在 **`api/requests.md`**。团队/AI 规则以 **expatth-shared** 的 `docs/boundaries.md`、**`api/requests.md`** 与 **本角色** 为准，**不在** 商家仓库单点发明契约。
