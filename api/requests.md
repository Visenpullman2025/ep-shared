# API 需求池（唯一入口）

最后更新：2026-05-05（P1 最小交易闭环已实现）

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

- **已实现**：R-009、R-011、R-012、R-013、R-014、R-015、R-019。
- **已完成并作为依赖**：R-005、R-006、R-007、R-008、R-010、R-018。
- **不纳入本轮必须完成**：R-004（商户评价客户，仍 draft）、R-016（availability capacity/timeSlots，仍 proposed）、R-017（GET quote-preview 旁路，仍 draft）。这些不得被前端伪装为已完成。
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
- 状态：draft
- 关联合同：merchant-api
- 关联代码：未接路由（以实际 PR 为准）

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
- 响应字段草案：`orderNo`、`workflowStatus`、`nextAction`、**`finalAmount`/`userPayable`**、**`confirmedServiceTime`**、`paymentRequired`。
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
- 状态：**proposed**（合同方向已写 `merchant-api` §3；**字段**未死锁）
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

## 维护

- 新需求：**追加**新 `R-` 号（**`R-20260428-020` 起**）。  
- 实现后：同一请求条**状态**改为 `implemented` 并填**关联代码**；**registry** 增一行。  
- 拒绝：`rejected` + 理由。

---

## P1b 状态总览（005–019，便于检索）

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
| 016    | availability 演进            | **proposed** |
| 017    | GET quote-preview 旁路/幂等   | **draft**    |
| 018    | ep BFF 对齐 standard…        | **implemented** |
| 019    | 路由与 query 迁移            | **implemented** |
