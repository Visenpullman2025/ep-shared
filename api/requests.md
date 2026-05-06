# API 需求池（唯一入口）

最后更新：2026-05-07（当前阶段 MySQL 优先；pgsql plan 暂停）

> **所有**待实现、待改字段、待补错误码、跨角色冲突，**只**写本文件；**禁止**只在聊天或 issue 里约定后直连改代码。  
> 合同文档 **user-api / merchant-api** 为**稳定合同**；**缺口**仍回写本文件。  
> 历史 **docs/api-user-request.md**、**docs/api-merchant-request.md** 保留备查。

## 条目格式说明

每条以 `## R-YYYYMMDD-xxx` 开头，字段如下（可增 **备注** / **待决策点**）：

- 来源角色：
- 背景：
- 需要的接口：
- 请求字段草案：
- 响应字段草案：
- 失败场景：
- 影响页面：
- 状态：draft / proposed / accepted / implemented / rejected
- 关联合同：
- 关联代码：

---

## P1 本轮完成范围（2026-05-05）

本轮 `/teamwork` 的 **P1** 把当前交易主链路从 P1b 推进到可联调的最小完整阶段：

- **已实现**：R-004、R-009、R-011、R-012、R-013、R-014、R-015、R-019。
- **已完成并作为依赖**：R-005、R-006、R-007、R-008、R-010、R-018。
- **不纳入本轮必须完成**：R-016（availability capacity/timeSlots 目标模型仍 accepted，当前为商家可用性字段最小切片）、R-017（GET quote-preview 旁路，仍 draft）。这些不得被前端伪装为完整目标模型已完成。
- **验收链路**：用户创建订单 -> 商家看到候选 -> 商家提交 MerchantQuoteConfirmation -> 用户确认报价 -> 订单进入 `waiting_payment_or_authorization`；同时能力配置、信用只读、售后发起已有真实后端路由和前端入口。

---

## R-20260428-001 订单列表与评价态展示字段

- 来源角色：用户端 / Backend API
- 背景：订单中心需区分「去评价 / 查看评价」；旧需求在 api-user-request 已列。
- 需要的接口：`GET /api/v1/orders`、`GET /api/v1/orders/{orderNo}` 在列表/详情中稳定返回评价相关态。
- 请求字段草案：无新增；可能需 query 控制体积。
- 响应字段草案：`hasMyReply`（boolean）、`overtimeNoComment`（或 snake_case 兼容）。
- 失败场景：401 未登录；404 非本人单。
- 影响页面：用户端订单中心、订单详情。
- 状态：implemented（以现网为准；若缺字段则回开子条）
- 关联合同：user-api（订单节）
- 关联代码：`MeCenterController`、订单序列化

---

## R-20260428-002 订单评价拉取

- 来源角色：用户端
- 背景：评价入口需主评/追评结构一致。
- 需要的接口：`GET /api/v1/orders/{orderNo}/my-review`
- 请求字段草案：路径 `orderNo`；Header JWT。
- 响应字段草案：`id`、`rating`/`score`、`content`、图 URL 数组、时间、可选 `appendices`；无评时 404 或 `data: null`（与 BFF 约定一次）。
- 失败场景：401、404。
- 影响页面：评价页、订单详情。
- 状态：implemented
- 关联合同：user-api
- 关联代码：`MeCenterController@myOrderReview`

---

## R-20260428-003 支付 intent 与订单金额一致

- 来源角色：用户端
- 背景：防止客户端篡改金额；与现网 `PaymentSettlementService` 类逻辑一致；新主链下**额外**受 `workflowStatus` 与是否允许付款约束（见 `user-api` §6、`error-codes`）。
- 需要的接口：`POST /api/v1/payments/intent`
- 请求字段草案：`orderNo`、`method`（如 `wallet`）；可选带金额做校验；**可**扩展 `paymentMode`（`pay` / `pre_authorize` 等，待与渠道对齐）。
- 响应字段草案：支付意图/收银台需要字段。
- 失败场景：422 金额与订单 `user_payable` 等不一致、**订单态不允许支付/预授权**（见 `EX_PAYMENT_NOT_READY`）。
- 影响页面：支付。
- 状态：implemented
- 关联合同：user-api
- 关联代码：`PaymentController@intent`、`PaymentSettlementService`

---

## R-20260428-004 商户评价客户

- 来源角色：商家端
- 背景：与客户互评；原 api-merchant-request 待实现。
- 需要的接口：`POST /api/v1/merchant/reviews`（路径若变以 accepted 需求为准）
- 请求字段草案：与 `POST /api/v1/reviews` 对称性字段；`orderNo`、评分、内容、可选 `hideForSeller`、广场相关字段。
- 响应字段草案：成功态与主评 id。
- 失败场景：403 非本商户单、订单态不允许。
- 影响页面：商家端订单完结后评价。
- 状态：implemented
- 关联合同：merchant-api
- 关联代码：`MerchantPortalController@createReview`、`ReviewService@createMerchantReview`、`POST /api/v1/merchant/reviews`、`epmerchant` 商家订单页评价客户入口

---

## R-20260428-005 标准服务：列表与详情

- 来源角色：用户端 / Backend API / 产品
- 背景：用户主入口为 **`standardServiceCode`**；与旧 `GET /api/v1/services` 解耦（见 `docs/boundaries.md`）。
- 需要的接口：  
  - `GET /api/v1/standard-services`  
  - `GET /api/v1/standard-services/{code}`  
- 请求字段草案：统一 query **`locale`**；列表支持分页（`page`/`pageSize` 或 `cursor`，**待决策**）、可选 **`categoryCode`** 筛选。
- 响应字段草案：项含 **`standardServiceCode`**、多语言名/摘要/封面、**是否对客开放**、可选 **默认 RequirementTemplate 版本**指针；详情含富文本与规则区（以产品为准）。
- 失败场景：404 `code` 不存在或已下线；401 仅当某环境要求登录（默认访客可读则无）。
- 待决策点：下线路径用 **HTTP 404** 与 **410** 二选一；列表是否返回未开放项给管理态 BFF（若需要则另需 admin 合同）。
- 影响页面：首页、类目、标准服务落地页。
- 状态：**implemented**（P1a：`GET /api/v1/standard-services*` 已登记在 `api/registry.md`）
- 关联合同：user-api §1
- 关联代码：`StandardServiceController@index`、`StandardServiceController@show`

---

## R-20260428-006 按标准服务拉取 RequirementTemplate

