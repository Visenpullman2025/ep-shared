# Backend API 工作报告

最后更新：2026-05-07

状态：current-phase audit。本文只记录当前 MySQL/API 是否支撑现有前端流程；PostgreSQL 能力库任务已移入下一阶段 `pgsql plan`。

职责边界：后端 API、Laravel 路由、迁移状态、与前端 BFF 的支撑关系。未实现接口不得写入 `api/registry.md`。

## 1. 本轮目标

- 核对当前 Laravel API 是否支撑用户端和商家端主流程。
- 核对当前 MySQL 表结构是否支撑标准服务、报价、下单、地址、支付、商家确认、履约、评价、广场和后台查看。
- 把 PostgreSQL 同步、AI 语义搜索、距离搜索任务树明确放到下一阶段 `pgsql plan`。

## 2. 修改文件清单

| 文件路径 | 操作 | 说明 |
|---|---|---|
| `ep-shared/db/postgres-clean-rewrite.md` | 更新 | 明确 PostgreSQL 任务树属于下一阶段，不进入当前前端流程验证。 |
| `ep-shared/db/schema-plan.md` | 更新 | 补充当前阶段 MySQL 支撑范围与下一阶段能力库边界。 |
| `ep-shared/api/requests.md` | 更新 | R-027 至 R-029 保持 proposed 并归入 `pgsql plan`；R-030 记录当前 BFF/API 缺口。 |
| `ep-shared/PROJECT_RULES.md` | 更新 | 越界审计记录登记当前用户端无支撑 BFF。 |
| `ep-shared/reports/*.md` | 更新 | 同步当前阶段后端、用户端、商家端、数据库审计结论。 |

## 3. 明确未修改范围

- 未实现 PostgreSQL 能力库、同步任务、AI embedding、距离搜索或推荐读模型。
- 未把 `DB_CONNECTION` 改为 PostgreSQL。
- 未把 R-027、R-028、R-029 写入 registry implemented。
- 已补实现 R-030：`GET /api/v1/merchants/featured`、`GET/POST /api/v1/me/verification`、`GET/POST /api/v1/me/location`。

## 4. api/requests.md 变更

| R 编号 | 标题 | 操作 | 状态 |
|---|---|---|---|
| R-20260428-027 | PostgreSQL 能力读模型同步 | 归入下一阶段 `pgsql plan` | proposed |
| R-20260428-028 | 能力库 6 小时自动同步调度 | 归入下一阶段 `pgsql plan` | proposed |
| R-20260428-029 | AI 语义搜索能力库 | 归入下一阶段 `pgsql plan` | proposed |
| R-20260428-030 | 当前用户端无支撑 BFF 清理或补合同 | 补后端实现并登记 registry | implemented |

## 5. 编号校验

- 当前最后编号：R-20260428-030。
- 本轮不新增平行编号。
- R-027 至 R-029 不是当前阶段待实现项；执行前必须重新确认进入 `pgsql plan`。

## 6. 合同变更

| 合同文件 | 变更点 | 是否已同步 requests |
|---|---|---|
| `api/requests.md` | 当前阶段 R-030 API 缺口更新为已实现；R-027 至 R-029 仍归类到下一阶段 pgsql plan | 是 |
| `api/registry.md` | 登记 R-030 三组真实后端接口 | 是 |
| `db/schema-plan.md` | MySQL 当前支撑范围、PostgreSQL 下一阶段边界 | 是 |
| `db/postgres-clean-rewrite.md` | `pgsql plan` 下一阶段任务树 | 是 |

## 7. 现网可联调 / 不可联调

当前 Laravel route list 支撑的主流程：

- 用户端标准服务：`GET /api/v1/standard-services`、详情、requirement-template、quote-preview。
- 用户端账户和订单：注册、登录、`me/profile`、`me/addresses`、订单创建、列表、详情、取消、售后、确认商家报价、确认完成、评价。
- 用户端支付和钱包：`POST /api/v1/payments/intent`、钱包余额、流水、充值、提现。
- 商家端：商家认证、资料、能力、可用性、order-requests、MQC 提交、订单开始/完成/取消/确认、信用档案、钱包、评价客户。
- 公共和广场：分类、地图配置、广场列表、评论、关注、评论/商家评价读取。
- 上传策略：用户 `GET /api/v1/uploads/oss-policy`，商家 `GET /api/v1/merchant/uploads/oss-policy`。

R-030 已补齐：

- `GET /api/v1/merchants/featured`：首页推荐商家 BFF 上游，按真实商家、能力、订单完成数、位置距离输出。
- `GET/POST /api/v1/me/verification`：用户实名入口，写入 `yipai_user_verifications`。
- `GET/POST /api/v1/me/location`：用户位置入口，复用默认地址和 `yipai_users.location`。

## 8. 只读检查范围

| 检查项 | 结论 |
|---|---|
| Laravel route list | R-030 三组路径已出现在 `api/v1` route list。 |
| MySQL migrate status | P1/P2/P3 主链迁移均 Ran；PostgreSQL 扩展迁移和本地 demo catalog migration 已从活动迁移中删除；商家位置字段迁移已 Ran。 |
| MySQL 表概况 | RDS MySQL 8.0.36，数据库 `ep`，54 张表，含订单、报价、能力、候选、履约、评价、钱包、广场、Dcat 表。 |
| registry 一致性 | R-030 仅登记已实现接口；R-027 至 R-029 保持非 implemented。 |

## 9. 阻塞点

| 阻塞点 | 影响角色 | 需要谁处理 | 对应 R 编号 |
|---|---|---|---|
| R-030 数据迁移依赖远程 MySQL | 用户端实名入口 | 已执行新增 `yipai_user_verifications` migration | R-030 |

## 10. 下一步建议

R-030 已补后端实现。下一步继续按当前 MySQL 主链验证用户端首页推荐、资料/地址、下单、订单状态和商家履约闭环；PostgreSQL 任务仍保留到下一阶段 `pgsql plan`。
