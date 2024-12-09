CREATE TABLE "profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"currency" varchar,
	"updated_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;

CREATE OR REPLACE FUNCTION create_user_profile()
	RETURNS TRIGGER
	LANGUAGE PLPGSQL
AS
$$
BEGIN
	INSERT INTO "profiles" (user_id) VALUES (NEW.id)
END;
$$;

DROP TRIGGER IF EXISTS create_user_profile_trigger on public.users;

CREATE TRIGGER create_user_profile_trigger
	AFTER INSERT
	ON "users"
	FOR EACH ROW
EXECUTE PROCEDURE create_user_profile();