export type PropertyType = 'string' | 'integer' | 'number' | 'object' | 'array' | 'boolean';

export interface SchemaProperty {
  type: PropertyType;
  description?: string;
  enum?: string[];
  pattern?: string;
  minLength?: number;
  maxLength?: number;
  format?: string;
  properties?: Record<string, SchemaProperty>;
  required?: string[];
  additionalProperties?: boolean;
}

export interface JsonSchema {
  $schema: string;
  type: string;
  title: string;
  description: string;
  additionalProperties: boolean;
  properties: Record<string, SchemaProperty>;
  required: string[];
}
