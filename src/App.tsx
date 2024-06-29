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
      <div className="title"><h1>Wipeout Music Visualizer</h1><br /><span class="subhead">Listening for audio</span></div>
      <World className="world" />
      {!hasLaunched && <button className="start" onClick={handleClicked}>Start</button>}
    </>
  )
}

export default App
