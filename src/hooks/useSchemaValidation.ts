import { useState, useMemo, useEffect } from 'react';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import type { JsonSchema } from '../types/schema';

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

export const useSchemaValidation = (schemaText: string, payloadText: string) => {
  const [payloadValid, setPayloadValid] = useState<boolean>(true);
  const [payloadErrors, setPayloadErrors] = useState<string>('');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const validateSchemaObjectRule = (schemaObj: any): string | null => {
    let error: string | null = null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const checkObject = (obj: any, path: string) => {
      if (obj && obj.type === 'object') {
        if (!obj.required || obj.required.length === 0) {
          error = `Regra de Schema Inválida: O objeto '${path || 'root'}' DEVE possuir ao menos uma propriedade marcada como obrigatória (required).`;
          return;
        }
        if (obj.properties) {
          for (const key in obj.properties) {
            checkObject(obj.properties[key], path ? `${path}.${key}` : key);
            if (error) return;
          }
        }
      }
    };
    checkObject(schemaObj, '');
    return error;
  };

  const validatePayload = useMemo(() => {
    return (schemaObj: JsonSchema, payloadStr: string) => {
      const schemaRuleError = validateSchemaObjectRule(schemaObj);
      if (schemaRuleError) {
        setPayloadValid(false);
        setPayloadErrors(schemaRuleError);
        return;
      }

      try {
        const data = JSON.parse(payloadStr);
        const validate = ajv.compile(schemaObj);
        const valid = validate(data);
        
        if (valid) {
          setPayloadValid(true);
          setPayloadErrors('Payload válido!');
        } else {
          setPayloadValid(false);
          const errors = validate.errors?.map(e => {
            const path = e.instancePath ? `Em '${e.instancePath}': ` : '';
            if (e.keyword === 'additionalProperties') {
              return `${path}Propriedade não esperada no payload ('${e.params.additionalProperty}')`;
            }
            if (e.keyword === 'required') {
              return `${path}Falta a propriedade obrigatória ('${e.params.missingProperty}')`;
            }
            return `${path}${e.message}`;
          }).join(' | ') || 'Erro de validação';
          setPayloadErrors(errors);
        }
      } catch (e) {
        setPayloadValid(false);
        setPayloadErrors('JSON Inválido: ' + (e instanceof Error ? e.message : String(e)));
      }
    };
  }, []);

  const { schemaValid, parsedSchema } = useMemo(() => {
    try {
      const parsed = JSON.parse(schemaText);
      const schemaRuleError = validateSchemaObjectRule(parsed);
      return { schemaValid: !schemaRuleError, parsedSchema: parsed };
    } catch {
      return { schemaValid: false, parsedSchema: null };
    }
  }, [schemaText]);

  useEffect(() => {
    if (parsedSchema) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      validatePayload(parsedSchema, payloadText);
    }
  }, [parsedSchema, payloadText, validatePayload]);

  return { schemaValid, parsedSchema, payloadValid, payloadErrors };
};
