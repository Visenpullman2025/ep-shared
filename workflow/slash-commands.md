# Slash Commands

> 项目内对话命令清单。各 AI 客户端按本表实现或映射。
> 最后更新：2026-05-12

## §1 工作流命令（操作 shared 文件）

| 命令 | 输入 | 动作 |
| ---- | ---- | ---- |
| `/spec` | 需求描述 | 在 api/requests.md 新增一条 R-YYYYMMDD-NNN，status=draft |
| `/work` | R- 编号 | 按 MANIFEST 加载上下文，执行该需求，完工后更新 R- 状态 |
| `/audit` | 越界描述 | 在 `data/violations.json` 新增一条 V-YYYYMMDD-NNN |
| `/status` | 无 | 重新生成 status/* 投影（迁移完成后启用） |

工作流命令必须遵守 ai-protocol.md 的入场与完工动作。

## §2 对话辅助命令（保留旧版）

文档型命令，AI 按内容响应，不改文件：

| 命令 | 文档来源 | 用途 |
| ---- | -------- | ---- |
| `/help` | ../help.md | 项目快速帮助 |
| `/expatth-help` | docs/EXPATTH_HELP.md（待建） | 详细启动 / 检查命令 |
| `/topcheck` | ../help.md | 顶级视角审查当前任务表达，给出更专业的下一句任务命令 |
| `/topro` | ../help.md | 长需求压缩成可执行任务：范围、目标、约束、验收 |
| `/teamwork` | ../help.md | 判断是否并行；适合时拆写集、依赖、验收 |
| `/codecheck` | ../help.md | 代码审查模式：bug、风险、回归、缺失验证 |
| `/logerror` | ../help.md | 记录真实失败原因、影响范围、修正动作、防复发 |

## §3 命令归属

工作流命令（§1）操作 shared 文件，**所有 AI 客户端都必须实现**或映射等价命令。

对话辅助命令（§2）是叙述型，AI 按对应文档内容响应即可。

## §4 新增命令

新增工作流命令必须：

1. 写进本文件
2. 明确读写哪些 shared 文件
3. 经用户审阅后合入
4. AI 不擅自启用未登记的命令
