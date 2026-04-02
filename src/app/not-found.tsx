import Link from "next/link";

import { buttonStyles } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Container } from "@/components/ui/container";
import { SparkIcon } from "@/components/ui/icons";
import { asRoute } from "@/lib/utils/as-route";

export default function NotFound() {
  return (
    <Container className="flex min-h-[72vh] items-center py-16">
      <EmptyState
        actions={
          <Link className={buttonStyles({ size: "lg", variant: "accent" })} href={asRoute("/")}>
            Return home
          </Link>
        }
        description="The route you requested does not map to a page in the current product shell."
        eyebrow="404"
        icon={<SparkIcon />}
        title="This page does not exist."
      />
    </Container>
  );
}
