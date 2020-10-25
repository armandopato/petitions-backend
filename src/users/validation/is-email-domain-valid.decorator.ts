import {
    registerDecorator,
    ValidationOptions,
    ValidatorConstraint,
    ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint()
export class IsEmailDomainValidConstraint implements ValidatorConstraintInterface
{
    validate(email: string): boolean
    {
        if (!email) return false;
        const domain = email.split("@")[1];
        return  domain === "unam.mx"  ||  domain === "comunidad.unam.mx";
    }

	defaultMessage(): string
	{
		return "Invalid email";
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