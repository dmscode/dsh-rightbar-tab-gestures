#!/usr/bin/env node
// 用假 DOM 驱动真实的 lib/client.js：没有浏览器也能验证事件接线与守卫。
// 覆盖的是"哪个事件、命中谁、点了几次、有没有 preventDefault、停用后是否摘干净"；
// 真实 DOM 里才会有的行为（× 的悬停显隐、中键自动滚动的视觉）仍靠人工确认。
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'))
const listeners = new Map()
let captured
let closeClicks = 0
const selection = { isCollapsed: true, anchorNode: null, removed: 0, removeAllRanges() { this.removed += 1 } }

globalThis.Element = class Element {}
class Chip extends globalThis.Element {
  constructor() { super(); this.button = new CloseButton() }
  closest(selector) { return selector === '[data-dockkit-tab]' ? this : null }
  querySelector(selector) { return selector === '[data-dockkit-tab-close]' ? this.button : null }
  contains() { return true }
}
class CloseButton extends globalThis.Element {
  closest(selector) { return selector === '[data-dockkit-tab-close]' ? this : null }
  click() { closeClicks += 1 }
}
class Stranger extends globalThis.Element {
  closest() { return null }
}

globalThis.window = {
  __ModuleLoader__: { load: (mod) => { captured = mod } },
  getSelection: () => selection,
}
globalThis.document = {
  addEventListener: (type, fn, capture) => listeners.set(type, { fn, capture }),
  removeEventListener: (type) => listeners.delete(type),
}

await import(new URL('./lib/client.js', import.meta.url).href)

const checks = []
function check(name, fn) {
  fn()
  checks.push(name)
  console.log(`  ok  ${name}`)
}

const fire = (type, event) => listeners.get(type).fn(event)
const effects = []
const chip = new Chip()

check('模块 id 与包名一致', () => assert.equal(captured.id, pkg.name))
check('工厂返回 apply', () => assert.equal(typeof captured.factory().apply, 'function'))

const plugin = captured.factory()
check('不注入服务，避免卡在 pending', () => assert.equal(plugin.inject, undefined))

plugin.apply({ effect: (fn, label) => effects.push({ label, cleanup: fn() }) })

check('三个监听都走捕获阶段', () => {
  assert.deepEqual([...listeners.keys()].sort(), ['auxclick', 'dblclick', 'mousedown'])
  for (const entry of listeners.values()) assert.equal(entry.capture, true)
})

check('中键点标签关一次', () => {
  closeClicks = 0
  fire('auxclick', { button: 1, target: chip })
  assert.equal(closeClicks, 1)
})

check('双击左键关一次并吞掉默认行为', () => {
  closeClicks = 0
  selection.isCollapsed = false
  const event = { button: 0, target: chip, defaultPrevented: false, preventDefault() { this.defaultPrevented = true } }
  fire('dblclick', event)
  assert.equal(closeClicks, 1)
  assert.equal(event.defaultPrevented, true)
  assert.equal(selection.removed, 1, '双击选中的标题文字应当被清掉')
})

check('点在 × 上不重复关闭', () => {
  closeClicks = 0
  fire('auxclick', { button: 1, target: new CloseButton() })
  fire('dblclick', { button: 0, target: new CloseButton(), preventDefault() {} })
  assert.equal(closeClicks, 0)
})

check('标签之外不响应', () => {
  closeClicks = 0
  fire('auxclick', { button: 1, target: new Stranger() })
  fire('dblclick', { button: 0, target: new Stranger(), preventDefault() {} })
  assert.equal(closeClicks, 0)
})

check('中键按下只吞标签上的自动滚动', () => {
  const onChip = { button: 1, target: chip, prevented: false, preventDefault() { this.prevented = true } }
  fire('mousedown', onChip)
  assert.equal(onChip.prevented, true)
  const left = { button: 0, target: chip, prevented: false, preventDefault() { this.prevented = true } }
  fire('mousedown', left)
  assert.equal(left.prevented, false, '左键按下要留给 dockkit 做激活与拖拽')
})

check('停用后监听全部摘除', () => {
  effects[0].cleanup()
  assert.equal(listeners.size, 0)
})

console.log(`\n${checks.length} checks passed`)
