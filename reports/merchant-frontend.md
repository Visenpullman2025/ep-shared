# Merchant Frontend 工作报告

状态：P1a 已完成（回归门闸通过）；下一里程碑 **P1b**。

## 1. 本轮目标

按 `.cursorrules` 与 `roles/merchant-frontend.md` 中的 **P1a** 定义执行：

- **保留** 商家端 **profile**、**verification**、**wallet**、**旧订单**（`GET/POST` 现网联调动作维持不变）与 **旧 `services*` 兼容**能力，**不删除、不收缩** 上述路径。
- **不** 引入 P1b+（能力中心、order-requests、quote-confirmation 等**新**接口/页面/BFF 扩展），避免破坏现网与「不得假设性接口」规则（`.cursorrules` §3 / §4）。
- 通过本仓库 **typecheck、eslint、production build** 对 `expath-merchant` 做 **P1a 回归门闸**。

## 2. 修改文件清单

| 文件路径 | 操作 | 说明 |
|----------|------|------|
| 无 | — | 本轮**未**修改 `epmerchant` 业务/BFF/组件源码；仅执行 CI 式验证。 |
| `expatth-shared/reports/merchant-frontend.md` | 更新 | 本报告。 |

## 3. 明确未修改范围

- **未** 新增/修改：`MerchantCapability`、`/order-requests`、**MerchantQuoteConfirmation** 相关任何页面、类型或 BFF 路由（属 **P1b–P1d**）。
- **未** 调整订单列表的「两线」拆分、底栏 IA（属 **P1e**）。
- **未** 新增信用/售后只读页（**P1f**）。
- **未** 修改 `expatth-shared/api/merchant-api.md`（合同）、`api/registry.md` 登记（本轮无新路由落库需求）。
- **未** 修改 `expath-merchant` 的 `shared/docs/*` 旧软链内文档；主线以 `expatth-shared` 为准（`.cursorrules` 2026-04-28 覆盖段）。

## 4. api/requests.md 变更

| R 编号 | 标题 | 操作 | 状态 |
|--------|------|------|------|
| - | 无 | 无 | 本轮不追加需求条目 |

## 5. 编号校验

- 修改前读取到的**下一**可用编号是：**R-20260428-020**（在 **R-019** 之后追加；见 `api/requests.md` 维护节）。
- 本轮实际**新增**编号：**无**。
- 是否存在重复编号：**无**（未写新 R- 条）。

## 6. 合同变更

| 合同文件 | 变更点 | 是否已同步 requests |
|----------|--------|----------------------|
| 无 | 无 | 不适用 |

## 7. 现网可联调 / 不可联调

**可联调（与 P1a 相关、既有 BFF 代理，以前端/后端现网配置为准）**：

- `GET/POST` `/api/merchant/profile`
- `POST` `/api/merchant/verification`；`GET/POST` `/api/merchant/uploads/oss`（认证上传链）
- `GET` `/api/merchant/wallet`、`GET` `/api/merchant/wallet/records`、`POST` `/api/merchant/wallet/withdraw`
- `GET` `/api/merchant/orders` 及现网已实现的 `POST` `.../confirm` / `.../start-service` / `.../finish-service` / `.../cancel`（经 `[[...path]]` → `/api/v1/merchant/...`）
- **旧** `GET` `/api/merchant/services`、**旧** 服务编辑链路的 `GET` `categories` / `process-templates` / `GET|POST|PUT` `services*`

**不可联调（P1a 范围外、合同/需求池尚未在本轮落地者）**：

- `GET` `/api/v1/merchant/capabilities*`、`/order-requests*`、`quote-confirmation`、扩展版 `availability` 容量/时段、`GET` `/api/v1/merchant/credit-profile` 等仍以后端/registry 与 **R-012～R-019** 推进为准，**不** 在本轮强依赖。

## 8. 只读检查范围

| 仓库 | 文件/模块 | 发现 |
|------|------------|------|
| `expath-merchant` | 全量 **TypeScript**（`tsc --noEmit`） | 通过。 |
| `expath-merchant` | **ESLint** 全量 | 通过。 |
| `expath-merchant` | **Next.js `next build`** 路由与编译 | 通过；包含 `merchant/profile*`、`profile/verification`、`wallet`、`orders`、`services`、`api/merchant/[[...path]]` 等 P1a 相关路由。 |

## 9. 阻塞点

| 阻塞点 | 影响角色 | 需要谁处理 | 对应 R 编号 |
|--------|----------|------------|-------------|
| 无 | — | — | — |

**说明**：P1a 不依赖**新**后端能力；若后续 P1b 联调发现 capabilities 等未实装，按 **R-012** 等与 Backend 对齐，非本轮阻塞。

## 10. 下一步建议

- 启动 **P1b**：在**保留** 旧 `merchant/services*` 的前提下，新增 **MerchantCapability 能力配置中心**（页面 + 类型 + BFF 与合同/registry 一致），入口文案避免「服务商品/上架」主线（见 `glossary` / `boundaries`）。
- 在首次需要新 `R-` 条目前，先读 `api/requests.md` 维护节，从 **R-20260428-020** 起追加（`.cursorrules` C）。
