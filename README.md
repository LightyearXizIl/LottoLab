# LottoLab

LottoLab 是一款 Windows 本地历史号码研究工具，支持双色球与大乐透的官方开奖数据同步、特征统计、可复现的五组候选生成、走步回测和本地收藏。

> 历史评分不等于中奖概率。所有合法号码组合的理论中奖机会相同。LottoLab 不提供账号、支付、投注、代购或任何形式的在线售彩功能。

## 本地开发

```powershell
npm.cmd install
npm.cmd run tauri dev
```

生产构建：

```powershell
npm.cmd run tauri build -- --bundles nsis
```

本机需要 Node.js、Rust MSVC 工具链和 WebView2。开奖数据、收藏和策略预设写入系统应用数据目录中的 SQLite 数据库，不会上传。

## 官方数据

- 双色球：`www.cwl.gov.cn` 官方开奖接口。
- 大乐透：`webapi.sporttery.cn` 官方开奖接口。

同步会校验期号、日期、号码数量、范围和区内不重复；接口失败或结构变化时继续保留本地缓存。CSV 导入格式为：`game, issue, draw_date, primary_numbers, secondary_numbers, sales_yuan, pool_yuan`。

## GitHub Release 与自动更新

仓库：[LightyearXizIl/LottoLab](https://github.com/LightyearXizIl/LottoLab)。推送 `v*` 标签会运行 Windows 构建工作流并创建草稿 Release。

首次正式发布前必须完成以下安全配置：

1. 在安全的本机环境使用 `npm run tauri signer generate` 生成 Tauri 更新密钥，并离线备份私钥。
2. 将私钥和密码分别配置到仓库 Secrets：`TAURI_SIGNING_PRIVATE_KEY`、`TAURI_SIGNING_PRIVATE_KEY_PASSWORD`。
3. 将生成的公钥写入 `src-tauri/tauri.conf.json` 的 updater 配置；公钥可以公开，私钥不得进入仓库或日志。
4. 发布 `v0.0.1` 后，验证 Release 中包含 `LottoLab_0.0.1_x64-setup.exe`、签名文件、SHA-256和 `latest.json`，再用后续版本验证真实更新与数据保留。

未配置更新公钥和签名密钥前，应用只会显示公开 Release 清单检查结果，不会安装任何更新。

## 版权

版权所有 © LightyearXizIl。保留全部权利。本仓库公开展示源码，但未授予复制、修改、再发布或商用许可。
