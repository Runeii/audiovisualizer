import { useEffect, useState } from 'react'
import './App.css'
import { setupAudioProcessing, startAudioProcessing, stopAudioProcessing } from './audio/audio'
import World from './gl/World'


function App() {
  const [hasLaunched, setHasLaunched] = useState(false)

  useEffect(() => {
    const handleClicked = async () => {
      await setupAudioProcessing();
      setHasLaunched(true);
    }
   
    window.addEventListener('click', handleClicked)
    return () => window.removeEventListener('click', handleClicked)
  }, [])

  useEffect(() => {
    if (!hasLaunched) {
      return undefined;
    }

    startAudioProcessing();

    return () => {
      stopAudioProcessing();
    }
  }, [hasLaunched]);

  return (
    <>
      <div className={`title ${hasLaunched ? 'hasLaunched' : ''}`}>
        <h1>Wipeout Music Visualizer</h1>
        <span className="subhead">{hasLaunched ?'Listening for audio' : 'Click anywhere to start'}</span>
      </div>
      {hasLaunched && <World />}
    </>
  )
}

export default App
