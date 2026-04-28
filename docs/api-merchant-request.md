# 商户端 API 需求池

最后更新：2026-03-30

> **接口状态**见 **[api-merchant-list.md](api-merchant-list.md)**。  
> **路径更名对照（给前端）**见 **[frontend-api-renames.md](frontend-api-renames.md)** §二。  
> 客户端询价/下单见 **[api-user-list.md](api-user-list.md)**。  
> 端到端步骤见 **[project-flow.md](project-flow.md)**。

## 发布给后端（需求口径）

凡需要 **后端提供或变更商户侧 API**（新路由、字段、错误码、业务门禁、兼容策略），**发布需求请写在本文件**，而不是其它渠道：

1. **写在哪**：优先追加到下方 **「当前需求区（商户）」** 条目标列表；复杂条目可另起 **「历史按日记录」** 下当日小节（`### YYYY-MM-DD`），写清背景、接口草案、验收与联调备注。
2. **建议写清**：HTTP 方法与路径、请求/响应要点（字段名以后端实现为准时可写「待后端确认」）、失败场景（HTTP 状态与 `code`/`message` 若已知）。
3. **落地后**：由维护者在 **api-merchant-list.md** 更新「已上线/联调结论」，并在本条目标记「已完成」或移到按日摘要，避免 request 与 list 长期矛盾。前后端对齐以 **本仓库文档 + 代码 + 实际联调** 为准。

## 当前需求区（商户）

- **订单动作（推荐）**：`confirm` / `start-service` / `finish-service` / `cancel`；兼容 `transition` + `targetStatus`。
- **付款门禁**：`start-service` 前须客户已付；服务中取消扣罚约 20%（见 `lang/*/merchant_api.php`）。
- **开放日**：`GET/PUT /api/v1/merchant/availability`；与用户端 `bookable-days`、自动商家确认联动见 **project-flow**。
- **服务 CRUD**：`merchant/categories`、`process-templates/{code}`、`merchant/services`；`processTemplateCode` 须属所选 `categoryCode`。
- **评价客户**：建议接口 `POST /api/v1/merchant/reviews`（待后端注册，与用户侧对称）。

## 历史按日记录

原 **api-request.md** 内 **epmerchant / 商家端 Stage2 / 多服务** 等大段流水 **未全文搬迁**。考古请查 git 中删除前的 `shared/docs/api-request.md`，或将仍有效条目按日期追加到本节。

---

### 摘要（摘自原文件，便于检索）

- **2026-03-31**：`merchant/onboarding` 已删；类目以 `GET /api/v1/merchant/categories` 为准。
- **2026-03-30**：商户保存服务按 `locale` 补全 `title_i18n` / `description_i18n`（AI 可选）。
- **商家端接入顺序**：`merchant/profile` → `merchant/categories` → 必要时 `POST profile` 写 `serviceTypes` → 选模板 → `POST merchant/services` → 用返回的 `createDataUrl` 等衔接 C 端。
