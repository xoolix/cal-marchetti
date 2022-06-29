interface MPProps {
  successUrl: string;
  quantity: number;
  title: string;
  currency: string;
  unit_price: number;
}

export default async function mercadoPagoCall({
  successUrl,
  quantity,
  title,
  currency = "ARS",
  unit_price,
}: MPProps) {
  //Data de MP
  const data = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer TEST-6458829229883871-042719-fea1ecda1083c71c70b46e8dae3c64e5-12299896`,
    },
    body: JSON.stringify({
      items: [
        {
          title,
          quantity,
          currency_id: currency,
          unit_price,
        },
      ],
      auto_return: "approved",
      //TODO: Cambiar urls pending y failure
      back_urls: {
        success: successUrl,
        pending: successUrl,
        failure: successUrl,
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
