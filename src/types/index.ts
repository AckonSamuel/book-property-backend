interface TimeSlot {
    id: number;
    start_time: string;
    end_time: string;
    duration: number;
}

interface UnavailableSlot {
    date: string;
    slot_id: number;
}

interface DayAvailability {
    date: string;
    is_available: boolean;
    available_slots: TimeSlot[];
}

export { TimeSlot, UnavailableSlot, DayAvailability };