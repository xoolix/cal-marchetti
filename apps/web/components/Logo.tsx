export default function Logo({ small, icon }: { small?: boolean; icon?: boolean }) {
  return (
    <h1 className="inline">
      <strong>
        {icon ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            className="mx-auto w-9"
            alt="Logo #MarchettiRules"
            title="Logo #MarchettiRules"
            src="/LogoMR.png"
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            className={small ? "h-8 w-auto" : "h-7 w-auto"}
            alt="Logo #MarchettiRules"
            title="#MarchettiRules"
            src="/LogoMR.png"
          />
        )}
      </strong>
    </h1>
  );
}
