# 用户端 API 需求池

最后更新：2026-03-29

> **接口状态与字段边界**见 **[api-user-list.md](api-user-list.md)**。  
> **路径更名对照（给前端）**见 **[frontend-api-renames.md](frontend-api-renames.md)** §一。  
> 商户接口见 **[api-merchant-list.md](api-merchant-list.md)** / **[api-merchant-request.md](api-merchant-request.md)**。  
> 端到端步骤见 **[project-flow.md](project-flow.md)**。  
> **协作**：**Linear 已弃用**。新的或待补的用户端接口需求请写入本文件 **「当前需求区」** 或 **「历史按日记录」**，并与 **api-user-list**、**frontend-api-renames** 对齐。  
> **Next.js BFF（用户订单）**：浏览器请求 **`/api/orders/*`**（`GET/POST …`），代理上游 **`/api/v1/orders/*`**；实现见仓库 `src/app/api/orders`。

## 当前统一业务流程（客户侧）

1. 进入 `/{locale}/services/{id}`，用 **`bookableDays` / `bookableDaysUrl`**
2. `GET .../services/{id}/create-data` 拉表单
3. 商家在后台配价；开放日 **`PUT /api/v1/merchant/availability`**（客户侧仅消费 `bookable-days`）
4. `POST .../services/{id}/price-preview` 粗报价
5. 选日下单 **`POST /api/v1/orders`**（`merchantAutoConfirmed` / `requiresMerchantConfirmBeforePay`）
6. 支付 **`POST /api/v1/payments/intent`**
7. 商户履约（动作见商户文档）
8. 客户 **`POST /api/v1/orders/{orderNo}/confirm-completion`**
9. **`POST /api/v1/reviews`**；可选广场字段见下文

## 当前需求区（用户端）

- **订单中心**：`POST /api/v1/orders/{orderNo}/cancel`、`hide-from-list`；列表/详情 **`GET /api/v1/orders`**、**`GET /api/v1/orders/{orderNo}`**；确认完成 **`confirm-completion`**（仅可选 `remark`）。详情须登录，**无**公开 `GET /api/v1/orders/{id}`。若列表仍缺评价态，须在每条订单上返回 **`hasMyReply`**（及完结超 15 天不可首评的 **`overtimeNoComment`**），否则前端无法区分「去评价 / 查看评价」（见 **api-user-list** 订单节）。
- **下单门禁**：JWT；手机 + 至少一条地址；同服务 `pending_merchant_confirm` 重复 422；前端 401/422 处理见历史实现（`order-create-feedback` 等）。
- **评价**：`POST /api/v1/reviews`；根评支持 `hideForSeller`、`shareToSquare`、`squarePublishAnonymous`、`imageUrls`；**追加**传 `append: true` + `parentReviewId` + `content`（可选图）。**`GET /api/v1/orders/{orderNo}/my-review`** 拉主评与子评。OSS `GET uploads/oss-policy?scene=review-image`（与其它 scene 相同，需配置 OSS 环境变量）。
- **支付**：`payments/intent` 与订单 `user_payable` 一致；分项校验规则见 **api-user-list** / 代码。

## 历史按日记录

原 **api-request.md** 中用户端、广场、支付、跨角色大段流水 **未逐段搬迁**（避免双份漂移）。需要考古时在 git 中查看删除前的 `shared/docs/api-request.md`，或让维护者把仍有效的条目按日期**追加到本文件本节**。

---

（以下为仍常引用的摘要，摘自原文件，便于检索）

### 2026-03-29 · 订单主表与 `yipai_order_details` 1:1

- 大字段进详情表；对外 JSON 键名不变（`processPayload`、`pricingSnapshot`、`address` 等）。

### 2026-03-29 · 广场 HTTP API

- `GET /api/v1/square`、`feed`、`posts`；评论与关注路径见 **api-user-list**。

### 2026-03-30 · 支付 intent 与订单详情

- `payments/intent` 分项校验；详情 **`GET /api/v1/orders/{orderNo}`**（已替代公开 `GET /api/v1/orders/{id}`）。

### 2026-03-25 / 03-29 · 资料与地址

- `me/profile`、`me/addresses`、`maps/config`、OSS `user-avatar` / `user-doorplate`；旧 `me/verification`、`me/location` 已下线。
