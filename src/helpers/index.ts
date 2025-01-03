import { DateTime } from 'luxon';

const convertToUserTimezone = (date: string, time: string, fromZone: string, toZone: string): string => {
    const dateTime = DateTime.fromFormat(`${date} ${time}`, 'yyyy-MM-dd HH:mm', { zone: fromZone });
    return dateTime.setZone(toZone).toFormat('HH:mm');
};

export { convertToUserTimezone }