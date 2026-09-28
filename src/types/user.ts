export type EditorialRole = 'SUPER_ADMIN' | 'TENANT_ADMIN' | 'EDITOR' | 'JOURNALIST' | 'MODERATOR';
export type EditorialUserStatus = 'ACTIVE' | 'INACTIVE';

export interface EditorialUser {
	user_uuid: string;
	name: string;
	email: string;
	roles: EditorialRole[];
	status: EditorialUserStatus;
}

export interface EditorialUserInput {
	name: string;
	email: string;
	role: EditorialRole;
	status: EditorialUserStatus;
}
