<script lang="ts">
  let party_id : string = $state("");
</script>

<main class="flex flex-col gap-8 justify-center">
  <h1 class="text-9xl font-chillax font-black text-center drop-shadow-xl">
    typer_99
  </h1>
  <section class="flex items-center gap-8 px-auto mx-auto px-8 py-4 border-4 border-white border-double rounded-lg">
    <p>Join a party:</p>
    <input class="bg-blue-700 enabled:ring-white text-white border-b" bind:value={party_id} type="text" maxlength="4" />
    <a class="px-4 py-2 bg-white text-blue-600 rounded-full drop-shadow-xl" href={`/${party_id}`}>Enter</a>
  </section>
</main>
