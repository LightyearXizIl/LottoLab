# LottoLab

LottoLab 是一款 Windows 与 Android 本地历史号码研究工具，支持双色球与大乐透的官方开奖数据同步、特征统计、可复现的五组候选生成、走步回测和本地收藏。

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

## Android 开发

Android 构建需要 Android Studio、JDK 21、Android SDK Platform、Platform-Tools、Build-Tools、Command-line Tools、NDK，以及四个 Rust Android targets。当前生成工程使用 Gradle 8.14.3；已验证的构建 JDK 是 Microsoft OpenJDK 21.0.12。Android Studio Quail 3 自带的 JDK 25 不能用于运行该版本 Gradle，请将 `JAVA_HOME` 指向 JDK 21。

首次初始化：

```powershell
npm.cmd run tauri android init
```

连接真机或启动模拟器后运行：

```powershell
npm.cmd run tauri android dev
```

构建本地 APK：

```powershell
.\scripts\build-android-release.ps1
```

Android 最低版本为 Android 9（SDK 28）。Windows 与 Android 各自使用独立的本地 SQLite 数据库，不进行账号或云同步。Release keystore 必须保存在仓库外；`src-tauri/gen/android/keystore.properties`、`*.jks` 与 `*.keystore` 已被 Git 忽略。

Windows 下如果仓库位于含中文字符的路径，生成工程已通过 `android.overridePathCheck=true` 允许 AGP 原地构建，并关闭 Kotlin 增量编译以兼容 Cargo 缓存与工程位于不同盘符的情况。运行 API 28 x86_64 模拟器还需要启用 Windows Hypervisor Platform 或安装 Android Emulator Hypervisor Driver；安装驱动后可直接使用已创建的 `LottoLab_API_28` AVD。

## 官方数据

- 双色球：`www.cwl.gov.cn` 官方开奖接口。
- 大乐透：`webapi.sporttery.cn` 官方开奖接口。

同步会校验期号、日期、号码数量、范围和区内不重复；接口失败或结构变化时继续保留本地缓存。CSV 导入格式为：`game, issue, draw_date, primary_numbers, secondary_numbers, sales_yuan, pool_yuan`。

## GitHub Release 与自动更新

仓库：[LightyearXizIl/LottoLab](https://github.com/LightyearXizIl/LottoLab)。推送 `v*` 标签会运行 Windows 构建工作流并创建草稿 Release。

首次正式发布前必须完成以下安全配置：

1. 在安全的本机环境使用 `npm run tauri signer generate` 生成 Tauri 更新密钥，并离线备份私钥。
2. 将私钥和密码分别配置到仓库 Secrets：`TAURI_SIGNING_PRIVATE_KEY`、`TAURI_SIGNING_PRIVATE_KEY_PASSWORD`。
3. 将生成的公钥写入 `src-tauri/tauri.windows.conf.json` 的 updater 配置；公钥可以公开，私钥不得进入仓库或日志。
4. 发布 `v0.0.2` 后，验证 Release 中包含 Windows 安装程序及其 `.sig`（Tauri v2 将签名 NSIS 安装程序直接作为更新包）、`latest.json`、通用 APK、`release.json` 和 SHA-256；v0.0.2 是自动更新引导版本，需在 v0.0.3 验证公开版本间的真实更新与数据保留。

未配置更新公钥和签名密钥前，应用只会显示公开 Release 清单检查结果，不会安装任何更新。

## 版权

版权所有 © LightyearXizIl。保留全部权利。本仓库公开展示源码，但未授予复制、修改、再发布或商用许可。
