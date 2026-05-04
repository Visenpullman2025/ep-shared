# 项目流程与设定（公共）

最后更新：2026-03-30（维护约定：Linear 已弃用；用户端对后端需求见 **api-user-request.md**，商户见 **api-merchant-request.md**）

> 本文件用于团队内部统一说法、对外展示业务设定与从询价到评价的主要步骤，不替代接口契约。  
> **接口字段与状态**：用户/公共见 [api-user-list.md](api-user-list.md)，商户见 [api-merchant-list.md](api-merchant-list.md)，并与后端代码一致；**需求与差异**见 [api-user-request.md](api-user-request.md)（用户端）、[api-merchant-request.md](api-merchant-request.md)（商户端）。**路径更名对照**见 [frontend-api-renames.md](frontend-api-renames.md)。用户订单接口为 **`/api/v1/orders*`**（需 JWT）；认证由中间件保证。

## 当前重点与待办

**阶段结论（一句话）**：从询价、下单、商户与用户侧订单状态变化到评价，接口与状态见 **api-user-list** / **api-merchant-list**；商户配置开放日后，**预约日在圈外**的订单须商家确认后才可付款；其余场景支付规则见上述清单。

### 待办清单（勾选即表示已完成）

- [ ] 商家评价客户接口（如 `POST /api/v1/merchant/reviews`，见 api-merchant-request）
- [ ] 商户订单列表补齐 `customerAvatar` / `customerRating` 等展示字段（可选二期）
- [ ] 支付与资金「冻结至完结」若与现网结算不一致，单独排期，让产品说明与后端实现一致

> **细则与历史条目**分见 [api-user-request.md](api-user-request.md)、[api-merchant-request.md](api-merchant-request.md)；此处仅保留**跨角色可见的少量条目**。

**维护**：完成项改为 `- [x]`，并更新文件顶部「最后更新」；新增阶段级待办时从对应 request 文件「当前需求区」提炼写入，不复制全文。

---

## 1. 项目设定（摘要）

| 项 | 说明 |
|----|------|
| API 多语言 | 请求 `locale` 支持 `zh` / `en` / `th`（显式参数优先，其次账号偏好，默认 `zh`） |
| 用户端 API 前缀 | `/api/v1/`（认证、个人中心、公共分类/服务/订单等） |
| 商户端 API 前缀 | `/api/v1/merchant/*`（商家端页面默认只走此前缀，除非契约标明公共接口） |
| 运营后台 | Dcat Admin（Laravel），与开放 API 分离 |
| 文档分工 | **api-user-list** / **api-merchant-list**：接口状态；**api-user-request** / **api-merchant-request**：需求池；**frontend-api-renames**：路径更名；**本文**：端到端步骤与轻量待办 |

### 1.1 客户端统一视觉风格（expath-frontend · Thai × Apple Glass）

**适用范围（必读）**：本节仅约束本仓库 **前端 Web 客户端**（用户端 + 商家端，Next.js App Router + Tailwind）。**不包含** Laravel 后台界面、邮件模板或其他仓库；那些界面若有独立设计，不在本节范围。

**风格名称**：**Thai × Apple Glass（泰式 Apple 玻璃风）**。

**设计一句话**：在可读、低干扰前提下，用 **泰国国旗色系 token**（如 `--thai-red`、`--thai-blue`、主色 `--primary`）与 **克制的 Apple 式层次**（字重与间距、大圆角、柔影、轻动效）组织界面；需要强调分组或与页面渐变背景融合时，使用 **毛玻璃大圆角分组卡**（`.app-glass-card` 与 `.order-center-card` 为同一套规则；内层信息底用 `.app-glass-card__inset` / `.order-center-card__meta`）。

**执行规则（与仓库 `.cursorrules` 一致）**：

1. **单源细则**：视觉与类名清单以仓库内 **`docs/stage1/theme-style.zh.md`** 为中文唯一基线；Token 与全局工具类以 **`src/app/globals.css`** 为准。
2. **禁止平行主题**：不得为单个页面单独造一套颜色、圆角或「第二套按钮/卡片」；若缺样式，先在 `globals.css` 与 `theme-style.zh.md` 增补并复用。
3. **次级页导航**：返回为 **泰式渐变 SVG 图标**（`SecondaryTopBar` + `NavBackIcon`），文案仅作 `aria-label`，见主题文档 §4.1。
4. **卡片选用**：多分组、高光列表（订单中心、下单资料等）优先 **玻璃分组卡**；极简设置列表可继续 **`app-panel-muted`**，原则见主题文档 §4.2。
5. **强制复用**：布局 `.app-shell`、主/次按钮 `.apple-btn-primary` / `.apple-btn-secondary`、章节标题与弱文案等，以主题文档 **§7 强制复用类** 为准，新建页面应对照清单而非从零写样式。

