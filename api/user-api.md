# 用户端 API 合同（User API Contract）

最后更新：2026-05-05（P2/P3 目标合同补充）

> 本文档只描述**用户端开放 HTTP API 的合同形态**（路径、方向、核心字段、兼容策略）。**需求池与缺口**见 **`api/requests.md`（唯一）**；**不得**在本文档承担需求池职责。历史 `docs/api-user-request.md` 不维护。  
> 业务词表与七词定义见 `docs/glossary.md`；平台边界见 `docs/boundaries.md`。  
> 目标订单主态见 `docs/state-machine.md`；履约顺序见 `docs/fulfillment-flow.md`；**错误语义**见 `api/error-codes.md`。

## 0.2 P2/P3 合同补充

- 用户仍从 **StandardService** 进入，不从商家行或旧 `serviceId` 进入。
- 创建订单后，商家候选由后端按 **MerchantCapability**、星级、服务质量、响应速度、距离、价格、档期与就绪状态生成；用户端只展示推荐摘要，不计算排序。
- 用户确认 **MerchantQuoteConfirmation** 后，支付/预授权进入平台代管；平台服务费默认按服务小计收取 1%，税费默认按服务小计收取 7%，订单 `pricing` 返回服务小计、平台服务费、税费和应付合计。
- 用户确认服务完成后，订单进入结算链路；用户可评价商家，并可选择将脱敏评价摘要同步到广场。
- 具体缺口以 `api/requests.md` R-020 至 R-025 为准；未在 `api/registry.md` 标记 implemented 前，前端不得伪装完成。

## 0.1 P1 实现状态与联调（必读）

- **可联调、且**路由已在**现网**后端注册的项：以 **`api/registry.md`** 中标记为 **`implemented`** 或**明确**列出的 **compatibility** 为准。  
- **P1a 已**在 **`/api/v1/standard-services*`** 落**列表、详情、**`requirement-template`**、**`POST …/quote-preview`**（`yipai_quote_previews` 落库；计价接 `YipaiServiceProcessTemplate` 与 `ServiceProcessPricingService`）**；部署后**须执行 `php artisan migrate` 与 `php artisan db:seed --class=StandardServiceP1aSeeder`（**或** 等价数据迁移）以**有**标准行与 `formSchema`。  
- **P1b 已**让 **`POST /api/v1/orders` 的 §4 新 body 主路径**可联调：请求可用 `standardServiceCode + quotePreviewId + requirementPayload + serviceAddress`，响应包含目标 `workflowStatus`、迁移期 `legacyWorkflowStatus` 与 `nextAction`。
- **P1 已**让 **`POST /api/v1/orders/{orderNo}/confirm-merchant-quote`** 与 **`POST /api/v1/orders/{orderNo}/after-sales`** 可联调；MerchantCandidate / MerchantQuoteConfirmation 的商家侧处理链路见 **`merchant-api.md`** 与 **`registry.md`**。
- **老**的 **`GET/POST /orders*`**、**`POST /payments/intent`** 与 **`POST /orders` 的 §10 旧**入参**可** 继续联调；旧 `serviceId` 路线只作 compatibility，不作为新用户主入口。
- 已注册辅助清单（**未**含全部路由）：`GET/GET/GET/POST` 见 **`api/registry`「StandardService / P1a」** 分条。  
- **`nextAction`**：仅 **UI 引导**（`state-machine` **§6**），**不**是独立**主**状态，**不**能替代 **`workflowStatus`** 做**支付/权限**判定。  
- **P1 增强**：`GET /api/v1/orders`、`GET /api/v1/orders/{orderNo}` 已追加 **StandardService / QuotePreview / MerchantCandidate / MerchantQuoteConfirmation** 新主链扩展块。

## 0. 全局约定

