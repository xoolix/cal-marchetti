import dayjs, { Dayjs } from "dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";
import timezone from "dayjs/plugin/timezone";
import toArray from "dayjs/plugin/toArray";
import utc from "dayjs/plugin/utc";
import { createEvent, DateArray, Person } from "ics";
import rrule from "rrule";

import { getAppName } from "@calcom/app-store/utils";
import { getCancelLink, getRichDescription } from "@calcom/lib/CalEventParser";
import type { CalendarEvent, RecurringEvent } from "@calcom/types/Calendar";

import BaseEmail from "@lib/emails/templates/_base-email";

import {
  emailBodyLogo,
  emailHead,
  emailScheduledBodyHeaderContent,
  emailSchedulingBodyDivider,
  emailSchedulingBodyHeader,
  linkIcon,
} from "./common";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(localizedFormat);
dayjs.extend(toArray);

export default class OrganizerScheduledEmail extends BaseEmail {
  calEvent: CalendarEvent;
  recurringEvent: RecurringEvent;

  constructor(calEvent: CalendarEvent, recurringEvent: RecurringEvent) {
    super();
    this.name = "SEND_BOOKING_CONFIRMATION";
    this.calEvent = calEvent;
    this.recurringEvent = recurringEvent;
  }

  protected getiCalEventAsString(): string | undefined {
    // Taking care of recurrence rule beforehand
    let recurrenceRule: string | undefined = undefined;
    if (this.recurringEvent?.count) {
      recurrenceRule = new rrule(this.recurringEvent).toString().replace("RRULE:", "");
    }
    const icsEvent = createEvent({
      start: dayjs(this.calEvent.startTime)
        .utc()
        .toArray()
        .slice(0, 6)
        .map((v, i) => (i === 1 ? v + 1 : v)) as DateArray,
      startInputType: "utc",
      productId: "calendso/ics",
      title: this.calEvent.organizer.language.translate("ics_event_title", {
        eventType: this.calEvent.type,
        name: this.calEvent.attendees[0].name,
      }),
      description: this.getTextBody(),
      duration: { minutes: dayjs(this.calEvent.endTime).diff(dayjs(this.calEvent.startTime), "minute") },
      organizer: { name: this.calEvent.organizer.name, email: this.calEvent.organizer.email },
      ...{ recurrenceRule },
      attendees: this.calEvent.attendees.map((attendee: Person) => ({
        name: attendee.name,
        email: attendee.email,
      })),
      status: "CONFIRMED",
    });
    if (icsEvent.error) {
      throw icsEvent.error;
    }
    return icsEvent.value;
  }

  protected getNodeMailerPayload(): Record<string, unknown> {
    const toAddresses = [this.calEvent.organizer.email];
    if (this.calEvent.team) {
      this.calEvent.team.members.forEach((member) => {
        const memberAttendee = this.calEvent.attendees.find((attendee) => attendee.name === member);
        if (memberAttendee) {
          toAddresses.push(memberAttendee.email);
        }
      });
    }

    return {
      icalEvent: {
        filename: "event.ics",
        content: this.getiCalEventAsString(),
      },
      from: `Cal.com <${this.getMailerOptions().from}>`,
      to: toAddresses.join(","),
      subject: `${this.calEvent.organizer.language.translate("confirmed_event_type_subject", {
        eventType: this.calEvent.type,
        name: this.calEvent.attendees[0].name,
        date: `${this.getOrganizerStart().format("h:mma")} - ${this.getOrganizerEnd().format(
          "h:mma"
        )}, ${this.calEvent.organizer.language.translate(
          this.getOrganizerStart().format("dddd").toLowerCase()
        )}, ${this.calEvent.organizer.language.translate(
          this.getOrganizerStart().format("MMMM").toLowerCase()
        )} ${this.getOrganizerStart().format("D")}, ${this.getOrganizerStart().format("YYYY")}`,
      })}`,
      html: this.getHtmlBody(),
      text: this.getTextBody(),
    };
  }

  protected getTextBody(): string {
    return `
${this.calEvent.organizer.language.translate(
  this.recurringEvent?.count ? "new_event_scheduled_recurring" : "new_event_scheduled"
)}
${this.calEvent.organizer.language.translate("emailed_you_and_any_other_attendees")}

${getRichDescription(this.calEvent)}
`.trim();
  }