**维护**：视觉规范变更须同时改 **`theme-style.zh.md`** 与 **`globals.css`**，并视需要更新本节摘要，避免「文档写一套、代码另一套」。

---

## 2. 用户注册与登录（客户端）

**目标**：获得客户身份与令牌，进入业务页。

1. **注册**：`POST /api/v1/auth/register`（客户角色；商户需走商户注册接口）。
2. **登录**：`POST /api/v1/auth/login`。
3. **当前用户**：`GET /api/v1/auth/me`（基础信息、钱包摘要、资料扩展字段等，以 **api-user-list** 为准）。

---

## 3. 用户完善信息（下单前与展示）

**目标**：满足下单与展示所需的最小资料（手机号、头像昵称、地址与门牌、地图选点）。

1. **资料读写**：`GET /api/v1/me/profile`、`POST /api/v1/me/profile`（如手机、头像、昵称等，只读项以后端为准）。
2. **地址簿**：`GET /api/v1/me/addresses`、`POST /api/v1/me/addresses`、`PUT /api/v1/me/addresses/{addressId}`、`POST /api/v1/me/addresses/{addressId}/default`（支持默认地址、门牌图、经纬度可空等，见 **api-user-list**）。
3. **地图配置（前端）**：`GET /api/v1/maps/config`（如 Google Maps Key、允许国家等，依赖环境变量）。
4. **图片上传**：`GET /api/v1/uploads/oss-policy?scene=...`（头像、门牌照等 scene 名见 **api-user-list**）。

---

## 4. 用户下单到完结（客户端步骤）

**目标**：从浏览服务到成交、服务履约、确认与评价（与运营/商户侧状态机一致）。

1. **进入服务**：`GET /api/v1/services/{id}` 获取基础信息与流程相关 URL（若有返回）。
2. **询价表单定义**：`GET /api/v1/services/{id}/create-data`（`formSchema.fields[]` 由 admin 模板下发）。
3. **粗略报价**：`POST /api/v1/services/{id}/price-preview`（入参含 `processData`、可选 `serviceAddress`；**金额以后端返回为准**，前端不自行算总价）。
4. **流程摘要展示（可选）**：`GET /api/v1/services/{id}/summary`（步骤/状态文案统一口径）。
5. **预约日（规划能力，与 api-user-request / api-merchant-request 中开放日、bookable-days 相关说明一致）**：客户在下单前从服务端拉取 **可预约日历日**（推荐 `GET /api/v1/services/{serviceId}/bookable-days?from=YYYY-MM-DD&to=YYYY-MM-DD`，含端点；可覆盖「本月末 + 下月初」等跨月范围）。返回的 `bookable: true` 表示该日仍在 **商户开放日** 内且 **尚未被任一已付款订单占用该商户该日**。
6. **提交订单**：`POST /api/v1/orders`（保存 `processData`、`pricingSnapshot`、`quotedAmount` 等，并携带与预约一致的 **日历日** 信息：`appointmentDate` 或规范化后的 `appointmentTime`，以后端为准）。若所选日在开放且可预约规则内，响应可出现 **`merchantAutoConfirmed: true`** 并写入 **`confirmedServiceTime`**，等价于跳过「商家人工确认时间」；否则首态仍为 **待商家确认** `pending_merchant_confirm`（见 **api-user-list**）。
7. **支付**：`POST /api/v1/payments/intent` 等。**先付款锁定当日**：同一商户、同一日历日允许多笔待付款并存（产品可改为全日一单待付，见 **api-user-request**）；**付款成功瞬间**后端对该 **商户 + 日** 原子占用，该单走自动商家确认路径；**其他客户**再付同日订单可能 **409/422** 或需改期。付款成功后，**新用户**在 `bookable-days` 中不再看到该日（对客「下架」）；**不要求**商户端月历自动取消绿格（开放日配置与占用分离）。支付在本阶段可为兼容能力；是否会拦住后续步骤以 **api-user-list** 为准。
8. **商户侧推进**：推荐 `POST /api/v1/merchant/orders/{orderNo}/confirm`（接单）、`.../start-service`（开始服务）、`.../finish-service`（商家完工）、`.../cancel`（取消）；兼容旧 `.../transition` + `targetStatus`（见 **api-merchant-list**）。**开始服务需客户已付款**等规则见 **api-merchant-list**。若下单响应已 **`merchantAutoConfirmed`**，则「商家人工确认时间」已等价完成，后续仍按状态机推进。
9. **用户侧推进**：客户确认服务完成走 **`POST /api/v1/orders/{orderNo}/confirm-completion`**（仅可选 body `remark`）；须登录且订单属于当前用户。列表/详情为 **`GET /api/v1/orders`**、**`GET /api/v1/orders/{orderNo}`**（均需用户 JWT；不再提供未登录订单详情）。
10. **评价**：`POST /api/v1/reviews`（用户评商家；可选广场联动字段见 **api-user-list** / **api-user-request**）。商户评客户见 **§4.2** 与 **api-merchant-request**。

