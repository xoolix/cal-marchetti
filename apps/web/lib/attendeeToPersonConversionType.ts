import { Attendee } from "@prisma/client";
import { TFunction } from "next-i18next";

import { Person } from "@calcom/types/Calendar";

export const attendeeToPersonConversionType = (attendees: Attendee[], t: TFunction): Person[] => {
  return attendees.map((attendee) => {
    return {
      name: attendee.name,
      email: attendee.email,
      timeZone: attendee.timeZone,
      locale: attendee.locale || "es",
      language: { translate: t, locale: attendee.locale || "es" },
    };
  });
};
