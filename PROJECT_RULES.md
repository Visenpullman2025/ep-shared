# ExpatTH 项目规则总纲

最后更新：2026-05-08  
状态：当前唯一规则源。其他 `AGENTS.md`、`.cursorrules`、`.cursor/rules/*.mdc` 只做入口，不重复写规则。

## 1. 核心最高准则

以下准则每次任务必读。触犯任一条，视为本次任务失败，必须先记录、预警、修正，再继续交付。

1. **诚实高于成功**：允许犯错、失败、返工、暴露问题；严格禁止欺瞒、逃避、假装完成、隐藏风险、编造验证结果。
2. **合同状态先于写代码**：API、字段、错误码、状态、业务词、数据库主链路状态不清时，不进入实现。
3. **规则必须短**：规则只保留会阻止真实错误的内容；长解释、重复背景和普通需求不写进规则。
4. **脚本优先**：能用脚本、lint、测试、路由扫描检查的，不让 AI 反复读文档判断。
5. **越界立刻记录**：发现越界必须当场记录、预警、修正；不允许“下次再说”。
6. **前端 API 固定闸门**：凡是补全前端 API，必须先通过本文件第 4 节；未通过时禁止直接写业务代码。
7. **可并行时优先并行**：中大型任务允许并建议使用多智能体异步协同；前提是边界、写集、依赖和统一审查明确。
8. **目标优先于指令字面**：先服务产品目标，再执行具体指令；发现更优实现或明显风险时，必须先说明判断和取舍。

## 2. 引导型开发准则

目标：像约定语言和框架一样约定开发风格，但不把规范变成负担。

- 规则表达采用 RFC 2119 思路：必须 / 应该 / 可以。只有“必须”能拦截任务。
- PHP/Laravel：遵守 PSR-12 和 Laravel 约定；Controller 薄，验证进 FormRequest，响应进 Resource，业务进 Service/Action。
- TypeScript/React/Next：遵守项目 ESLint、TypeScript、Next 约定；组件 PascalCase，函数和变量 camelCase，路径按现有目录风格。
- API：面向资源时采用 RESTful 命名；平台业务词、状态和字段优先以 shared 合同为准。
- 数据库：表、字段、索引先表达业务事实和查询路径；不为临时 UI 随手建表。
- Laravel 列表/分页接口必须返回瘦 DTO，禁止在逐行 `map` / `foreach` 中调用会查库的详情聚合器或 Service；详情聚合必须先 `whereIn` / eager load 批量预取。新增或改造列表接口要用 `DB::listen`、Telescope 或等价方式抽查 `queryCount`，页大小增加时 SQL 次数不得随行数线性增长。
- Dcat Plus 后台在当前项目中保持 MySQL/default connection 边界；未完成后台替换或迁移方案前，不得把后端默认连接直接切到 PostgreSQL。
- 现有项目风格优先于外部通用规范；冲突时先说明取舍，不悄悄混用。
- 用户举例不自动成为硬规则。例如“统一驼峰”代表要有命名标准，不代表所有层都必须 camelCase；是否升级必须按第 6 节标准化。
- 专业协作不是机械执行。需求有更好路径时，先说明目标、风险、取舍和推荐方案；如果用户确认原方案且不触犯最高准则，再继续执行。
- 反驳必须具体：指出影响范围、为什么当前方案更差、替代方案如何更接近产品目标；禁止为了显得专业而空泛反对。
- 任务指令要越用越专业。用户表达较长或含混时，先提炼成一句话任务命令：在什么范围内，完成什么目标，遵守什么约束，以什么结果验收。
- 提炼指令是为了减少返工，不是增加对话负担；简单明确的需求直接执行，复杂需求才先压缩确认。

## 3. 每次任务读取方式

### L0 每次必读

- 本文件。
- 目标仓库的 `AGENTS.md`。
- 目标仓库的 `.cursorrules` 或 `.cursor/rules/*.mdc`。

### L1 按任务触发

- 新业务词：读 `docs/glossary.md`。
- API、字段、错误码：读 `api/requests.md` 和 `api/registry.md`。
- 订单、候选、确认单、支付、售后状态：读 `docs/state-machine.md`。
- 标准服务、用户入口、商家能力边界：读 `docs/boundaries.md`。
- 数据库、距离搜索、推荐、向量、AI 查询：读 `db/schema-plan.md` 和 `db/postgres-clean-rewrite.md`。
- UI 样式：读目标前端仓库主题文档。

### L2 审计触发

