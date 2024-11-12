import { DeskThing as DK } from 'deskthing-server'
const DeskThing = DK.getInstance()
export { DeskThing }
import AudioStream from 'audiocapture'
import { Buffer } from 'buffer'
import express from 'express'
import { WebSocketServer } from 'ws'
import { createServer, ServerResponse, IncomingMessage } from 'http'
import * as lame from '@breezystack/lamejs'
const app = express()
const server = createServer((req: IncomingMessage, res: ServerResponse) => { app(req, res) })
const wss = new WebSocketServer({ server })
const audioStream = new AudioStream()
let bufferQueue: Buffer[] = []

const sampleRate = 48000
const numChannels = 1
const bitsPerSample = 16


wss.on('connection', (ws) => {
  audioStream.start()
  console.log('Client connected :D')
  
  function wrapPCMDataIntoWav(pcmData) {
    // Convert ArrayBuffer to Buffer if necessary
    const pcmDataBuffer = pcmData instanceof ArrayBuffer ? Buffer.from(pcmData) : pcmData;

    const header = Buffer.alloc(44); // WAV header size
    const dataChunkSize = pcmDataBuffer.length;

    // Set the header fields according to the WAV format
    header.write('RIFF', 0); // Chunk ID
    header.writeUInt32LE(36 + dataChunkSize, 4); // Chunk size (file size - 8)
    header.write('WAVE', 8); // Format
    header.write('fmt ', 12); // Subchunk1 ID
    header.writeUInt32LE(16, 16); // Subchunk1 size
    header.writeUInt16LE(1, 20); // Audio format (PCM)
    header.writeUInt16LE(1, 22); // Number of channels
    header.writeUInt32LE(44100, 24); // Sample rate
    header.writeUInt32LE(44100 * 2, 28); // Byte rate (sample rate * block align)
    header.writeUInt16LE(2, 32); // Block align
    header.writeUInt16LE(16, 34); // Bits per sample
    header.write('data', 36); // Subchunk2 ID
    header.writeUInt32LE(dataChunkSize, 40); // Subchunk2 size (data size)

    // Concatenate the header and PCM data into wavData
    const wavData = Buffer.concat([header, pcmDataBuffer]);

    return wavData;
  }

  audioStream.on('data', (chunk) => {
    console.log("CHUNK FROM AUDIO STREAM IMPORTANT: ", chunk)
    console.log("CHUNK.BUFFER FROM AUDIO STREAM IMPORT: ", chunk.buffer)
    const wavData = wrapPCMDataIntoWav(chunk)
    sendData(wavData)
  })
  const sendData = (data) => {
    ws.send(data, (err) => {
      if (err) {
        console.error(`Websocket sending data error: ${err.message}`)
      }
    })
  }
  ws.on('close', () => {
    console.log('Client disconnected D:')
  })
})

server.listen(3000, () => {
  console.log('Websocket server listening closely to your audio ;).')
})

const start = async () => {
}

const stop = async () => {
  audioStream.stop()
}

// MaudioInputn Entrypoint of the server
DeskThing.on('start', start)

// MaudioInputn exit point of the server
DeskThing.on('stop', stop)




/*
// This is triggered at the end of this file with the on('start') listener. It runs when the DeskThing starts your app. It serves as the entrypoint for your app
const start = async () => {

    // This is just one of the ways of synchronizing your data with the server. It waits for the server to have more data and saves it to the Data object here.
    let Data = await DeskThing.getData()
    DeskThing.on('data', (newData) => {
        // Syncs the data with the server
        Data = newData
        DeskThing.sendLog('New data received!' + Data)
    })

    // Template Items

    // This is how to add settings. You need to pass the "settings" object to the AddSettings() function
    if (!Data?.settings?.theme) {
        DeskThing.addSettings({
          "theme": { label: "Theme Choice", value: 'dark', options: [{ label: 'Dark Theme', value: 'dark' }, { label: 'Light Theme', value: 'light' }] },
        })

        // This will make Data.settings.theme.value equal whatever the user selects
      }

    // Getting data from the user (Ensure these match)
    if (!Data?.user_input || !Data?.second_user_input) {
        const requestScopes = {
          'user_input': {
            'value': '',
            'label': 'Placeholder User Data',
            'instructions': 'You can make the instructions whatever you want. You can also include HTML inline styling like <a href="https://deskthing.app/" target="_blank" style="color: lightblue;">Making Clickable Links</a>.',
          },
          'second_user_input': {
            'value': 'Prefilled Data',
            'label': 'Second Option',
            'instructions': 'Scopes can include as many options as needed',
          }
        }
    
        DeskThing.getUserInput(requestScopes, async (data) => {
          if (data.payload.user_input && data.payload.second_user_input) {
            // You can either save the returned data to your data object or do something with it
            DeskThing.saveData(data.payload)
          } else {
            DeskThing.sendError('Please fill out all the fields! Restart to try again')
          }
        })
      } else {
        DeskThing.sendLog('Data Exists!')
        // This will be called is the data already exists in the server
      }
} 

const stop = async () => {
    // Function called when the server is stopped
}

// Main Entrypoint of the server
DeskThing.on('start', start)

// Main exit point of the server
DeskThing.on('stop', stop)
*/