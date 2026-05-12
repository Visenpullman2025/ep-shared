# 已实现 API 目录（联调真实）

最后更新：2026-05-05（P2/P3 交易、履约与信用切片）

> 仅登记**已**在**现网后端**注册、或**本文件明确**的接口状态。与 **[requests.md](requests.md)** 中**未实现**项**不得**标为 `implemented`。  
> **图例（状态）**  
> - **implemented** — 路由在现网、用于联调。  
> - **compatibility** — 现网有路由；**不**作新**用户**主入口/终局，见 `docs/boundaries.md`。  
> - **target / planned**（合称 **planned**）— **合同已锁**、**P1 计划** 实现；**当前**不可联调。  

**新主链：P1 已接路由**（分条见下「StandardService / P1a」与「P1 交易闭环」；部署须 `migrate` + `StandardServiceP1aSeeder` 或等价数据迁移）：

- **P1a 已实现**（`expatth-backend` `routes/api.php`）：`GET/GET/GET/POST` **`/api/v1/standard-services*`**。  
- **P1 已实现**：`POST /api/v1/orders/{orderNo}/confirm-merchant-quote`、`POST /api/v1/orders/{orderNo}/after-sales`、`/api/v1/merchant/capabilities*`、`/merchant/order-requests*`、`/merchant/.../quote-confirmation`、`/merchant/credit-profile`；`POST /api/v1/orders` 已按 `MerchantCapability` 生成候选。
- **P2/P3 已实现切片**：动态候选匹配快照、能力就绪/容量/时段字段、支付冻结摘要、履约事件、商家信用事件、商家评价客户、评价可选广场分发；真实 DB migrate 与端到端浏览器联调仍需在本地 DB 启动后执行。

**compatibility 小结**：**`/api/v1/services*`** 与 **`/api/v1/merchant/services*`** 在分条中均标为 **compatibility**（**非**新主链终局入口）。**旧** 粗报 **`POST /services/{id}/price-preview`** 仍为 **compatibility**；**新** 粗报以 **`POST /standard-services/{code}/quote-preview`** 为准（P1a）。

---

## StandardService / P1a（`implemented`）

以下 **2026-04-28** 起在 `expatth-backend` 注册；数据依赖 **`yipai_standard_services` / `yipai_requirement_templates` / `yipai_quote_previews`** 与 **seeder**。

## GET /api/v1/standard-services

- 状态：implemented
- 调用方：用户端、访客
- 权限：无 JWT（`api.auth.optional`）
- 请求：query 可选 `categoryCode`
- 响应：`data[]` 含 `standardServiceCode`、`name`、`description`、`imageUrl`、`categoryCode`、`sortOrder`（**user-api** §1.1）
- 错误码：见 error-codes.md
- 实现位置：`App\Http\Controllers\Api\V1\StandardServiceController@index`
- 前端使用位置：标准服务入口列表

## GET /api/v1/standard-services/{code}

- 状态：implemented
- 调用方：用户端、访客
- 权限：无 JWT
- 请求：路径 `code`（`standard_service_code`；兼容数字 `id`）
- 响应：单条 StandardService，另含 `requirementTemplateVersion`（**user-api** §1.2）
- 错误码：404 无数据或**未**激活
- 实现位置：`StandardServiceController@show`
- 前端使用位置：标准服务详情

## GET /api/v1/standard-services/{code}/requirement-template

- 状态：implemented
- 调用方：用户端、访客
- 权限：无 JWT
- 响应：`standardServiceCode`、`templateVersion`、`formSchema`
- 错误码：404 无标准/无**已发布**模板
- 实现位置：`StandardServiceController@requirementTemplate`
- 前端使用位置：需求采集表单

## POST /api/v1/standard-services/{code}/quote-preview

