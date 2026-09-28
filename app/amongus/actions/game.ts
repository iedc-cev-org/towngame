'use server';

import { supabaseAdmin } from '@/lib/amongus/supabase/server';

export async function startGame(gameId: string, hostToken: string) {
  try {
    if (!gameId || !hostToken) return { error: 'Missing parameters' };

    // 1. Verify Host and Game state
    const { data: game, error: gameError } = await supabaseAdmin
      .from('games')
      .select('*')
      .eq('id', gameId)
      .eq('host_id', hostToken)
      .single();

    if (gameError || !game) return { error: 'Unauthorized or game not found' };
    if (game.status !== 'LOBBY') return { error: 'Game is not in LOBBY state' };

    // 2. Fetch all players
    const { data: players, error: playersError } = await supabaseAdmin
      .from('game_players')
      .select('id')
      .eq('game_id', gameId);

    if (playersError || !players || players.length === 0) {
      return { error: 'No players in game' };
    }

    const numImpostors = game.impostor_count;
    if (players.length < numImpostors + 1) {
      return { error: `Need at least ${numImpostors + 1} players to start` };
    }

    // 3. Shuffle players (Fisher-Yates)
    const shuffled = [...players];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    // 3.5 Cleanup old game data in case this is a restart
    await supabaseAdmin.from('player_roles').delete().eq('game_id', gameId);
    await supabaseAdmin.from('player_tasks').delete().eq('game_id', gameId);
    await supabaseAdmin.from('game_events').delete().eq('game_id', gameId);
    await supabaseAdmin.from('votes').delete().eq('game_id', gameId);
    await supabaseAdmin.from('kills').delete().eq('game_id', gameId);
    await supabaseAdmin.from('game_players').update({ status: 'ALIVE' }).eq('game_id', gameId);

    // 4. Assign Roles
    const rolesToInsert = shuffled.map((p, index) => ({
      game_id: gameId,
      player_id: p.id,
      role: index < numImpostors ? 'IMPOSTOR' : 'CREWMATE'
    }));

    const { error: rolesError } = await supabaseAdmin
      .from('player_roles')
      .insert(rolesToInsert);

    if (rolesError) {
      return { error: 'Failed to assign roles: ' + rolesError.message };
    }

    // 5. Generate Tasks
    const AVAILABLE_TASKS = [
      // In-built Games
      { location_id: 'task-wiring', name: 'Wiring Game', type: 'MINIGAME', pin: 'wiring' },
      { location_id: 'task-puzzle', name: 'Puzzle Game', type: 'MINIGAME', pin: 'puzzle' },
      { location_id: 'task-admin-swipe', name: 'Admin Card Swipe', type: 'MINIGAME', pin: 'admin-swipe' },
      { location_id: 'task-shields', name: 'Prime Shields', type: 'MINIGAME', pin: 'shields' },
      { location_id: 'task-distributor', name: 'Calibrate Distributor', type: 'MINIGAME', pin: 'distributor' },
      { location_id: 'task-radio-freq', name: 'Radio Calibration', type: 'MINIGAME', pin: 'radio-freq' },
      { location_id: 'task-circuit-bypass', name: 'Circuit Bypass', type: 'MINIGAME', pin: 'circuit-bypass' },
      { location_id: 'task-pressure-valves', name: 'Pressure Valves', type: 'MINIGAME', pin: 'pressure-valves' },
      { location_id: 'task-orbital-defense', name: 'Orbital Defense', type: 'MINIGAME', pin: 'orbital-defense' },
      { location_id: 'task-dna-anomaly', name: 'DNA Anomaly Scan', type: 'MINIGAME', pin: 'dna-anomaly' },
      { location_id: 'task-nav-align', name: 'Align Navigation', type: 'MINIGAME', pin: 'nav-align' },
      { location_id: 'task-fuel-transfer', name: 'Fuel Transfer', type: 'MINIGAME', pin: 'fuel-transfer' },
      { location_id: 'task-garbage-chute', name: 'Empty Garbage Chute', type: 'MINIGAME', pin: 'garbage-chute' },
      { location_id: 'task-coolant-bypass', name: 'Coolant Thruster Bypass', type: 'MINIGAME', pin: 'coolant-bypass' },
      { location_id: 'task-basket-ball', name: 'Basketball Hoop Drop', type: 'MINIGAME', pin: 'basket-ball' },
      
      // Physical Games
      { location_id: 'task-qr-drawing', name: 'QR Scanning - Drawing Room', type: 'SCAN', pin: '' },
      { location_id: 'task-bulb', name: 'Bulb Testing', type: 'PIN', pin: '2222' },
      { location_id: 'task-cleaning', name: 'Cleaning', type: 'PIN', pin: '3333' },
      { location_id: 'task-find-object', name: 'Find object', type: 'PIN', pin: '4444' },
      { location_id: 'task-book-game', name: 'Book game', type: 'PIN', pin: '5555' },
      { location_id: 'task-throw', name: 'Throw', type: 'PIN', pin: '6666' },
      { location_id: 'task-solar', name: 'Solar counter', type: 'PIN', pin: '7777' },
      { location_id: 'task-potato', name: 'Potato race', type: 'PIN', pin: '8888' },
      { location_id: 'task-arrange-ball', name: 'Arrange ball', type: 'PIN', pin: '9999' },
      { location_id: 'task-reactor', name: 'Reactor game', type: 'MINIGAME', pin: 'reactor' },
      { location_id: 'task-die-game', name: 'Die game', type: 'PIN', pin: '1616' },
      { location_id: 'task-football', name: 'Football game', type: 'PIN', pin: '1717' },
      { location_id: 'task-ring-throw', name: 'Ring throw', type: 'PIN', pin: '1818' },
      { location_id: 'task-single-leg', name: 'Single leg stand', type: 'PIN', pin: '1919' },
      { location_id: 'task-memory-game', name: 'Memory game', type: 'PIN', pin: '2020' },
      { location_id: 'task-stone-paper-scissors', name: 'Stone paper scissors', type: 'PIN', pin: '3131' },
      { location_id: 'task-paint-fight', name: 'Paint fight', type: 'PIN', pin: '2121' },
      { location_id: 'task-hammer-hit', name: 'Hammer hit', type: 'PIN', pin: '1010' },
      { location_id: 'task-coin-toss', name: 'Coin toss', type: 'PIN', pin: '2323' },
      { location_id: 'task-ballon-race', name: 'Ballon race', type: 'PIN', pin: '2424' },
      { location_id: 'task-cup-rebuild', name: 'Cup rebuild', type: 'PIN', pin: '2525' },
      { location_id: 'task-bottle-flip', name: 'Bottle flip', type: 'PIN', pin: '2626' },
      { location_id: 'task-fill-bottle', name: 'Fill the bottle', type: 'PIN', pin: '2727' },
      { location_id: 'task-paper-plane', name: 'Paper plane target', type: 'PIN', pin: '2828' },
      { location_id: 'task-color-picking', name: 'Color picking', type: 'PIN', pin: '2929' },
      { location_id: 'task-pen-flight', name: 'Pen fight', type: 'PIN', pin: '3030' },
      { location_id: 'task-stack-cups', name: 'Stack cups', type: 'PIN', pin: '7878' },
      { location_id: 'task-light-finger', name: 'Light Finger', type: 'PIN', pin: '3232' },
      { location_id: 'task-fruit-duel', name: 'Fruit Duel', type: 'PIN', pin: '3434' },
    ];

    const TASKS_PER_PLAYER = 7;
    const tasksToInsert: any[] = [];
    
    // Total crewmate tasks for global progress
    const crewmateCount = players.length - numImpostors;
    const totalTasks = crewmateCount * TASKS_PER_PLAYER;

    for (const p of shuffled) {
      // Shuffle available tasks for this player
      const playerTasks = [...AVAILABLE_TASKS].sort(() => Math.random() - 0.5).slice(0, TASKS_PER_PLAYER);
      
      for (const t of playerTasks) {
        tasksToInsert.push({
          game_id: gameId,
          player_id: p.id,
          task_location_id: t.location_id,
          task_name: t.name,
          task_type: t.type,
          pin_code: t.pin
        });
      }
    }

    const { error: tasksError } = await supabaseAdmin
      .from('player_tasks')
      .insert(tasksToInsert);

    if (tasksError) {
      return { error: 'Failed to assign tasks: ' + tasksError.message };
    }

    // 6. Transaction equivalent (Update game state)
    const { error: updateError } = await supabaseAdmin
      .from('games')
      .update({ 
        status: 'ACTIVE',
        started_at: new Date().toISOString(),
        tasks_completed: 0,
        total_tasks: totalTasks,
        game_elapsed_ms: 0,
        last_resume_time: new Date().toISOString(),
        game_duration_ms: 60 * 60 * 1000,
        meeting_type: null
      })
      .eq('id', gameId);

    if (updateError) {
      return { error: 'Failed to update game status: ' + updateError.message };
    }

    await logEvent(gameId, '🚀 Game started!', 'SYSTEM');

    return { success: true };
  } catch (err: any) {
    return { error: err.message || 'Unknown server error' };
  }
}

