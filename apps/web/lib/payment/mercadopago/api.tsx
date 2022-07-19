interface MPProps {
  successUrl: string;
  failureUrl: string;
  quantity: number;
  title: string;
  currency: string;
  unit_price: number;
}

export default async function mercadoPagoCall({
  successUrl,
  failureUrl,
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
      Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
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
        failure: failureUrl,
      },
      payment_methods: {
        excluded_payment_types: [{ id: "ticket" }, { id: "atm" }, { id: "prepaid_card" }],
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