- 状态：implemented
- 调用方：用户端、访客
- 权限：无 JWT（**可选**登录时写 `yipai_quote_previews.user_id`）
- 请求：JSON `requirementPayload`（**必填** 非空对象），可选 `serviceAddress`、`budget`
- 响应：`quotePreviewId`、`standardServiceCode`、`estimatedAmount`、`pricingBreakdown`、`currency`、`expiresAt`、`warnings`
- 错误码：404 标准服务；422 体非法/无发布模板/计价失败（**error-codes** `EX_*` 见 requests）
- 实现位置：`StandardServiceController@quotePreview`；`App\Services\Common\StandardServicePreviewService`；`yipai_quote_previews` 表
- 前端使用位置：粗报价
- 备注：计价**复用** 同类目 **`YipaiServiceProcessTemplate`** 的 **`pricing_schema`** 与 `ServiceProcessPricingService`

---

## GET /api/v1/dictionaries

- 状态：implemented
- 调用方：用户端、访客
- 权限：无 JWT
- 请求：按实现
- 响应：按实现
- 错误码：见 error-codes.md
- 实现位置：`expatth-backend` `DictionaryController@index`
- 前端使用位置：用户端

---

## GET /api/v1/categories

- 状态：implemented
- 调用方：用户端、访客
- 权限：无 JWT
- 请求：按实现
- 响应：按实现
- 错误码：见 error-codes.md
- 实现位置：`CategoryController@index`
- 前端使用位置：用户端目录/首页

---

## GET /api/v1/services

- 状态：compatibility（**非**新流程主入口；旧「商家上架列表」视角）
- 调用方：用户端、访客
- 权限：无 JWT
- 请求：查询参数以实现为准
- 响应：服务列表
- 错误码：见 error-codes.md
- 实现位置：`ServiceController@index`
- 前端使用位置：现网选服务；**迁移后**由 StandardService 列表替代

---

## GET /api/v1/services/{id}

- 状态：compatibility
- 调用方：用户端、访客
- 权限：无 JWT
- 请求：路径 `id`
- 响应：单条商家服务配置详情（含可附 `bookableDaysUrl` 等）
- 错误码：404
- 实现位置：`ServiceController@show`
- 前端使用位置：服务详情

---

## GET /api/v1/services/{id}/create-data

- 状态：compatibility（模板字段；与 **RequirementTemplate** 语义衔接）
- 调用方：用户端
- 权限：无 JWT
- 请求：路径 `id`（现网为商家 `service` 主键）
- 响应：`formSchema` 等
- 错误码：见实现
- 实现位置：`ServiceProcessTemplateController@serviceCreateData`
- 前端使用位置：下单表单

---

## GET /api/v1/services/{id}/summary

- 状态：compatibility
- 调用方：用户端
- 权限：无 JWT
- 请求：路径 `id`
- 响应：摘要步骤等
- 实现位置：`ServiceProcessTemplateController@serviceSummary`
- 前端使用位置：流程展示

---

## GET /api/v1/services/{id}/bookable-days

- 状态：implemented
- 调用方：用户端
- 权限：无 JWT
- 请求：`from`、`to` 等
- 响应：可约日历
- 实现位置：`ServiceController@bookableDays`
- 前端使用位置：选日

---

## POST /api/v1/services/{id}/price-preview

- 状态：compatibility（粗报价；目标语义为 **QuotePreview** 的一条实现路径）
- 调用方：用户端
- 权限：无 JWT
- 请求：`processData`、地址等
- 响应：计价结果
- 实现位置：`ServiceProcessTemplateController@servicePricePreview`
- 前端使用位置：下单前询价

---

## GET /api/v1/maps/config

- 状态：implemented
- 调用方：用户端（需已登录时仍可无 JWT 依实现）
- 权限：按实现
- 请求：无
- 响应：地图 Key 等
- 实现位置：`MapController@config`
- 前端使用位置：地址/地图

---

## GET /api/v1/square 与 /feed 与 /posts

