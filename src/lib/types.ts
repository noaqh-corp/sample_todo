import type { Session } from "better-auth/types";

export type User = {
	id: string;
	email: string;
	name: string | null;
	image: string | null;
};

export type SessionWithUser = Session & {
	user?: User;
};

