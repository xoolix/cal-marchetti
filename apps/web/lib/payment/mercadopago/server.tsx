import { PaymentType } from "@prisma/client";
import { EventType } from "@prisma/client";
import { stringify } from "querystring";
import { v4 as uuidv4 } from "uuid";

import prisma from "@calcom/prisma";
import { CalendarEvent } from "@calcom/types/Calendar";

import { sendAwaitingPaymentEmail } from "@lib/emails/email-manager";
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
  const successUrl = `http://localhost:3000/success?${query}`;

  //Preference
  const mercadoPagoResponse = await mercadoPagoCall(successUrl);
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
      link: {
        paymentUid: mpPayment.uid,
        name: booking.user?.name,
        email: booking.user?.email,
        date: booking.startTime.toISOString(),
      },
    },
  });

  return mpPayment;
}
