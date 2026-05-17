export type ProcessorType = 'filter_version' | 'filter_attribute' | 'addtag' | 'replace' | 'regexreplace' | 'transform';

export interface ProcessorBase {
  id: string;
  type: ProcessorType;
  order: number;
}

export interface FilterVersionProcessor extends ProcessorBase {
  type: 'filter_version';
  mode: string;
  versions: string;
}

export interface FilterAttributeRule {
  path: string;
  type: string;
  value: string;
}

export interface FilterAttributeProcessor extends ProcessorBase {
  type: 'filter_attribute';
  mode: string;
  operation: string;
  rules: FilterAttributeRule[];
}

export interface AddTagTag {
  key: string;
  value: string;
}

export interface AddTagProcessor extends ProcessorBase {
  type: 'addtag';
  tags: AddTagTag[];
}

export interface ReplaceTarget {
  find: string;
  field: string;
  replace: string;
}

export interface ReplaceProcessor extends ProcessorBase {
  type: 'replace';
  force_marshal: boolean;
  targets: ReplaceTarget[];
}

export interface RegexReplaceTarget {
  find: string;
  replace: string;
}

export interface RegexReplaceProcessor extends ProcessorBase {
  type: 'regexreplace';
  force_marshal: boolean;
  targets: RegexReplaceTarget[];
}

export interface TransformProcessor extends ProcessorBase {
  type: 'transform';
  contentType: string;
  acceptUnknownNamespace: boolean;
  templates: string;
}

export type AnyProcessor = FilterVersionProcessor | FilterAttributeProcessor | AddTagProcessor | ReplaceProcessor | RegexReplaceProcessor | TransformProcessor;
