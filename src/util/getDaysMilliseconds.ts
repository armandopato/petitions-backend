import { DAY_MILLISECONDS } from './Constants';

export function getDaysMilliseconds(jwtTimeStr: string): number
{
    return +jwtTimeStr.slice(0, jwtTimeStr.length - 1) * DAY_MILLISECONDS;
}