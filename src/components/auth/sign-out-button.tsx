import { signOutAction } from "@/app/actions/auth";
import { buttonStyles } from "@/components/ui/button";

export function SignOutButton() {
  return (
    <form action={signOutAction}>
      <button className={buttonStyles({ size: "sm", variant: "secondary" })} type="submit">
        Sign out
      </button>
    </form>
  );
}
