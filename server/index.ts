import { DeskThing as DK } from 'deskthing-server'
const DeskThing = DK.getInstance()
export { DeskThing } // Required export of this exact name for the server to connect
import { Buffer } from 'buffer'
import portAudio from 'naudiodon'
import portAudioCheck from '../node_modules/naudiodon/index.js'
import express from 'express'
import { WebSocketServer } from 'ws'
import { createServer, ServerResponse, IncomingMessage } from 'http'
import * as lame from '@breezystack/lamejs'
import { exec as execCallback } from 'child_process'
import { promisify } from 'util'
import Speaker from 'speaker'
const exec = promisify(execCallback);
const app = express();
const server = createServer((req: IncomingMessage, res: ServerResponse) => { app(req, res) })
const wss = new WebSocketServer({ server });
const deviceData = portAudioCheck.getDevices()
let deviceIdIn, deviceSampleRateIn  
for(let i = 0; i<deviceData.length; i++){
  if(deviceData[i].name == 'CABLE Output (VB-Audio Virtual Cable)'){
    deviceIdIn = deviceData[i].id
  }
}
const ai = portAudio.AudioIO({
  inOptions: {
    channelCount: 2,
    maxQueue: 1000,
    sampleFormat: portAudio.SampleFormat16Bit,
    sampleRate: 48000,
    deviceId: deviceIdIn,
  }
})
const ao = portAudio.AudioIO({
  outOptions:{
    channelCount: 2,
    maxQueue: 1,
    sampleFormat: portAudio.SampleFormat16Bit,
    sampleRate: 48000,
    deviceId: -1,
  }
})
const desiredName = "CABLE Input (VB-Audio Virtual Cable)";
let resetDeviceName, deviceIndex
async function initializeAudioDevices() {
  try {
      // Get the current default playback device name
      const { stdout: defaultDeviceName } = await exec(`powershell.exe -Command "(Get-AudioDevice -List | Where-Object { $_.Default -eq 'True' -and $_.Type -eq 'Playback' }).Name | Out-String"`);
      console.log("Current default playback device:", defaultDeviceName);
      resetDeviceName = defaultDeviceName.trim();

      // Get the index of the desired device
      const { stdout: deviceIndexOutput } = await exec(`powershell.exe -Command "(Get-AudioDevice -List | Where-Object { $_.Name -eq '${desiredName}' }).Index"`);
      deviceIndex = deviceIndexOutput

      if (isNaN(deviceIndex)) {
          throw new Error("Failed to retrieve a valid device index.");
      }

      // Set the desired audio device as the default
      await exec(`powershell.exe -Command "Import-Module AudioDeviceCmdlets; Set-AudioDevice -Index ${deviceIndex}"`);
      console.log("Audio device set to desired device:", desiredName);

  } catch (error) {
      console.error("Error during audio device initialization:", error.message);
  }
}
await initializeAudioDevices()
wss.on('connection', (ws) => {
  ai.start()
  ao.start()
  console.log('Client connected')
  const mp3Encoder = new lame.Mp3Encoder(1, deviceSampleRateIn, 128)
  ai.on('data', (chunk) => {
    ao.write(chunk)
    const chunks: Buffer[] = []
    chunks.push(Buffer.from(chunk))
    const buffer = Buffer.concat(chunks)
    const int16Array = new Int16Array(buffer.buffer, buffer.byteOffset, buffer.byteLength / Int16Array.BYTES_PER_ELEMENT)
    const mp3Data = mp3Encoder.encodeBuffer(int16Array)
    mp3Encoder.flush()
    sendData(mp3Data)
    })
    const sendData = (data) => {
      if(data.length){
        ws.send(data, (err) => {
          if (err) {
            console.error('Send error:', err)
          } else {
          }
        })
      }else{
        console.log('empty mp3 data')
      }
    }
    ws.on('close', () => {
      console.log('Client disconnected')
    })
})

server.listen(3000, () => {
    console.log('Server listening on port 3000')
})

const start = async () => {
  ai.start()
}

const stop = async () => {
  try{
    const { stdout: deviceIndexOutput } = await exec(`powershell.exe -Command "(Get-AudioDevice -List | Where-Object { $_.Name -eq '${resetDeviceName}' }).Index"`)
    const resetDeviceIndex = deviceIndexOutput
    await exec(`powershell.exe -Command "Import-Module AudioDeviceCmdlets; Set-AudioDevice -Index ${resetDeviceIndex}"`)
  }catch(error) {
    console.error("Error during audio device initialization:", error.message);
  }
  ai.quit()
}

// Main Entrypoint of the server
DeskThing.on('start', start)

// Main exit point of the server
DeskThing.on('stop', stop)