- 来源角色：用户端 / Backend API
- 背景：需求采集与 **QuotePreview** 计价依赖同一模板版本。
- 需要的接口：`GET /api/v1/standard-services/{code}/requirement-template`
- 请求字段草案：路径 `code`；query 可选 **`templateVersion`** 或 **Accept-Version**（**待决策** 二选一或并存）。
- 响应字段草案：**RequirementTemplate** 可渲染结构（`fields` / `steps`、校验、与计价元数据引用）；**`templateVersion`**、**`templateHash`**（用于客户端缓存与提交时带回）。
- 失败场景：404 标准服务不存在；422 无可用模板版本。
- 待决策点：多版本并存时默认拉「当前 published」规则；与现网 `form_schema` 的字段名迁移映射表在 P1 由后端给出。
- 影响页面：需求填写、校验。
- 状态：**implemented**（P1a：`GET /api/v1/standard-services/{code}/requirement-template` 已登记在 `api/registry.md`）
- 关联合同：user-api §2
- 关联代码：`StandardServiceController@requirementTemplate`

---

## R-20260428-007 生成 QuotePreview（粗报价）

- 来源角色：用户端 / Backend API
- 背景：粗报价**落库**为可引用实体，与旧 `POST /api/v1/services/{id}/price-preview` 并存期需策略。
- 需要的接口：`POST /api/v1/standard-services/{code}/quote-preview`
- 请求字段草案：`requirementPayload`、**`serviceAddress`**；路径 `code` 与 body **`standardServiceCode`** 双校验；可选 **`idempotencyKey`**（**待决策** 是否强依赖）。
- 响应字段草案：`quotePreviewId`、`standardServiceCode`、`currency`、`expiresAt`、**金额或区间**、分项 `pricingBreakdown`、可选 `warnings`。
- 失败场景：422 **RequirementPayload** 与模板不合（见 `EX_REQUIREMENT_PAYLOAD_INVALID`）；**404** 标准服务不存在；401 若策略要求登录后询价（**待决策**）。
- 待决策点：未登录可询价时风控与限流；与旧路双写/覆盖策略。
- 影响页面：下单前估价、重入恢复。
- 状态：**implemented**（P1a：`POST /api/v1/standard-services/{code}/quote-preview` 已登记在 `api/registry.md`）
- 关联合同：user-api §3
- 关联代码：`StandardServiceController@quotePreview`、`StandardServicePreviewService`；旧参考 `ServiceProcessTemplateController@servicePricePreview`（**compatibility**）

---

## R-20260428-008 新主链创建订单

- 来源角色：用户端 / Backend API
- 背景：订单必须绑定 **StandardService** 主线：`standardServiceCode`、`requirementPayload`、**`quotePreviewId`**，并进入 **matching_merchants** 等态（见 `state-machine`）。
- 需要的接口：`POST /api/v1/orders`（**合同体**为 `user-api` §4；**与现网** `serviceId` 入参 **兼容**一段时间）。
- 请求字段草案：见 `user-api` **§4.1 新主流程**；**兼容** 旧 `serviceId` + `processData` 的字段在 **§10**。
- 响应字段草案：`orderNo`、`workflowStatus`、**`nextAction`（见 state-machine 说明）**、**`quotePreview` 引用**、匹配摘要字段（`matchingStatus` 等）、`pricing` 以落库为准。
- 失败场景：422 `quotePreviewId` 无效/过期/与 `code` 不一致；地址/手机门禁等现网 422；重复单策略。
- 待决策点：是否允许 **无** `quotePreviewId` 的弱网重试（不推荐，若允许须单独 R- 放开）。
- 影响页面：提交订单、订单详情。
- 状态：**implemented**（P1b 本地闭环：`standardServiceCode + quotePreviewId + requirementPayload + serviceAddress` 已可创建订单；候选/MQC 子实体仍按 R-009/R-014 planned）
- 关联合同：user-api §4、§10
- 关联代码：`OrderController@store`、`OrderFlowService`、`StandardServiceOrderPayloadResolver`

---

## R-20260428-009 用户确认商家 MerchantQuoteConfirmation

- 来源角色：用户端 / Backend API
- 背景：用户在 **waiting_user_confirmation** 态接受**唯一**或**主**确认单，以进入 **waiting_payment_or_authorization**（见 `state-machine`）。
- 需要的接口：`POST /api/v1/orders/{orderNo}/confirm-merchant-quote`
- 请求字段草案： **`merchantQuoteConfirmationId`**（必）；可选 **`acceptedAmount`** 仅当产品要求用户勾金额（默认以后端 MQC 为准，**待决策**）。
- 响应字段草案：`orderNo`、`workflowStatus`、`nextAction`、**`finalAmount` / `platformFee` / `taxFee` / `userPayable`**、**`confirmedServiceTime`**、`paymentRequired`。
- 失败场景：422 订单态不允许、**`EX_ORDER_MQC_NOT_ALLOWED`**、**`EX_CANDIDATE_EXPIRED`/`EX_MQC_DUPLICATE`/`EX_USER_CONFIRM_DUPLICATE`**（见 `error-codes`）；409 多确认单竞态（**待决策** 定唯一策略）。
- 待决策点：一订单多商家并行报价时，是否只允许一条 **accepted** MQC。
- 影响页面：认价、去支付。
- 状态：**implemented**（P1：后端路由、用户端 BFF 与订单详情/订单中心入口已接）
- 关联合同：user-api §5
- 关联代码：`MeCenterController@confirmMerchantQuote`、`OrderP1Service@confirmMerchantQuote`、`ep` `src/app/api/orders/[orderNo]/confirm-merchant-quote/route.ts`、`P1OrderMainChainBlock`

---

## R-20260428-010 旧 `workflow_status` 与目标 `workflowStatus` 的映射

- 来源角色：Backend API / 全端
- 背景：现网枚举与 **目标**主态（`draft_requirement` …）**字面值不同**；`nextAction` 仅为引导字段，**不**是独立子状态机（见 `state-machine` §6）。
- 需要的接口：无新 HTTP；需**单源** **映射表**（配置或代码常量）+ 对客户端稳定暴露 **`workflowStatus`（目标）** 与可选 **`_legacyWorkflowStatus`（迁移期，待决策**是否暴露**）**。
- 请求/响应：N/A
- 失败场景：N/A
- 影响页面：全端展示、运营报表、BI。
- 待决策点：迁移期**双写**还是仅新单用新枚举；老单**洗数据**策略。
- 状态：**implemented**（P1b 本地：API 对外返回目标 `workflowStatus`、`nextAction`，迁移期返回 `legacyWorkflowStatus`；洗数/DB 双写仍待后续）
- 关联合同：`state-machine.md`、全角色订单字段
- 关联代码：`OrderWorkflowStatusPresenter`、`OrderFlowService`、`MeCenterController`

---

## R-20260428-011 用户发起售后

