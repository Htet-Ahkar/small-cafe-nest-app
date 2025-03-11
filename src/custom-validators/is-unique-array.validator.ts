import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

export function IsUniqueArray(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'IsUniqueArray',
      target: object.constructor,
      propertyName,
      constraints: [],
      options: validationOptions,
      validator: {
        validate(value: any, _args: ValidationArguments) {
          if (!Array.isArray(value)) return false; // Ensure value is an array
          return new Set(value).size === value.length; // Ensure uniqueness
        },
        defaultMessage(): string {
          return 'Array should not contain duplicate values';
        },
      },
    });
  };
}
