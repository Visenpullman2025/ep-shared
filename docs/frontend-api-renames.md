# 前端对接：接口路径变更一览

最后更新：2026-03-29

> 给 **用户端 / BFF** 与 **商户端** 的速查表。契约细节分别以 **[api-user-list.md](api-user-list.md)**、**[api-merchant-list.md](api-merchant-list.md)** 为准。  
> 业务顺序见 **[project-flow.md](project-flow.md)**。

---

## 一、用户端 / BFF（Customer）

| 旧路径（请勿再用） | 新路径 | 说明 |
|-------------------|--------|------|
| `GET /api/v1/me/orders` | **`GET /api/v1/orders`** | 需 `Authorization: Bearer` |
| `GET /api/v1/me/orders/{orderNo}` | **`GET /api/v1/orders/{orderNo}`** | 同上 |
| （新增）本人订单评价详情 | **`GET /api/v1/orders/{orderNo}/my-review`** | 无主评时 `data` 为 `null`；BFF 可映射 `GET /api/orders/{orderNo}/my-review` |
| `POST /api/v1/me/orders/{orderNo}/cancel` | **`POST /api/v1/orders/{orderNo}/cancel`** | 同上 |
| `POST /api/v1/me/orders/{orderNo}/hide-from-list` | **`POST /api/v1/orders/{orderNo}/hide-from-list`** | 同上 |
| `POST /api/v1/me/orders/{orderNo}/transition` | **`POST /api/v1/orders/{orderNo}/confirm-completion`** | Body **仅可选** `remark`；**不要**再传 `targetStatus` / `to` |
| `POST /api/v1/orders/{orderNo}/transition`（用户 JWT） | **已删除** | 改用 **`confirm-completion`** |
| `GET /api/v1/orders/{id}`（未登录或可选登录详情） | **已删除** | 改用 **`GET /api/v1/orders/{orderNo}`** 且 **必须登录**、仅本人订单 |

**Next.js BFF（本仓库）**：浏览器侧用户订单代理基路径为 **`/api/orders/*`**，对应上表 **`/api/v1/orders/*`**（见 `src/app/api/orders`）。旧路径 **`/api/me/orders/*`** 已移除。

未变更（仍常用）：`POST /api/v1/orders`（创建）、`POST /api/v1/payments/intent`、`GET/POST /api/v1/me/profile`、`/api/v1/me/addresses/*`、`/api/v1/services/*` 等。

---

## 二、商户端 / BFF（Merchant）

| 旧用法 | 新路径（推荐） | 说明 |
|--------|----------------|------|
| `POST .../merchant/orders/{orderNo}/transition` + `targetStatus: merchantConfirmed`（等） | **`POST .../merchant/orders/{orderNo}/confirm`** | 接单 → `merchant_confirmed` |
| 同上 + `targetStatus: inService` | **`POST .../merchant/orders/{orderNo}/start-service`** | 开始服务；未付款会 422 |
| 同上 + `targetStatus: merchantDone` / `done` | **`POST .../merchant/orders/{orderNo}/finish-service`** | 商家完工 |
| 同上 + `targetStatus: cancelled` | **`POST .../merchant/orders/{orderNo}/cancel`** | 商户取消 |

**兼容**：`POST .../merchant/orders/{orderNo}/transition` + body **`targetStatus`** 仍可用；新页面请优先四字路径。

Body 约定不变：可传 **`confirmedServiceTime`**、**`merchantNote`**、取消时 **`reason`**；与当前工作流态一致时可只更新时刻/备注。

---

## 三、文档迁移（给全体开发）

| 弃用 | 改用 |
|------|------|
| [api-list.md](api-list.md) | **用户/公共** → [api-user-list.md](api-user-list.md)；**商户** → [api-merchant-list.md](api-merchant-list.md) |
| [api-request.md](api-request.md) | **用户端需求** → [api-user-request.md](api-user-request.md)；**商户需求** → [api-merchant-request.md](api-merchant-request.md) |

旧文件仅保留重定向说明，不再更新正文。