- 来源角色：用户端 / 产品
- 背景：订单在允许态进入 **after_sales** 子域；表 **`after_sales_cases`**（`schema-plan`）。
- 需要的接口：`POST /api/v1/orders/{orderNo}/after-sales`
- 请求字段草案：**`caseType`**（**枚举待定**）、**`description`**、**`evidence`（图片 URL 列表，接 OSS 策略）**；**幂等/重复提交**规则**待决策**。
- 响应字段草案：`caseId`、**`status`**、**与订单/工作流**衔接后的 **`workflowStatus`** 或**售后**独立态。
- 失败场景：**`EX_AFTER_SALES_NOT_ALLOWED`**、422 参数、403 非本人。
- 待决策点：可发起售后的**订单主态+支付态**白名单；与**退款**通道是否分单。
- 影响页面：订单详情「售后」、客服协同。
- 状态：**implemented**（P1 最小发起；子类型与枚举仍可后续细化）
- 关联合同：user-api §8
- 关联代码：`MeCenterController@createAfterSalesCase`、`OrderP1Service@createAfterSalesCase`、`ep` `src/app/api/orders/[orderNo]/after-sales/route.ts`、`P1AfterSalesForm`

---

## R-20260428-012 订单 GET 扩展（新主链信息块）

- 来源角色：用户端 / BFF
- 背景：列表/详情在「匹配 / 等商家确认 / 等用户确认 / 等支付」阶段需展示**结构化**信息，**避免**各端自猜。
- 需要的接口：在 **R-001 已实现** 的 `GET /api/v1/orders`、**`GET /api/v1/orders/{orderNo}`** 上**增加** `data` 内可选块（不破坏旧字段）：
- 请求字段草案：无；可选 `expand=quotePreview,candidate,merchantQuote`（**待决策** 命名）。
- 响应字段草案：  
  - **`standardServiceCode`**、**`quotePreviewId`/`quotePreview` 摘要**  
  - **候选/匹配**：`candidates[]` 或 `matching` 块（`candidateId`、**status**、过期）  
  - **MerchantQuoteConfirmation 摘要**：`merchantQuoteConfirmations[]` 或**当前**一条
  - **`workflowStatus`（目标）**、**`nextAction`**、**`payment` 闸口**说明
- 失败场景：同 001
- 待决策点：列表**是否**默认不展开大块，仅详情展开。
- 影响页面：订单中心、详情页、状态条。
- 状态：**implemented**（订单列表/详情已返回新主链扩展块）
- 关联合同：user-api §7
- 关联代码：`OrderMainChainPresenter`、`MeCenterController@orders`、`MeCenterController@orderDetail`

---

## R-20260428-013 商家能力 MerchantCapability CRUD

- 来源角色：商家端 / Backend API
- 背景：替代长期依赖「旧 **merchant services** 行即能力」的心智；绑定 **`standardServiceCode`**。
- 需要的接口：  
  - `GET /api/v1/merchant/capabilities`  
  - `POST /api/v1/merchant/capabilities`  
  - `GET /api/v1/merchant/capabilities/{id}`  
  - `PUT /api/v1/merchant/capabilities/{id}`  
- 请求/响应：见 **`merchant-api` §2**；`basePricingRule`、`serviceArea` 等 JSON 结构 **以 P1 后端 schema 定稿**为准（当前合同为方向）。
- 失败场景：403、422 绑定非法 **standardServiceCode**、审核态禁止编辑（**待决策**）。
- 待决策点：与旧 `POST /merchant/services` 的**数据双写/迁移**顺序。
- 影响页面：商家能力配置、任务匹配。
- 状态：**implemented**（P1：后端 CRUD 与商家端最小管理页已接）
- 关联合同：merchant-api §2
- 关联代码：`MerchantPortalController` capability methods、`MerchantCapabilityService`、`YipaiMerchantCapability`、`epmerchant` `merchant/capabilities`

---

## R-20260428-014 商家待办：order-requests 与 MQC 提交

- 来源角色：商家端
- 背景：商家在 **order-requests** 列表中处理 **MerchantCandidate**，提交 **MerchantQuoteConfirmation**。
- 需要的接口：  
  - `GET /api/v1/merchant/order-requests`  
  - `POST /api/v1/merchant/order-requests/{candidateId}/quote-confirmation`  
- 请求/响应：见 **`merchant-api` §4–5**；**`finalAmount`、**`confirmedServiceTime`** 与 **`validUntil`** 规则** 待 P1 与风控对齐**。
- 失败场景：422 候选已 **expired**、**状态不允许**、**`EX_CANDIDATE_EXPIRED`/`EX_MQC_DUPLICATE`** 等；403 非本商。
- 待决策点：候选过期是否自动释放下一候选；**重复提交** MQC 是否 409/422。
- 影响页面：商家待办、报价、日历。
- 状态：**implemented**（P1：候选列表与 MQC 提交已接）
- 关联合同：merchant-api §4–5
- 关联代码：`MerchantPortalController@orderRequests`、`MerchantPortalController@submitQuoteConfirmation`、`MerchantOrderRequestService`、`YipaiMerchantCandidate`、`YipaiMerchantQuoteConfirmation`、`epmerchant` `merchant/order-requests`

---

## R-20260428-015 商家信用档案

- 来源角色：商家端 / 运营
- 背景：表 **`merchant_credit_profiles` / `merchant_credit_events`**。
- 需要的接口：`GET /api/v1/merchant/credit-profile`（**读**；写可走 admin 或内部任务，不锁用户 HTTP）。
- 请求字段草案：无；或 query **`locale`**。
- 响应字段草案：**`score`/`level`、**`badges`、**`lastUpdatedAt`、**可选** 事件摘要**列表长度限制。
- 失败场景：403
- 待决策点：评分公式是否对商家可见明细。
- 影响页面：商家我的、信任展示。
- 状态：**implemented**（P1 只读接口与商家端页面已接；评分数据仍可分期丰富）
- 关联合同：merchant-api §8
- 关联代码：`MerchantPortalController@creditProfile`、`MerchantCreditProfileService`、`YipaiMerchantCreditProfile`、`YipaiMerchantCreditEvent`、`epmerchant` `merchant/credit-profile`

---

## R-20260428-016 商家开放日/可用性 与 `capacity` / timeSlots 演进

- 来源角色：商家端 / Backend API
- 背景：现网 `GET/PUT /api/v1/merchant/availability` 以 **`openDates[]`** 为主；新主链需与 **MerchantCandidate、MerchantQuoteConfirmation** 的**可服务时段**一致。
- 需要的接口：延续 **`GET/PUT /api/v1/merchant/availability`**，**演进** body/响应（**不**另造二套路径，除非 P1 评审拆分）。
- 请求字段草案：**保留** `openDates`；**扩展** 可选 **`capacity`**（如每日上限制）、**`timeSlots`** 或**规则**对象（**结构待定**）；与 **`merchant_capabilities`** 的**优先级**（全局 vs 单能力）**待决策**。
- 响应字段草案：与请求对称 + **服务端**解析后的**展示**用摘要。
- 失败场景：422 结构非法、时区/日期不合法。
- 待决策点：与 **现网** `bookable-days` 用户端接口的**兼容**与**废弃**时间；曼谷时区单一源。
- 影响页面：商家日历、用户选日/匹配。
- 状态：**accepted**（P2：与 R-021 合并推进；字段按 merchant-api §2–3 和后端实现收敛）
- 关联合同：merchant-api §3
- 关联代码：现网 `getAvailability`/`updateAvailability`（**implemented** 行为不变至 P1）

