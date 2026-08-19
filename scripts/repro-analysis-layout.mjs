const endpoint = process.env.LOTTOLAB_CDP_ENDPOINT ?? 'http://127.0.0.1:9222'
const targets = await (await fetch(`${endpoint}/json/list`)).json()
const target = targets.find(item => item.type === 'page' && item.url.includes('127.0.0.1:4173'))

if (!target) throw new Error('LottoLab page target not found')

const socket = new WebSocket(target.webSocketDebuggerUrl)
await new Promise((resolve, reject) => {
  socket.onopen = resolve
  socket.onerror = reject
})

let requestId = 0
const pending = new Map()
socket.onmessage = event => {
  const message = JSON.parse(event.data)
  const resolve = pending.get(message.id)
  if (!resolve) return
  pending.delete(message.id)
  resolve(message)
}

function call(method, params = {}) {
  return new Promise(resolve => {
    const id = ++requestId
    pending.set(id, resolve)
    socket.send(JSON.stringify({ id, method, params }))
  })
}

await call('Runtime.enable')
await call('Emulation.setDeviceMetricsOverride', {
  width: Number(process.env.LOTTOLAB_VIEWPORT_WIDTH ?? 412),
  height: Number(process.env.LOTTOLAB_VIEWPORT_HEIGHT ?? 915),
  deviceScaleFactor: 1,
  mobile: true,
})
await call('Runtime.evaluate', {
  expression: "[...document.querySelectorAll('.bottom-nav button')].find(button => button.textContent.includes('分析')).click()",
})
await new Promise(resolve => setTimeout(resolve, 500))

const expression = `JSON.stringify((() => {
  const measure = selector => {
    const element = document.querySelector(selector)
    const rect = element?.getBoundingClientRect()
    return element ? {
      clientWidth: element.clientWidth,
      scrollWidth: element.scrollWidth,
      left: rect.left,
      right: rect.right,
      width: rect.width,
      overflowX: getComputedStyle(element).overflowX,
    } : null
  }
  return {
    innerWidth,
    visualViewportWidth: visualViewport?.width,
    html: measure('html'),
    body: measure('body'),
    app: measure('#app'),
    shell: measure('.app-shell'),
    main: measure('.main'),
    view: measure('.view'),
    analytics: measure('.analytics'),
    card: measure('.analysis-card'),
    frequency: measure('.frequency'),
    bottomNav: measure('.bottom-nav'),
  }
})())`

const response = await call('Runtime.evaluate', { expression, returnByValue: true })
const metrics = JSON.parse(response.result.result.value)
console.log(JSON.stringify(metrics, null, 2))
socket.close()

if (metrics.html.scrollWidth > metrics.html.clientWidth) {
  console.error(`FAIL: document width is ${metrics.html.scrollWidth}px for a ${metrics.html.clientWidth}px viewport`)
  process.exitCode = 1
} else {
  console.log('PASS: analysis page does not widen the document')
}