- 状态：implemented
- 调用方：用户端
- 权限：无 JWT（读）
- 请求：分页等
- 响应：广场列表
- 实现位置：`SquareController@index`
- 前端使用位置：广场

---

## GET /api/v1/square/posts/{postId}/comments

- 状态：implemented
- 调用方：用户端
- 权限：无 JWT
- 实现位置：`SquareController@comments`
- 前端使用位置：评论列表

---

## GET /api/v1/reviews/merchants/{merchantId}

- 状态：implemented
- 调用方：用户端
- 权限：无 JWT
- 实现位置：`ReviewController@merchant`
- 前端使用位置：商户评价列表

---

## POST /api/v1/payments/callback

- 状态：implemented
- 调用方：支付渠道
- 权限：渠道验签
- 实现位置：`PaymentController@callback`
- 前端使用位置：N/A

---

## POST /api/v1/auth/register 与 /login 等

- 状态：implemented
- 调用方：用户端
- 权限：无
- 实现位置：`AuthController`
- 前端使用位置：登录注册

---

## GET /api/v1/auth/me

- 状态：implemented
- 调用方：用户端
- 权限：用户 JWT
- 实现位置：`AuthController@me`
- 前端使用位置：个人态

---

## GET/POST/PUT/DELETE /api/v1/me/addresses

- 状态：implemented
- 调用方：用户端
- 权限：用户 JWT，地址必须属于当前用户
- 请求：`GET /me/addresses` 返回地址簿；`POST /me/addresses` 新增；`PUT /me/addresses/{addressId}` 更新；`DELETE /me/addresses/{addressId}` 删除；`POST /me/addresses/{addressId}/default` 设为默认地址
- 响应：地址字段使用 `id`、`label`、`contactPhone`、`address`、`lat`、`lng`、`doorplateImageUrl`、`isDefault`；删除默认地址时后端返回 `nextDefaultAddress`
- 实现位置：`MeProfileController`
- 前端使用位置：用户端资料页、下单前地址门禁

---

## GET /api/v1/me/messages

- 状态：implemented
- 调用方：用户端
- 权限：用户 JWT
- 请求：query `page`、`pageSize`、可选 `unreadOnly`
- 响应：`list`、`total`、`page`、`pageSize`
- 实现位置：`MeCenterController@messages`
- 前端使用位置：用户端消息页、`ep` BFF `src/app/api/me/messages/route.ts`

---

## POST /api/v1/orders

- 状态：implemented（兼容旧 `serviceId`；P1b 已支持 `standardServiceCode` + `quotePreviewId`）
- 调用方：用户端
- 权限：用户 JWT
- 请求：新主链为 `standardServiceCode`、`quotePreviewId`、`requirementPayload`、`serviceAddress`；旧兼容仍含 `serviceId`、`processData`、`quotedAmount`
- 响应：`orderNo`、目标 `workflowStatus`、`legacyWorkflowStatus`、`nextAction`、`standardServiceCode`、`quotePreviewId`、`pricing`
- 实现位置：`OrderController@store` / `OrderFlowService` / `StandardServiceOrderPayloadResolver`
- 前端使用位置：标准服务报价页创建订单、旧下单兼容页
- 联调证据：2026-05-05 本地 `POST /api/v1/orders` 用 `quotePreviewId=9` 创建 `ord-1004`；`ep` BFF `POST /api/orders` 用 `quotePreviewId=10` 创建 `ord-1005`，均返回 `workflowStatus=waiting_merchant_confirmation`、`legacyWorkflowStatus=pending_merchant_confirm`、`nextAction=wait_merchant_confirmation`。

---

## P1 交易闭环（`implemented`）

以下 **2026-05-05** 起在 `expatth-backend` 注册；数据依赖 **`yipai_merchant_capabilities` / `yipai_merchant_candidates` / `yipai_merchant_quote_confirmations` / `yipai_after_sales_cases` / `yipai_merchant_credit_profiles` / `yipai_merchant_credit_events`**。

