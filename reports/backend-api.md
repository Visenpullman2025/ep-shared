# Backend API 工作报告

状态：P1a 已完成（StandardService / RequirementTemplate / QuotePreview 最小骨架）。

## 1. 本轮目标

- 按 `.cursorrules` **P1a**：**最小可读骨架**，优先 **StandardService**、**RequirementTemplate**、**QuotePreview**（落库 + 可联调 API）。
- 实现位置：`expatth-backend`（迁移、模型、控制器、复用 `ServiceProcessPricingService` 粗算价、分类种子）。
- 同步 **expatth-shared**：`api/registry.md`、`api/requests.md`（R-005～007）、`api/user-api.md`（§0.1）、本报告。

## 2. 修改文件清单

| 文件路径 | 操作 | 说明 |
|---|---|---|
| `expatth-backend/database/migrations/2026_04_28_150434_create_yipai_standard_services_table.php` | 新增 | 标准服务表 |
| `expatth-backend/database/migrations/2026_04_28_150435_create_yipai_requirement_templates_table.php` | 新增 | 需求模板表 |
| `expatth-backend/database/migrations/2026_04_28_150436_create_yipai_quote_previews_table.php` | 新增 | 粗报价快照表 |
| `expatth-backend/app/Models/YipaiStandardService.php` | 新增 | |
| `expatth-backend/app/Models/YipaiRequirementTemplate.php` | 新增 | |
| `expatth-backend/app/Models/YipaiQuotePreview.php` | 新增 | |
| `expatth-backend/app/Services/Common/StandardServicePreviewService.php` | 新增 | 粗报价落库 + 接计价 |
| `expatth-backend/app/Http/Controllers/Api/V1/StandardServiceController.php` | 新增 | 四接口 |
| `expatth-backend/database/seeders/StandardServiceP1aSeeder.php` | 新增 | 从 `yipai_service_categories` 造标准行与模板 |
| `expatth-backend/routes/api.php` | 修改 | 注册 `standard-services*` |
| `expatth-shared/api/registry.md` | 修改 | P1a 四接口 **implemented** + 总述 |
| `expatth-shared/api/requests.md` | 修改 | R-005/006/007 **implemented** + 总览表 |
| `expatth-shared/api/user-api.md` | 修改 | §0.1 与 P1a 联调条件 |
| `expatth-shared/reports/backend-api.md` | 修改 | 本报告 |

## 3. 明确未修改范围

- **未** 做 P1b（`POST /orders` 新体）、P1c（**MerchantCapability** / **Candidate** / **MQC**）、P1d（状态映射/支付闸口/售后 HTTP）。
- **未** 改 `OrderController`、**未** 给 `yipai_orders` 加列（P1b+）。
- **未** 新增 `api/requests.md` 的 **R-** 号（**未** 使用 **R-20260428-021**）。

## 4. api/requests.md 变更

| R 编号 | 标题 | 操作 | 状态 |
|---|---|---|---|
| R-20260428-005 | 标准服务列表+详情 | 状态改为 **implemented**；补 **关联代码** | implemented |
| R-20260428-006 | requirement-template | 同上 | implemented |
| R-20260428-007 | quote-preview | 同上 | implemented |
| 其他 R- | - | 无 | - |

## 5. 编号校验

- 修改前 `api/requests.md` **维护** 段写明的**下一新号**为：**R-20260428-018**（在 **R-017** 之后追加时）。
- 本轮**未**新增 R- 条目，**无** 新编号落地。
- **无** 重复编号。

## 6. 合同变更

| 合同文件 | 变更点 | 是否已同步 requests |
|---|---|---|
| `api/user-api.md` | §0.1：P1a 路由**可**联调；**须** migrate + seeder | 是（R-005～007 已 **implemented**） |
| `api/registry.md` | 四接口 **implemented** 分条 | 是 |

## 7. 现网可联调 / 不可联调

**可联调**（部署本后端并 **migrate** + **`php artisan db:seed --class=StandardServiceP1aSeeder`** 后）：

- `GET /api/v1/standard-services`
- `GET /api/v1/standard-services/{code}`
- `GET /api/v1/standard-services/{code}/requirement-template`
- `POST /api/v1/standard-services/{code}/quote-preview`（body 须含**非空** `requirementPayload`；结构需与 **question_template** 计价及 `processData` 习惯兼容）

**仍不可** 作为**完整**新主链 E2E：

- `POST /orders` **仅** 新体（P1b）
- `confirm-merchant-quote`、**after-sales**、**merchant** 能力/待办/**MQC**（P1c/P1d）
- 订单 **GET** 的 **R-012** 扩展块（未做）

## 8. 只读检查范围

| 仓库 | 文件/模块 | 发现 |
|---|---|---|
| `expatth-backend` | `ServiceProcessPricingService` | P1a **复用** 现有 **question_template** 策略；非该策略仍 **422**（与旧行为一致） |
| `expatth-shared` | `db/schema-plan.md` | 未**强制**改文；**表**与实现**一致**（`yipai_*` 前缀） |

## 9. 阻塞点

| 阻塞点 | 影响角色 | 需要谁处理 | 对应 R 编号 |
|---|---|---|---|
| 无 | - | - | - |

## 10. 下一步建议

- **P1b**：`POST /api/v1/orders` 接 **`standardServiceCode` + `requirementPayload` + `quotePreviewId`**，**`yipai_orders`** 加外键列；**旧** `serviceId` **保留** 兼容。  
- **P1c**：**MerchantCapability** 表 + 商家 **HTTP** 最小闭环。  
- **BFF/前端**：在 **expath** 将入口从**仅** `serviceId` 迁到 **`standardServiceCode`**（在 **api/requests** 中**另开** R- 条，**自 R-20260428-018 起** 按**维护**段编号）。  
- 部署检查清单：**migrate** → **StandardServiceP1aSeeder**（或**等价**导数）→ 打 `GET /api/v1/standard-services` 验 **200**。
