import { isSupabaseConfigured, supabase } from '../lib/supabase'
import {
  clearCmsOverride,
  getLibrary as getLocalLibrary,
  loginUser as localLogin,
  registerUser as localRegister,
  saveLead as localSaveLead,
  toggleLibraryItem as localToggleLibrary,
} from '../utils/storage'

function mapProfile(sessionUser, profile) {
  if (!sessionUser) return null
  const companyName =
    profile?.company_name ||
    sessionUser.user_metadata?.company_name ||
    sessionUser.user_metadata?.company ||
    ''
  return {
    id: sessionUser.id,
    email: sessionUser.email,
    fullName:
      profile?.full_name ||
      sessionUser.user_metadata?.full_name ||
      sessionUser.email?.split('@')[0] ||
      '',
    company: companyName,
    companyName,
    position: profile?.position || sessionUser.user_metadata?.position || '',
    phone: profile?.phone || sessionUser.user_metadata?.phone || '',
    role: profile?.role || 'user',
  }
}

async function fetchProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, role, full_name, company_name, position, phone')
    .eq('id', userId)
    .maybeSingle()
  if (error) console.warn('[profiles]', error.message)
  return data
}

export async function getSessionUser() {
  if (!isSupabaseConfigured) return null
  const { data } = await supabase.auth.getSession()
  const u = data.session?.user
  if (!u) return null
  const profile = await fetchProfile(u.id)
  return mapProfile(u, profile)
}

export function onAuthStateChange(callback) {
  if (!isSupabaseConfigured) return () => {}
  const { data } = supabase.auth.onAuthStateChange(async (_event, session) => {
    if (!session?.user) {
      callback(null)
      return
    }
    const profile = await fetchProfile(session.user.id)
    callback(mapProfile(session.user, profile))
  })
  return () => data.subscription.unsubscribe()
}

export async function registerUser(payload) {
  if (!isSupabaseConfigured) {
    return localRegister(payload)
  }

  const { data, error } = await supabase.auth.signUp({
    email: payload.email,
    password: payload.password,
    options: {
      data: {
        full_name: payload.fullName,
        company: payload.company || '',
        position: payload.position || '',
        phone: payload.phone || '',
      },
    },
  })

  if (error) throw new Error(error.message)
  if (!data.user) throw new Error('Đăng ký không thành công.')

  // Ensure profile row (trigger may lag) — cột DB: company_name
  await supabase.from('profiles').upsert({
    id: data.user.id,
    full_name: payload.fullName,
    email: payload.email,
    company_name: payload.company || '',
    position: payload.position || '',
    phone: payload.phone || '',
  })

  return mapProfile(data.user, {
    full_name: payload.fullName,
    company_name: payload.company,
    position: payload.position,
    phone: payload.phone,
  })
}