## POST /api/v1/orders/{orderNo}/confirm-merchant-quote

- 状态：implemented
- 调用方：用户端
- 权限：用户 JWT，订单必须属于当前用户
- 请求：`merchantQuoteConfirmationId`
- 响应：`orderNo`、`workflowStatus=waiting_payment_or_authorization`、`legacyWorkflowStatus=pending_payment`、`nextAction=pay`、`finalAmount`、`platformFee`、`taxFee`、`userPayable`、`confirmedServiceTime`、`paymentRequired`
- 实现位置：`MeCenterController@confirmMerchantQuote`、`OrderP1Service@confirmMerchantQuote`
- 前端使用位置：`ep` 订单详情/订单中心 P1 新主链块

## POST /api/v1/orders/{orderNo}/after-sales

- 状态：implemented
- 调用方：用户端
- 权限：用户 JWT，订单必须属于当前用户且状态允许
- 请求：`caseType`、`description`、`evidence[]`
- 响应：`caseId`、`status`、`workflowStatus=after_sales`、`legacyWorkflowStatus=after_sales`、`nextAction=view_after_sales`
- 实现位置：`MeCenterController@createAfterSalesCase`、`OrderP1Service@createAfterSalesCase`
- 前端使用位置：`ep` 订单详情/订单中心售后表单

## GET /api/v1/merchant/capabilities

- 状态：implemented
- 调用方：商家端
- 权限：商家 JWT
- 请求：分页参数可选
- 响应：`list[]`、`total`、`page`、`pageSize`
- 实现位置：`MerchantPortalController@capabilities`、`MerchantCapabilityService`
- 前端使用位置：`epmerchant` 能力管理页

## POST /api/v1/merchant/capabilities

- 状态：implemented
- 调用方：商家端
- 权限：商家 JWT
- 请求：`standardServiceCode`、`enabled`、`serviceArea`、`basePricingRule`、`extraDistanceRule`、`capacityRule`、`openDates`
- 响应：`capabilityId`、`standardServiceCode`、`enabled`、`status`、`reviewState`
- 实现位置：`MerchantPortalController@createCapability`、`MerchantCapabilityService`
- 前端使用位置：`epmerchant` 能力管理页

## GET /api/v1/merchant/capabilities/{id}

- 状态：implemented
- 调用方：商家端
- 权限：商家 JWT，能力必须属于当前商家
- 响应：单条 MerchantCapability
- 实现位置：`MerchantPortalController@capabilityDetail`、`MerchantCapabilityService`

## PUT /api/v1/merchant/capabilities/{id}

- 状态：implemented
- 调用方：商家端
- 权限：商家 JWT，能力必须属于当前商家
- 请求：同创建能力，字段可部分更新
- 响应：更新后的 MerchantCapability
- 实现位置：`MerchantPortalController@updateCapability`、`MerchantCapabilityService`
- 前端使用位置：`epmerchant` 能力管理页

## GET /api/v1/merchant/order-requests

- 状态：implemented
- 调用方：商家端
- 权限：商家 JWT
- 请求：分页参数可选
- 响应：候选任务 `list[]`，包含 `candidateId`、`orderNo`、`standardServiceCode`、`requirementSummary`、`quotePreview`、`serviceAddress`、`requestedAppointment`、`expiresAt`、`status`
- 实现位置：`MerchantPortalController@orderRequests`、`MerchantOrderRequestService`
- 前端使用位置：`epmerchant` 商家待办页

## POST /api/v1/merchant/order-requests/{candidateId}/quote-confirmation