  protected getHtmlBody(): string {
    const headerContent = this.calEvent.organizer.language.translate("confirmed_event_type_subject", {
      eventType: this.calEvent.type,
      name: this.calEvent.attendees[0].name,
      date: `${this.getOrganizerStart().format("h:mma")} - ${this.getOrganizerEnd().format(
        "h:mma"
      )}, ${this.calEvent.organizer.language.translate(
        this.getOrganizerStart().format("dddd").toLowerCase()
      )}, ${this.calEvent.organizer.language.translate(
        this.getOrganizerStart().format("MMMM").toLowerCase()
      )} ${this.getOrganizerStart().format("D")}, ${this.getOrganizerStart().format("YYYY")}`,
    });

    return `
    <!doctype html>
    <html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
    ${emailHead(headerContent)}
    <body style="word-spacing:normal;background-color:#F5F5F5;">
      <div style="background-color:#F5F5F5;">
        ${emailSchedulingBodyHeader("cal-logo")}
        ${emailScheduledBodyHeaderContent(
          this.calEvent.organizer.language.translate(
            this.recurringEvent?.count ? "new_event_scheduled_recurring" : "new_event_scheduled"
          ),
          this.calEvent.organizer.language.translate("")
        )}
        ${emailSchedulingBodyDivider()}
        <!--[if mso | IE]></td></tr></table><table align="center" border="0" cellpadding="0" cellspacing="0" class="" style="width:600px;" width="600" bgcolor="#FFFFFF" ><tr><td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;"><![endif]-->
        <div style="background:#FFFFFF;background-color:#FFFFFF;margin:0px auto;max-width:600px;">
          <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background:#FFFFFF;background-color:#FFFFFF;width:100%;">
            <tbody>
              <tr>
                <td style="border-left:1px solid #E1E1E1;border-right:1px solid #E1E1E1;direction:ltr;font-size:0px;padding:0px;text-align:center;">
                  <!--[if mso | IE]><table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr><td class="" style="vertical-align:top;width:598px;" ><![endif]-->
                  <div class="mj-column-per-100 mj-outlook-group-fix" style="font-size:0px;text-align:left;direction:ltr;display:inline-block;vertical-align:top;width:100%;">
                    <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="vertical-align:top;" width="100%">
                      <tbody>
                        <tr>
                          <td align="left" style="font-size:0px;padding:10px 25px;word-break:break-word;">
                            <div style="font-family:Roboto, Helvetica, sans-serif;font-size:16px;font-weight:500;line-height:1;text-align:left;color:#3E3E3E;">
                              ${this.getWhat()}
                              ${this.getWhen()}
                              ${this.getWho()}
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <!--[if mso | IE]></td></tr></table><![endif]-->
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        ${emailSchedulingBodyDivider()}
        <!--[if mso | IE]></td></tr></table><table align="center" border="0" cellpadding="0" cellspacing="0" class="" style="width:600px;" width="600" bgcolor="#FFFFFF" ><tr><td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;"><![endif]-->
        <div style="background:#FFFFFF;background-color:#FFFFFF;margin:0px auto;max-width:600px;">
          <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background:#FFFFFF;background-color:#FFFFFF;width:100%;">
            <tbody>
              <tr>
                <td style="border-bottom:1px solid #E1E1E1;border-left:1px solid #E1E1E1;border-right:1px solid #E1E1E1;direction:ltr;font-size:0px;padding:0px;text-align:center;">
                  <!--[if mso | IE]><table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr><td class="" style="vertical-align:top;width:598px;" ><![endif]-->
                  <div class="mj-column-per-100 mj-outlook-group-fix" style="font-size:0px;text-align:left;direction:ltr;display:inline-block;vertical-align:top;width:100%;">
                    <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="vertical-align:top;" width="100%">
                      <tbody>
                        <tr>
                          <td align="left" style="font-size:0px;padding:10px 25px;word-break:break-word;">
                            <div style="font-family:Roboto, Helvetica, sans-serif;font-size:16px;font-weight:500;line-height:0px;text-align:left;color:#3E3E3E;">
                              ${this.getManageLink()}
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <!--[if mso | IE]></td></tr></table><![endif]-->
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <!--[if mso | IE]></td></tr></table><![endif]-->
      </div>
    </body>
    </html>
    `;
  }

  protected getManageLink(): string {
    const manageText = this.calEvent.organizer.language.translate("manage_this_event");
    return `<p>${this.calEvent.organizer.language.translate(
      "need_to_reschedule_or_cancel"
    )}</p><p style="font-weight: 400; line-height: 24px;"><a href="${getCancelLink(
      this.calEvent
    )}" style="color: #3E3E3E;" alt="${manageText}">${manageText}</a></p>`;
  }

