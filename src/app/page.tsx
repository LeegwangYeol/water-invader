import GameCanvas from '../components/game-canvas';

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 flex flex-col items-center justify-start sm:justify-center p-2 sm:p-4">
      <div className="w-full max-w-5xl text-center mb-1 sm:mb-6">
        <h1 className="text-2xl sm:text-4xl font-bold text-blue-400 mb-0.5 sm:mb-2">Water Invader</h1>
        <p className="text-slate-400 text-xs sm:text-base hidden sm:block">Use Left/Right Arrows or A/D to move. Spacebar to shoot.</p>
      </div>
      <GameCanvas />
    </main>
  );
}
