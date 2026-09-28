import React, { useEffect, useState } from 'react';
import { UserPlus, Users, X, ShieldCheck, Search, RefreshCw } from 'lucide-react';
import { userService } from '../../services/userService';
import type { EditorialRole, EditorialUser, EditorialUserInput, EditorialUserStatus } from '../../types/user';

const ROLES: { value: EditorialRole; label: string }[] = [
	{ value: 'TENANT_ADMIN', label: 'Administrador' },
	{ value: 'EDITOR', label: 'Editor' },
	{ value: 'JOURNALIST', label: 'Autor / Periodista' },
	{ value: 'MODERATOR', label: 'Moderador' },
	{ value: 'SUPER_ADMIN', label: 'Superadministrador' },
];

const EMPTY_FORM: EditorialUserInput = {
	name: '',
	email: '',
	role: 'JOURNALIST',
	status: 'ACTIVE',
};

export const UsersManagementPage: React.FC = () => {
	const [users, setUsers] = useState<EditorialUser[]>([]);
	const [loading, setLoading] = useState(true);
	const [search, setSearch] = useState('');
	const [modalOpen, setModalOpen] = useState(false);
	const [editingUser, setEditingUser] = useState<EditorialUser | null>(null);
	const [form, setForm] = useState<EditorialUserInput>(EMPTY_FORM);
	const [error, setError] = useState('');
	const [saving, setSaving] = useState(false);

	const loadUsers = async () => {
		setLoading(true);
		setError('');
		try {
			setUsers(await userService.list());
		} catch (loadError) {
			setError(loadError instanceof Error ? loadError.message : 'No se pudo cargar el equipo editorial.');
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => { void loadUsers(); }, []);

	const openCreate = () => {
		setEditingUser(null);
		setForm(EMPTY_FORM);
		setModalOpen(true);
	};

	const openEdit = (user: EditorialUser) => {
		setEditingUser(user);
		setForm({
			name: user.name,
			email: user.email,
			role: user.roles[0] || 'JOURNALIST',
			status: user.status,
		});
		setModalOpen(true);
	};

	const saveUser = async (event: React.FormEvent) => {
		event.preventDefault();
		setSaving(true);
		setError('');
		try {
			if (editingUser) await userService.update(editingUser.user_uuid, form);
			else await userService.create(form);
			setModalOpen(false);
			await loadUsers();
		} catch (saveError) {
			setError(saveError instanceof Error ? saveError.message : 'No se pudo guardar el usuario.');
		} finally {
			setSaving(false);
		}
	};

	const visibleUsers = users.filter((user) =>
		`${user.name} ${user.email} ${user.roles.join(' ')}`.toLowerCase().includes(search.toLowerCase())
	);

	const roleName = (role?: string) => ROLES.find((item) => item.value === role)?.label || role || 'Sin rol';

	return (
		<section className="space-y-5 pb-10">
			<header className="flex flex-col gap-4 border-b border-stone-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
				<div>
					<div className="mb-2 flex items-center gap-2 text-xs font-semibold text-rose-800"><Users className="h-4 w-4" /> EQUIPO EDITORIAL</div>
					<h1 className="text-2xl font-bold text-stone-950">Usuarios y roles</h1>
					<p className="mt-1 text-sm text-stone-600">Administra autores y permisos de acceso al panel editorial.</p>
				</div>
				<button type="button" onClick={openCreate} className="inline-flex items-center justify-center gap-2 rounded-lg bg-stone-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-stone-700">
					<UserPlus className="h-4 w-4" /> Agregar usuario
				</button>
			</header>

			{error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>}

			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<label className="relative block w-full sm:max-w-sm">
					<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
					<input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por nombre, correo o rol" className="w-full rounded-lg border border-stone-300 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-rose-700 focus:ring-2 focus:ring-rose-700/15" />
				</label>
				<button type="button" onClick={() => void loadUsers()} className="inline-flex items-center gap-2 self-start rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-50"><RefreshCw className="h-4 w-4" /> Actualizar</button>
			</div>

			<div className="overflow-hidden rounded-lg border border-stone-200 bg-white">
				<div className="grid grid-cols-[minmax(0,1.5fr)_minmax(130px,1fr)_minmax(100px,.7fr)_auto] gap-3 border-b border-stone-200 bg-stone-50 px-4 py-3 text-[11px] font-bold uppercase text-stone-500 sm:px-5">
					<span>Usuario</span><span>Rol</span><span>Estado</span><span className="text-right">Acción</span>
				</div>
				{loading ? <p className="p-8 text-center text-sm text-stone-500">Cargando usuarios…</p> : visibleUsers.length === 0 ? (
					<p className="p-8 text-center text-sm text-stone-500">No hay usuarios que coincidan con la búsqueda.</p>
				) : visibleUsers.map((user) => (
					<div key={user.user_uuid} className="grid grid-cols-[minmax(0,1.5fr)_minmax(130px,1fr)_minmax(100px,.7fr)_auto] items-center gap-3 border-b border-stone-100 px-4 py-4 last:border-0 sm:px-5">
						<div className="min-w-0"><p className="truncate text-sm font-semibold text-stone-900">{user.name}</p><p className="truncate text-xs text-stone-500">{user.email}</p></div>
						<span className="text-xs font-medium text-stone-700">{roleName(user.roles[0])}</span>
						<span className={`w-fit rounded-full px-2 py-1 text-[11px] font-semibold ${user.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-800' : 'bg-stone-100 text-stone-600'}`}>{user.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}</span>
						<button type="button" onClick={() => openEdit(user)} className="rounded-md px-2 py-1.5 text-xs font-semibold text-rose-800 hover:bg-rose-50">Editar</button>
					</div>
				))}
			</div>

			<p className="flex items-start gap-2 text-xs leading-relaxed text-stone-500"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" /> Los permisos efectivos se validan en el servidor. En modo demostración, los cambios se guardan en este navegador.</p>

			{modalOpen && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/50 p-4" role="dialog" aria-modal="true" aria-labelledby="user-form-title">
					<form onSubmit={saveUser} className="w-full max-w-md space-y-4 rounded-xl border border-stone-200 bg-white p-5 shadow-xl sm:p-6">
						<div className="flex items-start justify-between gap-3"><div><h2 id="user-form-title" className="text-lg font-bold text-stone-950">{editingUser ? 'Editar usuario' : 'Nuevo usuario'}</h2><p className="mt-1 text-xs text-stone-500">Asigna un rol editorial y controla su acceso.</p></div><button type="button" onClick={() => setModalOpen(false)} aria-label="Cerrar" className="rounded-md p-1 text-stone-500 hover:bg-stone-100"><X className="h-5 w-5" /></button></div>
						<label className="block text-xs font-semibold text-stone-700">Nombre completo<input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2.5 text-sm font-normal outline-none focus:border-rose-700" /></label>
						<label className="block text-xs font-semibold text-stone-700">Correo electrónico<input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2.5 text-sm font-normal outline-none focus:border-rose-700" /></label>
						<label className="block text-xs font-semibold text-stone-700">Rol<select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value as EditorialRole })} className="mt-1 w-full rounded-md border border-stone-300 bg-white px-3 py-2.5 text-sm font-normal outline-none focus:border-rose-700">{ROLES.map((role) => <option key={role.value} value={role.value}>{role.label}</option>)}</select></label>
						<label className="block text-xs font-semibold text-stone-700">Acceso<select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as EditorialUserStatus })} className="mt-1 w-full rounded-md border border-stone-300 bg-white px-3 py-2.5 text-sm font-normal outline-none focus:border-rose-700"><option value="ACTIVE">Activo</option><option value="INACTIVE">Inactivo</option></select></label>
						<div className="flex justify-end gap-2 border-t border-stone-100 pt-4"><button type="button" onClick={() => setModalOpen(false)} className="rounded-md border border-stone-300 px-3 py-2 text-sm font-medium text-stone-700">Cancelar</button><button disabled={saving} className="rounded-md bg-stone-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{saving ? 'Guardando…' : 'Guardar usuario'}</button></div>
					</form>
				</div>
			)}
		</section>
	);
};