- **Base path**：`/api/v1/`（与现网一致）。
- **鉴权**：除文档明确为访客可读的接口外，用户端业务接口需 **用户 JWT**（`Authorization: Bearer …`），行为与现网中间件一致。
- **多语言**：请求可带 `locale`（`zh` / `en` / `th`），显式参数优先，其次账号偏好，默认以现网实现为准。
- **新主流程固定概念**（叙述与字段命名优先使用英文标识）：**StandardService**、**RequirementTemplate**、**RequirementPayload**、**QuotePreview**、**MerchantCapability**、**MerchantCandidate**、**MerchantQuoteConfirmation**。
- **用户侧新入口主键**：**`standardServiceCode`（string）**，不得再作为长期合同中的「选某一 `serviceId` 再下单」唯一主叙事。
- **旧 `service` / `serviceId`**：在迁移完成前仅表示**旧商家服务配置 / 商家能力配置**（与 `yipai_services` 等现网数据对应），见 `docs/boundaries.md` §4。
- **用户可见服务名**：订单列表、详情、支付、评价等页面展示的服务名必须来自后端订单响应的 `serviceTitle` / `standardService` 展示字段，或来自已登记的 **StandardService** 配置；不得让客户端把内部 code（如类目 code 或 legacy service code）直接展示给用户。

**业务叙述禁用词**（与 `docs/glossary.md` 一致）：在描述用户下单与平台服务时，不使用 `product`、`goods`、`item`（作货品义）、`listing`、`shop_service`、`service product`。

---

## 1. 标准服务（StandardService）

### 1.1 列表

- **GET** `/api/v1/standard-services`

**用途**：分页或列表返回平台级 **StandardService** 目录，供首页/分类等入口使用；**不**以单一商家为归属。

**响应（核心，方向性）**：

- `data`：数组，项至少含 **`standardServiceCode`**、展示用名称与摘要、可选图标/分类等（具体字段以联调与后端实现为准）。

### 1.2 详情

- **GET** `/api/v1/standard-services/{code}`

**路径参数**：`code` = `standardServiceCode`。

**响应（核心，方向性）**：单条 **StandardService** 的完整展示字段（说明、规则、与后续 **RequirementTemplate** 的关联提示等）。

---

## 2. 需求模板（RequirementTemplate）

### 2.1 按标准服务拉取模板

- **GET** `/api/v1/standard-services/{code}/requirement-template`

**用途**：返回该 `standardServiceCode` 下的 **RequirementTemplate**（步骤、字段 schema、校验规则、与报价规则衔接所需元数据）。

**响应（核心，方向性）**：

- 模板标识、版本、**`fields` / `steps`** 等与表单渲染直接相关的结构（与现网 `form_schema` 类结构可衔接，以联调为准）。

---

## 3. 粗报价（QuotePreview）

### 3.1 生成粗报价

- **POST** `/api/v1/standard-services/{code}/quote-preview`

**用途**：根据用户填写的 **RequirementPayload** 与服务地址等，生成系统级 **QuotePreview**（**粗**报价，**不等于** **MerchantQuoteConfirmation** 的终局价）。

**请求体（核心字段）**：

| 字段 | 说明 |
|------|------|
| `standardServiceCode` | 须与路径 `{code}` 一致或与后端约定二选一校验。 |
| `requirementPayload` | 符合 **RequirementTemplate** 的 JSON 体（**RequirementPayload**）。 |
| `serviceAddress` | 服务地址对象（与现网 `serviceAddress` 语义对齐：门牌、坐标、地区等，以后端为准）。 |

**响应（核心字段）**：

| 字段 | 说明 |
|------|------|
| `quotePreviewId` | 粗报价单实例 id，供后续 `POST /api/v1/orders` 引用。 |
| `standardServiceCode` | 标准服务码。 |
| `estimatedAmount` | 粗估金额（字符串或数值 + 货币，以联调为准）。 |
| `pricingBreakdown` | 分项 breakdown（结构以联调为准）。 |
| `currency` | 货币代码。 |
| `expiresAt` | 粗报价过期时间（ISO 8601 等）。 |
| `warnings` | 可选；规则命中、区间说明、需用户注意项。 |

---

## 4. 创建订单

### 4.1 创建

- **POST** `/api/v1/orders`

**新主流程请求体（核心字段，P1b 可联调）**：

