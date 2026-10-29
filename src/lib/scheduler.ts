export type Employee = {
  id: string;
  name: string;
  position: string;
  hours_per_week: number;
  employment_type: string;
  color: string | null;
};

export type Absence = {
  employee_id: string;
  start_date: string;
  end_date: string;
};

export type BusinessSettings = {
  open_time: string;
  close_time: string;
  open_days: number[];
  min_employees_per_shift: number;
};

export type GeneratedShift = {
  employee_id: string;
  date: string;
  start_time: string;
  end_time: string;
  position: string | null;
};

function getDatesInRange(startDate: Date, endDate: Date): Date[] {
  const dates: Date[] = [];
  const current = new Date(startDate);
  while (current <= endDate) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

function isAbsent(employeeId: string, date: Date, absences: Absence[]): boolean {
  const dateStr = date.toISOString().split("T")[0];
  return absences.some(
    (a) =>
      a.employee_id === employeeId &&
      dateStr >= a.start_date &&
      dateStr <= a.end_date
  );
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60).toString().padStart(2, "0");
  const m = (minutes % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

export function generateSchedule(
  employees: Employee[],
  absences: Absence[],
  settings: BusinessSettings,
  weekStart: Date,
  weekEnd: Date
): GeneratedShift[] {
  const shifts: GeneratedShift[] = [];
  const dates = getDatesInRange(weekStart, weekEnd);

  // Track hours assigned per employee this week
  const assignedHours: Record<string, number> = {};
  employees.forEach((e) => (assignedHours[e.id] = 0));

  const shiftDurationMinutes =
    timeToMinutes(settings.close_time) - timeToMinutes(settings.open_time);
  const shiftHours = shiftDurationMinutes / 60;

  for (const date of dates) {
    const dayOfWeek = date.getDay();
    if (!settings.open_days.includes(dayOfWeek)) continue;

    const dateStr = date.toISOString().split("T")[0];

    // Available employees for this day
    const available = employees.filter(
      (e) => !isAbsent(e.id, date, absences)
    );

    if (available.length === 0) continue;

    // Sort by least hours assigned so far (fairest distribution)
    const sorted = [...available].sort((a, b) => {
      const aRatio = assignedHours[a.id] / a.hours_per_week;
      const bRatio = assignedHours[b.id] / b.hours_per_week;
      return aRatio - bRatio;
    });

    // Assign required minimum, plus anyone who still needs hours
    const toAssign = sorted.filter((e) => {
      const ratio = assignedHours[e.id] / e.hours_per_week;
      return ratio < 1.0;
    });

    // Always assign at least min_employees_per_shift
    const assigned = toAssign.slice(0, Math.max(settings.min_employees_per_shift, toAssign.length));

    for (const emp of assigned) {
      if (assignedHours[emp.id] + shiftHours > emp.hours_per_week * 1.1) continue;

      shifts.push({
        employee_id: emp.id,
        date: dateStr,
        start_time: settings.open_time,
        end_time: settings.close_time,
        position: emp.position,
      });
      assignedHours[emp.id] += shiftHours;
    }
  }

  return shifts;
}
