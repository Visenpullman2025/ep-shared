# AI Protocol

> 任何 AI 协作伙伴（Codex、Claude Code、Cursor、Gemini CLI、其他）加入本项目时遵守的协议。
> 最后更新：2026-05-12

## §1 入场顺序

会话开始，AI 必须依次：

1. 读 CHARTER.md（确认存在；不存在时立刻提示用户）
2. 读 MANIFEST.md
3. 读 CONSTITUTION.md
4. 读 NAMING.md
5. 根据本次任务匹配 MANIFEST §L1，读对应触发文件
6. 宣布本次任务范围

入场报告格式：

```
任务：<一句话目标>
影响仓库：ep / epmerchant / epbkend / ep-shared
预计修改：<文件列表>
依赖 R-：<R- 编号或 N/A>
```

报告完毕用户没有反对再进入实现。

## §2 修改边界

AI 在单次会话**可改**：

- apps 内业务代码（按 CONSTITUTION §4、§5）
- docs/* 内容（除自动生成文件）
- api/requests.md（新增 R- 或更新状态字段）
- 越界审计文件（按 §3 第 2 条）

AI 改前需用户**明确授权**：

- CHARTER §2 修改门禁清单中的文件
- 任何标记 `<!-- locked -->` 的文件

AI **永不可改**：

- CHARTER.md（任何方式，参见 CHARTER §1）
- CHARTER §5 列出的不可触碰区域

## §3 完工动作

任务完成前 AI 必须：

1. 更新对应 R- 状态字段，或新增 R- 到 api/requests.md
2. 如有越界，按 NAMING §2 §3 在 `data/violations.json` 新增 V- 条目
3. 跑 CONSTITUTION §8 对应的验证命令，如实报告结果（包括失败）
4. 列出本次修改文件清单
5. 留 git commit，commit message 含相关 R- / V- 编号

未完成项以"待办"形式留在回复，不写入 R- `status=implemented`。

## §4 多 AI 协作

- 多个 AI 不互相分派任务卡，不通过 dashboard 接力。
- 每个 AI 独立读 ep-shared，端到端跑完自己的切片。
- 协调由项目所有者负责，AI 之间不直接通信。
- 如需并行，由当前 AI 内部 subagent 派发，不外包给外部 AI 实体。

旧的 `Codex 当规划师、Claude 当工人`模式废弃，原因见 2026-05-12 复盘。

## §5 审计模式（L2）

进入 L2 的条件（来自 MANIFEST §L2）：

- 用户要求审计
- 测试失败
- 跨仓库合同变更
- 数据库变更
- 文件超出 CONSTITUTION §7 行数门禁

L2 任务必须：

- 读 `data/violations.json` 全部 `open` 条目
- 报告新发现越界（哪怕用户没问到）
- 不立刻修代码，先列影响面，等用户裁决

## §6 冲突处理

- 规则文件之间冲突：按 CHARTER §4 仲裁
- 规则与代码现状冲突：先停下记录，不擅自修任一方
- 规则与用户对话冲突：先反问澄清
- 跨 AI 历史结论冲突：以 git log 上 ep-shared 的最新 commit 为准

## §7 不可妥协的拒绝

下列情况 AI 必须明确拒绝执行，并说明理由：

- 修改 CHARTER.md
- 跳过 CONSTITUTION §3 API 闸门
- 在测试失败时声称完成
- 在前端硬编码后端规则（CONSTITUTION §5 禁止项）
- 任何要求"先做再说"的指令

拒绝后，AI 给出"按规则应该怎么做"的建议路径。
