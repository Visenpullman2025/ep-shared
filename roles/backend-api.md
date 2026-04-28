# 角色：Backend API / 履约内核负责人

最后更新：2026-04-28（P0.5 合同收敛批次）

## 职责边界

- 维护 **expatth-shared** 中 **HTTP 合同**（`api/user-api`、`api/merchant-api`）、**需求池**（`api/requests.md`）、**已落地目录**（`api/registry.md`）、**状态机**（`docs/state-machine.md`）、**数据计划**（`db/*`）与**错误语义**（`api/error-codes.md`）**一致**。  
- 对现网 `expatth-backend` 路由**只读**对账，**不**在 shared 中写**实现**细节代码块（可指 `实现位置`）。

## 当前进度

- **P0.5 合同收敛（本轮）**：新主链 **C/M 端**路径与字段、**R-20260428-005…017** 状态、**旧/新 `workflow` 映射策略**、**`nextAction`** 定位、**`EX_*` 错误语义**、**`registry` 的 implemented / compatibility / planned** 区分、**`yipai_orders` 外键** 与 **`yipai_order_process_data`** 说明、**`schema-plan` / `migration-map`** 已更新。  
- **不**做 Laravel 实现、**不**写 migration、**不**改业务代码（本轮）。

## 本轮已完成事项（P0.5）

- 收敛 **R-20260428-005 至 017**（不删条；补 **待决策点**；**总览表**见 `requests` 文尾）。  
- 在 **user-api / merchant-api** 中明确 **P0.5 实现与联调** 边界（何者可联调、何者**仅**合同）。  
- 更新 **state-machine**：**统一**订单主态/候选/ MQC 状态；**§4** 现网 → 目标映射**策略**；**§6** `nextAction`。  
- 更新 **error-codes** §3：上述场景下 **`EX_*` 建议码**。  
- 更新 **registry**：**planned** 总表 + 与 **compatibility** 的清晰区分。  
- 更新 **db/schema-plan、db/migration-map**（**含** `yipai_order_process_data` 的**仓库内**事实说明、**`yipai_orders`** 四外键/引用）。  
- 更新 **fulfillment-flow、migration-plan、internal-api、roles/本文**。

## P1 实现前置条件（下一轮的门槛）

- **`api/requests.md`** 中 **R-** 为 **`accepted` 的条目** 与 **产品** 对**待决策点**（一订单多 MQC、售后子枚举、**availability** JSON 形状、`legacyWorkflowStatus` 是否暴露 等）**过评审**。  
- **`OrderWorkflowService` 或** 等价**单源** 中落地 **R-20260428-010** 映射，**不**在控制器**散落**判断。  
- 路由**按合同** 注册后，在 **registry** 将 **planned** 项**拆** 为**分条** `implemented`（或**标注** 灰度**开关**说明）。  
- 错误码 **`EX_*` 在** `lang` 与**响应**体**可稳定** 分支，并**对** 前端/QA **宣导**（见 **error-codes** 与 **requests**）。

## 禁止事项

- **不得**在**未**经 **requests** 登记（无 **`accepted` 或** **等价**书面评审）的情况下，在**现网** **直接**加路由、**直接** 改**对外** JSON 契约。  
- **不得**在 **Glossary 之外** 新造**主**业务概念。  
- **不得**在 **P0.5 文档任务** 中夹带 **Laravel/Next 业务** 改码 或 **migration**。

## 依赖

- **用户端**：BFF/页面 与 **`user-api` §0.1** 对齐；**不得** 把 **planned** 当**已**联调。  
- **商家端**：**planned** 能力/待办/确认 **路径** 以 **`merchant-api` § P0.5** 与 **R-20260428-013/014/016** 为纲。

## 最近一次同步结论

- **P0.5**：**不可** 对**新主**标准/模板/粗报/认价/M**端** 能力/待办 **做** 真实 **E2E 联调**（**无**现网路由/或**未**接**）；**可** 对**旧** `services*`**、** **旧** 下单/订单列表/ **payments/intent** 继续**按 **registry** 联调。次轮 **P1** 以 **实现 + registry 更新** 为**完成**标志。
