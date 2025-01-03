"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertToUserTimezone = void 0;
const luxon_1 = require("luxon");
/**
 * Converts a datetime from one timezone to another
 * @param date - Date object or ISO string
 * @param time - Time string in 24-hour format (HH:mm:ss)
 * @param fromZone - Source timezone (IANA timezone identifier)
 * @param toZone - Target timezone (IANA timezone identifier)
 * @returns Formatted time string in target timezone (HH:mm) or error message
 */
const convertToUserTimezone = (date, time, fromZone, toZone) => {
    try {
        console.log('Converting:', date, time, fromZone, toZone);
        // Handle Date object or ISO string
        const baseDate = date instanceof Date
            ? luxon_1.DateTime.fromJSDate(date, { zone: fromZone })
            : luxon_1.DateTime.fromISO(date, { zone: fromZone });
        if (!baseDate.isValid) {
            throw new Error(`Invalid date: ${date}`);
        }
        // Parse the time components
        const [hours, minutes, seconds] = time.split(':').map(Number);
        // Set the time components on the base date
        const dateTime = baseDate.set({
            hour: hours,
            minute: minutes,
            second: seconds || 0
        });
        if (!dateTime.isValid) {
            throw new Error(`Invalid time: ${time}`);
        }
        // Convert to target timezone and format the output
        const convertedTime = dateTime.setZone(toZone);
        if (!convertedTime.isValid) {
            throw new Error('Conversion failed');
        }
        return convertedTime.toFormat('HH:mm');
    }
    catch (error) {
        console.error('Time conversion error:', error);
        return error instanceof Error ? error.message : 'Invalid DateTime';
    }
};
exports.convertToUserTimezone = convertToUserTimezone;
