# 商户 API 类型（已迁移）

TypeScript 契约已迁至仓库内：

**`src/lib/api/merchant-api.ts`**

请在代码中使用：

```ts
import type { … } from "@/lib/api/merchant-api";
```

构建环境若未同步整个 `shared/` 目录，不应再依赖本目录下的 `.ts` 文件。
