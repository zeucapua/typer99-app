<script lang="ts">
  let party_id : string = $state("");
</script>

<h1>typer99</h1>
<p>Join a party</p>
<input bind:value={party_id} type="text" maxlength="4" />
<a href={`/${party_id}`}>Enter</a>
