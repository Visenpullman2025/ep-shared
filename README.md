# expatth-shared

Expatth 多仓库共用的**文档与契约边界**（Backend API、Shared 语义、数据库与迁移计划）。实现代码在各业务仓库，本目录**不执行** Laravel / Next.js 改码。

## P0 结论（2026-04-28）

- **边界已冻结**：用户入口从「选商家 `serviceId`」演进到「选平台 `standardServiceCode` → 采需求 → 粗报价 → 匹商家 → 商家人工确认价与时间 → 用户确认 → 支付/预授权 → 履约 → 售后/评价/信用」。详见 [docs/boundaries.md](docs/boundaries.md) 与 [docs/glossary.md](docs/glossary.md)。
- **7 个核心词**只使用本文档体系中的英文化命名（Glossary），禁止用 product / goods 等代指同一业务。旧 **service（`yipai_services` 等）** 语义**降级**为「商家服务配置 / 能力配置」，不得再作为**用户主入口**的设计核心。
- **需求单入口**：[api/requests.md](api/requests.md)。**已上线接口目录**：[api/registry.md](api/registry.md)。**合同级分角色**（不随需求漂移）：`api/user-api.md`、`api/merchant-api.md`、`api/admin-api.md`（P0 未改，仍保持仓库内原状）。
- **项目规则总纲**：[PROJECT_RULES.md](PROJECT_RULES.md)。最高准则、文档格式、越界审计、读取方式都以它为准。
- **主叙述文档**：流程 [docs/fulfillment-flow.md](docs/fulfillment-flow.md)、状态 [docs/state-machine.md](docs/state-machine.md)、迁移 [docs/migration-plan.md](docs/migration-plan.md)。**[docs/project-flow.md](docs/project-flow.md) 仅作历史参考**。

## 文档地图

| 类型 | 路径 | 说明 |
|------|------|------|
| 边界与术语 | `docs/boundaries.md`、`docs/glossary.md` | 职责、7 词、禁词、旧 service 降级 |
| 业务向 | `docs/fulfillment-flow.md`、`docs/state-machine.md` | 端到端步骤与目标状态机 |
| 迁移 | `docs/migration-plan.md` | 阶段与风险；**P0 无 migration、无改码** |
| API 需求 | `api/requests.md` | 唯一需求池（用户/商户/后台/后端自检） |
| API 目录 | `api/registry.md` | 已实现、已联调、可用 |
| API 其它 | `api/README.md`、`api/internal-api.md`、`api/error-codes.md` | 索引、内网/回调、错误码约定 |
| 数据 | `db/schema-plan.md`、`db/migration-map.md` | 目标表与现表关系（计划） |
| 规则 | `PROJECT_RULES.md` | 最高准则、命名禁词、文档格式、越界审计 |
| 角色 | `roles/backend-api.md` | Backend 边界负责人工作说明 |

## 与旧文档的关系（不删文件）

- `docs/api-list.md`、`docs/api-request.md`：**legacy / deprecated**，不作为新开发依据；请用 `api/registry.md` 与 `api/requests.md`。
- `docs/api-user-list.md` / `docs/api-merchant-list.md`：内容已**迁入** `api/registry.md` 思路；原文件可保留对账，以 **registry** 为「已落地目录」的维护面。
- `docs/api-user-request.md`、`docs/api-merchant-request.md`：未完成项已**合并**入 `api/requests.md`（带编号条目）。
- `docs/frontend-api-renames.md`：P0 **保留**作路径更名参考。

## 与代码仓库的放置方式

本目录可被各仓库以**子模块、软链接或同步脚本**挂接；在某一应用仓库内常见路径为 `shared/` 指向同一份内容。以你们 CI 与本地约定为准，**以本目录文件为准**作契约讨论。

## Cursor 规则

- 本仓库内：`.cursor/rules/expatth-shared-documents.mdc`（`alwaysApply: true`）只做入口，指向 `PROJECT_RULES.md`。
- 在父工作树中，各应用仓库自己的 `.cursorrules` 也只做入口，具体规则统一回到 `PROJECT_RULES.md`。
