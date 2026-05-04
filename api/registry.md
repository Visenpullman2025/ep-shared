# 已实现 API 目录（联调真实）

最后更新：2026-05-05（P1 最小交易闭环）

> 仅登记**已**在**现网后端**注册、或**本文件明确**的接口状态。与 **[requests.md](requests.md)** 中**未实现**项**不得**标为 `implemented`。  
> **图例（状态）**  
> - **implemented** — 路由在现网、用于联调。  
> - **compatibility** — 现网有路由；**不**作新**用户**主入口/终局，见 `docs/boundaries.md`。  
> - **target / planned**（合称 **planned**）— **合同已锁**、**P1 计划** 实现；**当前**不可联调。  

**新主链：P1 已接路由**（分条见下「StandardService / P1a」与「P1 交易闭环」；部署须 `migrate` + `StandardServiceP1aSeeder` 或等价数据迁移）：

- **P1a 已实现**（`expatth-backend` `routes/api.php`）：`GET/GET/GET/POST` **`/api/v1/standard-services*`**。  
- **P1 已实现**：`POST /api/v1/orders/{orderNo}/confirm-merchant-quote`、`POST /api/v1/orders/{orderNo}/after-sales`、`/api/v1/merchant/capabilities*`、`/merchant/order-requests*`、`/merchant/.../quote-confirmation`、`/merchant/credit-profile`；`POST /api/v1/orders` 已按 `MerchantCapability` 生成候选。

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
- 响应：`orderNo`、`workflowStatus=waiting_payment_or_authorization`、`legacyWorkflowStatus=pending_payment`、`nextAction=pay`、`finalAmount`、`userPayable`、`confirmedServiceTime`、`paymentRequired`
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
- 实现位置：`PaymentController@intent`
- 前端使用位置：去支付

---

## POST /api/v1/reviews

- 状态：implemented
- 调用方：用户端
- 权限：用户 JWT
- 实现位置：`ReviewController@store`
- 前端使用位置：评价

---

## 广场需登录的 POST/DELETE

- 状态：implemented
- 路径：`POST /square/posts/{postId}/comments`、`POST/DELETE /square/authors/{authorId}/follow`
- 实现位置：`SquareController`
- 权限：用户 JWT

---

## /api/v1/merchant/*（节选）

- **`GET/POST /merchant/auth/*`**、**`GET/POST /merchant/profile`**、**`POST /merchant/verification`**、**`GET/PUT /availability`**、**`GET/POST/PUT /merchant/services`**、**`GET /merchant/orders` + 订单动作**：状态 **implemented** 或 **compatibility**（**merchant/services* = 商家服务配置，非** StandardService 主入口**）。
- **compatibility 标注**：`GET/POST/PUT /api/v1/merchant/services` 与 `GET /api/v1/merchant/services/{serviceId}` — 与 **MerchantCapability** 演进衔接；**不是** C 端「选标准品」的终局。
- 实现位置：`MerchantPortalController`、`MerchantAuthController`、`MerchantWalletController` 等（见 `routes/api.php`）。

细节字段与**商户订单动作**以历史 **docs/api-merchant-list.md** 为文字备份；**以后端代码与联调**为准。若与本文冲突，**先**改 **registry** 与 **requests**。

---

## 维护

- 新接口上线：在本文件**追加**一条，**状态**从 `implemented` 或 `compatibility` 中选一。  
- 下线：改 **deprecated** 并保留一版 `实现位置` 备查。  
- **不**在 registry 中写未讨论的需求；需求一律 **requests.md**。
