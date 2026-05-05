# 履约与交易主流程（目标叙述）

最后更新：2026-05-05（P2/P3 目标链路 accepted）

状态：accepted

职责边界：本文只描述平台交易、履约、结算、信用和广场分发的目标业务顺序；接口字段写入 `../api/user-api.md`、`../api/merchant-api.md`，待实现缺口写入 `../api/requests.md`，状态名写入 `state-machine.md`。

> 与现网实现可能分阶段对齐；**状态名**以 [state-machine.md](state-machine.md) 的**目标**为准，与当前 `workflow_status` 字面值对照见同文件说明。

## 1. 顺序（用户视角）

1. 选择 **StandardService**（`standardServiceCode`）。
2. 按 **RequirementTemplate** 填写，提交 **RequirementPayload**。
3. 系统计算并展示 **QuotePreview**（粗报价；用于预期与展示）。
4. 系统按 **MerchantCapability**、星级、服务质量、响应速度、距离、价格、可用档期与就绪状态生成 **MerchantCandidate**，并保存推荐快照。
5. 商家在待办中确认是否有能力、档期和意愿接单，经 **`GET/POST …/merchant/order-requests*`** 与 **`…/quote-confirmation`** 形成 **MerchantQuoteConfirmation**（**终局**价、服务时间、条件，见 `merchant-api` **§4–5**）。
6. 用户经 **`POST /api/v1/orders/{orderNo}/confirm-merchant-quote`** 锁定该 **MQC**；`nextAction` **仅**引导，见 `state-machine` **§6**。
7. 用户 **支付**或**预授权**：**`POST /api/v1/payments/intent`**。款项进入平台代管；平台服务费默认按服务小计收取 **1%**，税费默认按服务小计收取 **7%**，必须在 `pricing.platformFee`、`pricing.taxFee` 与 `pricing.total` 中可解释。
8. **履约**：商家上门或远程服务；开始、完工、迟到、未履约、争议等事件由后端写入履约事件流。
9. **完成与结算**：商家点击完成后进入商家完工态；用户确认完成后完成平台代管放款，扣除平台服务费后结算给商家。
10. **售后、惩罚、评价、信用、广场**：异常进入售后或信用事件；双方互评后可选择将脱敏评价摘要同步到广场。

## 2. P2/P3 accepted 链路

- P2 目标：用户从 **StandardService** 进入后，后端能基于推荐因子生成候选商家；商家确认能力与档期；用户锁单并进入平台代管；平台 1% 收益与商家结算金额可审计。
- P3 目标：履约事件、异常惩罚、双方完成、资金结算、互评、信用评比、广场分发形成闭环。
- 行业差异不按每个行业硬编码控制器实现；使用 **RequirementTemplate + WorkflowDefinition** 表达采集和步骤差异，用 **PricingPolicy / MatchingPolicy / PenaltyPolicy** 策略注册表表达计价、推荐和惩罚。
- 首批样板行业为 **空调清洗** 与 **保洁**：空调清洗覆盖房屋类型、台数、距离路费；保洁覆盖房屋类型、面积、清洁类型。

## 3. 与旧流程的差异（文档层）

- **旧**：用户从 `GET /api/v1/services` / `GET /api/v1/services/{id}` 选**商家**上架行 → 询价同一条 `serviceId` 下单。  
- **新**：用户先选**平台标准**；**商家行**在匹配与确认阶段进入，**粗报价**与**商家终局价**分属 **QuotePreview** 与 **MerchantQuoteConfirmation**。

## 4. 钱与时间

- **粗报价**可允许区间或多项；**终局**以 **MerchantQuoteConfirmation** 及用户接受为准。  
- 用户确认 MQC 后进入支付或预授权；款项属于平台代管，不直接给商家。
- 平台服务费默认按终局服务金额收取 1%，记为平台收益；税费默认按终局服务金额收取 7%；商家结算金额为终局服务金额，平台费与税费不进入商家结算。
- 结算只在履约完成且满足状态机门禁后发生；异常、售后或争议成立时先进入售后/惩罚子流。

## 5. 广场分发与隐私

- 用户和商家互评属于订单信用闭环，不是广场内容的替代品。
- 用户可选择把评价摘要同步到广场；默认脱敏。
- 允许进入广场的内容：标准服务名称、订单金额摘要、评价正文、评价图片、公开昵称或匿名标识。
- 禁止进入广场的内容：详细地址、电话、门牌、内部备注、商家非公开联系方式、售后证据原图中的敏感信息。
