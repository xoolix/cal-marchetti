import type { NextApiRequest, NextApiResponse } from "next";

import prisma from "@calcom/prisma";

/**
 * This is an example endpoint for an app, these will run under `/api/integrations/[...args]`
 * @param req
 * @param res
 */

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    await prisma.credential.create({
      data: {
        type: "mercadopago_payment",
        key: {},
        userId: req.session?.user?.id,
        appId: "mercadopago",
      },
    });

    res.redirect("/apps/installed");
  }
}