**业务顺序（与 api-user-request「当前统一业务流程」一致）**：浏览 → 填询价 → 报价 → **（规划）在 `bookable-days` 范围内选预约日** → 下单（可能 **自动商家确认** 或 **待商家确认**）→ 客户支付（**先付款者锁定该日历日**；资金策略见后端实现）→ 上门 → 商家完成 → 客户确认完成 → 评价与后续分发。

### 4.1 订单金额谁说了算（下单瞬间由后端写死）

1. 前端在 `POST /api/v1/orders` 里传的 `quotedAmount`（或兼容字段 `amount` / `totalAmount`）只表示**费前服务底数**（未含税、未含平台费），**不能**在客户端自行加平台费或税费再当作最终应付。
2. 后端在创建订单时按系统设置计算并**落库**：
   - `order.vat_rate_percent`：税费率（百分数），作用于 `service_subtotal`；为 **0** 时 `taxFee` 为 0，等价于「只有报价 + 平台费」。
   - `order.platform_commission_percent`：平台服务费比例（百分数），作用于 **`service_subtotal + tax_fee`** 之和（即含税服务合计），得到 **`flatFee`（库内 `platform_fee`）**。
   - **`amount_total`** = `service_subtotal` + `tax_fee`（应付给商户侧的服务合计，不含平台费）。
   - **`user_payable`** = `amount_total` + `platform_fee`（客户实付）。
   - **`merchant_settlement`**：完结后应付商户金额，与 `amount_total` 一致（平台费留在平台）。
3. 对外展示（下单返回、订单详情、`GET /api/v1/orders`、商户 `GET /api/v1/merchant/orders`）统一带 **`pricing` 对象**，字段为字符串金额，便于前端直接渲染：
   - **`amount`**：费前服务底数（`service_subtotal`）
   - **`taxFee`**：税费
   - **`flatFee`**：平台服务费
   - **`total`**：客户应付（= `user_payable`）
   - **`merchantSettlement`**：完结后结算给商户的金额  
   列表里同时保留与 `pricing` 一致的顶层字段（如 `amount`、`taxFee`、`flatFee`、`total`、`merchantSettlement`），便于旧页面逐步迁移。

### 4.2 客户确认完成与互评（用户端已实现范围）

1. 商家将订单置为 **`merchant_done`**（商家侧 `finish-service` / `merchantDone`）且客户**已付款**后，客户在订单中心点击**确认服务完成**：经 BFF 代理上游 **`POST /api/v1/orders/{orderNo}/confirm-completion`**（仅可选 `remark`），目标态 **`customer_completed`**（见 **api-user-list**）。
2. 确认后订单进入可评价阶段；用户通过 **`POST /api/reviews`**（BFF `POST /api/reviews`）提交对商家的评分与文字评价。
3. **对商户隐藏身份**：单一布尔 **`hideForSeller`**（非技术匿名，仅展示策略）。
4. **可选转发广场**：用户可勾选将摘要同步到广场；**转发文案仅允许订单号 + 实付金额 + 用户评语**，不得包含地址、电话、备注等隐私字段（由前端拼 `squareBlurb` 或后端代拼，见 **api-user-request**）。可选 **`squarePublishAnonymous`** 控制广场作者匿名展示。
5. **商户评价客户**：不在本仓库实现 UI；商户端应在订单完结后调用建议接口 **`POST /api/v1/merchant/reviews`**（字段与用户侧对称），详见 **api-merchant-request**。

---

## 5. 商户注册与发布服务（商户端）

**目标**：商户具备账号、可选完成入驻/实名、绑定经营类目、创建并维护上架服务。