- 状态：implemented
- 调用方：商家端
- 权限：商家 JWT，候选必须属于当前商家
- 请求：`finalAmount`、`confirmedServiceTime`、可选 `merchantNote`、`validUntil`
- 响应：`merchantQuoteConfirmationId`、`candidateId`、`orderNo`、`status=submitted`、`workflowStatus=waiting_user_confirmation`、`nextAction=confirm_merchant_quote`
- 实现位置：`MerchantPortalController@submitQuoteConfirmation`、`MerchantOrderRequestService`
- 前端使用位置：`epmerchant` 商家待办页

## GET /api/v1/merchant/credit-profile

- 状态：implemented
- 调用方：商家端
- 权限：商家 JWT
- 响应：`score`、`level`、`badges`、`lastUpdatedAt`、`events[]`
- 实现位置：`MerchantPortalController@creditProfile`、`MerchantCreditProfileService`
- 前端使用位置：`epmerchant` 信用档案页

---

## GET /api/v1/orders 与 /{orderNo} 与 子路径

- 状态：implemented（P1 已追加新主链扩展块）
- 调用方：用户端
- 权限：用户 JWT
- 请求：路径 `orderNo`
- 主要接口：`GET /orders`、`GET /orders/{orderNo}`、`POST /orders/{orderNo}/cancel`、`hide-from-list`、`confirm-completion`、`GET /orders/{orderNo}/my-review`
- 实现位置：`MeCenterController`、`OrderMainChainPresenter` 等
- 前端使用位置：订单中心

---

## POST /api/v1/payments/intent

- 状态：implemented
- 调用方：用户端
- 权限：用户 JWT
- 请求：`orderNo`、`method`，可选 `mode=pay|pre_authorize`
- 响应：`paymentNo`、`amount`、`status`、`paymentStatus`、`holdStatus`、`platformFeePercent`、`platformFee`、`taxFee`、`merchantSettlement`、`userPayable`
- 实现位置：`PaymentController@intent`
- 前端使用位置：去支付

---

## POST /api/v1/reviews

- 状态：implemented
- 调用方：用户端
- 权限：用户 JWT
- 请求：`orderNo`、`rating|score`、`content`、`imageUrls`，可选 `publishToSquare` / `shareToSquare`、`squarePublishAnonymous`
- 响应：`id`、`score`、`rating`、`squarePostId`、`squarePublishStatus`
- 实现位置：`ReviewController@store`、`ReviewService@create`
- 前端使用位置：评价

## GET /api/v1/merchants/featured

- 状态：implemented
- 调用方：用户端
- 权限：公开接口，可带可选用户 token
- 请求：query 可选 `limit`、`lat`、`lng`、`locale`
- 响应：商家数组；每项含 `id`、`name`、`intro`、`rating`、`orderCount`、`onlineStatus`、`areas`、`serviceTypes`、`distanceKm`、`responseMinutes`、`imageUrl`、`featuredServiceTitle`
- 实现位置：`MerchantDiscoveryController@featured`、`MerchantDiscoveryService`
- 前端使用位置：首页推荐商家 BFF `ep/src/app/api/merchants/featured/route.ts`

## GET /api/v1/location/resolve

- 状态：implemented
- 调用方：用户端
- 权限：公开接口，可带可选用户 token
- 请求：query 必填 `lat`、`lng`，可选 `locale`
- 响应：`label`、`city`、`district`、`lat`、`lng`、`source`
- 实现位置：`LocationResolveController@show`、`LocationResolveService`
- 前端使用位置：首页定位 BFF `ep/src/app/api/location/resolve/route.ts`

## GET/POST /api/v1/me/location

- 状态：implemented
- 调用方：用户端
- 权限：用户 JWT
- 请求：GET 无业务入参；POST `address`，可选 `lat`、`lng`、`placeId`、`label`、`contactPhone`、`doorplateImageUrl`、`isDefault`
- 响应：`location` 和 `address`；含 `id`、`label`、`contactPhone`、`address`、`lat`、`lng`、`placeId`、`doorplateImageUrl`、`isDefault`、`updatedAt`
- 实现位置：`UserLocationController`、`UserLocationService`、`yipai_user_addresses`
- 前端使用位置：用户端位置 BFF `ep/src/app/api/me/location/route.ts`

