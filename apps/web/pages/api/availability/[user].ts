import { Prisma } from "@prisma/client";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import type { NextApiRequest, NextApiResponse } from "next";

import { asStringOrNull } from "@lib/asStringOrNull";
import { getWorkingHours } from "@lib/availability";
import getBusyTimes from "@lib/getBusyTimes";
import prisma from "@lib/prisma";

dayjs.extend(utc);
dayjs.extend(timezone);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = asStringOrNull(req.query.user);
  const dateFrom = dayjs(asStringOrNull(req.query.dateFrom));
  const dateTo = dayjs(asStringOrNull(req.query.dateTo));
  const eventTypeId = typeof req.query.eventTypeId === "string" ? parseInt(req.query.eventTypeId) : undefined;

  if (!dateFrom.isValid() || !dateTo.isValid()) {
    return res.status(400).json({ message: "Invalid time range given." });
  }

  const rawUser = await prisma.user.findUnique({
    where: {
      username: user as string,
    },
    select: {
      credentials: true,
      timeZone: true,
      bufferTime: true,
      availability: true,
      id: true,
      startTime: true,
      endTime: true,
      selectedCalendars: true,
      schedules: {
        select: {
          availability: true,
          timeZone: true,
          id: true,
        },
      },
      defaultScheduleId: true,
    },
  });

  const getEventType = (id: number) =>
    prisma.eventType.findUnique({
      where: { id },
      select: {
        seatsPerTimeSlot: true,
        timeZone: true,
        schedule: {
          select: {
            availability: true,
            timeZone: true,
          },
        },
        availability: {
          select: {
            startTime: true,
            endTime: true,
            days: true,
          },
        },
      },
    });

  type EventType = Prisma.PromiseReturnType<typeof getEventType>;
  let eventType: EventType | null = null;
  if (eventTypeId) eventType = await getEventType(eventTypeId);

  if (!rawUser) throw new Error("No user found");

  const { selectedCalendars, ...currentUser } = rawUser;

  const busyTimes = await getBusyTimes({
    credentials: currentUser.credentials,
    startTime: dateFrom.format(),
    endTime: dateTo.format(),
    userId: currentUser.id,
    selectedCalendars,
  });

  const bufferedBusyTimes = busyTimes.map((a) => ({
    start: dayjs(a.start).subtract(currentUser.bufferTime, "minute"),
    end: dayjs(a.end).add(currentUser.bufferTime, "minute"),
  }));

  const schedule = eventType?.schedule
    ? { ...eventType?.schedule }
    : {
        ...currentUser.schedules.filter(
          (schedule) => !currentUser.defaultScheduleId || schedule.id === currentUser.defaultScheduleId
        )[0],
      };

  const timeZone = schedule.timeZone || eventType?.timeZone || currentUser.timeZone;

  const workingHours = getWorkingHours(
    {
      timeZone,
    },
    schedule.availability ||
      (eventType?.availability.length ? eventType.availability : currentUser.availability)
  );

  /* Current logic is if a booking is in a time slot mark it as busy, but seats can have more than one attendee so grab
  current bookings with a seats event type and display them on the calendar, even if they are full */
  let currentSeats;
  if (eventType?.seatsPerTimeSlot) {
    currentSeats = await prisma.booking.findMany({
      where: {
        eventTypeId: eventTypeId,
        startTime: {
          gte: dateFrom.format(),
          lte: dateTo.format(),
        },
      },
      select: {
        uid: true,
        startTime: true,
        _count: {
          select: {
            attendees: true,
          },
        },
      },
    });
  }

  res.status(200).json({
    busy: bufferedBusyTimes,
    timeZone,
    workingHours,
    currentSeats,
  });
}
