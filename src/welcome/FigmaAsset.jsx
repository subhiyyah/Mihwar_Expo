import { useLayoutEffect, useRef, useState } from 'react'
import dimensions from './asset-dimensions.json'

// Keep each SVG's original dimensions, and scale it into its Figma layer slot.
export default function FigmaAsset({ src, label = '' }) {
  const ref = useRef(null)
  const [scale, setScale] = useState([1, 1])
  const { width, height } = dimensions[src]
  useLayoutEffect(() => {
    const observer = new ResizeObserver(([entry]) => {
      setScale([entry.contentRect.width / width, entry.contentRect.height / height])
    })
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [width, height])
  return <span ref={ref} className="figma-asset"><img src={src} alt={label} width={width} height={height}
    style={{ transform: `scale(${scale[0]},${scale[1]})` }} /></span>
}
