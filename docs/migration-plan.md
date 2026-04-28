# 迁移计划（文档级 P0 / P0.5）

最后更新：2026-04-28

> **P0、P0.5 不写 migration、不改业务代码**；本文件只定阶段、依赖与**语义**落点。表与字段细节见 [db/migration-map.md](../db/migration-map.md) 与 [db/schema-plan.md](../db/schema-plan.md)。

**P0.5（本批次）**：`api/user-api` / `merchant-api` 与 `requests` **R-20260428-005…017**、**`state-machine`** 映射**策略**、**`error-codes` EX_*** 语义已**收敛**；**仍不**在现网**注册** 新**标准**路由（**除** 已有 implemented 的**老**路）。

## 1. 阶段划分（建议）

| 阶段 | 内容 | 产出物 |
|------|------|--------|
| P0 | 词表、边界、目标状态、需求池、计划表 | 本文档体系、`api/requests.md` |
| P1 | 标准服务与模板的配置层、只读/灰度 API | 路由与合同更新（先经 requests） |
| P2 | 粗报价/候选/商家确认 与 订单主键关联 | 订单上挂 `quote_preview_id`、`selected_candidate_id`、`merchant_quote_confirmation_id` 等 |
| P3 | 用户主路径切到 `standardServiceCode`；旧 `serviceId` 流标记 compatibility | 前端与 BFF、监控 |
| P4 | 售后/信用/评价与统一状态枚举收尾 | 数据与报表 |

## 2. 风险与依赖

- **词表不统一**会导致前后端、报表、客服话术分叉；**唯一入口**为 `docs/glossary.md` + `api/requests.md` 已接受需求。
- **旧** `yipai_services` **保留**，业务侧须持续承认其为**商家配置**而非**平台标准品**。
- 支付/结算与**预授权**若与现钱包流并存，需单独需求条目与对账设计。

## 3. 完成判据（P0）

- [x] 七个核心词与**禁用**词在 shared 中成文。  
- [x] 目标主流程与**目标**订单/候选/确认 状态有定义。  
- [x] `api/requests.md` 接收合并后的缺口与**标准服务**向需求草稿。  
- [x] `api/registry.md` 标注现有接口与 **compatibility** 位。  
- [ ] 实现 P1+（**不在** P0 范围）。