## GET/POST /api/v1/me/verification

- 状态：implemented
- 调用方：用户端
- 权限：用户 JWT
- 请求：GET 无业务入参；POST `realName`、`idNumber`、`documentFrontUrl`，可选 `documentBackUrl`、`selfieUrl`
- 响应：`applicationNo`、`status`、`realName`、`idNumber`、证件 URL、`reviewNote`、`submittedAt`、`reviewedAt`、`editable`
- 实现位置：`UserVerificationController`、`UserVerificationService`、`yipai_user_verifications`
- 前端使用位置：用户端实名 BFF `ep/src/app/api/me/verification/route.ts`

---

## P2/P3 交易、履约与信用最小切片（`implemented`）

以下 **2026-05-05** 起在 `expatth-backend` 注册或作为已实现接口字段返回；这里的 `implemented` 表示接口与最小持久化切片可用，**不表示** `db/schema-plan.md` 的 P2/P3 目标表已经全部落地。

当前持久化粒度：

- 已落地：`yipai_orders` 扩展冻结/平台费/结算摘要字段、`yipai_reviews` 扩展广场发布摘要字段、`yipai_fulfillment_events` 履约事件表，以及既有商户信用事件链路。
- 仍属目标模型方向：`payment_holds`、`settlement_records`、`customer_credit_events`、`square_distribution_jobs`、`workflow_definitions` 等独立表；落地前不得把这些表名当成已迁移事实。

数据依赖 `2026_05_05_150000_add_p2_p3_order_flow_fields.php` 与 `StandardServiceP1aSeeder`。

## POST /api/v1/orders

- 状态：implemented（P2 动态推荐）
- 调用方：用户端
- 权限：用户 JWT
- 追加行为：新主链订单会调用 `MerchantMatchingService`，按能力启用、`readyStatus`、服务区域、容量/档期、信用分、评分、距离生成 `MerchantCandidate`。
- 追加响应/后续 GET：订单详情扩展块含 `matching`、`candidates[].matchScore`、`matchFactors`、`distanceKm`、`availabilityStatus`。
- 实现位置：`OrderFlowService`、`MerchantMatchingService`、`OrderMainChainPresenter`
- 前端使用位置：标准服务报价页、订单中心/详情

## GET/POST/PUT /api/v1/merchant/capabilities*

- 状态：implemented（P2 能力字段扩展）
- 调用方：商家端
- 权限：商家 JWT
- 追加请求/响应：`readyStatus`、`timeSlots`、`blackoutDates`、`matchingPolicyCode`、`workflowPolicyCode`；保留 `serviceArea`、`capacityRule`、`extraDistanceRule`、`openDates`。
- 实现位置：`MerchantCapabilityService`、`YipaiMerchantCapability`
- 前端使用位置：`epmerchant` 能力管理页

## GET/PUT /api/v1/merchant/availability

- 状态：implemented（P2 availability 字段扩展）
- 调用方：商家端
- 权限：商家 JWT
- 追加请求/响应：`readyStatus`、`capacityRule`、`timeSlots`、`blackoutDates`，保留 `openDates`。
- 实现位置：`MerchantOrderService@getAvailability`、`MerchantOrderService@updateAvailability`
- 前端使用位置：商家端可用性/能力配置

## GET /api/v1/orders 与 GET /api/v1/orders/{orderNo}

- 状态：implemented（P2/P3 展示字段扩展）
- 调用方：用户端
- 权限：用户 JWT
- 追加响应：`serviceTitle`、`serviceTitleI18n`、`standardService`、`paymentHold`、`settlement`、`fulfillmentEvents`、候选 `matchScore/matchFactors/distanceKm/availabilityStatus`。
- 实现位置：`OrderMainChainPresenter`、`FulfillmentEventService`
- 前端使用位置：订单中心、订单详情、支付弹层

