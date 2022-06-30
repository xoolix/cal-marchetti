import type { App } from "@calcom/types/App";

import _package from "./package.json";

export const metadata = {
  name: "MercadoPago",
  description: _package.description,
  type: "mercadopago_payment",
  imageSrc: "/api/app-store/mercadopagopayment/icon.svg",
  variant: "payment",
  logo: "/api/app-store/mercadopagopayment/icon.svg",
  publisher: "Cal.com",
  url: "https://www.mercadopago.com.ar",
  verified: true,
  rating: 5,
  reviews: 69,
  installed: !!(process.env.MP_ACCESS_TOKEN && process.env.MP_PUBLIC_KEY),
  category: "payment",
  slug: "mercadopago",
  title: "MercadoPago",
  trending: true,
  email: "help@cal.com",
} as App;

export default metadata;
