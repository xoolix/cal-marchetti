import { PaymentType } from "@prisma/client";
import { EventType } from "@prisma/client";
import dayjs from "dayjs";
import { stringify } from "querystring";
import { v4 as uuidv4 } from "uuid";

import prisma from "@calcom/prisma";
import { CalendarEvent } from "@calcom/types/Calendar";

import { sendAwaitingPaymentEmail, sendScheduledEmails } from "@lib/emails/email-manager";
import mercadoPagoCall from "@lib/payment/mercadopago/api";

export async function handlePaymentMP(
  evt: CalendarEvent,
  selectedEventType: {
    price: number;
    currency: string;
  },
  booking: {
    user: { email: string | null; name: string | null; timeZone: string } | null;
    id: number;
    startTime: { toISOString: () => string };
    uid: string;
    eventType: EventType | null;
  }
) {
  const params: { [k: string]: any } = {
    date: booking.startTime.toISOString(),
    type: booking.eventType?.id,
    eventSlug: booking.eventType?.slug,
    user: booking?.user?.email,
    email: booking?.user?.email,
    name: booking?.user?.name,
    eventName: booking.eventType?.eventName || "",
    location: evt.location,
    bookingId: booking.id,
    recur: evt.recurrence,
  };
  const query = stringify(params);

  const successUrl = `${process.env.MP_REDIRECT_URL}/success?${query}`;
  const failureUrl = `${process.env.MP_REDIRECT_URL}/failure?${query}`;

  //Fecha y hora
  const fecha = String(dayjs(booking.startTime.toISOString()).format("DD-MM-YY"));
  const hora = String(dayjs(booking.startTime.toISOString()).format("HH:mm"));

  //Preference
  const mercadoPagoResponse = await mercadoPagoCall({
    successUrl,
    failureUrl,
    quantity: 1,
    title: `Turno con Matías Marchetti | ${fecha} ${hora} hrs`,
    currency: selectedEventType.currency,
    unit_price: Math.trunc(selectedEventType.price / 100),
  });
  const mpPayment = await prisma.payment.create({
    data: {
      type: PaymentType.MERCADOPAGO,
      uid: uuidv4(),
      booking: {
        connect: {
          id: booking.id,
        },
      },
      amount: selectedEventType.price,
      fee: 0,
      currency: selectedEventType.currency,
      success: true,
      refunded: false,
      data: mercadoPagoResponse,
      externalId: mercadoPagoResponse.init_point,
      externalUri: mercadoPagoResponse.init_point,
    },
  });

  await sendAwaitingPaymentEmail({
    ...evt,
    paymentInfo: {
      link: mpPayment.externalUri,
    },
  });

  return mpPayment;
}
