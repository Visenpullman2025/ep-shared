# CONSTITUTION

> 项目规则总纲。文件主权、修改门禁、冲突仲裁见 CHARTER.md。
> 最后更新：2026-05-12
> 上一版：PROJECT_RULES.md（迁移完成前作为旧入口保留）

## §1 核心准则

1. 诚实高于成功：允许失败、返工、暴露问题；禁止欺瞒、假装、伪造验证。
2. 合同先于实现：API、字段、错误码、状态、业务词未定时不进入实现。
3. 规则必须短：规则只保留会阻止真实错误的内容。
4. 脚本优先：能用 lint、test、route 扫描验证的，不让 AI 反复读文档判断。
5. 越界立刻停：发现越界当场记录到 `data/violations.json`，不允许"下次再说"。
6. 目标优先于指令字面：发现更优实现或明显风险时，先说明判断和取舍。

CHARTER §3 的四条不可妥协原则同样适用，且优先级更高。

## §2 跨仓库顺序

跨业务词、API 形态、枚举、状态机、流程变更时：

1. 先改 ep-shared
2. 再改 epbkend/expatth-backend
3. 再改 ep 和 / 或 epmerchant
4. 跑各仓库 lint / typecheck
5. 汇总跨仓库一致性与剩余风险

`ep`、`epmerchant`、`epbkend` 不得为同一业务概念创造不同名字。

## §3 前端 API 闸门

触发词：补全前端 API、接接口、页面调接口、BFF、proxy、把前端数据接真实后端。

进入实现前必须得到一个明确状态：

| 状态 | 含义 | 下一步 |
| ---- | ---- | ------ |
| `ready-to-code` | 前端调用、BFF、合同、后端路由、实现 / 迁移都清楚 | 写代码 |
| `contract-missing` | shared 没有请求或已实现登记 | 先补 api/requests.md 或 api/registry.md |
| `backend-missing` | 前端 / BFF 存在，后端路由或实现不存在 | 先补后端合同和实现计划 |
| `frontend-only-invalid` | 只有前端入口，没真实 API 价值 | 删除入口或记录暂缓 |
| `remove-entry` | 旧入口和当前主流程冲突 | 删除并记录影响 |

检查顺序：

1. 前端是否真实调用该 API
2. Next BFF route 是否存在
3. api/requests.md 或 api/registry.md 是否登记
4. Laravel routes/api.php 是否有对应路由
5. Controller、Service、Resource、FormRequest 是否齐全
6. 任一不通过先记录状态，不进业务代码

## §4 仓库边界

| 仓库 | 职责 | 禁止 |
| ---- | ---- | ---- |
| ep | 用户端 Next.js | 不发明后端字段；不以商家服务 ID 为新主线；不在页面里堆业务状态机 |
| epmerchant | 商家端 Next.js | 不自造商家 API 字段；不强化"服务商品"旧心智；不绕过 shared 状态机 |
| epbkend/expatth-backend | Laravel 后端 | Controller 不写复杂业务；migration 不塞演示数据；不绕过 shared 合同 |
| ep-shared | 合同、术语、状态、规则 | 不放运行时代码；不把临时聊天结论当稳定合同 |

## §5 前端边界

适用 ep 与 epmerchant。

允许：

- 页面、组件、BFF、i18n、样式、表单、展示状态、用户引导、客户端数据适配
- 基于 shared 合同渲染字段、错误、状态和下一步动作
- BFF 做认证转发、cookie / session 处理、轻量字段映射

禁止：

- 发明 API 字段、业务状态、错误码、金额规则、权限规则
- 把 mock、静态数据、隐藏按钮、本地兜底当真实完成
- 在页面或 BFF 写订单主状态机、匹配逻辑、商家候选算法、钱包金额规则
- 仅靠前端隐藏入口控制权限、金额、所有权
- 创建平行主题或绕过 globals.css 的局部视觉系统
- 无明确要求时添加解释型副文案、规则说明（只保留标题、字段、状态、动作、必要错误 / 合规提示）
- 用户可见界面展示内部状态字段（matching、wait_*、候选分、冻结、内部 id 当标题）
- 用"冻结"描述平台资金保障（客户侧统一用"平台代管"或"平台保障"）
- 用户端费用明细重算金额或展示商家结算

用户端 ep 特有：

- 主入口使用 `standardServiceCode`
- 不把旧 `serviceId` 作为新下单主线
- 不让用户选择商家或师傅作为必经步骤

商家端 epmerchant 特有：

- 长期对象是 `MerchantCapability`、`MerchantCandidate`、`MerchantQuoteConfirmation`
- 旧 `merchant/services*` 只能 compatibility，不强化"服务商品"心智
- 不代替用户确认 MQC 或支付 / 预授权

BFF：

- 是安全代理和轻映射层，不是业务服务层
- 新增或改变后端路径前必须通过 §3 API 闸门
- 不直连数据库，不绕过 Laravel 权限校验

## §6 命名与禁词

核心七词：`StandardService`、`RequirementTemplate`、`RequirementPayload`、`QuotePreview`、`MerchantCapability`、`MerchantCandidate`、`MerchantQuoteConfirmation`。

详细命名规则（文件、ID、字段、状态值）见 NAMING.md。

禁词与改用：

| 禁词 | 改用 |
| ---- | ---- |
| product | StandardService 或商家服务配置 |
| goods | StandardService 或商家服务配置 |
| item（货品义）| 标准服务、订单明细按语境写清 |
| listing | 商家能力配置或服务配置 |
| shop_service | MerchantCapability 或商家服务配置 |
| service product | StandardService 或商家服务配置 |

技术词允许保留：GET、POST、locale、数组元素 item、发票 line item。

## §7 代码结构门禁

行数上限：

| 类型 | 上限 |
| ---- | ---- |
| Next route page | 120 |
| React component | 220 |
| Hook / API client / mapper | 180 |
| Laravel controller | 120 |
| Laravel service | 300 |
| FormRequest / Resource / Action | 160 |
| Migration | 180（基线重建除外，但需注明） |

超过上限时不继续叠加，先抽切片。

## §8 验证要求

按改动选择验证：

- 前端 UI：`npm run lint`，必要时 `npm run build`，浏览器核心路径，移动端布局，控制台错误
- 商家端：附加 `npm run typecheck`
- 后端 API：路由扫描或真实请求；deploy 敏感时 `php artisan yipai:post-deploy-check --skip-http`
- 数据库：migration status 或本地 migrate
- 权限、金额、状态：必须确认后端校验，不接受只看前端

无法验证时，回复里写清原因、风险、下一步。

## §9 自我成长

任务结束前做 30 秒复盘：

- 发现可固化的检查点或失败教训时，运行 `node rules/growth-hook.mjs` 追加候选。
- 候选满足以下全部条件才升级为硬规则：可复用、可验证、能减少错误、不重复现有规则。
- 能脚本化的优先脚本化，不能脚本化的才写成短规则。
- 升级时由用户审阅后合入本文件，AI 不擅自添加。
- 候选数量超过 10 条时必须清理（升级、拒绝或合并），不允许无限增长。
