import { useEffect, useState } from 'react'
import './App.css'
import { setupAudioProcessing, startAudioProcessing, stopAudioProcessing } from './audio/audio'
import World from './gl/World'
import useStore from './store'


function App() {
  const [hasLaunched, setHasLaunched] = useState(false)

  const handleClicked = async () => {
    await setupAudioProcessing();
    setHasLaunched(true);
  }

  useEffect(() => {
    if (!hasLaunched) {
      return undefined;
    }

    startAudioProcessing();

    return () => {
      stopAudioProcessing();
    }
  }, [hasLaunched]);

  const tempo = useStore(state => state.tempo)
  return (
    <>
      <World className="world" />
      {!hasLaunched && <button className="start" onClick={handleClicked}>Start</button>}
      <div className="ui">
        Current bpm: {tempo}<br />
        Target speed: {tempo}<br />
        Current speed: {tempo}
      </div>
    </>
  )
}

export default App
