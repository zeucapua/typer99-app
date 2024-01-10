<script lang="ts">
  import PartySocket from "partysocket";
  import { confetti } from "@neoconfetti/svelte";

  import { dev } from "$app/environment";
  import { page } from "$app/stores";
  import { untrack, tick } from "svelte";

  type Player = {
    conn_id: string,
    name: string,
    score: number,
    is_ready: boolean,
  };
  
  /* VARIABLES */
  // confetti :3
  let confetti_visible = $state(false);

  // current universal user details
  let conn_id = $state("");
  let name = $state((Math.random() + 1).toString(36).substring(7)); // initial name

  // party state 
  const party_id = $page.params.party;
  let players : Player[] = $state([]);
  let game_state : "lobby" | "running" | "ending" = $state("lobby");

  // lobby
  let is_ready = $state(false);

  // running
  let user_string = $state("");
  let target_string = $state("");  
  let progress = $derived(
    (target_string.length !== 0) ? 
    (user_string.length / target_string.length) * 100
    : 0
  );
  let bomb_charge = $state(0);
  let rocket_charge = $state(0);
  let finished : {id: string, result: number}[] = $state([]);

  // ending
  let leaderboard = $derived(
    players.length !== 0 ? players.toSorted((a,b) => b.score - a.score)
    : []
  );

  // change or reset variables based on game state
  $effect(() => {
    switch (game_state) {
      case "lobby": {
        is_ready = false;
        updateName();
        break;
      }
      case "running": {
        if (progress === 100) {
          let num_incorrect = 0;
          for (let i = 0; i < target_string.length; i++) {
            num_incorrect += (user_string[i] !== target_string[i]) ? 1 : 0;
          }

          toggleConfetti();

          socket.send(JSON.stringify({
            type: "finished",
            values: {
              result: ((user_string.length - num_incorrect) / target_string.length) * 100
            }
          }));   
        }
        break;
      }
      case "ending": {
        is_ready = false;
        finished = [];
        target_string = "";
        user_string = "";
        bomb_charge = 0;
        rocket_charge = 0;
        break;
      }
    }
  });

  $effect(() => {
    if (user_string) {
      tick().then(() => {
        if (bomb_charge < 20) bomb_charge++;
        if (rocket_charge < 20) rocket_charge++;
      });
    }
  })

  /* SOCKET */
  const socket = new PartySocket({
    host: dev ? "localhost:1999" : `https://typer99-app-party.zeucapua.partykit.dev/party/${party_id}`,
    room: party_id,
  });

  /* FUNCTIONS */
  // lobby
  function updateName() {
    if (socket) {
      const data = JSON.stringify({
        type: "updateName",
        values: { name }
      });

      socket.send(data);
    }
  }

  // running 
  function activateBomb() {
    if (socket) {
      const data = JSON.stringify({
        type: "bomb",
      });

      socket.send(data);
      bomb_charge = 0;
    }
  }

  function activateRocket() {
    user_string = user_string + target_string.substring(user_string.length, user_string.length + 10);
    rocket_charge = 0;
  }
  
  // lobby + ending
  function toggleReady() {
    if (socket) {
      const data = JSON.stringify({
        type: "ready",
        values: { is_ready }
      });
      socket.send(data);
    }
  }

  // running + ending
  async function toggleConfetti() {
    confetti_visible = false;
    await tick();
    confetti_visible = true;
  }
  
  /* PARTYKIT BROADCAST LISTENER */
  socket.addEventListener("message", async (event) => {
    const data = JSON.parse(event.data);

    switch (data.type) {
      case "connected": {
        conn_id = data.values.conn_id;
        break;
      }
      case "bombed": {
        if (conn_id !== data.values.activator) {
          user_string = user_string.length < 10 ? "" : user_string.substring(0, user_string.length - 10);
        }
        break;
      }
      case "mirror": {
        players = data.values.players;
        game_state = data.values.party_state;
        target_string = data.values.target_string ?? "";
        finished = data.values.finished ?? [];
        break;
      }
    }
  });
</script>

<svelte:head>
  <title>Game {party_id} - typer99</title>
