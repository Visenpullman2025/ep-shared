# User Frontend 工作报告

最后更新：2026-05-07

状态：current-phase audit。本文记录用户端当前 API/BFF、构建验证和结构门禁是否支撑现有下单、资料、地址、订单和广场流程。

职责边界：`ep` 用户端页面、BFF、客户侧 API 消费。客户界面不得展示内部 code、内部状态、结算字段或原始后端错误。

## 1. 本轮目标

- 核对用户端当前主流程是否有真实后端 API 支撑。
- 识别仍停留在 BFF 但无 Laravel 路由的入口。
- 把当前阶段缺口写入 `api/requests.md`，避免前端误判为已接通。

## 2. 修改文件清单

| 文件路径 | 操作 | 说明 |
|---|---|---|
| `ep-shared/api/requests.md` | 更新 | R-030 已从缺口记录更新为后端已实现。 |
| `ep-shared/api/registry.md` | 更新 | 登记 `merchants/featured`、`me/location`、`me/verification`。 |
| `ep-shared/PROJECT_RULES.md` | 更新 | 越界审计登记 BFF/API 缺口。 |
| `ep-shared/reports/user-frontend.md` | 更新 | 本报告。 |
| `ep/package.json` | 更新 | `npm run build` 固定走 `next build --webpack`，避开本机 Turbopack compile 卡住。 |
| `ep/src/components/OrderCenterCard.tsx`、`ep/src/components/order-center-card/*` | 拆分 | 订单卡主组件由 573 行降到 108 行。 |
| `ep/src/components/review/OrderReviewPageClient.tsx`、`ep/src/components/review/order-review-page/*` | 拆分 | 评价页主组件由 835 行降到 159 行，拆出表单、预览、只读卡片、反馈弹窗和 hook。 |
| `ep/src/lib/orders-workflow.ts`、`ep/src/lib/orders-permissions.ts`、`ep/src/components/order-center-card/*` | 更新 | 用户端订单卡支付判断和 badge 与 `waiting_payment_or_authorization`、`paid_or_authorized` 等目标状态对齐；未知状态不再把原始后端字面量展示给客户。 |
| `ep/src/app/[locale]/standard-services/[code]/quote/page.tsx`、`ep/src/components/standard-services/StandardServiceQuotePageClient.tsx`、`ep/src/app/[locale]/orders/new/page.tsx`、`ep/src/middleware.ts`、`ep/src/lib/auth/paths.ts` | 清理 | 删除旧独立 quote 客户端页，旧 `/standard-services/{code}/quote` 统一重定向到标准服务详情页内联报价；未登录创建订单仍走统一登录/注册门禁并保留 next。 |

## 3. 明确未修改范围

- 未修改用户端 API 合同或 BFF 上游路径。
- 未把无支撑 BFF 改成 mock 或静态兜底。
- 已新增 R-030 对应 registry implemented；未新增前端 mock 或静态兜底。

## 4. api/requests.md 变更

| R 编号 | 标题 | 操作 | 状态 |
|---|---|---|---|
| R-20260428-030 | 当前用户端无支撑 BFF 清理或补合同 | 后端补实现并登记 `merchants/featured`、`location/resolve`、`me/verification`、`me/location` | implemented |

## 5. 编号校验

- 当前最后编号：R-20260428-030。
- 本报告不新增编号。

## 6. 合同变更

| 合同文件 | 变更点 | 是否已同步 requests |
|---|---|---|
| `api/requests.md` | R-030 字段合同和实现状态 | 是 |
| `api/registry.md` | R-030 三组接口 implemented | 是 |

## 7. 现网可联调 / 不可联调

当前可联调的用户端主流程：

- 首页、分类、标准服务详情可读取标准服务和模板。
- 服务详情页可提交 RequirementPayload 并生成 QuotePreview。
- 登录、注册、`auth/me` 可走后端认证接口。
- 资料、地址簿、默认地址、订单创建、订单列表、订单详情、取消、售后、确认商家报价、确认完成有后端路由。
- 钱包、流水、充值、提现有后端路由。
- 支付 intent、评价、广场发布、广场评论和关注有后端路由。
- OSS 上传使用后端 policy 加直传模式，当前后端 policy 路由存在。

R-030 已补齐可联调：

- `ep/src/app/api/merchants/featured/route.ts` 上游 `GET /api/v1/merchants/featured` 已存在。
- `ep/src/app/api/me/verification/route.ts` 上游 `GET/POST /api/v1/me/verification` 已存在。
- `ep/src/app/api/me/location/route.ts` 上游 `GET/POST /api/v1/me/location` 已存在。

## 8. 只读检查范围

| 检查项 | 结论 |
|---|---|
| 用户端 BFF 路径 | 主链 BFF 已覆盖 standard-services、orders、auth、me/profile、me/addresses、wallet、square、oss。 |
| Laravel route list | 主链上游存在；R-030 三组路径已补路由。 |
| 产品规则 | 客户侧必须继续隐藏内部 code/status/结算字段，金额和状态只读后端 presenter。 |
| 构建验证 | `npm run build` 已通过，当前脚本使用 webpack；默认 Turbopack 在本机曾卡在 compile 并留下 `.next/lock`。 |
| 结构门禁 | `OrderCenterCard.tsx` 108 行；`OrderReviewPageClient.tsx` 159 行；新拆分组件和 hook 均低于目标上限。 |
| 订单状态机 UI | 支付入口覆盖目标态 `waiting_payment_or_authorization`；已支付/已预授权覆盖 `paid_or_authorized`、`paymentStatus=paid/authorized/settled`；客户侧未知状态统一显示“处理中”。 |
| 下单动线 | 服务详情页是唯一客户报价入口；旧 `/quote` URL 只做重定向，不再保留第二套表单、raw JSON 或内部字段说明。 |

## 9. 阻塞点

| 阻塞点 | 影响角色 | 需要谁处理 | 对应 R 编号 |
|---|---|---|---|
| 首页 featured merchants BFF | 用户端首页 | 已补后端上游，继续用真实数据验证展示质量 | R-030 |
| verification/location BFF | 用户端潜在资料/位置入口 | 已补后端上游；若后续页面不用，再按引用扫描清理 | R-030 |

## 10. 下一步建议

用户端可以继续人工测试主下单、资料、地址、订单、评价和首页推荐商家流程。下单测试以标准服务详情页内联报价为准；如访问旧 `/standard-services/{code}/quote`，应自动回到详情页。后续新增入口仍必须先走 shared requests/registry，不得绕过 API 固定闸门；后续构建验证使用 `npm run build`，不要直接跑默认 Turbopack 构建。
