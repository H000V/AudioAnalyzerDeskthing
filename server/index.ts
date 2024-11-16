import { DeskThing as DK } from "deskthing-server"
const DeskThing = DK.getInstance()
export { DeskThing }
import AudioStream from "wasapi-audio-capture"
import { Buffer } from "buffer"
import express from "express"
import { WebSocketServer } from "ws"
import { createServer, ServerResponse, IncomingMessage } from "http"
import * as lame from "@breezystack/lamejs"
const app = express()
const server = createServer((req: IncomingMessage, res: ServerResponse) => { app(req, res) })
const wss = new WebSocketServer({ server })
const audioStream = new AudioStream()
let bufferQueue: Buffer[] = []

const start = async () => {

  // This is just one of the ways of synchronizing your data with the server. It waits for the server to have more data and saves it to the Data object here.
  let Data = await DeskThing.getData()
  DeskThing.on("data", (newData) => {
      // Syncs the data with the server
      Data = newData
      DeskThing.sendLog("New data received!" + Data)
  })
  
  // This is how to add settings. You need to pass the "settings" object to the AddSettings() function
  if (!Data?.settings?.isRadial || !Data?.settings?.isMirrored || !Data?.settings?.fftSize || !Data?.settings?.smoothingTimeConstant || !Data?.settings?.topColor || !Data?.settings?.middleColor || !Data?.settings?.bottomColor ) {
    DeskThing.addSettings({
      isRadial: { 
        label: "Circle graph or naw?", 
        value: false,
        type: "boolean",
      },
      isMirrored: {
        label: "Mirror the graph or naw?",
        value: false, 
        type: "boolean",
      },
      fftSize: { 
        label: "How many rectangles for analysis?", 
        value: 256,
        description: "This defines the buffer size that is used to perform the analysis. It MUST be a power of two. Range 32-8192. CAUTION: Values higher than 1024 may heat up your carthing.", 
        type: "number", 
        min: 32, 
        max: 8192,
      },
      smoothingTimeConstant: { 
        label: "Prefered update frequency?", 
        value: 0.6, 
        description: "This value determines how often your graph updates. a value of zero causes quickly fluctuating changes, a value of one causes zero changes.", 
        type: "number", 
        min: 0, 
        max: 1,
      },
      topColor: {
        label: "Color of the top of the graph.",
        value: "#8B1919",
        description: "This is defines the hex code value of the color for the top of the graph.",
        type: "string",
      },
      middleColor: {
        label: "Color of the middle of the graph.",
        value: "#000000",
        description: "This defines the hex code value of the color for the middle of the graph.",
        type: "string",
      },
      bottomColor: {
        label: "Color of the bottom of the graph.",
        value: "#035096",
        description: "This defines the hex code value of the color for the bottom of the graph.",
        type: "string",
      },
    })
    // This will make Data.settings.theme.value equal whatever the user selects
  }

  wss.on("connection", (ws) => {
    audioStream.start()
    console.log("Client connected :D")
  
    const mp3Encoder = new lame.Mp3Encoder(1, 48000, 128)
    audioStream.on("data", (chunk) => {
      bufferQueue.push(Buffer.from(chunk));
      while (bufferQueue.length > 0) {
        const buffer = bufferQueue.shift();
        if(buffer){
        const int16Array = new Int16Array(buffer.buffer, buffer.byteOffset, buffer.length / Int16Array.BYTES_PER_ELEMENT);
  
        if (int16Array.length > 0) {
            const mp3Data = mp3Encoder.encodeBuffer(int16Array);
            if (mp3Data.length > 500) {
                sendData(mp3Data);
            }
        }
      }
    }
    })
    const sendData = (data) => {
      ws.send(data, (err) => {
        if (err) {
          console.error(`Websocket sending data error: ${err.message}`)
        }
      })
    }
    ws.on("close", () => {
      console.log("Client disconnected D:")
      mp3Encoder.flush()
    })
  })
  
  server.listen(3000, () => {
    console.log("Websocket server listening closely to your audio ;).")
  })

  const stop = async () => {
    audioStream.stop()
  }
  DeskThing.on("stop", stop)

}
// Main Entrypoint of the server
DeskThing.on("start", start)