export async function getMyRole(gameId: string, playerToken: string) {
  try {
    if (!gameId || !playerToken) return { error: 'Missing parameters' };

    // 1. Authenticate player
    const { data: player, error: playerError } = await supabaseAdmin
      .from('game_players')
      .select('id, display_name')
      .eq('game_id', gameId)
      .eq('player_token', playerToken)
      .single();

    if (playerError || !player) return { error: 'Player not found' };

    // 2. Fetch secret role
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('player_roles')
      .select('role')
      .eq('game_id', gameId)
      .eq('player_id', player.id)
      .single();

    if (roleError || !roleData) return { error: 'Role not assigned yet' };

    let teammates: string[] = [];
    if (roleData.role === 'IMPOSTOR') {
      const { data: otherImpostors } = await supabaseAdmin
        .from('player_roles')
        .select('player_id')
        .eq('game_id', gameId)
        .eq('role', 'IMPOSTOR')
        .neq('player_id', player.id);
        
      if (otherImpostors) {
        teammates = otherImpostors.map(oi => oi.player_id);
      }
    }

    return {
      success: true,
      name: player.display_name,
      role: roleData.role,
      teammates
    };
  } catch (err: any) {
    return { error: err.message || 'Unknown server error' };
  }
}

export async function eliminatePlayer(gameId: string, impostorToken: string, targetPlayerId: string) {
  try {
    if (!gameId || !impostorToken || !targetPlayerId) return { error: 'Missing parameters' };

    // 1. Authenticate Impostor
    const { data: killer, error: killerError } = await supabaseAdmin
      .from('game_players')
      .select('id, status, display_name')
      .eq('game_id', gameId)
      .eq('player_token', impostorToken)
      .single();

    if (killerError || !killer) return { error: 'Unauthorized killer' };
    if (killer.status !== 'ALIVE') return { error: 'You are dead! Ghosts cannot kill.' };

    const { data: game } = await supabaseAdmin.from('games').select('status').eq('id', gameId).single();
    if (!game || game.status !== 'ACTIVE') return { error: 'You can only kill during an active game.' };

    // 2. Verify Killer is an IMPOSTOR
    const { data: killerRole } = await supabaseAdmin
      .from('player_roles')
      .select('role')
      .eq('game_id', gameId)
      .eq('player_id', killer.id)
      .single();

    if (!killerRole || killerRole.role !== 'IMPOSTOR') {
      return { error: 'Only Impostors can eliminate players' };
    }

    // 3. Verify Target exists and is ALIVE
    const { data: victim, error: victimError } = await supabaseAdmin
      .from('game_players')
      .select('id, status, display_name')
      .eq('game_id', gameId)
      .or(`id.eq.${targetPlayerId},player_token.eq.${targetPlayerId}`)
      .single();

    if (victimError || !victim) return { error: 'Invalid target QR code' };
    if (victim.status !== 'ALIVE') return { error: 'Target is already dead!' };

    // Prevent Impostor from killing another Impostor
    const { data: victimRole } = await supabaseAdmin
      .from('player_roles')
      .select('role')
      .eq('player_id', victim.id)
      .single();
      
    if (victimRole?.role === 'IMPOSTOR') {
      return { error: 'You cannot kill a fellow Impostor!' };
    }

    // 3.5 Check Cooldown
    const { data: lastKill } = await supabaseAdmin
      .from('kills')
      .select('created_at')
      .eq('game_id', gameId)
      .eq('killer_id', killer.id)
      .order('created_at', { ascending: false })
      .limit(1);

    if (lastKill && lastKill.length > 0) {
      const lastKillTime = new Date(lastKill[0].created_at).getTime();
      const elapsed = Date.now() - lastKillTime;
      if (elapsed < 30000) {
        return { error: `Cooldown active. Please wait ${Math.ceil((30000 - elapsed) / 1000)}s` };
      }
    }

    // 4. Record Kill and Update Status
    const { error: killRecordError } = await supabaseAdmin
      .from('kills')
      .insert({
        game_id: gameId,
        killer_id: killer.id,
        victim_id: victim.id
      });

    if (killRecordError) return { error: 'Failed to record kill' };

    const { error: updateError } = await supabaseAdmin
      .from('game_players')
      .update({ status: 'DEAD' })
      .eq('id', victim.id);

    if (updateError) return { error: 'Failed to update victim status' };

    await distributeDeadPlayerTasks(gameId, victim.id);

    await logEvent(gameId, `🔴 ${killer.display_name} eliminated ${victim.display_name}`, 'KILL');
    await checkWinCondition(gameId);

    return { success: true };
  } catch (err: any) {
    return { error: err.message || 'Unknown server error' };
  }
}

