<script lang="ts">
  import type { Package } from '@podman-desktop/extension-grype-core-api/json-schema/syft';

  interface Props {
    object: Package;
  }

  let { object }: Props = $props();
</script>

<div class="flex flex-row items-center">
  <div class="flex flex-col overflow-hidden">
    <span class="text-[var(--pd-table-body-text)] font-semibold truncate" title={object.name}>{object.name}</span>
    {#if object.language}
      <span class="text-[var(--pd-table-body-secondary-text)] text-[10px] truncate">{object.language}</span>
    {/if}
  </div>
</div>
