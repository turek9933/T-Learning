CREATE TABLE "workspace_invitations" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"inviter_id" text NOT NULL,
	"email" text NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "workspace_members" RENAME COLUMN "joined_at" TO "created_at";--> statement-breakpoint
ALTER TABLE "workspaces" RENAME COLUMN "prize" TO "price";--> statement-breakpoint
ALTER TABLE "posts" ALTER COLUMN "workspace_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "workspace_members" ALTER COLUMN "id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "workspace_members" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "workspace_members" ALTER COLUMN "workspace_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "workspaces" ALTER COLUMN "id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "workspaces" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "workspaces" ALTER COLUMN "name" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "active_workspace_id" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "can_create_workspaces" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "is_admin" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "workspaces" ADD COLUMN "slug" text NOT NULL;--> statement-breakpoint
ALTER TABLE "workspaces" ADD COLUMN "logo" text;--> statement-breakpoint
ALTER TABLE "workspaces" ADD COLUMN "metadata" text;--> statement-breakpoint
ALTER TABLE "workspace_invitations" ADD CONSTRAINT "workspace_invitations_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_invitations" ADD CONSTRAINT "workspace_invitations_inviter_id_users_id_fk" FOREIGN KEY ("inviter_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "workspace_invitations_workspaceId_idx" ON "workspace_invitations" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "workspace_invitations_inviterId_idx" ON "workspace_invitations" USING btree ("inviter_id");--> statement-breakpoint
CREATE INDEX "workspace_members_workspaceId_idx" ON "workspace_members" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "workspace_members_userId_idx" ON "workspace_members" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "workspaces_slug_uidx" ON "workspaces" USING btree ("slug");--> statement-breakpoint
ALTER TABLE "workspace_members" DROP COLUMN "status";--> statement-breakpoint
ALTER TABLE "workspaces" DROP COLUMN "active";--> statement-breakpoint
ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_slug_unique" UNIQUE("slug");--> statement-breakpoint
DROP TYPE "public"."workspace_member_status";