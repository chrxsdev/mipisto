import {
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  isBefore,
  startOfMonth,
  startOfWeek,
  subMonths,
  subWeeks,
} from 'date-fns';
import { es } from 'date-fns/locale';

const dateOnlyPattern = /^(\d{4})-(\d{2})-(\d{2})$/;

export function getMonthRange(month: number, year: number) {
  const start = startOfMonth(new Date(year, month - 1, 1));
  const end = endOfMonth(start);

  return { start, end };
}

export function getCurrentCycleRange(cutOffDay: number, now = new Date()) {
  const currentMonthCutOff = withSafeDay(startOfMonth(now), cutOffDay);
  const cycleStart = isBefore(now, currentMonthCutOff)
    ? withSafeDay(startOfMonth(subMonths(now, 1)), cutOffDay)
    : currentMonthCutOff;
  const cycleEnd = addMonths(cycleStart, 1);

  return { cycleStart, cycleEnd };
}

export function getWeeklyRange() {
  const end = endOfWeek(new Date(), { weekStartsOn: 1 });
  const start = startOfWeek(subWeeks(end, 11), { weekStartsOn: 1 });

  return { start, end };
}

export function getAnnualRange() {
  const currentYear = new Date().getFullYear();
  return {
    start: new Date(currentYear - 1, 0, 1),
    end: new Date(currentYear, 11, 31, 23, 59, 59, 999),
  };
}

export function formatMonthYear(date: Date) {
  const value = format(date, 'MMMM yyyy', { locale: es });
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function withSafeDay(baseDate: Date, day: number) {
  const end = endOfMonth(baseDate).getDate();
  return new Date(
    baseDate.getFullYear(),
    baseDate.getMonth(),
    Math.min(day, end),
  );
}

export function getCreditExpenseSchedule(
  expenseDate: Date,
  cutOffDay: number,
  paymentDueDay: number,
) {
  const expenseMonthStart = startOfMonth(expenseDate);
  const expenseMonthCutOff = withSafeDay(expenseMonthStart, cutOffDay);
  const statementBaseDate =
    expenseDate.getTime() >= expenseMonthCutOff.getTime()
      ? addMonths(expenseMonthStart, 1)
      : expenseMonthStart;
  const statementCloseDate = withSafeDay(statementBaseDate, cutOffDay);
  const paymentDate = withSafeDay(
    addMonths(statementBaseDate, 1),
    paymentDueDay,
  );

  return {
    appliedMonth: statementBaseDate.getMonth() + 1,
    appliedYear: statementBaseDate.getFullYear(),
    appliedMonthLabel: formatMonthYear(statementBaseDate),
    statementCloseDate,
    paymentDate,
    paymentMonthLabel: formatMonthYear(paymentDate),
  };
}

export function parseCalendarDate(value: unknown) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return new Date(
      Date.UTC(
        value.getUTCFullYear(),
        value.getUTCMonth(),
        value.getUTCDate(),
        12,
      ),
    );
  }

  if (typeof value !== 'string') {
    return value;
  }

  const directMatch = value.match(dateOnlyPattern);

  if (directMatch) {
    return new Date(
      Date.UTC(
        Number(directMatch[1]),
        Number(directMatch[2]) - 1,
        Number(directMatch[3]),
        12,
      ),
    );
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Date(
    Date.UTC(
      parsed.getUTCFullYear(),
      parsed.getUTCMonth(),
      parsed.getUTCDate(),
      12,
    ),
  );
}
