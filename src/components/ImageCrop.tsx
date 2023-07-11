import { useCallback, useEffect, useRef, useState, MouseEvent } from 'react'
import styled from 'styled-components'
import DragDropImage from './DragDropImage'

interface Size {
  width: number
  height: number
}

interface Rectangle extends Size {
  x: number
  y: number
  rotate: number
}

const CANVAS_PADDING = 50
const MODE: { [key in 'NONE' | 'BLUR' | 'CROP' | 'ROTATE']: 'none' | 'blur' | 'crop' | 'rotate' } = {
  NONE: 'none',
  BLUR: 'blur',
  CROP: 'crop',
  ROTATE: 'rotate',
}
// const ROTATE_ANGLE = 45

const INIT_RECTANGLE: Rectangle = {
  x: 0,
  y: 0,
  width: 0,
  height: 0,
  rotate: 0,
}

export default function ImageCrop() {
  const canvasWrapper = useRef<HTMLDivElement>(null)

  const blurCanvas = useRef<HTMLCanvasElement>(document.createElement('canvas'))

  const imageLayer = useRef<HTMLCanvasElement>(null)
  const blurLayer = useRef<HTMLCanvasElement>(null)
  const dragLayer = useRef<HTMLCanvasElement>(null)

  const [mode, setMode] = useState<'none' | 'blur' | 'crop' | 'rotate'>('none')
  const [rotateAngle] = useState(0)
  const [cropArea, setCropArea] = useState<Rectangle>(INIT_RECTANGLE)
  const [cropAreas, setCropAreas] = useState<Rectangle[]>([])

  const [blurArea, setBlurArea] = useState<Rectangle>(INIT_RECTANGLE)
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
    if (mode === MODE.NONE) return
    const rect = dragLayer.current!.getBoundingClientRect()
    const { offsetX, offsetY } = e.nativeEvent
    setDragStart(true)
    if (mode === MODE.BLUR) {
      setBlurArea({
        ...INIT_RECTANGLE,
        x: (offsetX * originSize.current.width) / rect.width,
        y: (offsetY * originSize.current.height) / rect.height,
        rotate: rotateAngle,
      })
      return
    }
    if (mode === MODE.CROP) {
      setCropArea({
        ...INIT_RECTANGLE,
        x: (offsetX * originSize.current.width) / rect.width,
        y: (offsetY * originSize.current.height) / rect.height,
        rotate: rotateAngle,
      })
    }
  }

  const handleMouseMove = (e: MouseEvent<HTMLCanvasElement>) => {
    if (!dragStart) return
    if (mode === MODE.NONE) return
    const rect = dragLayer.current!.getBoundingClientRect()
    const { offsetX, offsetY } = e.nativeEvent
    if (mode === MODE.BLUR) {
      setBlurArea((area) => ({
        ...area,
        width: (offsetX * originSize.current.width) / rect.width - area.x,
        height: (offsetY * originSize.current.height) / rect.height - area.y,
      }))
      return
    }
    if (mode === MODE.CROP) {
      setCropArea((area) => ({
        ...area,
        width: (offsetX * originSize.current.width) / rect.width - area.x,
        height: (offsetY * originSize.current.height) / rect.height - area.y,
      }))
      return
    }
  }

  const handleMouseUp = () => {
    if (!dragStart) return
    if (mode === MODE.NONE) return
    setDragStart(false)
    if (mode === MODE.CROP) {
      if (cropArea.width !== 0 && cropArea.height !== 0) {
        setCropAreas((prev) => [...prev, cropArea])
      }
      setCropArea(INIT_RECTANGLE)
      return
    }
    if (mode === MODE.BLUR) {
      if (blurArea.width !== 0 && blurArea.height !== 0) {
        setBlurAreas((prev) => [...prev, blurArea])
      }
      setBlurArea(INIT_RECTANGLE)
      return
    }
  }

  const drawCropArea = useCallback(() => {
    const canvas = dragLayer.current
    const context = canvas?.getContext('2d')
    if (canvas) context?.clearRect(0, 0, canvas.width, canvas.height)
    if (!context) return
    context.save()
    context.lineWidth = 2
    context.fillStyle = 'rgba(200, 200, 200, 0.8)'
    context.strokeRect(cropArea.x, cropArea.y, cropArea.width, cropArea.height)
    context.fillStyle = 'rgba(200,200,200, 0.5)'
    context.fillRect(cropArea.x, cropArea.y, cropArea.width, cropArea.height)
    context.restore()
  }, [cropArea])

  const drawBlurArea = useCallback(() => {
    const canvas = dragLayer.current
    const context = canvas?.getContext('2d')
    if (canvas) context?.clearRect(0, 0, canvas.width, canvas.height)
    if (!context) return
    context.save()
    context.lineWidth = 2
    context.fillStyle = 'rgba(200, 200, 200, 0.8)'
    context.strokeRect(blurArea.x, blurArea.y, blurArea.width, blurArea.height)
    context.fillStyle = 'rgba(200,200,200, 0.5)'
    context.fillRect(blurArea.x, blurArea.y, blurArea.width, blurArea.height)
    context.restore()
  }, [blurArea])

  useEffect(() => {
    drawBlurArea()
  }, [drawBlurArea])

  useEffect(() => {
    drawCropArea()
  }, [drawCropArea])

  useEffect(() => {
    const context = dragLayer.current?.getContext('2d')
    if (!context) return
    context.clearRect(0, 0, dragLayer.current!.width, dragLayer.current!.height)
    cropAreas.forEach((area) => {
      context.save()
      context.lineWidth = 2
      context.fillStyle = 'rgba(200, 200, 200, 0.8)'
      context?.strokeRect(area.x, area.y, area.width, area.height)
      context.fillStyle = 'rgba(200,200,200, 0.5)'
      context.fillRect(area.x, area.y, area.width, area.height)
      context.restore()
    })
  }, [cropAreas])

  useEffect(() => {
    const blurContext = blurCanvas.current?.getContext('2d')
    const blurLayerContext = blurLayer.current?.getContext('2d')
    const context = imageLayer.current?.getContext('2d')
    if (!blurContext) return
    if (!blurLayerContext) return
    if (!context) return
    blurLayerContext.clearRect(0, 0, imageLayer.current!.width, imageLayer.current!.height)
    blurAreas.forEach((area) => {
      const { x, y, width, height } = area
      const imgData = blurContext.getImageData(x, y, width, height)
      blurLayerContext.putImageData(imgData, x, y)
    })
  }, [blurAreas])

  // 이미지 캔버스에 그리는 useEffect
  useEffect(() => {
    const image = new Image()
    image.onload = () => {
      if (!blurCanvas.current) return
      if (!imageLayer.current) return
      if (!dragLayer.current) return
      if (!blurLayer.current) return

      const ctx = imageLayer.current.getContext('2d')
      const ctx2 = blurCanvas.current.getContext('2d')
      const ctx3 = dragLayer.current.getContext('2d')
      const ctx4 = blurLayer.current.getContext('2d')

      if (!ctx) return
      if (!ctx2) return
      if (!ctx3) return
      if (!ctx4) return

      ctx.clearRect(0, 0, imageLayer.current.width, imageLayer.current.height)
      ctx2.clearRect(0, 0, blurCanvas.current.width, blurCanvas.current.height)
      ctx3.clearRect(0, 0, dragLayer.current.width, dragLayer.current.height)
      ctx4.clearRect(0, 0, blurLayer.current.width, blurLayer.current.height)

      imageLayer.current.width = image.naturalWidth
      imageLayer.current.height = image.naturalHeight

      blurCanvas.current.width = image.naturalWidth
      blurCanvas.current.height = image.naturalHeight
      ctx2.filter = 'blur(25px)'

      dragLayer.current.width = image.naturalWidth
      dragLayer.current.height = image.naturalHeight

      blurLayer.current.width = image.naturalWidth
      blurLayer.current.height = image.naturalHeight
      ctx4.filter = 'blur(25px)'

      originSize.current = { width: image.naturalWidth, height: image.naturalHeight }

      const isWidthLonger = image.naturalWidth > image.naturalHeight
      const ratio = image.naturalWidth / image.naturalHeight
      const width = canvasWrapper.current!.clientWidth - CANVAS_PADDING * 2
      const height = canvasWrapper.current!.clientHeight - CANVAS_PADDING * 2
      imageLayer.current.style.width = `${isWidthLonger ? width : width * ratio}px`
      imageLayer.current.style.height = `${isWidthLonger ? height / ratio : width}px`

      blurCanvas.current.style.width = `${isWidthLonger ? width : width * ratio}px`
      blurCanvas.current.style.height = `${isWidthLonger ? height / ratio : width}px`

      blurLayer.current.style.width = `${isWidthLonger ? width : width * ratio}px`
      blurLayer.current.style.height = `${isWidthLonger ? height / ratio : width}px`

      dragLayer.current.style.width = `${isWidthLonger ? width : width * ratio}px`
      dragLayer.current.style.height = `${isWidthLonger ? height / ratio : width}px`

      ctx.drawImage(image, 0, 0)
      ctx2.drawImage(image, 0, 0)
    }
    image.src = imgSrc
  }, [imgSrc])

  return (
    <>
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Container ref={canvasWrapper}>
          {imgSrc ? (
            <>
              <Canvas ref={imageLayer} rotate={rotateAngle} />
              <Canvas ref={blurLayer} rotate={rotateAngle} />
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
            <DragDropImage
              handleDrop={(e) => {
                e.preventDefault()
                e.stopPropagation()
                if (e.dataTransfer.files === null) return
                const file = e.dataTransfer.files[0]
                const isFileImage = file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/jpg'
                if (!isFileImage) return
                originFile.current = file
                const imgUrl = URL.createObjectURL(file)
                setImgSrc(imgUrl)
              }}
              handleChange={(e) => {
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
          disabled={
            mode === MODE.NONE ||
            (mode === MODE.BLUR && blurAreas.length === 0) ||
            (mode === MODE.CROP && cropAreas.length === 0)
          }
          onClick={() => {
            if (mode === MODE.NONE) return
            if (mode === MODE.BLUR) {
              setBlurAreas((prev) => {
                const newBlurAreas = [...prev]
                newBlurAreas.pop()
                return newBlurAreas
              })
              return
            }
            if (mode === MODE.CROP) {
              setCropAreas((prev) => {
                const newCropAreas = [...prev]
                newCropAreas.pop()
                return newCropAreas
              })
              return
            }
          }}
        >
          back
        </button>
        <button
          onClick={() => {
            const canvas = imageLayer.current
            const blurCanvas = blurLayer.current
            if (!canvas) return
            if (!blurCanvas) return
            const ctx = canvas.getContext('2d')
            const ctx2 = blurCanvas.getContext('2d')
            if (!ctx) return
            if (!ctx2) return
            blurAreas.forEach((area) => {
              const { x, y, width, height } = area
              const resultCanvas = document.createElement('canvas')
              resultCanvas.width = width
              resultCanvas.height = height
              const resultCtx = resultCanvas.getContext('2d')
              if (!resultCtx) return
              resultCtx.drawImage(blurCanvas, x, y, width, height, 0, 0, width, height)
              ctx.putImageData(resultCtx.getImageData(0, 0, width, height), x, y)
            })
            cropAreas.forEach((area) => {
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
          disabled={mode !== MODE.NONE || originFile.current === null || cropAreas.length === 0}
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
`
