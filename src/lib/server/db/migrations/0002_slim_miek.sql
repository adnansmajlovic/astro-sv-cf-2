ALTER TABLE `user` ADD `created_at` integer DEFAULT (current_timestamp) NOT NULL;--> statement-breakpoint
ALTER TABLE `user` ADD `updated_at` integer DEFAULT (current_timestamp) NOT NULL;