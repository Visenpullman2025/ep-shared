# MANIFEST

> ep-shared 的入口索引。任何 AI 进入会话第一步只读 CHARTER.md 和本文件。
> 其他文件按下表触发读取。
> 最后更新：2026-05-12

## L0 必读

| 顺序 | 文件 | 用途 |
| ---- | ---- | ---- |
| 1 | CHARTER.md | 最高法，文件主权与冲突仲裁 |
| 2 | CONSTITUTION.md | 项目规则总纲 |
| 3 | NAMING.md | 文件、ID、状态值命名规范 |

读完 L0 后 AI 必须按 workflow/ai-protocol.md §1 给出入场报告。

## L1 触发读取

| 触发条件 | 读取文件 |
| -------- | -------- |
| 新业务词 / 命名冲突 | docs/glossary.md |
| API、字段、错误码 | api/requests.md, api/registry.md, api/error-codes.md |
| 订单/候选/确认/支付/售后状态 | docs/state-machine.md |
| 数据库改动 | db/schema-plan.md |
| 仓库或角色边界 | docs/boundaries.md |
| 履约流程 | docs/fulfillment-flow.md |
| 用户端合同 | api/user-api.md |
| 商家端合同 | api/merchant-api.md |
| 内部接口 | api/internal-api.md |
| AI 协作细节 | workflow/ai-protocol.md |
| 斜杠命令 | workflow/slash-commands.md |
| 启动 / 检查命令 | ../help.md, docs/EXPATTH_HELP.md（待建） |

## L2 审计触发

下列情况进入 L2，按 workflow/ai-protocol.md §5 处理：

- 用户要求审计
- 测试失败
- 跨仓库合同变更
- 数据库变更
- 文件超出 CONSTITUTION §7 行数门禁

L2 进入时必须读 `data/violations.json` 中所有 `open` 条目。

## 状态指针（跨会话续接）

| 指针 | 当前位置 | 含义 |
| ---- | -------- | ---- |
| 进度 | api/requests.md | R- 条目的状态字段是事实 |
| 越界 | data/violations.json | V- 条目集合 |
| 全景 | STATUS.md（人工维护，迁移完成后改为 status/README.md 自动生成）| 项目当前现状速览 |

## 禁区

- `archive/`：历史快照，仅供查阅，不基于其行动（待建目录，迁移 roles/, reports/ 时使用）
- `status/*`：全自动生成，编辑上游而非此目录（待建）
- `node_modules/`, `.git/`, `.next/`, `vendor/`, `.codex/`, `.swarm/`, `.claude-flow/`, `.playwright-cli/`：工具产物

## 仲裁

冲突按 CHARTER §4 处理。

## 迁移提示

以下文件正在过渡中，迁移完成前继续读现有路径：

- `PROJECT_RULES.md`：等价于 CONSTITUTION.md，迁移完成后归档
- `VIOLATIONS.md`：是 `data/violations.json` 的副本，迁移完成后删除
- `STATUS.md`：人工维护，未来由 dashboard 自动生成
- `roles/`, `reports/`：P0.5 时期资料，待归档到 `archive/2026-04-28-P0.5/`