以下情况进入 L2：用户要求审计、测试失败、跨仓库变更、合同变更、数据库变更、文件超过规模门禁。L2 必须检查本文件“越界审计记录”。

## 4. 补全前端 API 固定闸门

触发词：补全前端 API、接接口、页面调接口、BFF、proxy、把前端数据接真实后端。

进入实现前必须得到一个明确状态：

| 状态 | 含义 | 下一步 |
| ---- | ---- | ------ |
| `ready-to-code` | 前端调用、BFF、shared 合同、后端路由、后端实现或迁移计划都清楚。 | 可以写代码。 |
| `contract-missing` | shared 中没有请求或已实现登记。 | 先补 `api/requests.md` 或 `api/registry.md`。 |
| `backend-missing` | 前端/BFF 存在，但后端路由或实现不存在。 | 先补后端合同和实现计划，不能伪装前端完成。 |
| `frontend-only-invalid` | 只有前端入口，没有真实 API 价值或当前产品不需要。 | 删除入口或记录为暂缓，不写假功能。 |
| `remove-entry` | 旧入口和当前主流程冲突。 | 删除旧路并记录影响。 |

检查顺序固定：

1. 前端页面或 hook 是否真实调用该 API。
2. Next BFF route 是否存在，是否只是透传到后端。
3. `api/requests.md` 是否有待实现请求，或 `api/registry.md` 是否有已实现登记。
4. Laravel `routes/api.php` 是否有对应路由。
5. Controller、Service、Resource、FormRequest 是否存在且职责清楚。
6. 任一项不通过，先记录状态和越界，不进入业务代码。

## 5. 多智能体并行开发准则

目标：用多智能体减少等待时间，而不是制造更多流程。

- 应该并行：任务能拆成 2 个以上独立模块、跨仓库切片、或前后端/测试/文档可分离执行。
- 不应并行：小任务、同一文件高冲突、shared 合同未定、数据库主链路未定、需要连续产品判断的任务。
- 分发前必须写清每个员工的范围、允许修改文件、禁止修改文件、依赖、验收标准和汇报格式。
- 每个员工只改自己的模块；需要改共享接口时，先由 Codex 总控冻结合同，再分发。
- 员工异步执行，Codex 总控负责跟踪进度、处理中断、汇总结果，不在单线程等待里空转。
- 合并前必须统一审查：看 diff、检查边界、跑匹配验证、记录失败教训。
- 并行不是成功证明。没有可运行结果、日志或 diff 证据，不能标记完成。

## 6. 自我成长钩子

每次任务结束前做一次 30 秒复盘：

- 发现更好的做法、固定闸门、脚本检查点或失败教训时，必须追加到“规则成长候选”。
- 规则进入 workflow 或 skill 前，必须先标准化为：类别、等级、范围、规则、触发、检查方式、去向。
- 当前项目用 `node rules/growth-hook.mjs --source ... --type ... --level ... --scope ... --rule ... --trigger ... --check ... --destination ...` 追加候选，避免手写表格格式漂移。
- 满足以下全部条件，才升级为硬规则：可复用、可验证、能减少错误或上下文负担、不重复现有规则。
- 能脚本化的候选，优先变成脚本或检查命令；不能脚本化的，才写成短规则。
- 项目特有内容留在本文件；通用行为准则再同步到全局 skill。
- 候选超过 10 条时必须清理：升级、拒绝或合并，不允许规则无限变长。

## 7. 仓库边界

| 仓库 | 职责 | 禁止 |
| ---- | ---- | ---- |
| `ep` | 用户端 Next.js | 不发明后端字段；不从商家服务 ID 作为新主线入口；不在页面里堆业务状态机。 |
| `epmerchant` | 商家端 Next.js | 不自造商家 API 字段；不强化“服务商品”旧心智；不绕过 shared 状态机。 |
| `epbkend/expatth-backend` | Laravel 后端 | Controller 不写复杂业务；migration 不塞大量演示数据；不绕过 shared 合同新增接口。 |
| `ep-shared` | 合同、术语、状态、规则 | 不放运行时代码；不把临时聊天结论当稳定合同。 |

旧规则里出现 `/home/visen/projects/expatth-shared` 时，在当前工作树统一理解为 `../ep-shared`。

## 8. 前端边界

适用：`ep` 用户端、`epmerchant` 商家端。

前端可以做：

- 页面、组件、BFF、i18n、样式、表单输入、展示状态、用户引导和客户端数据适配。
- 基于 shared 合同渲染字段、错误、状态和下一步动作。
- 在 BFF 层做认证转发、cookie/session 处理、轻量字段映射和错误透传。

