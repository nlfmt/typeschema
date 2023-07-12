import type {TypeSchemaResolver} from '../resolver';
import type {AnySchema} from 'joi';

import {register} from '../registry';
import {ValidationError} from '../schema';
import {maybe} from '../utils';

interface JoiResolver extends TypeSchemaResolver {
  base: AnySchema<this['type']>;
  input: this['schema'] extends AnySchema<infer T> ? T : never;
  output: this['schema'] extends AnySchema<infer T> ? T : never;
  error: ValidationError;
}

declare global {
  export interface TypeSchemaRegistry {
    joi: JoiResolver;
  }
}

register<'joi'>(
  async schema => {
    const Joi = await maybe(() => import('joi'));
    if (Joi == null) {
      return null;
    }
    if (!('_flags' in schema) || 'static' in schema) {
      return null;
    }
    return schema;
  },
  schema => ({
    validate: async data => {
      const result = schema.validate(data);
      if (result.error == null) {
        return {valid: true, value: result.value};
      }
      return {
        errors: result.error.details.map(
          ({message, path}) => new ValidationError(message, path),
        ),
        valid: false,
      };
    },
  }),
);
