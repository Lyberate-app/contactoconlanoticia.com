import { apiClient } from './apiClient';
import { isMockMode } from '../config/env';
import { MOCK_USER } from '../mocks/mockData';
import type { EditorialUser, EditorialUserInput } from '../types/user';

const STORAGE_KEY = 'lyberate_editorial_users';
const MOCK_EDITORIAL_USERS: EditorialUser[] = [
	{
		user_uuid: MOCK_USER.user_uuid,
		name: MOCK_USER.name,
		email: MOCK_USER.email,
		roles: ['TENANT_ADMIN'],
		status: 'ACTIVE',
	},
	{
		user_uuid: 'usr-demo-author',
		name: 'María Fernández (demo)',
		email: 'maria.demo@example.com',
		roles: ['JOURNALIST'],
		status: 'ACTIVE',
	},
];

function readMockUsers(): EditorialUser[] {
	try {
		const stored = window.localStorage.getItem(STORAGE_KEY);
		if (stored) {
			const users = JSON.parse(stored) as EditorialUser[];
			const existingIds = new Set(users.map((user) => user.user_uuid));
			const missing = MOCK_EDITORIAL_USERS.filter((user) => !existingIds.has(user.user_uuid));
			if (missing.length) {
				const updated = [...users, ...missing];
				writeMockUsers(updated);
				return updated;
			}
			return users;
		}
	} catch {
		// Fall back to the development account when local storage is unavailable.
	}

	return MOCK_EDITORIAL_USERS;
}

function writeMockUsers(users: EditorialUser[]): void {
	window.localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
}

export const userService = {
	async list(): Promise<EditorialUser[]> {
		if (isMockMode()) return readMockUsers();
		const response = await apiClient.get<{ users: EditorialUser[] }>('/admin/users');
		return response.data?.users || [];
	},

	async create(input: EditorialUserInput): Promise<EditorialUser> {
		if (isMockMode()) {
			const users = readMockUsers();
			const user: EditorialUser = {
				user_uuid: `usr-${crypto.randomUUID()}`,
				name: input.name,
				email: input.email,
				roles: [input.role],
				status: input.status,
			};
			writeMockUsers([...users, user]);
			return user;
		}
		const response = await apiClient.post<{ user: EditorialUser }>('/admin/users', input);
		return response.data.user;
	},

	async update(uuid: string, input: EditorialUserInput): Promise<EditorialUser> {
		if (isMockMode()) {
			const users = readMockUsers().map((user) => user.user_uuid === uuid
				? { ...user, name: input.name, email: input.email, roles: [input.role], status: input.status }
				: user);
			writeMockUsers(users);
			return users.find((user) => user.user_uuid === uuid)!;
		}
		const response = await apiClient.put<{ user: EditorialUser }>(`/admin/users/${encodeURIComponent(uuid)}`, input);
		return response.data.user;
	},
};
