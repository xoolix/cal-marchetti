import type { NextApiRequest, NextApiResponse } from "next";

import { isPrismaObjOrUndefined } from "@calcom/lib";
import { getTranslation } from "@calcom/lib/server/i18n";
import { CalendarEvent } from "@calcom/types/Calendar";
import { Person } from "@calcom/types/Calendar";

import { sendScheduledEmails } from "@lib/emails/email-manager";

/**
 * @deprecated Use TRCP's viewer.me query
 */

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    try {
      const data = req.body;

      const t = await getTranslation(data.locale ?? "es", "common");
      const attendeesListPromises: any = data.attendees.map(async (attendee: any) => {
        return {
          name: attendee.name,
          email: attendee.email,
          timeZone: attendee.timeZone,
          language: {
            translate: await getTranslation(attendee.locale ?? "es", "common"),
            locale: attendee.locale ?? "es",
          },
        };
      });

      const attendeesList = (await Promise.all(attendeesListPromises)) as Person[];

      const evt: CalendarEvent = {
        type: data.type,
        title: data.title,
        description: data.description || "",
        startTime: data.startTime,
        endTime: data.endTime || "",
        customInputs: isPrismaObjOrUndefined(data?.customInputs),
        organizer: {
          email: data.organizer.email || "",
          name: data.organizer.name || "",
          timeZone: "America/Buenos_Aires",
          language: { translate: t, locale: data?.organizer?.locale ?? "es" },
        },
        attendees: attendeesList,
        uid: data?.uid,
        destinationCalendar: null,
      };

      await sendScheduledEmails({ ...evt });

      return res.status(200).json({ evt });
    } catch (e) {
      console.log(e);
      return res.status(400).json({ message: e });
    }
  }
}
