# Shared 数据摘要（自动生成，勿手动编辑）

> 由 `node dashboard/db/export.js` 生成
> 最后更新：2026-05-09

## 需求池统计

| 状态 | 数量 |
|------|------|
| implemented | 32 |
| accepted | 1 |
| draft | 1 |
| rejected | 3 |
| **总计** | **37** |

## 开放代码问题（8 条）

- [critical] **违规** MerchantPortalController 320行·33个方法  
  `epbkend/app/Http/Controllers/Api/V1/MerchantPortalController.php`
- [critical] **违规** 前端硬编码订单状态判断逻辑  
  `ep/src/lib/orders-permissions.ts:54`
- [high] **超限** 多个页面严重超行数限制  
  `ep/profile/page.tsx 380行; epmerchant/services/[id]/page.tsx 435行`
- [low] **遗留** 废弃 quote/ 目录未清理  
  `ep/src/app/[locale]/standard-services/[code]/quote/`
- [low] **硬编码** locale 默认值 'zh' 硬编码 8+ 处  
  `epbkend 多个 Controller`
- [medium] **不一致** API响应格式不统一(list/items/数组)  
  `ep/src/lib/order-center-list.ts`
- [medium] **字段越界** workflowStatus 出现在钱包字段  
  `ep/src/lib/wallet.ts:111`
- [medium] **N+1** StandardServiceController 未 eager load  
  `epbkend StandardServiceController::index()`

## 开放越界记录（0 条）

无开放越界