export async function callMeeting(gameId: string, playerToken: string) {
  try {
    if (!gameId || !playerToken) return { error: 'Missing parameters' };

    // Authenticate Caller
    const { data: caller, error: callerError } = await supabaseAdmin
      .from('game_players')
      .select('id, status, display_name')
      .eq('game_id', gameId)
      .eq('player_token', playerToken)
      .single();

    if (callerError || !caller) return { error: 'Player not found' };
    if (caller.status !== 'ALIVE') return { error: 'Ghosts cannot call meetings!' };

    const { data: game } = await supabaseAdmin.from('games').select('status, last_resume_time, game_elapsed_ms').eq('id', gameId).single();
    if (!game || game.status !== 'ACTIVE') return { error: 'You can only call a meeting during an active game.' };

    // Check emergency meeting count limit (max 3 per game)
    const { count: emergencyCount } = await supabaseAdmin
      .from('game_events')
      .select('id', { count: 'exact', head: true })
      .eq('game_id', gameId)
      .eq('event_type', 'MEETING')
      .ilike('message', '%Emergency Meeting%');

    if ((emergencyCount || 0) >= 3) {
      return { error: 'Maximum emergency meetings limit reached! (All 3 meetings used)' };
    }

    // Clear old votes
    await supabaseAdmin
      .from('votes')
      .delete()
      .eq('game_id', gameId);

    // Set meeting state (expires in 10 minutes)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    let newElapsed = game.game_elapsed_ms || 0;
    if (game.last_resume_time) {
      newElapsed += Date.now() - new Date(game.last_resume_time).getTime();
    }

    const { error: updateError } = await supabaseAdmin
      .from('games')
      .update({ 
        status: 'MEETING',
        meeting_called_by: caller.id,
        meeting_expires_at: expiresAt.toISOString(),
        meeting_type: 'EMERGENCY',
        game_elapsed_ms: newElapsed
      })
      .eq('id', gameId);

    if (updateError) return { error: 'Failed to call meeting' };

    await logEvent(gameId, `🚨 ${caller.display_name} called an Emergency Meeting!`, 'MEETING');

    return { success: true };
  } catch (err: any) {
    return { error: err.message || 'Unknown server error' };
  }
}

export async function castVote(gameId: string, playerToken: string, targetId: string | null) {
  try {
    if (!gameId || !playerToken) return { error: 'Missing parameters' };

    // Authenticate Voter
    const { data: voter, error: voterError } = await supabaseAdmin
      .from('game_players')
      .select('id, status')
      .eq('game_id', gameId)
      .eq('player_token', playerToken)
      .single();

    if (voterError || !voter) return { error: 'Player not found' };
    if (voter.status !== 'ALIVE') return { error: 'Ghosts cannot vote!' };

    // Verify game is in MEETING state
    const { data: game, error: gameError } = await supabaseAdmin
      .from('games')
      .select('status')
      .eq('id', gameId)
      .single();

    if (gameError || !game || game.status !== 'MEETING') return { error: 'No active meeting' };

    if (targetId) {
      const { data: target } = await supabaseAdmin.from('game_players').select('status').eq('id', targetId).single();
      if (!target || target.status !== 'ALIVE') return { error: 'You cannot vote for a dead player!' };
    }

    // Record Vote
    const { error: voteError } = await supabaseAdmin
      .from('votes')
      .insert({
        game_id: gameId,
        voter_id: voter.id,
        target_id: targetId
      });

    if (voteError) {
      if (voteError.code === '23505') return { error: 'You already voted!' }; // Unique constraint
      return { error: 'Failed to cast vote' };
    }

    // Check if everyone has voted
    const { count: voteCount } = await supabaseAdmin
      .from('votes')
      .select('*', { count: 'exact', head: true })
      .eq('game_id', gameId);

    const { count: aliveCount } = await supabaseAdmin
      .from('game_players')
      .select('*', { count: 'exact', head: true })
      .eq('game_id', gameId)
      .eq('status', 'ALIVE');

    if (voteCount === aliveCount) {
      // Auto-end meeting if all votes are in
      await resolveMeeting(gameId);
    }

    return { success: true };
  } catch (err: any) {
    return { error: err.message || 'Unknown server error' };
  }
}