1. **注册 / 登录**：`POST /api/v1/merchant/auth/register`、`POST /api/v1/merchant/auth/login`；`GET /api/v1/merchant/auth/me`。
2. **资料与审核状态**：`GET /api/v1/merchant/profile`（含 `merchantStatus`、`serviceTypes`、`boundServiceCategories` 等）；`POST /api/v1/merchant/profile` 可更新资料及 **`serviceTypes` 绑定分类**（创建服务前通常必须先绑定）。
3. **类目与模板**：`GET /api/v1/merchant/categories`（含可选模板、默认模板、`selected` 等）；选中模板后 `GET /api/v1/merchant/process-templates/{templateCode}` 拉取报价项与表单字段（**不要前端写死计费枚举**，以后端为准）。
4. **创建 / 编辑服务**：`POST /api/v1/merchant/services`、`PUT /api/v1/merchant/services/{serviceId}`（`categoryCode` 须已绑定商户；`processTemplateCode` 须属于该分类）；列表与详情 `GET /api/v1/merchant/services`、`GET /api/v1/merchant/services/{serviceId}`（含 `reviewState`、编辑器配置等）。若后端启用 AI 翻译（`GEMINI_API_KEY` 等），保存时以**请求 `locale` 为发布语言**，向另外两种语言补全 `title_i18n` / `description_i18n`（细节见 **api-merchant-list**）。
5. **上架与审核展示**：以前端读取 `reviewState` / `status` 等字段展示「审核中 / 已上架 / 驳回」等（见 **api-merchant-list**）。
6. **可预约开放日（总览月历）**：商户在商家端总览维护 **开放日** `openDates`（按自然日 `YYYY-MM-DD`，默认曼谷时区）；`GET` / `PUT /api/v1/merchant/availability`（经 BFF `/api/merchant/availability`）。对客户展示的 **可预约日** 由后端按「开放日 − 已付款占用日」通过 `bookable-days` 等接口返回；**占用与开放日配置分离**，不要求商户月历因他人付款自动变灰。与客户端选日、先付款锁日、自动商家确认衔接见 **§4** 与 **api-user-request** / **api-merchant-request** 中开放日相关说明。

**推荐接入顺序（与 api-merchant-request 摘要一致）**：`merchant/profile` → `merchant/categories` → 若未绑定则 `POST merchant/profile` 写 `serviceTypes` → 选模板、填价项 → `POST merchant/services` → 用返回中的 `createDataUrl` / `summaryUrl` / `pricePreviewUrl` 衔接客户端询价链路。

---

## 6. 商户订单操作要点（与列表字段）

- 列表：`GET /api/v1/merchant/orders` 提供订单卡片字段、**`pricing`（amount / taxFee / flatFee / total / merchantSettlement）** 及 **`paymentStatus`、`customerPaid`、`canMerchantStartService`** 等，供前端按钮禁用/提示（见 **api-merchant-list**）。用户侧列表 **`GET /api/v1/orders`** 使用同一套 `pricing` 结构。
- 流转：推荐 **`confirm` / `start-service` / `finish-service` / `cancel`**（见 **api-merchant-list**）；兼容 `transition`。服务中取消可能触发**钱包扣罚**等，响应字段与多语言错误见 **api-merchant-list** 与后端 `lang/*/merchant_api.php`。
- **自动商家确认**：客户在开放且可预约日内下单且后端返回 **`merchantAutoConfirmed`** 时，订单已带 **`confirmedServiceTime`**，商户侧仍按同一状态机操作，但可减少「单独确认服务时间」这一人工环节（以后端实现与 **api-user-list** / **api-merchant-list** 为准）。
- **互评（商户端待接入）**：在客户确认完成、订单达 **`customer_completed`** 后，商户端应提供对客户的评价入口；接口建议 **`POST /api/v1/merchant/reviews`**，支持与用户侧相同的 **`hideForSeller`、可选转发广场** 等字段（见 **api-merchant-request**）。

---

## 7. 维护约定

- 流程口径变更：先改**实现**与 **api-user-list / api-merchant-list**，再同步**本文**与对应 **api-*-request** 条目。  
- **待办清单**：大功能落地后，将本节勾选状态与 **api-user-request** / **api-merchant-request**「当前需求区」核对一次，避免长期漂移。  
- **商户接口需求**发布到 **api-merchant-request.md**；进度与结论以本仓库 shared 文档与代码为准。

---

## 8. 文档与回复用语（共同）

在本仓库写 shared 文档、`.cursorrules`、提交说明或向同事说明时，**少用含糊的圈内词与不必要缩写**，改用**谁、做什么、写在哪、什么条件下失败**等可直接核对的说法。当前规则源以 `PROJECT_RULES.md` 为准，本节仅保留历史说明。

**建议避免的词**（及可替换思路）：

| 避免 | 可改成 |
|------|--------|
| 收口 | 写进某份文档；或在代码里统一成一种做法；或约定只走某几条接口 |
| 对齐 | 与某文档或某段实现**说法一致** / **字段一致** / **步骤一致**（写清对照物） |
| 主链路、主流程 | 写出具体步骤（如询价→下单→付款→评价） |
| 阻断、非阻断 | **会不会拦住**某一步（写清接口或页面行为，例如未付款能否提交订单） |
| 闭环、收敛、落地、打通 | 改为具体交付物或结果（已实现、已写入 api-user-list / api-merchant-list、已可联调等） |

**缩写**：不要随意用拼音首字母或内部代号；`GET`/`POST`、`api-user-list`、`locale` 等固定技术写法可保留；业务缩写首次宜写全。

**自检**：新同事能否不看黑话就明白要改哪些文件、调哪些接口、失败时返回什么？若不能，继续改写。
