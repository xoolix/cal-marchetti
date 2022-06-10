import useAddAppMutation from "../../_utils/useAddAppMutation";
import { InstallAppButtonProps } from "../../types";

export default function InstallAppButton(props: InstallAppButtonProps) {
  // @ts-ignore TODO: deprecate App types in favor of DB slugs
  const mutation = useAddAppMutation("mercadopago_payment");
  return (
    <>
      {props.render({
        onClick() {
          mutation.mutate("");
        },
        loading: mutation.isLoading,
      })}
    </>
  );
}
