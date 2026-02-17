import { Resend } from "resend";

let _resend: Resend | null = null;
const getResend = () => {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
};
const FROM = process.env.EMAIL_FROM ?? "noreply@marchen.local";

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

export const sendEmail = async (params: SendEmailParams) => {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[mailer] RESEND_API_KEY not set, skipping email send");
    return { id: "skipped", error: "RESEND_API_KEY not configured" };
  }

  const { data, error } = await getResend().emails.send({
    from: FROM,
    to: params.to,
    subject: params.subject,
    html: params.html,
  });

  if (error) {
    console.error("[mailer] Failed to send email:", error);
    return { id: null, error: error.message };
  }

  return { id: data?.id ?? null, error: null };
};

export const sendVolunteerInvite = async (invite: {
  email: string;
  name?: string | null;
  eventTitle: string;
  eventDate: string;
  location?: string | null;
}) => {
  return sendEmail({
    to: invite.email,
    subject: `【ボランティア募集】${invite.eventTitle}`,
    html: `
      <h2>${invite.eventTitle} ボランティア募集</h2>
      <p>${invite.name ? `${invite.name}様` : "ご担当者様"}</p>
      <p>下記イベントのボランティアにご参加いただけますようお願い申し上げます。</p>
      <ul>
        <li><strong>日時:</strong> ${invite.eventDate}</li>
        ${invite.location ? `<li><strong>場所:</strong> ${invite.location}</li>` : ""}
      </ul>
      <p>ご参加いただける場合は、このメールにご返信ください。</p>
      <p>よろしくお願いいたします。<br/>Marchenイベント運営チーム</p>
    `,
  });
};

export const sendReminder = async (data: {
  email: string;
  name?: string | null;
  eventTitle: string;
  eventDate: string;
  location?: string | null;
  type: "eve" | "morning";
}) => {
  const timeLabel = data.type === "eve" ? "明日" : "本日";
  return sendEmail({
    to: data.email,
    subject: `【リマインド】${timeLabel}は${data.eventTitle}です`,
    html: `
      <h2>${data.eventTitle} リマインド</h2>
      <p>${data.name ? `${data.name}様` : "ご担当者様"}</p>
      <p>${timeLabel}のイベントについてリマインドです。</p>
      <ul>
        <li><strong>日時:</strong> ${data.eventDate}</li>
        ${data.location ? `<li><strong>場所:</strong> ${data.location}</li>` : ""}
      </ul>
      <p>お気をつけてお越しください。<br/>Marchenイベント運営チーム</p>
    `,
  });
};
