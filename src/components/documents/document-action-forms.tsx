import { archiveDocumentAction, deleteDocumentAction, reprocessDocumentAction } from "@/app/actions/documents";
import { Button } from "@/components/ui/button";
import type { LibraryDocumentStatus } from "@/lib/types/documents";

type DocumentActionFormsProps = {
  allowDelete?: boolean;
  className?: string;
  documentId: string;
  status: LibraryDocumentStatus;
  workspaceId: string;
  workspaceSlug: string;
};

function HiddenFields({
  documentId,
  workspaceId,
  workspaceSlug,
}: Pick<DocumentActionFormsProps, "documentId" | "workspaceId" | "workspaceSlug">) {
  return (
    <>
      <input name="documentId" type="hidden" value={documentId} />
      <input name="workspaceId" type="hidden" value={workspaceId} />
      <input name="workspaceSlug" type="hidden" value={workspaceSlug} />
    </>
  );
}

export function DocumentActionForms({
  allowDelete = false,
  className,
  documentId,
  status,
  workspaceId,
  workspaceSlug,
}: DocumentActionFormsProps) {
  return (
    <div className={className}>
      {status !== "archived" ? (
        <form action={reprocessDocumentAction}>
          <HiddenFields
            documentId={documentId}
            workspaceId={workspaceId}
            workspaceSlug={workspaceSlug}
          />
          <Button size="sm" type="submit" variant="secondary">
            Queue reprocess
          </Button>
        </form>
      ) : null}

      {status !== "archived" ? (
        <form action={archiveDocumentAction}>
          <HiddenFields
            documentId={documentId}
            workspaceId={workspaceId}
            workspaceSlug={workspaceSlug}
          />
          <Button size="sm" type="submit" variant="ghost">
            Archive
          </Button>
        </form>
      ) : null}

      {allowDelete ? (
        <form action={deleteDocumentAction}>
          <HiddenFields
            documentId={documentId}
            workspaceId={workspaceId}
            workspaceSlug={workspaceSlug}
          />
          <Button
            className="border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 hover:text-rose-800"
            size="sm"
            type="submit"
            variant="ghost"
          >
            Delete
          </Button>
        </form>
      ) : null}
    </div>
  );
}
