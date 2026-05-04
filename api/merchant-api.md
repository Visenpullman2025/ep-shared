# 商家端 API 合同（Merchant API Contract）

最后更新：2026-04-28（P0.5 合同边界与实现状态已标注）

## 概述

### 合同与实现 / 需求池

- 本文是**合同基线**；**是否已注册路由、可联调** 以 `api/registry.md` 与后端实现为准。
- 下列能力在**字段级验收、幂等、扩展形态**上仍在 **`api/requests.md`** 中跟踪（**不在**本文件重复需求细节）：**MerchantCapability**（R-013）、**order-requests 列表与 MQC 提交**（R-014）、**GET** 单条候选详情（R-020）、**订单新主链引用字段**（R-012）、**availability 扩展容量/时段**（R-016）、**商户侧评价**（R-004）等。  
- **商家信用只读** `GET /api/v1/merchant/credit-profile` 见 **R-015**；落地前**不得**在客户端假定响应字段。
- 第 3 组中 **time slots / capacity** 的**具体 JSON 形状** 以 **R-016** 经后端 **accepted** 的草案与实现为准，本文仅保留能力方向。

### 文档范围与读者

- **范围**：仅描述商家端（JWT，前缀 `/api/v1/merchant`）的 **HTTP 合同**：路径、角色语义、核心字段与兼容说明。
- **不承载**：缺接口/缺字段/冲突等需求项（见 **[requests.md](requests.md)**）；**实现是否已上线** 以 **[registry.md](registry.md)** 与后端代码为准。
- **与平台主链路对齐**：`docs/boundaries.md`、`docs/glossary.md`、`docs/fulfillment-flow.md`、`docs/state-machine.md`。

### 平台主流程与固定概念

平台目标主链路（与实现阶段解耦）：

1. 平台定义 **StandardService**
2. 用户提交 **RequirementPayload**（由 **RequirementTemplate** 引导采集）
3. 系统生成 **QuotePreview**
4. 系统据 **MerchantCapability** 等匹配 **MerchantCandidate**
5. 商家对候选任务提交 **MerchantQuoteConfirmation**（终局价与服务条件）
6. 用户确认 → 支付/预授权 → 商家履约 → 售后/评价/信用

**本合同必须使用的概念名**（英文固定）：`StandardService`、`RequirementTemplate`、`RequirementPayload`、`QuotePreview`、`MerchantCapability`、`MerchantCandidate`、`MerchantQuoteConfirmation`。

**业务叙述禁用**（非技术栈固定词义）：`product`、`goods`、`item`（作货品义）、`listing`、`shop_service`、`service product`（表义与替代词见 `docs/glossary.md`）。

**「旧 service」**：`GET/POST /api/v1/merchant/services*` 等所指的 **商家侧服务配置/历史能力载体**，**不是**用户侧长期唯一的「平台标准品」入口；新主流程以 `standardServiceCode` 与 **MerchantCapability** 为商家配置主线。

### 通用约定

- **鉴权**：商家 JWT（及实现所需 Header），细节与错误码见 `api/error-codes.md`。
- **响应包络**：与平台统一 `code` / `data` / `message` / `requestId` / `timestamp` 等约定一致；成功时 `code === 0`。
- **时间与时区**：日期/预约等字段若无说明，以产品约定时区（如 `Asia/Bangkok`）与后端存储为准；**openDates** 当前为 `YYYY-MM-DD` 日期串列表（见下文第 3 组「商家开放日 / 容量」）。

### P0.5 实现状态与联调