---

## R-20260428-017 幂等与 GET quote-preview 可选旁路

- 来源角色：用户端 / Backend API
- 背景：长会话中恢复 **`quotePreviewId` 或防重复下单** 可能需要 **`GET /api/v1/quote-previews/{id}`**（或等价挂在 standard-services 下）；**非** M 端 scope。
- 需要的接口（草案，**未进 user-api 必实现列表**）：`GET` 按 `quotePreviewId` 取粗报快照与是否过期；与 **POST …/quote-preview** 的**幂等键**协同。
- 待决策点：是否必须做；若不做，则由 **R-012** 详情**仅**用订单侧快照保证。
- 影响页面：恢复会话、刷新估价。
- 状态：**draft**（**未**在 P0.5 合同锁死路径；若不做则本条保持 draft 或 rejected）
- 关联合同：待定
- 关联代码：无

---

## R-20260428-018 用户端（ep）BFF 与 user-api 新路径对齐

- 来源角色：User Frontend
- 背景：P0.5 只读审查：`ep` 当前仅 BFF 代理 `GET/POST` 至旧 `/api/v1/services/*`，**无** 对 `standard-services` / `quote-preview` 的 BFF；`POST /api/orders` 与 `orders/new` 仍依赖 `serviceId` 与 `processData` 等旧体。P1 接入新主链前，需在 **ep** `app/api` 增路由与上游 `api/user-api.md` §1–3、新 `POST /api/v1/orders` 对齐（与旧 BFF 并存、切流以 R-005/008/009 为准）。
- 需要的接口：Next.js BFF 路由（**非** Laravel 新条）：`GET/POST` 对 ` /api/v1/standard-services`、`/api/v1/standard-services/{code}`、`/api/v1/standard-services/{code}/requirement-template`、`/api/v1/standard-services/{code}/quote-preview` 的透传；`POST /api/v1/orders` 透传 **`standardServiceCode` 等**新字段。具体 BFF 路径与 `docs/frontend-api-renames.md` 只读对齐一次，避免与现 `/api/services` 混淆。
- 请求字段草案：与上游及现 BFF 一致，JWT 与 `locale` 透传同 `src/app/api/orders`。
- 响应字段草案：不裁剪业务字段，错误体透传。
- 失败场景：401/404/422 与上游一致；禁止 BFF 自定义平行错误枚举。
- 影响页面：首页/类目/标准服务详情/需求页/粗报价/下单在 **ep** 的调用链。
- 状态：**implemented**（P1b：用户端 BFF 已透传 `POST /api/orders` 新体，标准服务报价页可用 `quotePreviewId` 创建订单）
- 关联合同：user-api §1–3、§4
- 关联代码：`ep` `src/app/api/standard-services/route.ts`、`[code]/route.ts`、`[code]/requirement-template/route.ts`、`[code]/quote-preview/route.ts`、`src/app/api/orders/route.ts`；页面 `src/app/[locale]/standard-services/page.tsx`、`[code]/page.tsx`、`[code]/quote/page.tsx`；`src/lib/requirement-form.ts`、`src/lib/standard-services.ts`

---

## R-20260428-019 用户端路由与 query 从 `serviceId` 迁移为 `standardServiceCode`

- 来源角色：User Frontend / 产品
- 背景：`ep` 旧入口使用 `src/app/[locale]/services/[id]/page`、`orders/new?serviceId=`，与 **boundaries** 新主入口 `standardServiceCode` 冲突；Oauth/login `next` 与 profile 补全深链也携带旧 query。
- 需要的信息架构：统一目标路径与 query 命名（**选一种**：如 `/[locale]/standard-services/[code]` 或**保留** `/services/[id]` 仅作重定向/别名）；`orders/new` 的 `searchParams` 迁为 `standardServiceCode`（`serviceId` 在并存期内 deprecated）；全站 `href` / `router` / `next` 重定向表。
- 请求字段草案：N/A
- 响应字段草案：N/A
- 失败场景：已分享旧 URL 的 301/302 与客户端回退（待产品定）。
- 影响页面：首页、分类页、服务详情、下单、登录/资料补全的 next 参数。
- 状态：**implemented**（P1：旧 `orders/new?serviceId=` 与 `services/[id]` 已降级为兼容提示 / 标准服务入口）
- 关联合同：user-api §0、`docs/boundaries.md` §2
- 关联代码：`ep` `src/app/[locale]/orders/new/page.tsx`、`src/app/[locale]/services/[id]/page.tsx`

---

## R-20260428-020 P2 动态推荐与匹配快照

- 来源角色：产品 / Backend API / 用户端 / 商家端
- 背景：用户不直接选商家；平台需要按商家能力、星级、服务质量、响应速度、距离、价格、档期与就绪状态生成候选，并保存推荐原因，避免推荐结果不可解释。
- 需要的接口：延续 `POST /api/v1/orders` 创建订单后的候选生成；订单列表/详情通过 R-012 暴露推荐摘要；商家端通过 R-014 读取候选待办。
- 请求字段草案：无新增用户必填字段；推荐输入来自 `RequirementPayload`、`serviceAddress`、`MerchantCapability`、信用档案、档期与价格规则。
- 响应字段草案：订单扩展块中可含 `matching.factors[]`、`matching.generatedAt`、`candidates[].matchScore`、`candidates[].distanceKm`、`candidates[].responseScore`、`candidates[].availabilityStatus`。
- 失败场景：无可用商家、档期冲突、能力禁用、服务区域不覆盖。
- 影响页面：用户订单详情、商家 order-requests、运营审计。
- 状态：implemented（P2：后端候选匹配、用户/商家展示切片已接；真实 DB E2E 仍需执行）
- 关联合同：`docs/fulfillment-flow.md`、`docs/state-machine.md`、`api/user-api.md`、`api/merchant-api.md`
- 关联代码：`MerchantMatchingService`、`OrderFlowService`、`OrderMainChainPresenter`、`MerchantOrderRequestService`、`ep` 订单展示、`epmerchant` 待办卡片

---

## R-20260428-021 商家可用性、容量与就绪状态

- 来源角色：产品 / 商家端 / Backend API
- 背景：R-016 只定义了 capacity/timeSlots 方向；P2 需要明确商家是否可接单、某能力是否可服务、档期是否足够支撑匹配。
- 需要的接口：扩展 `GET/PUT /api/v1/merchant/availability` 与 `GET/POST/PUT /api/v1/merchant/capabilities*`；不新增平行日历接口。
- 请求字段草案：`readyStatus`、`capacityRule`、`timeSlots`、`blackoutDates`、`serviceArea`、`extraDistanceRule`。
- 响应字段草案：与请求对称；候选和订单详情只暴露摘要，不暴露商家内部排班全部细节。
- 失败场景：422 日期/时区非法、容量规则非法、能力已禁用、审核态不允许修改。
- 影响页面：商家能力配置、商家日历、用户匹配。
- 状态：implemented（P2：能力与 availability 字段已接；真实 DB E2E 仍需执行）
- 关联合同：merchant-api §2–3，R-016
- 关联代码：`MerchantCapabilityService`、`MerchantOrderService@getAvailability/updateAvailability`、`YipaiMerchantCapability`、`YipaiMerchant`、`epmerchant` 能力表单