| 字段 | 说明 |
|------|------|
| `standardServiceCode` | 平台标准服务入口。 |
| `requirementPayload` | **RequirementPayload**（与模板一致）。 |
| `quotePreviewId` | 引自 **§3** 的 **QuotePreview**。 |
| `appointmentPreference` | 用户预约偏好（日期/时段/区间等，结构以联调为准；与 **MerchantQuoteConfirmation** 中最终时间的关系由后端统一）。 |
| `serviceAddress` | 服务地址。 |

`appointmentPreference` 的**嵌套 JSON 形状、与旧 `appointmentDate` / 时段字段的映射**在未与后端联调定稿前**不**在本文档冻结；见 **`api/requests.md`** R-20260428-009、R-20260428-014。

**响应（核心字段，方向性）**：

| 字段 | 说明 |
|------|------|
| `orderNo` | 订单号。 |
| `workflowStatus` | 订单工作流状态（现网为 `workflow_status` 等，目标集合见 `docs/state-machine.md` §4 对照说明）。 |
| `quotePreview` | 当前订单关联的粗报价摘要或引用（与 **QuotePreview** 一致）。 |
| `matchingStatus` | 与 **MerchantCandidate** 匹配阶段相关的状态。 |
| `nextAction` | 客户端可引导的下一动作（展示层提示，**非**自定义状态机）。 |

**`matchingStatus` / `nextAction` 的枚举值、与现网 `workflow_status` 的映射、以及响应 JSON 的精确定义**在 **`api/requests.md`** R-20260428-010、R-20260428-012 跟踪；**本合同只保留方向性字段名**，实现级 Schema 以联调与需求池为准。

**兼容（compatibility）**：见 **§10.3**；在 **P1** 之前，现网可能仍支持基于 **`serviceId`** 的旧入参路径，**不作为新流程合同主路径**。

---

## 5. 用户确认商家最终报价和时间

### 5.1 确认

- **POST** `/api/v1/orders/{orderNo}/confirm-merchant-quote`

**用途**：用户对已提交的 **MerchantQuoteConfirmation** 做终局接受，进入支付/预授权前骤。

**请求体（核心字段）**：

| 字段 | 说明 |
|------|------|
| `merchantQuoteConfirmationId` | 商家侧 **MerchantQuoteConfirmation** 记录 id。 |

**幂等、可重复提交、与 `MerchantQuoteConfirmation.status` 的门禁**在 **`api/requests.md`** R-20260428-009 跟踪，本文档不单独约定。

**响应（核心字段）**：

| 字段 | 说明 |
|------|------|
| `orderNo` | 订单号。 |
| `workflowStatus` | 更新后的工作流状态。 |
| `finalAmount` | 终局应付相关金额（以 **MerchantQuoteConfirmation** 为准）。 |
| `confirmedServiceTime` | 已确认的服务时间（或等价结构）。 |
| `paymentRequired` | 是否需要发起支付/预授权（布尔或枚举，以联调为准）。 |

---

## 6. 支付 / 预授权

### 6.1 创建支付意图

- **POST** `/api/v1/payments/intent`

**合同地位**：保留现网 **支付意图** 创建入口；用户端在需付款时创建 intent，**金额与可付性**以 **`GET /api/v1/orders/{orderNo}`** 及订单状态门禁为准（与 **api/registry.md** 已实现状态一致）。

**请求体（现网习惯，方向性）**：至少 **`orderNo`**、**`method`**（如 `wallet` 等，以现网为准）。

**后续能力（合同注明，实现可分期）**：**`pre_authorization`（预授权）** 作为与「直接扣款」并列或后续补充的支付方式/模式。请求体是否使用 `method`、`mode` 或顶层 `pre_authorization` 布尔等**不**在本文档冻结，以 **`api/requests.md`** R-20260428-003、**R-20260428-016** 与联调定稿为准；P0.5 仅在本文档**保留与现 `POST` intent 共存的合同方向**。

---

## 7. 订单中心

### 7.1 列表

- **GET** `/api/v1/orders`

**用途**：当前用户订单列表；筛选、分页、展示字段以现网及 **api/registry.md** 为准；需包含与评价、完成确认、隐藏等相关的展示位（如 `hasMyReply`、`overtimeNoComment` 等，见现网清单）。

