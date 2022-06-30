import React from "react";

function PlaceholderSuccess() {
  return (
    <>
      <div className="min-h-screen bg-white px-4" data-testid="404-page">
        <main className="mx-auto max-w-xl pt-16 pb-6 sm:pt-24">
          <div className="text-center">
            <img
              src="/LogoMR.png"
              alt="Logo Marchetti Rules"
              style={{ height: "50px", margin: "auto", marginBottom: "30px" }}
            />
            <p className="text-sm font-semibold uppercase tracking-wide text-black">¡Muchas gracias!</p>
            <h1 className="font-cal mt-2 text-4xl font-extrabold text-gray-900 sm:text-5xl">
              Su turno ya se encuentra agendado
            </h1>
            <span className="mt-2 inline-block text-lg">
              Los datos del mismo han sido enviados via
              <strong className="text-lgtext-green-500 mt-2 inline-block">&nbsp;email</strong>.
            </span>
          </div>
        </main>
      </div>
    </>
  );
}

export default PlaceholderSuccess;
