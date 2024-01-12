<script lang="ts">
  import "../app.css";
</script>

<div 
  class="text-white font-spacegrotesk font-semibold w-full h-full min-w-screen min-h-screen flex flex-col bg-blue-700 bg-repeat"
>
  <nav class="flex w-full justify-between items-center px-8 py-4 border-b-4 border-white">
    <a href="/" class="text-2xl font-chillax">
      typer_99
    </a>

    <ul class="flex gap-4 items-center">
      <a href="/info" target="_blank">
        <img
          src="/interface-essential-information-circle-2.svg"
          alt="Interface Essential Information Circle 2 by StreamlineHQ"
          class="w-8"
        />
      </a>
      <a href="https://github.com/zeucapua/typer99-app" target="_blank">
        <img
          src="/search-coding.svg"
          alt="Search Coding by StreamlineHQ"
          class="w-8"
        />
      </a>
      <a href="https://twitter.com/zeu_dev" target="_blank">
        <img
          src="/logo-social-media-twitter-circle.svg"
          alt="Logo Social Media Twitter Circle by StreamlineHQ"
          class="w-8"
        />
      </a>
    </ul>
  </nav>

  <slot />
</div>
