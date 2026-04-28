# 已弃用/禁用业务词

最后更新：2026-04-28

> 在 **shared 文档、`.cursorrules` 级约定、对同事说明** 中，描述**本平台交易对象**时**禁止**用下列词替代 **Glossary 七词** 或 `standardServiceCode`（见 [../docs/glossary.md](../docs/glossary.md)）。  
> **不**管数据库历史列名（如 `yipai_services`）在代码里怎么叫，**对人与对外叙事**以本表为准做替换。

| 禁词/短语 | 改用 |
|-----------|------|
| product | StandardService 或 商家**服务配置** / **服务项**（若指 yipai_services 行，明说表或配置） |
| goods | 同左 |
| item / listing（在「商品/上架」义上） | StandardService 或 商家**上架配置**；列表项 technical 的 `line item` 在发票/对账**专用**可保留并注明 |
| shop_service | MerchantCapability 或 商家**店铺内服务配置**（旧路径） |
| service product | StandardService 或 分开写「**标准** / **服务** / **配置**」 |

**允许**：HTTP 方法名、`api-list`、`locale`、**数组元素** 口语称「项」、代码变量名 `orderItem`（若指技术结构而非「商品」义）。

**旧文档**中若仍出现上列词，新稿**不**再沿用；修订旧段时**顺带替换**为 Glossary 语言。
