# 越界审计记录

> ⚠️ **唯一真实来源是 `ep-shared/data/violations.json`（由 SQLite 导出）**
> 本文件是可读副本，由 `node dashboard/db/export.js` 自动覆盖更新。
> 手动添加越界请通过 Claude 执行 `POST /api/update`，或运行 `npm run db:migrate` 重新同步。

发现越界时状态只能是 `open`、`fixed`、`accepted-temporary`。

| 日期 | 来源 | 越界行为 | 状态 |
| ---- | ---- | -------- | ---- |
| 2026-05-04 | 前端 API 链路检查 | 前端已存在 `/api/me/favorites` BFF 和页面调用，但 shared 未登记，后端路由未注册。 | fixed |
| 2026-05-06 | Dcat Plus 后台审计 | Dcat 内置表连接跟随默认 PostgreSQL；钱包审核、订单状态存在可绕过受控服务的后台写入口。 | fixed |
| 2026-05-06 | 当前阶段 API 审计 | 用户端 BFF 调用了 Laravel 未注册且 registry 未登记 implemented 的上游路径。 | fixed |
| 2026-05-07 | 商户端 API 审计 | 商家偏好语言 BFF 走到用户端域；订单 registry 声称字段未全部返回；能力配置靠手填 code。 | fixed |
| 2026-05-07 | 商家资料/实名/位置/状态机审计 | 资料保存会覆盖实名 pending；状态机缺失失败动作；错误响应有 debug 泄露。 | fixed |
| 2026-05-07 | 新边界审查 | 用户端首页定位 BFF 代理到 Laravel 未登记接口。 | fixed |
| 2026-05-08 | SQL 边界审计 | 列表接口逐条调用详情聚合器，导致 N+1 查询，列表加载 3-8 秒。 | fixed |
| 2026-05-10 | 代码审计 | 前端 orders-permissions.ts 硬编码订单状态判断逻辑，违反前端边界。 | open |
| 2026-05-10 | 代码审计 | epmerchant 前端硬编码取消罚款 20%，违反金额规则边界。 | accepted-temporary |

完整字段（含影响位置、风险、修正动作）见 `ep-shared/data/violations.json`。
