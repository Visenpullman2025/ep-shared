# Backend API / Shared 核心边界

最后更新：2026-04-28

## 1. 本边界的职责

- 定义**平台可发布的 HTTP API** 与数据语义（面向用户端、商家端、运营后台的开放接口），以及 **Shared 层** 使用的业务词表与状态方向。
- **不负责**：具体 Laravel Controller 实现、Next 页面、数据库 migration 落库（P0 文档只写**计划**）。

## 2. 目标主链路（与实现阶段解耦）

1. 用户选择 **平台标准服务** `standardServiceCode`（**StandardService**）。
2. 系统按 **RequirementTemplate** 采集，用户提交 **RequirementPayload**。
3. 系统生成 **QuotePreview**（粗略报价，非最终成交价）。
4. 系统据 **MerchantCapability** 等匹配 **MerchantCandidate**。
5. 商家在 **MerchantQuoteConfirmation** 上确认最终价与服务时间等。
6. 用户确认 → 支付或预授权 → 履约 → 售后 / 评价 / 信用。

旧链路中「先锁定某一商家的 `yipai_services` 行再下单」在文档上**降级**为**兼容/过渡**形态；**新主入口**不得继续以**商家服务 ID** 作为用户侧唯一主键心智。

## 3. 七个核心概念（必须冻结用词）

| 内部固定名 | 角色 |
|------------|------|
| **StandardService** | 平台标准服务、用户端入口，**不归属**于某一商家。 |
| **RequirementTemplate** | 需求采集模板（字段、步骤、与计价/工作流可衔接）。 |
| **RequirementPayload** | 用户一次提交的需求数据。 |
| **QuotePreview** | 系统**粗**报价，可含区间或分项，**不等于**商家最终价。 |
| **MerchantCapability** | 商家声明的**可承接能力**（与标准服务、地区、项类等的绑定）。 |
| **MerchantCandidate** | 匹配阶段产生的**候选**商家，含生命周期状态。 |
| **MerchantQuoteConfirmation** | 商家对**最终金额与服务条件**的确认（含可审计状态）。 |

禁止混用其它英文词作同一层叙事（如把 StandardService 说成 “catalog product”）。**禁止**在核心业务叙述中使用：`product`、`goods`、`item`（作商品义）、`listing`、`shop_service`、`service product`（表义合并见 `rules/deprecated-terms.md`）。

## 4. 「旧 service」的降级定义

- 数据库表 **`yipai_services`** 及现网路由 `GET/POST /api/v1/merchant/services*`、访客 `GET /api/v1/services*` 所指的 **service** = **商家侧服务配置**（可视为 **MerchantCapability** 的载体/历史实现），**不是**用户长期心智上的「平台标准品」。
- 用户端 **`standardServiceCode`** 对应将落在 **`standard_services`** 等（见 `db/schema-plan.md`），与商家配置表通过映射与能力表衔接；**P0 不改路由只写文档**。

## 5. 文档与代码谁说了算

- **P0**：以 **本目录 + 后端现网路由** 对齐「已实现」事实，以 **glossary + state-machine** 对齐目标语义；有缺口一律进 **`api/requests.md`**，不在控制器或前端各自发明状态名。
