<script lang="ts">
  import type { Package } from '@podman-desktop/extension-grype-core-api/json-schema/syft';

  interface Props {
    packages: Package[]
  }

  let { packages }: Props = $props();
</script>

<span>Artifacts</span>
<ul>
  {#each packages as pack (pack.id)}
    <li>{pack.name} - {pack.version}</li>
  {/each}
</ul>
