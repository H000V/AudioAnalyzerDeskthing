import { SettingsStore } from './settingsStore'
import { Settings } from 'deskthing-client/dist/types'
import Button from './Button'
import { useRef, useState, useEffect } from 'react'
import './index.css'

const App: React.FC = () => {
  const settingsStore = SettingsStore.getInstance()
  const [isRadial, setRadial] = useState(false)
  const [isMirroredHorizontal, setMirroredHorizontal] = useState(false)
  const [isMirroredVertical, setMirroredVertical] = useState(false)
  const [topColor, setTopColor] = useState('#8B1919')
  const [middleColor, setMiddleColor] = useState('#000000')
  const [bottomColor, setBottomColor] = useState('#035096')
  const [isVisible, setVisible] = useState(true)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const audioBufferQueue: AudioBuffer[] = []

  useEffect(() => {
    const onSettings = async (data: Settings) => {
      console.log(`Received settings from server :D, ${data.settings}`)
      if(data.settings.isRadial.value){
        setRadial(data.settings.isRadial.value as unknown as boolean)
      }
      if(data.settings.isMirroredHorizontal.value){
        setMirroredHorizontal(data.settings.isMirroredHorizontal.value as unknown as boolean)
      }
      if(data.settings.isMirroredVertical.value){
        setMirroredVertical(data.settings.isMirroredVertical.value as unknown as boolean)
      }
      if(data.settings.topColor.value){
        setTopColor(data.settings.topColor.value as string)
      }
      if(data.settings.middleColor.value){
        setMiddleColor(data.settings.middleColor.value as string)
      }
      if(data.settings.bottomColor.value){
        setBottomColor(data.settings.bottomColor.value as string)
      }
    }
    const listener = settingsStore.on(onSettings)
    const getSettings = async () => {
      const data = settingsStore.getSettings()
      if(data){
        if(data.settings.isRadial.value){
          setRadial(data.settings.isRadial.value as unknown as boolean)
        }
        if(data.settings.isMirroredHorizontal.value){
          setMirroredHorizontal(data.settings.isMirroredHorizontal.value as unknown as boolean)
        }
        if(data.settings.isMirroredVertical.value){
          setMirroredVertical(data.settings.isMirroredVertical.value as unknown as boolean)
        }
        if(data.settings.topColor.value){
          setTopColor(data.settings.topColor.value as string)
        }
        if(data.settings.middleColor.value){
          setMiddleColor(data.settings.middleColor.value as string)
        }
        if(data.settings.bottomColor.value){
          setBottomColor(data.settings.bottomColor.value as string)
        }
      }else{
        await new Promise((resolve) => setTimeout(resolve, 1000))
        const data = settingsStore.getSettings()
        if(data){
          if(data.settings.isRadial.value){
            setRadial(data.settings.isRadial.value as unknown as boolean)
          }
          if(data.settings.isMirroredHorizontal.value){
            setMirroredHorizontal(data.settings.isMirroredHorizontal.value as unknown as boolean)
          }
          if(data.settings.isMirroredVertical.value){
            setMirroredVertical(data.settings.isMirroredVertical.value as unknown as boolean)
          }
          if(data.settings.topColor.value){
            setTopColor(data.settings.topColor.value as string)
          }
          if(data.settings.middleColor.value){
            setMiddleColor(data.settings.middleColor.value as string)
          }
          if(data.settings.bottomColor.value){
            setBottomColor(data.settings.bottomColor.value as string)
          }
        }
      }
    }
    getSettings()
    return () => {
      listener()
    }
  })

  function startStreaming(audioCtx: AudioContext, analyser: AnalyserNode){
    const ws = new WebSocket('ws://localhost:3000')
    ws.onopen = () => console.log('Connected :D')
    ws.binaryType = 'arraybuffer'
    ws.onmessage = ((event) => {
      audioCtx.decodeAudioData(event.data, (buffer) => {
        audioBufferQueue.push(buffer)
        if(audioBufferQueue.length == 1){
          playNextBuffer(audioCtx, analyser)
          draw(analyser)
        }
      }, (err) => {
        console.error('Error decoding audio data:', err)
      })
    })
    ws.onerror = (error) => console.error('WebSocket error:', error)
    ws.onclose = () => console.log('WebSocket connection closed')
  }
  function playNextBuffer(audioCtx: AudioContext, analyser: AnalyserNode){
    if(audioBufferQueue.length > 0){
      const buffer = audioBufferQueue.shift()
      if(buffer){
        const source = audioCtx.createBufferSource()
        source.buffer = buffer
        source.connect(analyser)
        source.onended = () => playNextBuffer(audioCtx, analyser)
        source.start()
      }
    }
  }
  const updateInterval = 2
  let frameCount = 0
  function draw(analyser: AnalyserNode){
    if (frameCount % updateInterval === 0) {
      frameCount = 0
      const barHeights = new Uint8Array(analyser.frequencyBinCount)
      const bufferLength = analyser.frequencyBinCount
      analyser.getByteFrequencyData(barHeights)
      const totalAmplitude = barHeights.reduce((sum, height) => sum + height, 0)
      const averageAmplitude = totalAmplitude / bufferLength
      const canvas = canvasRef.current!
      const ctx = canvas?.getContext('2d')
      const barWidth = (canvas.width / bufferLength) * 2.5
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const radius = Math.min(canvas.width, canvas.height) * 0.4
      const innerRadius = radius * 0.7
      const outerRadius = radius
      const getAngle = (i) => {
        return (i / bufferLength) * 2 * Math.PI;
      }
      const radialXY = (angle, radius): [number, number] => {
        return [centerX + radius * Math.cos(angle), centerY + radius * Math.sin(angle)]
      }
      if(ctx){
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if(isRadial == true){
          for (let i = 0; i < bufferLength; i++) {
            const barLength = innerRadius + (outerRadius - innerRadius) * (barHeights[i] / 255);
            const angle = getAngle(i)
            const nextAngle = getAngle(i + 1)
            const gradient = ctx.createLinearGradient(centerX + Math.cos(angle) * innerRadius, centerY + Math.sin(angle) * innerRadius, centerX + Math.cos(angle) * outerRadius, centerY + Math.sin(angle) * outerRadius)
            gradient.addColorStop(0, topColor)
            gradient.addColorStop(0.1, middleColor)
            gradient.addColorStop(0.15, bottomColor)
            ctx.fillStyle = gradient
            ctx.beginPath()
            ctx.moveTo(...radialXY(angle, innerRadius))
            ctx.lineTo(...radialXY(angle, barLength))
            ctx.lineTo(...radialXY(nextAngle, barLength))
            ctx.lineTo(...radialXY(nextAngle, innerRadius))
            ctx.closePath()
            ctx.fill()
          }
        }else if(isRadial == false){
          for(let i = 0; i < bufferLength; i++){
            barHeights[i] = Math.abs(barHeights[i] - averageAmplitude)
            const gradient = ctx.createLinearGradient(0, centerY - barHeights[i] / 2, 0, centerY + barHeights[i] / 2)
            gradient.addColorStop(0, topColor)
            gradient.addColorStop(0.50, middleColor)
            gradient.addColorStop(1, bottomColor)
            ctx.fillStyle = gradient
            const x = (barWidth + 1) * i
            ctx.fillRect(isMirroredHorizontal ? centerX + x : canvas.width + x, isMirroredVertical ? centerY - barHeights[i] / 2 : canvas.height - barHeights[i] / 2, barWidth, barHeights[i])
            ctx.fillRect(isMirroredHorizontal ? centerX - x : canvas.width - x, isMirroredVertical ? centerY - barHeights[i] / 2 : canvas.height - barHeights[i] / 2, barWidth, barHeights[i])
          }
        }
      }
    }
    frameCount++;
    if (audioBufferQueue.length > 0 || frameCount % updateInterval === 0) {
        requestAnimationFrame(() => draw(analyser));
    }
  }
  
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current
      if (canvas) {
        canvas.width = window.innerWidth
        canvas.height = window.innerHeight
      }
    }

    // Set initial size
    handleResize()

    // Update size on window resize
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return(
    <div>
    {isVisible ? (
      <Button startStreaming={startStreaming} isVisible={isVisible} setVisible={setVisible}></Button>
    ) : (
      <canvas className='relative w-screen h-screen' ref={canvasRef}></canvas>
    )}
    </div>
  )
}
export default App