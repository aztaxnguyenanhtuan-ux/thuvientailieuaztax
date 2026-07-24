const KEYS = {
  USER: 'aztax_user',
  USERS: 'aztax_users',
  LIBRARY: 'aztax_library',
  LEADS: 'aztax_leads',
  DOCS_OVERRIDE: 'aztax_docs_cms',
  INFO_OVERRIDE: 'aztax_info_cms',
}

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function write(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

export function getCurrentUser() {
  return read(KEYS.USER, null)
}

export function setCurrentUser(user) {
  if (user) write(KEYS.USER, user)
  else localStorage.removeItem(KEYS.USER)
}

export function getRegisteredUsers() {
  return read(KEYS.USERS, [])
}

export function registerUser(user) {
  const users = getRegisteredUsers()
  if (users.some((u) => u.email.toLowerCase() === user.email.toLowerCase())) {
    throw new Error('Email công ty này đã được đăng ký.')
  }
  const record = {
    id: `user-${Date.now()}`,
    ...user,
    createdAt: new Date().toISOString(),
  }
  users.push(record)
  write(KEYS.USERS, users)
  return record
}

export function loginUser(email, password) {
  const users = getRegisteredUsers()
  const found = users.find(
    (u) =>
      u.email.toLowerCase() === email.toLowerCase() && u.password === password,
  )
  if (!found) throw new Error('Email hoặc mật khẩu không đúng.')
  const { password: _, ...safe } = found
  return safe
}

export function getLibrary(userId) {
  const all = read(KEYS.LIBRARY, {})
  return all[userId] || []
}

export function toggleLibraryItem(userId, docId) {
  const all = read(KEYS.LIBRARY, {})
  const list = all[userId] || []
  const next = list.includes(docId)
    ? list.filter((id) => id !== docId)
    : [...list, docId]
  all[userId] = next
  write(KEYS.LIBRARY, all)
  return next
}

export function saveLead(lead) {
  const leads = read(KEYS.LEADS, [])
  leads.push({ ...lead, submittedAt: new Date().toISOString() })
  write(KEYS.LEADS, leads)
  return lead
}

export function getCmsOverride(type) {
  return read(type === 'docs' ? KEYS.DOCS_OVERRIDE : KEYS.INFO_OVERRIDE, null)
}

export function setCmsOverride(type, data) {
  write(type === 'docs' ? KEYS.DOCS_OVERRIDE : KEYS.INFO_OVERRIDE, data)
}

export function clearCmsOverride(type) {
  localStorage.removeItem(type === 'docs' ? KEYS.DOCS_OVERRIDE : KEYS.INFO_OVERRIDE)
}
