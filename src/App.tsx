import './App.css'
import { launchAudioProcessing } from './audio'
import World from './gl/World'

function App() {
  return (
    <>
      <World />
      <button onClick={launchAudioProcessing}>Start</button>
    </>
  )
}

export default App
