import { PaymentType } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";

import prisma from "@calcom/prisma";
import { CalendarEvent } from "@calcom/types/Calendar";

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
  }
) {
  const mercadoPagoResponse = await mercadoPagoCall();
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
      success: false,
      refunded: false,
      data: mercadoPagoResponse,
      externalId: mercadoPagoResponse.init_point,
      externalUri: mercadoPagoResponse.init_point,
    },
  });

  return mpPayment;
}
