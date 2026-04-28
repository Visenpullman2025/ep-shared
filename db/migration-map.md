# 现表 → 目标语义 映射表（P0.5，无 DDL）

最后更新：2026-04-28

> **不执行** DDL。  
> 关于 **`yipai_order_process_data`**：在 `expatth-backend/database/schema/mysql-schema.sql` 当前快照中**未**出现**该表名**。若**其他**环境或历史曾用，**建议**在调研后：  
> - 若**等同**大字段/流程：并入 **`yipai_order_details`** 中的 **`process_payload` / 扩展 JSON** 与目标 **RequirementPayload** 语义，**或**  
> - 若**独立**存在：在 P1 评审是否**归并**到 `yipai_order_details` / **新**窄表。  
> **P0.5 不在此** 发明非本仓库 schema 的列名。

## 1. 商家端旧配置

| 现表 / 能力 | 结论 |
|-------------|------|
| **`yipai_services`** | **不删**。**降级**为**旧**「商家服务配置/上架行」；**不**是用户侧**标准**服务入口。往 **`merchant_capabilities`** 与 **StandardService** 映射/迁移。 |
| **`yipai_service_categories`** | 可作为 **`standard_services`** 的**类目/运营****迁移来源**（`category_code`、图、排序）。 |
| **`yipai_service_process_templates`** | **不删**。**RequirementTemplate** 的**形式**多来自 **form_schema** 等；**拆** 到 **`requirement_templates`** 在 P1+ 设计。 |

## 2. 订单与过程数据

| 现表 | 结论 |
|------|------|
| **`yipai_orders`** | **加** 下列**外键/引用**（**允许**先可空、后 NOT NULL 策略由 P1 定）：**`standard_service_id`**、**`quote_preview_id`**、**`selected_candidate_id`**、**`merchant_quote_confirmation_id`**。与现 **`primary_service_id`**、**`process_template_id`** **并存** 一段兼容期。 |
| **`yipai_order_details`** | **继续** 作 **1:1 快照**；`process_payload` 即 **RequirementPayload** 的**已提交**视图之一；`pricing_snapshot` 参与 **与 Preview/MQC** 对账。 |
| `yipai_order_process_data`（若存在他处） | 见**文首**；**不**在 P0.5 与 **`yipai_order_details` 冲突**发明第二套。 |

## 3. 目标表与现网关系

| 目标表 | 来源/衔接 |
|--------|------------|
| `standard_services` | 新表 + 类目/运营导入 |
| `requirement_templates` | 自 **process_templates** + **standard_services** |
| `quote_previews` | 新；替代「仅**内存**的 price-preview」**长期**需落库 |
| `merchant_capabilities` | 新；承接 **`yipai_services`** 与 **standard_services** 的**绑定** |
| `merchant_candidates` | 新；匹配引擎写 |
| `merchant_quote_confirmations` | 新；商家**终局**确认 |
| `after_sales_cases` / `merchant_credit_*` | 新或**部分**由运营表扩展 |

## 4. 外键**语义**与**多** MQC

- **`merchant_quote_confirmation_id` 在 **订单** 上**若**业务允许多条**历史** MQC：  
  - **A**：订单上只挂**「当前**有效**」**一条，历史在**确认表**查；**或**  
  - **B**：不挂**单**外键、仅 **`order_id` + `status` 在 MQC 表**筛「当前条」。  
- **P0.5 待决策**；**不**在 migration-map 定死 **A/B**，在 **R-20260428-009/014** 产品拍板。

## 5. 其它

- **`yipai_merchants`**、支付、评价、钱包：不删；**信用** 以 **`merchant_credit_*`** 衔接。
