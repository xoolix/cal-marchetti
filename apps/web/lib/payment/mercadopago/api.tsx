/**
 * This is an example endpoint for an app, these will run under `/api/integrations/[...args]`
 * @param req
 * @param res
 */

export default async function mercadoPagoCall() {
  //Data de MP
  const data = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer TEST-7753364614567769-060310-0ffa8c901c4018965e617fd7ba889fb5-380284170`,
    },
    body: JSON.stringify({
      items: [
        {
          title: "Turno",
          quantity: 1,
          currency_id: "ARS",
          unit_price: 1000,
        },
      ],
      auto_return: "approved",
      back_urls: {
        success: "https://xoolix.com/",
        pending: "https://xoolix.com/",
        failure: "https://xoolix.com/",
      },
    }),
  };
  //API
  const res = await fetch("https://api.mercadopago.com/checkout/preferences", data);
  const mercadoPagoData = res.json();
  if (res.ok) {
    return Promise.resolve(mercadoPagoData);
  } else {
    return res.text().then((text) => {
      throw new Error(text);
    });
  }
}
