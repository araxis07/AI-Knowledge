import { ConversationComposer } from "@/components/conversations/conversation-composer";
import { ConversationList } from "@/components/conversations/conversation-list";
import { ConversationThreadMessage } from "@/components/conversations/conversation-thread-message";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ChatIcon, SparkIcon } from "@/components/ui/icons";
import { PageHeader } from "@/components/ui/page-header";
import { requireAuthenticatedUser } from "@/lib/auth";
import { parseConversationSearchParam } from "@/lib/validation/conversations";
import { formatConversationVisibilityLabel } from "@/lib/utils/workspace-labels";
import { requireWorkspaceAccess } from "@/lib/workspaces";
import {
  getAccessibleWorkspaceConversation,
  listWorkspaceConversationSummaries,
} from "@/server/conversations/workspace-conversations";

type ConversationsPageProps = {
  params: Promise<{
    workspaceSlug: string;
  }>;
  searchParams: Promise<{
    conversation?: string | string[];
  }>;
};

export default async function WorkspaceConversationsPage({
  params,
  searchParams,
}: ConversationsPageProps) {
  const { workspaceSlug } = await params;
  const resolvedSearchParams = await searchParams;
  const access = await requireWorkspaceAccess(workspaceSlug, "viewer");
  const user = await requireAuthenticatedUser(`/app/${workspaceSlug}/conversations`);
  const selectedConversationId = parseConversationSearchParam(
    resolvedSearchParams.conversation,
  );
  const [conversations, selectedConversation] = await Promise.all([
    listWorkspaceConversationSummaries(access.workspace.id, user.id),
    selectedConversationId
      ? getAccessibleWorkspaceConversation(access.workspace.id, selectedConversationId)
      : Promise.resolve(null),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <Badge className="border-teal-200 bg-teal-50 text-teal-700">
            Workspace: {access.workspace.name}
          </Badge>
        }
        description="Ask grounded questions inside this workspace, reopen previous threads, and inspect the exact supporting citations under every answer."
        eyebrow="AI Q&A"
        kicker={
          <>
            <Badge>{conversations.length} threads</Badge>
            <Badge>
              Default visibility:{" "}
              {formatConversationVisibilityLabel(
                access.workspace.settings.defaultConversationVisibility,
              )}
            </Badge>
            <Badge>Grounded citations only</Badge>
          </>
        }
        title={`Conversations in ${access.workspace.name}`}
      />

      <div className="grid gap-6 xl:grid-cols-[0.38fr_0.62fr]">
        <ConversationList
          conversations={conversations}
          selectedConversationId={selectedConversation?.id ?? null}
          workspaceSlug={access.workspace.slug}
        />

        <div className="space-y-6">
          {selectedConversation ? (
            <Card className="p-6 sm:p-7">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
                    {selectedConversation.title}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Follow-up questions stay in this thread so retrieval context and citations remain easy to review.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge>{formatConversationVisibilityLabel(selectedConversation.visibility)}</Badge>
                  <Badge className="border-slate-200 bg-slate-100 text-slate-700">
                    {selectedConversation.messages.length} message
                    {selectedConversation.messages.length === 1 ? "" : "s"}
                  </Badge>
                </div>
              </div>

              <div className="mt-6 grid gap-4">
                {selectedConversation.messages.map((message) => (
                  <ConversationThreadMessage
                    key={message.id}
                    message={message}
                    workspaceSlug={access.workspace.slug}
                  />
                ))}
              </div>
            </Card>
          ) : (
            <EmptyState
              actions={
                <p className="text-sm leading-6 text-slate-500">
                  Ask a new question below or reopen one of the saved threads on the left.
                </p>
              }
              description="This surface retrieves indexed chunks first, then only answers when the workspace context is strong enough. Citations stay attached to every grounded reply."
              eyebrow="Start a grounded thread"
              icon={<SparkIcon />}
              title={
                conversations.length > 0
                  ? `Pick a thread or ask a new question in ${access.workspace.name}.`
                  : `No saved AI threads yet in ${access.workspace.name}.`
              }
            />
          )}

          {selectedConversation?.messages.length === 0 ? (
            <Card className="border-amber-200 bg-amber-50/85 p-5 text-sm text-amber-900">
              This thread has no messages yet. Ask the first grounded question below.
            </Card>
          ) : null}

          <ConversationComposer
            conversationId={selectedConversation?.id ?? null}
            workspaceSlug={access.workspace.slug}
          />

          {!selectedConversation && conversations.length === 0 ? (
            <Card className="border-[var(--app-border)] bg-white/84 p-5 text-sm leading-6 text-slate-600">
              <div className="flex items-start gap-3">
                <span className="inline-flex size-10 items-center justify-center rounded-full border border-[var(--app-border)] bg-[var(--app-panel-muted)] text-slate-900">
                  <ChatIcon />
                </span>
                <div>
                  The first grounded answer will create a conversation automatically. After that, the thread will appear in the saved list for follow-up questions.
                </div>
              </div>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}
