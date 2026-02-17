import { getMeetingInviteByToken } from "@/app/actions/meetings";
import { InviteResponse } from "./InviteResponse";

interface Props {
  params: Promise<{ token: string }>;
}

export default async function MeetingInvitePage({ params }: Props) {
  const { token } = await params;
  const invite = await getMeetingInviteByToken(token);

  if (!invite) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <h1 className="text-2xl font-bold">招待が見つかりません</h1>
        <p className="mt-2 text-gray-500">
          このリンクは無効です。主催者にお問い合わせください。
        </p>
      </div>
    );
  }

  const isExpired = new Date() > new Date(invite.expiresAt);
  const isResponded = !!invite.respondedAt;

  if (isResponded) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <h1 className="text-2xl font-bold">回答済みです</h1>
        <p className="mt-2 text-gray-500">
          面談日時の選択は既に完了しています。ありがとうございました。
        </p>
      </div>
    );
  }

  if (isExpired) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <h1 className="text-2xl font-bold">有効期限切れ</h1>
        <p className="mt-2 text-gray-500">
          この招待リンクの有効期限が切れています。主催者にお問い合わせください。
        </p>
      </div>
    );
  }

  const event = invite.vendorTarget.event;
  const slots = invite.vendorTarget.meetingSlots;

  return (
    <div className="mx-auto max-w-lg py-8 px-4">
      <div className="mb-6">
        <p className="text-sm text-gray-500">面談候補日の選択</p>
        <h1 className="text-2xl font-bold">{event.title}</h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          主催: {event.organizer.organizationName}
        </p>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          {invite.vendorTarget.vendorName}様、ご都合の良い日時をお選びください。
        </p>
      </div>

      {slots.length === 0 ? (
        <p className="text-gray-500">候補日が設定されていません。</p>
      ) : (
        <InviteResponse token={token} slots={slots} />
      )}
    </div>
  );
}
