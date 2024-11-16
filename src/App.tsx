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
  const [topColor, setTopColor] = useState('')
  const [middleColor, setMiddleColor] = useState('')
  const [bottomColor, setBottomColor] = useState('')
  const [isVisible, setVisible] = useState(true)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const audioBufferQueue: AudioBuffer[] = []

  useEffect(() => {
    const onSettings = async (data: Settings) => {
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
        console.log("Encoded mp3 data after websocket being sent to bufferqueue: ", buffer)
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
      const radius = Math.min(centerX, centerY) * 0.5; // Radius for the visualizer
      const barAngle = (2 * Math.PI) / bufferLength; // Angle for each bar
      const maxSegments = 10;
      const minWidth = 2;
      const maxWidth = 10;
      
      if(ctx){
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if(isRadial == true){
          for (let i = 0; i < bufferLength; i++) {
            barHeights[i] = Math.abs(barHeights[i] - averageAmplitude)
            const barLength = radius * (barHeights[i] / 255); // Scale bar length based on audio data
            const angle = i * barAngle;
            const startX = centerX + Math.cos(angle) * radius;
            const startY = centerY + Math.sin(angle) * radius;
            const endX = centerX + Math.cos(angle) * (radius + barLength);
            const endY = centerY + Math.sin(angle) * (radius + barLength);
            const startRadius = radius;
            const endRadius = radius + barHeights[i];
            
            // Create gradient
            const gradient = ctx.createLinearGradient(startX, startY, endX, endY);
            gradient.addColorStop(0, topColor);
            gradient.addColorStop(0.5, middleColor);
            gradient.addColorStop(1, bottomColor);
            ctx.strokeStyle = gradient;
            for (let j = 0; j < maxSegments; j++) {
              // Calculate incremental radius and line width for the segment
              const segmentRadius = startRadius + (j / maxSegments) * barHeights[i];
              ctx.lineWidth = minWidth + ((maxWidth - minWidth) * (j / maxSegments));
              ctx.beginPath();
              ctx.arc(startX, startY, segmentRadius, angle - 0.02, angle + 0.02); // Small arc for each segment
              ctx.stroke();
              if (segmentRadius >= endRadius) {
                break;
              }
            }
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
  if(isVisible){
    return (
      <div>
        <Button startStreaming={startStreaming} isVisible={isVisible} setVisible={setVisible}></Button>
      </div>
    )
  }else if(!isVisible){
    return(
      <div>
        <canvas className='relative w-screen h-screen' ref={canvasRef}></canvas>     
      </div>
    )
  }else{
    return(
      <div>SOMETHING REALLY BROKE</div>
    )
  }
}
export default App