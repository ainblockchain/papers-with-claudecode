/**
 * Building renderer — detailed village buildings with windows, doors, etc.
 */

/** Darken a hex color by a percentage (0-100) */
function darkenColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16)
  const r = Math.max(0, ((num >> 16) & 0xff) - Math.floor(((num >> 16) & 0xff) * percent / 100))
  const g = Math.max(0, ((num >> 8) & 0xff) - Math.floor(((num >> 8) & 0xff) * percent / 100))
  const b = Math.max(0, (num & 0xff) - Math.floor((num & 0xff) * percent / 100))
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
}

function drawWindow(
  ctx: CanvasRenderingContext2D,
  wx: number,
  wy: number,
  size: number,
) {
  // Frame
  ctx.fillStyle = '#8B6914'
  ctx.fillRect(wx - 2, wy - 2, size + 4, size + 4)
  // Glass
  ctx.fillStyle = '#87CEEB'
  ctx.fillRect(wx, wy, size, size)
  // Cross divider
  ctx.strokeStyle = '#8B6914'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(wx + size / 2, wy)
  ctx.lineTo(wx + size / 2, wy + size)
  ctx.moveTo(wx, wy + size / 2)
  ctx.lineTo(wx + size, wy + size / 2)
  ctx.stroke()
  // Highlight (top-left pane)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.2)'
  ctx.fillRect(wx + 1, wy + 1, size / 2 - 2, size / 2 - 2)
}

export function drawBuilding(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  widthTiles: number,
  heightTiles: number,
  color: string,
  tileSize: number,
  label: string,
) {
  const pw = widthTiles * tileSize
  const ph = heightTiles * tileSize

  // 1. Shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.2)'
  ctx.fillRect(x + 4, y + 4, pw, ph)

  // 2. Building body — upper wall
  ctx.fillStyle = color
  ctx.fillRect(x, y, pw, ph)
  // Lower wall shade
  ctx.fillStyle = darkenColor(color, 15)
  ctx.fillRect(x, y + ph * 0.6, pw, ph * 0.4)
  // Outline
  ctx.strokeStyle = '#1A1A2E'
  ctx.lineWidth = 2
  ctx.strokeRect(x + 1, y + 1, pw - 2, ph - 2)

  // 3. Roof — peaked triangle with overhang
  const overhang = 8
  const roofPeak = 28
  ctx.fillStyle = '#2D1F3D'
  ctx.beginPath()
  ctx.moveTo(x - overhang, y)
  ctx.lineTo(x + pw / 2, y - roofPeak)
  ctx.lineTo(x + pw + overhang, y)
  ctx.closePath()
  ctx.fill()
  // Roof outline
  ctx.strokeStyle = '#1A1A2E'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(x - overhang, y)
  ctx.lineTo(x + pw / 2, y - roofPeak)
  ctx.lineTo(x + pw + overhang, y)
  ctx.stroke()
  // Shingle lines
  ctx.strokeStyle = '#1A1A2E'
  ctx.lineWidth = 0.5
  for (let i = 1; i <= 3; i++) {
    const ly = y - roofPeak + (roofPeak * i) / 4
    const halfW = (pw / 2 + overhang) * (i / 4)
    ctx.beginPath()
    ctx.moveTo(x + pw / 2 - halfW, ly)
    ctx.lineTo(x + pw / 2 + halfW, ly)
    ctx.stroke()
  }

  // 4. Windows — 2 symmetrical windows
  const winSize = tileSize * 0.4
  const winY = y + ph * 0.2
  drawWindow(ctx, x + pw * 0.12, winY, winSize)
  drawWindow(ctx, x + pw * 0.88 - winSize, winY, winSize)

  // 5. Door — centered, arched top
  const doorW = tileSize * 0.55
  const doorH = tileSize * 0.85
  const doorX = x + pw / 2 - doorW / 2
  const doorY = y + ph - doorH
  // Door body
  ctx.fillStyle = '#2D1810'
  ctx.fillRect(doorX, doorY, doorW, doorH)
  // Arch
  ctx.beginPath()
  ctx.arc(doorX + doorW / 2, doorY, doorW / 2, Math.PI, 0)
  ctx.fill()
  // Door frame
  ctx.strokeStyle = '#1A1A2E'
  ctx.lineWidth = 1
  ctx.strokeRect(doorX, doorY, doorW, doorH)
  // Knob
  ctx.fillStyle = '#D4A853'
  ctx.beginPath()
  ctx.arc(doorX + doorW * 0.75, doorY + doorH * 0.5, 2.5, 0, Math.PI * 2)
  ctx.fill()

  // 6. Chimney
  const chimX = x + pw * 0.72
  const chimY = y - roofPeak * 0.6
  ctx.fillStyle = '#6B4423'
  ctx.fillRect(chimX, chimY, 8, 16)
  ctx.fillStyle = '#8B5E3C'
  ctx.fillRect(chimX - 1, chimY - 2, 10, 3)

  // 7. Sign — hanging board below building
  const maxSignW = Math.min(pw * 0.85, 130)
  ctx.font = 'bold 9px sans-serif'
  const textW = ctx.measureText(label).width
  const signW = Math.min(Math.max(textW + 16, 50), maxSignW)
  const signH = 18
  const signX = x + pw / 2 - signW / 2
  const signY = y + ph + 6

  // Board
  ctx.fillStyle = '#D4A853'
  ctx.fillRect(signX, signY, signW, signH)
  ctx.strokeStyle = '#8B6914'
  ctx.lineWidth = 1
  ctx.strokeRect(signX, signY, signW, signH)
  // Hanging posts
  ctx.fillStyle = '#8B6914'
  ctx.fillRect(signX + 4, signY - 5, 3, 5)
  ctx.fillRect(signX + signW - 7, signY - 5, 3, 5)
  // Text
  ctx.fillStyle = '#1A1A2E'
  ctx.font = 'bold 9px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(label, x + pw / 2, signY + signH / 2, signW - 12)
}

