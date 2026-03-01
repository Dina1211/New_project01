# 番茄专注 🍅

一个移动端优先的番茄工作法 SPA。

## 启动

```bash
npm install
npm run dev
```

浏览器打开 http://localhost:5173

## Dev 模式（快速测试）

在 URL 后加 `?dev=1`，时长变为：Focus=10s / 短休=5s / 长休=8s

```
http://localhost:5173/?dev=1
```

## 核心机制

| 模式 | 时长 | 计入统计 |
|------|------|---------|
| Try Mode | 5 min | ❌ 不计入 |
| Focus Mode | 25 min | ✅ 完成后计入 |
| 短休 | 5 min | — |
| 长休（每 4 个后）| 30 min | — |

数据存储在 `localStorage`，刷新不丢失，含计时恢复。