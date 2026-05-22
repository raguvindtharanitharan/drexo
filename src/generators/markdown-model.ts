/**
 * Public entry point for the markdown generator stage.
 *
 * Takes a `TableauWorkbook` model (produced by the parser) and
 * returns the canonical markdown+YAML representation defined in
 * `docs/schema/workbook-model.md`.
 *
 * The output is a single string ready to write to `<name>.model.md`.
 */

import type { TableauWorkbook } from '../parsers/model.js';
import {
  renderCalculations,
  renderDashboards,
  renderDataSources,
  renderExecutiveSummary,
  renderFields,
  renderFiltersParametersActions,
  renderHeader,
  renderMetadataSection,
  renderNotes,
  renderVisualEncodings,
  renderWorksheets,
} from './markdown/sections.js';

export function generateMarkdownModel(workbook: TableauWorkbook): string {
  const parts = [
    renderHeader(workbook),
    renderMetadataSection(workbook.metadata),
    renderExecutiveSummary(workbook.executiveSummary),
    renderDataSources(workbook.dataSources),
    renderFields(workbook.fields),
    renderWorksheets(workbook.worksheets),
    renderVisualEncodings(workbook.visualEncodings),
    renderDashboards(workbook.dashboards),
    renderFiltersParametersActions(workbook.filters, workbook.parameters, workbook.actions),
    renderCalculations(workbook.calculations),
    renderNotes(workbook.notes),
  ];
  return parts.join('\n');
}
