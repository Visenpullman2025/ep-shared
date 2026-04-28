# 内部 API、回调与运营侧

最后更新：2026-04-28（P0.5：与合同关系说明）

> 不在用户/商家「开放 API 合同」主清单中，但影响资金与数据一致性的入口，在此集中说明，**避免**与 `registry.md` 的 C/M 端路径混淆。  
> **user-api / merchant-api** 中的**新主链** HTTP 若**未**在 `registry` 出现，**则**尚**无**现网实现；**不**在本文件重复列路径，**以** `registry` 的 **planned** 段与 **`api/requests.md`** 为准。

## 1. 支付回调

- **`POST /api/v1/payments/callback`**（`routes/api.php`）：支付渠道服务器回调；**无**用户 JWT。  
- 验签、幂等、与 `YipaiOrder` / `YipaiPayment` 状态更新在实现中完成；**对外字段**以渠道与实现为准。  
- 回调**失败**、**重复**、**签验** 等：以渠道与实现为准；若需**稳定**对账 `code`，在 **[error-codes.md](error-codes.md)** 与 **[requests.md](requests.md)** 登记。  
- 新渠道或新状态字：在 **[requests.md](requests.md)** 提需求，并补 **[error-codes.md](error-codes.md)** 若对客户端有可见影响。

## 2. 运营后台（Dcat Admin）

- **不**经 `routes/api.php` 的 C 端前缀；Laravel Admin 独立路由与权限。  
- 若需与开放 API 共用能力（如审核 `yipai_services`），在 **requests.md** 写「后台与开放面一致的数据字段」类条目。

## 3. 健康检查与运维

- 未在 `api/v1` 列出的 `health`、调度、Horizon 等，按各部署仓库约定；**不**写入 `registry.md` 除非与客户端联调相关。

## 4. 内网或将来 B2B

- 若存在仅内网可调用的管理或同步接口，在此**仅记路径前缀与鉴权方式**；具体见实现与 `requests.md` 的 **R-** 编号。
