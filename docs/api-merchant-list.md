# 商户端 API 状态清单

最后更新：2026-03-30

> **契约与联调结论（商户 JWT，前缀 `/api/v1/merchant`）**。  
> 前端/本仓库 **TypeScript 类型**单源：**`src/lib/api/merchant-api.ts`**（`@/lib/api/merchant-api`）。  
> 客户端浏览上架服务、询价、下单走公共 **`/api/v1/services/*`** 与 **`POST /api/v1/orders`**，见 **[api-user-list.md](api-user-list.md)**。  
> 需求与待办见 **[api-merchant-request.md](api-merchant-request.md)**。  
> 端到端业务步骤见 **[project-flow.md](project-flow.md)**。

## 认证与资料

- `POST /api/v1/merchant/auth/register`、`POST .../login`、`GET .../auth/me`、`POST .../auth/logout`
- `GET/POST /api/v1/merchant/profile`（含 `serviceTypes`、`boundServiceCategories`）
- `POST /api/v1/merchant/verification`
- `POST /api/v1/merchant/locale`（及 `preferences/locale` 别名）
- `POST /api/v1/merchant/review/notify-url`

## 类目、模板、服务商品

- **`GET /api/v1/merchant/categories`**：`templates[]`、`selected`、`defaultTemplateDetail` 等
- **`GET /api/v1/merchant/process-templates/{templateCode}`**：`priceItems[]`、`formSchema.fields[]`
- **`GET/POST /api/v1/merchant/services`**、`PUT .../{serviceId}`、`GET .../{serviceId}`：`reviewState`、`reviewedAt` / `reviewed_at`、`isOpen` / `is_open`、`editorConfig` 等。**建议列表始终返回明确 `reviewState`**；若缺省，商家端会按 **`reviewed_at` 空且 `is_open` 为假** 推断为待审核（避免仅 `status=active` 误显「已上架」）。
- AI 翻译补全 i18n：见 `.env` 与 `api-merchant-request.md`
- **`GET/PUT /api/v1/merchant/availability`**：`openDates[]`（`YYYY-MM-DD`，Asia/Bangkok）

## 订单（商户）

- **`GET /api/v1/merchant/orders`**：`pricing`、`paymentStatus`、`customerPaid`、`canMerchantStartService`、卡片字段（地址、预约、`serviceTitle` 等）
- **推荐动作（语义路径）**：
  - **`POST .../merchant/orders/{orderNo}/confirm`** → `merchant_confirmed`
  - **`POST .../start-service`** → `in_service`（须客户已付款，否则 422）
  - **`POST .../finish-service`** → `merchant_completed`
  - **`POST .../cancel`** → `cancelled`（服务中取消可能 20% 扣罚，见 lang `merchant_api`）
- Body 可含 **`confirmedServiceTime`**、**`merchantNote`**、取消时 **`reason`**；与当前态相同时可仅更新时间/备注。
- **兼容**：**`POST .../orders/{orderNo}/transition`** + **`targetStatus`**（`merchantConfirmed` | `inService` | `merchantDone` | `cancelled`）

## 钱包与上传

- **`GET /api/v1/merchant/wallet`**、`GET .../wallet/records`、`POST .../wallet/withdraw`
- **`GET /api/v1/merchant/uploads/oss-policy`**

## 维护约定

1. 状态以本文件 + 代码为准；需求差异写 **api-merchant-request.md**。
2. 与用户端共用的流程口径（付款锁日、结算时机等）见 **project-flow.md** 与 **api-user-list.md**。
