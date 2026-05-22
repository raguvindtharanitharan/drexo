import type {
  DataSource,
  DataSourceType,
  Field,
  FieldDataType,
  FieldRole,
} from '../model.js';
import { toArray } from './_helpers.js';

/**
 * Extract data sources and their columns (fields).
 *
 * Tableau represents fields as `<column>` elements directly under
 * each `<datasource>`. The special `Parameters` datasource holds
 * workbook-level parameters.
 */
export function extractDataSources(workbook: any): DataSource[] {
  const datasourcesRaw = workbook?.datasources?.datasource;
  if (!datasourcesRaw) return [];

  return toArray(datasourcesRaw)
    .filter((ds: any) => ds['@_name']) // skip internal/anonymous references
    .map((ds: any) => mapDataSource(ds));
}

function mapDataSource(ds: any): DataSource {
  const name: string = ds['@_name'];
  const caption: string | undefined = ds['@_caption'];

  const columnsRaw = ds.column;
  const fields: Field[] = columnsRaw ? toArray(columnsRaw).map((c: any) => mapField(c)) : [];

  return {
    name,
    caption,
    type: inferType(ds, name),
    connectionType: undefined,    // v0.2+: read from <connection>
    connectionDetails: undefined, // v0.2+
    tables: [],                   // v0.2+
    fields,
  };
}

function mapField(col: any): Field {
  const name: string = col['@_name'];
  const caption: string | undefined = col['@_caption'];
  const role = col['@_role'] as FieldRole | undefined;
  const dataType = col['@_datatype'] as FieldDataType | undefined;
  const defaultAggregation: string | undefined =
    col['@_default-aggregation'] ?? undefined;

  const isCalculated = !!col.calculation;
  const formula: string | undefined = col.calculation?.['@_formula'];

  const field: Field = {
    name,
    caption,
    role,
    dataType,
    folder: undefined,        // v0.2+: walk <folder> hierarchy
    defaultAggregation,
    description: undefined,   // v0.2+: read <desc>
  };

  if (isCalculated) {
    field.calculation = {
      isCalculated: true,
      formula,
    };
  }

  return field;
}

function inferType(ds: any, name: string): DataSourceType {
  if (name === 'Parameters') return 'parameters';
  if (ds['@_inline'] === 'true' || ds['@_hasconnection'] === 'false') return 'extract';
  const connectionClass = ds?.connection?.['@_class'];
  if (connectionClass) return 'live';
  return 'other';
}
