import type { NextApiRequest, NextApiResponse } from "next";

// SDK de Mercado Pago
const mercadopago = require("mercadopago");
// Agrega credenciales
mercadopago.configure({
  access_token: "TEST-7753364614567769-060310-0ffa8c901c4018965e617fd7ba889fb5-380284170",
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Crea un objeto de preferencia
  let preference = {
    items: [
      {
        title: "Turno",
        unit_price: 100,
        quantity: 1,
      },
    ],
    back_urls: {
      success: "https://xoolix.com/",
      failure: "https://xoolix.com/",
      pending: "https://xoolix.com/",
    },
    auto_return: "approved",
  };

  mercadopago.preferences
    .create(preference)
    .then(function (res: any) {
      res.json({
        id: res.body.id,
      });
    })
    .catch(function (error: any) {
      console.log(error);
    });

  console.log(res);
}