export async function forceEndMeeting(gameId: string, hostToken: string) {
  try {
    if (!gameId || !hostToken) return { error: 'Missing parameters' };

    // Authenticate Host
    const { data: game, error: gameError } = await supabaseAdmin
      .from('games')
      .select('status')
      .eq('id', gameId)
      .eq('host_id', hostToken)
      .single();

    if (gameError || !game) return { error: 'Unauthorized or game not found' };
    if (game.status !== 'MEETING') return { error: 'No active meeting' };

    await resolveMeeting(gameId);
    return { success: true };
  } catch (err: any) {
    return { error: err.message || 'Unknown server error' };
  }
}

// Private helper to resolve votes
async function resolveMeeting(gameId: string) {
  const { data: game } = await supabaseAdmin.from('games').select('meeting_type').eq('id', gameId).single();

  const { data: votes } = await supabaseAdmin
    .from('votes')
    .select('target_id')
    .eq('game_id', gameId);

  if (!votes || votes.length === 0) {
    // No votes, just end meeting
    const updateData: any = { status: 'ACTIVE', meeting_type: null };
    if (game?.meeting_type === 'EMERGENCY') {
      updateData.last_resume_time = new Date().toISOString();
    }
    await supabaseAdmin.from('games').update(updateData).eq('id', gameId);
    return;
  }

  // Tally votes
  const tally: Record<string, number> = {};
  let skips = 0;

  for (const v of votes) {
    if (!v.target_id) {
      skips++;
    } else {
      tally[v.target_id] = (tally[v.target_id] || 0) + 1;
    }
  }

  // Find max
  let maxVotes = 0;
  let ejectedId: string | null = null;
  let tie = false;

  for (const [targetId, count] of Object.entries(tally)) {
    if (count > maxVotes) {
      maxVotes = count;
      ejectedId = targetId;
      tie = false;
    } else if (count === maxVotes) {
      tie = true;
    }
  }

  // If skips are higher than or equal to maxVotes, or there's a tie, no one is ejected
  if (skips >= maxVotes || tie) {
    ejectedId = null;
  }

  // Eject player if decided
  if (ejectedId) {
    const { data: victim } = await supabaseAdmin.from('game_players').select('display_name').eq('id', ejectedId).single();
    if (victim) {
      const { data: victimRole } = await supabaseAdmin.from('player_roles').select('role').eq('player_id', ejectedId).single();
      const isImpostor = victimRole?.role === 'IMPOSTOR';
      
      const { data: alivePlayers } = await supabaseAdmin.from('game_players').select('id').eq('game_id', gameId).eq('status', 'ALIVE');
      const aliveIds = alivePlayers?.map(p => p.id) || [];
      const { data: aliveImpostors } = await supabaseAdmin.from('player_roles').select('player_id').eq('game_id', gameId).eq('role', 'IMPOSTOR').in('player_id', aliveIds);
      
      // Since we haven't updated the victim's status to DEAD yet, we subtract 1 if they were an impostor
      const remaining = aliveImpostors ? (isImpostor ? aliveImpostors.length - 1 : aliveImpostors.length) : 0;
      
      const text = `${victim.display_name} was ${isImpostor ? '' : 'not '}An Impostor. ${remaining} Impostor${remaining !== 1 ? 's' : ''} remain.`;
      
      await logEvent(gameId, `💀 ${text}`, 'MEETING');
    }
    await supabaseAdmin
      .from('game_players')
      .update({ status: 'DEAD' }) 
      .eq('id', ejectedId);
      
    await distributeDeadPlayerTasks(gameId, ejectedId);
  } else {
    // Check remaining impostors to print tie text
    const { data: alivePlayers } = await supabaseAdmin.from('game_players').select('id').eq('game_id', gameId).eq('status', 'ALIVE');
    const aliveIds = alivePlayers?.map(p => p.id) || [];
    const { data: aliveImpostors } = await supabaseAdmin.from('player_roles').select('player_id').eq('game_id', gameId).eq('role', 'IMPOSTOR').in('player_id', aliveIds);
    const remaining = aliveImpostors ? aliveImpostors.length : 0;
    
    await logEvent(gameId, `➖ No one was ejected. (Skipped). ${remaining} Impostor${remaining !== 1 ? 's' : ''} remain.`, 'MEETING');
  }

  // Return to ACTIVE
  const updateData: any = { status: 'ACTIVE', meeting_type: null };
  if (game?.meeting_type === 'EMERGENCY') {
    updateData.last_resume_time = new Date().toISOString();
  }

  await supabaseAdmin
    .from('games')
    .update(updateData)
    .eq('id', gameId);
    
  // Clear votes for next round
  await supabaseAdmin
    .from('votes')
    .delete()
    .eq('game_id', gameId);

  await checkWinCondition(gameId);
}

