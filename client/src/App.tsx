import { RaceChart } from './components/RaceChart';

function App() {
  return (
    <div className="min-h-screen bg-black text-white p-10">
      <h1 className="text-4xl font-bold mb-8 text-red-600">F1 Data Vis</h1>
      <RaceChart />
    </div>
  )
}

export default App