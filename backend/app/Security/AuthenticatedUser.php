<?php

declare(strict_types=1);

namespace App\Security;

class AuthenticatedUser
{
    private string $userUuid;
    private string $tenantUuid;
    private string $siteUuid;
    private string $name;
    private string $email;
    private string $status;
    private array $roles;
    private array $permissions;
    private string $sessionUuid;

    public function __construct(
        string $userUuid,
        string $tenantUuid,
        string $siteUuid,
        string $name,
        string $email,
        string $status,
        array $roles,
        array $permissions,
        string $sessionUuid
    ) {
        $this->userUuid = $userUuid;
        $this->tenantUuid = $tenantUuid;
        $this->siteUuid = $siteUuid;
        $this->name = $name;
        $this->email = $email;
        $this->status = $status;
        $this->roles = $roles;
        $this->permissions = $permissions;
        $this->sessionUuid = $sessionUuid;
    }

    public function getUserUuid(): string
    {
        return $this->userUuid;
    }

    public function getTenantUuid(): string
    {
        return $this->tenantUuid;
    }

    public function getSiteUuid(): string
    {
        return $this->siteUuid;
    }

    public function getName(): string
    {
        return $this->name;
    }

    public function getEmail(): string
    {
        return $this->email;
    }

    public function getStatus(): string
    {
        return $this->status;
    }

    public function getRoles(): array
    {
        return $this->roles;
    }

    public function getPermissions(): array
    {
        return $this->permissions;
    }

    public function getSessionUuid(): string
    {
        return $this->sessionUuid;
    }

    public function isSuperAdmin(): bool
    {
        return in_array('SUPER_ADMIN', $this->roles, true);
    }

    public function hasRole(string $role): bool
    {
        return in_array($role, $this->roles, true);
    }

    /**
     * Check if user has permission. SUPER_ADMIN has full access to all permissions.
     */
    public function hasPermission(string $permission): bool
    {
        if ($this->isSuperAdmin()) {
            return true;
        }

        return in_array($permission, $this->permissions, true);
    }

    public function toArray(): array
    {
        return [
            'user_uuid' => $this->userUuid,
            'tenant_uuid' => $this->tenantUuid,
            'site_uuid' => $this->siteUuid,
            'name' => $this->name,
            'email' => $this->email,
            'status' => $this->status,
            'roles' => $this->roles,
            'permissions' => $this->permissions,
        ];
    }
}

