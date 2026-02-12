<script lang="ts">
  import { LinearProgress } from '@podman-desktop/ui-svelte';
  import type { PageProps } from './$types';

  let { data }: PageProps = $props();
</script>

<div class="w-full h-full">
  {#await data.analysis}
    <LinearProgress />
  {:then document}
    <span>Artifacts</span>
    <ul>
      {#each document.artifacts as artifact (artifact.id)}
        <li>{artifact.name} - {artifact.version}</li>
      {/each}
    </ul>
  {:catch error}
    <span>Error {String(error)}</span>
  {/await}
</div>