  protected getWhat(): string {
    return `
    <div style="line-height: 6px;">
      <p style="color: #494949;">${this.calEvent.organizer.language.translate("what")}</p>
      <p style="color: #494949; font-weight: 400; line-height: 24px;">${this.calEvent.type}</p>
    </div>`;
  }

  protected getRecurringWhen(): string {
    if (this.recurringEvent?.freq) {
      return ` - ${this.calEvent.attendees[0].language.translate("every_for_freq", {
        freq: this.calEvent.attendees[0].language.translate(
          `${rrule.FREQUENCIES[this.recurringEvent.freq].toString().toLowerCase()}`
        ),
      })} ${this.recurringEvent.count} ${this.calEvent.attendees[0].language.translate(
        `${rrule.FREQUENCIES[this.recurringEvent.freq].toString().toLowerCase()}`,
        { count: this.recurringEvent.count }
      )}`;
    } else {
      return "";
    }
  }

  protected getWhen(): string {
    return `
    <p style="height: 6px"></p>
    <div style="line-height: 6px;">
      <p style="color: #494949;">${this.calEvent.organizer.language.translate("when")}${
      this.recurringEvent?.count ? this.getRecurringWhen() : ""
    }</p>
      <p style="color: #494949; font-weight: 400; line-height: 24px;">
      ${this.recurringEvent?.count ? `${this.calEvent.attendees[0].language.translate("starting")} ` : ""}
      ${this.calEvent.organizer.language.translate(
        this.getOrganizerStart().format("dddd").toLowerCase()
      )}, ${this.calEvent.organizer.language.translate(
      this.getOrganizerStart().format("MMMM").toLowerCase()
    )} ${this.getOrganizerStart().format("D")}, ${this.getOrganizerStart().format(
      "YYYY"
    )} | ${this.getOrganizerStart().format("h:mma")} - ${this.getOrganizerEnd().format(
      "h:mma"
    )} <span style="color: #888888">(${this.getTimezone()})</span>
      </p>
    </div>`;
  }

  protected getWho(): string {
    const attendees = this.calEvent.attendees
      .map((attendee) => {
        return `<div style="color: #494949; font-weight: 400; line-height: 24px;">${
          attendee?.name || `${this.calEvent.organizer.language.translate("guest")}`
        } <span style="color: #888888"><a href="mailto:${attendee.email}" style="color: #888888;">${
          attendee.email
        }</a></span></div>`;
      })
      .join("");

    const organizer = `<div style="color: #494949; font-weight: 400; line-height: 24px;">${
      this.calEvent.organizer.name
    } - ${this.calEvent.organizer.language.translate(
      "organizer"
    )} <span style="color: #888888"><a href="mailto:${
      this.calEvent.organizer.email
    }" style="color: #888888;">${this.calEvent.organizer.email}</a></span></div>`;

    return `
    <p style="height: 6px"></p>
    <div style="line-height: 6px;">
      <p style="color: #494949;">${this.calEvent.organizer.language.translate("who")}</p>
      ${organizer + attendees}
    </div>`;
  }

  protected getAdditionalNotes(): string {
    if (!this.calEvent.additionalNotes) return "";
    return `
    <p style="height: 6px"></p>
    <div style="line-height: 6px;">
      <p style="color: #494949;">${this.calEvent.organizer.language.translate("additional_notes")}</p>
      <p style="color: #494949; font-weight: 400; line-height: 24px; white-space: pre-wrap;">${
        this.calEvent.additionalNotes
      }</p>
    </div>
    `;
  }

  protected getCustomInputs(): string {
    const { customInputs } = this.calEvent;
    if (!customInputs) return "";
    const customInputsString = Object.keys(customInputs)
      .map((key) => {
        if (customInputs[key] !== "") {
          return `
          <p style="height: 6px"></p>
          <div style="line-height: 6px;">
            <p style="color: #494949;">${key}</p>
            <p style="color: #494949; font-weight: 400;">
              ${customInputs[key]}
            </p>
          </div>
        `;
        }
      })
      .join("");

    return customInputsString;
  }

  protected getDescription(): string {
    if (!this.calEvent.description) return "";
    return `
    <p style="height: 6px"></p>
    <div style="line-height: 6px;">
      <p style="color: #494949;">${this.calEvent.organizer.language.translate("description")}</p>
      <p style="color: #494949; font-weight: 400; line-height: 24px; white-space: pre-wrap;">${
        this.calEvent.description
      }</p>
    </div>
    `;
  }

