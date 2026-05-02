import { RaceDashboard } from './components/RaceDashboard';

function App() {
  return (
    <div className="h-screen bg-[#111320] text-neutral-100 font-sans flex flex-col overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-red-800 via-red-500 to-red-800 shrink-0" />
      <RaceDashboard />
    </div>
  )
}

export default App