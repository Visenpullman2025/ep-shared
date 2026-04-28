# 人机协作文档（Cursor / Agent）

最后更新：2026-04-28

> 在任意应用仓库中，若将本目录挂载为 `shared/`，**建议**在**该仓库**的 `.cursor/rules` 或 `AGENTS.md` 中**加一条**指向本文件与 `api/requests.md`，**不必**在 shared 里重复写全栈规则。

## 1. 对 Agent 的硬约束

1. **先需求后改约**：要改**对外 HTTP**（新路由/字段/错误体），在 **[api/requests.md](../api/requests.md)** 增加或推进 **R-** 条；**不**在实现 PR 中静默发明契约。
2. **不发明业务词**：新**产品**向的概念须先进 **[../docs/glossary.md](../docs/glossary.md)**。
3. **状态唯一源**：订单/候选/确认 的状态字以 **[../docs/state-machine.md](../docs/state-machine.md)**（目标）与**后端**最终枚举为准；**不**在控制器/前端/文档**各写一版**不对照的字符串。
4. **P0**：**不写 migration、不改** Laravel/Next 业务**实现** 若任务仅为文档（见 **roles/backend-api.md**）。

## 2. 仓库分工记忆

- **本目录（expatth-shared）**：**唯一** 被本规则称为 **Shared 文档** 的权威（若多副本以**同 git 源**或锁版本为准）。  
- **expath-frontend、epmerchant、epservice 等**：实现与联调**事实**以代码为准，但**新叙事**以 shared **glossary** 为纲。

## 3. 完成一项需求后的操作

- 在 **R-** 条把 **状态** 改为 `implemented`；在 **[api/registry.md](../api/registry.md)** **追加**一行接口块；在 **glossary** 有新增则已更新。

## 4. 与 plain-language 约定

- 中文**少用**空泛管理词，写清**谁、做哪步、写哪份文件、是否挡下一动作**；细则见原 **docs/project-flow.md** §8 若被引用，新主文以 **docs/boundaries.md** 为入口。