---

## R-20260428-022 行业 WorkflowDefinition 与策略注册表

- 来源角色：产品 / Backend API
- 背景：空调清洗、保洁等行业需要不同字段、步骤和计价逻辑；不能为每个行业写硬编码控制器。
- 需要的接口：无独立用户接口；由 `RequirementTemplate`、`POST quote-preview`、`POST orders`、商家能力和后端策略服务共同消费。
- 请求字段草案：首批样板 `aircon_cleaning` 与 `home_cleaning`：空调清洗含 `propertyType`、`unitCount`、`distanceKm`；保洁含 `propertyType`、`areaSqm`、`cleaningType`。
- 响应字段草案：RequirementTemplate 返回可渲染字段；QuotePreview 返回分项计价和策略 code 摘要。
- 失败场景：模板版本不存在、策略 code 未注册、payload 与模板不匹配。
- 影响页面：标准服务报价页、创建订单、商家能力规则。
- 状态：implemented（P2：两个样板模板与 pricing override 已接；完整 WorkflowDefinition 独立表仍可后续增强）
- 关联合同：user-api §2–4、merchant-api §2
- 关联代码：`StandardServiceP1aSeeder`、`StandardServicePreviewService`、`ServiceProcessPricingService`

---

## R-20260428-023 平台代管、平台 1% 收益与结算

- 来源角色：产品 / Backend API / 用户端 / 商家端
- 背景：用户锁定订单后，款项进入平台代管；平台按服务小计收取 1% 服务费作为平台收益，并按服务小计收取 7% 税费，服务完成后向商家结算服务小计。
- 需要的接口：`POST /api/v1/payments/intent` 扩展支付/预授权模式；订单详情返回 `pricing.amount`、`pricing.platformFee`、`pricing.taxFee`、`pricing.total` 与 `pricing.merchantSettlement`；后端结算由履约完成触发。
- 请求字段草案：`orderNo`、`method`、可选 `mode`（`pay` / `pre_authorize`，以后端渠道为准）。
- 响应字段草案：`holdStatus`、`platformFeePercent`、`platformFee`、`taxFee`、`merchantSettlement`、`userPayable`、`paymentStatus`。
- 失败场景：订单态不允许付款、金额过期、MQC 未接受、重复冻结、余额不足。
- 影响页面：用户支付、订单详情、商家钱包、结算记录。
- 状态：implemented（P2：payment intent 与 wallet pay 返回冻结/平台收益摘要；真实渠道预授权仍按支付渠道后续增强）
- 关联合同：user-api §6、state-machine §5
- 关联代码：`PaymentController@intent`、`PaymentSettlementService`、`OrderPricing`、`OrderP1Service`、`OrderMainChainPresenter`、`ep` 支付弹层

---

## R-20260428-024 履约事件、异常惩罚与信用更新

- 来源角色：产品 / Backend API / 商家端 / 用户端
- 背景：服务开始、完工、迟到、未履约、售后判责等必须形成事件流，并影响商家推荐等级和信用分；用户侧恶意行为也要进入信用事件。
- 需要的接口：延续商家 `start-service`、`finish-service`、用户 `confirm-completion`、`after-sales`；可增加内部事件记录，不暴露任意状态推进接口给前端。
- 请求字段草案：动作接口可带 `remark`、`occurredAt`、`evidence`；惩罚由后端策略计算，不由前端传扣分。
- 响应字段草案：订单当前 `workflowStatus`、`fulfillmentEvents[]` 摘要、`creditImpact` 摘要。
- 失败场景：状态不允许、未支付不可开始、重复完成、售后锁定、非订单商家或非本人操作。
- 影响页面：商家订单、用户订单、信用档案、售后。
- 状态：implemented（P3：履约事件与商家信用事件已接；用户信用事件可后续独立扩展）
- 关联合同：state-machine §5.1–5.2、merchant-api §6、user-api §7–8
- 关联代码：`FulfillmentEventService`、`YipaiFulfillmentEvent`、`OrderWorkflowService`、`MerchantOrderService`、`OrderP1Service`、`OrderMainChainPresenter`

---

## R-20260428-025 双向互评与广场脱敏分发

- 来源角色：产品 / 用户端 / 商家端 / Backend API
- 背景：服务完成后用户评价商家、商家评价用户，评价和服务摘要可选择同步到广场，但必须脱敏。
- 需要的接口：用户侧延续 `POST /api/v1/reviews`；商家侧实现 R-004 `POST /api/v1/merchant/reviews`；广场分发由评价请求可选字段或后端任务触发。
- 请求字段草案：`orderNo`、`rating`、`content`、`imageUrls`、可选 `publishToSquare`、`squarePublishAnonymous`。
- 响应字段草案：`reviewId`、`squarePostId`、`squarePublishStatus`。
- 失败场景：订单未完成、重复评价、非本人/非本商家、隐私字段命中拒绝发布。
- 影响页面：用户评价页、商家订单详情、广场。
- 状态：implemented（P3：用户评价广场分发和商家评价客户已接；脱敏策略为当前最小实现）
- 关联合同：user-api §9、merchant-api R-004、registry 现有 square/reviews
- 关联代码：`ReviewService`、`MerchantPortalController@createReview`、`POST /api/v1/reviews`、`POST /api/v1/merchant/reviews`、`ep` 评价请求、`epmerchant` 商家订单页

---

## R-20260428-026 订单服务身份与展示名标准化

- 来源角色：用户端 / Backend API / Shared
- 背景：用户端支付弹层曾把订单里的内部 code `on-site-cleaning` 展示成「服务」，说明订单响应里标准服务身份与展示名不够稳定。前端不得靠局部 code-to-label map 修一个漏一个。
- 需要的接口：扩展 `GET /api/v1/orders`、`GET /api/v1/orders/{orderNo}`、`POST /api/v1/orders`、`POST /api/v1/payments/intent` 的订单摘要来源；如支付 intent 返回订单快照，也必须使用同一 presenter。
- 请求字段草案：无新增用户入参。
- 响应字段草案：订单对象稳定包含 `standardServiceCode`、`serviceTitle`（按 locale 或后端默认 locale 解析）、可选 `standardService` 摘要；legacy `serviceType` / 类目 code 只能作为调试或兼容字段，不作为用户展示名。
- 失败场景：订单关联不到 StandardService 时，后端返回可解释的兼容展示名与 `legacyServiceCode`，同时记录数据修复需求；不得把内部 code 原样交给客户端当文案。
- 影响页面：用户订单中心、订单详情、支付弹层、评价页、商家订单待办。
- 状态：implemented（后端 `OrderMainChainPresenter` 稳定返回 `serviceTitle` / `serviceTitleI18n` / `standardService`；用户端已删除本地 code-to-label map）
- 关联合同：`docs/boundaries.md` §6、`api/user-api.md` §0
- 关联代码：`OrderMainChainPresenter`、`StandardServiceOrderPayloadResolver`、`ep/src/lib/orders-pickers.ts`

