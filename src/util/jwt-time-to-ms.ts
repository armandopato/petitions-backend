import { DAY_MILLISECONDS, MINUTE_MILLISECONDS } from './constants';

export function getDaysMilliseconds(jwtTimeStr: string): number
{
    return +jwtTimeStr.slice(0, jwtTimeStr.length - 1) * DAY_MILLISECONDS;
}

export function getMinutesMilliseconds(jwtTimeStr: string): number
{
    return +jwtTimeStr.slice(0, jwtTimeStr.length - 1) * MINUTE_MILLISECONDS;
}