前端禁止做：

- 发明 API 字段、业务状态、错误码、金额规则、权限规则。
- 把 mock、静态数据、隐藏按钮、本地兜底当作真实完成。
- 在页面或 BFF 写订单主状态机、匹配逻辑、商家候选算法、钱包金额规则。
- 只靠前端隐藏入口控制权限、金额、所有权或状态推进。
- 创建平行主题、平行组件体系或绕过 `globals.css` 的局部视觉系统。
- 无用户明确要求时，不在弹层、卡片或页面中添加解释型副文案、规则说明或使用说明；只保留标题、字段、状态、动作，以及必要的错误、合规、安全、空状态提示。
- 用户可见界面不得直接展示内部状态、算法、结算和后端工作流字段，例如 `matching`、`wait_*`、候选分、冻结状态、结算状态、商家结算、内部 id 当标题。必须展示时先映射为客户能理解的业务文案。
- 用户支付文案不得使用“冻结”描述平台资金保障；客户侧统一用“平台代管”或“平台保障”，避免误解为账户被冻结。
- 用户端费用明细只展示后端 `pricing`，顺序为服务小计、平台服务费、税费、应付合计；前端不得重算金额或展示商家结算。

用户端 `ep` 边界：

- 主入口使用 `StandardService` / `standardServiceCode`。
- 不把旧 `serviceId` 作为新下单主线。
- 不让用户选择商家或师傅作为必经步骤。

商家端 `epmerchant` 边界：

- 长期对象是 `MerchantCapability`、`MerchantCandidate`、`MerchantQuoteConfirmation`。
- 旧 `merchant/services*` 只能是 compatibility，不强化“服务商品 / 上架商品”心智。
- 商家端不能代替用户确认 MQC 或支付/预授权。

BFF 边界：

- BFF 是安全代理和轻映射层，不是业务服务层。
- BFF 新增或改变后端路径前，必须通过第 4 节 API 固定闸门。
- BFF 不直接连接数据库，不保存敏感业务事实，不绕过 Laravel 权限校验。

## 9. 文档边界

只保留以下文档职责，不再扩张文档矩阵：

| 文件 | 职责 | 不写什么 |
| ---- | ---- | -------- |
| `PROJECT_RULES.md` | 规则、流程、文档格式、越界审计 | 不写普通需求流水、不写接口正文。 |
| `docs/glossary.md` | 业务词定义 | 不写实现方案。 |
| `docs/boundaries.md` | 平台主流程和边界 | 不写每个接口字段细节。 |
| `docs/state-machine.md` | 订单和子实体状态 | 不写 UI 文案。 |
| `api/requests.md` | 待实现或待确认 API 需求 | 不写已确认上线清单。 |
| `api/registry.md` | 已实现 API 清单 | 不写未确认设想。 |
| `db/schema-plan.md` / `db/postgres-clean-rewrite.md` | 数据库方向和重建计划 | 不写页面设计。 |
| `reports/*.md` | 角色阶段报告或专项审计 | 不写重复规则。 |

## 10. 业务命名和禁词

核心业务概念以 `docs/glossary.md` 为准。高频规则如下：

- 用户入口字段使用 `standardServiceCode`。
- 核心七词固定为：`StandardService`、`RequirementTemplate`、`RequirementPayload`、`QuotePreview`、`MerchantCapability`、`MerchantCandidate`、`MerchantQuoteConfirmation`。
- API JSON 默认使用 camelCase；如果必须兼容 snake_case，必须写入 `api/requests.md` 或 `api/registry.md`。
- 同一响应中同时有 `orderNo` 和数字 `id` 时，必须说明哪个是对外主键。
- `yipai_services` 只能称为“商家服务配置”或“商家能力配置的旧承载”，不能作为新用户主线。

描述平台交易对象时禁止使用：

| 禁词 | 改用 |
| ---- | ---- |
| `product` | `StandardService` 或商家服务配置 |
| `goods` | `StandardService` 或商家服务配置 |
| `item`（货品义） | 标准服务、数组项、订单明细需按语境写清 |
| `listing` | 商家能力配置或服务配置 |
| `shop_service` | `MerchantCapability` 或商家服务配置 |
| `service product` | `StandardService` 或商家服务配置 |

技术词允许保留，例如 `GET`、`POST`、`locale`、数组元素 item、发票 line item。

## 11. 文档格式和风格

所有新增或修改的中文文档必须遵守：

- 写清“谁、做什么、写在哪个文件、是否影响下一步”，少用空泛词。
- 每份文档开头必须有：标题、最后更新日期、状态、职责边界。
- 同类条目统一格式：

