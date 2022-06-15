import { PaymentType } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";

import prisma from "@calcom/prisma";
import { CalendarEvent } from "@calcom/types/Calendar";

import llamadaMP from "@lib/payment/mercadopago/api";

export async function handlePayment(
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
  }
) {
  const payment = await prisma.payment.create({
    data: {
      type: PaymentType.MERCADOPAGO,
      uid: uuidv4(),
      booking: {
        connect: {
          id: booking.id,
        },
      },
      amount: selectedEventType.price,
      currency: selectedEventType.currency,
      success: false,
      refunded: false,
      data: respuestaMP,
      externalUri: respuestaMP.init_point,
    },
  });

  return payment;
}
