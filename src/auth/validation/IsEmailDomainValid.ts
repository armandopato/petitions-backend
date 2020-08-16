import { ValidatorConstraint, ValidatorConstraintInterface, registerDecorator, ValidationOptions } from "class-validator";

@ValidatorConstraint()
export class IsEmailDomainValidConstraint implements ValidatorConstraintInterface
{
    validate(email: string): boolean
    {
        const domain = email.split("@")[1];
        return  domain === "unam.mx"  ||  domain === "comunidad.unam.mx";
    }
}

export function IsEmailDomainValid(validationOptions?: ValidationOptions) {
    // eslint-disable-next-line @typescript-eslint/ban-types
    return function (object: Object, propertyName: string): void {
      registerDecorator({
        target: object.constructor,
        propertyName: propertyName,
        options: validationOptions,
        constraints: [],
        validator: IsEmailDomainValidConstraint,
      });
    };
  }