## GET /api/v1/merchant/orders

- 状态：implemented（P2/P3 展示字段扩展）
- 调用方：商家端
- 权限：商家 JWT
- 追加响应：当前代码稳定返回 `pricing`、开始服务门禁字段、目标 `workflowStatus`、`legacyWorkflowStatus`、`nextAction`、`fulfillmentEvents`、`settlement`、`creditImpact`、`canReviewCustomer` / `merchantReview`；允许 `paymentStatus=authorized` 的订单进入开始服务门禁。
- 实现位置：`MerchantOrderService`
- 前端使用位置：商家订单页

## POST /api/v1/merchant/orders/{orderNo}/start-service 与 finish-service

- 状态：implemented（P3 履约事件）
- 调用方：商家端
- 权限：商家 JWT
- 追加行为：状态推进时写入 `yipai_fulfillment_events`；动作响应返回目标 `workflowStatus`、`legacyWorkflowStatus`、`fulfillmentEvents`、`settlement`、`creditImpact`。
- 实现位置：`OrderWorkflowService`、`FulfillmentEventService`、`MerchantOrderService`
- 前端使用位置：商家订单页

## POST /api/v1/merchant/orders/{orderNo}/failure-action

- 状态：implemented（R-036 商家异常动作）
- 调用方：商家端
- 权限：商家 JWT
- 请求：`action` 为 `report_late`、`report_no_show`、`request_reschedule`、`dispute_opened`、`return_to_in_service`；可选 `reasonCode`、`reasonText`、`evidence[]`、`proposedServiceTime`。
- 响应：`workflowStatus`、`legacyWorkflowStatus`、`failureEvent`、`fulfillmentEvents`、`allowedNextActions`、`nextAction`、`customerVisibleMessage`。
- 实现位置：`MerchantPortalController@failureAction`、`MerchantOrderFailureActionService`、`MerchantOrderFailureActionRequest`
- 前端使用位置：商家订单异常处理入口

## POST /api/v1/orders/{orderNo}/confirm-completion

- 状态：implemented（P3 双方完成与结算）
- 调用方：用户端
- 权限：用户 JWT
- 追加行为：支持已支付或已预授权订单确认完成；完成后触发商家结算、释放 hold、写入履约事件和信用事件。
- 实现位置：`MeCenterController@confirmOrderCompletion`、`OrderWorkflowService`、`PaymentSettlementService`
- 前端使用位置：订单中心

## POST /api/v1/merchant/reviews

- 状态：implemented
- 调用方：商家端
- 权限：商家 JWT，订单必须属于当前商家且已完成
- 请求：`orderNo`、`rating|score`、`content`、可选 `imageUrls`、`publishToSquare`、`squarePublishAnonymous`
- 响应：`reviewId`、`score`、`rating`、`reviewType=merchant_to_customer`、`squarePostId`、`squarePublishStatus`
- 实现位置：`MerchantPortalController@createReview`、`ReviewService@createMerchantReview`
- 前端使用位置：`epmerchant` 商家订单页

---

## 广场需登录的 POST/DELETE

- 状态：implemented
- 路径：`POST /square/posts/{postId}/comments`、`POST/DELETE /square/authors/{authorId}/follow`
- 实现位置：`SquareController`
- 权限：用户 JWT

---

## /api/v1/merchant/*（节选）

