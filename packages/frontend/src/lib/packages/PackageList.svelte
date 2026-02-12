<script lang="ts">
import type { Package } from '@podman-desktop/extension-grype-core-api/json-schema/syft';
import { Table, TableColumn, TableSimpleColumn, TableRow } from '@podman-desktop/ui-svelte';
import PackageColumnName from './PackageColumnName.svelte';
import PackageColumnType from './PackageColumnType.svelte';
import PackageColumnLicenses from './PackageColumnLicenses.svelte';

interface Props {
  packages: Package[]
  searchTerm: string;
}

let { packages, searchTerm }: Props = $props();

let filtered = $derived(
  searchTerm.length > 1 ? packages.filter((pack) => pack.name.toLowerCase().includes(searchTerm.toLowerCase())) : packages,
);

const columns = [
  new TableColumn<Package>('Name', {
    width: '1fr',
    renderer: PackageColumnName,
    comparator: (a: Package, b: Package): number => a.name.localeCompare(b.name),
  }),
  new TableColumn<Package, string>('Version', {
    renderMapping: (pkg: Package): string => pkg.version,
    renderer: TableSimpleColumn,
    comparator: (a: Package, b: Package): number => a.version.localeCompare(b.version),
  }),
  new TableColumn<Package>('Type', {
    renderer: PackageColumnType,
    width: '120px',
    comparator: (a: Package, b: Package): number => a.type.localeCompare(b.type),
  }),
  new TableColumn<Package>('Licenses', {
    renderer: PackageColumnLicenses,
  }),
];

const row = new TableRow<Package>({});

const key = (pkg: Package): string => pkg.id;
const label = (pkg: Package): string => pkg.name;
</script>

<Table
  kind="package"
  data={filtered}
  columns={columns}
  row={row}
  {key}
  {label} />
