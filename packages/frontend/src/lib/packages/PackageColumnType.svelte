<script lang="ts">
  import type { Package } from '@podman-desktop/extension-grype-core-api/json-schema/syft';

  interface Props {
    object: Package;
  }

  let { object }: Props = $props();
</script>

<div class="flex flex-row items-center">
  <span class="bg-[var(--pd-label-bg)] text-[var(--pd-label-text)] px-2 py-0.5 rounded text-[10px] uppercase font-bold">{object.type}</span>
</div>
