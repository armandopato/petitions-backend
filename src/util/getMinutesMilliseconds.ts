import { MINUTE_MILLISECONDS } from './Constants';

export function getMinutesMilliseconds(jwtTimeStr: string): number
{
    return +jwtTimeStr.slice(0, jwtTimeStr.length - 1) * MINUTE_MILLISECONDS;
}