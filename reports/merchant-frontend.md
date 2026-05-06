# Merchant Frontend 工作报告

最后更新：2026-05-07

状态：merchant-api/profile/verification/location/state-machine current-phase audit。本文只记录商家端 API/BFF、后端服务、数据库表与最新履约流程是否勾手；不实现新功能。

职责边界：`epmerchant` 商家端页面、BFF、商家侧 API 消费。商家端不得替代后端推进订单状态机、金额、信用或结算规则。

## 1. 本轮目标

- 审计商户端实际 API 需求和 Laravel 后端是否对齐。
- 核对商家能力、候选、MQC、履约、互评、钱包、结算是否能形成业务闭环。
- 核对商家资料是否支撑推荐和履约，实名流程是否独立可靠，位置采集是否能支撑距离推荐。
- 核对商家是否只能通过后端状态机推进订单，以及失败、退回、异常动作是否完整。
- 把发现的合同/实现偏差写入 `api/requests.md` 和越界审计记录。

## 2. 修改文件清单

| 文件路径 | 操作 | 说明 |
|---|---|---|
| `ep-shared/api/requests.md` | 更新 | 新增 R-031 至 R-037。 |
| `ep-shared/api/registry.md` | 更新 | 修正商家订单 P2/P3 摘要字段的实现粒度，避免 registry 过度宣称。 |
| `ep-shared/PROJECT_RULES.md` | 更新 | 新增商户端 API 审计、资料/实名/位置/状态机审计越界记录。 |
| `ep-shared/reports/merchant-frontend.md` | 更新 | 本报告。 |

## 3. 明确未修改范围

- 未修改 `epmerchant`、`epbkend` 运行代码。
- 未新增后端路由。
- 已把 R-031、R-032、R-033、R-036、R-037 对齐到当前实现。
- 未执行 PostgreSQL 能力库计划；当前审计仍以 MySQL 为业务事实源。

## 4. api/requests.md 变更

| R 编号 | 标题 | 操作 | 状态 |
|---|---|---|---|
| R-20260428-031 | 商家偏好语言 BFF 上游路径修正 | 修正实现 | implemented |
| R-20260428-032 | 商家订单响应与 P2/P3 履约/结算/信用摘要对齐 | 修正实现 | implemented |
| R-20260428-033 | 商家能力配置的 StandardService 选择来源 | 修正实现 | implemented |
| R-20260428-034 | 商家资料字段与位置采集补齐 | 实现 | implemented |
| R-20260428-035 | 商家实名提交流程与资料维护解耦 | 实现 | implemented |
| R-20260428-036 | 商家履约状态机失败、退回与目标态补齐 | 修正实现 | implemented |
| R-20260428-037 | 商家端后端错误响应标准化 | 修正实现 | implemented |

## 5. 编号校验

- 当前最后编号：R-20260428-037。
- 本轮没有重复编号。
- R-030 至 R-037 均为当前阶段条目，不属于 `pgsql plan`；其中 R-030 至 R-037 已实现。

## 6. 合同变更

| 合同文件 | 变更点 | 是否已同步 requests |
|---|---|---|
| `api/requests.md` | 记录商户端 BFF、订单响应、能力配置来源缺口 | 是 |
| `api/registry.md` | 记录商家语言 BFF、标准服务只读 BFF、商家订单 P2/P3 摘要字段 | 是 |
| `PROJECT_RULES.md` | 越界审计记录新增商户端 API 审计行 | 是 |

## 7. 现网可联调 / 不可联调

当前可支撑的商家端主闭环：

- 商家注册、登录、`auth/me`、logout。
- 商家资料、认证材料、钱包、提现、OSS policy。
- 商家全局可用性：`GET/PUT /api/v1/merchant/availability`，表字段已包含 `ready_status`、`capacity_rule`、`time_slots`、`blackout_dates`、`open_dates`。
- 商家能力：`GET/POST/GET by id/PUT /api/v1/merchant/capabilities*`，表字段已包含 `standard_service_code`、`service_area`、`base_pricing_rule`、`extra_distance_rule`、`capacity_rule`、`ready_status`、`time_slots`、`blackout_dates`。
- 候选与 MQC：`GET /api/v1/merchant/order-requests`、`POST /api/v1/merchant/order-requests/{candidateId}/quote-confirmation`，表结构已覆盖 `yipai_merchant_candidates` 和 `yipai_merchant_quote_confirmations`。
- 履约动作：`confirm`、`start-service`、`finish-service`、`cancel`、`transition` 路由存在；后端通过 `OrderWorkflowService` 校验状态并写 `yipai_order_state_logs` 和 `yipai_fulfillment_events`。
- 商家评价客户：`POST /api/v1/merchant/reviews` 存在，订单完成后可生成 `merchant_to_customer` 评价，并可选广场发布。
- 结算：用户确认完成后 `PaymentSettlementService::settleMerchantAfterCustomerCompletion` 可给商家钱包入账并写 `settlement_released` 履约事件。

当前不足以称为完全闭环的点：

