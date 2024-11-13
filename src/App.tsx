import { DeskThing } from 'deskthing-client'
import Button from './Button'
import { useRef, useState } from 'react'
import './index.css'
import { buffer } from 'stream/consumers'
// const deskthing = DeskThing.getInstance()

const App: React.FC = () => {
  const [isVisible, setVisible] = useState(true)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const audioBufferQueue: AudioBuffer[] = []
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
    if(frameCount % updateInterval == 0){
      frameCount = 0
      const barHeights = new Uint8Array(analyser.frequencyBinCount)
      const bufferLength = analyser.frequencyBinCount
      analyser.getByteFrequencyData(barHeights)
      const totalAmplitude = barHeights.reduce((sum, height) => sum + height, 0)
      const averageAmplitude = totalAmplitude / bufferLength
      const canvas = canvasRef.current!
      const ctx = canvas?.getContext('2d')
      if(ctx){
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        const barWidth = (canvas.width / bufferLength) * 2.5
        const centerX = canvas.width / 2
        const centerY = canvas.height / 2

        for(let i = 0; i < bufferLength; i++){
          barHeights[i] = Math.abs(barHeights[i] - averageAmplitude)
          const gradient = ctx.createLinearGradient(0, centerY - barHeights[i] / 2, 0, centerY + barHeights[i] / 2)
          gradient.addColorStop(0, 'rgba(139, 25, 25, 1)')
          gradient.addColorStop(0.50, 'rgba(0, 0, 0, 1)')
          gradient.addColorStop(1, 'rgba(3, 80, 150, 1)')
          ctx.fillStyle = gradient
          const x = (barWidth + 1) * i
          ctx.fillRect(centerX + x, centerY - barHeights[i] / 2, barWidth, barHeights[i])
          ctx.fillRect(centerX - x, centerY - barHeights[i] / 2, barWidth, barHeights[i])
        }
      }
    }
    frameCount++
    if(audioBufferQueue.length > 0 || frameCount % updateInterval == 0){
      requestAnimationFrame(() => draw(analyser))
    }
  }
  /*function draw(analyser: AnalyserNode) {
    if (frameCount % updateInterval === 0) {
      barHeights = new Array(analyser.frequencyBinCount).fill(0);
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyser.getByteFrequencyData(dataArray);
      const canvas = canvasRef.current!;
      const ctx = canvas?.getContext('2d');

      const width = canvas.offsetWidth;
      const height = canvas.offsetHeight;

      canvas.width = width * 4;
      canvas.height = height * 4;

      if(ctx){
        ctx.resetTransform();
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = Math.min(centerX, centerY) * 0.5; // Radius for the visualizer
        const barCount = bufferLength; // Number of bars
        const barAngle = (2 * Math.PI) / barCount; // Angle for each bar

        for (let i = 0; i < barCount; i++) {
          // Height adjustment logic
          if (dataArray[i] > barHeights[i] || 0) {
              barHeights[i] = dataArray[i];
          } else {
              barHeights[i] -= fallSmoothingFactor * ((barHeights[i] || 0) - dataArray[i]);
              barHeights[i] = Math.max(0, barHeights[i]);
          }

          const barHeight = barHeights[i];
          const barLength = radius * (barHeight / 255); // Scale bar length based on audio data

          // Calculate the end position of the bar
          const angle = i * barAngle;
          const startX = centerX + Math.cos(angle) * radius;
          const startY = centerY + Math.sin(angle) * radius;
          const endX = centerX + Math.cos(angle) * (radius + barLength);
          const endY = centerY + Math.sin(angle) * (radius + barLength);

          // Create gradient
          const gradient = ctx.createLinearGradient(startX, startY, endX, endY);
          gradient.addColorStop(0, 'rgba(139, 25, 25, 1)');
          gradient.addColorStop(0.5, 'rgba(0, 0, 0, 1)');
          gradient.addColorStop(1, 'rgba(3, 80, 150, 1)');

          const startRadius = radius; // Starting radius for the arc
          const endRadius = radius + barHeight;
          const maxSegments = 10;
          const minWidth = 2;
          const maxWidth = 10;
          ctx.strokeStyle = gradient;
          for (let j = 0; j < maxSegments; j++) {
            // Calculate incremental radius and line width for the segment
            const segmentRadius = startRadius + (j / maxSegments) * barHeight;
            const lineWidth = minWidth + ((maxWidth - minWidth) * (j / maxSegments));

            ctx.lineWidth = 5;

            ctx.beginPath();
            ctx.arc(startX, startY, segmentRadius, angle - 0.02, angle + 0.02); // Small arc for each segment
            ctx.stroke();

            if (segmentRadius >= endRadius) {
              break;
          }
        }
        }
      }
    }
    frameCount++;
    if (audioBufferQueue.length > 0 || frameCount % updateInterval === 0) {
        requestAnimationFrame(() => draw(analyser));
    }
  }*/
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