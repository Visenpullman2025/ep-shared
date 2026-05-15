# 平台法律协议源文件

本目录是 ExpatTH 所有用户/商家协议的权威源文件。

## 结构

```
legal/
├── README.md              # 本文件
├── VERSION.md             # 全局版本与变更记录
├── privacy-policy/        # 隐私政策
├── terms-of-service/      # 用户服务协议（含 EULA）
├── community-guidelines/  # 广场/社区公约
├── ugc-reporting/         # 举报与处置规则
└── merchant-agreement/    # 商家入驻协议
```

每篇文档以 `{locale}.md` 命名，frontmatter 含 `version`、`updated_at`。

## 修订流程

1. 修改对应 `{doc-code}/{locale}.md`，bump 其 frontmatter `version`。
2. 在 VERSION.md 追加 changelog 条目。
3. 提交 PR，经法律 / 合规人员审阅后合入。
4. 重大版本（major bump）会触发用户重新同意流程（v1 仅保留 schema 支持）。

## 翻译规则

中文为权威源。en / th 翻译必须在文末注明：
「本译本如与中文版本冲突，以中文版本为准」。
