window.__ModuleLoader__.load({
  id: 'dsh-rightbar-tab-gestures',
  factory() {
    // 定位标签胶囊只看 dockkit 自己的 data 属性，不看哈希类名：类名随构建变化，
    // data-dockkit-tab 是标签条的契约。没有受支持的插槽能改标签胶囊的交互，
    // 所以这里退到页面级事件捕获，但关闭动作仍然复用官方关闭按钮，
    // 不自己调用 layout 存储 —— 关闭规则（唯一停靠的 guide 不可关、焦点回落、
    // 清理 close 处理器）全部由官方逻辑保证。
    const TAB_CHIP = '[data-dockkit-tab]'
    const CLOSE_BUTTON = '[data-dockkit-tab-close]'

    const chipOf = (node) => (node instanceof Element ? node.closest(TAB_CHIP) : null)
    const insideCloseButton = (node) => node instanceof Element && node.closest(CLOSE_BUTTON) !== null

    /** 关闭按钮只在标签可关闭时渲染，点它等价于用户点 “×”。 */
    function closeViaShippedControl(chip) {
      const button = chip.querySelector(CLOSE_BUTTON)
      if (button === null) return false
      button.click()
      return true
    }

    /** 双击会选中标签标题文字，关掉标签后把这段残留选区一并清掉。 */
    function dropSelectionInside(chip) {
      const selection = window.getSelection()
      if (selection === null || selection.isCollapsed) return
      if (chip.contains(selection.anchorNode)) selection.removeAllRanges()
    }

    return {
      apply(ctx) {
        const onAuxClick = (event) => {
          if (event.button !== 1 || insideCloseButton(event.target)) return
          const chip = chipOf(event.target)
          if (chip !== null) closeViaShippedControl(chip)
        }

        const onDoubleClick = (event) => {
          if (event.button !== 0 || insideCloseButton(event.target)) return
          const chip = chipOf(event.target)
          if (chip === null || !closeViaShippedControl(chip)) return
          // 双击默认会选中标题文字，标签已经关掉了，这个默认行为没有意义，一并吞掉。
          event.preventDefault()
          dropSelectionInside(chip)
        }

        // 中键按下在 Chromium 上会进入自动滚动模式；标签上要按浏览器语义吞掉，
        // 只拦 mousedown，pointerdown 仍照常交给 dockkit 做激活/拖拽判断。
        const onMouseDown = (event) => {
          if (event.button !== 1) return
          if (chipOf(event.target) !== null) event.preventDefault()
        }

        ctx.effect(() => {
          document.addEventListener('auxclick', onAuxClick, true)
          document.addEventListener('dblclick', onDoubleClick, true)
          document.addEventListener('mousedown', onMouseDown, true)
          return () => {
            document.removeEventListener('auxclick', onAuxClick, true)
            document.removeEventListener('dblclick', onDoubleClick, true)
            document.removeEventListener('mousedown', onMouseDown, true)
          }
        }, 'rightbar-tab-gestures: middle-click and double-click close')
      },
    }
  },
})
