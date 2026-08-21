import GameCanvas from '../components/game-canvas';

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-5xl text-center mb-6">
        <h1 className="text-4xl font-bold text-blue-400 mb-2">Water Invader</h1>
        <p className="text-slate-400">Use Left/Right Arrows or A/D to move. Spacebar to shoot.</p>
      </div>
      <GameCanvas />
    </main>
  );
}