- **已**在现网**注册、可联调**（`registry`）：`merchant/auth*`、`profile`、`verification`、**`GET/PUT /merchant/availability`**、**`merchant/orders*`**、**`merchant/wallet*`**、**`merchant/services*`**（**compatibility**）等。  
- **合同已写、P1 前**不得宣称「已上线」：**GET/POST/PUT/GET** **`/api/v1/merchant/capabilities`**、**`GET /api/v1/merchant/order-requests`**、**`POST /api/v1/merchant/order-requests/{candidateId}/quote-confirmation`**、**`GET /api/v1/merchant/credit-profile`**。  
- **`openDates` 与** **`capacity` / timeSlots` 的演进**（`R-20260428-016`）：在**不删** 原 **`PUT /merchant/availability`** 的前提下**扩展** body/响应；**P0.5 不在合同内锁死** JSON 形状，**须**有 **P1** 的 schema 定稿。  
- **新主**商家报价入口以 **§4–5** 为准；旧 **`POST .../merchant/orders/{orderNo}/confirm`** 为 **compatibility/过渡**（以 `registry` 为准，若路由仍存在）。

---

## 1. 商家认证与资料

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/v1/merchant/auth/register` | 注册 |
| POST | `/api/v1/merchant/auth/login` | 登录 |
| GET | `/api/v1/merchant/auth/me` | 当前商家会话/摘要 |
| POST | `/api/v1/merchant/auth/logout` | 登出 |
| GET | `/api/v1/merchant/profile` | 商家资料 |
| POST | `/api/v1/merchant/profile` | 更新资料（如 `merchantName`、`contactPhone`、`serviceIntro`、`online`、`serviceTypes` 等，以后端实现为准） |
| POST | `/api/v1/merchant/verification` | 提交/更新认证材料 |

**响应（资料）关键字段（示例级）**：`id`、`merchantName`、`status` / `merchantStatus`、`serviceTypes`、`boundServiceCategories[]`、`verification` 等，与现网联调类型对齐，**不另造字段名**。

---

## 2. 商家能力 MerchantCapability

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/v1/merchant/capabilities` | 能力列表 |
| POST | `/api/v1/merchant/capabilities` | 新建能力 |
| GET | `/api/v1/merchant/capabilities/{id}` | 单条详情 |
| PUT | `/api/v1/merchant/capabilities/{id}` | 更新能力 |

**核心字段（合同级）**：

- `capabilityId`：能力主键
- `standardServiceCode`：绑定的平台标准服务编码
- `enabled`：是否启用
- `serviceArea`：服务地区/范围（结构以后端定义为准）
- `basePricingRule`：基础计价规则
- `extraDistanceRule`：超距等附加规则
- `capacityRule`：容量规则
- `openDates`：开放日（与「开放日/容量」接口可衔接；结构可演进）
- `status`：能力行状态
- `reviewState`：审核态（若平台对能力做审核）

---

## 3. 商家开放日 / 容量

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/v1/merchant/availability` | 查询开放日等 |
| PUT | `/api/v1/merchant/availability` | 更新开放日等 |

**说明**：当前以 **`openDates[]`**（`YYYY-MM-DD`）等为主；**后续**需扩展为 **capacity** / **time slots** 等与 **MerchantCandidate**、**MerchantQuoteConfirmation** 的**完整协同**模型。扩展时**不得**绕开 shared 合同在单仓库**发明**对外语义；**演进策略** 见 **`api/requests.md` R-20260428-016**。

---

## 4. 待确认请求 MerchantCandidate

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/v1/merchant/order-requests` | 待商家处理的候选任务列表（分页等查询参数以后端为准） |

**响应列表项核心字段**：

- `candidateId`：候选 ID
- `orderNo`：关联订单号
- `standardServiceCode`：标准服务编码
- `requirementSummary`：需求摘要（可展示用）
- `quotePreview`：**QuotePreview** 结构或引用（粗报价，非终局价）
- `serviceAddress`：服务地址/上门信息
- `requestedAppointment`：用户/系统侧期望预约信息
- `expiresAt`：候选或报价响应过期时间
- `status`：候选状态（与 `docs/state-machine.md` 方向一致，具体枚举以后端为准）

---

## 5. 商家最终报价与时间确认 MerchantQuoteConfirmation

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/v1/merchant/order-requests/{candidateId}/quote-confirmation` | 对指定候选提交终局确认（幂等与门禁见 `api/requests.md` R-014） |

