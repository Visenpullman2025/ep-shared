# 用户端与公共 API 状态清单

最后更新：2026-03-29

> **契约与联调结论（用户 JWT、访客可读目录、订单/支付/广场等）**。  
> 商户专用接口见 **[api-merchant-list.md](api-merchant-list.md)**。  
> 需求与待办见 **[api-user-request.md](api-user-request.md)**。  
> 端到端业务步骤见 **[project-flow.md](project-flow.md)**。

## 文档与原型说明

- 接口细节以 `expatth-backend` 路由与实现为准。
- 业务步骤与设定见 `project-flow.md`。
- 已下线或冻结（与全局一致）：`/api/v1/ads`、`/api/v1/settings`、`/api/v1/applications`、`/api/v1/merchants/nearby`、`/api/v1/me/messages`、`/api/v1/me/favorites`、`/api/v1/service-processes/*`、`/api/v1/merchant/service-config*` 等。

## 用户侧接口分组

| 分组 | 说明 |
|------|------|
| `/api/v1/auth/*` | 注册、登录、`GET auth/me` |
| `/api/v1/me/*` | 资料、地址簿、钱包、语言（**不含**订单；订单在 `/orders*`） |
| `/api/v1/orders*` | **需用户 JWT**：列表、详情、取消、隐藏、确认完成 |
| `/api/v1/payments/*` | `intent`（需登录）、`callback`（渠道） |
| `/api/v1/reviews` | 用户评价（需登录） |
| 访客可读 | `dictionaries`、`categories`、`services`、`services/{id}/*`（create-data、summary、price-preview、bookable-days）、`maps/config`、`square` / `feed` / `posts` 列表与部分评论 |

## 服务详情与询价（客户端）

- `GET /api/v1/services/{id}/create-data`
- `GET /api/v1/services/{id}/summary`
- `POST /api/v1/services/{id}/price-preview`
- `GET /api/v1/services/{id}/bookable-days?from=&to=`（缺省为曼谷「今天」起约 60 天）
- `GET /api/v1/services/{id}` 含 **`bookableDaysUrl`**、**`bookableDays`**
- 模板计费：`question_template`；`pricingSchema` 为 `questions[] + atoms[]`

## 订单与支付（用户）

- **`POST /api/v1/orders`**：需 JWT；须手机号 + 至少一条地址；同服务 `pending_merchant_confirm` 防重复；金额以后端 `pricing` / 落库为准。
- **开放日自动确认**：响应 `merchantAutoConfirmed`、`requiresMerchantConfirmBeforePay`（见实现）。
- **`GET /api/v1/orders`**：我的列表；含 `pricing`、`canCustomerConfirmCompletion`；排除 `hidden_from_user_at`。列表与详情每条订单建议返回 **`hasMyReply`**（boolean，当前用户是否已评价），供前端展示「查看评价 / 去评价」；完结超过约 15 天不可首评时返回 **`overtimeNoComment`**（boolean，可与 snake_case `overtime_no_comment` 二选一，前端均兼容）。
- **`GET /api/v1/orders/{orderNo}`**：本人详情（**不再提供**未登录 `GET /api/v1/orders/{id}`）；字段与列表项对齐，含 `hasMyReply`、`overtimeNoComment`（同上）。
- **`GET /api/v1/orders/{orderNo}/my-review`**：本人对该订单的**评价详情**（需 JWT）；`data` 含主评 **`id`**、**`rating`** 或 **`score`**、**`content`**、**`imageUrls`** 或 **`images`**（URL 数组）、**`createdAt`**；可选 **`appendices`**（追加条：`content`、`imageUrls`/`images`、`createdAt`、`id`）。无评价时 404 或 `data: null`（以前端与后端约定为准）。Next BFF：`GET /api/orders/{orderNo}/my-review`。
- **`POST /api/v1/orders/{orderNo}/cancel`**：未付款可取消。
- **`POST /api/v1/orders/{orderNo}/hide-from-list`**：仅已取消单软隐藏。
- **`POST /api/v1/orders/{orderNo}/confirm-completion`**：确认完成；body 仅可选 `remark`；门禁 `paid` + `merchant_completed`。
- **`POST /api/v1/payments/intent`**：推荐 body 仅 `orderNo` + `method`（默认 `wallet`）；金额展示以 **`GET /api/v1/orders/{orderNo}`** 为准；待确认且须先商家确认时付款 422。
- **结算**：客户付款不立刻给商户；`customer_completed` 后 `settleMerchantAfterCustomerCompletion`（见实现）。

## 评价与广场（用户）

- **`POST /api/v1/reviews`**：订单须 `customer_completed`；扩展字段见 `api-user-request.md`。**追加评价**时 body 含 **`append: true`**、**`orderNo`**、**`content`**，并带 **`parentReviewId`**（主评记录 id，与 `yipai_reviews.id` / `parent_id` 一致）；可选 **`imageUrls`**。
- **`GET /api/v1/square`**（及 `feed`/`posts` 别名）、评论 GET/POST、关注 POST/DELETE：见实现；关注需用户 JWT。列表 **`data`** 可为帖子数组，或分页对象（如 **`data.list`** + `total`/`page`/`pageSize`）；BFF 已兼容。

## 资料、地址、地图、上传

- **`GET/POST /api/v1/me/profile`**、`GET /api/v1/auth/me`：手机、头像、昵称等。
- **`GET/POST /api/v1/me/addresses`**、`PUT .../{id}`、`POST .../default`；**`GET /api/v1/maps/config`**。
- **`GET /api/v1/uploads/oss-policy?scene=`**：`user-avatar`、`user-doorplate`；评价图 `review-image`（见 request）。
- **`GET/POST /api/v1/me/wallets`**、`records`、`recharge`、`withdraw`。

## 维护约定

1. 状态与边界以本文件 + 代码为准；详细需求差异写 **api-user-request.md**。
2. 影响主流程时同步 **project-flow.md**。
3. 商户类目、模板、服务 CRUD、商户订单动作等见 **api-merchant-list.md**。
