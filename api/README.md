# API 文档索引

最后更新：2026-04-28

## 三种文档，职责不混

| 文档 | 职责 | 读者 |
|------|------|------|
| **[requests.md](requests.md)** | **唯一需求池**：缺接口、缺字段、错误码、冲突、后台/后端发现的问题 | 全角色；**先写后做** |
| **[registry.md](registry.md)** | **已完成、已联调、当前可用** 的 HTTP 接口目录 | 前后端、联调 |
| **user-api.md / merchant-api.md / admin-api.md** | **合同**级稳定描述（不承需求池） | 产品/合同/对外 |

**禁止**在 `user-api` / `merchant-api` / `admin-api` 中堆积「待做」；**禁止**在实现里先改路由再补 `requests.md`（见 `roles/backend-api.md`）。

## 其它

- **内部/回调/非 C 端**： [internal-api.md](internal-api.md)  
- **错误码与 HTTP 约定**：[error-codes.md](error-codes.md)  
- **契约包目录**（若存在）：`api/contracts/`

## Legacy

- `docs/api-list.md`、`docs/api-request.md`：**deprecated**，见仓库根 `README.md` 说明。  
- `docs/api-user-list.md`、`docs/api-merchant-list.md`：历史清单；**维护面**以 **registry** 为准。