### 7.2 详情

- **GET** `/api/v1/orders/{orderNo}`

**用途**：本人订单详情；字段与列表对齐，并包含 **workflow**、**pricing**、与 **StandardService** / **QuotePreview** / **MerchantQuoteConfirmation** 等衔接所需引用字段（随后端分期补齐）。

P2/P3 订单详情应逐步包含：`matching` 推荐摘要、`fulfillmentEvents` 履约事件摘要、`paymentHold` 平台代管摘要、`settlement` 结算摘要、`creditImpact` 信用影响摘要。字段未实现时不得由 BFF 或前端编造。

### 7.3 取消

- **POST** `/api/v1/orders/{orderNo}/cancel`

**用途**：未付款等允许场景下取消；规则以现网为准。

### 7.4 确认完成

- **POST** `/api/v1/orders/{orderNo}/confirm-completion`

**用途**：用户确认服务完成；body 可选 `remark`；门禁与目标态见现网与 `docs/state-machine.md`。

---

## 8. 售后

### 8.1 发起/操作售后

- **POST** `/api/v1/orders/{orderNo}/after-sales`

**用途**：在允许的状态内发起售后或推进售后子动作；请求/响应体与 **after_sales** 主态衔接见 `docs/state-machine.md`。

**说明**：具体子类型、可重复提交规则、与证据上传的衔接以 **`api/requests.md`** R-20260428-011 与后端实现为准（本合同**只**锁路径与职责方向，**不**发明请求体字段）。

---

## 9. 评价

### 9.1 提交评价

- **POST** `/api/v1/reviews`

**用途**：订单达到可评状态后，用户对商家评价；主评/追评、图片等以现网及 **api/registry.md** 为准。

### 9.2 我的评价

- **GET** `/api/v1/orders/{orderNo}/my-review`

**用途**：查询当前用户对该订单的评价详情；无评价时 404 或 `data: null` 以联调为准。

---

## 10. 旧接口状态（兼容 / 过渡）

以下接口**不**作为新主流程的**用户入口合同**；仅用于旧页过渡或与 **MerchantCapability** 历史形态对齐，直至前后端完成迁移。

### 10.1 访客服务目录与详情（旧商家服务配置维度）

- **状态**：**compatibility**
- **GET** `/api/v1/services`、**GET** `/api/v1/services/{id}` 等 **`/api/v1/services*`** 前缀的访客可读接口。  
- **说明**：仅用于旧页面与旧数据模型；**新用户入口**须为 **`standardServiceCode`**，见 `docs/boundaries.md`。

### 10.2 询价与可预约日（旧路径）

- **状态**：**compatibility**
- **POST** `/api/v1/services/{id}/price-preview`：后续由 **`POST /api/v1/standard-services/{code}/quote-preview`**（**QuotePreview**）替代。  
- **GET** `/api/v1/services/{id}/bookable-days`**：后续迁移到 **MerchantCandidate** / **MerchantCapability** 维度可预约能力（以 **`api/requests.md`** 为准）。  
- **说明**：**`{id}`** 指旧商家服务配置 id，**不是** `standardServiceCode`。

### 10.3 创建订单与 `serviceId`

- **状态**：**compatibility**
- **POST** `/api/v1/orders` 在现网中若仍接受 **`serviceId`** 等旧入参，则属过渡；**P1** 起新主流程**必须**以 **`standardServiceCode`** + **RequirementPayload** + **quotePreviewId** 为主路径。  
- **说明**：迁移完成前，同一接口可能同时存在新旧两套字段，**不得**在前端新页面中把 **`serviceId`** 当作新下单唯一入口（见 `roles/user-frontend.md`）。

---

## 11. 与实现的关系

- **事实源**：已上线行为以 `expatth-backend` 路由与实现为准；本合同描述**目标形态**与**兼容策略**。  
- **缺口**：若路径或字段与现网不一致，**不**在本文档发明字段；应写入 **`api/requests.md`** 并由后端排期。  
- **状态名字符串**：对外展示用以后端当前返回为准；**目标**集合与对照见 `docs/state-machine.md` §1 与 §4。