export async function completeTask(gameId: string, playerToken: string, taskLocationId: string) {
  try {
    if (!gameId || !playerToken || !taskLocationId) return { error: 'Missing parameters' };

    // Authenticate Player
    const { data: player, error: playerError } = await supabaseAdmin
      .from('game_players')
      .select('id, status, display_name')
      .eq('game_id', gameId)
      .eq('player_token', playerToken)
      .single();

    if (playerError || !player) return { error: 'Player not found' };

    // Block tasks during meetings
    const { data: game } = await supabaseAdmin.from('games').select('status').eq('id', gameId).single();
    if (!game || game.status !== 'ACTIVE') return { error: 'You can only complete tasks during an active game.' };

    // Clean taskLocationId
    let cleanLocation = taskLocationId.trim().replace(/^["']|["']$/g, '');
    if (cleanLocation.includes('/')) {
      const parts = cleanLocation.split('/').filter(Boolean);
      cleanLocation = parts[parts.length - 1] || cleanLocation;
    }
    if (cleanLocation.includes('?')) {
      const match = cleanLocation.match(/[?&](?:task|location|id|pin)=([^&]+)/i);
      if (match) cleanLocation = match[1];
    }

    const cleanLower = cleanLocation.toLowerCase();
    const cleanStripped = cleanLower.replace(/^(task|game)-/i, '').replace(/[-_ ]/g, '');

    // Fetch all pending tasks for this game
    const { data: tasks, error: taskError } = await supabaseAdmin
      .from('player_tasks')
      .select('id, completed, task_type, player_id, task_location_id, pin_code')
      .eq('game_id', gameId)
      .eq('completed', false);

    if (taskError || !tasks || tasks.length === 0) return { error: 'You do not have this task.' };

    // Find all tasks matching this scanned location
    const matchedTasks = tasks.filter(t => {
      const loc = (t.task_location_id || '').toLowerCase().trim();
      const locStripped = loc.replace(/^(task|game)-/i, '').replace(/[-_ ]/g, '');
      const pin = (t.pin_code || '').toLowerCase().trim();
      const pinStripped = pin.replace(/^(task|game)-/i, '').replace(/[-_ ]/g, '');

      return (
        loc === cleanLower ||
        locStripped === cleanStripped ||
        (pin && (pin === cleanLower || pinStripped === cleanStripped))
      );
    });

    if (matchedTasks.length === 0) return { error: 'You do not have this task.' };

    let targetTask = matchedTasks.find(t => t.player_id === player.id);

    if (!targetTask) {
      // Look for a dead crewmate's task
      const { data: deadPlayers } = await supabaseAdmin
        .from('game_players')
        .select('id')
        .eq('game_id', gameId)
        .eq('status', 'DEAD');

      if (deadPlayers && deadPlayers.length > 0) {
        const deadIds = deadPlayers.map(d => d.id);
        const { data: deadCrewmates } = await supabaseAdmin
          .from('player_roles')
          .select('player_id')
          .eq('game_id', gameId)
          .eq('role', 'CREWMATE')
          .in('player_id', deadIds);

        if (deadCrewmates && deadCrewmates.length > 0) {
          const deadCrewmateIds = deadCrewmates.map(dc => dc.player_id);
          targetTask = matchedTasks.find(t => deadCrewmateIds.includes(t.player_id));
        }
      }
    }

    if (!targetTask) return { error: 'You do not have this task.' };
    if (targetTask.task_type === 'PIN') return { error: 'This task requires a PIN code.' };

    return await markTaskCompleted(gameId, targetTask.player_id, targetTask.id, player.id, player.display_name);
  } catch (err: any) {
    return { error: err.message || 'Unknown server error' };
  }
}

export async function submitTaskPin(gameId: string, playerToken: string, taskId: string, pin: string) {
  try {
    if (!gameId || !playerToken || !taskId || !pin) return { error: 'Missing parameters' };

    // Authenticate Player
    const { data: player, error: playerError } = await supabaseAdmin
      .from('game_players')
      .select('id, display_name')
      .eq('game_id', gameId)
      .eq('player_token', playerToken)
      .single();

    if (playerError || !player) return { error: 'Player not found' };

    // Block tasks during meetings
    const { data: game } = await supabaseAdmin.from('games').select('status').eq('id', gameId).single();
    if (!game || game.status !== 'ACTIVE') return { error: 'You can only complete tasks during an active game.' };

    // Check task
    const { data: task, error: taskError } = await supabaseAdmin
      .from('player_tasks')
      .select('id, pin_code, completed, player_id')
      .eq('id', taskId)
      .single();

    if (taskError || !task) return { error: 'Task not found' };
    
    // Verify ownership
    let canComplete = task.player_id === player.id;
    if (!canComplete) {
      const { data: owner } = await supabaseAdmin
        .from('game_players')
        .select('status')
        .eq('id', task.player_id)
        .single();
      if (owner && owner.status === 'DEAD') {
        const { data: ownerRole } = await supabaseAdmin
          .from('player_roles')
          .select('role')
          .eq('game_id', gameId)
          .eq('player_id', task.player_id)
          .single();
        if (ownerRole?.role === 'CREWMATE') {
          canComplete = true;
        }
      }
    }
    if (!canComplete) return { error: 'You do not have permission to complete this task.' };

    if (task.completed) return { error: 'Task already completed.' };
    if (task.pin_code !== pin) return { error: 'Incorrect PIN code!' };

    return await markTaskCompleted(gameId, task.player_id, task.id, player.id, player.display_name);
  } catch (err: any) {
    return { error: err.message || 'Unknown server error' };
  }
}

async function markTaskCompleted(
  gameId: string,
  taskOwnerId: string,
  taskId: string,
  performerId?: string,
  actorName?: string
) {
  // Mark completed
  const { error: updateError } = await supabaseAdmin
    .from('player_tasks')
    .update({ completed: true })
    .eq('id', taskId);

  if (updateError) return { error: 'Failed to complete task' };

  // Fetch task info to get the specific task name
  const { data: task } = await supabaseAdmin
    .from('player_tasks')
    .select('task_name')
    .eq('id', taskId)
    .single();

  const effectivePerformerId = performerId || taskOwnerId;

  // Resolve performer display name
  let performerName = actorName;
  if (!performerName && effectivePerformerId) {
    const { data: performer } = await supabaseAdmin
      .from('game_players')
      .select('display_name')
      .eq('id', effectivePerformerId)
      .single();
    performerName = performer?.display_name;
  }

  if (!performerName && taskOwnerId) {
    const { data: owner } = await supabaseAdmin
      .from('game_players')
      .select('display_name')
      .eq('id', taskOwnerId)
      .single();
    performerName = owner?.display_name;
  }

  const finalName = performerName || 'Crewmate';

  // Check if player is an Impostor. If so, don't increment global progress.
  const { data: roleData } = await supabaseAdmin
    .from('player_roles')
    .select('role')
    .eq('game_id', gameId)
    .eq('player_id', effectivePerformerId)
    .single();

  const isImpostor = roleData?.role === 'IMPOSTOR';
  const taskTitle = task?.task_name ? `: ${task.task_name}` : '';

  if (!isImpostor) {
    // Increment game tasks completed
    const { data: game, error: gameError } = await supabaseAdmin
      .from('games')
      .select('tasks_completed')
      .eq('id', gameId)
      .single();

    if (!gameError && game) {
      await supabaseAdmin
        .from('games')
        .update({ tasks_completed: game.tasks_completed + 1 })
        .eq('id', gameId);
        
      await logEvent(gameId, `✅ ${finalName} completed task${taskTitle}`, 'TASK');
    }
  }

  await checkWinCondition(gameId);
  return { success: true };
}

export async function checkWinCondition(gameId: string) {
  try {
    const { data: game } = await supabaseAdmin.from('games').select('tasks_completed, total_tasks, status').eq('id', gameId).single();
    if (!game || game.status !== 'ACTIVE') return;

    if (game.total_tasks > 0 && game.tasks_completed >= game.total_tasks) {
      await supabaseAdmin.from('games').update({ status: 'CREWMATES_WIN' }).eq('id', gameId);
      await calculatePoints(gameId);
      return;
    }

    const { data: players } = await supabaseAdmin.from('game_players').select('id, status').eq('game_id', gameId);
    if (!players) return;

    const { data: roles } = await supabaseAdmin.from('player_roles').select('player_id, role').eq('game_id', gameId);
    if (!roles) return;

    const alivePlayers = players.filter(p => p.status === 'ALIVE');
    const aliveImpostors = alivePlayers.filter(p => roles.find(r => r.player_id === p.id)?.role === 'IMPOSTOR');
    const aliveCrewmates = alivePlayers.length - aliveImpostors.length;

    if (aliveImpostors.length === 0) {
      await supabaseAdmin.from('games').update({ status: 'CREWMATES_WIN' }).eq('id', gameId);
      await calculatePoints(gameId);
    } else if (aliveImpostors.length >= aliveCrewmates) {
      await supabaseAdmin.from('games').update({ status: 'IMPOSTORS_WIN' }).eq('id', gameId);
      await calculatePoints(gameId);
    }
  } catch (e) {
    console.error('Win condition check failed', e);
  }
}

export async function logEvent(gameId: string, message: string, eventType: 'SYSTEM' | 'KILL' | 'TASK' | 'MEETING') {
  try {
    await supabaseAdmin
      .from('game_events')
      .insert({
        game_id: gameId,
        message,
        event_type: eventType
      });
  } catch (e) {
    console.error('Failed to log event', e);
  }
}

export async function publicCallMeeting(joinCode: string) {
  try {
    if (!joinCode) return { error: 'Missing join code' };

    // Find the active game
    const { data: game, error: gameError } = await supabaseAdmin
      .from('games')
      .select('id, status, last_resume_time, game_elapsed_ms')
      .eq('join_code', joinCode.toUpperCase())
      .single();

    if (gameError || !game) return { error: 'Game not found' };
    if (game.status !== 'ACTIVE') return { error: 'You can only call a meeting during an active game.' };

    // Check emergency meeting count limit (max 3 per game)
    const { count: emergencyCount } = await supabaseAdmin
      .from('game_events')
      .select('id', { count: 'exact', head: true })
      .eq('game_id', game.id)
      .eq('event_type', 'MEETING')
      .ilike('message', '%Emergency Meeting%');

    if ((emergencyCount || 0) >= 3) {
      return { error: 'Maximum emergency meetings limit reached! (All 3 meetings used)' };
    }

    // Clear old votes
    await supabaseAdmin
      .from('votes')
      .delete()
      .eq('game_id', game.id);

    // Set meeting state (expires in 10 minutes)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    let newElapsed = game.game_elapsed_ms || 0;
    if (game.last_resume_time) {
      newElapsed += Date.now() - new Date(game.last_resume_time).getTime();
    }

    const { error: updateError } = await supabaseAdmin
      .from('games')
      .update({ 
        status: 'MEETING',
        meeting_called_by: null,
        meeting_expires_at: expiresAt.toISOString(),
        meeting_type: 'EMERGENCY',
        game_elapsed_ms: newElapsed
      })
      .eq('id', game.id);

    if (updateError) return { error: 'Failed to call meeting' };

    await logEvent(game.id, `🚨 A PUBLIC Emergency Meeting was called!`, 'MEETING');

    return { success: true };
  } catch (err: any) {
    return { error: err.message || 'Unknown server error' };
  }
}

export async function publicCastVote(joinCode: string, voterId: string, targetId: string | null) {
  try {
    if (!joinCode || !voterId) return { error: 'Missing parameters' };

    // Find the active game
    const { data: game, error: gameError } = await supabaseAdmin
      .from('games')
      .select('id, status')
      .eq('join_code', joinCode.toUpperCase())
      .single();

    if (gameError || !game || game.status !== 'MEETING') return { error: 'No active meeting' };

    // Authenticate Voter (just checking they exist and are ALIVE)
    const { data: voter, error: voterError } = await supabaseAdmin
      .from('game_players')
      .select('id, status')
      .eq('id', voterId)
      .eq('game_id', game.id)
      .single();

    if (voterError || !voter) return { error: 'Player not found' };
    if (voter.status !== 'ALIVE') return { error: 'Ghosts cannot vote!' };

    if (targetId) {
      const { data: target } = await supabaseAdmin.from('game_players').select('status').eq('id', targetId).single();
      if (!target || target.status !== 'ALIVE') return { error: 'You cannot vote for a dead player!' };
    }

    // Record Vote
    const { error: voteError } = await supabaseAdmin
      .from('votes')
      .insert({
        game_id: game.id,
        voter_id: voter.id,
        target_id: targetId
      });

    if (voteError) {
      if (voteError.code === '23505') return { error: 'You already voted!' }; // Unique constraint
      return { error: 'Failed to cast vote' };
    }

    // Check if everyone has voted
    const { count: voteCount } = await supabaseAdmin
      .from('votes')
      .select('*', { count: 'exact', head: true })
      .eq('game_id', game.id);

    const { count: aliveCount } = await supabaseAdmin
      .from('game_players')
      .select('*', { count: 'exact', head: true })
      .eq('game_id', game.id)
      .eq('status', 'ALIVE');

    if (voteCount === aliveCount) {
      // Auto-end meeting if all votes are in
      await resolveMeeting(game.id);
    }

    return { success: true };
  } catch (err: any) {
    return { error: err.message || 'Unknown server error' };
  }
}

export async function reportDeadBody(gameId: string, reporterToken: string, deadPlayerId: string) {
  try {
    if (!gameId || !reporterToken || !deadPlayerId) return { error: 'Missing parameters' };

    // Authenticate Reporter
    const { data: reporter, error: reporterError } = await supabaseAdmin
      .from('game_players')
      .select('id, status, display_name')
      .eq('game_id', gameId)
      .eq('player_token', reporterToken)
      .single();

    if (reporterError || !reporter) return { error: 'Player not found' };
    if (reporter.status !== 'ALIVE') return { error: 'Ghosts cannot report bodies!' };

    const { data: game } = await supabaseAdmin.from('games').select('status').eq('id', gameId).single();
    if (!game || game.status !== 'ACTIVE') return { error: 'You can only report bodies during an active game.' };

    // Verify Dead Player exists and is DEAD
    const { data: victim, error: victimError } = await supabaseAdmin
      .from('game_players')
      .select('id, status, display_name')
      .eq('game_id', gameId)
      .eq('id', deadPlayerId.replace('DEAD_', ''))
      .single();

    if (victimError || !victim) return { error: 'Invalid QR code' };
    if (victim.status !== 'DEAD') return { error: 'That player is not dead!' };

    // Clear old votes
    await supabaseAdmin
      .from('votes')
      .delete()
      .eq('game_id', gameId);

    // Set meeting state (expires in 10 minutes)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    const { error: updateError } = await supabaseAdmin
      .from('games')
      .update({ 
        status: 'MEETING',
        meeting_called_by: reporter.id,
        meeting_expires_at: expiresAt.toISOString(),
        meeting_type: 'BODY_REPORT'
      })
      .eq('id', gameId);

    if (updateError) return { error: 'Failed to report body' };

    await logEvent(gameId, `🚨 ${reporter.display_name} reported a dead body!`, 'MEETING');

    return { success: true };
  } catch (err: any) {
    return { error: err.message || 'Unknown server error' };
  }
}

async function distributeDeadPlayerTasks(gameId: string, deadPlayerId: string) {
  // Get all incomplete tasks of the dead player
  const { data: deadTasks } = await supabaseAdmin
    .from('player_tasks')
    .select('id')
    .eq('game_id', gameId)
    .eq('player_id', deadPlayerId)
    .eq('completed', false);

  if (!deadTasks || deadTasks.length === 0) return;

  // Get all alive players
  const { data: alivePlayers } = await supabaseAdmin
    .from('game_players')
    .select('id')
    .eq('game_id', gameId)
    .eq('status', 'ALIVE');

  if (!alivePlayers || alivePlayers.length === 0) return;

  // Get roles to filter out Impostors
  const { data: roles } = await supabaseAdmin
    .from('player_roles')
    .select('player_id, role')
    .eq('game_id', gameId);

  const aliveCrewmates = alivePlayers.filter(p => {
    const role = roles?.find(r => r.player_id === p.id)?.role;
    return role === 'CREWMATE';
  });

  if (aliveCrewmates.length === 0) return;

  // Shuffle alive crewmates to randomize who gets tasks
  const shuffledCrewmates = [...aliveCrewmates].sort(() => Math.random() - 0.5);

  // Distribute tasks evenly among alive crewmates
  for (let i = 0; i < deadTasks.length; i++) {
    const task = deadTasks[i];
    const newOwner = shuffledCrewmates[i % shuffledCrewmates.length];
    
    await supabaseAdmin
      .from('player_tasks')
      .update({ player_id: newOwner.id })
      .eq('id', task.id);
  }
}

export async function calculatePoints(gameId: string) {
  // Fetch players, roles, and game
  const { data: game } = await supabaseAdmin.from('games').select('status').eq('id', gameId).single();
  const { data: players } = await supabaseAdmin.from('game_players').select('*').eq('game_id', gameId);
  const { data: roles } = await supabaseAdmin.from('player_roles').select('*').eq('game_id', gameId);
  
  if (!players || !roles) return;

  // We need to count kills for impostors and tasks for crewmates
  const { data: events } = await supabaseAdmin.from('game_events').select('*').eq('game_id', gameId).eq('event_type', 'KILL');
  const { data: tasks } = await supabaseAdmin.from('player_tasks').select('*').eq('game_id', gameId).eq('completed', true);

  const impostors = players.filter(p => roles.find(r => r.player_id === p.id)?.role === 'IMPOSTOR');
  const crewmates = players.filter(p => roles.find(r => r.player_id === p.id)?.role === 'CREWMATE');

  const impostorsAlive = impostors.filter(p => p.status === 'ALIVE');
  const impostorsDead = impostors.filter(p => p.status === 'DEAD');
  
  const crewmatesAlive = crewmates.filter(p => p.status === 'ALIVE');
  const crewmatesDead = crewmates.filter(p => p.status === 'DEAD');

  for (const player of players) {
    const role = roles.find(r => r.player_id === player.id)?.role;
    let points = 0;
    let breakdown = '';

    if (role === 'IMPOSTOR') {
      const kills = events?.filter(e => e.message.includes(player.display_name)).length || 0;

      if (game?.status === 'CREWMATES_WIN') {
        points = 5;
        breakdown = 'Defeated by Crewmates';
      } else {
        // IMPOSTORS_WIN
        if (impostorsAlive.length === impostors.length) {
          points = 25;
          breakdown = 'Won (Both Impostors survived)';
        } else if (impostorsAlive.length > 0 && player.status === 'ALIVE') {
          points = 25;
          breakdown = 'Won (Survived)';
        } else if (impostorsAlive.length > 0 && player.status === 'DEAD') {
          if (kills > 0) {
            points = 12.5;
            breakdown = 'Won but Died (Partner survived, 1+ kills)';
          } else {
            points = 5;
            breakdown = 'Won but Died (Partner survived, 0 kills)';
          }
        } else {
          // Fallback if somehow they won but all died
          points = 5;
          breakdown = 'Both Impostors died';
        }
      }
    } else if (role === 'CREWMATE') {
      const completedTasks = tasks?.filter(t => t.player_id === player.id).length || 0;

      if (game?.status === 'IMPOSTORS_WIN') {
        points = 5;
        breakdown = 'Defeated by Impostors';
      } else {
        if (player.status === 'ALIVE') {
          points = 25;
          breakdown = 'Won (Survived)';
        } else if (player.status === 'DEAD') {
          if (completedTasks === 0) {
            points = 5;
            breakdown = 'Won but Died (0 tasks)';
          } else {
            points = 12.5;
            breakdown = 'Won but Died (1+ tasks)';
          }
        }
      }
    }

    // Save points
    await supabaseAdmin
      .from('game_players')
      .update({ points, score_breakdown: breakdown })
      .eq('id', player.id);
  }
}

export async function timeExpired(gameId: string) {
  try {
    const { data: game } = await supabaseAdmin.from('games').select('status').eq('id', gameId).single();
    if (!game || game.status !== 'ACTIVE' && game.status !== 'MEETING') return { error: 'Game is not active' };

    await supabaseAdmin.from('games').update({ status: 'IMPOSTORS_WIN' }).eq('id', gameId);
    await calculatePoints(gameId);
    return { success: true };
  } catch (err: any) {
    return { error: err.message || 'Unknown server error' };
  }
}

export async function autoEndMeeting(gameId: string) {
  try {
    if (!gameId) return { error: 'Missing parameters' };

    const { data: game, error: gameError } = await supabaseAdmin
      .from('games')
      .select('status, meeting_expires_at')
      .eq('id', gameId)
      .single();

    if (gameError || !game) return { error: 'Game not found' };
    if (game.status !== 'MEETING') return { error: 'No active meeting' };

    // Only allow auto-end if time is actually up (with 5 seconds leeway for client drift)
    if (game.meeting_expires_at) {
      const expires = new Date(game.meeting_expires_at).getTime();
      if (Date.now() < expires - 5000) {
         return { error: 'Meeting time has not expired yet' };
      }
    }

    await resolveMeeting(gameId);
    return { success: true };
  } catch (err: any) {
    return { error: err.message || 'Unknown server error' };
  }
}

export async function deleteGame(gameId: string, hostToken: string) {
  try {
    if (!gameId || !hostToken) return { error: 'Missing parameters' };

    // 1. Verify host owns the game
    const { data: game, error: gameError } = await supabaseAdmin
      .from('games')
      .select('id, host_id')
      .eq('id', gameId)
      .eq('host_id', hostToken)
      .single();

    if (gameError || !game) {
      return { error: 'Unauthorized or game not found' };
    }

    // 2. Cascade delete all linked records safely
    await supabaseAdmin.from('game_events').delete().eq('game_id', gameId);
    await supabaseAdmin.from('votes').delete().eq('game_id', gameId);
    await supabaseAdmin.from('kills').delete().eq('game_id', gameId);
    await supabaseAdmin.from('player_tasks').delete().eq('game_id', gameId);
    await supabaseAdmin.from('player_roles').delete().eq('game_id', gameId);
    await supabaseAdmin.from('game_players').delete().eq('game_id', gameId);

    // 3. Delete the game itself
    const { error: deleteError } = await supabaseAdmin
      .from('games')
      .delete()
      .eq('id', gameId);

    if (deleteError) {
      return { error: 'Failed to delete game: ' + deleteError.message };
    }

    return { success: true };
  } catch (err: any) {
    return { error: err.message || 'Unknown server error' };
  }
}

export async function resetGame(gameId: string, hostToken: string) {
  try {
    if (!gameId || !hostToken) return { error: 'Missing parameters' };

    const { data: game, error: gameError } = await supabaseAdmin
      .from('games')
      .select('id, host_id')
      .eq('id', gameId)
      .eq('host_id', hostToken)
      .single();

    if (gameError || !game) return { error: 'Unauthorized or game not found' };

    // Reset roles, tasks, votes, kills, player status
    await supabaseAdmin.from('player_roles').delete().eq('game_id', gameId);
    await supabaseAdmin.from('player_tasks').delete().eq('game_id', gameId);
    await supabaseAdmin.from('votes').delete().eq('game_id', gameId);
    await supabaseAdmin.from('kills').delete().eq('game_id', gameId);
    await supabaseAdmin.from('game_players').update({ status: 'ALIVE', is_ready: false }).eq('game_id', gameId);

    const { error: updateError } = await supabaseAdmin
      .from('games')
      .update({
        status: 'LOBBY',
        tasks_completed: 0,
        game_elapsed_ms: 0,
        meeting_type: null,
        meeting_called_by: null,
        meeting_expires_at: null,
      })
      .eq('id', gameId);

    if (updateError) return { error: updateError.message };

    await logEvent(gameId, '🔄 Game reset to Lobby by Host.', 'SYSTEM');
    return { success: true };
  } catch (err: any) {
    return { error: err.message || 'Unknown server error' };
  }
}


