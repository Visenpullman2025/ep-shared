# User Frontend 工作报告

状态：**P1a 已完成**（2026-04-28）

## 1. 本轮目标

- 按 `.cursorrules` **E** 与 `roles/user-frontend.md` 实施 **P1a**：只读接入 **StandardService** 列表/详情、**RequirementTemplate**、**QuotePreview**（`POST …/quote-preview` 生成与展示），**不**改 `POST /api/orders` 主路径、不创建新订单。

## 2. 修改文件清单

| 文件路径 | 操作 | 说明 |
|---|---|---|
| `expath/src/app/api/standard-services/route.ts` | 新增 | BFF → `GET /api/v1/standard-services` |
| `expath/src/app/api/standard-services/[code]/route.ts` | 新增 | BFF → `GET /api/v1/standard-services/{code}` |
| `expath/src/app/api/standard-services/[code]/requirement-template/route.ts` | 新增 | BFF → `GET …/requirement-template` |
| `expath/src/app/api/standard-services/[code]/quote-preview/route.ts` | 新增 | BFF → `POST …/quote-preview` |
| `expath/src/app/[locale]/standard-services/page.tsx` | 新增 | 标准服务列表（`standardServiceCode` 入口） |
| `expath/src/app/[locale]/standard-services/[code]/page.tsx` | 新增 | 标准服务详情 |
| `expath/src/app/[locale]/standard-services/[code]/quote/page.tsx` | 新增 | 需求表单 + 粗报价结果（P1a 不建单） |
| `expath/src/lib/requirement-form.ts` | 新增 | 模板字段与 `RequirementPayload` 构建（与旧 `formSchema` 对齐） |
| `expath/src/lib/standard-services.ts` | 新增 | `standardServiceCode` / 标题展示别名回退 |
| `expath/src/app/[locale]/page.tsx` | 修改 | 首页增加「标准服务（新）」入口 |
| `expath/src/messages/zh.json` / `en.json` / `th.json` | 修改 | `Home.standardServicesEntry` + `StandardServices` 命名空间 |
| `expatth-shared/api/requests.md` | 修改 | **R-018** 补充 P1a 已落地关联代码与范围说明（**不**新设 R 号） |
| `expatth-shared/reports/user-frontend.md` | 修改 | 本报告 |

## 3. 明确未修改范围

- **未**改 `POST /api/orders`、**未**改 `orders/new` 旧 `serviceId` 主链、**未**接 P1b/P1c/P1d。
- **未**改 `expath` 外其他仓库；**未**改 `api/user-api.md` 合同正文（合同已先于实现存在）。
- **未**在 `api/requests.md` 追加 **R-20260428-020+** 新条（无新缺口需单独编号）。

## 4. api/requests.md 变更

| R 编号 | 标题 | 操作 | 状态 |
|---|---|---|---|
| R-20260428-018 | 用户端 BFF 与 user-api 新路径对齐 | **补充**「关联代码」与 P1a 完成边界（BFF+页面已落地；POST orders 仍 P1b） | proposed（子范围已落地） |
| — | 其他 R 条 | 无新增、无删除 | 不变 |

## 5. 编号校验

- 修改前读取到的下一 `R-` 编号（维护段）：**`R-20260428-020` 起**。
- 本轮实际新增编号：**无**（仅补充 **R-018** 正文）。
- 是否存在重复编号：**否**。

## 6. 合同变更

| 合同文件 | 变更点 | 是否已同步 requests |
|---|---|---|
| `api/user-api.md` | 无（本轮不改合同） | N/A |
| `api/requests.md` | 仅 **R-018** 执行跟踪补充 | 是（同文件内） |

## 7. 现网可联调 / 不可联调

可联调（取决于 **BACKEND_API_BASE** 已注册路由）：

- 从 expath 访问 **`/api/standard-services**、**`/api/standard-services/{code}`**、**requirement-template**、**quote-preview`（经 BFF 透传）。

不可联调 / 风险：

- 若上游 **尚未** 实现 `GET/POST /api/v1/standard-services*`，BFF 将透传 **404/502**；列表/详情/报价页会显示错误或空态，**属预期**，待后端 **registry** 标为 implemented 后重验。

## 8. 只读检查范围

| 仓库 | 文件/模块 | 发现 |
|---|---|---|
| `expath` | 现有 `api/services/**`、`orders/new` | 旧链保留；新链并行于 `/standard-services` |
| `expatth-shared` | `api/registry.md` | 标准服务上游仍为 **planned** 时，前端仅完成 BFF+UI |

## 9. 阻塞点

| 阻塞点 | 影响角色 | 需要谁处理 | 对应 R 编号 |
|---|---|---|---|
| 上游未部署 `standard-services` 路由 | 用户端联调、QA | Backend 按 **registry** 与合同实现 | R-005～007 等（见 requests） |
| 粗报价 body 与模板字段与后端最终 schema 不一致 | 用户端 | 联调对照 **user-api** + **requests** | R-006、R-009（后续） |

## 10. 下一步建议

- **P1b**：`POST /api/orders` 体改为 `standardServiceCode` + `requirementPayload` + `quotePreviewId`；BFF 扩展 `src/app/api/orders/route.ts`；`orders/new` 或新路由与 **R-019** 信息架构对齐。
- 上游 **`standard-services` 上线后**：在 `api/registry.md` 将对应条从 **planned** 标为 **implemented**，并跑一遍列表→详情→粗报价 E2E。