export async function loginUser(email, password) {
  if (!isSupabaseConfigured) {
    return localLogin(email, password)
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  if (error) {
    const msg = (error.message || '').toLowerCase()
    if (msg.includes('invalid login credentials')) {
      throw new Error('Email hoặc mật khẩu không đúng.')
    }
    throw new Error(error.message || 'Email hoặc mật khẩu không đúng.')
  }
  const profile = await fetchProfile(data.user.id)
  return mapProfile(data.user, profile)
}

export async function logoutUser() {
  if (!isSupabaseConfigured) return
  await supabase.auth.signOut()
}

/** @deprecated Dùng services/documents.ts — re-export để CMS/Admin tương thích */
export { fetchDocuments, normalizeDocument as normalizeDoc } from './documents'

/** @deprecated Dùng services/infographics.ts — re-export tương thích */
export {
  fetchInfographics,
  normalizeInfographic as normalizeInfo,
  isUsableUrl,
} from './infographics'

export async function saveLead(lead) {
  // Always keep local backup
  localSaveLead(lead)

  if (!isSupabaseConfigured) return lead

  const { error } = await supabase.from('leads').insert({
    full_name: lead.fullName || '',
    email: lead.email || '',
    phone: lead.phone || '',
    position: lead.position || '',
    company: lead.company || '',
    need: lead.need || '',
    document_id: lead.documentId || '',
    document_title: lead.documentTitle || '',
    source: lead.source || '',
  })

  if (error) {
    console.warn('[leads]', error.message)
    // local already saved
  }
  return lead
}

export async function getLibraryIds(userId) {
  if (!userId) return []
  if (!isSupabaseConfigured) return getLocalLibrary(userId)

  const { data, error } = await supabase
    .from('saved_documents')
    .select('document_id')
    .eq('user_id', userId)

  if (error) {
    console.warn('[library]', error.message)
    return getLocalLibrary(userId)
  }
  return (data || []).map((r) => r.document_id)
}

export async function toggleLibraryItem(userId, docId, currentIds) {
  if (!userId) return currentIds || []

  if (!isSupabaseConfigured) {
    return localToggleLibrary(userId, docId)
  }

  const has = (currentIds || []).includes(docId)
  if (has) {
    const { error } = await supabase
      .from('saved_documents')
      .delete()
      .eq('user_id', userId)
      .eq('document_id', docId)
    if (error) throw new Error(error.message)
    return (currentIds || []).filter((id) => id !== docId)
  }

  const { error } = await supabase.from('saved_documents').insert({
    user_id: userId,
    document_id: docId,
  })
  if (error) throw new Error(error.message)
  return [...(currentIds || []), docId]
}

/** CMS: upsert full document list lên Supabase (không dùng JSON/local override) */
export async function saveDocumentsCms(docs) {
  if (!Array.isArray(docs)) throw new Error('Documents phải là mảng')
  if (!isSupabaseConfigured) {
    throw new Error('Supabase chưa được cấu hình. Không thể lưu documents.')
  }

  // Xóa override cũ (nếu còn) để không gây nhầm lẫn với nguồn dữ liệu
  clearCmsOverride('docs')

  const rows = docs.map((d) => ({
    id: d.id,
    type: d.type || 'PDF',
    category: d.category || '',
    tags: d.tags || [],
    title: d.title,
    description: d.description || '',
    thumbnail_url: d.thumbnail_url || '',
    icon: d.icon || 'file-text',
    view_preview_url: d.view_preview_url || '#',
    direct_download_url: d.direct_download_url || '#',
    year: d.year || 2026,
    featured: Boolean(d.featured),
    popular: Boolean(d.popular),
    // Số nhỏ hơn = hiện trước trong hero featured
    priority:
      d.priority === undefined || d.priority === null || d.priority === ''
        ? 100
        : Number(d.priority) || 100,
    created_at: d.created_at || new Date().toISOString().slice(0, 10),
  }))

  const { error } = await supabase.from('documents').upsert(rows)
  if (error) throw new Error(error.message)
  return { mode: 'supabase' }
}

/** CMS: upsert infographics lên Supabase (không JSON/local override) */
export async function saveInfographicsCms(items) {
  if (!Array.isArray(items)) throw new Error('Infographics phải là mảng')
  if (!isSupabaseConfigured) {
    throw new Error('Supabase chưa được cấu hình. Không thể lưu infographics.')
  }

  clearCmsOverride('info')

  const rows = items.map((i) => ({
    id: i.id,
    title: i.title,
    thumbnail_url: i.thumbnail_url || '',
    detailed_view_url: i.detailed_view_url || '',
    direct_download_url: i.direct_download_url || '#',
    tags: i.tags || [],
    category: i.category || '',
    year: i.year || 2026,
    color: i.color || '#004AAD',
  }))

  const { error } = await supabase.from('infographics').upsert(rows)
  if (error) throw new Error(error.message)
  return { mode: 'supabase' }
}

export async function resetCms(type) {
  clearCmsOverride(type)
}

export { isSupabaseConfigured }
