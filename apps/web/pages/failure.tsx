import { GetServerSidePropsContext } from "next";
import Link from "next/link";
import React from "react";

import { Button } from "@calcom/ui";

import prisma from "@lib/prisma";
import { inferSSRProps } from "@lib/types/inferSSRProps";

import { HeadSeo } from "@components/seo/head-seo";

function PlaceholderFailure(props: inferSSRProps<typeof getServerSideProps>) {
  const data = props?.payment?.data;
  const link = data?.init_point;
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
              Puede volver a realizar el pago desde este botón
              <br />
              <Link href={link}>
                <Button className="mt-3">Pagar</Button>
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
  const id = parseInt(queryId);

  const payment = await prisma.payment.findFirst({
    where: {
      bookingId: id,
    },
    select: {
      data: true,
    },
  });

  return {
    props: { payment },
  };
};
export default PlaceholderFailure;