- **`GET/POST /merchant/auth/*`**、**`GET/POST /merchant/profile`**、**`POST /merchant/verification`**、**`GET/PUT /availability`**、**`GET/POST/PUT /merchant/services`**、**`GET /merchant/orders` + 订单动作**：状态 **implemented** 或 **compatibility**（**merchant/services* = 商家服务配置，非** StandardService 主入口**）。
- **`GET/POST /merchant/profile`**：profile 已返回并保存 `location`（`baseAddress`、`placeId`、`lat`、`lng`、`serviceRadiusMeters`、`areas[]`、`locationVerified`）；资料保存不触发实名审核。
- **`POST /merchant/verification`**：实名提交与 profile 解耦；必填 `ownerName`、`idNumber`、`businessLicenseUrl`、`documentFrontUrl`、`documentBackUrl`、`selfieUrl`，pending/approved 不允许重复提交。
- **商家端 BFF `POST /api/merchant/preferences/locale`**：上游为 `POST /api/v1/merchant/preferences/locale`。
- **商家端 BFF `GET /api/merchant/standard-services`**：只读代理公共 `GET /api/v1/standard-services`，供 MerchantCapability 表单选择 `standardServiceCode`。
- **compatibility 标注**：`GET/POST/PUT /api/v1/merchant/services` 与 `GET /api/v1/merchant/services/{serviceId}` — 与 **MerchantCapability** 演进衔接；**不是** C 端「选标准品」的终局。
- 实现位置：`MerchantPortalController`、`MerchantAuthController`、`MerchantWalletController` 等（见 `routes/api.php`）。

细节字段与**商户订单动作**以历史 **docs/api-merchant-list.md** 为文字备份；**以后端代码与联调**为准。若与本文冲突，**先**改 **registry** 与 **requests**。

---

## POST /api/v1/auth/refresh

- 状态：implemented
- 调用方：用户端
- 权限：Supabase refresh token
- 请求：`refreshToken`
- 响应：`accessToken`、`refreshToken`、`expiresIn`
- 实现位置：`App\Http\Controllers\Api\V1\AuthController@refresh`、`SupabaseAuthService`
- 前端使用位置：用户端会话续期
- 关联需求：R-20260510-001
- 合同来源：`api/user-api.md`

---

## GET /api/v1/chat/conversations

- 状态：implemented
- 调用方：用户端
- 权限：用户 JWT
- 请求：query 分页可选
- 响应：`list[]`，每条含 `conversationId`、`peer`、`lastMessage`、`unreadCount`、`updatedAt`
- 实现位置：`App\Http\Controllers\Api\V1\ChatController@conversations`
- 前端使用位置：用户端 Chat 入口
- 关联需求：R-20260510-002
- 合同来源：`api/user-api.md`

---

## GET /api/v1/chat/conversations/{conversationId}/messages

- 状态：implemented
- 调用方：用户端
- 权限：用户 JWT，会话必须属于当前用户
- 请求：路径 `conversationId`；query 分页/游标可选
- 响应：`messages[]` 含 `id`、`senderId`、`content`、`createdAt`、`readAt`
- 实现位置：`ChatController@messages`
- 前端使用位置：用户端 Chat 详情
- 关联需求：R-20260510-002

---

## POST /api/v1/chat/conversations/{conversationId}/messages

- 状态：implemented
- 调用方：用户端
- 权限：用户 JWT，会话必须属于当前用户
- 请求：路径 `conversationId`；body `content`，可选附件字段
- 响应：新建消息记录
- 实现位置：`ChatController@sendMessage`
- 前端使用位置：用户端 Chat 详情发送
- 关联需求：R-20260510-002

---

## POST /api/v1/chat/conversations/{conversationId}/read

- 状态：implemented
- 调用方：用户端
- 权限：用户 JWT，会话必须属于当前用户
- 请求：路径 `conversationId`
- 响应：`unreadCount=0` 或最新 `readAt`
- 实现位置：`ChatController@markRead`
- 前端使用位置：用户端 Chat 详情进入时
- 关联需求：R-20260510-002

---

## 维护

- 新接口上线：在本文件**追加**一条，**状态**从 `implemented` 或 `compatibility` 中选一。  
- 下线：改 **deprecated** 并保留一版 `实现位置` 备查。  
- **不**在 registry 中写未讨论的需求；需求一律 **requests.md**。