**单条候选详情（若后端提供）**：`GET /api/v1/merchant/order-requests/{candidateId}` 不在本文展开字段，见 **R-020**（草案，待 **accepted**）。

**请求核心字段**：

- `finalAmount`：最终金额
- `confirmedServiceTime`：确认的服务时间
- `merchantNote`：商家备注
- `validUntil`：本确认有效截止（若业务需要）

**响应核心字段**：

- `merchantQuoteConfirmationId`：确认记录 ID
- `candidateId`：候选 ID
- `orderNo`：订单号
- `status`：确认单状态
- `finalAmount`：最终金额
- `confirmedServiceTime`：确认的服务时间

---

## 6. 商家履约订单

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/v1/merchant/orders` | 商家订单列表（分页参数以后端为准） |
| POST | `/api/v1/merchant/orders/{orderNo}/start-service` | 开始服务 |
| POST | `/api/v1/merchant/orders/{orderNo}/finish-service` | 完成服务 |
| POST | `/api/v1/merchant/orders/{orderNo}/cancel` | 取消订单 |

**列表项核心字段（与现网联调对齐，示例级）**：`orderNo`、客户展示字段、金额与支付相关（如 `paymentStatus`、`customerPaid`、`canMerchantStartService`）、`workflowStatus`、服务地址、预约/确认时间、**`status`** 等。**订单业务状态机** 以 `docs/state-machine.md` 与后端实现为准，商家端 **不得** 自行定义独立状态名。

**兼容（过渡）**：历史上可能存在 `POST /api/v1/merchant/orders/{orderNo}/confirm`、`POST .../transition` 等路径，用于旧流中确认时间或状态迁移；**新主流程** 的终局报价与时间以第 5 组 **MerchantQuoteConfirmation** 为准，履约段以本节动作为准。具体是否仍注册见 `api/registry.md`。

---

## 7. 商家钱包

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/v1/merchant/wallet` | 余额与冻结等汇总 |
| GET | `/api/v1/merchant/wallet/records` | 流水列表 |
| POST | `/api/v1/merchant/wallet/withdraw` | 提现申请 |

**响应/请求字段** 以现网实现与类型定义为准（如余额字符串、流水 `referenceNo`、`type` 等）。

---

## 8. 商家信用

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/v1/merchant/credit-profile` | 商家信用档案/评分等（结构以后端合同为准） |

---

## 9. 兼容 / 非长期主线的商家端接口

以下路径在现网或迁移期仍可能出现，**状态：compatibility**；**不得** 作为新主流程的长期「服务商品」心智入口；迁移方向见 `docs/boundaries.md`。

| 路径模式 | 状态 | 说明 |
|----------|------|------|
| `GET /api/v1/merchant/services`、 `GET /api/v1/merchant/services/{id}` 等 | compatibility | 旧**商家服务配置**列表/详情，非长期标准服务主入口 |
| `POST /api/v1/merchant/services`、 `PUT /api/v1/merchant/services/{id}` 等 | compatibility | 创建/更新旧配置行；**后续** 迁移为 **MerchantCapability** 主路径 |
| `GET /api/v1/merchant/categories` | compatibility / 辅助 | 类目与模板选择；**后续** 由 **StandardService** / **Capability** 体系统收 |
| `GET /api/v1/merchant/process-templates/{templateCode}` | compatibility | 流程/表单模板；**后续** 语义归一到 **RequirementTemplate** |

**其它**：`GET /api/v1/merchant/uploads/oss-policy` 等上传策略类接口属工程能力，不在上表分组，仍以 **registry** 与实现为准。

---

## 10. 与「商家端 BFF / 前端」关系

- 若部署中通过 Next 等 BFF 将 `/api/merchant/...` 代理到 `/api/v1/merchant/...`，**合同仍以上述后端路径与字段为准**；BFF 不得改变业务语义。
- 命名与禁止项见 `PROJECT_RULES.md` 与 `roles/merchant-frontend.md`。
