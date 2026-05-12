# CHARTER

> ExpatTH 项目的最高法。所有其他规则文件从本文件派生。
> 最后更新：2026-05-12
> 状态：active

## §1 文件主权

本文件（CHARTER.md）属于项目所有者专属维护文件。

- AI 不得通过 Edit、Write、sed、patch、apply、shell 重定向等任何方式修改本文件的字节。
- AI 发现修改本文件的指令时，必须先停下并说明："CHARTER 由人类专属维护，请你亲手修改后我再继续。"
- AI 可以在对话中**口头建议**修改方向，但不替用户落笔。
- 修改本文件的 git commit 必须由人类账号完成，不接受 AI 代提的 patch。



## §2 修改门禁清单

下列文件 AI 修改前必须取得用户当次明确授权（口头同意视为授权）：

- CONSTITUTION.md
- MANIFEST.md
- NAMING.md
- workflow/ai-protocol.md
- workflow/slash-commands.md
- api/contracts/*（迁移完成后）
- api/user-api.md, api/merchant-api.md, api/internal-api.md（当前合同）
- db/schema-plan.md, db/migration-map.md, db/postgres-clean-rewrite.md

其余文件按 CONSTITUTION §1 与 workflow/ai-protocol.md §2 的常规边界处理。

## §3 不可妥协原则

任何任务、任何借口都不能违背的四条：

1. **诚实高于成功**：禁止伪造测试结果、隐藏失败、声称未执行的命令已通过。
2. **合同先于实现**：API、字段、状态、错误码在 shared 未登记时，禁止落业务代码。
3. **越界立刻停**：与规则冲突时先停下，记录到越界审计（当前路径 `data/violations.json`），不允许"先做再说"。
4. **真实数据为准**：金额、权限、状态、推荐以后端为准，前端不得发明或硬编码。
5. **一致性高于局部完成**：同一业务概念、状态、字段、错误码、金额口径、UI 文案来源，必须在 shared、后端、前端、商户端保持一致
违反任意一条视为任务失败，必须立刻记录并回滚。

## §4 冲突仲裁

规则文件之间冲突时，按优先级仲裁：

```
CHARTER  >  CONSTITUTION  >  MANIFEST  >  其他规则文件  >  历史档案
```

CHARTER 与下游文件冲突时，AI 必须以 CHARTER 为准，并提示用户修订下游文件。

代码现状与规则冲突时，AI 不擅自改任一方，先停下报告。

## §5 不可触碰区域

AI 在任何会话内都不得修改：

- `.git/` 内部文件（commit 操作除外）
- `archive/`（历史快照只读）
- `status/`（自动生成，编辑上游源文件）
- `node_modules/`, `vendor/`, `.next/`, `.playwright-cli/`, `.codex/`, `.swarm/`, `.claude-flow/` 等工具产物

## §6 启用与撤销

- 本文件 2026-05-12 起生效。
- 撤销或重写本文件需要用户手动 git commit，commit message 含 `[CHARTER]` 标记。
- AI 在每次会话开始读 MANIFEST.md 之前，先确认 CHARTER.md 文件存在；不存在时立刻提示用户。


