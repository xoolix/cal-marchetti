// The payment-failure page must not reuse /api/cancel: that route emails the attendee and wipes attendees.
import { BookingStatus } from "@prisma/client";
import { NextApiRequest, NextApiResponse } from "next";

import { asStringOrNull } from "@lib/asStringOrNull";
import prisma from "@lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).end();
  }

  const uid = asStringOrNull(req.body.uid) || "";

  const booking = await prisma.booking.findUnique({
    where: { uid },
    select: { id: true, paid: true, status: true, payment: { select: { id: true } } },
  });

  if (!booking) {
    return res.status(404).json({ message: "Booking not found" });
  }

  if (booking.paid || booking.payment.length === 0) {
    return res.status(400).json({ message: "Only unpaid bookings can be released" });
  }

  if (booking.status !== BookingStatus.CANCELLED) {
    await prisma.booking.update({
      where: { id: booking.id },
      data: { status: BookingStatus.CANCELLED, cancellationReason: "Pago no completado" },
    });
  }

  return res.status(200).json({ message: "Booking released" });
}
