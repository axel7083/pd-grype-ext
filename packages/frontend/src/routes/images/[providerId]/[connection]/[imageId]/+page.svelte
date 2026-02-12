<script lang="ts">
  import { Button } from '@podman-desktop/ui-svelte';
  import type { PageProps } from './$types';
  import { syftAPI } from '/@/api/client';
  import { providerConnectionsInfo } from '/@store/connections';

  let { data }: PageProps = $props();

  let connection = $derived(
    $providerConnectionsInfo.find((connection) => connection.providerId === data.connection.providerId && connection.name === data.connection.name)
  );

  async function analyse(): Promise<void> {
    if(!connection) return;

    await syftAPI.analyse({ connection, imageId: data.imageId });
  }
</script>

<ul>
  <li>{data.connection.providerId}</li>
  <li>{data.connection.name}</li>
  <li>{data.imageId}</li>
  <li>Found {connection?.name}</li>
</ul>

<Button onclick={analyse}>Analyse</Button>
