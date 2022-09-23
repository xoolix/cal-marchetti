import {
  BanIcon,
  CheckIcon,
  ClockIcon,
  InboxInIcon,
  LocationMarkerIcon,
  PaperAirplaneIcon,
  PencilAltIcon,
  XIcon,
} from "@heroicons/react/outline";
import { RefreshIcon } from "@heroicons/react/solid";
import { BookingStatus } from "@prisma/client";
import dayjs from "dayjs";
import { useRouter } from "next/router";
import { useState } from "react";
import { useMutation } from "react-query";
import { Frequency as RRuleFrequency } from "rrule";

import { isPrismaObjOrUndefined } from "@calcom/lib";
import classNames from "@calcom/lib/classNames";
import { useLocale } from "@calcom/lib/hooks/useLocale";
import showToast from "@calcom/lib/notification";
import { CalendarEvent, Person } from "@calcom/types/Calendar";
import { Alert } from "@calcom/ui/Alert";
import Button from "@calcom/ui/Button";
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader } from "@calcom/ui/Dialog";
import { Tooltip } from "@calcom/ui/Tooltip";
import { TextArea } from "@calcom/ui/form/fields";

import { attendeeToPersonConversionType } from "@lib/attendeeToPersonConversionType";
import { HttpError } from "@lib/core/http/error";
import useMeQuery from "@lib/hooks/useMeQuery";
import { LocationType } from "@lib/location";
import { parseRecurringDates } from "@lib/parseDate";
import { inferQueryInput, inferQueryOutput, trpc } from "@lib/trpc";

import { EditLocationDialog } from "@components/dialog/EditLocationDialog";
import { RescheduleDialog } from "@components/dialog/RescheduleDialog";
import TableActions, { ActionType } from "@components/ui/TableActions";

type BookingListingStatus = inferQueryInput<"viewer.bookings">["status"];

type BookingItem = inferQueryOutput<"viewer.bookings">["bookings"][number];

type BookingItemProps = BookingItem & {
  listingStatus: BookingListingStatus;
  recurringCount?: number;
};

