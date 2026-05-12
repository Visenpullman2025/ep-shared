# NAMING

> 文件、目录、ID、状态值的命名规范。新增任何条目前对照本文件。
> 最后更新：2026-05-12

## §1 文件命名

| 类型 | 规则 | 示例 |
| ---- | ---- | ---- |
| 顶层治理 | UPPERCASE.md | CHARTER.md, CONSTITUTION.md, MANIFEST.md, NAMING.md, README.md, AGENTS.md, STATUS.md |
| 仓库根入口 | 同上 | AGENTS.md, README.md, .cursorrules |
| 子目录内容 | lowercase-with-hyphens.md | state-machine.md, schema-plan.md, ai-protocol.md |
| 自动生成 | 放在 `status/` 目录，首行写 `<!-- auto-generated: do not edit -->` | status/README.md |
| 历史快照 | `archive/YYYY-MM-DD-<topic>/` | archive/2026-04-28-P0.5/ |

禁止：

- `*-final.md`、`*-new.md`、`*-v2.md`、`scratch.md`、`temp.md`
- 同一概念的多份等价副本
- 中文文件名（除非工具特殊需要）

## §2 ID 命名

| 域 | 格式 | 示例 |
| -- | ---- | ---- |
| 需求 | `R-YYYYMMDD-NNN` | R-20260512-001 |
| 越界 | `V-YYYYMMDD-NNN` | V-20260512-001 |
| 错误码 | `EX_UPPER_SNAKE` | EX_QUOTE_EXPIRED |
| Skill 候选 | `SC-YYYYMMDD-NNN` | SC-20260512-001 |
| 任务（已废）| `T-*` | 不再创建；旧条目按现状保留 |

`NNN` 从 001 开始，同日内顺序递增。

## §3 状态枚举

| 域 | 枚举值 |
| -- | ------ |
| 需求 R- | `draft`, `proposed`, `accepted`, `implemented`, `rejected` |
| 越界 V- | `open`, `fixed`, `accepted-temporary` |
| API registry | `implemented`, `planned`, `compatibility`, `deprecated` |
| Skill 候选 SC- | `candidate`, `promoted`, `rejected` |

**状态字段后禁止跟自由文本备注**。备注另起一字段。

错误示例：

```
- 状态：implemented（P3：已接好评广场）
```

正确示例：

```
- 状态：implemented
- 备注：P3 已接好评广场
```

`accepted-temporary` 必须额外写"删除条件"字段。

## §4 日期格式

ISO 8601：`YYYY-MM-DD`。

不接受：`2026/5/12`、`May 12, 2026`、`26-5-12`、`20260512` 单独使用。

ID 内的日期段使用紧凑形式 `YYYYMMDD`（无连字符）。

## §5 API 字段

- JSON 响应字段默认 `camelCase`
- URL 路径 `kebab-case`
- 查询参数 `camelCase`
- 错误码 `EX_UPPER_SNAKE`

如必须使用 `snake_case`（兼容旧后端），必须在 api/requests.md 或 api/registry.md 里登记。

## §6 仓库内入口

各仓库根的 AGENTS.md 与 .cursorrules：

- 长度 ≤ 10 行
- 只写：仓库身份、技术栈、向 `../ep-shared/MANIFEST.md` 的指针
- 不重复写规则正文
- 不重复写"必读清单"（MANIFEST 承担）

旧版（每个仓库重复列必读清单）应在迁移阶段统一砍掉。