---

## 暂停：`pgsql plan`（R-027 至 R-029）

以下 3 条已按 2026-05-07 决定暂停。当前阶段只推进 MySQL 业务事实源、Laravel API、用户端 BFF、商家端 BFF；不得把 R-027 至 R-029 写入 `api/registry.md` implemented，也不得保留 PostgreSQL-only migration 阻塞 MySQL migration。

## R-20260428-027 PostgreSQL 能力读模型同步

- 来源角色：产品 / Backend / 运营后台
- 背景：当前确认 MySQL 继续作为业务事实源；PostgreSQL 只在距离搜索、推荐算法、AI 语义搜索和多语言模糊检索需要时作为能力读模型库，优先选择阿里云 RDS PostgreSQL。
- 需要的接口：后端内部同步任务；Dcat 后台手动同步动作；可选只读同步状态接口。
- 请求字段草案：自动任务无用户入参；手动同步动作可选 `scope`（`merchant_geo` / `recommendation_features` / `search_embeddings` / `all`）、`force`。
- 响应字段草案：`syncRunId`、`scope`、`status`、`startedAt`、`finishedAt`、`sourceUpdatedSince`、`upsertedCount`、`failedCount`、`errorSummary`。
- 失败场景：PostgreSQL 连接不可用、embedding provider 不可用、MySQL 源数据缺少 lat/lng、同步任务重复运行、Dcat 操作员权限不足。
- 影响页面：Dcat 能力库同步页或按钮、运营推荐审计、未来搜索/推荐 API。
- 状态：rejected（当前阶段暂停；重新启用时另开新 R）
- 关联合同：`db/postgres-clean-rewrite.md`、`db/schema-plan.md`
- 关联代码：待实现；建议后端新增 Artisan command / queued job / Dcat RowAction 或页面工具按钮。

---

## R-20260428-028 能力库 6 小时自动同步调度

- 来源角色：产品 / Backend / 运维
- 背景：能力库允许最终一致；早期不引入 CDC，默认每 6 小时从 MySQL 抽取变化数据 upsert 到 PostgreSQL 能力读模型。
- 需要的接口：Laravel Scheduler / queue job；同步运行日志查询可与 R-027 共用。
- 请求字段草案：无 HTTP 用户入参；调度参数 `intervalHours=6`、`scope=all`、`lockTtl`、`updatedSince`。
- 响应字段草案：同步日志记录同 R-027。
- 失败场景：上一轮未完成、锁超时、部分 scope 失败、PostgreSQL 写入冲突、embedding 生成限流。
- 影响页面：Dcat 同步状态、运维日志、推荐/搜索能力。
- 状态：rejected（当前阶段暂停；重新启用时另开新 R）
- 关联合同：`db/postgres-clean-rewrite.md`
- 关联代码：待实现；建议 `app/Console/Kernel.php` 或 Laravel 11 schedule bootstrap、`CapabilityReadModelSyncService`。

---

## R-20260428-029 AI 语义搜索能力库

- 来源角色：产品 / Backend API / 用户端
- 背景：搜索和推荐需要理解用户自然语言、服务文本、商家介绍和公开评价；PostgreSQL 能力库使用 pgvector 承载 embedding，不替代 MySQL 交易事实。
- 需要的接口：后续可新增 `GET /api/v1/search` 或推荐 API；当前先实现内部 embedding 同步和索引表。
- 请求字段草案：搜索接口待定；内部同步输入来自 MySQL 的 StandardService、RequirementTemplate、MerchantCapability、商家资料、公开评价和帮助内容。
- 响应字段草案：搜索结果需返回 `standardServiceCode`、`merchantId`、`score`、`reason`、`matchedTextSummary`，不得暴露 embedding 原始向量。
- 失败场景：embedding 缺失、语言不支持、向量服务限流、PostgreSQL pgvector 扩展不可用。
- 影响页面：首页搜索、标准服务发现、推荐候选解释、运营调试。
- 状态：rejected（当前阶段暂停；重新启用时另开新 R）
- 关联合同：`db/postgres-clean-rewrite.md`、`db/schema-plan.md`
- 关联代码：待实现；建议 `search_embeddings`、embedding provider adapter、PostgreSQL pgvector 查询服务。

---

## 当前阶段：MySQL/API/BFF 支撑缺口

## R-20260428-030 当前用户端无支撑 BFF 清理或补合同

- 来源角色：用户端 / Backend API / 审计
- 背景：当前阶段审计发现用户端存在 BFF 调用后端未注册路径。按 API 固定闸门，这些入口不能被视为已完成；2026-05-07 已选择补后端实现。
- 需要的接口：`GET /api/v1/merchants/featured`、`GET /api/v1/location/resolve`、`GET/POST /api/v1/me/verification`、`GET/POST /api/v1/me/location`。
- 请求字段：
  - `GET /merchants/featured`：query 可选 `limit`、`lat`、`lng`、`locale`。
  - `GET /location/resolve`：query 必填 `lat`、`lng`，可选 `locale`；用于把浏览器定位坐标解析成用户可读位置。
  - `GET /me/verification`、`GET /me/location`：无业务入参，用户 JWT。
  - `POST /me/verification`：`realName`、`idNumber`、`documentFrontUrl`，可选 `documentBackUrl`、`selfieUrl`。
  - `POST /me/location`：`address`，可选 `lat`、`lng`、`placeId`、`label`、`contactPhone`、`doorplateImageUrl`、`isDefault`。
- 响应字段：
  - featured merchants：`id`、`name`、`intro`、`rating`、`orderCount`、`onlineStatus`、`areas`、`serviceTypes`、`distanceKm`、`responseMinutes`、`imageUrl`、`featuredServiceTitle`。
  - location resolve：`label`、`city`、`district`、`lat`、`lng`、`source`。
  - user verification：`applicationNo`、`status`、`realName`、`idNumber`、证件 URL、`reviewNote`、`submittedAt`、`reviewedAt`、`editable`。
  - user location：`location` 和 `address`，含 `id`、`label`、`contactPhone`、`address`、`lat`、`lng`、`placeId`、`doorplateImageUrl`、`isDefault`、`updatedAt`。