  protected getLocation(): string {
    let providerName = this.calEvent.location && getAppName(this.calEvent.location); // This returns null if nothing is found

    if (this.calEvent.location && this.calEvent.location.includes("integrations:")) {
      const location = this.calEvent.location.split(":")[1];
      providerName = location[0].toUpperCase() + location.slice(1);
    }

    // If location its a url, probably we should be validating it with a custom library
    if (this.calEvent.location && /^https?:\/\//.test(this.calEvent.location)) {
      providerName = this.calEvent.location;
    }

    if (this.calEvent.videoCallData) {
      const meetingId = this.calEvent.videoCallData.id;
      const meetingPassword = this.calEvent.videoCallData.password;
      const meetingUrl = this.calEvent.videoCallData.url;
      return `
      <p style="height: 6px"></p>
      <div style="line-height: 6px;">
        <p style="color: #494949;">${this.calEvent.organizer.language.translate("where")}</p>
        <p style="color: #494949; font-weight: 400; line-height: 24px;">${providerName}
        ${
          meetingUrl &&
          `<a href="${meetingUrl}" target="_blank" alt="${this.calEvent.organizer.language.translate(
            "meeting_url"
          )}"><img src="${linkIcon()}" width="12px"/></a>`
        }</p>
        ${
          meetingId &&
          `<div style="color: #494949; font-weight: 400; line-height: 24px;">${this.calEvent.organizer.language.translate(
            "meeting_id"
          )}: <span>${meetingId}</span></div>`
        }
        ${
          meetingPassword &&
          `<div style="color: #494949; font-weight: 400; line-height: 24px;">${this.calEvent.organizer.language.translate(
            "meeting_password"
          )}: <span>${meetingPassword}</span></div>`
        }
        ${
          meetingUrl &&
          `<div style="color: #494949; font-weight: 400; line-height: 24px;">${this.calEvent.organizer.language.translate(
            "meeting_url"
          )}: <a href="${meetingUrl}" alt="${this.calEvent.organizer.language.translate(
            "meeting_url"
          )}" style="color: #3E3E3E" target="_blank">${meetingUrl}</a></div>`
        }
      </div>
      `;
    }

    if (this.calEvent.additionInformation?.hangoutLink) {
      const hangoutLink: string = this.calEvent.additionInformation.hangoutLink;
      return `
      <p style="height: 6px"></p>
      <div style="line-height: 6px;">
        <p style="color: #494949;">${this.calEvent.organizer.language.translate("where")}</p>
        <p style="color: #494949; font-weight: 400; line-height: 24px;">${providerName} ${
        hangoutLink &&
        `<a href="${hangoutLink}" target="_blank" alt="${this.calEvent.organizer.language.translate(
          "meeting_url"
        )}"><img src="${linkIcon()}" width="12px"></img></a>`
      }</p>
        <div style="color: #494949; font-weight: 400; line-height: 24px;"><a href="${hangoutLink}" alt="${this.calEvent.organizer.language.translate(
        "meeting_url"
      )}" style="color: #3E3E3E" target="_blank">${hangoutLink}</a></div>
      </div>
      `;
    }

    return `
    <p style="height: 6px"></p>
    <div style="line-height: 6px;">
      <p style="color: #494949;">${this.calEvent.organizer.language.translate("where")}</p>
      <p style="color: #494949; font-weight: 400; line-height: 24px;">${
        providerName || this.calEvent.location
      }</p>
      ${
        providerName === "Zoom" || providerName === "Google"
          ? `<p style="color: #494949; font-weight: 400; line-height: 24px;">
              ${this.calEvent.organizer.language.translate("meeting_url_provided_after_confirmed")}
              </p>`
          : ``
      }
    </div>
    `;
  }

  protected getTimezone(): string {
    return this.calEvent.organizer.timeZone;
  }

  protected getOrganizerStart(): Dayjs {
    return dayjs(this.calEvent.startTime).tz(this.getTimezone());
  }

  protected getOrganizerEnd(): Dayjs {
    return dayjs(this.calEvent.endTime).tz(this.getTimezone());
  }

  protected getReason(): string {
    return `
    <div style="line-height: 6px; margin-bottom: 24px;">
      <p style="color: #494949;">${this.calEvent.attendees[0].language.translate("reschedule_reason")}</p>
      <p style="color: #494949; font-weight: 400; line-height: 24px;">${this.calEvent.cancellationReason}</p>
    </div>`;
  }
}
