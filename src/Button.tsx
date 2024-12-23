import { SettingsStore } from './settingsStore'
import { Settings } from 'deskthing-client/dist/types'
import { useState, useEffect } from 'react'
import './index.css'

interface ButtonProps {
    startStreaming: (audioCtx, analyser) => void
    isVisible: boolean
    setVisible: (value: boolean) => void
}
let audioCtx: AudioContext
let analyser: AnalyserNode
const Button = ({ startStreaming, setVisible }: ButtonProps) => {
    const settingsStore = SettingsStore.getInstance()
    const [fftSize, setFftSize] = useState(0)
    const [smoothingTimeConstant, setSmoothingTimeConstant] = useState(0)

    useEffect(() => {
        const onSettings = async (data: Settings) => {
            if(data.settings.fftSize.value){
                setFftSize(data.settings.fftSize.value as number)
            }
            if(data.settings.smoothingTimeConstant.value){
                setSmoothingTimeConstant(data.settings.smoothingTimeConstant.value as number)
            }
        }
        const listener = settingsStore.on(onSettings)
        const getSettings = async () => {
            const data = settingsStore.getSettings()
            if(data){
                if(data.settings.fftSize.value){
                    setFftSize(data.settings.fftSize.value as number)
                }
                if(data.settings.smoothingTimeConstant.value){
                    setSmoothingTimeConstant(data.settings.smoothingTimeConstant.value as number)
                }
            }else{
                await new Promise((resolve) => setTimeout(resolve, 1000))
                const data = settingsStore.getSettings()
                if(data){
                    if(data.settings.fftSize.value){
                        setFftSize(data.settings.fftSize.value as number)
                    }
                    if(data.settings.smoothingTimeConstant.value){
                        setSmoothingTimeConstant(data.settings.smoothingTimeConstant.value as number)
                    }
                }
            }
        }
        getSettings()
        return () => {
            listener()
        }
    })

    const createAudioNode = () => {
        setVisible(false)
        audioCtx = new AudioContext()
        analyser = audioCtx.createAnalyser()
        analyser.fftSize = fftSize
        analyser.smoothingTimeConstant = smoothingTimeConstant
        startStreaming(audioCtx, analyser)
    }
    return (
        <div className='flex items-center justify-center h-screen'>
            <button onClick={createAudioNode} className='relative transform scale-500'>
                <div className='absolute inset-0 rounded-full animate-spin-slow flex items-center justify-center'>
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className='absolute w-5 h-1 bg-white rounded-md' style={{ transform: `rotate(${i*45}deg) translate(0, 50px)` }}></div>
                    ))}
                    {[...Array(8)].map((_, u) => (
                        <div key={u} className='absolute w-3.75 h-1 bg-white rounded-sm' style={{ transform: `rotate(${(u*45)+22.5}deg) translate(0, 41.5px)` }}></div>
                    ))}
                    {[...Array(8)].map((_, j) => (
                        <div key={j} className='absolute w-3.25 h-1 bg-white rounded-md' style={{ transform: `rotate(${(j*45)-32.5}deg) translate(42.25px, -19px)` }}></div>
                    ))}
                    {[...Array(8)].map((_, k) => (
                        <div key={k} className='absolute w-3.25 h-1 bg-white rounded-md' style={{ transform: `rotate(${(k*45)+32.5}deg) translate(42.25px, 19px)` }}></div>
                    ))}
                </div>
                <svg viewBox='-2 0 24 24' width='64' height='64'>
                    <polygon points='5,3 5,21 19,12' fill='black' stroke='#24c15e' strokeWidth='0.5'/>
                </svg>
            </button>
        </div>
    )
}
export { audioCtx, analyser }
export default Button