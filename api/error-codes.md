# 错误与 HTTP 约定

最后更新：2026-04-28（P0.5：新主链错误语义补充）

> 与**具体业务**强相关的 `code` 以响应体与 `lang/*` 为准；本页记**平台级**习惯、**现网**常见，以及**新主链**建议的**稳定** `code` 枚举（`EX_*`），**未**强制现网已返回。

## 1. HTTP 状态

| 状态 | 常见含义 | 例 |
|------|----------|-----|
| 400 | 参数缺/格式错 | 非法 JSON、缺必填 |
| 401 | 未认证 | 需 JWT 的接口未带或过期 |
| 403 | 已认证但无权限 | 非本人订单、非该商户、非本候选 |
| 404 | 资源不存在 | 订单号/标准服务码/`quotePreviewId` 等不存在 |
| 409 | 资源冲突 | 重复操作、**幂等/重复**提交、并发抢单（依实现定） |
| 422 | 业务不可执行 | 状态机不允许、校验失败、金额与订单不一致 |
| 500 | 服务内部错误 | 需日志排查 |

**约定**：**422** 搭配 **`code`** 为**可分支**时优先；**404** 配 **`EX_*_NOT_FOUND`** 类；**409** 配**重复/冲突**类；**403** 配**归属/越权**类。`message` 可本地化，**判因**以 **`code` + HTTP** 为主。

## 2. 业务 422 典型（现网）

- **`invalid transition from {from} to {to}`** — `OrderWorkflowService` 非法迁移。  
- **`order does not belong to current user`** — 非本人订单。  
- **`totalAmount` / `quotedAmount` / … does not match order`** — 支付与订单金额校验。  
- **`order already paid`** — 重复支付。  
- **`serviceType is not open in stage2`** — 类目/阶段开放策略。  

## 3. 新主链：建议 `code`（`EX_*`）与语义

> 下表在 **P1 实现**时落地到 `lang` 与 JSON；P0.5 仅**锁语义**，避免各端自造英文键。

| 建议 `code` | 场景 | 典型 HTTP |
|-------------|------|-----------|
| **`EX_STANDARD_SERVICE_NOT_FOUND`** | `standardServiceCode` 或路径 `{code}` 不存在/已下线 | 404 |
| **`EX_REQUIREMENT_PAYLOAD_INVALID`** | **RequirementPayload** 与 **RequirementTemplate** 不合（含缺字段/类型/规则） | 422 |
| **`EX_QUOTE_PREVIEW_EXPIRED`** | `quotePreviewId` 已过期，禁止创建订单 / 已过期仍访问 | 422 或 410（若单独强调过期，**待决策**） |
| **`EX_QUOTE_PREVIEW_MISMATCH`** | 预览与 `standardServiceCode` 或**订单**关系不一致 | 422 |
| **`EX_ORDER_MQC_NOT_ALLOWED`** | 当前 `workflowStatus` 不允许**接受/处理**本 **MerchantQuoteConfirmation** | 422 |
| **`EX_CANDIDATE_EXPIRED`** | **MerchantCandidate** 已过期，禁止报价或确认 | 422 |
| **`EX_CANDIDATE_NOT_OWNER`** | 非该候选归属商家/非法 `candidateId` | 403 |
| **`EX_MQC_DUPLICATE`** | 同一**候选/订单****重复**提交 MQC | 409 或 422（**以 R-20260428-014 定稿**为准） |
| **`EX_USER_CONFIRM_DUPLICATE`** | 用户**重复** `confirm-merchant-quote` | 409 或 422 |
| **`EX_USER_CONFIRM_STALE_MQC`** | 用户**确认**的 `merchantQuoteConfirmationId` 已非当前有效/已被替代 | 409/422 |
| **`EX_PAYMENT_NOT_READY`** | 订单**未**达到允许 **支付/预授权** 的**工作流+支付**组合态 | 422 |
| **`EX_AFTER_SALES_NOT_ALLOWED`** | 当前订单**不可**发起或推进售后 | 422 |
| **`EX_AFTER_SALES_DUPLICATE_CASE`** | 对同一**售后类型**重复**非法**（若禁止多开） | 409/422（**待决策**） |

## 4. 多语言

- 对外 `message` 常随 `locale`；**联调**以 **`code` + HTTP** 为稳定契约；**不**以句子文本做**唯一**分支键。

## 5. 登记录入

- 新稳定 `code` 首次上线时：在 **`api/requests.md`** 对应 R- 条**备注**「已实现错误码」；在 **`api/registry.md`** 接口块**不**必重复**列全 code**，**链**到本文 §3。  