</svelte:head>

<main class="p-8 flex flex-col gap-8 text-2xl">
  <p>Party # {party_id} ({conn_id})</p>

  {#if game_state === "lobby"}

    <div>
      <input class="bg-transparent border-b" bind:value={name} type="text" placeholder="Joe" />
      <button class="text-lg px-4 py-2 bg-white text-blue-600 rounded-full" onclick={updateName}>
        Update
      </button>
    </div>
    <label for="ready">
      <input name="ready" type="checkbox" bind:checked={is_ready} onchange={toggleReady} />
      Ready{is_ready ? "!" : "?"} 
    </label>


    Others:
    {#each players as player : Player}
      <!-- display other players' state -->
      {#if player.conn_id !== conn_id}
        <div class="flex gap-4">
          <p>{player.name}</p>
          {#if player.is_ready}
            <img
              src="/hand-awesome-3.svg"
              alt="Hand Awesome 3 by StreamlineHQ"
              class="w-full max-w-8"
            />
          {:else}
            <img 
              src="/hand-dislike-1.svg"
              alt="Hand Dislike 1 by StreamlineHQ"
              class="w-full max-w-8"
            />
          {/if}
        </div>
      {/if}
    {/each}

  {:else if game_state === "running"}
    <h1>Game</h1>
    <p>
      {#each target_string as letter, i}
        {#if (user_string.length === 0) || (i > user_string.length)}
          <span class={`${user_string.length === i && "border border-white"} text-gray-400`}>{letter}</span>
        {:else if (letter === user_string[i])}
          <span class={`${user_string.length === i && "border border-white"} text-green-400`}>{letter}</span>
        {:else}
          <span class={`${user_string.length === i && "border border-white"} text-red-400`}>{letter}</span> 
        {/if}
      {/each}
    </p>
    <input autofocus class="bg-transparent border-b border-white" type="text" bind:value={user_string} disabled={progress === 100}/>
    <progress class="bg-transparent border border-white" value={progress} max={100} />

    <div class="w-full flex justify-center gap-12">
      <button 
        onclick={activateBomb}
        disabled={bomb_charge < 20}
        class="w-full max-w-24 border-4 border-white rounded-full p-4 disabled:border-dashed disabled:bg-neutral-700"
      >
        <img 
          src="/entertainment-events-hobbies-bomb-1.svg"
          alt="Entertainment Events Hobbies Bomb 1 by StreamlineHQ"
        />
      </button>
      <button 
        onclick={activateRocket}
        disabled={rocket_charge < 20}
        class="w-full max-w-24 border-4 border-white rounded-full p-4 disabled:border-dashed disabled:bg-neutral-700"
      >
        <img 
          src="/business-product-startup-1.svg"
          alt="Business Product Startup 1 by StreamlineHQ"
        />
      </button>
    </div>

    <div class="flex justify-evenly">
      {#each players as player, i (player.conn_id)}
        {#if finished.find((fin) => fin.id === player.conn_id)}
          <img 
            src="/hand-ok-2.svg" 
            alt="Pixel Hand OK 2 by StreamlineHQ" 
            class={`w-full max-w-16 pb-2 ${conn_id === player.conn_id && "border-b-4 border-dashed"}`}
          />    
        {:else}
          <img 
            src="/hand-writing.svg" 
            alt="Pixel Hand Writing by StreamlineHQ" 
            class={`w-full max-w-16 pb-2 ${conn_id === player.conn_id && "border-b-4 border-dashed"}`}
          />    
        {/if}
      {/each}
    </div>

  {:else if game_state === "ending"}
    <h1>Leaderboard</h1>
    {#each leaderboard as player : Player}
      <p>{player.name}: {player.score} | {player.is_ready}</p>
    {/each}
    <label for="ready">
      <input name="ready" type="checkbox" bind:checked={is_ready} onchange={toggleReady} />
      {is_ready ? "Waiting for others" : "Back to Lobby?"} 
    </label>
  {/if}

  {#if confetti_visible}
    <div class="flex justify-center" use:confetti />
  {/if}
</main>

<style>
  progress {
    background-color: white;
  }
</style>
