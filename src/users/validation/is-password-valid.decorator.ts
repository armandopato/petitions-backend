import {
    registerDecorator,
    ValidationOptions,
    ValidatorConstraint,
    ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint()
export class IsPasswordValidConstraint implements ValidatorConstraintInterface
{
    validate(password: string): boolean
    {
        if (!password) return false;
        const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[-_!@#$%^&*])/;
        return strongRegex.test(password);
    }
    
    defaultMessage(): string
    {
        return 'Invalid password';
    }
}

export function IsPasswordValid(validationOptions?: ValidationOptions)
{
    // eslint-disable-next-line @typescript-eslint/ban-types
    return function(object: Object, propertyName: string): void {
        registerDecorator({
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            constraints: [],
            validator: IsPasswordValidConstraint,
        });
    };
}