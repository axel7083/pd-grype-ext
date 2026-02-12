<script lang="ts">
  import { LinearProgress, NavPage, Tab } from '@podman-desktop/ui-svelte';
  import type { PageProps } from './$types';
  import PackageList from '$lib/packages/PackageList.svelte';
  import { page } from '$app/state';

  let { data }: PageProps = $props();

  let searchTerm = $state('');
</script>

<NavPage title="Image analysis" bind:searchTerm={searchTerm} searchEnabled={true}>
  {#snippet additionalActions()}
    {#await data.image}
      <div class="h-2 size-40 rounded bg-gray-900 animate-pulse"></div>
    {:then image}
      <span>{image.name}</span>
    {/await}
  {/snippet}
  {#snippet tabs()}
    <Tab title="Packages" url={page.url.pathname} selected={true}/>
  {/snippet}
  {#snippet content()}
    <div class="w-full h-full flex">
      {#await data.analysis}
        <LinearProgress />
      {:then document}
        <PackageList searchTerm={searchTerm} packages={document.artifacts} />
      {:catch error}
        <span>Error {String(error)}</span>
      {/await}
    </div>
  {/snippet}
</NavPage>


