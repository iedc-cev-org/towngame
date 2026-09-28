'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/amongus/supabase/client';
import { useParams, useRouter } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import { getPlayerColor } from '@/lib/colors';

export default function PrintBadges() {
  const params = useParams();
  const gameId = params.gameId as string;
  const router = useRouter();

  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGame = async () => {
      const hostToken = localStorage.getItem('sus_irl_host_token');
      const hostPin = localStorage.getItem('sus_irl_host_pin');
      if (!hostToken || hostPin?.trim().toLowerCase() !== 'iedccev2026') {
        router.push('/amongus/host');
        return;
      }

      // Fetch all players
      const { data: playersData } = await supabase
        .from('game_players')
        .select('*')
        .eq('game_id', gameId)
        .order('display_name');

      if (playersData) {
        setPlayers(playersData);
      }

      setLoading(false);
    };

    fetchGame();
  }, [gameId, router]);

  if (loading) {
    return <div className="p-8 text-center text-black bg-white">Loading badges...</div>;
  }

  const TASKS = [
    // In-built Games
    { location_id: 'task-wiring', name: 'Wiring Game', type: 'MINIGAME', pin: 'wiring', venue: 'MCA Top Terrace Stair' },
    { location_id: 'task-puzzle', name: 'Puzzle Game', type: 'MINIGAME', pin: 'puzzle', venue: 'MCA Near Room D309' },
    { location_id: 'task-admin-swipe', name: 'Admin Card Swipe', type: 'MINIGAME', pin: 'admin-swipe', venue: 'IEDC Notice Board' },
    { location_id: 'task-shields', name: 'Prime Shields', type: 'MINIGAME', pin: 'shields', venue: 'Main Block Old Repography' },
    { location_id: 'task-distributor', name: 'Calibrate Distributor', type: 'MINIGAME', pin: 'distributor', venue: 'Cafeteria' },
    { location_id: 'task-radio-freq', name: 'Radio Calibration', type: 'MINIGAME', pin: 'radio-freq', venue: 'Physics Lab' },
    { location_id: 'task-circuit-bypass', name: 'Circuit Bypass', type: 'MINIGAME', pin: 'circuit-bypass', venue: 'MCA Entrance' },
    { location_id: 'task-pressure-valves', name: 'Pressure Valves', type: 'MINIGAME', pin: 'pressure-valves', venue: 'MainBlock Fire Extinguisher' },
    { location_id: 'task-orbital-defense', name: 'Orbital Defense', type: 'MINIGAME', pin: 'orbital-defense', venue: 'MainBlock - A107' },
    { location_id: 'task-dna-anomaly', name: 'DNA Anomaly Scan', type: 'MINIGAME', pin: 'dna-anomaly', venue: 'Chemistry Lab' },
    { location_id: 'task-nav-align', name: 'Align Navigation', type: 'MINIGAME', pin: 'nav-align', venue: 'Normal Parking' },
    { location_id: 'task-fuel-transfer', name: 'Fuel Transfer', type: 'MINIGAME', pin: 'fuel-transfer', venue: 'Generator' },
    { location_id: 'task-garbage-chute', name: 'Empty Garbage Chute', type: 'MINIGAME', pin: 'garbage-chute', venue: 'Waste Bin Near Library' },
    { location_id: 'task-coolant-bypass', name: 'Coolant Thruster Bypass', type: 'MINIGAME', pin: 'coolant-bypass', venue: 'Staff Parking' },
    { location_id: 'task-basket-ball', name: 'Basketball Hoop Drop', type: 'MINIGAME', pin: 'basket-ball', venue: 'Basketball Court' },

    // Physical Games
    { location_id: 'task-qr-drawing', name: 'QR Scanning - Drawing Room', type: 'SCAN', pin: '', venue: 'MCA Drawing Room D209' },
    { location_id: 'task-bulb', name: 'Bulb Testing', type: 'PIN', pin: '2222', venue: 'MCA Electrical Room (2nd floor)' },
    { location_id: 'task-cleaning', name: 'Cleaning', type: 'PIN', pin: '3333', venue: 'MCA Near D209' },
    { location_id: 'task-find-object', name: 'Find Object', type: 'PIN', pin: '4444', venue: 'Near Physics Lab (under stair)' },
    { location_id: 'task-book-game', name: 'Book Game', type: 'PIN', pin: '5555', venue: 'Library Front' },
    { location_id: 'task-throw', name: 'Ball Throw', type: 'PIN', pin: '6666', venue: 'Near Chemistry Lab' },
    { location_id: 'task-solar', name: 'Solar Count', type: 'PIN', pin: '7777', venue: 'MCA Upper Terrace' },
    { location_id: 'task-potato', name: 'Potato Race', type: 'PIN', pin: '8888', venue: 'MCA Side Terrace' },
    { location_id: 'task-arrange-ball', name: 'Arrange Ball', type: 'PIN', pin: '9999', venue: 'Near IEDC Town' },
    { location_id: 'task-reactor', name: 'Reactor Game', type: 'MINIGAME', pin: 'reactor', venue: 'MCA 2nd Floor Toilet Near D309' },
    { location_id: 'task-die-game', name: 'Die Game', type: 'PIN', pin: '1616', venue: 'Normal Parking' },
    { location_id: 'task-football', name: 'Football Game', type: 'PIN', pin: '1717', venue: 'Basketball Court' },
    { location_id: 'task-ring-throw', name: 'Ring Throw', type: 'PIN', pin: '1818', venue: 'New Parking' },
    { location_id: 'task-single-leg', name: 'Single Leg Stand (40s)', type: 'PIN', pin: '1919', venue: 'Staff Parking' },
    { location_id: 'task-memory-game', name: 'Memory Game', type: 'PIN', pin: '2020', venue: 'Main Block Reception' },
    { location_id: 'task-stone-paper-scissors', name: 'Stone Paper Scissors', type: 'PIN', pin: '3131', venue: 'Main Block Reception' },
    { location_id: 'task-paint-fight', name: 'Paint Fight', type: 'PIN', pin: '2121', venue: 'Quilandi Bus Parking' },
    { location_id: 'task-hammer-hit', name: 'Hammer Hit', type: 'PIN', pin: '1010', venue: 'Quilandi Bus Parking' },
    { location_id: 'task-coin-toss', name: 'Coin Toss (5 Heads)', type: 'PIN', pin: '2323', venue: 'Cafeteria' },
    { location_id: 'task-ballon-race', name: 'Balloon Race', type: 'PIN', pin: '2424', venue: 'Ladies Hostel Steps' },
    { location_id: 'task-cup-rebuild', name: 'Cup Build', type: 'PIN', pin: '2525', venue: 'MCA Lecture Hall' },
    { location_id: 'task-bottle-flip', name: 'Bottle Flip', type: 'PIN', pin: '2626', venue: 'Ladies Hostel Entrance Parking' },
    { location_id: 'task-fill-bottle', name: 'Fill The Bottle', type: 'PIN', pin: '2727', venue: 'Main Block New Filter' },
    { location_id: 'task-paper-plane', name: 'Paper Plane Target', type: 'PIN', pin: '2828', venue: 'MCA Ground Floor' },
    { location_id: 'task-color-picking', name: 'Color Picking', type: 'PIN', pin: '2929', venue: 'MCA Cafeteria + Junction' },
    { location_id: 'task-pen-flight', name: 'Pen Fight', type: 'PIN', pin: '3030', venue: 'MainBlock - A107' },
    { location_id: 'task-stack-cups', name: 'Stack Cups', type: 'PIN', pin: '7878', venue: 'MCA D309' },
  ];

  return (
    <div className="bg-white min-h-screen p-8 text-black font-sans">
      <div className="mb-8 print:hidden flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Print Player Badges</h1>
          <p className="text-gray-600">Print this page and have players wear their unique QR codes.</p>
        </div>
        <button
          onClick={() => window.print()}
          className="bg-black text-white px-6 py-2 rounded-lg font-bold"
        >
          Print Now
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 print:grid-cols-3 print:gap-4 print:m-0">
        {Array.from({ length: 30 }).map((_, i) => {
          const badgeNum = (i + 1).toString().padStart(2, '0');
          const uuid = `00000000-0000-0000-0000-0000000000${badgeNum}`;
          const colorInfo = getPlayerColor(uuid);
          return (
            <div key={`badge-${i + 1}`} className="border-4 p-4 flex flex-col items-center justify-center break-inside-avoid shadow-lg print:shadow-none bg-white h-64 relative" style={{ borderColor: colorInfo.hex }}>
              <h2 className="text-xl font-black uppercase tracking-widest mb-2 truncate w-full text-center" style={{ color: colorInfo.hex }}>BADGE {i + 1}</h2>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-4" style={{ color: colorInfo.hex }}>{colorInfo.name}</p>
              <div className="bg-white p-2 border-2" style={{ borderColor: colorInfo.hex }}>
                <QRCodeSVG
                  value={uuid}
                  size={100}
                  level="M"
                  includeMargin={false}
                />
              </div>
              <div className="mt-4 text-[10px] text-gray-500 font-mono absolute bottom-2">
                ID: {badgeNum}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-16 print:mt-12 break-before-page">
        <div className="mb-8 print:hidden">
          <h2 className="text-2xl font-bold">Print Task Stations</h2>
          <p className="text-gray-600">Tape these around the venue for Crewmates to scan.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 print:grid-cols-2 print:gap-8">
          {TASKS.map((t) => {
            const hasColon = t.name.includes(':');
            const title = hasColon ? t.name.split(':')[0] : t.name;
            const subtitle = hasColon ? t.name.split(':')[1] : (t.type === 'PIN' ? 'Physical Game' : 'Mini Game');

            return (
              <div key={t.location_id} className="border-8 border-black p-6 flex flex-col items-center justify-center break-inside-avoid shadow-xl print:shadow-none bg-white min-h-[400px] relative">
                <h2 className="text-3xl font-black uppercase tracking-widest mb-1 w-full text-center">{title}</h2>
                <h3 className="text-xl font-bold text-gray-600 uppercase mb-2">{subtitle}</h3>
                <div className="mb-4 px-3 py-1 bg-gray-100 border border-gray-300 rounded-full text-xs font-bold uppercase tracking-wider text-gray-800">
                  📍 VENUE: {t.venue}
                </div>

                <div className="bg-white p-4 border-4 border-gray-200 rounded-xl mb-4">
                  <QRCodeSVG
                    value={t.location_id}
                    size={160}
                    level="H"
                    includeMargin={false}
                  />
                </div>

                {t.type === 'PIN' && (
                  <div className="flex flex-col items-center">
                    <p className="text-center text-gray-800 font-bold text-sm max-w-[200px]">
                      Ask the Referee for the PIN code upon completion.
                    </p>
                  </div>
                )}

                <div className="mt-4 text-xs text-gray-400 font-mono absolute bottom-2">
                  TYPE: {t.type} | ID: {t.location_id}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-16 print:mt-12 break-before-page">
        <div className="mb-8 print:hidden">
          <h2 className="text-2xl font-bold">Referee PIN Codes</h2>
          <p className="text-gray-600">Give this sheet to the referees so they can hand out PINs after physical games.</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 print:grid-cols-3 print:gap-4">
          {TASKS.filter(t => t.type === 'PIN').map((t) => {
            const hasColon = t.name.includes(':');
            const title = hasColon ? t.name.split(':')[0] : t.name;

            return (
              <div key={t.location_id + '-pin'} className="border-4 border-black p-4 flex flex-col items-center justify-center break-inside-avoid bg-white h-48 relative shadow-lg print:shadow-none">
                <h2 className="text-xl font-black uppercase tracking-widest mb-4 truncate w-full text-center">{title}</h2>
                <div className="bg-black text-white px-6 py-2 font-mono font-black text-3xl tracking-widest rounded">
                  {t.pin}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-16 print:mt-12 break-before-page">
        <div className="mb-8 print:hidden">
          <h2 className="text-2xl font-bold">Fake QRs (For QR Drawing Room Game)</h2>
          <p className="text-gray-600">Place these around the room to confuse Crewmates.</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 print:grid-cols-4 print:gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={`fake-${i}`} className="border-4 border-black p-4 flex flex-col items-center justify-center break-inside-avoid bg-white h-48 relative shadow-lg print:shadow-none">
              <h2 className="text-sm font-black uppercase tracking-widest mb-4 truncate w-full text-center">FAKE QR {i + 1}</h2>
              <div className="bg-white p-2 border-2 border-gray-200 rounded-lg">
                <QRCodeSVG
                  value={`fake-qr-${i + 1}`}
                  size={100}
                  level="H"
                  includeMargin={false}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
