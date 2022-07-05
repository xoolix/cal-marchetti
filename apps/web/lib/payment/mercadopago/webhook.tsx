import prisma, { bookingMinimalSelect } from "@calcom/prisma";
import { Prisma } from "@calcom/prisma/client";

export async function handlePaymentSuccess(event: any) {
  const paymentIntent = event.data.object;
  const payment = await prisma.payment.findFirst({
    where: {
      externalId: paymentIntent.id,
    },
    select: {
      id: true,
      bookingId: true,
    },
  });
  if (!payment?.bookingId) {
    if (!payment?.bookingId) throw new Error("Payment not found");

    const booking = await prisma.booking.findUnique({
      where: {
        id: payment.bookingId,
      },
      select: {
        ...bookingMinimalSelect,
        confirmed: true,
        location: true,
        eventTypeId: true,
        userId: true,
        uid: true,
        paid: true,
        destinationCalendar: true,
        user: {
          select: {
            id: true,
            credentials: true,
            timeZone: true,
            email: true,
            name: true,
            locale: true,
            destinationCalendar: true,
          },
        },
      },
    });
    if (!booking) throw new Error("No booking found");
    const bookingData: Prisma.BookingUpdateInput = {
      paid: true,
      confirmed: true,
    };
    const bookingUpdate = prisma.booking.update({
      where: {
        id: booking.id,
      },
      data: bookingData,
    });
  }
}