/**
 * Draw Cogito NPC building — teal/cyan knowledge agent with brain icon.
 */
export function drawCogitoBuilding(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  widthTiles: number,
  heightTiles: number,
  tileSize: number,
) {
  const pw = widthTiles * tileSize
  const ph = heightTiles * tileSize
  const color = '#0D9488'

  // 1. Shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.25)'
  ctx.fillRect(x + 5, y + 5, pw, ph)

  // 2. Building body
  ctx.fillStyle = color
  ctx.fillRect(x, y, pw, ph)
  ctx.fillStyle = darkenColor(color, 15)
  ctx.fillRect(x, y + ph * 0.6, pw, ph * 0.4)

  // Glow outline (teal)
  ctx.strokeStyle = '#5EEAD4'
  ctx.lineWidth = 2
  ctx.strokeRect(x + 1, y + 1, pw - 2, ph - 2)

  // 3. Dome roof instead of peaked roof
  const overhang = 6
  ctx.fillStyle = '#134E4A'
  ctx.beginPath()
  ctx.ellipse(x + pw / 2, y, pw / 2 + overhang, 24, 0, Math.PI, 0)
  ctx.fill()
  ctx.strokeStyle = '#5EEAD4'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.ellipse(x + pw / 2, y, pw / 2 + overhang, 24, 0, Math.PI, 0)
  ctx.stroke()

  // 4. Brain icon (centered on building face)
  const iconCx = x + pw / 2
  const iconCy = y + ph * 0.32
  const iconR = tileSize * 0.35
  // Brain outer
  ctx.fillStyle = '#CCFBF1'
  ctx.beginPath()
  ctx.arc(iconCx, iconCy, iconR, 0, Math.PI * 2)
  ctx.fill()
  // Brain hemispheres
  ctx.strokeStyle = '#0D9488'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(iconCx, iconCy - iconR * 0.7)
  ctx.lineTo(iconCx, iconCy + iconR * 0.7)
  ctx.stroke()
  // Left folds
  ctx.beginPath()
  ctx.arc(iconCx - iconR * 0.25, iconCy - iconR * 0.2, iconR * 0.35, -0.5, 2)
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(iconCx - iconR * 0.2, iconCy + iconR * 0.25, iconR * 0.3, -0.8, 1.5)
  ctx.stroke()
  // Right folds
  ctx.beginPath()
  ctx.arc(iconCx + iconR * 0.25, iconCy - iconR * 0.2, iconR * 0.35, 1.1, 3.6)
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(iconCx + iconR * 0.2, iconCy + iconR * 0.25, iconR * 0.3, 1.6, 3.9)
  ctx.stroke()

  // 5. Door — centered, arched (matching style)
  const doorW = tileSize * 0.55
  const doorH = tileSize * 0.85
  const doorX = x + pw / 2 - doorW / 2
  const doorY = y + ph - doorH
  ctx.fillStyle = '#134E4A'
  ctx.fillRect(doorX, doorY, doorW, doorH)
  ctx.beginPath()
  ctx.arc(doorX + doorW / 2, doorY, doorW / 2, Math.PI, 0)
  ctx.fill()
  ctx.strokeStyle = '#5EEAD4'
  ctx.lineWidth = 1
  ctx.strokeRect(doorX, doorY, doorW, doorH)
  // Knob
  ctx.fillStyle = '#5EEAD4'
  ctx.beginPath()
  ctx.arc(doorX + doorW * 0.75, doorY + doorH * 0.5, 2.5, 0, Math.PI * 2)
  ctx.fill()

  // 6. Antenna on dome
  const antX = x + pw / 2
  const antY = y - 24
  ctx.strokeStyle = '#5EEAD4'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(antX, y - 20)
  ctx.lineTo(antX, antY - 8)
  ctx.stroke()
  // Antenna orb (pulsing feel)
  ctx.fillStyle = '#2DD4BF'
  ctx.beginPath()
  ctx.arc(antX, antY - 10, 3, 0, Math.PI * 2)
  ctx.fill()

  // 7. Sign — "Cogito" with subtitle "Knowledge Agent"
  const signW = Math.min(pw * 0.9, 120)
  const signH = 26
  const signX = x + pw / 2 - signW / 2
  const signY = y + ph + 6

  // Board
  ctx.fillStyle = '#134E4A'
  ctx.fillRect(signX, signY, signW, signH)
  ctx.strokeStyle = '#5EEAD4'
  ctx.lineWidth = 1
  ctx.strokeRect(signX, signY, signW, signH)
  // Hanging posts
  ctx.fillStyle = '#5EEAD4'
  ctx.fillRect(signX + 4, signY - 5, 3, 5)
  ctx.fillRect(signX + signW - 7, signY - 5, 3, 5)
  // Title
  ctx.fillStyle = '#CCFBF1'
  ctx.font = 'bold 9px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('Cogito', x + pw / 2, signY + 8)
  // Subtitle
  ctx.fillStyle = '#5EEAD4'
  ctx.font = '7px sans-serif'
  ctx.fillText('Knowledge Agent', x + pw / 2, signY + 19)
}