function BookingListItem(booking: BookingItemProps) {
  // Get user so we can determine 12/24 hour format preferences
  const query = useMeQuery();
  const user = query.data;
  const { t, i18n } = useLocale();
  const utils = trpc.useContext();
  const router = useRouter();
  const [rejectionReason, setRejectionReason] = useState<string>("");
  const [rejectionDialogIsOpen, setRejectionDialogIsOpen] = useState(false);
  const mutation = useMutation(
    async (confirm: boolean) => {
      let body = {
        id: booking.id,
        confirmed: confirm,
        language: i18n.language,
        reason: rejectionReason,
      };
      /**
       * Only pass down the recurring event id when we need to confirm the entire series, which happens in
       * the "Upcoming" tab, to support confirming discretionally in the "Recurring" tab.
       */
      if (booking.listingStatus === "upcoming" && booking.recurringEventId !== null) {
        body = Object.assign({}, body, { recurringEventId: booking.recurringEventId });
      }
      const res = await fetch("/api/book/confirm", {
        method: "PATCH",
        body: JSON.stringify(body),
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (!res.ok) {
        throw new HttpError({ statusCode: res.status });
      }
      setRejectionDialogIsOpen(false);
    },
    {
      async onSettled() {
        await utils.invalidateQueries(["viewer.bookings"]);
      },
    }
  );
  const isUpcoming = new Date(booking.endTime) >= new Date();
  const isCancelled = booking.status === BookingStatus.CANCELLED;

  const evt: CalendarEvent = {
    type: booking?.title,
    title: booking?.title,
    description: booking?.description || "",
    startTime: booking?.startTime,
    endTime: booking?.endTime,
    customInputs: isPrismaObjOrUndefined(booking?.customInputs),
    organizer: {
      email: "contacto@marchettirules.com",
      name: "MarchettiRules",
      timeZone: "America/Buenos_Aires",
      language: { translate: t, locale: user?.locale ?? "es" },
    },
    attendees: attendeeToPersonConversionType(booking?.attendees, t),
    uid: booking?.uid,
    destinationCalendar: null,
  };

  const id = booking?.id;
  const pendingActions: ActionType[] = [
    {
      id: "reject",
      label:
        booking.listingStatus === "upcoming" && booking.recurringEventId !== null
          ? t("reject_all")
          : t("reject"),
      onClick: () => {
        setRejectionDialogIsOpen(true);
      },
      icon: BanIcon,
      disabled: mutation.isLoading,
    },
    {
      id: "confirm",
      label:
        booking.listingStatus === "upcoming" && booking.recurringEventId !== null
          ? t("confirm_all")
          : t("confirm"),
      onClick: () => {
        mutation.mutate(true);
      },
      icon: CheckIcon,
      disabled: mutation.isLoading,
      color: "primary",
    },
  ];

  const bookedActions: ActionType[] = [
    {
      id: "cancel",
      label: t("cancel"),
      href: `/cancel/${booking.uid}`,
      icon: XIcon,
    },
    {
      id: "edit_booking",
      label: t("edit_booking"),
      icon: PencilAltIcon,
      actions: [
        {
          id: "reenviar-email",
          label: "Reenviar email",
          icon: InboxInIcon,
          onClick: async () => {
            const res = await fetch("/api/reSendEmail", {
              method: "POST",
              body: JSON.stringify(evt),
              headers: {
                "Content-Type": "application/json",
              },
            });
            if (!res.ok) {
              console.log("Something went wrong");
            } else {
              showToast("Email reenviado", "success");
            }
            return res.json();
          },
        },
        {
          id: "quitar-etiquetas",
          label: "Quitar etiquetas",
          icon: XIcon,
          onClick: async () => {
            const res = await fetch("/api/quitarEtiquetas", {
              body: JSON.stringify(id),
              headers: {
                "Content-Type": "application/json",
              },
              method: "PATCH",
            });
            if (!res.ok) {
              console.log("Something went wrong");
            } else {
              showToast("Las etiquetas fueron quitadas", "success");
            }
            return res.json();
          },
        },
        {
          id: "reschedule",
          icon: ClockIcon,
          label: t("reschedule_booking"),
          href: `/reschedule/${booking.uid}`,
        },
        {
          id: "reschedule_request",
          icon: PaperAirplaneIcon,
          iconClassName: "rotate-45 w-[18px] -ml-[2px]",
          label: t("send_reschedule_request"),
          onClick: () => {
            setIsOpenRescheduleDialog(true);
          },
        },
        {
          id: "change_location",
          label: t("edit_location"),
          onClick: () => {
            setIsOpenLocationDialog(true);
          },
          icon: LocationMarkerIcon,
        },
      ],
    },
  ];

  const RequestSentMessage = () => {
    return (
      <div className="ml-1 mr-8 flex text-gray-500" data-testid="request_reschedule_sent">
        <PaperAirplaneIcon className="-mt-[1px] w-4 rotate-45" />
        <p className="ml-2 ">{t("reschedule_request_sent")}</p>
      </div>
    );
  };

  const startTime = dayjs(booking.startTime).format(isUpcoming ? "ddd, D MMM" : "D MMMM YYYY");
  const [isOpenRescheduleDialog, setIsOpenRescheduleDialog] = useState(false);
  const [isOpenSetLocationDialog, setIsOpenLocationDialog] = useState(false);
  const setLocationMutation = trpc.useMutation("viewer.bookings.editLocation", {
    onSuccess: () => {
      showToast(t("location_updated"), "success");
      setIsOpenLocationDialog(false);
      utils.invalidateQueries("viewer.bookings");
    },
  });

  const saveLocation = (newLocationType: LocationType, details: { [key: string]: string }) => {
    let newLocation = newLocationType as string;
    if (
      newLocationType === LocationType.InPerson ||
      newLocationType === LocationType.Link ||
      newLocationType === LocationType.UserPhone
    ) {
      newLocation = details[Object.keys(details)[0]];
    }
    setLocationMutation.mutate({ bookingId: booking.id, newLocation });
  };

  // Calculate the booking date(s)
  let recurringStrings: string[] = [];
  if (booking.recurringCount && booking.eventType.recurringEvent?.freq !== null) {
    [recurringStrings] = parseRecurringDates(
      {
        startDate: booking.startTime,
        recurringEvent: booking.eventType.recurringEvent,
        recurringCount: booking.recurringCount,
      },
      i18n
    );
  }

  const onClick = () => {
    router.push({
      pathname: "/success",
      query: {
        date: booking.startTime,
        type: booking.eventType.id,
        eventSlug: booking.eventType.slug,
        user: user?.username || "",
        name: booking.attendees[0] ? booking.attendees[0].name : undefined,
        email: booking.attendees[0] ? booking.attendees[0].email : undefined,
        location: booking.location
          ? booking.location.includes("integration")
            ? (t("web_conferencing_details_to_follow") as string)
            : booking.location
          : "",
        eventName: booking.eventType.eventName || "",
        bookingId: booking.id,
        recur: booking.recurringEventId,
        reschedule: booking.confirmed,
        listingStatus: booking.listingStatus,
        status: booking.status,
      },
    });
  };
  return (
    <>
      <RescheduleDialog
        isOpenDialog={isOpenRescheduleDialog}
        setIsOpenDialog={setIsOpenRescheduleDialog}
        bookingUId={booking.uid}
      />
      <EditLocationDialog
        booking={booking}
        saveLocation={saveLocation}
        isOpenDialog={isOpenSetLocationDialog}
        setShowLocationModal={setIsOpenLocationDialog}
      />

      {/* NOTE: Should refactor this dialog component as is being rendered multiple times */}
      <Dialog open={rejectionDialogIsOpen} onOpenChange={setRejectionDialogIsOpen}>
        <DialogContent>
          <DialogHeader title={t("rejection_reason_title")} />

          <p className="-mt-4 text-sm text-gray-500">{t("rejection_reason_description")}</p>
          <p className="mt-6 mb-2 text-sm font-bold text-black">
            {t("rejection_reason")}
            <span className="font-normal text-gray-500"> (Optional)</span>
          </p>
          <TextArea
            name={t("rejection_reason")}
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            className="mb-5 sm:mb-6"
          />

          <DialogFooter>
            <DialogClose>
              <Button color="secondary">{t("cancel")}</Button>
            </DialogClose>

            <Button
              disabled={mutation.isLoading}
              onClick={() => {
                mutation.mutate(false);
              }}>
              {t("rejection_confirmation")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <tr className="flex hover:bg-neutral-50">
        <td
          className="hidden whitespace-nowrap align-top ltr:pl-6 rtl:pr-6 sm:table-cell sm:w-56"
          onClick={onClick}>
          <div className="cursor-pointer py-4">
            <div className="text-sm leading-6 text-gray-900">{startTime}</div>
            <div className="text-sm text-gray-500">
              {dayjs(booking.startTime).format(user && user.timeFormat === 12 ? "h:mma" : "HH:mm")} -{" "}
              {dayjs(booking.endTime).format(user && user.timeFormat === 12 ? "h:mma" : "HH:mm")}
            </div>
            <div className="text-sm text-gray-400">
              {booking.recurringCount &&
                booking.eventType?.recurringEvent?.freq &&
                booking.listingStatus === "upcoming" && (
                  <div className="underline decoration-gray-400 decoration-dashed underline-offset-2">
                    <div className="flex">
                      <Tooltip
                        content={recurringStrings.map((aDate, key) => (
                          <p key={key}>{aDate}</p>
                        ))}>
                        <p className="text-gray-600 dark:text-white">
                          <RefreshIcon className="mr-1 -mt-1 inline-block h-4 w-4 text-gray-400" />
                          {`${t("every_for_freq", {
                            freq: t(
                              `${RRuleFrequency[booking.eventType.recurringEvent.freq]
                                .toString()
                                .toLowerCase()}`
                            ),
                          })} ${booking.recurringCount} ${t(
                            `${RRuleFrequency[booking.eventType.recurringEvent.freq]
                              .toString()
                              .toLowerCase()}`,
                            { count: booking.recurringCount }
                          )}`}
                        </p>
                      </Tooltip>
                    </div>
                  </div>
                )}
            </div>
          </div>
        </td>
        <td
          className={"flex-1 ltr:pl-4 rtl:pr-4" + (booking.rejected ? " line-through" : "")}
          onClick={onClick}>
          <div className="cursor-pointer py-4">
            <div className="sm:hidden">
              {!booking.confirmed && !booking.rejected && (
                <Tag className="mb-2 ltr:mr-2 rtl:ml-2">{t("unconfirmed")}</Tag>
              )}
              {!!booking?.eventType?.price && !booking.paid && (
                <Tag className="mb-2 ltr:mr-2 rtl:ml-2">Pending payment</Tag>
              )}
              <div className="text-sm font-medium text-gray-900">
                {startTime}:{" "}
                <small className="text-sm text-gray-500">
                  {dayjs(booking.startTime).format("HH:mm")} - {dayjs(booking.endTime).format("HH:mm")}
                </small>
              </div>
            </div>
            <div
              title={booking.title}
              className={classNames(
                "max-w-56 truncate text-sm font-medium leading-6 text-neutral-900 md:max-w-max",
                isCancelled ? "line-through" : ""
              )}>
              {booking.eventType?.team && <strong>{booking.eventType.team.name}: </strong>}
              {booking.title}
              {!!booking?.eventType?.price && !booking.paid && (
                <Tag className="hidden ltr:ml-2 rtl:mr-2 sm:inline-flex">Pending payment</Tag>
              )}
              {!booking.confirmed && !booking.rejected && (
                <Tag className="hidden ltr:ml-2 rtl:mr-2 sm:inline-flex">{t("unconfirmed")}</Tag>
              )}
            </div>
            {booking.description && (
              <div
                className="max-w-52 md:max-w-96 truncate text-sm text-gray-500"
                title={booking.description}>
                &quot;{booking.description}&quot;
              </div>
            )}

            {booking.attendees.length !== 0 && (
              <a
                className="text-sm text-gray-900 hover:text-blue-500"
                href={"mailto:" + booking.attendees[0].email}
                onClick={(e) => e.stopPropagation()}>
                {booking.attendees[0].email}
              </a>
            )}
            {isCancelled && booking.rescheduled && (
              <div className="mt-2 inline-block text-left text-sm md:hidden">
                <RequestSentMessage />
              </div>
            )}
          </div>
        </td>

        <td className="whitespace-nowrap py-4 text-right text-sm font-medium ltr:pr-4 rtl:pl-4">
          {isUpcoming && !isCancelled ? (
            <>
              {!booking.confirmed && !booking.rejected && user!.id === booking.user!.id && (
                <TableActions actions={pendingActions} />
              )}
              {booking.confirmed && !booking.rejected && <TableActions actions={bookedActions} />}
              {!booking.confirmed && booking.rejected && (
                <div className="text-sm text-gray-500">{t("rejected")}</div>
              )}
            </>
          ) : null}
          {isCancelled && booking.rescheduled && (
            <div className="hidden h-full items-center md:flex">
              <RequestSentMessage />
            </div>
          )}
        </td>
      </tr>
    </>
  );
}

const Tag = ({ children, className = "" }: React.PropsWithChildren<{ className?: string }>) => {
  return (
    <span
      className={`inline-flex items-center rounded-sm bg-yellow-100 px-1.5 py-0.5 text-xs font-medium text-yellow-800 ${className}`}>
      {children}
    </span>
  );
};

export default BookingListItem;
