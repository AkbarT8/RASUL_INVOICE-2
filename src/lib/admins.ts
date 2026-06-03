export interface AdminAccount {
  id: string
  username: string
  password: string
  label: string
  createdAt: string
}

const ADMINS_KEY = 'proforma_admin_accounts'

export function loadAdminAccounts(): AdminAccount[] {
  try {
    const raw = localStorage.getItem(ADMINS_KEY)
    if (!raw) return []
    return JSON.parse(raw) as AdminAccount[]
  } catch {
    return []
  }
}

export function saveAdminAccounts(accounts: AdminAccount[]) {
  localStorage.setItem(ADMINS_KEY, JSON.stringify(accounts))
}

export function findAdminByCredentials(
  username: string,
  password: string,
  accounts: AdminAccount[],
): AdminAccount | undefined {
  return accounts.find((a) => a.username === username && a.password === password)
}
