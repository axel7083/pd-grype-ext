<script lang="ts">
import type { Package } from '@podman-desktop/extension-grype-core-api/json-schema/syft';

interface Props {
  object: Package;
}

let { object }: Props = $props();

let licenses = $derived(object.licenses?.map(l => l.value).join(', ') ?? '');
</script>

<div class="flex flex-row items-center overflow-hidden">
  <span class="text-[var(--pd-table-body-text)] text-xs truncate" title={licenses}>{licenses}</span>
</div>
