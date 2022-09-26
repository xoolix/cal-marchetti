import type { NextApiRequest, NextApiResponse } from "next";

import { Prisma } from "@calcom/prisma/client";

import prisma from "@lib/prisma";

/**
 * @deprecated Use TRCP's viewer.me query
 */

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "PATCH") {
    try {
      const data = req.body;
      const id = Number(data);

      const updatePayment = await prisma.booking.findFirst({
        where: {
          id: id,
        },
      });
      const bookingData: Prisma.BookingUpdateInput = {
        paid: true,
        confirmed: true,
      };
      await prisma.booking.update({
        where: {
          id: updatePayment?.id,
        },
        data: bookingData,
      });
      return res.status(200).json({ message: "Las etiquetas fueron eliminadas" });
    } catch (e) {
      console.log(e);
      return res.status(400).json({ message: e });
    }
  }
}
