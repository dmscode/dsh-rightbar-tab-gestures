# 更新日志

## 1.0.0 — 2026-10-26

首个版本。

### 功能
- 右侧栏标签支持**鼠标中键关闭**：`auxclick`（button 1）命中标签胶囊即关闭；中键按下时在标签上吞掉 Chromium 的自动滚动，别处不受影响。
- 右侧栏标签支持**左键双击关闭**：命中标签胶囊即关闭并 `preventDefault`，随后清掉双击选中的标题文字。
- 关闭动作复用官方渲染的 `×` 按钮，标签可关闭性仍由 `canCloseTab` 决定，因此唯一停靠的 guide 卡片依旧关不掉。
- 点在 `×` 上时不触发手势，避免一次双击连关多个标签（`×` 关闭后焦点落到相邻标签，第二次点击会打到下一个标签上）。

### 结构
- 只有客户端半边：`lib/client.js` 以 `window.__ModuleLoader__.load(...)` 注册，`lib/index.js` 的 `apply()` 是空的——它的存在只为让这个包成为插件列表里可开关的一行，而不是隐形侧挂。
- 定位使用 dockkit 契约属性 `data-dockkit-tab` / `data-dockkit-tab-close`，不用哈希类名。
- 三个监听都挂在 `document` 的捕获阶段，并用 `ctx.effect` 注册清理；插件停用后监听全部摘除。

### 已知限制
- 上游改掉 `data-dockkit-tab*` 契约时手势会静默失效（不会误伤其他交互）。
- 不提供 Pin：标签模型没有钉住字段，也没有排序 API，只能做表面效果，故不做。

### 工程
- 品牌资产：`assets/icon.svg` 矢量源（与 dsh-cloudflare-media 同一套视觉语言：暖色底、深色描边），衍出 1024/512/256/128/64 PNG；`assets/cover-1600x900.png` 功能封面与 3200×1800 母版，均由 `assets/render.mjs`（CDP 固定布局视口）渲染。
- `package.json` 声明 `"icon": "./assets/icon.svg"`（宿主 `iconOf()` 只认清单里的相对路径、≤256 KiB），否则插件列表只显示默认图标。
- `locale/zh.json`、`locale/en.json` 提供中英文显示名与简介；`exports` 放行 `"./locale/*.json"`，否则 ESM 解析会因白名单抛 `ERR_PACKAGE_PATH_NOT_EXPORTED`，本地化静默失效。
- `.github/workflows/release.yml`：推送 `v*` tag 发布，正文由 `scripts/release-notes.mjs` 从本文件生成。