- R-031：已修正商家端 `POST /api/merchant/preferences/locale` BFF，上游为商家域 `POST /api/v1/merchant/preferences/locale`。
- R-032：`GET /api/v1/merchant/orders` 和商家订单动作响应已稳定返回目标 `workflowStatus`、`legacyWorkflowStatus`、`fulfillmentEvents`、`settlement`、`creditImpact`、`canReviewCustomer` / `merchantReview`。
- R-033：已新增商家端标准服务只读 BFF，能力配置表单从平台 `StandardService` 列表选择，不再让商家手填 code。
- R-034：已通过 `POST /api/v1/merchant/profile` 的 `location` 扩展和商家端资料页补齐商家营业/出发地址、经纬度、服务半径和服务区域；推荐计算可读取 `merchant.lat/lng`。
- R-035：已将普通资料保存和实名提交解耦；资料保存不再写实名 pending，实名提交由 `POST /api/v1/merchant/verification` 和 FormRequest 单独校验。
- R-036：已新增 `failure-action`，覆盖迟到、未履约、改约、争议和售后退回履约中；后端写履约事件和信用事件，`after_sales` 已进入 transition map。
- R-037：已新增结构化 `ApiProblem` 和商家订单/可用性/语言偏好的 FormRequest；商家域 API 不再返回 debug 文件路径和行号，字段错误返回 `errors[]`。

## 8. 商家资料 / 实名 / 位置 / 状态机专项结论

| 检查项 | 当前证据 | 结论 |
|---|---|---|
| 商家填写资料是否支撑业务需求 | `MerchantProfileService::updateProfile` 维护基础资料、服务类型和 `location`；商家资料页已采集营业地址、经纬度、服务半径和服务区域。 | 当前已能支撑推荐距离、服务半径和基础上门调度；后续可把经纬度输入升级为地图选点。 |
| 商家实名流程是否符合逻辑 | `POST /api/v1/merchant/profile` 不再触发实名 pending；`POST /api/v1/merchant/verification` 由 `SubmitMerchantVerificationRequest` 校验必填材料，并阻止 pending/approved 重复提交。 | 当前主逻辑已合格；后续可补更细的证件格式和后台审核事件。 |
| 商家位置信息采集是否准确 | MySQL `yipai_merchants` 有 `lat`、`lng`、`areas`、`service_radius_meters`、`base_address`、`place_id`；商家资料 API/UI 已读写这些字段。 | 当前可用于推荐距离计算；准确性取决于商家输入，后续应接地图选点和地理编码。 |
| 商家是否正确推动状态机 | 商家订单动作走 Laravel `MerchantOrderService`，并由 `OrderWorkflowService` 校验 transition；开始服务前检查 `payment_status` 必须 `paid` 或 `authorized`。 | 基础正向推进合格，但仍偏旧状态；付款后再次 `pending_merchant_confirm` 与 MQC 语义可能重复。 |
| 失败退回状态是否检查 | `failure-action` 支持 `report_late`、`report_no_show`、`request_reschedule`、`dispute_opened`、`return_to_in_service`；`after_sales` 可退回 `in_service`。 | 当前主异常闭环已可联调；更细的拒单候选动作仍归 `MerchantCandidate` 后续扩展。 |
| 后端返回是否符合开发标准 | 商家域订单动作、异常动作、可用性、语言偏好已进 FormRequest；`ApiProblem` 支持 `code/errors/nextAction`；merchant API debug 不返回文件行号。 | 当前主商家订单链路已达标准；其他历史 compatibility 服务接口仍可继续收敛。 |

## 9. 只读检查范围

| 检查项 | 结论 |
|---|---|
| `php artisan route:list --path=api/v1/merchant` | 商家端共 36 条路由，主链路由存在。 |
| `epmerchant` BFF 扫描 | catch-all BFF 可代理大多数 `/api/merchant/*`；`preferences/locale` 已指向商家域；`standard-services` 已作为只读 BFF 代理公共标准服务。 |
| 后端服务扫描 | `MerchantMatchingService`、`MerchantOrderRequestService`、`MerchantCapabilityService`、`MerchantOrderService`、`OrderWorkflowService`、`PaymentSettlementService` 能串起主流程。 |
| MySQL model show | `yipai_merchants`、`yipai_merchant_capabilities`、`yipai_merchant_candidates`、`yipai_merchant_quote_confirmations` 字段足够支撑当前主链。 |
| registry 一致性 | R-030 至 R-037 已与当前实现对齐；R-027 至 R-029 仍不登记 implemented。 |
| 资料/实名/位置扫描 | R-034、R-035 已落地：资料保存不再污染实名审核，商家位置字段进入 profile API/UI。 |
| 状态机/错误响应扫描 | R-036、R-037 已实现；剩余历史 compatibility 服务接口可在后续重构时继续换 FormRequest。 |

## 10. 阻塞点

| 阻塞点 | 影响角色 | 需要谁处理 | 对应 R 编号 |
|---|---|---|---|
| 当前无新增商家端阻塞 | 商家端主链 | 继续联调真实订单和履约闭环 | - |

## 11. 下一步建议

R-030 已补后端实现。下一步从真实订单联调验证商家候选、MQC、履约失败动作、结算和评价闭环。