- 失败场景：401 用户未登录；422 入参不完整或已有实名审核中；推荐商家无可展示数据时返回空数组，不使用 mock。
- 影响页面：首页定位、首页推荐商家；用户端资料/位置相关潜在入口。
- 状态：implemented
- 关联合同：`PROJECT_RULES.md` 第 4 节 API 固定闸门；`reports/database-clean-rewrite-audit.md`
- 关联代码：`ep/src/app/api/merchants/featured/route.ts`、`ep/src/app/api/location/resolve/route.ts`、`ep/src/app/api/me/verification/route.ts`、`ep/src/app/api/me/location/route.ts`、`epbkend/expatth-backend/routes/api.php`、`MerchantDiscoveryController`、`LocationResolveController`、`UserVerificationController`、`UserLocationController`

---

## R-20260428-031 商家偏好语言 BFF 上游路径修正

- 来源角色：商家端 / Backend API / 审计
- 背景：审计发现商家端 `POST /api/merchant/preferences/locale` BFF 曾请求用户端 `POST /api/v1/me/locale`。当前已改为商家域 `POST /api/v1/merchant/preferences/locale`，避免把商家会话打到用户鉴权域。
- 需要的接口：保持商家端 BFF `POST /api/merchant/preferences/locale`，上游改为 `POST /api/v1/merchant/preferences/locale`。
- 请求字段草案：`locale`，值为 `zh` / `en` / `th`。
- 响应字段草案：`success`、`preferredLocale`。
- 失败场景：401 商家未登录；422 locale 非法；后端保存失败。
- 影响页面：商家端个人设置语言切换。
- 状态：implemented
- 关联合同：`api/merchant-api.md` §1、`api/registry.md` `/api/v1/merchant/*`
- 关联代码：`epmerchant/src/app/api/merchant/preferences/locale/route.ts`、`epbkend/expatth-backend/routes/api.php`、`MerchantPortalController@updateLocale`

---

## R-20260428-032 商家订单响应与 P2/P3 履约/结算/信用摘要对齐

- 来源角色：商家端 / Backend API / 审计
- 背景：`api/registry.md` 已写 `GET /api/v1/merchant/orders` 追加返回 `pricing`、`fulfillmentEvents`、`settlement`、`creditImpact`。当前已由 `MerchantOrderService` 补齐列表项和动作响应：`workflowStatus` 返回 shared 目标态，`legacyWorkflowStatus` 保留数据库旧值，履约事件、结算摘要、信用影响、商家评价客户入口均由后端输出。
- 需要的接口：扩展 `GET /api/v1/merchant/orders`；必要时同步动作响应 `POST /api/v1/merchant/orders/{orderNo}/start-service`、`finish-service`、`cancel`。
- 请求字段草案：沿用现有分页和 status query。
- 响应字段草案：列表项稳定包含目标 `workflowStatus`、可选 `legacyWorkflowStatus`、`pricing`、`fulfillmentEvents[]`、`settlement`、`creditImpact`、`canReviewCustomer` / `merchantReview`。
- 失败场景：字段缺失导致商家端无法展示履约流水、结算状态、信用影响或错误判断下一步动作。
- 影响页面：商家订单列表、履约动作、客户评价入口、商家钱包/结算解释。
- 状态：implemented
- 关联合同：`api/merchant-api.md` §6、`docs/state-machine.md`、`api/registry.md`
- 关联代码：`MerchantOrderService::listOrders`、`MerchantOrderService::transitionMerchantOrderToState`、`OrderWorkflowStatusPresenter`、`FulfillmentEventService`、`PaymentSettlementService`、`epmerchant/src/app/[locale]/merchant/orders/*`

---

## R-20260428-033 商家能力配置的 StandardService 选择来源

- 来源角色：商家端 / 产品 / Backend API
- 背景：商家能力 `POST /api/v1/merchant/capabilities` 已要求 `standardServiceCode`，后端也校验标准服务存在；此前商家端能力页面让商家手填 code，没有从平台标准服务配置读取可选项。当前已通过商家 BFF 复用公共 `GET /api/v1/standard-services`，能力表单改为标准服务下拉选择。
- 需要的接口：商家端能力页面应读取平台标准服务列表；可复用公共 `GET /api/v1/standard-services`，或新增商家端只读 BFF/路径但必须登记合同。
- 请求字段草案：`locale`、可选 `categoryCode`、`onlyActive=true`。
- 响应字段草案：`standardServiceCode`、`name`、`description`、`categoryCode`、`imageUrl`。
- 失败场景：商家手填错误 code、启用无效能力、后端 422 频发、推荐链路没有可用 MerchantCapability。
- 影响页面：商家能力配置、候选匹配、P2 推荐链路。
- 状态：implemented
- 关联合同：`api/merchant-api.md` §2、`api/user-api.md` §1、`docs/boundaries.md`
- 关联代码：`epmerchant/src/app/api/merchant/standard-services/route.ts`、`MerchantCapabilityManager.tsx`、`MerchantCapabilityForm.tsx`、`MerchantCapabilityService`

---

## R-20260428-034 商家资料字段与位置采集补齐

- 来源角色：商家端 / Backend API / 推荐匹配审计
- 背景：当前 `POST /api/v1/merchant/profile` 只维护商家名称、联系电话、简介、在线状态和服务类型。数据库 `yipai_merchants` 已有 `lat`、`lng`、`areas`、`service_radius_meters`、`ready_status` 等字段，推荐服务也会用商家经纬度计算距离；但商家端资料页没有采集地址、经纬度、服务半径、服务区域，后端资料 API 也不更新这些字段。结果是匹配可生成候选，但距离可能为 `null`，服务范围校验也可能被跳过。
- 需要的接口：扩展 `GET/POST /api/v1/merchant/profile` 或拆出 `GET/PUT /api/v1/merchant/location`，由后端保存商家营业/出发位置、经纬度、服务区域与默认服务半径。
- 请求字段草案：`baseAddress`、`lat`、`lng`、`serviceRadiusMeters`、`areas[]`、可选 `placeId`。
- 响应字段草案：`location` 对象，包含 `baseAddress`、`lat`、`lng`、`serviceRadiusMeters`、`areas`、`locationVerified`、`updatedAt`。
- 失败场景：缺少经纬度、经纬度越界、地址解析失败、服务半径非法、商家未通过实名审核时不允许启用接单。
- 影响页面：商家资料、商家能力配置、推荐候选、距离排序、上门服务调度。
- 状态：implemented
- 关联合同：`docs/boundaries.md`、`docs/state-machine.md`、`db/schema-plan.md`
- 关联代码：`MerchantProfileService`、`UpdateMerchantProfileRequest`、`2026_05_07_090000_add_location_fields_to_yipai_merchants.php`、`epmerchant/src/app/[locale]/merchant/profile/info/page.tsx`

---

## R-20260428-035 商家实名提交流程与资料维护解耦

