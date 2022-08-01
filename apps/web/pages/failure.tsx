import { GetServerSidePropsContext } from "next";
import Link from "next/link";
import React from "react";

import { bookingMinimalSelect } from "@calcom/prisma";
import { Prisma } from "@calcom/prisma/client";
import { CalendarEvent } from "@calcom/types/Calendar";
import { Button } from "@calcom/ui";

import { sendAwaitingPaymentEmail } from "@lib/emails/email-manager";
import prisma from "@lib/prisma";
import { inferSSRProps } from "@lib/types/inferSSRProps";

import { HeadSeo } from "@components/seo/head-seo";

function PlaceholderFailure(props: inferSSRProps<typeof getServerSideProps>) {
  const data = props?.payment?.data as Prisma.JsonObject;
  const link = data.init_point as string;

  return (
    <>
      <HeadSeo title="Error en el pago" description="" nextSeoProps={{}} />
      <div className="min-h-screen bg-white px-4" data-testid="404-page">
        <main className="mx-auto max-w-xl pt-16 pb-6 sm:pt-24">
          <div className="text-center">
            <img
              src="/LogoMR.png"
              alt="Logo Marchetti Rules"
              style={{ height: "50px", margin: "auto", marginBottom: "30px" }}
            />
            <p className="text-sm font-semibold uppercase tracking-wide text-black">¡Disculpe!</p>
            <h1 className="font-cal mt-2 text-4xl font-extrabold text-gray-900 sm:text-5xl">
              Hubo un problema en el pago
            </h1>
            <span className="mt-2 inline-block text-lg">
              Puede volver a realizar el pago o reintentar sacar el turno
              <br />
              <Link href={link}>
                <Button className="mt-3">Pagar</Button>
              </Link>
              <Link href={props.returnUrl}>
                <Button color="secondary" className="mt-5 ml-5">
                  Reintentar
                </Button>
              </Link>
            </span>
          </div>
        </main>
      </div>
    </>
  );
}

export const getServerSideProps = async (context: GetServerSidePropsContext) => {
  const queryId = context.query.bookingId;
  const id = Number(queryId);

  const eventSlug = context.query.eventSlug;
  const returnUrl = `${process.env.MP_REDIRECT_URL}/marchettirules/${eventSlug}`;

  const payment = await prisma.payment.findFirst({
    where: {
      bookingId: id,
    },
    select: {
      data: true,
    },
  });

  const user = await prisma.booking.findFirst({
    where: {
      id: id,
    },
    select: {
      ...bookingMinimalSelect,
      userId: true,
      user: {
        select: {
          id: true,
          credentials: true,
          email: true,
          timeZone: true,
          name: true,
          destinationCalendar: true,
        },
      },
      location: true,
      references: {
        select: {
          uid: true,
          type: true,
          externalCalendarId: true,
        },
      },
      payment: true,
      paid: true,
      eventType: {
        select: {
          title: true,
        },
      },
      uid: true,
      eventTypeId: true,
      destinationCalendar: true,
    },
  });

  return {
    props: { payment, returnUrl },
  };
};
export default PlaceholderFailure;
