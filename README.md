# ep-shared

ExpatTH 多仓库共用的合同、术语、状态机、数据库计划、规则和审计。本目录不放运行时代码。

## 入口

任何 AI 会话开始读：

1. [CHARTER.md](CHARTER.md) — 最高法
2. [MANIFEST.md](MANIFEST.md) — 入口索引

人类协作者也从这两份开始。后续按 MANIFEST 的 L1 触发表读取。

## 目录

| 路径 | 内容 |
| ---- | ---- |
| CHARTER.md | 最高法，文件主权、不可妥协原则、冲突仲裁 |
| CONSTITUTION.md | 项目规则总纲 |
| MANIFEST.md | 入口索引与触发阅读表 |
| NAMING.md | 文件、ID、状态、API 字段命名规范 |
| workflow/ | AI 协议、斜杠命令 |
| docs/ | 业务词、边界、状态机、流程、产品方向 |
| api/ | 合同（user / merchant / internal）、需求池、已实现目录、错误码 |
| db/ | 表结构计划、迁移地图 |
| rules/ | 规则成长候选脚本 |
| data/ | 越界审计（violations.json） |
| archive/ | 历史快照，仅供查阅 |
| STATUS.md | 项目所有者维护的现状速览 |

## 与代码仓库的关系

本目录是 `ep`、`epmerchant`、`epbkend` 三个业务仓库的合同总线。三个仓库各自的 `AGENTS.md` 和 `.cursorrules` 都指向本目录的 MANIFEST.md。
