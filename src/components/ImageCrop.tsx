import React, { useCallback, useEffect, useRef, useState, MouseEvent } from 'react'
import styled from 'styled-components'

interface Size {
  width: number
  height: number
}

interface Rectangle extends Size {
  x: number
  y: number
  rotate: number
}

const CANVAS_PADDING = 100
const MODE: { [key: string]: 'none' | 'blur' | 'crop' | 'rotate' } = {
  NONE: 'none',
  BLUR: 'blur',
  CROP: 'crop',
  ROTATE: 'rotate',
}
// const ROTATE_ANGLE = 45

export default function ImageCrop() {
  const canvasWrapper = useRef<HTMLDivElement>(null)
  const blurLayer = useRef<HTMLCanvasElement>(null)
  const imageLayer = useRef<HTMLCanvasElement>(null)
  const dragLayer = useRef<HTMLCanvasElement>(null)

  const [mode, setMode] = useState<'none' | 'blur' | 'crop' | 'rotate'>('none')
  const [rotateAngle, setRotateAngle] = useState(0)
  const [cropArea, setCropArea] = useState<Rectangle>({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    rotate: 0,
  })
  const [cropAreas, setCropAreas] = useState<Rectangle[]>([])

  const [blurArea, setBlurArea] = useState<Rectangle>({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    rotate: 0,
  })
  const [blurAreas, setBlurAreas] = useState<Rectangle[]>([])

  const [dragStart, setDragStart] = useState(false)
  const originFile = useRef<File | null>(null)
  const originSize = useRef<Size>({ width: 0, height: 0 })
  const [imgSrc, setImgSrc] = useState('')

  // const rotateCanvas = useCallback(() => {
  //   const canvas = imageLayer.current
  //   if (!canvas) return
  //   const ctx = canvas.getContext('2d')
  //   if (!ctx) return
  //   const image = new Image()
  //   image.onload = () => {
  //     ctx.clearRect(0, 0, canvas.width, canvas.height)
  //     ctx.translate(canvas.width / 2, canvas.height / 2)
  //     ctx.rotate(((rotateAngle % 360) * Math.PI) / 180)
  //     ctx.translate(-canvas.width / 2, -canvas.height / 2)
  //     ctx.drawImage(image, 0, 0)
  //   }
  //   image.src = imgSrc
  // }, [imgSrc, rotateAngle])

  // useEffect(() => {
  //   rotateCanvas()
  // }, [rotateCanvas])

  const handleMouseDown = (e: MouseEvent<HTMLCanvasElement>) => {
    if (mode !== MODE.CROP) return
    const rect = dragLayer.current!.getBoundingClientRect()
    const { offsetX, offsetY } = e.nativeEvent
    setDragStart(true)
    setCropArea((prev) => {
      return {
        ...prev,
        x: (offsetX * originSize.current.width) / rect.width,
        y: (offsetY * originSize.current.height) / rect.height,
        rotate: rotateAngle,
      }
    })
    const ctx = dragLayer.current!.getContext('2d')
    if (!ctx) return
  }

  const handleMouseMove = (e: MouseEvent<HTMLCanvasElement>) => {
    if (mode !== MODE.CROP) return
    if (!dragStart) return
    const rect = dragLayer.current!.getBoundingClientRect()
    const ctx = dragLayer.current!.getContext('2d')
    if (!ctx) return
    const { offsetX, offsetY } = e.nativeEvent

    setCropArea((area) => ({
      ...area,
      width: (offsetX * originSize.current.width) / rect.width - area.x,
      height: (offsetY * originSize.current.height) / rect.height - area.y,
    }))
  }

  const handleMouseUp = () => {
    if (mode !== MODE.CROP) return
    if (!dragStart) return
    setDragStart(false)
    setCropAreas((prev) => [...prev, cropArea])
    setCropArea({
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      rotate: 0,
    })
  }

  const drawDragArea = useCallback(() => {
    const canvas = dragLayer.current
    const context = canvas?.getContext('2d')
    if (canvas) context?.clearRect(0, 0, canvas.width, canvas.height)
    if (!context) return
    context.lineWidth = 2
    context.fillStyle = 'rgba(200, 200, 200, 0.8)'
    context?.strokeRect(cropArea.x, cropArea.y, cropArea.width, cropArea.height)
    context.fillStyle = 'rgba(200,200,200, 0.5)'
    context.fillRect(cropArea.x, cropArea.y, cropArea.width, cropArea.height)
  }, [cropArea])

  useEffect(() => {
    drawDragArea()
  }, [drawDragArea])

  useEffect(() => {
    cropAreas.forEach((area) => {
      const context = dragLayer.current?.getContext('2d')
      if (!context) return
      context.lineWidth = 2
      context.fillStyle = 'rgba(200, 200, 200, 0.8)'
      context?.strokeRect(area.x, area.y, area.width, area.height)
      context.fillStyle = 'rgba(200,200,200, 0.5)'
      context.fillRect(area.x, area.y, area.width, area.height)
    })
  }, [cropAreas])

  // 이미지 캔버스에 그리는 useEffect
  useEffect(() => {
    const image = new Image()
    image.onload = () => {
      if (!imageLayer.current) return
      if (!blurLayer.current) return
      if (!dragLayer.current) return
      const ctx = imageLayer.current.getContext('2d')
      if (!ctx) return
      const ctx2 = blurLayer.current.getContext('2d')
      if (!ctx2) return
      const ctx3 = dragLayer.current.getContext('2d')
      if (!ctx3) return
      ctx.clearRect(0, 0, imageLayer.current.width, imageLayer.current.height)
      ctx2.clearRect(0, 0, blurLayer.current.width, blurLayer.current.height)
      ctx3.clearRect(0, 0, dragLayer.current.width, dragLayer.current.height)
      imageLayer.current.width = image.naturalWidth
      imageLayer.current.height = image.naturalHeight
      blurLayer.current.width = image.naturalWidth
      blurLayer.current.height = image.naturalHeight
      dragLayer.current.width = image.naturalWidth
      dragLayer.current.height = image.naturalHeight
      originSize.current = { width: image.naturalWidth, height: image.naturalHeight }

      const isWidthLonger = image.naturalWidth > image.naturalHeight
      const ratio = image.naturalWidth / image.naturalHeight
      // const diagonal = Math.sqrt(image.naturalWidth ** 2 + image.naturalHeight ** 2)
      const width = canvasWrapper.current!.clientWidth - CANVAS_PADDING * 2
      const height = canvasWrapper.current!.clientHeight - CANVAS_PADDING * 2
      imageLayer.current.style.width = `${isWidthLonger ? width : width * ratio}px`
      imageLayer.current.style.height = `${isWidthLonger ? height / ratio : width}px`

      blurLayer.current.style.width = `${isWidthLonger ? width : width * ratio}px`
      blurLayer.current.style.height = `${isWidthLonger ? height / ratio : width}px`

      dragLayer.current.style.width = `${isWidthLonger ? width : width * ratio}px`
      dragLayer.current.style.height = `${isWidthLonger ? height / ratio : width}px`
      ctx.drawImage(image, 0, 0)
    }
    image.src = imgSrc
  }, [imgSrc])

  return (
    <>
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Container ref={canvasWrapper}>
          {imgSrc ? (
            <>
              <Canvas ref={blurLayer} rotate={rotateAngle} />
              <Canvas ref={imageLayer} rotate={rotateAngle} />
              <Canvas
                rotate={rotateAngle}
                ref={dragLayer}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              />
            </>
          ) : (
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                if (e.target.files === null) return
                originFile.current = e.target.files[0]
                const imgUrl = URL.createObjectURL(e.target.files?.[0])
                setImgSrc(imgUrl)
              }}
            />
          )}
        </Container>
      </div>
      <div>
        {/* <button
          onClick={() => {
            setMode((prev) => {
              if (prev === MODE.ROTATE) {
                return MODE.NONE
              }
              return MODE.ROTATE
            })
          }}
        >
          Rotate
        </button>
        <button
          disabled={mode !== MODE.ROTATE}
          onClick={() => {
            setRotateAngle((prev) => (prev - ROTATE_ANGLE) % 360)
          }}
        >
          {'<'}
        </button>
        <button
          disabled={mode !== MODE.ROTATE}
          onClick={() => {
            setRotateAngle((prev) => (prev + ROTATE_ANGLE) % 360)
          }}
        >
          {'>'}
        </button> */}
        <button
          disabled={originFile.current === null}
          onClick={() => {
            setMode((prev) => {
              if (prev === MODE.BLUR) {
                return MODE.NONE
              }
              return MODE.BLUR
            })
          }}
        >
          blur
        </button>
        <button
          disabled={originFile.current === null}
          onClick={() => {
            setMode((prev) => {
              if (prev === MODE.CROP) {
                return MODE.NONE
              }
              return MODE.CROP
            })
          }}
        >
          crop
        </button>
        <button
          onClick={() => {
            const canvas = imageLayer.current
            if (!canvas) return
            const ctx = canvas.getContext('2d')
            if (!ctx) return
            cropAreas.map((area) => {
              const resultCanvas = document.createElement('canvas')
              resultCanvas.width = area.width
              resultCanvas.height = area.height
              const resultCtx = resultCanvas.getContext('2d')
              resultCtx!.drawImage(canvas, area.x, area.y, area.width, area.height, 0, 0, area.width, area.height)
              const link = document.createElement('a')
              link.download = 'image.png'
              link.href = resultCanvas.toDataURL('image/png')
              link.click()
            })
          }}
          disabled={mode !== MODE.NONE || originFile.current === null}
        >
          save
        </button>
      </div>
    </>
  )
}

const Container = styled.div`
  width: 900px;
  height: 900px;
  padding: ${CANVAS_PADDING}px;
  position: relative;
  background-color: #f5f5f5;
`

const Canvas = styled.canvas<{ rotate: number }>`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) rotate(${(props) => props.rotate}deg);
  border: 1px solid black;
`
