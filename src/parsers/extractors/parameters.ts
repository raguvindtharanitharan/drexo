import type { FieldDataType, Parameter } from '../model.js';
import { toArray } from './_helpers.js';

/**
 * Extract workbook-level parameters.
 *
 * Tableau represents parameters as columns inside a special
 * datasource named `"Parameters"`. Each column may declare a current
 * value and an `<members>` list of allowable values.
 */
export function extractParameters(workbook: any): Parameter[] {
  const datasourcesRaw = workbook?.datasources?.datasource;
  if (!datasourcesRaw) return [];

  const parametersDs = toArray(datasourcesRaw).find((ds: any) => ds['@_name'] === 'Parameters');
  if (!parametersDs) return [];

  const columnsRaw = parametersDs.column;
  if (!columnsRaw) return [];

  return toArray(columnsRaw).map((col: any) => mapParameter(col));
}

function mapParameter(col: any): Parameter {
  const name: string = col['@_caption'] ?? col['@_name'] ?? '';
  const dataType = col['@_datatype'] as FieldDataType | undefined;
  const currentValue: string | undefined = col['@_value'];

  // param-domain-type: 'range' = slider, 'list' = dropdown/list, 'all' = free input
  const domainType: string | undefined = col['@_param-domain-type'];

  const membersRaw = col?.members?.member;
  const allowableValues = membersRaw
    ? toArray(membersRaw)
        .map((m: any) => m['@_value'] ?? '')
        .filter((v: string) => v.length > 0)
    : [];

  return {
    name,
    dataType,
    currentValue,
    allowableValues,
    controlType: normalizeParamDomainType(domainType),
  };
}

function normalizeParamDomainType(domainType: string | undefined): string | undefined {
  if (!domainType) return undefined;
  const map: Record<string, string> = {
    range: 'slider',
    list:  'dropdown',
    all:   'text-input',
  };
  return map[domainType] ?? domainType;
}