```md
## YYYY-MM-DD - 标题

- 类型：
- 范围：
- 决定：
- 影响文件：
- 验证：
- 状态：draft / accepted / implemented / fixed / rejected
```

- API 需求继续使用 `api/requests.md` 里的 R- 编号格式。
- 越界审计继续使用本文件“越界审计记录”表格。
- 不新增 `*-final`、`*-new`、`*-v2`、`scratch`、`temp` 文档；需要暂存时写在对应文件的“草案”区。

## 12. 代码结构门禁

目标上限：

- Next route page：120 行。
- React component：220 行。
- Hook、API client、mapper：180 行。
- Laravel controller：120 行。
- Laravel service：300 行。
- FormRequest、Resource、Action：160 行。
- Migration：180 行，基线重建除外但必须注明原因。

超过上限时，不继续叠加功能；先抽出当前任务切片。

## 13. 验证要求

按改动选择验证：

- 前端 UI：lint、必要时 build、浏览器核心路径、移动端布局、图片加载、控制台错误。
- API：真实路由请求或后端路由检查。
- 数据库：migration status 或本地 migrate 路径。
- 权限、金额、状态：必须确认后端校验，不接受只看前端表现。

无法验证时，在最终回复里写清原因、风险和下一步。

## 14. 越界审计记录

发现越界时必须追加一行。状态只能是 `open`、`fixed`、`accepted-temporary`。`accepted-temporary` 必须写删除条件。

> 完整历史记录（含影响位置、风险、修正动作）见 `ep-shared/data/violations.json`。
> 2026-05-04 ～ 2026-05-08 已修复 7 条越界（favorites BFF、Dcat 连接边界、API registry 缺口、商家域鉴权、资料/实名分离、位置接口、N+1 列表），全部 fixed，详见 JSON。

| 日期 | 来源 | 越界行为摘要 | 状态 |
| ---- | ---- | ------------ | ---- |
| 2026-05-10 | 代码审计 | `orders-permissions.ts` 硬编码订单状态判断逻辑，违反前端边界 | open |
| 2026-05-10 | 代码审计 | `epmerchant` 硬编码取消罚款 20%，违反金额规则边界 | accepted-temporary（删除条件：支付网关接入后改为后端下发） |

## 15. 规则成长候选

候选状态只能是 `candidate`、`promoted`、`rejected`。已 `promoted` 的条目已并入正文，不在此重复。

| 日期 | 来源 | 类别 | 等级 | 范围 | 规则 | 触发 | 检查方式 | 去向 | 状态 |
| ---- | ---- | ---- | ---- | ---- | ---- | ---- | -------- | ---- | ---- |
| 2026-05-05 | 用户反馈 | 前端边界 | 应该 | ExpatTH | 用户可见业务文案必须来自后端合同或 shared 登记配置，不在页面局部维护内部 code 到文案的长期映射 | 内部 code 出现在用户界面、订单/支付/评价等展示字段缺失 | rg 局部 code-to-label 映射并核对 api/requests 缺口登记 | `PROJECT_RULES.md` 第 8 节与 `docs/boundaries.md` | candidate |
| 2026-05-05 | 用户反馈 | 认证入口 | 应该 | ep | 需要登录的用户端入口必须生成带 next 的登录地址，且登录页必须提供保留 next 的注册入口 | 新增 auth-gated 链接或未登录拦截 | `rg auth/login` 无裸登录链接，统一使用 `buildLoginHref` / `buildRegisterHref` | `PROJECT_RULES.md` 第 8 节 | candidate |
| 2026-05-05 | 用户反馈 | 认证门禁 | 必须 | ep | 用户端受保护页面必须由路由门禁重定向；需登录 API 收到 401 必须统一清 session 并跳登录，不在页面渲染未登录卡片 | 新增受保护页面或调用需登录 BFF/API | curl 无 cookie 访问受保护路由应 307 到 auth/login；rg 受保护路由无 guestTip/goLogin 残留 | `PROJECT_RULES.md` 第 8 节 | candidate |
| 2026-05-07 | 构建卡住复盘 | 验证流程 | 应该 | ep | Next 用户端生产构建在本机验证优先使用 `npm run build` 指向的 webpack 构建；Turbopack 卡在 compile 时先检查 `.next/lock` 和残留 next build 进程 | npm run build 卡住或构建验证 | `npm run build`、`.next/diagnostics/build-diagnostics.json`、`.next/lock` | `PROJECT_RULES.md` 第 13 节 | candidate |
