-- Add MeetingInvite table for token-based vendor meeting scheduling

CREATE TABLE "meeting_invites" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "responded_at" TIMESTAMP(3),
    "selected_slot_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "vendor_target_id" TEXT NOT NULL,

    CONSTRAINT "meeting_invites_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "meeting_invites_token_key" ON "meeting_invites"("token");
CREATE INDEX "meeting_invites_vendor_target_id_idx" ON "meeting_invites"("vendor_target_id");

ALTER TABLE "meeting_invites" ADD CONSTRAINT "meeting_invites_vendor_target_id_fkey" FOREIGN KEY ("vendor_target_id") REFERENCES "vendor_targets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
