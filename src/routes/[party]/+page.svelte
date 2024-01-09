<script lang="ts">
  import PartySocket from "partysocket";
  import { dev } from "$app/environment";
  import { page } from "$app/stores";
  import { onMount } from "svelte";

  type Player = {
    conn_id: string,
    name: string,
    score: number,
    is_ready: boolean,
  };
  
  /* VARIABLES */
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
  let finished : {id: string, result: number}[] = $state([]);

  // change or reset variables based on game state
  $effect(() => {
    switch (game_state) {
      case "lobby": {
        is_ready = false;
        break;
      }
      case "running": {
        if (progress === 100) {
          let num_incorrect = 0;
          for (let i = 0; i < target_string.length; i++) {
            num_incorrect += (user_string[i] !== target_string[i]) ? 1 : 0;
          }
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
        break;
      }
    }
  });


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
  
  /* PARTYKIT BROADCAST LISTENER */
  socket.addEventListener("message", async (event) => {
    const data = JSON.parse(event.data);

    switch (data.type) {
      case "connected": {
        conn_id = data.values.conn_id;
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

  onMount(() => {
    updateName();
  });
</script>

<main class="flex flex-col gap-8 text-2xl">
  <p>Party #{party_id} ({conn_id})</p>
  {#if game_state === "lobby"}

    <div>
      <input class="bg-transparent border-b" bind:value={name} type="text" placeholder="Joe" />
      <button class="text-lg px-4 py-2 bg-white text-blue-600 rounded-full" onclick={updateName}>
        Update
      </button>
      <label for="ready">
        <input name="ready" type="checkbox" bind:checked={is_ready} onchange={toggleReady} />
        Ready{is_ready ? "!" : "?"} 
      </label>
    </div>

    Others:
    {#each players as player : Player}
      <!-- display other players' state -->
      {#if player.conn_id !== conn_id}
        <div>
          <p>{player.name} | {player.is_ready}</p>
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
    <input class="bg-transparent border-b border-white" type="text" bind:value={user_string} disabled={progress === 100}/>
    <progress class="bg-transparent border border-white" value={progress} max={100} />

    {#each finished as fin : {id: string, result: number}}
      <p>{fin.id}</p>
    {/each}

  {:else if game_state === "ending"}
    <h1>Leaderboard</h1>
    {#each players as player : Player}
      <p>{player.name}: {player.score} | {player.is_ready}</p>
    {/each}
    <label for="ready">
      <input name="ready" type="checkbox" bind:checked={is_ready} onchange={toggleReady} />
      {is_ready ? "Waiting for others" : "Back to Lobby?"} 
    </label>
  {/if}
</main>

<style>
  progress {
    background-color: white;
  }
</style>
