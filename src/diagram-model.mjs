// Stable public API for existing saved-work consumers and tests.
// Domain modules have no DOM access and can run independently in Node.
export {
  DIAGRAM_TASKS,
  getDiagramTask,
  emptyDiagram,
  parseDiagram,
} from "./diagram-data.mjs";
export { diagramRoutes, reviewDiagram } from "./diagram-review.mjs";
export { wrapDiagramText, exportDiagramSvg } from "./diagram-export.mjs";
