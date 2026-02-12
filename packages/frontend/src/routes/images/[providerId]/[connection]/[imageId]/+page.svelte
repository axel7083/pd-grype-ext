<script lang="ts">
  import { LinearProgress, DetailsPage } from '@podman-desktop/ui-svelte';
  import type { PageProps } from './$types';
  import PackageList from '$lib/packages/PackageList.svelte';

  let { data }: PageProps = $props();
</script>

<DetailsPage title="Image analysis">
  {#snippet subtitleSnippet()}
    {#await data.image}
      <div class="h-2 size-40 rounded bg-gray-900 animate-pulse"></div>
    {:then image}
      <span>{image.name}</span>
    {/await}
  {/snippet}
  {#snippet contentSnippet()}
    <div class="w-full h-full">
      {#await data.analysis}
        <LinearProgress />
      {:then document}
        <PackageList packages={document.artifacts} />
      {:catch error}
        <span>Error {String(error)}</span>
      {/await}
    </div>
  {/snippet}
</DetailsPage>


