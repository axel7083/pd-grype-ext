<script lang="ts">
import type { PageProps } from './$types';
import { providerConnectionsInfo } from '/@/stores/connections';
import { type ProviderContainerConnectionDetailedInfo } from '@podman-desktop/extension-grype-core-api';

let { data }: PageProps = $props();

// using the query parameters
let selectedContainerProviderConnection: ProviderContainerConnectionDetailedInfo | undefined = $derived(
  $providerConnectionsInfo.find(
    provider => provider.providerId === data.providerId && provider.name === data.connection,
  ),
);
</script>

<span>Hello world</span>