- 来源角色：商家端 / Backend API / 审核流程审计
- 背景：审计发现 `MerchantProfileService::updateProfile` 曾在每次保存资料时调用实名 pending upsert；缺字段时会把已有 pending 实名材料写成 `null`，没有 pending 时会创建空实名申请，并且会把非 pending 商家状态改回 `pending`。这会让普通资料保存影响实名审核，且缺少必填校验和审核状态保护。
- 需要的接口：保留 `POST /api/v1/merchant/profile` 只做资料维护；`POST /api/v1/merchant/verification` 作为唯一实名提交入口，并使用 FormRequest 做必填、格式、附件完整性和可编辑状态校验。
- 请求字段草案：`ownerName`、`idNumber`、`businessLicenseUrl`、`documentFrontUrl`、`documentBackUrl`、`selfieUrl`。
- 响应字段草案：`status`、`applicationNo`、`submittedAt`、`editable`、`reviewNote`。
- 失败场景：资料不完整、pending 审核中重复提交、approved 后无权限覆盖、rejected 后补交必须保留历史审核记录。
- 影响页面：商家资料页、实名页、Dcat 审核后台、商家接单准入。
- 状态：implemented
- 关联合同：`api/merchant-api.md`、`docs/boundaries.md`
- 关联代码：`MerchantProfileService::updateProfile`、`MerchantVerificationService::submitVerification`、`SubmitMerchantVerificationRequest`、`MerchantPortalController@submitVerification`、`epmerchant/src/app/[locale]/merchant/profile/verification/page.tsx`

---

## R-20260428-036 商家履约状态机失败、退回与目标态补齐

- 来源角色：商家端 / Backend API / 状态机审计
- 背景：商家端当前可通过后端推进 `merchant_confirmed`、`in_service`、`merchant_completed`、`cancelled`，并由 `OrderWorkflowService` 校验转移。当前已新增商家异常动作入口，支持迟到、未履约、改约、争议和售后退回履约中；`after_sales` 已进入 transition map，并由后端写履约事件和信用事件。
- 需要的接口：新增 `POST /api/v1/merchant/orders/{orderNo}/failure-action`，由商家触发 `report_late`、`report_no_show`、`request_reschedule`、`dispute_opened`、`return_to_in_service`。
- 请求字段草案：`action`、`reasonCode`、`reasonText`、`evidence[]`、`proposedServiceTime`。
- 响应字段草案：目标 `workflowStatus`、`legacyWorkflowStatus`、`allowedNextActions[]`、`failureEvent`、`creditImpact`、`customerVisibleMessage`。
- 失败场景：非法状态转移、重复动作、商家无订单所有权、未付款开始服务、争议中继续结算、失败事件未写信用。
- 影响页面：商家订单、客户订单、履约事件、信用分、结算。
- 状态：implemented
- 关联合同：`docs/state-machine.md`、`api/merchant-api.md`、`api/user-api.md`
- 关联代码：`OrderWorkflowService`、`MerchantOrderFailureActionService`、`MerchantPortalController@failureAction`、`MerchantOrderFailureActionRequest`、`FulfillmentEventService`

---

## R-20260428-037 商家端后端错误响应标准化

- 来源角色：商家端 / Backend API / 开发标准审计
- 背景：后端已有 `ApiResponse` 结构，但商家域仍大量由 Service 抛出英文 `HttpException`，Controller 多处直接使用 `$request->all()`，缺少 FormRequest 和稳定业务错误码。当前已补商家订单动作、异常动作、可用性、语言偏好的 FormRequest；新增 `ApiProblem`，商家域异常不再返回 debug 文件行号，结构化返回 `code/errors/nextAction`。
- 需要的接口：商家域 API 统一返回 `code`、`message`、`errors[]`、`requestId`、`timestamp`，并补充业务错误码表；Controller 使用 FormRequest，Service 抛领域异常或返回标准错误对象。
- 请求字段草案：无新增业务字段。
- 响应字段草案：错误响应稳定包含数字 `code`、可翻译 `message`、字段级 `errors[]`，可选 `nextAction`。
- 失败场景：前端收到 raw English、无法定位字段错误、debug 泄露内部路径、不同接口错误结构不一致。
- 影响页面：商家登录、资料、实名、能力、订单、钱包、评价。
- 状态：implemented
- 关联合同：`api/merchant-api.md`、`PROJECT_RULES.md` 第 2 节
- 关联代码：`ApiProblem`、`bootstrap/app.php`、`MerchantPortalController`、`MerchantOrderActionRequest`、`MerchantOrderFailureActionRequest`、`UpdateMerchantAvailabilityRequest`、`UpdateMerchantLocaleRequest`

---

## 维护

- 新需求：**追加**新 `R-` 号（**`R-20260428-020` 起**）。  
- 实现后：同一请求条**状态**改为 `implemented` 并填**关联代码**；**registry** 增一行。  
- 拒绝：`rejected` + 理由。

---

## P1b/P2/P3 状态总览（005–026，便于检索）

| R-     | 简述                         | 状态         |
|--------|------------------------------|--------------|
| 005    | 标准服务列表+详情            | **implemented** |
| 006    | requirement-template         | **implemented** |
| 007    | quote-preview                | **implemented** |
| 008    | POST orders 新主链            | **implemented** |
| 009    | confirm-merchant-quote       | **implemented** |
| 010    | 旧/新 workflow 映射           | **implemented** |
| 011    | after-sales                  | **implemented**（子枚举可后续细化） |
| 012    | GET 订单新主链扩展块         | **implemented** |
| 013    | merchant capabilities        | **implemented** |
| 014    | order-requests + MQC submit  | **implemented** |
| 015    | credit-profile               | **implemented** |
| 016    | availability 演进            | **accepted** |
| 017    | GET quote-preview 旁路/幂等   | **draft**    |
| 018    | ep BFF 对齐 standard…        | **implemented** |
| 019    | 路由与 query 迁移            | **implemented** |
| 020    | 动态推荐与匹配快照           | **implemented** |
| 021    | 可用性、容量与就绪状态       | **implemented** |
| 022    | WorkflowDefinition 与策略注册 | **implemented** |
| 023    | 平台代管、平台 1% 收益与结算 | **implemented** |
| 024    | 履约事件、异常惩罚与信用更新 | **implemented** |
| 025    | 双向互评与广场脱敏分发       | **implemented** |
| 026    | 订单服务身份与展示名标准化   | **implemented** |
| 027    | PostgreSQL 能力读模型同步    | **rejected**（暂停） |
| 028    | 能力库 6 小时自动同步调度    | **rejected**（暂停） |
| 029    | AI 语义搜索能力库            | **rejected**（暂停） |
| 030    | 当前用户端无支撑 BFF 清理或补合同 | **implemented** |
| 031    | 商家偏好语言 BFF 上游路径修正 | **implemented** |
| 032    | 商家订单响应与 P2/P3 摘要对齐 | **implemented** |
| 033    | 商家能力 StandardService 选择来源 | **implemented** |
| 034    | 商家资料字段与位置采集补齐 | **implemented** |
| 035    | 商家实名提交流程与资料维护解耦 | **implemented** |
| 036    | 商家履约失败、退回与目标态补齐 | **implemented** |
| 037    | 商家端后端错误响应标准化 | **implemented** |
